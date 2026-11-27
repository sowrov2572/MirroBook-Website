import {
  SendEmailOptions,
  SendEmailResult,
  SmtpConfigError,
  classifySmtpError,
  getAdminNotificationEmail,
  isSmtpConfigured,
  sanitizeLogMessage,
  sendEmailBatch,
} from '../_lib/mailer.js';
import {
  buildInquiryEmails,
  cleanText as cleanPlainText,
  formatDhakaDateTime,
} from '../_lib/emailTemplates.js';

// In-memory rate limiting map: IP -> array of timestamps
const rateLimitMap = new Map<string, number[]>();
const recentSubmissionsMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;
const DUPLICATE_COOLDOWN_MS = 45 * 1000; // 45 seconds per (inquiryType, email, service)

// Package reference data matching MirrorBook canonical catalog
const CANONICAL_PACKAGES: Record<string, { name: string; price: string; description: string }> = {
  'monthly-graphic-design': {
    name: 'Monthly Graphic Design',
    price: 'Starting From ৳25,000/month',
    description:
      'Consistent, creative, and brand-focused graphic design solutions (4 designs/day, ~120/month).',
  },
  'monthly-video-editing-reels': {
    name: 'Monthly Video Editing & Reels',
    price: 'Starting From ৳25,000/month',
    description:
      'Professional short-form video editing (2 reels/day, ~60 reels/month, sound design & captions).',
  },
  'master-pack': {
    name: 'Master Pack (Graphic Design + Video Editing)',
    price: '৳45,000/month',
    description:
      'Complete monthly graphic design and video editing bundle covering daily custom graphics and daily edited reels.',
  },
  'both-monthly-packages': {
    name: 'Master Pack (Graphic Design + Video Editing)',
    price: '৳45,000/month',
    description:
      'Complete digital agency presence covering daily custom graphics and daily edited reels.',
  },
  'custom-scope': {
    name: 'Custom Scope / Specific Creative Needs',
    price: 'Custom Monthly Scope (Starting From ৳25,000)',
    description: 'Tailored workload, dedicated turnaround time, and bespoke deliverables.',
  },
};

export function resetPackageOrderCachesForTests(): void {
  rateLimitMap.clear();
  recentSubmissionsMap.clear();
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  validTimestamps.push(now);
  rateLimitMap.set(identifier, validTimestamps);
  return true;
}

export type InquiryKind = 'general_inquiry' | 'package_inquiry';

export interface PackageOrderRequestBody {
  name: string;
  email: string;
  service?: string;
  inquiryType?: InquiryKind | string;
  type?: InquiryKind | string;
  requestType?: InquiryKind | string;
  action?: InquiryKind | string;
  message?: string;
  phone?: string;
  whatsAppNumber?: string;
  packageName?: string;
  brandName?: string;
  monthlyDesignQty?: string;
  monthlyVideoQty?: string;
  budgetRange?: string;
  additionalRequirements?: string;
  honeypot?: string;
}

export interface PackageOrderDeps {
  sendEmailFn?: (options: SendEmailOptions) => Promise<SendEmailResult | void>;
  isSmtpConfiguredFn?: () => boolean;
}

function resolveInquiryType(body: PackageOrderRequestBody): InquiryKind {
  const candidate = String(
    body.inquiryType || body.type || body.requestType || body.action || ''
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (candidate === 'general_inquiry') return 'general_inquiry';
  if (candidate === 'package_inquiry') return 'package_inquiry';

  const hasPackageFields = Boolean(
    body.packageName || body.monthlyDesignQty || body.monthlyVideoQty || body.budgetRange
  );
  return hasPackageFields ? 'package_inquiry' : 'general_inquiry';
}

export async function processPackageOrder(
  body: PackageOrderRequestBody,
  clientIp = 'unknown',
  deps: PackageOrderDeps = {}
) {
  // 1. Spam protection via honeypot field
  if (body.honeypot && body.honeypot.trim() !== '') {
    return {
      status: 200,
      data: {
        success: true,
        orderId: 'MB-PKG-BOT-REJECTED',
        message: 'Order request received successfully.',
      },
    };
  }

  // 2. Rate limiting check
  if (!checkRateLimit(clientIp)) {
    return {
      status: 429,
      data: {
        success: false,
        error: 'Too many requests. Please wait a few minutes before submitting another inquiry.',
      },
    };
  }

  // 3. Validation
  const rawName = body.name || '';
  const rawEmail = body.email || '';
  const rawPhone = body.phone || body.whatsAppNumber || '';
  const rawService = body.service || body.packageName || 'General Inquiry';
  const rawMessage = body.message || '';

  const plainName = cleanPlainText(rawName);
  const plainEmail = cleanPlainText(rawEmail).toLowerCase();
  const plainPhone = cleanPlainText(rawPhone);
  const plainService = cleanPlainText(rawService);
  const plainBrandName = cleanPlainText(body.brandName || '');
  const plainDesignQty = cleanPlainText(body.monthlyDesignQty || '');
  const plainVideoQty = cleanPlainText(body.monthlyVideoQty || '');
  const plainBudgetRange = cleanPlainText(body.budgetRange || '');
  const plainAdditionalReq = cleanPlainText(body.additionalRequirements || '');

  if (!plainName || plainName.length < 2) {
    return {
      status: 400,
      data: { success: false, error: 'Please provide a valid full name (minimum 2 characters).' },
    };
  }

  if (!plainEmail || !isValidEmail(plainEmail)) {
    return {
      status: 400,
      data: { success: false, error: 'Please provide a valid email address for confirmation.' },
    };
  }

  if (plainPhone) {
    const phoneDigits = plainPhone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 6) {
      return {
        status: 400,
        data: {
          success: false,
          error: 'Please provide a valid phone or WhatsApp number with at least 6 digits.',
        },
      };
    }
  }

  if (!plainService) {
    return {
      status: 400,
      data: { success: false, error: 'Please select a service for your inquiry.' },
    };
  }

  // 4. Resolve package details from website catalog
  let matchedPackage = CANONICAL_PACKAGES['monthly-graphic-design'];
  const lowerPkg = plainService.toLowerCase();
  if (lowerPkg.includes('master') || lowerPkg.includes('both')) {
    matchedPackage = CANONICAL_PACKAGES['master-pack'];
  } else if (lowerPkg.includes('video') || lowerPkg.includes('reel')) {
    matchedPackage = CANONICAL_PACKAGES['monthly-video-editing-reels'];
  } else if (lowerPkg.includes('custom')) {
    matchedPackage = CANONICAL_PACKAGES['custom-scope'];
  } else if (lowerPkg.includes('design')) {
    matchedPackage = CANONICAL_PACKAGES['monthly-graphic-design'];
  }

  const resolvedServiceName = plainService || matchedPackage.name;
  const resolvedPackagePrice = plainBudgetRange || matchedPackage.price;

  // 5. Generate unique Reference ID
  const orderRef = `MB-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const submissionDate = formatDhakaDateTime();

  // Build standardized plain-text message if not explicitly passed
  const assembledMessageParts: string[] = [];
  if (cleanPlainText(rawMessage)) {
    assembledMessageParts.push(cleanPlainText(rawMessage));
  } else {
    if (plainBrandName) assembledMessageParts.push(`Brand / Business: ${plainBrandName}`);
    if (plainPhone) assembledMessageParts.push(`Phone / WhatsApp: ${plainPhone}`);
    if (plainDesignQty) assembledMessageParts.push(`Design Quantity: ${plainDesignQty}`);
    if (plainVideoQty) assembledMessageParts.push(`Video / Reels Quantity: ${plainVideoQty}`);
    if (plainBudgetRange) assembledMessageParts.push(`Budget Range: ${plainBudgetRange}`);
    if (plainAdditionalReq) {
      assembledMessageParts.push(`Message / Requirements:\n${plainAdditionalReq}`);
    }
  }
  const plainMessage = assembledMessageParts.join('\n').trim();

  if (!plainMessage || plainMessage.length < 3) {
    return {
      status: 400,
      data: {
        success: false,
        error: 'Please include your project details or message before submitting.',
      },
    };
  }

  const inquiryType = resolveInquiryType(body);
  const isGeneralInquiry = inquiryType === 'general_inquiry';

  // Duplicate submission guard (45 seconds per inquiryType + email + service)
  const dedupKey = `${inquiryType}:${plainEmail}:${plainService.toLowerCase()}`;
  const now = Date.now();
  const lastSubmittedAt = recentSubmissionsMap.get(dedupKey);
  if (lastSubmittedAt && now - lastSubmittedAt < DUPLICATE_COOLDOWN_MS) {
    return {
      status: 429,
      data: {
        success: false,
        duplicate: true,
        error:
          'We already received your inquiry a moment ago. Please check your inbox or wait a minute before sending another request.',
      },
    };
  }

  // 6. Verify Gmail SMTP configuration
  const smtpReady = deps.isSmtpConfiguredFn ? deps.isSmtpConfiguredFn() : isSmtpConfigured();
  const adminEmail = getAdminNotificationEmail();

  if (!smtpReady && !deps.sendEmailFn) {
    console.error('[package-order] Gmail SMTP is not configured in environment.');
    return {
      status: 503,
      data: {
        success: false,
        errorCode: 'SMTP_NOT_CONFIGURED',
        error:
          'Email service is not configured on the server (missing GMAIL_USER or GMAIL_APP_PASSWORD). Please contact MirrorBook support.',
      },
    };
  }

  // 7. Build branded Admin Notification + Customer Confirmation emails
  const built = buildInquiryEmails({
    inquiryType,
    orderRef,
    submissionDate,
    customerName: plainName,
    customerEmail: plainEmail,
    phone: plainPhone || undefined,
    brandName: plainBrandName || undefined,
    serviceName: resolvedServiceName,
    packagePrice: resolvedPackagePrice,
    monthlyDesignQty: plainDesignQty || undefined,
    monthlyVideoQty: plainVideoQty || undefined,
    budgetRange: plainBudgetRange || undefined,
    message: plainMessage,
    additionalRequirements: plainAdditionalReq || undefined,
  });

  const adminMailOptions: SendEmailOptions = {
    to: adminEmail,
    replyTo: plainEmail,
    subject: built.adminEmail.subject,
    text: built.adminEmail.text,
    html: built.adminEmail.html,
  };

  const customerMailOptions: SendEmailOptions = {
    to: plainEmail,
    replyTo: adminEmail,
    subject: built.customerEmail.subject,
    text: built.customerEmail.text,
    html: built.customerEmail.html,
  };

  // 9. Send Admin Notification + Customer Confirmation over a single Gmail SMTP connection
  try {
    if (deps.sendEmailFn) {
      await deps.sendEmailFn(adminMailOptions);
      await deps.sendEmailFn(customerMailOptions);
    } else {
      await sendEmailBatch([
        { options: adminMailOptions },
        { options: customerMailOptions },
      ]);
    }
  } catch (mailErr: any) {
    const classified = classifySmtpError(mailErr);
    console.error('[package-order] Gmail SMTP delivery failed:', {
      inquiryType,
      errorCode: classified.errorCode,
      smtpCode: classified.smtpCode,
      responseCode: classified.responseCode,
      reason: sanitizeLogMessage(classified.message),
    });
    const status = mailErr instanceof SmtpConfigError ? 503 : classified.httpStatus;
    return {
      status,
      data: {
        success: false,
        errorCode: classified.errorCode,
        error: classified.userMessage,
      },
    };
  }

  recentSubmissionsMap.set(dedupKey, Date.now());

  // 10. Both Admin Notification and Customer Confirmation succeeded via Gmail SMTP
  return {
    status: 200,
    data: {
      success: true,
      orderId: orderRef,
      inquiryType,
      deliveryChannel: 'gmail_smtp',
      customerEmailSent: true,
      adminEmailSent: true,
      message: isGeneralInquiry
        ? 'Your inquiry has been submitted and a confirmation email has been sent to your address.'
        : 'Package request received successfully! A confirmation email has been sent to your address.',
    },
  };
}

// Default export for Vercel Serverless Function handler
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ success: false, error: 'Invalid JSON request body.' });
      }
    }

    const clientIp =
      req.headers?.['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    const result = await processPackageOrder(body || {}, clientIp);
    return res.status(result.status).json(result.data);
  } catch (err: any) {
    console.error('[package-order] API handler error:', sanitizeLogMessage(err?.message || 'unknown'));
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while processing your request. Please try again.',
    });
  }
}

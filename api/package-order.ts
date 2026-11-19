import {
  AppsScriptDispatchResult,
  MirrorBookEmailAction,
  SmtpMailOptions,
  getAdminNotificationEmail,
  isSmtpConfigured,
  normalizeAppsScriptAction,
  sendGmailSmtpMail,
  sendToAppsScriptAutomation,
  verifyInboundApiRequest,
} from './_lib/emailAutomation.js';

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
  'both-monthly-packages': {
    name: 'Both Monthly Packages (Design + Reels)',
    price: 'Starting From ৳50,000/month',
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

// HTML escape sanitization helper to prevent HTML injection in fallback SMTP emails
function sanitize(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
}

function cleanPlainText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
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

export interface PackageOrderRequestBody {
  name: string;
  email: string;
  service?: string;
  inquiryType?: MirrorBookEmailAction | string;
  type?: MirrorBookEmailAction | string;
  requestType?: MirrorBookEmailAction | string;
  action?: MirrorBookEmailAction | string;
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
  sendAppsScriptFn?: (payload: Record<string, any>) => Promise<AppsScriptDispatchResult>;
  sendSmtpFn?: (options: SmtpMailOptions) => Promise<void>;
  isSmtpConfiguredFn?: () => boolean;
}

function resolveInquiryAction(body: PackageOrderRequestBody): MirrorBookEmailAction {
  const explicitCandidate =
    body.inquiryType || body.type || body.requestType || body.action || '';
  if (explicitCandidate) {
    return normalizeAppsScriptAction(String(explicitCandidate), 'package_inquiry');
  }
  // If package-specific customization fields are present, default to package_inquiry; otherwise general_inquiry
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

  const name = sanitize(rawName);
  const email = sanitize(rawEmail).toLowerCase();
  const phone = sanitize(rawPhone);
  const brandName = sanitize(body.brandName || '');
  const monthlyDesignQty = sanitize(body.monthlyDesignQty || '');
  const monthlyVideoQty = sanitize(body.monthlyVideoQty || '');
  const budgetRange = sanitize(body.budgetRange || '');
  const additionalRequirements = sanitize(body.additionalRequirements || '');

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
  if (lowerPkg.includes('video') || lowerPkg.includes('reel')) {
    matchedPackage = CANONICAL_PACKAGES['monthly-video-editing-reels'];
  } else if (lowerPkg.includes('both')) {
    matchedPackage = CANONICAL_PACKAGES['both-monthly-packages'];
  } else if (lowerPkg.includes('custom')) {
    matchedPackage = CANONICAL_PACKAGES['custom-scope'];
  } else if (lowerPkg.includes('design')) {
    matchedPackage = CANONICAL_PACKAGES['monthly-graphic-design'];
  }

  const packageName = sanitize(plainService || matchedPackage.name);
  const packagePrice = budgetRange || matchedPackage.price;

  // 5. Generate unique Reference ID
  const orderRef = `MB-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const submissionDate =
    new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Dhaka',
      dateStyle: 'full',
      timeStyle: 'medium',
    }) + ' (BST / GMT+6)';

  // Build standardized plain-text message for Google Apps Script if not explicitly passed
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

  const inquiryType = resolveInquiryAction(body);
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

  const appsScriptPayload = {
    // Route each inquiry cleanly regardless of whether Code.gs reads type, inquiryType, requestType, or action.
    type: inquiryType,
    inquiryType,
    requestType: inquiryType,
    action: inquiryType,
    referenceId: orderRef,
    name: plainName,
    email: plainEmail,
    phone: plainPhone,
    brandName: plainBrandName,
    service: plainService,
    budgetRange: plainBudgetRange,
    message: `${plainMessage}\n\nReference ID: ${orderRef}`,
    submittedAt: submissionDate,
  };

  // 6. Primary dispatch: Google Apps Script Gmail Automation Endpoint (with x-api-key / Bearer auth + explicit redirect handling)
  const dispatchAppsScript = deps.sendAppsScriptFn || sendToAppsScriptAutomation;
  const appsScriptResult = await dispatchAppsScript(appsScriptPayload);
  if (appsScriptResult.ok) {
    recentSubmissionsMap.set(dedupKey, Date.now());
    return {
      status: 200,
      data: {
        success: true,
        orderId: orderRef,
        inquiryType,
        deliveryChannel: 'apps_script',
        customerEmailSent: true,
        message:
          appsScriptResult.message ||
          'Your inquiry has been submitted and a confirmation email has been sent to your address.',
      },
    };
  }

  // 7. Secondary fallback: Gmail SMTP (only if configured in environment or injected for tests)
  const smtpReady = deps.isSmtpConfiguredFn ? deps.isSmtpConfiguredFn() : isSmtpConfigured();
  const dispatchSmtp = deps.sendSmtpFn || sendGmailSmtpMail;
  const adminEmail = getAdminNotificationEmail();

  if (!smtpReady && !deps.sendSmtpFn) {
    console.error('[package-order] Apps Script dispatch failed and SMTP fallback is not configured:', {
      inquiryType,
      httpStatus: appsScriptResult.httpStatus ?? null,
      authRequired: Boolean(appsScriptResult.authRequired),
      authStrategy: appsScriptResult.authStrategy ?? 'none',
      diagnostics: appsScriptResult.diagnostics ?? null,
    });
    return {
      status: 502,
      data: {
        success: false,
        error:
          appsScriptResult.error ||
          'Unable to send confirmation email right now. Please verify your email address or try again.',
      },
    };
  }

  // 8. Admin Notification Email (SMTP fallback)
  const adminSubject = isGeneralInquiry
    ? 'New General Inquiry Received - MirrorBook'
    : 'New Package Order Received - MirrorBook';
  const adminBadgeLabel = isGeneralInquiry ? 'New Inquiry' : 'New Order';
  const adminHeading = isGeneralInquiry
    ? 'New General Inquiry Received'
    : 'New Package Order Received';
  const adminIntro = isGeneralInquiry
    ? 'A visitor has submitted a new project inquiry through <a href="https://mirrorbook.site" style="color: #71B913; text-decoration: none;">mirrorbook.site</a>. Review inquiry details below:'
    : 'A customer has submitted a new monthly service package request through <a href="https://mirrorbook.site" style="color: #71B913; text-decoration: none;">mirrorbook.site</a>. Review order details below:';
  const sanitizedFullMessage = sanitize(plainMessage).replace(/\n/g, '<br/>');

  const adminHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${adminSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070707; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #070707; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0E0E0E; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
          <!-- Header -->
          <tr>
            <td style="background-color: #121212; padding: 24px 30px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; display: block;">MirrorBook</span>
                    <span style="font-size: 11px; color: #71B913; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Reflecting Creativity • Admin Notification</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 6px 12px; background-color: rgba(113, 185, 19, 0.15); border: 1px solid rgba(113, 185, 19, 0.4); border-radius: 8px; font-size: 11px; font-weight: 700; color: #71B913; text-transform: uppercase;">${adminBadgeLabel}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #FFFFFF;">${adminHeading}</h2>
              <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #AAAAAA;">${adminIntro}</p>

              <!-- Summary Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #161616; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #888888; width: 35%;">Reference ID</td>
                  <td style="padding: 16px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; font-weight: 700; color: #71B913; font-family: monospace;">${orderRef}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #888888;">Submission Date &amp; Time</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #FFFFFF;">${submissionDate}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #888888;">${isGeneralInquiry ? 'Selected Service' : 'Selected Package'}</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 14px; font-weight: 700; color: #FFFFFF;">${packageName}</td>
                </tr>
                ${
                  !isGeneralInquiry || budgetRange
                    ? `<tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #888888;">Package Price / Budget</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; font-weight: 600; color: #71B913;">${packagePrice}</td>
                </tr>`
                    : ''
                }
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #888888;">Customer Full Name</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; font-weight: 600; color: #FFFFFF;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #888888;">Customer Email</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; color: #FFFFFF;"><a href="mailto:${email}" style="color: #71B913; text-decoration: none;">${email}</a></td>
                </tr>
                ${
                  phone
                    ? `<tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #888888;">Phone / WhatsApp</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; font-weight: 600; color: #FFFFFF;">
                    <a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}" style="color: #25D366; text-decoration: none;" target="_blank">${phone} (Open WhatsApp)</a>
                  </td>
                </tr>`
                    : ''
                }
                ${
                  brandName
                    ? `<tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #888888;">Business / Brand Name</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; color: #FFFFFF;">${brandName}</td>
                </tr>`
                    : ''
                }
                ${
                  monthlyDesignQty
                    ? `<tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #888888;">Design Quantity</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #CCCCCC;">${monthlyDesignQty}</td>
                </tr>`
                    : ''
                }
                ${
                  monthlyVideoQty
                    ? `<tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #888888;">Video / Reels Quantity</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #CCCCCC;">${monthlyVideoQty}</td>
                </tr>`
                    : ''
                }
                <tr>
                  <td style="padding: 14px 20px; font-size: 12px; color: #888888; vertical-align: top;">${isGeneralInquiry ? 'Project Details' : 'Additional Requirements'}</td>
                  <td style="padding: 14px 20px; font-size: 12px; color: #CCCCCC; line-height: 1.6;">${
                    additionalRequirements || sanitizedFullMessage || 'Standard onboarding and discovery scope.'
                  }</td>
                </tr>
              </table>

              <!-- Quick Action -->
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <a href="mailto:${email}?subject=${encodeURIComponent(
                      (isGeneralInquiry ? 'Re: Your MirrorBook Inquiry (' : 'Re: Your MirrorBook Package Request (') +
                        orderRef +
                        ')'
                    )}" style="display: inline-block; padding: 12px 24px; background-color: #71B913; color: #000000; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 8px; text-decoration: none;">Reply to Customer</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0A0A0A; padding: 20px 30px; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center; font-size: 11px; color: #666666;">
              MirrorBook Creative Agency • <a href="https://mirrorbook.site" style="color: #888888; text-decoration: none;">https://mirrorbook.site</a> • Dhaka, Bangladesh
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  // 9. Customer Confirmation Email (SMTP fallback)
  const customerSubject = isGeneralInquiry
    ? 'Thank You for Contacting MirrorBook'
    : 'Your Package Request Has Been Received - MirrorBook';
  const customerPlainText = `Hello ${plainName},

Thank you for contacting MirrorBook!

${isGeneralInquiry ? 'We have successfully received your inquiry.' : 'We have successfully received your package request.'}

Reference: ${orderRef}
${isGeneralInquiry ? 'Inquiry Type: ' : 'Selected Package: '}${plainService}

Our team has received your message and will contact you shortly to discuss the next steps and any details needed.

If you have any questions, simply reply to this email.

Best regards,
MirrorBook Team
Reflecting Creativity
https://mirrorbook.site/`;

  const customerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${customerSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070707; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #070707; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #0E0E0E; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
          <!-- Header -->
          <tr>
            <td style="background-color: #121212; padding: 24px 30px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <span style="font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; display: block;">MirrorBook</span>
              <span style="font-size: 11px; color: #71B913; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Reflecting Creativity</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #FFFFFF; font-weight: 600;">Hello ${name},</p>

              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #CCCCCC;">Thank you for contacting <strong>MirrorBook</strong>!</p>

              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #CCCCCC;">${
                isGeneralInquiry
                  ? 'We have successfully received your inquiry.'
                  : 'We have successfully received your package request.'
              }</p>

              <!-- Details Box -->
              <div style="background-color: #161616; border: 1px solid rgba(255, 255, 255, 0.08); border-left: 3px solid #71B913; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #71B913;">${
                  isGeneralInquiry ? 'Your Inquiry Details' : 'Your Order Details'
                }</p>
                <p style="margin: 0 0 6px 0; font-size: 13px; color: #AAAAAA;">Reference ID: <strong style="color: #FFFFFF; font-family: monospace;">${orderRef}</strong></p>
                <p style="margin: 0; font-size: 13px; color: #AAAAAA;">${
                  isGeneralInquiry ? 'Inquiry Type' : 'Selected Package'
                }: <strong style="color: #FFFFFF;">${packageName}</strong></p>
              </div>

              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #CCCCCC;">
                Our team has received your message and will contact you shortly to discuss the next steps and any details needed.
              </p>

              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #888888;">
                If you have any questions, simply reply to this email.
              </p>

              <!-- Important Disclaimer -->
              <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 11px; color: #888888; line-height: 1.5;">
                <strong>Notice:</strong> This email confirms receipt of your request only. Payment details, deliverable timelines, and project scope will be finalized directly with our team.
              </div>

              <!-- Sign-off -->
              <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 18px;">
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #FFFFFF;">Best regards,</p>
                <p style="margin: 2px 0 0 0; font-size: 13px; color: #71B913; font-weight: 600;">MirrorBook Team</p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #888888;">Reflecting Creativity</p>
                <p style="margin: 2px 0 0 0; font-size: 11px;"><a href="https://mirrorbook.site/" style="color: #71B913; text-decoration: none;">https://mirrorbook.site/</a></p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0A0A0A; padding: 18px 30px; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center; font-size: 11px; color: #555555;">
              © ${new Date().getFullYear()} MirrorBook. All rights reserved. • Dhaka, Bangladesh
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  // 10. Send Admin Notification Email via Gmail SMTP fallback
  try {
    await dispatchSmtp({
      to: adminEmail,
      replyTo: plainEmail,
      subject: adminSubject,
      text: `${adminHeading}\n\nRef: ${orderRef}\nCustomer: ${plainName}\nEmail: ${plainEmail}\nPhone: ${plainPhone || 'N/A'}\nService: ${plainService}\nDetails:\n${plainMessage}\nDate: ${submissionDate}`,
      html: adminHtml,
    });
  } catch (adminErr: any) {
    console.error('[package-order] SMTP fallback admin send failed:', adminErr?.message || 'unknown');
    return {
      status: 502,
      data: {
        success: false,
        error:
          'Unable to send confirmation email right now. Please verify your email address or try again.',
      },
    };
  }

  // 11. Send Customer Confirmation Email via Gmail SMTP fallback
  try {
    await dispatchSmtp({
      to: plainEmail,
      subject: customerSubject,
      text: customerPlainText,
      html: customerHtml,
    });
  } catch (custErr: any) {
    console.error('[package-order] SMTP fallback customer send failed:', custErr?.message || 'unknown');
    recentSubmissionsMap.set(dedupKey, Date.now());
    return {
      status: 502,
      data: {
        success: false,
        orderId: orderRef,
        customerEmailSent: false,
        error:
          'Unable to send confirmation email right now. Please verify your email address or try again.',
      },
    };
  }

  recentSubmissionsMap.set(dedupKey, Date.now());

  // 12. Both succeeded via Gmail SMTP fallback
  return {
    status: 200,
    data: {
      success: true,
      orderId: orderRef,
      inquiryType,
      deliveryChannel: 'gmail_smtp_fallback',
      customerEmailSent: true,
      message: isGeneralInquiry
        ? 'Your inquiry has been submitted and a confirmation email has been sent to your address.'
        : 'Package request received successfully! A confirmation email has been sent to your address.',
    },
  };
}

// Default export for Vercel Serverless Function handler
export default async function handler(req: any, res: any) {
  // Allow only POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  // Optional inbound API key / Bearer verification when INQUIRY_API_KEY is configured
  const authCheck = verifyInboundApiRequest(req.headers);
  if (!authCheck.authorized) {
    console.error('[package-order] Inbound API authentication failed:', {
      failedAuthCheck: authCheck.failedAuthCheck ?? 'missing_inbound_credentials',
      mode: authCheck.mode,
      inboundKeyConfigured: Boolean(process.env.INQUIRY_API_KEY?.trim()),
    });
    return res.status(401).json({
      success: false,
      error: authCheck.error || 'Unauthorized request.',
    });
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
    console.error('[package-order] API handler error:', err?.message || 'unknown');
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while processing your request. Please try again.',
    });
  }
}

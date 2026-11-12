import nodemailer from 'nodemailer';

// In-memory rate limiting map: IP -> array of timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

// Package reference data matching MirrorBook canonical catalog
const CANONICAL_PACKAGES: Record<string, { name: string; price: string; description: string }> = {
  'monthly-graphic-design': {
    name: 'Monthly Graphic Design',
    price: 'Starting From ৳25,000/month',
    description: 'Consistent, creative, and brand-focused graphic design solutions (4 designs/day, ~120/month).',
  },
  'monthly-video-editing-reels': {
    name: 'Monthly Video Editing & Reels',
    price: 'Starting From ৳25,000/month',
    description: 'Professional short-form video editing (2 reels/day, ~60 reels/month, sound design & captions).',
  },
  'both-monthly-packages': {
    name: 'Both Monthly Packages (Design + Reels)',
    price: 'Starting From ৳50,000/month',
    description: 'Complete digital agency presence covering daily custom graphics and daily edited reels.',
  },
  'custom-scope': {
    name: 'Custom Scope / Specific Creative Needs',
    price: 'Custom Monthly Scope (Starting From ৳25,000)',
    description: 'Tailored workload, dedicated turnaround time, and bespoke deliverables.',
  },
};

// HTML escape sanitization helper to prevent HTML injection in emails
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

function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }
  validTimestamps.push(now);
  rateLimitMap.set(identifier, validTimestamps);
  return true;
}

export interface PackageOrderRequestBody {
  name: string;
  email: string;
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

export async function processPackageOrder(body: PackageOrderRequestBody, clientIp = 'unknown') {
  // 1. Spam protection via honeypot field
  if (body.honeypot && body.honeypot.trim() !== '') {
    // Silently acknowledge bots without sending emails
    return {
      status: 200,
      data: {
        success: true,
        orderId: `MB-PKG-BOT-REJECTED`,
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
        error: 'Too many requests. Please wait a few minutes before submitting another order.',
      },
    };
  }

  // 3. Validation
  const rawName = body.name || '';
  const rawEmail = body.email || '';
  const rawPhone = body.phone || body.whatsAppNumber || '';
  const rawPackageName = body.packageName || 'Monthly Graphic Design';

  const name = sanitize(rawName);
  const email = sanitize(rawEmail).toLowerCase();
  const phone = sanitize(rawPhone);
  const brandName = sanitize(body.brandName || '');
  const monthlyDesignQty = sanitize(body.monthlyDesignQty || '');
  const monthlyVideoQty = sanitize(body.monthlyVideoQty || '');
  const budgetRange = sanitize(body.budgetRange || '');
  const additionalRequirements = sanitize(body.additionalRequirements || '');

  if (!name || name.length < 2) {
    return {
      status: 400,
      data: { success: false, error: 'Please provide a valid full name (minimum 2 characters).' },
    };
  }

  if (!email || !isValidEmail(email)) {
    return {
      status: 400,
      data: { success: false, error: 'Please provide a valid email address for order confirmation.' },
    };
  }

  const phoneDigits = phone.replace(/[^0-9]/g, '');
  if (!phone || phoneDigits.length < 6) {
    return {
      status: 400,
      data: { success: false, error: 'Please provide a valid phone or WhatsApp number with at least 6 digits.' },
    };
  }

  // 4. Resolve package details from website catalog
  let matchedPackage = CANONICAL_PACKAGES['monthly-graphic-design'];
  const lowerPkg = rawPackageName.toLowerCase();
  if (lowerPkg.includes('video') || lowerPkg.includes('reel')) {
    matchedPackage = CANONICAL_PACKAGES['monthly-video-editing-reels'];
  } else if (lowerPkg.includes('both')) {
    matchedPackage = CANONICAL_PACKAGES['both-monthly-packages'];
  } else if (lowerPkg.includes('custom')) {
    matchedPackage = CANONICAL_PACKAGES['custom-scope'];
  } else if (lowerPkg.includes('design')) {
    matchedPackage = CANONICAL_PACKAGES['monthly-graphic-design'];
  }

  const packageName = sanitize(rawPackageName || matchedPackage.name);
  const packagePrice = budgetRange || matchedPackage.price;

  // 5. Generate unique Order Reference ID
  const orderRef = `MB-PKG-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const submissionDate = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Dhaka',
    dateStyle: 'full',
    timeStyle: 'medium',
  }) + ' (BST / GMT+6)';

  // 6. Check environment variables
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim();
  const adminEmail = process.env.ADMIN_EMAIL?.trim() || gmailUser;

  if (!gmailUser || !gmailAppPassword) {
    console.error('[SMTP Config Error] Missing GMAIL_USER or GMAIL_APP_PASSWORD in environment variables.');
    return {
      status: 503,
      data: {
        success: false,
        error: 'Email notification service is not configured on this environment. Please ensure GMAIL_USER and GMAIL_APP_PASSWORD are set in Vercel.',
      },
    };
  }

  // 7. Initialize Nodemailer with Gmail SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for port 465
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  // 8. Admin Notification Email
  const adminSubject = 'New Package Order Received - MirrorBook';
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
                    <span style="font-size: 11px; color: #71B913; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Reflecting Creativity • Admin Order Notification</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 6px 12px; background-color: rgba(113, 185, 19, 0.15); border: 1px solid rgba(113, 185, 19, 0.4); border-radius: 8px; font-size: 11px; font-weight: 700; color: #71B913; text-transform: uppercase;">New Order</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #FFFFFF;">New Package Order Received</h2>
              <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #AAAAAA;">A customer has submitted a new monthly service package request through <a href="https://mirrorbook.site" style="color: #71B913; text-decoration: none;">mirrorbook.site</a>. Review order details below:</p>

              <!-- Order Summary Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #161616; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #888888; width: 35%;">Order Reference ID</td>
                  <td style="padding: 16px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; font-weight: 700; color: #71B913; font-family: monospace;">${orderRef}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #888888;">Submission Date & Time</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #FFFFFF;">${submissionDate}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #888888;">Selected Package</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 14px; font-weight: 700; color: #FFFFFF;">${packageName}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #888888;">Package Price / Budget</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; font-weight: 600; color: #71B913;">${packagePrice}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #888888;">Customer Full Name</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; font-weight: 600; color: #FFFFFF;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #888888;">Customer Email</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; color: #FFFFFF;"><a href="mailto:${email}" style="color: #71B913; text-decoration: none;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #888888;">Phone / WhatsApp</td>
                  <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; font-weight: 600; color: #FFFFFF;">
                    <a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}" style="color: #25D366; text-decoration: none;" target="_blank">${phone} (Open WhatsApp)</a>
                  </td>
                </tr>
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
                  <td style="padding: 14px 20px; font-size: 12px; color: #888888; vertical-align: top;">Additional Requirements</td>
                  <td style="padding: 14px 20px; font-size: 12px; color: #CCCCCC; line-height: 1.6;">${
                    additionalRequirements || 'Standard package onboarding and discovery scope.'
                  }</td>
                </tr>
              </table>

              <!-- Quick Action -->
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <a href="mailto:${email}?subject=${encodeURIComponent(
    'Re: Your MirrorBook Package Request (' + orderRef + ')'
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

  // 9. Customer Confirmation Email
  const customerSubject = 'Your Package Request Has Been Received - MirrorBook';
  const customerPlainText = `Hello ${name},

Thank you for choosing MirrorBook!

We have successfully received your package request.

Your order details:

Order Reference: ${orderRef}
Selected Package: ${packageName}

Our team has received your request and will contact you shortly to discuss the next steps, payment details, and project requirements.

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
              
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #CCCCCC;">Thank you for choosing <strong>MirrorBook</strong>!</p>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #CCCCCC;">We have successfully received your package request.</p>

              <!-- Order Details Box -->
              <div style="background-color: #161616; border: 1px solid rgba(255, 255, 255, 0.08); border-left: 3px solid #71B913; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #71B913;">Your Order Details</p>
                <p style="margin: 0 0 6px 0; font-size: 13px; color: #AAAAAA;">Order Reference: <strong style="color: #FFFFFF; font-family: monospace;">${orderRef}</strong></p>
                <p style="margin: 0; font-size: 13px; color: #AAAAAA;">Selected Package: <strong style="color: #FFFFFF;">${packageName}</strong></p>
              </div>

              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #CCCCCC;">
                Our team has received your request and will contact you shortly to discuss the next steps, payment details, and project requirements.
              </p>

              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #888888;">
                If you have any questions, simply reply to this email.
              </p>

              <!-- Important Disclaimer -->
              <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 11px; color: #888888; line-height: 1.5;">
                <strong>Notice:</strong> This email confirms receipt of an order request only. Payment details, deliverable timelines, and project scope will be finalized directly with our team.
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
              © 2026 MirrorBook. All rights reserved. • Dhaka, Bangladesh
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  // 10. Send Admin Notification Email
  try {
    await transporter.sendMail({
      from: `"MirrorBook" <${gmailUser}>`,
      to: adminEmail,
      replyTo: email,
      subject: adminSubject,
      text: `New Package Order Received\n\nOrder Ref: ${orderRef}\nCustomer: ${name}\nEmail: ${email}\nPhone: ${phone}\nPackage: ${packageName}\nPrice: ${packagePrice}\nRequirements: ${additionalRequirements || 'Standard'}\nDate: ${submissionDate}`,
      html: adminHtml,
    });
  } catch (adminErr: any) {
    console.error('[Nodemailer Admin Send Error]:', adminErr);
    return {
      status: 500,
      data: {
        success: false,
        error: 'Failed to send admin notification email. Please check SMTP configuration or try again shortly.',
      },
    };
  }

  // 11. Send Customer Confirmation Email
  let customerEmailSent = true;
  try {
    await transporter.sendMail({
      from: `"MirrorBook" <${gmailUser}>`,
      to: email,
      subject: customerSubject,
      text: customerPlainText,
      html: customerHtml,
    });
  } catch (custErr: any) {
    console.error('[Nodemailer Customer Send Error]:', custErr);
    customerEmailSent = false;
    // Note: Admin was notified, so order is not lost!
    return {
      status: 207, // Multi-Status or partial success
      data: {
        success: true,
        orderId: orderRef,
        warning: 'Order received and admin notified, but customer confirmation email encountered an issue.',
        message: 'Your order request was received by our team.',
      },
    };
  }

  // 12. Both succeeded!
  return {
    status: 200,
    data: {
      success: true,
      orderId: orderRef,
      customerEmailSent: customerEmailSent,
      message: 'Package request received successfully! A confirmation email has been sent to your address.',
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
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    const result = await processPackageOrder(body || {}, clientIp);
    return res.status(result.status).json(result.data);
  } catch (err: any) {
    console.error('[API handler error]:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while processing your package request. Please try again.',
    });
  }
}

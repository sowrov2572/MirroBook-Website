const BRAND_NAME = 'MirrorBook';
const BRAND_TAGLINE = 'Reflecting Creativity.';
const BRAND_URL = 'https://mirrorbook.site/';
const BRAND_LOGO_URL = 'https://i.ibb.co.com/DfSsjc5Z/mirorrbook-logo-png.png';
const SUPPORT_EMAIL = 'mirrorbook.site@gmail.com';
const MIRRORPOS_USER_GUIDE_URL = 'https://mirrorbook.site/mirrorpos#user-guide';
const MIRRORPOS_APP_URL = 'https://mirror-pos.vercel.app/';

export interface BuiltEmail {
  subject: string;
  text: string;
  html: string;
}

export interface EmailRow {
  label: string;
  valueHtml: string;
  valueText?: string;
}

export function escapeHtml(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
}

export function cleanText(input: unknown, maxLen = 4000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
}

export function formatDhakaDateTime(date = new Date()): string {
  return (
    date.toLocaleString('en-US', {
      timeZone: 'Asia/Dhaka',
      dateStyle: 'full',
      timeStyle: 'medium',
    }) + ' (BST / GMT+6)'
  );
}

function resolvePublicAssetUrl(url?: string): string {
  const clean = typeof url === 'string' ? url.trim() : '';
  if (!clean) return 'https://mirrorbook.site/mirror-pos-icon.png';
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  if (clean.startsWith('/')) return `https://mirrorbook.site${clean}`;
  return `https://mirrorbook.site/${clean}`;
}

function renderKeyValueTable(rows: EmailRow[]): string {
  const renderedRows = rows
    .map((row, idx) => {
      const borderStyle =
        idx < rows.length - 1 ? 'border-bottom: 1px solid rgba(255, 255, 255, 0.06);' : '';
      return `<tr>
                  <td style="padding: 13px 18px; ${borderStyle} font-size: 12px; color: #94A096; width: 36%; vertical-align: top;">${escapeHtml(row.label)}</td>
                  <td style="padding: 13px 18px; ${borderStyle} font-size: 13px; color: #F5F7F2; line-height: 1.55; vertical-align: top; word-break: break-word;">${row.valueHtml}</td>
                </tr>`;
    })
    .join('\n');

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0B0D0C; border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 12px; margin-bottom: 22px;">
                ${renderedRows}
              </table>`;
}

function renderMirrorBookLayout(params: {
  title: string;
  badgeText: string;
  subtitle?: string;
  bodyHtml: string;
  isAdmin?: boolean;
}): string {
  const year = new Date().getFullYear();
  const safeTitle = escapeHtml(params.title);
  const safeBadge = escapeHtml(params.badgeText);
  const headerSubtitle = escapeHtml(
    params.subtitle || (params.isAdmin ? `${BRAND_TAGLINE} • Admin Notification` : BRAND_TAGLINE)
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0D0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F5F7F2;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0B0D0C; padding: 28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #121614; border: 1px solid rgba(255, 255, 255, 0.10); border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #171C19; padding: 22px 26px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-right: 12px;" valign="middle">
                          <img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" width="36" height="36" style="display: block; border-radius: 8px; object-fit: contain;" />
                        </td>
                        <td valign="middle">
                          <span style="font-size: 18px; font-weight: 800; color: #F5F7F2; letter-spacing: -0.3px; display: block;">${BRAND_NAME}</span>
                          <span style="font-size: 11px; color: #B7F34A; font-weight: 600; letter-spacing: 0.4px;">${headerSubtitle}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; padding: 5px 11px; background-color: rgba(183, 243, 74, 0.14); border: 1px solid rgba(183, 243, 74, 0.35); border-radius: 6px; font-size: 10px; font-weight: 700; color: #B7F34A; text-transform: uppercase; letter-spacing: 0.6px;">${safeBadge}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 28px 26px;">
              ${params.bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0B0D0C; padding: 16px 26px; border-top: 1px solid rgba(255, 255, 255, 0.07); text-align: center; font-size: 11px; color: #707A72;">
              &copy; ${year} ${BRAND_NAME} &bull; ${BRAND_TAGLINE} &bull; <a href="${BRAND_URL}" style="color: #94A096; text-decoration: none;">mirrorbook.site</a> &bull; Dhaka, Bangladesh
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderSignOffHtml(): string {
  return `<div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 18px; margin-top: 22px;">
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #F5F7F2;">Best regards,</p>
                <p style="margin: 3px 0 0 0; font-size: 13px; font-weight: 700; color: #B7F34A;">Team ${BRAND_NAME}</p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #94A096;">${BRAND_TAGLINE} &bull; <a href="${BRAND_URL}" style="color: #B7F34A; text-decoration: none;">${BRAND_URL}</a></p>
              </div>`;
}

// ============================================================================
// WORKFLOWS A, B, C — GENERAL INQUIRY, START A PROJECT & PACKAGE INQUIRY
// ============================================================================

export interface InquiryEmailParams {
  inquiryType: 'general_inquiry' | 'package_inquiry';
  orderRef: string;
  submissionDate: string;
  customerName: string;
  customerEmail: string;
  phone?: string;
  brandName?: string;
  serviceName: string;
  packagePrice?: string;
  monthlyDesignQty?: string;
  monthlyVideoQty?: string;
  budgetRange?: string;
  message: string;
  additionalRequirements?: string;
}

export function buildInquiryEmails(params: InquiryEmailParams): {
  adminEmail: BuiltEmail;
  customerEmail: BuiltEmail;
} {
  const isGeneral = params.inquiryType === 'general_inquiry';
  const safeName = escapeHtml(params.customerName);
  const safeEmail = escapeHtml(params.customerEmail);
  const safePhone = escapeHtml(params.phone || '');
  const safeBrand = escapeHtml(params.brandName || '');
  const safeService = escapeHtml(params.serviceName);
  const safePrice = escapeHtml(params.packagePrice || '');
  const safeDesignQty = escapeHtml(params.monthlyDesignQty || '');
  const safeVideoQty = escapeHtml(params.monthlyVideoQty || '');
  const safeRef = escapeHtml(params.orderRef);
  const safeDate = escapeHtml(params.submissionDate);
  const safeDetailsHtml = escapeHtml(params.additionalRequirements || params.message).replace(/\n/g, '<br/>');

  const adminSubject = isGeneral
    ? 'New General Inquiry Received - MirrorBook'
    : 'New Package Order Received - MirrorBook';
  const adminHeading = isGeneral ? 'New General Inquiry Received' : 'New Package Order Received';
  const adminIntro = isGeneral
    ? 'A visitor submitted a new project inquiry through <a href="https://mirrorbook.site/" style="color: #B7F34A; text-decoration: none;">mirrorbook.site</a>.'
    : 'A customer submitted a new service package inquiry through <a href="https://mirrorbook.site/" style="color: #B7F34A; text-decoration: none;">mirrorbook.site</a>.';

  const adminRows: EmailRow[] = [
    {
      label: 'Reference ID',
      valueHtml: `<strong style="color: #B7F34A; font-family: monospace;">${safeRef}</strong>`,
    },
    {
      label: 'Submission Date',
      valueHtml: safeDate,
    },
    {
      label: isGeneral ? 'Selected Service' : 'Selected Package',
      valueHtml: `<strong>${safeService}</strong>`,
    },
  ];

  if (!isGeneral || params.budgetRange) {
    adminRows.push({
      label: 'Package Price / Budget',
      valueHtml: `<strong style="color: #B7F34A;">${safePrice}</strong>`,
    });
  }

  adminRows.push(
    { label: 'Customer Name', valueHtml: `<strong>${safeName}</strong>` },
    {
      label: 'Customer Email',
      valueHtml: `<a href="mailto:${safeEmail}" style="color: #B7F34A; text-decoration: none;">${safeEmail}</a>`,
    }
  );

  if (safePhone) {
    const waDigits = params.phone!.replace(/[^0-9]/g, '');
    adminRows.push({
      label: 'Phone / WhatsApp',
      valueHtml: `<a href="https://wa.me/${waDigits}" target="_blank" rel="noopener noreferrer" style="color: #4ADE80; text-decoration: none; font-weight: 600;">${safePhone} (Open WhatsApp)</a>`,
    });
  }
  if (safeBrand) {
    adminRows.push({ label: 'Business / Brand', valueHtml: safeBrand });
  }
  if (safeDesignQty) {
    adminRows.push({ label: 'Monthly Design Qty', valueHtml: safeDesignQty });
  }
  if (safeVideoQty) {
    adminRows.push({ label: 'Monthly Video / Reels Qty', valueHtml: safeVideoQty });
  }
  adminRows.push({
    label: isGeneral ? 'Project Details' : 'Requirements',
    valueHtml: safeDetailsHtml || 'Standard onboarding and discovery scope.',
  });

  const replySubject = encodeURIComponent(
    `${isGeneral ? 'Re: Your MirrorBook Inquiry' : 'Re: Your MirrorBook Package Request'} (${params.orderRef})`
  );

  const adminBodyHtml = `
    <h2 style="margin: 0 0 8px 0; font-size: 19px; font-weight: 700; color: #F5F7F2;">${escapeHtml(adminHeading)}</h2>
    <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #A1AAA2;">${adminIntro}</p>
    ${renderKeyValueTable(adminRows)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center">
          <a href="mailto:${safeEmail}?subject=${replySubject}" style="display: inline-block; padding: 12px 24px; background-color: #B7F34A; color: #0B0D0C; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 9px; text-decoration: none;">Reply to Customer</a>
        </td>
      </tr>
    </table>
  `;

  const adminText = [
    adminHeading,
    '',
    `Reference ID: ${params.orderRef}`,
    `Date: ${params.submissionDate}`,
    `${isGeneral ? 'Selected Service' : 'Selected Package'}: ${params.serviceName}`,
    !isGeneral || params.budgetRange ? `Package Price / Budget: ${params.packagePrice || 'Custom'}` : '',
    `Customer Name: ${params.customerName}`,
    `Customer Email: ${params.customerEmail}`,
    `Phone / WhatsApp: ${params.phone || 'N/A'}`,
    params.brandName ? `Business / Brand: ${params.brandName}` : '',
    params.monthlyDesignQty ? `Monthly Design Qty: ${params.monthlyDesignQty}` : '',
    params.monthlyVideoQty ? `Monthly Video / Reels Qty: ${params.monthlyVideoQty}` : '',
    '',
    'Details:',
    params.message,
  ]
    .filter(Boolean)
    .join('\n');

  // Customer confirmation email
  const customerSubject = isGeneral
    ? 'Thank You for Contacting MirrorBook'
    : 'Your Package Request Has Been Received - MirrorBook';

  const customerBodyHtml = `
    <p style="margin: 0 0 14px 0; font-size: 15px; font-weight: 600; color: #F5F7F2;">Hello ${safeName},</p>
    <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #D4DBD5;">
      Thank you for contacting <strong style="color: #F5F7F2;">${BRAND_NAME}</strong>!
    </p>
    <p style="margin: 0 0 22px 0; font-size: 14px; line-height: 1.6; color: #A1AAA2;">
      ${
        isGeneral
          ? 'We have successfully received your inquiry.'
          : 'We have successfully received your package request.'
      }
    </p>
    <div style="background-color: #0B0D0C; border: 1px solid rgba(255, 255, 255, 0.08); border-left: 3px solid #B7F34A; border-radius: 10px; padding: 16px 18px; margin-bottom: 22px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.9px; color: #B7F34A; margin-bottom: 8px;">${
        isGeneral ? 'Your Inquiry Summary' : 'Your Package Summary'
      }</div>
      <div style="font-size: 13px; color: #A1AAA2; margin-bottom: 6px;">Reference ID: <strong style="color: #F5F7F2; font-family: monospace;">${safeRef}</strong></div>
      <div style="font-size: 13px; color: #A1AAA2;">${
        isGeneral ? 'Inquiry Type' : 'Selected Package'
      }: <strong style="color: #F5F7F2;">${safeService}</strong></div>
    </div>
    <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #D4DBD5;">
      Our team has received your message and will contact you shortly to discuss the next steps and any details needed.
    </p>
    <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #94A096;">
      If you have any questions, simply reply to this email or reach us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #B7F34A; text-decoration: none;">${SUPPORT_EMAIL}</a>.
    </p>
    <div style="background-color: #171C19; border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 8px; padding: 12px 14px; font-size: 11px; color: #94A096; line-height: 1.55;">
      <strong>Notice:</strong> This email confirms receipt of your request only. Payment details, deliverable timelines, and project scope will be finalized directly with our team.
    </div>
    ${renderSignOffHtml()}
  `;

  const customerText = [
    `Hello ${params.customerName},`,
    '',
    'Thank you for contacting MirrorBook!',
    '',
    isGeneral
      ? 'We have successfully received your inquiry.'
      : 'We have successfully received your package request.',
    '',
    `Reference ID: ${params.orderRef}`,
    `${isGeneral ? 'Inquiry Type' : 'Selected Package'}: ${params.serviceName}`,
    '',
    'Our team has received your message and will contact you shortly to discuss the next steps and any details needed.',
    '',
    `If you have any questions, simply reply to this email or contact ${SUPPORT_EMAIL}.`,
    '',
    'Best regards,',
    'Team MirrorBook',
    BRAND_TAGLINE,
    BRAND_URL,
  ].join('\n');

  return {
    adminEmail: {
      subject: adminSubject,
      text: adminText,
      html: renderMirrorBookLayout({
        title: adminSubject,
        badgeText: isGeneral ? 'New Inquiry' : 'Package Order',
        bodyHtml: adminBodyHtml,
        isAdmin: true,
      }),
    },
    customerEmail: {
      subject: customerSubject,
      text: customerText,
      html: renderMirrorBookLayout({
        title: customerSubject,
        badgeText: isGeneral ? 'Inquiry Received' : 'Request Received',
        bodyHtml: customerBodyHtml,
      }),
    },
  };
}

// ============================================================================
// WORKFLOWS D & E — PAYMENT SUBMISSION (PENDING VERIFICATION ONLY — NO PAID ACCESS)
// ============================================================================

export interface PaymentSubmissionEmailParams {
  orderId: string;
  productTitle: string;
  amountDisplay: string;
  paymentMethod: string;
  trxId: string;
  senderAccount?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  verificationReason?: string;
  submittedAt?: string;
}

/**
 * Builds Admin Notification + Customer Pending Payment Receipt.
 * SECURITY: Intentionally accepts NO downloadUrl, launchUrl, or licenseKey —
 * paid access must NEVER be emailed before payment verification succeeds.
 */
export function buildPaymentSubmissionEmails(params: PaymentSubmissionEmailParams): {
  adminEmail: BuiltEmail;
  customerEmail: BuiltEmail;
} {
  const safeOrderId = escapeHtml(params.orderId);
  const safeTitle = escapeHtml(params.productTitle);
  const safeAmount = escapeHtml(params.amountDisplay);
  const safeMethod = escapeHtml(params.paymentMethod);
  const safeTrx = escapeHtml(params.trxId);
  const safeSender = escapeHtml(params.senderAccount || params.customerPhone || 'N/A');
  const safeName = escapeHtml(params.customerName);
  const safeEmail = escapeHtml(params.customerEmail);
  const safePhone = escapeHtml(params.customerPhone || '');
  const safeReason = escapeHtml(params.verificationReason || 'Pending manual Admin verification');
  const submittedAt = params.submittedAt || formatDhakaDateTime();
  const safeDate = escapeHtml(submittedAt);

  const adminSubject = `Payment Submitted (Pending Review): ${params.productTitle} [${params.orderId}] - MirrorBook`;

  const adminRows: EmailRow[] = [
    {
      label: 'Order / Request ID',
      valueHtml: `<strong style="color: #B7F34A; font-family: monospace;">${safeOrderId}</strong>`,
    },
    { label: 'Product / License', valueHtml: `<strong>${safeTitle}</strong>` },
    {
      label: 'Payment Status',
      valueHtml: `<strong style="color: #FACC15;">PENDING VERIFICATION</strong>`,
    },
    { label: 'Amount', valueHtml: `<strong style="color: #B7F34A;">${safeAmount}</strong>` },
    { label: 'Payment Method', valueHtml: safeMethod },
    {
      label: 'Transaction ID (TrxID)',
      valueHtml: `<strong style="font-family: monospace; color: #FFFFFF;">${safeTrx}</strong>`,
    },
    { label: 'Sender Account / Number', valueHtml: safeSender },
    { label: 'Customer Name', valueHtml: `<strong>${safeName}</strong>` },
    {
      label: 'Customer Email',
      valueHtml: `<a href="mailto:${safeEmail}" style="color: #B7F34A; text-decoration: none;">${safeEmail}</a>`,
    },
  ];

  if (safePhone) {
    adminRows.push({ label: 'Customer Phone', valueHtml: safePhone });
  }
  adminRows.push(
    { label: 'Verification Note', valueHtml: safeReason },
    { label: 'Submitted At', valueHtml: safeDate }
  );

  const adminBodyHtml = `
    <h2 style="margin: 0 0 8px 0; font-size: 19px; font-weight: 700; color: #F5F7F2;">New Payment Submission — Verification Required</h2>
    <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #A1AAA2;">
      A customer has submitted payment details on <a href="${BRAND_URL}" style="color: #B7F34A; text-decoration: none;">mirrorbook.site</a>. This order is strictly <strong style="color: #FACC15;">Pending</strong> and no paid access has been delivered yet. Please verify the transaction and approve it from the MirrorBook Admin Dashboard.
    </p>
    ${renderKeyValueTable(adminRows)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center">
          <a href="${BRAND_URL}" style="display: inline-block; padding: 12px 24px; background-color: #B7F34A; color: #0B0D0C; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 9px; text-decoration: none;">Review in Admin Panel</a>
        </td>
      </tr>
    </table>
  `;

  const adminText = [
    'New Payment Submission — Pending Verification',
    '',
    `Order / Request ID: ${params.orderId}`,
    `Product: ${params.productTitle}`,
    `Status: PENDING VERIFICATION (No paid access released yet)`,
    `Amount: ${params.amountDisplay}`,
    `Payment Method: ${params.paymentMethod}`,
    `Transaction ID (TrxID): ${params.trxId}`,
    `Sender Account: ${params.senderAccount || params.customerPhone || 'N/A'}`,
    `Customer Name: ${params.customerName}`,
    `Customer Email: ${params.customerEmail}`,
    params.customerPhone ? `Customer Phone: ${params.customerPhone}` : '',
    `Verification Note: ${params.verificationReason || 'Pending manual Admin verification'}`,
    `Submitted At: ${submittedAt}`,
  ]
    .filter(Boolean)
    .join('\n');

  const customerSubject = `Payment Received for Verification (${params.orderId}) - MirrorBook`;

  const customerBodyHtml = `
    <p style="margin: 0 0 14px 0; font-size: 15px; font-weight: 600; color: #F5F7F2;">Hello ${safeName},</p>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #A1AAA2;">
      We have received your payment submission for <strong style="color: #F5F7F2;">${safeTitle}</strong>. Our team is verifying your transaction now.
    </p>
    ${renderKeyValueTable([
      {
        label: 'Order / Request ID',
        valueHtml: `<strong style="color: #B7F34A; font-family: monospace;">${safeOrderId}</strong>`,
      },
      { label: 'Product', valueHtml: `<strong>${safeTitle}</strong>` },
      { label: 'Amount', valueHtml: safeAmount },
      { label: 'Payment Method', valueHtml: safeMethod },
      {
        label: 'Transaction ID',
        valueHtml: `<span style="font-family: monospace;">${safeTrx}</span>`,
      },
      {
        label: 'Status',
        valueHtml: `<strong style="color: #FACC15;">Pending Verification</strong>`,
      },
    ])}
    <div style="background-color: #171C19; border-left: 3px solid #FACC15; border-radius: 8px; padding: 14px 16px; margin-bottom: 18px;">
      <div style="font-size: 12px; font-weight: 700; color: #F5F7F2; margin-bottom: 4px;">What Happens Next?</div>
      <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #A1AAA2;">
        Once your payment is verified by MirrorBook, your access/license will be activated automatically and we will send your confirmation and access details to this email address.
      </p>
    </div>
    <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #94A096;">
      Need assistance? Reply to this email or contact <a href="mailto:${SUPPORT_EMAIL}" style="color: #B7F34A; text-decoration: none;">${SUPPORT_EMAIL}</a> with your Order ID.
    </p>
    ${renderSignOffHtml()}
  `;

  const customerText = [
    `Hello ${params.customerName},`,
    '',
    `We have received your payment submission for ${params.productTitle}.`,
    '',
    `Order / Request ID: ${params.orderId}`,
    `Product: ${params.productTitle}`,
    `Amount: ${params.amountDisplay}`,
    `Payment Method: ${params.paymentMethod}`,
    `Transaction ID: ${params.trxId}`,
    `Status: Pending Verification`,
    '',
    'What Happens Next?',
    'Once your payment is verified by MirrorBook, your access/license will be activated and we will email your verified access details to this address.',
    '',
    `Need help? Contact ${SUPPORT_EMAIL} with your Order ID.`,
    '',
    'Best regards,',
    'Team MirrorBook',
    BRAND_TAGLINE,
    BRAND_URL,
  ].join('\n');

  return {
    adminEmail: {
      subject: adminSubject,
      text: adminText,
      html: renderMirrorBookLayout({
        title: adminSubject,
        badgeText: 'Payment Review',
        bodyHtml: adminBodyHtml,
        isAdmin: true,
      }),
    },
    customerEmail: {
      subject: customerSubject,
      text: customerText,
      html: renderMirrorBookLayout({
        title: customerSubject,
        badgeText: 'Pending Review',
        bodyHtml: customerBodyHtml,
      }),
    },
  };
}

// ============================================================================
// WORKFLOW F — PAYMENT VERIFIED & PRODUCT / MIRRORPOS ACCESS DELIVERY
// ============================================================================

export interface OrderVerifiedAccessEmailParams {
  orderId: string;
  productTitle: string;
  amountDisplay: string;
  paymentMethod: string;
  trxId: string;
  customerName: string;
  customerEmail: string;
  accessUrl: string;
  licenseKey?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  isMirrorPOSLicense?: boolean;
}

/**
 * Builds Customer Payment Verified + Access Email and optional Admin Confirmation Audit Email.
 * SECURITY: Must ONLY be called after payment verification has succeeded and been persisted.
 */
export function buildOrderVerifiedAccessEmails(params: OrderVerifiedAccessEmailParams): {
  customerEmail: BuiltEmail;
  adminEmail: BuiltEmail;
} {
  const safeOrderId = escapeHtml(params.orderId);
  const safeTitle = escapeHtml(params.productTitle);
  const safeAmount = escapeHtml(params.amountDisplay);
  const safeMethod = escapeHtml(params.paymentMethod);
  const safeTrx = escapeHtml(params.trxId);
  const safeName = escapeHtml(params.customerName);
  const safeEmail = escapeHtml(params.customerEmail);
  const safeAccessUrl = escapeHtml(params.accessUrl);
  const safeLicenseKey = escapeHtml(params.licenseKey || '');
  const verifiedAt = params.verifiedAt || formatDhakaDateTime();
  const safeVerifiedAt = escapeHtml(verifiedAt);
  const safeVerifiedBy = escapeHtml(params.verifiedBy || 'MirrorBook Verification');

  const isMirrorPOS =
    Boolean(params.isMirrorPOSLicense) || params.productTitle.toLowerCase().includes('mirrorpos');

  const customerSubject = isMirrorPOS
    ? `Payment Verified — Your MirrorPOS Access Is Active (${params.orderId}) | MirrorBook`
    : `Payment Verified — Your ${params.productTitle} Access Is Ready (${params.orderId}) | MirrorBook`;

  const customerRows: EmailRow[] = [
    {
      label: 'Order / Request ID',
      valueHtml: `<strong style="color: #B7F34A; font-family: monospace;">${safeOrderId}</strong>`,
    },
    { label: 'Product', valueHtml: `<strong>${safeTitle}</strong>` },
    {
      label: 'Payment Status',
      valueHtml: `<strong style="color: #4ADE80;">VERIFIED &amp; COMPLETED</strong>`,
    },
    { label: 'Amount Paid', valueHtml: safeAmount },
    { label: 'Payment Method', valueHtml: safeMethod },
    {
      label: 'Transaction ID',
      valueHtml: `<span style="font-family: monospace;">${safeTrx}</span>`,
    },
  ];

  if (safeLicenseKey) {
    customerRows.push({
      label: 'License Key',
      valueHtml: `<strong style="color: #B7F34A; font-family: monospace; letter-spacing: 0.5px;">${safeLicenseKey}</strong>`,
    });
  }

  const ctaLabel = isMirrorPOS ? 'Open MirrorPOS License Portal' : `Access ${safeTitle}`;

  const customerBodyHtml = `
    <p style="margin: 0 0 14px 0; font-size: 15px; font-weight: 600; color: #F5F7F2;">Hello ${safeName},</p>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #D4DBD5;">
      Great news! Your payment for <strong style="color: #F5F7F2;">${safeTitle}</strong> has been verified and your access is now active.
    </p>
    ${renderKeyValueTable(customerRows)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td align="center" style="padding-bottom: 10px;">
          <a href="${safeAccessUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 13px 28px; background-color: #B7F34A; color: #0B0D0C; font-size: 13px; font-weight: 700; border-radius: 10px; text-decoration: none;">${ctaLabel}</a>
        </td>
      </tr>
      ${
        isMirrorPOS
          ? `<tr>
        <td align="center">
          <a href="${MIRRORPOS_USER_GUIDE_URL}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10px 22px; background-color: #171C19; border: 1px solid rgba(255, 255, 255, 0.14); color: #F5F7F2; font-size: 12px; font-weight: 600; border-radius: 10px; text-decoration: none;">Complete MirrorPOS User Guide</a>
        </td>
      </tr>`
          : ''
      }
    </table>
    <div style="background-color: #0B0D0C; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;">
      <div style="font-size: 11px; color: #94A096; margin-bottom: 4px;">Direct Access Link:</div>
      <a href="${safeAccessUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: #B7F34A; word-break: break-all; text-decoration: none; font-family: monospace; display: block;">${safeAccessUrl}</a>
      ${
        isMirrorPOS
          ? `<div style="font-size: 11px; color: #94A096; margin-top: 10px; margin-bottom: 4px;">MirrorPOS Web Application:</div>
      <a href="${MIRRORPOS_APP_URL}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: #B7F34A; word-break: break-all; text-decoration: none; font-family: monospace; display: block;">${MIRRORPOS_APP_URL}</a>`
          : ''
      }
    </div>
    <div style="background-color: #171C19; border-left: 3px solid #B7F34A; border-radius: 8px; padding: 14px 16px;">
      <div style="font-size: 12px; font-weight: 700; color: #F5F7F2; margin-bottom: 4px;">Need Help?</div>
      <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #A1AAA2;">
        You can also view your purchases anytime by signing in to your MirrorBook account with <strong style="color: #F5F7F2;">${safeEmail}</strong>. For support, reply to this email or contact <a href="mailto:${SUPPORT_EMAIL}" style="color: #B7F34A; text-decoration: none;">${SUPPORT_EMAIL}</a>.
      </p>
    </div>
    ${renderSignOffHtml()}
  `;

  const customerText = [
    `Hello ${params.customerName},`,
    '',
    `Your payment for ${params.productTitle} has been verified and your access is now active!`,
    '',
    `Order / Request ID: ${params.orderId}`,
    `Product: ${params.productTitle}`,
    `Status: VERIFIED & COMPLETED`,
    `Amount Paid: ${params.amountDisplay}`,
    `Payment Method: ${params.paymentMethod}`,
    `Transaction ID: ${params.trxId}`,
    params.licenseKey ? `License Key: ${params.licenseKey}` : '',
    '',
    `Access Link:`,
    params.accessUrl,
    isMirrorPOS ? `\nMirrorPOS App: ${MIRRORPOS_APP_URL}\nUser Guide: ${MIRRORPOS_USER_GUIDE_URL}` : '',
    '',
    `Support: ${SUPPORT_EMAIL}`,
    '',
    'Best regards,',
    'Team MirrorBook',
    BRAND_TAGLINE,
    BRAND_URL,
  ]
    .filter(Boolean)
    .join('\n');

  // Admin confirmation audit email (does not echo sensitive protected download link unnecessarily, keeps clean audit trail)
  const adminSubject = `Order Verified & Customer Access Sent: ${params.productTitle} [${params.orderId}] - MirrorBook`;

  const adminBodyHtml = `
    <h2 style="margin: 0 0 8px 0; font-size: 19px; font-weight: 700; color: #F5F7F2;">Payment Verified &amp; Access Delivered</h2>
    <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #A1AAA2;">
      Payment has been verified and the customer access confirmation email has been queued for delivery.
    </p>
    ${renderKeyValueTable([
      {
        label: 'Order / Request ID',
        valueHtml: `<strong style="color: #B7F34A; font-family: monospace;">${safeOrderId}</strong>`,
      },
      { label: 'Product', valueHtml: `<strong>${safeTitle}</strong>` },
      { label: 'Customer', valueHtml: `${safeName} (<a href="mailto:${safeEmail}" style="color: #B7F34A; text-decoration: none;">${safeEmail}</a>)` },
      { label: 'Amount', valueHtml: safeAmount },
      { label: 'Payment Method', valueHtml: safeMethod },
      { label: 'Transaction ID', valueHtml: `<span style="font-family: monospace;">${safeTrx}</span>` },
      ...(safeLicenseKey
        ? [{ label: 'License Key', valueHtml: `<span style="font-family: monospace;">${safeLicenseKey}</span>` }]
        : []),
      { label: 'Verified By', valueHtml: safeVerifiedBy },
      { label: 'Verified At', valueHtml: safeVerifiedAt },
    ])}
  `;

  const adminText = [
    'Payment Verified & Access Delivered',
    '',
    `Order / Request ID: ${params.orderId}`,
    `Product: ${params.productTitle}`,
    `Customer: ${params.customerName} <${params.customerEmail}>`,
    `Amount: ${params.amountDisplay}`,
    `Payment Method: ${params.paymentMethod}`,
    `Transaction ID: ${params.trxId}`,
    params.licenseKey ? `License Key: ${params.licenseKey}` : '',
    `Verified By: ${params.verifiedBy || 'MirrorBook Verification'}`,
    `Verified At: ${verifiedAt}`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    customerEmail: {
      subject: customerSubject,
      text: customerText,
      html: renderMirrorBookLayout({
        title: customerSubject,
        badgeText: 'Access Active',
        bodyHtml: customerBodyHtml,
      }),
    },
    adminEmail: {
      subject: adminSubject,
      text: adminText,
      html: renderMirrorBookLayout({
        title: adminSubject,
        badgeText: 'Order Completed',
        bodyHtml: adminBodyHtml,
        isAdmin: true,
      }),
    },
  };
}

// ============================================================================
// WORKFLOW G — MIRRORPOS FREE EMAIL ACCESS (SINGLE-USE VERIFICATION LINK)
// ============================================================================

export interface FreeSoftwareEmailParams {
  recipientName: string;
  recipientEmail?: string;
  productId?: string;
  productTitle: string;
  productDescription: string;
  iconUrl: string;
  downloadUrl: string;
  launchUrl?: string;
  referenceId: string;
  isMirrorPOS?: boolean;
}

export function buildFreeSoftwareAccessEmails(params: FreeSoftwareEmailParams): {
  customerEmail: BuiltEmail;
  adminEmail: BuiltEmail;
} {
  const safeName = escapeHtml(params.recipientName);
  const safeTitle = escapeHtml(params.productTitle);
  const safeDesc = escapeHtml(params.productDescription);
  const safeIconUrl = escapeHtml(resolvePublicAssetUrl(params.iconUrl));
  const safeDownloadUrl = escapeHtml(params.downloadUrl);
  const safeLaunchUrl = params.launchUrl ? escapeHtml(params.launchUrl) : safeDownloadUrl;
  const safeRef = escapeHtml(params.referenceId);

  const isMirrorPOS =
    Boolean(params.isMirrorPOS) ||
    params.productId === 'software-mirrorpos' ||
    params.productTitle.toLowerCase().includes('mirrorpos');

  const customerSubject = isMirrorPOS
    ? 'Verify Your MirrorPOS Free Email Access | MirrorBook'
    : `Your ${params.productTitle} Download Link - MirrorBook`;

  const customerText = (
    isMirrorPOS
      ? [
          `Hello ${params.recipientName},`,
          '',
          'Thank you for requesting Free Access to MirrorPOS by MirrorBook.',
          'To prevent unauthorized sharing, click the single-use verification link below to open MirrorPOS (valid for 24 hours).',
          '',
          'Product: MirrorPOS',
          'Developer: MirrorBook',
          'Access Type: Free Email Access (Single-Use Verification Link)',
          `Reference ID: ${params.referenceId}`,
          '',
          'Verify & Open MirrorPOS:',
          params.launchUrl || params.downloadUrl,
          '',
          'Complete User Guide:',
          MIRRORPOS_USER_GUIDE_URL,
          '',
          'Need Help? MirrorBook Support:',
          `Email: ${SUPPORT_EMAIL}`,
          `Website: ${BRAND_URL}`,
          '',
          'Best regards,',
          'Team MirrorBook',
          BRAND_TAGLINE,
        ]
      : [
          `Hello ${params.recipientName},`,
          '',
          `Thank you for choosing ${params.productTitle} by MirrorBook!`,
          '',
          `Product: ${params.productTitle} (Free Software)`,
          params.productDescription ? `Overview: ${params.productDescription}` : '',
          `Reference ID: ${params.referenceId}`,
          '',
          'Direct Download / Access Link:',
          params.downloadUrl,
          params.launchUrl && params.launchUrl !== params.downloadUrl
            ? `\nLaunch Web Application:\n${params.launchUrl}`
            : '',
          '',
          `Need help? Reply to this email or visit ${BRAND_URL}`,
          '',
          'Best regards,',
          'Team MirrorBook',
          BRAND_TAGLINE,
        ]
  )
    .filter(Boolean)
    .join('\n');

  const customerBodyHtml = `
    <p style="margin: 0 0 14px 0; font-size: 15px; font-weight: 600; color: #F5F7F2;">Hello ${safeName},</p>
    <p style="margin: 0 0 22px 0; font-size: 14px; line-height: 1.6; color: #A1AAA2;">
      ${
        isMirrorPOS
          ? `Thank you for requesting free email access to <strong style="color: #F5F7F2;">${safeTitle}</strong> by MirrorBook. Use the single-use verification button below to verify your email and launch MirrorPOS (expires in 24 hours).`
          : `Thank you for registering for <strong style="color: #F5F7F2;">${safeTitle}</strong> by MirrorBook. Your access details are ready below.`
      }
    </p>

    <!-- Product Card -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0B0D0C; border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 12px; margin-bottom: 22px;">
      <tr>
        <td style="padding: 18px 20px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td width="56" valign="top" style="padding-right: 14px;">
                <img src="${safeIconUrl}" alt="${safeTitle}" width="48" height="48" style="display: block; width: 48px; height: 48px; border-radius: 10px; background-color: #171C19; border: 1px solid rgba(255,255,255,0.09); object-fit: contain; padding: 4px;" />
              </td>
              <td valign="middle">
                <div style="font-size: 16px; font-weight: 700; color: #F5F7F2; margin-bottom: 4px;">${safeTitle}</div>
                ${safeDesc ? `<div style="font-size: 12px; color: #A1AAA2; line-height: 1.45; margin-bottom: 8px;">${safeDesc}</div>` : ''}
                <div style="font-size: 12px; color: #D4DBD5; line-height: 1.6;">
                  <div><strong style="color: #F5F7F2;">Product:</strong> ${safeTitle}</div>
                  <div><strong style="color: #F5F7F2;">Developer:</strong> ${BRAND_NAME}</div>
                  <div><strong style="color: #F5F7F2;">Access Type:</strong> ${isMirrorPOS ? 'Free Email Access (Single-Use)' : 'Free Software'}</div>
                  <div style="font-family: monospace; color: #B7F34A; margin-top: 2px;">Ref: ${safeRef}</div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTAs -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 22px;">
      <tr>
        <td align="center" style="padding-bottom: 10px;">
          <a href="${safeLaunchUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 13px 28px; background-color: #B7F34A; color: #0B0D0C; font-size: 13px; font-weight: 700; border-radius: 10px; text-decoration: none;">
            ${isMirrorPOS ? 'Verify &amp; Open MirrorPOS' : `Launch ${safeTitle}`}
          </a>
        </td>
      </tr>
      ${
        isMirrorPOS
          ? `<tr>
        <td align="center">
          <a href="${MIRRORPOS_USER_GUIDE_URL}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10px 22px; background-color: #171C19; border: 1px solid rgba(255, 255, 255, 0.14); color: #F5F7F2; font-size: 12px; font-weight: 600; border-radius: 10px; text-decoration: none;">
            Complete User Guide
          </a>
        </td>
      </tr>`
          : ''
      }
    </table>

    <!-- Links Box -->
    <div style="background-color: #0B0D0C; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 14px 16px; margin-bottom: 22px;">
      <div style="font-size: 11px; color: #94A096; margin-bottom: 4px;">${isMirrorPOS ? 'Verification Access Link (Single-Use · 24h Expiry):' : 'Launch Link:'}</div>
      <a href="${safeLaunchUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: #B7F34A; word-break: break-all; text-decoration: none; font-family: monospace; display: block; ${isMirrorPOS ? 'margin-bottom: 10px;' : ''}">${safeLaunchUrl}</a>
      ${
        isMirrorPOS
          ? `<div style="font-size: 11px; color: #94A096; margin-bottom: 4px;">User Guide:</div>
      <a href="${MIRRORPOS_USER_GUIDE_URL}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: #B7F34A; word-break: break-all; text-decoration: none; font-family: monospace; display: block;">${MIRRORPOS_USER_GUIDE_URL}</a>`
          : ''
      }
    </div>

    <!-- Support Info -->
    <div style="background-color: #171C19; border-left: 3px solid #B7F34A; border-radius: 8px; padding: 14px 16px;">
      <div style="font-size: 12px; font-weight: 700; color: #F5F7F2; margin-bottom: 6px;">MirrorBook Support</div>
      <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #A1AAA2;">
        Need help with setup, billing counter workflow, or Google account sync? Contact MirrorBook Support at <a href="mailto:${SUPPORT_EMAIL}" style="color: #B7F34A; text-decoration: none;">${SUPPORT_EMAIL}</a> or visit <a href="${MIRRORPOS_USER_GUIDE_URL}" style="color: #B7F34A; text-decoration: none;">mirrorbook.site/mirrorpos</a>.
      </p>
    </div>
    ${renderSignOffHtml()}
  `;

  // Admin notification: SECURITY — NEVER include raw free_access_token or private verification link!
  const safeRecipientEmail = escapeHtml(params.recipientEmail || '');
  const adminSubject = `New Software Access Request (${params.productTitle}) - MirrorBook`;
  const adminText = [
    `New Software Access Request — ${params.productTitle}`,
    '',
    `Product: ${params.productTitle}`,
    `Product ID: ${params.productId || 'software'}`,
    `Customer Name: ${params.recipientName}`,
    params.recipientEmail ? `Customer Email: ${params.recipientEmail}` : '',
    `Access Type: ${isMirrorPOS ? 'Free Email Access (Single-Use Verification Link)' : 'Free Software Access'}`,
    `Reference ID: ${params.referenceId}`,
    isMirrorPOS
      ? 'Verification Link: Sent privately to customer email (redacted from admin summary).'
      : `Access Link: ${params.downloadUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  const adminRows: EmailRow[] = [
    { label: 'Reference ID', valueHtml: `<strong style="color: #B7F34A; font-family: monospace;">${safeRef}</strong>` },
    { label: 'Product', valueHtml: `<strong>${safeTitle}</strong>` },
    { label: 'Customer Name', valueHtml: `<strong>${safeName}</strong>` },
    ...(safeRecipientEmail
      ? [
          {
            label: 'Customer Email',
            valueHtml: `<a href="mailto:${safeRecipientEmail}" style="color: #B7F34A; text-decoration: none;">${safeRecipientEmail}</a>`,
          },
        ]
      : []),
    {
      label: 'Access Type',
      valueHtml: isMirrorPOS ? 'Free Email Access (Single-Use 24h Link)' : 'Free Software Access',
    },
    {
      label: 'Verification Link',
      valueHtml: isMirrorPOS
        ? '<span style="color: #94A096;">Sent privately to customer email (token redacted for security).</span>'
        : `<a href="${safeDownloadUrl}" style="color: #B7F34A; text-decoration: none; word-break: break-all;">${safeDownloadUrl}</a>`,
    },
  ];

  const adminBodyHtml = `
    <h2 style="margin: 0 0 8px 0; font-size: 19px; font-weight: 700; color: #F5F7F2;">New Free Software Access Request</h2>
    <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #A1AAA2;">
      A user requested free access to <strong style="color: #F5F7F2;">${safeTitle}</strong> via <a href="${BRAND_URL}" style="color: #B7F34A; text-decoration: none;">mirrorbook.site</a>.
    </p>
    ${renderKeyValueTable(adminRows)}
  `;

  return {
    customerEmail: {
      subject: customerSubject,
      text: customerText,
      html: renderMirrorBookLayout({
        title: customerSubject,
        badgeText: isMirrorPOS ? 'Email Verification' : 'Free Access',
        bodyHtml: customerBodyHtml,
      }),
    },
    adminEmail: {
      subject: adminSubject,
      text: adminText,
      html: renderMirrorBookLayout({
        title: adminSubject,
        badgeText: 'Software Access',
        bodyHtml: adminBodyHtml,
        isAdmin: true,
      }),
    },
  };
}

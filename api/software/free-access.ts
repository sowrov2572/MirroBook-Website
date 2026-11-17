import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { verifyFirebaseIdToken, VerifiedFirebaseToken } from '../auth/session';
import {
  AdminStore,
  createFirebaseAdminStore,
  isFirebaseAdminConfigured,
} from '../_lib/firebaseAdmin';
import { checkRateLimitBucket } from '../_lib/security';

const recentDeliveries = new Map<string, number>();
const inFlightRequests = new Set<string>();
const DEDUP_WINDOW_MS = 60 * 1000; // 60 seconds cooldown per (productId, email)

function sanitizeHtml(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
}

function cleanPlainText(input: unknown, maxLen = 200): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

function isSafeHttpUrl(url: string): boolean {
  return /^https?:\/\/[^\s"'<>]+$/i.test(url.trim());
}

function resolvePublicAssetUrl(url?: string): string {
  const clean = typeof url === 'string' ? url.trim() : '';
  if (!clean) return 'https://mirrorbook.site/mirror-pos-icon.png';
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  if (clean.startsWith('/')) return `https://mirrorbook.site${clean}`;
  return `https://mirrorbook.site/${clean}`;
}

export function resetFreeSoftwareCachesForTests(): void {
  recentDeliveries.clear();
  inFlightRequests.clear();
}

export interface EmailDispatchPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface FreeSoftwareAccessInput {
  authorizationHeader?: string;
  body: Record<string, any> | string;
  clientIp?: string;
}

export interface FreeSoftwareAccessDeps {
  store?: AdminStore;
  verifyTokenFn?: (idToken: string) => Promise<VerifiedFirebaseToken>;
  sendMailFn?: (payload: EmailDispatchPayload) => Promise<void>;
}

export function buildFreeSoftwareEmailHtml(params: {
  recipientName: string;
  productTitle: string;
  productDescription: string;
  iconUrl: string;
  downloadUrl: string;
  launchUrl?: string;
  referenceId: string;
}): { subject: string; text: string; html: string } {
  const safeName = sanitizeHtml(params.recipientName);
  const safeTitle = sanitizeHtml(params.productTitle);
  const safeDesc = sanitizeHtml(params.productDescription);
  const safeIconUrl = sanitizeHtml(resolvePublicAssetUrl(params.iconUrl));
  const safeDownloadUrl = sanitizeHtml(params.downloadUrl);
  const safeLaunchUrl = params.launchUrl ? sanitizeHtml(params.launchUrl) : '';
  const safeRef = sanitizeHtml(params.referenceId);

  const subject = `Your ${params.productTitle} Download Link - MirrorBook`;

  const textLines = [
    `Hello ${params.recipientName},`,
    '',
    `Thank you for choosing ${params.productTitle} by MirrorBook!`,
    '',
    `Product: ${params.productTitle} (Free Software)`,
    params.productDescription ? `Overview: ${params.productDescription}` : '',
    `Reference ID: ${params.referenceId}`,
    '',
    `Direct Download / Access Link:`,
    params.downloadUrl,
    params.launchUrl && params.launchUrl !== params.downloadUrl
      ? `\nLaunch Web Application:\n${params.launchUrl}`
      : '',
    '',
    `Quick Installation Instructions:`,
    `1. Click the download / access link above to open ${params.productTitle}.`,
    `2. If opening on Windows 10/11 in Google Chrome or Microsoft Edge, click the Install App icon in your address bar (or follow the installer instructions if downloading a package).`,
    `3. Sign in or begin using ${params.productTitle} immediately with no payment required.`,
    '',
    `Need help? Reply to this email or visit https://mirrorbook.site/`,
    '',
    `Best regards,`,
    `MirrorBook Team`,
    `Reflecting Creativity`,
    `https://mirrorbook.site/`,
  ].filter(Boolean);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sanitizeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0D0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F5F7F2;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0B0D0C; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #121614; border: 1px solid rgba(255, 255, 255, 0.10); border-radius: 16px; overflow: hidden;">
          <!-- Brand Header -->
          <tr>
            <td style="background-color: #171C19; padding: 22px 28px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-right: 12px;" valign="middle">
                          <img src="https://i.ibb.co.com/DfSsjc5Z/mirorrbook-logo-png.png" alt="MirrorBook" width="36" height="36" style="display: block; border-radius: 8px; object-fit: contain;" />
                        </td>
                        <td valign="middle">
                          <span style="font-size: 18px; font-weight: 800; color: #F5F7F2; letter-spacing: -0.3px; display: block;">MirrorBook</span>
                          <span style="font-size: 11px; color: #B7F34A; font-weight: 600; letter-spacing: 0.4px;">Reflecting Creativity</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; padding: 4px 10px; background-color: rgba(183, 243, 74, 0.14); border: 1px solid rgba(183, 243, 74, 0.35); border-radius: 6px; font-size: 11px; font-weight: 700; color: #B7F34A; text-transform: uppercase;">Free Access</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 30px 28px;">
              <p style="margin: 0 0 14px 0; font-size: 15px; font-weight: 600; color: #F5F7F2;">Hello ${safeName},</p>
              <p style="margin: 0 0 22px 0; font-size: 14px; line-height: 1.6; color: #A1AAA2;">
                Thank you for choosing <strong style="color: #F5F7F2;">${safeTitle}</strong> by MirrorBook. Your direct download link and setup details are ready below.
              </p>

              <!-- Product Summary Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0B0D0C; border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="56" valign="top" style="padding-right: 14px;">
                          <img src="${safeIconUrl}" alt="${safeTitle}" width="48" height="48" style="display: block; width: 48px; height: 48px; border-radius: 10px; background-color: #171C19; border: 1px solid rgba(255,255,255,0.09); object-fit: contain; padding: 4px;" />
                        </td>
                        <td valign="middle">
                          <div style="font-size: 16px; font-weight: 700; color: #F5F7F2; margin-bottom: 3px;">${safeTitle}</div>
                          ${safeDesc ? `<div style="font-size: 12px; color: #A1AAA2; line-height: 1.45; margin-bottom: 6px;">${safeDesc}</div>` : ''}
                          <div style="font-size: 11px; color: #B7F34A; font-family: monospace;">FREE • Ref: ${safeRef}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Primary CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center" style="padding-bottom: 10px;">
                    <a href="${safeDownloadUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 13px 28px; background-color: #B7F34A; color: #0B0D0C; font-size: 13px; font-weight: 700; border-radius: 10px; text-decoration: none;">
                      Download ${safeTitle}
                    </a>
                  </td>
                </tr>
                ${
                  safeLaunchUrl && safeLaunchUrl !== safeDownloadUrl
                    ? `<tr>
                  <td align="center">
                    <a href="${safeLaunchUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10px 22px; background-color: #171C19; border: 1px solid rgba(255, 255, 255, 0.14); color: #F5F7F2; font-size: 12px; font-weight: 600; border-radius: 10px; text-decoration: none;">
                      Launch Web App
                    </a>
                  </td>
                </tr>`
                    : ''
                }
              </table>

              <!-- Fallback Direct Link -->
              <div style="background-color: #0B0D0C; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 14px; margin-bottom: 22px;">
                <div style="font-size: 11px; color: #A1AAA2; margin-bottom: 4px;">Direct Download / Access Link:</div>
                <a href="${safeDownloadUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: #B7F34A; word-break: break-all; text-decoration: none; font-family: monospace;">${safeDownloadUrl}</a>
              </div>

              <!-- Download & Install Instructions -->
              <div style="background-color: #171C19; border-left: 3px solid #B7F34A; border-radius: 8px; padding: 16px 18px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #F5F7F2; margin-bottom: 8px;">Download &amp; Setup Instructions</div>
                <ol style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.65; color: #A1AAA2;">
                  <li>Click <strong style="color: #F5F7F2;">Download ${safeTitle}</strong> above to access the official software release.</li>
                  <li>For desktop app installation in Chrome or Edge on Windows 10/11, click the <strong style="color: #F5F7F2;">Install App</strong> icon in the browser address bar (or run the downloaded installer).</li>
                  <li>For full setup guides and thermal printer / barcode tips, visit <a href="https://mirrorbook.site/mirrorpos" style="color: #B7F34A; text-decoration: none;">mirrorbook.site/mirrorpos</a>.</li>
                </ol>
              </div>

              <!-- Sign-off -->
              <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 18px;">
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #F5F7F2;">Best regards,</p>
                <p style="margin: 3px 0 0 0; font-size: 13px; font-weight: 700; color: #B7F34A;">MirrorBook Team</p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #A1AAA2;">Reflecting Creativity • <a href="https://mirrorbook.site/" style="color: #B7F34A; text-decoration: none;">https://mirrorbook.site/</a></p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0B0D0C; padding: 16px 28px; border-top: 1px solid rgba(255, 255, 255, 0.07); text-align: center; font-size: 11px; color: #707A72;">
              © ${new Date().getFullYear()} MirrorBook Creative Agency • Dhaka, Bangladesh
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject,
    text: textLines.join('\n'),
    html,
  };
}

async function sendViaGmailSmtp(payload: EmailDispatchPayload): Promise<void> {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!gmailUser || !gmailAppPassword) {
    throw new Error(
      'Email delivery service is not configured on the server (missing GMAIL_USER or GMAIL_APP_PASSWORD).'
    );
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  await transporter.sendMail({
    from: `"MirrorBook" <${gmailUser}>`,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
}

export async function processFreeSoftwareAccess(
  input: FreeSoftwareAccessInput,
  deps: FreeSoftwareAccessDeps = {}
): Promise<{ status: number; data: Record<string, any> }> {
  const ip = input.clientIp || 'unknown';
  if (!checkRateLimitBucket('free-software-ip', ip, 12, 10 * 60 * 1000)) {
    return {
      status: 429,
      data: {
        success: false,
        error: 'Too many requests from this network. Please wait a few minutes and try again.',
      },
    };
  }

  let payload: Record<string, any>;
  if (typeof input.body === 'string') {
    try {
      payload = JSON.parse(input.body || '{}');
    } catch {
      return { status: 400, data: { success: false, error: 'Invalid JSON request body.' } };
    }
  } else if (input.body && typeof input.body === 'object') {
    payload = input.body;
  } else {
    return { status: 400, data: { success: false, error: 'Invalid request body.' } };
  }

  // Optional cryptographic Firebase ID Token check
  let verifiedUser: VerifiedFirebaseToken | null = null;
  if (input.authorizationHeader && input.authorizationHeader.startsWith('Bearer ')) {
    const token = input.authorizationHeader.slice(7).trim();
    if (token) {
      try {
        const verifier = deps.verifyTokenFn || verifyFirebaseIdToken;
        verifiedUser = await verifier(token);
      } catch (err: unknown) {
        return {
          status: 401,
          data: {
            success: false,
            error: err instanceof Error ? err.message : 'Invalid authentication session token.',
          },
        };
      }
    }
  }

  const productId = cleanPlainText(payload.productId, 128);
  if (!productId || !/^[a-zA-Z0-9_-]+$/.test(productId)) {
    return {
      status: 400,
      data: { success: false, error: 'Valid software productId is required.' },
    };
  }

  const rawEmail = verifiedUser?.email || cleanPlainText(payload.email, 254);
  const targetEmail = rawEmail.toLowerCase().trim();
  if (!targetEmail || !isValidEmail(targetEmail)) {
    return {
      status: 400,
      data: { success: false, error: 'Please provide a valid email address.' },
    };
  }

  const recipientName =
    cleanPlainText(payload.name, 120) ||
    cleanPlainText(verifiedUser?.name || '', 120) ||
    targetEmail.split('@')[0] ||
    'Creator';

  const dedupKey = `${productId}:${targetEmail}`;
  const now = Date.now();
  const lastSentAt = recentDeliveries.get(dedupKey);
  if (lastSentAt && now - lastSentAt < DEDUP_WINDOW_MS) {
    return {
      status: 429,
      data: {
        success: false,
        duplicate: true,
        error: `Download link was already sent to ${targetEmail} just now. Please check your inbox or wait a minute before requesting again.`,
      },
    };
  }

  if (inFlightRequests.has(dedupKey)) {
    return {
      status: 409,
      data: {
        success: false,
        inFlight: true,
        error: 'A download request for this email is already being processed.',
      },
    };
  }

  inFlightRequests.add(dedupKey);

  try {
    let store: AdminStore;
    try {
      store = deps.store || createFirebaseAdminStore();
    } catch (err: unknown) {
      return {
        status: 503,
        data: {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : 'Server database configuration is not initialized.',
        },
      };
    }

    const productDoc = await store.getDoc('products', productId);
    if (!productDoc) {
      return {
        status: 404,
        data: { success: false, error: 'Requested software was not found in the catalog.' },
      };
    }

    if (productDoc.status === 'archived' || productDoc.status === 'draft') {
      return {
        status: 404,
        data: { success: false, error: 'This software product is not currently active.' },
      };
    }

    const numericPrice = Number(productDoc.price);
    const isFreeProduct =
      (!Number.isFinite(numericPrice) || numericPrice === 0) &&
      (numericPrice === 0 || productDoc.isFree === true);

    if (!isFreeProduct || (Number.isFinite(numericPrice) && numericPrice > 0)) {
      return {
        status: 403,
        data: {
          success: false,
          error: 'Paid software requires checkout verification and cannot be claimed via free access.',
        },
      };
    }

    const secretDoc = await store.getDoc('productSecrets', productId);
    const secretDownloadUrl =
      secretDoc && typeof secretDoc.protectedUrl === 'string' && isSafeHttpUrl(secretDoc.protectedUrl)
        ? secretDoc.protectedUrl.trim()
        : '';
    const publicLaunchUrl =
      typeof productDoc.launchUrl === 'string' && isSafeHttpUrl(productDoc.launchUrl)
        ? productDoc.launchUrl.trim()
        : '';

    const primaryDownloadUrl = secretDownloadUrl || publicLaunchUrl;
    if (!primaryDownloadUrl) {
      return {
        status: 503,
        data: {
          success: false,
          error:
            'Software download destination is not yet configured by the administrator. Please contact MirrorBook support.',
        },
      };
    }

    const productTitle = String(productDoc.title || 'MirrorBook Software');
    const productDescription = String(productDoc.description || '');
    const iconUrl = String(productDoc.iconUrl || productDoc.thumbnailUrl || '');
    const referenceId = `MB-SW-${Date.now().toString(36).toUpperCase()}-${crypto
      .randomBytes(2)
      .toString('hex')
      .toUpperCase()}`;

    const emailContent = buildFreeSoftwareEmailHtml({
      recipientName,
      productTitle,
      productDescription,
      iconUrl,
      downloadUrl: primaryDownloadUrl,
      launchUrl: publicLaunchUrl || undefined,
      referenceId,
    });

    const mailer = deps.sendMailFn || sendViaGmailSmtp;
    try {
      await mailer({
        to: targetEmail,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });
    } catch (mailErr: unknown) {
      const msg =
        mailErr instanceof Error ? mailErr.message : 'Unable to send software access email.';
      return {
        status: 502,
        data: {
          success: false,
          error: msg,
        },
      };
    }

    recentDeliveries.set(dedupKey, Date.now());

    // Best-effort server-side delivery log (never blocks customer confirmation)
    store
      .setDoc('softwareDeliveryLogs', referenceId, {
        id: referenceId,
        productId,
        productTitle,
        email: targetEmail,
        name: recipientName,
        uid: verifiedUser?.uid || null,
        sentAt: new Date().toISOString(),
      })
      .catch(() => {});

    return {
      status: 200,
      data: {
        success: true,
        referenceId,
        email: targetEmail,
        productTitle,
        message: `${productTitle} download link has been sent to ${targetEmail}. Please check your inbox.`,
      },
    };
  } finally {
    inFlightRequests.delete(dedupKey);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  if (!isFirebaseAdminConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'Firebase Admin SDK credentials are not configured on server.',
    });
  }

  const clientIp =
    req.headers?.['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  const authHeader =
    typeof req.headers?.authorization === 'string' ? req.headers.authorization : undefined;

  const result = await processFreeSoftwareAccess({
    authorizationHeader: authHeader,
    body: req.body ?? {},
    clientIp,
  });

  return res.status(result.status).json(result.data);
}

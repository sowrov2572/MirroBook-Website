import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { verifyFirebaseIdToken, VerifiedFirebaseToken } from '../auth/session';
import {
  AdminStore,
  createFirebaseAdminStore,
  isFirebaseAdminConfigured,
} from '../_lib/firebaseAdmin';
import { checkRateLimitBucket } from '../_lib/security';
import { getServerProductFallback, SOFTWARE_MIRRORPOS_ID } from '../_lib/courseCatalog';
import {
  issueFreeAccessToken,
  resetFreeAccessTokensForTests,
} from '../_lib/freeAccessToken';

const recentDeliveries = new Map<string, number>();
const inFlightRequests = new Set<string>();
const DEDUP_WINDOW_MS = 60 * 1000; // 60 seconds cooldown per (productId, email)

function resolveSafeOrigin(candidate?: string): string {
  const fallback = 'https://mirrorbook.site';
  const raw = (candidate || process.env.APP_URL || '').trim();
  if (!raw) return fallback;
  try {
    const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    const host = parsed.hostname.toLowerCase();
    const isTrustedHost =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === 'mirrorbook.site' ||
      host.endsWith('.mirrorbook.site') ||
      host.endsWith('.vercel.app') ||
      host.endsWith('.run.app');
    if (!isTrustedHost) return fallback;
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return fallback;
  }
}

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
  resetFreeAccessTokensForTests();
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
  requestOrigin?: string;
}

export interface FreeSoftwareAccessDeps {
  store?: AdminStore;
  verifyTokenFn?: (idToken: string) => Promise<VerifiedFirebaseToken>;
  sendMailFn?: (payload: EmailDispatchPayload) => Promise<void>;
}

export function buildFreeSoftwareEmailHtml(params: {
  recipientName: string;
  productId?: string;
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
  const safeLaunchUrl = params.launchUrl ? sanitizeHtml(params.launchUrl) : safeDownloadUrl;
  const safeRef = sanitizeHtml(params.referenceId);

  const isMirrorPOS =
    params.productId === SOFTWARE_MIRRORPOS_ID ||
    params.productTitle.toLowerCase().includes('mirrorpos');
  const userGuideUrl = 'https://mirrorbook.site/mirrorpos#user-guide';
  const supportEmail = 'mirrorbook.site@gmail.com';

  const subject = isMirrorPOS
    ? 'Verify Your MirrorPOS Free Email Access | MirrorBook'
    : `Your ${params.productTitle} Download Link - MirrorBook`;

  const textLines = isMirrorPOS
    ? [
        `Hello ${params.recipientName},`,
        '',
        `Thank you for requesting Free Access to MirrorPOS by MirrorBook.`,
        `To prevent unauthorized sharing, click the single-use verification link below to open MirrorPOS (valid for 24 hours).`,
        '',
        `Product: MirrorPOS`,
        `Developer: MirrorBook`,
        `Access Type: Free Email Access (Single-Use Verification Link)`,
        `Reference ID: ${params.referenceId}`,
        '',
        `Verify & Open MirrorPOS:`,
        safeLaunchUrl,
        '',
        `Complete User Guide:`,
        userGuideUrl,
        '',
        `Need Help? MirrorBook Support:`,
        `Email: ${supportEmail}`,
        `Website: https://mirrorbook.site/`,
        '',
        `Regards,`,
        `Team MirrorBook`,
        `Reflecting Creativity.`,
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
        `Direct Download / Access Link:`,
        params.downloadUrl,
        params.launchUrl && params.launchUrl !== params.downloadUrl
          ? `\nLaunch Web Application:\n${params.launchUrl}`
          : '',
        '',
        `Need help? Reply to this email or visit https://mirrorbook.site/`,
        '',
        `Regards,`,
        `Team MirrorBook`,
        `Reflecting Creativity.`,
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
                          <span style="font-size: 11px; color: #B7F34A; font-weight: 600; letter-spacing: 0.4px;">Reflecting Creativity.</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; padding: 4px 10px; background-color: rgba(183, 243, 74, 0.14); border: 1px solid rgba(183, 243, 74, 0.35); border-radius: 6px; font-size: 11px; font-weight: 700; color: #B7F34A; text-transform: uppercase;">${isMirrorPOS ? 'Email Verification' : 'Free Access'}</span>
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
                ${
                  isMirrorPOS
                    ? `Thank you for requesting free email access to <strong style="color: #F5F7F2;">${safeTitle}</strong> by MirrorBook. Use the single-use verification button below to verify your email and launch MirrorPOS (expires in 24 hours).`
                    : `Thank you for registering for <strong style="color: #F5F7F2;">${safeTitle}</strong> by MirrorBook. Your access details are ready below.`
                }
              </p>

              <!-- Product Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0B0D0C; border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 12px; margin-bottom: 24px;">
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
                            <div><strong style="color: #F5F7F2;">Developer:</strong> MirrorBook</div>
                            <div><strong style="color: #F5F7F2;">Access Type:</strong> ${isMirrorPOS ? 'Free Email Access (Single-Use)' : 'Free Software'}</div>
                            <div style="font-family: monospace; color: #B7F34A; margin-top: 2px;">Ref: ${safeRef}</div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Primary & Secondary CTAs -->
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
                    <a href="${userGuideUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10px 22px; background-color: #171C19; border: 1px solid rgba(255, 255, 255, 0.14); color: #F5F7F2; font-size: 12px; font-weight: 600; border-radius: 10px; text-decoration: none;">
                      Complete User Guide
                    </a>
                  </td>
                </tr>`
                    : ''
                }
              </table>

              <!-- Links Box -->
              <div style="background-color: #0B0D0C; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 14px 16px; margin-bottom: 22px;">
                <div style="font-size: 11px; color: #A1AAA2; margin-bottom: 4px;">${isMirrorPOS ? 'Verification Access Link (Single-Use · 24h Expiry):' : 'Launch Link:'}</div>
                <a href="${safeLaunchUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: #B7F34A; word-break: break-all; text-decoration: none; font-family: monospace; display: block; margin-bottom: 10px;">${safeLaunchUrl}</a>
                ${
                  isMirrorPOS
                    ? `<div style="font-size: 11px; color: #A1AAA2; margin-bottom: 4px;">User Guide:</div>
                <a href="${userGuideUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: #B7F34A; word-break: break-all; text-decoration: none; font-family: monospace; display: block;">${userGuideUrl}</a>`
                    : ''
                }
              </div>

              <!-- Support Information -->
              <div style="background-color: #171C19; border-left: 3px solid #B7F34A; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #F5F7F2; margin-bottom: 6px;">MirrorBook Support</div>
                <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #A1AAA2;">
                  Need help with setup, billing counter workflow, or Google account sync? Contact MirrorBook Support at <a href="mailto:${supportEmail}" style="color: #B7F34A; text-decoration: none;">${supportEmail}</a> or visit <a href="https://mirrorbook.site/mirrorpos#user-guide" style="color: #B7F34A; text-decoration: none;">mirrorbook.site/mirrorpos</a>.
                </p>
              </div>

              <!-- Sign-off -->
              <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 18px;">
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #F5F7F2;">Regards,</p>
                <p style="margin: 3px 0 0 0; font-size: 13px; font-weight: 700; color: #B7F34A;">Team MirrorBook</p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #A1AAA2;">Reflecting Creativity. • <a href="https://mirrorbook.site/" style="color: #B7F34A; text-decoration: none;">https://mirrorbook.site/</a></p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0B0D0C; padding: 16px 28px; border-top: 1px solid rgba(255, 255, 255, 0.07); text-align: center; font-size: 11px; color: #707A72;">
              © ${new Date().getFullYear()} MirrorBook • Reflecting Creativity. • Dhaka, Bangladesh
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

const DEFAULT_APPS_SCRIPT_INQUIRY_URL =
  'https://script.google.com/macros/s/AKfycbySGdTFlRdWFg2VM0AeO-Jw1AiPvAPF0v8d7y82KpKIJBYrXJ8OCWHIqk5Snawqo1Xl4A/exec';

interface FreeSoftwareMailPayload extends EmailDispatchPayload {
  recipientName: string;
  productId: string;
  productTitle: string;
  launchUrl: string;
  referenceId: string;
}

async function sendViaGmailSmtp(payload: EmailDispatchPayload): Promise<void> {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!gmailUser || !gmailAppPassword) {
    throw new Error(
      'SMTP credentials are not configured (missing GMAIL_USER or GMAIL_APP_PASSWORD).'
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

async function sendViaAppsScriptAutomation(payload: FreeSoftwareMailPayload): Promise<void> {
  const targetUrl =
    process.env.APPS_SCRIPT_INQUIRY_URL?.trim() || DEFAULT_APPS_SCRIPT_INQUIRY_URL;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const resp = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'software-access',
        name: payload.recipientName,
        email: payload.to,
        service: `${payload.productTitle} (Lifetime Access)`,
        subject: payload.subject,
        message: payload.text,
        html: payload.html,
        htmlBody: payload.html,
        productId: payload.productId,
        productTitle: payload.productTitle,
        launchUrl: payload.launchUrl,
        userGuideUrl: 'https://mirrorbook.site/mirrorpos#user-guide',
        referenceId: payload.referenceId,
      }),
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await resp.text();
    let parsed: Record<string, any> | null = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = null;
    }

    if (!resp.ok) {
      throw new Error(
        parsed?.error ||
          parsed?.message ||
          `Email automation endpoint returned HTTP ${resp.status}.`
      );
    }

    if (parsed && (parsed.success === false || parsed.status === 'error' || parsed.result === 'error')) {
      throw new Error(
        parsed.error ||
          parsed.message ||
          'The email automation service could not send your access confirmation email.'
      );
    }

    const lowerText = rawText.toLowerCase();
    if (
      !parsed &&
      (lowerText.includes('script function not found') ||
        lowerText.includes('authorization is required') ||
        lowerText.includes('typeerror:') ||
        lowerText.includes('referenceerror:') ||
        lowerText.includes('exception:'))
    ) {
      throw new Error('The email automation service reported a script execution error.');
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      throw new Error('The email automation service timed out. Please try again.');
    }
    throw err instanceof Error
      ? err
      : new Error('Unable to connect to the email automation endpoint.');
  }
}

async function dispatchFreeSoftwareEmail(payload: FreeSoftwareMailPayload): Promise<void> {
  const hasSmtp = Boolean(process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim());

  if (hasSmtp) {
    try {
      await sendViaGmailSmtp(payload);
      return;
    } catch (smtpErr: unknown) {
      // Fallback to MirrorBook Apps Script Gmail automation if SMTP transiently fails
      try {
        await sendViaAppsScriptAutomation(payload);
        return;
      } catch (scriptErr: unknown) {
        const smtpMsg = smtpErr instanceof Error ? smtpErr.message : 'SMTP dispatch failed';
        const scriptMsg = scriptErr instanceof Error ? scriptErr.message : 'Automation dispatch failed';
        throw new Error(`Unable to send confirmation email (${smtpMsg}; ${scriptMsg}).`);
      }
    }
  }

  await sendViaAppsScriptAutomation(payload);
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

  // Optional cryptographic Firebase ID Token check (non-blocking if user submits email directly)
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

  const submittedEmail = cleanPlainText(payload.email, 254);
  const rawEmail = submittedEmail || verifiedUser?.email || '';
  const targetEmail = rawEmail.toLowerCase().trim();
  if (!targetEmail || !isValidEmail(targetEmail)) {
    return {
      status: 400,
      data: { success: false, error: 'Please provide a valid email address.' },
    };
  }

  const recipientName =
    cleanPlainText(payload.name || payload.fullName, 120) ||
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
        error: `Access confirmation was already sent to ${targetEmail} just now. Please check your inbox or wait a minute before requesting again.`,
      },
    };
  }

  if (inFlightRequests.has(dedupKey)) {
    return {
      status: 409,
      data: {
        success: false,
        inFlight: true,
        error: 'An access request for this email is already being processed.',
      },
    };
  }

  inFlightRequests.add(dedupKey);

  try {
    let store: AdminStore | null = deps.store || null;
    if (!store && isFirebaseAdminConfigured()) {
      try {
        store = createFirebaseAdminStore();
      } catch {
        store = null;
      }
    }

    const canonicalFallback = getServerProductFallback(productId);
    let firestoreProduct: Record<string, any> | null = null;
    if (store) {
      firestoreProduct = await store.getDoc('products', productId).catch(() => null);
    }

    const productDoc =
      firestoreProduct ||
      (canonicalFallback && canonicalFallback.type === 'Software' ? canonicalFallback : null);

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

    const secretDoc = store
      ? await store.getDoc('productSecrets', productId).catch(() => null)
      : null;
    const secretDownloadUrl =
      secretDoc && typeof secretDoc.protectedUrl === 'string' && isSafeHttpUrl(secretDoc.protectedUrl)
        ? secretDoc.protectedUrl.trim()
        : '';
    const publicLaunchUrl =
      typeof productDoc.launchUrl === 'string' && isSafeHttpUrl(productDoc.launchUrl)
        ? productDoc.launchUrl.trim()
        : canonicalFallback?.launchUrl && isSafeHttpUrl(canonicalFallback.launchUrl)
        ? canonicalFallback.launchUrl.trim()
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

    const productTitle = cleanPlainText(
      productDoc.title || canonicalFallback?.title || 'MirrorPOS',
      140
    );
    const productDescription = cleanPlainText(
      productDoc.description || canonicalFallback?.description || '',
      400
    );
    const iconUrl =
      typeof productDoc.iconUrl === 'string' && productDoc.iconUrl.trim()
        ? productDoc.iconUrl.trim()
        : canonicalFallback?.iconUrl || '/mirror-pos-icon.png';
    const referenceId = `MB-SW-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const isMirrorPOSProduct =
      productId === SOFTWARE_MIRRORPOS_ID ||
      productTitle.toLowerCase().includes('mirrorpos');

    let deliveredActionUrl = publicLaunchUrl || primaryDownloadUrl;
    let issuedTokenId = referenceId;
    let tokenExpiresAtIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    if (isMirrorPOSProduct) {
      const origin = resolveSafeOrigin(input.requestOrigin);
      const issued = issueFreeAccessToken({
        productId,
        email: targetEmail,
        name: recipientName,
      });
      issuedTokenId = issued.tokenId;
      tokenExpiresAtIso = issued.expiresAtIso;
      // Only send single-use signed verification link in Free Access email (never expose raw MirrorPOS URL directly)
      deliveredActionUrl = `${origin}/mirrorpos?free_access_token=${encodeURIComponent(issued.token)}`;
    }

    const emailContent = buildFreeSoftwareEmailHtml({
      recipientName,
      productId,
      productTitle,
      productDescription,
      iconUrl,
      downloadUrl: deliveredActionUrl,
      launchUrl: deliveredActionUrl,
      referenceId: issuedTokenId,
    });

    try {
      if (deps.sendMailFn) {
        await deps.sendMailFn({
          to: targetEmail,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
        });
      } else {
        await dispatchFreeSoftwareEmail({
          to: targetEmail,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
          recipientName,
          productId,
          productTitle,
          launchUrl: deliveredActionUrl,
          referenceId: issuedTokenId,
        });
      }
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

    const sentAtIso = new Date().toISOString();

    // Best-effort server-side registration & delivery log when Admin SDK is available
    if (store) {
      if (isMirrorPOSProduct) {
        store
          .setDoc('mirrorpos_free_access', issuedTokenId, {
            id: issuedTokenId,
            userId: verifiedUser?.uid || null,
            customerName: recipientName,
            gmail: targetEmail,
            accessType: 'FREE_EMAIL',
            tokenId: issuedTokenId,
            tokenExpiresAt: tokenExpiresAtIso,
            used: false,
            requestedAt: sentAtIso,
            usedAt: null,
          })
          .catch(() => {});
      }

      store
        .setDoc('softwareAccessRequests', issuedTokenId, {
          id: issuedTokenId,
          productId,
          productTitle,
          accessType: isMirrorPOSProduct ? 'FREE_EMAIL' : 'Lifetime Access',
          fullName: recipientName,
          email: targetEmail,
          uid: verifiedUser?.uid || null,
          emailDelivered: true,
          registeredAt: sentAtIso,
        })
        .catch(() => {});

      store
        .setDoc('softwareDeliveryLogs', issuedTokenId, {
          id: issuedTokenId,
          productId,
          productTitle,
          email: targetEmail,
          name: recipientName,
          uid: verifiedUser?.uid || null,
          sentAt: sentAtIso,
        })
        .catch(() => {});
    }

    return {
      status: 200,
      data: {
        success: true,
        referenceId: issuedTokenId,
        tokenId: issuedTokenId,
        tokenExpiresAt: tokenExpiresAtIso,
        email: targetEmail,
        productTitle,
        accessType: isMirrorPOSProduct ? 'FREE_EMAIL' : 'LIFETIME',
        // Do NOT expose raw direct MirrorPOS launchUrl in free-access response
        ...(isMirrorPOSProduct ? {} : { launchUrl: deliveredActionUrl }),
        message: isMirrorPOSProduct
          ? `A single-use verification link has been sent to ${targetEmail}. Open the link in your email to access MirrorPOS.`
          : `${productTitle} access details have been sent to ${targetEmail}.`,
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

  const clientIp =
    req.headers?.['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  const authHeader =
    typeof req.headers?.authorization === 'string' ? req.headers.authorization : undefined;

  const protoHeader = req.headers?.['x-forwarded-proto']?.toString().split(',')[0].trim() || 'https';
  const hostHeader = req.headers?.['x-forwarded-host']?.toString().split(',')[0].trim() || req.headers?.host || '';
  const originHeader = typeof req.headers?.origin === 'string' ? req.headers.origin : '';
  const requestOrigin = originHeader || (hostHeader ? `${protoHeader}://${hostHeader}` : undefined);

  const result = await processFreeSoftwareAccess({
    authorizationHeader: authHeader,
    body: req.body ?? {},
    clientIp,
    requestOrigin,
  });

  return res.status(result.status).json(result.data);
}

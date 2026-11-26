import crypto from 'crypto';
import { verifyFirebaseIdToken, VerifiedFirebaseToken } from '../auth/session.js';
import {
  SmtpConfigError,
  classifySmtpError,
  getAdminNotificationEmail,
  isSmtpConfigured,
  sanitizeLogMessage,
  sendEmailBatch,
} from '../../_lib/mailer.js';
import {
  AdminStore,
  createFirebaseAdminStore,
  isFirebaseAdminConfigured,
} from '../../_lib/firebaseAdmin.js';
import { checkRateLimitBucket } from '../../_lib/security.js';
import { getServerProductFallback, SOFTWARE_MIRRORPOS_ID } from '../../_lib/courseCatalog.js';
import {
  issueFreeAccessToken,
  resetFreeAccessTokensForTests,
} from '../../_lib/freeAccessToken.js';
import { buildFreeSoftwareAccessEmails } from '../../_lib/emailTemplates.js';

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
  const { customerEmail } = buildFreeSoftwareAccessEmails(params);
  return customerEmail;
}

interface FreeSoftwareMailPayload extends EmailDispatchPayload {
  recipientName: string;
  productId: string;
  productTitle: string;
  productDescription: string;
  iconUrl: string;
  launchUrl: string;
  referenceId: string;
  isMirrorPOS: boolean;
}

async function dispatchFreeSoftwareEmail(payload: FreeSoftwareMailPayload): Promise<void> {
  if (!isSmtpConfigured()) {
    throw new SmtpConfigError(
      'Email service is not configured. Missing valid GMAIL_USER or GMAIL_APP_PASSWORD.'
    );
  }

  const adminEmail = getAdminNotificationEmail();
  const built = buildFreeSoftwareAccessEmails({
    recipientName: payload.recipientName,
    recipientEmail: payload.to,
    productId: payload.productId,
    productTitle: payload.productTitle,
    productDescription: payload.productDescription,
    iconUrl: payload.iconUrl,
    downloadUrl: payload.launchUrl,
    launchUrl: payload.launchUrl,
    referenceId: payload.referenceId,
    isMirrorPOS: payload.isMirrorPOS,
  });

  const batch: Array<{
    options: { to: string; replyTo?: string; subject: string; text: string; html: string };
    optional?: boolean;
  }> = [
    {
      options: {
        to: payload.to,
        replyTo: adminEmail,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      },
    },
  ];

  // Optional token-redacted branded admin alert over the same SMTP connection (never contains free_access_token)
  if (adminEmail && adminEmail.toLowerCase() !== payload.to.toLowerCase()) {
    batch.push({
      optional: true,
      options: {
        to: adminEmail,
        replyTo: payload.to,
        subject: built.adminEmail.subject,
        text: built.adminEmail.text,
        html: built.adminEmail.html,
      },
    });
  }

  await sendEmailBatch(batch);
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
          productDescription,
          iconUrl,
          launchUrl: deliveredActionUrl,
          referenceId: issuedTokenId,
          isMirrorPOS: isMirrorPOSProduct,
        });
      }
    } catch (mailErr: unknown) {
      const classified = classifySmtpError(mailErr);
      console.error('[MirrorPOS free-access] Gmail SMTP dispatch failed:', {
        errorCode: classified.errorCode,
        smtpCode: classified.smtpCode,
        responseCode: classified.responseCode,
        message: sanitizeLogMessage(classified.message, 200),
        hasSmtp: isSmtpConfigured(),
      });
      return {
        status: classified.httpStatus,
        data: {
          success: false,
          errorCode: classified.errorCode,
          error: classified.userMessage,
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

import {
  verifySignedFreeAccessToken,
  isTokenConsumedInMemory,
  markTokenConsumedInMemory,
} from '../_lib/freeAccessToken.js';
import {
  AdminStore,
  createFirebaseAdminStore,
  isFirebaseAdminConfigured,
} from '../_lib/firebaseAdmin.js';
import { checkRateLimitBucket } from '../_lib/security.js';
import { getServerProductFallback, SOFTWARE_MIRRORPOS_ID } from '../_lib/courseCatalog.js';

function isSafeHttpUrl(url: unknown): url is string {
  return typeof url === 'string' && /^https?:\/\/[^\s"'<>]+$/i.test(url.trim());
}

export interface VerifyFreeAccessInput {
  token: string;
  clientIp?: string;
}

export interface VerifyFreeAccessDeps {
  store?: AdminStore;
}

export async function processVerifyFreeAccess(
  input: VerifyFreeAccessInput,
  deps: VerifyFreeAccessDeps = {}
): Promise<{ status: number; redirectUrl?: string; data: Record<string, any> }> {
  const ip = input.clientIp || 'unknown';
  if (!checkRateLimitBucket('verify-free-access-ip', ip, 30, 5 * 60 * 1000)) {
    return {
      status: 429,
      data: {
        success: false,
        code: 'RATE_LIMITED',
        error: 'Too many verification attempts. Please wait a few minutes and try again.',
      },
    };
  }

  const verification = verifySignedFreeAccessToken(input.token);
  if ('error' in verification) {
    return {
      status: verification.code === 'EXPIRED' || verification.code === 'USED' ? 410 : 400,
      data: {
        success: false,
        code: verification.code,
        error: verification.error,
      },
    };
  }

  const payload = verification.payload;
  if (isTokenConsumedInMemory(payload.tid)) {
    return {
      status: 410,
      data: {
        success: false,
        code: 'USED',
        error:
          'This verification link has already been used. Free Access links are single-use — please request a new email link.',
      },
    };
  }

  let store: AdminStore | null = deps.store || null;
  if (!store && isFirebaseAdminConfigured()) {
    try {
      store = createFirebaseAdminStore();
    } catch {
      store = null;
    }
  }

  if (store) {
    const existingDoc = await store.getDoc('mirrorpos_free_access', payload.tid).catch(() => null);
    if (existingDoc && existingDoc.used === true) {
      markTokenConsumedInMemory(payload.tid, payload.eml, payload.exp);
      return {
        status: 410,
        data: {
          success: false,
          code: 'USED',
          error:
            'This verification link has already been used. Free Access links are single-use — please request a new email link.',
        },
      };
    }
  }

  // Resolve canonical destination URL only after cryptographic verification
  const canonicalFallback = getServerProductFallback(payload.pid || SOFTWARE_MIRRORPOS_ID);
  const productDoc = store
    ? await store.getDoc('products', payload.pid || SOFTWARE_MIRRORPOS_ID).catch(() => null)
    : null;

  const destinationUrl =
    (productDoc && isSafeHttpUrl(productDoc.launchUrl) && productDoc.launchUrl.trim()) ||
    (canonicalFallback && isSafeHttpUrl(canonicalFallback.launchUrl) && canonicalFallback.launchUrl.trim()) ||
    'https://mirror-pos.vercel.app/';

  // Mark single-use token consumed
  markTokenConsumedInMemory(payload.tid, payload.eml, payload.exp);
  const usedAtIso = new Date().toISOString();

  if (store) {
    store
      .setDoc('mirrorpos_free_access', payload.tid, {
        id: payload.tid,
        customerName: payload.nam || 'Creator',
        gmail: payload.eml,
        accessType: 'FREE_EMAIL',
        tokenId: payload.tid,
        tokenExpiresAt: new Date(payload.exp).toISOString(),
        used: true,
        requestedAt: new Date(payload.iat).toISOString(),
        usedAt: usedAtIso,
      })
      .catch(() => {});
  }

  return {
    status: 200,
    redirectUrl: destinationUrl,
    data: {
      success: true,
      tokenId: payload.tid,
      email: payload.eml,
      name: payload.nam,
      redirectUrl: destinationUrl,
      verifiedAt: usedAtIso,
      message: 'Email verification confirmed. Redirecting to MirrorPOS...',
    },
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  let body: Record<string, any> = {};
  if (req.method === 'POST') {
    if (typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body || '{}');
      } catch {
        return res.status(400).json({ success: false, error: 'Invalid JSON request body.' });
      }
    } else if (req.body && typeof req.body === 'object') {
      body = req.body;
    }
  }

  const token =
    (typeof req.query?.token === 'string' && req.query.token) ||
    (typeof req.query?.free_access_token === 'string' && req.query.free_access_token) ||
    (typeof body.token === 'string' && body.token) ||
    '';

  const shouldRedirect =
    req.method === 'GET' && (req.query?.redirect === '1' || req.query?.go === '1');

  const clientIp =
    req.headers?.['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  const result = await processVerifyFreeAccess({ token, clientIp });

  res.setHeader('Cache-Control', 'no-store');
  if (shouldRedirect && result.status === 200 && result.redirectUrl) {
    res.writeHead(302, { Location: result.redirectUrl });
    return res.end();
  }

  return res.status(result.status).json(result.data);
}

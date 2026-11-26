import { verifyFirebaseIdToken, VerifiedFirebaseToken } from '../auth/session.js';
import {
  AdminStore,
  createFirebaseAdminStore,
  isFirebaseAdminConfigured,
} from '../../_lib/firebaseAdmin.js';
import { checkRateLimitBucket } from '../../_lib/security.js';
import { getServerProductFallback } from '../../_lib/courseCatalog.js';

function cleanId(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, 128);
}

function isSafeHttpUrl(url: unknown): url is string {
  return typeof url === 'string' && /^https?:\/\/[^\s"'<>]+$/i.test(url.trim());
}

export interface SoftwareAccessInput {
  method: string;
  authorizationHeader?: string;
  productId?: string;
  mode?: string;
  clientIp?: string;
}

export interface SoftwareAccessDeps {
  store?: AdminStore;
  verifyTokenFn?: (idToken: string) => Promise<VerifiedFirebaseToken>;
}

export async function processSoftwareAccess(
  input: SoftwareAccessInput,
  deps: SoftwareAccessDeps = {}
): Promise<{ status: number; redirectUrl?: string; data: Record<string, any> }> {
  const ip = input.clientIp || 'unknown';
  if (!checkRateLimitBucket('software-access-ip', ip, 30, 5 * 60 * 1000)) {
    return {
      status: 429,
      data: { success: false, error: 'Too many requests. Please wait a moment.' },
    };
  }

  const productId = cleanId(input.productId);
  if (!productId || !/^[a-zA-Z0-9_-]+$/.test(productId)) {
    return {
      status: 400,
      data: { success: false, error: 'Valid software productId is required.' },
    };
  }

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

  let store: AdminStore;
  try {
    store = deps.store || createFirebaseAdminStore();
  } catch (err: unknown) {
    return {
      status: 503,
      data: {
        success: false,
        error: err instanceof Error ? err.message : 'Firebase Admin SDK is not initialized.',
      },
    };
  }

  const canonicalFallback = getServerProductFallback(productId);
  const productDoc =
    (await store.getDoc('products', productId)) ||
    (canonicalFallback && canonicalFallback.type === 'Software' ? canonicalFallback : null);
  if (!productDoc) {
    return {
      status: 404,
      data: { success: false, error: 'Software product was not found.' },
    };
  }

  if (productDoc.status === 'archived' || productDoc.status === 'draft') {
    return {
      status: 404,
      data: { success: false, error: 'This software product is not publicly available.' },
    };
  }

  const numericPrice = Number(productDoc.price);
  const isFreeProduct =
    (!Number.isFinite(numericPrice) || numericPrice === 0) &&
    (numericPrice === 0 || productDoc.isFree === true);

  if (!isFreeProduct || (Number.isFinite(numericPrice) && numericPrice > 0)) {
    // Paid software requires authenticated Admin OR verified customer purchase record
    if (!verifiedUser) {
      return {
        status: 403,
        data: {
          success: false,
          error: 'This is a paid software product. Please complete checkout or sign in to access your purchase.',
        },
      };
    }

    if (!verifiedUser.isAdmin) {
      const userPurchases = await store.listDocs(`users/${verifiedUser.uid}/purchases`, 200);
      const hasLicense = userPurchases.some(
        (p) => p.productId === productId || p.id === productId
      );
      if (!hasLicense) {
        return {
          status: 403,
          data: {
            success: false,
            error: 'No verified purchase license found for this software.',
          },
        };
      }
    }
  }

  const secretDoc = await store.getDoc('productSecrets', productId);
  const downloadUrl = isSafeHttpUrl(secretDoc?.protectedUrl) ? secretDoc!.protectedUrl.trim() : '';
  const launchUrl = isSafeHttpUrl(productDoc.launchUrl) ? productDoc.launchUrl.trim() : '';

  const targetUrl =
    input.mode === 'download'
      ? downloadUrl || launchUrl
      : launchUrl || downloadUrl;

  if (!targetUrl) {
    return {
      status: 404,
      data: {
        success: false,
        error: 'No launch or download destination is configured for this software yet.',
      },
    };
  }

  return {
    status: 200,
    redirectUrl: targetUrl,
    data: {
      success: true,
      productId,
      title: String(productDoc.title || 'Software'),
      launchUrl: launchUrl || null,
      downloadUrl: downloadUrl || null,
      targetUrl,
    },
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'POST, GET');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  if (!isFirebaseAdminConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'Firebase Admin SDK credentials are not configured on server.',
    });
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

  const productId =
    (typeof req.query?.productId === 'string' && req.query.productId) ||
    (typeof body.productId === 'string' && body.productId) ||
    '';
  const mode =
    (typeof req.query?.mode === 'string' && req.query.mode) ||
    (typeof body.mode === 'string' && body.mode) ||
    'launch';
  const shouldRedirect = req.method === 'GET' && (req.query?.go === '1' || req.query?.redirect === '1');

  const clientIp =
    req.headers?.['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  const authHeader =
    typeof req.headers?.authorization === 'string' ? req.headers.authorization : undefined;

  const result = await processSoftwareAccess({
    method: req.method,
    authorizationHeader: authHeader,
    productId,
    mode,
    clientIp,
  });

  if (shouldRedirect && result.status === 200 && result.redirectUrl) {
    res.setHeader('Cache-Control', 'no-store');
    res.writeHead(302, { Location: result.redirectUrl });
    return res.end();
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(result.status).json(result.data);
}

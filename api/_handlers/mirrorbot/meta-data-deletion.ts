import crypto from 'crypto';
import { resolveAppBaseUrl } from '../../_lib/metaStore.js';

function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function base64UrlToBuffer(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, 'base64');
}

function parseMetaSignedRequest(
  signedRequest: string,
  appSecret: string
): { user_id?: string; [key: string]: any } | null {
  const parts = String(signedRequest || '').split('.');
  if (parts.length !== 2) return null;
  const [encodedSig, encodedPayload] = parts;
  if (!encodedSig || !encodedPayload) return null;

  const expectedSig = crypto
    .createHmac('sha256', appSecret)
    .update(encodedPayload, 'utf8')
    .digest('base64url');

  const normalizedProvided = encodedSig.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (!safeEquals(expectedSig, normalizedProvided)) {
    return null;
  }

  try {
    const json = base64UrlToBuffer(encodedPayload).toString('utf8');
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export async function processMetaDataDeletion(params: {
  method: string;
  body?: any;
  requestOrigin?: string;
}): Promise<{ status: number; data: Record<string, any> }> {
  const baseUrl = resolveAppBaseUrl(params.requestOrigin);

  if (params.method === 'GET') {
    return {
      status: 200,
      data: {
        success: true,
        endpoint: 'Mirror Bot Meta User Data Deletion Callback',
        instructionsUrl: `${baseUrl}/data-deletion`,
        privacyPolicyUrl: `${baseUrl}/privacy-policy`,
      },
    };
  }

  if (params.method !== 'POST') {
    return { status: 405, data: { success: false, error: 'Method not allowed.' } };
  }

  const appSecret = (process.env.META_APP_SECRET || '').trim();
  if (!appSecret) {
    return {
      status: 503,
      data: { success: false, error: 'META_APP_SECRET is not configured on the server.' },
    };
  }

  let signedRequest = '';
  if (params.body && typeof params.body === 'object' && typeof params.body.signed_request === 'string') {
    signedRequest = params.body.signed_request.trim();
  } else if (typeof params.body === 'string') {
    const form = new URLSearchParams(params.body);
    signedRequest = (form.get('signed_request') || '').trim();
  }

  if (!signedRequest) {
    return { status: 400, data: { success: false, error: 'Missing signed_request parameter.' } };
  }

  const decoded = parseMetaSignedRequest(signedRequest, appSecret);
  if (!decoded) {
    return { status: 403, data: { success: false, error: 'Invalid signed_request signature.' } };
  }

  const userIdHash = crypto
    .createHash('sha256')
    .update(String(decoded.user_id || crypto.randomBytes(8).toString('hex')))
    .digest('hex')
    .slice(0, 12)
    .toUpperCase();
  const confirmationCode = `MB-DEL-${userIdHash}`;

  return {
    status: 200,
    data: {
      url: `${baseUrl}/data-deletion?code=${encodeURIComponent(confirmationCode)}`,
      confirmation_code: confirmationCode,
    },
  };
}

export default async function handler(req: any, res: any) {
  const proto = (req.headers?.['x-forwarded-proto'] as string) || 'https';
  const host = (req.headers?.['x-forwarded-host'] as string) || (req.headers?.host as string) || '';
  const origin = host ? `${proto}://${host}` : 'https://mirrorbook.site';

  const result = await processMetaDataDeletion({
    method: req.method || 'GET',
    body: req.body,
    requestOrigin: origin,
  });

  res.setHeader('Cache-Control', 'no-store');
  res.status(result.status).json(result.data);
}

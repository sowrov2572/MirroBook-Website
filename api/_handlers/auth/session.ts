import crypto from 'crypto';

const FIREBASE_PROJECT_ID = 'gen-lang-client-0913481345';
const SECURE_TOKEN_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const STRICT_ADMIN_EMAIL = 'khansaheb2572@gmail.com';

interface CertCache {
  certs: Record<string, string>;
  expiresAt: number;
}

let certCache: CertCache = {
  certs: {},
  expiresAt: 0,
};

export interface VerifiedFirebaseToken {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
  provider: string;
  role: 'admin' | 'customer';
  isAdmin: boolean;
}

function decodeBase64UrlToBuffer(segment: string): Buffer {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64');
}

function decodeBase64UrlJson<T = Record<string, any>>(segment: string): T {
  const jsonStr = decodeBase64UrlToBuffer(segment).toString('utf8');
  return JSON.parse(jsonStr) as T;
}

async function fetchGooglePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (now < certCache.expiresAt && Object.keys(certCache.certs).length > 0) {
    return certCache.certs;
  }

  const response = await fetch(SECURE_TOKEN_CERTS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch Firebase public certificates (HTTP ${response.status}).`);
  }

  const certs = (await response.json()) as Record<string, string>;
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSec = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;

  certCache = {
    certs,
    expiresAt: now + Math.max(60, maxAgeSec) * 1000,
  };

  return certs;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseToken> {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Missing Firebase ID token.');
  }

  const parts = idToken.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed JWT token format.');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  let header: Record<string, any>;
  let payload: Record<string, any>;

  try {
    header = decodeBase64UrlJson(headerB64);
    payload = decodeBase64UrlJson(payloadB64);
  } catch {
    throw new Error('Failed to decode Firebase token segments.');
  }

  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    throw new Error('Unsupported or missing token signing key metadata.');
  }

  const certs = await fetchGooglePublicCerts();
  const publicCert = certs[header.kid];
  if (!publicCert) {
    // Bust cache once in case keys rotated
    certCache.expiresAt = 0;
    const refreshedCerts = await fetchGooglePublicCerts();
    if (!refreshedCerts[header.kid]) {
      throw new Error('Signing certificate not found for Firebase token.');
    }
    return verifyTokenWithCert(parts, header, payload, refreshedCerts[header.kid]);
  }

  return verifyTokenWithCert(parts, header, payload, publicCert);
}

function verifyTokenWithCert(
  parts: string[],
  _header: Record<string, any>,
  payload: Record<string, any>,
  publicCert: string
): VerifiedFirebaseToken {
  const signingInput = `${parts[0]}.${parts[1]}`;
  const signature = decodeBase64UrlToBuffer(parts[2]);

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(signingInput);
  verifier.end();

  const isSignatureValid = verifier.verify(publicCert, signature);
  if (!isSignatureValid) {
    throw new Error('Invalid Firebase ID token cryptographic signature.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;

  if (payload.aud !== FIREBASE_PROJECT_ID) {
    throw new Error('Firebase token audience mismatch.');
  }
  if (payload.iss !== expectedIssuer) {
    throw new Error('Firebase token issuer mismatch.');
  }
  if (typeof payload.sub !== 'string' || payload.sub.length === 0 || payload.sub.length > 128) {
    throw new Error('Invalid Firebase token subject.');
  }
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    throw new Error('Firebase token has expired.');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
    throw new Error('Firebase token issued-at timestamp is invalid.');
  }
  if (typeof payload.auth_time === 'number' && payload.auth_time > nowSec + 300) {
    throw new Error('Firebase token auth_time timestamp is invalid.');
  }

  const rawEmail = typeof payload.email === 'string' ? payload.email.trim() : null;
  const normalizedEmail = rawEmail ? rawEmail.toLowerCase() : '';
  const emailVerified = payload.email_verified === true;
  const provider =
    typeof payload.firebase?.sign_in_provider === 'string'
      ? payload.firebase.sign_in_provider
      : 'unknown';

  const hasAdminClaim = payload.admin === true || payload.role === 'admin';
  const isStrictOwner = normalizedEmail === STRICT_ADMIN_EMAIL && emailVerified;
  const isAdmin = hasAdminClaim || isStrictOwner;

  return {
    uid: payload.sub,
    email: rawEmail,
    emailVerified,
    name: typeof payload.name === 'string' ? payload.name : null,
    picture: typeof payload.picture === 'string' ? payload.picture : null,
    provider,
    role: isAdmin ? 'admin' : 'customer',
    isAdmin,
  };
}

export async function processAuthSession(
  authorizationHeader?: string,
  intent?: string
): Promise<{ status: number; data: Record<string, any> }> {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return {
      status: 401,
      data: {
        authenticated: false,
        isAdmin: false,
        role: null,
        error: 'Missing or invalid Authorization Bearer token.',
      },
    };
  }

  const idToken = authorizationHeader.slice('Bearer '.length).trim();
  try {
    const verified = await verifyFirebaseIdToken(idToken);

    if (intent === 'admin' && !verified.isAdmin) {
      return {
        status: 403,
        data: {
          authenticated: true,
          uid: verified.uid,
          email: verified.email,
          emailVerified: verified.emailVerified,
          role: 'customer',
          isAdmin: false,
          error:
            'Access Denied: This account does not have MirrorBook Studio Owner permissions.',
        },
      };
    }

    return {
      status: 200,
      data: {
        authenticated: true,
        uid: verified.uid,
        email: verified.email,
        emailVerified: verified.emailVerified,
        name: verified.name,
        picture: verified.picture,
        provider: verified.provider,
        role: verified.role,
        isAdmin: verified.isAdmin,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid session token.';
    return {
      status: 401,
      data: {
        authenticated: false,
        isAdmin: false,
        role: null,
        error: message,
      },
    };
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'POST, GET');
    return res.status(405).json({ authenticated: false, error: 'Method not allowed.' });
  }

  let intent: string | undefined;
  if (req.query?.intent && typeof req.query.intent === 'string') {
    intent = req.query.intent;
  } else if (req.body) {
    try {
      const parsedBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (typeof parsedBody?.intent === 'string') {
        intent = parsedBody.intent;
      }
    } catch {
      // ignore malformed optional body
    }
  }

  const authHeader =
    typeof req.headers?.authorization === 'string' ? req.headers.authorization : undefined;

  const result = await processAuthSession(authHeader, intent);
  return res.status(result.status).json(result.data);
}

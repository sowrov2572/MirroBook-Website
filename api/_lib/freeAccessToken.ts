import crypto from 'crypto';

export interface FreeAccessTokenPayload {
  tid: string;
  pid: string;
  eml: string;
  nam: string;
  iat: number;
  exp: number;
}

interface TokenMemoryState {
  email: string;
  expiresAt: number;
  used: boolean;
  usedAt?: number;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const tokenRegistry = new Map<string, TokenMemoryState>();

function getSigningSecret(): string {
  const explicit = process.env.FREE_ACCESS_TOKEN_SECRET?.trim();
  if (explicit && explicit.length >= 16) {
    return explicit;
  }
  const entropySeed = [
    process.env.PAYMENT_SMS_WEBHOOK_SECRET || '',
    process.env.GMAIL_APP_PASSWORD || '',
    process.env.FIREBASE_DATABASE_ID || 'ai-studio-mirrorbookreflec-fe0670c8-e16c-43f8-9a82-2943f7012d01',
    'mirrorbook-free-access-v1',
  ].join('|');
  return crypto.createHash('sha256').update(entropySeed).digest('hex');
}

function toBase64Url(buf: Buffer | string): string {
  const raw = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, 'utf8');
  return raw.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + '='.repeat(padLen), 'base64');
}

export function issueFreeAccessToken(params: {
  productId: string;
  email: string;
  name: string;
  ttlMs?: number;
}): {
  token: string;
  tokenId: string;
  expiresAtMs: number;
  expiresAtIso: string;
} {
  const now = Date.now();
  const ttl = typeof params.ttlMs === 'number' && params.ttlMs > 0 ? params.ttlMs : DEFAULT_TTL_MS;
  const expiresAtMs = now + ttl;
  const tokenId = `FAT-${now.toString(36).toUpperCase()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

  const payload: FreeAccessTokenPayload = {
    tid: tokenId,
    pid: params.productId,
    eml: params.email.toLowerCase().trim(),
    nam: params.name.trim().slice(0, 120),
    iat: now,
    exp: expiresAtMs,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const hmac = crypto
    .createHmac('sha256', getSigningSecret())
    .update(encodedPayload)
    .digest();
  const signature = toBase64Url(hmac);
  const token = `${encodedPayload}.${signature}`;

  tokenRegistry.set(tokenId, {
    email: payload.eml,
    expiresAt: expiresAtMs,
    used: false,
  });

  // Prune stale registry entries occasionally to keep memory bounded
  if (tokenRegistry.size > 2000) {
    for (const [k, v] of tokenRegistry.entries()) {
      if (v.expiresAt < now) {
        tokenRegistry.delete(k);
      }
    }
  }

  return {
    token,
    tokenId,
    expiresAtMs,
    expiresAtIso: new Date(expiresAtMs).toISOString(),
  };
}

export function verifySignedFreeAccessToken(token: string):
  | { valid: true; payload: FreeAccessTokenPayload }
  | { valid: false; code: 'INVALID' | 'EXPIRED' | 'USED'; error: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, code: 'INVALID', error: 'Verification token is missing.' };
  }

  const trimmed = token.trim();
  const parts = trimmed.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { valid: false, code: 'INVALID', error: 'Invalid verification token format.' };
  }

  const [encodedPayload, encodedSig] = parts;
  const expectedHmac = crypto
    .createHmac('sha256', getSigningSecret())
    .update(encodedPayload)
    .digest();

  let providedSig: Buffer;
  try {
    providedSig = fromBase64Url(encodedSig);
  } catch {
    return { valid: false, code: 'INVALID', error: 'Malformed verification signature.' };
  }

  if (
    providedSig.length !== expectedHmac.length ||
    !crypto.timingSafeEqual(providedSig, expectedHmac)
  ) {
    return { valid: false, code: 'INVALID', error: 'Verification link signature is invalid.' };
  }

  let payload: FreeAccessTokenPayload;
  try {
    const jsonStr = fromBase64Url(encodedPayload).toString('utf8');
    payload = JSON.parse(jsonStr) as FreeAccessTokenPayload;
  } catch {
    return { valid: false, code: 'INVALID', error: 'Unable to parse verification token.' };
  }

  if (
    !payload ||
    typeof payload.tid !== 'string' ||
    typeof payload.pid !== 'string' ||
    typeof payload.eml !== 'string' ||
    typeof payload.exp !== 'number'
  ) {
    return { valid: false, code: 'INVALID', error: 'Incomplete verification token payload.' };
  }

  if (Date.now() > payload.exp) {
    return {
      valid: false,
      code: 'EXPIRED',
      error: 'This verification link has expired. Please request a new Free Access email.',
    };
  }

  const tracked = tokenRegistry.get(payload.tid);
  if (tracked && tracked.used) {
    return {
      valid: false,
      code: 'USED',
      error: 'This verification link has already been used. Free Access links are single-use.',
    };
  }

  return { valid: true, payload };
}

export function isTokenConsumedInMemory(tokenId: string): boolean {
  return Boolean(tokenRegistry.get(tokenId)?.used);
}

export function markTokenConsumedInMemory(tokenId: string, email: string, expiresAt: number): void {
  tokenRegistry.set(tokenId, {
    email,
    expiresAt,
    used: true,
    usedAt: Date.now(),
  });
}

export function resetFreeAccessTokensForTests(): void {
  tokenRegistry.clear();
}

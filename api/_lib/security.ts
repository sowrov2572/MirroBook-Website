import crypto from 'crypto';

interface RateLimitEntry {
  timestamps: number[];
}

const rateBuckets = new Map<string, RateLimitEntry>();
const recentReplayHashes = new Map<string, number>();
const REPLAY_TTL_MS = 10 * 60 * 1000;

export function checkRateLimitBucket(
  bucketName: string,
  identifier: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const key = `${bucketName}:${identifier}`;
  const entry = rateBuckets.get(key) || { timestamps: [] };
  const valid = entry.timestamps.filter((ts) => now - ts < windowMs);

  if (valid.length >= maxRequests) {
    rateBuckets.set(key, { timestamps: valid });
    return false;
  }

  valid.push(now);
  rateBuckets.set(key, { timestamps: valid });
  return true;
}

export function resetSecurityCachesForTests(): void {
  rateBuckets.clear();
  recentReplayHashes.clear();
}

export function timingSafeSecretMatch(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const hashA = crypto.createHash('sha256').update(provided, 'utf8').digest();
  const hashB = crypto.createHash('sha256').update(expected, 'utf8').digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

export function isRecentReplayHash(hash: string): boolean {
  const now = Date.now();
  // Clean expired hashes periodically
  if (recentReplayHashes.size > 500) {
    for (const [k, expiresAt] of recentReplayHashes.entries()) {
      if (expiresAt <= now) recentReplayHashes.delete(k);
    }
  }
  const existing = recentReplayHashes.get(hash);
  if (existing && existing > now) {
    return true;
  }
  recentReplayHashes.set(hash, now + REPLAY_TTL_MS);
  return false;
}

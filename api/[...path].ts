import handler0 from './_handlers/auth/session.js';
import handler1 from './_handlers/courses/lessons.js';
import handler2 from './_handlers/mirrorbot/chat.js';
import handler3 from './_handlers/mirrorbot/meta-status.js';
import handler4 from './_handlers/mirrorbot/meta-webhook.js';
import handler5 from './_handlers/mirrorbot/suggest-names.js';
import handler6 from './_handlers/orders/admin-approve.js';
import handler7 from './_handlers/orders/submit-and-verify.js';
import handler8 from './_handlers/package-order.js';
import handler9 from './_handlers/payment-sms/logs.js';
import handler10 from './_handlers/payment-sms/receive.js';
import handler11 from './_handlers/software/access.js';
import handler12 from './_handlers/software/free-access.js';
import handler13 from './_handlers/software/verify-free-access.js';
import handler14 from './_handlers/mirrorbot/meta-oauth-url.js';
import handler15 from './_handlers/mirrorbot/meta-callback.js';
import handler16 from './_handlers/mirrorbot/meta-connect.js';
import handler17 from './_handlers/mirrorbot/meta-data-deletion.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_BODY_BYTES = 6 * 1024 * 1024;

function readRawRequestBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let exceeded = false;
    req.on('data', (chunk: Buffer | string) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buf.length;
      if (total > MAX_BODY_BYTES) {
        exceeded = true;
        return;
      }
      chunks.push(buf);
    });
    req.on('end', () => {
      if (exceeded) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
      } else {
        resolve(Buffer.concat(chunks).toString('utf8'));
      }
    });
    req.on('error', reject);
  });
}

const handlers: Record<string, (req: any, res: any) => any> = {
  'auth/session': handler0,
  'courses/lessons': handler1,
  'mirrorbot/chat': handler2,
  'mirrorbot/meta-status': handler3,
  'mirrorbot/meta-webhook': handler4,
  'mirrorbot/suggest-names': handler5,
  'mirrorbot/meta-oauth-url': handler14,
  'mirrorbot/meta-callback': handler15,
  'mirrorbot/meta-connect': handler16,
  'mirrorbot/meta-data-deletion': handler17,
  'orders/admin-approve': handler6,
  'orders/submit-and-verify': handler7,
  'package-order': handler8,
  'payment-sms/logs': handler9,
  'payment-sms/receive': handler10,
  'software/access': handler11,
  'software/free-access': handler12,
  'software/verify-free-access': handler13,
  'inquiry': handler8,
  'order': handler8,
};

export default async function handler(req: any, res: any) {
  const rawPath = req.query?.path;
  let route = (Array.isArray(rawPath) ? rawPath.join('/') : typeof rawPath === 'string' ? rawPath : '')
    .split('/')
    .filter(Boolean)
    .join('/');

  if (!route && typeof req.url === 'string') {
    try {
      const parsed = new URL(req.url, 'https://mirrorbook.site');
      route = parsed.pathname
        .replace(/^\/api\/?/, '')
        .split('/')
        .filter(Boolean)
        .join('/');
    } catch {
      // keep empty route
    }
  }

  const selected = handlers[route];
  if (!selected) {
    return res.status(404).json({ success: false, error: 'API endpoint not found.' });
  }

  const method = String(req.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS' && req.body === undefined) {
    try {
      const rawStr = await readRawRequestBody(req);
      req.rawBody = rawStr;
      const contentType = String(req.headers?.['content-type'] || '').toLowerCase();
      if (contentType.includes('application/json')) {
        if (rawStr.trim()) {
          try {
            req.body = JSON.parse(rawStr);
          } catch {
            req.body = rawStr;
          }
        } else {
          req.body = {};
        }
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams(rawStr);
        const obj: Record<string, string> = {};
        for (const [k, v] of params.entries()) {
          obj[k] = v;
        }
        req.body = obj;
      } else {
        req.body = rawStr;
      }
    } catch (err: any) {
      if (err?.message === 'PAYLOAD_TOO_LARGE') {
        return res.status(413).json({ success: false, error: 'Request payload is too large.' });
      }
      return res.status(400).json({ success: false, error: 'Could not read request body.' });
    }
  }

  return selected(req, res);
}

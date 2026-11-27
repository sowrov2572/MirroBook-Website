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
  const route = (Array.isArray(rawPath) ? rawPath.join('/') : typeof rawPath === 'string' ? rawPath : '')
    .split('/').filter(Boolean).join('/');
  const selected = handlers[route];
  if (!selected) {
    return res.status(404).json({ success: false, error: 'API endpoint not found.' });
  }
  return selected(req, res);
}

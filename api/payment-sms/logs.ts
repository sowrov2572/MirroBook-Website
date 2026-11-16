import { verifyFirebaseIdToken, VerifiedFirebaseToken } from '../auth/session';
import {
  AdminStore,
  createFirebaseAdminStore,
  isFirebaseAdminConfigured,
} from '../_lib/firebaseAdmin';

export async function processGetPaymentSmsLogs(
  authorizationHeader?: string,
  deps: { store?: AdminStore; verifyTokenFn?: (idToken: string) => Promise<VerifiedFirebaseToken> } = {}
): Promise<{ status: number; data: Record<string, any> }> {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return {
      status: 401,
      data: { success: false, error: 'Unauthorized: missing Admin Bearer token.' },
    };
  }

  try {
    const verifier = deps.verifyTokenFn || verifyFirebaseIdToken;
    const verified = await verifier(authorizationHeader.slice(7).trim());
    if (!verified.isAdmin) {
      return {
        status: 403,
        data: { success: false, error: 'Forbidden: Studio Owner admin privileges required.' },
      };
    }
  } catch (err: unknown) {
    return {
      status: 401,
      data: {
        success: false,
        error: err instanceof Error ? err.message : 'Invalid Firebase session token.',
      },
    };
  }

  let store: AdminStore;
  try {
    store = deps.store || createFirebaseAdminStore();
  } catch (err: unknown) {
    return {
      status: 503,
      data: {
        success: false,
        error: err instanceof Error ? err.message : 'Firebase Admin SDK not initialized.',
      },
    };
  }

  const docs = await store.listDocs('bkashTransactions', 100);
  const logs = docs
    .map((d) => ({
      timestamp: String(d.receivedAt || d.smsTimestamp || ''),
      gateway: String(d.gateway || 'bKash'),
      transactionType: String(d.transactionType || 'Send Money Received'),
      trxId: String(d.trxId || d.id || ''),
      amount: Number(d.amount) || 0,
      sender: String(d.sender || 'Unknown'),
      status: String(d.status || 'UNUSED'),
      usedByOrderId: d.usedByOrderId ? String(d.usedByOrderId) : '',
    }))
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

  return {
    status: 200,
    data: {
      success: true,
      logs,
    },
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, error: 'Method not allowed. Use GET.' });
  }

  if (!isFirebaseAdminConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'Firebase Admin SDK credentials missing on server.',
    });
  }

  const authHeader =
    typeof req.headers?.authorization === 'string' ? req.headers.authorization : undefined;

  const result = await processGetPaymentSmsLogs(authHeader);
  return res.status(result.status).json(result.data);
}

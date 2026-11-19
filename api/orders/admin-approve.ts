import { verifyFirebaseIdToken, VerifiedFirebaseToken } from '../auth/session.js';
import { normalizeTrxId } from '../_lib/bkashSmsParser.js';
import {
  AdminStore,
  createFirebaseAdminStore,
  generateServerLicenseKey,
  isFirebaseAdminConfigured,
} from '../_lib/firebaseAdmin.js';
import { getServerProductFallback } from '../_lib/courseCatalog.js';

export interface AdminApproveInput {
  authorizationHeader?: string;
  body: Record<string, any> | string;
}

export interface AdminApproveDeps {
  store?: AdminStore;
  verifyTokenFn?: (idToken: string) => Promise<VerifiedFirebaseToken>;
}

export async function processAdminApproveOrder(
  input: AdminApproveInput,
  deps: AdminApproveDeps = {}
): Promise<{ status: number; data: Record<string, any> }> {
  if (!input.authorizationHeader || !input.authorizationHeader.startsWith('Bearer ')) {
    return {
      status: 401,
      data: { success: false, error: 'Unauthorized: missing Admin Bearer token.' },
    };
  }

  let verifiedAdmin: VerifiedFirebaseToken;
  try {
    const verifier = deps.verifyTokenFn || verifyFirebaseIdToken;
    verifiedAdmin = await verifier(input.authorizationHeader.slice(7).trim());
    if (!verifiedAdmin.isAdmin) {
      return {
        status: 403,
        data: { success: false, error: 'Forbidden: Studio Owner admin role required.' },
      };
    }
  } catch (err: unknown) {
    return {
      status: 401,
      data: {
        success: false,
        error: err instanceof Error ? err.message : 'Invalid Admin session token.',
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

  const orderId = typeof payload.orderId === 'string' ? payload.orderId.trim() : '';
  if (!orderId || orderId.length > 128) {
    return { status: 400, data: { success: false, error: 'Valid orderId is required.' } };
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

  const nowIso = new Date().toISOString();

  const txResult = await store.runTransaction(async (tx) => {
    const order = await tx.get('orders', orderId);
    if (!order) {
      return {
        httpStatus: 404,
        payload: { success: false, error: `Order ${orderId} not found.` },
      };
    }

    const normalizedTrx = normalizeTrxId(order.trxId);
    if (normalizedTrx) {
      const existingLock = await tx.get('redeemedTrxIds', normalizedTrx);
      if (existingLock && existingLock.orderId && existingLock.orderId !== orderId) {
        return {
          httpStatus: 409,
          payload: {
            success: false,
            alreadyUsed: true,
            error: `Transaction ID ${normalizedTrx} was already redeemed by Order ${existingLock.orderId}.`,
          },
        };
      }
    }

    const productId = String(order.productId || order.itemId || '').trim();
    const productDoc = productId ? await tx.get('products', productId) : null;
    const secretDoc = productId ? await tx.get('productSecrets', productId) : null;
    const canonicalFallback = getServerProductFallback(productId, String(order.itemName || ''));

    const resolvedDownloadUrl =
      (typeof order.downloadUrl === 'string' && order.downloadUrl.trim()) ||
      (secretDoc && typeof secretDoc.protectedUrl === 'string' && secretDoc.protectedUrl.trim()) ||
      canonicalFallback?.protectedUrl ||
      '';

    if (!resolvedDownloadUrl) {
      return {
        httpStatus: 400,
        payload: {
          success: false,
          error:
            'No protected download URL is configured for this product in productSecrets. Add the Google Drive link in Manage Products first.',
        },
      };
    }

    const title = String(productDoc?.title || canonicalFallback?.title || order.itemName || 'Digital Product');
    const category = String(productDoc?.type || productDoc?.category || canonicalFallback?.type || 'Plugin');
    const licenseKey =
      (typeof order.licenseKey === 'string' && order.licenseKey.trim()) ||
      generateServerLicenseKey(title, order.customerEmail, normalizedTrx || orderId);

    const updatedOrder: Record<string, any> = {
      ...order,
      status: 'Completed',
      downloadUrl: resolvedDownloadUrl,
      licenseKey,
      approvedBy: verifiedAdmin.email || verifiedAdmin.uid,
      approvedAt: nowIso,
      verificationNote: `Manually approved by Admin (${verifiedAdmin.email || 'owner'})`,
    };

    tx.set('orders', orderId, updatedOrder);

    if (normalizedTrx) {
      tx.set('redeemedTrxIds', normalizedTrx, {
        trxId: normalizedTrx,
        orderId,
        userId: order.userId || null,
        customerEmail: order.customerEmail || '',
        amount: Number(order.canonicalAmount || 0),
        createdAt: nowIso,
      });

      const smsTx = await tx.get('bkashTransactions', normalizedTrx);
      if (smsTx) {
        tx.update('bkashTransactions', normalizedTrx, {
          status: 'USED',
          usedByOrderId: orderId,
          usedByUid: order.userId || null,
          usedByEmail: order.customerEmail || '',
          redeemedAt: nowIso,
        });
      }
    }

    if (order.userId && typeof order.userId === 'string') {
      tx.set(`users/${order.userId}/purchases`, orderId, {
        id: orderId,
        productId: productId || orderId,
        title,
        category,
        downloadUrl: resolvedDownloadUrl,
        purchasedAt: nowIso,
        trxId: normalizedTrx || order.trxId || '',
        licenseKey,
      });
    }

    return {
      httpStatus: 200,
      payload: {
        success: true,
        order: updatedOrder,
        message: `Order ${orderId} approved as Completed via Admin SDK.`,
      },
    };
  });

  return {
    status: txResult.httpStatus,
    data: txResult.payload,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  if (!isFirebaseAdminConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'Firebase Admin SDK credentials are not configured on server.',
    });
  }

  const authHeader =
    typeof req.headers?.authorization === 'string' ? req.headers.authorization : undefined;

  const result = await processAdminApproveOrder({
    authorizationHeader: authHeader,
    body: req.body ?? {},
  });

  return res.status(result.status).json(result.data);
}

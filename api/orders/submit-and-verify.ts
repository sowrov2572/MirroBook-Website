import crypto from 'crypto';
import { verifyFirebaseIdToken, VerifiedFirebaseToken } from '../auth/session';
import {
  isValidTrxIdFormat,
  normalizeBdPhone,
  normalizeTrxId,
} from '../_lib/bkashSmsParser';
import {
  AdminStore,
  createFirebaseAdminStore,
  generateServerLicenseKey,
  isFirebaseAdminConfigured,
} from '../_lib/firebaseAdmin';
import { checkRateLimitBucket } from '../_lib/security';

const ALLOWED_METHODS = new Set(['bKash', 'Nagad', 'Rocket', 'Upay', 'Bank Transfer']);

export interface SubmitAndVerifyInput {
  authorizationHeader?: string;
  body: Record<string, any> | string;
  clientIp?: string;
}

export interface SubmitAndVerifyDeps {
  store?: AdminStore;
  verifyTokenFn?: (idToken: string) => Promise<VerifiedFirebaseToken>;
  expectedOwnerNumber?: string;
}

function cleanStr(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

export async function processSubmitAndVerifyOrder(
  input: SubmitAndVerifyInput,
  deps: SubmitAndVerifyDeps = {}
): Promise<{ status: number; data: Record<string, any> }> {
  const ip = input.clientIp || 'unknown';
  if (!checkRateLimitBucket('order-submit-ip', ip, 25, 10 * 60 * 1000)) {
    return {
      status: 429,
      data: {
        success: false,
        error: 'Too many verification attempts. Please wait a few minutes before retrying.',
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

  // Optional cryptographic Firebase ID Token check (never trust userId from req.body)
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
            error: err instanceof Error ? err.message : 'Invalid session authentication token.',
          },
        };
      }
    }
  }

  const productId = cleanStr(payload.productId || payload.itemId, 128);
  const rawItemName = cleanStr(payload.itemName, 200);
  const paymentMethod = cleanStr(payload.paymentMethod, 40);
  const customerPhone = cleanStr(payload.customerPhone, 40);
  const senderAccount = cleanStr(payload.senderAccount || customerPhone, 80);
  const customerEmail = (
    verifiedUser?.email || cleanStr(payload.customerEmail, 254)
  )
    .toLowerCase()
    .trim();
  const customerName =
    cleanStr(payload.customerName, 120) ||
    verifiedUser?.name ||
    (customerEmail ? customerEmail.split('@')[0] : 'Customer');
  const normalizedTrxId = normalizeTrxId(payload.trxId);

  if (!ALLOWED_METHODS.has(paymentMethod)) {
    return {
      status: 400,
      data: { success: false, error: 'Unsupported payment method selected.' },
    };
  }

  if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customerEmail)) {
    return {
      status: 400,
      data: { success: false, error: 'Please provide a valid email address.' },
    };
  }

  if (!customerPhone || customerPhone.replace(/[^0-9]/g, '').length < 6) {
    return {
      status: 400,
      data: { success: false, error: 'Please provide a valid mobile/WhatsApp number.' },
    };
  }

  if (!normalizedTrxId || !isValidTrxIdFormat(normalizedTrxId)) {
    return {
      status: 400,
      data: {
        success: false,
        error: 'Invalid Transaction ID format (must be 6–20 alphanumeric characters).',
      },
    };
  }

  if (!productId && !rawItemName) {
    return {
      status: 400,
      data: { success: false, error: 'Product identifier is required.' },
    };
  }

  if (!checkRateLimitBucket('order-trx-bruteforce', normalizedTrxId, 12, 10 * 60 * 1000)) {
    return {
      status: 429,
      data: {
        success: false,
        error: 'Too many verification attempts for this Transaction ID.',
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
        error: err instanceof Error ? err.message : 'Firebase Admin SDK is not initialized.',
      },
    };
  }

  // Resolve owner canonical bKash number from env or Firestore settings
  let ownerBkash = normalizeBdPhone(
    deps.expectedOwnerNumber ?? process.env.OWNER_BKASH_NUMBER ?? ''
  );
  if (!ownerBkash) {
    try {
      const cfg = await store.getDoc('settings', 'paymentConfig');
      if (cfg && typeof cfg.bKashNumber === 'string') {
        ownerBkash = normalizeBdPhone(cfg.bKashNumber);
      }
    } catch {
      // non-fatal
    }
  }
  if (!ownerBkash) {
    ownerBkash = '01767079837';
  }

  // Look up canonical product document in Firestore (fallback title match if only itemName provided)
  let resolvedProductId = productId;
  let productDoc: Record<string, any> | null = resolvedProductId
    ? await store.getDoc('products', resolvedProductId)
    : null;

  if (!productDoc && rawItemName) {
    const allProducts = await store.listDocs('products', 200);
    const match = allProducts.find(
      (p) => String(p.title || '').toLowerCase().trim() === rawItemName.toLowerCase().trim()
    );
    if (match) {
      productDoc = match;
      resolvedProductId = String(match.id || '');
    }
  }

  if (!productDoc || !resolvedProductId) {
    return {
      status: 404,
      data: {
        success: false,
        error: 'Selected product was not found in the canonical Firestore catalog.',
      },
    };
  }

  const canonicalPrice = Number(productDoc.price);
  if (!Number.isFinite(canonicalPrice) || canonicalPrice <= 0) {
    return {
      status: 400,
      data: {
        success: false,
        error: 'Invalid canonical product price in Firestore catalog.',
      },
    };
  }

  const canonicalTitle = String(productDoc.title || rawItemName || 'Digital Product');
  const canonicalCategory = String(productDoc.type || productDoc.category || 'Plugin');
  const canonicalPriceDisplay =
    typeof productDoc.priceDisplay === 'string' && productDoc.priceDisplay
      ? productDoc.priceDisplay
      : `৳${canonicalPrice.toLocaleString()}`;

  const orderId = `MB-${Date.now().toString(36).toUpperCase()}-${crypto
    .randomBytes(2)
    .toString('hex')
    .toUpperCase()}`;
  const nowIso = new Date().toISOString();
  const displayDate = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Execute verification and release strictly inside an atomic Firestore transaction
  const txResult = await store.runTransaction(async (tx) => {
    const redeemedLock = await tx.get('redeemedTrxIds', normalizedTrxId);
    if (redeemedLock) {
      return {
        httpStatus: 409,
        payload: {
          success: false,
          verified: false,
          alreadyUsed: true,
          pending: false,
          error: `Transaction ID (${normalizedTrxId}) has already been redeemed. Duplicate usage is blocked.`,
          message: `এই Transaction ID (${normalizedTrxId}) টি ইতিমধ্যে ব্যবহার করা হয়ে গেছে। একটি TrxID শুধুমাত্র একবার ব্যবহার করা যাবে।`,
        },
      };
    }

    const secretDoc = await tx.get('productSecrets', resolvedProductId);
    const secretProtectedUrl =
      secretDoc && typeof secretDoc.protectedUrl === 'string' ? secretDoc.protectedUrl.trim() : '';

    const basePendingOrder: Record<string, any> = {
      id: orderId,
      customerName,
      customerEmail,
      customerPhone,
      productId: resolvedProductId,
      itemId: resolvedProductId,
      itemName: canonicalTitle,
      itemPrice: canonicalPriceDisplay,
      canonicalAmount: canonicalPrice,
      paymentMethod,
      senderAccount,
      trxId: normalizedTrxId,
      createdAt: displayDate,
      status: 'Pending',
      downloadUrl: '',
    };
    if (verifiedUser?.uid) {
      basePendingOrder.userId = verifiedUser.uid;
    }

    // Non-bKash payment methods remain Pending for manual Admin review
    if (paymentMethod !== 'bKash') {
      basePendingOrder.verificationNote = `Manual review required for ${paymentMethod}.`;
      tx.set('orders', orderId, basePendingOrder);
      return {
        httpStatus: 200,
        payload: {
          success: true,
          verified: false,
          pending: true,
          reason: 'MANUAL_METHOD',
          order: basePendingOrder,
          message: `${paymentMethod} payment submitted for manual Admin verification.`,
        },
      };
    }

    // Look up trusted SMS event recorded exclusively by /api/payment-sms/receive
    const smsTx = await tx.get('bkashTransactions', normalizedTrxId);

    if (!smsTx || smsTx.verifiedByWebhook !== true) {
      basePendingOrder.verificationNote = `No verified bKash SMS webhook event recorded yet for TrxID ${normalizedTrxId}.`;
      tx.set('orders', orderId, basePendingOrder);
      return {
        httpStatus: 200,
        payload: {
          success: true,
          verified: false,
          pending: true,
          notFound: true,
          reason: 'SMS_NOT_RECEIVED',
          order: basePendingOrder,
          message: `Transaction ID (${normalizedTrxId}) এখনো অটোমেটেড SMS লগে পৌঁছায়নি। অর্ডারটি Pending হিসেবে সংরক্ষিত হয়েছে — এডমিন যাচাই করে অ্যাক্টিভ করবেন।`,
        },
      };
    }

    if (smsTx.status !== 'UNUSED' || smsTx.usedByOrderId) {
      return {
        httpStatus: 409,
        payload: {
          success: false,
          verified: false,
          alreadyUsed: true,
          pending: false,
          error: `Transaction ID (${normalizedTrxId}) has already been used for order ${smsTx.usedByOrderId || ''}.`,
          message: `এই Transaction ID (${normalizedTrxId}) টি ইতিমধ্যে ব্যবহৃত হয়েছে।`,
        },
      };
    }

    // Verify received amount strictly against canonical Firestore product price
    const receivedAmount = Number(smsTx.amount);
    if (!Number.isFinite(receivedAmount) || receivedAmount < canonicalPrice - 0.5) {
      basePendingOrder.verificationNote = `Amount mismatch: SMS received ৳${receivedAmount || 0}, canonical price is ৳${canonicalPrice}.`;
      tx.set('orders', orderId, basePendingOrder);
      return {
        httpStatus: 200,
        payload: {
          success: true,
          verified: false,
          pending: true,
          amountMismatch: true,
          receivedAmount,
          requiredAmount: canonicalPrice,
          reason: 'AMOUNT_MISMATCH',
          order: basePendingOrder,
          message: `পেমেন্ট অ্যামাউন্ট মেলেনি! প্রোডাক্টের মূল্য ৳${canonicalPrice} কিন্তু বিকাশ SMS-এ পাওয়া গেছে ৳${receivedAmount}। অর্ডারটি এডমিন রিভিউয়ের জন্য Pending রাখা হয়েছে।`,
        },
      };
    }

    // Verify owner bKash account matches
    const txRecipient = normalizeBdPhone(smsTx.recipientAccount || smsTx.ownerBkashNumber || '');
    if (txRecipient && ownerBkash && txRecipient !== ownerBkash) {
      basePendingOrder.verificationNote = `Recipient bKash mismatch (${txRecipient} vs owner account).`;
      tx.set('orders', orderId, basePendingOrder);
      return {
        httpStatus: 200,
        payload: {
          success: true,
          verified: false,
          pending: true,
          reason: 'ACCOUNT_MISMATCH',
          order: basePendingOrder,
          message: 'Payment recipient account mismatch. Order placed under manual Admin review.',
        },
      };
    }

    // Ensure protected product URL is configured before auto-completing
    if (!secretProtectedUrl) {
      basePendingOrder.verificationNote = 'bKash SMS matched, awaiting protected download URL configuration by Admin.';
      tx.set('orders', orderId, basePendingOrder);
      return {
        httpStatus: 200,
        payload: {
          success: true,
          verified: false,
          pending: true,
          reason: 'SECRET_UNCONFIGURED',
          order: basePendingOrder,
          message: 'আপনার পেমেন্ট SMS ম্যাচ হয়েছে! এডমিন প্রোডাক্ট লিংক নিশ্চিত করে অ্যাক্সেস চালু করবেন।',
        },
      };
    }

    // ==================== ATOMIC VERIFIED RELEASE ====================
    const licenseKey = generateServerLicenseKey(canonicalTitle, customerEmail, normalizedTrxId);

    const completedOrder: Record<string, any> = {
      ...basePendingOrder,
      status: 'Completed',
      downloadUrl: secretProtectedUrl,
      licenseKey,
      verificationNote: `Verified via owner bKash SMS webhook (৳${receivedAmount})`,
      approvedBy: 'auto-sms-webhook',
      approvedAt: nowIso,
    };

    // 1. Mark SMS transaction USED
    tx.update('bkashTransactions', normalizedTrxId, {
      status: 'USED',
      usedByOrderId: orderId,
      usedByUid: verifiedUser?.uid || null,
      usedByEmail: customerEmail,
      redeemedAt: nowIso,
    });

    // 2. Lock TrxID globally against duplicate reuse
    tx.set('redeemedTrxIds', normalizedTrxId, {
      trxId: normalizedTrxId,
      orderId,
      userId: verifiedUser?.uid || null,
      customerEmail,
      amount: receivedAmount,
      createdAt: nowIso,
    });

    // 3. Save Completed Order
    tx.set('orders', orderId, completedOrder);

    // 4. Create Purchase Record in authenticated customer's isolated vault via Admin SDK
    if (verifiedUser?.uid) {
      tx.set(`users/${verifiedUser.uid}/purchases`, orderId, {
        id: orderId,
        productId: resolvedProductId,
        title: canonicalTitle,
        category: canonicalCategory,
        downloadUrl: secretProtectedUrl,
        purchasedAt: nowIso,
        trxId: normalizedTrxId,
        licenseKey,
      });
    }

    return {
      httpStatus: 200,
      payload: {
        success: true,
        verified: true,
        pending: false,
        order: completedOrder,
        licenseKey,
        message: `Payment of ৳${receivedAmount} verified via bKash SMS! Order ${orderId} completed.`,
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

  const clientIp =
    req.headers?.['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  const authHeader =
    typeof req.headers?.authorization === 'string' ? req.headers.authorization : undefined;

  const result = await processSubmitAndVerifyOrder({
    authorizationHeader: authHeader,
    body: req.body ?? {},
    clientIp,
  });

  return res.status(result.status).json(result.data);
}

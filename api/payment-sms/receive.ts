import { parseBkashSms, normalizeBdPhone } from '../_lib/bkashSmsParser';
import {
  AdminStore,
  createFirebaseAdminStore,
  isFirebaseAdminConfigured,
} from '../_lib/firebaseAdmin';
import {
  checkRateLimitBucket,
  isRecentReplayHash,
  sha256Hex,
  timingSafeSecretMatch,
} from '../_lib/security';

export interface ReceiveSmsInput {
  headers: Record<string, string | string[] | undefined>;
  body: Record<string, any> | string;
  clientIp?: string;
}

export interface ReceiveSmsDeps {
  store?: AdminStore;
  webhookSecret?: string;
  expectedOwnerNumber?: string;
  bypassReplayCache?: boolean;
}

function getHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string
): string {
  const target = name.toLowerCase();
  for (const [k, v] of Object.entries(headers || {})) {
    if (k.toLowerCase() === target) {
      if (Array.isArray(v)) return String(v[0] || '').trim();
      return typeof v === 'string' ? v.trim() : '';
    }
  }
  return '';
}

export async function processPaymentSmsWebhook(
  input: ReceiveSmsInput,
  deps: ReceiveSmsDeps = {}
): Promise<{ status: number; data: Record<string, any> }> {
  const expectedSecret = (
    deps.webhookSecret ?? process.env.PAYMENT_SMS_WEBHOOK_SECRET ?? ''
  ).trim();

  if (!expectedSecret || expectedSecret.length < 16) {
    return {
      status: 503,
      data: {
        success: false,
        error: 'Webhook secret is not configured on the server.',
      },
    };
  }

  // Extract secret ONLY from headers (never query string or public body)
  let providedSecret = getHeader(input.headers, 'x-webhook-secret');
  if (!providedSecret) {
    const authHeader = getHeader(input.headers, 'authorization');
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      providedSecret = authHeader.slice(7).trim();
    }
  }

  if (!providedSecret || !timingSafeSecretMatch(providedSecret, expectedSecret)) {
    return {
      status: 401,
      data: {
        success: false,
        error: 'Unauthorized: invalid or missing webhook secret.',
      },
    };
  }

  const ip = input.clientIp || 'unknown';
  if (!checkRateLimitBucket('payment-sms-receive', ip, 60, 60 * 1000)) {
    return {
      status: 429,
      data: {
        success: false,
        error: 'Rate limit exceeded. Too many webhook calls.',
      },
    };
  }

  // Parse request JSON body safely
  let payload: Record<string, any>;
  if (typeof input.body === 'string') {
    try {
      payload = JSON.parse(input.body || '{}');
    } catch {
      return {
        status: 400,
        data: { success: false, error: 'Invalid JSON request body.' },
      };
    }
  } else if (input.body && typeof input.body === 'object') {
    payload = input.body;
  } else {
    return {
      status: 400,
      data: { success: false, error: 'Request body must be a JSON object.' },
    };
  }

  const rawText =
    payload.text ?? payload.sms ?? payload.message ?? payload.body ?? payload.content ?? '';
  const smsSenderAddress =
    typeof payload.sender === 'string'
      ? payload.sender
      : typeof payload.from === 'string'
      ? payload.from
      : undefined;

  // Replay guard for optional client-sent timestamp header (reject stale > 48h if explicitly provided)
  const sentAtRaw = payload.sentAt || getHeader(input.headers, 'x-webhook-timestamp');
  if (typeof sentAtRaw === 'string' && sentAtRaw.trim()) {
    const parsedTime = Date.parse(sentAtRaw);
    if (!Number.isNaN(parsedTime) && Math.abs(Date.now() - parsedTime) > 48 * 60 * 60 * 1000) {
      return {
        status: 400,
        data: {
          success: false,
          ignored: true,
          error: 'Stale webhook timestamp rejected by replay protection.',
        },
      };
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

  // Resolve canonical owner bKash number (env override -> Firestore settings -> default)
  let expectedOwnerNumber = (
    deps.expectedOwnerNumber ?? process.env.OWNER_BKASH_NUMBER ?? ''
  ).trim();
  if (!expectedOwnerNumber) {
    try {
      const payCfg = await store.getDoc('settings', 'paymentConfig');
      if (payCfg && typeof payCfg.bKashNumber === 'string') {
        expectedOwnerNumber = payCfg.bKashNumber;
      }
    } catch {
      // non-fatal
    }
  }
  if (!expectedOwnerNumber) {
    expectedOwnerNumber = '01767079837';
  }

  const parsed = parseBkashSms(rawText, {
    expectedOwnerNumber,
    smsSenderAddress,
  });

  if (!parsed.valid) {
    return {
      status: 422,
      data: {
        success: false,
        ignored: true,
        error: parsed.reason || 'Malformed or unsupported bKash SMS.',
      },
    };
  }

  const normalizedRawText = String(rawText).trim();
  const rawTextHash = sha256Hex(normalizedRawText);
  if (!deps.bypassReplayCache && isRecentReplayHash(rawTextHash)) {
    return {
      status: 200,
      data: {
        success: true,
        duplicate: true,
        trxId: parsed.trxId,
        message: 'Duplicate SMS webhook event ignored cleanly.',
      },
    };
  }

  const nowIso = new Date().toISOString();
  const safePreview = normalizedRawText.slice(0, 500);

  // Store atomically in Firestore /bkashTransactions/{trxId}; never overwrite an existing record
  const txOutcome = await store.runTransaction(async (tx) => {
    const existing = await tx.get('bkashTransactions', parsed.trxId);
    if (existing) {
      return { duplicate: true, existingStatus: existing.status };
    }

    tx.set('bkashTransactions', parsed.trxId, {
      trxId: parsed.trxId,
      gateway: 'bKash',
      transactionType: parsed.transactionType,
      amount: parsed.amount,
      sender: parsed.sender,
      recipientAccount: parsed.recipientAccount || normalizeBdPhone(expectedOwnerNumber),
      ownerBkashNumber: normalizeBdPhone(expectedOwnerNumber),
      smsTimestamp: parsed.smsTimestamp || '',
      receivedAt: nowIso,
      rawTextHash,
      rawText: safePreview,
      status: 'UNUSED',
      verifiedByWebhook: true,
      usedByOrderId: null,
      usedByUid: null,
      usedByEmail: null,
      redeemedAt: null,
    });

    return { duplicate: false };
  });

  if (txOutcome.duplicate) {
    return {
      status: 200,
      data: {
        success: true,
        duplicate: true,
        trxId: parsed.trxId,
        message: 'Transaction SMS already recorded; duplicate webhook event ignored.',
      },
    };
  }

  return {
    status: 201,
    data: {
      success: true,
      duplicate: false,
      trxId: parsed.trxId,
      amount: parsed.amount,
      transactionType: parsed.transactionType,
      receivedAt: nowIso,
      message: `bKash SMS recorded securely for TrxID ${parsed.trxId}.`,
    },
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
      error: 'Firebase Admin SDK credentials missing on server.',
    });
  }

  const clientIp =
    req.headers?.['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  const result = await processPaymentSmsWebhook({
    headers: req.headers || {},
    body: req.body ?? {},
    clientIp,
  });

  return res.status(result.status).json(result.data);
}

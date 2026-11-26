import { verifyFirebaseIdToken, VerifiedFirebaseToken } from '../auth/session.js';
import { normalizeTrxId } from '../../_lib/bkashSmsParser.js';
import {
  AdminStore,
  createFirebaseAdminStore,
  generateServerLicenseKey,
  isFirebaseAdminConfigured,
} from '../../_lib/firebaseAdmin.js';
import { getServerProductFallback } from '../../_lib/courseCatalog.js';
import {
  SendEmailOptions,
  SendEmailResult,
  classifySmtpError,
  getAdminNotificationEmail,
  isSmtpConfigured,
  sanitizeLogMessage,
  sendEmailBatch,
} from '../../_lib/mailer.js';
import {
  buildOrderVerifiedAccessEmails,
  formatDhakaDateTime,
} from '../../_lib/emailTemplates.js';

export interface AdminApproveInput {
  authorizationHeader?: string;
  body: Record<string, any> | string;
}

export interface AdminApproveDeps {
  store?: AdminStore;
  verifyTokenFn?: (idToken: string) => Promise<VerifiedFirebaseToken>;
  sendEmailBatchFn?: (
    messages: Array<{ options: SendEmailOptions; optional?: boolean }>
  ) => Promise<SendEmailResult[]>;
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

  const retryEmail = payload.retryEmail === true;

  // ==================== MIRRORPOS DESKTOP LICENSE APPROVAL EMAIL ====================
  if (payload.targetType === 'mirrorpos_license') {
    const requestId =
      typeof payload.requestId === 'string'
        ? payload.requestId.trim()
        : typeof payload.orderId === 'string'
        ? payload.orderId.trim()
        : '';
    if (!requestId || requestId.length > 128) {
      return { status: 400, data: { success: false, error: 'Valid requestId is required.' } };
    }

    let licenseStore: AdminStore;
    try {
      licenseStore = deps.store || createFirebaseAdminStore();
    } catch (err: unknown) {
      return {
        status: 503,
        data: {
          success: false,
          error: err instanceof Error ? err.message : 'Firebase Admin SDK not initialized.',
        },
      };
    }

    const reqDoc = await licenseStore.getDoc('mirrorpos_license_requests', requestId);
    if (!reqDoc) {
      return {
        status: 404,
        data: { success: false, error: `MirrorPOS license request ${requestId} not found.` },
      };
    }

    // Security guard: NEVER send paid MirrorPOS access email unless payment & license are verified APPROVED/ACTIVE
    if (reqDoc.paymentStatus !== 'APPROVED' || reqDoc.licenseStatus !== 'ACTIVE') {
      return {
        status: 409,
        data: {
          success: false,
          error: 'Cannot send paid MirrorPOS access email before payment is verified and APPROVED.',
        },
      };
    }

    if (reqDoc.approvalEmailSent === true && !retryEmail) {
      return {
        status: 200,
        data: {
          success: true,
          alreadySent: true,
          duplicateEmailPrevented: true,
          emailSent: true,
          accessEmailSent: true,
          emailDeliveryStatus: 'SENT',
          message: `MirrorPOS license activation email for ${requestId} was already sent.`,
        },
      };
    }

    const customerEmail = String(reqDoc.gmail || '').trim().toLowerCase();
    if (!customerEmail || !customerEmail.includes('@')) {
      return {
        status: 400,
        data: { success: false, error: 'License request does not contain a valid customer email.' },
      };
    }

    const adminEmail = getAdminNotificationEmail();
    const amountNum = Number(reqDoc.amount) || 9999;
    const built = buildOrderVerifiedAccessEmails({
      orderId: requestId,
      productTitle: 'MirrorPOS Desktop Lifetime License',
      amountDisplay: `৳${amountNum.toLocaleString()}`,
      paymentMethod: 'bKash',
      trxId: String(reqDoc.transactionId || ''),
      customerName: String(reqDoc.customerName || 'Customer'),
      customerEmail,
      accessUrl: 'https://mirrorbook.site/mirrorpos',
      verifiedBy: `Admin (${verifiedAdmin.email || verifiedAdmin.uid})`,
      verifiedAt: formatDhakaDateTime(),
      isMirrorPOSLicense: true,
    });

    const batch: Array<{ options: SendEmailOptions; optional?: boolean }> = [
      {
        options: {
          to: customerEmail,
          replyTo: adminEmail,
          subject: built.customerEmail.subject,
          text: built.customerEmail.text,
          html: built.customerEmail.html,
        },
      },
    ];
    if (adminEmail && adminEmail.toLowerCase() !== customerEmail) {
      batch.push({
        optional: true,
        options: {
          to: adminEmail,
          replyTo: customerEmail,
          subject: built.adminEmail.subject,
          text: built.adminEmail.text,
          html: built.adminEmail.html,
        },
      });
    }

    const sendBatch = deps.sendEmailBatchFn || sendEmailBatch;
    const smtpAvailable = Boolean(deps.sendEmailBatchFn) || isSmtpConfigured();
    const attemptAt = new Date().toISOString();
    const prevAttempts = Number(reqDoc.emailDeliveryAttempts || 0);

    try {
      if (!smtpAvailable) {
        throw new Error('Gmail SMTP is not configured.');
      }
      await sendBatch(batch);
      await licenseStore
        .setDoc('mirrorpos_license_requests', requestId, {
          approvalEmailSent: true,
          approvalEmailSentAt: attemptAt,
          emailDeliveryStatus: 'SENT',
          emailDeliveryError: null,
          emailDeliveryAttempts: prevAttempts + 1,
        })
        .catch(() => {});

      return {
        status: 200,
        data: {
          success: true,
          emailSent: true,
          accessEmailSent: true,
          emailDeliveryStatus: 'SENT',
          message: `MirrorPOS Desktop License activation email sent to ${customerEmail}.`,
        },
      };
    } catch (mailErr: unknown) {
      const classified = classifySmtpError(mailErr);
      console.error('[admin-approve] MirrorPOS activation email failed (license remains ACTIVE):', {
        requestId,
        errorCode: classified.errorCode,
        reason: sanitizeLogMessage(classified.message, 200),
      });
      await licenseStore
        .setDoc('mirrorpos_license_requests', requestId, {
          approvalEmailSent: false,
          emailDeliveryStatus: 'FAILED',
          emailDeliveryError: classified.errorCode,
          emailLastAttemptAt: attemptAt,
          emailDeliveryAttempts: prevAttempts + 1,
        })
        .catch(() => {});

      return {
        status: 200,
        data: {
          success: true,
          emailSent: false,
          accessEmailSent: false,
          emailDeliveryStatus: 'FAILED',
          emailErrorCode: classified.errorCode,
          emailWarning:
            'License is ACTIVE in Firestore, but customer confirmation email delivery failed and can be retried safely.',
          message: 'MirrorPOS license is ACTIVE, but confirmation email delivery failed.',
        },
      };
    }
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
        alreadyCompleted: false,
        alreadySentAccessEmail: false,
        payload: { success: false, error: `Order ${orderId} not found.` } as Record<string, any>,
      };
    }

    // Idempotent handling: if already Completed, preserve existing verified record & licenseKey (never regenerate!)
    if (order.status === 'Completed') {
      return {
        httpStatus: 200,
        alreadyCompleted: true,
        alreadySentAccessEmail: order.accessEmailSent === true,
        payload: {
          success: true,
          alreadyCompleted: true,
          order,
          message: `Order ${orderId} is already verified and Completed.`,
        } as Record<string, any>,
      };
    }

    const normalizedTrx = normalizeTrxId(order.trxId);
    if (normalizedTrx) {
      const existingLock = await tx.get('redeemedTrxIds', normalizedTrx);
      if (existingLock && existingLock.orderId && existingLock.orderId !== orderId) {
        return {
          httpStatus: 409,
          alreadyCompleted: false,
          alreadySentAccessEmail: false,
          payload: {
            success: false,
            alreadyUsed: true,
            error: `Transaction ID ${normalizedTrx} was already redeemed by Order ${existingLock.orderId}.`,
          } as Record<string, any>,
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
        alreadyCompleted: false,
        alreadySentAccessEmail: false,
        payload: {
          success: false,
          error:
            'No protected download URL is configured for this product in productSecrets. Add the Google Drive link in Manage Products first.',
        } as Record<string, any>,
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
      alreadyCompleted: false,
      alreadySentAccessEmail: false,
      payload: {
        success: true,
        order: updatedOrder,
        message: `Order ${orderId} approved as Completed via Admin SDK.`,
      } as Record<string, any>,
    };
  });

  if (txResult.httpStatus !== 200 || !txResult.payload.success || !txResult.payload.order) {
    return {
      status: txResult.httpStatus,
      data: txResult.payload,
    };
  }

  const verifiedOrder = txResult.payload.order as Record<string, any>;

  // Duplicate access email guard: skip resending if already sent unless explicit retryEmail is requested
  if (txResult.alreadySentAccessEmail && !retryEmail) {
    return {
      status: 200,
      data: {
        ...txResult.payload,
        duplicateEmailPrevented: true,
        emailSent: true,
        accessEmailSent: true,
        emailDeliveryStatus: 'SENT',
      },
    };
  }

  // ==================== POST-COMMIT CUSTOMER ACCESS EMAIL ====================
  // Verified order is already durably committed above. SMTP errors NEVER roll back verification.
  const customerEmail = String(verifiedOrder.customerEmail || '').trim().toLowerCase();
  const adminEmail = getAdminNotificationEmail();
  const sendBatch = deps.sendEmailBatchFn || sendEmailBatch;
  const smtpAvailable = Boolean(deps.sendEmailBatchFn) || isSmtpConfigured();
  const prevAttempts = Number(verifiedOrder.emailDeliveryAttempts || 0);
  const emailAttemptAt = new Date().toISOString();

  if (!customerEmail || !customerEmail.includes('@')) {
    return {
      status: 200,
      data: {
        ...txResult.payload,
        emailSent: false,
        accessEmailSent: false,
        emailDeliveryStatus: 'SKIPPED_INVALID_EMAIL',
        emailWarning: 'Order verified, but customer email address is missing or invalid.',
      },
    };
  }

  const built = buildOrderVerifiedAccessEmails({
    orderId,
    productTitle: String(verifiedOrder.itemName || 'MirrorBook Digital Product'),
    amountDisplay:
      String(verifiedOrder.itemPrice || '') ||
      `৳${Number(verifiedOrder.canonicalAmount || 0).toLocaleString()}`,
    paymentMethod: String(verifiedOrder.paymentMethod || 'bKash'),
    trxId: String(verifiedOrder.trxId || 'N/A'),
    customerName: String(verifiedOrder.customerName || 'Customer'),
    customerEmail,
    accessUrl: String(verifiedOrder.downloadUrl || ''),
    licenseKey: String(verifiedOrder.licenseKey || ''),
    verifiedBy: `Admin (${verifiedAdmin.email || verifiedAdmin.uid})`,
    verifiedAt: formatDhakaDateTime(),
  });

  const batch: Array<{ options: SendEmailOptions; optional?: boolean }> = [
    {
      options: {
        to: customerEmail,
        replyTo: adminEmail,
        subject: built.customerEmail.subject,
        text: built.customerEmail.text,
        html: built.customerEmail.html,
      },
    },
  ];
  if (adminEmail && adminEmail.toLowerCase() !== customerEmail) {
    batch.push({
      optional: true,
      options: {
        to: adminEmail,
        replyTo: customerEmail,
        subject: built.adminEmail.subject,
        text: built.adminEmail.text,
        html: built.adminEmail.html,
      },
    });
  }

  try {
    if (!smtpAvailable) {
      throw new Error('Gmail SMTP is not configured.');
    }
    await sendBatch(batch);
    const emailMeta = {
      emailDeliveryStatus: 'SENT',
      accessEmailSent: true,
      accessEmailSentAt: emailAttemptAt,
      emailDeliveryError: null,
      emailDeliveryAttempts: prevAttempts + 1,
    };
    await store.setDoc('orders', orderId, emailMeta).catch(() => {});
    Object.assign(verifiedOrder, emailMeta);

    return {
      status: 200,
      data: {
        ...txResult.payload,
        order: verifiedOrder,
        emailSent: true,
        accessEmailSent: true,
        emailDeliveryStatus: 'SENT',
        message: txResult.alreadyCompleted
          ? `Order ${orderId} was already verified; customer access email delivered successfully.`
          : `Order ${orderId} approved as Completed and customer access email sent.`,
      },
    };
  } catch (mailErr: unknown) {
    const classified = classifySmtpError(mailErr);
    console.error('[admin-approve] Verified order access email failed (verified payment preserved):', {
      orderId,
      errorCode: classified.errorCode,
      reason: sanitizeLogMessage(classified.message, 200),
    });
    const emailMeta = {
      emailDeliveryStatus: 'FAILED',
      accessEmailSent: false,
      emailDeliveryError: classified.errorCode,
      emailLastAttemptAt: emailAttemptAt,
      emailDeliveryAttempts: prevAttempts + 1,
    };
    await store.setDoc('orders', orderId, emailMeta).catch(() => {});
    Object.assign(verifiedOrder, emailMeta);

    return {
      status: 200,
      data: {
        ...txResult.payload,
        order: verifiedOrder,
        emailSent: false,
        accessEmailSent: false,
        emailDeliveryStatus: 'FAILED',
        emailErrorCode: classified.errorCode,
        emailWarning:
          'Payment is verified and saved safely, but customer access email delivery failed. You can safely retry approval to resend only the email without regenerating credentials.',
      },
    };
  }
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

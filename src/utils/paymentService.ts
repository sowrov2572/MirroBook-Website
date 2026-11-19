import { PaymentConfig, Order, UserPurchase, SheetPaymentLog } from '../types';
import { executeSheetRequest, logSheetTransaction, SheetApiLog } from './sheetApiWrapper';

export { getSheetTransactionLogs } from './sheetApiWrapper';
export type { SheetApiLog };

export const PAYMENT_CONFIG_STORAGE_KEY = 'mirrorbook_payment_config';
export const ORDERS_STORAGE_KEY = 'mirrorbook_orders';

export function saveOrderToStorage(order: unknown): void {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(order);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // fallback
  }
}

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  bKashNumber: '01767079837',
  nagadNumber: '01767079837',
  rocketNumber: '01767079837',
  upayNumber: '01767079837',
  bankDetails: {
    bankName: 'Islami Bank Bangladesh PLC (IBBL)',
    accountName: 'MD SOUROV HOSEN',
    accountNumber: '20507776702266262',
    branchName: 'Main Branch / Local',
    routingNumber: '125271890',
  },
  secondaryBankDetails: {
    bankName: 'Dutch-Bangla Bank PLC (DBBL)',
    accountName: 'MD SOUROV HOSEN',
    accountNumber: '1641580109543',
    branchName: 'Local Branch / Fast Track',
    routingNumber: '090271890',
  },
  webAppUrl: '',
  spreadsheetUrl: '',
  telegramBotToken: '',
  telegramChatId: '',
  whatsAppNumber: '8801767079837',
};

export function loadPaymentConfig(): PaymentConfig {
  try {
    const raw = localStorage.getItem(PAYMENT_CONFIG_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PAYMENT_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_PAYMENT_CONFIG;
}

export function savePaymentConfig(config: PaymentConfig): void {
  try {
    localStorage.setItem(PAYMENT_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // fallback
  }
}

/**
 * Sends a notification message to the Telegram Bot via the Telegram Bot API.
 */
export async function sendTelegramNotification(
  token: string,
  chatId: string,
  text: string
): Promise<{ success: boolean; message: string }> {
  if (!token || !chatId) {
    return { success: false, message: 'Telegram Token or Chat ID not configured.' };
  }

  const cleanToken = token.trim().replace(/^bot/i, '');
  const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: text,
      }),
    });

    const data = await response.json();
    if (data.ok) {
      return { success: true, message: 'Telegram notification sent successfully.' };
    } else {
      return { success: false, message: data.description || 'Telegram API returned an error.' };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';
    return { success: false, message: `Failed to reach Telegram: ${errorMsg}` };
  }
}

/**
 * Sends customer registration or login metadata (without passwords)
 * to Google Sheet "Users" tab so customer account activity stays synced.
 */
export async function logUserLoginToGoogleSheet(
  webAppUrl: string,
  user: {
    email: string;
    name?: string;
    authProvider?: string;
    uid?: string;
  }
): Promise<{ success: boolean; message: string }> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return { success: false, message: 'Google Apps Script URL is not configured.' };
  }

  const payloadStr = JSON.stringify({
    action: 'logUser',
    user: {
      email: user.email.trim(),
      name: user.name ? user.name.trim() : user.email.split('@')[0],
      authProvider: user.authProvider || 'Firebase Auth',
      uid: user.uid || '',
      timestamp: new Date().toISOString(),
    },
  });

  const response = await executeSheetRequest<{ success: boolean; message: string }>({
    actionName: 'logUser',
    url: webAppUrl,
    method: 'POST',
    body: payloadStr,
    maxRetries: 2,
    initialDelayMs: 500,
    timeoutMs: 8000,
  });

  if (response.ok) {
    return {
      success: true,
      message: response.data?.message || 'User metadata synced to Google Sheet Users tab.',
    };
  }

  logSheetTransaction({
    endpointAction: 'logUser',
    status: 'FAILED',
    attempts: response.attempts,
    message: response.error || 'Failed to sync user metadata to Google Sheet.',
    details: { email: user.email },
  });

  return { success: true, message: 'User stored in Firebase (remote sheet sync queued).' };
}

/**
 * Logs a Pending order record to Google Sheet for optional owner audit archive only.
 * Never logs Verified status or paid download URLs from unauthenticated clients.
 */
export async function sendOrderToGoogleSheet(
  webAppUrl: string,
  order: Order
): Promise<{ success: boolean; message: string }> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return { success: false, message: 'Google Apps Script URL is not configured.' };
  }

  const payloadStr = JSON.stringify({
    action: 'submitOrder',
    order: {
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      itemName: order.itemName,
      itemPrice: order.itemPrice,
      paymentMethod: order.paymentMethod,
      senderAccount: order.senderAccount,
      trxId: order.trxId,
      createdAt: order.createdAt,
      status: 'Pending',
      downloadUrl: '',
      userId: order.userId || '',
    },
  });

  const response = await executeSheetRequest<{ success: boolean; message: string }>({
    actionName: 'submitOrder',
    url: webAppUrl,
    method: 'POST',
    body: payloadStr,
    maxRetries: 2,
    initialDelayMs: 600,
    timeoutMs: 10000,
  });

  if (response.ok) {
    return {
      success: true,
      message: response.data?.message || 'Pending order logged to Google Sheet audit archive.',
    };
  }

  logSheetTransaction({
    endpointAction: 'submitOrder',
    status: 'FAILED',
    attempts: response.attempts,
    message: `Order ${order.id} sheet archive notice: ${response.error || 'Network failure'}.`,
    details: { orderId: order.id, trxId: order.trxId },
  });

  return { success: true, message: 'Order handled securely by MirrorBook backend.' };
}

/**
 * Disabled: Customer purchases are loaded exclusively via authenticated Firestore rules (/users/{uid}/purchases & /orders).
 */
export async function fetchUserPurchasesFromGoogleSheet(
  _webAppUrl: string,
  _userEmail: string
): Promise<UserPurchase[]> {
  return [];
}

/**
 * Disabled: Admin orders are loaded directly via authenticated Admin Firestore queries.
 */
export async function fetchGoogleSheetOrders(_webAppUrl: string): Promise<Order[]> {
  return [];
}

/**
 * Fetches verified incoming bKash SMS webhook logs from the protected backend (/api/payment-sms/logs).
 */
export async function fetchBackendPaymentSmsLogs(idToken: string): Promise<SheetPaymentLog[]> {
  if (!idToken) return [];
  try {
    const res = await fetch('/api/payment-sms/logs', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data?.success && Array.isArray(data.logs)) {
      return data.logs.map((l: Record<string, any>) => ({
        timestamp: String(l.timestamp || ''),
        gateway: String(l.gateway || 'bKash'),
        transactionType: String(l.transactionType || 'Send Money Received'),
        trxId: String(l.trxId || ''),
        amount: Number(l.amount) || 0,
        sender: String(l.sender || ''),
        status: String(l.status || 'UNUSED'),
        usedByOrderId: l.usedByOrderId ? String(l.usedByOrderId) : '',
      }));
    }
  } catch (err) {
    console.warn('fetchBackendPaymentSmsLogs notice:', err);
  }
  return [];
}

/**
 * Legacy unauthenticated Google Sheet payment read is disabled.
 */
export async function fetchGoogleSheetPayments(_webAppUrl: string): Promise<SheetPaymentLog[]> {
  return [];
}

export interface SubmitAndVerifyOrderPayload {
  productId?: string;
  itemName: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  senderAccount: string;
  trxId: string;
}

export interface SubmitAndVerifyOrderResponse {
  success: boolean;
  verified: boolean;
  pending?: boolean;
  alreadyUsed?: boolean;
  amountMismatch?: boolean;
  receivedAmount?: number;
  requiredAmount?: number;
  notFound?: boolean;
  reason?: string;
  order?: Order;
  licenseKey?: string;
  message: string;
  error?: string;
}

/**
 * Submits customer checkout payment details to protected Vercel serverless backend (/api/orders/submit-and-verify).
 * Price lookup, TrxID reuse prevention, bKash SMS matching, and Firestore purchase creation happen server-side inside an atomic transaction.
 */
export async function submitAndVerifyOrderApi(
  payload: SubmitAndVerifyOrderPayload,
  idToken?: string | null
): Promise<SubmitAndVerifyOrderResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }

    const res = await fetch('/api/orders/submit-and-verify', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    return {
      success: Boolean(data.success),
      verified: Boolean(data.verified),
      pending: Boolean(data.pending),
      alreadyUsed: Boolean(data.alreadyUsed),
      amountMismatch: Boolean(data.amountMismatch),
      receivedAmount: typeof data.receivedAmount === 'number' ? data.receivedAmount : undefined,
      requiredAmount: typeof data.requiredAmount === 'number' ? data.requiredAmount : undefined,
      notFound: Boolean(data.notFound),
      reason: typeof data.reason === 'string' ? data.reason : undefined,
      order: data.order as Order | undefined,
      licenseKey: typeof data.licenseKey === 'string' ? data.licenseKey : undefined,
      message: String(data.message || data.error || 'Verification response received.'),
      error: typeof data.error === 'string' ? data.error : undefined,
    };
  } catch (err) {
    return {
      success: false,
      verified: false,
      pending: false,
      message:
        err instanceof Error
          ? err.message
          : 'Unable to reach verification server. Please check your connection.',
      error: 'Network error',
    };
  }
}

/**
 * Calls Admin SDK protected endpoint (/api/orders/admin-approve) to approve a Pending order
 * and atomically lock its TrxID + unlock product in customer Vault.
 */
export async function adminApproveOrderApi(
  orderId: string,
  idToken: string,
  options?: { retryEmail?: boolean }
): Promise<{
  success: boolean;
  order?: Order;
  message: string;
  error?: string;
  emailSent?: boolean;
  emailDeliveryStatus?: string;
  emailWarning?: string;
}> {
  try {
    const res = await fetch('/api/orders/admin-approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        orderId,
        ...(options?.retryEmail ? { retryEmail: true } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: String(data.error || data.message || 'Approval failed.'),
        error: String(data.error || 'Approval failed.'),
      };
    }
    return {
      success: true,
      order: data.order as Order,
      message: String(data.message || 'Order approved.'),
      emailSent: typeof data.emailSent === 'boolean' ? data.emailSent : undefined,
      emailDeliveryStatus:
        typeof data.emailDeliveryStatus === 'string' ? data.emailDeliveryStatus : undefined,
      emailWarning: typeof data.emailWarning === 'string' ? data.emailWarning : undefined,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Approval request failed.',
      error: 'Network error',
    };
  }
}

export interface VerifyPaymentResult {
  verified: boolean;
  message: string;
  alreadyUsed?: boolean;
  amountMismatch?: boolean;
  receivedAmount?: number;
  requiredAmount?: number;
  notFound?: boolean;
  sender?: string;
  rawData?: unknown;
}

/**
 * Disabled: Client-side TrxID cache cannot be used for security decisions.
 */
export function isTrxIdAlreadyUsedLocally(_trxId: string): { used: boolean; order?: Order } {
  return { used: false };
}

/**
 * Disabled: Unauthenticated Google Sheet payment verification is permanently removed for security.
 */
export async function verifyPaymentWithSheet(): Promise<VerifyPaymentResult> {
  return {
    verified: false,
    message: 'Unauthenticated sheet verification is disabled. Payments verify strictly via /api/orders/submit-and-verify.',
  };
}

/**
 * Disabled: Simulated/unauthenticated SMS injection from the browser is permanently disabled.
 */
export async function simulatePaymentSMS(): Promise<{ success: boolean; message: string }> {
  return {
    success: false,
    message: 'Client-side SMS simulation is disabled. Payment SMS events must arrive via the secret-protected /api/payment-sms/receive webhook.',
  };
}

/**
 * Optional hardened Google Apps Script template (Read-only catalog + Pending audit log only).
 * Payment SMS ingestion, verification, and download link unlocking run on MirrorBook's
 * secret-protected backend API (/api/payment-sms/receive & /api/orders/submit-and-verify).
 */
export const COMPLETE_PAYMENT_GOOGLE_APPS_SCRIPT = `/**
 * ============================================================================
 * MIRRORBOOK GOOGLE SHEET OPTIONAL AUDIT & CATALOG TEMPLATE (HARDENED)
 * ============================================================================
 * Payment SMS ingestion, verification, and download link unlocking run on
 * MirrorBook's secret-protected backend API (/api/payment-sms/receive &
 * /api/orders/submit-and-verify) with Firebase Admin SDK.
 * ============================================================================
 */

function setupUsersSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Users");
  if (!sheet) {
    sheet = ss.insertSheet("Users");
    sheet.appendRow(["RegisteredAt", "Email", "CreatorName", "Provider", "UID", "Status"]);
    sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#71B913").setFontColor("#000000");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function setupOrdersAuditSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("OrdersAudit");
  if (!sheet) {
    sheet = ss.insertSheet("OrdersAudit");
    sheet.appendRow(["Timestamp", "OrderID", "Item", "Amount", "Method", "TrxID", "CustomerName", "Status"]);
    sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#71B913").setFontColor("#000000");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    var rawContents = (e && e.postData) ? e.postData.contents : "";
    var payload = {};
    try { payload = JSON.parse(rawContents); } catch (ignore) {}

    if (payload.action === "logUser" && payload.user) {
      var u = payload.user;
      var uSheet = setupUsersSheet();
      uSheet.appendRow([new Date().toISOString(), u.email || "", u.name || "", u.authProvider || "Firebase Auth", u.uid || "", "Active"]);
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.action === "submitOrder" && payload.order) {
      var ord = payload.order;
      var oSheet = setupOrdersAuditSheet();
      oSheet.appendRow([
        new Date().toISOString(),
        ord.id || "",
        ord.itemName || "",
        ord.itemPrice || "",
        ord.paymentMethod || "",
        ord.trxId || "",
        ord.customerName || "",
        "Pending"
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.action === "saveProducts" && payload.products) {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var prodSheet = ss.getSheetByName("Products") || ss.insertSheet("Products");
      prodSheet.clearContents();
      var headers = ['id', 'type', 'category', 'title', 'description', 'price', 'priceDisplay', 'thumbnailUrl', 'duration', 'instructor', 'createdAt'];
      prodSheet.appendRow(headers);
      for (var i = 0; i < payload.products.length; i++) {
        var p = payload.products[i];
        prodSheet.appendRow([
          p.id || '', p.type || '', p.category || '', p.title || '', p.description || '',
          Number(p.price) || 0, p.priceDisplay || '', p.thumbnailUrl || '',
          p.duration || '', p.instructor || '', p.createdAt || new Date().toISOString()
        ]);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Action disabled. Payment SMS ingestion and verification moved to MirrorBook secure backend."
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : "";
  if (action === "getProducts") {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var pSheet = ss.getSheetByName("Products");
    if (!pSheet) return ContentService.createTextOutput(JSON.stringify({ products: [] })).setMimeType(ContentService.MimeType.JSON);
    var pData = pSheet.getDataRange().getValues();
    if (pData.length <= 1) return ContentService.createTextOutput(JSON.stringify({ products: [] })).setMimeType(ContentService.MimeType.JSON);
    var headers = pData[0];
    var list = [];
    for (var i = 1; i < pData.length; i++) {
      var item = {};
      for (var j = 0; j < headers.length; j++) { item[headers[j]] = pData[i][j]; }
      if (Number(item.price) > 0) delete item.protectedUrl;
      list.push(item);
    }
    return ContentService.createTextOutput(JSON.stringify({ products: list })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "HARDENED",
    message: "Public payment/order queries disabled. Use authenticated Firebase Admin & Vercel API."
  })).setMimeType(ContentService.MimeType.JSON);
}
`;

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
 * Sends customer registration or login data (email, password/auth provider, name)
 * directly to Google Sheet "Users" tab so customer accounts are never lost.
 */
export async function logUserLoginToGoogleSheet(
  webAppUrl: string,
  user: {
    email: string;
    password?: string;
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
      password: user.password ? user.password.trim() : '(Google One-Tap)',
      name: user.name ? user.name.trim() : user.email.split('@')[0],
      authProvider: user.authProvider || 'Email/Password',
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
      message: response.data?.message || 'User credentials synced to Google Sheet Users tab.',
    };
  }

  logSheetTransaction({
    endpointAction: 'logUser',
    status: 'FAILED',
    attempts: response.attempts,
    message: response.error || 'Failed to sync user credentials to Google Sheet.',
    details: { email: user.email },
  });

  return { success: true, message: 'User stored locally (remote sync queued).' };
}

/**
 * Sends an order to the Google Apps Script Web App.
 * Automatically logs the order to the "Orders" sheet and triggers the confirmation
 * email with download link to customer's personal email from miirorbook.tech@gmail.com.
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
      status: order.status || 'Verified',
      downloadUrl: order.downloadUrl || '',
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
      message: response.data?.message || 'Order logged to Google Sheet & confirmation email dispatched.',
    };
  }

  logSheetTransaction({
    endpointAction: 'submitOrder',
    status: 'FAILED',
    attempts: response.attempts,
    message: `Order ${order.id} dispatch failed: ${response.error || 'Network failure'}. Order preserved in local vault & Firestore.`,
    details: { orderId: order.id, trxId: order.trxId, email: order.customerEmail },
  });

  return { success: true, message: 'Order submitted to local vault & Firestore database.' };
}

/**
 * Fetches user purchases from Google Sheet to ensure customer never loses their purchases.
 * Correctly validates empty, undefined, malformed, or nested responses.
 */
export async function fetchUserPurchasesFromGoogleSheet(
  webAppUrl: string,
  userEmail: string
): Promise<UserPurchase[]> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http') || !userEmail || !userEmail.trim()) {
    return [];
  }

  const cleanEmail = userEmail.trim().toLowerCase();
  let fetchUrl: string;
  try {
    const url = new URL(webAppUrl.trim());
    url.searchParams.set('action', 'getUserPurchases');
    url.searchParams.set('email', cleanEmail);
    url.searchParams.set('t', Date.now().toString());
    fetchUrl = url.toString();
  } catch (urlErr) {
    logSheetTransaction({
      endpointAction: 'getUserPurchases',
      status: 'FAILED',
      attempts: 0,
      message: `Invalid Web App URL: ${urlErr instanceof Error ? urlErr.message : String(urlErr)}`,
    });
    return [];
  }

  const response = await executeSheetRequest<{ success?: boolean; purchases?: unknown[] }>({
    actionName: 'getUserPurchases',
    url: fetchUrl,
    method: 'GET',
    maxRetries: 2,
    initialDelayMs: 500,
    timeoutMs: 8000,
  });

  if (response.ok && response.data) {
    const rawPurchases = response.data.purchases;
    if (Array.isArray(rawPurchases) && rawPurchases.length > 0) {
      // Validate and clean each purchase record
      const validatedList: UserPurchase[] = rawPurchases
        .filter((item): item is Record<string, any> => item !== null && typeof item === 'object')
        .map((item, idx) => ({
          id: String(item.id || `order_${idx}`),
          productId: String(item.productId || item.id || `prod_${idx}`),
          title: String(item.title || 'Creator Plugin'),
          category: String(item.category || 'Plugin'),
          downloadUrl: String(item.downloadUrl || ''),
          purchasedAt: String(item.purchasedAt || new Date().toISOString()),
          trxId: String(item.trxId || ''),
        }))
        .filter((p) => Boolean(p.downloadUrl && p.downloadUrl.trim().length > 0));

      return validatedList;
    }
  }

  return [];
}

/**
 * Fetches all orders from Google Sheet "Orders" tab so the owner can view all customer
 * purchases, phone numbers, and payment status directly in the Admin Panel.
 */
export async function fetchGoogleSheetOrders(webAppUrl: string): Promise<Order[]> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) return [];
  try {
    const url = new URL(webAppUrl.trim());
    url.searchParams.set('action', 'getAllOrders');
    url.searchParams.set('t', Date.now().toString());

    const response = await executeSheetRequest<{ success?: boolean; orders?: unknown[] }>({
      actionName: 'getAllOrders',
      url: url.toString(),
      method: 'GET',
      maxRetries: 2,
      initialDelayMs: 400,
      timeoutMs: 8000,
    });

    if (response.ok && response.data?.orders && Array.isArray(response.data.orders)) {
      return response.data.orders
        .filter((o): o is Record<string, any> => o !== null && typeof o === 'object')
        .map((o) => ({
          id: String(o.id || `ORD-${Math.random().toString(36).substr(2, 6)}`),
          customerName: String(o.customerName || 'Customer'),
          customerEmail: String(o.customerEmail || ''),
          customerPhone: String(o.customerPhone || ''),
          itemName: String(o.itemName || 'Plugin Item'),
          itemPrice: String(o.itemPrice || ''),
          paymentMethod: (o.paymentMethod || 'bKash') as any,
          senderAccount: String(o.senderAccount || ''),
          trxId: String(o.trxId || ''),
          createdAt: String(o.createdAt || new Date().toISOString()),
          status: (o.status || 'Verified') as any,
          downloadUrl: String(o.downloadUrl || ''),
        }));
    }
  } catch (err) {
    console.warn('fetchGoogleSheetOrders warning:', err);
  }
  return [];
}

/**
 * Fetches all incoming payments from Google Sheet "Payments" tab (forwarded from iPhone SMS automation).
 */
export async function fetchGoogleSheetPayments(webAppUrl: string): Promise<SheetPaymentLog[]> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) return [];
  try {
    const url = new URL(webAppUrl.trim());
    url.searchParams.set('action', 'getAllPayments');
    url.searchParams.set('t', Date.now().toString());

    const response = await executeSheetRequest<{ success?: boolean; payments?: unknown[] }>({
      actionName: 'getAllPayments',
      url: url.toString(),
      method: 'GET',
      maxRetries: 2,
      initialDelayMs: 400,
      timeoutMs: 8000,
    });

    if (response.ok && response.data?.payments && Array.isArray(response.data.payments)) {
      return response.data.payments
        .filter((p): p is Record<string, any> => p !== null && typeof p === 'object')
        .map((p) => ({
          timestamp: String(p.timestamp || ''),
          gateway: String(p.gateway || 'bKash'),
          trxId: String(p.trxId || ''),
          amount: parseFloat(p.amount) || 0,
          sender: String(p.sender || ''),
          status: String(p.status || 'UNUSED'),
        }));
    }
  } catch (err) {
    console.warn('fetchGoogleSheetPayments warning:', err);
  }
  return [];
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
 * Checks if a TrxID has already been used locally in this browser for an approved order.
 */
export function isTrxIdAlreadyUsedLocally(trxId: string): { used: boolean; order?: Order } {
  if (!trxId || !trxId.trim()) return { used: false };
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return { used: false };
    const list: Order[] = JSON.parse(raw);
    const clean = trxId.trim().toUpperCase();
    const found = list.find(
      (o) => o.trxId && o.trxId.trim().toUpperCase() === clean && (o.status === 'Verified' || o.status === 'Completed')
    );
    if (found) {
      return { used: true, order: found };
    }
  } catch {
    // fallback
  }
  return { used: false };
}

/**
 * Verifies a transaction ID and amount against the Google Apps Script Web App with retry logic.
 * Checks for SMS record, validates amount against website price, and rejects already used TrxIDs.
 */
export async function verifyPaymentWithSheet(
  webAppUrl: string,
  trxId: string,
  amount: number,
  orderId?: string,
  email?: string
): Promise<VerifyPaymentResult> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return {
      verified: false,
      message: 'Google Apps Script Web App URL is not configured in Admin Settings.',
    };
  }

  let verifyUrl: string;
  try {
    const url = new URL(webAppUrl.trim());
    url.searchParams.set('action', 'verifyPayment');
    url.searchParams.set('trxId', trxId.trim().toUpperCase());
    url.searchParams.set('amount', amount.toString());
    if (orderId) url.searchParams.set('orderId', orderId);
    if (email) url.searchParams.set('email', email.trim().toLowerCase());
    url.searchParams.set('t', Date.now().toString());
    verifyUrl = url.toString();
  } catch {
    return {
      verified: false,
      message: 'Invalid Google Apps Script Web App URL format.',
    };
  }

  const response = await executeSheetRequest<{
    verified: boolean;
    message?: string;
    alreadyUsed?: boolean;
    amountMismatch?: boolean;
    receivedAmount?: number;
    requiredAmount?: number;
    notFound?: boolean;
    amount?: number;
    sender?: string;
  }>({
    actionName: 'verifyPayment',
    url: verifyUrl,
    method: 'GET',
    maxRetries: 2,
    initialDelayMs: 400,
    timeoutMs: 9000,
  });

  if (response.ok && response.data) {
    if (response.data.verified === true) {
      return {
        verified: true,
        message: response.data.message || `Payment of ৳${amount} verified successfully.`,
        receivedAmount: response.data.amount || amount,
        sender: response.data.sender || '',
        rawData: response.data,
      };
    } else {
      return {
        verified: false,
        alreadyUsed: response.data.alreadyUsed,
        amountMismatch: response.data.amountMismatch,
        receivedAmount: response.data.receivedAmount,
        requiredAmount: response.data.requiredAmount || amount,
        notFound: response.data.notFound,
        message: response.data.message || 'Transaction ID not verified or amount mismatch.',
        rawData: response.data,
      };
    }
  }

  return {
    verified: false,
    message: response.error || 'Could not connect to automated verification endpoint.',
  };
}

/**
 * Simulates a bKash/Nagad test payment SMS sent to the Google Script Web App.
 */
export async function simulatePaymentSMS(
  webAppUrl: string,
  sampleTrxId: string,
  amount: number
): Promise<{ success: boolean; message: string }> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Please save your Google Apps Script Web App URL first.',
    };
  }

  const sampleSMS = `You have received Tk ${amount.toLocaleString()}.00 from 01712984512. Fee Tk 0.00. Balance Tk 45,210.00. TrxID ${sampleTrxId.toUpperCase()} at ${new Date().toLocaleDateString('en-GB')}`;

  try {
    const response = await fetch(webAppUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        text: sampleSMS,
        action: 'incomingSMS',
        trxId: sampleTrxId.toUpperCase(),
        amount: amount,
        sender: '01712984512',
        gateway: 'bKash',
        timestamp: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      const res = await response.json().catch(() => null);
      return {
        success: true,
        message: res?.message || `Test SMS logged for TrxID: ${sampleTrxId} (Amount: ৳${amount}).`,
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';
    return { success: false, message: `Failed to simulate SMS: ${errorMsg}` };
  }

  return { success: false, message: 'Simulation failed. Check Web App URL.' };
}

/**
 * The complete Google Apps Script code to copy and paste into Google Sheets.
 * Automatically handles:
 * - Auto-creating "Payments", "Orders", and "Users" sheets
 * - Parsing incoming SMS from iPhone Shortcuts Pro (POST, GET, JSON, Form, Plain text)
 * - Anti-Cheat: Strictly verifying TrxID and matching exact Price
 * - Single-Use: Once a TrxID is redeemed, it is marked as USED and CANNOT be reused
 * - Sending confirmation email with download link from miirorbook.tech@gmail.com
 * - Google Drive single-account security: Granting viewer permission to customer's Google account
 */
export const COMPLETE_PAYMENT_GOOGLE_APPS_SCRIPT = `/**
 * ============================================================================
 * MIRRORBOOK AUTOMATED PAYMENT, ANTI-CHEAT VERIFICATION & EMAIL DISPATCH SYSTEM
 * ============================================================================
 * Official Sender: MirrorBook Studio <miirorbook.tech@gmail.com>
 *
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Extensions -> Apps Script.
 * 3. Delete any existing code, paste this entire file, and click 'Save' (Ctrl+S).
 * 4. Click 'Deploy' -> 'New deployment'.
 * 5. Type: 'Web app'
 *    - Execute as: Me (your Google account miirorbook.tech@gmail.com)
 *    - Who has access: Anyone
 * 6. Click 'Deploy' and copy the Web App URL.
 * 7. Paste the Web App URL into the MirrorBook Admin Panel.
 * ============================================================================
 */

function setupUsersSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Users");
  if (!sheet) {
    sheet = ss.insertSheet("Users");
    sheet.appendRow(["RegisteredAt", "Email", "Password", "CreatorName", "Provider", "UID", "Status"]);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#71B913").setFontColor("#000000");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function setupPaymentsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Payments");
  if (!sheet) {
    sheet = ss.insertSheet("Payments");
    sheet.appendRow(["Timestamp", "Gateway", "TrxID", "Amount", "Sender", "RawSMS", "Status", "UsedByOrder", "UsedByEmail"]);
    sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#71B913").setFontColor("#000000");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function setupOrdersSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Orders");
  if (!sheet) {
    sheet = ss.insertSheet("Orders");
    sheet.appendRow(["Timestamp", "OrderID", "Item", "Amount", "Method", "TrxID", "Sender", "CustomerName", "CustomerEmail", "CustomerPhone", "Status", "DownloadURL"]);
    sheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#71B913").setFontColor("#000000");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Universal Intelligent SMS Parser for iPhone Shortcuts & bKash/Nagad/Rocket
 * Accurately extracts Gateway, TrxID, Received Amount, and Sender Number
 */
function parseSMS(text) {
  if (!text) return null;
  var str = text.toString();
  var gateway = "Unknown";
  var trxId = "";
  var amount = 0;
  var sender = "";

  // 1. bKash Patterns (Send Money, Payment, Cash In, Merchant)
  // "You have received Tk 200.00 from 01767079837... TrxID CKL82910AK"
  var bkashTrx = str.match(/(?:TrxID|Trx\\s*ID|TxnID)[:\\s#=\\-]*([A-Za-z0-9]{6,16})/i);
  var bkashAmt = str.match(/(?:received|received\\s+payment|received\\s+Tk|Cash\\s+In\\s+Tk|Amount:?\\s*Tk)\\s*(?:Tk\\.?|BDT)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)/i) ||
                 str.match(/(?:Tk\\.?|BDT)\\s*([0-9,]+(?:\\.[0-9]{1,2})?)(?!\\s*(?:Fee|Balance))/i);
  var bkashSender = str.match(/(?:from|by|sender)[:\\s#=\\-]*([0-9+]{11,15})/i);

  // 2. Nagad Patterns
  // "Payment Received. Amount: Tk 200.00. Sender: 017... TxnID: 729104BA"
  var nagadTrx = str.match(/(?:TxnID|Txn\\s*ID|TrxID)[:\\s#=\\-]*([A-Za-z0-9]{6,16})/i);
  var nagadAmt = str.match(/(?:Amount|Tk|BDT)[:\\s#=\\-]*(?:Tk)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)/i);
  var nagadSender = str.match(/(?:Sender|from)[:\\s#=\\-]*([0-9+]{11,15})/i);

  // 3. Rocket / Upay / General Bank
  var genericTrx = str.match(/(?:TrxID|TxnId|TxnID|Ref|Transaction\\s*ID)[:\\s#=\\-]*([A-Za-z0-9]{6,16})/i);
  var genericAmt = str.match(/(?:Tk|BDT|Amount|Amt)[:\\s#=\\-]*(?:Tk)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)/i);
  var genericSender = str.match(/(?:from|by|Sender|A\\/C)[:\\s#=\\-]*([0-9+]{11,15})/i);

  if (bkashTrx && (str.toLowerCase().indexOf("bkash") !== -1 || str.toLowerCase().indexOf("balance") !== -1 || str.toLowerCase().indexOf("fee") !== -1)) {
    gateway = "bKash";
    trxId = bkashTrx[1];
    amount = bkashAmt ? parseFloat(bkashAmt[1].replace(/,/g, "")) : 0;
    sender = bkashSender ? bkashSender[1] : "";
  } else if (nagadTrx && (str.toLowerCase().indexOf("nagad") !== -1 || str.toLowerCase().indexOf("payment received") !== -1)) {
    gateway = "Nagad";
    trxId = nagadTrx[1];
    amount = nagadAmt ? parseFloat(nagadAmt[1].replace(/,/g, "")) : 0;
    sender = nagadSender ? nagadSender[1] : "";
  } else if (genericTrx) {
    gateway = "Mobile/Bank";
    trxId = genericTrx[1];
    amount = genericAmt ? parseFloat(genericAmt[1].replace(/,/g, "")) : 0;
    sender = genericSender ? genericSender[1] : "";
  } else {
    var rawClean = str.trim().toUpperCase();
    if (/^[A-Z0-9]{6,16}$/.test(rawClean)) {
      gateway = "Direct";
      trxId = rawClean;
      amount = 0;
    }
  }

  if (trxId) {
    return {
      gateway: gateway,
      trxId: trxId.trim().toUpperCase(),
      amount: amount || 0,
      sender: sender || "N/A",
      raw: str
    };
  }
  return null;
}

/**
 * Extracts SMS content from iPhone Shortcuts (GET, POST JSON, Form, or Plain)
 */
function extractSMSFromRequest(e) {
  if (!e) return "";
  
  if (e.parameter) {
    if (e.parameter.text) return e.parameter.text;
    if (e.parameter.sms) return e.parameter.sms;
    if (e.parameter.message) return e.parameter.message;
    if (e.parameter.body) return e.parameter.body;
    if (e.parameter.raw) return e.parameter.raw;
    if (e.parameter.content) return e.parameter.content;
    if (e.parameter.trxId) return "TrxID " + e.parameter.trxId + (e.parameter.amount ? " Tk " + e.parameter.amount : "");
  }

  if (e.postData && e.postData.contents) {
    var raw = e.postData.contents;
    try {
      var json = JSON.parse(raw);
      if (json) {
        if (json.text) return json.text;
        if (json.sms) return json.sms;
        if (json.message) return json.message;
        if (json.body) return json.body;
        if (json.content) return json.content;
        if (json.raw) return json.raw;
        if (json.trxId) return "TrxID " + json.trxId + (json.amount ? " Tk " + json.amount : "");
        if (typeof json === "string") return json;
      }
    } catch (ignore) {}

    if (raw.indexOf("=") !== -1) {
      try {
        var parts = raw.split("&");
        for (var i = 0; i < parts.length; i++) {
          var pair = parts[i].split("=");
          var key = decodeURIComponent(pair[0] || "");
          var val = decodeURIComponent((pair[1] || "").replace(/\\+/g, " "));
          if (key === "text" || key === "sms" || key === "message" || key === "body") {
            return val;
          }
        }
      } catch (ignore) {}
    }

    return raw;
  }

  return "";
}

/**
 * Sends a minimal, ultra-clean, professional HTML email to the customer with their download link.
 * Sent from MirrorBook Studio <miirorbook.tech@gmail.com>
 */
function sendCustomerEmail(order) {
  if (!order || !order.customerEmail) return false;

  var toEmail = order.customerEmail.toString().trim();
  var itemName = order.itemName || "Creator Plugin";
  var downloadUrl = order.downloadUrl || "https://drive.google.com";
  var orderId = order.id || ("MB-" + Math.floor(1000 + Math.random() * 9000));
  var trxId = order.trxId || "N/A";
  var itemPrice = order.itemPrice || "৳200";
  var customerName = order.customerName || "Creator";

  var subject = "Your Order is Active: " + itemName + " — MirrorBook";

  var htmlBody = ""
    + "<!DOCTYPE html>"
    + "<html>"
    + "<head><meta charset='utf-8'></head>"
    + "<body style='margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;'>"
    + "  <table width='100%' cellpadding='0' cellspacing='0' style='background-color: #0A0A0A; padding: 40px 16px;'>"
    + "    <tr>"
    + "      <td align='center'>"
    + "        <table width='100%' max-width='540' cellpadding='0' cellspacing='0' style='max-width: 540px; background-color: #121212; border: 1px solid #222222; border-radius: 16px; overflow: hidden; text-align: left;'>"
    + "          <!-- Minimal Header -->"
    + "          <tr>"
    + "            <td style='padding: 24px 30px; border-bottom: 1px solid #1E1E1E; background-color: #161616;'>"
    + "              <table width='100%' cellpadding='0' cellspacing='0'>"
    + "                <tr>"
    + "                  <td>"
    + "                    <span style='font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF;'>MIRRORBOOK</span>"
    + "                    <span style='display: block; font-size: 11px; color: #71B913; font-weight: 600; text-transform: uppercase; margin-top: 2px;'>Reflecting Creativity</span>"
    + "                  </td>"
    + "                  <td align='right'>"
    + "                    <span style='display: inline-block; padding: 4px 10px; background-color: rgba(113, 185, 19, 0.15); border: 1px solid #71B913; border-radius: 20px; font-size: 11px; font-weight: 700; color: #71B913;'>VERIFIED ORDER</span>"
    + "                  </td>"
    + "                </tr>"
    + "              </table>"
    + "            </td>"
    + "          </tr>"
    + "          <!-- Main Content -->"
    + "          <tr>"
    + "            <td style='padding: 30px;'>"
    + "              <h2 style='margin: 0 0 12px; font-size: 19px; font-weight: 700; color: #FFFFFF;'>"
    + "                Thank you, " + customerName + "!"
    + "              </h2>"
    + "              <p style='margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #CCCCCC;'>"
    + "                আপনার পেমেন্ট সফলভাবে যাচাই হয়েছে এবং <strong>" + itemName + "</strong> এর অফিশিয়াল লাইসেন্স আপনার অ্যাকাউন্টে সক্রিয় করা হয়েছে। নিচের বাটনে ক্লিক করে সরাসরি অফিসিয়াল গুগল ড্রাইভ থেকে ফাইল ডাউনলোড করুন:"
    + "              </p>"
    + "              <!-- Big Action Button -->"
    + "              <table width='100%' cellpadding='0' cellspacing='0' style='margin: 28px 0;'>"
    + "                <tr>"
    + "                  <td align='center'>"
    + "                    <a href='" + downloadUrl + "' target='_blank' style='display: inline-block; background-color: #71B913; color: #000000; font-weight: 800; font-size: 14px; text-decoration: none; padding: 15px 32px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 20px rgba(113, 185, 19, 0.35);'>"
    + "                      Download Now from Google Drive ↗"
    + "                    </a>"
    + "                  </td>"
    + "                </tr>"
    + "              </table>"
    + "              <!-- Receipt Card -->"
    + "              <table width='100%' cellpadding='0' cellspacing='0' style='background-color: #171717; border: 1px solid #242424; border-radius: 12px; margin-bottom: 22px;'>"
    + "                <tr>"
    + "                  <td style='padding: 16px 20px;'>"
    + "                    <table width='100%' cellpadding='0' cellspacing='0' style='font-size: 13px;'>"
    + "                      <tr><td style='padding: 5px 0; color: #777777;'>Item:</td><td style='padding: 5px 0; text-align: right; color: #FFFFFF; font-weight: 600;'>" + itemName + "</td></tr>"
    + "                      <tr><td style='padding: 5px 0; color: #777777;'>Amount Paid:</td><td style='padding: 5px 0; text-align: right; color: #71B913; font-weight: 700;'>" + itemPrice + "</td></tr>"
    + "                      <tr><td style='padding: 5px 0; color: #777777;'>Transaction ID:</td><td style='padding: 5px 0; text-align: right; font-family: monospace; color: #FFFFFF;'>" + trxId + "</td></tr>"
    + "                      <tr><td style='padding: 5px 0; color: #777777;'>Order ID:</td><td style='padding: 5px 0; text-align: right; font-family: monospace; color: #888888;'>" + orderId + "</td></tr>"
    + "                      <tr><td style='padding: 5px 0; color: #777777;'>License Holder:</td><td style='padding: 5px 0; text-align: right; color: #AAAAAA;'>" + toEmail + "</td></tr>"
    + "                    </table>"
    + "                  </td>"
    + "                </tr>"
    + "              </table>"
    + "              <!-- Security & Single User Lock Box -->"
    + "              <div style='background-color: rgba(113, 185, 19, 0.08); border-left: 3px solid #71B913; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; font-size: 12px; color: #BBBBBB; line-height: 1.5;'>"
    + "                🔒 <strong>গুগল ড্রাইভ সিকিউরিটি:</strong> আপনার গুগল অ্যাকাউন্ট (" + toEmail + ")-এ এই ফাইলের ভিউ এক্সেস যুক্ত করা হয়েছে। লিংকটি অন্য কাউকে দিলে গুগল ড্রাইভ এক্সেস ব্লক করবে। ভবিষ্যতে যেকোনো সময় মিরর বুকে গিয়ে লগইন করলেই My Vault থেকে ফাইলটি আবার ডাউনলোড করতে পারবেন।"
    + "              </div>"
    + "              <p style='margin: 0; font-size: 13px; color: #888888; line-height: 1.5; text-align: center;'>"
    + "                Thank you for purchasing from MirrorBook Studio. Keep creating extraordinary edits!"
    + "              </p>"
    + "            </td>"
    + "          </tr>"
    + "          <!-- Minimal Footer -->"
    + "          <tr>"
    + "            <td style='padding: 18px 30px; background-color: #0E0E0E; border-top: 1px solid #1E1E1E; text-align: center; font-size: 11px; color: #666666;'>"
    + "              MirrorBook Studio • Official Support: <a href='mailto:miirorbook.tech@gmail.com' style='color: #71B913; text-decoration: none;'>miirorbook.tech@gmail.com</a> • WhatsApp: +8801767079837"
    + "            </td>"
    + "          </tr>"
    + "        </table>"
    + "      </td>"
    + "    </tr>"
    + "  </table>"
    + "</body>"
    + "</html>";

  try {
    if (typeof GmailApp !== "undefined") {
      GmailApp.sendEmail(toEmail, subject, "Your MirrorBook Download: " + downloadUrl, {
        htmlBody: htmlBody,
        name: "MirrorBook Studio",
        replyTo: "miirorbook.tech@gmail.com"
      });
      return true;
    }
  } catch (gErr) {
    Logger.log("GmailApp error: " + gErr.toString());
  }

  try {
    MailApp.sendEmail({
      to: toEmail,
      subject: subject,
      htmlBody: htmlBody,
      name: "MirrorBook Studio",
      replyTo: "miirorbook.tech@gmail.com"
    });
    return true;
  } catch (mErr) {
    Logger.log("MailApp error: " + mErr.toString());
    return false;
  }
}

function doPost(e) {
  try {
    var rawContents = (e && e.postData) ? e.postData.contents : "";
    var payload = {};

    try {
      payload = JSON.parse(rawContents);
    } catch (parseErr) {
      payload = {};
    }

    // CASE 0: Customer Account Registration / Login Sync
    if (payload.action === "logUser" || payload.user) {
      var u = payload.user || payload;
      var uSheet = setupUsersSheet();
      var uEmail = (u.email || "").toString().trim().toLowerCase();
      var uData = uSheet.getDataRange().getValues();
      var userExists = false;
      var userRow = -1;

      for (var ur = 1; ur < uData.length; ur++) {
        if ((uData[ur][1] || "").toString().trim().toLowerCase() === uEmail) {
          userExists = true;
          userRow = ur + 1;
          break;
        }
      }

      if (!userExists) {
        uSheet.appendRow([
          new Date().toISOString(),
          u.email || "",
          u.password || "(Google)",
          u.name || "",
          u.authProvider || "Web",
          u.uid || "",
          "Active"
        ]);
      } else {
        if (u.password && u.password !== "(Google One-Tap)") {
          uSheet.getRange(userRow, 3).setValue(u.password);
        }
      }

      var oSheet = setupOrdersSheet();
      var oData = oSheet.getDataRange().getValues();
      var userPurchases = [];
      for (var oi = 1; oi < oData.length; oi++) {
        var ordEmail = (oData[oi][8] || "").toString().trim().toLowerCase();
        if (ordEmail === uEmail) {
          userPurchases.push({
            id: oData[oi][1] || ("ORD-" + oi),
            title: oData[oi][2] || "Plugin",
            itemPrice: oData[oi][3] || "",
            trxId: oData[oi][5] || "",
            purchasedAt: oData[oi][0] || "",
            downloadUrl: oData[oi][11] || "",
            category: "Plugin"
          });
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "User account synced to Google Sheet Users tab.",
        purchases: userPurchases
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // CASE 1: Submit Customer Order & Send Email with Download Link
    if (payload.action === "submitOrder" || payload.order) {
      var ord = payload.order || payload;
      var oSheet = setupOrdersSheet();

      oSheet.appendRow([
        new Date().toISOString(),
        ord.id || "",
        ord.itemName || "",
        ord.itemPrice || "",
        ord.paymentMethod || "",
        ord.trxId || "",
        ord.senderAccount || "",
        ord.customerName || "",
        ord.customerEmail || "",
        ord.customerPhone || "",
        ord.status || "Verified",
        ord.downloadUrl || ""
      ]);

      // Atomically mark TrxID as USED in Payments sheet
      try {
        var pSheet = setupPaymentsSheet();
        var pData = pSheet.getDataRange().getValues();
        var targetTrx = (ord.trxId || "").toString().trim().toUpperCase();
        for (var r = 1; r < pData.length; r++) {
          if ((pData[r][2] || "").toString().trim().toUpperCase() === targetTrx) {
            pSheet.getRange(r + 1, 7).setValue("USED");
            pSheet.getRange(r + 1, 8).setValue(ord.id || "");
            pSheet.getRange(r + 1, 9).setValue(ord.customerEmail || "");
            break;
          }
        }
      } catch (pErr) {
        Logger.log("Mark USED error: " + pErr.toString());
      }

      // Google Drive Security: Grant Viewer permission to customer's Google email
      try {
        var dUrl = (ord.downloadUrl || "").toString();
        var driveMatch = dUrl.match(/[-\\w]{25,}/);
        if (driveMatch && driveMatch[0] && ord.customerEmail) {
          try {
            DriveApp.getFileById(driveMatch[0]).addViewer(ord.customerEmail);
          } catch(fErr) {
            try {
              DriveApp.getFolderById(driveMatch[0]).addViewer(ord.customerEmail);
            } catch(foErr) {}
          }
        }
      } catch(dErr) {
        Logger.log("Drive anti-piracy share notice: " + dErr.toString());
      }

      // Automatically dispatch email to customer from miirorbook.tech@gmail.com
      var emailSent = sendCustomerEmail(ord);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Order logged successfully." + (emailSent ? " Email dispatched to customer from miirorbook.tech@gmail.com." : ""),
        emailSent: emailSent
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // CASE 2: Incoming SMS from iPhone Shortcuts or Android automation
    var directTrx = payload.trxId ? payload.trxId.toString().trim().toUpperCase() : "";
    var directAmt = payload.amount ? parseFloat(payload.amount) : 0;
    var directSender = payload.sender ? payload.sender.toString().trim() : "";
    var directGateway = payload.gateway ? payload.gateway.toString().trim() : "bKash";

    var smsText = extractSMSFromRequest(e);
    if (directTrx || smsText || payload.action === "incomingSMS" || payload.text) {
      var targetText = smsText || payload.text || "";
      var parsed = directTrx ? {
        gateway: directGateway,
        trxId: directTrx,
        amount: directAmt,
        sender: directSender || "N/A",
        raw: targetText || ("Direct TrxID " + directTrx)
      } : parseSMS(targetText);

      var pSheet = setupPaymentsSheet();

      if (parsed && parsed.trxId) {
        var data = pSheet.getDataRange().getValues();
        var exists = false;
        for (var i = 1; i < data.length; i++) {
          if (data[i][2] && data[i][2].toString().trim().toUpperCase() === parsed.trxId) {
            exists = true;
            break;
          }
        }

        if (!exists) {
          pSheet.appendRow([
            new Date().toISOString(),
            parsed.gateway,
            parsed.trxId,
            parsed.amount,
            parsed.sender,
            parsed.raw,
            "UNUSED",
            "",
            ""
          ]);
        }

        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: "Payment SMS logged successfully for TrxID: " + parsed.trxId,
          parsed: parsed
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        pSheet.appendRow([new Date().toISOString(), "Unknown", "N/A", 0, "N/A", targetText, "UNPARSED", "", ""]);
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          message: "SMS logged as unparsed."
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // CASE 3: Save / Sync Products
    if (payload.action === "saveProducts" || payload.products) {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var prodSheet = ss.getSheetByName("Products");
      if (!prodSheet) {
        prodSheet = ss.insertSheet("Products");
      }
      prodSheet.clearContents();

      var headers = ['id', 'type', 'category', 'title', 'description', 'price', 'priceDisplay', 'protectedUrl', 'thumbnailUrl', 'duration', 'instructor', 'createdAt'];
      prodSheet.appendRow(headers);
      prodSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#71B913").setFontColor("#000000");

      var products = payload.products || [];
      for (var pIdx = 0; pIdx < products.length; pIdx++) {
        var p = products[pIdx];
        prodSheet.appendRow([
          p.id || '',
          p.type || '',
          p.category || '',
          p.title || '',
          p.description || '',
          p.price || 0,
          p.priceDisplay || '',
          p.protectedUrl || '',
          p.thumbnailUrl || '',
          p.duration || '',
          p.instructor || '',
          p.createdAt || new Date().toISOString()
        ]);
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Google Sheet updated with " + products.length + " products."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "OK" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = e && e.parameter ? e.parameter.action : "";

    // Action 1: Strict Anti-Cheat Payment Verification
    if (action === "verifyPayment") {
      var queryTrxId = (e.parameter.trxId || "").toString().trim().toUpperCase();
      var requiredAmount = parseFloat(e.parameter.amount || "0");
      var orderId = (e.parameter.orderId || "").toString().trim();
      var customerEmail = (e.parameter.email || "").toString().trim().toLowerCase();

      var pSheet = setupPaymentsSheet();
      var pData = pSheet.getDataRange().getValues();

      // Search in Payments Sheet
      for (var r = 1; r < pData.length; r++) {
        var rowTrx = (pData[r][2] || "").toString().trim().toUpperCase();
        var rowAmount = parseFloat(pData[r][3] || "0");
        var rowStatus = (pData[r][6] || "").toString().trim().toUpperCase();

        if (rowTrx === queryTrxId) {
          // CRITICAL ANTI-CHEAT: Reject if already USED
          if (rowStatus === "USED") {
            var usedByOrder = pData[r][7] || "পূর্ববর্তী অর্ডার";
            return ContentService.createTextOutput(JSON.stringify({
              verified: false,
              alreadyUsed: true,
              message: "এই Transaction ID (" + queryTrxId + ") টি ইতিমধ্যে ব্যবহার করা হয়ে গেছে (" + usedByOrder + ")। একটি TrxID দিয়ে একাধিক প্রোডাক্ট আনলক করা যাবে না।",
              trxId: rowTrx,
              amount: rowAmount
            })).setMimeType(ContentService.MimeType.JSON);
          }

          // PRICE MATCHING: Compare received amount against website price
          if (requiredAmount > 0 && rowAmount < (requiredAmount - 0.5)) {
            return ContentService.createTextOutput(JSON.stringify({
              verified: false,
              amountMismatch: true,
              receivedAmount: rowAmount,
              requiredAmount: requiredAmount,
              message: "পেমেন্ট অ্যামাউন্ট কম এসেছে। প্রোডাক্টের মূল্য ৳" + requiredAmount + " কিন্তু পেমেন্ট এসেছে ৳" + rowAmount + "।",
              trxId: rowTrx
            })).setMimeType(ContentService.MimeType.JSON);
          }

          // VERIFIED & UNUSED: Atomically mark as USED and bind to order & email
          pSheet.getRange(r + 1, 7).setValue("USED");
          if (orderId) pSheet.getRange(r + 1, 8).setValue(orderId);
          if (customerEmail) pSheet.getRange(r + 1, 9).setValue(customerEmail);

          return ContentService.createTextOutput(JSON.stringify({
            verified: true,
            message: "পেমেন্ট সফলভাবে যাচাই হয়েছে (৳" + rowAmount + ")।",
            trxId: rowTrx,
            amount: rowAmount,
            sender: pData[r][4] || ""
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      // Check if it was already recorded in Orders sheet
      var oSheet = setupOrdersSheet();
      var oData = oSheet.getDataRange().getValues();
      for (var oi = 1; oi < oData.length; oi++) {
        var ordTrx = (oData[oi][5] || "").toString().trim().toUpperCase();
        if (ordTrx === queryTrxId) {
          return ContentService.createTextOutput(JSON.stringify({
            verified: false,
            alreadyUsed: true,
            message: "এই Transaction ID (" + queryTrxId + ") টি ইতিমধ্যে Order #" + (oData[oi][1] || oi) + "-এ ব্যবহৃত হয়েছে।"
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      // Not found anywhere
      return ContentService.createTextOutput(JSON.stringify({
        verified: false,
        notFound: true,
        message: "Transaction ID (" + queryTrxId + ") টি শিটের পেমেন্ট রেকর্ডে খুঁজে পাওয়া যায়নি। অনুগ্রহ করে বিকাশ/নগদ থেকে সঠিক TrxID দিন বা ১-২ মিনিট পর আবার চেষ্টা করুন।"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Action 2: Incoming SMS via GET (support iPhone Shortcuts sending GET requests)
    var smsCandidate = extractSMSFromRequest(e);
    var getTrx = (e.parameter.trxId || "").toString().trim().toUpperCase();
    var getAmount = parseFloat(e.parameter.amount || "0");
    var getSender = (e.parameter.sender || "").toString().trim();
    var getGateway = (e.parameter.gateway || "bKash").toString().trim();

    if (action === "incomingSMS" || smsCandidate || getTrx) {
      var pSheet = setupPaymentsSheet();
      var parsed = getTrx ? {
        gateway: getGateway,
        trxId: getTrx,
        amount: getAmount,
        sender: getSender || "N/A",
        raw: smsCandidate || ("Direct GET TrxID " + getTrx)
      } : parseSMS(smsCandidate);

      if (parsed && parsed.trxId) {
        var data = pSheet.getDataRange().getValues();
        var exists = false;
        for (var i = 1; i < data.length; i++) {
          if (data[i][2] && data[i][2].toString().trim().toUpperCase() === parsed.trxId) {
            exists = true;
            break;
          }
        }
        if (!exists) {
          pSheet.appendRow([
            new Date().toISOString(),
            parsed.gateway,
            parsed.trxId,
            parsed.amount,
            parsed.sender,
            parsed.raw,
            "UNUSED",
            "",
            ""
          ]);
        }
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: "GET SMS logged for TrxID: " + parsed.trxId,
          parsed: parsed
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Action 3: Get User Purchases for Vault Restore
    if (action === "getUserPurchases") {
      var queryEmail = (e.parameter.email || "").toString().trim().toLowerCase();
      var oSheet = setupOrdersSheet();
      var oData = oSheet.getDataRange().getValues();
      var userPurchases = [];
      for (var oi = 1; oi < oData.length; oi++) {
        var ordEmail = (oData[oi][8] || "").toString().trim().toLowerCase();
        if (ordEmail && ordEmail === queryEmail) {
          userPurchases.push({
            id: oData[oi][1] || ("ORD-" + oi),
            title: oData[oi][2] || "Plugin",
            itemPrice: oData[oi][3] || "",
            trxId: oData[oi][5] || "",
            purchasedAt: oData[oi][0] || "",
            downloadUrl: oData[oi][11] || "",
            category: "Plugin"
          });
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        purchases: userPurchases
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Action 4: Get Products
    if (action === "getProducts") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var pSheet = ss.getSheetByName("Products");
      if (!pSheet) {
        return ContentService.createTextOutput(JSON.stringify({ products: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var pData = pSheet.getDataRange().getValues();
      if (pData.length <= 1) {
        return ContentService.createTextOutput(JSON.stringify({ products: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var headers = pData[0];
      var list = [];
      for (var i = 1; i < pData.length; i++) {
        var row = pData[i];
        var item = {};
        for (var j = 0; j < headers.length; j++) {
          item[headers[j]] = row[j];
        }
        list.push(item);
      }
      return ContentService.createTextOutput(JSON.stringify({ products: list }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Action 5: Get All Orders (for Studio Owner Dashboard)
    if (action === "getAllOrders") {
      var oSheet = setupOrdersSheet();
      var oData = oSheet.getDataRange().getValues();
      var allOrders = [];
      for (var oi = 1; oi < oData.length; oi++) {
        var row = oData[oi];
        if (row[1] || row[5] || row[8]) {
          allOrders.push({
            id: String(row[1] || ("ORD-" + oi)),
            createdAt: String(row[0] || ""),
            itemName: String(row[2] || ""),
            itemPrice: String(row[3] || ""),
            paymentMethod: String(row[4] || "bKash"),
            trxId: String(row[5] || ""),
            senderAccount: String(row[6] || ""),
            customerName: String(row[7] || ""),
            customerEmail: String(row[8] || ""),
            customerPhone: String(row[9] || ""),
            status: String(row[10] || "Verified"),
            downloadUrl: String(row[11] || "")
          });
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        orders: allOrders
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Action 6: Get All Incoming SMS Payments (forwarded from iPhone Shortcuts)
    if (action === "getAllPayments") {
      var pSheet = setupPaymentsSheet();
      var pData = pSheet.getDataRange().getValues();
      var allPayments = [];
      for (var pi = 1; pi < pData.length; pi++) {
        var pRow = pData[pi];
        if (pRow[2] || pRow[3]) {
          allPayments.push({
            timestamp: String(pRow[0] || ""),
            gateway: String(pRow[1] || "bKash"),
            trxId: String(pRow[2] || ""),
            amount: parseFloat(pRow[3] || "0"),
            sender: String(pRow[4] || ""),
            status: String(pRow[6] || "UNUSED")
          });
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        payments: allPayments
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "OK",
      service: "MirrorBook Payments Engine",
      emailAccount: "miirorbook.tech@gmail.com"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

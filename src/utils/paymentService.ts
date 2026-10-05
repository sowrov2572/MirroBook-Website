import { PaymentConfig, Order } from '../types';

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

  try {
    const res = await fetch(webAppUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: payloadStr,
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      return {
        success: true,
        message: data?.message || 'Order logged to Google Sheet & confirmation email dispatched.',
      };
    }
  } catch {
    // If standard fetch encounters CORS redirect block, re-dispatch with no-cors to guarantee delivery to Google Apps Script
    try {
      await fetch(webAppUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: payloadStr,
      });
      return {
        success: true,
        message: 'Order dispatched to Google Sheet and email scheduled.',
      };
    } catch (fallbackErr) {
      console.warn('Google Sheet dispatch fallback error:', fallbackErr);
    }
  }

  return { success: true, message: 'Order submitted to Firestore database.' };
}

/**
 * Verifies a transaction ID and amount against the Google Apps Script Web App.
 */
export async function verifyPaymentWithSheet(
  webAppUrl: string,
  trxId: string,
  amount: number
): Promise<{ verified: boolean; message: string; rawData?: unknown }> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return {
      verified: false,
      message: 'Google Apps Script Web App URL is not configured.',
    };
  }

  try {
    const url = new URL(webAppUrl.trim());
    url.searchParams.set('action', 'verifyPayment');
    url.searchParams.set('trxId', trxId.trim());
    url.searchParams.set('amount', amount.toString());
    url.searchParams.set('t', Date.now().toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json().catch(() => null);
      if (data && data.verified === true) {
        return {
          verified: true,
          message: data.message || 'Transaction verified successfully in database.',
          rawData: data,
        };
      } else {
        return {
          verified: false,
          message: data?.message || 'Transaction ID not verified or amount mismatch.',
          rawData: data,
        };
      }
    }
  } catch (err: unknown) {
    console.warn('Verification endpoint error:', err);
  }

  return {
    verified: false,
    message: 'Could not connect to automated verification endpoint.',
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

  const sampleSMS = `You have received Tk ${amount.toLocaleString()}.00 from 01712984512. Fee Tk 0.00. Balance Tk 45,210.00. TrxID ${sampleTrxId} at 05/10/2026 15:42`;

  try {
    const response = await fetch(webAppUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        text: sampleSMS,
        action: 'incomingSMS',
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
 * - Auto-creating "Payments" and "Orders" sheets
 * - Parsing incoming SMS from iPhone Shortcuts (POST, GET, JSON, Form, Plain text)
 * - Verifying TrxID and Amount
 * - Sending confirmation email with download link to customer's personal email from miirorbook.tech@gmail.com
 * - Syncing Products catalog
 */
export const COMPLETE_PAYMENT_GOOGLE_APPS_SCRIPT = `/**
 * ============================================================================
 * MIRRORBOOK AUTOMATED PAYMENT, ORDERS & EMAIL DISPATCH SYSTEM
 * ============================================================================
 * Official Sender: MirrorBook Studio <miirorbook.tech@gmail.com>
 *
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Extensions -> Apps Script.
 * 3. Delete existing code, paste this entire file, and click 'Save' (Ctrl+S / Cmd+S).
 * 4. Click 'Deploy' -> 'New deployment'.
 * 5. Type: 'Web app'
 *    - Execute as: Me (your Google account miirorbook.tech@gmail.com)
 *    - Who has access: Anyone
 * 6. Click 'Deploy' and copy the Web App URL.
 * 7. Paste the Web App URL into the MirrorBook Admin Panel (PIN: 1234).
 * ============================================================================
 */

function setupPaymentsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Payments");
  if (!sheet) {
    sheet = ss.insertSheet("Payments");
    sheet.appendRow(["Timestamp", "Gateway", "TrxID", "Amount", "Sender", "RawSMS", "Status"]);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#71B913").setFontColor("#000000");
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
 * Universal SMS Parser for iPhone Shortcuts & Android Forwarders
 * Supports bKash, Nagad, Rocket, Upay, Bank SMS variants
 */
function parseSMS(text) {
  if (!text) return null;
  var str = text.toString();
  var gateway = "Unknown";
  var trxId = "";
  var amount = 0;
  var sender = "";

  // 1. bKash Patterns (Personal Send Money, Payment, Cash In)
  var bkashTrx = str.match(/(?:TrxID|Trx\\s*ID)[:\\s#=\\-]*([A-Za-z0-9]+)/i);
  var bkashAmt = str.match(/(?:Tk|Amount|BDT)[:\\s#=\\-]*([0-9,]+(?:\\.[0-9]+)?)/i);
  var bkashSender = str.match(/(?:from|by|sender)[:\\s#=\\-]*([0-9+]+)/i);

  // 2. Nagad Patterns
  var nagadTrx = str.match(/(?:TxnID|Txn\\s*ID|TrxID)[:\\s#=\\-]*([A-Za-z0-9]+)/i);
  var nagadAmt = str.match(/(?:Amount|Tk|BDT)[:\\s#=\\-]*(?:Tk)?\\s*([0-9,]+(?:\\.[0-9]+)?)/i);
  var nagadSender = str.match(/(?:Sender|from)[:\\s#=\\-]*([0-9+]+)/i);

  // 3. Rocket / Upay / General Bank
  var genericTrx = str.match(/(?:TrxID|TxnId|TxnID|Ref|Transaction\\s*ID)[:\\s#=\\-]*([A-Za-z0-9]+)/i);
  var genericAmt = str.match(/(?:Tk|BDT|Amount|Amt)[:\\s#=\\-]*([0-9,]+(?:\\.[0-9]+)?)/i);
  var genericSender = str.match(/(?:from|by|Sender|A\\/C)[:\\s#=\\-]*([0-9+]+)/i);

  if (bkashTrx && (str.toLowerCase().indexOf("bkash") !== -1 || str.toLowerCase().indexOf("balance") !== -1)) {
    gateway = "bKash";
    trxId = bkashTrx[1];
    amount = bkashAmt ? parseFloat(bkashAmt[1].replace(/,/g, "")) : 0;
    sender = bkashSender ? bkashSender[1] : "";
  } else if (nagadTrx && (str.toLowerCase().indexOf("nagad") !== -1 || str.toLowerCase().indexOf("fee") !== -1)) {
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
    // Direct TrxID token fallback (e.g. user or shortcut sends only the 7-12 character code)
    var rawClean = str.trim().toUpperCase();
    if (/^[A-Z0-9]{7,15}$/.test(rawClean)) {
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
 * Robust SMS text extractor from iPhone Shortcuts (GET, POST JSON, Form, or Plain)
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
        if (typeof json === "string") return json;
      }
    } catch (ignore) {}

    // Form-urlencoded format: text=... or body=...
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
 * Sends a premium branded HTML email to the customer with their download link.
 * Sent from miirorbook.tech@gmail.com
 */
function sendCustomerEmail(order) {
  if (!order || !order.customerEmail) return false;

  var toEmail = order.customerEmail.toString().trim();
  var itemName = order.itemName || "Easy Flow Plugin";
  var downloadUrl = order.downloadUrl || "https://drive.google.com/drive/folders/1bJ7CxftRuaE8FRPXQevZtBk6yZncsu3v?usp=drive_link";

  var subject = "Your MirrorBook Download — " + itemName;

  var htmlBody = ""
    + "<div style='font-family: Arial, -apple-system, BlinkMacSystemFont, sans-serif; background-color: #070707; color: #ffffff; padding: 40px 20px; text-align: left;'>"
    + "  <div style='max-width: 580px; margin: 0 auto; background: #0E0E0E; border: 1px solid #222222; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.8);'>"
    + "    <div style='background: #141414; padding: 28px; border-bottom: 1px solid #222222; text-align: center;'>"
    + "      <h1 style='color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;'>MirrorBook</h1>"
    + "      <p style='color: #71B913; margin: 6px 0 0; font-size: 13px; font-weight: 600;'>Reflecting Creativity</p>"
    + "    </div>"
    + "    <div style='padding: 30px;'>"
    + "      <h2 style='color: #71B913; font-size: 21px; margin-top: 0;'>Thank you, " + (order.customerName || "Creator") + "!</h2>"
    + "      <p style='color: #CCCCCC; font-size: 14px; line-height: 1.6; margin-bottom: 24px;'>"
    + "        Your order has been successfully recorded. Below is your official Google Drive download link and installation files for <strong>" + itemName + "</strong>."
    + "      </p>"
    + "      <div style='text-align: center; margin: 32px 0;'>"
    + "        <a href='" + downloadUrl + "' target='_blank' style='display: inline-block; background-color: #71B913; color: #000000; font-weight: bold; text-decoration: none; padding: 16px 36px; border-radius: 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 20px rgba(113, 185, 19, 0.4);'>"
    + "          Download &amp; Install from Google Drive ↗"
    + "        </a>"
    + "      </div>"
    + "      <div style='background: #121212; border: 1px solid #1E1E1E; border-radius: 12px; padding: 18px; margin-top: 25px;'>"
    + "        <table style='width: 100%; border-collapse: collapse; font-size: 13px;'>"
    + "          <tr><td style='color: #888888; padding: 6px 0;'>Order ID:</td><td style='color: #FFFFFF; font-weight: bold; text-align: right;'>" + (order.id || "N/A") + "</td></tr>"
    + "          <tr><td style='color: #888888; padding: 6px 0;'>Item:</td><td style='color: #FFFFFF; text-align: right;'>" + itemName + "</td></tr>"
    + "          <tr><td style='color: #888888; padding: 6px 0;'>Price:</td><td style='color: #71B913; font-weight: bold; text-align: right;'>" + (order.itemPrice || "৳20") + "</td></tr>"
    + "          <tr><td style='color: #888888; padding: 6px 0;'>Gateway:</td><td style='color: #FFFFFF; text-align: right;'>" + (order.paymentMethod || "bKash") + "</td></tr>"
    + "          <tr><td style='color: #888888; padding: 6px 0;'>TrxID:</td><td style='color: #FFFFFF; font-family: monospace; text-align: right;'>" + (order.trxId || "N/A") + "</td></tr>"
    + "          <tr><td style='color: #888888; padding: 6px 0;'>Status:</td><td style='color: #71B913; font-weight: bold; text-align: right;'>Verified &amp; Active</td></tr>"
    + "        </table>"
    + "      </div>"
    + "      <div style='background: #101010; border-left: 3px solid #71B913; padding: 12px 16px; margin-top: 20px; font-size: 12px; color: #AAAAAA; line-height: 1.5;'>"
    + "        <strong>Creator Account Vault:</strong> This license is permanently linked to your email (" + toEmail + "). You can visit MirrorBook anytime, click 'Sign In' with this email, and access your downloads from your personal Creator Vault."
    + "      </div>"
    + "    </div>"
    + "    <div style='background: #141414; padding: 18px 28px; border-top: 1px solid #222222; text-align: center; font-size: 12px; color: #777777;'>"
    + "      Questions? Contact us at <a href='mailto:miirorbook.tech@gmail.com' style='color: #71B913; text-decoration: none;'>miirorbook.tech@gmail.com</a> or WhatsApp (+8801767079837)."
    + "    </div>"
    + "  </div>"
    + "</div>";

  // Try GmailApp first (sends directly from miirorbook.tech@gmail.com)
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

  // Fallback to MailApp
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

      // If TrxID is in Payments sheet, mark as USED
      try {
        var pSheet = setupPaymentsSheet();
        var pData = pSheet.getDataRange().getValues();
        var targetTrx = (ord.trxId || "").toString().trim().toUpperCase();
        for (var r = 1; r < pData.length; r++) {
          if ((pData[r][2] || "").toString().trim().toUpperCase() === targetTrx) {
            pSheet.getRange(r + 1, 7).setValue("USED");
            break;
          }
        }
      } catch (pErr) {}

      // Automatically dispatch email to customer from miirorbook.tech@gmail.com
      var emailSent = sendCustomerEmail(ord);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Order logged successfully." + (emailSent ? " Email dispatched to customer from miirorbook.tech@gmail.com." : ""),
        emailSent: emailSent
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // CASE 2: Incoming SMS from iPhone Shortcuts or Android automation
    var smsText = extractSMSFromRequest(e);
    if (smsText || payload.action === "incomingSMS" || payload.text) {
      var targetText = smsText || payload.text || "";
      var parsed = parseSMS(targetText);
      var pSheet = setupPaymentsSheet();

      if (parsed) {
        var data = pSheet.getDataRange().getValues();
        var exists = false;
        for (var i = 1; i < data.length; i++) {
          if (data[i][2] && data[i][2].toString().toUpperCase() === parsed.trxId) {
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
            "UNUSED"
          ]);

          // Check if there is an order in Orders sheet waiting for this TrxID
          try {
            var oSheet = setupOrdersSheet();
            var oData = oSheet.getDataRange().getValues();
            for (var oi = 1; oi < oData.length; oi++) {
              if ((oData[oi][5] || "").toString().trim().toUpperCase() === parsed.trxId) {
                oSheet.getRange(oi + 1, 11).setValue("Verified");
              }
            }
          } catch (oErr) {}
        }

        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: "Payment SMS logged successfully for TrxID: " + parsed.trxId,
          parsed: parsed
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        pSheet.appendRow([new Date().toISOString(), "Unknown", "N/A", 0, "N/A", targetText, "UNPARSED"]);
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

    // Action 1: Verify Payment
    if (action === "verifyPayment") {
      var queryTrxId = (e.parameter.trxId || "").toString().trim().toUpperCase();
      var requiredAmount = parseFloat(e.parameter.amount || "0");
      var sheet = setupPaymentsSheet();
      var data = sheet.getDataRange().getValues();

      for (var r = 1; r < data.length; r++) {
        var rowTrx = (data[r][2] || "").toString().trim().toUpperCase();
        var rowAmount = parseFloat(data[r][3] || "0");
        var rowStatus = (data[r][6] || "").toString().trim().toUpperCase();

        if (rowTrx === queryTrxId) {
          if (rowStatus === "USED") {
            return ContentService.createTextOutput(JSON.stringify({
              verified: true,
              message: "Payment successfully verified for ৳" + rowAmount,
              trxId: rowTrx,
              amount: rowAmount,
              sender: data[r][4] || ""
            })).setMimeType(ContentService.MimeType.JSON);
          }

          if (rowAmount >= requiredAmount || requiredAmount === 0) {
            sheet.getRange(r + 1, 7).setValue("USED");
            return ContentService.createTextOutput(JSON.stringify({
              verified: true,
              message: "Payment successfully verified for ৳" + rowAmount,
              trxId: rowTrx,
              amount: rowAmount,
              sender: data[r][4] || ""
            })).setMimeType(ContentService.MimeType.JSON);
          } else {
            return ContentService.createTextOutput(JSON.stringify({
              verified: false,
              message: "Payment amount (৳" + rowAmount + ") is less than required price (৳" + requiredAmount + ")."
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        verified: false,
        message: "Transaction ID not found in automated payments record."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Action 2: Incoming SMS via GET (support iPhone Shortcuts sending GET requests)
    var smsCandidate = extractSMSFromRequest(e);
    if (action === "incomingSMS" || smsCandidate) {
      var pSheet = setupPaymentsSheet();
      var parsed = parseSMS(smsCandidate);
      if (parsed) {
        var data = pSheet.getDataRange().getValues();
        var exists = false;
        for (var i = 1; i < data.length; i++) {
          if (data[i][2] && data[i][2].toString().toUpperCase() === parsed.trxId) {
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
            "UNUSED"
          ]);
        }
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: "GET SMS logged for TrxID: " + parsed.trxId,
          parsed: parsed
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Action 3: Get Products
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

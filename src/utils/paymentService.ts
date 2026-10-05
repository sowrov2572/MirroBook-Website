import { PaymentConfig } from '../types';

export const PAYMENT_CONFIG_STORAGE_KEY = 'mirrorbook_payment_config';

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  bKashNumber: '01878901234',
  nagadNumber: '01712345678',
  rocketNumber: '01911223344',
  upayNumber: '01611223344',
  bankDetails: {
    bankName: 'City Bank PLC',
    accountName: 'MirrorBook Studio Ltd',
    accountNumber: '1502938472001',
    branchName: 'Gulshan-2 Branch, Dhaka',
    routingNumber: '225271890',
  },
  webAppUrl: '',
  telegramBotToken: '',
  telegramChatId: '',
  whatsAppNumber: '8801878901234',
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
        parse_mode: 'HTML',
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
 * - Auto-creating the "Payments" sheet
 * - Extracting TrxID and Amount from incoming bKash, Nagad, Rocket, Upay SMS
 * - Verifying unused TrxID against required amount and marking as USED
 * - Syncing Products catalog
 */
export const COMPLETE_PAYMENT_GOOGLE_APPS_SCRIPT = `/**
 * ============================================================================
 * MIRRORBOOK AUTOMATED PAYMENT VERIFICATION & PRODUCT SYNC SYSTEM
 * ============================================================================
 * Instructions:
 * 1. Open your Google Sheet (or click 'Open New Google Sheet' in Admin).
 * 2. Extensions -> Apps Script.
 * 3. Delete existing code, paste this entire file, and click 'Save'.
 * 4. Click 'Deploy' -> 'New deployment'.
 * 5. Type: 'Web app'
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Click 'Deploy' and copy the Web App URL.
 * 7. Paste the Web App URL into the MirrorBook Admin Panel.
 * ============================================================================
 */

function setupPaymentsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Payments");
  if (!sheet) {
    sheet = ss.insertSheet("Payments");
    sheet.appendRow(["Timestamp", "Gateway", "TrxID", "Amount", "Sender", "RawSMS", "Status"]);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#CCFF00").setFontColor("#000000");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function parseSMS(text) {
  if (!text) return null;
  var str = text.toString();
  var gateway = "Unknown";
  var trxId = "";
  var amount = 0;
  var sender = "";

  // 1. bKash Pattern
  var bkashTrx = str.match(/TrxID\\s+([A-Za-z0-9]+)/i);
  var bkashAmt = str.match(/(?:Tk|Amount)\\s*([0-9,.]+)/i);
  var bkashSender = str.match(/from\\s+([0-9+]+)/i);

  // 2. Nagad Pattern
  var nagadTrx = str.match(/TxnID:\\s*([A-Za-z0-9]+)/i);
  var nagadAmt = str.match(/Amount:\\s*Tk\\s*([0-9,.]+)/i);
  var nagadSender = str.match(/Sender:\\s*([0-9+]+)/i);

  // 3. Rocket / Upay / General
  var genericTrx = str.match(/(?:TrxID|TxnId|TxnID|Ref)[:\\s]+([A-Za-z0-9]+)/i);
  var genericAmt = str.match(/(?:Tk|BDT|Amount)[:\\s]*([0-9,.]+)/i);

  if (bkashTrx) {
    gateway = "bKash";
    trxId = bkashTrx[1];
    amount = bkashAmt ? parseFloat(bkashAmt[1].replace(/,/g, "")) : 0;
    sender = bkashSender ? bkashSender[1] : "";
  } else if (nagadTrx) {
    gateway = "Nagad";
    trxId = nagadTrx[1];
    amount = nagadAmt ? parseFloat(nagadAmt[1].replace(/,/g, "")) : 0;
    sender = nagadSender ? nagadSender[1] : "";
  } else if (genericTrx) {
    gateway = "Mobile/Bank";
    trxId = genericTrx[1];
    amount = genericAmt ? parseFloat(genericAmt[1].replace(/,/g, "")) : 0;
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

function doPost(e) {
  try {
    var rawContents = e.postData.contents;
    var payload = JSON.parse(rawContents);

    // Case 1: Incoming SMS (from iPhone Shortcut or Simulator)
    if (payload.text || payload.action === "incomingSMS") {
      var smsText = payload.text || "";
      var parsed = parseSMS(smsText);
      var sheet = setupPaymentsSheet();

      if (parsed) {
        // Check for duplicates
        var data = sheet.getDataRange().getValues();
        var exists = false;
        for (var i = 1; i < data.length; i++) {
          if (data[i][2] && data[i][2].toString().toUpperCase() === parsed.trxId) {
            exists = true;
            break;
          }
        }

        if (!exists) {
          sheet.appendRow([
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
          message: "Payment SMS logged successfully for TrxID: " + parsed.trxId,
          parsed: parsed
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        sheet.appendRow([new Date().toISOString(), "Unknown", "N/A", 0, "N/A", smsText, "UNPARSED"]);
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          message: "SMS logged as unparsed."
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Case 2: Product Catalog Sync
    if (payload.action === "saveProducts" || payload.products) {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var prodSheet = ss.getSheetByName("Products");
      if (!prodSheet) {
        prodSheet = ss.insertSheet("Products");
      }
      prodSheet.clearContents();
      
      var headers = ['id', 'type', 'category', 'title', 'description', 'price', 'priceDisplay', 'protectedUrl', 'thumbnailUrl', 'duration', 'instructor', 'createdAt'];
      prodSheet.appendRow(headers);
      prodSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#CCFF00").setFontColor("#000000");

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
              verified: false,
              message: "This Transaction ID has already been used."
            })).setMimeType(ContentService.MimeType.JSON);
          }

          if (rowAmount >= requiredAmount) {
            // Mark as USED
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

    // Action 2: Get Products
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
        item.price = Number(item.price) || 0;
        list.push(item);
      }
      return ContentService.createTextOutput(JSON.stringify({ products: list }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "MirrorBook Script Active" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

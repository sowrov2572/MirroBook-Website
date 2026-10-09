import { ProductItem } from '../types';
import { executeSheetRequest, logSheetTransaction } from './sheetApiWrapper';

export const SHEETS_URL_KEY = 'mirrorbook_sheets_url';
export const PRODUCTS_STORAGE_KEY = 'mirrorbook_products';

export interface SyncResult {
  success: boolean;
  message: string;
  source: 'google-sheets' | 'local-storage';
  items?: ProductItem[];
}

/**
 * Strips protected download / access URLs from paid items for public storefront consumption.
 * Never expose protected URLs in public inspect element or frontend memory until verified!
 */
export function sanitizeProductsForPublic(products: ProductItem[]): ProductItem[] {
  return products.map((item) => {
    // If it's a paid item (price > 0), strip the protectedUrl completely
    if (item.price > 0) {
      const { protectedUrl, ...sanitized } = item;
      return sanitized as ProductItem;
    }
    // Free tutorials keep their playback URL
    return item;
  });
}

/**
 * Pushes updated product list to Google Sheet Web App URL with retry mechanism and fallback to localStorage.
 */
export async function syncProductsToSheet(
  sheetUrl: string,
  products: ProductItem[]
): Promise<SyncResult> {
  // Always save to localStorage first for instant reliability
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  } catch (err) {
    console.error('LocalStorage error', err);
  }

  if (!sheetUrl || !sheetUrl.trim().startsWith('http')) {
    return {
      success: true,
      message: 'Saved to local storage (Google Sheet URL not configured).',
      source: 'local-storage',
      items: products,
    };
  }

  const payloadStr = JSON.stringify({
    action: 'saveProducts',
    timestamp: new Date().toISOString(),
    products,
  });

  const response = await executeSheetRequest<{ success: boolean; message: string }>({
    actionName: 'saveProducts',
    url: sheetUrl,
    method: 'POST',
    body: payloadStr,
    maxRetries: 2,
    initialDelayMs: 600,
    timeoutMs: 10000,
  });

  if (response.ok) {
    return {
      success: true,
      message: response.data?.message || 'Synced successfully with Google Sheet Web App.',
      source: 'google-sheets',
      items: products,
    };
  }

  logSheetTransaction({
    endpointAction: 'saveProducts',
    status: 'FAILED',
    attempts: response.attempts,
    message: `Product sync to Google Sheet encountered: ${response.error || 'Network failure'}. Safe locally.`,
  });

  return {
    success: true,
    message: `Saved locally. Remote sync: ${response.error || 'Network error'}`,
    source: 'local-storage',
    items: products,
  };
}

/**
 * Fetches products from Google Sheet Web App URL with retry mechanism, verifying and safely handling empty responses.
 */
export async function fetchProductsFromSheet(sheetUrl: string): Promise<SyncResult> {
  const localRaw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  const localProducts: ProductItem[] = localRaw ? JSON.parse(localRaw) : [];

  if (!sheetUrl || !sheetUrl.trim().startsWith('http')) {
    return {
      success: true,
      message: 'Loaded from local storage.',
      source: 'local-storage',
      items: localProducts,
    };
  }

  let fetchUrl: string;
  try {
    const url = new URL(sheetUrl.trim());
    url.searchParams.set('action', 'getProducts');
    url.searchParams.set('t', Date.now().toString());
    fetchUrl = url.toString();
  } catch {
    return {
      success: true,
      message: 'Loaded from local storage (invalid URL).',
      source: 'local-storage',
      items: localProducts,
    };
  }

  const response = await executeSheetRequest<any>({
    actionName: 'getProducts',
    url: fetchUrl,
    method: 'GET',
    maxRetries: 2,
    initialDelayMs: 500,
    timeoutMs: 8000,
  });

  if (response.ok && response.data) {
    const data = response.data;
    if (Array.isArray(data) && data.length > 0) {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(data));
      return {
        success: true,
        message: `Loaded ${data.length} products from Google Sheet.`,
        source: 'google-sheets',
        items: data,
      };
    } else if (Array.isArray(data.products) && data.products.length > 0) {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(data.products));
      return {
        success: true,
        message: `Loaded ${data.products.length} products from Google Sheet.`,
        source: 'google-sheets',
        items: data.products,
      };
    }
  }

  // Handle empty or error response gracefully
  return {
    success: true,
    message: response.ok ? 'Google Sheet returned 0 items; loaded local cache.' : `Remote fetch failed (${response.error || 'Transient issue'}); loaded local cache.`,
    source: 'local-storage',
    items: localProducts,
  };
}

/**
 * Sample Google Apps Script code snippet for the user to copy-paste into Google Sheets
 */
export const SAMPLE_APPS_SCRIPT = `/**
 * MirrorBook Google Apps Script Web App Endpoint
 * Paste this in Google Sheets: Extensions -> Apps Script
 * Deploy -> New Deployment -> Web App (Execute as: Me, Access: Anyone)
 */

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var headers = data[0];
  var products = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    obj.price = Number(obj.price) || 0;
    products.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ products: products }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var products = payload.products || [];
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    sheet.clearContents();
    
    var headers = ['id', 'type', 'category', 'title', 'description', 'price', 'priceDisplay', 'protectedUrl', 'thumbnailUrl', 'duration', 'instructor', 'createdAt'];
    sheet.appendRow(headers);
    
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      sheet.appendRow([
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
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Google Sheet updated with ' + products.length + ' products.' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;

import { ProductItem } from '../types';

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
 * Pushes updated product list to Google Sheet Web App URL if configured, with graceful fallback.
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

  try {
    const response = await fetch(sheetUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'saveProducts',
        timestamp: new Date().toISOString(),
        products,
      }),
    });

    if (response.ok) {
      const data = await response.json().catch(() => null);
      return {
        success: true,
        message: data?.message || 'Synced successfully with Google Sheet Web App.',
        source: 'google-sheets',
        items: products,
      };
    } else {
      return {
        success: true,
        message: 'Saved to local storage (Google Sheet returned status ' + response.status + ').',
        source: 'local-storage',
        items: products,
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';
    return {
      success: true,
      message: `Saved locally. Remote sync error: ${errorMsg}`,
      source: 'local-storage',
      items: products,
    };
  }
}

/**
 * Fetches products from Google Sheet Web App URL if configured, falling back to localStorage.
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

  try {
    const fetchUrl = new URL(sheetUrl.trim());
    fetchUrl.searchParams.set('action', 'getProducts');
    fetchUrl.searchParams.set('t', Date.now().toString());

    const response = await fetch(fetchUrl.toString(), {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
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
  } catch (err) {
    console.warn('Could not fetch from Google Sheet URL, fallback to local storage', err);
  }

  return {
    success: true,
    message: 'Loaded from local storage fallback.',
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

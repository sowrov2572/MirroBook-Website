/**
 * Robust Google Sheet API Request Wrapper
 * Features:
 * - Exponential backoff retry mechanism for transient network failures
 * - Structured transaction error and success logging in memory & localStorage
 * - Safe response extraction (handles CORS 302 redirects, empty payloads, and malformed JSON)
 */

export interface SheetApiLog {
  id: string;
  timestamp: string;
  endpointAction: string;
  status: 'SUCCESS' | 'RETRY' | 'FAILED';
  attempts: number;
  message: string;
  details?: Record<string, unknown>;
}

const SHEET_LOGS_KEY = 'mirrorbook_sheet_api_logs';
const MAX_STORED_LOGS = 50;

/**
 * Record a transaction log for monitoring and diagnostics.
 */
export function logSheetTransaction(log: Omit<SheetApiLog, 'id' | 'timestamp'>): void {
  try {
    const entry: SheetApiLog = {
      ...log,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      timestamp: new Date().toISOString(),
    };

    if (log.status === 'FAILED') {
      console.error(`[GoogleSheetAPI FAILED] [${entry.endpointAction}]:`, entry.message, entry.details);
    } else if (log.status === 'RETRY') {
      console.warn(`[GoogleSheetAPI RETRY] [${entry.endpointAction}]:`, entry.message);
    } else {
      console.log(`[GoogleSheetAPI OK] [${entry.endpointAction}]:`, entry.message);
    }

    const raw = localStorage.getItem(SHEET_LOGS_KEY);
    const existing: SheetApiLog[] = raw ? JSON.parse(raw) : [];
    const updated = [entry, ...existing].slice(0, MAX_STORED_LOGS);
    localStorage.setItem(SHEET_LOGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not persist sheet transaction log:', err);
  }
}

/**
 * Retrieve recent transaction logs (e.g. for inspection or Admin view).
 */
export function getSheetTransactionLogs(): SheetApiLog[] {
  try {
    const raw = localStorage.getItem(SHEET_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export interface SheetRequestOptions {
  actionName: string;
  url: string;
  method?: 'GET' | 'POST';
  body?: string;
  maxRetries?: number;
  initialDelayMs?: number;
  timeoutMs?: number;
  requireJsonResponse?: boolean;
}

export interface SheetApiResponse<T = unknown> {
  ok: boolean;
  data: T | null;
  error?: string;
  attempts: number;
}

/**
 * Executes a resilient HTTP fetch to Google Sheet Web App with retry logic and detailed error handling.
 */
export async function executeSheetRequest<T = any>(
  options: SheetRequestOptions
): Promise<SheetApiResponse<T>> {
  const {
    actionName,
    url,
    method = 'GET',
    body,
    maxRetries = 2,
    initialDelayMs = 600,
    timeoutMs = 9000,
    requireJsonResponse = false,
  } = options;

  if (!url || !url.trim().startsWith('http')) {
    const errorMsg = 'Invalid or missing Google Apps Script Web App URL.';
    logSheetTransaction({
      endpointAction: actionName,
      status: 'FAILED',
      attempts: 0,
      message: errorMsg,
    });
    return { ok: false, data: null, error: errorMsg, attempts: 0 };
  }

  let attempt = 0;
  let delay = initialDelayMs;
  let lastError: string = 'Unknown network failure';

  while (attempt <= maxRetries) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const fetchOptions: RequestInit = {
        method,
        signal: controller.signal,
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      };

      if (method === 'POST' && body) {
        fetchOptions.body = body;
      }

      const response = await fetch(url.trim(), fetchOptions);
      clearTimeout(timeoutId);

      // Successfully connected with standard HTTP response
      if (response.ok) {
        let parsedData: T | null = null;
        try {
          const text = await response.text();
          if (text && text.trim().length > 0) {
            parsedData = JSON.parse(text) as T;
          }
        } catch {
          // If response body is empty or plain text but status was 200 OK
          parsedData = null;
        }

        logSheetTransaction({
          endpointAction: actionName,
          status: 'SUCCESS',
          attempts: attempt,
          message: `Request completed successfully (HTTP ${response.status}).`,
        });

        return {
          ok: true,
          data: parsedData,
          attempts: attempt,
        };
      }

      // Non-2xx response returned by server
      lastError = `Server returned HTTP ${response.status} ${response.statusText}`;
      if (attempt <= maxRetries) {
        logSheetTransaction({
          endpointAction: actionName,
          status: 'RETRY',
          attempts: attempt,
          message: `${lastError}. Retrying in ${delay}ms...`,
        });
        await new Promise((res) => setTimeout(res, delay));
        delay *= 1.8;
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      const errMsg = isAbort ? `Request timed out after ${timeoutMs}ms` : (err instanceof Error ? err.message : String(err));
      lastError = errMsg;

      // Special handling for browser CORS redirect behavior with Google Apps Script:
      // Google Apps Script redirects with 302, which standard browser fetch may block under CORS.
      // For POST requests, we fallback to 'no-cors' mode so Google Sheet script receives and saves the data.
      if (method === 'POST' && !isAbort && attempt >= maxRetries) {
        try {
          await fetch(url.trim(), {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: body || '',
          });

          logSheetTransaction({
            endpointAction: actionName,
            status: 'SUCCESS',
            attempts: attempt + 1,
            message: 'Delivered via no-cors dispatch mode after CORS redirect.',
          });

          return {
            ok: true,
            data: null,
            attempts: attempt + 1,
          };
        } catch (noCorsErr) {
          lastError = `Fallback delivery failed: ${noCorsErr instanceof Error ? noCorsErr.message : String(noCorsErr)}`;
        }
      }

      if (attempt <= maxRetries) {
        logSheetTransaction({
          endpointAction: actionName,
          status: 'RETRY',
          attempts: attempt,
          message: `Network transient issue: ${lastError}. Retrying in ${delay}ms...`,
        });
        await new Promise((res) => setTimeout(res, delay));
        delay *= 1.8;
      }
    }
  }

  // All retry attempts exhausted
  logSheetTransaction({
    endpointAction: actionName,
    status: 'FAILED',
    attempts: attempt,
    message: `All ${maxRetries + 1} attempts exhausted. Final error: ${lastError}`,
    details: { url, method },
  });

  return {
    ok: false,
    data: null,
    error: lastError,
    attempts: attempt,
  };
}

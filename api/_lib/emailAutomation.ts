import nodemailer from 'nodemailer';

export type MirrorBookEmailAction =
  | 'general_inquiry'
  | 'package_inquiry'
  | 'software_inquiry'
  | 'software_purchase'
  | 'payment_submission'
  | 'payment_verified';

export const ALLOWED_APPS_SCRIPT_ACTIONS = new Set<MirrorBookEmailAction>([
  'general_inquiry',
  'package_inquiry',
  'software_inquiry',
  'software_purchase',
  'payment_submission',
  'payment_verified',
]);

export const DEFAULT_APPS_SCRIPT_INQUIRY_URL =
  'https://script.google.com/macros/s/AKfycbySGdTFlRdWFg2VM0AeO-Jw1AiPvAPF0v8d7y82KpKIJBYrXJ8OCWHIqk5Snawqo1Xl4A/exec';

export interface AppsScriptDispatchResult {
  ok: boolean;
  message?: string;
  error?: string;
  httpStatus?: number;
  finalUrl?: string;
  redirectCount?: number;
  bodySnippet?: string;
  authRequired?: boolean;
  rawParsed?: Record<string, any> | null;
}

export interface SmtpMailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

const MAX_REDIRECT_HOPS = 5;

export function getAppsScriptEndpointUrl(): string {
  return (
    process.env.APPS_SCRIPT_INQUIRY_URL?.trim() ||
    process.env.APPS_SCRIPT_WEBHOOK_URL?.trim() ||
    DEFAULT_APPS_SCRIPT_INQUIRY_URL
  );
}

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim());
}

export function getAdminNotificationEmail(): string {
  return (
    process.env.ADMIN_EMAIL?.trim() ||
    process.env.GMAIL_USER?.trim() ||
    'mirrorbook.site@gmail.com'
  );
}

export function normalizeAppsScriptAction(
  candidate?: string | null,
  fallback: MirrorBookEmailAction = 'general_inquiry'
): MirrorBookEmailAction {
  if (typeof candidate === 'string') {
    const cleaned = candidate.trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (ALLOWED_APPS_SCRIPT_ACTIONS.has(cleaned as MirrorBookEmailAction)) {
      return cleaned as MirrorBookEmailAction;
    }
  }
  return fallback;
}

/**
 * Strips query parameters, hashes, and credentials from any URL before logging
 * so verification tokens (e.g. free_access_token, user_content_key) are never logged.
 */
export function sanitizeUrlForLog(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return 'unknown';
  try {
    const parsed = new URL(rawUrl);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return rawUrl.split('?')[0].split('#')[0].slice(0, 160);
  }
}

/**
 * Strips scripts/styles/HTML tags, redacts emails/tokens/secrets, and truncates
 * a response body safely for server diagnostic logging.
 */
export function sanitizeBodySnippetForLog(rawText?: string | null, maxLen = 220): string {
  if (!rawText || typeof rawText !== 'string') return '';
  const stripped = rawText
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const redacted = stripped
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/(free_access_token|token|access_token|password|secret|key)\s*[:=]\s*[^\s"'&,;]+/gi, '$1=[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]');

  return redacted.length > maxLen ? `${redacted.slice(0, maxLen)}...` : redacted;
}

function isGoogleLoginHost(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    return host === 'accounts.google.com' || parsed.pathname.toLowerCase().includes('servicelogin');
  } catch {
    return false;
  }
}

function isAllowedRedirectHost(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'script.google.com' ||
      host === 'script.googleusercontent.com' ||
      host.endsWith('.googleusercontent.com') ||
      host.endsWith('.google.com')
    );
  } catch {
    return false;
  }
}

/**
 * Dispatches JSON payloads to the MirrorBook Google Apps Script Web App `/exec` endpoint.
 *
 * Implements explicit multi-hop redirect handling for Google Apps Script:
 * - Initial request: POST JSON (no Authorization/Cookie headers).
 * - When Google executes doPost(e) and responds with 302/303 to script.googleusercontent.com,
 *   follows the redirect cleanly as GET (without POST body or Content-Type).
 * - Immediately detects redirects to accounts.google.com (Google Sign-In) or HTTP 401/403
 *   without mistaking HTML pages for success.
 * - Strictly requires final HTTP 2xx AND valid JSON containing `success: true`.
 */
export async function sendToAppsScriptAutomation(
  payload: Record<string, any>,
  options: {
    endpointUrl?: string;
    timeoutMs?: number;
    fetchFn?: typeof fetch;
  } = {}
): Promise<AppsScriptDispatchResult> {
  const targetUrl = options.endpointUrl?.trim() || getAppsScriptEndpointUrl();
  const timeoutMs =
    typeof options.timeoutMs === 'number' && options.timeoutMs > 0 ? options.timeoutMs : 9500;
  const fetchImpl = options.fetchFn || fetch;
  const safeAction = String(payload.type || payload.requestType || payload.action || 'unknown').slice(0, 48);

  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
    console.error(`[emailAutomation] Invalid Apps Script endpoint URL for action=${safeAction}`);
    return {
      ok: false,
      error: 'Apps Script email automation URL is missing or invalid.',
    };
  }

  if (/script\.google\.com\/macros\/s\/[^/]+\/dev(\?|$)/i.test(targetUrl)) {
    console.error(
      `[emailAutomation] Apps Script URL uses /dev instead of /exec: action=${safeAction} url=${sanitizeUrlForLog(targetUrl)}`
    );
    return {
      ok: false,
      httpStatus: 401,
      finalUrl: sanitizeUrlForLog(targetUrl),
      authRequired: true,
      error:
        'Apps Script URL ends with /dev (test deployment requires Google login). Use the published /exec Web App URL.',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let currentUrl = targetUrl;
  let currentMethod: 'POST' | 'GET' = 'POST';
  let currentBody: string | undefined = JSON.stringify(payload);
  let redirectCount = 0;

  try {
    let resp: Response | null = null;

    for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop++) {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (currentMethod === 'POST') {
        headers['Content-Type'] = 'application/json; charset=utf-8';
      }

      resp = await fetchImpl(currentUrl, {
        method: currentMethod,
        headers,
        ...(currentMethod === 'POST' && currentBody !== undefined ? { body: currentBody } : {}),
        redirect: 'manual',
        signal: controller.signal,
      });

      const isRedirect =
        resp.status === 301 ||
        resp.status === 302 ||
        resp.status === 303 ||
        resp.status === 307 ||
        resp.status === 308;

      if (!isRedirect) {
        break;
      }

      const location = resp.headers?.get?.('location');
      if (!location) {
        break;
      }

      let resolvedNextUrl: string;
      try {
        resolvedNextUrl = new URL(location, currentUrl).toString();
      } catch {
        break;
      }

      // Immediately detect Google Sign-In redirect (indicates restricted/archived Web App deployment)
      if (isGoogleLoginHost(resolvedNextUrl)) {
        clearTimeout(timeoutId);
        const safeNext = sanitizeUrlForLog(resolvedNextUrl);
        console.error(
          `[emailAutomation] Apps Script auth redirect: action=${safeAction} status=${resp.status} redirects=${redirectCount} finalUrl=${safeNext}`
        );
        return {
          ok: false,
          httpStatus: 401,
          finalUrl: safeNext,
          redirectCount,
          authRequired: true,
          error:
            'Email automation endpoint redirected to Google Sign-In (HTTP 401). Verify the Apps Script deployment is active with Execute as "Me" and Who has access "Anyone".',
        };
      }

      if (!isAllowedRedirectHost(resolvedNextUrl)) {
        clearTimeout(timeoutId);
        const safeNext = sanitizeUrlForLog(resolvedNextUrl);
        console.error(
          `[emailAutomation] Apps Script unexpected redirect host: action=${safeAction} status=${resp.status} finalUrl=${safeNext}`
        );
        return {
          ok: false,
          httpStatus: resp.status,
          finalUrl: safeNext,
          redirectCount,
          error: 'Email automation endpoint redirected to an unexpected host.',
        };
      }

      if (hop === MAX_REDIRECT_HOPS) {
        clearTimeout(timeoutId);
        const safeFinal = sanitizeUrlForLog(resolvedNextUrl);
        console.error(
          `[emailAutomation] Apps Script exceeded max redirects (${MAX_REDIRECT_HOPS}): action=${safeAction} finalUrl=${safeFinal}`
        );
        return {
          ok: false,
          httpStatus: resp.status,
          finalUrl: safeFinal,
          redirectCount,
          error: 'Email automation endpoint exceeded maximum redirects.',
        };
      }

      // Google Apps Script returns 302 from script.google.com -> script.googleusercontent.com/macros/echo
      // Per RFC 7231 / Fetch spec, 301/302/303 after POST MUST switch to GET without body.
      if (resp.status === 301 || resp.status === 302 || resp.status === 303) {
        currentMethod = 'GET';
        currentBody = undefined;
      }

      currentUrl = resolvedNextUrl;
      redirectCount += 1;
    }

    clearTimeout(timeoutId);

    if (!resp) {
      return {
        ok: false,
        error: 'No response received from email automation endpoint.',
      };
    }

    const finalResponseUrl = sanitizeUrlForLog(resp.url || currentUrl);
    const contentType = (resp.headers?.get?.('content-type') || '').toLowerCase();
    const rawText = await resp.text();
    const trimmedText = rawText.trim();
    const bodySnippet = sanitizeBodySnippetForLog(trimmedText);

    let parsed: Record<string, any> | null = null;
    if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
      try {
        parsed = JSON.parse(trimmedText);
      } catch {
        parsed = null;
      }
    }

    if (!resp.ok) {
      const isAuthFailure = resp.status === 401 || resp.status === 403;
      const errMsg =
        parsed?.error ||
        parsed?.message ||
        (resp.status === 401
          ? 'Email automation endpoint returned HTTP 401.'
          : `Email automation endpoint returned HTTP ${resp.status}.`);

      console.error(
        `[emailAutomation] Apps Script HTTP error: action=${safeAction} status=${resp.status} redirects=${redirectCount} finalUrl=${finalResponseUrl} contentType="${contentType}" bodySnippet="${bodySnippet}"`
      );

      return {
        ok: false,
        httpStatus: resp.status,
        finalUrl: finalResponseUrl,
        redirectCount,
        bodySnippet,
        authRequired: isAuthFailure,
        rawParsed: parsed,
        error: errMsg,
      };
    }

    // Reject HTML/non-JSON HTTP 200 responses (e.g., Google Accounts sign-in, permissions error, quota HTML)
    if (!parsed || typeof parsed !== 'object') {
      const lower = trimmedText.toLowerCase();
      let reason = 'Email automation endpoint returned an unexpected non-JSON response.';
      let authRequired = false;

      if (
        lower.includes('accounts.google.com') ||
        lower.includes('servicelogin') ||
        lower.includes('authorization is required') ||
        lower.includes('sign in')
      ) {
        authRequired = true;
        reason =
          'Email automation Web App requires authorization ("Execute as: Me" and "Who has access: Anyone").';
      } else if (lower.includes('script function not found') || lower.includes('dopost')) {
        reason = 'Email automation Web App doPost handler is missing or misconfigured.';
      } else if (
        lower.includes('<!doctype') ||
        lower.includes('<html') ||
        contentType.includes('text/html')
      ) {
        reason = 'Email automation Web App returned an HTML error page instead of JSON confirmation.';
      }

      console.error(
        `[emailAutomation] Apps Script non-JSON response: action=${safeAction} status=${resp.status} redirects=${redirectCount} finalUrl=${finalResponseUrl} contentType="${contentType}" bodySnippet="${bodySnippet}"`
      );

      return {
        ok: false,
        httpStatus: resp.status,
        finalUrl: finalResponseUrl,
        redirectCount,
        bodySnippet,
        authRequired,
        error: reason,
      };
    }

    if (parsed.success !== true || parsed.status === 'error' || parsed.result === 'error') {
      const errMsg =
        parsed.error ||
        parsed.message ||
        'The email automation service could not send the email.';

      console.error(
        `[emailAutomation] Apps Script JSON error: action=${safeAction} status=${resp.status} redirects=${redirectCount} finalUrl=${finalResponseUrl} bodySnippet="${sanitizeBodySnippetForLog(String(errMsg), 160)}"`
      );

      return {
        ok: false,
        httpStatus: resp.status,
        finalUrl: finalResponseUrl,
        redirectCount,
        bodySnippet,
        rawParsed: parsed,
        error: errMsg,
      };
    }

    return {
      ok: true,
      httpStatus: resp.status,
      finalUrl: finalResponseUrl,
      redirectCount,
      rawParsed: parsed,
      message: parsed.message || 'Email dispatched successfully.',
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isAbort = err?.name === 'AbortError';
    const safeFinal = sanitizeUrlForLog(currentUrl);
    const message = isAbort
      ? 'The email automation service timed out. Please try again.'
      : err?.message || 'Unable to connect to the email automation endpoint.';

    console.error(
      `[emailAutomation] Apps Script network error: action=${safeAction} abort=${isAbort} redirects=${redirectCount} finalUrl=${safeFinal} reason="${sanitizeBodySnippetForLog(String(err?.message || ''), 140)}"`
    );

    return {
      ok: false,
      finalUrl: safeFinal,
      redirectCount,
      error: message,
    };
  }
}

/**
 * Sends transactional email via Gmail SMTP with bounded timeouts so Vercel Serverless Functions
 * never hit platform 504 timeouts silently. Never logs credentials or secrets.
 */
export async function sendGmailSmtpMail(options: SmtpMailOptions): Promise<void> {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim();
  const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 465;

  if (!gmailUser || !gmailAppPassword) {
    throw new Error(
      'SMTP credentials are not configured (missing GMAIL_USER or GMAIL_APP_PASSWORD).'
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    connectionTimeout: 6000,
    greetingTimeout: 6000,
    socketTimeout: 8000,
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  await transporter.sendMail({
    from: `"MirrorBook" <${gmailUser}>`,
    to: options.to,
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

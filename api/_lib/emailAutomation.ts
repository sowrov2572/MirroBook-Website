import crypto from 'crypto';
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

export type AppsScriptAuthStrategy = 'none' | 'x-api-key' | 'bearer' | 'bearer+x-api-key';

export type AppsScriptUrlSource =
  | 'override'
  | 'APPS_SCRIPT_INQUIRY_URL'
  | 'APPS_SCRIPT_WEBHOOK_URL'
  | 'DEFAULT_FALLBACK';

export type AppsScriptFailureLayer =
  | 'none'
  | 'url_validation'
  | 'google_auth_redirect'
  | 'google_http_auth'
  | 'apps_script_html_auth'
  | 'apps_script_api_key_rejected'
  | 'apps_script_runtime_error'
  | 'apps_script_non_json'
  | 'unexpected_redirect'
  | 'network_or_timeout';

export interface AppsScriptDiagnostics {
  urlSource: AppsScriptUrlSource;
  isUsingDefaultFallbackUrl: boolean;
  endpointHost: string;
  httpStatus: number | null;
  responseContentType: string;
  redirectCount: number;
  redirectDestinationHosts: string[];
  serverApiKeyPresent: boolean;
  bodyApiKeyInjected: boolean;
  serverBearerTokenPresent: boolean;
  appsScriptExpectedKeyPresent: boolean | null;
  appsScriptReceivedKeyPresent: boolean | null;
  failedAuthCheck: AppsScriptFailureLayer;
}

export interface AppsScriptDispatchResult {
  ok: boolean;
  message?: string;
  error?: string;
  httpStatus?: number;
  finalUrl?: string;
  redirectCount?: number;
  bodySnippet?: string;
  authRequired?: boolean;
  authStrategy?: AppsScriptAuthStrategy;
  diagnostics?: AppsScriptDiagnostics;
  rawParsed?: Record<string, any> | null;
}

export interface SmtpMailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export interface InboundAuthCheckResult {
  authorized: boolean;
  mode: 'open' | 'same-origin' | 'x-api-key' | 'bearer' | 'rejected';
  failedAuthCheck?: 'none' | 'invalid_x_api_key' | 'invalid_bearer_token' | 'missing_inbound_credentials';
  error?: string;
}

const MAX_REDIRECT_HOPS = 5;

export function resolveAppsScriptEndpoint(overrideUrl?: string): {
  url: string;
  source: AppsScriptUrlSource;
} {
  if (overrideUrl && overrideUrl.trim()) {
    return { url: overrideUrl.trim(), source: 'override' };
  }
  const inquiryUrl = process.env.APPS_SCRIPT_INQUIRY_URL?.trim();
  if (inquiryUrl) {
    return { url: inquiryUrl, source: 'APPS_SCRIPT_INQUIRY_URL' };
  }
  const webhookUrl = process.env.APPS_SCRIPT_WEBHOOK_URL?.trim();
  if (webhookUrl) {
    return { url: webhookUrl, source: 'APPS_SCRIPT_WEBHOOK_URL' };
  }
  return { url: DEFAULT_APPS_SCRIPT_INQUIRY_URL, source: 'DEFAULT_FALLBACK' };
}

export function getAppsScriptEndpointUrl(): string {
  return resolveAppsScriptEndpoint().url;
}

/**
 * Shared secret verified by Google Apps Script `doPost(e)` (sent in `x-api-key` header
 * and JSON body `apiKey`, since GAS Web Apps expose `e.postData.contents` rather than custom headers).
 */
export function getAppsScriptApiKey(): string {
  return process.env.APPS_SCRIPT_API_KEY?.trim() || '';
}

/**
 * Optional Google OAuth2 access token sent as `Authorization: Bearer <token>` on the initial
 * hop to `script.google.com` (only needed if the Apps Script deployment is restricted rather than
 * "Who has access: Anyone"). Automatically strips any leading "Bearer " prefix.
 */
export function getAppsScriptBearerToken(): string {
  const raw = process.env.APPS_SCRIPT_BEARER_TOKEN?.trim() || '';
  if (!raw) return '';
  return raw.replace(/^Bearer\s+/i, '').trim();
}

export function getInboundInquiryApiKey(): string {
  return process.env.INQUIRY_API_KEY?.trim() || '';
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
 * Constant-time string comparison using SHA-256 digests to avoid leaking key length or timing.
 */
export function timingSafeSecretMatch(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const hashA = crypto.createHash('sha256').update(provided, 'utf8').digest();
  const hashB = crypto.createHash('sha256').update(expected, 'utf8').digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function isTrustedWebsiteOrigin(urlOrOrigin?: string | null): boolean {
  if (!urlOrOrigin || typeof urlOrOrigin !== 'string') return false;
  try {
    const parsed = new URL(urlOrOrigin);
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'mirrorbook.site' ||
      host.endsWith('.mirrorbook.site') ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.vercel.app') ||
      host.endsWith('.run.app')
    );
  } catch {
    return false;
  }
}

/**
 * Optional inbound request authentication check for Vercel API routes against `INQUIRY_API_KEY`.
 * - When `INQUIRY_API_KEY` is unset: allows normal website & API traffic (`mode: 'open'`).
 * - When `INQUIRY_API_KEY` is set:
 *   - Accepts valid `x-api-key: <key>` or `Authorization: Bearer <key>` (constant-time).
 *   - Rejects invalid credentials if either header was explicitly supplied.
 *   - Allows unauthenticated same-origin MirrorBook website browser submissions so public forms
 *     never need to embed server secrets in client JS (unless `requireForAllOrigins` is true).
 */
export function verifyInboundApiRequest(
  headers: Record<string, string | string[] | undefined> | undefined,
  options: {
    expectedKey?: string;
    requireForAllOrigins?: boolean;
  } = {}
): InboundAuthCheckResult {
  const expectedKey =
    options.expectedKey !== undefined ? options.expectedKey.trim() : getInboundInquiryApiKey();

  if (!expectedKey) {
    return { authorized: true, mode: 'open', failedAuthCheck: 'none' };
  }

  const readHeader = (name: string): string => {
    if (!headers) return '';
    const direct = headers[name] ?? headers[name.toLowerCase()];
    if (Array.isArray(direct)) return String(direct[0] || '').trim();
    return typeof direct === 'string' ? direct.trim() : '';
  };

  const apiKeyHeader = readHeader('x-api-key');
  const authHeader = readHeader('authorization');

  if (apiKeyHeader) {
    if (timingSafeSecretMatch(apiKeyHeader, expectedKey)) {
      return { authorized: true, mode: 'x-api-key', failedAuthCheck: 'none' };
    }
    return {
      authorized: false,
      mode: 'rejected',
      failedAuthCheck: 'invalid_x_api_key',
      error: 'Unauthorized: invalid x-api-key header.',
    };
  }

  if (authHeader) {
    const match = /^Bearer\s+(.+)$/i.exec(authHeader);
    const bearerValue = match ? match[1].trim() : '';
    if (bearerValue && timingSafeSecretMatch(bearerValue, expectedKey)) {
      return { authorized: true, mode: 'bearer', failedAuthCheck: 'none' };
    }
    return {
      authorized: false,
      mode: 'rejected',
      failedAuthCheck: 'invalid_bearer_token',
      error: 'Unauthorized: invalid Authorization Bearer token.',
    };
  }

  if (!options.requireForAllOrigins) {
    const origin = readHeader('origin');
    const referer = readHeader('referer');
    if (isTrustedWebsiteOrigin(origin) || isTrustedWebsiteOrigin(referer)) {
      return { authorized: true, mode: 'same-origin', failedAuthCheck: 'none' };
    }
  }

  return {
    authorized: false,
    mode: 'rejected',
    failedAuthCheck: 'missing_inbound_credentials',
    error: 'Unauthorized: missing x-api-key or Authorization Bearer credentials.',
  };
}

/**
 * Extracts only the hostname from any URL (safe for diagnostic logging without exposing paths/tokens).
 */
export function extractHostnameForLog(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return 'unknown';
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return 'invalid-url';
  }
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
 * Strips scripts/styles/HTML tags, redacts emails/tokens/API keys/secrets, and truncates
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
    .replace(
      /(free_access_token|api[_-]?key|x-api-key|access_token|token|password|secret|key)\s*[:=]\s*["']?[^\s"'&,;}\]]+["']?/gi,
      '$1=[redacted]'
    )
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]');

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

function resolveAuthStrategy(hasBearer: boolean, hasApiKey: boolean): AppsScriptAuthStrategy {
  if (hasBearer && hasApiKey) return 'bearer+x-api-key';
  if (hasBearer) return 'bearer';
  if (hasApiKey) return 'x-api-key';
  return 'none';
}

function readOptionalBoolean(val: unknown): boolean | null {
  return typeof val === 'boolean' ? val : null;
}

function extractAppsScriptKeyBooleans(parsed: Record<string, any> | null): {
  expectedKeyPresent: boolean | null;
  receivedKeyPresent: boolean | null;
} {
  if (!parsed || typeof parsed !== 'object') {
    return { expectedKeyPresent: null, receivedKeyPresent: null };
  }
  const diag = parsed.diagnostics && typeof parsed.diagnostics === 'object' ? parsed.diagnostics : parsed;
  return {
    expectedKeyPresent:
      readOptionalBoolean(diag.expectedKeyPresent) ??
      readOptionalBoolean(diag.hasExpectedKey) ??
      readOptionalBoolean(diag.scriptApiKeyConfigured),
    receivedKeyPresent:
      readOptionalBoolean(diag.receivedKeyPresent) ??
      readOptionalBoolean(diag.hasReceivedKey) ??
      readOptionalBoolean(diag.requestApiKeyPresent),
  };
}

/**
 * Dispatches JSON payloads to the MirrorBook Google Apps Script Web App `/exec` endpoint.
 *
 * Authentication & Google Apps Script redirect architecture:
 * - Standardized `x-api-key` strategy (`APPS_SCRIPT_API_KEY`):
 *   Sends `x-api-key` header on the initial POST hop AND injects `apiKey` in the JSON body
 *   (because Apps Script `doPost(e)` reads `e.postData.contents` rather than custom headers).
 * - `Authorization: Bearer` strategy (`APPS_SCRIPT_BEARER_TOKEN`):
 *   Sends `Authorization: Bearer <token>` ONLY on the initial POST hop to `script.google.com`
 *   (for restricted deployments authorized with a Google OAuth2 access token).
 * - Explicit multi-hop `redirect: 'manual'` handling:
 *   When Google executes `doPost(e)` and responds with 301/302/303 to
 *   `script.googleusercontent.com/macros/echo`, switches to GET without body and strips
 *   `Authorization` and `x-api-key` headers so the echo endpoint never rejects the redirect.
 * - Emits structured, secret-free diagnostics distinguishing Google-layer 401s from
 *   Apps Script `doPost(e)` API key rejections.
 */
export async function sendToAppsScriptAutomation(
  payload: Record<string, any>,
  options: {
    endpointUrl?: string;
    timeoutMs?: number;
    fetchFn?: typeof fetch;
    apiKey?: string;
    bearerToken?: string;
  } = {}
): Promise<AppsScriptDispatchResult> {
  const endpoint = resolveAppsScriptEndpoint(options.endpointUrl);
  const targetUrl = endpoint.url;
  const timeoutMs =
    typeof options.timeoutMs === 'number' && options.timeoutMs > 0 ? options.timeoutMs : 9500;
  const fetchImpl = options.fetchFn || fetch;
  const apiKey =
    options.apiKey !== undefined ? options.apiKey.trim() : getAppsScriptApiKey();
  const bearerToken =
    options.bearerToken !== undefined
      ? options.bearerToken.replace(/^Bearer\s+/i, '').trim()
      : getAppsScriptBearerToken();
  const authStrategy = resolveAuthStrategy(Boolean(bearerToken), Boolean(apiKey));
  const safeAction = String(
    payload.type || payload.inquiryType || payload.requestType || payload.action || 'unknown'
  ).slice(0, 48);

  const diagnostics: AppsScriptDiagnostics = {
    urlSource: endpoint.source,
    isUsingDefaultFallbackUrl: endpoint.source === 'DEFAULT_FALLBACK',
    endpointHost: extractHostnameForLog(targetUrl),
    httpStatus: null,
    responseContentType: '',
    redirectCount: 0,
    redirectDestinationHosts: [],
    serverApiKeyPresent: Boolean(apiKey),
    bodyApiKeyInjected: Boolean(apiKey),
    serverBearerTokenPresent: Boolean(bearerToken),
    appsScriptExpectedKeyPresent: null,
    appsScriptReceivedKeyPresent: null,
    failedAuthCheck: 'none',
  };

  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
    diagnostics.failedAuthCheck = 'url_validation';
    console.error('[emailAutomation] Invalid Apps Script endpoint URL:', {
      action: safeAction,
      ...diagnostics,
    });
    return {
      ok: false,
      authStrategy,
      diagnostics,
      error: 'Apps Script email automation URL is missing or invalid.',
    };
  }

  if (/script\.google\.com\/macros\/s\/[^/]+\/dev(\?|$)/i.test(targetUrl)) {
    diagnostics.httpStatus = 401;
    diagnostics.failedAuthCheck = 'url_validation';
    console.error('[emailAutomation] Apps Script URL uses /dev instead of /exec:', {
      action: safeAction,
      ...diagnostics,
    });
    return {
      ok: false,
      httpStatus: 401,
      finalUrl: sanitizeUrlForLog(targetUrl),
      authRequired: true,
      authStrategy,
      diagnostics,
      error:
        'Apps Script URL ends with /dev (test deployment requires Google login). Use the published /exec Web App URL with Execute as "Me" and Who has access "Anyone".',
    };
  }

  const outboundPayload: Record<string, any> = apiKey
    ? { ...payload, apiKey }
    : { ...payload };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let currentUrl = targetUrl;
  let currentMethod: 'POST' | 'GET' = 'POST';
  let currentBody: string | undefined = JSON.stringify(outboundPayload);
  let redirectCount = 0;

  try {
    let resp: Response | null = null;

    for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop++) {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };

      if (currentMethod === 'POST') {
        headers['Content-Type'] = 'application/json';
      }

      // Attach authentication headers ONLY on hop 0 (initial POST to script.google.com).
      // Never forward Authorization or x-api-key across 302 redirects to script.googleusercontent.com.
      if (hop === 0) {
        if (apiKey) {
          headers['x-api-key'] = apiKey;
        }
        if (bearerToken) {
          headers['Authorization'] = `Bearer ${bearerToken}`;
        }
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

      const nextHost = extractHostnameForLog(resolvedNextUrl);
      diagnostics.redirectDestinationHosts.push(nextHost);

      // Immediately detect Google Sign-In redirect (indicates restricted/archived Web App deployment)
      if (isGoogleLoginHost(resolvedNextUrl)) {
        clearTimeout(timeoutId);
        const safeNext = sanitizeUrlForLog(resolvedNextUrl);
        diagnostics.httpStatus = 401;
        diagnostics.responseContentType = (resp.headers?.get?.('content-type') || '').toLowerCase();
        diagnostics.redirectCount = redirectCount;
        diagnostics.failedAuthCheck = 'google_auth_redirect';

        console.error('[emailAutomation] Google Sign-In redirect detected before doPost executed:', {
          action: safeAction,
          authStrategy,
          ...diagnostics,
        });
        return {
          ok: false,
          httpStatus: 401,
          finalUrl: safeNext,
          redirectCount,
          authRequired: true,
          authStrategy,
          diagnostics,
          error: diagnostics.isUsingDefaultFallbackUrl
            ? 'APPS_SCRIPT_INQUIRY_URL is not set in this Vercel environment (using legacy fallback URL which redirects to Google Sign-In). Set APPS_SCRIPT_INQUIRY_URL in Vercel Production Environment Variables and redeploy.'
            : 'Email automation endpoint redirected to Google Sign-In (HTTP 401) before doPost(e) ran. Redeploy the Apps Script Web App with Execute as "Me" and Who has access "Anyone", then update APPS_SCRIPT_INQUIRY_URL.',
        };
      }

      if (!isAllowedRedirectHost(resolvedNextUrl)) {
        clearTimeout(timeoutId);
        const safeNext = sanitizeUrlForLog(resolvedNextUrl);
        diagnostics.httpStatus = resp.status;
        diagnostics.redirectCount = redirectCount;
        diagnostics.failedAuthCheck = 'unexpected_redirect';

        console.error('[emailAutomation] Unexpected redirect destination host:', {
          action: safeAction,
          authStrategy,
          ...diagnostics,
        });
        return {
          ok: false,
          httpStatus: resp.status,
          finalUrl: safeNext,
          redirectCount,
          authStrategy,
          diagnostics,
          error: 'Email automation endpoint redirected to an unexpected host.',
        };
      }

      if (hop === MAX_REDIRECT_HOPS) {
        clearTimeout(timeoutId);
        const safeFinal = sanitizeUrlForLog(resolvedNextUrl);
        diagnostics.httpStatus = resp.status;
        diagnostics.redirectCount = redirectCount;
        diagnostics.failedAuthCheck = 'unexpected_redirect';

        console.error('[emailAutomation] Exceeded maximum redirects:', {
          action: safeAction,
          authStrategy,
          ...diagnostics,
        });
        return {
          ok: false,
          httpStatus: resp.status,
          finalUrl: safeFinal,
          redirectCount,
          authStrategy,
          diagnostics,
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
      diagnostics.redirectCount = redirectCount;
    }

    clearTimeout(timeoutId);

    if (!resp) {
      diagnostics.failedAuthCheck = 'network_or_timeout';
      return {
        ok: false,
        authStrategy,
        diagnostics,
        error: 'No response received from email automation endpoint.',
      };
    }

    const finalResponseUrl = sanitizeUrlForLog(resp.url || currentUrl);
    const contentType = (resp.headers?.get?.('content-type') || '').toLowerCase();
    const rawText = await resp.text();
    const trimmedText = rawText.trim();
    const bodySnippet = sanitizeBodySnippetForLog(trimmedText);

    diagnostics.httpStatus = resp.status;
    diagnostics.responseContentType = contentType;
    diagnostics.redirectCount = redirectCount;

    let parsed: Record<string, any> | null = null;
    if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
      try {
        parsed = JSON.parse(trimmedText);
      } catch {
        parsed = null;
      }
    }

    const remoteKeyFlags = extractAppsScriptKeyBooleans(parsed);
    diagnostics.appsScriptExpectedKeyPresent = remoteKeyFlags.expectedKeyPresent;
    diagnostics.appsScriptReceivedKeyPresent = remoteKeyFlags.receivedKeyPresent;

    if (!resp.ok) {
      const isAuthFailure = resp.status === 401 || resp.status === 403;
      diagnostics.failedAuthCheck = isAuthFailure ? 'google_http_auth' : 'apps_script_runtime_error';

      let fallbackErrMsg = `Email automation endpoint returned HTTP ${resp.status}.`;
      if (resp.status === 401) {
        if (diagnostics.isUsingDefaultFallbackUrl) {
          fallbackErrMsg =
            'Email automation endpoint returned HTTP 401 because APPS_SCRIPT_INQUIRY_URL is not configured in this Vercel environment (falling back to legacy URL). Add APPS_SCRIPT_INQUIRY_URL to Vercel Production Environment Variables and redeploy.';
        } else if (bearerToken) {
          fallbackErrMsg =
            'Email automation endpoint returned HTTP 401 from Google auth layer. Verify APPS_SCRIPT_BEARER_TOKEN is a valid Google OAuth2 access token, or unset it for a "Who has access: Anyone" deployment.';
        } else {
          fallbackErrMsg =
            'Email automation endpoint returned HTTP 401 from Google before doPost(e) executed. Confirm the active /exec deployment URL has Execute as "Me", Who has access "Anyone", and is not restricted by Google Workspace domain policy.';
        }
      }

      const errMsg = parsed?.error || parsed?.message || fallbackErrMsg;

      console.error('[emailAutomation] Apps Script HTTP error:', {
        action: safeAction,
        authStrategy,
        ...diagnostics,
        bodySnippet,
      });

      return {
        ok: false,
        httpStatus: resp.status,
        finalUrl: finalResponseUrl,
        redirectCount,
        bodySnippet,
        authRequired: isAuthFailure,
        authStrategy,
        diagnostics,
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
        diagnostics.failedAuthCheck = 'apps_script_html_auth';
        reason =
          'Email automation Web App requires authorization ("Execute as: Me" and "Who has access: Anyone").';
      } else if (lower.includes('script function not found') || lower.includes('dopost')) {
        diagnostics.failedAuthCheck = 'apps_script_runtime_error';
        reason = 'Email automation Web App doPost handler is missing or misconfigured.';
      } else if (
        lower.includes('<!doctype') ||
        lower.includes('<html') ||
        contentType.includes('text/html')
      ) {
        diagnostics.failedAuthCheck = 'apps_script_non_json';
        reason = 'Email automation Web App returned an HTML error page instead of JSON confirmation.';
      } else {
        diagnostics.failedAuthCheck = 'apps_script_non_json';
      }

      console.error('[emailAutomation] Apps Script non-JSON response:', {
        action: safeAction,
        authStrategy,
        ...diagnostics,
        bodySnippet,
      });

      return {
        ok: false,
        httpStatus: resp.status,
        finalUrl: finalResponseUrl,
        redirectCount,
        bodySnippet,
        authRequired,
        authStrategy,
        diagnostics,
        error: reason,
      };
    }

    if (parsed.success !== true || parsed.status === 'error' || parsed.result === 'error') {
      const errMsg =
        parsed.error ||
        parsed.message ||
        'The email automation service could not send the email.';

      const isApiKeyRejection =
        parsed.code === 401 ||
        /unauthorized|invalid\s+api\s*key|api\s*key/i.test(String(errMsg));

      diagnostics.httpStatus = isApiKeyRejection ? 401 : resp.status;
      diagnostics.failedAuthCheck = isApiKeyRejection
        ? 'apps_script_api_key_rejected'
        : 'apps_script_runtime_error';

      console.error('[emailAutomation] Apps Script JSON error:', {
        action: safeAction,
        authStrategy,
        ...diagnostics,
        bodySnippet: sanitizeBodySnippetForLog(String(errMsg), 160),
      });

      return {
        ok: false,
        httpStatus: diagnostics.httpStatus,
        finalUrl: finalResponseUrl,
        redirectCount,
        bodySnippet,
        authRequired: isApiKeyRejection,
        authStrategy,
        diagnostics,
        rawParsed: parsed,
        error: errMsg,
      };
    }

    return {
      ok: true,
      httpStatus: resp.status,
      finalUrl: finalResponseUrl,
      redirectCount,
      authStrategy,
      diagnostics,
      rawParsed: parsed,
      message: parsed.message || 'Email dispatched successfully.',
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isAbort = err?.name === 'AbortError';
    const safeFinal = sanitizeUrlForLog(currentUrl);
    diagnostics.failedAuthCheck = 'network_or_timeout';
    const message = isAbort
      ? 'The email automation service timed out. Please try again.'
      : err?.message || 'Unable to connect to the email automation endpoint.';

    console.error('[emailAutomation] Apps Script network error:', {
      action: safeAction,
      authStrategy,
      abort: isAbort,
      ...diagnostics,
      reason: sanitizeBodySnippetForLog(String(err?.message || ''), 140),
    });

    return {
      ok: false,
      finalUrl: safeFinal,
      redirectCount,
      authStrategy,
      diagnostics,
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

import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export interface SendEmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

export type SmtpErrorCode =
  | 'SMTP_NOT_CONFIGURED'
  | 'SMTP_AUTH_FAILED'
  | 'SMTP_CONNECTION_FAILED'
  | 'SMTP_RATE_LIMITED'
  | 'SMTP_RECIPIENT_REJECTED'
  | 'SMTP_UNKNOWN_ERROR';

export class SmtpDeliveryError extends Error {
  readonly errorCode: SmtpErrorCode;
  readonly httpStatus: number;
  readonly userMessage: string;
  readonly smtpCode: string | null;
  readonly responseCode: number | null;

  constructor(params: {
    errorCode: SmtpErrorCode;
    httpStatus: number;
    userMessage: string;
    message: string;
    smtpCode?: string | null;
    responseCode?: number | null;
  }) {
    super(params.message);
    this.name = 'SmtpDeliveryError';
    this.errorCode = params.errorCode;
    this.httpStatus = params.httpStatus;
    this.userMessage = params.userMessage;
    this.smtpCode = params.smtpCode ?? null;
    this.responseCode = params.responseCode ?? null;
  }
}

export class SmtpConfigError extends SmtpDeliveryError {
  constructor(message: string) {
    super({
      errorCode: 'SMTP_NOT_CONFIGURED',
      httpStatus: 503,
      userMessage:
        'Email service is not configured on the server (missing GMAIL_USER or GMAIL_APP_PASSWORD). Please contact MirrorBook support.',
      message,
    });
    this.name = 'SmtpConfigError';
  }
}

/**
 * Trims whitespace and strips accidental surrounding single/double quotes that often occur
 * when values are copy-pasted from .env files into the Vercel Environment Variables UI.
 */
function stripWrappingQuotes(raw?: string): string {
  if (typeof raw !== 'string') return '';
  let val = raw.trim();
  while (
    val.length >= 2 &&
    ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
  ) {
    val = val.slice(1, -1).trim();
  }
  return val;
}

export function getGmailSenderEmail(): string {
  return stripWrappingQuotes(
    process.env.GMAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USER
  );
}

/**
 * Reads `GMAIL_APP_PASSWORD` (with standard fallback aliases), strips surrounding quotes,
 * and removes spaces (Google displays 16-char App Passwords in 4-character groups like
 * "abcd efgh ijkl mnop", while Gmail SMTP expects the 16 characters without spaces).
 */
export function getNormalizedGmailAppPassword(): string {
  const cleaned = stripWrappingQuotes(
    process.env.GMAIL_APP_PASSWORD ||
      process.env.GMAIL_PASS ||
      process.env.GMAIL_PASSWORD ||
      process.env.SMTP_PASS ||
      process.env.EMAIL_PASS
  );
  return cleaned ? cleaned.replace(/\s+/g, '') : '';
}

export function isSmtpConfigured(): boolean {
  const user = getGmailSenderEmail();
  const pass = getNormalizedGmailAppPassword();
  return Boolean(user && pass && user.includes('@'));
}

export function getAdminNotificationEmail(): string {
  return (
    stripWrappingQuotes(process.env.ADMIN_EMAIL) ||
    getGmailSenderEmail() ||
    'mirrorbook.site@gmail.com'
  );
}

/**
 * Redacts emails, passwords, tokens, and secrets before writing diagnostic text to server logs.
 */
export function sanitizeLogMessage(raw?: string | null, maxLen = 220): string {
  if (!raw || typeof raw !== 'string') return '';
  const cleaned = raw
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(
      /(free_access_token|password|app_password|secret|token|api[_-]?key)\s*[:=]\s*["']?[^\s"'&,;}\]]+["']?/gi,
      '$1=[redacted]'
    )
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]');

  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen)}...` : cleaned;
}

function isRetryableConnectionError(err: any): boolean {
  const code = String(err?.code || '').toUpperCase();
  return (
    code === 'ETIMEDOUT' ||
    code === 'ECONNECTION' ||
    code === 'ESOCKET' ||
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    code === 'ENETUNREACH' ||
    code === 'EHOSTUNREACH'
  );
}

export function classifySmtpError(err: any): SmtpDeliveryError {
  if (err instanceof SmtpDeliveryError) {
    return err;
  }

  const smtpCode = err?.code ? String(err.code).toUpperCase() : null;
  const responseCode = typeof err?.responseCode === 'number' ? err.responseCode : null;
  const rawMessage = String(err?.message || 'Gmail SMTP delivery failed');
  const lower = rawMessage.toLowerCase();

  if (
    smtpCode === 'EAUTH' ||
    responseCode === 535 ||
    responseCode === 534 ||
    lower.includes('invalid login') ||
    lower.includes('username and password not accepted') ||
    lower.includes('application-specific password required')
  ) {
    return new SmtpDeliveryError({
      errorCode: 'SMTP_AUTH_FAILED',
      httpStatus: 502,
      userMessage:
        'Email server authentication failed (Gmail rejected GMAIL_USER / GMAIL_APP_PASSWORD). Verify 2-Step Verification and a valid 16-character Google App Password in Vercel.',
      message: rawMessage,
      smtpCode,
      responseCode,
    });
  }

  if (
    responseCode === 421 ||
    responseCode === 450 ||
    responseCode === 451 ||
    responseCode === 454 ||
    lower.includes('daily user sending limit') ||
    lower.includes('daily sending quota') ||
    lower.includes('too many')
  ) {
    return new SmtpDeliveryError({
      errorCode: 'SMTP_RATE_LIMITED',
      httpStatus: 503,
      userMessage:
        'Gmail sending limit was temporarily reached. Please wait a few minutes and try again.',
      message: rawMessage,
      smtpCode,
      responseCode,
    });
  }

  if (
    smtpCode === 'EENVELOPE' ||
    responseCode === 550 ||
    responseCode === 551 ||
    responseCode === 553 ||
    lower.includes('recipient address rejected') ||
    lower.includes('no recipients defined')
  ) {
    return new SmtpDeliveryError({
      errorCode: 'SMTP_RECIPIENT_REJECTED',
      httpStatus: 400,
      userMessage:
        'The recipient email address was rejected. Please double-check your email address and try again.',
      message: rawMessage,
      smtpCode,
      responseCode,
    });
  }

  if (isRetryableConnectionError(err) || smtpCode === 'EDNS' || smtpCode === 'ENOTFOUND') {
    return new SmtpDeliveryError({
      errorCode: 'SMTP_CONNECTION_FAILED',
      httpStatus: 502,
      userMessage:
        'Could not connect to Gmail SMTP right now. Please try again in a moment.',
      message: rawMessage,
      smtpCode,
      responseCode,
    });
  }

  return new SmtpDeliveryError({
    errorCode: 'SMTP_UNKNOWN_ERROR',
    httpStatus: 502,
    userMessage:
      'Unable to send confirmation email right now. Please verify your email address or try again.',
    message: rawMessage,
    smtpCode,
    responseCode,
  });
}

function buildTransportConfig(params: {
  host: string;
  port: number;
  user: string;
  pass: string;
  pool: boolean;
}): SMTPTransport.Options {
  const secure = params.port === 465;
  return {
    host: params.host,
    port: params.port,
    secure,
    ...(secure ? {} : { requireTLS: true }),
    // Force IPv4 on serverless runtimes (AWS Lambda / Vercel) to avoid IPv6 egress hangs to smtp.gmail.com
    family: 4,
    connectionTimeout: 6000,
    greetingTimeout: 6000,
    socketTimeout: 9000,
    tls: {
      minVersion: 'TLSv1.2',
      servername: params.host,
    },
    auth: {
      user: params.user,
      pass: params.pass,
    },
    ...(params.pool ? { pool: true, maxConnections: 1, maxMessages: 5 } : {}),
  } as SMTPTransport.Options;
}

function logSmtpDiagnostics(params: {
  stage: string;
  host: string;
  port: number;
  gmailUser: string;
  appPasswordLen: number;
  classified: SmtpDeliveryError;
  command?: string | null;
}) {
  const userDomain = params.gmailUser.includes('@')
    ? params.gmailUser.split('@')[1].toLowerCase()
    : 'invalid';

  console.error(`[mailer] ${params.stage}:`, {
    errorCode: params.classified.errorCode,
    smtpCode: params.classified.smtpCode,
    responseCode: params.classified.responseCode,
    command: params.command || null,
    host: params.host,
    port: params.port,
    hasGmailUser: Boolean(params.gmailUser),
    gmailUserDomain: userDomain,
    appPasswordLength: params.appPasswordLen,
    reason: sanitizeLogMessage(params.classified.message, 200),
  });
}

async function sendMessagesWithPort(params: {
  messages: Array<{ options: SendEmailOptions; optional?: boolean }>;
  host: string;
  port: number;
  gmailUser: string;
  gmailAppPassword: string;
}): Promise<SendEmailResult[]> {
  const usePool = params.messages.length > 1;
  const transporter = nodemailer.createTransport(
    buildTransportConfig({
      host: params.host,
      port: params.port,
      user: params.gmailUser,
      pass: params.gmailAppPassword,
      pool: usePool,
    })
  );

  const results: SendEmailResult[] = [];
  try {
    for (const entry of params.messages) {
      try {
        const info = await transporter.sendMail({
          from: `"MirrorBook" <${params.gmailUser}>`,
          to: entry.options.to,
          ...(entry.options.replyTo ? { replyTo: entry.options.replyTo } : {}),
          subject: entry.options.subject,
          text: entry.options.text,
          html: entry.options.html,
        });

        const accepted = Array.isArray(info.accepted) ? info.accepted.map(String) : [];
        const rejected = Array.isArray(info.rejected) ? info.rejected.map(String) : [];

        if (accepted.length === 0 && rejected.length > 0) {
          throw new SmtpDeliveryError({
            errorCode: 'SMTP_RECIPIENT_REJECTED',
            httpStatus: 400,
            userMessage:
              'The recipient email address was rejected. Please double-check your email address and try again.',
            message: 'Recipient email address was rejected by Gmail SMTP.',
            responseCode: 550,
          });
        }

        results.push({
          messageId: String(info.messageId || ''),
          accepted,
          rejected,
        });
      } catch (msgErr: any) {
        if (entry.optional) {
          const classified = classifySmtpError(msgErr);
          logSmtpDiagnostics({
            stage: 'Optional secondary email skipped after SMTP error',
            host: params.host,
            port: params.port,
            gmailUser: params.gmailUser,
            appPasswordLen: params.gmailAppPassword.length,
            classified,
            command: msgErr?.command,
          });
          results.push({ messageId: '', accepted: [], rejected: [] });
          continue;
        }
        throw msgErr;
      }
    }
    return results;
  } finally {
    try {
      transporter.close();
    } catch {
      // Ignore close errors
    }
  }
}

/**
 * Sends one or more emails over a single Gmail SMTP connection (reusing the TLS/AUTH handshake
 * inside Vercel Serverless Functions). Automatically falls back from port 465 (SMTPS) to
 * port 587 (STARTTLS) if port 465 encounters a connection/timeout error and no custom SMTP_PORT was set.
 */
export async function sendEmailBatch(
  messages: Array<{ options: SendEmailOptions; optional?: boolean }>
): Promise<SendEmailResult[]> {
  const gmailUser = getGmailSenderEmail();
  const gmailAppPassword = getNormalizedGmailAppPassword();
  const smtpHost = stripWrappingQuotes(process.env.SMTP_HOST) || 'smtp.gmail.com';
  const explicitPort = stripWrappingQuotes(process.env.SMTP_PORT);
  const primaryPort = explicitPort ? Number(explicitPort) || 465 : 465;

  if (!gmailUser || !gmailUser.includes('@') || !gmailAppPassword) {
    console.error('[mailer] Gmail SMTP credentials missing or malformed:', {
      hasGmailUser: Boolean(gmailUser),
      gmailUserHasAtSign: gmailUser.includes('@'),
      hasGmailAppPassword: Boolean(gmailAppPassword),
      appPasswordLength: gmailAppPassword.length,
    });
    throw new SmtpConfigError(
      'Email service is not configured. Missing valid GMAIL_USER or GMAIL_APP_PASSWORD.'
    );
  }

  try {
    return await sendMessagesWithPort({
      messages,
      host: smtpHost,
      port: primaryPort,
      gmailUser,
      gmailAppPassword,
    });
  } catch (primaryErr: any) {
    const classifiedPrimary = classifySmtpError(primaryErr);

    // If port 465 failed due to network/timeout and SMTP_PORT wasn't pinned, retry once on port 587 STARTTLS
    if (!explicitPort && primaryPort === 465 && isRetryableConnectionError(primaryErr)) {
      logSmtpDiagnostics({
        stage: 'Port 465 connection error; retrying on port 587 STARTTLS',
        host: smtpHost,
        port: primaryPort,
        gmailUser,
        appPasswordLen: gmailAppPassword.length,
        classified: classifiedPrimary,
        command: primaryErr?.command,
      });

      try {
        return await sendMessagesWithPort({
          messages,
          host: smtpHost,
          port: 587,
          gmailUser,
          gmailAppPassword,
        });
      } catch (fallbackErr: any) {
        const classifiedFallback = classifySmtpError(fallbackErr);
        logSmtpDiagnostics({
          stage: 'Gmail SMTP send failed on fallback port 587',
          host: smtpHost,
          port: 587,
          gmailUser,
          appPasswordLen: gmailAppPassword.length,
          classified: classifiedFallback,
          command: fallbackErr?.command,
        });
        throw classifiedFallback;
      }
    }

    logSmtpDiagnostics({
      stage: 'Gmail SMTP send failed',
      host: smtpHost,
      port: primaryPort,
      gmailUser,
      appPasswordLen: gmailAppPassword.length,
      classified: classifiedPrimary,
      command: primaryErr?.command,
    });
    throw classifiedPrimary;
  }
}

/**
 * Centralized MirrorBook Gmail SMTP sender for single transactional emails.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const [result] = await sendEmailBatch([{ options }]);
  return result;
}

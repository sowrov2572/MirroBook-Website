import nodemailer from 'nodemailer';

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

export class SmtpConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SmtpConfigError';
  }
}

export function getGmailSenderEmail(): string {
  return process.env.GMAIL_USER?.trim() || '';
}

/**
 * Reads `GMAIL_APP_PASSWORD` and strips accidental spaces (Google displays 16-char App Passwords
 * in 4-character groups like "abcd efgh ijkl mnop", while Gmail SMTP expects no spaces).
 */
function getGmailAppPassword(): string {
  const raw = process.env.GMAIL_APP_PASSWORD?.trim() || '';
  return raw ? raw.replace(/\s+/g, '') : '';
}

export function isSmtpConfigured(): boolean {
  return Boolean(getGmailSenderEmail() && getGmailAppPassword());
}

export function getAdminNotificationEmail(): string {
  return (
    process.env.ADMIN_EMAIL?.trim() ||
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

/**
 * Centralized MirrorBook Gmail SMTP sender using Nodemailer.
 * Uses bounded timeouts and non-pooled connections for reliable execution inside
 * Vercel Serverless Functions. Never logs credentials, secrets, or recipient PII.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const gmailUser = getGmailSenderEmail();
  const gmailAppPassword = getGmailAppPassword();
  const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const secure = smtpPort === 465;

  if (!gmailUser || !gmailAppPassword) {
    console.error('[mailer] Gmail SMTP credentials missing:', {
      hasGmailUser: Boolean(gmailUser),
      hasGmailAppPassword: Boolean(gmailAppPassword),
    });
    throw new SmtpConfigError(
      'Email service is not configured. Missing GMAIL_USER or GMAIL_APP_PASSWORD.'
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure,
    pool: false,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"MirrorBook" <${gmailUser}>`,
      to: options.to,
      ...(options.replyTo ? { replyTo: options.replyTo } : {}),
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    const accepted = Array.isArray(info.accepted) ? info.accepted.map(String) : [];
    const rejected = Array.isArray(info.rejected) ? info.rejected.map(String) : [];

    if (accepted.length === 0 && rejected.length > 0) {
      throw new Error('Recipient email address was rejected by Gmail SMTP.');
    }

    return {
      messageId: String(info.messageId || ''),
      accepted,
      rejected,
    };
  } catch (err: any) {
    console.error('[mailer] Gmail SMTP send failed:', {
      host: smtpHost,
      port: smtpPort,
      secure,
      code: err?.code || null,
      responseCode: err?.responseCode || null,
      command: err?.command || null,
      reason: sanitizeLogMessage(err?.message || 'SMTP send failed', 180),
    });
    throw err;
  } finally {
    try {
      transporter.close();
    } catch {
      // Ignore close errors on non-pooled transport
    }
  }
}

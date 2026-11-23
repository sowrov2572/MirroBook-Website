import { getGeminiApiKey } from '../_lib/gemini.js';

export interface MetaStatusResult {
  status: number;
  data: {
    success: boolean;
    geminiReady: boolean;
    webhookUrl: string;
    metaVerifyTokenConfigured: boolean;
    facebookMessengerConfigured: boolean;
    whatsappCloudConfigured: boolean;
    metaAppId: string;
  };
}

export function processMetaStatus(requestOrigin?: string): MetaStatusResult {
  const origin =
    requestOrigin && /^https?:\/\//i.test(requestOrigin)
      ? requestOrigin.replace(/\/+$/, '')
      : 'https://mirrorbook.site';

  const geminiKey = getGeminiApiKey();
  const geminiReady = Boolean(geminiKey && geminiKey !== 'MY_GEMINI_API_KEY');
  const metaVerifyTokenConfigured = Boolean((process.env.META_WEBHOOK_VERIFY_TOKEN || '').trim());
  const facebookMessengerConfigured = Boolean((process.env.META_PAGE_ACCESS_TOKEN || '').trim());
  const whatsappCloudConfigured = Boolean(
    (process.env.WHATSAPP_ACCESS_TOKEN || '').trim() &&
      (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim()
  );
  const metaAppId = (process.env.META_APP_ID || '').trim();

  return {
    status: 200,
    data: {
      success: true,
      geminiReady,
      webhookUrl: `${origin}/api/mirrorbot/meta-webhook`,
      metaVerifyTokenConfigured,
      facebookMessengerConfigured,
      whatsappCloudConfigured,
      metaAppId,
    },
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed. Use GET.' });
    return;
  }

  const proto = (req.headers?.['x-forwarded-proto'] as string) || 'https';
  const host = (req.headers?.['x-forwarded-host'] as string) || (req.headers?.host as string) || '';
  const origin = host ? `${proto}://${host}` : 'https://mirrorbook.site';

  const result = processMetaStatus(origin);
  res.setHeader('Cache-Control', 'no-store');
  res.status(result.status).json(result.data);
}

import crypto from 'crypto';
import { processMirrorBotChat, type MirrorBotBusinessContext } from './chat.js';

function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyMetaSignature(rawBody: string, signatureHeader?: string): boolean {
  const appSecret = (process.env.META_APP_SECRET || '').trim();
  if (!appSecret) return true; // Optional when META_APP_SECRET is not set
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;

  const expected =
    'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');
  return safeEquals(expected, signatureHeader);
}

function getDefaultWebhookBusiness(): MirrorBotBusinessContext {
  return {
    businessName: (process.env.MIRRORBOT_BUSINESS_NAME || 'MirrorBook').trim(),
    businessCategory: (process.env.MIRRORBOT_BUSINESS_CATEGORY || 'Creative Studio & Business').trim(),
    whatYouWorkWith: (
      process.env.MIRRORBOT_BUSINESS_SUMMARY ||
      'Graphic design, video editing, web development, MirrorPOS, and Mirror Bot AI support solutions.'
    ).trim(),
    openingHours: (process.env.MIRRORBOT_OPENING_HOURS || '10:00 AM – 10:00 PM (Sat–Thu)').trim(),
    deliveryInfo: (
      process.env.MIRRORBOT_DELIVERY_INFO ||
      'Nationwide Cash on Delivery and digital service delivery across Bangladesh.'
    ).trim(),
    codAvailable: true,
    supportPhone: (process.env.MIRRORBOT_SUPPORT_PHONE || '+8801767079837').trim(),
    botName: (process.env.MIRRORBOT_AGENT_NAME || 'Mirror Bot').trim(),
  };
}

async function sendMessengerReply(recipientId: string, text: string): Promise<void> {
  const pageToken = (process.env.META_PAGE_ACCESS_TOKEN || '').trim();
  if (!pageToken || !recipientId || !text) return;

  await fetch('https://graph.facebook.com/v21.0/me/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pageToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_type: 'RESPONSE',
      recipient: { id: recipientId },
      message: { text },
    }),
  });
}

async function sendWhatsAppReply(toNumber: string, text: string): Promise<void> {
  const waToken = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
  const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
  if (!waToken || !phoneNumberId || !toNumber || !text) return;

  await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(phoneNumberId)}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${waToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toNumber,
      type: 'text',
      text: { body: text },
    }),
  });
}

export async function processMetaWebhookGet(query: URLSearchParams): Promise<{
  status: number;
  body: string;
  contentType: string;
}> {
  const mode = query.get('hub.mode') || '';
  const token = query.get('hub.verify_token') || '';
  const challenge = query.get('hub.challenge') || '';
  const expectedToken = (process.env.META_WEBHOOK_VERIFY_TOKEN || '').trim();

  if (!expectedToken) {
    return {
      status: 503,
      body: JSON.stringify({
        success: false,
        error: 'META_WEBHOOK_VERIFY_TOKEN is not configured on the server.',
      }),
      contentType: 'application/json',
    };
  }

  if (mode === 'subscribe' && token && safeEquals(token, expectedToken)) {
    return {
      status: 200,
      body: challenge,
      contentType: 'text/plain',
    };
  }

  return {
    status: 403,
    body: JSON.stringify({ success: false, error: 'Webhook verification token mismatch.' }),
    contentType: 'application/json',
  };
}

export async function processMetaWebhookPost(params: {
  rawBody: string;
  signatureHeader?: string;
  clientIp: string;
}): Promise<{ status: number; data: Record<string, any> }> {
  if (!verifyMetaSignature(params.rawBody, params.signatureHeader)) {
    return { status: 403, data: { success: false, error: 'Invalid webhook signature.' } };
  }

  let payload: any;
  try {
    payload = JSON.parse(params.rawBody || '{}');
  } catch {
    return { status: 400, data: { success: false, error: 'Invalid JSON payload.' } };
  }

  const business = getDefaultWebhookBusiness();
  let handled = 0;

  // 1. Facebook Page / Messenger incoming messages
  if (payload?.object === 'page' && Array.isArray(payload.entry)) {
    for (const entry of payload.entry) {
      const events = Array.isArray(entry?.messaging) ? entry.messaging : [];
      for (const event of events) {
        const senderId = event?.sender?.id;
        const msgText = event?.message?.text;
        if (!senderId || !msgText || event?.message?.is_echo) continue;

        const aiResult = await processMirrorBotChat(
          { business, message: String(msgText), history: [] },
          params.clientIp
        );
        if (aiResult.status === 200 && Array.isArray(aiResult.data.replies)) {
          for (const replyText of aiResult.data.replies) {
            await sendMessengerReply(String(senderId), replyText);
          }
          handled += 1;
        }
      }
    }
  }

  // 2. WhatsApp Business Cloud API incoming messages
  if (payload?.object === 'whatsapp_business_account' && Array.isArray(payload.entry)) {
    for (const entry of payload.entry) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const incoming = Array.isArray(change?.value?.messages) ? change.value.messages : [];
        for (const msg of incoming) {
          const from = msg?.from;
          const textBody = msg?.text?.body;
          if (!from || !textBody) continue;

          const aiResult = await processMirrorBotChat(
            { business, message: String(textBody), history: [] },
            params.clientIp
          );
          if (aiResult.status === 200 && Array.isArray(aiResult.data.replies)) {
            for (const replyText of aiResult.data.replies) {
              await sendWhatsAppReply(String(from), replyText);
            }
            handled += 1;
          }
        }
      }
    }
  }

  return { status: 200, data: { success: true, handled } };
}

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const urlObj = new URL(req.url || '/', 'https://mirrorbook.site');
    const result = await processMetaWebhookGet(urlObj.searchParams);
    res.status(result.status);
    res.setHeader('Content-Type', result.contentType);
    res.send(result.body);
    return;
  }

  if (req.method === 'POST') {
    const rawBody =
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const signatureHeader =
      typeof req.headers?.['x-hub-signature-256'] === 'string'
        ? req.headers['x-hub-signature-256']
        : undefined;
    const clientIp =
      (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    const result = await processMetaWebhookPost({ rawBody, signatureHeader, clientIp });
    res.status(result.status).json(result.data);
    return;
  }

  res.status(405).json({ success: false, error: 'Method not allowed.' });
}

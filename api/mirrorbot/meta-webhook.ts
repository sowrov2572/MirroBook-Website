import crypto from 'crypto';
import { processMirrorBotChat, type MirrorBotBusinessContext } from './chat.js';
import {
  resolveWorkspaceByPageId,
  resolveWorkspaceByWhatsAppPhoneId,
  type MirrorBotWorkspaceRecord,
} from '../_lib/metaStore.js';

const MAX_WEBHOOK_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyMetaSignature(rawBody: string, signatureHeader?: string): boolean {
  const appSecret = (process.env.META_APP_SECRET || '').trim();
  if (!appSecret) return false;
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;

  const expected =
    'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');
  return safeEquals(expected, signatureHeader);
}

function isAllowedMetaMediaHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '169.254.169.254' ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
    host.includes(':')
  ) {
    return false;
  }

  return (
    host === 'graph.facebook.com' ||
    host === 'lookaside.fbsbx.com' ||
    host.endsWith('.fbcdn.net') ||
    host.endsWith('.fbsbx.com') ||
    host.endsWith('.facebook.com') ||
    host.endsWith('.whatsapp.net') ||
    host.endsWith('.cdninstagram.com')
  );
}

async function fetchMetaImageAsBase64(
  rawUrl: string,
  bearerToken?: string
): Promise<{ mimeType: string; base64Data: string } | null> {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' || !isAllowedMetaMediaHost(parsed.hostname)) {
      return null;
    }

    const headers: Record<string, string> = {};
    if (bearerToken) {
      headers.Authorization = `Bearer ${bearerToken}`;
    }

    const res = await fetch(parsed.toString(), { headers });
    if (!res.ok) return null;

    const rawMime = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim().toLowerCase();
    const mimeType = ALLOWED_IMAGE_MIMES.has(rawMime) ? rawMime : 'image/jpeg';

    const arrayBuf = await res.arrayBuffer();
    if (!arrayBuf || arrayBuf.byteLength === 0 || arrayBuf.byteLength > MAX_WEBHOOK_IMAGE_BYTES) {
      return null;
    }

    return {
      mimeType,
      base64Data: Buffer.from(arrayBuf).toString('base64'),
    };
  } catch {
    return null;
  }
}

async function fetchWhatsAppMediaImage(
  mediaId: string,
  waToken: string
): Promise<{ mimeType: string; base64Data: string } | null> {
  if (!mediaId || !waToken) return null;
  try {
    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(mediaId)}`,
      { headers: { Authorization: `Bearer ${waToken}` } }
    );
    if (!metaRes.ok) return null;
    const metaJson: any = await metaRes.json().catch(() => null);
    const mediaUrl = typeof metaJson?.url === 'string' ? metaJson.url : '';
    if (!mediaUrl) return null;
    return await fetchMetaImageAsBase64(mediaUrl, waToken);
  } catch {
    return null;
  }
}

function buildBusinessContextFromWorkspace(
  workspace: MirrorBotWorkspaceRecord
): MirrorBotBusinessContext {
  const summary =
    workspace.workPoints.length > 0
      ? workspace.workPoints.map((pt) => `• ${pt}`).join('\n')
      : 'Products and services provided by the business.';

  return {
    businessName: workspace.businessName || 'MirrorBook Business',
    businessCategory: workspace.facebookPage.pageCategory || 'Business',
    whatYouWorkWith: summary,
    openingHours: '',
    deliveryInfo: '',
    codAvailable: true,
    supportPhone: workspace.whatsapp.displayPhone || '',
    botName: workspace.botName || 'Mirror Bot',
    connectedChannels: {
      facebookPage: workspace.facebookPage.connected ? workspace.facebookPage.pageName : undefined,
      messengerConnected: workspace.messenger.connected,
      whatsappConnected: workspace.whatsapp.connected,
      whatsappNumber: workspace.whatsapp.displayPhone || undefined,
    },
  };
}

async function sendMessengerReply(
  recipientId: string,
  text: string,
  pageToken: string
): Promise<void> {
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

async function sendFacebookCommentReply(
  commentId: string,
  text: string,
  pageToken: string
): Promise<void> {
  if (!pageToken || !commentId || !text) return;

  await fetch(
    `https://graph.facebook.com/v21.0/${encodeURIComponent(commentId)}/comments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pageToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: text }),
    }
  );
}

async function sendWhatsAppReply(
  toNumber: string,
  text: string,
  waToken: string,
  phoneNumberId: string
): Promise<void> {
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
  const appSecretSet = Boolean((process.env.META_APP_SECRET || '').trim());

  // Direct browser health check (no Meta hub.mode handshake query)
  if (!mode) {
    return {
      status: 200,
      body: JSON.stringify({
        success: true,
        endpoint: 'Mirror Bot Meta Webhook',
        status: 'active',
        verifyTokenConfigured: Boolean(expectedToken),
        appSecretConfigured: appSecretSet,
        note: 'Paste this URL into Meta App Dashboard -> Webhooks (Page, Messenger, WhatsApp) and use your META_WEBHOOK_VERIFY_TOKEN.',
      }),
      contentType: 'application/json',
    };
  }

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

  let handled = 0;

  // 1. Multi-Tenant Facebook Page Comments & Messenger DMs (Text + Photos)
  if (payload?.object === 'page' && Array.isArray(payload.entry)) {
    for (const entry of payload.entry) {
      const pageId = String(entry?.id || '').trim();
      if (!pageId) continue;

      const workspace = await resolveWorkspaceByPageId(pageId);
      if (!workspace || !workspace.autoReplyEnabled) continue;

      const pageToken = workspace.facebookPage.pageAccessToken || '';
      if (!pageToken) continue;

      const business = buildBusinessContextFromWorkspace(workspace);

      // 1a. Messenger direct messages (supports text + customer photos)
      if (workspace.messenger.connected) {
        const events = Array.isArray(entry?.messaging) ? entry.messaging : [];
        for (const event of events) {
          const senderId = event?.sender?.id;
          if (!senderId || event?.message?.is_echo || senderId === pageId) continue;

          const msgText = typeof event?.message?.text === 'string' ? event.message.text.trim() : '';
          const attachments = Array.isArray(event?.message?.attachments)
            ? event.message.attachments
            : [];
          const imageAttachment = attachments.find(
            (att: any) => att?.type === 'image' && typeof att?.payload?.url === 'string'
          );

          if (!msgText && !imageAttachment) continue;

          const image = imageAttachment
            ? await fetchMetaImageAsBase64(imageAttachment.payload.url)
            : null;

          if (!msgText && !image) continue;

          const aiResult = await processMirrorBotChat(
            {
              business,
              message: msgText,
              image,
              history: [],
            },
            params.clientIp
          );
          if (aiResult.status === 200 && Array.isArray(aiResult.data.replies)) {
            for (const replyText of aiResult.data.replies) {
              await sendMessengerReply(String(senderId), replyText, pageToken);
            }
            handled += 1;
          }
        }
      }

      // 1b. Facebook Page post comments (supports text + photo comments)
      if (workspace.facebookPage.connected) {
        const changes = Array.isArray(entry?.changes) ? entry.changes : [];
        for (const change of changes) {
          if (change?.field !== 'feed') continue;
          const val = change?.value || {};
          if (val.item !== 'comment' || val.verb !== 'add') continue;

          const commentId = val.comment_id;
          const messageText = typeof val.message === 'string' ? val.message.trim() : '';
          const photoUrl = typeof val.photo === 'string' ? val.photo.trim() : '';
          const fromId = val.from?.id;

          if (!commentId || (fromId && fromId === workspace.facebookPage.pageId)) {
            continue;
          }
          if (!messageText && !photoUrl) continue;

          const image = photoUrl ? await fetchMetaImageAsBase64(photoUrl) : null;
          if (!messageText && !image) continue;

          const aiResult = await processMirrorBotChat(
            {
              business,
              message: messageText,
              image,
              history: [],
            },
            params.clientIp
          );
          if (aiResult.status === 200 && Array.isArray(aiResult.data.replies)) {
            const combined = aiResult.data.replies.join(' ');
            await sendFacebookCommentReply(String(commentId), combined, pageToken);
            handled += 1;
          }
        }
      }
    }
  }

  // 2. Multi-Tenant WhatsApp Business Cloud API (Text + Customer Photos)
  if (payload?.object === 'whatsapp_business_account' && Array.isArray(payload.entry)) {
    for (const entry of payload.entry) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const incomingPhoneId = String(change?.value?.metadata?.phone_number_id || '').trim();
        if (!incomingPhoneId) continue;

        const workspace = await resolveWorkspaceByWhatsAppPhoneId(incomingPhoneId);
        if (!workspace || !workspace.autoReplyEnabled || !workspace.whatsapp.connected) continue;

        const waToken = workspace.whatsapp.accessToken || '';
        if (!waToken) continue;

        const business = buildBusinessContextFromWorkspace(workspace);
        const incoming = Array.isArray(change?.value?.messages) ? change.value.messages : [];

        for (const msg of incoming) {
          const from = msg?.from;
          if (!from) continue;

          let textBody = '';
          let image: { mimeType: string; base64Data: string } | null = null;

          if (msg?.type === 'image' && msg?.image?.id) {
            textBody = typeof msg.image.caption === 'string' ? msg.image.caption.trim() : '';
            image = await fetchWhatsAppMediaImage(String(msg.image.id), waToken);
          } else if (typeof msg?.text?.body === 'string') {
            textBody = msg.text.body.trim();
          }

          if (!textBody && !image) continue;

          const aiResult = await processMirrorBotChat(
            {
              business,
              message: textBody,
              image,
              history: [],
            },
            params.clientIp
          );
          if (aiResult.status === 200 && Array.isArray(aiResult.data.replies)) {
            for (const replyText of aiResult.data.replies) {
              await sendWhatsAppReply(String(from), replyText, waToken, incomingPhoneId);
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

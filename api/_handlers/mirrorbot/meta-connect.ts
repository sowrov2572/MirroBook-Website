import {
  getOAuthSession,
  getWorkspaceByUid,
  saveWorkspaceByUid,
  toSafeWorkspace,
  unregisterChannelRoute,
  verifyCallerAuth,
} from '../../_lib/metaStore.js';

async function subscribePageWebhook(pageId: string, pageAccessToken: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}/subscribed_apps`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${pageAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscribed_fields: ['messages', 'messaging_postbacks', 'feed'],
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function subscribeWabaWebhook(wabaId: string, accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(wabaId)}/subscribed_apps`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function processMetaConnect(
  body: Record<string, any>,
  authorizationHeader?: string
): Promise<{
  status: number;
  data: Record<string, any>;
}> {
  const caller = await verifyCallerAuth(authorizationHeader);
  if (!caller) {
    return {
      status: 401,
      data: { success: false, error: 'Please sign in to manage your Mirror Bot settings.' },
    };
  }

  const uid = caller.uid;
  const action = String(body?.action || '').trim();

  if (action === 'save_profile') {
    const businessName = String(body.businessName || '').trim().slice(0, 100);
    const botName = String(body.botName || '').trim().slice(0, 50) || 'Mirror Bot';
    const rawPoints = Array.isArray(body.workPoints) ? body.workPoints : [];
    const workPoints = rawPoints
      .map((item: unknown) => String(item || '').trim().slice(0, 140))
      .filter(Boolean)
      .slice(0, 15);

    if (!businessName) {
      return { status: 400, data: { success: false, error: 'Please enter your business name.' } };
    }

    const updated = await saveWorkspaceByUid(uid, (curr) => ({
      ...curr,
      activatedInVault: true,
      businessName,
      botName,
      workPoints,
      autoReplyEnabled:
        typeof body.autoReplyEnabled === 'boolean' ? body.autoReplyEnabled : curr.autoReplyEnabled,
    }));

    return {
      status: 200,
      data: { success: true, workspace: toSafeWorkspace(updated) },
    };
  }

  if (action === 'toggle_autoreply') {
    const enabled = Boolean(body.enabled);
    const updated = await saveWorkspaceByUid(uid, (curr) => ({
      ...curr,
      autoReplyEnabled: enabled,
    }));
    return {
      status: 200,
      data: { success: true, workspace: toSafeWorkspace(updated) },
    };
  }

  if (action === 'connect_page') {
    const sessionId = String(body.sessionId || '').trim();
    const pageId = String(body.pageId || '').trim();
    const session = getOAuthSession(sessionId);
    if (!session || session.uid !== uid) {
      return {
        status: 401,
        data: { success: false, error: 'Facebook login session expired. Please login again.' },
      };
    }

    const page = session.pages.find((p) => p.id === pageId);
    if (!page) {
      return { status: 404, data: { success: false, error: 'Selected Facebook Page not found.' } };
    }

    const subscribed = await subscribePageWebhook(page.id, page.accessToken);
    const nowIso = new Date().toISOString();

    const updated = await saveWorkspaceByUid(uid, (curr) => ({
      ...curr,
      facebookPage: {
        connected: true,
        pageId: page.id,
        pageName: page.name,
        pageCategory: page.category,
        connectedAt: nowIso,
        webhookSubscribed: subscribed,
        pageAccessToken: page.accessToken,
      },
      messenger: {
        connected: true,
        pageId: page.id,
        pageName: page.name,
        connectedAt: nowIso,
        webhookSubscribed: subscribed,
      },
    }));

    return {
      status: 200,
      data: { success: true, webhookSubscribed: subscribed, workspace: toSafeWorkspace(updated) },
    };
  }

  if (action === 'connect_whatsapp') {
    const sessionId = String(body.sessionId || '').trim();
    const phoneNumberId = String(body.phoneNumberId || '').trim();
    const session = getOAuthSession(sessionId);
    if (!session || session.uid !== uid) {
      return {
        status: 401,
        data: { success: false, error: 'WhatsApp login session expired. Please login again.' },
      };
    }

    const wa = session.whatsappNumbers.find((w) => w.phoneNumberId === phoneNumberId);
    if (!wa) {
      return {
        status: 404,
        data: { success: false, error: 'Selected WhatsApp Business number not found.' },
      };
    }

    const subscribed = wa.wabaId ? await subscribeWabaWebhook(wa.wabaId, wa.accessToken) : false;
    const nowIso = new Date().toISOString();

    const updated = await saveWorkspaceByUid(uid, (curr) => ({
      ...curr,
      whatsapp: {
        connected: true,
        wabaId: wa.wabaId,
        phoneNumberId: wa.phoneNumberId,
        displayPhone: wa.displayPhone,
        verifiedName: wa.verifiedName,
        connectedAt: nowIso,
        accessToken: wa.accessToken,
      },
    }));

    return {
      status: 200,
      data: { success: true, webhookSubscribed: subscribed, workspace: toSafeWorkspace(updated) },
    };
  }

  if (action === 'disconnect') {
    const channel = String(body.channel || '').trim().toLowerCase();
    const existing = await getWorkspaceByUid(uid);

    if (channel === 'whatsapp' && existing.whatsapp.phoneNumberId) {
      await unregisterChannelRoute('wa', existing.whatsapp.phoneNumberId);
    } else if (channel === 'facebook' && existing.facebookPage.pageId) {
      await unregisterChannelRoute('page', existing.facebookPage.pageId);
    }

    const updated = await saveWorkspaceByUid(uid, (curr) => {
      if (channel === 'whatsapp') {
        return {
          ...curr,
          whatsapp: {
            connected: false,
            wabaId: '',
            phoneNumberId: '',
            displayPhone: '',
            verifiedName: '',
            connectedAt: '',
          },
        };
      }
      if (channel === 'messenger') {
        return {
          ...curr,
          messenger: {
            connected: false,
            pageId: '',
            pageName: '',
            connectedAt: '',
            webhookSubscribed: false,
          },
        };
      }
      return {
        ...curr,
        facebookPage: {
          connected: false,
          pageId: '',
          pageName: '',
          pageCategory: '',
          connectedAt: '',
          webhookSubscribed: false,
        },
        messenger: {
          connected: false,
          pageId: '',
          pageName: '',
          connectedAt: '',
          webhookSubscribed: false,
        },
      };
    });

    return {
      status: 200,
      data: { success: true, workspace: toSafeWorkspace(updated) },
    };
  }

  return { status: 400, data: { success: false, error: 'Unsupported action.' } };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ success: false, error: 'Invalid JSON request body.' });
      return;
    }
  }

  const authHeader =
    typeof req.headers?.authorization === 'string' ? req.headers.authorization : undefined;

  const result = await processMetaConnect(body || {}, authHeader);
  res.setHeader('Cache-Control', 'no-store');
  res.status(result.status).json(result.data);
}

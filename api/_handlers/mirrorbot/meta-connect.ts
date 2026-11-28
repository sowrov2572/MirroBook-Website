import {
  getChannelRouteOwner,
  getGraphApiVersion,
  getOAuthSession,
  getWorkspaceByUid,
  recordDiagnosticEvent,
  sanitizeKnowledgeItems,
  saveWorkspaceByUid,
  subscribeFacebookPageWebhook,
  syncOwnerFallbackWorkspace,
  toSafeWorkspace,
  unregisterChannelRoute,
  verifyCallerAuth,
} from '../../_lib/metaStore.js';

const OWNER_ADMIN_EMAIL = 'khansaheb2572@gmail.com';

async function subscribeWabaWebhook(wabaId: string, accessToken: string): Promise<boolean> {
  const version = getGraphApiVersion();
  try {
    const res = await fetch(
      `https://graph.facebook.com/${version}/${encodeURIComponent(wabaId)}/subscribed_apps`,
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
    const hasKnowledgeText = typeof body.knowledgeText === 'string';
    const hasKnowledgeItems = Array.isArray(body.knowledgeItems);
    const hasAutoLearn = typeof body.autoLearnKnowledge === 'boolean';

    if (!businessName) {
      return { status: 400, data: { success: false, error: 'Please enter your business name.' } };
    }

    const updated = await saveWorkspaceByUid(uid, (curr) => ({
      ...curr,
      activatedInVault: true,
      businessName,
      botName,
      workPoints,
      knowledgeText: hasKnowledgeText ? body.knowledgeText.slice(0, 8000) : curr.knowledgeText,
      knowledgeItems: hasKnowledgeItems
        ? sanitizeKnowledgeItems(body.knowledgeItems)
        : curr.knowledgeItems,
      autoLearnKnowledge: hasAutoLearn ? Boolean(body.autoLearnKnowledge) : curr.autoLearnKnowledge,
      autoReplyEnabled:
        typeof body.autoReplyEnabled === 'boolean' ? body.autoReplyEnabled : curr.autoReplyEnabled,
    }));

    const isOwner =
      Boolean(caller.emailVerified) &&
      String(caller.email || '').trim().toLowerCase() === OWNER_ADMIN_EMAIL;
    if (isOwner) {
      await syncOwnerFallbackWorkspace({
        businessName: updated.businessName,
        botName: updated.botName,
        workPoints: updated.workPoints,
        knowledgeText: updated.knowledgeText,
        knowledgeItems: updated.knowledgeItems,
        autoLearnKnowledge: updated.autoLearnKnowledge,
      });
    }

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
    const session = await getOAuthSession(sessionId);
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

    // Strict uniqueness check: block if this page is already connected to another Mirror Bot account
    const existingOwner = await getChannelRouteOwner('page', page.id);
    if (existingOwner && existingOwner !== uid) {
      return {
        status: 409,
        data: {
          success: false,
          code: 'PAGE_ALREADY_CONNECTED',
          error:
            'এই ফেসবুক পেজটি ইতিমধ্যেই অন্য একটি Mirror Bot অ্যাকাউন্টে কানেক্ট করা আছে। এটি দিয়ে সম্ভব নয় — অনুগ্রহ করে অন্য একটি পেজ চেষ্টা করুন। (This Facebook Page is already connected to another Mirror Bot account. Please try another page.)',
        },
      };
    }

    // Strict 1-Page-per-account enforcement
    const currentWs = await getWorkspaceByUid(uid);
    if (
      currentWs.facebookPage.connected &&
      currentWs.facebookPage.pageId &&
      currentWs.facebookPage.pageId !== page.id
    ) {
      return {
        status: 409,
        data: {
          success: false,
          code: 'ONE_PAGE_LIMIT',
          error:
            'একটি অ্যাকাউন্ট থেকে শুধুমাত্র ১টি ফেসবুক পেজ কানেক্ট করে চালানো যাবে। নতুন পেজ কানেক্ট করতে আগে বর্তমান পেজটি ডিসকানেক্ট করুন। (Only 1 Facebook Page can be connected per account. Disconnect your current page first.)',
        },
      };
    }

    const subResult = await subscribeFacebookPageWebhook(page.id, page.accessToken);
    const subscribed = subResult.subscribed;
    await recordDiagnosticEvent(
      {
        stage: subscribed ? 'WEBHOOK_VALIDATED' : 'MESSAGE_PROCESSING_FAILED',
        channel: 'system',
        pageId: page.id,
        success: subscribed,
        detail: subscribed
          ? `Page subscribed via connect_page (${subResult.fields.join(', ')})`
          : `connect_page subscribe failed: ${subResult.errorMessage || 'unknown'}`,
        errorCode: subResult.errorCode,
        errorSubcode: subResult.errorSubcode,
        fbtraceId: subResult.fbtraceId,
      },
      true
    );
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
      data: {
        success: true,
        webhookSubscribed: subscribed,
        subscribedFields: subResult.fields,
        subscriptionError: subscribed ? undefined : subResult.errorMessage,
        workspace: toSafeWorkspace(updated),
      },
    };
  }

  if (action === 'connect_whatsapp') {
    const sessionId = String(body.sessionId || '').trim();
    const phoneNumberId = String(body.phoneNumberId || '').trim();
    const session = await getOAuthSession(sessionId);
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

    // Strict uniqueness check: block if this WhatsApp number is already connected to another Mirror Bot account
    const existingWaOwner = await getChannelRouteOwner('wa', wa.phoneNumberId);
    if (existingWaOwner && existingWaOwner !== uid) {
      return {
        status: 409,
        data: {
          success: false,
          code: 'WA_ALREADY_CONNECTED',
          error:
            'এই হোয়াটসঅ্যাপ নম্বরটি ইতিমধ্যেই অন্য একটি Mirror Bot অ্যাকাউন্টে কানেক্ট করা আছে। এটি দিয়ে সম্ভব নয় — অন্য একটি নম্বর চেষ্টা করুন। (This WhatsApp number is already connected to another Mirror Bot account. Please try another number.)',
        },
      };
    }

    // Strict 1-WhatsApp-number-per-account enforcement
    const currentWs = await getWorkspaceByUid(uid);
    if (
      currentWs.whatsapp.connected &&
      currentWs.whatsapp.phoneNumberId &&
      currentWs.whatsapp.phoneNumberId !== wa.phoneNumberId
    ) {
      return {
        status: 409,
        data: {
          success: false,
          code: 'ONE_WA_LIMIT',
          error:
            'একটি অ্যাকাউন্ট থেকে শুধুমাত্র ১টি হোয়াটসঅ্যাপ নম্বর কানেক্ট করা যাবে। নতুন নম্বর যোগ করতে আগে বর্তমান নম্বরটি ডিসকানেক্ট করুন। (Only 1 WhatsApp number can be connected per account. Disconnect your current number first.)',
        },
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

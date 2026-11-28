import { getGeminiApiKey, MIRRORBOT_GEMINI_MODEL } from '../../_lib/gemini.js';
import { isFirebaseAdminConfigured } from '../../_lib/firebaseAdmin.js';
import {
  getDiagnosticEvents,
  getGraphApiVersion,
  getMetaFallbackPageId,
  getMetaVerifyToken,
  getOwnerFallbackWorkspace,
  getReplyLogsForTenant,
  getWorkspaceByUid,
  recordDiagnosticEvent,
  subscribeFacebookPageWebhook,
  verifyCallerAuth,
} from '../../_lib/metaStore.js';
import { processMirrorBotChat } from './chat.js';

const OWNER_ADMIN_EMAIL = 'khansaheb2572@gmail.com';

async function verifyOwnerAdmin(authorizationHeader?: string) {
  const caller = await verifyCallerAuth(authorizationHeader);
  if (!caller) {
    return {
      ok: false as const,
      status: 401,
      error: 'Authentication required.',
    };
  }
  const email = String(caller.email || '').trim().toLowerCase();
  if (!caller.emailVerified || email !== OWNER_ADMIN_EMAIL) {
    return {
      ok: false as const,
      status: 403,
      error: 'Admin diagnostics access is restricted to verified MirrorBook studio administrators.',
    };
  }
  return { ok: true as const, caller };
}

async function resolveOwnerPageCredentials(adminUid: string): Promise<{
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  source: 'workspace_oauth' | 'env_fallback' | 'none';
}> {
  const ws = await getWorkspaceByUid(adminUid);
  if (ws.facebookPage.connected && ws.facebookPage.pageId && ws.facebookPage.pageAccessToken) {
    return {
      pageId: ws.facebookPage.pageId,
      pageName: ws.facebookPage.pageName || 'Connected Page',
      pageAccessToken: ws.facebookPage.pageAccessToken,
      source: 'workspace_oauth',
    };
  }

  const envToken = (process.env.META_PAGE_ACCESS_TOKEN || '').trim();
  const envPageId = getMetaFallbackPageId() || ws.facebookPage.pageId || '';
  if (envToken) {
    return {
      pageId: envPageId,
      pageName: ws.facebookPage.pageName || 'Fallback Page',
      pageAccessToken: envToken,
      source: 'env_fallback',
    };
  }

  return {
    pageId: envPageId,
    pageName: ws.facebookPage.pageName || '',
    pageAccessToken: '',
    source: 'none',
  };
}

async function fetchJsonWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const json: any = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, json };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      json: { error: { message: err?.name === 'AbortError' ? 'Request timed out' : err?.message || 'Network error' } },
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function processMetaDiagnosticsGet(
  authorizationHeader?: string,
  options?: { checkGemini?: boolean }
): Promise<{ status: number; data: Record<string, any> }> {
  const auth = await verifyOwnerAdmin(authorizationHeader);
  if (!auth.ok) {
    return { status: auth.status, data: { success: false, error: auth.error } };
  }

  const version = getGraphApiVersion();
  const appId = (process.env.META_APP_ID || '').trim();
  const appSecret = (process.env.META_APP_SECRET || '').trim();
  const verifyToken = getMetaVerifyToken();
  const geminiKey = getGeminiApiKey();
  const geminiConfigured = Boolean(geminiKey && geminiKey !== 'MY_GEMINI_API_KEY');
  const fallbackPageTokenSet = Boolean((process.env.META_PAGE_ACCESS_TOKEN || '').trim());
  const fallbackPageId = getMetaFallbackPageId();

  const envStatus = {
    GEMINI_API_KEY: geminiConfigured,
    META_APP_ID: Boolean(appId),
    META_APP_SECRET: Boolean(appSecret),
    META_WEBHOOK_VERIFY_TOKEN: Boolean(verifyToken),
    META_PAGE_ACCESS_TOKEN: fallbackPageTokenSet,
    META_PAGE_ID_OR_FALLBACK: Boolean(fallbackPageId),
    GRAPH_API_VERSION: version,
    FIREBASE_SERVICE_ACCOUNT_KEY: isFirebaseAdminConfigured(),
  };

  const creds = await resolveOwnerPageCredentials(auth.caller.uid);

  const pageTokenCheck: Record<string, any> = {
    status: 'SKIPPED',
    source: creds.source,
    pageId: creds.pageId || null,
    pageName: creds.pageName || null,
    tokenValid: false,
    tokenType: null,
    expiresAt: null,
    scopes: [],
    hasPagesMessaging: false,
    hasPagesManageMetadata: false,
    pageTasks: [],
    error: null,
  };

  const subscriptionCheck: Record<string, any> = {
    status: 'SKIPPED',
    pageId: creds.pageId || null,
    appSubscribed: false,
    messagesSubscribed: false,
    postbacksSubscribed: false,
    feedSubscribed: false,
    subscribedApps: [],
    error: null,
  };

  let resolvedPageId = creds.pageId;

  if (creds.pageAccessToken) {
    // 1. Validate Page identity via /me using Page Access Token
    const meRes = await fetchJsonWithTimeout(
      `https://graph.facebook.com/${version}/me?fields=id,name,category,tasks`,
      { headers: { Authorization: `Bearer ${creds.pageAccessToken}` } }
    );
    if (meRes.ok && meRes.json?.id) {
      resolvedPageId = String(meRes.json.id);
      pageTokenCheck.pageId = resolvedPageId;
      pageTokenCheck.pageName = String(meRes.json.name || creds.pageName || '');
      pageTokenCheck.pageTasks = Array.isArray(meRes.json.tasks) ? meRes.json.tasks : [];
      pageTokenCheck.tokenValid = true;
      pageTokenCheck.status = 'PASS';
    } else {
      pageTokenCheck.status = 'FAIL';
      pageTokenCheck.error = {
        httpStatus: meRes.status,
        code: meRes.json?.error?.code,
        subcode: meRes.json?.error?.error_subcode,
        message: meRes.json?.error?.message || 'Page Access Token validation failed.',
        fbtraceId: meRes.json?.error?.fbtrace_id,
      };
    }

    // 2. Inspect token scopes & type via /debug_token (using App Token on server; never returns token)
    if (appId && appSecret) {
      const appToken = `${appId}|${appSecret}`;
      const debugUrl = new URL(`https://graph.facebook.com/${version}/debug_token`);
      debugUrl.searchParams.set('input_token', creds.pageAccessToken);
      const dbgRes = await fetchJsonWithTimeout(debugUrl.toString(), {
        headers: { Authorization: `Bearer ${appToken}` },
      });
      const dbgData = dbgRes.json?.data;
      if (dbgRes.ok && dbgData) {
        const scopes: string[] = Array.isArray(dbgData.scopes) ? dbgData.scopes : [];
        pageTokenCheck.tokenValid = Boolean(dbgData.is_valid);
        pageTokenCheck.tokenType = dbgData.type || null;
        pageTokenCheck.expiresAt =
          typeof dbgData.expires_at === 'number'
            ? dbgData.expires_at === 0
              ? 'never'
              : new Date(dbgData.expires_at * 1000).toISOString()
            : null;
        pageTokenCheck.scopes = scopes;
        pageTokenCheck.hasPagesMessaging = scopes.includes('pages_messaging');
        pageTokenCheck.hasPagesManageMetadata = scopes.includes('pages_manage_metadata');
        pageTokenCheck.profileIdMatchesPage =
          !resolvedPageId || !dbgData.profile_id || String(dbgData.profile_id) === resolvedPageId;
        if (!dbgData.is_valid || dbgData.type !== 'PAGE' || !scopes.includes('pages_messaging')) {
          pageTokenCheck.status = 'FAIL';
        }
      }
    }

    // 3. Verify Page webhook subscription (/{pageId}/subscribed_apps)
    if (resolvedPageId) {
      subscriptionCheck.pageId = resolvedPageId;
      const subRes = await fetchJsonWithTimeout(
        `https://graph.facebook.com/${version}/${encodeURIComponent(resolvedPageId)}/subscribed_apps`,
        { headers: { Authorization: `Bearer ${creds.pageAccessToken}` } }
      );
      if (subRes.ok && Array.isArray(subRes.json?.data)) {
        const apps = subRes.json.data.map((app: any) => ({
          id: String(app?.id || ''),
          name: String(app?.name || ''),
          subscribedFields: Array.isArray(app?.subscribed_fields) ? app.subscribed_fields : [],
        }));
        subscriptionCheck.subscribedApps = apps;
        const matchedApp = appId
          ? apps.find((a: any) => a.id === appId) || apps[0]
          : apps[0];
        if (matchedApp) {
          subscriptionCheck.appSubscribed = true;
          subscriptionCheck.messagesSubscribed = matchedApp.subscribedFields.includes('messages');
          subscriptionCheck.postbacksSubscribed =
            matchedApp.subscribedFields.includes('messaging_postbacks');
          subscriptionCheck.feedSubscribed = matchedApp.subscribedFields.includes('feed');
          subscriptionCheck.status = subscriptionCheck.messagesSubscribed ? 'PASS' : 'FAIL';
        } else {
          subscriptionCheck.status = 'FAIL';
          subscriptionCheck.error = {
            message: 'No app is currently subscribed to this Facebook Page.',
          };
        }
      } else {
        subscriptionCheck.status = 'FAIL';
        subscriptionCheck.error = {
          httpStatus: subRes.status,
          code: subRes.json?.error?.code,
          subcode: subRes.json?.error?.error_subcode,
          message: subRes.json?.error?.message || 'Could not inspect Page subscribed_apps.',
          fbtraceId: subRes.json?.error?.fbtrace_id,
        };
      }
    }
  } else {
    pageTokenCheck.status = 'FAIL';
    pageTokenCheck.error = {
      message:
        'No Page Access Token available on server. Connect Page via /mirrorbot (with FIREBASE_SERVICE_ACCOUNT_KEY) or set META_PAGE_ACCESS_TOKEN in Vercel.',
    };
  }

  let geminiCheck: Record<string, any> = {
    status: geminiConfigured ? 'CONFIGURED' : 'FAIL',
    model: MIRRORBOT_GEMINI_MODEL,
    liveChecked: false,
    latencyMs: null,
    error: geminiConfigured ? null : 'GEMINI_API_KEY is not configured.',
  };

  if (options?.checkGemini && geminiConfigured) {
    const start = Date.now();
    const ownerWs = (await getWorkspaceByUid(auth.caller.uid)) || (await getOwnerFallbackWorkspace());
    const testRes = await processMirrorBotChat(
      {
        business: {
          businessName: ownerWs?.businessName || 'MirrorBook',
          businessCategory: 'Creative Studio',
          whatYouWorkWith:
            ownerWs?.workPoints?.join(', ') || 'Graphic design, video editing, web development, MirrorPOS, Mirror Bot',
          openingHours: '10:00 AM - 10:00 PM',
          deliveryInfo: 'Online delivery',
          codAvailable: false,
          botName: ownerWs?.botName || 'Mirror Bot',
          knowledgeText: ownerWs?.knowledgeText || '',
          knowledgeItems: ownerWs?.knowledgeItems || [],
        },
        message: 'Hello, what services does MirrorBook offer?',
        fastWebhookMode: true,
      },
      'admin-diag-ping'
    );
    geminiCheck = {
      status: testRes.status === 200 ? 'PASS' : 'FAIL',
      model: testRes.data.modelUsed || MIRRORBOT_GEMINI_MODEL,
      liveChecked: true,
      latencyMs: Date.now() - start,
      sampleReplyPreview: testRes.data.replies?.[0]?.slice(0, 140) || null,
      error: testRes.status === 200 ? null : testRes.data.error || 'Gemini ping failed',
    };
  }

  const [diagnosticEvents, replyStats] = await Promise.all([
    getDiagnosticEvents(50),
    getReplyLogsForTenant(auth.caller.uid, true),
  ]);

  return {
    status: 200,
    data: {
      success: true,
      checkedAt: new Date().toISOString(),
      envStatus,
      pageTokenCheck,
      subscriptionCheck,
      geminiCheck,
      externalUserRequirementNote:
        'For external Facebook accounts (non-Admin/Developer/Tester) to receive automatic Messenger replies, the Meta App must be in Live Mode with approved pages_messaging Advanced Access.',
      replySummary: replyStats.summary,
      diagnosticEvents,
    },
  };
}

export async function processMetaDiagnosticsPost(
  body: Record<string, any>,
  authorizationHeader?: string
): Promise<{ status: number; data: Record<string, any> }> {
  const auth = await verifyOwnerAdmin(authorizationHeader);
  if (!auth.ok) {
    return { status: auth.status, data: { success: false, error: auth.error } };
  }

  const action = String(body?.action || '').trim();

  if (action === 'resubscribe_page') {
    const creds = await resolveOwnerPageCredentials(auth.caller.uid);
    if (!creds.pageAccessToken) {
      return {
        status: 400,
        data: {
          success: false,
          error: 'No Page Access Token available on server to re-subscribe the Facebook Page.',
        },
      };
    }

    let targetPageId = creds.pageId;
    if (!targetPageId) {
      const meRes = await fetchJsonWithTimeout(
        `https://graph.facebook.com/${getGraphApiVersion()}/me?fields=id`,
        { headers: { Authorization: `Bearer ${creds.pageAccessToken}` } }
      );
      if (meRes.ok && meRes.json?.id) {
        targetPageId = String(meRes.json.id);
      }
    }

    if (!targetPageId) {
      return {
        status: 400,
        data: { success: false, error: 'Could not determine Facebook Page ID.' },
      };
    }

    const result = await subscribeFacebookPageWebhook(targetPageId, creds.pageAccessToken);
    await recordDiagnosticEvent(
      {
        stage: result.subscribed ? 'WEBHOOK_VALIDATED' : 'MESSAGE_PROCESSING_FAILED',
        channel: 'system',
        pageId: targetPageId,
        success: result.subscribed,
        detail: result.subscribed
          ? `Admin re-subscribed Page webhook fields: ${result.fields.join(', ')}`
          : `Admin Page re-subscribe failed: ${result.errorMessage || 'unknown'}`,
        errorCode: result.errorCode,
        errorSubcode: result.errorSubcode,
        fbtraceId: result.fbtraceId,
      },
      true
    );

    return {
      status: result.subscribed ? 200 : 502,
      data: {
        success: result.subscribed,
        pageId: targetPageId,
        ...result,
      },
    };
  }

  if (action === 'test_pipeline') {
    const message =
      String(body?.message || '').trim().slice(0, 500) ||
      'হ্যালো, MirrorBook-এর সার্ভিস ও প্রাইসিং সম্পর্কে জানতে চাই।';
    const start = Date.now();
    const ws = (await getWorkspaceByUid(auth.caller.uid)) || (await getOwnerFallbackWorkspace());

    const result = await processMirrorBotChat(
      {
        business: {
          businessName: ws?.businessName || 'MirrorBook',
          businessCategory: ws?.facebookPage?.pageCategory || 'Creative Studio & Digital Solutions',
          whatYouWorkWith:
            ws?.workPoints?.join(', ') ||
            'Graphic design, video editing, web development, MirrorPOS, Mirror Bot',
          openingHours: '10:00 AM – 10:00 PM',
          deliveryInfo: 'Online delivery',
          codAvailable: false,
          botName: ws?.botName || 'Mirror Bot',
          knowledgeText: ws?.knowledgeText || '',
          knowledgeItems: ws?.knowledgeItems || [],
        },
        message,
        fastWebhookMode: true,
      },
      'admin-pipeline-test'
    );

    await recordDiagnosticEvent(
      {
        stage: result.status === 200 ? 'GEMINI_RESPONSE_RECEIVED' : 'MESSAGE_PROCESSING_FAILED',
        channel: 'system',
        success: result.status === 200,
        durationMs: Date.now() - start,
        detail:
          result.status === 200
            ? `Admin pipeline test passed via ${result.data.modelUsed || MIRRORBOT_GEMINI_MODEL}`
            : `Admin pipeline test failed: ${result.data.error || 'unknown'}`,
      },
      true
    );

    return {
      status: result.status,
      data: {
        success: result.status === 200,
        latencyMs: Date.now() - start,
        ...result.data,
      },
    };
  }

  return { status: 400, data: { success: false, error: 'Unsupported diagnostic action.' } };
}

export default async function handler(req: any, res: any) {
  const authHeader =
    typeof req.headers?.authorization === 'string' ? req.headers.authorization : undefined;

  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const urlObj = new URL(req.url || '/', 'https://mirrorbook.site');
    const checkGemini =
      urlObj.searchParams.get('checkGemini') === '1' || req.query?.checkGemini === '1';
    const result = await processMetaDiagnosticsGet(authHeader, { checkGemini });
    res.status(result.status).json(result.data);
    return;
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        res.status(400).json({ success: false, error: 'Invalid JSON request body.' });
        return;
      }
    }
    const result = await processMetaDiagnosticsPost(body || {}, authHeader);
    res.status(result.status).json(result.data);
    return;
  }

  res.status(405).json({ success: false, error: 'Method not allowed.' });
}

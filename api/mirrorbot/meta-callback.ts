import {
  consumeOAuthState,
  createOAuthSession,
  saveWorkspaceByUid,
  toSafeWorkspace,
  type DiscoveredFacebookPage,
  type DiscoveredWhatsAppNumber,
} from '../_lib/metaStore.js';

function escapeHtml(input: string): string {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPopupHtml(payload: Record<string, any>, messageText: string): string {
  const safeJson = JSON.stringify(payload).replace(/</g, '\\u003c');
  const safeText = escapeHtml(messageText);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mirror Bot · Account Connection</title>
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0B0D0C; color: #F5F7F2; font-family: system-ui, -apple-system, sans-serif; padding: 24px; text-align: center; }
    .card { max-width: 420px; background: #121614; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; }
    h1 { font-size: 18px; margin: 0 0 8px; color: #B7F34A; }
    p { font-size: 13px; color: #A1AAA2; margin: 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Mirror Bot</h1>
    <p>${safeText}</p>
  </div>
  <script>
    (function () {
      var data = ${safeJson};
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(data, '*');
          setTimeout(function () { window.close(); }, 350);
          return;
        }
      } catch (e) {}
      setTimeout(function () {
        window.location.href = '/mirrorbot';
      }, 1200);
    })();
  </script>
</body>
</html>`;
}

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
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function processMetaCallback(query: URLSearchParams): Promise<{
  status: number;
  html: string;
}> {
  const oauthError = query.get('error_description') || query.get('error');
  if (oauthError) {
    return {
      status: 200,
      html: buildPopupHtml(
        { type: 'MIRRORBOT_META_OAUTH_ERROR', error: oauthError },
        `Login was cancelled or denied: ${oauthError}`
      ),
    };
  }

  const code = (query.get('code') || '').trim();
  const state = (query.get('state') || '').trim();

  if (!code || !state) {
    const appIdSet = Boolean((process.env.META_APP_ID || '').trim());
    const appSecretSet = Boolean((process.env.META_APP_SECRET || '').trim());
    const statusMsg =
      appIdSet && appSecretSet
        ? 'Mirror Bot Meta OAuth Callback endpoint is live and ready. Paste this URL into Meta App Dashboard → Facebook Login for Business → Valid OAuth Redirect URIs.'
        : 'Mirror Bot Meta OAuth Callback endpoint is live. Next step: add META_APP_ID and META_APP_SECRET in your server Environment Variables / Secrets, and paste this URL into Meta App Dashboard → Valid OAuth Redirect URIs.';
    return {
      status: 200,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mirror Bot · OAuth Callback Active</title>
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0B0D0C; color: #F5F7F2; font-family: system-ui, -apple-system, sans-serif; padding: 24px; text-align: center; }
    .card { max-width: 480px; background: #121614; border: 1px solid rgba(183,243,74,0.28); border-radius: 18px; padding: 28px; }
    img { width: 52px; height: 52px; border-radius: 14px; margin-bottom: 12px; }
    h1 { font-size: 18px; margin: 0 0 10px; color: #B7F34A; }
    p { font-size: 13px; color: #C5CEC6; margin: 0 0 18px; line-height: 1.6; }
    a { display: inline-block; background: #B7F34A; color: #0B0D0C; font-weight: 700; font-size: 12px; padding: 10px 18px; border-radius: 10px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <img src="/mirrorbot-icon.png" alt="Mirror Bot" />
    <h1>OAuth Callback Endpoint Active</h1>
    <p>${escapeHtml(statusMsg)}</p>
    <a href="/mirrorbot">Open Mirror Bot</a>
  </div>
</body>
</html>`,
    };
  }

  const stateEntry = consumeOAuthState(state);
  if (!stateEntry || !stateEntry.uid) {
    return {
      status: 400,
      html: buildPopupHtml(
        { type: 'MIRRORBOT_META_OAUTH_ERROR', error: 'Login session expired. Please try again.' },
        'Your login session expired. Please click Connect again.'
      ),
    };
  }

  const appId = (process.env.META_APP_ID || '').trim();
  const appSecret = (process.env.META_APP_SECRET || '').trim();
  if (!appId || !appSecret) {
    return {
      status: 503,
      html: buildPopupHtml(
        { type: 'MIRRORBOT_META_OAUTH_ERROR', error: 'Meta App credentials are not configured.' },
        'Meta connection is not configured on the server yet.'
      ),
    };
  }

  try {
    // 1. Exchange authorization code via POST body (client_secret never in URL)
    const tokenParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: stateEntry.redirectUri,
      code,
    });
    const tokenRes = await fetch('https://graph.facebook.com/v21.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });
    const tokenData: any = await tokenRes.json().catch(() => null);
    if (!tokenRes.ok || !tokenData?.access_token) {
      const msg = tokenData?.error?.message || 'Could not exchange Facebook login code.';
      return {
        status: 200,
        html: buildPopupHtml({ type: 'MIRRORBOT_META_OAUTH_ERROR', error: msg }, msg),
      };
    }

    let userAccessToken: string = String(tokenData.access_token);

    // 2. Upgrade to long-lived user token (best effort)
    try {
      const longParams = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: userAccessToken,
      });
      const longRes = await fetch('https://graph.facebook.com/v21.0/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: longParams.toString(),
      });
      const longData: any = await longRes.json().catch(() => null);
      if (longRes.ok && longData?.access_token) {
        userAccessToken = String(longData.access_token);
      }
    } catch {
      // Keep short-lived token if upgrade fails
    }

    const pages: DiscoveredFacebookPage[] = [];
    const whatsappNumbers: DiscoveredWhatsAppNumber[] = [];

    // 3. Fetch managed Facebook Pages
    try {
      const pagesRes = await fetch(
        'https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,access_token&limit=25',
        { headers: { Authorization: `Bearer ${userAccessToken}` } }
      );
      const pagesJson: any = await pagesRes.json().catch(() => null);
      if (pagesRes.ok && Array.isArray(pagesJson?.data)) {
        for (const p of pagesJson.data) {
          if (p?.id && p?.access_token) {
            pages.push({
              id: String(p.id),
              name: String(p.name || 'Facebook Page'),
              category: String(p.category || ''),
              accessToken: String(p.access_token),
            });
          }
        }
      }
    } catch {
      // Ignore if WhatsApp-only scopes were granted
    }

    // 4. Fetch WhatsApp Business Accounts & phone numbers
    try {
      const bizRes = await fetch(
        'https://graph.facebook.com/v21.0/me/businesses?fields=id,name,owned_whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number,verified_name}}&limit=20',
        { headers: { Authorization: `Bearer ${userAccessToken}` } }
      );
      const bizJson: any = await bizRes.json().catch(() => null);
      if (bizRes.ok && Array.isArray(bizJson?.data)) {
        for (const biz of bizJson.data) {
          const wabas = Array.isArray(biz?.owned_whatsapp_business_accounts?.data)
            ? biz.owned_whatsapp_business_accounts.data
            : [];
          for (const waba of wabas) {
            const phones = Array.isArray(waba?.phone_numbers?.data)
              ? waba.phone_numbers.data
              : [];
            for (const phone of phones) {
              if (phone?.id) {
                whatsappNumbers.push({
                  wabaId: String(waba.id || ''),
                  wabaName: String(waba.name || biz.name || 'WhatsApp Business'),
                  phoneNumberId: String(phone.id),
                  displayPhone: String(phone.display_phone_number || phone.id),
                  verifiedName: String(phone.verified_name || waba.name || 'WhatsApp Business'),
                  accessToken: userAccessToken,
                });
              }
            }
          }
        }
      }
    } catch {
      // Ignore if Page-only scopes were granted
    }

    // Store tokens strictly server-side bound to this customer UID
    const session = createOAuthSession({
      uid: stateEntry.uid,
      channel: stateEntry.channel,
      pages,
      whatsappNumbers,
    });

    let autoConnected = false;
    let safeWorkspace = null;

    if (
      (stateEntry.channel === 'facebook' || stateEntry.channel === 'messenger') &&
      pages.length === 1
    ) {
      const page = pages[0];
      const subscribed = await subscribePageWebhook(page.id, page.accessToken);
      const nowIso = new Date().toISOString();
      const updated = await saveWorkspaceByUid(stateEntry.uid, (curr) => ({
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
      safeWorkspace = toSafeWorkspace(updated);
      autoConnected = true;
    } else if (stateEntry.channel === 'whatsapp' && whatsappNumbers.length === 1) {
      const wa = whatsappNumbers[0];
      if (wa.wabaId) {
        await subscribeWabaWebhook(wa.wabaId, wa.accessToken);
      }
      const nowIso = new Date().toISOString();
      const updated = await saveWorkspaceByUid(stateEntry.uid, (curr) => ({
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
      safeWorkspace = toSafeWorkspace(updated);
      autoConnected = true;
    }

    // Send ONLY safe public metadata (zero access tokens!) to opener
    return {
      status: 200,
      html: buildPopupHtml(
        {
          type: 'MIRRORBOT_META_OAUTH_SUCCESS',
          channel: stateEntry.channel,
          sessionId: session.id,
          autoConnected,
          workspace: safeWorkspace,
          pages: pages.map((p) => ({ id: p.id, name: p.name, category: p.category })),
          whatsappNumbers: whatsappNumbers.map((w) => ({
            wabaId: w.wabaId,
            wabaName: w.wabaName,
            phoneNumberId: w.phoneNumberId,
            displayPhone: w.displayPhone,
            verifiedName: w.verifiedName,
          })),
        },
        autoConnected
          ? 'Connected! Live AI auto-reply is now active. Closing window...'
          : 'Login successful! Choose your account in Mirror Bot. Closing window...'
      ),
    };
  } catch (err: any) {
    const msg = err?.message || 'Unexpected error during Meta OAuth callback.';
    return {
      status: 200,
      html: buildPopupHtml({ type: 'MIRRORBOT_META_OAUTH_ERROR', error: msg }, msg),
    };
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }

  const urlObj = new URL(req.url || '/', 'https://mirrorbook.site');
  const result = await processMetaCallback(urlObj.searchParams);
  res.status(result.status);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.send(result.html);
}

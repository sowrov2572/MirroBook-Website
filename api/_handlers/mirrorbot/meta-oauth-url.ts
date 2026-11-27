import {
  createOAuthState,
  resolveMetaCallbackUrl,
  verifyCallerAuth,
  type MetaChannelType,
} from '../../_lib/metaStore.js';

const CHANNEL_SCOPES: Record<MetaChannelType, string> = {
  facebook: [
    'pages_show_list',
    'pages_messaging',
    'pages_manage_metadata',
    'pages_read_engagement',
    'pages_manage_engagement',
    'business_management',
  ].join(','),
  messenger: [
    'pages_show_list',
    'pages_messaging',
    'pages_manage_metadata',
    'pages_read_engagement',
    'business_management',
  ].join(','),
  whatsapp: [
    'whatsapp_business_management',
    'whatsapp_business_messaging',
    'business_management',
  ].join(','),
};

export interface MetaOAuthUrlResult {
  status: number;
  data: {
    success: boolean;
    configured: boolean;
    channel: MetaChannelType;
    url?: string;
    error?: string;
  };
}

function normalizeChannel(raw?: string | null): MetaChannelType {
  const val = String(raw || '').trim().toLowerCase();
  if (val === 'messenger') return 'messenger';
  if (val === 'whatsapp') return 'whatsapp';
  return 'facebook';
}

export async function processMetaOAuthUrl(params: {
  channel?: string | null;
  requestOrigin?: string;
  authorizationHeader?: string;
}): Promise<MetaOAuthUrlResult> {
  const channel = normalizeChannel(params.channel);

  const caller = await verifyCallerAuth(params.authorizationHeader);
  if (!caller) {
    return {
      status: 401,
      data: {
        success: false,
        configured: false,
        channel,
        error: 'Please sign in to your MirrorBook account first to connect this channel.',
      },
    };
  }

  const callbackUrl = resolveMetaCallbackUrl(params.requestOrigin);
  const appId = (process.env.META_APP_ID || '').trim();
  const appSecret = (process.env.META_APP_SECRET || '').trim();

  if (!appId || !appSecret) {
    return {
      status: 200,
      data: {
        success: false,
        configured: false,
        channel,
        error:
          'Facebook & WhatsApp login is currently being finalized by MirrorBook. Please try again shortly or contact support.',
      },
    };
  }

  const state = createOAuthState(caller.uid, channel, callbackUrl);
  const oauthParams = new URLSearchParams({
    client_id: appId,
    redirect_uri: callbackUrl,
    state,
    response_type: 'code',
    scope: CHANNEL_SCOPES[channel],
    auth_type: 'rerequest',
  });

  const url = `https://www.facebook.com/v21.0/dialog/oauth?${oauthParams.toString()}`;

  return {
    status: 200,
    data: {
      success: true,
      configured: true,
      channel,
      url,
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

  const urlObj = new URL(req.url || '/', origin);
  const channel = urlObj.searchParams.get('channel');
  const authHeader =
    typeof req.headers?.authorization === 'string' ? req.headers.authorization : undefined;

  const result = await processMetaOAuthUrl({
    channel,
    requestOrigin: origin,
    authorizationHeader: authHeader,
  });

  res.setHeader('Cache-Control', 'no-store');
  res.status(result.status).json(result.data);
}

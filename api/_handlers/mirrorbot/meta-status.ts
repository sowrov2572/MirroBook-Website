import { getGeminiApiKey } from '../../_lib/gemini.js';
import {
  getWorkspaceByUid,
  toSafeWorkspace,
  verifyCallerAuth,
  type SafeMirrorBotWorkspace,
} from '../../_lib/metaStore.js';

export interface MetaStatusResult {
  status: number;
  data: {
    success: boolean;
    authenticated: boolean;
    geminiReady: boolean;
    metaOAuthConfigured: boolean;
    workspace: SafeMirrorBotWorkspace | null;
  };
}

export async function processMetaStatus(
  authorizationHeader?: string
): Promise<MetaStatusResult> {
  const geminiKey = getGeminiApiKey();
  const geminiReady = Boolean(geminiKey && geminiKey !== 'MY_GEMINI_API_KEY');
  const metaAppId = (process.env.META_APP_ID || '').trim();
  const metaAppSecret = (process.env.META_APP_SECRET || '').trim();
  const metaOAuthConfigured = Boolean(metaAppId && metaAppSecret);

  const caller = await verifyCallerAuth(authorizationHeader);
  if (!caller) {
    return {
      status: 200,
      data: {
        success: true,
        authenticated: false,
        geminiReady,
        metaOAuthConfigured,
        workspace: null,
      },
    };
  }

  const workspace = await getWorkspaceByUid(caller.uid);

  return {
    status: 200,
    data: {
      success: true,
      authenticated: true,
      geminiReady,
      metaOAuthConfigured,
      workspace: toSafeWorkspace(workspace),
    },
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed. Use GET.' });
    return;
  }

  const authHeader =
    typeof req.headers?.authorization === 'string' ? req.headers.authorization : undefined;

  const result = await processMetaStatus(authHeader);
  res.setHeader('Cache-Control', 'no-store');
  res.status(result.status).json(result.data);
}

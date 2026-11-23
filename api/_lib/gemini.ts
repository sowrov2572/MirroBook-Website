import { GoogleGenAI, type GenerateContentParameters, type GenerateContentResponse } from '@google/genai';

export const MIRRORBOT_GEMINI_MODEL = 'gemini-4-hydrogen';
export const MIRRORBOT_FALLBACK_MODEL = 'gemini-3.1-flash-lite';

let cachedClient: GoogleGenAI | null = null;
let cachedApiKey = '';

export function getGeminiApiKey(): string {
  return (process.env.GEMINI_API_KEY || '').trim();
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Please configure GEMINI_API_KEY in Settings > Secrets or Vercel Environment Variables.'
    );
  }

  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedApiKey = apiKey;
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return cachedClient;
}

function isTransientOverloadError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err || '')).toLowerCase();
  const status = (err as any)?.status ?? (err as any)?.code;
  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('temporarily') ||
    msg.includes('resource_exhausted') ||
    msg.includes('429')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls Gemini with exponential backoff retries on transient 503/high-demand spikes
 * and automatic failover to gemini-3.1-flash-lite so live customer replies stay reliable.
 */
export async function generateMirrorBotContent(
  params: Omit<GenerateContentParameters, 'model'> & { model?: string }
): Promise<{ response: GenerateContentResponse; modelUsed: string }> {
  const ai = getGeminiClient();
  const primaryModel = params.model || MIRRORBOT_GEMINI_MODEL;
  const candidateModels =
    primaryModel === MIRRORBOT_FALLBACK_MODEL
      ? [MIRRORBOT_FALLBACK_MODEL]
      : [primaryModel, MIRRORBOT_FALLBACK_MODEL];

  let lastError: unknown = null;

  for (let mIdx = 0; mIdx < candidateModels.length; mIdx++) {
    const model = candidateModels[mIdx];
    const maxAttempts = mIdx === 0 ? 2 : 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model,
        });
        return { response, modelUsed: model };
      } catch (err) {
        lastError = err;
        if (!isTransientOverloadError(err)) {
          throw err;
        }
        // Wait briefly before retry or model fallback
        const delayMs = attempt === 1 ? 650 : 1200;
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}

const rateBucket = new Map<string, { count: number; resetAt: number }>();

export function checkMirrorBotRateLimit(clientIp: string, limitPerMinute = 35): boolean {
  const key = clientIp || 'unknown';
  const now = Date.now();
  const entry = rateBucket.get(key);

  if (!entry || now > entry.resetAt) {
    rateBucket.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= limitPerMinute) {
    return false;
  }

  entry.count += 1;
  return true;
}

export function extractFriendlyGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err || 'Unknown AI service error');
  const lower = raw.toLowerCase();

  if (lower.includes('gemini_api_key is not configured')) {
    return {
      status: 503,
      message:
        'Gemini API key is not configured on the server. Please check GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (lower.includes('api_key_invalid') || lower.includes('permission_denied') || lower.includes('403')) {
    return {
      status: 502,
      message:
        'Gemini API authentication failed. Please verify GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (
    lower.includes('503') ||
    lower.includes('high demand') ||
    lower.includes('unavailable') ||
    lower.includes('overloaded')
  ) {
    return {
      status: 503,
      message:
        'Gemini servers are experiencing a brief traffic spike right now. Please tap Send again in a few seconds.',
    };
  }
  if (lower.includes('resource_exhausted') || lower.includes('429')) {
    return {
      status: 429,
      message:
        'Gemini API quota limit reached right now. Please wait a moment and try again.',
    };
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return {
      status: 502,
      message: 'Configured Gemini model was not found. Please contact MirrorBook support.',
    };
  }

  return {
    status: 500,
    message: 'Unable to reach Gemini right now. Please try sending your message again.',
  };
}

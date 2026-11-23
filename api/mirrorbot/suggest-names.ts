import { Type } from '@google/genai';
import {
  MIRRORBOT_GEMINI_MODEL,
  checkMirrorBotRateLimit,
  extractFriendlyGeminiError,
  generateMirrorBotContent,
} from '../_lib/gemini.js';

export interface SuggestNamesInput {
  businessName?: string;
  businessCategory?: string;
  whatYouSell?: string;
  language?: 'bn' | 'en';
}

export interface SuggestNamesResult {
  status: number;
  data: {
    success: boolean;
    suggestions?: {
      name: string;
      personaNote: string;
    }[];
    error?: string;
  };
}

function cleanText(val: unknown, maxLen: number): string {
  return typeof val === 'string' ? val.trim().slice(0, maxLen) : '';
}

export async function processSuggestBotNames(
  rawBody: unknown,
  clientIp: string
): Promise<SuggestNamesResult> {
  if (!checkMirrorBotRateLimit(`names:${clientIp}`, 20)) {
    return {
      status: 429,
      data: { success: false, error: 'Too many requests. Please wait a moment.' },
    };
  }

  const body = (rawBody && typeof rawBody === 'object' ? rawBody : {}) as SuggestNamesInput;
  const businessName = cleanText(body.businessName, 120);
  const businessCategory = cleanText(body.businessCategory, 120);
  const whatYouSell = cleanText(body.whatYouSell, 400);
  const language: 'bn' | 'en' = body.language === 'en' ? 'en' : 'bn';

  if (!businessName) {
    return {
      status: 400,
      data: { success: false, error: 'Business name is required to suggest AI bot names.' },
    };
  }

  try {
    const prompt = [
      `Business Name: ${businessName}`,
      businessCategory ? `Category: ${businessCategory}` : '',
      whatYouSell ? `Products/Services: ${whatYouSell}` : '',
      `Preferred Display Language: ${language === 'bn' ? 'Bangla (with friendly human-like Bangladeshi agent names)' : 'English & Bangla friendly names'}`,
      'Suggest 5 short, warm, memorable AI sales/support agent names for this business.',
      'The first suggestion should closely match the business name if natural (for example, if business is "সারা গার্মেন্টস" or "Sara Garments", suggest "সারা" / "Sara").',
      'Keep each personaNote to one concise sentence describing the agent tone.',
    ]
      .filter(Boolean)
      .join('\n');

    const { response } = await generateMirrorBotContent({
      model: MIRRORBOT_GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are an AI brand specialist for Bangladeshi and global e-commerce businesses. Suggest realistic, polite customer-care agent names that sound warm and trustworthy on Facebook Messenger and WhatsApp.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: 'Short, friendly agent first name (e.g. সারা, Sara, রাইসা, আরিয়ান)',
                  },
                  personaNote: {
                    type: Type.STRING,
                    description: 'Short 1-line note on why this agent name fits the business',
                  },
                },
                required: ['name', 'personaNote'],
              },
            },
          },
          required: ['suggestions'],
        },
      },
    });

    const parsed = JSON.parse((response.text || '{}').trim());
    const suggestions = Array.isArray(parsed?.suggestions)
      ? parsed.suggestions
          .filter(
            (s: any) =>
              s && typeof s.name === 'string' && s.name.trim().length > 0
          )
          .slice(0, 5)
          .map((s: any) => ({
            name: String(s.name).trim().slice(0, 40),
            personaNote: String(s.personaNote || '').trim().slice(0, 160),
          }))
      : [];

    if (suggestions.length === 0) {
      return {
        status: 502,
        data: { success: false, error: 'Gemini did not return valid name suggestions. Please try again.' },
      };
    }

    return {
      status: 200,
      data: {
        success: true,
        suggestions,
      },
    };
  } catch (err) {
    const friendly = extractFriendlyGeminiError(err);
    return {
      status: friendly.status,
      data: {
        success: false,
        error: friendly.message,
      },
    };
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
    return;
  }

  const clientIp =
    (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  const result = await processSuggestBotNames(req.body, clientIp);
  res.status(result.status).json(result.data);
}

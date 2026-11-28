import crypto from 'crypto';
import { Type } from '@google/genai';
import {
  MIRRORBOT_GEMINI_MODEL,
  checkMirrorBotRateLimit,
  extractFriendlyGeminiError,
  generateMirrorBotContent,
} from '../../_lib/gemini.js';
import {
  getWorkspaceByUid,
  mergeKnowledgeItems,
  sanitizeKnowledgeItems,
  saveWorkspaceByUid,
  syncOwnerFallbackWorkspace,
  verifyCallerAuth,
  type MirrorBotKnowledgeCategory,
  type MirrorBotKnowledgeItem,
} from '../../_lib/metaStore.js';

const OWNER_ADMIN_EMAIL = 'khansaheb2572@gmail.com';
const VALID_CATEGORIES = new Set<MirrorBotKnowledgeCategory>([
  'product',
  'faq',
  'policy',
  'offer',
  'general',
]);

function isCallerOwnerAdmin(caller: { email?: string; emailVerified?: boolean }): boolean {
  return (
    Boolean(caller.emailVerified) &&
    String(caller.email || '').trim().toLowerCase() === OWNER_ADMIN_EMAIL
  );
}

export async function processMirrorBotKnowledgeGet(authorizationHeader?: string): Promise<{
  status: number;
  data: Record<string, any>;
}> {
  const caller = await verifyCallerAuth(authorizationHeader);
  if (!caller) {
    return {
      status: 401,
      data: { success: false, error: 'Please sign in to access your Mirror Bot knowledge data.' },
    };
  }

  const ws = await getWorkspaceByUid(caller.uid);
  return {
    status: 200,
    data: {
      success: true,
      knowledgeText: ws.knowledgeText || '',
      knowledgeItems: sanitizeKnowledgeItems(ws.knowledgeItems),
      autoLearnKnowledge: ws.autoLearnKnowledge !== false,
      updatedAt: ws.updatedAt,
    },
  };
}

export async function processMirrorBotKnowledgePost(
  body: Record<string, any>,
  authorizationHeader?: string,
  clientIp = 'unknown'
): Promise<{
  status: number;
  data: Record<string, any>;
}> {
  const caller = await verifyCallerAuth(authorizationHeader);
  if (!caller) {
    return {
      status: 401,
      data: { success: false, error: 'Please sign in to manage your Mirror Bot knowledge data.' },
    };
  }

  const uid = caller.uid;
  const isOwner = isCallerOwnerAdmin(caller);
  const action = String(body?.action || '').trim();

  if (action === 'save') {
    const knowledgeText =
      typeof body.knowledgeText === 'string' ? body.knowledgeText.slice(0, 8000) : undefined;
    const knowledgeItems = Array.isArray(body.knowledgeItems)
      ? sanitizeKnowledgeItems(body.knowledgeItems)
      : undefined;
    const autoLearnKnowledge =
      typeof body.autoLearnKnowledge === 'boolean' ? body.autoLearnKnowledge : undefined;

    const businessName =
      typeof body.businessName === 'string' && body.businessName.trim()
        ? body.businessName.trim().slice(0, 100)
        : undefined;
    const botName =
      typeof body.botName === 'string' && body.botName.trim()
        ? body.botName.trim().slice(0, 50)
        : undefined;
    const workPoints = Array.isArray(body.workPoints)
      ? body.workPoints
          .map((p: unknown) => String(p || '').trim().slice(0, 140))
          .filter(Boolean)
          .slice(0, 15)
      : undefined;

    const updated = await saveWorkspaceByUid(uid, (curr) => ({
      ...curr,
      businessName: businessName || curr.businessName,
      botName: botName || curr.botName,
      workPoints: workPoints ?? curr.workPoints,
      knowledgeText: knowledgeText !== undefined ? knowledgeText : curr.knowledgeText,
      knowledgeItems: knowledgeItems !== undefined ? knowledgeItems : curr.knowledgeItems,
      autoLearnKnowledge:
        autoLearnKnowledge !== undefined ? autoLearnKnowledge : curr.autoLearnKnowledge,
    }));

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
      data: {
        success: true,
        knowledgeText: updated.knowledgeText,
        knowledgeItems: updated.knowledgeItems,
        autoLearnKnowledge: updated.autoLearnKnowledge,
        updatedAt: updated.updatedAt,
      },
    };
  }

  if (action === 'delete_item') {
    const itemId = String(body.itemId || '').trim();
    if (!itemId) {
      return { status: 400, data: { success: false, error: 'Missing knowledge item ID.' } };
    }
    const updated = await saveWorkspaceByUid(uid, (curr) => ({
      ...curr,
      knowledgeItems: curr.knowledgeItems.filter((item) => item.id !== itemId),
    }));
    if (isOwner) {
      await syncOwnerFallbackWorkspace({ knowledgeItems: updated.knowledgeItems });
    }
    return {
      status: 200,
      data: {
        success: true,
        knowledgeText: updated.knowledgeText,
        knowledgeItems: updated.knowledgeItems,
        autoLearnKnowledge: updated.autoLearnKnowledge,
        updatedAt: updated.updatedAt,
      },
    };
  }

  if (action === 'structure_from_data' || action === 'ai_generate_new') {
    if (!checkMirrorBotRateLimit(`kb:${uid}:${clientIp}`, 12)) {
      return {
        status: 429,
        data: {
          success: false,
          error: 'Too many AI generation requests. Please wait a few seconds and try again.',
        },
      };
    }

    const curr = await getWorkspaceByUid(uid);
    const businessName =
      String(body.businessName || '').trim().slice(0, 100) || curr.businessName || 'My Business';
    const botName = String(body.botName || '').trim().slice(0, 50) || curr.botName || 'Mirror Bot';
    const workPoints = Array.isArray(body.workPoints)
      ? body.workPoints
          .map((p: unknown) => String(p || '').trim().slice(0, 140))
          .filter(Boolean)
          .slice(0, 15)
      : curr.workPoints;
    const rawDataText =
      typeof body.knowledgeText === 'string'
        ? body.knowledgeText.trim().slice(0, 8000)
        : curr.knowledgeText || '';
    const existingItems = Array.isArray(body.knowledgeItems)
      ? sanitizeKnowledgeItems(body.knowledgeItems)
      : curr.knowledgeItems;
    const focusTopic = String(body.focusTopic || '').trim().slice(0, 200);
    const preferredLang = body.language === 'bn' ? 'Bangla (natural Bangladeshi Bangla)' : 'matching the user data language (Bangla or English)';

    if (action === 'structure_from_data' && rawDataText.length < 10) {
      return {
        status: 400,
        data: {
          success: false,
          error: 'Please enter or paste your business data first before structuring it.',
        },
      };
    }

    const existingTitlesList =
      existingItems.length > 0
        ? existingItems.map((i) => `- ${i.title}: ${i.content}`).join('\n')
        : 'None yet.';

    const prompt =
      action === 'structure_from_data'
        ? `Extract and organize the owner's raw business data into clean, live-ready structured knowledge cards for their AI sales & support bot "${botName}" at "${businessName}".
Write each card clearly in ${preferredLang}. Preserve exact prices, phone numbers, package details, and policies verbatim — NEVER invent prices that are not in the raw data.
Generate between 3 and 7 crisp, non-duplicate cards.

Business Name: ${businessName}
Business Points: ${workPoints.join(' | ') || 'Not specified'}
Raw Business Data:
${rawDataText}

Already Integrated Cards (do not duplicate):
${existingTitlesList}`
        : `You are helping "${businessName}" expand its live AI customer support & sales knowledge base for "${botName}".
Based on the business info and existing data below, autonomously generate 4 to 6 NEW, high-value, practical knowledge cards (such as common customer FAQs, how to order step-by-step, delivery/support expectations, package/service explanations, trust assurances, and polite objection replies) that customers on Facebook Messenger, Facebook Comments, and WhatsApp frequently ask!
Write in ${preferredLang}. NEVER contradict existing facts and NEVER make up fake numeric prices if a price is not mentioned in the input data (instead guide customers clearly on how to confirm custom quotes/orders).
${focusTopic ? `Special focus topic requested by owner: ${focusTopic}` : ''}

Business Name: ${businessName}
Business Points: ${workPoints.join(' | ') || 'General business'}
Owner's Raw Data:
${rawDataText || 'Not provided yet — rely on business name and points.'}

Already Integrated Cards (generate NEW complementary data, do not repeat these):
${existingTitlesList}`;

    try {
      const { response } = await generateMirrorBotContent({
        model: MIRRORBOT_GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: 'Short clear title (max 80 chars), e.g. package name or FAQ question.',
                    },
                    category: {
                      type: Type.STRING,
                      description: 'One of: product, faq, policy, offer, general',
                    },
                    content: {
                      type: Type.STRING,
                      description: 'Clear, accurate, ready-to-use answer or business fact (1-3 concise sentences).',
                    },
                  },
                  required: ['title', 'category', 'content'],
                },
              },
            },
            required: ['items'],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim() || '{}');
      const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];
      const source = action === 'structure_from_data' ? 'ai_structured' : 'ai_generated';
      const nowIso = new Date().toISOString();

      const generatedItems: MirrorBotKnowledgeItem[] = rawItems
        .filter((it: any) => it && typeof it.title === 'string' && typeof it.content === 'string')
        .slice(0, 8)
        .map((it: any) => {
          const cat = String(it.category || 'general').trim().toLowerCase() as MirrorBotKnowledgeCategory;
          return {
            id: `kb_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
            title: String(it.title).trim().slice(0, 120),
            category: VALID_CATEGORIES.has(cat) ? cat : 'general',
            content: String(it.content).trim().slice(0, 500),
            source,
            createdAt: nowIso,
          };
        })
        .filter((it: MirrorBotKnowledgeItem) => it.title && it.content);

      const { merged, added } = mergeKnowledgeItems(existingItems, generatedItems);

      const updated = await saveWorkspaceByUid(uid, (prev) => ({
        ...prev,
        businessName,
        botName,
        workPoints,
        knowledgeText: rawDataText || prev.knowledgeText,
        knowledgeItems: merged,
      }));

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
        data: {
          success: true,
          addedCount: added.length,
          newItems: added,
          knowledgeText: updated.knowledgeText,
          knowledgeItems: updated.knowledgeItems,
          autoLearnKnowledge: updated.autoLearnKnowledge,
          updatedAt: updated.updatedAt,
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

  return { status: 400, data: { success: false, error: 'Unsupported action.' } };
}

export default async function handler(req: any, res: any) {
  const authHeader =
    typeof req.headers?.authorization === 'string' ? req.headers.authorization : undefined;
  const clientIp =
    (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (req.method === 'GET') {
    const result = await processMirrorBotKnowledgeGet(authHeader);
    res.setHeader('Cache-Control', 'no-store');
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
    const result = await processMirrorBotKnowledgePost(body || {}, authHeader, clientIp);
    res.setHeader('Cache-Control', 'no-store');
    res.status(result.status).json(result.data);
    return;
  }

  res.status(405).json({ success: false, error: 'Method not allowed.' });
}

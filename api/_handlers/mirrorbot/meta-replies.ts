import { processMirrorBotChat, type MirrorBotBusinessContext } from './chat.js';
import {
  appendAutoLearnedKnowledge,
  clearReplyLogsForTenant,
  getReplyLogsForTenant,
  getWorkspaceByUid,
  recordReplyLog,
  sanitizeKnowledgeItems,
  verifyCallerAuth,
} from '../../_lib/metaStore.js';

const OWNER_ADMIN_EMAIL = 'khansaheb2572@gmail.com';

function isCallerOwnerAdmin(caller: { email?: string; emailVerified?: boolean }): boolean {
  return (
    Boolean(caller.emailVerified) &&
    String(caller.email || '').trim().toLowerCase() === OWNER_ADMIN_EMAIL
  );
}

export async function processMetaRepliesGet(authorizationHeader?: string): Promise<{
  status: number;
  data: Record<string, any>;
}> {
  const caller = await verifyCallerAuth(authorizationHeader);
  if (!caller) {
    return {
      status: 401,
      data: { success: false, error: 'Please sign in to view your auto-reply activity.' },
    };
  }

  const includeFallback = isCallerOwnerAdmin(caller);
  const result = await getReplyLogsForTenant(caller.uid, includeFallback);

  return {
    status: 200,
    data: {
      success: true,
      ...result,
    },
  };
}

export async function processMetaRepliesPost(
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
      data: { success: false, error: 'Please sign in to manage auto-reply activity.' },
    };
  }

  const includeFallback = isCallerOwnerAdmin(caller);
  const action = String(body?.action || '').trim();

  if (action === 'clear_logs') {
    await clearReplyLogsForTenant(caller.uid, includeFallback);
    const updated = await getReplyLogsForTenant(caller.uid, includeFallback);
    return {
      status: 200,
      data: {
        success: true,
        ...updated,
      },
    };
  }

  if (action === 'test_reply') {
    const message = String(body?.message || '').trim().slice(0, 600);
    const senderName = String(body?.senderName || '').trim().slice(0, 80) || 'Test Customer';
    if (!message) {
      return {
        status: 400,
        data: { success: false, error: 'Please enter a customer message to test auto-reply.' },
      };
    }

    const ws = await getWorkspaceByUid(caller.uid);
    const businessName =
      String(body?.businessName || '').trim().slice(0, 100) || ws.businessName || 'My Business';
    const botName = String(body?.botName || '').trim().slice(0, 50) || ws.botName || 'Mirror Bot';
    const workPoints = Array.isArray(body?.workPoints)
      ? body.workPoints.map((p: unknown) => String(p || '').trim()).filter(Boolean).slice(0, 15)
      : ws.workPoints;

    const knowledgeText =
      typeof body?.knowledgeText === 'string'
        ? body.knowledgeText.trim().slice(0, 8000)
        : ws.knowledgeText || '';
    const knowledgeItems = Array.isArray(body?.knowledgeItems)
      ? sanitizeKnowledgeItems(body.knowledgeItems)
      : ws.knowledgeItems || [];
    const autoLearnKnowledge =
      typeof body?.autoLearnKnowledge === 'boolean'
        ? body.autoLearnKnowledge
        : ws.autoLearnKnowledge !== false;

    const business: MirrorBotBusinessContext = {
      businessName,
      businessCategory: ws.facebookPage.pageCategory || 'Business',
      whatYouWorkWith:
        workPoints.length > 0
          ? workPoints.map((pt: string) => `• ${pt}`).join('\n')
          : 'Products and services provided by the business.',
      openingHours: '',
      deliveryInfo: '',
      codAvailable: true,
      supportPhone: ws.whatsapp.displayPhone || '',
      botName,
      knowledgeText,
      knowledgeItems,
      autoLearnKnowledge,
    };

    const aiResult = await processMirrorBotChat(
      {
        business,
        message,
        history: [],
      },
      `test:${caller.uid}`
    );

    if (aiResult.status !== 200 || !Array.isArray(aiResult.data.replies)) {
      await recordReplyLog({
        tenantUid: caller.uid,
        channel: 'web_test',
        senderId: `test_${senderName.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'user'}`,
        senderName,
        customerMessage: message,
        hasImage: false,
        botReply: '',
        status: 'failed',
        errorNote: aiResult.data.error || 'AI reply failed',
      });
      const updated = await getReplyLogsForTenant(caller.uid, includeFallback);
      return {
        status: aiResult.status,
        data: {
          success: false,
          error: aiResult.data.error || 'Could not generate auto-reply.',
          ...updated,
        },
      };
    }

    const combinedReply = aiResult.data.replies.join('\n');
    const logged = await recordReplyLog({
      tenantUid: caller.uid,
      channel: 'web_test',
      senderId: `test_${senderName.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'user'}`,
      senderName,
      customerMessage: message,
      hasImage: false,
      botReply: combinedReply,
      status: 'sent',
    });

    let newlyLearnedItem = null;
    let updatedKnowledgeItems = knowledgeItems;
    if (aiResult.data.suggestedKnowledge && autoLearnKnowledge) {
      try {
        const learned = await appendAutoLearnedKnowledge(
          caller.uid,
          aiResult.data.suggestedKnowledge
        );
        newlyLearnedItem = learned.saved;
        updatedKnowledgeItems = learned.items;
        if (includeFallback && learned.saved) {
          await appendAutoLearnedKnowledge('owner_fallback', aiResult.data.suggestedKnowledge);
        }
      } catch {
        // Non-fatal auto-learn persistence
      }
    }

    const updated = await getReplyLogsForTenant(caller.uid, includeFallback);
    return {
      status: 200,
      data: {
        success: true,
        reply: combinedReply,
        replies: aiResult.data.replies,
        loggedEntry: logged,
        newlyLearnedItem,
        knowledgeItems: updatedKnowledgeItems,
        ...updated,
      },
    };
  }

  return { status: 400, data: { success: false, error: 'Unsupported action.' } };
}

export default async function handler(req: any, res: any) {
  const authHeader =
    typeof req.headers?.authorization === 'string' ? req.headers.authorization : undefined;

  if (req.method === 'GET') {
    const result = await processMetaRepliesGet(authHeader);
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
    const result = await processMetaRepliesPost(body || {}, authHeader);
    res.setHeader('Cache-Control', 'no-store');
    res.status(result.status).json(result.data);
    return;
  }

  res.status(405).json({ success: false, error: 'Method not allowed.' });
}

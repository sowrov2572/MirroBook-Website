import crypto from 'crypto';
import { createFirebaseAdminStore, isFirebaseAdminConfigured } from './firebaseAdmin.js';
import { verifyFirebaseIdToken, type VerifiedFirebaseToken } from '../_handlers/auth/session.js';

export type MetaChannelType = 'facebook' | 'messenger' | 'whatsapp';

export interface DiscoveredFacebookPage {
  id: string;
  name: string;
  category: string;
  accessToken: string;
}

export interface DiscoveredWhatsAppNumber {
  wabaId: string;
  wabaName: string;
  phoneNumberId: string;
  displayPhone: string;
  verifiedName: string;
  accessToken: string;
}

export interface MetaOAuthStateEntry {
  uid: string;
  channel: MetaChannelType;
  redirectUri: string;
  createdAt: number;
}

export interface MetaOAuthSession {
  id: string;
  uid: string;
  channel: MetaChannelType;
  createdAt: number;
  pages: DiscoveredFacebookPage[];
  whatsappNumbers: DiscoveredWhatsAppNumber[];
}

export type MirrorBotKnowledgeCategory = 'product' | 'faq' | 'policy' | 'offer' | 'general';
export type MirrorBotKnowledgeSource = 'manual' | 'ai_structured' | 'ai_generated' | 'auto_learned';

export interface MirrorBotKnowledgeItem {
  id: string;
  title: string;
  category: MirrorBotKnowledgeCategory;
  content: string;
  source: MirrorBotKnowledgeSource;
  createdAt: string;
}

export interface MirrorBotWorkspaceRecord {
  uid: string;
  activatedInVault: boolean;
  businessName: string;
  workPoints: string[];
  botName: string;
  autoReplyEnabled: boolean;
  knowledgeText: string;
  knowledgeItems: MirrorBotKnowledgeItem[];
  autoLearnKnowledge: boolean;
  updatedAt: string;
  facebookPage: {
    connected: boolean;
    pageId: string;
    pageName: string;
    pageCategory: string;
    connectedAt: string;
    webhookSubscribed: boolean;
    pageAccessToken?: string;
  };
  messenger: {
    connected: boolean;
    pageId: string;
    pageName: string;
    connectedAt: string;
    webhookSubscribed: boolean;
  };
  whatsapp: {
    connected: boolean;
    wabaId: string;
    phoneNumberId: string;
    displayPhone: string;
    verifiedName: string;
    connectedAt: string;
    accessToken?: string;
  };
}

export interface SafeMirrorBotWorkspace {
  uid: string;
  activatedInVault: boolean;
  businessName: string;
  workPoints: string[];
  botName: string;
  autoReplyEnabled: boolean;
  knowledgeText: string;
  knowledgeItems: MirrorBotKnowledgeItem[];
  autoLearnKnowledge: boolean;
  updatedAt: string;
  facebookPage: {
    connected: boolean;
    pageId: string;
    pageName: string;
    pageCategory: string;
    connectedAt: string;
    webhookSubscribed: boolean;
  };
  messenger: {
    connected: boolean;
    pageId: string;
    pageName: string;
    connectedAt: string;
    webhookSubscribed: boolean;
  };
  whatsapp: {
    connected: boolean;
    wabaId: string;
    phoneNumberId: string;
    displayPhone: string;
    verifiedName: string;
    connectedAt: string;
  };
}

const SECRETS_COLLECTION = 'mirrorbot_channel_secrets';
const ROUTES_COLLECTION = 'mirrorbot_channel_routes';
const REPLY_LOGS_COLLECTION = 'mirrorbot_reply_logs';
const DIAGNOSTICS_COLLECTION = 'mirrorbot_diagnostics';
const WEBHOOK_DEDUP_COLLECTION = 'mirrorbot_webhook_dedup';
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const WORKSPACE_CACHE_TTL_MS = 60 * 1000; // 60 seconds when Firestore Admin is active
const DEDUP_TTL_MS = 30 * 60 * 1000; // 30 minutes
const HISTORY_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_HISTORY_TURNS = 8;
const MAX_REPLY_LOGS_PER_TENANT = 50;
const MAX_DIAGNOSTIC_EVENTS = 100;

export function getGraphApiVersion(): string {
  const raw = (process.env.GRAPH_API_VERSION || 'v21.0').trim().replace(/^\/+|\/+$/g, '');
  return /^v\d+\.\d+$/.test(raw) ? raw : 'v21.0';
}

export function getMetaVerifyToken(): string {
  return (process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN || '').trim();
}

export function getMetaFallbackPageId(): string {
  return (process.env.META_FALLBACK_PAGE_ID || process.env.META_PAGE_ID || '').trim();
}

export type DiagnosticStage =
  | 'WEBHOOK_RECEIVED'
  | 'WEBHOOK_VALIDATED'
  | 'MESSAGE_EXTRACTED'
  | 'CUSTOMER_IDENTIFIED'
  | 'KNOWLEDGE_BASE_LOADED'
  | 'GEMINI_REQUEST_STARTED'
  | 'GEMINI_RESPONSE_RECEIVED'
  | 'MESSENGER_SEND_STARTED'
  | 'MESSENGER_SEND_SUCCESS'
  | 'MESSAGE_PROCESSING_FAILED';

export interface MirrorBotDiagnosticEvent {
  id: string;
  timestamp: string;
  stage: DiagnosticStage;
  channel: 'messenger' | 'facebook_comment' | 'whatsapp' | 'system';
  eventId?: string;
  pageId?: string;
  success: boolean;
  durationMs?: number;
  detail?: string;
  errorCode?: string;
  errorSubcode?: string;
  fbtraceId?: string;
}

export interface PageSubscriptionResult {
  subscribed: boolean;
  fields: string[];
  httpStatus?: number;
  errorCode?: string;
  errorSubcode?: string;
  errorMessage?: string;
  fbtraceId?: string;
}

export async function subscribeFacebookPageWebhook(
  pageId: string,
  pageAccessToken: string
): Promise<PageSubscriptionResult> {
  const version = getGraphApiVersion();
  const cleanPageId = String(pageId || '').trim();
  const cleanToken = String(pageAccessToken || '').trim();
  if (!cleanPageId || !cleanToken) {
    return {
      subscribed: false,
      fields: [],
      errorMessage: 'Missing pageId or Page Access Token.',
    };
  }

  const attempts: string[][] = [
    ['messages', 'messaging_postbacks', 'feed'],
    ['messages', 'messaging_postbacks'],
  ];

  let lastResult: PageSubscriptionResult = {
    subscribed: false,
    fields: [],
    errorMessage: 'Subscription request failed.',
  };

  for (const fields of attempts) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/${version}/${encodeURIComponent(cleanPageId)}/subscribed_apps`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cleanToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subscribed_fields: fields }),
        }
      );
      const json: any = await res.json().catch(() => null);
      if (res.ok && json?.success !== false) {
        return {
          subscribed: true,
          fields,
          httpStatus: res.status,
        };
      }
      lastResult = {
        subscribed: false,
        fields,
        httpStatus: res.status,
        errorCode: json?.error?.code !== undefined ? String(json.error.code) : undefined,
        errorSubcode:
          json?.error?.error_subcode !== undefined ? String(json.error.error_subcode) : undefined,
        errorMessage:
          typeof json?.error?.message === 'string'
            ? json.error.message.slice(0, 240)
            : `HTTP ${res.status}`,
        fbtraceId: typeof json?.error?.fbtrace_id === 'string' ? json.error.fbtrace_id : undefined,
      };
      console.error('[metaStore] Page webhook subscription attempt failed:', {
        pageId: cleanPageId,
        fields,
        ...lastResult,
      });
    } catch (err: any) {
      lastResult = {
        subscribed: false,
        fields,
        errorMessage: err?.message || 'Network error calling Meta subscribed_apps.',
      };
    }
  }

  return lastResult;
}

export type ReplyLogChannel = 'messenger' | 'facebook_comment' | 'whatsapp' | 'web_test';

export interface MirrorBotReplyLogEntry {
  id: string;
  tenantUid: string;
  channel: ReplyLogChannel;
  senderId: string;
  senderName: string;
  customerMessage: string;
  hasImage: boolean;
  botReply: string;
  status: 'sent' | 'failed';
  errorNote?: string;
  createdAt: string;
}

export interface MirrorBotRecipientSummary {
  senderId: string;
  senderName: string;
  channel: ReplyLogChannel;
  replyCount: number;
  lastRepliedAt: string;
  lastCustomerMessage: string;
  lastBotReply: string;
  lastStatus: 'sent' | 'failed';
}

const oauthStates = new Map<string, MetaOAuthStateEntry>();
const oauthSessions = new Map<string, MetaOAuthSession>();
const workspacesByUid = new Map<string, { record: MirrorBotWorkspaceRecord; cachedAt: number }>();
const pageRouteToUid = new Map<string, string>();
const whatsappRouteToUid = new Map<string, string>();
const seenWebhookEvents = new Map<string, number>();
const tenantConversations = new Map<
  string,
  { updatedAt: number; entries: Array<{ sender: 'customer' | 'bot'; text: string; hasImage?: boolean }> }
>();
const replyLogsByTenant = new Map<string, MirrorBotReplyLogEntry[]>();
let diagnosticEventsBuffer: MirrorBotDiagnosticEvent[] = [];

function mergeDiagnosticEvents(lists: MirrorBotDiagnosticEvent[][]): MirrorBotDiagnosticEvent[] {
  const byId = new Map<string, MirrorBotDiagnosticEvent>();
  for (const list of lists) {
    for (const item of list) {
      if (item && typeof item.id === 'string' && item.id) {
        byId.set(item.id, item);
      }
    }
  }
  return Array.from(byId.values())
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
    .slice(0, MAX_DIAGNOSTIC_EVENTS);
}

export async function recordDiagnosticEvent(
  event: Omit<MirrorBotDiagnosticEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: string },
  persistImmediately = false
): Promise<MirrorBotDiagnosticEvent> {
  const normalized: MirrorBotDiagnosticEvent = {
    id: event.id || `diag_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
    timestamp: event.timestamp || new Date().toISOString(),
    stage: event.stage,
    channel: event.channel,
    eventId: event.eventId ? String(event.eventId).slice(0, 120) : undefined,
    pageId: event.pageId ? String(event.pageId).slice(0, 64) : undefined,
    success: Boolean(event.success),
    durationMs: typeof event.durationMs === 'number' ? Math.max(0, Math.round(event.durationMs)) : undefined,
    detail: event.detail ? String(event.detail).slice(0, 260) : undefined,
    errorCode: event.errorCode ? String(event.errorCode).slice(0, 40) : undefined,
    errorSubcode: event.errorSubcode ? String(event.errorSubcode).slice(0, 40) : undefined,
    fbtraceId: event.fbtraceId ? String(event.fbtraceId).slice(0, 80) : undefined,
  };

  diagnosticEventsBuffer = mergeDiagnosticEvents([[normalized], diagnosticEventsBuffer]);

  // Structured server log (zero secrets / tokens / PII)
  console.log(
    '[mirrorbot-diag]',
    JSON.stringify({
      stage: normalized.stage,
      channel: normalized.channel,
      pageId: normalized.pageId,
      eventId: normalized.eventId,
      success: normalized.success,
      durationMs: normalized.durationMs,
      detail: normalized.detail,
      errorCode: normalized.errorCode,
      errorSubcode: normalized.errorSubcode,
      fbtraceId: normalized.fbtraceId,
    })
  );

  // Persist terminal/critical stages (or when explicitly requested) to Firestore for cross-instance Admin Diagnostics
  const shouldPersist =
    persistImmediately ||
    normalized.stage === 'WEBHOOK_RECEIVED' ||
    normalized.stage === 'MESSENGER_SEND_SUCCESS' ||
    normalized.stage === 'MESSAGE_PROCESSING_FAILED';

  if (shouldPersist && isFirebaseAdminConfigured()) {
    try {
      const store = createFirebaseAdminStore();
      const doc = await store.getDoc(DIAGNOSTICS_COLLECTION, 'global');
      const remoteItems = Array.isArray(doc?.events)
        ? (doc.events as MirrorBotDiagnosticEvent[])
        : [];
      const merged = mergeDiagnosticEvents([diagnosticEventsBuffer, remoteItems]);
      diagnosticEventsBuffer = merged;
      await store.setDoc(DIAGNOSTICS_COLLECTION, 'global', {
        updatedAt: new Date().toISOString(),
        events: merged,
      });
    } catch {
      // Keep in-memory diagnostics intact even if Firestore write fails
    }
  }

  return normalized;
}

export async function getDiagnosticEvents(limit = 60): Promise<MirrorBotDiagnosticEvent[]> {
  let combined = [...diagnosticEventsBuffer];
  if (isFirebaseAdminConfigured()) {
    try {
      const store = createFirebaseAdminStore();
      const doc = await store.getDoc(DIAGNOSTICS_COLLECTION, 'global');
      if (doc && Array.isArray(doc.events)) {
        combined = mergeDiagnosticEvents([combined, doc.events as MirrorBotDiagnosticEvent[]]);
        diagnosticEventsBuffer = combined;
      }
    } catch {
      // Fallback to in-memory buffer
    }
  }
  return combined.slice(0, Math.max(1, Math.min(MAX_DIAGNOSTIC_EVENTS, limit)));
}

function mergeAndSortReplyLogs(lists: MirrorBotReplyLogEntry[][]): MirrorBotReplyLogEntry[] {
  const byId = new Map<string, MirrorBotReplyLogEntry>();
  for (const list of lists) {
    for (const item of list) {
      if (item && typeof item.id === 'string' && item.id) {
        byId.set(item.id, item);
      }
    }
  }
  return Array.from(byId.values())
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, MAX_REPLY_LOGS_PER_TENANT);
}

export async function recordReplyLog(
  entry: Omit<MirrorBotReplyLogEntry, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): Promise<MirrorBotReplyLogEntry> {
  const tenantUid = String(entry.tenantUid || '').trim() || 'owner_fallback';
  const normalized: MirrorBotReplyLogEntry = {
    id: entry.id || `rep_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`,
    tenantUid,
    channel: entry.channel,
    senderId: String(entry.senderId || '').trim().slice(0, 120),
    senderName: String(entry.senderName || 'Customer').trim().slice(0, 120),
    customerMessage: String(entry.customerMessage || '').trim().slice(0, 400),
    hasImage: Boolean(entry.hasImage),
    botReply: String(entry.botReply || '').trim().slice(0, 800),
    status: entry.status === 'failed' ? 'failed' : 'sent',
    errorNote: entry.errorNote ? String(entry.errorNote).trim().slice(0, 200) : undefined,
    createdAt: entry.createdAt || new Date().toISOString(),
  };

  const existingMem = replyLogsByTenant.get(tenantUid) || [];
  let merged = mergeAndSortReplyLogs([[normalized], existingMem]);
  replyLogsByTenant.set(tenantUid, merged);

  if (isFirebaseAdminConfigured()) {
    try {
      const store = createFirebaseAdminStore();
      const doc = await store.getDoc(REPLY_LOGS_COLLECTION, tenantUid);
      const remoteItems = Array.isArray(doc?.items) ? (doc.items as MirrorBotReplyLogEntry[]) : [];
      merged = mergeAndSortReplyLogs([[normalized], existingMem, remoteItems]);
      replyLogsByTenant.set(tenantUid, merged);
      await store.setDoc(REPLY_LOGS_COLLECTION, tenantUid, {
        uid: tenantUid,
        updatedAt: new Date().toISOString(),
        items: merged,
      });
    } catch {
      // Keep in-memory log intact even if Admin Firestore is unavailable
    }
  }

  return normalized;
}

export async function getReplyLogsForTenant(
  uid: string,
  includeOwnerFallback = false
): Promise<{
  logs: MirrorBotReplyLogEntry[];
  recipients: MirrorBotRecipientSummary[];
  summary: {
    totalReplies: number;
    sentCount: number;
    failedCount: number;
    uniqueRecipients: number;
    byChannel: {
      messenger: number;
      facebook_comment: number;
      whatsapp: number;
      web_test: number;
    };
  };
}> {
  const keys = includeOwnerFallback ? [uid, 'owner_fallback'] : [uid];
  const collected: MirrorBotReplyLogEntry[][] = [];

  for (const key of keys) {
    const mem = replyLogsByTenant.get(key) || [];
    if (mem.length > 0) collected.push(mem);

    if (isFirebaseAdminConfigured()) {
      try {
        const store = createFirebaseAdminStore();
        const doc = await store.getDoc(REPLY_LOGS_COLLECTION, key);
        if (doc && Array.isArray(doc.items)) {
          const items = doc.items as MirrorBotReplyLogEntry[];
          collected.push(items);
          replyLogsByTenant.set(key, mergeAndSortReplyLogs([mem, items]));
        }
      } catch {
        // Fallback to in-memory buffer
      }
    }
  }

  const logs = mergeAndSortReplyLogs(collected);

  const byChannel = {
    messenger: 0,
    facebook_comment: 0,
    whatsapp: 0,
    web_test: 0,
  };
  let sentCount = 0;
  let failedCount = 0;

  const recipientMap = new Map<string, MirrorBotRecipientSummary>();
  for (const log of logs) {
    if (log.status === 'sent') sentCount += 1;
    else failedCount += 1;
    if (log.channel in byChannel) {
      byChannel[log.channel] += 1;
    }

    const rKey = `${log.channel}:${log.senderId || log.senderName}`;
    const existing = recipientMap.get(rKey);
    if (!existing) {
      recipientMap.set(rKey, {
        senderId: log.senderId,
        senderName: log.senderName,
        channel: log.channel,
        replyCount: 1,
        lastRepliedAt: log.createdAt,
        lastCustomerMessage: log.customerMessage,
        lastBotReply: log.botReply,
        lastStatus: log.status,
      });
    } else {
      existing.replyCount += 1;
    }
  }

  const recipients = Array.from(recipientMap.values()).sort((a, b) =>
    (b.lastRepliedAt || '').localeCompare(a.lastRepliedAt || '')
  );

  return {
    logs,
    recipients,
    summary: {
      totalReplies: logs.length,
      sentCount,
      failedCount,
      uniqueRecipients: recipients.length,
      byChannel,
    },
  };
}

export async function clearReplyLogsForTenant(
  uid: string,
  includeOwnerFallback = false
): Promise<void> {
  const keys = includeOwnerFallback ? [uid, 'owner_fallback'] : [uid];
  for (const key of keys) {
    replyLogsByTenant.set(key, []);
    if (isFirebaseAdminConfigured()) {
      try {
        const store = createFirebaseAdminStore();
        await store.setDoc(REPLY_LOGS_COLLECTION, key, {
          uid: key,
          updatedAt: new Date().toISOString(),
          items: [],
        });
      } catch {
        // Non-fatal
      }
    }
  }
}

const ENC_PREFIX = 'enc:v1:';

function getTokenEncryptionKey(): Buffer | null {
  const raw =
    (process.env.META_TOKEN_ENCRYPTION_KEY || '').trim() ||
    (process.env.META_APP_SECRET || '').trim();
  if (!raw) return null;
  return crypto.createHash('sha256').update(`mirrorbot-token-enc-v1:${raw}`, 'utf8').digest();
}

function encryptSecretToken(plain?: string): string | undefined {
  const val = typeof plain === 'string' ? plain.trim() : '';
  if (!val) return undefined;
  if (val.startsWith(ENC_PREFIX)) return val;
  const key = getTokenEncryptionKey();
  if (!key) return val;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(val, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString('base64url')}:${tag.toString('base64url')}:${ciphertext.toString('base64url')}`;
}

function decryptSecretToken(stored?: string): string | undefined {
  const val = typeof stored === 'string' ? stored.trim() : '';
  if (!val) return undefined;
  if (!val.startsWith(ENC_PREFIX)) return val;
  const key = getTokenEncryptionKey();
  if (!key) return undefined;
  try {
    const rest = val.slice(ENC_PREFIX.length);
    const [ivB64, tagB64, ctB64] = rest.split(':');
    if (!ivB64 || !tagB64 || !ctB64) return undefined;
    const iv = Buffer.from(ivB64, 'base64url');
    const tag = Buffer.from(tagB64, 'base64url');
    const ciphertext = Buffer.from(ctB64, 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    return undefined;
  }
}

export function markWebhookEventProcessed(eventKey: string): boolean {
  const key = String(eventKey || '').trim();
  if (!key) return true;
  const now = Date.now();
  if (seenWebhookEvents.size > 1500) {
    for (const [k, ts] of seenWebhookEvents.entries()) {
      if (now - ts > DEDUP_TTL_MS) seenWebhookEvents.delete(k);
    }
  }
  const prev = seenWebhookEvents.get(key);
  if (prev && now - prev < DEDUP_TTL_MS) {
    return false; // Duplicate webhook delivery
  }
  seenWebhookEvents.set(key, now);
  return true;
}

function hashDedupKey(eventKey: string): string {
  return crypto.createHash('sha256').update(eventKey, 'utf8').digest('hex').slice(0, 40);
}

/**
 * Cross-instance deduplication guard backed by both local memory and Firestore
 * so Meta webhook retries across Vercel serverless cold starts never trigger duplicate replies.
 */
export async function claimWebhookEvent(
  eventKey: string,
  meta?: { channel?: string; pageId?: string }
): Promise<boolean> {
  const key = String(eventKey || '').trim();
  if (!key) return true;
  if (!markWebhookEventProcessed(key)) {
    return false;
  }

  if (isFirebaseAdminConfigured()) {
    try {
      const store = createFirebaseAdminStore();
      const docId = `dedup_${hashDedupKey(key)}`;
      const now = Date.now();
      const claimed = await store.runTransaction(async (tx) => {
        const existing = await tx.get(WEBHOOK_DEDUP_COLLECTION, docId);
        if (existing && typeof existing.claimedAtMs === 'number') {
          const ageMs = now - existing.claimedAtMs;
          // Block duplicates within TTL window (processing or completed)
          if (ageMs < DEDUP_TTL_MS) {
            return false;
          }
        }
        tx.set(WEBHOOK_DEDUP_COLLECTION, docId, {
          docId,
          channel: meta?.channel || 'messenger',
          pageId: meta?.pageId || '',
          status: 'processing',
          claimedAtMs: now,
          updatedAt: new Date(now).toISOString(),
        });
        return true;
      });
      return claimed;
    } catch {
      // Fail-open to in-memory dedup if Firestore transaction is temporarily unavailable
      return true;
    }
  }

  return true;
}

export async function updateWebhookEventStatus(
  eventKey: string,
  status: 'sent' | 'failed',
  note?: string
): Promise<void> {
  const key = String(eventKey || '').trim();
  if (!key || !isFirebaseAdminConfigured()) return;
  try {
    const store = createFirebaseAdminStore();
    const docId = `dedup_${hashDedupKey(key)}`;
    await store.setDoc(WEBHOOK_DEDUP_COLLECTION, docId, {
      status,
      note: note ? String(note).slice(0, 200) : '',
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // Non-fatal status tracking update
  }
}

export function getTenantConversationHistory(
  tenantKey: string,
  channel: string,
  senderId: string
): Array<{ sender: 'customer' | 'bot'; text: string; hasImage?: boolean }> {
  const key = `${tenantKey}:${channel}:${senderId}`;
  const item = tenantConversations.get(key);
  if (!item) return [];
  if (Date.now() - item.updatedAt > HISTORY_TTL_MS) {
    tenantConversations.delete(key);
    return [];
  }
  return item.entries.slice(-MAX_HISTORY_TURNS);
}

export function appendTenantConversationHistory(
  tenantKey: string,
  channel: string,
  senderId: string,
  customerText: string,
  botReplies: string[],
  hasImage = false
): void {
  const now = Date.now();
  if (tenantConversations.size > 500) {
    for (const [k, v] of tenantConversations.entries()) {
      if (now - v.updatedAt > HISTORY_TTL_MS) tenantConversations.delete(k);
    }
  }
  const key = `${tenantKey}:${channel}:${senderId}`;
  const current = tenantConversations.get(key)?.entries || [];
  const next = [...current];
  if (customerText || hasImage) {
    next.push({
      sender: 'customer',
      text: (customerText || '[Photo]').slice(0, 800),
      hasImage,
    });
  }
  for (const reply of botReplies) {
    if (reply) {
      next.push({ sender: 'bot', text: reply.slice(0, 800) });
    }
  }
  tenantConversations.set(key, {
    updatedAt: now,
    entries: next.slice(-MAX_HISTORY_TURNS),
  });
}

const VALID_KNOWLEDGE_CATEGORIES = new Set<MirrorBotKnowledgeCategory>([
  'product',
  'faq',
  'policy',
  'offer',
  'general',
]);
const VALID_KNOWLEDGE_SOURCES = new Set<MirrorBotKnowledgeSource>([
  'manual',
  'ai_structured',
  'ai_generated',
  'auto_learned',
]);
export const MAX_KNOWLEDGE_ITEMS = 30;

export function sanitizeKnowledgeItems(raw: unknown): MirrorBotKnowledgeItem[] {
  if (!Array.isArray(raw)) return [];
  const seenTitles = new Set<string>();
  const cleaned: MirrorBotKnowledgeItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const title = String(obj.title || '').trim().slice(0, 120);
    const content = String(obj.content || '').trim().slice(0, 500);
    if (!title || !content) continue;
    const normKey = title.toLowerCase().replace(/\s+/g, ' ');
    if (seenTitles.has(normKey)) continue;
    seenTitles.add(normKey);
    const rawCat = String(obj.category || 'general')
      .trim()
      .toLowerCase() as MirrorBotKnowledgeCategory;
    const rawSrc = String(obj.source || 'manual')
      .trim()
      .toLowerCase() as MirrorBotKnowledgeSource;
    cleaned.push({
      id:
        String(obj.id || '').trim().slice(0, 64) ||
        `kb_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
      title,
      category: VALID_KNOWLEDGE_CATEGORIES.has(rawCat) ? rawCat : 'general',
      content,
      source: VALID_KNOWLEDGE_SOURCES.has(rawSrc) ? rawSrc : 'manual',
      createdAt: String(obj.createdAt || new Date().toISOString()).slice(0, 64),
    });
    if (cleaned.length >= MAX_KNOWLEDGE_ITEMS) break;
  }
  return cleaned;
}

export function mergeKnowledgeItems(
  existing: MirrorBotKnowledgeItem[],
  incoming: MirrorBotKnowledgeItem[]
): { merged: MirrorBotKnowledgeItem[]; added: MirrorBotKnowledgeItem[] } {
  const base = sanitizeKnowledgeItems(existing);
  const existingKeys = new Set(base.map((i) => i.title.toLowerCase().replace(/\s+/g, ' ')));
  const added: MirrorBotKnowledgeItem[] = [];
  for (const item of sanitizeKnowledgeItems(incoming)) {
    const key = item.title.toLowerCase().replace(/\s+/g, ' ');
    if (!existingKeys.has(key)) {
      existingKeys.add(key);
      added.push(item);
    }
  }
  const merged = [...added, ...base].slice(0, MAX_KNOWLEDGE_ITEMS);
  return { merged, added };
}

export function createEmptyWorkspace(uid: string): MirrorBotWorkspaceRecord {
  return {
    uid,
    activatedInVault: true,
    businessName: 'My Business',
    workPoints: [],
    botName: 'Mirror Bot',
    autoReplyEnabled: true,
    knowledgeText: '',
    knowledgeItems: [],
    autoLearnKnowledge: true,
    updatedAt: new Date().toISOString(),
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

export async function verifyCallerAuth(
  authorizationHeader?: string
): Promise<VerifiedFirebaseToken | null> {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authorizationHeader.slice('Bearer '.length).trim();
  if (!token) return null;
  try {
    return await verifyFirebaseIdToken(token);
  } catch {
    return null;
  }
}

const OAUTH_SESSIONS_COLLECTION = 'mirrorbot_oauth_sessions';
const consumedStateNonces = new Map<string, number>();
const ephemeralFallbackSecret = crypto.randomBytes(32).toString('hex');

function getStateSigningSecret(): string {
  const secret = (process.env.META_APP_SECRET || '').trim();
  return secret || ephemeralFallbackSecret;
}

function safeEqualsString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function resolveAppBaseUrl(requestOrigin?: string): string {
  const cleanOrigin = (requestOrigin || '').trim().replace(/\/+$/, '');
  if (
    cleanOrigin &&
    /^https:\/\//i.test(cleanOrigin) &&
    !/^https:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(cleanOrigin)
  ) {
    return cleanOrigin;
  }
  const envUrl = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
  if (envUrl && /^https?:\/\//i.test(envUrl) && !envUrl.includes('MY_APP_URL')) {
    return envUrl;
  }
  if (cleanOrigin && /^https?:\/\//i.test(cleanOrigin)) {
    return cleanOrigin;
  }
  return 'https://mirrorbook.site';
}

export function resolveMetaCallbackUrl(requestOrigin?: string): string {
  return `${resolveAppBaseUrl(requestOrigin)}/api/mirrorbot/meta-callback`;
}

export function createOAuthState(
  uid: string,
  channel: MetaChannelType,
  redirectUri: string
): string {
  const now = Date.now();
  for (const [key, entry] of oauthStates.entries()) {
    if (now - entry.createdAt > STATE_TTL_MS) {
      oauthStates.delete(key);
    }
  }
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = {
    n: nonce,
    u: uid,
    c: channel,
    r: redirectUri,
    t: now,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getStateSigningSecret())
    .update(encodedPayload, 'utf8')
    .digest('base64url');
  const state = `${encodedPayload}.${sig}`;
  oauthStates.set(state, { uid, channel, redirectUri, createdAt: now });
  return state;
}

export function consumeOAuthState(state: string): MetaOAuthStateEntry | null {
  if (!state) return null;
  const now = Date.now();

  // Clean expired consumed nonces
  for (const [nonce, ts] of consumedStateNonces.entries()) {
    if (now - ts > STATE_TTL_MS) {
      consumedStateNonces.delete(nonce);
    }
  }

  // Fast path: in-memory state (local dev / warm serverless instance)
  const memEntry = oauthStates.get(state) || null;
  if (memEntry) {
    oauthStates.delete(state);
    if (now - memEntry.createdAt > STATE_TTL_MS) return null;
    return memEntry;
  }

  // Stateless HMAC-signed state verification (works across Vercel serverless cold starts)
  const parts = state.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, providedSig] = parts;
  if (!encodedPayload || !providedSig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getStateSigningSecret())
    .update(encodedPayload, 'utf8')
    .digest('base64url');
  if (!safeEqualsString(expectedSig, providedSig)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    const nonce = typeof parsed?.n === 'string' ? parsed.n : '';
    const uid = typeof parsed?.u === 'string' ? parsed.u : '';
    const channel = parsed?.c as MetaChannelType;
    const redirectUri = typeof parsed?.r === 'string' ? parsed.r : '';
    const createdAt = typeof parsed?.t === 'number' ? parsed.t : 0;

    if (!nonce || !uid || !redirectUri || !createdAt) return null;
    if (channel !== 'facebook' && channel !== 'messenger' && channel !== 'whatsapp') return null;
    if (now - createdAt > STATE_TTL_MS) return null;
    if (consumedStateNonces.has(nonce)) return null;

    consumedStateNonces.set(nonce, now);
    return { uid, channel, redirectUri, createdAt };
  } catch {
    return null;
  }
}

export async function createOAuthSession(params: {
  uid: string;
  channel: MetaChannelType;
  pages: DiscoveredFacebookPage[];
  whatsappNumbers: DiscoveredWhatsAppNumber[];
}): Promise<MetaOAuthSession> {
  const now = Date.now();
  for (const [key, sess] of oauthSessions.entries()) {
    if (now - sess.createdAt > SESSION_TTL_MS) {
      oauthSessions.delete(key);
    }
  }
  const session: MetaOAuthSession = {
    id: crypto.randomBytes(24).toString('hex'),
    uid: params.uid,
    channel: params.channel,
    createdAt: now,
    pages: params.pages,
    whatsappNumbers: params.whatsappNumbers,
  };
  oauthSessions.set(session.id, session);

  if (isFirebaseAdminConfigured()) {
    try {
      const store = createFirebaseAdminStore();
      await store.setDoc(OAUTH_SESSIONS_COLLECTION, session.id, {
        ...session,
        pages: session.pages.map((p) => ({
          ...p,
          accessToken: encryptSecretToken(p.accessToken) || '',
        })),
        whatsappNumbers: session.whatsappNumbers.map((w) => ({
          ...w,
          accessToken: encryptSecretToken(w.accessToken) || '',
        })),
      });
    } catch {
      // Non-fatal in local preview
    }
  }

  return session;
}

export async function getOAuthSession(sessionId: string): Promise<MetaOAuthSession | null> {
  if (!sessionId) return null;
  const now = Date.now();
  const memSess = oauthSessions.get(sessionId) || null;
  if (memSess) {
    if (now - memSess.createdAt > SESSION_TTL_MS) {
      oauthSessions.delete(sessionId);
      return null;
    }
    return memSess;
  }

  if (isFirebaseAdminConfigured()) {
    try {
      const store = createFirebaseAdminStore();
      const doc = await store.getDoc(OAUTH_SESSIONS_COLLECTION, sessionId);
      if (doc && typeof doc.uid === 'string' && typeof doc.createdAt === 'number') {
        if (now - doc.createdAt > SESSION_TTL_MS) {
          return null;
        }
        const restored: MetaOAuthSession = {
          id: sessionId,
          uid: doc.uid,
          channel: (doc.channel as MetaChannelType) || 'facebook',
          createdAt: doc.createdAt,
          pages: Array.isArray(doc.pages)
            ? doc.pages.map((p: any) => ({
                ...p,
                accessToken: decryptSecretToken(p?.accessToken) || '',
              }))
            : [],
          whatsappNumbers: Array.isArray(doc.whatsappNumbers)
            ? doc.whatsappNumbers.map((w: any) => ({
                ...w,
                accessToken: decryptSecretToken(w?.accessToken) || '',
              }))
            : [],
        };
        oauthSessions.set(sessionId, restored);
        return restored;
      }
    } catch {
      // Fallback to null
    }
  }

  return null;
}

function hydrateRecord(uid: string, doc: Record<string, any>): MirrorBotWorkspaceRecord {
  const base = createEmptyWorkspace(uid);
  const rawFb = doc.facebookPage || {};
  const rawWa = doc.whatsapp || {};
  return {
    ...base,
    ...doc,
    uid,
    activatedInVault: doc.activatedInVault !== false,
    workPoints: Array.isArray(doc.workPoints)
      ? doc.workPoints.map((p: unknown) => String(p).trim()).filter(Boolean).slice(0, 15)
      : base.workPoints,
    knowledgeText: typeof doc.knowledgeText === 'string' ? doc.knowledgeText.slice(0, 8000) : '',
    knowledgeItems: sanitizeKnowledgeItems(doc.knowledgeItems),
    autoLearnKnowledge: doc.autoLearnKnowledge !== false,
    facebookPage: {
      ...base.facebookPage,
      ...rawFb,
      pageAccessToken: decryptSecretToken(rawFb.pageAccessToken),
    },
    messenger: {
      ...base.messenger,
      ...(doc.messenger || {}),
    },
    whatsapp: {
      ...base.whatsapp,
      ...rawWa,
      accessToken: decryptSecretToken(rawWa.accessToken),
    },
  };
}

export async function getWorkspaceByUid(uid: string): Promise<MirrorBotWorkspaceRecord> {
  const now = Date.now();
  const cached = workspacesByUid.get(uid);
  const adminReady = isFirebaseAdminConfigured();
  if (cached && (!adminReady || now - cached.cachedAt < WORKSPACE_CACHE_TTL_MS)) {
    return cached.record;
  }

  if (adminReady) {
    try {
      const store = createFirebaseAdminStore();
      const doc = await store.getDoc(SECRETS_COLLECTION, uid);
      if (doc) {
        const hydrated = hydrateRecord(uid, doc);
        workspacesByUid.set(uid, { record: hydrated, cachedAt: now });
        if (hydrated.facebookPage.connected && hydrated.facebookPage.pageId) {
          pageRouteToUid.set(hydrated.facebookPage.pageId, uid);
        }
        if (hydrated.whatsapp.connected && hydrated.whatsapp.phoneNumberId) {
          whatsappRouteToUid.set(hydrated.whatsapp.phoneNumberId, uid);
        }
        return hydrated;
      }
    } catch {
      // Fallback cleanly to in-memory workspace
    }
  }

  if (cached) return cached.record;
  const fresh = createEmptyWorkspace(uid);
  workspacesByUid.set(uid, { record: fresh, cachedAt: now });
  return fresh;
}

export async function getChannelRouteOwner(
  type: 'page' | 'wa',
  channelId: string
): Promise<string | null> {
  const cleanId = String(channelId || '').trim();
  if (!cleanId) return null;

  const memMap = type === 'page' ? pageRouteToUid : whatsappRouteToUid;
  let ownerUid = memMap.get(cleanId) || '';

  if (!ownerUid && isFirebaseAdminConfigured()) {
    try {
      const store = createFirebaseAdminStore();
      const routeDoc = await store.getDoc(ROUTES_COLLECTION, `${type}_${cleanId}`);
      if (routeDoc && typeof routeDoc.uid === 'string' && routeDoc.uid.trim()) {
        ownerUid = routeDoc.uid.trim();
        memMap.set(cleanId, ownerUid);
      }
    } catch {
      // Fallback to in-memory scan below
    }
  }

  if (ownerUid) {
    const ws = await getWorkspaceByUid(ownerUid);
    const stillActive =
      type === 'page'
        ? (ws.facebookPage.connected && ws.facebookPage.pageId === cleanId) ||
          (ws.messenger.connected && ws.messenger.pageId === cleanId)
        : ws.whatsapp.connected && ws.whatsapp.phoneNumberId === cleanId;
    if (stillActive) return ownerUid;
    memMap.delete(cleanId);
    return null;
  }

  for (const { record: ws } of workspacesByUid.values()) {
    const match =
      type === 'page'
        ? (ws.facebookPage.connected && ws.facebookPage.pageId === cleanId) ||
          (ws.messenger.connected && ws.messenger.pageId === cleanId)
        : ws.whatsapp.connected && ws.whatsapp.phoneNumberId === cleanId;
    if (match) {
      memMap.set(cleanId, ws.uid);
      return ws.uid;
    }
  }

  return null;
}

export async function registerChannelRoute(
  type: 'page' | 'wa',
  channelId: string,
  uid: string
): Promise<void> {
  const cleanId = String(channelId || '').trim();
  if (!cleanId || !uid) return;

  if (type === 'page') {
    pageRouteToUid.set(cleanId, uid);
  } else {
    whatsappRouteToUid.set(cleanId, uid);
  }

  if (isFirebaseAdminConfigured()) {
    try {
      const store = createFirebaseAdminStore();
      const routeKey = `${type}_${cleanId}`;
      await store.setDoc(ROUTES_COLLECTION, routeKey, {
        routeKey,
        uid,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // Non-fatal in local preview
    }
  }
}

export async function unregisterChannelRoute(
  type: 'page' | 'wa',
  channelId: string
): Promise<void> {
  const cleanId = String(channelId || '').trim();
  if (!cleanId) return;

  if (type === 'page') {
    pageRouteToUid.delete(cleanId);
  } else {
    whatsappRouteToUid.delete(cleanId);
  }

  if (isFirebaseAdminConfigured()) {
    try {
      const store = createFirebaseAdminStore();
      const routeKey = `${type}_${cleanId}`;
      await store.setDoc(ROUTES_COLLECTION, routeKey, {
        routeKey,
        uid: '',
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // Non-fatal
    }
  }
}

export async function resolveWorkspaceByPageId(
  pageId: string
): Promise<MirrorBotWorkspaceRecord | null> {
  const cleanId = String(pageId || '').trim();
  if (!cleanId) return null;

  let uid = pageRouteToUid.get(cleanId) || '';

  if (!uid && isFirebaseAdminConfigured()) {
    try {
      const store = createFirebaseAdminStore();
      const routeDoc = await store.getDoc(ROUTES_COLLECTION, `page_${cleanId}`);
      if (routeDoc && typeof routeDoc.uid === 'string' && routeDoc.uid.trim()) {
        uid = routeDoc.uid.trim();
        pageRouteToUid.set(cleanId, uid);
      }
    } catch {
      // Fallback below
    }
  }

  if (uid) {
    const ws = await getWorkspaceByUid(uid);
    // Strict tenant-isolation check: confirm this workspace actually owns this pageId
    if (
      (ws.facebookPage.connected && ws.facebookPage.pageId === cleanId) ||
      (ws.messenger.connected && ws.messenger.pageId === cleanId)
    ) {
      return ws;
    }
    pageRouteToUid.delete(cleanId);
    return null;
  }

  // In-memory scan fallback
  for (const { record: ws } of workspacesByUid.values()) {
    if (
      (ws.facebookPage.connected && ws.facebookPage.pageId === cleanId) ||
      (ws.messenger.connected && ws.messenger.pageId === cleanId)
    ) {
      pageRouteToUid.set(cleanId, ws.uid);
      return ws;
    }
  }

  return null;
}

export async function resolveWorkspaceByWhatsAppPhoneId(
  phoneNumberId: string
): Promise<MirrorBotWorkspaceRecord | null> {
  const cleanId = String(phoneNumberId || '').trim();
  if (!cleanId) return null;

  let uid = whatsappRouteToUid.get(cleanId) || '';

  if (!uid && isFirebaseAdminConfigured()) {
    try {
      const store = createFirebaseAdminStore();
      const routeDoc = await store.getDoc(ROUTES_COLLECTION, `wa_${cleanId}`);
      if (routeDoc && typeof routeDoc.uid === 'string' && routeDoc.uid.trim()) {
        uid = routeDoc.uid.trim();
        whatsappRouteToUid.set(cleanId, uid);
      }
    } catch {
      // Fallback below
    }
  }

  if (uid) {
    const ws = await getWorkspaceByUid(uid);
    // Strict tenant-isolation check: confirm this workspace actually owns this WhatsApp phoneNumberId
    if (ws.whatsapp.connected && ws.whatsapp.phoneNumberId === cleanId) {
      return ws;
    }
    whatsappRouteToUid.delete(cleanId);
    return null;
  }

  for (const { record: ws } of workspacesByUid.values()) {
    if (ws.whatsapp.connected && ws.whatsapp.phoneNumberId === cleanId) {
      whatsappRouteToUid.set(cleanId, ws.uid);
      return ws;
    }
  }

  return null;
}

export async function saveWorkspaceByUid(
  uid: string,
  updater: (curr: MirrorBotWorkspaceRecord) => MirrorBotWorkspaceRecord
): Promise<MirrorBotWorkspaceRecord> {
  const current = await getWorkspaceByUid(uid);
  const next: MirrorBotWorkspaceRecord = {
    ...updater(current),
    uid,
    updatedAt: new Date().toISOString(),
  };
  workspacesByUid.set(uid, { record: next, cachedAt: Date.now() });

  if (next.facebookPage.connected && next.facebookPage.pageId) {
    await registerChannelRoute('page', next.facebookPage.pageId, uid);
  }
  if (next.whatsapp.connected && next.whatsapp.phoneNumberId) {
    await registerChannelRoute('wa', next.whatsapp.phoneNumberId, uid);
  }

  if (isFirebaseAdminConfigured()) {
    try {
      const store = createFirebaseAdminStore();
      // Encrypt access tokens at rest before writing to Firestore
      const persisted: MirrorBotWorkspaceRecord = {
        ...next,
        facebookPage: {
          ...next.facebookPage,
          pageAccessToken: encryptSecretToken(next.facebookPage.pageAccessToken),
        },
        whatsapp: {
          ...next.whatsapp,
          accessToken: encryptSecretToken(next.whatsapp.accessToken),
        },
      };
      await store.setDoc(SECRETS_COLLECTION, uid, persisted);
    } catch {
      // Keep in-memory state intact even if Admin Firestore is not set in local dev
    }
  }

  return next;
}

export async function appendAutoLearnedKnowledge(
  uid: string,
  candidate: {
    title: string;
    category?: string;
    content: string;
  }
): Promise<{ saved: MirrorBotKnowledgeItem | null; items: MirrorBotKnowledgeItem[] }> {
  const cleanTitle = String(candidate.title || '').trim().slice(0, 120);
  const cleanContent = String(candidate.content || '').trim().slice(0, 500);
  if (!cleanTitle || !cleanContent) {
    const curr = await getWorkspaceByUid(uid);
    return { saved: null, items: curr.knowledgeItems };
  }

  const rawCat = String(candidate.category || 'faq').trim().toLowerCase() as MirrorBotKnowledgeCategory;
  const newItem: MirrorBotKnowledgeItem = {
    id: `kb_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
    title: cleanTitle,
    category: VALID_KNOWLEDGE_CATEGORIES.has(rawCat) ? rawCat : 'faq',
    content: cleanContent,
    source: 'auto_learned',
    createdAt: new Date().toISOString(),
  };

  let savedItem: MirrorBotKnowledgeItem | null = null;
  const updated = await saveWorkspaceByUid(uid, (curr) => {
    const { merged, added } = mergeKnowledgeItems(curr.knowledgeItems, [newItem]);
    savedItem = added[0] || null;
    return {
      ...curr,
      knowledgeItems: merged,
    };
  });

  return { saved: savedItem, items: updated.knowledgeItems };
}

export async function syncOwnerFallbackWorkspace(data: {
  businessName?: string;
  botName?: string;
  workPoints?: string[];
  knowledgeText?: string;
  knowledgeItems?: MirrorBotKnowledgeItem[];
  autoLearnKnowledge?: boolean;
}): Promise<void> {
  await saveWorkspaceByUid('owner_fallback', (curr) => ({
    ...curr,
    businessName: data.businessName ? data.businessName.slice(0, 100) : curr.businessName,
    botName: data.botName ? data.botName.slice(0, 50) : curr.botName,
    workPoints: Array.isArray(data.workPoints) ? data.workPoints.slice(0, 15) : curr.workPoints,
    knowledgeText:
      typeof data.knowledgeText === 'string'
        ? data.knowledgeText.slice(0, 8000)
        : curr.knowledgeText,
    knowledgeItems: Array.isArray(data.knowledgeItems)
      ? sanitizeKnowledgeItems(data.knowledgeItems)
      : curr.knowledgeItems,
    autoLearnKnowledge:
      typeof data.autoLearnKnowledge === 'boolean'
        ? data.autoLearnKnowledge
        : curr.autoLearnKnowledge,
  }));
}

export async function getOwnerFallbackWorkspace(): Promise<MirrorBotWorkspaceRecord | null> {
  const rec = await getWorkspaceByUid('owner_fallback');
  const hasCustomData =
    Boolean(rec.knowledgeText.trim()) ||
    rec.knowledgeItems.length > 0 ||
    rec.workPoints.length > 0 ||
    (rec.businessName && rec.businessName !== 'My Business');
  return hasCustomData ? rec : null;
}

export function toSafeWorkspace(record: MirrorBotWorkspaceRecord): SafeMirrorBotWorkspace {
  return {
    uid: record.uid,
    activatedInVault: record.activatedInVault,
    businessName: record.businessName,
    workPoints: record.workPoints,
    botName: record.botName,
    autoReplyEnabled: record.autoReplyEnabled,
    knowledgeText: record.knowledgeText || '',
    knowledgeItems: sanitizeKnowledgeItems(record.knowledgeItems),
    autoLearnKnowledge: record.autoLearnKnowledge !== false,
    updatedAt: record.updatedAt,
    facebookPage: {
      connected: record.facebookPage.connected,
      pageId: record.facebookPage.pageId,
      pageName: record.facebookPage.pageName,
      pageCategory: record.facebookPage.pageCategory,
      connectedAt: record.facebookPage.connectedAt,
      webhookSubscribed: record.facebookPage.webhookSubscribed,
    },
    messenger: {
      connected: record.messenger.connected,
      pageId: record.messenger.pageId,
      pageName: record.messenger.pageName,
      connectedAt: record.messenger.connectedAt,
      webhookSubscribed: record.messenger.webhookSubscribed,
    },
    whatsapp: {
      connected: record.whatsapp.connected,
      wabaId: record.whatsapp.wabaId,
      phoneNumberId: record.whatsapp.phoneNumberId,
      displayPhone: record.whatsapp.displayPhone,
      verifiedName: record.whatsapp.verifiedName,
      connectedAt: record.whatsapp.connectedAt,
    },
  };
}

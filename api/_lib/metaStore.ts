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

export interface MirrorBotWorkspaceRecord {
  uid: string;
  activatedInVault: boolean;
  businessName: string;
  workPoints: string[];
  botName: string;
  autoReplyEnabled: boolean;
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
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

const oauthStates = new Map<string, MetaOAuthStateEntry>();
const oauthSessions = new Map<string, MetaOAuthSession>();
const workspacesByUid = new Map<string, MirrorBotWorkspaceRecord>();
const pageRouteToUid = new Map<string, string>();
const whatsappRouteToUid = new Map<string, string>();

export function createEmptyWorkspace(uid: string): MirrorBotWorkspaceRecord {
  return {
    uid,
    activatedInVault: true,
    businessName: 'My Business',
    workPoints: [],
    botName: 'Mirror Bot',
    autoReplyEnabled: true,
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

export function resolveAppBaseUrl(requestOrigin?: string): string {
  const envUrl = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
  if (envUrl && /^https?:\/\//i.test(envUrl) && !envUrl.includes('MY_APP_URL')) {
    return envUrl;
  }
  if (requestOrigin && /^https?:\/\//i.test(requestOrigin)) {
    return requestOrigin.replace(/\/+$/, '');
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
  const state = crypto.randomBytes(24).toString('hex');
  oauthStates.set(state, { uid, channel, redirectUri, createdAt: now });
  return state;
}

export function consumeOAuthState(state: string): MetaOAuthStateEntry | null {
  if (!state) return null;
  const entry = oauthStates.get(state) || null;
  oauthStates.delete(state);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > STATE_TTL_MS) return null;
  return entry;
}

export function createOAuthSession(params: {
  uid: string;
  channel: MetaChannelType;
  pages: DiscoveredFacebookPage[];
  whatsappNumbers: DiscoveredWhatsAppNumber[];
}): MetaOAuthSession {
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
  return session;
}

export function getOAuthSession(sessionId: string): MetaOAuthSession | null {
  if (!sessionId) return null;
  const sess = oauthSessions.get(sessionId) || null;
  if (!sess) return null;
  if (Date.now() - sess.createdAt > SESSION_TTL_MS) {
    oauthSessions.delete(sessionId);
    return null;
  }
  return sess;
}

function hydrateRecord(uid: string, doc: Record<string, any>): MirrorBotWorkspaceRecord {
  const base = createEmptyWorkspace(uid);
  return {
    ...base,
    ...doc,
    uid,
    activatedInVault: doc.activatedInVault !== false,
    workPoints: Array.isArray(doc.workPoints)
      ? doc.workPoints.map((p: unknown) => String(p).trim()).filter(Boolean).slice(0, 15)
      : base.workPoints,
    facebookPage: {
      ...base.facebookPage,
      ...(doc.facebookPage || {}),
    },
    messenger: {
      ...base.messenger,
      ...(doc.messenger || {}),
    },
    whatsapp: {
      ...base.whatsapp,
      ...(doc.whatsapp || {}),
    },
  };
}

export async function getWorkspaceByUid(uid: string): Promise<MirrorBotWorkspaceRecord> {
  const cached = workspacesByUid.get(uid);
  if (cached) return cached;

  if (isFirebaseAdminConfigured()) {
    try {
      const store = createFirebaseAdminStore();
      const doc = await store.getDoc(SECRETS_COLLECTION, uid);
      if (doc) {
        const hydrated = hydrateRecord(uid, doc);
        workspacesByUid.set(uid, hydrated);
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

  const fresh = createEmptyWorkspace(uid);
  workspacesByUid.set(uid, fresh);
  return fresh;
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
    return getWorkspaceByUid(uid);
  }

  // In-memory scan fallback
  for (const ws of workspacesByUid.values()) {
    if (ws.facebookPage.pageId === cleanId || ws.messenger.pageId === cleanId) {
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
    return getWorkspaceByUid(uid);
  }

  for (const ws of workspacesByUid.values()) {
    if (ws.whatsapp.phoneNumberId === cleanId) {
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
  workspacesByUid.set(uid, next);

  if (next.facebookPage.connected && next.facebookPage.pageId) {
    await registerChannelRoute('page', next.facebookPage.pageId, uid);
  }
  if (next.whatsapp.connected && next.whatsapp.phoneNumberId) {
    await registerChannelRoute('wa', next.whatsapp.phoneNumberId, uid);
  }

  if (isFirebaseAdminConfigured()) {
    try {
      const store = createFirebaseAdminStore();
      await store.setDoc(SECRETS_COLLECTION, uid, next);
    } catch {
      // Keep in-memory state intact even if Admin Firestore is not set in local dev
    }
  }

  return next;
}

export function toSafeWorkspace(record: MirrorBotWorkspaceRecord): SafeMirrorBotWorkspace {
  return {
    uid: record.uid,
    activatedInVault: record.activatedInVault,
    businessName: record.businessName,
    workPoints: record.workPoints,
    botName: record.botName,
    autoReplyEnabled: record.autoReplyEnabled,
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

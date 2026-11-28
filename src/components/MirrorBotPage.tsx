import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  Edit3,
  ExternalLink,
  Facebook,
  Image as ImageIcon,
  Loader2,
  Lock,
  MessageCircle,
  MessageSquare,
  Plus,
  Power,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlink,
  UserPlus,
  Users,
  Wand2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  AppUser,
  MirrorBotKnowledgeCategory,
  MirrorBotKnowledgeItem,
  MirrorBotKnowledgeSource,
  MirrorBotVaultWorkspace,
  isVerifiedAdminUser,
} from '../types';
import { MirrorBotAdminDiagnostics } from './MirrorBotAdminDiagnostics';
import {
  auth,
  activateMirrorBotInVault,
  saveMirrorBotKnowledgeToVault,
  saveMirrorBotWorkspaceToVault,
  syncMirrorBotChannelStatusToVault,
} from '../utils/firebase';
import { useLanguage } from '../utils/i18n';

export interface MirrorBotPageProps {
  user: AppUser | null;
  vaultWorkspace: MirrorBotVaultWorkspace | null;
  onNavigateHome: () => void;
  onStartProject?: () => void;
  onRequireSignUp: () => void;
  onRequireSignIn: () => void;
  onOpenVaultMirrorBot: () => void;
  embeddedInVault?: boolean;
  onSaveBusinessInfo?: (updates: {
    businessName: string;
    botName: string;
    workPoints: string[];
    autoReplyEnabled: boolean;
  }) => Promise<void>;
}

type MetaChannel = 'facebook' | 'messenger' | 'whatsapp';
type ChannelSyncScope = MetaChannel | 'all';

interface SafeBackendWorkspace {
  uid: string;
  activatedInVault: boolean;
  businessName: string;
  workPoints: string[];
  botName: string;
  autoReplyEnabled: boolean;
  knowledgeText?: string;
  knowledgeItems?: MirrorBotKnowledgeItem[];
  autoLearnKnowledge?: boolean;
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

interface PendingSelection {
  sessionId: string;
  channel: MetaChannel;
  pages: Array<{
    id: string;
    name: string;
    category: string;
    alreadyConnectedToOther?: boolean;
    alreadyConnectedToSelf?: boolean;
  }>;
  whatsappNumbers: Array<{
    wabaId: string;
    wabaName: string;
    phoneNumberId: string;
    displayPhone: string;
    verifiedName: string;
    alreadyConnectedToOther?: boolean;
    alreadyConnectedToSelf?: boolean;
  }>;
}

type ReplyLogChannel = 'messenger' | 'facebook_comment' | 'whatsapp' | 'web_test';

interface ReplyLogEntry {
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

interface RecipientSummary {
  senderId: string;
  senderName: string;
  channel: ReplyLogChannel;
  replyCount: number;
  lastRepliedAt: string;
  lastCustomerMessage: string;
  lastBotReply: string;
  lastStatus: 'sent' | 'failed';
}

interface ReplyActivitySummary {
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
}

const EMPTY_REPLY_SUMMARY: ReplyActivitySummary = {
  totalReplies: 0,
  sentCount: 0,
  failedCount: 0,
  uniqueRecipients: 0,
  byChannel: {
    messenger: 0,
    facebook_comment: 0,
    whatsapp: 0,
    web_test: 0,
  },
};

function formatReplyTimestamp(iso: string, isBangla: boolean): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 45) return isBangla ? 'এইমাত্র' : 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return isBangla ? `${diffMin} মি. আগে` : `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return isBangla ? `${diffHr} ঘণ্টা আগে` : `${diffHr}h ago`;
  return date.toLocaleString(isBangla ? 'bn-BD' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getInitialBadge(name: string): string {
  const cleaned = String(name || '').replace(/^\+/, '').trim();
  if (!cleaned) return 'C';
  return cleaned.charAt(0).toUpperCase();
}

async function getBearerHeaders(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  if (!currentUser) return {};
  const idToken = await currentUser.getIdToken();
  return { Authorization: `Bearer ${idToken}` };
}

export const MirrorBotPage: React.FC<MirrorBotPageProps> = ({
  user,
  vaultWorkspace,
  onNavigateHome,
  onRequireSignUp,
  onRequireSignIn,
  embeddedInVault = false,
  onSaveBusinessInfo,
}) => {
  const { isBn: isBangla, t } = useLanguage();
  const [backendWorkspace, setBackendWorkspace] = useState<SafeBackendWorkspace | null>(null);
  const [metaOAuthConfigured, setMetaOAuthConfigured] = useState<boolean | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [connectingChannel, setConnectingChannel] = useState<MetaChannel | null>(null);
  const [togglingAutoReply, setTogglingAutoReply] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedUrlKey, setCopiedUrlKey] = useState<string | null>(null);

  // Inline Business Info editor state (never navigates away from Mirror Bot overview)
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [editBusinessName, setEditBusinessName] = useState('');
  const [editBotName, setEditBotName] = useState('Mirror Bot');
  const [editWorkPoints, setEditWorkPoints] = useState<string[]>(['']);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [suggestingNames, setSuggestingNames] = useState(false);
  const [suggestedNames, setSuggestedNames] = useState<string[]>([]);

  // Business Data & AI Knowledge Integration state
  const [knowledgeText, setKnowledgeText] = useState('');
  const [knowledgeItems, setKnowledgeItems] = useState<MirrorBotKnowledgeItem[]>([]);
  const [autoLearnKnowledge, setAutoLearnKnowledge] = useState(true);
  const [knowledgeDirty, setKnowledgeDirty] = useState(false);
  const [savingKnowledge, setSavingKnowledge] = useState(false);
  const [structuringKnowledge, setStructuringKnowledge] = useState(false);
  const [generatingKnowledge, setGeneratingKnowledge] = useState(false);
  const [aiTopicFocus, setAiTopicFocus] = useState('');
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardCategory, setNewCardCategory] = useState<MirrorBotKnowledgeCategory>('product');
  const [newCardContent, setNewCardContent] = useState('');
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  // Auto-Reply Activity & Recent Replies state
  const [replyLogs, setReplyLogs] = useState<ReplyLogEntry[]>([]);
  const [recipients, setRecipients] = useState<RecipientSummary[]>([]);
  const [replySummary, setReplySummary] = useState<ReplyActivitySummary>(EMPTY_REPLY_SUMMARY);
  const [loadingReplies, setLoadingReplies] = useState(true);
  const [refreshingReplies, setRefreshingReplies] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState<'recent' | 'recipients'>('recent');
  const [channelFilter, setChannelFilter] = useState<'all' | ReplyLogChannel>('all');
  const [testSenderName, setTestSenderName] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testingReply, setTestingReply] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);

  const isOwnerAdmin = isVerifiedAdminUser(user);
  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'https://mirrorbook.site';
  const callbackUrl = `${currentOrigin}/api/mirrorbot/meta-callback`;
  const webhookUrl = `${currentOrigin}/api/mirrorbot/meta-webhook`;

  const handleCopySetupUrl = (value: string, key: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedUrlKey(key);
    setTimeout(() => setCopiedUrlKey(null), 2000);
  };

  // Channel-scoped merge prevents connecting Facebook/Messenger from ever resetting WhatsApp (and vice versa)
  const mergeBackendWorkspace = (
    incoming: SafeBackendWorkspace,
    scope: ChannelSyncScope | 'status'
  ) => {
    setBackendWorkspace((prev) => {
      if (!prev) return incoming;
      if (scope === 'facebook' || scope === 'messenger') {
        return {
          ...incoming,
          whatsapp: prev.whatsapp.connected && !incoming.whatsapp.connected ? prev.whatsapp : incoming.whatsapp,
        };
      }
      if (scope === 'whatsapp') {
        return {
          ...incoming,
          facebookPage:
            prev.facebookPage.connected && !incoming.facebookPage.connected
              ? prev.facebookPage
              : incoming.facebookPage,
          messenger:
            prev.messenger.connected && !incoming.messenger.connected
              ? prev.messenger
              : incoming.messenger,
        };
      }
      if (scope === 'status') {
        return {
          ...incoming,
          facebookPage:
            prev.facebookPage.connected && !incoming.facebookPage.connected
              ? prev.facebookPage
              : incoming.facebookPage,
          messenger:
            prev.messenger.connected && !incoming.messenger.connected
              ? prev.messenger
              : incoming.messenger,
          whatsapp:
            prev.whatsapp.connected && !incoming.whatsapp.connected ? prev.whatsapp : incoming.whatsapp,
        };
      }
      return incoming;
    });
  };

  // Channel-scoped Firestore Vault sync: NEVER overwrites untouched channels
  const persistSafeChannelMeta = async (ws: SafeBackendWorkspace, scope: ChannelSyncScope) => {
    if (!user?.uid) return;
    if (scope === 'facebook') {
      await syncMirrorBotChannelStatusToVault(user.uid, {
        autoReplyEnabled: ws.autoReplyEnabled,
        facebookPageConnected: ws.facebookPage.connected,
        facebookPageId: ws.facebookPage.pageId,
        facebookPageName: ws.facebookPage.pageName,
        messengerConnected: ws.messenger.connected,
      });
      return;
    }
    if (scope === 'messenger') {
      await syncMirrorBotChannelStatusToVault(user.uid, {
        autoReplyEnabled: ws.autoReplyEnabled,
        facebookPageConnected: ws.facebookPage.connected,
        facebookPageId: ws.facebookPage.pageId,
        facebookPageName: ws.facebookPage.pageName,
        messengerConnected: ws.messenger.connected,
      });
      return;
    }
    if (scope === 'whatsapp') {
      await syncMirrorBotChannelStatusToVault(user.uid, {
        autoReplyEnabled: ws.autoReplyEnabled,
        whatsappConnected: ws.whatsapp.connected,
        whatsappPhoneId: ws.whatsapp.phoneNumberId,
        whatsappDisplayPhone: ws.whatsapp.displayPhone,
      });
      return;
    }
    await syncMirrorBotChannelStatusToVault(user.uid, {
      autoReplyEnabled: ws.autoReplyEnabled,
      facebookPageConnected: ws.facebookPage.connected,
      facebookPageId: ws.facebookPage.pageId,
      facebookPageName: ws.facebookPage.pageName,
      messengerConnected: ws.messenger.connected,
      whatsappConnected: ws.whatsapp.connected,
      whatsappPhoneId: ws.whatsapp.phoneNumberId,
      whatsappDisplayPhone: ws.whatsapp.displayPhone,
    });
  };

  const fetchBackendStatus = async () => {
    if (!user || !auth.currentUser) {
      setLoadingStatus(false);
      return;
    }
    try {
      const headers = await getBearerHeaders();
      const res = await fetch('/api/mirrorbot/meta-status', {
        headers,
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        if (typeof data.metaOAuthConfigured === 'boolean') {
          setMetaOAuthConfigured(data.metaOAuthConfigured);
        }
        if (data.workspace) {
          mergeBackendWorkspace(data.workspace, 'status');
        }
      }
    } catch {
      // Keep Vault state visible
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchBackendKnowledge = async () => {
    if (!user || !auth.currentUser) return;
    try {
      const headers = await getBearerHeaders();
      if (!headers.Authorization) return;
      const res = await fetch('/api/mirrorbot/knowledge', {
        headers,
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        if (typeof data.knowledgeText === 'string' && !knowledgeDirty) {
          setKnowledgeText((prev) => (prev ? prev : data.knowledgeText));
        }
        if (Array.isArray(data.knowledgeItems) && data.knowledgeItems.length > 0) {
          setKnowledgeItems((prev) => (prev.length >= data.knowledgeItems.length ? prev : data.knowledgeItems));
        }
        if (typeof data.autoLearnKnowledge === 'boolean') {
          setAutoLearnKnowledge(data.autoLearnKnowledge);
        }
      }
    } catch {
      // Vault Firestore remains primary source
    }
  };

  const fetchReplyActivity = async (silent = false) => {
    if (!user || !auth.currentUser) {
      setLoadingReplies(false);
      return;
    }
    if (!silent) setRefreshingReplies(true);
    try {
      const headers = await getBearerHeaders();
      if (!headers.Authorization) return;
      const res = await fetch('/api/mirrorbot/meta-replies', {
        headers,
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setReplyLogs(Array.isArray(data.logs) ? data.logs : []);
        setRecipients(Array.isArray(data.recipients) ? data.recipients : []);
        if (data.summary) setReplySummary(data.summary);
      }
    } catch {
      // Keep last known activity visible
    } finally {
      setLoadingReplies(false);
      setRefreshingReplies(false);
    }
  };

  // Hydrate Knowledge & Inline Business Editor from Firestore Vault
  useEffect(() => {
    if (!vaultWorkspace) return;
    if (!isEditingBusiness) {
      setEditBusinessName(vaultWorkspace.businessName || '');
      setEditBotName(vaultWorkspace.botName || 'Mirror Bot');
      setEditWorkPoints(
        vaultWorkspace.workPoints && vaultWorkspace.workPoints.length > 0
          ? vaultWorkspace.workPoints
          : ['']
      );
    }
    if (!knowledgeDirty) {
      setKnowledgeText(vaultWorkspace.knowledgeText || '');
    }
    if (Array.isArray(vaultWorkspace.knowledgeItems)) {
      setKnowledgeItems(vaultWorkspace.knowledgeItems);
    }
    if (typeof vaultWorkspace.autoLearnKnowledge === 'boolean') {
      setAutoLearnKnowledge(vaultWorkspace.autoLearnKnowledge);
    }
  }, [
    vaultWorkspace?.businessName,
    vaultWorkspace?.botName,
    vaultWorkspace?.knowledgeText,
    vaultWorkspace?.autoLearnKnowledge,
    JSON.stringify(vaultWorkspace?.workPoints || []),
    JSON.stringify(vaultWorkspace?.knowledgeItems || []),
  ]);

  // Ensure signed-in user has Mirror Bot activated in Vault & load channel status + knowledge + reply activity
  useEffect(() => {
    if (!embeddedInVault) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (!user) {
      setLoadingStatus(false);
      setLoadingReplies(false);
      return;
    }
    activateMirrorBotInVault(user.uid, user.company || user.displayName).catch(() => {});
    fetchBackendStatus();
    fetchBackendKnowledge();
    fetchReplyActivity(true);

    const pollId = window.setInterval(() => {
      fetchReplyActivity(true);
    }, 15000);

    return () => window.clearInterval(pollId);
  }, [user?.uid]);

  // Keep backend live-webhook workspace synced with latest Vault business info + integrated data
  useEffect(() => {
    if (!user || !auth.currentUser || !vaultWorkspace) return;
    let cancelled = false;
    (async () => {
      try {
        const headers = await getBearerHeaders();
        if (cancelled || !headers.Authorization) return;
        await fetch('/api/mirrorbot/meta-connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({
            action: 'save_profile',
            businessName: vaultWorkspace.businessName,
            botName: vaultWorkspace.botName,
            workPoints: vaultWorkspace.workPoints,
            autoReplyEnabled: vaultWorkspace.autoReplyEnabled,
            knowledgeText: vaultWorkspace.knowledgeText || '',
            knowledgeItems: vaultWorkspace.knowledgeItems || [],
            autoLearnKnowledge: vaultWorkspace.autoLearnKnowledge !== false,
          }),
        });
      } catch {
        // Silent background sync
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    user?.uid,
    vaultWorkspace?.businessName,
    vaultWorkspace?.botName,
    vaultWorkspace?.autoReplyEnabled,
    vaultWorkspace?.knowledgeText,
    vaultWorkspace?.autoLearnKnowledge,
    JSON.stringify(vaultWorkspace?.workPoints || []),
    JSON.stringify(vaultWorkspace?.knowledgeItems || []),
  ]);

  // Listen for Meta OAuth popup callback
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin || '';
      const isTrusted =
        origin === window.location.origin ||
        origin.endsWith('.run.app') ||
        origin.includes('localhost') ||
        origin.includes('mirrorbook.site');
      if (!isTrusted) return;

      const payload = event.data;
      if (!payload || typeof payload !== 'object') return;

      if (payload.type === 'MIRRORBOT_META_OAUTH_ERROR') {
        setConnectingChannel(null);
        setNotice({
          type: 'error',
          text: String(
            payload.error ||
              t(
                'Could not complete login. Please try again.',
                'লগইন সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
              )
          ),
        });
        return;
      }

      if (payload.type === 'MIRRORBOT_META_OAUTH_SUCCESS') {
        setConnectingChannel(null);
        const channel = payload.channel as MetaChannel;
        const pages = Array.isArray(payload.pages) ? payload.pages : [];
        const whatsappNumbers = Array.isArray(payload.whatsappNumbers)
          ? payload.whatsappNumbers
          : [];

        if (payload.autoConnected) {
          setPendingSelection(null);
          if (payload.workspace) {
            mergeBackendWorkspace(payload.workspace, channel);
            await persistSafeChannelMeta(payload.workspace, channel);
          } else {
            fetchBackendStatus();
          }
          setNotice({
            type: 'success',
            text: t(
              'Connected! Mirror Bot is now automatically replying using your integrated business data.',
              'কানেক্ট সফল হয়েছে! মিরর বট এখন আপনার ইন্টিগ্রেটেড ব্যবসার ডাটা থেকে অটোমেটিক রিপ্লাই দিচ্ছে।'
            ),
          });
          return;
        }

        if ((channel === 'facebook' || channel === 'messenger') && pages.length === 0) {
          setNotice({
            type: 'error',
            text: t(
              'No managed Facebook Pages were found on this account.',
              'এই ফেসবুক অ্যাকাউন্টে কোনো ম্যানেজড পেজ পাওয়া যায়নি।'
            ),
          });
          return;
        }

        if (channel === 'whatsapp' && whatsappNumbers.length === 0) {
          setNotice({
            type: 'error',
            text: t(
              'No WhatsApp Business numbers were found on this Meta account.',
              'এই মেটা অ্যাকাউন্টে কোনো হোয়াটসঅ্যাপ বিজনেস নম্বর পাওয়া যায়নি।'
            ),
          });
          return;
        }

        setPendingSelection({
          sessionId: String(payload.sessionId || ''),
          channel,
          pages,
          whatsappNumbers,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user?.uid]);

  const handleConnectChannel = async (channel: MetaChannel) => {
    if (!user || !auth.currentUser) {
      onRequireSignUp();
      return;
    }

    setConnectingChannel(channel);
    setNotice(null);
    try {
      const headers = await getBearerHeaders();
      const res = await fetch(
        `/api/mirrorbot/meta-oauth-url?channel=${encodeURIComponent(channel)}`,
        { headers, cache: 'no-store' }
      );
      const data = await res.json().catch(() => null);

      if (!data?.configured || !data?.url) {
        setConnectingChannel(null);
        setNotice({
          type: 'error',
          text:
            data?.error ||
            t(
              'Facebook & WhatsApp direct login is not active yet. Please contact MirrorBook support.',
              'ফেসবুক ও হোয়াটসঅ্যাপ ডিরেক্ট লগইন এখনো অ্যাক্টিভ হয়নি। মিরর বুক সাপোর্টে যোগাযোগ করুন।'
            ),
        });
        return;
      }

      const popup = window.open(
        data.url,
        `mirrorbot_meta_${channel}`,
        'width=620,height=720,scrollbars=yes'
      );

      if (!popup) {
        setConnectingChannel(null);
        setNotice({
          type: 'error',
          text: t(
            'Your browser blocked the login popup. Please allow popups and try again.',
            'আপনার ব্রাউজার লগইন পপআপ ব্লক করেছে। পপআপ অ্যালাউ করে আবার চেষ্টা করুন।'
          ),
        });
        return;
      }

      const pollTimer = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(pollTimer);
          setConnectingChannel((curr) => (curr === channel ? null : curr));
        }
      }, 600);
    } catch (err: any) {
      setConnectingChannel(null);
      setNotice({
        type: 'error',
        text: err?.message || t('Unable to start login right now.', 'এই মুহূর্তে লগইন শুরু করা যায়নি।'),
      });
    }
  };

  const handleSelectPage = async (pageId: string) => {
    if (!pendingSelection || !auth.currentUser) return;
    setConnectingChannel(pendingSelection.channel);
    setNotice(null);
    try {
      const headers = await getBearerHeaders();
      const res = await fetch('/api/mirrorbot/meta-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          action: 'connect_page',
          sessionId: pendingSelection.sessionId,
          pageId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(
          data?.error ||
            t('Could not connect Facebook Page.', 'ফেসবুক পেজ কানেক্ট করা যায়নি।')
        );
      }
      if (data.workspace) {
        mergeBackendWorkspace(data.workspace, 'facebook');
        await persistSafeChannelMeta(data.workspace, 'facebook');
      }
      setPendingSelection(null);
      setNotice({
        type: 'success',
        text: t(
          'Facebook Page & Messenger connected! Your WhatsApp connection remains untouched.',
          'ফেসবুক পেজ ও মেসেঞ্জার কানেক্ট হয়েছে! আপনার হোয়াটসঅ্যাপ কানেকশন অক্ষুণ্ণ রয়েছে।'
        ),
      });
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: err?.message || t('Failed to connect Page.', 'পেজ কানেক্ট ব্যর্থ হয়েছে।'),
      });
    } finally {
      setConnectingChannel(null);
    }
  };

  const handleSelectWhatsApp = async (phoneNumberId: string) => {
    if (!pendingSelection || !auth.currentUser) return;
    setConnectingChannel('whatsapp');
    setNotice(null);
    try {
      const headers = await getBearerHeaders();
      const res = await fetch('/api/mirrorbot/meta-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          action: 'connect_whatsapp',
          sessionId: pendingSelection.sessionId,
          phoneNumberId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(
          data?.error ||
            t('Could not connect WhatsApp number.', 'হোয়াটসঅ্যাপ নম্বর কানেক্ট করা যায়নি।')
        );
      }
      if (data.workspace) {
        mergeBackendWorkspace(data.workspace, 'whatsapp');
        await persistSafeChannelMeta(data.workspace, 'whatsapp');
      }
      setPendingSelection(null);
      setNotice({
        type: 'success',
        text: t(
          'WhatsApp Business connected! Your Facebook Page & Messenger remain untouched.',
          'হোয়াটসঅ্যাপ বিজনেস কানেক্ট হয়েছে! আপনার ফেসবুক পেজ ও মেসেঞ্জার অক্ষুণ্ণ রয়েছে।'
        ),
      });
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: err?.message || t('Failed to connect WhatsApp.', 'হোয়াটসঅ্যাপ কানেক্ট ব্যর্থ হয়েছে।'),
      });
    } finally {
      setConnectingChannel(null);
    }
  };

  const handleDisconnect = async (channel: MetaChannel) => {
    if (!auth.currentUser || !user?.uid) return;
    setNotice(null);
    try {
      const headers = await getBearerHeaders();
      const res = await fetch('/api/mirrorbot/meta-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ action: 'disconnect', channel }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.workspace) {
        if (channel === 'whatsapp') {
          setBackendWorkspace((prev) =>
            prev
              ? {
                  ...prev,
                  whatsapp: data.workspace.whatsapp,
                }
              : data.workspace
          );
          await syncMirrorBotChannelStatusToVault(user.uid, {
            whatsappConnected: false,
            whatsappPhoneId: '',
            whatsappDisplayPhone: '',
          });
        } else if (channel === 'messenger') {
          setBackendWorkspace((prev) =>
            prev
              ? {
                  ...prev,
                  messenger: data.workspace.messenger,
                }
              : data.workspace
          );
          await syncMirrorBotChannelStatusToVault(user.uid, {
            messengerConnected: false,
          });
        } else {
          setBackendWorkspace((prev) =>
            prev
              ? {
                  ...prev,
                  facebookPage: data.workspace.facebookPage,
                  messenger: data.workspace.messenger,
                }
              : data.workspace
          );
          await syncMirrorBotChannelStatusToVault(user.uid, {
            facebookPageConnected: false,
            facebookPageId: '',
            facebookPageName: '',
            messengerConnected: false,
          });
        }
        setNotice({
          type: 'success',
          text: t('Channel disconnected.', 'চ্যানেল ডিসকানেক্ট করা হয়েছে।'),
        });
      }
    } catch {
      setNotice({
        type: 'error',
        text: t('Could not disconnect channel.', 'চ্যানেল ডিসকানেক্ট করা যায়নি।'),
      });
    }
  };

  const handleToggleAutoReply = async () => {
    if (!user || !auth.currentUser || togglingAutoReply) return;
    setTogglingAutoReply(true);
    try {
      const currentVal =
        vaultWorkspace?.autoReplyEnabled ?? backendWorkspace?.autoReplyEnabled ?? true;
      const nextVal = !currentVal;
      const headers = await getBearerHeaders();
      const res = await fetch('/api/mirrorbot/meta-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ action: 'toggle_autoreply', enabled: nextVal }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.workspace) {
        mergeBackendWorkspace(data.workspace, 'status');
      }
      await syncMirrorBotChannelStatusToVault(user.uid, { autoReplyEnabled: nextVal });
    } finally {
      setTogglingAutoReply(false);
    }
  };

  // Inline Business Info editor handlers
  const handleStartEditBusiness = () => {
    setEditBusinessName(
      vaultWorkspace?.businessName || backendWorkspace?.businessName || ''
    );
    setEditBotName(vaultWorkspace?.botName || backendWorkspace?.botName || 'Mirror Bot');
    const existingPts =
      vaultWorkspace?.workPoints && vaultWorkspace.workPoints.length > 0
        ? vaultWorkspace.workPoints
        : backendWorkspace?.workPoints || [];
    setEditWorkPoints(existingPts.length > 0 ? existingPts : ['']);
    setSuggestedNames([]);
    setIsEditingBusiness(true);
  };

  const handleSuggestBotNames = async () => {
    setSuggestingNames(true);
    try {
      const cleanedPoints = editWorkPoints.map((p) => p.trim()).filter(Boolean);
      const res = await fetch('/api/mirrorbot/suggest-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: editBusinessName.trim() || 'My Business',
          whatYouSell: cleanedPoints.join(', '),
          language: isBangla ? 'bn' : 'en',
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data?.suggestions) && data.suggestions.length > 0) {
        const names = data.suggestions
          .map((item: unknown) =>
            typeof item === 'string'
              ? item.trim()
              : item && typeof item === 'object' && 'name' in item
                ? String((item as { name?: unknown }).name || '').trim()
                : ''
          )
          .filter(Boolean)
          .slice(0, 4);
        setSuggestedNames(
          names.length > 0 ? names : ['Mirror AI', 'Smart Desk', 'Quick Reply', 'Brand Helper']
        );
      } else {
        setSuggestedNames(['Mirror AI', 'Smart Desk', 'Quick Reply', 'Brand Helper']);
      }
    } catch {
      setSuggestedNames(['Mirror AI', 'Smart Desk', 'Quick Reply', 'Brand Helper']);
    } finally {
      setSuggestingNames(false);
    }
  };

  const handleSaveInlineBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || savingBusiness) return;
    const cleanedBusiness = editBusinessName.trim();
    if (!cleanedBusiness) {
      setNotice({
        type: 'error',
        text: t('Please enter your business name.', 'অনুগ্রহ করে আপনার ব্যবসার নাম লিখুন।'),
      });
      return;
    }
    const cleanedBot = editBotName.trim() || 'Mirror Bot';
    const cleanedPoints = editWorkPoints.map((p) => p.trim()).filter(Boolean).slice(0, 8);
    const currentAutoReply =
      vaultWorkspace?.autoReplyEnabled ?? backendWorkspace?.autoReplyEnabled ?? true;

    setSavingBusiness(true);
    setNotice(null);
    try {
      if (onSaveBusinessInfo) {
        await onSaveBusinessInfo({
          businessName: cleanedBusiness,
          botName: cleanedBot,
          workPoints: cleanedPoints,
          autoReplyEnabled: currentAutoReply,
        });
      } else {
        await saveMirrorBotWorkspaceToVault(user.uid, {
          businessName: cleanedBusiness,
          botName: cleanedBot,
          workPoints: cleanedPoints,
          autoReplyEnabled: currentAutoReply,
        });
        const headers = await getBearerHeaders();
        if (headers.Authorization) {
          await fetch('/api/mirrorbot/meta-connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({
              action: 'save_profile',
              businessName: cleanedBusiness,
              botName: cleanedBot,
              workPoints: cleanedPoints,
              autoReplyEnabled: currentAutoReply,
              knowledgeText,
              knowledgeItems,
              autoLearnKnowledge,
            }),
          });
        }
      }
      setIsEditingBusiness(false);
      setNotice({
        type: 'success',
        text: t(
          'Business info saved and synced live to all connected channels!',
          'ব্যবসার তথ্য সংরক্ষণ হয়েছে এবং সব লাইভ চ্যানেলে সিঙ্ক হয়ে গেছে!'
        ),
      });
    } catch (err: any) {
      setNotice({
        type: 'error',
        text:
          err?.message ||
          t('Unable to save business info right now.', 'ব্যবসার তথ্য সংরক্ষণ করা যায়নি।'),
      });
    } finally {
      setSavingBusiness(false);
    }
  };

  // Business Data & AI Knowledge Integration handlers
  const handleSaveIntegratedData = async (
    nextText = knowledgeText,
    nextItems = knowledgeItems,
    nextAutoLearn = autoLearnKnowledge,
    successMsg?: string
  ) => {
    if (!user || !auth.currentUser) return;
    setSavingKnowledge(true);
    setNotice(null);
    try {
      await saveMirrorBotKnowledgeToVault(user.uid, {
        knowledgeText: nextText,
        knowledgeItems: nextItems,
        autoLearnKnowledge: nextAutoLearn,
      });

      const headers = await getBearerHeaders();
      const res = await fetch('/api/mirrorbot/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          action: 'save',
          knowledgeText: nextText,
          knowledgeItems: nextItems,
          autoLearnKnowledge: nextAutoLearn,
          businessName: vaultWorkspace?.businessName || backendWorkspace?.businessName || 'My Business',
          botName: vaultWorkspace?.botName || backendWorkspace?.botName || 'Mirror Bot',
          workPoints:
            vaultWorkspace?.workPoints && vaultWorkspace.workPoints.length > 0
              ? vaultWorkspace.workPoints
              : backendWorkspace?.workPoints || [],
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        if (Array.isArray(data.knowledgeItems)) {
          setKnowledgeItems(data.knowledgeItems);
        }
        setKnowledgeDirty(false);
        setNotice({
          type: 'success',
          text:
            successMsg ||
            t(
              'Business data integrated! Mirror Bot will now reply live directly from this data.',
              'ব্যবসার ডাটা ইন্টিগ্রেট হয়ে গেছে! মিরর বট এখন সরাসরি এই ডাটা থেকেই লাইভ রিপ্লাই দেবে।'
            ),
        });
      } else {
        setKnowledgeDirty(false);
        setNotice({
          type: 'success',
          text: t(
            'Business data saved to your Vault and synced.',
            'ব্যবসার ডাটা আপনার ভল্টে সংরক্ষণ হয়েছে।'
          ),
        });
      }
    } catch {
      setNotice({
        type: 'error',
        text: t('Could not save business data right now.', 'ব্যবসার ডাটা সংরক্ষণ করা যায়নি।'),
      });
    } finally {
      setSavingKnowledge(false);
    }
  };

  const handleToggleAutoLearn = async () => {
    const nextVal = !autoLearnKnowledge;
    setAutoLearnKnowledge(nextVal);
    await handleSaveIntegratedData(
      knowledgeText,
      knowledgeItems,
      nextVal,
      nextVal
        ? t(
            'Auto-Learn ON: Mirror Bot will automatically save useful new business answers.',
            'অটো-লার্ন চালু: মিরর বট লাইভ চ্যাট থেকে প্রয়োজনীয় নতুন ডাটা নিজেই শিখে সেভ করবে।'
          )
        : t(
            'Auto-Learn paused: Mirror Bot will strictly use your saved data only.',
            'অটো-লার্ন বন্ধ: মিরর বট শুধু আপনার সেভ করা ডাটা থেকেই রিপ্লাই দেবে।'
          )
    );
  };

  const handleStructureFromData = async () => {
    if (!user || !auth.currentUser || structuringKnowledge) return;
    if (!knowledgeText.trim()) {
      setNotice({
        type: 'error',
        text: t(
          'Paste your business data, prices, or FAQs in the box first.',
          'আগে উপরের বক্সে আপনার ব্যবসার তথ্য, প্রাইস বা সাধারণ প্রশ্নগুলো পেস্ট করুন।'
        ),
      });
      return;
    }

    setStructuringKnowledge(true);
    setNotice(null);
    try {
      const headers = await getBearerHeaders();
      const res = await fetch('/api/mirrorbot/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          action: 'structure_from_data',
          knowledgeText,
          knowledgeItems,
          autoLearnKnowledge,
          businessName: vaultWorkspace?.businessName || backendWorkspace?.businessName || 'My Business',
          botName: vaultWorkspace?.botName || backendWorkspace?.botName || 'Mirror Bot',
          workPoints:
            vaultWorkspace?.workPoints && vaultWorkspace.workPoints.length > 0
              ? vaultWorkspace.workPoints
              : backendWorkspace?.workPoints || [],
          language: isBangla ? 'bn' : 'en',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(
          data?.error ||
            t('Could not structure data right now.', 'এই মুহূর্তে ডাটা সাজানো যায়নি।')
        );
      }

      const nextItems: MirrorBotKnowledgeItem[] = Array.isArray(data.knowledgeItems)
        ? data.knowledgeItems
        : knowledgeItems;
      setKnowledgeItems(nextItems);
      setKnowledgeDirty(false);
      await saveMirrorBotKnowledgeToVault(user.uid, {
        knowledgeText,
        knowledgeItems: nextItems,
        autoLearnKnowledge,
      });

      const addedCount = Array.isArray(data.generatedItems) ? data.generatedItems.length : 0;
      setNotice({
        type: 'success',
        text: isBangla
          ? `আপনার ডাটা থেকে ${addedCount}টি লাইভ নলেজ কার্ড তৈরি ও ইন্টিগ্রেট হয়েছে!`
          : `Extracted and integrated ${addedCount} live knowledge cards from your business data!`,
      });
    } catch (err: any) {
      setNotice({
        type: 'error',
        text:
          err?.message ||
          t('Could not extract knowledge cards.', 'নলেজ কার্ড তৈরি করা যায়নি।'),
      });
    } finally {
      setStructuringKnowledge(false);
    }
  };

  const handleAiGenerateNewData = async () => {
    if (!user || !auth.currentUser || generatingKnowledge) return;
    setGeneratingKnowledge(true);
    setNotice(null);
    try {
      const headers = await getBearerHeaders();
      const res = await fetch('/api/mirrorbot/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          action: 'ai_generate_new',
          topic: aiTopicFocus.trim(),
          knowledgeText,
          knowledgeItems,
          autoLearnKnowledge,
          businessName: vaultWorkspace?.businessName || backendWorkspace?.businessName || 'My Business',
          botName: vaultWorkspace?.botName || backendWorkspace?.botName || 'Mirror Bot',
          workPoints:
            vaultWorkspace?.workPoints && vaultWorkspace.workPoints.length > 0
              ? vaultWorkspace.workPoints
              : backendWorkspace?.workPoints || [],
          language: isBangla ? 'bn' : 'en',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(
          data?.error ||
            t('Could not generate new AI data right now.', 'এআই দিয়ে নতুন ডাটা তৈরি করা যায়নি।')
        );
      }

      const nextItems: MirrorBotKnowledgeItem[] = Array.isArray(data.knowledgeItems)
        ? data.knowledgeItems
        : knowledgeItems;
      setKnowledgeItems(nextItems);
      setAiTopicFocus('');
      await saveMirrorBotKnowledgeToVault(user.uid, {
        knowledgeText,
        knowledgeItems: nextItems,
        autoLearnKnowledge,
      });

      const addedCount = Array.isArray(data.generatedItems) ? data.generatedItems.length : 0;
      setNotice({
        type: 'success',
        text: isBangla
          ? `মিরর বট নিজে থেকে ${addedCount}টি নতুন লাইভ নলেজ ডাটা তৈরি করে ইন্টিগ্রেট করেছে!`
          : `Mirror Bot generated and integrated ${addedCount} new live knowledge cards!`,
      });
    } catch (err: any) {
      setNotice({
        type: 'error',
        text:
          err?.message ||
          t('Could not generate new knowledge cards.', 'নতুন নলেজ ডাটা তৈরি করা যায়নি।'),
      });
    } finally {
      setGeneratingKnowledge(false);
    }
  };

  const handleAddManualCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const title = newCardTitle.trim();
    const content = newCardContent.trim();
    if (!title || !content) return;

    const newItem: MirrorBotKnowledgeItem = {
      id: `kb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: title.slice(0, 100),
      category: newCardCategory,
      content: content.slice(0, 500),
      source: 'manual',
      createdAt: new Date().toISOString(),
    };

    const nextItems = [newItem, ...knowledgeItems].slice(0, 30);
    setKnowledgeItems(nextItems);
    setNewCardTitle('');
    setNewCardContent('');
    setShowAddCardForm(false);

    await handleSaveIntegratedData(
      knowledgeText,
      nextItems,
      autoLearnKnowledge,
      t('New live knowledge card added!', 'নতুন লাইভ নলেজ কার্ড যোগ করা হয়েছে!')
    );
  };

  const handleDeleteKnowledgeItem = async (itemId: string) => {
    if (!user || !auth.currentUser || deletingCardId) return;
    setDeletingCardId(itemId);
    try {
      const nextItems = knowledgeItems.filter((item) => item.id !== itemId);
      setKnowledgeItems(nextItems);
      await saveMirrorBotKnowledgeToVault(user.uid, {
        knowledgeText,
        knowledgeItems: nextItems,
        autoLearnKnowledge,
      });
      const headers = await getBearerHeaders();
      await fetch('/api/mirrorbot/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ action: 'delete_item', itemId }),
      });
    } finally {
      setDeletingCardId(null);
    }
  };

  const handleSendTestAutoReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser || testingReply) return;
    const trimmedMessage = testMessage.trim();
    if (!trimmedMessage) return;

    setTestingReply(true);
    setNotice(null);
    try {
      const headers = await getBearerHeaders();
      const res = await fetch('/api/mirrorbot/meta-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          action: 'test_reply',
          senderName: testSenderName.trim() || (isBangla ? 'টেস্ট কাস্টমার' : 'Test Customer'),
          message: trimmedMessage,
          businessName: vaultWorkspace?.businessName || backendWorkspace?.businessName || 'My Business',
          botName: vaultWorkspace?.botName || backendWorkspace?.botName || 'Mirror Bot',
          workPoints:
            vaultWorkspace?.workPoints && vaultWorkspace.workPoints.length > 0
              ? vaultWorkspace.workPoints
              : backendWorkspace?.workPoints || [],
          knowledgeText,
          knowledgeItems,
          autoLearnKnowledge,
        }),
      });
      const data = await res.json().catch(() => null);
      if (Array.isArray(data?.logs)) setReplyLogs(data.logs);
      if (Array.isArray(data?.recipients)) setRecipients(data.recipients);
      if (data?.summary) setReplySummary(data.summary);

      if (data?.newlyLearnedItem && Array.isArray(data?.knowledgeItems)) {
        setKnowledgeItems(data.knowledgeItems);
        saveMirrorBotKnowledgeToVault(user.uid, {
          knowledgeText,
          knowledgeItems: data.knowledgeItems,
          autoLearnKnowledge,
        }).catch(() => {});
      }

      if (!res.ok || !data?.success) {
        setNotice({
          type: 'error',
          text:
            data?.error ||
            t(
              'Could not generate auto-reply right now. Please try again.',
              'এই মুহূর্তে অটো-রিপ্লাই তৈরি করা যায়নি। আবার চেষ্টা করুন।'
            ),
        });
      } else {
        setTestMessage('');
        setActiveActivityTab('recent');
        setChannelFilter('all');
        setNotice({
          type: 'success',
          text: data?.newlyLearnedItem
            ? t(
                'Auto-reply sent and Mirror Bot auto-learned a new knowledge card!',
                'অটো-রিপ্লাই তৈরি হয়েছে এবং মিরর বট নতুন একটি নলেজ ডাটা নিজেই শিখে সেভ করেছে!'
              )
            : t(
                'Auto-reply generated from your live data and recorded below!',
                'আপনার লাইভ ডাটা থেকে অটো-রিপ্লাই তৈরি হয়েছে এবং নিচে রেকর্ড করা হয়েছে!'
              ),
        });
      }
    } catch {
      setNotice({
        type: 'error',
        text: t(
          'Network error while testing auto-reply.',
          'অটো-রিপ্লাই টেস্ট করার সময় নেটওয়ার্ক সমস্যা হয়েছে।'
        ),
      });
    } finally {
      setTestingReply(false);
    }
  };

  const handleClearReplyLogs = async () => {
    if (!user || !auth.currentUser || clearingLogs) return;
    setClearingLogs(true);
    setNotice(null);
    try {
      const headers = await getBearerHeaders();
      const res = await fetch('/api/mirrorbot/meta-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ action: 'clear_logs' }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setReplyLogs(Array.isArray(data.logs) ? data.logs : []);
        setRecipients(Array.isArray(data.recipients) ? data.recipients : []);
        setReplySummary(data.summary || EMPTY_REPLY_SUMMARY);
        setConfirmingClear(false);
        setNotice({
          type: 'success',
          text: t('Auto-reply history cleared.', 'অটো-রিপ্লাই হিস্ট্রি মুছে ফেলা হয়েছে।'),
        });
      }
    } catch {
      setNotice({
        type: 'error',
        text: t('Could not clear reply history.', 'রিপ্লাই হিস্ট্রি মুছে ফেলা যায়নি।'),
      });
    } finally {
      setClearingLogs(false);
    }
  };

  // Unauthenticated gate
  if (!user) {
    return (
      <div className="min-h-[75vh] bg-[#0B0D0C] text-[#F5F7F2] px-4 py-12 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#121614] p-6 sm:p-8 space-y-6">
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A1AAA2] transition-colors hover:text-[#B7F34A] cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>{t('Back to MirrorBook', 'মিরর বুকে ফিরে যান')}</span>
          </button>

          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#B7F34A]/35 bg-[#0B0D0C] p-1.5 shrink-0">
              <img
                src="/mirrorbot-icon.png"
                alt="Mirror Bot"
                width={48}
                height={48}
                loading="eager"
                decoding="async"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-[#F5F7F2]">
                {t('Mirror Bot', 'মিরর বট')}
              </h1>
              <p className="text-xs text-[#B7F34A] font-medium">
                {t(
                  'AI Automation for Business Owners',
                  'ব্যবসা মালিকদের জন্য এআই অটোমেশন'
                )}
              </p>
            </div>
          </div>

          <p className="text-sm text-[#D4DBD5] leading-relaxed">
            {t(
              'Create your MirrorBook account to unlock Mirror Bot in your personal Vault. Once added, connect your Facebook Page & WhatsApp in one click and feed your business data—your AI bot replies automatically 24/7.',
              'আপনার ব্যক্তিগত ভল্টে মিরর বট যোগ করতে মিরর বুক অ্যাকাউন্ট তৈরি করুন। অ্যাকাউন্ট করার পর ১ ক্লিকে ফেসবুক বা হোয়াটসঅ্যাপ কানেক্ট করুন এবং ব্যবসার ডাটা দিন—আপনার এআই বট ২৪/৭ অটোমেটিক রিপ্লাই দেবে।'
            )}
          </p>

          <ul className="space-y-2 text-xs text-[#A1AAA2]">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#B7F34A] shrink-0" />
              <span>
                {t(
                  'One-click Facebook Page, Messenger & WhatsApp login (1 page per account)',
                  '১-ক্লিকে ফেসবুক পেজ, মেসেঞ্জার ও হোয়াটসঅ্যাপ লগইন (প্রতি অ্যাকাউন্টে ১টি পেজ)'
                )}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Database size={14} className="text-[#B7F34A] shrink-0" />
              <span>
                {t(
                  'Live Business Data integration + AI auto-generated knowledge base',
                  'সরাসরি ব্যবসার ডাটা ইন্টিগ্রেশন এবং এআই দিয়ে অটো-জেনারেটেড নলেজ'
                )}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-[#B7F34A] shrink-0" />
              <span>
                {t(
                  'Full overview of replies, contacts, and settings inside your Vault',
                  'আপনার ভল্ট থেকেই সব রিপ্লাই, কাস্টমার ও সেটিংসের ফুল ওভারভিউ'
                )}
              </span>
            </li>
          </ul>

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={onRequireSignUp}
              className="w-full min-h-[46px] rounded-xl glossy-btn py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus size={15} />
              <span>{t('Create Account & Add to Vault', 'অ্যাকাউন্ট তৈরি করে ভল্টে যোগ করুন')}</span>
            </button>
            <button
              type="button"
              onClick={onRequireSignIn}
              className="w-full min-h-[44px] rounded-xl border border-white/[0.12] bg-[#0B0D0C] py-2.5 text-xs font-semibold text-[#D4DBD5] hover:border-[#B7F34A]/50 hover:text-[#F5F7F2] transition-colors cursor-pointer"
            >
              {t('Already have an account? Sign In', 'আগে থেকেই অ্যাকাউন্ট আছে? সাইন ইন করুন')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Merge Firestore Vault state (source of truth for business info) & live backend channel status
  const activeBusinessName =
    vaultWorkspace?.businessName || backendWorkspace?.businessName || 'My Business';
  const activeBotName = vaultWorkspace?.botName || backendWorkspace?.botName || 'Mirror Bot';
  const activeWorkPoints =
    vaultWorkspace?.workPoints && vaultWorkspace.workPoints.length > 0
      ? vaultWorkspace.workPoints
      : backendWorkspace?.workPoints || [];
  const autoReplyEnabled =
    vaultWorkspace?.autoReplyEnabled ?? backendWorkspace?.autoReplyEnabled ?? true;

  const fbConnected = Boolean(
    backendWorkspace?.facebookPage.connected || vaultWorkspace?.facebookPageConnected
  );
  const fbLabel =
    backendWorkspace?.facebookPage.pageName || vaultWorkspace?.facebookPageName || 'Connected Page';

  const msgConnected = Boolean(
    backendWorkspace?.messenger.connected || vaultWorkspace?.messengerConnected
  );
  const msgLabel =
    backendWorkspace?.messenger.pageName || vaultWorkspace?.facebookPageName || 'Connected Inbox';

  const waConnected = Boolean(
    backendWorkspace?.whatsapp.connected || vaultWorkspace?.whatsappConnected
  );
  const waLabel =
    backendWorkspace?.whatsapp.displayPhone ||
    backendWorkspace?.whatsapp.verifiedName ||
    vaultWorkspace?.whatsappDisplayPhone ||
    'Connected WhatsApp';

  const connectedChannelsCount =
    (fbConnected ? 1 : 0) + (msgConnected ? 1 : 0) + (waConnected ? 1 : 0);

  const channelCards: Array<{
    key: MetaChannel;
    name: string;
    capability: string;
    connected: boolean;
    connectedLabel: string;
    ctaLabel: string;
    icon: React.ReactNode;
    accentClass: string;
  }> = [
    {
      key: 'facebook',
      name: t('Facebook Page', 'ফেসবুক পেজ'),
      capability: t(
        'Auto-replies to post comments & commented photos',
        'পোস্টের কমেন্ট ও কমেন্টের ছবি দেখে অটো-রিপ্লাই দেয়'
      ),
      connected: fbConnected,
      connectedLabel: fbLabel,
      ctaLabel: t('Login with Facebook', 'ফেসবুকে লগইন করুন'),
      icon: <Facebook size={18} />,
      accentClass: 'text-[#60A5FA] bg-[#60A5FA]/10 border-[#60A5FA]/25',
    },
    {
      key: 'messenger',
      name: t('Messenger', 'মেসেঞ্জার'),
      capability: t(
        'Auto-replies to inbox messages & product photos',
        'ইনবক্স মেসেজ ও পণ্যের ছবি দেখে অটো-রিপ্লাই দেয়'
      ),
      connected: msgConnected,
      connectedLabel: msgLabel,
      ctaLabel: t('Connect Messenger', 'মেসেঞ্জার কানেক্ট করুন'),
      icon: <MessageSquare size={18} />,
      accentClass: 'text-[#A78BFA] bg-[#A78BFA]/10 border-[#A78BFA]/25',
    },
    {
      key: 'whatsapp',
      name: t('WhatsApp', 'হোয়াটসঅ্যাপ'),
      capability: t(
        'Auto-replies to WhatsApp chats & product photos',
        'হোয়াটসঅ্যাপ চ্যাট ও পণ্যের ছবি দেখে অটো-রিপ্লাই দেয়'
      ),
      connected: waConnected,
      connectedLabel: waLabel,
      ctaLabel: t('Connect WhatsApp', 'হোয়াটসঅ্যাপ কানেক্ট করুন'),
      icon: <MessageCircle size={18} />,
      accentClass: 'text-[#4ADE80] bg-[#4ADE80]/10 border-[#4ADE80]/25',
    },
  ];

  const getCategoryLabel = (cat: MirrorBotKnowledgeCategory) => {
    switch (cat) {
      case 'product':
        return t('Product / Price', 'পণ্য / দাম');
      case 'faq':
        return t('FAQ', 'সাধারণ প্রশ্ন');
      case 'policy':
        return t('Policy / Delivery', 'পলিসি / ডেলিভারি');
      case 'offer':
        return t('Offer', 'অফার');
      default:
        return t('General', 'সাধারণ তথ্য');
    }
  };

  const getSourceMeta = (src: MirrorBotKnowledgeSource) => {
    switch (src) {
      case 'ai_generated':
        return {
          label: t('AI Generated', 'এআই জেনারেটেড'),
          cls: 'border-[#A78BFA]/35 bg-[#A78BFA]/10 text-[#C4B5FD]',
        };
      case 'ai_structured':
        return {
          label: t('Structured', 'ডাটা থেকে সাজানো'),
          cls: 'border-[#60A5FA]/35 bg-[#60A5FA]/10 text-[#93C5FD]',
        };
      case 'auto_learned':
        return {
          label: t('Auto-Learned', 'অটো-লার্নড'),
          cls: 'border-[#B7F34A]/35 bg-[#B7F34A]/10 text-[#B7F34A]',
        };
      default:
        return {
          label: t('Your Data', 'আপনার ডাটা'),
          cls: 'border-white/[0.12] bg-white/[0.04] text-[#D4DBD5]',
        };
    }
  };

  const innerContent = (
    <div className={embeddedInVault ? 'space-y-6' : 'mx-auto max-w-5xl space-y-6'}>
      {/* Studio Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.09] pb-5">
        <div className="space-y-2">
          {!embeddedInVault && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A1AAA2] transition-colors hover:text-[#B7F34A] cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>{t('Back to MirrorBook', 'মিরর বুকে ফিরে যান')}</span>
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#B7F34A]/30 bg-[#121614] p-1.5 shrink-0">
              <img
                src="/mirrorbot-icon.png"
                alt="Mirror Bot"
                width={44}
                height={44}
                loading="eager"
                decoding="async"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#F5F7F2]">
                  {t('Mirror Bot Studio', 'মিরর বট স্টুডিও')}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-md border border-[#B7F34A]/30 bg-[#B7F34A]/10 px-2 py-0.5 text-[10px] font-bold text-[#B7F34A]">
                  <ShieldCheck size={11} />
                  <span>{t('Full Overview', 'ফুল ওভারভিউ')}</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#A1AAA2]">
                {t(
                  'Manage business info, connect channels, integrate live business data, and monitor every auto-reply in one place.',
                  'ব্যবসার তথ্য, চ্যানেল কানেকশন, লাইভ ডাটা ইন্টিগ্রেশন এবং সব অটো-রিপ্লাই এক জায়গা থেকেই নিয়ন্ত্রণ করুন।'
                )}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleAutoReply}
          disabled={togglingAutoReply}
          className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
            autoReplyEnabled
              ? 'border-[#B7F34A]/45 bg-[#B7F34A]/15 text-[#B7F34A]'
              : 'border-white/[0.12] bg-[#121614] text-[#A1AAA2]'
          }`}
        >
          <Power size={14} />
          <span>
            {t('Auto-Reply', 'অটো-রিপ্লাই')}: {autoReplyEnabled ? t('ON', 'চালু') : t('OFF', 'বন্ধ')}
          </span>
        </button>
      </div>

      {/* Studio KPI Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/[0.08] bg-[#121614] px-4 py-3">
          <span className="text-[11px] text-[#707A72] block">
            {t('Live Channels', 'লাইভ চ্যানেল')}
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-display text-xl font-bold text-[#F5F7F2] tabular-nums">
              {connectedChannelsCount}/3
            </span>
            <span className="text-[10px] font-semibold text-[#B7F34A]">
              {connectedChannelsCount > 0 ? t('Active', 'সক্রিয়') : t('Ready', 'প্রস্তুত')}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#121614] px-4 py-3">
          <span className="text-[11px] text-[#707A72] block">
            {t('Integrated Data Cards', 'ইন্টিগ্রেটেড ডাটা কার্ড')}
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-display text-xl font-bold text-[#B7F34A] tabular-nums">
              {knowledgeItems.length}
            </span>
            <span className="text-[10px] text-[#A1AAA2]">
              {knowledgeText.trim() ? t('+ Raw Notes', '+ নোট যুক্ত') : t('Live Brain', 'লাইভ ডাটা')}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#121614] px-4 py-3">
          <span className="text-[11px] text-[#707A72] block">
            {t('Total Auto-Replies', 'মোট অটো-রিপ্লাই')}
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-display text-xl font-bold text-[#F5F7F2] tabular-nums">
              {replySummary.totalReplies}
            </span>
            <span className="text-[10px] text-[#B7F34A]">
              {replySummary.sentCount} {t('sent', 'সফল')}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#121614] px-4 py-3">
          <span className="text-[11px] text-[#707A72] block">
            {t('People Replied To', 'কাস্টমার রিপ্লাই')}
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-display text-xl font-bold text-[#F5F7F2] tabular-nums">
              {replySummary.uniqueRecipients}
            </span>
            <span className="text-[10px] text-[#A1AAA2]">
              {t('Contacts', 'জন')}
            </span>
          </div>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {notice && (
        <div
          className={`flex items-start justify-between gap-2.5 rounded-xl border px-4 py-3 text-xs ${
            notice.type === 'error'
              ? 'border-red-500/40 bg-red-950/35 text-red-200'
              : 'border-[#B7F34A]/40 bg-[#B7F34A]/10 text-[#E5F9C2]'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {notice.type === 'error' ? (
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
            ) : (
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#B7F34A]" />
            )}
            <span className="leading-relaxed">{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-[#A1AAA2] hover:text-[#F5F7F2] shrink-0 cursor-pointer"
            aria-label="Close notice"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Owner-Only Meta Setup Checklist */}
      {isOwnerAdmin && metaOAuthConfigured === false && (
        <div className="rounded-2xl border border-amber-400/35 bg-amber-500/[0.06] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-300">
              <Wrench size={16} />
              <h2 className="font-display text-sm sm:text-base font-bold">
                {t(
                  'Owner Setup Required: Activate 1-Click Meta Login',
                  'ওনার সেটআপ: ১-ক্লিক মেটা লগইন চালু করুন'
                )}
              </h2>
            </div>
            <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">
              {t('Admin Only', 'শুধুমাত্র অ্যাডমিন')}
            </span>
          </div>

          <p className="text-xs text-[#D4DBD5] leading-relaxed">
            {t(
              'Add META_APP_ID, META_APP_SECRET, and META_WEBHOOK_VERIFY_TOKEN in your server Environment Variables (AI Studio Secrets / Vercel), and paste these two URLs inside Meta for Developers so all business customers can connect with 1 click:',
              'আপনার সার্ভার এনভায়রনমেন্ট ভেরিয়েবলে (AI Studio Secrets / Vercel) META_APP_ID, META_APP_SECRET এবং META_WEBHOOK_VERIFY_TOKEN সেট করুন এবং Meta for Developers-এ নিচের দুটি URL বসান:'
            )}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.09] bg-[#0B0D0C] p-3 space-y-1.5">
              <span className="text-[11px] font-semibold text-[#B7F34A] block">
                Valid OAuth Redirect URI
              </span>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate text-[11px] font-mono text-[#F5F7F2]">
                  {callbackUrl}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopySetupUrl(callbackUrl, 'cb')}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/[0.12] bg-[#171C19] px-2.5 py-1 text-[11px] font-semibold text-[#F5F7F2] hover:border-[#B7F34A]/50 cursor-pointer shrink-0"
                >
                  {copiedUrlKey === 'cb' ? (
                    <Check size={12} className="text-[#B7F34A]" />
                  ) : (
                    <Copy size={12} />
                  )}
                  <span>{copiedUrlKey === 'cb' ? t('Copied', 'কপি হয়েছে') : t('Copy', 'কপি')}</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.09] bg-[#0B0D0C] p-3 space-y-1.5">
              <span className="text-[11px] font-semibold text-[#B7F34A] block">
                Webhook Callback URL
              </span>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate text-[11px] font-mono text-[#F5F7F2]">
                  {webhookUrl}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopySetupUrl(webhookUrl, 'wh')}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/[0.12] bg-[#171C19] px-2.5 py-1 text-[11px] font-semibold text-[#F5F7F2] hover:border-[#B7F34A]/50 cursor-pointer shrink-0"
                >
                  {copiedUrlKey === 'wh' ? (
                    <Check size={12} className="text-[#B7F34A]" />
                  ) : (
                    <Copy size={12} />
                  )}
                  <span>{copiedUrlKey === 'wh' ? t('Copied', 'কপি হয়েছে') : t('Copy', 'কপি')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Account Picker with Duplicate Page / 1-Page-Per-Account Enforcement */}
      {pendingSelection && (
        <div className="rounded-2xl border border-[#B7F34A]/45 bg-[#121614] p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-[#F5F7F2]">
                {t('Select 1 account to connect', 'কানেক্ট করার জন্য ১টি অ্যাকাউন্ট নির্বাচন করুন')}
              </h2>
              <p className="text-[11px] text-[#A1AAA2]">
                {t(
                  'Each Google/MirrorBook account can connect 1 Facebook Page and 1 WhatsApp number. Pages already connected elsewhere are locked.',
                  'প্রতিটি জিমেইল অ্যাকাউন্টে ১টি ফেসবুক পেজ ও ১টি হোয়াটসঅ্যাপ নম্বর কানেক্ট করা যাবে। আগে থেকে অন্য অ্যাকাউন্টে কানেক্ট থাকা পেজ লক থাকবে।'
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingSelection(null)}
              className="text-xs text-[#A1AAA2] hover:text-[#F5F7F2] cursor-pointer"
            >
              {t('Cancel', 'বাতিল')}
            </button>
          </div>

          {pendingSelection.channel === 'whatsapp' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pendingSelection.whatsappNumbers.map((wa) => {
                const locked = Boolean(wa.alreadyConnectedToOther);
                return (
                  <button
                    key={wa.phoneNumberId}
                    type="button"
                    disabled={locked}
                    onClick={() => !locked && handleSelectWhatsApp(wa.phoneNumberId)}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      locked
                        ? 'border-red-500/35 bg-red-950/20 opacity-80 cursor-not-allowed'
                        : 'border-white/[0.1] bg-[#0B0D0C] hover:border-[#B7F34A] cursor-pointer'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F5F7F2] truncate">
                        {wa.verifiedName}
                      </p>
                      <p className="text-xs text-[#A1AAA2] font-mono">{wa.displayPhone}</p>
                      {locked && (
                        <p className="text-[11px] text-red-300 mt-1">
                          {t(
                            'Already connected to another Mirror Bot account. Try another number.',
                            'এই নম্বরটি ইতিমধ্যে অন্য অ্যাকাউন্টে কানেক্ট আছে। অন্য নম্বর চেষ্টা করুন।'
                          )}
                        </p>
                      )}
                    </div>
                    {locked ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-red-500/40 bg-red-950/40 px-2 py-1 text-[10px] font-bold text-red-300 shrink-0">
                        <Lock size={10} />
                        <span>{t('In Use', 'কানেক্ট আছে')}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-[#B7F34A] shrink-0">
                        {wa.alreadyConnectedToSelf
                          ? t('Reconnect', 'রিকানেক্ট')
                          : t('Connect', 'কানেক্ট')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pendingSelection.pages.map((page) => {
                const locked = Boolean(page.alreadyConnectedToOther);
                return (
                  <button
                    key={page.id}
                    type="button"
                    disabled={locked}
                    onClick={() => !locked && handleSelectPage(page.id)}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      locked
                        ? 'border-red-500/35 bg-red-950/20 opacity-80 cursor-not-allowed'
                        : 'border-white/[0.1] bg-[#0B0D0C] hover:border-[#B7F34A] cursor-pointer'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F5F7F2] truncate">{page.name}</p>
                      {page.category && (
                        <p className="text-xs text-[#A1AAA2] truncate">{page.category}</p>
                      )}
                      {locked && (
                        <p className="text-[11px] text-red-300 mt-1">
                          {t(
                            'Already connected to another Mirror Bot account. Try another page.',
                            'এই পেজটি ইতিমধ্যে অন্য অ্যাকাউন্টে কানেক্ট আছে। এটি দিয়ে সম্ভব নয় — অন্য পেজ চেষ্টা করুন।'
                          )}
                        </p>
                      )}
                    </div>
                    {locked ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-red-500/40 bg-red-950/40 px-2 py-1 text-[10px] font-bold text-red-300 shrink-0">
                        <Lock size={10} />
                        <span>{t('In Use', 'কানেক্ট আছে')}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-[#B7F34A] shrink-0">
                        {page.alreadyConnectedToSelf
                          ? t('Reconnect', 'রিকানেক্ট')
                          : t('Connect', 'কানেক্ট')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main 2-Column Workspace: Business Info (Inline Editable) + Connect Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Business Profile (Inline View & Edit — Never Hides Overview) */}
        <div className="lg:col-span-5 rounded-2xl border border-white/[0.09] bg-[#121614] p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <img
                src="/mirrorbot-icon.png"
                alt="Mirror Bot"
                width={24}
                height={24}
                loading="eager"
                decoding="async"
                className="h-6 w-6 rounded-md object-contain shrink-0"
              />
              <h2 className="font-display text-lg font-bold text-[#F5F7F2]">
                {t('Business Info', 'ব্যবসার তথ্য')}
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md border border-[#B7F34A]/30 bg-[#B7F34A]/10 px-2 py-0.5 text-[10px] font-bold text-[#B7F34A]">
              <Lock size={10} />
              <span>{t('Vault Synced', 'ভল্টে সিঙ্কড')}</span>
            </span>
          </div>

          {!isEditingBusiness ? (
            <>
              <div className="space-y-3">
                <div className="rounded-xl border border-white/[0.08] bg-[#0B0D0C] px-3.5 py-3">
                  <span className="block text-[11px] text-[#707A72]">
                    {t('Business', 'ব্যবসার নাম')}
                  </span>
                  <p className="text-sm font-semibold text-[#F5F7F2] mt-0.5 break-words">
                    {activeBusinessName}
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#0B0D0C] px-3.5 py-3">
                  <span className="block text-[11px] text-[#707A72]">
                    {t('AI Bot Name', 'এআই বটের নাম')}
                  </span>
                  <p className="text-sm font-semibold text-[#B7F34A] mt-0.5 break-words">
                    {activeBotName}
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#0B0D0C] px-3.5 py-3 space-y-2">
                  <span className="block text-[11px] text-[#707A72]">
                    {t('What you work with', 'আপনি কী নিয়ে কাজ করেন')}
                  </span>
                  {activeWorkPoints.length === 0 ? (
                    <p className="text-xs text-[#A1AAA2]">
                      {t(
                        'No business points added yet. Click edit below to add your products & services.',
                        'এখনো ব্যবসার পয়েন্ট যোগ করা হয়নি। নিচে এডিট বাটনে ক্লিক করে পণ্য ও সার্ভিস যোগ করুন।'
                      )}
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {activeWorkPoints.map((pt, idx) => (
                        <li
                          key={`${pt}-${idx}`}
                          className="flex items-start gap-2 text-xs text-[#D4DBD5]"
                        >
                          <span className="text-[#B7F34A] font-bold">•</span>
                          <span className="break-words">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartEditBusiness}
                className="w-full min-h-[44px] rounded-xl glossy-btn py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit3 size={14} />
                <span>{t('Edit Business Info', 'ব্যবসার তথ্য এডিট করুন')}</span>
              </button>
            </>
          ) : (
            <form onSubmit={handleSaveInlineBusiness} className="space-y-4">
              <div>
                <label className="block text-[11px] text-[#A1AAA2] mb-1 font-medium">
                  {t('Business Name *', 'ব্যবসার নাম *')}
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={editBusinessName}
                  onChange={(e) => setEditBusinessName(e.target.value)}
                  placeholder="e.g. Dhaka Sneaker House"
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0B0D0C] px-3.5 py-2.5 text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:border-[#B7F34A] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-[#A1AAA2] font-medium">
                    {t('AI Bot Name', 'এআই বটের নাম')}
                  </label>
                  <button
                    type="button"
                    onClick={handleSuggestBotNames}
                    disabled={suggestingNames}
                    className="text-[11px] text-[#B7F34A] hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
                  >
                    {suggestingNames ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <Wand2 size={11} />
                    )}
                    <span>{t('Suggest', 'সাজেশন')}</span>
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={60}
                  value={editBotName}
                  onChange={(e) => setEditBotName(e.target.value)}
                  placeholder="Mirror Bot"
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0B0D0C] px-3.5 py-2.5 text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:border-[#B7F34A] focus:outline-none"
                />
                {suggestedNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {suggestedNames.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setEditBotName(name)}
                        className="rounded-lg border border-white/[0.1] bg-[#0B0D0C] hover:border-[#B7F34A]/50 px-2 py-1 text-[11px] text-[#D4DBD5] cursor-pointer"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-[#A1AAA2] font-medium">
                    {t('What you work with', 'আপনি কী নিয়ে কাজ করেন')}
                  </label>
                  {editWorkPoints.length < 8 && (
                    <button
                      type="button"
                      onClick={() => setEditWorkPoints((prev) => [...prev, ''])}
                      className="text-[11px] text-[#B7F34A] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>{t('Add Point', 'পয়েন্ট যোগ')}</span>
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {editWorkPoints.map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={140}
                        value={pt}
                        onChange={(e) => {
                          const next = [...editWorkPoints];
                          next[idx] = e.target.value;
                          setEditWorkPoints(next);
                        }}
                        placeholder={
                          idx === 0
                            ? t('e.g. Premium sneakers (৳1,500–৳4,500)', 'যেমন: প্রিমিয়াম স্নিকার্স (৳১,৫০০–৳৪,৫০০)')
                            : t('e.g. Cash on delivery across BD', 'যেমন: সারাদেশে ক্যাশ অন ডেলিভারি')
                        }
                        className="flex-1 rounded-xl border border-white/[0.1] bg-[#0B0D0C] px-3 py-2 text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:border-[#B7F34A] focus:outline-none"
                      />
                      {editWorkPoints.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditWorkPoints((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-1.5 text-[#707A72] hover:text-red-400 cursor-pointer"
                          aria-label="Remove point"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={savingBusiness}
                  className="flex-1 min-h-[42px] rounded-xl glossy-btn py-2.5 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {savingBusiness ? (
                    <Loader2 size={13} className="animate-spin text-black" />
                  ) : (
                    <Save size={13} />
                  )}
                  <span>{savingBusiness ? t('Saving...', 'সেভ হচ্ছে...') : t('Save Info', 'সেভ করুন')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBusiness(false)}
                  className="min-h-[42px] rounded-xl border border-white/[0.12] bg-[#0B0D0C] px-4 py-2.5 text-xs font-semibold text-[#A1AAA2] hover:text-[#F5F7F2] cursor-pointer"
                >
                  {t('Cancel', 'বাতিল')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right: Zero-Friction One-Click Channel Connection */}
        <div className="lg:col-span-7 rounded-2xl border border-white/[0.09] bg-[#121614] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-[#F5F7F2]">
                {t('Connect Channels', 'চ্যানেল কানেক্ট করুন')}
              </h2>
              <p className="text-[11px] text-[#A1AAA2] mt-0.5">
                {t(
                  '1 Facebook Page & 1 WhatsApp per Google account · Independent connections',
                  'প্রতি জিমেইল অ্যাকাউন্টে ১টি ফেসবুক পেজ ও ১টি হোয়াটসঅ্যাপ · আলাদা আলাদা কানেক্ট থাকবে'
                )}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.1] bg-[#0B0D0C] px-2.5 py-1 text-[10px] font-semibold text-[#D4DBD5]">
              <ShieldCheck size={11} className="text-[#B7F34A]" />
              <span>{t('1 Page Lock', '১-পেজ লক সুরক্ষিত')}</span>
            </span>
          </div>

          <div className="space-y-3">
            {channelCards.map((ch) => {
              const isBusy = connectingChannel === ch.key;
              return (
                <div
                  key={ch.key}
                  className={`rounded-xl border p-4 transition-colors ${
                    ch.connected
                      ? 'border-[#B7F34A]/35 bg-[#0B0D0C]'
                      : 'border-white/[0.09] bg-[#0B0D0C]/80'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${ch.accentClass}`}
                      >
                        {ch.icon}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#F5F7F2]">{ch.name}</h3>
                        <p className="text-xs text-[#A1AAA2] truncate">
                          {ch.connected ? (
                            <span className="text-[#B7F34A] font-medium">
                              {t('Live', 'লাইভ')} · {ch.connectedLabel}
                            </span>
                          ) : (
                            ch.capability
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {ch.connected ? (
                        <button
                          type="button"
                          onClick={() => handleDisconnect(ch.key)}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/[0.12] bg-[#171C19] px-3.5 py-2 text-xs font-semibold text-[#A1AAA2] hover:border-red-500/40 hover:text-red-300 cursor-pointer"
                        >
                          <Unlink size={13} />
                          <span>{t('Disconnect', 'ডিসকানেক্ট')}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConnectChannel(ch.key)}
                          disabled={isBusy || loadingStatus}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl glossy-btn px-4 py-2 text-xs font-bold cursor-pointer disabled:opacity-60"
                        >
                          {isBusy ? (
                            <>
                              <Loader2 size={13} className="animate-spin text-black" />
                              <span>{t('Connecting...', 'কানেক্ট হচ্ছে...')}</span>
                            </>
                          ) : (
                            <>
                              <ExternalLink size={13} />
                              <span>{ch.ctaLabel}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Business Data & AI Knowledge Integration Section */}
      <section className="rounded-2xl border border-white/[0.09] bg-[#121614] p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#B7F34A]/35 bg-[#B7F34A]/10 text-[#B7F34A]">
                <Brain size={16} />
              </span>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#F5F7F2]">
                {t('Business Data & AI Knowledge Integration', 'ব্যবসার ডাটা ও এআই নলেজ ইন্টিগ্রেশন')}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#B7F34A]/35 bg-[#B7F34A]/10 px-2 py-0.5 text-[10px] font-bold text-[#B7F34A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B7F34A]" />
                <span>{t('Live Reply Source', 'লাইভ রিপ্লাই সোর্স')}</span>
              </span>
            </div>
            <p className="text-xs text-[#A1AAA2] max-w-2xl leading-relaxed">
              {t(
                'Paste your products, prices, delivery rules, offers, or FAQs below. Mirror Bot integrates this live to answer Messenger, Facebook & WhatsApp customers accurately—and can auto-generate new helpful data on its own.',
                'নিচে আপনার পণ্য, দাম, ডেলিভারি চার্জ, অফার বা যেকোনো তথ্য লিখুন/পেস্ট করুন। মিরর বট এটি লাইভ ইন্টিগ্রেট করে সরাসরি এই ডাটা থেকেই মেসেঞ্জার, ফেসবুক ও হোয়াটসঅ্যাপে রিপ্লাই দেবে এবং চাইলে নিজেই নতুন ডাটা জেনারেট করতে পারবে।'
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleAutoLearn}
            disabled={savingKnowledge}
            className={`inline-flex min-h-[38px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              autoLearnKnowledge
                ? 'border-[#B7F34A]/40 bg-[#B7F34A]/15 text-[#B7F34A]'
                : 'border-white/[0.12] bg-[#0B0D0C] text-[#A1AAA2]'
            }`}
          >
            <Sparkles size={13} />
            <span>
              {t('Auto-Learn', 'অটো-লার্ন')}: {autoLearnKnowledge ? t('ON', 'চালু') : t('OFF', 'বন্ধ')}
            </span>
          </button>
        </div>

        {/* Raw Business Data Input Box */}
        <div className="rounded-xl border border-white/[0.09] bg-[#0B0D0C] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="mirrorbot-knowledge-input"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F5F7F2]"
            >
              <Database size={13} className="text-[#B7F34A]" />
              <span>{t('Input Your Business Data (Live Feed)', 'আপনার ব্যবসার ডাটা ইনপুট করুন (লাইভ ফিড)')}</span>
            </label>
            <span className="text-[11px] font-mono text-[#707A72]">
              {knowledgeText.length}/8000
            </span>
          </div>

          <textarea
            id="mirrorbot-knowledge-input"
            rows={5}
            maxLength={8000}
            value={knowledgeText}
            onChange={(e) => {
              setKnowledgeText(e.target.value);
              setKnowledgeDirty(true);
            }}
            placeholder={t(
              'Example:\n- Running Sneakers: ৳2,450 (Sizes 40–44)\n- Inside Dhaka Delivery: ৳70 (24 hours), Outside Dhaka: ৳130 (48–72 hours)\n- Cash on delivery available. Exchange within 3 days.\n- Hotline / WhatsApp: 017XXXXXXXX',
              'উদাহরণ:\n- প্রিমিয়াম স্নিকার্স: ৳২,৪৫০ (সাইজ ৪০–৪৪)\n- ঢাকার ভিতরে ডেলিভারি: ৳৭০ (২৪ ঘণ্টা), ঢাকার বাইরে: ৳১৩০ (৪৮–৭২ ঘণ্টা)\n- ক্যাশ অন ডেলিভারি আছে। ৩ দিনের মধ্যে সাইজ এক্সচেঞ্জ করা যাবে।\n- যোগাযোগ / হোয়াটসঅ্যাপ: ০১৭XXXXXXXX'
            )}
            className="w-full rounded-xl border border-white/[0.1] bg-[#121614] px-3.5 py-3 text-xs text-[#F5F7F2] placeholder:text-[#707A72] leading-relaxed focus:border-[#B7F34A]/60 focus:outline-none resize-y"
          />

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveIntegratedData()}
                disabled={savingKnowledge}
                className="min-h-[40px] rounded-xl glossy-btn px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {savingKnowledge ? (
                  <Loader2 size={13} className="animate-spin text-black" />
                ) : (
                  <Save size={13} />
                )}
                <span>
                  {savingKnowledge
                    ? t('Integrating...', 'ইন্টিগ্রেট হচ্ছে...')
                    : t('Integrate & Go Live', 'ডাটা ইন্টিগ্রেট ও লাইভ করুন')}
                </span>
              </button>

              <button
                type="button"
                onClick={handleStructureFromData}
                disabled={structuringKnowledge || !knowledgeText.trim()}
                className="min-h-[40px] rounded-xl border border-[#B7F34A]/35 bg-[#B7F34A]/10 hover:bg-[#B7F34A]/20 px-3.5 py-2 text-xs font-bold text-[#B7F34A] inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              >
                {structuringKnowledge ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Wand2 size={13} />
                )}
                <span>
                  {structuringKnowledge
                    ? t('Extracting...', 'সাজানো হচ্ছে...')
                    : t('Extract Cards from Data', 'ডাটা থেকে কার্ড সাজান')}
                </span>
              </button>
            </div>

            {knowledgeDirty && (
              <span className="text-[11px] text-amber-300 font-medium">
                {t('Unsaved changes — click Integrate to go live', 'সেভ করা হয়নি — লাইভ করতে ইন্টিগ্রেট ক্লিক করুন')}
              </span>
            )}
          </div>
        </div>

        {/* AI Auto-Generate New Data Bar */}
        <div className="rounded-xl border border-[#B7F34A]/25 bg-[#B7F34A]/[0.04] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#B7F34A]" />
              <span className="text-xs font-bold text-[#F5F7F2]">
                {t('Let Mirror Bot Auto-Generate New Data', 'মিরর বটকে দিয়ে নিজে থেকেই নতুন ডাটা জেনারেট করুন')}
              </span>
            </div>
            <span className="text-[11px] text-[#A1AAA2]">
              {t('Creates fresh FAQs, offers & sales answers', 'নতুন প্রশ্নোত্তর, পলিসি ও সেলস রিপ্লাই তৈরি করে')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <input
              type="text"
              value={aiTopicFocus}
              onChange={(e) => setAiTopicFocus(e.target.value)}
              maxLength={140}
              placeholder={t(
                'Optional focus topic (e.g., delivery policy, return rules, bulk discounts)',
                'ঐচ্ছিক টপিক লিখুন (যেমন: ডেলিভারি চার্জ, রিটার্ন পলিসি, পাইকারি ডিসকাউন্ট)'
              )}
              className="sm:col-span-8 rounded-xl border border-white/[0.1] bg-[#0B0D0C] px-3.5 py-2.5 text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:border-[#B7F34A]/60 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAiGenerateNewData}
              disabled={generatingKnowledge}
              className="sm:col-span-4 min-h-[40px] rounded-xl glossy-btn px-4 py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {generatingKnowledge ? (
                <>
                  <Loader2 size={13} className="animate-spin text-black" />
                  <span>{t('Generating...', 'জেনারেট হচ্ছে...')}</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>{t('AI Generate New Data', 'AI দিয়ে নতুন ডাটা জেনারেট')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Structured Live Knowledge Cards */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-[#B7F34A]" />
              <h3 className="text-xs sm:text-sm font-bold text-[#F5F7F2]">
                {t('Integrated Knowledge Base', 'ইন্টিগ্রেটেড লাইভ নলেজ কার্ড')} ({knowledgeItems.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddCardForm((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.12] bg-[#0B0D0C] hover:border-[#B7F34A]/50 px-3 py-1.5 text-[11px] font-semibold text-[#D4DBD5] hover:text-[#B7F34A] transition-colors cursor-pointer"
            >
              <Plus size={12} />
              <span>{t('Add Manual Card', 'ম্যানুয়াল কার্ড যোগ')}</span>
            </button>
          </div>

          {showAddCardForm && (
            <form
              onSubmit={handleAddManualCard}
              className="rounded-xl border border-[#B7F34A]/35 bg-[#0B0D0C] p-4 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  placeholder={t('Title (e.g. Dhaka Delivery Charge)', 'শিরোনাম (যেমন: ঢাকা ডেলিভারি চার্জ)')}
                  className="sm:col-span-8 rounded-xl border border-white/[0.1] bg-[#121614] px-3 py-2 text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:border-[#B7F34A] focus:outline-none"
                />
                <select
                  value={newCardCategory}
                  onChange={(e) => setNewCardCategory(e.target.value as MirrorBotKnowledgeCategory)}
                  className="sm:col-span-4 rounded-xl border border-white/[0.1] bg-[#121614] px-3 py-2 text-xs text-[#F5F7F2] focus:border-[#B7F34A] focus:outline-none"
                >
                  <option value="product">{t('Product / Price', 'পণ্য / দাম')}</option>
                  <option value="faq">{t('FAQ', 'সাধারণ প্রশ্ন')}</option>
                  <option value="policy">{t('Policy / Delivery', 'পলিসি / ডেলিভারি')}</option>
                  <option value="offer">{t('Offer', 'অফার')}</option>
                  <option value="general">{t('General', 'সাধারণ তথ্য')}</option>
                </select>
              </div>
              <textarea
                required
                rows={2}
                maxLength={500}
                value={newCardContent}
                onChange={(e) => setNewCardContent(e.target.value)}
                placeholder={t(
                  'Exact live answer or business detail Mirror Bot should use...',
                  'মিরর বট যে সঠিক তথ্য দিয়ে রিপ্লাই দেবে তা লিখুন...'
                )}
                className="w-full rounded-xl border border-white/[0.1] bg-[#121614] px-3 py-2 text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:border-[#B7F34A] focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="rounded-xl glossy-btn px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  {t('Add & Go Live', 'যোগ করে লাইভ করুন')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCardForm(false)}
                  className="rounded-xl border border-white/[0.1] px-3 py-2 text-xs text-[#A1AAA2] hover:text-[#F5F7F2] cursor-pointer"
                >
                  {t('Cancel', 'বাতিল')}
                </button>
              </div>
            </form>
          )}

          {knowledgeItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.12] bg-[#0B0D0C] px-5 py-7 text-center space-y-1.5">
              <p className="text-xs font-semibold text-[#F5F7F2]">
                {t('No structured knowledge cards yet', 'এখনো কোনো নলেজ কার্ড যোগ করা হয়নি')}
              </p>
              <p className="text-[11px] text-[#A1AAA2] max-w-lg mx-auto leading-relaxed">
                {t(
                  'Paste your data above and click "Extract Cards from Data", or click "AI Generate New Data" to let Mirror Bot create ready-to-use live answers automatically.',
                  'উপরে আপনার ডাটা পেস্ট করে "ডাটা থেকে কার্ড সাজান" ক্লিক করুন, অথবা "AI দিয়ে নতুন ডাটা জেনারেট" বাটনে ক্লিক করে মিরর বটকে দিয়ে নিজেই লাইভ ডাটা তৈরি করান।'
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {knowledgeItems.map((item) => {
                const srcMeta = getSourceMeta(item.source);
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/[0.09] bg-[#0B0D0C] p-3.5 space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-[#F5F7F2] leading-snug">
                          {item.title}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleDeleteKnowledgeItem(item.id)}
                          disabled={deletingCardId === item.id}
                          className="text-[#707A72] hover:text-red-400 p-0.5 shrink-0 cursor-pointer"
                          title={t('Remove card', 'কার্ড মুছুন')}
                        >
                          {deletingCardId === item.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded border border-white/[0.1] bg-[#121614] px-1.5 py-0.5 text-[10px] font-medium text-[#A1AAA2]">
                          {getCategoryLabel(item.category)}
                        </span>
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${srcMeta.cls}`}
                        >
                          {srcMeta.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#D4DBD5] leading-relaxed whitespace-pre-wrap break-words">
                        {item.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Auto-Reply System & Live Recent Replies Activity */}
      {(() => {
        const getChannelMeta = (ch: ReplyLogChannel) => {
          switch (ch) {
            case 'messenger':
              return {
                label: t('Messenger', 'মেসেঞ্জার'),
                badgeClass: 'border-[#A78BFA]/30 bg-[#A78BFA]/10 text-[#C4B5FD]',
                icon: <MessageSquare size={12} />,
              };
            case 'facebook_comment':
              return {
                label: t('FB Comment', 'ফেসবুক কমেন্ট'),
                badgeClass: 'border-[#60A5FA]/30 bg-[#60A5FA]/10 text-[#93C5FD]',
                icon: <Facebook size={12} />,
              };
            case 'whatsapp':
              return {
                label: t('WhatsApp', 'হোয়াটসঅ্যাপ'),
                badgeClass: 'border-[#4ADE80]/30 bg-[#4ADE80]/10 text-[#86EFAC]',
                icon: <MessageCircle size={12} />,
              };
            default:
              return {
                label: t('Live Test', 'লাইভ টেস্ট'),
                badgeClass: 'border-[#B7F34A]/30 bg-[#B7F34A]/10 text-[#B7F34A]',
                icon: <Zap size={12} />,
              };
          }
        };

        const filteredLogs =
          channelFilter === 'all'
            ? replyLogs
            : replyLogs.filter((item) => item.channel === channelFilter);

        const filteredRecipients =
          channelFilter === 'all'
            ? recipients
            : recipients.filter((item) => item.channel === channelFilter);

        const filterOptions: Array<{ key: 'all' | ReplyLogChannel; label: string; count: number }> = [
          { key: 'all', label: t('All', 'সব'), count: replyLogs.length },
          {
            key: 'messenger',
            label: t('Messenger', 'মেসেঞ্জার'),
            count: replySummary.byChannel.messenger,
          },
          {
            key: 'facebook_comment',
            label: t('FB Comment', 'ফেসবুক কমেন্ট'),
            count: replySummary.byChannel.facebook_comment,
          },
          {
            key: 'whatsapp',
            label: t('WhatsApp', 'হোয়াটসঅ্যাপ'),
            count: replySummary.byChannel.whatsapp,
          },
          {
            key: 'web_test',
            label: t('Test', 'টেস্ট'),
            count: replySummary.byChannel.web_test,
          },
        ];

        return (
          <section className="rounded-2xl border border-white/[0.09] bg-[#121614] p-5 sm:p-6 space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.08] pb-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#B7F34A]/35 bg-[#B7F34A]/10 text-[#B7F34A]">
                    <Zap size={15} />
                  </span>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-[#F5F7F2]">
                    {t('Auto-Reply Activity & Recent Replies', 'অটো-রিপ্লাই সিস্টেম ও রিসেন্ট রিপ্লাই')}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                      autoReplyEnabled
                        ? 'border-[#B7F34A]/35 bg-[#B7F34A]/10 text-[#B7F34A]'
                        : 'border-white/[0.12] bg-[#0B0D0C] text-[#A1AAA2]'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        autoReplyEnabled ? 'bg-[#B7F34A]' : 'bg-[#707A72]'
                      }`}
                    />
                    {autoReplyEnabled ? t('Active', 'সক্রিয়') : t('Paused', 'বিরতিতে')}
                  </span>
                </div>
                <p className="text-xs text-[#A1AAA2]">
                  {t(
                    'Track who messaged, who received an auto-reply, and view every recent reply from Messenger, Facebook Comments, and WhatsApp.',
                    'কে কে মেসেজ করেছে, কাকে কাকে অটো-রিপ্লাই করা হয়েছে এবং মেসেঞ্জার, ফেসবুক কমেন্ট ও হোয়াটসঅ্যাপের রিসেন্ট সব রিপ্লাই এখানে দেখুন।'
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchReplyActivity(false)}
                  disabled={refreshingReplies}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-white/[0.12] bg-[#0B0D0C] px-3 py-1.5 text-xs font-semibold text-[#D4DBD5] hover:border-[#B7F34A]/45 hover:text-[#F5F7F2] transition-colors cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw size={13} className={refreshingReplies ? 'animate-spin text-[#B7F34A]' : ''} />
                  <span>{t('Refresh', 'রিফ্রেশ')}</span>
                </button>

                {replyLogs.length > 0 && !confirmingClear && (
                  <button
                    type="button"
                    onClick={() => setConfirmingClear(true)}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#0B0D0C] px-3 py-1.5 text-xs font-semibold text-[#A1AAA2] hover:border-red-500/40 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>{t('Clear', 'মুছুন')}</span>
                  </button>
                )}

                {confirmingClear && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleClearReplyLogs}
                      disabled={clearingLogs}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-red-500/50 bg-red-950/50 px-3 py-1.5 text-xs font-bold text-red-200 hover:bg-red-900/60 cursor-pointer disabled:opacity-60"
                    >
                      {clearingLogs ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      <span>{t('Confirm Clear', 'নিশ্চিত মুছুন')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingClear(false)}
                      className="inline-flex min-h-[36px] items-center rounded-xl border border-white/[0.12] bg-[#0B0D0C] px-2.5 py-1.5 text-xs text-[#A1AAA2] hover:text-[#F5F7F2] cursor-pointer"
                    >
                      {t('Cancel', 'বাতিল')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Built-in Quick Auto-Reply Tester (uses live integrated data!) */}
            <form
              onSubmit={handleSendTestAutoReply}
              className="rounded-xl border border-white/[0.09] bg-[#0B0D0C] p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#F5F7F2]">
                  {t('Test Auto-Reply Live', 'সরাসরি অটো-রিপ্লাই টেস্ট করুন')}
                </span>
                <span className="text-[11px] text-[#707A72]">
                  {t(
                    'Replies directly from your integrated Business Info & Data above',
                    'উপরে দেওয়া আপনার ব্যবসার তথ্য ও ইন্টিগ্রেটেড ডাটা থেকে সরাসরি রিপ্লাই দেবে'
                  )}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <input
                  type="text"
                  value={testSenderName}
                  onChange={(e) => setTestSenderName(e.target.value)}
                  maxLength={80}
                  placeholder={t('Customer name (optional)', 'কাস্টমারের নাম (ঐচ্ছিক)')}
                  className="sm:col-span-3 rounded-xl border border-white/[0.1] bg-[#121614] px-3.5 py-2.5 text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:border-[#B7F34A]/60 focus:outline-none"
                />
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  maxLength={500}
                  placeholder={t(
                    'Type a sample customer message (e.g., What is the price or delivery charge?)',
                    'একটি স্যাম্পল কাস্টমার মেসেজ লিখুন (যেমন: দাম কত বা ডেলিভারি চার্জ কত?)'
                  )}
                  className="sm:col-span-6 rounded-xl border border-white/[0.1] bg-[#121614] px-3.5 py-2.5 text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:border-[#B7F34A]/60 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={testingReply || !testMessage.trim()}
                  className="sm:col-span-3 min-h-[40px] rounded-xl glossy-btn px-4 py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                >
                  {testingReply ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-black" />
                      <span>{t('Replying...', 'রিপ্লাই হচ্ছে...')}</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>{t('Send Auto-Reply', 'অটো-রিপ্লাই দেখুন')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* View Switcher + Channel Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-xl border border-white/[0.1] bg-[#0B0D0C] p-1">
                <button
                  type="button"
                  onClick={() => setActiveActivityTab('recent')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    activeActivityTab === 'recent'
                      ? 'bg-[#B7F34A] text-[#0B0D0C]'
                      : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
                  }`}
                >
                  <Clock size={13} />
                  <span>{t('Recent Replies', 'রিসেন্ট রিপ্লাই')}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] ${
                      activeActivityTab === 'recent'
                        ? 'bg-[#0B0D0C]/15 text-[#0B0D0C]'
                        : 'bg-white/[0.08] text-[#D4DBD5]'
                    }`}
                  >
                    {replyLogs.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveActivityTab('recipients')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    activeActivityTab === 'recipients'
                      ? 'bg-[#B7F34A] text-[#0B0D0C]'
                      : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
                  }`}
                >
                  <Users size={13} />
                  <span>{t('Who Was Replied To', 'কাকে কাকে রিপ্লাই হয়েছে')}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] ${
                      activeActivityTab === 'recipients'
                        ? 'bg-[#0B0D0C]/15 text-[#0B0D0C]'
                        : 'bg-white/[0.08] text-[#D4DBD5]'
                    }`}
                  >
                    {recipients.length}
                  </span>
                </button>
              </div>

              {/* Channel Filter Bar */}
              <div className="flex flex-wrap items-center gap-1.5">
                {filterOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setChannelFilter(opt.key)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                      channelFilter === opt.key
                        ? 'border-[#B7F34A]/50 bg-[#B7F34A]/15 text-[#B7F34A]'
                        : 'border-white/[0.09] bg-[#0B0D0C] text-[#A1AAA2] hover:text-[#F5F7F2]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] opacity-75">({opt.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Activity List */}
            {loadingReplies ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#0B0D0C] py-10 text-xs text-[#A1AAA2]">
                <Loader2 size={15} className="animate-spin text-[#B7F34A]" />
                <span>{t('Loading auto-reply activity...', 'অটো-রিপ্লাই তথ্য লোড হচ্ছে...')}</span>
              </div>
            ) : activeActivityTab === 'recent' ? (
              filteredLogs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/[0.12] bg-[#0B0D0C] px-5 py-9 text-center space-y-2">
                  <p className="text-sm font-semibold text-[#F5F7F2]">
                    {t('No recent auto-replies yet', 'এখনো কোনো রিসেন্ট অটো-রিপ্লাই নেই')}
                  </p>
                  <p className="text-xs text-[#A1AAA2] max-w-md mx-auto leading-relaxed">
                    {t(
                      'As soon as a customer messages your Messenger, comments on your Facebook Page, or texts your WhatsApp—or when you test a message above—every reply will appear here live.',
                      'কাস্টমার আপনার মেসেঞ্জার, ফেসবুক পেজ কমেন্ট বা হোয়াটসঅ্যাপে মেসেজ করলেই—অথবা উপরে টেস্ট মেসেজ পাঠালেই—প্রতিটি অটো-রিপ্লাই এখানে লাইভ দেখাবে।'
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                  {filteredLogs.map((entry) => {
                    const chMeta = getChannelMeta(entry.channel);
                    return (
                      <article
                        key={entry.id}
                        className="rounded-xl border border-white/[0.09] bg-[#0B0D0C] p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.12] bg-[#171C19] text-xs font-bold text-[#B7F34A]">
                              {getInitialBadge(entry.senderName)}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-[#F5F7F2] truncate">
                                {entry.senderName}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span
                                  className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${chMeta.badgeClass}`}
                                >
                                  {chMeta.icon}
                                  <span>{chMeta.label}</span>
                                </span>
                                {entry.hasImage && (
                                  <span className="inline-flex items-center gap-1 rounded border border-white/[0.12] bg-[#171C19] px-1.5 py-0.5 text-[10px] text-[#D4DBD5]">
                                    <ImageIcon size={10} className="text-[#B7F34A]" />
                                    <span>{t('Photo', 'ছবি')}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold ${
                                entry.status === 'sent'
                                  ? 'border-[#B7F34A]/35 bg-[#B7F34A]/10 text-[#B7F34A]'
                                  : 'border-red-500/40 bg-red-950/40 text-red-300'
                              }`}
                            >
                              {entry.status === 'sent' ? (
                                <CheckCircle2 size={10} />
                              ) : (
                                <AlertCircle size={10} />
                              )}
                              <span>
                                {entry.status === 'sent'
                                  ? t('Replied', 'রিপ্লাই গেছে')
                                  : t('Failed', 'ব্যর্থ')}
                              </span>
                            </span>
                            <span className="text-[11px] text-[#707A72]">
                              {formatReplyTimestamp(entry.createdAt, isBangla)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          <div className="rounded-lg border border-white/[0.07] bg-[#121614] px-3 py-2.5 space-y-1">
                            <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#707A72]">
                              {t('Customer Message', 'কাস্টমারের মেসেজ')}
                            </span>
                            <p className="text-xs text-[#D4DBD5] whitespace-pre-wrap break-words leading-relaxed">
                              {entry.customerMessage || t('[Photo sent]', '[ছবি পাঠিয়েছে]')}
                            </p>
                          </div>

                          <div
                            className={`rounded-lg border px-3 py-2.5 space-y-1 ${
                              entry.status === 'sent'
                                ? 'border-[#B7F34A]/25 bg-[#B7F34A]/[0.05]'
                                : 'border-red-500/25 bg-red-950/20'
                            }`}
                          >
                            <span
                              className={`block text-[10px] font-semibold uppercase tracking-wide ${
                                entry.status === 'sent' ? 'text-[#B7F34A]' : 'text-red-300'
                              }`}
                            >
                              {activeBotName} {t('Reply', 'রিপ্লাই')}
                            </span>
                            {entry.botReply ? (
                              <p className="text-xs text-[#F5F7F2] whitespace-pre-wrap break-words leading-relaxed">
                                {entry.botReply}
                              </p>
                            ) : (
                              <p className="text-xs text-red-200 break-words">
                                {entry.errorNote ||
                                  t('Reply could not be delivered.', 'রিপ্লাই পাঠানো যায়নি।')}
                              </p>
                            )}
                            {entry.status === 'failed' && entry.errorNote && entry.botReply && (
                              <p className="text-[11px] text-red-300 pt-1">{entry.errorNote}</p>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )
            ) : filteredRecipients.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.12] bg-[#0B0D0C] px-5 py-9 text-center space-y-2">
                <p className="text-sm font-semibold text-[#F5F7F2]">
                  {t('No contacts replied to yet', 'এখনো কাউকে রিপ্লাই করা হয়নি')}
                </p>
                <p className="text-xs text-[#A1AAA2] max-w-md mx-auto leading-relaxed">
                  {t(
                    'Everyone who receives an auto-reply from your Mirror Bot will be listed here with their reply count and latest message.',
                    'আপনার মিরর বট যাদের যাদের অটো-রিপ্লাই দেবে, তাদের সবার নাম, চ্যানেল এবং মোট কতবার রিপ্লাই হয়েছে তা এখানে দেখাবে।'
                  )}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
                {filteredRecipients.map((person) => {
                  const chMeta = getChannelMeta(person.channel);
                  return (
                    <div
                      key={`${person.channel}_${person.senderId}`}
                      className="rounded-xl border border-white/[0.09] bg-[#0B0D0C] p-4 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#B7F34A]/30 bg-[#B7F34A]/10 text-xs font-bold text-[#B7F34A]">
                            {getInitialBadge(person.senderName)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#F5F7F2] truncate">
                              {person.senderName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${chMeta.badgeClass}`}
                              >
                                {chMeta.icon}
                                <span>{chMeta.label}</span>
                              </span>
                              <span className="text-[11px] text-[#707A72]">
                                {formatReplyTimestamp(person.lastRepliedAt, isBangla)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="rounded-lg border border-[#B7F34A]/30 bg-[#B7F34A]/10 px-2 py-1 text-[11px] font-bold text-[#B7F34A] shrink-0">
                          {person.replyCount}{' '}
                          {person.replyCount === 1
                            ? t('reply', 'রিপ্লাই')
                            : t('replies', 'রিপ্লাই')}
                        </span>
                      </div>

                      <div className="rounded-lg border border-white/[0.07] bg-[#121614] px-3 py-2 space-y-1">
                        <p className="text-[11px] text-[#A1AAA2] truncate">
                          <span className="text-[#707A72] font-semibold">
                            {t('Asked:', 'জিজ্ঞাসা:')}
                          </span>{' '}
                          {person.lastCustomerMessage || t('[Photo]', '[ছবি]')}
                        </p>
                        <p className="text-xs text-[#F5F7F2] line-clamp-2 leading-relaxed">
                          <span className="text-[#B7F34A] font-semibold">
                            {t('Last Reply:', 'সর্বশেষ রিপ্লাই:')}
                          </span>{' '}
                          {person.lastBotReply || t('Failed to send', 'পাঠানো যায়নি')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })()}

      {isOwnerAdmin && <MirrorBotAdminDiagnostics />}
    </div>
  );

  if (embeddedInVault) {
    return innerContent;
  }

  return (
    <div className="min-h-[75vh] bg-[#0B0D0C] text-[#F5F7F2] px-4 py-10 sm:px-6 lg:px-8">
      {innerContent}
    </div>
  );
};

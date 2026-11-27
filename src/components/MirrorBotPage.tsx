import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  ExternalLink,
  Facebook,
  Image as ImageIcon,
  Loader2,
  Lock,
  MessageCircle,
  MessageSquare,
  Power,
  ShieldCheck,
  Unlink,
  UserPlus,
  Wrench,
} from 'lucide-react';
import { AppUser, MirrorBotVaultWorkspace, isVerifiedAdminUser } from '../types';
import {
  auth,
  activateMirrorBotInVault,
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
}

type MetaChannel = 'facebook' | 'messenger' | 'whatsapp';

interface SafeBackendWorkspace {
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

interface PendingSelection {
  sessionId: string;
  channel: MetaChannel;
  pages: Array<{ id: string; name: string; category: string }>;
  whatsappNumbers: Array<{
    wabaId: string;
    wabaName: string;
    phoneNumberId: string;
    displayPhone: string;
    verifiedName: string;
  }>;
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
  onOpenVaultMirrorBot,
}) => {
  const { t } = useLanguage();
  const [backendWorkspace, setBackendWorkspace] = useState<SafeBackendWorkspace | null>(null);
  const [metaOAuthConfigured, setMetaOAuthConfigured] = useState<boolean | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [connectingChannel, setConnectingChannel] = useState<MetaChannel | null>(null);
  const [togglingAutoReply, setTogglingAutoReply] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedUrlKey, setCopiedUrlKey] = useState<string | null>(null);

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

  const persistSafeChannelMeta = async (ws: SafeBackendWorkspace) => {
    if (!user?.uid) return;
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
          setBackendWorkspace(data.workspace);
        }
      }
    } catch {
      // Keep Vault state visible
    } finally {
      setLoadingStatus(false);
    }
  };

  // Ensure signed-in user has Mirror Bot activated in Vault & load their channel status
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!user) {
      setLoadingStatus(false);
      return;
    }
    activateMirrorBotInVault(user.uid, user.company || user.displayName).catch(() => {});
    fetchBackendStatus();
  }, [user?.uid]);

  // Keep backend webhook context synced with latest Vault business info for this UID
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
    JSON.stringify(vaultWorkspace?.workPoints || []),
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
          text: String(payload.error || 'Could not complete login. Please try again.'),
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
            setBackendWorkspace(payload.workspace);
            await persistSafeChannelMeta(payload.workspace);
          } else {
            fetchBackendStatus();
          }
          setNotice({
            type: 'success',
            text: 'Connected! Mirror Bot is now automatically replying to messages, comments, and photos.',
          });
          return;
        }

        if ((channel === 'facebook' || channel === 'messenger') && pages.length === 0) {
          setNotice({
            type: 'error',
            text: 'No managed Facebook Pages were found on this account.',
          });
          return;
        }

        if (channel === 'whatsapp' && whatsappNumbers.length === 0) {
          setNotice({
            type: 'error',
            text: 'No WhatsApp Business numbers were found on this Meta account.',
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
            'Facebook & WhatsApp direct login is not active yet. Please contact MirrorBook support.',
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
          text: 'Your browser blocked the login popup. Please allow popups and try again.',
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
      setNotice({ type: 'error', text: err?.message || 'Unable to start login right now.' });
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
        throw new Error(data?.error || 'Could not connect Facebook Page.');
      }
      if (data.workspace) {
        setBackendWorkspace(data.workspace);
        await persistSafeChannelMeta(data.workspace);
      }
      setPendingSelection(null);
      setNotice({
        type: 'success',
        text: 'Facebook Page & Messenger connected! Live AI auto-replies are now active.',
      });
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'Failed to connect Page.' });
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
        throw new Error(data?.error || 'Could not connect WhatsApp number.');
      }
      if (data.workspace) {
        setBackendWorkspace(data.workspace);
        await persistSafeChannelMeta(data.workspace);
      }
      setPendingSelection(null);
      setNotice({
        type: 'success',
        text: 'WhatsApp Business connected! Live AI auto-replies are now active.',
      });
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'Failed to connect WhatsApp.' });
    } finally {
      setConnectingChannel(null);
    }
  };

  const handleDisconnect = async (channel: MetaChannel) => {
    if (!auth.currentUser) return;
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
        setBackendWorkspace(data.workspace);
        await persistSafeChannelMeta(data.workspace);
        setNotice({ type: 'success', text: 'Channel disconnected.' });
      }
    } catch {
      setNotice({ type: 'error', text: 'Could not disconnect channel.' });
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
        setBackendWorkspace(data.workspace);
      }
      await syncMirrorBotChannelStatusToVault(user.uid, { autoReplyEnabled: nextVal });
    } finally {
      setTogglingAutoReply(false);
    }
  };

  // Unauthenticated gate: Ask customer to create an account first to unlock Mirror Bot in Vault
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
              'Create your MirrorBook account to unlock Mirror Bot in your personal Vault. Once added, log in with Facebook or WhatsApp in one click—your AI bot will automatically reply to messages, comments, and customer photos.',
              'আপনার ব্যক্তিগত ভল্টে মিরর বট যোগ করতে মিরর বুক অ্যাকাউন্ট তৈরি করুন। অ্যাকাউন্ট করার পর ১ ক্লিকে ফেসবুক বা হোয়াটসঅ্যাপে লগইন করলেই আপনার এআই বট মেসেজ, কমেন্ট ও পণ্যের ছবি দেখে অটোমেটিক রিপ্লাই দেবে।'
            )}
          </p>

          <ul className="space-y-2 text-xs text-[#A1AAA2]">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#B7F34A] shrink-0" />
              <span>
                {t(
                  'One-click Facebook Page, Messenger & WhatsApp login',
                  '১-ক্লিকে ফেসবুক পেজ, মেসেঞ্জার ও হোয়াটসঅ্যাপ লগইন'
                )}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <ImageIcon size={14} className="text-[#B7F34A] shrink-0" />
              <span>
                {t(
                  'Inspects customer photos and replies naturally in Bangla & English',
                  'কাস্টমারের পাঠানো ছবি দেখে বাংলা ও ইংরেজিতে স্বাভাবিক রিপ্লাই দেয়'
                )}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-[#B7F34A] shrink-0" />
              <span>
                {t(
                  'Manage your business details anytime inside your Vault',
                  'যেকোনো সময় আপনার ভল্ট থেকে ব্যবসার তথ্য আপডেট করুন'
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

  return (
    <div className="min-h-[75vh] bg-[#0B0D0C] text-[#F5F7F2] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Compact Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.09] pb-5">
          <div className="space-y-2">
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A1AAA2] transition-colors hover:text-[#B7F34A] cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>{t('Back to MirrorBook', 'মিরর বুকে ফিরে যান')}</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.12] bg-[#121614] p-1.5 shrink-0">
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
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F7F2]">
                  {t('Mirror Bot', 'মিরর বট')}
                </h1>
                <p className="text-xs sm:text-sm text-[#A1AAA2]">
                  {t(
                    'Log in once—your AI bot replies automatically to messages, comments, and photos.',
                    'একবার লগইন করুন—আপনার এআই বট মেসেজ, কমেন্ট ও ছবি দেখে অটোমেটিক রিপ্লাই দেবে।'
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

        {/* Status Feedback Banner */}
        {notice && (
          <div
            className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs ${
              notice.type === 'error'
                ? 'border-red-500/40 bg-red-950/35 text-red-200'
                : 'border-[#B7F34A]/40 bg-[#B7F34A]/10 text-[#E5F9C2]'
            }`}
          >
            {notice.type === 'error' ? (
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
            ) : (
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#B7F34A]" />
            )}
            <span className="leading-relaxed">{notice.text}</span>
          </div>
        )}

        {/* Owner-Only Meta Setup Checklist (Strictly visible only to verified MirrorBook Owner/Admin — never shown to regular customers) */}
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
                'আপনার সার্ভার এনভায়রনমেন্ট ভেরিয়েবলে (AI Studio Secrets / Vercel) META_APP_ID, META_APP_SECRET এবং META_WEBHOOK_VERIFY_TOKEN সেট করুন এবং Meta for Developers-এ নিচের দুটি URL বসান — তাহলে সব কাস্টমার ১ ক্লিকেই কানেক্ট করতে পারবে:'
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

        {/* Multi-Account Picker (when customer manages multiple Facebook Pages or WhatsApp numbers) */}
        {pendingSelection && (
          <div className="rounded-2xl border border-[#B7F34A]/45 bg-[#121614] p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-[#F5F7F2]">
                {t('Select your account to connect', 'কানেক্ট করার জন্য আপনার অ্যাকাউন্ট নির্বাচন করুন')}
              </h2>
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
                {pendingSelection.whatsappNumbers.map((wa) => (
                  <button
                    key={wa.phoneNumberId}
                    type="button"
                    onClick={() => handleSelectWhatsApp(wa.phoneNumberId)}
                    className="flex items-center justify-between rounded-xl border border-white/[0.1] bg-[#0B0D0C] px-4 py-3 text-left transition-colors hover:border-[#B7F34A] cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F5F7F2] truncate">
                        {wa.verifiedName}
                      </p>
                      <p className="text-xs text-[#A1AAA2] font-mono">{wa.displayPhone}</p>
                    </div>
                    <span className="text-xs font-bold text-[#B7F34A] shrink-0">
                      {t('Connect', 'কানেক্ট')}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {pendingSelection.pages.map((page) => (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => handleSelectPage(page.id)}
                    className="flex items-center justify-between rounded-xl border border-white/[0.1] bg-[#0B0D0C] px-4 py-3 text-left transition-colors hover:border-[#B7F34A] cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F5F7F2] truncate">{page.name}</p>
                      {page.category && (
                        <p className="text-xs text-[#A1AAA2] truncate">{page.category}</p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#B7F34A] shrink-0">
                      {t('Connect', 'কানেক্ট')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main 2-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Read-Only Business Profile Summary (Managed exclusively from Vault) */}
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
                <span>{t('In Vault', 'ভল্টে সংরক্ষিত')}</span>
              </span>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-white/[0.08] bg-[#0B0D0C] px-3.5 py-3">
                <span className="block text-[11px] text-[#707A72]">{t('Business', 'ব্যবসার নাম')}</span>
                <p className="text-sm font-semibold text-[#F5F7F2] mt-0.5 break-words">
                  {activeBusinessName}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#0B0D0C] px-3.5 py-3">
                <span className="block text-[11px] text-[#707A72]">{t('AI Bot Name', 'এআই বটের নাম')}</span>
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
                      'No business points added yet. Add them in your Vault so Mirror Bot knows your products & services.',
                      'এখনো ব্যবসার পয়েন্ট যোগ করা হয়নি। আপনার ভল্টে পয়েন্ট যোগ করলে মিরর বট আপনার পণ্য ও সার্ভিস সম্পর্কে জানতে পারবে।'
                    )}
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {activeWorkPoints.map((pt, idx) => (
                      <li key={`${pt}-${idx}`} className="flex items-start gap-2 text-xs text-[#D4DBD5]">
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
              onClick={onOpenVaultMirrorBot}
              className="w-full min-h-[44px] rounded-xl glossy-btn py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Edit3 size={14} />
              <span>{t('Edit Business Info in Vault', 'ভল্ট থেকে ব্যবসার তথ্য এডিট করুন')}</span>
            </button>
          </div>

          {/* Right: Zero-Friction One-Click Channel Connection */}
          <div className="lg:col-span-7 rounded-2xl border border-white/[0.09] bg-[#121614] p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-[#F5F7F2]">
                {t('Connect Channels', 'চ্যানেল কানেক্ট করুন')}
              </h2>
              <span className="text-[11px] text-[#A1AAA2]">
                {t('One-click login · Zero setup code', '১-ক্লিক লগইন · কোনো কোড বসাতে হবে না')}
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
      </div>
    </div>
  );
};

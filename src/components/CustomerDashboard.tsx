import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Puzzle,
  KeyRound,
  GraduationCap,
  FolderArchive,
  History,
  Receipt,
  UserCheck,
  Settings,
  LogOut,
  Download,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Mail,
  Sparkles,
  ExternalLink,
  ArrowLeft,
  Save,
} from 'lucide-react';
import {
  AppUser,
  CustomerProfile,
  DownloadHistoryItem,
  Order,
  UserPurchase,
  generateDeterministicLicenseKey,
  isVerifiedAdminUser,
} from '../types';
import { SecureDownloadTarget } from './SecureDownloadModal';

type DashboardTab =
  | 'overview'
  | 'purchases'
  | 'plugins'
  | 'licenses'
  | 'courses'
  | 'assets'
  | 'downloads'
  | 'orders'
  | 'account'
  | 'settings';

interface CustomerDashboardProps {
  user: AppUser | null;
  profile: CustomerProfile | null;
  purchases: UserPurchase[];
  orders: Order[];
  downloadHistory: DownloadHistoryItem[];
  onNavigate: (path: string) => void;
  onSignOut: () => Promise<void>;
  onSelectDownload: (target: SecureDownloadTarget) => void;
  onUpdateProfile: (updates: { displayName: string; phone?: string; company?: string }) => Promise<void>;
  onSendResetPassword: (email: string) => Promise<void>;
  onResendVerification: () => Promise<void>;
  onBrowseStore: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  user,
  profile,
  purchases,
  orders,
  downloadHistory,
  onNavigate,
  onSignOut,
  onSelectDownload,
  onUpdateProfile,
  onSendResetPassword,
  onResendVerification,
  onBrowseStore,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Profile Settings form state
  const [editName, setEditName] = useState(profile?.displayName || user?.displayName || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || user?.phone || '');
  const [editCompany, setEditCompany] = useState(profile?.company || user?.company || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    document.title = 'My Account & Dashboard | MirrorBook';
  }, []);

  useEffect(() => {
    setEditName(profile?.displayName || user?.displayName || '');
    setEditPhone(profile?.phone || user?.phone || '');
    setEditCompany(profile?.company || user?.company || '');
  }, [profile, user]);

  const pluginsList = useMemo(
    () =>
      purchases.filter((p) => {
        const cat = (p.category || '').toLowerCase();
        return !cat.includes('course') && !cat.includes('software') && !cat.includes('asset');
      }),
    [purchases]
  );

  const coursesList = useMemo(
    () =>
      purchases.filter((p) => {
        const cat = (p.category || '').toLowerCase();
        const title = (p.title || '').toLowerCase();
        return cat.includes('course') || title.includes('course') || title.includes('masterclass');
      }),
    [purchases]
  );

  const digitalAssetsList = useMemo(
    () =>
      purchases.filter((p) => {
        const cat = (p.category || '').toLowerCase();
        const title = (p.title || '').toLowerCase();
        return (
          cat.includes('software') ||
          cat.includes('asset') ||
          cat.includes('pack') ||
          title.includes('mirrorpos')
        );
      }),
    [purchases]
  );

  const licenseEntries = useMemo(
    () =>
      purchases.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category || 'Plugin',
        purchasedAt: p.purchasedAt || 'Active',
        licenseKey:
          p.licenseKey ||
          generateDeterministicLicenseKey(p.title, user?.email, p.trxId || p.id),
      })),
    [purchases, user?.email]
  );

  if (!user) {
    return (
      <section className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-16 bg-[#070707]">
        <div className="max-w-md w-full glossy-card border border-white/15 rounded-3xl p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#71B913]/15 border border-[#71B913]/40 text-[#71B913] mx-auto flex items-center justify-center">
            <UserCheck size={26} />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-xl font-bold text-white">Sign In Required</h1>
            <p className="text-xs text-[#999999] leading-relaxed">
              Please sign in to access your purchases, plugin license keys, courses, and downloads.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="flex-1 py-3 bg-[#71B913] hover:bg-[#81cf17] text-black text-xs font-bold uppercase rounded-xl cursor-pointer transition-colors"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/signup')}
              className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Create Account
            </button>
          </div>
        </div>
      </section>
    );
  }

  const handleCopy = (value: string, id: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileNotice(null);
    if (!editName.trim()) {
      setProfileNotice({ type: 'error', text: 'Display name cannot be empty.' });
      return;
    }
    setIsSavingProfile(true);
    try {
      await onUpdateProfile({
        displayName: editName.trim(),
        phone: editPhone.trim(),
        company: editCompany.trim(),
      });
      setProfileNotice({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: unknown) {
      setProfileNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to save profile updates.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const navItems: { id: DashboardTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
    { id: 'purchases', label: 'My Purchases', icon: <ShoppingBag size={15} />, count: purchases.length },
    { id: 'plugins', label: 'My Plugins', icon: <Puzzle size={15} />, count: pluginsList.length },
    { id: 'licenses', label: 'Plugin License Keys', icon: <KeyRound size={15} />, count: licenseEntries.length },
    { id: 'courses', label: 'My Courses', icon: <GraduationCap size={15} />, count: coursesList.length },
    { id: 'assets', label: 'Digital Assets', icon: <FolderArchive size={15} />, count: digitalAssetsList.length },
    { id: 'downloads', label: 'Download History', icon: <History size={15} />, count: downloadHistory.length },
    { id: 'orders', label: 'Order History', icon: <Receipt size={15} />, count: orders.length },
    { id: 'account', label: 'Account Information', icon: <UserCheck size={15} /> },
    { id: 'settings', label: 'Profile Settings', icon: <Settings size={15} /> },
  ];

  const renderPurchaseCards = (items: UserPurchase[], emptyTitle: string, emptyDesc: string) => {
    if (items.length === 0) {
      return (
        <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-[#888888] mx-auto flex items-center justify-center">
            <ShoppingBag size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-white">{emptyTitle}</h3>
            <p className="text-xs text-[#888888] max-w-md mx-auto leading-relaxed">{emptyDesc}</p>
          </div>
          <button
            type="button"
            onClick={onBrowseStore}
            className="px-5 py-2.5 bg-[#71B913] hover:bg-[#81cf17] text-black text-xs font-bold uppercase rounded-xl inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Sparkles size={14} />
            <span>Browse Store</span>
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const itemLicense =
            item.licenseKey ||
            generateDeterministicLicenseKey(item.title, user.email, item.trxId || item.id);
          return (
            <div
              key={item.id}
              className="bg-[#0F0F0F] border border-white/10 hover:border-[#71B913]/40 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold text-[#71B913] bg-[#71B913]/15 px-2.5 py-0.5 rounded">
                    {item.category || 'Digital Product'}
                  </span>
                  <span className="text-[11px] text-[#777777] font-mono">
                    {item.purchasedAt || 'Active'}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-white">{item.title}</h3>
                <div className="flex items-center justify-between text-[11px] bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1.5">
                  <span className="text-[#888888] font-mono truncate">{itemLicense}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(itemLicense, `lic-${item.id}`)}
                    className="text-[#71B913] hover:text-white ml-2 shrink-0 cursor-pointer"
                    title="Copy License Key"
                  >
                    {copiedKey === `lic-${item.id}` ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onSelectDownload({
                    id: item.id,
                    orderId: item.id,
                    title: item.title,
                    category: item.category,
                    downloadUrl: item.downloadUrl,
                    purchasedAt: item.purchasedAt,
                    trxId: item.trxId,
                  })
                }
                className="w-full py-2.5 bg-[#71B913] hover:bg-[#81cf17] text-black text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Download size={14} />
                <span>Secure Download</span>
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="min-h-[calc(100vh-140px)] bg-[#070707] px-4 sm:px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Customer'}
                className="w-12 h-12 rounded-2xl object-cover border border-[#71B913]/50"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-[#71B913] text-black font-display font-bold text-lg flex items-center justify-center">
                {(profile?.displayName || user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-white">
                  {profile?.displayName || user.displayName || 'Customer Account'}
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#71B913]/15 text-[#71B913] border border-[#71B913]/30">
                  Customer Portal
                </span>
              </div>
              <p className="text-xs text-[#999999] font-mono">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isVerifiedAdminUser(user) && (
              <button
                type="button"
                onClick={() => onNavigate('/admin')}
                className="px-4 py-2 text-xs font-semibold bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/40 text-yellow-300 rounded-xl cursor-pointer transition-colors"
              >
                Open Admin Console
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="px-4 py-2 text-xs font-medium bg-white/[0.05] hover:bg-white/10 border border-white/10 text-white rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Storefront</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                await onSignOut();
                onNavigate('/login');
              }}
              className="px-4 py-2 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Selector */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-2">
          {navItems.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#71B913] text-black font-bold'
                  : 'bg-[#0F0F0F] border border-white/10 text-[#AAAAAA]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Main Sidebar + Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 bg-[#0C0C0C] border border-white/[0.08] rounded-2xl p-3 space-y-1 sticky top-24">
            {navItems.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#71B913] text-black font-bold shadow-[0_0_20px_rgba(113,185,19,0.2)]'
                    : 'text-[#AAAAAA] hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {tab.icon}
                  <span>{tab.label}</span>
                </span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      activeTab === tab.id
                        ? 'bg-black/20 text-black'
                        : 'bg-white/10 text-[#999999]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}

            <div className="pt-2 mt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={async () => {
                  await onSignOut();
                  onNavigate('/login');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-red-300 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          </aside>

          {/* Content Area */}
          <div className="lg:col-span-9 space-y-6">
            {/* Email verification banner for Email/Password users */}
            {user.emailVerified === false && (
              <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 text-xs text-yellow-200">
                  <AlertCircle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Verify your email address</strong>
                    <span>
                      Please verify <strong>{user.email}</strong> to keep your orders and license recovery synced automatically.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await onResendVerification();
                    setVerificationSent(true);
                  }}
                  disabled={verificationSent}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-bold rounded-xl shrink-0 cursor-pointer disabled:opacity-60"
                >
                  {verificationSent ? 'Verification Sent ✓' : 'Send Verification Email'}
                </button>
              </div>
            )}

            {/* 1. OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-4">
                    <span className="text-[11px] text-[#888888] block">My Purchases</span>
                    <span className="text-2xl font-display font-bold text-white tabular-nums mt-1 block">
                      {purchases.length}
                    </span>
                  </div>
                  <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-4">
                    <span className="text-[11px] text-[#888888] block">Active Licenses</span>
                    <span className="text-2xl font-display font-bold text-[#71B913] tabular-nums mt-1 block">
                      {licenseEntries.length}
                    </span>
                  </div>
                  <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-4">
                    <span className="text-[11px] text-[#888888] block">Total Orders</span>
                    <span className="text-2xl font-display font-bold text-white tabular-nums mt-1 block">
                      {orders.length}
                    </span>
                  </div>
                  <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-4">
                    <span className="text-[11px] text-[#888888] block">Downloads</span>
                    <span className="text-2xl font-display font-bold text-white tabular-nums mt-1 block">
                      {downloadHistory.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-bold text-white">
                      Recent Unlocked Products
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('purchases')}
                      className="text-xs text-[#71B913] hover:underline cursor-pointer"
                    >
                      View all →
                    </button>
                  </div>
                  {renderPurchaseCards(
                    purchases.slice(0, 4),
                    'Welcome to Your MirrorBook Dashboard',
                    'Your purchased plugins, courses, software, and single-seat license keys will appear here as soon as your order is verified.'
                  )}
                </div>
              </div>
            )}

            {/* 2. MY PURCHASES */}
            {activeTab === 'purchases' && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-white">My Purchases</h2>
                {renderPurchaseCards(
                  purchases,
                  'No Purchases Found Yet',
                  'Explore MirrorBook plugins, courses, and digital software to unlock tools in your personal library.'
                )}
              </div>
            )}

            {/* 3. MY PLUGINS */}
            {activeTab === 'plugins' && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-white">My Plugins</h2>
                {renderPurchaseCards(
                  pluginsList,
                  'No Purchased Plugins Yet',
                  'Plugins like Easy Flow and AI AutoCut purchased under this email will appear here.'
                )}
              </div>
            )}

            {/* 4. PLUGIN LICENSE KEYS */}
            {activeTab === 'licenses' && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-white">Plugin License Keys</h2>
                {licenseEntries.length === 0 ? (
                  <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-10 text-center text-xs text-[#888888]">
                    No active license keys yet. Purchase a plugin to generate a single-seat license key bound to {user.email}.
                  </div>
                ) : (
                  <div className="border border-white/10 rounded-2xl overflow-x-auto bg-[#0C0C0C]">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#141414] border-b border-white/10 text-[#888888] font-mono uppercase">
                        <tr>
                          <th className="py-3 px-4 font-normal">Product</th>
                          <th className="py-3 px-4 font-normal">Category</th>
                          <th className="py-3 px-4 font-normal">License Key</th>
                          <th className="py-3 px-4 font-normal">Status</th>
                          <th className="py-3 px-4 font-normal text-right">Copy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {licenseEntries.map((lic) => (
                          <tr key={lic.id} className="hover:bg-white/[0.02]">
                            <td className="py-3.5 px-4 font-semibold text-white">{lic.title}</td>
                            <td className="py-3.5 px-4 text-[#AAAAAA]">{lic.category}</td>
                            <td className="py-3.5 px-4 font-mono text-[#71B913] font-semibold">
                              {lic.licenseKey}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#71B913]/15 text-[#71B913] border border-[#71B913]/30">
                                ACTIVE
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleCopy(lic.licenseKey, `tbl-${lic.id}`)}
                                className="px-3 py-1 bg-white/10 hover:bg-white/15 text-white rounded-lg inline-flex items-center gap-1 cursor-pointer"
                              >
                                {copiedKey === `tbl-${lic.id}` ? (
                                  <Check size={12} className="text-[#71B913]" />
                                ) : (
                                  <Copy size={12} />
                                )}
                                <span>{copiedKey === `tbl-${lic.id}` ? 'Copied' : 'Copy'}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 5. MY COURSES */}
            {activeTab === 'courses' && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-white">My Courses</h2>
                {renderPurchaseCards(
                  coursesList,
                  'No Courses Enrolled Yet',
                  'Enrolled video editing, motion graphics, and creative masterclasses will unlock here.'
                )}
              </div>
            )}

            {/* 6. DIGITAL ASSETS */}
            {activeTab === 'assets' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-white">Digital Assets &amp; Software</h2>
                  <button
                    type="button"
                    onClick={() => onNavigate('/mirrorpos')}
                    className="text-xs text-[#71B913] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Explore MirrorPOS</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
                {renderPurchaseCards(
                  digitalAssetsList,
                  'No Digital Asset Packs Yet',
                  'Software licenses and downloadable creative asset packs appear here once unlocked.'
                )}
              </div>
            )}

            {/* 7. DOWNLOAD HISTORY */}
            {activeTab === 'downloads' && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-white">Download History</h2>
                {downloadHistory.length === 0 ? (
                  <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-10 text-center text-xs text-[#888888]">
                    No downloads recorded yet. Launching a download from your library logs each session token here.
                  </div>
                ) : (
                  <div className="border border-white/10 rounded-2xl overflow-x-auto bg-[#0C0C0C]">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#141414] border-b border-white/10 text-[#888888] font-mono uppercase">
                        <tr>
                          <th className="py-3 px-4 font-normal">Item</th>
                          <th className="py-3 px-4 font-normal">Category</th>
                          <th className="py-3 px-4 font-normal">Session / License</th>
                          <th className="py-3 px-4 font-normal">Downloaded At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {downloadHistory.map((log) => (
                          <tr key={log.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-4 font-semibold text-white">{log.title}</td>
                            <td className="py-3 px-4 text-[#AAAAAA]">{log.category || 'Asset'}</td>
                            <td className="py-3 px-4 font-mono text-[#71B913]">
                              {log.licenseKey || log.sessionToken || 'Verified Session'}
                            </td>
                            <td className="py-3 px-4 font-mono text-[#888888]">
                              {log.downloadedAt
                                ? new Date(log.downloadedAt).toLocaleString()
                                : 'Just now'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 8. ORDER HISTORY */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-white">Order History</h2>
                {orders.length === 0 ? (
                  <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-10 text-center text-xs text-[#888888]">
                    No orders found for {user.email}.
                  </div>
                ) : (
                  <div className="border border-white/10 rounded-2xl overflow-x-auto bg-[#0C0C0C]">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#141414] border-b border-white/10 text-[#888888] font-mono uppercase">
                        <tr>
                          <th className="py-3 px-4 font-normal">Order ID</th>
                          <th className="py-3 px-4 font-normal">Product</th>
                          <th className="py-3 px-4 font-normal">Amount</th>
                          <th className="py-3 px-4 font-normal">Method / TrxID</th>
                          <th className="py-3 px-4 font-normal">Status</th>
                          <th className="py-3 px-4 font-normal">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {orders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-4 font-mono font-semibold text-[#71B913]">
                              {ord.id}
                            </td>
                            <td className="py-3 px-4 font-semibold text-white">{ord.itemName}</td>
                            <td className="py-3 px-4 font-mono text-white">{ord.itemPrice}</td>
                            <td className="py-3 px-4 font-mono text-[#AAAAAA]">
                              {ord.paymentMethod} • {ord.trxId}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                  ord.status === 'Verified' || ord.status === 'Completed'
                                    ? 'bg-[#71B913]/15 text-[#71B913] border border-[#71B913]/30'
                                    : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30'
                                }`}
                              >
                                {ord.status || 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[#888888]">{ord.createdAt}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 9. ACCOUNT INFORMATION */}
            {activeTab === 'account' && (
              <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
                  <ShieldCheck size={18} className="text-[#71B913]" />
                  <h2 className="font-display text-lg font-bold text-white">Account Information</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-[#777777] block mb-1">Full Name</span>
                    <span className="text-white font-semibold">
                      {profile?.displayName || user.displayName || 'Customer'}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-[#777777] block mb-1">Email Address</span>
                    <span className="text-white font-mono">{user.email}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-[#777777] block mb-1">Account Role</span>
                    <span className="text-[#71B913] font-bold uppercase">
                      {user.role === 'admin' && user.backendVerified ? 'Studio Owner' : 'Customer'}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-[#777777] block mb-1">Email Verification</span>
                    <span className={user.emailVerified ? 'text-[#71B913] font-semibold' : 'text-yellow-300 font-semibold'}>
                      {user.emailVerified ? 'Verified ✓' : 'Pending Verification'}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-[#777777] block mb-1">Sign-In Provider</span>
                    <span className="text-white font-mono">
                      {user.isGoogle ? 'Google OAuth' : 'Email & Password'}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-[#777777] block mb-1">Account UID</span>
                    <span className="text-[#AAAAAA] font-mono text-[11px] break-all">{user.uid}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 10. PROFILE SETTINGS */}
            {activeTab === 'settings' && (
              <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="border-b border-white/[0.08] pb-3">
                  <h2 className="font-display text-lg font-bold text-white">Profile Settings</h2>
                  <p className="text-xs text-[#888888]">
                    Update your customer profile information and security preferences.
                  </p>
                </div>

                <form onSubmit={handleSaveProfileSubmit} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-[11px] text-[#AAAAAA] mb-1.5 font-medium">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#AAAAAA] mb-1.5 font-medium">
                      Phone / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+880 1XXX-XXXXXX"
                      className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#AAAAAA] mb-1.5 font-medium">
                      Studio / Brand / Company (Optional)
                    </label>
                    <input
                      type="text"
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      placeholder="Your creative brand or channel name"
                      className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  {profileNotice && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        profileNotice.type === 'success'
                          ? 'bg-[#71B913]/15 border border-[#71B913]/40 text-[#c9f788]'
                          : 'bg-red-950/40 border border-red-800 text-red-200'
                      }`}
                    >
                      {profileNotice.type === 'success' ? (
                        <CheckCircle2 size={14} className="text-[#71B913]" />
                      ) : (
                        <AlertCircle size={14} className="text-red-400" />
                      )}
                      <span>{profileNotice.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 bg-[#71B913] hover:bg-[#81cf17] text-black text-xs font-bold uppercase rounded-xl flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
                  >
                    <Save size={14} />
                    <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </form>

                {!user.isGoogle && user.email && (
                  <div className="pt-4 border-t border-white/[0.08] space-y-3">
                    <h3 className="text-sm font-semibold text-white">Password Security</h3>
                    <p className="text-xs text-[#888888]">
                      Need to change your password? Request a secure Firebase password reset link to{' '}
                      <strong className="text-white">{user.email}</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!user.email) return;
                        try {
                          await onSendResetPassword(user.email);
                          setProfileNotice({
                            type: 'success',
                            text: `Password reset email sent to ${user.email}.`,
                          });
                        } catch (err: unknown) {
                          setProfileNotice({
                            type: 'error',
                            text: err instanceof Error ? err.message : 'Unable to send reset email.',
                          });
                        }
                      }}
                      className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Mail size={13} className="text-[#71B913]" />
                      <span>Send Password Reset Email</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

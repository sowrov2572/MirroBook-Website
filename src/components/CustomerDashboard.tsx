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
  onOpenCourse?: (courseId: string) => void;
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
  onOpenCourse,
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
      <section className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12 sm:py-16 bg-[#0B0D0C] overflow-x-clip">
        <div className="max-w-md w-full glossy-card rounded-2xl p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#B7F34A]/15 border border-[#B7F34A]/35 text-[#B7F34A] mx-auto flex items-center justify-center">
            <UserCheck size={26} />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-xl font-bold text-[#F5F7F2]">Sign In Required</h1>
            <p className="text-xs text-[#A1AAA2] leading-relaxed">
              Please sign in to access your purchases, plugin license keys, courses, and downloads.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="glossy-btn flex-1 min-h-[44px] py-3 text-xs font-bold rounded-xl cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/signup')}
              className="glossy-btn-secondary flex-1 min-h-[44px] py-3 text-xs font-semibold rounded-xl cursor-pointer"
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
        <div className="glossy-card rounded-2xl p-6 sm:p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#121614] border border-white/[0.09] text-[#A1AAA2] mx-auto flex items-center justify-center">
            <ShoppingBag size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-[#F5F7F2]">{emptyTitle}</h3>
            <p className="text-xs text-[#A1AAA2] max-w-md mx-auto leading-relaxed">{emptyDesc}</p>
          </div>
          <button
            type="button"
            onClick={onBrowseStore}
            className="glossy-btn min-h-[44px] px-5 py-2.5 text-xs font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Browse Store</span>
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {items.map((item) => {
          const itemLicense =
            item.licenseKey ||
            generateDeterministicLicenseKey(item.title, user.email, item.trxId || item.id);
          return (
            <div
              key={item.id}
              className="glossy-card glossy-card-hover rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 min-w-0"
            >
              <div className="space-y-2.5 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[#B7F34A] bg-[#B7F34A]/15 px-2.5 py-0.5 rounded-lg">
                    {item.category || 'Digital Product'}
                  </span>
                  <span className="text-[11px] text-[#707A72] font-mono tabular-nums">
                    {item.purchasedAt || 'Active'}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-[#F5F7F2] break-words">{item.title}</h3>
                <div className="flex items-center justify-between text-[11px] bg-[#121614] border border-white/[0.09] rounded-xl px-3 py-2 min-w-0">
                  <span className="text-[#A1AAA2] font-mono truncate">{itemLicense}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(itemLicense, `lic-${item.id}`)}
                    className="text-[#B7F34A] hover:text-[#F5F7F2] ml-2 shrink-0 cursor-pointer p-1"
                    title="Copy License Key"
                  >
                    {copiedKey === `lic-${item.id}` ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {onOpenCourse &&
              (item.productId === 'course-video-editing-fundamentals' ||
                item.title.toLowerCase().includes('video editing fundamentals')) ? (
                <button
                  type="button"
                  onClick={() => onOpenCourse('course-video-editing-fundamentals')}
                  className="glossy-btn w-full min-h-[44px] py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <GraduationCap size={14} />
                  <span>Open Course</span>
                </button>
              ) : (
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
                  className="glossy-btn w-full min-h-[44px] py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Secure Download</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="min-h-[calc(100vh-140px)] bg-[#0B0D0C] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-clip">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.09]">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Customer'}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover border border-[#B7F34A]/50 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#B7F34A] text-[#0B0D0C] font-display font-bold text-lg flex items-center justify-center shrink-0">
                {(profile?.displayName || user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-lg sm:text-xl font-bold text-[#F5F7F2] break-words">
                  {profile?.displayName || user.displayName || 'Customer Account'}
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-lg bg-[#B7F34A]/15 text-[#B7F34A] border border-[#B7F34A]/30 shrink-0">
                  Customer Portal
                </span>
              </div>
              <p className="text-xs text-[#A1AAA2] font-mono break-all mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isVerifiedAdminUser(user) && (
              <button
                type="button"
                onClick={() => onNavigate('/admin')}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/40 text-yellow-300 rounded-xl cursor-pointer transition-colors"
              >
                Open Admin Console
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="glossy-btn-secondary flex-1 sm:flex-none min-h-[44px] px-4 py-2 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
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
              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Selector */}
        <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {navItems.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold'
                  : 'bg-[#171C19] border border-white/[0.09] text-[#A1AAA2]'
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
          <aside className="hidden lg:block lg:col-span-3 glossy-card rounded-2xl p-3 space-y-1 sticky top-24">
            {navItems.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold shadow-sm'
                    : 'text-[#A1AAA2] hover:text-[#F5F7F2] hover:bg-white/[0.04]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {tab.icon}
                  <span>{tab.label}</span>
                </span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                      activeTab === tab.id
                        ? 'bg-[#0B0D0C]/15 text-[#0B0D0C]'
                        : 'bg-[#121614] text-[#A1AAA2]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}

            <div className="pt-2 mt-2 border-t border-white/[0.09]">
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
          <div className="lg:col-span-9 space-y-6 min-w-0">
            {/* Email verification banner for Email/Password users */}
            {user.emailVerified === false && (
              <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 text-xs text-yellow-200 min-w-0">
                  <AlertCircle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <strong className="text-[#F5F7F2] block">Verify your email address</strong>
                    <span className="break-words">
                      Please verify <strong className="break-all">{user.email}</strong> to keep your orders and license recovery synced automatically.
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
                  className="min-h-[44px] px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-[#0B0D0C] text-xs font-bold rounded-xl shrink-0 cursor-pointer disabled:opacity-60"
                >
                  {verificationSent ? 'Verification Sent ✓' : 'Send Verification Email'}
                </button>
              </div>
            )}

            {/* 1. OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="glossy-card rounded-2xl p-3.5 sm:p-4">
                    <span className="text-[11px] text-[#A1AAA2] block">My Purchases</span>
                    <span className="text-xl sm:text-2xl font-display font-bold text-[#F5F7F2] tabular-nums mt-1 block">
                      {purchases.length}
                    </span>
                  </div>
                  <div className="glossy-card rounded-2xl p-3.5 sm:p-4">
                    <span className="text-[11px] text-[#A1AAA2] block">Active Licenses</span>
                    <span className="text-xl sm:text-2xl font-display font-bold text-[#B7F34A] tabular-nums mt-1 block">
                      {licenseEntries.length}
                    </span>
                  </div>
                  <div className="glossy-card rounded-2xl p-3.5 sm:p-4">
                    <span className="text-[11px] text-[#A1AAA2] block">Total Orders</span>
                    <span className="text-xl sm:text-2xl font-display font-bold text-[#F5F7F2] tabular-nums mt-1 block">
                      {orders.length}
                    </span>
                  </div>
                  <div className="glossy-card rounded-2xl p-3.5 sm:p-4">
                    <span className="text-[11px] text-[#A1AAA2] block">Downloads</span>
                    <span className="text-xl sm:text-2xl font-display font-bold text-[#F5F7F2] tabular-nums mt-1 block">
                      {downloadHistory.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-bold text-[#F5F7F2]">
                      Recent Unlocked Products
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('purchases')}
                      className="text-xs text-[#B7F34A] hover:underline cursor-pointer"
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
                <h2 className="font-display text-lg font-bold text-[#F5F7F2]">My Purchases</h2>
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
                <h2 className="font-display text-lg font-bold text-[#F5F7F2]">My Plugins</h2>
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
                <h2 className="font-display text-lg font-bold text-[#F5F7F2]">Plugin License Keys</h2>
                {licenseEntries.length === 0 ? (
                  <div className="glossy-card rounded-2xl p-10 text-center text-xs text-[#A1AAA2]">
                    No active license keys yet. Purchase a plugin to generate a single-seat license key bound to {user.email}.
                  </div>
                ) : (
                  <div className="glossy-card rounded-2xl overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#121614] border-b border-white/[0.09] text-[#A1AAA2] font-mono uppercase">
                        <tr>
                          <th className="py-3 px-4 font-normal">Product</th>
                          <th className="py-3 px-4 font-normal">Category</th>
                          <th className="py-3 px-4 font-normal">License Key</th>
                          <th className="py-3 px-4 font-normal">Status</th>
                          <th className="py-3 px-4 font-normal text-right">Copy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {licenseEntries.map((lic) => (
                          <tr key={lic.id} className="hover:bg-white/[0.02]">
                            <td className="py-3.5 px-4 font-semibold text-[#F5F7F2]">{lic.title}</td>
                            <td className="py-3.5 px-4 text-[#A1AAA2]">{lic.category}</td>
                            <td className="py-3.5 px-4 font-mono text-[#B7F34A] font-semibold">
                              {lic.licenseKey}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#B7F34A]/15 text-[#B7F34A] border border-[#B7F34A]/30">
                                ACTIVE
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleCopy(lic.licenseKey, `tbl-${lic.id}`)}
                                className="px-3 py-1 bg-[#121614] hover:bg-white/[0.08] border border-white/[0.09] text-[#F5F7F2] rounded-lg inline-flex items-center gap-1 cursor-pointer"
                              >
                                {copiedKey === `tbl-${lic.id}` ? (
                                  <Check size={12} className="text-[#B7F34A]" />
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
                <h2 className="font-display text-lg font-bold text-[#F5F7F2]">My Courses</h2>
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
                  <h2 className="font-display text-lg font-bold text-[#F5F7F2]">Digital Assets &amp; Software</h2>
                  <button
                    type="button"
                    onClick={() => onNavigate('/mirrorpos')}
                    className="text-xs text-[#B7F34A] hover:underline flex items-center gap-1 cursor-pointer"
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
                <h2 className="font-display text-lg font-bold text-[#F5F7F2]">Download History</h2>
                {downloadHistory.length === 0 ? (
                  <div className="glossy-card rounded-2xl p-10 text-center text-xs text-[#A1AAA2]">
                    No downloads recorded yet. Launching a download from your library logs each session token here.
                  </div>
                ) : (
                  <div className="glossy-card rounded-2xl overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#121614] border-b border-white/[0.09] text-[#A1AAA2] font-mono uppercase">
                        <tr>
                          <th className="py-3 px-4 font-normal">Item</th>
                          <th className="py-3 px-4 font-normal">Category</th>
                          <th className="py-3 px-4 font-normal">Session / License</th>
                          <th className="py-3 px-4 font-normal">Downloaded At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {downloadHistory.map((log) => (
                          <tr key={log.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-4 font-semibold text-[#F5F7F2]">{log.title}</td>
                            <td className="py-3 px-4 text-[#A1AAA2]">{log.category || 'Asset'}</td>
                            <td className="py-3 px-4 font-mono text-[#B7F34A]">
                              {log.licenseKey || log.sessionToken || 'Verified Session'}
                            </td>
                            <td className="py-3 px-4 font-mono text-[#A1AAA2] tabular-nums">
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
                <h2 className="font-display text-lg font-bold text-[#F5F7F2]">Order History</h2>
                {orders.length === 0 ? (
                  <div className="glossy-card rounded-2xl p-10 text-center text-xs text-[#A1AAA2]">
                    No orders found for {user.email}.
                  </div>
                ) : (
                  <div className="glossy-card rounded-2xl overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#121614] border-b border-white/[0.09] text-[#A1AAA2] font-mono uppercase">
                        <tr>
                          <th className="py-3 px-4 font-normal">Order ID</th>
                          <th className="py-3 px-4 font-normal">Product</th>
                          <th className="py-3 px-4 font-normal">Amount</th>
                          <th className="py-3 px-4 font-normal">Method / TrxID</th>
                          <th className="py-3 px-4 font-normal">Status</th>
                          <th className="py-3 px-4 font-normal">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {orders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-4 font-mono font-semibold text-[#B7F34A]">
                              {ord.id}
                            </td>
                            <td className="py-3 px-4 font-semibold text-[#F5F7F2]">{ord.itemName}</td>
                            <td className="py-3 px-4 font-mono text-[#F5F7F2] tabular-nums">{ord.itemPrice}</td>
                            <td className="py-3 px-4 font-mono text-[#A1AAA2]">
                              {ord.paymentMethod} • {ord.trxId}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                  ord.status === 'Verified' || ord.status === 'Completed' || ord.status === 'Paid'
                                    ? 'bg-[#B7F34A]/15 text-[#B7F34A] border border-[#B7F34A]/30'
                                    : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30'
                                }`}
                              >
                                {ord.status || 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[#A1AAA2] tabular-nums">{ord.createdAt}</td>
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
              <div className="glossy-card rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="flex items-center gap-2 border-b border-white/[0.09] pb-3">
                  <ShieldCheck size={18} className="text-[#B7F34A] shrink-0" />
                  <h2 className="font-display text-lg font-bold text-[#F5F7F2]">Account Information</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#121614] border border-white/[0.09] min-w-0">
                    <span className="text-[#707A72] block mb-1">Full Name</span>
                    <span className="text-[#F5F7F2] font-semibold break-words">
                      {profile?.displayName || user.displayName || 'Customer'}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#121614] border border-white/[0.09] min-w-0">
                    <span className="text-[#707A72] block mb-1">Email Address</span>
                    <span className="text-[#F5F7F2] font-mono break-all">{user.email}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#121614] border border-white/[0.09]">
                    <span className="text-[#707A72] block mb-1">Account Role</span>
                    <span className="text-[#B7F34A] font-bold uppercase">
                      {user.role === 'admin' && user.backendVerified ? 'Studio Owner' : 'Customer'}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#121614] border border-white/[0.09]">
                    <span className="text-[#707A72] block mb-1">Email Verification</span>
                    <span className={user.emailVerified ? 'text-[#B7F34A] font-semibold' : 'text-yellow-300 font-semibold'}>
                      {user.emailVerified ? 'Verified ✓' : 'Pending Verification'}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#121614] border border-white/[0.09]">
                    <span className="text-[#707A72] block mb-1">Sign-In Provider</span>
                    <span className="text-[#F5F7F2] font-mono">
                      {user.isGoogle ? 'Google OAuth' : 'Email & Password'}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#121614] border border-white/[0.09] min-w-0">
                    <span className="text-[#707A72] block mb-1">Account UID</span>
                    <span className="text-[#A1AAA2] font-mono text-[11px] break-all">{user.uid}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 10. PROFILE SETTINGS */}
            {activeTab === 'settings' && (
              <div className="glossy-card rounded-2xl p-5 sm:p-6 space-y-6">
                <div className="border-b border-white/[0.09] pb-3">
                  <h2 className="font-display text-lg font-bold text-[#F5F7F2]">Profile Settings</h2>
                  <p className="text-xs text-[#A1AAA2]">
                    Update your customer profile information and security preferences.
                  </p>
                </div>

                <form onSubmit={handleSaveProfileSubmit} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-[11px] text-[#A1AAA2] mb-1.5 font-medium">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-[#121614] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-[#F5F7F2] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#A1AAA2] mb-1.5 font-medium">
                      Phone / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+880 1XXX-XXXXXX"
                      className="w-full bg-[#121614] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#A1AAA2] mb-1.5 font-medium">
                      Studio / Brand / Company (Optional)
                    </label>
                    <input
                      type="text"
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      placeholder="Your creative brand or channel name"
                      className="w-full bg-[#121614] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none transition-colors"
                    />
                  </div>

                  {profileNotice && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        profileNotice.type === 'success'
                          ? 'bg-[#B7F34A]/15 border border-[#B7F34A]/40 text-[#D0FC7A]'
                          : 'bg-red-950/40 border border-red-800 text-red-200'
                      }`}
                    >
                      {profileNotice.type === 'success' ? (
                        <CheckCircle2 size={14} className="text-[#B7F34A] shrink-0" />
                      ) : (
                        <AlertCircle size={14} className="text-red-400 shrink-0" />
                      )}
                      <span>{profileNotice.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="glossy-btn w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <Save size={14} />
                    <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </form>

                {!user.isGoogle && user.email && (
                  <div className="pt-4 border-t border-white/[0.09] space-y-3">
                    <h3 className="text-sm font-semibold text-[#F5F7F2]">Password Security</h3>
                    <p className="text-xs text-[#A1AAA2] break-words">
                      Need to change your password? Request a secure Firebase password reset link to{' '}
                      <strong className="text-[#F5F7F2] break-all">{user.email}</strong>.
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
                      className="glossy-btn-secondary w-full sm:w-auto min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Mail size={13} className="text-[#B7F34A]" />
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

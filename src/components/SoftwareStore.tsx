import React, { useState, useEffect } from 'react';
import { AppUser, CheckoutItem, ProductItem } from '../types';
import { auth } from '../utils/firebase';
import {
  Monitor,
  Smartphone,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  User as UserIcon,
  Download,
  Layers,
} from 'lucide-react';

interface SoftwareStoreProps {
  softwareList?: ProductItem[];
  loading?: boolean;
  onBuyItem: (item: CheckoutItem) => void;
  onOpenMirrorPOS?: () => void;
  user?: AppUser | null;
  onOpenSignIn?: () => void;
  onNotify?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const SoftwareStore: React.FC<SoftwareStoreProps> = ({
  softwareList = [],
  loading = false,
  onBuyItem,
  onOpenMirrorPOS,
  user = null,
  onOpenSignIn,
  onNotify,
}) => {
  const [platformFilter, setPlatformFilter] = useState<'All' | 'PC & Mac' | 'Android & iOS'>('All');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [selectedFreeProduct, setSelectedFreeProduct] = useState<ProductItem | null>(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [sendingAccess, setSendingAccess] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [accessSuccess, setAccessSuccess] = useState<{
    message: string;
    referenceId: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    if (selectedFreeProduct) {
      setAccessError('');
      setAccessSuccess(null);
      if (user?.email) {
        setGuestEmail(user.email);
        setGuestName(user.displayName || '');
      }
    }
  }, [selectedFreeProduct, user?.email, user?.displayName]);

  const activeSoftware = softwareList.filter(
    (s) => s.status !== 'draft' && s.status !== 'archived'
  );

  const filtered = activeSoftware.filter((s) => {
    if (platformFilter === 'All') return true;
    return s.category.toLowerCase().includes(platformFilter.toLowerCase());
  });

  const handleRequestFreeAccess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedFreeProduct || sendingAccess) return;

    const targetEmail = (user?.email || guestEmail).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(targetEmail)) {
      setAccessError('Please enter a valid email address to receive your download link.');
      return;
    }

    setSendingAccess(true);
    setAccessError('');

    try {
      let idToken = '';
      if (auth.currentUser) {
        idToken = await auth.currentUser.getIdToken().catch(() => '');
      }

      const res = await fetch('/api/software/free-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          productId: selectedFreeProduct.id,
          email: targetEmail,
          name: (user?.displayName || guestName).trim(),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const msg =
          data?.error ||
          'Unable to send the download link right now. Please try Launch / Download directly.';
        setAccessError(msg);
        onNotify?.(msg, 'error');
        return;
      }

      const resultPayload = {
        message:
          data.message ||
          `${selectedFreeProduct.title} download link has been sent to ${targetEmail}.`,
        referenceId: data.referenceId || 'MB-SW-FREE',
        email: data.email || targetEmail,
      };
      setAccessSuccess(resultPayload);
      onNotify?.(`✓ Download link sent to ${resultPayload.email}`, 'success');
    } catch {
      const msg = 'Network error sending email link. You can still use Launch / Download below.';
      setAccessError(msg);
      onNotify?.(msg, 'error');
    } finally {
      setSendingAccess(false);
    }
  };

  return (
    <section
      id="software"
      className="scroll-mt-20 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#121614] text-[#F5F7F2] border-b border-white/[0.09] relative overflow-x-clip"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10 pb-5 border-b border-white/[0.09]">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-[#B7F34A] block mb-2">
              MirrorBook Software Products
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#F5F7F2] tracking-tight">
              Software Library
            </h2>
            <p className="text-xs sm:text-sm text-[#A1AAA2] mt-2 max-w-xl leading-relaxed">
              Business and creative software products developed by MirrorBook for Windows, macOS, Web, Android, and iOS.
            </p>
          </div>

          {/* Segmented Glass Filter Tabs */}
          <div className="glass-tab-bar flex items-center gap-1 self-start md:self-auto max-w-full overflow-x-auto no-scrollbar">
            {(['All', 'PC & Mac', 'Android & iOS'] as const).map((filter) => {
              const isActive = platformFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setPlatformFilter(filter)}
                  className={`min-h-[36px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold shadow-sm'
                      : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
                  }`}
                >
                  {filter === 'PC & Mac' && <Monitor size={12} />}
                  {filter === 'Android & iOS' && <Smartphone size={12} />}
                  <span>{filter}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="glossy-card p-5 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 rounded bg-white/[0.08]" />
                    <div className="h-3 w-16 rounded bg-white/[0.06]" />
                  </div>
                </div>
                <div className="h-8 w-full rounded bg-white/[0.06]" />
                <div className="h-11 w-full rounded-xl bg-white/[0.08]" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glossy-card p-8 sm:p-14 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-[#B7F34A] mx-auto mb-4">
              <Layers size={22} />
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#F5F7F2] mb-2">
              No Software Available Right Now
            </h3>
            <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
              Software applications published in the MirrorBook catalog will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 items-stretch">
            {filtered.map((sw) => {
              const isFreeSoftware = sw.isFree === true || Number(sw.price) === 0;
              const isMirrorPOS =
                sw.id === 'software-mirrorpos' ||
                sw.title.toLowerCase().includes('mirrorpos');
              const cardIcon = sw.iconUrl || sw.thumbnailUrl || (isMirrorPOS ? '/mirror-pos-icon.png' : '');
              const showImg = Boolean(cardIcon) && !brokenImages[sw.id];
              const directLaunchHref =
                sw.launchUrl ||
                `/api/software/access?productId=${encodeURIComponent(sw.id)}&mode=launch&go=1`;

              if (isFreeSoftware) {
                return (
                  <div
                    key={sw.id}
                    className="glossy-card glossy-card-hover p-5 min-w-0 flex flex-col justify-between h-full group"
                  >
                    <div className="min-w-0">
                      {/* Compact Identity Row */}
                      <div className="flex items-start gap-3.5 mb-3.5">
                        <div className="w-12 h-12 rounded-xl bg-[#0B0D0C] border border-white/[0.12] p-2 flex items-center justify-center shrink-0 overflow-hidden">
                          {showImg ? (
                            <img
                              src={cardIcon}
                              alt={`${sw.title} Icon`}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setBrokenImages((prev) => ({ ...prev, [sw.id]: true }))
                              }
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Monitor size={20} className="text-[#B7F34A]" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B7F34A]">
                              FREE
                            </span>
                            <span className="text-[11px] text-[#A1AAA2] truncate">
                              {sw.category}
                            </span>
                          </div>
                          <h3 className="font-display text-lg font-bold text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors leading-snug truncate">
                            {sw.title}
                          </h3>
                        </div>
                      </div>

                      {/* Concise Short Description */}
                      <p className="text-xs text-[#A1AAA2] leading-relaxed line-clamp-2 mb-5">
                        {sw.description || (isMirrorPOS ? 'Smart POS Software' : 'Free MirrorBook Utility')}
                      </p>
                    </div>

                    {/* Balanced Primary + Secondary Actions */}
                    <div className="pt-4 border-t border-white/[0.09] space-y-2">
                      <button
                        type="button"
                        onClick={() => setSelectedFreeProduct(sw)}
                        className="w-full min-h-[44px] py-2.5 px-4 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download size={14} />
                        <span>{isMirrorPOS ? 'Get MirrorPOS' : `Get ${sw.title}`}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <a
                          href={directLaunchHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-h-[40px] py-2 px-3 text-xs font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Launch / Download</span>
                          <ExternalLink size={12} />
                        </a>
                        {isMirrorPOS && onOpenMirrorPOS && (
                          <button
                            type="button"
                            onClick={onOpenMirrorPOS}
                            className="min-h-[40px] px-3 py-2 text-[11px] font-medium text-[#A1AAA2] hover:text-[#F5F7F2] rounded-xl border border-white/[0.09] hover:border-white/25 transition-colors cursor-pointer whitespace-nowrap"
                            title="View MirrorPOS overview"
                          >
                            Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Paid Software Card
              const thumbUrl = sw.thumbnailUrl || sw.iconUrl || '';
              const showPaidImg = Boolean(thumbUrl) && !brokenImages[sw.id];

              return (
                <div
                  key={sw.id}
                  className="glossy-card glossy-card-hover p-4 sm:p-5 min-w-0 flex flex-col justify-between h-full group"
                >
                  <div className="min-w-0">
                    {/* Visual Thumbnail */}
                    <div className="aspect-video w-full rounded-xl bg-[#0B0D0C] border border-white/[0.09] mb-4 overflow-hidden relative group-hover:border-[#B7F34A]/40 transition-colors flex flex-col justify-between p-3">
                      {showPaidImg ? (
                        <img
                          src={thumbUrl}
                          alt={`${sw.title} – ${sw.category} Software by MirrorBook`}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setBrokenImages((prev) => ({ ...prev, [sw.id]: true }))
                          }
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#121614]">
                          <Layers size={22} className="text-[#B7F34A]/70" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D0C]/85 via-transparent to-[#0B0D0C]/35 pointer-events-none" />

                      <div className="relative z-10 flex items-center justify-between text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-[#0B0D0C]/85 text-[#B7F34A] font-semibold border border-[#B7F34A]/30 flex items-center gap-1">
                          {sw.category.includes('PC') ? <Monitor size={10} /> : <Smartphone size={10} />}
                          <span>{sw.category}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-[#B7F34A] font-semibold mb-1 truncate">
                      {sw.category}
                    </div>

                    <h3 className="font-display text-base sm:text-lg font-bold text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors mb-1.5 leading-snug break-words">
                      {sw.title}
                    </h3>

                    <p className="text-xs text-[#A1AAA2] line-clamp-3 leading-relaxed mb-4">
                      {sw.description}
                    </p>
                  </div>

                  <div>
                    <div className="pt-4 border-t border-white/[0.09] flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-[#A1AAA2]">
                        <ShieldCheck size={13} className="text-[#B7F34A]" />
                        <span>Protected License</span>
                      </div>
                      <span className="font-display text-xl font-bold text-[#F5F7F2] tabular-nums">
                        {sw.priceDisplay || `৳${sw.price.toLocaleString()}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onBuyItem({
                          id: sw.id,
                          name: sw.title,
                          price: sw.priceDisplay || `৳${sw.price}`,
                          category: `Software (${sw.category})`,
                        })
                      }
                      className="w-full min-h-[44px] py-3 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag size={14} />
                      <span>Get License</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Free Software Access Modal (Never Checkout) */}
      {selectedFreeProduct && (
        <div
          className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[#0B0D0C]/85 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="free-software-modal-title"
        >
          <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-4 py-4 sm:py-6">
            <div className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col overflow-hidden my-auto glossy-card border border-white/[0.12] rounded-2xl shadow-2xl">
              {/* Sticky Header */}
              <div className="shrink-0 bg-[#171C19] px-5 py-4 border-b border-white/[0.09] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#0B0D0C] border border-white/[0.12] p-1.5 flex items-center justify-center shrink-0">
                    <img
                      src={
                        selectedFreeProduct.iconUrl ||
                        selectedFreeProduct.thumbnailUrl ||
                        '/mirror-pos-icon.png'
                      }
                      alt={selectedFreeProduct.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-[#B7F34A] uppercase tracking-wider block">
                      Free Software Access
                    </span>
                    <h3
                      id="free-software-modal-title"
                      className="font-display text-base font-bold text-[#F5F7F2] truncate"
                    >
                      {selectedFreeProduct.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFreeProduct(null)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#A1AAA2] hover:text-[#F5F7F2] hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">
                <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
                  {selectedFreeProduct.title} is completely free — no checkout or payment required. Receive the direct download &amp; setup link straight in your inbox or launch immediately.
                </p>

                {accessError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 flex items-start gap-2.5">
                    <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                    <span className="break-words">{accessError}</span>
                  </div>
                )}

                {accessSuccess ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 size={18} className="text-[#B7F34A] shrink-0 mt-0.5" />
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs font-bold text-[#F5F7F2]">
                          Download Link Sent!
                        </p>
                        <p className="text-xs text-[#A1AAA2] break-words">
                          {accessSuccess.message}
                        </p>
                        <p className="text-[11px] font-mono text-[#B7F34A]">
                          Ref: {accessSuccess.referenceId}
                        </p>
                      </div>
                    </div>

                    <a
                      href={
                        selectedFreeProduct.launchUrl ||
                        `/api/software/access?productId=${encodeURIComponent(selectedFreeProduct.id)}&mode=download&go=1`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[44px] py-2.5 px-4 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2"
                    >
                      <span>Launch / Download {selectedFreeProduct.title}</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                ) : user ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-[#0B0D0C]/80 border border-white/[0.09] space-y-1">
                      <span className="text-[11px] text-[#A1AAA2] block">
                        Signed in as
                      </span>
                      <div className="text-xs font-semibold text-[#F5F7F2] break-all">
                        {user.email}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={sendingAccess}
                      onClick={() => handleRequestFreeAccess()}
                      className="w-full min-h-[44px] py-3 px-4 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {sendingAccess ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Sending Download Link...</span>
                        </>
                      ) : (
                        <>
                          <Mail size={14} />
                          <span>Send Download Link to My Email</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRequestFreeAccess} className="space-y-3.5">
                    {onOpenSignIn && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFreeProduct(null);
                          onOpenSignIn();
                        }}
                        className="w-full min-h-[44px] py-2.5 px-4 text-xs font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <UserIcon size={14} className="text-[#B7F34A]" />
                        <span>Sign In / Continue with Google</span>
                      </button>
                    )}

                    <div className="relative flex items-center py-1">
                      <div className="flex-grow border-t border-white/[0.09]" />
                      <span className="px-3 text-[11px] text-[#707A72]">or send link to email</span>
                      <div className="flex-grow border-t border-white/[0.09]" />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#A1AAA2] block mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-3.5 py-2.5 text-base sm:text-xs bg-[#0B0D0C] border border-white/[0.12] rounded-xl text-[#F5F7F2] placeholder:text-[#707A72] focus:border-[#B7F34A] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#A1AAA2] block mb-1.5">
                        Your Name (optional)
                      </label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Rahim Store"
                        className="w-full px-3.5 py-2.5 text-base sm:text-xs bg-[#0B0D0C] border border-white/[0.12] rounded-xl text-[#F5F7F2] placeholder:text-[#707A72] focus:border-[#B7F34A] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sendingAccess}
                      className="w-full min-h-[44px] py-3 px-4 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {sendingAccess ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Sending Link...</span>
                        </>
                      ) : (
                        <>
                          <Mail size={14} />
                          <span>Send Download Link</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {!accessSuccess && (
                  <div className="pt-3 border-t border-white/[0.09] flex items-center justify-between gap-3">
                    <a
                      href={
                        selectedFreeProduct.launchUrl ||
                        `/api/software/access?productId=${encodeURIComponent(selectedFreeProduct.id)}&mode=launch&go=1`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[42px] py-2.5 px-4 text-xs font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-2"
                    >
                      <span>Launch / Download Directly</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

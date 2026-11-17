import React, { useState } from 'react';
import { AppUser, CheckoutItem, ProductItem } from '../types';
import {
  Monitor,
  Smartphone,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
  ArrowRight,
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
  embedded?: boolean;
}

export const SoftwareStore: React.FC<SoftwareStoreProps> = ({
  softwareList = [],
  loading = false,
  onBuyItem,
  onOpenMirrorPOS,
  embedded = false,
}) => {
  const [platformFilter, setPlatformFilter] = useState<'All' | 'PC & Mac' | 'Android & iOS'>('All');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [mirrorPosShotFailed, setMirrorPosShotFailed] = useState(false);

  const activeSoftware = softwareList.filter(
    (s) => s.type === 'Software' && s.status !== 'draft' && s.status !== 'archived'
  );

  const filtered = activeSoftware.filter((s) => {
    if (platformFilter === 'All') return true;
    return s.category.toLowerCase().includes(platformFilter.toLowerCase());
  });

  const WrapperTag = embedded ? 'div' : 'section';

  return (
    <WrapperTag
      id="software"
      className={
        embedded
          ? 'scroll-mt-24 text-[#F5F7F2] relative'
          : 'scroll-mt-20 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#121614] text-[#F5F7F2] border-b border-white/[0.09] relative overflow-x-clip'
      }
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-5 border-b border-white/[0.09]">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-[#B7F34A] block mb-2">
              MirrorBook Software Products
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F7F2] tracking-tight">
              Software Library
            </h3>
            <p className="text-xs sm:text-sm text-[#A1AAA2] mt-1.5 max-w-xl leading-relaxed">
              Explore powerful software solutions developed by MirrorBook.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {[1, 2].map((idx) => (
              <div key={idx} className="glossy-card p-5 space-y-4 animate-pulse">
                <div className="aspect-video w-full rounded-xl bg-white/[0.06]" />
                <div className="h-5 w-40 rounded bg-white/[0.08]" />
                <div className="h-4 w-full rounded bg-white/[0.06]" />
                <div className="h-11 w-full rounded-xl bg-white/[0.08]" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glossy-card p-8 sm:p-12 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-[#B7F34A] mx-auto mb-4">
              <Layers size={22} />
            </div>
            <h4 className="font-display text-lg sm:text-xl font-bold text-[#F5F7F2] mb-2">
              No Software Available Right Now
            </h4>
            <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
              Software applications published in the MirrorBook catalog will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
            {filtered.map((sw) => {
              const isFreeSoftware = sw.isFree === true || Number(sw.price) === 0;
              const isMirrorPOS =
                sw.id === 'software-mirrorpos' ||
                sw.title.toLowerCase().includes('mirrorpos');

              if (isMirrorPOS) {
                const previewSrc = mirrorPosShotFailed
                  ? '/mirrorpos-shot-1.png'
                  : 'https://i.ibb.co/XfQDsJGq/Screenshot-2026-11-16-153436.png';
                const launchHref = sw.launchUrl || 'https://mirror-pos.vercel.app/';

                return (
                  <div
                    key={sw.id}
                    className="glossy-card glossy-card-hover p-5 sm:p-6 min-w-0 flex flex-col justify-between h-full group md:col-span-2 lg:col-span-2 border-[#B7F34A]/25"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                      {/* Software Preview Screenshot */}
                      <div className="md:col-span-6 min-w-0">
                        <div className="aspect-video w-full rounded-xl bg-[#0B0D0C] border border-white/[0.1] overflow-hidden relative group-hover:border-[#B7F34A]/45 transition-colors">
                          <img
                            src={previewSrc}
                            alt="MirrorPOS Smart POS Software Interface Preview"
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={() => {
                              if (!mirrorPosShotFailed) setMirrorPosShotFailed(true);
                            }}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D0C]/75 via-transparent to-transparent pointer-events-none" />
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#0B0D0C]/90 border border-[#B7F34A]/40 text-[10px] font-bold uppercase tracking-wider text-[#B7F34A]">
                            Desktop POS Software
                          </span>
                        </div>
                      </div>

                      {/* Identity & Details */}
                      <div className="md:col-span-6 min-w-0 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[#0B0D0C] border border-white/[0.12] p-2 flex items-center justify-center shrink-0 overflow-hidden">
                              <img
                                src={sw.iconUrl || '/mirror-pos-icon.png'}
                                alt="MirrorPOS Logo"
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] font-semibold text-[#B7F34A] block">
                                Developed by MirrorBook
                              </span>
                              <h4 className="font-display text-xl sm:text-2xl font-bold text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors leading-tight">
                                {sw.title}
                              </h4>
                            </div>
                          </div>

                          <p className="text-sm font-semibold text-[#F5F7F2] leading-snug">
                            Smart POS Software for Modern Businesses.
                          </p>

                          <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
                            {sw.description ||
                              'Offline-first billing, inventory management, customer & supplier ledgers, expense tracking, and analytics synced online.'}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-white/[0.09] flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenMirrorPOS) {
                                onOpenMirrorPOS();
                              } else {
                                window.location.href = '/mirrorpos';
                              }
                            }}
                            className="flex-1 min-w-[140px] min-h-[44px] py-2.5 px-5 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>Get Access</span>
                            <ArrowRight size={14} />
                          </button>

                          <a
                            href={launchHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[44px] py-2.5 px-4 text-xs font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap"
                          >
                            <span>Launch App</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // Generic Free or Paid Software Card
              const thumbUrl = sw.thumbnailUrl || sw.iconUrl || '';
              const showImg = Boolean(thumbUrl) && !brokenImages[sw.id];
              const launchHref =
                sw.launchUrl ||
                `/api/software/access?productId=${encodeURIComponent(sw.id)}&mode=launch&go=1`;

              return (
                <div
                  key={sw.id}
                  className="glossy-card glossy-card-hover p-5 min-w-0 flex flex-col justify-between h-full group"
                >
                  <div className="min-w-0">
                    <div className="aspect-video w-full rounded-xl bg-[#0B0D0C] border border-white/[0.09] mb-4 overflow-hidden relative group-hover:border-[#B7F34A]/40 transition-colors flex flex-col justify-between p-3">
                      {showImg ? (
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
                      Developed by MirrorBook
                    </div>

                    <h4 className="font-display text-base sm:text-lg font-bold text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors mb-1.5 leading-snug break-words">
                      {sw.title}
                    </h4>

                    <p className="text-xs text-[#A1AAA2] line-clamp-3 leading-relaxed mb-4">
                      {sw.description}
                    </p>
                  </div>

                  <div>
                    <div className="pt-4 border-t border-white/[0.09] flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-[#A1AAA2]">
                        <ShieldCheck size={13} className="text-[#B7F34A]" />
                        <span>{isFreeSoftware ? 'Lifetime Access' : 'Protected License'}</span>
                      </div>
                      <span className="font-display text-xl font-bold text-[#F5F7F2] tabular-nums">
                        {isFreeSoftware ? 'Free' : sw.priceDisplay || `৳${sw.price.toLocaleString()}`}
                      </span>
                    </div>

                    {isFreeSoftware ? (
                      <a
                        href={launchHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full min-h-[44px] py-3 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Get Access</span>
                        <ExternalLink size={14} />
                      </a>
                    ) : (
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
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </WrapperTag>
  );
};

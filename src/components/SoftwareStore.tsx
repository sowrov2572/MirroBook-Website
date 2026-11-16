import React, { useState } from 'react';
import { CheckoutItem, ProductItem } from '../types';
import { Monitor, Smartphone, ShieldCheck, ShoppingBag, ArrowRight, Layers } from 'lucide-react';

interface SoftwareStoreProps {
  softwareList?: ProductItem[];
  onBuyItem: (item: CheckoutItem) => void;
  onOpenMirrorPOS?: () => void;
}

export const SoftwareStore: React.FC<SoftwareStoreProps> = ({
  softwareList = [],
  onBuyItem,
  onOpenMirrorPOS,
}) => {
  const [platformFilter, setPlatformFilter] = useState<'All' | 'PC & Mac' | 'Android & iOS'>('All');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const showMirrorPOS = platformFilter === 'All' || platformFilter === 'PC & Mac';

  const filtered = softwareList.filter((s) => {
    if (platformFilter === 'All') return true;
    return s.category.toLowerCase().includes(platformFilter.toLowerCase());
  });

  return (
    <section
      id="software"
      className="py-16 sm:py-20 px-5 sm:px-6 lg:px-8 bg-[#121614] text-[#F5F7F2] border-b border-white/[0.09] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-5 border-b border-white/[0.09]">
          <div>
            <span className="text-xs font-semibold text-[#B7F34A] block mb-2">
              MirrorBook Software Products
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F7F2] tracking-tight">
              Software Library
            </h2>
            <p className="text-xs sm:text-sm text-[#A1AAA2] mt-2 max-w-xl leading-relaxed">
              Business and creative software products developed by MirrorBook for Windows, macOS, Web, Android, and iOS.
            </p>
          </div>

          {/* Segmented Glass Filter Tabs */}
          <div className="glass-tab-bar flex flex-wrap items-center gap-1 self-start md:self-auto">
            {(['All', 'PC & Mac', 'Android & iOS'] as const).map((filter) => {
              const isActive = platformFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setPlatformFilter(filter)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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

        {/* Featured MirrorBook Software Product: MirrorPOS */}
        {showMirrorPOS && (
          <div className="mb-10 glossy-card hover:border-[#B7F34A]/35 p-6 sm:p-8 lg:p-10 transition-colors">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left: Product Identity under MirrorBook Brand */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-[#0B0D0C] border border-white/[0.12] p-3 flex items-center justify-center shrink-0">
                    <img
                      src="/mirror-pos-icon.png"
                      alt="MirrorPOS Official App Icon"
                      width={64}
                      height={64}
                      loading="eager"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#B7F34A] font-semibold mb-1">
                      <span>Developed by MirrorBook</span>
                      <span aria-hidden="true" className="text-[#707A72]">·</span>
                      <span className="text-[#A1AAA2] font-normal">Official Product</span>
                    </div>
                    <h3 className="font-display text-2xl sm:text-4xl font-bold text-[#F5F7F2] tracking-tight leading-none">
                      MirrorPOS
                    </h3>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-base sm:text-lg font-semibold text-[#F5F7F2]">
                    Smart POS Software for Modern Businesses.
                  </p>
                  <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed max-w-2xl">
                    Built by MirrorBook to streamline retail billing, inventory control, customer credit ledgers, daily expenses, and cloud-synced business operations from a single workspace.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <a
                    href="https://mirrorbook.site/mirrorpos"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenMirrorPOS?.();
                    }}
                    className="px-7 py-3.5 rounded-xl glossy-btn text-xs inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>Explore MirrorPOS</span>
                    <ArrowRight size={15} />
                  </a>

                  <span className="text-xs text-[#A1AAA2] whitespace-nowrap">
                    Desktop · Cloud Sync · Thermal Receipts
                  </span>
                </div>
              </div>

              {/* Right: 6 Core Highlighted Features */}
              <div className="lg:col-span-5 bg-[#0B0D0C]/75 border border-white/[0.09] rounded-xl p-5 sm:p-6">
                <div className="text-xs font-semibold text-[#B7F34A] mb-4">
                  Key Capabilities
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  {[
                    'Offline billing support',
                    'Online data synchronization',
                    'Inventory management',
                    'Sales and expense tracking',
                    'Customer management',
                    'Smart business reporting',
                  ].map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-xs sm:text-sm text-[#F5F7F2]">
                      <ShieldCheck size={15} className="text-[#B7F34A] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Additional Software Items Grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {filtered.map((sw) => {
              const showImg = sw.thumbnailUrl && !brokenImages[sw.id];
              return (
                <div
                  key={sw.id}
                  className="glossy-card glossy-card-hover p-5 sm:p-6 flex flex-col justify-between h-full group"
                >
                  <div>
                    {/* Visual Thumbnail */}
                    <div className="aspect-video w-full rounded-xl bg-[#0B0D0C] border border-white/[0.09] mb-4 overflow-hidden relative group-hover:border-[#B7F34A]/40 transition-colors flex flex-col justify-between p-3">
                      {showImg ? (
                        <img
                          src={sw.thumbnailUrl}
                          alt={`${sw.title} – ${sw.category} Creative Software by MirrorBook Studio`}
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

                    {/* Software Category */}
                    <div className="text-xs text-[#B7F34A] font-semibold mb-1">
                      {sw.category}
                    </div>

                    {/* Title */}
                    <h3 className="font-display text-base sm:text-lg font-bold text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors mb-1.5 leading-snug">
                      {sw.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-[#A1AAA2] line-clamp-3 leading-relaxed mb-4">
                      {sw.description}
                    </p>
                  </div>

                  <div>
                    <div className="pt-4 border-t border-white/[0.09] flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-[#A1AAA2]">
                        <ShieldCheck size={13} className="text-[#B7F34A]" />
                        <span>Protected License</span>
                      </div>
                      <span className="font-display text-xl font-bold text-[#F5F7F2] tabular-nums">
                        {sw.priceDisplay || `৳${sw.price}`}
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
                      className="w-full py-3 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
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
    </section>
  );
};

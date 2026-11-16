import React, { useState } from 'react';
import { CheckoutItem, ProductItem } from '../types';
import { Monitor, Smartphone, ShieldCheck, ShoppingBag, ArrowRight } from 'lucide-react';

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

  const showMirrorPOS = platformFilter === 'All' || platformFilter === 'PC & Mac';

  const filtered = softwareList.filter((s) => {
    if (platformFilter === 'All') return true;
    return s.category.toLowerCase().includes(platformFilter.toLowerCase());
  });

  return (
    <section id="software" className="py-20 px-6 bg-[#080808] text-white border-b border-white/[0.08] relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 text-[#71B913] text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Production Tools &amp; Utilities</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">
              Software Library
            </h2>
            <p className="text-xs sm:text-sm text-[#888888] mt-2 max-w-xl">
              Engineered software and creative utilities for Windows, macOS, Android, and iOS devices.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
            {(['All', 'PC & Mac', 'Android & iOS'] as const).map((filter) => {
              const isActive = platformFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setPlatformFilter(filter)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#71B913] text-black font-bold'
                      : 'bg-white/5 border border-white/10 text-[#888888] hover:text-white'
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

        {/* Compact Software Grid (Scales cleanly as more software is uploaded) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Compact MirrorPOS Featured Card (Icon-first, opens /mirrorpos details page) */}
          {showMirrorPOS && (
            <div
              onClick={() => onOpenMirrorPOS?.()}
              className="glossy-card glossy-card-hover p-6 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                {/* Clean App Icon Display Only */}
                <div className="aspect-video w-full rounded-xl bg-black/70 border border-white/10 mb-5 overflow-hidden flex items-center justify-center group-hover:border-[#71B913]/50 transition-colors p-4">
                  <img
                    src="/mirror-pos-icon.png"
                    alt="MirrorPOS Official App Icon"
                    width={64}
                    height={64}
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Category */}
                <div className="text-[11px] uppercase tracking-normal text-[#71B913] font-semibold mb-1">
                  Windows · Cloud POS
                </div>

                {/* Title */}
                <h3 className="font-display text-base font-bold text-white group-hover:text-[#71B913] transition-colors mb-1.5 leading-snug">
                  MirrorPOS
                </h3>

                {/* Exact Requested Short Description */}
                <p className="text-xs text-[#888888] line-clamp-3 leading-relaxed mb-4 font-light">
                  A smart Point of Sale software designed to manage sales, inventory, customers, and business operations.
                </p>
              </div>

              <div>
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between mb-5">
                  <div className="flex items-center gap-1 text-[11px] text-[#777777]">
                    <Monitor size={12} className="text-[#71B913]" />
                    <span>Desktop &amp; Web App</span>
                  </div>
                  <span className="text-xs font-bold text-[#71B913]">
                    MirrorBook
                  </span>
                </div>

                <a
                  href="/mirrorpos"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenMirrorPOS?.();
                  }}
                  className="w-full py-3 text-xs font-bold uppercase tracking-normal glossy-btn rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Learn More</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
          )}

          {/* Additional Software Items */}
          {filtered.map((sw) => (
            <div
              key={sw.id}
              className="glossy-card glossy-card-hover p-6 flex flex-col justify-between group"
            >
              <div>
                {/* Visual Thumbnail */}
                <div className="aspect-video w-full rounded-xl bg-black/60 border border-white/10 mb-5 overflow-hidden relative group-hover:border-[#71B913]/50 transition-colors flex flex-col justify-between p-3 shadow-inner">
                  {sw.thumbnailUrl ? (
                    <img
                      src={sw.thumbnailUrl}
                      alt={`${sw.title} – ${sw.category} Creative Software by MirrorBook Studio`}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-black/80 text-[#71B913] font-semibold border border-[#71B913]/30 flex items-center gap-1">
                      {sw.category.includes('PC') ? <Monitor size={10} /> : <Smartphone size={10} />}
                      {sw.category}
                    </span>
                    <span className="text-white/80 font-mono text-[9px]">Verified</span>
                  </div>
                </div>

                {/* Software Category */}
                <div className="text-[11px] uppercase tracking-normal text-[#71B913] font-semibold mb-1">
                  {sw.category}
                </div>

                {/* Title */}
                <h3 className="font-display text-base font-bold text-white group-hover:text-[#71B913] transition-colors mb-1.5 leading-snug">
                  {sw.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-[#888888] line-clamp-3 leading-relaxed mb-4 font-light">
                  {sw.description}
                </p>
              </div>

              <div>
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between mb-5">
                  <div className="flex items-center gap-1 text-[11px] text-[#777777]">
                    <ShieldCheck size={12} className="text-[#71B913]" />
                    <span>Protected License</span>
                  </div>
                  <span className="font-display text-xl font-bold text-white tabular-nums">
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
                  className="w-full py-3 text-xs font-bold uppercase tracking-normal glossy-btn rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <ShoppingBag size={14} />
                  <span>Get License</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

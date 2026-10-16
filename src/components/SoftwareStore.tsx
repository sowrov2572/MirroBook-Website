import React, { useState } from 'react';
import { CheckoutItem, ProductItem } from '../types';
import { Monitor, Smartphone, Download, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';

interface SoftwareStoreProps {
  softwareList?: ProductItem[];
  onBuyItem: (item: CheckoutItem) => void;
}

export const SoftwareStore: React.FC<SoftwareStoreProps> = ({ softwareList = [], onBuyItem }) => {
  const [platformFilter, setPlatformFilter] = useState<'All' | 'PC & Mac' | 'Android & iOS'>('All');

  const filtered = softwareList.filter((s) => {
    if (platformFilter === 'All') return true;
    return s.category.toLowerCase().includes(platformFilter.toLowerCase());
  });

  return (
    <section id="software" className="py-24 px-6 bg-[#080808] text-white border-b border-white/[0.08] relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/3 left-10 w-[500px] h-[500px] bg-[#71B913]/[0.06] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#71B913]/10 border border-[#71B913]/25 text-[#71B913] text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles size={12} />
              <span>Production Tools &amp; Utilities</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              Software Library
            </h2>
            <p className="text-xs sm:text-sm text-[#888888] mt-2 max-w-xl">
              Engineered software and creative utilities for Windows, macOS, Android, and iOS devices with instant one-time verified activation.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
            {(['All', 'PC & Mac', 'Android & iOS'] as const).map((filter) => {
              const isActive = platformFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setPlatformFilter(filter)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#71B913] text-black shadow-[0_0_20px_rgba(113,185,19,0.35)]'
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

        {/* Software Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      alt={sw.title}
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

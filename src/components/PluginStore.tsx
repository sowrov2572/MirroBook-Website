import React, { useState } from 'react';
import { CheckoutItem, ProductItem } from '../types';
import { ShoppingBag, Terminal, Layers } from 'lucide-react';

interface PluginStoreProps {
  onBuyItem: (item: CheckoutItem) => void;
  plugins?: ProductItem[];
}

export const PluginStore: React.FC<PluginStoreProps> = ({ onBuyItem, plugins = [] }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const sourcePlugins = plugins.map((p) => ({
    id: p.id,
    title: p.title,
    software: p.category,
    price: p.price,
    priceDisplay: p.priceDisplay || `৳${p.price.toLocaleString()}`,
    thumbnailUrl: p.thumbnailUrl,
    description: p.description,
  }));

  const categories = Array.from(new Set(sourcePlugins.map((p) => p.software)));
  const filterOptions = ['All', ...categories];

  const filteredPlugins = sourcePlugins.filter((plugin) => {
    if (selectedFilter === 'All') return true;
    return plugin.software.toLowerCase().includes(selectedFilter.toLowerCase());
  });

  return (
    <section
      id="plugins"
      className="py-16 sm:py-20 px-5 sm:px-6 lg:px-8 bg-[#0B0D0C] text-[#F5F7F2] bg-grid-subtle border-b border-white/[0.09] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Aligned Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-5 border-b border-white/[0.09]">
          <div>
            <span className="text-xs font-semibold text-[#B7F34A] block mb-2">
              Creator Extensions
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F7F2] tracking-tight">
              Plugin Store
            </h2>
          </div>

          {/* Segmented Glass Filter Tabs */}
          {sourcePlugins.length > 0 && (
            <div className="glass-tab-bar flex flex-wrap items-center gap-1 self-start md:self-auto">
              {filterOptions.map((filter) => {
                const isActive = selectedFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold shadow-sm'
                        : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredPlugins.length === 0 ? (
          <div className="glossy-card p-10 sm:p-14 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-[#B7F34A] mx-auto mb-4">
              <Layers size={22} />
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#F5F7F2] mb-2">
              No Plugins Available Right Now
            </h3>
            <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
              New Adobe Premiere Pro, After Effects, and Photoshop plugins uploaded to the store will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {filteredPlugins.map((plugin) => {
              const showImg = plugin.thumbnailUrl && !brokenImages[plugin.id];
              return (
                <div
                  key={plugin.id}
                  className="glossy-card glossy-card-hover p-5 sm:p-6 flex flex-col justify-between h-full group"
                >
                  <div>
                    {/* Visual Thumbnail */}
                    <div className="aspect-video w-full rounded-xl bg-[#0B0D0C] border border-white/[0.09] mb-4 overflow-hidden relative group-hover:border-[#B7F34A]/40 transition-colors flex flex-col justify-between p-3">
                      {showImg ? (
                        <img
                          src={plugin.thumbnailUrl}
                          alt={`${plugin.title} – ${plugin.software} Plugin by MirrorBook`}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setBrokenImages((prev) => ({ ...prev, [plugin.id]: true }))
                          }
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-[11px] text-[#A1AAA2]">
                            <span className="flex items-center gap-1 text-[#B7F34A] font-medium">
                              <Terminal size={11} /> EXT
                            </span>
                            <span className="truncate max-w-[110px]">{plugin.software}</span>
                          </div>

                          <div className="py-2 text-center">
                            <div className="w-9 h-9 rounded-lg bg-[#171C19] border border-white/[0.09] mx-auto flex items-center justify-center text-[#B7F34A]">
                              <Layers size={18} />
                            </div>
                          </div>

                          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="w-2/3 h-full bg-[#B7F34A]" />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Software Label */}
                    <div className="text-xs text-[#B7F34A] font-semibold mb-1">
                      {plugin.software}
                    </div>

                    {/* Title */}
                    <h3 className="font-display text-base sm:text-lg font-bold text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors mb-1.5 leading-snug">
                      {plugin.title}
                    </h3>

                    {/* Subtitle */}
                    {plugin.description && (
                      <p className="text-xs text-[#A1AAA2] line-clamp-2 leading-relaxed mb-4">
                        {plugin.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="pt-4 border-t border-white/[0.09] flex items-center justify-between mb-4">
                      <span className="text-xs text-[#A1AAA2] font-medium">
                        Instant License
                      </span>
                      <span className="font-display text-xl font-bold text-[#F5F7F2] tabular-nums">
                        {plugin.priceDisplay}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onBuyItem({
                          id: plugin.id,
                          name: plugin.title,
                          price: plugin.priceDisplay,
                          category: `Plugin (${plugin.software})`,
                        })
                      }
                      className="w-full py-3 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag size={14} />
                      <span>Buy Now</span>
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

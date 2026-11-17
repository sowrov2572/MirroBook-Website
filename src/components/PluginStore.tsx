import React, { useState } from 'react';
import { CheckoutItem, ProductItem } from '../types';
import { ShoppingBag, Terminal, Layers } from 'lucide-react';

interface PluginStoreProps {
  onBuyItem: (item: CheckoutItem) => void;
  plugins?: ProductItem[];
  loading?: boolean;
  embedded?: boolean;
}

const DEFAULT_PLUGIN_CATEGORIES = [
  'All',
  'After Effects',
  'Premiere Pro',
  'Video Editing Extensions',
  'Motion Graphics Tools',
  'Other Creative Plugins',
];

export const PluginStore: React.FC<PluginStoreProps> = ({
  onBuyItem,
  plugins = [],
  loading = false,
  embedded = false,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const sourcePlugins = plugins
    .filter((p) => p.type === 'Plugin' && p.status !== 'draft' && p.status !== 'archived')
    .map((p) => ({
      id: p.id,
      title: p.title,
      software: p.category || 'Creative Plugin',
      price: p.price,
      priceDisplay: p.priceDisplay || `৳${p.price.toLocaleString()}`,
      thumbnailUrl: p.thumbnailUrl,
      description: p.description,
    }));

  const dynamicCategories = Array.from(new Set(sourcePlugins.map((p) => p.software)));
  const filterOptions =
    dynamicCategories.length > 0
      ? ['All', ...dynamicCategories]
      : DEFAULT_PLUGIN_CATEGORIES;

  const filteredPlugins = sourcePlugins.filter((plugin) => {
    if (selectedFilter === 'All') return true;
    return plugin.software.toLowerCase().includes(selectedFilter.toLowerCase());
  });

  const WrapperTag = embedded ? 'div' : 'section';

  return (
    <WrapperTag
      id="plugins"
      className={
        embedded
          ? 'scroll-mt-24 text-[#F5F7F2] relative'
          : 'scroll-mt-20 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#0B0D0C] text-[#F5F7F2] bg-grid-subtle border-b border-white/[0.09] relative overflow-x-clip'
      }
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Aligned Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-5 border-b border-white/[0.09]">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-[#B7F34A] block mb-2">
              Creator Extensions
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F7F2] tracking-tight">
              Plugin Library
            </h3>
            <p className="text-xs sm:text-sm text-[#A1AAA2] mt-1.5 max-w-xl leading-relaxed">
              Discover premium plugins, extensions and creative tools.
            </p>
          </div>

          {/* Segmented Glass Filter Tabs */}
          <div className="glass-tab-bar flex items-center gap-1 self-start md:self-auto max-w-full overflow-x-auto no-scrollbar">
            {filterOptions.map((filter) => {
              const isActive = selectedFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedFilter(filter)}
                  className={`min-h-[36px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="glossy-card p-5 space-y-4 animate-pulse"
              >
                <div className="aspect-video w-full rounded-xl bg-white/[0.06]" />
                <div className="h-3 w-20 rounded bg-white/[0.08]" />
                <div className="h-5 w-3/4 rounded bg-white/[0.08]" />
                <div className="h-10 w-full rounded-xl bg-white/[0.06]" />
              </div>
            ))}
          </div>
        ) : filteredPlugins.length === 0 ? (
          <div className="glossy-card p-8 sm:p-12 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-[#B7F34A] mx-auto mb-4">
              <Layers size={22} />
            </div>
            <h4 className="font-display text-lg sm:text-xl font-bold text-[#F5F7F2] mb-2">
              {selectedFilter === 'All'
                ? 'No Plugins Available Right Now'
                : `No ${selectedFilter} Listed Yet`}
            </h4>
            <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
              After Effects plugins, Premiere Pro plugins, Video Editing Extensions, Motion Graphics Tools, and Other Creative Plugins published to the Plugin Library will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
            {filteredPlugins.map((plugin) => {
              const showImg = plugin.thumbnailUrl && !brokenImages[plugin.id];
              return (
                <div
                  key={plugin.id}
                  className="glossy-card glossy-card-hover p-4 sm:p-5 min-w-0 flex flex-col justify-between h-full group"
                >
                  <div className="min-w-0">
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
                    <div className="text-xs text-[#B7F34A] font-semibold mb-1 truncate">
                      {plugin.software}
                    </div>

                    {/* Title */}
                    <h4 className="font-display text-base sm:text-lg font-bold text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors mb-1.5 leading-snug break-words">
                      {plugin.title}
                    </h4>

                    {/* Subtitle */}
                    {plugin.description && (
                      <p className="text-xs text-[#A1AAA2] line-clamp-2 leading-relaxed mb-4">
                        {plugin.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="pt-4 border-t border-white/[0.09] flex items-center justify-between gap-2 mb-4">
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
                      className="w-full min-h-[44px] py-3 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
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
    </WrapperTag>
  );
};

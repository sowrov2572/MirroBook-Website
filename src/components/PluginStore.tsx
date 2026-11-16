import React, { useState } from 'react';
import { CheckoutItem, ProductItem } from '../types';
import { ShoppingBag, Terminal, Layers } from 'lucide-react';

interface PluginStoreProps {
  onBuyItem: (item: CheckoutItem) => void;
  plugins?: ProductItem[];
}

export const PluginStore: React.FC<PluginStoreProps> = ({ onBuyItem, plugins = [] }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const sourcePlugins = plugins.map((p) => ({
    id: p.id,
    title: p.title,
    software: p.category,
    price: p.price,
    priceDisplay: p.priceDisplay || `৳${p.price.toLocaleString()}`,
    thumbnailUrl: p.thumbnailUrl,
    description: p.description,
  }));

  // Dynamically extract categories
  const categories = Array.from(new Set(sourcePlugins.map((p) => p.software)));
  const filterOptions = ['All', ...categories];

  const filteredPlugins = sourcePlugins.filter((plugin) => {
    if (selectedFilter === 'All') return true;
    return plugin.software.toLowerCase().includes(selectedFilter.toLowerCase());
  });

  return (
    <section id="plugins" className="py-20 px-6 bg-[#070707] text-white bg-grid-subtle border-b border-white/[0.08] relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header: Strictly "Plugin Store" */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-white/[0.08]">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
              Plugin Store
            </h2>
          </div>

          {/* Filter Pills (Only when plugins exist) */}
          {sourcePlugins.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
              {filterOptions.map((filter) => {
                const isActive = selectedFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#71B913] text-black font-bold'
                        : 'bg-white/5 border border-white/10 text-[#888888] hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty State when no plugins have been uploaded yet */}
        {filteredPlugins.length === 0 ? (
          <div className="rounded-2xl bg-[#0C0C0C] border border-white/[0.08] p-10 sm:p-14 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#71B913] mx-auto mb-4">
              <Layers size={22} />
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-white mb-2">
              No Plugins Available Right Now
            </h3>
            <p className="text-xs sm:text-sm text-[#888888] leading-relaxed">
              New Adobe Premiere Pro, After Effects, and Photoshop plugins uploaded to the store will appear here automatically.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredPlugins.map((plugin) => (
            <div
              key={plugin.id}
              className="glossy-card glossy-card-hover p-6 flex flex-col justify-between group"
            >
              <div>
                {/* Visual Thumbnail / UI Preview */}
                <div className="aspect-video w-full rounded-xl bg-black/60 border border-white/10 mb-5 overflow-hidden relative group-hover:border-[#71B913]/50 transition-colors flex flex-col justify-between p-3 shadow-inner">
                  {plugin.thumbnailUrl ? (
                    <img
                      src={plugin.thumbnailUrl}
                      alt={`${plugin.title} – ${plugin.software} Plugin by MirrorBook`}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-[10px] text-[#777777]">
                        <span className="flex items-center gap-1 text-[#71B913] font-medium">
                          <Terminal size={11} /> EXT
                        </span>
                        <span>{plugin.software}</span>
                      </div>
                      
                      <div className="py-2 text-center">
                        <div className="w-9 h-9 rounded-lg bg-black/60 border border-white/10 mx-auto flex items-center justify-center text-[#71B913] shadow-inner mb-1">
                          <Layers size={18} />
                        </div>
                      </div>

                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="w-2/3 h-full bg-[#71B913]" />
                      </div>
                    </>
                  )}
                </div>

                {/* Software Tag */}
                <div className="text-[11px] uppercase tracking-normal text-[#71B913] font-semibold mb-1">
                  {plugin.software}
                </div>

                {/* Title */}
                <h3 className="font-display text-lg font-bold text-white group-hover:text-[#71B913] transition-colors mb-1.5">
                  {plugin.title}
                </h3>

                {/* Subtitle */}
                {plugin.description && (
                  <p className="text-xs text-[#888888] line-clamp-2 leading-relaxed mb-4 font-light">
                    {plugin.description}
                  </p>
                )}
              </div>

              <div>
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between mb-5">
                  <span className="text-[11px] uppercase tracking-normal text-[#777777] font-medium">
                    Instant License
                  </span>
                  <span className="font-display text-xl font-bold text-white tabular-nums">
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
                  className="w-full py-3 text-xs font-bold uppercase tracking-normal glossy-btn rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <ShoppingBag size={14} />
                  <span>Buy Now</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
};

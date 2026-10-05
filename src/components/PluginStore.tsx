import React, { useState } from 'react';
import { PLUGINS } from '../data/content';
import { CheckoutItem, ProductItem } from '../types';
import { ShoppingBag, Terminal, Layers } from 'lucide-react';

interface PluginStoreProps {
  onBuyItem: (item: CheckoutItem) => void;
  plugins?: ProductItem[];
}

export const PluginStore: React.FC<PluginStoreProps> = ({ onBuyItem, plugins }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const sourcePlugins =
    plugins && plugins.length > 0
      ? plugins.map((p) => ({
          id: p.id,
          title: p.title,
          software: p.category,
          price: p.price,
          priceDisplay: p.priceDisplay || `৳${p.price.toLocaleString()}`,
          thumbnailUrl: p.thumbnailUrl,
          description: p.description,
        }))
      : PLUGINS;

  // Dynamically extract categories
  const categories = Array.from(new Set(sourcePlugins.map((p) => p.software)));
  const filterOptions = ['All', ...categories];

  const filteredPlugins = sourcePlugins.filter((plugin) => {
    if (selectedFilter === 'All') return true;
    return plugin.software.toLowerCase().includes(selectedFilter.toLowerCase());
  });

  return (
    <section id="plugins" className="py-28 px-6 bg-[#070707] text-white bg-grid-subtle border-b border-white/[0.08] relative overflow-hidden">
      {/* Floating Ambient Light Orbs */}
      <div className="absolute top-1/4 right-10 w-[500px] h-[500px] bg-[#CCFF00]/[0.06] rounded-full blur-[140px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none animate-float-reverse" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-white/[0.08]">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-[#CCFF00] font-mono font-semibold block mb-2">
              Extensions
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              Plugin Store
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-6 md:mt-0">
            {filterOptions.map((filter) => {
              const isActive = selectedFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-4 py-1.5 text-xs font-mono tracking-wide rounded-full transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#CCFF00] text-black font-semibold shadow-[0_0_20px_rgba(204,255,0,0.35)]'
                      : 'matte-glass-dark text-[#888888] hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filterable Grid: Strictly Title + Subtitle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredPlugins.map((plugin) => (
            <div
              key={plugin.id}
              className="matte-glass-dark rounded-2xl p-6 flex flex-col justify-between group"
            >
              <div>
                {/* Visual Thumbnail / UI Preview */}
                <div className="aspect-video w-full rounded-xl bg-[#111111] border border-white/[0.08] mb-5 overflow-hidden relative group-hover:border-[#CCFF00]/40 transition-colors flex flex-col justify-between p-3">
                  {plugin.thumbnailUrl ? (
                    <img
                      src={plugin.thumbnailUrl}
                      alt={plugin.title}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#777777]">
                        <span className="flex items-center gap-1 text-[#CCFF00]">
                          <Terminal size={11} /> EXT
                        </span>
                        <span>{plugin.software}</span>
                      </div>
                      
                      <div className="py-2 text-center">
                        <div className="w-9 h-9 rounded-lg bg-black/60 border border-white/10 mx-auto flex items-center justify-center text-[#CCFF00] shadow-inner mb-1">
                          <Layers size={18} />
                        </div>
                      </div>

                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="w-2/3 h-full bg-[#CCFF00]" />
                      </div>
                    </>
                  )}
                </div>

                {/* Software Tag */}
                <div className="text-[11px] uppercase tracking-wider text-[#CCFF00] font-mono mb-1">
                  {plugin.software}
                </div>

                {/* Title */}
                <h3 className="font-display text-lg font-bold text-white group-hover:text-[#CCFF00] transition-colors mb-1.5">
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
                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between mb-5">
                  <span className="text-[11px] uppercase font-mono tracking-wider text-[#666666]">
                    Instant License
                  </span>
                  <span className="font-display text-xl font-bold text-white tabular-nums">
                    {plugin.priceDisplay}
                  </span>
                </div>

                <button
                  onClick={() =>
                    onBuyItem({
                      id: plugin.id,
                      name: plugin.title,
                      price: plugin.priceDisplay,
                      category: `Plugin (${plugin.software})`,
                    })
                  }
                  className="w-full py-3 text-xs font-semibold uppercase tracking-wider bg-[#CCFF00] hover:bg-[#b8e600] text-black shadow-[0_0_20px_rgba(204,255,0,0.25)] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <ShoppingBag size={14} />
                  <span>Buy</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

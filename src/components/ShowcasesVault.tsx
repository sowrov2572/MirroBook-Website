import React, { useState } from 'react';
import { SHOWCASES } from '../data/content';
import { ShowcaseItem } from '../types';
import { Play, Clock, ArrowUpRight } from 'lucide-react';

interface ShowcasesVaultProps {
  onSelectVideo: (item: ShowcaseItem) => void;
}

export const ShowcasesVault: React.FC<ShowcasesVaultProps> = ({ onSelectVideo }) => {
  const [filter, setFilter] = useState('All');

  const categories = ['All', 'Commercial Video', 'Short-Form Reels', 'AI Software & Tools', 'Web Platform'];

  const filteredShowcases = SHOWCASES.filter((item) => {
    if (filter === 'All') return true;
    return item.category === filter;
  });

  return (
    <section id="showcases" className="py-28 px-6 bg-[#070707] text-white bg-grid-subtle border-b border-white/[0.08] relative overflow-hidden">
      {/* Floating Ambient Light Orbs */}
      <div className="absolute top-1/3 left-10 w-[500px] h-[500px] bg-[#CCFF00]/[0.06] rounded-full blur-[140px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none animate-float-reverse" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-white/[0.08]">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-[#CCFF00] font-mono font-semibold block mb-2">
              Portfolio
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              Video &amp; Motion Showcases
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-6 md:mt-0">
            {categories.map((cat) => {
              const isActive = filter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-1.5 text-xs font-mono tracking-wide rounded-full transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#CCFF00] text-black font-semibold shadow-[0_0_20px_rgba(204,255,0,0.35)]'
                      : 'matte-glass-dark text-[#888888] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Video & Thumbnail Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredShowcases.map((showcase) => (
            <div
              key={showcase.id}
              onClick={() => onSelectVideo(showcase)}
              className="matte-glass-dark rounded-2xl p-5 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                {/* Video Thumbnail Slot */}
                <div
                  className={`relative ${
                    showcase.aspectRatio === '9:16' ? 'aspect-[9/14]' : 'aspect-video'
                  } rounded-xl bg-[#111111] border border-white/[0.08] mb-4 overflow-hidden group-hover:border-[#CCFF00]/50 transition-colors flex items-center justify-center`}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-black via-[#161616] to-[#142010] group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-grid-subtle opacity-30" />

                  {/* Play Button Orb */}
                  <div className="relative z-10 w-12 h-12 rounded-full bg-[#CCFF00] text-black flex items-center justify-center shadow-[0_0_25px_rgba(204,255,0,0.45)] group-hover:scale-110 active:scale-95 transition-all">
                    <Play size={18} className="fill-black ml-0.5" />
                  </div>

                  <div className="absolute top-2.5 left-2.5 z-10 bg-black/70 backdrop-blur-md border border-white/[0.08] text-[10px] font-mono uppercase text-[#CCCCCC] px-2 py-0.5 rounded">
                    {showcase.client}
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 z-10 bg-black/80 backdrop-blur-md text-[10px] font-mono text-[#AAAAAA] px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock size={10} />
                    {showcase.duration}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-display text-lg font-bold text-white group-hover:text-[#CCFF00] transition-colors mb-1.5 line-clamp-1">
                  {showcase.title}
                </h3>

                {/* Subtitle */}
                <p className="text-xs text-[#888888] line-clamp-2 leading-relaxed mb-4 font-light">
                  {showcase.subtitle || showcase.description}
                </p>
              </div>

              {/* Bottom Action */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#777777]">
                <span className="font-mono text-[#AAAAAA] text-[11px]">{showcase.category}</span>
                <span className="text-white group-hover:text-[#CCFF00] font-medium flex items-center gap-0.5 text-[11px]">
                  Play Video <ArrowUpRight size={11} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

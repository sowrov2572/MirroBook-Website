import React from 'react';
import { SERVICES } from '../data/content';
import { Play, ArrowUpRight } from 'lucide-react';

interface ServicesProps {
  onPreviewVideo: (title: string, category: string) => void;
}

export const Services: React.FC<ServicesProps> = ({ onPreviewVideo }) => {
  return (
    <section id="services" className="py-28 px-6 bg-[#CCFF00] text-black bg-grid-lemon relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-black/15">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-black/70 font-mono font-semibold block mb-2">
              Capabilities
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-black tracking-tight">
              Services
            </h2>
          </div>
          <p className="text-sm text-black/75 max-w-md mt-4 md:mt-0 font-medium leading-relaxed">
            Creative production, brand engineering, and proprietary AI tools built for modern digital scale.
          </p>
        </div>

        {/* 6-Card Minimal Grid: Strictly Title + Subtitle */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service) => (
            <div
              key={service.id}
              className="matte-glass-lemon-card rounded-2xl p-7 flex flex-col justify-between group"
            >
              <div>
                {/* Title */}
                <h3 className="font-display text-2xl font-bold text-white group-hover:text-[#CCFF00] transition-colors mb-2">
                  {service.title}
                </h3>

                {/* Subtitle */}
                <p className="text-sm text-[#999999] leading-relaxed mb-6 font-light">
                  {service.subtitle}
                </p>

                {/* Clean Video & Thumbnail Slot */}
                <div
                  onClick={() => onPreviewVideo(service.title, 'Service Showcase')}
                  className="relative aspect-video rounded-xl bg-[#141414] border border-white/10 mb-6 overflow-hidden cursor-pointer group/thumb flex items-center justify-center transition-all hover:border-[#CCFF00]/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-black via-[#161616] to-[#121A0F] group-hover/thumb:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-grid-subtle opacity-30" />

                  {/* Play Affordance */}
                  <div className="relative z-10 w-12 h-12 rounded-full bg-[#CCFF00] text-black flex items-center justify-center shadow-[0_0_20px_rgba(204,255,0,0.4)] group-hover/thumb:scale-110 active:scale-95 transition-all">
                    <Play size={16} className="ml-0.5 fill-black" />
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between text-[10px] font-mono text-[#AAAAAA]">
                    <span className="bg-black/80 px-2 py-0.5 rounded backdrop-blur-sm">Showcase Reel</span>
                    <span className="text-[#CCFF00] flex items-center gap-0.5 font-medium">
                      Watch Preview <ArrowUpRight size={11} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#888888]">
                <span>Retainer Available</span>
                <span className="text-white group-hover:text-[#CCFF00] font-medium flex items-center gap-1 transition-colors">
                  Explore <ArrowUpRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

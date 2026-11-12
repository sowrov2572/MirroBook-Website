import React from 'react';
import { ArrowDownRight, ArrowRight, Play } from 'lucide-react';

interface HeroProps {
  onViewPackages: () => void;
  onBrowseStore: () => void;
  onPlayShowreel: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onViewPackages, onBrowseStore, onPlayShowreel }) => {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-between pt-16 pb-20 md:pt-24 md:pb-24 px-6 overflow-hidden border-b border-white/[0.08]">
      {/* Full Page Background Banner (No Inner Box / Full Bleed Viewport) */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://i.ibb.co/dsxmjMSP/mirrorbook.jpg"
          alt="MirrorBook – Digital Marketing Agency Bangladesh Creative Studio Hero Banner"
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes('WNjVG5Qk')) {
              target.src = 'https://i.ibb.co/WNjVG5Qk/mirrorbook.jpg';
            }
          }}
          className="w-full h-full object-cover object-center scale-100"
        />

        {/* Cinematic Scrim & Matte Frosted Overlays for High Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/75 to-[#070707]/65" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/80" />
        <div className="absolute inset-0 bg-grid-subtle opacity-20 pointer-events-none" />
      </div>

      {/* Main Content Area sitting directly on top of the Background Banner */}
      <div className="max-w-7xl mx-auto w-full relative z-10 flex-1 flex flex-col justify-between">
        {/* Top Header & Vision Block */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 pt-6 pb-16">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#71B913]" />
              <span className="text-xs font-semibold text-[#71B913] uppercase tracking-wider">
                Reflecting Creativity
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[0.96]">
              MirrorBook
            </h1>

            <p className="text-base sm:text-lg text-[#CCCCCC] font-normal leading-relaxed max-w-xl">
              MirrorBook is a creative agency in Bangladesh providing graphic design, video editing, motion graphics, digital marketing, and modern web development.
            </p>
          </div>

          {/* Action & Showreel Buttons */}
          <div className="flex flex-wrap items-center gap-3.5">
            <button
              onClick={onViewPackages}
              className="px-7 py-3.5 text-xs font-bold uppercase tracking-normal text-black bg-[#71B913] hover:bg-[#81cf17] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer rounded-xl font-medium"
            >
              <span>View Packages</span>
              <ArrowDownRight size={15} />
            </button>

            <button
              onClick={onBrowseStore}
              className="px-7 py-3.5 text-xs font-bold uppercase tracking-normal text-white bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/15 hover:border-[#71B913]/60 hover:text-[#71B913] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer rounded-xl"
            >
              <span>Browse Store</span>
              <ArrowRight size={15} />
            </button>

            <button
              onClick={onPlayShowreel}
              className="px-5 py-3.5 text-xs font-semibold uppercase tracking-normal text-white hover:text-[#71B913] bg-black/70 hover:bg-black/90 backdrop-blur-xl border border-white/15 hover:border-[#71B913]/40 rounded-xl flex items-center gap-2 transition-all cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-full bg-[#71B913] text-black flex items-center justify-center group-hover:scale-105 transition-transform">
                <Play size={11} className="fill-black ml-0.5" />
              </div>
              <span>Watch Showreel</span>
            </button>
          </div>
        </div>

        {/* Clean Frosted Matte Glass Metric Cards right over the background banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-4">
          <div className="bg-[#0C0C0C]/85 backdrop-blur-xl border border-white/[0.08] hover:border-white/20 p-6 rounded-2xl transition-all">
            <h3 className="text-xs font-semibold tracking-normal text-[#999999] mb-1">Projects Delivered</h3>
            <div className="font-display text-3xl md:text-4xl font-bold text-white tabular-nums">480+</div>
            <p className="text-xs text-[#888888] mt-1 font-light">High retention commercial cuts</p>
          </div>

          <div className="bg-[#0C0C0C]/85 backdrop-blur-xl border border-white/[0.08] hover:border-white/20 p-6 rounded-2xl transition-all">
            <h3 className="text-xs font-semibold tracking-normal text-[#999999] mb-1">Audience Reach</h3>
            <div className="font-display text-3xl md:text-4xl font-bold text-white tabular-nums">4.2M+</div>
            <p className="text-xs text-[#888888] mt-1 font-light">Organic video viewership</p>
          </div>

          <div className="bg-[#0C0C0C]/85 backdrop-blur-xl border border-white/[0.08] hover:border-white/20 p-6 rounded-2xl transition-all">
            <h3 className="text-xs font-semibold tracking-normal text-[#999999] mb-1">Turnaround Time</h3>
            <div className="font-display text-3xl md:text-4xl font-bold text-white tabular-nums">48h</div>
            <p className="text-xs text-[#888888] mt-1 font-light">Sprint delivery standard</p>
          </div>

          <div className="bg-[#0C0C0C]/85 backdrop-blur-xl border border-[#71B913]/40 hover:border-[#71B913]/60 p-6 rounded-2xl transition-all">
            <h3 className="text-xs font-semibold text-[#71B913] mb-1">Communication</h3>
            <div className="font-display text-3xl md:text-4xl font-bold text-[#71B913] tabular-nums">100%</div>
            <p className="text-xs text-[#AAAAAA] mt-1 font-light">Direct founder &amp; engineer access</p>
          </div>
        </div>
      </div>
    </section>
  );
};

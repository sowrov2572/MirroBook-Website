import React from 'react';
import { ArrowDownRight, ArrowRight, Play, Volume2 } from 'lucide-react';

interface HeroProps {
  onViewPackages: () => void;
  onBrowseStore: () => void;
  onPlayShowreel: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onViewPackages, onBrowseStore, onPlayShowreel }) => {
  return (
    <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 px-6 overflow-hidden bg-[#070707] bg-grid-subtle border-b border-white/[0.08]">
      {/* Floating Ambient Light Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#CCFF00]/[0.07] rounded-full blur-[150px] pointer-events-none animate-float-slow" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-[140px] pointer-events-none animate-float-reverse" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Header & Vision Section */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12 md:mb-16">
          <div className="max-w-2xl space-y-4">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#CCFF00] font-mono font-semibold">
                Reflecting Creativity
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[0.98]">
              MirrorBook
            </h1>

            <p className="text-base sm:text-lg text-[#999999] font-light leading-relaxed max-w-xl">
              Advertising, Video Editing, Design, AI Software Development, and Digital Tools.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5">
            <button
              onClick={onViewPackages}
              className="px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-black bg-[#CCFF00] hover:bg-[#b8e600] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_8px_25px_rgba(204,255,0,0.25)] rounded-xl"
            >
              <span>View Packages</span>
              <ArrowDownRight size={15} />
            </button>

            <button
              onClick={onBrowseStore}
              className="px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-white matte-glass-dark hover:border-[#CCFF00]/50 hover:text-[#CCFF00] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer rounded-xl"
            >
              <span>Browse Store</span>
              <ArrowRight size={15} />
            </button>

            <button
              onClick={onPlayShowreel}
              className="px-5 py-3.5 text-xs font-mono uppercase tracking-wider text-[#888888] hover:text-[#CCFF00] bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              <Play size={14} className="fill-current text-[#CCFF00]" />
              <span>Showreel</span>
            </button>
          </div>
        </div>

        {/* Full-Width Panoramic Cinema Banner Section */}
        {/* Placed across the entire section width up to the metric cards */}
        <div className="relative group mb-14 md:mb-18">
          {/* Subtle Ambient Glow behind banner */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-[#CCFF00]/15 via-white/10 to-[#CCFF00]/10 rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Matte Frosted Glass Frame around the full-width banner */}
          <div className="relative matte-glass-dark rounded-2xl md:rounded-3xl overflow-hidden p-2 sm:p-3 border border-white/[0.12] shadow-[0_25px_60px_rgba(0,0,0,0.8)]">
            <div
              onClick={onPlayShowreel}
              className="relative w-full aspect-[16/9] sm:aspect-[2/1] lg:aspect-[2.7/1] bg-[#0A0A0A] rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group/banner flex items-center justify-center border border-white/[0.08]"
            >
              {/* Full Panoramic Image Banner */}
              <img
                src="https://i.ibb.co/dsxmjMSP/mirrorbook.jpg"
                alt="MirrorBook Agency Banner"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('WNjVG5Qk')) {
                    target.src = 'https://i.ibb.co/WNjVG5Qk/mirrorbook.jpg';
                  }
                }}
                className="w-full h-full object-cover object-center group-hover/banner:scale-[1.02] transition-transform duration-700 ease-out"
              />

              {/* Gradient Scrim for Contrast & Cinema Finish */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 group-hover/banner:from-black/75 transition-colors pointer-events-none" />

              {/* Center Play Button Overlay */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#CCFF00] text-black flex items-center justify-center shadow-[0_0_40px_rgba(204,255,0,0.6)] group-hover/banner:scale-110 active:scale-95 transition-all duration-300">
                  <Play size={26} className="fill-black ml-1" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/90 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 opacity-90 group-hover/banner:opacity-100 transition-opacity">
                  Watch Showreel
                </span>
              </div>

              {/* Top Corner Studio Badge */}
              <div className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 z-10 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-mono text-white/90 border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
                <span>MirrorBook 2026</span>
              </div>

              {/* Bottom Info Bar */}
              <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:bottom-5 sm:left-5 sm:right-5 z-10 flex items-center justify-between text-[11px] sm:text-xs font-mono text-white/90">
                <span className="bg-black/70 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 hidden sm:inline-block">
                  Reflecting Creativity // Master Work
                </span>
                <span className="text-[#CCFF00] flex items-center gap-1.5 bg-black/70 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 ml-auto">
                  <Volume2 size={13} /> 4K Ultra HD
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Metric Cards: Projects Delivered, Audience Reach, Turnaround, Communication */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="matte-glass-dark p-6 rounded-2xl">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#888888] mb-1">Projects Delivered</h3>
            <div className="font-display text-3xl md:text-4xl font-bold text-white tabular-nums">480+</div>
            <p className="text-xs text-[#777777] mt-1">High retention commercial cuts</p>
          </div>

          <div className="matte-glass-dark p-6 rounded-2xl">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#888888] mb-1">Audience Reach</h3>
            <div className="font-display text-3xl md:text-4xl font-bold text-white tabular-nums">4.2M+</div>
            <p className="text-xs text-[#777777] mt-1">Organic video viewership</p>
          </div>

          <div className="matte-glass-dark p-6 rounded-2xl">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#888888] mb-1">Turnaround Time</h3>
            <div className="font-display text-3xl md:text-4xl font-bold text-white tabular-nums">48h</div>
            <p className="text-xs text-[#777777] mt-1">Sprint delivery standard</p>
          </div>

          <div className="matte-glass-dark p-6 rounded-2xl border-[#CCFF00]/30 shadow-[0_0_25px_rgba(204,255,0,0.08)]">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#CCFF00] mb-1">Communication</h3>
            <div className="font-display text-3xl md:text-4xl font-bold text-[#CCFF00] tabular-nums">100%</div>
            <p className="text-xs text-[#888888] mt-1">Direct founder &amp; engineer access</p>
          </div>
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { ArrowDownRight, ArrowRight, Play } from 'lucide-react';

interface HeroProps {
  onViewPackages: () => void;
  onBrowseStore: () => void;
  onPlayShowreel: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onViewPackages, onBrowseStore, onPlayShowreel }) => {
  return (
    <section className="relative min-h-[calc(100svh-4rem)] lg:min-h-[84vh] flex flex-col justify-between pt-8 pb-12 sm:pt-16 sm:pb-16 lg:pt-20 lg:pb-20 px-4 sm:px-6 lg:px-8 overflow-x-clip bg-[#0B0D0C] border-b border-white/[0.09]">
      {/* Full-Bleed Hero Banner with Balanced Matte Dark Scrim */}
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
          className="w-full h-full object-cover object-center opacity-45"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D0C] via-[#0B0D0C]/80 to-[#0B0D0C]/65" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D0C]/90 via-[#0B0D0C]/55 to-[#0B0D0C]/85" />
        <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none" />
      </div>

      {/* Main Content Area Aligned to Unified 7xl Grid */}
      <div className="max-w-7xl mx-auto w-full relative z-10 flex-1 flex flex-col justify-between gap-8 sm:gap-12">
        {/* Top Hero Lockup */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 sm:gap-8 pt-2 sm:pt-8">
          <div className="max-w-2xl space-y-3 sm:space-y-4 min-w-0">
            <span className="inline-block text-xs font-semibold text-[#B7F34A] tracking-wide">
              Reflecting Creativity
            </span>

            <h1 className="font-display text-[2.35rem] min-[375px]:text-4xl sm:text-6xl lg:text-[4.25rem] font-bold tracking-tight text-[#F5F7F2] leading-[1.03] [text-wrap:balance]">
              MirrorBook
            </h1>

            <p className="text-sm sm:text-lg text-[#A1AAA2] font-normal leading-relaxed max-w-xl">
              MirrorBook is a creative agency in Bangladesh providing graphic design, video editing, motion graphics, digital marketing, and modern web development.
            </p>
          </div>

          {/* Action & Showreel Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onViewPackages}
              className="w-full min-[420px]:w-auto min-h-[44px] px-5 sm:px-6 py-3 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>View Packages</span>
              <ArrowDownRight size={15} />
            </button>

            <button
              type="button"
              onClick={onBrowseStore}
              className="flex-1 min-[420px]:flex-initial min-h-[44px] px-5 sm:px-6 py-3 text-xs font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>Browse Store</span>
              <ArrowRight size={15} />
            </button>

            <button
              type="button"
              onClick={onPlayShowreel}
              className="flex-1 min-[420px]:flex-initial min-h-[44px] px-4 sm:px-5 py-2.5 text-xs font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-2 cursor-pointer group whitespace-nowrap"
            >
              <span className="w-6 h-6 rounded-lg bg-[#B7F34A] text-[#0B0D0C] flex items-center justify-center transition-transform duration-150 group-hover:scale-105 shrink-0">
                <Play size={11} className="fill-[#0B0D0C] ml-0.5" />
              </span>
              <span>Watch Showreel</span>
            </button>
          </div>
        </div>

        {/* Elevated Frosted Matte Glass Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 items-stretch">
          <div className="glossy-card glossy-card-hover p-4 sm:p-6 min-w-0 flex flex-col justify-between h-full">
            <h3 className="text-[11px] sm:text-xs font-medium text-[#A1AAA2] mb-2">Projects Delivered</h3>
            <div>
              <div className="font-display text-2xl min-[375px]:text-3xl sm:text-4xl font-bold text-[#F5F7F2] tabular-nums">480+</div>
              <p className="text-[11px] sm:text-xs text-[#A1AAA2] mt-1.5">High retention commercial cuts</p>
            </div>
          </div>

          <div className="glossy-card glossy-card-hover p-4 sm:p-6 min-w-0 flex flex-col justify-between h-full">
            <h3 className="text-[11px] sm:text-xs font-medium text-[#A1AAA2] mb-2">Audience Reach</h3>
            <div>
              <div className="font-display text-2xl min-[375px]:text-3xl sm:text-4xl font-bold text-[#F5F7F2] tabular-nums">4.2M+</div>
              <p className="text-[11px] sm:text-xs text-[#A1AAA2] mt-1.5">Organic video viewership</p>
            </div>
          </div>

          <div className="glossy-card glossy-card-hover p-4 sm:p-6 min-w-0 flex flex-col justify-between h-full">
            <h3 className="text-[11px] sm:text-xs font-medium text-[#A1AAA2] mb-2">Turnaround Time</h3>
            <div>
              <div className="font-display text-2xl min-[375px]:text-3xl sm:text-4xl font-bold text-[#F5F7F2] tabular-nums">48h</div>
              <p className="text-[11px] sm:text-xs text-[#A1AAA2] mt-1.5">Sprint delivery standard</p>
            </div>
          </div>

          <div className="glossy-card glossy-card-hover p-4 sm:p-6 min-w-0 border-[#B7F34A]/30 flex flex-col justify-between h-full">
            <h3 className="text-[11px] sm:text-xs font-semibold text-[#B7F34A] mb-2">Communication</h3>
            <div>
              <div className="font-display text-2xl min-[375px]:text-3xl sm:text-4xl font-bold text-[#B7F34A] tabular-nums">100%</div>
              <p className="text-[11px] sm:text-xs text-[#A1AAA2] mt-1.5">Direct founder &amp; engineer access</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

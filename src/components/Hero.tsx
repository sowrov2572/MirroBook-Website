import React from 'react';
import { ArrowDownRight, ArrowRight, Play } from 'lucide-react';

interface HeroProps {
  onViewPackages: () => void;
  onBrowseStore: () => void;
  onPlayShowreel: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onViewPackages, onBrowseStore, onPlayShowreel }) => {
  return (
    <section className="relative min-h-[calc(100svh-4rem)] lg:min-h-[86vh] flex flex-col justify-center items-center py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-x-clip bg-[#0B0D0C] border-b border-white/[0.09]">
      {/* Full-Bleed Hero Banner with Balanced Matte Dark Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://i.ibb.co/dsxmjMSP/mirrorbook.jpg"
          alt="MirrorBook – Creative Agency and Digital Solutions Brand in Bangladesh"
          width={1920}
          height={1080}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes('WNjVG5Qk')) {
              target.src = 'https://i.ibb.co/WNjVG5Qk/mirrorbook.jpg';
            }
          }}
          className="w-full h-full object-cover object-center opacity-40"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D0C]/80 via-[#0B0D0C]/65 to-[#0B0D0C]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D0C]/85 via-transparent to-[#0B0D0C]/85" />
      </div>

      {/* Centered Content Container */}
      <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col items-center justify-center gap-10 sm:gap-12">
        {/* Top Centered Brand Lockup */}
        <div className="w-full max-w-3xl mx-auto text-center flex flex-col items-center space-y-4 sm:space-y-5">
          {/* 1. Main Heading */}
          <h1 className="font-display text-4xl min-[375px]:text-5xl sm:text-6xl lg:text-[4.75rem] font-bold tracking-tight text-[#F5F7F2] leading-[1.03] [text-wrap:balance]">
            MirrorBook
          </h1>

          {/* 2. Tagline */}
          <p className="text-sm sm:text-base font-semibold text-[#B7F34A] tracking-wide">
            Reflecting Creativity
          </p>

          {/* 3. Description */}
          <p className="text-sm sm:text-lg text-[#A1AAA2] font-normal leading-relaxed max-w-2xl mx-auto">
            We are a creative agency and digital production studio helping brands and businesses stand out through thoughtful design, engaging videos, compelling content, and reliable web solutions. From the first idea to the final delivery, we turn your vision into creative work that connects with people.
          </p>

          {/* 4. Three Existing Action Buttons */}
          <div className="w-full flex flex-col min-[420px]:flex-row flex-wrap items-stretch min-[420px]:items-center justify-center gap-2.5 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={onViewPackages}
              className="min-h-[44px] px-5 sm:px-6 py-3 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>View Packages</span>
              <ArrowDownRight size={15} />
            </button>

            <button
              type="button"
              onClick={onBrowseStore}
              className="min-h-[44px] px-5 sm:px-6 py-3 text-xs font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>Browse Plugins</span>
              <ArrowRight size={15} />
            </button>

            <button
              type="button"
              onClick={onPlayShowreel}
              className="min-h-[44px] px-4 sm:px-5 py-2.5 text-xs font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-2 cursor-pointer group whitespace-nowrap"
            >
              <span className="w-6 h-6 rounded-lg bg-[#B7F34A] text-[#0B0D0C] flex items-center justify-center transition-transform duration-150 group-hover:scale-105 shrink-0">
                <Play size={11} className="fill-[#0B0D0C] ml-0.5" />
              </span>
              <span>Show Reel</span>
            </button>
          </div>
        </div>

        {/* Clear service value propositions, without unsupported performance claims */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 items-stretch">
          <div className="glossy-card glossy-card-hover p-4 sm:p-5 min-w-0 flex flex-col justify-between h-full">
            <p className="text-sm font-semibold text-[#F5F7F2] mb-2">Remote Collaboration</p>
            <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">Work with a creative team remotely, wherever your business is based.</p>
          </div>
          <div className="glossy-card glossy-card-hover p-4 sm:p-5 min-w-0 flex flex-col justify-between h-full">
            <p className="text-sm font-semibold text-[#F5F7F2] mb-2">Design + Video</p>
            <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">Graphic design, social content, video editing and motion graphics.</p>
          </div>
          <div className="glossy-card glossy-card-hover p-4 sm:p-5 min-w-0 flex flex-col justify-between h-full">
            <p className="text-sm font-semibold text-[#F5F7F2] mb-2">Flexible Engagement</p>
            <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">Discuss a one-time project or ongoing creative production support.</p>
          </div>
          <div className="glossy-card glossy-card-hover p-4 sm:p-5 min-w-0 flex flex-col justify-between h-full border-[#B7F34A]/30">
            <p className="text-sm font-semibold text-[#B7F34A] mb-2">Clear Communication</p>
            <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">Start with your goals, required deliverables and project brief.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

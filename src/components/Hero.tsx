import React from 'react';
import { ArrowDownRight, ArrowRight, Play } from 'lucide-react';

interface HeroProps {
  onViewPackages: () => void;
  onBrowseStore: () => void;
  onPlayShowreel: () => void;
}

const valuePoints = [
  ['01', 'Design & branding', 'Brand identities, social creatives and campaign-ready visual assets.'],
  ['02', 'Video & motion', 'Short-form content, promotional edits and motion graphics.'],
  ['03', 'Web & digital', 'Business websites, web applications and practical software products.'],
  ['04', 'Ongoing support', 'Flexible project work and monthly creative production partnerships.'],
];

export const Hero: React.FC<HeroProps> = ({ onViewPackages, onBrowseStore, onPlayShowreel }) => (
  <section className="relative min-h-[78vh] flex flex-col justify-center py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-x-clip bg-[#101110] border-b border-white/10">
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <img
        src="https://i.ibb.co/dsxmjMSP/mirrorbook.jpg"
        alt=""
        width={1920}
        height={1080}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={(e) => {
          if (!e.currentTarget.src.includes('WNjVG5Qk')) {
            e.currentTarget.src = 'https://i.ibb.co/WNjVG5Qk/mirrorbook.jpg';
          }
        }}
        className="h-full w-full object-cover object-center opacity-20"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#101110] via-[#101110]/90 to-[#101110]/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#101110]/80" />
    </div>

    <div className="max-w-7xl w-full mx-auto relative z-10">
      <div className="max-w-4xl space-y-6 sm:space-y-7">
        <p className="text-[11px] sm:text-xs tracking-[.16em] uppercase text-[#b9ed62] font-semibold">
          Bangladesh-based creative studio · Remote collaboration worldwide
        </p>
        <h1 className="font-display text-5xl min-[375px]:text-6xl sm:text-7xl lg:text-[6.5rem] font-semibold tracking-[-.055em] leading-[.95] text-[#f2f2ed]">
          MirrorBook<span className="text-[#b9ed62]">.</span>
        </h1>
        <p className="text-[#b9ed62] text-lg sm:text-xl font-medium">Reflecting Creativity</p>
        <p className="max-w-3xl text-base sm:text-lg lg:text-xl text-[#c1c3bc] leading-relaxed">
          Your remote creative team for design, video and digital experiences. We help businesses, agencies and creators turn ideas into polished brand visuals, engaging content and useful digital products, from a single project to ongoing production support.
        </p>
        <div className="flex flex-col min-[420px]:flex-row flex-wrap items-stretch min-[420px]:items-center gap-3 pt-2">
          <button type="button" onClick={onViewPackages} className="min-h-[48px] px-6 py-3 text-sm glossy-btn flex items-center justify-center gap-2 cursor-pointer">
            <span>Explore Services & Packages</span><ArrowDownRight size={16}/>
          </button>
          <button type="button" onClick={onBrowseStore} className="min-h-[48px] px-6 py-3 text-sm font-semibold glossy-btn-secondary flex items-center justify-center gap-2 cursor-pointer">
            <span>Explore Plugins & Software</span><ArrowRight size={16}/>
          </button>
          <button type="button" onClick={onPlayShowreel} className="min-h-[48px] px-5 py-3 text-sm font-semibold glossy-btn-secondary flex items-center justify-center gap-2 cursor-pointer">
            <Play size={15}/><span>Watch Showreel</span>
          </button>
        </div>
        <p className="text-xs text-[#92958d]">Creative production · Digital solutions · International client support</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8 mt-16 sm:mt-20 max-w-6xl">
        {valuePoints.map(([number, title, description]) => (
          <div key={number} className="border-t border-white/20 pt-4 sm:pt-5">
            <span className="text-xs text-[#b9ed62] tracking-widest">{number}</span>
            <h2 className="mt-3 text-sm sm:text-base font-semibold text-[#f2f2ed]">{title}</h2>
            <p className="mt-2 text-xs sm:text-sm text-[#a5a7a1] leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

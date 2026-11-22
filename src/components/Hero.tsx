import React from 'react';
import { ArrowDownRight, ArrowRight, Play, Globe2, Layers3, Clapperboard, MessageSquareText } from 'lucide-react';

interface HeroProps {
  onViewPackages: () => void;
  onBrowseStore: () => void;
  onPlayShowreel: () => void;
}

const valuePoints = [
  {
    icon: Clapperboard,
    title: 'Video & Motion',
    description: 'Short-form content, promotional videos, editing and motion graphics.',
  },
  {
    icon: Layers3,
    title: 'Design & Branding',
    description: 'Social creatives, campaign assets and consistent brand visuals.',
  },
  {
    icon: Globe2,
    title: 'Digital Experiences',
    description: 'Websites, web applications and practical software solutions.',
  },
  {
    icon: MessageSquareText,
    title: 'Ongoing Support',
    description: 'Flexible project work and monthly creative production partnerships.',
  },
];

export const Hero: React.FC<HeroProps> = ({ onViewPackages, onBrowseStore, onPlayShowreel }) => {
  return (
    <section className="relative min-h-[calc(100svh-4rem)] lg:min-h-[86vh] flex flex-col justify-center items-center py-14 sm:py-18 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-x-clip bg-[#0B0D0C] border-b border-white/[0.09]">
      <div className="absolute inset-0 z-0" aria-hidden="true">
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
            const target = e.currentTarget;
            if (!target.src.includes('WNjVG5Qk')) {
              target.src = 'https://i.ibb.co/WNjVG5Qk/mirrorbook.jpg';
            }
          }}
          className="w-full h-full object-cover object-center opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D0C]/75 via-[#0B0D0C]/70 to-[#0B0D0C]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D0C]/85 via-transparent to-[#0B0D0C]/85" />
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col items-center justify-center gap-12 sm:gap-16">
        <div className="w-full max-w-4xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#B7F34A]/25 bg-[#B7F34A]/[0.07] px-3.5 py-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B7F34A]" />
            <span className="text-[10px] sm:text-xs font-semibold tracking-[0.12em] uppercase text-[#D5E9B7]">
              Bangladesh-based · Working worldwide
            </span>
          </div>

          <p className="text-sm sm:text-base font-semibold text-[#B7F34A] tracking-wide mb-3">
            MirrorBook · Reflecting Creativity
          </p>

          <h1 className="font-display text-4xl min-[375px]:text-5xl sm:text-6xl lg:text-[4.6rem] font-bold tracking-tight text-[#F5F7F2] leading-[1.04] [text-wrap:balance]">
            Your remote creative team for <span className="text-[#B7F34A]">design, video</span> and digital.
          </h1>

          <p className="mt-6 text-sm sm:text-lg text-[#B8C0B9] font-normal leading-relaxed max-w-3xl mx-auto">
            We help businesses, agencies and creators turn ideas into polished brand visuals, engaging video content and useful digital products. Work with MirrorBook on a single project or build a reliable ongoing production partnership, wherever you are in the world.
          </p>

          <div className="mt-8 flex flex-col min-[420px]:flex-row flex-wrap items-stretch min-[420px]:items-center justify-center gap-3 w-full">
            <button
              type="button"
              onClick={onViewPackages}
              className="min-h-[48px] px-6 sm:px-7 py-3 text-xs sm:text-sm glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>Explore Services & Packages</span>
              <ArrowDownRight size={15} />
            </button>

            <button
              type="button"
              onClick={onBrowseStore}
              className="min-h-[48px] px-6 py-3 text-xs sm:text-sm font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>Explore Plugins & Software</span>
              <ArrowRight size={15} />
            </button>

            <button
              type="button"
              onClick={onPlayShowreel}
              className="min-h-[48px] px-5 py-3 text-xs sm:text-sm font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-2 cursor-pointer group whitespace-nowrap"
            >
              <span className="w-6 h-6 rounded-lg bg-[#B7F34A] text-[#0B0D0C] flex items-center justify-center transition-transform duration-150 group-hover:scale-105 shrink-0">
                <Play size={11} className="fill-[#0B0D0C] ml-0.5" />
              </span>
              <span>Watch Showreel</span>
            </button>
          </div>

          <p className="mt-5 text-[11px] sm:text-xs text-[#89938B]">
            Creative production · Digital solutions · Remote collaboration
          </p>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
          {valuePoints.map(({ icon: Icon, title, description }, index) => (
            <div
              key={title}
              className={`glossy-card glossy-card-hover p-5 sm:p-6 min-w-0 flex flex-col h-full ${index === 3 ? 'border-[#B7F34A]/30' : ''}`}
            >
              <span className="w-10 h-10 rounded-xl bg-[#B7F34A]/10 border border-[#B7F34A]/15 text-[#B7F34A] flex items-center justify-center mb-4">
                <Icon size={18} strokeWidth={1.8} />
              </span>
              <h2 className="text-sm font-semibold text-[#F5F7F2] mb-2">{title}</h2>
              <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

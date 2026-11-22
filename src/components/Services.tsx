import React from 'react';
import { SERVICES } from '../data/content';
import { ArrowUpRight, Palette, Film, Smartphone, Code2, WandSparkles, Megaphone } from 'lucide-react';

interface ServicesProps {
  onSelectService?: (title: string) => void;
}

const serviceDetails: Record<string, { description: string; icon: React.ElementType; deliverables: string }> = {
  'video-editing': {
    description: 'Bring your footage together with thoughtful pacing, clean storytelling, colour correction, sound design and polished final exports.',
    icon: Film,
    deliverables: 'Promotional videos · YouTube edits · Brand films',
  },
  'reels-editing': {
    description: 'Keep your social channels moving with vertical edits built around a clear hook, readable captions, purposeful cuts and platform-ready formats.',
    icon: Smartphone,
    deliverables: 'Instagram Reels · TikTok · YouTube Shorts',
  },
  'graphic-design': {
    description: 'Create a consistent visual language for your business, from everyday social content to campaign artwork and brand identity assets.',
    icon: Palette,
    deliverables: 'Brand identity · Social creatives · Campaign design',
  },
  'web-development': {
    description: 'Give your business a useful online home with responsive websites and web applications shaped around your customers and workflow.',
    icon: Code2,
    deliverables: 'Business websites · Landing pages · Web apps',
  },
  'software-design-ai': {
    description: 'Explore practical digital tools, creative workflow utilities and tailored automation that help reduce repetitive work.',
    icon: WandSparkles,
    deliverables: 'Digital products · Workflow tools · AI-assisted solutions',
  },
  'advertising-campaigns': {
    description: 'Support your campaigns with creative concepts, ad-ready visuals, video variations and content prepared for your marketing channels.',
    icon: Megaphone,
    deliverables: 'Ad creatives · Campaign videos · Content assets',
  },
};

export const Services: React.FC<ServicesProps> = ({ onSelectService }) => {
  return (
    <section
      id="services"
      className="scroll-mt-20 py-14 sm:py-18 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#121614] text-[#F5F7F2] border-b border-white/[0.09] relative overflow-x-clip"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-10 sm:mb-12 pb-6 border-b border-white/[0.09]">
          <div className="max-w-2xl">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#B7F34A] mb-3">
              What we do
            </p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F5F7F2] tracking-tight leading-tight">
              Creative services, <span className="text-[#B7F34A]">made practical.</span>
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#A1AAA2] max-w-xl leading-relaxed">
            One remote team for the creative work your business needs, from everyday content production to complete digital experiences. We work with brands, agencies and independent creators worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
          {SERVICES.map((service, index) => {
            const detail = serviceDetails[service.id];
            const Icon = detail?.icon || Palette;
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => onSelectService?.(service.title)}
                className="glossy-card glossy-card-hover p-5 sm:p-6 min-w-0 flex flex-col text-left h-full group cursor-pointer focus-visible:outline-[#B7F34A]"
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <span className="w-11 h-11 rounded-xl bg-[#B7F34A]/10 border border-[#B7F34A]/15 text-[#B7F34A] flex items-center justify-center">
                    <Icon size={19} strokeWidth={1.8} />
                  </span>
                  <span className="text-[10px] font-semibold tracking-widest text-[#778178] tabular-nums">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="font-display text-lg sm:text-xl font-bold text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors leading-snug">
                  {service.title}
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
                  {detail?.description || service.subtitle}
                </p>
                <div className="mt-auto pt-5 flex items-end justify-between gap-3">
                  <span className="text-[10px] sm:text-[11px] text-[#879188] leading-relaxed">
                    {detail?.deliverables || 'Creative services'}
                  </span>
                  <ArrowUpRight size={17} className="text-[#778178] group-hover:text-[#B7F34A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

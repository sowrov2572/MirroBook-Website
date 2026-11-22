import React from 'react';
import { SERVICES } from '../data/content';
import { ArrowUpRight } from 'lucide-react';

interface ServicesProps {
  onSelectService?: (title: string) => void;
}

const serviceDescriptions: Record<string, string> = {
  'video-editing': 'Thoughtful editing, colour correction, sound design and storytelling for promotional videos, YouTube content and brand films.',
  'reels-editing': 'Platform-ready vertical videos with strong openings, clear captions, purposeful pacing and polished finishing.',
  'graphic-design': 'Consistent brand identities, social media creatives, campaign artwork and marketing assets shaped around your visual direction.',
  'web-development': 'Responsive business websites and web applications designed around your customers, services and day-to-day workflows.',
  'software-design-ai': 'Practical digital products, creative workflow utilities and tailored automation for repetitive tasks.',
  'advertising-campaigns': 'Campaign concepts, ad-ready visuals, video variations and creative assets for your marketing channels.',
};

const serviceDeliverables: Record<string, string> = {
  'video-editing': 'Promotional videos · YouTube edits · Brand films',
  'reels-editing': 'Instagram Reels · TikTok · YouTube Shorts',
  'graphic-design': 'Brand identity · Social creatives · Campaign design',
  'web-development': 'Business websites · Landing pages · Web apps',
  'software-design-ai': 'Digital products · Workflow tools · Automation',
  'advertising-campaigns': 'Ad creatives · Campaign videos · Content assets',
};

export const Services: React.FC<ServicesProps> = ({ onSelectService }) => (
  <section id="services" className="scroll-mt-20 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#171817] text-[#f2f2ed] border-b border-white/10">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-12">
        <div>
          <p className="text-xs uppercase tracking-[.15em] text-[#b9ed62] mb-3">What we do</p>
          <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight">Creative services</h2>
        </div>
        <p className="text-sm sm:text-base text-[#a5a7a1] max-w-xl leading-relaxed">
          One remote team for the creative and digital work your business needs. We collaborate with brands, agencies and independent creators worldwide, from individual deliverables to ongoing production.
        </p>
      </div>

      <div className="divide-y divide-white/10 border-y border-white/10">
        {SERVICES.map((service, index) => (
          <button
            type="button"
            key={service.id}
            onClick={() => onSelectService?.(service.title)}
            className="w-full text-left grid grid-cols-[32px_1fr_auto] sm:grid-cols-[64px_1fr_auto] gap-3 sm:gap-4 items-center py-5 sm:py-7 group cursor-pointer"
          >
            <span className="text-xs sm:text-sm text-[#b9ed62] tabular-nums">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h3 className="text-lg sm:text-2xl font-semibold text-[#f2f2ed] group-hover:text-[#b9ed62] transition-colors">{service.title}</h3>
              <p className="text-sm text-[#a5a7a1] mt-2 max-w-3xl leading-relaxed">{serviceDescriptions[service.id] || service.subtitle}</p>
              <p className="mt-2 text-[10px] sm:text-xs text-[#8e928a] tracking-wide">{serviceDeliverables[service.id] || 'Creative and digital services'}</p>
            </div>
            <ArrowUpRight className="text-[#a5a7a1] group-hover:text-[#b9ed62] group-hover:-translate-y-1 group-hover:translate-x-1 transition-all" size={20}/>
          </button>
        ))}
      </div>
    </div>
  </section>
);

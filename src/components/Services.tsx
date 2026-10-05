import React from 'react';
import { SERVICES } from '../data/content';
import { ArrowUpRight } from 'lucide-react';

interface ServicesProps {
  onSelectService?: (title: string) => void;
}

export const Services: React.FC<ServicesProps> = ({ onSelectService }) => {
  return (
    <section id="services" className="py-24 px-6 bg-[#71B913] text-black bg-grid-brand relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header: Strictly "Services" */}
        <div className="mb-12 pb-4 border-b border-black/20">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-black tracking-tight">
            Services
          </h2>
        </div>

        {/* Text-Only Minimal Cards (No Videos, Pure Clean Text) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service) => (
            <div
              key={service.id}
              onClick={() => onSelectService?.(service.title)}
              className="bg-[#0A0A0A] border border-black/15 hover:border-black/30 text-white rounded-2xl p-7 flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1 shadow-xl cursor-default"
            >
              <div>
                {/* Service Title */}
                <h3 className="font-display text-2xl font-bold text-white group-hover:text-[#71B913] transition-colors mb-3">
                  {service.title}
                </h3>

                {/* Service Subtitle / Description Text */}
                <p className="text-sm text-[#CCCCCC] leading-relaxed font-normal">
                  {service.subtitle}
                </p>
              </div>

              {/* Bottom Subtle Indicator */}
              <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-xs text-[#888888]">
                <span className="font-light">Professional Service</span>
                <span className="text-[#71B913] font-semibold flex items-center gap-1">
                  MirrorBook <ArrowUpRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

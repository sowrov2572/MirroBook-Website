import React from 'react';
import { SERVICES } from '../data/content';
import { ArrowUpRight } from 'lucide-react';

interface ServicesProps {
  onSelectService?: (title: string) => void;
}

export const Services: React.FC<ServicesProps> = ({ onSelectService }) => {
  return (
    <section id="services" className="py-14 sm:py-16 px-6 bg-[#71B913] text-black bg-grid-brand relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header: Compact "Services" */}
        <div className="mb-8 pb-3 border-b border-black/20">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-black tracking-tight">
            Services
          </h2>
          <p className="text-xs sm:text-sm text-black/80 font-medium max-w-2xl mt-1.5 leading-relaxed">
            Full-spectrum digital marketing agency services in Bangladesh — from cinematic video editing and graphic design to responsive web development and AI software tools.
          </p>
        </div>

        {/* Compact Minimal Service Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((service) => (
            <div
              key={service.id}
              onClick={() => onSelectService?.(service.title)}
              className="bg-[#0A0A0A] border border-black/15 hover:border-black/35 text-white rounded-xl p-5 flex flex-col justify-between group transition-all duration-200 hover:-translate-y-0.5 shadow-lg cursor-default"
            >
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-white group-hover:text-[#71B913] transition-colors mb-1.5">
                  {service.title}
                </h3>

                <p className="text-xs text-[#CCCCCC] leading-relaxed font-normal">
                  {service.subtitle}
                </p>
              </div>

              <div className="pt-3 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[#888888]">
                <span className="font-light">Professional Service</span>
                <span className="text-[#71B913] font-semibold flex items-center gap-1">
                  MirrorBook <ArrowUpRight size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

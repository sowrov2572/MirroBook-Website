import React from 'react';
import { SERVICES } from '../data/content';
import { ArrowUpRight } from 'lucide-react';

interface ServicesProps {
  onSelectService?: (title: string) => void;
}

export const Services: React.FC<ServicesProps> = ({ onSelectService }) => {
  return (
    <section
      id="services"
      className="scroll-mt-20 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#121614] text-[#F5F7F2] border-b border-white/[0.09] relative overflow-x-clip"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Aligned Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-5 border-b border-white/[0.09]">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#B7F34A] tracking-tight uppercase">
              SERVICES
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#A1AAA2] max-w-xl leading-relaxed">
            MirrorBook Creative Agency services in Bangladesh — from cinematic video editing, motion graphics, and graphic design to digital marketing, web development, and modern software solutions.
          </p>
        </div>

        {/* Equal-Height Elevated Dark Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
          {SERVICES.map((service) => (
            <div
              key={service.id}
              onClick={() => onSelectService?.(service.title)}
              className="glossy-card glossy-card-hover p-5 sm:p-6 min-w-0 flex flex-col justify-between h-full group cursor-default"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-bold text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors leading-snug">
                    {service.title}
                  </h3>
                  <ArrowUpRight
                    size={16}
                    className="text-[#707A72] group-hover:text-[#B7F34A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-1"
                  />
                </div>

                <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed font-normal">
                  {service.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

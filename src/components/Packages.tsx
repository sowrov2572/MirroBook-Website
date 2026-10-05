import React from 'react';
import { PACKAGES } from '../data/content';
import { CheckoutItem, ProductItem } from '../types';
import { ArrowRight } from 'lucide-react';

interface PackagesProps {
  onSelectPackage: (item: CheckoutItem) => void;
  packages?: ProductItem[];
}

export const Packages: React.FC<PackagesProps> = ({ onSelectPackage, packages }) => {
  const displayPackages =
    packages && packages.length > 0
      ? packages.map((p) => ({
          id: p.id,
          name: p.title,
          price: p.price,
          period: p.period || (p.price > 0 ? '/ month' : ''),
          priceDisplay: p.priceDisplay || `৳${p.price.toLocaleString()}`,
          description: p.description,
          featured: p.featured || p.id === 'growth',
        }))
      : PACKAGES;

  return (
    <section id="packages" className="py-24 px-6 bg-[#71B913] text-black bg-grid-brand relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header: Strictly "Agency Packages" */}
        <div className="mb-12 pb-4 border-b border-black/20">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-black tracking-tight">
            Agency Packages
          </h2>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayPackages.map((pkg) => {
            const isGrowth = pkg.featured || pkg.id.includes('growth');

            return (
              <div
                key={pkg.id}
                className={`bg-[#0A0A0A] text-white rounded-3xl p-8 lg:p-10 flex flex-col justify-between transition-all duration-300 relative overflow-hidden shadow-2xl hover:-translate-y-1 ${
                  isGrowth ? 'border-2 border-black/40 ring-2 ring-black/20' : 'border border-black/15'
                }`}
              >
                <div>
                  {/* Title */}
                  <h3 className="font-display text-2xl font-bold text-white mb-2">
                    {pkg.name}
                  </h3>

                  {/* Subtitle */}
                  <p className="text-sm text-[#AAAAAA] mb-6 font-normal leading-relaxed">
                    {pkg.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 pt-4 border-t border-white/10 mb-8">
                    <span className="font-display text-4xl lg:text-5xl font-bold text-white tracking-tight tabular-nums">
                      {pkg.priceDisplay}
                    </span>
                    {pkg.period && pkg.period !== '+' && (
                      <span className="text-xs text-[#888888] font-semibold uppercase ml-1">
                        {pkg.period}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() =>
                    onSelectPackage({
                      id: pkg.id,
                      name: `${pkg.name} Package`,
                      price: `${pkg.priceDisplay} ${pkg.period || ''}`.trim(),
                      category: 'Agency Package',
                    })
                  }
                  className={`w-full py-4 text-xs font-bold uppercase tracking-normal transition-all cursor-pointer rounded-xl flex items-center justify-center gap-2 ${
                    isGrowth
                      ? 'bg-[#71B913] text-black hover:bg-[#81cf17] shadow-[0_0_25px_rgba(113,185,19,0.35)]'
                      : 'bg-white/10 hover:bg-[#71B913] hover:text-black text-white'
                  }`}
                >
                  <span>Select Package</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

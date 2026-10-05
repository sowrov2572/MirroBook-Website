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
    <section id="packages" className="py-28 px-6 bg-[#CCFF00] text-black bg-grid-lemon relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-black/15">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-black/70 font-mono font-semibold block mb-2">
              Retainers
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-black tracking-tight">
              Agency Packages
            </h2>
          </div>
          <p className="text-sm text-black/75 max-w-md mt-4 md:mt-0 font-medium leading-relaxed">
            Transparent flat-rate creative retainers and dedicated engineering with zero hidden surcharges.
          </p>
        </div>

        {/* 3 Pricing Cards: Title + Subtitle */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayPackages.map((pkg) => {
            const isGrowth = pkg.featured || pkg.id.includes('growth');

            return (
              <div
                key={pkg.id}
                className={`matte-glass-lemon-card rounded-3xl p-8 lg:p-10 flex flex-col justify-between transition-all relative overflow-hidden ${
                  isGrowth ? 'border-2 border-black/30 shadow-2xl' : ''
                }`}
              >
                <div>
                  {/* Title */}
                  <h3 className="font-display text-2xl font-bold text-white mb-1">
                    {pkg.name}
                  </h3>

                  {/* Subtitle */}
                  <p className="text-xs text-[#AAAAAA] mb-6 font-light">
                    {pkg.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 pt-4 border-t border-white/10 mb-8">
                    <span className="font-display text-4xl lg:text-5xl font-bold text-white tracking-tight tabular-nums">
                      {pkg.priceDisplay}
                    </span>
                    {pkg.period && pkg.period !== '+' && (
                      <span className="text-xs text-[#888888] font-mono uppercase tracking-wider ml-1">
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
                  className={`w-full py-4 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer rounded-xl flex items-center justify-center gap-2 ${
                    isGrowth
                      ? 'bg-[#CCFF00] text-black hover:bg-[#b8e600] shadow-[0_0_25px_rgba(204,255,0,0.35)]'
                      : 'bg-white/10 hover:bg-[#CCFF00] hover:text-black text-white'
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

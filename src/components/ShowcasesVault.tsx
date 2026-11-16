import React from 'react';
import { ExternalLink } from 'lucide-react';

export const PORTFOLIO_EXTERNAL_URL =
  'https://sowrovhosenstudio.netlify.app/?fbclid=IwY2xjawT_cQFwZG9mBWV4dG4DYWVtAjEwAGJyaWQRMUZLb1JyelFHZjFjTXZkdEJzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEefQrO89VdvwE2c07aR3cz9gATBwysSXe1-9bLYrKOPekyxiVLRWwpag-JVC0_aem_lz_Pwp2R09BO4aB8BeaRAQ';

interface ShowcasesVaultProps {
  onNavigate?: (path: string) => void;
}

export const ShowcasesVault: React.FC<ShowcasesVaultProps> = () => {
  return (
    <section
      id="portfolio"
      className="py-16 sm:py-20 px-5 sm:px-6 lg:px-8 bg-[#0B0D0C] text-[#F5F7F2] bg-grid-subtle border-b border-white/[0.09] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="glossy-card p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2.5">
            <span className="text-xs font-semibold text-[#B7F34A] block">
              Selected Client Work
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F7F2] tracking-tight">
              Portfolio
            </h2>
            <p className="text-sm sm:text-base text-[#A1AAA2] font-normal leading-relaxed">
              Explore our client work, commercial video productions, motion designs, and digital creations.
            </p>
          </div>

          <div className="shrink-0">
            <a
              href={PORTFOLIO_EXTERNAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-7 py-3.5 text-xs sm:text-sm glossy-btn rounded-xl flex items-center justify-center gap-2.5 cursor-pointer group whitespace-nowrap"
            >
              <span>View Portfolio</span>
              <ExternalLink
                size={16}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

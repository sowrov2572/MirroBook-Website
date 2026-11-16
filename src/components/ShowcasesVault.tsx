import React from 'react';
import { ExternalLink } from 'lucide-react';

export const PORTFOLIO_EXTERNAL_URL =
  'https://sowrovhosenstudio.netlify.app/?fbclid=IwY2xjawT_cQFwZG9mBWV4dG4DYWVtAjEwAGJyaWQRMUZLb1JyelFHZjFjTXZkdEJzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEefQrO89VdvwE2c07aR3cz9gATBwysSXe1-9bLYrKOPekyxiVLRWwpag-JVC0_aem_lz_Pwp2R09BO4aB8BeaRAQ';

interface ShowcasesVaultProps {
  onNavigate?: (path: string) => void;
}

export const ShowcasesVault: React.FC<ShowcasesVaultProps> = () => {
  return (
    <section id="portfolio" className="py-16 sm:py-20 px-6 bg-[#070707] text-white bg-grid-subtle border-b border-white/[0.08] relative overflow-hidden">
      <div className="max-w-5xl mx-auto relative z-10 text-center">
        {/* Title */}
        <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight mb-3">
          Portfolio
        </h2>

        <p className="text-sm sm:text-base text-[#AAAAAA] max-w-xl mx-auto font-normal leading-relaxed mb-7">
          Explore our client work, commercial video productions, motion designs, and digital creations.
        </p>

        {/* Clean Prominent Portfolio Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={PORTFOLIO_EXTERNAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-9 py-4 text-sm font-bold uppercase tracking-normal text-black bg-[#71B913] hover:bg-[#81cf17] active:scale-[0.98] rounded-2xl transition-all flex items-center justify-center gap-3 cursor-pointer group"
          >
            <span>View Portfolio</span>
            <ExternalLink size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
};

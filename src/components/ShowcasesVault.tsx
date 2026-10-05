import React from 'react';
import { ExternalLink } from 'lucide-react';

export const PORTFOLIO_EXTERNAL_URL =
  'https://sowrovhosenstudio.netlify.app/?fbclid=IwY2xjawT_cQFwZG9mBWV4dG4DYWVtAjEwAGJyaWQRMUZLb1JyelFHZjFjTXZkdEJzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEefQrO89VdvwE2c07aR3cz9gATBwysSXe1-9bLYrKOPekyxiVLRWwpag-JVC0_aem_lz_Pwp2R09BO4aB8BeaRAQ';

export const ShowcasesVault: React.FC = () => {
  return (
    <section id="portfolio" className="py-24 px-6 bg-[#070707] text-white bg-grid-subtle border-b border-white/[0.08] relative overflow-hidden">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#71B913]/[0.06] rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 text-center">
        {/* Title */}
        <h2 className="font-display text-4xl sm:text-6xl font-bold text-white tracking-tight mb-4">
          Portfolio
        </h2>

        <p className="text-base sm:text-lg text-[#AAAAAA] max-w-xl mx-auto font-normal leading-relaxed mb-8">
          Explore our client work, commercial video productions, motion designs, and digital creations.
        </p>

        {/* Big Prominent Portfolio Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={PORTFOLIO_EXTERNAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-10 py-5 text-sm font-bold uppercase tracking-normal text-black bg-[#71B913] hover:bg-[#81cf17] active:scale-[0.98] rounded-2xl shadow-[0_0_35px_rgba(113,185,19,0.35)] transition-all flex items-center justify-center gap-3 cursor-pointer group"
          >
            <span>View Full Portfolio</span>
            <ExternalLink size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        {/* Studio Link Label */}
        <div className="mt-6 text-xs text-[#666666] font-normal">
          sowrovhosenstudio.netlify.app
        </div>
      </div>
    </section>
  );
};

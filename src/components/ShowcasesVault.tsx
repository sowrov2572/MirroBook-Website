import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '../utils/i18n';

export const PORTFOLIO_EXTERNAL_URL =
  'https://sowrovhosenstudio.netlify.app/';

interface ShowcasesVaultProps {
  onNavigate?: (path: string) => void;
}

export const ShowcasesVault: React.FC<ShowcasesVaultProps> = () => {
  const { t } = useLanguage();

  return (
    <section
      id="portfolio"
      className="scroll-mt-20 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#0B0D0C] text-[#F5F7F2] bg-grid-subtle border-b border-white/[0.09] relative overflow-x-clip"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="glossy-card p-5 sm:p-8 lg:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2.5 min-w-0">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#B7F34A] tracking-tight">
              {t('Portfolio', 'পোর্টফোলিও')}
            </h2>
            <p className="text-sm sm:text-base text-[#A1AAA2] font-normal leading-relaxed">
              {t(
                'Explore our client work, commercial video productions, motion designs, and digital creations.',
                'আমাদের ক্লায়েন্ট প্রজেক্ট, কমার্শিয়াল ভিডিও প্রোডাকশন, মোশন ডিজাইন ও ডিজিটাল কাজগুলো দেখে নিন।'
              )}
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <a
              href={PORTFOLIO_EXTERNAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto min-h-[44px] px-7 py-3.5 text-xs sm:text-sm glossy-btn rounded-xl flex items-center justify-center gap-2.5 cursor-pointer group whitespace-nowrap"
            >
              <span>{t('View Portfolio', 'পোর্টফোলিও দেখুন')}</span>
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

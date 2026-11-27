import React from 'react';
import { ArrowDownRight, ArrowRight } from 'lucide-react';
import { useLanguage } from '../utils/i18n';

interface HeroProps {
  onViewPackages: () => void;
  onBrowseStore: () => void;
  onPlayShowreel?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onViewPackages, onBrowseStore }) => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[calc(100svh-4rem)] lg:min-h-[86vh] flex flex-col justify-center items-center py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-x-clip bg-[#0B0D0C] border-b border-white/[0.09]">
      {/* Full-Bleed Hero Banner with Balanced Matte Dark Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://i.ibb.co/dsxmjMSP/mirrorbook.jpg"
          alt="MirrorBook – Creative Agency and Digital Solutions Brand in Bangladesh"
          width={1920}
          height={1080}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes('WNjVG5Qk')) {
              target.src = 'https://i.ibb.co/WNjVG5Qk/mirrorbook.jpg';
            }
          }}
          className="w-full h-full object-cover object-center opacity-40"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D0C]/80 via-[#0B0D0C]/65 to-[#0B0D0C]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D0C]/85 via-transparent to-[#0B0D0C]/85" />
      </div>

      {/* Centered Content Container */}
      <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col items-center justify-center gap-10 sm:gap-12">
        {/* Top Centered Brand Lockup */}
        <div className="w-full max-w-3xl mx-auto text-center flex flex-col items-center space-y-4 sm:space-y-5">
          {/* 1. Main Heading */}
          <h1 className="font-display text-4xl min-[375px]:text-5xl sm:text-6xl lg:text-[4.75rem] font-bold tracking-tight text-[#F5F7F2] leading-[1.05] [text-wrap:balance]">
            {t('MirrorBook', 'মিরর বুক')}
          </h1>

          {/* 2. Tagline */}
          <p className="text-sm sm:text-base font-semibold text-[#B7F34A] tracking-wide">
            {t('Reflecting Creativity', 'রিফ্লেক্টিং ক্রিয়েটিভিটি')}
          </p>

          {/* 3. Description */}
          <p className="text-sm sm:text-lg text-[#A1AAA2] font-normal leading-relaxed max-w-2xl mx-auto">
            {t(
              'We are a creative agency and digital production studio helping brands and businesses stand out through thoughtful design, engaging videos, compelling content, and reliable web solutions. From the first idea to the final delivery, we turn your vision into creative work that connects with people.',
              'আমরা একটি ক্রিয়েটিভ এজেন্সি ও ডিজিটাল প্রোডাকশন স্টুডিও—যারা মানসম্মত ডিজাইন, আকর্ষণীয় ভিডিও, কার্যকর কনটেন্ট এবং নির্ভরযোগ্য ওয়েব ও এআই সমাধানের মাধ্যমে ব্র্যান্ডগুলোকে আলাদাভাবে তুলে ধরে। প্রথম আইডিয়া থেকে ফাইনাল ডেলিভারি পর্যন্ত আপনার ভিশনকে আমরা রূপ দিই বাস্তবে।'
            )}
          </p>

          {/* 4. Action Buttons */}
          <div className="w-full flex flex-col min-[420px]:flex-row flex-wrap items-stretch min-[420px]:items-center justify-center gap-2.5 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={onViewPackages}
              className="min-h-[44px] px-5 sm:px-6 py-3 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>{t('View Packages', 'প্যাকেজ দেখুন')}</span>
              <ArrowDownRight size={15} />
            </button>

            <button
              type="button"
              onClick={onBrowseStore}
              className="min-h-[44px] px-5 sm:px-6 py-3 text-xs font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>{t('Browse Plugins', 'প্লাগইন ও সফটওয়্যার')}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Service value propositions */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 items-stretch">
          <div className="glossy-card glossy-card-hover p-4 sm:p-5 min-w-0 flex flex-col justify-between h-full">
            <p className="text-sm font-semibold text-[#F5F7F2] mb-2">
              {t('Remote Collaboration', 'রিমোট কোলাবোরেশন')}
            </p>
            <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
              {t(
                'Work with a creative team remotely, wherever your business is based.',
                'আপনার ব্যবসা যেখানেই হোক, আমাদের ক্রিয়েটিভ টিমের সাথে সহজেই অনলাইনে কাজ করুন।'
              )}
            </p>
          </div>
          <div className="glossy-card glossy-card-hover p-4 sm:p-5 min-w-0 flex flex-col justify-between h-full">
            <p className="text-sm font-semibold text-[#F5F7F2] mb-2">
              {t('Design + Video', 'ডিজাইন + ভিডিও')}
            </p>
            <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
              {t(
                'Graphic design, social content, video editing and motion graphics.',
                'গ্রাফিক ডিজাইন, সোশ্যাল কনটেন্ট, ভিডিও এডিটিং এবং মোশন গ্রাফিক্স এক জায়গায়।'
              )}
            </p>
          </div>
          <div className="glossy-card glossy-card-hover p-4 sm:p-5 min-w-0 flex flex-col justify-between h-full">
            <p className="text-sm font-semibold text-[#F5F7F2] mb-2">
              {t('Flexible Engagement', 'সহজ ও ফ্লেক্সিবল কাজের ধরন')}
            </p>
            <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
              {t(
                'Discuss a one-time project or ongoing creative production support.',
                'এককালীন প্রজেক্ট হোক বা মাসিক ক্রিয়েটিভ সাপোর্ট—আপনার প্রয়োজনমতো শুরু করুন।'
              )}
            </p>
          </div>
          <div className="glossy-card glossy-card-hover p-4 sm:p-5 min-w-0 flex flex-col justify-between h-full border-[#B7F34A]/30">
            <p className="text-sm font-semibold text-[#B7F34A] mb-2">
              {t('Clear Communication', 'স্পষ্ট ও দ্রুত যোগাযোগ')}
            </p>
            <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
              {t(
                'Start with your goals, required deliverables and project brief.',
                'আপনার লক্ষ্য, প্রয়োজনীয় ডেলিভারেবলস ও প্রজেক্ট ব্রিফ দিয়ে সহজেই শুরু করুন।'
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

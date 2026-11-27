import React, { useState } from 'react';
import {
  Palette,
  Film,
  Layers,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CheckoutItem } from '../types';
import { PAYMENT_CONFIG } from '../data/content';
import { useLanguage } from '../utils/i18n';

interface PackagesProps {
  onSelectPackage?: (item: CheckoutItem) => void;
  onOpenCustomizer?: (serviceName?: string) => void;
}

export const Packages: React.FC<PackagesProps> = ({
  onSelectPackage,
  onOpenCustomizer,
}) => {
  const { isBn, t } = useLanguage();
  const [expandedDesign, setExpandedDesign] = useState(false);
  const [expandedVideo, setExpandedVideo] = useState(false);
  const [expandedMaster, setExpandedMaster] = useState(false);

  const handlePackageCTA = (packageName: string, startingPrice: string) => {
    if (onOpenCustomizer) {
      onOpenCustomizer(packageName);
    } else if (onSelectPackage) {
      onSelectPackage({
        id: packageName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: packageName,
        price: startingPrice,
        category: 'Monthly Service Package',
      });
    } else {
      const phone = PAYMENT_CONFIG.whatsAppNumber || '8801767079837';
      const text = encodeURIComponent(
        `Hi MirrorBook Agency, I am interested in getting started with the ${packageName} (${startingPrice}). Let's discuss my project scope!`
      );
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    }
  };

  const graphicDesignFeatures = isBn
    ? [
        'প্রতিদিন ৪টি কাস্টম গ্রাফিক ডিজাইন',
        '৩০ দিনে প্রায় ১২০টি ডিজাইন',
        'ইউনিক ও ক্রিয়েটিভ ডিজাইন কনসেপ্ট',
        'ব্র্যান্ড-কেন্দ্রিক ভিজ্যুয়াল ডিজাইন',
        'কাস্টম লেআউট ও ক্রিয়েটিভ কম্পোজিশন',
        'সামঞ্জস্যপূর্ণ ব্র্যান্ড কালার, টাইপোগ্রাফি ও ভিজ্যুয়াল আইডেন্টিটি',
        'সোশ্যাল মিডিয়া পোস্ট ডিজাইন',
        'প্রোমোশনাল ও মার্কেটিং ক্রিয়েটিভস',
        'ব্যবসার লক্ষ্য অনুযায়ী কাস্টমাইজড ডিজাইন',
      ]
    : [
        '4 custom graphic designs per day',
        'Approximately 120 designs per 30-day month',
        'Unique and creative design concepts',
        'Brand-focused visual design',
        'Custom layouts and creative compositions',
        'Consistent brand colors, typography, and visual identity',
        'Social media post designs',
        'Promotional and marketing creatives',
        'Designs tailored to the client’s business goals',
      ];

  const videoEditingFeatures = isBn
    ? [
        'প্রতিদিন ২টি এডিটেড রিলস',
        '৩০ দিনে প্রায় ৬০টি রিলস',
        'প্রফেশনাল ভিডিও এডিটিং',
        'স্মুথ ট্রানজিশন ও ডায়নামিক কাট',
        'প্রয়োজন অনুযায়ী মোশন গ্রাফিক্স ও টেক্সট অ্যানিমেশন',
        'ক্যাপশন ও সাবটাইটেল',
        'সাউন্ড ডিজাইন ও ব্যাকগ্রাউন্ড মিউজিক',
        'কালার কারেকশন ও ভিজ্যুয়াল এনহ্যান্সমেন্ট',
        'সোশ্যাল মিডিয়া-রেডি ভিডিও এক্সপোর্ট',
      ]
    : [
        '2 edited reels per day',
        'Approximately 60 reels per 30-day month',
        'Professional video editing',
        'Smooth transitions and dynamic cuts',
        'Motion graphics and text animations where needed',
        'Captions and subtitles',
        'Sound design and background music',
        'Color correction and visual enhancement',
        'Social media-ready video exports',
      ];

  const masterPackFeatures = isBn
    ? [
        'সম্পূর্ণ মান্থলি গ্রাফিক ডিজাইন (প্রতিদিন ৪টি, মাসে ~১২০টি)',
        'সম্পূর্ণ মান্থলি ভিডিও এডিটিং ও রিলস (প্রতিদিন ২টি, মাসে ~৬০টি)',
        'সব পোস্ট ও ভিডিওতে একই ব্র্যান্ড আইডেন্টিটি',
        'কাস্টম প্রোমোশনাল গ্রাফিক, সোশ্যাল ক্রিয়েটিভ ও লেআউট',
        'ডায়নামিক কাট, মোশন গ্রাফিক্স, ক্যাপশন ও সাবটাইটেল',
        'সাউন্ড ডিজাইন, ব্যাকগ্রাউন্ড মিউজিক ও কালার গ্রেডিং',
        'ফেসবুক, ইনস্টাগ্রাম, টিকটক ও ইউটিউবের জন্য রেডি এক্সপোর্ট',
        'দুইটি প্যাকেজ আলাদা নেওয়ার চেয়ে মাসে ৳৫,০০০ সাশ্রয়',
      ]
    : [
        'Complete Monthly Graphic Design included (4 designs/day, ~120/month)',
        'Complete Monthly Video Editing & Reels included (2 reels/day, ~60/month)',
        'Unified brand visual identity across all posts and videos',
        'Custom promotional graphics, social creatives & layouts',
        'Dynamic cuts, motion graphics, captions & subtitles',
        'Sound design, background music & color grading',
        'Social media-ready exports for Facebook, Instagram, TikTok & YouTube',
        'Save ৳5,000/month compared to booking both packages separately',
      ];

  return (
    <section
      id="packages"
      className="scroll-mt-20 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#121614] text-[#F5F7F2] border-b border-white/[0.09] relative overflow-x-clip"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10 pb-5 border-b border-white/[0.09]">
          <div className="min-w-0">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#B7F34A] tracking-tight break-words uppercase">
              {t('MONTHLY SERVICES', 'মান্থলি প্যাকেজসমূহ')}
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[#A1AAA2] leading-relaxed">
            {t('Consistent creative production starting from ', 'নিয়মিত ক্রিয়েটিভ প্রোডাকশন শুরু মাত্র ')}
            <strong className="text-[#F5F7F2] font-semibold tabular-nums">
              {t('৳25,000/month', '৳২৫,০০০/মাস')}
            </strong>
            {t('.', ' থেকে।')}
          </p>
        </div>

        {/* Equal-Height Subscription Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {/* Package 01: Monthly Graphic Design */}
          <div className="glossy-card glossy-card-hover p-5 sm:p-6 lg:p-7 min-w-0 flex flex-col justify-between h-full">
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2 mb-4 text-xs">
                <span className="inline-flex items-center gap-2 font-semibold text-[#F5F7F2]">
                  <Palette size={15} className="text-[#B7F34A] shrink-0" />
                  <span>{t('Package 01', 'প্যাকেজ ০১')}</span>
                </span>
              </div>

              <div className="lg:min-h-[126px] flex flex-col justify-start">
                <h3 className="font-display text-xl min-[375px]:text-2xl font-bold text-[#F5F7F2] mb-2 break-words leading-snug">
                  {t('Monthly Graphic Design', 'মান্থলি গ্রাফিক ডিজাইন')}
                </h3>

                <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed mb-5 sm:mb-6">
                  {t(
                    '4 custom designs/day (~120 designs/month) tailored to your brand identity and social media growth.',
                    'প্রতিদিন ৪টি কাস্টম ডিজাইন (মাসে ~১২০টি) — আপনার ব্র্যান্ড আইডেন্টিটি ও সোশ্যাল মিডিয়া গ্রোথের জন্য।'
                  )}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B0D0C]/80 border border-white/[0.09] mb-5 sm:mb-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B7F34A] block">
                    {t('Monthly Subscription', 'মান্থলি সাবস্ক্রিপশন')}
                  </span>
                  <span className="text-xs text-[#A1AAA2] font-medium block mt-0.5">
                    {t('Starting From', 'শুরু')}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="font-display text-2xl sm:text-3xl font-bold text-[#F5F7F2] tracking-tight tabular-nums leading-none">
                    {t('৳25,000', '৳২৫,০০০')}
                  </span>
                  <span className="text-xs text-[#B7F34A] font-semibold">
                    {t('/ month', '/ মাস')}
                  </span>
                </div>
              </div>

              {expandedDesign && (
                <div className="space-y-4 mb-6 pt-4 border-t border-white/[0.09]">
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-[#F5F7F2] flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#B7F34A]" />
                      <span>{t("What's Included", 'যা যা থাকছে')}</span>
                    </h4>

                    <ul className="space-y-2">
                      {graphicDesignFeatures.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-[#A1AAA2] leading-relaxed"
                        >
                          <CheckCircle2 size={13} className="text-[#B7F34A] mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-white/[0.07]">
                    <h4 className="text-xs font-semibold text-[#B7F34A] mb-1 flex items-center gap-1.5">
                      <Sparkles size={13} />
                      <span>{t('Our Creative Approach', 'আমাদের কাজের ধরন')}</span>
                    </h4>
                    <p className="text-xs text-[#A1AAA2] leading-relaxed">
                      {t(
                        "Every design is created with the brand's identity, target audience, marketing goals, and visual consistency in mind. We don't just create ordinary posts; we develop creative concepts that represent the brand.",
                        'প্রতিটি ডিজাইন তৈরি হয় আপনার ব্র্যান্ড আইডেন্টিটি, টার্গেট অডিয়েন্স এবং মার্কেটিং লক্ষ্য মাথায় রেখে—যাতে প্রতিটি পোস্ট আপনার ব্র্যান্ডকে প্রফেশনালভাবে উপস্থাপন করে।'
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-5 border-t border-white/[0.09]">
              <button
                type="button"
                onClick={() =>
                  handlePackageCTA('Monthly Graphic Design', 'Starting From ৳25,000/month')
                }
                className="w-full min-h-[44px] py-3.5 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('Get Started', 'শুরু করুন')}</span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => setExpandedDesign((prev) => !prev)}
                className="w-full min-h-[44px] py-2.5 text-xs font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>
                  {expandedDesign ? t('Hide Details', 'বিস্তারিত লুকান') : t('More', 'বিস্তারিত')}
                </span>
                {expandedDesign ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {/* Package 02: Monthly Video Editing & Reels */}
          <div className="glossy-card glossy-card-hover p-5 sm:p-6 lg:p-7 min-w-0 flex flex-col justify-between h-full">
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2 mb-4 text-xs">
                <span className="inline-flex items-center gap-2 font-semibold text-[#F5F7F2]">
                  <Film size={15} className="text-[#B7F34A] shrink-0" />
                  <span>{t('Package 02', 'প্যাকেজ ০২')}</span>
                </span>
              </div>

              <div className="lg:min-h-[126px] flex flex-col justify-start">
                <h3 className="font-display text-xl min-[375px]:text-2xl font-bold text-[#F5F7F2] mb-2 break-words leading-snug">
                  {t('Monthly Video Editing & Reels', 'মান্থলি ভিডিও এডিটিং ও রিলস')}
                </h3>

                <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed mb-5 sm:mb-6">
                  {t(
                    '2 edited reels/day (~60 reels/month) with motion graphics, captions, sound design, and color grading.',
                    'প্রতিদিন ২টি এডিটেড রিলস (মাসে ~৬০টি) — মোশন গ্রাফিক্স, ক্যাপশন, সাউন্ড ডিজাইন ও কালার গ্রেডিংসহ।'
                  )}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B0D0C]/80 border border-white/[0.09] mb-5 sm:mb-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B7F34A] block">
                    {t('Monthly Subscription', 'মান্থলি সাবস্ক্রিপশন')}
                  </span>
                  <span className="text-xs text-[#A1AAA2] font-medium block mt-0.5">
                    {t('Starting From', 'শুরু')}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="font-display text-2xl sm:text-3xl font-bold text-[#F5F7F2] tracking-tight tabular-nums leading-none">
                    {t('৳25,000', '৳২৫,০০০')}
                  </span>
                  <span className="text-xs text-[#B7F34A] font-semibold">
                    {t('/ month', '/ মাস')}
                  </span>
                </div>
              </div>

              {expandedVideo && (
                <div className="space-y-4 mb-6 pt-4 border-t border-white/[0.09]">
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-[#F5F7F2] flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#B7F34A]" />
                      <span>{t("What's Included", 'যা যা থাকছে')}</span>
                    </h4>

                    <ul className="space-y-2">
                      {videoEditingFeatures.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-[#A1AAA2] leading-relaxed"
                        >
                          <CheckCircle2 size={13} className="text-[#B7F34A] mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-white/[0.07]">
                    <h4 className="text-xs font-semibold text-[#B7F34A] mb-1 flex items-center gap-1.5">
                      <Sparkles size={13} />
                      <span>{t('Our Creative Approach', 'আমাদের কাজের ধরন')}</span>
                    </h4>
                    <p className="text-xs text-[#A1AAA2] leading-relaxed">
                      {t(
                        'Engineered with psychological retention hooks, seamless pacing, and Hollywood color grading to turn fleeting TikTok, Instagram, and YouTube viewers into dedicated brand followers.',
                        'আকর্ষণীয় হুক, নিখুঁত পেসিং এবং প্রফেশনাল কালার গ্রেডিং দিয়ে তৈরি ভিডিও যা টিকটক, ইনস্টাগ্রাম ও ইউটিউব দর্শকদের নিয়মিত ফলোয়ারে রূপান্তর করে।'
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-5 border-t border-white/[0.09]">
              <button
                type="button"
                onClick={() =>
                  handlePackageCTA('Monthly Video Editing & Reels', 'Starting From ৳25,000/month')
                }
                className="w-full min-h-[44px] py-3.5 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('Get Started', 'শুরু করুন')}</span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => setExpandedVideo((prev) => !prev)}
                className="w-full min-h-[44px] py-2.5 text-xs font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>
                  {expandedVideo ? t('Hide Details', 'বিস্তারিত লুকান') : t('More', 'বিস্তারিত')}
                </span>
                {expandedVideo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {/* Package 03: Master Pack (Graphic Design + Video Editing) */}
          <div className="glossy-card glossy-card-hover p-5 sm:p-6 lg:p-7 min-w-0 flex flex-col justify-between h-full border-[#B7F34A]/35 md:col-span-2 lg:col-span-1">
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-4 text-xs">
                <span className="inline-flex items-center gap-2 font-semibold text-[#F5F7F2]">
                  <Layers size={15} className="text-[#B7F34A] shrink-0" />
                  <span>{t('Package 03', 'প্যাকেজ ০৩')}</span>
                </span>
                <span className="text-[11px] font-semibold text-[#B7F34A]">
                  {t('Design + Video Bundle', 'ডিজাইন + ভিডিও কম্বো')}
                </span>
              </div>

              <div className="lg:min-h-[126px] flex flex-col justify-start">
                <h3 className="font-display text-xl min-[375px]:text-2xl font-bold text-[#F5F7F2] mb-2 break-words leading-snug">
                  {t('Master Pack', 'মাস্টার প্যাক')}
                </h3>

                <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed mb-5 sm:mb-6">
                  {t(
                    'Complete Graphic Design & Video Editing combined—daily custom designs plus daily edited reels in one monthly plan.',
                    'গ্রাফিক ডিজাইন ও ভিডিও এডিটিং একসাথে—প্রতিদিনের কাস্টম ডিজাইন ও এডিটেড রিলস একটি মান্থলি প্যাকেজেই।'
                  )}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B0D0C]/80 border border-[#B7F34A]/25 mb-5 sm:mb-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B7F34A] block">
                    {t('Monthly Subscription', 'মান্থলি সাবস্ক্রিপশন')}
                  </span>
                  <span className="text-xs text-[#A1AAA2] font-medium block mt-0.5">
                    {t('Save ৳5,000 / mo', 'মাসে ৳৫,০০০ সাশ্রয়')}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="font-display text-2xl sm:text-3xl font-bold text-[#F5F7F2] tracking-tight tabular-nums leading-none">
                    {t('৳45,000', '৳৪৫,০০০')}
                  </span>
                  <span className="text-xs text-[#B7F34A] font-semibold">
                    {t('/ month', '/ মাস')}
                  </span>
                </div>
              </div>

              {expandedMaster && (
                <div className="space-y-4 mb-6 pt-4 border-t border-white/[0.09]">
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-[#F5F7F2] flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#B7F34A]" />
                      <span>{t("What's Included", 'যা যা থাকছে')}</span>
                    </h4>

                    <ul className="space-y-2">
                      {masterPackFeatures.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-[#A1AAA2] leading-relaxed"
                        >
                          <CheckCircle2 size={13} className="text-[#B7F34A] mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-white/[0.07]">
                    <h4 className="text-xs font-semibold text-[#B7F34A] mb-1 flex items-center gap-1.5">
                      <Sparkles size={13} />
                      <span>{t('Our Creative Approach', 'আমাদের কাজের ধরন')}</span>
                    </h4>
                    <p className="text-xs text-[#A1AAA2] leading-relaxed">
                      {t(
                        'One unified creative team handling both your daily graphic designs and short-form video reels—ensuring consistent visual storytelling, faster turnarounds, and stronger brand growth.',
                        'একটি সমন্বিত ক্রিয়েটিভ টিম আপনার প্রতিদিনের গ্রাফিক ডিজাইন ও ভিডিও রিলস দুটোই সামলাবে—যা দ্রুত ডেলিভারি ও শক্তিশালী ব্র্যান্ড গ্রোথ নিশ্চিত করে।'
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-5 border-t border-white/[0.09]">
              <button
                type="button"
                onClick={() =>
                  handlePackageCTA(
                    'Master Pack (Graphic Design + Video Editing)',
                    '৳45,000/month'
                  )
                }
                className="w-full min-h-[44px] py-3.5 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('Get Started', 'শুরু করুন')}</span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => setExpandedMaster((prev) => !prev)}
                className="w-full min-h-[44px] py-2.5 text-xs font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>
                  {expandedMaster ? t('Hide Details', 'বিস্তারিত লুকান') : t('More', 'বিস্তারিত')}
                </span>
                {expandedMaster ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


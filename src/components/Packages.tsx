import React, { useState } from 'react';
import {
  Palette,
  Film,
  CheckCircle2,
  ArrowRight,
  Sliders,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CheckoutItem } from '../types';
import { PAYMENT_CONFIG } from '../data/content';

interface PackagesProps {
  onSelectPackage?: (item: CheckoutItem) => void;
  onOpenCustomizer?: (serviceName?: string) => void;
}

export const Packages: React.FC<PackagesProps> = ({
  onSelectPackage,
  onOpenCustomizer,
}) => {
  const [expandedDesign, setExpandedDesign] = useState(false);
  const [expandedVideo, setExpandedVideo] = useState(false);

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

  const graphicDesignFeatures = [
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

  const videoEditingFeatures = [
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

  return (
    <section
      id="packages"
      className="scroll-mt-20 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#121614] text-[#F5F7F2] border-b border-white/[0.09] relative overflow-x-clip"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10 pb-5 border-b border-white/[0.09]">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-[#B7F34A] block mb-2">
              Reflecting Creativity · MirrorBook
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#F5F7F2] tracking-tight break-words">
              Monthly Service Packages
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[#A1AAA2] leading-relaxed">
            Consistent creative production starting from{' '}
            <strong className="text-[#F5F7F2] font-semibold tabular-nums">৳25,000/month</strong>.
          </p>
        </div>

        {/* Equal-Height Subscription Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
          {/* Package 01: Monthly Graphic Design */}
          <div className="glossy-card glossy-card-hover p-5 sm:p-7 lg:p-8 min-w-0 flex flex-col justify-between h-full">
            <div className="min-w-0">
              {/* Quiet Inline Metadata Row (No Badge Sandwich) */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs">
                <span className="inline-flex items-center gap-2 font-semibold text-[#F5F7F2]">
                  <Palette size={15} className="text-[#B7F34A] shrink-0" />
                  <span>Package 01</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#B7F34A] font-medium">
                  <Sliders size={12} className="shrink-0" />
                  <span>Customizable</span>
                </span>
              </div>

              <h3 className="font-display text-xl min-[375px]:text-2xl sm:text-3xl font-bold text-[#F5F7F2] mb-2 break-words">
                Monthly Graphic Design
              </h3>

              <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed mb-5 sm:mb-6">
                4 custom designs/day (~120 designs/month) tailored to your brand identity and social media growth.
              </p>

              {/* Price Lockup */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#0B0D0C]/75 border border-white/[0.09] mb-5 sm:mb-6">
                <span className="text-xs text-[#A1AAA2] block mb-1 font-medium">
                  Monthly Subscription
                </span>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs text-[#A1AAA2] font-medium">Starting From</span>
                  <span className="font-display text-2xl min-[360px]:text-3xl sm:text-4xl font-bold text-[#F5F7F2] tracking-tight tabular-nums">
                    ৳25,000
                  </span>
                  <span className="text-xs text-[#B7F34A] font-semibold">/ month</span>
                </div>
              </div>

              {/* Expandable Full Details */}
              {expandedDesign && (
                <div className="space-y-4 mb-6 pt-4 border-t border-white/[0.09]">
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-[#F5F7F2] flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#B7F34A]" />
                      <span>What&apos;s Included</span>
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
                    <h5 className="text-xs font-semibold text-[#B7F34A] mb-1 flex items-center gap-1.5">
                      <Sparkles size={13} />
                      <span>Our Creative Approach</span>
                    </h5>
                    <p className="text-xs text-[#A1AAA2] leading-relaxed">
                      Every design is created with the brand&apos;s identity, target audience, marketing goals, and visual consistency in mind. We don&apos;t just create ordinary posts; we develop creative concepts that represent the brand.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-5 border-t border-white/[0.09]">
              <button
                type="button"
                onClick={() =>
                  handlePackageCTA('Monthly Graphic Design', 'Starting From ৳25,000/month')
                }
                className="w-full min-h-[44px] py-3.5 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight size={14} />
              </button>

              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setExpandedDesign((prev) => !prev)}
                  className="w-full min-h-[44px] py-2.5 text-xs font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{expandedDesign ? 'Hide Details' : 'More'}</span>
                  {expandedDesign ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenCustomizer) {
                      onOpenCustomizer('Monthly Graphic Design');
                    }
                  }}
                  className="w-full min-h-[44px] py-2.5 text-xs font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sliders size={13} className="text-[#B7F34A]" />
                  <span>Customize</span>
                </button>
              </div>
            </div>
          </div>

          {/* Package 02: Monthly Video Editing & Reels */}
          <div className="glossy-card glossy-card-hover p-5 sm:p-7 lg:p-8 min-w-0 flex flex-col justify-between h-full">
            <div className="min-w-0">
              {/* Quiet Inline Metadata Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs">
                <span className="inline-flex items-center gap-2 font-semibold text-[#F5F7F2]">
                  <Film size={15} className="text-[#B7F34A] shrink-0" />
                  <span>Package 02</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#B7F34A] font-medium">
                  <Sliders size={12} className="shrink-0" />
                  <span>Customizable</span>
                </span>
              </div>

              <h3 className="font-display text-xl min-[375px]:text-2xl sm:text-3xl font-bold text-[#F5F7F2] mb-2 break-words">
                Monthly Video Editing &amp; Reels
              </h3>

              <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed mb-5 sm:mb-6">
                2 edited reels/day (~60 reels/month) with motion graphics, captions, sound design, and color grading.
              </p>

              {/* Price Lockup */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#0B0D0C]/75 border border-white/[0.09] mb-5 sm:mb-6">
                <span className="text-xs text-[#A1AAA2] block mb-1 font-medium">
                  Monthly Subscription
                </span>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs text-[#A1AAA2] font-medium">Starting From</span>
                  <span className="font-display text-2xl min-[360px]:text-3xl sm:text-4xl font-bold text-[#F5F7F2] tracking-tight tabular-nums">
                    ৳25,000
                  </span>
                  <span className="text-xs text-[#B7F34A] font-semibold">/ month</span>
                </div>
              </div>

              {/* Expandable Full Details */}
              {expandedVideo && (
                <div className="space-y-4 mb-6 pt-4 border-t border-white/[0.09]">
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-[#F5F7F2] flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#B7F34A]" />
                      <span>What&apos;s Included</span>
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
                    <h5 className="text-xs font-semibold text-[#B7F34A] mb-1 flex items-center gap-1.5">
                      <Sparkles size={13} />
                      <span>Our Creative Approach</span>
                    </h5>
                    <p className="text-xs text-[#A1AAA2] leading-relaxed">
                      Engineered with psychological retention hooks, seamless pacing, and Hollywood color grading to turn fleeting TikTok, Instagram, and YouTube viewers into dedicated brand followers.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-5 border-t border-white/[0.09]">
              <button
                type="button"
                onClick={() =>
                  handlePackageCTA('Monthly Video Editing & Reels', 'Starting From ৳25,000/month')
                }
                className="w-full min-h-[44px] py-3.5 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight size={14} />
              </button>

              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setExpandedVideo((prev) => !prev)}
                  className="w-full min-h-[44px] py-2.5 text-xs font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{expandedVideo ? 'Hide Details' : 'More'}</span>
                  {expandedVideo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenCustomizer) {
                      onOpenCustomizer('Monthly Video Editing & Reels');
                    }
                  }}
                  className="w-full min-h-[44px] py-2.5 text-xs font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sliders size={13} className="text-[#B7F34A]" />
                  <span>Customize</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

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
      className="py-16 sm:py-20 px-6 bg-[#070707] text-white bg-grid-subtle border-b border-white/[0.08] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-semibold text-[#71B913] uppercase tracking-wider">
              Reflecting Creativity • MirrorBook
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            Monthly Service Packages
          </h2>

          <p className="text-sm sm:text-base text-[#AAAAAA] leading-relaxed">
            Consistent creative production starting from <strong className="text-white font-semibold">৳25,000/month</strong>.
          </p>
        </div>

        {/* The Two Compact Monthly Subscription Services */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* PACKAGE 01: Monthly Graphic Design */}
          <div className="bg-[#0D0D0D] border border-white/[0.08] hover:border-[#71B913]/40 rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300">
            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.06] border border-white/10 text-xs font-bold text-white uppercase tracking-wider">
                  <Palette size={13} className="text-[#71B913]" />
                  <span>PACKAGE 01</span>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#71B913]/15 border border-[#71B913]/30 text-[11px] font-semibold text-[#71B913]">
                  <Sliders size={11} />
                  <span>Customizable</span>
                </span>
              </div>

              {/* Title */}
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
                Monthly Graphic Design
              </h3>

              {/* Short Description */}
              <p className="text-xs sm:text-sm text-[#AAAAAA] leading-relaxed mb-5">
                4 custom designs/day (~120 designs/month) tailored to your brand identity and social media growth.
              </p>

              {/* Price Lockup */}
              <div className="p-5 rounded-2xl bg-black/60 border border-white/[0.08] mb-5">
                <span className="text-[11px] uppercase tracking-wider text-[#888888] block mb-1 font-semibold">
                  Monthly Subscription
                </span>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs text-[#AAAAAA] font-medium">Starting From</span>
                  <span className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight tabular-nums">
                    ৳25,000
                  </span>
                  <span className="text-xs text-[#71B913] font-semibold uppercase">
                    / month
                  </span>
                </div>
              </div>

              {/* Expandable Full Details */}
              {expandedDesign && (
                <div className="space-y-5 mb-6 pt-2 border-t border-white/[0.08]">
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#71B913]" />
                      <span>What&apos;s Included:</span>
                    </h4>

                    <ul className="space-y-2">
                      {graphicDesignFeatures.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-[#CCCCCC] leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#71B913] mt-1.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <h5 className="text-xs font-bold text-[#71B913] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Sparkles size={13} />
                      <span>Our Creative Approach:</span>
                    </h5>
                    <p className="text-xs text-[#999999] leading-relaxed">
                      Every design is created with the brand&apos;s identity, target audience, marketing goals, and visual consistency in mind. We don&apos;t just create ordinary posts; we develop creative concepts that represent the brand.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => handlePackageCTA('Monthly Graphic Design', 'Starting From ৳25,000/month')}
                className="w-full py-3.5 text-xs font-bold uppercase tracking-wider text-black bg-[#71B913] hover:bg-[#82d119] active:scale-[0.99] transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight size={14} />
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setExpandedDesign((prev) => !prev)}
                  className="w-full py-2.5 text-xs font-semibold text-white hover:text-[#71B913] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
                  className="w-full py-2.5 text-xs font-semibold text-[#CCCCCC] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sliders size={13} className="text-[#71B913]" />
                  <span>Customize</span>
                </button>
              </div>
            </div>
          </div>

          {/* PACKAGE 02: Monthly Video Editing & Reels */}
          <div className="bg-[#0D0D0D] border border-white/[0.08] hover:border-[#71B913]/40 rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300">
            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.06] border border-white/10 text-xs font-bold text-white uppercase tracking-wider">
                  <Film size={13} className="text-[#71B913]" />
                  <span>PACKAGE 02</span>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#71B913]/15 border border-[#71B913]/30 text-[11px] font-semibold text-[#71B913]">
                  <Sliders size={11} />
                  <span>Customizable</span>
                </span>
              </div>

              {/* Title */}
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
                Monthly Video Editing &amp; Reels
              </h3>

              {/* Short Description */}
              <p className="text-xs sm:text-sm text-[#AAAAAA] leading-relaxed mb-5">
                2 edited reels/day (~60 reels/month) with motion graphics, captions, sound design, and color grading.
              </p>

              {/* Price Lockup */}
              <div className="p-5 rounded-2xl bg-black/60 border border-white/[0.08] mb-5">
                <span className="text-[11px] uppercase tracking-wider text-[#888888] block mb-1 font-semibold">
                  Monthly Subscription
                </span>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs text-[#AAAAAA] font-medium">Starting From</span>
                  <span className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight tabular-nums">
                    ৳25,000
                  </span>
                  <span className="text-xs text-[#71B913] font-semibold uppercase">
                    / month
                  </span>
                </div>
              </div>

              {/* Expandable Full Details */}
              {expandedVideo && (
                <div className="space-y-5 mb-6 pt-2 border-t border-white/[0.08]">
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#71B913]" />
                      <span>What&apos;s Included:</span>
                    </h4>

                    <ul className="space-y-2">
                      {videoEditingFeatures.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-[#CCCCCC] leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#71B913] mt-1.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <h5 className="text-xs font-bold text-[#71B913] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Sparkles size={13} />
                      <span>Our Creative Approach:</span>
                    </h5>
                    <p className="text-xs text-[#999999] leading-relaxed">
                      Engineered with psychological retention hooks, seamless pacing, and Hollywood color grading to turn fleeting TikTok, Instagram, and YouTube viewers into dedicated brand followers.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => handlePackageCTA('Monthly Video Editing & Reels', 'Starting From ৳25,000/month')}
                className="w-full py-3.5 text-xs font-bold uppercase tracking-wider text-black bg-[#71B913] hover:bg-[#82d119] active:scale-[0.99] transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight size={14} />
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setExpandedVideo((prev) => !prev)}
                  className="w-full py-2.5 text-xs font-semibold text-white hover:text-[#71B913] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
                  className="w-full py-2.5 text-xs font-semibold text-[#CCCCCC] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sliders size={13} className="text-[#71B913]" />
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

import React, { useState } from 'react';
import {
  Palette,
  Film,
  CheckCircle2,
  ArrowRight,
  Sliders,
  Sparkles,
  Layers,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Clock,
  Zap
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
  const [activeTab, setActiveTab] = useState<'all' | 'design' | 'video'>('all');

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

  const customizationOptions = [
    {
      title: 'Graphic Design Quantity',
      desc: 'Scale up or down from 60, 120 to 150+ high-converting visual assets monthly.',
      icon: Palette,
    },
    {
      title: 'Reels & Video Quantity',
      desc: 'Adjust your publishing frequency with 30, 60, or 90+ viral short-form videos.',
      icon: Film,
    },
    {
      title: 'Additional Motion Graphics',
      desc: 'Add custom 2D/3D VFX, kinetic typography, HUD overlays, and animated logos.',
      icon: Layers,
    },
    {
      title: 'Branding & Creative Concepts',
      desc: 'Complete brand book creation, typography systems, and identity revamp.',
      icon: Sparkles,
    },
    {
      title: 'Custom Project Requirements',
      desc: 'Custom turnaround times, dedicated Slack channels, and flexible production pipelines.',
      icon: Sliders,
    },
  ];

  return (
    <section
      id="packages"
      className="py-24 px-6 bg-[#070707] text-white bg-grid-subtle border-b border-white/[0.08] relative overflow-hidden"
    >
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#71B913]/[0.07] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#71B913]/10 border border-[#71B913]/30 text-xs font-semibold text-[#71B913]">
            <Sparkles size={13} className="text-[#71B913]" />
            <span>Reflecting Creativity • MirrorBook Agency</span>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
            Monthly Service Packages
          </h2>

          <p className="text-base sm:text-lg text-[#AAAAAA] leading-relaxed">
            Consistent, high-caliber creative production for modern businesses, brands, and creators in Bangladesh and worldwide. Our monthly packages start from <strong className="text-white font-semibold">BDT 25,000</strong>.
          </p>

          {/* Pricing Notice Badge */}
          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-[#888888]">
              <Clock size={12} className="text-[#71B913]" />
              <span>Starting From ৳25,000/month • Scope confirmed after onboarding discovery</span>
            </span>
          </div>
        </div>

        {/* The Two Separate Monthly Subscription Services */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20 items-stretch">
          {/* PACKAGE 01: Monthly Graphic Design */}
          <div className="group bg-[#0D0D0D] border border-white/10 hover:border-[#71B913]/50 rounded-3xl p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 shadow-2xl relative overflow-hidden">
            {/* Top glowing ambient highlight */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#71B913]/[0.05] rounded-full blur-3xl pointer-events-none group-hover:bg-[#71B913]/[0.1] transition-all" />

            <div>
              {/* Header Badge & Identifier */}
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-bold text-white uppercase tracking-wider">
                  <Palette size={13} className="text-[#71B913]" />
                  <span>PACKAGE 01</span>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#71B913]/15 border border-[#71B913]/30 text-[11px] font-semibold text-[#71B913]">
                  <Sliders size={11} />
                  <span>Customizable</span>
                </span>
              </div>

              {/* Title */}
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
                Monthly Graphic Design
              </h3>

              {/* Description */}
              <p className="text-sm text-[#AAAAAA] leading-relaxed mb-6">
                Consistent, creative, and brand-focused graphic design solutions for businesses that want a strong and professional social media presence.
              </p>

              {/* Price Lockup */}
              <div className="p-6 rounded-2xl bg-black/60 border border-white/[0.08] mb-8">
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
                <p className="text-[11px] text-[#777777] mt-2">
                  Final pricing confirmed after discussing your monthly deliverable volume and brand requirements.
                </p>
              </div>

              {/* What's Included */}
              <div className="space-y-4 mb-8">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#71B913]" />
                  <span>What&apos;s Included:</span>
                </h4>

                <ul className="space-y-2.5">
                  {graphicDesignFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-[#CCCCCC] leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#71B913] mt-1.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Our Creative Approach Box */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-8">
                <h5 className="text-xs font-bold text-[#71B913] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>Our Creative Approach:</span>
                </h5>
                <p className="text-xs text-[#999999] leading-relaxed">
                  Every design is created with the brand&apos;s identity, target audience, marketing goals, and visual consistency in mind. We don&apos;t just create ordinary posts; we develop creative concepts that represent the brand.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => handlePackageCTA('Monthly Graphic Design', 'Starting From ৳25,000/month')}
                className="w-full py-4 text-xs font-bold uppercase tracking-wider text-black bg-[#71B913] hover:bg-[#82d119] active:scale-[0.99] transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(113,185,19,0.3)]"
              >
                <span>Get Started</span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenCustomizer) {
                    onOpenCustomizer('Monthly Graphic Design');
                  }
                }}
                className="w-full py-3 text-xs font-semibold text-[#CCCCCC] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sliders size={13} className="text-[#71B913]" />
                <span>Customize This Package</span>
              </button>
            </div>
          </div>

          {/* PACKAGE 02: Monthly Video Editing & Reels */}
          <div className="group bg-[#0D0D0D] border border-white/10 hover:border-[#71B913]/50 rounded-3xl p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 shadow-2xl relative overflow-hidden">
            {/* Top glowing ambient highlight */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#71B913]/[0.05] rounded-full blur-3xl pointer-events-none group-hover:bg-[#71B913]/[0.1] transition-all" />

            <div>
              {/* Header Badge & Identifier */}
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-bold text-white uppercase tracking-wider">
                  <Film size={13} className="text-[#71B913]" />
                  <span>PACKAGE 02</span>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#71B913]/15 border border-[#71B913]/30 text-[11px] font-semibold text-[#71B913]">
                  <Sliders size={11} />
                  <span>Customizable</span>
                </span>
              </div>

              {/* Title */}
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
                Monthly Video Editing &amp; Reels
              </h3>

              {/* Description */}
              <p className="text-sm text-[#AAAAAA] leading-relaxed mb-6">
                Professional short-form video editing for brands, businesses, and content creators who want engaging and high-quality social media videos.
              </p>

              {/* Price Lockup */}
              <div className="p-6 rounded-2xl bg-black/60 border border-white/[0.08] mb-8">
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
                <p className="text-[11px] text-[#777777] mt-2">
                  Final pricing confirmed after discussing your monthly deliverable volume and video complexity.
                </p>
              </div>

              {/* What's Included */}
              <div className="space-y-4 mb-8">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#71B913]" />
                  <span>What&apos;s Included:</span>
                </h4>

                <ul className="space-y-2.5">
                  {videoEditingFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-[#CCCCCC] leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#71B913] mt-1.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Our Creative Approach Box */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-8">
                <h5 className="text-xs font-bold text-[#71B913] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>Our Creative Approach:</span>
                </h5>
                <p className="text-xs text-[#999999] leading-relaxed">
                  Engineered with psychological retention hooks, seamless pacing, and Hollywood color grading to turn fleeting TikTok, Instagram, and YouTube viewers into dedicated brand followers.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => handlePackageCTA('Monthly Video Editing & Reels', 'Starting From ৳25,000/month')}
                className="w-full py-4 text-xs font-bold uppercase tracking-wider text-black bg-[#71B913] hover:bg-[#82d119] active:scale-[0.99] transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(113,185,19,0.3)]"
              >
                <span>Get Started</span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenCustomizer) {
                    onOpenCustomizer('Monthly Video Editing & Reels');
                  }
                }}
                className="w-full py-3 text-xs font-semibold text-[#CCCCCC] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sliders size={13} className="text-[#71B913]" />
                <span>Customize This Package</span>
              </button>
            </div>
          </div>
        </div>

        {/* CUSTOMIZE YOUR PACKAGE SECTION: "Need Something More Specific?" */}
        <div className="bg-gradient-to-br from-[#0F0F0F] via-[#0A0A0A] to-[#070707] border border-white/10 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#71B913]/[0.08] rounded-full blur-[140px] pointer-events-none" />

          <div className="max-w-4xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#71B913]/10 border border-[#71B913]/30 text-xs font-bold text-[#71B913] uppercase tracking-wider mb-4">
              <Sliders size={13} />
              <span>Tailored Creative Retainers</span>
            </div>

            <h3 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Need Something More Specific?
            </h3>

            <p className="text-base text-[#AAAAAA] leading-relaxed mb-8 max-w-2xl">
              Every brand has different creative requirements. Customize your monthly package based on your content needs, design quantity, video quantity, and project scope.
            </p>

            {/* Customizable options grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {customizationOptions.map((opt) => {
                const IconComponent = opt.icon;
                return (
                  <div
                    key={opt.title}
                    className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-[#71B913]/30 hover:bg-white/[0.04] transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-[#71B913] mb-3">
                      <IconComponent size={18} />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1.5">{opt.title}</h4>
                    <p className="text-xs text-[#888888] leading-relaxed">{opt.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Important Pricing Rule Clarification Banner */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="text-[#71B913] shrink-0 mt-0.5" />
                <p className="text-xs text-[#AAAAAA] leading-relaxed">
                  <strong className="text-white">Transparent Pricing:</strong> Starting price is ৳25,000/month. Custom pricing is calculated based on exact deliverable volume, revisions, and production requirements. Final pricing is confirmed after discussing your project scope.
                </p>
              </div>
            </div>

            {/* CTA: Customize Your Package */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  if (onOpenCustomizer) {
                    onOpenCustomizer('Custom Monthly Package / Retainer');
                  }
                }}
                className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-black bg-[#71B913] hover:bg-[#82d119] active:scale-[0.99] transition-all rounded-xl flex items-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(113,185,19,0.35)]"
              >
                <Sliders size={15} />
                <span>Customize Your Package</span>
              </button>

              <a
                href={`https://wa.me/${PAYMENT_CONFIG.whatsAppNumber || '8801767079837'}?text=${encodeURIComponent(
                  'Hi MirrorBook Agency! I would like to inquire about customizing a monthly graphic design & video package for my brand.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white hover:text-[#71B913] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <MessageSquare size={15} className="text-[#25D366]" />
                <span>Discuss on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

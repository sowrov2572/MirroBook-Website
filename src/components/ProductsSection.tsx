import React from 'react';
import {
  ArrowRight,
  ExternalLink,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Monitor,
  CheckCircle2,
} from 'lucide-react';
import posTerminalImg from '../assets/images/mirrorpos_pos_terminal_1794819846095.jpg';

interface ProductsSectionProps {
  onLearnMore: () => void;
}

export const ProductsSection: React.FC<ProductsSectionProps> = ({ onLearnMore }) => {
  const highlights = [
    {
      icon: ShoppingCart,
      title: 'Fast POS Billing',
      detail: 'Barcode scan, discounts & instant checkout',
    },
    {
      icon: Package,
      title: 'Smart Inventory',
      detail: 'Real-time stock tracking & low-stock alerts',
    },
    {
      icon: Users,
      title: 'Customer Ledgers',
      detail: 'Track customer dues, credits & suppliers',
    },
    {
      icon: BarChart3,
      title: 'Business Reports',
      detail: 'Daily sales, profit analytics & thermal print',
    },
  ];

  return (
    <section
      id="products"
      className="py-24 px-6 bg-[#070707] text-white bg-grid-subtle border-b border-white/[0.08] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-4 border-b border-white/[0.08] gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#71B913] text-xs font-semibold uppercase tracking-wider mb-3">
              <span>Commercial Software Products</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              Products
            </h2>
            <p className="text-sm sm:text-base text-[#AAAAAA] mt-2 max-w-2xl leading-relaxed">
              Purpose-built business software engineered by MirrorBook for modern retail shops, pharmacies, restaurants, and growing enterprises.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#888888] whitespace-nowrap shrink-0">
            <Monitor size={14} className="text-[#71B913]" />
            <span>Windows Desktop · Web · Mobile</span>
          </div>
        </div>

        {/* Flagship MirrorPOS Product Card */}
        <div className="bg-[#0D0D0D] border border-white/[0.08] hover:border-[#71B913]/45 rounded-3xl overflow-hidden transition-all duration-300 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Left Content Column */}
            <div className="lg:col-span-7 p-7 sm:p-10 lg:p-12 flex flex-col justify-between">
              <div>
                {/* App Icon + Product Name Lockup */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#070707] border border-white/15 p-3 flex items-center justify-center shrink-0 shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
                    <img
                      src="/mirror-pos-icon.png"
                      alt="MirrorPOS Official App Icon"
                      width={64}
                      height={64}
                      loading="eager"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#888888] mb-1.5">
                      <span className="text-[#71B913] font-semibold">Point of Sale Software</span>
                      <span aria-hidden="true">·</span>
                      <span>Cloud &amp; Offline Ready</span>
                    </div>
                    <h3 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
                      MirrorPOS
                    </h3>
                  </div>
                </div>

                {/* Exact Requested Short Description */}
                <p className="text-base sm:text-lg text-[#DDDDDD] leading-relaxed mb-8 max-w-2xl font-normal">
                  A smart Point of Sale software designed to manage sales, inventory, customers, and business operations.
                </p>

                {/* 4 Key Operational Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 pt-6 border-t border-white/[0.08]">
                  {highlights.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <div key={item.title} className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#71B913] shrink-0 mt-0.5">
                          <IconComp size={17} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-xs text-[#888888] mt-0.5 leading-relaxed">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3.5">
                <a
                  href="/mirrorpos"
                  onClick={(e) => {
                    e.preventDefault();
                    onLearnMore();
                  }}
                  className="px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-black bg-[#71B913] hover:bg-[#82d119] active:scale-[0.98] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 shadow-[0_8px_25px_rgba(113,185,19,0.28)]"
                >
                  <span>Learn More</span>
                  <ArrowRight size={15} />
                </a>

                <a
                  href="https://mirror-pos.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:text-[#71B913] bg-white/[0.05] hover:bg-white/[0.09] border border-white/15 hover:border-[#71B913]/50 active:scale-[0.98] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Launch MirrorPOS</span>
                  <ExternalLink size={14} />
                </a>

                <div className="flex items-center gap-1.5 text-xs text-[#888888] sm:ml-auto">
                  <CheckCircle2 size={14} className="text-[#71B913] shrink-0" />
                  <span>Installable on Windows Desktop</span>
                </div>
              </div>
            </div>

            {/* Right Visual Showcase Column */}
            <div className="lg:col-span-5 bg-[#090909] border-t lg:border-t-0 lg:border-l border-white/[0.08] p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-[#888888] mb-3">
                  <span className="font-medium text-white/90">Live Interface Preview</span>
                  <span>Sales &amp; Checkout Terminal</span>
                </div>

                <a
                  href="/mirrorpos"
                  onClick={(e) => {
                    e.preventDefault();
                    onLearnMore();
                  }}
                  className="block group relative aspect-video lg:aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/10 hover:border-[#71B913]/50 bg-black transition-all cursor-pointer"
                  aria-label="Open MirrorPOS Product Page"
                >
                  <img
                    src={posTerminalImg}
                    alt="MirrorPOS Point of Sale Desktop Interface Preview"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 pointer-events-none" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                    <span className="text-white font-semibold">
                      Explore Features, Manual &amp; Install Guide
                    </span>
                    <span className="text-[#71B913] font-bold flex items-center gap-1">
                      Open <ArrowRight size={13} />
                    </span>
                  </div>
                </a>
              </div>

              <div className="mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-3 gap-3 text-center">
                <div className="py-2">
                  <div className="font-display text-lg font-bold text-white tabular-nums">58/80mm</div>
                  <div className="text-[11px] text-[#888888] mt-0.5">Thermal Print</div>
                </div>
                <div className="py-2 border-x border-white/[0.08]">
                  <div className="font-display text-lg font-bold text-[#71B913] tabular-nums">1-Click</div>
                  <div className="text-[11px] text-[#888888] mt-0.5">Desktop App</div>
                </div>
                <div className="py-2">
                  <div className="font-display text-lg font-bold text-white tabular-nums">Cloud</div>
                  <div className="text-[11px] text-[#888888] mt-0.5">Auto Sync</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

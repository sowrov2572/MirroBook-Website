import React from 'react';
import { SERVICES } from '../data/content';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../utils/i18n';

interface ServicesProps {
  onSelectService?: (title: string) => void;
}

const SERVICES_BN: Record<string, { title: string; subtitle: string }> = {
  'video-editing': {
    title: 'সিনেম্যাটিক ভিডিও এডিটিং',
    subtitle:
      'কমার্শিয়াল কাট, প্রফেশনাল কালার গ্রেডিং এবং ডায়নামিক সাউন্ড ডিজাইনের মাধ্যমে দর্শক ধরে রাখার উপযোগী প্রিমিয়াম ভিডিও এডিটিং সার্ভিস।',
  },
  'reels-editing': {
    title: 'রিলস ও শর্ট-ফর্ম ভিডিও',
    subtitle:
      'টিকটক, ইনস্টাগ্রাম ও ইউটিউব শর্টসের জন্য ভাইরাল হুক পেসিং, কাইনেটিক ক্যাপশন এবং আকর্ষণীয় ভিজ্যুয়াল টাইমিং।',
  },
  'graphic-design': {
    title: 'গ্রাফিক ডিজাইন ও ব্র্যান্ডিং',
    subtitle:
      'আধুনিক ও মিনিমাল ব্র্যান্ড আইডেন্টিটি, টাইপোগ্রাফি সিস্টেম এবং হাই-কনভার্টিং সোশ্যাল ও প্রোমোশনাল গ্রাফিক ডিজাইন।',
  },
  'web-development': {
    title: 'মডার্ন ওয়েব ডেভেলপমেন্ট',
    subtitle:
      'দ্রুতগতির রেসপন্সিভ ওয়েবসাইট, কাস্টম ওয়েব অ্যাপ্লিকেশন এবং বিজনেস-কেন্দ্রিক আধুনিক ডিজিটাল প্ল্যাটফর্ম নির্মাণ।',
  },
  'software-design-ai': {
    title: 'এআই ও সফটওয়্যার ডিজাইন',
    subtitle:
      'কাস্টম এআই অটোমেশন ওয়ার্কফ্লো, অ্যাডোবি প্লাগইন প্যানেল এবং ক্রিয়েটিভ টিমের জন্য আধুনিক প্রোডাক্টিভিটি টুলস।',
  },
  'advertising-campaigns': {
    title: 'অ্যাডভার্টাইজিং ক্যাম্পেইন',
    subtitle:
      'রেজাল্ট-কেন্দ্রিক ডিজিটাল মার্কেটিং স্ট্র্যাটেজি, পারফরম্যান্স ভিডিও ভ্যারিয়েন্ট, ডিরেক্ট রেসপন্স স্ক্রিপ্ট ও পেইড ক্যাম্পেইন অ্যাসেট।',
  },
};

export const Services: React.FC<ServicesProps> = ({ onSelectService }) => {
  const { isBn, t } = useLanguage();

  return (
    <section
      id="services"
      className="scroll-mt-20 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#121614] text-[#F5F7F2] border-b border-white/[0.09] relative overflow-x-clip"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Aligned Section Header */}
        <div className="mb-10 pb-5 border-b border-white/[0.09]">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#B7F34A] tracking-tight uppercase">
            {t('SERVICES', 'আমাদের সার্ভিসেস')}
          </h2>
        </div>

        {/* Equal-Height Elevated Dark Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
          {SERVICES.map((service) => {
            const bn = SERVICES_BN[service.id];
            const title = isBn && bn ? bn.title : service.title;
            const subtitle = isBn && bn ? bn.subtitle : service.subtitle;
            return (
              <div
                key={service.id}
                onClick={() => onSelectService?.(title)}
                className="glossy-card glossy-card-hover p-5 sm:p-6 min-w-0 flex flex-col justify-between h-full group cursor-default"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-bold text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors leading-snug">
                      {title}
                    </h3>
                    <ArrowUpRight
                      size={16}
                      className="text-[#707A72] group-hover:text-[#B7F34A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-1"
                    />
                  </div>

                  <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed font-normal">
                    {subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

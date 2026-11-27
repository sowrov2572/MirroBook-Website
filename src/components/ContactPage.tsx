import React, { useEffect } from 'react';
import { ArrowLeft, ArrowUpRight, Mail, MessageCircle, Globe, Clock3 } from 'lucide-react';
import { useLanguage } from '../utils/i18n';

interface ContactPageProps {
  onNavigateHome: () => void;
  onOpenEmailSheet?: (defaultSubject?: string) => void;
}

const WHATSAPP_URL = 'https://wa.me/8801767079837?text=' + encodeURIComponent('Hello');
const EMAIL_URL = 'mailto:mirrorbook.site@gmail.com?subject=' + encodeURIComponent('Project Enquiry | MirrorBook');

export const ContactPage: React.FC<ContactPageProps> = ({
  onNavigateHome,
  onOpenEmailSheet,
}) => {
  const { t } = useLanguage();

  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact MirrorBook',
      url: 'https://mirrorbook.site/contact',
      description: 'Contact MirrorBook for creative production, branding, video editing, motion graphics, digital marketing, and web development services.',
      mainEntity: {
        '@type': 'Organization',
        '@id': 'https://mirrorbook.site/#organization',
        name: 'MirrorBook',
        email: 'mirrorbook.site@gmail.com',
        telephone: '+8801767079837',
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'business inquiries',
          email: 'mirrorbook.site@gmail.com',
          telephone: '+8801767079837',
          url: 'https://wa.me/8801767079837',
          availableLanguage: ['English', 'Bengali'],
        },
      },
    };
    let script = document.getElementById('mirrorbook-contact-schema') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'mirrorbook-contact-schema';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
    return () => document.getElementById('mirrorbook-contact-schema')?.remove();
  }, []);

  return (
    <div className="min-h-[70vh] bg-[#0B0D0C] text-[#F5F7F2]">
      <section className="relative overflow-hidden border-b border-white/[0.09] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(183,243,74,0.10),transparent_55%)]" />
        <div className="relative mx-auto max-w-5xl">
          <button type="button" onClick={onNavigateHome} className="mb-10 inline-flex min-h-10 items-center gap-2 text-xs font-medium text-[#A1AAA2] transition-colors hover:text-[#B7F34A] cursor-pointer">
            <ArrowLeft size={14} /> {t('Back to MirrorBook', 'মিরর বুকে ফিরে যান')}
          </button>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#B7F34A]">
            {t('Let’s create something meaningful', 'চলুন অসাধারণ কিছু তৈরি করি')}
          </p>
          <h1 className="max-w-4xl font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
            {t('Have a project in mind?', 'আপনার কি কোনো প্রজেক্টের পরিকল্পনা আছে?')}
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#A1AAA2] sm:text-base">
            {t(
              'Tell us what you are building, what you need, and where you want to take your brand. MirrorBook works with businesses, creators, and agencies to deliver thoughtful creative and digital solutions.',
              'আপনি কী তৈরি করতে চান, আপনার কী প্রয়োজন এবং ব্র্যান্ডকে কোথায় নিয়ে যেতে চান তা আমাদের জানান। মিরর বুক ব্যবসা, ক্রিয়েটর ও এজেন্সিগুলোর জন্য প্রিমিয়াম ক্রিয়েটিভ ও ডিজিটাল সল্যুশন তৈরি করে।'
            )}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-2 lg:px-8">
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="group glossy-card glossy-card-hover flex min-h-[230px] flex-col justify-between rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#B7F34A]/10 text-[#B7F34A]"><MessageCircle size={23} /></span>
            <ArrowUpRight size={19} className="text-[#707A72] transition-colors group-hover:text-[#B7F34A]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#B7F34A]">
              {t('Fastest way to reach us', 'দ্রুত যোগাযোগের মাধ্যম')}
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold">
              {t('Chat on WhatsApp', 'হোয়াটসঅ্যাপে চ্যাট করুন')}
            </h2>
            <p className="mt-2 text-sm text-[#A1AAA2]">
              {t(
                'Start a direct conversation with our team about your project.',
                'আপনার প্রজেক্ট নিয়ে আমাদের টিমের সাথে সরাসরি কথা বলুন।'
              )}
            </p>
            <p className="mt-4 text-sm font-semibold text-[#F5F7F2]">+880 1767-079837</p>
          </div>
        </a>

        {onOpenEmailSheet ? (
          <button
            type="button"
            onClick={() => onOpenEmailSheet('Project Enquiry')}
            className="group glossy-card glossy-card-hover flex min-h-[230px] w-full flex-col justify-between rounded-2xl p-6 text-left sm:p-8 cursor-pointer"
          >
            <div className="flex w-full items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#B7F34A]/10 text-[#B7F34A]"><Mail size={23} /></span>
              <ArrowUpRight size={19} className="text-[#707A72] transition-colors group-hover:text-[#B7F34A]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#B7F34A]">
                {t('For project briefs & details', 'প্রজেক্টের বিস্তারিত জানাতে')}
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold">
                {t('Send us an Email', 'আমাদের ইমেইল পাঠান')}
              </h2>
              <p className="mt-2 text-sm text-[#A1AAA2]">
                {t(
                  'Share your requirements, references, timeline, or budget with us.',
                  'আপনার চাহিদা, রেফারেন্স, সময়সীমা বা বাজেট আমাদের সাথে শেয়ার করুন।'
                )}
              </p>
              <p className="mt-4 break-all text-sm font-semibold text-[#F5F7F2]">mirrorbook.site@gmail.com</p>
            </div>
          </button>
        ) : (
          <a href={EMAIL_URL} className="group glossy-card glossy-card-hover flex min-h-[230px] flex-col justify-between rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#B7F34A]/10 text-[#B7F34A]"><Mail size={23} /></span>
              <ArrowUpRight size={19} className="text-[#707A72] transition-colors group-hover:text-[#B7F34A]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#B7F34A]">
                {t('For project briefs & details', 'প্রজেক্টের বিস্তারিত জানাতে')}
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold">
                {t('Send us an Email', 'আমাদের ইমেইল পাঠান')}
              </h2>
              <p className="mt-2 text-sm text-[#A1AAA2]">
                {t(
                  'Share your requirements, references, timeline, or budget with us.',
                  'আপনার চাহিদা, রেফারেন্স, সময়সীমা বা বাজেট আমাদের সাথে শেয়ার করুন।'
                )}
              </p>
              <p className="mt-4 break-all text-sm font-semibold text-[#F5F7F2]">mirrorbook.site@gmail.com</p>
            </div>
          </a>
        )}
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/[0.09] bg-[#121614] p-6 sm:grid-cols-2 sm:p-8">
          <div className="flex items-start gap-3">
            <Globe size={18} className="mt-0.5 text-[#B7F34A]" />
            <div>
              <h3 className="text-sm font-semibold">{t('Working Worldwide', 'বিশ্বব্যাপী সেবা')}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#A1AAA2]">
                {t(
                  'Based in Bangladesh, collaborating remotely with brands and teams around the world.',
                  'বাংলাদেশ থেকে সারা বিশ্বের ব্র্যান্ড ও টিমের সাথে রিমোটলি কাজ করছি।'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock3 size={18} className="mt-0.5 text-[#B7F34A]" />
            <div>
              <h3 className="text-sm font-semibold">
                {t('Clear Project Communication', 'স্বচ্ছ প্রজেক্ট কমিউনিকেশন')}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#A1AAA2]">
                {t(
                  'Send us your brief and we’ll discuss the scope, deliverables, timeline, and next steps.',
                  'আপনার প্রজেক্টের বিবরণ পাঠান — আমরা কাজের পরিধি, ডেলিভারেবল ও সময়সীমা নিয়ে আলোচনা করব।'
                )}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

import React from 'react';
import { useLanguage } from '../utils/i18n';

interface FooterProps {
  onNavigate?: (path: string) => void;
  onOpenEmailSheet?: (defaultSubject?: string) => void;
}

const FOOTER_WHATSAPP_URL = 'https://wa.me/8801767079837?text=' + encodeURIComponent('Hello');

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenEmailSheet }) => {
  const { t } = useLanguage();

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/')) {
      e.preventDefault();
      if (onNavigate) {
        onNavigate(href);
      } else {
        window.location.href = href;
      }
    } else if (href.startsWith('#') && window.location.pathname !== '/') {
      e.preventDefault();
      if (onNavigate) {
        onNavigate('/');
        setTimeout(() => {
          const target = document.querySelector(href);
          target?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      }
    }
  };

  return (
    <footer className="bg-[#121614] border-t border-white/[0.09] py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 pb-10 sm:pb-12 border-b border-white/[0.09]">
          {/* Brand lockup */}
          <div className="md:col-span-5 space-y-3">
            <span className="font-display text-2xl font-bold tracking-tight text-[#F5F7F2] block">
              {t('MirrorBook', 'মিরর বুক')}
            </span>
            <p className="text-xs text-[#B7F34A] font-semibold">
              {t('Reflecting Creativity', 'রিফ্লেক্টিং ক্রিয়েটিভিটি')}
            </p>
            <p className="text-sm text-[#A1AAA2] max-w-sm leading-relaxed pt-1 font-normal">
              {t(
                'MirrorBook is a creative agency and digital production studio in Bangladesh. We help brands bring ideas to life through graphic design, video editing, motion graphics, branding, digital marketing, web development, and practical digital solutions.',
                'মিরর বুক বাংলাদেশের একটি ক্রিয়েটিভ এজেন্সি ও ডিজিটাল প্রোডাকশন স্টুডিও। গ্রাফিক ডিজাইন, ভিডিও এডিটিং, মোশন গ্রাফিক্স, ব্র্যান্ডিং, ডিজিটাল মার্কেটিং, ওয়েব ডেভেলপমেন্ট এবং আধুনিক এআই সফটওয়্যার সলিউশনের মাধ্যমে আমরা ব্র্যান্ডগুলোকে এগিয়ে নিই।'
              )}
            </p>
            <a href="/contact" onClick={(e) => handleNav(e, '/contact')} className="inline-flex items-center text-xs font-semibold text-[#B7F34A] hover:text-[#F5F7F2] transition-colors">
              {t('Let’s discuss your project →', 'আপনার প্রজেক্ট নিয়ে কথা বলুন →')}
            </a>
          </div>

          {/* Agency & Studio Links */}
          <div className="md:col-span-2 space-y-3">
            <span className="text-xs text-[#F5F7F2] font-bold uppercase tracking-wider block">
              {t('Agency', 'এজেন্সি')}
            </span>
            <ul className="space-y-2.5 text-xs text-[#A1AAA2]">
              <li>
                <a href="#services" onClick={(e) => handleNav(e, '#services')} className="hover:text-[#B7F34A] transition-colors">
                  {t('Services', 'সার্ভিসেস')}
                </a>
              </li>
              <li>
                <a href="#portfolio" onClick={(e) => handleNav(e, '#portfolio')} className="hover:text-[#B7F34A] transition-colors">
                  {t('Portfolio', 'পোর্টফোলিও')}
                </a>
              </li>
              <li>
                <a href="#packages" onClick={(e) => handleNav(e, '#packages')} className="hover:text-[#B7F34A] transition-colors">
                  {t('Packages', 'প্যাকেজ')}
                </a>
              </li>
              <li>
                <a
                  href="/sowrov-hosen"
                  onClick={(e) => handleNav(e, '/sowrov-hosen')}
                  className="hover:text-[#B7F34A] transition-colors text-[#F5F7F2] font-medium"
                >
                  {t('Founder & Team', 'ফাউন্ডার ও টিম')}
                </a>
              </li>
              <li>
                <a href="/contact" onClick={(e) => handleNav(e, '/contact')} className="hover:text-[#B7F34A] transition-colors text-[#F5F7F2] font-medium">
                  {t('Contact Us', 'যোগাযোগ করুন')}
                </a>
              </li>
            </ul>
          </div>

          {/* Software, Library & Courses */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-xs text-[#F5F7F2] font-bold uppercase tracking-wider block">
              {t('Software, Library & Courses', 'সফটওয়্যার, লাইব্রেরি ও কোর্স')}
            </span>
            <ul className="space-y-2.5 text-xs text-[#A1AAA2]">
              <li>
                <a
                  href="/mirrorpos"
                  onClick={(e) => handleNav(e, '/mirrorpos')}
                  className="hover:text-[#B7F34A] transition-colors text-[#F5F7F2] font-medium"
                >
                  {t('MirrorPOS · Smart POS Software', 'মিররপস · স্মার্ট পিওএস সফটওয়্যার')}
                </a>
              </li>
              <li>
                <a
                  href="/mirrorbot"
                  onClick={(e) => handleNav(e, '/mirrorbot')}
                  className="hover:text-[#B7F34A] transition-colors text-[#F5F7F2] font-medium inline-flex items-center gap-1.5"
                >
                  <img
                    src="/mirrorbot-icon.png"
                    alt="Mirror Bot"
                    width={16}
                    height={16}
                    loading="eager"
                    decoding="async"
                    className="w-4 h-4 rounded object-contain shrink-0"
                  />
                  <span>{t('Mirror Bot · AI Support Agent', 'মিরর বট · এআই সাপোর্ট এজেন্ট')}</span>
                </a>
              </li>
              <li>
                <a href="#software" onClick={(e) => handleNav(e, '#software')} className="hover:text-[#B7F34A] transition-colors">
                  {t('Software Library', 'সফটওয়্যার লাইব্রেরি')}
                </a>
              </li>
              <li>
                <a href="#plugins" onClick={(e) => handleNav(e, '#plugins')} className="hover:text-[#B7F34A] transition-colors">
                  {t('Plugin Library', 'প্লাগইন লাইব্রেরি')}
                </a>
              </li>
              <li>
                <a href="#tutorials" onClick={(e) => handleNav(e, '#tutorials')} className="hover:text-[#B7F34A] transition-colors">
                  {t('Courses & Free Tutorials', 'কোর্স ও ফ্রি টিউটোরিয়াল')}
                </a>
              </li>
            </ul>
          </div>

          {/* Studio Network / Social Links */}
          <div className="md:col-span-2 space-y-3">
            <span className="text-xs text-[#F5F7F2] font-bold uppercase tracking-wider block">
              {t('Network', 'নেটওয়ার্ক')}
            </span>
            <ul className="space-y-2.5 text-xs text-[#A1AAA2]">
              <li>
                <a
                  href="https://sowrovhosenstudio.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#B7F34A] transition-colors font-medium text-[#F5F7F2]"
                >
                  {t('Portfolio Studio ↗', 'পোর্টফোলিও স্টুডিও ↗')}
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/profile.php?id=61557704393608"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="MirrorBook Official Facebook Page"
                  className="hover:text-[#B7F34A] transition-colors"
                >
                  {t('Facebook', 'ফেসবুক')}
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/mirror.book/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="MirrorBook Official Instagram Profile"
                  className="hover:text-[#B7F34A] transition-colors"
                >
                  {t('Instagram', 'ইনস্টাগ্রাম')}
                </a>
              </li>
              <li>
                <a
                  href="https://www.tiktok.com/@mirror__book"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="MirrorBook Official TikTok Profile"
                  className="hover:text-[#B7F34A] transition-colors"
                >
                  {t('TikTok', 'টিকটক')}
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/mirrorbook/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="MirrorBook Official LinkedIn Page"
                  className="hover:text-[#B7F34A] transition-colors"
                >
                  {t('LinkedIn', 'লিংকডইন')}
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@MirrorBook_Offical"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="MirrorBook Official YouTube Channel"
                  className="hover:text-[#B7F34A] transition-colors"
                >
                  {t('YouTube', 'ইউটিউব')}
                </a>
              </li>
              <li>
                <a
                  href={FOOTER_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat with MirrorBook on WhatsApp"
                  className="hover:text-[#B7F34A] transition-colors font-medium text-[#F5F7F2]"
                >
                  {t('Chat on WhatsApp', 'হোয়াটসঅ্যাপে চ্যাট করুন')}
                </a>
              </li>
              <li>
                <a
                  href="mailto:mirrorbook.site@gmail.com"
                  onClick={(e) => {
                    if (onOpenEmailSheet) {
                      e.preventDefault();
                      onOpenEmailSheet('Project Enquiry');
                    }
                  }}
                  className="hover:text-[#B7F34A] transition-colors break-all cursor-pointer"
                >
                  mirrorbook.site@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A1AAA2] gap-4 text-center sm:text-left">
          <p>{t('© 2026 MirrorBook Studio. All rights reserved.', '© ২০২৬ মিরর বুক স্টুডিও। সর্বস্বত্ব সংরক্ষিত।')}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2">
            <a
              href="/privacy-policy"
              onClick={(e) => handleNav(e, '/privacy-policy')}
              className="hover:text-[#B7F34A] transition-colors"
            >
              {t('Privacy Policy', 'প্রাইভেসি পলিসি')}
            </a>
            <span className="text-white/20">·</span>
            <a
              href="/data-deletion"
              onClick={(e) => handleNav(e, '/data-deletion')}
              className="hover:text-[#B7F34A] transition-colors"
            >
              {t('Data Deletion', 'ডেটা ডিলিট')}
            </a>
            <span className="text-white/20">·</span>
            <span className="text-[#707A72] text-[11px]">
              {t('Encrypted Single-User Vault System', 'সুরক্ষিত পার্সোনাল ভল্ট সিস্টেম')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

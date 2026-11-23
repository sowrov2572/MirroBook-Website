import React from 'react';

interface FooterProps {
  onNavigate?: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
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
              MirrorBook
            </span>
            <p className="text-xs text-[#B7F34A] font-semibold">
              Reflecting Creativity
            </p>
            <p className="text-sm text-[#A1AAA2] max-w-sm leading-relaxed pt-1 font-normal">
              MirrorBook is a creative agency and digital production studio in Bangladesh. We help brands bring ideas to life through graphic design, video editing, motion graphics, branding, digital marketing, web development, and practical digital solutions.
            </p>
            <a href="/contact" onClick={(e) => handleNav(e, '/contact')} className="inline-flex items-center text-xs font-semibold text-[#B7F34A] hover:text-[#F5F7F2] transition-colors">Let’s discuss your project →</a>
          </div>

          {/* Agency & Studio Links */}
          <div className="md:col-span-2 space-y-3">
            <span className="text-xs text-[#F5F7F2] font-bold uppercase tracking-wider block">
              Agency
            </span>
            <ul className="space-y-2.5 text-xs text-[#A1AAA2]">
              <li>
                <a href="#services" onClick={(e) => handleNav(e, '#services')} className="hover:text-[#B7F34A] transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#portfolio" onClick={(e) => handleNav(e, '#portfolio')} className="hover:text-[#B7F34A] transition-colors">
                  Portfolio
                </a>
              </li>
              <li>
                <a href="#packages" onClick={(e) => handleNav(e, '#packages')} className="hover:text-[#B7F34A] transition-colors">
                  Packages
                </a>
              </li>
              <li>
                <a
                  href="/sowrov-hosen"
                  onClick={(e) => handleNav(e, '/sowrov-hosen')}
                  className="hover:text-[#B7F34A] transition-colors text-[#F5F7F2] font-medium"
                >
                  Founder &amp; Team
                </a>
              </li>
              <li>
                <a href="/contact" onClick={(e) => handleNav(e, '/contact')} className="hover:text-[#B7F34A] transition-colors text-[#F5F7F2] font-medium">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Software, Library & Courses */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-xs text-[#F5F7F2] font-bold uppercase tracking-wider block">
              Software, Library &amp; Courses
            </span>
            <ul className="space-y-2.5 text-xs text-[#A1AAA2]">
              <li>
                <a
                  href="/mirrorpos"
                  onClick={(e) => handleNav(e, '/mirrorpos')}
                  className="hover:text-[#B7F34A] transition-colors text-[#F5F7F2] font-medium"
                >
                  MirrorPOS · Smart POS Software
                </a>
              </li>
              <li>
                <a
                  href="/mirrorbot"
                  onClick={(e) => handleNav(e, '/mirrorbot')}
                  className="hover:text-[#B7F34A] transition-colors text-[#F5F7F2] font-medium"
                >
                  Mirror Bot · AI Support Agent
                </a>
              </li>
              <li>
                <a href="#software" onClick={(e) => handleNav(e, '#software')} className="hover:text-[#B7F34A] transition-colors">
                  Software Library
                </a>
              </li>
              <li>
                <a href="#plugins" onClick={(e) => handleNav(e, '#plugins')} className="hover:text-[#B7F34A] transition-colors">
                  Plugin Library
                </a>
              </li>
              <li>
                <a href="#tutorials" onClick={(e) => handleNav(e, '#tutorials')} className="hover:text-[#B7F34A] transition-colors">
                  Courses &amp; Free Tutorials
                </a>
              </li>
            </ul>
          </div>

          {/* Studio Network / Social Links */}
          <div className="md:col-span-2 space-y-3">
            <span className="text-xs text-[#F5F7F2] font-bold uppercase tracking-wider block">
              Network
            </span>
            <ul className="space-y-2.5 text-xs text-[#A1AAA2]">
              <li>
                <a
                  href="https://sowrovhosenstudio.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#B7F34A] transition-colors font-medium text-[#F5F7F2]"
                >
                  Portfolio Studio ↗
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
                  Facebook
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
                  Instagram
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
                  TikTok
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
                  LinkedIn
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
                  YouTube
                </a>
              </li>
              <li>
                <a
                  href="mailto:mirrorbook.site@gmail.com"
                  className="hover:text-[#B7F34A] transition-colors break-all"
                >
                  mirrorbook.site@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A1AAA2] gap-4 text-center sm:text-left">
          <p>© 2026 MirrorBook Studio. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2">
            <a href="#services" className="hover:text-[#F5F7F2] transition-colors">
              Privacy &amp; Licensing
            </a>
            <span className="text-white/20">·</span>
            <span className="text-[#707A72] text-[11px]">
              Encrypted Single-User Vault System
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

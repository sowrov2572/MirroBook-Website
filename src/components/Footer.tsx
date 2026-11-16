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
    <footer className="bg-[#121614] border-t border-white/[0.09] py-16 px-5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/[0.09]">
          {/* Brand lockup */}
          <div className="md:col-span-2 space-y-3">
            <span className="font-display text-2xl font-bold tracking-tight text-[#F5F7F2] block">
              MirrorBook
            </span>
            <p className="text-xs text-[#B7F34A] font-semibold">
              Reflecting Creativity
            </p>
            <p className="text-sm text-[#A1AAA2] max-w-sm leading-relaxed pt-1 font-normal">
              Full-service digital studio combining high-impact video production, bespoke brand identity systems, and custom AI software design.
            </p>
          </div>

          {/* Direct Navigation */}
          <div className="space-y-3">
            <span className="text-xs text-[#F5F7F2] font-bold block">
              Index
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
                <a
                  href="/mirrorpos"
                  onClick={(e) => handleNav(e, '/mirrorpos')}
                  className="hover:text-[#B7F34A] transition-colors text-[#F5F7F2] font-medium"
                >
                  MirrorPOS Software
                </a>
              </li>
              <li>
                <a
                  href="/sowrov-hosen"
                  onClick={(e) => handleNav(e, '/sowrov-hosen')}
                  className="hover:text-[#B7F34A] transition-colors text-[#F5F7F2] font-medium"
                >
                  Founder: Sowrov Hosen
                </a>
              </li>
              <li>
                <a href="#packages" onClick={(e) => handleNav(e, '#packages')} className="hover:text-[#B7F34A] transition-colors">
                  Agency Packages
                </a>
              </li>
              <li>
                <a href="#plugins" onClick={(e) => handleNav(e, '#plugins')} className="hover:text-[#B7F34A] transition-colors">
                  Plugin Store
                </a>
              </li>
              <li>
                <a href="#software" onClick={(e) => handleNav(e, '#software')} className="hover:text-[#B7F34A] transition-colors">
                  Software Library
                </a>
              </li>
              <li>
                <a href="#tutorials" onClick={(e) => handleNav(e, '#tutorials')} className="hover:text-[#B7F34A] transition-colors">
                  Courses &amp; Tutorials
                </a>
              </li>
            </ul>
          </div>

          {/* Studio Network / Social Links */}
          <div className="space-y-3">
            <span className="text-xs text-[#F5F7F2] font-bold block">
              Network
            </span>
            <ul className="space-y-2.5 text-xs text-[#A1AAA2]">
              <li>
                <a
                  href="/sowrov-hosen"
                  onClick={(e) => handleNav(e, '/sowrov-hosen')}
                  className="hover:text-[#B7F34A] transition-colors font-medium text-[#F5F7F2]"
                >
                  Sowrov Hosen (Founder) →
                </a>
              </li>
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
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#B7F34A] transition-colors"
                >
                  X (Twitter)
                </a>
              </li>
              <li>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#B7F34A] transition-colors"
                >
                  YouTube
                </a>
              </li>
              <li>
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#B7F34A] transition-colors"
                >
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#B7F34A] transition-colors"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A1AAA2] gap-4">
          <p>© 2026 MirrorBook Studio. All rights reserved.</p>

          <div className="flex items-center gap-5">
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

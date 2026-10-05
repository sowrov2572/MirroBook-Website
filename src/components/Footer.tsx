import React from 'react';
import { Lock } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  return (
    <footer className="bg-[#080808] border-t border-[#1A1A1A] py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#1A1A1A]">
          {/* Brand lockup */}
          <div className="md:col-span-2 space-y-3">
            <span className="font-display text-2xl font-bold tracking-tight text-white block">
              MirrorBook
            </span>
            <p className="text-xs tracking-normal text-[#71B913] font-semibold">
              Reflecting Creativity
            </p>
            <p className="text-sm text-[#888888] max-w-sm leading-relaxed pt-2 font-normal">
              Full-service digital studio combining high-impact video production, bespoke brand identity systems, and custom AI software design.
            </p>
          </div>

          {/* Direct Navigation */}
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-normal text-white font-bold block">
              Index
            </span>
            <ul className="space-y-2 text-xs text-[#888888]">
              <li>
                <a href="#services" className="hover:text-[#71B913] transition-colors">Services</a>
              </li>
              <li>
                <a href="#portfolio" className="hover:text-[#71B913] transition-colors">Portfolio</a>
              </li>
              <li>
                <a href="#packages" className="hover:text-[#71B913] transition-colors">Agency Packages</a>
              </li>
              <li>
                <a href="#plugins" className="hover:text-[#71B913] transition-colors">Plugin Store</a>
              </li>
              <li>
                <a href="#courses" className="hover:text-[#71B913] transition-colors">Courses & Tutorials</a>
              </li>
            </ul>
          </div>

          {/* Studio Network / Social Links */}
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-normal text-white font-bold block">
              Network
            </span>
            <ul className="space-y-2 text-xs text-[#888888]">
              <li>
                <a
                  href="https://sowrovhosenstudio.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#71B913] transition-colors font-medium text-white/90"
                >
                  Portfolio Studio ↗
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#71B913] transition-colors"
                >
                  X (Twitter)
                </a>
              </li>
              <li>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#71B913] transition-colors"
                >
                  YouTube
                </a>
              </li>
              <li>
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#71B913] transition-colors"
                >
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#71B913] transition-colors"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Discreet Admin Link */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#555555] gap-4">
          <p>© 2026 MirrorBook Studio. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <a href="#services" className="hover:text-[#888888] transition-colors">
              Privacy &amp; Licensing
            </a>
            <span className="text-[#333333]">·</span>
            {/* Discreet Admin Link */}
            <button
              onClick={onOpenAdmin}
              className="text-[#444444] hover:text-[#71B913] transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
              title="Admin Registry Portal"
            >
              <Lock size={12} />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

import React, { useState } from 'react';
import { Menu, X, Sparkles, ArrowRight } from 'lucide-react';

interface HeaderProps {
  onStartProject: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onStartProject }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Capabilities', href: '#services' },
    { name: 'Showcases', href: '#showcases' },
    { name: 'Retainers', href: '#packages' },
    { name: 'Plugin Store', href: '#plugins' },
    { name: 'Masterclasses', href: '#courses' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-[#080808]/75 border-b border-white/[0.07] transition-all">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Lockup with iPhone glossy indicator */}
        <a href="#" className="flex items-center gap-3 group text-left">
          <div className="w-9 h-9 rounded-xl glass-panel border border-white/10 flex items-center justify-center text-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.15)] group-hover:border-[#CCFF00]/50 transition-colors">
            <span className="font-display font-bold text-lg">M</span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-bold tracking-tight text-white group-hover:text-[#CCFF00] transition-colors">
                MirrorBook
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] shadow-[0_0_6px_#CCFF00] animate-pulse" />
            </div>
            <span className="text-[10px] tracking-[0.2em] text-[#888888] font-mono uppercase">
              Reflecting Creativity
            </span>
          </div>
        </a>

        {/* Desktop Navigation with Glossy Hover */}
        <nav className="hidden md:flex items-center gap-1 glass-pill px-4 py-1.5 rounded-full">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-xs font-mono uppercase tracking-wider text-[#999999] hover:text-white px-3.5 py-1.5 rounded-full hover:bg-white/[0.06] transition-all duration-150"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Action Button: Glossy Lemon Green */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onStartProject}
            className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-black bg-[#CCFF00] hover:bg-[#b8e600] active:scale-[0.98] rounded-full transition-all duration-150 cursor-pointer shadow-[0_0_20px_rgba(204,255,0,0.3)] flex items-center gap-1.5"
          >
            <span>Start a Project</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#888888] hover:text-white transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#0C0C0C]/95 backdrop-blur-3xl px-6 py-6 space-y-4">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-mono uppercase text-[#AAAAAA] hover:text-[#CCFF00] transition-colors py-1"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="pt-4 border-t border-white/[0.08]">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onStartProject();
              }}
              className="w-full py-3 text-center text-xs font-semibold uppercase tracking-wider text-black bg-[#CCFF00] hover:bg-[#b8e600] rounded-xl transition-colors shadow-[0_0_20px_rgba(204,255,0,0.3)]"
            >
              Start a Project
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

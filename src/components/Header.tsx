import React, { useState } from 'react';
import { Menu, X, ArrowRight, User as UserIcon, FolderDown } from 'lucide-react';
import { AppUser } from '../types';

interface HeaderProps {
  onStartProject: () => void;
  user: AppUser | null;
  onOpenVault: () => void;
  onSignIn: () => void;
  purchaseCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onStartProject,
  user,
  onOpenVault,
  onSignIn,
  purchaseCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Services', href: '#services' },
    { name: 'Portfolio', href: '#portfolio' },
    { name: 'Packages', href: '#packages' },
    { name: 'Plugin Store', href: '#plugins' },
    { name: 'Courses', href: '#courses' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-[#080808]/85 border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Lockup with MirrorBook Official Icon & Typography */}
        <a href="#" className="flex items-center gap-3.5 group text-left">
          <img
            src="https://i.ibb.co/vCgzdc3H/icon.png"
            alt="MirrorBook Icon"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('vCgzdc3H')) {
                target.src = 'https://i.ibb.co/vCgzdc3H/icon.png';
              }
            }}
            className="w-10 h-10 rounded-xl object-contain drop-shadow-[0_0_12px_rgba(113,185,19,0.35)] group-hover:scale-105 transition-transform"
          />

          <div className="flex flex-col">
            <span className="font-display text-xl font-bold tracking-normal text-white group-hover:text-[#71B913] transition-colors leading-tight">
              MirrorBook
            </span>
            <span className="text-xs text-[#999999] font-normal tracking-normal leading-tight mt-0.5">
              Reflecting Creativity
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] px-4 py-1.5 rounded-full">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-xs font-medium text-[#CCCCCC] hover:text-[#71B913] px-3.5 py-1.5 rounded-full hover:bg-white/[0.06] transition-all duration-150"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Action Buttons & User Account Lockup */}
        <div className="hidden md:flex items-center gap-3">
          {/* Creator Account / Vault Button */}
          {user ? (
            <button
              onClick={onOpenVault}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-[#71B913]/50 text-xs text-white transition-all cursor-pointer group"
              title="Creator Vault & Downloads"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 rounded-full object-cover border border-[#71B913]"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#71B913] text-black text-[10px] font-bold flex items-center justify-center">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="font-medium group-hover:text-[#71B913] transition-colors">
                My Vault
              </span>
              {purchaseCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#71B913] text-black text-[10px] font-bold">
                  {purchaseCount}
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-[#CCCCCC] hover:text-white transition-all cursor-pointer"
            >
              <UserIcon size={13} className="text-[#71B913]" />
              <span>Sign In</span>
            </button>
          )}

          <button
            onClick={onStartProject}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-normal text-black bg-[#71B913] hover:bg-[#81cf17] active:scale-[0.98] rounded-full transition-all duration-150 cursor-pointer shadow-[0_0_20px_rgba(113,185,19,0.3)] flex items-center gap-1.5"
          >
            <span>Start a Project</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Mobile Hamburger & Quick Account */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <button
              onClick={onOpenVault}
              className="p-1.5 rounded-full bg-white/10 text-[#71B913]"
              title="My Vault"
            >
              <FolderDown size={18} />
            </button>
          ) : (
            <button
              onClick={onSignIn}
              className="p-1.5 rounded-full bg-white/5 text-[#CCCCCC]"
              title="Sign In"
            >
              <UserIcon size={18} />
            </button>
          )}

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
                className="text-sm font-medium text-[#AAAAAA] hover:text-[#71B913] transition-colors py-1"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-white/[0.08] space-y-2">
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenVault();
                }}
                className="w-full py-2.5 text-center text-xs font-semibold text-white bg-white/10 rounded-xl flex items-center justify-center gap-2"
              >
                <FolderDown size={14} className="text-[#71B913]" />
                <span>Open My Vault ({purchaseCount} items)</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignIn();
                }}
                className="w-full py-2.5 text-center text-xs font-semibold text-white bg-white/10 rounded-xl flex items-center justify-center gap-2"
              >
                <UserIcon size={14} className="text-[#71B913]" />
                <span>Sign In to Creator Account</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onStartProject();
              }}
              className="w-full py-3 text-center text-xs font-bold uppercase tracking-normal text-black bg-[#71B913] hover:bg-[#81cf17] rounded-xl transition-colors shadow-[0_0_20px_rgba(113,185,19,0.3)]"
            >
              Start a Project
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

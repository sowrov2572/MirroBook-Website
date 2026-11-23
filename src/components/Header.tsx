import React, { useState } from 'react';
import { Menu, X, ArrowRight, User as UserIcon, FolderDown, ShieldAlert } from 'lucide-react';
import { AppUser, isVerifiedAdminUser } from '../types';

interface HeaderProps {
  onStartProject: () => void;
  user: AppUser | null;
  onOpenVault: () => void;
  onSignIn: () => void;
  purchaseCount: number;
  onOpenAdmin?: () => void;
  onNavigate?: (path: string) => void;
  currentPath?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onStartProject,
  user,
  onOpenVault,
  onSignIn,
  purchaseCount,
  onOpenAdmin,
  onNavigate,
  currentPath = '/',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isOwner = isVerifiedAdminUser(user);

  const navLinks = [
    { name: 'Services', href: '#services' },
    { name: 'Portfolio', href: '#portfolio' },
    { name: 'Founder & Team', href: '/sowrov-hosen' },
    { name: 'Contact', href: '/contact' },
    { name: 'Packages', href: '#packages' },
    { name: 'Plugins & Software', href: '#plugins-software' },
    { name: 'Courses & Tutorials', href: '#tutorials' },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/')) {
      e.preventDefault();
      if (onNavigate) {
        onNavigate(href);
      } else {
        window.location.href = href;
      }
    } else if (href.startsWith('#') && currentPath !== '/') {
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
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0B0D0C]/85 border-b border-white/[0.09] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Lockup with MirrorBook Official Icon */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            if (onNavigate) {
              onNavigate('/');
            } else {
              window.location.href = '/';
            }
          }}
          className="flex items-center gap-2.5 sm:gap-3 group text-left cursor-pointer shrink-0"
        >
          <img
            src="/icon.png"
            alt="MirrorBook Official Logo"
            width={36}
            height={36}
            loading="eager"
            decoding="async"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.endsWith('/mirrorbook-logo.png')) {
                target.src = '/mirrorbook-logo.png';
              }
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain transition-transform duration-150 group-hover:scale-105"
          />

          <div className="flex flex-col">
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors leading-tight whitespace-nowrap">
              MirrorBook
            </span>
            <span className="text-[11px] text-[#A1AAA2] font-normal leading-tight whitespace-nowrap hidden xl:block">
              Reflecting Creativity
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-0.5 xl:gap-1 bg-[#121614]/80 border border-white/[0.09] px-1.5 xl:px-2 py-1 rounded-xl min-w-0"
        >
          {navLinks.map((link) => {
            const isCurrent =
              link.href === currentPath ||
              ((currentPath === '/mirrorpos' || currentPath === '/mirrorbot') &&
                link.href === '#plugins-software');
            return (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className={`text-[11px] xl:text-xs font-medium px-2 xl:px-3 py-1.5 rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 ${
                  isCurrent
                    ? 'text-[#0B0D0C] bg-[#B7F34A] font-semibold'
                    : 'text-[#A1AAA2] hover:text-[#F5F7F2] hover:bg-white/[0.06]'
                }`}
              >
                {link.name}
              </a>
            );
          })}
        </nav>

        {/* Action Buttons & User Account Lockup */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {/* Studio Owner Console Access */}
          {isOwner && onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-xs font-semibold text-amber-300 transition-all cursor-pointer whitespace-nowrap shrink-0"
              title="Studio Owner Console"
            >
              <ShieldAlert size={13} className="text-amber-400" />
              <span>Studio Console</span>
            </button>
          )}

          {/* Customer Account / Vault Button */}
          {user ? (
            <button
              type="button"
              onClick={onOpenVault}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#171C19] hover:bg-[#1E2521] border border-white/[0.09] hover:border-[#B7F34A]/40 text-xs text-[#F5F7F2] transition-all cursor-pointer group whitespace-nowrap shrink-0"
              title="Creator Vault & Downloads"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 rounded-lg object-cover border border-[#B7F34A]/60"
                />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-[#B7F34A] text-[#0B0D0C] text-[10px] font-bold flex items-center justify-center">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="font-medium group-hover:text-[#B7F34A] transition-colors">
                My Account
              </span>
              {purchaseCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-[#B7F34A] text-[#0B0D0C] text-[10px] font-bold tabular-nums leading-none">
                  {purchaseCount}
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl glossy-btn-secondary text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
            >
              <UserIcon size={13} className="text-[#B7F34A]" />
              <span>Sign In</span>
            </button>
          )}

          <button
            type="button"
            onClick={onStartProject}
            className="px-4 py-2 text-xs glossy-btn rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Start a Project</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Mobile Quick Account & Menu Toggle */}
        <div className="flex lg:hidden items-center gap-1.5 shrink-0">
          {user ? (
            <button
              type="button"
              onClick={onOpenVault}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#171C19] border border-white/[0.09] text-[#B7F34A] cursor-pointer"
              title="My Account"
            >
              <FolderDown size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#171C19] border border-white/[0.09] text-[#F5F7F2] cursor-pointer"
              title="Sign In"
            >
              <UserIcon size={18} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#A1AAA2] hover:text-[#F5F7F2] hover:bg-white/[0.05] transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border-b border-white/[0.09] bg-[#121614]/98 backdrop-blur-2xl px-4 sm:px-6 py-4 space-y-4">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isCurrent =
                link.href === currentPath ||
                ((currentPath === '/mirrorpos' || currentPath === '/mirrorbot') &&
                  link.href === '#plugins-software');
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleLinkClick(e, link.href);
                  }}
                  className={`text-sm font-medium transition-colors px-3 py-2.5 min-h-[44px] flex items-center rounded-xl ${
                    isCurrent
                      ? 'text-[#0B0D0C] bg-[#B7F34A] font-semibold'
                      : 'text-[#A1AAA2] hover:text-[#F5F7F2] hover:bg-white/[0.05]'
                  }`}
                >
                  {link.name}
                </a>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/[0.09] space-y-2.5">
            {isOwner && onOpenAdmin && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="w-full min-h-[44px] py-2.5 text-center text-xs font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldAlert size={14} className="text-amber-400" />
                <span>Studio Owner Console</span>
              </button>
            )}

            {user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenVault();
                }}
                className="w-full min-h-[44px] py-2.5 text-center text-xs font-semibold text-[#F5F7F2] bg-[#171C19] border border-white/[0.09] rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <FolderDown size={14} className="text-[#B7F34A]" />
                <span>My Account Dashboard ({purchaseCount} items)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignIn();
                }}
                className="w-full min-h-[44px] py-2.5 text-center text-xs font-semibold text-[#F5F7F2] bg-[#171C19] border border-white/[0.09] rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserIcon size={14} className="text-[#B7F34A]" />
                <span>Sign In / Create Account</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onStartProject();
              }}
              className="w-full min-h-[44px] py-3 text-center text-xs glossy-btn rounded-xl cursor-pointer"
            >
              Start a Project
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

import React from 'react';
import { Home, ShoppingBag, FolderDown, User, Sparkles } from 'lucide-react';
import { AppUser } from '../types';
import { useLanguage } from '../utils/i18n';

interface MobileBottomNavProps {
  activeTab: string;
  onNavigate: (sectionId: string) => void;
  onNavigateHome?: () => void;
  cartCount: number;
  user: AppUser | null;
  onOpenVault: () => void;
  onSignIn: () => void;
  onOpenCartOrStore: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onNavigate,
  onNavigateHome,
  cartCount,
  user,
  onOpenVault,
  onSignIn,
  onOpenCartOrStore,
}) => {
  const { t } = useLanguage();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none px-2.5 sm:px-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)]">
      <nav
        aria-label="Mobile Navigation"
        className="pointer-events-auto glossy-glass-dock rounded-2xl px-1.5 sm:px-2 py-1.5 flex items-center justify-between gap-1 max-w-md mx-auto"
      >
        {/* Home */}
        <button
          type="button"
          onClick={() => {
            if (onNavigateHome) {
              onNavigateHome();
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-0 flex-1 px-1 sm:px-2 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'home'
              ? 'text-[#B7F34A] bg-white/[0.06]'
              : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
          }`}
        >
          <Home size={18} />
          <span className="text-[10px] font-medium mt-0.5 truncate max-w-full">
            {t('Home', 'হোম')}
          </span>
        </button>

        {/* Plugin Store */}
        <button
          type="button"
          onClick={() => onNavigate('plugins')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-0 flex-1 px-1 sm:px-2 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'plugins'
              ? 'text-[#B7F34A] bg-white/[0.06]'
              : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
          }`}
        >
          <Sparkles size={18} />
          <span className="text-[10px] font-medium mt-0.5 truncate max-w-full">
            {t('Plugins', 'প্লাগইন')}
          </span>
        </button>

        {/* Store / Cart Action */}
        <button
          type="button"
          onClick={onOpenCartOrStore}
          className="relative flex flex-col items-center justify-center min-h-[44px] min-w-0 flex-1 px-1.5 sm:px-2.5 py-1 rounded-xl glossy-btn cursor-pointer"
        >
          <ShoppingBag size={17} className="text-[#0B0D0C]" />
          <span className="text-[10px] font-bold text-[#0B0D0C] mt-0.5 truncate max-w-full">
            {t('Store', 'স্টোর')}
          </span>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0B0D0C] text-[#B7F34A] border border-[#B7F34A] text-[9px] font-bold flex items-center justify-center tabular-nums">
              {cartCount}
            </span>
          )}
        </button>

        {/* Vault / Library */}
        <button
          type="button"
          onClick={() => {
            if (user) {
              onOpenVault();
            } else {
              onSignIn();
            }
          }}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-0 flex-1 px-1 sm:px-2 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'vault'
              ? 'text-[#B7F34A] bg-white/[0.06]'
              : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
          }`}
        >
          <FolderDown size={18} />
          <span className="text-[10px] font-medium mt-0.5 truncate max-w-full">
            {t('Vault', 'ভল্ট')}
          </span>
        </button>

        {/* User Account / Profile */}
        {user ? (
          <button
            type="button"
            onClick={onOpenVault}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-0 flex-1 px-1 sm:px-2 rounded-xl text-[#F5F7F2] hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-5 h-5 rounded-lg border border-[#B7F34A] object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-lg bg-[#B7F34A] text-[#0B0D0C] text-[10px] font-bold flex items-center justify-center">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <span className="text-[10px] font-medium text-[#B7F34A] mt-0.5 truncate max-w-full">
              {t('Account', 'অ্যাকাউন্ট')}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-0 flex-1 px-1 sm:px-2 rounded-xl text-[#A1AAA2] hover:text-[#F5F7F2] transition-colors cursor-pointer"
          >
            <User size={18} />
            <span className="text-[10px] font-medium mt-0.5 truncate max-w-full">
              {t('Login', 'লগইন')}
            </span>
          </button>
        )}
      </nav>
    </div>
  );
};

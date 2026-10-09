import React from 'react';
import { Home, ShoppingBag, FolderDown, User, Sparkles } from 'lucide-react';
import { AppUser } from '../types';

interface MobileBottomNavProps {
  activeTab: string;
  onNavigate: (sectionId: string) => void;
  cartCount: number;
  user: AppUser | null;
  onOpenVault: () => void;
  onSignIn: () => void;
  onOpenCartOrStore: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onNavigate,
  cartCount,
  user,
  onOpenVault,
  onSignIn,
  onOpenCartOrStore,
}) => {
  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-50">
      <nav className="glossy-glass-dock rounded-2xl px-2 py-2 flex items-center justify-around shadow-[0_15px_35px_rgba(0,0,0,0.85)] border border-white/15">
        {/* Home */}
        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'text-[#71B913] bg-white/[0.06]'
              : 'text-[#888888] hover:text-white'
          }`}
        >
          <Home size={18} />
          <span className="text-[10px] font-medium mt-1">Home</span>
        </button>

        {/* Plugin Store */}
        <button
          type="button"
          onClick={() => onNavigate('plugins')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'plugins'
              ? 'text-[#71B913] bg-white/[0.06]'
              : 'text-[#888888] hover:text-white'
          }`}
        >
          <Sparkles size={18} />
          <span className="text-[10px] font-medium mt-1">Plugins</span>
        </button>

        {/* Center Cart / Instant Buy Action */}
        <button
          type="button"
          onClick={onOpenCartOrStore}
          className="relative -top-2 flex flex-col items-center justify-center"
        >
          <div className="w-12 h-12 rounded-full glossy-btn flex items-center justify-center shadow-[0_6px_20px_rgba(113,185,19,0.45)] cursor-pointer active:scale-95 transition-transform border border-white/30">
            <ShoppingBag size={20} className="text-black" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black text-[#71B913] border border-[#71B913] text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-[#71B913] mt-0.5">Cart</span>
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
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'vault'
              ? 'text-[#71B913] bg-white/[0.06]'
              : 'text-[#888888] hover:text-white'
          }`}
        >
          <FolderDown size={18} />
          <span className="text-[10px] font-medium mt-1">Vault</span>
        </button>

        {/* User Account / Profile */}
        {user ? (
          <button
            type="button"
            onClick={onOpenVault}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-white transition-all cursor-pointer"
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-5 h-5 rounded-full border border-[#71B913] object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[#71B913] text-black text-[10px] font-bold flex items-center justify-center">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <span className="text-[10px] font-medium text-[#71B913] mt-1 truncate max-w-[42px]">
              Active
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[#888888] hover:text-white transition-all cursor-pointer"
          >
            <User size={18} />
            <span className="text-[10px] font-medium mt-1">Login</span>
          </button>
        )}
      </nav>
    </div>
  );
};

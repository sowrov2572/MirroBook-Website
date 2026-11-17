import React from 'react';
import {
  X,
  Download,
  ShieldCheck,
  LogOut,
  Package,
  Sparkles,
  FolderDown,
  ShieldAlert,
  LayoutDashboard,
} from 'lucide-react';
import { UserPurchase, AppUser, isVerifiedAdminUser } from '../types';

interface UserVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null;
  purchases: UserPurchase[];
  onSignOut: () => void;
  onBrowseStore: () => void;
  onOpenAdmin?: () => void;
  onOpenDashboard?: () => void;
  onSelectDownload?: (purchase: UserPurchase) => void;
}

export const UserVaultModal: React.FC<UserVaultModalProps> = ({
  isOpen,
  onClose,
  user,
  purchases,
  onSignOut,
  onBrowseStore,
  onOpenAdmin,
  onOpenDashboard,
  onSelectDownload,
}) => {
  if (!isOpen) return null;

  const isAdmin = isVerifiedAdminUser(user);

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[#0B0D0C]/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-4 py-4 sm:py-6">
        <div className="relative w-full max-w-2xl max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col glossy-card border border-white/[0.09] text-left overflow-hidden my-auto shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
          {/* Top Header */}
          <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-white/[0.09] bg-[#171C19]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-[#B7F34A]/15 border border-[#B7F34A]/40 text-[#B7F34A] flex items-center justify-center shadow-inner shrink-0">
                <FolderDown size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-sm font-bold text-[#F5F7F2] tracking-normal flex flex-wrap items-center gap-2">
                  <span>My Library &amp; Downloads</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#B7F34A] text-black font-bold">
                    Synced
                  </span>
                </h3>
                <p className="text-xs text-[#A1AAA2] font-normal truncate">
                  Permanent access to your purchased tools &amp; plugins
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-white/10 text-[#A1AAA2] hover:text-[#F5F7F2] transition-colors flex items-center justify-center cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Account Info Strip */}
          <div className="shrink-0 px-4 sm:px-6 py-3.5 bg-[#121614] border-b border-white/[0.09] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Customer'}
                  className="w-8 h-8 rounded-full border border-white/20 object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 text-[#F5F7F2] font-bold text-xs flex items-center justify-center shrink-0">
                  {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="text-xs min-w-0">
                <span className="font-semibold text-[#F5F7F2] block truncate">
                  {user?.displayName || 'Customer Account'}
                </span>
                <span className="text-[#A1AAA2] font-normal font-mono text-[11px] break-all">
                  {user?.email}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onOpenDashboard && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDashboard();
                  }}
                  className="min-h-[38px] px-3 py-1.5 text-xs glossy-btn rounded-lg flex items-center gap-1.5 cursor-pointer font-bold"
                >
                  <LayoutDashboard size={13} />
                  <span>Full Dashboard</span>
                </button>
              )}

              {isAdmin && onOpenAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="min-h-[38px] px-3 py-1.5 text-xs text-yellow-300 hover:text-yellow-200 bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-semibold"
                >
                  <ShieldAlert size={13} className="text-yellow-400" />
                  <span>Admin Console</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="min-h-[38px] px-3 py-1.5 text-xs glossy-btn-secondary hover:text-red-400 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4">
            {purchases.length === 0 ? (
              <div className="text-center py-10 px-4 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#121614] border border-white/[0.09] text-[#A1AAA2] mx-auto flex items-center justify-center">
                  <Package size={24} />
                </div>
                <div>
                  <h4 className="font-display text-base font-bold text-[#F5F7F2] mb-1">
                    No Purchased Assets Yet
                  </h4>
                  <p className="text-xs text-[#A1AAA2] max-w-sm mx-auto leading-relaxed">
                    When you purchase plugins, software, or courses with this account, your download links and licenses will appear here permanently.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onBrowseStore();
                  }}
                  className="min-h-[44px] px-6 py-2.5 text-xs font-bold uppercase tracking-normal glossy-btn rounded-xl cursor-pointer inline-flex items-center gap-2"
                >
                  <Sparkles size={14} />
                  <span>Browse Plugin Store</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#A1AAA2] px-1">
                  <span>
                    {purchases.length} Unlocked Asset{purchases.length === 1 ? '' : 's'}
                  </span>
                  <span className="flex items-center gap-1 text-[#B7F34A]">
                    <ShieldCheck size={13} /> Single-Account License Active
                  </span>
                </div>

                {purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="bg-[#121614] border border-white/[0.09] hover:border-[#B7F34A]/40 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase font-semibold text-[#B7F34A] bg-[#B7F34A]/10 px-2 py-0.5 rounded">
                          {purchase.category || 'Plugin'}
                        </span>
                        <span className="text-[10px] text-[#707A72] font-mono">
                          Unlocked on {purchase.purchasedAt || 'Recent'}
                        </span>
                      </div>

                      <h4 className="font-display text-base font-bold text-[#F5F7F2] break-words">
                        {purchase.title}
                      </h4>

                      <p className="text-xs text-[#A1AAA2] font-normal">
                        Full source folder &amp; lifetime installation files
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onSelectDownload ? (
                        <button
                          type="button"
                          onClick={() => onSelectDownload(purchase)}
                          className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-xs font-bold uppercase tracking-normal glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Download size={14} />
                          <span>Secure Download</span>
                        </button>
                      ) : (
                        <a
                          href={purchase.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-xs font-bold uppercase tracking-normal glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Download size={14} />
                          <span>Secure Download</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-white/[0.09] bg-[#171C19] flex items-center justify-between text-xs text-[#707A72]">
            <span>MirrorBook Customer Library</span>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[36px] px-2 hover:text-[#F5F7F2] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

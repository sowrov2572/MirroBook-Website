import React from 'react';
import { X, Download, ShieldCheck, ExternalLink, LogOut, Package, Sparkles, FolderDown } from 'lucide-react';
import { UserPurchase, AppUser } from '../types';

interface UserVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null;
  purchases: UserPurchase[];
  onSignOut: () => void;
  onBrowseStore: () => void;
}

export const UserVaultModal: React.FC<UserVaultModalProps> = ({
  isOpen,
  onClose,
  user,
  purchases,
  onSignOut,
  onBrowseStore,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/15 rounded-3xl shadow-2xl text-left overflow-hidden my-6">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0E0E0E]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#71B913]/10 border border-[#71B913]/30 text-[#71B913] flex items-center justify-center">
              <FolderDown size={16} />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-white tracking-normal flex items-center gap-2">
                <span>Creator Library &amp; Downloads</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#71B913]/20 text-[#71B913] border border-[#71B913]/30 font-semibold">
                  Personal Vault
                </span>
              </h3>
              <p className="text-xs text-[#888888] font-normal">
                Permanent access to your purchased tools &amp; plugins
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 text-[#888888] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* User Account Info Strip */}
        <div className="px-6 py-3.5 bg-[#121212] border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Creator'}
                className="w-8 h-8 rounded-full border border-white/20 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 text-white font-bold text-xs flex items-center justify-center">
                {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="text-xs">
              <span className="font-semibold text-white block">
                {user?.displayName || 'Active Creator'}
              </span>
              <span className="text-[#888888] font-normal font-mono text-[11px]">
                {user?.email}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              onSignOut();
              onClose();
            }}
            className="px-3 py-1.5 text-xs text-[#999999] hover:text-red-400 bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {purchases.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-[#888888] mx-auto flex items-center justify-center">
                <Package size={24} />
              </div>
              <div>
                <h4 className="font-display text-base font-bold text-white mb-1">
                  No Purchased Assets Yet
                </h4>
                <p className="text-xs text-[#888888] max-w-sm mx-auto leading-relaxed">
                  When you purchase plugins (like Easy Flow Plugin, AI AutoCut) or masterclasses with this account, your download links and licenses will appear here permanently.
                </p>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onBrowseStore();
                }}
                className="px-6 py-2.5 text-xs font-bold uppercase tracking-normal bg-[#71B913] hover:bg-[#81cf17] text-black rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Sparkles size={14} />
                <span>Browse Plugin Store</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#888888] px-1">
                <span>{purchases.length} Unlocked Asset{purchases.length === 1 ? '' : 's'}</span>
                <span className="flex items-center gap-1 text-[#71B913]">
                  <ShieldCheck size={13} /> Single-Account License Active
                </span>
              </div>

              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="bg-[#121212] border border-white/10 hover:border-[#71B913]/40 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-semibold text-[#71B913] bg-[#71B913]/10 px-2 py-0.5 rounded">
                        {purchase.category || 'Plugin'}
                      </span>
                      <span className="text-[10px] text-[#777777] font-mono">
                        Unlocked on {purchase.purchasedAt || 'Recent'}
                      </span>
                    </div>

                    <h4 className="font-display text-base font-bold text-white">
                      {purchase.title}
                    </h4>

                    <p className="text-xs text-[#888888] font-normal">
                      Full source folder &amp; lifetime installation files
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={purchase.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 text-xs font-bold uppercase tracking-normal bg-[#71B913] hover:bg-[#81cf17] active:scale-95 text-black rounded-xl shadow-[0_0_15px_rgba(113,185,19,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Download &amp; Install</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}

              <div className="p-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[11px] text-[#888888] flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-[#71B913] shrink-0 mt-0.5" />
                <p>
                  <strong>Account Security:</strong> Your files are permanently tied to <strong>{user?.email}</strong>. Whenever you visit MirrorBook from any browser, simply sign in with your Google account to access and download your installed plugins.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/[0.08] bg-[#0E0E0E] flex items-center justify-between text-xs text-[#666666]">
          <span>MirrorBook Secured Cloud Vault</span>
          <button
            onClick={onClose}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

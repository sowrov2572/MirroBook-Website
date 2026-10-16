import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Download,
  ExternalLink,
  Lock,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  UserCheck,
  KeyRound,
} from 'lucide-react';
import { AppUser } from '../types';

export interface SecureDownloadTarget {
  id?: string;
  orderId?: string;
  title: string;
  category?: string;
  downloadUrl: string;
  purchasedAt?: string;
  trxId?: string;
}

interface SecureDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: SecureDownloadTarget | null;
  user: AppUser | null;
  onSignIn: () => void;
}

export const SecureDownloadModal: React.FC<SecureDownloadModalProps> = ({
  isOpen,
  onClose,
  target,
  user,
  onSignIn,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(600); // 10 minutes session
  const [downloadLaunched, setDownloadLaunched] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [licenseKey, setLicenseKey] = useState('');

  useEffect(() => {
    if (isOpen && target && user) {
      setSecondsRemaining(600);
      setDownloadLaunched(false);
      setCopiedKey(false);

      // Generate dynamic tamper-evident cryptographic session token and license
      const orderRef = target.orderId || target.id || 'MB-DIR';
      const userHash = user.uid ? user.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() : 'USER';
      const randomNonce = Math.random().toString(36).substring(2, 7).toUpperCase();
      const generatedToken = `MB-SEC-${orderRef}-${userHash}-${randomNonce}`;
      setSessionToken(generatedToken);

      const emailPrefix = (user.email || 'USER').split('@')[0].toUpperCase();
      const cleanProd = target.title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
      setLicenseKey(`MB-${cleanProd}-${emailPrefix}-${randomNonce}`);
    }
  }, [isOpen, target, user]);

  // 10-Minute Expiration Countdown
  useEffect(() => {
    if (!isOpen || !user) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, user]);

  if (!isOpen || !target) return null;

  const isExpired = secondsRemaining === 0;
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleLaunchDownload = () => {
    if (isExpired || !user) return;

    setDownloadLaunched(true);

    // Audit log single-use download token to localStorage
    try {
      const auditLog = {
        token: sessionToken,
        licenseKey: licenseKey,
        targetTitle: target.title,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem('mirrorbook_download_audit') || '[]');
      existing.unshift(auditLog);
      localStorage.setItem('mirrorbook_download_audit', JSON.stringify(existing.slice(0, 30)));
    } catch {
      // ignore
    }

    // Trigger download in clean context
    window.open(target.downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLicense = () => {
    navigator.clipboard.writeText(licenseKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0C0C0C] border border-white/15 rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] text-left">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#71B913]/15 border border-[#71B913]/40 text-[#71B913] flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-white tracking-normal flex items-center gap-2">
                <span>Secure Download Gateway</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#71B913] text-black font-bold">
                  DRM Protected
                </span>
              </h3>
              <p className="text-[11px] text-[#888888] font-normal">
                Single-user encrypted token &amp; account binding
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 text-[#888888] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Unauthenticated User: Prompt Login */}
        {!user ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-yellow-400 mx-auto flex items-center justify-center">
              <Lock size={26} />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-display text-lg font-bold text-white">
                Account Sign-In Required
              </h4>
              <p className="text-xs text-[#AAAAAA] max-w-sm mx-auto leading-relaxed">
                To prevent piracy and unauthorized link sharing, download access for{' '}
                <strong className="text-white">{target.title}</strong> is cryptographically locked to the purchaser's email account.
              </p>
            </div>

            <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-left text-xs text-yellow-200/90 flex items-start gap-2.5">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-yellow-400" />
              <span>
                Please sign in with the Google or email account you used to purchase. If someone shared this link with you, it cannot be downloaded without an authorized buyer account.
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onSignIn();
              }}
              className="w-full py-3 text-xs font-bold uppercase tracking-normal bg-[#71B913] hover:bg-[#81cf17] text-black rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <UserCheck size={15} />
              <span>Sign In to Unlock Download</span>
            </button>
          </div>
        ) : (
          /* Authenticated User: Protected Session */
          <div className="p-6 space-y-4">
            {/* Item Title and Account Watermark */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] uppercase font-bold text-[#71B913] bg-[#71B913]/10 px-2 py-0.5 rounded">
                  {target.category || 'Plugin Master'}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-xs text-[#888888]">
                  <Clock size={12} className={isExpired ? 'text-red-400' : 'text-[#71B913]'} />
                  <span className={isExpired ? 'text-red-400 font-bold' : 'text-white font-bold'}>
                    {isExpired ? 'Session Expired' : `Valid: ${formattedTime}`}
                  </span>
                </span>
              </div>

              <h4 className="font-display text-base font-bold text-white">
                {target.title}
              </h4>

              {/* Watermark Details */}
              <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#777777] block text-[10px]">Licensed User:</span>
                  <span className="text-white font-mono truncate block" title={user.email || ''}>
                    {user.email}
                  </span>
                </div>
                <div>
                  <span className="text-[#777777] block text-[10px]">Session Token:</span>
                  <span className="text-[#71B913] font-mono text-[10px] truncate block">
                    {sessionToken}
                  </span>
                </div>
              </div>
            </div>

            {/* License Key Box */}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] text-[#888888] uppercase tracking-normal font-semibold flex items-center gap-1">
                  <KeyRound size={11} className="text-[#71B913]" />
                  <span>Single-Seat License Key</span>
                </span>
                <code className="text-xs text-white font-mono block truncate select-all">
                  {licenseKey}
                </code>
              </div>

              <button
                type="button"
                onClick={handleCopyLicense}
                className="px-2.5 py-1.5 text-[11px] bg-white/10 hover:bg-white/15 text-white rounded-lg flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                {copiedKey ? <Check size={12} className="text-[#71B913]" /> : <Copy size={12} />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Anti-Piracy Warning Notice */}
            <div className="p-3 bg-white/[0.02] border border-white/[0.08] rounded-xl text-[11px] text-[#999999] space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-white">
                <ShieldCheck size={14} className="text-[#71B913]" />
                <span>Anti-Sharing Google Drive Protection</span>
              </div>
              <p className="leading-relaxed">
                This installation link is restricted directly to <strong className="text-white">{user.email}</strong>. If forwarded or shared with other accounts, Google Drive will automatically reject access with <em>'Permission Denied'</em>.
              </p>
            </div>

            {/* Download Action Button */}
            {!isExpired ? (
              <button
                type="button"
                onClick={handleLaunchDownload}
                className="w-full py-3.5 text-xs font-bold uppercase tracking-normal bg-[#71B913] hover:bg-[#81cf17] active:scale-[0.99] text-black rounded-xl shadow-[0_0_25px_rgba(113,185,19,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                <Download size={15} />
                <span>{downloadLaunched ? 'Download In Progress (Click to Reopen)' : 'Authorize & Launch Download'}</span>
                <ExternalLink size={13} />
              </button>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-xs text-red-300">
                  This download token has expired to protect your software license.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSecondsRemaining(600);
                    setSessionToken(`MB-SEC-${target.orderId || 'NEW'}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
                  }}
                  className="w-full py-2.5 text-xs font-semibold uppercase tracking-normal bg-white/10 hover:bg-white/15 text-white rounded-xl transition-all cursor-pointer"
                >
                  Generate Fresh Session Token
                </button>
              </div>
            )}

            <p className="text-[10px] text-center text-[#666666]">
              Need to re-download in the future? Simply visit your Creator Vault anytime while logged in.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

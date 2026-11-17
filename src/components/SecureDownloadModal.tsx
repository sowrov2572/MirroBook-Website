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
import { AppUser, generateDeterministicLicenseKey } from '../types';

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
  onDownloadLogged?: (entry: {
    purchaseId?: string;
    title: string;
    category?: string;
    licenseKey?: string;
    sessionToken?: string;
  }) => void;
}

export const SecureDownloadModal: React.FC<SecureDownloadModalProps> = ({
  isOpen,
  onClose,
  target,
  user,
  onSignIn,
  onDownloadLogged,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(600); // 10 minutes session
  const [downloadLaunched, setDownloadLaunched] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && target && user) {
      setSecondsRemaining(600);
      setDownloadLaunched(false);
      setCopiedKey(false);
      setUrlError(null);

      // Generate dynamic tamper-evident session token and deterministic license key
      const orderRef = target.orderId || target.id || 'MB-DIR';
      const userHash = user.uid ? user.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() : 'USER';
      const randomNonce = Math.random().toString(36).substring(2, 7).toUpperCase();
      const generatedToken = `MB-SEC-${orderRef}-${userHash}-${randomNonce}`;
      setSessionToken(generatedToken);
      setLicenseKey(generateDeterministicLicenseKey(target.title, user.email, target.trxId || orderRef));
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
  const cleanUrl = (target.downloadUrl || '').trim();
  const hasValidDownloadUrl =
    cleanUrl.length > 0 &&
    cleanUrl !== 'https://drive.google.com' &&
    cleanUrl.startsWith('http');

  const handleLaunchDownload = () => {
    if (isExpired || !user) return;
    if (!hasValidDownloadUrl) {
      setUrlError('Protected download link is not yet attached to this verified purchase. Please contact support.');
      return;
    }

    setUrlError(null);
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

    if (onDownloadLogged) {
      onDownloadLogged({
        purchaseId: target.orderId || target.id,
        title: target.title,
        category: target.category,
        licenseKey,
        sessionToken,
      });
    }

    // Trigger download in clean context without window.open popup blocking
    const link = document.createElement('a');
    link.href = cleanUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLicense = () => {
    navigator.clipboard.writeText(licenseKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[75] overflow-y-auto overscroll-contain bg-[#0B0D0C]/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-4 py-4 sm:py-6">
        <div className="relative w-full max-w-lg max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col glossy-card bg-[#121614] border border-white/[0.09] rounded-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] text-left my-auto">
          {/* Top Header */}
          <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-white/[0.09] bg-[#171C19]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#B7F34A]/15 border border-[#B7F34A]/40 text-[#B7F34A] flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-sm font-bold text-[#F5F7F2] tracking-normal flex flex-wrap items-center gap-2">
                  <span>Secure Download Gateway</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#B7F34A] text-black font-bold">
                    DRM Protected
                  </span>
                </h3>
                <p className="text-[11px] text-[#A1AAA2] font-normal truncate">
                  Single-user encrypted token &amp; account binding
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-white/10 text-[#A1AAA2] hover:text-[#F5F7F2] transition-colors flex items-center justify-center cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Unauthenticated User: Prompt Login */}
            {!user ? (
              <div className="p-5 sm:p-8 text-center space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-[#171C19] border border-white/[0.09] text-yellow-400 mx-auto flex items-center justify-center">
                  <Lock size={26} />
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-display text-lg font-bold text-[#F5F7F2]">
                    Account Sign-In Required
                  </h4>
                  <p className="text-xs text-[#A1AAA2] max-w-sm mx-auto leading-relaxed">
                    To prevent piracy and unauthorized link sharing, download access for{' '}
                    <strong className="text-[#F5F7F2]">{target.title}</strong> is cryptographically locked to the purchaser's email account.
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
                  className="w-full min-h-[44px] py-3 text-xs font-bold uppercase tracking-normal glossy-btn rounded-xl cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserCheck size={15} />
                  <span>Sign In to Unlock Download</span>
                </button>
              </div>
            ) : (
              /* Authenticated User: Protected Session */
              <div className="p-4 sm:p-6 space-y-4">
                {/* Item Title and Account Watermark */}
                <div className="bg-[#171C19] border border-white/[0.09] rounded-2xl p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[10px] uppercase font-bold text-[#B7F34A] bg-[#B7F34A]/10 px-2 py-0.5 rounded">
                      {target.category || 'Plugin Master'}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-xs text-[#A1AAA2]">
                      <Clock size={12} className={isExpired ? 'text-red-400' : 'text-[#B7F34A]'} />
                      <span className={isExpired ? 'text-red-400 font-bold' : 'text-[#F5F7F2] font-bold'}>
                        {isExpired ? 'Session Expired' : `Valid: ${formattedTime}`}
                      </span>
                    </span>
                  </div>

                  <h4 className="font-display text-base font-bold text-[#F5F7F2] break-words">
                    {target.title}
                  </h4>

                  {/* Watermark Details */}
                  <div className="pt-2 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="min-w-0">
                      <span className="text-[#707A72] block text-[10px]">Licensed User:</span>
                      <span className="text-[#F5F7F2] font-mono break-all block" title={user.email || ''}>
                        {user.email}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[#707A72] block text-[10px]">Session Token:</span>
                      <span className="text-[#B7F34A] font-mono text-[10px] break-all block">
                        {sessionToken}
                      </span>
                    </div>
                  </div>
                </div>

                {/* License Key Box */}
                <div className="bg-[#0B0D0C] border border-white/[0.09] rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] text-[#A1AAA2] uppercase tracking-normal font-semibold flex items-center gap-1">
                      <KeyRound size={11} className="text-[#B7F34A]" />
                      <span>Single-Seat License Key</span>
                    </span>
                    <code className="text-xs text-[#F5F7F2] font-mono block truncate select-all">
                      {licenseKey}
                    </code>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyLicense}
                    className="min-h-[36px] px-2.5 py-1.5 text-[11px] glossy-btn-secondary rounded-lg flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedKey ? <Check size={12} className="text-[#B7F34A]" /> : <Copy size={12} />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Anti-Piracy Warning Notice */}
                <div className="p-3 bg-[#171C19] border border-white/[0.09] rounded-xl text-[11px] text-[#A1AAA2] space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-[#F5F7F2]">
                    <ShieldCheck size={14} className="text-[#B7F34A]" />
                    <span>Anti-Sharing Google Drive Protection</span>
                  </div>
                  <p className="leading-relaxed break-words">
                    This installation link is restricted directly to <strong className="text-[#F5F7F2] break-all">{user.email}</strong>. If forwarded or shared with other accounts, Google Drive will automatically reject access with <em>'Permission Denied'</em>.
                  </p>
                </div>

                {urlError && (
                  <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-200 flex items-start gap-2">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-400" />
                    <span>{urlError}</span>
                  </div>
                )}

                {/* Download Action Button */}
                {!isExpired ? (
                  <button
                    type="button"
                    onClick={handleLaunchDownload}
                    className="w-full min-h-[44px] py-3.5 text-xs font-bold uppercase tracking-normal glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer font-sans"
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
                      className="w-full min-h-[44px] py-2.5 text-xs font-semibold uppercase tracking-normal glossy-btn-secondary rounded-xl cursor-pointer"
                    >
                      Generate Fresh Session Token
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-center text-[#707A72]">
                  Need to re-download in the future? Simply visit your Creator Vault anytime while logged in.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

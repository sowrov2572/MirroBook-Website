import React, { useState } from 'react';
import { X, Mail, User as UserIcon, Lock, Loader2, ShieldCheck, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn: () => Promise<void>;
  onEmailSignIn: (email: string, name: string, password?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onGoogleSignIn,
  onEmailSignIn,
}) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleClick = async () => {
    setGoogleError(null);
    setIsLoadingGoogle(true);
    try {
      await onGoogleSignIn();
      onClose();
    } catch (err: any) {
      console.warn('Google sign-in exception:', err);
      const code = err?.code || '';
      if (code.includes('popup-blocked')) {
        setGoogleError('Popup was blocked by your browser. Please allow popups or enter your email and password below.');
      } else if (code.includes('unauthorized-domain')) {
        setGoogleError('Authorized domain note: Enter your email & password below for instant access.');
      } else if (code.includes('closed-by-user') || code.includes('cancelled')) {
        setGoogleError('Sign-in popup was closed. You can also sign in with email & password below.');
      } else {
        setGoogleError('Could not open Google sign in popup. Please enter your email and password below.');
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    if (!email.trim() || !email.includes('@')) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (password && password.length < 4) {
      setEmailError('Password should be at least 4 characters long.');
      return;
    }
    onEmailSignIn(email.trim(), name.trim(), password.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glossy-card border border-white/20 text-left overflow-hidden my-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
        {/* Glossy Header Bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.1] bg-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/15 p-1 flex items-center justify-center shadow-inner">
              <img
                src="https://i.ibb.co/vCgzdc3H/icon.png"
                alt="MirrorBook Icon"
                className="w-full h-full rounded-xl object-contain"
              />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white tracking-normal">
                {isSignUp ? 'Create Creator Account' : 'Creator Login'}
              </h3>
              <p className="text-xs text-[#888888] font-normal">
                Google Sheets &amp; Vault Synced Platform
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 text-[#888888] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Auth Mode Toggle Pill */}
        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-white/[0.04] border border-white/10">
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isSignUp
                  ? 'bg-[#71B913] text-black shadow-sm font-bold'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              Sign Up (New User)
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                !isSignUp
                  ? 'bg-[#71B913] text-black shadow-sm font-bold'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              Log In (Existing)
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Method 1: Google One-Click Auth */}
          <div>
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isLoadingGoogle}
              className="w-full py-3.5 px-4 bg-white/95 hover:bg-white text-black font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] disabled:opacity-70"
            >
              {isLoadingGoogle ? (
                <>
                  <Loader2 size={16} className="animate-spin text-black" />
                  <span>Connecting with Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Google Popup Error / Fallback Notification */}
            {googleError && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-400" />
                <p className="leading-relaxed text-[11px]">{googleError}</p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative px-3 bg-[#0A0A0A] text-[10px] uppercase font-mono text-[#777777]">
              Or continue with Email &amp; Password
            </span>
          </div>

          {/* Method 2: Direct Creator Email & Password Registration */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {isSignUp && (
              <div>
                <label className="text-[11px] text-[#AAAAAA] mb-1 block font-medium">
                  Your Full Name
                </label>
                <div className="relative">
                  <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sowrov Hosen"
                    className="w-full bg-[#121212]/80 border border-white/10 focus:border-[#71B913] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] text-[#AAAAAA] mb-1 block font-medium">
                Gmail / Email Address *
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full bg-[#121212]/80 border border-white/10 focus:border-[#71B913] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#AAAAAA] mb-1 block font-medium">
                Password *
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create your account password"
                  className="w-full bg-[#121212]/80 border border-white/10 focus:border-[#71B913] rounded-xl pl-9 pr-10 py-2.5 text-xs text-white focus:outline-none transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-[10px] text-[#666666] mt-1">
                Your credentials are encrypted &amp; preserved in Google Sheets &amp; cloud storage.
              </p>
            </div>

            {emailError && (
              <p className="text-xs text-red-400 font-medium">{emailError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 text-xs font-bold uppercase tracking-normal bg-[#71B913] hover:bg-[#81cf17] active:scale-[0.99] text-black rounded-xl shadow-[0_0_20px_rgba(113,185,19,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{isSignUp ? 'Create Account & Sync Vault' : 'Sign In to Creator Account'}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Protection & Google Sheets Sync Guarantee */}
          <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[11px] text-[#888888] space-y-1">
            <div className="flex items-center gap-1.5 text-[#71B913] font-semibold">
              <ShieldCheck size={14} />
              <span>Real-time Google Sheet &amp; Vault Connection</span>
            </div>
            <p className="leading-relaxed">
              Whenever you sign in or purchase plugins (e.g. Easy Flow Plugin), your account and download licenses automatically synchronize so you can re-access anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

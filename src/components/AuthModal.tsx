import React, { useState } from 'react';
import {
  X,
  Mail,
  User as UserIcon,
  Lock,
  Loader2,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn: () => Promise<void>;
  onEmailSignIn: (email: string, password: string) => Promise<void>;
  onEmailSignUp: (email: string, password: string, fullName: string) => Promise<void>;
  onSendResetPassword?: (email: string) => Promise<void>;
  onNavigate?: (path: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onGoogleSignIn,
  onEmailSignIn,
  onEmailSignUp,
  onSendResetPassword,
  onNavigate,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleClick = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoadingGoogle(true);
    try {
      await onGoogleSignIn();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Google sign-in popup could not complete. Try signing in with Email & Password below.'
      );
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (isResetMode && onSendResetPassword) {
      setIsSubmitting(true);
      try {
        await onSendResetPassword(cleanEmail);
        setSuccessMessage('Password reset email sent! Please check your inbox.');
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Unable to send reset email.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (isSignUp && (!name.trim() || name.trim().length < 2)) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await onEmailSignUp(cleanEmail, password, name.trim());
      } else {
        await onEmailSignIn(cleanEmail, password);
      }
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#0B0D0C]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glossy-card border border-white/[0.09] text-left overflow-hidden my-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
        {/* Clean Customer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.09] bg-[#171C19]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#121614] border border-white/[0.09] p-1 flex items-center justify-center shadow-inner">
              <img
                src="https://i.ibb.co.com/DfSsjc5Z/mirorrbook-logo-png.png"
                alt="MirrorBook Official Logo"
                width={40}
                height={40}
                className="w-full h-full rounded-xl object-contain"
              />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#F5F7F2] tracking-normal">
                {isResetMode
                  ? 'Reset Password'
                  : isSignUp
                  ? 'Create Customer Account'
                  : 'Customer Sign In'}
              </h3>
              <p className="text-xs text-[#A1AAA2] font-normal">
                Access your purchases, licenses &amp; downloads
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-white/10 text-[#A1AAA2] hover:text-[#F5F7F2] transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!isResetMode && (
            <>
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isLoadingGoogle || isSubmitting}
                className="w-full py-3.5 px-4 bg-[#F5F7F2] hover:bg-white text-black font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] disabled:opacity-70"
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

              <div className="grid grid-cols-2 p-1 rounded-xl glass-tab-bar">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorMessage(null);
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    !isSignUp
                      ? 'bg-[#B7F34A] text-black shadow-sm font-bold'
                      : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMessage(null);
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isSignUp
                      ? 'bg-[#B7F34A] text-black shadow-sm font-bold'
                      : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </>
          )}

          <form onSubmit={handleSubmitForm} className="space-y-3">
            {isSignUp && !isResetMode && (
              <div>
                <label className="text-[11px] text-[#A1AAA2] mb-1 block font-medium">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707A72]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-[#121614] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] text-[#A1AAA2] mb-1 block font-medium">
                Email Address *
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707A72]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#121614] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {!isResetMode && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-[#A1AAA2] font-medium">Password *</label>
                  {!isSignUp && onSendResetPassword && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(true);
                        setErrorMessage(null);
                      }}
                      className="text-[11px] text-[#B7F34A] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707A72]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? 'Create a password (min 6 chars)' : 'Enter password'}
                    className="w-full bg-[#121614] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl pl-9 pr-10 py-2.5 text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707A72] hover:text-[#F5F7F2] cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/70 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-red-400" />
                <p className="leading-relaxed text-[11px]">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-2.5 rounded-xl bg-[#B7F34A]/15 border border-[#B7F34A]/40 text-[#D0FC7A] text-xs flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0 text-[#B7F34A]" />
                <p className="leading-relaxed text-[11px]">{successMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isLoadingGoogle}
              className="w-full py-3.5 text-xs font-bold uppercase tracking-normal glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
            >
              <span>
                {isSubmitting
                  ? 'Please wait...'
                  : isResetMode
                  ? 'Send Reset Link'
                  : isSignUp
                  ? 'Create Customer Account'
                  : 'Sign In'}
              </span>
              <ArrowRight size={14} />
            </button>

            {isResetMode && (
              <button
                type="button"
                onClick={() => setIsResetMode(false)}
                className="w-full py-1.5 text-xs text-[#A1AAA2] hover:text-[#F5F7F2] cursor-pointer"
              >
                Back to Sign In
              </button>
            )}
          </form>

          {onNavigate && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate(isSignUp ? '/signup' : '/login');
                }}
                className="text-[11px] text-[#B7F34A] hover:underline cursor-pointer"
              >
                Open Full {isSignUp ? 'Sign Up' : 'Login'} Page →
              </button>
            </div>
          )}

          <div className="p-3 bg-[#121614] border border-white/[0.09] rounded-xl text-[11px] text-[#A1AAA2] flex items-start gap-2">
            <ShieldCheck size={14} className="text-[#B7F34A] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Your purchases, plugin licenses, and download links sync securely to your personal MirrorBook customer account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

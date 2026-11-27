import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { useLanguage } from '../utils/i18n';

interface CustomerAuthPageProps {
  mode: 'login' | 'signup';
  mirrorBotIntent?: boolean;
  onNavigate: (path: string) => void;
  onGoogleSignIn: () => Promise<void>;
  onEmailSignIn: (email: string, password: string) => Promise<void>;
  onEmailSignUp: (email: string, password: string, fullName: string) => Promise<void>;
  onSendResetPassword: (email: string) => Promise<void>;
}

export const CustomerAuthPage: React.FC<CustomerAuthPageProps> = ({
  mode,
  mirrorBotIntent = false,
  onNavigate,
  onGoogleSignIn,
  onEmailSignIn,
  onEmailSignUp,
  onSendResetPassword,
}) => {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsResetMode(false);
    document.title =
      mode === 'signup'
        ? 'Create Customer Account | MirrorBook'
        : 'Customer Sign In | MirrorBook';
  }, [mode]);

  const handleGoogleClick = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoadingGoogle(true);
    try {
      await onGoogleSignIn();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (isResetMode) {
      setIsSubmitting(true);
      try {
        await onSendResetPassword(cleanEmail);
        setSuccessMessage('Password reset link sent! Please check your email inbox.');
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to send reset email.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        await onEmailSignUp(cleanEmail, password, fullName.trim());
      } else {
        await onEmailSignIn(cleanEmail, password);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-8 sm:py-12 bg-[#0B0D0C] overflow-x-clip">
      <div className="w-full max-w-md space-y-5 sm:space-y-6">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 min-h-[44px] text-xs text-[#A1AAA2] hover:text-[#B7F34A] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>{t('Back to MirrorBook', 'মিরর বুকে ফিরে যান')}</span>
        </button>

        <div className="glossy-card rounded-2xl overflow-hidden shadow-[0_24px_60px_-15px_rgba(0,0,0,0.75)]">
          {/* Clean Brand Header */}
          <div className="px-5 sm:px-7 py-5 sm:py-6 border-b border-white/[0.09] bg-[#121614]/80 flex items-center gap-3.5">
            <img
              src="/icon.png"
              alt="MirrorBook Official Logo"
              width={42}
              height={42}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/mirrorbook-logo.png')) {
                  target.src = '/mirrorbook-logo.png';
                }
              }}
              className="w-10 h-10 rounded-xl object-contain shrink-0"
            />
            <div className="min-w-0">
              <h1 className="font-display text-base sm:text-lg font-bold text-[#F5F7F2] tracking-normal">
                {isResetMode
                  ? t('Reset Password', 'পাসওয়ার্ড রিসেট করুন')
                  : mode === 'signup'
                  ? t('Create Your Account', 'নতুন অ্যাকাউন্ট তৈরি করুন')
                  : t('Welcome Back to MirrorBook', 'মিরর বুকে আবার স্বাগতম')}
              </h1>
              <p className="text-xs text-[#A1AAA2]">
                {isResetMode
                  ? t(
                      'Enter your email to receive a password reset link',
                      'পাসওয়ার্ড রিসেট লিংক পেতে আপনার ইমেইল লিখুন'
                    )
                  : mode === 'signup'
                  ? t(
                      'Access purchased plugins, courses, license keys & downloads',
                      'আপনার প্লাগইন, কোর্স, লাইসেন্স কী ও ডাউনলোড অ্যাক্সেস করুন'
                    )
                  : t(
                      'Sign in to access your purchases & downloads',
                      'আপনার পারচেজ ও ডাউনলোড দেখতে সাইন ইন করুন'
                    )}
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-7 space-y-5">
            {mirrorBotIntent && !isResetMode && (
              <div className="p-3.5 rounded-xl bg-[#B7F34A]/10 border border-[#B7F34A]/35 text-xs text-[#E5F9C2] flex items-center gap-3">
                <img
                  src="/mirrorbot-icon.png"
                  alt="Mirror Bot"
                  width={32}
                  height={32}
                  loading="eager"
                  decoding="async"
                  className="w-8 h-8 rounded-lg object-contain shrink-0 bg-[#0B0D0C] p-1 border border-[#B7F34A]/30"
                />
                <p className="leading-relaxed">
                  {t(
                    'Create your account or sign in to automatically add Mirror Bot to your Vault and connect Facebook, Messenger & WhatsApp.',
                    'অ্যাকাউন্ট তৈরি বা সাইন ইন করলেই মিরর বট অটোমেটিক আপনার ভল্টে যোগ হয়ে যাবে এবং ফেসবুক, মেসেঞ্জার ও হোয়াটসঅ্যাপ কানেক্ট করতে পারবেন।'
                  )}
                </p>
              </div>
            )}
            {!isResetMode && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={isLoadingGoogle || isSubmitting}
                  className="w-full min-h-[44px] py-3.5 px-4 bg-[#F5F7F2] hover:bg-white text-[#0B0D0C] font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] disabled:opacity-60"
                >
                  {isLoadingGoogle ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-[#0B0D0C]" />
                      <span>{t('Connecting with Google...', 'গুগলে কানেক্ট হচ্ছে...')}</span>
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
                      <span>{t('Continue with Google', 'গুগল দিয়ে চালিয়ে যান')}</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/[0.09]" />
                  <span className="text-[11px] text-[#707A72] uppercase tracking-wider">
                    {t('or', 'অথবা')}
                  </span>
                  <div className="h-px flex-1 bg-white/[0.09]" />
                </div>

                {/* Clean Login / Sign Up Switcher */}
                <div className="glass-tab-bar grid grid-cols-2 w-full">
                  <button
                    type="button"
                    onClick={() => onNavigate('/login')}
                    className={`min-h-[40px] py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      mode === 'login'
                        ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold'
                        : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
                    }`}
                  >
                    {t('Sign In', 'সাইন ইন')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('/signup')}
                    className={`min-h-[40px] py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      mode === 'signup'
                        ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold'
                        : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
                    }`}
                  >
                    {t('Sign Up', 'সাইন আপ')}
                  </button>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && !isResetMode && (
                <div>
                  <label className="text-[11px] text-[#A1AAA2] mb-1.5 block font-medium">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707A72]"
                    />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full bg-[#121614] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl pl-10 pr-3.5 py-2.5 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] text-[#A1AAA2] mb-1.5 block font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707A72]"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full bg-[#121614] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl pl-10 pr-3.5 py-2.5 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {!isResetMode && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] text-[#A1AAA2] font-medium">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsResetMode(true);
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                        className="text-[11px] text-[#B7F34A] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707A72]"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        mode === 'signup' ? 'Create a password (min 6 chars)' : 'Enter your password'
                      }
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      className="w-full bg-[#121614] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl pl-10 pr-11 py-2.5 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-[#707A72] hover:text-[#F5F7F2] cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'signup' && !isResetMode && (
                <div>
                  <label className="text-[11px] text-[#A1AAA2] mb-1.5 block font-medium">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707A72]"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      className="w-full bg-[#121614] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl pl-10 pr-3.5 py-2.5 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none transition-colors font-mono"
                    />
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/70 text-red-200 text-xs flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 text-red-400 mt-0.5" />
                  <p className="leading-relaxed text-[11px]">{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-[#B7F34A]/15 border border-[#B7F34A]/40 text-[#D0FC7A] text-xs flex items-start gap-2">
                  <CheckCircle2 size={15} className="shrink-0 text-[#B7F34A] mt-0.5" />
                  <p className="leading-relaxed text-[11px]">{successMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || isLoadingGoogle}
                className="glossy-btn w-full min-h-[44px] py-3.5 text-xs font-bold tracking-wide rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-[#0B0D0C]" />
                    <span>{t('Please wait...', 'অপেক্ষা করুন...')}</span>
                  </>
                ) : isResetMode ? (
                  <>
                    <KeyRound size={14} />
                    <span>{t('Send Reset Link', 'রিসেট লিংক পাঠান')}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'signup'
                        ? t('Create Account', 'অ্যাকাউন্ট তৈরি করুন')
                        : t('Sign In', 'সাইন ইন করুন')}
                    </span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              {isResetMode && (
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(false);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full min-h-[44px] py-2 text-xs text-[#A1AAA2] hover:text-[#F5F7F2] transition-colors cursor-pointer"
                >
                  {t('Back to Sign In', 'সাইন ইনে ফিরে যান')}
                </button>
              )}
            </form>

            <div className="p-3.5 bg-[#121614] border border-white/[0.08] rounded-xl text-[11px] text-[#A1AAA2] flex items-start gap-2.5">
              <ShieldCheck size={15} className="text-[#B7F34A] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {t(
                  'Protected by Firebase Authentication. Your purchases, plugin license keys, courses, and downloads sync securely to your personal account.',
                  'সুরক্ষিত অ্যাকাউন্ট সিস্টেম। আপনার সব পারচেজ, প্লাগইন লাইসেন্স কী, কোর্স ও ডাউনলোড নিরাপদে আপনার অ্যাকাউন্টে সংরক্ষিত থাকবে।'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

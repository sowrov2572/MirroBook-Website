import React from 'react';
import { ArrowLeft, ShieldCheck, Trash2, Mail, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../utils/i18n';

interface LegalPageProps {
  onNavigateHome: () => void;
  onNavigate?: (path: string) => void;
  onOpenEmailSheet?: (defaultSubject?: string) => void;
}

export const PrivacyPolicyPage: React.FC<LegalPageProps> = ({
  onNavigateHome,
  onNavigate,
  onOpenEmailSheet,
}) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0B0D0C] text-[#F5F7F2] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#A1AAA2] hover:text-[#B7F34A] transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>{t('Back to Home', 'হোমে ফিরে যান')}</span>
          </button>
          <span className="text-[11px] font-medium text-[#707A72]">
            {t('Last Updated: 2026', 'সর্বশেষ আপডেট: ২০২৬')}
          </span>
        </div>

        <header className="space-y-3 border-b border-white/[0.09] pb-7">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#B7F34A]">
            <ShieldCheck size={16} />
            <span>{t('MirrorBook · Legal & Compliance', 'মিরর বুক · প্রাইভেসি ও নীতিমালা')}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F7F2]">
            {t('Privacy Policy', 'প্রাইভেসি পলিসি')}
          </h1>
          <p className="text-sm text-[#A1AAA2] leading-relaxed">
            {t(
              'MirrorBook ("we", "our", "us") respects your privacy. This Privacy Policy explains how mirrorbook.site and Mirror Bot collect, use, store, and protect information when you use our creative platform, digital products, and Meta-connected AI support automation (Facebook Pages, Messenger, and WhatsApp Business).',
              'মিরর বুক আপনার তথ্যের গোপনীয়তাকে সর্বোচ্চ গুরুত্ব দেয়। এই প্রাইভেসি পলিসিতে mirrorbook.site এবং মিরর বট (Facebook Page, Messenger ও WhatsApp Business অটোমেশন) কীভাবে তথ্য সংগ্রহ, ব্যবহার ও সুরক্ষিত রাখে তা পরিষ্কারভাবে উল্লেখ করা হয়েছে।'
            )}
          </p>
        </header>

        <div className="space-y-6">
          <section className="bg-[#121614] border border-white/[0.09] rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-[#F5F7F2]">
              {t('1. Information We Collect', '১. আমরা কী কী তথ্য সংগ্রহ করি')}
            </h2>
            <ul className="space-y-2 text-sm text-[#A1AAA2] leading-relaxed list-disc pl-5">
              <li>
                {t(
                  'Account Information: Name, email address, and optional business profile details when you sign in to MirrorBook.',
                  'অ্যাকাউন্ট তথ্য: মিরর বুকে লগইন করার সময় আপনার নাম, ইমেইল এবং বিজনেস প্রোফাইলের তথ্য।'
                )}
              </li>
              <li>
                {t(
                  'Connected Meta Channels (Mirror Bot): When you connect your Facebook Page, Messenger, or WhatsApp Business account via Meta OAuth, we store your Page ID, Page Name, WhatsApp Phone Number ID, and encrypted server-side access tokens solely to deliver automated customer replies on your behalf.',
                  'কানেক্টেড মেটা চ্যানেল (মিরর বট): Facebook Page, Messenger বা WhatsApp Business লগইন করলে শুধু আপনার পেজ/নম্বর আইডি ও সুরক্ষিত সার্ভার-সাইড টোকেন সংরক্ষণ করা হয় যাতে বট আপনার হয়ে কাস্টমারদের রিপ্লাই দিতে পারে।'
                )}
              </li>
              <li>
                {t(
                  'Customer Messages & Media: Incoming Messenger messages, Facebook Page comments, WhatsApp messages, and customer photos sent to your connected business page are processed in real time solely to generate accurate AI responses.',
                  'কাস্টমারের মেসেজ ও ছবি: আপনার কানেক্টেড পেজ বা হোয়াটসঅ্যাপে আসা মেসেজ, কমেন্ট এবং ছবি শুধু রিয়েল-টাইমে সঠিক এআই রিপ্লাই তৈরি করার জন্য প্রসেস করা হয়।'
                )}
              </li>
            </ul>
          </section>

          <section className="bg-[#121614] border border-white/[0.09] rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-[#F5F7F2]">
              {t('2. How We Use Your Data', '২. আপনার তথ্য যেভাবে ব্যবহার করা হয়')}
            </h2>
            <ul className="space-y-2 text-sm text-[#A1AAA2] leading-relaxed list-disc pl-5">
              <li>
                {t(
                  'Delivering automated replies to Facebook Page comments, Messenger chats, and WhatsApp Business messages using your saved business description.',
                  'আপনার দেওয়া বিজনেস তথ্যের ভিত্তিতে Facebook কমেন্ট, Messenger ও WhatsApp মেসেজে অটোমেটিক রিপ্লাই পাঠানো।'
                )}
              </li>
              <li>
                {t(
                  'Fulfilling digital orders, software licenses (MirrorPOS), course access, and customer support inquiries.',
                  'ডিজিটাল অর্ডার, সফটওয়্যার লাইসেন্স (MirrorPOS), কোর্স এক্সেস এবং সাপোর্ট সেবা প্রদান।'
                )}
              </li>
              <li>
                {t(
                  'We never sell, rent, or share your personal data, Meta tokens, or customer conversations with third-party advertisers.',
                  'আমরা কখনোই আপনার ব্যক্তিগত তথ্য, মেটা টোকেন বা কাস্টমার চ্যাট কোনো তৃতীয় পক্ষের কাছে বিক্রি বা শেয়ার করি না।'
                )}
              </li>
            </ul>
          </section>

          <section className="bg-[#121614] border border-white/[0.09] rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-[#F5F7F2]">
              {t('3. Data Security & Retention', '৩. ডেটা সুরক্ষা ও সংরক্ষণ')}
            </h2>
            <p className="text-sm text-[#A1AAA2] leading-relaxed">
              {t(
                'All Meta access tokens are stored strictly on our backend servers and are never exposed to public browsers. Webhook payloads are cryptographically verified using HMAC-SHA256 signatures. You may disconnect any Facebook Page, Messenger, or WhatsApp channel at any time from your Mirror Bot dashboard to immediately stop webhook processing and remove stored tokens.',
                'সকল মেটা এক্সেস টোকেন সম্পূর্ণভাবে ব্যাকএন্ড সার্ভারে সুরক্ষিত রাখা হয় এবং ব্রাউজারে প্রকাশ করা হয় না। প্রতিটি ওয়েবহুক রিকোয়েস্ট HMAC-SHA256 সিগনেচার দিয়ে যাচাই করা হয়। আপনি যেকোনো সময় মিরর বট ড্যাশবোর্ড থেকে আপনার পেজ বা হোয়াটসঅ্যাপ ডিসকানেক্ট করলে সাথে সাথেই অটো-রিপ্লাই বন্ধ হয়ে যায় এবং টোকেন মুছে ফেলা হয়।'
              )}
            </p>
          </section>

          <section className="bg-[#121614] border border-white/[0.09] rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-[#F5F7F2]">
              {t('4. Your Rights & Data Deletion', '৪. আপনার অধিকার ও ডেটা ডিলিট')}
            </h2>
            <p className="text-sm text-[#A1AAA2] leading-relaxed">
              {t(
                'You can request complete deletion of your MirrorBook account, connected Meta channel tokens, and workspace settings at any time.',
                'আপনি যেকোনো সময় আপনার মিরর বুক অ্যাকাউন্ট, কানেক্টেড ফেসবুক/হোয়াটসঅ্যাপ টোকেন এবং বটের তথ্য সম্পূর্ণ ডিলিট করার অনুরোধ করতে পারবেন।'
              )}
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => (onNavigate ? onNavigate('/data-deletion') : (window.location.href = '/data-deletion'))}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B7F34A] text-[#0B0D0C] text-xs font-bold hover:bg-[#c8fa6d] transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                <span>{t('User Data Deletion Instructions', 'ডেটা ডিলিট করার নিয়ম দেখুন')}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onOpenEmailSheet
                    ? onOpenEmailSheet('Privacy Policy Inquiry')
                    : (window.location.href = 'mailto:mirrorbook.site@gmail.com')
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-[#F5F7F2] text-xs font-semibold hover:border-[#B7F34A]/50 transition-colors cursor-pointer"
              >
                <Mail size={14} />
                <span>mirrorbook.site@gmail.com</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export const DataDeletionPage: React.FC<LegalPageProps> = ({
  onNavigateHome,
  onNavigate,
  onOpenEmailSheet,
}) => {
  const { t } = useLanguage();
  const confirmationCode =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('code')?.trim() || ''
      : '';

  return (
    <div className="min-h-screen bg-[#0B0D0C] text-[#F5F7F2] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#A1AAA2] hover:text-[#B7F34A] transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>{t('Back to Home', 'হোমে ফিরে যান')}</span>
          </button>
          <button
            type="button"
            onClick={() => (onNavigate ? onNavigate('/privacy-policy') : (window.location.href = '/privacy-policy'))}
            className="text-xs font-semibold text-[#A1AAA2] hover:text-[#B7F34A] transition-colors cursor-pointer"
          >
            {t('Privacy Policy →', 'প্রাইভেসি পলিসি →')}
          </button>
        </div>

        <header className="space-y-3 border-b border-white/[0.09] pb-7">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#B7F34A]">
            <Trash2 size={16} />
            <span>{t('MirrorBook & Mirror Bot · Data Control', 'মিরর বুক ও মিরর বট · ডেটা কন্ট্রোল')}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F7F2]">
            {t('User Data Deletion Instructions', 'ইউজার ডেটা ডিলিট করার নিয়ম')}
          </h1>
          <p className="text-sm text-[#A1AAA2] leading-relaxed">
            {t(
              'You have full control over your MirrorBook account and any Facebook Page, Messenger, or WhatsApp Business connection linked with Mirror Bot. Follow the steps below to disconnect your channels or delete all stored data.',
              'আপনার মিরর বুক অ্যাকাউন্ট এবং মিরর বটের সাথে কানেক্ট করা Facebook Page, Messenger ও WhatsApp Business-এর তথ্যের উপর আপনার সম্পূর্ণ নিয়ন্ত্রণ রয়েছে। নিচের ধাপগুলো অনুসরণ করে আপনি যেকোনো সময় ডেটা ডিলিট করতে পারবেন।'
            )}
          </p>
        </header>

        {confirmationCode && (
          <div className="bg-[#121614] border border-[#B7F34A]/35 rounded-2xl p-5 flex items-start gap-3">
            <CheckCircle2 size={18} className="text-[#B7F34A] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#F5F7F2]">
                {t('Data Deletion Request Received', 'ডেটা ডিলিট অনুরোধ গৃহীত হয়েছে')}
              </p>
              <p className="text-xs text-[#A1AAA2]">
                {t('Confirmation Code:', 'কনফার্মেশন কোড:')}{' '}
                <span className="font-mono text-[#B7F34A] font-semibold">{confirmationCode}</span>
              </p>
              <p className="text-xs text-[#A1AAA2]">
                {t(
                  'Your Meta app data deletion request has been logged and all linked channel tokens are queued for removal within 24 hours.',
                  'আপনার মেটা ডেটা ডিলিট অনুরোধটি নথিভুক্ত হয়েছে এবং ২৪ ঘণ্টার মধ্যে সংশ্লিষ্ট সব টোকেন মুছে ফেলা হবে।'
                )}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <section className="bg-[#121614] border border-white/[0.09] rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-[#F5F7F2]">
              {t('Option 1: Instant Disconnect Inside Mirror Bot', 'পদ্ধতি ১: মিরর বট থেকে সাথে সাথে ডিসকানেক্ট করুন')}
            </h2>
            <ol className="space-y-2 text-sm text-[#A1AAA2] leading-relaxed list-decimal pl-5">
              <li>
                {t('Sign in to your account at mirrorbook.site and open Mirror Bot (/mirrorbot).', 'mirrorbook.site-এ লগইন করে Mirror Bot (/mirrorbot) পেজে যান।')}
              </li>
              <li>
                {t('Click "Disconnect" on Facebook Page, Messenger, or WhatsApp Business.', 'Facebook Page, Messenger বা WhatsApp Business কার্ডের "Disconnect" বাটনে ক্লিক করুন।')}
              </li>
              <li>
                {t(
                  'Your access token and webhook routing for that channel are immediately removed from our servers.',
                  'সাথে সাথেই আমাদের সার্ভার থেকে ওই চ্যানেলের টোকেন ও ওয়েবহুক রাউটিং মুছে ফেলা হবে।'
                )}
              </li>
            </ol>
          </section>

          <section className="bg-[#121614] border border-white/[0.09] rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-[#F5F7F2]">
              {t('Option 2: Revoke Access Directly From Facebook', 'পদ্ধতি ২: সরাসরি ফেসবুক সেটিংস থেকে এক্সেস বাতিল করুন')}
            </h2>
            <ol className="space-y-2 text-sm text-[#A1AAA2] leading-relaxed list-decimal pl-5">
              <li>
                {t('Open Facebook Settings & Privacy → Settings → Business Integrations.', 'Facebook Settings & Privacy → Settings → Business Integrations-এ যান।')}
              </li>
              <li>
                {t('Select Mirror Bot / MirrorBook and click "Remove".', 'Mirror Bot / MirrorBook সিলেক্ট করে "Remove" বাটনে ক্লিক করুন।')}
              </li>
              <li>
                {t(
                  'Meta will automatically revoke permissions and notify our data deletion endpoint.',
                  'মেটা স্বয়ংক্রিয়ভাবে পারমিশন বাতিল করবে এবং আমাদের ডেটা ডিলিট এন্ডপয়েন্টে নোটিফাই করবে।'
                )}
              </li>
            </ol>
          </section>

          <section className="bg-[#121614] border border-white/[0.09] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-[#F5F7F2]">
              {t('Option 3: Request Full Account & Data Deletion', 'পদ্ধতি ৩: সম্পূর্ণ অ্যাকাউন্ট ও ডেটা ডিলিট রিকোয়েস্ট')}
            </h2>
            <p className="text-sm text-[#A1AAA2] leading-relaxed">
              {t(
                'Send us an email from your registered address with subject "Data Deletion Request" and we will permanently delete your account, workspace configuration, and any stored tokens within 48 hours.',
                'আপনার রেজিস্টার্ড ইমেইল থেকে "Data Deletion Request" লিখে নিচের ইমেইলে পাঠান — ৪৮ ঘণ্টার মধ্যে আপনার অ্যাকাউন্ট ও সব সংরক্ষিত তথ্য স্থায়ীভাবে মুছে ফেলা হবে।'
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  onOpenEmailSheet
                    ? onOpenEmailSheet('Data Deletion Request')
                    : (window.location.href = 'mailto:mirrorbook.site@gmail.com?subject=Data%20Deletion%20Request')
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B7F34A] text-[#0B0D0C] text-xs font-bold hover:bg-[#c8fa6d] transition-colors cursor-pointer"
              >
                <Mail size={14} />
                <span>{t('Request Deletion via Email', 'ইমেইলে ডিলিট রিকোয়েস্ট পাঠান')}</span>
              </button>
              <a
                href={'https://wa.me/8801767079837?text=' + encodeURIComponent('Hello, I want to request MirrorBook data deletion.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-[#F5F7F2] text-xs font-semibold hover:border-[#B7F34A]/50 transition-colors"
              >
                <MessageSquare size={14} />
                <span>{t('Contact Support on WhatsApp', 'হোয়াটসঅ্যাপে সাপোর্ট')}</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

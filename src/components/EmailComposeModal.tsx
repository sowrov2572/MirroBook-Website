import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Send,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { PAYMENT_CONFIG } from '../data/content';

interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject?: string;
  defaultName?: string;
  defaultEmail?: string;
  onSuccessToast?: (msg: string) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SUPPORT_EMAIL = 'mirrorbook.site@gmail.com';
const WHATSAPP_DIRECT_URL = `https://wa.me/${PAYMENT_CONFIG.whatsAppNumber || '8801767079837'}?text=${encodeURIComponent('Hello')}`;

export const EmailComposeModal: React.FC<EmailComposeModalProps> = ({
  isOpen,
  onClose,
  defaultSubject = 'Project Enquiry',
  defaultName = '',
  defaultEmail = '',
  onSuccessToast,
}) => {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [submittedPayload, setSubmittedPayload] = useState<{
    name: string;
    email: string;
    subject: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setErrorMsg('');
      setSubject(defaultSubject || 'Project Enquiry');
      if (defaultName) setName((prev) => prev || defaultName);
      if (defaultEmail) setEmail((prev) => prev || defaultEmail);
    }
  }, [isOpen, defaultSubject, defaultName, defaultEmail]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || isSubmitting) return;
    setErrorMsg('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanSubject = subject.trim() || 'Project Enquiry';
    const cleanMessage = message.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Please enter your name (minimum 2 characters).');
      return;
    }

    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!cleanMessage || cleanMessage.length < 3) {
      setErrorMsg('Please write your message before sending.');
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'general_inquiry',
          requestType: 'general_inquiry',
          inquiryType: 'general_inquiry',
          name: cleanName,
          email: cleanEmail,
          service: cleanSubject,
          message: cleanMessage,
          additionalRequirements: cleanMessage,
          honeypot: honeypot.trim(),
        }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.success !== true) {
        throw new Error(
          data?.error ||
            'Unable to send your email right now. Please check your email address and try again.'
        );
      }

      const generatedRef = data.orderId || `MB-MAIL-${Date.now()}`;
      setReferenceId(generatedRef);
      setSubmittedPayload({
        name: cleanName,
        email: cleanEmail,
        subject: cleanSubject,
      });
      setIsSubmitted(true);
      setMessage('');
      onSuccessToast?.('Email sent to MirrorBook successfully.');
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      setErrorMsg(
        isTimeout
          ? 'The request timed out while sending your email. Please try again.'
          : err?.message || 'Unable to send your email right now. Please try again.'
      );
    } finally {
      window.clearTimeout(timeoutId);
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-[#0B0D0C]/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mirrorbook-email-sheet-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="relative w-full sm:max-w-lg max-h-[92dvh] flex flex-col glossy-card bg-[#121614] border-t sm:border border-white/[0.1] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.09] bg-[#171C19]">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#B7F34A]/15 border border-[#B7F34A]/30 text-[#B7F34A]">
                <Mail size={17} />
              </span>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B7F34A] block">
                  Direct Email Sheet
                </span>
                <h3
                  id="mirrorbook-email-sheet-title"
                  className="font-display text-base font-bold text-[#F5F7F2] truncate"
                >
                  Send us an Email
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#A1AAA2] hover:text-[#F5F7F2] transition-colors rounded-xl hover:bg-white/[0.06] cursor-pointer shrink-0 disabled:opacity-50"
              aria-label="Close email sheet"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {isSubmitted ? (
              <div className="p-5 sm:p-7 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#B7F34A]/15 border border-[#B7F34A]/35 text-[#B7F34A] flex items-center justify-center mx-auto">
                  <CheckCircle2 size={30} />
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#B7F34A] font-bold">
                    Email Delivered
                  </span>
                  <h4 className="font-display text-xl font-bold text-[#F5F7F2] mt-1">
                    Message Sent to MirrorBook
                  </h4>
                </div>

                <div className="bg-[#171C19] border border-white/[0.09] rounded-xl p-3.5 text-left space-y-1.5 text-xs">
                  <div className="flex flex-wrap justify-between gap-1">
                    <span className="text-[#A1AAA2]">Reference ID:</span>
                    <span className="font-mono font-bold text-[#B7F34A]">{referenceId}</span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-1">
                    <span className="text-[#A1AAA2]">To:</span>
                    <span className="text-[#F5F7F2] font-medium break-all">{SUPPORT_EMAIL}</span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-1">
                    <span className="text-[#A1AAA2]">Subject:</span>
                    <span className="text-[#F5F7F2] font-medium break-words">
                      {submittedPayload?.subject}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-1">
                    <span className="text-[#A1AAA2]">Reply Email:</span>
                    <span className="text-[#F5F7F2] font-medium break-all">
                      {submittedPayload?.email}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#B7F34A]/10 border border-[#B7F34A]/30 rounded-xl text-left flex items-start gap-2.5 text-xs text-[#A1AAA2]">
                  <Mail size={15} className="text-[#B7F34A] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[11px] leading-relaxed break-words">
                      A confirmation email has been sent to{' '}
                      <strong className="text-[#F5F7F2] break-all">
                        {submittedPayload?.email}
                      </strong>
                      . Our team will reply shortly.
                    </p>
                    <p className="text-[11px] text-[#B7F34A]/90">
                      Please also check your Spam folder if you don&apos;t see it in your inbox. (স্প্যাম ফোল্ডারও চেক করুন।)
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <a
                    href={WHATSAPP_DIRECT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle size={15} />
                    <span>Chat on WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl glossy-btn-secondary text-xs font-bold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
                {/* Honeypot */}
                <div style={{ display: 'none' }} aria-hidden="true">
                  <label htmlFor="email-sheet-hp">Leave this empty</label>
                  <input
                    id="email-sheet-hp"
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {/* Locked To: Recipient Row */}
                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#0B0D0C] border border-white/[0.09] text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[#707A72] font-semibold shrink-0">To:</span>
                    <span className="text-[#F5F7F2] font-medium truncate">
                      MirrorBook ({SUPPORT_EMAIL})
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B7F34A] shrink-0">
                    Auto-Submit
                  </span>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/70 text-red-200 text-xs flex items-start gap-2">
                    <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="email-compose-name"
                      className="block text-xs font-medium text-[#A1AAA2] mb-1.5"
                    >
                      Your Name <span className="text-[#B7F34A]">*</span>
                    </label>
                    <input
                      id="email-compose-name"
                      type="text"
                      required
                      minLength={2}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="Full name or brand"
                      className="w-full bg-[#0B0D0C] border border-white/[0.1] rounded-xl focus:border-[#B7F34A] px-3.5 py-2.5 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email-compose-from"
                      className="block text-xs font-medium text-[#A1AAA2] mb-1.5"
                    >
                      Your Email <span className="text-[#B7F34A]">*</span>
                    </label>
                    <input
                      id="email-compose-from"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="you@gmail.com"
                      className="w-full bg-[#0B0D0C] border border-white/[0.1] rounded-xl focus:border-[#B7F34A] px-3.5 py-2.5 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email-compose-subject"
                    className="block text-xs font-medium text-[#A1AAA2] mb-1.5"
                  >
                    Subject <span className="text-[#B7F34A]">*</span>
                  </label>
                  <input
                    id="email-compose-subject"
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Project Enquiry"
                    className="w-full bg-[#0B0D0C] border border-white/[0.1] rounded-xl focus:border-[#B7F34A] px-3.5 py-2.5 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email-compose-message"
                    className="block text-xs font-medium text-[#A1AAA2] mb-1.5"
                  >
                    Message <span className="text-[#B7F34A]">*</span>
                  </label>
                  <textarea
                    id="email-compose-message"
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="Write your message, project details, timeline, or question..."
                    className="w-full bg-[#0B0D0C] border border-white/[0.1] rounded-xl focus:border-[#B7F34A] px-3.5 py-2.5 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-1 space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[44px] py-3 px-5 text-xs font-bold glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={15} className="animate-spin text-black" />
                        <span>Sending Email to MirrorBook...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Send Email to MirrorBook</span>
                      </>
                    )}
                  </button>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[#707A72]">
                    <a
                      href={WHATSAPP_DIRECT_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#A1AAA2] hover:text-[#25D366] transition-colors"
                    >
                      <MessageCircle size={13} className="text-[#25D366]" />
                      <span>Chat on WhatsApp</span>
                    </a>
                    <a
                      href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject || 'Project Enquiry | MirrorBook')}`}
                      className="inline-flex items-center gap-1 text-[#707A72] hover:text-[#F5F7F2] transition-colors"
                    >
                      <span>Open in Mail App</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

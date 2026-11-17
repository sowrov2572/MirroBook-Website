import React, { useEffect, useRef, useState } from 'react';
import { X, Send, ArrowRight, Loader2, CheckCircle2, AlertCircle, Mail, MessageSquare } from 'lucide-react';
import { CheckoutItem } from '../types';
import { PAYMENT_CONFIG } from '../data/content';

interface StartProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCheckout: (item: CheckoutItem) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const StartProjectModal: React.FC<StartProjectModalProps> = ({
  isOpen,
  onClose,
  onSelectCheckout,
}) => {
  const [projectType, setProjectType] = useState('Video & Reels Production');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [projectBrief, setProjectBrief] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [submittedInfo, setSubmittedInfo] = useState<{
    name: string;
    email: string;
    phone: string;
    service: string;
    message: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const projectTypes = [
    'Video & Reels Production',
    'Brand Identity & Graphic Design',
    'Custom Web Development',
    'AI Software & Automation',
    'Full Retainer Campaign',
  ];

  const constructWhatsAppSummary = (refId?: string) => {
    const info = submittedInfo || {
      name: clientName,
      email: clientEmail,
      phone: clientPhone,
      service: projectType,
      message: projectBrief,
    };
    return `*NEW PROJECT INQUIRY — MIRRORBOOK*
----------------------------------------
*Order Ref:* ${refId || orderRef || 'PENDING'}
*Client:* ${info.name || 'Inquirer'}
*Email:* ${info.email || 'N/A'}
*Phone:* ${info.phone || 'N/A'}
*Project Scope:* ${info.service}
*Brief:* ${info.message || 'Looking for project scope and discovery call.'}
----------------------------------------
Sent via https://mirrorbook.site/`;
  };

  const handleProjectSubmit = async (e: React.FormEvent, openWhatsAppAfter = false) => {
    e.preventDefault();
    if (submitLockRef.current || isSubmitting) return;
    setErrorMsg('');

    const cleanName = clientName.trim();
    const cleanEmail = clientEmail.trim().toLowerCase();
    const cleanPhone = clientPhone.trim();
    const cleanBrief = projectBrief.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address (e.g. name@company.com).');
      return;
    }

    if (!cleanPhone || cleanPhone.replace(/[^0-9]/g, '').length < 6) {
      setErrorMsg('Please enter a valid phone or WhatsApp number (minimum 6 digits).');
      return;
    }

    if (!cleanBrief || cleanBrief.length < 5) {
      setErrorMsg('Please provide a brief project note or message (minimum 5 characters).');
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    const formattedMessage = `Phone / WhatsApp: ${cleanPhone}\n\n${cleanBrief}`;

    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          service: projectType,
          message: formattedMessage,
          phone: cleanPhone,
          packageName: projectType,
          additionalRequirements: cleanBrief,
          honeypot: honeypot.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit project request. Please try again.');
      }

      const generatedId = data.orderId || `MB-PRJ-${Date.now()}`;
      setOrderRef(generatedId);
      setSubmittedInfo({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        service: projectType,
        message: cleanBrief,
      });
      setIsSubmitted(true);

      if (openWhatsAppAfter) {
        const summary = `*NEW PROJECT INQUIRY — MIRRORBOOK*
----------------------------------------
*Order Ref:* ${generatedId}
*Client:* ${cleanName}
*Email:* ${cleanEmail}
*Phone:* ${cleanPhone}
*Project Scope:* ${projectType}
*Brief:* ${cleanBrief}
----------------------------------------
Sent via https://mirrorbook.site/`;
        const url = `https://wa.me/${PAYMENT_CONFIG.whatsAppNumber}?text=${encodeURIComponent(summary)}`;
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setProjectBrief('');
    } catch (err: any) {
      console.error('Project inquiry error:', err);
      setErrorMsg(err.message || 'An error occurred while submitting your request. Please try again.');
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[#0B0D0C]/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-4 py-4 sm:py-6">
        <div className="relative w-full max-w-xl max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col glossy-card bg-[#121614] border border-white/[0.09] rounded-2xl overflow-hidden shadow-2xl my-auto">
          {/* Sticky Header */}
          <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-white/[0.09] bg-[#171C19]">
            <div className="min-w-0">
              <span className="text-xs uppercase tracking-normal text-[#B7F34A] font-semibold block">
                Direct Inquiry
              </span>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#F5F7F2] mt-0.5 truncate">
                Start a Project
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#A1AAA2] hover:text-[#F5F7F2] transition-colors rounded-xl hover:bg-white/[0.06] cursor-pointer shrink-0"
              aria-label="Close project modal"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {isSubmitted ? (
              <div className="p-5 sm:p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#B7F34A]/15 border border-[#B7F34A]/35 text-[#B7F34A] flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(183,243,74,0.2)]">
                  <CheckCircle2 size={32} />
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#B7F34A] font-bold">
                    Project Request Received
                  </span>
                  <h4 className="font-display text-xl font-bold text-[#F5F7F2] mt-1">
                    Thank You, {submittedInfo?.name || clientName}!
                  </h4>
                </div>

                <div className="bg-[#171C19] border border-white/[0.09] rounded-xl p-3.5 max-w-md mx-auto text-left space-y-1.5 text-xs">
                  <div className="flex flex-wrap justify-between gap-1">
                    <span className="text-[#A1AAA2]">Reference ID:</span>
                    <span className="font-mono font-bold text-[#B7F34A]">{orderRef}</span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-1">
                    <span className="text-[#A1AAA2]">Scope:</span>
                    <span className="text-[#F5F7F2] font-medium break-words">
                      {submittedInfo?.service || projectType}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-1">
                    <span className="text-[#A1AAA2]">Confirmation Email:</span>
                    <span className="text-[#F5F7F2] font-medium break-all">
                      {submittedInfo?.email || clientEmail}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#B7F34A]/10 border border-[#B7F34A]/30 rounded-xl text-left flex items-start gap-2 text-xs text-[#A1AAA2]">
                  <Mail size={15} className="text-[#B7F34A] shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed break-words">
                    Confirmation email sent to <strong className="text-[#F5F7F2] break-all">{submittedInfo?.email || clientEmail}</strong>. Our team will review your project brief and follow up shortly.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={`https://wa.me/${PAYMENT_CONFIG.whatsAppNumber}?text=${encodeURIComponent(
                      constructWhatsAppSummary(orderRef)
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <MessageSquare size={15} />
                    <span>Chat on WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl glossy-btn-secondary text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
          <form onSubmit={(e) => handleProjectSubmit(e, false)} className="p-4 sm:p-6 md:p-8 space-y-5">
            {/* Honeypot field (hidden from real users, traps spam bots) */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <label htmlFor="project-hp">Leave this empty</label>
              <input
                id="project-hp"
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/70 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-normal text-[#A1AAA2] mb-2 font-medium">
                Scope of Work <span className="text-[#B7F34A]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {projectTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setProjectType(type)}
                    className={`min-h-[44px] py-2.5 px-3 text-xs text-left transition-all rounded-xl border cursor-pointer ${
                      projectType === type
                        ? 'bg-[#B7F34A] text-black font-bold border-[#B7F34A]'
                        : 'bg-[#171C19] text-[#A1AAA2] hover:text-[#F5F7F2] border-white/[0.09]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-normal text-[#A1AAA2] mb-1 font-medium">
                  Your Name <span className="text-[#B7F34A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Name or Brand"
                  className="w-full bg-[#0B0D0C] border border-white/[0.09] rounded-xl focus:border-[#B7F34A] px-4 py-2.5 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-normal text-[#A1AAA2] mb-1 font-medium">
                  Phone / WhatsApp <span className="text-[#B7F34A]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+8801XXXXXXXX"
                  className="w-full bg-[#0B0D0C] border border-white/[0.09] rounded-xl focus:border-[#B7F34A] px-4 py-2.5 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-normal text-[#A1AAA2] mb-1 font-medium">
                Email Address <span className="text-[#B7F34A]">*</span>
              </label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-[#0B0D0C] border border-white/[0.09] rounded-xl focus:border-[#B7F34A] px-4 py-2.5 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-normal text-[#A1AAA2] mb-1 font-medium">
                Brief Project Notes <span className="text-[#B7F34A]">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={projectBrief}
                onChange={(e) => setProjectBrief(e.target.value)}
                placeholder="Goals, target timeline, or reference links..."
                className="w-full bg-[#0B0D0C] border border-white/[0.09] rounded-xl focus:border-[#B7F34A] px-4 py-2.5 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none resize-none"
              />
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] py-3.5 text-xs font-bold uppercase tracking-normal glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-black" />
                    <span>Sending Request &amp; Emails...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Submit Request &amp; Send Confirmation Email</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => handleProjectSubmit(e, true)}
                className="w-full min-h-[44px] py-2.5 text-xs glossy-btn-secondary rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare size={13} className="text-[#25D366]" />
                <span>Or Connect Directly on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectCheckout({
                    id: 'custom-project-deposit',
                    name: 'Custom Project Deposit',
                    price: '৳5,000 Deposit',
                    category: 'Project Initiation',
                  });
                }}
                className="w-full min-h-[40px] py-2 text-[11px] text-[#707A72] hover:text-[#F5F7F2] flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>Or book immediate initial slot via payment checkout</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </form>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};


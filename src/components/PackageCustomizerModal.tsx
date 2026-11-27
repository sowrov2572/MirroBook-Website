import React, { useRef, useState } from 'react';
import { X, Send, MessageSquare, CheckCircle2, Sliders, Sparkles, Loader2, AlertCircle, Mail } from 'lucide-react';
import { PAYMENT_CONFIG } from '../data/content';

export interface PackageInquiryData {
  initialService?: string;
  initialPackageName?: string;
}

interface PackageCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PackageInquiryData | null;
  onSuccessToast?: (msg: string) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const PackageCustomizerModal: React.FC<PackageCustomizerModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSuccessToast,
}) => {
  const [name, setName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsAppNumber, setWhatsAppNumber] = useState('');
  const [requiredService, setRequiredService] = useState<string>(() => {
    return initialData?.initialService || 'Monthly Graphic Design';
  });
  const [monthlyDesignQty, setMonthlyDesignQty] = useState('120 Designs (~4 designs/day standard)');
  const [monthlyVideoQty, setMonthlyVideoQty] = useState('60 Reels (~2 reels/day standard)');
  const [budgetRange, setBudgetRange] = useState('Starting From ৳25,000 / month');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [honeypot, setHoneypot] = useState('');

  // Status & submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const submitLockRef = useRef(false);

  // Sync state if initialData changes
  React.useEffect(() => {
    if (initialData?.initialService) {
      setRequiredService(initialData.initialService);
      if (initialData.initialService.toLowerCase().includes('master')) {
        setBudgetRange('৳45,000 / month (Master Pack)');
      } else {
        setBudgetRange('Starting From ৳25,000 / month');
      }
    }
    setIsSubmitted(false);
    setErrorMsg('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const constructInquirySummary = (refId?: string) => {
    return `*MONTHLY SERVICE PACKAGE ORDER — MIRRORBOOK*
----------------------------------------
*Order Ref:* ${refId || orderRef || 'PENDING'}
*Client Name:* ${name.trim() || 'N/A'}
*Brand / Business:* ${brandName.trim() || 'N/A'}
*Email:* ${email.trim() || 'N/A'}
*WhatsApp:* ${whatsAppNumber.trim() || 'N/A'}
*Selected Package:* ${requiredService}
*Design Quantity:* ${monthlyDesignQty}
*Video / Reels Quantity:* ${monthlyVideoQty}
*Budget Range:* ${budgetRange}
*Additional Requirements:*
${additionalRequirements.trim() || 'Standard package onboarding and discovery scope.'}
----------------------------------------
Sent via https://mirrorbook.site/`;
  };

  const handleOrderSubmit = async (e: React.FormEvent, alsoOpenWhatsApp = false) => {
    e.preventDefault();
    if (submitLockRef.current || isSubmitting) return;
    setErrorMsg('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = whatsAppNumber.trim();
    const cleanBrand = brandName.trim();
    const cleanRequirements = additionalRequirements.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address so we can send your order confirmation.');
      return;
    }

    if (!cleanPhone || cleanPhone.replace(/[^0-9]/g, '').length < 6) {
      setErrorMsg('Please enter a valid phone or WhatsApp number (minimum 6 digits).');
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    const structuredMessage = [
      `Brand / Business: ${cleanBrand || 'N/A'}`,
      `Phone / WhatsApp: ${cleanPhone}`,
      `Monthly Design Quantity: ${monthlyDesignQty}`,
      `Monthly Video & Reels Quantity: ${monthlyVideoQty}`,
      `Budget Range: ${budgetRange}`,
      `Additional Requirements:\n${cleanRequirements || 'Standard package onboarding and discovery scope.'}`,
    ].join('\n');

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch('/api/package-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'package_inquiry',
          requestType: 'package_inquiry',
          name: cleanName,
          email: cleanEmail,
          service: requiredService,
          inquiryType: 'package_inquiry',
          message: structuredMessage,
          brandName: cleanBrand,
          whatsAppNumber: cleanPhone,
          packageName: requiredService,
          monthlyDesignQty,
          monthlyVideoQty,
          budgetRange,
          additionalRequirements: cleanRequirements,
          honeypot: honeypot.trim(),
        }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.success !== true) {
        throw new Error(
          data?.error ||
            'Unable to send confirmation email right now. Please verify your email address or try again.'
        );
      }

      const generatedId = data.orderId || `MB-PKG-${Date.now()}`;
      setOrderRef(generatedId);
      setIsSubmitted(true);

      // Save lead locally as well
      try {
        const stored = localStorage.getItem('mirrorbook_inquiries');
        const inquiries = stored ? JSON.parse(stored) : [];
        inquiries.push({
          id: generatedId,
          name: cleanName,
          brandName: cleanBrand,
          email: cleanEmail,
          whatsAppNumber: cleanPhone,
          requiredService,
          monthlyDesignQty,
          monthlyVideoQty,
          budgetRange,
          additionalRequirements: cleanRequirements,
          createdAt: new Date().toISOString(),
          status: 'Email Dispatched',
        });
        localStorage.setItem('mirrorbook_inquiries', JSON.stringify(inquiries));
      } catch {}

      if (onSuccessToast) {
        onSuccessToast('Package request received! Confirmation email sent.');
      }

      // If user chose WhatsApp workflow, open chat with order reference
      if (alsoOpenWhatsApp) {
        const summary = constructInquirySummary(generatedId);
        const phone = PAYMENT_CONFIG.whatsAppNumber || '8801767079837';
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(summary)}`;
        const link = document.createElement('a');
        link.href = waUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      console.error('Package order error:', err);
      const isTimeout = err?.name === 'AbortError';
      setErrorMsg(
        isTimeout
          ? 'The request timed out while sending confirmation email. Please try again.'
          : err?.message ||
              'Unable to send confirmation email right now. Please verify your email address or try again.'
      );
    } finally {
      window.clearTimeout(timeoutId);
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
        <div className="relative w-full max-w-2xl max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col glossy-card bg-[#121614] border border-white/[0.09] rounded-2xl overflow-hidden shadow-2xl my-auto">
          {/* Ambient Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#B7F34A]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header (Fixed Top) */}
          <div className="relative z-10 shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-white/[0.09] bg-[#171C19]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#B7F34A]/15 border border-[#B7F34A]/30 flex items-center justify-center text-[#B7F34A] shrink-0">
                <Sliders size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-[#B7F34A] font-bold">
                    MirrorBook Agency
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-[#A1AAA2] font-medium">
                    Customizable
                  </span>
                </div>
                <h3 className="font-display text-base sm:text-lg font-bold text-[#F5F7F2] truncate">
                  Monthly Package Inquiry &amp; Customization
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#A1AAA2] hover:text-[#F5F7F2] transition-colors rounded-xl hover:bg-white/[0.06] cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {isSubmitted ? (
              <div className="p-5 sm:p-8 md:p-10 text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-[#B7F34A]/15 border border-[#B7F34A]/35 text-[#B7F34A] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(183,243,74,0.2)]">
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#B7F34A] font-bold">
                    Order Request Received
                  </span>
                  <h4 className="font-display text-xl sm:text-2xl font-bold text-[#F5F7F2] mt-1">
                    Thank You, {name}!
                  </h4>
                </div>

                {/* Order Reference Card */}
                <div className="bg-[#171C19] border border-white/[0.09] rounded-2xl p-4 max-w-md mx-auto text-left space-y-2">
                  <div className="flex flex-wrap justify-between items-center gap-1 text-xs">
                    <span className="text-[#A1AAA2]">Order Reference:</span>
                    <span className="font-mono font-bold text-[#B7F34A] text-sm">{orderRef}</span>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-1 text-xs">
                    <span className="text-[#A1AAA2]">Selected Package:</span>
                    <span className="text-[#F5F7F2] font-medium break-words">{requiredService}</span>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-1 text-xs">
                    <span className="text-[#A1AAA2]">Confirmation Sent To:</span>
                    <span className="text-[#F5F7F2] font-medium break-all">{email}</span>
                  </div>
                </div>

                {/* Email Confirmation Notice */}
                <div className="p-3.5 rounded-xl bg-[#B7F34A]/10 border border-[#B7F34A]/30 text-xs text-[#A1AAA2] max-w-md mx-auto flex items-start gap-2.5 text-left">
                  <Mail size={16} className="text-[#B7F34A] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="leading-relaxed text-[11px] break-words">
                      A confirmation email has been dispatched to <strong className="text-[#F5F7F2] break-all">{email}</strong>. Our team has received your order request and will contact you shortly to discuss next steps, payment details, and project requirements.
                    </p>
                    <p className="text-[11px] text-[#B7F34A]/90">
                      Please also check your Spam folder if you don&apos;t see it in your inbox.
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-[#707A72] max-w-sm mx-auto">
                  Notice: This confirms receipt of an order request only. Payment details and project scope will be finalized with our team.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={`https://wa.me/${PAYMENT_CONFIG.whatsAppNumber || '8801767079837'}?text=${encodeURIComponent(
                      constructInquirySummary(orderRef)
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <MessageSquare size={16} />
                    <span>Chat on WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl glossy-btn-secondary text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
          <form onSubmit={(e) => handleOrderSubmit(e, false)} className="p-4 sm:p-6 md:p-8 space-y-5">
            {/* Honeypot field (hidden from real users, traps spam bots) */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <label htmlFor="website-hp">Leave this empty</label>
              <input
                id="website-hp"
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Error Message Banner */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/70 text-red-200 text-xs flex items-center gap-2.5">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Notice regarding starting prices */}
            <div className="p-3.5 rounded-xl bg-[#171C19] border border-white/[0.09] text-xs text-[#A1AAA2] flex items-start gap-2.5">
              <Sparkles size={16} className="text-[#B7F34A] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#F5F7F2]">Note:</strong> Individual packages start from ৳25,000/month, or choose the ৳45,000/month Master Pack for both Graphic Design &amp; Video Editing. Final pricing is confirmed after discussing your creative scope.
              </span>
            </div>

            {/* Row 1: Name and Business/Brand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A1AAA2] mb-1.5 font-semibold">
                  Your Name <span className="text-[#B7F34A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full px-4 py-3 rounded-xl bg-[#0B0D0C] border border-white/[0.09] text-[#F5F7F2] text-base sm:text-xs placeholder:text-[#707A72] focus:border-[#B7F34A] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A1AAA2] mb-1.5 font-semibold">
                  Business or Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Acme Studio / Personal Brand"
                  className="w-full px-4 py-3 rounded-xl bg-[#0B0D0C] border border-white/[0.09] text-[#F5F7F2] text-base sm:text-xs placeholder:text-[#707A72] focus:border-[#B7F34A] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Row 2: Email and WhatsApp Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A1AAA2] mb-1.5 font-semibold">
                  Email Address <span className="text-[#B7F34A]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#0B0D0C] border border-white/[0.09] text-[#F5F7F2] text-base sm:text-xs placeholder:text-[#707A72] focus:border-[#B7F34A] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A1AAA2] mb-1.5 font-semibold">
                  WhatsApp / Phone Number <span className="text-[#B7F34A]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={whatsAppNumber}
                  onChange={(e) => setWhatsAppNumber(e.target.value)}
                  placeholder="017XXXXXXXX or +880..."
                  className="w-full px-4 py-3 rounded-xl bg-[#0B0D0C] border border-white/[0.09] text-[#F5F7F2] text-base sm:text-xs placeholder:text-[#707A72] focus:border-[#B7F34A] focus:outline-none transition-colors font-mono"
                />
              </div>
            </div>

            {/* Required Service Selector */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A1AAA2] mb-2 font-semibold">
                Required Service <span className="text-[#B7F34A]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'Monthly Graphic Design',
                    label: 'Monthly Graphic Design',
                    price: 'Starting From ৳25,000/mo',
                    desc: '4 designs/day (~120 designs/mo)',
                  },
                  {
                    id: 'Monthly Video Editing & Reels',
                    label: 'Monthly Video Editing & Reels',
                    price: 'Starting From ৳25,000/mo',
                    desc: '2 reels/day (~60 reels/mo)',
                  },
                  {
                    id: 'Master Pack (Graphic Design + Video Editing)',
                    label: 'Master Pack',
                    price: '৳45,000/mo',
                    desc: 'Graphic Design + Video Editing combined',
                  },
                  {
                    id: 'Custom Scope / Specific Creative Needs',
                    label: 'Custom Scope / Specific Needs',
                    price: 'Custom Monthly Scope',
                    desc: 'Tailored workload & deliverables',
                  },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setRequiredService(s.id);
                      if (s.id.toLowerCase().includes('master')) {
                        setBudgetRange('৳45,000 / month (Master Pack)');
                      }
                    }}
                    className={`min-h-[44px] p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      requiredService === s.id
                        ? 'bg-[#B7F34A]/10 border-[#B7F34A] text-[#F5F7F2] shadow-[0_0_15px_rgba(183,243,74,0.15)]'
                        : 'bg-[#171C19] border-white/[0.09] text-[#A1AAA2] hover:border-white/20'
                    }`}
                  >
                    <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-[#F5F7F2]">{s.label}</span>
                      <span className="text-[10px] text-[#B7F34A] font-semibold">{s.price}</span>
                    </div>
                    <p className="text-[11px] text-[#A1AAA2]">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantities & Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A1AAA2] mb-1.5 font-semibold">
                  Monthly Design Quantity
                </label>
                <select
                  value={monthlyDesignQty}
                  onChange={(e) => setMonthlyDesignQty(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0B0D0C] border border-white/[0.09] text-[#F5F7F2] text-base sm:text-xs focus:border-[#B7F34A] focus:outline-none transition-colors"
                >
                  <option value="120 Designs (~4 designs/day standard)">120 Designs (~4 designs/day standard)</option>
                  <option value="60 Designs (~2 designs/day)">60 Designs (~2 designs/day)</option>
                  <option value="150+ Designs (High volume)">150+ Designs (High volume)</option>
                  <option value="Not Needed (Video Only)">Not Needed (Video Only)</option>
                  <option value="Custom Quantity">Custom Quantity</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A1AAA2] mb-1.5 font-semibold">
                  Monthly Video &amp; Reels Quantity
                </label>
                <select
                  value={monthlyVideoQty}
                  onChange={(e) => setMonthlyVideoQty(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0B0D0C] border border-white/[0.09] text-[#F5F7F2] text-base sm:text-xs focus:border-[#B7F34A] focus:outline-none transition-colors"
                >
                  <option value="60 Reels (~2 reels/day standard)">60 Reels (~2 reels/day standard)</option>
                  <option value="30 Reels (~1 reel/day)">30 Reels (~1 reel/day)</option>
                  <option value="90+ Reels (High frequency)">90+ Reels (High frequency)</option>
                  <option value="Not Needed (Design Only)">Not Needed (Design Only)</option>
                  <option value="Custom Quantity">Custom Quantity</option>
                </select>
              </div>
            </div>

            {/* Budget Range */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A1AAA2] mb-1.5 font-semibold">
                Budget Range (Monthly)
              </label>
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0B0D0C] border border-white/[0.09] text-[#F5F7F2] text-base sm:text-xs focus:border-[#B7F34A] focus:outline-none transition-colors"
              >
                <option value="Starting From ৳25,000 / month">Starting From ৳25,000 / month</option>
                <option value="৳25,000 – ৳35,000 / month">৳25,000 – ৳35,000 / month</option>
                <option value="৳45,000 / month (Master Pack)">৳45,000 / month (Master Pack)</option>
                <option value="৳35,000 – ৳55,000 / month">৳35,000 – ৳55,000 / month</option>
                <option value="৳55,000 – ৳85,000 / month">৳55,000 – ৳85,000 / month</option>
                <option value="৳85,000+ / month (Enterprise Retainer)">৳85,000+ / month (Enterprise Retainer)</option>
                <option value="Flexible / To Be Discussed">Flexible / To Be Discussed</option>
              </select>
            </div>

            {/* Additional Requirements */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A1AAA2] mb-1.5 font-semibold">
                Additional Requirements / Creative Brief
              </label>
              <textarea
                rows={3}
                value={additionalRequirements}
                onChange={(e) => setAdditionalRequirements(e.target.value)}
                placeholder="Mention specific style references, turnaround needs, motion graphics, branding concepts, or custom requirements..."
                className="w-full px-4 py-3 rounded-xl bg-[#0B0D0C] border border-white/[0.09] text-[#F5F7F2] text-base sm:text-xs placeholder:text-[#707A72] focus:border-[#B7F34A] focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Submission Buttons */}
            <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:flex-1 min-h-[44px] py-3.5 px-5 rounded-xl glossy-btn text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-black" />
                    <span>Processing Order &amp; Sending Emails...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Submit Order &amp; Send Confirmation Email</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => handleOrderSubmit(e, true)}
                className="w-full sm:w-auto min-h-[44px] py-3.5 px-5 rounded-xl glossy-btn-secondary text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <MessageSquare size={14} className="text-[#25D366]" />
                <span>Submit &amp; Open WhatsApp</span>
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

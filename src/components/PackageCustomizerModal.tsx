import React, { useState } from 'react';
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

  // Sync state if initialData changes
  React.useEffect(() => {
    if (initialData?.initialService) {
      setRequiredService(initialData.initialService);
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
    setErrorMsg('');

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = whatsAppNumber.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address so we can send your order confirmation.');
      return;
    }

    if (!cleanPhone || cleanPhone.replace(/[^0-9]/g, '').length < 6) {
      setErrorMsg('Please enter a valid phone or WhatsApp number (minimum 6 digits).');
      return;
    }

    // Prevent duplicate submission if already processing
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/package-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: cleanName,
          brandName: brandName.trim(),
          email: cleanEmail,
          whatsAppNumber: cleanPhone,
          packageName: requiredService,
          monthlyDesignQty,
          monthlyVideoQty,
          budgetRange,
          additionalRequirements: additionalRequirements.trim(),
          honeypot: honeypot.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit package order. Please try again.');
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
          brandName: brandName.trim(),
          email: cleanEmail,
          whatsAppNumber: cleanPhone,
          requiredService,
          monthlyDesignQty,
          monthlyVideoQty,
          budgetRange,
          additionalRequirements: additionalRequirements.trim(),
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
      setErrorMsg(err.message || 'An error occurred while submitting your order. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0D0D0D] border border-white/10 rounded-3xl overflow-hidden shadow-2xl my-8">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#71B913]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/[0.08] bg-[#121212]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#71B913]/15 border border-[#71B913]/30 flex items-center justify-center text-[#71B913]">
              <Sliders size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-[#71B913] font-bold">
                  MirrorBook Agency
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-[#AAAAAA] font-medium">
                  Customizable
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-white">
                Monthly Package Inquiry &amp; Customization
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#888888] hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06] cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 md:p-12 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#71B913]/20 border border-[#71B913]/40 text-[#71B913] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(113,185,19,0.3)]">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#71B913] font-bold">
                Order Request Received
              </span>
              <h4 className="font-display text-2xl font-bold text-white mt-1">
                Thank You, {name}!
              </h4>
            </div>

            {/* Order Reference Card */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 max-w-md mx-auto text-left space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#888888]">Order Reference:</span>
                <span className="font-mono font-bold text-[#71B913] text-sm">{orderRef}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#888888]">Selected Package:</span>
                <span className="text-white font-medium">{requiredService}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#888888]">Confirmation Sent To:</span>
                <span className="text-white font-medium">{email}</span>
              </div>
            </div>

            {/* Email Confirmation Notice */}
            <div className="p-3.5 rounded-xl bg-[#71B913]/10 border border-[#71B913]/30 text-xs text-[#CCCCCC] max-w-md mx-auto flex items-start gap-2.5 text-left">
              <Mail size={16} className="text-[#71B913] shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                A confirmation email has been dispatched to <strong className="text-white">{email}</strong>. Our team has received your order request and will contact you shortly to discuss next steps, payment details, and project requirements.
              </p>
            </div>

            <p className="text-[11px] text-[#777777] max-w-sm mx-auto">
              Notice: This confirms receipt of an order request only. Payment details and project scope will be finalized with our team.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const summary = constructInquirySummary(orderRef);
                  const phone = PAYMENT_CONFIG.whatsAppNumber || '8801767079837';
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(summary)}`, '_blank');
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <MessageSquare size={16} />
                <span>Chat on WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-bold uppercase tracking-wider border border-white/10 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => handleOrderSubmit(e, false)} className="p-6 md:p-8 space-y-5">
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
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-center gap-2.5">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Notice regarding starting prices */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-[#999999] flex items-start gap-2.5">
              <Sparkles size={16} className="text-[#71B913] shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Note:</strong> Both packages start from ৳25,000/month. Custom pricing depends on your team&apos;s specific workload and quantity. Final pricing is confirmed after discussing your creative scope.
              </span>
            </div>

            {/* Row 1: Name and Business/Brand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#AAAAAA] mb-1.5 font-semibold">
                  Your Name <span className="text-[#71B913]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder:text-[#555555] focus:border-[#71B913] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#AAAAAA] mb-1.5 font-semibold">
                  Business or Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Acme Studio / Personal Brand"
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder:text-[#555555] focus:border-[#71B913] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Row 2: Email and WhatsApp Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#AAAAAA] mb-1.5 font-semibold">
                  Email Address <span className="text-[#71B913]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder:text-[#555555] focus:border-[#71B913] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#AAAAAA] mb-1.5 font-semibold">
                  WhatsApp / Phone Number <span className="text-[#71B913]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={whatsAppNumber}
                  onChange={(e) => setWhatsAppNumber(e.target.value)}
                  placeholder="017XXXXXXXX or +880..."
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder:text-[#555555] focus:border-[#71B913] focus:outline-none transition-colors font-mono"
                />
              </div>
            </div>

            {/* Required Service Selector */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#AAAAAA] mb-2 font-semibold">
                Required Service <span className="text-[#71B913]">*</span>
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
                    id: 'Both Monthly Packages (Design + Reels)',
                    label: 'Both Monthly Packages',
                    price: 'Starting From ৳50,000/mo',
                    desc: 'Complete creative & video presence',
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
                    onClick={() => setRequiredService(s.id)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      requiredService === s.id
                        ? 'bg-[#71B913]/10 border-[#71B913] text-white shadow-[0_0_15px_rgba(113,185,19,0.15)]'
                        : 'bg-white/[0.02] border-white/10 text-[#CCCCCC] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold">{s.label}</span>
                      <span className="text-[10px] text-[#71B913] font-semibold">{s.price}</span>
                    </div>
                    <p className="text-[11px] text-[#888888]">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantities & Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#AAAAAA] mb-1.5 font-semibold">
                  Monthly Design Quantity
                </label>
                <select
                  value={monthlyDesignQty}
                  onChange={(e) => setMonthlyDesignQty(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-[#71B913] focus:outline-none transition-colors"
                >
                  <option value="120 Designs (~4 designs/day standard)">120 Designs (~4 designs/day standard)</option>
                  <option value="60 Designs (~2 designs/day)">60 Designs (~2 designs/day)</option>
                  <option value="150+ Designs (High volume)">150+ Designs (High volume)</option>
                  <option value="Not Needed (Video Only)">Not Needed (Video Only)</option>
                  <option value="Custom Quantity">Custom Quantity</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#AAAAAA] mb-1.5 font-semibold">
                  Monthly Video &amp; Reels Quantity
                </label>
                <select
                  value={monthlyVideoQty}
                  onChange={(e) => setMonthlyVideoQty(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-[#71B913] focus:outline-none transition-colors"
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
              <label className="block text-xs uppercase tracking-wider text-[#AAAAAA] mb-1.5 font-semibold">
                Budget Range (Monthly)
              </label>
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-[#71B913] focus:outline-none transition-colors"
              >
                <option value="Starting From ৳25,000 / month">Starting From ৳25,000 / month</option>
                <option value="৳25,000 – ৳35,000 / month">৳25,000 – ৳35,000 / month</option>
                <option value="৳35,000 – ৳55,000 / month">৳35,000 – ৳55,000 / month</option>
                <option value="৳55,000 – ৳85,000 / month">৳55,000 – ৳85,000 / month</option>
                <option value="৳85,000+ / month (Enterprise Retainer)">৳85,000+ / month (Enterprise Retainer)</option>
                <option value="Flexible / To Be Discussed">Flexible / To Be Discussed</option>
              </select>
            </div>

            {/* Additional Requirements */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#AAAAAA] mb-1.5 font-semibold">
                Additional Requirements / Creative Brief
              </label>
              <textarea
                rows={3}
                value={additionalRequirements}
                onChange={(e) => setAdditionalRequirements(e.target.value)}
                placeholder="Mention specific style references, turnaround needs, motion graphics, branding concepts, or custom requirements..."
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder:text-[#555555] focus:border-[#71B913] focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Submission Buttons */}
            <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#71B913] hover:bg-[#81cf17] text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(113,185,19,0.3)] transition-all disabled:opacity-60"
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
                className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold uppercase tracking-wider border border-white/15 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
              >
                <MessageSquare size={14} className="text-[#25D366]" />
                <span>Submit &amp; Open WhatsApp</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

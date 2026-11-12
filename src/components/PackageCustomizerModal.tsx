import React, { useState } from 'react';
import { X, Send, MessageSquare, CheckCircle2, Sliders, Sparkles } from 'lucide-react';
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
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Sync state if initialData changes
  React.useEffect(() => {
    if (initialData?.initialService) {
      setRequiredService(initialData.initialService);
    }
    setIsSubmitted(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const constructInquirySummary = () => {
    return `*MONTHLY SERVICE PACKAGE INQUIRY — MIRRORBOOK AGENCY*
----------------------------------------
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

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter your Name before submitting.');
      return;
    }
    if (!whatsAppNumber.trim() && !email.trim()) {
      alert('Please provide either your WhatsApp Number or Email so our creative team can respond.');
      return;
    }

    const summary = constructInquirySummary();
    const phone = PAYMENT_CONFIG.whatsAppNumber || '8801767079837';
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(summary)}`;

    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsSubmitted(true);
    if (onSuccessToast) {
      onSuccessToast('Package inquiry initiated! Opening WhatsApp to connect with our creative lead.');
    }
  };

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter your Name before submitting.');
      return;
    }
    if (!whatsAppNumber.trim() && !email.trim()) {
      alert('Please provide your WhatsApp number or email.');
      return;
    }

    // Save lead locally as well
    try {
      const stored = localStorage.getItem('mirrorbook_inquiries');
      const inquiries = stored ? JSON.parse(stored) : [];
      inquiries.push({
        id: `INQ-${Date.now()}`,
        name,
        brandName,
        email,
        whatsAppNumber,
        requiredService,
        monthlyDesignQty,
        monthlyVideoQty,
        budgetRange,
        additionalRequirements,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('mirrorbook_inquiries', JSON.stringify(inquiries));
    } catch {}

    setIsSubmitted(true);
    if (onSuccessToast) {
      onSuccessToast('Your package inquiry has been received! Our team will contact you shortly.');
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
          <div className="p-8 md:p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#71B913]/20 border border-[#71B913]/40 text-[#71B913] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(113,185,19,0.3)]">
              <CheckCircle2 size={36} />
            </div>
            <h4 className="font-display text-2xl font-bold text-white">
              Inquiry Sent Successfully!
            </h4>
            <p className="text-sm text-[#AAAAAA] max-w-md mx-auto leading-relaxed">
              Thank you, <strong className="text-white">{name}</strong>. Our creative director and production team will review your requirements for <span className="text-[#71B913] font-medium">{requiredService}</span> and connect with you on WhatsApp or email to confirm final project scope.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const summary = constructInquirySummary();
                  const phone = PAYMENT_CONFIG.whatsAppNumber || '8801767079837';
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(summary)}`, '_blank');
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <MessageSquare size={16} />
                <span>Open in WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-bold uppercase tracking-wider border border-white/10 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleWhatsAppSubmit} className="p-6 md:p-8 space-y-5">
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
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder:text-[#555555] focus:border-[#71B913] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#AAAAAA] mb-1.5 font-semibold">
                  WhatsApp Number <span className="text-[#71B913]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={whatsAppNumber}
                  onChange={(e) => setWhatsAppNumber(e.target.value)}
                  placeholder="017XXXXXXXX or +880..."
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder:text-[#555555] focus:border-[#71B913] focus:outline-none transition-colors"
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
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(37,211,102,0.3)] transition-all"
              >
                <MessageSquare size={16} />
                <span>Submit &amp; Connect on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleDirectSubmit}
                className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold uppercase tracking-wider border border-white/15 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Send size={14} className="text-[#71B913]" />
                <span>Submit Direct Inquiry</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

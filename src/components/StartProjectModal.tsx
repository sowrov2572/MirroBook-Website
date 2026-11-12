import React, { useState } from 'react';
import { X, Send, ArrowRight, Loader2, CheckCircle2, AlertCircle, Mail, MessageSquare } from 'lucide-react';
import { CheckoutItem } from '../types';
import { PAYMENT_CONFIG } from '../data/content';

interface StartProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCheckout: (item: CheckoutItem) => void;
}

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
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const projectTypes = [
    'Video & Reels Production',
    'Brand Identity & Graphic Design',
    'Custom Web Development',
    'AI Software & Automation',
    'Full Retainer Campaign',
  ];

  const constructWhatsAppSummary = (refId?: string) => {
    return `*NEW PROJECT INQUIRY — MIRRORBOOK*
----------------------------------------
*Order Ref:* ${refId || orderRef || 'PENDING'}
*Client:* ${clientName || 'Inquirer'}
*Email:* ${clientEmail || 'N/A'}
*Phone:* ${clientPhone || 'N/A'}
*Project Scope:* ${projectType}
*Brief:* ${projectBrief || 'Looking for project scope and discovery call.'}
----------------------------------------
Sent via https://mirrorbook.site/`;
  };

  const handleProjectSubmit = async (e: React.FormEvent, openWhatsAppAfter = false) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = clientName.trim();
    const cleanEmail = clientEmail.trim();
    const cleanPhone = clientPhone.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!cleanPhone || cleanPhone.replace(/[^0-9]/g, '').length < 6) {
      setErrorMsg('Please enter a valid phone or WhatsApp number (minimum 6 digits).');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/package-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          packageName: `Custom Project: ${projectType}`,
          budgetRange: 'Custom Project Inquiry Scope',
          additionalRequirements: projectBrief.trim(),
          honeypot: honeypot.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit project request. Please try again.');
      }

      const generatedId = data.orderId || `MB-PRJ-${Date.now()}`;
      setOrderRef(generatedId);
      setIsSubmitted(true);

      if (openWhatsAppAfter) {
        const text = constructWhatsAppSummary(generatedId);
        const url = `https://wa.me/${PAYMENT_CONFIG.whatsAppNumber}?text=${encodeURIComponent(text)}`;
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      console.error('Project inquiry error:', err);
      setErrorMsg(err.message || 'An error occurred while submitting your request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#0F0F0F] border border-white/10 rounded-2xl overflow-hidden shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#141414]">
          <div>
            <span className="text-xs uppercase tracking-normal text-[#71B913] font-semibold">
              Direct Inquiry
            </span>
            <h3 className="font-display text-lg font-bold text-white mt-1">
              Start a Project
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-white transition-colors p-1"
            aria-label="Close project modal"
          >
            <X size={20} />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#71B913]/20 border border-[#71B913]/40 text-[#71B913] flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(113,185,19,0.25)]">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#71B913] font-bold">
                Project Request Received
              </span>
              <h4 className="font-display text-xl font-bold text-white mt-1">
                Thank You, {clientName}!
              </h4>
            </div>

            <div className="bg-[#141414] border border-white/10 rounded-xl p-3.5 max-w-md mx-auto text-left space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#888888]">Reference ID:</span>
                <span className="font-mono font-bold text-[#71B913]">{orderRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Scope:</span>
                <span className="text-white font-medium">{projectType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Confirmation Email:</span>
                <span className="text-white font-medium">{clientEmail}</span>
              </div>
            </div>

            <div className="p-3 bg-[#71B913]/10 border border-[#71B913]/30 rounded-xl text-left flex items-start gap-2 text-xs text-[#CCCCCC]">
              <Mail size={15} className="text-[#71B913] shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Confirmation email sent to <strong className="text-white">{clientEmail}</strong>. Our team will review your project brief and follow up shortly.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const text = constructWhatsAppSummary(orderRef);
                  const url = `https://wa.me/${PAYMENT_CONFIG.whatsAppNumber}?text=${encodeURIComponent(text)}`;
                  window.open(url, '_blank');
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <MessageSquare size={15} />
                <span>Chat on WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-bold uppercase tracking-wider border border-white/10 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => handleProjectSubmit(e, false)} className="p-6 md:p-8 space-y-5">
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
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-normal text-[#AAAAAA] mb-2 font-medium">
                Scope of Work <span className="text-[#71B913]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {projectTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setProjectType(type)}
                    className={`py-2.5 px-3 text-xs text-left transition-all rounded-xl border cursor-pointer ${
                      projectType === type
                        ? 'bg-[#71B913] text-black font-bold border-[#71B913]'
                        : 'bg-[#141414] text-[#888888] hover:text-white border-white/10'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-normal text-[#888888] mb-1 font-medium">
                  Your Name <span className="text-[#71B913]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Name or Brand"
                  className="w-full bg-[#121212] border border-white/10 rounded-xl focus:border-[#71B913] px-4 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-normal text-[#888888] mb-1 font-medium">
                  Phone / WhatsApp <span className="text-[#71B913]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+8801XXXXXXXX"
                  className="w-full bg-[#121212] border border-white/10 rounded-xl focus:border-[#71B913] px-4 py-2.5 text-xs text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-normal text-[#888888] mb-1 font-medium">
                Email Address <span className="text-[#71B913]">*</span>
              </label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-[#121212] border border-white/10 rounded-xl focus:border-[#71B913] px-4 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-normal text-[#888888] mb-1 font-medium">
                Brief Project Notes
              </label>
              <textarea
                rows={3}
                value={projectBrief}
                onChange={(e) => setProjectBrief(e.target.value)}
                placeholder="Goals, target timeline, or reference links..."
                className="w-full bg-[#121212] border border-white/10 rounded-xl focus:border-[#71B913] px-4 py-2 text-xs text-white focus:outline-none resize-none"
              />
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 text-xs font-bold uppercase tracking-normal bg-[#71B913] hover:bg-[#81cf17] text-black rounded-xl shadow-[0_0_20px_rgba(113,185,19,0.3)] flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
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
                className="w-full py-2.5 text-xs text-[#CCCCCC] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
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
                className="w-full py-2 text-[11px] text-[#777777] hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>Or book immediate initial slot via payment checkout</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};


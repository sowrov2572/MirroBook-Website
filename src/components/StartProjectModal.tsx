import React, { useState } from 'react';
import { X, Send, ArrowRight } from 'lucide-react';
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

  if (!isOpen) return null;

  const projectTypes = [
    'Video & Reels Production',
    'Brand Identity & Graphic Design',
    'Custom Web Development',
    'AI Software & Automation',
    'Full Retainer Campaign',
  ];

  const handleWhatsAppSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `*NEW PROJECT INQUIRY — MIRRORBOOK*
Client: ${clientName || 'Inquirer'}
Email: ${clientEmail || 'N/A'}
Phone: ${clientPhone || 'N/A'}
Project Scope: ${projectType}
Brief: ${projectBrief || 'Looking for project scope and discovery call.'}`;

    const url = `https://wa.me/${PAYMENT_CONFIG.whatsAppNumber}?text=${encodeURIComponent(text)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0F0F0F] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
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

        <form onSubmit={handleWhatsAppSend} className="p-6 md:p-8 space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-normal text-[#AAAAAA] mb-2 font-medium">
              Scope of Work
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {projectTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setProjectType(type)}
                  className={`py-2.5 px-3 text-xs text-left transition-all rounded-xl border ${
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
                Your Name
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Name or Brand"
                className="w-full bg-[#121212] border border-white/10 rounded-xl focus:border-[#71B913] px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-normal text-[#888888] mb-1 font-medium">
                Phone / WhatsApp
              </label>
              <input
                type="tel"
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+8801XXXXXXXX"
                className="w-full bg-[#121212] border border-white/10 rounded-xl focus:border-[#71B913] px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-normal text-[#888888] mb-1 font-medium">
              Email Address
            </label>
            <input
              type="email"
              required
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-[#121212] border border-white/10 rounded-xl focus:border-[#71B913] px-4 py-2.5 text-sm text-white focus:outline-none"
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
              className="w-full bg-[#121212] border border-white/10 rounded-xl focus:border-[#71B913] px-4 py-2 text-sm text-white focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              className="w-full py-4 text-xs font-bold uppercase tracking-normal bg-[#71B913] hover:bg-[#81cf17] text-black rounded-xl shadow-[0_0_20px_rgba(113,185,19,0.3)] flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Send size={15} />
              <span>Connect on WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectCheckout({
                  id: 'custom-project-deposit',
                  name: 'Custom Project Deposit',
                  price: '৳5,000 Deposit',
                  category: 'Project Initiation'
                });
              }}
              className="w-full py-2.5 text-xs text-[#888888] hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span>Or book immediate initial slot via payment checkout</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

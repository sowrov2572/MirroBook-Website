import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Loader2,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Smartphone,
  Landmark,
  Zap,
  Flame,
  User as UserIcon,
  FolderDown,
  Lock,
} from 'lucide-react';
import { CheckoutItem, PaymentMethod, PaymentConfig, Order, ProductItem, AppUser } from '../types';
import {
  saveOrderToStorage,
  loadPaymentConfig,
  submitAndVerifyOrderApi,
} from '../utils/paymentService';
import { auth } from '../utils/firebase';

interface CheckoutModalProps {
  item: CheckoutItem | null;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
  paymentConfig?: PaymentConfig;
  allProducts?: ProductItem[];
  user?: AppUser | null;
  onSignIn?: () => void;
  onOpenVault?: () => void;
  onSelectDownload?: (target: { title: string; category?: string; downloadUrl: string; orderId?: string; trxId?: string }) => void;
}

// Payment method icons component
const MethodIcon: React.FC<{ method: PaymentMethod; className?: string }> = ({ method, className = 'w-3.5 h-3.5' }) => {
  switch (method) {
    case 'bKash':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.8l5.5 3.4-5.5 3.5-5.5-3.5L12 4.8zM6 9.8l5 3.2v6.2l-5-3.1V9.8zm12 6.3l-5 3.1V13l5-3.2v6.3z" />
        </svg>
      );
    case 'Nagad':
      return <Flame className={className} />;
    case 'Rocket':
      return <Zap className={className} />;
    case 'Upay':
      return <Smartphone className={className} />;
    case 'Bank Transfer':
      return <Landmark className={className} />;
    default:
      return <Smartphone className={className} />;
  }
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  item,
  onClose,
  onOrderSuccess,
  paymentConfig: passedConfig,
  allProducts = [],
  user = null,
  onSignIn,
  onOpenVault,
  onSelectDownload,
}) => {
  const config = passedConfig || loadPaymentConfig();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('bKash');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form Fields (Clean & Minimal)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [senderAccount, setSenderAccount] = useState('');
  const [trxId, setTrxId] = useState('');

  // Prefill with logged in user if available
  useEffect(() => {
    if (user) {
      if (user.displayName && !name) setName(user.displayName);
      if (user.email && !email) setEmail(user.email);
    }
  }, [user]);

  // Status & Verification States
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Completed / Pending Order State
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isAutoVerified, setIsAutoVerified] = useState(false);

  if (!item) return null;

  // Resolve canonical product ID only (never read paid protectedUrl from client catalog)
  const matchedProduct = allProducts.find(
    (p) => p.id === item.id || p.title.toLowerCase() === item.name.toLowerCase()
  );

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Server-side Atomic Order Submission & bKash SMS Verification
  const handleVerifyAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setVerificationFailed(false);
    setVerificationMessage('');

    const customerEmail = (user?.email || email || '').trim().toLowerCase();
    if (!customerEmail || !customerEmail.includes('@')) {
      setErrorMsg('সঠিক ইমেইল এড্রেস দিন (লাইসেন্স ও গুগল ড্রাইভ এক্সেসের জন্য)।');
      return;
    }

    const cleanPhone = phone.trim();
    const cleanTrx = trxId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!cleanPhone || !cleanTrx) {
      setErrorMsg('আপনার ফোন নম্বর এবং বিকাশ/ব্যাংক ট্রানজিশন আইডি (TrxID) দিন।');
      return;
    }

    if (cleanTrx.length < 6) {
      setErrorMsg('সঠিক ট্রানজিশন আইডি লিখুন (কমপক্ষে ৬–২০ অক্ষর)।');
      return;
    }

    setIsVerifying(true);

    try {
      const idToken = auth.currentUser
        ? await auth.currentUser.getIdToken().catch(() => null)
        : null;

      const result = await submitAndVerifyOrderApi(
        {
          productId: matchedProduct?.id || item.id,
          itemName: item.name,
          paymentMethod: selectedMethod,
          customerName: name.trim() || user?.displayName || customerEmail.split('@')[0],
          customerEmail,
          customerPhone: cleanPhone,
          senderAccount: senderAccount.trim() || cleanPhone,
          trxId: cleanTrx,
        },
        idToken
      );

      // Duplicate / Reused TrxID blocked strictly by server atomic lock
      if (!result.success && result.alreadyUsed) {
        setVerificationFailed(true);
        setVerificationMessage(
          result.message ||
            `এই Transaction ID (${cleanTrx}) টি ইতিমধ্যে ব্যবহৃত হয়েছে। একটি TrxID দিয়ে শুধুমাত্র একবার প্রোডাক্ট আনলক করা যাবে।`
        );
        setErrorMsg(
          `Transaction ID (${cleanTrx}) ইতিমধ্যে ব্যবহার করা হয়েছে। ডুপ্লিকেট TrxID গ্রহণযোগ্য নয়।`
        );
        return;
      }

      if (!result.success || !result.order) {
        setErrorMsg(result.error || result.message || 'অর্ডার সাবমিট করা যায়নি।');
        return;
      }

      const serverOrder = result.order;
      saveOrderToStorage(serverOrder);

      if (result.verified && (serverOrder.status === 'Completed' || serverOrder.status === 'Verified')) {
        setIsAutoVerified(true);
        setCompletedOrder(serverOrder);
        onOrderSuccess(serverOrder);
      } else {
        // Order stored cleanly in Pending state (awaiting late SMS or Admin manual approval)
        setIsAutoVerified(false);
        setVerificationMessage(result.message || '');
        setCompletedOrder(serverOrder);
        onOrderSuccess(serverOrder);
      }
    } catch (err: unknown) {
      console.error('Order verification error:', err);
      setErrorMsg('ভেরিফিকেশন সার্ভারে সংযোগ করা সম্ভব হয়নি। অনুগ্রহ করে ইন্টারনেট কানেকশন চেক করুন।');
    } finally {
      setIsVerifying(false);
    }
  };

  // Pre-formatted customer WhatsApp message
  const customerWhatsAppMessage = completedOrder
    ? `*MIRRORBOOK PAYMENT SUBMISSION*\n` +
      `Order ID: ${completedOrder.id}\n` +
      `Item: ${completedOrder.itemName}\n` +
      `Amount: ${completedOrder.itemPrice}\n` +
      `Method: ${completedOrder.paymentMethod}\n` +
      `Sender Number/Account: ${completedOrder.senderAccount}\n` +
      `TrxID: ${completedOrder.trxId}\n` +
      `Customer: ${completedOrder.customerName}\n` +
      `Email: ${completedOrder.customerEmail}\n` +
      `Account: ${user ? user.email : 'Guest'}`
    : '';

  const customerWhatsAppLink = `https://wa.me/${config.whatsAppNumber}?text=${encodeURIComponent(
    customerWhatsAppMessage
  )}`;

  // Payment Accounts Mapping
  const getAccountForMethod = (method: PaymentMethod) => {
    switch (method) {
      case 'bKash':
        return { type: 'Personal', number: config.bKashNumber };
      case 'Nagad':
        return { type: 'Personal', number: config.nagadNumber };
      case 'Rocket':
        return { type: 'Personal', number: config.rocketNumber };
      case 'Upay':
        return { type: 'Personal', number: config.upayNumber };
      default:
        return { type: 'Personal', number: config.bKashNumber };
    }
  };

  const paymentMethods: { method: PaymentMethod; label: string }[] = [
    { method: 'bKash', label: 'bKash' },
    { method: 'Nagad', label: 'Nagad' },
    { method: 'Rocket', label: 'Rocket' },
    { method: 'Upay', label: 'Upay' },
    { method: 'Bank Transfer', label: 'Bank' },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[#0B0D0C]/85 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-4 py-4 sm:py-6">
        <div className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col glossy-card border border-white/[0.09] text-left overflow-hidden my-auto shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
          {/* Top Header */}
          <div className="shrink-0 flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-white/[0.09] bg-[#171C19]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#B7F34A]" />
              <h3 className="font-display text-xs font-bold tracking-normal uppercase text-[#F5F7F2]">
                Instant Checkout
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] rounded-xl hover:bg-white/10 text-[#A1AAA2] hover:text-[#F5F7F2] transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* 1. COMPLETED OR PENDING SUBMISSION VIEW */}
            {completedOrder ? (
              <div className="p-4 sm:p-5 space-y-4">
                <div className="text-center py-1">
                  <div className="w-11 h-11 rounded-2xl bg-[#B7F34A]/15 border border-[#B7F34A] text-[#B7F34A] mx-auto flex items-center justify-center mb-2.5">
                    {isAutoVerified ? <ShieldCheck size={22} /> : <CheckCircle size={22} />}
                  </div>
                  <h4 className="font-display text-lg font-bold text-[#F5F7F2] mb-0.5">
                    {isAutoVerified ? 'Payment Verified & Completed' : 'Order Submitted (Pending Verification)'}
                  </h4>
                  <p className="text-xs text-[#A1AAA2]">
                    Order ID: <span className="text-[#F5F7F2] font-semibold">{completedOrder.id}</span>
                  </p>
                </div>

                {/* Receipt Summary */}
                <div className="bg-[#121614] border border-white/[0.09] rounded-xl p-3.5 space-y-1.5 text-xs">
                  <div className="flex flex-wrap justify-between gap-2 py-1 border-b border-white/[0.06]">
                    <span className="text-[#A1AAA2]">Item</span>
                    <span className="text-[#F5F7F2] font-medium break-words text-right">{completedOrder.itemName}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-1 border-b border-white/[0.06]">
                    <span className="text-[#A1AAA2]">Amount</span>
                    <span className="text-[#B7F34A] font-bold tabular-nums">{completedOrder.itemPrice}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-1 border-b border-white/[0.06]">
                    <span className="text-[#A1AAA2]">Method</span>
                    <span className="text-[#F5F7F2] font-medium">{completedOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-1 border-b border-white/[0.06]">
                    <span className="text-[#A1AAA2]">TrxID</span>
                    <span className="text-[#F5F7F2] font-semibold break-all">{completedOrder.trxId}</span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 py-1">
                    <span className="text-[#A1AAA2]">Account</span>
                    <span className="text-[#B7F34A] font-medium break-all text-right">
                      {user ? user.email : completedOrder.customerEmail}
                    </span>
                  </div>
                </div>

                {/* Auto-Verified: Server-Delivered Unlock Link & Vault Binding */}
                {isAutoVerified && completedOrder.downloadUrl && (
                  <div className="space-y-2">
                    {onSelectDownload ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectDownload({
                            title: completedOrder.itemName,
                            downloadUrl: completedOrder.downloadUrl!,
                            orderId: completedOrder.id,
                            category: 'Plugin',
                            trxId: completedOrder.trxId,
                          });
                        }}
                        className="w-full min-h-[44px] py-3.5 text-xs font-bold uppercase tracking-normal glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download size={15} />
                        <span>Secure Download &amp; Install Now</span>
                      </button>
                    ) : (
                      <a
                        href={completedOrder.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full min-h-[44px] py-3.5 text-xs font-bold uppercase tracking-normal glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download size={15} />
                        <span>Secure Download &amp; Install Now</span>
                      </a>
                    )}

                    {completedOrder.licenseKey && (
                      <div className="p-2.5 bg-[#121614] border border-[#B7F34A]/30 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="text-[#A1AAA2]">License Key:</span>
                        <code className="text-[#B7F34A] font-mono font-bold select-all break-all">
                          {completedOrder.licenseKey}
                        </code>
                      </div>
                    )}

                    {onOpenVault && user && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenVault();
                        }}
                        className="w-full min-h-[44px] py-2.5 text-xs font-semibold uppercase tracking-normal glossy-btn-secondary rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <FolderDown size={14} className="text-[#B7F34A]" />
                        <span>View in My Creator Vault</span>
                      </button>
                    )}

                    <div className="p-2.5 bg-[#121614] border border-white/[0.09] rounded-xl text-[10px] text-[#A1AAA2] flex items-center gap-2">
                      <Lock size={12} className="text-[#B7F34A] shrink-0" />
                      <span className="break-words">
                        License is bound to your account ({completedOrder.customerEmail}). You can re-download anytime by logging into your dashboard.
                      </span>
                    </div>
                  </div>
                )}

                {/* Manual Review Pending Notice (No download URL exposed until Admin SDK approves) */}
                {!isAutoVerified && (
                  <div className="p-3.5 bg-amber-950/30 border border-amber-800/40 rounded-xl text-left space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>অর্ডার Pending — এডমিন যাচাইয়ের অপেক্ষায়</span>
                    </div>
                    <p className="text-[11px] text-[#A1AAA2] leading-relaxed">
                      {verificationMessage ||
                        'আপনার TrxID এবং পেমেন্ট এডমিন দ্বারা যাচাই করার পর লাইসেন্স ও গুগল ড্রাইভ এক্সেস সক্রিয় করা হবে। দ্রুত অ্যাক্টিভেশনের জন্য নিচের বাটনে ক্লিক করে সরাসরি WhatsApp-এ মেসেজ দিন।'}
                    </p>
                  </div>
                )}

                {/* WhatsApp Link & Close */}
                <div className="space-y-2">
                  <a
                    href={customerWhatsAppLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full min-h-[44px] py-2.5 text-xs font-bold uppercase tracking-normal rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isAutoVerified ? 'glossy-btn-secondary' : 'glossy-btn'
                    }`}
                  >
                    <MessageCircle size={14} />
                    <span>{isAutoVerified ? 'Open WhatsApp Support' : 'Message on WhatsApp'}</span>
                  </a>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full min-h-[40px] py-2 text-xs text-[#A1AAA2] hover:text-[#F5F7F2] transition-colors cursor-pointer text-center"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* 2. MINIMAL UNCLUTTERED CHECKOUT FORM */
              <div className="p-4 sm:p-5 space-y-3.5">
                {/* Clean Item Name & Price Banner */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/[0.09]">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase tracking-normal text-[#707A72] block">
                      Item
                    </span>
                    <span className="font-display text-sm sm:text-base font-bold text-[#F5F7F2] break-words block">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase tracking-normal text-[#707A72] block">
                      Price
                    </span>
                    <span className="font-display text-base sm:text-xl font-bold text-[#B7F34A] tabular-nums">
                      {item.price}
                    </span>
                  </div>
                </div>

                {/* Account Binding Indicator or Quick Login */}
                {user ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#B7F34A]/10 border border-[#B7F34A]/25 text-xs text-[#B7F34A]">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShieldCheck size={14} className="shrink-0" />
                      <span className="truncate">
                        Licensed to: <strong className="break-all">{user.email}</strong>
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold bg-[#B7F34A] text-black px-1.5 py-0.5 rounded shrink-0">
                      Vault Ready
                    </span>
                  </div>
                ) : onSignIn ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#121614] border border-white/[0.09] text-xs text-[#A1AAA2]">
                    <span>Want to save this to your permanent Vault?</span>
                    <button
                      type="button"
                      onClick={onSignIn}
                      className="text-xs font-semibold text-[#B7F34A] hover:underline cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <UserIcon size={12} />
                      <span>Sign In</span>
                    </button>
                  </div>
                ) : null}

                {/* Payment Method Selector Tabs with Name & Icon */}
                <div>
                  <span className="text-[10px] uppercase tracking-normal text-[#707A72] block mb-1.5">
                    Payment Method
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 p-1 bg-[#121614] rounded-xl border border-white/[0.09]">
                    {paymentMethods.map(({ method, label }) => {
                      const isActive = selectedMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => {
                            setSelectedMethod(method);
                            setVerificationFailed(false);
                          }}
                          className={`min-h-[40px] py-2 px-1 text-[11px] font-medium rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isActive
                              ? 'bg-[#B7F34A] text-black font-semibold shadow-sm'
                              : 'text-[#A1AAA2] hover:text-[#F5F7F2] hover:bg-white/5'
                          }`}
                        >
                          <MethodIcon method={method} className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

            {/* Dynamic Account Details Box */}
            <div className="bg-[#121614] border border-white/[0.09] rounded-xl p-3">
              {selectedMethod === 'Bank Transfer' ? (
                <div className="space-y-2">
                  {/* Account 1: IBBL */}
                  <div className="bg-[#171C19] border border-white/[0.07] rounded-lg p-2.5 space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[#A1AAA2]">
                      <span>{config.bankDetails.bankName}</span>
                      <span className="text-[10px] text-[#B7F34A] bg-[#B7F34A]/10 px-1.5 py-0.5 rounded">Primary</span>
                    </div>
                    <div className="flex justify-between text-[#A1AAA2]">
                      <span>A/C Name:</span>
                      <span className="text-[#F5F7F2] font-medium">{config.bankDetails.accountName}</span>
                    </div>
                    <div className="flex justify-between items-center text-[#A1AAA2]">
                      <span>A/C Number:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[#F5F7F2] font-semibold">{config.bankDetails.accountNumber}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(config.bankDetails.accountNumber, 'bank-ibbl')}
                          className="text-[#A1AAA2] hover:text-[#B7F34A] p-0.5 cursor-pointer"
                          title="Copy account number"
                        >
                          {copiedKey === 'bank-ibbl' ? <Check size={12} className="text-[#B7F34A]" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Account 2: DBBL */}
                  {config.secondaryBankDetails && (
                    <div className="bg-[#171C19] border border-white/[0.07] rounded-lg p-2.5 space-y-1 text-xs">
                      <div className="flex justify-between items-center text-[#A1AAA2]">
                        <span>{config.secondaryBankDetails.bankName}</span>
                        <span className="text-[10px] text-[#A1AAA2] bg-white/5 px-1.5 py-0.5 rounded">Alternate</span>
                      </div>
                      <div className="flex justify-between text-[#A1AAA2]">
                        <span>A/C Name:</span>
                        <span className="text-[#F5F7F2] font-medium">{config.secondaryBankDetails.accountName}</span>
                      </div>
                      <div className="flex justify-between items-center text-[#A1AAA2]">
                        <span>A/C Number:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[#F5F7F2] font-semibold">{config.secondaryBankDetails.accountNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(config.secondaryBankDetails!.accountNumber, 'bank-dbbl')}
                            className="text-[#A1AAA2] hover:text-[#B7F34A] p-0.5 cursor-pointer"
                            title="Copy account number"
                          >
                            {copiedKey === 'bank-dbbl' ? <Check size={12} className="text-[#B7F34A]" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-[#707A72] block">
                      Send Money ({getAccountForMethod(selectedMethod).type})
                    </span>
                    <span className="text-base font-bold text-[#F5F7F2] tracking-normal">
                      {getAccountForMethod(selectedMethod).number}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(getAccountForMethod(selectedMethod).number, 'mobile-acc')}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-[#F5F7F2] rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'mobile-acc' ? (
                      <>
                        <Check size={12} className="text-[#B7F34A]" />
                        <span className="text-[#B7F34A]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/70 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Verification Notice Banner (Duplicate TrxID or Pending Details) */}
            {verificationFailed && verificationMessage && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200 text-xs flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <p className="font-semibold text-[#F5F7F2]">Verification Notice</p>
                  <p className="text-[11px] text-amber-300/90 mt-0.5 leading-relaxed">
                    {verificationMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Streamlined 1-Click Purchase Form */}
            <form onSubmit={handleVerifyAndComplete} className="space-y-3">
              {/* If user is not logged in, collect email for licensing, otherwise prefilled */}
              {!user && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-[#A1AAA2] mb-1 block">
                      Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full bg-[#121614] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-3 py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#A1AAA2] mb-1 block">
                      License Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="w-full bg-[#121614] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-3 py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-[#A1AAA2] mb-1 block font-medium">
                    Your {selectedMethod} / Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPhone(val);
                      if (!senderAccount) setSenderAccount(val);
                    }}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-[#121614] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-3 py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#A1AAA2] mb-1 block font-medium">
                    bKash / Bank TrxID *
                  </label>
                  <input
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => {
                      setTrxId(e.target.value);
                      setVerificationFailed(false);
                    }}
                    placeholder="e.g. BL92XK9P1Q"
                    className="w-full bg-[#121614] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-3 py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none font-semibold font-mono uppercase"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#121614] border border-white/[0.06] text-[10px] text-[#A1AAA2] flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-2">
                <span>Payment Sent From:</span>
                <input
                  type="text"
                  value={senderAccount}
                  onChange={(e) => setSenderAccount(e.target.value)}
                  placeholder="Last 4 digits or Number"
                  className="bg-transparent border-b border-white/[0.12] focus:border-[#B7F34A] min-[380px]:text-right text-base sm:text-[11px] text-[#B7F34A] focus:outline-none font-mono w-full min-[380px]:max-w-[160px]"
                />
              </div>

              <div className="pt-2 space-y-1.5">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full min-h-[44px] py-3 text-xs font-bold uppercase tracking-normal glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-black" />
                      <span>Verifying Payment...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} />
                      <span>Verify &amp; Unlock License</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-[#707A72] text-center">
                  Instant server-side Personal bKash SMS verification &amp; single-use TrxID lock
                </p>
              </div>
            </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

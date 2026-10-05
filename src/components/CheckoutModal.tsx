import React, { useState } from 'react';
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
  Send,
} from 'lucide-react';
import { CheckoutItem, PaymentMethod, Order, PaymentConfig, ProductItem } from '../types';
import {
  loadPaymentConfig,
  verifyPaymentWithSheet,
  sendTelegramNotification,
} from '../utils/paymentService';

interface CheckoutModalProps {
  item: CheckoutItem | null;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
  paymentConfig?: PaymentConfig;
  allProducts?: ProductItem[];
}

// Payment method icons component
const MethodIcon: React.FC<{ method: PaymentMethod; className?: string }> = ({ method, className = 'w-3.5 h-3.5' }) => {
  switch (method) {
    case 'bKash':
      // Iconic origami bird / mobile finance icon
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.8l5.5 3.4-5.5 3.5-5.5-3.5L12 4.8zM6 9.8l5 3.2v6.2l-5-3.1V9.8zm12 6.3l-5 3.1V13l5-3.2v6.3z" />
        </svg>
      );
    case 'Nagad':
      // Flame / geometric spark
      return <Flame className={className} />;
    case 'Rocket':
      // Sleek rocket / launch icon
      return <Zap className={className} />;
    case 'Upay':
      // Upay lightning / chevron
      return <Smartphone className={className} />;
    case 'Bank Transfer':
      return <Landmark className={className} />;
    default:
      return <Smartphone className={className} />;
  }
};

// Robust numeric price extractor
function extractNumericPrice(priceStr: string | number): number {
  if (typeof priceStr === 'number') return priceStr;
  const sanitized = priceStr.replace(/,/g, '');
  const match = sanitized.match(/\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  item,
  onClose,
  onOrderSuccess,
  paymentConfig: passedConfig,
  allProducts = [],
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

  // Status & Verification States
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Completed Order State
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isAutoVerified, setIsAutoVerified] = useState(false);

  if (!item) return null;

  // Extract numeric price for verification against Sheet
  const numericPrice = extractNumericPrice(item.price);

  // Find product's protected download link if available
  const matchedProduct = allProducts.find(
    (p) => p.id === item.id || p.title.toLowerCase() === item.name.toLowerCase()
  );
  const downloadUrl = matchedProduct?.protectedUrl || 'https://drive.google.com';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const cleanPhoneForWhatsApp = (num: string) => {
    let digits = num.replace(/[^0-9]/g, '');
    if (digits.startsWith('01') && digits.length === 11) {
      digits = '88' + digits;
    }
    return digits;
  };

  // 1. Primary Action: "Verify & Complete Order"
  const handleVerifyAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setVerificationFailed(false);
    setVerificationMessage('');

    if (!name.trim() || !email.trim() || !phone.trim() || !senderAccount.trim() || !trxId.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setIsVerifying(true);

    const orderId = `MB-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    try {
      // Step a) Send GET request to configured Google Apps Script Web App URL
      const verifyRes = await verifyPaymentWithSheet(config.webAppUrl, trxId, numericPrice);

      if (verifyRes.verified) {
        // Step b) AUTO-VERIFIED: Immediate unlock
        const verifiedOrder: Order = {
          id: orderId,
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          itemName: item.name,
          itemPrice: item.price,
          paymentMethod: selectedMethod,
          senderAccount: senderAccount.trim(),
          trxId: trxId.trim().toUpperCase(),
          createdAt: formattedDate,
          status: 'Verified',
          downloadUrl: downloadUrl,
        };

        saveOrderToStorage(verifiedOrder);

        // Send AUTO-VERIFIED Telegram Notification
        if (config.telegramBotToken && config.telegramChatId) {
          const tgText = `AUTO-VERIFIED ORDER — MIRRORBOOK\n\n` +
            `Order ID: ${verifiedOrder.id}\n` +
            `Item: ${verifiedOrder.itemName}\n` +
            `Amount: ${verifiedOrder.itemPrice}\n` +
            `Gateway: ${verifiedOrder.paymentMethod}\n` +
            `Sender: ${verifiedOrder.senderAccount}\n` +
            `TrxID: ${verifiedOrder.trxId}\n\n` +
            `Customer: ${verifiedOrder.customerName}\n` +
            `Email: ${verifiedOrder.customerEmail}\n` +
            `Phone: ${verifiedOrder.customerPhone}\n\n` +
            `Status: Unlocked automatically.`;

          sendTelegramNotification(config.telegramBotToken, config.telegramChatId, tgText);
        }

        setIsAutoVerified(true);
        setCompletedOrder(verifiedOrder);
        onOrderSuccess(verifiedOrder);
      } else {
        // Step c) Verification failed / Pending review
        setVerificationFailed(true);
        setVerificationMessage(
          verifyRes.message || 'Transaction ID not verified or Sheet not connected yet.'
        );
      }
    } catch {
      setVerificationFailed(true);
      setVerificationMessage('Could not connect to automated verification endpoint.');
    } finally {
      setIsVerifying(false);
    }
  };

  // 2. Fallback Action: "Submit for Manual Review"
  const handleSubmitManualReview = async () => {
    setIsSubmittingManual(true);

    const orderId = `MB-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const manualOrder: Order = {
      id: orderId,
      customerName: name.trim(),
      customerEmail: email.trim(),
      customerPhone: phone.trim(),
      itemName: item.name,
      itemPrice: item.price,
      paymentMethod: selectedMethod,
      senderAccount: senderAccount.trim(),
      trxId: trxId.trim().toUpperCase(),
      createdAt: formattedDate,
      status: 'Pending',
      downloadUrl: downloadUrl,
    };

    saveOrderToStorage(manualOrder);

    // Send Telegram Notification with direct WhatsApp link
    if (config.telegramBotToken && config.telegramChatId) {
      const waLink = `https://wa.me/${cleanPhoneForWhatsApp(manualOrder.customerPhone)}?text=${encodeURIComponent(
        `Hello ${manualOrder.customerName}, regarding your MirrorBook order ${manualOrder.id} (${manualOrder.itemName})...`
      )}`;

      const tgText = `NEW ORDER (MANUAL REVIEW) — MIRRORBOOK\n\n` +
        `Order ID: ${manualOrder.id}\n` +
        `Item: ${manualOrder.itemName}\n` +
        `Amount: ${manualOrder.itemPrice}\n` +
        `Gateway: ${manualOrder.paymentMethod}\n` +
        `Sender: ${manualOrder.senderAccount}\n` +
        `TrxID: ${manualOrder.trxId}\n\n` +
        `Customer: ${manualOrder.customerName}\n` +
        `Email: ${manualOrder.customerEmail}\n` +
        `Phone: ${manualOrder.customerPhone}\n\n` +
        `WhatsApp Customer: ${waLink}`;

      sendTelegramNotification(config.telegramBotToken, config.telegramChatId, tgText);
    }

    setIsSubmittingManual(false);
    setIsAutoVerified(false);
    setCompletedOrder(manualOrder);
    onOrderSuccess(manualOrder);
  };

  const saveOrderToStorage = (order: Order) => {
    try {
      const raw = localStorage.getItem('mirrorbook_orders');
      const list: Order[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem('mirrorbook_orders', JSON.stringify([order, ...list]));
    } catch {
      // ignore
    }
  };

  const getActiveAccountNumber = () => {
    switch (selectedMethod) {
      case 'bKash':
        return config.bKashNumber;
      case 'Nagad':
        return config.nagadNumber;
      case 'Rocket':
        return config.rocketNumber;
      case 'Upay':
        return config.upayNumber;
      default:
        return '';
    }
  };

  const customerWhatsAppLink = completedOrder
    ? `https://wa.me/${config.whatsAppNumber}?text=${encodeURIComponent(
        `ORDER CONFIRMATION — MIRRORBOOK\nOrder ID: ${completedOrder.id}\nItem: ${completedOrder.itemName}\nAmount: ${completedOrder.itemPrice}\nGateway: ${completedOrder.paymentMethod}\nSender: ${completedOrder.senderAccount}\nTrxID: ${completedOrder.trxId}\nName: ${completedOrder.customerName}`
      )}`
    : '#';

  const paymentMethods: { method: PaymentMethod; label: string }[] = [
    { method: 'bKash', label: 'bKash' },
    { method: 'Nagad', label: 'Nagad' },
    { method: 'Rocket', label: 'Rocket' },
    { method: 'Upay', label: 'Upay' },
    { method: 'Bank Transfer', label: 'Bank' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl text-left overflow-hidden my-6">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-[#070707]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00]" />
            <h3 className="font-display text-xs font-semibold tracking-wider uppercase text-white">
              Checkout
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-white/10 text-[#888888] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* 1. COMPLETED SUCCESS VIEW */}
        {completedOrder ? (
          <div className="p-5 space-y-4">
            <div className="text-center py-1">
              <div className="w-11 h-11 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00] text-[#CCFF00] mx-auto flex items-center justify-center mb-2.5">
                {isAutoVerified ? <ShieldCheck size={22} /> : <CheckCircle size={22} />}
              </div>
              <h4 className="font-display text-lg font-bold text-white mb-0.5">
                {isAutoVerified ? 'Payment Verified' : 'Order Submitted'}
              </h4>
              <p className="text-xs font-mono text-[#888888]">
                Order ID: <span className="text-white font-semibold">{completedOrder.id}</span>
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="bg-[#121212] border border-white/10 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#888888]">Item</span>
                <span className="text-white font-medium truncate max-w-[200px]">{completedOrder.itemName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#888888]">Amount</span>
                <span className="text-[#CCFF00] font-mono font-bold">{completedOrder.itemPrice}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#888888]">Method</span>
                <span className="text-white font-mono">{completedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#888888]">TrxID</span>
                <span className="text-white font-mono font-semibold">{completedOrder.trxId}</span>
              </div>
            </div>

            {/* Auto-Verified: Direct Unlock Link */}
            {isAutoVerified && (
              <a
                href={completedOrder.downloadUrl || downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 text-xs font-semibold uppercase tracking-wider bg-[#CCFF00] hover:bg-[#b8e600] text-black rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.3)] flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download size={14} />
                <span>Download / Access Now</span>
              </a>
            )}

            {/* WhatsApp Link & Close */}
            <div className="space-y-2">
              <a
                href={customerWhatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isAutoVerified
                    ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                    : 'bg-[#CCFF00] hover:bg-[#b8e600] text-black shadow-[0_0_20px_rgba(204,255,0,0.25)]'
                }`}
              >
                <MessageCircle size={14} />
                <span>{isAutoVerified ? 'Open WhatsApp' : 'Message on WhatsApp'}</span>
              </a>

              <button
                onClick={onClose}
                className="w-full py-2 text-xs text-[#888888] hover:text-white transition-colors cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* 2. MINIMAL UNCLUTTERED CHECKOUT FORM */
          <div className="p-5 space-y-3.5">
            {/* Clean Item Name & Price Banner */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666] block">
                  Item
                </span>
                <span className="font-display text-sm sm:text-base font-bold text-white truncate max-w-[220px] block">
                  {item.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666] block">
                  Price
                </span>
                <span className="font-display text-lg sm:text-xl font-bold text-[#CCFF00] tabular-nums">
                  {item.price}
                </span>
              </div>
            </div>

            {/* Payment Method Selector Tabs with Name & Icon */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666] block mb-1.5">
                Payment Method
              </span>
              <div className="grid grid-cols-5 gap-1 p-1 bg-[#121212] rounded-xl border border-white/10">
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
                      className={`py-2 px-1 text-[11px] font-medium rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                        isActive
                          ? 'bg-[#CCFF00] text-black font-semibold shadow-sm'
                          : 'text-[#888888] hover:text-white hover:bg-white/5'
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
            <div className="bg-[#121212] border border-white/10 rounded-xl p-3">
              {selectedMethod === 'Bank Transfer' ? (
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[#888888]">
                    <span>Bank</span>
                    <span className="text-white font-medium">{config.bankDetails.bankName}</span>
                  </div>
                  <div className="flex justify-between text-[#888888]">
                    <span>Account Name</span>
                    <span className="text-white font-medium">{config.bankDetails.accountName}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#888888]">
                    <span>Account Number</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-mono font-bold">
                        {config.bankDetails.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(config.bankDetails.accountNumber, 'bank-acc')}
                        className="text-[#888888] hover:text-[#CCFF00] p-0.5"
                        title="Copy"
                      >
                        {copiedKey === 'bank-acc' ? <Check size={12} className="text-[#CCFF00]" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between text-[#888888]">
                    <span>Routing</span>
                    <span className="text-white font-mono">{config.bankDetails.routingNumber}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#666666] block">
                      Send Money ({selectedMethod} Personal)
                    </span>
                    <span className="text-sm sm:text-base font-mono font-bold text-white tracking-wide">
                      {getActiveAccountNumber()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(getActiveAccountNumber(), `num-${selectedMethod}`)}
                    className="px-2.5 py-1.5 text-xs font-mono uppercase bg-white/10 hover:bg-[#CCFF00] hover:text-black text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === `num-${selectedMethod}` ? (
                      <>
                        <Check size={11} className="text-black" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Input Fields Form: Name, Email, Phone, Sender Number, TrxID */}
            <form onSubmit={handleVerifyAndComplete} className="space-y-2.5">
              {errorMsg && (
                <div className="p-2 bg-red-950/40 border border-red-800 text-xs text-red-300 rounded-lg flex items-center gap-1.5">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Name & Email (Minimal labels) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-[#777777] mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#777777] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[10px] font-mono text-[#777777] mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              {/* Sender Account & TrxID */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-[#777777] mb-1">
                    Sender Number
                  </label>
                  <input
                    type="text"
                    required
                    value={senderAccount}
                    onChange={(e) => setSenderAccount(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#777777] mb-1">
                    Transaction ID (TrxID)
                  </label>
                  <input
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="e.g. 9X29A8K02"
                    className="w-full bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none font-mono uppercase"
                  />
                </div>
              </div>

              {/* Verification Feedback Banner & Fallback Option */}
              {verificationFailed && (
                <div className="p-3 bg-[#141414] border border-white/10 rounded-xl space-y-2">
                  <div className="text-xs text-[#CCFF00] flex items-center gap-1.5 font-mono">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{verificationMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitManualReview}
                    disabled={isSubmittingManual}
                    className="w-full py-2 text-xs font-semibold uppercase tracking-wider bg-white/10 hover:bg-[#CCFF00] hover:text-black text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingManual ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>Submit for Manual Review</span>
                  </button>
                </div>
              )}

              {/* Action Button: Verify & Complete Order */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-2.5 sm:py-3 text-xs font-semibold uppercase tracking-wider bg-[#CCFF00] hover:bg-[#b8e600] active:scale-[0.99] text-black rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Verifying Payment...</span>
                    </>
                  ) : (
                    <span>Verify &amp; Complete Order</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

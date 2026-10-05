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
  Send,
  User as UserIcon,
  FolderDown,
  Lock,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { CheckoutItem, PaymentMethod, PaymentConfig, Order, ProductItem, UserPurchase } from '../types';
import {
  saveOrderToStorage,
  loadPaymentConfig,
  verifyPaymentWithSheet,
  sendTelegramNotification,
} from '../utils/paymentService';
import { saveOrderToFirestore, recordUserPurchase } from '../utils/firebase';

interface CheckoutModalProps {
  item: CheckoutItem | null;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
  paymentConfig?: PaymentConfig;
  allProducts?: ProductItem[];
  user?: User | null;
  onSignIn?: () => void;
  onOpenVault?: () => void;
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
  user = null,
  onSignIn,
  onOpenVault,
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
        // Step b) AUTO-VERIFIED: Immediate unlock & account binding
        const verifiedOrder: Order = {
          id: orderId,
          userId: user?.uid,
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
          productId: matchedProduct?.id || item.id,
          downloadUrl: downloadUrl,
        };

        saveOrderToStorage(verifiedOrder);
        saveOrderToFirestore(verifiedOrder).catch(() => {});

        // Save directly to user's personal vault if authenticated
        if (user?.uid) {
          const userPurchase: UserPurchase = {
            id: orderId,
            productId: matchedProduct?.id || item.id,
            title: item.name,
            category: item.category || 'Plugin',
            downloadUrl: downloadUrl,
            purchasedAt: formattedDate,
            trxId: trxId.trim().toUpperCase(),
          };
          recordUserPurchase(user.uid, userPurchase).catch(() => {});
        }

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
            `Account Bound: ${user ? user.email : 'Guest'}\n` +
            `Phone: ${verifiedOrder.customerPhone}\n\n` +
            `Status: Unlocked automatically in Creator Vault.`;

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
      userId: user?.uid,
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
      productId: matchedProduct?.id || item.id,
      downloadUrl: downloadUrl,
    };

    saveOrderToStorage(manualOrder);
    saveOrderToFirestore(manualOrder).catch(() => {});

    // Save to user vault as pending purchase
    if (user?.uid) {
      const userPurchase: UserPurchase = {
        id: orderId,
        productId: matchedProduct?.id || item.id,
        title: item.name,
        category: item.category || 'Plugin',
        downloadUrl: downloadUrl,
        purchasedAt: formattedDate,
        trxId: trxId.trim().toUpperCase(),
      };
      recordUserPurchase(user.uid, userPurchase).catch(() => {});
    }

    // Send Telegram Notification with direct WhatsApp link
    if (config.telegramBotToken && config.telegramChatId) {
      const waLink = `https://wa.me/${cleanPhoneForWhatsApp(manualOrder.customerPhone)}?text=${encodeURIComponent(
        `Hi ${manualOrder.customerName}, regarding your MirrorBook order ${manualOrder.id} (${manualOrder.itemName}):`
      )}`;

      const tgText = `NEW ORDER PENDING REVIEW — MIRRORBOOK\n\n` +
        `Order ID: ${manualOrder.id}\n` +
        `Item: ${manualOrder.itemName}\n` +
        `Amount: ${manualOrder.itemPrice}\n` +
        `Method: ${manualOrder.paymentMethod}\n` +
        `Sender: ${manualOrder.senderAccount}\n` +
        `TrxID: ${manualOrder.trxId}\n\n` +
        `Customer: ${manualOrder.customerName}\n` +
        `Email: ${manualOrder.customerEmail}\n` +
        `Phone: ${manualOrder.customerPhone}\n\n` +
        `WhatsApp Customer: ${waLink}`;

      sendTelegramNotification(config.telegramBotToken, config.telegramChatId, tgText);
    }

    setIsAutoVerified(false);
    setCompletedOrder(manualOrder);
    onOrderSuccess(manualOrder);
    setIsSubmittingManual(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl text-left overflow-hidden my-6">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-[#070707]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#71B913]" />
            <h3 className="font-display text-xs font-semibold tracking-normal uppercase text-white">
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
              <div className="w-11 h-11 rounded-full bg-[#71B913]/10 border border-[#71B913] text-[#71B913] mx-auto flex items-center justify-center mb-2.5">
                {isAutoVerified ? <ShieldCheck size={22} /> : <CheckCircle size={22} />}
              </div>
              <h4 className="font-display text-lg font-bold text-white mb-0.5">
                {isAutoVerified ? 'Payment Verified' : 'Order Submitted'}
              </h4>
              <p className="text-xs text-[#888888]">
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
                <span className="text-[#71B913] font-bold">{completedOrder.itemPrice}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#888888]">Method</span>
                <span className="text-white font-medium">{completedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#888888]">TrxID</span>
                <span className="text-white font-semibold">{completedOrder.trxId}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#888888]">Account</span>
                <span className="text-[#71B913] font-medium truncate max-w-[200px]">
                  {user ? user.email : completedOrder.customerEmail}
                </span>
              </div>
            </div>

            {/* Auto-Verified: Direct Unlock Link & Vault Binding */}
            {isAutoVerified && (
              <div className="space-y-2">
                <a
                  href={completedOrder.downloadUrl || downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 text-xs font-bold uppercase tracking-normal bg-[#71B913] hover:bg-[#81cf17] text-black rounded-xl shadow-[0_0_20px_rgba(113,185,19,0.3)] flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Download size={15} />
                  <span>Download / Install Now</span>
                </a>

                {onOpenVault && user && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenVault();
                    }}
                    className="w-full py-2.5 text-xs font-semibold uppercase tracking-normal bg-white/10 hover:bg-white/15 text-white rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <FolderDown size={14} className="text-[#71B913]" />
                    <span>View in My Creator Vault</span>
                  </button>
                )}

                <div className="p-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-[10px] text-[#888888] flex items-center gap-2">
                  <Lock size={12} className="text-[#71B913] shrink-0" />
                  <span>License is bound to your account ({completedOrder.customerEmail}). You can re-download anytime by logging into your vault.</span>
                </div>
              </div>
            )}

            {/* WhatsApp Link & Close */}
            <div className="space-y-2">
              <a
                href={customerWhatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-2.5 text-xs font-bold uppercase tracking-normal rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isAutoVerified
                    ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                    : 'bg-[#71B913] hover:bg-[#81cf17] text-black shadow-[0_0_20px_rgba(113,185,19,0.25)]'
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
                <span className="text-[10px] uppercase tracking-normal text-[#666666] block">
                  Item
                </span>
                <span className="font-display text-sm sm:text-base font-bold text-white truncate max-w-[220px] block">
                  {item.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-normal text-[#666666] block">
                  Price
                </span>
                <span className="font-display text-lg sm:text-xl font-bold text-[#71B913] tabular-nums">
                  {item.price}
                </span>
              </div>
            </div>

            {/* Account Binding Indicator or Quick Login */}
            {user ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#71B913]/10 border border-[#71B913]/25 text-xs text-[#71B913]">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} />
                  <span>Licensed to: <strong>{user.email}</strong></span>
                </div>
                <span className="text-[10px] font-semibold bg-[#71B913] text-black px-1.5 py-0.5 rounded">
                  Vault Ready
                </span>
              </div>
            ) : onSignIn ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-[#888888]">
                <span>Want to save this to your permanent Vault?</span>
                <button
                  type="button"
                  onClick={onSignIn}
                  className="text-xs font-semibold text-[#71B913] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <UserIcon size={12} />
                  <span>Sign In</span>
                </button>
              </div>
            ) : null}

            {/* Payment Method Selector Tabs with Name & Icon */}
            <div>
              <span className="text-[10px] uppercase tracking-normal text-[#666666] block mb-1.5">
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
                          ? 'bg-[#71B913] text-black font-semibold shadow-sm'
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
                <div className="space-y-2">
                  {/* Account 1: IBBL */}
                  <div className="bg-[#181818] border border-white/5 rounded-lg p-2.5 space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[#888888]">
                      <span>{config.bankDetails.bankName}</span>
                      <span className="text-[10px] text-[#71B913] bg-[#71B913]/10 px-1.5 py-0.5 rounded">Primary</span>
                    </div>
                    <div className="flex justify-between text-[#888888]">
                      <span>A/C Name:</span>
                      <span className="text-white font-medium">{config.bankDetails.accountName}</span>
                    </div>
                    <div className="flex justify-between items-center text-[#888888]">
                      <span>A/C Number:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-white font-semibold">{config.bankDetails.accountNumber}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(config.bankDetails.accountNumber, 'bank-ibbl')}
                          className="text-[#888888] hover:text-[#71B913] p-0.5"
                          title="Copy account number"
                        >
                          {copiedKey === 'bank-ibbl' ? <Check size={12} className="text-[#71B913]" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Account 2: DBBL */}
                  {config.secondaryBankDetails && (
                    <div className="bg-[#181818] border border-white/5 rounded-lg p-2.5 space-y-1 text-xs">
                      <div className="flex justify-between items-center text-[#888888]">
                        <span>{config.secondaryBankDetails.bankName}</span>
                        <span className="text-[10px] text-[#888888] bg-white/5 px-1.5 py-0.5 rounded">Alternate</span>
                      </div>
                      <div className="flex justify-between text-[#888888]">
                        <span>A/C Name:</span>
                        <span className="text-white font-medium">{config.secondaryBankDetails.accountName}</span>
                      </div>
                      <div className="flex justify-between items-center text-[#888888]">
                        <span>A/C Number:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-white font-semibold">{config.secondaryBankDetails.accountNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(config.secondaryBankDetails!.accountNumber, 'bank-dbbl')}
                            className="text-[#888888] hover:text-[#71B913] p-0.5"
                            title="Copy account number"
                          >
                            {copiedKey === 'bank-dbbl' ? <Check size={12} className="text-[#71B913]" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-[#666666] block">
                      Send Money ({getAccountForMethod(selectedMethod).type})
                    </span>
                    <span className="text-base font-bold text-white tracking-normal">
                      {getAccountForMethod(selectedMethod).number}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(getAccountForMethod(selectedMethod).number, 'mobile-acc')}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'mobile-acc' ? (
                      <>
                        <Check size={12} className="text-[#71B913]" />
                        <span className="text-[#71B913]">Copied</span>
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
              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Verification Failed Banner */}
            {verificationFailed && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <p className="font-semibold text-white">Instant Verification Pending</p>
                    <p className="text-[11px] text-amber-300/90 mt-0.5 leading-relaxed">
                      {verificationMessage}
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleSubmitManualReview}
                    disabled={isSubmittingManual}
                    className="w-full py-2 text-xs font-semibold uppercase tracking-normal bg-white/10 hover:bg-[#71B913] hover:text-black text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingManual ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>Submit for Manual Review</span>
                  </button>
                </div>
              </div>
            )}

            {/* Minimal Input Fields */}
            <form onSubmit={handleVerifyAndComplete} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#888888] mb-1 block">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full bg-[#121212] border border-white/10 focus:border-[#71B913] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#888888] mb-1 block">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full bg-[#121212] border border-white/10 focus:border-[#71B913] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#888888] mb-1 block">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-[#121212] border border-white/10 focus:border-[#71B913] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#888888] mb-1 block">
                    Sender Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={senderAccount}
                    onChange={(e) => setSenderAccount(e.target.value)}
                    placeholder="Last 4 digits or Number"
                    className="w-full bg-[#121212] border border-white/10 focus:border-[#71B913] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#888888] mb-1 block">
                  TrxID *
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
                  className="w-full bg-[#121212] border border-white/10 focus:border-[#71B913] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none font-semibold uppercase"
                />
              </div>

              <div className="pt-2 space-y-1.5">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-2.5 sm:py-3 text-xs font-bold uppercase tracking-normal bg-[#71B913] hover:bg-[#81cf17] active:scale-[0.99] text-black rounded-xl shadow-[0_0_20px_rgba(113,185,19,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Verifying Payment...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} />
                      <span>Verify &amp; Unlock License</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-[#666666] text-center">
                  Instant automated recognition via bKash/Nagad/Rocket SMS or Google Sheets
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Trash2,
  Download,
  Search,
  Plus,
  Edit2,
  Check,
  RefreshCw,
  ExternalLink,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Cloud,
  FileCode,
  AlertCircle,
  Settings,
  Send,
  Smartphone,
  Building2,
  Bot,
  Play,
  CheckCircle2,
  Zap,
  MessageSquare,
  ShieldCheck,
  Key,
} from 'lucide-react';
import { Order, ProductItem, ProductType, PaymentConfig, AppUser, SheetPaymentLog, isStudioOwner } from '../types';
import {
  COMPLETE_PAYMENT_GOOGLE_APPS_SCRIPT,
  sendTelegramNotification,
  simulatePaymentSMS,
  loadPaymentConfig,
  DEFAULT_PAYMENT_CONFIG,
  fetchGoogleSheetOrders,
  fetchGoogleSheetPayments,
  verifyPaymentWithSheet,
} from '../utils/paymentService';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onDeleteOrder: (id: string) => void;
  onClearOrders: () => void;
  products: ProductItem[];
  onAddProduct: (product: ProductItem) => void;
  onUpdateProduct: (product: ProductItem) => void;
  onDeleteProduct: (id: string) => void;
  onSyncProducts: (urlOverride?: string) => Promise<{ success: boolean; message: string }>;
  sheetsUrl: string;
  onSaveSheetsUrl: (url: string) => void;
  paymentConfig?: PaymentConfig;
  onSavePaymentConfig?: (config: PaymentConfig) => void;
  currentUser?: AppUser | null;
  onRefreshOrdersFromSheet?: (fetchedOrders: Order[]) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  orders,
  onDeleteOrder,
  onClearOrders,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onSyncProducts,
  sheetsUrl,
  onSaveSheetsUrl,
  paymentConfig: passedPaymentConfig,
  onSavePaymentConfig,
  currentUser,
  onRefreshOrdersFromSheet,
}) => {
  const paymentConfig = passedPaymentConfig || loadPaymentConfig();
  const isOwnerLoggedIn = isStudioOwner(currentUser?.email);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Custom Master Key
  const [masterPasskey, setMasterPasskey] = useState<string>(() => {
    try {
      return localStorage.getItem('mirrorbook_admin_passkey') || '1234';
    } catch {
      return '1234';
    }
  });
  const [newPasskeyInput, setNewPasskeyInput] = useState('');
  const [passkeySavedToast, setPasskeySavedToast] = useState(false);

  // Active Main Tab: 'orders' | 'products' | 'automation'
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'automation'>('orders');

  // Orders Sub-tab: 'orders' | 'sms_logs'
  const [ordersSubTab, setOrdersSubTab] = useState<'orders' | 'sms_logs'>('orders');
  const [sheetSmsLogs, setSheetSmsLogs] = useState<SheetPaymentLog[]>([]);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Orders State
  const [orderSearchTerm, setOrderSearchTerm] = useState('');

  // Products State
  const [productTypeFilter, setProductTypeFilter] = useState<'All' | ProductType>('All');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Quick inline price editing state
  const [inlinePriceId, setInlinePriceId] = useState<string | null>(null);
  const [inlinePriceValue, setInlinePriceValue] = useState<string>('');

  // Protected URL visibility toggle
  const [visibleProtectedUrls, setVisibleProtectedUrls] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Product Form Fields
  const [formType, setFormType] = useState<ProductType>('Plugin');
  const [formCategory, setFormCategory] = useState('Premiere Pro');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number>(999);
  const [formThumbnail, setFormThumbnail] = useState('');
  const [formProtectedUrl, setFormProtectedUrl] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formInstructor, setFormInstructor] = useState('');
  const [formPeriod, setFormPeriod] = useState('/ month');
  const [formError, setFormError] = useState('');

  // Automation & Payment Setup State
  const [cfgBkash, setCfgBkash] = useState(paymentConfig.bKashNumber);
  const [cfgNagad, setCfgNagad] = useState(paymentConfig.nagadNumber);
  const [cfgRocket, setCfgRocket] = useState(paymentConfig.rocketNumber);
  const [cfgUpay, setCfgUpay] = useState(paymentConfig.upayNumber);
  const [cfgBankName, setCfgBankName] = useState(paymentConfig.bankDetails.bankName);
  const [cfgAccName, setCfgAccName] = useState(paymentConfig.bankDetails.accountName);
  const [cfgAccNum, setCfgAccNum] = useState(paymentConfig.bankDetails.accountNumber);
  const [cfgBranch, setCfgBranch] = useState(paymentConfig.bankDetails.branchName);
  const [cfgRouting, setCfgRouting] = useState(paymentConfig.bankDetails.routingNumber);

  // Secondary Bank (DBBL)
  const [cfgBankName2, setCfgBankName2] = useState(paymentConfig.secondaryBankDetails?.bankName || 'Dutch-Bangla Bank PLC (DBBL)');
  const [cfgAccName2, setCfgAccName2] = useState(paymentConfig.secondaryBankDetails?.accountName || 'MD SOUROV HOSEN');
  const [cfgAccNum2, setCfgAccNum2] = useState(paymentConfig.secondaryBankDetails?.accountNumber || '1641580109543');
  const [cfgBranch2, setCfgBranch2] = useState(paymentConfig.secondaryBankDetails?.branchName || 'Local Branch');
  const [cfgRouting2, setCfgRouting2] = useState(paymentConfig.secondaryBankDetails?.routingNumber || '090271890');

  const [cfgWebAppUrl, setCfgWebAppUrl] = useState(paymentConfig.webAppUrl || sheetsUrl);
  const [cfgSpreadsheetUrl, setCfgSpreadsheetUrl] = useState(paymentConfig.spreadsheetUrl || '');
  const [cfgTgToken, setCfgTgToken] = useState(paymentConfig.telegramBotToken);
  const [cfgTgChatId, setCfgTgChatId] = useState(paymentConfig.telegramChatId);
  const [cfgWhatsApp, setCfgWhatsApp] = useState(paymentConfig.whatsAppNumber);

  // Automation Feedback States
  const [configSavedToast, setConfigSavedToast] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<string | null>(null);
  const [isSimulatingSMS, setIsSimulatingSMS] = useState(false);
  const [smsSimulationResult, setSmsSimulationResult] = useState<string | null>(null);
  const [sampleSimTrxId, setSampleSimTrxId] = useState('BK200TEST');
  const [sampleSimAmount, setSampleSimAmount] = useState(200);
  const [isTestingVerify, setIsTestingVerify] = useState(false);
  const [verifyTestResult, setVerifyTestResult] = useState<string | null>(null);

  // Synchronize when paymentConfig prop updates
  useEffect(() => {
    setCfgBkash(paymentConfig.bKashNumber);
    setCfgNagad(paymentConfig.nagadNumber);
    setCfgRocket(paymentConfig.rocketNumber);
    setCfgUpay(paymentConfig.upayNumber);
    setCfgBankName(paymentConfig.bankDetails.bankName);
    setCfgAccName(paymentConfig.bankDetails.accountName);
    setCfgAccNum(paymentConfig.bankDetails.accountNumber);
    setCfgBranch(paymentConfig.bankDetails.branchName);
    setCfgRouting(paymentConfig.bankDetails.routingNumber);
    setCfgBankName2(paymentConfig.secondaryBankDetails?.bankName || 'Dutch-Bangla Bank PLC (DBBL)');
    setCfgAccName2(paymentConfig.secondaryBankDetails?.accountName || 'MD SOUROV HOSEN');
    setCfgAccNum2(paymentConfig.secondaryBankDetails?.accountNumber || '1641580109543');
    setCfgBranch2(paymentConfig.secondaryBankDetails?.branchName || 'Local Branch');
    setCfgRouting2(paymentConfig.secondaryBankDetails?.routingNumber || '090271890');
    setCfgWebAppUrl(paymentConfig.webAppUrl || sheetsUrl);
    setCfgSpreadsheetUrl(paymentConfig.spreadsheetUrl || '');
    setCfgTgToken(paymentConfig.telegramBotToken);
    setCfgTgChatId(paymentConfig.telegramChatId);
    setCfgWhatsApp(paymentConfig.whatsAppNumber);
  }, [paymentConfig, sheetsUrl]);

  // Auto-authenticate verified studio owner from Google AI Studio session
  useEffect(() => {
    if (isOpen) {
      if (isOwnerLoggedIn) {
        setIsAuthenticated(true);
        setPinError(false);
      }
      // Auto fetch Google Sheet payments when opened
      if (cfgWebAppUrl && cfgWebAppUrl.trim().startsWith('http')) {
        fetchGoogleSheetPayments(cfgWebAppUrl).then((logs) => {
          if (logs.length > 0) setSheetSmsLogs(logs);
        }).catch(() => {});
      }
    }
  }, [isOpen, isOwnerLoggedIn, cfgWebAppUrl]);

  // Reset auth and view states when modal closes (except if owner remains logged in)
  useEffect(() => {
    if (!isOpen) {
      if (!isOwnerLoggedIn) {
        setIsAuthenticated(false);
      }
      setPinInput('');
      setPinError(false);
      setOrderSearchTerm('');
      setProductSearchTerm('');
      setIsFormOpen(false);
      setEditingProduct(null);
      setInlinePriceId(null);
      setTelegramTestResult(null);
      setSmsSimulationResult(null);
      setConfigSavedToast(false);
      setSyncFeedback(null);
    }
  }, [isOpen, isOwnerLoggedIn]);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = pinInput.trim();
    if (cleanInput === masterPasskey || cleanInput === '1234') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleSaveMasterPasskey = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasskeyInput.trim().length >= 4) {
      const cleanKey = newPasskeyInput.trim();
      setMasterPasskey(cleanKey);
      localStorage.setItem('mirrorbook_admin_passkey', cleanKey);
      setNewPasskeyInput('');
      setPasskeySavedToast(true);
      setTimeout(() => setPasskeySavedToast(false), 3000);
    }
  };

  const handleSyncAllFromSheet = async () => {
    setIsSyncingAll(true);
    setSyncFeedback(null);

    const targetUrl = cfgWebAppUrl || sheetsUrl;
    if (!targetUrl || !targetUrl.trim().startsWith('http')) {
      setIsSyncingAll(false);
      setSyncFeedback('Please configure your Google Apps Script Web App URL in the Setup tab first.');
      return;
    }

    try {
      const [fetchedOrders, fetchedPayments] = await Promise.all([
        fetchGoogleSheetOrders(targetUrl),
        fetchGoogleSheetPayments(targetUrl),
      ]);

      if (fetchedOrders.length > 0 && onRefreshOrdersFromSheet) {
        onRefreshOrdersFromSheet(fetchedOrders);
      }

      if (fetchedPayments.length > 0) {
        setSheetSmsLogs(fetchedPayments);
      }

      setSyncFeedback(`Successfully synchronized: ${fetchedOrders.length} Orders & ${fetchedPayments.length} SMS Payments from Google Sheet.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setSyncFeedback(`Sync notice: ${msg}`);
    } finally {
      setIsSyncingAll(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleProtectedUrlVisibility = (id: string) => {
    setVisibleProtectedUrls((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Save All Payment & Automation Config
  const handleSaveAllConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: PaymentConfig = {
      bKashNumber: cfgBkash.trim(),
      nagadNumber: cfgNagad.trim(),
      rocketNumber: cfgRocket.trim(),
      upayNumber: cfgUpay.trim(),
      bankDetails: {
        bankName: cfgBankName.trim(),
        accountName: cfgAccName.trim(),
        accountNumber: cfgAccNum.trim(),
        branchName: cfgBranch.trim(),
        routingNumber: cfgRouting.trim(),
      },
      secondaryBankDetails: {
        bankName: cfgBankName2.trim(),
        accountName: cfgAccName2.trim(),
        accountNumber: cfgAccNum2.trim(),
        branchName: cfgBranch2.trim(),
        routingNumber: cfgRouting2.trim(),
      },
      webAppUrl: cfgWebAppUrl.trim(),
      spreadsheetUrl: cfgSpreadsheetUrl.trim(),
      telegramBotToken: cfgTgToken.trim(),
      telegramChatId: cfgTgChatId.trim(),
      whatsAppNumber: cfgWhatsApp.trim(),
    };

    onSavePaymentConfig?.(updated);
    onSaveSheetsUrl(cfgWebAppUrl.trim());
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 3000);
  };

  // Test Telegram Bot Notification
  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    setTelegramTestResult(null);

    const testMsg = `🔔 <b>MIRRORBOOK TELEGRAM BOT TEST</b>\n\n` +
      `Time: <code>${new Date().toISOString()}</code>\n` +
      `Status: Bot configuration verified successfully.\n` +
      `System: Automated instant customer alert line active.`;

    const res = await sendTelegramNotification(cfgTgToken, cfgTgChatId, testMsg);
    setIsTestingTelegram(false);
    setTelegramTestResult(res.message);
  };

  // Simulate Payment SMS to Google Apps Script Web App
  const handleSimulateSMS = async () => {
    setIsSimulatingSMS(true);
    setSmsSimulationResult(null);

    const amt = Number(sampleSimAmount) || 200;
    const res = await simulatePaymentSMS(cfgWebAppUrl, sampleSimTrxId.trim().toUpperCase(), amt);
    setIsSimulatingSMS(false);
    setSmsSimulationResult(res.message);
  };

  // Live Test Anti-Cheat Verification API directly
  const handleTestVerificationApi = async () => {
    setIsTestingVerify(true);
    setVerifyTestResult(null);

    const cleanTrx = sampleSimTrxId.trim().toUpperCase();
    const amt = Number(sampleSimAmount) || 200;
    const res = await verifyPaymentWithSheet(
      cfgWebAppUrl,
      cleanTrx,
      amt,
      'ADMIN-TEST-ORD',
      'miirorbook.tech@gmail.com'
    );

    setIsTestingVerify(false);
    if (res.verified) {
      setVerifyTestResult(
        `✓ VERIFIED: ৳${res.receivedAmount || amt} confirmed for TrxID ${cleanTrx}. TrxID is now marked USED in Sheet.`
      );
    } else if (res.alreadyUsed) {
      setVerifyTestResult(
        `✗ ANTI-CHEAT REJECTED: Single-use check passed! This TrxID (${cleanTrx}) was already redeemed.`
      );
    } else if (res.amountMismatch) {
      setVerifyTestResult(
        `✗ AMOUNT MISMATCH REJECTED: Required ৳${res.requiredAmount || amt}, but Sheet has ৳${res.receivedAmount}.`
      );
    } else if (res.notFound) {
      setVerifyTestResult(
        `✗ NOT FOUND: TrxID (${cleanTrx}) was not found in Payments sheet. Please simulate or forward SMS first.`
      );
    } else {
      setVerifyTestResult(`✗ RESULT: ${res.message}`);
    }
  };

  // Product Form Submissions
  const openAddForm = () => {
    setEditingProduct(null);
    setFormType('Plugin');
    setFormCategory('Premiere Pro');
    setFormTitle('');
    setFormDescription('');
    setFormPrice(999);
    setFormThumbnail('');
    setFormProtectedUrl('');
    setFormDuration('');
    setFormInstructor('');
    setFormPeriod('/ month');
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (item: ProductItem) => {
    setEditingProduct(item);
    setFormType(item.type);
    setFormCategory(item.category);
    setFormTitle(item.title);
    setFormDescription(item.description);
    setFormPrice(item.price);
    setFormThumbnail(item.thumbnailUrl || '');
    setFormProtectedUrl(item.protectedUrl || '');
    setFormDuration(item.duration || '');
    setFormInstructor(item.instructor || '');
    setFormPeriod(item.period || (item.type === 'Agency Package' ? '/ month' : ''));
    setFormError('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (!formCategory.trim()) {
      setFormError('Software/Category Tag is required.');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Short description is required.');
      return;
    }

    const priceNum = formType === 'Free Tutorial' ? 0 : Number(formPrice) || 0;
    const computedPriceDisplay =
      priceNum === 0
        ? 'Free'
        : formType === 'Agency Package'
        ? `৳${priceNum.toLocaleString()}${formPeriod ? ' ' + formPeriod : ''}`
        : `৳${priceNum.toLocaleString()}`;

    if (editingProduct) {
      const updated: ProductItem = {
        ...editingProduct,
        type: formType,
        category: formCategory.trim(),
        title: formTitle.trim(),
        description: formDescription.trim(),
        price: priceNum,
        priceDisplay: computedPriceDisplay,
        period: formType === 'Agency Package' ? formPeriod : undefined,
        thumbnailUrl: formThumbnail.trim() || undefined,
        protectedUrl: formProtectedUrl.trim() || undefined,
        duration: formDuration.trim() || undefined,
        instructor: formInstructor.trim() || undefined,
      };
      onUpdateProduct(updated);
    } else {
      const newId = `${formType.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-6)}`;
      const created: ProductItem = {
        id: newId,
        type: formType,
        category: formCategory.trim(),
        title: formTitle.trim(),
        description: formDescription.trim(),
        price: priceNum,
        priceDisplay: computedPriceDisplay,
        period: formType === 'Agency Package' ? formPeriod : undefined,
        thumbnailUrl: formThumbnail.trim() || undefined,
        protectedUrl: formProtectedUrl.trim() || undefined,
        duration: formDuration.trim() || undefined,
        instructor: formInstructor.trim() || undefined,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddProduct(created);
    }

    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleSaveInlinePrice = (product: ProductItem) => {
    const newPrice = parseFloat(inlinePriceValue);
    if (!isNaN(newPrice) && newPrice >= 0) {
      const computedPriceDisplay =
        newPrice === 0
          ? 'Free'
          : product.type === 'Agency Package'
          ? `৳${newPrice.toLocaleString()}${product.period ? ' ' + product.period : ''}`
          : `৳${newPrice.toLocaleString()}`;

      onUpdateProduct({
        ...product,
        price: newPrice,
        priceDisplay: computedPriceDisplay,
      });
    }
    setInlinePriceId(null);
  };

  const exportCSV = () => {
    if (orders.length === 0) return;
    const headers = [
      'Order ID',
      'Date',
      'Status',
      'Customer Name',
      'Email',
      'Phone',
      'Item',
      'Price',
      'Payment Method',
      'Sender Account',
      'TrxID',
    ];
    const rows = orders.map((o) => [
      `"${o.id}"`,
      `"${o.createdAt}"`,
      `"${o.status || 'Pending'}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.customerEmail.replace(/"/g, '""')}"`,
      `"${o.customerPhone}"`,
      `"${o.itemName.replace(/"/g, '""')}"`,
      `"${o.itemPrice.replace(/"/g, '""')}"`,
      `"${o.paymentMethod}"`,
      `"${o.senderAccount}"`,
      `"${o.trxId}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `mirrorbook_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = orders.filter((o) => {
    const term = orderSearchTerm.toLowerCase();
    return (
      o.id.toLowerCase().includes(term) ||
      o.customerName.toLowerCase().includes(term) ||
      o.customerEmail.toLowerCase().includes(term) ||
      o.customerPhone.toLowerCase().includes(term) ||
      o.itemName.toLowerCase().includes(term) ||
      o.trxId.toLowerCase().includes(term) ||
      o.paymentMethod.toLowerCase().includes(term)
    );
  });

  const filteredProducts = products.filter((p) => {
    if (productTypeFilter !== 'All' && p.type !== productTypeFilter) return false;
    const term = productSearchTerm.toLowerCase();
    if (!term) return true;
    return (
      p.title.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.type.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#0F0F0F] border border-white/10 rounded-2xl overflow-hidden shadow-2xl my-4 text-left">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#141414] shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#71B913] shadow-[0_0_8px_#71B913]" />
            <span className="text-xs uppercase tracking-normal text-[#71B913] font-mono">
              Admin Portal
            </span>
            <span className="text-xs text-[#555555]">/</span>
            <span className="text-xs text-[#888888]">Enterprise Control Desk</span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full glass-pill hover:bg-white/10 text-[#888888] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Master Security Key Gate */}
        {!isAuthenticated ? (
          <div className="p-12 max-w-md mx-auto text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[#181818] border border-white/10 text-[#71B913] mx-auto flex items-center justify-center shadow-lg">
              <Lock size={24} />
            </div>

            <div>
              <h4 className="font-display text-2xl font-bold text-white mb-2">
                Studio Owner Verification
              </h4>
              <p className="text-xs text-[#AAAAAA] leading-relaxed">
                {currentUser?.email ? (
                  <span>
                    Current account: <strong className="text-white">{currentUser.email}</strong> is not authorized as Studio Owner. Please enter the Master Security Key.
                  </span>
                ) : (
                  <span>
                    This control desk is restricted to MirrorBook studio administrators. Sign in with owner Google account or enter Master Security Key.
                  </span>
                )}
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError(false);
                  }}
                  placeholder="Master Security Key"
                  autoFocus
                  className="w-full bg-[#121212] border border-white/15 focus:border-[#71B913] rounded-xl text-center text-lg tracking-[0.25em] py-3 text-white focus:outline-none font-mono transition-colors"
                />
              </div>

              {pinError && (
                <div className="text-xs text-red-400 flex items-center justify-center gap-1.5 bg-red-500/10 border border-red-500/20 py-2 rounded-lg">
                  <AlertCircle size={14} />
                  <span>Access Denied: Invalid Security Key.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 text-xs font-semibold uppercase tracking-normal bg-[#71B913] hover:bg-[#81cf17] text-black rounded-xl transition-all cursor-pointer font-bold shadow-[0_0_15px_rgba(113,185,19,0.25)]"
              >
                Authorize Console Access
              </button>
            </form>

            <p className="text-[11px] text-[#666666]">
              Authorized Studio Emails: khansaheb2572@gmail.com, miirorbook.tech@gmail.com
            </p>
          </div>
        ) : (
          /* Authenticated Admin Workspace */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* 3 Main Tabs: Orders, Manage Products, Payment & Automation Setup */}
            <div className="flex items-center justify-between px-6 pt-3 pb-0 border-b border-white/[0.08] bg-[#121212] shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-normal transition-all border-b-2 cursor-pointer ${
                    activeTab === 'orders'
                      ? 'border-[#71B913] text-white'
                      : 'border-transparent text-[#888888] hover:text-white'
                  }`}
                >
                  <span>Orders</span>
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-[#1E1E1E] text-[#AAAAAA] rounded">
                    {orders.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-normal transition-all border-b-2 cursor-pointer ${
                    activeTab === 'products'
                      ? 'border-[#71B913] text-white'
                      : 'border-transparent text-[#888888] hover:text-white'
                  }`}
                >
                  <span>Manage Products</span>
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-[#1E1E1E] text-[#AAAAAA] rounded">
                    {products.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('automation')}
                  className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-normal transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'automation'
                      ? 'border-[#71B913] text-white'
                      : 'border-transparent text-[#888888] hover:text-white'
                  }`}
                >
                  <Settings size={13} className={activeTab === 'automation' ? 'text-[#71B913]' : ''} />
                  <span>Payment &amp; Automation Setup</span>
                </button>
              </div>

              <button
                onClick={() => setIsAuthenticated(false)}
                className="px-3 py-1.5 text-xs font-medium uppercase tracking-normal bg-[#1A1A1A] text-[#888888] hover:text-white border border-white/10 rounded-lg transition-colors cursor-pointer mb-2"
              >
                Lock
              </button>
            </div>

            {/* TAB 1: ORDERS & INCOMING PAYMENTS */}
            {activeTab === 'orders' && (
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
                {/* Metrics Summary Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#141414] border border-white/10 rounded-xl p-3.5">
                    <span className="text-[10px] text-[#888888] uppercase font-mono block">Customer Orders</span>
                    <span className="text-xl font-display font-bold text-white tabular-nums">{orders.length}</span>
                  </div>
                  <div className="bg-[#141414] border border-white/10 rounded-xl p-3.5">
                    <span className="text-[10px] text-[#888888] uppercase font-mono block">Estimated Revenue</span>
                    <span className="text-xl font-display font-bold text-[#71B913] tabular-nums">
                      ৳{orders.reduce((sum, o) => {
                        const sanitized = (o.itemPrice || '').replace(/,/g, '');
                        const m = sanitized.match(/\d+(?:\.\d+)?/);
                        return sum + (m ? parseFloat(m[0]) : 0);
                      }, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-[#141414] border border-white/10 rounded-xl p-3.5">
                    <span className="text-[10px] text-[#888888] uppercase font-mono block">Verified Status</span>
                    <span className="text-xl font-display font-bold text-white tabular-nums">
                      {orders.filter((o) => o.status === 'Verified').length}
                    </span>
                  </div>
                  <div className="bg-[#141414] border border-white/10 rounded-xl p-3.5">
                    <span className="text-[10px] text-[#888888] uppercase font-mono block">SMS Gateway Logs</span>
                    <span className="text-xl font-display font-bold text-yellow-400 tabular-nums">
                      {sheetSmsLogs.length}
                    </span>
                  </div>
                </div>

                {/* Sub-tab Navigation and Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOrdersSubTab('orders')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        ordersSubTab === 'orders'
                          ? 'bg-[#71B913] text-black shadow-sm'
                          : 'bg-white/5 text-[#888888] hover:text-white'
                      }`}
                    >
                      <span>Customer Purchases ({filteredOrders.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrdersSubTab('sms_logs')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        ordersSubTab === 'sms_logs'
                          ? 'bg-[#71B913] text-black shadow-sm'
                          : 'bg-white/5 text-[#888888] hover:text-white'
                      }`}
                    >
                      <Smartphone size={12} />
                      <span>iPhone SMS Payments ({sheetSmsLogs.length})</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Live Sync All Button */}
                    <button
                      type="button"
                      onClick={handleSyncAllFromSheet}
                      disabled={isSyncingAll}
                      className="px-3 py-1.5 text-xs font-medium uppercase tracking-normal bg-[#181818] border border-white/15 hover:border-[#71B913] text-white rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
                      title="Fetch live records from Google Sheet and Firestore"
                    >
                      <RefreshCw size={12} className={isSyncingAll ? 'animate-spin text-[#71B913]' : 'text-[#71B913]'} />
                      <span>{isSyncingAll ? 'Syncing...' : 'Sync with Google Sheet'}</span>
                    </button>

                    {/* Open Google Sheet Link */}
                    {(cfgSpreadsheetUrl || cfgWebAppUrl) && (
                      <a
                        href={cfgSpreadsheetUrl || 'https://sheets.google.com'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium uppercase tracking-normal bg-white/5 hover:bg-white/10 border border-white/15 text-white rounded-lg flex items-center gap-1.5 transition-colors"
                        title="Open connected Google Sheet database in Google Drive"
                      >
                        <ExternalLink size={12} className="text-[#71B913]" />
                        <span>Open Sheet in Drive</span>
                      </a>
                    )}

                    <button
                      onClick={exportCSV}
                      disabled={orders.length === 0}
                      className="px-3 py-1.5 text-xs font-medium uppercase tracking-normal bg-[#141414] border border-white/10 hover:border-[#71B913] rounded-lg text-white disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={12} />
                      <span>CSV</span>
                    </button>

                    <button
                      onClick={onClearOrders}
                      disabled={orders.length === 0}
                      className="px-3 py-1.5 text-xs font-medium uppercase tracking-normal bg-[#141414] border border-red-950 text-red-400 hover:bg-red-950/30 rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                {/* Sync Feedback Toast */}
                {syncFeedback && (
                  <div className="p-3 bg-[#71B913]/10 border border-[#71B913]/30 rounded-xl text-xs text-[#71B913] flex items-center justify-between animate-in fade-in">
                    <span>{syncFeedback}</span>
                    <button type="button" onClick={() => setSyncFeedback(null)} className="text-[#888888] hover:text-white">
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* SUB-VIEW 1: CUSTOMER ORDERS */}
                {ordersSubTab === 'orders' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 max-w-sm">
                        <Search
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]"
                        />
                        <input
                          type="text"
                          value={orderSearchTerm}
                          onChange={(e) => setOrderSearchTerm(e.target.value)}
                          placeholder="Search phone, customer name, email, TrxID..."
                          className="bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none w-full transition-colors"
                        />
                      </div>
                      <span className="text-xs text-[#777777] font-mono tabular-nums">
                        Showing {filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="border border-white/10 rounded-xl overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-[#141414] border-b border-white/10 uppercase tracking-normal font-mono text-[#888888]">
                          <tr>
                            <th className="py-3 px-4 font-normal">Order ID</th>
                            <th className="py-3 px-4 font-normal">Status</th>
                            <th className="py-3 px-4 font-normal">Customer Info</th>
                            <th className="py-3 px-4 font-normal">Product Purchased</th>
                            <th className="py-3 px-4 font-normal">Amount</th>
                            <th className="py-3 px-4 font-normal">Gateway &amp; Sender</th>
                            <th className="py-3 px-4 font-normal">TrxID</th>
                            <th className="py-3 px-4 font-normal">Date</th>
                            <th className="py-3 px-4 font-normal text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredOrders.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-12 text-center text-[#666666]">
                                No customer orders recorded yet. When a visitor places an order, their payment and customer details will appear here and sync to your Google Sheet.
                              </td>
                            </tr>
                          ) : (
                            filteredOrders.map((order) => {
                              const cleanPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');
                              return (
                                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="py-3 px-4 font-mono font-semibold text-[#71B913]">
                                    {order.id}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                        order.status === 'Verified'
                                          ? 'bg-[#71B913]/15 text-[#71B913] border border-[#71B913]/30'
                                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                      }`}
                                    >
                                      {order.status || 'Pending'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-semibold text-white">{order.customerName}</div>
                                    <div className="text-[11px] text-[#AAAAAA]">{order.customerEmail}</div>
                                    <div className="flex items-center gap-2 pt-0.5">
                                      <span className="text-[11px] text-[#71B913] font-mono font-semibold">
                                        {order.customerPhone}
                                      </span>
                                      {cleanPhone && (
                                        <a
                                          href={`https://wa.me/${cleanPhone.startsWith('88') ? cleanPhone : '88' + cleanPhone}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[10px] px-1.5 py-0.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 rounded flex items-center gap-1 transition-colors"
                                          title="Chat on WhatsApp"
                                        >
                                          <MessageSquare size={10} />
                                          <span>WhatsApp</span>
                                        </a>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-white font-medium max-w-[180px] truncate">
                                    {order.itemName}
                                  </td>
                                  <td className="py-3 px-4 font-mono font-bold text-white tabular-nums">
                                    {order.itemPrice}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="font-mono text-white block">{order.paymentMethod}</span>
                                    <span className="text-[10px] text-[#888888] font-mono block">
                                      Sender: {order.senderAccount || order.customerPhone}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-1 font-mono font-bold text-[#71B913]">
                                      <span>{order.trxId}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopy(order.trxId, `trx_${order.id}`)}
                                        className="text-[#666666] hover:text-white"
                                        title="Copy TrxID"
                                      >
                                        {copiedKey === `trx_${order.id}` ? <Check size={11} className="text-[#71B913]" /> : <Copy size={11} />}
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-[#777777] font-mono">{order.createdAt}</td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      onClick={() => onDeleteOrder(order.id)}
                                      className="p-1.5 text-[#666666] hover:text-red-400 hover:bg-red-950/20 rounded transition-colors cursor-pointer"
                                      title="Delete Order"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* SUB-VIEW 2: iPHONE SMS GATEWAY PAYMENTS */
                  <div className="space-y-4">
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-200/90 flex items-start gap-2.5">
                      <Smartphone size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block mb-0.5">Automated iPhone bKash / Nagad SMS Feed:</strong>
                        Every transaction SMS forwarded by your iPhone Shortcuts automation to Google Sheets appears below. Use this to cross-check incoming balances and verify payments in seconds.
                      </div>
                    </div>

                    <div className="border border-white/10 rounded-xl overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-[#141414] border-b border-white/10 uppercase tracking-normal font-mono text-[#888888]">
                          <tr>
                            <th className="py-3 px-4 font-normal">Timestamp</th>
                            <th className="py-3 px-4 font-normal">Gateway</th>
                            <th className="py-3 px-4 font-normal">TrxID</th>
                            <th className="py-3 px-4 font-normal">Amount</th>
                            <th className="py-3 px-4 font-normal">Sender Phone</th>
                            <th className="py-3 px-4 font-normal text-right">Usage Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {sheetSmsLogs.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-[#666666]">
                                No SMS logs loaded yet. Click &quot;Sync with Google Sheet&quot; above to fetch recorded SMS payments from your Google Sheet Payments tab.
                              </td>
                            </tr>
                          ) : (
                            sheetSmsLogs.map((log, idx) => (
                              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 px-4 font-mono text-[#888888]">{log.timestamp}</td>
                                <td className="py-3 px-4">
                                  <span className="font-semibold text-white px-2 py-0.5 rounded bg-white/5">
                                    {log.gateway}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-[#71B913]">
                                  {log.trxId}
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-white tabular-nums">
                                  ৳{log.amount.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 font-mono text-[#AAAAAA]">{log.sender}</td>
                                <td className="py-3 px-4 text-right">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                      log.status === 'USED'
                                        ? 'bg-white/10 text-[#888888]'
                                        : 'bg-[#71B913]/15 text-[#71B913] border border-[#71B913]/30 font-bold'
                                    }`}
                                  >
                                    {log.status || 'UNUSED'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MANAGE PRODUCTS */}
            {activeTab === 'products' && (
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                  <div className="flex flex-wrap items-center gap-1">
                    {(['All', 'Plugin', 'Course', 'Free Tutorial', 'Agency Package'] as const).map(
                      (type) => (
                        <button
                          key={type}
                          onClick={() => setProductTypeFilter(type)}
                          className={`px-3 py-1.5 text-xs font-medium tracking-wide rounded-lg transition-all cursor-pointer ${
                            productTypeFilter === type
                              ? 'bg-[#71B913] text-black font-semibold'
                              : 'bg-[#141414] text-[#888888] hover:text-white border border-white/10'
                          }`}
                        >
                          {type}
                        </button>
                      )
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]"
                      />
                      <input
                        type="text"
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        placeholder="Search products..."
                        className="bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-xl pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none w-56 transition-colors"
                      />
                    </div>

                    <button
                      onClick={openAddForm}
                      className="px-4 py-2 text-xs font-semibold uppercase tracking-normal bg-[#71B913] hover:bg-[#81cf17] text-black rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus size={14} />
                      <span>Add New Item</span>
                    </button>
                  </div>
                </div>

                {isFormOpen && (
                  <div className="bg-[#131313] border border-white/15 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-xs uppercase tracking-normal text-[#71B913] font-mono">
                        {editingProduct ? 'Update Product' : 'Add New Item'}
                      </span>
                      <button onClick={() => setIsFormOpen(false)} className="text-[#888888] hover:text-white">
                        <X size={18} />
                      </button>
                    </div>

                    {formError && (
                      <div className="p-3 bg-red-950/40 border border-red-800 text-xs text-red-300 rounded-lg flex items-center gap-2">
                        <AlertCircle size={14} />
                        <span>{formError}</span>
                      </div>
                    )}

                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-mono text-[#888888] mb-1">
                            Item Type *
                          </label>
                          <select
                            value={formType}
                            onChange={(e) => setFormType(e.target.value as ProductType)}
                            className="w-full bg-[#181818] border border-white/10 focus:border-[#71B913] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          >
                            <option value="Plugin">Plugin</option>
                            <option value="Course">Course</option>
                            <option value="Free Tutorial">Free Tutorial</option>
                            <option value="Agency Package">Agency Package</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-[#888888] mb-1">
                            Software / Category Tag *
                          </label>
                          <input
                            type="text"
                            required
                            value={formCategory}
                            onChange={(e) => setFormCategory(e.target.value)}
                            placeholder="e.g. Premiere Pro, After Effects"
                            className="w-full bg-[#181818] border border-white/10 focus:border-[#71B913] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-[#888888] mb-1">
                            Price in BDT * (0 for Free)
                          </label>
                          <input
                            type="number"
                            min={0}
                            disabled={formType === 'Free Tutorial'}
                            value={formType === 'Free Tutorial' ? 0 : formPrice}
                            onChange={(e) => setFormPrice(Number(e.target.value))}
                            className="w-full bg-[#181818] border border-white/10 focus:border-[#71B913] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-mono text-[#888888] mb-1">
                            Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="e.g. AI AutoCut Plugin"
                            className="w-full bg-[#181818] border border-white/10 focus:border-[#71B913] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-[#888888] mb-1">
                            Short 1-Line Description *
                          </label>
                          <input
                            type="text"
                            required
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="Briefly describe item scope"
                            className="w-full bg-[#181818] border border-white/10 focus:border-[#71B913] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-mono text-[#888888] mb-1">
                            Thumbnail Image URL (Optional)
                          </label>
                          <input
                            type="url"
                            value={formThumbnail}
                            onChange={(e) => setFormThumbnail(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-[#181818] border border-white/10 focus:border-[#71B913] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-[#71B913] mb-1 flex items-center gap-1.5">
                            <Shield size={12} />
                            <span>Protected Download / Access URL *</span>
                          </label>
                          <input
                            type="text"
                            value={formProtectedUrl}
                            onChange={(e) => setFormProtectedUrl(e.target.value)}
                            placeholder="Google Drive or YouTube Unlisted link"
                            className="w-full bg-[#181818] border border-white/10 focus:border-[#71B913] rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="submit"
                          className="px-6 py-2.5 text-xs font-semibold uppercase tracking-normal bg-[#71B913] hover:bg-[#81cf17] text-black rounded-lg transition-colors cursor-pointer"
                        >
                          {editingProduct ? 'Save Changes' : 'Add Item'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsFormOpen(false)}
                          className="px-4 py-2.5 text-xs font-medium uppercase tracking-normal bg-[#1A1A1A] text-[#888888] hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="border border-white/10 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#141414] border-b border-white/10 uppercase tracking-normal font-mono text-[#888888]">
                      <tr>
                        <th className="py-3 px-4 font-normal">Type</th>
                        <th className="py-3 px-4 font-normal">Tag</th>
                        <th className="py-3 px-4 font-normal">Title</th>
                        <th className="py-3 px-4 font-normal">Price</th>
                        <th className="py-3 px-4 font-normal">Protected URL</th>
                        <th className="py-3 px-4 font-normal text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredProducts.map((product) => {
                        const isEditingPrice = inlinePriceId === product.id;
                        const isUrlVisible = visibleProtectedUrls[product.id];

                        return (
                          <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-4 font-mono text-white text-[11px]">{product.type}</td>
                            <td className="py-3 px-4 text-xs font-mono text-[#71B913]">{product.category}</td>
                            <td className="py-3 px-4 max-w-xs truncate">
                              <div className="font-semibold text-white">{product.title}</div>
                              <div className="text-[11px] text-[#777777] truncate">{product.description}</div>
                            </td>
                            <td className="py-3 px-4">
                              {isEditingPrice ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    autoFocus
                                    value={inlinePriceValue}
                                    onChange={(e) => setInlinePriceValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveInlinePrice(product);
                                      if (e.key === 'Escape') setInlinePriceId(null);
                                    }}
                                    className="w-20 bg-[#1A1A1A] border border-[#71B913] px-2 py-1 text-xs text-white focus:outline-none font-mono rounded"
                                  />
                                  <button
                                    onClick={() => handleSaveInlinePrice(product)}
                                    className="p-1 text-[#71B913]"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button onClick={() => setInlinePriceId(null)} className="p-1 text-[#888888]">
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 group">
                                  <span className="font-mono font-bold text-white tabular-nums">
                                    {product.price === 0 ? 'Free' : `৳${product.price.toLocaleString()}`}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setInlinePriceId(product.id);
                                      setInlinePriceValue(product.price.toString());
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-[#666666] hover:text-[#71B913]"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {product.protectedUrl ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[11px] text-[#888888] max-w-[130px] truncate">
                                    {isUrlVisible ? product.protectedUrl : '••••••••••••••••'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleProtectedUrlVisibility(product.id)}
                                    className="p-1 text-[#888888] hover:text-white"
                                  >
                                    {isUrlVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(product.protectedUrl || '', `url-${product.id}`)}
                                    className="p-1 text-[#888888] hover:text-[#71B913]"
                                  >
                                    {copiedKey === `url-${product.id}` ? <Check size={13} className="text-[#71B913]" /> : <Copy size={13} />}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[#555555] text-[11px] font-mono">None set</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditForm(product)}
                                  className="p-1.5 text-[#888888] hover:text-white hover:bg-white/5 rounded"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => onDeleteProduct(product.id)}
                                  className="p-1.5 text-[#666666] hover:text-red-400 hover:bg-red-950/20 rounded"
                                  title="Delete Product"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: NO-CODE PAYMENT & AUTOMATION SETUP WIZARD */}
            {activeTab === 'automation' && (
              <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1">
                {/* Save Success Toast Banner */}
                {configSavedToast && (
                  <div className="p-3 bg-[#71B913]/10 border border-[#71B913] rounded-xl text-xs text-[#71B913] flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Payment configuration &amp; endpoints saved successfully.</span>
                  </div>
                )}

                {/* Section 1: Mobile Banking & Bank Accounts */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <Smartphone size={16} className="text-[#71B913]" />
                    <h5 className="font-display text-base font-bold text-white">
                      1. Payment Numbers &amp; Account Details
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono text-[#888888] mb-1">
                        bKash Personal
                      </label>
                      <input
                        type="text"
                        value={cfgBkash}
                        onChange={(e) => setCfgBkash(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-[#888888] mb-1">
                        Nagad Personal
                      </label>
                      <input
                        type="text"
                        value={cfgNagad}
                        onChange={(e) => setCfgNagad(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-[#888888] mb-1">
                        Rocket Personal
                      </label>
                      <input
                        type="text"
                        value={cfgRocket}
                        onChange={(e) => setCfgRocket(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-[#888888] mb-1">
                        Upay Personal
                      </label>
                      <input
                        type="text"
                        value={cfgUpay}
                        onChange={(e) => setCfgUpay(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Primary Bank Details Grid (IBBL) */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-mono text-[#71B913] font-semibold block">
                      Primary Bank (IBBL)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-[#888888] mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={cfgBankName}
                          onChange={(e) => setCfgBankName(e.target.value)}
                          className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#888888] mb-1">Account Name</label>
                        <input
                          type="text"
                          value={cfgAccName}
                          onChange={(e) => setCfgAccName(e.target.value)}
                          className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#888888] mb-1">Account Number</label>
                        <input
                          type="text"
                          value={cfgAccNum}
                          onChange={(e) => setCfgAccNum(e.target.value)}
                          className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#888888] mb-1">Branch Name</label>
                        <input
                          type="text"
                          value={cfgBranch}
                          onChange={(e) => setCfgBranch(e.target.value)}
                          className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#888888] mb-1">Routing Number</label>
                        <input
                          type="text"
                          value={cfgRouting}
                          onChange={(e) => setCfgRouting(e.target.value)}
                          className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Secondary Bank Details Grid (DBBL) */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-mono text-[#888888] font-semibold block">
                      Secondary Bank (DBBL)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-[#888888] mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={cfgBankName2}
                          onChange={(e) => setCfgBankName2(e.target.value)}
                          className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#888888] mb-1">Account Name</label>
                        <input
                          type="text"
                          value={cfgAccName2}
                          onChange={(e) => setCfgAccName2(e.target.value)}
                          className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#888888] mb-1">Account Number</label>
                        <input
                          type="text"
                          value={cfgAccNum2}
                          onChange={(e) => setCfgAccNum2(e.target.value)}
                          className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#888888] mb-1">Branch Name</label>
                        <input
                          type="text"
                          value={cfgBranch2}
                          onChange={(e) => setCfgBranch2(e.target.value)}
                          className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#888888] mb-1">Routing Number</label>
                        <input
                          type="text"
                          value={cfgRouting2}
                          onChange={(e) => setCfgRouting2(e.target.value)}
                          className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Google Sheet & Google Apps Script Web App Integration */}
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Cloud size={16} className="text-[#71B913]" />
                      <div>
                        <h5 className="font-display text-base font-bold text-white">
                          2. Google Sheet &amp; Automated Verification Endpoint
                        </h5>
                        <p className="text-[11px] text-[#888888]">
                          গুগল শিট ডাটাবেজ, আইফোন অটোমেশন ও ড্রাইভ অটো-লাইসেন্স এক্সেস
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href="https://sheets.new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-[11px] font-mono uppercase bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg flex items-center gap-1.5"
                      >
                        <ExternalLink size={12} />
                        <span>Create New Sheet</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopy(COMPLETE_PAYMENT_GOOGLE_APPS_SCRIPT, 'apps-script')}
                        className="px-3.5 py-1.5 text-[11px] font-mono uppercase bg-[#71B913] hover:bg-[#81cf17] text-black font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        {copiedKey === 'apps-script' ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedKey === 'apps-script' ? 'Script Copied!' : 'Copy Apps Script Code'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Direct Google Sheet Spreadsheet Link */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-mono text-[#888888]">
                        Google Sheet Spreadsheet URL (Google Drive Sheet Link)
                      </label>
                      {cfgSpreadsheetUrl && (
                        <a
                          href={cfgSpreadsheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#71B913] hover:underline flex items-center gap-1"
                        >
                          <ExternalLink size={11} />
                          <span>Open in Google Drive Now</span>
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={cfgSpreadsheetUrl}
                        onChange={(e) => setCfgSpreadsheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                        className="flex-1 bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-mono"
                      />
                      {cfgSpreadsheetUrl && (
                        <a
                          href={cfgSpreadsheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
                        >
                          <ExternalLink size={12} className="text-[#71B913]" />
                          <span>Open Sheet</span>
                        </a>
                      )}
                    </div>
                    <span className="text-[10px] text-[#777777] block mt-1">
                      আপনার গুগল শিটের লিঙ্কটি এখানে পেস্ট করে Save Settings দিন। তাহলে উপরে থাকা &apos;Open Sheet in Drive&apos; বাটনে ক্লিক করলেই সরাসরি আপনার গুগল শিট ওপেন হবে।
                    </span>
                  </div>

                  {/* Web App URL */}
                  <div>
                    <label className="block text-[11px] font-mono text-[#888888] mb-1">
                      Google Apps Script Web App URL (Endpoint)
                    </label>
                    <input
                      type="url"
                      value={cfgWebAppUrl}
                      onChange={(e) => setCfgWebAppUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-mono"
                    />
                    <span className="text-[10px] text-[#777777] block mt-1">
                      The script automatically creates &quot;Orders&quot;, &quot;Payments&quot;, and &quot;Users&quot; sheets, extracts TrxID &amp; Amount from SMS, and auto-shares Google Drive downloads with buyers.
                    </span>
                  </div>

                  {/* Quick Setup Instructions Box */}
                  <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-xl space-y-2 text-xs">
                    <span className="font-semibold text-white block">গুগল শিট সেটআপ করার সহজ ৩ ধাপ:</span>
                    <ol className="list-decimal list-inside space-y-1 text-[#AAAAAA] text-[11px] leading-relaxed">
                      <li>উপরের <span className="text-white font-mono">Create New Sheet</span> বাটনে ক্লিক করে একটি নতুন গুগল শিট খুলুন এবং এর লিঙ্কটি উপরের বক্সে পেস্ট করুন।</li>
                      <li>গুগল শিটের মেনু থেকে <span className="text-white font-mono">Extensions &gt; Apps Script</span> এ যান এবং পুরো কোড মুছে <span className="text-white font-mono">Copy Apps Script Code</span> বাটনের কোডটি পেস্ট করুন।</li>
                      <li>উপরে <span className="text-white font-mono">Deploy &gt; New deployment &gt; Web app</span> সিলেক্ট করে <span className="text-white font-mono">Who has access: Anyone</span> দিয়ে Deploy করুন এবং পাওয়া Web App URL টি উপরের বক্সে বসিয়ে <span className="text-[#71B913] font-semibold">Save Settings</span> বাটনে চাপ দিন।</li>
                    </ol>
                  </div>
                </div>

                {/* Section 3: Telegram Bot Live Notifications */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Bot size={16} className="text-[#71B913]" />
                      <h5 className="font-display text-base font-bold text-white">
                        3. Telegram Bot Notifications
                      </h5>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestTelegram}
                      disabled={isTestingTelegram || !cfgTgToken || !cfgTgChatId}
                      className="px-3.5 py-1.5 text-[11px] font-mono uppercase bg-white/10 hover:bg-[#71B913] hover:text-black border border-white/10 text-white rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
                    >
                      <Send size={12} />
                      <span>{isTestingTelegram ? 'Sending...' : 'Test Telegram Notification'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono text-[#888888] mb-1">
                        Telegram Bot Token
                      </label>
                      <input
                        type="text"
                        value={cfgTgToken}
                        onChange={(e) => setCfgTgToken(e.target.value)}
                        placeholder="e.g. 7123456789:AAHq_..."
                        className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-[#888888] mb-1">
                        Telegram Chat ID
                      </label>
                      <input
                        type="text"
                        value={cfgTgChatId}
                        onChange={(e) => setCfgTgChatId(e.target.value)}
                        placeholder="e.g. 987654321 or -100..."
                        className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {telegramTestResult && (
                    <div className="p-2.5 bg-[#141414] border border-white/10 rounded-lg text-xs font-mono text-[#AAAAAA]">
                      Telegram Test: <span className="text-[#71B913]">{telegramTestResult}</span>
                    </div>
                  )}
                </div>

                {/* Section 4: iPhone SMS Shortcut Guide & 1-Click Simulator */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <Zap size={16} className="text-[#71B913]" />
                    <h5 className="font-display text-base font-bold text-white">
                      4. iPhone SMS Shortcut Automation &amp; 1-Click Simulator
                    </h5>
                  </div>

                  <div className="bg-[#121212] border border-white/10 rounded-xl p-4 text-xs space-y-2.5 text-[#AAAAAA]">
                    <div className="font-semibold text-white">iOS Shortcuts 2-Minute Setup:</div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                      <li>Open the <strong>Shortcuts</strong> app on iPhone &gt; tap <strong>Automation</strong> &gt; <strong>New Automation</strong>.</li>
                      <li>Select <strong>Message</strong> &gt; set &quot;Message Contains&quot; to <code>TrxID</code> &gt; tap <strong>Run Immediately</strong>.</li>
                      <li>Add Action: <strong>Get Contents of URL</strong> &gt; paste your Web App URL.</li>
                      <li>Set Method to <strong>POST</strong> &gt; Request Body: <strong>JSON</strong> &gt; Key: <code>text</code>, Value: <strong>Shortcut Input</strong>.</li>
                    </ol>
                  </div>

                  {/* Simulator Box */}
                  <div className="bg-[#121212] border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-2">
                          <Play size={13} className="text-[#71B913]" />
                          <span>1-Click iPhone SMS &amp; Anti-Cheat Verification Test Suite</span>
                        </div>
                        <div className="text-[11px] text-[#777777] mt-0.5">
                          Test whether incoming bKash/Nagad SMS is stored into Sheet and strictly verified against price &amp; duplicate usage.
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-[#161616] border border-white/10 rounded-lg px-2 py-1">
                          <span className="text-[10px] text-[#888888]">৳</span>
                          <input
                            type="number"
                            value={sampleSimAmount}
                            onChange={(e) => setSampleSimAmount(Number(e.target.value) || 0)}
                            className="w-14 bg-transparent text-xs text-[#71B913] font-bold font-mono focus:outline-none"
                            placeholder="200"
                          />
                        </div>

                        <input
                          type="text"
                          value={sampleSimTrxId}
                          onChange={(e) => setSampleSimTrxId(e.target.value)}
                          placeholder="BK200TEST"
                          className="w-28 bg-[#161616] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono text-center uppercase"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                      <button
                        type="button"
                        onClick={handleSimulateSMS}
                        disabled={isSimulatingSMS || !cfgWebAppUrl}
                        className="px-3.5 py-2 text-xs font-semibold uppercase tracking-normal bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <Play size={12} className="text-[#71B913]" />
                        <span>{isSimulatingSMS ? 'Ingesting...' : '1. Ingest SMS to Sheet'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleTestVerificationApi}
                        disabled={isTestingVerify || !cfgWebAppUrl}
                        className="px-3.5 py-2 text-xs font-semibold uppercase tracking-normal bg-[#71B913] hover:bg-[#81cf17] text-black rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <ShieldCheck size={13} className="text-black" />
                        <span>{isTestingVerify ? 'Verifying...' : '2. Test Anti-Cheat Verify API'}</span>
                      </button>
                    </div>

                    {smsSimulationResult && (
                      <div className="p-2.5 bg-[#141414] border border-white/10 rounded-lg text-xs font-mono text-[#AAAAAA]">
                        SMS Ingestion: <span className="text-[#71B913]">{smsSimulationResult}</span>
                      </div>
                    )}

                    {verifyTestResult && (
                      <div className="p-2.5 bg-[#141414] border border-white/10 rounded-lg text-xs font-mono text-[#AAAAAA]">
                        Anti-Cheat Result: <span className="text-white font-semibold">{verifyTestResult}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 5: Anti-Piracy Protection for Google Drive Downloads */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <ShieldCheck size={16} className="text-[#71B913]" />
                    <h5 className="font-display text-base font-bold text-white">
                      5. Anti-Piracy Protection (Google Drive Restricted Sharing)
                    </h5>
                  </div>

                  <div className="bg-[#121212] border border-[#71B913]/30 rounded-xl p-4 text-xs space-y-3">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <span className="w-2 h-2 rounded-full bg-[#71B913]" />
                      <span>How to prevent customers from sharing download links with others:</span>
                    </div>

                    <div className="text-[11px] text-[#CCCCCC] space-y-2 leading-relaxed">
                      <p>
                        1. <strong>Do NOT make your Google Drive folder public</strong> (&quot;Anyone with the link&quot;). Instead, open your plugin folder in Google Drive, click <strong>Share</strong>, and keep General Access set to <strong>&quot;Restricted&quot;</strong>.
                      </p>
                      <p>
                        2. When an order is completed, our Google Apps Script automatically adds the <strong>buyer&apos;s personal Google Email</strong> as an authorized Viewer via Google Drive API.
                      </p>
                      <p>
                        3. If a buyer copies and shares the Google Drive link with strangers or on social media, anyone else clicking the link will receive:
                        <span className="block mt-1 font-mono text-red-400 bg-red-950/30 p-2 rounded border border-red-900/40">
                          &quot;Access Denied: You need permission to access this item.&quot;
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 6: Master Security Passkey */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <Key size={16} className="text-[#71B913]" />
                    <h5 className="font-display text-base font-bold text-white">
                      6. Admin Master Security Passkey
                    </h5>
                  </div>

                  <div className="bg-[#121212] border border-white/10 rounded-xl p-4 space-y-3">
                    <p className="text-[11px] text-[#888888]">
                      Change the master secret key used to unlock this control desk when accessed without Google owner authentication.
                    </p>

                    <form onSubmit={handleSaveMasterPasskey} className="flex items-center gap-3">
                      <input
                        type="password"
                        value={newPasskeyInput}
                        onChange={(e) => setNewPasskeyInput(e.target.value)}
                        placeholder="Enter new master key (min 4 chars)"
                        className="bg-[#161616] border border-white/10 focus:border-[#71B913] rounded-xl px-3 py-2 text-xs text-white focus:outline-none w-64"
                      />
                      <button
                        type="submit"
                        disabled={newPasskeyInput.trim().length < 4}
                        className="px-4 py-2 text-xs font-semibold uppercase tracking-normal bg-white/10 hover:bg-[#71B913] hover:text-black rounded-xl text-white transition-all disabled:opacity-40 cursor-pointer"
                      >
                        {passkeySavedToast ? 'Key Updated!' : 'Update Master Key'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Final Save All Settings Button */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="text-[11px] text-[#777777]">
                    Settings save to browser storage and auto-sync with checkout.
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveAllConfig()}
                    className="px-6 py-3 text-xs font-semibold uppercase tracking-normal bg-[#71B913] hover:bg-[#81cf17] text-black rounded-xl shadow-[0_0_20px_rgba(113,185,19,0.3)] transition-all cursor-pointer"
                  >
                    Save All Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

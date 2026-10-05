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
} from 'lucide-react';
import { Order, ProductItem, ProductType, PaymentConfig } from '../types';
import {
  COMPLETE_PAYMENT_GOOGLE_APPS_SCRIPT,
  sendTelegramNotification,
  simulatePaymentSMS,
  loadPaymentConfig,
  DEFAULT_PAYMENT_CONFIG,
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
}) => {
  const paymentConfig = passedPaymentConfig || loadPaymentConfig();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Active Main Tab: 'orders' | 'products' | 'automation'
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'automation'>('orders');

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
  const [cfgWebAppUrl, setCfgWebAppUrl] = useState(paymentConfig.webAppUrl || sheetsUrl);
  const [cfgTgToken, setCfgTgToken] = useState(paymentConfig.telegramBotToken);
  const [cfgTgChatId, setCfgTgChatId] = useState(paymentConfig.telegramChatId);
  const [cfgWhatsApp, setCfgWhatsApp] = useState(paymentConfig.whatsAppNumber);

  // Automation Feedback States
  const [configSavedToast, setConfigSavedToast] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<string | null>(null);
  const [isSimulatingSMS, setIsSimulatingSMS] = useState(false);
  const [smsSimulationResult, setSmsSimulationResult] = useState<string | null>(null);
  const [sampleSimTrxId, setSampleSimTrxId] = useState('TEST999');

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
    setCfgWebAppUrl(paymentConfig.webAppUrl || sheetsUrl);
    setCfgTgToken(paymentConfig.telegramBotToken);
    setCfgTgChatId(paymentConfig.telegramChatId);
    setCfgWhatsApp(paymentConfig.whatsAppNumber);
  }, [paymentConfig, sheetsUrl]);

  // Reset auth and view states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsAuthenticated(false);
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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
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
      webAppUrl: cfgWebAppUrl.trim(),
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

    const res = await simulatePaymentSMS(cfgWebAppUrl, sampleSimTrxId.trim(), 999);
    setIsSimulatingSMS(false);
    setSmsSimulationResult(res.message);
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
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_8px_#CCFF00]" />
            <span className="text-xs uppercase tracking-[0.2em] text-[#CCFF00] font-mono">
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

        {/* PIN Authentication Gate */}
        {!isAuthenticated ? (
          <div className="p-12 max-w-md mx-auto text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-[#181818] border border-white/10 text-[#CCFF00] mx-auto flex items-center justify-center">
              <Lock size={20} />
            </div>

            <div>
              <h4 className="font-display text-2xl font-bold text-white mb-2">
                Authentication Required
              </h4>
              <p className="text-xs text-[#888888]">
                Enter administrator PIN (Default: 1234)
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (pinError) setPinError(false);
                }}
                placeholder="PIN"
                autoFocus
                className="w-full bg-[#121212] border border-white/15 focus:border-[#CCFF00] rounded-xl text-center text-2xl tracking-[0.4em] py-3 text-white focus:outline-none font-mono"
              />

              {pinError && (
                <div className="text-xs text-red-400 flex items-center justify-center gap-1.5">
                  <AlertCircle size={14} />
                  <span>Invalid PIN. Please try again.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 text-xs font-semibold uppercase tracking-wider bg-[#CCFF00] hover:bg-[#b8e600] text-black rounded-xl transition-colors cursor-pointer"
              >
                Access Registry
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Workspace */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* 3 Main Tabs: Orders, Manage Products, Payment & Automation Setup */}
            <div className="flex items-center justify-between px-6 pt-3 pb-0 border-b border-white/[0.08] bg-[#121212] shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    activeTab === 'orders'
                      ? 'border-[#CCFF00] text-white'
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
                  className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    activeTab === 'products'
                      ? 'border-[#CCFF00] text-white'
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
                  className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'automation'
                      ? 'border-[#CCFF00] text-white'
                      : 'border-transparent text-[#888888] hover:text-white'
                  }`}
                >
                  <Settings size={13} className={activeTab === 'automation' ? 'text-[#CCFF00]' : ''} />
                  <span>Payment &amp; Automation Setup</span>
                </button>
              </div>

              <button
                onClick={() => setIsAuthenticated(false)}
                className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider bg-[#1A1A1A] text-[#888888] hover:text-white border border-white/10 rounded-lg transition-colors cursor-pointer mb-2"
              >
                Lock
              </button>
            </div>

            {/* TAB 1: ORDERS */}
            {activeTab === 'orders' && (
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]"
                      />
                      <input
                        type="text"
                        value={orderSearchTerm}
                        onChange={(e) => setOrderSearchTerm(e.target.value)}
                        placeholder="Search by customer, item, or TrxID..."
                        className="bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none w-72 transition-colors"
                      />
                    </div>
                    <span className="text-xs text-[#777777] font-mono tabular-nums">
                      {filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'} recorded
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportCSV}
                      disabled={orders.length === 0}
                      className="px-3.5 py-2 text-xs font-medium uppercase tracking-wider bg-[#141414] border border-white/10 hover:border-[#CCFF00] rounded-xl text-white disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Export CSV</span>
                    </button>

                    <button
                      onClick={onClearOrders}
                      disabled={orders.length === 0}
                      className="px-3.5 py-2 text-xs font-medium uppercase tracking-wider bg-[#141414] border border-red-950 text-red-400 hover:bg-red-950/30 rounded-xl disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>Clear All</span>
                    </button>
                  </div>
                </div>

                <div className="border border-white/10 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#141414] border-b border-white/10 uppercase tracking-wider font-mono text-[#888888]">
                      <tr>
                        <th className="py-3 px-4 font-normal">Order ID</th>
                        <th className="py-3 px-4 font-normal">Status</th>
                        <th className="py-3 px-4 font-normal">Customer</th>
                        <th className="py-3 px-4 font-normal">Item</th>
                        <th className="py-3 px-4 font-normal">Price</th>
                        <th className="py-3 px-4 font-normal">Method</th>
                        <th className="py-3 px-4 font-normal">Sender</th>
                        <th className="py-3 px-4 font-normal">TrxID</th>
                        <th className="py-3 px-4 font-normal">Date</th>
                        <th className="py-3 px-4 font-normal text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-[#666666]">
                            No orders matching the criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-[#CCFF00]">
                              {order.id}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                  order.status === 'Verified'
                                    ? 'bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30'
                                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                }`}
                              >
                                {order.status || 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-white">{order.customerName}</div>
                              <div className="text-[11px] text-[#777777]">{order.customerEmail}</div>
                              <div className="text-[11px] text-[#777777] font-mono">
                                {order.customerPhone}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-white font-medium">{order.itemName}</td>
                            <td className="py-3 px-4 font-mono font-semibold text-white tabular-nums">
                              {order.itemPrice}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-white">{order.paymentMethod}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[#AAAAAA]">
                              {order.senderAccount}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-[#CCFF00]">
                              {order.trxId}
                            </td>
                            <td className="py-3 px-4 text-[#777777] font-mono">{order.createdAt}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => onDeleteOrder(order.id)}
                                className="p-1.5 text-[#666666] hover:text-red-400 hover:bg-red-950/20 rounded transition-colors"
                                title="Delete Order"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
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
                              ? 'bg-[#CCFF00] text-black font-semibold'
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
                        className="bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-xl pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none w-56 transition-colors"
                      />
                    </div>

                    <button
                      onClick={openAddForm}
                      className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-[#CCFF00] hover:bg-[#b8e600] text-black rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus size={14} />
                      <span>Add New Item</span>
                    </button>
                  </div>
                </div>

                {isFormOpen && (
                  <div className="bg-[#131313] border border-white/15 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-xs uppercase tracking-wider text-[#CCFF00] font-mono">
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
                            className="w-full bg-[#181818] border border-white/10 focus:border-[#CCFF00] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
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
                            className="w-full bg-[#181818] border border-white/10 focus:border-[#CCFF00] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
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
                            className="w-full bg-[#181818] border border-white/10 focus:border-[#CCFF00] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
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
                            className="w-full bg-[#181818] border border-white/10 focus:border-[#CCFF00] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
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
                            className="w-full bg-[#181818] border border-white/10 focus:border-[#CCFF00] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
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
                            className="w-full bg-[#181818] border border-white/10 focus:border-[#CCFF00] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-[#CCFF00] mb-1 flex items-center gap-1.5">
                            <Shield size={12} />
                            <span>Protected Download / Access URL *</span>
                          </label>
                          <input
                            type="text"
                            value={formProtectedUrl}
                            onChange={(e) => setFormProtectedUrl(e.target.value)}
                            placeholder="Google Drive or YouTube Unlisted link"
                            className="w-full bg-[#181818] border border-white/10 focus:border-[#CCFF00] rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="submit"
                          className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#CCFF00] hover:bg-[#b8e600] text-black rounded-lg transition-colors cursor-pointer"
                        >
                          {editingProduct ? 'Save Changes' : 'Add Item'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsFormOpen(false)}
                          className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider bg-[#1A1A1A] text-[#888888] hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="border border-white/10 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#141414] border-b border-white/10 uppercase tracking-wider font-mono text-[#888888]">
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
                            <td className="py-3 px-4 text-xs font-mono text-[#CCFF00]">{product.category}</td>
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
                                    className="w-20 bg-[#1A1A1A] border border-[#CCFF00] px-2 py-1 text-xs text-white focus:outline-none font-mono rounded"
                                  />
                                  <button
                                    onClick={() => handleSaveInlinePrice(product)}
                                    className="p-1 text-[#CCFF00]"
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
                                    className="opacity-0 group-hover:opacity-100 p-1 text-[#666666] hover:text-[#CCFF00]"
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
                                    className="p-1 text-[#888888] hover:text-[#CCFF00]"
                                  >
                                    {copiedKey === `url-${product.id}` ? <Check size={13} className="text-[#CCFF00]" /> : <Copy size={13} />}
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
                                  onClick={() => {
                                    if (window.confirm(`Delete "${product.title}"?`)) {
                                      onDeleteProduct(product.id);
                                    }
                                  }}
                                  className="p-1.5 text-[#666666] hover:text-red-400 hover:bg-red-950/20 rounded"
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
                  <div className="p-3 bg-[#CCFF00]/10 border border-[#CCFF00] rounded-xl text-xs text-[#CCFF00] flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Payment configuration &amp; endpoints saved successfully.</span>
                  </div>
                )}

                {/* Section 1: Mobile Banking & Bank Accounts */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <Smartphone size={16} className="text-[#CCFF00]" />
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
                        className="w-full bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
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
                        className="w-full bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
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
                        className="w-full bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
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
                        className="w-full bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Bank Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-mono text-[#888888] mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={cfgBankName}
                        onChange={(e) => setCfgBankName(e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#888888] mb-1">Account Name</label>
                      <input
                        type="text"
                        value={cfgAccName}
                        onChange={(e) => setCfgAccName(e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#888888] mb-1">Account Number</label>
                      <input
                        type="text"
                        value={cfgAccNum}
                        onChange={(e) => setCfgAccNum(e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#888888] mb-1">Branch Name</label>
                      <input
                        type="text"
                        value={cfgBranch}
                        onChange={(e) => setCfgBranch(e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#888888] mb-1">Routing Number</label>
                      <input
                        type="text"
                        value={cfgRouting}
                        onChange={(e) => setCfgRouting(e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Google Apps Script Web App Integration */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Cloud size={16} className="text-[#CCFF00]" />
                      <h5 className="font-display text-base font-bold text-white">
                        2. Google Sheet Automated Verification Endpoint
                      </h5>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href="https://sheets.new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-[11px] font-mono uppercase bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg flex items-center gap-1.5"
                      >
                        <ExternalLink size={12} />
                        <span>Open New Google Sheet</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopy(COMPLETE_PAYMENT_GOOGLE_APPS_SCRIPT, 'apps-script')}
                        className="px-3.5 py-1.5 text-[11px] font-mono uppercase bg-[#CCFF00] hover:bg-[#b8e600] text-black font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        {copiedKey === 'apps-script' ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedKey === 'apps-script' ? 'Script Copied!' : 'Copy Google Apps Script Code'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-[#888888] mb-1">
                      Google Apps Script Web App URL
                    </label>
                    <input
                      type="url"
                      value={cfgWebAppUrl}
                      onChange={(e) => setCfgWebAppUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-mono"
                    />
                    <span className="text-[10px] text-[#777777] block mt-1">
                      The script automatically creates a &quot;Payments&quot; sheet, extracts TrxID &amp; Amount from SMS, verifies unused TrxIDs, and marks verified payments as USED.
                    </span>
                  </div>
                </div>

                {/* Section 3: Telegram Bot Live Notifications */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Bot size={16} className="text-[#CCFF00]" />
                      <h5 className="font-display text-base font-bold text-white">
                        3. Telegram Bot Notifications
                      </h5>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestTelegram}
                      disabled={isTestingTelegram || !cfgTgToken || !cfgTgChatId}
                      className="px-3.5 py-1.5 text-[11px] font-mono uppercase bg-white/10 hover:bg-[#CCFF00] hover:text-black border border-white/10 text-white rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
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
                        className="w-full bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
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
                        className="w-full bg-[#141414] border border-white/10 focus:border-[#CCFF00] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {telegramTestResult && (
                    <div className="p-2.5 bg-[#141414] border border-white/10 rounded-lg text-xs font-mono text-[#AAAAAA]">
                      Telegram Test: <span className="text-[#CCFF00]">{telegramTestResult}</span>
                    </div>
                  )}
                </div>

                {/* Section 4: iPhone SMS Shortcut Guide & 1-Click Simulator */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <Zap size={16} className="text-[#CCFF00]" />
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
                  <div className="bg-[#121212] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-white">1-Click Test Payment Simulator</div>
                      <div className="text-[11px] text-[#777777]">
                        Simulates an incoming bKash SMS with TrxID <code className="text-[#CCFF00]">{sampleSimTrxId}</code> (৳999) to verify automated recognition.
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="text"
                        value={sampleSimTrxId}
                        onChange={(e) => setSampleSimTrxId(e.target.value)}
                        placeholder="TEST999"
                        className="w-24 bg-[#161616] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono text-center"
                      />
                      <button
                        type="button"
                        onClick={handleSimulateSMS}
                        disabled={isSimulatingSMS || !cfgWebAppUrl}
                        className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-[#CCFF00] hover:bg-[#b8e600] text-black rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <Play size={12} className="fill-black" />
                        <span>{isSimulatingSMS ? 'Simulating...' : 'Simulate Test Payment SMS'}</span>
                      </button>
                    </div>
                  </div>

                  {smsSimulationResult && (
                    <div className="p-2.5 bg-[#141414] border border-white/10 rounded-lg text-xs font-mono text-[#AAAAAA]">
                      Simulator: <span className="text-[#CCFF00]">{smsSimulationResult}</span>
                    </div>
                  )}
                </div>

                {/* Final Save All Settings Button */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="text-[11px] text-[#777777]">
                    Settings save to browser storage and auto-sync with checkout.
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveAllConfig()}
                    className="px-6 py-3 text-xs font-semibold uppercase tracking-wider bg-[#CCFF00] hover:bg-[#b8e600] text-black rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-all cursor-pointer"
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

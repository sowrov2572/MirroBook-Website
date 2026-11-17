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
  Bot,
  CheckCircle2,
  Zap,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { Order, ProductItem, ProductType, ProductStatus, PaymentConfig, AppUser, SheetPaymentLog, isVerifiedAdminUser } from '../types';
import {
  COMPLETE_PAYMENT_GOOGLE_APPS_SCRIPT,
  sendTelegramNotification,
  loadPaymentConfig,
  fetchBackendPaymentSmsLogs,
} from '../utils/paymentService';
import { auth } from '../utils/firebase';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onDeleteOrder: (id: string) => void;
  onApproveOrder?: (orderId: string) => Promise<{ success: boolean; message: string }>;
  onClearOrders: () => void;
  products: ProductItem[];
  onAddProduct: (product: ProductItem) => Promise<{ success: boolean; error?: string }> | void;
  onUpdateProduct: (product: ProductItem) => Promise<{ success: boolean; error?: string }> | void;
  onDeleteProduct: (id: string) => Promise<{ success: boolean; error?: string }> | void;
  onEnsureMirrorPOS?: () => Promise<void>;
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
  onApproveOrder,
  onClearOrders,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onEnsureMirrorPOS,
  onSyncProducts: _onSyncProducts,
  sheetsUrl,
  onSaveSheetsUrl,
  paymentConfig: passedPaymentConfig,
  onSavePaymentConfig,
  currentUser,
  onRefreshOrdersFromSheet: _onRefreshOrdersFromSheet,
}) => {
  const paymentConfig = passedPaymentConfig || loadPaymentConfig();
  const isOwnerVerified = isVerifiedAdminUser(currentUser);

  const [productSavedToast, setProductSavedToast] = useState<string | null>(null);
  const [productErrorToast, setProductErrorToast] = useState<string | null>(null);

  // Active Main Tab: 'orders' | 'products' | 'automation'
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'automation'>('orders');

  // Orders Sub-tab: 'orders' | 'sms_logs'
  const [ordersSubTab, setOrdersSubTab] = useState<'orders' | 'sms_logs'>('orders');
  const [sheetSmsLogs, setSheetSmsLogs] = useState<SheetPaymentLog[]>([]);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [confirmClearOrders, setConfirmClearOrders] = useState(false);

  // Orders State
  const [orderSearchTerm, setOrderSearchTerm] = useState('');

  // Products State
  const [productTypeFilter, setProductTypeFilter] = useState<'All' | ProductType>('All');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);
  const [isEnsuringMirrorPOS, setIsEnsuringMirrorPOS] = useState(false);

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
  const [formIsFree, setFormIsFree] = useState<boolean>(false);
  const [formStatus, setFormStatus] = useState<ProductStatus>('active');
  const [formThumbnail, setFormThumbnail] = useState('');
  const [formIconUrl, setFormIconUrl] = useState('');
  const [formLaunchUrl, setFormLaunchUrl] = useState('');
  const [formProtectedUrl, setFormProtectedUrl] = useState('');
  const [formFeaturesText, setFormFeaturesText] = useState('');
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
  const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null);

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

  // Auto fetch authenticated SMS Gateway payments from Vercel backend (/api/payment-sms/logs)
  const loadSmsLogsFromBackend = async (showNotice = false) => {
    if (!isOwnerVerified || !auth.currentUser) return;
    setIsSyncingAll(true);
    if (showNotice) setSyncFeedback(null);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const logs = await fetchBackendPaymentSmsLogs(idToken);
      setSheetSmsLogs(logs);
      if (showNotice) {
        setSyncFeedback(`Loaded ${logs.length} Personal bKash SMS webhook record(s) from Firestore.`);
      }
    } catch (err: unknown) {
      if (showNotice) {
        setSyncFeedback(err instanceof Error ? err.message : 'Failed to fetch SMS webhook logs.');
      }
    } finally {
      setIsSyncingAll(false);
      if (showNotice) {
        setTimeout(() => setSyncFeedback(null), 4500);
      }
    }
  };

  useEffect(() => {
    if (isOpen && isOwnerVerified && auth.currentUser) {
      loadSmsLogsFromBackend(false).catch(() => {});
    }
  }, [isOpen, isOwnerVerified]);

  // Reset view states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOrderSearchTerm('');
      setProductSearchTerm('');
      setIsFormOpen(false);
      setEditingProduct(null);
      setInlinePriceId(null);
      setTelegramTestResult(null);
      setConfigSavedToast(false);
      setSyncFeedback(null);
      setProductErrorToast(null);
      setConfirmDeleteProductId(null);
      setConfirmClearOrders(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSyncAllFromSheet = async () => {
    await loadSmsLogsFromBackend(true);
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

  // Trigger server-side Admin Approve API for Pending orders
  const handleAdminApproveClick = async (orderId: string) => {
    if (!onApproveOrder) return;
    setApprovingOrderId(orderId);
    setSyncFeedback(null);
    try {
      const res = await onApproveOrder(orderId);
      setSyncFeedback(res.message);
      setTimeout(() => setSyncFeedback(null), 5000);
    } finally {
      setApprovingOrderId(null);
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
    setFormIsFree(false);
    setFormStatus('active');
    setFormThumbnail('');
    setFormIconUrl('');
    setFormLaunchUrl('');
    setFormProtectedUrl('');
    setFormFeaturesText('');
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
    setFormIsFree(Boolean(item.isFree) || item.price === 0 || item.type === 'Free Tutorial');
    setFormStatus(item.status || 'active');
    setFormThumbnail(item.thumbnailUrl || '');
    setFormIconUrl(item.iconUrl || '');
    setFormLaunchUrl(item.launchUrl || '');
    setFormProtectedUrl(item.protectedUrl || '');
    setFormFeaturesText(Array.isArray(item.features) ? item.features.join(', ') : '');
    setFormDuration(item.duration || '');
    setFormInstructor(item.instructor || '');
    setFormPeriod(item.period || (item.type === 'Agency Package' ? '/ month' : ''));
    setFormError('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setProductErrorToast(null);

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

    const effectiveIsFree = formType === 'Free Tutorial' || formIsFree || (Number(formPrice) || 0) <= 0;
    const priceNum = effectiveIsFree ? 0 : Math.max(0, Number(formPrice) || 0);
    const computedPriceDisplay =
      priceNum === 0
        ? 'Free'
        : formType === 'Agency Package'
        ? `৳${priceNum.toLocaleString()}${formPeriod ? ' ' + formPeriod : ''}`
        : `৳${priceNum.toLocaleString()}`;

    const parsedFeatures = formFeaturesText
      .split(/[\n,]/)
      .map((f) => f.trim())
      .filter(Boolean)
      .slice(0, 15);

    setIsSavingProduct(true);
    try {
      if (editingProduct) {
        const updated: ProductItem = {
          ...editingProduct,
          type: formType,
          category: formCategory.trim(),
          title: formTitle.trim(),
          description: formDescription.trim(),
          price: priceNum,
          isFree: effectiveIsFree,
          priceDisplay: computedPriceDisplay,
          status: formStatus,
          period: formType === 'Agency Package' ? formPeriod : undefined,
          thumbnailUrl: formThumbnail.trim() || undefined,
          iconUrl: formIconUrl.trim() || undefined,
          launchUrl: formLaunchUrl.trim() || undefined,
          protectedUrl: formProtectedUrl.trim(),
          features: parsedFeatures.length > 0 ? parsedFeatures : undefined,
          duration: formDuration.trim() || undefined,
          instructor: formInstructor.trim() || undefined,
        };
        const res = await onUpdateProduct(updated);
        if (res && res.success === false) {
          setFormError(res.error || 'Failed to update product in Firestore.');
          setProductErrorToast(res.error || 'Failed to update product in Firestore.');
          return;
        }
        setProductSavedToast(`✓ "${updated.title}" updated (${updated.priceDisplay}) & synced to storefront.`);
        setTimeout(() => setProductSavedToast(null), 4500);
      } else {
        const newId = `${formType.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-6)}`;
        const created: ProductItem = {
          id: newId,
          type: formType,
          category: formCategory.trim(),
          title: formTitle.trim(),
          description: formDescription.trim(),
          price: priceNum,
          isFree: effectiveIsFree,
          priceDisplay: computedPriceDisplay,
          status: formStatus,
          period: formType === 'Agency Package' ? formPeriod : undefined,
          thumbnailUrl: formThumbnail.trim() || undefined,
          iconUrl: formIconUrl.trim() || undefined,
          launchUrl: formLaunchUrl.trim() || undefined,
          protectedUrl: formProtectedUrl.trim() || undefined,
          features: parsedFeatures.length > 0 ? parsedFeatures : undefined,
          duration: formDuration.trim() || undefined,
          instructor: formInstructor.trim() || undefined,
          createdAt: new Date().toISOString().split('T')[0],
        };
        const res = await onAddProduct(created);
        if (res && res.success === false) {
          setFormError(res.error || 'Failed to add product to Firestore.');
          setProductErrorToast(res.error || 'Failed to add product to Firestore.');
          return;
        }
        setProductSavedToast(`✓ "${created.title}" added to catalog & live on website.`);
        setTimeout(() => setProductSavedToast(null), 4500);
      }

      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product to Firestore.';
      setFormError(msg);
      setProductErrorToast(msg);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleSaveInlinePrice = async (product: ProductItem) => {
    const newPrice = parseFloat(inlinePriceValue);
    if (!isNaN(newPrice) && newPrice >= 0) {
      const isFreeVal = newPrice === 0;
      const computedPriceDisplay =
        isFreeVal
          ? 'Free'
          : product.type === 'Agency Package'
          ? `৳${newPrice.toLocaleString()}${product.period ? ' ' + product.period : ''}`
          : `৳${newPrice.toLocaleString()}`;

      setIsSavingProduct(true);
      try {
        const res = await onUpdateProduct({
          ...product,
          price: newPrice,
          isFree: isFreeVal,
          priceDisplay: computedPriceDisplay,
        });
        if (res && res.success === false) {
          setProductErrorToast(res.error || 'Failed to save updated price.');
        } else {
          setProductSavedToast(`✓ Price updated for "${product.title}" to ${computedPriceDisplay} (live on site).`);
          setTimeout(() => setProductSavedToast(null), 3500);
        }
      } catch (err: unknown) {
        setProductErrorToast(err instanceof Error ? err.message : 'Failed to save price.');
      } finally {
        setIsSavingProduct(false);
      }
    }
    setInlinePriceId(null);
  };

  const handleConfirmDeleteProduct = async (productId: string) => {
    setDeletingProductId(productId);
    setProductErrorToast(null);
    try {
      const res = await onDeleteProduct(productId);
      if (res && res.success === false) {
        setProductErrorToast(res.error || 'Failed to delete product.');
      } else {
        setProductSavedToast('✓ Item permanently removed from Firestore catalog.');
        setTimeout(() => setProductSavedToast(null), 3500);
      }
    } catch (err: unknown) {
      setProductErrorToast(err instanceof Error ? err.message : 'Failed to delete product.');
    } finally {
      setDeletingProductId(null);
      setConfirmDeleteProductId(null);
    }
  };

  const handleEnsureMirrorPOSClick = async () => {
    if (!onEnsureMirrorPOS) return;
    setIsEnsuringMirrorPOS(true);
    setProductErrorToast(null);
    try {
      await onEnsureMirrorPOS();
      setProductSavedToast('✓ MirrorPOS verified & synced in Firestore catalog.');
      setTimeout(() => setProductSavedToast(null), 3500);
    } catch (err: unknown) {
      setProductErrorToast(err instanceof Error ? err.message : 'Failed to sync MirrorPOS.');
    } finally {
      setIsEnsuringMirrorPOS(false);
    }
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
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-[#0B0D0C]/85 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col glossy-card bg-[#121614] border border-white/[0.09] rounded-2xl overflow-hidden shadow-2xl my-auto text-left">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/[0.09] bg-[#171C19] shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Shield size={14} className="text-[#B7F34A] shrink-0" />
            <span className="text-xs uppercase tracking-normal text-[#B7F34A] font-mono font-semibold truncate">
              Admin Portal
            </span>
            <span className="text-xs text-[#707A72] hidden sm:inline">/</span>
            <span className="text-xs text-[#A1AAA2] hidden sm:inline truncate">Enterprise Control Desk</span>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 sm:w-8 sm:h-8 rounded-xl hover:bg-white/10 text-[#A1AAA2] hover:text-[#F5F7F2] transition-colors flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Role-Based Access Verification Gate */}
        {!isOwnerVerified ? (
          <div className="p-6 sm:p-12 max-w-md mx-auto text-center space-y-6 overflow-y-auto">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center shadow-lg">
              <Lock size={24} />
            </div>

            <div>
              <h4 className="font-display text-2xl font-bold text-[#F5F7F2] mb-2">
                Access Denied
              </h4>
              <p className="text-xs text-[#A1AAA2] leading-relaxed">
                {currentUser?.email ? (
                  <span>
                    Current account (<strong className="text-[#F5F7F2] break-all">{currentUser.email}</strong>) does not have Studio Owner administrator permissions.
                  </span>
                ) : (
                  <span>
                    Please sign in at the dedicated Studio Owner portal (<code className="text-[#B7F34A]">/admin/login</code>) with a verified administrator Google account.
                  </span>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[44px] py-3 text-xs font-semibold uppercase tracking-normal glossy-btn-secondary rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          /* Authenticated Admin Workspace */
          <div className="flex flex-col flex-1 overflow-hidden min-w-0">
            {/* 3 Main Tabs: Orders, Manage Products, Payment & Automation Setup */}
            <div className="flex items-center justify-between px-4 sm:px-6 pt-2.5 pb-0 border-b border-white/[0.09] bg-[#171C19] shrink-0 gap-2">
              <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar min-w-0">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-3 sm:px-4 min-h-[44px] py-2.5 text-xs font-semibold uppercase tracking-normal transition-all border-b-2 cursor-pointer whitespace-nowrap shrink-0 flex items-center ${
                    activeTab === 'orders'
                      ? 'border-[#B7F34A] text-[#F5F7F2]'
                      : 'border-transparent text-[#A1AAA2] hover:text-[#F5F7F2]'
                  }`}
                >
                  <span>Orders</span>
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-[#0B0D0C] text-[#A1AAA2] rounded">
                    {orders.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-3 sm:px-4 min-h-[44px] py-2.5 text-xs font-semibold uppercase tracking-normal transition-all border-b-2 cursor-pointer whitespace-nowrap shrink-0 flex items-center ${
                    activeTab === 'products'
                      ? 'border-[#B7F34A] text-[#F5F7F2]'
                      : 'border-transparent text-[#A1AAA2] hover:text-[#F5F7F2]'
                  }`}
                >
                  <span>Manage Products</span>
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-[#0B0D0C] text-[#A1AAA2] rounded">
                    {products.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('automation')}
                  className={`px-3 sm:px-4 min-h-[44px] py-2.5 text-xs font-semibold uppercase tracking-normal transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    activeTab === 'automation'
                      ? 'border-[#B7F34A] text-[#F5F7F2]'
                      : 'border-transparent text-[#A1AAA2] hover:text-[#F5F7F2]'
                  }`}
                >
                  <Settings size={13} className={activeTab === 'automation' ? 'text-[#B7F34A]' : ''} />
                  <span>Payment &amp; Automation Setup</span>
                </button>
              </div>

              <span className="hidden sm:inline-flex shrink-0 px-3 py-1 text-[10px] font-mono uppercase tracking-normal bg-[#B7F34A]/15 text-[#B7F34A] border border-[#B7F34A]/30 rounded-lg mb-2">
                Verified Admin
              </span>
            </div>

            {/* TAB 1: ORDERS & INCOMING PAYMENTS */}
            {activeTab === 'orders' && (
              <div className="p-4 sm:p-6 md:p-8 space-y-6 overflow-y-auto overscroll-contain flex-1 min-w-0">
                {/* Metrics Summary Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#171C19] border border-white/[0.09] rounded-xl p-3.5">
                    <span className="text-[10px] text-[#A1AAA2] uppercase font-mono block">Customer Orders</span>
                    <span className="text-xl font-display font-bold text-[#F5F7F2] tabular-nums">{orders.length}</span>
                  </div>
                  <div className="bg-[#171C19] border border-white/[0.09] rounded-xl p-3.5">
                    <span className="text-[10px] text-[#A1AAA2] uppercase font-mono block">Estimated Revenue</span>
                    <span className="text-xl font-display font-bold text-[#B7F34A] tabular-nums">
                      ৳{orders.reduce((sum, o) => {
                        const sanitized = (o.itemPrice || '').replace(/,/g, '');
                        const m = sanitized.match(/\d+(?:\.\d+)?/);
                        return sum + (m ? parseFloat(m[0]) : 0);
                      }, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-[#171C19] border border-white/[0.09] rounded-xl p-3.5">
                    <span className="text-[10px] text-[#A1AAA2] uppercase font-mono block">Verified / Completed</span>
                    <span className="text-xl font-display font-bold text-[#F5F7F2] tabular-nums">
                      {orders.filter((o) => o.status === 'Verified' || o.status === 'Completed' || o.status === 'Paid').length}
                    </span>
                  </div>
                  <div className="bg-[#171C19] border border-white/[0.09] rounded-xl p-3.5">
                    <span className="text-[10px] text-[#A1AAA2] uppercase font-mono block">SMS Gateway Logs</span>
                    <span className="text-xl font-display font-bold text-yellow-400 tabular-nums">
                      {sheetSmsLogs.length}
                    </span>
                  </div>
                </div>

                {/* Sub-tab Navigation and Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.09]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOrdersSubTab('orders')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        ordersSubTab === 'orders'
                          ? 'bg-[#B7F34A] text-black shadow-sm'
                          : 'bg-[#171C19] text-[#A1AAA2] hover:text-[#F5F7F2]'
                      }`}
                    >
                      <span>Customer Purchases ({filteredOrders.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrdersSubTab('sms_logs')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        ordersSubTab === 'sms_logs'
                          ? 'bg-[#B7F34A] text-black shadow-sm'
                          : 'bg-[#171C19] text-[#A1AAA2] hover:text-[#F5F7F2]'
                      }`}
                    >
                      <Smartphone size={12} />
                      <span>iPhone SMS Payments ({sheetSmsLogs.length})</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Refresh Backend SMS Logs Button */}
                    <button
                      type="button"
                      onClick={handleSyncAllFromSheet}
                      disabled={isSyncingAll}
                      className="px-3 py-1.5 text-xs font-medium uppercase tracking-normal bg-[#171C19] border border-white/[0.09] hover:border-[#B7F34A] text-[#F5F7F2] rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
                      title="Refresh incoming bKash SMS webhook logs from Firestore"
                    >
                      <RefreshCw size={12} className={isSyncingAll ? 'animate-spin text-[#B7F34A]' : 'text-[#B7F34A]'} />
                      <span>{isSyncingAll ? 'Refreshing...' : 'Refresh SMS Logs'}</span>
                    </button>

                    {/* Open Google Sheet Link */}
                    {(cfgSpreadsheetUrl || cfgWebAppUrl) && (
                      <a
                        href={cfgSpreadsheetUrl || 'https://sheets.google.com'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium uppercase tracking-normal bg-[#171C19] hover:bg-white/10 border border-white/[0.09] text-[#F5F7F2] rounded-lg flex items-center gap-1.5 transition-colors"
                        title="Open connected Google Sheet database in Google Drive"
                      >
                        <ExternalLink size={12} className="text-[#B7F34A]" />
                        <span>Open Sheet in Drive</span>
                      </a>
                    )}

                    <button
                      onClick={exportCSV}
                      disabled={orders.length === 0}
                      className="px-3 py-1.5 text-xs font-medium uppercase tracking-normal bg-[#171C19] border border-white/[0.09] hover:border-[#B7F34A] rounded-lg text-[#F5F7F2] disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={12} />
                      <span>CSV</span>
                    </button>

                    {!confirmClearOrders ? (
                      <button
                        type="button"
                        onClick={() => setConfirmClearOrders(true)}
                        disabled={orders.length === 0}
                        className="px-3 py-1.5 min-h-[36px] text-xs font-medium uppercase tracking-normal bg-[#171C19] border border-red-950 text-red-400 hover:bg-red-950/30 rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 size={12} />
                        <span>Clear</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-700/60 px-2.5 py-1 rounded-lg">
                        <span className="text-[11px] text-red-200 font-medium">Clear list?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onClearOrders();
                            setConfirmClearOrders(false);
                          }}
                          className="px-2 py-1 text-[10px] font-bold bg-red-500 text-white rounded cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearOrders(false)}
                          className="px-2 py-1 text-[10px] text-[#A1AAA2] hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sync Feedback Toast */}
                {syncFeedback && (
                  <div className="p-3 bg-[#B7F34A]/10 border border-[#B7F34A]/30 rounded-xl text-xs text-[#B7F34A] flex items-center justify-between animate-in fade-in">
                    <span>{syncFeedback}</span>
                    <button type="button" onClick={() => setSyncFeedback(null)} className="text-[#A1AAA2] hover:text-[#F5F7F2] cursor-pointer">
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* SUB-VIEW 1: CUSTOMER ORDERS */}
                {ordersSubTab === 'orders' ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="relative flex-1 sm:max-w-sm w-full">
                        <Search
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707A72]"
                        />
                        <input
                          type="text"
                          value={orderSearchTerm}
                          onChange={(e) => setOrderSearchTerm(e.target.value)}
                          placeholder="Search phone, customer name, email, TrxID..."
                          className="bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl pl-9 pr-4 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none w-full transition-colors"
                        />
                      </div>
                      <span className="text-xs text-[#707A72] font-mono tabular-nums">
                        Showing {filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="border border-white/[0.09] rounded-xl overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-[#171C19] border-b border-white/[0.09] uppercase tracking-normal font-mono text-[#A1AAA2]">
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
                        <tbody className="divide-y divide-white/[0.06]">
                          {filteredOrders.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-12 text-center text-[#707A72]">
                                No customer orders recorded yet. When a visitor places an order, their payment and customer details will appear here and sync to your Google Sheet.
                              </td>
                            </tr>
                          ) : (
                            filteredOrders.map((order) => {
                              const cleanPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');
                              return (
                                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="py-3 px-4 font-mono font-semibold text-[#B7F34A]">
                                    {order.id}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                        order.status === 'Verified' || order.status === 'Completed' || order.status === 'Paid'
                                          ? 'bg-[#B7F34A]/15 text-[#B7F34A] border border-[#B7F34A]/30'
                                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                      }`}
                                    >
                                      {order.status || 'Pending'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-semibold text-[#F5F7F2]">{order.customerName}</div>
                                    <div className="text-[11px] text-[#A1AAA2]">{order.customerEmail}</div>
                                    <div className="flex items-center gap-2 pt-0.5">
                                      <span className="text-[11px] text-[#B7F34A] font-mono font-semibold">
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
                                  <td className="py-3 px-4 text-[#F5F7F2] font-medium max-w-[180px] truncate">
                                    {order.itemName}
                                  </td>
                                  <td className="py-3 px-4 font-mono font-bold text-[#F5F7F2] tabular-nums">
                                    {order.itemPrice}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="font-mono text-[#F5F7F2] block">{order.paymentMethod}</span>
                                    <span className="text-[10px] text-[#A1AAA2] font-mono block">
                                      Sender: {order.senderAccount || order.customerPhone}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-1 font-mono font-bold text-[#B7F34A]">
                                      <span>{order.trxId}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopy(order.trxId, `trx_${order.id}`)}
                                        className="text-[#707A72] hover:text-[#F5F7F2] cursor-pointer"
                                        title="Copy TrxID"
                                      >
                                        {copiedKey === `trx_${order.id}` ? <Check size={11} className="text-[#B7F34A]" /> : <Copy size={11} />}
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-[#707A72] font-mono">{order.createdAt}</td>
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {order.status === 'Pending' && onApproveOrder && (
                                        <button
                                          type="button"
                                          disabled={approvingOrderId === order.id}
                                          onClick={() => handleAdminApproveClick(order.id)}
                                          className="px-2.5 py-1 text-[10px] font-bold uppercase glossy-btn rounded transition-colors cursor-pointer disabled:opacity-50"
                                          title="Approve order & release product via Admin API"
                                        >
                                          {approvingOrderId === order.id ? 'Approving...' : 'Approve'}
                                        </button>
                                      )}
                                      <button
                                        onClick={() => onDeleteOrder(order.id)}
                                        className="p-1.5 text-[#707A72] hover:text-red-400 hover:bg-red-950/20 rounded transition-colors cursor-pointer"
                                        title="Delete Order"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
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
                        <strong className="text-[#F5F7F2] block mb-0.5">Protected Personal bKash SMS Webhook Feed:</strong>
                        Incoming Personal bKash SMS notifications forwarded by your iPhone Shortcut to{' '}
                        <code className="text-[#B7F34A]">POST /api/payment-sms/receive</code> appear below from Firestore.
                      </div>
                    </div>

                    <div className="border border-white/[0.09] rounded-xl overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-[#171C19] border-b border-white/[0.09] uppercase tracking-normal font-mono text-[#A1AAA2]">
                          <tr>
                            <th className="py-3 px-4 font-normal">Timestamp</th>
                            <th className="py-3 px-4 font-normal">Gateway / Type</th>
                            <th className="py-3 px-4 font-normal">TrxID</th>
                            <th className="py-3 px-4 font-normal">Amount</th>
                            <th className="py-3 px-4 font-normal">Sender Phone</th>
                            <th className="py-3 px-4 font-normal text-right">Usage Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06]">
                          {sheetSmsLogs.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-[#707A72]">
                                No SMS webhook events recorded yet. Forward an incoming bKash SMS from iPhone Shortcuts or click &quot;Refresh SMS Logs&quot;.
                              </td>
                            </tr>
                          ) : (
                            sheetSmsLogs.map((log, idx) => (
                              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 px-4 font-mono text-[#A1AAA2]">{log.timestamp}</td>
                                <td className="py-3 px-4">
                                  <span className="font-semibold text-[#F5F7F2] px-2 py-0.5 rounded bg-white/5">
                                    {log.gateway} {log.transactionType ? `• ${log.transactionType}` : ''}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-[#B7F34A]">
                                  {log.trxId}
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-[#F5F7F2] tabular-nums">
                                  ৳{log.amount.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 font-mono text-[#A1AAA2]">{log.sender}</td>
                                <td className="py-3 px-4 text-right">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                      log.status === 'USED'
                                        ? 'bg-white/10 text-[#A1AAA2]'
                                        : 'bg-[#B7F34A]/15 text-[#B7F34A] border border-[#B7F34A]/30 font-bold'
                                    }`}
                                  >
                                    {log.status || 'UNUSED'}
                                    {log.usedByOrderId ? ` (${log.usedByOrderId})` : ''}
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
              <div className="p-4 sm:p-6 md:p-8 space-y-6 overflow-y-auto overscroll-contain flex-1 min-w-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.09]">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:flex-wrap pb-1 sm:pb-0">
                    {(['All', 'Plugin', 'Software', 'Course', 'Free Tutorial', 'Agency Package'] as const).map(
                      (type) => (
                        <button
                          key={type}
                          onClick={() => setProductTypeFilter(type)}
                          className={`px-3 py-1.5 min-h-[36px] text-xs font-medium tracking-wide rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                            productTypeFilter === type
                              ? 'bg-[#B7F34A] text-black font-semibold'
                              : 'bg-[#171C19] text-[#A1AAA2] hover:text-[#F5F7F2] border border-white/[0.09]'
                          }`}
                        >
                          {type}
                        </button>
                      )
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full lg:w-auto">
                    <div className="relative w-full sm:w-56">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707A72]"
                      />
                      <input
                        type="text"
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        placeholder="Search products..."
                        className="bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl pl-9 pr-4 py-2 sm:py-1.5 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none w-full transition-colors"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {onEnsureMirrorPOS && (
                        <button
                          type="button"
                          onClick={handleEnsureMirrorPOSClick}
                          disabled={isEnsuringMirrorPOS}
                          className="px-3.5 py-2 min-h-[40px] text-xs font-semibold glossy-btn-secondary rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                          title="Ensure MirrorPOS is present and synced in Firestore /products"
                        >
                          <RefreshCw size={13} className={isEnsuringMirrorPOS ? 'animate-spin text-[#B7F34A]' : 'text-[#B7F34A]'} />
                          <span>{isEnsuringMirrorPOS ? 'Syncing...' : 'Ensure MirrorPOS'}</span>
                        </button>
                      )}

                      <button
                        onClick={openAddForm}
                        className="px-4 py-2 min-h-[40px] text-xs font-semibold uppercase tracking-normal glossy-btn rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus size={14} />
                        <span>Add New Item</span>
                      </button>
                    </div>
                  </div>
                </div>

                {productSavedToast && (
                  <div className="p-3 bg-[#B7F34A]/15 border border-[#B7F34A]/40 rounded-xl text-xs text-[#B7F34A] flex items-center justify-between gap-2 font-medium shadow-[0_0_15px_rgba(183,243,74,0.15)]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#B7F34A] shrink-0" />
                      <span>{productSavedToast}</span>
                    </div>
                    <button type="button" onClick={() => setProductSavedToast(null)} className="text-[#A1AAA2] hover:text-white cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {productErrorToast && (
                  <div className="p-3 bg-red-950/50 border border-red-700/70 rounded-xl text-xs text-red-200 flex items-center justify-between gap-2 font-medium">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-400 shrink-0" />
                      <span>{productErrorToast}</span>
                    </div>
                    <button type="button" onClick={() => setProductErrorToast(null)} className="text-red-300 hover:text-white cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {isFormOpen && (
                  <div className="bg-[#171C19] border border-white/[0.09] rounded-2xl p-4 sm:p-6 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.09]">
                      <span className="text-xs uppercase tracking-normal text-[#B7F34A] font-mono font-semibold">
                        {editingProduct ? `Update Product (${editingProduct.id})` : 'Add New Item to Firestore'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A1AAA2] hover:text-[#F5F7F2] cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {formError && (
                      <div className="p-3 bg-red-950/40 border border-red-800/70 text-xs text-red-300 rounded-xl flex items-center gap-2">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                            Item Type *
                          </label>
                          <select
                            value={formType}
                            onChange={(e) => {
                              const nextType = e.target.value as ProductType;
                              setFormType(nextType);
                              if (nextType === 'Free Tutorial') {
                                setFormIsFree(true);
                                setFormPrice(0);
                              }
                            }}
                            className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] focus:outline-none"
                          >
                            <option value="Plugin">Plugin</option>
                            <option value="Software">Software</option>
                            <option value="Course">Course</option>
                            <option value="Free Tutorial">Free Tutorial</option>
                            <option value="Agency Package">Agency Package</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                            Software / Category Tag *
                          </label>
                          <input
                            type="text"
                            required
                            value={formCategory}
                            onChange={(e) => setFormCategory(e.target.value)}
                            placeholder="e.g. Premiere Pro, PC & Mac"
                            className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                            Price in BDT * (0 for Free)
                          </label>
                          <div className="space-y-1.5">
                            <input
                              type="number"
                              min={0}
                              disabled={formType === 'Free Tutorial' || formIsFree}
                              value={formType === 'Free Tutorial' || formIsFree ? 0 : formPrice}
                              onChange={(e) => setFormPrice(Number(e.target.value))}
                              className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] focus:outline-none disabled:opacity-50"
                            />
                            <label className="inline-flex items-center gap-2 text-[11px] text-[#A1AAA2] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formType === 'Free Tutorial' || formIsFree}
                                disabled={formType === 'Free Tutorial'}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setFormIsFree(checked);
                                  if (checked) setFormPrice(0);
                                }}
                                className="accent-[#B7F34A]"
                              />
                              <span>Free Product (isFree)</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                            Visibility Status
                          </label>
                          <select
                            value={formStatus}
                            onChange={(e) => setFormStatus(e.target.value as ProductStatus)}
                            className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] focus:outline-none"
                          >
                            <option value="active">Active (Live on Site)</option>
                            <option value="draft">Draft (Hidden from Public)</option>
                            <option value="archived">Archived (Hidden)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                            Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="e.g. AI AutoCut Plugin"
                            className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                            Short Description *
                          </label>
                          <input
                            type="text"
                            required
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="Briefly describe item scope"
                            className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                            Thumbnail Image URL (Optional)
                          </label>
                          <input
                            type="url"
                            value={formThumbnail}
                            onChange={(e) => setFormThumbnail(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-[#B7F34A] mb-1 flex items-center gap-1.5">
                            <Shield size={12} />
                            <span>Protected Download / Access URL</span>
                          </label>
                          <input
                            type="text"
                            value={formProtectedUrl}
                            onChange={(e) => setFormProtectedUrl(e.target.value)}
                            placeholder="Google Drive or YouTube link (stored securely)"
                            className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                            App Icon URL (Optional, e.g. Software Icon)
                          </label>
                          <input
                            type="text"
                            value={formIconUrl}
                            onChange={(e) => setFormIconUrl(e.target.value)}
                            placeholder="/mirror-pos-icon.png or https://..."
                            className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                            Launch / Web App URL (Optional)
                          </label>
                          <input
                            type="text"
                            value={formLaunchUrl}
                            onChange={(e) => setFormLaunchUrl(e.target.value)}
                            placeholder="https://mirror-pos.vercel.app/"
                            className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      {(formType === 'Free Tutorial' || formType === 'Course') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                              Duration (Optional)
                            </label>
                            <input
                              type="text"
                              value={formDuration}
                              onChange={(e) => setFormDuration(e.target.value)}
                              placeholder="e.g. 24:15 or 12 Hours"
                              className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                              Instructor (Optional)
                            </label>
                            <input
                              type="text"
                              value={formInstructor}
                              onChange={(e) => setFormInstructor(e.target.value)}
                              placeholder="e.g. Sowrov Hosen"
                              className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                          Key Features (comma-separated, optional)
                        </label>
                        <input
                          type="text"
                          value={formFeaturesText}
                          onChange={(e) => setFormFeaturesText(e.target.value)}
                          placeholder="e.g. Offline billing, Cloud backup sync, Barcode support"
                          className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={isSavingProduct}
                          className="px-6 min-h-[44px] py-2.5 text-xs font-semibold uppercase tracking-normal glossy-btn rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          {isSavingProduct
                            ? 'Saving to Firestore...'
                            : editingProduct
                            ? 'Save Changes'
                            : 'Add Item'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsFormOpen(false)}
                          className="px-4 min-h-[44px] py-2.5 text-xs font-medium uppercase tracking-normal glossy-btn-secondary rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="border border-white/[0.09] rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#171C19] border-b border-white/[0.09] uppercase tracking-normal font-mono text-[#A1AAA2]">
                      <tr>
                        <th className="py-3 px-4 font-normal">Type &amp; Status</th>
                        <th className="py-3 px-4 font-normal">Tag</th>
                        <th className="py-3 px-4 font-normal">Title</th>
                        <th className="py-3 px-4 font-normal">Price</th>
                        <th className="py-3 px-4 font-normal">Protected URL</th>
                        <th className="py-3 px-4 font-normal text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-[#707A72]">
                            No products found in Firestore matching the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product) => {
                          const isEditingPrice = inlinePriceId === product.id;
                          const isUrlVisible = visibleProtectedUrls[product.id];
                          const isConfirmingDelete = confirmDeleteProductId === product.id;
                          const isDeletingThis = deletingProductId === product.id;
                          const effectiveFree = Boolean(product.isFree) || product.price === 0;

                          return (
                            <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-4 font-mono text-[#F5F7F2] text-[11px]">
                                <div>{product.type}</div>
                                <span
                                  className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] uppercase ${
                                    product.status === 'draft'
                                      ? 'bg-yellow-500/15 text-yellow-300'
                                      : product.status === 'archived'
                                      ? 'bg-red-500/15 text-red-300'
                                      : 'bg-[#B7F34A]/15 text-[#B7F34A]'
                                  }`}
                                >
                                  {product.status || 'active'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs font-mono text-[#B7F34A]">{product.category}</td>
                              <td className="py-3 px-4 max-w-xs truncate">
                                <div className="font-semibold text-[#F5F7F2]">{product.title}</div>
                                <div className="text-[11px] text-[#707A72] truncate">{product.description}</div>
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
                                      className="w-20 bg-[#0B0D0C] border border-[#B7F34A] px-2 py-1 text-base sm:text-xs text-[#F5F7F2] focus:outline-none font-mono rounded"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveInlinePrice(product)}
                                      className="p-1 text-[#B7F34A] cursor-pointer"
                                    >
                                      <Check size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setInlinePriceId(null)}
                                      className="p-1 text-[#A1AAA2] cursor-pointer"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 group">
                                    <span className="font-mono font-bold text-[#F5F7F2] tabular-nums">
                                      {effectiveFree ? 'Free' : `৳${product.price.toLocaleString()}`}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setInlinePriceId(product.id);
                                        setInlinePriceValue(product.price.toString());
                                      }}
                                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-[#707A72] hover:text-[#B7F34A] cursor-pointer"
                                      title="Edit price inline"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {product.protectedUrl ? (
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] text-[#A1AAA2] max-w-[130px] truncate">
                                      {isUrlVisible ? product.protectedUrl : '••••••••••••••••'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => toggleProtectedUrlVisibility(product.id)}
                                      className="p-1 text-[#A1AAA2] hover:text-[#F5F7F2] cursor-pointer"
                                    >
                                      {isUrlVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(product.protectedUrl || '', `url-${product.id}`)}
                                      className="p-1 text-[#A1AAA2] hover:text-[#B7F34A] cursor-pointer"
                                    >
                                      {copiedKey === `url-${product.id}` ? <Check size={13} className="text-[#B7F34A]" /> : <Copy size={13} />}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[#707A72] text-[11px] font-mono">None set</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {isConfirmingDelete ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      disabled={isDeletingThis}
                                      onClick={() => handleConfirmDeleteProduct(product.id)}
                                      className="px-2.5 py-1 text-[10px] font-bold bg-red-500 text-white rounded cursor-pointer disabled:opacity-50"
                                    >
                                      {isDeletingThis ? 'Deleting...' : 'Confirm'}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isDeletingThis}
                                      onClick={() => setConfirmDeleteProductId(null)}
                                      className="px-2 py-1 text-[10px] bg-white/10 text-[#F5F7F2] rounded cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openEditForm(product)}
                                      className="p-1.5 text-[#A1AAA2] hover:text-[#F5F7F2] hover:bg-white/5 rounded cursor-pointer"
                                      title="Edit Product"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteProductId(product.id)}
                                      className="p-1.5 text-[#707A72] hover:text-red-400 hover:bg-red-950/20 rounded cursor-pointer"
                                      title="Delete Product"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: NO-CODE PAYMENT & AUTOMATION SETUP WIZARD */}
            {activeTab === 'automation' && (
              <div className="p-4 sm:p-6 md:p-8 space-y-8 overflow-y-auto overscroll-contain flex-1 min-w-0">
                {/* Save Success Toast Banner */}
                {configSavedToast && (
                  <div className="p-3 bg-[#B7F34A]/10 border border-[#B7F34A] rounded-xl text-xs text-[#B7F34A] flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Payment configuration &amp; endpoints saved successfully.</span>
                  </div>
                )}

                {/* Section 1: Mobile Banking & Bank Accounts */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/[0.09] pb-2">
                    <Smartphone size={16} className="text-[#B7F34A] shrink-0" />
                    <h5 className="font-display text-base font-bold text-[#F5F7F2]">
                      1. Payment Numbers &amp; Account Details
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                        bKash Personal
                      </label>
                      <input
                        type="text"
                        value={cfgBkash}
                        onChange={(e) => setCfgBkash(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                        Nagad Personal
                      </label>
                      <input
                        type="text"
                        value={cfgNagad}
                        onChange={(e) => setCfgNagad(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                        Rocket Personal
                      </label>
                      <input
                        type="text"
                        value={cfgRocket}
                        onChange={(e) => setCfgRocket(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                        Upay Personal
                      </label>
                      <input
                        type="text"
                        value={cfgUpay}
                        onChange={(e) => setCfgUpay(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Primary Bank Details Grid (IBBL) */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-mono text-[#B7F34A] font-semibold block">
                      Primary Bank (IBBL)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-[#A1AAA2] mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={cfgBankName}
                          onChange={(e) => setCfgBankName(e.target.value)}
                          className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-2.5 py-2 sm:py-1.5 text-base sm:text-xs text-[#F5F7F2] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#A1AAA2] mb-1">Account Name</label>
                        <input
                          type="text"
                          value={cfgAccName}
                          onChange={(e) => setCfgAccName(e.target.value)}
                          className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-2.5 py-2 sm:py-1.5 text-base sm:text-xs text-[#F5F7F2] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#A1AAA2] mb-1">Account Number</label>
                        <input
                          type="text"
                          value={cfgAccNum}
                          onChange={(e) => setCfgAccNum(e.target.value)}
                          className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-2.5 py-2 sm:py-1.5 text-base sm:text-xs text-[#F5F7F2] focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#A1AAA2] mb-1">Branch Name</label>
                        <input
                          type="text"
                          value={cfgBranch}
                          onChange={(e) => setCfgBranch(e.target.value)}
                          className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-2.5 py-2 sm:py-1.5 text-base sm:text-xs text-[#F5F7F2] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#A1AAA2] mb-1">Routing Number</label>
                        <input
                          type="text"
                          value={cfgRouting}
                          onChange={(e) => setCfgRouting(e.target.value)}
                          className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-2.5 py-2 sm:py-1.5 text-base sm:text-xs text-[#F5F7F2] focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Secondary Bank Details Grid (DBBL) */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-mono text-[#A1AAA2] font-semibold block">
                      Secondary Bank (DBBL)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-[#A1AAA2] mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={cfgBankName2}
                          onChange={(e) => setCfgBankName2(e.target.value)}
                          className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-2.5 py-2 sm:py-1.5 text-base sm:text-xs text-[#F5F7F2] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#A1AAA2] mb-1">Account Name</label>
                        <input
                          type="text"
                          value={cfgAccName2}
                          onChange={(e) => setCfgAccName2(e.target.value)}
                          className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-2.5 py-2 sm:py-1.5 text-base sm:text-xs text-[#F5F7F2] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#A1AAA2] mb-1">Account Number</label>
                        <input
                          type="text"
                          value={cfgAccNum2}
                          onChange={(e) => setCfgAccNum2(e.target.value)}
                          className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-2.5 py-2 sm:py-1.5 text-base sm:text-xs text-[#F5F7F2] focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#A1AAA2] mb-1">Branch Name</label>
                        <input
                          type="text"
                          value={cfgBranch2}
                          onChange={(e) => setCfgBranch2(e.target.value)}
                          className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-2.5 py-2 sm:py-1.5 text-base sm:text-xs text-[#F5F7F2] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#A1AAA2] mb-1">Routing Number</label>
                        <input
                          type="text"
                          value={cfgRouting2}
                          onChange={(e) => setCfgRouting2(e.target.value)}
                          className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-lg px-2.5 py-2 sm:py-1.5 text-base sm:text-xs text-[#F5F7F2] focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Google Sheet & Google Apps Script Web App Integration */}
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/[0.09] pb-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Cloud size={16} className="text-[#B7F34A] shrink-0" />
                      <div>
                        <h5 className="font-display text-base font-bold text-[#F5F7F2]">
                          2. Google Sheet &amp; Automated Verification Endpoint
                        </h5>
                        <p className="text-[11px] text-[#A1AAA2]">
                          গুগল শিট ডাটাবেজ, আইফোন অটোমেশন ও ড্রাইভ অটো-লাইসেন্স এক্সেস
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href="https://sheets.new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-[11px] font-mono uppercase glossy-btn-secondary rounded-lg flex items-center gap-1.5"
                      >
                        <ExternalLink size={12} />
                        <span>Create New Sheet</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopy(COMPLETE_PAYMENT_GOOGLE_APPS_SCRIPT, 'apps-script')}
                        className="px-3.5 py-1.5 text-[11px] font-mono uppercase glossy-btn font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedKey === 'apps-script' ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedKey === 'apps-script' ? 'Script Copied!' : 'Copy Apps Script Code'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Direct Google Sheet Spreadsheet Link */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <label className="block text-[11px] font-mono text-[#A1AAA2]">
                        Google Sheet Spreadsheet URL (Google Drive Sheet Link)
                      </label>
                      {cfgSpreadsheetUrl && (
                        <a
                          href={cfgSpreadsheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#B7F34A] hover:underline flex items-center gap-1"
                        >
                          <ExternalLink size={11} />
                          <span>Open in Google Drive Now</span>
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={cfgSpreadsheetUrl}
                        onChange={(e) => setCfgSpreadsheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                        className="flex-1 bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none font-mono"
                      />
                      {cfgSpreadsheetUrl && (
                        <a
                          href={cfgSpreadsheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2.5 sm:py-2 glossy-btn-secondary rounded-xl text-xs font-semibold flex items-center justify-center gap-1 shrink-0"
                        >
                          <ExternalLink size={12} className="text-[#B7F34A]" />
                          <span>Open Sheet</span>
                        </a>
                      )}
                    </div>
                    <span className="text-[10px] text-[#707A72] block mt-1">
                      আপনার গুগল শিটের লিঙ্কটি এখানে পেস্ট করে Save Settings দিন। তাহলে উপরে থাকা &apos;Open Sheet in Drive&apos; বাটনে ক্লিক করলেই সরাসরি আপনার গুগল শিট ওপেন হবে।
                    </span>
                  </div>

                  {/* Web App URL */}
                  <div>
                    <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                      Google Apps Script Web App URL (Endpoint)
                    </label>
                    <input
                      type="url"
                      value={cfgWebAppUrl}
                      onChange={(e) => setCfgWebAppUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none font-mono"
                    />
                    <span className="text-[10px] text-[#707A72] block mt-1">
                      The script automatically creates &quot;Orders&quot;, &quot;Payments&quot;, and &quot;Users&quot; sheets, extracts TrxID &amp; Amount from SMS, and auto-shares Google Drive downloads with buyers.
                    </span>
                  </div>

                  {/* Quick Setup Instructions Box */}
                  <div className="p-3.5 bg-[#171C19] border border-white/[0.09] rounded-xl space-y-2 text-xs">
                    <span className="font-semibold text-[#F5F7F2] block">গুগল শিট সেটআপ করার সহজ ৩ ধাপ:</span>
                    <ol className="list-decimal list-inside space-y-1 text-[#A1AAA2] text-[11px] leading-relaxed">
                      <li>উপরের <span className="text-[#F5F7F2] font-mono">Create New Sheet</span> বাটনে ক্লিক করে একটি নতুন গুগল শিট খুলুন এবং এর লিঙ্কটি উপরের বক্সে পেস্ট করুন।</li>
                      <li>গুগল শিটের মেনু থেকে <span className="text-[#F5F7F2] font-mono">Extensions &gt; Apps Script</span> এ যান এবং পুরো কোড মুছে <span className="text-[#F5F7F2] font-mono">Copy Apps Script Code</span> বাটনের কোডটি পেস্ট করুন।</li>
                      <li>উপরে <span className="text-[#F5F7F2] font-mono">Deploy &gt; New deployment &gt; Web app</span> সিলেক্ট করে <span className="text-[#F5F7F2] font-mono">Who has access: Anyone</span> দিয়ে Deploy করুন এবং পাওয়া Web App URL টি উপরের বক্সে বসিয়ে <span className="text-[#B7F34A] font-semibold">Save Settings</span> বাটনে চাপ দিন।</li>
                    </ol>
                  </div>
                </div>

                {/* Section 3: Telegram Bot Live Notifications */}
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.09] pb-2">
                    <div className="flex items-center gap-2">
                      <Bot size={16} className="text-[#B7F34A] shrink-0" />
                      <h5 className="font-display text-base font-bold text-[#F5F7F2]">
                        3. Telegram Bot Notifications
                      </h5>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestTelegram}
                      disabled={isTestingTelegram || !cfgTgToken || !cfgTgChatId}
                      className="px-3.5 py-2 sm:py-1.5 text-[11px] font-mono uppercase bg-[#171C19] hover:bg-[#B7F34A] hover:text-black border border-white/[0.09] text-[#F5F7F2] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors self-start sm:self-auto"
                    >
                      <Send size={12} />
                      <span>{isTestingTelegram ? 'Sending...' : 'Test Telegram Notification'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                        Telegram Bot Token
                      </label>
                      <input
                        type="text"
                        value={cfgTgToken}
                        onChange={(e) => setCfgTgToken(e.target.value)}
                        placeholder="e.g. 7123456789:AAHq_..."
                        className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-[#A1AAA2] mb-1">
                        Telegram Chat ID
                      </label>
                      <input
                        type="text"
                        value={cfgTgChatId}
                        onChange={(e) => setCfgTgChatId(e.target.value)}
                        placeholder="e.g. 987654321 or -100..."
                        className="w-full bg-[#0B0D0C] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {telegramTestResult && (
                    <div className="p-2.5 bg-[#171C19] border border-white/[0.09] rounded-lg text-xs font-mono text-[#A1AAA2] break-words">
                      Telegram Test: <span className="text-[#B7F34A]">{telegramTestResult}</span>
                    </div>
                  )}
                </div>

                {/* Section 4: Secure iPhone SMS Shortcut Setup */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 border-b border-white/[0.09] pb-2">
                    <Zap size={16} className="text-[#B7F34A] shrink-0" />
                    <h5 className="font-display text-base font-bold text-[#F5F7F2]">
                      4. iPhone Shortcuts Secure Webhook Setup
                    </h5>
                  </div>

                  <div className="bg-[#171C19] border border-white/[0.09] rounded-xl p-4 text-xs space-y-2.5 text-[#A1AAA2]">
                    <div className="font-semibold text-[#F5F7F2]">Secure Personal bKash Automation (Vercel Serverless Endpoint):</div>
                    <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed">
                      <li>Open <strong>Shortcuts</strong> on iPhone &gt; <strong>Automation</strong> &gt; <strong>New Automation</strong> &gt; <strong>Message</strong>.</li>
                      <li>Set Sender / Contains filter (e.g., <code>bKash</code> or <code>TrxID</code>) &gt; select <strong>Run Immediately</strong>.</li>
                      <li>Add <strong>Get Contents of URL</strong> with URL: <code className="text-[#B7F34A] break-all">https://mirrorbook.site/api/payment-sms/receive</code>.</li>
                      <li>Set Method to <strong>POST</strong>, and add Header <code className="text-[#F5F7F2]">x-webhook-secret</code> matching your Vercel <code className="text-[#B7F34A]">PAYMENT_SMS_WEBHOOK_SECRET</code> env var.</li>
                      <li>Set Request Body to <strong>JSON</strong> with key <code className="text-[#F5F7F2]">text</code> = <strong>Shortcut Input</strong> (plus optional <code className="text-[#F5F7F2]">sender</code>).</li>
                    </ol>
                  </div>
                </div>

                {/* Section 5: Anti-Piracy Protection for Google Drive Downloads */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 border-b border-white/[0.09] pb-2">
                    <ShieldCheck size={16} className="text-[#B7F34A] shrink-0" />
                    <h5 className="font-display text-base font-bold text-[#F5F7F2]">
                      5. Anti-Piracy Protection (Google Drive Restricted Sharing)
                    </h5>
                  </div>

                  <div className="bg-[#171C19] border border-[#B7F34A]/30 rounded-xl p-4 text-xs space-y-3">
                    <div className="flex items-center gap-2 text-[#F5F7F2] font-semibold">
                      <ShieldCheck size={14} className="text-[#B7F34A] shrink-0" />
                      <span>How to prevent customers from sharing download links with others:</span>
                    </div>

                    <div className="text-[11px] text-[#A1AAA2] space-y-2 leading-relaxed">
                      <p>
                        1. <strong className="text-[#F5F7F2]">Do NOT make your Google Drive folder public</strong> (&quot;Anyone with the link&quot;). Instead, open your plugin folder in Google Drive, click <strong className="text-[#F5F7F2]">Share</strong>, and keep General Access set to <strong className="text-[#F5F7F2]">&quot;Restricted&quot;</strong>.
                      </p>
                      <p>
                        2. When an order is completed, our Google Apps Script automatically adds the <strong className="text-[#F5F7F2]">buyer&apos;s personal Google Email</strong> as an authorized Viewer via Google Drive API.
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

                {/* Final Save All Settings Button */}
                <div className="pt-4 border-t border-white/[0.09] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-[#707A72]">
                    Settings save to browser storage and auto-sync with checkout.
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveAllConfig()}
                    className="w-full sm:w-auto min-h-[44px] px-6 py-3 text-xs font-semibold uppercase tracking-normal glossy-btn rounded-xl cursor-pointer"
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

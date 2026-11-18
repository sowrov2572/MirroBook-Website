import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  LogOut,
  Users,
  ShoppingCart,
  Package,
  Settings,
  KeyRound,
  Search,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  AppUser,
  CustomerProfile,
  Order,
  PaymentConfig,
  ProductItem,
  MirrorPOSLicenseRequest,
  AdminActivityLog,
  generateDeterministicLicenseKey,
  isVerifiedAdminUser,
} from '../types';
import { AdminModal } from './AdminModal';

interface AdminAuthPortalProps {
  mode: 'login' | 'dashboard';
  user: AppUser | null;
  authReady: boolean;
  onNavigate: (path: string) => void;
  onAdminGoogleSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  orders: Order[];
  customers: CustomerProfile[];
  onDeleteOrder: (id: string) => void;
  onApproveOrder: (orderId: string) => Promise<{ success: boolean; message: string }>;
  onClearOrders: () => void;
  products: ProductItem[];
  onAddProduct: (product: ProductItem) => Promise<{ success: boolean; error?: string }> | void;
  onUpdateProduct: (product: ProductItem) => Promise<{ success: boolean; error?: string }> | void;
  onDeleteProduct: (id: string) => Promise<{ success: boolean; error?: string }> | void;
  onEnsureMirrorPOS?: () => Promise<void>;
  onSyncProducts: (urlOverride?: string) => Promise<{ success: boolean; message: string }>;
  sheetsUrl: string;
  onSaveSheetsUrl: (url: string) => void;
  paymentConfig: PaymentConfig;
  onSavePaymentConfig: (config: PaymentConfig) => void;
  onRefreshOrdersFromSheet: (fetchedOrders: Order[]) => void;
  mirrorPOSRequests?: MirrorPOSLicenseRequest[];
  adminActivityLogs?: AdminActivityLog[];
  onUpdateMirrorPOSStatus?: (
    requestId: string,
    action: 'APPROVE' | 'REJECT' | 'PENDING',
    note?: string
  ) => Promise<void>;
}

export const AdminAuthPortal: React.FC<AdminAuthPortalProps> = ({
  mode,
  user,
  authReady,
  onNavigate,
  onAdminGoogleSignIn,
  onSignOut,
  orders,
  customers,
  onDeleteOrder,
  onApproveOrder,
  onClearOrders,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onEnsureMirrorPOS,
  onSyncProducts,
  sheetsUrl,
  onSaveSheetsUrl,
  paymentConfig,
  onSavePaymentConfig,
  onRefreshOrdersFromSheet,
  mirrorPOSRequests = [],
  adminActivityLogs = [],
  onUpdateMirrorPOSStatus,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [isConsoleModalOpen, setIsConsoleModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<'orders' | 'mirrorpos' | 'products' | 'automation'>('orders');
  const [customerSearch, setCustomerSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null);
  const [updatingMirrorPOSKey, setUpdatingMirrorPOSKey] = useState<string | null>(null);

  const isAdmin = isVerifiedAdminUser(user);

  useEffect(() => {
    document.title = isAdmin
      ? 'Studio Admin Console | MirrorBook'
      : mode === 'login'
      ? 'Admin Portal Sign In | MirrorBook'
      : 'Access Denied | MirrorBook';
  }, [isAdmin, mode]);

  // Redirect verified admin away from /admin/login to /admin
  useEffect(() => {
    if (authReady && mode === 'login' && isAdmin) {
      onNavigate('/admin');
    }
  }, [authReady, mode, isAdmin, onNavigate]);

  const handleAdminSignInClick = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await onAdminGoogleSignIn();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Admin authentication failed.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!authReady) {
    return (
      <section className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-[#0B0D0C] px-4 overflow-x-clip">
        <div className="flex items-center gap-3 text-xs text-[#A1AAA2]">
          <Loader2 size={18} className="animate-spin text-[#B7F34A]" />
          <span>Verifying session permissions...</span>
        </div>
      </section>
    );
  }

  // Case 1: Signed in as unauthorized customer attempting /admin (or /admin/login)
  if (user && !isAdmin) {
    return (
      <section className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10 sm:py-16 bg-[#0B0D0C] overflow-x-clip">
        <div className="max-w-md w-full glossy-card border border-red-500/30 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-400 mx-auto flex items-center justify-center">
            <ShieldAlert size={28} />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#F5F7F2]">Access Denied</h1>
            <p className="text-xs text-[#A1AAA2] leading-relaxed">
              Your current account (<strong className="text-[#F5F7F2] break-all">{user.email}</strong>) is a customer account and does not have MirrorBook Administrator permissions.
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('/account')}
              className="glossy-btn w-full min-h-[44px] py-3 text-xs font-bold rounded-xl cursor-pointer"
            >
              Go to Customer Dashboard
            </button>
            <button
              type="button"
              onClick={async () => {
                await onSignOut();
                onNavigate('/admin/login');
              }}
              className="glossy-btn-secondary w-full min-h-[44px] py-2.5 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Sign Out &amp; Switch Account
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="w-full min-h-[44px] py-2 text-xs text-[#A1AAA2] hover:text-[#F5F7F2] cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Case 2: Unauthenticated visitor on /admin or /admin/login -> Show Dedicated Admin Login
  if (!user || mode === 'login') {
    return (
      <section className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10 sm:py-16 bg-[#0B0D0C] overflow-x-clip">
        <div className="max-w-md w-full space-y-5">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 text-xs text-[#A1AAA2] hover:text-[#B7F34A] cursor-pointer min-h-[44px]"
          >
            <ArrowLeft size={14} />
            <span>Back to MirrorBook</span>
          </button>

          <div className="glossy-card rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#B7F34A]/15 border border-[#B7F34A]/35 text-[#B7F34A] flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-lg font-bold text-[#F5F7F2]">
                  MirrorBook Admin Console
                </h1>
                <p className="text-xs text-[#A1AAA2]">
                  Restricted Studio Owner Google Authentication
                </p>
              </div>
            </div>

            <p className="text-xs text-[#A1AAA2] leading-relaxed">
              Administrator sessions are cryptographically verified via Firebase Google Sign-In and backend token verification. Unauthorized accounts are denied automatically.
            </p>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-start gap-2">
                <ShieldAlert size={15} className="shrink-0 text-red-400 mt-0.5" />
                <p className="text-[11px] leading-relaxed">{errorMsg}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleAdminSignInClick}
              disabled={isLoading}
              className="w-full min-h-[44px] py-3.5 px-4 bg-[#F5F7F2] hover:bg-white text-[#0B0D0C] font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-[#0B0D0C]" />
                  <span>Verifying Studio Owner...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign In with Owner Google Account</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Case 3: Verified Studio Owner Dashboard (/admin)
  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      c.email.toLowerCase().includes(q) ||
      c.displayName.toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  });

  const pendingOrders = orders.filter((o) => o.status === 'Pending');
  const pendingMirrorPOS = mirrorPOSRequests.filter((r) => r.paymentStatus === 'PENDING');

  const handleMirrorPOSQuickAction = async (
    requestId: string,
    action: 'APPROVE' | 'REJECT' | 'PENDING'
  ) => {
    if (!onUpdateMirrorPOSStatus) return;
    setApprovalError(null);
    const key = `${requestId}:${action}`;
    setUpdatingMirrorPOSKey(key);
    try {
      await onUpdateMirrorPOSStatus(requestId, action);
    } catch (err: unknown) {
      setApprovalError(
        err instanceof Error ? err.message : 'Failed to update MirrorPOS license status.'
      );
    } finally {
      setUpdatingMirrorPOSKey(null);
    }
  };

  const handleApprovePendingOrder = async (ord: Order) => {
    setApprovalError(null);
    setApprovingOrderId(ord.id);
    try {
      const res = await onApproveOrder(ord.id);
      if (!res.success) {
        setApprovalError(res.message);
      }
    } finally {
      setApprovingOrderId(null);
    }
  };

  return (
    <section className="min-h-[calc(100vh-140px)] bg-[#0B0D0C] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-clip">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Verified Admin Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/[0.09]">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#B7F34A]/15 border border-[#B7F34A]/35 text-[#B7F34A] flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-lg sm:text-xl font-bold text-[#F5F7F2] break-words">
                  MirrorBook Enterprise Admin Console
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-lg bg-[#B7F34A] text-[#0B0D0C] shrink-0">
                  Verified Owner
                </span>
              </div>
              <p className="text-xs text-[#A1AAA2] font-mono break-all mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setModalInitialTab('mirrorpos');
                setIsConsoleModalOpen(true);
              }}
              className="glossy-btn-secondary border-[#B7F34A]/40 w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound size={14} className="text-[#B7F34A] shrink-0" />
              <span>MirrorPOS Licenses ({pendingMirrorPOS.length} Pending)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setModalInitialTab('orders');
                setIsConsoleModalOpen(true);
              }}
              className="glossy-btn w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Settings size={14} className="shrink-0" />
              <span className="text-center">Open Full Control Desk (Orders / Products / Sheets / SMS)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/account')}
              className="glossy-btn-secondary flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Customer View
            </button>
            <button
              type="button"
              onClick={async () => {
                await onSignOut();
                onNavigate('/admin/login');
              }}
              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Executive Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="glossy-card rounded-2xl p-3.5 sm:p-4">
            <span className="text-[11px] text-[#A1AAA2] flex items-center gap-1.5">
              <ShoppingCart size={13} className="text-[#B7F34A] shrink-0" /> Total Orders
            </span>
            <span className="text-xl sm:text-2xl font-display font-bold text-[#F5F7F2] tabular-nums mt-1 block">
              {orders.length}
            </span>
          </div>
          <div className="glossy-card rounded-2xl p-3.5 sm:p-4">
            <span className="text-[11px] text-[#A1AAA2] flex items-center gap-1.5">
              <Users size={13} className="text-[#B7F34A] shrink-0" /> Registered Users
            </span>
            <span className="text-xl sm:text-2xl font-display font-bold text-[#F5F7F2] tabular-nums mt-1 block">
              {customers.length}
            </span>
          </div>
          <div className="glossy-card rounded-2xl p-3.5 sm:p-4">
            <span className="text-[11px] text-[#A1AAA2] flex items-center gap-1.5">
              <Package size={13} className="text-[#B7F34A] shrink-0" /> Catalog Products
            </span>
            <span className="text-xl sm:text-2xl font-display font-bold text-[#F5F7F2] tabular-nums mt-1 block">
              {products.length}
            </span>
          </div>
          <div className="glossy-card rounded-2xl p-3.5 sm:p-4">
            <span className="text-[11px] text-[#A1AAA2] flex items-center gap-1.5">
              <KeyRound size={13} className="text-yellow-400 shrink-0" /> Pending Reviews
            </span>
            <span className="text-xl sm:text-2xl font-display font-bold text-yellow-300 tabular-nums mt-1 block">
              {pendingOrders.length + pendingMirrorPOS.length}
            </span>
          </div>
        </div>

        {/* Pending MirrorPOS Manual bKash Verification Queue */}
        {pendingMirrorPOS.length > 0 && (
          <div className="glossy-card border-[#B7F34A]/35 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-sm sm:text-base font-bold text-[#F5F7F2]">
                MirrorPOS Manual bKash Payments Awaiting Verification ({pendingMirrorPOS.length})
              </h2>
              <button
                type="button"
                onClick={() => {
                  setModalInitialTab('mirrorpos');
                  setIsConsoleModalOpen(true);
                }}
                className="text-xs font-semibold text-[#B7F34A] hover:underline cursor-pointer"
              >
                View All MirrorPOS Requests &amp; Audit Log
              </button>
            </div>
            {approvalError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-start gap-2">
                <ShieldAlert size={15} className="shrink-0 text-red-400 mt-0.5" />
                <span>{approvalError}</span>
              </div>
            )}
            <div className="space-y-2.5">
              {pendingMirrorPOS.map((req) => {
                const isBusy = Boolean(updatingMirrorPOSKey?.startsWith(`${req.id}:`));
                return (
                  <div
                    key={req.id}
                    className="bg-[#121614] border border-white/[0.09] rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                  >
                    <div className="text-xs space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-[#B7F34A]">{req.id}</span>
                        <span className="text-[#F5F7F2] font-semibold">MirrorPOS Desktop License</span>
                        <span className="text-[#A1AAA2] font-mono tabular-nums">(৳{req.amount.toLocaleString()})</span>
                      </div>
                      <p className="text-[#A1AAA2] break-words">
                        {req.customerName} • <span className="break-all">{req.gmail}</span> • Sender:{' '}
                        <strong className="text-[#F5F7F2] font-mono">{req.senderNumber}</strong> • TrxID:{' '}
                        <strong className="text-[#B7F34A] font-mono break-all">{req.transactionId}</strong>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleMirrorPOSQuickAction(req.id, 'APPROVE')}
                        className="glossy-btn min-h-[40px] px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleMirrorPOSQuickAction(req.id, 'REJECT')}
                        className="min-h-[40px] px-4 py-2 bg-red-500/20 hover:bg-red-500/35 border border-red-500/40 text-red-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        <span>Reject</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleMirrorPOSQuickAction(req.id, 'PENDING')}
                        className="min-h-[40px] px-3 py-2 bg-yellow-500/15 hover:bg-yellow-500/30 border border-yellow-500/35 text-yellow-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Clock size={14} />
                        <span>Pending</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending Manual Order Approval Queue */}
        {pendingOrders.length > 0 && (
          <div className="glossy-card border-yellow-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm sm:text-base font-bold text-[#F5F7F2]">
                Pending Orders Awaiting Approval ({pendingOrders.length})
              </h2>
            </div>
            {approvalError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-start gap-2">
                <ShieldAlert size={15} className="shrink-0 text-red-400 mt-0.5" />
                <span>{approvalError}</span>
              </div>
            )}
            <div className="space-y-2.5">
              {pendingOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-[#121614] border border-white/[0.09] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="text-xs space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-[#B7F34A]">{ord.id}</span>
                      <span className="text-[#F5F7F2] font-semibold break-words">{ord.itemName}</span>
                      <span className="text-[#A1AAA2] font-mono tabular-nums">({ord.itemPrice})</span>
                    </div>
                    <p className="text-[#A1AAA2] break-words">
                      {ord.customerName} • <span className="break-all">{ord.customerEmail}</span> • {ord.paymentMethod} TrxID:{' '}
                      <strong className="text-[#F5F7F2] font-mono break-all">{ord.trxId}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={approvingOrderId === ord.id}
                    onClick={() => handleApprovePendingOrder(ord)}
                    className="glossy-btn w-full sm:w-auto min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} />
                    <span>
                      {approvingOrderId === ord.id ? 'Approving...' : 'Approve & Unlock'}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Registered Users & Issued License Keys */}
        <div className="glossy-card rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold text-[#F5F7F2]">
                Customer Directory &amp; License Management
              </h2>
              <p className="text-xs text-[#A1AAA2]">
                Manage registered customer accounts, roles, and verified license keys.
              </p>
            </div>
            <div className="relative w-full sm:w-72 shrink-0">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707A72]"
              />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customer email or name..."
                className="w-full bg-[#121614] border border-white/[0.09] focus:border-[#B7F34A] rounded-xl pl-9 pr-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#F5F7F2] placeholder:text-[#707A72] focus:outline-none"
              />
            </div>
          </div>

          <div className="border border-white/[0.09] rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#121614] border-b border-white/[0.09] text-[#A1AAA2] font-mono uppercase">
                <tr>
                  <th className="py-3 px-4 font-normal">Customer</th>
                  <th className="py-3 px-4 font-normal">Email</th>
                  <th className="py-3 px-4 font-normal">Role</th>
                  <th className="py-3 px-4 font-normal">Provider</th>
                  <th className="py-3 px-4 font-normal">Orders</th>
                  <th className="py-3 px-4 font-normal">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#707A72]">
                      No registered users synced yet.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const custOrders = orders.filter(
                      (o) =>
                        o.userId === cust.uid ||
                        o.customerEmail.toLowerCase() === cust.email.toLowerCase()
                    );
                    return (
                      <tr key={cust.uid} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-semibold text-[#F5F7F2]">
                          {cust.displayName}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#A1AAA2]">{cust.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                              cust.role === 'admin'
                                ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
                                : 'bg-[#B7F34A]/15 text-[#B7F34A] border border-[#B7F34A]/30'
                            }`}
                          >
                            {cust.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#A1AAA2]">
                          {cust.authProvider}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#F5F7F2] tabular-nums">{custOrders.length}</td>
                        <td className="py-3 px-4 font-mono text-[#A1AAA2] tabular-nums">
                          {cust.lastLoginAt
                            ? new Date(cust.lastLoginAt).toLocaleString()
                            : 'Active'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Issued Licenses Overview */}
        <div className="glossy-card rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-[#F5F7F2]">
            Issued Customer Licenses ({orders.filter((o) => o.status === 'Verified' || o.status === 'Completed' || o.status === 'Paid').length})
          </h2>
          <div className="border border-white/[0.09] rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#121614] border-b border-white/[0.09] text-[#A1AAA2] font-mono uppercase">
                <tr>
                  <th className="py-3 px-4 font-normal">Order ID</th>
                  <th className="py-3 px-4 font-normal">Customer Email</th>
                  <th className="py-3 px-4 font-normal">Product</th>
                  <th className="py-3 px-4 font-normal">License Key</th>
                  <th className="py-3 px-4 font-normal text-right">Copy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {orders
                  .filter((o) => o.status === 'Verified' || o.status === 'Completed' || o.status === 'Paid')
                  .slice(0, 25)
                  .map((ord) => {
                    const key =
                      ord.licenseKey ||
                      generateDeterministicLicenseKey(
                        ord.itemName,
                        ord.customerEmail,
                        ord.trxId || ord.id
                      );
                    return (
                      <tr key={ord.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-mono text-[#B7F34A]">{ord.id}</td>
                        <td className="py-3 px-4 font-mono text-[#A1AAA2]">
                          {ord.customerEmail}
                        </td>
                        <td className="py-3 px-4 text-[#F5F7F2] font-medium">{ord.itemName}</td>
                        <td className="py-3 px-4 font-mono text-[#B7F34A]">{key}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(key);
                              setCopiedKey(ord.id);
                              setTimeout(() => setCopiedKey(null), 1800);
                            }}
                            className="px-2.5 py-1.5 bg-[#121614] hover:bg-white/[0.08] border border-white/[0.09] rounded-lg text-[#F5F7F2] inline-flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === ord.id ? (
                              <Check size={12} className="text-[#B7F34A]" />
                            ) : (
                              <Copy size={12} />
                            )}
                            <span>{copiedKey === ord.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Preserved Full Enterprise Control Desk Modal */}
      <AdminModal
        isOpen={isConsoleModalOpen}
        onClose={() => setIsConsoleModalOpen(false)}
        orders={orders}
        onDeleteOrder={onDeleteOrder}
        onApproveOrder={onApproveOrder}
        onClearOrders={onClearOrders}
        products={products}
        onAddProduct={onAddProduct}
        onUpdateProduct={onUpdateProduct}
        onDeleteProduct={onDeleteProduct}
        onEnsureMirrorPOS={onEnsureMirrorPOS}
        onSyncProducts={onSyncProducts}
        sheetsUrl={sheetsUrl}
        onSaveSheetsUrl={onSaveSheetsUrl}
        paymentConfig={paymentConfig}
        onSavePaymentConfig={onSavePaymentConfig}
        currentUser={user}
        onRefreshOrdersFromSheet={onRefreshOrdersFromSheet}
        mirrorPOSRequests={mirrorPOSRequests}
        adminActivityLogs={adminActivityLogs}
        onUpdateMirrorPOSStatus={onUpdateMirrorPOSStatus}
        initialTab={modalInitialTab}
      />
    </section>
  );
};

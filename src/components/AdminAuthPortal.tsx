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
} from 'lucide-react';
import {
  AppUser,
  CustomerProfile,
  Order,
  PaymentConfig,
  ProductItem,
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
  onUpdateOrder: (order: Order) => Promise<void>;
  onClearOrders: () => void;
  products: ProductItem[];
  onAddProduct: (product: ProductItem) => void;
  onUpdateProduct: (product: ProductItem) => void;
  onDeleteProduct: (id: string) => void;
  onSyncProducts: (urlOverride?: string) => Promise<{ success: boolean; message: string }>;
  sheetsUrl: string;
  onSaveSheetsUrl: (url: string) => void;
  paymentConfig: PaymentConfig;
  onSavePaymentConfig: (config: PaymentConfig) => void;
  onRefreshOrdersFromSheet: (fetchedOrders: Order[]) => void;
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
  onUpdateOrder,
  onClearOrders,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onSyncProducts,
  sheetsUrl,
  onSaveSheetsUrl,
  paymentConfig,
  onSavePaymentConfig,
  onRefreshOrdersFromSheet,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConsoleModalOpen, setIsConsoleModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null);

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
      <section className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-[#070707]">
        <div className="flex items-center gap-3 text-xs text-[#999999]">
          <Loader2 size={18} className="animate-spin text-[#71B913]" />
          <span>Verifying session permissions...</span>
        </div>
      </section>
    );
  }

  // Case 1: Signed in as unauthorized customer attempting /admin (or /admin/login)
  if (user && !isAdmin) {
    return (
      <section className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-16 bg-[#070707]">
        <div className="max-w-md w-full glossy-card border border-red-500/30 rounded-3xl p-8 text-center space-y-5 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)]">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-400 mx-auto flex items-center justify-center">
            <ShieldAlert size={28} />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-white">Access Denied</h1>
            <p className="text-xs text-[#AAAAAA] leading-relaxed">
              Your current account (<strong className="text-white">{user.email}</strong>) is a customer account and does not have MirrorBook Administrator permissions.
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('/account')}
              className="w-full py-3 bg-[#71B913] hover:bg-[#81cf17] text-black text-xs font-bold uppercase rounded-xl cursor-pointer transition-colors"
            >
              Go to Customer Dashboard
            </button>
            <button
              type="button"
              onClick={async () => {
                await onSignOut();
                onNavigate('/admin/login');
              }}
              className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Sign Out &amp; Switch Account
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="w-full py-2 text-xs text-[#888888] hover:text-white cursor-pointer"
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
      <section className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-16 bg-[#070707]">
        <div className="max-w-md w-full space-y-5">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 text-xs text-[#999999] hover:text-[#71B913] cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to MirrorBook</span>
          </button>

          <div className="glossy-card border border-white/15 rounded-3xl p-8 space-y-6 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#71B913]/15 border border-[#71B913]/40 text-[#71B913] flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold text-white">
                  MirrorBook Admin Console
                </h1>
                <p className="text-xs text-[#888888]">
                  Restricted Studio Owner Google Authentication
                </p>
              </div>
            </div>

            <p className="text-xs text-[#AAAAAA] leading-relaxed">
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
              className="w-full py-3.5 px-4 bg-white hover:bg-neutral-100 text-black font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-black" />
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

  const handleApprovePendingOrder = async (ord: Order) => {
    setApprovingOrderId(ord.id);
    try {
      const matched = products.find(
        (p) => p.id === ord.productId || p.title.toLowerCase() === ord.itemName.toLowerCase()
      );
      const updatedOrder: Order = {
        ...ord,
        status: 'Verified',
        downloadUrl: ord.downloadUrl || matched?.protectedUrl || 'https://drive.google.com',
        licenseKey:
          ord.licenseKey ||
          generateDeterministicLicenseKey(ord.itemName, ord.customerEmail, ord.trxId || ord.id),
      };
      await onUpdateOrder(updatedOrder);
    } finally {
      setApprovingOrderId(null);
    }
  };

  return (
    <section className="min-h-[calc(100vh-140px)] bg-[#070707] px-4 sm:px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Verified Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#71B913]/15 border border-[#71B913]/40 text-[#71B913] flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-white">
                  MirrorBook Enterprise Admin Console
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#71B913] text-black">
                  Verified Owner
                </span>
              </div>
              <p className="text-xs text-[#999999] font-mono">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsConsoleModalOpen(true)}
              className="px-4 py-2.5 bg-[#71B913] hover:bg-[#81cf17] text-black text-xs font-bold uppercase rounded-xl flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(113,185,19,0.25)]"
            >
              <Settings size={14} />
              <span>Open Full Control Desk (Orders / Products / Sheets / SMS)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/account')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Customer View
            </button>
            <button
              type="button"
              onClick={async () => {
                await onSignOut();
                onNavigate('/admin/login');
              }}
              className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Executive Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-4">
            <span className="text-[11px] text-[#888888] flex items-center gap-1.5">
              <ShoppingCart size={13} className="text-[#71B913]" /> Total Orders
            </span>
            <span className="text-2xl font-display font-bold text-white tabular-nums mt-1 block">
              {orders.length}
            </span>
          </div>
          <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-4">
            <span className="text-[11px] text-[#888888] flex items-center gap-1.5">
              <Users size={13} className="text-[#71B913]" /> Registered Users
            </span>
            <span className="text-2xl font-display font-bold text-white tabular-nums mt-1 block">
              {customers.length}
            </span>
          </div>
          <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-4">
            <span className="text-[11px] text-[#888888] flex items-center gap-1.5">
              <Package size={13} className="text-[#71B913]" /> Catalog Products
            </span>
            <span className="text-2xl font-display font-bold text-white tabular-nums mt-1 block">
              {products.length}
            </span>
          </div>
          <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-4">
            <span className="text-[11px] text-[#888888] flex items-center gap-1.5">
              <KeyRound size={13} className="text-yellow-400" /> Pending Reviews
            </span>
            <span className="text-2xl font-display font-bold text-yellow-300 tabular-nums mt-1 block">
              {pendingOrders.length}
            </span>
          </div>
        </div>

        {/* Pending Manual Order Approval Queue */}
        {pendingOrders.length > 0 && (
          <div className="bg-[#0F0F0F] border border-yellow-500/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-white">
                Pending Orders Awaiting Approval ({pendingOrders.length})
              </h2>
            </div>
            <div className="space-y-2.5">
              {pendingOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-[#141414] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#71B913]">{ord.id}</span>
                      <span className="text-white font-semibold">{ord.itemName}</span>
                      <span className="text-[#AAAAAA] font-mono">({ord.itemPrice})</span>
                    </div>
                    <p className="text-[#999999]">
                      {ord.customerName} • {ord.customerEmail} • {ord.paymentMethod} TrxID:{' '}
                      <strong className="text-white font-mono">{ord.trxId}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={approvingOrderId === ord.id}
                    onClick={() => handleApprovePendingOrder(ord)}
                    className="px-4 py-2 bg-[#71B913] hover:bg-[#81cf17] text-black text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
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
        <div className="bg-[#0C0C0C] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-white">
                Customer Directory &amp; License Management
              </h2>
              <p className="text-xs text-[#888888]">
                Manage registered customer accounts, roles, and verified license keys.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]"
              />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customer email or name..."
                className="w-full bg-[#141414] border border-white/10 focus:border-[#71B913] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#141414] border-b border-white/10 text-[#888888] font-mono uppercase">
                <tr>
                  <th className="py-3 px-4 font-normal">Customer</th>
                  <th className="py-3 px-4 font-normal">Email</th>
                  <th className="py-3 px-4 font-normal">Role</th>
                  <th className="py-3 px-4 font-normal">Provider</th>
                  <th className="py-3 px-4 font-normal">Orders</th>
                  <th className="py-3 px-4 font-normal">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#666666]">
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
                        <td className="py-3 px-4 font-semibold text-white">
                          {cust.displayName}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#AAAAAA]">{cust.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                              cust.role === 'admin'
                                ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
                                : 'bg-[#71B913]/15 text-[#71B913] border border-[#71B913]/30'
                            }`}
                          >
                            {cust.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#888888]">
                          {cust.authProvider}
                        </td>
                        <td className="py-3 px-4 font-mono text-white">{custOrders.length}</td>
                        <td className="py-3 px-4 font-mono text-[#888888]">
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
        <div className="bg-[#0C0C0C] border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-white">
            Issued Customer Licenses ({orders.filter((o) => o.status === 'Verified' || o.status === 'Completed').length})
          </h2>
          <div className="border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#141414] border-b border-white/10 text-[#888888] font-mono uppercase">
                <tr>
                  <th className="py-3 px-4 font-normal">Order ID</th>
                  <th className="py-3 px-4 font-normal">Customer Email</th>
                  <th className="py-3 px-4 font-normal">Product</th>
                  <th className="py-3 px-4 font-normal">License Key</th>
                  <th className="py-3 px-4 font-normal text-right">Copy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders
                  .filter((o) => o.status === 'Verified' || o.status === 'Completed')
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
                        <td className="py-3 px-4 font-mono text-[#71B913]">{ord.id}</td>
                        <td className="py-3 px-4 font-mono text-[#CCCCCC]">
                          {ord.customerEmail}
                        </td>
                        <td className="py-3 px-4 text-white font-medium">{ord.itemName}</td>
                        <td className="py-3 px-4 font-mono text-[#71B913]">{key}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(key);
                              setCopiedKey(ord.id);
                              setTimeout(() => setCopiedKey(null), 1800);
                            }}
                            className="px-2.5 py-1 bg-white/10 hover:bg-white/15 rounded text-white inline-flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === ord.id ? (
                              <Check size={12} className="text-[#71B913]" />
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
        onClearOrders={onClearOrders}
        products={products}
        onAddProduct={onAddProduct}
        onUpdateProduct={onUpdateProduct}
        onDeleteProduct={onDeleteProduct}
        onSyncProducts={onSyncProducts}
        sheetsUrl={sheetsUrl}
        onSaveSheetsUrl={onSaveSheetsUrl}
        paymentConfig={paymentConfig}
        onSavePaymentConfig={onSavePaymentConfig}
        currentUser={user}
        onRefreshOrdersFromSheet={onRefreshOrdersFromSheet}
      />
    </section>
  );
};

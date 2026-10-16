import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { ShowcasesVault } from './components/ShowcasesVault';
import { Packages } from './components/Packages';
import { PluginStore } from './components/PluginStore';
import { CoursesAndTutorials } from './components/CoursesAndTutorials';
import { SoftwareStore } from './components/SoftwareStore';
import { CheckoutModal } from './components/CheckoutModal';
import { VideoPlayerModal, PlayableVideo } from './components/VideoPlayerModal';
import { AdminModal } from './components/AdminModal';
import { StartProjectModal } from './components/StartProjectModal';
import { UserVaultModal } from './components/UserVaultModal';
import { AuthModal } from './components/AuthModal';
import { SecureDownloadModal, SecureDownloadTarget } from './components/SecureDownloadModal';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { CheckoutItem, TutorialItem, Order, ProductItem, PaymentConfig, UserPurchase, AppUser, isStudioOwner } from './types';
import { INITIAL_PRODUCTS } from './data/content';
import {
  loadPaymentConfig,
  savePaymentConfig,
  logUserLoginToGoogleSheet,
  fetchUserPurchasesFromGoogleSheet,
} from './utils/paymentService';
import {
  sanitizeProductsForPublic,
  syncProductsToSheet,
  fetchProductsFromSheet,
  SHEETS_URL_KEY,
} from './utils/syncService';
import {
  subscribeToProducts,
  saveProductToFirestore,
  deleteProductFromFirestore,
  subscribeToPaymentConfig,
  savePaymentConfigToFirestore,
  subscribeToOrders,
  deleteOrderFromFirestore,
  signInWithGoogle,
  signOutUser,
  onAuthChange,
  subscribeToUserPurchases,
} from './utils/firebase';

const ACTIVE_USER_STORAGE_KEY = 'mirrorbook_active_user';

export default function App() {
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);
  const [activeVideo, setActiveVideo] = useState<PlayableVideo | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isStartProjectOpen, setIsStartProjectOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [secureDownloadTarget, setSecureDownloadTarget] = useState<SecureDownloadTarget | null>(null);

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const raw = localStorage.getItem('mirrorbook_orders');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // User Auth & Personal Vault state (supports Google Auth & direct Creator Email login)
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [userPurchases, setUserPurchases] = useState<UserPurchase[]>([]);

  // Payment configuration for bKash, Nagad, Bank, Google Sheets, Telegram
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(loadPaymentConfig);

  // Dynamic Products and Google Sheets state
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [sheetsUrl, setSheetsUrl] = useState<string>('');

  // Floating Toast Notification
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // 1. Firebase Auth state listener
  useEffect(() => {
    const unsubscribeAuth = onAuthChange((currentUser) => {
      if (currentUser) {
        const appUser: AppUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          isGoogle: true,
        };
        setUser(appUser);
        localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(appUser));
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // 2. Personal Vault purchases listener for logged-in user
  useEffect(() => {
    if (!user) {
      setUserPurchases([]);
      return;
    }

    // Subscribe to cloud user purchases in Firestore
    const unsubscribePurchases = subscribeToUserPurchases(user.uid, (cloudPurchases) => {
      setUserPurchases((prev) => {
        // Merge cloud purchases with existing, deduplicating by ID
        const map = new Map<string, UserPurchase>();
        prev.forEach((p) => map.set(p.id, p));
        cloudPurchases.forEach((p) => map.set(p.id, p));
        return Array.from(map.values());
      });
    });

    return () => {
      unsubscribePurchases();
    };
  }, [user]);

  // 3. Auto-bind any orders matching current user's email into their Vault
  useEffect(() => {
    if (!user || !user.email) return;
    const userEmail = user.email.toLowerCase().trim();

    const matchingOrders = orders.filter(
      (o) =>
        (o.customerEmail && o.customerEmail.toLowerCase().trim() === userEmail) ||
        (o.userId && o.userId === user.uid)
    );

    if (matchingOrders.length > 0) {
      setUserPurchases((prev) => {
        const map = new Map<string, UserPurchase>();
        prev.forEach((p) => map.set(p.id, p));

        matchingOrders.forEach((o) => {
          if (o.downloadUrl) {
            map.set(o.id, {
              id: o.id,
              productId: o.productId || o.id,
              title: o.itemName,
              category: 'Plugin',
              downloadUrl: o.downloadUrl,
              purchasedAt: o.createdAt,
              trxId: o.trxId,
            });
          }
        });

        return Array.from(map.values());
      });
    }
  }, [user, orders]);

  // 4. Real-time Firebase Firestore Global Synchronization
  useEffect(() => {
    // Seed new Easy Flow Plugin directly to Firestore so it's live worldwide immediately
    const easyFlowProduct = INITIAL_PRODUCTS.find((p) => p.id === 'plugin-easy-flow');
    if (easyFlowProduct) {
      saveProductToFirestore(easyFlowProduct).catch(() => {});
    }

    // Listen to live products from Firestore (shared worldwide)
    const unsubscribeProducts = subscribeToProducts((cloudProducts) => {
      if (cloudProducts.length > 0) {
        setProducts(cloudProducts);
      }
    });

    // Listen to live payment config from Firestore (shared worldwide)
    const unsubscribeConfig = subscribeToPaymentConfig((cloudConfig) => {
      setPaymentConfig(cloudConfig);
      savePaymentConfig(cloudConfig);
    });

    // Listen to live customer orders from Firestore (merge deduplicated)
    const unsubscribeOrders = subscribeToOrders((cloudOrders) => {
      setOrders((prev) => {
        const map = new Map<string, Order>();
        prev.forEach((o) => map.set(o.id, o));
        cloudOrders.forEach((o) => map.set(o.id, o));
        return Array.from(map.values());
      });
    });

    // Google Sheets URL fallback
    const storedSheetsUrl = localStorage.getItem(SHEETS_URL_KEY) || '';
    setSheetsUrl(storedSheetsUrl);

    // Studio Owner Direct Keyboard & Hash Shortcuts
    const handleHash = () => {
      if (window.location.hash === '#admin-studio' || window.location.hash === '#admin') {
        setIsAdminOpen(true);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribeProducts();
      unsubscribeConfig();
      unsubscribeOrders();
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Public Catalog Security Sanitization:
  // Paid items NEVER have their protectedUrl exposed in public React tree or inspect element
  const publicProducts = useMemo(() => {
    return sanitizeProductsForPublic(products);
  }, [products]);

  const publicPackages = useMemo(
    () => publicProducts.filter((p) => p.type === 'Agency Package'),
    [publicProducts]
  );
  const publicPlugins = useMemo(
    () => publicProducts.filter((p) => p.type === 'Plugin'),
    [publicProducts]
  );
  const publicCourses = useMemo(
    () => publicProducts.filter((p) => p.type === 'Course'),
    [publicProducts]
  );
  const publicTutorials = useMemo(
    () => publicProducts.filter((p) => p.type === 'Free Tutorial'),
    [publicProducts]
  );

  // Auth Handlers
  const handleGoogleSignIn = async () => {
    const firebaseUser = await signInWithGoogle();
    const isOwner = isStudioOwner(firebaseUser.email);
    const appUser: AppUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      isGoogle: true,
    };
    setUser(appUser);
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(appUser));

    showToast(
      isOwner
        ? `👑 Studio Owner Verified (${firebaseUser.email})! Studio Console unlocked.`
        : `✓ Welcome back, ${firebaseUser.displayName || firebaseUser.email}! Google Auth verified.`
    );

    // Instant Google Sheet synchronization of user login
    const targetUrl = paymentConfig.webAppUrl || sheetsUrl;
    if (firebaseUser.email) {
      logUserLoginToGoogleSheet(targetUrl, {
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        authProvider: 'Google Auth',
        uid: firebaseUser.uid,
      }).catch(() => {});

      // Restore any past purchases from Google Sheet
      fetchUserPurchasesFromGoogleSheet(targetUrl, firebaseUser.email).then((sheetPurchases) => {
        if (sheetPurchases.length > 0) {
          setUserPurchases((prev) => {
            const map = new Map<string, UserPurchase>();
            prev.forEach((p) => map.set(p.id, p));
            sheetPurchases.forEach((p) => map.set(p.id, p));
            return Array.from(map.values());
          });
        }
      }).catch(() => {});
    }

    setIsVaultOpen(true);
  };

  const handleEmailSignIn = (email: string, name: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];
    const isOwner = isStudioOwner(cleanEmail);
    const isGoogle = isOwner || cleanEmail.endsWith('@gmail.com');

    // Safely encode UID even with unicode chars
    let safeHash = '';
    try {
      safeHash = btoa(unescape(encodeURIComponent(cleanEmail))).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
    } catch {
      safeHash = Math.random().toString(36).substring(2, 15);
    }
    const customUid = 'creator_' + safeHash;
    const appUser: AppUser = {
      uid: customUid,
      email: cleanEmail,
      displayName: cleanName,
      photoURL: null,
      isGoogle: isGoogle,
    };
    setUser(appUser);
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(appUser));

    showToast(
      isOwner
        ? `👑 Studio Owner Verified (${cleanEmail})! Studio Console unlocked.`
        : `✓ Welcome, ${cleanName}! Signed in successfully with Gmail.`
    );

    // Log user credentials & password directly to Google Sheet "Users" tab
    const targetUrl = paymentConfig.webAppUrl || sheetsUrl;
    logUserLoginToGoogleSheet(targetUrl, {
      email: cleanEmail,
      password: password || '',
      name: cleanName,
      authProvider: isGoogle ? 'Gmail Fast-Track' : 'Email/Password Account',
      uid: customUid,
    }).catch(() => {});

    // Restore any past purchases from Google Sheet
    fetchUserPurchasesFromGoogleSheet(targetUrl, cleanEmail).then((sheetPurchases) => {
      if (sheetPurchases.length > 0) {
        setUserPurchases((prev) => {
          const map = new Map<string, UserPurchase>();
          prev.forEach((p) => map.set(p.id, p));
          sheetPurchases.forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });
      }
    }).catch(() => {});

    setIsVaultOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch {
      // ignore
    }
    setUser(null);
    setUserPurchases([]);
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    showToast('Signed out of account.', 'info');
  };

  // Product mutations with instant Firebase Firestore sync & Google Sheets sync
  const handleAddProduct = (newProduct: ProductItem) => {
    const updated = [newProduct, ...products];
    setProducts(updated);
    saveProductToFirestore(newProduct).catch((err) => console.warn('Firestore add error', err));
    syncProductsToSheet(sheetsUrl, updated);
  };

  const handleUpdateProduct = (updatedProduct: ProductItem) => {
    const updated = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
    setProducts(updated);
    saveProductToFirestore(updatedProduct).catch((err) => console.warn('Firestore update error', err));
    syncProductsToSheet(sheetsUrl, updated);
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    deleteProductFromFirestore(id).catch((err) => console.warn('Firestore delete error', err));
    syncProductsToSheet(sheetsUrl, updated);
  };

  const handleSyncProducts = async (urlOverride?: string) => {
    const targetUrl = urlOverride !== undefined ? urlOverride : sheetsUrl;
    if (targetUrl) {
      const fetchRes = await fetchProductsFromSheet(targetUrl);
      if (fetchRes.items && fetchRes.items.length > 0) {
        setProducts(fetchRes.items);
        for (const item of fetchRes.items) {
          saveProductToFirestore(item).catch(() => {});
        }
        return { success: true, message: `Synced ${fetchRes.items.length} items from Google Sheet.` };
      }
    }
    const pushRes = await syncProductsToSheet(targetUrl, products);
    return { success: pushRes.success, message: pushRes.message };
  };

  const handleSaveSheetsUrl = (url: string) => {
    const cleanUrl = url.trim();
    setSheetsUrl(cleanUrl);
    localStorage.setItem(SHEETS_URL_KEY, cleanUrl);
  };

  const handleOrderSuccess = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);

    // If user is authenticated and order is verified or has downloadUrl, update local vault list
    if (user && newOrder.downloadUrl) {
      const purchase: UserPurchase = {
        id: newOrder.id,
        productId: newOrder.productId || newOrder.id,
        title: newOrder.itemName,
        category: 'Plugin',
        downloadUrl: newOrder.downloadUrl,
        purchasedAt: newOrder.createdAt,
        trxId: newOrder.trxId,
      };
      setUserPurchases((prev) => [purchase, ...prev.filter((p) => p.id !== purchase.id)]);
    }
  };

  const handleDeleteOrder = (id: string) => {
    const updated = orders.filter((o) => o.id !== id);
    setOrders(updated);
    deleteOrderFromFirestore(id).catch(() => {});
  };

  const handleClearOrders = () => {
    setOrders([]);
    try {
      localStorage.removeItem('mirrorbook_orders');
    } catch {
      // ignore
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col selection:bg-[#71B913] selection:text-black">
      {/* 1. Header with Account & Vault Integration & Studio Owner Access */}
      <Header
        onStartProject={() => setIsStartProjectOpen(true)}
        user={user}
        onOpenVault={() => setIsVaultOpen(true)}
        onSignIn={() => setIsAuthModalOpen(true)}
        purchaseCount={userPurchases.length}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-grow pb-24 md:pb-0">
        {/* 2. Hero with Interactive Agency Showreel Video Player */}
        <Hero
          onViewPackages={() => scrollToSection('packages')}
          onBrowseStore={() => scrollToSection('plugins')}
          onPlayShowreel={() =>
            setActiveVideo({
              title: 'MirrorBook Agency Showreel // 2026 Edition',
              software: 'Agency 4K Master',
              duration: '03:20',
              description: 'Commercial video reel featuring our flagship client edits, DaVinci color grading, viral reels pacing, and proprietary AI workflows.',
              instructor: 'MirrorBook Creative Director',
            })
          }
        />

        {/* 3. Services: Text-Only Minimal Capabilities */}
        <Services />

        {/* 4. Portfolio Showcase Button to external studio link */}
        <ShowcasesVault />

        {/* 5. Agency Packages */}
        <Packages
          packages={publicPackages}
          onSelectPackage={(item) => setCheckoutItem(item)}
        />

        {/* 6. Plugin Store (Includes Easy Flow Plugin) */}
        <PluginStore
          plugins={publicPlugins}
          onBuyItem={(item) => setCheckoutItem(item)}
        />

        {/* 7. Courses & Video Masterclasses */}
        <CoursesAndTutorials
          courses={publicCourses}
          tutorials={publicTutorials}
          onEnrollCourse={(item) => setCheckoutItem(item)}
          onSelectTutorial={(tut: TutorialItem) =>
            setActiveVideo({
              title: tut.title,
              software: tut.software,
              duration: tut.duration,
              description: tut.description,
              instructor: tut.instructor,
              videoUrl: tut.videoUrl,
            })
          }
        />
      </main>

      {/* 8. Footer (Public minimal brand footer without exposing admin links) */}
      <Footer />

      {/* Creator Authentication Modal (Opens instantly when clicking Sign In) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onEmailSignIn={handleEmailSignIn}
      />

      {/* Multi-Method Payment Checkout Modal with Creator Vault auto-linking & DRM Protection */}
      <CheckoutModal
        item={checkoutItem}
        onClose={() => setCheckoutItem(null)}
        onOrderSuccess={handleOrderSuccess}
        paymentConfig={paymentConfig}
        allProducts={products}
        user={user}
        onSignIn={() => setIsAuthModalOpen(true)}
        onOpenVault={() => setIsVaultOpen(true)}
        onSelectDownload={(target) => setSecureDownloadTarget(target)}
      />

      {/* User Digital Vault & Downloads Modal with Anti-Piracy Protection */}
      <UserVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        user={user}
        purchases={userPurchases}
        onSignOut={handleSignOut}
        onBrowseStore={() => scrollToSection('plugins')}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onSelectDownload={(purchase) =>
          setSecureDownloadTarget({
            title: purchase.title,
            category: purchase.category,
            downloadUrl: purchase.downloadUrl,
            orderId: purchase.id,
            purchasedAt: purchase.purchasedAt,
            trxId: purchase.trxId,
          })
        }
      />

      {/* Cryptographically Protected Single-Session Download & DRM Gateway */}
      <SecureDownloadModal
        isOpen={Boolean(secureDownloadTarget)}
        onClose={() => setSecureDownloadTarget(null)}
        target={secureDownloadTarget}
        user={user}
        onSignIn={() => {
          setSecureDownloadTarget(null);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Video Player Modal for Showreels, Showcases, Services, and Tutorials */}
      <VideoPlayerModal
        video={activeVideo}
        onClose={() => setActiveVideo(null)}
      />

      {/* Discreet Admin Portal (Restricted to Studio Owner khansaheb2572@gmail.com / miirorbook.tech@gmail.com or Master Key) */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        orders={orders}
        onDeleteOrder={handleDeleteOrder}
        onClearOrders={handleClearOrders}
        products={products}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onSyncProducts={handleSyncProducts}
        sheetsUrl={sheetsUrl}
        onSaveSheetsUrl={handleSaveSheetsUrl}
        paymentConfig={paymentConfig}
        currentUser={user}
        onRefreshOrdersFromSheet={(newOrders) => {
          setOrders((prev) => {
            const map = new Map<string, Order>();
            prev.forEach((o) => map.set(o.id, o));
            newOrders.forEach((o) => map.set(o.id, o));
            const merged = Array.from(map.values());
            try {
              localStorage.setItem('mirrorbook_orders', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }}
        onSavePaymentConfig={(newCfg) => {
          savePaymentConfig(newCfg);
          setPaymentConfig(newCfg);
          savePaymentConfigToFirestore(newCfg).catch((err) => console.warn('Firestore payment save error', err));
        }}
      />

      {/* Start Project Direct Inquiry Modal */}
      <StartProjectModal
        isOpen={isStartProjectOpen}
        onClose={() => setIsStartProjectOpen(false)}
        onSelectCheckout={(item) => setCheckoutItem(item)}
      />

      {/* Modern Web App Mobile Floating Dock Navigation with Cart */}
      <MobileBottomNav
        activeTab={isVaultOpen ? 'vault' : 'home'}
        onNavigate={(sectionId) => scrollToSection(sectionId)}
        cartCount={checkoutItem ? 1 : 0}
        user={user}
        onOpenVault={() => setIsVaultOpen(true)}
        onSignIn={() => setIsAuthModalOpen(true)}
        onOpenCartOrStore={() => {
          if (checkoutItem) {
            // Reopen active checkout
          } else {
            scrollToSection('plugins');
          }
        }}
      />

      {/* Floating Global Toast Notification */}
      {toastNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[92%] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center justify-between gap-3 pointer-events-auto backdrop-blur-xl ${
              toastNotification.type === 'error'
                ? 'bg-red-950/90 border-red-500/40 text-red-200'
                : toastNotification.type === 'info'
                ? 'bg-neutral-900/90 border-white/20 text-white'
                : 'bg-black/90 border-[#71B913]/50 text-white shadow-[0_0_25px_rgba(113,185,19,0.25)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toastNotification.type === 'error' ? (
                <AlertCircle size={16} className="text-red-400 shrink-0" />
              ) : toastNotification.type === 'info' ? (
                <Sparkles size={16} className="text-yellow-400 shrink-0" />
              ) : (
                <CheckCircle2 size={16} className="text-[#71B913] shrink-0" />
              )}
              <span>{toastNotification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="text-[#888888] hover:text-white cursor-pointer px-1 text-sm font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

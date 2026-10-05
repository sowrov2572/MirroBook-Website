import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { ShowcasesVault } from './components/ShowcasesVault';
import { Packages } from './components/Packages';
import { PluginStore } from './components/PluginStore';
import { CoursesAndTutorials } from './components/CoursesAndTutorials';
import { CheckoutModal } from './components/CheckoutModal';
import { VideoPlayerModal, PlayableVideo } from './components/VideoPlayerModal';
import { AdminModal } from './components/AdminModal';
import { StartProjectModal } from './components/StartProjectModal';
import { UserVaultModal } from './components/UserVaultModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { CheckoutItem, TutorialItem, Order, ProductItem, PaymentConfig, UserPurchase, AppUser } from './types';
import { INITIAL_PRODUCTS } from './data/content';
import {
  loadPaymentConfig,
  savePaymentConfig,
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
  const [orders, setOrders] = useState<Order[]>([]);

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

    // Listen to live customer orders from Firestore
    const unsubscribeOrders = subscribeToOrders((cloudOrders) => {
      if (cloudOrders.length > 0) {
        setOrders(cloudOrders);
      }
    });

    // Google Sheets URL fallback
    const storedSheetsUrl = localStorage.getItem(SHEETS_URL_KEY) || '';
    setSheetsUrl(storedSheetsUrl);

    return () => {
      unsubscribeProducts();
      unsubscribeConfig();
      unsubscribeOrders();
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
    const appUser: AppUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      isGoogle: true,
    };
    setUser(appUser);
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(appUser));
    setIsVaultOpen(true);
  };

  const handleEmailSignIn = (email: string, name: string) => {
    const cleanEmail = email.trim();
    const cleanName = name.trim() || cleanEmail.split('@')[0];
    const customUid = 'creator_' + btoa(cleanEmail.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
    const appUser: AppUser = {
      uid: customUid,
      email: cleanEmail,
      displayName: cleanName,
      photoURL: null,
      isGoogle: false,
    };
    setUser(appUser);
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(appUser));
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
      {/* 1. Header with Account & Vault Integration */}
      <Header
        onStartProject={() => setIsStartProjectOpen(true)}
        user={user}
        onOpenVault={() => setIsVaultOpen(true)}
        onSignIn={() => setIsAuthModalOpen(true)}
        purchaseCount={userPurchases.length}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
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

      {/* 8. Footer & Admin View Link */}
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Creator Authentication Modal (Opens instantly when clicking Sign In) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onEmailSignIn={handleEmailSignIn}
      />

      {/* Multi-Method Payment Checkout Modal with Creator Vault auto-linking */}
      <CheckoutModal
        item={checkoutItem}
        onClose={() => setCheckoutItem(null)}
        onOrderSuccess={handleOrderSuccess}
        paymentConfig={paymentConfig}
        allProducts={products}
        user={user}
        onSignIn={() => setIsAuthModalOpen(true)}
        onOpenVault={() => setIsVaultOpen(true)}
      />

      {/* User Digital Vault & Downloads Modal */}
      <UserVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        user={user}
        purchases={userPurchases}
        onSignOut={handleSignOut}
        onBrowseStore={() => scrollToSection('plugins')}
      />

      {/* Video Player Modal for Showreels, Showcases, Services, and Tutorials */}
      <VideoPlayerModal
        video={activeVideo}
        onClose={() => setActiveVideo(null)}
      />

      {/* Discreet Admin Portal (PIN: 1234) with Orders, Manage Products, and Automation Setup */}
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
    </div>
  );
}

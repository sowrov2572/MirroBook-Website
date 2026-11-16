import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { StartProjectModal } from './components/StartProjectModal';
import { UserVaultModal } from './components/UserVaultModal';
import { AuthModal } from './components/AuthModal';
import { SecureDownloadModal, SecureDownloadTarget } from './components/SecureDownloadModal';
import { Footer } from './components/Footer';
import { SowrovHosenProfile } from './components/SowrovHosenProfile';
import { MirrorPOSPage } from './components/MirrorPOSPage';
import { PackageCustomizerModal, PackageInquiryData } from './components/PackageCustomizerModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CustomerAuthPage } from './components/CustomerAuthPage';
import { CustomerDashboard } from './components/CustomerDashboard';
import { AdminAuthPortal } from './components/AdminAuthPortal';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import {
  CheckoutItem,
  TutorialItem,
  Order,
  ProductItem,
  PaymentConfig,
  UserPurchase,
  AppUser,
  CustomerProfile,
  DownloadHistoryItem,
  isVerifiedAdminUser,
  generateDeterministicLicenseKey,
} from './types';
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
  PRODUCTS_STORAGE_KEY,
} from './utils/syncService';
import {
  subscribeToProducts,
  saveProductToFirestore,
  deleteProductFromFirestore,
  subscribeToPaymentConfig,
  subscribeToAdminConfig,
  savePaymentConfigToFirestore,
  subscribeToOrders,
  subscribeToUserOrders,
  updateOrderInFirestore,
  deleteOrderFromFirestore,
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  sendResetPassword,
  resendVerificationEmail,
  signOutUser,
  onAuthChange,
  verifySessionWithBackend,
  syncUserProfileToFirestore,
  updateCustomerProfile,
  subscribeToAllUsers,
  subscribeToUserPurchases,
  recordDownloadHistory,
  subscribeToDownloadHistory,
  formatFirebaseAuthError,
  OBSOLETE_PRODUCT_IDS,
} from './utils/firebase';

const KNOWN_ROUTES = new Set([
  '/',
  '/sowrov-hosen',
  '/mirrorpos',
  '/login',
  '/signup',
  '/account',
  '/admin/login',
  '/admin',
]);

function resolveRouteFromLocation(): string {
  if (typeof window === 'undefined') return '/';
  const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (KNOWN_ROUTES.has(pathname)) {
    return pathname;
  }
  const hash = window.location.hash.toLowerCase();
  if (hash === '#/sowrov-hosen') return '/sowrov-hosen';
  if (hash === '#/mirrorpos') return '/mirrorpos';
  if (hash === '#/login') return '/login';
  if (hash === '#/signup') return '/signup';
  if (hash === '#/account') return '/account';
  if (hash === '#/admin/login') return '/admin/login';
  if (hash === '#admin' || hash === '#admin-studio' || hash === '#/admin') return '/admin';
  return '/';
}

export default function App() {
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);
  const [activeVideo, setActiveVideo] = useState<PlayableVideo | null>(null);
  const [isStartProjectOpen, setIsStartProjectOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPackageInquiryOpen, setIsPackageInquiryOpen] = useState(false);
  const [packageInquiryData, setPackageInquiryData] = useState<PackageInquiryData | null>(null);
  const [secureDownloadTarget, setSecureDownloadTarget] = useState<SecureDownloadTarget | null>(null);

  // Scoped Orders & Customers state (adminOrders only populated for verified owner)
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerProfile[]>([]);

  // Verified User Auth & Customer Profile state
  const [user, setUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<CustomerProfile | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);

  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [firestorePurchases, setFirestorePurchases] = useState<UserPurchase[]>([]);
  const [sheetPurchases, setSheetPurchases] = useState<UserPurchase[]>([]);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistoryItem[]>([]);

  // Payment configuration for bKash, Nagad, Bank, Google Sheets, Telegram
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(loadPaymentConfig);

  // Dynamic Products and Google Sheets state
  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (raw) {
        const parsed: ProductItem[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter((p) => !OBSOLETE_PRODUCT_IDS.has(p.id));
          const hasNewTutorials = cleaned.some((p) => p.id === 'tut-bangladeshi-money-explosion');
          if (hasNewTutorials) {
            try {
              localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(cleaned));
            } catch {}
            return cleaned;
          }
          const nonTutorials = cleaned.filter((p) => p.type !== 'Free Tutorial');
          const canonicalTutorials = INITIAL_PRODUCTS.filter((p) => p.type === 'Free Tutorial');
          const merged = [...nonTutorials, ...canonicalTutorials];
          try {
            localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(merged));
          } catch {}
          return merged;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_PRODUCTS;
  });
  const [sheetsUrl, setSheetsUrl] = useState<string>(() => {
    try {
      return localStorage.getItem(SHEETS_URL_KEY) || '';
    } catch {
      return '';
    }
  });

  const [currentPath, setCurrentPath] = useState<string>(resolveRouteFromLocation);

  // Floating Toast Notification
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  }, []);

  const navigateTo = useCallback((path: string) => {
    const normalized = path.toLowerCase().replace(/\/+$/, '') || '/';
    if (typeof window !== 'undefined' && window.location.pathname !== normalized) {
      window.history.pushState({}, '', normalized);
    }
    setCurrentPath(normalized);
    if (normalized === '/') {
      document.title = 'MirrorBook | Creative Agency in Bangladesh';
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // 1. Firebase Auth state listener with Backend Session Verification & Role Resolution
  useEffect(() => {
    // Clean up legacy insecure auth cache keys from earlier versions
    try {
      localStorage.removeItem('mirrorbook_active_user');
      localStorage.removeItem('mirrorbook_admin_passkey');
    } catch {}

    let isMounted = true;
    const unsubscribeAuth = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        if (!isMounted) return;
        setUser(null);
        setUserProfile(null);
        setUserOrders([]);
        setFirestorePurchases([]);
        setSheetPurchases([]);
        setDownloadHistory([]);
        setAdminOrders([]);
        setAllCustomers([]);
        setAuthReady(true);
        return;
      }

      const session = await verifySessionWithBackend(firebaseUser, 'customer');
      const resolvedRole = session.isAdmin ? 'admin' : 'customer';
      const providerId = firebaseUser.providerData?.[0]?.providerId || 'password';

      const appUser: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        isGoogle: providerId === 'google.com',
        role: resolvedRole,
        authProvider: providerId,
        emailVerified: Boolean(firebaseUser.emailVerified || session.emailVerified),
        backendVerified: Boolean(session.authenticated && session.isAdmin === (resolvedRole === 'admin')),
      };

      if (!isMounted) return;
      setUser(appUser);

      const syncedProfile = await syncUserProfileToFirestore(firebaseUser, resolvedRole);
      if (isMounted && syncedProfile) {
        setUserProfile(syncedProfile);
        setUser((prev) =>
          prev && prev.uid === firebaseUser.uid
            ? {
                ...prev,
                displayName: syncedProfile.displayName || prev.displayName,
                phone: syncedProfile.phone,
                company: syncedProfile.company,
              }
            : prev
        );
      }

      if (isMounted) {
        setAuthReady(true);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
    };
  }, []);

  // Redirect authenticated customers away from /login & /signup to /account
  useEffect(() => {
    if (authReady && user && (currentPath === '/login' || currentPath === '/signup')) {
      navigateTo('/account');
    }
  }, [authReady, user, currentPath, navigateTo]);

  // 2. Customer-scoped Firestore Subscriptions (Purchases, Orders, Downloads) + Sheet recovery
  useEffect(() => {
    if (!user) {
      setUserOrders([]);
      setFirestorePurchases([]);
      setSheetPurchases([]);
      setDownloadHistory([]);
      return;
    }

    const unsubPurchases = subscribeToUserPurchases(user.uid, (list) => {
      setFirestorePurchases(list);
    });
    const unsubUserOrders = subscribeToUserOrders(
      user.uid,
      user.email,
      Boolean(user.emailVerified),
      (list) => {
        setUserOrders(list);
      }
    );
    const unsubDownloads = subscribeToDownloadHistory(user.uid, (logs) => {
      setDownloadHistory(logs);
    });

    const targetUrl = paymentConfig.webAppUrl || sheetsUrl;
    if (user.email && targetUrl) {
      fetchUserPurchasesFromGoogleSheet(targetUrl, user.email)
        .then((recovered) => {
          if (recovered.length > 0) {
            setSheetPurchases(recovered);
          }
        })
        .catch(() => {});
    }

    return () => {
      unsubPurchases();
      unsubUserOrders();
      unsubDownloads();
    };
  }, [user?.uid, user?.email, user?.emailVerified, paymentConfig.webAppUrl, sheetsUrl]);

  // Compute merged customer purchases from Firestore purchases, verified user orders, and sheet recovery
  const userPurchases = useMemo(() => {
    if (!user) return [];
    const map = new Map<string, UserPurchase>();

    sheetPurchases.forEach((p) => map.set(p.id, p));

    userOrders.forEach((o) => {
      if (o.downloadUrl && (o.status === 'Verified' || o.status === 'Completed')) {
        map.set(o.id, {
          id: o.id,
          productId: o.productId || o.id,
          title: o.itemName,
          category: 'Plugin',
          downloadUrl: o.downloadUrl,
          purchasedAt: o.createdAt,
          trxId: o.trxId,
          licenseKey:
            o.licenseKey ||
            generateDeterministicLicenseKey(o.itemName, user.email, o.trxId || o.id),
        });
      }
    });

    firestorePurchases.forEach((p) => {
      map.set(p.id, {
        ...p,
        licenseKey:
          p.licenseKey ||
          generateDeterministicLicenseKey(p.title, user.email, p.trxId || p.id),
      });
    });

    return Array.from(map.values());
  }, [user, firestorePurchases, userOrders, sheetPurchases]);

  const isAdminVerified = isVerifiedAdminUser(user);

  // 3. Public Firestore Catalog & Public Payment Config Listeners
  useEffect(() => {
    const unsubscribeProducts = subscribeToProducts((cloudProducts) => {
      if (cloudProducts.length > 0) {
        const hasTutorials = cloudProducts.some((p) => p.type === 'Free Tutorial');
        const finalProducts = hasTutorials
          ? cloudProducts
          : [...cloudProducts, ...INITIAL_PRODUCTS.filter((p) => p.type === 'Free Tutorial')];
        setProducts(finalProducts);
        try {
          localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(finalProducts));
        } catch {}
      }
    }, isAdminVerified);

    const unsubscribeConfig = subscribeToPaymentConfig((cloudConfig) => {
      setPaymentConfig((prev) => ({
        ...cloudConfig,
        telegramBotToken: isAdminVerified ? prev.telegramBotToken : '',
        telegramChatId: isAdminVerified ? prev.telegramChatId : '',
      }));
      savePaymentConfig(cloudConfig);
    }, isAdminVerified);

    return () => {
      unsubscribeProducts();
      unsubscribeConfig();
    };
  }, [isAdminVerified]);

  // 4. Admin-Only Firestore Listeners (STRICTLY gated by verified Studio Owner session)
  useEffect(() => {
    if (!isAdminVerified) {
      setAdminOrders([]);
      setAllCustomers([]);
      return;
    }

    const unsubOrders = subscribeToOrders((cloudOrders) => {
      setAdminOrders(cloudOrders);
    });
    const unsubUsers = subscribeToAllUsers((usersList) => {
      setAllCustomers(usersList);
    });
    const unsubAdminCfg = subscribeToAdminConfig((adminPart) => {
      setPaymentConfig((prev) => {
        const merged: PaymentConfig = {
          ...prev,
          telegramBotToken: adminPart.telegramBotToken ?? prev.telegramBotToken,
          telegramChatId: adminPart.telegramChatId ?? prev.telegramChatId,
          spreadsheetUrl: adminPart.spreadsheetUrl ?? prev.spreadsheetUrl,
          webAppUrl: adminPart.webAppUrl || prev.webAppUrl,
        };
        savePaymentConfig(merged);
        return merged;
      });
    });

    return () => {
      unsubOrders();
      unsubUsers();
      unsubAdminCfg();
    };
  }, [isAdminVerified]);

  // 5. History Popstate, Hash & Admin Keyboard Shortcut (Routes to /admin with RBAC protection)
  useEffect(() => {
    const handlePopState = () => {
      const next = resolveRouteFromLocation();
      setCurrentPath(next);
      if (next === '/') {
        document.title = 'MirrorBook | Creative Agency in Bangladesh';
      }
    };

    const handleHash = () => {
      if (window.location.hash === '#admin-studio' || window.location.hash === '#admin') {
        navigateTo('/admin');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        navigateTo('/admin');
      }
    };

    handleHash();
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigateTo]);

  // Public Catalog Security Sanitization:
  // Paid items NEVER have their protectedUrl exposed in public React tree
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
  const publicSoftware = useMemo(
    () => publicProducts.filter((p) => p.type === 'Software'),
    [publicProducts]
  );
  const publicCourses = useMemo(
    () => publicProducts.filter((p) => p.type === 'Course'),
    [publicProducts]
  );
  const publicTutorials = useMemo(() => {
    const canonicalIds = [
      'tut-bangladeshi-money-explosion',
      'tut-dune-2-scene-recreation',
      'tut-social-media-poster-design',
      'tut-improve-design-skill',
    ];
    const map = new Map<string, ProductItem>();
    publicProducts.forEach((p) => {
      if (p.type === 'Free Tutorial') {
        map.set(p.id, p);
      }
    });

    const result: ProductItem[] = [];
    for (const id of canonicalIds) {
      const match = map.get(id);
      if (match) {
        result.push(match);
      } else {
        const fallback = INITIAL_PRODUCTS.find((p) => p.id === id);
        if (fallback) result.push(fallback);
      }
    }
    return result;
  }, [publicProducts]);

  // Auth Handlers (Real Firebase Auth + Backend Session Verification)
  const syncAfterCustomerAuth = async (
    firebaseUser: import('firebase/auth').User,
    providerLabel: string,
    redirectToAccount = true
  ) => {
    const session = await verifySessionWithBackend(firebaseUser, 'customer');
    const resolvedRole = session.isAdmin ? 'admin' : 'customer';
    const syncedProfile = await syncUserProfileToFirestore(firebaseUser, resolvedRole);

    const appUser: AppUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: syncedProfile?.displayName || firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      isGoogle: providerLabel === 'Google Auth',
      role: resolvedRole,
      authProvider: firebaseUser.providerData?.[0]?.providerId || providerLabel,
      emailVerified: Boolean(firebaseUser.emailVerified || session.emailVerified),
      backendVerified: Boolean(session.authenticated),
      phone: syncedProfile?.phone,
      company: syncedProfile?.company,
    };

    setUser(appUser);
    if (syncedProfile) setUserProfile(syncedProfile);

    const targetUrl = paymentConfig.webAppUrl || sheetsUrl;
    if (firebaseUser.email && targetUrl) {
      logUserLoginToGoogleSheet(targetUrl, {
        email: firebaseUser.email,
        name: appUser.displayName || firebaseUser.email.split('@')[0],
        authProvider: providerLabel,
        uid: firebaseUser.uid,
      }).catch(() => {});

      fetchUserPurchasesFromGoogleSheet(targetUrl, firebaseUser.email)
        .then((recovered) => {
          if (recovered.length > 0) setSheetPurchases(recovered);
        })
        .catch(() => {});
    }

    showToast(`✓ Welcome, ${appUser.displayName || firebaseUser.email}!`);

    if (redirectToAccount) {
      navigateTo('/account');
    }
  };

  const handleCustomerGoogleSignIn = async () => {
    try {
      const firebaseUser = await signInWithGoogle();
      await syncAfterCustomerAuth(firebaseUser, 'Google Auth');
    } catch (err) {
      throw new Error(formatFirebaseAuthError(err));
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    try {
      const firebaseUser = await signInWithEmail(email, password);
      await syncAfterCustomerAuth(firebaseUser, 'Email & Password');
    } catch (err) {
      throw new Error(formatFirebaseAuthError(err));
    }
  };

  const handleEmailSignUp = async (email: string, password: string, fullName: string) => {
    try {
      const firebaseUser = await registerWithEmail(email, password, fullName);
      await syncAfterCustomerAuth(firebaseUser, 'Email & Password');
    } catch (err) {
      throw new Error(formatFirebaseAuthError(err));
    }
  };

  const handleSendResetPassword = async (email: string) => {
    try {
      await sendResetPassword(email);
    } catch (err) {
      throw new Error(formatFirebaseAuthError(err));
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      showToast('Verification email sent! Please check your inbox.', 'info');
    } catch (err) {
      showToast(formatFirebaseAuthError(err), 'error');
    }
  };

  const handleUpdateCustomerProfile = async (updates: {
    displayName: string;
    phone?: string;
    company?: string;
  }) => {
    if (!user) throw new Error('Not authenticated.');
    await updateCustomerProfile(user.uid, updates);
    setUser((prev) =>
      prev
        ? {
            ...prev,
            displayName: updates.displayName,
            phone: updates.phone,
            company: updates.company,
          }
        : prev
    );
    setUserProfile((prev) =>
      prev
        ? {
            ...prev,
            displayName: updates.displayName,
            phone: updates.phone,
            company: updates.company,
          }
        : prev
    );
    showToast('✓ Customer profile updated.');
  };

  const handleAdminGoogleSignIn = async () => {
    let firebaseUser: import('firebase/auth').User;
    try {
      firebaseUser = await signInWithGoogle();
    } catch (err) {
      throw new Error(formatFirebaseAuthError(err));
    }

    const session = await verifySessionWithBackend(firebaseUser, 'admin');
    if (!session.authenticated || !session.isAdmin) {
      await signOutUser().catch(() => {});
      setUser(null);
      setUserProfile(null);
      throw new Error(
        session.error ||
          'Access Denied: This Google account is not authorized as a MirrorBook Studio Administrator.'
      );
    }

    const syncedProfile = await syncUserProfileToFirestore(firebaseUser, 'admin');
    const adminUser: AppUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: syncedProfile?.displayName || firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      isGoogle: true,
      role: 'admin',
      authProvider: 'google.com',
      emailVerified: Boolean(firebaseUser.emailVerified || session.emailVerified),
      backendVerified: true,
      phone: syncedProfile?.phone,
      company: syncedProfile?.company,
    };

    setUser(adminUser);
    if (syncedProfile) setUserProfile(syncedProfile);
    showToast(`✓ Studio Owner verified (${firebaseUser.email}). Admin Console unlocked.`);
    navigateTo('/admin');
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch {
      // ignore
    }
    setUser(null);
    setUserProfile(null);
    setUserOrders([]);
    setFirestorePurchases([]);
    setSheetPurchases([]);
    setDownloadHistory([]);
    setAdminOrders([]);
    setAllCustomers([]);
    showToast('Signed out of account.', 'info');
  };

  // Product mutations with instant Firebase Firestore sync & Google Sheets sync
  const handleAddProduct = (newProduct: ProductItem) => {
    const itemWithTime: ProductItem = {
      ...newProduct,
      updatedAt: new Date().toISOString(),
    };
    const updated = [itemWithTime, ...products.filter((p) => p.id !== newProduct.id)];
    setProducts(updated);
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    saveProductToFirestore(itemWithTime).catch((err) => console.warn('Firestore add error', err));
    const targetUrl = sheetsUrl || paymentConfig.webAppUrl || '';
    if (targetUrl) {
      syncProductsToSheet(targetUrl, updated).catch(() => {});
    }
    showToast(`✓ "${newProduct.title}" added to catalog.`);
  };

  const handleUpdateProduct = (updatedProduct: ProductItem) => {
    const itemWithTime: ProductItem = {
      ...updatedProduct,
      updatedAt: new Date().toISOString(),
    };
    let found = false;
    const updated = products.map((p) => {
      if (
        p.id === updatedProduct.id ||
        (p.title && p.title.toLowerCase().trim() === updatedProduct.title.toLowerCase().trim())
      ) {
        found = true;
        return itemWithTime;
      }
      return p;
    });
    const finalProducts = found ? updated : [itemWithTime, ...products];
    setProducts(finalProducts);
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(finalProducts));
    } catch {}
    saveProductToFirestore(itemWithTime).catch((err) => console.warn('Firestore update error', err));
    const targetUrl = sheetsUrl || paymentConfig.webAppUrl || '';
    if (targetUrl) {
      syncProductsToSheet(targetUrl, finalProducts).catch(() => {});
    }
    showToast(`✓ "${updatedProduct.title}" updated successfully! Price: ${updatedProduct.priceDisplay}`);
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    deleteProductFromFirestore(id).catch((err) => console.warn('Firestore delete error', err));
    const targetUrl = sheetsUrl || paymentConfig.webAppUrl || '';
    if (targetUrl) {
      syncProductsToSheet(targetUrl, updated).catch(() => {});
    }
    showToast('✓ Item removed from catalog.', 'info');
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
    if (user) {
      setUserOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
    }
    if (isAdminVerified) {
      setAdminOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
    }
  };

  const handleUpdateOrder = async (updatedOrder: Order) => {
    await updateOrderInFirestore(updatedOrder);
    setAdminOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    showToast(`✓ Order ${updatedOrder.id} approved & license activated.`);
  };

  const handleDeleteOrder = (id: string) => {
    setAdminOrders((prev) => prev.filter((o) => o.id !== id));
    deleteOrderFromFirestore(id).catch(() => {});
  };

  const handleClearOrders = () => {
    setAdminOrders([]);
    try {
      localStorage.removeItem('mirrorbook_orders');
    } catch {
      // ignore
    }
  };

  const scrollToSection = (id: string) => {
    if (currentPath !== '/') {
      navigateTo('/');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 120);
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col selection:bg-[#71B913] selection:text-black">
      {/* 1. Header with Customer Account & Verified Admin Access */}
      <Header
        onStartProject={() => setIsStartProjectOpen(true)}
        user={user}
        onOpenVault={() => navigateTo('/account')}
        onSignIn={() => navigateTo('/login')}
        purchaseCount={userPurchases.length}
        onOpenAdmin={() => navigateTo('/admin')}
        onNavigate={navigateTo}
        currentPath={currentPath}
      />

      {/* Main Content Area: switches cleanly across Storefront, Customer Auth, Dashboard, Admin Portal, MirrorPOS, and Founder Profile */}
      <main className="flex-grow pb-24 md:pb-0">
        {currentPath === '/login' || currentPath === '/signup' ? (
          <CustomerAuthPage
            mode={currentPath === '/signup' ? 'signup' : 'login'}
            onNavigate={navigateTo}
            onGoogleSignIn={handleCustomerGoogleSignIn}
            onEmailSignIn={handleEmailSignIn}
            onEmailSignUp={handleEmailSignUp}
            onSendResetPassword={handleSendResetPassword}
          />
        ) : currentPath === '/account' ? (
          <CustomerDashboard
            user={user}
            profile={userProfile}
            purchases={userPurchases}
            orders={userOrders}
            downloadHistory={downloadHistory}
            onNavigate={navigateTo}
            onSignOut={handleSignOut}
            onSelectDownload={(target) => setSecureDownloadTarget(target)}
            onUpdateProfile={handleUpdateCustomerProfile}
            onSendResetPassword={handleSendResetPassword}
            onResendVerification={handleResendVerification}
            onBrowseStore={() => scrollToSection('plugins')}
          />
        ) : currentPath === '/admin/login' || currentPath === '/admin' ? (
          <AdminAuthPortal
            mode={currentPath === '/admin/login' ? 'login' : 'dashboard'}
            user={user}
            authReady={authReady}
            onNavigate={navigateTo}
            onAdminGoogleSignIn={handleAdminGoogleSignIn}
            onSignOut={handleSignOut}
            orders={adminOrders}
            customers={allCustomers}
            onDeleteOrder={handleDeleteOrder}
            onUpdateOrder={handleUpdateOrder}
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
              savePaymentConfigToFirestore(newCfg).catch((err) =>
                console.warn('Firestore payment save error', err)
              );
            }}
            onRefreshOrdersFromSheet={(newOrders) => {
              if (!isAdminVerified) return;
              setAdminOrders((prev) => {
                const map = new Map<string, Order>();
                prev.forEach((o) => map.set(o.id, o));
                newOrders.forEach((o) => map.set(o.id, o));
                return Array.from(map.values());
              });
            }}
          />
        ) : currentPath === '/sowrov-hosen' ? (
          <SowrovHosenProfile
            onNavigateHome={() => navigateTo('/')}
            onStartProject={() => setIsStartProjectOpen(true)}
          />
        ) : currentPath === '/mirrorpos' ? (
          <MirrorPOSPage
            onNavigateHome={() => navigateTo('/')}
            onStartProject={() => setIsStartProjectOpen(true)}
          />
        ) : (
          <>
            {/* 2. Hero with Interactive Agency Showreel Video Player */}
            <Hero
              onViewPackages={() => scrollToSection('packages')}
              onBrowseStore={() => scrollToSection('plugins')}
              onPlayShowreel={() =>
                setActiveVideo({
                  title: 'MirrorBook Agency Showreel // 2026 Edition',
                  software: 'Agency 4K Master',
                  duration: '03:20',
                  description:
                    'Commercial video reel featuring our flagship client edits, DaVinci color grading, viral reels pacing, and proprietary AI workflows.',
                  instructor: 'MirrorBook Creative Director',
                })
              }
            />

            {/* 3. Services: Text-Only Minimal Capabilities */}
            <Services />

            {/* 4. Portfolio Showcase Button to external studio link */}
            <ShowcasesVault onNavigate={navigateTo} />

            {/* 5. Monthly Service Packages (Two separate packages starting ৳25,000/mo) */}
            <Packages
              onSelectPackage={(item) => setCheckoutItem(item)}
              onOpenCustomizer={(serviceName) => {
                setPackageInquiryData({ initialService: serviceName });
                setIsPackageInquiryOpen(true);
              }}
            />

            {/* 6. Plugin Store */}
            <PluginStore plugins={publicPlugins} onBuyItem={(item) => setCheckoutItem(item)} />

            {/* 6.5 PC & Phone Software Library (Includes MirrorPOS) */}
            <SoftwareStore
              softwareList={publicSoftware}
              onBuyItem={(item) => setCheckoutItem(item)}
              onOpenMirrorPOS={() => navigateTo('/mirrorpos')}
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
          </>
        )}
      </main>

      {/* 8. Footer with Founder Profile and Index links */}
      <Footer onNavigate={navigateTo} />

      {/* Customer Authentication Quick Modal (used during checkout or download unlock) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onGoogleSignIn={handleCustomerGoogleSignIn}
        onEmailSignIn={handleEmailSignIn}
        onEmailSignUp={handleEmailSignUp}
        onSendResetPassword={handleSendResetPassword}
        onNavigate={navigateTo}
      />

      {/* Multi-Method Payment Checkout Modal with Customer Account binding & DRM Protection */}
      <CheckoutModal
        item={checkoutItem}
        onClose={() => setCheckoutItem(null)}
        onOrderSuccess={handleOrderSuccess}
        paymentConfig={paymentConfig}
        allProducts={products}
        user={user}
        onSignIn={() => setIsAuthModalOpen(true)}
        onOpenVault={() => navigateTo('/account')}
        onSelectDownload={(target) => setSecureDownloadTarget(target)}
      />

      {/* User Digital Vault & Downloads Modal */}
      <UserVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        user={user}
        purchases={userPurchases}
        onSignOut={handleSignOut}
        onBrowseStore={() => scrollToSection('plugins')}
        onOpenAdmin={() => navigateTo('/admin')}
        onOpenDashboard={() => navigateTo('/account')}
        onSelectDownload={(purchase) =>
          setSecureDownloadTarget({
            id: purchase.id,
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
          navigateTo('/login');
        }}
        onDownloadLogged={(entry) => {
          if (user?.uid) {
            recordDownloadHistory(user.uid, entry).catch(() => {});
          }
        }}
      />

      {/* Video Player Modal for Showreels, Showcases, Services, and Tutorials */}
      <VideoPlayerModal video={activeVideo} onClose={() => setActiveVideo(null)} />

      {/* Start Project Direct Inquiry Modal */}
      <StartProjectModal
        isOpen={isStartProjectOpen}
        onClose={() => setIsStartProjectOpen(false)}
        onSelectCheckout={(item) => setCheckoutItem(item)}
      />

      {/* Monthly Package Inquiry & Customizer Modal */}
      <PackageCustomizerModal
        isOpen={isPackageInquiryOpen}
        onClose={() => setIsPackageInquiryOpen(false)}
        initialData={packageInquiryData}
        onSuccessToast={(msg) => showToast(msg, 'success')}
      />

      {/* Modern Web App Mobile Floating Dock Navigation with Cart */}
      <MobileBottomNav
        activeTab={currentPath === '/account' || isVaultOpen ? 'vault' : 'home'}
        onNavigate={(sectionId) => scrollToSection(sectionId)}
        onNavigateHome={() => navigateTo('/')}
        cartCount={checkoutItem ? 1 : 0}
        user={user}
        onOpenVault={() => navigateTo('/account')}
        onSignIn={() => navigateTo('/login')}
        onOpenCartOrStore={() => {
          if (!checkoutItem) {
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

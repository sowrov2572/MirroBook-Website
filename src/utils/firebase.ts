import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocFromServer,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  ProductItem,
  PaymentConfig,
  Order,
  UserPurchase,
  UserRole,
  CustomerProfile,
  DownloadHistoryItem,
  generateDeterministicLicenseKey,
} from '../types';
import { DEFAULT_PAYMENT_CONFIG } from './paymentService';
import { INITIAL_PRODUCTS } from '../data/content';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore targeting the provisioned custom database ID with resilient long polling fallback
function createFirestore() {
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  try {
    return initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
      },
      dbId
    );
  } catch {
    return getFirestore(app, dbId);
  }
}

export const db = createFirestore();

// Operation types for standard error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Context:', JSON.stringify(errInfo));
  return errInfo;
}

// Collections
const PRODUCTS_COLLECTION = 'products';
const SETTINGS_COLLECTION = 'settings';
const ORDERS_COLLECTION = 'orders';
const USERS_COLLECTION = 'users';
const PAYMENT_CONFIG_DOC = 'paymentConfig';
const ADMIN_CONFIG_DOC = 'adminConfig';

function formatTimestampField(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return '';
    }
  }
  return String(value);
}

/**
 * Validate Connection to Firestore (Skill Requirement)
 */
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore client is operating in offline mode.');
    }
  }
}

// Run non-blocking connection check on startup
testConnection().catch(() => {});

/**
 * Backend cryptographic verification of Firebase ID Token & Role Resolution
 */
export interface BackendSessionResult {
  authenticated: boolean;
  uid?: string;
  email?: string | null;
  emailVerified?: boolean;
  role: UserRole;
  isAdmin: boolean;
  provider?: string;
  error?: string;
}

export async function verifySessionWithBackend(
  user: User,
  intent: 'customer' | 'admin' = 'customer'
): Promise<BackendSessionResult> {
  try {
    const idToken = await user.getIdToken();
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ intent }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        authenticated: Boolean(data?.authenticated),
        uid: data?.uid || user.uid,
        email: data?.email || user.email,
        emailVerified: Boolean(data?.emailVerified),
        role: 'customer',
        isAdmin: false,
        provider: data?.provider,
        error: data?.error || 'Authorization verification failed.',
      };
    }

    return {
      authenticated: Boolean(data.authenticated),
      uid: data.uid || user.uid,
      email: data.email || user.email,
      emailVerified: Boolean(data.emailVerified),
      role: data.isAdmin === true ? 'admin' : 'customer',
      isAdmin: data.isAdmin === true,
      provider: data.provider,
    };
  } catch (err) {
    return {
      authenticated: true,
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      role: 'customer',
      isAdmin: false,
      error: err instanceof Error ? err.message : 'Unable to reach session verification service.',
    };
  }
}

/**
 * Formats Firebase Auth error codes into clear user-facing messages.
 */
export function formatFirebaseAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: string }).code)
      : '';
  const msg = err instanceof Error ? err.message : String(err || '');

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact MirrorBook support.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes before trying again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in window was closed before completing.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in popup. Allow popups for this site or sign in with Email & Password below.';
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return 'Email/Password sign-in needs to be enabled in Firebase Console (Authentication → Sign-in method → Email/Password), or you can use Continue with Google.';
    default:
      return msg || 'Authentication failed. Please try again.';
  }
}

/**
 * Real-time listener for products.
 * Public visitors ONLY read; only verified admins perform seeding/cleanup mutations.
 */
export function subscribeToProducts(
  onUpdate: (products: ProductItem[]) => void,
  isAdminVerified = false
): () => void {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty && !snapshot.metadata.fromCache) {
        if (isAdminVerified) {
          seedProductsIfEmpty().catch(() => {});
        }
        return;
      }

      if (!snapshot.empty) {
        const cloudList: ProductItem[] = [];
        snapshot.forEach((docSnap) => {
          if (OBSOLETE_PRODUCT_IDS.has(docSnap.id)) {
            if (isAdminVerified) {
              deleteDoc(docSnap.ref).catch(() => {});
            }
            return;
          }
          cloudList.push(docSnap.data() as ProductItem);
        });

        const filteredCloudList = cloudList.filter((cp) => !OBSOLETE_PRODUCT_IDS.has(cp.id));
        let mergedList = [...filteredCloudList];

        try {
          const localRaw = localStorage.getItem('mirrorbook_products');
          if (localRaw && isAdminVerified) {
            const localProducts: ProductItem[] = JSON.parse(localRaw);
            const filteredLocal = localProducts.filter((lp) => !OBSOLETE_PRODUCT_IDS.has(lp.id));
            const localMap = new Map<string, ProductItem>();
            filteredLocal.forEach((lp) => localMap.set(lp.id, lp));

            mergedList = filteredCloudList.map((cp) => {
              const lp = localMap.get(cp.id);
              if (lp && lp.updatedAt && (!cp.updatedAt || lp.updatedAt > cp.updatedAt)) {
                saveProductToFirestore(lp).catch(() => {});
                return lp;
              }
              return cp;
            });

            filteredLocal.forEach((lp) => {
              if (!mergedList.some((p) => p.id === lp.id)) {
                mergedList.push(lp);
                saveProductToFirestore(lp).catch(() => {});
              }
            });
          }

          localStorage.setItem('mirrorbook_products', JSON.stringify(mergedList));
        } catch {
          // fallback
        }

        onUpdate(mergedList);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, PRODUCTS_COLLECTION);
    }
  );
}

export const OBSOLETE_PRODUCT_IDS = new Set([
  'tut-ae-kinetic',
  'tut-ai-automation',
  'tut-premiere-cuts',
  'tut-ps-colorgrade',
  'plugin-easy-flow',
  'plugin-autocut',
  'plugin-motionfx',
  'plugin-neuralretouch',
  'plugin-presetbundle',
]);

/**
 * Saves or updates a single product in Firestore (Admin only).
 */
export async function saveProductToFirestore(product: ProductItem): Promise<void> {
  if (OBSOLETE_PRODUCT_IDS.has(product.id)) {
    return;
  }
  const docPath = `${PRODUCTS_COLLECTION}/${product.id}`;
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
    const cleaned: Record<string, any> = {
      id: product.id,
      type: product.type || 'Plugin',
      category: product.category || 'General',
      title: product.title || '',
      description: product.description || 'MirrorBook digital asset',
      price: Number(product.price) || 0,
      priceDisplay: product.priceDisplay || `৳${(Number(product.price) || 0).toLocaleString()}`,
      protectedUrl: product.protectedUrl || '',
      thumbnailUrl: product.thumbnailUrl || '',
      createdAt: product.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: product.updatedAt || new Date().toISOString(),
    };
    if (product.period) cleaned.period = product.period;
    if (product.duration) cleaned.duration = product.duration;
    if (product.instructor) cleaned.instructor = product.instructor;
    if (typeof product.featured === 'boolean') cleaned.featured = product.featured;

    await setDoc(docRef, cleaned, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
    throw err;
  }
}

/**
 * Deletes a product from Firestore (Admin only).
 */
export async function deleteProductFromFirestore(id: string): Promise<void> {
  const docPath = `${PRODUCTS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
    throw err;
  }
}

/**
 * Seeds initial products into Firestore if database collection is empty (Admin only).
 */
export async function seedProductsIfEmpty(): Promise<void> {
  try {
    for (const item of INITIAL_PRODUCTS) {
      await saveProductToFirestore(item);
    }
  } catch (err) {
    console.warn('Seeding initial products notification:', err);
  }
}

/**
 * Real-time listener for PUBLIC Payment Configuration (never exposes Telegram tokens).
 */
export function subscribeToPaymentConfig(
  onUpdate: (config: PaymentConfig) => void,
  isAdminVerified = false
): () => void {
  const docRef = doc(db, SETTINGS_COLLECTION, PAYMENT_CONFIG_DOC);

  return onSnapshot(
    docRef,
    (docSnap) => {
      const snapExists = docSnap.exists();
      const fromCache = docSnap.metadata.fromCache;
      if (snapExists) {
        const data = docSnap.data() as Partial<PaymentConfig>;
        onUpdate({
          ...DEFAULT_PAYMENT_CONFIG,
          ...data,
          // Ensure tokens are never read from public config
          telegramBotToken: '',
          telegramChatId: '',
        });
      } else if (!fromCache) {
        if (isAdminVerified) {
          savePaymentConfigToFirestore(DEFAULT_PAYMENT_CONFIG).catch(() => {});
        }
        onUpdate(DEFAULT_PAYMENT_CONFIG);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `${SETTINGS_COLLECTION}/${PAYMENT_CONFIG_DOC}`);
    }
  );
}

/**
 * Real-time listener for ADMIN-ONLY Private Config (Telegram tokens, Spreadsheet URL).
 */
export function subscribeToAdminConfig(
  onUpdate: (partial: Partial<PaymentConfig>) => void
): () => void {
  const docRef = doc(db, SETTINGS_COLLECTION, ADMIN_CONFIG_DOC);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          telegramBotToken: String(data.telegramBotToken || ''),
          telegramChatId: String(data.telegramChatId || ''),
          spreadsheetUrl: String(data.spreadsheetUrl || ''),
          webAppUrl: data.webAppUrl ? String(data.webAppUrl) : undefined,
        });
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `${SETTINGS_COLLECTION}/${ADMIN_CONFIG_DOC}`);
    }
  );
}

/**
 * Saves payment config into split public (paymentConfig) and admin-only (adminConfig) Firestore docs.
 */
export async function savePaymentConfigToFirestore(config: PaymentConfig): Promise<void> {
  const publicDocPath = `${SETTINGS_COLLECTION}/${PAYMENT_CONFIG_DOC}`;
  const adminDocPath = `${SETTINGS_COLLECTION}/${ADMIN_CONFIG_DOC}`;
  try {
    const publicPayload = {
      bKashNumber: config.bKashNumber || '',
      nagadNumber: config.nagadNumber || '',
      rocketNumber: config.rocketNumber || '',
      upayNumber: config.upayNumber || '',
      bankDetails: config.bankDetails,
      secondaryBankDetails: config.secondaryBankDetails || DEFAULT_PAYMENT_CONFIG.secondaryBankDetails,
      webAppUrl: config.webAppUrl || '',
      whatsAppNumber: config.whatsAppNumber || '',
    };

    const adminPayload = {
      telegramBotToken: config.telegramBotToken || '',
      telegramChatId: config.telegramChatId || '',
      spreadsheetUrl: config.spreadsheetUrl || '',
      webAppUrl: config.webAppUrl || '',
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, SETTINGS_COLLECTION, PAYMENT_CONFIG_DOC), publicPayload, { merge: true });
    await setDoc(doc(db, SETTINGS_COLLECTION, ADMIN_CONFIG_DOC), adminPayload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${publicDocPath} | ${adminDocPath}`);
    throw err;
  }
}

/**
 * Saves customer order in Firestore.
 */
export async function saveOrderToFirestore(order: Order): Promise<void> {
  const docPath = `${ORDERS_COLLECTION}/${order.id}`;
  try {
    const docRef = doc(db, ORDERS_COLLECTION, order.id);
    const payload: Record<string, any> = {
      id: order.id,
      customerName: order.customerName || 'Customer',
      customerEmail: (order.customerEmail || '').toLowerCase().trim(),
      customerPhone: order.customerPhone || '',
      itemName: order.itemName,
      itemPrice: order.itemPrice,
      paymentMethod: order.paymentMethod,
      senderAccount: order.senderAccount || '',
      trxId: order.trxId,
      createdAt: order.createdAt || new Date().toISOString(),
      status: order.status || 'Pending',
      downloadUrl: order.downloadUrl || '',
    };
    if (order.userId) payload.userId = order.userId;
    if (order.productId) payload.productId = order.productId;
    if (order.licenseKey) payload.licenseKey = order.licenseKey;

    await setDoc(docRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, docPath);
    throw err;
  }
}

/**
 * Updates an order in Firestore (Admin only: approve status, assign downloadUrl/licenseKey).
 */
export async function updateOrderInFirestore(order: Order): Promise<void> {
  const docPath = `${ORDERS_COLLECTION}/${order.id}`;
  try {
    const docRef = doc(db, ORDERS_COLLECTION, order.id);
    const payload: Record<string, any> = {
      id: order.id,
      customerName: order.customerName || 'Customer',
      customerEmail: (order.customerEmail || '').toLowerCase().trim(),
      customerPhone: order.customerPhone || '',
      itemName: order.itemName,
      itemPrice: order.itemPrice,
      paymentMethod: order.paymentMethod,
      senderAccount: order.senderAccount || '',
      trxId: order.trxId,
      createdAt: order.createdAt,
      status: order.status || 'Verified',
      downloadUrl: order.downloadUrl || '',
    };
    if (order.userId) payload.userId = order.userId;
    if (order.productId) payload.productId = order.productId;
    if (order.licenseKey) payload.licenseKey = order.licenseKey;

    await setDoc(docRef, payload, { merge: false });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, docPath);
    throw err;
  }
}

/**
 * Real-time listener for ALL orders (Admin-only).
 */
export function subscribeToOrders(onUpdate: (orders: Order[]) => void): () => void {
  const colRef = collection(db, ORDERS_COLLECTION);
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Order);
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, ORDERS_COLLECTION);
    }
  );
}

/**
 * Real-time listener for a Customer's OWN orders strictly scoped by userId & verified email.
 */
export function subscribeToUserOrders(
  userId: string,
  userEmail: string | null,
  emailVerified: boolean,
  onUpdate: (orders: Order[]) => void
): () => void {
  const orderMap = new Map<string, Order>();

  const emitMerged = () => {
    const list = Array.from(orderMap.values());
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    onUpdate(list);
  };

  const uidQuery = query(collection(db, ORDERS_COLLECTION), where('userId', '==', userId));
  const unsubUid = onSnapshot(
    uidQuery,
    (snapshot) => {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Order;
        orderMap.set(data.id || docSnap.id, data);
      });
      emitMerged();
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `${ORDERS_COLLECTION} (userId=${userId})`);
    }
  );

  let unsubEmail: (() => void) | null = null;
  if (userEmail && emailVerified) {
    const emailQuery = query(
      collection(db, ORDERS_COLLECTION),
      where('customerEmail', '==', userEmail.toLowerCase().trim())
    );
    unsubEmail = onSnapshot(
      emailQuery,
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Order;
          orderMap.set(data.id || docSnap.id, data);
        });
        emitMerged();
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `${ORDERS_COLLECTION} (customerEmail)`);
      }
    );
  }

  return () => {
    unsubUid();
    if (unsubEmail) unsubEmail();
  };
}

/**
 * Deletes an order from Firestore (Admin only).
 */
export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  const docPath = `${ORDERS_COLLECTION}/${orderId}`;
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
    throw err;
  }
}

/**
 * Signs in user with Google OAuth Popup.
 */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/**
 * Signs in user with Email & Password via Firebase Auth.
 */
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

/**
 * Registers a new Customer account with Email & Password via Firebase Auth.
 */
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName.trim()) {
    await updateProfile(result.user, { displayName: displayName.trim() }).catch(() => {});
  }
  await sendEmailVerification(result.user).catch(() => {});
  return result.user;
}

/**
 * Sends a Firebase password reset email.
 */
export async function sendResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Resends verification email for the currently signed-in user.
 */
export async function resendVerificationEmail(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('No active signed-in account.');
  }
  await sendEmailVerification(auth.currentUser);
}

/**
 * Signs out current user.
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Listens for auth state changes (login, logout).
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Syncs authenticated user's profile to Firestore /users/{uid} securely.
 */
export async function syncUserProfileToFirestore(
  user: User,
  role: UserRole = 'customer',
  extra?: { displayName?: string; phone?: string; company?: string }
): Promise<CustomerProfile | null> {
  const docPath = `${USERS_COLLECTION}/${user.uid}`;
  try {
    const docRef = doc(db, USERS_COLLECTION, user.uid);
    const existingSnap = await getDoc(docRef);
    const providerId = user.providerData?.[0]?.providerId || 'password';
    const resolvedName =
      extra?.displayName?.trim() ||
      user.displayName?.trim() ||
      (user.email ? user.email.split('@')[0] : 'MirrorBook Member');

    if (!existingSnap.exists()) {
      const newProfile: Record<string, any> = {
        uid: user.uid,
        email: (user.email || '').toLowerCase().trim(),
        displayName: resolvedName.slice(0, 120),
        photoURL: user.photoURL || null,
        phone: (extra?.phone || '').slice(0, 40),
        company: (extra?.company || '').slice(0, 120),
        role: role === 'admin' ? 'admin' : 'customer',
        authProvider: providerId,
        emailVerified: Boolean(user.emailVerified),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };
      await setDoc(docRef, newProfile);
      return {
        uid: user.uid,
        email: newProfile.email,
        displayName: newProfile.displayName,
        photoURL: newProfile.photoURL,
        phone: newProfile.phone,
        company: newProfile.company,
        role: newProfile.role,
        authProvider: providerId,
        emailVerified: newProfile.emailVerified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
    }

    const existingData = existingSnap.data();
    await updateDoc(docRef, {
      displayName: (existingData.displayName || resolvedName).slice(0, 120),
      photoURL: user.photoURL || existingData.photoURL || null,
      emailVerified: Boolean(user.emailVerified),
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      uid: user.uid,
      email: String(existingData.email || user.email || ''),
      displayName: String(existingData.displayName || resolvedName),
      photoURL: existingData.photoURL || user.photoURL || null,
      phone: String(existingData.phone || ''),
      company: String(existingData.company || ''),
      role: (existingData.role as UserRole) || 'customer',
      authProvider: String(existingData.authProvider || providerId),
      emailVerified: Boolean(user.emailVerified),
      createdAt: formatTimestampField(existingData.createdAt),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
    return null;
  }
}

/**
 * Fetches single user profile from Firestore.
 */
export async function getUserProfileFromFirestore(uid: string): Promise<CustomerProfile | null> {
  const docPath = `${USERS_COLLECTION}/${uid}`;
  try {
    const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid: String(data.uid || uid),
      email: String(data.email || ''),
      displayName: String(data.displayName || ''),
      photoURL: data.photoURL || null,
      phone: String(data.phone || ''),
      company: String(data.company || ''),
      role: (data.role as UserRole) || 'customer',
      authProvider: String(data.authProvider || 'password'),
      emailVerified: Boolean(data.emailVerified),
      createdAt: formatTimestampField(data.createdAt),
      updatedAt: formatTimestampField(data.updatedAt),
      lastLoginAt: formatTimestampField(data.lastLoginAt),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, docPath);
    return null;
  }
}

/**
 * Updates allowed profile fields for the authenticated customer.
 */
export async function updateCustomerProfile(
  uid: string,
  updates: { displayName: string; phone?: string; company?: string }
): Promise<void> {
  const docPath = `${USERS_COLLECTION}/${uid}`;
  try {
    const cleanName = updates.displayName.trim().slice(0, 120);
    if (!cleanName) {
      throw new Error('Display name cannot be empty.');
    }

    if (auth.currentUser && auth.currentUser.uid === uid) {
      await updateProfile(auth.currentUser, { displayName: cleanName }).catch(() => {});
    }

    await updateDoc(doc(db, USERS_COLLECTION, uid), {
      displayName: cleanName,
      phone: (updates.phone || '').trim().slice(0, 40),
      company: (updates.company || '').trim().slice(0, 120),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, docPath);
    throw err;
  }
}

/**
 * Real-time listener for all registered users (Admin-only).
 */
export function subscribeToAllUsers(
  onUpdate: (users: CustomerProfile[]) => void
): () => void {
  const colRef = collection(db, USERS_COLLECTION);
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: CustomerProfile[] = [];
      snapshot.forEach((snap) => {
        const data = snap.data();
        list.push({
          uid: String(data.uid || snap.id),
          email: String(data.email || ''),
          displayName: String(data.displayName || ''),
          photoURL: data.photoURL || null,
          phone: String(data.phone || ''),
          company: String(data.company || ''),
          role: (data.role as UserRole) || 'customer',
          authProvider: String(data.authProvider || 'password'),
          emailVerified: Boolean(data.emailVerified),
          createdAt: formatTimestampField(data.createdAt),
          updatedAt: formatTimestampField(data.updatedAt),
          lastLoginAt: formatTimestampField(data.lastLoginAt),
        });
      });
      list.sort((a, b) => (b.lastLoginAt || '').localeCompare(a.lastLoginAt || ''));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, USERS_COLLECTION);
    }
  );
}

/**
 * Real-time listener for user's personal secured purchases & library.
 */
export function subscribeToUserPurchases(
  userId: string,
  onUpdate: (purchases: UserPurchase[]) => void
): () => void {
  const colRef = collection(db, USERS_COLLECTION, userId, 'purchases');
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: UserPurchase[] = [];
      snapshot.forEach((snap) => {
        list.push(snap.data() as UserPurchase);
      });
      list.sort((a, b) => (b.purchasedAt || '').localeCompare(a.purchasedAt || ''));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `${USERS_COLLECTION}/${userId}/purchases`);
    }
  );
}

/**
 * Records a purchased item directly to the user's personal vault (ensures parent user doc exists first).
 */
export async function recordUserPurchase(userId: string, purchase: UserPurchase): Promise<void> {
  const docPath = `${USERS_COLLECTION}/${userId}/purchases/${purchase.id}`;
  try {
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await syncUserProfileToFirestore(auth.currentUser);
    }
    const licenseKey =
      purchase.licenseKey ||
      generateDeterministicLicenseKey(purchase.title, auth.currentUser?.email, purchase.trxId || purchase.id);

    const payload: UserPurchase = {
      id: purchase.id,
      productId: purchase.productId || purchase.id,
      title: purchase.title,
      category: purchase.category || 'Plugin',
      downloadUrl: purchase.downloadUrl || '',
      purchasedAt: purchase.purchasedAt || new Date().toISOString(),
      trxId: purchase.trxId || '',
      licenseKey,
    };

    const docRef = doc(db, USERS_COLLECTION, userId, 'purchases', purchase.id);
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
    throw err;
  }
}

/**
 * Logs a customer download event to Firestore /users/{uid}/downloads/{downloadId}.
 */
export async function recordDownloadHistory(
  userId: string,
  entry: {
    purchaseId?: string;
    title: string;
    category?: string;
    licenseKey?: string;
    sessionToken?: string;
  }
): Promise<void> {
  const downloadId = `DL-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const docPath = `${USERS_COLLECTION}/${userId}/downloads/${downloadId}`;
  try {
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await syncUserProfileToFirestore(auth.currentUser);
    }
    await setDoc(doc(db, USERS_COLLECTION, userId, 'downloads', downloadId), {
      id: downloadId,
      userId,
      purchaseId: entry.purchaseId || '',
      title: entry.title.slice(0, 200),
      category: (entry.category || 'Digital Asset').slice(0, 80),
      licenseKey: (entry.licenseKey || '').slice(0, 120),
      sessionToken: (entry.sessionToken || '').slice(0, 120),
      downloadedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, docPath);
  }
}

/**
 * Real-time listener for user's download history.
 */
export function subscribeToDownloadHistory(
  userId: string,
  onUpdate: (logs: DownloadHistoryItem[]) => void
): () => void {
  const colRef = collection(db, USERS_COLLECTION, userId, 'downloads');
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: DownloadHistoryItem[] = [];
      snapshot.forEach((snap) => {
        const data = snap.data();
        list.push({
          id: String(data.id || snap.id),
          userId: String(data.userId || userId),
          purchaseId: data.purchaseId ? String(data.purchaseId) : undefined,
          title: String(data.title || 'Digital Asset'),
          category: data.category ? String(data.category) : undefined,
          licenseKey: data.licenseKey ? String(data.licenseKey) : undefined,
          sessionToken: data.sessionToken ? String(data.sessionToken) : undefined,
          downloadedAt: formatTimestampField(data.downloadedAt),
        });
      });
      list.sort((a, b) => (b.downloadedAt || '').localeCompare(a.downloadedAt || ''));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `${USERS_COLLECTION}/${userId}/downloads`);
    }
  );
}

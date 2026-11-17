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
  deleteField,
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
const PRODUCT_SECRETS_COLLECTION = 'productSecrets';
const SETTINGS_COLLECTION = 'settings';
const ORDERS_COLLECTION = 'orders';
const USERS_COLLECTION = 'users';
const PAYMENT_CONFIG_DOC = 'paymentConfig';
const ADMIN_CONFIG_DOC = 'adminConfig';

function stripPublicSecretUrl(product: ProductItem): ProductItem {
  if ((Number(product.price) > 0 || product.type !== 'Free Tutorial') && 'protectedUrl' in product) {
    const { protectedUrl: _omit, ...rest } = product;
    return rest as ProductItem;
  }
  return product;
}

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
 * Firestore /products is the strict single source of truth — never auto-seeds, never resurrects deleted items from localStorage.
 */
export function subscribeToProducts(
  onUpdate: (products: ProductItem[]) => void,
  onError?: (errInfo: FirestoreErrorInfo) => void,
  isAdminVerified = false
): () => void {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const cloudList: ProductItem[] = [];
      snapshot.forEach((docSnap) => {
        if (OBSOLETE_PRODUCT_IDS.has(docSnap.id)) {
          return;
        }
        const rawData = docSnap.data() as Record<string, any>;
        const priceNum = Number(rawData.price) || 0;
        const normalized: ProductItem = {
          id: docSnap.id,
          type: (rawData.type as ProductItem['type']) || 'Plugin',
          category: String(rawData.category || 'General'),
          title: String(rawData.title || ''),
          description: String(rawData.description || ''),
          price: priceNum,
          isFree: typeof rawData.isFree === 'boolean' ? rawData.isFree : priceNum === 0,
          priceDisplay:
            typeof rawData.priceDisplay === 'string' && rawData.priceDisplay
              ? rawData.priceDisplay
              : priceNum === 0
              ? 'Free'
              : `৳${priceNum.toLocaleString()}`,
          period: rawData.period ? String(rawData.period) : undefined,
          thumbnailUrl: rawData.thumbnailUrl ? String(rawData.thumbnailUrl) : undefined,
          iconUrl: rawData.iconUrl ? String(rawData.iconUrl) : undefined,
          launchUrl: rawData.launchUrl ? String(rawData.launchUrl) : undefined,
          protectedUrl:
            rawData.type === 'Free Tutorial' && priceNum === 0 && rawData.protectedUrl
              ? String(rawData.protectedUrl)
              : undefined,
          features: Array.isArray(rawData.features)
            ? rawData.features.filter((f): f is string => typeof f === 'string').slice(0, 15)
            : undefined,
          status:
            rawData.status === 'draft' || rawData.status === 'archived'
              ? rawData.status
              : 'active',
          duration: rawData.duration ? String(rawData.duration) : undefined,
          instructor: rawData.instructor ? String(rawData.instructor) : undefined,
          featured: typeof rawData.featured === 'boolean' ? rawData.featured : undefined,
          createdAt: rawData.createdAt ? String(rawData.createdAt) : undefined,
          updatedAt: rawData.updatedAt ? String(rawData.updatedAt) : undefined,
        };

        // Migrate any legacy protectedUrl on non-tutorial items into /productSecrets when verified Admin is viewing
        if (
          isAdminVerified &&
          normalized.type !== 'Free Tutorial' &&
          typeof rawData.protectedUrl === 'string' &&
          rawData.protectedUrl.trim().length > 0
        ) {
          setDoc(
            doc(db, PRODUCT_SECRETS_COLLECTION, docSnap.id),
            {
              id: docSnap.id,
              protectedUrl: rawData.protectedUrl.trim(),
              updatedAt: new Date().toISOString(),
            },
            { merge: false }
          )
            .then(() =>
              updateDoc(docSnap.ref, {
                protectedUrl: deleteField(),
              }).catch(() => {})
            )
            .catch(() => {});
        }

        cloudList.push(stripPublicSecretUrl(normalized));
      });

      cloudList.sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''));
      onUpdate(cloudList);
    },
    (err) => {
      const info = handleFirestoreError(err, OperationType.LIST, PRODUCTS_COLLECTION);
      if (onError) onError(info);
    }
  );
}

/**
 * Admin-only real-time listener for protected product download URLs in /productSecrets.
 * Never subscribe for unauthenticated or non-admin users.
 */
export function subscribeToProductSecrets(
  onUpdate: (secretsMap: Record<string, string>) => void
): () => void {
  const colRef = collection(db, PRODUCT_SECRETS_COLLECTION);
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const secretsMap: Record<string, string> = {};
      snapshot.forEach((snap) => {
        const data = snap.data();
        const id = String(data.id || snap.id);
        const url = typeof data.protectedUrl === 'string' ? data.protectedUrl.trim() : '';
        if (id && url) {
          secretsMap[id] = url;
        }
      });
      onUpdate(secretsMap);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, PRODUCT_SECRETS_COLLECTION);
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
 * Saves or updates a single product in Firestore (Admin only) with full server-write verification.
 * All non-tutorial protectedUrl values are written exclusively to /productSecrets/{id} and excluded from /products/{id}.
 */
export async function saveProductToFirestore(product: ProductItem): Promise<ProductItem> {
  if (!product.id || !/^[a-zA-Z0-9_-]+$/.test(product.id)) {
    throw new Error('Invalid product ID format (alphanumeric, hyphens, and underscores only).');
  }

  const docPath = `${PRODUCTS_COLLECTION}/${product.id}`;
  const priceNum = Number(product.price) || 0;
  const isFree = typeof product.isFree === 'boolean' ? product.isFree : priceNum === 0;
  const effectivePrice = isFree ? 0 : priceNum;
  const nowIso = new Date().toISOString();

  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
    const cleaned: Record<string, any> = {
      id: product.id,
      type: product.type || 'Plugin',
      category: (product.category || 'General').trim().slice(0, 80),
      title: (product.title || '').trim().slice(0, 200),
      description: (product.description || '').trim().slice(0, 3000),
      price: effectivePrice,
      isFree,
      priceDisplay:
        product.priceDisplay ||
        (effectivePrice === 0 ? 'Free' : `৳${effectivePrice.toLocaleString()}`),
      status: product.status || 'active',
      createdAt: (product.createdAt || nowIso.split('T')[0]).slice(0, 64),
      updatedAt: nowIso,
    };

    if (product.thumbnailUrl && product.thumbnailUrl.trim()) {
      cleaned.thumbnailUrl = product.thumbnailUrl.trim().slice(0, 1000);
    }
    if (product.iconUrl && product.iconUrl.trim()) {
      cleaned.iconUrl = product.iconUrl.trim().slice(0, 1000);
    }
    if (product.launchUrl && product.launchUrl.trim()) {
      cleaned.launchUrl = product.launchUrl.trim().slice(0, 1000);
    }
    if (product.period && product.period.trim()) {
      cleaned.period = product.period.trim().slice(0, 40);
    }
    if (product.duration && product.duration.trim()) {
      cleaned.duration = product.duration.trim().slice(0, 60);
    }
    if (product.instructor && product.instructor.trim()) {
      cleaned.instructor = product.instructor.trim().slice(0, 120);
    }
    if (typeof product.featured === 'boolean') {
      cleaned.featured = product.featured;
    }
    if (Array.isArray(product.features) && product.features.length > 0) {
      cleaned.features = product.features
        .map((f) => f.trim().slice(0, 200))
        .filter(Boolean)
        .slice(0, 15);
    }

    // Only Free Tutorials store public YouTube playback links inside /products/{id}
    if (cleaned.type === 'Free Tutorial' && effectivePrice === 0 && product.protectedUrl) {
      cleaned.protectedUrl = product.protectedUrl.trim().slice(0, 1000);
    }

    // Use canonical overwrite ({ merge: false }) so stale shadow fields can never violate security rules
    await setDoc(docRef, cleaned, { merge: false });

    // Manage /productSecrets/{id} for Software, Plugins, Courses, Agency Packages
    if (cleaned.type !== 'Free Tutorial') {
      if (typeof product.protectedUrl === 'string' && product.protectedUrl.trim()) {
        await setDoc(
          doc(db, PRODUCT_SECRETS_COLLECTION, product.id),
          {
            id: product.id,
            protectedUrl: product.protectedUrl.trim().slice(0, 1000),
            updatedAt: nowIso,
          },
          { merge: false }
        );
      } else if (product.protectedUrl === '') {
        await deleteDoc(doc(db, PRODUCT_SECRETS_COLLECTION, product.id)).catch(() => {});
      }
    }

    // Verify persistence directly on Firestore server
    const verifiedSnap = await getDocFromServer(docRef);
    if (!verifiedSnap.exists()) {
      throw new Error('Product write could not be verified on the Firestore server.');
    }

    const saved = verifiedSnap.data() as ProductItem;
    return stripPublicSecretUrl({ ...saved, id: verifiedSnap.id });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
    throw err;
  }
}

/**
 * Deletes a product (and any associated secret URL) from Firestore (Admin only) and verifies deletion.
 */
export async function deleteProductFromFirestore(id: string): Promise<void> {
  const docPath = `${PRODUCTS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
    await deleteDoc(doc(db, PRODUCT_SECRETS_COLLECTION, id)).catch(() => {});

    const verifySnap = await getDocFromServer(docRef);
    if (verifySnap.exists()) {
      throw new Error('Product still exists on Firestore server after delete request.');
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
    throw err;
  }
}

/**
 * Explicit manual Admin utility: seeds missing default MirrorPOS or default catalog items ONLY when invoked by Admin.
 */
export async function ensureMirrorPOSProductInFirestore(): Promise<ProductItem> {
  const mirrorPosSeed = INITIAL_PRODUCTS.find((p) => p.id === 'software-mirrorpos');
  if (!mirrorPosSeed) {
    throw new Error('MirrorPOS template record not found.');
  }
  return saveProductToFirestore(mirrorPosSeed);
}

/**
 * Explicit manual Admin utility: deletes legacy obsolete demo IDs if present in Firestore.
 */
export async function cleanupObsoleteProductsFromFirestore(): Promise<number> {
  let removed = 0;
  for (const oldId of OBSOLETE_PRODUCT_IDS) {
    try {
      const ref = doc(db, PRODUCTS_COLLECTION, oldId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await deleteDoc(ref);
        await deleteDoc(doc(db, PRODUCT_SECRETS_COLLECTION, oldId)).catch(() => {});
        removed++;
      }
    } catch {
      // ignore non-existent or permission issues per doc
    }
  }
  return removed;
}

/**
 * Explicit manual Admin utility to seed initial products if desired. Never runs automatically.
 */
export async function seedProductsIfEmpty(): Promise<number> {
  let count = 0;
  for (const item of INITIAL_PRODUCTS) {
    if (OBSOLETE_PRODUCT_IDS.has(item.id)) continue;
    await saveProductToFirestore(item);
    count++;
  }
  return count;
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
 * Saves a strictly Pending customer order in Firestore (Verified/Completed states can only be written by backend Admin SDK or verified Admin).
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
      status: 'Pending',
      downloadUrl: '',
    };
    if (auth.currentUser?.uid) payload.userId = auth.currentUser.uid;
    if (order.productId) payload.productId = order.productId;

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
 * Purchase records under users/{uid}/purchases are strictly written server-side by the Firebase Admin SDK
 * inside /api/orders/submit-and-verify or /api/orders/admin-approve. Client writes are blocked by firestore.rules.
 */
export async function recordUserPurchase(_userId: string, _purchase: UserPurchase): Promise<void> {
  throw new Error('Client-side purchase writes are disabled for security. Verified purchases are provisioned by the backend.');
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

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ProductItem, PaymentConfig, Order, UserPurchase } from '../types';
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Context:', JSON.stringify(errInfo));
  return errInfo;
}

// Collections
const PRODUCTS_COLLECTION = 'products';
const SETTINGS_COLLECTION = 'settings';
const ORDERS_COLLECTION = 'orders';
const PAYMENT_CONFIG_DOC = 'paymentConfig';

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
 * Real-time listener for products.
 * Automatically pushes updates to all connected visitors globally.
 * Seamlessly handles offline cache and real-time cloud data.
 */
export function subscribeToProducts(
  onUpdate: (products: ProductItem[]) => void
): () => void {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      // If server confirmed the collection is empty, seed defaults
      if (snapshot.empty && !snapshot.metadata.fromCache) {
        seedProductsIfEmpty().catch(() => {});
        return;
      }

      if (!snapshot.empty) {
        const list: ProductItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as ProductItem);
        });

        // Sort by creation date if available
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        onUpdate(list);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, PRODUCTS_COLLECTION);
    }
  );
}

/**
 * Saves or updates a single product in Firestore.
 */
export async function saveProductToFirestore(product: ProductItem): Promise<void> {
  const docPath = `${PRODUCTS_COLLECTION}/${product.id}`;
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(docRef, product, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
    throw err;
  }
}

/**
 * Deletes a product from Firestore.
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
 * Seeds initial products into Firestore if database collection is empty.
 */
export async function seedProductsIfEmpty(): Promise<void> {
  try {
    for (const item of INITIAL_PRODUCTS) {
      await setDoc(doc(db, PRODUCTS_COLLECTION, item.id), item, { merge: true });
    }
  } catch (err) {
    console.warn('Seeding initial products notification:', err);
  }
}

/**
 * Real-time listener for Payment Configuration (phone numbers, bank details, Telegram).
 */
export function subscribeToPaymentConfig(
  onUpdate: (config: PaymentConfig) => void
): () => void {
  const docRef = doc(db, SETTINGS_COLLECTION, PAYMENT_CONFIG_DOC);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as PaymentConfig;
        onUpdate({
          ...DEFAULT_PAYMENT_CONFIG,
          ...data,
        });
      } else if (!docSnap.metadata.fromCache) {
        // Only seed default payment config if the server confirmed it does not exist
        savePaymentConfigToFirestore(DEFAULT_PAYMENT_CONFIG).catch(() => {});
        onUpdate(DEFAULT_PAYMENT_CONFIG);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `${SETTINGS_COLLECTION}/${PAYMENT_CONFIG_DOC}`);
    }
  );
}

/**
 * Saves payment config to Firestore so anyone in the world sees the updated numbers live.
 */
export async function savePaymentConfigToFirestore(config: PaymentConfig): Promise<void> {
  const docPath = `${SETTINGS_COLLECTION}/${PAYMENT_CONFIG_DOC}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, PAYMENT_CONFIG_DOC);
    await setDoc(docRef, config, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
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
    await setDoc(docRef, order);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, docPath);
    throw err;
  }
}

/**
 * Real-time listener for orders in the Admin panel.
 */
export function subscribeToOrders(
  onUpdate: (orders: Order[]) => void
): () => void {
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
 * Deletes an order from Firestore.
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
 * Signs in user with Google One-Click Auth.
 */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err) {
    console.error('Google Sign In error:', err);
    throw err;
  }
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
 * Real-time listener for user's personal secured purchases & library.
 */
export function subscribeToUserPurchases(
  userId: string,
  onUpdate: (purchases: UserPurchase[]) => void
): () => void {
  const colRef = collection(db, 'users', userId, 'purchases');
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
      handleFirestoreError(err, OperationType.LIST, `users/${userId}/purchases`);
    }
  );
}

/**
 * Records a purchased item directly to the user's personal vault.
 */
export async function recordUserPurchase(userId: string, purchase: UserPurchase): Promise<void> {
  const docPath = `users/${userId}/purchases/${purchase.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'purchases', purchase.id);
    await setDoc(docRef, purchase, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
    throw err;
  }
}

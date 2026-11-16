import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, cert, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function loadClientConfigFallback(): { projectId: string; firestoreDatabaseId: string } {
  const defaults = {
    projectId: 'gen-lang-client-0913481345',
    firestoreDatabaseId: 'ai-studio-mirrorbookreflec-fe0670c8-e16c-43f8-9a82-2943f7012d01',
  };
  try {
    const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      return {
        projectId: parsed.projectId || defaults.projectId,
        firestoreDatabaseId: parsed.firestoreDatabaseId || defaults.firestoreDatabaseId,
      };
    }
  } catch {
    // ignore file read fallback errors in restricted serverless bundles
  }
  return defaults;
}

const firebaseClientConfig = loadClientConfigFallback();

export interface AdminTransactionContext {
  get(collectionPath: string, docId: string): Promise<Record<string, any> | null>;
  set(collectionPath: string, docId: string, data: Record<string, any>): void;
  update(collectionPath: string, docId: string, data: Record<string, any>): void;
}

export interface AdminStore {
  getDoc(collectionPath: string, docId: string): Promise<Record<string, any> | null>;
  setDoc(collectionPath: string, docId: string, data: Record<string, any>): Promise<void>;
  listDocs(collectionPath: string, limitCount?: number): Promise<Record<string, any>[]>;
  runTransaction<T>(fn: (tx: AdminTransactionContext) => Promise<T>): Promise<T>;
}

let cachedAdminApp: App | null = null;
let cachedAdminDb: Firestore | null = null;

function resolveServiceAccount(): Record<string, any> | null {
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (rawKey) {
    try {
      const jsonStr = rawKey.startsWith('{')
        ? rawKey
        : Buffer.from(rawKey, 'base64').toString('utf8');
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.private_key && parsed.client_email) {
        if (typeof parsed.private_key === 'string') {
          parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
        }
        return parsed;
      }
    } catch (err) {
      console.error('[firebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', err);
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim() || firebaseClientConfig.projectId;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();

  if (projectId && clientEmail && privateKey) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    };
  }

  return null;
}

export function isFirebaseAdminConfigured(): boolean {
  return resolveServiceAccount() !== null;
}

export function getAdminFirestore(): Firestore {
  if (cachedAdminDb) return cachedAdminDb;

  const serviceAccount = resolveServiceAccount();
  if (!serviceAccount) {
    throw new Error(
      'Firebase Admin SDK credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
    );
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    serviceAccount.project_id ||
    firebaseClientConfig.projectId;
  const databaseId =
    process.env.FIREBASE_DATABASE_ID?.trim() ||
    firebaseClientConfig.firestoreDatabaseId ||
    '(default)';

  if (!cachedAdminApp) {
    if (getApps().length > 0) {
      cachedAdminApp = getApp();
    } else {
      cachedAdminApp = initializeApp({
        credential: cert(serviceAccount as any),
        projectId,
      });
    }
  }

  cachedAdminDb = getFirestore(cachedAdminApp, databaseId);
  return cachedAdminDb;
}

export function createFirebaseAdminStore(dbInstance?: Firestore): AdminStore {
  const db = dbInstance || getAdminFirestore();

  return {
    async getDoc(collectionPath: string, docId: string) {
      const snap = await db.collection(collectionPath).doc(docId).get();
      return snap.exists ? (snap.data() as Record<string, any>) : null;
    },
    async setDoc(collectionPath: string, docId: string, data: Record<string, any>) {
      await db.collection(collectionPath).doc(docId).set(data, { merge: true });
    },
    async listDocs(collectionPath: string, limitCount = 100) {
      const snap = await db.collection(collectionPath).limit(limitCount).get();
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, any>) }));
    },
    async runTransaction<T>(fn: (tx: AdminTransactionContext) => Promise<T>): Promise<T> {
      return db.runTransaction(async (firestoreTx) => {
        const txCtx: AdminTransactionContext = {
          async get(collectionPath: string, docId: string) {
            const ref = db.collection(collectionPath).doc(docId);
            const snap = await firestoreTx.get(ref);
            return snap.exists ? (snap.data() as Record<string, any>) : null;
          },
          set(collectionPath: string, docId: string, data: Record<string, any>) {
            const ref = db.collection(collectionPath).doc(docId);
            firestoreTx.set(ref, data, { merge: true });
          },
          update(collectionPath: string, docId: string, data: Record<string, any>) {
            const ref = db.collection(collectionPath).doc(docId);
            firestoreTx.set(ref, data, { merge: true });
          },
        };
        return fn(txCtx);
      });
    },
  };
}

/**
 * Transactional in-memory AdminStore for deterministic automated testing
 * (mirrors Firestore snapshot isolation + atomic commit/rollback semantics).
 */
export function createInMemoryAdminStore(
  initialData: Record<string, Record<string, Record<string, any>>> = {}
): AdminStore & { dump: () => Record<string, Record<string, Record<string, any>>> } {
  const store = new Map<string, Record<string, any>>();

  for (const [colPath, docs] of Object.entries(initialData)) {
    for (const [docId, docData] of Object.entries(docs)) {
      store.set(`${colPath}/${docId}`, structuredClone(docData));
    }
  }

  let txMutex: Promise<void> = Promise.resolve();

  return {
    async getDoc(collectionPath: string, docId: string) {
      const val = store.get(`${collectionPath}/${docId}`);
      return val ? structuredClone(val) : null;
    },
    async setDoc(collectionPath: string, docId: string, data: Record<string, any>) {
      const key = `${collectionPath}/${docId}`;
      const existing = store.get(key) || {};
      store.set(key, structuredClone({ ...existing, ...data }));
    },
    async listDocs(collectionPath: string, limitCount = 100) {
      const prefix = `${collectionPath}/`;
      const results: Record<string, any>[] = [];
      for (const [k, v] of store.entries()) {
        if (k.startsWith(prefix) && !k.slice(prefix.length).includes('/')) {
          results.push({ id: k.slice(prefix.length), ...structuredClone(v) });
          if (results.length >= limitCount) break;
        }
      }
      return results;
    },
    async runTransaction<T>(fn: (tx: AdminTransactionContext) => Promise<T>): Promise<T> {
      let release!: () => void;
      const prev = txMutex;
      txMutex = new Promise<void>((resolve) => {
        release = resolve;
      });
      await prev;

      try {
        const pendingWrites: { key: string; data: Record<string, any> }[] = [];
        const txCtx: AdminTransactionContext = {
          async get(collectionPath: string, docId: string) {
            const key = `${collectionPath}/${docId}`;
            const val = store.get(key);
            return val ? structuredClone(val) : null;
          },
          set(collectionPath: string, docId: string, data: Record<string, any>) {
            const key = `${collectionPath}/${docId}`;
            const existing = store.get(key) || {};
            pendingWrites.push({ key, data: structuredClone({ ...existing, ...data }) });
          },
          update(collectionPath: string, docId: string, data: Record<string, any>) {
            const key = `${collectionPath}/${docId}`;
            const existing = store.get(key) || {};
            pendingWrites.push({ key, data: structuredClone({ ...existing, ...data }) });
          },
        };

        const result = await fn(txCtx);
        for (const w of pendingWrites) {
          store.set(w.key, w.data);
        }
        return result;
      } finally {
        release();
      }
    },
    dump() {
      const out: Record<string, Record<string, Record<string, any>>> = {};
      for (const [key, val] of store.entries()) {
        const lastSlash = key.lastIndexOf('/');
        const col = key.slice(0, lastSlash);
        const id = key.slice(lastSlash + 1);
        if (!out[col]) out[col] = {};
        out[col][id] = structuredClone(val);
      }
      return out;
    },
  };
}

export function generateServerLicenseKey(title: string, email?: string | null, seed?: string): string {
  const cleanProd = (title || 'ASSET').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'ASSET';
  const emailPrefix =
    ((email || 'USER').split('@')[0] || 'USER').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'USER';
  const suffix = (seed || '0000').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || 'ACTIVE';
  return `MB-${cleanProd}-${emailPrefix}-${suffix}`;
}

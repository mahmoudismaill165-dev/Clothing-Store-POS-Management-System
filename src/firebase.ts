// Firebase Integration for Al-Saqr Apparel POS
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  collection, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId if configured
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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
  }
}

/**
 * Robustly handles Firestore errors by throwing a structured JSON error conformant with the Firebase skill guidelines.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const auth = getAuth();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Subscribes to a Firestore collection in real-time.
 * If the collection is empty, it automatically seeds it using local/initial default data.
 */
export function subscribeCollection<T extends { id: string }>(
  collectionKey: string,
  localDefault: T[],
  onUpdate: (data: T[]) => void,
  onLoaded?: () => void
) {
  const collectionName = `cloth_pos_${collectionKey}`;
  const colRef = collection(db, collectionName);

  return onSnapshot(colRef, async (snapshot) => {
    const items: T[] = [];
    snapshot.forEach((doc) => {
      items.push(doc.data() as T);
    });

    if (snapshot.empty) {
      // Retrieve existing data from localStorage or fallback to localDefault
      const cached = localStorage.getItem(`cloth_pos_${collectionKey}`);
      let localData: T[] = [];
      try {
        localData = cached ? JSON.parse(cached) : localDefault;
      } catch {
        localData = localDefault;
      }

      if (localData && localData.length > 0) {
        console.log(`Seeding firestore collection ${collectionName} with ${localData.length} items`);
        try {
          const batch = writeBatch(db);
          const chunks = [];
          for (let i = 0; i < localData.length; i += 400) {
            chunks.push(localData.slice(i, i + 400));
          }

          for (const chunk of chunks) {
            const chunkBatch = writeBatch(db);
            chunk.forEach((item) => {
              const docRef = doc(colRef, item.id);
              chunkBatch.set(docRef, item);
            });
            await chunkBatch.commit();
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, collectionName);
        }
      }
      onUpdate(localData);
      if (onLoaded) onLoaded();
    } else {
      // Check if cached data matches received data to avoid redundant re-renders
      const cached = localStorage.getItem(`cloth_pos_${collectionKey}`);
      if (cached) {
        try {
          const cachedParsed = JSON.parse(cached);
          if (JSON.stringify(cachedParsed) === JSON.stringify(items)) {
            // Already in sync, skip triggering state update to avoid infinite loops
            if (onLoaded) onLoaded();
            return;
          }
        } catch {}
      }

      // Update localStorage cache and call the state updater
      localStorage.setItem(`cloth_pos_${collectionKey}`, JSON.stringify(items));
      onUpdate(items);
      if (onLoaded) onLoaded();
    }
  }, (error) => {
    console.error(`Error subscribing to ${collectionName}:`, error);
    // If permission or connection issues occur, fallback to local storage
    const cached = localStorage.getItem(`cloth_pos_${collectionKey}`);
    if (cached) {
      try {
        onUpdate(JSON.parse(cached));
      } catch {
        onUpdate(localDefault);
      }
    } else {
      onUpdate(localDefault);
    }
    if (onLoaded) onLoaded();
    
    // Structure error to let the platform system inspect it
    try {
      handleFirestoreError(error, OperationType.GET, collectionName);
    } catch {}
  });
}

/**
 * Subscribes to settings document in real-time.
 * If not present in Firestore, seeds it using local/initial default settings.
 */
export function subscribeSettings<T>(
  onUpdate: (settings: T) => void,
  defaultSettings: T,
  onLoaded?: () => void
) {
  const pathForSettings = 'cloth_pos_config/settings';
  const docRef = doc(db, 'cloth_pos_config', 'settings');

  return onSnapshot(docRef, async (snapshot) => {
    if (!snapshot.exists()) {
      const cached = localStorage.getItem('cloth_pos_settings');
      let localSetts: T = defaultSettings;
      try {
        localSetts = cached ? JSON.parse(cached) : defaultSettings;
      } catch {
        localSetts = defaultSettings;
      }

      try {
        await setDoc(docRef, localSetts as any);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, pathForSettings);
      }
      onUpdate(localSetts);
      if (onLoaded) onLoaded();
    } else {
      const data = snapshot.data() as T;
      
      const cached = localStorage.getItem('cloth_pos_settings');
      if (cached) {
        try {
          const cachedParsed = JSON.parse(cached);
          if (JSON.stringify(cachedParsed) === JSON.stringify(data)) {
            if (onLoaded) onLoaded();
            return;
          }
        } catch {}
      }

      localStorage.setItem('cloth_pos_settings', JSON.stringify(data));
      onUpdate(data);
      if (onLoaded) onLoaded();
    }
  }, (error) => {
    console.error("Error subscribing to settings:", error);
    const cached = localStorage.getItem('cloth_pos_settings');
    if (cached) {
      try {
        onUpdate(JSON.parse(cached));
      } catch {
        onUpdate(defaultSettings);
      }
    } else {
      onUpdate(defaultSettings);
    }
    if (onLoaded) onLoaded();

    try {
      handleFirestoreError(error, OperationType.GET, pathForSettings);
    } catch {}
  });
}

/**
 * Smart-synchronizes a local array with Firestore.
 * Detects additions, modifications, and deletions, then sends minimal updates to Firestore.
 */
export async function syncCollectionToFirestore<T extends { id: string }>(
  collectionKey: string,
  localItems: T[]
) {
  const collectionName = `cloth_pos_${collectionKey}`;
  const colRef = collection(db, collectionName);

  try {
    const snapshot = await getDocs(colRef);
    const remoteDocs = new Map<string, any>();
    snapshot.forEach((doc) => {
      remoteDocs.set(doc.id, doc.data());
    });

    const batch = writeBatch(db);
    let opsCount = 0;

    const localIds = new Set(localItems.map(item => item.id));

    // 1. Set/update documents that are new or changed
    localItems.forEach((item) => {
      const remoteDoc = remoteDocs.get(item.id);
      if (!remoteDoc || JSON.stringify(remoteDoc) !== JSON.stringify(item)) {
        const docRef = doc(colRef, item.id);
        batch.set(docRef, item);
        opsCount++;
      }
    });

    // 2. Delete documents that are in Firestore but not in local state
    remoteDocs.forEach((_, remoteId) => {
      if (!localIds.has(remoteId)) {
        const docRef = doc(colRef, remoteId);
        batch.delete(docRef);
        opsCount++;
      }
    });

    if (opsCount > 0) {
      await batch.commit();
      console.log(`[SmartSync] Successfully synced ${opsCount} changes to Firestore for ${collectionName}`);
    }
  } catch (error) {
    console.error(`Error during smart sync of ${collectionName}:`, error);
    handleFirestoreError(error, OperationType.WRITE, collectionName);
  }
}

/**
 * Pushes a single item update to Firestore.
 */
export async function saveDocToFirestore<T extends { id: string }>(
  collectionKey: string,
  item: T
) {
  const collectionName = `cloth_pos_${collectionKey}`;
  try {
    const docRef = doc(db, collectionName, item.id);
    await setDoc(docRef, item);
  } catch (err) {
    console.error(`Error saving doc to ${collectionName}:`, err);
    handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${item.id}`);
  }
}

/**
 * Deletes a single item from Firestore.
 */
export async function deleteDocFromFirestore(
  collectionKey: string,
  itemId: string
) {
  const collectionName = `cloth_pos_${collectionKey}`;
  try {
    const docRef = doc(db, collectionName, itemId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Error deleting doc from ${collectionName}:`, err);
    handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${itemId}`);
  }
}

/**
 * Saves store settings.
 */
export async function saveSettingsToFirestore<T>(
  settings: T
) {
  const pathForSettings = 'cloth_pos_config/settings';
  try {
    const docRef = doc(db, 'cloth_pos_config', 'settings');
    await setDoc(docRef, settings as any);
  } catch (err) {
    console.error("Error saving settings to Firestore:", err);
    handleFirestoreError(err, OperationType.WRITE, pathForSettings);
  }
}

/**
 * Replaces or updates the entire collection in Firestore (e.g. on bulk clear or full array reset)
 */
export async function replaceCollectionInFirestore<T extends { id: string }>(
  collectionKey: string,
  items: T[]
) {
  const collectionName = `cloth_pos_${collectionKey}`;
  const colRef = collection(db, collectionName);
  
  try {
    const snapshot = await getDocs(colRef);
    const deleteBatch = writeBatch(db);
    snapshot.forEach((doc) => {
      deleteBatch.delete(doc.ref);
    });
    await deleteBatch.commit();

    if (items.length > 0) {
      const chunks = [];
      for (let i = 0; i < items.length; i += 400) {
        chunks.push(items.slice(i, i + 400));
      }

      for (const chunk of chunks) {
        const writeBatchObj = writeBatch(db);
        chunk.forEach((item) => {
          const docRef = doc(colRef, item.id);
          writeBatchObj.set(docRef, item);
        });
        await writeBatchObj.commit();
      }
    }
  } catch (error) {
    console.error(`Error replacing collection ${collectionName}:`, error);
    handleFirestoreError(error, OperationType.WRITE, collectionName);
  }
}

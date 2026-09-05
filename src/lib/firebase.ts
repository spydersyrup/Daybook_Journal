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
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import type { JournalEntry, UserProfile } from '../types';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use the database ID from config if defined, otherwise default
const databaseId = firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
  ? firebaseConfigData.firestoreDatabaseId
  : undefined;

export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const signInWithGoogle = async (): Promise<UserProfile> => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
};

export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const getAuthToken = async (): Promise<string | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return await currentUser.getIdToken();
};

/**
 * Strips undefined values recursively before saving to Firestore to prevent crashes
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as unknown as T;
  }
  return obj;
}

/**
 * Strictly user-isolated Firestore Operations under /users/{userId}/entries/{entryId}
 */
export const saveJournalEntry = async (userId: string, entry: JournalEntry): Promise<void> => {
  if (!userId) throw new Error('User ID is required to save journal entry');
  if (auth.currentUser?.uid !== userId) {
    throw new Error('Unauthorized user attempt to save entry');
  }

  const entryRef = doc(db, 'users', userId, 'entries', entry.id);
  const sanitized = sanitizeForFirestore({
    ...entry,
    userId,
    updatedAt: Date.now(),
  });

  await setDoc(entryRef, sanitized, { merge: true });
};

export const deleteJournalEntry = async (userId: string, entryId: string): Promise<void> => {
  if (!userId) throw new Error('User ID is required');
  if (auth.currentUser?.uid !== userId) {
    throw new Error('Unauthorized user attempt to delete entry');
  }

  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryRef);
};

export const subscribeToUserEntries = (
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError: (error: Error) => void
) => {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as JournalEntry);
      });
      onUpdate(entries);
    },
    (err) => {
      console.error('Firestore subscription error:', err);
      onError(err);
    }
  );
};

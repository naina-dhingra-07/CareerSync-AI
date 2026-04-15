import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, updateDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use the database ID from config, but handle (default) correctly for the SDK
const firestoreDatabaseId = (firebaseConfig as any).firestoreDatabaseId && 
                            !(firebaseConfig as any).firestoreDatabaseId.includes('TODO') &&
                            (firebaseConfig as any).firestoreDatabaseId !== '' &&
                            (firebaseConfig as any).firestoreDatabaseId !== '(default)'
  ? (firebaseConfig as any).firestoreDatabaseId 
  : undefined;

export const db = firestoreDatabaseId ? getFirestore(app, firestoreDatabaseId) : getFirestore(app);

export { 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
};

// Error handling helper
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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
async function testConnection() {
  try {
    // Try to get a document from a collection that exists or should exist
    await getDocFromServer(doc(db, 'jobs', 'connection-test'));
  } catch (error: any) {
    console.warn("Firebase Connection Test Result:", error.message);
    if(error.message.includes('the client is offline') || error.message.includes('Failed to get document because the client is offline')) {
      console.error("CRITICAL: Firebase is offline. Please check your API Key restrictions and ensure Firestore is enabled in the console.");
    } else if (error.message.includes('permission-denied')) {
      console.info("Firebase connection successful (received permission-denied as expected for unauthenticated test).");
    }
  }
}
testConnection();

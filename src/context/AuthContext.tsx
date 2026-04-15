import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  db,
  OperationType,
  handleFirestoreError
} from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        // Set up real-time listener for user profile
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ ...firebaseUser, ...docSnap.data(), email: firebaseUser.email });
          } else {
            setUser(firebaseUser);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user data:", error);
          try {
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          } catch (e) {
            // Ignore
          }
          setUser(firebaseUser);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const login = async (data: any) => {
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
    } catch (error: any) {
      console.error('Login Error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/Password authentication is not enabled in the Firebase Console. Please enable it in the Authentication settings.');
      }
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Incorrect email or password. Please check your credentials and try again.');
      }
      if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      }
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const register = async (data: any) => {
    // Client-side password validation
    const password = data.password || '';
    const isLongEnough = password.length >= 6;

    if (!isLongEnough) {
      throw new Error('Password must be at least 6 characters long.');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (data.name) {
        await updateProfile(userCredential.user, { displayName: data.name });
      }
      
      // Create profile document with role
      const initialProfile = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: data.name || '',
        role: data.role || 'student',
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), initialProfile);
      
    } catch (error: any) {
      console.error('Registration Error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/Password authentication is not enabled in the Firebase Console. Please enable it in the Authentication settings.');
      }
      if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }
      if (error.code === 'auth/password-does-not-meet-requirements') {
        throw new Error('Password does not meet the security requirements. Please use a stronger password (e.g., 8+ characters with mixed case and symbols).');
      }
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please try logging in instead.');
      }
      if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid registration details. Please check your information and try again.');
      }
      throw error;
    }
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const firebaseUser = auth.currentUser;
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        setUser({ ...firebaseUser, ...userDoc.data() });
      } else {
        setUser(firebaseUser);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

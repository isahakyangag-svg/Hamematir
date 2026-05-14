import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider,
  sendPasswordResetEmail,
  signOut,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isPartner: boolean;
  isSupport: boolean;
  isFinance: boolean;
  isOwner: boolean;
  userRole: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, metadata?: any) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [isSupport, setIsSupport] = useState(false);
  const [isFinance, setIsFinance] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingMetadata, setPendingMetadata] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth State Changed:", user?.email, user?.uid);
      setUser(user);
      
      if (user) {
        // Sync user data to Firestore
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          let role = 'user';
          if (!userSnap.exists()) {
            role = pendingMetadata?.role || 'user';
            try {
              await setDoc(userRef, {
                displayName: user.displayName || pendingMetadata?.name || '',
                firstName: pendingMetadata?.firstName || '',
                lastName: pendingMetadata?.lastName || '',
                phone: pendingMetadata?.phone || '',
                role: role,
                storeUrl: pendingMetadata?.storeUrl || '',
                email: user.email || '',
                photoURL: user.photoURL || '',
                status: 'active',
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
            }
            setPendingMetadata(null);
          } else {
            const data = userSnap.data();
            role = data.role || 'user';
            try {
              await updateDoc(userRef, {
                lastLogin: serverTimestamp(),
                photoURL: user.photoURL || data.photoURL || ''
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
            }
          }
          setUserRole(role);
          setIsAdmin(role === 'admin' || role === 'owner');
          setIsOwner(role === 'owner');
          setIsPartner(role === 'partner');
          setIsSupport(role === 'support' || role === 'admin' || role === 'owner');
          setIsFinance(role === 'finance_manager' || role === 'admin' || role === 'owner');

        } catch (err) {
          console.error("User sync error:", err);
        }

        // Emergency Admin check
        const isEmergencyEmail = user.email?.toLowerCase() === 'admin@gmail.com' || 
                                user.email?.toLowerCase() === 'isahakyangag@gmail.com' ||
                                user.email?.toLowerCase() === 'gag.isahakyan.v@gmail.com';
        
        if (isEmergencyEmail) {
          setIsAdmin(true);
          setIsOwner(true);
          setUserRole('owner');
        }
      } else {
        setIsAdmin(false);
        setIsPartner(false);
        setIsSupport(false);
        setIsFinance(false);
        setIsOwner(false);
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithApple = async () => {
    const provider = new OAuthProvider('apple.com');
    await signInWithPopup(auth, provider);
  };

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (email: string, pass: string, name: string, metadata?: any) => {
    setPendingMetadata({ ...metadata, name });
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
  };

  const logout = () => signOut(auth);

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAdmin, 
      isPartner, 
      isSupport, 
      isFinance, 
      isOwner, 
      userRole, 
      loading, 
      signInWithGoogle, 
      signInWithApple, 
      login, 
      register, 
      logout, 
      resetPassword 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

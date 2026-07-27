import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { auth, firebaseEnabled, googleProvider } from "../lib/firebase";
import { ensureUserProfile } from "../lib/firestore/users";

type AuthValue = {
  user: User | null;
  loading: boolean;
  enabled: boolean;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseEnabled);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      if (nextUser) void ensureUserProfile(nextUser);
    });
  }, []);

  const value = useMemo<AuthValue>(() => ({
    user,
    loading,
    enabled: firebaseEnabled,
    signIn: async () => { if (auth) await signInWithPopup(auth, googleProvider); },
    signOutUser: async () => { if (auth) await signOut(auth); },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

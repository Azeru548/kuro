"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  getFirebaseAuth,
  getFirebaseDb,
  isFirebaseConfigured,
} from "@/lib/firebase/client";
import {
  createUserProfile,
  ensureUserProfile,
  type UserProfile,
} from "@/lib/firebase/users";
import type { UserRole } from "@/lib/types";

type AuthContextValue = {
  firebaseReady: boolean;
  loading: boolean;
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  error: string | null;
  signUp: (params: {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
  }) => Promise<UserProfile>;
  signIn: (params: { email: string; password: string }) => Promise<UserProfile>;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyAuthError(code: string, fallback: string) {
  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already registered. Try logging in.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a moment and try again.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is disabled in Firebase Console. Enable it under Authentication → Sign-in method.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "permission-denied":
      return "Firestore permission denied. Deploy security rules or set rules to allow authenticated user profile writes.";
    default:
      return fallback;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const firebaseReady = isFirebaseConfigured();
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (user: FirebaseUser) => {
    const db = getFirebaseDb();
    if (!db) {
      setProfile(null);
      return;
    }
    const p = await ensureUserProfile(db, {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName,
    });
    setProfile(p);
  }, []);

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      try {
        if (user) {
          await loadProfile(user);
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.error(e);
        setProfile(null);
        const code =
          e && typeof e === "object" && "code" in e
            ? String((e as { code: string }).code)
            : "";
        setError(
          friendlyAuthError(
            code,
            e instanceof Error ? e.message : "Failed to load profile"
          )
        );
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [firebaseReady, loadProfile]);

  const signUp = useCallback(
    async (params: {
      email: string;
      password: string;
      displayName: string;
      role: UserRole;
    }) => {
      setError(null);
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      if (!auth || !db) {
        throw new Error("Firebase is not configured.");
      }

      try {
        const cred = await createUserWithEmailAndPassword(
          auth,
          params.email.trim(),
          params.password
        );
        await updateProfile(cred.user, {
          displayName: params.displayName.trim(),
        });
        const p = await createUserProfile(db, {
          uid: cred.user.uid,
          email: params.email.trim(),
          displayName: params.displayName.trim(),
          role: params.role,
        });
        setProfile(p);
        return p;
      } catch (e) {
        const code =
          e && typeof e === "object" && "code" in e
            ? String((e as { code: string }).code)
            : "";
        const msg = friendlyAuthError(
          code,
          e instanceof Error ? e.message : "Sign up failed"
        );
        setError(msg);
        throw new Error(msg);
      }
    },
    []
  );

  const signIn = useCallback(async (params: { email: string; password: string }) => {
    setError(null);
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!auth || !db) {
      throw new Error("Firebase is not configured.");
    }

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        params.email.trim(),
        params.password
      );
      const p = await ensureUserProfile(db, {
        uid: cred.user.uid,
        email: cred.user.email || params.email.trim(),
        displayName: cred.user.displayName,
      });
      setProfile(p);
      return p;
    } catch (e) {
      const code =
        e && typeof e === "object" && "code" in e
          ? String((e as { code: string }).code)
          : "";
      const msg = friendlyAuthError(
        code,
        e instanceof Error ? e.message : "Log in failed"
      );
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const logOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await signOut(auth);
    setProfile(null);
    setFirebaseUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) return;
    await loadProfile(firebaseUser);
  }, [firebaseUser, loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseReady,
      loading,
      firebaseUser,
      profile,
      error,
      signUp,
      signIn,
      logOut,
      refreshProfile,
      clearError: () => setError(null),
    }),
    [
      firebaseReady,
      loading,
      firebaseUser,
      profile,
      error,
      signUp,
      signIn,
      logOut,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

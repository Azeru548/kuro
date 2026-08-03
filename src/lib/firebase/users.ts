import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import type { User, UserRole } from "@/lib/types";

export type UserProfile = User & {
  updatedAt?: string;
};

function mapUser(id: string, data: Record<string, unknown>): UserProfile {
  return {
    id,
    email: String(data.email ?? ""),
    displayName: String(data.displayName ?? "User"),
    role: (data.role as UserRole) ?? "client",
    photoURL: data.photoURL ? String(data.photoURL) : undefined,
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : new Date().toISOString(),
  };
}

export async function getUserProfile(
  db: Firestore,
  uid: string
): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return mapUser(snap.id, snap.data() as Record<string, unknown>);
}

export async function createUserProfile(
  db: Firestore,
  params: {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
  }
): Promise<UserProfile> {
  const ref = doc(db, "users", params.uid);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    return mapUser(existing.id, existing.data() as Record<string, unknown>);
  }

  const now = new Date().toISOString();
  const payload = {
    email: params.email,
    displayName: params.displayName,
    role: params.role,
    createdAt: now,
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, payload);

  // Seed helper profile when they can take jobs
  if (params.role === "helper" || params.role === "both") {
    const helperRef = doc(db, "helperProfiles", params.uid);
    const helperSnap = await getDoc(helperRef);
    if (!helperSnap.exists()) {
      await setDoc(helperRef, {
        userId: params.uid,
        displayName: params.displayName,
        bio: "",
        specialties: [],
        minPrice: 5000,
        rating: 0,
        completedJobs: 0,
        available: true,
        createdAt: now,
        updatedAt: serverTimestamp(),
      });
    }
  }

  return {
    id: params.uid,
    email: params.email,
    displayName: params.displayName,
    role: params.role,
    createdAt: now,
  };
}

export async function ensureUserProfile(
  db: Firestore,
  params: {
    uid: string;
    email: string;
    displayName?: string | null;
  }
): Promise<UserProfile> {
  const existing = await getUserProfile(db, params.uid);
  if (existing) return existing;

  return createUserProfile(db, {
    uid: params.uid,
    email: params.email,
    displayName: params.displayName?.trim() || params.email.split("@")[0] || "User",
    role: "client",
  });
}

export async function updateUserDisplayName(
  db: Firestore,
  uid: string,
  displayName: string
): Promise<void> {
  const name = displayName.trim();
  if (!name) throw new Error("Display name is required.");
  await updateDoc(doc(db, "users", uid), {
    displayName: name,
    updatedAt: serverTimestamp(),
  });
}

export function defaultDashboardPath(role: UserRole): string {
  if (role === "helper") return "/helper";
  return "/client";
}

/** Clients hire help; helpers only take jobs — not dual unless admin/both legacy. */
export function canAccessRole(
  userRole: UserRole,
  dashboard: "client" | "helper"
): boolean {
  if (userRole === "admin") return true;
  // Legacy "both" accounts keep access; new signups are client OR helper only
  if (userRole === "both") return true;
  if (dashboard === "client") return userRole === "client";
  return userRole === "helper";
}

export function canCreateRequests(role: UserRole | undefined | null): boolean {
  if (!role) return false;
  return role === "client" || role === "both" || role === "admin";
}

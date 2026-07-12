import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import type { HelperProfile } from "@/lib/types";

function mapHelper(id: string, data: Record<string, unknown>): HelperProfile {
  return {
    id,
    userId: String(data.userId ?? id),
    displayName: String(data.displayName ?? "Helper"),
    bio: String(data.bio ?? ""),
    specialties: Array.isArray(data.specialties)
      ? (data.specialties as string[])
      : [],
    minPrice: Number(data.minPrice ?? 5000),
    rating: Number(data.rating ?? 0),
    completedJobs: Number(data.completedJobs ?? 0),
    available: data.available !== false,
    photoURL: data.photoURL ? String(data.photoURL) : undefined,
  };
}

export async function listHelperProfiles(
  db: Firestore
): Promise<HelperProfile[]> {
  const snap = await getDocs(collection(db, "helperProfiles"));
  return snap.docs.map((d) =>
    mapHelper(d.id, d.data() as Record<string, unknown>)
  );
}

export async function listAvailableHelpers(
  db: Firestore,
  excludeUserId?: string
): Promise<HelperProfile[]> {
  let helpers: HelperProfile[];
  try {
    const q = query(
      collection(db, "helperProfiles"),
      where("available", "==", true)
    );
    const snap = await getDocs(q);
    helpers = snap.docs.map((d) =>
      mapHelper(d.id, d.data() as Record<string, unknown>)
    );
  } catch {
    helpers = await listHelperProfiles(db);
  }

  return helpers.filter((h) => {
    if (excludeUserId && (h.id === excludeUserId || h.userId === excludeUserId)) {
      return false;
    }
    return true;
  });
}

export async function getHelperProfile(
  db: Firestore,
  uid: string
): Promise<HelperProfile | null> {
  const snap = await getDoc(doc(db, "helperProfiles", uid));
  if (!snap.exists()) return null;
  return mapHelper(snap.id, snap.data() as Record<string, unknown>);
}

export async function upsertHelperProfile(
  db: Firestore,
  params: {
    uid: string;
    displayName: string;
    bio: string;
    minPrice: number;
    specialties: string[];
    available: boolean;
  }
): Promise<HelperProfile> {
  const ref = doc(db, "helperProfiles", params.uid);
  const existing = await getDoc(ref);
  const rating = existing.exists()
    ? Number((existing.data() as { rating?: number }).rating ?? 0)
    : 0;
  const completedJobs = existing.exists()
    ? Number((existing.data() as { completedJobs?: number }).completedJobs ?? 0)
    : 0;

  await setDoc(
    ref,
    {
      userId: params.uid,
      displayName: params.displayName.trim(),
      bio: params.bio.trim(),
      minPrice: params.minPrice,
      specialties: params.specialties,
      available: params.available,
      rating,
      completedJobs,
      updatedAt: serverTimestamp(),
      ...(existing.exists() ? {} : { createdAt: new Date().toISOString() }),
    },
    { merge: true }
  );

  return {
    id: params.uid,
    userId: params.uid,
    displayName: params.displayName.trim(),
    bio: params.bio.trim(),
    specialties: params.specialties,
    minPrice: params.minPrice,
    rating,
    completedJobs,
    available: params.available,
  };
}

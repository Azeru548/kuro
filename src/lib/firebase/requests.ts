import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
  type Firestore,
} from "firebase/firestore";
import type { HelpRequest, RequestStatus } from "@/lib/types";

function mapRequest(id: string, data: Record<string, unknown>): HelpRequest {
  return {
    id,
    clientId: String(data.clientId ?? ""),
    clientName: String(data.clientName ?? ""),
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    category: String(data.category ?? "Other"),
    deadline: String(data.deadline ?? ""),
    offerPrice: Number(data.offerPrice ?? 0),
    status: (data.status as RequestStatus) ?? "open",
    attachmentNames: Array.isArray(data.attachmentNames)
      ? (data.attachmentNames as string[])
      : [],
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : new Date().toISOString(),
  };
}

export async function createRequest(
  db: Firestore,
  params: {
    clientId: string;
    clientName: string;
    title: string;
    description: string;
    category: string;
    deadline: string;
    offerPrice: number;
  }
): Promise<HelpRequest> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, "requests"), {
    clientId: params.clientId,
    clientName: params.clientName,
    title: params.title.trim(),
    description: params.description.trim(),
    category: params.category,
    deadline: params.deadline,
    offerPrice: params.offerPrice,
    status: "open" satisfies RequestStatus,
    attachmentNames: [],
    createdAt: now,
    updatedAt: serverTimestamp(),
  });

  return {
    id: ref.id,
    clientId: params.clientId,
    clientName: params.clientName,
    title: params.title.trim(),
    description: params.description.trim(),
    category: params.category,
    deadline: params.deadline,
    offerPrice: params.offerPrice,
    status: "open",
    attachmentNames: [],
    createdAt: now,
  };
}

export async function getRequest(
  db: Firestore,
  requestId: string
): Promise<HelpRequest | null> {
  const snap = await getDoc(doc(db, "requests", requestId));
  if (!snap.exists()) return null;
  return mapRequest(snap.id, snap.data() as Record<string, unknown>);
}

export async function listRequestsForClient(
  db: Firestore,
  clientId: string
): Promise<HelpRequest[]> {
  const q = query(
    collection(db, "requests"),
    where("clientId", "==", clientId),
    orderBy("createdAt", "desc")
  );
  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
      mapRequest(d.id, d.data() as Record<string, unknown>)
    );
  } catch {
    // Fallback if composite index not ready yet
    const q2 = query(
      collection(db, "requests"),
      where("clientId", "==", clientId)
    );
    const snap = await getDocs(q2);
    return snap.docs
      .map((d) => mapRequest(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
}

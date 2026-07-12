import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import { canPlaceBid, countActiveBids } from "@/lib/bids";
import type { Bid, BidStatus, HelperProfile } from "@/lib/types";
import { MAX_BIDS_PER_REQUEST } from "@/lib/types";

function mapBid(id: string, data: Record<string, unknown>): Bid {
  return {
    id,
    requestId: String(data.requestId ?? ""),
    clientId: String(data.clientId ?? ""),
    helperId: String(data.helperId ?? ""),
    helperName: String(data.helperName ?? ""),
    offerPrice: Number(data.offerPrice ?? 0),
    status: (data.status as BidStatus) ?? "pending",
    declineReason: data.declineReason as Bid["declineReason"],
    declineNote: data.declineNote ? String(data.declineNote) : undefined,
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : new Date().toISOString(),
  };
}

export async function listBidsForRequest(
  db: Firestore,
  requestId: string
): Promise<Bid[]> {
  const q = query(
    collection(db, "bids"),
    where("requestId", "==", requestId),
    orderBy("createdAt", "desc")
  );
  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
      mapBid(d.id, d.data() as Record<string, unknown>)
    );
  } catch {
    const q2 = query(
      collection(db, "bids"),
      where("requestId", "==", requestId)
    );
    const snap = await getDocs(q2);
    return snap.docs.map((d) =>
      mapBid(d.id, d.data() as Record<string, unknown>)
    );
  }
}

export async function listBidsForClient(
  db: Firestore,
  clientId: string
): Promise<Bid[]> {
  const q = query(collection(db, "bids"), where("clientId", "==", clientId));
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    mapBid(d.id, d.data() as Record<string, unknown>)
  );
}

export async function listBidsForHelper(
  db: Firestore,
  helperId: string
): Promise<Bid[]> {
  const q = query(
    collection(db, "bids"),
    where("helperId", "==", helperId),
    orderBy("createdAt", "desc")
  );
  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
      mapBid(d.id, d.data() as Record<string, unknown>)
    );
  } catch {
    const q2 = query(
      collection(db, "bids"),
      where("helperId", "==", helperId)
    );
    const snap = await getDocs(q2);
    return snap.docs
      .map((d) => mapBid(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
}

export async function placeBid(
  db: Firestore,
  params: {
    requestId: string;
    clientId: string;
    helper: HelperProfile;
    offerPrice: number;
    existingBids: Bid[];
  }
): Promise<Bid> {
  const check = canPlaceBid({
    bids: params.existingBids,
    requestId: params.requestId,
    helper: params.helper,
    offerPrice: params.offerPrice,
  });
  if (!check.ok) {
    throw new Error(check.reason);
  }

  // Server-side double-check active count from existing list
  if (countActiveBids(params.existingBids, params.requestId) >= MAX_BIDS_PER_REQUEST) {
    throw new Error(`You can bid on at most ${MAX_BIDS_PER_REQUEST} helpers.`);
  }

  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, "bids"), {
    requestId: params.requestId,
    clientId: params.clientId,
    helperId: params.helper.id,
    helperName: params.helper.displayName,
    offerPrice: params.offerPrice,
    status: "pending" satisfies BidStatus,
    createdAt: now,
    updatedAt: serverTimestamp(),
  });

  return {
    id: ref.id,
    requestId: params.requestId,
    clientId: params.clientId,
    helperId: params.helper.id,
    helperName: params.helper.displayName,
    offerPrice: params.offerPrice,
    status: "pending",
    createdAt: now,
  };
}

export async function cancelBid(db: Firestore, bidId: string): Promise<void> {
  await updateDoc(doc(db, "bids", bidId), {
    status: "cancelled" satisfies BidStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function acceptBid(db: Firestore, bidId: string): Promise<void> {
  await updateDoc(doc(db, "bids", bidId), {
    status: "accepted" satisfies BidStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function declineBid(
  db: Firestore,
  bidId: string,
  declineReason: Bid["declineReason"],
  declineNote?: string
): Promise<void> {
  await updateDoc(doc(db, "bids", bidId), {
    status: "declined" satisfies BidStatus,
    declineReason: declineReason ?? null,
    declineNote: declineNote ?? null,
    updatedAt: serverTimestamp(),
  });
}

/** Best-effort: mark sibling pending bids on the same request as expired (client-side). */
export async function expireSiblingBids(
  db: Firestore,
  requestId: string,
  winningBidId: string,
  siblingBids: Bid[]
): Promise<void> {
  const pending = siblingBids.filter(
    (b) =>
      b.requestId === requestId &&
      b.id !== winningBidId &&
      b.status === "pending"
  );

  await Promise.all(
    pending.map((b) =>
      updateDoc(doc(db, "bids", b.id), {
        status: "expired" satisfies BidStatus,
        updatedAt: serverTimestamp(),
      }).catch(() => {
        // Helper may not have permission to update other helpers' bids — OK
      })
    )
  );
}

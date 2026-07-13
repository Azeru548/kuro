import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { sanitizeAttachments } from "@/lib/sanitize";
import type {
  Bid,
  BidStatus,
  FileAttachment,
  HelpRequest,
  Job,
  JobStatus,
  PaymentStatus,
  RequestStatus,
} from "@/lib/types";

const STATUS_ORDER: JobStatus[] = [
  "assigned",
  "in_progress",
  "delivered",
  "completed",
];

export function nextJobStatus(current: JobStatus): JobStatus | null {
  const i = STATUS_ORDER.indexOf(current);
  if (i < 0 || i >= STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[i + 1]!;
}

export function jobStatusStepIndex(status: JobStatus): number {
  const i = STATUS_ORDER.indexOf(status);
  return i >= 0 ? i : 0;
}

function mapFiles(value: unknown): FileAttachment[] {
  return Array.isArray(value) ? (value as FileAttachment[]) : [];
}

function mapJob(id: string, data: Record<string, unknown>): Job {
  return {
    id,
    requestId: String(data.requestId ?? ""),
    clientId: String(data.clientId ?? ""),
    clientName: String(data.clientName ?? ""),
    helperId: String(data.helperId ?? ""),
    helperName: String(data.helperName ?? ""),
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    price: Number(data.price ?? 0),
    status: (data.status as JobStatus) ?? "assigned",
    paymentStatus: (data.paymentStatus as PaymentStatus) ?? "pending",
    requestAttachments: mapFiles(data.requestAttachments),
    deliverables: mapFiles(data.deliverables),
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof data.updatedAt === "string"
        ? data.updatedAt
        : typeof data.createdAt === "string"
          ? data.createdAt
          : new Date().toISOString(),
  };
}

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

function mapRequest(id: string, data: Record<string, unknown>): HelpRequest {
  const attachments = mapFiles(data.attachments);
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
    attachments,
    attachmentNames: attachments.map((a) => a.name),
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : new Date().toISOString(),
  };
}

export async function getJob(
  db: Firestore,
  jobId: string
): Promise<Job | null> {
  const snap = await getDoc(doc(db, "jobs", jobId));
  if (!snap.exists()) return null;
  return mapJob(snap.id, snap.data() as Record<string, unknown>);
}

export async function listJobsForClient(
  db: Firestore,
  clientId: string
): Promise<Job[]> {
  const q = query(collection(db, "jobs"), where("clientId", "==", clientId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapJob(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function listJobsForHelper(
  db: Firestore,
  helperId: string
): Promise<Job[]> {
  const q = query(collection(db, "jobs"), where("helperId", "==", helperId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapJob(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

/**
 * First accept wins:
 * - accept this bid
 * - expire other pending bids on the same request
 * - mark request matched
 * - create job
 */
export async function acceptBidAndCreateJob(
  db: Firestore,
  params: {
    bidId: string;
    helperId: string;
    helperName: string;
  }
): Promise<Job> {
  const bidRef = doc(db, "bids", params.bidId);
  const bidSnap = await getDoc(bidRef);
  if (!bidSnap.exists()) {
    throw new Error("Bid not found.");
  }

  const bid = mapBid(bidSnap.id, bidSnap.data() as Record<string, unknown>);

  if (bid.helperId !== params.helperId) {
    throw new Error("This bid does not belong to you.");
  }
  if (bid.status !== "pending") {
    throw new Error(`This bid is already ${bid.status}.`);
  }

  const requestRef = doc(db, "requests", bid.requestId);
  const requestSnap = await getDoc(requestRef);
  if (!requestSnap.exists()) {
    throw new Error("Request not found.");
  }

  const request = mapRequest(
    requestSnap.id,
    requestSnap.data() as Record<string, unknown>
  );

  if (request.status !== "open") {
    throw new Error(
      "This request is no longer open (another helper may have accepted first)."
    );
  }

  // Sibling pending bids on same request
  const siblingsSnap = await getDocs(
    query(collection(db, "bids"), where("requestId", "==", bid.requestId))
  );

  const now = new Date().toISOString();
  const batch = writeBatch(db);

  batch.update(bidRef, {
    status: "accepted" satisfies BidStatus,
    updatedAt: serverTimestamp(),
  });

  for (const d of siblingsSnap.docs) {
    if (d.id === bid.id) continue;
    const status = d.data().status as BidStatus | undefined;
    if (status === "pending") {
      batch.update(d.ref, {
        status: "expired" satisfies BidStatus,
        updatedAt: serverTimestamp(),
      });
    }
  }

  batch.update(requestRef, {
    status: "matched" satisfies RequestStatus,
    helperId: params.helperId,
    helperName: params.helperName,
    matchedBidId: bid.id,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  const requestAttachments = sanitizeAttachments(request.attachments ?? []);

  const jobPayload = {
    requestId: request.id,
    bidId: bid.id,
    clientId: request.clientId,
    clientName: request.clientName,
    helperId: params.helperId,
    helperName: params.helperName,
    title: request.title,
    description: request.description,
    category: request.category,
    deadline: request.deadline,
    price: bid.offerPrice || request.offerPrice,
    status: "assigned" satisfies JobStatus,
    paymentStatus: "pending" satisfies PaymentStatus,
    requestAttachments,
    deliverables: [] as FileAttachment[],
    createdAt: now,
    updatedAt: now,
  };

  const jobRef = await addDoc(collection(db, "jobs"), {
    ...jobPayload,
    updatedAtServer: serverTimestamp(),
  });

  // Link job on request (non-critical if fails)
  await updateDoc(requestRef, {
    jobId: jobRef.id,
    updatedAt: serverTimestamp(),
  }).catch(() => undefined);

  return {
    id: jobRef.id,
    requestId: request.id,
    clientId: request.clientId,
    clientName: request.clientName,
    helperId: params.helperId,
    helperName: params.helperName,
    title: request.title,
    description: request.description,
    price: bid.offerPrice || request.offerPrice,
    status: "assigned",
    paymentStatus: "pending",
    requestAttachments,
    deliverables: [],
    createdAt: now,
    updatedAt: now,
  };
}

export async function setJobDeliverables(
  db: Firestore,
  jobId: string,
  deliverables: FileAttachment[]
): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, "jobs", jobId), {
    deliverables: sanitizeAttachments(deliverables),
    updatedAt: now,
    updatedAtServer: serverTimestamp(),
  });
}

export async function updateJobStatus(
  db: Firestore,
  jobId: string,
  status: JobStatus
): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, "jobs", jobId), {
    status,
    updatedAt: now,
    updatedAtServer: serverTimestamp(),
  });

  // Mirror request status for terminal-ish states
  const job = await getJob(db, jobId);
  if (!job) return;

  let requestStatus: RequestStatus | null = null;
  if (status === "in_progress") requestStatus = "in_progress";
  if (status === "delivered") requestStatus = "delivered";
  if (status === "completed") requestStatus = "completed";

  if (requestStatus) {
    await updateDoc(doc(db, "requests", job.requestId), {
      status: requestStatus,
      updatedAt: serverTimestamp(),
    }).catch(() => undefined);
  }
}

export async function advanceJobStatus(
  db: Firestore,
  jobId: string
): Promise<JobStatus> {
  const job = await getJob(db, jobId);
  if (!job) throw new Error("Job not found.");
  const next = nextJobStatus(job.status);
  if (!next) throw new Error("Job is already completed.");
  await updateJobStatus(db, jobId, next);
  return next;
}

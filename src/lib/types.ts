export type UserRole = "client" | "helper" | "both" | "admin";

export type RequestStatus =
  | "open"
  | "matched"
  | "in_progress"
  | "delivered"
  | "completed"
  | "cancelled";

export type BidStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "expired";

export type JobStatus =
  | "assigned"
  | "in_progress"
  | "delivered"
  | "completed"
  | "disputed"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "released"
  | "refunded"
  | "failed";

export type DeclineReason =
  | "amount_too_small"
  | "currently_unavailable"
  | "not_my_specialty"
  | "deadline_too_tight"
  | "workload_full"
  | "other";

export const DECLINE_REASON_LABELS: Record<DeclineReason, string> = {
  amount_too_small: "Amount too small",
  currently_unavailable: "Currently unavailable",
  not_my_specialty: "Not my specialty",
  deadline_too_tight: "Deadline too tight",
  workload_full: "Workload full",
  other: "Other",
};

export const MAX_BIDS_PER_REQUEST = 3;

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt: string;
}

export interface HelperProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  specialties: string[];
  minPrice: number;
  rating: number;
  completedJobs: number;
  available: boolean;
  photoURL?: string;
}

/** Uploaded via Cloudinary */
export interface FileAttachment {
  name: string;
  url: string;
  publicId: string;
  bytes?: number;
  format?: string;
  resourceType?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export interface HelpRequest {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  category: string;
  deadline: string;
  offerPrice: number;
  status: RequestStatus;
  /** @deprecated prefer attachments */
  attachmentNames: string[];
  attachments: FileAttachment[];
  createdAt: string;
}

export interface Bid {
  id: string;
  requestId: string;
  clientId: string;
  helperId: string;
  helperName: string;
  offerPrice: number;
  status: BidStatus;
  declineReason?: DeclineReason;
  declineNote?: string;
  createdAt: string;
}

export interface Job {
  id: string;
  requestId: string;
  clientId: string;
  clientName: string;
  helperId: string;
  helperName: string;
  title: string;
  description: string;
  price: number;
  status: JobStatus;
  paymentStatus: PaymentStatus;
  /** Brief files from the original request */
  requestAttachments: FileAttachment[];
  /** Helper/client deliverables */
  deliverables: FileAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatThread {
  id: string;
  requestId: string;
  bidId: string;
  clientId: string;
  helperId: string;
  helperName: string;
  clientName: string;
  title: string;
  status: "open" | "closed";
  lastMessage?: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface Review {
  id: string;
  jobId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const REQUEST_CATEGORIES = [
  "Computer Science",
  "Mathematics",
  "Writing & Essays",
  "Science",
  "Business",
  "Design",
  "Languages",
  "Other",
] as const;

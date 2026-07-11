import { Badge } from "@/components/ui/badge";
import type { BidStatus, JobStatus, RequestStatus } from "@/lib/types";

const requestTone: Record<
  RequestStatus,
  "default" | "success" | "warning" | "danger" | "muted"
> = {
  open: "default",
  matched: "success",
  in_progress: "warning",
  delivered: "default",
  completed: "success",
  cancelled: "muted",
};

const bidTone: Record<
  BidStatus,
  "default" | "success" | "warning" | "danger" | "muted"
> = {
  pending: "warning",
  accepted: "success",
  declined: "danger",
  cancelled: "muted",
  expired: "muted",
};

const jobTone: Record<
  JobStatus,
  "default" | "success" | "warning" | "danger" | "muted"
> = {
  assigned: "default",
  in_progress: "warning",
  delivered: "default",
  completed: "success",
  disputed: "danger",
  cancelled: "muted",
};

function label(value: string) {
  return value.replaceAll("_", " ");
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <Badge tone={requestTone[status]}>{label(status)}</Badge>;
}

export function BidStatusBadge({ status }: { status: BidStatus }) {
  return <Badge tone={bidTone[status]}>{label(status)}</Badge>;
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <Badge tone={jobTone[status]}>{label(status)}</Badge>;
}

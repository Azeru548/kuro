"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { BidStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { declineBid, listBidsForHelper } from "@/lib/firebase/bids";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { acceptBidAndCreateJob } from "@/lib/firebase/jobs";
import { getRequest } from "@/lib/firebase/requests";
import {
  DECLINE_REASON_LABELS,
  type Bid,
  type DeclineReason,
  type HelpRequest,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function HelperInboxPage() {
  const { firebaseUser, profile } = useAuth();
  const router = useRouter();
  const [bids, setBids] = useState<Bid[]>([]);
  const [requestsById, setRequestsById] = useState<Record<string, HelpRequest>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [declineFor, setDeclineFor] = useState<string | null>(null);
  const [reason, setReason] = useState<DeclineReason>("amount_too_small");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function notify(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }

  const load = useCallback(async () => {
    if (!firebaseUser || !isFirebaseConfigured()) {
      setLoading(false);
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const list = await listBidsForHelper(db, firebaseUser.uid);
      setBids(list);

      const uniqueRequestIds = [...new Set(list.map((b) => b.requestId))];
      const pairs = await Promise.all(
        uniqueRequestIds.map(async (id) => {
          const req = await getRequest(db, id);
          return [id, req] as const;
        })
      );
      const map: Record<string, HelpRequest> = {};
      for (const [id, req] of pairs) {
        if (req) map[id] = req;
      }
      setRequestsById(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inbox.");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    void load();
  }, [load]);

  async function accept(bid: Bid) {
    if (!firebaseUser) return;
    const db = getFirebaseDb();
    if (!db) return;
    setBusyId(bid.id);
    try {
      const job = await acceptBidAndCreateJob(db, {
        bidId: bid.id,
        helperId: firebaseUser.uid,
        helperName:
          profile?.displayName || bid.helperName || "Helper",
      });

      setBids((prev) =>
        prev.map((b) => {
          if (b.id === bid.id) return { ...b, status: "accepted" as const };
          if (b.requestId === bid.requestId && b.status === "pending") {
            return { ...b, status: "expired" as const };
          }
          return b;
        })
      );
      setRequestsById((prev) => {
        const req = prev[bid.requestId];
        if (!req) return prev;
        return {
          ...prev,
          [bid.requestId]: { ...req, status: "matched" },
        };
      });

      notify("Job created — opening project…");
      router.push(`/helper/jobs/${job.id}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Accept failed.");
      void load();
    } finally {
      setBusyId(null);
    }
  }

  async function decline(bid: Bid) {
    const db = getFirebaseDb();
    if (!db) return;
    setBusyId(bid.id);
    try {
      await declineBid(db, bid.id, reason, note || undefined);
      setBids((prev) =>
        prev.map((b) =>
          b.id === bid.id
            ? {
                ...b,
                status: "declined" as const,
                declineReason: reason,
                declineNote: note || undefined,
              }
            : b
        )
      );
      setDeclineFor(null);
      setNote("");
      notify(`Declined: ${DECLINE_REASON_LABELS[reason]}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Decline failed.");
    } finally {
      setBusyId(null);
    }
  }

  const inbox = bids.filter((b) => b.status !== "cancelled");

  return (
    <DashboardShell
      role="helper"
      title="Inbox"
      subtitle="Accept creates a job and marks the request matched. First accept wins."
    >
      <div className="mb-4 flex gap-2">
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
        <Link href="/helper/jobs">
          <Button variant="ghost" size="sm">
            My projects
          </Button>
        </Link>
      </div>

      {toast ? (
        <div className="mb-4 rounded-xl border border-purple-200 bg-white px-4 py-3 text-sm text-purple-900 shadow-sm">
          {toast}
        </div>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-stone-500">Loading inbox…</p>
      ) : (
        <div className="space-y-4">
          {inbox.map((bid) => {
            const request = requestsById[bid.requestId];
            return (
              <Card key={bid.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                  <div>
                    <CardTitle className="text-2xl">
                      {request?.title ?? "Help request"}
                    </CardTitle>
                    <p className="mt-1 text-sm text-stone-600">
                      From {request?.clientName ?? "Client"} · Offer{" "}
                      <span className="font-semibold text-purple-800">
                        {formatCurrency(bid.offerPrice)}
                      </span>{" "}
                      · {formatDate(bid.createdAt)}
                    </p>
                  </div>
                  <BidStatusBadge status={bid.status} />
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed text-stone-600">
                    {request?.description ?? "Request details unavailable."}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-stone-500">
                    {request?.category ? (
                      <span className="rounded-full bg-purple-50 px-2.5 py-1">
                        {request.category}
                      </span>
                    ) : null}
                    {request?.deadline ? (
                      <span className="rounded-full bg-purple-50 px-2.5 py-1">
                        Due {formatDate(request.deadline)}
                      </span>
                    ) : null}
                    {request?.status === "matched" && bid.status === "pending" ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-900">
                        Already matched
                      </span>
                    ) : null}
                  </div>

                  {bid.status === "pending" && request?.status === "open" ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => void accept(bid)}
                          disabled={busyId === bid.id}
                        >
                          {busyId === bid.id ? "Accepting…" : "Accept & create job"}
                        </Button>
                        <Button
                          variant="outline"
                          disabled={busyId === bid.id}
                          onClick={() =>
                            setDeclineFor(
                              declineFor === bid.id ? null : bid.id
                            )
                          }
                        >
                          Decline
                        </Button>
                      </div>

                      {declineFor === bid.id ? (
                        <div className="space-y-3 rounded-xl border border-purple-100 bg-purple-50/40 p-4">
                          <p className="text-sm font-medium text-purple-900">
                            Choose a reason
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {(
                              Object.keys(
                                DECLINE_REASON_LABELS
                              ) as DeclineReason[]
                            ).map((key) => (
                              <label
                                key={key}
                                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                                  reason === key
                                    ? "border-purple-600 bg-white"
                                    : "border-transparent bg-white/60"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`reason-${bid.id}`}
                                  checked={reason === key}
                                  onChange={() => setReason(key)}
                                />
                                {DECLINE_REASON_LABELS[key]}
                              </label>
                            ))}
                          </div>
                          {reason === "other" ? (
                            <Textarea
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder="Short note (optional)"
                            />
                          ) : null}
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={busyId === bid.id}
                            onClick={() => void decline(bid)}
                          >
                            Confirm decline
                          </Button>
                        </div>
                      ) : null}
                    </>
                  ) : bid.status === "accepted" ? (
                    <p className="text-sm text-emerald-700">
                      Accepted — open{" "}
                      <Link
                        href="/helper/jobs"
                        className="underline hover:text-emerald-900"
                      >
                        My projects
                      </Link>
                      .
                    </p>
                  ) : bid.status === "declined" && bid.declineReason ? (
                    <p className="text-sm text-stone-500">
                      Declined — {DECLINE_REASON_LABELS[bid.declineReason]}
                      {bid.declineNote ? `: ${bid.declineNote}` : ""}
                    </p>
                  ) : bid.status === "expired" ? (
                    <p className="text-sm text-stone-500">
                      Expired — another helper was accepted for this request.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}

          {inbox.length === 0 ? (
            <p className="text-sm text-stone-500">
              No bids yet. Save your helper profile so clients can find you.
            </p>
          ) : null}
        </div>
      )}
    </DashboardShell>
  );
}

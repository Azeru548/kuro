"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { BidStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  DECLINE_REASON_LABELS,
  type Bid,
  type DeclineReason,
} from "@/lib/types";
import { mockBids, mockRequests } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

const DEMO_HELPER_ID = "helper-1";

export default function HelperInboxPage() {
  const [bids, setBids] = useState(
    mockBids.filter((b) => b.helperId === DEMO_HELPER_ID || b.status === "pending")
  );
  const [declineFor, setDeclineFor] = useState<string | null>(null);
  const [reason, setReason] = useState<DeclineReason>("amount_too_small");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Show bids that helpers would see — demo uses pending from mock + helper-1
  const inbox = bids.filter(
    (b) =>
      b.status === "pending" ||
      (b.helperId === DEMO_HELPER_ID && b.status !== "cancelled")
  );

  function notify(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }

  function accept(bid: Bid) {
    setBids((prev) =>
      prev.map((b) => {
        if (b.id === bid.id) return { ...b, status: "accepted" as const };
        // First accept wins: expire other pending bids on same request
        if (b.requestId === bid.requestId && b.status === "pending") {
          return { ...b, status: "expired" as const };
        }
        return b;
      })
    );
    setDeclineFor(null);
    notify("Bid accepted. Job created — client can checkout with Paystack.");
  }

  function decline(bid: Bid) {
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
  }

  return (
    <DashboardShell
      role="helper"
      title="Inbox"
      subtitle="Clients bid on you with a fixed offer price. Accept or decline with a template reason."
    >
      {toast ? (
        <div className="mb-4 rounded-xl border border-purple-200 bg-white px-4 py-3 text-sm text-purple-900 shadow-sm">
          {toast}
        </div>
      ) : null}

      <div className="space-y-4">
        {inbox.map((bid) => {
          const request = mockRequests.find((r) => r.id === bid.requestId);
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
                  {request?.description}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-stone-500">
                  <span className="rounded-full bg-purple-50 px-2.5 py-1">
                    {request?.category}
                  </span>
                  {request?.deadline ? (
                    <span className="rounded-full bg-purple-50 px-2.5 py-1">
                      Due {formatDate(request.deadline)}
                    </span>
                  ) : null}
                </div>

                {bid.status === "pending" ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => accept(bid)}>Accept</Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setDeclineFor(declineFor === bid.id ? null : bid.id)
                        }
                      >
                        Decline
                      </Button>
                    </div>

                    {declineFor === bid.id ? (
                      <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 space-y-3">
                        <p className="text-sm font-medium text-purple-900">
                          Choose a reason
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {(
                            Object.keys(DECLINE_REASON_LABELS) as DeclineReason[]
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
                          onClick={() => decline(bid)}
                        >
                          Confirm decline
                        </Button>
                      </div>
                    ) : null}
                  </>
                ) : bid.status === "declined" && bid.declineReason ? (
                  <p className="text-sm text-stone-500">
                    Declined — {DECLINE_REASON_LABELS[bid.declineReason]}
                    {bid.declineNote ? `: ${bid.declineNote}` : ""}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}

        {inbox.length === 0 ? (
          <p className="text-sm text-stone-500">No bids in your inbox yet.</p>
        ) : null}
      </div>
    </DashboardShell>
  );
}

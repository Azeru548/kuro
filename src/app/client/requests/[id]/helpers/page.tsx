"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { HelperCard } from "@/components/helper-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { canPlaceBid, countActiveBids, getBidForHelper } from "@/lib/bids";
import { mockBids, mockHelpers, mockRequests } from "@/lib/mock-data";
import { MAX_BIDS_PER_REQUEST, type Bid } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function ChooseHelpersPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const requestId = params.id;

  const request = mockRequests.find((r) => r.id === requestId) ?? mockRequests[0];
  const offerPrice = Number(search.get("price")) || request.offerPrice;
  const title = search.get("title") || request.title;

  const [bids, setBids] = useState<Bid[]>(
    mockBids.filter((b) => b.requestId === requestId)
  );
  const [toast, setToast] = useState<string | null>(null);

  const activeCount = useMemo(
    () => countActiveBids(bids, requestId),
    [bids, requestId]
  );

  function show(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }

  function onBid(helperId: string) {
    const helper = mockHelpers.find((h) => h.id === helperId);
    if (!helper) return;

    const check = canPlaceBid({
      bids,
      requestId,
      helper,
      offerPrice,
    });
    if (!check.ok) {
      show(check.reason);
      return;
    }

    const bid: Bid = {
      id: `bid-${Date.now()}`,
      requestId,
      clientId: "client-1",
      helperId,
      helperName: helper.displayName,
      offerPrice,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setBids((prev) => [...prev, bid]);
    show(`Bid sent to ${helper.displayName}. Chat unlocked in Messages.`);
  }

  function onCancel(helperId: string) {
    const existing = getBidForHelper(bids, requestId, helperId);
    if (!existing || existing.status !== "pending") return;

    setBids((prev) =>
      prev.map((b) =>
        b.id === existing.id ? { ...b, status: "cancelled" as const } : b
      )
    );
    show("Bid cancelled. You can bid on another helper.");
  }

  return (
    <DashboardShell
      role="client"
      title="Choose helpers"
      subtitle="Bid on up to three helpers. Each can accept or decline from their inbox."
    >
      <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-white">
        <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl text-purple-950">{title}</p>
            <p className="text-sm text-stone-600">
              Your offer:{" "}
              <span className="font-semibold text-purple-800">
                {formatCurrency(offerPrice)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={activeCount >= MAX_BIDS_PER_REQUEST ? "warning" : "default"}>
              {activeCount} / {MAX_BIDS_PER_REQUEST} bids used
            </Badge>
            <Link
              href="/client/messages"
              className="text-sm text-purple-700 hover:underline"
            >
              Open messages
            </Link>
          </div>
        </CardContent>
      </Card>

      {toast ? (
        <div className="mb-4 rounded-xl border border-purple-200 bg-white px-4 py-3 text-sm text-purple-900 shadow-sm">
          {toast}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {mockHelpers.map((helper) => (
          <HelperCard
            key={helper.id}
            helper={helper}
            requestId={requestId}
            offerPrice={offerPrice}
            bids={bids}
            onBid={onBid}
            onCancel={onCancel}
          />
        ))}
      </div>
    </DashboardShell>
  );
}

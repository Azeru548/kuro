"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Bid, HelperProfile } from "@/lib/types";
import { canPlaceBid, getBidForHelper } from "@/lib/bids";
import { formatCurrency, initials } from "@/lib/utils";
import { Star } from "lucide-react";

export function HelperCard({
  helper,
  requestId,
  offerPrice,
  bids,
  onBid,
  onCancel,
}: {
  helper: HelperProfile;
  requestId: string;
  offerPrice: number;
  bids: Bid[];
  onBid: (helperId: string) => void;
  onCancel: (helperId: string) => void;
}) {
  const existing = getBidForHelper(bids, requestId, helper.id);
  const pending = existing?.status === "pending";
  const eligibility = canPlaceBid({
    bids,
    requestId,
    helper,
    offerPrice,
  });
  const belowMin = offerPrice < helper.minPrice;

  return (
    <Card className="overflow-hidden transition hover:shadow-md hover:shadow-purple-900/10">
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-900 font-medium text-white">
            {initials(helper.displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl text-purple-950">
                {helper.displayName}
              </h3>
              {!helper.available ? (
                <Badge tone="muted">Unavailable</Badge>
              ) : null}
              {pending ? <Badge tone="warning">Bid sent</Badge> : null}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-sm text-stone-600">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{helper.rating.toFixed(1)}</span>
              <span className="text-stone-300">·</span>
              <span>{helper.completedJobs} jobs</span>
            </div>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-stone-600">{helper.bio}</p>

        <div className="flex flex-wrap gap-1.5">
          {helper.specialties.map((s) => (
            <Badge key={s} tone="default">
              {s}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-purple-50 px-3 py-2 text-sm">
          <span className="text-stone-600">Minimum price</span>
          <span className="font-semibold text-purple-900">
            {formatCurrency(helper.minPrice)}
          </span>
        </div>

        {belowMin && !pending ? (
          <p className="text-xs text-rose-600">
            Your offer ({formatCurrency(offerPrice)}) is below this helper&apos;s
            minimum.
          </p>
        ) : null}

        <div className="flex gap-2">
          {pending ? (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onCancel(helper.id)}
            >
              Cancel bid
            </Button>
          ) : (
            <Button
              className="flex-1"
              disabled={!eligibility.ok}
              title={!eligibility.ok ? eligibility.reason : "Send bid"}
              onClick={() => onBid(helper.id)}
            >
              Bid
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { BidStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { listBidsForHelper } from "@/lib/firebase/bids";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type { Bid } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Inbox, Settings } from "lucide-react";

export default function HelperOverviewPage() {
  const { profile, firebaseUser } = useAuth();
  const firstName = profile?.displayName?.split(" ")[0] || "Helper";
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

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
    try {
      const list = await listBidsForHelper(db, firebaseUser.uid);
      setBids(list);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    void load();
  }, [load]);

  const pending = bids.filter((b) => b.status === "pending");
  const accepted = bids.filter((b) => b.status === "accepted");

  return (
    <DashboardShell
      role="helper"
      title={`Welcome, ${firstName}`}
      subtitle="Review bids, manage projects, and keep chats on Kuro."
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pending bids", value: String(pending.length) },
          { label: "Accepted", value: String(accepted.length) },
          {
            label: "All bids",
            value: loading ? "…" : String(bids.length),
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-5">
              <p className="text-xs uppercase tracking-wide text-stone-500">
                {s.label}
              </p>
              <p className="mt-1 font-display text-3xl text-purple-900">
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link href="/helper/inbox">
          <Button size="lg">
            <Inbox className="h-4 w-4" />
            Open inbox
          </Button>
        </Link>
        <Link href="/helper/profile">
          <Button size="lg" variant="outline">
            <Settings className="h-4 w-4" />
            Edit profile
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent bids</CardTitle>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs text-purple-700 hover:underline"
          >
            Refresh
          </button>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-stone-500">Loading…</p>
          ) : bids.length === 0 ? (
            <p className="text-sm text-stone-500">
              No bids yet. Save your helper profile so clients can find you.
            </p>
          ) : (
            bids
              .slice()
              .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
              .slice(0, 8)
              .map((bid) => (
                <div
                  key={bid.id}
                  className="flex items-center justify-between rounded-xl border border-purple-50 p-4"
                >
                  <div>
                    <p className="font-medium text-purple-950">
                      {bid.helperName || "You"} · {formatCurrency(bid.offerPrice)}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatDate(bid.createdAt)}
                    </p>
                  </div>
                  <BidStatusBadge status={bid.status} />
                </div>
              ))
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

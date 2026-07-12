"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { HelperCard } from "@/components/helper-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { countActiveBids, getBidForHelper } from "@/lib/bids";
import { cancelBid, listBidsForRequest, placeBid } from "@/lib/firebase/bids";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { listAvailableHelpers } from "@/lib/firebase/helpers";
import { getRequest } from "@/lib/firebase/requests";
import { MAX_BIDS_PER_REQUEST, type Bid, type HelpRequest, type HelperProfile } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function ChooseHelpersPage() {
  const params = useParams<{ id: string }>();
  const requestId = params.id;
  const { firebaseUser, profile } = useAuth();

  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [helpers, setHelpers] = useState<HelperProfile[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyHelperId, setBusyHelperId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const show = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const load = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      setError("Firebase is not configured.");
      setLoading(false);
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      setError("Could not connect to Firestore.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [req, helperList, bidList] = await Promise.all([
        getRequest(db, requestId),
        listAvailableHelpers(db, firebaseUser?.uid),
        listBidsForRequest(db, requestId),
      ]);

      if (!req) {
        setError("Request not found.");
        setRequest(null);
      } else if (firebaseUser && req.clientId !== firebaseUser.uid) {
        setError("You can only bid from your own requests.");
        setRequest(null);
      } else {
        setRequest(req);
      }

      setHelpers(helperList);
      setBids(bidList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load helpers.");
    } finally {
      setLoading(false);
    }
  }, [requestId, firebaseUser]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCount = useMemo(
    () => (request ? countActiveBids(bids, request.id) : 0),
    [bids, request]
  );

  async function onBid(helperId: string) {
    if (!request || !firebaseUser || !profile) return;
    const helper = helpers.find((h) => h.id === helperId);
    if (!helper) return;

    const db = getFirebaseDb();
    if (!db) {
      show("Firestore unavailable.");
      return;
    }

    setBusyHelperId(helperId);
    try {
      const bid = await placeBid(db, {
        requestId: request.id,
        clientId: firebaseUser.uid,
        helper,
        offerPrice: request.offerPrice,
        existingBids: bids,
      });
      setBids((prev) => [bid, ...prev.filter((b) => b.id !== bid.id)]);
      show(`Bid sent to ${helper.displayName}.`);
    } catch (err) {
      show(err instanceof Error ? err.message : "Could not place bid.");
    } finally {
      setBusyHelperId(null);
    }
  }

  async function onCancel(helperId: string) {
    if (!request) return;
    const existing = getBidForHelper(bids, request.id, helperId);
    if (!existing || existing.status !== "pending") return;

    const db = getFirebaseDb();
    if (!db) {
      show("Firestore unavailable.");
      return;
    }

    setBusyHelperId(helperId);
    try {
      await cancelBid(db, existing.id);
      setBids((prev) =>
        prev.map((b) =>
          b.id === existing.id ? { ...b, status: "cancelled" as const } : b
        )
      );
      show("Bid cancelled. You can bid on another helper.");
    } catch (err) {
      show(err instanceof Error ? err.message : "Could not cancel bid.");
    } finally {
      setBusyHelperId(null);
    }
  }

  return (
    <DashboardShell
      role="client"
      title="Choose helpers"
      subtitle="Bid on up to three helpers. Each can accept or decline from their inbox."
    >
      {loading ? (
        <p className="text-sm text-stone-500">Loading helpers…</p>
      ) : error ? (
        <Card>
          <CardContent className="py-6 text-sm text-rose-700">{error}</CardContent>
        </Card>
      ) : request ? (
        <>
          <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-white">
            <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-2xl text-purple-950">
                  {request.title}
                </p>
                <p className="text-sm text-stone-600">
                  Your offer:{" "}
                  <span className="font-semibold text-purple-800">
                    {formatCurrency(request.offerPrice)}
                  </span>
                  <span className="text-stone-400"> · </span>
                  {request.category}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  tone={
                    activeCount >= MAX_BIDS_PER_REQUEST ? "warning" : "default"
                  }
                >
                  {activeCount} / {MAX_BIDS_PER_REQUEST} bids used
                </Badge>
                <Link
                  href="/client"
                  className="text-sm text-purple-700 hover:underline"
                >
                  Back to overview
                </Link>
              </div>
            </CardContent>
          </Card>

          {toast ? (
            <div className="mb-4 rounded-xl border border-purple-200 bg-white px-4 py-3 text-sm text-purple-900 shadow-sm">
              {toast}
            </div>
          ) : null}

          {helpers.length === 0 ? (
            <Card>
              <CardContent className="space-y-2 py-8 text-center text-sm text-stone-600">
                <p className="font-display text-2xl text-purple-950">
                  No helpers yet
                </p>
                <p>
                  Helpers appear here after someone signs up with role{" "}
                  <strong>helper</strong> or <strong>both</strong> and (optionally)
                  fills their profile.
                </p>
                <p className="text-xs text-stone-500">
                  Tip: open an incognito window, sign up as a helper, set a min
                  price on the helper profile page, then refresh this gallery.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div
              className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${
                busyHelperId ? "opacity-90" : ""
              }`}
            >
              {helpers.map((helper) => (
                <div
                  key={helper.id}
                  className={
                    busyHelperId === helper.id
                      ? "pointer-events-none opacity-60"
                      : ""
                  }
                >
                  <HelperCard
                    helper={helper}
                    requestId={request.id}
                    offerPrice={request.offerPrice}
                    bids={bids}
                    onBid={onBid}
                    onCancel={onCancel}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </DashboardShell>
  );
}

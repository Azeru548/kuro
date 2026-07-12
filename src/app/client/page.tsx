"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequestStatusBadge, BidStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { listBidsForClient } from "@/lib/firebase/bids";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { listJobsForClient } from "@/lib/firebase/jobs";
import { listRequestsForClient } from "@/lib/firebase/requests";
import type { Bid, HelpRequest, Job } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowRight, PlusCircle } from "lucide-react";
import { JobStatusBadge } from "@/components/status-badge";

export default function ClientOverviewPage() {
  const { profile, firebaseUser } = useAuth();
  const firstName = profile?.displayName?.split(" ")[0] || "there";

  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const [reqs, clientBids, clientJobs] = await Promise.all([
        listRequestsForClient(db, firebaseUser.uid),
        listBidsForClient(db, firebaseUser.uid),
        listJobsForClient(db, firebaseUser.uid),
      ]);
      setRequests(reqs);
      setBids(clientBids);
      setJobs(clientJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    void load();
  }, [load]);

  const openRequests = requests.filter((r) => r.status === "open");
  const pendingBids = bids.filter((b) => b.status === "pending");
  const activeJobs = jobs.filter((j) => j.status !== "completed");

  return (
    <DashboardShell
      role="client"
      title={`Welcome back, ${firstName}`}
      subtitle="Post a request, bid on up to three helpers, and track your sessions."
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Open requests", value: openRequests.length },
          { label: "Pending bids", value: pendingBids.length },
          { label: "Active jobs", value: activeJobs.length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-5">
              <p className="text-xs uppercase tracking-wide text-stone-500">
                {s.label}
              </p>
              <p className="mt-1 font-display text-4xl text-purple-900">
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link href="/client/requests/new">
          <Button size="lg">
            <PlusCircle className="h-4 w-4" />
            New help request
          </Button>
        </Link>
        <Button variant="outline" size="lg" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-stone-500">Loading your requests…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your requests</CardTitle>
              <Link
                href="/client/requests/new"
                className="text-xs text-purple-700 hover:underline"
              >
                New
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {requests.length === 0 ? (
                <p className="text-sm text-stone-500">
                  No requests yet. Create one to start bidding on helpers.
                </p>
              ) : (
                requests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-xl border border-purple-50 bg-purple-50/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-purple-950">{req.title}</p>
                        <p className="mt-1 text-xs text-stone-500">
                          {req.category} · Due {formatDate(req.deadline)} ·{" "}
                          {formatCurrency(req.offerPrice)}
                        </p>
                      </div>
                      <RequestStatusBadge status={req.status} />
                    </div>
                    {req.status === "open" ? (
                      <Link
                        href={`/client/requests/${req.id}/helpers`}
                        className="mt-3 inline-flex items-center gap-1 text-sm text-purple-700 hover:underline"
                      >
                        Choose helpers <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active jobs</CardTitle>
              <Link
                href="/client/jobs"
                className="text-xs text-purple-700 hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeJobs.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-stone-500">
                    No jobs yet. When a helper accepts your bid, it shows here.
                  </p>
                  {bids.length > 0 ? (
                    <div className="space-y-2 border-t border-purple-50 pt-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                        Recent bids
                      </p>
                      {bids
                        .slice()
                        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
                        .slice(0, 4)
                        .map((bid) => (
                          <div
                            key={bid.id}
                            className="flex items-start justify-between gap-2 rounded-xl border border-purple-50 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-purple-950">
                                {bid.helperName}
                              </p>
                              <p className="mt-0.5 text-xs text-stone-500">
                                {formatCurrency(bid.offerPrice)}
                              </p>
                            </div>
                            <BidStatusBadge status={bid.status} />
                          </div>
                        ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                activeJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/client/jobs/${job.id}`}
                    className="flex items-start justify-between gap-2 rounded-xl border border-purple-50 p-4 transition hover:border-purple-200 hover:bg-purple-50/40"
                  >
                    <div>
                      <p className="font-medium text-purple-950">{job.title}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {job.helperName} · {formatCurrency(job.price)} ·{" "}
                        {formatDate(job.updatedAt)}
                      </p>
                    </div>
                    <JobStatusBadge status={job.status} />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}

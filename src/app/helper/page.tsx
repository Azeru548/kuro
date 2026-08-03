"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { BidStatusBadge, JobStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { listBidsForHelper } from "@/lib/firebase/bids";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { listJobsForHelper } from "@/lib/firebase/jobs";
import type { Bid, Job } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Inbox, Settings } from "lucide-react";

export default function HelperOverviewPage() {
  const { profile, firebaseUser } = useAuth();
  const firstName = profile?.displayName?.split(" ")[0] || "Helper";
  const [bids, setBids] = useState<Bid[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
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
      const [bidList, jobList] = await Promise.all([
        listBidsForHelper(db, firebaseUser.uid),
        listJobsForHelper(db, firebaseUser.uid),
      ]);
      setBids(bidList);
      setJobs(jobList);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    void load();
  }, [load]);

  const pending = bids.filter((b) => b.status === "pending");
  const activeJobs = jobs.filter((j) => j.status !== "completed");

  return (
    <DashboardShell
      role="helper"
      title={`Welcome, ${firstName}`}
      subtitle="Review bids, manage projects, and keep chats on Kuro."
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pending bids", value: String(pending.length) },
          { label: "Active projects", value: String(activeJobs.length) },
          { label: "All jobs", value: loading ? "…" : String(jobs.length) },
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
        <Link href="/helper/settings">
          <Button size="lg" variant="outline">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
              <p className="text-sm text-stone-500">No bids yet.</p>
            ) : (
              bids
                .slice()
                .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
                .slice(0, 5)
                .map((bid) => (
                  <div
                    key={bid.id}
                    className="flex items-center justify-between rounded-xl border border-purple-50 p-4"
                  >
                    <div>
                      <p className="font-medium text-purple-950">
                        {formatCurrency(bid.offerPrice)}
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Projects</CardTitle>
            <Link
              href="/helper/jobs"
              className="text-xs text-purple-700 hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-stone-500">Loading…</p>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-stone-500">
                Accept a bid to create your first project.
              </p>
            ) : (
              jobs.slice(0, 5).map((job) => (
                <Link
                  key={job.id}
                  href={`/helper/jobs/${job.id}`}
                  className="flex items-center justify-between rounded-xl border border-purple-50 p-4 transition hover:border-purple-200 hover:bg-purple-50/40"
                >
                  <div>
                    <p className="font-medium text-purple-950">{job.title}</p>
                    <p className="text-xs text-stone-500">
                      {job.clientName} · {formatCurrency(job.price)}
                    </p>
                  </div>
                  <JobStatusBadge status={job.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

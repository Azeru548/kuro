"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { JobStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { listJobsForClient } from "@/lib/firebase/jobs";
import type { Job } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ClientJobsPage() {
  const { firebaseUser } = useAuth();
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
      const list = await listJobsForClient(db, firebaseUser.uid);
      setJobs(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = jobs.filter((j) => j.status !== "completed");

  return (
    <DashboardShell
      role="client"
      title="My jobs"
      subtitle="Sessions created when a helper accepts your bid."
    >
      <div className="mb-4">
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-stone-500">Loading jobs…</p>
      ) : (
        <div className="space-y-3">
          {active.map((job) => (
            <Link key={job.id} href={`/client/jobs/${job.id}`}>
              <Card className="mb-3 transition hover:border-purple-200 hover:shadow-md">
                <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-display text-xl text-purple-950">
                      {job.title}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      Helper: {job.helperName} · {formatCurrency(job.price)} ·
                      Updated {formatDate(job.updatedAt)}
                    </p>
                  </div>
                  <JobStatusBadge status={job.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
          {active.length === 0 ? (
            <p className="text-sm text-stone-500">
              No active jobs yet. When a helper accepts your bid, the job appears
              here.
            </p>
          ) : null}
        </div>
      )}
    </DashboardShell>
  );
}

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

export default function ClientHistoryPage() {
  const { firebaseUser } = useAuth();
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
      const list = await listJobsForClient(db, firebaseUser.uid);
      setJobs(list);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardShell
      role="client"
      title="History"
      subtitle="Past and current help sessions in one place."
    >
      <div className="mb-4">
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-stone-500">Loading history…</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/client/jobs/${job.id}`}>
              <Card className="mb-3 transition hover:border-purple-200">
                <CardContent className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-display text-xl text-purple-950">
                      {job.title}
                    </p>
                    <p className="text-sm text-stone-600">
                      {job.helperName} · {formatCurrency(job.price)} ·{" "}
                      {formatDate(job.updatedAt)}
                    </p>
                  </div>
                  <JobStatusBadge status={job.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
          {jobs.length === 0 ? (
            <p className="text-sm text-stone-500">No sessions yet.</p>
          ) : null}
        </div>
      )}
    </DashboardShell>
  );
}

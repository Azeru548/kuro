import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { JobStatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { mockJobs } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ClientJobsPage() {
  const active = mockJobs.filter((j) => j.status !== "completed");

  return (
    <DashboardShell
      role="client"
      title="My jobs"
      subtitle="Track progress on sessions that helpers have accepted."
    >
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
          <p className="text-sm text-stone-500">No active jobs right now.</p>
        ) : null}
      </div>
    </DashboardShell>
  );
}

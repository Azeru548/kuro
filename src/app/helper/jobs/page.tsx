import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { JobStatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { mockJobs } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function HelperJobsPage() {
  return (
    <DashboardShell
      role="helper"
      title="My projects"
      subtitle="Work you're managing after accepting a client's bid."
    >
      <div className="space-y-3">
        {mockJobs.map((job) => (
          <Link key={job.id} href={`/helper/jobs/${job.id}`}>
            <Card className="mb-3 transition hover:border-purple-200">
              <CardContent className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-xl text-purple-950">
                    {job.title}
                  </p>
                  <p className="text-sm text-stone-600">
                    {job.clientName} · {formatCurrency(job.price)} ·{" "}
                    {formatDate(job.updatedAt)}
                  </p>
                </div>
                <JobStatusBadge status={job.status} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}

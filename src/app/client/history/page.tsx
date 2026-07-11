import { DashboardShell } from "@/components/dashboard-shell";
import { JobStatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { mockJobs } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ClientHistoryPage() {
  const history = [...mockJobs].sort(
    (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)
  );

  return (
    <DashboardShell
      role="client"
      title="History"
      subtitle="Past and current help sessions in one place."
    >
      <div className="space-y-3">
        {history.map((job) => (
          <Card key={job.id}>
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
        ))}
      </div>
    </DashboardShell>
  );
}

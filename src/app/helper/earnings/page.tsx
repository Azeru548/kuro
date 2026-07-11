import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockJobs } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function HelperEarningsPage() {
  const rows = mockJobs.filter(
    (j) => j.paymentStatus === "paid" || j.paymentStatus === "released"
  );
  const total = rows.reduce((s, j) => s + j.price, 0);

  return (
    <DashboardShell
      role="helper"
      title="Earnings"
      subtitle="Simple ledger of paid sessions. Payouts via Paystack / bank transfer come next."
    >
      <Card className="mb-6">
        <CardContent className="py-6">
          <p className="text-xs uppercase tracking-wide text-stone-500">
            Total tracked
          </p>
          <p className="font-display text-5xl text-purple-900">
            {formatCurrency(total)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((job) => (
            <div
              key={job.id}
              className="flex flex-col gap-2 rounded-xl border border-purple-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-purple-950">{job.title}</p>
                <p className="text-xs text-stone-500">
                  {job.clientName} · {formatDate(job.updatedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-purple-900">
                  {formatCurrency(job.price)}
                </span>
                <Badge
                  tone={job.paymentStatus === "released" ? "success" : "warning"}
                >
                  {job.paymentStatus}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

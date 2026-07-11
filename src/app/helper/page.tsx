import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { JobStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockBids, mockJobs } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Inbox } from "lucide-react";

export default function HelperOverviewPage() {
  const pending = mockBids.filter((b) => b.status === "pending");
  const myJobs = mockJobs.filter((j) => j.helperId === "helper-2" || j.helperId === "helper-1");
  const active = myJobs.filter((j) => j.status !== "completed");
  const earnings = myJobs
    .filter((j) => j.paymentStatus === "released" || j.paymentStatus === "paid")
    .reduce((sum, j) => sum + j.price, 0);

  return (
    <DashboardShell
      role="helper"
      title="Helper dashboard"
      subtitle="Review bids, manage projects, and keep chats on Kuro."
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pending bids", value: String(pending.length) },
          { label: "Active projects", value: String(active.length) },
          { label: "Tracked earnings", value: formatCurrency(earnings) },
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

      <div className="mb-6">
        <Link href="/helper/inbox">
          <Button size="lg">
            <Inbox className="h-4 w-4" />
            Open inbox
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {myJobs.map((job) => (
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
          ))}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

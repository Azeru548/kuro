"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequestStatusBadge, JobStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { mockJobs, mockRequests, mockBids } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowRight, PlusCircle } from "lucide-react";

export default function ClientOverviewPage() {
  const { profile } = useAuth();
  const firstName = profile?.displayName?.split(" ")[0] || "there";
  const openRequests = mockRequests.filter((r) => r.status === "open");
  const activeJobs = mockJobs.filter((j) => j.status !== "completed");
  const pendingBids = mockBids.filter((b) => b.status === "pending");

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

      <div className="mb-6">
        <Link href="/client/requests/new">
          <Button size="lg">
            <PlusCircle className="h-4 w-4" />
            New help request
          </Button>
        </Link>
      </div>

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
            {mockRequests.map((req) => (
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
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeJobs.length === 0 ? (
              <p className="text-sm text-stone-500">No active jobs yet.</p>
            ) : (
              activeJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/client/jobs/${job.id}`}
                  className="block rounded-xl border border-purple-50 p-4 transition hover:border-purple-200 hover:bg-purple-50/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-purple-950">{job.title}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        with {job.helperName} · {formatCurrency(job.price)}
                      </p>
                    </div>
                    <JobStatusBadge status={job.status} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

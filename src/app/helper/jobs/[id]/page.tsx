"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { JobStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockJobs } from "@/lib/mock-data";
import type { JobStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function HelperJobDetailPage() {
  const params = useParams<{ id: string }>();
  const base = mockJobs.find((j) => j.id === params.id) ?? mockJobs[0];
  const [status, setStatus] = useState<JobStatus>(base.status);

  function advance() {
    const order: JobStatus[] = [
      "assigned",
      "in_progress",
      "delivered",
      "completed",
    ];
    const i = order.indexOf(status);
    if (i >= 0 && i < order.length - 1) {
      setStatus(order[i + 1]!);
    }
  }

  return (
    <DashboardShell
      role="helper"
      title={base.title}
      subtitle={`Client: ${base.clientName}`}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Project status</CardTitle>
            <JobStatusBadge status={status} />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-stone-600">
              {base.description}
            </p>
            <div className="rounded-xl bg-purple-50 px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-600">Price</span>
                <span className="font-semibold text-purple-900">
                  {formatCurrency(base.price)}
                </span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-stone-600">Payment</span>
                <span className="capitalize">{base.paymentStatus}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-stone-600">Updated</span>
                <span>{formatDate(base.updatedAt)}</span>
              </div>
            </div>
            <Button onClick={advance} disabled={status === "completed"}>
              Mark next status
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deliverables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>
              Upload session notes, annotated drafts, or resource links here.
              Firebase Storage hooks in next.
            </p>
            <div className="rounded-xl border border-dashed border-purple-200 bg-purple-50/30 px-4 py-8 text-center text-stone-500">
              Drop files (coming soon)
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

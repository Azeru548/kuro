"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { JobStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockJobs } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

const STEPS = ["assigned", "in_progress", "delivered", "completed"] as const;

export default function ClientJobDetailPage() {
  const params = useParams<{ id: string }>();
  const job = mockJobs.find((j) => j.id === params.id) ?? mockJobs[0];
  const [paymentNote, setPaymentNote] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const stepIndex = Math.max(
    0,
    STEPS.indexOf(job.status as (typeof STEPS)[number])
  );

  async function payWithPaystack() {
    setPaying(true);
    setPaymentNote(null);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "ada@gmail.com",
          amount: job.price,
          jobId: job.id,
        }),
      });
      const json = await res.json();
      if (json.demo || res.status === 503) {
        setPaymentNote(
          "Paystack keys not configured. Add PAYSTACK_SECRET_KEY and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to enable checkout."
        );
        return;
      }
      if (json.data?.authorization_url) {
        window.location.href = json.data.authorization_url;
        return;
      }
      setPaymentNote(json.error || "Could not start payment.");
    } catch {
      setPaymentNote("Network error starting Paystack payment.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <DashboardShell
      role="client"
      title={job.title}
      subtitle={`with ${job.helperName}`}
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Progress</CardTitle>
            <JobStatusBadge status={job.status} />
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                      i <= stepIndex
                        ? "bg-purple-700 text-white"
                        : "bg-purple-100 text-purple-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={
                      i <= stepIndex ? "text-purple-950" : "text-stone-400"
                    }
                  >
                    {step.replaceAll("_", " ")}
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-8 rounded-xl bg-purple-50 p-4 text-sm text-stone-700">
              <p className="font-medium text-purple-900">Brief</p>
              <p className="mt-1 leading-relaxed">{job.description}</p>
              <p className="mt-3 text-xs text-stone-500">
                Started {formatDate(job.createdAt)} · Last update{" "}
                {formatDate(job.updatedAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">Amount</span>
              <span className="font-display text-2xl text-purple-900">
                {formatCurrency(job.price)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">Payment</span>
              <span className="capitalize text-purple-800">
                {job.paymentStatus}
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Payments are processed with Paystack. Keep conversations and files
              on Kuro.
            </p>
            {job.paymentStatus === "pending" || job.paymentStatus === "failed" ? (
              <Button
                className="w-full"
                onClick={payWithPaystack}
                disabled={paying}
              >
                {paying ? "Starting…" : "Pay with Paystack"}
              </Button>
            ) : (
              <Button className="w-full" variant="secondary" disabled>
                Payment {job.paymentStatus}
              </Button>
            )}
            {paymentNote ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {paymentNote}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { JobStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/file-uploader";
import { useAuth } from "@/contexts/auth-context";
import { chatIdFor } from "@/lib/firebase/chat";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import {
  getJob,
  jobStatusStepIndex,
  setJobDeliverables,
} from "@/lib/firebase/jobs";
import type { FileAttachment, Job } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const STEPS = ["assigned", "in_progress", "delivered", "completed"] as const;

export default function ClientJobDetailPage() {
  const params = useParams<{ id: string }>();
  const { firebaseUser, profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentNote, setPaymentNote] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      setError("Firebase is not configured.");
      setLoading(false);
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      setError("Firestore unavailable.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const j = await getJob(db, params.id);
      if (!j) {
        setError("Job not found.");
        setJob(null);
      } else if (firebaseUser && j.clientId !== firebaseUser.uid) {
        setError("You do not have access to this job.");
        setJob(null);
      } else {
        setJob(j);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job.");
    } finally {
      setLoading(false);
    }
  }, [params.id, firebaseUser]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onClientFilesChange(files: FileAttachment[]) {
    if (!job) return;
    const db = getFirebaseDb();
    if (!db) return;
    // Clients may add extra materials as deliverables too (shared file list)
    const previous = job.deliverables;
    setJob({ ...job, deliverables: files, updatedAt: new Date().toISOString() });
    try {
      await setJobDeliverables(db, job.id, files);
      setPaymentNote(null);
    } catch (err) {
      setJob({ ...job, deliverables: previous });
      setPaymentNote(
        err instanceof Error ? err.message : "Failed to save files."
      );
    }
  }

  async function payWithPaystack() {
    if (!job || !profile) return;
    setPaying(true);
    setPaymentNote(null);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          amount: job.price,
          jobId: job.id,
        }),
      });
      const json = await res.json();
      if (json.demo || res.status === 503) {
        setPaymentNote(
          "Paystack keys not configured yet (Stage 5). Add PAYSTACK keys to .env.local to enable checkout."
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

  if (loading) {
    return (
      <DashboardShell role="client" title="Job" subtitle="Loading…">
        <p className="text-sm text-stone-500">Loading job…</p>
      </DashboardShell>
    );
  }

  if (error || !job) {
    return (
      <DashboardShell role="client" title="Job" subtitle="Unavailable">
        <Card>
          <CardContent className="space-y-3 py-6">
            <p className="text-sm text-rose-700">{error || "Job not found."}</p>
            <Link href="/client/jobs">
              <Button variant="outline">Back to jobs</Button>
            </Link>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  const stepIndex = jobStatusStepIndex(job.status);

  return (
    <DashboardShell
      role="client"
      title={job.title}
      subtitle={`with ${job.helperName}`}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
        <Link
          href={`/client/messages?chat=${encodeURIComponent(
            chatIdFor(job.requestId, job.helperId)
          )}`}
        >
          <Button variant="secondary" size="sm">
            Open chat
          </Button>
        </Link>
      </div>

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

            <div className="mt-6 space-y-4">
              <FileUploader
                label="Your original attachments"
                files={job.requestAttachments ?? []}
                readOnly
                folder="kuro/readonly"
                hint="No files attached to this request."
              />
              <FileUploader
                label="Shared job files / deliverables"
                files={job.deliverables ?? []}
                onChange={(files) => void onClientFilesChange(files)}
                folder={`kuro/jobs/${job.id}/deliverables`}
                uploadedBy={firebaseUser?.uid}
                hint="Add extra materials or download helper deliverables."
              />
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
              Payments use Paystack. Full verify → mark paid lands in Stage 5.
            </p>
            {job.paymentStatus === "pending" ||
            job.paymentStatus === "failed" ? (
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

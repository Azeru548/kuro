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
  advanceJobStatus,
  getJob,
  jobStatusStepIndex,
  nextJobStatus,
  setJobDeliverables,
} from "@/lib/firebase/jobs";
import type { FileAttachment, Job } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const STEPS = ["assigned", "in_progress", "delivered", "completed"] as const;

export default function HelperJobDetailPage() {
  const params = useParams<{ id: string }>();
  const { firebaseUser } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
      } else if (firebaseUser && j.helperId !== firebaseUser.uid) {
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

  async function advance() {
    if (!job) return;
    const db = getFirebaseDb();
    if (!db) return;
    setBusy(true);
    setToast(null);
    try {
      const next = await advanceJobStatus(db, job.id);
      setJob((prev) =>
        prev
          ? {
              ...prev,
              status: next,
              updatedAt: new Date().toISOString(),
            }
          : prev
      );
      setToast(`Status updated to ${next.replaceAll("_", " ")}.`);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onDeliverablesChange(files: FileAttachment[]) {
    if (!job) return;
    const db = getFirebaseDb();
    if (!db) return;
    const previous = job.deliverables;
    setJob({ ...job, deliverables: files, updatedAt: new Date().toISOString() });
    try {
      await setJobDeliverables(db, job.id, files);
      setToast("Deliverables updated.");
    } catch (err) {
      setJob({ ...job, deliverables: previous });
      setToast(err instanceof Error ? err.message : "Failed to save files.");
    }
  }

  if (loading) {
    return (
      <DashboardShell role="helper" title="Project" subtitle="Loading…">
        <p className="text-sm text-stone-500">Loading project…</p>
      </DashboardShell>
    );
  }

  if (error || !job) {
    return (
      <DashboardShell role="helper" title="Project" subtitle="Unavailable">
        <Card>
          <CardContent className="space-y-3 py-6">
            <p className="text-sm text-rose-700">{error || "Job not found."}</p>
            <Link href="/helper/jobs">
              <Button variant="outline">Back to projects</Button>
            </Link>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  const stepIndex = jobStatusStepIndex(job.status);
  const next = nextJobStatus(job.status);

  return (
    <DashboardShell
      role="helper"
      title={job.title}
      subtitle={`Client: ${job.clientName}`}
    >
      {toast ? (
        <div className="mb-4 rounded-xl border border-purple-200 bg-white px-4 py-3 text-sm text-purple-900 shadow-sm">
          {toast}
        </div>
      ) : null}

      <div className="mb-4">
        <Link
          href={`/helper/messages?chat=${encodeURIComponent(
            chatIdFor(job.requestId, job.helperId)
          )}`}
        >
          <Button variant="secondary" size="sm">
            Open chat with client
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Project status</CardTitle>
            <JobStatusBadge status={job.status} />
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
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

            <p className="text-sm leading-relaxed text-stone-600">
              {job.description}
            </p>
            <div className="rounded-xl bg-purple-50 px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-600">Price</span>
                <span className="font-semibold text-purple-900">
                  {formatCurrency(job.price)}
                </span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-stone-600">Payment</span>
                <span className="capitalize">{job.paymentStatus}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-stone-600">Updated</span>
                <span>{formatDate(job.updatedAt)}</span>
              </div>
            </div>
            <Button onClick={() => void advance()} disabled={!next || busy}>
              {busy
                ? "Updating…"
                : next
                  ? `Mark as ${next.replaceAll("_", " ")}`
                  : "Completed"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-stone-600">
            <FileUploader
              label="Client brief attachments"
              files={job.requestAttachments ?? []}
              readOnly
              folder="kuro/readonly"
              hint="No brief files on this request."
            />
            <FileUploader
              label="Your deliverables"
              files={job.deliverables ?? []}
              onChange={(files) => void onDeliverablesChange(files)}
              folder="hauser/listings"
              uploadedBy={firebaseUser?.uid}
              hint="Session notes, annotated drafts, resources — Cloudinary."
            />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

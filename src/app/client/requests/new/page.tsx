"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/file-uploader";
import { useAuth } from "@/contexts/auth-context";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { createRequest } from "@/lib/firebase/requests";
import { REQUEST_CATEGORIES, type FileAttachment } from "@/lib/types";

export default function NewRequestPage() {
  const router = useRouter();
  const { profile, firebaseUser } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(REQUEST_CATEGORIES[0]);
  const [deadline, setDeadline] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [integrity, setIntegrity] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const price = Number(offerPrice);
    if (!title.trim() || !description.trim() || !deadline) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid offer price.");
      return;
    }
    if (!integrity) {
      setError("Please confirm the academic integrity pledge.");
      return;
    }

    if (!isFirebaseConfigured()) {
      setError("Firebase is not configured. Add keys to .env.local and restart.");
      return;
    }

    if (!firebaseUser || !profile) {
      setError("You must be logged in to create a request.");
      return;
    }

    const db = getFirebaseDb();
    if (!db) {
      setError("Could not connect to Firestore.");
      return;
    }

    setSubmitting(true);
    try {
      const request = await createRequest(db, {
        clientId: firebaseUser.uid,
        clientName: profile.displayName,
        title,
        description,
        category,
        deadline,
        offerPrice: price,
        attachments,
      });
      router.push(`/client/requests/${request.id}/helpers`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to create request.";
      if (msg.includes("permission") || msg.includes("Permission")) {
        setError(
          "Firestore permission denied. Deploy the updated firestore.rules and ensure you're logged in."
        );
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell
      role="client"
      title="New help request"
      subtitle="Describe what you need, set your budget, then choose up to three helpers."
    >
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Request details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm text-stone-700">
                Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Linked list tutoring session"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-stone-700">
                Description *
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What do you need help with? Goals, constraints, materials…"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm text-stone-700">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-purple-200 bg-white px-3.5 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                >
                  {REQUEST_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-stone-700">
                  Deadline *
                </label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-stone-700">
                Price you&apos;re willing to pay (NGN) *
              </label>
              <Input
                type="number"
                min={500}
                step={500}
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="8000"
                required
              />
              <p className="mt-1 text-xs text-stone-500">
                Helpers set their own minimum. You&apos;ll only be able to bid
                where your offer meets or exceeds it.
              </p>
            </div>

            <FileUploader
              label="Attachments (optional)"
              files={attachments}
              onChange={setAttachments}
              folder="hauser/listings"
              uploadedBy={firebaseUser?.uid}
              disabled={submitting}
              hint="Briefs, screenshots, drafts — uploaded via Cloudinary."
            />

            <label className="flex items-start gap-3 rounded-xl border border-purple-100 bg-purple-50/50 p-3 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={integrity}
                onChange={(e) => setIntegrity(e.target.checked)}
                className="mt-1"
              />
              <span>
                I understand Kuro is for tutoring, feedback, and collaboration.
                I will not submit someone else&apos;s work as my own.
              </span>
            </label>

            {error ? (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? "Creating…" : "Continue to helpers"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

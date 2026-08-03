"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { FileUploader } from "@/components/file-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { getRequest, updateRequest } from "@/lib/firebase/requests";
import {
  REQUEST_CATEGORIES,
  type FileAttachment,
  type HelpRequest,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function EditRequestPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { firebaseUser, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<HelpRequest | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(REQUEST_CATEGORIES[0]);
  const [deadline, setDeadline] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);

  const load = useCallback(async () => {
    if (!firebaseUser || !isFirebaseConfigured()) {
      setLoading(false);
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const req = await getRequest(db, params.id);
      if (!req) {
        setError("Request not found.");
        setRequest(null);
        return;
      }
      if (req.clientId !== firebaseUser.uid) {
        setError("You can only edit your own requests.");
        setRequest(null);
        return;
      }
      if (req.status !== "open") {
        setError(
          `This request is “${req.status.replaceAll("_", " ")}” and can no longer be edited.`
        );
        setRequest(req);
        return;
      }
      setRequest(req);
      setTitle(req.title);
      setDescription(req.description);
      setCategory(req.category);
      setDeadline(req.deadline);
      setOfferPrice(String(req.offerPrice));
      setAttachments(req.attachments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load request.");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser || !request) return;
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

    const db = getFirebaseDb();
    if (!db) {
      setError("Firestore unavailable.");
      return;
    }

    setSaving(true);
    try {
      await updateRequest(db, {
        requestId: request.id,
        clientId: firebaseUser.uid,
        title,
        description,
        category,
        deadline,
        offerPrice: price,
        attachments,
      });
      router.push(`/client/requests/${request.id}/helpers`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell
      role="client"
      title="Edit request"
      subtitle="Update details and offer price while the request is still open."
    >
      {loading ? (
        <p className="text-sm text-stone-500">Loading request…</p>
      ) : error && !request ? (
        <Card>
          <CardContent className="space-y-3 py-6">
            <p className="text-sm text-rose-700">{error}</p>
            <Link href="/client">
              <Button variant="outline">Back to overview</Button>
            </Link>
          </CardContent>
        </Card>
      ) : request && request.status !== "open" ? (
        <Card>
          <CardContent className="space-y-3 py-6">
            <p className="text-sm text-amber-900">{error}</p>
            <p className="text-sm text-stone-600">
              Current offer: {formatCurrency(request.offerPrice)}
            </p>
            <Link href="/client">
              <Button variant="outline">Back to overview</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Request details</CardTitle>
            <p className="text-sm text-stone-500">
              Changing the price does not auto-update existing bids — helpers
              still see the offer they were bid with until you re-bid.
            </p>
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
                  required
                />
              </div>

              <FileUploader
                label="Attachments"
                files={attachments}
                onChange={setAttachments}
                folder="hauser/listings"
                uploadedBy={firebaseUser?.uid}
                disabled={saving}
              />

              {error ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="lg" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                <Link href={`/client/requests/${params.id}/helpers`}>
                  <Button type="button" variant="outline" size="lg">
                    Back to helpers
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}

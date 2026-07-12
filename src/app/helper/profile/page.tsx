"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import {
  getHelperProfile,
  upsertHelperProfile,
} from "@/lib/firebase/helpers";
import { REQUEST_CATEGORIES } from "@/lib/types";

export default function HelperProfilePage() {
  const { profile, firebaseUser } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [bio, setBio] = useState("");
  const [minPrice, setMinPrice] = useState("5000");
  const [available, setAvailable] = useState(true);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!firebaseUser || !isFirebaseConfigured()) {
        setLoading(false);
        return;
      }
      const db = getFirebaseDb();
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        const hp = await getHelperProfile(db, firebaseUser.uid);
        if (hp) {
          setDisplayName(hp.displayName);
          setBio(hp.bio);
          setMinPrice(String(hp.minPrice));
          setAvailable(hp.available);
          setSpecialties(hp.specialties);
        } else if (profile?.displayName) {
          setDisplayName(profile.displayName);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [firebaseUser, profile?.displayName]);

  function toggleSpecialty(s: string) {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!firebaseUser) {
      setError("You must be logged in.");
      return;
    }
    const price = Number(minPrice);
    if (!Number.isFinite(price) || price < 500) {
      setError("Minimum price must be at least ₦500.");
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      setError("Firestore unavailable.");
      return;
    }

    setSaving(true);
    try {
      await upsertHelperProfile(db, {
        uid: firebaseUser.uid,
        displayName: displayName.trim() || profile?.displayName || "Helper",
        bio,
        minPrice: price,
        specialties,
        available,
      });
      setMessage("Profile saved. Clients can now bid on you.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell
      role="helper"
      title="Helper profile"
      subtitle="Your minimum price and specialties control who can bid on you."
    >
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Public profile</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-stone-500">Loading profile…</p>
          ) : (
            <form onSubmit={save} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm text-stone-700">
                  Display name
                </label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-stone-700">Bio</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="What you help with, courses, style of tutoring…"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-stone-700">
                  Minimum price (NGN)
                </label>
                <Input
                  type="number"
                  min={500}
                  step={500}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-stone-700">
                  Specialties
                </label>
                <div className="flex flex-wrap gap-2">
                  {REQUEST_CATEGORIES.map((c) => {
                    const on = specialties.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleSpecialty(c)}
                        className={`rounded-full px-3 py-1.5 text-xs transition ${
                          on
                            ? "bg-purple-700 text-white"
                            : "bg-purple-50 text-purple-900 hover:bg-purple-100"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                />
                Available for new bids
              </label>
              {error ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}
              {message ? (
                <p className="text-sm text-emerald-700">{message}</p>
              ) : null}
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save profile"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

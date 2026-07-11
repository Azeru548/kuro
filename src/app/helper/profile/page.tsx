"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockHelpers } from "@/lib/mock-data";
import { REQUEST_CATEGORIES } from "@/lib/types";

export default function HelperProfilePage() {
  const base = mockHelpers[0]!;
  const [displayName, setDisplayName] = useState(base.displayName);
  const [bio, setBio] = useState(base.bio);
  const [minPrice, setMinPrice] = useState(String(base.minPrice));
  const [available, setAvailable] = useState(base.available);
  const [specialties, setSpecialties] = useState<string[]>(base.specialties);
  const [saved, setSaved] = useState(false);

  function toggleSpecialty(s: string) {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
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
          <form onSubmit={save} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm text-stone-700">
                Display name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-stone-700">Bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
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
            <Button type="submit">Save profile</Button>
            {saved ? (
              <p className="text-sm text-emerald-700">Saved (demo only).</p>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

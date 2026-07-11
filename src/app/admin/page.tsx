import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#f7f3fc] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="font-display text-2xl text-purple-900">
          Kuro
        </Link>
        <h1 className="mt-4 font-display text-4xl text-purple-950">
          Admin (stub)
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Thin moderation shell for disputes, bans, and reports — implement after
          auth + Firestore.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Open disputes", value: "0" },
            { label: "Reports", value: "0" },
            { label: "Users", value: "—" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="py-5">
                <p className="text-xs text-stone-500">{s.label}</p>
                <p className="font-display text-3xl text-purple-900">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Queue</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-stone-500">
            <span>No items yet</span>
            <Badge tone="muted">coming soon</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

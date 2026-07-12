"use client";

import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { MessagesView } from "@/components/messages-view";

export default function HelperMessagesPage() {
  return (
    <DashboardShell
      role="helper"
      title="Messages"
      subtitle="Talk with clients who bid on you — keep business on the platform."
    >
      <Suspense
        fallback={<p className="text-sm text-stone-500">Loading messages…</p>}
      >
        <MessagesView role="helper" />
      </Suspense>
    </DashboardShell>
  );
}

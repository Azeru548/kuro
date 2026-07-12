"use client";

import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { MessagesView } from "@/components/messages-view";

export default function ClientMessagesPage() {
  return (
    <DashboardShell
      role="client"
      title="Messages"
      subtitle="Chats open when you bid on a helper. Keep coordination on Kuro."
    >
      <Suspense
        fallback={<p className="text-sm text-stone-500">Loading messages…</p>}
      >
        <MessagesView role="client" />
      </Suspense>
    </DashboardShell>
  );
}

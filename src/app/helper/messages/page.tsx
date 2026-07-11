"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { ChatPanel } from "@/components/chat-panel";
import { Card, CardContent } from "@/components/ui/card";
import { mockChats, mockMessages } from "@/lib/mock-data";
import { cn, formatDate } from "@/lib/utils";

export default function HelperMessagesPage() {
  // Demo: show chats where helper is helper-1 or helper-2
  const threads = mockChats;
  const [activeId, setActiveId] = useState(threads[0]?.id);
  const active = threads.find((t) => t.id === activeId) ?? threads[0];

  const helperId = active?.helperId ?? "helper-1";
  const helperName = active?.helperName ?? "Helper";

  return (
    <DashboardShell
      role="helper"
      title="Messages"
      subtitle="Talk with clients who bid on you — keep business on the platform."
    >
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardContent className="space-y-1 p-3">
            {threads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveId(t.id)}
                className={cn(
                  "w-full rounded-xl px-3 py-3 text-left transition",
                  active?.id === t.id
                    ? "bg-purple-700 text-white"
                    : "hover:bg-purple-50"
                )}
              >
                <p className="font-medium">{t.clientName}</p>
                <p
                  className={cn(
                    "mt-0.5 line-clamp-1 text-xs",
                    active?.id === t.id ? "text-purple-100" : "text-stone-500"
                  )}
                >
                  {t.lastMessage}
                </p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    active?.id === t.id ? "text-purple-200" : "text-stone-400"
                  )}
                >
                  {formatDate(t.updatedAt)}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        {active ? (
          <ChatPanel
            thread={active}
            initialMessages={mockMessages[active.id] ?? []}
            currentUserId={helperId}
            currentUserName={helperName}
          />
        ) : null}
      </div>
    </DashboardShell>
  );
}

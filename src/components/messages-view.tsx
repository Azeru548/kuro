"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChatPanel } from "@/components/chat-panel";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { subscribeToUserChats } from "@/lib/firebase/chat";
import type { ChatThread } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export function MessagesView({ role }: { role: "client" | "helper" }) {
  const { firebaseUser, profile } = useAuth();
  const search = useSearchParams();
  const preferredChatId = search.get("chat");

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    const unsub = subscribeToUserChats(
      db,
      role,
      firebaseUser.uid,
      (list) => {
        setThreads(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [firebaseUser, role]);

  useEffect(() => {
    if (!threads.length) {
      setActiveId(null);
      return;
    }
    if (preferredChatId && threads.some((t) => t.id === preferredChatId)) {
      setActiveId(preferredChatId);
      return;
    }
    setActiveId((prev) => {
      if (prev && threads.some((t) => t.id === prev)) return prev;
      return threads[0]!.id;
    });
  }, [threads, preferredChatId]);

  const active = threads.find((t) => t.id === activeId) ?? null;
  const displayName = profile?.displayName ?? "You";
  const userId = firebaseUser?.uid ?? "";

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="h-fit">
        <CardContent className="space-y-1 p-3">
          {loading ? (
            <p className="px-2 py-4 text-sm text-stone-500">Loading chats…</p>
          ) : error ? (
            <p className="px-2 py-4 text-sm text-rose-700">{error}</p>
          ) : threads.length === 0 ? (
            <p className="px-2 py-4 text-sm text-stone-500">
              {role === "client"
                ? "No chats yet. Bid on a helper to open a conversation."
                : "No chats yet. When a client bids on you, a thread appears here."}
            </p>
          ) : (
            threads.map((t) => {
              const partner =
                role === "client" ? t.helperName : t.clientName;
              return (
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
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium">{partner}</p>
                    {t.status === "closed" ? (
                      <span
                        className={cn(
                          "text-[10px]",
                          active?.id === t.id
                            ? "text-purple-200"
                            : "text-stone-400"
                        )}
                      >
                        closed
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={cn(
                      "mt-0.5 line-clamp-1 text-xs",
                      active?.id === t.id ? "text-purple-100" : "text-stone-500"
                    )}
                  >
                    {t.lastMessage || t.title}
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
              );
            })
          )}
        </CardContent>
      </Card>

      {active && userId ? (
        <ChatPanel
          key={active.id}
          thread={active}
          currentUserId={userId}
          currentUserName={displayName}
        />
      ) : !loading && threads.length === 0 ? null : (
        <p className="text-sm text-stone-500">Select a conversation.</p>
      )}
    </div>
  );
}

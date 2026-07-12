"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFirebaseDb } from "@/lib/firebase/client";
import { sendMessage, subscribeToMessages } from "@/lib/firebase/chat";
import type { ChatMessage, ChatThread } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";

const CONTACT_HINT =
  /\b(\+?\d{10,}|whatsapp|telegram|pay\s*me\s*on|@gmail|@yahoo)\b/i;

export function ChatPanel({
  thread,
  currentUserId,
  currentUserName,
}: {
  thread: ChatThread;
  currentUserId: string;
  currentUserName: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const partnerName = useMemo(
    () =>
      currentUserId === thread.clientId
        ? thread.helperName
        : thread.clientName,
    [currentUserId, thread]
  );

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) {
      setError("Firestore unavailable.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessages([]);
    setError(null);

    const unsub = subscribeToMessages(
      db,
      thread.id,
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [thread.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const value = text.trim();
    if (!value || sending) return;

    if (CONTACT_HINT.test(value)) {
      setWarning(
        "Keep contact details and payments on Kuro so both sides stay protected."
      );
    } else {
      setWarning(null);
    }

    const db = getFirebaseDb();
    if (!db) {
      setError("Firestore unavailable.");
      return;
    }

    setSending(true);
    setError(null);
    try {
      await sendMessage(db, {
        chatId: thread.id,
        senderId: currentUserId,
        senderName: currentUserName,
        text: value,
      });
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="flex h-[520px] flex-col">
      <CardHeader className="border-b border-purple-50 pb-4">
        <CardTitle className="text-2xl">{thread.title}</CardTitle>
        <p className="text-sm text-stone-500">
          Chat with {partnerName}
          {thread.status === "closed" ? " · closed" : ""}
        </p>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 pt-4">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {loading ? (
            <p className="text-center text-sm text-stone-500">Loading messages…</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-stone-500">
              No messages yet. Say hello.
            </p>
          ) : (
            messages.map((m) => {
              const system = m.senderId === "system";
              const mine = m.senderId === currentUserId;
              if (system) {
                return (
                  <div key={m.id} className="flex justify-center">
                    <p className="max-w-[90%] rounded-full bg-stone-100 px-3 py-1 text-center text-[11px] text-stone-500">
                      {m.text}
                    </p>
                  </div>
                );
              }
              return (
                <div
                  key={m.id}
                  className={cn("flex", mine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                      mine
                        ? "rounded-br-md bg-purple-700 text-white"
                        : "rounded-bl-md bg-purple-50 text-stone-800"
                    )}
                  >
                    {!mine ? (
                      <p className="mb-0.5 text-[11px] font-medium opacity-70">
                        {m.senderName}
                      </p>
                    ) : null}
                    <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {warning ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {warning}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {error}
          </p>
        ) : null}

        {thread.status === "closed" ? (
          <p className="text-center text-sm text-stone-500">
            This conversation is closed.
          </p>
        ) : (
          <div className="flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message…"
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <Button
              onClick={() => void send()}
              disabled={sending || !text.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

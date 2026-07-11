"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChatMessage, ChatThread } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";

const CONTACT_HINT =
  /\b(\+?\d{10,}|whatsapp|telegram|pay\s*me\s*on|@gmail|@yahoo)\b/i;

export function ChatPanel({
  thread,
  initialMessages,
  currentUserId,
  currentUserName,
}: {
  thread: ChatThread;
  initialMessages: ChatMessage[];
  currentUserId: string;
  currentUserName: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [warning, setWarning] = useState<string | null>(null);

  const partnerName = useMemo(
    () =>
      currentUserId === thread.clientId
        ? thread.helperName
        : thread.clientName,
    [currentUserId, thread]
  );

  function send() {
    const value = text.trim();
    if (!value) return;

    if (CONTACT_HINT.test(value)) {
      setWarning(
        "Keep contact details and payments on Kuro so both sides stay protected."
      );
    } else {
      setWarning(null);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        chatId: thread.id,
        senderId: currentUserId,
        senderName: currentUserName,
        text: value,
        createdAt: new Date().toISOString(),
      },
    ]);
    setText("");
  }

  return (
    <Card className="flex h-[520px] flex-col">
      <CardHeader className="border-b border-purple-50 pb-4">
        <CardTitle className="text-2xl">{thread.title}</CardTitle>
        <p className="text-sm text-stone-500">Chat with {partnerName}</p>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 pt-4">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((m) => {
            const mine = m.senderId === currentUserId;
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
                  <p className="leading-relaxed">{m.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        {warning ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {warning}
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
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <Button onClick={send} aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

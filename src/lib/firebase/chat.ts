import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import type { ChatMessage, ChatThread } from "@/lib/types";

/** Stable id so one bid pair = one thread */
export function chatIdFor(requestId: string, helperId: string) {
  return `${requestId}_${helperId}`;
}

function mapThread(id: string, data: Record<string, unknown>): ChatThread {
  return {
    id,
    requestId: String(data.requestId ?? ""),
    bidId: String(data.bidId ?? ""),
    clientId: String(data.clientId ?? ""),
    helperId: String(data.helperId ?? ""),
    helperName: String(data.helperName ?? ""),
    clientName: String(data.clientName ?? ""),
    title: String(data.title ?? "Conversation"),
    status: data.status === "closed" ? "closed" : "open",
    lastMessage: data.lastMessage ? String(data.lastMessage) : undefined,
    updatedAt:
      typeof data.updatedAt === "string"
        ? data.updatedAt
        : typeof data.createdAt === "string"
          ? data.createdAt
          : new Date().toISOString(),
  };
}

function mapMessage(id: string, data: Record<string, unknown>): ChatMessage {
  return {
    id,
    chatId: String(data.chatId ?? ""),
    senderId: String(data.senderId ?? ""),
    senderName: String(data.senderName ?? ""),
    text: String(data.text ?? ""),
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : new Date().toISOString(),
  };
}

export async function ensureChatForBid(
  db: Firestore,
  params: {
    requestId: string;
    bidId: string;
    clientId: string;
    clientName: string;
    helperId: string;
    helperName: string;
    title: string;
  }
): Promise<ChatThread> {
  const id = chatIdFor(params.requestId, params.helperId);
  const ref = doc(db, "chats", id);
  const existing = await getDoc(ref);
  const now = new Date().toISOString();

  if (existing.exists()) {
    // Re-open if previously closed (e.g. cancelled then re-bid)
    const data = existing.data() as Record<string, unknown>;
    if (data.status === "closed") {
      await updateDoc(ref, {
        status: "open",
        bidId: params.bidId,
        updatedAt: now,
        updatedAtServer: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        bidId: params.bidId,
        updatedAt: now,
        updatedAtServer: serverTimestamp(),
      });
    }
    const snap = await getDoc(ref);
    return mapThread(snap.id, snap.data() as Record<string, unknown>);
  }

  await setDoc(ref, {
    requestId: params.requestId,
    bidId: params.bidId,
    clientId: params.clientId,
    clientName: params.clientName,
    helperId: params.helperId,
    helperName: params.helperName,
    title: params.title,
    status: "open",
    lastMessage: "",
    createdAt: now,
    updatedAt: now,
    updatedAtServer: serverTimestamp(),
  });

  // Optional system-style first message
  await addDoc(collection(db, "chats", id, "messages"), {
    chatId: id,
    senderId: "system",
    senderName: "Kuro",
    text: `Chat opened for “${params.title}”. Keep coordination on the platform.`,
    createdAt: now,
    createdAtServer: serverTimestamp(),
  });

  await updateDoc(ref, {
    lastMessage: "Chat opened.",
    updatedAt: now,
  });

  return {
    id,
    requestId: params.requestId,
    bidId: params.bidId,
    clientId: params.clientId,
    helperId: params.helperId,
    helperName: params.helperName,
    clientName: params.clientName,
    title: params.title,
    status: "open",
    lastMessage: "Chat opened.",
    updatedAt: now,
  };
}

export async function closeChat(
  db: Firestore,
  requestId: string,
  helperId: string
): Promise<void> {
  const id = chatIdFor(requestId, helperId);
  const ref = doc(db, "chats", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  await updateDoc(ref, {
    status: "closed",
    updatedAt: new Date().toISOString(),
    updatedAtServer: serverTimestamp(),
  });
}

export async function listChatsForClient(
  db: Firestore,
  clientId: string
): Promise<ChatThread[]> {
  const q = query(collection(db, "chats"), where("clientId", "==", clientId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapThread(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function listChatsForHelper(
  db: Firestore,
  helperId: string
): Promise<ChatThread[]> {
  const q = query(collection(db, "chats"), where("helperId", "==", helperId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapThread(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function getChat(
  db: Firestore,
  chatId: string
): Promise<ChatThread | null> {
  const snap = await getDoc(doc(db, "chats", chatId));
  if (!snap.exists()) return null;
  return mapThread(snap.id, snap.data() as Record<string, unknown>);
}

export function subscribeToMessages(
  db: Firestore,
  chatId: string,
  onChange: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const messages = snap.docs.map((d) =>
        mapMessage(d.id, d.data() as Record<string, unknown>)
      );
      onChange(messages);
    },
    (err) => {
      // Fallback without orderBy if index missing — poll once
      void getDocs(collection(db, "chats", chatId, "messages"))
        .then((snap) => {
          const messages = snap.docs
            .map((d) => mapMessage(d.id, d.data() as Record<string, unknown>))
            .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
          onChange(messages);
        })
        .catch((e) => onError?.(e instanceof Error ? e : err));
    }
  );
}

export async function sendMessage(
  db: Firestore,
  params: {
    chatId: string;
    senderId: string;
    senderName: string;
    text: string;
  }
): Promise<ChatMessage> {
  const text = params.text.trim();
  if (!text) throw new Error("Message cannot be empty.");

  const chatRef = doc(db, "chats", params.chatId);
  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) throw new Error("Chat not found.");
  const chat = chatSnap.data() as Record<string, unknown>;
  if (chat.status === "closed") {
    throw new Error("This conversation is closed.");
  }
  if (
    params.senderId !== chat.clientId &&
    params.senderId !== chat.helperId
  ) {
    throw new Error("You are not a participant in this chat.");
  }

  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, "chats", params.chatId, "messages"), {
    chatId: params.chatId,
    senderId: params.senderId,
    senderName: params.senderName,
    text,
    createdAt: now,
    createdAtServer: serverTimestamp(),
  });

  await updateDoc(chatRef, {
    lastMessage: text.slice(0, 200),
    updatedAt: now,
    updatedAtServer: serverTimestamp(),
  });

  return {
    id: ref.id,
    chatId: params.chatId,
    senderId: params.senderId,
    senderName: params.senderName,
    text,
    createdAt: now,
  };
}

export function subscribeToUserChats(
  db: Firestore,
  role: "client" | "helper",
  userId: string,
  onChange: (threads: ChatThread[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const field = role === "client" ? "clientId" : "helperId";
  const q = query(collection(db, "chats"), where(field, "==", userId));

  return onSnapshot(
    q,
    (snap) => {
      const threads = snap.docs
        .map((d) => mapThread(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
      onChange(threads);
    },
    (err) => onError?.(err)
  );
}

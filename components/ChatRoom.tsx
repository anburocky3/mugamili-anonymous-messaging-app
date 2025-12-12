"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ClipboardEvent,
} from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { postMessage } from "@/actions/room-actions";
import MessageCard from "@/components/MessageCard";
import { Link2, Send, Clock, User } from "lucide-react";
import Image from "next/image";
import ShareBar from "./ShareBar";

export type ChatRoomProps = {
  roomId: string;
  className?: string;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  nickname: string;
  content: string;
  mediaUrl?: string | null;
  timestamp?: Date | null;
  isFlagged?: boolean;
};

export default function ChatRoom({ roomId, className }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [nickname, setNickname] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [showMedia, setShowMedia] = useState(false);
  const [mediaBroken, setMediaBroken] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [roomInfo, setRoomInfo] = useState<{
    creatorName?: string;
    createdAt?: Timestamp | Date;
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  function formatTimeHumanReadable(date: Date | Timestamp): string {
    const d = date instanceof Timestamp ? date.toDate() : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }

  function isLikelyImageUrl(url: string): boolean {
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) return false;
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(trimmed);
  }

  function handleContentPaste(
    e: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const text = e.clipboardData?.getData("text")?.trim() ?? "";
    if (text && isLikelyImageUrl(text)) {
      e.preventDefault();
      setShowMedia(true);
      setMediaUrl(text);
      setMediaBroken(false);
    }
  }

  useEffect(() => {
    if (!roomId) return;
    (async () => {
      try {
        const roomSnap = await getDoc(doc(db, "rooms", roomId));
        if (roomSnap.exists()) {
          const data = roomSnap.data() as Record<string, unknown>;
          setRoomInfo({
            creatorName: data.creatorName as string | undefined,
            createdAt: data.createdAt as Timestamp | Date | undefined,
          });
        }
      } catch (e) {
        console.error("Failed to fetch room info", e);
      }
    })();

    const q = query(
      collection(db, "messages"),
      where("roomId", "==", roomId),
      orderBy("timestamp", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows: ChatMessage[] = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        let ts: Date | null | undefined = undefined;
        if (data.timestamp instanceof Timestamp) ts = data.timestamp.toDate();
        else if (
          data.timestamp &&
          typeof (data.timestamp as Record<string, unknown>).toDate ===
            "function"
        )
          ts = (
            (data.timestamp as Record<string, unknown>).toDate as () => Date
          )();
        else ts = null;
        return {
          id: d.id,
          roomId: data.roomId as string,
          nickname: data.nickname as string,
          content: (data.content as string) ?? "",
          mediaUrl: (data.mediaUrl as string | null) ?? null,
          timestamp: ts ?? null,
          isFlagged: !!data.isFlagged,
        } satisfies ChatMessage;
      });
      setMessages(rows);
      requestAnimationFrame(() =>
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
      );
    });
    return () => unsub();
  }, [roomId]);

  const canSubmit = useMemo(() => {
    const textOk = content.trim().length > 0;
    const mediaOk = mediaUrl.trim().length > 0;
    return textOk || mediaOk;
  }, [content, mediaUrl]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    const payload = {
      roomId,
      content: content.trim(),
      nickname: nickname.trim() || undefined,
      mediaUrl: mediaUrl.trim() || undefined,
    } as const;

    startTransition(async () => {
      try {
        await postMessage(payload);
        setContent("");
        setMediaUrl("");
        setMediaBroken(false);
      } catch (err) {
        console.error("Failed to send message", err);
      }
    });
  }

  return (
    <div className={["flex h-full w-full flex-col", className ?? ""].join(" ")}>
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-neutral-800/70 bg-neutral-950/80 px-3 py-3 backdrop-blur supports-backdrop-filter:bg-neutral-950/60">
        <div className="mx-auto flex max-w-2xl items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <header className="mb-4 flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-neutral-100">
                Room{" "}
                <div className="text-xs text-neutral-500">
                  Room ID:{" "}
                  <span className="font-mono text-neutral-400">
                    {roomId.slice(0, 8)}...
                  </span>
                </div>
              </h1>
              {/* <ShareBar url="" /> */}
            </header>

            {roomInfo?.creatorName && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <User className="h-3.5 w-3.5 text-cyan-400" />
                <span>{roomInfo.creatorName}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {roomInfo?.createdAt && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>
                  Created {formatTimeHumanReadable(roomInfo.createdAt)}
                </span>
              </div>
            )}
            <div className="text-xs text-neutral-400">
              {messages.length} messages
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((m) => (
            <MessageCard
              key={m.id}
              nickname={m.nickname}
              content={m.content}
              mediaUrl={m.mediaUrl ?? undefined}
              timestamp={m.timestamp ?? undefined}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 z-10 w-full border-t border-neutral-800/50 bg-linear-to-t from-neutral-950/95 to-neutral-950/80 px-3 py-3 backdrop-blur-md supports-backdrop-filter:bg-linear-to-t supports-backdrop-filter:from-neutral-950/80 supports-backdrop-filter:to-neutral-950/70"
      >
        <div className="mx-auto max-w-2xl space-y-3">
          {/* Nickname Input */}
          <div>
            <input
              type="text"
              placeholder="Anonymous"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full rounded-lg border border-neutral-700/50 bg-neutral-900/40 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all duration-200 focus:border-cyan-500/80 focus:bg-neutral-900/60 focus:shadow-[0_0_16px_rgba(34,211,238,0.2)] hover:border-neutral-600/70"
            />
          </div>

          {/* Message Input Section */}
          <div className="space-y-2">
            <textarea
              placeholder="Share your thoughts, feedback, or memes..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handleContentPaste}
              rows={3}
              className="w-full resize-none rounded-lg border border-neutral-700/50 bg-neutral-900/40 px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all duration-200 focus:border-fuchsia-500/80 focus:bg-neutral-900/60 focus:shadow-[0_0_16px_rgba(217,70,239,0.2)] hover:border-neutral-600/70"
            />

            {/* Media Preview & Link Button */}
            {showMedia && mediaUrl.trim() && (
              <div className="flex items-center gap-3 rounded-lg border border-cyan-500/30 bg-cyan-900/10 p-2">
                <Image
                  src={mediaUrl}
                  alt="Preview"
                  referrerPolicy="no-referrer"
                  onError={() => setMediaBroken(true)}
                  width={60}
                  height={60}
                  className="h-14 w-14 rounded-md border border-cyan-400/50 object-cover shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-cyan-300 font-medium truncate">
                    Media attached
                  </p>
                  <p className="text-xs text-cyan-400/70 truncate">
                    {mediaUrl}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMediaUrl("");
                    setShowMedia(false);
                    setMediaBroken(false);
                  }}
                  className="flex-shrink-0 text-cyan-400/60 hover:text-cyan-300 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Link Input (collapsible) */}
            {showMedia && (
              <input
                type="url"
                inputMode="url"
                placeholder="Paste Image/GIF link..."
                value={mediaUrl}
                onChange={(e) => {
                  setMediaUrl(e.target.value);
                  setMediaBroken(false);
                }}
                className="w-full rounded-lg border border-cyan-500/50 bg-cyan-900/20 px-3 py-2 text-sm text-neutral-100 placeholder:text-cyan-400/50 outline-none transition-all duration-200 focus:border-cyan-400/80 focus:bg-cyan-900/30 focus:shadow-[0_0_12px_rgba(34,211,238,0.2)]"
              />
            )}
          </div>

          {/* Actions Row */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowMedia((s) => !s)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                showMedia
                  ? "border-cyan-500/80 bg-cyan-600/20 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                  : "border-neutral-700/50 bg-neutral-800/30 text-neutral-400 hover:border-cyan-500/60 hover:bg-cyan-600/10 hover:text-cyan-300"
              }`}
            >
              <Link2 className="h-4 w-4" />
              <span>Add Media</span>
            </button>

            <button
              type="submit"
              disabled={!canSubmit || isPending}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-emerald-500/60 bg-linear-to-r from-emerald-600/30 to-emerald-500/20 px-4 py-1.5 font-semibold text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.25)] transition-all duration-200 hover:border-emerald-400/80 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] disabled:cursor-not-allowed disabled:border-neutral-700/50 disabled:bg-neutral-800/20 disabled:text-neutral-600 disabled:shadow-none"
            >
              <Send className="h-4 w-4" />
              {isPending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

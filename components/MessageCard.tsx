"use client";

import { useState, useMemo } from "react";
import { ImageOff } from "lucide-react";
import Image from "next/image";

export type MessageCardProps = {
  nickname?: string;
  content?: string | null;
  mediaUrl?: string | null;
  timestamp?: Date | string | number;
  className?: string;
};

export default function MessageCard({
  nickname = "Anonymous",
  content = "",
  mediaUrl,
  timestamp,
  className,
}: MessageCardProps) {
  const [imageBroken, setImageBroken] = useState(false);

  const hasText = !!(content && content.trim().length > 0);
  const showImage = !!(mediaUrl && !imageBroken);

  const timeText = useMemo(() => {
    if (!timestamp) return undefined;
    try {
      const d =
        typeof timestamp === "string" || typeof timestamp === "number"
          ? new Date(timestamp)
          : timestamp;
      if (Number.isNaN(d.getTime())) return undefined;
      return d.toLocaleString();
    } catch {
      return undefined;
    }
  }, [timestamp]);

  return (
    <div
      className={[
        "w-full",
        "max-w-2xl",
        "text-sm",
        "leading-relaxed",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        className ?? "",
      ].join(" ")}
    >
      {/* Header: nickname and time */}
      <div className="mb-2.5 flex items-center gap-3 text-xs">
        <span className="font-semibold text-cyan-300/95 tracking-tight">
          {nickname}
        </span>
        {timeText ? (
          <span className="text-neutral-500 text-[11px]">{timeText}</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5">
        {/* Image (no bubble background when only image) */}
        {showImage && (
          <div className="group relative inline-block">
            <div className="absolute inset-0 rounded-xl blur-xl bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Image
              src={mediaUrl!}
              alt="User shared media"
              width={400}
              height={300}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImageBroken(true)}
              className={[
                "relative",
                "max-h-80 w-auto",
                "rounded-xl",
                "border border-cyan-400/60",
                "shadow-[0_0_32px_rgba(34,211,238,0.3)]",
                "bg-neutral-900/30 backdrop-blur-sm",
                "transition-all duration-300 group-hover:border-cyan-400/90 group-hover:shadow-[0_0_40px_rgba(34,211,238,0.5)]",
              ].join(" ")}
            />
          </div>
        )}

        {/* Text bubble (shown alone, or stacked below image) */}
        {hasText && (
          <div
            className={[
              "rounded-xl",
              "border border-fuchsia-500/60",
              "bg-gradient-to-br from-fuchsia-950/40 to-neutral-900/60",
              "px-4 py-3.5",
              "text-neutral-100",
              "shadow-[0_0_24px_rgba(217,70,239,0.2)]",
              "backdrop-blur-md",
              "transition-all duration-300 hover:border-fuchsia-500/80 hover:shadow-[0_0_32px_rgba(217,70,239,0.3)]",
            ].join(" ")}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {content}
            </p>
          </div>
        )}

        {/* Fallback when image fails and there is no text */}
        {!hasText && !showImage && mediaUrl && (
          <div
            className={[
              "flex items-center gap-2.5",
              "rounded-xl border border-rose-500/60",
              "bg-gradient-to-br from-rose-950/30 to-neutral-900/50",
              "px-3.5 py-2.5",
              "text-rose-200",
              "shadow-[0_0_20px_rgba(244,63,94,0.2)]",
              "backdrop-blur-sm",
            ].join(" ")}
          >
            <ImageOff className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">Image unavailable</span>
          </div>
        )}
      </div>
    </div>
  );
}

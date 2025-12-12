"use client";

import { useEffect, useState } from "react";
import { Facebook, Link as LinkIcon, Send, Share2 } from "lucide-react";

export type ShareBarProps = {
  url: string;
  title?: string;
  className?: string;
};

export default function ShareBar({
  url,
  title = "Check this out!",
  className,
}: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [effectiveUrl, setEffectiveUrl] = useState<string>("");

  // Avoid hydration mismatches by computing URL on client after mount
  useEffect(() => {
    setEffectiveUrl(url || window.location.href);
  }, [url]);

  const wapp = `https://wa.me/?text=${encodeURIComponent(
    `${title} ${effectiveUrl}`
  )}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    effectiveUrl
  )}`;
  const telegram = `https://t.me/share/url?url=${encodeURIComponent(
    effectiveUrl
  )}&text=${encodeURIComponent(title)}`;
  const xshare = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title
  )}&url=${encodeURIComponent(effectiveUrl)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(effectiveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className={["flex items-center gap-2", className ?? ""].join(" ")}>
      <a
        href={wapp || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/60 px-3 py-1.5 text-emerald-200 hover:bg-emerald-500/10"
        aria-label="Share on WhatsApp"
      >
        <Send className="h-4 w-4" /> WhatsApp
      </a>
      <a
        href={fb || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-blue-500/60 px-3 py-1.5 text-blue-200 hover:bg-blue-500/10"
        aria-label="Share on Facebook"
      >
        <Facebook className="h-4 w-4" /> Facebook
      </a>
      <a
        href={telegram || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/60 px-3 py-1.5 text-cyan-200 hover:bg-cyan-500/10"
        aria-label="Share on Telegram"
      >
        <Share2 className="h-4 w-4" /> Telegram
      </a>
      <a
        href={xshare || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-500/60 px-3 py-1.5 text-neutral-200 hover:bg-neutral-500/10"
        aria-label="Share on X"
      >
        X
      </a>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-lg border border-fuchsia-500/60 px-3 py-1.5 text-fuchsia-200 hover:bg-fuchsia-500/10"
        aria-label="Copy link"
      >
        <LinkIcon className="h-4 w-4" /> {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

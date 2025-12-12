import ChatRoom from "@/components/ChatRoom";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto flex min-h-dvh[100] max-w-5xl flex-col px-3 py-4">
      <div className="mb-3 flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-700/50 bg-neutral-900/40 px-3 py-1.5 text-sm font-medium text-neutral-300 transition-all duration-200 hover:border-neutral-600/70 hover:bg-neutral-900/60 hover:text-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>
      <ChatRoom roomId={id} className="h-[calc(100dvh-8rem)]" />
    </div>
  );
}

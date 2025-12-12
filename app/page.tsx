"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRoom } from "@/actions/room-actions";
import ShareBar from "@/components/ShareBar";
import Image from "next/image";
import { listRooms } from "@/actions/admin-actions";
import { verifyPin } from "@/actions/room-actions";
import { Lock, Globe, Facebook, Instagram, Twitter } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [creating, startTransition] = useTransition();
  const [personalRoomName, setPersonalRoomName] = useState("My Mugamili Room");
  const [personalRoomId, setPersonalRoomId] = useState<string>("");
  const [rooms, setRooms] = useState<
    Array<{ id: string; name: string; type: "public" | "private" }>
  >([]);
  const [pinInputs, setPinInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const rs = await listRooms();
        setRooms(rs);
      } catch (e) {
        console.error("Failed to load rooms", e);
      }
    })();
  }, []);

  async function createPersonalRoom() {
    startTransition(async () => {
      try {
        const res = await createRoom(personalRoomName || "My Room", "public");
        setPersonalRoomId(res.id);
        router.push(`/room/${res.id}`);
      } catch (e) {
        console.error(e);
      }
    });
  }

  const shareUrl =
    typeof window !== "undefined" && personalRoomId
      ? `${window.location.origin}/room/${personalRoomId}`
      : "";

  return (
    <main className="mx-auto flex min-h-dvh[100] max-w-5xl flex-col px-4 py-8">
      <section className="mb-8 rounded-2xl border-2 border-fuchsia-500/60 bg-neutral-950 p-6 text-neutral-100 shadow-[0_0_24px_rgba(217,70,239,0.25)] flex items-center gap-6">
        <Image
          src="https://github.com/anburocky3.png"
          alt="Anbuselvan Annamalai"
          width={160}
          height={160}
          unoptimized={true}
          priority={true}
          className="w-30 object-cover rounded-full"
        />
        <div>
          <h1 className="mb-2 text-3xl font-extrabold">Anbuselvan</h1>
          <div className="mb-4 flex items-center gap-3">
            <a
              href="https://facebook.com/anburocky3"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-blue-600/60 p-2 text-blue-300 hover:bg-blue-600/10 transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="https://instagram.com/anbuselvanrocky"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-pink-600/60 p-2 text-pink-300 hover:bg-pink-600/10 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://x.com/anbuselvanrocky"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-cyan-600/60 p-2 text-cyan-300 hover:bg-cyan-600/10 transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
          </div>
          {/* <div className="flex flex-wrap items-end gap-3">
            <input
              value={personalRoomName}
              onChange={(e) => setPersonalRoomName(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 outline-none"
            />
            <button
              onClick={createPersonalRoom}
              disabled={creating}
              className="rounded-xl border-2 border-cyan-500/70 bg-cyan-600/20 px-4 py-2 font-semibold text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.25)] disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create & Open Room"}
            </button>
          </div> */}
          {personalRoomId && (
            <div className="mt-4">
              <ShareBar url={shareUrl} title="Join my Mugamili room!" />
            </div>
          )}
        </div>
      </section>

      <section className="mb-8 rounded-2xl border-2 border-fuchsia-500/60 bg-neutral-950 p-6 text-neutral-100 shadow-[0_0_24px_rgba(217,70,239,0.25)] flex items-center gap-6">
        <div className="w-full">
          <h2 className="mb-4 text-xl font-semibold">Your Rooms</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rooms.map((r) => {
              const isPrivate = r.type === "private";
              const pinValue = pinInputs[r.id] ?? "";
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 shadow-[0_0_16px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isPrivate ? (
                        <Lock className="h-4 w-4 text-amber-300" />
                      ) : (
                        <Globe className="h-4 w-4 text-cyan-300" />
                      )}
                      <div className="font-semibold text-neutral-100">
                        {r.name}
                      </div>
                    </div>
                    <a
                      href={`/room/${r.id}`}
                      className="text-cyan-300 underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                  </div>
                  {isPrivate ? (
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="password"
                        placeholder="Enter PIN"
                        value={pinValue}
                        onChange={(e) =>
                          setPinInputs((prev) => ({
                            ...prev,
                            [r.id]: e.target.value,
                          }))
                        }
                        className="w-40 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1 text-neutral-100 outline-none"
                      />
                      <button
                        className="rounded-lg border border-emerald-600 px-3 py-1.5 text-emerald-200"
                        onClick={async () => {
                          try {
                            const ok = await verifyPin(r.id, pinValue);
                            if (ok) {
                              router.push(`/room/${r.id}`);
                            } else {
                              alert("Invalid PIN");
                            }
                          } catch (e) {
                            alert("Failed to verify PIN");
                          }
                        }}
                      >
                        Enter
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <button
                        className="rounded-lg border border-cyan-600 px-3 py-1.5 text-cyan-200"
                        onClick={() => router.push(`/room/${r.id}`)}
                      >
                        Join
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {rooms.length === 0 && (
              <div className="text-neutral-400">No rooms yet.</div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-cyan-500/60 bg-neutral-950 p-6 text-neutral-100 shadow-[0_0_24px_rgba(34,211,238,0.25)]">
        <h2 className="mb-2 text-xl font-bold">Share this app</h2>
        <ShareBar url="" title="Join me on Mugamili!" />
      </section>
    </main>
  );
}

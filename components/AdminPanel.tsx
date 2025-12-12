"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createRoomAdmin,
  deleteMessage,
  flagMessage,
  isAdmin,
  listMessages,
  listRooms,
  loginAdmin,
  logoutAdmin,
} from "@/actions/admin-actions";
import type { RoomType } from "@/actions/room-actions";

export default function AdminPanel() {
  const [authed, setAuthed] = useState<boolean>(false);
  const [password, setPassword] = useState("");

  const [rooms, setRooms] = useState<
    Array<{ id: string; name: string; type: RoomType }>
  >([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [messages, setMessages] = useState<Array<any>>([]);

  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState<RoomType>("public");
  const [creating, startCreating] = useTransition();

  useEffect(() => {
    (async () => {
      const ok = await isAdmin();
      setAuthed(ok);
      if (ok) {
        const rs = await listRooms();
        setRooms(rs);
      }
    })();
  }, []);

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    const ok = await loginAdmin(password);
    setAuthed(ok);
    if (ok) {
      const rs = await listRooms();
      setRooms(rs);
    }
  }

  async function doLogout() {
    await logoutAdmin();
    setAuthed(false);
  }

  async function refreshMessages(roomId: string) {
    if (!roomId) return;
    const ms = await listMessages(roomId, 100);
    setMessages(ms);
  }

  function handleSelectRoom(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSelectedRoomId(id);
    refreshMessages(id);
  }

  function createRoomSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomName.trim()) return;
    startCreating(async () => {
      const res = await createRoomAdmin(roomName.trim(), roomType);
      const rs = await listRooms();
      setRooms(rs);
      setRoomName("");
      alert(
        res.pin
          ? `Room created. ID: ${res.id} PIN: ${res.pin}`
          : `Room created. ID: ${res.id}`
      );
    });
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-neutral-100">
        <h2 className="mb-3 text-lg font-semibold">Admin Login</h2>
        <form onSubmit={doLogin} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none"
          />
          <button
            type="submit"
            className="rounded-lg border border-emerald-600 bg-emerald-700/20 px-3 py-2 text-emerald-200"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-neutral-100">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Admin Panel</h2>
        <button
          onClick={doLogout}
          className="rounded-md border border-rose-600 px-3 py-1.5 text-rose-200"
        >
          Logout
        </button>
      </div>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h3 className="mb-3 font-semibold">Create Room</h3>
        <form
          onSubmit={createRoomSubmit}
          className="flex flex-wrap items-end gap-3"
        >
          <div>
            <label className="mb-1 block text-sm text-neutral-300">Name</label>
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-64 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-300">Type</label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value as RoomType)}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg border border-cyan-600 bg-cyan-700/20 px-4 py-2 text-cyan-200"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h3 className="mb-3 font-semibold">Rooms</h3>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedRoomId}
            onChange={handleSelectRoom}
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none"
          >
            <option value="">Select a room</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.type})
              </option>
            ))}
          </select>
          {selectedRoomId && (
            <a
              href={`/room/${selectedRoomId}`}
              className="rounded-md border border-fuchsia-600 px-3 py-1.5 text-fuchsia-200"
              target="_blank"
            >
              Open room
            </a>
          )}
        </div>

        {selectedRoomId && (
          <div className="mt-4 flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border border-neutral-800 bg-neutral-950 p-3"
              >
                <div className="mb-2 text-xs text-neutral-400">
                  {m.nickname}
                </div>
                <div className="text-sm text-neutral-100">
                  {m.content || <em className="text-neutral-500">(no text)</em>}
                </div>
                {m.mediaUrl ? (
                  <div className="mt-2">
                    <img
                      src={m.mediaUrl}
                      alt="media"
                      referrerPolicy="no-referrer"
                      className="max-h-40 rounded-md border border-neutral-700"
                    />
                  </div>
                ) : null}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await flagMessage(m.id, !m.isFlagged);
                      refreshMessages(selectedRoomId);
                    }}
                    className="rounded-md border border-amber-600 px-2 py-1 text-amber-200 text-xs"
                  >
                    {m.isFlagged ? "Unflag" : "Flag"}
                  </button>
                  <button
                    onClick={async () => {
                      await deleteMessage(m.id);
                      refreshMessages(selectedRoomId);
                    }}
                    className="rounded-md border border-rose-600 px-2 py-1 text-rose-200 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-sm text-neutral-400">No messages yet.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

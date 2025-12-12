"use server";

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import type { RoomType } from "@/actions/room-actions";

const SESSION_COOKIE = "admin_session";

function sign(value: string, secret: string): string {
  const mac = createHmac("sha256", secret).update(value).digest("base64");
  return `${value}.${mac}`;
}

function verify(signed: string, secret: string): boolean {
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return false;
  const value = signed.slice(0, idx);
  const mac = signed.slice(idx + 1);
  const expected = createHmac("sha256", secret).update(value).digest("base64");
  try {
    return timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function loginAdmin(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD || "";
  const secret = process.env.ADMIN_SESSION_SECRET || "dev-secret";
  if (!password || !expected) return false;
  if (password !== expected) return false;
  (await cookies()).set(SESSION_COOKIE, sign("admin", secret), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return true;
}

export async function logoutAdmin(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET || "dev-secret";
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return verify(token, secret);
}

export async function createRoomAdmin(
  name: string,
  type: RoomType
): Promise<{ id: string; pin?: string }> {
  const mod = await import("@/actions/room-actions");
  return mod.createRoom(name, type);
}

export type RoomListItem = { id: string; name: string; type: RoomType };

export async function listRooms(): Promise<RoomListItem[]> {
  const snap = await getDocs(collection(db, "rooms"));
  return snap.docs.map((d) => {
    const data = d.data() as any;
    return { id: d.id, name: data.name, type: data.type as RoomType };
  });
}

export type AdminMessage = {
  id: string;
  roomId: string;
  nickname: string;
  content: string;
  mediaUrl?: string | null;
  isFlagged?: boolean;
  timestamp?: any;
};

export async function listMessages(
  roomId: string,
  max = 100
): Promise<AdminMessage[]> {
  const q = query(
    collection(db, "messages"),
    where("roomId", "==", roomId),
    orderBy("timestamp", "desc"),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function flagMessage(
  messageId: string,
  flag: boolean
): Promise<void> {
  await updateDoc(doc(db, "messages", messageId), { isFlagged: flag });
}

export async function deleteMessage(messageId: string): Promise<void> {
  await deleteDoc(doc(db, "messages", messageId));
}

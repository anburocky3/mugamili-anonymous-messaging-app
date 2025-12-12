"use server";

import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Filter } from "bad-words";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";

// Types
export type RoomType = "public" | "private";

export interface RoomDoc {
  name: string;
  type: RoomType;
  createdAt: ReturnType<typeof serverTimestamp> | Date;
  createdBy?: string;
  creatorName?: string;
  pinSalt?: string;
  pinHash?: string;
  pinPlain?: string; // stored for recovery; consider restricting read access
}

export interface CreateRoomResult {
  id: string;
  // Present only for private rooms when we generate a PIN
  pin?: string;
}

export interface MessageInput {
  roomId: string;
  content: string;
  nickname?: string;
  mediaUrl?: string | null;
}

export interface MessageDoc {
  roomId: string;
  nickname: string;
  content: string;
  mediaUrl?: string | null;
  timestamp: ReturnType<typeof serverTimestamp> | Date;
  isFlagged: boolean;
}

const filter = new Filter();

// PIN helpers (no external deps)
function generatePin(length = 6): string {
  // Numeric PIN with given length
  let pin = "";
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    pin += (bytes[i] % 10).toString();
  }
  return pin;
}

function hashPin(pin: string, salt?: string) {
  const pinSalt = salt ?? randomBytes(16).toString("base64");
  const h = createHash("sha256");
  h.update(pinSalt + ":" + pin);
  const pinHash = h.digest("base64");
  return { pinSalt, pinHash };
}

function verifyPinHash(
  pin: string,
  salt: string,
  expectedHash: string
): boolean {
  const h = createHash("sha256");
  h.update(salt + ":" + pin);
  const actual = Buffer.from(h.digest("base64"));
  const expected = Buffer.from(expectedHash);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

// Actions
export async function createRoom(
  name: string,
  type: RoomType,
  opts?: { createdBy?: string; creatorName?: string }
): Promise<CreateRoomResult> {
  if (typeof name !== "string" || !name.trim()) {
    throw new Error("Room name is required");
  }
  if (type !== "public" && type !== "private") {
    throw new Error("Invalid room type");
  }

  const base: Omit<RoomDoc, "createdAt"> & {
    createdAt: ReturnType<typeof serverTimestamp>;
  } = {
    name: name.trim(),
    type,
    createdAt: serverTimestamp(),
    createdBy: opts?.createdBy,
    creatorName: opts?.creatorName,
  };

  let pinToReturn: string | undefined;
  let payload: RoomDoc = base;

  if (type === "private") {
    const pin = generatePin(6);
    const { pinSalt, pinHash } = hashPin(pin);
    payload = { ...base, pinSalt, pinHash, pinPlain: pin };
    pinToReturn = pin;
  }

  const ref = await addDoc(collection(db, "rooms"), payload);
  return { id: ref.id, pin: pinToReturn };
}

export async function verifyPin(roomId: string, pin: string): Promise<boolean> {
  if (!roomId) throw new Error("roomId is required");
  const snap = await getDoc(doc(db, "rooms", roomId));
  if (!snap.exists()) return false;
  const data = snap.data() as Partial<RoomDoc>;

  if (data.type === "public" || (!data.pinSalt && !data.pinHash)) {
    return true; // public rooms do not require PIN
  }
  if (!pin) return false;
  if (!data.pinSalt || !data.pinHash) return false;

  return verifyPinHash(pin, data.pinSalt, data.pinHash);
}

export async function postMessage({
  roomId,
  content,
  nickname,
  mediaUrl,
}: MessageInput): Promise<{ id: string }> {
  if (!roomId) throw new Error("roomId is required");

  const cleanNickname = filter.clean(
    (nickname ?? "").trim() || randomAnonName()
  );
  const cleanContent = filter.clean((content ?? "").trim());

  if (!cleanContent && !mediaUrl) {
    throw new Error("Message must include content or mediaUrl");
  }

  const safeMediaUrl = normalizeMediaUrl(mediaUrl);

  const docData: MessageDoc = {
    roomId,
    nickname: cleanNickname,
    content: cleanContent,
    mediaUrl: safeMediaUrl,
    timestamp: serverTimestamp(),
    isFlagged: false,
  };

  const ref = await addDoc(collection(db, "messages"), docData);
  return { id: ref.id };
}

// Utilities
function normalizeMediaUrl(url?: string | null): string | null | undefined {
  if (!url) return url ?? null;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null; // enforce http/https only
  // Optional: Basic length cap
  if (trimmed.length > 2048) return null;
  return trimmed;
}

function randomAnonName(): string {
  const animals = [
    "Fox",
    "Panda",
    "Otter",
    "Dolphin",
    "Lynx",
    "Hawk",
    "Koala",
    "Tiger",
    "Raven",
    "Wolf",
  ];
  const pick = animals[Math.floor(Math.random() * animals.length)];
  return `Anonymous ${pick}`;
}

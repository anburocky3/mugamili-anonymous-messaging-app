import { NextRequest } from "next/server";
import { createRoom } from "@/actions/room-actions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name ?? "");
    const type = body?.type as "public" | "private";

    const result = await createRoom(name, type);
    return Response.json(result, { headers: corsHeaders });
  } catch (err: any) {
    const message = err?.message || "Failed to create room";
    return Response.json(
      { error: message },
      { status: 400, headers: corsHeaders }
    );
  }
}

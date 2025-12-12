import { NextRequest } from "next/server";
import { verifyPin } from "@/actions/room-actions";

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
    const roomId = String(body?.roomId ?? "");
    const pin = String(body?.pin ?? "");
    const ok = await verifyPin(roomId, pin);
    return Response.json({ ok }, { headers: corsHeaders });
  } catch (err: any) {
    const message = err?.message || "Failed to verify PIN";
    return Response.json(
      { error: message },
      { status: 400, headers: corsHeaders }
    );
  }
}

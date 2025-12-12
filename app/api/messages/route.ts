import { NextRequest } from "next/server";
import { postMessage } from "@/actions/room-actions";

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
    const payload = {
      roomId: String(body?.roomId ?? ""),
      content: String(body?.content ?? ""),
      nickname: body?.nickname ? String(body.nickname) : undefined,
      mediaUrl: body?.mediaUrl ? String(body.mediaUrl) : undefined,
    } as const;

    const res = await postMessage(payload);
    return Response.json(res, { headers: corsHeaders });
  } catch (err: any) {
    const message = err?.message || "Failed to post message";
    return Response.json(
      { error: message },
      { status: 400, headers: corsHeaders }
    );
  }
}

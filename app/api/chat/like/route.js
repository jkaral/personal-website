import { NextResponse } from "next/server";
import { toggleLike, STORAGE } from "../../../../lib/chatStore";

export const dynamic = "force-dynamic";

const VISITOR = /^[a-z0-9-]{8,64}$/i;
const TARGET = /^(site|[0-9a-f-]{36})$/i; // "site" or a message id
const HEADERS = { "x-chat-storage": STORAGE, "Cache-Control": "no-store" };

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400, headers: HEADERS });
  }
  const visitor = String(body.visitor || "");
  const target = String(body.target || "");
  if (!VISITOR.test(visitor) || !TARGET.test(target)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400, headers: HEADERS });
  }
  try {
    return NextResponse.json(await toggleLike(target, visitor), { headers: HEADERS });
  } catch (e) {
    console.error("chat like", e);
    return NextResponse.json({ error: "The chat is offline right now" }, { status: 503, headers: HEADERS });
  }
}

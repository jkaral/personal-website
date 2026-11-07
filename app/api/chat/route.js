import { NextResponse } from "next/server";
import { getChat, addMessage, LIMITS } from "../../../lib/chatStore";

export const dynamic = "force-dynamic";

const VISITOR = /^[a-z0-9-]{8,64}$/i; // random id each browser makes for itself
const lastPost = new Map(); // ip/visitor -> time of last message (simple spam brake)
const COOLDOWN_MS = 15000;

const clean = (s, max) => String(s ?? "").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim().slice(0, max);

export async function GET(request) {
  const v = new URL(request.url).searchParams.get("v") || "";
  return NextResponse.json(await getChat(VISITOR.test(v) ? v : ""));
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const visitor = String(body.visitor || "");
  if (!VISITOR.test(visitor)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const text = clean(body.text, LIMITS.text);
  if (!text) return NextResponse.json({ error: "Write something first" }, { status: 400 });
  const name = clean(body.name, LIMITS.name);

  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  const now = Date.now();
  for (const key of [ip, visitor]) {
    if (now - (lastPost.get(key) || 0) < COOLDOWN_MS) {
      return NextResponse.json({ error: "Slow down a little, try again in a few seconds" }, { status: 429 });
    }
  }
  lastPost.set(ip, now);
  lastPost.set(visitor, now);

  return NextResponse.json(await addMessage({ name, text, kind: body.kind, visitor }));
}

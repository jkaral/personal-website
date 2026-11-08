import { NextResponse } from "next/server";
import { getChat, addMessage, claimCooldown, withinLimits, LIMITS, STORAGE } from "../../../lib/chatStore";

export const dynamic = "force-dynamic";

const VISITOR = /^[a-z0-9-]{8,64}$/i; // random id each browser makes for itself
const HEADERS = { "x-chat-storage": STORAGE, "Cache-Control": "no-store" }; // which storage is in use (handy when checking the live site)

const clean = (s, max) => String(s ?? "").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim().slice(0, max);
const fail = (msg, status) => NextResponse.json({ error: msg }, { status, headers: HEADERS });

export async function GET(request) {
  const v = new URL(request.url).searchParams.get("v") || "";
  try {
    return NextResponse.json(await getChat(VISITOR.test(v) ? v : ""), { headers: HEADERS });
  } catch (e) {
    console.error("chat GET", e);
    return fail("The chat is offline right now", 503);
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Bad request", 400);
  }
  const visitor = String(body.visitor || "");
  if (!VISITOR.test(visitor)) return fail("Bad request", 400);
  if (body.website) return fail("Bad request", 400); // hidden bot-trap field that people never fill in
  const text = clean(body.text, LIMITS.text);
  if (!text) return fail("Write something first", 400);
  const name = clean(body.name, LIMITS.name);
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";

  try {
    if (!(await claimCooldown([`ip:${ip}`, `v:${visitor}`]))) {
      return fail("Slow down a little, try again in a few seconds", 429);
    }
    // on top of the 15s gap: at most 20 messages an hour per person, 300 a day across everyone
    if (!(await withinLimits([[`chat:hour:${ip}`, 20, 3600], ["chat:day:all", 300, 86400]]))) {
      return fail("That's a lot of messages, take a break and try again later", 429);
    }
    return NextResponse.json(await addMessage({ name, text, kind: body.kind, visitor }), { headers: HEADERS });
  } catch (e) {
    console.error("chat POST", e);
    return fail("The chat is offline right now, try again later", 503);
  }
}

import { NextResponse } from "next/server";
import { toggleLike } from "../../../../lib/chatStore";

export const dynamic = "force-dynamic";

const VISITOR = /^[a-z0-9-]{8,64}$/i;
const TARGET = /^(site|[0-9a-f-]{36})$/i; // "site" or a message id

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const visitor = String(body.visitor || "");
  const target = String(body.target || "");
  if (!VISITOR.test(visitor) || !TARGET.test(target)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  return NextResponse.json(await toggleLike(target, visitor));
}

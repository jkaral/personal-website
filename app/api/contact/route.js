import { NextResponse } from "next/server";
import { withinLimits } from "../../../lib/chatStore";

// Contact form → an email in Yianni's inbox, sent through Resend (https://resend.com).
// Needs RESEND_API_KEY set on Vercel (and in .env.local to test on your own machine).
// The free "onboarding@resend.dev" sender can only email the address the Resend account was made
// with, so sign up to Resend with the inbox below.
export const dynamic = "force-dynamic";

const TO = process.env.CONTACT_TO || "j.karal2008@gmail.com";
const FROM = process.env.CONTACT_FROM || "Website contact <onboarding@resend.dev>";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/; // same check the form runs in the browser
const LIMITS = { name: 80, email: 254, company: 100, message: 5000, github: 100 };

const clean = (s, max) => String(s ?? "").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim().slice(0, max);
const fail = (error, status) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
const ok = () => NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Bad request", 400);
  }

  // Bot traps. A hidden "website" field people never see, and a form filled in faster than a human
  // could. Bots get a fake success, so they don't learn to get around it.
  if (body.website) return ok();
  if (Number.isFinite(body.elapsed) && body.elapsed < 2500) return ok();

  const name = clean(body.name, LIMITS.name);
  const email = clean(body.email, LIMITS.email);
  const company = clean(body.company, LIMITS.company);
  const github = clean(body.github, LIMITS.github);
  const message = String(body.message ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, LIMITS.message);
  if (!name || !message) return fail("Please fill in your name and a message", 400);
  if (!EMAIL.test(email)) return fail("Please enter a valid email address", 400);

  if (!process.env.RESEND_API_KEY) {
    console.error("contact: RESEND_API_KEY is not set");
    return fail("The form isn't set up yet", 503);
  }

  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  try {
    // per person: 1 a minute and 5 an hour; overall: 60 a day, so a bot army can't use up the email quota
    const allowed = await withinLimits([
      [`contact:min:${ip}`, 1, 60],
      [`contact:hour:${ip}`, 5, 3600],
      [`contact:day:all`, 60, 86400],
    ]);
    if (!allowed) return fail("You've sent a few messages already, please try again a bit later", 429);
  } catch (e) {
    console.error("contact limiter", e); // if the limiter's database is down, still deliver the message
  }

  const details = [`Name: ${name}`, `Email: ${email}`];
  if (company) details.push(`Company: ${company}`);
  if (github) details.push(`GitHub: ${github}`);
  const text = `${message}\n\n—\n${details.join("\n")}`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email, // hitting Reply in Gmail answers the visitor directly
        subject: `Website message from ${name}${company ? ` (${company})` : ""}`,
        text,
      }),
    });
    if (!r.ok) {
      console.error("contact send", r.status, await r.text());
      return fail("Couldn't send right now, please try again later", 502);
    }
  } catch (e) {
    console.error("contact send", e);
    return fail("Couldn't send right now, please try again later", 502);
  }
  return ok();
}

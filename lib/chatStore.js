// Storage for the UI-feedback group chat, kept as one JSON document.
//  - Online (Vercel): an Upstash Redis database, used automatically when its REST URL + token are set
//    (Vercel's Upstash integration adds KV_REST_API_URL / KV_REST_API_TOKEN; plain Upstash uses
//    UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN). Vercel's disk is read-only, so a file won't do there.
//  - On your own machine (no database set): the file data/chat.json.
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const FILE = path.join(process.cwd(), "data", "chat.json");
const MAX_MESSAGES = 300; // oldest messages drop off after this
export const LIMITS = { name: 40, text: 600 };

const empty = () => ({ siteLikes: 0, siteLikers: [], messages: [] });

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_KEY = "feedback-chat";

// one Redis command over Upstash's REST API, e.g. ["GET", key]
async function redis(command) {
  const r = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Chat database error ${r.status}`);
  return (await r.json()).result;
}

async function load() {
  if (REDIS_URL && REDIS_TOKEN) {
    // a database error throws (the request fails) rather than looking like an empty chat that a
    // following save would then write over
    const raw = await redis(["GET", REDIS_KEY]);
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty();
  }
  try {
    return { ...empty(), ...JSON.parse(await fs.readFile(FILE, "utf8")) };
  } catch {
    return empty(); // no file yet
  }
}

async function save(data) {
  if (REDIS_URL && REDIS_TOKEN) {
    await redis(["SET", REDIS_KEY, JSON.stringify(data)]);
    return;
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, FILE); // swap in whole, so a crash never leaves half a file
}

// one change at a time, so two people posting at once can't overwrite each other
let queue = Promise.resolve();
function change(fn) {
  const run = queue.then(async () => {
    const data = await load();
    const result = fn(data);
    await save(data);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

// what visitors get to see (never the list of who liked what)
export function publicView(data, visitor) {
  return {
    siteLikes: data.siteLikes,
    likedSite: data.siteLikers.includes(visitor),
    messages: data.messages.map((m) => ({
      id: m.id,
      name: m.name,
      text: m.text,
      kind: m.kind,
      at: m.at,
      likes: m.likers.length,
      liked: m.likers.includes(visitor),
    })),
  };
}

export async function getChat(visitor) {
  return publicView(await load(), visitor);
}

export function addMessage({ name, text, kind, visitor }) {
  return change((data) => {
    data.messages.push({
      id: crypto.randomUUID(),
      name: name || "anonymous",
      text,
      kind: kind === "critique" ? "critique" : "comment",
      at: new Date().toISOString(),
      by: visitor,
      likers: [],
    });
    if (data.messages.length > MAX_MESSAGES) data.messages.splice(0, data.messages.length - MAX_MESSAGES);
    return publicView(data, visitor);
  });
}

// like / unlike the site itself or one message
export function toggleLike(target, visitor) {
  return change((data) => {
    const list = target === "site" ? data.siteLikers : data.messages.find((m) => m.id === target)?.likers;
    if (list) {
      const i = list.indexOf(visitor);
      if (i === -1) list.push(visitor);
      else list.splice(i, 1);
      if (target === "site") data.siteLikes = data.siteLikers.length;
    }
    return publicView(data, visitor);
  });
}

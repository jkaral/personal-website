// Storage for the feedback chat.
//
// Online (Vercel) it uses a Redis database, picked up automatically from whichever variables the
// database integration added:
//   - Upstash REST:  KV_REST_API_URL + KV_REST_API_TOKEN  (or UPSTASH_REDIS_REST_URL + _TOKEN)
//   - plain Redis:   REDIS_URL  (or KV_URL)
// Each like is its own entry in a Redis set, so likes from many people at once are counted exactly
// (nothing rewrites the whole chat). Vercel's disk is read-only, so a file can't be used there.
//
// On your own machine (no database variables) it falls back to the file data/chat.json.
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const MAX_MESSAGES = 300; // oldest messages drop off after this
export const LIMITS = { name: 40, text: 600 };
const COOLDOWN_S = 15; // seconds between messages from the same person

const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const TCP_URL = process.env.REDIS_URL || process.env.KV_URL;

export const STORAGE = REST_URL && REST_TOKEN ? "redis-rest" : TCP_URL ? "redis" : "file";

// ---------------------------------------------------------------- Redis (either connection type)
const K = {
  messages: "chat:messages", // list of message JSON, oldest first
  likes: (target) => `chat:likes:${target}`, // set of visitor ids ("site" or a message id)
  cooldown: (key) => `chat:cooldown:${key}`,
};

let tcpClient;
async function tcp() {
  if (!tcpClient) {
    const { createClient } = await import("redis");
    tcpClient = createClient({ url: TCP_URL });
    tcpClient.on("error", () => {}); // a dropped connection reconnects; requests surface errors themselves
    tcpClient.connectPromise = tcpClient.connect();
  }
  await tcpClient.connectPromise;
  return tcpClient;
}

// run several Redis commands in one round trip; returns their results in order
async function pipeline(commands) {
  if (!commands.length) return [];
  if (STORAGE === "redis-rest") {
    const r = await fetch(`${REST_URL.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`Chat database error ${r.status}`);
    return (await r.json()).map((x) => {
      if (x.error) throw new Error(`Chat database error: ${x.error}`);
      return x.result;
    });
  }
  const c = await tcp();
  const multi = c.multi();
  for (const cmd of commands) multi.addCommand(cmd.map(String));
  return multi.exec();
}

async function redisView(visitor) {
  const [raw] = await pipeline([["LRANGE", K.messages, 0, -1]]);
  const messages = (raw || []).map((s) => JSON.parse(s));
  const targets = ["site", ...messages.map((m) => m.id)];
  const counts = await pipeline(
    targets.flatMap((t) => [["SCARD", K.likes(t)], ["SISMEMBER", K.likes(t), visitor || "-"]])
  );
  const likesOf = (i) => Number(counts[i * 2]) || 0;
  const likedOf = (i) => Number(counts[i * 2 + 1]) === 1;
  return {
    siteLikes: likesOf(0),
    likedSite: likedOf(0),
    messages: messages.map((m, i) => ({
      id: m.id,
      name: m.name,
      text: m.text,
      kind: m.kind,
      at: m.at,
      likes: likesOf(i + 1),
      liked: likedOf(i + 1),
    })),
  };
}

// ---------------------------------------------------------------- local file (your own machine)
const FILE = path.join(process.cwd(), "data", "chat.json");
const empty = () => ({ siteLikes: 0, siteLikers: [], messages: [] });

async function fileLoad() {
  try {
    return { ...empty(), ...JSON.parse(await fs.readFile(FILE, "utf8")) };
  } catch {
    return empty(); // no file yet
  }
}

async function fileSave(data) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, FILE); // swap in whole, so a crash never leaves half a file
}

// one change at a time, so two people posting at once can't overwrite each other
let queue = Promise.resolve();
function fileChange(fn) {
  const run = queue.then(async () => {
    const data = await fileLoad();
    const result = fn(data);
    await fileSave(data);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

// what visitors get to see (never the list of who liked what)
function fileView(data, visitor) {
  return {
    siteLikes: data.siteLikers.length,
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

// ---------------------------------------------------------------- the API the routes use
export async function getChat(visitor) {
  return STORAGE === "file" ? fileView(await fileLoad(), visitor) : redisView(visitor);
}

export async function addMessage({ name, text, kind, visitor }) {
  const msg = {
    id: crypto.randomUUID(),
    name: name || "anonymous",
    text,
    kind: kind === "critique" ? "critique" : "comment",
    at: new Date().toISOString(),
    by: visitor,
  };
  if (STORAGE === "file") {
    return fileChange((data) => {
      data.messages.push({ ...msg, likers: [] });
      if (data.messages.length > MAX_MESSAGES) data.messages.splice(0, data.messages.length - MAX_MESSAGES);
      return fileView(data, visitor);
    });
  }
  await pipeline([
    ["RPUSH", K.messages, JSON.stringify(msg)],
    ["LTRIM", K.messages, -MAX_MESSAGES, -1],
  ]);
  return redisView(visitor);
}

// like / unlike the site itself or one message
export async function toggleLike(target, visitor) {
  if (STORAGE === "file") {
    return fileChange((data) => {
      const list = target === "site" ? data.siteLikers : data.messages.find((m) => m.id === target)?.likers;
      if (list) {
        const i = list.indexOf(visitor);
        if (i === -1) list.push(visitor);
        else list.splice(i, 1);
      }
      return fileView(data, visitor);
    });
  }
  // only like messages that exist (so random ids can't create junk entries)
  if (target !== "site") {
    const [raw] = await pipeline([["LRANGE", K.messages, 0, -1]]);
    if (!(raw || []).some((s) => JSON.parse(s).id === target)) return redisView(visitor);
  }
  const [added] = await pipeline([["SADD", K.likes(target), visitor]]);
  if (Number(added) === 0) await pipeline([["SREM", K.likes(target), visitor]]); // already liked: unlike
  return redisView(visitor);
}

// spam brake: true if every key is free to post (and starts its cooldown), false if any is waiting.
// Kept in the database online, since each request can land on a different server there.
const localCooldown = new Map();
export async function claimCooldown(keys) {
  if (STORAGE === "file") {
    const now = Date.now();
    if (keys.some((k) => now - (localCooldown.get(k) || 0) < COOLDOWN_S * 1000)) return false;
    keys.forEach((k) => localCooldown.set(k, now));
    return true;
  }
  const res = await pipeline(keys.map((k) => ["SET", K.cooldown(k), "1", "NX", "EX", COOLDOWN_S]));
  return res.every((r) => r === "OK");
}

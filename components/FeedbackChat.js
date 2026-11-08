"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Top-bar button that opens a group chat where visitors like the site and leave comments or
// critiques of the UI. A handwritten caption with a squiggly arrow points at the button.
// Messages are stored by the site's own server (app/api/chat, lib/chatStore.js).

const NAME_KEY = "chatName";
const VISITOR_KEY = "chatVisitor";
const POLL_MS = 5000;

function visitorId() {
  try {
    let v = localStorage.getItem(VISITOR_KEY);
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, v);
    }
    return v;
  } catch {
    return "guest-" + Math.random().toString(36).slice(2, 12);
  }
}

function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const Heart = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

export default function FeedbackChat() {
  const [open, setOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [chat, setChat] = useState(null);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [kind, setKind] = useState("comment");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false); // the chat server couldn't be reached
  const visitor = useRef("");
  const listRef = useRef(null);
  const panelRef = useRef(null);
  const btnRef = useRef(null);
  const lastCount = useRef(0);

  useEffect(() => {
    visitor.current = visitorId();
    try {
      setName(localStorage.getItem(NAME_KEY) || "");
    } catch {}
    const onScroll = () => setAtTop(window.scrollY < 140);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/chat?v=${encodeURIComponent(visitor.current)}`, { cache: "no-store" });
      if (!r.ok) throw new Error();
      setChat(await r.json());
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);

  // while open: fetch now and every few seconds; close on Esc or a click outside
  useEffect(() => {
    if (!open) return;
    load();
    const t = setInterval(load, POLL_MS);
    const onKey = (e) => e.key === "Escape" && (setOpen(false), btnRef.current?.focus());
    const onDown = (e) => {
      if (!panelRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      clearInterval(t);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, load]);

  // keep the newest message in view when new ones arrive
  useEffect(() => {
    const n = chat?.messages.length || 0;
    if (n !== lastCount.current && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    lastCount.current = n;
  }, [chat]);

  // flip a like on screen straight away, then settle on the server's exact counts
  const flip = (c, target) => {
    if (!c) return c;
    if (target === "site") return { ...c, likedSite: !c.likedSite, siteLikes: c.siteLikes + (c.likedSite ? -1 : 1) };
    return { ...c, messages: c.messages.map((m) => (m.id === target ? { ...m, liked: !m.liked, likes: m.likes + (m.liked ? -1 : 1) } : m)) };
  };
  const pendingLikes = useRef(new Set()); // ignore double-taps while a like is on its way
  const like = async (target) => {
    if (pendingLikes.current.has(target)) return;
    pendingLikes.current.add(target);
    setChat((c) => flip(c, target));
    try {
      const r = await fetch("/api/chat/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, visitor: visitor.current }),
      });
      if (!r.ok) throw new Error();
      setChat(await r.json());
      setOffline(false);
    } catch {
      setChat((c) => flip(c, target)); // didn't save: put it back
      setError("Couldn't save that like, try again");
    }
    pendingLikes.current.delete(target);
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      localStorage.setItem(NAME_KEY, name.trim());
    } catch {}
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), text: text.trim(), kind, visitor: visitor.current }),
      });
      const data = await r.json();
      if (!r.ok) setError(data.error || "Couldn't send that, try again");
      else {
        setChat(data);
        setText("");
        setOffline(false);
      }
    } catch {
      setError("Couldn't reach the chat, try again");
    }
    setSending(false);
  };

  const count = chat?.messages.length;

  return (
    <div className="chat-wrap">
      <button
        ref={btnRef}
        className={`app-icon chat-btn ${open ? "on" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="feedback-chat"
        aria-label="Feedback group chat"
        title="Feedback group chat"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z" />
          <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" strokeWidth="2.6" />
        </svg>
      </button>

      {/* handwritten note to the right; a squiggly arrow leaves the side of its first letter and
          curls right-to-left up into the button */}
      <div className={`chat-note ${atTop && !open ? "" : "hidden"}`} aria-hidden="true">
        <svg className="chat-arrow" viewBox="0 0 72 60" width="72" height="60">
          <path className="chat-arrow-line" pathLength="1" d="M68 48 C 54 53, 41 47, 45 37 C 49 27, 31 24, 25 32 C 19 40, 6 33, 7 6" />
          <path className="chat-arrow-head" pathLength="1" d="M1 14 L7 5 L14 12" />
        </svg>
        <span className="chat-note-text">as an engineer i&apos;m always looking for feedback</span>
      </div>

      {open && (
        <div id="feedback-chat" ref={panelRef} className="chat-panel" role="dialog" aria-label="Feedback group chat">
          <div className="chat-head">
            <div>
              <p className="chat-title">chat</p>
              <p className="chat-sub">everyone visiting the site can see this</p>
            </div>
            <button className={`chat-site-like ${chat?.likedSite ? "liked" : ""}`} onClick={() => like("site")} aria-pressed={!!chat?.likedSite} title="Like the site">
              <Heart filled={chat?.likedSite} /> {chat ? chat.siteLikes : "–"}
            </button>
          </div>

          <ol className="chat-list" ref={listRef} aria-live="polite">
            {!chat && <li className="chat-empty">{offline ? "the chat is offline right now, try again soon" : "loading…"}</li>}
            {chat && count === 0 && <li className="chat-empty">no messages yet, be the first to roast the UI</li>}
            {chat?.messages.map((m) => (
              <li key={m.id} className={`chat-msg ${m.kind}`}>
                <div className="chat-meta">
                  <strong>{m.name}</strong>
                  <span className={`chat-tag ${m.kind}`}>{m.kind}</span>
                  <span className="chat-time">{ago(m.at)}</span>
                </div>
                <p className="chat-bubble">{m.text}</p>
                <button className={`chat-like ${m.liked ? "liked" : ""}`} onClick={() => like(m.id)} aria-pressed={m.liked} aria-label={`Like this message (${m.likes})`}>
                  <Heart filled={m.liked} /> {m.likes > 0 ? m.likes : ""}
                </button>
              </li>
            ))}
          </ol>

          <form className="chat-form" onSubmit={send}>
            <div className="chat-row">
              <input className="chat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="your name (optional)" maxLength={40} aria-label="Your name" />
              <div className="chat-kind" role="radiogroup" aria-label="Message type">
                {["comment", "critique"].map((k) => (
                  <button type="button" key={k} role="radio" aria-checked={kind === k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <div className="chat-row">
              <textarea
                className="chat-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(e)}
                placeholder={kind === "critique" ? "what would you change about the UI?" : "say something nice (or not)"}
                maxLength={600}
                rows={2}
                aria-label="Message"
              />
              <button className="chat-send" type="submit" disabled={sending || !text.trim()} aria-label="Send">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </div>
            {error && <p className="chat-error" role="alert">{error}</p>}
          </form>
        </div>
      )}
    </div>
  );
}

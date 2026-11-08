"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

// The homepage "Uses" section: a floating bubble that opens into a grid of everything I use.
export default function UsesBubble({ intro, groups }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false); // playing the shrink-back animation
  const [returned, setReturned] = useState(false); // bubble just came back: pop it in
  const closeRef = useRef(null);
  const bubbleRef = useRef(null);
  // every app with an icon orbits the bubble
  const orbit = groups.flatMap((g) => g.items).filter((it) => it.icon);

  const closeFn = useRef(() => {});

  // "Click Me" note: its arrow draws itself in the first time the bubble scrolls into view
  const wrapRef = useRef(null);
  const [noteDrawn, setNoteDrawn] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || noteDrawn) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNoteDrawn(true), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [open, noteDrawn]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && closeFn.current(); // same smooth close as clicking
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    if (closing) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      setOpen(false);
      setClosing(false);
      setReturned(true);
      setTimeout(() => bubbleRef.current?.focus({ preventScroll: true }), 0);
    };
    if (reduced) return finish();
    setClosing(true);
    setTimeout(finish, 380); // matches the panel-close animation
  };
  closeFn.current = close;

  return (
    <div className={`uses-stage ${open ? "is-open" : ""}`}>
      {!open ? (
        <div className="uses-bubble-wrap" ref={wrapRef}>
        <button ref={bubbleRef} className={`uses-bubble ${returned ? "returning" : ""}`} onClick={() => setOpen(true)} aria-expanded="false" aria-controls="uses-panel">
          <span className="uses-bubble-core">
            <span className="uses-bubble-title">Uses</span>
            <span className="uses-bubble-sub">what I use daily ✦</span>
          </span>
          {orbit.map((it, i) => (
            <span
              key={it.name}
              className={`uses-orbit ${it.fullColor ? "full" : ""}`}
              style={{ "--i": i, "--n": orbit.length, "--icon": `url(${it.icon})`, ...(it.color ? { "--tint": it.color } : {}) }}
              aria-hidden="true"
            />
          ))}
        </button>
        {/* handwritten nudge, like the one by the chat button: a squiggly arrow curls from the
            words to the bubble */}
        <div className={`uses-note ${noteDrawn ? "drawn" : ""}`} aria-hidden="true">
          <svg className="uses-arrow" viewBox="0 0 72 48" width="96" height="64">
            <path className="uses-arrow-line" pathLength="1" d="M70 30 C 58 42, 45 38, 47 28 C 49 18, 33 15, 29 25 C 25 35, 13 34, 6 24" />
            <path className="uses-arrow-head" pathLength="1" d="M6.5 32.5 L6 24 L14 26.5" />
          </svg>
          <span className="uses-note-text">Click Me</span>
        </div>
        </div>
      ) : (
        <div
          id="uses-panel"
          className={`uses-panel ${closing ? "closing" : ""}`}
          role="region"
          aria-label="Everything I use"
          // clicking anywhere in the panel except an item tile turns it back into the bubble
          onClick={(e) => !e.target.closest(".uses-tile") && close()}
        >
          <div className="uses-panel-head">
            <p className="uses-panel-intro">{intro}</p>
            <button ref={closeRef} className="uses-close" onClick={close} aria-label="Close">✕</button>
          </div>
          {groups.map((g) => (
            <section key={g.title} className="uses-block">
              <h3>{g.title}</h3>
              <ul className="uses-tiles">
                {g.items.map((it, k) => {
                  const inner = (
                    <>
                      {it.icon ? (
                        <span className={`app-glyph ${it.fullColor ? "full" : ""}`} aria-hidden="true" style={{ "--icon": `url(${it.icon})`, ...(it.color ? { "--tint": it.color } : {}) }} />
                      ) : (
                        <span className="app-glyph line" aria-hidden="true"><Icon name={it.glyph || "external"} size={20} /></span>
                      )}
                      <span className="uses-tile-text">
                        <strong>{it.name}</strong>
                        {it.note && <span>{it.note}</span>}
                      </span>
                    </>
                  );
                  return (
                    <li key={it.name} style={{ "--k": k }}>
                      {it.url ? (
                        <a className="uses-tile" href={it.url} target="_blank" rel="noreferrer">{inner}</a>
                      ) : (
                        <div className="uses-tile">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

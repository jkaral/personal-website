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
  const orbit = groups.flatMap((g) => g.items).filter((it) => it.icon).slice(0, 5);

  const closeFn = useRef(() => {});

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
        <button ref={bubbleRef} className={`uses-bubble ${returned ? "returning" : ""}`} onClick={() => setOpen(true)} aria-expanded="false" aria-controls="uses-panel">
          <span className="uses-bubble-core">
            <span className="uses-bubble-title">Uses</span>
            <span className="uses-bubble-sub">what I use daily ✦</span>
          </span>
          {orbit.map((it, i) => (
            <span
              key={it.name}
              className="uses-orbit"
              style={{ "--i": i, "--n": orbit.length, "--icon": `url(${it.icon})`, ...(it.color ? { "--tint": it.color } : {}) }}
              aria-hidden="true"
            />
          ))}
        </button>
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
                        <span className="app-glyph" aria-hidden="true" style={{ "--icon": `url(${it.icon})`, ...(it.color ? { "--tint": it.color } : {}) }} />
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

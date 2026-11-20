"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EUROPE, WORLD, CODES } from "../lib/countries";

// country flags (PNG, from flagcdn.com), fetched only when a country is hovered
const flagSrc = (code, w) => `https://flagcdn.com/w${w}/${code}.png`;

// "Geography Nerding" hobby: two ways of showing it off.
//  1. Europe speedrun: a replay of typing every country in Europe into a quiz box. Each answer fills its
//     blank in the grid while the timer counts up to the real time (`seconds`, 57 by default). The replay
//     runs faster than real life (about 13s) but the timer shows quiz time. It starts when it scrolls into
//     view; click to watch it again. Reduced-motion visitors get the finished board straight away.
//  2. Every country in the world: all 197 names drifting past in two strips, each one ticked.
// Hovering a country (in either list; in the Europe grid only once it's been typed) pops its flag up
// above it. There's one floating flag for the whole block, positioned over the hovered chip, because the
// strips clip anything that sticks out of them.

const PLAY_MS = 13000; // how long the replay takes on screen

// When each country is typed: a short "thinking" pause, then its letters, with longer names taking
// longer. Scaled so the last one lands exactly on the final time.
function schedule(total) {
  const weights = EUROPE.map((c) => 0.55 + c.length * 0.11);
  const scale = total / weights.reduce((a, b) => a + b, 0);
  let t = 0;
  return EUROPE.map((name, i) => {
    const len = weights[i] * scale;
    const slot = { name, start: t, typeFrom: t + len * 0.3, end: t + len };
    t += len;
    return slot;
  });
}

function clock(s, done) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return done ? `${m}:${sec}` : `${m}:${sec}.${Math.floor((s * 10) % 10)}`;
}

export default function GeoNerd({ seconds = 57 }) {
  const slots = useMemo(() => schedule(seconds), [seconds]);
  const alphabetical = useMemo(() => [...EUROPE].sort((a, b) => a.localeCompare(b)), []);
  const box = useRef(null);
  const raf = useRef(0);
  const [t, setT] = useState(0); // quiz time shown, in seconds
  const wrap = useRef(null);
  const [flag, setFlag] = useState(null); // { name, code, x, y }: the hovered country and where its chip is

  // which country the pointer is over (any element with data-country), placed relative to the block.
  // Measured as a fraction of the block's on-screen size, so it's right whatever the page zoom is.
  const hover = (e) => {
    const chip = e.target.closest?.("[data-country]");
    const root = wrap.current;
    if (!chip || !root || !root.contains(chip)) return setFlag(null);
    const name = chip.dataset.country;
    const code = CODES[name];
    if (!code) return setFlag(null);
    const r = chip.getBoundingClientRect();
    const b = root.getBoundingClientRect();
    const k = root.offsetWidth / b.width; // screen px -> layout px
    setFlag((f) => (f?.name === name ? f : { name, code, x: (r.left + r.width / 2 - b.left) * k, y: (r.top - b.top) * k }));
  };

  const play = () => {
    cancelAnimationFrame(raf.current);
    const t0 = performance.now();
    const tick = (now) => {
      const g = Math.min(seconds, ((now - t0) / PLAY_MS) * seconds);
      setT(g);
      if (g < seconds) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  // start the replay when the board is properly on screen (once); reduced motion: show it finished
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      setT(seconds);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          play();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf.current);
    };
  }, [seconds]); // eslint-disable-line react-hooks/exhaustive-deps

  const done = t >= seconds;
  const found = new Set(slots.filter((s) => s.end <= t).map((s) => s.name));
  const current = done ? null : slots.find((s) => s.start <= t && t < s.end);
  const typed =
    current && t >= current.typeFrom
      ? current.name.slice(0, Math.ceil(((t - current.typeFrom) / (current.end - current.typeFrom)) * current.name.length))
      : "";

  // two strips of the world list, interleaved so neither is all one letter
  const rows = [WORLD.filter((_, i) => i % 2 === 0), WORLD.filter((_, i) => i % 2 === 1)];

  return (
    <div className="geo" ref={wrap} onPointerOver={hover} onPointerLeave={() => setFlag(null)}>
      {flag && (
        <img
          key={flag.code}
          className="geo-flag"
          src={flagSrc(flag.code, 80)}
          srcSet={`${flagSrc(flag.code, 160)} 2x`}
          alt=""
          aria-hidden="true"
          style={{ left: flag.x, top: flag.y }}
        />
      )}
      <div className={`geo-run ${done ? "done" : ""}`} ref={box}>
        <p className="geo-sr">I can type out all {EUROPE.length} countries of Europe in {clock(seconds, true)}.</p>
        <div className="geo-head" aria-hidden="true">
          <span className="geo-label">Europe speedrun</span>
          <span className="geo-timer">{clock(t, done)}</span>
        </div>
        <div className="geo-input" aria-hidden="true">
          <span className="geo-typed">{done ? "" : typed}</span>
          {!done && <span className="geo-caret" />}
          {done && <span className="geo-placeholder">every country in Europe</span>}
          <span className="geo-score">{found.size}/{EUROPE.length}</span>
        </div>
        <ul className="geo-grid" aria-hidden="true">
          {alphabetical.map((c) => (
            <li key={c} className={found.has(c) ? "hit" : ""} data-country={found.has(c) ? c : undefined}>{c}</li>
          ))}
        </ul>
        <button type="button" className="geo-replay" onClick={play} aria-label="Replay the Europe speedrun">
          {done ? "↻ replay" : "typing…"}
        </button>
      </div>

      <div className="geo-world">
        <p className="geo-sr">I can also name all {WORLD.length} countries of the world.</p>
        <div className="geo-head" aria-hidden="true">
          <span className="geo-label">Every country in the world</span>
          <span className="geo-count">{WORLD.length}/{WORLD.length}</span>
        </div>
        <div className="geo-strips" aria-hidden="true">
          {rows.map((row, r) => (
            <div key={r} className={`geo-strip ${r ? "rev" : ""}`}>
              {/* the list twice, so the loop is seamless */}
              {[0, 1].map((copy) => (
                <span key={copy} className="geo-strip-set">
                  {row.map((c) => (
                    <span key={c} className="geo-name" data-country={c}><span className="geo-tick">✓</span>{c}</span>
                  ))}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

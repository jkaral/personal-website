"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SPEED = 0.28; // items per second while drifting (continuous, never stops on its own)
const STEP_DEG = 16; // curvature: angle between neighbouring items on the arc
const RADIUS = 440; // arc radius in px (bigger = flatter curve)
const TWEEN_MS = 650; // glide time for the arrow buttons / clicking an item

const pad = (n) => String(n).padStart(3, "0");
const mod = (a, n) => ((a % n) + n) % n;
const ease = (t) => 1 - Math.pow(1 - t, 3);

// Two views of the banner items:
//  - "carousel": a continuously drifting vertical wheel. Hover eases it to a stop;
//    the arrow buttons, ↑ ↓ ← → keys, clicking an item or dragging glide it.
//    Items stay fully visible and only fade out at the top/bottom edges.
//  - "gallery": every cut-out in a grid; hovering shows just the name
export default function Collection({ title, intro, items }) {
  const [view, setView] = useState("carousel");
  const [index, setIndex] = useState(0); // item nearest the centre (for the counter)
  const n = items.length;

  const pos = useRef(0); // continuous position, in items
  const speed = useRef(SPEED);
  const hover = useRef(false);
  const reduced = useRef(false);
  const tween = useRef(null);
  const drag = useRef(null);
  const nodes = useRef([]);
  const spacing = useRef(230);
  const lastIdx = useRef(0);

  // position every item for the current `pos` (direct DOM writes: smooth, no re-render)
  const layout = useCallback(() => {
    const sp = spacing.current;
    nodes.current.forEach((el, i) => {
      if (!el) return;
      let d = i - pos.current;
      d = mod(d + n / 2, n) - n / 2; // wrap to the shortest distance
      const a = (d * STEP_DEG * Math.PI) / 180;
      const x = -RADIUS * (1 - Math.cos(a));
      el.style.transform = `translate(${x}px, ${d * sp}px)`;
      el.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
    });
    const idx = mod(Math.round(pos.current), n);
    if (idx !== lastIdx.current) {
      lastIdx.current = idx;
      setIndex(idx);
    }
  }, [n]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const small = window.matchMedia("(max-width: 700px)");
    const sync = () => {
      reduced.current = mq.matches;
      spacing.current = small.matches ? 300 : 285; // px between items (matches .wheel-item height + gap)
    };
    sync();
    mq.addEventListener("change", sync);
    small.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      small.removeEventListener("change", sync);
    };
  }, []);

  // animation loop
  useEffect(() => {
    if (view !== "carousel" || !n) return;
    let raf;
    let last = performance.now();
    const frame = (t) => {
      const dt = Math.min(0.25, (t - last) / 1000); // cap only big gaps (e.g. after switching tabs)
      last = t;
      if (tween.current) {
        const tw = tween.current;
        const p = reduced.current ? 1 : Math.min(1, (t - tw.start) / TWEEN_MS);
        pos.current = tw.from + (tw.to - tw.from) * ease(p);
        if (p >= 1) tween.current = null;
      } else if (!drag.current?.active) {
        const target = hover.current || reduced.current || n < 2 ? 0 : SPEED;
        speed.current += (target - speed.current) * Math.min(1, dt * 3); // ease in/out
        pos.current += speed.current * dt;
      }
      layout();
      raf = requestAnimationFrame(frame);
    };
    layout();
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [view, n, layout]);

  const glideTo = (to) => {
    tween.current = { from: pos.current, to, start: performance.now() };
    speed.current = 0;
  };
  const step = (d) => glideTo(Math.round(pos.current) + d);
  const goToItem = (i) => {
    let delta = mod(i - pos.current + n / 2, n) - n / 2;
    glideTo(pos.current + delta);
  };

  function onKey(e) {
    if (["ArrowDown", "ArrowRight"].includes(e.key)) { e.preventDefault(); step(1); }
    if (["ArrowUp", "ArrowLeft"].includes(e.key)) { e.preventDefault(); step(-1); }
  }

  // drag / swipe vertically to scrub the wheel
  function onDown(e) {
    if (e.target.closest("button")) return;
    drag.current = { y0: e.clientY, pos0: pos.current, active: false };
  }
  function onMove(e) {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y0;
    if (!d.active && Math.abs(dy) > 8) {
      e.currentTarget.setPointerCapture(e.pointerId);
      d.active = true;
      tween.current = null;
      speed.current = 0;
    }
    if (d.active) pos.current = d.pos0 - dy / spacing.current;
  }
  function onUp() {
    const wasDrag = drag.current?.active;
    drag.current = null;
    return wasDrag;
  }

  if (!n) return null;

  return (
    <div className="collection">
      <div className="collection-head">
        <h2 className="section-title">{title}</h2>
        {intro && <p className="collection-intro">{intro}</p>}
        <div className="collection-tabs" role="tablist" aria-label="View">
          {["carousel", "gallery"].map((v) => (
            <button key={v} role="tab" aria-selected={view === v} className={view === v ? "on" : ""} onClick={() => setView(v)}>
              <span className="tab-dot" aria-hidden="true" />
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "carousel" ? (
        <div className="wheel">
          <div
            className="wheel-viewport"
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label={`${title}: ${items[index].title}`}
            onKeyDown={onKey}
            onMouseEnter={() => (hover.current = true)}
            onMouseLeave={() => (hover.current = false)}
            onFocus={() => (hover.current = true)}
            onBlur={() => (hover.current = false)}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <div className="wheel-stage">
              {items.map((it, i) => (
                <div
                  key={it.src}
                  ref={(el) => (nodes.current[i] = el)}
                  className="wheel-item"
                  onClick={() => i !== index && goToItem(i)}
                >
                  <div className="wheel-img">
                    <img src={it.src} alt={it.title} draggable="false" />
                  </div>
                  <div className="wheel-text">
                    <span className="wheel-num">{pad(i + 1)}</span>
                    <h3>{it.title}</h3>
                    {it.caption && <p>{it.caption}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {n > 1 && (
            <div className="wheel-controls">
              <button onClick={() => step(-1)} aria-label="Spin backwards">←</button>
              <span className="wheel-count">{pad(index + 1)} / {pad(n)}</span>
              <button onClick={() => step(1)} aria-label="Spin forwards">→</button>
            </div>
          )}
        </div>
      ) : (
        <ul className="gallery-grid">
          {items.map((it, i) => (
            <li key={it.src}>
              <button
                className="gallery-cell"
                onClick={() => { pos.current = i; lastIdx.current = i; setIndex(i); setView("carousel"); }}
                aria-label={`${it.title} (open in carousel)`}
              >
                <img src={it.src} alt="" draggable="false" loading="lazy" />
                <span className="gallery-name">{it.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

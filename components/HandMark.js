"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { loopPoints, toPath } from "./PencilCircle";

// A phrase with a hand-drawn orange mark that draws itself in on load:
//  - kind="circle":    a loose pen loop around the phrase (same stroke as the sidebar's marker circles)
//  - kind="underline": a slightly wavy pen line under the phrase
// The phrase stays on one line so the mark never breaks across a line wrap.

function rng(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// wavy underline: points along the width with a gentle wobble, rising a touch at the end like a real stroke
function underlinePoints(w, y, seed) {
  const r = rng(seed);
  const n = Math.max(6, Math.round(w / 22));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([-2 + t * (w + 4), y + Math.sin(t * Math.PI * 2 + r() * 2) * 1.4 + (r() - 0.5) * 1.2 - t * 1.5]);
  }
  return pts;
}

export default function HandMark({ kind = "underline", seed = 7, delay = 0, children }) {
  const ref = useRef(null);
  const [size, setSize] = useState(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  let svg = null;
  if (size) {
    const { w, h } = size;
    if (kind === "circle") {
      const pw = w + 26, ph = h + 14; // a little room around the words
      const d = toPath(loopPoints(pw / 2, ph / 2, pw / 2 - 3, ph / 2 - 3, seed));
      svg = (
        <svg className="hand-mark circle" style={{ width: pw, height: ph, "--delay": `${delay}s` }} viewBox={`0 0 ${pw} ${ph}`} aria-hidden="true">
          <path d={d} pathLength="1" />
        </svg>
      );
    } else {
      const ph = 10;
      const d = toPath(underlinePoints(w, ph / 2, seed));
      svg = (
        <svg className="hand-mark underline" style={{ width: w, height: ph, "--delay": `${delay}s` }} viewBox={`0 0 ${w} ${ph}`} aria-hidden="true">
          <path d={d} pathLength="1" />
        </svg>
      );
    }
  }

  return (
    <span ref={ref} className="hand-marked">
      {children}
      {svg}
    </span>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

// The hero name gently changes typeface, built to be easy on the eyes:
//  - a small pool of clean, legible faces (no cursive, ultra-condensed or decorative ones)
//  - every version is stacked in one shared box, sized to the widest and sitting on one baseline
//    and centreline, so the name never jumps, shrinks or slides when the font changes
//  - `size` evens out the capital height between faces, so letters stay the same height
//  - each face holds for several seconds and changes with a soft fade (out, then in) instead of a cut
// Fonts are loaded in app/layout.js as CSS variables.
const FONTS = [
  { family: "var(--font-serif), Georgia, serif", weight: 700, tracking: "-0.01em" }, // Playfair Display (the default)
  { family: "var(--font-grotesk), sans-serif", weight: 700, size: 1.01, tracking: "-0.005em" }, // Space Grotesk
  { family: "var(--font-dmserif), serif", weight: 400, size: 1.07, tracking: "0" }, // DM Serif Display
  { family: "var(--font-instrument), serif", weight: 400, style: "italic", size: 0.985, tracking: "0.01em" }, // Instrument Serif
];
const HOLD_MS = 6000; // how long each typeface stays before the next one fades in

export default function NameCycle({ name }) {
  const [i, setI] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // stays on the default face
    // pause while the name is hovered/focused (the Greek name is showing)
    const host = ref.current?.closest(".name-swap");
    let paused = false;
    const pause = () => (paused = true);
    const resume = () => (paused = false);
    host?.addEventListener("mouseenter", pause);
    host?.addEventListener("mouseleave", resume);
    host?.addEventListener("focus", pause);
    host?.addEventListener("blur", resume);
    const t = setInterval(() => !paused && !document.hidden && setI((n) => (n + 1) % FONTS.length), HOLD_MS);
    return () => {
      clearInterval(t);
      host?.removeEventListener("mouseenter", pause);
      host?.removeEventListener("mouseleave", resume);
      host?.removeEventListener("focus", pause);
      host?.removeEventListener("blur", resume);
    };
  }, []);

  return (
    <span ref={ref} className="name-cycle">
      {FONTS.map((f, k) => (
        <span
          key={k}
          className={k === i ? "name-face on" : "name-face"}
          aria-hidden={k === 0 ? undefined : true}
          style={{
            fontFamily: f.family,
            fontWeight: f.weight,
            fontStyle: f.style || "normal",
            letterSpacing: f.tracking ?? "0",
            fontSize: `${f.size ?? 1}em`,
          }}
        >
          {name}
        </span>
      ))}
    </span>
  );
}

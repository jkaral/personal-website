"use client";

import { useEffect, useRef, useState } from "react";

// Cycles the hero name through a set of fonts. Each entry is a CSS font stack
// (the fonts themselves are loaded in app/layout.js as CSS variables).
// `size` scales each font so they all take up roughly the same width.
const FONTS = [
  { family: "var(--font-serif), Georgia, serif", weight: 700 }, // Playfair Display (the default)
  { family: "var(--font-grotesk), sans-serif", weight: 700, size: 0.92 }, // Space Grotesk
  { family: "var(--font-dmserif), serif", weight: 400 }, // DM Serif Display
  { family: "var(--font-bebas), sans-serif", weight: 400, tracking: "0.02em", size: 1.25 }, // Bebas Neue
  { family: "var(--font-mono), monospace", weight: 700, tracking: "-0.04em", size: 0.72 }, // JetBrains Mono
  { family: "var(--font-pacifico), cursive", weight: 400, tracking: "0", size: 0.86 }, // Pacifico
  { family: "var(--font-unbounded), sans-serif", weight: 700, tracking: "-0.04em", size: 0.7 }, // Unbounded
  { family: "var(--font-instrument), serif", weight: 400, style: "italic", size: 1.12 }, // Instrument Serif
  { family: "var(--font-caveat), cursive", weight: 700, tracking: "0", size: 1.2 }, // Caveat
];
const INTERVAL_MS = 100; // how often the font changes (ms)

export default function NameCycle({ name }) {
  const [i, setI] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // pause while the name is hovered/focused (the Greek name is showing), so its size holds still
    const host = ref.current?.closest(".name-swap");
    let paused = false;
    const pause = () => (paused = true);
    const resume = () => (paused = false);
    host?.addEventListener("mouseenter", pause);
    host?.addEventListener("mouseleave", resume);
    host?.addEventListener("focus", pause);
    host?.addEventListener("blur", resume);
    const t = setInterval(() => !paused && setI((n) => (n + 1) % FONTS.length), INTERVAL_MS);
    return () => {
      clearInterval(t);
      host?.removeEventListener("mouseenter", pause);
      host?.removeEventListener("mouseleave", resume);
      host?.removeEventListener("focus", pause);
      host?.removeEventListener("blur", resume);
    };
  }, []);

  const f = FONTS[i];
  return (
    <span
      ref={ref}
      className="name-cycle"
      style={{
        fontFamily: f.family,
        fontWeight: f.weight,
        fontStyle: f.style || "normal",
        letterSpacing: f.tracking ?? "-0.025em",
        fontSize: `${f.size ?? 1}em`, // per-font scale so every font fills about the same width
      }}
    >
      {name}
    </span>
  );
}

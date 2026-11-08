"use client";

import { useEffect } from "react";

// Scroll-driven highlighter for essays: each <mark> in `.prose.hl-scroll` starts bare and its
// highlight sweeps across the words (line by line) as the reader scrolls it up the screen.
// Progress goes in a CSS variable (--hl, 0..1) that globals.css turns into the highlight width.

const START = 0.88; // sweep starts when the mark's top reaches 88% down the screen
const END = 0.5; // ...and is finished once its bottom reaches the middle

export default function ScrollHighlight() {
  useEffect(() => {
    const marks = [...document.querySelectorAll(".prose.hl-scroll mark")];
    if (!marks.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      marks.forEach((m) => {
        m.style.setProperty("--hl", "1");
        m.setAttribute("data-lit", "");
      });
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const m of marks) {
        const r = m.getBoundingClientRect();
        const p = (vh * START - r.top) / (vh * START - vh * END + r.height);
        m.style.setProperty("--hl", Math.min(1, Math.max(0, p)).toFixed(3));
        m.toggleAttribute("data-lit", p > 0.6);
      }
    };
    const onScroll = () => frame || (frame = requestAnimationFrame(update));
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return null;
}

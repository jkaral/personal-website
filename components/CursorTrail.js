"use client";

import { useEffect, useRef } from "react";

// Paintings that pop up under the mouse as it moves (the same behaviour as justinzwu.com's popups,
// with public-domain paintings instead of his clips):
//  - one every ~100ms while the mouse is moving
//  - small, with a random size AND random proportions, so each one is stretched or squashed
//  - appears instantly (no fade-in), stays solid, fades out at the very end: 0.5s in all
//  - flat: no tilt, shadow or rounded corners
// An item is { src, motion? }: motion = "drift" (zooms across the canvas), "sway" (rocks side to
// side) or "shimmer" (colours shift); without one the painting stays still.
// Only over empty page: none while the cursor is on text (titles, paragraphs, list items...) or
// anything interactive (links, buttons, text boxes, the graph, photos, record player...).
// Mouse only: off on touch screens, narrow windows (<= 768px) and for people who prefer reduced motion.
const EVERY = 100; // ms between paintings while the mouse moves
const LIFE = 500; // ms each painting stays
const AREA = [1500, 4200]; // px² range for a painting's size
const RATIO = [0.18, 4]; // width/height range (picked on a log scale, so tall and wide are equally likely)

const rand = (a, b) => a + Math.random() * (b - a);

// No paintings while the cursor is over something interactive or over text.
const INTERACTIVE = [
  "a", "button", "input", "textarea", "select", "label", "summary", "option", "video", "audio", "iframe",
  "[role='button']", "[role='link']", "[role='tab']", "[contenteditable='true']", "[tabindex]:not([tabindex='-1'])",
  ".contrib", ".pile", ".vinyl", ".uses-stage", ".collage", ".chat-wrap", ".chat-panel", ".sidebar", ".topbar",
].join(",");

// true if (x, y) is on one of the lines of words that belong directly to `el`
// (not just anywhere in its box, so the empty space beside a short line still counts as empty)
function onText(el, x, y) {
  for (const node of el.childNodes) {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) {
      if (x >= r.left - 4 && x <= r.right + 4 && y >= r.top - 4 && y <= r.bottom + 4) return true;
    }
  }
  return false;
}

function overSomething(e) {
  const t = e.target;
  if (!(t instanceof Element)) return false;
  if (t.closest(INTERACTIVE)) return true;
  // titles, paragraphs, list items, captions...: walk up a few levels so text inside a <span> counts too
  for (let el = t, i = 0; el && el !== document.body && i < 4; el = el.parentElement, i++) {
    if (onText(el, e.clientX, e.clientY)) return true;
  }
  return false;
}

export default function CursorTrail({ items = [] }) {
  const layer = useRef(null);

  useEffect(() => {
    const el = layer.current;
    if (!el || !items.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return; // no mouse

    // load them up front so a painting never pops up blank
    items.forEach((it) => {
      const im = new Image();
      im.src = it.src;
    });

    // shuffled order, so the trail feels random but doesn't repeat a painting too soon
    const order = items.map((_, i) => i).sort(() => Math.random() - 0.5);
    let next = 0;
    let lastT = -Infinity;
    let z = 1;

    const onMove = (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      if (window.innerWidth <= 768) return;
      if (overSomething(e)) return; // hovering text, a title or something interactive: no paintings
      const now = performance.now();
      if (now - lastT < EVERY) return;
      lastT = now;

      const it = items[order[next]];
      next = (next + 1) % order.length;

      // random size and proportions (stretched / squashed, like his clips)
      const area = rand(AREA[0], AREA[1]);
      const ratio = Math.exp(rand(Math.log(RATIO[0]), Math.log(RATIO[1])));
      const w = Math.sqrt(area * ratio);
      const h = Math.sqrt(area / ratio);

      const pop = document.createElement("div");
      pop.className = "trail-pop";
      pop.style.left = `${e.clientX}px`;
      pop.style.top = `${e.clientY}px`;
      pop.style.zIndex = String(z++);
      pop.style.width = `${w.toFixed(1)}px`;
      pop.style.height = `${h.toFixed(1)}px`;
      const img = document.createElement("img");
      img.src = it.src;
      img.alt = "";
      if (it.motion) img.className = `trail-${it.motion}`;
      pop.appendChild(img);
      pop.addEventListener("animationend", (ev) => ev.target === pop && pop.remove());
      el.appendChild(pop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      el.replaceChildren();
    };
  }, [items]);

  return <div ref={layer} className="trail-layer" aria-hidden="true" />;
}

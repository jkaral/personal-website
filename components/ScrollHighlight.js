"use client";

import { useEffect } from "react";

// Cartoon highlighter for essays. Each <mark> inside a `.hl-scroll` element (essay body, title) starts bare; once it scrolls
// past a trigger line (~70% down the screen) a hand-drawn marker stroke swipes across it, line by
// line, and stays. The stroke is an SVG drawn to fit each mark: wobbly edges, a rough rounded tip
// at each end, an ink outline, an offset shadow and a little shine.

const TRIGGER = "0px 0px -30% 0px"; // fires when a mark's top passes 70% down the viewport

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// a smooth path through points (quadratic curves via midpoints)
function smooth(pts) {
  let d = "";
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    d += ` Q${x.toFixed(1)} ${y.toFixed(1)} ${((x + nx) / 2).toFixed(1)} ${((y + ny) / 2).toFixed(1)}`;
  }
  const [lx, ly] = pts[pts.length - 1];
  return d + ` L${lx.toFixed(1)} ${ly.toFixed(1)}`;
}

function strokeSVG(len, h, color, ink, seed) {
  const r = rng(seed);
  const amp = h * 0.06;
  const steps = Math.max(3, Math.round(len / 48));
  const pad = 4; // room for the outline and the offset shadow
  len -= pad;
  h -= pad;
  const top = [];
  const bot = [];
  for (let i = 0; i <= steps; i++) {
    const x = 7 + ((len - 14) * i) / steps;
    top.push([x, h * 0.1 + (r() - 0.5) * 2 * amp]);
    bot.push([x, h * 0.94 + (r() - 0.5) * 2 * amp]);
  }
  bot.reverse();
  const midY = (a, b) => (a[1] + b[1]) / 2;
  // band: top edge left→right, rounded rough tip, bottom edge right→left, tip back to start
  const band =
    `M${top[0][0]} ${top[0][1].toFixed(1)}` +
    smooth(top) +
    ` Q${len + 1} ${(midY(top[top.length - 1], bot[0]) - h * 0.1).toFixed(1)} ${bot[0][0]} ${bot[0][1].toFixed(1)}` +
    smooth(bot) +
    ` Q${-1} ${(midY(top[0], bot[bot.length - 1]) + h * 0.08).toFixed(1)} ${top[0][0]} ${top[0][1].toFixed(1)}Z`;
  // glint: a short cartoon shine tucked into the top-left corner, above the letters
  const gy = h * 0.2;
  const glint = `M${(h * 0.45).toFixed(1)} ${(gy + h * 0.06).toFixed(1)} Q${(h * 0.9).toFixed(1)} ${gy.toFixed(1)} ${(h * 1.9).toFixed(1)} ${gy.toFixed(1)}`;
  // layers: offset ink shadow (comic "sticker" pop), the marker band with an ink outline, a shine streak
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 ${(len + pad).toFixed(0)} ${(h + pad).toFixed(0)}" preserveAspectRatio="none">` +
    `<path d="${band}" transform="translate(2.5 2.5)" fill="${ink}" opacity=".16"/>` +
    `<path d="${band}" fill="${color}" stroke="${ink}" stroke-opacity=".55" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<path d="${glint}" fill="none" stroke="#fff" stroke-width="${(h * 0.07).toFixed(1)}" stroke-linecap="round" opacity=".75"/>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export default function ScrollHighlight() {
  useEffect(() => {
    const marks = [...document.querySelectorAll(".hl-scroll mark")];
    if (!marks.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // (re)draw every stroke to fit its mark: on load, resize and theme change
    const paint = () => {
      const css = getComputedStyle(document.documentElement);
      const color = css.getPropertyValue("--highlight").trim() || "#fbec8f";
      const ink = css.getPropertyValue("--text").trim() || "#111";
      marks.forEach((m, i) => {
        const rects = [...m.getClientRects()];
        if (!rects.length) return;
        const len = rects.reduce((s, q) => s + q.width, 0);
        m.style.setProperty("--hl-img", strokeSVG(len, rects[0].height, color, ink, 7919 * (i + 1)));
        m.style.setProperty("--hl-dur", `${Math.min(1.5, 0.35 + rects.length * 0.35).toFixed(2)}s`);
      });
    };
    paint();

    const light = (m) => {
      m.classList.add("lit");
      m.setAttribute("data-lit", "");
    };
    let io;
    if (reduced) marks.forEach(light);
    else {
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              light(e.target);
              io.unobserve(e.target);
            }
          }),
        { rootMargin: TRIGGER }
      );
      marks.forEach((m) => io.observe(m));
    }

    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(paint, 150);
    };
    window.addEventListener("resize", onResize);
    const themeWatch = new MutationObserver(() => requestAnimationFrame(paint));
    themeWatch.observe(document.documentElement, { attributes: true });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", paint);

    return () => {
      io?.disconnect();
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
      themeWatch.disconnect();
      mq.removeEventListener("change", paint);
    };
  }, []);
  return null;
}

"use client";

import { useEffect, useRef } from "react";

// One orange line that wanders down the page behind everything. On its way it loops around
// each section title (like the sidebar's marker circles) and curls into the odd coil in between.
// Its route is random on every visit; it draws itself in on load and keeps drawing as you scroll.
const STEP = 6; // px per step of the "pen"

function rng(seed) {
  // small seeded random generator, so a rebuild (resize, layout change) keeps the same line
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Where each section title sits on the page (document coordinates, ignoring the reveal animation's
// temporary shift), as an ellipse to loop around.
function measureTitles() {
  return [...document.querySelectorAll(".section-title")]
    .map((h) => {
      const range = document.createRange();
      range.selectNodeContents(h);
      const t = range.getBoundingClientRect();
      const box = h.getBoundingClientRect();
      if (!t.width) return null;
      let top = 0;
      let left = 0;
      for (let el = h; el; el = el.offsetParent) {
        top += el.offsetTop;
        left += el.offsetLeft;
      }
      const x = left + (t.left - box.left);
      const y = top + (t.top - box.top);
      return { cx: x + t.width / 2, cy: y + t.height / 2, rx: t.width / 2 + 34, ry: t.height / 2 + 22 };
    })
    .filter(Boolean)
    .sort((a, b) => a.cy - b.cy);
}

// Draw the line: a pen that wanders (sweeping side to side, wobbling, occasionally coiling),
// homes in on each title, circles it with a hand-drawn loop, then wanders on.
// Returns the points plus how far down the page the pen has reached at each one.
function walk(W, H, seed, titles) {
  const r = rng(seed);
  const margin = W * 0.025;
  let entrySide = r() < 0.5 ? 0 : 1; // which side the line comes into the next title from (0 = left)
  const pts = [];
  const reach = [];
  let maxY = -Infinity;
  let x = W * (0.15 + r() * 0.7);
  let y = -10;
  let th = Math.PI / 2;
  let k = 0;
  let side = x < W / 2 ? 1 : 0;
  let nextCoil = 250 + r() * 300;

  const put = (px, py) => {
    x = px;
    y = py;
    pts.push([px, py]);
    maxY = Math.max(maxY, py);
    reach.push(maxY);
  };
  put(x, y);

  const coil = () => {
    const dir = r() < 0.5 ? -1 : 1;
    const twist = r() < 0.35;
    let left = twist ? Math.PI * (1 + r() * 0.6) : Math.PI * 2 * (r() > 0.8 ? 2 : 1);
    let rad = twist ? 55 + r() * 60 : 22 + r() * 34;
    const grow = twist ? 1 : r() < 0.5 ? 0.993 : 1.004;
    while (left > 0) {
      const d = STEP / rad;
      th += dir * d * (0.8 + r() * 0.4);
      left -= d;
      rad *= grow;
      put(x + Math.cos(th) * STEP, y + Math.sin(th) * STEP);
    }
  };

  // wander toward (tx, ty); with `land`, arrive exactly there heading along `landTh`
  const wanderTo = (tx, ty, land, landTh) => {
    const way = [];
    let wy = y;
    while (ty - wy > 900) {
      side = 1 - side; // sweep across the page on long stretches
      wy += 380 + r() * 420;
      way.push([side ? W * (0.55 + r() * 0.4) : W * (0.03 + r() * 0.4), Math.min(wy, ty - 300)]);
    }
    way.push([tx, ty]);
    let guard = 0;
    for (let i = 0; i < way.length; i++) {
      const [gx, gy] = way[i];
      const final = i === way.length - 1;
      while (guard++ < 40000) {
        const dist = Math.hypot(gx - x, gy - y);
        if (!final && (dist < 90 || y > gy - 40)) break;
        if (final && !land && y > ty) return;
        if (final && land && dist < STEP * 1.5) {
          put(gx, gy);
          th = landTh;
          return;
        }
        const want = Math.atan2(gy - y, gx - x);
        const near = final && land ? clamp01(1 - dist / 260) : 0;
        k += (r() - 0.5) * 0.022 * (1 - near); // free-form wobble, calmer on approach
        k *= 0.95;
        k += wrap(want - th) * (0.0045 + near * 0.02);
        if (x < margin) k += wrap(0 - th) * 0.02;
        if (x > W - margin) k += wrap(Math.PI - th) * 0.02;
        k = Math.max(-0.09, Math.min(0.09, k));
        th += k;
        if (near > 0.55) th += wrap(want - th) * 0.3 * near; // guarantee we arrive, no orbiting
        put(x + Math.cos(th) * STEP, y + Math.sin(th) * STEP);
        if (y > nextCoil && (!final || !land || dist > 380)) {
          coil();
          nextCoil = y + 320 + r() * 480;
        }
      }
    }
  };

  // a hand-drawn loop around a title: a bit more than one turn, wobbly, spiralling slightly out
  const loopAround = (t) => {
    // swing out to one side above the title first (alternating, so loops are entered from the
    // left about as often as from the right and the line uses the left margin too)
    if (r() < 0.8) entrySide = 1 - entrySide;
    const gap = t.cy - t.ry - y;
    if (gap > 260) {
      const lx = entrySide === 0
        ? W * 0.03 + r() * Math.max(10, t.cx - t.rx - 50 - W * 0.03)
        : Math.min(W * 0.95, t.cx + t.rx + 60 + r() * Math.max(10, W * 0.9 - t.cx - t.rx - 60));
      wanderTo(lx, t.cy - t.ry - Math.min(gap * 0.45, 140 + r() * 120), false);
    }
    const fromLeft = entrySide === 0 ? x < t.cx + t.rx * 0.5 : x < t.cx - t.rx * 0.5;
    const a0 = fromLeft ? Math.PI + 0.45 : -0.45; // enter at the upper-left / upper-right
    const dir = fromLeft ? -1 : 1; // then go down that side, under, and back over the top
    const turn = Math.PI * 2 * (1.1 + r() * 0.12);
    const ph = r() * 6;
    const at = (a, s) => [t.cx + t.rx * s * Math.cos(a), t.cy + t.ry * s * Math.sin(a)];
    const [ex, ey] = at(a0, 1);
    // heading along the loop at the entry point, so the line flows straight into it
    const tx = -t.rx * Math.sin(a0) * dir;
    const ty = t.ry * Math.cos(a0) * dir;
    const entryTh = Math.atan2(ty, tx);
    wanderTo(ex - Math.cos(entryTh) * 70, ey - Math.sin(entryTh) * 70, true, entryTh); // run-up
    for (let s = 1; s <= 11; s++) put(x + (ex - x) / (12 - s), y + (ey - y) / (12 - s)); // straight into the loop
    const steps = Math.ceil((turn * (t.rx + t.ry)) / 2 / STEP);
    for (let i = 1; i <= steps; i++) {
      const u = i / steps;
      const a = a0 + dir * turn * u;
      const s = 1 + 0.035 * Math.sin(u * 9 + ph) + 0.1 * u;
      put(...at(a, s));
    }
    const [px, py] = pts[pts.length - 2];
    th = Math.atan2(y - py, x - px);
    k = 0;
    nextCoil = Math.max(nextCoil, y + 200);
  };

  for (const t of titles) {
    if (t.cy - t.ry < y + 40) continue; // too close to where we already are
    loopAround(t);
  }
  wanderTo(W * (0.1 + r() * 0.8), H + 20, false);
  return { pts, reach };
}

function toPath(pts) {
  // smooth curve through the points (quadratic segments via midpoints)
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const mx = (x + pts[i + 1][0]) / 2;
    const my = (y + pts[i + 1][1]) / 2;
    d += `Q${x.toFixed(1)} ${y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  return d;
}

export default function SwirlLine() {
  const svgRef = useRef(null);
  const pathRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    const path = pathRef.current;
    if (!svg || !path) return;
    const seed = (Math.random() * 2 ** 31) | 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let reach = [];
    let total = 1;
    let shown = 0;
    let target = 0;
    let raf = 0;
    let lastSig = "";
    // on page load the line draws itself in, like the sidebar's marker circles (same easing and delay)
    const INTRO_DELAY = 350;
    const INTRO_MS = 1600;
    const introStart = performance.now() + INTRO_DELAY;
    const introOn = () => !reduced && performance.now() < introStart + INTRO_MS;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const build = () => {
      const W = document.documentElement.clientWidth;
      const banner = document.querySelector(".banner-wrap");
      const H = banner ? banner.getBoundingClientRect().top + window.scrollY : document.documentElement.scrollHeight;
      const titles = measureTitles();
      // only rebuild when the page width, height or a title's position has really changed
      const sig = [Math.round(W), Math.round(H / 40), ...titles.map((t) => `${Math.round(t.cx / 8)},${Math.round(t.cy / 8)}`)].join("|");
      if (sig === lastSig) return;
      lastSig = sig;
      svg.setAttribute("width", W);
      svg.setAttribute("height", H);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const w = walk(W, H, seed, titles);
      reach = w.reach;
      path.setAttribute("d", toPath(w.pts));
      total = path.getTotalLength();
      path.style.strokeDasharray = `${total}`;
      update(true);
    };

    // how much of the line to show: everything above a point ~70% down the screen
    const lengthFor = (yLine) => {
      let lo = 0;
      let hi = reach.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (reach[mid] < yLine) lo = mid + 1;
        else hi = mid;
      }
      return (lo / Math.max(1, reach.length - 1)) * total;
    };

    const tick = () => {
      if (introOn()) {
        const t = Math.max(0, (performance.now() - introStart) / INTRO_MS);
        shown = target * ease(t);
        path.style.strokeDashoffset = `${total - shown}`;
        raf = requestAnimationFrame(tick);
        return;
      }
      shown += (target - shown) * 0.12;
      if (Math.abs(target - shown) < 0.5) shown = target;
      path.style.strokeDashoffset = `${total - shown}`;
      raf = shown === target ? 0 : requestAnimationFrame(tick);
    };

    const update = (instant) => {
      target = reduced ? total : lengthFor(window.scrollY + window.innerHeight * 0.7);
      if ((instant === true && !introOn()) || reduced) {
        shown = target;
        path.style.strokeDashoffset = `${total - shown}`;
      } else if (!raf) raf = requestAnimationFrame(tick);
    };

    build();
    if (introOn()) {
      path.style.strokeDashoffset = `${total}`; // start hidden, then draw in
      if (!raf) raf = requestAnimationFrame(tick);
    }
    const ro = new ResizeObserver(() => build());
    ro.observe(document.body);
    document.fonts?.ready.then(build); // titles move slightly once the fonts arrive
    const onScroll = () => update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <svg ref={svgRef} className="swirl-line" aria-hidden="true" width="0" height="0">
      <path ref={pathRef} />
    </svg>
  );
}

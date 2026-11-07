"use client";

import { useEffect, useRef } from "react";

// Full-page animated background of softly floating particles.
//  - particles drift upward with a gentle sway; nearer ones are bigger and faster
//  - they ease away from the cursor, and a click sends out a little ripple
//  - colours come from the palette (--text and --dot), so light/dark mode just works
//  - pauses when the tab is hidden; draws one still frame for reduced-motion users
export default function ParticleBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1, raf = 0, last = performance.now();
    let colors = { ink: "33,31,28", dot: "13,153,255" };
    const mouse = { x: -9999, y: -9999 };
    const ripples = [];
    let parts = [];

    const toRgb = (c) => {
      const el = document.createElement("span");
      el.style.color = c;
      document.body.appendChild(el);
      const rgb = getComputedStyle(el).color.match(/\d+(\.\d+)?/g) || [0, 0, 0];
      el.remove();
      return rgb.slice(0, 3).join(",");
    };
    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      colors = { ink: toRgb(cs.getPropertyValue("--text").trim() || "#211f1c"), dot: toRgb(cs.getPropertyValue("--dot").trim() || "#0d99ff") };
    };

    const make = (randomY = true) => {
      const z = Math.random(); // depth: 0 = far, 1 = near
      return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : h + 20,
        z,
        r: 1 + z * 3.2,
        vy: -(6 + z * 22), // px per second (upward)
        sway: 8 + Math.random() * 18,
        phase: Math.random() * Math.PI * 2,
        freq: 0.15 + Math.random() * 0.35,
        ox: 0, oy: 0, // offset from cursor/ripple pushes
        accent: Math.random() < 0.12, // a few tinted particles
        alpha: 0.1 + z * 0.22,
      };
    };

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(90, (w * h) / 16000)); // fewer on small screens
      while (parts.length < target) parts.push(make());
      parts.length = target;
    };

    const draw = (t, dt) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        if (dt) {
          p.y += p.vy * dt;
          p.phase += p.freq * dt;
          // cursor: ease away within a radius, stronger for nearer particles
          const px = p.x + Math.sin(p.phase) * p.sway + p.ox;
          const py = p.y + p.oy;
          const dx = px - mouse.x, dy = py - mouse.y;
          const d = Math.hypot(dx, dy);
          const R = 130;
          if (d < R && d > 0.01) {
            const f = (1 - d / R) * (40 + p.z * 60) * dt;
            p.ox += (dx / d) * f * 6;
            p.oy += (dy / d) * f * 6;
          }
          for (const rp of ripples) {
            const rx = px - rp.x, ry = py - rp.y;
            const rd = Math.hypot(rx, ry);
            if (Math.abs(rd - rp.r) < 40 && rd > 0.01) {
              const f = (1 - Math.abs(rd - rp.r) / 40) * rp.power * dt;
              p.ox += (rx / rd) * f;
              p.oy += (ry / rd) * f;
            }
          }
          // spring back home
          p.ox *= 1 - Math.min(1, dt * 1.6);
          p.oy *= 1 - Math.min(1, dt * 1.6);
          if (p.y < -30) Object.assign(p, make(false));
        }
        const x = p.x + Math.sin(p.phase) * p.sway + p.ox;
        const y = p.y + p.oy;
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.accent ? colors.dot : colors.ink},${p.accent ? p.alpha + 0.12 : p.alpha})`;
        ctx.fill();
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        if (dt) {
          rp.r += 420 * dt;
          rp.power *= 1 - Math.min(1, dt * 1.8);
        }
        if (rp.r > Math.max(w, h)) ripples.splice(i, 1);
      }
    };

    const loop = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      draw(t, dt);
      raf = requestAnimationFrame(loop);
    };

    readColors();
    resize();
    if (reduced) {
      draw(0, 0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = () => { mouse.x = mouse.y = -9999; };
    const onClick = (e) => { if (!reduced) ripples.push({ x: e.clientX, y: e.clientY, r: 0, power: 900 }); };
    const onVis = () => {
      if (reduced) return;
      if (document.hidden) cancelAnimationFrame(raf);
      else { last = performance.now(); raf = requestAnimationFrame(loop); }
    };
    const onResize = () => { resize(); if (reduced) draw(0, 0); };
    // re-read colours when the theme or palette changes
    const mo = new MutationObserver(() => { readColors(); if (reduced) draw(0, 0); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => { readColors(); if (reduced) draw(0, 0); };

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onClick, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    mq.addEventListener("change", onScheme);
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onClick);
      document.removeEventListener("visibilitychange", onVis);
      mq.removeEventListener("change", onScheme);
    };
  }, []);

  return <canvas ref={ref} className="bg-particles" aria-hidden="true" />;
}

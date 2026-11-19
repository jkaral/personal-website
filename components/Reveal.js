"use client";

import { useEffect } from "react";

// Adds "in" to elements as they scroll into view (instantly for reduced-motion users):
//  - .reveal   sections fade in as soon as a sliver is visible
//  - .draw-on  photos with pencil circles wait until about half the photo is on screen,
//              so each circle starts drawing when you're actually looking at it
export default function Reveal() {
  useEffect(() => {
    const reveal = document.querySelectorAll(".reveal");
    const draw = document.querySelectorAll(".draw-on");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      [...reveal, ...draw].forEach((el) => el.classList.add("in"));
      return;
    }
    const watch = (els, options) => {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      }, options);
      els.forEach((el) => io.observe(el));
      return io;
    };
    const a = watch(reveal, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    const b = watch(draw, { threshold: 0.55 });
    return () => {
      a.disconnect();
      b.disconnect();
    };
  }, []);

  // Opened with a section anchor (e.g. "/#about" from another page): the browser jumps there before
  // images and fonts above it have loaded, then the page keeps growing and the section ends up lower.
  // So for the first few seconds, whenever the page changes size, scroll back to the section
  // (stops as soon as the visitor scrolls themselves).
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id || !document.getElementById(id)) return;
    let stopped = false;
    const stop = () => (stopped = true);
    window.addEventListener("wheel", stop, { passive: true, once: true });
    window.addEventListener("touchmove", stop, { passive: true, once: true });
    window.addEventListener("keydown", stop, { once: true });
    window.addEventListener("pointerdown", stop, { once: true });
    const go = () => {
      const el = document.getElementById(id);
      if (el && !stopped) el.scrollIntoView({ behavior: "instant", block: "start" });
    };
    let raf = 0;
    const soon = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(go);
    };
    const ro = new ResizeObserver(soon); // the page grew or shrank (images, fonts, videos loading)
    ro.observe(document.body);
    window.addEventListener("load", soon, { once: true });
    document.fonts?.ready.then(soon);
    soon();
    const done = setTimeout(() => {
      stopped = true;
      ro.disconnect();
    }, 4000);
    return () => {
      stopped = true;
      clearTimeout(done);
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("keydown", stop);
      window.removeEventListener("pointerdown", stop);
      window.removeEventListener("load", soon);
    };
  }, []);
  return null;
}

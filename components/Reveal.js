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
  return null;
}

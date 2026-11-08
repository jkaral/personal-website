"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import VinylPlayer from "./VinylPlayer";
import { loopPoints, toPath } from "./PencilCircle";

// Left sidebar (wide screens only), like justinzwu.com: right-aligned section links that
// darken on hover, the section you're reading is highlighted, and a vinyl player below.
export default function Sidebar({ links, songs }) {
  const [active, setActive] = useState(links[0]?.id);
  const [hidden, setHidden] = useState(false); // fade out while the full-width banner is on screen

  useEffect(() => {
    const banner = document.querySelector(".banner-wrap");
    if (!banner || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setHidden(e.intersectionRatio > 0.25), { threshold: [0, 0.25, 0.5] });
    io.observe(banner);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const sections = links.map((l) => document.getElementById(l.id)).filter(Boolean);
    if (!sections.length) return;
    const onScroll = () => {
      const line = window.innerHeight * 0.35; // the section crossing 35% down the screen is "current"
      // the section whose top most recently passed the line (works whatever order the links are in)
      let current = sections[0].id;
      let best = -Infinity;
      for (const s of sections) {
        const top = s.getBoundingClientRect().top;
        if (top <= line && top > best) {
          best = top;
          current = s.id;
        }
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [links]);

  return (
    <aside className={`sidebar ${hidden ? "is-hidden" : ""}`} aria-label="Sections">
      <nav>
        <ul className="sidebar-list">
          {links.map((l) => (
            <li key={l.id}>
              <a href={`/#${l.id}`} className={`sidebar-link ${active === l.id ? "active" : ""}`} aria-current={active === l.id ? "true" : undefined}>
                {l.label}
                <MarkerCircle index={links.indexOf(l)} />
              </a>
            </li>
          ))}
          {/* right after contact; no section for this one, it opens the resume PDF in a new tab */}
          <li>
            <a href="/resume.pdf" target="_blank" rel="noreferrer" className="sidebar-link">
              resume
              <MarkerCircle index={links.length} />
            </a>
          </li>
        </ul>
      </nav>
      {songs?.length > 0 && <VinylPlayer songs={songs} />}
    </aside>
  );
}

// Orange hand-drawn marker loop around a sidebar link; draws itself in on page load.
function MarkerCircle({ index }) {
  const ref = useRef(null);
  const [size, setSize] = useState(null);

  useLayoutEffect(() => {
    const link = ref.current?.parentElement;
    if (!link) return;
    const measure = () => setSize({ w: link.offsetWidth + 26, h: link.offsetHeight + 14 });
    measure();
    document.fonts?.ready.then(measure);
  }, []);

  const d = size ? toPath(loopPoints(size.w / 2, size.h / 2, size.w / 2 - 3, size.h / 2 - 3, index * 13 + 7)) : "";
  return (
    <svg
      ref={ref}
      className="marker-circle"
      style={{ "--i": index, width: size?.w, height: size?.h }}
      viewBox={size ? `0 0 ${size.w} ${size.h}` : "0 0 1 1"}
      aria-hidden="true"
    >
      {d && <path d={d} pathLength="1" />}
    </svg>
  );
}


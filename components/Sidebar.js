"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import RecordShelf from "./RecordShelf";
import { loopPoints, toPath } from "./PencilCircle";

// Left sidebar (wide screens only), like justinzwu.com: right-aligned links that darken on hover.
// Most sections have their own page (highlighted while you're on it); on the homepage, the
// homepage section you're reading (about) is highlighted as you scroll. The record player sits
// below the links. Sizes and spacing follow justinzwu.com's side panel.
export default function Sidebar({ links, songs }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const homeLinks = links.filter((l) => l.href.startsWith("/#"));
  const pageLink = links.find((l) => !l.href.startsWith("/#") && l.href === pathname);
  const [scrolled, setScrolled] = useState(homeLinks[0]?.id);
  const active = onHome ? scrolled : pageLink?.id;
  // Always visible on every page (links + record player). When the full-width banner scrolls up to
  // the sidebar's bottom edge, it pushes the sidebar up ahead of it (like a sticky header being pushed
  // by the next section), so the record player and its song title stay readable right above the
  // banner instead of being covered by it.
  const asideRef = useRef(null);
  useEffect(() => {
    const aside = asideRef.current;
    const banner = document.querySelector(".banner-wrap");
    if (!aside || !banner) return;
    const GAP = 16; // px kept between the record player and the banner
    const update = () => {
      if (getComputedStyle(aside).display === "none") return; // narrow screens: no sidebar
      // the page is zoomed (html { zoom }): sizes below are in page px, the banner's position in screen px
      const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
      const bottom = parseFloat(getComputedStyle(aside).top) + aside.offsetHeight; // un-pushed bottom edge (page px)
      const push = Math.max(0, bottom + GAP - banner.getBoundingClientRect().top / zoom);
      aside.style.transform = push ? `translateY(${-push}px)` : "";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const ro = new ResizeObserver(update); // e.g. a longer song title wrapping onto two lines
    ro.observe(aside);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, [pathname]);

  useEffect(() => {
    if (!onHome) return;
    const sections = homeLinks.map((l) => document.getElementById(l.id)).filter(Boolean);
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
      setScrolled(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onHome, links]);

  return (
    <aside ref={asideRef} className="sidebar" aria-label="Sections">
      <nav>
        <ul className="sidebar-list">
          {links.map((l) => (
            <li key={l.id}>
              <a href={l.href} className={`sidebar-link ${active === l.id ? "active" : ""}`} aria-current={active === l.id ? "true" : undefined}>
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
      {songs?.length > 0 && <RecordShelf songs={songs} />}
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


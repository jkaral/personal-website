"use client";

import { useEffect, useRef, useState } from "react";

// The site logo (Creation of Adam) as a button in the top bar, right after the X icon. It isn't a link:
// clicking it collapses every icon before it (chat, email, GitHub, LinkedIn, X) into it one at a time,
// starting with the closest (X); clicking again brings them back out starting with the farthest (chat).
// The day/night shortcut hint and toggle (after the logo) stay put. The choice is remembered in this browser.
const KEY = "topbar-collapsed";

export default function TopBarCollapse() {
  const btn = useRef(null);
  const [collapsed, setCollapsed] = useState(false);

  // restore the visitor's last choice
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "1") setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    const me = btn.current;
    const bar = me?.parentElement;
    if (!bar) return;
    // every icon before the logo, numbered by distance from it: 0 = closest (X)
    const icons = [];
    for (let el = me.previousElementSibling; el; el = el.previousElementSibling) icons.push(el);
    icons.forEach((el, i) => {
      el.classList.add("collapsible");
      if (!el.style.getPropertyValue("--w")) el.style.setProperty("--w", `${el.offsetWidth}px`); // its open width
      el.style.setProperty("--i", i); // collapse order: closest first
      el.style.setProperty("--j", icons.length - 1 - i); // expand order: farthest first
    });
    bar.classList.toggle("icons-collapsed", collapsed);
    try {
      localStorage.setItem(KEY, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  return (
    <button
      ref={btn}
      type="button"
      className="topbar-collapse"
      onClick={() => setCollapsed((c) => !c)}
      aria-expanded={!collapsed}
      aria-label={collapsed ? "Show the icons" : "Hide the icons"}
      title={collapsed ? "Show the icons" : "Hide the icons"}
    >
      <img className="logo-light" src="/images/logo/hands.webp" alt="" />
      <img className="logo-dark" src="/images/logo/hands-dark.webp" alt="" />
    </button>
  );
}

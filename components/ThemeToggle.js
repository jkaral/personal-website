"use client";

import { useEffect } from "react";
import Icon from "./Icon";

function toggle() {
  const root = document.documentElement;
  const current =
    root.dataset.theme ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {}
}

export default function ThemeToggle() {
  // Shift + Y switches light/dark from anywhere (not while typing in a field)
  useEffect(() => {
    const onKey = (e) => {
      if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || e.repeat || e.code !== "KeyY") return;
      const t = e.target;
      if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <span className="theme-hint" aria-hidden="true">⇧shift+y</span>
      <button className="theme-toggle" onClick={toggle} aria-label="Toggle dark mode" aria-keyshortcuts="Shift+Y" title="Toggle dark mode (Shift+Y)">
        <span className="moon"><Icon name="moon" size={17} /></span>
        <span className="sun"><Icon name="sun" size={17} /></span>
      </button>
    </>
  );
}

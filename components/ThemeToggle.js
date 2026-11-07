"use client";

import Icon from "./Icon";

export default function ThemeToggle() {
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

  return (
    <button className="theme-toggle" onClick={toggle} aria-label="Toggle dark mode">
      <span className="moon"><Icon name="moon" size={17} /></span>
      <span className="sun"><Icon name="sun" size={17} /></span>
    </button>
  );
}

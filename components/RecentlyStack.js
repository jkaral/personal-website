"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";

const tilts = [-2, 4, -5, 3, -3, 5];

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// "Recently" photos: a tilted pile that expands into a grid; any photo opens in an on-page viewer.
export default function RecentlyStack({ photos }) {
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(null); // index of photo in the viewer
  const [muted, setMuted] = useState(true); // videos autoplay silently; the speaker button toggles sound

  const itemRefs = useRef([]);
  const firstRects = useRef(null);
  const rootRef = useRef(null);

  // apply sound on/off directly to the <video> elements (React's muted prop only applies on first render)
  useEffect(() => {
    rootRef.current?.querySelectorAll("video").forEach((v) => {
      v.muted = muted;
      if (v.paused) v.play().catch(() => {});
    });
  }, [muted, expanded]);

  function toggle() {
    // FLIP: remember where each photo is before the layout changes...
    firstRects.current = itemRefs.current.map((el) => el?.getBoundingClientRect());
    if (expanded) setMuted(true); // collapsing back to the pile: mute the video again
    setExpanded((e) => !e);
  }

  // ...then animate each photo from its old spot to its new one.
  useLayoutEffect(() => {
    const first = firstRects.current;
    if (!first) return;
    firstRects.current = null;
    if (prefersReducedMotion()) return;
    itemRefs.current.forEach((el, i) => {
      const a = first[i];
      if (!el || !a) return;
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height) return;
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      const sx = a.width / b.width;
      const sy = a.height / b.height;
      el.animate(
        [
          { transformOrigin: "top left", transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
          { transformOrigin: "top left", transform: "none" },
        ],
        { duration: 600, easing: "cubic-bezier(.2,.75,.2,1)", delay: expanded ? i * 35 : 0, fill: "backwards" }
      );
    });
    if (expanded && rootRef.current) {
      const r = rootRef.current.getBoundingClientRect();
      if (r.bottom > window.innerHeight) {
        rootRef.current.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });
      }
    }
  }, [expanded]);

  return (
    <div ref={rootRef} className={`recently ${expanded ? "expanded" : ""}`}>
      <div className="recently-head">
        <p className="recently-label">
          Recently{!expanded && <span aria-hidden="true">↓</span>}
        </p>
        {expanded && (
          <button className="recently-collapse" onClick={toggle}>
            Collapse <span aria-hidden="true">↑</span>
          </button>
        )}
      </div>

      <div
        className="pile"
        role={expanded ? "list" : undefined}
        onClick={expanded ? undefined : toggle}
        onKeyDown={expanded ? undefined : (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggle())}
        tabIndex={expanded ? undefined : 0}
        aria-label={expanded ? undefined : `Show all ${photos.length} recent photos and videos`}
      >
        {photos.map((p, i) => (
          <figure
            key={p.src}
            ref={(el) => (itemRefs.current[i] = el)}
            className={`ph ${p.video ? "ph-video" : ""}`}
            role={expanded ? "listitem" : undefined}
            style={{ zIndex: expanded ? undefined : photos.length - i + (p.video ? 10 : 0) }}
          >
            <button
              className="ph-btn"
              tabIndex={expanded ? 0 : -1}
              onClick={expanded ? () => { setMuted(true); setOpen(i); } : undefined}
              aria-label={expanded ? `Open ${p.video ? "video" : "photo"}: ${p.caption}` : undefined}
              aria-hidden={expanded ? undefined : true}
            >
              {p.video ? (
                // iPhone-style clip: autoplays muted on a loop, no frame or bezel
                <video src={p.video} poster={p.src} autoPlay loop playsInline muted={muted} preload="auto" aria-label={p.caption} />
              ) : (
                <img
                  src={p.src}
                  alt={expanded ? p.caption : ""}
                  style={{ transform: expanded ? "none" : `rotate(${i === 0 ? -2 : tilts[i % tilts.length]}deg)` }}
                />
              )}
            </button>
            {p.video && (
              <button
                className="sound-toggle"
                onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
                aria-label={muted ? "Turn sound on" : "Turn sound off"}
                aria-pressed={!muted}
              >
                {muted ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" /></svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>
                )}
              </button>
            )}
            {expanded && <figcaption>{p.caption}</figcaption>}
          </figure>
        ))}
      </div>

      {!expanded && (
        <p className="recently-caption">
          {photos[0].caption}
          <span className="hint">Click to see all {photos.length}</span>
        </p>
      )}

      {open !== null && <Lightbox photos={photos} index={open} setIndex={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Lightbox({ photos, index, setIndex, onClose }) {
  const closeRef = useRef(null);
  const n = photos.length;
  const p = photos[index];
  const prev = useCallback(() => setIndex((i) => (i - 1 + n) % n), [n, setIndex]);
  const next = useCallback(() => setIndex((i) => (i + 1) % n), [n, setIndex]);

  useEffect(() => {
    const opener = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKey(e) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [onClose, prev, next]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={p.caption} onClick={onClose}>
      <button ref={closeRef} className="lb-close" onClick={onClose} aria-label="Close">✕</button>
      {n > 1 && (
        <button className="lb-nav prev" onClick={(e) => (e.stopPropagation(), prev())} aria-label="Previous photo">←</button>
      )}
      <figure className="lb-figure" onClick={(e) => e.stopPropagation()}>
        {p.video ? (
          <video key={p.video} src={p.video} poster={p.src} controls autoPlay loop playsInline className="lb-video" />
        ) : (
          <img key={p.src} src={p.full || p.src} alt={p.caption} />
        )}
        <figcaption>
          {p.caption}
          <span className="lb-count">{index + 1} / {n}</span>
        </figcaption>
      </figure>
      {n > 1 && (
        <button className="lb-nav next" onClick={(e) => (e.stopPropagation(), next())} aria-label="Next photo">→</button>
      )}
    </div>
  );
}

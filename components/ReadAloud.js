"use client";

import { useEffect, useRef, useState } from "react";

// Speaker button beside the opening quote: plays a recorded reading of it.
// A handwritten note with a squiggly arrow (same style as the chat note) points at the button.
export default function ReadAloud({ audio, label = "Play recording", note = "" }) {
  const [playing, setPlaying] = useState(false);
  const [noteDrawn, setNoteDrawn] = useState(false);
  const audioRef = useRef(null);
  const wrapRef = useRef(null);

  // draw the note's arrow only once it scrolls into view
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !note) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNoteDrawn(true), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [note]);

  useEffect(() => () => audioRef.current?.pause(), []);

  function onClick() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      a.currentTime = 0;
      setPlaying(false);
    } else {
      a.currentTime = 0;
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  return (
    <span className="read-aloud-wrap" ref={wrapRef}>
      <audio ref={audioRef} src={audio} preload="none" onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} />
      <button
        type="button"
        className={`read-aloud${playing ? " active" : ""}`}
        onClick={onClick}
        aria-pressed={playing}
        aria-label={playing ? "Stop recording" : label}
        title={playing ? "Stop recording" : label}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {playing ? (
            <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" stroke="none" />
          ) : (
            <>
              <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
            </>
          )}
        </svg>
      </button>
      {note && (
        // handwritten note to the right; the arrow squiggles left and points at the button
        <span className={`quote-note ${noteDrawn ? "drawn" : ""} ${playing ? "hidden" : ""}`} aria-hidden="true">
          <svg className="quote-arrow" viewBox="0 0 72 40" width="72" height="40">
            <path className="quote-arrow-line" pathLength="1" d="M70 28 C 58 34, 46 30, 48 22 C 50 14, 36 12, 30 20 C 24 28, 14 24, 5 20" />
            <path className="quote-arrow-head" pathLength="1" d="M12 13 L4 20 L12 27" />
          </svg>
          <span className="quote-note-text">{note}</span>
        </span>
      )}
    </span>
  );
}

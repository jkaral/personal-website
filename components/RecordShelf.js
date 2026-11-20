"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Sidebar record player: a turntable, and below it a wooden shelf with the records (songs from `music`
// in content/site.js) standing on it, leaning on each other. Pick a record up, drag it and drop it on the
// turntable to load it (or click it). It starts playing straight away; the button pauses / resumes.
// Loading another record puts the previous one back on the shelf. The record spins while it plays.

const DRAG_PX = 4; // movement before a press counts as a drag instead of a click
// the page is zoomed (html { zoom }): screen px / zoom = page px
const pageZoom = () => parseFloat(getComputedStyle(document.documentElement).zoom) || 1;

export default function RecordShelf({ songs = [] }) {
  const list = songs.filter((s) => s.src);
  const [loaded, setLoaded] = useState(null); // index of the record on the turntable
  const [playing, setPlaying] = useState(false);
  const [dragging, setDragging] = useState(null); // { index, x, y } while a record is being carried
  const [overDeck, setOverDeck] = useState(false);
  const audio = useRef(null);
  const deck = useRef(null);

  const song = loaded == null ? null : list[loaded];

  // put a record on the turntable: stops whatever was playing and plays the new one straight away
  const load = (i) => {
    const a = audio.current;
    if (a) a.pause();
    setPlaying(false);
    setLoaded(i);
  };

  // the new record's audio file, started as soon as it's on the turntable
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    if (song) {
      a.src = song.src;
      a.load();
      a.play().catch(() => setPlaying(false));
    } else a.removeAttribute("src");
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = () => {
    const a = audio.current;
    if (!a || !song) return;
    if (a.paused) a.play().catch(() => setPlaying(false));
    else a.pause();
  };

  const overTurntable = (x, y) => {
    const r = deck.current?.getBoundingClientRect();
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  // press on a record: a click loads it; a drag carries it, and dropping it on the turntable loads it
  const onPointerDown = (e, i) => {
    if (e.button !== 0 || i === loaded) return;
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY };
    let carrying = false;
    const move = (ev) => {
      if (!carrying && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < DRAG_PX) return;
      carrying = true;
      const z = pageZoom();
      setDragging({ index: i, x: ev.clientX / z, y: ev.clientY / z });
      setOverDeck(overTurntable(ev.clientX, ev.clientY));
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (!carrying || overTurntable(ev.clientX, ev.clientY)) load(i); // a click, or dropped on the turntable
      setDragging(null);
      setOverDeck(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  if (!list.length) return null;
  const carried = dragging ? list[dragging.index] : null;

  return (
    <div className={`record-deck ${dragging ? "is-dragging" : ""}`}>
      <audio ref={audio} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />

      {/* the turntable; the loaded record lies on its platter */}
      <div ref={deck} className={`turntable ${overDeck ? "drop-ready" : ""}`} aria-label={song ? `On the turntable: ${song.title}` : "Turntable (empty)"}>
        <img className="turntable-img" src="/images/player/turntable.svg" alt="" draggable={false} />
        {song && (
          <span className={`platter-record ${playing ? "spinning" : ""}`} aria-hidden="true">
            <img src={song.cover} alt="" draggable={false} />
          </span>
        )}
      </div>

      {/* play / pause + what's on */}
      <div className="deck-controls">
        <button type="button" className="deck-play" onClick={togglePlay} disabled={!song} aria-label={playing ? "Pause" : "Play"} title={song ? (playing ? "Pause" : "Play") : "Drop a record on the turntable first"}>
          {playing ? (
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
        <p className="deck-now">
          {song ? (
            <>
              <span className="deck-title">{song.title}</span>
              <span className="deck-artist">{song.artist}</span>
            </>
          ) : (
            <span className="deck-hint">drag a record onto the player</span>
          )}
        </p>
      </div>

      {/* the shelf: records standing on it, leaning on each other */}
      <div className="record-shelf">
        <div className="shelf-records">
          {list.map((s, i) => {
            const gone = i === loaded || dragging?.index === i;
            return (
              <button
                key={s.src}
                type="button"
                className={`shelf-record ${gone ? "gone" : ""}`}
                style={{ "--k": i, "--n": list.length }}
                onPointerDown={(e) => onPointerDown(e, i)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), load(i))}
                aria-label={`${s.title} by ${s.artist}: put it on the turntable`}
                title={`${s.title} · ${s.artist}`}
                disabled={i === loaded}
              >
                <img src={s.cover} alt="" draggable={false} />
              </button>
            );
          })}
        </div>
        <img className="shelf-plank" src="/images/player/shelf.png" alt="" draggable={false} />
      </div>

      {/* the record being carried follows the pointer (rendered on <body>: the sidebar can be shifted
          up by the banner, which would throw off a position:fixed element inside it) */}
      {carried &&
        createPortal(
          <span className={`carried-record ${overDeck ? "over" : ""}`} style={{ left: dragging.x, top: dragging.y }} aria-hidden="true">
            <img src={carried.cover} alt="" draggable={false} />
          </span>,
          document.body
        )}
    </div>
  );
}

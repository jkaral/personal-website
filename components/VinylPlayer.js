"use client";

import { useEffect, useRef, useState } from "react";

// A small vinyl record that plays a playlist of audio files hosted on this site
// (put them in /public/music). Tap the record to play / pause, ⏮ ⏭ to move between songs;
// when a song ends the next one starts. The record spins while it's playing.
// Songs come from `music` in content/site.js.

export default function VinylPlayer({ songs = [] }) {
  const list = songs.filter((s) => s.src);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audio = useRef(null);
  const autoPlay = useRef(false); // start the next song as soon as its source is swapped in
  const song = list[index];

  // a new song was loaded: keep playing if we were
  useEffect(() => {
    const a = audio.current;
    if (!a || !autoPlay.current) return;
    autoPlay.current = false;
    a.play().catch(() => setPlaying(false));
  }, [index]);

  if (!song) return null;

  // tap the record: play / pause
  const play = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => setPlaying(false));
    else a.pause();
  };
  const go = (d) => {
    const a = audio.current;
    if (!a) return;
    // ⏮ more than 3s into a song (or a one-song list) restarts it
    if (list.length === 1 || (d < 0 && a.currentTime > 3)) {
      a.currentTime = 0;
      a.play().catch(() => setPlaying(false));
      return;
    }
    autoPlay.current = true;
    setIndex((index + d + list.length) % list.length);
  };

  return (
    <div className="vinyl">
      <audio
        ref={audio}
        src={song.src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => go(1)}
      />
      <div className="vinyl-row">
        <button className="vinyl-btn" onClick={() => go(-1)} aria-label="Previous / restart">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
        </button>
        <button className={`vinyl-disc ${playing ? "spinning" : ""}`} onClick={play} aria-pressed={playing} aria-label={playing ? `Pause ${song.title}` : `Play ${song.title}`} title={playing ? "Pause" : "Play"}>
          <img src={song.cover} alt="" draggable={false} />
          <span className="vinyl-hole" aria-hidden="true" />
          <span className="vinyl-play" aria-hidden="true">
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            )}
          </span>
        </button>
        <button className="vinyl-btn" onClick={() => go(1)} aria-label="Next">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
        </button>
      </div>
      <p className="vinyl-title">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
        <span>{song.title}</span>
      </p>
      <p className="vinyl-artist">{song.artist}</p>
    </div>
  );
}

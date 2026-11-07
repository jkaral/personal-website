"use client";

import { useEffect, useRef, useState } from "react";

// A small vinyl record that controls Spotify's official embedded player (Spotify iFrame API).
// The music itself streams from Spotify (full track for logged-in listeners, a preview
// otherwise); the record spins while it's playing. Songs come from `music` in content/site.js.

let apiPromise;
function loadSpotifyAPI() {
  if (typeof window === "undefined") return Promise.reject();
  if (window.__spotifyIFrameAPI) return Promise.resolve(window.__spotifyIFrameAPI);
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      window.onSpotifyIframeApiReady = (api) => {
        window.__spotifyIFrameAPI = api;
        resolve(api);
      };
      const s = document.createElement("script");
      s.src = "https://open.spotify.com/embed/iframe-api/v1";
      s.async = true;
      document.body.appendChild(s);
    });
  }
  return apiPromise;
}

export default function VinylPlayer({ songs = [] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false); // show the Spotify strip once music has been started
  const mount = useRef(null);
  const controller = useRef(null);
  const song = songs[index];

  useEffect(() => {
    if (!song) return;
    let cancelled = false;
    loadSpotifyAPI().then((api) => {
      if (cancelled || !mount.current || controller.current) return;
      api.createController(
        mount.current,
        { uri: `spotify:track:${song.spotifyId}`, width: "100%", height: 80, theme: "dark" },
        (c) => {
          controller.current = c;
          c.addListener("playback_update", (e) => setPlaying(!e.data.isPaused));
        }
      );
    });
    return () => {
      cancelled = true;
    };
    // the controller is created once; song changes go through loadUri below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!song) return null;

  const play = () => {
    setStarted(true);
    controller.current?.togglePlay();
  };
  const go = (d) => {
    const next = (index + d + songs.length) % songs.length;
    const c = controller.current;
    if (!c) return;
    if (next === index) {
      c.seek(0); // only one song: restart it
      c.resume();
    } else {
      setIndex(next);
      c.loadUri(`spotify:track:${songs[next].spotifyId}`);
      c.play();
    }
    setStarted(true);
  };

  return (
    <div className="vinyl">
      <div className="vinyl-row">
        <button className="vinyl-btn" onClick={() => go(-1)} aria-label="Previous / restart">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
        </button>
        <div className={`vinyl-disc ${playing ? "spinning" : ""}`}>
          <img src={song.cover} alt={`${song.title} cover`} />
          <span className="vinyl-hole" aria-hidden="true" />
          <button className="vinyl-play" onClick={play} aria-label={playing ? "Pause" : "Play"}>
            {playing ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
        </div>
        <button className="vinyl-btn" onClick={() => go(1)} aria-label="Next">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
        </button>
      </div>
      <p className="vinyl-title">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
        <span>{song.title}</span>
      </p>
      <p className="vinyl-artist">{song.artist}</p>
      {/* Spotify's own player (required for playback); revealed once music starts */}
      <div className={`vinyl-spotify ${started ? "show" : ""}`}>
        <div ref={mount} />
      </div>
    </div>
  );
}

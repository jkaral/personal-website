"use client";

import { useEffect, useRef, useState } from "react";

// A YouTube clip that behaves like a silent, looping moving image:
//  - muted autoplay, no controls, no clicks, captions switched off
//  - a still frame covers the player until it's actually playing, so YouTube's
//    loading banner/title never shows
//  - `segments`: [[start, end], ...] in seconds, played in order like edited cuts,
//    then back to the first. A quick dip to black hides each jump.

let apiPromise;
function loadYouTubeAPI() {
  if (typeof window === "undefined") return Promise.reject();
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        resolve(window.YT);
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.head.appendChild(s);
    });
  }
  return apiPromise;
}

function captionsOff(player) {
  try {
    player.unloadModule("captions");
    player.unloadModule("cc");
    player.setOption("captions", "track", {});
  } catch {}
}

export default function YouTubeLoop({ id, segments, title }) {
  const mount = useRef(null);
  const root = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [cut, setCut] = useState(false);
  const [poster, setPoster] = useState(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`);
  const segKey = JSON.stringify(segments || []);

  useEffect(() => {
    const segs = segments && segments.length ? segments : [[0, null]];
    let player;
    let timer;
    let cutTimer;
    let cancelled = false;
    let idx = 0;
    let seekingUntil = 0; // ignore the timer briefly after a jump

    const jumpTo = (i) => {
      idx = i;
      if (root.current) root.current.dataset.segment = String(idx + 1); // which segment is playing
      setCut(true);
      clearTimeout(cutTimer);
      cutTimer = setTimeout(() => !cancelled && setCut(false), 700); // fallback
      seekingUntil = performance.now() + 700;
      player.seekTo(segs[idx][0], true);
      player.playVideo();
    };

    loadYouTubeAPI().then((YT) => {
      if (cancelled || !mount.current) return;
      player = new YT.Player(mount.current, {
        host: "https://www.youtube-nocookie.com",
        videoId: id,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3,
          cc_load_policy: 0,
          modestbranding: 1,
          start: Math.floor(segs[0][0]),
        },
        events: {
          onReady: (e) => {
            e.target.mute();
            captionsOff(e.target);
            e.target.seekTo(segs[0][0], true);
            e.target.playVideo();
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              captionsOff(e.target);
              setTimeout(() => {
                if (cancelled) return;
                setPlaying(true);
                setCut(false);
              }, 160);
            }
            if (e.data === YT.PlayerState.ENDED) jumpTo(0);
          },
        },
      });

      timer = setInterval(() => {
        if (!player || !player.getCurrentTime || performance.now() < seekingUntil) return;
        const t = player.getCurrentTime();
        const [s, e] = segs[idx];
        const end = e ?? (player.getDuration ? player.getDuration() - 0.4 : Infinity);
        if (t >= end - 0.12) jumpTo((idx + 1) % segs.length); // next segment (or back to the first)
        else if (t < s - 0.5) jumpTo(idx); // drifted before the segment: snap back in
      }, 100);
    });

    return () => {
      cancelled = true;
      clearInterval(timer);
      clearTimeout(cutTimer);
      try {
        player && player.destroy();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, segKey]);

  return (
    <div ref={root} className="yt-loop" aria-label={title} role="img" data-segment="1">
      <div className="yt-frame">
        <div ref={mount} />
      </div>
      <span className={`yt-cut ${cut ? "on" : ""}`} aria-hidden="true" />
      <img
        className={`yt-poster ${playing ? "hide" : ""}`}
        src={poster}
        alt=""
        onError={() => setPoster(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`)}
      />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

// Interactive banner collage, Figma style:
//  - click an item to select it (shift-click adds to the selection)
//  - drag to move, corner/edge handles to resize, the round handle to rotate
//  - drag on empty space to box-select several items
//  - Esc or clicking empty space clears the selection; "Reset" restores the layout
// Positions live in memory only, so every visitor starts from the default layout.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

// Keep an item fully inside the banner (its rotated outline included): returns corrected x / y / w.
function keepInside(it, W, H) {
  const ratio = it.ratio || 1;
  const rad = ((it.r || 0) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad));
  let w = it.w;
  let wPx = (w / 100) * W;
  let hPx = wPx * ratio;
  // rotated bounding box
  let bw = wPx * cos + hPx * sin;
  let bh = wPx * sin + hPx * cos;
  // too big to fit? shrink until it does
  const fit = Math.min(1, W / bw, H / bh);
  if (fit < 1) {
    w *= fit; wPx *= fit; hPx *= fit; bw *= fit; bh *= fit;
  }
  let cx = (it.x / 100) * W + wPx / 2;
  let cy = (it.y / 100) * H + hPx / 2;
  cx = clamp(cx, bw / 2, W - bw / 2);
  cy = clamp(cy, bh / 2, H - bh / 2);
  return { w, x: ((cx - wPx / 2) / W) * 100, y: ((cy - hPx / 2) / H) * 100 };
}

function initial(items) {
  return items.map((it, i) => ({ ...it, id: i, z: i + 1 }));
}

export default function BannerCollage({ handle, items: source }) {
  const [items, setItems] = useState(() => initial(source));
  const [selected, setSelected] = useState([]); // ids
  const [marquee, setMarquee] = useState(null); // {x, y, w, h} in px
  const [moved, setMoved] = useState(false);
  const boxRef = useRef(null);
  const action = useRef(null);
  const zTop = useRef(source.length + 1);

  const rect = () => boxRef.current.getBoundingClientRect();

  // geometry helpers (px) for an item
  const geom = useCallback((it) => {
    const r = rect();
    const w = (it.w / 100) * r.width;
    const h = w * (it.ratio || 1);
    const x = (it.x / 100) * r.width;
    const y = (it.y / 100) * r.height;
    return { x, y, w, h, cx: r.left + x + w / 2, cy: r.top + y + h / 2, box: r };
  }, []);

  const bringToFront = (ids) =>
    setItems((list) => list.map((it) => (ids.includes(it.id) ? { ...it, z: ++zTop.current } : it)));

  // ---- start interactions ----
  function onItemDown(e, id) {
    if (e.button !== 0) return;
    e.stopPropagation();
    let sel = selected;
    if (e.shiftKey) sel = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
    else if (!selected.includes(id)) sel = [id];
    setSelected(sel);
    bringToFront(sel);
    action.current = {
      type: "move",
      sx: e.clientX,
      sy: e.clientY,
      start: Object.fromEntries(items.filter((it) => sel.includes(it.id)).map((it) => [it.id, { x: it.x, y: it.y }])),
    };
    boxRef.current.setPointerCapture(e.pointerId);
  }

  function onHandleDown(e, it, kind) {
    e.stopPropagation();
    e.preventDefault();
    const g = geom(it);
    action.current =
      kind === "rotate"
        ? { type: "rotate", id: it.id, cx: g.cx, cy: g.cy, a0: Math.atan2(e.clientY - g.cy, e.clientX - g.cx), r0: it.r || 0 }
        : { type: "resize", id: it.id, cx: g.cx, cy: g.cy, d0: Math.hypot(e.clientX - g.cx, e.clientY - g.cy) || 1, it0: { ...it }, g0: g };
    boxRef.current.setPointerCapture(e.pointerId);
  }

  function onCanvasDown(e) {
    if (e.button !== 0) return;
    if (!e.shiftKey) setSelected([]);
    if (e.pointerType === "touch") return; // let touch users scroll the page
    const r = rect();
    action.current = { type: "marquee", ox: e.clientX - r.left, oy: e.clientY - r.top, base: e.shiftKey ? selected : [] };
    boxRef.current.setPointerCapture(e.pointerId);
  }

  // ---- move ----
  function onMove(e) {
    const a = action.current;
    if (!a) return;
    const r = rect();
    if (a.type === "move") {
      const dx = ((e.clientX - a.sx) / r.width) * 100;
      const dy = ((e.clientY - a.sy) / r.height) * 100;
      setItems((list) =>
        list.map((it) =>
          a.start[it.id] ? { ...it, ...keepInside({ ...it, x: a.start[it.id].x + dx, y: a.start[it.id].y + dy }, r.width, r.height) } : it
        )
      );
      setMoved(true);
    } else if (a.type === "rotate") {
      const ang = Math.atan2(e.clientY - a.cy, e.clientX - a.cx);
      let deg = a.r0 + ((ang - a.a0) * 180) / Math.PI;
      if (e.shiftKey) deg = Math.round(deg / 15) * 15; // snap like Figma
      setItems((list) => list.map((it) => (it.id === a.id ? { ...it, r: deg, ...keepInside({ ...it, r: deg }, r.width, r.height) } : it)));
      setMoved(true);
    } else if (a.type === "resize") {
      const d = Math.hypot(e.clientX - a.cx, e.clientY - a.cy);
      const scale = clamp(d / a.d0, 0.25, 4);
      const w = clamp(a.it0.w * scale, 5, 70);
      // keep the item centred where it was
      const wPx = (w / 100) * r.width;
      const hPx = wPx * (a.it0.ratio || 1);
      const x = ((a.cx - r.left - wPx / 2) / r.width) * 100;
      const y = ((a.cy - r.top - hPx / 2) / r.height) * 100;
      setItems((list) => list.map((it) => (it.id === a.id ? { ...it, ...keepInside({ ...it, w, x, y }, r.width, r.height) } : it)));
      setMoved(true);
    } else if (a.type === "marquee") {
      const x2 = e.clientX - r.left;
      const y2 = e.clientY - r.top;
      const m = { x: Math.min(a.ox, x2), y: Math.min(a.oy, y2), w: Math.abs(x2 - a.ox), h: Math.abs(y2 - a.oy) };
      setMarquee(m);
      const hit = items
        .filter((it) => {
          const g = geom(it);
          return g.x < m.x + m.w && g.x + g.w > m.x && g.y < m.y + m.h && g.y + g.h > m.y;
        })
        .map((it) => it.id);
      setSelected([...new Set([...a.base, ...hit])]);
    }
  }

  function onUp() {
    action.current = null;
    setMarquee(null);
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setSelected([]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function reset() {
    setItems(initial(source));
    setSelected([]);
    setMoved(false);
    zTop.current = source.length + 1;
  }

  return (
    <div
      ref={boxRef}
      className="collage"
      onPointerDown={onCanvasDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <StretchedHandle text={handle} />

      {items.map((it) => {
        const isSel = selected.includes(it.id);
        return (
          <div
            key={it.id}
            className={`collage-item ${isSel ? "selected" : ""} ${it.glow ? "glow" : ""}`}
            style={{
              left: `${it.x}%`,
              top: `${it.y}%`,
              width: `${it.w}%`,
              aspectRatio: `1 / ${it.ratio || 1}`,
              transform: `rotate(${it.r || 0}deg)`,
              zIndex: isSel ? 1000 + it.z : it.z,
            }}
            onPointerDown={(e) => onItemDown(e, it.id)}
          >
            <img src={it.src} alt="" draggable="false" />
            {isSel && (
              <>
                <span className="sel-box" />
                {selected.length === 1 && (
                  <>
                    {HANDLES.map((h) => (
                      <span key={h} className={`sel-handle h-${h}`} onPointerDown={(e) => onHandleDown(e, it, "resize")} />
                    ))}
                    <span className="sel-rotate-line" />
                    <span className="sel-rotate" onPointerDown={(e) => onHandleDown(e, it, "rotate")} aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                        <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" />
                      </svg>
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        );
      })}

      {marquee && (
        <span className="marquee" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />
      )}

      {moved && (
        <button className="collage-reset" onPointerDown={(e) => e.stopPropagation()} onClick={reset}>
          Reset
        </button>
      )}
    </div>
  );
}

// The giant @HANDLE, stretched vertically so the letters run from the banner's top edge to
// its bottom edge (same width as before). Uses the letters' exact ink bounds, measured with canvas.
function StretchedHandle({ text }) {
  const textRef = useRef(null);
  const [box, setBox] = useState(null); // { vb, width }

  useLayoutEffect(() => {
    const measure = () => {
      const el = textRef.current;
      if (!el) return;
      const cs = getComputedStyle(el);
      const SIZE = 200; // font size used for measuring/drawing inside the SVG
      const ctx = document.createElement("canvas").getContext("2d");
      ctx.font = `${cs.fontWeight} ${SIZE}px ${cs.fontFamily}`;
      if ("letterSpacing" in ctx) ctx.letterSpacing = `${SIZE * -0.04}px`;
      const m = ctx.measureText(text);
      const left = m.actualBoundingBoxLeft, right = m.actualBoundingBoxRight;
      const up = m.actualBoundingBoxAscent, down = m.actualBoundingBoxDescent;
      // display width: same as the old CSS size clamp(80px, 17vw, 240px)
      const fontPx = Math.min(240, Math.max(80, window.innerWidth * 0.17));
      setBox({ vb: `${-left} ${-up} ${left + right} ${up + down}`, width: ((left + right) / SIZE) * fontPx });
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text]);

  return (
    <svg
      className="banner-handle-svg"
      viewBox={box?.vb || "0 -150 1000 200"}
      preserveAspectRatio="none"
      style={{ width: box ? `${box.width}px` : "75%" }}
      aria-hidden="true"
    >
      <text ref={textRef} x="0" y="0" fontSize="200" style={{ fontFamily: "var(--font-sans), sans-serif", fontWeight: 900, letterSpacing: "-0.04em" }}>
        {text}
      </text>
    </svg>
  );
}

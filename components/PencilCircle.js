// A hand-drawn, slightly wobbly loop (like a quick pencil circle) laid over a photo.
// It "draws itself" when its section scrolls into view (see .pencil in globals.css).
//
// Props are percentages of the photo frame:
//   x, y  = centre of the loop      w, h = width / height of the loop
//   r     = tilt in degrees         color = stroke colour      seed = changes the wobble
//   aspect = photo height / width (so the loop isn't stretched)

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// points around an ellipse that overshoots its start, with gentle radius wobble
export function loopPoints(cx, cy, rx, ry, seed) {
  const rand = rng(seed);
  const turns = 1.12; // a little past one full loop, like a real pen stroke
  const n = 48;
  const start = -Math.PI * 0.62 + rand() * 0.3;
  const ph1 = rand() * 6.28, ph2 = rand() * 6.28;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = start + t * turns * Math.PI * 2;
    const wob = 1 + 0.035 * Math.sin(3 * a + ph1) + 0.02 * Math.sin(5 * a + ph2) + (rand() - 0.5) * 0.012;
    const spiral = 1 + 0.06 * (t - 0.5); // ends slightly outside where it began
    pts.push([cx + Math.cos(a) * rx * wob * spiral, cy + Math.sin(a) * ry * wob * spiral]);
  }
  return pts;
}

// smooth curve through points (Catmull-Rom -> cubic Bezier)
export function toPath(p) {
  let d = `M${p[0][0].toFixed(2)},${p[0][1].toFixed(2)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

export default function PencilCircle({ x, y, w, h, r = 0, color = "#ff6a1a", seed = 7, aspect = 0.75 }) {
  // viewBox keeps the true aspect of the loop's box (aspect = photo height / width) so it isn't stretched
  const vbW = 100;
  const vbH = (100 * (h * aspect)) / w;
  const pad = 6;
  const main = toPath(loopPoints(vbW / 2, vbH / 2, vbW / 2 - pad, vbH / 2 - pad, seed));
  const ghost = toPath(loopPoints(vbW / 2 + 0.8, vbH / 2 - 0.6, vbW / 2 - pad - 1.2, vbH / 2 - pad + 0.8, seed + 11));
  const fid = `pencil-grain-${seed}`;
  // Line thickness in viewBox units, scaled so every loop gets the same visual weight
  // (about 5.5px on a ~680px-wide photo) no matter how big the loop is.
  const mainW = (81 / w).toFixed(2);
  const ghostW = (41 / w).toFixed(2);

  return (
    <svg
      className="pencil"
      viewBox={`0 0 ${vbW} ${vbH.toFixed(2)}`}
      aria-hidden="true"
      style={{ left: `${x - w / 2}%`, top: `${y - h / 2}%`, width: `${w}%`, height: `${h}%`, transform: `rotate(${r}deg)`, "--pencil": color }}
    >
      <defs>
        <filter id={fid} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" />
        </filter>
      </defs>
      <g filter={`url(#${fid})`}>
        <path className="pencil-ghost" d={ghost} pathLength="1" strokeWidth={ghostW} />
        <path className="pencil-main" d={main} pathLength="1" strokeWidth={mainW} />
      </g>
    </svg>
  );
}

import { useEffect, useRef } from "react";

// A survey map that breathes: the height field under the paper is five drifting hills and hollows
// plus a long swell, and its contour lines are traced every frame with marching squares.
// Change these: ink colour, contour gap (in field units), cell size (smaller is smoother, costlier), speed.
const INK = "59,58,54"; // rgb of the lines
const ACCENT = "178,85,46"; // one rust contour
const STEP = 0.06;
const CELL = 14;
const SPEED = 0.1;
// [x, y, radius, height, phase] as fractions of the box; negative height is a hollow
const HILLS = [[0.74, 0.4, 0.3, 1, 0], [0.32, 0.86, 0.26, 0.8, 1.7], [0.98, 0.95, 0.2, 0.7, 3.1], [0.5, 0.15, 0.22, -0.6, 4.4], [0.08, 0.35, 0.2, -0.5, 2.2]];
// Which cell edges (0 top, 1 right, 2 bottom, 3 left) each of the 16 corner cases joins.
const SEGMENTS = [[], [[3, 2]], [[2, 1]], [[3, 1]], [[0, 1]], [[3, 0], [2, 1]], [[0, 2]], [[3, 0]], [[3, 0]], [[0, 2]], [[0, 1], [3, 2]], [[0, 1]], [[3, 1]], [[2, 1]], [[3, 2]], []];

export default function TopographicContourWaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let onScreen = true;
    const born = performance.now();
    const cleanups: (() => void)[] = [];
    let field = new Float32Array(0);
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const cols = Math.ceil(w / CELL) + 2;
      const rows = Math.ceil(h / CELL) + 2;
      if (field.length !== cols * rows) field = new Float32Array(cols * rows);
      const m = Math.max(w, h * 1.4);
      const hills = HILLS.map(([hx, hy, hr, hh, ph]) => [
        w * (hx + 0.06 * Math.sin(t * SPEED + ph)),
        h * (hy + 0.08 * Math.cos(t * SPEED * 0.8 + ph * 1.3)),
        1 / Math.pow(m * hr * (1 + 0.15 * Math.sin(t * SPEED * 1.3 + ph)), 2),
        hh,
      ]);
      for (let j = 0; j < rows; j++) {
        const y = (j - 1) * CELL;
        for (let i = 0; i < cols; i++) {
          const x = (i - 1) * CELL;
          let v = 0.22 * Math.sin(x * 0.005 + t * SPEED * 0.9) * Math.cos(y * 0.007 - t * SPEED * 0.6);
          for (const [cx, cy, inv, hh] of hills) v += hh * Math.exp(-((x - cx) * (x - cx) + (y - cy) * (y - cy)) * inv);
          field[j * cols + i] = v;
        }
      }
      const pt = [0, 0, 0, 0, 0, 0, 0, 0];
      for (let level = -16; level <= 20; level++) {
        const v = level * STEP + 0.01;
        ctx.beginPath();
        for (let j = 0; j < rows - 1; j++) {
          for (let i = 0; i < cols - 1; i++) {
            const a = field[j * cols + i];
            const b = field[j * cols + i + 1];
            const c = field[(j + 1) * cols + i + 1];
            const d = field[(j + 1) * cols + i];
            const k = (a > v ? 8 : 0) | (b > v ? 4 : 0) | (c > v ? 2 : 0) | (d > v ? 1 : 0);
            if (k === 0 || k === 15) continue;
            const x0 = (i - 1) * CELL;
            const y0 = (j - 1) * CELL;
            pt[0] = x0 + (CELL * (v - a)) / (b - a); pt[1] = y0;
            pt[2] = x0 + CELL; pt[3] = y0 + (CELL * (v - b)) / (c - b);
            pt[4] = x0 + (CELL * (v - d)) / (c - d); pt[5] = y0 + CELL;
            pt[6] = x0; pt[7] = y0 + (CELL * (v - a)) / (d - a);
            for (const [e1, e2] of SEGMENTS[k]) {
              ctx.moveTo(pt[e1 * 2], pt[e1 * 2 + 1]);
              ctx.lineTo(pt[e2 * 2], pt[e2 * 2 + 1]);
            }
          }
        }
        const rust = level === 9;
        const index = level % 5 === 0;
        ctx.strokeStyle = rust ? "rgba(" + ACCENT + ",.7)" : "rgba(" + INK + "," + (index ? 0.5 : 0.24) + ")";
        ctx.lineWidth = rust ? 1.4 : index ? 1.15 : 0.75;
        ctx.stroke();
      }
    };
    const now = () => 14 + (performance.now() - born) / 1000;
    const frame = () => {
      raf = 0;
      draw(now());
      if (onScreen && !reduce) raf = requestAnimationFrame(frame);
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(reduce ? 14 : now());
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    const io = new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      if (onScreen && !reduce && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      cleanups.forEach((c) => c());
    };
  }, []);
  return (
    <section className="relative isolate min-h-[640px] overflow-hidden bg-[#efe8dc]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(59,58,54,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,58,54,.05)_1px,transparent_1px)] [background-size:120px_120px]" />
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 [background:radial-gradient(55%_60%_at_22%_38%,rgba(239,232,220,.92),rgba(239,232,220,.55)_55%,transparent)]" />
      </div>
      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a3f20]">Ridgeway Survey Co.</p>
        <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight text-[#24221e] sm:text-6xl">Land surveys drawn to the centimetre.</h1>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-[#4a463e]">Boundary, topographic and measured building surveys for architects, farms and self-builders.</p>
        <a href="#" className="mt-8 inline-flex h-12 items-center rounded-sm bg-[#24221e] px-7 text-sm font-semibold text-[#f3ede2] transition hover:bg-[#3d3a33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24221e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe8dc]">Ask for a quote</a>
      </div>
    </section>
  );
}

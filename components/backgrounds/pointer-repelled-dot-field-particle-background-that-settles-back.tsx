import { useEffect, useRef } from "react";

// Pointer-Repelled Dot Field: a canvas 2D particle background behind a small hero.
// Sprites are drawn once to small offscreen canvases, motion is scaled by frame
// time, the loop stops off screen, and reduced motion gets one settled frame.
// Values worth changing:
const SPACING = 20; // pixels between resting dots
const RADIUS = 120; // how far the pointer pushes, in pixels
const INK = "40,39,36"; // resting dot colour, as r,g,b
const HEAT = "194,72,20"; // colour of dots while they are pushed
const SPRING = 16; // how quickly dots settle home: 8 is lazy, 30 is snappy
const WARMUP = 0; // frames simulated before the first paint (0 keeps the field at rest)

type Ptr = { x: number; y: number; on: boolean };
type Scene = { update: (dt: number, t: number) => void; draw: (c: CanvasRenderingContext2D, t: number) => void };

function glow(size: number, rgb: string, stops: number[][]): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const r = size / 2;
  const grd = g.createRadialGradient(r, r, 0, r, r, r);
  for (const [o, a] of stops) grd.addColorStop(o, `rgba(${rgb},${a})`);
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return c;
}

function mount(canvas: HTMLCanvasElement, root: HTMLElement): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ptr: Ptr = { x: -1e4, y: -1e4, on: false };
  let w = 0, h = 0, t = 0, last = 0, raf = 0, seen = true;
  let scene: Scene | null = null;
  const fit = () => {
    const r = canvas.getBoundingClientRect();
    if (scene && Math.abs(r.width - w) < 1 && Math.abs(r.height - h) < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = Math.max(1, r.width);
    h = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scene = createScene(w, h, ptr);
    for (let i = 0; i < WARMUP; i++) { t += 1 / 30; scene.update(1 / 30, t); }
    scene.draw(ctx, t);
  };
  const frame = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    t += dt;
    if (scene) { scene.update(dt, t); scene.draw(ctx, t); }
    raf = requestAnimationFrame(frame);
  };
  const run = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    if (!still && seen && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
  };
  const move = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    ptr.x = e.clientX - r.left;
    ptr.y = e.clientY - r.top;
    ptr.on = true;
  };
  const leave = () => { ptr.on = false; };
  const ro = new ResizeObserver(fit);
  ro.observe(canvas);
  const io = new IntersectionObserver((es) => { seen = es[es.length - 1].isIntersecting; run(); });
  io.observe(canvas);
  document.addEventListener("visibilitychange", run);
  root.addEventListener("pointermove", move);
  root.addEventListener("pointerleave", leave);
  fit();
  run();
  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    document.removeEventListener("visibilitychange", run);
    root.removeEventListener("pointermove", move);
    root.removeEventListener("pointerleave", leave);
  };
}

function createScene(w: number, h: number, ptr: Ptr): Scene {
  const ink = glow(16, INK, [[0, 1], [0.4, 1], [0.55, 0]]);
  const heat = glow(16, HEAT, [[0, 1], [0.4, 1], [0.55, 0]]);
  const ps: { hx: number; hy: number; x: number; y: number; vx: number; vy: number; z: number }[] = [];
  for (let y = SPACING / 2; y < h; y += SPACING) {
    for (let x = SPACING / 2; x < w; x += SPACING) {
      const hx = x + (Math.random() - 0.5) * SPACING * 0.18, hy = y + (Math.random() - 0.5) * SPACING * 0.18;
      ps.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, z: Math.random() });
    }
  }
  const src = { x: 0, y: 0 };
  return {
    update(dt, t) {
      // Without a real pointer a slow invisible one wanders, so the field is never still.
      if (ptr.on) { src.x = ptr.x; src.y = ptr.y; }
      else { src.x = w * (0.62 + 0.3 * Math.sin(t * 0.29)); src.y = h * (0.5 + 0.36 * Math.sin(t * 0.47 + 1)); }
      const damp = Math.exp(-7 * dt), R2 = RADIUS * RADIUS;
      for (const p of ps) {
        const dx = p.x - src.x, dy = p.y - src.y, d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2), f = (1 - d / RADIUS) ** 2 * 2600 * (0.5 + p.z);
          p.vx += (dx / d) * f * dt;
          p.vy += (dy / d) * f * dt;
        }
        p.vx = (p.vx + (p.hx - p.x) * SPRING * dt) * damp;
        p.vy = (p.vy + (p.hy - p.y) * SPRING * dt) * damp;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    },
    draw(c) {
      c.clearRect(0, 0, w, h);
      for (const p of ps) {
        const off = Math.min(1, (Math.abs(p.x - p.hx) + Math.abs(p.y - p.hy)) / 16);
        const s = 3.2 + p.z * 2.8;
        c.globalAlpha = 0.3 + p.z * 0.35;
        c.drawImage(ink, p.x - s / 2, p.y - s / 2, s, s);
        if (off > 0.05) {
          c.globalAlpha = off;
          c.drawImage(heat, p.x - s / 2, p.y - s / 2, s, s);
        }
      }
      c.globalAlpha = 1;
    },
  };
}

export default function PointerRepelledDotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !rootRef.current) return;
    return mount(canvasRef.current, rootRef.current);
  }, []);

  return (
    <section ref={rootRef} className="prs-bg relative isolate flex min-h-[560px] items-center overflow-hidden px-6 py-20 sm:px-12">
      <style>{`.prs-bg{background:linear-gradient(180deg, #efeeea 0%, #e7e5df 100%)}.prs-scrim{background:radial-gradient(48% 70% at 20% 50%, rgba(239,238,234,0.95) 0%, rgba(239,238,234,0) 78%)}`}</style>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div aria-hidden="true" className="prs-scrim pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9a3a10]">Plinth Architecture Studio</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-[#1c1b19] sm:text-5xl">Rooms that move with the people inside them.</h2>
          <p className="mt-5 text-lg leading-relaxed text-[#47453f]">Additions, renovations and new homes planned around how your household really lives, from first sketch to handover.</p>
          <a
            href="#"
            className="mt-8 inline-flex h-12 items-center rounded-md bg-[#1c1b19] px-6 text-sm font-semibold text-[#f5f4f0] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c1b19] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efeeea]"
          >
            Start a project
          </a>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef } from "react";

// Out-of-Focus Bokeh Lights: a canvas 2D particle background behind a small hero.
// Sprites are drawn once to small offscreen canvases, motion is scaled by frame
// time, the loop stops off screen, and reduced motion gets one settled frame.
// Values worth changing:
const LIGHTS_PER_MPX = 48; // out-of-focus lights per million pixels
const COLOURS = ["255,186,104", "255,226,182", "238,142,118", "150,196,214"]; // light colours, as r,g,b
const DRIFT = 1; // how fast the lights float
const FOCUS_BREATH = 1; // how much the lens seems to breathe in and out of focus
const WARMUP = 1; // frames simulated before the first paint

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
  const ro = new ResizeObserver(fit);
  ro.observe(canvas);
  const io = new IntersectionObserver((es) => { seen = es[es.length - 1].isIntersecting; run(); });
  io.observe(canvas);
  document.addEventListener("visibilitychange", run);
  fit();
  run();
  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    document.removeEventListener("visibilitychange", run);
  };
}

function createScene(w: number, h: number, _ptr: Ptr): Scene {
  const area = (w * h) / 1e6;
  // Real lens bokeh is a flat disc with a slightly brighter rim, not a soft blob.
  const disc = (rgb: string, edge: number) => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 62);
    grd.addColorStop(0, `rgba(${rgb},0.30)`);
    grd.addColorStop(0.78, `rgba(${rgb},0.36)`);
    grd.addColorStop(0.93 - edge, `rgba(${rgb},0.62)`);
    grd.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grd;
    g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill();
    return c;
  };
  const sharp = COLOURS.map((rgb) => disc(rgb, 0));
  const soft = COLOURS.map((rgb) => glow(128, rgb, [[0, 0.3], [0.6, 0.22], [1, 0]]));
  const ps = Array.from({ length: Math.max(14, Math.min(90, Math.round(area * LIGHTS_PER_MPX))) }, () => {
    const z = Math.random();
    return { x: Math.random() * w, y: h * (0.15 + Math.random() * 0.9), z, k: Math.floor(Math.random() * COLOURS.length), s: Math.random() * 99, a: 0.35 + Math.random() * 0.55 };
  }).sort((a, b) => a.z - b.z);
  return {
    update(dt, t) {
      for (const p of ps) {
        p.x += (3 + p.z * 9) * DRIFT * dt;
        p.y += Math.sin(t * 0.2 + p.s) * 3 * DRIFT * dt;
        if (p.x > w + 120) { p.x = -120; p.y = h * (0.15 + Math.random() * 0.9); }
      }
    },
    draw(c, t) {
      c.clearRect(0, 0, w, h);
      c.globalCompositeOperation = "lighter";
      const focus = Math.sin(t * 0.18) * FOCUS_BREATH;
      for (const p of ps) {
        const s = (24 + p.z * 120) * (1 + focus * 0.1 * p.z);
        c.globalAlpha = p.a * (0.55 + 0.45 * Math.sin(t * 0.5 + p.s)) * (1 - p.z * 0.35);
        c.drawImage(p.z > 0.7 ? soft[p.k] : sharp[p.k], p.x - s / 2, p.y - s / 2, s, s);
      }
      c.globalAlpha = 1;
      c.globalCompositeOperation = "source-over";
    },
  };
}

export default function OutOfFocusBokehLights() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !rootRef.current) return;
    return mount(canvasRef.current, rootRef.current);
  }, []);

  return (
    <section ref={rootRef} className="bkh-bg relative isolate flex min-h-[560px] items-center overflow-hidden px-6 py-20 sm:px-12">
      <style>{`.bkh-bg{background:radial-gradient(80% 60% at 50% 120%, #3a2a20 0%, rgba(58,42,32,0) 70%), linear-gradient(180deg, #0c131d 0%, #141c28 55%, #1d1c22 100%)}.bkh-scrim{background:radial-gradient(45% 55% at 50% 50%, rgba(12,19,29,0.6) 0%, rgba(12,19,29,0) 80%)}`}</style>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div aria-hidden="true" className="bkh-scrim pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#f0c992]">Lamplight Wedding Films</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-[#fdf3e7] sm:text-5xl">The first dance, the toasts and the light after sunset.</h2>
          <p className="mt-5 text-lg leading-relaxed text-[#dccab6]">Two filmmakers, natural sound and a finished film you will want to watch again every anniversary.</p>
          <a
            href="#"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-[#f3c68b] px-6 text-sm font-semibold text-[#1d140c] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdf3e7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141b26]"
          >
            Check our availability
          </a>
        </div>
      </div>
    </section>
  );
}

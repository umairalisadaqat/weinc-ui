import { useEffect, useRef } from "react";

// Wind-Blown Sand over Dunes: a canvas 2D particle background behind a small hero.
// Sprites are drawn once to small offscreen canvases, motion is scaled by frame
// time, the loop stops off screen, and reduced motion gets one settled frame.
// Values worth changing:
const GRAINS_PER_MPX = 1000; // blowing grains per million pixels
const GRAIN = "128,88,44"; // grain colour, as r,g,b
const DUNES = ["#e6c99a", "#d9b47c", "#c99c62"]; // far, middle and near dune colours
const WIND = 1; // wind strength: 0.5 for a breeze, 2 for a sandstorm
const WARMUP = 60; // frames simulated before the first paint

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
  // Dune ridges as sums of slow waves; the nearest one is also the ground the grains skim.
  const ridge = (x: number, i: number) => h * (0.62 + i * 0.1) + Math.sin(x / w * 5.1 + i * 2) * h * 0.05 + Math.sin(x / w * 11.7 + i) * h * 0.018;
  const dunes = document.createElement("canvas");
  dunes.width = Math.ceil(w);
  dunes.height = Math.ceil(h);
  const g = dunes.getContext("2d")!;
  DUNES.forEach((col, i) => {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(0, h);
    for (let x = 0; x <= w + 8; x += 8) g.lineTo(x, ridge(x, i));
    g.lineTo(w, h);
    g.fill();
    const shade = g.createLinearGradient(0, h * (0.6 + i * 0.1), 0, h);
    shade.addColorStop(0, "rgba(255,244,220,0.35)");
    shade.addColorStop(1, "rgba(120,80,40,0.12)");
    g.fillStyle = shade;
    g.fill();
  });
  const ps = Array.from({ length: Math.min(1400, Math.round(area * GRAINS_PER_MPX)) }, () => ({
    x: Math.random() * w, up: Math.random() ** 3 * h * 0.22, z: Math.random(), s: Math.random() * 99,
  }));
  let t0 = 0;
  const wind = (x: number) => (0.55 + 0.45 * Math.sin(x / w * 4 - t0 * 0.9)) * (0.7 + 0.3 * Math.sin(t0 * 0.21));
  return {
    update(dt, t) {
      t0 = t;
      for (const p of ps) {
        const near = Math.max(0, 1 - p.up / (h * 0.22));
        p.x += (60 + 260 * near) * (0.4 + p.z) * wind(p.x) * WIND * dt;
        p.up += Math.sin(t * 3 + p.s) * 10 * dt;
        if (p.up < 0) p.up = 0;
        if (p.x > w + 20) { p.x = -20; p.up = Math.random() ** 3 * h * 0.22; }
      }
    },
    draw(c) {
      c.clearRect(0, 0, w, h);
      c.globalAlpha = 1;
      c.drawImage(dunes, 0, 0, w, h);
      c.fillStyle = `rgb(${GRAIN})`;
      for (const p of ps) {
        const y = ridge(p.x, 2) - p.up - 2;
        const speed = wind(p.x);
        const len = 1.2 + p.z * 1.8 + speed * p.z * 10;
        c.globalAlpha = (0.18 + p.z * 0.5) * (0.5 + speed * 0.5);
        c.fillRect(p.x - len, y, len, 0.8 + p.z * 1.4);
      }
      c.globalAlpha = 1;
    },
  };
}

export default function WindBlownSandDunes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !rootRef.current) return;
    return mount(canvasRef.current, rootRef.current);
  }, []);

  return (
    <section ref={rootRef} className="snd-bg relative isolate flex min-h-[560px] items-center overflow-hidden px-6 py-20 sm:px-12">
      <style>{`.snd-bg{background:radial-gradient(60% 50% at 80% 0%, #fbf3e2 0%, rgba(251,243,226,0) 70%), linear-gradient(180deg, #f3e7cf 0%, #efdfc0 55%, #e7d0a6 100%)}`}</style>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7a4a17]">Dune Line Expeditions</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-[#2e2112] sm:text-5xl">Three nights in the dunes, guided by people who grew up there.</h2>
          <p className="mt-5 text-lg leading-relaxed text-[#5a4429]">Small groups, shaded camps and water carried for you. Routes shift with the wind every season.</p>
          <a
            href="#"
            className="mt-8 inline-flex h-12 items-center rounded-md bg-[#2e2112] px-6 text-sm font-semibold text-[#f6ead2] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2e2112] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3e7cf]"
          >
            View crossing dates
          </a>
        </div>
      </div>
    </section>
  );
}

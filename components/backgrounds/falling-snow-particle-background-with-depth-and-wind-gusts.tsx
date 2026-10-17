import { useEffect, useRef } from "react";

// Falling Snow with Depth and Gusts: a canvas 2D particle background behind a small hero.
// Sprites are drawn once to small offscreen canvases, motion is scaled by frame
// time, the loop stops off screen, and reduced motion gets one settled frame.
// Values worth changing:
const FLAKES_PER_MPX = 420; // snowfall density per million pixels
const SNOW = "238,243,250"; // flake colour, as r,g,b
const WIND = 1; // gust strength: 0 for still air, 2 for a blizzard
const FALL_SPEED = 1; // how fast flakes sink
const WARMUP = 150; // frames simulated before the first paint

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
  const n = Math.min(760, Math.round(((w * h) / 1e6) * FLAKES_PER_MPX));
  const crisp = glow(16, SNOW, [[0, 1], [0.4, 0.85], [1, 0]]);
  const soft = glow(64, SNOW, [[0, 0.55], [0.45, 0.22], [1, 0]]);
  const ps = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, z: Math.random() ** 1.4, s: Math.random() * 99 }));
  let gust = 0;
  return {
    update(dt, t) {
      // Wind is a mix of slow swells plus a rare, strong gust.
      const target = (Math.sin(t * 0.13) * 0.5 + Math.sin(t * 0.37 + 1.3) * 0.3 + Math.max(0, Math.sin(t * 0.11 - 1)) ** 6 * 2.4) * 46 * WIND;
      gust += (target - gust) * Math.min(1, dt * 0.9);
      for (const p of ps) {
        const depth = 0.25 + p.z * 1.25;
        p.y += (12 + p.z * 48) * FALL_SPEED * dt;
        p.x += (gust * depth + Math.sin(t * 0.7 + p.s) * (5 + p.z * 12)) * dt;
        if (p.y > h + 40) { p.y = -40; p.x = Math.random() * w; }
        if (p.x > w + 40) p.x -= w + 80; else if (p.x < -40) p.x += w + 80;
      }
    },
    draw(c) {
      c.clearRect(0, 0, w, h);
      for (const p of ps) {
        if (p.z > 0.9) {
          const s = 14 + (p.z - 0.9) * 280;
          c.globalAlpha = 0.5;
          c.drawImage(soft, p.x - s / 2, p.y - s / 2, s, s);
        } else {
          const s = 1.6 + p.z * 5.5;
          c.globalAlpha = 0.3 + p.z * 0.65;
          c.drawImage(crisp, p.x - s / 2, p.y - s / 2, s, s);
        }
      }
      c.globalAlpha = 1;
    },
  };
}

export default function FallingSnowDepthGusts() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !rootRef.current) return;
    return mount(canvasRef.current, rootRef.current);
  }, []);

  return (
    <section ref={rootRef} className="snw-bg relative isolate flex min-h-[560px] items-center overflow-hidden px-6 py-20 sm:px-12">
      <style>{`.snw-bg{background:radial-gradient(90% 60% at 50% 115%, #5b6878 0%, rgba(91,104,120,0) 70%), linear-gradient(180deg, #19212c 0%, #283342 60%, #3a4655 100%)}`}</style>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#cbd5e1]">Hollow Pine Lodge</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-[#f1f5f9] sm:text-5xl">Wake up to fresh snow and a fire already lit.</h2>
          <p className="mt-5 text-lg leading-relaxed text-[#cbd5e1]">Timber cabins with wood stoves, a cedar sauna and groomed trails that start at your door.</p>
          <a
            href="#"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-[#f8fafc] px-6 text-sm font-semibold text-[#1e293b] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1f5f9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f2833]"
          >
            Check winter dates
          </a>
        </div>
      </div>
    </section>
  );
}

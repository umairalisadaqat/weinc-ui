import { useEffect, useRef } from "react";

// Parallax Starfield with Slow Drift: a canvas 2D particle background behind a small hero.
// Sprites are drawn once to small offscreen canvases, motion is scaled by frame
// time, the loop stops off screen, and reduced motion gets one settled frame.
// Values worth changing:
const STARS_PER_MPX = 700; // moving stars per million pixels
const TINTS = ["206,220,255", "255,246,232", "255,216,172", "186,206,255"]; // star colours, hot to cool
const DRIFT = 1; // sideways drift speed: 0 to hold still, 3 for a slow pan
const TWINKLE = 1; // twinkle strength, 0 to 1
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
  const sprites = TINTS.map((rgb) => glow(24, rgb, [[0, 1], [0.2, 0.85], [0.45, 0.15], [1, 0]]));
  const halos = TINTS.map((rgb) => glow(64, rgb, [[0, 0.35], [0.3, 0.08], [1, 0]]));
  // A faint band of the galaxy, drawn once and tiled sideways so it can drift forever.
  const band = document.createElement("canvas");
  band.width = Math.ceil(w);
  band.height = Math.ceil(h);
  const g = band.getContext("2d")!;
  const centre = (x: number) => h * 0.42 + Math.sin((x / w) * Math.PI * 2) * h * 0.16;
  const cloud = glow(128, "150,160,200", [[0, 0.09], [0.5, 0.03], [1, 0]]);
  const warmCloud = glow(128, "200,160,140", [[0, 0.06], [1, 0]]);
  for (let i = 0; i < 20 + w * 0.04; i++) {
    const x = Math.random() * w, s = 120 + Math.random() * 260;
    const y = centre(x) + (Math.random() - 0.5) * h * 0.25;
    for (const dx of [-w, 0, w]) g.drawImage(i % 4 ? cloud : warmCloud, x + dx - s / 2, y - s / 2, s, s * 0.6);
  }
  for (let i = 0; i < area * 2600; i++) {
    const x = Math.random() * w;
    const y = centre(x) + (Math.random() + Math.random() + Math.random() - 1.5) * h * 0.2;
    g.globalAlpha = 0.15 + Math.random() * 0.45;
    g.drawImage(sprites[i % 4], x - 1.2, y - 1.2, 2.4, 2.4);
  }
  const ps = Array.from({ length: Math.min(1100, Math.round(area * STARS_PER_MPX)) }, () => {
    const z = Math.random() ** 2.2;
    return { x: Math.random() * w, y: Math.random() * h, z, k: Math.floor(Math.random() * 4), s: Math.random() * 99, big: z > 0.93 };
  });
  let bx = 0;
  return {
    update(dt) {
      bx = (bx + 1.2 * DRIFT * dt) % w;
      for (const p of ps) {
        p.x -= (2 + p.z * 16) * DRIFT * dt;
        if (p.x < -10) { p.x = w + 10; p.y = Math.random() * h; }
      }
    },
    draw(c, t) {
      c.clearRect(0, 0, w, h);
      c.globalAlpha = 1;
      c.drawImage(band, -bx, 0, w, h);
      c.drawImage(band, w - bx, 0, w, h);
      c.globalCompositeOperation = "lighter";
      for (const p of ps) {
        const tw = 1 - TWINKLE * (0.5 - 0.5 * Math.sin(t * (1.5 + p.s % 3) + p.s)) * (1 - p.z) * 0.8;
        const s = 1.6 + p.z * 4.5;
        c.globalAlpha = (0.35 + p.z * 0.65) * tw;
        c.drawImage(sprites[p.k], p.x - s / 2, p.y - s / 2, s, s);
        if (p.big) c.drawImage(halos[p.k], p.x - 14, p.y - 14, 28, 28);
      }
      c.globalAlpha = 1;
      c.globalCompositeOperation = "source-over";
    },
  };
}

export default function ParallaxStarfieldSlowDrift() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !rootRef.current) return;
    return mount(canvasRef.current, rootRef.current);
  }, []);

  return (
    <section ref={rootRef} className="sfp-bg relative isolate flex min-h-[560px] items-center overflow-hidden px-6 py-20 sm:px-12">
      <style>{`.sfp-bg{background:linear-gradient(180deg, #03050b 0%, #070b17 60%, #0c1222 100%)}.sfp-scrim{background:radial-gradient(50% 70% at 20% 50%, rgba(4,6,12,0.55) 0%, rgba(4,6,12,0) 80%)}`}</style>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div aria-hidden="true" className="sfp-scrim pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#e9dcb8]">Blackrock Dark Sky Tours</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-[#eef2ff] sm:text-5xl">Leave the city lights two hours behind.</h2>
          <p className="mt-5 text-lg leading-relaxed text-[#bac3dc]">Telescope evenings on a protected ridge, with hot drinks, reclining chairs and a guide who can name what you are looking at.</p>
          <a
            href="#"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-[#f1e7cf] px-6 text-sm font-semibold text-[#0b1020] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eef2ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060a14]"
          >
            See open nights
          </a>
        </div>
      </div>
    </section>
  );
}

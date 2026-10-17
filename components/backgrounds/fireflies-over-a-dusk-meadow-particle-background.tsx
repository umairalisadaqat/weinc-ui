import { useEffect, useRef } from "react";

// Fireflies over a Dusk Meadow: a canvas 2D particle background behind a small hero.
// Sprites are drawn once to small offscreen canvases, motion is scaled by frame
// time, the loop stops off screen, and reduced motion gets one settled frame.
// Values worth changing:
const FLIES_PER_MPX = 120; // fireflies per million pixels
const GLOW = "222,240,128"; // firefly light, as r,g,b
const NEAR_GRASS = "#0a120e"; // front grass silhouette
const FAR_GRASS = "#16241e"; // back grass silhouette
const BLINK_RATE = 1; // 0.5 for lazy blinking, 2 for busy
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
  const n = Math.max(14, Math.min(140, Math.round(((w * h) / 1e6) * FLIES_PER_MPX)));
  const light = glow(96, GLOW, [[0, 1], [0.06, 0.9], [0.18, 0.3], [0.5, 0.06], [1, 0]]);
  const grass = document.createElement("canvas");
  grass.width = Math.ceil(w);
  grass.height = Math.ceil(h);
  const g = grass.getContext("2d")!;
  g.lineCap = "round";
  const blades = (count: number, color: string, len: number) => {
    g.strokeStyle = color;
    g.fillStyle = color;
    g.fillRect(0, h - len * 0.12, w, len * 0.12 + 2);
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const lh = len * (0.45 + Math.random() * 0.75);
      const bend = (Math.random() - 0.5) * lh * 0.7;
      g.lineWidth = 1 + Math.random() * 2;
      g.beginPath();
      g.moveTo(x, h + 2);
      g.quadraticCurveTo(x + bend * 0.2, h - lh * 0.6, x + bend, h - lh);
      g.stroke();
    }
  };
  blades(Math.round(w * 0.55), FAR_GRASS, h * 0.34);
  blades(Math.round(w * 0.9), NEAR_GRASS, h * 0.2);
  const ps = Array.from({ length: n }, () => ({
    x: Math.random() * w, y: h * (0.3 + Math.random() * 0.66), z: Math.random(),
    a: Math.random() * Math.PI * 2, ph: Math.random() * 9, per: 3 + Math.random() * 4,
  }));
  const fly = (c: CanvasRenderingContext2D, p: (typeof ps)[number], t: number) => {
    const k = ((t * BLINK_RATE) / p.per + p.ph) % 1;
    const on = k < 0.35 ? Math.sin((k / 0.35) * Math.PI) : 0;
    const b = 0.12 + 0.88 * on;
    const s = (14 + p.z * 40) * (0.7 + 0.3 * on);
    c.globalAlpha = b * (0.45 + p.z * 0.55);
    c.drawImage(light, p.x - s / 2, p.y - s / 2, s, s);
  };
  return {
    update(dt) {
      for (const p of ps) {
        p.a += (Math.random() - 0.5) * 3 * dt;
        const v = (8 + p.z * 14) * dt;
        p.x += Math.cos(p.a) * v;
        p.y += Math.sin(p.a) * v * 0.6;
        if (p.y < h * 0.25) p.a = Math.abs(p.a);
        if (p.y > h * 0.98) p.a = -Math.abs(p.a);
        if (p.x < -30) p.x += w + 60; else if (p.x > w + 30) p.x -= w + 60;
      }
    },
    draw(c, t) {
      c.clearRect(0, 0, w, h);
      c.globalCompositeOperation = "lighter";
      for (const p of ps) if (p.z < 0.45) fly(c, p, t);
      c.globalCompositeOperation = "source-over";
      c.globalAlpha = 1;
      c.drawImage(grass, 0, 0, w, h);
      c.globalCompositeOperation = "lighter";
      for (const p of ps) if (p.z >= 0.45) fly(c, p, t);
      c.globalCompositeOperation = "source-over";
      c.globalAlpha = 1;
    },
  };
}

export default function FirefliesDuskMeadow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !rootRef.current) return;
    return mount(canvasRef.current, rootRef.current);
  }, []);

  return (
    <section ref={rootRef} className="ffm-bg relative isolate flex min-h-[560px] items-center overflow-hidden px-6 py-20 sm:px-12">
      <style>{`.ffm-bg{background:linear-gradient(180deg, #273746 0%, #22332f 45%, #121d18 100%)}`}</style>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#dfe9a8]">Wren Hollow Campground</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-[#f4f1de] sm:text-5xl">Stay out past dark. The meadow lights up.</h2>
          <p className="mt-5 text-lg leading-relaxed text-[#d5d3bf]">Quiet walk-in sites along the creek, no generators after nine, and a ranger-led night walk on summer Fridays.</p>
          <a
            href="#"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-[#e1ea9b] px-6 text-sm font-semibold text-[#13201a] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4f1de] focus-visible:ring-offset-2 focus-visible:ring-offset-[#22332f]"
          >
            Reserve a site
          </a>
        </div>
      </div>
    </section>
  );
}

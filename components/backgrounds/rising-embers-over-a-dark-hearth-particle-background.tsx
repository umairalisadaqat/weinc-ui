import { useEffect, useRef } from "react";

// Rising Embers over a Dark Hearth: a canvas 2D particle background behind a small hero.
// Sprites are drawn once to small offscreen canvases, motion is scaled by frame
// time, the loop stops off screen, and reduced motion gets one settled frame.
// Values worth changing:
const EMBERS_PER_MPX = 220; // embers in the air per million pixels
const HOT = "255,236,190"; // fresh ember colour
const WARM = "255,150,62"; // cooling ember colour
const COOL = "196,58,24"; // nearly spent ember colour
const HEAT = 1; // rise speed: 0.6 for a dying fire, 1.6 for a roaring one
const WARMUP = 180; // frames simulated before the first paint

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
  const n = Math.max(40, Math.min(420, Math.round(((w * h) / 1e6) * EMBERS_PER_MPX)));
  const tints = [HOT, WARM, COOL].map((rgb) => glow(32, rgb, [[0, 1], [0.15, 0.9], [0.4, 0.25], [1, 0]]));
  const bed = glow(256, WARM, [[0, 0.32], [0.4, 0.12], [1, 0]]);
  const spawn = (p: { x: number; y: number; vy: number; life: number; age: number; z: number; s: number }) => {
    p.x = w * (0.5 + (Math.random() - 0.5) * 0.8 * (0.4 + Math.random() * 0.6));
    p.y = h + 10;
    p.z = Math.random();
    p.vy = -(35 + Math.random() * 70) * (0.5 + p.z * 0.7);
    p.life = 2.5 + Math.random() * 4;
    p.age = 0;
    p.s = Math.random() * 99;
  };
  const ps = Array.from({ length: n }, () => {
    const p = { x: 0, y: 0, vy: 0, life: 1, age: 0, z: 0, s: 0 };
    spawn(p);
    p.age = Math.random() * p.life;
    p.y = h + p.vy * p.age;
    return p;
  });
  return {
    update(dt, t) {
      for (const p of ps) {
        p.age += dt;
        if (p.age > p.life || p.y < -20) { spawn(p); continue; }
        p.y += p.vy * HEAT * dt;
        p.x += (Math.sin(t * 1.1 + p.y * 0.012 + p.s) * 22 + Math.sin(t * 3.1 + p.s * 2) * 8) * (0.4 + p.z) * dt;
      }
    },
    draw(c, t) {
      c.clearRect(0, 0, w, h);
      c.globalCompositeOperation = "lighter";
      const breathe = 0.8 + 0.12 * Math.sin(t * 1.7) + 0.08 * Math.sin(t * 4.3);
      c.globalAlpha = breathe;
      c.drawImage(bed, w * 0.05, h * 0.62, w * 0.9, h * 0.76);
      for (const p of ps) {
        const f = p.age / p.life;
        const tint = tints[f < 0.25 ? 0 : f < 0.6 ? 1 : 2];
        const flick = 0.65 + 0.35 * Math.sin(t * 17 + p.s * 7);
        const s = (4 + p.z * 12) * (1 - f * 0.5);
        c.globalAlpha = Math.min(1, (1 - f) * 1.4) * flick * (0.35 + p.z * 0.65);
        c.drawImage(tint, p.x - s / 2, p.y - s * 0.8, s, s * 1.6);
      }
      c.globalAlpha = 1;
      c.globalCompositeOperation = "source-over";
    },
  };
}

export default function RisingEmbersDarkHearth() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !rootRef.current) return;
    return mount(canvasRef.current, rootRef.current);
  }, []);

  return (
    <section ref={rootRef} className="emb-bg relative isolate flex min-h-[560px] items-center overflow-hidden px-6 py-20 sm:px-12">
      <style>{`.emb-bg{background:radial-gradient(70% 45% at 50% 110%, #5a2210 0%, rgba(90,34,16,0) 70%), linear-gradient(180deg, #0c0806 0%, #160c08 70%, #23110a 100%)}`}</style>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#f2b98a]">Ashgrove Wood-Fired Kitchen</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-[#fbeee0] sm:text-5xl">Everything on the menu meets the fire first.</h2>
          <p className="mt-5 text-lg leading-relaxed text-[#e0c8b0]">Bread from the oak oven, fish cooked over embers and vegetables pulled straight from the coals. Open Wednesday to Sunday.</p>
          <a
            href="#"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-[#f0a35e] px-6 text-sm font-semibold text-[#1a0d07] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbeee0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#140b07]"
          >
            Book a table
          </a>
        </div>
      </div>
    </section>
  );
}

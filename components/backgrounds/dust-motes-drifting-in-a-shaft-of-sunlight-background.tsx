import { useEffect, useRef } from "react";

// Dust Motes in a Sunlight Shaft: a canvas 2D particle background behind a small hero.
// Sprites are drawn once to small offscreen canvases, motion is scaled by frame
// time, the loop stops off screen, and reduced motion gets one settled frame.
// Values worth changing:
const MOTES_PER_MPX = 320; // dust density: motes per million pixels of area
const LIGHT = "255,224,168"; // colour of the sunlight and the lit dust, as r,g,b
const DRIFT_SPEED = 1; // 0.5 for still air, 2 for a draughty room
const BEAM_STRENGTH = 0.014; // brightness of the light shaft itself
const WARMUP = 90; // frames simulated before the first paint, so it never starts empty

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
  const n = Math.min(560, Math.round(((w * h) / 1e6) * MOTES_PER_MPX));
  const fine = glow(16, LIGHT, [[0, 1], [0.3, 0.75], [1, 0]]);
  const blur = glow(64, LIGHT, [[0, 0.4], [0.55, 0.14], [1, 0]]);
  // The shaft enters at the top between tx0 and tx1 and lands on the floor between bx0 and bx1.
  const tx0 = w * 0.52, tx1 = w * 0.84, bx0 = w * 0.3, bx1 = w * 0.8;
  const beam = document.createElement("canvas");
  beam.width = Math.ceil(w / 2);
  beam.height = Math.ceil(h / 2);
  const b = beam.getContext("2d")!;
  b.scale(0.5, 0.5);
  const m0 = (tx0 + tx1) / 2, m1 = (bx0 + bx1) / 2;
  for (let i = 0; i < 24; i++) {
    const k = (i / 24) * 0.85;
    const g = b.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(${LIGHT},${BEAM_STRENGTH})`);
    g.addColorStop(1, `rgba(${LIGHT},${BEAM_STRENGTH * 0.3})`);
    b.fillStyle = g;
    b.beginPath();
    b.moveTo(tx0 + (m0 - tx0) * k, 0);
    b.lineTo(tx1 - (tx1 - m0) * k, 0);
    b.lineTo(bx1 - (bx1 - m1) * k, h);
    b.lineTo(bx0 + (m1 - bx0) * k, h);
    b.fill();
  }
  const pool = b.createRadialGradient(m1, h, 0, m1, h, w * 0.32);
  pool.addColorStop(0, `rgba(${LIGHT},0.16)`);
  pool.addColorStop(1, `rgba(${LIGHT},0)`);
  b.fillStyle = pool;
  b.fillRect(0, 0, w, h);
  const ps = Array.from({ length: n }, () => ({
    x: Math.random() * w, y: Math.random() * h, z: Math.random() ** 1.5, vx: 0, vy: 0, s: Math.random() * 99,
  }));
  const lit = (x: number, y: number) => {
    const f = y / h, l = tx0 + (bx0 - tx0) * f, r = tx1 + (bx1 - tx1) * f;
    const d = Math.abs(x - (l + r) / 2) / ((r - l) / 2);
    return d >= 1 ? 0 : 1 - d * d;
  };
  return {
    update(dt, t) {
      const damp = Math.pow(0.35, dt);
      for (const p of ps) {
        p.vx = p.vx * damp + (Math.sin(t * 0.21 + p.s) * 3 + (Math.random() - 0.5) * 36) * dt;
        p.vy = p.vy * damp + (Math.cos(t * 0.17 + p.s) * 3 - 1 + (Math.random() - 0.5) * 36) * dt;
        const k = (0.35 + p.z) * DRIFT_SPEED * 5;
        p.x += p.vx * k * dt;
        p.y += p.vy * k * dt;
        if (p.x < -40) p.x += w + 80; else if (p.x > w + 40) p.x -= w + 80;
        if (p.y < -40) p.y += h + 80; else if (p.y > h + 40) p.y -= h + 80;
      }
    },
    draw(c, t) {
      c.clearRect(0, 0, w, h);
      c.globalAlpha = 0.85 + 0.15 * Math.sin(t * 0.35);
      c.drawImage(beam, 0, 0, w, h);
      c.globalCompositeOperation = "lighter";
      for (const p of ps) {
        const a = (0.05 + 0.95 * lit(p.x, p.y)) * (0.5 + 0.5 * Math.sin(t * 1.3 + p.s));
        if (a < 0.02) continue;
        if (p.z > 0.9) {
          const s = 16 + (p.z - 0.9) * 340;
          c.globalAlpha = a * 0.55;
          c.drawImage(blur, p.x - s / 2, p.y - s / 2, s, s);
        } else {
          const s = 2 + p.z * 6;
          c.globalAlpha = a * (0.35 + p.z * 0.65);
          c.drawImage(fine, p.x - s / 2, p.y - s / 2, s, s);
        }
      }
      c.globalAlpha = 1;
      c.globalCompositeOperation = "source-over";
    },
  };
}

export default function DustMotesSunlightShaft() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !rootRef.current) return;
    return mount(canvasRef.current, rootRef.current);
  }, []);

  return (
    <section ref={rootRef} className="dms-bg relative isolate flex min-h-[560px] items-center overflow-hidden px-6 py-20 sm:px-12">
      <style>{`.dms-bg{background:radial-gradient(70% 55% at 62% 108%, #4b311d 0%, rgba(75,49,29,0) 70%), linear-gradient(180deg, #1b130d 0%, #261a11 100%)}`}</style>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d8c6ac]">Linden & Oak furniture restoration</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-[#f6ecdc] sm:text-5xl">Old wood, ready for its second century.</h2>
          <p className="mt-5 text-lg leading-relaxed text-[#d8c6ac]">Hand-stripped finishes, rebuilt joints and French polish for the pieces your family plans to keep.</p>
          <a
            href="#"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-[#f1d8a6] px-6 text-sm font-semibold text-[#24180f] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6ecdc] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f150e]"
          >
            Book a workshop visit
          </a>
        </div>
      </div>
    </section>
  );
}

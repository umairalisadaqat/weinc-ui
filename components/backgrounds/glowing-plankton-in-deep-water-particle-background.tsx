import { useEffect, useRef } from "react";

// Glowing Plankton in Deep Water: a canvas 2D particle background behind a small hero.
// Sprites are drawn once to small offscreen canvases, motion is scaled by frame
// time, the loop stops off screen, and reduced motion gets one settled frame.
// Values worth changing:
const PLANKTON_PER_MPX = 320; // glowing plankton per million pixels
const GLOW = "110,245,220"; // bioluminescent colour, as r,g,b
const JELLY = "96,160,255"; // the few large, dim drifting glows
const FLASH_CHANCE = 0.06; // chance per second that a speck flashes
const CURRENT = 1; // water movement speed
const WARMUP = 90; // frames simulated before the first paint

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
  const speck = glow(32, GLOW, [[0, 1], [0.12, 0.85], [0.35, 0.2], [1, 0]]);
  const jelly = glow(128, JELLY, [[0, 0.22], [0.5, 0.08], [1, 0]]);
  const snow = glow(8, "200,220,225", [[0, 0.9], [1, 0]]);
  // Faint light rays from the surface, drawn once.
  const rays = document.createElement("canvas");
  rays.width = Math.ceil(w / 2);
  rays.height = Math.ceil(h / 2);
  const r = rays.getContext("2d")!;
  r.scale(0.5, 0.5);
  for (let i = 0; i < 7; i++) {
    const x = w * (0.1 + Math.random() * 0.8), wd = 20 + Math.random() * 70;
    const g = r.createLinearGradient(0, 0, 0, h * 0.8);
    g.addColorStop(0, "rgba(140,220,230,0.07)");
    g.addColorStop(1, "rgba(140,220,230,0)");
    r.fillStyle = g;
    r.beginPath();
    r.moveTo(x, 0); r.lineTo(x + wd, 0); r.lineTo(x + wd * 2.4 - w * 0.12, h * 0.8); r.lineTo(x - w * 0.12, h * 0.8);
    r.fill();
  }
  const ps = Array.from({ length: Math.min(600, Math.round(area * PLANKTON_PER_MPX)) }, () => ({
    x: Math.random() * w, y: Math.random() * h, z: Math.random(), s: Math.random() * 99, f: 0,
  }));
  const big = Array.from({ length: Math.max(3, Math.round(area * 8)) }, () => ({ x: Math.random() * w, y: Math.random() * h, z: Math.random(), s: Math.random() * 99 }));
  const fall = Array.from({ length: Math.min(200, Math.round(area * 120)) }, () => ({ x: Math.random() * w, y: Math.random() * h, z: Math.random() }));
  return {
    update(dt, t) {
      for (const p of ps) {
        const k = (0.3 + p.z) * CURRENT;
        p.x += (Math.sin(t * 0.2 + p.y * 0.004 + p.s) * 9 + 3) * k * dt;
        p.y += Math.cos(t * 0.15 + p.x * 0.003 + p.s) * 6 * k * dt;
        p.f = Math.max(0, p.f - dt * 0.9);
        if (Math.random() < FLASH_CHANCE * dt) p.f = 1;
        if (p.x > w + 20) p.x = -20; else if (p.x < -20) p.x = w + 20;
        if (p.y > h + 20) p.y = -20; else if (p.y < -20) p.y = h + 20;
      }
      for (const b of big) {
        b.x += (4 + Math.sin(t * 0.1 + b.s) * 3) * CURRENT * dt;
        b.y += Math.sin(t * 0.25 + b.s) * 5 * dt;
        if (b.x > w + 150) b.x = -150;
      }
      for (const m of fall) {
        m.y += (6 + m.z * 10) * dt;
        m.x += Math.sin(t * 0.4 + m.y * 0.02) * 4 * dt;
        if (m.y > h + 5) { m.y = -5; m.x = Math.random() * w; }
      }
    },
    draw(c, t) {
      c.clearRect(0, 0, w, h);
      c.globalAlpha = 0.75 + 0.25 * Math.sin(t * 0.3);
      c.drawImage(rays, Math.sin(t * 0.12) * 18, 0, w, h);
      for (const m of fall) {
        c.globalAlpha = 0.15 + m.z * 0.3;
        const s = 1.5 + m.z * 2;
        c.drawImage(snow, m.x, m.y, s, s);
      }
      c.globalCompositeOperation = "lighter";
      for (const b of big) {
        const s = 120 + b.z * 200 + Math.sin(t * 0.6 + b.s) * 20;
        c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 0.4 + b.s);
        c.drawImage(jelly, b.x - s / 2, b.y - s / 2, s, s);
      }
      for (const p of ps) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.8 + p.s);
        const s = (3 + p.z * 7) * (1 + p.f * 1.8);
        c.globalAlpha = Math.min(1, (0.1 + 0.25 * pulse) * (0.4 + p.z) + p.f * 0.9);
        c.drawImage(speck, p.x - s / 2, p.y - s / 2, s, s);
      }
      c.globalAlpha = 1;
      c.globalCompositeOperation = "source-over";
    },
  };
}

export default function GlowingPlanktonDeepWater() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !rootRef.current) return;
    return mount(canvasRef.current, rootRef.current);
  }, []);

  return (
    <section ref={rootRef} className="plk-bg relative isolate flex min-h-[560px] items-center overflow-hidden px-6 py-20 sm:px-12">
      <style>{`.plk-bg{background:radial-gradient(90% 60% at 50% -10%, #0e4450 0%, rgba(14,68,80,0) 70%), linear-gradient(180deg, #052029 0%, #03141a 55%, #020a0d 100%)}`}</style>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#8be6d6]">Tidewater Night Dives</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-[#e6fbf7] sm:text-5xl">Turn off your torch and watch the water glow.</h2>
          <p className="mt-5 text-lg leading-relaxed text-[#a9d3cf]">Guided night dives in small groups, with gear fitted before you board and an instructor beside you the whole way down.</p>
          <a
            href="#"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-[#7be0cf] px-6 text-sm font-semibold text-[#03181c] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6fbf7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#04161c]"
          >
            Pick a dive date
          </a>
        </div>
      </div>
    </section>
  );
}

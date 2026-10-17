import { useEffect, useRef } from "react";

// Constellation Network with Depth Fade: a canvas 2D particle background behind a small hero.
// Sprites are drawn once to small offscreen canvases, motion is scaled by frame
// time, the loop stops off screen, and reduced motion gets one settled frame.
// Values worth changing:
const NODES_PER_MPX = 165; // how many points per million pixels of area
const INK = "51,65,85"; // colour of the points and links, as r,g,b
const ACCENT = "15,118,110"; // colour of the few highlighted hub points
const LINK_DISTANCE = 165; // pixels: points closer than this get joined
const SPEED = 1; // 0.5 for a slower drift, 2 for faster
const WARMUP = 30; // frames simulated before the first paint

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
  const n = Math.max(28, Math.min(200, Math.round(((w * h) / 1e6) * NODES_PER_MPX)));
  const dot = glow(32, INK, [[0, 1], [0.3, 1], [0.42, 0]]);
  const hubDot = glow(32, ACCENT, [[0, 1], [0.3, 1], [0.42, 0]]);
  const halo = glow(96, ACCENT, [[0, 0.28], [0.25, 0.12], [1, 0]]);
  const ps = Array.from({ length: n }, () => {
    const z = Math.random();
    const a = Math.random() * Math.PI * 2;
    const v = (3 + Math.random() * 7) * (0.35 + z);
    return { x: Math.random() * w, y: Math.random() * h, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v, hub: Math.random() < 0.07, s: Math.random() * 9 };
  });
  return {
    update(dt) {
      for (const p of ps) {
        p.x += p.vx * dt * SPEED;
        p.y += p.vy * dt * SPEED;
        if (p.x < -60) p.x += w + 120; else if (p.x > w + 60) p.x -= w + 120;
        if (p.y < -60) p.y += h + 120; else if (p.y > h + 60) p.y -= h + 120;
      }
    },
    draw(c, t) {
      c.clearRect(0, 0, w, h);
      c.strokeStyle = `rgb(${INK})`;
      for (let i = 0; i < n; i++) {
        const a = ps[i];
        for (let j = i + 1; j < n; j++) {
          const b = ps[j];
          const zz = (a.z + b.z) / 2;
          const L = LINK_DISTANCE * (0.55 + 0.65 * zz);
          const dx = a.x - b.x, dy = a.y - b.y;
          if (dx > L || dx < -L || dy > L || dy < -L) continue;
          const d2 = dx * dx + dy * dy;
          if (d2 > L * L) continue;
          const f = 1 - Math.sqrt(d2) / L;
          c.globalAlpha = f * (0.06 + 0.4 * zz);
          c.lineWidth = 0.5 + zz * 0.7;
          c.beginPath();
          c.moveTo(a.x, a.y);
          c.lineTo(b.x, b.y);
          c.stroke();
        }
      }
      for (const p of ps) {
        const s = 3 + p.z * 5;
        if (p.hub) {
          const hs = 44 + 14 * Math.sin(t * 0.9 + p.s);
          c.globalAlpha = 1;
          c.drawImage(halo, p.x - hs / 2, p.y - hs / 2, hs, hs);
          c.drawImage(hubDot, p.x - s * 0.7, p.y - s * 0.7, s * 1.4, s * 1.4);
        } else {
          c.globalAlpha = 0.25 + p.z * 0.7;
          c.drawImage(dot, p.x - s / 2, p.y - s / 2, s, s);
        }
      }
      c.globalAlpha = 1;
    },
  };
}

export default function ConstellationNetworkDepthFade() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !rootRef.current) return;
    return mount(canvasRef.current, rootRef.current);
  }, []);

  return (
    <section ref={rootRef} className="cnl-bg relative isolate flex min-h-[560px] items-center overflow-hidden px-6 py-20 sm:px-12">
      <style>{`.cnl-bg{background:linear-gradient(160deg, #f5f7f9 0%, #e8edf2 100%)}.cnl-scrim{background:radial-gradient(55% 75% at 22% 50%, rgba(245,247,249,0.92) 0%, rgba(245,247,249,0) 75%)}`}</style>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div aria-hidden="true" className="cnl-scrim pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">Meridian Survey Labs</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-[#0f172a] sm:text-5xl">See how every site in your region connects.</h2>
          <p className="mt-5 text-lg leading-relaxed text-[#334155]">We map utilities, transit and land records into one shared model your planning team can search, filter and export.</p>
          <a
            href="#"
            className="mt-8 inline-flex h-12 items-center rounded-md bg-[#0f766e] px-6 text-sm font-semibold text-[#ffffff] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f7f9]"
          >
            Request a sample map
          </a>
        </div>
      </div>
    </section>
  );
}

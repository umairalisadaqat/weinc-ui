import { useEffect, useRef } from "react";

// Rain on a Night Window: a canvas 2D particle background behind a small hero.
// Sprites are drawn once to small offscreen canvases, motion is scaled by frame
// time, the loop stops off screen, and reduced motion gets one settled frame.
// Values worth changing:
const STREAKS_PER_MPX = 240; // falling rain outside, per million pixels
const BEADS_PER_MPX = 300; // drops sitting on the glass
const CITY = ["255,178,92", "255,214,150", "120,186,214", "226,96,82"]; // blurred lights behind the glass
const SLANT = 0.14; // rain angle: 0 is straight down
const WARMUP = 20; // frames simulated before the first paint

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
  // City lights behind the glass, drawn once.
  const city = document.createElement("canvas");
  city.width = Math.ceil(w / 2);
  city.height = Math.ceil(h / 2);
  const g = city.getContext("2d")!;
  g.scale(0.5, 0.5);
  const blobs = CITY.map((rgb) => glow(128, rgb, [[0, 0.5], [0.35, 0.22], [1, 0]]));
  for (let i = 0; i < 40 * Math.max(1, area * 1.5); i++) {
    const s = 30 + Math.random() * 120;
    g.globalAlpha = 0.25 + Math.random() * 0.6;
    g.drawImage(blobs[Math.floor(Math.random() * blobs.length)], Math.random() * w - s / 2, h * (0.35 + Math.random() * 0.7) - s / 2, s, s);
  }
  // A water bead: dark lens with a bright lower rim and a small highlight.
  const bead = document.createElement("canvas");
  bead.width = bead.height = 32;
  const q = bead.getContext("2d")!;
  q.fillStyle = "rgba(10,16,24,0.35)";
  q.beginPath(); q.arc(16, 16, 13, 0, 7); q.fill();
  q.strokeStyle = "rgba(255,226,180,0.55)";
  q.lineWidth = 2;
  q.beginPath(); q.arc(16, 16, 12, 0.3, 2.8); q.stroke();
  q.fillStyle = "rgba(255,255,255,0.8)";
  q.beginPath(); q.arc(11, 10, 2.2, 0, 7); q.fill();
  const streaks = Array.from({ length: Math.min(500, Math.round(area * STREAKS_PER_MPX)) }, () => ({
    x: Math.random() * w, y: Math.random() * h, z: Math.random(),
  }));
  const beads = Array.from({ length: Math.min(600, Math.round(area * BEADS_PER_MPX)) }, () => ({
    x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() ** 3 * 5, vy: 0, top: 0,
  }));
  return {
    update(dt) {
      for (const s of streaks) {
        const v = (700 + s.z * 600) * dt;
        s.y += v;
        s.x -= v * SLANT;
        if (s.y > h + 40) { s.y = -40 - Math.random() * 80; s.x = Math.random() * (w + h * SLANT); }
      }
      for (const b of beads) {
        if (b.vy === 0 && b.r > 3.5 && Math.random() < 0.06 * dt) { b.vy = 30; b.top = b.y; }
        if (b.vy > 0) {
          b.vy = Math.min(260, b.vy + 220 * dt * (Math.random() < 0.2 ? 0 : 1));
          b.y += b.vy * dt;
          b.x += (Math.random() - 0.5) * 30 * dt;
          if (b.y > h + 20) { b.y = Math.random() * h; b.x = Math.random() * w; b.vy = 0; b.r = 1 + Math.random() ** 3 * 5; }
        }
      }
    },
    draw(c) {
      c.clearRect(0, 0, w, h);
      c.globalAlpha = 1;
      c.drawImage(city, 0, 0, w, h);
      c.strokeStyle = "rgb(190,210,228)";
      c.lineCap = "round";
      for (const s of streaks) {
        const len = 14 + s.z * 30;
        c.globalAlpha = 0.06 + s.z * 0.2;
        c.lineWidth = 0.6 + s.z * 0.8;
        c.beginPath();
        c.moveTo(s.x, s.y);
        c.lineTo(s.x + len * SLANT, s.y - len);
        c.stroke();
      }
      for (const b of beads) {
        if (b.vy > 0) {
          const tg = c.createLinearGradient(0, b.top, 0, b.y);
          tg.addColorStop(0, "rgba(200,220,236,0)");
          tg.addColorStop(1, "rgba(200,220,236,0.28)");
          c.globalAlpha = 1;
          c.strokeStyle = tg;
          c.lineWidth = b.r * 0.9;
          c.beginPath();
          c.moveTo(b.x, b.top);
          c.lineTo(b.x, b.y);
          c.stroke();
        }
        const s = b.r * 2.4;
        c.globalAlpha = 0.9;
        c.drawImage(bead, b.x - s / 2, b.y - s / 2, s, s);
      }
      c.globalAlpha = 1;
    },
  };
}

export default function RainNightWindow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !rootRef.current) return;
    return mount(canvasRef.current, rootRef.current);
  }, []);

  return (
    <section ref={rootRef} className="rwn-bg relative isolate flex min-h-[560px] items-center overflow-hidden px-6 py-20 sm:px-12">
      <style>{`.rwn-bg{background:linear-gradient(180deg, #0a0f15 0%, #111925 60%, #18212c 100%)}`}</style>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#e9bf80]">Halden Street Records</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-[#eef2f6] sm:text-5xl">A listening room for rainy nights.</h2>
          <p className="mt-5 text-lg leading-relaxed text-[#bcc6d1]">Vinyl on a proper system, a short cocktail list and seats facing the window. Open from six until the last record ends.</p>
          <a
            href="#"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-[#e9b872] px-6 text-sm font-semibold text-[#1a1208] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eef2f6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f151d]"
          >
            See this week's sets
          </a>
        </div>
      </div>
    </section>
  );
}

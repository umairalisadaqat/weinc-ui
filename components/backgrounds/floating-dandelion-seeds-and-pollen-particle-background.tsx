import { useEffect, useRef } from "react";

// Floating Dandelion Seeds and Pollen: a canvas 2D particle background behind a small hero.
// Sprites are drawn once to small offscreen canvases, motion is scaled by frame
// time, the loop stops off screen, and reduced motion gets one settled frame.
// Values worth changing:
const SEEDS_PER_MPX = 30; // dandelion seeds per million pixels
const POLLEN_PER_MPX = 200; // tiny pollen grains per million pixels
const FILAMENT = "255,253,244"; // seed fluff colour, as r,g,b (backlit, so near white)
const POLLEN = "255,232,150"; // pollen colour
const BREEZE = 1; // 0.5 for a still afternoon, 2 for a windy one
const WARMUP = 120; // frames simulated before the first paint

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
  // One dandelion seed drawn once: a fan of fine filaments on a thin stalk.
  const seed = document.createElement("canvas");
  seed.width = seed.height = 96;
  const q = seed.getContext("2d")!;
  q.translate(48, 40);
  q.lineCap = "round";
  const crown = q.createRadialGradient(0, -6, 0, 0, -6, 34);
  crown.addColorStop(0, `rgba(${FILAMENT},0.32)`);
  crown.addColorStop(1, `rgba(${FILAMENT},0)`);
  q.fillStyle = crown;
  q.fillRect(-40, -40, 80, 70);
  for (let i = 0; i < 44; i++) {
    const a = Math.PI * 0.82 + (i / 43) * Math.PI * 1.36;
    const len = 20 + Math.random() * 12;
    q.strokeStyle = `rgba(${FILAMENT},0.7)`;
    q.lineWidth = 0.7;
    q.beginPath();
    q.moveTo(0, 0);
    q.quadraticCurveTo(Math.cos(a) * len * 0.5, Math.sin(a) * len * 0.4, Math.cos(a) * len, Math.sin(a) * len * 0.8);
    q.stroke();
    q.fillStyle = `rgba(${FILAMENT},0.9)`;
    q.beginPath();
    q.arc(Math.cos(a) * len, Math.sin(a) * len * 0.8, 1.1, 0, 7);
    q.fill();
  }
  q.strokeStyle = "rgba(120,104,70,0.6)";
  q.lineWidth = 0.9;
  q.beginPath(); q.moveTo(0, 0); q.lineTo(0, 30); q.stroke();
  q.fillStyle = "rgba(110,86,52,0.85)";
  q.beginPath(); q.ellipse(0, 34, 1.6, 4.5, 0, 0, 7); q.fill();
  const grain = glow(16, POLLEN, [[0, 1], [0.35, 0.8], [1, 0]]);
  const seeds = Array.from({ length: Math.max(6, Math.round(area * SEEDS_PER_MPX)) }, () => ({
    x: Math.random() * w, y: Math.random() * h, z: Math.random(), r: (Math.random() - 0.5) * 0.6, s: Math.random() * 99,
  }));
  const dust = Array.from({ length: Math.min(500, Math.round(area * POLLEN_PER_MPX)) }, () => ({
    x: Math.random() * w, y: Math.random() * h, z: Math.random(), s: Math.random() * 99,
  }));
  let breeze = 0;
  return {
    update(dt, t) {
      breeze = (14 + Math.sin(t * 0.17) * 10 + Math.sin(t * 0.43) * 6) * BREEZE;
      for (const p of seeds) {
        const k = 0.4 + p.z;
        p.x += (breeze + Math.sin(t * 0.6 + p.s) * 8) * k * dt;
        p.y += (-6 + Math.sin(t * 0.9 + p.s * 1.3) * 10) * k * dt;
        p.r = Math.sin(t * 0.5 + p.s) * 0.35;
        if (p.x > w + 80) { p.x = -80; p.y = Math.random() * h; }
        if (p.y < -80) p.y = h + 80; else if (p.y > h + 80) p.y = -80;
      }
      for (const p of dust) {
        p.x += (breeze * 0.7 + Math.sin(t + p.s) * 6) * (0.3 + p.z) * dt;
        p.y += Math.cos(t * 0.8 + p.s) * 7 * dt - 2 * dt;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
      }
    },
    draw(c, t) {
      c.clearRect(0, 0, w, h);
      for (const p of dust) {
        const s = 1.5 + p.z * 3.5;
        c.globalAlpha = (0.25 + p.z * 0.5) * (0.6 + 0.4 * Math.sin(t * 2 + p.s));
        c.drawImage(grain, p.x - s / 2, p.y - s / 2, s, s);
      }
      for (const p of seeds) {
        const s = 34 + p.z * 70;
        c.globalAlpha = p.z > 0.85 ? 0.6 : 0.7 + p.z * 0.3;
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.r);
        c.drawImage(seed, -s / 2, -s * 0.42, s, s);
        c.restore();
      }
      c.globalAlpha = 1;
    },
  };
}

export default function FloatingDandelionSeedsPollen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !rootRef.current) return;
    return mount(canvasRef.current, rootRef.current);
  }, []);

  return (
    <section ref={rootRef} className="sdp-bg relative isolate flex min-h-[560px] items-center overflow-hidden px-6 py-20 sm:px-12">
      <style>{`.sdp-bg{background:radial-gradient(60% 70% at 88% 5%, #f4e3a8 0%, rgba(244,227,168,0) 70%), linear-gradient(180deg, #c9c690 0%, #a9b47a 55%, #8b9a5e 100%)}.sdp-scrim{background:radial-gradient(52% 72% at 20% 50%, rgba(238,234,204,0.9) 0%, rgba(238,234,204,0) 78%)}`}</style>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div aria-hidden="true" className="sdp-scrim pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#3f4d1f]">Fieldnote Botanical Tea</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-[#26301c] sm:text-5xl">Meadow herbs, dried slowly and blended by hand.</h2>
          <p className="mt-5 text-lg leading-relaxed text-[#3b4229]">Chamomile, nettle and lemon balm from small farms nearby, sold loose leaf and shipped in plain paper.</p>
          <a
            href="#"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-[#3f5a2a] px-6 text-sm font-semibold text-[#fbf7ea] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26301c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eeeacc]"
          >
            Shop the spring blends
          </a>
        </div>
      </div>
    </section>
  );
}

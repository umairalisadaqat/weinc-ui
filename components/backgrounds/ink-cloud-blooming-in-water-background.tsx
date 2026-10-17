import { useEffect, useRef } from "react";

// Ink colours as [r, g, b]: indigo, sepia and a deep teal.
const INKS = [
  [38, 50, 98],
  [112, 72, 46],
  [24, 82, 92],
];
// The water and paper behind the ink.
const WATER = [238, 233, 224];
// Seconds one bloom takes to open, spread and fade.
const LIFE = 16;
// How dark the ink can get. Keep it modest so the text stays readable.
const STRENGTH = 1.7;
// Where blooms start, as fractions of width and height (kept away from the headline).
const SPOTS = [
  [0.78, 0.32], [0.62, 0.78], [0.92, 0.64], [0.7, 0.12], [0.86, 0.92], [0.56, 0.45],
];

const css = `
.ink-grain{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url%28%23g%29'/%3E%3C/svg%3E");mix-blend-mode:multiply;opacity:.3}
`;

type Bloom = { x: number; y: number; born: number; size: number; ink: number[] };

export default function InkCloudBloomingInWater() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Drawn at low resolution and stretched smoothly by the browser.
    const W = 140;
    let H = 70;
    let aspect = 1.6;
    let narrow = false;
    let img = ctx.createImageData(W, H);
    let raf = 0;
    let onScreen = true;
    let next = 0;
    const clock = () => performance.now() / 1000;
    const spawn = (born: number): Bloom => {
      const [sx, sy] = SPOTS[next % SPOTS.length];
      const ink = INKS[next % INKS.length];
      next += 1;
      // On narrow screens the text fills the width, so ink rises from the bottom edge instead.
      const x = narrow ? 0.15 + ((sx - 0.5) / 0.45) * 0.7 : sx;
      const y = narrow ? 0.78 + sy * 0.25 : sy;
      return { x: x + (Math.random() - 0.5) * 0.06, y, born, size: 0.16 + Math.random() * 0.08, ink };
    };
    let blooms: Bloom[] = [];
    const seed = () => {
      const now = clock();
      next = 0;
      // Start mid-story: blooms at different ages so the first frame is already full.
      blooms = [0, 1, 2, 3, 4].map((k) => spawn(now - LIFE * (0.15 + k * 0.17)));
    };

    const draw = (t: number) => {
      const d = img.data;
      let o = 0;
      for (const b of blooms) if (t - b.born > LIFE) Object.assign(b, spawn(t));
      const live = blooms.map((b) => {
        const a = Math.min(1, Math.max(0, (t - b.born) / LIFE));
        const sigma = b.size * (0.3 + 1.1 * Math.sqrt(a));
        return { x: b.x * aspect, y: b.y, amp: Math.pow(1 - a, 1.4) * Math.min(1, a * 7), k: 1 / (sigma * sigma), ink: b.ink };
      });
      for (let y = 0; y < H; y++) {
        const ny = y / (H - 1);
        for (let x = 0; x < W; x++) {
          const nx = (x / (W - 1)) * aspect;
          // Curl the sample point so blooms grow feathered edges instead of perfect circles.
          const wx = nx + 0.05 * Math.sin(ny * 9 + t * 0.21) + 0.03 * Math.sin(ny * 27 - t * 0.4) + 0.012 * Math.sin((nx + ny) * 61 + t * 0.5);
          const wy = ny + 0.05 * Math.cos(nx * 7 - t * 0.17) + 0.03 * Math.cos(nx * 23 + t * 0.33) + 0.012 * Math.cos((nx - ny) * 57 - t * 0.45);
          let ar = 0, ag = 0, ab = 0;
          for (const b of live) {
            const dx = wx - b.x, dy = wy - b.y;
            // A darker rim where the spreading edge meets clear water.
            const q = (dx * dx + dy * dy) * b.k;
            const v = b.amp * Math.exp(-q) * (0.75 + 0.5 * Math.exp(-Math.abs(q - 1.2) * 3));
            ar += v * (1 - b.ink[0] / 255); ag += v * (1 - b.ink[1] / 255); ab += v * (1 - b.ink[2] / 255);
          }
          d[o] = WATER[0] * Math.exp(-ar * STRENGTH);
          d[o + 1] = WATER[1] * Math.exp(-ag * STRENGTH);
          d[o + 2] = WATER[2] * Math.exp(-ab * STRENGTH);
          d[o + 3] = 255;
          o += 4;
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    const loop = () => {
      draw(clock());
      if (onScreen && !still) raf = requestAnimationFrame(loop);
    };
    const resize = () => {
      const box = root.getBoundingClientRect();
      aspect = Math.max(0.4, box.width / Math.max(1, box.height));
      const wasNarrow = narrow;
      narrow = box.width < 700;
      H = Math.max(30, Math.min(180, Math.round(W / aspect)));
      canvas.width = W; canvas.height = H;
      img = ctx.createImageData(W, H);
      if (!blooms.length || wasNarrow !== narrow) seed();
      draw(clock());
    };
    const ro = new ResizeObserver(resize);
    ro.observe(root);
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (onScreen && !still) raf = requestAnimationFrame(loop);
    });
    io.observe(root);
    resize();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);

  return (
    <section ref={rootRef} className="relative isolate flex min-h-[600px] items-center overflow-hidden bg-[#eee9e0]">
      <style>{css}</style>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div aria-hidden="true" className="ink-grain pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto w-full max-w-5xl px-6 pb-[200px] pt-20 sm:px-10 md:py-24">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#3a4466]">Sumi &amp; Water Studio</p>
        <h1 className="mt-4 max-w-[34rem] font-serif text-[34px] font-medium leading-[1.1] text-[#161b2a] sm:text-[54px]">Brush lettering for beginners, taught at one long wooden table.</h1>
        <p className="mt-5 max-w-[28rem] text-lg leading-relaxed text-[#363c4d]">Two-hour evening classes with ground ink, real brushes and paper that forgives a shaky first stroke.</p>
        <a href="#" className="mt-8 inline-flex h-12 items-center rounded-md bg-[#1c2440] px-6 text-[15px] font-semibold text-[#f3efe7] hover:bg-[#2a3458] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c2440] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eee9e0]">Reserve a seat</a>
      </div>
    </section>
  );
}

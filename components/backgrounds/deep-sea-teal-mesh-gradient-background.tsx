import { useEffect, useRef } from "react";

// Colour pools that drift through the mesh. Each one is [r, g, b].
const POOLS = [
  [9, 58, 72],
  [18, 96, 98],
  [36, 122, 114],
  [6, 40, 60],
  [52, 132, 124],
  [4, 28, 44],
];
// Water colour between the pools.
const DEPTH = [3, 22, 32];
// Bigger is slower.
const SLOWNESS = 9000;

const css = `
.dsm-grain{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url%28%23g%29'/%3E%3C/svg%3E");mix-blend-mode:overlay;opacity:.28}
`;

export default function DeepSeaTealMeshGradient() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The mesh is drawn small and the browser stretches it smoothly, so a frame stays cheap.
    const W = 120;
    let H = 72;
    let aspect = 1.6;
    let img = ctx.createImageData(W, H);
    let raf = 0;
    let onScreen = true;
    const start = performance.now() - 26000;
    const pools = POOLS.map((col, i) => ({ col, fx: 0.7 + i * 0.23, fy: 0.9 + i * 0.17, px: i * 1.9, py: i * 2.7, r: 0.34 + (i % 3) * 0.08 }));

    const draw = (now: number) => {
      const t = (now - start) / SLOWNESS;
      const pos = pools.map((p) => ({
        x: (0.5 + 0.46 * Math.sin(t * p.fx + p.px)) * aspect,
        y: 0.5 + 0.44 * Math.cos(t * p.fy + p.py),
        k: 1 / (p.r * p.r),
        col: p.col,
      }));
      const d = img.data;
      let o = 0;
      for (let y = 0; y < H; y++) {
        const ny = y / (H - 1);
        for (let x = 0; x < W; x++) {
          const nx = (x / (W - 1)) * aspect;
          let r = DEPTH[0] * 0.35, g = DEPTH[1] * 0.35, b = DEPTH[2] * 0.35, s = 0.35;
          for (const p of pos) {
            const dx = nx - p.x, dy = ny - p.y;
            const w = Math.exp(-(dx * dx + dy * dy) * p.k);
            r += p.col[0] * w; g += p.col[1] * w; b += p.col[2] * w; s += w;
          }
          // Darker toward the bottom, like looking down into deeper water.
          const shade = 1 - ny * 0.35;
          d[o] = (r / s) * shade; d[o + 1] = (g / s) * shade; d[o + 2] = (b / s) * shade; d[o + 3] = 255;
          o += 4;
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    const loop = (now: number) => {
      draw(now);
      if (onScreen && !still) raf = requestAnimationFrame(loop);
    };
    const resize = () => {
      const box = root.getBoundingClientRect();
      aspect = Math.max(0.4, box.width / Math.max(1, box.height));
      H = Math.max(24, Math.min(160, Math.round(W / aspect)));
      canvas.width = W; canvas.height = H;
      img = ctx.createImageData(W, H);
      draw(performance.now());
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
    <section ref={rootRef} className="dsm-root relative isolate flex min-h-[600px] items-center overflow-hidden bg-[#031620]">
      <style>{css}</style>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div aria-hidden="true" className="dsm-grain pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto w-full max-w-5xl px-6 py-24 sm:px-10">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-100/80">Kelpline Dive School</p>
        <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-6xl">Learn to breathe slowly at eighteen metres.</h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-teal-50/85">Small groups, warm wetsuits and an instructor who stays within arm's reach from the first giant stride to the last safety stop.</p>
        <a href="#" className="mt-10 inline-flex h-12 items-center rounded-full bg-[#e6f4f1] px-7 text-sm font-semibold text-[#06303a] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04202a]">Book a try dive</a>
      </div>
    </section>
  );
}

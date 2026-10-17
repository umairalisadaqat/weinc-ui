import { useEffect, useRef } from "react";

// Ember colours as [r, g, b]; they rise and fade over the charcoal.
const EMBERS = [
  [168, 64, 24],
  [196, 98, 36],
  [120, 36, 18],
  [210, 128, 52],
  [150, 52, 22],
  [184, 82, 30],
  [132, 44, 20],
];
// The charcoal behind everything.
const CHARCOAL = [20, 13, 11];
// Seconds for an ember to rise the full height.
const RISE = 22;
// Overall brightness of the embers (0 to 1).
const HEAT = 0.62;

const css = `
.emb-grain{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url%28%23g%29'/%3E%3C/svg%3E");mix-blend-mode:overlay;opacity:.3}
`;

export default function EmberGlowRisingMesh() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Drawn small and stretched smoothly by the browser.
    const W = 110;
    let H = 70;
    let aspect = 1.6;
    let img = ctx.createImageData(W, H);
    let raf = 0;
    let onScreen = true;
    const embers = EMBERS.map((col, i) => ({ col, lane: 0.08 + ((i * 0.37) % 1) * 0.86, phase: i / EMBERS.length, sway: 0.5 + (i % 3) * 0.3, r: 0.16 + (i % 4) * 0.04 }));

    const draw = (t: number) => {
      const pos = embers.map((e) => {
        const p = (t / RISE + e.phase) % 1;
        // Bright low down, fading out as it climbs.
        const life = Math.sin(Math.PI * Math.min(1, p * 1.15)) * (1 - p * 0.55);
        return { x: (e.lane + 0.06 * Math.sin(t * 0.3 * e.sway + e.phase * 9)) * aspect, y: 1.15 - p * 1.35, k: 1 / (e.r * e.r), a: life * HEAT, col: e.col };
      });
      const d = img.data;
      let o = 0;
      for (let y = 0; y < H; y++) {
        const ny = y / (H - 1);
        // A steady glow from the coals below the frame.
        const bed = Math.exp(-(1 - ny) * 3.2) * 0.55;
        for (let x = 0; x < W; x++) {
          const nx = (x / (W - 1)) * aspect;
          let r = CHARCOAL[0] + 150 * bed, g = CHARCOAL[1] + 54 * bed, b = CHARCOAL[2] + 22 * bed;
          for (const p of pos) {
            const dx = nx - p.x, dy = ny - p.y;
            const w = p.a * Math.exp(-(dx * dx + dy * dy) * p.k);
            r += p.col[0] * w; g += p.col[1] * w; b += p.col[2] * w;
          }
          d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
          o += 4;
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    const start = performance.now();
    const loop = (now: number) => {
      draw((now - start) / 1000 + 9);
      if (onScreen && !still) raf = requestAnimationFrame(loop);
    };
    const resize = () => {
      const box = root.getBoundingClientRect();
      aspect = Math.max(0.4, box.width / Math.max(1, box.height));
      H = Math.max(30, Math.min(180, Math.round(W / aspect)));
      canvas.width = W; canvas.height = H;
      img = ctx.createImageData(W, H);
      draw((performance.now() - start) / 1000 + 9);
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
    <section ref={rootRef} className="relative isolate flex min-h-[600px] items-center overflow-hidden bg-[#140d0b]">
      <style>{css}</style>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div aria-hidden="true" className="emb-grain pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center sm:px-10">
        <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-[#f0b98c]">Coalhouse &middot; Wood-fired kitchen</p>
        <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-[#fff5ec] sm:text-6xl">Everything on the menu meets the fire at least once.</h1>
        <p className="mx-auto mt-5 max-w-[32rem] text-lg leading-relaxed text-[#ead8c9]">Oak and cherry wood, a hearth that stays lit from noon, and a counter where you can watch it all happen.</p>
        <a href="#" className="mt-8 inline-flex h-12 items-center rounded-full bg-[#f6e3cf] px-7 text-[15px] font-semibold text-[#2a120a] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6e3cf] focus-visible:ring-offset-2 focus-visible:ring-offset-[#140d0b]">Book a table</a>
      </div>
    </section>
  );
}

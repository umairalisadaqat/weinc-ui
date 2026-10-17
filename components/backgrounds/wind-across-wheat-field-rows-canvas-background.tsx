import { useEffect, useRef } from "react";

// Rows of wheat stalks from the horizon to your feet. A gust rolls across the field, bending
// each stalk and lifting its colour as the paler undersides turn up, then the field settles.
// Change these: field colours (rgb), number of rows, gust speed (seconds per crossing), horizon.
const FAR = [216, 199, 146];
const NEAR = [196, 156, 84];
const LIGHT = [252, 241, 204];
const ROWS = 34;
const GUST_SECONDS = 7;
const HORIZON = 0.5; // fraction of the height

export default function WindAcrossWheatField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let onScreen = true;
    const born = performance.now();
    const cleanups: (() => void)[] = [];

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const top = h * HORIZON;
      const crossing = w * 1.6;
      const gusts = [((t / GUST_SECONDS) % 1) * crossing - w * 0.3, (((t + GUST_SECONDS * 0.55) / GUST_SECONDS) % 1) * crossing - w * 0.3];
      for (let r = 0; r < ROWS; r++) {
        const z = (r + 1) / ROWS;
        const base = top + (h - top + 30) * Math.pow(z, 1.7);
        const len = 8 + 70 * Math.pow(z, 1.4);
        const gap = 3 + 15 * z;
        const tint = Math.pow(z, 0.8);
        const paths = [new Path2D(), new Path2D(), new Path2D()];
        for (let x = -20 + ((r * 7.3) % gap); x < w + 20; x += gap) {
          let gust = 0;
          for (const g of gusts) {
            const d = (x - g - z * 60) / (w * (0.1 + 0.08 * z) + 40);
            gust += Math.exp(-d * d);
          }
          const sway = 0.12 * Math.sin(t * 1.1 + x * 0.013 + r * 0.7) + 0.06 * Math.sin(t * 2.3 + x * 0.05);
          const bend = 0.16 + sway + Math.min(gust, 1) * 0.5;
          const tipX = x + Math.sin(bend) * len;
          const tipY = base - Math.cos(bend) * len;
          const p = paths[gust > 0.6 ? 2 : gust > 0.25 ? 1 : 0];
          p.moveTo(x, base);
          p.quadraticCurveTo(x + Math.sin(bend * 0.4) * len * 0.5, base - len * 0.55, tipX, tipY);
        }
        for (let k = 0; k < 3; k++) {
          const lift = k * 0.3;
          const c = FAR.map((f, i) => Math.round((f + (NEAR[i] - f) * tint) * (1 - lift) + LIGHT[i] * lift));
          ctx.strokeStyle = "rgb(" + c.join(",") + ")";
          ctx.lineWidth = 0.6 + 1.8 * z;
          ctx.stroke(paths[k]);
        }
      }
    };
    const now = () => 3 + (performance.now() - born) / 1000;
    const frame = () => {
      raf = 0;
      draw(now());
      if (onScreen && !reduce) raf = requestAnimationFrame(frame);
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(reduce ? 3 : now());
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    const io = new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      if (onScreen && !reduce && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      cleanups.forEach((c) => c());
    };
  }, []);
  return (
    <section className="relative isolate min-h-[660px] overflow-hidden bg-[#efe6cf]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 [background:linear-gradient(180deg,#e4e6dc_0%,#f1e8d0_42%,#e2cf9c_50%,#bf9f5c_58%,#7e5f26_100%)]" />
        <div className="absolute left-[55%] top-[22%] h-72 w-[50%] [background:radial-gradient(closest-side,rgba(255,246,222,.9),transparent)]" />
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      </div>
      <div className="mx-auto max-w-5xl px-6 pb-[340px] pt-16 sm:pt-20">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6b4a17]">Hartfield Mill</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-[#2d2210] sm:text-6xl">Stoneground flour from this summer's harvest.</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#4d3d22]">Heritage wheat grown two fields from the mill, ground slowly and posted the same week.</p>
        <a href="#" className="mt-7 inline-flex h-12 items-center rounded-md bg-[#2d2210] px-7 text-sm font-semibold text-[#f6efdc] transition hover:bg-[#4a3a1e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d2210] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f1e8d0]">Order a sack</a>
      </div>
    </section>
  );
}

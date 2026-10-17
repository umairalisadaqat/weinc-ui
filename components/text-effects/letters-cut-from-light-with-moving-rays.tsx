import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const WORD = "VESPER";
const LIGHT = ["#fff1d6", "#ffc77d"]; // top and bottom of the lit letters
const RAYS = 26; // copies stacked to build the light shafts; fewer is cheaper
const DRIFT = 0.00022; // how fast the light source wanders behind the wall

export default function LettersCutFromLightWithMovingRays() {
  const box = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = box.current;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const mask = document.createElement("canvas");
    const m = mask.getContext("2d");
    const rays = document.createElement("canvas");
    const r4 = rays.getContext("2d");
    if (!m || !r4) return;

    let w = 0;
    let h = 0;
    let frame = 0;
    let visible = true;
    const start = performance.now();

    const build = () => {
      const r = host.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mask.width = Math.round(w);
      mask.height = Math.round(h);
      rays.width = Math.max(1, Math.round(w / 3));
      rays.height = Math.max(1, Math.round(h / 3));
      let fs = h * 0.62;
      const font = (s: number) => `800 ${s}px ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif`;
      m.font = font(fs);
      const spacing = fs * 0.08;
      const tw = m.measureText(WORD).width + spacing * (WORD.length - 1);
      if (tw > w * 0.84) fs *= (w * 0.84) / tw;
      m.font = font(fs);
      const sp = fs * 0.08;
      const total = m.measureText(WORD).width + sp * (WORD.length - 1);
      const g = m.createLinearGradient(0, h * 0.5 - fs * 0.4, 0, h * 0.5 + fs * 0.4);
      g.addColorStop(0, LIGHT[0]);
      g.addColorStop(1, LIGHT[1]);
      m.clearRect(0, 0, mask.width, mask.height);
      m.fillStyle = g;
      m.textBaseline = "middle";
      let x = (w - total) / 2;
      for (const ch of WORD) {
        m.fillText(ch, x, h * 0.52);
        x += m.measureText(ch).width + sp;
      }
    };

    const draw = (now: number) => {
      const t = now - start;
      const lx = w / 2 + Math.cos(t * DRIFT) * w * 0.28;
      const ly = h * 0.42 + Math.sin(t * DRIFT * 1.7) * h * 0.22;
      const dpr = canvas.width / w;
      const q = rays.width / w;
      r4.setTransform(1, 0, 0, 1, 0, 0);
      r4.clearRect(0, 0, rays.width, rays.height);
      r4.globalCompositeOperation = "lighter";
      for (let i = RAYS; i >= 1; i -= 1) {
        const s = 1 + i * 0.032;
        r4.globalAlpha = 0.1 * (1 - i / (RAYS + 1));
        r4.setTransform(q * s, 0, 0, q * s, q * lx * (1 - s), q * ly * (1 - s));
        r4.drawImage(mask, 0, 0, w, h);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      ctx.imageSmoothingEnabled = true;
      ctx.filter = "blur(5px)";
      ctx.drawImage(rays, 0, 0, w, h);
      ctx.filter = "none";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.shadowColor = "rgba(255, 190, 110, 0.65)";
      ctx.shadowBlur = 24;
      ctx.drawImage(mask, 0, 0, w, h);
      ctx.shadowBlur = 0;
    };

    const loop = (now: number) => {
      draw(now);
      frame = requestAnimationFrame(loop);
    };
    const play = () => {
      if (!frame && visible && !reduce) frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    build();
    if (reduce) draw(start + 1200);
    else play();
    const ro = new ResizeObserver(() => {
      build();
      if (reduce) draw(start + 1200);
    });
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) play();
      else stop();
    });
    io.observe(host);
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
    };
  }, [reduce]);

  return (
    <section className="relative overflow-hidden bg-[#0d1016] px-5 py-16 sm:px-10 sm:py-20">
      <style>{`
        .w10lcut-canvas { -webkit-mask-image: linear-gradient(to right, transparent, #000 7%, #000 93%, transparent), linear-gradient(to bottom, transparent, #000 16%, #000 84%, transparent); -webkit-mask-composite: source-in; mask-image: linear-gradient(to right, transparent, #000 7%, #000 93%, transparent), linear-gradient(to bottom, transparent, #000 16%, #000 84%, transparent); mask-composite: intersect; }
        @media (prefers-reduced-motion: reduce) { .w10lcut-canvas { will-change: auto; } }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_35%,#1b2130_0%,#0d1016_70%)]" />
      <div className="relative mx-auto max-w-5xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#b8b2a6]">St. Aldric&apos;s chapel · evening series</p>
        <h1 className="sr-only">Vesper</h1>
        <div ref={box} className="relative mx-auto mt-2 h-[170px] w-full sm:h-[260px] lg:h-[300px]">
          <canvas ref={canvasRef} aria-hidden="true" className="w10lcut-canvas absolute inset-0 h-full w-full" />
        </div>
        <p className="mx-auto mt-2 max-w-lg text-base leading-relaxed text-[#cfc8bb] sm:text-lg">
          Candlelit chamber music under the old timber roof, every Thursday at eight from October to March.
        </p>
        <a
          href="#"
          className="mt-8 inline-flex h-12 items-center rounded-full border border-[#ffc77d]/70 px-7 text-sm font-semibold text-[#ffe2b3] transition hover:bg-[#ffc77d] hover:text-[#0d1016] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc77d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1016]"
        >
          See the season
        </a>
      </div>
    </section>
  );
}

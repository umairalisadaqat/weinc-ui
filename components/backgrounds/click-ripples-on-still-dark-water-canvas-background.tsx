import { useEffect, useRef } from "react";

// Rings spread across dark, still water wherever you click or tap, seen at a low angle so
// each ring is a flattened ellipse. A drop also falls on its own every so often, so the water
// is never empty. Change these: ring colour (rgb), ring speed (px per second), lifetime, drop rate.
const RING = "206,226,224";
const SPEED = 70;
const LIFE = 6;
const DROP_EVERY = 1.8; // seconds between automatic drops
const TILT = 0.38; // ellipse height compared with width

export default function ClickRipplesOnStillWater() {
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
    const drops: number[][] = [[0.72, 0.62, 6.4], [0.3, 0.8, 8.2], [0.88, 0.86, 9.6]];
    let nextDrop = 10.4;
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      while (!reduce && t > nextDrop) {
        drops.push([0.1 + rand() * 0.85, 0.5 + rand() * 0.45, nextDrop]);
        nextDrop += DROP_EVERY * (0.6 + rand() * 0.8);
      }
      while (drops.length && t - drops[0][2] > LIFE) drops.shift();
      for (const [fx, fy, born] of drops) {
        const age = Math.max(0, t - born);
        const fade = Math.pow(1 - age / LIFE, 2);
        for (let k = 0; k < 4; k++) {
          const r = age * SPEED - k * (10 + age * 5);
          if (r <= 4) continue;
          const a = fade * (0.42 - k * 0.09);
          ctx.beginPath();
          ctx.ellipse(fx * w, fy * h, r, r * TILT, 0, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(" + RING + "," + a * 0.18 + ")";
          ctx.lineWidth = 7;
          ctx.stroke();
          ctx.strokeStyle = "rgba(" + RING + "," + a + ")";
          ctx.lineWidth = 1.1 - k * 0.15;
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(fx * w, fy * h + 2, r - 3, (r - 3) * TILT, 0, 0, Math.PI);
          ctx.strokeStyle = "rgba(4,10,14," + a * 0.9 + ")";
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
      }
    };
    const now = () => 12 + (performance.now() - born) / 1000;
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
      draw(reduce ? 12 : now());
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    const io = new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      if (onScreen && !reduce && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);
    const host = canvas.parentElement?.parentElement as HTMLElement;
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("a, button")) return;
      const r = canvas.getBoundingClientRect();
      drops.push([(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, now()]);
      if (reduce) draw(now());
    };
    host.addEventListener("pointerdown", onDown);
    cleanups.push(() => host.removeEventListener("pointerdown", onDown));
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      cleanups.forEach((c) => c());
    };
  }, []);
  return (
    <section className="relative isolate min-h-[640px] cursor-crosshair overflow-hidden bg-[#121e24]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 [background:linear-gradient(180deg,#0e171c_0%,#16262d_55%,#1d323a_100%)]" />
        <div className="absolute inset-x-0 top-[35%] h-[45%] [background:radial-gradient(60%_50%_at_65%_50%,rgba(120,160,165,.12),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-[60%] [background:repeating-linear-gradient(180deg,transparent_0_13px,rgba(170,205,205,.035)_13px_14px)] [mask-image:linear-gradient(180deg,transparent,#000)]" />
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      </div>
      <div className="mx-auto max-w-5xl px-6 pb-60 pt-20 sm:pt-28">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#9fc2c2]">Stillwater Float Studio</p>
        <h1 className="mt-4 max-w-xl cursor-auto text-4xl font-semibold leading-[1.08] tracking-tight text-[#eef4f3] sm:text-6xl">Float for an hour. Leave the week behind.</h1>
        <p className="mt-5 max-w-lg cursor-auto text-lg leading-relaxed text-[#b3c4c4]">Warm salt-water pods in private rooms, with a quiet tea bar for afterwards.</p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <a href="#" className="inline-flex h-12 items-center rounded-full bg-[#dbe9e7] px-7 text-sm font-semibold text-[#121e24] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fc2c2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121e24]">Book a first float</a>
          <span aria-hidden="true" className="text-sm text-[#8fa9aa]">Tap the water</span>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef } from "react";

// A bundle of hairlines strung between two moving edge curves. The second control point is
// interpolated the opposite way, so the bundle twists over itself like a fold of silk.
// Change these: thread count, colours (rgb), opacity and how fast the cloth moves.
const THREADS = 90;
const SAND = "214,190,150";
const GLASS = "143,186,180";
const ALPHA = 0.32;
const SPEED = 1;

export default function SilkFlowingLineBundle() {
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
      const s = t * SPEED;
      const A = [
        h * (0.42 + 0.06 * Math.sin(s * 0.21)),
        w * (0.28 + 0.05 * Math.sin(s * 0.17)), h * (0.2 + 0.12 * Math.sin(s * 0.23 + 1)),
        w * (0.62 + 0.05 * Math.sin(s * 0.19 + 2)), h * (0.32 + 0.12 * Math.sin(s * 0.25 + 2.2)),
        h * (0.3 + 0.08 * Math.sin(s * 0.15 + 3)),
      ];
      const B = [
        h * (1.02 + 0.05 * Math.sin(s * 0.18 + 2.4)),
        w * (0.36 + 0.06 * Math.sin(s * 0.2 + 1.2)), h * (1.15 + 0.1 * Math.sin(s * 0.16 + 0.3)),
        w * (0.7 + 0.05 * Math.sin(s * 0.22 + 4)), h * (1.15 + 0.1 * Math.sin(s * 0.27 + 0.5)),
        h * (0.92 + 0.07 * Math.sin(s * 0.14 + 1)),
      ];
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "rgba(" + SAND + "," + ALPHA * 0.4 + ")");
      grad.addColorStop(0.35, "rgba(" + SAND + "," + ALPHA + ")");
      grad.addColorStop(0.7, "rgba(" + GLASS + "," + ALPHA + ")");
      grad.addColorStop(1, "rgba(" + GLASS + "," + ALPHA * 0.5 + ")");
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = grad;
      ctx.lineWidth = 0.9;
      for (let i = 0; i < THREADS; i++) {
        const u = i / (THREADS - 1);
        const v = 1 - u;
        const wob = 0.02 * Math.sin(s * 0.5 + u * 9);
        ctx.beginPath();
        ctx.moveTo(-0.1 * w, A[0] + (B[0] - A[0]) * u);
        ctx.bezierCurveTo(
          A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u + wob * h,
          A[3] + (B[3] - A[3]) * v, A[4] + (B[4] - A[4]) * v - wob * h,
          1.1 * w, A[5] + (B[5] - A[5]) * u,
        );
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    };
    const now = () => 22 + (performance.now() - born) / 1000;
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
      draw(reduce ? 22 : now());
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
    <section className="relative isolate min-h-[640px] overflow-hidden bg-[#13181b]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 [background:radial-gradient(90%_70%_at_60%_80%,#1f2a2d,transparent)]" />
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 [background:radial-gradient(50%_55%_at_22%_30%,rgba(19,24,27,.9),transparent)]" />
      </div>
      <div className="mx-auto max-w-5xl px-6 pb-56 pt-20 sm:pt-28">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#d6be96]">Marrow and Weft</p>
        <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight text-[#f2ede4] sm:text-6xl">Silk scarves woven and dyed by hand.</h1>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-[#b8bfbd]">Small batches from a two-loom studio, each piece numbered and finished with a rolled hem.</p>
        <a href="#" className="mt-8 inline-flex h-12 items-center rounded-full bg-[#d6be96] px-7 text-sm font-semibold text-[#13181b] transition hover:bg-[#e6d3b2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6be96] focus-visible:ring-offset-2 focus-visible:ring-offset-[#13181b]">See the autumn dye lot</a>
      </div>
    </section>
  );
}

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const LEN = 40; // points in the tail; longer means a longer comet
const WIDTH = 11; // tail thickness at the head, in px
const RGB = "255,232,190"; // tail colour
const dates = [
  { d: "Fri 7 Nov", what: "The Moon and Saturn" },
  { d: "Sat 13 Dec", what: "Watching for meteors" },
  { d: "Fri 9 Jan", what: "The Orion Nebula" },
];
const STARS = [[12, 18, 2], [33, 72, 1.6], [58, 26, 2.2], [76, 64, 1.6], [88, 14, 2], [46, 88, 1.6], [92, 82, 1.6], [22, 48, 2], [68, 44, 1.6], [4, 86, 1.6]]
  .map(([x, y, r]) => `radial-gradient(${r}px ${r}px at ${x}% ${y}%, #fff 50%, transparent 51%)`)
  .join(",");

export default function CometCursorTrailDrawnOnOneCanvas() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current, cv = cvRef.current;
    if (!root || !cv || reduce || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pts: number[] = [];
    let W = 0, H = 0, hx = 0, hy = 0, tx = 0, ty = 0, live = false, frame = 0, idle = 0;
    const t0 = performance.now();
    const size = () => { W = root.clientWidth; H = root.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const loop = (now: number) => {
      if (!live) {
        const t = (now - t0) / 1000;
        tx = W * (0.55 + 0.4 * Math.cos(t * 1.1)); ty = H * (0.5 + 0.34 * Math.sin(t * 1.65));
      }
      hx += (tx - hx) * 0.22; hy += (ty - hy) * 0.22;
      pts.push(hx, hy);
      if (pts.length > LEN * 2) pts.splice(0, 2);
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = "round";
      const n = pts.length / 2;
      for (let i = 1; i < n; i++) {
        const k = i / n;
        ctx.strokeStyle = `rgba(${RGB},${k * k * 0.9})`;
        ctx.lineWidth = WIDTH * k;
        ctx.beginPath(); ctx.moveTo(pts[i * 2 - 2], pts[i * 2 - 1]); ctx.lineTo(pts[i * 2], pts[i * 2 + 1]); ctx.stroke();
      }
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 30);
      g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(0.25, `rgba(${RGB},.5)`); g.addColorStop(1, `rgba(${RGB},0)`);
      ctx.fillStyle = g; ctx.fillRect(hx - 30, hy - 30, 60, 60);
      frame = requestAnimationFrame(loop);
    };
    const start = () => { if (!frame) frame = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = root.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top;
      live = true; clearTimeout(idle); root.removeAttribute("data-kb");
    };
    const onLeave = () => { idle = window.setTimeout(() => { live = false; }, 1500); };
    const onFocus = () => { if (root.querySelector(":focus-visible")) root.setAttribute("data-kb", ""); };
    const onBlur = () => root.removeAttribute("data-kb");
    size();
    const ro = new ResizeObserver(size);
    ro.observe(root);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(root);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("focusin", onFocus);
    root.addEventListener("focusout", onBlur);
    return () => {
      stop(); io.disconnect(); ro.disconnect(); clearTimeout(idle);
      ctx.clearRect(0, 0, W, H);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("focusout", onBlur);
    };
  }, [reduce]);

  return (
    <section ref={rootRef} className="w2cmt-root relative overflow-hidden px-5 py-14 text-[#eef2fb] sm:px-12 sm:py-[72px]" style={{ background: `${STARS}, radial-gradient(90% 70% at 80% 0%, #1b2d5c 0%, transparent 70%), #0b1630` }}>
      <style>{`
        .w2cmt-cv { transition: opacity .4s ease; }
        .w2cmt-root[data-kb] .w2cmt-cv { opacity: 0; }
        @media (prefers-reduced-motion: reduce) { .w2cmt-cv { display: none; } }
      `}</style>
      <canvas ref={cvRef} className="w2cmt-cv pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f2cf8a]">Kestrel Hill Observatory</p>
        <h2 className="mt-3.5 max-w-[34rem] font-serif text-[clamp(2rem,5vw,3.25rem)] font-normal leading-[1.08]">Public nights on the hill this winter</h2>
        <p className="mt-4 max-w-[30rem] leading-relaxed text-[#c9d3ea]">Bring warm layers. Our volunteers set up the big refractor on the lawn and walk you through whatever the sky gives us.</p>
        <ul className="mt-7 max-w-[26rem] border-t border-[#eef2fb]/20">
          {dates.map((x) => (
            <li key={x.d} className="flex gap-4 border-b border-[#eef2fb]/20 py-3 text-[15px]">
              <span className="w-24 shrink-0 tabular-nums text-[#f2cf8a]">{x.d}</span>{x.what}
            </li>
          ))}
        </ul>
        <a href="#" className="mt-7 inline-flex min-h-[46px] items-center rounded-full bg-[#f2cf8a] px-[22px] text-sm font-bold text-[#0b1630] hover:bg-[#f7dca6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1630]">Reserve a telescope slot</a>
      </div>
    </section>
  );
}

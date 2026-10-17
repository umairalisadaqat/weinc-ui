import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const EASE = 0.2; // how quickly the dot follows (0 to 1)
const REST = 0.3; // dot scale away from the type and links
const SIZE = 132; // full dot diameter in px

export default function DifferenceBlendDotCursorInvertingBigType() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const bigRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const root = rootRef.current, dot = dotRef.current, big = bigRef.current;
    if (!root || !dot || !big || reduce || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    root.setAttribute("data-on", "");
    let x = -200, y = -200, s = REST, tx = 0, ty = 0, ts = REST, live = false, frame = 0, idle = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      if (!live) {
        // Idle demo: drift over the big word, swelling as it crosses the letters.
        const t = (now - t0) / 1000, o = root.getBoundingClientRect(), b = big.getBoundingClientRect();
        tx = b.left - o.left + b.width * (0.3 + 0.24 * Math.sin(t * 0.6));
        ty = b.top - o.top + b.height * (0.5 + 0.45 * Math.sin(t * 1.3));
        ts = 1;
      }
      x += (tx - x) * EASE; y += (ty - y) * EASE; s += (ts - s) * 0.14;
      dot.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
      frame = requestAnimationFrame(loop);
    };
    const start = () => { if (!frame) frame = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const o = root.getBoundingClientRect();
      tx = e.clientX - o.left; ty = e.clientY - o.top;
      ts = (e.target as HTMLElement).closest("[data-grow]") ? 1 : REST;
      live = true; clearTimeout(idle); root.removeAttribute("data-kb");
    };
    const onLeave = () => { ts = REST; idle = window.setTimeout(() => { live = false; }, 1500); };
    const onFocus = () => { if (root.querySelector(":focus-visible")) root.setAttribute("data-kb", ""); };
    const onBlur = () => root.removeAttribute("data-kb");
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(root);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("focusin", onFocus);
    root.addEventListener("focusout", onBlur);
    return () => {
      stop(); io.disconnect(); clearTimeout(idle);
      root.removeAttribute("data-on");
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("focusout", onBlur);
    };
  }, [reduce]);

  return (
    <section ref={rootRef} className="w2dif-root relative isolate overflow-hidden bg-[#ece6da] px-5 py-12 text-[#121212] sm:px-12 sm:py-14">
      <style>{`
        .w2dif-dot { position: absolute; left: 0; top: 0; width: ${SIZE}px; height: ${SIZE}px; margin: ${-SIZE / 2}px 0 0 ${-SIZE / 2}px; border-radius: 50%;
          background: #fff; mix-blend-mode: difference; pointer-events: none; opacity: 0; transition: opacity .3s ease; will-change: transform; }
        .w2dif-root[data-on] .w2dif-dot { opacity: 1; }
        .w2dif-root[data-kb] .w2dif-dot { opacity: 0; }
        @media (prefers-reduced-motion: reduce) { .w2dif-dot { display: none; } }
      `}</style>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Orrery Type, specimen sheet</p>
          <a href="#" data-grow className="inline-flex min-h-[40px] items-center text-sm font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#c2410c] focus-visible:ring-offset-4 focus-visible:ring-offset-[#ece6da]">Download trial fonts</a>
        </div>
        <h2 ref={bigRef} data-grow className="my-8 text-[clamp(3rem,14vw,11.5rem)] font-black uppercase leading-[0.86] tracking-[-0.05em]">
          <span className="block">Hollis</span> <span className="block sm:pl-[0.5em]">Grotesk</span> <span className="block">Heavy</span>
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-[26rem] leading-relaxed">A wide, low-contrast sans drawn for signage, posters and anything read from across a room.</p>
          <a href="#" data-grow className="inline-flex min-h-[48px] items-center rounded-full bg-[#121212] px-[26px] text-[15px] font-bold text-[#ece6da] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#c2410c] focus-visible:ring-offset-4 focus-visible:ring-offset-[#ece6da]">License the family</a>
        </div>
      </div>
      <span ref={dotRef} className="w2dif-dot" aria-hidden="true" />
    </section>
  );
}

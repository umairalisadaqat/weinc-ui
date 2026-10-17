import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const TEXT = "The cellar tour starts after dark. Bring a coat, leave your phone, and taste what the stone keeps cool all year.";
const RADIUS = 170; // spotlight size in pixels
const EASE = 0.12; // how quickly the light catches up with the pointer

export default function PointerSpotlightHiddenTextReveal() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [showAll, setShowAll] = useState(false);
  const open = showAll || !!reduce;

  useEffect(() => {
    const stage = stageRef.current;
    const root = rootRef.current;
    if (!stage || !root || open) return;
    let frame = 0;
    let onScreen = true;
    let target: { x: number; y: number } | null = null;
    let idleUntil = 0;
    const cur = { x: stage.clientWidth * 0.3, y: stage.clientHeight * 0.5 };
    const t0 = performance.now();
    const step = (now: number) => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      const t = (now - t0) / 1000;
      const goal = target && now < idleUntil
        ? target
        : { x: w * (0.5 + 0.38 * Math.sin(t * 0.55)), y: h * (0.5 + 0.32 * Math.sin(t * 0.9 + 1.2)) };
      cur.x += (goal.x - cur.x) * EASE;
      cur.y += (goal.y - cur.y) * EASE;
      stage.style.setProperty("--pst-x", `${cur.x.toFixed(1)}px`);
      stage.style.setProperty("--pst-y", `${cur.y.toFixed(1)}px`);
      frame = requestAnimationFrame(step);
    };
    const start = () => { if (onScreen && !frame) frame = requestAnimationFrame(step); };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const move = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      target = { x: e.clientX - r.left, y: e.clientY - r.top };
      idleUntil = performance.now() + 2500;
    };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) start(); else stop(); });
    io.observe(root);
    stage.addEventListener("pointermove", move);
    start();
    return () => { stop(); io.disconnect(); stage.removeEventListener("pointermove", move); };
  }, [open]);

  return (
    <section ref={rootRef} className="pst-root px-5 py-16 sm:px-10 sm:py-20">
      <style>{`
        .pst-root { background: radial-gradient(100% 80% at 50% 0%, #1b1f17 0%, #11140f 70%); color: #f5e6c4; }
        .pst-stage { --pst-x: 30%; --pst-y: 50%; position: relative; display: grid; padding: 8px 0; touch-action: pan-y; }
        .pst-stage > * { grid-area: 1 / 1; }
        .pst-text { font-family: Georgia, "Iowan Old Style", "Times New Roman", serif; font-size: clamp(1.7rem, 4.6vw, 3.4rem);
          line-height: 1.22; letter-spacing: -.015em; margin: 0; }
        .pst-dim { color: #343a2c; }
        .pst-lit { color: #f5e6c4; text-shadow: 0 0 24px rgba(245,198,120,.25);
          -webkit-mask-image: radial-gradient(${RADIUS}px circle at var(--pst-x) var(--pst-y), #000 35%, rgba(0,0,0,.35) 65%, transparent 100%);
          mask-image: radial-gradient(${RADIUS}px circle at var(--pst-x) var(--pst-y), #000 35%, rgba(0,0,0,.35) 65%, transparent 100%); }
        .pst-glow { pointer-events: none; background: radial-gradient(${RADIUS * 1.6}px circle at var(--pst-x) var(--pst-y), rgba(245,198,120,.09), transparent 70%); }
        .pst-stage[data-open] .pst-lit { -webkit-mask-image: none; mask-image: none; }
        .pst-stage[data-open] .pst-glow { display: none; }
        @media (hover: none) { .pst-lit { -webkit-mask-image: none; mask-image: none; } .pst-glow { display: none; } }
        @media (prefers-reduced-motion: reduce) { .pst-lit { -webkit-mask-image: none; mask-image: none; } .pst-glow { display: none; } }
      `}</style>
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d6a85c]">Hollow Oak Cellars</p>
        <div ref={stageRef} className="pst-stage mt-6" data-open={open || undefined}>
          <h2 className="pst-text pst-dim">{TEXT}</h2>
          <p className="pst-text pst-lit" aria-hidden="true">{TEXT}</p>
          <div className="pst-glow" aria-hidden="true" />
        </div>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a href="#" className="inline-flex min-h-[44px] items-center rounded-full bg-[#d6a85c] px-6 text-sm font-semibold text-[#14170f] transition hover:bg-[#e8bf78] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6a85c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#11140f]">
            Book a Friday tour
          </a>
          <button
            type="button"
            aria-pressed={showAll}
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex min-h-[44px] items-center rounded-full border border-[#5b5440] px-5 text-sm font-medium text-[#f5e6c4] transition hover:border-[#d6a85c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6a85c]"
          >
            {showAll ? "Return to spotlight" : "Show full text"}
          </button>
        </div>
      </div>
    </section>
  );
}

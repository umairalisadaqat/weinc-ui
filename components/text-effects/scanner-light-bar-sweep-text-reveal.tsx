import { useEffect, useRef, useState } from "react";

const HEADLINE = "Every page, read once and kept for good.";

export default function ScannerLightBarSweepTextReveal() {
  const rootRef = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setPaused(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef} data-paused={paused || undefined} className="slb-root px-5 py-20 sm:px-10 sm:py-24">
      <style>{`
        .slb-root { background: radial-gradient(90% 80% at 50% 0%, #23282c 0%, #16191c 60%, #111315 100%); color: #e7ece9; }
        .slb-plate { position: relative; display: grid; padding: 28px 22px; border-radius: 14px;
          background: linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.01)); box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); }
        .slb-plate > * { grid-area: 1 / 1; }
        .slb-h { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-weight: 650;
          font-size: clamp(2rem, 6vw, 4.4rem); line-height: 1.04; letter-spacing: -.035em; margin: 0; }
        .slb-ghost { color: transparent; -webkit-text-stroke: 1px rgba(159,227,208,.16); }
        .slb-lit { animation: slb-clip 7s cubic-bezier(.45,.05,.35,1) infinite both; }
        @keyframes slb-clip {
          0% { clip-path: inset(0 0 100% 0); opacity: 1 } 22% { clip-path: inset(0 0 0 0); opacity: 1 }
          88% { clip-path: inset(0 0 0 0); opacity: 1 } 97%, 100% { clip-path: inset(0 0 0 0); opacity: 0 } }
        .slb-track { position: relative; pointer-events: none; animation: slb-move 7s cubic-bezier(.45,.05,.35,1) infinite both; }
        .slb-bar { position: absolute; left: -22px; right: -22px; top: -1px; height: 2px; background: #c9f5e8;
          box-shadow: 0 0 6px 1px rgba(159,227,208,.9), 0 0 28px 6px rgba(159,227,208,.35); }
        .slb-bar::before { content: ""; position: absolute; left: 0; right: 0; bottom: 2px; height: 70px;
          background: linear-gradient(0deg, rgba(159,227,208,.16), transparent); }
        @keyframes slb-move {
          0% { transform: translateY(0); opacity: 0 } 3% { opacity: 1 } 22% { transform: translateY(100%); opacity: 1 }
          27%, 100% { transform: translateY(100%); opacity: 0 } }
        .slb-root[data-paused] .slb-lit, .slb-root[data-paused] .slb-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .slb-lit { animation: none; } .slb-track { display: none; } }
      `}</style>
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#9fe3d0]">Northlight Archiving</p>
        <h1 className="slb-h mt-6">
          <span className="sr-only">{HEADLINE}</span>
          <span className="slb-plate" aria-hidden="true">
            <span className="slb-ghost">{HEADLINE}</span>
            <span className="slb-lit">{HEADLINE}</span>
            <span className="slb-track"><span className="slb-bar" /></span>
          </span>
        </h1>
        <p className="mt-7 max-w-xl text-base leading-relaxed text-[#b4bdb9] sm:text-lg">
          Deeds, letters and ledgers digitised on site, indexed by hand, and returned to you the same week.
        </p>
        <a href="#" className="mt-8 inline-flex min-h-[44px] items-center rounded-md bg-[#9fe3d0] px-6 text-sm font-semibold text-[#0f1513] transition hover:bg-[#c9f5e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe3d0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16191c]">
          Arrange a collection
        </a>
      </div>
    </section>
  );
}

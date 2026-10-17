import { useEffect, useRef, useState, type CSSProperties } from "react";

const LINES = ["We draw buildings", "that settle quietly", "into their streets."];

export default function HairlineRuleLineRiseTextReveal() {
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
    <section ref={rootRef} data-paused={paused || undefined} className="hlu-root px-5 py-20 sm:px-10 sm:py-24">
      <style>{`
        .hlu-root { background: #ffffff; color: #0f172a; }
        .hlu-h { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-weight: 500;
          font-size: clamp(2.1rem, 6.6vw, 4.9rem); line-height: 1.08; letter-spacing: -.04em; margin: 0; }
        .hlu-line { position: relative; display: block; overflow: hidden; padding: .04em 0 .1em; }
        .hlu-line::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: #94a3b8;
          transform-origin: 0 50%; animation: hlu-rule 8s cubic-bezier(.65,0,.25,1) infinite both; animation-delay: calc(var(--i) * 160ms); }
        .hlu-text { display: block; animation: hlu-rise 8s cubic-bezier(.2,.75,.25,1) infinite both; animation-delay: calc(var(--i) * 160ms); }
        @keyframes hlu-rule { 0% { transform: scaleX(0) } 7%, 90% { transform: scaleX(1) } 98%, 100% { transform: scaleX(0); transform-origin: 100% 50% } }
        @keyframes hlu-rise { 0%, 5% { transform: translateY(105%) } 15%, 86% { transform: none } 93%, 100% { transform: translateY(105%) } }
        .hlu-root[data-paused] .hlu-text, .hlu-root[data-paused] .hlu-line::after { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .hlu-text, .hlu-line::after { animation: none; } }
      `}</style>
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_260px] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">Nordquist Architects</p>
          <h1 className="hlu-h mt-6">
            {LINES.map((line, i) => (
              <span key={line} className="hlu-line" style={{ "--i": i } as CSSProperties}>
                <span className="hlu-text">{line}</span>
              </span>
            ))}
          </h1>
        </div>
        <div>
          <p className="text-base leading-relaxed text-slate-600">
            Houses, libraries and small civic halls in timber and brick, designed to sit well beside what was there first.
          </p>
          <a href="#" className="mt-6 inline-flex min-h-[44px] items-center gap-2 border-b border-slate-900 text-sm font-semibold text-slate-900 transition hover:border-slate-500 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-4">
            View selected work
          </a>
        </div>
      </div>
    </section>
  );
}

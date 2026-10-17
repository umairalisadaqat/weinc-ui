import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// The headline. Every letter is revealed by its own clip-path, so any font works.
const HEADLINE = "Flowers that last the whole week.";
const STEP_MS = 45; // time between letters

export default function ClipPathTypewriterHeadline() {
  const rootRef = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const [run, setRun] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setPaused(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  let i = 0;
  const words = HEADLINE.split(" ");
  const total = HEADLINE.length;

  return (
    <section
      ref={rootRef}
      data-paused={paused ? "true" : "false"}
      data-still={reduce ? "true" : "false"}
      className="cpt-root px-4 py-20 sm:py-28"
      style={{ ["--cpt-step" as string]: `${STEP_MS}ms` }}
    >
      <style>{`
        .cpt-root { background: linear-gradient(160deg, #fcebdc 0%, #f6e4e4 45%, #ece3f1 100%); }
        .cpt-h { font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif; font-weight: 500; color: #3b1d3a; font-size: clamp(2.25rem, 6.5vw, 4.5rem); line-height: 1.08; letter-spacing: -0.01em; }
        .cpt-w { display: inline-block; white-space: nowrap; }
        .cpt-c { position: relative; display: inline-block; }
        .cpt-g { display: inline-block; clip-path: inset(0 100% 0 0); animation: cpt-in 90ms ease-out both; animation-delay: calc(var(--i) * var(--cpt-step)); }
        .cpt-c::after { content: ""; position: absolute; right: -0.07em; top: 0.12em; bottom: 0.08em; width: 0.06em; min-width: 2px; background: #b4535a; opacity: 0; animation: cpt-caret var(--cpt-step) steps(1); animation-delay: calc(var(--i) * var(--cpt-step)); }
        .cpt-c.cpt-last::after { animation: cpt-blink 1.05s steps(1) infinite; animation-delay: calc(var(--i) * var(--cpt-step)); }
        @keyframes cpt-in { to { clip-path: inset(0 -0.2em 0 -0.2em); } }
        @keyframes cpt-caret { 0%, 100% { opacity: 1; } }
        @keyframes cpt-blink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0; } }
        .cpt-root[data-paused="true"] .cpt-g, .cpt-root[data-paused="true"] .cpt-c::after { animation-play-state: paused; }
        .cpt-root[data-still="true"] .cpt-g { animation: none; clip-path: none; }
        .cpt-root[data-still="true"] .cpt-c::after { animation: none; }
        @media (prefers-reduced-motion: reduce) { .cpt-g { animation: none; clip-path: none; } .cpt-c::after { animation: none; } }
      `}</style>
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium text-[#6b3a52]">Petal &amp; Fern, Canal Street</p>
        <h1 className="cpt-h mt-5">
          <span className="sr-only">{HEADLINE}</span>
          <span aria-hidden="true" key={run}>
            {words.map((w, wi) => {
              const letters = [...w].map((ch) => {
                const idx = i++;
                return (
                  <span key={idx} className={`cpt-c${idx === total - 1 ? " cpt-last" : ""}`} style={{ ["--i" as string]: idx }}>
                    <span className="cpt-g">{ch}</span>
                  </span>
                );
              });
              i++; // the space counts as a beat
              return (
                <span key={wi}>
                  <span className="cpt-w">{letters}</span>
                  {wi < words.length - 1 ? " " : null}
                </span>
              );
            })}
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-[#5b3a4f]">Stems cut at dawn from two farms up the valley, wrapped in paper and delivered before lunch.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href="#" className="inline-flex h-11 items-center rounded-full bg-[#3b1d3a] px-6 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4535a] focus-visible:ring-offset-2">Order a bunch</a>
          <button type="button" onClick={() => setRun((r) => r + 1)} className="inline-flex h-11 items-center rounded-full border border-[#3b1d3a]/30 px-5 text-sm font-medium text-[#3b1d3a] hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4535a]">Replay typing</button>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// The typed line. Its length sets the steps() count and the ch width below.
const LINE = "Open until the last loaf sells out.";

export default function ClassicCssTypewriterLine() {
  const rootRef = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setPaused(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={rootRef}
      data-paused={paused ? "true" : "false"}
      data-still={reduce ? "true" : "false"}
      className="ctw-root bg-white px-4 py-20 sm:py-28"
      style={{ ["--ctw-n" as string]: LINE.length }}
    >
      <style>{`
        .ctw-root { container-type: inline-size; }
        .ctw-line {
          display: inline-block; position: relative;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: min(2.75rem, 4.3cqi); font-weight: 600; letter-spacing: 0;
          color: #1e293b; width: calc(var(--ctw-n) * 1ch + 0.6ch); text-align: left; white-space: nowrap;
        }
        .ctw-typed {
          display: inline-block; overflow: hidden; vertical-align: bottom;
          width: calc(var(--ctw-n) * 1ch);
          animation: ctw-type 7s infinite; animation-delay: -1.3s;
        }
        .ctw-caret {
          display: inline-block; width: 0.55ch; height: 1.1em; margin-left: 0.05ch; vertical-align: -0.18em;
          background: #c2410c; animation: ctw-blink 1s steps(1) infinite;
        }
        @keyframes ctw-type {
          0% { width: 0; animation-timing-function: steps(${LINE.length}, end); }
          42% { width: calc(var(--ctw-n) * 1ch); animation-timing-function: linear; }
          86% { width: calc(var(--ctw-n) * 1ch); animation-timing-function: steps(${LINE.length}, end); }
          98%, 100% { width: 0; }
        }
        @keyframes ctw-blink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0; } }
        .ctw-root[data-paused="true"] .ctw-typed, .ctw-root[data-paused="true"] .ctw-caret { animation-play-state: paused; }
        .ctw-root[data-still="true"] .ctw-typed, .ctw-root[data-still="true"] .ctw-caret { animation: none; }
        @media (prefers-reduced-motion: reduce) { .ctw-typed, .ctw-caret { animation: none; } }
      `}</style>
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Marlow Lane Bakery</p>
        <h1 className="mt-6">
          <span className="sr-only">{LINE}</span>
          <span className="ctw-line" aria-hidden="true">
            <span className="ctw-typed">{LINE}</span>
            <span className="ctw-caret" />
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-base text-slate-600">Doors at seven, rye on Tuesdays, and the oven stays warm until the shelves are empty.</p>
        <a href="#" className="mt-8 inline-flex h-11 items-center rounded-full bg-slate-900 px-6 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2">See today&apos;s bake</a>
      </div>
    </section>
  );
}

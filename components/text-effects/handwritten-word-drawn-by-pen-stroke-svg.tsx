import { useEffect, useRef, useState } from "react";

// One continuous cursive stroke for "hello", then a separate underline swash.
const WORD_PATH =
  "M20 160 C50 140 95 80 100 50 C104 28 86 22 80 40 C72 70 70 130 68 170 C76 135 96 110 112 112 C128 114 128 140 126 160 C125 172 140 172 152 160 C172 146 200 132 196 118 C192 104 168 108 164 128 C160 148 170 170 192 168 C214 166 232 120 244 70 C252 38 238 22 228 42 C218 64 214 130 222 160 C228 172 244 170 256 158 C272 140 290 110 300 66 C308 36 294 22 284 42 C274 66 270 130 278 160 C284 172 300 170 312 158 C318 140 334 116 350 116 C372 116 378 150 362 166 C348 178 326 166 332 142 C336 126 356 118 372 122 C386 126 396 118 410 112";
const SWASH_PATH = "M70 190 C160 178 290 182 400 172";

export default function HandwrittenWordDrawnByPenStroke() {
  const root = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={root} data-paused={visible ? "false" : "true"} className="w10pen relative overflow-hidden bg-[#f7f2e8] px-5 py-16 sm:px-10 sm:py-20">
      <style>{`
        .w10pen { --w10pen-ink: #1f2a44; --w10pen-cycle: 8s; --w10pen-weight: 7; }
        .w10pen-lines { background: repeating-linear-gradient(to bottom, transparent 0 39px, rgba(31,42,68,0.07) 39px 40px); }
        .w10pen-word, .w10pen-swash { fill: none; stroke: var(--w10pen-ink); stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; }
        .w10pen-word { stroke-width: var(--w10pen-weight); stroke-dashoffset: 0; animation: w10pen-write var(--w10pen-cycle) cubic-bezier(0.45, 0.05, 0.4, 1) infinite; }
        .w10pen-swash { stroke-width: 4; stroke-dashoffset: 0; animation: w10pen-swash var(--w10pen-cycle) ease-out infinite; }
        @keyframes w10pen-write { 0% { stroke-dashoffset: 1; opacity: 1; } 30% { stroke-dashoffset: 0; } 86% { stroke-dashoffset: 0; opacity: 1; } 96% { stroke-dashoffset: 0; opacity: 0; } 100% { stroke-dashoffset: 1; opacity: 0; } }
        @keyframes w10pen-swash { 0%, 29% { stroke-dashoffset: 1; opacity: 1; } 37% { stroke-dashoffset: 0; } 86% { stroke-dashoffset: 0; opacity: 1; } 96% { stroke-dashoffset: 0; opacity: 0; } 100% { stroke-dashoffset: 1; opacity: 0; } }
        .w10pen[data-paused="true"] .w10pen-word, .w10pen[data-paused="true"] .w10pen-swash { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .w10pen-word, .w10pen-swash { animation: none; stroke-dashoffset: 0; } }
      `}</style>
      <div aria-hidden="true" className="w10pen-lines pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-4xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6b5b45]">Tallow &amp; Quill stationers</p>
        <h1 className="mt-4">
          <span className="sr-only">hello</span>
          <svg aria-hidden="true" viewBox="0 0 430 205" className="mx-auto block h-auto w-full max-w-[560px]">
            <path className="w10pen-word" pathLength={1} d={WORD_PATH} />
            <path className="w10pen-swash" pathLength={1} d={SWASH_PATH} />
          </svg>
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-[#4a4033] sm:text-lg">
          Letterpress cards, cotton paper and bottled fountain pen ink, wrapped by hand and posted every weekday.
        </p>
        <a
          href="#"
          className="mt-8 inline-flex h-12 items-center rounded-full bg-[#1f2a44] px-7 text-sm font-semibold text-[#f7f2e8] transition hover:bg-[#2f3e63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a44] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f2e8]"
        >
          Browse new cards
        </a>
      </div>
    </section>
  );
}

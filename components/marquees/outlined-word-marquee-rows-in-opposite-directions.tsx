import { useEffect, useRef, useState } from "react";

// Two rows of big words for a neighbourhood bakery. The top row runs left, the bottom row runs right.
const rowA = ["Country sourdough", "Seeded rye", "Morning buns", "Spelt loaf"];
const rowB = ["Baked before six", "Milled nearby", "Long ferment", "Wood fired"];
const SPEED = 42; // seconds per loop; the second row runs a little slower

function Row({ words, dir }: { words: string[]; dir: "l" | "r" }) {
  const group = (dup: boolean) => (
    <span className="w3wrd-group" aria-hidden={dup ? "true" : undefined}>
      {words.map((w, i) => (
        <span key={w} className="flex items-center gap-8 sm:gap-12">
          <span className={i % 2 ? "w3wrd-line" : "w3wrd-fill"}>{w}</span>
          <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" className="shrink-0 fill-[#b5562f]"><circle cx="10" cy="10" r="6" /></svg>
        </span>
      ))}
    </span>
  );
  return (
    <div className={`w3wrd-track w3wrd-${dir}`}>
      {group(false)}
      {group(true)}
    </div>
  );
}

export default function OutlinedWordMarqueeRowsInOppositeDirections() {
  const root = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const [off, setOff] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOff(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={root}
      data-paused={paused ? "" : undefined}
      data-off={off ? "" : undefined}
      className="w3wrd overflow-hidden bg-[#f3ece0] py-16 text-[#2b2118] sm:py-20"
      style={{ ["--w3wrd-speed" as string]: `${SPEED}s` }}
    >
      <style>{`
        .w3wrd-view { overflow: hidden; }
        .w3wrd-track { display: flex; width: max-content; animation: w3wrd-run var(--w3wrd-speed) linear infinite; }
        .w3wrd-r { animation-direction: reverse; animation-duration: calc(var(--w3wrd-speed) * 1.25); }
        .w3wrd-group { display: flex; align-items: center; gap: 2rem; padding-right: 2rem; white-space: nowrap; font-family: ui-serif, Georgia, serif; font-size: clamp(44px, 8vw, 104px); line-height: 1.1; letter-spacing: -0.03em; }
        @media (min-width: 640px) { .w3wrd-group { gap: 3rem; padding-right: 3rem; } }
        .w3wrd-fill { color: #2b2118; }
        .w3wrd-line { color: transparent; -webkit-text-stroke: 1.5px #2b2118; font-style: italic; }
        .w3wrd[data-paused] .w3wrd-track, .w3wrd[data-off] .w3wrd-track, .w3wrd-view:hover .w3wrd-track { animation-play-state: paused; }
        @keyframes w3wrd-run { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          .w3wrd-track { animation: none; width: auto; padding: 0 20px; }
          .w3wrd-group { flex-wrap: wrap; white-space: normal; row-gap: 0; font-size: clamp(34px, 6vw, 64px); }
          .w3wrd-group[aria-hidden] { display: none; }
          .w3wrd-toggle, .w3wrd-r { display: none; }
        }
      `}</style>
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[#7a4a2c]">Hollis Street Bakery</h2>
        <p className="max-w-sm text-base leading-relaxed text-[#4a3b2e]">Country sourdough, seeded rye, spelt and morning buns, from a wood oven lit at four.</p>
      </div>
      <div className="w3wrd-view mt-10 space-y-2 sm:mt-14" aria-hidden="true">
        <Row words={rowA} dir="l" />
        <Row words={rowB} dir="r" />
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl px-5">
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
          className="w3wrd-toggle inline-flex h-11 items-center gap-2 rounded-full bg-[#2b2118] px-5 text-sm font-medium text-[#f3ece0] hover:bg-[#3d2f23] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b2118] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3ece0]"
        >
          {paused ? "Play the words" : "Pause the words"}
        </button>
      </div>
    </section>
  );
}

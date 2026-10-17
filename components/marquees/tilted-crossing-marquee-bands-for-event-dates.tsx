import { useEffect, useRef, useState } from "react";

// Words on the two crossing bands. The same facts appear in plain text under them.
const front = ["Open studio weekend", "18 and 19 October", "Free entry", "Kiln firing at noon"];
const back = ["Throwing demos", "Seconds sale", "Tea in the yard", "Kids clay table"];
const SPEED = 30; // seconds per loop for the front band

function Band({ words, tone, dir }: { words: string[]; tone: "front" | "back"; dir: "l" | "r" }) {
  const group = (dup: boolean) => (
    <span className="w3tlt-group" aria-hidden={dup ? "true" : undefined}>
      {words.map((w) => (
        <span key={w} className="inline-flex items-center gap-6">
          {w}
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="fill-current opacity-70"><rect x="3" y="3" width="10" height="10" transform="rotate(45 8 8)" /></svg>
        </span>
      ))}
    </span>
  );
  return (
    <div className={`w3tlt-band w3tlt-${tone}`}>
      <div className={`w3tlt-track w3tlt-${dir}`}>
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}

export default function TiltedCrossingMarqueeBandsForEventDates() {
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
      className="w3tlt overflow-hidden bg-[#f1e4d8] py-16 text-[#2a1a12]"
      style={{ ["--w3tlt-speed" as string]: `${SPEED}s` }}
    >
      <style>{`
        .w3tlt-stage { position: relative; height: 220px; }
        .w3tlt-band { position: absolute; left: -10%; right: -10%; top: 50%; overflow: hidden; }
        .w3tlt-front { transform: translateY(-50%) rotate(-4deg); background: #b4532a; color: #fff6ee; z-index: 2; box-shadow: 0 18px 30px -18px rgba(70,30,10,.55); }
        .w3tlt-back { transform: translateY(-50%) rotate(3.5deg); background: #2a1a12; color: #f1e4d8; }
        .w3tlt-track { display: flex; width: max-content; animation: w3tlt-run var(--w3tlt-speed) linear infinite; }
        .w3tlt-r { animation-direction: reverse; animation-duration: calc(var(--w3tlt-speed) * 1.4); }
        .w3tlt-group { display: flex; align-items: center; gap: 24px; padding: 0 24px 0 0; height: 64px; white-space: nowrap; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; text-transform: uppercase; }
        .w3tlt-back .w3tlt-group { height: 52px; font-size: 16px; font-weight: 600; letter-spacing: .12em; }
        .w3tlt[data-paused] .w3tlt-track, .w3tlt[data-off] .w3tlt-track { animation-play-state: paused; }
        @keyframes w3tlt-run { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          .w3tlt-track { animation: none; }
          .w3tlt-toggle { display: none; }
        }
      `}</style>
      <div className="w3tlt-stage" aria-hidden="true">
        <Band words={back} tone="back" dir="r" />
        <Band words={front} tone="front" dir="l" />
      </div>
      <div className="mx-auto mt-6 flex max-w-5xl flex-col gap-6 px-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Redbank Pottery open studio</h2>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-[#5a4234]">Saturday 18 and Sunday 19 October, 10:00 to 17:00, free entry. Throwing demos, a seconds sale, tea in the yard and a clay table for children, with the kiln opened at noon.</p>
        </div>
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
          className="w3tlt-toggle inline-flex h-11 shrink-0 items-center self-start rounded-full border-2 border-[#2a1a12] px-5 text-sm font-semibold hover:bg-[#2a1a12] hover:text-[#f1e4d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4532a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f1e4d8] sm:self-auto"
        >
          {paused ? "Play bands" : "Pause bands"}
        </button>
      </div>
    </section>
  );
}

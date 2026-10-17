import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";

// Sample figure for a made-up courier. VALUE is shown to one decimal place on the last (tenths) drum.
const VALUE = 48306.4;
const WHOLE_DRUMS = 5; // drums before the decimal point
const DURATION = 2400; // ms for the full roll
const CELL = 1.3; // em, height of one digit window

const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
const full = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const group = new Intl.NumberFormat("en-US").formatToParts(1000).find((p) => p.type === "group")?.value ?? ",";

/** Position of each drum, tenths first. Higher drums only turn while every drum below is passing 9 to 0. */
function drumPositions(value: number, count: number) {
  const ticks = Math.round(value * 10 * 1e6) / 1e6;
  const out: number[] = [];
  for (let p = 0; p < count; p++) {
    const unit = Math.pow(10, p);
    const digit = Math.floor(ticks / unit) % 10;
    if (p === 0) {
      out.push(ticks % 10);
      continue;
    }
    const below = ticks % unit;
    const carry = Math.max(0, below - (unit - 1));
    out.push(digit + carry);
  }
  return out;
}

function Drum({ pos, light }: { pos: number; light?: boolean }) {
  return (
    <span
      className={`relative inline-block h-[1.3em] w-[0.86em] overflow-hidden rounded-[3px] ${light ? "bg-[#ece6d8] text-[#1c1d20]" : "bg-[#141518] text-[#eee8da]"}`}
    >
      <span className="absolute inset-x-0 top-0 block will-change-transform" style={{ transform: `translateY(${-pos * CELL}em)` }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
          <span key={i} className="flex h-[1.3em] items-center justify-center">{d}</span>
        ))}
      </span>
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background: light
            ? "linear-gradient(180deg, rgba(40,30,10,.55), rgba(40,30,10,0) 32%, rgba(255,255,255,.18) 48%, rgba(40,30,10,0) 64%, rgba(40,30,10,.55))"
            : "linear-gradient(180deg, rgba(0,0,0,.85), rgba(0,0,0,0) 34%, rgba(255,255,255,.07) 48%, rgba(0,0,0,0) 62%, rgba(0,0,0,.85))",
        }}
      />
    </span>
  );
}

export default function RollingOdometerCounter() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(VALUE);
  const runRef = useRef<() => void>(() => {});

  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduce) {
      setShown(VALUE);
      return;
    }
    let raf = 0;
    let start = 0;
    let elapsed = 0;
    let visible = false;
    let done = false;
    const tick = (now: number) => {
      if (!start) start = now - elapsed;
      elapsed = now - start;
      const p = Math.min(1, elapsed / DURATION);
      setShown(VALUE * easeOut(p));
      done = p >= 1;
      if (!done && visible) raf = requestAnimationFrame(tick);
    };
    runRef.current = () => {
      cancelAnimationFrame(raf);
      elapsed = 0;
      start = 0;
      done = false;
      if (visible) raf = requestAnimationFrame(tick);
    };
    setShown(0);
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        cancelAnimationFrame(raf);
        start = 0;
        if (visible && !done) raf = requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  const replay = useCallback(() => runRef.current(), []);
  const pos = drumPositions(shown, WHOLE_DRUMS + 1).reverse();
  const whole = pos.slice(0, WHOLE_DRUMS);

  return (
    <section ref={rootRef} className="relative overflow-hidden bg-[#202226] px-5 py-16 text-[#eee8da] sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(80% 60% at 50% 0%, rgba(214,180,120,.14), rgba(0,0,0,0) 70%)" }}
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#d6b478]">Cobble Lane Couriers</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Miles ridden by bike this year</h2>

        <div className="mt-10 rounded-2xl bg-gradient-to-b from-[#c9a76a] via-[#8c6b37] to-[#c19b5c] p-[3px] shadow-[0_24px_60px_-20px_rgba(0,0,0,.8)]">
          <div className="rounded-[14px] bg-gradient-to-b from-[#2c2e33] to-[#17181b] px-3 py-4 sm:px-5 sm:py-5">
            <p className="font-mono text-[clamp(2.4rem,9vw,4.5rem)] font-semibold leading-none">
              <span className="sr-only">{full.format(VALUE)} miles</span>
              <span aria-hidden="true" className="flex items-center gap-[0.08em] tabular-nums">
                {whole.map((p, i) => (
                  <span key={i} className="flex items-center gap-[0.08em]">
                    {i === WHOLE_DRUMS - 3 && <span className="w-[0.3em] self-end pb-[0.1em] text-center text-[0.6em] text-[#8f8a80]">{group}</span>}
                    <Drum pos={p} />
                  </span>
                ))}
                <span className="w-[0.25em] self-end pb-[0.12em] text-center text-[0.6em] text-[#8f8a80]">.</span>
                <Drum pos={pos[WHOLE_DRUMS]} light />
              </span>
            </p>
          </div>
        </div>

        <p className="mt-8 max-w-md text-sm leading-relaxed text-[#b9b3a7]">
          Sample figure for a made-up courier. Each drum only turns while the one to its right passes nine.
        </p>
        <button
          type="button"
          onClick={replay}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-full border border-[#d6b478]/40 px-4 text-sm text-[#eee8da] transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b478]"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Roll it again
        </button>
      </div>
    </section>
  );
}

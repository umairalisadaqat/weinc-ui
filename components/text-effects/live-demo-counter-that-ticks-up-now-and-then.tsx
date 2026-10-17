import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// Demo only: a made-up refill shop's count that a timer nudges up. Wire `bump` to real data in your app.
const START = 1284;
const INTRO_FROM = 1180; // the first count runs up from here
const INTRO_MS = 1000;
const MIN_GAP = 1800; // ms between ticks, randomised up to MAX_GAP
const MAX_GAP = 4200;

const fmt = new Intl.NumberFormat("en-US");
const css = `
@keyframes lvc-in{from{transform:translateY(55%);opacity:0;filter:blur(2px)}to{transform:none;opacity:1;filter:none}}
@keyframes lvc-chip{0%{transform:translateY(6px);opacity:0}15%{transform:none;opacity:1}75%{opacity:1}100%{transform:translateY(-8px);opacity:0}}
@keyframes lvc-dot{0%,100%{opacity:.35}50%{opacity:1}}
.lvc-digit{display:inline-block;animation:lvc-in .42s cubic-bezier(.2,.8,.2,1) both}
.lvc-chip{animation:lvc-chip 1.6s ease-out both}
.lvc-dot{animation:lvc-dot 2.4s ease-in-out infinite}
[data-paused="true"] .lvc-dot{animation-play-state:paused}
@media (prefers-reduced-motion: reduce){.lvc-digit,.lvc-chip,.lvc-dot{animation:none}}
`;

export default function LiveDemoCounter() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const [count, setCount] = useState(START);
  const [last, setLast] = useState({ by: 0, n: 0 });
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduce) {
      setCount(START);
      return;
    }
    let raf = 0;
    let timer = 0;
    let value = START;
    let introDone = false;
    let started = 0;
    setCount(INTRO_FROM);
    const intro = (t: number) => {
      if (!started) started = t;
      const p = Math.min(1, (t - started) / INTRO_MS);
      setCount(Math.round(INTRO_FROM + (START - INTRO_FROM) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(intro);
      else {
        introDone = true;
        queue(600);
      }
    };
    const bump = () => {
      const by = 1 + Math.floor(Math.random() * 3);
      value += by;
      setCount(value);
      setLast((l) => ({ by, n: l.n + 1 }));
      queue(MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP));
    };
    const queue = (ms: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(bump, ms);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        const on = entry.isIntersecting;
        setPaused(!on);
        window.clearTimeout(timer);
        cancelAnimationFrame(raf);
        if (!on) return;
        if (introDone) queue(MIN_GAP);
        else {
          started = 0;
          raf = requestAnimationFrame(intro);
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  const text = fmt.format(count);
  const width = fmt.format(START + 9000).length; // room for growth without the layout moving
  return (
    <section ref={rootRef} data-paused={paused} className="relative overflow-hidden bg-[#0d1624] px-5 py-16 text-[#e8eef4] sm:py-20">
      <style>{css}</style>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(70% 60% at 50% 110%, rgba(84,170,160,.22), rgba(13,22,36,0) 70%)" }}
      />
      <div className="relative mx-auto max-w-xl">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-[#a8bccc]">Bramble Refill Shop</p>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#7fd1c3]/30 px-3 py-1 text-xs font-medium text-[#9fe0d4]">
              <span aria-hidden="true" className="lvc-dot h-1.5 w-1.5 rounded-full bg-[#7fd1c3]" />
              Demo
            </span>
          </div>
          <h2 className="mt-6 text-base font-medium text-[#c9d6e2]">Jars refilled today</h2>
          <div className="mt-2 flex items-end gap-3">
            <p className="text-6xl font-semibold leading-none tracking-tight tabular-nums sm:text-7xl">
              <span className="sr-only">{fmt.format(Math.max(count, START))} jars, a sample figure</span>
              <span aria-hidden="true" className="inline-flex overflow-hidden py-1" style={{ minWidth: `${width * 0.62}em` }}>
                {text.split("").map((c, i) => (
                  <span key={`${i}-${c}-${text.length}`} className={/\d/.test(c) ? "lvc-digit" : "text-[#6f8597]"}>
                    {c}
                  </span>
                ))}
              </span>
            </p>
            {last.n > 0 && (
              <span key={last.n} aria-hidden="true" className="lvc-chip mb-2 rounded-md bg-[#7fd1c3]/15 px-2 py-0.5 text-sm font-medium tabular-nums text-[#9fe0d4]">
                +{last.by}
              </span>
            )}
          </div>
          <p className="mt-6 border-t border-white/10 pt-5 text-sm leading-relaxed text-[#a8bccc]">
            Demo counter with sample numbers: a timer adds one to three every few seconds. In your app, call the same update when a real event arrives.
          </p>
        </div>
      </div>
    </section>
  );
}

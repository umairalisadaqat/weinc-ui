import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// Sample figures for a made-up garden care firm. The first is the big ring.
const rings = [
  { value: 94, label: "Visits done on the booked day" },
  { value: 81, label: "Clients who rebook within a year" },
  { value: 67, label: "Green waste composted on site" },
];
const DURATION = 1600; // ms for a ring to fill
const STAGGER = 180;
const TICKS = 50;

const pct = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 });
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function Ring({ value, size, big }: { value: number; size: number; big?: boolean }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className="-rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(233,240,220,.12)" strokeWidth={big ? 5 : 7} />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="url(#pcr-grad)"
        strokeWidth={big ? 5 : 7}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        opacity={value > 0.2 ? 1 : 0}
      />
      {big &&
        Array.from({ length: TICKS }, (_, i) => {
          const a = (i / TICKS) * Math.PI * 2;
          const lit = (i / TICKS) * 100 < value;
          return (
            <line
              key={i}
              x1={50 + Math.cos(a) * 47.5}
              y1={50 + Math.sin(a) * 47.5}
              x2={50 + Math.cos(a) * 49.5}
              y2={50 + Math.sin(a) * 49.5}
              stroke={lit ? "#d9e7a6" : "rgba(233,240,220,.18)"}
              strokeWidth="0.7"
            />
          );
        })}
    </svg>
  );
}

export default function PercentageRingCounter() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const [vals, setVals] = useState(rings.map((r) => r.value));

  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduce) {
      setVals(rings.map((r) => r.value));
      return;
    }
    setVals(rings.map(() => 0));
    let raf = 0;
    let start = 0;
    let elapsed = 0;
    let visible = false;
    const tick = (now: number) => {
      if (!start) start = now - elapsed;
      elapsed = now - start;
      const ps = rings.map((_, i) => Math.min(1, Math.max(0, (elapsed - i * STAGGER) / DURATION)));
      setVals(rings.map((r, i) => r.value * easeOut(ps[i])));
      if (ps.some((p) => p < 1) && visible) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        cancelAnimationFrame(raf);
        start = 0;
        if (visible) raf = requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  const [main, ...rest] = rings;
  return (
    <section ref={rootRef} className="relative overflow-hidden bg-[#13261d] px-5 py-16 text-[#eef3e4] sm:py-20">
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="pcr-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a9c97a" />
            <stop offset="1" stopColor="#e6eeb8" />
          </linearGradient>
        </defs>
      </svg>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 70% at 30% 40%, rgba(169,201,122,.12), rgba(0,0,0,0) 70%)" }}
      />
      <div className="relative mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-[auto_1fr]">
        <figure className="relative mx-auto h-[min(72vw,280px)] w-[min(72vw,280px)]">
          <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full">
            <Ring value={vals[0]} size={280} big />
          </div>
          <figcaption className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-6xl font-light tabular-nums tracking-tight sm:text-7xl">
              <span className="sr-only">{pct.format(main.value / 100)}</span>
              <span aria-hidden="true" className="grid justify-items-center">
                <span className="invisible col-start-1 row-start-1">{pct.format(main.value / 100)}</span>
                <span className="col-start-1 row-start-1">{pct.format(Math.round(vals[0]) / 100)}</span>
              </span>
            </span>
            <span className="mt-2 max-w-[11rem] text-sm leading-snug text-[#c3cfb3]">{main.label}</span>
          </figcaption>
        </figure>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b8d38a]">Fernway Garden Care</p>
          <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Turning up when we said we would.</h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2">
            {rest.map((r, i) => (
              <li key={r.label} className="flex items-center gap-4">
                <span className="relative h-16 w-16 shrink-0">
                  <Ring value={vals[i + 1]} size={64} />
                </span>
                <span>
                  <span className="block text-2xl font-medium tabular-nums">
                    <span className="sr-only">{pct.format(r.value / 100)}</span>
                    <span aria-hidden="true" className="grid">
                      <span className="invisible col-start-1 row-start-1">{pct.format(r.value / 100)}</span>
                      <span className="col-start-1 row-start-1">{pct.format(Math.round(vals[i + 1]) / 100)}</span>
                    </span>
                  </span>
                  <span className="block text-sm leading-snug text-[#c3cfb3]">{r.label}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-xs text-[#a9b79a]">Sample percentages for a made-up business. Ring and number are drawn from the same value each frame.</p>
        </div>
      </div>
    </section>
  );
}

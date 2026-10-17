import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// Sample figures for a made-up bakery. Edit the values and labels here.
const stats = [
  { value: 18240, decimals: 0, label: "Loaves baked this year" },
  { value: 1312, decimals: 0, label: "Regulars on the stamp card" },
  { value: 4.9, decimals: 1, label: "Average review, out of 5" },
  { value: 12, decimals: 0, label: "Years on Fennel Street" },
];
const DURATION = 1400; // ms each number takes to land
const STAGGER = 140; // ms between one number starting and the next

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const formatters = stats.map(
  (s) => new Intl.NumberFormat("en-US", { minimumFractionDigits: s.decimals, maximumFractionDigits: s.decimals }),
);
const fmt = (i: number, v: number) =>
  formatters[i].format(stats[i].decimals ? v : Math.round(v));

export default function BakeryStatsRowCounter() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState<number[]>(stats.map(() => 1));

  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduce) {
      setProgress(stats.map(() => 1));
      return;
    }
    setProgress(stats.map(() => 0));
    let raf = 0;
    let started = 0;
    let elapsed = 0;
    let visible = false;
    const tick = (now: number) => {
      if (!started) started = now - elapsed;
      elapsed = now - started;
      const next = stats.map((_, i) => Math.min(1, Math.max(0, (elapsed - i * STAGGER) / DURATION)));
      setProgress(next);
      if (next.some((p) => p < 1) && visible) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        cancelAnimationFrame(raf);
        started = 0;
        if (visible) raf = requestAnimationFrame(tick);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  return (
    <section
      ref={rootRef}
      className="relative overflow-hidden bg-[#f4ede1] px-5 py-16 text-[#2a1f16] sm:px-10 sm:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .36 0 0 0 0 .25 0 0 0 .22 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative mx-auto max-w-5xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8a4a24]">Fennel Street Bakehouse</p>
        <h2 className="mt-3 max-w-xl font-serif text-3xl leading-tight sm:text-4xl">Twelve years of early mornings, counted.</h2>
        <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {stats.map((s, i) => {
            const p = progress[i];
            return (
              <div key={s.label} className="relative flex flex-col pt-5">
                <dt className="order-2 mt-2 text-sm leading-snug text-[#5e4d3c]">
                  <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-[#2a1f16]/15" />
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-0 h-[2px] w-full origin-left bg-[#b4532a]"
                    style={{ transform: `scaleX(${easeOut(p)})` }}
                  />
                  {s.label}
                </dt>
                <dd className="order-1 font-serif text-4xl tabular-nums lining-nums sm:text-5xl">
                  <span className="sr-only">{fmt(i, s.value)}</span>
                  <span aria-hidden="true" className="grid">
                    <span className="invisible col-start-1 row-start-1">{fmt(i, s.value)}</span>
                    <span className="col-start-1 row-start-1">{fmt(i, s.value * easeOut(p))}</span>
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>
        <p className="mt-12 text-xs text-[#5e4d3c]">Sample numbers for a made-up bakery, shown to demonstrate the counter.</p>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// Sample takings for a made-up soap maker. The total is the sum of the lines.
const lines = [
  { label: "Bars and liquid soap", amount: 6412.8 },
  { label: "Gift boxes", amount: 3958.25 },
  { label: "Wholesale to two shops", amount: 2475.3 },
];
const CURRENCY = "USD";
const DURATION = 1700; // ms for the total to land
const total = lines.reduce((s, l) => s + l.amount, 0);

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY });
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const cents = (v: number) => Math.round(v * 100) / 100;

function Amount({ value, final, big }: { value: number; final: number; big?: boolean }) {
  const parts = money.formatToParts(cents(value));
  return (
    <>
      <span className="sr-only">{money.format(final)}</span>
      <span aria-hidden="true" className="inline-grid justify-items-end tabular-nums">
        <span className="invisible col-start-1 row-start-1">{money.format(final)}</span>
        <span className="col-start-1 row-start-1">
          {parts.map((p, i) =>
            big && (p.type === "fraction" || p.type === "decimal") ? (
              <span key={i} className="text-[0.55em] align-[0.62em] text-[#2f6b5b]">{p.type === "decimal" ? "" : p.value}</span>
            ) : (
              <span key={i}>{p.value}</span>
            ),
          )}
        </span>
      </span>
    </>
  );
}

export default function CurrencyTotalCounter() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const [p, setP] = useState(1);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduce) {
      setP(1);
      return;
    }
    setP(0);
    let raf = 0;
    let start = 0;
    let elapsed = 0;
    let visible = false;
    const tick = (now: number) => {
      if (!start) start = now - elapsed;
      elapsed = now - start;
      const t = Math.min(1, elapsed / DURATION);
      setP(t);
      if (t < 1 && visible) raf = requestAnimationFrame(tick);
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

  const e = easeOut(p);
  return (
    <section ref={rootRef} className="bg-[#dcebe4] px-5 py-16 text-[#163a31] sm:py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1fr_minmax(0,420px)]">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#2f6b5b]">Saltmarsh Soap Co.</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">October takings, to the cent.</h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-[#2c4f45]">
            The cents run fastest and settle last, so the total feels counted rather than faded in. Sample figures for a made-up shop.
          </p>
        </div>
        <div className="relative rounded-t-lg bg-[#fbfaf6] px-6 pb-10 pt-7 shadow-[0_30px_60px_-30px_rgba(22,58,49,.45),0_2px_6px_rgba(22,58,49,.08)] sm:px-8">
          <div className="flex items-baseline justify-between text-xs uppercase tracking-[0.16em] text-[#4f6b63]">
            <span>Statement</span>
            <span>1 to 31 Oct</span>
          </div>
          <ul className="mt-5 divide-y divide-dashed divide-[#163a31]/20 font-mono text-sm">
            {lines.map((l) => (
              <li key={l.label} className="flex items-baseline justify-between gap-4 py-3">
                <span className="font-sans text-[#2c4f45]">{l.label}</span>
                <span className="text-[#163a31]">
                  <Amount value={l.amount * e} final={l.amount} />
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t-2 border-[#163a31] pt-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[#4f6b63]">Total received</p>
            <p className="mt-1 text-right font-mono text-[clamp(2.2rem,8vw,3.25rem)] font-semibold leading-none tracking-tight">
              <Amount value={total * e} final={total} big />
            </p>
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 -bottom-3 h-3"
            style={{
              background: "radial-gradient(circle at 8px 0, #fbfaf6 7px, transparent 7.5px) -8px 0 / 16px 12px repeat-x",
            }}
          />
        </div>
      </div>
    </section>
  );
}

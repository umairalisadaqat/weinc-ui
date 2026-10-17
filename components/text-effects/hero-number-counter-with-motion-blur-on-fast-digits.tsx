import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// Sample figure for a made-up window cleaner.
const VALUE = 23418;
const DURATION = 2200; // ms for the count
const MAX_BLUR = 6; // px of blur on a digit that is changing faster than the eye can read

const fmt = new Intl.NumberFormat("en-US");
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
const easeOutSpeed = (t: number) => 4 * Math.pow(1 - t, 3); // derivative of easeOut

export default function HeroNumberBlurCounter() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const [t, setT] = useState(1);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduce) {
      setT(1);
      return;
    }
    setT(0);
    let raf = 0;
    let start = 0;
    let elapsed = 0;
    let visible = false;
    const tick = (now: number) => {
      if (!start) start = now - elapsed;
      elapsed = now - start;
      const p = Math.min(1, elapsed / DURATION);
      setT(p);
      if (p < 1 && visible) raf = requestAnimationFrame(tick);
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

  const value = Math.round(VALUE * easeOut(t));
  // Units per 16ms frame; a digit in place p changes speed / 10^p times per frame.
  const speed = t >= 1 ? 0 : (VALUE * easeOutSpeed(t) * 16) / DURATION;
  const text = fmt.format(value);
  const chars = text.split("");
  let place = chars.filter((c) => /\d/.test(c)).length;

  return (
    <section ref={rootRef} className="relative overflow-hidden bg-[#f7f9fb] px-5 py-16 text-[#0f1b2a] sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(70% 55% at 50% 45%, rgba(188,207,226,.45), rgba(247,249,251,0) 70%)" }}
      />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#40566e]">Tidewell Window Cleaning</p>
        <h2 className="mt-6 font-semibold leading-none tracking-[-0.04em]">
          <span className="sr-only">{fmt.format(VALUE)} windows cleaned since 2019</span>
          <span aria-hidden="true" className="grid justify-items-center text-[clamp(4.5rem,19vw,11rem)] tabular-nums">
            <span className="invisible col-start-1 row-start-1">{fmt.format(VALUE)}</span>
            <span className="col-start-1 row-start-1 flex">
              {chars.map((c, i) => {
                if (!/\d/.test(c)) return <span key={i} className="text-[#8aa0b6]">{c}</span>;
                place -= 1;
                const rate = speed / Math.pow(10, place);
                const blur = Math.min(MAX_BLUR, Math.max(0, (rate - 0.15) * 5));
                return (
                  <span
                    key={i}
                    className="inline-block"
                    style={{
                      filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
                      transform: blur > 0.05 ? `scaleY(${1 + blur * 0.02})` : undefined,
                      opacity: 1 - blur * 0.06,
                    }}
                  >
                    {c}
                  </span>
                );
              })}
            </span>
          </span>
        </h2>
        <p aria-hidden="true" className="mt-4 text-lg text-[#33475c] sm:text-xl">windows cleaned since 2019</p>
        <span aria-hidden="true" className="mt-8 h-px w-24 bg-[#0f1b2a]/20" />
        <p className="mt-8 max-w-md text-base leading-relaxed text-[#33475c]">
          Fast digits soften while they spin and sharpen as they slow, the way a real dial looks in motion. A sample figure for a made-up firm.
        </p>
        <a
          href="#"
          className="mt-8 inline-flex h-11 items-center rounded-full bg-[#0f1b2a] px-6 text-sm font-medium text-white transition hover:bg-[#22344a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f1b2a] focus-visible:ring-offset-2"
        >
          Book a clean
        </a>
      </div>
    </section>
  );
}

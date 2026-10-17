import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const WORD = "LENGTHEN";
const MAX_STRETCH = 0.55; // extra height at the peak of the wave (0.55 = 155% tall)
const SCROLL_BOOST = 0.4; // extra stretch added while the page is scrolling
const IDLE_SPEED = 0.0007; // how fast the stretch wanders when nobody scrolls

export default function KineticTypeLineStretchingWithScroll() {
  const root = useRef<HTMLElement>(null);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const spans = letters.current;
    const n = WORD.length;
    const apply = (focus: number, amp: number) => {
      for (let i = 0; i < n; i += 1) {
        const s = spans[i];
        if (!s) continue;
        const k = 1 + amp * Math.exp(-((i - focus) ** 2) / 2.4);
        s.style.transform = `scaleY(${k.toFixed(3)})`;
      }
    };
    if (reduce) {
      apply((n - 1) / 2, MAX_STRETCH * 0.6);
      return;
    }
    let frame = 0;
    let visible = true;
    let lastP = -1;
    let boost = 0;
    let amp = MAX_STRETCH;
    const progress = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      return Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
    };
    const tick = (now: number) => {
      const p = progress();
      if (lastP >= 0) boost = Math.min(SCROLL_BOOST, boost + Math.abs(p - lastP) * 6);
      lastP = p;
      boost *= 0.93;
      amp += (MAX_STRETCH + boost - amp) * 0.12;
      const focus = (n - 1) / 2 + Math.sin(now * IDLE_SPEED - 1.2) * (n / 2) + (p - 0.5) * n;
      apply(focus, amp);
      frame = requestAnimationFrame(tick);
    };
    const play = () => {
      if (!frame && visible) frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) play();
      else stop();
    });
    io.observe(el);
    play();
    return () => {
      stop();
      io.disconnect();
    };
  }, [reduce]);

  return (
    <section ref={root} className="overflow-hidden bg-[#f1ece0] px-5 py-16 sm:px-10 sm:py-20">
      <style>{`
        .w10kin-l { display: inline-block; transform-origin: 50% 100%; will-change: transform; }
        @media (prefers-reduced-motion: reduce) { .w10kin-l { will-change: auto; } }
      `}</style>
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#1f3d2b]">
          <span>Long Room Pilates</span>
          <span className="hidden sm:inline">Reformer · Mat · Barre</span>
        </div>
        <h1 className="mt-10 border-b-2 border-[#1f3d2b] pt-[0.6em] text-center text-[clamp(52px,13.2vw,172px)] font-black leading-[0.8] tracking-[-0.03em] text-[#1f3d2b]">
          <span className="sr-only">Lengthen</span>
          <span aria-hidden="true" className="inline-flex items-end">
            {WORD.split("").map((ch, i) => (
              <span key={i} ref={(node) => { letters.current[i] = node; }} className="w10kin-l">{ch}</span>
            ))}
          </span>
        </h1>
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-md text-base leading-relaxed text-[#3a4a3f] sm:text-lg">
            Slow, small-group classes that undo a week at the desk. Eight people per room, never more.
          </p>
          <a
            href="#"
            className="inline-flex h-12 shrink-0 items-center self-start rounded-full bg-[#1f3d2b] px-7 text-sm font-semibold text-[#f1ece0] transition hover:bg-[#2c5a40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f3d2b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f1ece0] sm:self-auto"
          >
            Book a first class
          </a>
        </div>
      </div>
    </section>
  );
}

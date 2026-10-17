import { useEffect, useRef } from "react";

// speed: pixels of sideways travel per pixel scrolled (negative = moves left). offset: starting shift.
const ROWS = [
  { text: "Roasted slow", speed: -0.5, offset: 40, style: "text-[#f0e9dd]" },
  { text: "Ground to order", speed: 0.32, offset: -260, style: "w6typ-outline" },
  { text: "Poured warm", speed: -0.18, offset: 120, style: "text-[#c9814a]" },
];

export default function OversizedTypeRowsSlidingAtDifferentScrollSpeeds() {
  const box = useRef<HTMLDivElement>(null);
  const rows = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let on = true;
    const draw = () => {
      frame = 0;
      const s = el.scrollTop; // page scroll: use -el.getBoundingClientRect().top
      el.classList.toggle("w6typ-moved", s > 8);
      rows.current.forEach((r, i) => {
        if (r) r.style.transform = `translate3d(${(ROWS[i].offset + (reduce ? 0 : s * ROWS[i].speed)).toFixed(1)}px,0,0)`;
      });
    };
    const req = () => {
      if (on && !frame) frame = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      if (on) req();
    });
    io.observe(el);
    el.addEventListener("scroll", req, { passive: true });
    req();
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      el.removeEventListener("scroll", req);
    };
  }, []);

  return (
    <div ref={box} tabIndex={0} role="region" aria-label="Ironbark Roasters, scrollable preview" className="w6typ relative h-[600px] overflow-y-auto overflow-x-hidden overscroll-contain bg-[#1c1b19] text-[#f0e9dd] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c9814a]">
      <style>{`
        .w6typ-row { will-change: transform; white-space: nowrap; }
        .w6typ-outline { color: #6f675c; }
        .w6typ-hint { transition: opacity .5s ease; }
        .w6typ-moved .w6typ-hint { opacity: 0; }
        @media (prefers-reduced-motion: reduce) { .w6typ-row { will-change: auto; } }
      `}</style>
      <div className="flex items-center justify-between px-6 pt-8 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#c9b8a2]">Ironbark Roasters</p>
        <span className="w6typ-hint rounded-full bg-[#f0e9dd] px-3 py-1.5 text-xs font-medium text-[#1c1b19]" aria-hidden="true">Scroll inside</span>
      </div>
      <h2 className="sr-only">Roasted slow, ground to order, poured warm</h2>
      <div aria-hidden="true" className="mt-10 space-y-2 sm:mt-12">
        {ROWS.map((r, i) => (
          <p key={r.text} ref={(n) => { rows.current[i] = n; }} className={`w6typ-row text-[clamp(64px,13vw,184px)] font-extrabold uppercase leading-[0.92] tracking-[-0.035em] ${r.style}`} style={{ transform: `translate3d(${r.offset}px,0,0)` }}>
            {r.text}
          </p>
        ))}
      </div>
      <div className="mx-auto grid max-w-5xl gap-8 px-6 pb-20 pt-14 sm:grid-cols-2 sm:px-10">
        <p className="max-w-md text-lg leading-relaxed text-[#d8cfc2]">We roast twice a week in a converted tram shed and ship within a day, so the bag on your counter is never more than a week old.</p>
        <div className="flex flex-col items-start gap-4 sm:items-end">
          <a href="#" className="inline-flex h-12 items-center rounded-full bg-[#c9814a] px-6 text-sm font-semibold text-[#1c1b19] transition hover:bg-[#d99662] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0e9dd] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1b19]">Start a subscription</a>
          <a href="#" className="text-sm font-medium text-[#f0e9dd] underline underline-offset-4 hover:text-[#c9814a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9814a]">Visit the tasting bar</a>
        </div>
      </div>
      <div className="h-[420px] border-t border-[#f0e9dd]/10 px-6 pt-10 text-sm text-[#a99e8f] sm:px-10">Open Thursday to Sunday, eight until two.</div>
    </div>
  );
}

import { useEffect, useRef } from "react";

const PRIMARY = "Start an order";
const SECONDARY = "See the menu";
const STAGGER = 22; // ms between letters

export default function TextRollButtonWithLettersRollingUp() {
  const root = useRef<HTMLElement>(null);

  // pauses the idle loop while the section is off screen
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([en]) => { el.toggleAttribute("data-paused", !en.isIntersecting); });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={root} className="w3rol bg-white px-5 py-16 text-slate-900 sm:py-24">
      <style>{`
        .w3rol-line { display: inline-flex; overflow: hidden; line-height: 1.5em; height: 1.5em; }
        .w3rol-c { position: relative; display: inline-block; white-space: pre; transition: transform .5s cubic-bezier(.7,0,.2,1); transition-delay: calc(var(--i) * ${STAGGER}ms); }
        .w3rol-c::after { content: attr(data-l); position: absolute; left: 0; top: 100%; }
        .w3rol-btn:focus-visible .w3rol-c { transform: translateY(-100%); }
        .w3rol-btn:focus-visible { outline: 2px solid #0f172a; outline-offset: 4px; }
        @media (hover: hover) and (pointer: fine) { .w3rol-btn:hover .w3rol-c { transform: translateY(-100%); } }
        /* idle demo: the first button rolls every few seconds; the copy below is identical, so the reset is invisible */
        @keyframes w3rol-roll { 0%, 40% { transform: none; } 58% { transform: translateY(-100%); } 58.1%, 100% { transform: none; } }
        .w3rol-demo .w3rol-c { animation: w3rol-roll 3.2s cubic-bezier(.7,0,.2,1) infinite; animation-delay: calc(var(--i) * ${STAGGER}ms); }
        .w3rol:hover .w3rol-demo .w3rol-c, .w3rol:focus-within .w3rol-demo .w3rol-c { animation: none; }
        .w3rol[data-paused] .w3rol-c { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .w3rol-c { transition: none; } .w3rol-demo .w3rol-c { animation: none; } }
      `}</style>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">Plainsong Coffee</p>
        <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">Order ahead, skip the queue on Mercer Street.</h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">Filter, espresso and a short list of pastries baked downstairs. Your cup is ready when the app says so.</p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a href="#" className="w3rol-btn w3rol-demo inline-flex h-14 items-center rounded-full bg-slate-900 px-8 text-base font-semibold text-white">
            <span className="sr-only">{PRIMARY}</span>
            <span aria-hidden="true" className="w3rol-line">
              {PRIMARY.split("").map((ch, i) => (
                <span key={i} className="w3rol-c" style={{ ["--i" as string]: i }} data-l={ch}>{ch}</span>
              ))}
            </span>
          </a>
          <a href="#" className="w3rol-btn inline-flex h-14 items-center rounded-full border border-slate-300 px-8 text-base font-semibold text-slate-900">
            <span className="sr-only">{SECONDARY}</span>
            <span aria-hidden="true" className="w3rol-line">
              <span className="w3rol-c" style={{ ["--i" as string]: 0 }} data-l={SECONDARY}>{SECONDARY}</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

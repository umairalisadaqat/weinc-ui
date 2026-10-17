import { useEffect, useRef, useState } from "react";

const headline = "We still fix the old sets.";

export default function CrtPhosphorFlickerHeadline() {
  const root = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={root} data-paused={visible ? "false" : "true"} className="w10crt bg-[#17130f] px-4 py-14 sm:px-10 sm:py-20">
      <style>{`
        .w10crt { --w10crt-phosphor: #ffb547; --w10crt-glow: rgba(255, 170, 60, 0.55); --w10crt-roll: 7s; }
        .w10crt-screen { background: radial-gradient(120% 90% at 50% 45%, #2a1c0c 0%, #120c06 62%, #070503 100%); box-shadow: inset 0 0 90px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(255,190,110,0.08), 0 30px 60px -20px rgba(0,0,0,0.7); }
        .w10crt-scan { background: repeating-linear-gradient(to bottom, rgba(0,0,0,0.35) 0 1px, transparent 1px 3px); }
        .w10crt-roll { position: absolute; left: 0; right: 0; top: 0; height: 30%; background: linear-gradient(to bottom, transparent, rgba(255,190,110,0.06) 50%, transparent); transform: translateY(-110%); animation: w10crt-roll var(--w10crt-roll) linear infinite; }
        .w10crt-text { color: var(--w10crt-phosphor); text-shadow: 0 0 2px #ffd28a, 0 0 10px var(--w10crt-glow), 0 0 28px rgba(255,140,30,0.3); animation: w10crt-flicker 3.4s linear infinite; }
        .w10crt-caret { display: inline-block; width: 0.5em; height: 0.85em; margin-left: 0.12em; vertical-align: -0.08em; background: var(--w10crt-phosphor); box-shadow: 0 0 12px var(--w10crt-glow); animation: w10crt-blink 1.1s steps(1, end) infinite; }
        @keyframes w10crt-roll { to { transform: translateY(440%); } }
        @keyframes w10crt-flicker { 0%, 100% { opacity: 1; } 8% { opacity: 0.93; } 9% { opacity: 1; } 47% { opacity: 0.96; } 48% { opacity: 1; } 71% { opacity: 0.94; } 73% { opacity: 1; } }
        @keyframes w10crt-blink { 0% { opacity: 1; } 50% { opacity: 0; } }
        .w10crt[data-paused="true"] .w10crt-roll, .w10crt[data-paused="true"] .w10crt-text, .w10crt[data-paused="true"] .w10crt-caret { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .w10crt-roll, .w10crt-text, .w10crt-caret { animation: none; }
          .w10crt-roll { transform: translateY(120%); }
        }
      `}</style>
      <div className="mx-auto max-w-5xl rounded-[28px] bg-[#2b241d] p-3 shadow-[0_2px_0_rgba(255,255,255,0.06)_inset] sm:p-5">
        <div className="w10crt-screen relative overflow-hidden rounded-[22px] px-5 py-14 sm:px-14 sm:py-20">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden"><div className="w10crt-roll" /></div>
          <div className="relative font-mono">
            <p className="w10crt-text text-xs uppercase tracking-[0.25em] sm:text-sm">Halvorsen TV &amp; Radio Repair · Bench 2</p>
            <h1 className="w10crt-text mt-6 text-[clamp(34px,6.4vw,76px)] font-bold leading-[1.05] tracking-tight">
              {headline}
              <span aria-hidden="true" className="w10crt-caret" />
            </h1>
            <p className="w10crt-text mt-6 max-w-2xl text-sm leading-relaxed sm:text-base">
              Tube televisions, reel decks and valve radios, repaired by hand with a six month warranty on every job.
            </p>
            <a
              href="#"
              className="mt-9 inline-flex h-12 items-center border border-[#ffb547] px-6 text-sm uppercase tracking-widest text-[#ffb547] transition hover:bg-[#ffb547] hover:text-[#120c06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd28a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#120c06]"
            >
              Book a bench slot
            </a>
          </div>
          <div aria-hidden="true" className="w10crt-scan pointer-events-none absolute inset-0" />
        </div>
      </div>
    </section>
  );
}

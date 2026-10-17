import { useEffect, useRef, useState } from "react";

const headline = "Be kind, rewind.";

export default function VhsTrackingWobbleText() {
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
    <section
      ref={root}
      data-paused={visible ? "false" : "true"}
      className="w10vhs relative overflow-hidden bg-[#1a1315] px-5 py-20 sm:px-10 sm:py-24"
    >
      <style>{`
        .w10vhs { --w10vhs-ink: #f4e6cf; --w10vhs-warm: #ff6f59; --w10vhs-cool: #4fd1c5; --w10vhs-speed: 6s; }
        .w10vhs-bg { background: radial-gradient(80% 70% at 50% 40%, #3a2526 0%, #1a1315 70%); }
        .w10vhs-scan { background: repeating-linear-gradient(to bottom, rgba(0,0,0,0.28) 0 2px, transparent 2px 4px); }
        .w10vhs-band { position: absolute; left: 0; right: 0; height: 18%; top: 0; transform: translateY(-120%); background: linear-gradient(to bottom, transparent, rgba(255,240,220,0.07) 40%, rgba(255,240,220,0.12) 50%, rgba(255,240,220,0.07) 60%, transparent); animation: w10vhs-band var(--w10vhs-speed) linear infinite; }
        .w10vhs-stack { position: relative; display: inline-grid; }
        .w10vhs-stack > span { grid-area: 1 / 1; }
        .w10vhs-base { color: var(--w10vhs-ink); text-shadow: -2px 0 rgba(255,111,89,0.55), 2px 0 rgba(79,209,197,0.5), 0 0 18px rgba(255,200,160,0.25); animation: w10vhs-wobble 2.8s ease-in-out infinite; }
        .w10vhs-tear { color: var(--w10vhs-ink); text-shadow: -5px 0 var(--w10vhs-warm), 5px 0 var(--w10vhs-cool); clip-path: inset(0 0 100% 0); animation: w10vhs-tear var(--w10vhs-speed) linear infinite; }
        .w10vhs-osd { animation: w10vhs-osd 1.6s steps(1, end) infinite; }
        @keyframes w10vhs-wobble { 0%, 100% { transform: translateX(0) skewX(0deg); } 30% { transform: translateX(1.5px) skewX(-0.6deg); } 60% { transform: translateX(-1px) skewX(0.4deg); } }
        @keyframes w10vhs-band { from { transform: translateY(-120%); } to { transform: translateY(580%); } }
        @keyframes w10vhs-tear {
          0% { clip-path: inset(0 0 100% 0); transform: translateX(0); }
          20% { clip-path: inset(0 0 82% 0); transform: translateX(9px); }
          40% { clip-path: inset(30% 0 52% 0); transform: translateX(-7px); }
          60% { clip-path: inset(58% 0 24% 0); transform: translateX(11px); }
          80% { clip-path: inset(84% 0 0 0); transform: translateX(-5px); }
          100% { clip-path: inset(100% 0 0 0); transform: translateX(0); }
        }
        @keyframes w10vhs-osd { 0% { opacity: 1; } 50% { opacity: 0.35; } }
        .w10vhs[data-paused="true"] .w10vhs-band, .w10vhs[data-paused="true"] .w10vhs-base, .w10vhs[data-paused="true"] .w10vhs-tear, .w10vhs[data-paused="true"] .w10vhs-osd { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .w10vhs-band, .w10vhs-base, .w10vhs-osd { animation: none; }
          .w10vhs-band { transform: translateY(210%); }
          .w10vhs-tear { animation: none; clip-path: inset(46% 0 40% 0); transform: translateX(6px); }
        }
      `}</style>
      <div aria-hidden="true" className="w10vhs-bg pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="w10vhs-band" />
      </div>
      <div aria-hidden="true" className="absolute left-5 top-5 font-mono text-sm tracking-widest text-[#f4e6cf] sm:left-8 sm:top-7">
        <span className="w10vhs-osd">PLAY ▶</span>
      </div>
      <div aria-hidden="true" className="absolute right-5 top-5 font-mono text-sm tracking-widest text-[#f4e6cf] sm:right-8 sm:top-7">SP 0:04:12</div>
      <div className="relative mx-auto max-w-4xl pt-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#d9b99a]">Corner Video Club · since 1991</p>
        <h1 className="mt-6 font-serif text-[clamp(46px,9vw,108px)] font-bold italic leading-none tracking-tight">
          <span className="sr-only">{headline}</span>
          <span aria-hidden="true" className="w10vhs-stack">
            <span className="w10vhs-base">{headline}</span>
            <span className="w10vhs-tear">{headline}</span>
          </span>
        </h1>
        <p className="mx-auto mt-7 max-w-lg text-base leading-relaxed text-[#e3d3bd] sm:text-lg">
          Four thousand tapes, two working VCRs to borrow, and a late return box that never closes.
        </p>
        <a
          href="#"
          className="mt-9 inline-flex h-12 items-center rounded-md border border-[#f4e6cf]/60 px-6 font-mono text-sm uppercase tracking-widest text-[#f4e6cf] transition hover:bg-[#f4e6cf] hover:text-[#1a1315] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4fd1c5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1315]"
        >
          Browse the shelves
        </a>
      </div>
      <div aria-hidden="true" className="w10vhs-scan pointer-events-none absolute inset-0" />
    </section>
  );
}

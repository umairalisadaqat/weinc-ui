import { useEffect, useRef, useState } from "react";

const OUTER = "FRESH BREAD DAILY · CRUMB & COPPER BAKERY · OPEN FROM SEVEN · ";
const INNER = "SOURDOUGH · RYE · FOCACCIA · BRIOCHE · SEEDED · ";

export default function TextOnCircularPathRotatingBadge() {
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
    <section ref={root} data-paused={visible ? "false" : "true"} className="w10orb bg-[#f5eee2] px-5 py-16 sm:px-10 sm:py-20">
      <style>{`
        .w10orb { --w10orb-copper: #9a4f2a; --w10orb-ink: #2b211b; --w10orb-turn: 36s; }
        .w10orb-outer { transform-origin: 150px 150px; animation: w10orb-spin var(--w10orb-turn) linear infinite; }
        .w10orb-inner { transform-origin: 150px 150px; animation: w10orb-spin calc(var(--w10orb-turn) * 1.5) linear infinite reverse; }
        @keyframes w10orb-spin { to { transform: rotate(360deg); } }
        .w10orb[data-paused="true"] .w10orb-outer, .w10orb[data-paused="true"] .w10orb-inner { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .w10orb-outer, .w10orb-inner { animation: none; } }
      `}</style>
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1.1fr_1fr] md:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9a4f2a]">Crumb &amp; Copper Bakery</p>
          <h1 className="mt-5 font-serif text-[clamp(40px,6vw,68px)] font-semibold leading-[1.05] tracking-tight text-[#2b211b]">
            Bread worth crossing town for.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[#5a4a3e] sm:text-lg">
            Long-fermented loaves baked through the night in a wood-fired oven, on the shelves before the first tram.
          </p>
          <a
            href="#"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-[#2b211b] px-7 text-sm font-semibold text-[#f5eee2] transition hover:bg-[#9a4f2a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a4f2a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5eee2]"
          >
            Order for collection
          </a>
        </div>
        <div className="relative mx-auto w-full max-w-[340px]">
          <p className="sr-only">Fresh bread daily, open from seven.</p>
          <svg aria-hidden="true" viewBox="0 0 300 300" className="block h-auto w-full">
            <defs>
              <path id="w10orb-ring-a" d="M150,150 m-118,0 a118,118 0 1,1 236,0 a118,118 0 1,1 -236,0" />
              <path id="w10orb-ring-b" d="M150,150 m-86,0 a86,86 0 1,1 172,0 a86,86 0 1,1 -172,0" />
            </defs>
            <circle cx="150" cy="150" r="146" fill="#efe3d0" />
            <circle cx="150" cy="150" r="138" fill="none" stroke="#9a4f2a" strokeWidth="1" strokeOpacity="0.5" />
            <circle cx="150" cy="150" r="102" fill="none" stroke="#9a4f2a" strokeWidth="1" strokeOpacity="0.35" />
            <g className="w10orb-outer">
              <text fill="#2b211b" fontSize="17" fontWeight="600" letterSpacing="2" fontFamily="ui-sans-serif, system-ui, sans-serif">
                <textPath href="#w10orb-ring-a" textLength="735" lengthAdjust="spacing">{OUTER}</textPath>
              </text>
            </g>
            <g className="w10orb-inner">
              <text fill="#9a4f2a" fontSize="12" fontWeight="500" letterSpacing="1.5" fontFamily="ui-serif, Georgia, serif" fontStyle="italic">
                <textPath href="#w10orb-ring-b" textLength="535" lengthAdjust="spacing">{INNER}</textPath>
              </text>
            </g>
            <circle cx="150" cy="150" r="66" fill="#2b211b" />
            <g fill="none" stroke="#f5eee2" strokeWidth="2.2" strokeLinecap="round">
              <path d="M150 116 V176" />
              <path d="M150 128 C140 124 134 116 134 108 C142 110 148 118 150 128" />
              <path d="M150 128 C160 124 166 116 166 108 C158 110 152 118 150 128" />
              <path d="M150 144 C140 140 134 132 134 124 C142 126 148 134 150 144" />
              <path d="M150 144 C160 140 166 132 166 124 C158 126 152 134 150 144" />
              <path d="M150 160 C140 156 134 148 134 140 C142 142 148 150 150 160" />
              <path d="M150 160 C160 156 166 148 166 140 C158 142 152 150 150 160" />
            </g>
            <text x="150" y="196" textAnchor="middle" fill="#e6c6a8" fontSize="10" letterSpacing="2.5" fontFamily="ui-sans-serif, system-ui, sans-serif">EST. 2014</text>
          </svg>
        </div>
      </div>
    </section>
  );
}

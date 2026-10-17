import { useEffect, useId, useRef, useState } from "react";

const WORD = "REFILL";

export default function LiquidFillWordRisingToALevel() {
  const root = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);
  const clip = `w10lqf-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

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
      className="w10lqf bg-[linear-gradient(170deg,#fcefe4_0%,#f7dccd_55%,#f1cdbf_100%)] px-5 py-16 sm:px-10 sm:py-20"
    >
      <style>{`
        .w10lqf { --w10lqf-deep: #1d6f73; --w10lqf-light: #59b3ad; --w10lqf-outline: #1a4f53; --w10lqf-level: -170px; }
        .w10lqf-rise { transform: translateY(0); animation: w10lqf-rise 2.2s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards; }
        .w10lqf-bob { animation: w10lqf-bob 3.6s ease-in-out infinite; }
        .w10lqf-front { animation: w10lqf-drift 4.5s linear infinite; }
        .w10lqf-back { animation: w10lqf-drift 7s linear infinite reverse; }
        .w10lqf-bubble { opacity: 0; transform-box: fill-box; animation: w10lqf-bubble 4s ease-in infinite; }
        @keyframes w10lqf-rise { to { transform: translateY(var(--w10lqf-level)); } }
        @keyframes w10lqf-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        @keyframes w10lqf-drift { from { transform: translateX(0); } to { transform: translateX(-500px); } }
        @keyframes w10lqf-bubble { 0% { opacity: 0; transform: translateY(0); } 15% { opacity: 0.8; } 85% { opacity: 0.6; } 100% { opacity: 0; transform: translateY(-120px); } }
        .w10lqf[data-paused="true"] .w10lqf-bob, .w10lqf[data-paused="true"] .w10lqf-front, .w10lqf[data-paused="true"] .w10lqf-back, .w10lqf[data-paused="true"] .w10lqf-bubble { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .w10lqf-rise { animation: none; transform: translateY(var(--w10lqf-level)); }
          .w10lqf-bob, .w10lqf-front, .w10lqf-back, .w10lqf-bubble { animation: none; }
        }
      `}</style>
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7a4a3a]">Tidewell refill stations</p>
        <h1 className="mt-6">
          <span className="sr-only">Refill</span>
          <svg aria-hidden="true" viewBox="0 0 1000 300" className="mx-auto block h-auto w-full max-w-4xl">
            <defs>
              <clipPath id={clip}>
                <text x="500" y="262" textAnchor="middle" textLength="960" lengthAdjust="spacingAndGlyphs" fontSize="270" fontWeight="900" fontFamily="ui-sans-serif, system-ui, Arial, sans-serif">{WORD}</text>
              </clipPath>
            </defs>
            <text x="500" y="262" textAnchor="middle" textLength="960" lengthAdjust="spacingAndGlyphs" fontSize="270" fontWeight="900" fontFamily="ui-sans-serif, system-ui, Arial, sans-serif" fill="#fdf3ea" fillOpacity="0.55">{WORD}</text>
            <g clipPath={`url(#${clip})`}>
              <g className="w10lqf-rise">
                <g className="w10lqf-bob">
                  <g transform="translate(0 270)">
                    <path className="w10lqf-back" fill="var(--w10lqf-light)" d="M0 12 Q125 -10 250 12 T500 12 T750 12 T1000 12 T1250 12 T1500 12 T1750 12 T2000 12 V400 H0 Z" />
                    <path className="w10lqf-front" fill="var(--w10lqf-deep)" d="M0 22 Q125 4 250 22 T500 22 T750 22 T1000 22 T1250 22 T1500 22 T1750 22 T2000 22 V400 H0 Z" />
                    <circle className="w10lqf-bubble" cx="180" cy="200" r="6" fill="#e8fbf7" style={{ animationDelay: "0.2s" }} />
                    <circle className="w10lqf-bubble" cx="430" cy="210" r="4" fill="#e8fbf7" style={{ animationDelay: "1.4s" }} />
                    <circle className="w10lqf-bubble" cx="610" cy="190" r="7" fill="#e8fbf7" style={{ animationDelay: "2.3s" }} />
                    <circle className="w10lqf-bubble" cx="840" cy="205" r="5" fill="#e8fbf7" style={{ animationDelay: "0.9s" }} />
                  </g>
                </g>
              </g>
            </g>
            <text x="500" y="262" textAnchor="middle" textLength="960" lengthAdjust="spacingAndGlyphs" fontSize="270" fontWeight="900" fontFamily="ui-sans-serif, system-ui, Arial, sans-serif" fill="none" stroke="var(--w10lqf-outline)" strokeWidth="3">{WORD}</text>
          </svg>
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-[#5a3a2f] sm:text-lg">
          Bring any bottle to a Tidewell tap for filtered water, still or sparkling, chilled and paid by the litre.
        </p>
        <a
          href="#"
          className="mt-8 inline-flex h-12 items-center rounded-full bg-[#1a4f53] px-7 text-sm font-semibold text-white transition hover:bg-[#1d6f73] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4f53] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7dccd]"
        >
          Find a station near you
        </a>
      </div>
    </section>
  );
}

import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

// The headline is painted on the shop window. What you read on the wall is its shadow.
const hero = {
  lines: ["Bread at", "first light."],
  sign: "Halcyon Bakehouse",
  line: "Sourdough, rye and morning buns out of the oven at six. Gone, most days, by ten.",
  button: "See today's bake",
};

/** The wall out of the sun, and the same wall with the sun on it. Every shadow is simply the first colour again. */
const SHADE = "#6b5f52";
const SUNLIT = "#ffefcf";

/** Leaves of the branch outside the window: position along the twig, side, length and angle in degrees. */
const leaves = [
  { at: 0.08, side: 1, long: 64, turn: 48 },
  { at: 0.2, side: -1, long: 72, turn: -52 },
  { at: 0.33, side: 1, long: 78, turn: 40 },
  { at: 0.45, side: -1, long: 70, turn: -44 },
  { at: 0.58, side: 1, long: 74, turn: 36 },
  { at: 0.7, side: -1, long: 62, turn: -40 },
  { at: 0.82, side: 1, long: 58, turn: 30 },
  { at: 0.93, side: -1, long: 50, turn: -30 },
  { at: 1, side: 1, long: 54, turn: 4 },
];

export default function BakeryHeroWhoseHeadlineIsTheShadowOfWindowLetteringThrownOnAWallByAMovingSun() {
  const reduce = useReducedMotion();
  const steered = useRef(-1e6);
  /** Where the sun is on its pass, from 0 (high, early) to 1 (low and raking). */
  const target = useMotionValue(0.5);
  const sun = useSpring(target, { stiffness: 26, damping: 14, mass: 1.4 });

  useAnimationFrame((t) => {
    if (reduce || performance.now() - steered.current < 2600) return;
    target.set(0.5 + 0.44 * Math.sin(t / 3800 - 0.5));
  });

  // The window stands at right angles to the wall, so its patch of light is stretched along the wall and
  // slopes downhill away from the glass. A lower sun stretches it further and flattens the slope.
  const cast = useTransform(sun, (a) => `matrix(${(0.8 + 0.5 * a).toFixed(4)}, ${(0.21 - 0.13 * a).toFixed(4)}, 0, 1, 0, 0)`);
  const warmth = useTransform(sun, [0, 1], [0, 0.34]);
  const bounce = useTransform(sun, [0, 1], ["34%", "52%"]);
  const bounceX = useTransform(bounce, (v) => `radial-gradient(60% 55% at ${v} 42%, rgba(255,214,150,0.34) 0%, rgba(255,214,150,0) 70%)`);

  function steer(e: ReactPointerEvent<HTMLElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    target.set(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    steered.current = performance.now();
  }

  return (
    <section onPointerMove={steer} className="relative isolate h-[620px] w-full overflow-hidden sm:h-[800px]" style={{ backgroundColor: SHADE }}>
      <style>{`
        @keyframes bakery-shadow-hero-sway { 0%, 100% { transform: rotate(-2.2deg); } 50% { transform: rotate(2.6deg); } }
        @keyframes bakery-shadow-hero-flutter { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(6deg); } }
        .bakery-shadow-hero-branch { transform-origin: 100% 0%; animation: bakery-shadow-hero-sway 7s ease-in-out infinite; }
        .bakery-shadow-hero-leaf { transform-box: fill-box; transform-origin: 0% 50%; animation: bakery-shadow-hero-flutter 3.1s ease-in-out infinite; }
        .bakery-shadow-hero-head { font-size: 14vw; }
        .bakery-shadow-hero-sign { font-size: 2.9vw; }
        .bakery-shadow-hero-transom { height: 13vw; border-bottom: 1.6vw solid ${SHADE}; }
        .bakery-shadow-hero-transom > span + span { border-left: 1.2vw solid ${SHADE}; }
        @media (min-width: 640px) {
          .bakery-shadow-hero-head { font-size: min(10.6vw, 140px); }
          .bakery-shadow-hero-sign { font-size: min(1.5vw, 19px); }
          .bakery-shadow-hero-transom { height: min(7vw, 96px); border-bottom-width: 14px; }
          .bakery-shadow-hero-transom > span + span { border-left-width: 10px; }
        }
        @media (prefers-reduced-motion: reduce) { .bakery-shadow-hero-branch, .bakery-shadow-hero-leaf { animation: none; } }
      `}</style>

      {/* Light that bounces off the lit patch and lifts the wall around it a little. */}
      <motion.div aria-hidden="true" className="absolute inset-0" style={{ background: bounceX }} />

      {/* The patch of sun. Its outline is the window frame; everything inside that blocks light is drawn in the wall's own shade colour. */}
      <motion.div
        className="absolute left-[-3%] top-[9%] origin-top-left blur-[1.4px] will-change-transform sm:top-[7%] sm:blur-[2.2px]"
        style={{ transform: cast }}
      >
        <div className="relative ml-[9vw] w-[72vw] max-w-[860px] sm:ml-[11vw] sm:w-[64vw]" style={{ backgroundColor: SUNLIT, backgroundImage: "linear-gradient(100deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 45%, rgba(255,190,110,0.28) 100%)" }}>
          <motion.div aria-hidden="true" className="absolute inset-0" style={{ backgroundColor: "#ff9d4d", opacity: warmth, mixBlendMode: "multiply" }} />
          {/* Transom: a row of small panes above the main sheet of glass. */}
          <div aria-hidden="true" className="bakery-shadow-hero-transom relative flex">
            {[0, 1, 2, 3].map((pane) => (
              <span key={pane} className="h-full flex-1" />
            ))}
          </div>

          <div className="relative px-[5%] pb-[9%] pt-[7%] sm:pb-[5.5%] sm:pt-[4%]">
            <h1 className="bakery-shadow-hero-head font-serif font-bold leading-[0.92] tracking-[-0.03em]" style={{ color: SHADE }}>
              {hero.lines.map((text) => (
                <span key={text} className="block">
                  {text}
                </span>
              ))}
            </h1>
            <p className="bakery-shadow-hero-sign mt-[5%] flex items-center gap-[3%] font-semibold uppercase tracking-[0.3em]" style={{ color: SHADE }}>
              <span aria-hidden="true" className="h-[3px] w-[9%]" style={{ backgroundColor: SHADE }} />
              {hero.sign}
            </p>
          </div>

          {/* A branch outside moves in the wind. It is further from the wall than the glass, so its shadow is softer. */}
          <svg aria-hidden="true" viewBox="0 0 400 300" className="absolute right-[-2%] top-[-4%] w-[66%] overflow-visible blur-[3px] sm:blur-[6px]">
            <g className="bakery-shadow-hero-branch" fill={SHADE} stroke={SHADE}>
              <path d="M400 0 C 330 40, 250 70, 120 150" fill="none" strokeWidth="7" strokeLinecap="round" />
              {leaves.map((leaf, i) => {
                const t = 1 - leaf.at;
                const x = 400 * t * t + 2 * 290 * t * (1 - t) + 120 * (1 - t) * (1 - t) - 20 * t * (1 - t);
                const y = 2 * 55 * t * (1 - t) + 150 * (1 - t) * (1 - t);
                return (
                  <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${152 + leaf.turn})`}>
                    <path
                      className="bakery-shadow-hero-leaf"
                      style={{ animationDelay: `${-i * 0.47}s` }}
                      d={`M0 0 C ${leaf.long * 0.3} ${-leaf.long * 0.24}, ${leaf.long * 0.75} ${-leaf.long * 0.2}, ${leaf.long} 0 C ${leaf.long * 0.75} ${leaf.long * 0.2}, ${leaf.long * 0.3} ${leaf.long * 0.24}, 0 0 Z`}
                      strokeWidth="0"
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* The next window along: plain glass, mostly out of frame. */}
          <div aria-hidden="true" className="absolute left-[calc(100%+7vw)] top-0 h-full w-[46vw]" style={{ backgroundColor: SUNLIT, backgroundImage: "linear-gradient(100deg, rgba(255,190,110,0.2) 0%, rgba(255,170,90,0.42) 100%)" }}>
            <motion.div className="absolute inset-0" style={{ backgroundColor: "#ff9d4d", opacity: warmth, mixBlendMode: "multiply" }} />
            <div className="bakery-shadow-hero-transom relative flex">
              {[0, 1, 2].map((pane) => (
                <span key={pane} className="h-full flex-1" />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hand-trowelled plaster: fine grain plus broad, uneven patches, laid over the light and the shadow alike. */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full mix-blend-multiply" preserveAspectRatio="none">
        <filter id="bakery-shadow-hero-plaster" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.017" numOctaves="3" seed="7" result="broad" />
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="grain" />
          <feDiffuseLighting in="grain" surfaceScale="2.6" diffuseConstant="1.08" lightingColor="#ffffff" result="lit">
            <feDistantLight azimuth="205" elevation="58" />
          </feDiffuseLighting>
          <feColorMatrix in="broad" type="matrix" values="0 0 0 0 1  0 0 0 0 0.96  0 0 0 0 0.9  0 0 0 -1.5 0.95" result="stain" />
          <feComposite in="stain" in2="lit" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#bakery-shadow-hero-plaster)" />
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 90% at 40% 35%, rgba(0,0,0,0) 45%, rgba(24,16,10,0.42) 100%)" }} />

      <div className="absolute bottom-0 left-0 z-10 flex max-w-[24rem] flex-col items-start gap-5 px-5 pb-6 sm:px-10 sm:pb-10">
        <p className="text-[14px] font-medium leading-snug text-[#fff3df] sm:text-[15px]">{hero.line}</p>
        <a
          href="#"
          className="inline-flex h-12 items-center rounded-full bg-[#fff0d2] px-7 text-[15px] font-semibold text-[#3b2f24] shadow-[0_14px_30px_-12px_rgba(0,0,0,0.6)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#6b5f52] motion-reduce:transition-none"
        >
          {hero.button}
        </a>
      </div>
    </section>
  );
}

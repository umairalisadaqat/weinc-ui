import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";

/** One photograph does all the work: the backdrop and the cloud that drifts over the headline. */
const PHOTO = "https://images.unsplash.com/photo-1760202953582-a54c9459dfd9?auto=format&fit=crop&w=1600&q=80";
const PHOTO_ALT = "A dark timber mountain hut on a green ridge, with pine trees and thick white cloud filling the valley below";

const lodge = {
  name: "Kestrel Ridge",
  eyebrow: "Nine rooms at 1,840 metres",
  headline: ["Above the", "weather"],
  copy: "A timber lodge on the ridge line, an hour's walk from the last road. Most mornings the valley fills with cloud and the lodge sits just over it.",
  nightly: 412,
};

const links = ["Rooms", "The walk in", "Kitchen", "Winter"];
const stays = [2, 3, 5];

/** Cloud top for the next three mornings, in metres. The lodge sits at LODGE_ALTITUDE. */
const LODGE_ALTITUDE = 1840;
const mornings = [
  { day: "Thu", cloudTop: 1610, sunrise: "06:42" },
  { day: "Fri", cloudTop: 1575, sunrise: "06:43" },
  { day: "Sat", cloudTop: 1790, sunrise: "06:45" },
];

/** How far each layer travels with the pointer, in pixels. Bigger numbers feel closer to the viewer. */
const DEPTH = { photo: -10, type: -22, glassBack: 16, glassFront: 30 };

function useLayer(mx: MotionValue<number>, my: MotionValue<number>, depth: number) {
  const x = useTransform(mx, (v) => v * depth);
  const y = useTransform(my, (v) => v * depth * 0.7);
  return { x, y };
}

function MountainMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 19 9 7.5l4 6.5 2.5-3.5L21.500 19" />
      <path d="M2.5 19h19" />
    </svg>
  );
}

export default function MountainLodgePhotoHeroWithDriftingCloudHeadlineAndGlassBookingCards() {
  const reduce = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const [live, setLive] = useState(true);
  const [nights, setNights] = useState(3);
  const [guests, setGuests] = useState(2);
  const [morning, setMorning] = useState(0);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const mx = useSpring(px, { stiffness: 60, damping: 18, mass: 0.8 });
  const my = useSpring(py, { stiffness: 60, damping: 18, mass: 0.8 });
  const photo = useLayer(mx, my, DEPTH.photo);
  const type = useLayer(mx, my, DEPTH.type);
  const back = useLayer(mx, my, DEPTH.glassBack);
  const front = useLayer(mx, my, DEPTH.glassFront);

  // Pause the drifting cloud and the floating cards while the hero is off screen.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function onMove(e: ReactPointerEvent<HTMLElement>) {
    if (reduce || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    py.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  }
  function onLeave() {
    px.set(0);
    py.set(0);
  }

  const chosen = mornings[morning];
  const clearance = LODGE_ALTITUDE - chosen.cloudTop;
  // Where the cloud line sits in the little diagram: 0 is the lodge, 100 is the valley floor.
  const cloudY = 22 + Math.min(1, clearance / 320) * 44;
  const rise = (delay: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 26, filter: "blur(10px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, transition: { type: "spring" as const, stiffness: 70, damping: 16, delay } };

  return (
    <section
      ref={root}
      data-live={live}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="lodge-cloud-hero relative isolate overflow-hidden bg-[#dde5e8] text-[#0d2231]"
    >
      <style>{`
        @keyframes lodge-cloud-hero-drift { from { transform: translate3d(-70%, 0, 0); } to { transform: translate3d(190%, 0, 0); } }
        @keyframes lodge-cloud-hero-float { 0%, 100% { transform: translate3d(0, 0, 0); } 50% { transform: translate3d(0, -9px, 0); } }
        @keyframes lodge-cloud-hero-breathe { 0%, 100% { transform: scale(1.08); } 50% { transform: scale(1.13); } }
        @keyframes lodge-cloud-hero-ember { 0%, 100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.35); } }
        .lodge-cloud-hero-photo { transform: scale(1.08); animation: lodge-cloud-hero-breathe 26s ease-in-out infinite; }
        .lodge-cloud-hero-wisp {
          animation: lodge-cloud-hero-drift 46s linear infinite;
          -webkit-mask-image: radial-gradient(closest-side, #000 22%, rgba(0,0,0,0.55) 55%, transparent 100%);
          mask-image: radial-gradient(closest-side, #000 22%, rgba(0,0,0,0.55) 55%, transparent 100%);
        }
        .lodge-cloud-hero-float { animation: lodge-cloud-hero-float 9s ease-in-out infinite; }
        .lodge-cloud-hero-ember { animation: lodge-cloud-hero-ember 2.8s ease-in-out infinite; }
        .lodge-cloud-hero-glass {
          background: linear-gradient(145deg, rgba(255,255,255,0.62), rgba(255,255,255,0.3));
          box-shadow: 0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(13,34,49,0.06) inset, 0 2px 6px rgba(13,34,49,0.08), 0 28px 60px -22px rgba(13,34,49,0.45);
        }
        .lodge-cloud-hero[data-live="false"] * { animation-play-state: paused !important; }
        @media (prefers-reduced-motion: reduce) {
          .lodge-cloud-hero-photo, .lodge-cloud-hero-float, .lodge-cloud-hero-ember { animation: none; }
          .lodge-cloud-hero-wisp { animation: none; transform: translate3d(48%, 0, 0); }
        }
      `}</style>

      {/* Layer 1: the photograph, furthest away. */}
      <motion.div className="absolute -inset-6 -z-10" style={photo}>
        <img src={PHOTO} alt={PHOTO_ALT} width={1600} height={1067} loading="lazy" className="lodge-cloud-hero-photo h-full w-full object-cover object-[52%_42%]" />
      </motion.div>
      {/* A cool wash at the top so the navigation and headline sit on even sky. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-[#e9eff1]/90 via-[#e9eff1]/40 to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-64 bg-gradient-to-t from-white/70 to-transparent lg:h-40 lg:from-white/30" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-[780px] max-w-7xl flex-col px-5 pb-6 pt-5 sm:px-8 lg:min-h-[800px] lg:pb-10">
        <nav aria-label="Main" className="flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 rounded-full text-[15px] font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2231] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent">
            <MountainMark />
            {lodge.name}
          </a>
          <ul className="lodge-cloud-hero-glass hidden items-center gap-1 rounded-full border border-white/70 p-1 text-sm font-medium backdrop-blur-xl md:flex">
            {links.map((link, i) => (
              <li key={link}>
                <a
                  href="#"
                  aria-current={i === 0 ? "page" : undefined}
                  className={`flex h-10 items-center rounded-full px-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2231] ${i === 0 ? "bg-[#0d2231] text-white" : "text-[#0d2231] hover:bg-white/60"}`}
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
          <a href="#" className="flex h-10 items-center gap-2 rounded-full bg-[#0d2231] px-4 text-sm font-semibold text-white shadow-lg shadow-[#0d2231]/25 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2231] focus-visible:ring-offset-2">
            <span className="lodge-cloud-hero-ember h-1.5 w-1.5 rounded-full bg-[#ff9d5c]" aria-hidden="true" />
            Reserve
          </a>
        </nav>

        {/* Layer 2: the headline, with a piece of real cloud passing in front of it. */}
        <div className="relative mt-12 text-center sm:mt-14 lg:mt-10">
          <motion.div style={type}>
            <motion.p {...rise(0.05)} className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#0d2231]/80 sm:text-xs">
              {lodge.eyebrow}
            </motion.p>
            <h1 className="mt-4 text-[clamp(3.4rem,11.5vw,10.5rem)] font-medium leading-[0.86] tracking-[-0.055em] text-[#0d2231]">
              {lodge.headline.map((line, i) => (
                <motion.span key={line} {...rise(0.15 + i * 0.12)} className="block lg:inline">
                  {line}
                  {i === 0 ? " " : ""}
                </motion.span>
              ))}
            </h1>
          </motion.div>
          <div className="pointer-events-none absolute inset-x-[-12%] -bottom-10 -top-6 overflow-hidden opacity-70 sm:opacity-100" aria-hidden="true">
            {[
              { width: "46%", delay: "-17s", top: "8%", opacity: 0.95 },
              { width: "34%", delay: "-39s", top: "24%", opacity: 0.8 },
            ].map((wisp) => (
              <div key={wisp.delay} className="lodge-cloud-hero-wisp absolute left-0 h-[72%] overflow-hidden" style={{ width: wisp.width, top: wisp.top, opacity: wisp.opacity, animationDelay: wisp.delay }}>
                {/* The lower right corner of the same photograph: nothing but cloud. */}
                <img src={PHOTO} alt="" loading="lazy" width={1600} height={1067} className="absolute bottom-0 right-0 h-auto w-[260%] max-w-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Layer 3: glass, nearest the viewer. */}
        <div className="mt-auto grid items-end gap-4 pt-52 sm:pt-72 lg:grid-cols-[minmax(0,26rem)_1fr_minmax(0,19rem)] lg:gap-6 lg:pt-10">
          <motion.div style={front}>
            <motion.div {...rise(0.5)}>
              <form
                onSubmit={(e) => e.preventDefault()}
                aria-label="Check availability"
                className="lodge-cloud-hero-glass lodge-cloud-hero-float rounded-[28px] border border-white/70 p-4 backdrop-blur-2xl sm:p-5"
              >
                <p className="text-sm leading-relaxed text-[#0d2231] sm:text-[15px]">{lodge.copy}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <fieldset className="min-w-0">
                    <legend className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0d2231]/75">Nights</legend>
                    <div className="mt-2 flex gap-1.5">
                      {stays.map((n) => (
                        <button
                          key={n}
                          type="button"
                          aria-pressed={nights === n}
                          onClick={() => setNights(n)}
                          className={`h-10 min-w-[44px] rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2231] ${nights === n ? "bg-[#0d2231] text-white" : "bg-white/60 text-[#0d2231] hover:bg-white"}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <div className="shrink-0">
                    <p id="lodge-cloud-hero-guests" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0d2231]/75">Guests</p>
                    <div className="mt-2 flex items-center gap-1 rounded-full bg-white/60 p-1" role="group" aria-labelledby="lodge-cloud-hero-guests">
                      <button type="button" aria-label="One guest fewer" disabled={guests <= 1} onClick={() => setGuests((g) => Math.max(1, g - 1))} className="flex h-8 w-9 items-center justify-center rounded-full text-lg leading-none text-[#0d2231] transition-colors hover:bg-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2231]">
                        <span aria-hidden="true">&minus;</span>
                      </button>
                      <span className="w-5 text-center text-sm font-semibold tabular-nums" aria-live="polite">{guests}</span>
                      <button type="button" aria-label="One guest more" disabled={guests >= 4} onClick={() => setGuests((g) => Math.min(4, g + 1))} className="flex h-8 w-9 items-center justify-center rounded-full text-lg leading-none text-[#0d2231] transition-colors hover:bg-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2231]">
                        <span aria-hidden="true">+</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#0d2231]/10 pt-4">
                  <p className="text-sm text-[#0d2231]">
                    <span className="block text-2xl font-semibold tabular-nums tracking-tight">${(lodge.nightly * nights).toLocaleString("en-US")}</span>
                    <span className="text-[#0d2231]/80">{nights} nights, half board</span>
                  </p>
                  <button type="submit" className="group flex h-12 items-center gap-2 rounded-full bg-[#0d2231] pl-5 pr-2 text-sm font-semibold text-white shadow-lg shadow-[#0d2231]/30 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2231] focus-visible:ring-offset-2">
                    See free rooms
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff9d5c] text-[#0d2231] transition-transform group-hover:translate-x-0.5">
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
                    </span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>

          <div className="hidden lg:block" />

          <motion.div style={back}>
            <motion.div {...rise(0.65)}>
              <div className="lodge-cloud-hero-glass lodge-cloud-hero-float rounded-[28px] border border-white/70 p-4 backdrop-blur-2xl sm:p-5" style={{ animationDelay: "-4s" }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0d2231]/75">Morning forecast</h2>
                  <span className="rounded-full bg-[#0d2231] px-2.5 py-1 text-[11px] font-semibold text-white">{clearance >= 120 ? "Clear above" : "Borderline"}</span>
                </div>
                {/* The ridge, the lodge and where the cloud is expected to sit. */}
                <svg viewBox="0 0 240 92" className="mt-3 hidden h-auto w-full overflow-hidden rounded-2xl bg-white/35 sm:block" role="img" aria-label={`Cloud top at ${chosen.cloudTop.toLocaleString("en-US")} metres, ${clearance} metres below the lodge`}>
                  <path d="M0 92V70l46-30 30 12 44-40 38 30 34-12 48 30v42Z" fill="#0d2231" fillOpacity="0.16" />
                  <path d="M0 70l46-30 30 12 44-40 38 30 34-12 48 30" fill="none" stroke="#0d2231" strokeWidth="1.5" strokeLinejoin="round" />
                  <rect x="113" y="5" width="14" height="8" rx="1" fill="#0d2231" />
                  <circle cx="120" cy="9" r="1.6" fill="#ff9d5c" />
                  <motion.g animate={{ y: cloudY }} initial={false} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 90, damping: 14 }}>
                    <rect x="0" y="0" width="240" height="92" fill="#ffffff" fillOpacity="0.82" />
                    <path d="M0 0c20-7 40 6 60 0s40-7 60 0 40 6 60 0 40-7 60 0" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
                    <text x="6" y="16" fontSize="10" fontWeight="600" fill="#0d2231">{chosen.cloudTop.toLocaleString("en-US")} m</text>
                  </motion.g>
                </svg>
                <div className="mt-3 flex gap-1.5" role="group" aria-label="Morning">
                  {mornings.map((m, i) => (
                    <button
                      key={m.day}
                      type="button"
                      aria-pressed={morning === i}
                      onClick={() => setMorning(i)}
                      className={`h-10 flex-1 rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2231] ${morning === i ? "bg-[#0d2231] text-white" : "bg-white/60 text-[#0d2231] hover:bg-white"}`}
                    >
                      {m.day}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-snug text-[#0d2231]">
                  Sunrise {chosen.sunrise}. Cloud sits <span className="font-semibold tabular-nums">{clearance} m</span> under the terrace.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

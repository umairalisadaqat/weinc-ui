import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** One photograph: a tiled roof with a row of panels, and a lot of open evening sky for the headline. */
const PHOTO = "https://images.unsplash.com/photo-1761158495585-eac721decf1b?auto=format&fit=crop&w=1600&q=80";
const PHOTO_ALT = "An orange tiled roof with a row of solar panels along its lower edge, under a wide pale evening sky crossed by overhead wires";

const firm = {
  name: "Sunward",
  trade: "Rooftop solar, fitted by our own crews",
  eyebrow: "Surveys booking for spring",
  headline: ["Run the meter", "backwards."],
  copy: "We survey, fit and look after solar panels and batteries for ordinary houses. One fixed price, one crew from scaffold to switch-on, and a meter that starts counting the other way.",
};

const links = ["How it works", "Batteries", "Our roofs", "Prices"];

/** The stats row. Each `value` is shown on rolling meter drums. */
const stats = [
  { label: "Roofs fitted since 2011", value: "2,418", prefix: "", unit: "" },
  { label: "Typical first-year saving", value: "840", prefix: "£", unit: "" },
  { label: "Panel and workmanship cover", value: "25", prefix: "", unit: "yrs" },
];

/** The live stat: tenths of a kilowatt hour sent back to the grid today. It keeps counting while you watch. */
const LIVE_START = 317642;
const LIVE_LABEL = "kWh sent back to the grid today";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function Drum({ digit, delay, red, still }: { digit: number; delay: number; red?: boolean; still: boolean }) {
  return (
    <span className={`relative inline-block h-[1.18em] w-[0.74em] overflow-hidden rounded-[0.09em] ${red ? "bg-[#b93a12] text-[#fff3e2]" : "bg-[#efe7d8] text-[#1b1814]"}`}>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={still ? false : { y: "0%" }}
        animate={{ y: `-${digit * 10}%` }}
        transition={still ? { duration: 0 } : { type: "spring", stiffness: 60, damping: 14, mass: 1, delay }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="flex h-[1.18em] items-center justify-center leading-none">
            {d}
          </span>
        ))}
      </motion.span>
      {/* Shading that makes the flat strip of numerals read as a turning drum. */}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/50" />
      <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/10" />
    </span>
  );
}

/** A row of drums for a string such as "2,418". Commas stay still; digits roll. */
function Meter({ text, redLast, baseDelay, still }: { text: string; redLast?: boolean; baseDelay: number; still: boolean }) {
  const chars = text.split("");
  const lastDigit = chars.length - 1;
  return (
    <span className="inline-flex items-center gap-[0.07em] rounded-[0.16em] bg-[#0c0a08] p-[0.12em] font-mono font-semibold tabular-nums shadow-[inset_0_2px_6px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.08)]" aria-hidden="true">
      {chars.map((c, i) =>
        /\d/.test(c) ? (
          <Drum key={i} digit={Number(c)} delay={baseDelay + (chars.length - i) * 0.05} red={redLast && i === lastDigit} still={still} />
        ) : (
          <span key={i} className="self-end pb-[0.08em] text-[0.7em] text-[#efe7d8]/70">
            {c}
          </span>
        ),
      )}
    </span>
  );
}

function formatTenths(n: number) {
  const whole = Math.floor(n / 10).toLocaleString("en-US");
  return `${whole}${n % 10}`;
}

export default function BigHeadlineHeroWithStatsRow() {
  const reduce = useReducedMotion();
  const still = Boolean(reduce);
  const root = useRef<HTMLElement>(null);
  const [live, setLive] = useState(true);
  const [tenths, setTenths] = useState(LIVE_START);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The live meter: a few tenths of a unit every second or so, only while the hero is on screen.
  useEffect(() => {
    if (still || !live) return;
    const id = window.setInterval(() => setTenths((t) => t + 1 + Math.floor(Math.random() * 3)), 1100);
    return () => window.clearInterval(id);
  }, [still, live]);

  const rise = (delay: number) =>
    still ? {} : { initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, transition: { type: "spring" as const, stiffness: 70, damping: 17, delay } };

  return (
    <section ref={root} data-live={live} className="stats-meter-hero relative isolate overflow-hidden bg-[#14110e] text-[#1b1814]">
      <style>{`
        @keyframes stats-meter-hero-sun { 0% { transform: translate3d(-30%, 18%, 0); opacity: 0.5; } 50% { transform: translate3d(35%, -8%, 0); opacity: 0.95; } 100% { transform: translate3d(100%, 18%, 0); opacity: 0.5; } }
        @keyframes stats-meter-hero-disc { from { transform: translate3d(130px, 0, 0); } to { transform: translate3d(-14px, 0, 0); } }
        @keyframes stats-meter-hero-settle { from { transform: scale(1.1); } to { transform: scale(1.02); } }
        .stats-meter-hero-photo { animation: stats-meter-hero-settle 2.4s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
        .stats-meter-hero-sun { animation: stats-meter-hero-sun 24s ease-in-out infinite; }
        .stats-meter-hero-disc { animation: stats-meter-hero-disc 2.6s linear infinite; }
        .stats-meter-hero[data-live="false"] * { animation-play-state: paused !important; }
        @media (prefers-reduced-motion: reduce) {
          .stats-meter-hero-photo { animation: none; transform: scale(1.02); }
          .stats-meter-hero-sun { animation: none; transform: translate3d(35%, -8%, 0); }
          .stats-meter-hero-disc { animation: none; transform: translate3d(58px, 0, 0); }
        }
      `}</style>

      <div className="relative">
        {/* The photograph and the big headline. */}
        <div className="relative h-[560px] overflow-hidden bg-[#d6cfbf] sm:h-[620px] lg:h-[660px]">
          <img src={PHOTO} alt={PHOTO_ALT} width={1600} height={1067} loading="lazy" className="stats-meter-hero-photo absolute inset-0 h-full w-full origin-bottom-right object-cover object-[78%_100%]" />
          {/* Low sun travelling across the sky. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-soft-light" aria-hidden="true">
            <div className="stats-meter-hero-sun absolute -top-1/4 left-0 h-[130%] w-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,214,150,0.95),rgba(255,190,120,0.4)_45%,transparent_72%)]" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-[#f4ecdd]/75 via-[#f4ecdd]/30 to-transparent" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 bg-gradient-to-r from-[#f1e8d8]/70 to-transparent lg:block" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#14110e] to-transparent" aria-hidden="true" />

          <div className="relative mx-auto flex h-full max-w-7xl flex-col px-5 pt-5 sm:px-8">
            <nav aria-label="Main" className="flex items-center justify-between gap-4">
              <a href="#" className="flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b1814] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f1e8d8]">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#b93a12]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M4 17a8 8 0 0 1 16 0" />
                  <path d="M2 21h20M12 3v2.500M4.500 7.500l1.800 1.800M19.500 7.500l-1.800 1.800" />
                </svg>
                <span className="text-lg font-semibold tracking-tight">{firm.name}</span>
                <span className="hidden border-l border-[#1b1814]/30 pl-2.5 text-xs font-medium text-[#1b1814]/80 sm:inline">{firm.trade}</span>
              </a>
              <ul className="hidden items-center gap-7 text-sm font-medium lg:flex">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="rounded-sm py-2 underline-offset-8 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b1814]">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
              <a href="#" className="flex h-10 items-center rounded-full border border-[#1b1814]/25 bg-[#f7f1e6]/70 px-4 text-sm font-semibold backdrop-blur-md transition-colors hover:bg-[#f7f1e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b1814]">
                0161 555 0142
              </a>
            </nav>

            <div className="mt-10 sm:mt-14">
              <motion.p {...rise(0.05)} className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#1b1814]/85">
                <span className="h-px w-10 bg-[#b93a12]" aria-hidden="true" />
                {firm.eyebrow}
              </motion.p>
              <h1 className="mt-5 text-[clamp(3.3rem,10.2vw,9.25rem)] font-semibold leading-[1.02] tracking-[-0.06em] sm:leading-[0.84]">
                <motion.span {...rise(0.12)} className="block">
                  {firm.headline[0]}
                </motion.span>
                <motion.span {...rise(0.24)} className="block font-serif font-normal italic tracking-[-0.045em] text-[#b93a12]">
                  {firm.headline[1]}
                </motion.span>
              </h1>
            </div>
          </div>
        </div>

        {/* The pitch: over the photo on wide screens, on the dark band on phones. */}
        <motion.div {...rise(0.4)} className="mx-auto max-w-7xl px-5 pb-2 pt-6 text-[#efe7d8] sm:px-8 lg:absolute lg:inset-x-0 lg:bottom-12 lg:pb-0 lg:pt-0 lg:text-[#1b1814]">
          <div className="max-w-xl">
            <p className="max-w-md text-[15px] leading-relaxed lg:font-medium">{firm.copy}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a href="#" className="group flex h-12 items-center gap-3 rounded-full bg-[#b93a12] pl-5 pr-2 text-sm font-semibold text-white shadow-[0_14px_30px_-12px_rgba(185,58,18,0.9)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b93a12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110e] lg:focus-visible:ring-offset-[#efe7d8]">
                Book a free roof survey
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#b93a12] transition-transform group-hover:translate-x-0.5">
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 10h12M11 5l5 5-5 5" />
                  </svg>
                </span>
              </a>
              <a href="#" className="flex h-12 items-center rounded-sm text-sm font-semibold underline decoration-[#b93a12] decoration-2 underline-offset-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current">
                See a real bill, before and after
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* The stats row, set as four meter windows. */}
      <div className="relative border-t border-white/10 bg-[#14110e] text-[#efe7d8]">
        <dl className="mx-auto grid max-w-7xl grid-cols-3 gap-x-3 gap-y-8 px-5 py-8 sm:px-8 sm:gap-x-6 lg:grid-cols-[1fr_1fr_1fr_1.5fr] lg:gap-x-10 lg:py-10">
          {stats.map((s, i) => (
            <div key={s.label} className="flex flex-col-reverse justify-end gap-3 lg:border-r lg:border-white/10 lg:pr-8">
              <dt className="text-[13px] leading-snug text-[#efe7d8]/80">{s.label}</dt>
              <dd className="flex items-end gap-1.5 text-[clamp(1.5rem,3.6vw,2.9rem)] sm:gap-2 leading-none">
                <span className="sr-only">
                  {s.prefix}
                  {s.value} {s.unit}
                </span>
                {s.prefix ? (
                  <span className="pb-[0.14em] text-[0.7em] font-semibold text-[#efe7d8]/80" aria-hidden="true">
                    {s.prefix}
                  </span>
                ) : null}
                <Meter text={s.value} baseDelay={0.35 + i * 0.12} still={still} />
                {s.unit ? (
                  <span className="pb-[0.2em] text-sm font-semibold text-[#efe7d8]/80" aria-hidden="true">
                    {s.unit}
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
          <div className="col-span-3 flex flex-col-reverse justify-end gap-3 lg:col-span-1">
            <dt className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[13px] leading-snug text-[#efe7d8]/80">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff7a45]" aria-hidden="true" />
                {LIVE_LABEL}
              </span>
              {/* The spinning disc of an old electricity meter, with its mark travelling the wrong way. */}
              <span className="relative block h-[7px] w-[120px] overflow-hidden rounded-full bg-[linear-gradient(180deg,#5d564c,#cfc6b6_45%,#6b6358)] shadow-[inset_0_1px_1px_rgba(0,0,0,0.6)]" aria-hidden="true">
                <span className="stats-meter-hero-disc absolute left-0 top-0 h-full w-2.5 bg-[#b93a12]" />
              </span>
            </dt>
            <dd className="text-[clamp(1.7rem,3.6vw,2.9rem)] leading-none">
              <span className="sr-only">About {Math.floor(LIVE_START / 10).toLocaleString("en-US")} and rising</span>
              <Meter text={formatTenths(tenths)} redLast baseDelay={0.2} still={still} />
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

const FOREST = "https://images.pexels.com/photos/30875697/pexels-photo-30875697.jpeg?auto=compress&cs=tinysrgb&w=1600";
const FOREST_ALT = "A conifer forest at twilight with blue mist hanging between the trees";

const app = {
  name: "Hark",
  eyebrow: "Birdsong, named",
  headline: ["Hear a bird.", "Know its name."],
  copy: "Hold your phone up to the hedge. Hark listens for a few seconds, tells you who is singing and keeps a list of every bird you have heard from your own back door.",
  place: "Alder Fen, 05:42",
};

const stores = [
  { platform: "iPhone", note: "Get Hark for" },
  { platform: "Android", note: "Get Hark for" },
];

/** The birds the phone works through. `focus` is the object-position that keeps the bird in the frame. */
const birds = [
  { name: "European robin", short: "Robin", latin: "Erithacus rubecula", heard: "Full song, from a low branch", match: 96, photo: "https://images.pexels.com/photos/11560449/pexels-photo-11560449.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "A European robin singing on a thin branch", focus: "66% 40%" },
  { name: "Common kingfisher", short: "Kingfisher", latin: "Alcedo atthis", heard: "Flight call, over the water", match: 91, photo: "https://images.pexels.com/photos/36559572/pexels-photo-36559572.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "A common kingfisher with blue and orange plumage perched on a branch", focus: "66% 50%" },
  { name: "Eurasian blue tit", short: "Blue tit", latin: "Cyanistes caeruleus", heard: "Contact call, in the birch", match: 94, photo: "https://images.pexels.com/photos/34593300/pexels-photo-34593300.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "A blue tit standing on a weathered log", focus: "56% 40%" },
];

const HOLD_MS = 2900;
/** Bar heights for the listening meter, as a share of full height. */
const bars = Array.from({ length: 26 }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));

function PhoneGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </svg>
  );
}

export default function AppLandingHeroWithPhoneMockup() {
  const reduce = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const [live, setLive] = useState(true);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 80, damping: 16 });
  const sy = useSpring(py, { stiffness: 80, damping: 16 });
  const rotateY = useTransform(sx, (v) => -13 + v * 9);
  const rotateX = useTransform(sy, (v) => 6 - v * 7);
  const glareX = useTransform(sx, (v) => `${30 + v * 30}%`);
  const cardX = useTransform(sx, (v) => v * 18);
  const cardY = useTransform(sy, (v) => v * 12);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The phone works through the birds by itself until someone picks one.
  useEffect(() => {
    if (!auto || reduce || !live) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % birds.length), HOLD_MS);
    return () => clearInterval(id);
  }, [auto, reduce, live]);

  function onMove(e: ReactPointerEvent<HTMLElement>) {
    if (reduce || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    py.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  }

  const bird = birds[index];
  const rise = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { type: "spring" as const, stiffness: 80, damping: 17, delay } };
  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb37a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071a20]";

  return (
    <section
      ref={root}
      data-live={live}
      onPointerMove={onMove}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
      className="app-phone-hero relative isolate overflow-hidden bg-[#071a20] text-[#eef4ee]"
    >
      <style>{`
        @keyframes app-landing-hero-with-phone-mockup-bar { 0%, 100% { transform: scaleY(0.25); } 50% { transform: scaleY(1); } }
        @keyframes app-landing-hero-with-phone-mockup-ring { 0% { transform: scale(0.55); opacity: 0; } 18% { opacity: 0.55; } 100% { transform: scale(1.55); opacity: 0; } }
        @keyframes app-landing-hero-with-phone-mockup-bob { 0%, 100% { transform: translate3d(0, 0, 0); } 50% { transform: translate3d(0, -10px, 0); } }
        @keyframes app-landing-hero-with-phone-mockup-mist { from { transform: translate3d(-4%, 0, 0) scale(1.1); } to { transform: translate3d(4%, 0, 0) scale(1.1); } }
        .app-phone-hero-bar { transform-origin: 50% 50%; animation: app-landing-hero-with-phone-mockup-bar 0.9s ease-in-out infinite; }
        .app-phone-hero-ring { animation: app-landing-hero-with-phone-mockup-ring 4.2s cubic-bezier(0.2, 0.6, 0.3, 1) infinite; }
        .app-phone-hero-bob { animation: app-landing-hero-with-phone-mockup-bob 7s ease-in-out infinite; }
        .app-phone-hero-mist { animation: app-landing-hero-with-phone-mockup-mist 30s ease-in-out infinite alternate; }
        .app-phone-hero-body {
          background: linear-gradient(135deg, #5d6a6c 0%, #1b2426 22%, #0b1113 55%, #3d4a4c 100%);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.14) inset, 0 2px 3px rgba(255,255,255,0.25) inset, -30px 50px 80px -20px rgba(0,0,0,0.75), -8px 14px 24px rgba(0,0,0,0.45);
        }
        .app-phone-hero-glass {
          background: linear-gradient(150deg, rgba(255,255,255,0.2), rgba(255,255,255,0.06));
          box-shadow: 0 1px 0 rgba(255,255,255,0.3) inset, 0 24px 50px -18px rgba(0,0,0,0.7);
        }
        .app-phone-hero[data-live="false"] * { animation-play-state: paused !important; }
        @media (prefers-reduced-motion: reduce) {
          .app-phone-hero-bar, .app-phone-hero-bob, .app-phone-hero-mist { animation: none; }
          .app-phone-hero-ring { animation: none; opacity: 0.3; }
        }
      `}</style>

      {/* The wood at first light, far behind everything. */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <img src={FOREST} alt={FOREST_ALT} width={1600} height={900} loading="lazy" className="app-phone-hero-mist h-full w-full scale-110 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071a20] via-[#071a20]/75 to-[#071a20]/10" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071a20] via-transparent to-[#071a20]/60" aria-hidden="true" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-16 pt-6 sm:px-10 lg:min-h-[800px] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:pb-10">
        <div className="lg:self-stretch lg:py-4">
          <div className="flex h-full flex-col">
            <a href="#" className={`flex w-fit items-center gap-2.5 rounded-full text-lg font-semibold tracking-tight ${ring}`}>
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#ff9a52] text-[#071a20]">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 8v4M8 5v10M12 7v6M16 9v2" /></svg>
              </span>
              {app.name}
            </a>

            <div className="my-auto pt-14 lg:pt-0">
              <motion.p {...rise(0.05)} className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#ffb37a]">{app.eyebrow}</motion.p>
              <h1 className="mt-5 text-[clamp(3rem,7.2vw,6.2rem)] font-medium leading-[0.92] tracking-[-0.05em]">
                {app.headline.map((line, i) => (
                  <motion.span key={line} {...rise(0.12 + i * 0.1)} className={`block ${i === 1 ? "text-[#eef4ee]/55" : ""}`}>{line}</motion.span>
                ))}
              </h1>
              <motion.p {...rise(0.34)} className="mt-7 max-w-md text-[17px] leading-relaxed text-[#eef4ee]/85">{app.copy}</motion.p>

              <motion.div {...rise(0.44)} className="mt-9 flex flex-col gap-3 sm:flex-row">
                {stores.map((store, i) => (
                  <a
                    key={store.platform}
                    href="#"
                    className={`flex h-[60px] items-center gap-3 rounded-2xl pl-4 pr-6 transition-transform hover:-translate-y-0.5 ${ring} ${i === 0 ? "bg-[#eef4ee] text-[#071a20]" : "app-phone-hero-glass border border-white/20 text-[#eef4ee] backdrop-blur-md"}`}
                  >
                    <PhoneGlyph />
                    <span className="text-left leading-tight">
                      <span className="block text-[11px] font-medium opacity-80">{store.note}</span>
                      <span className="block text-[17px] font-semibold tracking-tight">{store.platform}</span>
                    </span>
                  </a>
                ))}
              </motion.div>
              <motion.p {...rise(0.52)} className="mt-4 text-[13px] text-[#eef4ee]/75">Free to listen. Works with no signal once the bird pack is saved.</motion.p>
            </div>

            <motion.div {...rise(0.6)} className="mt-12 lg:mt-0">
              <p id="app-phone-hero-pick" className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#eef4ee]/75">Play it a recording</p>
              <div role="group" aria-labelledby="app-phone-hero-pick" className="mt-3 flex flex-wrap gap-2">
                {birds.map((b, i) => (
                  <button
                    key={b.name}
                    type="button"
                    aria-pressed={index === i}
                    onClick={() => {
                      setIndex(i);
                      setAuto(false);
                    }}
                    className={`flex h-11 items-center gap-2 rounded-full pl-1.5 pr-4 text-sm font-medium transition-colors ${ring} ${index === i ? "bg-[#ff9a52] text-[#071a20]" : "bg-white/10 text-[#eef4ee] hover:bg-white/20"}`}
                  >
                    <img src={b.photo} alt="" width={64} height={64} loading="lazy" className="h-8 w-8 rounded-full object-cover" style={{ objectPosition: b.focus }} />
                    {b.short}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* The phone. */}
        <div className="relative mx-auto flex w-full max-w-[420px] justify-center py-4 [perspective:1600px] lg:max-w-none lg:py-0">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
            {[0, 1.4, 2.8].map((delay) => (
              <span key={delay} className="app-phone-hero-ring absolute inset-0 rounded-full border border-[#ffb37a]/80" style={{ animationDelay: `${delay}s` }} />
            ))}
            <span className="absolute inset-24 rounded-full bg-[#ff9a52]/25 blur-3xl" />
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 70, rotateY: -32 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ type: "spring", stiffness: 55, damping: 14, delay: 0.25 }}
            className="[transform-style:preserve-3d]"
          >
            <motion.div style={reduce ? { rotateY: -13, rotateX: 6 } : { rotateY, rotateX }} className="app-phone-hero-body relative h-[600px] w-[292px] rounded-[52px] p-[10px] [transform-style:preserve-3d]">
              <div className="relative h-full w-full overflow-hidden rounded-[42px] bg-[#0b1113]">
                <AnimatePresence initial={false}>
                  <motion.img
                    key={bird.photo}
                    src={bird.photo}
                    alt={bird.alt}
                    width={900}
                    height={720}
                    loading="lazy"
                    initial={reduce ? false : { opacity: 0, scale: 1.14 }}
                    animate={{ opacity: 1, scale: 1.02 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ objectPosition: bird.focus }}
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/80" aria-hidden="true" />

                <div className="absolute inset-x-0 top-0 flex items-center justify-between px-7 pt-4 text-[12px] font-semibold text-white" aria-hidden="true">
                  <span>5:42</span>
                  <span className="absolute left-1/2 top-3 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-4 rounded-[3px] border border-white/80 p-px"><span className="block h-full w-2/3 rounded-[1px] bg-white" /></span>
                  </span>
                </div>

                {/* Listening meter. */}
                <div className="absolute inset-x-4 top-14 rounded-[22px] border border-white/20 bg-black/35 px-4 py-3 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                    <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#ff9a52]" aria-hidden="true" />Listening</span>
                    <span className="font-medium normal-case tracking-normal text-white/80">{app.place}</span>
                  </div>
                  <div className="mt-2.5 flex h-9 items-center gap-[3px]" aria-hidden="true">
                    {bars.map((h, i) => (
                      <span key={i} className="flex h-full flex-1 items-center">
                        <span className="app-phone-hero-bar block w-full rounded-full bg-gradient-to-t from-[#ff9a52] to-[#ffe2c6]" style={{ height: `${h * 100}%`, animationDelay: `${-((i * 137) % 900)}ms`, animationDuration: `${700 + ((i * 53) % 500)}ms` }} />
                      </span>
                    ))}
                  </div>
                </div>

                {/* The answer. */}
                <div className="absolute inset-x-3 bottom-3">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={bird.name}
                      initial={reduce ? false : { opacity: 0, y: 40, scale: 0.94 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 190, damping: 20 }}
                      className="rounded-[30px] bg-[#f4f1e8] p-4 text-[#0d1f24] shadow-[0_-10px_40px_rgba(0,0,0,0.35)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0d1f24]/70">That was a</p>
                          <p className="mt-1 whitespace-nowrap text-[19px] font-semibold leading-none tracking-[-0.03em]">{bird.name}</p>
                          <p className="mt-1.5 font-serif text-[13px] italic text-[#0d1f24]/75">{bird.latin}</p>
                        </div>
                        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#0d1f24] text-[12px] font-semibold tabular-nums text-[#f4f1e8]">{bird.match}%</span>
                      </div>
                      <p className="mt-3 text-[13px] leading-snug text-[#0d1f24]/80">{bird.heard}</p>
                      <div className="mt-3 flex h-11 items-center justify-center gap-2 rounded-full bg-[#ff9a52] text-[13px] font-semibold text-[#0d1f24]">
                        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg>
                        Add to my dawn list
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Light across the glass. */}
                <motion.div className="pointer-events-none absolute -inset-y-10 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent" style={{ left: glareX }} aria-hidden="true" />
              </div>
              <span className="absolute -right-[3px] top-36 h-16 w-[3px] rounded-r bg-[#3d4a4c]" aria-hidden="true" />
              <span className="absolute -left-[3px] top-28 h-8 w-[3px] rounded-l bg-[#2a3436]" aria-hidden="true" />
            </motion.div>
          </motion.div>

          {/* Two notes floating nearer than the phone. */}
          <motion.div className="absolute right-0 top-14 hidden sm:block lg:right-2 xl:right-10" style={{ x: cardX, y: cardY }}>
            <motion.div {...rise(0.8)}>
              <div className="app-phone-hero-glass app-phone-hero-bob rounded-2xl border border-white/20 px-4 py-3 backdrop-blur-xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#eef4ee]/80">This morning</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">11 <span className="text-sm font-medium text-[#eef4ee]/80">birds heard</span></p>
              </div>
            </motion.div>
          </motion.div>
          <motion.div className="absolute right-[calc(50%+104px)] top-[44%] hidden whitespace-nowrap sm:block" style={{ x: cardX, y: cardY }}>
            <motion.div {...rise(0.95)}>
              <div className="app-phone-hero-glass app-phone-hero-bob flex items-center gap-3 rounded-2xl border border-white/20 py-2.5 pl-2.5 pr-4 backdrop-blur-xl" style={{ animationDelay: "-3s" }}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff9a52] text-[#071a20]">
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4.5 10.5 3.5 3.5 7.5-8" /></svg>
                </span>
                <p className="text-[13px] leading-tight"><span className="block font-semibold">New for your list</span><span className="text-[#eef4ee]/80">First kingfisher this year</span></p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

const K = "neo-brutalist-hero-with-sticker-headline-and-shifting-hard-shadows";

// Each headline word is its own sticker: a fill colour and a resting tilt in degrees.
const words = [
  { text: "Print", fill: "#ffffff", tilt: -4 },
  { text: "loud.", fill: "#ff5fa2", tilt: 3 },
  { text: "Stick", fill: "#38d6ff", tilt: -2 },
  { text: "it", fill: "#ffffff", tilt: 6 },
  { text: "anywhere.", fill: "#7df08f", tilt: -3 },
];

const facts = ["Weatherproof vinyl", "From 25 pieces", "Ships in 48 hours"];

// A sixteen-point seal for the round offer badge.
const seal = Array.from({ length: 32 }, (_, i) => {
  const r = i % 2 === 0 ? 50 : 42;
  const a = (i / 32) * Math.PI * 2;
  return `${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`;
}).join(" ");

const sheet = [
  { id: "smile", fill: "#ffe14d" },
  { id: "bolt", fill: "#38d6ff" },
  { id: "heart", fill: "#ff5fa2" },
  { id: "eye", fill: "#ffffff" },
  { id: "flower", fill: "#7df08f" },
  { id: "ok", fill: "#ff8a3d" },
];

function Art({ id }: { id: string }) {
  const s = { stroke: "#111", strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  if (id === "smile")
    return (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="#fff" {...s} />
        <circle cx="18" cy="20" r="2.4" fill="#111" />
        <circle cx="30" cy="20" r="2.4" fill="#111" />
        <path d="M16 27c2 5 14 5 16 0" fill="none" {...s} />
      </svg>
    );
  if (id === "bolt")
    return (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <path d="M28 5 11 27h11l-3 16 18-23H25z" fill="#ffe14d" {...s} />
      </svg>
    );
  if (id === "heart")
    return (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <path d="M24 40C6 28 8 12 17 11c4 0 6 3 7 5 1-2 3-5 7-5 9 1 11 17-7 29z" fill="#fff" {...s} />
      </svg>
    );
  if (id === "eye")
    return (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <path d="M5 24c8-14 30-14 38 0-8 14-30 14-38 0z" fill="#38d6ff" {...s} />
        <circle cx="24" cy="24" r="6" fill="#111" />
      </svg>
    );
  if (id === "flower")
    return (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        {[0, 60, 120, 180, 240, 300].map((d) => (
          <circle key={d} cx="24" cy="11" r="7" fill="#fff" {...s} transform={`rotate(${d} 24 24)`} />
        ))}
        <circle cx="24" cy="24" r="6" fill="#ff5fa2" {...s} />
      </svg>
    );
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
      <rect x="6" y="13" width="36" height="22" rx="11" fill="#fff" {...s} />
      <text x="24" y="29.5" textAnchor="middle" fontSize="13" fontWeight="900" fill="#111" fontFamily="inherit">
        OK!
      </text>
    </svg>
  );
}

export default function NeoBrutalistHeroWithStickerHeadlineAndShiftingHardShadows() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  // One loop moves every hard shadow. Idle, the light swings side to side; with a pointer over
  // the hero the shadows fall away from it. SWING and REACH below set how far they travel.
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    const SWING = 10;
    const REACH = 30;
    let raf = 0;
    let running = false;
    let onScreen = true;
    let px: number | null = null;
    let py = 0;
    let cx = 8;
    let cy = 8;
    const frame = (t: number) => {
      const a = t / 900;
      const tx = px === null ? Math.cos(a) * SWING : px;
      const ty = px === null ? 8 + Math.sin(a * 2) * 2.5 : py;
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      el.style.setProperty("--sx", cx.toFixed(2));
      el.style.setProperty("--sy", cy.toFixed(2));
      raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      const want = onScreen && !document.hidden;
      if (want && !running) {
        running = true;
        raf = requestAnimationFrame(frame);
      } else if (!want && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      px = -((e.clientX - r.left) / r.width - 0.5) * REACH;
      py = -((e.clientY - r.top) / r.height - 0.5) * REACH * 0.8;
    };
    const leave = () => {
      px = null;
    };
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    io.observe(el);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointercancel", leave);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointercancel", leave);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [reduce]);

  return (
    <section ref={ref} className={`${K} relative overflow-hidden bg-[#ffe14d] px-5 py-16 text-[#111] sm:px-8 sm:py-24`}>
      <style>{`
        .${K} { --sx: 8; --sy: 8; background-image: radial-gradient(rgba(17,17,17,0.16) 1.5px, transparent 1.6px); background-size: 22px 22px; }
        .${K}-sh { box-shadow: calc(var(--sx) * 1px) calc(var(--sy) * 1px) 0 0 #111; }
        .${K}-sh-lg { box-shadow: calc(var(--sx) * 1.7px) calc(var(--sy) * 1.7px) 0 0 #111; }
        .${K}-drop { filter: drop-shadow(calc(var(--sx) * 0.8px) calc(var(--sy) * 0.8px) 0 #111); }
        .${K}-btn { transition: transform 0.12s ease, box-shadow 0.12s ease; }
        .${K}-btn:hover { transform: translate(calc(var(--sx) * 0.5px), calc(var(--sy) * 0.5px)); box-shadow: calc(var(--sx) * 0.5px) calc(var(--sy) * 0.5px) 0 0 #111; }
        .${K}-btn:active { transform: translate(calc(var(--sx) * 1px), calc(var(--sy) * 1px)); box-shadow: 0 0 0 0 #111; }
        @keyframes ${K}-wobble { 0%, 100% { transform: rotate(-7deg); } 50% { transform: rotate(8deg); } }
        @keyframes ${K}-nod { 0%, 100% { transform: rotate(-3deg) translateY(0); } 50% { transform: rotate(4deg) translateY(-4px); } }
        .${K}-wobble { animation: ${K}-wobble 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite; }
        .${K}-nod { animation: ${K}-nod 3s cubic-bezier(0.45, 0, 0.55, 1) infinite; }
        @media (prefers-reduced-motion: reduce) { .${K}-wobble, .${K}-nod { animation: none; } .${K}-btn { transition: none; } }
      `}</style>

      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        <div>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`${K}-sh inline-flex items-center gap-2 rounded-full border-[3px] border-[#111] bg-white px-4 py-1.5 text-xs font-black uppercase tracking-widest`}
          >
            <span className="h-2.5 w-2.5 rounded-full border-2 border-[#111] bg-[#ff5fa2]" aria-hidden="true" />
            Gumdrop Sticker Co.
          </motion.p>

          <h1 className="mt-7 flex flex-wrap gap-x-3 gap-y-3 sm:gap-x-4 sm:gap-y-4" aria-label={words.map((w) => w.text).join(" ")}>
            {words.map((w, i) => (
              <motion.span
                key={w.text}
                aria-hidden="true"
                initial={reduce ? false : { opacity: 0, scale: 1.9, rotate: w.tilt * 5, y: -40 }}
                animate={{ opacity: 1, scale: 1, rotate: w.tilt, y: 0 }}
                whileHover={reduce ? undefined : { rotate: -w.tilt, scale: 1.06 }}
                transition={{ type: "spring", stiffness: 420, damping: 17, delay: reduce ? 0 : 0.12 + i * 0.11 }}
                className={`${K}-sh inline-block rounded-2xl border-[3px] border-[#111] bg-white p-1.5`}
              >
                <span
                  className="block rounded-xl border-[3px] border-[#111] px-3 pb-1.5 pt-0.5 text-5xl font-black leading-none tracking-tight sm:px-4 sm:pb-2.5 sm:pt-1 sm:text-7xl xl:text-[5.25rem]"
                  style={{ backgroundColor: w.fill }}
                >
                  {w.text}
                </span>
              </motion.span>
            ))}
          </h1>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 22, delay: reduce ? 0 : 0.75 }}
          >
            <p className="mt-8 max-w-lg text-lg font-semibold leading-relaxed">
              Die-cut vinyl stickers printed from your artwork in two days. Upload a file, pick a size, and we send back a proof before anything touches the press.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#"
                className={`${K}-sh ${K}-btn inline-flex h-14 items-center gap-2 rounded-xl border-[3px] border-[#111] bg-[#ff5fa2] px-6 text-base font-black uppercase tracking-wide focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#111] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffe14d]`}
              >
                Start an order
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 10h12M11 5l5 5-5 5" />
                </svg>
              </a>
              <a
                href="#"
                className={`${K}-sh ${K}-btn inline-flex h-14 items-center rounded-xl border-[3px] border-[#111] bg-white px-6 text-base font-black uppercase tracking-wide focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#111] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffe14d]`}
              >
                Get free samples
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
              {facts.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="h-3 w-3 rotate-45 border-2 border-[#111] bg-[#38d6ff]" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 60, rotate: 14 }}
            animate={{ opacity: 1, y: 0, rotate: 4 }}
            transition={{ type: "spring", stiffness: 160, damping: 15, delay: reduce ? 0 : 0.35 }}
            className={`${K}-sh-lg rounded-3xl border-[3px] border-[#111] bg-white p-4 sm:p-5`}
          >
            <p className="border-b-[3px] border-dashed border-[#111] pb-3 text-right text-[11px] font-black uppercase tracking-widest">Sheet 014 / A5 matte vinyl</p>
            <ul className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
              {sheet.map((s, i) => (
                <motion.li
                  key={s.id}
                  initial={reduce ? false : { opacity: 0, scale: 0.3, rotate: -30 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 14, delay: reduce ? 0 : 0.6 + i * 0.07 }}
                >
                  <div
                    className={`${K}-nod aspect-square rounded-2xl border-[3px] border-[#111] p-2.5 sm:p-3`}
                    style={{ backgroundColor: s.fill, animationDelay: `${-i * 0.55}s` }}
                  >
                    <Art id={s.id} />
                  </div>
                </motion.li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between rounded-xl border-[3px] border-[#111] bg-[#111] px-4 py-2.5 text-sm font-black text-white">
              <span>50 sheets</span>
              <span className="text-[#ffe14d]">$64.00</span>
            </div>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 11, delay: reduce ? 0 : 1 }}
            className="absolute -left-4 -top-10 h-28 w-28 sm:-left-10 sm:-top-12 sm:h-32 sm:w-32"
          >
            <div className={`${K}-wobble ${K}-drop relative h-full w-full`}>
              <svg viewBox="-2 -2 104 104" className="h-full w-full" aria-hidden="true">
                <polygon points={seal} fill="#ff8a3d" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
              </svg>
              <p className="absolute inset-0 flex flex-col items-center justify-center text-center font-black uppercase leading-none">
                <span className="text-2xl sm:text-[1.7rem]">2 for 1</span>
                <span className="mt-1 text-[10px] tracking-widest">this week</span>
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 11, delay: reduce ? 0 : 1.12 }}
            className="absolute -bottom-7 -right-2 sm:-right-6"
          >
            <p
              className={`${K}-wobble ${K}-sh rounded-full border-[3px] border-[#111] bg-[#38d6ff] px-4 py-2 text-sm font-black uppercase tracking-wide`}
              style={{ animationDelay: "-1.1s", animationDuration: "2.9s" }}
            >
              Free proof first
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

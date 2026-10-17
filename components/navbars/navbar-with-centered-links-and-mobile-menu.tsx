import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";

/** One entry per page link. Each link brings its own photograph, headline and facts to the hero. */
const links = [
  {
    label: "Day trips",
    img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80",
    thumb: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=200&q=80",
    alt: "A wooden rowing boat crossing a turquoise mountain lake below pale limestone cliffs",
    headline: ["Row out before", "the wind does."],
    copy: "Larch rowing boats by the hour or the day, from the old jetty on the north shore. No engines on this water since 1971.",
    facts: [["First boat", "06:30"], ["Water", "11 °C"], ["Per hour", "$28"]],
  },
  {
    label: "Boathouse",
    img: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=80",
    thumb: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=200&q=80",
    alt: "A timber boathouse on stilts over a green lake with cloud on the mountains behind",
    headline: ["On stilts", "since 1934."],
    copy: "Nineteen boats sleep under one shingle roof. Come by after four and watch Ilse oil the oars for the morning.",
    facts: [["Boats", "19"], ["Open", "Apr to Oct"], ["Varnished", "Each March"]],
  },
  {
    label: "Routes",
    img: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?auto=format&fit=crop&w=1600&q=80",
    thumb: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?auto=format&fit=crop&w=200&q=80",
    alt: "A long still lake at sunset with a snow covered mountain range on the far shore",
    headline: ["Eleven kilometres", "of quiet water."],
    copy: "Three marked routes, from a forty minute loop of the reed beds to the full length of the lake with lunch at the far hut.",
    facts: [["Short loop", "40 min"], ["Far hut", "3 h 10"], ["Buoys", "Each 500 m"]],
  },
  {
    label: "Journal",
    img: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1600&q=80",
    thumb: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=200&q=80",
    alt: "Mountain peaks lit orange by sunrise and mirrored in a calm blue lake",
    headline: ["Notes from", "the far shore."],
    copy: "What the lake did this week, written at the bench by the slipway. Ice out dates, first swifts, the morning the fog stayed.",
    facts: [["Latest", "First frost"], ["Written by", "Ilse Brandt"], ["Entries", "212"]],
  },
];

const brand = "Tarnside Boats";
const CYCLE_MS = 3600; // how long the preview rests on each link until someone touches the menu
const SPRING = { type: "spring", stiffness: 380, damping: 34 } as const;
const ring = "focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40";

function BoatMark() {
  return (
    <svg viewBox="0 0 28 28" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 17c3 4 7 6 11 6s8-2 11-6Z" />
      <path d="M14 17V4" />
      <path d="M14 5c3 1 5 4 6 8h-6" />
    </svg>
  );
}

export default function NavbarWithCenteredLinksAndMobileMenu() {
  const reduce = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const inView = useInView(root, { amount: 0.3 });
  // The page being viewed, the link being previewed (hover or focus) and whether the preview still plays by itself.
  const [current, setCurrent] = useState(0);
  const [peek, setPeek] = useState<number | null>(null);
  const [demo, setDemo] = useState(true);
  // Starts open so a phone preview shows the menu. Set to false on a real site.
  const [open, setOpen] = useState(true);

  const shown = peek ?? current;
  const page = links[shown];
  const playing = demo && !reduce && inView;

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setCurrent((c) => (c + 1) % links.length), CYCLE_MS);
    return () => window.clearInterval(id);
  }, [playing]);

  const choose = (i: number) => {
    setDemo(false);
    setCurrent(i);
    setPeek(null);
  };
  const preview = (i: number | null) => {
    if (i !== null) setDemo(false);
    setPeek(i);
  };
  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Escape") return;
    setOpen(false);
    menuButton.current?.focus();
  };

  return (
    <section ref={root} className="relative isolate overflow-hidden bg-[#0b1d24] text-white">
      <style>{`
        @keyframes navbar-with-centered-links-and-mobile-menu-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes navbar-with-centered-links-and-mobile-menu-drift { from { transform: scale(1.04) translate3d(0, 0, 0); } to { transform: scale(1.12) translate3d(-1%, -1%, 0); } }
        .navbar-with-centered-links-and-mobile-menu-fill { transform-origin: left; animation: navbar-with-centered-links-and-mobile-menu-fill ${CYCLE_MS}ms linear both; }
        .navbar-with-centered-links-and-mobile-menu-drift { animation: navbar-with-centered-links-and-mobile-menu-drift 14s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .navbar-with-centered-links-and-mobile-menu-fill, .navbar-with-centered-links-and-mobile-menu-drift { animation: none; }
        }
      `}</style>

      {/* Every link's photograph is stacked here; only the shown one is opaque. */}
      <div className="absolute inset-0 -z-10">
        {links.map((l, i) => (
          <motion.div key={l.label} className="absolute inset-0" initial={false} animate={{ opacity: i === shown ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <img
              key={i === shown ? "on" : "off"}
              src={l.img}
              alt={i === shown ? l.alt : ""}
              width={1600}
              height={1067}
              loading="lazy"
              className={`h-full w-full object-cover ${i === shown ? "navbar-with-centered-links-and-mobile-menu-drift" : "scale-105"}`}
            />
          </motion.div>
        ))}
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#06141a]/80 via-[#06141a]/35 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-[#06141a]/90 via-[#06141a]/45 to-transparent" aria-hidden="true" />
      </div>

      <div className="relative mx-auto flex min-h-[680px] max-w-7xl flex-col px-5 sm:px-8 lg:min-h-[700px]">
        {/* The bar: three columns, so the links sit in the true centre whatever the two sides weigh. */}
        <header className="relative z-20 grid h-20 grid-cols-[1fr_auto] items-center border-b border-white/20 md:grid-cols-[1fr_auto_1fr]">
          <a href="#" className={`flex w-fit items-center gap-2.5 rounded-full text-[15px] font-semibold tracking-tight ${ring}`}>
            <BoatMark />
            {brand}
          </a>

          <nav aria-label="Main" className="hidden md:block" onPointerLeave={() => setPeek(null)}>
            <ul className="flex items-center">
              {links.map((l, i) => (
                <li key={l.label}>
                  <a
                    href="#"
                    aria-current={i === current ? "page" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      choose(i);
                    }}
                    onPointerEnter={(e) => e.pointerType === "mouse" && preview(i)}
                    onFocus={() => preview(i)}
                    onBlur={() => setPeek(null)}
                    className={`relative flex h-20 items-center px-5 text-sm font-medium transition-colors duration-300 ${ring} ${i === shown ? "text-white" : "text-white/80 hover:text-white"}`}
                  >
                    {l.label}
                    {i === shown && (
                      <motion.span layoutId="navbar-with-centered-links-and-mobile-menu-marker" transition={reduce ? { duration: 0 } : SPRING} className="absolute inset-x-5 -bottom-px h-[3px] overflow-hidden rounded-full bg-white/40" aria-hidden="true">
                        {/* While the preview plays, the marker doubles as the timer for the next link. */}
                        <span key={shown} className={`block h-full w-full rounded-full bg-[#ffd9a0] ${playing ? "navbar-with-centered-links-and-mobile-menu-fill" : ""}`} />
                      </motion.span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center justify-end gap-1">
            <a href="#" className={`hidden h-10 items-center rounded-full px-4 text-sm font-medium text-white transition-opacity hover:opacity-80 md:inline-flex ${ring}`}>
              Sign in
            </a>
            <a href="#" className={`hidden h-10 items-center gap-2 rounded-full bg-[#fff4e2] pl-4 pr-1.5 text-sm font-semibold text-[#0b1d24] shadow-lg shadow-black/25 transition-transform hover:-translate-y-0.5 md:inline-flex ${ring}`}>
              Book a boat
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0b1d24] text-[#fff4e2]">
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
              </span>
            </a>
            <button
              ref={menuButton}
              type="button"
              aria-expanded={open}
              aria-controls="navbar-with-centered-links-and-mobile-menu-panel"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen(!open)}
              className={`relative flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md md:hidden ${ring}`}
            >
              <span aria-hidden="true" className={`absolute h-0.5 w-5 rounded-full bg-white transition-transform duration-300 motion-reduce:transition-none ${open ? "rotate-45" : "-translate-y-[5px]"}`} />
              <span aria-hidden="true" className={`absolute h-0.5 w-5 rounded-full bg-white transition-transform duration-300 motion-reduce:transition-none ${open ? "-rotate-45" : "translate-y-[5px]"}`} />
            </button>
          </div>
        </header>

        {/* Phone menu: a sheet of dark glass that drops from the bar, one photo row per link. */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="navbar-with-centered-links-and-mobile-menu-panel"
              onKeyDown={onMenuKey}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.16 } }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 30 }}
              className="absolute inset-x-3 top-[88px] z-30 origin-top rounded-[28px] border border-white/20 bg-[#06141a]/75 p-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl md:hidden"
            >
              <nav aria-label="Mobile">
                <ul>
                  {links.map((l, i) => (
                    <li key={l.label}>
                      <a
                        href="#"
                        aria-current={i === current ? "page" : undefined}
                        onClick={(e) => {
                          e.preventDefault();
                          choose(i);
                        }}
                        className={`flex items-center gap-3 rounded-[20px] p-2 pr-4 transition-colors ${ring} ${i === current ? "bg-white/15" : "hover:bg-white/10"}`}
                      >
                        <img src={l.thumb} alt="" width={56} height={56} loading="lazy" className="h-14 w-14 flex-none rounded-2xl object-cover" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-lg font-medium tracking-tight">{l.label}</span>
                          <span className="block truncate text-[13px] text-white/80">{l.headline.join(" ")}</span>
                        </span>
                        <span className={`h-2 w-2 flex-none rounded-full ${i === current ? "bg-[#ffd9a0]" : "bg-white/25"}`} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/15 p-2 pt-3">
                <a href="#" className={`flex h-12 items-center justify-center rounded-full border border-white/30 text-sm font-semibold ${ring}`}>Sign in</a>
                <a href="#" className={`flex h-12 items-center justify-center rounded-full bg-[#fff4e2] text-sm font-semibold text-[#0b1d24] ${ring}`}>Book a boat</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The slice of page under the bar. It follows whichever link is shown. */}
        <div className="mt-auto grid items-end gap-8 pb-8 pt-40 sm:pb-12 lg:grid-cols-[1fr_auto] lg:gap-16">
          <div aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={shown}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, transition: { duration: 0.12 } }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28 }}
              >
                <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#ffd9a0]">
                  <span className="tabular-nums">0{shown + 1} / 0{links.length}</span>
                  <span className="h-px w-10 bg-[#ffd9a0]/70" aria-hidden="true" />
                  {page.label}
                </p>
                <h1 className="mt-5 text-[clamp(2.6rem,7.4vw,6.4rem)] font-light leading-[0.94] tracking-[-0.045em]">
                  {page.headline.map((line) => (
                    <span key={line} className="block">{line}</span>
                  ))}
                </h1>
                <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/90 sm:text-base">{page.copy}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <dl className="grid grid-cols-3 overflow-hidden rounded-3xl border border-white/25 bg-gradient-to-br from-white/20 to-white/5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-xl lg:w-[420px]">
            {page.facts.map(([label, value], i) => (
              <div key={`${shown}-${label}`} className={`min-w-0 px-4 py-4 sm:px-5 ${i > 0 ? "border-l border-white/15" : ""}`}>
                <dt className="truncate text-[11px] font-medium uppercase tracking-[0.16em] text-white/80">{label}</dt>
                <dd className="mt-2 truncate text-base font-medium tabular-nums tracking-tight sm:text-lg">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

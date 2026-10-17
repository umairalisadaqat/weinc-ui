import { useEffect, useRef } from "react";

const SKEW = 1; // degrees of slant per pixel scrolled in one frame
const MAX = 9; // the strongest slant, in degrees
const LAG = 0.06; // rows further down follow a little later, which makes the wave
const IDLE = 160; // the self-scroll demo swings this many px down and back every 4.8 s; 0 turns it off

const CLASSES = [
  ["Lindy Hop", "Mon 19:00"],
  ["Argentine Tango", "Mon 20:30"],
  ["Salsa", "Tue 19:30"],
  ["Ballet Barre", "Wed 18:15"],
  ["Contemporary", "Wed 20:00"],
  ["Tap", "Thu 19:00"],
  ["West Coast Swing", "Thu 20:30"],
  ["Flamenco", "Fri 18:30"],
  ["Social Dance", "Sat 20:00"],
];

export default function HeadlineRowsSkewWithScrollSpeed() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    // The box is the scroller here. On a normal page, listen on window and read scrollY instead.
    const sc = el;
    const rows = Array.from(el.querySelectorAll<HTMLElement>(".w3skh-row"));
    const cur = rows.map(() => 0);
    let demo = IDLE > 0;
    const used = () => { demo = false; el.setAttribute("data-used", ""); };
    const inputs = ["wheel", "touchstart", "pointerdown", "keydown"];
    inputs.forEach((e) => el.addEventListener(e, used, { passive: true }));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = sc.scrollTop;
    let f = 0;
    let on = false;
    let t0 = 0;
    const tick = (now: number) => {
      if (demo && on) {
        sc.scrollTop = IDLE * (1 - Math.cos((now - t0) / 764));
      }
      const p = sc.scrollTop;
      const v = p - last;
      last = p;
      let moving = !!v || demo;
      const target = Math.max(-MAX, Math.min(MAX, -v * SKEW));
      rows.forEach((r, i) => {
        let c = cur[i] + (target - cur[i]) * Math.max(0.04, 0.2 - (i * LAG) / 3);
        if (Math.abs(c) < 0.01 && !v) c = 0;
        cur[i] = c;
        if (c) moving = true;
        r.style.transform = c ? `skewX(${c.toFixed(2)}deg)` : "";
      });
      f = on && moving ? requestAnimationFrame(tick) : 0;
    };
    const run = () => { if (!f && on) f = requestAnimationFrame(tick); };
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      if (on) { t0 = performance.now(); run(); }
      else { cancelAnimationFrame(f); f = 0; }
    });
    if (!reduce) {
      sc.addEventListener("scroll", run, { passive: true });
      io.observe(el);
    }
    return () => {
      io.disconnect();
      cancelAnimationFrame(f);
      sc.removeEventListener("scroll", run);
      inputs.forEach((e) => el.removeEventListener(e, used));
    };
  }, []);

  return (
    <section
      ref={root}
      tabIndex={0}
      aria-label="Corva Dance Hall, weekly classes"
      className="w3skh relative h-[620px] overflow-y-auto overscroll-contain bg-[#a9472a] text-[#fbefe4] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#fbefe4]"
    >
      <style>{`
        .w3skh-hint { background: linear-gradient(#a9472a 60%, transparent); transition: opacity .5s ease; }
        .w3skh[data-used] .w3skh-hint { opacity: 0; }
        .w3skh-row { transform-origin: 0 100%; will-change: transform; }
        .w3skh-name { font: 400 clamp(40px, 8.4vw, 104px)/.95 Georgia, "Times New Roman", serif; letter-spacing: -.035em; }
        .w3skh-row:hover .w3skh-name, .w3skh-row:focus-visible .w3skh-name { font-style: italic; }
        .w3skh-row:focus-visible { outline: 2px solid #fbefe4; outline-offset: 4px; }
        @media (prefers-reduced-motion: reduce) { .w3skh-row { transform: none !important; } .w3skh-hint { transition: none; } }
      `}</style>
      <p aria-hidden="true" className="w3skh-hint sticky top-0 z-[2] px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.22em]">
        Scroll inside
      </p>
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-x-10 gap-y-3 px-5 pb-7 pt-4">
        <p className="text-xs font-bold uppercase tracking-[0.24em]">Corva Dance Hall</p>
        <p className="max-w-[26rem] text-base leading-relaxed">
          Evening classes in a sprung-floor hall above the old tram depot. Drop in, or book a term.
        </p>
      </div>
      <h2 className="sr-only">Weekly classes</h2>
      <ul className="mx-auto max-w-6xl px-5 pb-8">
        {CLASSES.map(([name, when]) => (
          <li key={name} className="border-t border-[#fbefe4]/30 last:border-b">
            <a href="#" className="w3skh-row flex flex-col justify-between gap-1.5 pb-2.5 pt-3.5 min-[561px]:flex-row min-[561px]:items-baseline min-[561px]:gap-4">
              <span className="w3skh-name">{name}</span>
              <span className="flex-none text-[13px] font-semibold uppercase tabular-nums tracking-[0.08em]">{when}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mx-auto max-w-6xl px-5 pb-[72px] text-[15px] leading-relaxed">
        Shoes with suede or leather soles, please. Changing rooms open half an hour before the first class.
      </p>
    </section>
  );
}

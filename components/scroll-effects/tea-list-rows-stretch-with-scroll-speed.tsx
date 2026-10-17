import { useEffect, useRef } from "react";

const STRETCH = 0.035; // extra height per pixel scrolled in one frame (0.035 = 3.5%)
const MAX = 0.22; // the most a row may stretch
const EASE = 0.14; // how quickly rows follow the speed and settle back
const IDLE = 160; // the self-scroll demo swings this many px down and back every 4.8 s; 0 turns it off

const TEAS = [
  ["Darjeeling first flush", "India, spring picking", "6.20"],
  ["Assam breakfast", "India, malty and full", "4.80"],
  ["Sencha", "Japan, steamed green", "5.60"],
  ["Gyokuro", "Japan, shade grown", "8.40"],
  ["Tie Guan Yin", "China, rolled oolong", "6.90"],
  ["Keemun", "China, light smoke", "5.20"],
  ["Silver needle", "China, white buds", "9.10"],
  ["Ceylon high grown", "Sri Lanka, bright", "4.90"],
  ["Rooibos", "South Africa, red bush", "4.40"],
  ["Fresh mint", "From the garden", "3.80"],
];

export default function TeaListRowsStretchWithScrollSpeed() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    // The box is the scroller here. On a normal page, read scrollY and innerHeight instead.
    const sc = el;
    const rows = Array.from(el.querySelectorAll<HTMLElement>(".w3stl-row"));
    let tops: number[] = [];
    const measure = () => {
      const base = sc.getBoundingClientRect().top - sc.scrollTop;
      tops = rows.map((r) => { const b = r.getBoundingClientRect(); return b.top - base + b.height / 2; });
    };
    let demo = IDLE > 0;
    const used = () => { demo = false; el.setAttribute("data-used", ""); };
    const inputs = ["wheel", "touchstart", "pointerdown", "keydown"];
    inputs.forEach((e) => el.addEventListener(e, used, { passive: true }));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = sc.scrollTop;
    let up = false;
    let cur = 0;
    let f = 0;
    let on = false;
    let t0 = 0;
    const tick = (now: number) => {
      if (demo && on) {
        sc.scrollTop = IDLE * (1 - Math.cos((now - t0) / 764));
      }
      const p = sc.scrollTop;
      const v = p - last;
      const h = sc.clientHeight;
      const mid = p + h / 2;
      last = p;
      if (v) up = v < 0;
      cur += (Math.min(MAX, Math.abs(v) * STRETCH) - cur) * EASE;
      if (cur < 0.001 && !v) cur = 0;
      rows.forEach((r, i) => {
        // rows near the middle of the box stretch most, rows at the edges barely
        const k = cur * Math.max(0, 1 - Math.abs(tops[i] - mid) / (h * 0.75));
        r.style.transformOrigin = up ? "50% 100%" : "50% 0";
        r.style.transform = k > 0.001 ? `scaleY(${(1 + k).toFixed(3)})` : "";
      });
      f = on && (cur || v || demo) ? requestAnimationFrame(tick) : 0;
    };
    const run = () => { if (!f && on) f = requestAnimationFrame(tick); };
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      if (on) { measure(); t0 = performance.now(); run(); }
      else { cancelAnimationFrame(f); f = 0; }
    });
    if (!reduce) {
      sc.addEventListener("scroll", run, { passive: true });
      window.addEventListener("resize", measure);
      io.observe(el);
    }
    return () => {
      io.disconnect();
      cancelAnimationFrame(f);
      sc.removeEventListener("scroll", run);
      window.removeEventListener("resize", measure);
      inputs.forEach((e) => el.removeEventListener(e, used));
    };
  }, []);

  return (
    <section
      ref={root}
      tabIndex={0}
      aria-label="Hollow Lane Tea Room, tea list"
      className="w3stl relative h-[620px] overflow-y-auto overscroll-contain bg-[#eee3cf] text-[#2b2118] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#7a5a2e]"
    >
      <style>{`
        .w3stl-hint { background: linear-gradient(#eee3cf 60%, transparent); transition: opacity .5s ease; }
        .w3stl[data-used] .w3stl-hint { opacity: 0; }
        .w3stl-row { will-change: transform; }
        .w3stl-serif { font-family: Georgia, "Times New Roman", serif; }
        @media (prefers-reduced-motion: reduce) { .w3stl-row { transform: none !important; } .w3stl-hint { transition: none; } }
      `}</style>
      <p aria-hidden="true" className="w3stl-hint sticky top-0 z-[2] px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a5843]">
        Scroll inside
      </p>
      <div className="mx-auto max-w-[52rem] px-5 pb-8 pt-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7a5a2e]">Hollow Lane Tea Room</p>
        <h2 className="w3stl-serif mt-3 text-[clamp(32px,4.6vw,48px)] font-normal leading-[1.1] tracking-[-0.02em]">Loose leaf, brewed by the pot.</h2>
        <p className="mx-auto mt-3.5 max-w-[30rem] text-base leading-relaxed text-[#5a4a38]">
          Each pot serves two to three cups. Ask for a second steep of any leaf.
        </p>
      </div>
      <ol className="mx-auto max-w-[52rem] px-5 pb-7">
        {TEAS.map(([name, from, price]) => (
          <li key={name} className="w3stl-row grid grid-cols-[1fr_auto] items-baseline gap-x-4 border-t border-[#d3c4a8] py-[18px] last:border-b">
            <span className="w3stl-serif text-[clamp(22px,3vw,30px)] leading-[1.15]">{name}</span>
            <span className="row-start-2 pt-1 text-sm text-[#5a4a38]">{from}</span>
            <span className="row-span-2 self-center text-[17px] font-semibold tabular-nums">{price}</span>
          </li>
        ))}
      </ol>
      <p className="mx-auto max-w-[52rem] px-5 pb-[72px] text-center text-sm leading-relaxed text-[#5a4a38]">
        Prices per pot. Scones and the day's cake are listed on the board by the counter.
      </p>
    </section>
  );
}

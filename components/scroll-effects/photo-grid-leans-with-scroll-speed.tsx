import { useEffect, useRef } from "react";

const LEAN = 0.6; // degrees of lean per pixel scrolled in one frame
const MAX = 6; // the most a column may lean, in degrees
const EASE = 0.12; // how quickly columns follow the speed and settle back
const IDLE = 55; // the self-scroll demo swings this many px down and back every 4.8 s; 0 turns it off
const MIX = [1, 0.55, 0.85]; // each column leans by a different share, so the grid ripples

const COLUMNS = [
  [
    ["https://images.pexels.com/photos/15022475/pexels-photo-15022475.jpeg?auto=compress&cs=tinysrgb&w=700", "Harbour lighthouse", "01", "A stone lighthouse at the end of a rocky breakwater under a clear sky"],
    ["https://images.pexels.com/photos/8933075/pexels-photo-8933075.jpeg?auto=compress&cs=tinysrgb&w=700", "Dune grass", "04", "Pale dune grass bending over sand under an overcast sky"],
    ["https://images.pexels.com/photos/20799401/pexels-photo-20799401.jpeg?auto=compress&cs=tinysrgb&w=700", "Tide pool in a cove", "07", "Still water in a tide pool between rust coloured rocks"],
    ["https://images.pexels.com/photos/2233362/pexels-photo-2233362.jpeg?auto=compress&cs=tinysrgb&w=700", "Trawlers hauled out", "10", "Fishing trawlers hauled out on a harbour hardstand"],
  ],
  [
    ["https://images.pexels.com/photos/11363530/pexels-photo-11363530.jpeg?auto=compress&cs=tinysrgb&w=700", "Floats on the deck", "02", "Yellow floats and crates on the deck of a moored fishing boat"],
    ["https://images.pexels.com/photos/15379643/pexels-photo-15379643.jpeg?auto=compress&cs=tinysrgb&w=700", "Surf between rocks", "05", "White surf breaking in a gap between sandstone rocks"],
    ["https://images.pexels.com/photos/8970615/pexels-photo-8970615.jpeg?auto=compress&cs=tinysrgb&w=700", "Beach pebbles", "08", "Close view of smooth grey, green and brown beach pebbles"],
    ["https://images.pexels.com/photos/11207937/pexels-photo-11207937.jpeg?auto=compress&cs=tinysrgb&w=700", "Black rock shore", "11", "Black volcanic rocks along a shoreline with a strip of water between them"],
  ],
  [
    ["https://images.pexels.com/photos/16549060/pexels-photo-16549060.jpeg?auto=compress&cs=tinysrgb&w=700", "Headland, grey sea", "03", "A dark rocky headland running into a calm grey sea"],
    ["https://images.pexels.com/photos/9435233/pexels-photo-9435233.jpeg?auto=compress&cs=tinysrgb&w=700", "Path through the dunes", "06", "A sandy path running between green grassy dunes"],
    ["https://images.pexels.com/photos/4616317/pexels-photo-4616317.jpeg?auto=compress&cs=tinysrgb&w=700", "Wooded cliff", "09", "A wooded cliff dropping into still blue water"],
    ["https://images.pexels.com/photos/11468623/pexels-photo-11468623.jpeg?auto=compress&cs=tinysrgb&w=700", "Marina pontoon", "12", "Small boats tied along a marina pontoon on a cloudy day"],
  ],
] as const;

export default function PhotoGridLeansWithScrollSpeed() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    // The box is the scroller here. On a normal page, listen on window and read scrollY instead.
    const sc = el;
    const cols = Array.from(el.querySelectorAll<HTMLElement>(".w3lgr-col"));
    let demo = IDLE > 0;
    const used = () => { demo = false; el.setAttribute("data-used", ""); };
    const inputs = ["wheel", "touchstart", "pointerdown", "keydown"];
    inputs.forEach((e) => el.addEventListener(e, used, { passive: true }));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = sc.scrollTop;
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
      last = p;
      cur += (Math.max(-MAX, Math.min(MAX, v * LEAN)) - cur) * EASE;
      if (Math.abs(cur) < 0.01 && !v) cur = 0;
      cols.forEach((c, i) => { c.style.transform = cur ? `skewY(${(cur * MIX[i]).toFixed(2)}deg)` : ""; });
      f = on && (cur || v || demo) ? requestAnimationFrame(tick) : 0;
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
      aria-label="Saltline Print Room, coastal prints"
      className="w3lgr relative h-[640px] overflow-y-auto overscroll-contain bg-[#f4f5f6] text-[#1d232a] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#2f6f9f]"
    >
      <style>{`
        .w3lgr-hint { background: linear-gradient(#f4f5f6 60%, transparent); transition: opacity .5s ease; }
        .w3lgr[data-used] .w3lgr-hint { opacity: 0; }
        .w3lgr-col { will-change: transform; }
        @media (prefers-reduced-motion: reduce) { .w3lgr-col { transform: none !important; } .w3lgr-hint { transition: none; } }
      `}</style>
      <p aria-hidden="true" className="w3lgr-hint sticky top-0 z-[2] px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5b6570]">
        Scroll inside
      </p>
      <div className="mx-auto max-w-[68rem] px-5 pb-10 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f9f]">Saltline Print Room</p>
        <h2 className="mt-3 max-w-[34rem] text-[clamp(28px,4vw,42px)] font-semibold leading-[1.12] tracking-[-0.025em]">
          Prints from a year of walking the north coast.
        </h2>
        <p className="mt-3.5 max-w-[34rem] text-base leading-relaxed text-[#4a535d]">
          Each photograph is printed on cotton rag paper in the studio and signed on the back. Pick a frame or take it rolled.
        </p>
      </div>
      <div className="mx-auto grid max-w-[68rem] grid-cols-2 gap-4 px-5 pb-20 min-[760px]:grid-cols-3 min-[760px]:gap-6">
        {COLUMNS.map((col, c) => (
          <div
            key={c}
            className={`w3lgr-col content-start gap-4 min-[760px]:gap-6 ${
              c === 1 ? "mt-14 grid" : c === 2 ? "hidden min-[760px]:mt-6 min-[760px]:grid" : "grid"
            }`}
          >
            {col.map(([src, label, no, alt]) => (
              <figure key={src}>
                <img
                  src={src}
                  alt={alt}
                  loading="lazy"
                  width={700}
                  height={875}
                  className="block aspect-[4/5] h-auto w-full rounded-[10px] bg-[#dde1e5] object-cover"
                />
                <figcaption className="flex justify-between gap-2 pt-2 text-sm font-medium">
                  {label} <span className="flex-none tabular-nums text-[#5b6570]">No. {no}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

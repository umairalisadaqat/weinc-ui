import { useEffect, useRef } from "react";

const ZOOM = 0.1; // how much the backdrop eases out (scale 1.1 -> 1.0) across the whole scroll
const WALKS = [
  { day: "Day one", title: "Harbour to the lighthouse", text: "A level start along the sea wall, then a gentle climb to the lamp room for the first long view of the bay.", km: "11 km" },
  { day: "Day two", title: "The red cliffs", text: "The wildest stretch: open headland, a lot of sky, and a lunch stop above the cove where seals haul out.", km: "16 km" },
  { day: "Day three", title: "Through the oak combe", text: "The path drops inland into shade, crosses two footbridges and climbs back out to a farm tea room.", km: "13 km" },
  { day: "Day four", title: "Down to Pellow Sands", text: "An easy final morning that ends on a wide beach, with your bags already waiting at the station hotel.", km: "8 km" },
];

export default function StickyPhotoBackdropWithCardsPassingOver() {
  const box = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let on = true;
    const draw = () => {
      frame = 0;
      el.classList.toggle("w6stk-moved", el.scrollTop > 8);
      if (reduce || !photo.current) return;
      const m = el.scrollHeight - el.clientHeight;
      const p = m ? el.scrollTop / m : 0;
      photo.current.style.transform = `scale(${(1 + ZOOM * (1 - p)).toFixed(4)})`;
    };
    const req = () => {
      if (on && !frame) frame = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      if (on) req();
    });
    io.observe(el);
    el.addEventListener("scroll", req, { passive: true });
    req();
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      el.removeEventListener("scroll", req);
    };
  }, []);

  return (
    <div ref={box} tabIndex={0} role="region" aria-label="Fernmouth coast walk, scrollable preview" className="w6stk relative h-[620px] overflow-y-auto overscroll-contain bg-[#0f1b2a] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e9dcc4]">
      <style>{`
        .w6stk-photo { transform: scale(1.1); transform-origin: 50% 40%; will-change: transform; }
        .w6stk-hint { transition: opacity .5s ease; }
        .w6stk-moved .w6stk-hint { opacity: 0; }
        @media (prefers-reduced-motion: reduce) { .w6stk-photo { transform: none; will-change: auto; } }
      `}</style>
      <div className="sticky top-0 h-[620px] overflow-hidden">
        <img ref={photo} src="https://images.pexels.com/photos/7694094/pexels-photo-7694094.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="A rocky headland with dry grass and dark green trees above a wide grey sea under cloud" width={1600} height={1280} className="w6stk-photo absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#0f1b2a]/80 via-[#0f1b2a]/30 to-[#0f1b2a]/85" />
        <div className="relative px-6 pt-12 sm:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#e9dcc4]">Fernmouth Coast Walks</p>
          <h2 className="mt-3 max-w-lg text-4xl font-semibold leading-tight text-white sm:text-5xl">Four days on the south coast path</h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-[#dfe6ee]">Self-guided, with bags carried between inns. The cliffs stay put while the days go by.</p>
        </div>
        <span className="w6stk-hint pointer-events-none absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-[#0f1b2a]" aria-hidden="true">Scroll inside</span>
      </div>
      <ol className="relative -mt-[620px] space-y-5 px-5 pb-16 pt-[360px] sm:ml-auto sm:max-w-md sm:px-10">
        {WALKS.map((w) => (
          <li key={w.title} className="rounded-xl bg-[#f6f1e7] p-6 text-[#13202f] shadow-[0_24px_48px_-20px_rgba(0,0,0,0.6)]">
            <div className="flex items-baseline justify-between text-xs font-semibold uppercase tracking-[0.18em] text-[#5a6675]">
              <span>{w.day}</span>
              <span>{w.km}</span>
            </div>
            <h3 className="mt-2 text-xl font-semibold">{w.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#3c4756]">{w.text}</p>
          </li>
        ))}
        <li>
          <a href="#" className="flex h-12 items-center justify-center rounded-xl bg-[#e9dcc4] text-sm font-semibold text-[#0f1b2a] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1b2a]">Choose your start date</a>
        </li>
      </ol>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";

const EASE = 0.12; // share of the remaining distance covered each frame (lower = longer glide)
const TEAS = [
  { name: "First flush, upper slope", origin: "Darjeeling", note: "Thin as a white wine, with green grape and a dry, mineral finish." },
  { name: "Smoked pine souchong", origin: "Fujian", note: "Campfire on the nose, then longan sweetness once the cup cools." },
  { name: "Roasted stem hojicha", origin: "Kyoto", note: "Toasted barley and cocoa, low in caffeine, good after dinner." },
  { name: "Spring dragonwell", origin: "Hangzhou", note: "Flat jade leaves that taste of chestnut and fresh-cut peas." },
  { name: "Aged white peony", origin: "Fuding", note: "Five years in the tin have turned the hay notes to dried date." },
  { name: "High mountain oolong", origin: "Lishan", note: "Rolled pearls that open into lilac and a long, buttery finish." },
  { name: "Golden tips", origin: "Yunnan", note: "Malty and round, with a note of sweet potato that takes milk well." },
  { name: "Shaded gyokuro", origin: "Yame", note: "Brewed cool, it is brothy and deep, close to a light seaweed stock." },
  { name: "Ruby breakfast", origin: "Nantou", note: "Cinnamon and red fruit, strong enough to stand up to a long steep." },
  { name: "Wild leaf pu-erh", origin: "Lincang", note: "Earth, camphor and forest floor, and it changes over many infusions." },
];

export default function EasedInertiaScrollInsideOneReadingPanel() {
  const panel = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  const [enabled, setEnabled] = useState(true);
  const [capable, setCapable] = useState(false);
  const live = useRef(true);
  live.current = enabled;

  useEffect(() => {
    const el = panel.current;
    const sec = root.current;
    if (!el || !sec) return;
    const can = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setCapable(can);
    let cur = el.scrollTop;
    let target = cur;
    let frame = 0;
    const max = () => el.scrollHeight - el.clientHeight;
    const step = () => {
      frame = 0;
      cur += (target - cur) * EASE;
      if (Math.abs(target - cur) < 0.5) cur = target;
      el.scrollTop = cur;
      if (cur !== target) frame = requestAnimationFrame(step);
    };
    const onWheel = (e: WheelEvent) => {
      if (!can || !live.current || e.ctrlKey) return;
      const d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1);
      const t = Math.max(0, Math.min(max(), target + d));
      if (t === target && cur === target) return; // at an end: let the page take over
      e.preventDefault();
      target = t;
      if (!frame) frame = requestAnimationFrame(step);
    };
    const onScroll = () => {
      if (!frame) cur = target = el.scrollTop; // keyboard, scrollbar or touch moved it
      const m = max();
      if (bar.current) bar.current.style.transform = `scaleX(${m ? el.scrollTop / m : 0})`;
      sec.classList.toggle("w6inr-moved", el.scrollTop > 8);
    };
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) {
        cancelAnimationFrame(frame);
        frame = 0;
        cur = target = el.scrollTop;
      }
    });
    io.observe(sec);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section ref={root} className="bg-[#141a22] px-5 py-14 text-[#efe8dc] sm:px-10">
      <style>{`
        .w6inr-bar { transform: scaleX(0); transform-origin: 0 50%; }
        .w6inr-hint { transition: opacity .5s ease; }
        .w6inr-moved .w6inr-hint { opacity: 0; }
        .w6inr-panel { scrollbar-width: thin; scrollbar-color: #3b4656 transparent; }
        @media (prefers-reduced-motion: reduce) { .w6inr-hint { transition: none; } }
      `}</style>
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1fr_1.4fr] md:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d9a95b]">Kestrel Lane Tea Merchants</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight">This season's tasting notes</h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#b9b2a6]">Ten leaves we are pouring at the counter this month. Scroll the list with a mouse wheel and it glides to a stop.</p>
          <button
            type="button"
            aria-pressed={capable && enabled}
            disabled={!capable}
            onClick={() => setEnabled((v) => !v)}
            className="mt-6 inline-flex h-11 items-center gap-3 rounded-full border border-[#efe8dc]/30 px-5 text-sm font-medium transition hover:border-[#efe8dc]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9a95b] disabled:opacity-70"
          >
            <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${capable && enabled ? "bg-[#d9a95b]" : "bg-[#5b6573]"}`} />
            {capable ? `Eased scrolling ${enabled ? "on" : "off"}` : "Native scrolling on this device"}
          </button>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-[#efe8dc]/10 bg-[#1b232d]">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-0.5 bg-[#efe8dc]/10">
            <div ref={bar} className="w6inr-bar h-full bg-[#d9a95b]" />
          </div>
          <div className="w6inr-hint pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-[#efe8dc] px-3 py-1.5 text-xs font-medium text-[#141a22]" aria-hidden="true">Scroll inside</div>
          <div ref={panel} tabIndex={0} role="region" aria-label="Tasting notes, scrollable" className="w6inr-panel h-[440px] overflow-y-auto overscroll-contain px-6 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d9a95b]">
            <ol className="py-4">
              {TEAS.map((t, i) => (
                <li key={t.name} className="grid grid-cols-[2.5rem_1fr] gap-x-2 border-b border-[#efe8dc]/10 py-6 last:border-0">
                  <span className="pt-1 text-sm tabular-nums text-[#d9a95b]">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{t.name}</h3>
                    <p className="mt-0.5 text-xs uppercase tracking-[0.18em] text-[#9da6b2]">{t.origin}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#cfc7ba]">{t.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

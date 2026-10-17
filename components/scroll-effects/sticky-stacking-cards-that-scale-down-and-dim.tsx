import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const loaves = [
  { name: "Country white", note: "Long cold proof, blistered crust, a soft open crumb that holds butter.", price: "$9", tags: ["Bakes daily", "780 g"], bg: "#f7f1e6", ink: "#2b2119", chip: "#e6d9c3" },
  { name: "Rye and caraway", note: "Dense, dark and a little sour. Slice it thin and it keeps for a week.", price: "$11", tags: ["Thu to Sat", "900 g"], bg: "#b4532e", ink: "#fff8f0", chip: "#93401f" },
  { name: "Seeded spelt", note: "Toasted sunflower, linseed and pumpkin folded through a spelt dough.", price: "$10", tags: ["Bakes daily", "750 g"], bg: "#5f6f4f", ink: "#f6f3ea", chip: "#4b5a3d" },
  { name: "Olive fougasse", note: "Leaf-cut flatbread with green olives and thyme, best still warm.", price: "$7", tags: ["Weekends", "Tear and share"], bg: "#2b2420", ink: "#f3ebe0", chip: "#463b33" },
];
const SCALE_STEP = 0.06; // how much smaller each covering card makes the ones beneath
const DIM_STEP = 0.24; // how much darker each covering card makes the ones beneath
const AUTO_PX_PER_SEC = 28; // gentle demo scroll speed; 0 turns it off

export default function StickyStackingCardsThatScaleDownAndDim() {
  const reduce = useReducedMotion();
  const boxRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || reduce) return;
    const cards = Array.from(box.querySelectorAll<HTMLElement>(".w4scd-card"));
    const faces = cards.map((c) => c.querySelector<HTMLElement>(".w4scd-face")!);
    const shades = cards.map((c) => c.querySelector<HTMLElement>(".w4scd-shade")!);
    let raf = 0;
    const paint = () => {
      raf = 0;
      const top = box.getBoundingClientRect().top;
      const cover = cards.map((c) => {
        const d = c.getBoundingClientRect().top - top - parseFloat(getComputedStyle(c).top);
        return Math.min(1, Math.max(0, 1 - d / c.offsetHeight));
      });
      cards.forEach((_, i) => {
        let depth = 0;
        for (let j = i + 1; j < cards.length; j++) depth += cover[j];
        faces[i].style.transform = `scale(${1 - SCALE_STEP * depth})`;
        shades[i].style.opacity = String(Math.min(0.6, DIM_STEP * depth));
      });
      box.toggleAttribute("data-scrolled", box.scrollTop > 8);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint); };
    box.addEventListener("scroll", onScroll, { passive: true });
    paint();

    // Demo scroll until the visitor takes over; paused while off screen.
    let demo = 0, last = 0, pos = box.scrollTop, seen = true, done = !AUTO_PX_PER_SEC;
    const step = (now: number) => {
      const dt = last ? Math.min(now - last, 50) : 0;
      last = now;
      pos += (AUTO_PX_PER_SEC * dt) / 1000;
      if (pos >= box.scrollHeight - box.clientHeight) { done = true; demo = 0; return; }
      box.scrollTop = pos;
      demo = requestAnimationFrame(step);
    };
    const start = () => { if (!done && seen && !demo) { last = 0; demo = requestAnimationFrame(step); } };
    const stop = () => { cancelAnimationFrame(demo); demo = 0; };
    const handOver = () => { done = true; stop(); };
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen) start(); else stop(); });
    io.observe(box);
    const evs = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    evs.forEach((ev) => box.addEventListener(ev, handOver, { passive: true }));
    start();
    return () => {
      stop();
      cancelAnimationFrame(raf);
      io.disconnect();
      box.removeEventListener("scroll", onScroll);
      evs.forEach((ev) => box.removeEventListener(ev, handOver));
    };
  }, [reduce]);

  return (
    <section ref={boxRef} tabIndex={0} aria-label="Breads this week, scrollable" className="w4scd-root">
      <style>{`
        .w4scd-root { height: 620px; overflow-y: auto; background: #efe7da; color: #2b2119; position: relative; scrollbar-width: thin; scrollbar-color: #c9b89c transparent; }
        .w4scd-root:focus-visible { outline: 3px solid #b4532e; outline-offset: -3px; }
        .w4scd-hint { position: sticky; top: 0; z-index: 20; height: 0; display: flex; justify-content: center; pointer-events: none; transition: opacity .4s ease; }
        .w4scd-hint span { margin-top: 10px; padding: 4px 12px; border-radius: 999px; background: rgba(43,33,25,.82); color: #f7f1e6; font-size: 12px; letter-spacing: .04em; }
        .w4scd-root[data-scrolled] .w4scd-hint { opacity: 0; }
        .w4scd-card { position: sticky; top: 48px; }
        .w4scd-face { transform-origin: 50% 0; will-change: transform; }
        .w4scd-shade { position: absolute; inset: 0; border-radius: inherit; background: #1a130e; opacity: 0; pointer-events: none; }
        @media (prefers-reduced-motion: reduce) { .w4scd-face { transform: none !important; } .w4scd-shade { opacity: 0 !important; } .w4scd-hint { display: none; } }
      `}</style>
      <div className="w4scd-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="mx-auto grid max-w-5xl gap-8 px-5 pb-24 pt-12 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-12 md:px-10">
        <div className="md:sticky md:top-12 md:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#93401f]">Larchmont Bakehouse</p>
          <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">Four loaves on the shelf this week</h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#5a4a3b]">Each one is mixed by hand the afternoon before and baked before the shop opens at seven.</p>
          <a href="#" className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-[#2b2119] px-6 text-sm font-semibold text-[#f7f1e6] transition hover:bg-[#453629] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4532e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe7da]">Reserve a loaf</a>
        </div>
        <ul className="grid gap-6">
          {loaves.map((l, i) => (
            <li key={l.name} className="w4scd-card">
              <article className="w4scd-face relative flex min-h-[360px] flex-col rounded-[28px] p-7 shadow-[0_18px_40px_-20px_rgba(43,33,25,0.45)] sm:p-9" style={{ background: l.bg, color: l.ink }}>
                <div className="flex items-center justify-between text-sm font-medium opacity-90">
                  <span>No. {String(i + 1).padStart(2, "0")}</span>
                  <span className="font-serif text-2xl">{l.price}</span>
                </div>
                <h3 className="mt-auto font-serif text-4xl leading-none sm:text-5xl">{l.name}</h3>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed opacity-90">{l.note}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {l.tags.map((t) => (
                    <span key={t} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: l.chip }}>{t}</span>
                  ))}
                </div>
                <span className="w4scd-shade" aria-hidden="true" />
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

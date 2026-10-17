import { useEffect, useRef } from "react";

const SHIFT = 9; // how far each photo drifts inside its frame, in % of the photo height
const CLASSES = [
  { title: "Wheel basics", meta: "Six Tuesday evenings", price: "$240", img: "https://images.pexels.com/photos/6611421/pexels-photo-6611421.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Stacked handmade mugs and plates in pale and terracotta glazes on a studio shelf" },
  { title: "Glazing day", meta: "One Saturday, 10 to 4", price: "$95", img: "https://images.pexels.com/photos/7375048/pexels-photo-7375048.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Unglazed ceramic mugs on a worktable beside brushes and small pots of glaze" },
  { title: "Tall forms", meta: "Four Thursday evenings", price: "$210", img: "https://images.pexels.com/photos/29286721/pexels-photo-29286721.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "A row of tall, unglazed clay vases drying on wooden boards in a workshop" },
  { title: "Open studio", meta: "Any weekday afternoon", price: "$30", img: "https://images.pexels.com/photos/8063803/pexels-photo-8063803.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Rows of unfinished cream mugs waiting on shelves to be glazed" },
];

export default function PhotoCardsGridWithImageParallaxInsideFrames() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const imgs = Array.from(el.querySelectorAll<HTMLImageElement>(".w6crd-img"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let on = true;
    const draw = () => {
      frame = 0;
      el.classList.toggle("w6crd-moved", el.scrollTop > 8);
      if (reduce) return;
      const b = el.getBoundingClientRect(); // page scroll: use { top: 0, height: innerHeight }
      const c = b.top + b.height / 2;
      imgs.forEach((img) => {
        const r = img.parentElement!.getBoundingClientRect();
        const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - c) / (b.height / 2 + r.height / 2)));
        img.style.transform = `translate3d(0,${(-p * SHIFT).toFixed(2)}%,0)`;
      });
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
    window.addEventListener("resize", req);
    req();
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      el.removeEventListener("scroll", req);
      window.removeEventListener("resize", req);
    };
  }, []);

  return (
    <div
      ref={box}
      tabIndex={0}
      role="region"
      aria-label="Fernhill Clay Studio classes, scrollable preview"
      className="w6crd relative h-[620px] overflow-y-auto overscroll-contain bg-[#f4efe6] text-[#2b2420] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#9a4a2c]"
    >
      <style>{`
        .w6crd-img { will-change: transform; }
        .w6crd-hint { transition: opacity .5s ease; }
        .w6crd-moved .w6crd-hint { opacity: 0; }
        @media (prefers-reduced-motion: reduce) { .w6crd-img { will-change: auto; } }
      `}</style>
      <div className="w6crd-hint pointer-events-none absolute right-4 top-4 rounded-full bg-[#2b2420]/80 px-3 py-1.5 text-xs font-medium text-[#f4efe6]" aria-hidden="true">Scroll inside</div>
      <div className="mx-auto max-w-5xl px-5 pb-16 pt-14 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9a4a2c]">Fernhill Clay Studio</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h2 className="max-w-md text-3xl font-semibold leading-tight sm:text-4xl">Autumn classes at the wheel</h2>
          <p className="max-w-xs text-sm leading-relaxed text-[#5b4c42]">Small groups of six, clay and firing included, aprons on the hook by the door.</p>
        </div>
        <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2">
          {CLASSES.map((c, i) => (
            <li key={c.title} className={i % 2 ? "sm:mt-16" : ""}>
              <a href="#" className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a4a2c] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f4efe6]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#ddd2c2] shadow-[0_18px_40px_-24px_rgba(43,36,32,0.6)]">
                  <img src={c.img} alt={c.alt} width={900} height={675} className="w6crd-img absolute inset-x-0 top-[-12%] h-[124%] w-full object-cover" />
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <h3 className="text-lg font-semibold group-hover:underline">{c.title}</h3>
                  <span className="text-sm font-semibold text-[#9a4a2c]">{c.price}</span>
                </div>
                <p className="mt-1 text-sm text-[#5b4c42]">{c.meta}</p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

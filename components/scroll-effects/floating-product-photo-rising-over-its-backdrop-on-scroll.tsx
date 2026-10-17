import { useEffect, useRef } from "react";

const LIFT = 48; // px the product rises across the section
const SINK = 28; // px the backdrop sinks the other way
const NOTES = ["Cold-pressed rosehip and sea buckthorn", "Thirty millilitres, about two months of evenings", "Glass bottle, refill pouch on request"];

export default function FloatingProductPhotoRisingOverItsBackdropOnScroll() {
  const box = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLDivElement>(null);
  const shadow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let on = true;
    const draw = () => {
      frame = 0;
      el.classList.toggle("w6prd-moved", el.scrollTop > 8);
      if (reduce || !stage.current || !card.current || !back.current || !shadow.current) return;
      const b = el.getBoundingClientRect(); // page scroll: use { top: 0, height: innerHeight }
      const r = stage.current.getBoundingClientRect();
      const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - (b.top + b.height / 2)) / (b.height / 2 + r.height / 2)));
      const near = 1 - Math.abs(p);
      card.current.style.transform = `translate3d(0,${(p * LIFT).toFixed(1)}px,0) scale(${(0.96 + near * 0.04).toFixed(4)})`;
      back.current.style.transform = `translate3d(0,${(-p * SINK).toFixed(1)}px,0)`;
      shadow.current.style.opacity = (0.35 + near * 0.65).toFixed(3);
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
    <div ref={box} tabIndex={0} role="region" aria-label="Saltgrass Apothecary face oil, scrollable preview" className="w6prd relative h-[640px] overflow-y-auto overflow-x-hidden overscroll-contain bg-[#f3e7dc] text-[#3a1f16] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#a5492b]">
      <style>{`
        .w6prd-card, .w6prd-back { will-change: transform; }
        .w6prd-hint { transition: opacity .5s ease; }
        .w6prd-moved .w6prd-hint { opacity: 0; }
        @media (prefers-reduced-motion: reduce) { .w6prd-card, .w6prd-back { will-change: auto; } }
      `}</style>
      <span className="w6prd-hint pointer-events-none absolute right-4 top-4 z-20 rounded-full bg-[#3a1f16]/85 px-3 py-1.5 text-xs font-medium text-[#f3e7dc]" aria-hidden="true">Scroll inside</span>
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 pb-16 pt-10 md:grid-cols-[1.1fr_1fr] md:pt-12">
        <div ref={stage} className="relative mx-auto h-[500px] w-full max-w-[420px]">
          <div ref={back} aria-hidden="true" className="w6prd-back absolute inset-x-4 bottom-0 top-10 rounded-t-full bg-[#b85a3a]">
            <span className="absolute inset-x-0 top-[22%] text-center text-[80px] font-semibold leading-none tracking-tight text-[#cf7a58]">No. 4</span>
          </div>
          <div ref={shadow} aria-hidden="true" className="absolute bottom-6 left-1/2 h-10 w-56 -translate-x-1/2 rounded-[50%] bg-[#3a1f16]/40 blur-xl" />
          <div ref={card} className="w6prd-card absolute left-1/2 top-[18%] -ml-[115px] w-[230px] overflow-hidden rounded-2xl bg-[#e7e5e2] shadow-[0_30px_60px_-30px_rgba(58,31,22,0.7)] sm:top-[16%]">
            <img src="https://images.pexels.com/photos/6694147/pexels-photo-6694147.jpeg?auto=compress&cs=tinysrgb&w=800" alt="A brown glass dropper bottle standing on a weathered piece of driftwood against a pale grey wall" width={800} height={1200} className="aspect-[3/4] w-full object-cover" />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a5492b]">Saltgrass Apothecary</p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight">Night oil No. 4</h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-[#5c3a2d]">A few drops after washing, pressed in with warm hands. It sinks in before the kettle boils.</p>
          <ul className="mt-6 space-y-3 border-t border-[#3a1f16]/15 pt-6 text-sm text-[#5c3a2d]">
            {NOTES.map((n) => (
              <li key={n} className="flex gap-3"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#a5492b]" />{n}</li>
            ))}
          </ul>
          <div className="mt-8 flex items-center gap-5">
            <a href="#" className="inline-flex h-12 items-center rounded-full bg-[#3a1f16] px-6 text-sm font-semibold text-[#f3e7dc] hover:bg-[#5a3326] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a1f16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3e7dc]">Add to bag, $38</a>
            <a href="#" className="text-sm font-medium underline underline-offset-4 hover:text-[#a5492b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a5492b]">Ingredients</a>
          </div>
        </div>
      </div>
      <div className="h-[360px] border-t border-[#3a1f16]/10 px-6 pt-10 text-center text-sm text-[#6b4a3c]">Blended in small batches in a coastal workshop and shipped in paper, never plastic.</div>
    </div>
  );
}

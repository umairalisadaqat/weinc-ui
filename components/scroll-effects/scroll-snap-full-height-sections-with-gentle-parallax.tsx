import { useEffect, useRef } from "react";

const SHIFT = 8; // how far each photo drifts inside its section, as a percentage of the photo height
const STOPS = [
  { id: "w6snp-01", src: "https://images.pexels.com/photos/35972428/pexels-photo-35972428.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Golden sand dunes rolling under a clear blue sky", num: "01", title: "Arrive at the edge", text: "The road ends at the last well. From there it is camels, or your own feet, for the final hour in." },
  { id: "w6snp-02", src: "https://images.pexels.com/photos/2563810/pexels-photo-2563810.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Close view of wind ripples across a soft grey-gold dune", num: "02", title: "Walk the ridges", text: "Mornings start before the heat, along the dune crests, with a guide who reads the sand like a map." },
  { id: "w6snp-03", src: "https://images.pexels.com/photos/2504713/pexels-photo-2504713.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Long dunes with ripple patterns running down to a calm sea at dusk", num: "03", title: "Sleep by the water", text: "The last camp sits where the dunes meet the sea. Dinner is cooked on coals and served on the sand." },
];

export default function ScrollSnapFullHeightSectionsWithGentleParallax() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const imgs = Array.from(el.querySelectorAll<HTMLImageElement>(".w6snp-img"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let on = true;
    const draw = () => {
      frame = 0;
      el.classList.toggle("w6snp-moved", el.scrollTop > 8);
      if (reduce) return;
      const h = el.clientHeight || 1;
      imgs.forEach((img, i) => {
        const p = Math.max(-1, Math.min(1, (i * h - el.scrollTop) / h)); // 0 when this section fills the box
        img.style.transform = `translate3d(0,${(p * SHIFT).toFixed(2)}%,0)`;
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
    req();
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      el.removeEventListener("scroll", req);
    };
  }, []);

  return (
    <div ref={box} tabIndex={0} role="region" aria-label="Erg Saffa desert journey, scrollable preview" className="w6snp relative h-[600px] snap-y snap-mandatory overflow-y-auto overscroll-contain bg-[#2a1d14] text-white outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f3e3c7]">
      <style>{`
        .w6snp-img { will-change: transform; }
        .w6snp-hint { transition: opacity .5s ease; }
        .w6snp-moved .w6snp-hint { opacity: 0; }
        @media (prefers-reduced-motion: reduce) { .w6snp-img { will-change: auto; } }
      `}</style>
      {STOPS.map((s, i) => (
        <section key={s.id} id={s.id} className="relative h-[600px] snap-start overflow-hidden">
          <img src={s.src} alt={s.alt} width={1600} height={1067} className="w6snp-img absolute inset-x-0 top-[-10%] h-[120%] w-full object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#1d130c]/85 via-[#1d130c]/15 to-[#1d130c]/40" />
          {i === 0 && (
            <>
              <p className="absolute left-6 top-8 text-xs font-semibold uppercase tracking-[0.28em] text-[#f3e3c7] sm:left-12">Erg Saffa Camps</p>
              <span className="w6snp-hint pointer-events-none absolute right-4 top-6 rounded-full bg-[#f3e3c7] px-3 py-1.5 text-xs font-medium text-[#2a1d14]" aria-hidden="true">Scroll inside</span>
            </>
          )}
          <div className="absolute inset-x-0 bottom-0 px-6 pb-12 sm:px-12">
            <p className="text-sm font-semibold tabular-nums text-[#f3e3c7]">{s.num} / 03</p>
            <h2 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">{s.title}</h2>
            <p className="mt-3 max-w-md text-base leading-relaxed text-[#efe6d8]">{s.text}</p>
            {i === STOPS.length - 1 && (
              <a href="#" className="mt-6 inline-flex h-12 items-center rounded-full bg-[#f3e3c7] px-6 text-sm font-semibold text-[#2a1d14] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2a1d14]">See spring departures</a>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

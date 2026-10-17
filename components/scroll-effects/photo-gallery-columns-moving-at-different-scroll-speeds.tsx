import { useEffect, useRef } from "react";

// speed: extra vertical travel per pixel scrolled (negative = runs ahead of the page, positive = lags behind).
const COLUMNS = [
  { speed: 0.12, photos: [{ src: "https://images.pexels.com/photos/38826747/pexels-photo-38826747.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "A narrow dirt path running between tall green trees in a summer forest" }, { src: "https://images.pexels.com/photos/34169529/pexels-photo-34169529.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Green and black olives hanging from a silvery olive branch" }, { src: "https://images.pexels.com/photos/27667695/pexels-photo-27667695.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "A turquoise mountain lake below steep grey peaks and a pine-covered shore" }] },
  { speed: -0.22, photos: [{ src: "https://images.pexels.com/photos/32100798/pexels-photo-32100798.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "A still alpine lake reflecting forest and pale rocky mountains" }, { src: "https://images.pexels.com/photos/36962671/pexels-photo-36962671.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "A wildflower meadow full of pink clover and blue cornflowers" }, { src: "https://images.pexels.com/photos/37291897/pexels-photo-37291897.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Old stone cottages with slate roofs under a deep blue sky" }] },
  { speed: 0.04, photos: [{ src: "https://images.pexels.com/photos/36494120/pexels-photo-36494120.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Weathered blue fishing boats moored together in a harbour" }, { src: "https://images.pexels.com/photos/14554019/pexels-photo-14554019.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "A leafy olive tree with ripe olives lit by sun" }, { src: "https://images.pexels.com/photos/33311332/pexels-photo-33311332.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "A grassy path leading through a green orchard toward the trees" }] },
];

export default function PhotoGalleryColumnsMovingAtDifferentScrollSpeeds() {
  const box = useRef<HTMLDivElement>(null);
  const cols = useRef<(HTMLUListElement | null)[]>([]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let on = true;
    const draw = () => {
      frame = 0;
      const s = el.scrollTop; // page scroll: use -el.getBoundingClientRect().top
      el.classList.toggle("w6gal-moved", s > 8);
      if (reduce) return;
      cols.current.forEach((c, i) => {
        if (c) c.style.transform = `translate3d(0,${(s * COLUMNS[i].speed).toFixed(1)}px,0)`;
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
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      el.removeEventListener("scroll", req);
    };
  }, []);

  return (
    <div ref={box} tabIndex={0} role="region" aria-label="Lowfield prints gallery, scrollable preview" className="w6gal relative h-[640px] overflow-y-auto overflow-x-hidden overscroll-contain bg-[#efe9df] text-[#262019] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7a5a3a]">
      <style>{`
        .w6gal-col { will-change: transform; }
        .w6gal-hint { transition: opacity .5s ease; }
        .w6gal-moved .w6gal-hint { opacity: 0; }
        @media (prefers-reduced-motion: reduce) { .w6gal-col { will-change: auto; } }
      `}</style>
      <span className="w6gal-hint pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-[#262019]/85 px-3 py-1.5 text-xs font-medium text-[#efe9df]" aria-hidden="true">Scroll inside</span>
      <div className="mx-auto max-w-6xl px-5 pt-12 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7a5a3a]">Lowfield Prints</p>
        <h2 className="mt-3 max-w-lg text-3xl font-semibold leading-tight sm:text-4xl">Quiet places, printed on cotton rag</h2>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
          {COLUMNS.map((c, i) => (
            <ul key={i} ref={(n) => { cols.current[i] = n; }} className={`w6gal-col space-y-4 sm:space-y-6 ${i === 1 ? "mt-16" : ""} ${i === 2 ? "hidden sm:block" : ""}`}>
              {c.photos.map((p) => (
                <li key={p.src} className="aspect-[3/4] overflow-hidden rounded-md bg-[#d9cfbf] shadow-[0_16px_32px_-20px_rgba(38,32,25,0.55)]">
                  <img src={p.src} alt={p.alt} width={700} height={933} className="h-full w-full object-cover" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-24 flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-[#262019]/15 px-5 pb-16 pt-8 sm:px-8">
        <p className="max-w-md text-sm leading-relaxed text-[#5a4f43]">Every print is made to order in three sizes and signed on the back.</p>
        <a href="#" className="inline-flex h-11 items-center rounded-full bg-[#262019] px-6 text-sm font-semibold text-[#efe9df] hover:bg-[#3d3329] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#262019] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe9df]">Browse all prints</a>
      </div>
    </div>
  );
}

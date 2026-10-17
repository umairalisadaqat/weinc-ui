import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";

/* ---------- Content: edit the slides here ---------- */


const heroSlides = [
  { src: "https://images.pexels.com/photos/3067766/pexels-photo-3067766.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Red sandstone cliffs and a sea stack with waves breaking below", place: "Cala Rossa", line: "Sea stacks and a cove you reach on foot", tone: "#7c3a22" },
  { src: "https://images.pexels.com/photos/33992262/pexels-photo-33992262.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Tall limestone cliffs dropping into a deep blue sea, seen from above", place: "Capo Bianco", line: "Two hundred metres of pale rock over open water", tone: "#2b4f6e" },
  { src: "https://images.pexels.com/photos/37109411/pexels-photo-37109411.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Misty alpine lake at sunrise with mountains reflected in still water", place: "Lake Hallen", line: "Mist lifts off the water by seven", tone: "#36505e" },
  { src: "https://images.pexels.com/photos/35972428/pexels-photo-35972428.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Golden sand dunes under a clear blue sky", place: "The Long Dunes", line: "Walk the ridge line before the heat", tone: "#a8743c" },
];

const cards = [
  { src: "https://images.pexels.com/photos/34902344/pexels-photo-34902344.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "White ceramic vases and a cylinder on a deep teal cloth", name: "Column vase set", price: "$148", tone: "#1f3b3a" },
  { src: "https://images.pexels.com/photos/5199152/pexels-photo-5199152.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "White jug, striped pitcher and a pomegranate on blue linen", name: "Striped pitcher", price: "$64", tone: "#c98e5a" },
  { src: "https://images.pexels.com/photos/40085654/pexels-photo-40085654.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "White vases and paper rolls against a rich blue backdrop", name: "Bottle vase, tall", price: "$92", tone: "#1e3657" },
  { src: "https://images.pexels.com/photos/37209161/pexels-photo-37209161.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Wooden lounge chair with a cane seat beside a round white stool", name: "Cane lounge chair", price: "$740", tone: "#8a6f58" },
  { src: "https://images.pexels.com/photos/39418138/pexels-photo-39418138.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Beige linen cushion resting on a woven wicker chair", name: "Washed linen cushion", price: "$58", tone: "#d9c6b3" },
  { src: "https://images.pexels.com/photos/35082703/pexels-photo-35082703.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Clay vases and jugs on rough wooden shelves in black and white", name: "Shelf jug trio", price: "$116", tone: "#5c5c5c" },
];

const rooms = [
  { src: "https://images.pexels.com/photos/9890644/pexels-photo-9890644.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Sunlit timber living room with a fireplace and dark sofas", label: "Living room", tone: "#6b4325" },
  { src: "https://images.pexels.com/photos/6947280/pexels-photo-6947280.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Bright room with a grey tufted sofa, blue cushions and a sunburst mirror", label: "Sitting room", tone: "#9aa7b3" },
  { src: "https://images.pexels.com/photos/1484981/pexels-photo-1484981.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Daybed with floral cushions and a reading chair by a sunny window", label: "Reading corner", tone: "#b49a77" },
  { src: "https://images.pexels.com/photos/19516616/pexels-photo-19516616.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Red brick townhouse front with a trimmed hedge under blue sky", label: "Street front", tone: "#8c3b2c" },
  { src: "https://images.pexels.com/photos/30580640/pexels-photo-30580640.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Two matching white modern houses with dark roofs and a lawn", label: "Garden side", tone: "#7d8a6a" },
];

/** Milliseconds each hero slide stays before moving on. Set AUTOPLAY_MS to 0 to switch autoplay off. */
const AUTOPLAY_MS = 5000;

/* ---------- Shared carousel logic ---------- */

function useCarousel(trackRef: RefObject<HTMLDivElement>, count: number) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const items = Array.from(track.children) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) setIndex(items.indexOf(e.target as HTMLElement));
        });
      },
      { root: track, threshold: [0.6] },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [trackRef, count]);

  const goTo = useCallback(
    (i: number) => {
      const track = trackRef.current;
      if (!track) return;
      const n = ((i % count) + count) % count;
      const el = track.children[n] as HTMLElement | undefined;
      if (!el) return;
      track.scrollTo({ left: el.offsetLeft - track.offsetLeft, behavior: reduce ? "auto" : "smooth" });
      setIndex(n);
    },
    [trackRef, count, reduce],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
    else if (e.key === "Home") { e.preventDefault(); goTo(0); }
    else if (e.key === "End") { e.preventDefault(); goTo(count - 1); }
  };

  return { index, goTo, onKeyDown, reduce };
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d={dir === "left" ? "M12 4.5 6.5 10 12 15.5" : "M8 4.5 13.5 10 8 15.5"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
const track = "flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/* ---------- Variant 1: full-width image slider with autoplay ---------- */

function HeroSlider() {
  const ref = useRef<HTMLDivElement>(null);
  const { index, goTo, onKeyDown, reduce } = useCarousel(ref, heroSlides.length);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const playing = AUTOPLAY_MS > 0 && !reduce && !stopped && !hovered && !focused;

  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => goTo(index + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [playing, index, goTo]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Coastal and mountain walks"
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false); }}
      className="relative overflow-hidden rounded-2xl bg-stone-900"
    >
      <div ref={ref} className={`${track} aspect-[4/5] sm:aspect-[16/8]`} aria-live={playing ? "off" : "polite"}>
        {heroSlides.map((s, i) => (
          <div
            key={s.src}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${heroSlides.length}: ${s.place}`}
            aria-hidden={i !== index}
            className="relative h-full w-full shrink-0 snap-start"
            style={{ backgroundColor: s.tone }}
          >
            <img src={s.src} alt={s.alt} loading={i === 0 ? "eager" : "lazy"} draggable={false} className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
            <div className="absolute bottom-16 left-5 right-5 text-white sm:bottom-20 sm:left-10">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/80">Walk {String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 s2c-display text-3xl font-semibold tracking-tight sm:text-5xl">{s.place}</h3>
              <p className="mt-2 max-w-md text-sm text-white/85 sm:text-base">{s.line}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-3 sm:inset-x-10 sm:bottom-7">
        <div className="flex items-center gap-1.5">
          {heroSlides.map((s, i) => (
            <button
              key={s.place}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show slide ${i + 1}: ${s.place}`}
              aria-current={i === index ? "true" : undefined}
              className={`group relative flex h-10 items-center ${ring} focus-visible:ring-white focus-visible:ring-offset-black/40 rounded-full`}
            >
              <span className={`relative block h-1 overflow-hidden rounded-full bg-white/45 transition-[width] duration-500 ${i === index ? "w-10" : "w-4 group-hover:bg-white/60"}`}>
                {i === index && (
                  <span
                    key={`${index}-${playing}`}
                    className={`absolute inset-y-0 left-0 rounded-full bg-white ${playing ? "s2c-fill" : "w-full"}`}
                    style={playing ? { animationDuration: `${AUTOPLAY_MS}ms` } : undefined}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {AUTOPLAY_MS > 0 && !reduce && (
            <button
              type="button"
              onClick={() => setStopped((v) => !v)}
              aria-label={stopped ? "Start autoplay" : "Stop autoplay"}
              className={`grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25 ${ring} focus-visible:ring-white focus-visible:ring-offset-black/40`}
            >
              {stopped ? (
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7-4.5-7-4.5Z" fill="currentColor" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5h2v9H5zM9 3.5h2v9H9z" fill="currentColor" /></svg>
              )}
            </button>
          )}
          {(["left", "right"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => goTo(index + (d === "left" ? -1 : 1))}
              aria-label={d === "left" ? "Previous slide" : "Next slide"}
              className={`grid h-10 w-10 place-items-center rounded-full bg-white text-stone-900 shadow-sm transition hover:bg-stone-100 active:scale-95 ${ring} focus-visible:ring-white focus-visible:ring-offset-black/40`}
            >
              <Arrow dir={d} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Variant 2: multi-card row ---------- */

function CardRow() {
  const ref = useRef<HTMLDivElement>(null);
  const { index, goTo, onKeyDown } = useCarousel(ref, cards.length);
  const [edges, setEdges] = useState({ start: true, end: false });

  const onScroll = () => {
    const t = ref.current;
    if (!t) return;
    setEdges({ start: t.scrollLeft < 4, end: t.scrollLeft + t.clientWidth > t.scrollWidth - 4 });
  };

  const step = (dir: 1 | -1) => {
    const t = ref.current;
    if (!t) return;
    t.scrollBy({ left: dir * t.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section aria-roledescription="carousel" aria-label="New in the shop" onKeyDown={onKeyDown} className="min-w-0">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Multi-card row</p>
          <h3 className="mt-1 s2c-display text-2xl font-semibold tracking-tight text-stone-900">New in the shop</h3>
        </div>
        <div className="flex gap-2">
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => step(d)}
              disabled={d === -1 ? edges.start : edges.end}
              aria-label={d === -1 ? "Scroll products left" : "Scroll products right"}
              className={`grid h-10 w-10 place-items-center rounded-full border border-stone-300 bg-white text-stone-800 transition hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-35 ${ring} focus-visible:ring-stone-900`}
            >
              <Arrow dir={d === -1 ? "left" : "right"} />
            </button>
          ))}
        </div>
      </div>
      <div ref={ref} onScroll={onScroll} className={`${track} -mx-1 gap-4 scroll-px-1 px-1 pb-2`}>
        {cards.map((c, i) => (
          <a
            key={c.name}
            href="#"
            aria-label={`${c.name}, ${c.price}, product ${i + 1} of ${cards.length}`}
            onFocus={() => goTo(i)}
            className={`group w-[72%] shrink-0 snap-start rounded-xl sm:w-[calc((100%-1rem)/2)] ${ring} focus-visible:ring-stone-900`}
          >
            <div className="aspect-[4/5] overflow-hidden rounded-xl" style={{ backgroundColor: c.tone }}>
              <img src={c.src} alt={c.alt} loading="lazy" draggable={false} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-stone-900">{c.name}</span>
              <span className="tabular-nums text-stone-600">{c.price}</span>
            </div>
          </a>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">Showing product {index + 1} of {cards.length}</p>
    </section>
  );
}

/* ---------- Variant 3: carousel with thumbnails ---------- */

function ThumbCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const { index, goTo, onKeyDown } = useCarousel(ref, rooms.length);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  // When a thumbnail has focus, keep focus on the one that matches the shown photo.
  useEffect(() => {
    const active = document.activeElement;
    if (active && tabs.current.includes(active as HTMLButtonElement)) tabs.current[index]?.focus();
  }, [index]);

  return (
    <section aria-roledescription="carousel" aria-label="Listing photos, Alder Street" onKeyDown={onKeyDown} className="rounded-2xl bg-white p-3 ring-1 ring-stone-200 sm:p-4">
      <div className="relative">
        <div ref={ref} className={`${track} aspect-[3/2] rounded-xl`}>
          {rooms.map((r, i) => (
            <div key={r.src} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${rooms.length}: ${r.label}`} aria-hidden={i !== index} className="h-full w-full shrink-0 snap-start" style={{ backgroundColor: r.tone }}>
              <img src={r.src} alt={r.alt} loading={i === 0 ? "eager" : "lazy"} draggable={false} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-stone-900/75 px-2.5 py-1 text-xs font-medium tabular-nums text-white">
          {index + 1} / {rooms.length}
        </span>
      </div>
      <div role="tablist" aria-label="Choose a photo" className="mt-3 grid grid-cols-5 gap-2">
        {rooms.map((r, i) => (
          <button
            key={r.label}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={r.label}
            tabIndex={i === index ? 0 : -1}
            ref={(el) => { tabs.current[i] = el; }}
            onClick={() => goTo(i)}
            className={`relative aspect-[4/3] overflow-hidden rounded-lg transition ${ring} focus-visible:ring-emerald-700 ${i === index ? "opacity-100" : "opacity-55 hover:opacity-90"}`}
            style={{ backgroundColor: r.tone }}
          >
            <img src={r.src.replace("w=1600", "w=320")} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" />
            <span className={`absolute inset-0 rounded-lg ring-2 ring-inset transition ${i === index ? "ring-emerald-700" : "ring-transparent"}`} />
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-stone-600">
        <span className="font-medium text-stone-900">{rooms[index].label}</span> &middot; 14 Alder Street, three bedrooms
      </p>
    </section>
  );
}

export default function ReactImageCarousel() {
  return (
    <div className="min-h-[600px] bg-stone-100 px-4 py-10 s2c-body sm:px-8 sm:py-14">
      <style>{`
        @keyframes s2c-fill { from { width: 0% } to { width: 100% } }
        .s2c-body { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
        .s2c-display { font-family: 'Inter Tight', Inter, ui-sans-serif, system-ui, sans-serif; }
        .s2c-fill { animation-name: s2c-fill; animation-timing-function: linear; animation-fill-mode: forwards; }
        @media (prefers-reduced-motion: reduce) { .s2c-fill { animation: none; width: 100%; } }
      `}</style>
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <HeroSlider />
        <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <CardRow />
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">With thumbnails</p>
            <h3 className="mb-5 s2c-display text-2xl font-semibold tracking-tight text-stone-900">14 Alder Street</h3>
            <ThumbCarousel />
          </div>
        </div>
      </div>
    </div>
  );
}

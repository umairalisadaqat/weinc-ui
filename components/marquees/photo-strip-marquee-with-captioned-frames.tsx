import { useEffect, useRef, useState } from "react";

// Photos from around an invented plant nursery. Each caption names what is in the frame.
const photos = [
  { src: "https://images.pexels.com/photos/12096571/pexels-photo-12096571.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Greenhouse aisle under a glass roof with rows of white hanging pots", caption: "The long house" },
  { src: "https://images.pexels.com/photos/32532120/pexels-photo-32532120.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Young snapdragon seedlings in small pots on a tray", caption: "Spring seedlings" },
  { src: "https://images.pexels.com/photos/16960870/pexels-photo-16960870.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Striped silver and green calathea leaves in soft light", caption: "Calathea" },
  { src: "https://images.pexels.com/photos/6913563/pexels-photo-6913563.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Large leaved tropical plants in pots on a greenhouse shelf", caption: "Tropical bench" },
  { src: "https://images.pexels.com/photos/33614722/pexels-photo-33614722.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Begonia leaves with white spots on a dark green surface", caption: "Spotted begonia" },
];
const SPEED = 48; // seconds per loop

function Frames({ dup }: { dup?: boolean }) {
  return (
    <ul className="w3pho-group" aria-hidden={dup ? "true" : undefined}>
      {photos.map((p, i) => (
        <li key={p.caption} className={i % 2 ? "w3pho-low" : ""}>
          <figure className="w-[200px] sm:w-[240px]">
            <div className="aspect-[3/4] overflow-hidden rounded-xl bg-[#2a3d30]">
              <img src={p.src} alt={dup ? "" : p.alt} loading="eager" width={240} height={320} className="h-full w-full object-cover" />
            </div>
            <figcaption className="mt-3 flex items-baseline justify-between text-sm">
              <span className="font-medium text-[#eef1e6]">{p.caption}</span>
              <span className="font-mono text-xs text-[#a9bba6]">0{i + 1}</span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}

export default function PhotoStripMarqueeWithCaptionedFrames() {
  const root = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const [off, setOff] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOff(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={root}
      data-paused={paused ? "" : undefined}
      data-off={off ? "" : undefined}
      className="w3pho overflow-hidden bg-[#1b2a21] py-20 text-[#eef1e6]"
      style={{ ["--w3pho-speed" as string]: `${SPEED}s` }}
    >
      <style>{`
        .w3pho-view { overflow: hidden; }
        .w3pho-track { display: flex; width: max-content; animation: w3pho-run var(--w3pho-speed) linear infinite; }
        .w3pho-group { display: flex; align-items: flex-start; gap: 24px; padding: 0 24px 0 0; margin: 0; list-style: none; }
        .w3pho-low { margin-top: 40px; }
        .w3pho[data-paused] .w3pho-track, .w3pho[data-off] .w3pho-track, .w3pho-view:hover .w3pho-track { animation-play-state: paused; }
        @keyframes w3pho-run { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          .w3pho-view { overflow-x: auto; scroll-snap-type: x mandatory; }
          .w3pho-track { animation: none; padding: 0 20px; }
          .w3pho-group li { scroll-snap-align: start; }
          .w3pho-group[aria-hidden], .w3pho-toggle { display: none; }
        }
      `}</style>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b9cf9a]">Bramblecote Nursery</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">Three glasshouses, open to wander every weekend</h2>
        </div>
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
          className="w3pho-toggle inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-full bg-[#eef1e6] px-5 text-sm font-medium text-[#1b2a21] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eef1e6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b2a21] sm:self-auto"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="fill-current">
            {paused ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" />}
          </svg>
          {paused ? "Play photos" : "Pause photos"}
        </button>
      </div>
      <div className="w3pho-view mt-12">
        <div className="w3pho-track">
          <Frames />
          <Frames dup />
        </div>
      </div>
    </section>
  );
}

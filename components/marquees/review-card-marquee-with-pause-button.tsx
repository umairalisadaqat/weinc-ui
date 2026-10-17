import { useEffect, useRef, useState } from "react";

// Guest notes for an invented sea kayak outfitter. Each card is one quote.
const reviews = [
  { quote: "Our guide spotted a seal colony before any of us saw the rocks. Calm water, good jokes, hot tea at the end.", name: "Priya N.", trip: "Sunrise paddle" },
  { quote: "First time in a kayak and I never felt out of my depth. They paired me with a steady partner.", name: "Tom W.", trip: "Harbour loop" },
  { quote: "The dry bags actually kept my phone dry. Small thing, but it told me they think about details.", name: "Ines R.", trip: "Island crossing" },
  { quote: "We booked for the kids and ended up going back the next morning on our own.", name: "Dana and Lou", trip: "Family half day" },
  { quote: "They called the evening before to move us an hour earlier because of the wind. Glad they did.", name: "Marcus O.", trip: "Cliff caves" },
  { quote: "Lunch on the sand bar was the best sandwich of the whole holiday.", name: "Hana K.", trip: "Full day coast" },
];
const SPEED = 60; // seconds for one loop; slow enough to read a card in passing

function Cards({ dup }: { dup?: boolean }) {
  return (
    <ul className="w3rev-group" aria-hidden={dup ? "true" : undefined}>
      {reviews.map((r) => (
        <li key={r.name} className="w3rev-card flex w-[300px] shrink-0 flex-col justify-between rounded-2xl border border-[#e2d6c2] bg-[#fffaf1] p-6 sm:w-[340px]">
          <blockquote className="text-[15px] leading-relaxed text-[#3b3226]">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="mb-3 fill-[#c08a4a]"><path d="M4 17h5l2-5V6H4v6h3zm10 0h5l2-5V6h-7v6h3z" /></svg>
            {r.quote}
          </blockquote>
          <p className="mt-5 flex items-center gap-3 text-sm">
            <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-[#1f4a4f] text-xs font-semibold text-[#f6efe2]">{r.name.slice(0, 1)}</span>
            <span><span className="block font-semibold text-[#2a241c]">{r.name}</span><span className="text-[#6b5c48]">{r.trip}</span></span>
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function ReviewCardMarqueeWithPauseButton() {
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
      className="w3rev overflow-hidden bg-[#efe5d4] py-20"
      style={{ ["--w3rev-speed" as string]: `${SPEED}s` }}
    >
      <style>{`
        .w3rev-view { overflow: hidden; padding: 8px 0 16px; }
        .w3rev-track { display: flex; width: max-content; animation: w3rev-run var(--w3rev-speed) linear infinite; }
        .w3rev-group { display: flex; gap: 20px; padding: 0 20px 0 0; margin: 0; list-style: none; }
        .w3rev-card { box-shadow: 0 1px 2px rgba(60,40,10,.06), 0 12px 28px -16px rgba(60,40,10,.25); }
        .w3rev[data-paused] .w3rev-track, .w3rev[data-off] .w3rev-track, .w3rev-view:hover .w3rev-track, .w3rev-view:focus-within .w3rev-track { animation-play-state: paused; }
        @keyframes w3rev-run { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          .w3rev-view { overflow-x: auto; scroll-snap-type: x mandatory; }
          .w3rev-track { animation: none; padding: 0 20px; }
          .w3rev-card { scroll-snap-align: start; }
          .w3rev-group[aria-hidden] { display: none; }
          .w3rev-toggle { display: none; }
        }
      `}</style>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8a5a24]">Tidewater Kayak Tours</p>
          <h2 className="mt-3 max-w-lg text-3xl font-semibold tracking-tight text-[#2a241c] sm:text-4xl">What paddlers wrote after a morning on the water</h2>
        </div>
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
          className="w3rev-toggle inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-full border border-[#1f4a4f] px-5 text-sm font-medium text-[#1f4a4f] hover:bg-[#1f4a4f] hover:text-[#f6efe2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f4a4f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe5d4] sm:self-auto"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="fill-current">
            {paused ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" />}
          </svg>
          {paused ? "Play reviews" : "Pause reviews"}
        </button>
      </div>
      <div className="w3rev-view mt-10">
        <div className="w3rev-track">
          <Cards />
          <Cards dup />
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";

// Invented client wordmarks. Each has a small drawn mark and a name set in its own type style.
const clients = [
  { name: "Northwell Joinery", mark: "square", font: "font-serif tracking-tight" },
  { name: "Kettle Point", mark: "circle", font: "font-sans font-semibold tracking-tight" },
  { name: "ASHBY & ROWE", mark: "bars", font: "font-sans font-bold tracking-[0.18em] text-[15px]" },
  { name: "Lumen Dental", mark: "ring", font: "font-sans font-medium" },
  { name: "Fernhill Co-op", mark: "leaf", font: "font-serif italic" },
  { name: "CALDER FREIGHT", mark: "tri", font: "font-mono font-semibold tracking-wider text-[15px]" },
  { name: "Oak and Ember", mark: "circle", font: "font-serif font-semibold" },
  { name: "Marlow Clinic", mark: "square", font: "font-sans font-semibold tracking-tight" },
];
const SPEED = 36; // seconds for one full loop of the row

function Mark({ kind }: { kind: string }) {
  const c = "fill-current";
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="shrink-0">
      {kind === "square" && <rect x="3" y="3" width="18" height="18" rx="4" className={c} />}
      {kind === "circle" && <circle cx="12" cy="12" r="9" className={c} />}
      {kind === "ring" && <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" strokeWidth="3" />}
      {kind === "tri" && <path d="M12 3l9.5 17h-19z" className={c} />}
      {kind === "bars" && <path d="M4 4h4v16H4zM10 8h4v12h-4zM16 12h4v8h-4z" className={c} />}
      {kind === "leaf" && <path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15z" className={c} />}
    </svg>
  );
}

function Group({ dup }: { dup?: boolean }) {
  return (
    <ul className="w3lgo-group" aria-hidden={dup ? "true" : undefined}>
      {clients.map((c) => (
        <li key={c.name} className="flex h-16 items-center gap-2.5 whitespace-nowrap text-slate-600">
          <Mark kind={c.mark} />
          <span className={`text-lg text-slate-700 ${c.font}`}>{c.name}</span>
        </li>
      ))}
    </ul>
  );
}

export default function LogoStripMarqueeWithSoftEdgeFade() {
  const root = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const [off, setOff] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    // stop the loop while the strip is out of view
    const io = new IntersectionObserver(([e]) => setOff(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={root}
      data-paused={paused ? "" : undefined}
      data-off={off ? "" : undefined}
      className="w3lgo bg-white px-5 py-20 sm:py-24"
      style={{ ["--w3lgo-speed" as string]: `${SPEED}s` }}
    >
      <style>{`
        .w3lgo-view { overflow: hidden; -webkit-mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent); mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent); }
        .w3lgo-track { display: flex; width: max-content; animation: w3lgo-run var(--w3lgo-speed) linear infinite; }
        .w3lgo-group { display: flex; gap: 56px; padding: 0 56px 0 0; margin: 0; list-style: none; }
        .w3lgo[data-paused] .w3lgo-track, .w3lgo[data-off] .w3lgo-track, .w3lgo-view:hover .w3lgo-track, .w3lgo-view:focus-within .w3lgo-track { animation-play-state: paused; }
        @keyframes w3lgo-run { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          .w3lgo-view { -webkit-mask-image: none; mask-image: none; }
          .w3lgo-track { animation: none; width: auto; justify-content: center; }
          .w3lgo-group { flex-wrap: wrap; justify-content: center; column-gap: 40px; row-gap: 4px; padding: 0; }
          .w3lgo-group[aria-hidden] { display: none; }
          .w3lgo-toggle { display: none; }
        }
      `}</style>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Harbourline Accounts</p>
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            The books behind workshops, clinics and family firms along the coast
          </h2>
        </div>
        <div className="w3lgo-view mt-12">
          <div className="w3lgo-track">
            <Group />
            <Group dup />
          </div>
        </div>
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            aria-pressed={paused}
            onClick={() => setPaused((p) => !p)}
            className="w3lgo-toggle inline-flex h-10 items-center gap-2 rounded-full border border-slate-300 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="fill-current">
              {paused ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" />}
            </svg>
            {paused ? "Play logos" : "Pause logos"}
          </button>
        </div>
      </div>
    </section>
  );
}

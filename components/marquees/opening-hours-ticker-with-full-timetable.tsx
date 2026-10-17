import { useEffect, useRef, useState } from "react";

// One source of truth: the ticker and the timetable are both built from this list.
const hours = [
  { day: "Monday", time: "7:00 to 15:00" },
  { day: "Tuesday", time: "7:00 to 15:00" },
  { day: "Wednesday", time: "7:00 to 15:00" },
  { day: "Thursday", time: "7:00 to 21:00" },
  { day: "Friday", time: "7:00 to 21:00" },
  { day: "Saturday", time: "8:00 to 16:00" },
  { day: "Sunday", time: "Closed" },
];
const SPEED = 34; // seconds per loop

function Strip({ dup }: { dup?: boolean }) {
  return (
    <span className="w3hrs-group" aria-hidden={dup ? "true" : undefined}>
      {hours.map((h) => (
        <span key={h.day} className="inline-flex items-center gap-3">
          <span className="font-semibold text-[#f2c879]">{h.day.slice(0, 3)}</span>
          <span className={h.time === "Closed" ? "text-[#9fb0c8]" : "text-[#e8edf5]"}>{h.time}</span>
          <span aria-hidden="true" className="ml-7 h-1 w-1 rounded-full bg-[#5b6f8c]" />
        </span>
      ))}
    </span>
  );
}

export default function OpeningHoursTickerWithFullTimetable() {
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
      className="w3hrs bg-[#0f1b2d] text-[#e8edf5]"
      style={{ ["--w3hrs-speed" as string]: `${SPEED}s` }}
    >
      <style>{`
        .w3hrs-bar { display: flex; align-items: center; border-bottom: 1px solid #22334d; background: #0a1422; }
        .w3hrs-view { flex: 1; overflow: hidden; }
        .w3hrs-track { display: flex; width: max-content; animation: w3hrs-run var(--w3hrs-speed) linear infinite; }
        .w3hrs-group { display: flex; align-items: center; gap: 28px; padding-right: 28px; height: 52px; white-space: nowrap; font-family: ui-monospace, Menlo, monospace; font-size: 14px; letter-spacing: .02em; }
        .w3hrs[data-paused] .w3hrs-track, .w3hrs[data-off] .w3hrs-track, .w3hrs-bar:hover .w3hrs-track { animation-play-state: paused; }
        @keyframes w3hrs-run { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          .w3hrs-bar { display: none; }
        }
      `}</style>
      <div className="w3hrs-bar">
        <p className="hidden shrink-0 items-center gap-2 border-r border-[#22334d] px-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#f2c879] sm:flex">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#7fd1a4]" /> This week
        </p>
        <div className="w3hrs-view" aria-hidden="true">
          <div className="w3hrs-track">
            <Strip />
            <Strip dup />
          </div>
        </div>
        <button
          type="button"
          aria-pressed={paused}
          aria-label={paused ? "Play the hours ticker" : "Pause the hours ticker"}
          onClick={() => setPaused((p) => !p)}
          className="grid h-[52px] w-[52px] shrink-0 place-items-center border-l border-[#22334d] text-[#e8edf5] hover:bg-[#15243a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f2c879]"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="fill-current">
            {paused ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" />}
          </svg>
        </button>
      </div>
      <div className="mx-auto grid max-w-5xl gap-10 px-5 py-16 md:grid-cols-[1.1fr_1fr] md:gap-16 md:py-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#f2c879]">Pier Lane Coffee</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Late on Thursdays and Fridays, with soup and bread until close.</h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[#b8c4d6]">Find us at 14 Pier Lane, two doors from the ferry ticket office. Dogs and prams are welcome inside.</p>
        </div>
        <div className="rounded-2xl border border-[#22334d] bg-[#132239] p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9fb0c8]">Opening hours</h3>
          <dl className="mt-4 divide-y divide-[#22334d]">
            {hours.map((h) => (
              <div key={h.day} className="flex justify-between py-2.5 text-[15px]">
                <dt className="text-[#e8edf5]">{h.day}</dt>
                <dd className={`font-mono ${h.time === "Closed" ? "text-[#9fb0c8]" : "text-[#e8edf5]"}`}>{h.time}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

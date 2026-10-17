import { useEffect, useRef, useState } from "react";

// Exhibitions at an invented regional gallery. Each row is a link; its band repeats the title.
const shows = [
  { title: "Salt and Silver", detail: "Early coastal photographs", dates: "Until 9 Nov" },
  { title: "The Weaving Room", detail: "Looms, samples and pattern books", dates: "14 Nov to 2 Feb" },
  { title: "Field Notes", detail: "Drawings from three botanists", dates: "From 6 Dec" },
  { title: "Glass Harbour", detail: "Blown and cast glass", dates: "Spring" },
];
const SPEED = 9; // seconds per loop inside each band
const IDLE_STEP = 2200; // ms each row stays lit in the idle demo

export default function ListRowsThatTurnIntoMarqueeBandsOnHover() {
  const root = useRef<HTMLElement>(null);
  const [demo, setDemo] = useState(0);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el || live) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setDemo(-1); return; }
    // idle demo: light each row in turn until a real pointer or focus arrives; only while visible
    let timer = 0;
    const run = () => { timer = window.setInterval(() => setDemo((d) => (d + 1) % shows.length), IDLE_STEP); };
    const io = new IntersectionObserver(([e]) => { clearInterval(timer); if (e.isIntersecting) run(); });
    io.observe(el);
    const stop = () => setLive(true);
    el.addEventListener("pointerenter", stop);
    el.addEventListener("focusin", stop);
    return () => { clearInterval(timer); io.disconnect(); el.removeEventListener("pointerenter", stop); el.removeEventListener("focusin", stop); };
  }, [live]);

  return (
    <section ref={root} className="w3row bg-[#f7f6f2] px-5 py-16 text-[#1e2a36] sm:py-20" style={{ ["--w3row-speed" as string]: `${SPEED}s` }}>
      <style>{`
        .w3row-link { position: relative; display: grid; overflow: hidden; }
        .w3row-band { position: absolute; inset: 0; display: flex; align-items: center; overflow: hidden; background: #2d4a6b; color: #f7f6f2; transform: translateY(101%); transition: transform .5s cubic-bezier(.2,.8,.2,1); }
        .w3row-track { display: flex; width: max-content; animation: w3row-run var(--w3row-speed) linear infinite; animation-play-state: paused; }
        .w3row-group { display: flex; align-items: center; gap: 32px; padding-right: 32px; white-space: nowrap; font-size: clamp(26px, 4vw, 40px); font-weight: 600; letter-spacing: -0.02em; }
        .w3row-group i { font-style: normal; font-weight: 400; font-size: 0.5em; letter-spacing: .1em; text-transform: uppercase; opacity: .8; }
        .w3row-link:focus-visible { outline: 3px solid #c2703d; outline-offset: 2px; }
        .w3row-on .w3row-band, .w3row-link:focus-visible .w3row-band { transform: none; }
        .w3row-on .w3row-track, .w3row-link:focus-visible .w3row-track { animation-play-state: running; }
        @media (hover: hover) { .w3row-link:hover .w3row-band { transform: none; } .w3row-link:hover .w3row-track { animation-play-state: running; } }
        @keyframes w3row-run { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          .w3row-band { transition: none; }
          .w3row-track { animation: none; padding-left: 20px; }
        }
      `}</style>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">On at the Quayside Gallery</h2>
          <p className="text-sm text-[#4b5a69]">Open Tuesday to Sunday, entry free</p>
        </div>
        <ul className="mt-10 border-t border-[#cfd3d6]">
          {shows.map((s, i) => (
            <li key={s.title} className="border-b border-[#cfd3d6]">
              <a href="#" className={`w3row-link ${!live && demo === i ? "w3row-on" : ""}`} onMouseEnter={() => setLive(true)}>
                <span className="grid gap-1 px-1 py-6 sm:grid-cols-[1.3fr_1fr_auto] sm:items-baseline sm:gap-6">
                  <span className="text-2xl font-semibold tracking-tight sm:text-3xl">{s.title}</span>
                  <span className="text-[15px] text-[#4b5a69]">{s.detail}</span>
                  <span className="font-mono text-sm text-[#4b5a69]">{s.dates}</span>
                </span>
                <span className="w3row-band" aria-hidden="true">
                  <span className="w3row-track">
                    {[0, 1].map((k) => (
                      <span key={k} className="w3row-group">
                        {[0, 1, 2].map((n) => (
                          <span key={n} className="flex items-center gap-8">{s.title}<i>{s.dates}</i></span>
                        ))}
                      </span>
                    ))}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

import { useEffect, useRef } from "react";

// Each layer moves down by scroll * depth, so a higher depth reads as further away.
const LAYERS = [
  { depth: 0.42, fill: "#e8c39c", d: "M0 250 L110 205 L230 228 L370 150 L500 212 L640 168 L780 118 L930 190 L1060 146 L1210 214 L1330 172 L1440 198 V400 H0Z" },
  { depth: 0.3, fill: "#c98f6e", d: "M0 292 L150 238 L300 276 L450 206 L620 268 L760 226 L910 286 L1080 216 L1250 270 L1440 236 V400 H0Z" },
  { depth: 0.18, fill: "#8d5a49", d: "M0 330 C180 286 330 270 520 312 S850 356 1040 304 S1310 270 1440 314 V400 H0Z" },
];
const FRONT = "M0 250 C220 196 470 222 720 240 S1180 204 1440 232 V400 H0Z";
const NOTES = [
  { title: "Twelve rooms", text: "Every room faces the eastern ridge, so first light reaches the bed before the alarm does." },
  { title: "Marked trails", text: "Three loops leave from the porch, from a gentle valley walk to a full day on the high saddle." },
  { title: "A slow kitchen", text: "Breakfast runs until eleven and dinner is one long table, cooked from what the valley grows." },
];

export default function LayeredMountainLandscapeHeroWithDepthParallax() {
  const root = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const box = root.current;
    if (!box) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let on = true;
    const draw = () => {
      frame = 0;
      const s = box.scrollTop; // on page scroll use: Math.max(0, -hero.getBoundingClientRect().top)
      box.classList.toggle("w6lnd-moved", s > 8);
      if (reduce) return;
      layers.current.forEach((l) => {
        if (l) l.style.transform = `translate3d(0,${(s * Number(l.dataset.depth)).toFixed(1)}px,0)`;
      });
    };
    const req = () => {
      if (on && !frame) frame = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      box.toggleAttribute("data-paused", !on);
      if (on) req();
    });
    io.observe(box);
    box.addEventListener("scroll", req, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      box.removeEventListener("scroll", req);
    };
  }, []);

  let i = 0;
  const layerRef = (n: HTMLDivElement | null) => {
    if (n) layers.current[Number(n.dataset.i)] = n;
  };

  return (
    <div
      ref={root}
      tabIndex={0}
      role="region"
      aria-label="Haldor Ridge Lodge, scrollable preview"
      className="w6lnd relative h-[640px] overflow-y-auto overscroll-contain bg-[#21181a] text-[#2a1b19] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8d5a49]"
    >
      <style>{`
        .w6lnd-layer { will-change: transform; }
        .w6lnd-mist { animation: w6lnd-drift 26s ease-in-out infinite alternate; }
        .w6lnd[data-paused] .w6lnd-mist { animation-play-state: paused; }
        @keyframes w6lnd-drift { from { transform: translate3d(-4%,0,0); } to { transform: translate3d(4%,0,0); } }
        .w6lnd-hint { transition: opacity .5s ease; }
        .w6lnd-moved .w6lnd-hint { opacity: 0; }
        @media (prefers-reduced-motion: reduce) { .w6lnd-mist { animation: none; } .w6lnd-layer { will-change: auto; } }
      `}</style>
      <header className="relative h-[640px] overflow-hidden bg-gradient-to-b from-[#f6e3c8] via-[#f2d3ae] to-[#eab98f]">
        <div ref={layerRef} data-i={i++} data-depth="0.55" className="w6lnd-layer absolute left-[64%] top-[44%] -ml-16 h-32 w-32 rounded-full bg-[#fbeedb] shadow-[0_0_80px_30px_rgba(251,238,219,0.55)]" aria-hidden="true" />
        <div className="w6lnd-hint pointer-events-none absolute right-4 top-4 z-30 rounded-full bg-[#2a1b19]/80 px-3 py-1.5 text-xs font-medium text-[#f6e3c8]">Scroll inside</div>
        <div ref={layerRef} data-i={i++} data-depth="0.35" className="w6lnd-layer absolute inset-x-0 top-16 z-10 px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6e3f30]">Haldor Ridge Lodge</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-[clamp(36px,6.6vw,78px)] font-semibold leading-[1.02] tracking-[-0.02em]">Wake up above the cloud line</h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[#4a2c24]">A small lodge at the head of the valley, with the ridge outside every window.</p>
        </div>
        {LAYERS.map((l) => (
          <div key={l.depth} ref={layerRef} data-i={i++} data-depth={l.depth} aria-hidden="true" className="w6lnd-layer absolute inset-x-0 bottom-0 z-20 h-[62%]">
            <svg viewBox="0 0 1440 400" preserveAspectRatio="none" className="h-full w-full"><path d={l.d} fill={l.fill} /></svg>
          </div>
        ))}
        <div aria-hidden="true" className="w6lnd-mist absolute inset-x-[-10%] bottom-[16%] z-20 h-24 bg-gradient-to-b from-transparent via-[#f6e3c8]/40 to-transparent" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-20 h-[30%]">
          <svg viewBox="0 0 1440 400" preserveAspectRatio="none" className="h-full w-full"><path d={FRONT} fill="#21181a" /></svg>
        </div>
        <div className="absolute inset-x-0 bottom-8 z-30 flex flex-wrap justify-center gap-3 px-6">
          <a href="#" className="inline-flex h-12 items-center rounded-full bg-[#f6e3c8] px-6 text-sm font-semibold text-[#21181a] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6e3c8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#21181a]">Check winter dates</a>
          <a href="#" className="inline-flex h-12 items-center rounded-full border border-[#f6e3c8]/50 px-6 text-sm font-semibold text-[#f6e3c8] transition hover:border-[#f6e3c8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6e3c8]">See the trails</a>
        </div>
      </header>
      <section className="px-6 pb-20 pt-10 text-[#f1dcc4] sm:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="max-w-xl text-2xl font-semibold leading-snug sm:text-3xl">Quiet rooms, early light and a porch that opens onto three trails.</h2>
          <ul className="mt-10 grid gap-8 sm:grid-cols-3">
            {NOTES.map((n) => (
              <li key={n.title} className="border-t border-[#f1dcc4]/25 pt-5">
                <h3 className="text-base font-semibold">{n.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#d9bfa6]">{n.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

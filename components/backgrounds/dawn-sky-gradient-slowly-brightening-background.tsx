import { useEffect, useRef } from "react";

const css = `
  /* Change these first:
     the three colour sets in @keyframes dwn-rise (night, early, risen)
     --dwn-speed: how long one brightening takes; it then eases back
     .dwn-grain opacity: grain strength */
  @property --dwn-top { syntax: "<color>"; inherits: true; initial-value: #1b2a55; }
  @property --dwn-mid { syntax: "<color>"; inherits: true; initial-value: #66577f; }
  @property --dwn-low { syntax: "<color>"; inherits: true; initial-value: #e09678; }
  @property --dwn-sea { syntax: "<color>"; inherits: true; initial-value: #2c2f4c; }
  .dwn-hero { --dwn-speed: 32s; --dwn-top: #1b2a55; --dwn-mid: #66577f; --dwn-low: #e09678; --dwn-sea: #2c2f4c;
    position: relative; isolation: isolate; overflow: hidden; display: flex; align-items: flex-start; min-height: 620px;
    background: linear-gradient(180deg, var(--dwn-top) 0%, var(--dwn-mid) 50%, var(--dwn-low) 76%);
    font-family: ui-sans-serif, system-ui, sans-serif;
    animation: dwn-rise var(--dwn-speed) ease-in-out -11s infinite alternate; }
  .dwn-sky { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
  .dwn-sun { position: absolute; left: 62%; top: 76%; width: 70vmax; height: 70vmax; max-width: 980px; max-height: 980px; border-radius: 50%;
    background: radial-gradient(closest-side, rgba(255, 232, 196, 1), rgba(255, 196, 146, .55) 18%, rgba(255, 170, 130, .12) 52%, transparent 75%);
    transform: translate(-50%, -38%); animation: dwn-sun var(--dwn-speed) ease-in-out -11s infinite alternate; }
  .dwn-water { position: absolute; left: 0; right: 0; top: 76%; bottom: 0; background: linear-gradient(180deg, var(--dwn-low) 0%, var(--dwn-sea) 30%, #151827 100%); }
  .dwn-shine { position: absolute; left: 62%; top: 76%; width: 46%; height: 22%; transform: translateX(-50%);
    background: repeating-linear-gradient(180deg, rgba(255, 222, 186, .5) 0 2px, transparent 3px 7px);
    -webkit-mask-image: radial-gradient(50% 100% at 50% 0%, #000 0%, rgba(0,0,0,.35) 45%, transparent 100%); mask-image: radial-gradient(50% 100% at 50% 0%, #000 0%, rgba(0,0,0,.35) 45%, transparent 100%);
    animation: dwn-sun var(--dwn-speed) ease-in-out -11s infinite alternate; animation-name: dwn-glint; }
  .dwn-disc { position: absolute; left: 62%; top: 76%; width: 64px; height: 64px; margin: -32px 0 0 -32px; border-radius: 50%;
    background: radial-gradient(closest-side, #fff4e2 60%, rgba(255, 228, 190, .6) 80%, transparent);
    animation: dwn-disc var(--dwn-speed) ease-in-out -11s infinite alternate; }
  .dwn-cloud { position: absolute; border-radius: 50%; background: radial-gradient(closest-side, rgba(250, 196, 170, .38), rgba(250, 196, 170, 0)); }
  .dwn-cloud-a { left: -10%; top: 54%; width: 70%; height: 40px; animation: dwn-drift 70s linear -20s infinite alternate; }
  .dwn-cloud-b { right: -15%; top: 63%; width: 60%; height: 26px; opacity: .8; animation: dwn-drift 90s linear -50s infinite alternate-reverse; }
  .dwn-grain { position: absolute; inset: 0; opacity: .3; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url%28%23g%29'/%3E%3C/svg%3E"); }
  .dwn-hero[data-dwn-paused], .dwn-hero[data-dwn-paused] * { animation-play-state: paused !important; }
  @keyframes dwn-rise {
    0% { --dwn-top: #0d1533; --dwn-mid: #2f2d55; --dwn-low: #8a5a72; --dwn-sea: #1c1d33; }
    100% { --dwn-top: #2d4a7e; --dwn-mid: #8f7fa6; --dwn-low: #f2b98e; --dwn-sea: #3f4466; }
  }
  @keyframes dwn-sun { 0% { transform: translate(-50%, -22%); opacity: .55; } 100% { transform: translate(-50%, -50%); opacity: 1; } }
  @keyframes dwn-disc { 0% { transform: translateY(30px); } 100% { transform: translateY(-6px); } }
  @keyframes dwn-glint { 0% { opacity: .35; } 100% { opacity: 1; } }
  @keyframes dwn-drift { to { transform: translateX(12%); } }
  @media (prefers-reduced-motion: reduce) { .dwn-hero, .dwn-hero * { animation: none !important; } }
`;

export default function DawnSkyGradientBrightening() {
  const rootRef = useRef<HTMLElement>(null);

  // Pauses every animation while the hero is off screen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([entry]) => root.toggleAttribute("data-dwn-paused", !entry.isIntersecting));
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef} className="dwn-hero relative isolate flex min-h-[620px] items-start overflow-hidden">
      <style>{css}</style>
      <div className="dwn-sky" aria-hidden="true">
        <div className="dwn-cloud dwn-cloud-a" />
        <div className="dwn-cloud dwn-cloud-b" />
        <div className="dwn-sun" />
        <div className="dwn-disc" />
        <div className="dwn-water" />
        <div className="dwn-shine" />
        <div className="dwn-grain" />
      </div>
      <div className="mx-auto w-full max-w-5xl px-6 pb-[220px] pt-[104px] sm:px-10 sm:pb-[230px] sm:pt-[120px]">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#f3dccb]">Harbour Dawn Rowing Club</p>
        <h1 className="mt-4 max-w-[40rem] text-4xl font-semibold leading-[1.1] text-white [text-shadow:0_1px_18px_rgba(20,24,50,.35)] sm:text-6xl">On the water before the city wakes up.</h1>
        <p className="mt-5 max-w-[32rem] text-lg leading-relaxed text-[#f1ecf4] [text-shadow:0_1px_12px_rgba(20,24,50,.35)]">Coached sessions at first light, four days a week. Boats, oars and a hot drink on the pontoon are included.</p>
        <a href="#" className="mt-[34px] inline-flex h-12 items-center rounded-full bg-[#1b2140] px-[26px] text-[15px] font-semibold text-white hover:bg-[#10142a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b2140]">Join a 6am session</a>
      </div>
    </section>
  );
}

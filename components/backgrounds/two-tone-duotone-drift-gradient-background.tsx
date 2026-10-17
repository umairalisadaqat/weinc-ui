import { useEffect, useRef } from "react";

const css = `
  /* Change these first:
     --duo-ink and --duo-clay: the two tones (anything dark enough for white text)
     --duo-speed: one sweep of the boundary between them
     .duo-screen opacity: strength of the printed dot screen */
  @property --duo-a { syntax: "<angle>"; inherits: false; initial-value: 125deg; }
  @property --duo-p { syntax: "<percentage>"; inherits: false; initial-value: 45%; }
  .duo-hero { --duo-ink: #13283f; --duo-clay: #9a4a2e; --duo-speed: 26s;
    position: relative; isolation: isolate; overflow: hidden; display: flex; align-items: center; min-height: 580px;
    background: var(--duo-clay); font-family: ui-sans-serif, system-ui, sans-serif; }
  .duo-sky { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
  .duo-field { position: absolute; inset: 0; --duo-a: 125deg; --duo-p: 45%;
    background: linear-gradient(var(--duo-a), var(--duo-ink) calc(var(--duo-p) - 22%), var(--duo-clay) calc(var(--duo-p) + 26%));
    animation: duo-sweep var(--duo-speed) ease-in-out -9s infinite alternate; }
  .duo-pool { position: absolute; border-radius: 50%; }
  .duo-p1 { left: 45%; top: -35%; width: 70%; height: 110%; background: radial-gradient(closest-side, var(--duo-ink), transparent); opacity: .75; animation: duo-float calc(var(--duo-speed) * 1.2) ease-in-out -4s infinite alternate; }
  .duo-p2 { left: -25%; top: 50%; width: 75%; height: 100%; background: radial-gradient(closest-side, var(--duo-clay), transparent); opacity: .7; animation: duo-float calc(var(--duo-speed) * .9) ease-in-out -15s infinite alternate-reverse; }
  .duo-screen { position: absolute; inset: 0; opacity: .14; mix-blend-mode: multiply;
    background-image: radial-gradient(circle at 50% 50%, #000 0 1.1px, transparent 1.6px); background-size: 5px 5px; }
  .duo-grain { position: absolute; inset: 0; opacity: .35; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url%28%23g%29'/%3E%3C/svg%3E"); }
  .duo-hero[data-duo-paused] * { animation-play-state: paused !important; }
  @keyframes duo-sweep { 0% { --duo-a: 100deg; --duo-p: 30%; } 100% { --duo-a: 170deg; --duo-p: 62%; } }
  @keyframes duo-float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(-14%, 10%) scale(1.18); } }
  @media (prefers-reduced-motion: reduce) { .duo-hero * { animation: none !important; } }
`;

export default function TwoToneDuotoneDrift() {
  const rootRef = useRef<HTMLElement>(null);

  // Pauses every animation while the hero is off screen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([entry]) => root.toggleAttribute("data-duo-paused", !entry.isIntersecting));
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef} className="duo-hero relative isolate flex min-h-[580px] items-center overflow-hidden">
      <style>{css}</style>
      <div className="duo-sky" aria-hidden="true">
        <div className="duo-field" />
        <div className="duo-pool duo-p1" />
        <div className="duo-pool duo-p2" />
        <div className="duo-screen" />
        <div className="duo-grain" />
      </div>
      <div className="mx-auto w-full max-w-5xl px-6 py-24 sm:px-10 sm:py-[110px]">
        <p className="inline-block border border-[#fff0e1]/50 px-2.5 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#fbeee2]">Tidewater Records</p>
        <h1 className="mt-[22px] max-w-[46rem] text-[32px] font-bold leading-[1.08] tracking-tight text-[#fff8f1] sm:text-[56px]">A small label for slow music. New pressings every second Friday.</h1>
        <p className="mt-5 max-w-[32rem] text-lg leading-relaxed text-[#f3e4d8]">Ambient, folk and quiet jazz on heavyweight vinyl, mastered for a room rather than a phone speaker.</p>
        <a href="#" className="mt-8 inline-flex h-12 items-center bg-[#fff8f1] px-6 text-[15px] font-bold text-[#13283f] hover:bg-[#fde9d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff8f1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#13283f]">Hear this month&apos;s record</a>
      </div>
    </section>
  );
}

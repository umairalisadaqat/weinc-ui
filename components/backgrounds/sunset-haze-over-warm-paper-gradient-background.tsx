import { useEffect, useRef } from "react";

const css = `
  /* Change these first:
     --shp-paper: the paper colour everything sits on
     --shp-orange, --shp-rose, --shp-ochre: the haze colours (r, g, b)
     --shp-speed: base drift time; larger is calmer */
  .shp-hero { --shp-paper: #f3eadb; --shp-orange: 226, 122, 68; --shp-rose: 204, 104, 104; --shp-ochre: 228, 172, 92; --shp-speed: 30s;
    position: relative; isolation: isolate; overflow: hidden; display: flex; align-items: center; justify-content: center; min-height: 600px;
    background: var(--shp-paper); font-family: ui-sans-serif, system-ui, sans-serif; }
  .shp-sky { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
  .shp-haze { position: absolute; border-radius: 50%; will-change: transform; }
  .shp-h1 { left: -20%; bottom: -45%; width: 90%; height: 95%; background: radial-gradient(closest-side, rgba(var(--shp-orange), .8), rgba(var(--shp-orange), .3) 55%, transparent); animation: shp-a var(--shp-speed) ease-in-out -8s infinite alternate; }
  .shp-h2 { right: -25%; bottom: -35%; width: 85%; height: 90%; background: radial-gradient(closest-side, rgba(var(--shp-rose), .62), rgba(var(--shp-rose), .2) 55%, transparent); animation: shp-b calc(var(--shp-speed) * 1.3) ease-in-out -14s infinite alternate; }
  .shp-h3 { left: 20%; bottom: -20%; width: 70%; height: 55%; background: radial-gradient(closest-side, rgba(var(--shp-ochre), .55), transparent); animation: shp-a calc(var(--shp-speed) * .8) ease-in-out -3s infinite alternate-reverse; }
  .shp-h4 { left: 5%; top: -40%; width: 90%; height: 70%; background: radial-gradient(closest-side, rgba(150, 120, 150, .2), transparent); animation: shp-b calc(var(--shp-speed) * 1.6) ease-in-out -20s infinite alternate; }
  .shp-sun { position: absolute; left: 50%; bottom: 6%; width: 220px; height: 220px; margin-left: -110px; border-radius: 50%;
    background: radial-gradient(closest-side, rgba(255, 236, 206, .95), rgba(250, 200, 150, .5) 45%, transparent);
    animation: shp-sink calc(var(--shp-speed) * 1.5) ease-in-out -10s infinite alternate; }
  .shp-paper { position: absolute; inset: 0; opacity: .12; mix-blend-mode: multiply;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.03 .12' numOctaves='4' seed='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .62 0 0 0 0 .55 0 0 0 0 .45 0 0 0 -1.4 1.1'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url%28%23f%29'/%3E%3C/svg%3E"); }
  .shp-grain { position: absolute; inset: 0; opacity: .35; mix-blend-mode: multiply;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url%28%23g%29'/%3E%3C/svg%3E"); }
  .shp-hero[data-shp-paused] * { animation-play-state: paused !important; }
  @keyframes shp-a { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(14%, -8%) scale(1.15); } }
  @keyframes shp-b { 0% { transform: translate(0, 0) scale(1.1); } 100% { transform: translate(-16%, -6%) scale(.95); } }
  @keyframes shp-sink { 0% { transform: translateY(-30px); opacity: 1; } 100% { transform: translateY(40px); opacity: .7; } }
  @media (prefers-reduced-motion: reduce) { .shp-hero * { animation: none !important; } }
`;

export default function SunsetHazeOverWarmPaper() {
  const rootRef = useRef<HTMLElement>(null);

  // Pauses every animation while the hero is off screen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([entry]) => root.toggleAttribute("data-shp-paused", !entry.isIntersecting));
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef} className="shp-hero relative isolate flex min-h-[600px] items-center justify-center overflow-hidden">
      <style>{css}</style>
      <div className="shp-sky" aria-hidden="true">
        <div className="shp-haze shp-h1" />
        <div className="shp-haze shp-h2" />
        <div className="shp-haze shp-h3" />
        <div className="shp-haze shp-h4" />
        <div className="shp-sun" />
        <div className="shp-paper" />
        <div className="shp-grain" />
      </div>
      <div className="mx-auto w-full max-w-[46rem] px-6 pb-[140px] pt-24 text-center sm:px-10 sm:pb-[150px] sm:pt-[110px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#7a3a1c]">Marigold Press &middot; Letterpress studio</p>
        <h1 className="mt-[18px] font-serif text-[34px] font-medium leading-[1.08] text-[#2a1a10] sm:text-[58px]">Wedding invitations printed by hand on cotton paper.</h1>
        <p className="mx-auto mt-5 max-w-[32rem] text-lg leading-relaxed text-[#4a3426]">Deep impressions, mixed inks and envelopes lined to match. Proofs arrive by post within ten working days.</p>
        <a href="#" className="mt-8 inline-flex h-12 items-center rounded px-[26px] text-[15px] font-semibold text-[#f8efe2] bg-[#2a1a10] hover:bg-[#452a1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a1a10] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3eadb]">Request a sample pack</a>
      </div>
    </section>
  );
}

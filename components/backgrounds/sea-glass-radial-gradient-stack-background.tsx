import { useEffect, useRef } from "react";

const css = `
  /* Change these first:
     the four colours in .sgl-glass (frosted greens and blues)
     --sgl-speed: how long the pools take to wander
     .sgl-frost opacity: how frosted the surface looks */
  @property --sgl-x1 { syntax: "<percentage>"; inherits: false; initial-value: 18%; }
  @property --sgl-y1 { syntax: "<percentage>"; inherits: false; initial-value: 24%; }
  @property --sgl-x2 { syntax: "<percentage>"; inherits: false; initial-value: 82%; }
  @property --sgl-y2 { syntax: "<percentage>"; inherits: false; initial-value: 30%; }
  @property --sgl-x3 { syntax: "<percentage>"; inherits: false; initial-value: 60%; }
  @property --sgl-y3 { syntax: "<percentage>"; inherits: false; initial-value: 88%; }
  .sgl-hero { --sgl-speed: 28s;
    position: relative; isolation: isolate; overflow: hidden; display: flex; align-items: center; justify-content: center; min-height: 580px;
    background: #e9efe9; font-family: ui-sans-serif, system-ui, sans-serif; }
  .sgl-sky { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
  .sgl-glass { position: absolute; inset: 0;
    background:
      radial-gradient(42% 55% at var(--sgl-x1) var(--sgl-y1), rgba(150, 206, 190, .85), transparent 70%),
      radial-gradient(40% 50% at var(--sgl-x2) var(--sgl-y2), rgba(146, 186, 210, .75), transparent 70%),
      radial-gradient(50% 45% at var(--sgl-x3) var(--sgl-y3), rgba(178, 214, 168, .7), transparent 70%),
      radial-gradient(60% 60% at 30% 100%, rgba(120, 178, 176, .55), transparent 70%),
      linear-gradient(160deg, #eef3ee, #dfe9e6);
    animation: sgl-wander var(--sgl-speed) ease-in-out -7s infinite alternate; }
  .sgl-sheen { position: absolute; top: -20%; bottom: -20%; left: 0; width: 45%;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, .42) 46%, rgba(255, 255, 255, .12) 62%, rgba(255, 255, 255, 0) 100%);
    animation: sgl-sheen 18s ease-in-out -6s infinite alternate; }
  .sgl-frost { position: absolute; inset: 0; opacity: .4; mix-blend-mode: soft-light;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url%28%23g%29'/%3E%3C/svg%3E"); }
  .sgl-hero[data-sgl-paused] * { animation-play-state: paused !important; }
  @keyframes sgl-wander {
    0% { --sgl-x1: 10%; --sgl-y1: 20%; --sgl-x2: 88%; --sgl-y2: 24%; --sgl-x3: 70%; --sgl-y3: 92%; }
    50% { --sgl-x1: 28%; --sgl-y1: 40%; --sgl-x2: 72%; --sgl-y2: 12%; --sgl-x3: 46%; --sgl-y3: 78%; }
    100% { --sgl-x1: 20%; --sgl-y1: 70%; --sgl-x2: 80%; --sgl-y2: 58%; --sgl-x3: 36%; --sgl-y3: 18%; }
  }
  @keyframes sgl-sheen { 0% { transform: translateX(-80%) skewX(-14deg); } 100% { transform: translateX(220%) skewX(-14deg); } }
  @media (prefers-reduced-motion: reduce) { .sgl-hero * { animation: none !important; } }
`;

export default function SeaGlassRadialGradientStack() {
  const rootRef = useRef<HTMLElement>(null);

  // Pauses every animation while the hero is off screen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([entry]) => root.toggleAttribute("data-sgl-paused", !entry.isIntersecting));
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef} className="sgl-hero relative isolate flex min-h-[580px] items-center justify-center overflow-hidden">
      <style>{css}</style>
      <div className="sgl-sky" aria-hidden="true">
        <div className="sgl-glass" />
        <div className="sgl-sheen" />
        <div className="sgl-frost" />
      </div>
      <div className="mx-auto w-full max-w-[44rem] px-6 py-24 text-center sm:px-10 sm:py-[110px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#2c5c58]">Low Tide Ceramics</p>
        <h1 className="mt-[18px] text-[34px] font-semibold leading-[1.08] tracking-tight text-[#0f3332] sm:text-[56px]">Stoneware glazed in the colours of the shoreline.</h1>
        <p className="mx-auto mt-5 max-w-[32rem] text-lg leading-relaxed text-[#2d4d4b]">Mugs, bowls and serving plates thrown in a seaside workshop and fired in small kilns of thirty pieces at a time.</p>
        <a href="#" className="mt-8 inline-flex h-12 items-center rounded-[14px] bg-[#0f3332] px-[26px] text-[15px] font-semibold text-[#eef6f2] hover:bg-[#18504e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f3332] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9efe9]">Shop the autumn kiln</a>
      </div>
    </section>
  );
}

import { useEffect, useRef } from "react";

const css = `
  /* Change these first:
     --flm-shadow and --flm-light: the two halves of the colour grade (r, g, b)
     --flm-leak: the warm light leak (r, g, b)
     .flm-grain opacity: how much film grain shows */
  .flm-hero { --flm-shadow: 34, 86, 92; --flm-light: 196, 118, 52; --flm-leak: 232, 92, 48;
    position: relative; isolation: isolate; overflow: hidden; display: flex; align-items: flex-end; min-height: 620px;
    background: #15110f; font-family: ui-sans-serif, system-ui, sans-serif; }
  .flm-sky { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
  .flm-wash { position: absolute; border-radius: 50%; }
  .flm-teal { left: -30%; top: -40%; width: 100%; height: 150%; background: radial-gradient(closest-side, rgba(var(--flm-shadow), .95), rgba(var(--flm-shadow), .35) 60%, transparent); animation: flm-pan 24s ease-in-out -7s infinite alternate; }
  .flm-amber { right: -35%; top: -30%; width: 95%; height: 140%; background: radial-gradient(closest-side, rgba(var(--flm-light), .78), rgba(var(--flm-light), .25) 60%, transparent); animation: flm-pan 30s ease-in-out -19s infinite alternate-reverse; }
  .flm-leak { position: absolute; right: -12%; top: -10%; width: 45%; height: 120%; border-radius: 50%;
    background: radial-gradient(closest-side, rgba(var(--flm-leak), .55), rgba(var(--flm-leak), .14) 55%, transparent);
    mix-blend-mode: screen; animation: flm-leak 9s ease-in-out -2s infinite; }
  .flm-vignette { position: absolute; inset: 0; background: radial-gradient(120% 90% at 50% 45%, transparent 45%, rgba(8, 6, 5, .75) 100%); }
  .flm-grain { position: absolute; inset: -60px; opacity: .3; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.95' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url%28%23g%29'/%3E%3C/svg%3E");
    animation: flm-jitter .9s steps(1) infinite; }
  .flm-hero[data-flm-paused] * { animation-play-state: paused !important; }
  @keyframes flm-pan { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(12%, 6%) scale(1.12); } }
  @keyframes flm-leak { 0%, 100% { opacity: .55; transform: translateY(0); } 38% { opacity: 1; transform: translateY(-4%); } 46% { opacity: .7; } 70% { opacity: .9; transform: translateY(3%); } }
  @keyframes flm-jitter { 0% { transform: translate(0, 0); } 20% { transform: translate(-23px, 14px); } 40% { transform: translate(17px, -31px); } 60% { transform: translate(-9px, 27px); } 80% { transform: translate(29px, 5px); } }
  @media (prefers-reduced-motion: reduce) { .flm-hero * { animation: none !important; } }
`;

export default function FilmColourWashWithGrain() {
  const rootRef = useRef<HTMLElement>(null);

  // Pauses every animation while the hero is off screen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([entry]) => root.toggleAttribute("data-flm-paused", !entry.isIntersecting));
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef} className="flm-hero relative isolate flex min-h-[620px] items-end overflow-hidden">
      <style>{css}</style>
      <div className="flm-sky" aria-hidden="true">
        <div className="flm-wash flm-teal" />
        <div className="flm-wash flm-amber" />
        <div className="flm-leak" />
        <div className="flm-vignette" />
        <div className="flm-grain" />
      </div>
      <div className="mx-auto w-full max-w-6xl px-6 pb-[72px] pt-[120px] sm:px-10 sm:pb-[88px] sm:pt-[140px]">
        <p className="font-mono text-[13px] uppercase tracking-[0.1em] text-[#e8c9a6]">Northlight Film Lab</p>
        <h1 className="mt-4 max-w-[46rem] text-4xl font-semibold leading-[1.04] tracking-tight text-[#f7efe4] sm:text-[66px]">Your rolls, developed and scanned within the week.</h1>
        <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-[#e3d8cb]">C-41, black and white and slide film, processed in small batches and scanned at full resolution by people who still shoot.</p>
        <a href="#" className="mt-8 inline-flex h-12 items-center rounded-sm bg-[#f2e6d6] px-[26px] text-[15px] font-semibold text-[#1c1511] hover:bg-[#fff8ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2e6d6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#15110f]">Post us your film</a>
      </div>
    </section>
  );
}

import { useEffect, useRef } from "react";

const css = `
  /* Change these first:
     the tints in .prl-n1 (the nacre colours; keep them pale)
     --prl-speed: one full turn of the sheen
     .prl-grain opacity: grain strength */
  @property --prl-a { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
  .prl-hero { --prl-speed: 48s;
    position: relative; isolation: isolate; overflow: hidden; display: flex; align-items: center; min-height: 600px;
    background: #efebe6; font-family: ui-sans-serif, system-ui, sans-serif; }
  .prl-sky { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
  .prl-nacre { position: absolute; inset: 0; --prl-a: 40deg; }
  .prl-n1 { background: repeating-conic-gradient(from var(--prl-a) at -10% 115%, #efe9e3 0deg, #d3c3ea 7deg, #f0d2bd 14deg, #c3e2d5 21deg, #ccd8f0 28deg, #efe9e3 36deg);
    animation: prl-turn var(--prl-speed) linear -12s infinite; }
  .prl-n2 { opacity: .35;
    background: repeating-conic-gradient(from var(--prl-a) at 115% -20%, #fbf9f6 0deg, #e2d6f0 12deg, #fbf9f6 22deg, #d8eee4 34deg, #fbf9f6 46deg);
    animation: prl-turn calc(var(--prl-speed) * 1.4) linear -30s infinite reverse; }
  .prl-lustre { position: absolute; border-radius: 50%; mix-blend-mode: screen; }
  .prl-l1 { left: 30%; top: -30%; width: 70%; height: 90%; background: radial-gradient(closest-side, rgba(255, 255, 255, .7), rgba(255, 255, 255, .2) 50%, transparent); animation: prl-glide 26s ease-in-out -6s infinite alternate; }
  .prl-l2 { left: -10%; top: 45%; width: 55%; height: 70%; background: radial-gradient(closest-side, rgba(255, 252, 246, .7), transparent); animation: prl-glide 34s ease-in-out -19s infinite alternate-reverse; }
  .prl-grain { position: absolute; inset: 0; opacity: .3; mix-blend-mode: soft-light;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url%28%23g%29'/%3E%3C/svg%3E"); }
  .prl-hero[data-prl-paused] * { animation-play-state: paused !important; }
  @keyframes prl-turn { from { --prl-a: 0deg; } to { --prl-a: 360deg; } }
  @keyframes prl-glide { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(-18%, 14%) scale(1.2); } }
  @media (prefers-reduced-motion: reduce) { .prl-hero * { animation: none !important; } }
`;

export default function IridescentPearlSheen() {
  const rootRef = useRef<HTMLElement>(null);

  // Pauses every animation while the hero is off screen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([entry]) => root.toggleAttribute("data-prl-paused", !entry.isIntersecting));
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef} className="prl-hero relative isolate flex min-h-[600px] items-center overflow-hidden">
      <style>{css}</style>
      <div className="prl-sky" aria-hidden="true">
        <div className="prl-nacre prl-n1" />
        <div className="prl-nacre prl-n2" />
        <div className="prl-lustre prl-l1" />
        <div className="prl-lustre prl-l2" />
        <div className="prl-grain" />
      </div>
      <div className="mx-auto w-full max-w-5xl px-6 py-24 sm:px-10 sm:py-[110px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#5b5267]">Halden &amp; Pearl &middot; Jewellery repairs</p>
        <h1 className="mt-[18px] max-w-[40rem] font-serif text-[34px] font-normal leading-[1.08] text-[#24212b] sm:text-[58px]">Restringing and care for the pearls you plan to keep.</h1>
        <p className="mt-5 max-w-[32rem] text-lg leading-relaxed text-[#45404f]">Knotted silk, new clasps and a gentle clean, done at the bench in a single afternoon while you wait or post them in.</p>
        <a href="#" className="mt-8 inline-flex h-12 items-center rounded-full border border-[#24212b] px-[26px] text-[15px] font-semibold text-[#24212b] transition-colors hover:bg-[#24212b] hover:text-[#f6f2ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24212b] focus-visible:ring-offset-2">Book a bench visit</a>
      </div>
    </section>
  );
}

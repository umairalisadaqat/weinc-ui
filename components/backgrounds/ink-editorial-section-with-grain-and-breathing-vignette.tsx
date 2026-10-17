import { useEffect, useRef } from "react";

const css = `
  .w4ink { --w4ink-bg: #131211; --w4ink-text: #ece4d6; --w4ink-lamp: 214, 168, 104; --w4ink-grain: .16;
    position: relative; isolation: isolate; overflow: hidden; background: var(--w4ink-bg); color: var(--w4ink-text);
    font-family: ui-sans-serif, system-ui, sans-serif; }
  .w4ink-air { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
  .w4ink-lamp { position: absolute; left: 50%; top: 42%; width: 130%; height: 120%; margin: -60% 0 0 -65%; border-radius: 50%;
    background: radial-gradient(closest-side, rgba(var(--w4ink-lamp), .2), rgba(var(--w4ink-lamp), .06) 55%, transparent); animation: w4ink-lamp 11s ease-in-out infinite alternate; }
  .w4ink-vig { position: absolute; inset: -4%; background: radial-gradient(75% 70% at 50% 45%, transparent 40%, rgba(0, 0, 0, .82) 100%);
    animation: w4ink-breathe 9s ease-in-out infinite alternate; }
  .w4ink-air::after { content: ""; position: absolute; inset: -160px; opacity: var(--w4ink-grain); mix-blend-mode: screen;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='k'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.62' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 .96 0 0 0 0 .9 0 0 0 1.6 -.55'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23k)'/%3E%3C/svg%3E");
    animation: w4ink-grain .8s steps(1) infinite; }
  .w4ink[data-w4ink-off] .w4ink-air *, .w4ink[data-w4ink-off] .w4ink-air::after { animation-play-state: paused; }
  @keyframes w4ink-grain { 0% { transform: translate(0, 0); } 12% { transform: translate(-71px, 33px); } 25% { transform: translate(48px, -86px); } 37% { transform: translate(-29px, -48px); }
    50% { transform: translate(92px, 61px); } 62% { transform: translate(-104px, 14px); } 75% { transform: translate(17px, 99px); } 87% { transform: translate(66px, -21px); } }
  @keyframes w4ink-breathe { 0% { opacity: .78; transform: scale(1.04); } 100% { opacity: 1; transform: scale(1); } }
  @keyframes w4ink-lamp { 0% { opacity: .75; transform: translate(-3%, 1%); } 100% { opacity: 1; transform: translate(3%, -2%); } }
  .w4ink-inner { max-width: 60rem; margin: 0 auto; padding: 76px 24px 84px; }
  .w4ink-mast { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px 20px; padding-bottom: 14px; border-bottom: 1px solid rgba(236, 228, 214, .28);
    font-size: 12px; letter-spacing: .2em; text-transform: uppercase; color: #c9bfae; }
  .w4ink-title { margin: 44px 0 0; max-width: 44rem; font-family: Georgia, "Times New Roman", serif; font-size: clamp(38px, 6.4vw, 72px); font-weight: 400; line-height: 1.02; letter-spacing: -.015em; }
  .w4ink-title em { color: rgb(var(--w4ink-lamp)); }
  .w4ink-by { margin: 20px 0 0; font-size: 14px; color: #c9bfae; }
  .w4ink-cols { margin-top: 36px; display: grid; gap: 22px; }
  @media (min-width: 760px) { .w4ink-cols { grid-template-columns: 1fr 1fr; gap: 36px; } }
  .w4ink-cols p { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: 17px; line-height: 1.7; color: #ddd4c4; }
  .w4ink-cols p:first-child::first-letter { float: left; margin: 6px 10px 0 0; font-size: 58px; line-height: .8; color: var(--w4ink-text); }
  .w4ink-link { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; margin-top: 34px; color: var(--w4ink-text); font-size: 15px; font-weight: 600;
    text-decoration: underline; text-underline-offset: 6px; text-decoration-color: rgba(var(--w4ink-lamp), .8); }
  .w4ink-link:hover { color: #fff; }
  .w4ink-link:focus-visible { outline: 2px solid var(--w4ink-text); outline-offset: 4px; border-radius: 2px; }
  @media (prefers-reduced-motion: reduce) { .w4ink-air *, .w4ink-air::after { animation: none !important; } }
`;

export default function InkEditorialSectionWithGrainAndBreathingVignette() {
  const rootRef = useRef<HTMLElement>(null);

  // Pauses the grain, vignette and lamp loops while the section is off screen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([en]) => root.toggleAttribute("data-w4ink-off", !en.isIntersecting));
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef} className="w4ink">
      <style>{css}</style>
      <div className="w4ink-air" aria-hidden="true">
        <div className="w4ink-lamp" />
        <div className="w4ink-vig" />
      </div>
      <div className="w4ink-inner">
        <div className="w4ink-mast"><span>Margin Quarterly</span><span>Issue 9 · Autumn</span></div>
        <h2 className="w4ink-title">The bakers who work <em>while the town sleeps</em></h2>
        <p className="w4ink-by">Words by Tomas Reyna · 14 minute read</p>
        <div className="w4ink-cols">
          <p>At ten past two the first oven on Dock Road is already warm. Ines Varga lifts the cloth from forty loaves that have been rising since dusk and reads them by touch, the way her father did.</p>
          <p>We spent a month of nights in three small bakeries, from the first mix to the van leaving at six, to learn what keeps people choosing a working life that runs opposite to everyone they love.</p>
        </div>
        <a href="#" className="w4ink-link">Read the essay</a>
      </div>
    </section>
  );
}

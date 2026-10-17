import { useEffect, useRef } from "react";

const PHOTO = "https://images.pexels.com/photos/29546724/pexels-photo-29546724.jpeg?auto=compress&cs=tinysrgb&w=1600";

const css = `
  .w4fgr { --w4fgr-grain: .34; --w4fgr-flicker: .07; --w4fgr-shade: 14, 22, 18;
    position: relative; isolation: isolate; overflow: hidden; display: flex; align-items: flex-end; min-height: 600px; background: #1a211d;
    color: #eef0e8; font-family: ui-sans-serif, system-ui, sans-serif; }
  .w4fgr-film { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
  /* the photo runs past the right edge on purpose: the source has a dark strip there */
  .w4fgr-photo { position: absolute; left: -12px; top: -12px; width: calc(100% + 80px); height: calc(100% + 24px); max-width: none; object-fit: cover; object-position: 50% 60%;
    animation: w4fgr-weave 2.4s steps(1) infinite; }
  .w4fgr-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(var(--w4fgr-shade), .15) 0%, rgba(var(--w4fgr-shade), .35) 45%, rgba(var(--w4fgr-shade), .9) 100%),
    linear-gradient(90deg, rgba(var(--w4fgr-shade), .55) 0%, rgba(var(--w4fgr-shade), 0) 65%),
    radial-gradient(120% 90% at 50% 40%, transparent 50%, rgba(8, 10, 9, .6) 100%); }
  .w4fgr-flick { position: absolute; inset: 0; background: #f4f1e6; opacity: 0; animation: w4fgr-flick 1.3s steps(1) infinite; }
  .w4fgr-film::after { content: ""; position: absolute; inset: -120px; opacity: var(--w4fgr-grain); mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    animation: w4fgr-grain .6s steps(1) infinite; }
  .w4fgr[data-w4fgr-off] .w4fgr-film *, .w4fgr[data-w4fgr-off] .w4fgr-film::after { animation-play-state: paused; }
  @keyframes w4fgr-grain { 0% { transform: translate(0, 0); } 17% { transform: translate(-44px, 26px); } 33% { transform: translate(31px, -52px); }
    50% { transform: translate(-18px, -9px); } 67% { transform: translate(56px, 38px); } 83% { transform: translate(-61px, -33px); } }
  @keyframes w4fgr-weave { 0% { transform: translate(0, 0); } 25% { transform: translate(1px, -1px); } 50% { transform: translate(0, 1px); } 75% { transform: translate(-1px, 0); } }
  @keyframes w4fgr-flick { 0% { opacity: 0; } 20% { opacity: var(--w4fgr-flicker); } 30% { opacity: 0; } 62% { opacity: calc(var(--w4fgr-flicker) * .5); } 70% { opacity: 0; } }
  .w4fgr-inner { width: 100%; max-width: 72rem; margin: 0 auto; padding: 120px 24px 64px; box-sizing: border-box; }
  .w4fgr-kicker { margin: 0; font-family: ui-monospace, Menlo, monospace; font-size: 13px; letter-spacing: .14em; text-transform: uppercase; color: #cfd8c4; }
  .w4fgr-title { margin: 14px 0 0; max-width: 40rem; font-family: Georgia, "Times New Roman", serif; font-size: clamp(36px, 6vw, 64px); font-weight: 400; line-height: 1.04; letter-spacing: -.01em; }
  .w4fgr-copy { margin: 18px 0 0; max-width: 32rem; font-size: 17px; line-height: 1.6; color: #dfe4d8; }
  .w4fgr-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }
  .w4fgr-btn { display: inline-flex; align-items: center; min-height: 48px; padding: 0 24px; border-radius: 4px; font-size: 15px; font-weight: 600; text-decoration: none; }
  .w4fgr-btn.main { background: #eef0e8; color: #1a211d; }
  .w4fgr-btn.main:hover { background: #fff; }
  .w4fgr-btn.alt { color: #eef0e8; border: 1px solid rgba(238, 240, 232, .55); }
  .w4fgr-btn.alt:hover { background: rgba(238, 240, 232, .1); }
  .w4fgr-btn:focus-visible { outline: 3px solid #eef0e8; outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) { .w4fgr-film *, .w4fgr-film::after { animation: none !important; } }
`;

export default function FilmGrainAndFlickerOverAFoggyPhotoHero() {
  const rootRef = useRef<HTMLElement>(null);

  // Pauses the grain, weave and flicker while the hero is off screen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([en]) => root.toggleAttribute("data-w4fgr-off", !en.isIntersecting));
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef} className="w4fgr">
      <style>{css}</style>
      <div className="w4fgr-film" aria-hidden="true">
        <img className="w4fgr-photo" src={PHOTO} alt="A small wooden hut under tall pines in fog" width={1600} height={1067} />
        <div className="w4fgr-scrim" />
        <div className="w4fgr-flick" />
      </div>
      <div className="w4fgr-inner">
        <p className="w4fgr-kicker">Hollow Pine Huts</p>
        <h2 className="w4fgr-title">One room, one stove, and the pines all around.</h2>
        <p className="w4fgr-copy">Four timber huts in a spruce wood at the end of a gravel track. Bring boots; the nearest shop is a forty minute walk.</p>
        <div className="w4fgr-row">
          <a href="#" className="w4fgr-btn main">See the huts</a>
          <a href="#" className="w4fgr-btn alt">How to get here</a>
        </div>
      </div>
    </section>
  );
}

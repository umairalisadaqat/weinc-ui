import { useEffect, useRef } from "react";

const TILE = 180; // size of the grain tile in pixels
const SPECKS = 0.22; // share of pixels that get a speck (0.1 sparse, 0.4 dense)
const CLUMP = 2; // speck size in pixels: 1 fine, 2 coarse, 3 very coarse

const css = `
  .w4ter { --w4ter-clay: #9f4528; --w4ter-cream: #f3e4cc; --w4ter-dark: #3a1b10; --w4ter-grain: .42;
    position: relative; isolation: isolate; overflow: hidden; background: var(--w4ter-clay); color: var(--w4ter-cream); font-family: ui-sans-serif, system-ui, sans-serif; }
  .w4ter-art { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
  .w4ter-sun { position: absolute; right: 8%; top: 12%; width: min(46vw, 420px); aspect-ratio: 1; border-radius: 50%; background: #e7a34d; }
  .w4ter-arch { position: absolute; right: 2%; bottom: -2px; width: min(58vw, 540px); height: 72%; border-radius: 999px 999px 0 0; background: #7c3119; }
  .w4ter-arch::after { content: ""; position: absolute; left: 22%; right: 22%; bottom: 0; height: 58%; border-radius: 999px 999px 0 0; background: var(--w4ter-dark); }
  .w4ter-fade { position: absolute; inset: 0; background: linear-gradient(90deg, var(--w4ter-clay) 0%, rgba(159, 69, 40, .92) 34%, rgba(159, 69, 40, 0) 62%); }
  /* grain: an SVG noise tile by default, swapped for a coarser canvas tile by the script */
  .w4ter-art::after { content: ""; position: absolute; inset: -140px; opacity: var(--w4ter-grain);
    background-image: var(--w4ter-tile, url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='t'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .2 0 0 0 0 .08 0 0 0 0 .03 0 0 0 2 -1'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23t)'/%3E%3C/svg%3E"));
    animation: w4ter-grain .5s steps(1) infinite; }
  .w4ter[data-w4ter-off] .w4ter-art::after { animation-play-state: paused; }
  @keyframes w4ter-grain { 0% { transform: translate(0, 0); } 20% { transform: translate(-53px, 41px); } 40% { transform: translate(37px, -67px); } 60% { transform: translate(-88px, -19px); } 80% { transform: translate(74px, 58px); } }
  .w4ter-inner { position: relative; max-width: 68rem; margin: 0 auto; padding: 72px 24px 80px; }
  .w4ter-tag { display: inline-block; padding: 7px 12px; border: 1.5px solid var(--w4ter-cream); border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
  .w4ter-title { margin: 26px 0 0; max-width: 11ch; font-size: clamp(48px, 9vw, 112px); font-weight: 800; line-height: .9; letter-spacing: -.035em; text-transform: uppercase; }
  .w4ter-copy { margin: 22px 0 0; max-width: 26rem; font-size: 17px; line-height: 1.6; color: #fbeedd; }
  .w4ter-facts { margin: 28px 0 0; padding: 0; list-style: none; display: grid; gap: 4px; font-size: 15px; font-weight: 600; }
  .w4ter-facts span { display: inline-block; min-width: 5.5em; font-weight: 500; color: #f7dcc0; }
  .w4ter-cta { display: inline-flex; align-items: center; min-height: 48px; margin-top: 30px; padding: 0 24px; border-radius: 999px; background: var(--w4ter-cream);
    color: var(--w4ter-dark); font-size: 15px; font-weight: 700; text-decoration: none; }
  .w4ter-cta:hover { background: #fff6ea; }
  .w4ter-cta:focus-visible { outline: 3px solid var(--w4ter-cream); outline-offset: 3px; }
  @media (max-width: 640px) { .w4ter-sun { right: -18%; top: 4%; opacity: .55; } .w4ter-arch { right: -30%; opacity: .5; } }
  @media (prefers-reduced-motion: reduce) { .w4ter-art::after { animation: none !important; } }
`;

/** Draws one tile of warm dark and pale specks and returns it as a CSS url(), or null if canvas is unavailable. */
function grainTile(): string | null {
  const c = document.createElement("canvas");
  c.width = c.height = TILE;
  const g = c.getContext("2d");
  if (!g) return null;
  for (let y = 0; y < TILE; y += CLUMP) {
    for (let x = 0; x < TILE; x += CLUMP) {
      if (Math.random() > SPECKS) continue;
      g.fillStyle = Math.random() < 0.6 ? `rgba(58,27,16,${(0.35 + Math.random() * 0.5).toFixed(2)})` : `rgba(255,240,220,${(0.2 + Math.random() * 0.4).toFixed(2)})`;
      g.fillRect(x, y, CLUMP, CLUMP);
    }
  }
  try { return `url(${c.toDataURL("image/png")})`; } catch { return null; }
}

export default function TerracottaPosterBlockWithCoarseCanvasGrain() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const tile = grainTile();
    if (tile) root.style.setProperty("--w4ter-tile", tile);
    // Pauses the grain while the poster is off screen.
    const io = new IntersectionObserver(([en]) => root.toggleAttribute("data-w4ter-off", !en.isIntersecting));
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef} className="w4ter">
      <style>{css}</style>
      <div className="w4ter-art" aria-hidden="true">
        <div className="w4ter-sun" />
        <div className="w4ter-arch" />
        <div className="w4ter-fade" />
      </div>
      <div className="w4ter-inner">
        <span className="w4ter-tag">Kiln Lane Pottery</span>
        <h2 className="w4ter-title">Open studio weekend</h2>
        <p className="w4ter-copy">Walk round the wheels and the kiln room, watch a firing being unpacked, and take home a seconds bowl straight off the shelf.</p>
        <ul className="w4ter-facts">
          <li><span>When</span>Sat 8 and Sun 9 November</li>
          <li><span>Hours</span>10:00 to 16:00</li>
          <li><span>Where</span>22 Tanner Lane, unit 4</li>
        </ul>
        <a href="#" className="w4ter-cta">Plan your visit</a>
      </div>
    </section>
  );
}

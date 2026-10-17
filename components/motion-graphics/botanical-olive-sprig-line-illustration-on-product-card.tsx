import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the leaf green and card colours at the top of .m4bot, and the leaf list in the source if you redraw the sprig.
const CSS = `
.m4bot { --m4bot-bg: #e9e3d3; --m4bot-card: #f6f2e7; --m4bot-ink: #24322a; --m4bot-quiet: #4f5b52; --m4bot-line: #d6cfbd; --m4bot-focus: #2f5a43; --m4bot-leaf: #2f5a43; --m4bot-fruit: #6b5a3a; }
.m4bot { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
.m4bot *, .m4bot *::before, .m4bot *::after { box-sizing: border-box; }
.m4bot svg { display: block; }
.m4bot .m4bot-s { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 0; }
.m4bot-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m4bot-line); border-radius: 999px; background: var(--m4bot-replaybg, transparent); color: var(--m4bot-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m4bot-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m4bot-replay:hover { color: var(--m4bot-ink); }
.m4bot-replay:focus-visible { outline: 2px solid var(--m4bot-focus); outline-offset: 2px; }
/* Hidden until the drawing starts, only when motion is allowed and the script is running. */
@media (prefers-reduced-motion: no-preference) {
  .m4bot.is-js:not([data-run]) .m4bot-s { stroke-dashoffset: 1; }
  .m4bot.is-js:not([data-run]) .m4bot-f { opacity: 0; }
}
.m4bot[data-run] .m4bot-s { animation: m4bot-draw .6s cubic-bezier(.5, .05, .3, 1) both; }
.m4bot[data-run] .m4bot-f { animation: m4bot-fade .5s ease-out both; }
.m4bot[data-run] .m4bot-slow { animation-duration: 1s; }
.m4bot[data-run] .m4bot-quick { animation-duration: .35s; }
@keyframes m4bot-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes m4bot-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
/* Paused while scrolled out of view. */
.m4bot[data-off] * { animation-play-state: paused !important; }
/* Reduced motion: the finished drawing, no movement. */
@media (prefers-reduced-motion: reduce) {
  .m4bot *, .m4bot *::before, .m4bot *::after { animation: none !important; transition: none !important; }
  .m4bot-replay { display: none; }
}

.m4bot { background: var(--m4bot-bg); color: var(--m4bot-ink); padding: 52px clamp(16px, 5vw, 56px) 76px; }
.m4bot-card { max-width: 920px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); background: var(--m4bot-card); border: 1px solid var(--m4bot-line); border-radius: 18px; overflow: hidden; box-shadow: 0 30px 60px -40px rgba(36, 50, 42, .5); }
.m4bot-plate { position: relative; padding: 28px 24px 44px; border-right: 1px solid var(--m4bot-line); }
.m4bot-art { width: 100%; max-width: 360px; height: auto; margin: 0 auto; }
.m4bot-art .m4bot-s { stroke: var(--m4bot-leaf); stroke-width: 1.8; }
.m4bot-art .m4bot-stem { stroke-width: 2.3; }
.m4bot-art .m4bot-rib { stroke-width: 1.1; opacity: .8; }
.m4bot-art .m4bot-twig { stroke-width: 1.5; }
.m4bot-art .m4bot-fruit { stroke: var(--m4bot-fruit); stroke-width: 1.7; }
.m4bot-latin { position: absolute; left: 0; right: 0; bottom: 18px; margin: 0; text-align: center; font-family: Georgia, "Times New Roman", serif; font-style: italic; font-size: 14px; color: var(--m4bot-quiet); }
.m4bot-body { padding: 44px 40px; align-self: center; }
.m4bot-eyebrow { margin: 0 0 12px; font-size: 12px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--m4bot-focus); }
.m4bot-h { margin: 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(30px, 3.6vw, 40px); line-height: 1.08; }
.m4bot-p { margin: 16px 0 0; font-size: 15.5px; line-height: 1.65; color: var(--m4bot-quiet); }
.m4bot-notes { margin: 20px 0 0; padding: 0; list-style: none; display: grid; gap: 8px; font-size: 14.5px; }
.m4bot-notes li { display: flex; gap: 10px; align-items: center; }
.m4bot-notes li::before { content: ""; width: 14px; height: 2px; background: var(--m4bot-leaf); flex: none; }
.m4bot-btn { display: inline-flex; align-items: center; min-height: 44px; margin-top: 26px; padding: 0 22px; border-radius: 999px; background: var(--m4bot-leaf); color: #f6f2e7; font-weight: 600; font-size: 14.5px; text-decoration: none; }
.m4bot-btn:hover { background: #24493a; }
.m4bot-btn:focus-visible { outline: 2px solid var(--m4bot-focus); outline-offset: 3px; }
@media (max-width: 720px) {
  .m4bot-card { grid-template-columns: 1fr; }
  .m4bot-plate { border-right: 0; border-bottom: 1px solid var(--m4bot-line); }
  .m4bot-art { max-width: 260px; }
  .m4bot-body { padding: 30px 24px 36px; }
}

.m4bot[data-run] .m4bot-t0 { animation-delay: 0.00s; }
.m4bot[data-run] .m4bot-t1 { animation-delay: 0.06s; }
.m4bot[data-run] .m4bot-t2 { animation-delay: 0.12s; }
.m4bot[data-run] .m4bot-t3 { animation-delay: 0.18s; }
.m4bot[data-run] .m4bot-t4 { animation-delay: 0.24s; }
.m4bot[data-run] .m4bot-t5 { animation-delay: 0.30s; }
.m4bot[data-run] .m4bot-t6 { animation-delay: 0.36s; }
.m4bot[data-run] .m4bot-t7 { animation-delay: 0.42s; }
.m4bot[data-run] .m4bot-t8 { animation-delay: 0.48s; }
.m4bot[data-run] .m4bot-t9 { animation-delay: 0.54s; }
.m4bot[data-run] .m4bot-t10 { animation-delay: 0.60s; }
.m4bot[data-run] .m4bot-t11 { animation-delay: 0.66s; }
.m4bot[data-run] .m4bot-t12 { animation-delay: 0.72s; }
.m4bot[data-run] .m4bot-t13 { animation-delay: 0.78s; }
.m4bot[data-run] .m4bot-t14 { animation-delay: 0.84s; }
.m4bot[data-run] .m4bot-t15 { animation-delay: 0.90s; }
.m4bot[data-run] .m4bot-t16 { animation-delay: 0.96s; }
.m4bot[data-run] .m4bot-t17 { animation-delay: 1.02s; }
.m4bot[data-run] .m4bot-t18 { animation-delay: 1.08s; }
.m4bot[data-run] .m4bot-t19 { animation-delay: 1.14s; }
.m4bot[data-run] .m4bot-t20 { animation-delay: 1.20s; }
.m4bot[data-run] .m4bot-t21 { animation-delay: 1.26s; }
.m4bot[data-run] .m4bot-t22 { animation-delay: 1.32s; }
.m4bot[data-run] .m4bot-t23 { animation-delay: 1.38s; }
.m4bot[data-run] .m4bot-t24 { animation-delay: 1.44s; }
.m4bot[data-run] .m4bot-t25 { animation-delay: 1.50s; }
.m4bot[data-run] .m4bot-t26 { animation-delay: 1.56s; }
.m4bot[data-run] .m4bot-t27 { animation-delay: 1.62s; }
.m4bot[data-run] .m4bot-t28 { animation-delay: 1.68s; }
.m4bot[data-run] .m4bot-t29 { animation-delay: 1.74s; }
.m4bot[data-run] .m4bot-t30 { animation-delay: 1.80s; }
.m4bot[data-run] .m4bot-t31 { animation-delay: 1.86s; }
.m4bot[data-run] .m4bot-t32 { animation-delay: 1.92s; }
.m4bot[data-run] .m4bot-t33 { animation-delay: 1.98s; }
.m4bot[data-run] .m4bot-t34 { animation-delay: 2.04s; }
.m4bot[data-run] .m4bot-t35 { animation-delay: 2.10s; }
.m4bot[data-run] .m4bot-t36 { animation-delay: 2.16s; }
.m4bot[data-run] .m4bot-t37 { animation-delay: 2.22s; }
.m4bot[data-run] .m4bot-t38 { animation-delay: 2.28s; }
.m4bot[data-run] .m4bot-t39 { animation-delay: 2.34s; }
`;

// Runs before paint in the browser so the drawing never flashes finished before it starts.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function BotanicalOliveSprigLineIllustrationOn() {
  const rootRef = useRef<HTMLElement>(null);

  // Draws once when the piece enters the view (works inside a scrolling box too) and pauses any loop when it leaves.
  // With prefers-reduced-motion the CSS shows the finished drawing and hides the Replay button.
  useBrowserLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.classList.add("is-js");
    const play = () => {
      root.removeAttribute("data-run");
      void root.offsetWidth; // restart the keyframes
      root.setAttribute("data-run", "");
    };
    const btn = root.querySelector(".m4bot-replay");
    btn?.addEventListener("click", play);
    if (typeof IntersectionObserver === "undefined") {
      play();
      return () => btn?.removeEventListener("click", play);
    }
    let seen = false;
    const io = new IntersectionObserver((entries) => {
      const on = entries[0].isIntersecting;
      root.toggleAttribute("data-off", !on);
      if (on && !seen) {
        seen = true;
        play();
      }
    }, { threshold: 0.2 });
    io.observe(root);
    return () => {
      io.disconnect();
      btn?.removeEventListener("click", play);
    };
  }, []);

  return (
    <section ref={rootRef} className="m4bot">
      <style>{CSS}</style>
<article className="m4bot-card">
  <div className="m4bot-plate">
    <svg className="m4bot-art" viewBox="0 0 420 470" aria-hidden="true" focusable="false">
      <path className="m4bot-s m4bot-t0 m4bot-slow m4bot-stem" d="M196 446C176 330 250 210 226 48" pathLength="1"/>
      <g>
        <path className="m4bot-s m4bot-t4 m4bot-leaf" d="M192.5 404.0C156.7 406.3 123.7 372.8 111.2 338.0C141.1 345.3 179.1 370.8 192.5 404.0" pathLength="1"/>
        <path className="m4bot-s m4bot-t9 m4bot-quick m4bot-rib" d="M187.3 400.6Q153.4 378.3 121.8 348.5" pathLength="1"/>
        <path className="m4bot-s m4bot-t5 m4bot-leaf" d="M193.7 375.6C228.7 379.1 265.0 355.7 282.4 332.1C248.1 329.7 206.9 345.5 193.7 375.6" pathLength="1"/>
        <path className="m4bot-s m4bot-t10 m4bot-quick m4bot-rib" d="M198.7 372.5Q232.9 354.9 269.2 337.0" pathLength="1"/>
        <path className="m4bot-s m4bot-t6 m4bot-leaf" d="M198.2 339.5C166.2 331.7 145.9 293.3 144.0 259.4C168.2 274.0 194.9 306.8 198.2 339.5" pathLength="1"/>
        <path className="m4bot-s m4bot-t11 m4bot-quick m4bot-rib" d="M194.5 335.1Q170.5 306.3 150.5 271.5" pathLength="1"/>
        <path className="m4bot-s m4bot-t8 m4bot-leaf" d="M203.4 309.9C236.3 313.3 270.3 291.2 286.5 268.9C254.2 266.6 215.6 281.5 203.4 309.9" pathLength="1"/>
        <path className="m4bot-s m4bot-t13 m4bot-quick m4bot-rib" d="M208.0 307.0Q240.1 290.5 274.1 273.5" pathLength="1"/>
        <path className="m4bot-s m4bot-t9 m4bot-leaf" d="M210.9 272.0C182.7 261.4 170.0 224.7 173.3 194.0C193.5 209.7 213.1 242.1 210.9 272.0" pathLength="1"/>
        <path className="m4bot-s m4bot-t14 m4bot-quick m4bot-rib" d="M208.2 267.6Q190.6 239.0 177.5 205.6" pathLength="1"/>
        <path className="m4bot-s m4bot-t10 m4bot-leaf" d="M217.1 240.7C247.1 240.2 275.8 216.9 288.5 195.2C259.1 196.5 225.6 213.9 217.1 240.7" pathLength="1"/>
        <path className="m4bot-s m4bot-t15 m4bot-quick m4bot-rib" d="M221.0 237.5Q248.5 219.3 277.7 200.6" pathLength="1"/>
        <path className="m4bot-s m4bot-t12 m4bot-leaf" d="M223.4 204.3C199.0 193.7 189.5 160.6 194.0 133.6C211.1 148.4 226.8 177.9 223.4 204.3" pathLength="1"/>
        <path className="m4bot-s m4bot-t17 m4bot-quick m4bot-rib" d="M221.2 200.3Q207.1 174.2 197.2 144.0" pathLength="1"/>
        <path className="m4bot-s m4bot-t13 m4bot-leaf" d="M227.8 170.8C252.9 166.2 272.6 142.5 279.0 122.4C254.7 127.6 229.9 147.0 227.8 170.8" pathLength="1"/>
        <path className="m4bot-s m4bot-t18 m4bot-quick m4bot-rib" d="M230.5 167.6Q250.2 148.4 271.1 128.5" pathLength="1"/>
        <path className="m4bot-s m4bot-t14 m4bot-leaf" d="M230.4 136.1C210.7 126.8 203.8 99.6 208.1 77.7C221.6 90.2 233.7 114.7 230.4 136.1" pathLength="1"/>
        <path className="m4bot-s m4bot-t19 m4bot-quick m4bot-rib" d="M228.7 132.7Q217.8 111.2 210.4 86.3" pathLength="1"/>
        <path className="m4bot-s m4bot-t15 m4bot-leaf" d="M230.7 104.6C248.9 96.2 258.7 74.6 259.0 58.1C241.7 66.9 227.1 86.3 230.7 104.6" pathLength="1"/>
        <path className="m4bot-s m4bot-t20 m4bot-quick m4bot-rib" d="M232.1 101.6Q242.9 83.4 254.4 64.3" pathLength="1"/>
        <path className="m4bot-s m4bot-t16 m4bot-leaf" d="M228.9 72.0C215.2 64.8 212.7 45.9 218.1 31.1C227.1 40.2 233.8 57.4 228.9 72.0" pathLength="1"/>
        <path className="m4bot-s m4bot-t21 m4bot-quick m4bot-rib" d="M228.0 69.6Q222.1 54.3 219.0 37.0" pathLength="1"/>
      </g>
      <path className="m4bot-s m4bot-t9 m4bot-twig" d="M207.1 291.1C219.1 293.1 233.1 301.1 237.1 313.1" pathLength="1"/>
      <ellipse className="m4bot-s m4bot-t13 m4bot-fruit" cx="238.6" cy="324.1" rx="8.5" ry="11.5" transform="rotate(-14 238.6 324.1)" pathLength="1"/>
      <path className="m4bot-s m4bot-t12 m4bot-twig" d="M220.0 224.7C208.0 226.7 194.0 234.7 190.0 246.7" pathLength="1"/>
      <ellipse className="m4bot-s m4bot-t16 m4bot-fruit" cx="188.5" cy="257.7" rx="8.5" ry="11.5" transform="rotate(14 188.5 257.7)" pathLength="1"/>
    </svg>
    <p className="m4bot-latin m4bot-f m4bot-t16">Olea europaea</p>
  </div>
  <div className="m4bot-body">
    <p className="m4bot-eyebrow">Grove Street Apothecary</p>
    <h2 className="m4bot-h">Olive Leaf Hand Balm</h2>
    <p className="m4bot-p">A soft balm of olive leaf, beeswax and a little lemon peel, poured by hand in small tins at the back of the shop on Grove Street.</p>
    <ul className="m4bot-notes">
      <li>Olive leaf infused oil</li>
      <li>Local beeswax</li>
      <li>Lemon peel</li>
    </ul>
    <a className="m4bot-btn" href="#">Read the ingredients</a>
  </div>
</article>
<button type="button" className="m4bot-replay" aria-label="Replay the drawing"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

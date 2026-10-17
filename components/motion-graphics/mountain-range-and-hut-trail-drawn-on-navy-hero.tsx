import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the navy, cream and trail colours at the top of .m4mtn, and the trail path if you move the huts.
const CSS = `
.m4mtn { --m4mtn-bg: #13213a; --m4mtn-ink: #f1e9d8; --m4mtn-quiet: #c3c8d2; --m4mtn-line: #34446a; --m4mtn-focus: #e3a95b; --m4mtn-trail: #e3a95b; --m4mtn-replaybg: #13213a; }
.m4mtn { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
.m4mtn *, .m4mtn *::before, .m4mtn *::after { box-sizing: border-box; }
.m4mtn svg { display: block; }
.m4mtn .m4mtn-s { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 0; }
.m4mtn-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m4mtn-line); border-radius: 999px; background: var(--m4mtn-replaybg, transparent); color: var(--m4mtn-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m4mtn-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m4mtn-replay:hover { color: var(--m4mtn-ink); }
.m4mtn-replay:focus-visible { outline: 2px solid var(--m4mtn-focus); outline-offset: 2px; }
/* Hidden until the drawing starts, only when motion is allowed and the script is running. */
@media (prefers-reduced-motion: no-preference) {
  .m4mtn.is-js:not([data-run]) .m4mtn-s { stroke-dashoffset: 1; }
  .m4mtn.is-js:not([data-run]) .m4mtn-f { opacity: 0; }
}
.m4mtn[data-run] .m4mtn-s { animation: m4mtn-draw .6s cubic-bezier(.5, .05, .3, 1) both; }
.m4mtn[data-run] .m4mtn-f { animation: m4mtn-fade .5s ease-out both; }
.m4mtn[data-run] .m4mtn-slow { animation-duration: 1s; }
.m4mtn[data-run] .m4mtn-quick { animation-duration: .35s; }
@keyframes m4mtn-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes m4mtn-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
/* Paused while scrolled out of view. */
.m4mtn[data-off] * { animation-play-state: paused !important; }
/* Reduced motion: the finished drawing, no movement. */
@media (prefers-reduced-motion: reduce) {
  .m4mtn *, .m4mtn *::before, .m4mtn *::after { animation: none !important; transition: none !important; }
  .m4mtn-replay { display: none; }
}

.m4mtn { background: var(--m4mtn-bg); color: var(--m4mtn-ink); padding: 56px 0 76px; }
.m4mtn-head { max-width: 1000px; margin: 0 auto; padding: 0 clamp(20px, 5vw, 48px); }
.m4mtn-eyebrow { margin: 0 0 12px; font-size: 12px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--m4mtn-trail); }
.m4mtn-h { margin: 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(36px, 5.5vw, 60px); line-height: 1.02; letter-spacing: -.015em; }
.m4mtn-p { margin: 16px 0 0; max-width: 34em; font-size: 16.5px; line-height: 1.6; color: var(--m4mtn-quiet); }
.m4mtn-btn { display: inline-flex; align-items: center; min-height: 44px; margin-top: 22px; padding: 0 22px; border-radius: 999px; background: var(--m4mtn-ink); color: var(--m4mtn-bg); font-weight: 650; font-size: 14.5px; text-decoration: none; }
.m4mtn-btn:focus-visible { outline: 2px solid var(--m4mtn-focus); outline-offset: 3px; }
.m4mtn-art { width: 100%; height: clamp(250px, 32vw, 360px); margin-top: -10px; }
.m4mtn-art .m4mtn-s { stroke: var(--m4mtn-ink); }
.m4mtn-art .m4mtn-bgfill { fill: var(--m4mtn-bg); }
.m4mtn-art .m4mtn-far { stroke-width: 1.3; opacity: .4; }
.m4mtn-art .m4mtn-mid { stroke-width: 1.7; opacity: .7; }
.m4mtn-art .m4mtn-near { stroke-width: 2.2; }
.m4mtn-art .m4mtn-hatch { stroke-width: 1.2; opacity: .55; }
.m4mtn-art .m4mtn-sun { stroke: var(--m4mtn-trail); stroke-width: 1.6; }
.m4mtn-art .m4mtn-cloud { stroke-width: 1.4; opacity: .6; }
.m4mtn-art .m4mtn-trail { stroke: var(--m4mtn-trail); stroke-width: 2.4; }
.m4mtn-art .m4mtn-mk { fill: var(--m4mtn-bg); stroke: var(--m4mtn-trail); stroke-width: 2; }
.m4mtn-art text { font-family: inherit; font-size: 13px; font-weight: 700; fill: var(--m4mtn-trail); text-anchor: middle; }
.m4mtn-legend { max-width: 1000px; margin: 8px auto 0; padding: 18px clamp(20px, 5vw, 48px) 0; list-style: none; display: flex; flex-wrap: wrap; gap: 12px 32px; border-top: 1px solid var(--m4mtn-line); font-size: 15px; }
.m4mtn-legend li { display: flex; align-items: center; gap: 10px; }
.m4mtn-legend span { width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid var(--m4mtn-trail); display: grid; place-items: center; font-size: 12px; font-weight: 700; color: var(--m4mtn-trail); }
.m4mtn-legend em { font-style: normal; color: var(--m4mtn-quiet); font-size: 13.5px; }

.m4mtn[data-run] .m4mtn-t0 { animation-delay: 0.00s; }
.m4mtn[data-run] .m4mtn-t1 { animation-delay: 0.04s; }
.m4mtn[data-run] .m4mtn-t2 { animation-delay: 0.09s; }
.m4mtn[data-run] .m4mtn-t3 { animation-delay: 0.14s; }
.m4mtn[data-run] .m4mtn-t4 { animation-delay: 0.18s; }
.m4mtn[data-run] .m4mtn-t5 { animation-delay: 0.22s; }
.m4mtn[data-run] .m4mtn-t6 { animation-delay: 0.27s; }
.m4mtn[data-run] .m4mtn-t7 { animation-delay: 0.32s; }
.m4mtn[data-run] .m4mtn-t8 { animation-delay: 0.36s; }
.m4mtn[data-run] .m4mtn-t9 { animation-delay: 0.40s; }
.m4mtn[data-run] .m4mtn-t10 { animation-delay: 0.45s; }
.m4mtn[data-run] .m4mtn-t11 { animation-delay: 0.49s; }
.m4mtn[data-run] .m4mtn-t12 { animation-delay: 0.54s; }
.m4mtn[data-run] .m4mtn-t13 { animation-delay: 0.58s; }
.m4mtn[data-run] .m4mtn-t14 { animation-delay: 0.63s; }
.m4mtn[data-run] .m4mtn-t15 { animation-delay: 0.67s; }
.m4mtn[data-run] .m4mtn-t16 { animation-delay: 0.72s; }
.m4mtn[data-run] .m4mtn-t17 { animation-delay: 0.77s; }
.m4mtn[data-run] .m4mtn-t18 { animation-delay: 0.81s; }
.m4mtn[data-run] .m4mtn-t19 { animation-delay: 0.85s; }
.m4mtn[data-run] .m4mtn-t20 { animation-delay: 0.90s; }
.m4mtn[data-run] .m4mtn-t21 { animation-delay: 0.94s; }
.m4mtn[data-run] .m4mtn-t22 { animation-delay: 0.99s; }
.m4mtn[data-run] .m4mtn-t23 { animation-delay: 1.03s; }
.m4mtn[data-run] .m4mtn-t24 { animation-delay: 1.08s; }
.m4mtn[data-run] .m4mtn-t25 { animation-delay: 1.12s; }
.m4mtn[data-run] .m4mtn-t26 { animation-delay: 1.17s; }
.m4mtn[data-run] .m4mtn-t27 { animation-delay: 1.21s; }
.m4mtn[data-run] .m4mtn-t28 { animation-delay: 1.26s; }
.m4mtn[data-run] .m4mtn-t29 { animation-delay: 1.30s; }
.m4mtn[data-run] .m4mtn-t30 { animation-delay: 1.35s; }
.m4mtn[data-run] .m4mtn-t31 { animation-delay: 1.40s; }
.m4mtn[data-run] .m4mtn-t32 { animation-delay: 1.44s; }
.m4mtn[data-run] .m4mtn-t33 { animation-delay: 1.48s; }
.m4mtn[data-run] .m4mtn-t34 { animation-delay: 1.53s; }
.m4mtn[data-run] .m4mtn-t35 { animation-delay: 1.57s; }
.m4mtn[data-run] .m4mtn-t36 { animation-delay: 1.62s; }
.m4mtn[data-run] .m4mtn-t37 { animation-delay: 1.67s; }
.m4mtn[data-run] .m4mtn-t38 { animation-delay: 1.71s; }
.m4mtn[data-run] .m4mtn-t39 { animation-delay: 1.75s; }
`;

// Runs before paint in the browser so the drawing never flashes finished before it starts.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function MountainRangeAndHutTrailDrawn() {
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
    const btn = root.querySelector(".m4mtn-replay");
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
    <section ref={rootRef} className="m4mtn">
      <style>{CSS}</style>
<div className="m4mtn-head">
  <p className="m4mtn-eyebrow">Hut-to-hut route · Glen Ardnish</p>
  <h2 className="m4mtn-h">The Corrie Way</h2>
  <p className="m4mtn-p">Three days on foot from Ardnish Hut over the Coire saddle to the summit cairn, with a night in the stone bothy on the way.</p>
  <a className="m4mtn-btn" href="#">Plan the route</a>
</div>
<svg className="m4mtn-art" viewBox="0 0 1000 360" preserveAspectRatio="xMidYMax slice" role="img" aria-label="Line drawing of the mountain range with the trail climbing from Ardnish Hut, past Coire Bothy, to the summit cairn" focusable="false">
  <circle className="m4mtn-s m4mtn-t4 m4mtn-sun" cx="806" cy="118" r="22" pathLength="1" transform="rotate(-90 806 118)"/>
  <path className="m4mtn-s m4mtn-t9 m4mtn-cloud" d="M736 130H788M756 140H826M776 121H796" pathLength="1"/>
  <path className="m4mtn-s m4mtn-t0 m4mtn-slow m4mtn-far" d="M0 226L40 214L70 200L92 204L130 186L160 194L200 170L240 150L262 160L290 166L320 150L352 136L380 120L404 134L430 148L452 156L480 144L520 134L548 150L580 168L612 160L650 134L690 110L712 124L740 140L770 150L810 138L850 128L880 146L920 162L960 154L1000 146" pathLength="1"/>
  <path className="m4mtn-bgfill" d="M0 282L50 262L90 246L120 232L150 240L200 250L240 228L270 210L300 196L326 206L360 214L392 196L430 172L452 160L470 150L494 166L516 180L540 190L572 178L610 172L650 196L700 226L740 214L770 200L800 192L840 206L880 228L910 234L950 222L1000 214L1000 360H0Z"/>
  <path className="m4mtn-s m4mtn-t3 m4mtn-slow m4mtn-mid" d="M0 282L50 262L90 246L120 232L150 240L200 250L240 228L270 210L300 196L326 206L360 214L392 196L430 172L452 160L470 150L494 166L516 180L540 190L572 178L610 172L650 196L700 226L740 214L770 200L800 192L840 206L880 228L910 234L950 222L1000 214" pathLength="1"/>
  <path className="m4mtn-bgfill" d="M0 332C60 316 140 304 232 296C268 286 300 272 330 262C356 268 390 282 420 286C450 270 486 246 520 236C548 248 572 262 600 270C680 292 760 302 1000 312L1000 360H0Z"/>
  <path className="m4mtn-s m4mtn-t6 m4mtn-slow m4mtn-near" d="M0 332C60 316 140 304 232 296C268 286 300 272 330 262C356 268 390 282 420 286C450 270 486 246 520 236C548 248 572 262 600 270C680 292 760 302 1000 312" pathLength="1"/>
  <path className="m4mtn-s m4mtn-t12 m4mtn-quick m4mtn-hatch" d="M486 164L478 182M500 172L492 190M514 180L507 196M528 186L522 200" pathLength="1"/>
  <path className="m4mtn-s m4mtn-t13 m4mtn-quick m4mtn-hatch" d="M314 202L308 216M328 206L323 220M342 210L338 222" pathLength="1"/>
  <path className="m4mtn-s m4mtn-t14 m4mtn-quick m4mtn-hatch" d="M708 120L700 136M722 126L715 142M736 134L730 148" pathLength="1"/>
  <path className="m4mtn-s m4mtn-t15 m4mtn-quick m4mtn-hatch" d="M540 244L533 258M556 252L550 264M572 258L567 268" pathLength="1"/>
  <path className="m4mtn-s m4mtn-t8 m4mtn-slow m4mtn-trail" d="M190 352C226 334 256 320 290 304C318 291 304 280 334 266C356 256 342 238 362 222C388 206 418 198 432 182C444 170 452 166 466 155" pathLength="1"/>
  <g className="m4mtn-f m4mtn-t11"><circle className="m4mtn-mk" cx="334" cy="266" r="11"/><text x="334" y="270.5">1</text></g>
  <g className="m4mtn-f m4mtn-t17"><circle className="m4mtn-mk" cx="362" cy="222" r="11"/><text x="362" y="226.5">2</text></g>
  <g className="m4mtn-f m4mtn-t23"><circle className="m4mtn-mk" cx="469" cy="151" r="11"/><text x="469" y="155.5">3</text></g>
</svg>
<ol className="m4mtn-legend">
  <li><span>1</span>Ardnish Hut <em>Day 1</em></li>
  <li><span>2</span>Coire Bothy <em>Day 2</em></li>
  <li><span>3</span>Summit cairn <em>Day 3</em></li>
</ol>
<button type="button" className="m4mtn-replay" aria-label="Replay the drawing"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

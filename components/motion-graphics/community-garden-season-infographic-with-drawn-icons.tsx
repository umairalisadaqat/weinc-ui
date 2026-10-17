import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the green and cream colours at the top of .m6inf, the three figures and their labels, and the icon paths.
const CSS = `
.m6inf { --m6inf-bg: #1e3a2d; --m6inf-card: #244434; --m6inf-ink: #f4efe2; --m6inf-quiet: #c4d0c4; --m6inf-line: #3e5d4c; --m6inf-focus: #f4efe2; --m6inf-icon: #e9c983; }
.m6inf { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; font-variant-numeric: tabular-nums; }
.m6inf *, .m6inf *::before, .m6inf *::after { box-sizing: border-box; }
.m6inf svg { display: block; overflow: visible; }
.m6inf-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.m6inf-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m6inf-line); border-radius: 999px; background: transparent; color: var(--m6inf-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m6inf-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m6inf-replay:hover { color: var(--m6inf-ink); }
.m6inf-replay:focus-visible { outline: 2px solid var(--m6inf-focus); outline-offset: 2px; }
/* Start state, only when motion is allowed and the script is running, so the chart is never blank without it. */
@media (prefers-reduced-motion: no-preference) {
  .m6inf.is-js:not([data-run]) .m6inf-gy { transform: scaleY(0); }
  .m6inf.is-js:not([data-run]) .m6inf-gx { transform: scaleX(0); }
  .m6inf.is-js:not([data-run]) .m6inf-f { opacity: 0; }
  .m6inf.is-js:not([data-run]) .m6inf-o { opacity: 0; }
  .m6inf.is-js:not([data-run]) .m6inf-d { stroke-dashoffset: var(--m6inf-len, 1); }
  .m6inf.is-js:not([data-run]) .m6inf-pop { opacity: 0; }
}
.m6inf[data-run] .m6inf-gy { animation: m6inf-gy .75s cubic-bezier(.2, .75, .25, 1) both; }
.m6inf[data-run] .m6inf-gx { animation: m6inf-gx .75s cubic-bezier(.2, .75, .25, 1) both; }
.m6inf[data-run] .m6inf-f { animation: m6inf-f .45s ease-out both; }
.m6inf[data-run] .m6inf-o { animation: m6inf-o .6s ease-out both; }
.m6inf[data-run] .m6inf-d { animation: m6inf-d .7s cubic-bezier(.45, .05, .3, 1) both; }
.m6inf[data-run] .m6inf-pop { animation: m6inf-pop .4s cubic-bezier(.2, .8, .3, 1.2) both; }
@keyframes m6inf-gy { from { transform: scaleY(0); } to { transform: none; } }
@keyframes m6inf-gx { from { transform: scaleX(0); } to { transform: none; } }
@keyframes m6inf-f { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@keyframes m6inf-o { from { opacity: 0; } to { opacity: 1; } }
@keyframes m6inf-d { from { stroke-dashoffset: var(--m6inf-len, 1); } to { stroke-dashoffset: 0; } }
@keyframes m6inf-pop { from { opacity: 0; transform: scale(.3); } to { opacity: 1; transform: none; } }
/* Paused while scrolled out of view. */
.m6inf[data-off] * { animation-play-state: paused !important; }
/* Reduced motion: the finished chart at its values, nothing moves. */
@media (prefers-reduced-motion: reduce) {
  .m6inf *, .m6inf *::before, .m6inf *::after { animation: none !important; transition: none !important; }
  .m6inf-replay { display: none; }
}

.m6inf { background: var(--m6inf-bg); color: var(--m6inf-ink); padding: 56px clamp(18px, 5vw, 64px) 84px; }
.m6inf-wrap { max-width: 1000px; margin: 0 auto; }
.m6inf-eyebrow { margin: 0 0 10px; font-size: 12px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--m6inf-icon); }
.m6inf-h { margin: 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(28px, 4vw, 42px); line-height: 1.1; letter-spacing: -.01em; }
.m6inf-stats { list-style: none; margin: 36px 0 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid var(--m6inf-line); }
.m6inf-stat { padding: 28px 28px 8px 0; }
.m6inf-stat + .m6inf-stat { padding-left: 28px; border-left: 1px solid var(--m6inf-line); }
.m6inf-ic { width: 48px; height: 48px; }
.m6inf-ic path { fill: none; stroke: var(--m6inf-icon); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 0; }
.m6inf-num { margin: 18px 0 0; font-family: Georgia, "Times New Roman", serif; font-size: clamp(44px, 6vw, 64px); line-height: 1; letter-spacing: -.02em; }
.m6inf-num small { font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; font-size: .36em; letter-spacing: 0; color: var(--m6inf-quiet); }
.m6inf-lab { margin: 10px 0 0; font-size: 15px; line-height: 1.5; color: var(--m6inf-quiet); max-width: 18em; }
.m6inf-cap { margin: 30px 0 0; padding-top: 14px; border-top: 1px solid var(--m6inf-line); font-size: 12.5px; color: var(--m6inf-quiet); padding-right: 110px; }
.m6inf .m6inf-replay { color: var(--m6inf-quiet); }
@media (max-width: 700px) {
  .m6inf-stats { grid-template-columns: 1fr; }
  .m6inf-stat, .m6inf-stat + .m6inf-stat { padding: 22px 0; border-left: 0; display: grid; grid-template-columns: 48px 1fr; column-gap: 18px; align-items: start; }
  .m6inf-stat + .m6inf-stat { border-top: 1px solid var(--m6inf-line); }
  .m6inf-num { margin: 0; grid-column: 2; grid-row: 1; }
  .m6inf-lab { grid-column: 2; }
}

.m6inf[data-run] .m6inf-t0 { animation-delay: 0.00s; }
.m6inf[data-run] .m6inf-t1 { animation-delay: 0.08s; }
.m6inf[data-run] .m6inf-t2 { animation-delay: 0.16s; }
.m6inf[data-run] .m6inf-t3 { animation-delay: 0.24s; }
.m6inf[data-run] .m6inf-t4 { animation-delay: 0.32s; }
.m6inf[data-run] .m6inf-t5 { animation-delay: 0.40s; }
.m6inf[data-run] .m6inf-t6 { animation-delay: 0.48s; }
.m6inf[data-run] .m6inf-t7 { animation-delay: 0.56s; }
.m6inf[data-run] .m6inf-t8 { animation-delay: 0.64s; }
.m6inf[data-run] .m6inf-t9 { animation-delay: 0.72s; }
.m6inf[data-run] .m6inf-t10 { animation-delay: 0.80s; }
.m6inf[data-run] .m6inf-t11 { animation-delay: 0.88s; }
.m6inf[data-run] .m6inf-t12 { animation-delay: 0.96s; }
.m6inf[data-run] .m6inf-t13 { animation-delay: 1.04s; }
.m6inf[data-run] .m6inf-t14 { animation-delay: 1.12s; }
.m6inf[data-run] .m6inf-t15 { animation-delay: 1.20s; }
.m6inf[data-run] .m6inf-t16 { animation-delay: 1.28s; }
.m6inf[data-run] .m6inf-t17 { animation-delay: 1.36s; }
.m6inf[data-run] .m6inf-t18 { animation-delay: 1.44s; }
.m6inf[data-run] .m6inf-t19 { animation-delay: 1.52s; }
.m6inf[data-run] .m6inf-t20 { animation-delay: 1.60s; }
.m6inf[data-run] .m6inf-t21 { animation-delay: 1.68s; }
.m6inf[data-run] .m6inf-t22 { animation-delay: 1.76s; }
.m6inf[data-run] .m6inf-t23 { animation-delay: 1.84s; }
.m6inf[data-run] .m6inf-t24 { animation-delay: 1.92s; }
.m6inf[data-run] .m6inf-t25 { animation-delay: 2.00s; }
.m6inf[data-run] .m6inf-t26 { animation-delay: 2.08s; }
.m6inf[data-run] .m6inf-t27 { animation-delay: 2.16s; }
.m6inf[data-run] .m6inf-t28 { animation-delay: 2.24s; }
.m6inf[data-run] .m6inf-t29 { animation-delay: 2.32s; }
.m6inf[data-run] .m6inf-t30 { animation-delay: 2.40s; }
.m6inf[data-run] .m6inf-t31 { animation-delay: 2.48s; }
.m6inf[data-run] .m6inf-t32 { animation-delay: 2.56s; }
.m6inf[data-run] .m6inf-t33 { animation-delay: 2.64s; }
.m6inf[data-run] .m6inf-t34 { animation-delay: 2.72s; }
.m6inf[data-run] .m6inf-t35 { animation-delay: 2.80s; }
`;

// Runs before paint in the browser so the chart never flashes finished before it plays.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function CommunityGardenSeasonInfographicWithDrawn() {
  const rootRef = useRef<HTMLElement>(null);

  // Plays once when the piece enters the view (works inside a scrolling box too) and pauses any loop when it leaves.
  // With prefers-reduced-motion the CSS shows the finished chart and hides the Replay button.
  useBrowserLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.classList.add("is-js");
    const play = () => {
      root.removeAttribute("data-run");
      void root.offsetWidth; // restart the keyframes
      root.setAttribute("data-run", "");
    };
    const btn = root.querySelector(".m6inf-replay");
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
    <section ref={rootRef} className="m6inf">
      <style>{CSS}</style>
<div className="m6inf-wrap">
  <div className="m6inf-head">
    <p className="m6inf-eyebrow">Alder Street Growers</p>
    <h2 className="m6inf-h">The 2026 season in three numbers</h2>
  </div>
  <ul className="m6inf-stats">
    <li className="m6inf-stat">
      <svg className="m6inf-ic" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path className="m6inf-d m6inf-t0" d="M6 40H42" pathLength="1"/>
        <path className="m6inf-d m6inf-t1" d="M24 40V20" pathLength="1"/>
        <path className="m6inf-d m6inf-t2" d="M24 26C24 18 18 13 10 13C10 21 16 26 24 26Z" pathLength="1"/>
        <path className="m6inf-d m6inf-t3" d="M24 21C24 12 30 7 38 7C38 15 32 21 24 21Z" pathLength="1"/>
      </svg>
      <p className="m6inf-num m6inf-f m6inf-t4">42</p>
      <p className="m6inf-lab m6inf-f m6inf-t5">plots tended by members across the two allotment fields</p>
    </li>
    <li className="m6inf-stat">
      <svg className="m6inf-ic" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path className="m6inf-d m6inf-t3" d="M6 20H42L38 40H10Z" pathLength="1"/>
        <path className="m6inf-d m6inf-t4" d="M14 20C14 12 18.5 7 24 7C29.5 7 34 12 34 20" pathLength="1"/>
        <path className="m6inf-d m6inf-t5" d="M18 26V34M24 26V34M30 26V34" pathLength="1"/>
      </svg>
      <p className="m6inf-num m6inf-f m6inf-t7">1,180 <small>kg</small></p>
      <p className="m6inf-lab m6inf-f m6inf-t8">of fruit and vegetables weighed in at the shared table</p>
    </li>
    <li className="m6inf-stat">
      <svg className="m6inf-ic" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path className="m6inf-d m6inf-t6" d="M8 12H40V40H8Z" pathLength="1"/>
        <path className="m6inf-d m6inf-t7" d="M8 20H40M16 7V15M32 7V15" pathLength="1"/>
        <path className="m6inf-d m6inf-t8" d="M17 30L22 35L32 25" pathLength="1"/>
      </svg>
      <p className="m6inf-num m6inf-f m6inf-t10">36</p>
      <p className="m6inf-lab m6inf-f m6inf-t11">volunteer days for paths, compost bays and the new pond</p>
    </li>
  </ul>
  <p className="m6inf-cap">Sample figures for an invented community garden, March to October.</p>
</div>
<button type="button" className="m6inf-replay" aria-label="Replay the infographic"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

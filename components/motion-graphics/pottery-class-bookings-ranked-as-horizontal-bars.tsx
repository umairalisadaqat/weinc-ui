import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the bar colours at the top of .m6rnk, the --v value on each .m6rnk-r rule and --m6rnk-max (the value that fills a whole track).
const CSS = `
.m6rnk { --m6rnk-bg: #e9edf2; --m6rnk-card: #ffffff; --m6rnk-ink: #17222f; --m6rnk-quiet: #4c5a69; --m6rnk-line: #dce2e9; --m6rnk-focus: #23395b; --m6rnk-bar: #9fb1c7; --m6rnk-hi: #23395b; --m6rnk-max: 72; }
.m6rnk { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; font-variant-numeric: tabular-nums; }
.m6rnk *, .m6rnk *::before, .m6rnk *::after { box-sizing: border-box; }
.m6rnk svg { display: block; overflow: visible; }
.m6rnk-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.m6rnk-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m6rnk-line); border-radius: 999px; background: transparent; color: var(--m6rnk-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m6rnk-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m6rnk-replay:hover { color: var(--m6rnk-ink); }
.m6rnk-replay:focus-visible { outline: 2px solid var(--m6rnk-focus); outline-offset: 2px; }
/* Start state, only when motion is allowed and the script is running, so the chart is never blank without it. */
@media (prefers-reduced-motion: no-preference) {
  .m6rnk.is-js:not([data-run]) .m6rnk-gy { transform: scaleY(0); }
  .m6rnk.is-js:not([data-run]) .m6rnk-gx { transform: scaleX(0); }
  .m6rnk.is-js:not([data-run]) .m6rnk-f { opacity: 0; }
  .m6rnk.is-js:not([data-run]) .m6rnk-o { opacity: 0; }
  .m6rnk.is-js:not([data-run]) .m6rnk-d { stroke-dashoffset: var(--m6rnk-len, 1); }
  .m6rnk.is-js:not([data-run]) .m6rnk-pop { opacity: 0; }
}
.m6rnk[data-run] .m6rnk-gy { animation: m6rnk-gy .75s cubic-bezier(.2, .75, .25, 1) both; }
.m6rnk[data-run] .m6rnk-gx { animation: m6rnk-gx .75s cubic-bezier(.2, .75, .25, 1) both; }
.m6rnk[data-run] .m6rnk-f { animation: m6rnk-f .45s ease-out both; }
.m6rnk[data-run] .m6rnk-o { animation: m6rnk-o .6s ease-out both; }
.m6rnk[data-run] .m6rnk-d { animation: m6rnk-d .7s cubic-bezier(.45, .05, .3, 1) both; }
.m6rnk[data-run] .m6rnk-pop { animation: m6rnk-pop .4s cubic-bezier(.2, .8, .3, 1.2) both; }
@keyframes m6rnk-gy { from { transform: scaleY(0); } to { transform: none; } }
@keyframes m6rnk-gx { from { transform: scaleX(0); } to { transform: none; } }
@keyframes m6rnk-f { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@keyframes m6rnk-o { from { opacity: 0; } to { opacity: 1; } }
@keyframes m6rnk-d { from { stroke-dashoffset: var(--m6rnk-len, 1); } to { stroke-dashoffset: 0; } }
@keyframes m6rnk-pop { from { opacity: 0; transform: scale(.3); } to { opacity: 1; transform: none; } }
/* Paused while scrolled out of view. */
.m6rnk[data-off] * { animation-play-state: paused !important; }
/* Reduced motion: the finished chart at its values, nothing moves. */
@media (prefers-reduced-motion: reduce) {
  .m6rnk *, .m6rnk *::before, .m6rnk *::after { animation: none !important; transition: none !important; }
  .m6rnk-replay { display: none; }
}

.m6rnk { background: var(--m6rnk-bg); color: var(--m6rnk-ink); padding: 48px clamp(16px, 4vw, 48px) 80px; }
.m6rnk-card { max-width: 860px; margin: 0 auto; padding: 32px clamp(18px, 4vw, 40px) 26px; background: var(--m6rnk-card); border: 1px solid var(--m6rnk-line); border-radius: 12px; box-shadow: 0 26px 48px -36px rgba(23, 34, 47, .45); }
.m6rnk-head { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px 32px; align-items: end; }
.m6rnk-eyebrow { margin: 0 0 8px; font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--m6rnk-quiet); }
.m6rnk-h { margin: 0; font-size: clamp(24px, 3vw, 30px); font-weight: 650; letter-spacing: -.015em; line-height: 1.15; }
.m6rnk-lede { margin: 0; font-size: 15px; line-height: 1.55; color: var(--m6rnk-quiet); }
.m6rnk-fig { margin: 28px 0 0; }
.m6rnk-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.m6rnk-row { display: grid; grid-template-columns: 30px minmax(0, 220px) minmax(0, 1fr); align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid var(--m6rnk-line); }
.m6rnk-row:first-child { border-top: 0; }
.m6rnk-num { font-size: 12px; font-weight: 600; color: var(--m6rnk-quiet); letter-spacing: .04em; }
.m6rnk-name { font-size: 15px; font-weight: 500; }
.m6rnk-track { position: relative; display: flex; align-items: center; gap: 10px; height: 28px; }
.m6rnk-bar { display: block; height: 100%; width: calc(var(--v) / var(--m6rnk-max) * (100% - 40px)); background: var(--m6rnk-bar); border-radius: 0 6px 6px 0; transform-origin: 0 50%; }
.m6rnk-r0 .m6rnk-bar { background: var(--m6rnk-hi); }
.m6rnk-val { font-size: 15px; font-weight: 650; }
.m6rnk-cap { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--m6rnk-line); font-size: 12.5px; color: var(--m6rnk-quiet); padding-right: 96px; }
@media (max-width: 620px) {
  .m6rnk-head { grid-template-columns: 1fr; }
  .m6rnk-row { grid-template-columns: 26px minmax(0, 1fr); row-gap: 6px; }
  .m6rnk-track { grid-column: 2; height: 22px; }
}
.m6rnk-r0 { --v: 64; }
.m6rnk-r1 { --v: 51; }
.m6rnk-r2 { --v: 38; }
.m6rnk-r3 { --v: 33; }
.m6rnk-r4 { --v: 19; }
.m6rnk[data-run] .m6rnk-t0 { animation-delay: 0.00s; }
.m6rnk[data-run] .m6rnk-t1 { animation-delay: 0.09s; }
.m6rnk[data-run] .m6rnk-t2 { animation-delay: 0.18s; }
.m6rnk[data-run] .m6rnk-t3 { animation-delay: 0.27s; }
.m6rnk[data-run] .m6rnk-t4 { animation-delay: 0.36s; }
.m6rnk[data-run] .m6rnk-t5 { animation-delay: 0.45s; }
.m6rnk[data-run] .m6rnk-t6 { animation-delay: 0.54s; }
.m6rnk[data-run] .m6rnk-t7 { animation-delay: 0.63s; }
.m6rnk[data-run] .m6rnk-t8 { animation-delay: 0.72s; }
.m6rnk[data-run] .m6rnk-t9 { animation-delay: 0.81s; }
.m6rnk[data-run] .m6rnk-t10 { animation-delay: 0.90s; }
.m6rnk[data-run] .m6rnk-t11 { animation-delay: 0.99s; }
.m6rnk[data-run] .m6rnk-t12 { animation-delay: 1.08s; }
.m6rnk[data-run] .m6rnk-t13 { animation-delay: 1.17s; }
.m6rnk[data-run] .m6rnk-t14 { animation-delay: 1.26s; }
.m6rnk[data-run] .m6rnk-t15 { animation-delay: 1.35s; }
.m6rnk[data-run] .m6rnk-t16 { animation-delay: 1.44s; }
.m6rnk[data-run] .m6rnk-t17 { animation-delay: 1.53s; }
.m6rnk[data-run] .m6rnk-t18 { animation-delay: 1.62s; }
.m6rnk[data-run] .m6rnk-t19 { animation-delay: 1.71s; }
.m6rnk[data-run] .m6rnk-t20 { animation-delay: 1.80s; }
.m6rnk[data-run] .m6rnk-t21 { animation-delay: 1.89s; }
.m6rnk[data-run] .m6rnk-t22 { animation-delay: 1.98s; }
.m6rnk[data-run] .m6rnk-t23 { animation-delay: 2.07s; }
.m6rnk[data-run] .m6rnk-t24 { animation-delay: 2.16s; }
.m6rnk[data-run] .m6rnk-t25 { animation-delay: 2.25s; }
.m6rnk[data-run] .m6rnk-t26 { animation-delay: 2.34s; }
.m6rnk[data-run] .m6rnk-t27 { animation-delay: 2.43s; }
.m6rnk[data-run] .m6rnk-t28 { animation-delay: 2.52s; }
.m6rnk[data-run] .m6rnk-t29 { animation-delay: 2.61s; }
.m6rnk[data-run] .m6rnk-t30 { animation-delay: 2.70s; }
.m6rnk[data-run] .m6rnk-t31 { animation-delay: 2.79s; }
.m6rnk[data-run] .m6rnk-t32 { animation-delay: 2.88s; }
.m6rnk[data-run] .m6rnk-t33 { animation-delay: 2.97s; }
.m6rnk[data-run] .m6rnk-t34 { animation-delay: 3.06s; }
.m6rnk[data-run] .m6rnk-t35 { animation-delay: 3.15s; }
`;

// Runs before paint in the browser so the chart never flashes finished before it plays.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function PotteryClassBookingsRankedAsHorizontal() {
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
    const btn = root.querySelector(".m6rnk-replay");
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
    <section ref={rootRef} className="m6rnk">
      <style>{CSS}</style>
<div className="m6rnk-card">
  <div className="m6rnk-head">
    <div>
      <p className="m6rnk-eyebrow">Kiln Lane Studio · Autumn term</p>
      <h2 className="m6rnk-h">Bookings by class</h2>
    </div>
    <p className="m6rnk-lede">Wheel throwing for beginners filled the most places, more than three times the raku day.</p>
  </div>
  <figure className="m6rnk-fig">
    <div role="img" aria-label="Ranked bar chart of autumn term bookings. Wheel throwing for beginners leads with 64, then hand-building 51, glazing evening 38, family clay morning 33 and raku firing day 19.">
      <ol className="m6rnk-list" aria-hidden="true">
    <li className="m6rnk-row m6rnk-r0">
      <span className="m6rnk-num">01</span>
      <span className="m6rnk-name">Wheel throwing for beginners</span>
      <span className="m6rnk-track"><span className="m6rnk-bar m6rnk-gx m6rnk-t0"></span><span className="m6rnk-val m6rnk-f m6rnk-t6">64</span></span>
    </li>
    <li className="m6rnk-row m6rnk-r1">
      <span className="m6rnk-num">02</span>
      <span className="m6rnk-name">Hand-building with slabs</span>
      <span className="m6rnk-track"><span className="m6rnk-bar m6rnk-gx m6rnk-t1"></span><span className="m6rnk-val m6rnk-f m6rnk-t7">51</span></span>
    </li>
    <li className="m6rnk-row m6rnk-r2">
      <span className="m6rnk-num">03</span>
      <span className="m6rnk-name">Glazing evening</span>
      <span className="m6rnk-track"><span className="m6rnk-bar m6rnk-gx m6rnk-t2"></span><span className="m6rnk-val m6rnk-f m6rnk-t8">38</span></span>
    </li>
    <li className="m6rnk-row m6rnk-r3">
      <span className="m6rnk-num">04</span>
      <span className="m6rnk-name">Family clay morning</span>
      <span className="m6rnk-track"><span className="m6rnk-bar m6rnk-gx m6rnk-t3"></span><span className="m6rnk-val m6rnk-f m6rnk-t9">33</span></span>
    </li>
    <li className="m6rnk-row m6rnk-r4">
      <span className="m6rnk-num">05</span>
      <span className="m6rnk-name">Raku firing day</span>
      <span className="m6rnk-track"><span className="m6rnk-bar m6rnk-gx m6rnk-t4"></span><span className="m6rnk-val m6rnk-f m6rnk-t10">19</span></span>
    </li>
      </ol>
    </div>
    <ul className="m6rnk-sr">
    <li>Wheel throwing for beginners: 64 bookings</li>
    <li>Hand-building with slabs: 51 bookings</li>
    <li>Glazing evening: 38 bookings</li>
    <li>Family clay morning: 33 bookings</li>
    <li>Raku firing day: 19 bookings</li>
    </ul>
    <figcaption className="m6rnk-cap">Sample figures for an invented studio. Places booked across the twelve-week term.</figcaption>
  </figure>
</div>
<button type="button" className="m6rnk-replay" aria-label="Replay the chart"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the bar and highlight colours at the top of .m6bar, the --v value on each .m6bar-c rule, and --m6bar-unit (pixels per loaf).
const CSS = `
.m6bar { --m6bar-bg: #efe8dc; --m6bar-card: #fbf8f2; --m6bar-ink: #2a241d; --m6bar-quiet: #635a4e; --m6bar-line: #ddd3c3; --m6bar-focus: #2a241d; --m6bar-bar: #d8c3a2; --m6bar-hi: #a94f2c; --m6bar-unit: 1.25px; }
.m6bar { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; font-variant-numeric: tabular-nums; }
.m6bar *, .m6bar *::before, .m6bar *::after { box-sizing: border-box; }
.m6bar svg { display: block; overflow: visible; }
.m6bar-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.m6bar-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m6bar-line); border-radius: 999px; background: transparent; color: var(--m6bar-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m6bar-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m6bar-replay:hover { color: var(--m6bar-ink); }
.m6bar-replay:focus-visible { outline: 2px solid var(--m6bar-focus); outline-offset: 2px; }
/* Start state, only when motion is allowed and the script is running, so the chart is never blank without it. */
@media (prefers-reduced-motion: no-preference) {
  .m6bar.is-js:not([data-run]) .m6bar-gy { transform: scaleY(0); }
  .m6bar.is-js:not([data-run]) .m6bar-gx { transform: scaleX(0); }
  .m6bar.is-js:not([data-run]) .m6bar-f { opacity: 0; }
  .m6bar.is-js:not([data-run]) .m6bar-o { opacity: 0; }
  .m6bar.is-js:not([data-run]) .m6bar-d { stroke-dashoffset: var(--m6bar-len, 1); }
  .m6bar.is-js:not([data-run]) .m6bar-pop { opacity: 0; }
}
.m6bar[data-run] .m6bar-gy { animation: m6bar-gy .75s cubic-bezier(.2, .75, .25, 1) both; }
.m6bar[data-run] .m6bar-gx { animation: m6bar-gx .75s cubic-bezier(.2, .75, .25, 1) both; }
.m6bar[data-run] .m6bar-f { animation: m6bar-f .45s ease-out both; }
.m6bar[data-run] .m6bar-o { animation: m6bar-o .6s ease-out both; }
.m6bar[data-run] .m6bar-d { animation: m6bar-d .7s cubic-bezier(.45, .05, .3, 1) both; }
.m6bar[data-run] .m6bar-pop { animation: m6bar-pop .4s cubic-bezier(.2, .8, .3, 1.2) both; }
@keyframes m6bar-gy { from { transform: scaleY(0); } to { transform: none; } }
@keyframes m6bar-gx { from { transform: scaleX(0); } to { transform: none; } }
@keyframes m6bar-f { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@keyframes m6bar-o { from { opacity: 0; } to { opacity: 1; } }
@keyframes m6bar-d { from { stroke-dashoffset: var(--m6bar-len, 1); } to { stroke-dashoffset: 0; } }
@keyframes m6bar-pop { from { opacity: 0; transform: scale(.3); } to { opacity: 1; transform: none; } }
/* Paused while scrolled out of view. */
.m6bar[data-off] * { animation-play-state: paused !important; }
/* Reduced motion: the finished chart at its values, nothing moves. */
@media (prefers-reduced-motion: reduce) {
  .m6bar *, .m6bar *::before, .m6bar *::after { animation: none !important; transition: none !important; }
  .m6bar-replay { display: none; }
}

.m6bar { background: var(--m6bar-bg); color: var(--m6bar-ink); padding: 48px clamp(16px, 4vw, 48px) 80px; }
.m6bar-card { max-width: 760px; margin: 0 auto; padding: 32px clamp(18px, 4vw, 40px) 26px; background: var(--m6bar-card); border: 1px solid var(--m6bar-line); border-radius: 14px; box-shadow: 0 1px 0 rgba(42, 36, 29, .04), 0 28px 50px -36px rgba(42, 36, 29, .5); }
.m6bar-eyebrow { margin: 0 0 8px; font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--m6bar-quiet); }
.m6bar-h { margin: 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(26px, 3.4vw, 34px); line-height: 1.1; letter-spacing: -.01em; }
.m6bar-lede { margin: 10px 0 0; font-size: 15.5px; line-height: 1.55; color: var(--m6bar-quiet); max-width: 34em; }
.m6bar-fig { margin: 28px 0 0; }
.m6bar-plot { position: relative; height: calc(200 * var(--m6bar-unit)); padding-left: 34px; border-bottom: 1.5px solid var(--m6bar-ink); }
.m6bar-grid span { position: absolute; left: 0; right: 0; border-top: 1px dashed var(--m6bar-line); }
.m6bar-grid b { position: absolute; left: 0; top: -9px; font-size: 11.5px; font-weight: 500; color: var(--m6bar-quiet); }
.m6bar-g50 { bottom: calc(50 * var(--m6bar-unit)); }
.m6bar-g100 { bottom: calc(100 * var(--m6bar-unit)); }
.m6bar-g150 { bottom: calc(150 * var(--m6bar-unit)); }
.m6bar-cols { position: relative; height: 100%; display: grid; grid-template-columns: repeat(7, 1fr); gap: clamp(6px, 2vw, 18px); align-items: end; }
.m6bar-col { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
.m6bar-val { font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--m6bar-quiet); }
.m6bar-bar { display: block; width: 100%; max-width: 64px; height: calc(var(--v) * var(--m6bar-unit)); background: var(--m6bar-bar); border-radius: 5px 5px 0 0; transform-origin: 50% 100%; }
.m6bar-top .m6bar-bar { background: var(--m6bar-hi); }
.m6bar-top .m6bar-val { color: var(--m6bar-hi); font-size: 15px; font-weight: 700; }
.m6bar-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: clamp(6px, 2vw, 18px); padding-left: 34px; margin-top: 8px; font-size: 13px; color: var(--m6bar-quiet); text-align: center; }
.m6bar-cap { margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--m6bar-line); font-size: 12.5px; color: var(--m6bar-quiet); padding-right: 96px; }
@media (max-width: 560px) {
  .m6bar { --m6bar-unit: 1px; }
  .m6bar-plot, .m6bar-days { padding-left: 26px; }
  .m6bar-val { font-size: 11.5px; }
  .m6bar-top .m6bar-val { font-size: 13px; }
  .m6bar-days { font-size: 12px; }
}
.m6bar-c0 { --v: 84; }
.m6bar-c1 { --v: 92; }
.m6bar-c2 { --v: 88; }
.m6bar-c3 { --v: 104; }
.m6bar-c4 { --v: 131; }
.m6bar-c5 { --v: 168; }
.m6bar-c6 { --v: 117; }
.m6bar[data-run] .m6bar-t0 { animation-delay: 0.00s; }
.m6bar[data-run] .m6bar-t1 { animation-delay: 0.07s; }
.m6bar[data-run] .m6bar-t2 { animation-delay: 0.14s; }
.m6bar[data-run] .m6bar-t3 { animation-delay: 0.21s; }
.m6bar[data-run] .m6bar-t4 { animation-delay: 0.28s; }
.m6bar[data-run] .m6bar-t5 { animation-delay: 0.35s; }
.m6bar[data-run] .m6bar-t6 { animation-delay: 0.42s; }
.m6bar[data-run] .m6bar-t7 { animation-delay: 0.49s; }
.m6bar[data-run] .m6bar-t8 { animation-delay: 0.56s; }
.m6bar[data-run] .m6bar-t9 { animation-delay: 0.63s; }
.m6bar[data-run] .m6bar-t10 { animation-delay: 0.70s; }
.m6bar[data-run] .m6bar-t11 { animation-delay: 0.77s; }
.m6bar[data-run] .m6bar-t12 { animation-delay: 0.84s; }
.m6bar[data-run] .m6bar-t13 { animation-delay: 0.91s; }
.m6bar[data-run] .m6bar-t14 { animation-delay: 0.98s; }
.m6bar[data-run] .m6bar-t15 { animation-delay: 1.05s; }
.m6bar[data-run] .m6bar-t16 { animation-delay: 1.12s; }
.m6bar[data-run] .m6bar-t17 { animation-delay: 1.19s; }
.m6bar[data-run] .m6bar-t18 { animation-delay: 1.26s; }
.m6bar[data-run] .m6bar-t19 { animation-delay: 1.33s; }
.m6bar[data-run] .m6bar-t20 { animation-delay: 1.40s; }
.m6bar[data-run] .m6bar-t21 { animation-delay: 1.47s; }
.m6bar[data-run] .m6bar-t22 { animation-delay: 1.54s; }
.m6bar[data-run] .m6bar-t23 { animation-delay: 1.61s; }
.m6bar[data-run] .m6bar-t24 { animation-delay: 1.68s; }
.m6bar[data-run] .m6bar-t25 { animation-delay: 1.75s; }
.m6bar[data-run] .m6bar-t26 { animation-delay: 1.82s; }
.m6bar[data-run] .m6bar-t27 { animation-delay: 1.89s; }
.m6bar[data-run] .m6bar-t28 { animation-delay: 1.96s; }
.m6bar[data-run] .m6bar-t29 { animation-delay: 2.03s; }
.m6bar[data-run] .m6bar-t30 { animation-delay: 2.10s; }
.m6bar[data-run] .m6bar-t31 { animation-delay: 2.17s; }
.m6bar[data-run] .m6bar-t32 { animation-delay: 2.24s; }
.m6bar[data-run] .m6bar-t33 { animation-delay: 2.31s; }
.m6bar[data-run] .m6bar-t34 { animation-delay: 2.38s; }
.m6bar[data-run] .m6bar-t35 { animation-delay: 2.45s; }
`;

// Runs before paint in the browser so the chart never flashes finished before it plays.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function BakeryWeeklySalesBarChartGrows() {
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
    const btn = root.querySelector(".m6bar-replay");
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
    <section ref={rootRef} className="m6bar">
      <style>{CSS}</style>
<div className="m6bar-card">
  <div className="m6bar-head">
    <p className="m6bar-eyebrow">Fennel &amp; Rye Bakery · Week 11</p>
    <h2 className="m6bar-h">Loaves sold each day</h2>
    <p className="m6bar-lede">Saturday is the busiest day of the week at 168 loaves, double a quiet Monday.</p>
  </div>
  <figure className="m6bar-fig">
    <div className="m6bar-plot" role="img" aria-label="Bar chart of loaves sold each day in week 11. Saturday is highest at 168 and Monday lowest at 84.">
      <div className="m6bar-grid" aria-hidden="true">
        <span className="m6bar-g50"><b>50</b></span>
        <span className="m6bar-g100"><b>100</b></span>
        <span className="m6bar-g150"><b>150</b></span>
      </div>
      <div className="m6bar-cols">
      <div className="m6bar-col m6bar-c0">
        <span className="m6bar-val m6bar-f m6bar-t5">84</span>
        <span className="m6bar-bar m6bar-gy m6bar-t0"></span>
      </div>
      <div className="m6bar-col m6bar-c1">
        <span className="m6bar-val m6bar-f m6bar-t6">92</span>
        <span className="m6bar-bar m6bar-gy m6bar-t1"></span>
      </div>
      <div className="m6bar-col m6bar-c2">
        <span className="m6bar-val m6bar-f m6bar-t7">88</span>
        <span className="m6bar-bar m6bar-gy m6bar-t2"></span>
      </div>
      <div className="m6bar-col m6bar-c3">
        <span className="m6bar-val m6bar-f m6bar-t8">104</span>
        <span className="m6bar-bar m6bar-gy m6bar-t3"></span>
      </div>
      <div className="m6bar-col m6bar-c4">
        <span className="m6bar-val m6bar-f m6bar-t9">131</span>
        <span className="m6bar-bar m6bar-gy m6bar-t4"></span>
      </div>
      <div className="m6bar-col m6bar-c5 m6bar-top">
        <span className="m6bar-val m6bar-f m6bar-t10">168</span>
        <span className="m6bar-bar m6bar-gy m6bar-t5"></span>
      </div>
      <div className="m6bar-col m6bar-c6">
        <span className="m6bar-val m6bar-f m6bar-t11">117</span>
        <span className="m6bar-bar m6bar-gy m6bar-t6"></span>
      </div>
      </div>
    </div>
    <div className="m6bar-days" aria-hidden="true">
      <span>Mon</span>
      <span>Tue</span>
      <span>Wed</span>
      <span>Thu</span>
      <span>Fri</span>
      <span>Sat</span>
      <span>Sun</span>
    </div>
    <ul className="m6bar-sr">
      <li>Monday: 84 loaves</li>
      <li>Tuesday: 92 loaves</li>
      <li>Wednesday: 88 loaves</li>
      <li>Thursday: 104 loaves</li>
      <li>Friday: 131 loaves</li>
      <li>Saturday: 168 loaves</li>
      <li>Sunday: 117 loaves</li>
    </ul>
    <figcaption className="m6bar-cap">Sample figures for an invented bakery. Whole loaves only, rolls not counted.</figcaption>
  </figure>
</div>
<button type="button" className="m6bar-replay" aria-label="Replay the chart"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the three layer colours at the top of .m6stk and the share values in the band paths and labels (each column adds up to 100).
const CSS = `
.m6stk { --m6stk-bg: #2b2e33; --m6stk-card: #f4f3f0; --m6stk-ink: #1d1f22; --m6stk-quiet: #4f535a; --m6stk-line: #d9d7d1; --m6stk-focus: #1d1f22; --m6stk-rep: #3a3f46; --m6stk-par: #a9aeb5; --m6stk-ren: #d49c41; }
.m6stk { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; font-variant-numeric: tabular-nums; }
.m6stk *, .m6stk *::before, .m6stk *::after { box-sizing: border-box; }
.m6stk svg { display: block; overflow: visible; }
.m6stk-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.m6stk-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m6stk-line); border-radius: 999px; background: transparent; color: var(--m6stk-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m6stk-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m6stk-replay:hover { color: var(--m6stk-ink); }
.m6stk-replay:focus-visible { outline: 2px solid var(--m6stk-focus); outline-offset: 2px; }
/* Start state, only when motion is allowed and the script is running, so the chart is never blank without it. */
@media (prefers-reduced-motion: no-preference) {
  .m6stk.is-js:not([data-run]) .m6stk-gy { transform: scaleY(0); }
  .m6stk.is-js:not([data-run]) .m6stk-gx { transform: scaleX(0); }
  .m6stk.is-js:not([data-run]) .m6stk-f { opacity: 0; }
  .m6stk.is-js:not([data-run]) .m6stk-o { opacity: 0; }
  .m6stk.is-js:not([data-run]) .m6stk-d { stroke-dashoffset: var(--m6stk-len, 1); }
  .m6stk.is-js:not([data-run]) .m6stk-pop { opacity: 0; }
}
.m6stk[data-run] .m6stk-gy { animation: m6stk-gy .75s cubic-bezier(.2, .75, .25, 1) both; }
.m6stk[data-run] .m6stk-gx { animation: m6stk-gx .75s cubic-bezier(.2, .75, .25, 1) both; }
.m6stk[data-run] .m6stk-f { animation: m6stk-f .45s ease-out both; }
.m6stk[data-run] .m6stk-o { animation: m6stk-o .6s ease-out both; }
.m6stk[data-run] .m6stk-d { animation: m6stk-d .7s cubic-bezier(.45, .05, .3, 1) both; }
.m6stk[data-run] .m6stk-pop { animation: m6stk-pop .4s cubic-bezier(.2, .8, .3, 1.2) both; }
@keyframes m6stk-gy { from { transform: scaleY(0); } to { transform: none; } }
@keyframes m6stk-gx { from { transform: scaleX(0); } to { transform: none; } }
@keyframes m6stk-f { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@keyframes m6stk-o { from { opacity: 0; } to { opacity: 1; } }
@keyframes m6stk-d { from { stroke-dashoffset: var(--m6stk-len, 1); } to { stroke-dashoffset: 0; } }
@keyframes m6stk-pop { from { opacity: 0; transform: scale(.3); } to { opacity: 1; transform: none; } }
/* Paused while scrolled out of view. */
.m6stk[data-off] * { animation-play-state: paused !important; }
/* Reduced motion: the finished chart at its values, nothing moves. */
@media (prefers-reduced-motion: reduce) {
  .m6stk *, .m6stk *::before, .m6stk *::after { animation: none !important; transition: none !important; }
  .m6stk-replay { display: none; }
}

.m6stk { background: var(--m6stk-bg); color: var(--m6stk-ink); padding: 48px clamp(16px, 4vw, 48px) 80px; }
.m6stk .m6stk-replay { color: #d7d9dc; border-color: #575c63; }
.m6stk .m6stk-replay:hover { color: #fff; }
.m6stk .m6stk-replay:focus-visible { outline-color: #fff; }
.m6stk-card { max-width: 880px; margin: 0 auto; padding: 32px clamp(16px, 4vw, 40px) 26px; background: var(--m6stk-card); border-radius: 12px; box-shadow: 0 30px 60px -30px rgba(0, 0, 0, .6); }
.m6stk-head { display: flex; justify-content: space-between; gap: 20px 40px; align-items: flex-end; flex-wrap: wrap; }
.m6stk-eyebrow { margin: 0 0 8px; font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--m6stk-quiet); }
.m6stk-h { margin: 0; font-size: clamp(23px, 3vw, 30px); font-weight: 650; letter-spacing: -.015em; line-height: 1.15; }
.m6stk-lede { margin: 10px 0 0; font-size: 15px; line-height: 1.55; color: var(--m6stk-quiet); max-width: 32em; }
.m6stk-legend { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; font-size: 13.5px; font-weight: 500; }
.m6stk-legend li { display: flex; align-items: center; gap: 8px; }
.m6stk-sw { width: 14px; height: 14px; border-radius: 3px; }
.m6stk-srep { background: var(--m6stk-rep); } .m6stk-spar { background: var(--m6stk-par); } .m6stk-sren { background: var(--m6stk-ren); }
.m6stk-fig { margin: 26px 0 0; }
.m6stk-plot { position: relative; height: 300px; border-radius: 6px; overflow: hidden; }
.m6stk-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.m6stk-rep { fill: var(--m6stk-rep); } .m6stk-par { fill: var(--m6stk-par); } .m6stk-ren { fill: var(--m6stk-ren); }
.m6stk-ticks path { stroke: var(--m6stk-card); stroke-width: 1.2; opacity: .55; vector-effect: non-scaling-stroke; }
.m6stk-lab { position: absolute; transform: translate(-50%, -50%); font-size: 14px; font-weight: 650; color: var(--m6stk-ink); }
.m6stk[data-run] .m6stk-lab { animation-name: m6stk-lab; }
@keyframes m6stk-lab { from { opacity: 0; transform: translate(-50%, -30%); } to { opacity: 1; transform: translate(-50%, -50%); } }
.m6stk-lrep { color: #fff; }
.m6stk-years { position: relative; height: 22px; margin-top: 8px; font-size: 13px; color: var(--m6stk-quiet); }
.m6stk-years span { position: absolute; transform: translateX(-50%); }
.m6stk-cap { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--m6stk-line); font-size: 12.5px; color: var(--m6stk-quiet); }
@media (max-width: 560px) {
  .m6stk-plot { height: 260px; }
  .m6stk-lab { font-size: 12.5px; }
}
.m6stk-p00 { left: 12.500%; top: 73.200%; }
.m6stk-p01 { left: 37.500%; top: 75.617%; }
.m6stk-p02 { left: 62.500%; top: 77.550%; }
.m6stk-p03 { left: 87.500%; top: 79.000%; }
.m6stk-p10 { left: 12.500%; top: 32.117%; }
.m6stk-p11 { left: 37.500%; top: 37.433%; }
.m6stk-p12 { left: 62.500%; top: 41.783%; }
.m6stk-p13 { left: 87.500%; top: 45.167%; }
.m6stk-p20 { left: 12.500%; top: 8.917%; }
.m6stk-p21 { left: 37.500%; top: 11.817%; }
.m6stk-p22 { left: 62.500%; top: 14.233%; }
.m6stk-p23 { left: 87.500%; top: 16.167%; }
.m6stk-y0 { left: 12.500%; }
.m6stk-y1 { left: 37.500%; }
.m6stk-y2 { left: 62.500%; }
.m6stk-y3 { left: 87.500%; }
.m6stk[data-run] .m6stk-t0 { animation-delay: 0.00s; }
.m6stk[data-run] .m6stk-t1 { animation-delay: 0.08s; }
.m6stk[data-run] .m6stk-t2 { animation-delay: 0.16s; }
.m6stk[data-run] .m6stk-t3 { animation-delay: 0.24s; }
.m6stk[data-run] .m6stk-t4 { animation-delay: 0.32s; }
.m6stk[data-run] .m6stk-t5 { animation-delay: 0.40s; }
.m6stk[data-run] .m6stk-t6 { animation-delay: 0.48s; }
.m6stk[data-run] .m6stk-t7 { animation-delay: 0.56s; }
.m6stk[data-run] .m6stk-t8 { animation-delay: 0.64s; }
.m6stk[data-run] .m6stk-t9 { animation-delay: 0.72s; }
.m6stk[data-run] .m6stk-t10 { animation-delay: 0.80s; }
.m6stk[data-run] .m6stk-t11 { animation-delay: 0.88s; }
.m6stk[data-run] .m6stk-t12 { animation-delay: 0.96s; }
.m6stk[data-run] .m6stk-t13 { animation-delay: 1.04s; }
.m6stk[data-run] .m6stk-t14 { animation-delay: 1.12s; }
.m6stk[data-run] .m6stk-t15 { animation-delay: 1.20s; }
.m6stk[data-run] .m6stk-t16 { animation-delay: 1.28s; }
.m6stk[data-run] .m6stk-t17 { animation-delay: 1.36s; }
.m6stk[data-run] .m6stk-t18 { animation-delay: 1.44s; }
.m6stk[data-run] .m6stk-t19 { animation-delay: 1.52s; }
.m6stk[data-run] .m6stk-t20 { animation-delay: 1.60s; }
.m6stk[data-run] .m6stk-t21 { animation-delay: 1.68s; }
.m6stk[data-run] .m6stk-t22 { animation-delay: 1.76s; }
.m6stk[data-run] .m6stk-t23 { animation-delay: 1.84s; }
.m6stk[data-run] .m6stk-t24 { animation-delay: 1.92s; }
.m6stk[data-run] .m6stk-t25 { animation-delay: 2.00s; }
.m6stk[data-run] .m6stk-t26 { animation-delay: 2.08s; }
.m6stk[data-run] .m6stk-t27 { animation-delay: 2.16s; }
.m6stk[data-run] .m6stk-t28 { animation-delay: 2.24s; }
.m6stk[data-run] .m6stk-t29 { animation-delay: 2.32s; }
.m6stk[data-run] .m6stk-t30 { animation-delay: 2.40s; }
.m6stk[data-run] .m6stk-t31 { animation-delay: 2.48s; }
.m6stk[data-run] .m6stk-t32 { animation-delay: 2.56s; }
.m6stk[data-run] .m6stk-t33 { animation-delay: 2.64s; }
.m6stk[data-run] .m6stk-t34 { animation-delay: 2.72s; }
.m6stk[data-run] .m6stk-t35 { animation-delay: 2.80s; }
`;

// Runs before paint in the browser so the chart never flashes finished before it plays.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function CycleShopRevenueShareStackedArea() {
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
    const btn = root.querySelector(".m6stk-replay");
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
    <section ref={rootRef} className="m6stk">
      <style>{CSS}</style>
<div className="m6stk-card">
  <div className="m6stk-head">
    <div>
      <p className="m6stk-eyebrow">Spoke &amp; Chain Cycles · Four-year review</p>
      <h2 className="m6stk-h">Where each year's revenue came from</h2>
      <p className="m6stk-lede">Rentals doubled their share, from 15% to 30%, while repairs slipped from just over half to 40%.</p>
    </div>
    <ul className="m6stk-legend" aria-hidden="true">
      <li><i className="m6stk-sw m6stk-sren"></i>Rentals</li>
      <li><i className="m6stk-sw m6stk-spar"></i>Parts</li>
      <li><i className="m6stk-sw m6stk-srep"></i>Repairs</li>
    </ul>
  </div>
  <figure className="m6stk-fig">
    <div className="m6stk-plot" role="img" aria-label="Stacked area chart of revenue share from 2023 to 2026. Rentals grow from 15% to 30%, repairs fall from 52% to 40% and parts stay near a third.">
      <svg className="m6stk-svg" viewBox="0 0 640 240" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path className="m6stk-rep m6stk-o m6stk-t0" d="M0 115.4 L80 115.4 L240 127.0 L400 136.2 L560 143.2 L640 143.2 L640 236.0 L560 236.0 L400 236.0 L240 236.0 L80 236.0 L0 236.0Z"/>
        <path className="m6stk-par m6stk-o m6stk-t3" d="M0 38.8 L80 38.8 L240 52.7 L400 64.3 L560 73.6 L640 73.6 L640 143.2 L560 143.2 L400 136.2 L240 127.0 L80 115.4 L0 115.4Z"/>
        <path className="m6stk-ren m6stk-o m6stk-t6" d="M0 4.0 L80 4.0 L240 4.0 L400 4.0 L560 4.0 L640 4.0 L640 73.6 L560 73.6 L400 64.3 L240 52.7 L80 38.8 L0 38.8Z"/>
        <g className="m6stk-ticks">
        <path d="M80 4V236"/>
        <path d="M240 4V236"/>
        <path d="M400 4V236"/>
        <path d="M560 4V236"/>
        </g>
      </svg>
      <div aria-hidden="true">
      <span className="m6stk-lab m6stk-lrep m6stk-f m6stk-t4 m6stk-p00">52%</span>
      <span className="m6stk-lab m6stk-lrep m6stk-f m6stk-t5 m6stk-p01">47%</span>
      <span className="m6stk-lab m6stk-lrep m6stk-f m6stk-t6 m6stk-p02">43%</span>
      <span className="m6stk-lab m6stk-lrep m6stk-f m6stk-t7 m6stk-p03">40%</span>
      <span className="m6stk-lab m6stk-lpar m6stk-f m6stk-t7 m6stk-p10">33%</span>
      <span className="m6stk-lab m6stk-lpar m6stk-f m6stk-t8 m6stk-p11">32%</span>
      <span className="m6stk-lab m6stk-lpar m6stk-f m6stk-t9 m6stk-p12">31%</span>
      <span className="m6stk-lab m6stk-lpar m6stk-f m6stk-t10 m6stk-p13">30%</span>
      <span className="m6stk-lab m6stk-lren m6stk-f m6stk-t10 m6stk-p20">15%</span>
      <span className="m6stk-lab m6stk-lren m6stk-f m6stk-t11 m6stk-p21">21%</span>
      <span className="m6stk-lab m6stk-lren m6stk-f m6stk-t12 m6stk-p22">26%</span>
      <span className="m6stk-lab m6stk-lren m6stk-f m6stk-t13 m6stk-p23">30%</span>
      </div>
    </div>
    <div className="m6stk-years" aria-hidden="true">
      <span className="m6stk-y0">2023</span>
      <span className="m6stk-y1">2024</span>
      <span className="m6stk-y2">2025</span>
      <span className="m6stk-y3">2026</span>
    </div>
    <ul className="m6stk-sr">
      <li>Repairs: 2023 52%, 2024 47%, 2025 43%, 2026 40%</li>
      <li>Parts: 2023 33%, 2024 32%, 2025 31%, 2026 30%</li>
      <li>Rentals: 2023 15%, 2024 21%, 2025 26%, 2026 30%</li>
    </ul>
    <figcaption className="m6stk-cap">Sample figures for an invented bike shop. Each year's columns add up to 100%.</figcaption>
  </figure>
</div>
<button type="button" className="m6stk-replay" aria-label="Replay the chart"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the line and fill colours at the top of .m6lin, and the points in the line and area paths (each month is 80 units apart).
const CSS = `
.m6lin { --m6lin-bg: #e4ebe3; --m6lin-card: #f7f9f5; --m6lin-ink: #1b2a21; --m6lin-quiet: #4d5e53; --m6lin-line: #d3ddd2; --m6lin-focus: #2f5d46; --m6lin-plot: #2f5d46; --m6lin-fill: #b9d0bf; --m6lin-peakc: #b0612e; }
.m6lin { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; font-variant-numeric: tabular-nums; }
.m6lin *, .m6lin *::before, .m6lin *::after { box-sizing: border-box; }
.m6lin svg { display: block; overflow: visible; }
.m6lin-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.m6lin-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m6lin-line); border-radius: 999px; background: transparent; color: var(--m6lin-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m6lin-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m6lin-replay:hover { color: var(--m6lin-ink); }
.m6lin-replay:focus-visible { outline: 2px solid var(--m6lin-focus); outline-offset: 2px; }
/* Start state, only when motion is allowed and the script is running, so the chart is never blank without it. */
@media (prefers-reduced-motion: no-preference) {
  .m6lin.is-js:not([data-run]) .m6lin-gy { transform: scaleY(0); }
  .m6lin.is-js:not([data-run]) .m6lin-gx { transform: scaleX(0); }
  .m6lin.is-js:not([data-run]) .m6lin-f { opacity: 0; }
  .m6lin.is-js:not([data-run]) .m6lin-o { opacity: 0; }
  .m6lin.is-js:not([data-run]) .m6lin-d { stroke-dashoffset: var(--m6lin-len, 1); }
  .m6lin.is-js:not([data-run]) .m6lin-pop { opacity: 0; }
}
.m6lin[data-run] .m6lin-gy { animation: m6lin-gy .75s cubic-bezier(.2, .75, .25, 1) both; }
.m6lin[data-run] .m6lin-gx { animation: m6lin-gx .75s cubic-bezier(.2, .75, .25, 1) both; }
.m6lin[data-run] .m6lin-f { animation: m6lin-f .45s ease-out both; }
.m6lin[data-run] .m6lin-o { animation: m6lin-o .6s ease-out both; }
.m6lin[data-run] .m6lin-d { animation: m6lin-d .7s cubic-bezier(.45, .05, .3, 1) both; }
.m6lin[data-run] .m6lin-pop { animation: m6lin-pop .4s cubic-bezier(.2, .8, .3, 1.2) both; }
@keyframes m6lin-gy { from { transform: scaleY(0); } to { transform: none; } }
@keyframes m6lin-gx { from { transform: scaleX(0); } to { transform: none; } }
@keyframes m6lin-f { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@keyframes m6lin-o { from { opacity: 0; } to { opacity: 1; } }
@keyframes m6lin-d { from { stroke-dashoffset: var(--m6lin-len, 1); } to { stroke-dashoffset: 0; } }
@keyframes m6lin-pop { from { opacity: 0; transform: scale(.3); } to { opacity: 1; transform: none; } }
/* Paused while scrolled out of view. */
.m6lin[data-off] * { animation-play-state: paused !important; }
/* Reduced motion: the finished chart at its values, nothing moves. */
@media (prefers-reduced-motion: reduce) {
  .m6lin *, .m6lin *::before, .m6lin *::after { animation: none !important; transition: none !important; }
  .m6lin-replay { display: none; }
}

.m6lin { background: var(--m6lin-bg); color: var(--m6lin-ink); padding: 48px clamp(16px, 4vw, 48px) 80px; }
.m6lin-card { max-width: 820px; margin: 0 auto; padding: 32px clamp(16px, 4vw, 40px) 26px; background: var(--m6lin-card); border: 1px solid var(--m6lin-line); border-radius: 14px; box-shadow: 0 28px 50px -38px rgba(27, 42, 33, .55); }
.m6lin-eyebrow { margin: 0 0 8px; font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--m6lin-quiet); }
.m6lin-h { margin: 0; font-size: clamp(24px, 3vw, 30px); font-weight: 650; letter-spacing: -.015em; line-height: 1.15; }
.m6lin-lede { margin: 10px 0 0; font-size: 15px; line-height: 1.55; color: var(--m6lin-quiet); max-width: 36em; }
.m6lin-fig { margin: 30px 0 0; }
.m6lin-plot { position: relative; aspect-ratio: 640 / 260; }
.m6lin-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.m6lin-grid path { fill: none; stroke: var(--m6lin-line); stroke-width: 1; stroke-dasharray: 3 4; }
.m6lin-axis { fill: none; stroke: var(--m6lin-ink); stroke-width: 1.5; }
.m6lin-area { fill: var(--m6lin-fill); opacity: .55; }
.m6lin[data-run] .m6lin-area { animation-name: m6lin-area; animation-duration: .9s; }
@keyframes m6lin-area { from { opacity: 0; } to { opacity: .55; } }
.m6lin-path { fill: none; stroke: var(--m6lin-plot); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; }
.m6lin[data-run] .m6lin-path { animation-duration: 1.15s; animation-delay: .1s; animation-timing-function: linear; }
.m6lin-dot { fill: var(--m6lin-card); stroke: var(--m6lin-plot); stroke-width: 2.5; transform-box: fill-box; transform-origin: 50% 50%; }
.m6lin-dot.m6lin-peak { fill: var(--m6lin-peakc); stroke: var(--m6lin-card); stroke-width: 2.5; }
.m6lin-labs { position: absolute; inset: 0; }
.m6lin-lab { position: absolute; transform: translate(-50%, calc(-100% - 10px)); font-size: 13px; font-weight: 600; color: var(--m6lin-quiet); white-space: nowrap; }
.m6lin[data-run] .m6lin-lab { animation-name: m6lin-lab; }
@keyframes m6lin-lab { from { opacity: 0; transform: translate(-50%, calc(-100% - 4px)); } to { opacity: 1; transform: translate(-50%, calc(-100% - 10px)); } }
.m6lin-lab.m6lin-peak { color: var(--m6lin-peakc); font-size: 15px; font-weight: 700; }
.m6lin-months { position: relative; height: 22px; margin-top: 6px; font-size: 13px; color: var(--m6lin-quiet); }
.m6lin-months span { position: absolute; top: 0; transform: translateX(-50%); }
.m6lin-cap { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--m6lin-line); font-size: 12.5px; color: var(--m6lin-quiet); padding-right: 96px; }
@media (max-width: 560px) {
  .m6lin-lab { font-size: 11.5px; }
  .m6lin-lab.m6lin-peak { font-size: 12.5px; }
  .m6lin-months { font-size: 11.5px; }
  .m6lin-path { stroke-width: 3.6; }
}
.m6lin-x0 { left: 6.250%; }
.m6lin-lab.m6lin-x0 { top: 48.115%; }
.m6lin[data-run] .m6lin-k0 { animation-delay: 0.12s; }
.m6lin-x1 { left: 18.750%; }
.m6lin-lab.m6lin-x1 { top: 23.615%; }
.m6lin[data-run] .m6lin-k1 { animation-delay: 0.27s; }
.m6lin-x2 { left: 31.250%; }
.m6lin-lab.m6lin-x2 { top: 13.250%; }
.m6lin[data-run] .m6lin-k2 { animation-delay: 0.42s; }
.m6lin-x3 { left: 43.750%; }
.m6lin-lab.m6lin-x3 { top: 19.846%; }
.m6lin[data-run] .m6lin-k3 { animation-delay: 0.57s; }
.m6lin-x4 { left: 56.250%; }
.m6lin-lab.m6lin-x4 { top: 30.212%; }
.m6lin[data-run] .m6lin-k4 { animation-delay: 0.72s; }
.m6lin-x5 { left: 68.750%; }
.m6lin-lab.m6lin-x5 { top: 25.500%; }
.m6lin[data-run] .m6lin-k5 { animation-delay: 0.87s; }
.m6lin-x6 { left: 81.250%; }
.m6lin-lab.m6lin-x6 { top: 36.808%; }
.m6lin[data-run] .m6lin-k6 { animation-delay: 1.02s; }
.m6lin-x7 { left: 93.750%; }
.m6lin-lab.m6lin-x7 { top: 53.769%; }
.m6lin[data-run] .m6lin-k7 { animation-delay: 1.17s; }
.m6lin[data-run] .m6lin-t0 { animation-delay: 0.00s; }
.m6lin[data-run] .m6lin-t1 { animation-delay: 0.06s; }
.m6lin[data-run] .m6lin-t2 { animation-delay: 0.12s; }
.m6lin[data-run] .m6lin-t3 { animation-delay: 0.18s; }
.m6lin[data-run] .m6lin-t4 { animation-delay: 0.24s; }
.m6lin[data-run] .m6lin-t5 { animation-delay: 0.30s; }
.m6lin[data-run] .m6lin-t6 { animation-delay: 0.36s; }
.m6lin[data-run] .m6lin-t7 { animation-delay: 0.42s; }
.m6lin[data-run] .m6lin-t8 { animation-delay: 0.48s; }
.m6lin[data-run] .m6lin-t9 { animation-delay: 0.54s; }
.m6lin[data-run] .m6lin-t10 { animation-delay: 0.60s; }
.m6lin[data-run] .m6lin-t11 { animation-delay: 0.66s; }
.m6lin[data-run] .m6lin-t12 { animation-delay: 0.72s; }
.m6lin[data-run] .m6lin-t13 { animation-delay: 0.78s; }
.m6lin[data-run] .m6lin-t14 { animation-delay: 0.84s; }
.m6lin[data-run] .m6lin-t15 { animation-delay: 0.90s; }
.m6lin[data-run] .m6lin-t16 { animation-delay: 0.96s; }
.m6lin[data-run] .m6lin-t17 { animation-delay: 1.02s; }
.m6lin[data-run] .m6lin-t18 { animation-delay: 1.08s; }
.m6lin[data-run] .m6lin-t19 { animation-delay: 1.14s; }
.m6lin[data-run] .m6lin-t20 { animation-delay: 1.20s; }
.m6lin[data-run] .m6lin-t21 { animation-delay: 1.26s; }
.m6lin[data-run] .m6lin-t22 { animation-delay: 1.32s; }
.m6lin[data-run] .m6lin-t23 { animation-delay: 1.38s; }
.m6lin[data-run] .m6lin-t24 { animation-delay: 1.44s; }
.m6lin[data-run] .m6lin-t25 { animation-delay: 1.50s; }
.m6lin[data-run] .m6lin-t26 { animation-delay: 1.56s; }
.m6lin[data-run] .m6lin-t27 { animation-delay: 1.62s; }
.m6lin[data-run] .m6lin-t28 { animation-delay: 1.68s; }
.m6lin[data-run] .m6lin-t29 { animation-delay: 1.74s; }
.m6lin[data-run] .m6lin-t30 { animation-delay: 1.80s; }
.m6lin[data-run] .m6lin-t31 { animation-delay: 1.86s; }
.m6lin[data-run] .m6lin-t32 { animation-delay: 1.92s; }
.m6lin[data-run] .m6lin-t33 { animation-delay: 1.98s; }
.m6lin[data-run] .m6lin-t34 { animation-delay: 2.04s; }
.m6lin[data-run] .m6lin-t35 { animation-delay: 2.10s; }
`;

// Runs before paint in the browser so the chart never flashes finished before it plays.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function GardenShopOrdersLineChartThat() {
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
    const btn = root.querySelector(".m6lin-replay");
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
    <section ref={rootRef} className="m6lin">
      <style>{CSS}</style>
<div className="m6lin-card">
  <div className="m6lin-head">
    <p className="m6lin-eyebrow">Moss &amp; Pine Garden Shop · Season report</p>
    <h2 className="m6lin-h">Plant orders by month</h2>
    <p className="m6lin-lede">Orders climbed through spring to a June high of 395, held up over late summer and eased off into November.</p>
  </div>
  <figure className="m6lin-fig">
    <div className="m6lin-plot" role="img" aria-label="Line chart of plant orders from April to November. Orders rise from 210 in April to a peak of 395 in June, then fall to 180 in November.">
      <svg className="m6lin-svg" viewBox="0 0 640 260" aria-hidden="true" focusable="false">
        <g className="m6lin-grid">
      <path d="M40 179.0H600"/>
      <path d="M40 130.0H600"/>
      <path d="M40 81.0H600"/>
      <path d="M40 32.0H600"/>
        </g>
        <path className="m6lin-area m6lin-o m6lin-t9" d="M40 125.1 L120 61.4 L200 34.4 L280 51.6 L360 78.6 L440 66.3 L520 95.7 L600 139.8 L600 228 L40 228Z"/>
        <path className="m6lin-path m6lin-d" d="M40 125.1 L120 61.4 L200 34.4 L280 51.6 L360 78.6 L440 66.3 L520 95.7 L600 139.8" pathLength="1"/>
        <path className="m6lin-axis" d="M28 228H612"/>
      <circle className="m6lin-dot m6lin-pop m6lin-k0" cx="40" cy="125.1" r="4.5"/>
      <circle className="m6lin-dot m6lin-pop m6lin-k1" cx="120" cy="61.4" r="4.5"/>
      <circle className="m6lin-dot m6lin-pop m6lin-k2 m6lin-peak" cx="200" cy="34.4" r="6"/>
      <circle className="m6lin-dot m6lin-pop m6lin-k3" cx="280" cy="51.6" r="4.5"/>
      <circle className="m6lin-dot m6lin-pop m6lin-k4" cx="360" cy="78.6" r="4.5"/>
      <circle className="m6lin-dot m6lin-pop m6lin-k5" cx="440" cy="66.3" r="4.5"/>
      <circle className="m6lin-dot m6lin-pop m6lin-k6" cx="520" cy="95.7" r="4.5"/>
      <circle className="m6lin-dot m6lin-pop m6lin-k7" cx="600" cy="139.8" r="4.5"/>
      </svg>
      <div className="m6lin-labs" aria-hidden="true">
      <span className="m6lin-lab m6lin-f m6lin-k0 m6lin-x0">210</span>
      <span className="m6lin-lab m6lin-f m6lin-k1 m6lin-x1">340</span>
      <span className="m6lin-lab m6lin-f m6lin-k2 m6lin-peak m6lin-x2">395</span>
      <span className="m6lin-lab m6lin-f m6lin-k3 m6lin-x3">360</span>
      <span className="m6lin-lab m6lin-f m6lin-k4 m6lin-x4">305</span>
      <span className="m6lin-lab m6lin-f m6lin-k5 m6lin-x5">330</span>
      <span className="m6lin-lab m6lin-f m6lin-k6 m6lin-x6">270</span>
      <span className="m6lin-lab m6lin-f m6lin-k7 m6lin-x7">180</span>
      </div>
    </div>
    <div className="m6lin-months" aria-hidden="true">
      <span className="m6lin-x0">Apr</span>
      <span className="m6lin-x1">May</span>
      <span className="m6lin-x2">Jun</span>
      <span className="m6lin-x3">Jul</span>
      <span className="m6lin-x4">Aug</span>
      <span className="m6lin-x5">Sep</span>
      <span className="m6lin-x6">Oct</span>
      <span className="m6lin-x7">Nov</span>
    </div>
    <ul className="m6lin-sr">
      <li>April: 210 orders</li>
      <li>May: 340 orders</li>
      <li>June: 395 orders</li>
      <li>July: 360 orders</li>
      <li>August: 305 orders</li>
      <li>September: 330 orders</li>
      <li>October: 270 orders</li>
      <li>November: 180 orders</li>
    </ul>
    <figcaption className="m6lin-cap">Sample figures for an invented garden shop. Online and phone orders combined.</figcaption>
  </figure>
</div>
<button type="button" className="m6lin-replay" aria-label="Replay the chart"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

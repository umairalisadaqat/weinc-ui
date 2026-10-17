import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the brass and navy colours at the top of .m6tml, the five stages, and the .m6tml-k delays (0.27s apart, matching the 1.1s track fill).
const CSS = `
.m6tml { --m6tml-bg: #f5f3ee; --m6tml-card: #ffffff; --m6tml-ink: #1a2333; --m6tml-quiet: #505a6a; --m6tml-line: #dcd8cf; --m6tml-focus: #1a2333; --m6tml-brass: #a57a2c; --m6tml-navy: #1f2d47; }
.m6tml { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; font-variant-numeric: tabular-nums; }
.m6tml *, .m6tml *::before, .m6tml *::after { box-sizing: border-box; }
.m6tml svg { display: block; overflow: visible; }
.m6tml-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.m6tml-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m6tml-line); border-radius: 999px; background: transparent; color: var(--m6tml-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m6tml-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m6tml-replay:hover { color: var(--m6tml-ink); }
.m6tml-replay:focus-visible { outline: 2px solid var(--m6tml-focus); outline-offset: 2px; }
/* Start state, only when motion is allowed and the script is running, so the chart is never blank without it. */
@media (prefers-reduced-motion: no-preference) {
  .m6tml.is-js:not([data-run]) .m6tml-gy { transform: scaleY(0); }
  .m6tml.is-js:not([data-run]) .m6tml-gx { transform: scaleX(0); }
  .m6tml.is-js:not([data-run]) .m6tml-f { opacity: 0; }
  .m6tml.is-js:not([data-run]) .m6tml-o { opacity: 0; }
  .m6tml.is-js:not([data-run]) .m6tml-d { stroke-dashoffset: var(--m6tml-len, 1); }
  .m6tml.is-js:not([data-run]) .m6tml-pop { opacity: 0; }
}
.m6tml[data-run] .m6tml-gy { animation: m6tml-gy .75s cubic-bezier(.2, .75, .25, 1) both; }
.m6tml[data-run] .m6tml-gx { animation: m6tml-gx .75s cubic-bezier(.2, .75, .25, 1) both; }
.m6tml[data-run] .m6tml-f { animation: m6tml-f .45s ease-out both; }
.m6tml[data-run] .m6tml-o { animation: m6tml-o .6s ease-out both; }
.m6tml[data-run] .m6tml-d { animation: m6tml-d .7s cubic-bezier(.45, .05, .3, 1) both; }
.m6tml[data-run] .m6tml-pop { animation: m6tml-pop .4s cubic-bezier(.2, .8, .3, 1.2) both; }
@keyframes m6tml-gy { from { transform: scaleY(0); } to { transform: none; } }
@keyframes m6tml-gx { from { transform: scaleX(0); } to { transform: none; } }
@keyframes m6tml-f { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@keyframes m6tml-o { from { opacity: 0; } to { opacity: 1; } }
@keyframes m6tml-d { from { stroke-dashoffset: var(--m6tml-len, 1); } to { stroke-dashoffset: 0; } }
@keyframes m6tml-pop { from { opacity: 0; transform: scale(.3); } to { opacity: 1; transform: none; } }
/* Paused while scrolled out of view. */
.m6tml[data-off] * { animation-play-state: paused !important; }
/* Reduced motion: the finished chart at its values, nothing moves. */
@media (prefers-reduced-motion: reduce) {
  .m6tml *, .m6tml *::before, .m6tml *::after { animation: none !important; transition: none !important; }
  .m6tml-replay { display: none; }
}

.m6tml { background: var(--m6tml-bg); color: var(--m6tml-ink); padding: 52px clamp(16px, 4vw, 56px) 84px; }
.m6tml-wrap { max-width: 1080px; margin: 0 auto; }
.m6tml-eyebrow { margin: 0 0 8px; font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--m6tml-brass); }
.m6tml-h { margin: 0; font-size: clamp(26px, 3.4vw, 36px); font-weight: 650; letter-spacing: -.02em; line-height: 1.12; }
.m6tml-lede { margin: 12px 0 0; font-size: 15.5px; line-height: 1.55; color: var(--m6tml-quiet); max-width: 36em; }
.m6tml-tl { position: relative; margin-top: 40px; }
.m6tml-rail { position: absolute; left: 10%; right: 10%; top: 13px; height: 2px; background: var(--m6tml-line); }
.m6tml-fill { position: absolute; inset: 0; background: var(--m6tml-brass); transform-origin: 0 50%; }
.m6tml[data-run] .m6tml-fill { animation-duration: 1.1s; animation-delay: .1s; animation-timing-function: linear; }
.m6tml-stages { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 18px; }
.m6tml-stage { position: relative; text-align: center; }
.m6tml-node { position: relative; display: block; width: 28px; height: 28px; margin: 0 auto; }
.m6tml-ring { position: absolute; inset: 0; border-radius: 50%; background: var(--m6tml-bg); border: 2px solid var(--m6tml-line); }
.m6tml-core { position: absolute; inset: 0; border-radius: 50%; background: var(--m6tml-brass); box-shadow: 0 0 0 5px rgba(165, 122, 44, .18); }
.m6tml-core::after { content: ""; position: absolute; inset: 9px; border-radius: 50%; background: var(--m6tml-card); }
.m6tml-day { display: block; margin-top: 16px; font-size: 12px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; color: var(--m6tml-brass); }
.m6tml-sh { margin: 6px 0 0; font-size: 18px; font-weight: 650; color: var(--m6tml-navy); }
.m6tml-sp { margin: 6px auto 0; font-size: 14px; line-height: 1.5; color: var(--m6tml-quiet); max-width: 15em; }
.m6tml-cap { margin: 34px 0 0; padding-top: 14px; border-top: 1px solid var(--m6tml-line); font-size: 12.5px; color: var(--m6tml-quiet); padding-right: 110px; }
@media (max-width: 760px) {
  .m6tml-rail { left: 13px; right: auto; top: 14px; bottom: 0; width: 2px; height: auto; }
  .m6tml-fill { transform-origin: 50% 0; }
  .m6tml.is-js:not([data-run]) .m6tml-fill { transform: scaleY(0); }
  .m6tml[data-run] .m6tml-fill { animation-name: m6tml-gy; }
  .m6tml-stages { grid-template-columns: 1fr; gap: 22px; }
  .m6tml-stage { text-align: left; padding-left: 48px; }
  .m6tml-node { position: absolute; left: 0; top: 0; }
  .m6tml-day { margin-top: 4px; }
  .m6tml-sp { margin-left: 0; }
  .m6tml-stage:last-child::before { content: ""; position: absolute; left: 12px; top: 28px; bottom: 0; width: 4px; background: var(--m6tml-bg); }
  .m6tml-node { z-index: 1; }
}
@media (max-width: 760px) and (prefers-reduced-motion: reduce) { .m6tml.is-js:not([data-run]) .m6tml-fill { transform: none; } }
.m6tml[data-run] .m6tml-k0 { animation-delay: 0.10s; }
.m6tml[data-run] .m6tml-k1 { animation-delay: 0.37s; }
.m6tml[data-run] .m6tml-k2 { animation-delay: 0.64s; }
.m6tml[data-run] .m6tml-k3 { animation-delay: 0.91s; }
.m6tml[data-run] .m6tml-k4 { animation-delay: 1.18s; }
.m6tml[data-run] .m6tml-t0 { animation-delay: 0.00s; }
.m6tml[data-run] .m6tml-t1 { animation-delay: 0.06s; }
.m6tml[data-run] .m6tml-t2 { animation-delay: 0.12s; }
.m6tml[data-run] .m6tml-t3 { animation-delay: 0.18s; }
.m6tml[data-run] .m6tml-t4 { animation-delay: 0.24s; }
.m6tml[data-run] .m6tml-t5 { animation-delay: 0.30s; }
.m6tml[data-run] .m6tml-t6 { animation-delay: 0.36s; }
.m6tml[data-run] .m6tml-t7 { animation-delay: 0.42s; }
.m6tml[data-run] .m6tml-t8 { animation-delay: 0.48s; }
.m6tml[data-run] .m6tml-t9 { animation-delay: 0.54s; }
.m6tml[data-run] .m6tml-t10 { animation-delay: 0.60s; }
.m6tml[data-run] .m6tml-t11 { animation-delay: 0.66s; }
.m6tml[data-run] .m6tml-t12 { animation-delay: 0.72s; }
.m6tml[data-run] .m6tml-t13 { animation-delay: 0.78s; }
.m6tml[data-run] .m6tml-t14 { animation-delay: 0.84s; }
.m6tml[data-run] .m6tml-t15 { animation-delay: 0.90s; }
.m6tml[data-run] .m6tml-t16 { animation-delay: 0.96s; }
.m6tml[data-run] .m6tml-t17 { animation-delay: 1.02s; }
.m6tml[data-run] .m6tml-t18 { animation-delay: 1.08s; }
.m6tml[data-run] .m6tml-t19 { animation-delay: 1.14s; }
.m6tml[data-run] .m6tml-t20 { animation-delay: 1.20s; }
.m6tml[data-run] .m6tml-t21 { animation-delay: 1.26s; }
.m6tml[data-run] .m6tml-t22 { animation-delay: 1.32s; }
.m6tml[data-run] .m6tml-t23 { animation-delay: 1.38s; }
.m6tml[data-run] .m6tml-t24 { animation-delay: 1.44s; }
.m6tml[data-run] .m6tml-t25 { animation-delay: 1.50s; }
.m6tml[data-run] .m6tml-t26 { animation-delay: 1.56s; }
.m6tml[data-run] .m6tml-t27 { animation-delay: 1.62s; }
.m6tml[data-run] .m6tml-t28 { animation-delay: 1.68s; }
.m6tml[data-run] .m6tml-t29 { animation-delay: 1.74s; }
.m6tml[data-run] .m6tml-t30 { animation-delay: 1.80s; }
.m6tml[data-run] .m6tml-t31 { animation-delay: 1.86s; }
.m6tml[data-run] .m6tml-t32 { animation-delay: 1.92s; }
.m6tml[data-run] .m6tml-t33 { animation-delay: 1.98s; }
.m6tml[data-run] .m6tml-t34 { animation-delay: 2.04s; }
.m6tml[data-run] .m6tml-t35 { animation-delay: 2.10s; }
`;

// Runs before paint in the browser so the chart never flashes finished before it plays.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function FurnitureRestorationTimelineWithStagesLighting() {
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
    const btn = root.querySelector(".m6tml-replay");
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
    <section ref={rootRef} className="m6tml">
      <style>{CSS}</style>
<div className="m6tml-wrap">
  <div className="m6tml-head">
    <p className="m6tml-eyebrow">Hollis Restoration · Chairs</p>
    <h2 className="m6tml-h">Two weeks from collection to return</h2>
    <p className="m6tml-lede">A typical dining chair moves through five stages in the workshop. Larger pieces take longer at the repair stage.</p>
  </div>
  <div className="m6tml-tl">
    <span className="m6tml-rail" aria-hidden="true"><i className="m6tml-fill m6tml-gx"></i></span>
    <ol className="m6tml-stages" aria-label="Restoration stages in order">
    <li className="m6tml-stage">
      <span className="m6tml-node" aria-hidden="true"><i className="m6tml-ring"></i><i className="m6tml-core m6tml-pop m6tml-k0"></i></span>
      <span className="m6tml-day m6tml-f m6tml-k0">Day 1</span>
      <h3 className="m6tml-sh">Assess</h3>
      <p className="m6tml-sp">We check the frame, joints and finish and agree the work with you.</p>
    </li>
    <li className="m6tml-stage">
      <span className="m6tml-node" aria-hidden="true"><i className="m6tml-ring"></i><i className="m6tml-core m6tml-pop m6tml-k1"></i></span>
      <span className="m6tml-day m6tml-f m6tml-k1">Days 2 to 4</span>
      <h3 className="m6tml-sh">Strip</h3>
      <p className="m6tml-sp">Old varnish comes off by hand so the grain is not scoured.</p>
    </li>
    <li className="m6tml-stage">
      <span className="m6tml-node" aria-hidden="true"><i className="m6tml-ring"></i><i className="m6tml-core m6tml-pop m6tml-k2"></i></span>
      <span className="m6tml-day m6tml-f m6tml-k2">Days 5 to 9</span>
      <h3 className="m6tml-sh">Repair</h3>
      <p className="m6tml-sp">Loose joints are reglued and a cracked rail is spliced.</p>
    </li>
    <li className="m6tml-stage">
      <span className="m6tml-node" aria-hidden="true"><i className="m6tml-ring"></i><i className="m6tml-core m6tml-pop m6tml-k3"></i></span>
      <span className="m6tml-day m6tml-f m6tml-k3">Days 10 to 13</span>
      <h3 className="m6tml-sh">Finish</h3>
      <p className="m6tml-sp">Three thin coats of oil, rubbed back between each one.</p>
    </li>
    <li className="m6tml-stage">
      <span className="m6tml-node" aria-hidden="true"><i className="m6tml-ring"></i><i className="m6tml-core m6tml-pop m6tml-k4"></i></span>
      <span className="m6tml-day m6tml-f m6tml-k4">Day 14</span>
      <h3 className="m6tml-sh">Return</h3>
      <p className="m6tml-sp">We deliver the chair and show you how to care for it.</p>
    </li>
    </ol>
  </div>
  <p className="m6tml-cap">Sample timings for an invented workshop, counted in working days.</p>
</div>
<button type="button" className="m6tml-replay" aria-label="Replay the timeline"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

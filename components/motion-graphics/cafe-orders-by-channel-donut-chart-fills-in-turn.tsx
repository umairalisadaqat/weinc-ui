import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the four segment colours at the top of .m6dnt, and each segment's --m6dnt-len and rotate() (a share minus the 0.9 gap, rotated by the shares before it times 3.6).
const CSS = `
.m6dnt { --m6dnt-bg: #0f1b30; --m6dnt-card: #16243d; --m6dnt-ink: #f3efe6; --m6dnt-quiet: #b9c1cf; --m6dnt-line: #2d3d5a; --m6dnt-focus: #f3efe6; --m6dnt-a: #f0c48c; --m6dnt-b: #e07c5c; --m6dnt-c: #8db4cc; --m6dnt-d: #d7d2c6; }
.m6dnt { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; font-variant-numeric: tabular-nums; }
.m6dnt *, .m6dnt *::before, .m6dnt *::after { box-sizing: border-box; }
.m6dnt svg { display: block; overflow: visible; }
.m6dnt-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.m6dnt-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m6dnt-line); border-radius: 999px; background: transparent; color: var(--m6dnt-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m6dnt-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m6dnt-replay:hover { color: var(--m6dnt-ink); }
.m6dnt-replay:focus-visible { outline: 2px solid var(--m6dnt-focus); outline-offset: 2px; }
/* Start state, only when motion is allowed and the script is running, so the chart is never blank without it. */
@media (prefers-reduced-motion: no-preference) {
  .m6dnt.is-js:not([data-run]) .m6dnt-gy { transform: scaleY(0); }
  .m6dnt.is-js:not([data-run]) .m6dnt-gx { transform: scaleX(0); }
  .m6dnt.is-js:not([data-run]) .m6dnt-f { opacity: 0; }
  .m6dnt.is-js:not([data-run]) .m6dnt-o { opacity: 0; }
  .m6dnt.is-js:not([data-run]) .m6dnt-d { stroke-dashoffset: var(--m6dnt-len, 1); }
  .m6dnt.is-js:not([data-run]) .m6dnt-pop { opacity: 0; }
}
.m6dnt[data-run] .m6dnt-gy { animation: m6dnt-gy .75s cubic-bezier(.2, .75, .25, 1) both; }
.m6dnt[data-run] .m6dnt-gx { animation: m6dnt-gx .75s cubic-bezier(.2, .75, .25, 1) both; }
.m6dnt[data-run] .m6dnt-f { animation: m6dnt-f .45s ease-out both; }
.m6dnt[data-run] .m6dnt-o { animation: m6dnt-o .6s ease-out both; }
.m6dnt[data-run] .m6dnt-d { animation: m6dnt-d .7s cubic-bezier(.45, .05, .3, 1) both; }
.m6dnt[data-run] .m6dnt-pop { animation: m6dnt-pop .4s cubic-bezier(.2, .8, .3, 1.2) both; }
@keyframes m6dnt-gy { from { transform: scaleY(0); } to { transform: none; } }
@keyframes m6dnt-gx { from { transform: scaleX(0); } to { transform: none; } }
@keyframes m6dnt-f { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@keyframes m6dnt-o { from { opacity: 0; } to { opacity: 1; } }
@keyframes m6dnt-d { from { stroke-dashoffset: var(--m6dnt-len, 1); } to { stroke-dashoffset: 0; } }
@keyframes m6dnt-pop { from { opacity: 0; transform: scale(.3); } to { opacity: 1; transform: none; } }
/* Paused while scrolled out of view. */
.m6dnt[data-off] * { animation-play-state: paused !important; }
/* Reduced motion: the finished chart at its values, nothing moves. */
@media (prefers-reduced-motion: reduce) {
  .m6dnt *, .m6dnt *::before, .m6dnt *::after { animation: none !important; transition: none !important; }
  .m6dnt-replay { display: none; }
}

.m6dnt { background: var(--m6dnt-bg); color: var(--m6dnt-ink); padding: 48px clamp(16px, 4vw, 48px) 80px; }
.m6dnt-card { max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); gap: 44px; align-items: center; padding: 36px clamp(18px, 4vw, 44px); background: var(--m6dnt-card); border: 1px solid var(--m6dnt-line); border-radius: 16px; box-shadow: 0 30px 60px -36px rgba(0, 0, 0, .7); }
.m6dnt-fig { margin: 0; }
.m6dnt-chart { position: relative; width: min(100%, 320px); margin: 0 auto; aspect-ratio: 1; }
.m6dnt-svg { width: 100%; height: 100%; }
.m6dnt-track { fill: none; stroke: var(--m6dnt-line); stroke-width: 26; }
.m6dnt-seg { fill: none; stroke-width: 26; stroke-dashoffset: 0; }
.m6dnt[data-run] .m6dnt-seg { animation-duration: .5s; animation-timing-function: cubic-bezier(.4, 0, .3, 1); }
.m6dnt-sa { stroke: var(--m6dnt-a); } .m6dnt-sb { stroke: var(--m6dnt-b); } .m6dnt-sc { stroke: var(--m6dnt-c); } .m6dnt-sd { stroke: var(--m6dnt-d); }
.m6dnt-mid { position: absolute; inset: 0; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.m6dnt-mid b { font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(38px, 6vw, 50px); line-height: 1; }
.m6dnt-mid span { margin-top: 6px; font-size: 13.5px; color: var(--m6dnt-quiet); }
.m6dnt-eyebrow { margin: 0 0 8px; font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--m6dnt-quiet); }
.m6dnt-h { margin: 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(27px, 3.4vw, 36px); line-height: 1.1; }
.m6dnt-lede { margin: 12px 0 0; font-size: 15px; line-height: 1.55; color: var(--m6dnt-quiet); }
.m6dnt-legend { list-style: none; margin: 22px 0 0; padding: 0; }
.m6dnt-legend li { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-top: 1px solid var(--m6dnt-line); font-size: 15px; }
.m6dnt-sw { width: 12px; height: 12px; border-radius: 50%; flex: none; }
.m6dnt-wa { background: var(--m6dnt-a); } .m6dnt-wb { background: var(--m6dnt-b); } .m6dnt-wc { background: var(--m6dnt-c); } .m6dnt-wd { background: var(--m6dnt-d); }
.m6dnt-ln { flex: 1; }
.m6dnt-pc { font-weight: 650; }
.m6dnt-cap { margin: 14px 0 0; font-size: 12.5px; color: var(--m6dnt-quiet); }
.m6dnt .m6dnt-replay { border-color: #3a4c6c; }
@media (max-width: 680px) {
  .m6dnt-card { grid-template-columns: 1fr; gap: 28px; }
  .m6dnt-chart { width: min(100%, 260px); }
}
.m6dnt-sa { --m6dnt-len: 45.1; stroke-dasharray: 45.1 100; }
.m6dnt-sb { --m6dnt-len: 26.1; stroke-dasharray: 26.1 100; }
.m6dnt-sc { --m6dnt-len: 18.1; stroke-dasharray: 18.1 100; }
.m6dnt-sd { --m6dnt-len: 7.1; stroke-dasharray: 7.1 100; }
.m6dnt[data-run] .m6dnt-t0 { animation-delay: 0.00s; }
.m6dnt[data-run] .m6dnt-t1 { animation-delay: 0.08s; }
.m6dnt[data-run] .m6dnt-t2 { animation-delay: 0.16s; }
.m6dnt[data-run] .m6dnt-t3 { animation-delay: 0.24s; }
.m6dnt[data-run] .m6dnt-t4 { animation-delay: 0.32s; }
.m6dnt[data-run] .m6dnt-t5 { animation-delay: 0.40s; }
.m6dnt[data-run] .m6dnt-t6 { animation-delay: 0.48s; }
.m6dnt[data-run] .m6dnt-t7 { animation-delay: 0.56s; }
.m6dnt[data-run] .m6dnt-t8 { animation-delay: 0.64s; }
.m6dnt[data-run] .m6dnt-t9 { animation-delay: 0.72s; }
.m6dnt[data-run] .m6dnt-t10 { animation-delay: 0.80s; }
.m6dnt[data-run] .m6dnt-t11 { animation-delay: 0.88s; }
.m6dnt[data-run] .m6dnt-t12 { animation-delay: 0.96s; }
.m6dnt[data-run] .m6dnt-t13 { animation-delay: 1.04s; }
.m6dnt[data-run] .m6dnt-t14 { animation-delay: 1.12s; }
.m6dnt[data-run] .m6dnt-t15 { animation-delay: 1.20s; }
.m6dnt[data-run] .m6dnt-t16 { animation-delay: 1.28s; }
.m6dnt[data-run] .m6dnt-t17 { animation-delay: 1.36s; }
.m6dnt[data-run] .m6dnt-t18 { animation-delay: 1.44s; }
.m6dnt[data-run] .m6dnt-t19 { animation-delay: 1.52s; }
.m6dnt[data-run] .m6dnt-t20 { animation-delay: 1.60s; }
.m6dnt[data-run] .m6dnt-t21 { animation-delay: 1.68s; }
.m6dnt[data-run] .m6dnt-t22 { animation-delay: 1.76s; }
.m6dnt[data-run] .m6dnt-t23 { animation-delay: 1.84s; }
.m6dnt[data-run] .m6dnt-t24 { animation-delay: 1.92s; }
.m6dnt[data-run] .m6dnt-t25 { animation-delay: 2.00s; }
.m6dnt[data-run] .m6dnt-t26 { animation-delay: 2.08s; }
.m6dnt[data-run] .m6dnt-t27 { animation-delay: 2.16s; }
.m6dnt[data-run] .m6dnt-t28 { animation-delay: 2.24s; }
.m6dnt[data-run] .m6dnt-t29 { animation-delay: 2.32s; }
.m6dnt[data-run] .m6dnt-t30 { animation-delay: 2.40s; }
.m6dnt[data-run] .m6dnt-t31 { animation-delay: 2.48s; }
.m6dnt[data-run] .m6dnt-t32 { animation-delay: 2.56s; }
.m6dnt[data-run] .m6dnt-t33 { animation-delay: 2.64s; }
.m6dnt[data-run] .m6dnt-t34 { animation-delay: 2.72s; }
.m6dnt[data-run] .m6dnt-t35 { animation-delay: 2.80s; }
`;

// Runs before paint in the browser so the chart never flashes finished before it plays.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function CafeOrdersByChannelDonutChart() {
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
    const btn = root.querySelector(".m6dnt-replay");
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
    <section ref={rootRef} className="m6dnt">
      <style>{CSS}</style>
<div className="m6dnt-card">
  <figure className="m6dnt-fig">
    <div className="m6dnt-chart" role="img" aria-label="Donut chart of orders by channel in May. Counter 46%, order ahead 27%, delivery 19% and catering 8%.">
      <svg className="m6dnt-svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
        <circle className="m6dnt-track" cx="100" cy="100" r="78"/>
        <circle className="m6dnt-seg m6dnt-sa m6dnt-d m6dnt-t0" cx="100" cy="100" r="78" pathLength="100" transform="rotate(-90.0 100 100)"/>
        <circle className="m6dnt-seg m6dnt-sb m6dnt-d m6dnt-t4" cx="100" cy="100" r="78" pathLength="100" transform="rotate(75.6 100 100)"/>
        <circle className="m6dnt-seg m6dnt-sc m6dnt-d m6dnt-t8" cx="100" cy="100" r="78" pathLength="100" transform="rotate(172.8 100 100)"/>
        <circle className="m6dnt-seg m6dnt-sd m6dnt-d m6dnt-t12" cx="100" cy="100" r="78" pathLength="100" transform="rotate(241.2 100 100)"/>
      </svg>
      <p className="m6dnt-mid m6dnt-f m6dnt-t6" aria-hidden="true"><b>46%</b><span>at the counter</span></p>
    </div>
    <ul className="m6dnt-sr">
      <li>Counter: 46%</li>
      <li>Order ahead: 27%</li>
      <li>Delivery: 19%</li>
      <li>Catering: 8%</li>
    </ul>
  </figure>
  <div className="m6dnt-side">
    <p className="m6dnt-eyebrow">Harbour Street Café · May</p>
    <h2 className="m6dnt-h">How orders reached us</h2>
    <p className="m6dnt-lede">Nearly half of all orders were still placed at the counter; order ahead was the next biggest channel.</p>
    <ul className="m6dnt-legend" aria-hidden="true">
      <li className="m6dnt-f m6dnt-t3"><i className="m6dnt-sw m6dnt-wa"></i><span className="m6dnt-ln">Counter</span><span className="m6dnt-pc">46%</span></li>
      <li className="m6dnt-f m6dnt-t7"><i className="m6dnt-sw m6dnt-wb"></i><span className="m6dnt-ln">Order ahead</span><span className="m6dnt-pc">27%</span></li>
      <li className="m6dnt-f m6dnt-t11"><i className="m6dnt-sw m6dnt-wc"></i><span className="m6dnt-ln">Delivery</span><span className="m6dnt-pc">19%</span></li>
      <li className="m6dnt-f m6dnt-t15"><i className="m6dnt-sw m6dnt-wd"></i><span className="m6dnt-ln">Catering</span><span className="m6dnt-pc">8%</span></li>
    </ul>
    <p className="m6dnt-cap">Sample figures for an invented café. Share of all orders in the month.</p>
  </div>
</div>
<button type="button" className="m6dnt-replay" aria-label="Replay the chart"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

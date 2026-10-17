import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the terracotta line colour at the top of .m6flw, the four steps and the time on each connector, and the 1.6s loop on .m6flw-dash.
const CSS = `
.m6flw { --m6flw-bg: #efe5d6; --m6flw-card: #fbf6ee; --m6flw-ink: #2b2118; --m6flw-quiet: #625446; --m6flw-line: #dccdb8; --m6flw-focus: #2b2118; --m6flw-wire: #b5562f; }
.m6flw { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; font-variant-numeric: tabular-nums; }
.m6flw *, .m6flw *::before, .m6flw *::after { box-sizing: border-box; }
.m6flw svg { display: block; overflow: visible; }
.m6flw-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.m6flw-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m6flw-line); border-radius: 999px; background: transparent; color: var(--m6flw-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m6flw-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m6flw-replay:hover { color: var(--m6flw-ink); }
.m6flw-replay:focus-visible { outline: 2px solid var(--m6flw-focus); outline-offset: 2px; }
/* Start state, only when motion is allowed and the script is running, so the chart is never blank without it. */
@media (prefers-reduced-motion: no-preference) {
  .m6flw.is-js:not([data-run]) .m6flw-gy { transform: scaleY(0); }
  .m6flw.is-js:not([data-run]) .m6flw-gx { transform: scaleX(0); }
  .m6flw.is-js:not([data-run]) .m6flw-f { opacity: 0; }
  .m6flw.is-js:not([data-run]) .m6flw-o { opacity: 0; }
  .m6flw.is-js:not([data-run]) .m6flw-d { stroke-dashoffset: var(--m6flw-len, 1); }
  .m6flw.is-js:not([data-run]) .m6flw-pop { opacity: 0; }
}
.m6flw[data-run] .m6flw-gy { animation: m6flw-gy .75s cubic-bezier(.2, .75, .25, 1) both; }
.m6flw[data-run] .m6flw-gx { animation: m6flw-gx .75s cubic-bezier(.2, .75, .25, 1) both; }
.m6flw[data-run] .m6flw-f { animation: m6flw-f .45s ease-out both; }
.m6flw[data-run] .m6flw-o { animation: m6flw-o .6s ease-out both; }
.m6flw[data-run] .m6flw-d { animation: m6flw-d .7s cubic-bezier(.45, .05, .3, 1) both; }
.m6flw[data-run] .m6flw-pop { animation: m6flw-pop .4s cubic-bezier(.2, .8, .3, 1.2) both; }
@keyframes m6flw-gy { from { transform: scaleY(0); } to { transform: none; } }
@keyframes m6flw-gx { from { transform: scaleX(0); } to { transform: none; } }
@keyframes m6flw-f { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@keyframes m6flw-o { from { opacity: 0; } to { opacity: 1; } }
@keyframes m6flw-d { from { stroke-dashoffset: var(--m6flw-len, 1); } to { stroke-dashoffset: 0; } }
@keyframes m6flw-pop { from { opacity: 0; transform: scale(.3); } to { opacity: 1; transform: none; } }
/* Paused while scrolled out of view. */
.m6flw[data-off] * { animation-play-state: paused !important; }
/* Reduced motion: the finished chart at its values, nothing moves. */
@media (prefers-reduced-motion: reduce) {
  .m6flw *, .m6flw *::before, .m6flw *::after { animation: none !important; transition: none !important; }
  .m6flw-replay { display: none; }
}

.m6flw { background: var(--m6flw-bg); color: var(--m6flw-ink); padding: 52px clamp(16px, 4vw, 56px) 84px; }
.m6flw-wrap { max-width: 1120px; margin: 0 auto; }
.m6flw-eyebrow { margin: 0 0 8px; font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--m6flw-wire); }
.m6flw-h { margin: 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(28px, 3.6vw, 38px); line-height: 1.1; }
.m6flw-lede { margin: 12px 0 0; font-size: 15.5px; line-height: 1.55; color: var(--m6flw-quiet); max-width: 36em; }
.m6flw-flow { list-style: none; margin: 34px 0 0; padding: 0; display: grid; grid-template-columns: minmax(0, 1fr) 76px minmax(0, 1fr) 76px minmax(0, 1fr) 76px minmax(0, 1fr); align-items: stretch; }
.m6flw-node { padding: 20px 18px 22px; background: var(--m6flw-card); border: 1px solid var(--m6flw-line); border-radius: 12px; box-shadow: 0 18px 30px -26px rgba(43, 33, 24, .55); }
.m6flw-ic { width: 32px; height: 32px; fill: none; stroke: var(--m6flw-ink); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m6flw-step { display: block; margin-top: 14px; font-size: 11.5px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--m6flw-quiet); }
.m6flw-nh { margin: 4px 0 0; font-size: 17px; font-weight: 650; }
.m6flw-np { margin: 6px 0 0; font-size: 14px; line-height: 1.5; color: var(--m6flw-quiet); }
.m6flw-link { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
.m6flw-wire { width: 64px; height: 24px; }
.m6flw-wire path { fill: none; stroke: var(--m6flw-wire); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.m6flw-dash { stroke-dasharray: 3 7; }
/* The only loop: the dash pattern slides toward the arrow head, paused off screen. */
.m6flw[data-run] .m6flw-dash { animation: m6flw-flow 1.6s linear infinite; }
@keyframes m6flw-flow { from { stroke-dashoffset: 10; } to { stroke-dashoffset: 0; } }
.m6flw-time { font-size: 12px; font-weight: 600; color: var(--m6flw-wire); white-space: nowrap; }
.m6flw-cap { margin: 28px 0 0; padding-top: 14px; border-top: 1px solid var(--m6flw-line); font-size: 12.5px; color: var(--m6flw-quiet); padding-right: 110px; }
@media (max-width: 860px) {
  .m6flw-flow { grid-template-columns: 1fr; max-width: 460px; }
  .m6flw-link { flex-direction: row; height: 56px; gap: 10px; }
  .m6flw-wire { transform: rotate(90deg); width: 44px; }
}

.m6flw[data-run] .m6flw-t0 { animation-delay: 0.00s; }
.m6flw[data-run] .m6flw-t1 { animation-delay: 0.10s; }
.m6flw[data-run] .m6flw-t2 { animation-delay: 0.20s; }
.m6flw[data-run] .m6flw-t3 { animation-delay: 0.30s; }
.m6flw[data-run] .m6flw-t4 { animation-delay: 0.40s; }
.m6flw[data-run] .m6flw-t5 { animation-delay: 0.50s; }
.m6flw[data-run] .m6flw-t6 { animation-delay: 0.60s; }
.m6flw[data-run] .m6flw-t7 { animation-delay: 0.70s; }
.m6flw[data-run] .m6flw-t8 { animation-delay: 0.80s; }
.m6flw[data-run] .m6flw-t9 { animation-delay: 0.90s; }
.m6flw[data-run] .m6flw-t10 { animation-delay: 1.00s; }
.m6flw[data-run] .m6flw-t11 { animation-delay: 1.10s; }
.m6flw[data-run] .m6flw-t12 { animation-delay: 1.20s; }
.m6flw[data-run] .m6flw-t13 { animation-delay: 1.30s; }
.m6flw[data-run] .m6flw-t14 { animation-delay: 1.40s; }
.m6flw[data-run] .m6flw-t15 { animation-delay: 1.50s; }
.m6flw[data-run] .m6flw-t16 { animation-delay: 1.60s; }
.m6flw[data-run] .m6flw-t17 { animation-delay: 1.70s; }
.m6flw[data-run] .m6flw-t18 { animation-delay: 1.80s; }
.m6flw[data-run] .m6flw-t19 { animation-delay: 1.90s; }
.m6flw[data-run] .m6flw-t20 { animation-delay: 2.00s; }
.m6flw[data-run] .m6flw-t21 { animation-delay: 2.10s; }
.m6flw[data-run] .m6flw-t22 { animation-delay: 2.20s; }
.m6flw[data-run] .m6flw-t23 { animation-delay: 2.30s; }
.m6flw[data-run] .m6flw-t24 { animation-delay: 2.40s; }
.m6flw[data-run] .m6flw-t25 { animation-delay: 2.50s; }
.m6flw[data-run] .m6flw-t26 { animation-delay: 2.60s; }
.m6flw[data-run] .m6flw-t27 { animation-delay: 2.70s; }
.m6flw[data-run] .m6flw-t28 { animation-delay: 2.80s; }
.m6flw[data-run] .m6flw-t29 { animation-delay: 2.90s; }
.m6flw[data-run] .m6flw-t30 { animation-delay: 3.00s; }
.m6flw[data-run] .m6flw-t31 { animation-delay: 3.10s; }
.m6flw[data-run] .m6flw-t32 { animation-delay: 3.20s; }
.m6flw[data-run] .m6flw-t33 { animation-delay: 3.30s; }
.m6flw[data-run] .m6flw-t34 { animation-delay: 3.40s; }
.m6flw[data-run] .m6flw-t35 { animation-delay: 3.50s; }
`;

// Runs before paint in the browser so the chart never flashes finished before it plays.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function NoodleOrderFlowDiagramWithMoving() {
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
    const btn = root.querySelector(".m6flw-replay");
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
    <section ref={rootRef} className="m6flw">
      <style>{CSS}</style>
<div className="m6flw-wrap">
  <div className="m6flw-head">
    <p className="m6flw-eyebrow">Hanami Noodle House · Delivery</p>
    <h2 className="m6flw-h">How your order gets to you</h2>
    <p className="m6flw-lede">Four hand-offs between the moment you order and the knock at the door. Times are typical on a weekday evening.</p>
  </div>
  <ol className="m6flw-flow" aria-label="Order journey in four steps">
    <li className="m6flw-node m6flw-f m6flw-t0">
      <svg className="m6flw-ic" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M8 4H24V28L20 25.5L16 28L12 25.5L8 28Z"/><path d="M12 10H20M12 15H20M12 20H17"/></svg>
      <span className="m6flw-step">Step 1</span>
      <h3 className="m6flw-nh">Order placed</h3>
      <p className="m6flw-np">You order on the site or by phone and get a confirmation text.</p>
    </li>
    <li className="m6flw-link m6flw-o m6flw-t2" aria-label="then, about 2 min">
      <svg className="m6flw-wire" viewBox="0 0 64 24" aria-hidden="true" focusable="false"><path className="m6flw-dash" d="M4 12H50"/><path className="m6flw-tip" d="M47 6L55 12L47 18"/></svg>
      <span className="m6flw-time" aria-hidden="true">about 2 min</span>
    </li>
    <li className="m6flw-node m6flw-f m6flw-t3">
      <svg className="m6flw-ic" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M5 15H27C27 21.5 22 26 16 26C10 26 5 21.5 5 15Z"/><path d="M11 11C11 9 13 9 13 7M17 11C17 9 19 9 19 7"/><path d="M12 26V28H20V26"/></svg>
      <span className="m6flw-step">Step 2</span>
      <h3 className="m6flw-nh">Kitchen</h3>
      <p className="m6flw-np">Noodles are cooked to order and packed with the broth kept apart.</p>
    </li>
    <li className="m6flw-link m6flw-o m6flw-t5" aria-label="then, about 12 min">
      <svg className="m6flw-wire" viewBox="0 0 64 24" aria-hidden="true" focusable="false"><path className="m6flw-dash" d="M4 12H50"/><path className="m6flw-tip" d="M47 6L55 12L47 18"/></svg>
      <span className="m6flw-time" aria-hidden="true">about 12 min</span>
    </li>
    <li className="m6flw-node m6flw-f m6flw-t6">
      <svg className="m6flw-ic" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><circle cx="8" cy="22" r="5"/><circle cx="24" cy="22" r="5"/><path d="M8 22L13 12H20L24 22M13 12L16 22H8M18 8H22"/></svg>
      <span className="m6flw-step">Step 3</span>
      <h3 className="m6flw-nh">Courier</h3>
      <p className="m6flw-np">A rider collects the bag in an insulated box and heads your way.</p>
    </li>
    <li className="m6flw-link m6flw-o m6flw-t8" aria-label="then, about 15 min">
      <svg className="m6flw-wire" viewBox="0 0 64 24" aria-hidden="true" focusable="false"><path className="m6flw-dash" d="M4 12H50"/><path className="m6flw-tip" d="M47 6L55 12L47 18"/></svg>
      <span className="m6flw-time" aria-hidden="true">about 15 min</span>
    </li>
    <li className="m6flw-node m6flw-f m6flw-t9">
      <svg className="m6flw-ic" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M8 28V5H24V28M5 28H27"/><circle cx="19.5" cy="17" r="1.2"/></svg>
      <span className="m6flw-step">Step 4</span>
      <h3 className="m6flw-nh">Your door</h3>
      <p className="m6flw-np">The rider rings once and leaves it with you, still hot.</p>
    </li>
  </ol>
  <p className="m6flw-cap">Sample figures for an invented restaurant. Times vary with distance and weather.</p>
</div>
<button type="button" className="m6flw-replay" aria-label="Replay the diagram"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

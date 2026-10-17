import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the terracotta line and cream colours at the top of .m4srch, and the search words in the field and heading.
const CSS = `
.m4srch { --m4srch-bg: #f6efe6; --m4srch-panel: #fffaf3; --m4srch-ink: #2b211c; --m4srch-quiet: #66574c; --m4srch-line: #e6d9c8; --m4srch-focus: #a5482a; --m4srch-pen: #a5482a; }
.m4srch { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
.m4srch *, .m4srch *::before, .m4srch *::after { box-sizing: border-box; }
.m4srch svg { display: block; }
.m4srch .m4srch-s { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 0; }
.m4srch-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m4srch-line); border-radius: 999px; background: var(--m4srch-replaybg, transparent); color: var(--m4srch-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m4srch-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m4srch-replay:hover { color: var(--m4srch-ink); }
.m4srch-replay:focus-visible { outline: 2px solid var(--m4srch-focus); outline-offset: 2px; }
/* Hidden until the drawing starts, only when motion is allowed and the script is running. */
@media (prefers-reduced-motion: no-preference) {
  .m4srch.is-js:not([data-run]) .m4srch-s { stroke-dashoffset: 1; }
  .m4srch.is-js:not([data-run]) .m4srch-f { opacity: 0; }
}
.m4srch[data-run] .m4srch-s { animation: m4srch-draw .6s cubic-bezier(.5, .05, .3, 1) both; }
.m4srch[data-run] .m4srch-f { animation: m4srch-fade .5s ease-out both; }
.m4srch[data-run] .m4srch-slow { animation-duration: 1s; }
.m4srch[data-run] .m4srch-quick { animation-duration: .35s; }
@keyframes m4srch-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes m4srch-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
/* Paused while scrolled out of view. */
.m4srch[data-off] * { animation-play-state: paused !important; }
/* Reduced motion: the finished drawing, no movement. */
@media (prefers-reduced-motion: reduce) {
  .m4srch *, .m4srch *::before, .m4srch *::after { animation: none !important; transition: none !important; }
  .m4srch-replay { display: none; }
}

.m4srch { background: var(--m4srch-bg); color: var(--m4srch-ink); padding: 40px clamp(14px, 4vw, 48px) 76px; }
.m4srch-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.m4srch-shop { max-width: 880px; margin: 0 auto; background: var(--m4srch-panel); border: 1px solid var(--m4srch-line); border-radius: 14px; box-shadow: 0 22px 44px -34px rgba(43, 33, 28, .45); }
.m4srch-top { display: flex; align-items: center; gap: 20px; padding: 16px 22px; border-bottom: 1px solid var(--m4srch-line); }
.m4srch-brand { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: 20px; white-space: nowrap; }
.m4srch-form { flex: 1; display: flex; gap: 8px; min-width: 0; }
.m4srch-input { flex: 1; min-width: 0; min-height: 42px; padding: 0 14px; border: 1px solid #d6c6b2; border-radius: 10px; background: #fff; color: var(--m4srch-ink); font: inherit; font-size: 15px; }
.m4srch-input:focus-visible, .m4srch-go:focus-visible, .m4srch a:focus-visible { outline: 2px solid var(--m4srch-focus); outline-offset: 2px; }
.m4srch-go { min-height: 42px; padding: 0 16px; border: 0; border-radius: 10px; background: var(--m4srch-ink); color: #fffaf3; font: inherit; font-size: 14.5px; font-weight: 600; cursor: pointer; }
.m4srch-meta { margin: 0; padding: 14px 22px 0; font-size: 13.5px; color: var(--m4srch-quiet); }
.m4srch-empty { padding: 20px 24px 48px; text-align: center; }
.m4srch-art { width: 240px; max-width: 72%; height: auto; margin: 0 auto 10px; }
.m4srch-art .m4srch-s { stroke: var(--m4srch-pen); stroke-width: 2; }
.m4srch-art .m4srch-thin { stroke-width: 1.4; }
.m4srch-art .m4srch-lens { stroke: var(--m4srch-ink); stroke-width: 2.2; }
.m4srch-art .m4srch-handle { stroke: var(--m4srch-ink); stroke-width: 4.5; }
.m4srch-h { margin: 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(22px, 3vw, 28px); line-height: 1.2; }
.m4srch-p { margin: 10px auto 0; max-width: 28em; font-size: 15px; line-height: 1.6; color: var(--m4srch-quiet); }
.m4srch-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 22px; }
.m4srch-btn, .m4srch-ghost { display: inline-flex; align-items: center; min-height: 42px; padding: 0 18px; border-radius: 999px; font-size: 14.5px; font-weight: 600; text-decoration: none; }
.m4srch-btn { background: var(--m4srch-pen); color: #fffaf3; }
.m4srch-btn:hover { background: #8c3c22; }
.m4srch-ghost { color: var(--m4srch-ink); border: 1px solid #d6c6b2; }
@media (max-width: 600px) {
  .m4srch-top { flex-direction: column; align-items: stretch; gap: 12px; }
}

.m4srch[data-run] .m4srch-t0 { animation-delay: 0.00s; }
.m4srch[data-run] .m4srch-t1 { animation-delay: 0.05s; }
.m4srch[data-run] .m4srch-t2 { animation-delay: 0.10s; }
.m4srch[data-run] .m4srch-t3 { animation-delay: 0.15s; }
.m4srch[data-run] .m4srch-t4 { animation-delay: 0.20s; }
.m4srch[data-run] .m4srch-t5 { animation-delay: 0.25s; }
.m4srch[data-run] .m4srch-t6 { animation-delay: 0.30s; }
.m4srch[data-run] .m4srch-t7 { animation-delay: 0.35s; }
.m4srch[data-run] .m4srch-t8 { animation-delay: 0.40s; }
.m4srch[data-run] .m4srch-t9 { animation-delay: 0.45s; }
.m4srch[data-run] .m4srch-t10 { animation-delay: 0.50s; }
.m4srch[data-run] .m4srch-t11 { animation-delay: 0.55s; }
.m4srch[data-run] .m4srch-t12 { animation-delay: 0.60s; }
.m4srch[data-run] .m4srch-t13 { animation-delay: 0.65s; }
.m4srch[data-run] .m4srch-t14 { animation-delay: 0.70s; }
.m4srch[data-run] .m4srch-t15 { animation-delay: 0.75s; }
.m4srch[data-run] .m4srch-t16 { animation-delay: 0.80s; }
.m4srch[data-run] .m4srch-t17 { animation-delay: 0.85s; }
.m4srch[data-run] .m4srch-t18 { animation-delay: 0.90s; }
.m4srch[data-run] .m4srch-t19 { animation-delay: 0.95s; }
.m4srch[data-run] .m4srch-t20 { animation-delay: 1.00s; }
.m4srch[data-run] .m4srch-t21 { animation-delay: 1.05s; }
.m4srch[data-run] .m4srch-t22 { animation-delay: 1.10s; }
.m4srch[data-run] .m4srch-t23 { animation-delay: 1.15s; }
.m4srch[data-run] .m4srch-t24 { animation-delay: 1.20s; }
.m4srch[data-run] .m4srch-t25 { animation-delay: 1.25s; }
.m4srch[data-run] .m4srch-t26 { animation-delay: 1.30s; }
.m4srch[data-run] .m4srch-t27 { animation-delay: 1.35s; }
.m4srch[data-run] .m4srch-t28 { animation-delay: 1.40s; }
.m4srch[data-run] .m4srch-t29 { animation-delay: 1.45s; }
.m4srch[data-run] .m4srch-t30 { animation-delay: 1.50s; }
.m4srch[data-run] .m4srch-t31 { animation-delay: 1.55s; }
.m4srch[data-run] .m4srch-t32 { animation-delay: 1.60s; }
.m4srch[data-run] .m4srch-t33 { animation-delay: 1.65s; }
.m4srch[data-run] .m4srch-t34 { animation-delay: 1.70s; }
.m4srch[data-run] .m4srch-t35 { animation-delay: 1.75s; }
.m4srch[data-run] .m4srch-t36 { animation-delay: 1.80s; }
.m4srch[data-run] .m4srch-t37 { animation-delay: 1.85s; }
.m4srch[data-run] .m4srch-t38 { animation-delay: 1.90s; }
.m4srch[data-run] .m4srch-t39 { animation-delay: 1.95s; }
`;

// Runs before paint in the browser so the drawing never flashes finished before it starts.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function NoSearchResultsStateWithEmpty() {
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
    const btn = root.querySelector(".m4srch-replay");
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
    <section ref={rootRef} className="m4srch">
      <style>{CSS}</style>
<div className="m4srch-shop">
  <header className="m4srch-top">
    <p className="m4srch-brand">Marlow &amp; Weft</p>
    <form className="m4srch-form" role="search" action="#" onSubmit={(e) => e.preventDefault()}>
      <label className="m4srch-sr" htmlFor="m4srch-q">Search the shop</label>
      <input className="m4srch-input" id="m4srch-q" type="search" defaultValue="linen apron xs" autoComplete="off"/>
      <button className="m4srch-go" type="submit">Search</button>
    </form>
  </header>
  <p className="m4srch-meta">0 results</p>
  <div className="m4srch-empty">
    <svg className="m4srch-art" viewBox="0 0 260 180" aria-hidden="true" focusable="false">
      <path className="m4srch-s m4srch-t0" d="M52 40H208" pathLength="1"/>
      <path className="m4srch-s m4srch-t1 m4srch-quick" d="M62 40V152M198 40V152" pathLength="1"/>
      <path className="m4srch-s m4srch-t3 m4srch-quick" d="M42 158L62 152L82 158M178 158L198 152L218 158" pathLength="1"/>
      <path className="m4srch-s m4srch-t4 m4srch-thin" d="M86 37C86 31 94 31 94 37C94 41 90 42 90 47" pathLength="1"/>
      <path className="m4srch-s m4srch-t5" d="M90 47L70.5 61.5C69 62.6 69.6 65 71.5 65H108.5C110.4 65 111 62.6 109.5 61.5Z" pathLength="1"/>
      <g transform="rotate(6 132 40)">
        <path className="m4srch-s m4srch-t6 m4srch-thin" d="M128 37C128 31 136 31 136 37C136 41 132 42 132 47" pathLength="1"/>
        <path className="m4srch-s m4srch-t7" d="M132 47L112.5 61.5C111 62.6 111.6 65 113.5 65H150.5C152.4 65 153 62.6 151.5 61.5Z" pathLength="1"/>
      </g>
      <path className="m4srch-s m4srch-t8 m4srch-thin" d="M170 37C170 31 178 31 178 37C178 41 174 42 174 47" pathLength="1"/>
      <path className="m4srch-s m4srch-t9" d="M174 47L154.5 61.5C153 62.6 153.6 65 155.5 65H192.5C194.4 65 195 62.6 193.5 61.5Z" pathLength="1"/>
      <circle className="m4srch-s m4srch-t11 m4srch-slow m4srch-lens" cx="150" cy="118" r="21" pathLength="1" transform="rotate(-140 150 118)"/>
      <path className="m4srch-s m4srch-t15 m4srch-handle" d="M165.5 133.5L181 149" pathLength="1"/>
      <path className="m4srch-s m4srch-t17 m4srch-quick m4srch-thin" d="M140 110A13 13 0 0 1 151 104" pathLength="1"/>
    </svg>
    <h2 className="m4srch-h">No matches for “linen apron xs”</h2>
    <p className="m4srch-p">Try fewer words or check the spelling. Our aprons are cut in three sizes, so searching for the fabric alone usually finds them.</p>
    <div className="m4srch-actions">
      <a className="m4srch-btn" href="#">Clear the search</a>
      <a className="m4srch-ghost" href="#">Browse every apron</a>
    </div>
  </div>
</div>
<button type="button" className="m4srch-replay" aria-label="Replay the drawing"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

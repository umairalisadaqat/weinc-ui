import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the slate and teal colours at the top of .m4inb, and the heading and sentence of the empty state.
const CSS = `
.m4inb { --m4inb-bg: #eef1f4; --m4inb-panel: #ffffff; --m4inb-ink: #1e293b; --m4inb-quiet: #526071; --m4inb-line: #e2e7ee; --m4inb-focus: #2b6f77; --m4inb-pen: #334155; --m4inb-accent: #2b6f77; }
.m4inb { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
.m4inb *, .m4inb *::before, .m4inb *::after { box-sizing: border-box; }
.m4inb svg { display: block; }
.m4inb .m4inb-s { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 0; }
.m4inb-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m4inb-line); border-radius: 999px; background: var(--m4inb-replaybg, transparent); color: var(--m4inb-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m4inb-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m4inb-replay:hover { color: var(--m4inb-ink); }
.m4inb-replay:focus-visible { outline: 2px solid var(--m4inb-focus); outline-offset: 2px; }
/* Hidden until the drawing starts, only when motion is allowed and the script is running. */
@media (prefers-reduced-motion: no-preference) {
  .m4inb.is-js:not([data-run]) .m4inb-s { stroke-dashoffset: 1; }
  .m4inb.is-js:not([data-run]) .m4inb-f { opacity: 0; }
}
.m4inb[data-run] .m4inb-s { animation: m4inb-draw .6s cubic-bezier(.5, .05, .3, 1) both; }
.m4inb[data-run] .m4inb-f { animation: m4inb-fade .5s ease-out both; }
.m4inb[data-run] .m4inb-slow { animation-duration: 1s; }
.m4inb[data-run] .m4inb-quick { animation-duration: .35s; }
@keyframes m4inb-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes m4inb-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
/* Paused while scrolled out of view. */
.m4inb[data-off] * { animation-play-state: paused !important; }
/* Reduced motion: the finished drawing, no movement. */
@media (prefers-reduced-motion: reduce) {
  .m4inb *, .m4inb *::before, .m4inb *::after { animation: none !important; transition: none !important; }
  .m4inb-replay { display: none; }
}

.m4inb { background: var(--m4inb-bg); color: var(--m4inb-ink); padding: 40px clamp(14px, 4vw, 48px) 76px; }
.m4inb-app { max-width: 980px; margin: 0 auto; display: grid; grid-template-columns: 210px minmax(0, 1fr); background: var(--m4inb-panel); border: 1px solid var(--m4inb-line); border-radius: 14px; overflow: hidden; box-shadow: 0 22px 44px -32px rgba(30, 41, 59, .4); }
.m4inb-side { padding: 22px 14px; background: #f7f9fb; border-right: 1px solid var(--m4inb-line); }
.m4inb-brand { margin: 0 10px 18px; font-weight: 700; font-size: 15px; }
.m4inb-side ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 2px; }
.m4inb-side a { display: flex; align-items: center; min-height: 40px; padding: 0 10px; border-radius: 8px; color: var(--m4inb-quiet); font-size: 14.5px; text-decoration: none; }
.m4inb-side a[aria-current] { background: #e4eef0; color: var(--m4inb-accent); font-weight: 650; }
.m4inb-side a:hover { color: var(--m4inb-ink); }
.m4inb a:focus-visible { outline: 2px solid var(--m4inb-focus); outline-offset: 2px; }
.m4inb-main { min-width: 0; }
.m4inb-bar { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 18px 26px; border-bottom: 1px solid var(--m4inb-line); }
.m4inb-title { margin: 0; font-size: 18px; font-weight: 700; }
.m4inb-count { font-size: 13.5px; color: var(--m4inb-quiet); }
.m4inb-empty { padding: 40px 24px 52px; text-align: center; }
.m4inb-art { width: 250px; max-width: 72%; height: auto; margin: 0 auto 14px; }
.m4inb-art .m4inb-s { stroke: var(--m4inb-pen); stroke-width: 2; }
.m4inb-art .m4inb-thin { stroke-width: 1.3; }
.m4inb-art .m4inb-ground { opacity: .35; }
.m4inb-art .m4inb-trail { stroke: var(--m4inb-accent); opacity: .7; }
.m4inb-art .m4inb-plane { stroke: var(--m4inb-accent); }
.m4inb-h { margin: 0; font-size: 21px; font-weight: 700; letter-spacing: -.01em; }
.m4inb-p { margin: 8px auto 0; max-width: 25em; font-size: 15px; line-height: 1.55; color: var(--m4inb-quiet); }
.m4inb-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 22px; }
.m4inb-btn, .m4inb-ghost { display: inline-flex; align-items: center; min-height: 42px; padding: 0 18px; border-radius: 10px; font-size: 14.5px; font-weight: 650; text-decoration: none; }
.m4inb-btn { background: var(--m4inb-accent); color: #fff; }
.m4inb-btn:hover { background: #235c63; }
.m4inb-ghost { color: var(--m4inb-ink); border: 1px solid #cbd3dd; }
@media (max-width: 680px) {
  .m4inb-app { grid-template-columns: 1fr; }
  .m4inb-side { border-right: 0; border-bottom: 1px solid var(--m4inb-line); padding: 14px; }
  .m4inb-brand { margin-bottom: 10px; }
  .m4inb-side ul { grid-auto-flow: column; overflow-x: auto; }
}

.m4inb[data-run] .m4inb-t0 { animation-delay: 0.00s; }
.m4inb[data-run] .m4inb-t1 { animation-delay: 0.05s; }
.m4inb[data-run] .m4inb-t2 { animation-delay: 0.10s; }
.m4inb[data-run] .m4inb-t3 { animation-delay: 0.15s; }
.m4inb[data-run] .m4inb-t4 { animation-delay: 0.20s; }
.m4inb[data-run] .m4inb-t5 { animation-delay: 0.25s; }
.m4inb[data-run] .m4inb-t6 { animation-delay: 0.30s; }
.m4inb[data-run] .m4inb-t7 { animation-delay: 0.35s; }
.m4inb[data-run] .m4inb-t8 { animation-delay: 0.40s; }
.m4inb[data-run] .m4inb-t9 { animation-delay: 0.45s; }
.m4inb[data-run] .m4inb-t10 { animation-delay: 0.50s; }
.m4inb[data-run] .m4inb-t11 { animation-delay: 0.55s; }
.m4inb[data-run] .m4inb-t12 { animation-delay: 0.60s; }
.m4inb[data-run] .m4inb-t13 { animation-delay: 0.65s; }
.m4inb[data-run] .m4inb-t14 { animation-delay: 0.70s; }
.m4inb[data-run] .m4inb-t15 { animation-delay: 0.75s; }
.m4inb[data-run] .m4inb-t16 { animation-delay: 0.80s; }
.m4inb[data-run] .m4inb-t17 { animation-delay: 0.85s; }
.m4inb[data-run] .m4inb-t18 { animation-delay: 0.90s; }
.m4inb[data-run] .m4inb-t19 { animation-delay: 0.95s; }
.m4inb[data-run] .m4inb-t20 { animation-delay: 1.00s; }
.m4inb[data-run] .m4inb-t21 { animation-delay: 1.05s; }
.m4inb[data-run] .m4inb-t22 { animation-delay: 1.10s; }
.m4inb[data-run] .m4inb-t23 { animation-delay: 1.15s; }
.m4inb[data-run] .m4inb-t24 { animation-delay: 1.20s; }
.m4inb[data-run] .m4inb-t25 { animation-delay: 1.25s; }
.m4inb[data-run] .m4inb-t26 { animation-delay: 1.30s; }
.m4inb[data-run] .m4inb-t27 { animation-delay: 1.35s; }
.m4inb[data-run] .m4inb-t28 { animation-delay: 1.40s; }
.m4inb[data-run] .m4inb-t29 { animation-delay: 1.45s; }
.m4inb[data-run] .m4inb-t30 { animation-delay: 1.50s; }
.m4inb[data-run] .m4inb-t31 { animation-delay: 1.55s; }
.m4inb[data-run] .m4inb-t32 { animation-delay: 1.60s; }
.m4inb[data-run] .m4inb-t33 { animation-delay: 1.65s; }
.m4inb[data-run] .m4inb-t34 { animation-delay: 1.70s; }
.m4inb[data-run] .m4inb-t35 { animation-delay: 1.75s; }
.m4inb[data-run] .m4inb-t36 { animation-delay: 1.80s; }
.m4inb[data-run] .m4inb-t37 { animation-delay: 1.85s; }
.m4inb[data-run] .m4inb-t38 { animation-delay: 1.90s; }
.m4inb[data-run] .m4inb-t39 { animation-delay: 1.95s; }
`;

// Runs before paint in the browser so the drawing never flashes finished before it starts.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function EmptyInboxStateWithTrayAnd() {
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
    const btn = root.querySelector(".m4inb-replay");
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
    <section ref={rootRef} className="m4inb">
      <style>{CSS}</style>
<div className="m4inb-app">
  <nav className="m4inb-side" aria-label="Mail folders">
    <p className="m4inb-brand">Juniper Print Co.</p>
    <ul>
      <li><a href="#" aria-current="page">Inbox</a></li>
      <li><a href="#">Sent</a></li>
      <li><a href="#">Drafts</a></li>
      <li><a href="#">Archive</a></li>
    </ul>
  </nav>
  <main className="m4inb-main">
    <div className="m4inb-bar"><h2 className="m4inb-title">Inbox</h2><span className="m4inb-count">0 messages</span></div>
    <div className="m4inb-empty">
      <svg className="m4inb-art" viewBox="0 0 240 170" aria-hidden="true" focusable="false">
        <path className="m4inb-s m4inb-t0 m4inb-thin m4inb-ground" d="M30 152H210" pathLength="1"/>
        <path className="m4inb-s m4inb-t1" d="M62 94H178" pathLength="1"/>
        <path className="m4inb-s m4inb-t2 m4inb-quick" d="M62 94L46 114M178 94L194 114" pathLength="1"/>
        <path className="m4inb-s m4inb-t3 m4inb-slow" d="M46 114H96L103 124H137L144 114H194V136C194 140.4 190.4 144 186 144H54C49.6 144 46 140.4 46 136Z" pathLength="1"/>
        <path className="m4inb-s m4inb-t6 m4inb-thin" d="M70 104H170" pathLength="1"/>
        <path className="m4inb-s m4inb-t7 m4inb-slow m4inb-thin m4inb-trail" d="M56 76C72 74 86 60 102 62C116 64 116 80 104 80C92 80 98 60 124 54C134 52 142 51 150 50" pathLength="1"/>
        <path className="m4inb-s m4inb-t13 m4inb-plane" d="M150 50L204 26L184 70L170 58Z" pathLength="1"/>
        <path className="m4inb-s m4inb-t16 m4inb-quick m4inb-plane" d="M170 58L204 26M170 58L168 72L176 64" pathLength="1"/>
      </svg>
      <h3 className="m4inb-h">Your inbox is clear</h3>
      <p className="m4inb-p">Messages from your print customers will land here. Nothing is waiting for a reply right now.</p>
      <div className="m4inb-actions">
        <a className="m4inb-btn" href="#">Write a message</a>
        <a className="m4inb-ghost" href="#">Open the archive</a>
      </div>
    </div>
  </main>
</div>
<button type="button" className="m4inb-replay" aria-label="Replay the drawing"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

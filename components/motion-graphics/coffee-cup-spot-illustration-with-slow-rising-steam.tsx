import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the oat, ink and coffee colours at the top of .m4cof, and --m4cof-steam-time for the speed of the steam loop.
const CSS = `
.m4cof { --m4cof-bg: #efe4d2; --m4cof-card: #faf5ec; --m4cof-ink: #33241b; --m4cof-quiet: #66554a; --m4cof-line: #e0d2bd; --m4cof-focus: #8a5a3b; --m4cof-pen: #3a2a20; --m4cof-coffee: #8a5a3b; --m4cof-steam-time: 5.6s; }
.m4cof { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
.m4cof *, .m4cof *::before, .m4cof *::after { box-sizing: border-box; }
.m4cof svg { display: block; }
.m4cof .m4cof-s { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 0; }
.m4cof-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m4cof-line); border-radius: 999px; background: var(--m4cof-replaybg, transparent); color: var(--m4cof-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m4cof-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m4cof-replay:hover { color: var(--m4cof-ink); }
.m4cof-replay:focus-visible { outline: 2px solid var(--m4cof-focus); outline-offset: 2px; }
/* Hidden until the drawing starts, only when motion is allowed and the script is running. */
@media (prefers-reduced-motion: no-preference) {
  .m4cof.is-js:not([data-run]) .m4cof-s { stroke-dashoffset: 1; }
  .m4cof.is-js:not([data-run]) .m4cof-f { opacity: 0; }
}
.m4cof[data-run] .m4cof-s { animation: m4cof-draw .6s cubic-bezier(.5, .05, .3, 1) both; }
.m4cof[data-run] .m4cof-f { animation: m4cof-fade .5s ease-out both; }
.m4cof[data-run] .m4cof-slow { animation-duration: 1s; }
.m4cof[data-run] .m4cof-quick { animation-duration: .35s; }
@keyframes m4cof-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes m4cof-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
/* Paused while scrolled out of view. */
.m4cof[data-off] * { animation-play-state: paused !important; }
/* Reduced motion: the finished drawing, no movement. */
@media (prefers-reduced-motion: reduce) {
  .m4cof *, .m4cof *::before, .m4cof *::after { animation: none !important; transition: none !important; }
  .m4cof-replay { display: none; }
}

.m4cof { background: var(--m4cof-bg); color: var(--m4cof-ink); padding: 52px clamp(16px, 5vw, 56px) 76px; }
.m4cof-card { max-width: 860px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); align-items: center; background: var(--m4cof-card); border: 1px solid var(--m4cof-line); border-radius: 20px; box-shadow: 0 28px 56px -40px rgba(51, 36, 27, .5); }
.m4cof-spot { padding: 30px 26px; }
.m4cof-art { width: 100%; max-width: 300px; height: auto; margin: 0 auto; }
.m4cof-art .m4cof-s { stroke: var(--m4cof-pen); stroke-width: 2.1; }
.m4cof-art .m4cof-thin { stroke-width: 1.4; }
.m4cof-art .m4cof-coffee { stroke: var(--m4cof-coffee); }
.m4cof-art .m4cof-shade { opacity: .55; }
.m4cof-art .m4cof-cupfill { fill: var(--m4cof-card); }
.m4cof-steam path { fill: none; stroke: var(--m4cof-coffee); stroke-width: 1.8; stroke-linecap: round; stroke-dasharray: 1 2; stroke-dashoffset: 0; opacity: .7; transform-box: fill-box; transform-origin: 50% 100%; }
/* The steam loop: each strand draws up from the cup, then erases from its base and drifts away. */
@media (prefers-reduced-motion: no-preference) {
  .m4cof-steam path { animation: m4cof-rise var(--m4cof-steam-time) ease-in-out infinite; }
  .m4cof-steam path:nth-child(2) { animation-delay: calc(var(--m4cof-steam-time) / -3); }
  .m4cof-steam path:nth-child(3) { animation-delay: calc(var(--m4cof-steam-time) / -1.5); }
  .m4cof.is-js:not([data-run]) .m4cof-steam path { animation-play-state: paused; }
}
@keyframes m4cof-rise {
  0% { stroke-dashoffset: 1; opacity: 0; transform: translateY(6px); }
  18% { opacity: .75; }
  50% { stroke-dashoffset: 0; }
  82% { opacity: .55; }
  100% { stroke-dashoffset: -1; opacity: 0; transform: translateY(-10px); }
}
.m4cof-body { padding: 36px 40px 40px 8px; }
.m4cof-eyebrow { margin: 0 0 12px; font-size: 12px; font-weight: 600; letter-spacing: .15em; text-transform: uppercase; color: var(--m4cof-coffee); }
.m4cof-h { margin: 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(30px, 3.8vw, 42px); line-height: 1.05; }
.m4cof-p { margin: 14px 0 0; font-size: 15.5px; line-height: 1.6; color: var(--m4cof-quiet); }
.m4cof-hours { margin: 20px 0 0; display: grid; }
.m4cof-hours div { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid var(--m4cof-line); font-size: 14.5px; }
.m4cof-hours dt { color: var(--m4cof-quiet); }
.m4cof-hours dd { margin: 0; font-weight: 600; font-variant-numeric: tabular-nums; }
.m4cof-link { display: inline-flex; align-items: center; min-height: 40px; margin-top: 12px; color: var(--m4cof-ink); font-weight: 650; font-size: 14.5px; text-underline-offset: 5px; text-decoration-color: var(--m4cof-coffee); }
.m4cof-link:focus-visible { outline: 2px solid var(--m4cof-focus); outline-offset: 3px; border-radius: 2px; }
@media (max-width: 700px) {
  .m4cof-card { grid-template-columns: 1fr; }
  .m4cof-spot { padding: 26px 26px 0; }
  .m4cof-art { max-width: 220px; }
  .m4cof-body { padding: 18px 24px 34px; }
}

.m4cof[data-run] .m4cof-t0 { animation-delay: 0.00s; }
.m4cof[data-run] .m4cof-t1 { animation-delay: 0.05s; }
.m4cof[data-run] .m4cof-t2 { animation-delay: 0.10s; }
.m4cof[data-run] .m4cof-t3 { animation-delay: 0.15s; }
.m4cof[data-run] .m4cof-t4 { animation-delay: 0.20s; }
.m4cof[data-run] .m4cof-t5 { animation-delay: 0.25s; }
.m4cof[data-run] .m4cof-t6 { animation-delay: 0.30s; }
.m4cof[data-run] .m4cof-t7 { animation-delay: 0.35s; }
.m4cof[data-run] .m4cof-t8 { animation-delay: 0.40s; }
.m4cof[data-run] .m4cof-t9 { animation-delay: 0.45s; }
.m4cof[data-run] .m4cof-t10 { animation-delay: 0.50s; }
.m4cof[data-run] .m4cof-t11 { animation-delay: 0.55s; }
.m4cof[data-run] .m4cof-t12 { animation-delay: 0.60s; }
.m4cof[data-run] .m4cof-t13 { animation-delay: 0.65s; }
.m4cof[data-run] .m4cof-t14 { animation-delay: 0.70s; }
.m4cof[data-run] .m4cof-t15 { animation-delay: 0.75s; }
.m4cof[data-run] .m4cof-t16 { animation-delay: 0.80s; }
.m4cof[data-run] .m4cof-t17 { animation-delay: 0.85s; }
.m4cof[data-run] .m4cof-t18 { animation-delay: 0.90s; }
.m4cof[data-run] .m4cof-t19 { animation-delay: 0.95s; }
.m4cof[data-run] .m4cof-t20 { animation-delay: 1.00s; }
.m4cof[data-run] .m4cof-t21 { animation-delay: 1.05s; }
.m4cof[data-run] .m4cof-t22 { animation-delay: 1.10s; }
.m4cof[data-run] .m4cof-t23 { animation-delay: 1.15s; }
.m4cof[data-run] .m4cof-t24 { animation-delay: 1.20s; }
.m4cof[data-run] .m4cof-t25 { animation-delay: 1.25s; }
.m4cof[data-run] .m4cof-t26 { animation-delay: 1.30s; }
.m4cof[data-run] .m4cof-t27 { animation-delay: 1.35s; }
.m4cof[data-run] .m4cof-t28 { animation-delay: 1.40s; }
.m4cof[data-run] .m4cof-t29 { animation-delay: 1.45s; }
.m4cof[data-run] .m4cof-t30 { animation-delay: 1.50s; }
.m4cof[data-run] .m4cof-t31 { animation-delay: 1.55s; }
.m4cof[data-run] .m4cof-t32 { animation-delay: 1.60s; }
.m4cof[data-run] .m4cof-t33 { animation-delay: 1.65s; }
.m4cof[data-run] .m4cof-t34 { animation-delay: 1.70s; }
.m4cof[data-run] .m4cof-t35 { animation-delay: 1.75s; }
.m4cof[data-run] .m4cof-t36 { animation-delay: 1.80s; }
.m4cof[data-run] .m4cof-t37 { animation-delay: 1.85s; }
.m4cof[data-run] .m4cof-t38 { animation-delay: 1.90s; }
.m4cof[data-run] .m4cof-t39 { animation-delay: 1.95s; }
`;

// Runs before paint in the browser so the drawing never flashes finished before it starts.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function CoffeeCupSpotIllustrationWithSlow() {
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
    const btn = root.querySelector(".m4cof-replay");
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
    <section ref={rootRef} className="m4cof">
      <style>{CSS}</style>
<article className="m4cof-card">
  <div className="m4cof-spot">
    <svg className="m4cof-art" viewBox="0 0 300 290" aria-hidden="true" focusable="false">
      <g className="m4cof-steam m4cof-f m4cof-t16">
        <path d="M128 110C118 94 138 84 128 64C120 48 134 40 130 28" pathLength="1"/>
        <path d="M151 106C161 90 141 78 153 58C161 44 149 34 155 22" pathLength="1"/>
        <path d="M173 110C163 96 181 86 173 68C167 56 177 48 173 38" pathLength="1"/>
      </g>
      <ellipse className="m4cof-s m4cof-t0 m4cof-slow" cx="150" cy="232" rx="106" ry="24" pathLength="1"/>
      <ellipse className="m4cof-s m4cof-t3 m4cof-thin" cx="150" cy="229" rx="64" ry="12" pathLength="1"/>
      <path className="m4cof-cupfill" d="M86 130C88 196 110 226 150 226C190 226 212 196 214 130Z"/>
      <path className="m4cof-s m4cof-t2 m4cof-slow" d="M86 130C88 196 110 226 150 226C190 226 212 196 214 130" pathLength="1"/>
      <ellipse className="m4cof-s m4cof-t5" cx="150" cy="130" rx="64" ry="14" pathLength="1"/>
      <ellipse className="m4cof-s m4cof-t8 m4cof-thin m4cof-coffee" cx="150" cy="133" rx="53" ry="9.5" pathLength="1"/>
      <path className="m4cof-s m4cof-t11 m4cof-quick m4cof-thin m4cof-coffee" d="M128 134C140 128 160 139 172 132" pathLength="1"/>
      <path className="m4cof-s m4cof-t7" d="M212 150C242 144 248 178 222 188C216 190 209 192 204 194" pathLength="1"/>
      <path className="m4cof-s m4cof-t9 m4cof-thin" d="M211 161C228 158 231 174 217 179" pathLength="1"/>
      <path className="m4cof-s m4cof-t12 m4cof-thin m4cof-shade" d="M200 152C199 178 192 198 178 212M190 160C189 178 184 192 174 204" pathLength="1"/>
    </svg>
  </div>
  <div className="m4cof-body">
    <p className="m4cof-eyebrow">Kettle &amp; Crumb · Albion Row</p>
    <h2 className="m4cof-h">Open from seven</h2>
    <p className="m4cof-p">Filter coffee, cardamom buns and a corner table by the window. Bring a book; nobody will hurry you.</p>
    <dl className="m4cof-hours">
      <div><dt>Monday to Friday</dt><dd>7:00 to 16:00</dd></div>
      <div><dt>Saturday</dt><dd>8:00 to 15:00</dd></div>
      <div><dt>Sunday</dt><dd>Closed</dd></div>
    </dl>
    <a className="m4cof-link" href="#">How to find us</a>
  </div>
</article>
<button type="button" className="m4cof-replay" aria-label="Replay the drawing"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

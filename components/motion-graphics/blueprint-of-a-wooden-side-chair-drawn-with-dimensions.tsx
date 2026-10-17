import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the blueprint blue and line colours at the top of .m4chr, and the dimension figures in the text elements.
const CSS = `
.m4chr { --m4chr-bg: #e6ebf2; --m4chr-blue: #18365f; --m4chr-ink: #eaf1fb; --m4chr-quiet: #b9c8de; --m4chr-line: #3e5f8c; --m4chr-focus: #f3c969; --m4chr-replaybg: #18365f; }
.m4chr { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
.m4chr *, .m4chr *::before, .m4chr *::after { box-sizing: border-box; }
.m4chr svg { display: block; }
.m4chr .m4chr-s { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 0; }
.m4chr-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m4chr-line); border-radius: 999px; background: var(--m4chr-replaybg, transparent); color: var(--m4chr-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m4chr-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m4chr-replay:hover { color: var(--m4chr-ink); }
.m4chr-replay:focus-visible { outline: 2px solid var(--m4chr-focus); outline-offset: 2px; }
/* Hidden until the drawing starts, only when motion is allowed and the script is running. */
@media (prefers-reduced-motion: no-preference) {
  .m4chr.is-js:not([data-run]) .m4chr-s { stroke-dashoffset: 1; }
  .m4chr.is-js:not([data-run]) .m4chr-f { opacity: 0; }
}
.m4chr[data-run] .m4chr-s { animation: m4chr-draw .6s cubic-bezier(.5, .05, .3, 1) both; }
.m4chr[data-run] .m4chr-f { animation: m4chr-fade .5s ease-out both; }
.m4chr[data-run] .m4chr-slow { animation-duration: 1s; }
.m4chr[data-run] .m4chr-quick { animation-duration: .35s; }
@keyframes m4chr-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes m4chr-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
/* Paused while scrolled out of view. */
.m4chr[data-off] * { animation-play-state: paused !important; }
/* Reduced motion: the finished drawing, no movement. */
@media (prefers-reduced-motion: reduce) {
  .m4chr *, .m4chr *::before, .m4chr *::after { animation: none !important; transition: none !important; }
  .m4chr-replay { display: none; }
}

.m4chr { background: var(--m4chr-bg); padding: 44px clamp(14px, 4vw, 48px) 76px; }
.m4chr-sheet { max-width: 760px; margin: 0 auto; padding: 26px clamp(14px, 3vw, 34px) 0; color: var(--m4chr-ink); border-radius: 6px; background-color: var(--m4chr-blue); background-image: linear-gradient(rgba(234, 241, 251, .07) 1px, transparent 1px), linear-gradient(90deg, rgba(234, 241, 251, .07) 1px, transparent 1px); background-size: 24px 24px; box-shadow: 0 26px 50px -34px rgba(24, 54, 95, .7); overflow: hidden; }
.m4chr-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 20px; padding-bottom: 14px; border-bottom: 1px solid var(--m4chr-line); }
.m4chr-eyebrow { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .15em; text-transform: uppercase; color: var(--m4chr-quiet); }
.m4chr-h { margin: 0; font-size: clamp(22px, 3vw, 28px); font-weight: 650; letter-spacing: -.01em; }
.m4chr-art { width: 100%; height: auto; margin: 10px 0 6px; }
.m4chr-art .m4chr-s { stroke: var(--m4chr-ink); stroke-width: 1.9; }
.m4chr-art .m4chr-thin { stroke-width: 1.1; }
.m4chr-art .m4chr-faint { opacity: .45; }
.m4chr-dim .m4chr-s { stroke: var(--m4chr-focus); }
.m4chr-art text { font-family: inherit; font-size: 15px; font-weight: 600; fill: var(--m4chr-focus); text-anchor: middle; }
.m4chr-art .m4chr-lbl { font-size: 12px; letter-spacing: .16em; fill: var(--m4chr-quiet); }
.m4chr-block { margin: 0 calc(clamp(14px, 3vw, 34px) * -1); display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--m4chr-line); }
.m4chr-block div { padding: 12px clamp(14px, 3vw, 34px) 16px; border-left: 1px solid var(--m4chr-line); }
.m4chr-block div:first-child { border-left: 0; }
.m4chr-block dt { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--m4chr-quiet); }
.m4chr-block dd { margin: 4px 0 0; font-size: 14.5px; font-weight: 600; }
@media (max-width: 640px) {
  .m4chr-block { grid-template-columns: 1fr 1fr; }
  .m4chr-block div:nth-child(3) { border-left: 0; }
  .m4chr-block div:nth-child(n+3) { border-top: 1px solid var(--m4chr-line); }
}

.m4chr[data-run] .m4chr-t0 { animation-delay: 0.00s; }
.m4chr[data-run] .m4chr-t1 { animation-delay: 0.04s; }
.m4chr[data-run] .m4chr-t2 { animation-delay: 0.08s; }
.m4chr[data-run] .m4chr-t3 { animation-delay: 0.11s; }
.m4chr[data-run] .m4chr-t4 { animation-delay: 0.15s; }
.m4chr[data-run] .m4chr-t5 { animation-delay: 0.19s; }
.m4chr[data-run] .m4chr-t6 { animation-delay: 0.23s; }
.m4chr[data-run] .m4chr-t7 { animation-delay: 0.27s; }
.m4chr[data-run] .m4chr-t8 { animation-delay: 0.30s; }
.m4chr[data-run] .m4chr-t9 { animation-delay: 0.34s; }
.m4chr[data-run] .m4chr-t10 { animation-delay: 0.38s; }
.m4chr[data-run] .m4chr-t11 { animation-delay: 0.42s; }
.m4chr[data-run] .m4chr-t12 { animation-delay: 0.46s; }
.m4chr[data-run] .m4chr-t13 { animation-delay: 0.49s; }
.m4chr[data-run] .m4chr-t14 { animation-delay: 0.53s; }
.m4chr[data-run] .m4chr-t15 { animation-delay: 0.57s; }
.m4chr[data-run] .m4chr-t16 { animation-delay: 0.61s; }
.m4chr[data-run] .m4chr-t17 { animation-delay: 0.65s; }
.m4chr[data-run] .m4chr-t18 { animation-delay: 0.68s; }
.m4chr[data-run] .m4chr-t19 { animation-delay: 0.72s; }
.m4chr[data-run] .m4chr-t20 { animation-delay: 0.76s; }
.m4chr[data-run] .m4chr-t21 { animation-delay: 0.80s; }
.m4chr[data-run] .m4chr-t22 { animation-delay: 0.84s; }
.m4chr[data-run] .m4chr-t23 { animation-delay: 0.87s; }
.m4chr[data-run] .m4chr-t24 { animation-delay: 0.91s; }
.m4chr[data-run] .m4chr-t25 { animation-delay: 0.95s; }
.m4chr[data-run] .m4chr-t26 { animation-delay: 0.99s; }
.m4chr[data-run] .m4chr-t27 { animation-delay: 1.03s; }
.m4chr[data-run] .m4chr-t28 { animation-delay: 1.06s; }
.m4chr[data-run] .m4chr-t29 { animation-delay: 1.10s; }
.m4chr[data-run] .m4chr-t30 { animation-delay: 1.14s; }
.m4chr[data-run] .m4chr-t31 { animation-delay: 1.18s; }
.m4chr[data-run] .m4chr-t32 { animation-delay: 1.22s; }
.m4chr[data-run] .m4chr-t33 { animation-delay: 1.25s; }
.m4chr[data-run] .m4chr-t34 { animation-delay: 1.29s; }
.m4chr[data-run] .m4chr-t35 { animation-delay: 1.33s; }
.m4chr[data-run] .m4chr-t36 { animation-delay: 1.37s; }
.m4chr[data-run] .m4chr-t37 { animation-delay: 1.41s; }
.m4chr[data-run] .m4chr-t38 { animation-delay: 1.44s; }
.m4chr[data-run] .m4chr-t39 { animation-delay: 1.48s; }
`;

// Runs before paint in the browser so the drawing never flashes finished before it starts.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function BlueprintOfAWoodenSideChair() {
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
    const btn = root.querySelector(".m4chr-replay");
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
    <section ref={rootRef} className="m4chr">
      <style>{CSS}</style>
<figure className="m4chr-sheet">
  <figcaption className="m4chr-head">
    <p className="m4chr-eyebrow">Ashby Joinery · Workshop drawing</p>
    <h2 className="m4chr-h">Side chair No. 4</h2>
  </figcaption>
  <svg className="m4chr-art" viewBox="0 0 640 410" role="img" aria-label="Blueprint of side chair No. 4 in front and side elevation: 820 millimetres high, 450 to the seat, 440 wide and 500 deep" focusable="false">
    <text className="m4chr-f m4chr-t0 m4chr-lbl" x="170" y="36">FRONT ELEVATION</text>
    <text className="m4chr-f m4chr-t0 m4chr-lbl" x="438" y="36">SIDE ELEVATION</text>
    <path className="m4chr-s m4chr-t0 m4chr-slow m4chr-thin" d="M40 360H600" pathLength="1"/>
    <path className="m4chr-s m4chr-t2" d="M124 200V70M216 200V70" pathLength="1"/>
    <path className="m4chr-s m4chr-t4" d="M118 70C150 62 190 62 222 70V92C190 84 150 84 118 92Z" pathLength="1"/>
    <path className="m4chr-s m4chr-t6 m4chr-thin" d="M146 89V200M170 86.5V200M194 89V200" pathLength="1"/>
    <path className="m4chr-s m4chr-t5" d="M110 200H230V214H110Z" pathLength="1"/>
    <path className="m4chr-s m4chr-t7" d="M120 214V360M134 214V360M206 214V360M220 214V360" pathLength="1"/>
    <path className="m4chr-s m4chr-t9 m4chr-thin" d="M134 312H206M134 320H206" pathLength="1"/>
    <path className="m4chr-s m4chr-t3 m4chr-slow" d="M496 360C492 300 490 252 490 204C490 152 482 112 474 66" pathLength="1"/>
    <path className="m4chr-s m4chr-t4 m4chr-slow" d="M482 360C478 300 476 252 476 210C476 156 468 116 460 68" pathLength="1"/>
    <path className="m4chr-s m4chr-t6" d="M456 62L480 60L486 92L462 95Z" pathLength="1"/>
    <path className="m4chr-s m4chr-t8" d="M384 198C420 204 456 204 488 198V212H384Z" pathLength="1"/>
    <path className="m4chr-s m4chr-t9" d="M392 212V360M405 212V360" pathLength="1"/>
    <path className="m4chr-s m4chr-t11 m4chr-thin" d="M405 314H478M405 322H478" pathLength="1"/>
    <g className="m4chr-dim">
      <path className="m4chr-s m4chr-t14 m4chr-thin" d="M560 64V360M552 64H568M552 360H568" pathLength="1"/>
      <path className="m4chr-s m4chr-t15 m4chr-thin" d="M84 200V360M76 200H92M76 360H92" pathLength="1"/>
      <path className="m4chr-s m4chr-t16 m4chr-thin" d="M110 384H230M110 376V392M230 376V392" pathLength="1"/>
      <path className="m4chr-s m4chr-t17 m4chr-thin" d="M384 384H496M384 376V392M496 376V392" pathLength="1"/>
      <path className="m4chr-s m4chr-t13 m4chr-thin m4chr-faint" d="M486 64H560M230 200H84" pathLength="1"/>
      <g transform="rotate(-90 578 212)"><text className="m4chr-f m4chr-t18" x="578" y="212">820</text></g>
      <g transform="rotate(-90 70 280)"><text className="m4chr-f m4chr-t19" x="70" y="280">450</text></g>
      <text className="m4chr-f m4chr-t20" x="170" y="404">440</text>
      <text className="m4chr-f m4chr-t21" x="440" y="404">500</text>
    </g>
  </svg>
  <dl className="m4chr-block">
    <div><dt>Timber</dt><dd>Steam-bent ash</dd></div>
    <div><dt>Scale</dt><dd>1:10</dd></div>
    <div><dt>Units</dt><dd>Millimetres</dd></div>
    <div><dt>Sheet</dt><dd>2 of 6</dd></div>
  </dl>
</figure>
<button type="button" className="m4chr-replay" aria-label="Replay the drawing"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

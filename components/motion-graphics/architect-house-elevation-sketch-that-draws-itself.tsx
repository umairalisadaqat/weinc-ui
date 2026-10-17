import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the paper and graphite colours at the top of .m4hse, and the delay step in the .t rules at the end.
const CSS = `
.m4hse { --m4hse-bg: #ebe5d9; --m4hse-sheet: #f8f4ec; --m4hse-ink: #2f2e2b; --m4hse-quiet: #625d55; --m4hse-line: #d3cabb; --m4hse-focus: #2f2e2b; --m4hse-pencil: #34332f; }
.m4hse { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
.m4hse *, .m4hse *::before, .m4hse *::after { box-sizing: border-box; }
.m4hse svg { display: block; }
.m4hse .m4hse-s { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 0; }
.m4hse-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m4hse-line); border-radius: 999px; background: var(--m4hse-replaybg, transparent); color: var(--m4hse-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m4hse-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m4hse-replay:hover { color: var(--m4hse-ink); }
.m4hse-replay:focus-visible { outline: 2px solid var(--m4hse-focus); outline-offset: 2px; }
/* Hidden until the drawing starts, only when motion is allowed and the script is running. */
@media (prefers-reduced-motion: no-preference) {
  .m4hse.is-js:not([data-run]) .m4hse-s { stroke-dashoffset: 1; }
  .m4hse.is-js:not([data-run]) .m4hse-f { opacity: 0; }
}
.m4hse[data-run] .m4hse-s { animation: m4hse-draw .6s cubic-bezier(.5, .05, .3, 1) both; }
.m4hse[data-run] .m4hse-f { animation: m4hse-fade .5s ease-out both; }
.m4hse[data-run] .m4hse-slow { animation-duration: 1s; }
.m4hse[data-run] .m4hse-quick { animation-duration: .35s; }
@keyframes m4hse-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes m4hse-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
/* Paused while scrolled out of view. */
.m4hse[data-off] * { animation-play-state: paused !important; }
/* Reduced motion: the finished drawing, no movement. */
@media (prefers-reduced-motion: reduce) {
  .m4hse *, .m4hse *::before, .m4hse *::after { animation: none !important; transition: none !important; }
  .m4hse-replay { display: none; }
}

.m4hse { background: var(--m4hse-bg); color: var(--m4hse-ink); padding: 56px clamp(20px, 5vw, 64px) 76px; }
.m4hse-wrap { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 48px; align-items: center; }
.m4hse-eyebrow { margin: 0 0 12px; font-size: 12px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--m4hse-quiet); }
.m4hse-h { margin: 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(32px, 4vw, 46px); line-height: 1.05; letter-spacing: -.015em; }
.m4hse-p { margin: 16px 0 0; font-size: 16px; line-height: 1.6; color: var(--m4hse-quiet); max-width: 32em; }
.m4hse-dl { margin: 22px 0 0; display: grid; gap: 10px; }
.m4hse-dl div { display: flex; gap: 14px; font-size: 14px; border-top: 1px solid var(--m4hse-line); padding-top: 10px; }
.m4hse-dl dt { width: 72px; flex: none; color: var(--m4hse-quiet); }
.m4hse-dl dd { margin: 0; }
.m4hse-link { display: inline-flex; align-items: center; min-height: 40px; margin-top: 14px; color: var(--m4hse-ink); font-weight: 600; font-size: 15px; text-decoration: underline; text-underline-offset: 5px; text-decoration-color: #a99f8f; }
.m4hse-link:focus-visible { outline: 2px solid var(--m4hse-focus); outline-offset: 3px; border-radius: 2px; }
.m4hse-sheet { margin: 0; padding: 22px 22px 14px; background: var(--m4hse-sheet); border: 1px solid var(--m4hse-line); border-radius: 3px; box-shadow: 0 1px 0 rgba(47, 46, 43, .05), 0 30px 50px -34px rgba(47, 46, 43, .45); }
.m4hse-art { width: 100%; height: auto; }
.m4hse-art .m4hse-s { stroke: var(--m4hse-pencil); stroke-width: 1.7; }
.m4hse-art .m4hse-thin { stroke-width: 1.05; }
.m4hse-guide .m4hse-s { stroke-width: .8; opacity: .32; }
.m4hse-tree .m4hse-s { stroke-width: 1.3; }
.m4hse-art text { font-family: inherit; font-size: 11px; letter-spacing: .06em; fill: var(--m4hse-quiet); }
.m4hse-cap { display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--m4hse-line); font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--m4hse-quiet); }
@media (max-width: 760px) {
  .m4hse-wrap { grid-template-columns: 1fr; gap: 32px; }
  .m4hse-sheet { padding: 14px 12px 10px; }
}

.m4hse[data-run] .m4hse-t0 { animation-delay: 0.00s; }
.m4hse[data-run] .m4hse-t1 { animation-delay: 0.05s; }
.m4hse[data-run] .m4hse-t2 { animation-delay: 0.10s; }
.m4hse[data-run] .m4hse-t3 { animation-delay: 0.14s; }
.m4hse[data-run] .m4hse-t4 { animation-delay: 0.19s; }
.m4hse[data-run] .m4hse-t5 { animation-delay: 0.24s; }
.m4hse[data-run] .m4hse-t6 { animation-delay: 0.29s; }
.m4hse[data-run] .m4hse-t7 { animation-delay: 0.34s; }
.m4hse[data-run] .m4hse-t8 { animation-delay: 0.38s; }
.m4hse[data-run] .m4hse-t9 { animation-delay: 0.43s; }
.m4hse[data-run] .m4hse-t10 { animation-delay: 0.48s; }
.m4hse[data-run] .m4hse-t11 { animation-delay: 0.53s; }
.m4hse[data-run] .m4hse-t12 { animation-delay: 0.58s; }
.m4hse[data-run] .m4hse-t13 { animation-delay: 0.62s; }
.m4hse[data-run] .m4hse-t14 { animation-delay: 0.67s; }
.m4hse[data-run] .m4hse-t15 { animation-delay: 0.72s; }
.m4hse[data-run] .m4hse-t16 { animation-delay: 0.77s; }
.m4hse[data-run] .m4hse-t17 { animation-delay: 0.82s; }
.m4hse[data-run] .m4hse-t18 { animation-delay: 0.86s; }
.m4hse[data-run] .m4hse-t19 { animation-delay: 0.91s; }
.m4hse[data-run] .m4hse-t20 { animation-delay: 0.96s; }
.m4hse[data-run] .m4hse-t21 { animation-delay: 1.01s; }
.m4hse[data-run] .m4hse-t22 { animation-delay: 1.06s; }
.m4hse[data-run] .m4hse-t23 { animation-delay: 1.10s; }
.m4hse[data-run] .m4hse-t24 { animation-delay: 1.15s; }
.m4hse[data-run] .m4hse-t25 { animation-delay: 1.20s; }
.m4hse[data-run] .m4hse-t26 { animation-delay: 1.25s; }
.m4hse[data-run] .m4hse-t27 { animation-delay: 1.30s; }
.m4hse[data-run] .m4hse-t28 { animation-delay: 1.34s; }
.m4hse[data-run] .m4hse-t29 { animation-delay: 1.39s; }
.m4hse[data-run] .m4hse-t30 { animation-delay: 1.44s; }
.m4hse[data-run] .m4hse-t31 { animation-delay: 1.49s; }
.m4hse[data-run] .m4hse-t32 { animation-delay: 1.54s; }
.m4hse[data-run] .m4hse-t33 { animation-delay: 1.58s; }
.m4hse[data-run] .m4hse-t34 { animation-delay: 1.63s; }
.m4hse[data-run] .m4hse-t35 { animation-delay: 1.68s; }
.m4hse[data-run] .m4hse-t36 { animation-delay: 1.73s; }
.m4hse[data-run] .m4hse-t37 { animation-delay: 1.78s; }
.m4hse[data-run] .m4hse-t38 { animation-delay: 1.82s; }
.m4hse[data-run] .m4hse-t39 { animation-delay: 1.87s; }
`;

// Runs before paint in the browser so the drawing never flashes finished before it starts.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function ArchitectHouseElevationSketchThatDraws() {
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
    const btn = root.querySelector(".m4hse-replay");
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
    <section ref={rootRef} className="m4hse">
      <style>{CSS}</style>
<div className="m4hse-wrap">
  <div className="m4hse-text">
    <p className="m4hse-eyebrow">Project 07 · Planning stage</p>
    <h2 className="m4hse-h">Ferry Road House</h2>
    <p className="m4hse-p">A two-storey family house on a narrow riverside plot, with a timber lean-to kitchen facing the garden and a brick stack kept from the old cottage.</p>
    <dl className="m4hse-dl">
      <div><dt>Studio</dt><dd>Oakes &amp; Lund Architects</dd></div>
      <div><dt>Drawing</dt><dd>South elevation, first sketch</dd></div>
    </dl>
    <a className="m4hse-link" href="#">See the plans</a>
  </div>
  <figure className="m4hse-sheet">
    <svg className="m4hse-art" viewBox="0 0 480 304" aria-hidden="true" focusable="false">
      <g className="m4hse-guide">
        <path className="m4hse-s m4hse-t0 m4hse-slow" d="M34 131.5H440" pathLength="1"/>
        <path className="m4hse-s m4hse-t1 m4hse-slow" d="M120 34V286" pathLength="1"/>
        <path className="m4hse-s m4hse-t2 m4hse-slow" d="M300 34V286" pathLength="1"/>
        <path className="m4hse-s m4hse-t3 m4hse-slow" d="M210 26V284" pathLength="1"/>
      </g>
      <g className="m4hse-pen">
        <path className="m4hse-s m4hse-t3 m4hse-slow" d="M12 262.5C120 261.8 300 262.6 468 262" pathLength="1"/>
        <path className="m4hse-s m4hse-t5" d="M120.5 262V131" pathLength="1"/>
        <path className="m4hse-s m4hse-t6" d="M299.5 131V262" pathLength="1"/>
        <path className="m4hse-s m4hse-t7 m4hse-slow" d="M102 145.5L210 57.5L318 145.5" pathLength="1"/>
        <path className="m4hse-s m4hse-t8 m4hse-thin" d="M111 145.2L210 64.5L309 145.2" pathLength="1"/>
        <path className="m4hse-s m4hse-t9" d="M250 90.5V50H266V103.5" pathLength="1"/>
        <path className="m4hse-s m4hse-t10 m4hse-quick" d="M245.5 50H270.5M245.5 45.5H270.5" pathLength="1"/>
        <path className="m4hse-s m4hse-t11 m4hse-thin m4hse-quick" d="M250 60H266M250 70H266M250 80H266M258 50V60M254 60V70M262 70V80" pathLength="1"/>
        <circle className="m4hse-s m4hse-t10" cx="210" cy="104" r="12" pathLength="1" transform="rotate(-90 210 104)"/>
        <path className="m4hse-s m4hse-t11 m4hse-thin m4hse-quick" d="M198 104H222M210 92V116" pathLength="1"/>
        <path className="m4hse-s m4hse-t11" d="M142 149H178V185H142Z" pathLength="1"/>
        <path className="m4hse-s m4hse-t12 m4hse-thin m4hse-quick" d="M160 149V185M142 167H178" pathLength="1"/>
        <path className="m4hse-s m4hse-t12" d="M242 149H278V185H242Z" pathLength="1"/>
        <path className="m4hse-s m4hse-t13 m4hse-thin m4hse-quick" d="M260 149V185M242 167H278" pathLength="1"/>
        <path className="m4hse-s m4hse-t13 m4hse-thin" d="M139 188.5H181M239 188.5H281" pathLength="1"/>
        <path className="m4hse-s m4hse-t14" d="M140 204H192V242H140Z" pathLength="1"/>
        <path className="m4hse-s m4hse-t15 m4hse-thin m4hse-quick" d="M157.3 204V242M174.7 204V242" pathLength="1"/>
        <path className="m4hse-s m4hse-t15" d="M236 262V215A17 17 0 0 1 270 215V262" pathLength="1"/>
        <path className="m4hse-s m4hse-t16 m4hse-thin" d="M241 262V216A12 12 0 0 1 265 216V262" pathLength="1"/>
        <path className="m4hse-s m4hse-t17 m4hse-quick" d="M228 262V257H278V262" pathLength="1"/>
        <path className="m4hse-s m4hse-t16" d="M300 168.5L400 192" pathLength="1"/>
        <path className="m4hse-s m4hse-t17" d="M386 189V262" pathLength="1"/>
        <path className="m4hse-s m4hse-t18" d="M322 210H364V242H322Z" pathLength="1"/>
        <path className="m4hse-s m4hse-t19 m4hse-thin m4hse-quick" d="M343 210V242" pathLength="1"/>
        <path className="m4hse-s m4hse-t18 m4hse-thin" d="M396 249L408 237M404 253L418 239M414 256L426 244M424 259L434 249" pathLength="1"/>
        <path className="m4hse-s m4hse-t19 m4hse-thin" d="M306 176L380 193.5M306 183L370 198" pathLength="1"/>
      </g>
      <g className="m4hse-tree">
        <path className="m4hse-s m4hse-t8 m4hse-slow" d="M66 262C66.5 240 65 220 67 192M66.3 232C60 224 55 216 50 206M66.6 214C72 208 78 203 85 198" pathLength="1"/>
        <path className="m4hse-s m4hse-t10 m4hse-slow m4hse-thin" d="M62 199C40 204 24 188 31 171C20 158 32 136 50 140C52 122 76 116 86 130C102 126 112 144 104 158C116 170 106 192 88 190C82 202 70 204 62 199Z" pathLength="1"/>
        <path className="m4hse-s m4hse-t13 m4hse-thin" d="M44 166C48 158 54 156 60 158M78 150C84 148 90 152 92 158M70 178C76 176 82 178 84 182" pathLength="1"/>
      </g>
      <g className="m4hse-dim">
        <path className="m4hse-s m4hse-t20 m4hse-thin m4hse-quick" d="M120 291H300M120 285V297M300 285V297" pathLength="1"/>
        <text className="m4hse-f m4hse-t22" x="210" y="286" textAnchor="middle">9.6 m</text>
        <text className="m4hse-f m4hse-t23" x="440" y="124" textAnchor="end">eaves</text>
      </g>
    </svg>
    <figcaption className="m4hse-cap"><span>Oakes &amp; Lund</span><span>Sheet A2 · 1:100</span></figcaption>
  </figure>
</div>
<button type="button" className="m4hse-replay" aria-label="Replay the drawing"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

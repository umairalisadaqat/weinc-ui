import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the four colours at the top of .m1mon, and the draw speed in the m1mon-draw rules.
const CSS = `
.m1mon { --m1mon-bg: #efe7da; --m1mon-card: #fbf7ef; --m1mon-ink: #2a2420; --m1mon-quiet: #66594c; --m1mon-line: #d8ccb9; --m1mon-focus: #8a4b2a; }
.m1mon { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
.m1mon *, .m1mon *::before, .m1mon *::after { box-sizing: border-box; }
.m1mon-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.m1mon-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m1mon-line); border-radius: 999px; background: transparent; color: var(--m1mon-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m1mon-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m1mon-replay:hover { color: var(--m1mon-ink); }
.m1mon-replay:focus-visible { outline: 2px solid var(--m1mon-focus); outline-offset: 2px; }
/* Reduced motion: no movement at all, the finished logo shows straight away. */
@media (prefers-reduced-motion: reduce) {
  .m1mon *, .m1mon *::before, .m1mon *::after { animation: none !important; transition: none !important; }
  .m1mon-replay { display: none; }
}

.m1mon { min-height: 460px; display: flex; align-items: center; justify-content: center; padding: 56px 20px 72px; background: var(--m1mon-bg); color: var(--m1mon-ink); }
.m1mon-card { position: relative; width: 100%; max-width: 720px; display: flex; gap: 44px; align-items: center; padding: 44px 48px; background: var(--m1mon-card); border: 1px solid var(--m1mon-line); border-radius: 6px; box-shadow: 0 1px 0 rgba(42, 36, 32, .04), 0 26px 50px -30px rgba(42, 36, 32, .38); }
.m1mon-mark { flex: none; width: 150px; height: 150px; overflow: visible; }
.m1mon-mark .m1mon-s { fill: none; stroke: var(--m1mon-ink); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 0; }
.m1mon-fill .m1mon-disc { fill: var(--m1mon-ink); }
.m1mon-fill .m1mon-ring { fill: none; stroke: var(--m1mon-card); stroke-width: .9; opacity: .55; }
.m1mon-fill .m1mon-l path { fill: none; stroke: var(--m1mon-card); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.m1mon-eyebrow { margin: 0 0 10px; font-size: 12px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--m1mon-quiet); }
.m1mon-name { margin: 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(32px, 4.4vw, 44px); line-height: 1.05; letter-spacing: -.01em; }
.m1mon-copy { margin: 14px 0 0; max-width: 30em; font-size: 15.5px; line-height: 1.6; color: var(--m1mon-quiet); }
.m1mon-link { display: inline-flex; align-items: center; min-height: 40px; margin-top: 8px; color: var(--m1mon-ink); font-weight: 600; font-size: 14.5px; text-decoration: underline; text-underline-offset: 5px; text-decoration-color: #b9aa94; }
.m1mon-link:focus-visible { outline: 2px solid var(--m1mon-focus); outline-offset: 3px; border-radius: 2px; }
@media (max-width: 620px) {
  .m1mon-card { flex-direction: column; align-items: flex-start; gap: 26px; padding: 32px 24px; }
  .m1mon-mark { width: 108px; height: 108px; }
}
@media (prefers-reduced-motion: no-preference) {
  .m1mon.is-js:not([data-run]) .m1mon-mark .m1mon-s { stroke-dashoffset: 1; }
  .m1mon.is-js:not([data-run]) .m1mon-fill, .m1mon.is-js:not([data-run]) .m1mon-txt { opacity: 0; }
}
.m1mon[data-run] .m1mon-mark .m1mon-s { animation: m1mon-draw .62s cubic-bezier(.65, 0, .35, 1) both; }
.m1mon[data-run] .m1mon-mark .m1mon-d1 { animation-delay: .14s; }
.m1mon[data-run] .m1mon-mark .m1mon-d2 { animation-delay: .24s; }
.m1mon[data-run] .m1mon-mark .m1mon-d3 { animation-delay: .36s; animation-duration: .4s; }
.m1mon[data-run] .m1mon-mark .m1mon-d4 { animation-delay: .46s; }
.m1mon[data-run] .m1mon-mark .m1mon-d5 { animation-delay: .58s; }
.m1mon[data-run] .m1mon-fill { animation: m1mon-fade .42s ease-out 1.02s both; }
.m1mon[data-run] .m1mon-txt { animation: m1mon-rise .7s cubic-bezier(.2, .7, .2, 1) .3s both; }
@keyframes m1mon-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes m1mon-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes m1mon-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
`;

// Runs before paint in the browser so the logo never flashes before its reveal.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function LineMonogramDrawsThenFillsOn() {
  const rootRef = useRef<HTMLElement>(null);

  // Plays once when the piece scrolls into view (works inside a scrolling box too), then stops.
  // With prefers-reduced-motion the CSS shows the finished logo and hides the Replay button.
  useBrowserLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.classList.add("is-js");
    const play = () => {
      root.removeAttribute("data-run");
      void root.offsetWidth; // restart the keyframes
      root.setAttribute("data-run", "");
    };
    const btn = root.querySelector(".m1mon-replay");
    btn?.addEventListener("click", play);
    if (typeof IntersectionObserver === "undefined") {
      play();
      return () => btn?.removeEventListener("click", play);
    }
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        play();
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(root);
    return () => {
      io.disconnect();
      btn?.removeEventListener("click", play);
    };
  }, []);

  return (
    <section ref={rootRef} className="m1mon">
      <style>{CSS}</style>
<div className="m1mon-card">
  <svg className="m1mon-mark" viewBox="0 0 100 100" role="img" aria-label="Hartwell Bindery monogram" focusable="false">
    <g className="m1mon-lines">
      <circle className="m1mon-s m1mon-d0" cx="50" cy="50" r="44" pathLength="1" transform="rotate(-90 50 50)"/>
      <g transform="translate(-2 0)">
        <path className="m1mon-s m1mon-d1" d="M32 30V70" pathLength="1"/>
        <path className="m1mon-s m1mon-d2" d="M50 30V70" pathLength="1"/>
        <path className="m1mon-s m1mon-d3" d="M32 50H50" pathLength="1"/>
        <path className="m1mon-s m1mon-d4" d="M50 30H60A10 10 0 0 1 60 50H50" pathLength="1"/>
        <path className="m1mon-s m1mon-d5" d="M50 50H62A10 10 0 0 1 62 70H50" pathLength="1"/>
      </g>
    </g>
    <g className="m1mon-fill">
      <circle cx="50" cy="50" r="45.5" className="m1mon-disc"/>
      <circle cx="50" cy="50" r="39.5" className="m1mon-ring"/>
      <g transform="translate(-2 0)" className="m1mon-l">
        <path d="M32 30V70M50 30V70M32 50H50M50 30H60A10 10 0 0 1 60 50H50M50 50H62A10 10 0 0 1 62 70H50"/>
      </g>
    </g>
  </svg>
  <div className="m1mon-txt">
    <p className="m1mon-eyebrow">Bookbinding and repair</p>
    <h2 className="m1mon-name">Hartwell Bindery</h2>
    <p className="m1mon-copy">Hand-sewn journals, rebacked family bibles and short-run editions, bound at the bench on Cobb Lane.</p>
    <a className="m1mon-link" href="#">Visit the workshop</a>
  </div>
</div>
<button type="button" className="m1mon-replay" aria-label="Replay logo animation"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the colours at the top of .m1fld, the tile size in --m1fld-tile, and the letters in the three tiles.
const CSS = `
.m1fld { --m1fld-bg: #e7e1d6; --m1fld-ink: #222220; --m1fld-quiet: #57544d; --m1fld-line: #c4bcae; --m1fld-focus: #9a3b22; --m1fld-tile: #262624; --m1fld-letter: #efe6d6; --m1fld-size: 86px; }
.m1fld { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
.m1fld *, .m1fld *::before, .m1fld *::after { box-sizing: border-box; }
.m1fld-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.m1fld-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m1fld-line); border-radius: 999px; background: transparent; color: var(--m1fld-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m1fld-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m1fld-replay:hover { color: var(--m1fld-ink); }
.m1fld-replay:focus-visible { outline: 2px solid var(--m1fld-focus); outline-offset: 2px; }
/* Reduced motion: no movement at all, the finished logo shows straight away. */
@media (prefers-reduced-motion: reduce) {
  .m1fld *, .m1fld *::before, .m1fld *::after { animation: none !important; transition: none !important; }
  .m1fld-replay { display: none; }
}

.m1fld { min-height: 500px; display: flex; align-items: center; justify-content: center; padding: 52px 20px 72px; background: var(--m1fld-bg); color: var(--m1fld-ink); }
.m1fld-card { display: flex; align-items: center; gap: 56px; width: 100%; max-width: 760px; }
.m1fld-mark { flex: none; display: flex; flex-direction: column; perspective: 700px; filter: drop-shadow(0 22px 22px rgba(34, 34, 32, .25)); }
.m1fld-t { position: relative; display: grid; place-items: center; width: var(--m1fld-size); height: var(--m1fld-size); background: var(--m1fld-tile); transform-origin: 50% 0; backface-visibility: hidden; }
.m1fld-t + .m1fld-t { border-top: 1px solid #3b3a37; }
.m1fld-t b { font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: calc(var(--m1fld-size) * .62); line-height: 1; color: var(--m1fld-letter); }
.m1fld-t i { position: absolute; inset: 0; background: linear-gradient(#000, rgba(0, 0, 0, .25)); opacity: 0; }
.m1fld-h { margin: 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(32px, 4.4vw, 46px); line-height: 1.05; }
.m1fld-p { margin: 14px 0 20px; max-width: 26em; font-size: 15.5px; line-height: 1.6; color: var(--m1fld-quiet); }
.m1fld-dl { display: flex; gap: 32px; margin: 0 0 14px; flex-wrap: wrap; }
.m1fld-dl dt { font-size: 11.5px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--m1fld-quiet); }
.m1fld-dl dd { margin: 4px 0 0; font-size: 15px; }
.m1fld-link { display: inline-flex; align-items: center; min-height: 40px; color: var(--m1fld-ink); font-weight: 600; font-size: 14.5px; text-decoration: underline; text-underline-offset: 5px; text-decoration-color: #a39a8a; }
.m1fld-link:focus-visible { outline: 2px solid var(--m1fld-focus); outline-offset: 3px; }
@media (max-width: 620px) {
  .m1fld { --m1fld-size: 62px; }
  .m1fld-card { flex-direction: column; align-items: flex-start; gap: 28px; }
  .m1fld-mark { flex-direction: row; perspective: 500px; }
  .m1fld-t { transform-origin: 0 50%; }
  .m1fld-t + .m1fld-t { border-top: 0; border-left: 1px solid #3b3a37; }
}
@media (prefers-reduced-motion: no-preference) {
  .m1fld.is-js:not([data-run]) .m1fld-t, .m1fld.is-js:not([data-run]) .m1fld-txt { opacity: 0; }
}
.m1fld[data-run] .m1fld-t { animation: m1fld-unfold .62s cubic-bezier(.3, .9, .3, 1) both; }
.m1fld[data-run] .m1fld-t i { animation: m1fld-shade .62s ease-out both; }
.m1fld[data-run] .m1fld-t2, .m1fld[data-run] .m1fld-t2 i { animation-delay: .3s; }
.m1fld[data-run] .m1fld-t3, .m1fld[data-run] .m1fld-t3 i { animation-delay: .6s; }
.m1fld[data-run] .m1fld-txt { animation: m1fld-up .7s cubic-bezier(.2, .7, .2, 1) .5s both; }
@keyframes m1fld-unfold { from { opacity: 0; transform: rotateX(-92deg); } 20% { opacity: 1; } to { opacity: 1; transform: none; } }
@keyframes m1fld-shade { from { opacity: .9; } to { opacity: 0; } }
@keyframes m1fld-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@media (max-width: 620px) {
  @keyframes m1fld-unfold { from { opacity: 0; transform: rotateY(92deg); } 20% { opacity: 1; } to { opacity: 1; transform: none; } }
}
`;

// Runs before paint in the browser so the logo never flashes before its reveal.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function StackedLetterTilesLogoThatUnfolds() {
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
    const btn = root.querySelector(".m1fld-replay");
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
    <section ref={rootRef} className="m1fld">
      <style>{CSS}</style>
<div className="m1fld-card">
  <div className="m1fld-mark" role="img" aria-label="Ode Studio logo">
    <span className="m1fld-t m1fld-t1" aria-hidden="true"><b>O</b><i></i></span>
    <span className="m1fld-t m1fld-t2" aria-hidden="true"><b>D</b><i></i></span>
    <span className="m1fld-t m1fld-t3" aria-hidden="true"><b>E</b><i></i></span>
  </div>
  <div className="m1fld-txt">
    <h2 className="m1fld-h">Ode Studio</h2>
    <p className="m1fld-p">Typesetting, letterpress covers and print production for small poetry presses.</p>
    <dl className="m1fld-dl">
      <div><dt>Studio</dt><dd>14 Weaver Yard, Bristol</dd></div>
      <div><dt>Open</dt><dd>Tuesday to Friday</dd></div>
    </dl>
    <a className="m1fld-link" href="#">Send us a manuscript</a>
  </div>
</div>
<button type="button" className="m1fld-replay" aria-label="Replay logo animation"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

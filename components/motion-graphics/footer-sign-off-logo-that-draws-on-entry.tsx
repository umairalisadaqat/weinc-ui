import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the colours at the top of .m1ftr, and the three drawn paths of the mark.
const CSS = `
.m1ftr { --m1ftr-bg: #1b1e1c; --m1ftr-ink: #ece7dc; --m1ftr-quiet: #a9ada6; --m1ftr-line: #343a36; --m1ftr-focus: #c9b37e; --m1ftr-stroke: #c9b37e; }
.m1ftr { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
.m1ftr *, .m1ftr *::before, .m1ftr *::after { box-sizing: border-box; }
.m1ftr-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.m1ftr-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m1ftr-line); border-radius: 999px; background: transparent; color: var(--m1ftr-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m1ftr-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m1ftr-replay:hover { color: var(--m1ftr-ink); }
.m1ftr-replay:focus-visible { outline: 2px solid var(--m1ftr-focus); outline-offset: 2px; }
/* Reduced motion: no movement at all, the finished logo shows straight away. */
@media (prefers-reduced-motion: reduce) {
  .m1ftr *, .m1ftr *::before, .m1ftr *::after { animation: none !important; transition: none !important; }
  .m1ftr-replay { display: none; }
}

.m1ftr { background: var(--m1ftr-bg); color: var(--m1ftr-ink); padding: 56px clamp(20px, 5vw, 64px) 72px; }
.m1ftr-in { max-width: 1120px; margin: 0 auto; display: grid; grid-template-columns: 1.2fr 2fr; gap: 40px 56px; }
.m1ftr-sign { display: flex; align-items: center; gap: 18px; align-self: start; }
.m1ftr-mark { flex: none; width: 72px; height: 72px; overflow: visible; }
.m1ftr-mark .m1ftr-s { fill: none; stroke: var(--m1ftr-stroke); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 0; }
.m1ftr-w { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: 22px; line-height: 1.15; }
.m1ftr-tag { margin: 4px 0 0; font-size: 13.5px; color: var(--m1ftr-quiet); }
.m1ftr-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.m1ftr-cols h3 { margin: 0 0 10px; font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--m1ftr-quiet); }
.m1ftr-cols ul { margin: 0; padding: 0; list-style: none; }
.m1ftr-cols a { display: inline-flex; align-items: center; min-height: 40px; color: var(--m1ftr-ink); font-size: 15px; text-decoration: none; }
.m1ftr-cols a:hover { text-decoration: underline; text-underline-offset: 4px; }
.m1ftr-cols a:focus-visible { outline: 2px solid var(--m1ftr-focus); outline-offset: 2px; }
.m1ftr-legal { grid-column: 1 / -1; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding-top: 20px; border-top: 1px solid var(--m1ftr-line); font-size: 13.5px; color: var(--m1ftr-quiet); }
.m1ftr-legal address { font-style: normal; }
@media (max-width: 720px) {
  .m1ftr-in { grid-template-columns: 1fr; }
  .m1ftr-cols { grid-template-columns: repeat(2, 1fr); }
}
@media (prefers-reduced-motion: no-preference) {
  .m1ftr.is-js:not([data-run]) .m1ftr-mark .m1ftr-s { stroke-dashoffset: 1; }
  .m1ftr.is-js:not([data-run]) .m1ftr-name { opacity: 0; }
}
.m1ftr[data-run] .m1ftr-mark .m1ftr-s { animation: m1ftr-draw .8s cubic-bezier(.6, 0, .3, 1) both; }
.m1ftr[data-run] .m1ftr-mark .m1ftr-s2 { animation-duration: .7s; animation-delay: .35s; }
.m1ftr[data-run] .m1ftr-mark .m1ftr-s3 { animation-duration: .55s; animation-delay: .75s; }
.m1ftr[data-run] .m1ftr-name { animation: m1ftr-slide .7s cubic-bezier(.2, .7, .2, 1) .45s both; }
@keyframes m1ftr-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes m1ftr-slide { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: none; } }
`;

// Runs before paint in the browser so the logo never flashes before its reveal.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function FooterSignOffLogoThatDraws() {
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
    const btn = root.querySelector(".m1ftr-replay");
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
    <section ref={rootRef} className="m1ftr">
      <style>{CSS}</style>
<footer className="m1ftr-in">
  <div className="m1ftr-sign">
    <svg className="m1ftr-mark" viewBox="0 0 64 64" role="img" aria-label="Larchmere Outfitters" focusable="false">
      <circle className="m1ftr-s m1ftr-s1" cx="32" cy="32" r="28" pathLength="1" transform="rotate(-90 32 32)"/>
      <path className="m1ftr-s m1ftr-s2" d="M13 42L25 25L32 34L38.5 27L51 42" pathLength="1"/>
      <path className="m1ftr-s m1ftr-s3" d="M17 48.5C22 45.5 27 51 32 48.5S42 46 47 48" pathLength="1"/>
    </svg>
    <div className="m1ftr-name">
      <p className="m1ftr-w">Larchmere Outfitters</p>
      <p className="m1ftr-tag">Walking boots, waxed jackets and repairs</p>
    </div>
  </div>
  <nav className="m1ftr-cols" aria-label="Footer">
    <div><h3>Shop</h3><ul><li><a href="#">Boots</a></li><li><a href="#">Outerwear</a></li><li><a href="#">Maps</a></li></ul></div>
    <div><h3>Visit</h3><ul><li><a href="#">Opening times</a></li><li><a href="#">Boot fitting</a></li></ul></div>
    <div><h3>Help</h3><ul><li><a href="#">Repairs</a></li><li><a href="#">Contact</a></li></ul></div>
  </nav>
  <div className="m1ftr-legal">
    <address>2 Bridge End, Ambleside, Cumbria</address>
    <span>Larchmere Outfitters Ltd</span>
  </div>
</footer>
<button type="button" className="m1ftr-replay" aria-label="Replay logo animation"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

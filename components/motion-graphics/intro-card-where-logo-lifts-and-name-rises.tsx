import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the colours at the top of .m1lft and the lift height in --m1lft-lift.
const CSS = `
.m1lft { --m1lft-bg: #ead9c6; --m1lft-card: #f7efe4; --m1lft-ink: #3a2219; --m1lft-quiet: #6c4e40; --m1lft-line: #d3bba3; --m1lft-focus: #a8462a; --m1lft-clay: #b14e2c; --m1lft-lift: 16px; }
.m1lft { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
.m1lft *, .m1lft *::before, .m1lft *::after { box-sizing: border-box; }
.m1lft-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.m1lft-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m1lft-line); border-radius: 999px; background: transparent; color: var(--m1lft-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m1lft-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m1lft-replay:hover { color: var(--m1lft-ink); }
.m1lft-replay:focus-visible { outline: 2px solid var(--m1lft-focus); outline-offset: 2px; }
/* Reduced motion: no movement at all, the finished logo shows straight away. */
@media (prefers-reduced-motion: reduce) {
  .m1lft *, .m1lft *::before, .m1lft *::after { animation: none !important; transition: none !important; }
  .m1lft-replay { display: none; }
}

.m1lft { min-height: 520px; display: flex; align-items: center; justify-content: center; padding: 48px 20px 76px; background: var(--m1lft-bg); color: var(--m1lft-ink); }
.m1lft-card { width: 100%; max-width: 460px; padding: 44px 32px 36px; text-align: center; background: var(--m1lft-card); border-radius: 14px; box-shadow: 0 1px 0 rgba(58, 34, 25, .05), 0 30px 60px -36px rgba(58, 34, 25, .45); }
.m1lft-stage { position: relative; width: 112px; height: 132px; margin: 0 auto 14px; }
.m1lft-mark { position: absolute; left: 0; top: 0; width: 112px; height: 112px; overflow: visible; }
.m1lft-shadow { position: absolute; left: 14px; right: 14px; bottom: 0; height: 14px; border-radius: 50%; background: radial-gradient(closest-side, rgba(58, 34, 25, .34), rgba(58, 34, 25, 0)); transform: scaleX(.78); opacity: .7; }
.m1lft-disc { fill: var(--m1lft-clay); }
.m1lft-vase { fill: var(--m1lft-card); }
.m1lft-band { stroke: var(--m1lft-clay); stroke-width: 2.4; stroke-linecap: round; }
.m1lft-h { margin: 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(34px, 6vw, 46px); line-height: 1.1; }
.m1lft-ln { display: inline-block; overflow: hidden; vertical-align: top; padding-bottom: .08em; }
.m1lft-ln > span { display: inline-block; }
.m1lft-p { margin: 12px auto 16px; max-width: 24em; font-size: 15.5px; line-height: 1.6; color: var(--m1lft-quiet); }
.m1lft-link { display: inline-flex; align-items: center; min-height: 40px; color: var(--m1lft-ink); font-weight: 600; font-size: 14.5px; text-decoration: underline; text-underline-offset: 5px; text-decoration-color: #c49b80; }
.m1lft-link:focus-visible { outline: 2px solid var(--m1lft-focus); outline-offset: 3px; }
@media (prefers-reduced-motion: no-preference) {
  .m1lft.is-js:not([data-run]) .m1lft-mark { opacity: 0; }
  .m1lft.is-js:not([data-run]) .m1lft-ln > span { transform: translateY(110%); }
  .m1lft.is-js:not([data-run]) .m1lft-p, .m1lft.is-js:not([data-run]) .m1lft-link { opacity: 0; }
}
.m1lft[data-run] .m1lft-mark { animation: m1lft-lift 1.1s cubic-bezier(.22, .9, .3, 1) both; }
.m1lft[data-run] .m1lft-shadow { animation: m1lft-shadow 1.1s cubic-bezier(.22, .9, .3, 1) both; }
.m1lft[data-run] .m1lft-ln > span { animation: m1lft-rise .75s cubic-bezier(.2, .8, .2, 1) .45s both; }
.m1lft[data-run] .m1lft-ln + .m1lft-ln > span { animation-delay: .57s; }
.m1lft[data-run] .m1lft-p { animation: m1lft-fade .6s ease-out .85s both; }
.m1lft[data-run] .m1lft-link { animation: m1lft-fade .6s ease-out .95s both; }
@keyframes m1lft-lift { from { opacity: 0; transform: translateY(var(--m1lft-lift)) scale(.94); } 25% { opacity: 1; } to { opacity: 1; transform: none; } }
@keyframes m1lft-shadow { from { opacity: 1; transform: scaleX(1.05); } to { opacity: .7; transform: scaleX(.78); } }
@keyframes m1lft-rise { from { transform: translateY(110%); } to { transform: none; } }
@keyframes m1lft-fade { from { opacity: 0; } to { opacity: 1; } }
`;

// Runs before paint in the browser so the logo never flashes before its reveal.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function IntroCardWhereLogoLiftsAnd() {
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
    const btn = root.querySelector(".m1lft-replay");
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
    <section ref={rootRef} className="m1lft">
      <style>{CSS}</style>
<div className="m1lft-card">
  <div className="m1lft-stage">
    <span className="m1lft-shadow" aria-hidden="true"></span>
    <svg className="m1lft-mark" viewBox="0 0 100 100" role="img" aria-label="Calder Ceramics mark" focusable="false">
      <circle cx="50" cy="50" r="46" className="m1lft-disc"/>
      <g transform="translate(50 50) scale(1.32) translate(-50 -49)"><path className="m1lft-vase" d="M43 28h14v4c0 3-3 4-3 7v2c10 5 12 17 6 25-2 3-4 4-10 4s-8-1-10-4c-6-8-4-20 6-25v-2c0-3-3-4-3-7z"/>
      <path className="m1lft-band" d="M38.5 56h23"/></g>
    </svg>
  </div>
  <h2 className="m1lft-h"><span className="m1lft-ln"><span>Calder</span></span> <span className="m1lft-ln"><span>Ceramics</span></span></h2>
  <p className="m1lft-p">Thrown stoneware for everyday tables, glazed in small kiln loads.</p>
  <a className="m1lft-link" href="#">Studio open Thursday to Sunday</a>
</div>
<button type="button" className="m1lft-replay" aria-label="Replay logo animation"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

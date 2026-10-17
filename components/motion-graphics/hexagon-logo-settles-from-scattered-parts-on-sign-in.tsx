import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the colours at the top of .m1sct, and each part's start position in the --x, --y and --r values.
const CSS = `
.m1sct { --m1sct-bg: #2a1e14; --m1sct-card: #fbf6ec; --m1sct-ink: #2a1e14; --m1sct-quiet: #66574a; --m1sct-line: #d9cdbb; --m1sct-focus: #b5721a; --m1sct-a: #d99a2b; --m1sct-b: #b8761a; }
.m1sct { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
.m1sct *, .m1sct *::before, .m1sct *::after { box-sizing: border-box; }
.m1sct-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.m1sct-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m1sct-line); border-radius: 999px; background: transparent; color: var(--m1sct-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m1sct-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m1sct-replay:hover { color: var(--m1sct-ink); }
.m1sct-replay:focus-visible { outline: 2px solid var(--m1sct-focus); outline-offset: 2px; }
/* Reduced motion: no movement at all, the finished logo shows straight away. */
@media (prefers-reduced-motion: reduce) {
  .m1sct *, .m1sct *::before, .m1sct *::after { animation: none !important; transition: none !important; }
  .m1sct-replay { display: none; }
}

.m1sct { min-height: 540px; display: flex; align-items: center; justify-content: center; padding: 48px 20px 76px; background: radial-gradient(120% 90% at 50% 0%, #3b2a1b 0%, var(--m1sct-bg) 70%); color: var(--m1sct-ink); }
.m1sct-card { width: 100%; max-width: 380px; padding: 36px 32px 32px; background: var(--m1sct-card); border-radius: 10px; text-align: center; box-shadow: 0 30px 60px -28px rgba(0, 0, 0, .6); }
.m1sct-mark { display: block; width: 96px; height: 96px; margin: 0 auto; overflow: visible; }
.m1sct-p { transform-box: view-box; transform-origin: 50px 50px; stroke: var(--m1sct-card); stroke-width: 1.6; stroke-linejoin: round; }
.m1sct-p1, .m1sct-p3, .m1sct-p5 { fill: var(--m1sct-a); }
.m1sct-p2, .m1sct-p4, .m1sct-p6 { fill: var(--m1sct-b); }
.m1sct-hole { fill: var(--m1sct-card); transform-box: fill-box; transform-origin: center; }
.m1sct-p1 { --x: 22px; --y: -34px; --r: 50deg; }
.m1sct-p2 { --x: 46px; --y: -6px; --r: -70deg; }
.m1sct-p3 { --x: 30px; --y: 36px; --r: 40deg; }
.m1sct-p4 { --x: -28px; --y: 40px; --r: -45deg; }
.m1sct-p5 { --x: -48px; --y: 4px; --r: 80deg; }
.m1sct-p6 { --x: -24px; --y: -38px; --r: -55deg; }
.m1sct-h { margin: 18px 0 4px; font-size: 24px; font-weight: 700; letter-spacing: -.01em; }
.m1sct-p0 { margin: 0 0 24px; font-size: 15px; color: var(--m1sct-quiet); }
.m1sct-form { display: grid; gap: 8px; text-align: left; }
.m1sct-label { font-size: 13px; font-weight: 600; }
.m1sct-input { min-height: 46px; padding: 0 14px; border: 1px solid #cdbfa9; border-radius: 6px; background: #fff; color: var(--m1sct-ink); font: inherit; font-size: 15px; }
.m1sct-input::placeholder { color: #8a7b6b; }
.m1sct-input:focus-visible, .m1sct-btn:focus-visible { outline: 2px solid var(--m1sct-focus); outline-offset: 2px; }
.m1sct-btn { min-height: 46px; margin-top: 8px; border: 0; border-radius: 6px; background: var(--m1sct-ink); color: #fbf6ec; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; }
.m1sct .m1sct-replay { border-color: #6b5643; color: #d8c8b4; }
.m1sct .m1sct-replay:hover { color: #fff; }
@media (prefers-reduced-motion: no-preference) {
  .m1sct.is-js:not([data-run]) .m1sct-p, .m1sct.is-js:not([data-run]) .m1sct-hole { opacity: 0; }
}
.m1sct[data-run] .m1sct-p { animation: m1sct-settle 1s cubic-bezier(.18, .9, .25, 1) both; }
.m1sct[data-run] .m1sct-p2 { animation-delay: .06s; }
.m1sct[data-run] .m1sct-p3 { animation-delay: .12s; }
.m1sct[data-run] .m1sct-p4 { animation-delay: .18s; }
.m1sct[data-run] .m1sct-p5 { animation-delay: .24s; }
.m1sct[data-run] .m1sct-p6 { animation-delay: .3s; }
.m1sct[data-run] .m1sct-hole { animation: m1sct-pop .45s cubic-bezier(.2, .8, .2, 1) 1.05s both; }
@keyframes m1sct-settle { from { opacity: 0; transform: translate(var(--x), var(--y)) rotate(var(--r)) scale(.7); } 30% { opacity: 1; } to { opacity: 1; transform: none; } }
@keyframes m1sct-pop { from { opacity: 0; transform: scale(.3); } to { opacity: 1; transform: none; } }
`;

// Runs before paint in the browser so the logo never flashes before its reveal.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function HexagonLogoSettlesFromScatteredParts() {
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
    const btn = root.querySelector(".m1sct-replay");
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
    <section ref={rootRef} className="m1sct">
      <style>{CSS}</style>
<div className="m1sct-card">
  <svg className="m1sct-mark" viewBox="0 0 100 100" role="img" aria-label="Comb and Cell logo" focusable="false">
    <path className="m1sct-p m1sct-p1" d="M50 50L50 12L82.9 31Z"/>
    <path className="m1sct-p m1sct-p2" d="M50 50L82.9 31L82.9 69Z"/>
    <path className="m1sct-p m1sct-p3" d="M50 50L82.9 69L50 88Z"/>
    <path className="m1sct-p m1sct-p4" d="M50 50L50 88L17.1 69Z"/>
    <path className="m1sct-p m1sct-p5" d="M50 50L17.1 69L17.1 31Z"/>
    <path className="m1sct-p m1sct-p6" d="M50 50L17.1 31L50 12Z"/>
    <path className="m1sct-hole" d="M50 39.5L59.1 44.75V55.25L50 60.5L40.9 55.25V44.75Z"/>
  </svg>
  <h2 className="m1sct-h">Comb &amp; Cell</h2>
  <p className="m1sct-p0">Sign in to your hive records</p>
  <form className="m1sct-form" action="#">
    <label className="m1sct-label" htmlFor="m1sct-email">Email</label>
    <input className="m1sct-input" id="m1sct-email" type="email" autoComplete="email" placeholder="you@example.com"/>
    <button className="m1sct-btn" type="button">Continue</button>
  </form>
</div>
<button type="button" className="m1sct-replay" aria-label="Replay logo animation"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

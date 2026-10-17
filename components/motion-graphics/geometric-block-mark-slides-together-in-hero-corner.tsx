import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the colours at the top of .m1blk and the slide distance in --m1blk-far.
const CSS = `
.m1blk { --m1blk-bg: #eceeef; --m1blk-ink: #1f2a33; --m1blk-quiet: #4f5d68; --m1blk-line: #c5ccd1; --m1blk-focus: #b2552f; --m1blk-a: #1f2a33; --m1blk-b: #b2552f; --m1blk-c: #d8c4a1; --m1blk-d: #5d6e7a; --m1blk-far: 46px; }
.m1blk { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
.m1blk *, .m1blk *::before, .m1blk *::after { box-sizing: border-box; }
.m1blk-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.m1blk-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m1blk-line); border-radius: 999px; background: transparent; color: var(--m1blk-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m1blk-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m1blk-replay:hover { color: var(--m1blk-ink); }
.m1blk-replay:focus-visible { outline: 2px solid var(--m1blk-focus); outline-offset: 2px; }
/* Reduced motion: no movement at all, the finished logo shows straight away. */
@media (prefers-reduced-motion: reduce) {
  .m1blk *, .m1blk *::before, .m1blk *::after { animation: none !important; transition: none !important; }
  .m1blk-replay { display: none; }
}

.m1blk { min-height: 520px; padding: 24px clamp(20px, 5vw, 64px) 72px; background: var(--m1blk-bg); color: var(--m1blk-ink); }
.m1blk-top { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 18px; border-bottom: 1px solid var(--m1blk-line); }
.m1blk-word { font-weight: 700; font-size: 15px; letter-spacing: .01em; }
.m1blk-nav { display: flex; gap: 4px; margin: 0; padding: 0; list-style: none; }
.m1blk-nav a { display: inline-flex; align-items: center; min-height: 40px; padding: 0 10px; color: var(--m1blk-quiet); font-size: 14px; text-decoration: none; border-radius: 4px; }
.m1blk-nav a:hover { color: var(--m1blk-ink); }
.m1blk a:focus-visible { outline: 2px solid var(--m1blk-focus); outline-offset: 2px; }
.m1blk-hero { display: grid; grid-template-columns: 1.3fr 1fr; gap: 40px; align-items: center; max-width: 1100px; margin: 0 auto; padding-top: 56px; }
.m1blk-eyebrow { margin: 0 0 14px; font-size: 12px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--m1blk-quiet); }
.m1blk-h { margin: 0; max-width: 13em; font-size: clamp(32px, 4.6vw, 54px); line-height: 1.04; letter-spacing: -.025em; font-weight: 700; }
.m1blk-p { margin: 18px 0 26px; max-width: 30em; font-size: 16px; line-height: 1.6; color: var(--m1blk-quiet); }
.m1blk-btn { display: inline-flex; align-items: center; min-height: 46px; padding: 0 22px; background: var(--m1blk-ink); color: #f4f5f6; border-radius: 3px; font-weight: 600; font-size: 15px; text-decoration: none; }
.m1blk-corner { justify-self: end; width: min(100%, 300px); aspect-ratio: 1; display: grid; place-items: center; }
.m1blk-mark { width: 100%; height: auto; overflow: visible; }
.m1blk-mark > * { transform-box: fill-box; transform-origin: center; }
.m1blk-p1 { fill: var(--m1blk-a); }
.m1blk-p2 { fill: var(--m1blk-b); }
.m1blk-p3 { fill: var(--m1blk-c); }
.m1blk-p4 { fill: var(--m1blk-d); }
.m1blk-p5 { fill: var(--m1blk-bg); }
@media (max-width: 720px) {
  .m1blk-hero { grid-template-columns: 1fr; gap: 28px; padding-top: 32px; }
  .m1blk-corner { order: -1; justify-self: start; width: 120px; }
}
@media (prefers-reduced-motion: no-preference) {
  .m1blk.is-js:not([data-run]) .m1blk-mark > * { opacity: 0; }
}
.m1blk[data-run] .m1blk-p1 { animation: m1blk-in1 .8s cubic-bezier(.2, .8, .2, 1) .05s both; }
.m1blk[data-run] .m1blk-p2 { animation: m1blk-in2 .8s cubic-bezier(.2, .8, .2, 1) .17s both; }
.m1blk[data-run] .m1blk-p3 { animation: m1blk-in3 .8s cubic-bezier(.2, .8, .2, 1) .29s both; }
.m1blk[data-run] .m1blk-p4 { animation: m1blk-in4 .8s cubic-bezier(.2, .8, .2, 1) .41s both; }
.m1blk[data-run] .m1blk-p5 { animation: m1blk-pop .5s cubic-bezier(.2, .8, .2, 1) .95s both; }
@keyframes m1blk-in1 { from { opacity: 0; transform: translate(calc(var(--m1blk-far) * -1), 0); } 40% { opacity: 1; } to { opacity: 1; transform: none; } }
@keyframes m1blk-in2 { from { opacity: 0; transform: translate(0, calc(var(--m1blk-far) * -1)); } 40% { opacity: 1; } to { opacity: 1; transform: none; } }
@keyframes m1blk-in3 { from { opacity: 0; transform: translate(0, var(--m1blk-far)); } 40% { opacity: 1; } to { opacity: 1; transform: none; } }
@keyframes m1blk-in4 { from { opacity: 0; transform: translate(var(--m1blk-far), 0); } 40% { opacity: 1; } to { opacity: 1; transform: none; } }
@keyframes m1blk-pop { from { opacity: 0; transform: scale(.2); } to { opacity: 1; transform: none; } }
`;

// Runs before paint in the browser so the logo never flashes before its reveal.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function GeometricBlockMarkSlidesTogetherIn() {
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
    const btn = root.querySelector(".m1blk-replay");
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
    <section ref={rootRef} className="m1blk">
      <style>{CSS}</style>
<header className="m1blk-top">
  <span className="m1blk-word">Pellow Stoneworks</span>
  <nav aria-label="Main"><ul className="m1blk-nav"><li><a href="#">Work</a></li><li><a href="#">Yard</a></li><li><a href="#">Contact</a></li></ul></nav>
</header>
<div className="m1blk-hero">
  <div className="m1blk-copy">
    <p className="m1blk-eyebrow">Masonry workshop, Penryn</p>
    <h2 className="m1blk-h">Steps, sills and hearths cut to your drawings.</h2>
    <p className="m1blk-p">Bring a sketch or a set of plans. We template on site, cut in the yard and fit it ourselves.</p>
    <a className="m1blk-btn" href="#">Book a site visit</a>
  </div>
  <div className="m1blk-corner">
    <svg className="m1blk-mark" viewBox="0 0 100 100" role="img" aria-label="Pellow Stoneworks mark" focusable="false">
      <rect className="m1blk-p1" x="4" y="4" width="44" height="44" rx="2"/>
      <path className="m1blk-p2" d="M52 48V4A44 44 0 0 1 96 48Z"/>
      <path className="m1blk-p3" d="M48 52V96A44 44 0 0 1 4 52Z"/>
      <rect className="m1blk-p4" x="52" y="52" width="44" height="44" rx="2"/>
      <rect className="m1blk-p5" x="64" y="64" width="20" height="20" rx="1"/>
    </svg>
  </div>
</div>
<button type="button" className="m1blk-replay" aria-label="Replay logo animation"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

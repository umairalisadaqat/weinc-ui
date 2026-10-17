import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the colours at the top of .m1sea; the ring words are in the textPath.
const CSS = `
.m1sea { --m1sea-bg: #f2ede1; --m1sea-ink: #1e3a2b; --m1sea-quiet: #4b5d50; --m1sea-line: #cbd2c4; --m1sea-focus: #a5672c; --m1sea-cream: #f8f4ea; }
.m1sea { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
.m1sea *, .m1sea *::before, .m1sea *::after { box-sizing: border-box; }
.m1sea-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.m1sea-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m1sea-line); border-radius: 999px; background: transparent; color: var(--m1sea-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m1sea-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m1sea-replay:hover { color: var(--m1sea-ink); }
.m1sea-replay:focus-visible { outline: 2px solid var(--m1sea-focus); outline-offset: 2px; }
/* Reduced motion: no movement at all, the finished logo shows straight away. */
@media (prefers-reduced-motion: reduce) {
  .m1sea *, .m1sea *::before, .m1sea *::after { animation: none !important; transition: none !important; }
  .m1sea-replay { display: none; }
}

.m1sea { min-height: 480px; display: flex; align-items: center; justify-content: center; padding: 52px 20px 72px; background: var(--m1sea-bg); color: var(--m1sea-ink); }
.m1sea-wrap { display: flex; align-items: center; gap: 52px; max-width: 820px; width: 100%; }
.m1sea-mark { flex: none; width: 240px; height: 240px; overflow: visible; filter: drop-shadow(0 18px 22px rgba(30, 58, 43, .22)); }
.m1sea-disc { fill: var(--m1sea-ink); }
.m1sea-mark .m1sea-s { fill: none; stroke: var(--m1sea-cream); stroke-width: 1.4; stroke-dasharray: 1; stroke-dashoffset: 0; }
.m1sea-ringtext, .m1sea-centre { transform-box: view-box; transform-origin: 100px 100px; }
.m1sea-ringtext text { fill: var(--m1sea-cream); font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; font-size: 12.5px; font-weight: 700; letter-spacing: 2px; dominant-baseline: middle; }
.m1sea-bottle { fill: none; stroke: var(--m1sea-cream); stroke-width: 2.6; stroke-linejoin: round; }
.m1sea-label { fill: var(--m1sea-cream); }
.m1sea-eyebrow { margin: 0 0 10px; font-size: 12px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--m1sea-quiet); }
.m1sea-h { margin: 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(30px, 4vw, 42px); line-height: 1.08; }
.m1sea-p { margin: 14px 0 6px; max-width: 28em; font-size: 15.5px; line-height: 1.6; color: var(--m1sea-quiet); }
.m1sea-link { display: inline-flex; align-items: center; min-height: 40px; color: var(--m1sea-ink); font-weight: 600; font-size: 14.5px; text-decoration: underline; text-underline-offset: 5px; text-decoration-color: #9fae9a; }
.m1sea-link:focus-visible { outline: 2px solid var(--m1sea-focus); outline-offset: 3px; }
@media (max-width: 640px) {
  .m1sea-wrap { flex-direction: column; align-items: flex-start; gap: 28px; }
  .m1sea-mark { width: 168px; height: 168px; }
}
@media (prefers-reduced-motion: no-preference) {
  .m1sea.is-js:not([data-run]) .m1sea-mark .m1sea-s { stroke-dashoffset: 1; }
  .m1sea.is-js:not([data-run]) .m1sea-ringtext, .m1sea.is-js:not([data-run]) .m1sea-centre, .m1sea.is-js:not([data-run]) .m1sea-txt { opacity: 0; }
}
.m1sea[data-run] .m1sea-mark .m1sea-s { animation: m1sea-draw .8s cubic-bezier(.65, 0, .35, 1) both; }
.m1sea[data-run] .m1sea-i { animation-delay: .15s !important; }
.m1sea[data-run] .m1sea-ringtext { animation: m1sea-turn 1.25s cubic-bezier(.16, .84, .3, 1) .1s both; }
.m1sea[data-run] .m1sea-centre { animation: m1sea-settle .7s cubic-bezier(.2, .8, .2, 1) .55s both; }
.m1sea[data-run] .m1sea-txt { animation: m1sea-up .7s cubic-bezier(.2, .7, .2, 1) .35s both; }
@keyframes m1sea-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes m1sea-turn { from { opacity: 0; transform: rotate(-150deg); } 35% { opacity: 1; } to { opacity: 1; transform: none; } }
@keyframes m1sea-settle { from { opacity: 0; transform: scale(.82); } to { opacity: 1; transform: none; } }
@keyframes m1sea-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
`;

// Runs before paint in the browser so the logo never flashes before its reveal.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function CircularSealLogoWithRingText() {
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
    const btn = root.querySelector(".m1sea-replay");
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
    <section ref={rootRef} className="m1sea">
      <style>{CSS}</style>
<div className="m1sea-wrap">
  <svg className="m1sea-mark" viewBox="0 0 200 200" role="img" aria-label="Fenwick Hill Dairy seal" focusable="false">
    <defs><path id="m1sea-arc" d="M100 100m-75 0a75 75 0 1 1 150 0a75 75 0 1 1-150 0"/></defs>
    <circle className="m1sea-disc" cx="100" cy="100" r="96"/>
    <circle className="m1sea-o m1sea-s" cx="100" cy="100" r="91" pathLength="1" transform="rotate(-90 100 100)"/>
    <circle className="m1sea-i m1sea-s" cx="100" cy="100" r="60" pathLength="1" transform="rotate(90 100 100)"/>
    <g className="m1sea-ringtext"><text><textPath href="#m1sea-arc" textLength="465" lengthAdjust="spacing">FENWICK HILL DAIRY · CREAM · BUTTER · CHEESE ·</textPath></text></g>
    <g className="m1sea-centre">
      <path className="m1sea-bottle" d="M92 66h16v7c0 3-3 4-3 7v4c8 4 11 10 11 18v26c0 4-3 7-7 7H91c-4 0-7-3-7-7v-26c0-8 3-14 11-18v-4c0-3-3-4-3-7z"/>
      <path className="m1sea-label" d="M86 108h28v14H86z"/>
    </g>
  </svg>
  <div className="m1sea-txt">
    <p className="m1sea-eyebrow">From the cheese room</p>
    <h2 className="m1sea-h">Fenwick Hill Dairy</h2>
    <p className="m1sea-p">Butter churned on Tuesdays and a soft cheese washed by hand, made with milk from our own small herd outside Hexham.</p>
    <a className="m1sea-link" href="#">Where to buy</a>
  </div>
</div>
<button type="button" className="m1sea-replay" aria-label="Replay logo animation"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

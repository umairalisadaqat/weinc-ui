import { useEffect, useLayoutEffect, useRef } from "react";

// Edit these first: the colours at the top of .m1msk; the wordmark size is the clamp() on .m1msk-word.
const CSS = `
.m1msk { --m1msk-bg: #101d2f; --m1msk-ink: #f3efe6; --m1msk-quiet: #b8bfca; --m1msk-line: #34445a; --m1msk-focus: #d3b06e; --m1msk-brass: #c9a560; }
.m1msk { position: relative; box-sizing: border-box; overflow: hidden; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
.m1msk *, .m1msk *::before, .m1msk *::after { box-sizing: border-box; }
.m1msk-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.m1msk-replay { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border: 1px solid var(--m1msk-line); border-radius: 999px; background: transparent; color: var(--m1msk-quiet); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
.m1msk-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.m1msk-replay:hover { color: var(--m1msk-ink); }
.m1msk-replay:focus-visible { outline: 2px solid var(--m1msk-focus); outline-offset: 2px; }
/* Reduced motion: no movement at all, the finished logo shows straight away. */
@media (prefers-reduced-motion: reduce) {
  .m1msk *, .m1msk *::before, .m1msk *::after { animation: none !important; transition: none !important; }
  .m1msk-replay { display: none; }
}

.m1msk { min-height: 480px; display: flex; align-items: center; padding: 56px clamp(20px, 5vw, 72px) 76px; background: var(--m1msk-bg); color: var(--m1msk-ink); }
.m1msk-inner { width: 100%; max-width: 1180px; margin: 0 auto; }
.m1msk-eyebrow { display: flex; justify-content: space-between; margin: 0 0 18px; font-size: 12px; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; color: var(--m1msk-quiet); }
.m1msk-h { margin: 0; font-weight: 400; line-height: 1; }
.m1msk-win { position: relative; display: inline-block; overflow: hidden; padding: .04em .02em .1em 0; }
.m1msk-word { display: block; font-family: Georgia, "Times New Roman", serif; font-size: clamp(54px, 13.4vw, 184px); letter-spacing: -.03em; line-height: .95; }
.m1msk-cover { position: absolute; inset: 0; background: var(--m1msk-bg); transform: translateX(101%); }
.m1msk-cover::before { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 6px; background: var(--m1msk-brass); }
.m1msk-rule { display: block; height: 1px; margin: 26px 0 22px; background: var(--m1msk-line); transform-origin: left; }
.m1msk-cols { display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
.m1msk-cols p { margin: 0; max-width: 30em; font-size: 16px; line-height: 1.6; color: var(--m1msk-quiet); }
.m1msk-cols a { display: inline-flex; align-items: center; min-height: 40px; margin-right: 22px; color: var(--m1msk-ink); font-size: 15px; font-weight: 500; text-decoration: underline; text-underline-offset: 5px; text-decoration-color: var(--m1msk-brass); }
.m1msk-cols a:focus-visible { outline: 2px solid var(--m1msk-focus); outline-offset: 3px; }
@media (prefers-reduced-motion: no-preference) {
  .m1msk.is-js:not([data-run]) .m1msk-cover { transform: none; }
  .m1msk.is-js:not([data-run]) .m1msk-rule { transform: scaleX(0); }
  .m1msk.is-js:not([data-run]) .m1msk-cols, .m1msk.is-js:not([data-run]) .m1msk-eyebrow { opacity: 0; }
}
.m1msk[data-run] .m1msk-cover { animation: m1msk-wipe 1.05s cubic-bezier(.7, 0, .2, 1) .1s both; }
.m1msk[data-run] .m1msk-rule { animation: m1msk-grow .9s cubic-bezier(.6, 0, .2, 1) .45s both; }
.m1msk[data-run] .m1msk-eyebrow { animation: m1msk-fade .6s ease-out .2s both; }
.m1msk[data-run] .m1msk-cols { animation: m1msk-up .6s cubic-bezier(.2, .7, .2, 1) .85s both; }
@keyframes m1msk-wipe { from { transform: none; } to { transform: translateX(101%); } }
@keyframes m1msk-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes m1msk-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes m1msk-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
`;

// Runs before paint in the browser so the logo never flashes before its reveal.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function WordmarkUncoveredBySlidingMaskOn() {
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
    const btn = root.querySelector(".m1msk-replay");
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
    <section ref={rootRef} className="m1msk">
      <style>{CSS}</style>
<div className="m1msk-inner">
  <p className="m1msk-eyebrow"><span>Office for Architecture</span><span>Leeds</span></p>
  <h2 className="m1msk-h">
    <span className="m1msk-win"><span className="m1msk-word">Northfield</span><span className="m1msk-cover" aria-hidden="true"></span></span>
  </h2>
  <span className="m1msk-rule" aria-hidden="true"></span>
  <div className="m1msk-cols">
    <p>Housing, schools and quiet civic buildings for the north of England.</p>
    <p><a href="#">Selected projects</a><a href="#">Studio</a></p>
  </div>
</div>
<button type="button" className="m1msk-replay" aria-label="Replay logo animation"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.5 11a5.5 5.5 0 1 0 1.8-4.6"/><path d="M5 3.2v3.6h3.6"/></svg>Replay</button>
    </section>
  );
}

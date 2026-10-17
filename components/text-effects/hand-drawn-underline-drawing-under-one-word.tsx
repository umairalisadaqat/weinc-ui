import { useEffect, useRef } from "react";

const BUSINESS = "Pell & Daughter Tailors";
const COPY = "Hems, sleeves and waistbands adjusted in our Kirkgate shop, usually ready within the week. Bring the shoes you will wear with them.";

const CSS = `
/* Edit these first: colours, and how long one full cycle takes. */
.ud-root {
  --ud-bg: #f5eee2;
  --ud-ink: #231c17;
  --ud-muted: #5f5246;
  --ud-accent: #c0562c;
  --ud-speed: 6.5s;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 72px 20px;
  background: var(--ud-bg);
  color: var(--ud-ink);
  font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.ud-root *, .ud-root *::before, .ud-root *::after { box-sizing: border-box; }
.ud-inner { position: relative; z-index: 1; width: 100%; max-width: 1040px; }
.ud-eyebrow { margin: 0 0 22px; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--ud-muted); }
.ud-h { margin: 0; font-size: clamp(40px, 7vw, 88px); font-weight: 800; line-height: 1.06; letter-spacing: -.03em; }
.ud-copy { margin: 28px 0 0; max-width: 34em; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: clamp(16px, 1.5vw, 19px); line-height: 1.6; color: var(--ud-muted); }
.ud-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ud-w { display: inline-block; white-space: nowrap; }
.ud-l { display: inline-block; }
/* Paused while scrolled out of view (the script sets data-paused). */
.ud-root[data-paused="true"] *, .ud-root[data-paused="true"] *::before, .ud-root[data-paused="true"] *::after { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .ud-root *, .ud-root *::before, .ud-root *::after { animation: none !important; }
}

.ud-h { max-width: 13em; }
.ud-mark { position: relative; display: inline-block; white-space: nowrap; }
.ud-svg { position: absolute; left: -.05em; bottom: -.2em; width: calc(100% + .1em); height: .34em; overflow: visible; pointer-events: none; }
.ud-svg path {
  fill: none;
  stroke: var(--ud-accent);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 0;
  animation: ud-draw var(--ud-speed) cubic-bezier(.6, 0, .25, 1) infinite;
}
.ud-svg path + path { stroke-width: 3.5; animation-name: ud-draw-2; }
@keyframes ud-draw {
  0%, 6% { stroke-dashoffset: 1; opacity: 0; }
  7% { opacity: 1; }
  26%, 84% { stroke-dashoffset: 0; }
  95% { opacity: 1; }
  96%, 100% { stroke-dashoffset: -1; opacity: 0; }
}
@keyframes ud-draw-2 {
  0%, 22% { stroke-dashoffset: 1; opacity: 0; }
  23% { opacity: 1; }
  36%, 84% { stroke-dashoffset: 0; }
  95% { opacity: 1; }
  96%, 100% { stroke-dashoffset: -1; opacity: 0; }
}
`;

export default function HandDrawnUnderlineWord() {
  const rootRef = useRef<HTMLElement>(null);

  // Pause the CSS animation while the section is off screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => {
      el.dataset.paused = entry.isIntersecting ? "false" : "true";
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef} data-paused="false" className="ud-root w-full">
      <style>{CSS}</style>
      <div className="ud-inner">
        <p className="ud-eyebrow">{BUSINESS}</p>
        <h2 className="ud-h">
          Alterations for the way you{" "}
          <span className="ud-mark">
            actually
            <svg className="ud-svg" viewBox="0 0 300 26" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path pathLength={1} d="M6 15 C 70 6, 140 20, 210 11 S 282 8, 295 13" />
              <path pathLength={1} d="M28 22 C 100 15, 196 20, 280 14" />
            </svg>
          </span>{" "}
          move.
        </h2>
        <p className="ud-copy">{COPY}</p>
      </div>
    </section>
  );
}

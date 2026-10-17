import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

const BUSINESS = "Arden Vale Architects";
const LINES = [
  "We design small buildings",
  "for steep sites, tight budgets",
  "and clients who mean",
  "to stay for decades."
];
const COPY = "A four-person practice in the Calder valley. Houses, studios, a boathouse and one very good village hall.";

const CSS = `
/* Edit these first: colours, and how long one full cycle takes. */
.ml-root {
  --ml-bg: #ebe6dd;
  --ml-ink: #24211d;
  --ml-muted: #5b5248;
  --ml-accent: #7a5a3a;
  --ml-speed: 9s;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 72px 20px;
  background: var(--ml-bg);
  color: var(--ml-ink);
  font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif;
  -webkit-font-smoothing: antialiased;
}
.ml-root *, .ml-root *::before, .ml-root *::after { box-sizing: border-box; }
.ml-inner { position: relative; z-index: 1; width: 100%; max-width: 980px; }
.ml-eyebrow { margin: 0 0 22px; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--ml-muted); }
.ml-h { margin: 0; font-size: clamp(26px, 4.8vw, 62px); font-weight: 400; line-height: 1.14; letter-spacing: -.015em; }
.ml-copy { margin: 28px 0 0; max-width: 34em; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: clamp(16px, 1.5vw, 19px); line-height: 1.6; color: var(--ml-muted); }
.ml-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ml-w { display: inline-block; white-space: nowrap; }
.ml-l { display: inline-block; }
/* Paused while scrolled out of view (the script sets data-paused). */
.ml-root[data-paused="true"] *, .ml-root[data-paused="true"] *::before, .ml-root[data-paused="true"] *::after { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .ml-root *, .ml-root *::before, .ml-root *::after { animation: none !important; }
}

.ml-line { display: block; overflow: hidden; padding-bottom: .08em; margin-bottom: -.08em; }
.ml-line:last-child { font-style: italic; color: var(--ml-accent); }
.ml-in {
  display: block;
  animation: ml-up var(--ml-speed) cubic-bezier(.2, .8, .2, 1) infinite both;
  animation-delay: calc(var(--i) * 140ms); /* gap between lines */
}
.ml-copy { border-top: 1px solid rgba(36, 33, 29, .18); padding-top: 22px; }
@keyframes ml-up {
  0% { transform: translateY(110%); }
  12% { transform: translateY(0); }
  86% { transform: translateY(0); animation-timing-function: cubic-bezier(.6, 0, .8, .4); }
  97%, 100% { transform: translateY(-110%); }
}
`;

export default function MaskedLineSlideUp() {
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
    <section ref={rootRef} data-paused="false" className="ml-root w-full">
      <style>{CSS}</style>
      <div className="ml-inner">
        <p className="ml-eyebrow">{BUSINESS}</p>
        <h2 className="ml-h">
          <span className="ml-sr">{LINES.join(" ")}</span>
          <span aria-hidden="true">
            {LINES.map((line, i) => (
              <span key={line} className="ml-line">
                <span className="ml-in" style={{ "--i": i } as CSSProperties}>
                  {line}
                </span>
              </span>
            ))}
          </span>
        </h2>
        <p className="ml-copy">{COPY}</p>
      </div>
    </section>
  );
}

import { Fragment, useEffect, useRef } from "react";
import type { CSSProperties } from "react";

const BUSINESS = "Fernwick Ferry Company";
const HEADLINE = "Next crossing leaves at 7:40.";
const COPY = "Foot passengers and bikes to Holm Island, six sailings a day. Tickets from the hut on the quay or from the crew on board.";

const CSS = `
/* Edit these first: colours, and how long one full cycle takes. */
.fl-root {
  --fl-bg: #1b2430;
  --fl-ink: #f3efe6;
  --fl-muted: #aab5c3;
  --fl-accent: #f2b84b;
  --fl-speed: 8s;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 72px 20px;
  background: var(--fl-bg);
  color: var(--fl-ink);
  font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.fl-root *, .fl-root *::before, .fl-root *::after { box-sizing: border-box; }
.fl-inner { position: relative; z-index: 1; width: 100%; max-width: 1040px; }
.fl-eyebrow { margin: 0 0 22px; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--fl-muted); }
.fl-h { margin: 0; font-size: clamp(42px, 7.8vw, 100px); font-weight: 800; line-height: 1.02; letter-spacing: -.035em; }
.fl-copy { margin: 28px 0 0; max-width: 34em; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: clamp(16px, 1.5vw, 19px); line-height: 1.6; color: var(--fl-muted); }
.fl-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.fl-w { display: inline-block; white-space: nowrap; }
.fl-l { display: inline-block; }
/* Paused while scrolled out of view (the script sets data-paused). */
.fl-root[data-paused="true"] *, .fl-root[data-paused="true"] *::before, .fl-root[data-paused="true"] *::after { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .fl-root *, .fl-root *::before, .fl-root *::after { animation: none !important; }
}

.fl-root { background: linear-gradient(180deg, #222d3b 0%, var(--fl-bg) 60%, #161d27 100%); }
.fl-h { max-width: 11em; }
.fl-h .fl-w { perspective: 700px; }
.fl-h .fl-w:last-child { color: var(--fl-accent); }
.fl-l {
  transform-origin: 50% 85%;
  backface-visibility: hidden;
  animation: fl-flip var(--fl-speed) infinite both;
  animation-delay: calc(var(--i) * 34ms);
}
@keyframes fl-flip {
  0% { opacity: 0; transform: rotateX(-100deg); animation-timing-function: cubic-bezier(.25, 1.45, .45, 1); }
  13% { opacity: 1; transform: rotateX(0); }
  86% { opacity: 1; transform: rotateX(0); animation-timing-function: cubic-bezier(.55, 0, .75, .4); }
  96%, 100% { opacity: 0; transform: rotateX(90deg); }
}
`;

/** Splits text into words (so lines still wrap) and letters, each letter numbered with --i. */
function Letters({ text }: { text: string }) {
  let i = 0;
  return (
    <span aria-hidden="true">
      {text.split(" ").map((word, w) => (
        <Fragment key={w}>
          {w > 0 && " "}
          <span className="fl-w">
            {[...word].map((ch, c) => (
              <span key={c} className="fl-l" style={{ "--i": i++ } as CSSProperties}>
                {ch}
              </span>
            ))}
          </span>
        </Fragment>
      ))}
    </span>
  );
}

export default function LettersFlippingIntoPlace() {
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
    <section ref={rootRef} data-paused="false" className="fl-root w-full">
      <style>{CSS}</style>
      <div className="fl-inner">
        <p className="fl-eyebrow">{BUSINESS}</p>
        <h2 className="fl-h">
          <span className="fl-sr">{HEADLINE}</span>
          <Letters text={HEADLINE} />
        </h2>
        <p className="fl-copy">{COPY}</p>
      </div>
    </section>
  );
}

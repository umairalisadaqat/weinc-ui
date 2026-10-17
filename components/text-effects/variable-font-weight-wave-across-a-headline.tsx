import { Fragment, useEffect, useRef } from "react";
import type { CSSProperties } from "react";

const BUSINESS = "Bellows Records & Listening Bar";
const HEADLINE = "Turn it up on Friday nights.";
const COPY = "New arrivals on the front wall, a different guest selector every week, and the good speakers stay on until one.";

const CSS = `
/* Edit these first: colours, and how long one full cycle takes. */
.vw-root {
  --vw-bg: #efe3d0;
  --vw-ink: #2a1b12;
  --vw-muted: #5e4433;
  --vw-accent: #a8401f;
  --vw-speed: 2.6s;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 72px 20px;
  background: var(--vw-bg);
  color: var(--vw-ink);
  font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.vw-root *, .vw-root *::before, .vw-root *::after { box-sizing: border-box; }
.vw-inner { position: relative; z-index: 1; width: 100%; max-width: 1040px; }
.vw-eyebrow { margin: 0 0 22px; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--vw-muted); }
.vw-h { margin: 0; font-size: clamp(44px, 8vw, 104px); font-weight: 300; line-height: 1; letter-spacing: -.025em; }
.vw-copy { margin: 28px 0 0; max-width: 34em; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: clamp(16px, 1.5vw, 19px); line-height: 1.6; color: var(--vw-muted); }
.vw-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.vw-w { display: inline-block; white-space: nowrap; }
.vw-l { display: inline-block; }
/* Paused while scrolled out of view (the script sets data-paused). */
.vw-root[data-paused="true"] *, .vw-root[data-paused="true"] *::before, .vw-root[data-paused="true"] *::after { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .vw-root *, .vw-root *::before, .vw-root *::after { animation: none !important; }
}

.vw-h { max-width: 11em; }
/* Each letter reserves the width of its boldest version, so the line never shifts as weights change. */
.vw-l { display: inline-grid; justify-items: center; }
.vw-l::after { content: attr(data-ch); grid-area: 1 / 1; font-weight: 900; visibility: hidden; }
.vw-g {
  grid-area: 1 / 1;
  font-weight: 560;
  animation: vw-pulse var(--vw-speed) ease-in-out infinite;
  animation-delay: calc(var(--i) * 55ms - 3s); /* wave spacing */
}
/* font-variation-settings drives variable fonts; font-weight covers fonts without a wght axis. */
@keyframes vw-pulse {
  0%, 100% { font-weight: 260; font-variation-settings: "wght" 260; color: var(--vw-ink); }
  50% { font-weight: 900; font-variation-settings: "wght" 900; color: var(--vw-accent); }
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
          <span className="vw-w">
            {[...word].map((ch, c) => (
              <span key={c} className="vw-l" data-ch={ch} style={{ "--i": i++ } as CSSProperties}>
                <span className="vw-g">{ch}</span>
              </span>
            ))}
          </span>
        </Fragment>
      ))}
    </span>
  );
}

export default function VariableWeightWave() {
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
    <section ref={rootRef} data-paused="false" className="vw-root w-full">
      <style>{CSS}</style>
      <div className="vw-inner">
        <p className="vw-eyebrow">{BUSINESS}</p>
        <h2 className="vw-h">
          <span className="vw-sr">{HEADLINE}</span>
          <Letters text={HEADLINE} />
        </h2>
        <p className="vw-copy">{COPY}</p>
      </div>
    </section>
  );
}

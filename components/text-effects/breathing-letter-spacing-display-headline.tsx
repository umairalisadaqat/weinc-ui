import { Fragment, useEffect, useRef } from "react";
import type { CSSProperties } from "react";

const BUSINESS = "Nightjar Reading Room";
const HEADLINE = "Quiet hours";
const COPY = "A members' library on Fenner Street, open until midnight from Thursday to Sunday. Phones rest in a basket by the door.";

const CSS = `
/* Edit these first: colours, and how long one full cycle takes. */
.ls-root {
  --ls-bg: #0c1322;
  --ls-ink: #e9edf5;
  --ls-muted: #a3aec2;
  --ls-accent: #f4d9a6;
  --ls-speed: 7s;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 72px 20px;
  background: var(--ls-bg);
  color: var(--ls-ink);
  font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.ls-root *, .ls-root *::before, .ls-root *::after { box-sizing: border-box; }
.ls-inner { position: relative; z-index: 1; width: 100%; max-width: 1040px; text-align: center; }
.ls-eyebrow { margin: 0 0 22px; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--ls-muted); }
.ls-h { margin: 0; font-size: clamp(34px, 9vw, 128px); font-weight: 700; line-height: 1; letter-spacing: .05em; }
.ls-copy { margin: 28px auto 0; max-width: 34em; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: clamp(16px, 1.5vw, 19px); line-height: 1.6; color: var(--ls-muted); }
.ls-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ls-w { display: inline-block; white-space: nowrap; }
.ls-l { display: inline-block; }
/* Paused while scrolled out of view (the script sets data-paused). */
.ls-root[data-paused="true"] *, .ls-root[data-paused="true"] *::before, .ls-root[data-paused="true"] *::after { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .ls-root *, .ls-root *::before, .ls-root *::after { animation: none !important; }
}

.ls-root { background: radial-gradient(ellipse 60% 55% at 50% 48%, #1d2b49 0%, var(--ls-bg) 70%); }
.ls-h { text-transform: uppercase; white-space: nowrap; text-shadow: 0 0 40px rgba(244, 217, 166, .18); }
.ls-l {
  /* --c is the middle letter, so the line opens and closes around its centre. */
  animation: ls-breathe var(--ls-speed) cubic-bezier(.45, 0, .55, 1) infinite;
}
.ls-lamp { display: block; width: 6px; height: 6px; margin: 0 auto 26px; border-radius: 50%; background: var(--ls-accent); box-shadow: 0 0 18px 4px rgba(244, 217, 166, .45); animation: ls-glow var(--ls-speed) ease-in-out infinite; }
@keyframes ls-breathe {
  0%, 100% { transform: translateX(calc((var(--i) - var(--c)) * -.02em)); opacity: .8; }
  50% { transform: translateX(calc((var(--i) - var(--c)) * .09em)); opacity: 1; }
}
@keyframes ls-glow { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
`;

/** Splits text into words (so lines still wrap) and letters, each letter numbered with --i. */
function Letters({ text }: { text: string }) {
  let i = 0;
  return (
    <span aria-hidden="true">
      {text.split(" ").map((word, w) => (
        <Fragment key={w}>
          {w > 0 && " "}
          <span className="ls-w">
            {[...word].map((ch, c) => (
              <span key={c} className="ls-l" style={{ "--i": i++ } as CSSProperties}>
                {ch}
              </span>
            ))}
          </span>
        </Fragment>
      ))}
    </span>
  );
}

export default function BreathingLetterSpacing() {
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
    <section ref={rootRef} data-paused="false" className="ls-root w-full">
      <style>{CSS}</style>
      <div className="ls-inner">
        <p className="ls-eyebrow">{BUSINESS}</p>
        <span className="ls-lamp" aria-hidden="true" />
        <h2 className="ls-h" style={{ "--c": (HEADLINE.replace(/ /g, "").length - 1) / 2 } as CSSProperties}>
          <span className="ls-sr">{HEADLINE}</span>
          <Letters text={HEADLINE} />
        </h2>
        <p className="ls-copy">{COPY}</p>
      </div>
    </section>
  );
}

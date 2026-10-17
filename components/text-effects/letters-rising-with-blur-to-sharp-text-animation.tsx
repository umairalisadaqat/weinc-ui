import { Fragment, useEffect, useRef } from "react";
import type { CSSProperties } from "react";

const BUSINESS = "Halden Street Bakery";
const HEADLINE = "Bread worth waking up for.";
const COPY = "Long-fermented sourdough and seeded rye, out of the oven at half six and usually gone by noon on Saturdays.";

const CSS = `
/* Edit these first: colours, and how long one full cycle takes. */
.rb-root {
  --rb-bg: #f4eee3;
  --rb-ink: #1f1a14;
  --rb-muted: #65584a;
  --rb-accent: #b0652c;
  --rb-speed: 7.5s;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 72px 20px;
  background: var(--rb-bg);
  color: var(--rb-ink);
  font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.rb-root *, .rb-root *::before, .rb-root *::after { box-sizing: border-box; }
.rb-inner { position: relative; z-index: 1; width: 100%; max-width: 1040px; }
.rb-eyebrow { margin: 0 0 22px; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--rb-muted); }
.rb-h { margin: 0; font-size: clamp(46px, 8.6vw, 112px); font-weight: 800; line-height: .98; letter-spacing: -.035em; }
.rb-copy { margin: 28px 0 0; max-width: 34em; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: clamp(16px, 1.5vw, 19px); line-height: 1.6; color: var(--rb-muted); }
.rb-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.rb-w { display: inline-block; white-space: nowrap; }
.rb-l { display: inline-block; }
/* Paused while scrolled out of view (the script sets data-paused). */
.rb-root[data-paused="true"] *, .rb-root[data-paused="true"] *::before, .rb-root[data-paused="true"] *::after { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .rb-root *, .rb-root *::before, .rb-root *::after { animation: none !important; }
}

.rb-h { max-width: 11em; }
.rb-l {
  animation: rb-rise var(--rb-speed) cubic-bezier(.2, .7, .2, 1) infinite both;
  animation-delay: calc(var(--i) * 28ms); /* gap between letters */
}
.rb-eyebrow::before { content: ""; display: inline-block; width: 28px; height: 1px; margin-right: 12px; vertical-align: middle; background: var(--rb-accent); }
@keyframes rb-rise {
  0% { opacity: 0; transform: translateY(.5em); filter: blur(14px); }
  12% { opacity: 1; transform: translateY(0); filter: blur(0); }
  86% { opacity: 1; transform: translateY(0); filter: blur(0); animation-timing-function: cubic-bezier(.6, 0, .8, .3); }
  97%, 100% { opacity: 0; transform: translateY(-.15em); filter: blur(10px); }
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
          <span className="rb-w">
            {[...word].map((ch, c) => (
              <span key={c} className="rb-l" style={{ "--i": i++ } as CSSProperties}>
                {ch}
              </span>
            ))}
          </span>
        </Fragment>
      ))}
    </span>
  );
}

export default function LettersRisingBlurToSharp() {
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
    <section ref={rootRef} data-paused="false" className="rb-root w-full">
      <style>{CSS}</style>
      <div className="rb-inner">
        <p className="rb-eyebrow">{BUSINESS}</p>
        <h2 className="rb-h">
          <span className="rb-sr">{HEADLINE}</span>
          <Letters text={HEADLINE} />
        </h2>
        <p className="rb-copy">{COPY}</p>
      </div>
    </section>
  );
}

import { Fragment, useEffect, useRef } from "react";
import type { CSSProperties } from "react";

const BUSINESS = "Kettle Cove Swim Club";
const WORD = "Saltwater";
const REST = "mornings, all year.";
const COPY = "We meet by the slipway at eight every Sunday, whatever the weather. Bring a bright hat; the flask of tea is on us.";

const CSS = `
/* Edit these first: colours, and how long one full cycle takes. */
.wv-root {
  --wv-bg: #d6ebe3;
  --wv-ink: #0d3b3a;
  --wv-muted: #2b5a56;
  --wv-accent: #0d3b3a;
  --wv-speed: 2.6s;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 72px 20px;
  background: var(--wv-bg);
  color: var(--wv-ink);
  font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.wv-root *, .wv-root *::before, .wv-root *::after { box-sizing: border-box; }
.wv-inner { position: relative; z-index: 1; width: 100%; max-width: 1040px; }
.wv-eyebrow { margin: 0 0 22px; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--wv-muted); }
.wv-h { margin: 0; font-size: clamp(44px, 7.4vw, 92px); font-weight: 800; line-height: 1.02; letter-spacing: -.035em; }
.wv-copy { margin: 28px 0 0; max-width: 34em; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: clamp(16px, 1.5vw, 19px); line-height: 1.6; color: var(--wv-muted); }
.wv-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.wv-w { display: inline-block; white-space: nowrap; }
.wv-l { display: inline-block; }
/* Paused while scrolled out of view (the script sets data-paused). */
.wv-root[data-paused="true"] *, .wv-root[data-paused="true"] *::before, .wv-root[data-paused="true"] *::after { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .wv-root *, .wv-root *::before, .wv-root *::after { animation: none !important; }
}

.wv-root { background: linear-gradient(180deg, #e3f2ec 0%, var(--wv-bg) 70%, #c7e2d8 100%); }
.wv-word { display: block; font-size: 1.32em; letter-spacing: -.04em; }
.wv-rest { display: block; }
.wv-l {
  animation: wv-ripple var(--wv-speed) ease-in-out infinite;
  animation-delay: calc(var(--i) * 110ms - 3s); /* distance between crests */
}
.wv-sea { display: block; width: 100%; max-width: 560px; height: 14px; margin-top: 26px; overflow: hidden; color: var(--wv-accent); opacity: .45; }
.wv-sea svg { display: block; width: 200%; height: 100%; animation: wv-drift 7s linear infinite; }
@keyframes wv-ripple {
  0%, 100% { transform: translateY(0) rotate(0); }
  25% { transform: translateY(-.15em) rotate(-4deg); }
  50% { transform: translateY(0) rotate(0); }
  75% { transform: translateY(.06em) rotate(3deg); }
}
@keyframes wv-drift { to { transform: translateX(-50%); } }
`;

/** Splits text into words (so lines still wrap) and letters, each letter numbered with --i. */
function Letters({ text }: { text: string }) {
  let i = 0;
  return (
    <span aria-hidden="true">
      {text.split(" ").map((word, w) => (
        <Fragment key={w}>
          {w > 0 && " "}
          <span className="wv-w">
            {[...word].map((ch, c) => (
              <span key={c} className="wv-l" style={{ "--i": i++ } as CSSProperties}>
                {ch}
              </span>
            ))}
          </span>
        </Fragment>
      ))}
    </span>
  );
}

export default function WavyBaselineRipple() {
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
    <section ref={rootRef} data-paused="false" className="wv-root w-full">
      <style>{CSS}</style>
      <div className="wv-inner">
        <p className="wv-eyebrow">{BUSINESS}</p>
        <h2 className="wv-h">
          <span className="wv-sr">{`${WORD} ${REST}`}</span>
          <span className="wv-word">
            <Letters text={WORD} />
          </span>
          <span className="wv-rest" aria-hidden="true">{REST}</span>
        </h2>
        <span className="wv-sea" aria-hidden="true">
          <svg viewBox="0 0 400 14" preserveAspectRatio="none" focusable="false">
            <path d="M0 7 Q 25 1 50 7 T 100 7 T 150 7 T 200 7 T 250 7 T 300 7 T 350 7 T 400 7" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </span>
        <p className="wv-copy">{COPY}</p>
      </div>
    </section>
  );
}

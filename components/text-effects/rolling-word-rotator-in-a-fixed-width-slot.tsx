import { useEffect, useRef } from "react";

const BUSINESS = "Spokewell Cycle Repair";
const WORDS = [
  "flat tyres",
  "loose chains",
  "worn brakes",
  "wobbly wheels"
];
const COPY = "Leave your bike at the Mill Lane workshop before nine and ride it home after five, with the parts list taped to the bars.";

const CSS = `
/* Edit these first: colours, and how long one full cycle takes. */
.wr-root {
  --wr-bg: #13241c;
  --wr-ink: #eef2e8;
  --wr-muted: #a9b9a5;
  --wr-accent: #bfe08f;
  --wr-speed: 10s;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 72px 20px;
  background: var(--wr-bg);
  color: var(--wr-ink);
  font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.wr-root *, .wr-root *::before, .wr-root *::after { box-sizing: border-box; }
.wr-inner { position: relative; z-index: 1; width: 100%; max-width: 1040px; }
.wr-eyebrow { margin: 0 0 22px; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--wr-muted); }
.wr-h { margin: 0; font-size: clamp(40px, 7.6vw, 96px); font-weight: 800; line-height: 1.08; letter-spacing: -.035em; }
.wr-copy { margin: 28px 0 0; max-width: 34em; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: clamp(16px, 1.5vw, 19px); line-height: 1.6; color: var(--wr-muted); }
.wr-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.wr-w { display: inline-block; white-space: nowrap; }
.wr-l { display: inline-block; }
/* Paused while scrolled out of view (the script sets data-paused). */
.wr-root[data-paused="true"] *, .wr-root[data-paused="true"] *::before, .wr-root[data-paused="true"] *::after { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .wr-root *, .wr-root *::before, .wr-root *::after { animation: none !important; }
}

.wr-root { background: radial-gradient(ellipse at 80% 0%, #1f3a2c 0%, var(--wr-bg) 60%); }
.wr-lead { display: block; }
.wr-slot { position: relative; display: inline-grid; height: 1.08em; overflow: hidden; vertical-align: top; color: var(--wr-accent); }
.wr-reserve { grid-area: 1 / 1; visibility: hidden; white-space: nowrap; }
.wr-reel { position: absolute; left: 0; top: 0; animation: wr-roll var(--wr-speed) infinite; }
.wr-reel span { display: block; height: 1.08em; white-space: nowrap; }
.wr-rule { display: block; width: 100%; height: 3px; margin-top: 10px; border-radius: 2px; background: var(--wr-accent); opacity: .35; }
/* Five stops: four words plus the first again, so the loop never jumps. */
@keyframes wr-roll {
  0%, 20% { transform: translateY(0); animation-timing-function: cubic-bezier(.7, 0, .2, 1); }
  25%, 45% { transform: translateY(-1.08em); animation-timing-function: cubic-bezier(.7, 0, .2, 1); }
  50%, 70% { transform: translateY(-2.16em); animation-timing-function: cubic-bezier(.7, 0, .2, 1); }
  75%, 95% { transform: translateY(-3.24em); animation-timing-function: cubic-bezier(.7, 0, .2, 1); }
  100% { transform: translateY(-4.32em); }
}
`;

export default function RollingWordRotator() {
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
    <section ref={rootRef} data-paused="false" className="wr-root w-full">
      <style>{CSS}</style>
      <div className="wr-inner">
        <p className="wr-eyebrow">{BUSINESS}</p>
        <h2 className="wr-h">
          <span className="wr-sr">{`We fix ${WORDS.slice(0, -1).join(", ")} and ${WORDS[WORDS.length - 1]}.`}</span>
          <span aria-hidden="true">
            <span className="wr-lead">We fix</span>
            <span className="wr-slot">
              {WORDS.map((w) => (
                <span key={w} className="wr-reserve">{w}</span>
              ))}
              <span className="wr-reel">
                {[...WORDS, WORDS[0]].map((w, i) => (
                  <span key={i}>{w}</span>
                ))}
              </span>
            </span>
            <span className="wr-rule" />
          </span>
        </h2>
        <p className="wr-copy">{COPY}</p>
      </div>
    </section>
  );
}

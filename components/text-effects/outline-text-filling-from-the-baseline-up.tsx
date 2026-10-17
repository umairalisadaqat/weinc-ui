import { useEffect, useRef } from "react";

const BUSINESS = "Morrow Hill Coffee Roasters";
const HEADLINE = "Roasted before first light.";
const COPY = "Small batches on a twelve-kilo drum every weekday morning, bagged by ten and on the counter of the shop downstairs by noon.";

const CSS = `
/* Edit these first: colours, and how long one full cycle takes. */
.sf-root {
  --sf-bg: #f8dcc6;
  --sf-ink: #3a1d14;
  --sf-muted: #62392a;
  --sf-accent: #9a4322;
  --sf-speed: 7s;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 72px 20px;
  background: linear-gradient(170deg, #fdf1e6 0%, #f8dcc6 55%, #f0c2a4 100%);
  color: var(--sf-ink);
  font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.sf-root *, .sf-root *::before, .sf-root *::after { box-sizing: border-box; }
.sf-inner { position: relative; z-index: 1; width: 100%; max-width: 1040px; }
.sf-eyebrow { margin: 0 0 22px; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--sf-muted); }
.sf-h { margin: 0; font-size: clamp(44px, 8.4vw, 110px); font-weight: 800; line-height: .98; letter-spacing: -.035em; }
.sf-copy { margin: 28px 0 0; max-width: 34em; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: clamp(16px, 1.5vw, 19px); line-height: 1.6; color: var(--sf-muted); }
.sf-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.sf-w { display: inline-block; white-space: nowrap; }
.sf-l { display: inline-block; }
/* Paused while scrolled out of view (the script sets data-paused). */
.sf-root[data-paused="true"] *, .sf-root[data-paused="true"] *::before, .sf-root[data-paused="true"] *::after { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .sf-root *, .sf-root *::before, .sf-root *::after { animation: none !important; }
}

.sf-h { max-width: 10em; font-family: "Arial Black", "Helvetica Neue", Arial, sans-serif; font-weight: 900; letter-spacing: -.045em; }
.sf-stack { display: grid; }
.sf-outline, .sf-fill { grid-area: 1 / 1; }
.sf-outline { color: transparent; -webkit-text-stroke: .02em var(--sf-ink); }
.sf-fill {
  background: linear-gradient(0deg, var(--sf-accent) 0%, var(--sf-ink) 70%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  clip-path: inset(0 0 0 0);
  animation: sf-flood var(--sf-speed) cubic-bezier(.6, 0, .25, 1) infinite;
}
.sf-root::before { content: ""; position: absolute; right: -8%; top: -18%; width: 52vmax; height: 52vmax; max-width: 640px; max-height: 640px; border-radius: 50%; background: radial-gradient(closest-side, rgba(255, 246, 232, .9), rgba(255, 246, 232, 0)); pointer-events: none; }
@keyframes sf-flood {
  0%, 8% { clip-path: inset(100% 0 0 0); }
  44%, 84% { clip-path: inset(0 0 0 0); }
  97%, 100% { clip-path: inset(100% 0 0 0); }
}
`;

export default function OutlineTextFillingUp() {
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
    <section ref={rootRef} data-paused="false" className="sf-root w-full">
      <style>{CSS}</style>
      <div className="sf-inner">
        <p className="sf-eyebrow">{BUSINESS}</p>
        <h2 className="sf-h">
          <span className="sf-sr">{HEADLINE}</span>
          <span className="sf-stack" aria-hidden="true">
            <span className="sf-outline">{HEADLINE}</span>
            <span className="sf-fill">{HEADLINE}</span>
          </span>
        </h2>
        <p className="sf-copy">{COPY}</p>
      </div>
    </section>
  );
}

import { useEffect, useRef } from "react";

const BUSINESS = "Casa Ombra Ceramics";
const COPY = "Stoneware plates, jugs and planters from a two-kiln workshop outside Ronda. The studio is open on Saturday mornings.";

const CSS = `
/* Edit these first: colours, and how long one full cycle takes. */
.ts-root {
  --ts-bg: #e8dccb;
  --ts-ink: #8c3f22;
  --ts-muted: #5c4536;
  --ts-accent: #fff6e4;
  --ts-speed: 11s;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 72px 20px;
  background: var(--ts-bg);
  color: var(--ts-ink);
  font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.ts-root *, .ts-root *::before, .ts-root *::after { box-sizing: border-box; }
.ts-inner { position: relative; z-index: 1; width: 100%; max-width: 1040px; }
.ts-eyebrow { margin: 0 0 22px; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--ts-muted); }
.ts-h { margin: 0; font-size: clamp(42px, 7.6vw, 98px); font-weight: 800; line-height: 1.06; letter-spacing: -.012em; }
.ts-copy { margin: 28px 0 0; max-width: 34em; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: clamp(16px, 1.5vw, 19px); line-height: 1.6; color: var(--ts-muted); }
.ts-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ts-w { display: inline-block; white-space: nowrap; }
.ts-l { display: inline-block; }
/* Paused while scrolled out of view (the script sets data-paused). */
.ts-root[data-paused="true"] *, .ts-root[data-paused="true"] *::before, .ts-root[data-paused="true"] *::after { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .ts-root *, .ts-root *::before, .ts-root *::after { animation: none !important; }
}

.ts-root { --ts-depth: #6b2f17; }
.ts-light {
  position: absolute;
  left: 0;
  top: -40%;
  width: 70%;
  height: 160%;
  background: radial-gradient(closest-side, rgba(255, 246, 228, .95), rgba(255, 246, 228, 0));
  pointer-events: none;
  transform: translateX(20%);
  animation: ts-sun var(--ts-speed) ease-in-out infinite alternate;
}
.ts-h {
  max-width: 11em;
  text-shadow: 0.000em 0.010em 0 var(--ts-depth), 0.000em 0.020em 0 var(--ts-depth), 0.000em 0.030em 0 var(--ts-depth), 0.000em 0.040em 0 var(--ts-depth), 0.000em 0.050em 0 var(--ts-depth), 0.000em .12em .18em rgba(90, 44, 20, .22);
  animation: ts-cast var(--ts-speed) ease-in-out infinite alternate;
}
/* The light travels left to right; the extruded shadow swings the opposite way. */
@keyframes ts-sun { from { transform: translateX(-30%); } to { transform: translateX(70%); } }
@keyframes ts-cast {
  from { text-shadow: 0.010em 0.010em 0 var(--ts-depth), 0.020em 0.020em 0 var(--ts-depth), 0.030em 0.030em 0 var(--ts-depth), 0.040em 0.040em 0 var(--ts-depth), 0.050em 0.050em 0 var(--ts-depth), 0.100em .12em .18em rgba(90, 44, 20, .22); }
  to { text-shadow: -0.010em 0.010em 0 var(--ts-depth), -0.020em 0.020em 0 var(--ts-depth), -0.030em 0.030em 0 var(--ts-depth), -0.040em 0.040em 0 var(--ts-depth), -0.050em 0.050em 0 var(--ts-depth), -0.100em .12em .18em rgba(90, 44, 20, .22); }
}
`;

export default function ShadowFollowingMovingLight() {
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
    <section ref={rootRef} data-paused="false" className="ts-root w-full">
      <style>{CSS}</style>
      <div className="ts-light" aria-hidden="true" />
      <div className="ts-inner">
        <p className="ts-eyebrow">{BUSINESS}</p>
        <h2 className="ts-h">Glazed in the yard, fired at dusk.</h2>
        <p className="ts-copy">{COPY}</p>
      </div>
    </section>
  );
}

import { useEffect, useRef } from "react";

const BUSINESS = "Corner Locksmiths of Ashby";
const COPY = "Walk-in key cutting, lock changes and lockouts across the north side. Open eight until six, and until two on Saturdays.";

const CSS = `
/* Edit these first: colours, and how long one full cycle takes. */
.mh-root {
  --mh-bg: #ffffff;
  --mh-ink: #18212d;
  --mh-muted: #4a5565;
  --mh-accent: #ffd95a;
  --mh-speed: 7s;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 72px 20px;
  background: var(--mh-bg);
  color: var(--mh-ink);
  font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.mh-root *, .mh-root *::before, .mh-root *::after { box-sizing: border-box; }
.mh-inner { position: relative; z-index: 1; width: 100%; max-width: 1040px; }
.mh-eyebrow { margin: 0 0 22px; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--mh-muted); }
.mh-h { margin: 0; font-size: clamp(36px, 6.2vw, 80px); font-weight: 700; line-height: 1.12; letter-spacing: -.03em; }
.mh-copy { margin: 28px 0 0; max-width: 34em; font-family: "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: clamp(16px, 1.5vw, 19px); line-height: 1.6; color: var(--mh-muted); }
.mh-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.mh-w { display: inline-block; white-space: nowrap; }
.mh-l { display: inline-block; }
/* Paused while scrolled out of view (the script sets data-paused). */
.mh-root[data-paused="true"] *, .mh-root[data-paused="true"] *::before, .mh-root[data-paused="true"] *::after { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .mh-root *, .mh-root *::before, .mh-root *::after { animation: none !important; }
}

.mh-h { max-width: 15em; }
.mh-mark {
  padding: 0 .06em;
  margin: 0 -.06em;
  background-image: linear-gradient(100deg, rgba(255, 217, 90, .75), var(--mh-accent) 6%, var(--mh-accent) 94%, rgba(255, 217, 90, .75));
  background-repeat: no-repeat;
  background-size: 100% 62%;
  background-position: 0 85%;
  animation: mh-wipe var(--mh-speed) cubic-bezier(.65, 0, .25, 1) infinite;
}
/* The default box-decoration-break (slice) makes the wipe run line by line when the phrase wraps. */
@keyframes mh-wipe {
  0%, 6% { background-size: 0% 62%; background-position: 0 85%; }
  34% { background-size: 100% 62%; background-position: 0 85%; }
  84% { background-size: 100% 62%; background-position: 100% 85%; }
  97%, 100% { background-size: 0% 62%; background-position: 100% 85%; }
}
`;

export default function MarkerHighlightWipe() {
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
    <section ref={rootRef} data-paused="false" className="mh-root w-full">
      <style>{CSS}</style>
      <div className="mh-inner">
        <p className="mh-eyebrow">{BUSINESS}</p>
        <h2 className="mh-h">
          Same-day key cutting, and <span className="mh-mark">a real person answers the phone.</span>
        </h2>
        <p className="mh-copy">{COPY}</p>
      </div>
    </section>
  );
}

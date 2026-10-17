import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

const TILT = 16; // largest turn of the word, in degrees
const DEPTH = 26; // how far the shadow falls away, in px
const EASE = 0.08; // smoothing: lower is lazier

// Same markup, styles and script as the plain HTML version.
const STYLES = `
/* Change these: background, text, muted text, rule colour, accent (links' focus ring and highlights). */
  .w4tlt { --w4tlt-bg: #e5e6e1; --w4tlt-ink: #22252a; --w4tlt-muted: #4b5159; --w4tlt-line: #cdd0ca; --w4tlt-accent: #8a5730; }
  .w4tlt { position: relative; overflow: hidden; background: var(--w4tlt-bg); color: var(--w4tlt-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 72px clamp(20px, 4vw, 56px) 24px; }
  .w4tlt *, .w4tlt *::before, .w4tlt *::after { box-sizing: border-box; }
  .w4tlt-in { max-width: 1240px; margin: 0 auto; }
  .w4tlt-top { display: grid; grid-template-columns: minmax(0, 1.5fr) repeat(3, minmax(0, 1fr)); gap: 32px 40px; }
  .w4tlt-brand { margin: 0; font-size: 18px; font-weight: 650; letter-spacing: -.01em; }
  .w4tlt-blurb { margin: 12px 0 0; max-width: 32ch; font-size: 15px; line-height: 1.6; color: var(--w4tlt-muted); }
  .w4tlt-addr { margin: 16px 0 0; font-style: normal; font-size: 14px; line-height: 1.65; color: var(--w4tlt-muted); }
  .w4tlt-col h2 { margin: 0 0 6px; font-size: 12px; font-weight: 650; letter-spacing: .14em; text-transform: uppercase; color: var(--w4tlt-muted); }
  .w4tlt-col ul, .w4tlt-legal ul { list-style: none; margin: 0; padding: 0; }
  .w4tlt-col a, .w4tlt-legal a { display: inline-flex; align-items: center; min-height: 40px; color: inherit; text-decoration: none; font-size: 15px; border-radius: 3px; }
  .w4tlt-col a:hover, .w4tlt-legal a:hover { text-decoration: underline; text-underline-offset: 4px; }
  .w4tlt a:focus-visible { outline: 2px solid var(--w4tlt-accent); outline-offset: 3px; }
  .w4tlt-big { container-type: inline-size; margin: 56px 0 0; }
  .w4tlt-legal { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0 24px; margin-top: 24px; padding-top: 6px; border-top: 1px solid var(--w4tlt-line); font-size: 13px; color: var(--w4tlt-muted); }
  .w4tlt-legal p { margin: 10px 0; }
  .w4tlt-legal ul { display: flex; flex-wrap: wrap; gap: 0 20px; }
  .w4tlt-legal a { font-size: 13px; }
  .w4tlt-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (max-width: 760px) {
    .w4tlt { padding-top: 56px; }
    .w4tlt-top { grid-template-columns: 1fr 1fr; gap: 24px 20px; }
    .w4tlt-lead { grid-column: 1 / -1; }
  }
  /* Change these: wordmark size and the warm glow colour behind it. */
  .w4tlt { --w4tlt-size: 30cqi; --w4tlt-glow: rgba(255, 214, 160, .75); }
  .w4tlt-stage { position: relative; display: grid; place-items: center; perspective: 1100px; padding: 2cqi 0 4cqi; }
  .w4tlt-glow { position: absolute; left: 50%; top: 50%; width: 46cqi; height: 46cqi; margin: -23cqi 0 0 -23cqi; border-radius: 50%; pointer-events: none; background: radial-gradient(closest-side, var(--w4tlt-glow), rgba(255, 214, 160, 0)); will-change: transform; }
  .w4tlt-word, .w4tlt-shadow { grid-area: 1 / 1; white-space: nowrap; font: 800 var(--w4tlt-size)/.9 ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif; letter-spacing: -.06em; padding: 0 .04em; will-change: transform; }
  .w4tlt-word { position: relative; color: var(--w4tlt-ink); }
  .w4tlt-shadow { color: rgba(34, 37, 42, .3); filter: blur(12px); transform: translate(0, 20px); }
  .w4tlt-hint { margin: 0; text-align: center; font-size: 14px; color: var(--w4tlt-muted); }
  @media (prefers-reduced-motion: reduce) { .w4tlt-word, .w4tlt-glow { transform: none !important; } .w4tlt-shadow { transform: translate(0, 20px) !important; } }
`;

export default function LightingShopFooterWordmarkTilts() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root: any = ref.current;
    if (!root) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var stage = root.querySelector(".w4tlt-stage");
    var word = root.querySelector(".w4tlt-word"), shadow = root.querySelector(".w4tlt-shadow"), glow = root.querySelector(".w4tlt-glow");
    var tx = 0, ty = 0, x = 0, y = 0, live = false, frame = 0;
    function clamp(v) { return Math.max(-1, Math.min(1, v)); }
    function tick(t) {
      /* idle demo: the lamp wanders in a slow loop until a real mouse arrives */
      if (!live) { tx = Math.sin(t / 2600) * 0.75; ty = Math.sin(t / 1700) * 0.55; }
      x += (tx - x) * EASE; y += (ty - y) * EASE;
      word.style.transform = "rotateY(" + (x * TILT).toFixed(2) + "deg) rotateX(" + (-y * TILT * 0.6).toFixed(2) + "deg)";
      shadow.style.transform = "translate(" + (-x * DEPTH).toFixed(1) + "px," + (20 - y * DEPTH * 0.6).toFixed(1) + "px) rotateY(" + (x * TILT).toFixed(2) + "deg)";
      glow.style.transform = "translate(" + (x * 34).toFixed(1) + "cqi," + (y * 8).toFixed(1) + "cqi)";
      frame = requestAnimationFrame(tick);
    }
    function move(e) {
      if (e.pointerType !== "mouse") return;
      var r = stage.getBoundingClientRect();
      live = true;
      tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1);
      ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1);
    }
    function leave() { live = false; }
    var io = new IntersectionObserver(function (en) {
      cancelAnimationFrame(frame); frame = 0;
      if (en[0].isIntersecting) frame = requestAnimationFrame(tick);
    });
    io.observe(root);
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    return function () {
      cancelAnimationFrame(frame); io.disconnect();
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <footer className="w4tlt" ref={ref}>
      <style>{STYLES}</style>
      <div className="w4tlt-in">
        <div className="w4tlt-top">
          <div className="w4tlt-lead">
            <p className="w4tlt-brand">Lumen Hall</p>
            <p className="w4tlt-blurb">
              Restored pendant lamps, rewired desk lights and made-to-order shades in linen and card.
            </p>
            <address className="w4tlt-addr">
              Arch 7, Bermondsey Viaduct, London SE1
              <br />
              Showroom open Tuesday to Saturday
              <br />
              020 7946 0731
            </address>
          </div>
          <div className="w4tlt-col">
            <h2>Lights</h2>
            <ul>
              <li>
                <a href="#">Pendants</a>
              </li>
              <li>
                <a href="#">Desk lamps</a>
              </li>
              <li>
                <a href="#">Wall lights</a>
              </li>
              <li>
                <a href="#">Shades</a>
              </li>
            </ul>
          </div>
          <div className="w4tlt-col">
            <h2>Services</h2>
            <ul>
              <li>
                <a href="#">Rewiring</a>
              </li>
              <li>
                <a href="#">Bulb advice</a>
              </li>
              <li>
                <a href="#">Trade accounts</a>
              </li>
            </ul>
          </div>
          <div className="w4tlt-col">
            <h2>Showroom</h2>
            <ul>
              <li>
                <a href="#">Visit</a>
              </li>
              <li>
                <a href="#">Events</a>
              </li>
              <li>
                <a href="#">Contact</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="w4tlt-big">
          <div className="w4tlt-stage" aria-hidden="true">
            <span className="w4tlt-glow" />
            <span className="w4tlt-shadow">lumen</span>
            <span className="w4tlt-word">lumen</span>
          </div>
          <p className="w4tlt-hint">
            Every lamp is tested on the bench before it leaves the arch.
          </p>
        </div>
        <div className="w4tlt-legal">
          <p>
            © 2026 Lumen Hall Lighting Ltd. Lamps restored in south London.
          </p>
          <ul>
            <li>
              <a href="#">Privacy</a>
            </li>
            <li>
              <a href="#">Delivery</a>
            </li>
            <li>
              <a href="#">Returns</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

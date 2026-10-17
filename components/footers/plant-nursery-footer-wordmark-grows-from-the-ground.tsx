import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

const THRESHOLD = 0.2; // share of the wordmark that must be visible before it grows

// Same markup, styles and script as the plain HTML version.
const STYLES = `
/* Change these: background, text, muted text, rule colour, accent (links' focus ring and highlights). */
  .w4grw { --w4grw-bg: #1b2a20; --w4grw-ink: #e3e9da; --w4grw-muted: #a9b8a1; --w4grw-line: #2f4234; --w4grw-accent: #b6d08f; }
  .w4grw { position: relative; overflow: hidden; background: var(--w4grw-bg); color: var(--w4grw-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 72px clamp(20px, 4vw, 56px) 24px; }
  .w4grw *, .w4grw *::before, .w4grw *::after { box-sizing: border-box; }
  .w4grw-in { max-width: 1240px; margin: 0 auto; }
  .w4grw-top { display: grid; grid-template-columns: minmax(0, 1.5fr) repeat(3, minmax(0, 1fr)); gap: 32px 40px; }
  .w4grw-brand { margin: 0; font-size: 18px; font-weight: 650; letter-spacing: -.01em; }
  .w4grw-blurb { margin: 12px 0 0; max-width: 32ch; font-size: 15px; line-height: 1.6; color: var(--w4grw-muted); }
  .w4grw-addr { margin: 16px 0 0; font-style: normal; font-size: 14px; line-height: 1.65; color: var(--w4grw-muted); }
  .w4grw-col h2 { margin: 0 0 6px; font-size: 12px; font-weight: 650; letter-spacing: .14em; text-transform: uppercase; color: var(--w4grw-muted); }
  .w4grw-col ul, .w4grw-legal ul { list-style: none; margin: 0; padding: 0; }
  .w4grw-col a, .w4grw-legal a { display: inline-flex; align-items: center; min-height: 40px; color: inherit; text-decoration: none; font-size: 15px; border-radius: 3px; }
  .w4grw-col a:hover, .w4grw-legal a:hover { text-decoration: underline; text-underline-offset: 4px; }
  .w4grw a:focus-visible { outline: 2px solid var(--w4grw-accent); outline-offset: 3px; }
  .w4grw-big { container-type: inline-size; margin: 56px 0 0; }
  .w4grw-legal { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0 24px; margin-top: 24px; padding-top: 6px; border-top: 1px solid var(--w4grw-line); font-size: 13px; color: var(--w4grw-muted); }
  .w4grw-legal p { margin: 10px 0; }
  .w4grw-legal ul { display: flex; flex-wrap: wrap; gap: 0 20px; }
  .w4grw-legal a { font-size: 13px; }
  .w4grw-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (max-width: 760px) {
    .w4grw { padding-top: 56px; }
    .w4grw-top { grid-template-columns: 1fr 1fr; gap: 24px 20px; }
    .w4grw-lead { grid-column: 1 / -1; }
  }
  /* Change these: wordmark size, growth speed, delay between letters. */
  .w4grw { --w4grw-size: 22.5cqi; --w4grw-speed: .95s; --w4grw-step: 75ms; }
  .w4grw-word { margin: 0; white-space: nowrap; overflow: hidden; text-align: center; font-family: ui-rounded, "SF Pro Rounded", "Nunito", "Arial Rounded MT Bold", system-ui, sans-serif; font-weight: 800; font-size: var(--w4grw-size); line-height: .9; letter-spacing: -.045em; color: var(--w4grw-ink); padding: .04em 0 .2em; margin-bottom: 0; }
  .w4grw-l { display: inline-block; transform-origin: 50% 100%; transition: transform var(--w4grw-speed) cubic-bezier(.34, 1.45, .6, 1) calc(var(--i) * var(--w4grw-step)), opacity .4s ease calc(var(--i) * var(--w4grw-step)); }
  .w4grw-l:nth-child(3n + 2) { color: var(--w4grw-accent); }
  .w4grw-ground { height: 2px; margin: 0; background: var(--w4grw-accent); transform-origin: 0 50%; transition: transform 1.1s cubic-bezier(.2, .8, .2, 1); }
  .w4grw[data-arm]:not([data-in]) .w4grw-l { transform: scaleY(.06); opacity: .25; }
  .w4grw[data-arm]:not([data-in]) .w4grw-ground { transform: scaleX(0); }
  .w4grw-tag { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px 16px; margin: 12px 0 0; font-size: 14px; color: var(--w4grw-muted); }
  @media (prefers-reduced-motion: reduce) { .w4grw-l, .w4grw-ground { transition: none; transform: none !important; opacity: 1 !important; } }
`;

export default function PlantNurseryFooterWordmarkGrows() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root: any = ref.current;
    if (!root) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var target = root.querySelector(".w4grw-word");
    root.setAttribute("data-arm", "");
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) root.setAttribute("data-in", "");
      else root.removeAttribute("data-in");
    }, { threshold: THRESHOLD });
    io.observe(target);
    return function () { io.disconnect(); };
  }, []);

  return (
    <footer className="w4grw" ref={ref}>
      <style>{STYLES}</style>
      <div className="w4grw-in">
        <div className="w4grw-top">
          <div className="w4grw-lead">
            <p className="w4grw-brand">Mossery Plant Nursery</p>
            <p className="w4grw-blurb">
              Ferns, shade perennials and potted mosses raised under glass on the edge of Holloway Woods.
            </p>
            <address className="w4grw-addr">
              Glasshouse 2, Holloway Woods Road
              <br />
              Open Thursday to Sunday, 9am to 5pm
              <br />
              0117 320 4471
            </address>
          </div>
          <div className="w4grw-col">
            <h2>Plants</h2>
            <ul>
              <li>
                <a href="#">Ferns</a>
              </li>
              <li>
                <a href="#">Shade perennials</a>
              </li>
              <li>
                <a href="#">Moss pots</a>
              </li>
              <li>
                <a href="#">Gift cards</a>
              </li>
            </ul>
          </div>
          <div className="w4grw-col">
            <h2>Grow</h2>
            <ul>
              <li>
                <a href="#">Care guides</a>
              </li>
              <li>
                <a href="#">Repotting days</a>
              </li>
              <li>
                <a href="#">Plant doctor</a>
              </li>
            </ul>
          </div>
          <div className="w4grw-col">
            <h2>Nursery</h2>
            <ul>
              <li>
                <a href="#">Visit us</a>
              </li>
              <li>
                <a href="#">Wholesale</a>
              </li>
              <li>
                <a href="#">Volunteer</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="w4grw-big">
          <p className="w4grw-word" aria-hidden="true">
            {"mossery".split("").map((c, i) => (
              <span key={i} className="w4grw-l" style={{ "--i": i } as CSSProperties}>{c === " " ? "\u00a0" : c}</span>
            ))}
          </p>
          <p className="w4grw-ground" aria-hidden="true" />
          <p className="w4grw-tag">
            <span>Peat-free compost, always</span>
            <span>Sunday seed swap at ten</span>
          </p>
        </div>
        <div className="w4grw-legal">
          <p>© 2026 Mossery Plant Nursery. Grown in the Avon valley.</p>
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

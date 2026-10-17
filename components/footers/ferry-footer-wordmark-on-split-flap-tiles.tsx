import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

const THRESHOLD = 0.2; // share of the board that must be visible before the tiles flip

// Same markup, styles and script as the plain HTML version.
const STYLES = `
/* Change these: background, text, muted text, rule colour, accent (links' focus ring and highlights). */
  .w4flp { --w4flp-bg: #0e1b30; --w4flp-ink: #e8eef5; --w4flp-muted: #a3b3c8; --w4flp-line: #22344f; --w4flp-accent: #dcb66e; }
  .w4flp { position: relative; overflow: hidden; background: var(--w4flp-bg); color: var(--w4flp-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 72px clamp(20px, 4vw, 56px) 24px; }
  .w4flp *, .w4flp *::before, .w4flp *::after { box-sizing: border-box; }
  .w4flp-in { max-width: 1240px; margin: 0 auto; }
  .w4flp-top { display: grid; grid-template-columns: minmax(0, 1.5fr) repeat(3, minmax(0, 1fr)); gap: 32px 40px; }
  .w4flp-brand { margin: 0; font-size: 18px; font-weight: 650; letter-spacing: -.01em; }
  .w4flp-blurb { margin: 12px 0 0; max-width: 32ch; font-size: 15px; line-height: 1.6; color: var(--w4flp-muted); }
  .w4flp-addr { margin: 16px 0 0; font-style: normal; font-size: 14px; line-height: 1.65; color: var(--w4flp-muted); }
  .w4flp-col h2 { margin: 0 0 6px; font-size: 12px; font-weight: 650; letter-spacing: .14em; text-transform: uppercase; color: var(--w4flp-muted); }
  .w4flp-col ul, .w4flp-legal ul { list-style: none; margin: 0; padding: 0; }
  .w4flp-col a, .w4flp-legal a { display: inline-flex; align-items: center; min-height: 40px; color: inherit; text-decoration: none; font-size: 15px; border-radius: 3px; }
  .w4flp-col a:hover, .w4flp-legal a:hover { text-decoration: underline; text-underline-offset: 4px; }
  .w4flp a:focus-visible { outline: 2px solid var(--w4flp-accent); outline-offset: 3px; }
  .w4flp-big { container-type: inline-size; margin: 56px 0 0; }
  .w4flp-legal { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0 24px; margin-top: 24px; padding-top: 6px; border-top: 1px solid var(--w4flp-line); font-size: 13px; color: var(--w4flp-muted); }
  .w4flp-legal p { margin: 10px 0; }
  .w4flp-legal ul { display: flex; flex-wrap: wrap; gap: 0 20px; }
  .w4flp-legal a { font-size: 13px; }
  .w4flp-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (max-width: 760px) {
    .w4flp { padding-top: 56px; }
    .w4flp-top { grid-template-columns: 1fr 1fr; gap: 24px 20px; }
    .w4flp-lead { grid-column: 1 / -1; }
  }
  /* Change these: tile colour, letter colour, delay between tiles. Use as many tiles as letters (set the column count). */
  .w4flp { --w4flp-tile: #182c4b; --w4flp-letter: #f3e7cb; --w4flp-step: 85ms; }
  .w4flp-dep { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 16px; margin: 0 0 14px; font: 500 13px/1.5 ui-monospace, "SF Mono", Menlo, Consolas, monospace; letter-spacing: .08em; text-transform: uppercase; color: var(--w4flp-muted); }
  .w4flp-dep b { color: var(--w4flp-accent); font-weight: 600; }
  .w4flp-board { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 1.1cqi; perspective: 900px; }
  .w4flp-t { position: relative; display: grid; place-items: center; aspect-ratio: 4 / 5; border-radius: .9cqi; background: linear-gradient(180deg, #1d3458 0 49.6%, var(--w4flp-tile) 50.4% 100%); box-shadow: inset 0 1px 0 rgba(255, 255, 255, .06), 0 10px 24px rgba(3, 9, 20, .35); color: var(--w4flp-letter); font: 800 9.6cqi/1 ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif; transform-origin: 50% 50%; transition: transform .8s cubic-bezier(.3, 1.4, .55, 1) calc(var(--i) * var(--w4flp-step)), opacity .3s ease calc(var(--i) * var(--w4flp-step)); }
  .w4flp-t::after { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 2px; margin-top: -1px; background: rgba(4, 10, 22, .55); }
  .w4flp[data-arm]:not([data-in]) .w4flp-t { transform: rotateX(-96deg); opacity: 0; }
  @media (prefers-reduced-motion: reduce) { .w4flp-t { transition: none; transform: none !important; opacity: 1 !important; } }
`;

export default function FerryFooterWordmarkOnSplitFlapTiles() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root: any = ref.current;
    if (!root) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var target = root.querySelector(".w4flp-board");
    root.setAttribute("data-arm", "");
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) root.setAttribute("data-in", "");
      else root.removeAttribute("data-in");
    }, { threshold: THRESHOLD });
    io.observe(target);
    return function () { io.disconnect(); };
  }, []);

  return (
    <footer className="w4flp" ref={ref}>
      <style>{STYLES}</style>
      <div className="w4flp-in">
        <div className="w4flp-top">
          <div className="w4flp-lead">
            <p className="w4flp-brand">Tidewell Ferries</p>
            <p className="w4flp-blurb">
              Foot passengers, bikes and the occasional sheepdog across the sound, eleven crossings a day.
            </p>
            <address className="w4flp-addr">
              Quay Office, Harbour Street, Portmallow
              <br />
              Ticket desk opens 30 minutes before each sailing
              <br />
              01646 702 118
            </address>
          </div>
          <div className="w4flp-col">
            <h2>Travel</h2>
            <ul>
              <li>
                <a href="#">Timetable</a>
              </li>
              <li>
                <a href="#">Fares</a>
              </li>
              <li>
                <a href="#">Bikes and dogs</a>
              </li>
              <li>
                <a href="#">Group bookings</a>
              </li>
            </ul>
          </div>
          <div className="w4flp-col">
            <h2>Help</h2>
            <ul>
              <li>
                <a href="#">Weather delays</a>
              </li>
              <li>
                <a href="#">Lost property</a>
              </li>
              <li>
                <a href="#">Step-free access</a>
              </li>
            </ul>
          </div>
          <div className="w4flp-col">
            <h2>Company</h2>
            <ul>
              <li>
                <a href="#">Our boats</a>
              </li>
              <li>
                <a href="#">Crew jobs</a>
              </li>
              <li>
                <a href="#">Contact</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="w4flp-big">
          <p className="w4flp-dep">
            <span>
              {"Next sailing "}
              <b>Harrow Point 17:40</b>
            </span>
            <span>Berth 2 · on time</span>
          </p>
          <div className="w4flp-board" aria-hidden="true">
            {"TIDEWELL".split("").map((c, i) => (
              <span key={i} className="w4flp-t" style={{ "--i": i } as CSSProperties}>{c === " " ? "\u00a0" : c}</span>
            ))}
          </div>
        </div>
        <div className="w4flp-legal">
          <p>© 2026 Tidewell Ferries Ltd. Sailings subject to weather.</p>
          <ul>
            <li>
              <a href="#">Conditions of carriage</a>
            </li>
            <li>
              <a href="#">Privacy</a>
            </li>
            <li>
              <a href="#">Cookies</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

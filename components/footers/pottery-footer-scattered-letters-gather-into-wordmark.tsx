import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

const THRESHOLD = 0.2; // share of the wordmark that must be visible before the letters gather

// Same markup, styles and script as the plain HTML version.
const STYLES = `
/* Change these: background, text, muted text, rule colour, accent (links' focus ring and highlights). */
  .w4spr { --w4spr-bg: #e9ddcb; --w4spr-ink: #3a2c21; --w4spr-muted: #5d4c3d; --w4spr-line: #cdbca5; --w4spr-accent: #8a4826; }
  .w4spr { position: relative; overflow: hidden; background: var(--w4spr-bg); color: var(--w4spr-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 72px clamp(20px, 4vw, 56px) 24px; }
  .w4spr *, .w4spr *::before, .w4spr *::after { box-sizing: border-box; }
  .w4spr-in { max-width: 1240px; margin: 0 auto; }
  .w4spr-top { display: grid; grid-template-columns: minmax(0, 1.5fr) repeat(3, minmax(0, 1fr)); gap: 32px 40px; }
  .w4spr-brand { margin: 0; font-size: 18px; font-weight: 650; letter-spacing: -.01em; }
  .w4spr-blurb { margin: 12px 0 0; max-width: 32ch; font-size: 15px; line-height: 1.6; color: var(--w4spr-muted); }
  .w4spr-addr { margin: 16px 0 0; font-style: normal; font-size: 14px; line-height: 1.65; color: var(--w4spr-muted); }
  .w4spr-col h2 { margin: 0 0 6px; font-size: 12px; font-weight: 650; letter-spacing: .14em; text-transform: uppercase; color: var(--w4spr-muted); }
  .w4spr-col ul, .w4spr-legal ul { list-style: none; margin: 0; padding: 0; }
  .w4spr-col a, .w4spr-legal a { display: inline-flex; align-items: center; min-height: 40px; color: inherit; text-decoration: none; font-size: 15px; border-radius: 3px; }
  .w4spr-col a:hover, .w4spr-legal a:hover { text-decoration: underline; text-underline-offset: 4px; }
  .w4spr a:focus-visible { outline: 2px solid var(--w4spr-accent); outline-offset: 3px; }
  .w4spr-big { container-type: inline-size; margin: 56px 0 0; }
  .w4spr-legal { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0 24px; margin-top: 24px; padding-top: 6px; border-top: 1px solid var(--w4spr-line); font-size: 13px; color: var(--w4spr-muted); }
  .w4spr-legal p { margin: 10px 0; }
  .w4spr-legal ul { display: flex; flex-wrap: wrap; gap: 0 20px; }
  .w4spr-legal a { font-size: 13px; }
  .w4spr-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (max-width: 760px) {
    .w4spr { padding-top: 56px; }
    .w4spr-top { grid-template-columns: 1fr 1fr; gap: 24px 20px; }
    .w4spr-lead { grid-column: 1 / -1; }
  }
  /* Change these: wordmark size, how far apart the letters start (em per letter from the centre), gathering speed. */
  .w4spr { --w4spr-size: 15.6cqi; --w4spr-spread: .34em; --w4spr-speed: 1.3s; }
  .w4spr-rule { display: flex; justify-content: space-between; gap: 16px; margin: 0 0 10px; padding-top: 14px; border-top: 1px solid var(--w4spr-line); font-size: 13px; letter-spacing: .16em; text-transform: uppercase; color: var(--w4spr-muted); }
  .w4spr-word { margin: 0; overflow: hidden; white-space: nowrap; text-align: center; font-family: "Bodoni 72", Didot, "Bodoni MT", "Hoefler Text", Georgia, serif; font-weight: 400; font-size: var(--w4spr-size); line-height: 1; letter-spacing: .015em; }
  .w4spr-l { display: inline-block; transition: transform var(--w4spr-speed) cubic-bezier(.2, .75, .15, 1), opacity 1s ease; }
  .w4spr-l:nth-child(4) { color: var(--w4spr-accent); }
  .w4spr[data-arm]:not([data-in]) .w4spr-l { transform: translateX(calc((var(--i) - 3.5) * var(--w4spr-spread))); opacity: 0; }
  @media (prefers-reduced-motion: reduce) { .w4spr-l { transition: none; transform: none !important; opacity: 1 !important; } }
`;

export default function PotteryFooterScatteredLettersGather() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root: any = ref.current;
    if (!root) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var target = root.querySelector(".w4spr-word");
    root.setAttribute("data-arm", "");
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) root.setAttribute("data-in", "");
      else root.removeAttribute("data-in");
    }, { threshold: THRESHOLD });
    io.observe(target);
    return function () { io.disconnect(); };
  }, []);

  return (
    <footer className="w4spr" ref={ref}>
      <style>{STYLES}</style>
      <div className="w4spr-in">
        <div className="w4spr-top">
          <div className="w4spr-lead">
            <p className="w4spr-brand">Kiln Row Pottery</p>
            <p className="w4spr-blurb">
              Thrown stoneware for everyday tables, glazed in ash and iron, fired in our gas kiln each Friday.
            </p>
            <address className="w4spr-addr">
              5 Kiln Row, St Ives TR26 1PB
              <br />
              Shop open Wednesday to Saturday
              <br />
              01736 811 902
            </address>
          </div>
          <div className="w4spr-col">
            <h2>Shop</h2>
            <ul>
              <li>
                <a href="#">Mugs and cups</a>
              </li>
              <li>
                <a href="#">Plates</a>
              </li>
              <li>
                <a href="#">Serving bowls</a>
              </li>
              <li>
                <a href="#">Seconds shelf</a>
              </li>
            </ul>
          </div>
          <div className="w4spr-col">
            <h2>Learn</h2>
            <ul>
              <li>
                <a href="#">Taster sessions</a>
              </li>
              <li>
                <a href="#">Six-week course</a>
              </li>
              <li>
                <a href="#">Studio membership</a>
              </li>
            </ul>
          </div>
          <div className="w4spr-col">
            <h2>Studio</h2>
            <ul>
              <li>
                <a href="#">Our clay</a>
              </li>
              <li>
                <a href="#">Commissions</a>
              </li>
              <li>
                <a href="#">Stockists</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="w4spr-big">
          <p className="w4spr-rule">
            <span>Est. on Kiln Row</span>
            <span>Next firing Friday</span>
          </p>
          <p className="w4spr-word" aria-hidden="true">
            {"KILN ROW".split("").map((c, i) => (
              <span key={i} className="w4spr-l" style={{ "--i": i } as CSSProperties}>{c === " " ? "\u00a0" : c}</span>
            ))}
          </p>
        </div>
        <div className="w4spr-legal">
          <p>
            © 2026 Kiln Row Pottery. Each piece is made by hand and varies a little.
          </p>
          <ul>
            <li>
              <a href="#">Privacy</a>
            </li>
            <li>
              <a href="#">Shipping</a>
            </li>
            <li>
              <a href="#">Care of glazes</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

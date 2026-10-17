import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

const THRESHOLD = 0.15; // share of the wordmark that must be visible before the letters rise

// Same markup, styles and script as the plain HTML version.
const STYLES = `
/* Change these: background, text, muted text, rule colour, accent (links' focus ring and highlights). */
  .w4ris { --w4ris-bg: #f3ece0; --w4ris-ink: #2b2119; --w4ris-muted: #5f5246; --w4ris-line: #d9cdbb; --w4ris-accent: #a5421d; }
  .w4ris { position: relative; overflow: hidden; background: var(--w4ris-bg); color: var(--w4ris-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 72px clamp(20px, 4vw, 56px) 24px; }
  .w4ris *, .w4ris *::before, .w4ris *::after { box-sizing: border-box; }
  .w4ris-in { max-width: 1240px; margin: 0 auto; }
  .w4ris-top { display: grid; grid-template-columns: minmax(0, 1.5fr) repeat(3, minmax(0, 1fr)); gap: 32px 40px; }
  .w4ris-brand { margin: 0; font-size: 18px; font-weight: 650; letter-spacing: -.01em; }
  .w4ris-blurb { margin: 12px 0 0; max-width: 32ch; font-size: 15px; line-height: 1.6; color: var(--w4ris-muted); }
  .w4ris-addr { margin: 16px 0 0; font-style: normal; font-size: 14px; line-height: 1.65; color: var(--w4ris-muted); }
  .w4ris-col h2 { margin: 0 0 6px; font-size: 12px; font-weight: 650; letter-spacing: .14em; text-transform: uppercase; color: var(--w4ris-muted); }
  .w4ris-col ul, .w4ris-legal ul { list-style: none; margin: 0; padding: 0; }
  .w4ris-col a, .w4ris-legal a { display: inline-flex; align-items: center; min-height: 40px; color: inherit; text-decoration: none; font-size: 15px; border-radius: 3px; }
  .w4ris-col a:hover, .w4ris-legal a:hover { text-decoration: underline; text-underline-offset: 4px; }
  .w4ris a:focus-visible { outline: 2px solid var(--w4ris-accent); outline-offset: 3px; }
  .w4ris-big { container-type: inline-size; margin: 56px 0 0; }
  .w4ris-legal { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0 24px; margin-top: 24px; padding-top: 6px; border-top: 1px solid var(--w4ris-line); font-size: 13px; color: var(--w4ris-muted); }
  .w4ris-legal p { margin: 10px 0; }
  .w4ris-legal ul { display: flex; flex-wrap: wrap; gap: 0 20px; }
  .w4ris-legal a { font-size: 13px; }
  .w4ris-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (max-width: 760px) {
    .w4ris { padding-top: 56px; }
    .w4ris-top { grid-template-columns: 1fr 1fr; gap: 24px 20px; }
    .w4ris-lead { grid-column: 1 / -1; }
  }
  /* Change these: wordmark size (cqi of the footer width), rise speed, delay between letters. */
  .w4ris { --w4ris-size: 21.5cqi; --w4ris-speed: 1s; --w4ris-step: 70ms; }
  .w4ris-word { margin: 0; overflow: hidden; white-space: nowrap; font-family: Georgia, "Times New Roman", serif; font-weight: 700; font-size: var(--w4ris-size); line-height: 1.02; letter-spacing: -.05em; text-align: center; padding-bottom: .02em; }
  .w4ris-l { display: inline-block; transition: transform var(--w4ris-speed) cubic-bezier(.16, .84, .24, 1) calc(var(--i) * var(--w4ris-step)), opacity .6s ease calc(var(--i) * var(--w4ris-step)); }
  .w4ris-dot { color: var(--w4ris-accent); }
  .w4ris[data-arm]:not([data-in]) .w4ris-l { transform: translateY(104%) rotate(7deg); opacity: 0; }
  .w4ris-note { display: flex; justify-content: space-between; gap: 16px; margin: 6px 0 0; font-size: 14px; color: var(--w4ris-muted); }
  .w4ris-note span:last-child { text-align: right; }
  @media (prefers-reduced-motion: reduce) { .w4ris-l { transition: none; transform: none !important; opacity: 1 !important; } }
`;

export default function BakeryFooterSerifWordmarkLettersRise() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root: any = ref.current;
    if (!root) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var target = root.querySelector(".w4ris-word");
    root.setAttribute("data-arm", "");
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) root.setAttribute("data-in", "");
      else root.removeAttribute("data-in");
    }, { threshold: THRESHOLD });
    io.observe(target);
    return function () { io.disconnect(); };
  }, []);

  return (
    <footer className="w4ris" ref={ref}>
      <style>{STYLES}</style>
      <div className="w4ris-in">
        <div className="w4ris-top">
          <div className="w4ris-lead">
            <p className="w4ris-brand">Ovenbird Bakery</p>
            <p className="w4ris-blurb">
              Rye, spelt and long-proved white loaves from a wood-fired oven at the end of Tanner Lane.
            </p>
            <address className="w4ris-addr">
              14 Tanner Lane, Hebden Row
              <br />
              Tuesday to Sunday, 7am until sold out
              <br />
              01422 840 317
            </address>
          </div>
          <div className="w4ris-col">
            <h2>Bread</h2>
            <ul>
              <li>
                <a href="#">Daily loaves</a>
              </li>
              <li>
                <a href="#">Pastries</a>
              </li>
              <li>
                <a href="#">Weekend specials</a>
              </li>
              <li>
                <a href="#">Wholesale</a>
              </li>
            </ul>
          </div>
          <div className="w4ris-col">
            <h2>Visit</h2>
            <ul>
              <li>
                <a href="#">Find the shop</a>
              </li>
              <li>
                <a href="#">Opening hours</a>
              </li>
              <li>
                <a href="#">Pre-order</a>
              </li>
            </ul>
          </div>
          <div className="w4ris-col">
            <h2>Bakery</h2>
            <ul>
              <li>
                <a href="#">Our flour</a>
              </li>
              <li>
                <a href="#">Baking classes</a>
              </li>
              <li>
                <a href="#">Jobs</a>
              </li>
              <li>
                <a href="#">Contact</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="w4ris-big">
          <p className="w4ris-word" aria-hidden="true">
            {"ovenbird".split("").map((c, i) => (
              <span key={i} className="w4ris-l" style={{ "--i": i } as CSSProperties}>{c === " " ? "\u00a0" : c}</span>
            ))}
            <span className="w4ris-l w4ris-dot" style={{ "--i": "8" } as CSSProperties}>.</span>
          </p>
          <p className="w4ris-note">
            <span>First bake out at seven</span>
            <span>Crumbs on the counter are free</span>
          </p>
        </div>
        <div className="w4ris-legal">
          <p>© 2026 Ovenbird Bakery Ltd. Registered in England.</p>
          <ul>
            <li>
              <a href="#">Privacy</a>
            </li>
            <li>
              <a href="#">Allergens</a>
            </li>
            <li>
              <a href="#">Terms of sale</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

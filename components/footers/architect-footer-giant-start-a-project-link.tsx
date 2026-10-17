import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

const THRESHOLD = 0.3; // share of the link that must be visible before its words rise

// Same markup, styles and script as the plain HTML version.
const STYLES = `
/* Change these: background, text, muted text, rule colour, accent (links' focus ring and highlights). */
  .w4ask { --w4ask-bg: #fafaf8; --w4ask-ink: #1e2832; --w4ask-muted: #4f5d6a; --w4ask-line: #dde1e4; --w4ask-accent: #2d6984; }
  .w4ask { position: relative; overflow: hidden; background: var(--w4ask-bg); color: var(--w4ask-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 72px clamp(20px, 4vw, 56px) 24px; }
  .w4ask *, .w4ask *::before, .w4ask *::after { box-sizing: border-box; }
  .w4ask-in { max-width: 1240px; margin: 0 auto; }
  .w4ask-top { display: grid; grid-template-columns: minmax(0, 1.5fr) repeat(3, minmax(0, 1fr)); gap: 32px 40px; }
  .w4ask-brand { margin: 0; font-size: 18px; font-weight: 650; letter-spacing: -.01em; }
  .w4ask-blurb { margin: 12px 0 0; max-width: 32ch; font-size: 15px; line-height: 1.6; color: var(--w4ask-muted); }
  .w4ask-addr { margin: 16px 0 0; font-style: normal; font-size: 14px; line-height: 1.65; color: var(--w4ask-muted); }
  .w4ask-col h2 { margin: 0 0 6px; font-size: 12px; font-weight: 650; letter-spacing: .14em; text-transform: uppercase; color: var(--w4ask-muted); }
  .w4ask-col ul, .w4ask-legal ul { list-style: none; margin: 0; padding: 0; }
  .w4ask-col a, .w4ask-legal a { display: inline-flex; align-items: center; min-height: 40px; color: inherit; text-decoration: none; font-size: 15px; border-radius: 3px; }
  .w4ask-col a:hover, .w4ask-legal a:hover { text-decoration: underline; text-underline-offset: 4px; }
  .w4ask a:focus-visible { outline: 2px solid var(--w4ask-accent); outline-offset: 3px; }
  .w4ask-big { container-type: inline-size; margin: 56px 0 0; }
  .w4ask-legal { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0 24px; margin-top: 24px; padding-top: 6px; border-top: 1px solid var(--w4ask-line); font-size: 13px; color: var(--w4ask-muted); }
  .w4ask-legal p { margin: 10px 0; }
  .w4ask-legal ul { display: flex; flex-wrap: wrap; gap: 0 20px; }
  .w4ask-legal a { font-size: 13px; }
  .w4ask-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (max-width: 760px) {
    .w4ask { padding-top: 56px; }
    .w4ask-top { grid-template-columns: 1fr 1fr; gap: 24px 20px; }
    .w4ask-lead { grid-column: 1 / -1; }
  }
  /* Change these: link size, the accent used for the underline and arrow, delay between words. */
  .w4ask { --w4ask-size: 14.2cqi; --w4ask-step: 90ms; }
  .w4ask-big { margin: 0 0 56px; }
  .w4ask-kicker { margin: 0 0 16px; font-size: 14px; color: var(--w4ask-muted); }
  .w4ask a.w4ask-cta { position: relative; display: inline-flex; align-items: baseline; max-width: 100%; color: var(--w4ask-ink); text-decoration: none; white-space: nowrap; font-weight: 640; font-size: var(--w4ask-size); line-height: 1.08; letter-spacing: -.045em; border-radius: 6px; }
  .w4ask a.w4ask-cta:focus-visible { outline-offset: 8px; }
  .w4ask-m { display: inline-block; overflow: hidden; padding-bottom: .08em; margin-right: .22em; }
  .w4ask-last { margin-right: 0; }
  .w4ask-w { display: inline-block; transition: transform .9s cubic-bezier(.16, .84, .24, 1) calc(var(--i) * var(--w4ask-step)); }
  .w4ask-arr { display: inline-block; width: .7em; height: .7em; color: var(--w4ask-accent); opacity: .35; transform: translateX(-.18em); transition: transform .45s cubic-bezier(.2, .8, .2, 1), opacity .3s ease; }
  .w4ask-bar { position: absolute; left: 0; right: 0; bottom: .02em; height: max(2px, .035em); background: var(--w4ask-accent); transform: scaleX(.08); transform-origin: 0 50%; transition: transform .6s cubic-bezier(.2, .8, .2, 1); }
  .w4ask-cta:hover .w4ask-arr, .w4ask-cta:focus-visible .w4ask-arr { opacity: 1; transform: translateX(0); }
  .w4ask-cta:hover .w4ask-bar, .w4ask-cta:focus-visible .w4ask-bar { transform: scaleX(1); }
  .w4ask[data-arm]:not([data-in]) .w4ask-w { transform: translateY(110%); }
  @media (hover: none) { .w4ask-arr { opacity: 1; transform: none; } .w4ask-bar { transform: scaleX(1); } }
  @media (prefers-reduced-motion: reduce) { .w4ask-w, .w4ask-arr, .w4ask-bar { transition: none; } .w4ask-w { transform: none !important; } }
`;

export default function ArchitectFooterGiantStartAProjectLink() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root: any = ref.current;
    if (!root) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var target = root.querySelector(".w4ask-cta");
    root.setAttribute("data-arm", "");
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) root.setAttribute("data-in", "");
      else root.removeAttribute("data-in");
    }, { threshold: THRESHOLD });
    io.observe(target);
    return function () { io.disconnect(); };
  }, []);

  return (
    <footer className="w4ask" ref={ref}>
      <style>{STYLES}</style>
      <div className="w4ask-in">
        <div className="w4ask-big">
          <p className="w4ask-kicker">Planning to build, extend or convert?</p>
          <a className="w4ask-cta" href="#">
            <span className="w4ask-m">
              <span className="w4ask-w" style={{ "--i": "0" } as CSSProperties}>Start</span>
            </span>
            <span className="w4ask-m">
              <span className="w4ask-w" style={{ "--i": "1" } as CSSProperties}>a</span>
            </span>
            <span className="w4ask-m">
              <span className="w4ask-w" style={{ "--i": "2" } as CSSProperties}>project</span>
            </span>
            <span className="w4ask-m w4ask-last">
              <span className="w4ask-w" style={{ "--i": "3" } as CSSProperties}>
                <svg className="w4ask-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </span>
            </span>
            <span className="w4ask-bar" aria-hidden="true" />
          </a>
        </div>
        <div className="w4ask-top">
          <div className="w4ask-lead">
            <p className="w4ask-brand">Arklow Studio</p>
            <p className="w4ask-blurb">
              Small-practice architects working on house extensions, timber cabins and careful conversions.
            </p>
            <address className="w4ask-addr">
              2nd floor, 48 Canal Street, Manchester
              <br />
              Monday to Friday, 9am to 6pm
              <br />
              0161 555 0193
            </address>
          </div>
          <div className="w4ask-col">
            <h2>Work</h2>
            <ul>
              <li>
                <a href="#">Houses</a>
              </li>
              <li>
                <a href="#">Conversions</a>
              </li>
              <li>
                <a href="#">Cabins</a>
              </li>
              <li>
                <a href="#">Interiors</a>
              </li>
            </ul>
          </div>
          <div className="w4ask-col">
            <h2>Practice</h2>
            <ul>
              <li>
                <a href="#">Approach</a>
              </li>
              <li>
                <a href="#">People</a>
              </li>
              <li>
                <a href="#">Journal</a>
              </li>
            </ul>
          </div>
          <div className="w4ask-col">
            <h2>Talk</h2>
            <ul>
              <li>
                <a href="#">Book a site visit</a>
              </li>
              <li>
                <a href="#">Fees explained</a>
              </li>
              <li>
                <a href="#">Careers</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="w4ask-legal">
          <p>© 2026 Arklow Studio Ltd. Registered in England.</p>
          <ul>
            <li>
              <a href="#">Privacy</a>
            </li>
            <li>
              <a href="#">Terms</a>
            </li>
            <li>
              <a href="#">Complaints</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

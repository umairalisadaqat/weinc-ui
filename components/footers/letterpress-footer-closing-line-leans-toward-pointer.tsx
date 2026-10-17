import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

const LEAN = 20; // how far each letter tips, in degrees
const SHIFT = 7; // how far each letter slides, in px
const EASE = 0.1; // smoothing: lower is lazier

// Same markup, styles and script as the plain HTML version.
const STYLES = `
/* Change these: background, text, muted text, rule colour, accent (links' focus ring and highlights). */
  .w4len { --w4len-bg: #14161a; --w4len-ink: #ece6dc; --w4len-muted: #aaa398; --w4len-line: #2c2f35; --w4len-accent: #e2b47c; }
  .w4len { position: relative; overflow: hidden; background: var(--w4len-bg); color: var(--w4len-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 72px clamp(20px, 4vw, 56px) 24px; }
  .w4len *, .w4len *::before, .w4len *::after { box-sizing: border-box; }
  .w4len-in { max-width: 1240px; margin: 0 auto; }
  .w4len-top { display: grid; grid-template-columns: minmax(0, 1.5fr) repeat(3, minmax(0, 1fr)); gap: 32px 40px; }
  .w4len-brand { margin: 0; font-size: 18px; font-weight: 650; letter-spacing: -.01em; }
  .w4len-blurb { margin: 12px 0 0; max-width: 32ch; font-size: 15px; line-height: 1.6; color: var(--w4len-muted); }
  .w4len-addr { margin: 16px 0 0; font-style: normal; font-size: 14px; line-height: 1.65; color: var(--w4len-muted); }
  .w4len-col h2 { margin: 0 0 6px; font-size: 12px; font-weight: 650; letter-spacing: .14em; text-transform: uppercase; color: var(--w4len-muted); }
  .w4len-col ul, .w4len-legal ul { list-style: none; margin: 0; padding: 0; }
  .w4len-col a, .w4len-legal a { display: inline-flex; align-items: center; min-height: 40px; color: inherit; text-decoration: none; font-size: 15px; border-radius: 3px; }
  .w4len-col a:hover, .w4len-legal a:hover { text-decoration: underline; text-underline-offset: 4px; }
  .w4len a:focus-visible { outline: 2px solid var(--w4len-accent); outline-offset: 3px; }
  .w4len-big { container-type: inline-size; margin: 56px 0 0; }
  .w4len-legal { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0 24px; margin-top: 24px; padding-top: 6px; border-top: 1px solid var(--w4len-line); font-size: 13px; color: var(--w4len-muted); }
  .w4len-legal p { margin: 10px 0; }
  .w4len-legal ul { display: flex; flex-wrap: wrap; gap: 0 20px; }
  .w4len-legal a { font-size: 13px; }
  .w4len-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (max-width: 760px) {
    .w4len { padding-top: 56px; }
    .w4len-top { grid-template-columns: 1fr 1fr; gap: 24px 20px; }
    .w4len-lead { grid-column: 1 / -1; }
  }
  /* Change this: size of the closing line (cqi of the footer width). */
  .w4len { --w4len-size: 22.5cqi; }
  .w4len-big { margin-top: 0; margin-bottom: 48px; }
  .w4len-kicker { margin: 0 0 4px; font-size: 13px; letter-spacing: .2em; text-transform: uppercase; color: var(--w4len-accent); }
  .w4len-head { margin: 0; font-weight: 400; }
  .w4len-line { position: relative; display: block; white-space: nowrap; overflow: hidden; font-family: "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif; font-style: italic; font-size: var(--w4len-size); line-height: 1.12; letter-spacing: -.035em; padding: 0 .06em; }
  .w4len-l { display: inline-block; transform-origin: 50% 88%; will-change: transform; }
  .w4len-mail { display: inline-flex; align-items: center; min-height: 44px; margin-top: 4px; color: var(--w4len-ink); font-size: clamp(17px, 2.2vw, 22px); text-decoration: underline; text-decoration-color: var(--w4len-accent); text-underline-offset: 6px; border-radius: 3px; }
  .w4len-mail:hover { color: var(--w4len-accent); }
  @media (prefers-reduced-motion: reduce) { .w4len-l { transform: none !important; will-change: auto; } }
`;

export default function LetterpressFooterClosingLineLeans() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root: any = ref.current;
    if (!root) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var line = root.querySelector(".w4len-line");
    var ls = [].slice.call(root.querySelectorAll(".w4len-l"));
    var cur = ls.map(function () { return 0; });
    var px = 0, live = false, frame = 0;
    function tick(t) {
      var w = line.offsetWidth;
      /* idle demo: an imaginary pointer drifts along the line until a real mouse arrives */
      var x = live ? px : w * (0.5 + 0.42 * Math.sin(t / 2300));
      for (var i = 0; i < ls.length; i++) {
        var el = ls[i], d = (x - el.offsetLeft - el.offsetWidth / 2) / w;
        var s = Math.max(-1, Math.min(1, d * 4)) * Math.exp(-d * d * 7);
        cur[i] += (s - cur[i]) * EASE;
        el.style.transform = "translateX(" + (cur[i] * SHIFT).toFixed(2) + "px) skewX(" + (-cur[i] * LEAN).toFixed(2) + "deg)";
      }
      frame = requestAnimationFrame(tick);
    }
    function move(e) {
      if (e.pointerType !== "mouse") return;
      live = true;
      px = e.clientX - line.getBoundingClientRect().left;
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
    <footer className="w4len" ref={ref}>
      <style>{STYLES}</style>
      <div className="w4len-in">
        <div className="w4len-big">
          <p className="w4len-kicker">Have something to print?</p>
          <h2 className="w4len-head">
            <span className="w4len-sr">Write to us</span>
            <span className="w4len-line" aria-hidden="true">
              {"write to us".split("").map((c, i) => (
                <span key={i} className="w4len-l" style={{ "--i": i } as CSSProperties}>{c === " " ? "\u00a0" : c}</span>
              ))}
            </span>
          </h2>
          <a className="w4len-mail" href="#">press@quillandhollis.studio</a>
        </div>
        <div className="w4len-top">
          <div className="w4len-lead">
            <p className="w4len-brand">Quill &amp; Hollis</p>
            <p className="w4len-blurb">
              A two-press letterpress studio printing wedding suites, book covers and the odd stubborn poster.
            </p>
            <address className="w4len-addr">
              Unit 3, Ropewalk Yard, Leith
              <br />
              Studio visits by appointment
              <br />
              0131 496 0582
            </address>
          </div>
          <div className="w4len-col">
            <h2>Print</h2>
            <ul>
              <li>
                <a href="#">Wedding stationery</a>
              </li>
              <li>
                <a href="#">Business cards</a>
              </li>
              <li>
                <a href="#">Book jackets</a>
              </li>
              <li>
                <a href="#">Posters</a>
              </li>
            </ul>
          </div>
          <div className="w4len-col">
            <h2>Studio</h2>
            <ul>
              <li>
                <a href="#">Our presses</a>
              </li>
              <li>
                <a href="#">Paper library</a>
              </li>
              <li>
                <a href="#">Workshops</a>
              </li>
            </ul>
          </div>
          <div className="w4len-col">
            <h2>Elsewhere</h2>
            <ul>
              <li>
                <a href="#">Newsletter</a>
              </li>
              <li>
                <a href="#">Instagram</a>
              </li>
              <li>
                <a href="#">Print fairs</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="w4len-legal">
          <p>© 2026 Quill &amp; Hollis Letterpress. Printed on cotton stock.</p>
          <ul>
            <li>
              <a href="#">Privacy</a>
            </li>
            <li>
              <a href="#">Terms</a>
            </li>
            <li>
              <a href="#">Accessibility</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

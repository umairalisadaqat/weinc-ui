import { Fragment, useEffect, useRef } from "react";
import type { CSSProperties } from "react";

const ZONE = "Europe/Lisbon"; // time zone of the shop
const CITY = "Lisbon"; // city named next to the clock
const OPEN = 8; // opening hour, 24h clock
const CLOSE = 19; // closing hour, 24h clock

// Same markup, styles and script as the plain HTML version.
const STYLES = `
/* Change these: background, text, muted text, rule colour, accent (links' focus ring and highlights). */
  .w4clk { --w4clk-bg: #9c3f25; --w4clk-ink: #f8eddf; --w4clk-muted: #f2dcc8; --w4clk-line: #b45a3e; --w4clk-accent: #ffe2b8; }
  .w4clk { position: relative; overflow: hidden; background: var(--w4clk-bg); color: var(--w4clk-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 72px clamp(20px, 4vw, 56px) 24px; }
  .w4clk *, .w4clk *::before, .w4clk *::after { box-sizing: border-box; }
  .w4clk-in { max-width: 1240px; margin: 0 auto; }
  .w4clk-top { display: grid; grid-template-columns: minmax(0, 1.5fr) repeat(3, minmax(0, 1fr)); gap: 32px 40px; }
  .w4clk-brand { margin: 0; font-size: 18px; font-weight: 650; letter-spacing: -.01em; }
  .w4clk-blurb { margin: 12px 0 0; max-width: 32ch; font-size: 15px; line-height: 1.6; color: var(--w4clk-muted); }
  .w4clk-addr { margin: 16px 0 0; font-style: normal; font-size: 14px; line-height: 1.65; color: var(--w4clk-muted); }
  .w4clk-col h2 { margin: 0 0 6px; font-size: 12px; font-weight: 650; letter-spacing: .14em; text-transform: uppercase; color: var(--w4clk-muted); }
  .w4clk-col ul, .w4clk-legal ul { list-style: none; margin: 0; padding: 0; }
  .w4clk-col a, .w4clk-legal a { display: inline-flex; align-items: center; min-height: 40px; color: inherit; text-decoration: none; font-size: 15px; border-radius: 3px; }
  .w4clk-col a:hover, .w4clk-legal a:hover { text-decoration: underline; text-underline-offset: 4px; }
  .w4clk a:focus-visible { outline: 2px solid var(--w4clk-accent); outline-offset: 3px; }
  .w4clk-big { container-type: inline-size; margin: 56px 0 0; }
  .w4clk-legal { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0 24px; margin-top: 24px; padding-top: 6px; border-top: 1px solid var(--w4clk-line); font-size: 13px; color: var(--w4clk-muted); }
  .w4clk-legal p { margin: 10px 0; }
  .w4clk-legal ul { display: flex; flex-wrap: wrap; gap: 0 20px; }
  .w4clk-legal a { font-size: 13px; }
  .w4clk-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (max-width: 760px) {
    .w4clk { padding-top: 56px; }
    .w4clk-top { grid-template-columns: 1fr 1fr; gap: 24px 20px; }
    .w4clk-lead { grid-column: 1 / -1; }
  }
  /* Change these: clock size (cqi of the footer width) and how long a digit takes to roll. */
  .w4clk { --w4clk-size: 25cqi; --w4clk-roll: 1.1s; }
  .w4clk-label { margin: 0; text-align: center; font-size: 14px; letter-spacing: .2em; text-transform: uppercase; color: var(--w4clk-muted); }
  .w4clk-clock { display: flex; justify-content: center; margin: 4px 0 0; font: 650 var(--w4clk-size)/.9 ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif; font-variant-numeric: tabular-nums; letter-spacing: -.04em; white-space: nowrap; overflow: hidden; }
  .w4clk-reel { display: block; height: .9em; overflow: hidden; }
  .w4clk-strip { display: block; transform: translateY(calc(var(--d) * -10%)); transition: transform var(--w4clk-roll) cubic-bezier(.7, 0, .18, 1); }
  .w4clk-reel:nth-child(2) .w4clk-strip { transition-delay: .08s; }
  .w4clk-reel:nth-child(4) .w4clk-strip { transition-delay: .16s; }
  .w4clk-reel:nth-child(5) .w4clk-strip { transition-delay: .24s; }
  .w4clk-strip span { display: block; height: .9em; text-align: center; }
  .w4clk-colon { display: block; height: .9em; line-height: .8; padding: 0 .02em; animation: w4clk-blink 2s ease-in-out infinite; }
  .w4clk[data-off] .w4clk-colon { animation-play-state: paused; }
  @keyframes w4clk-blink { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
  .w4clk-status { margin: 14px auto 0; max-width: 46ch; text-align: center; font-size: 16px; line-height: 1.5; }
  @media (prefers-reduced-motion: reduce) { .w4clk-strip { transition: none; } .w4clk-colon { animation: none; } }
`;

export default function CafeFooterGiantLocalTimeOnRollingDigits() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root: any = ref.current;
    if (!root) return;
    var strips = [].slice.call(root.querySelectorAll(".w4clk-strip"));
    var label = root.querySelector(".w4clk-label"), status = root.querySelector(".w4clk-status");
    var fmt = new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    var timer = 0;
    function two(n) { return (n < 10 ? "0" : "") + n; }
    function show() {
      clearTimeout(timer);
      var t = fmt.format(new Date()).replace(/\D/g, "");
      for (var i = 0; i < 4; i++) strips[i].style.setProperty("--d", t[i]);
      var hr = +t.slice(0, 2), open = hr >= OPEN && hr < CLOSE;
      label.textContent = "Right now in " + CITY;
      status.textContent = "It is " + t.slice(0, 2) + ":" + t.slice(2) + " here. " + (open ? "We are open until " + two(CLOSE) + ":00." : "We are closed; doors open at " + two(OPEN) + ":00.");
      /* wake again just after the next minute turns */
      timer = setTimeout(show, 60050 - (Date.now() % 60000));
    }
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { root.removeAttribute("data-off"); show(); }
      else { root.setAttribute("data-off", ""); clearTimeout(timer); }
    });
    io.observe(root);
    return function () { clearTimeout(timer); io.disconnect(); };
  }, []);

  return (
    <footer className="w4clk" ref={ref}>
      <style>{STYLES}</style>
      <div className="w4clk-in">
        <div className="w4clk-top">
          <div className="w4clk-lead">
            <p className="w4clk-brand">Rua Doce Café</p>
            <p className="w4clk-blurb">
              Custard tarts at eight, bica all day, and a long marble counter facing the tram stop.
            </p>
            <address className="w4clk-addr">
              Rua das Flores 61, 1200-194 Lisboa
              <br />
              Every day, 08:00 to 19:00
              <br />
              +351 21 555 0148
            </address>
          </div>
          <div className="w4clk-col">
            <h2>Café</h2>
            <ul>
              <li>
                <a href="#">Menu</a>
              </li>
              <li>
                <a href="#">Pastry times</a>
              </li>
              <li>
                <a href="#">Takeaway</a>
              </li>
            </ul>
          </div>
          <div className="w4clk-col">
            <h2>Visit</h2>
            <ul>
              <li>
                <a href="#">Directions</a>
              </li>
              <li>
                <a href="#">Seating</a>
              </li>
              <li>
                <a href="#">Private mornings</a>
              </li>
            </ul>
          </div>
          <div className="w4clk-col">
            <h2>Say olá</h2>
            <ul>
              <li>
                <a href="#">Write to us</a>
              </li>
              <li>
                <a href="#">Instagram</a>
              </li>
              <li>
                <a href="#">Work with us</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="w4clk-big">
          <p className="w4clk-label">Doors open at</p>
          <div className="w4clk-clock" aria-hidden="true">
            {[0, 8, 0, 0].map((d, k) => (
              <Fragment key={k}>
                {k === 2 && <span className="w4clk-colon">:</span>}
                <span className="w4clk-reel">
                  <span className="w4clk-strip" style={{ "--d": d } as CSSProperties}>
                    {"0123456789".split("").map((n) => <span key={n}>{n}</span>)}
                  </span>
                </span>
              </Fragment>
            ))}
          </div>
          <p className="w4clk-status">Open every day from 08:00 until 19:00.</p>
        </div>
        <div className="w4clk-legal">
          <p>© 2026 Rua Doce, Lda. Prices include VAT.</p>
          <ul>
            <li>
              <a href="#">Privacy</a>
            </li>
            <li>
              <a href="#">Allergens</a>
            </li>
            <li>
              <a href="#">Complaints book</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

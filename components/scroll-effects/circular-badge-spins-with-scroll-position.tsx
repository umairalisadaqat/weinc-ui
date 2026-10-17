import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version. The CSS comments name the values to change.
const STYLES = `
  /* Change these: --w7bdg-turns (rotation over the whole scroll), --w7bdg-size (badge width), --w7bdg-bg, --w7bdg-ink, --w7bdg-rust. */
  .w7bdg { --w7bdg-turns: 2; --w7bdg-size: 200px; --w7bdg-bg: #eadfcb; --w7bdg-ink: #2a1c14; --w7bdg-rust: #9c4a26;
    position: relative; height: 620px; overflow-y: auto; overflow-x: hidden; background: var(--w7bdg-bg); color: var(--w7bdg-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  /* To run on page scroll: delete height and overflow above; the CSS timeline then follows the page, and the fallback reads window.scrollY. */
  .w7bdg:focus-visible { outline: 3px solid var(--w7bdg-rust); outline-offset: -3px; }
  .w7bdg-hint { position: sticky; top: 0; height: 0; z-index: 3; display: flex; justify-content: flex-end; pointer-events: none; }
  .w7bdg-hint span { margin: 14px 14px 0 0; padding: 5px 12px; border-radius: 999px; background: rgba(42,28,20,.1); font-size: 12px; transition: opacity .5s; }
  .w7bdg[data-touched] .w7bdg-hint span { opacity: 0; }
  .w7bdg-wrap { max-width: 66rem; margin: 0 auto; padding: 48px 20px 80px; display: grid; gap: 28px; }
  .w7bdg-side { order: -1; }
  .w7bdg-badge { position: relative; width: min(var(--w7bdg-size), 44vw); aspect-ratio: 1; border-radius: 50%; box-shadow: 0 16px 30px -10px rgba(42,28,20,.4); }
  .w7bdg-ring { display: block; width: 100%; height: 100%; }
  .w7bdg-disc { fill: var(--w7bdg-ink); }
  .w7bdg-txt { fill: #eadfcb; font-size: 14px; font-weight: 700; letter-spacing: 2.3px; text-transform: uppercase; }
  .w7bdg-bean { position: absolute; left: 34%; top: 34%; width: 32%; height: 32%; fill: var(--w7bdg-rust); stroke: #2a1c14; stroke-width: 3; stroke-linecap: round; }
  .w7bdg-bean path { fill: none; stroke: #eadfcb; }
  .w7bdg-eye { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: var(--w7bdg-rust); }
  .w7bdg-h { margin: 12px 0 0; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(2.1rem, 5vw, 3.6rem); line-height: 1.04; letter-spacing: -.02em; }
  .w7bdg-p { margin: 18px 0 0; max-width: 34rem; font-size: 16px; line-height: 1.65; color: #4f3b2e; }
  .w7bdg-sub { margin: 64px 0 0; font-size: 13px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  .w7bdg-list { list-style: none; margin: 16px 0 0; padding: 0; border-top: 1px solid rgba(42,28,20,.2); }
  .w7bdg-list li { display: grid; grid-template-columns: 1fr auto; gap: 4px 16px; padding: 18px 0; border-bottom: 1px solid rgba(42,28,20,.2); }
  .w7bdg-list p { margin: 0; }
  .w7bdg-o { font-size: 19px; font-weight: 600; }
  .w7bdg-o span { margin-left: 8px; font-size: 13px; font-weight: 500; color: var(--w7bdg-rust); }
  .w7bdg-n { grid-column: 1; font-size: 15px; color: #5c4738; }
  .w7bdg-pr { grid-column: 2; grid-row: 1 / span 2; align-self: center; font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .w7bdg-btn { display: inline-flex; align-items: center; min-height: 48px; margin-top: 32px; padding: 0 26px; border-radius: 999px; background: var(--w7bdg-ink); color: var(--w7bdg-bg); font-weight: 600; font-size: 15px; text-decoration: none; }
  .w7bdg-btn:hover { background: #4a3123; }
  .w7bdg-btn:focus-visible { outline: 3px solid var(--w7bdg-rust); outline-offset: 3px; }
  @media (min-width: 820px) {
    .w7bdg-wrap { grid-template-columns: 1fr 240px; gap: 56px; padding: 60px 48px 90px; }
    .w7bdg-side { order: 2; }
    .w7bdg-badge { position: sticky; top: 64px; width: var(--w7bdg-size); }
  }
  @keyframes w7bdg-spin { to { transform: rotate(calc(var(--w7bdg-turns) * 360deg)); } }
  /* The ring follows the nearest scroller; the bean in the middle stays upright. */
  @supports (animation-timeline: scroll()) {
    .w7bdg:not([data-fb]) .w7bdg-ring { animation: w7bdg-spin linear both; animation-timeline: scroll(nearest block); }
  }
  @media (prefers-reduced-motion: reduce) { .w7bdg .w7bdg-ring { animation: none !important; transform: rotate(-8deg) !important; } }
`;

export default function CircularBadgeSpinsWithScrollPosition() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    const off: Array<() => void> = [];
    
      var SPEED = 30; // px per second of demo scroll before anyone touches the box; 0 turns it off
      var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      var frame = 0, last = 0, pos = 0, seen = true, done = reduce || !SPEED;
      function step(t) {
        var dt = last ? Math.min(t - last, 50) : 0;
        last = t; pos += SPEED * dt / 1000;
        if (pos >= root.scrollHeight - root.clientHeight) pos = 0;
        root.scrollTop = pos;
        frame = requestAnimationFrame(step);
      }
      function play() { if (!done && seen && !frame) { last = 0; frame = requestAnimationFrame(step); } }
      function stop() { cancelAnimationFrame(frame); frame = 0; }
      function hand() { done = true; stop(); root.setAttribute("data-touched", ""); }
      ["wheel", "touchstart", "pointerdown", "keydown"].forEach(function (n) {
        root.addEventListener(n, hand, { passive: true });
        off.push(function () { root.removeEventListener(n, hand); });
      });
      var vis = new IntersectionObserver(function (e) { seen = e[0].isIntersecting; if (seen) play(); else stop(); });
      vis.observe(root);
      off.push(stop, function () { vis.disconnect(); });
      play();
      // Fallback: turn the ring from the scroll position, at most once per frame.
      if (reduce || (window.CSS && CSS.supports("animation-timeline: scroll()"))) return;
      root.setAttribute("data-fb", "");
      var ring = root.querySelector(".w7bdg-ring"), turns = parseFloat(getComputedStyle(root).getPropertyValue("--w7bdg-turns")) || 2, raf = 0;
      function spin() {
        raf = 0;
        var max = root.scrollHeight - root.clientHeight || 1;
        ring.style.transform = "rotate(" + (root.scrollTop / max * turns * 360).toFixed(1) + "deg)";
      }
      function onScroll() { if (!raf) raf = requestAnimationFrame(spin); }
      root.addEventListener("scroll", onScroll, { passive: true });
      off.push(function () { root.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); ring.style.transform = ""; root.removeAttribute("data-fb"); });
    return () => off.forEach((f) => f());
  }, [prefersReduced]);

  return (
    <section className="w7bdg" data-w7bdg="" ref={rootRef} tabIndex={0} aria-label="Halden Roastery, this month's coffee, scrollable">
      <style>{STYLES}</style>
      <div className="w7bdg-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w7bdg-wrap">
        <div className="w7bdg-side">
          <div className="w7bdg-badge" aria-hidden="true">
            <svg className="w7bdg-ring" viewBox="0 0 200 200">
              <defs><path id="w7bdg-c" d="M100 100 m-74 0 a74 74 0 1 1 148 0 a74 74 0 1 1 -148 0" /></defs>
              <circle cx="100" cy="100" r="98" className="w7bdg-disc" />
              <text className="w7bdg-txt"><textPath href="#w7bdg-c">ROASTED ON TUESDAYS · HALDEN ROASTERY · </textPath></text>
            </svg>
            <svg className="w7bdg-bean" viewBox="0 0 64 64"><ellipse cx="32" cy="32" rx="17" ry="23" transform="rotate(30 32 32)" /><path d="M24 15c10 9 2 25 16 34" /></svg>
          </div>
        </div>
        <div className="w7bdg-main">
          <p className="w7bdg-eye">Halden Roastery</p>
          <h2 className="w7bdg-h">Roasted on Tuesday, in your cup by Friday</h2>
          <p className="w7bdg-p">We roast in eleven kilo batches in a converted dairy and post everything the same afternoon, so the beans reach you while they still smell of the drum.</p>
          <h3 className="w7bdg-sub">This month's beans</h3>
          <ul className="w7bdg-list">
            <li><p className="w7bdg-o">Huila, Colombia <span>Washed</span></p><p className="w7bdg-n">Red apple, panela, cocoa nib</p><p className="w7bdg-pr">£11 · 250 g</p></li>
            <li><p className="w7bdg-o">Sidama, Ethiopia <span>Natural</span></p><p className="w7bdg-n">Blueberry, jasmine, black tea</p><p className="w7bdg-pr">£12.50 · 250 g</p></li>
            <li><p className="w7bdg-o">Cerrado, Brazil <span>Pulped natural</span></p><p className="w7bdg-n">Hazelnut, milk chocolate, brown sugar</p><p className="w7bdg-pr">£9.50 · 250 g</p></li>
          </ul>
          <h3 className="w7bdg-sub">How we roast</h3>
          <p className="w7bdg-p">Lighter than most, slower than most. Each coffee gets a few test batches on a small sample roaster before we commit a full sack, and we cup every batch the next morning.</p>
          <a className="w7bdg-btn" href="#">Start a fortnightly bag</a>
        </div>
      </div>
    </section>
  );
}

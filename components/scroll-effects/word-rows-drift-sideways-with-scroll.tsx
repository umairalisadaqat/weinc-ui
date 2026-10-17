import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version; the comments in CSS name the values to change.
const STYLES = `
  /* Change these: --w1dri-shift (how far rows travel), --w1dri-bg, --w1dri-ink, --w1dri-gold, and the font-size on .w1dri-row. */
  .w1dri { --w1dri-shift: -32%; --w1dri-bg: #1f3326; --w1dri-ink: #f1ead8; --w1dri-gold: #d9b26a;
    height: 620px; overflow-y: auto; overflow-x: hidden; position: relative; background: var(--w1dri-bg); color: var(--w1dri-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; scrollbar-width: thin; scrollbar-color: #4b6352 transparent; }
  /* To drift with the page scroll: delete height and overflow-y above and set the script to read window scroll. */
  .w1dri:focus-visible { outline: 3px solid var(--w1dri-gold); outline-offset: -3px; }
  .w1dri-hint { position: sticky; top: 0; height: 0; z-index: 3; display: flex; align-items: flex-start; justify-content: flex-end; pointer-events: none; }
  .w1dri-hint span { margin: 12px 12px 0 0; padding: 5px 12px; border-radius: 999px; background: rgba(241,234,216,.14); color: var(--w1dri-ink);
    font-size: 12px; letter-spacing: .04em; transition: opacity .5s ease; }
  .w1dri[data-touched] .w1dri-hint span { opacity: 0; }
  .w1dri-intro { max-width: 64rem; margin: 0 auto; padding: 64px 20px 36px; }
  .w1dri-eyebrow { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: var(--w1dri-gold); }
  .w1dri-h { margin: 14px 0 0; max-width: 40rem; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(1.8rem, 4.2vw, 2.8rem); line-height: 1.12; letter-spacing: -.01em; }
  .w1dri-rows { padding: 20px 0 60px; }
  .w1dri-row { margin: 0; width: max-content; white-space: nowrap; font-family: Georgia, "Iowan Old Style", serif; font-size: clamp(3rem, 9vw, 7rem);
    line-height: 1.1; letter-spacing: -.03em; will-change: transform; }
  .w1dri-row i { display: inline-block; width: .22em; height: .22em; margin: 0 .35em; border-radius: 50%; background: var(--w1dri-gold); vertical-align: middle; }
  .w1dri-b { color: transparent; -webkit-text-stroke: 1.5px var(--w1dri-ink); transform: translateX(var(--w1dri-shift)); }
  .w1dri-c { font-size: clamp(2rem, 5.5vw, 4.2rem); color: var(--w1dri-gold); }
  .w1dri-card { max-width: 64rem; margin: 0 auto 72px; padding: 0 20px; display: grid; gap: 24px; }
  .w1dri-card h3 { margin: 0; font-size: 1.375rem; font-weight: 600; }
  .w1dri-card p { margin: 10px 0 0; max-width: 32rem; font-size: 1rem; line-height: 1.65; color: #cfd8cc; }
  .w1dri-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; font-size: .9375rem; color: #e3ddcc; }
  .w1dri-list li { padding-top: 10px; border-top: 1px solid rgba(241,234,216,.18); }
  .w1dri-btn { justify-self: start; display: inline-flex; min-height: 46px; align-items: center; padding: 0 22px; border-radius: 999px;
    background: var(--w1dri-gold); color: #1f3326; font-weight: 700; font-size: .9375rem; text-decoration: none; }
  .w1dri-btn:hover { background: #e6c487; }
  .w1dri-btn:focus-visible { outline: 3px solid var(--w1dri-ink); outline-offset: 3px; }
  @media (min-width: 820px) { .w1dri-intro, .w1dri-card { padding-left: 40px; padding-right: 40px; } .w1dri-card { grid-template-columns: 1.3fr 1fr; align-items: start; } .w1dri-btn { grid-column: 1; } }
  @keyframes w1dri-left { from { transform: translateX(0); } to { transform: translateX(var(--w1dri-shift)); } }
  @keyframes w1dri-right { from { transform: translateX(var(--w1dri-shift)); } to { transform: translateX(0); } }
  @supports (animation-timeline: view()) {
    .w1dri:not([data-fb]) .w1dri-a { animation: w1dri-left linear both; animation-timeline: view(); animation-range: cover 0% cover 100%; }
    .w1dri:not([data-fb]) .w1dri-b { animation: w1dri-right linear both; animation-timeline: view(); animation-range: cover 0% cover 100%; }
  }
  @media (prefers-reduced-motion: reduce) {
    .w1dri .w1dri-row { animation: none !important; transform: translateX(-6%); will-change: auto; }
  }
`;

export default function WordRowsDriftSidewaysWithScroll() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    
      var off = [];
      var SPEED = 45; // demo scroll in px per second before anyone touches the box; 0 turns it off
      var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      var frame = 0, last = 0, pos = 0, seen = true, done = reduce || !SPEED;
      function on(el, n, f) { el.addEventListener(n, f, { passive: true }); off.push(function () { el.removeEventListener(n, f); }); }
      function keep(o) { off.push(function () { o.disconnect(); }); return o; }
    
      // Slow demo scroll so the preview moves; any wheel, touch, click or key hands control back.
      function step(t) {
        var dt = last ? Math.min(t - last, 50) : 0;
        last = t;
        pos += SPEED * dt / 1000;
        if (pos >= root.scrollHeight - root.clientHeight) pos = 0;
        root.scrollTop = pos;
        frame = requestAnimationFrame(step);
      }
      function play() { if (!done && seen && !frame) { last = 0; frame = requestAnimationFrame(step); } }
      function stop() { cancelAnimationFrame(frame); frame = 0; }
      off.push(stop);
      keep(new IntersectionObserver(function (e) { seen = e[0].isIntersecting; if (seen) play(); else stop(); })).observe(root);
      ["wheel", "touchstart", "pointerdown", "keydown"].forEach(function (n) {
        on(root, n, function () { done = true; stop(); root.setAttribute("data-touched", ""); });
      });
      play();
      var native = window.CSS && CSS.supports("animation-timeline: view()");
    
      // Without scroll timelines: move each row by its own progress through the box.
      if (!reduce && !native) {
        root.setAttribute("data-fb", "");
        var SHIFT = -32; // percent, keep in step with --w1dri-shift
        var rows = root.querySelectorAll(".w1dri-row"), f2 = 0;
        var draw = function () {
          f2 = 0;
          var a = root.getBoundingClientRect();
          rows.forEach(function (r) {
            var b = r.getBoundingClientRect();
            var p = Math.min(1, Math.max(0, (a.bottom - b.top) / (a.height + b.height)));
            if (r.classList.contains("w1dri-b")) p = 1 - p;
            r.style.transform = "translateX(" + (SHIFT * p).toFixed(2) + "%)";
          });
        };
        on(root, "scroll", function () { if (!f2) f2 = requestAnimationFrame(draw); });
        off.push(function () { cancelAnimationFrame(f2); });
        draw();
      }
    return () => off.forEach((f: any) => f());
  }, [prefersReduced]);

  return (
    <section className="w1dri" data-w1dri="" ref={rootRef} tabIndex={0} aria-label="Tidewater Saturday Market, scrollable">
    <style>{STYLES}</style>
      <div className="w1dri-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w1dri-intro">
        <p className="w1dri-eyebrow">Tidewater Saturday Market</p>
        <h2 className="w1dri-h">Forty stalls under the old fish hall roof, every Saturday morning.</h2>
      </div>
      <div className="w1dri-rows" aria-hidden="true">
        <p className="w1dri-row w1dri-a">Heirloom tomatoes <i></i> Sourdough <i></i> Wildflower honey <i></i> Oyster mushrooms <i></i> Heirloom tomatoes <i></i> Sourdough <i></i></p>
        <p className="w1dri-row w1dri-b">Smoked mackerel <i></i> Raw milk cheese <i></i> Cut dahlias <i></i> Cider <i></i> Smoked mackerel <i></i> Raw milk cheese <i></i></p>
        <p className="w1dri-row w1dri-a w1dri-c">Duck eggs <i></i> Rye crackers <i></i> Quince jelly <i></i> Sea salt <i></i> Duck eggs <i></i> Rye crackers <i></i> Quince jelly <i></i></p>
      </div>
      <div className="w1dri-card">
        <div>
          <h3>Saturdays, 8 until 1</h3>
          <p>Growers, bakers, fishers and cheesemakers from within a short drive of the harbour. Bring a bag; the early stalls sell out first.</p>
        </div>
        <ul className="w1dri-list">
          <li>Bread and pastry</li><li>Fish and shellfish</li><li>Cheese and dairy</li><li>Veg, fruit and flowers</li>
        </ul>
        <a href="#" className="w1dri-btn">See this week's stalls</a>
      </div>
    </section>
  );
}

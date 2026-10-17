import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version; the comments in CSS name the values to change.
const STYLES = `
  /* Change these: --w1tln-mid (half the box height: where the reading line sits), --w1tln-bg, --w1tln-ink, --w1tln-glow (lit dot colour). */
  .w1tln { --w1tln-mid: 310px; --w1tln-bg: #f2f1ee; --w1tln-ink: #24272b; --w1tln-glow: #c8862a;
    height: 620px; overflow-y: auto; overflow-x: hidden; position: relative; background: var(--w1tln-bg); color: var(--w1tln-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; scrollbar-width: thin; }
  /* To use page scroll: delete height and overflow above, set --w1tln-mid: 50vh, and point the script at window. */
  .w1tln:focus-visible { outline: 3px solid var(--w1tln-ink); outline-offset: -3px; }
  .w1tln-hint { position: sticky; top: 0; height: 0; z-index: 3; display: flex; align-items: flex-start; justify-content: flex-end; pointer-events: none; }
  .w1tln-hint span { margin: 12px 12px 0 0; padding: 5px 12px; border-radius: 999px; background: rgba(36,39,43,.85); color: #f2f1ee;
    font-size: 12px; letter-spacing: .04em; transition: opacity .5s ease; }
  .w1tln[data-touched] .w1tln-hint span { opacity: 0; }
  .w1tln-wrap { max-width: 46rem; margin: 0 auto; padding: 64px 20px 260px; }
  .w1tln-eyebrow { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: #8a5a17; }
  .w1tln-h { margin: 14px 0 0; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(1.9rem, 4.4vw, 2.8rem); line-height: 1.1; letter-spacing: -.015em; }
  .w1tln-lead { margin: 14px 0 0; font-size: 1rem; line-height: 1.6; color: #4b4f55; }
  .w1tln-list { list-style: none; margin: 44px 0 0; padding: 0 0 0 52px; position: relative; view-timeline: --w1tln-l block; }
  .w1tln-list::before, .w1tln-list::after { content: ""; position: absolute; left: 15px; top: 8px; bottom: 8px; width: 2px; border-radius: 2px; background: #d3d0c8; }
  .w1tln-list::after { background: var(--w1tln-ink); transform-origin: 50% 0; transform: scaleY(var(--w1tln-p, 1)); }
  .w1tln-i { position: relative; padding: 0 0 44px; view-timeline: --w1tln-v block; }
  .w1tln-dot { position: absolute; left: -45px; top: 3px; width: 16px; height: 16px; border-radius: 50%; background: var(--w1tln-bg); box-shadow: inset 0 0 0 2px #b8b4aa; z-index: 1; }
  .w1tln-dot::after { content: ""; position: absolute; inset: -5px; border-radius: 50%; background: var(--w1tln-glow);
    box-shadow: 0 0 0 6px rgba(200,134,42,.18); }
  .w1tln-yr { margin: 0; font-size: .875rem; font-weight: 700; letter-spacing: .06em; color: #8a5a17; font-variant-numeric: tabular-nums; }
  .w1tln-i h3 { margin: 6px 0 0; font-size: 1.25rem; font-weight: 600; }
  .w1tln-i h3 + p { margin: 8px 0 0; font-size: 1rem; line-height: 1.65; color: #4b4f55; }
  .w1tln-btn { display: inline-flex; min-height: 46px; align-items: center; padding: 0 22px; border-radius: 8px; background: var(--w1tln-ink);
    color: #f2f1ee; font-weight: 600; font-size: .9375rem; text-decoration: none; }
  .w1tln-btn:hover { background: #3a3e44; }
  .w1tln-btn:focus-visible { outline: 3px solid var(--w1tln-glow); outline-offset: 3px; }
  @keyframes w1tln-draw { from { transform: scaleY(0); } to { transform: scaleY(1); } }
  @keyframes w1tln-lit { from { opacity: 0; transform: scale(.3); } to { opacity: 1; transform: scale(1); } }
  @supports (animation-timeline: view()) {
    .w1tln:not([data-fb]) .w1tln-list::after { animation: w1tln-draw linear both; animation-timeline: --w1tln-l;
      animation-range: cover var(--w1tln-mid) cover calc(100% - var(--w1tln-mid)); }
    .w1tln:not([data-fb]) .w1tln-dot::after { animation: w1tln-lit linear both; animation-timeline: --w1tln-v;
      animation-range: cover calc(var(--w1tln-mid) - 20px) cover calc(var(--w1tln-mid) + 10px); }
  }
  /* Fallback set by the script: --w1tln-p draws the line, .w1tln-on lights a dot. */
  .w1tln[data-fb] .w1tln-dot::after { opacity: 0; transform: scale(.3); transition: opacity .35s ease, transform .45s cubic-bezier(.3,1.4,.5,1); }
  .w1tln[data-fb] .w1tln-on .w1tln-dot::after { opacity: 1; transform: none; }
  @media (prefers-reduced-motion: reduce) {
    .w1tln .w1tln-list::after, .w1tln .w1tln-dot::after { animation: none !important; transform: none; opacity: 1; transition: none; }
  }
`;

export default function TimelineSpineDrawsDotsLightOnScroll() {
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
    
      // Without scroll timelines: compare the list and each entry with the middle of the box.
      if (!reduce && !native) {
        root.setAttribute("data-fb", "");
        var list = root.querySelector(".w1tln-list"), items = root.querySelectorAll(".w1tln-i"), f2 = 0;
        var draw = function () {
          f2 = 0;
          var a = root.getBoundingClientRect(), mid = a.top + root.clientHeight / 2, b = list.getBoundingClientRect();
          list.style.setProperty("--w1tln-p", Math.min(1, Math.max(0, (mid - b.top) / b.height)).toFixed(4));
          items.forEach(function (it) { it.classList.toggle("w1tln-on", it.getBoundingClientRect().top + 10 < mid); });
        };
        on(root, "scroll", function () { if (!f2) f2 = requestAnimationFrame(draw); });
        off.push(function () { cancelAnimationFrame(f2); });
        draw();
      }
    return () => off.forEach((f: any) => f());
  }, [prefersReduced]);

  return (
    <section className="w1tln" data-w1tln="" ref={rootRef} tabIndex={0} aria-label="Brannock Mill history, scrollable">
    <style>{STYLES}</style>
      <div className="w1tln-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w1tln-wrap">
        <p className="w1tln-eyebrow">Brannock Woollen Mill</p>
        <h2 className="w1tln-h">Five generations on one river bend</h2>
        <p className="w1tln-lead">The line fills as you read, and each year lights up as it reaches the middle of the box.</p>
        <ol className="w1tln-list">
          <li className="w1tln-i"><span className="w1tln-dot" aria-hidden="true"></span><p className="w1tln-yr">1898</p><h3>A wheel on the Brannock burn</h3><p>Two brothers lease a derelict corn mill and fit a carding engine bought at a farm sale. The first blankets go to the valley farms.</p></li>
          <li className="w1tln-i"><span className="w1tln-dot" aria-hidden="true"></span><p className="w1tln-yr">1926</p><h3>Looms arrive</h3><p>Four second-hand power looms come by rail. Tweed joins the blankets, woven in the patterns the shepherds' wives sketched.</p></li>
          <li className="w1tln-i"><span className="w1tln-dot" aria-hidden="true"></span><p className="w1tln-yr">1958</p><h3>The flood year</h3><p>The burn takes the lower shed and half the stock. The family rebuilds a metre higher and keeps every weaver on.</p></li>
          <li className="w1tln-i"><span className="w1tln-dot" aria-hidden="true"></span><p className="w1tln-yr">1984</p><h3>Natural dyes again</h3><p>A granddaughter back from art school revives the old dye recipes: madder, weld and walnut husk from the mill garden.</p></li>
          <li className="w1tln-i"><span className="w1tln-dot" aria-hidden="true"></span><p className="w1tln-yr">2011</p><h3>Water power, restored</h3><p>The wheel turns again, now driving a small turbine that runs the looms on most days of the year.</p></li>
          <li className="w1tln-i"><span className="w1tln-dot" aria-hidden="true"></span><p className="w1tln-yr">Today</p><h3>Open doors</h3><p>The weaving floor is open to visitors on weekday mornings, and the shop sells straight off the loom.</p></li>
        </ol>
        <a href="#" className="w1tln-btn">Plan a mill visit</a>
      </div>
    </section>
  );
}

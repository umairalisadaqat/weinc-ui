import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version; the comments in CSS name the values to change.
const STYLES = `
  /* Change these: --w1bar-accent (bar colour), --w1bar-rail (empty track), --w1bar-bg, --w1bar-ink, and the bar height in .w1bar-rail. */
  .w1bar { --w1bar-accent: #0f766e; --w1bar-rail: #e2e8f0; --w1bar-bg: #ffffff; --w1bar-ink: #1e293b;
    height: 620px; overflow-y: auto; overflow-x: hidden; position: relative; background: var(--w1bar-bg); color: var(--w1bar-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; scrollbar-width: thin; }
  /* For a page-wide bar: delete height and overflow above, make .w1bar-top position: fixed, and use scroll(root) on .w1bar-fill. */
  .w1bar:focus-visible { outline: 3px solid var(--w1bar-accent); outline-offset: -3px; }
  .w1bar-top { position: sticky; top: 0; z-index: 3; background: #fff; border-bottom: 1px solid #eef2f6; }
  .w1bar-row { max-width: 44rem; margin: 0 auto; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .w1bar-brand { font-size: 13px; font-weight: 600; color: #334155; }
  .w1bar-hint { font-size: 12px; color: #475569; transition: opacity .5s ease; }
  .w1bar[data-touched] .w1bar-hint { opacity: 0; }
  .w1bar-rail { height: 4px; background: var(--w1bar-rail); }
  .w1bar-fill { display: block; height: 100%; background: var(--w1bar-accent); transform-origin: 0 50%; transform: scaleX(0); }
  .w1bar-art { max-width: 44rem; margin: 0 auto; padding: 44px 20px 80px; }
  .w1bar-kicker { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--w1bar-accent); }
  .w1bar-h { margin: 12px 0 0; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(1.9rem, 4.4vw, 2.75rem); line-height: 1.12; letter-spacing: -.015em; }
  .w1bar-by { margin: 14px 0 28px; font-size: .875rem; color: #475569; }
  .w1bar-art > p:not([class]) { margin: 0 0 18px; font-family: Georgia, "Iowan Old Style", serif; font-size: 1.125rem; line-height: 1.75; color: #334155; }
  .w1bar-art h3 { margin: 34px 0 12px; font-size: 1.25rem; font-weight: 600; }
  .w1bar-quote { margin: 30px 0; padding: 4px 0 4px 20px; border-left: 3px solid var(--w1bar-accent); font-family: Georgia, serif; font-size: 1.375rem; line-height: 1.5; font-style: italic; color: #1e293b; }
  .w1bar-btn { margin-top: 18px; display: inline-flex; min-height: 46px; align-items: center; padding: 0 22px; border-radius: 8px;
    background: var(--w1bar-accent); color: #fff; font-weight: 600; font-size: .9375rem; text-decoration: none; }
  .w1bar-btn:hover { background: #115e59; }
  .w1bar-btn:focus-visible { outline: 3px solid #1e293b; outline-offset: 3px; }
  @keyframes w1bar-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @supports (animation-timeline: scroll()) {
    .w1bar:not([data-fb]) .w1bar-fill { animation: w1bar-grow linear both; animation-timeline: scroll(nearest block); }
  }
  /* The bar reports position, so it keeps tracking with reduced motion; only the easing is removed. */
  .w1bar[data-fb] .w1bar-fill { transition: transform .12s linear; }
  @media (prefers-reduced-motion: reduce) { .w1bar[data-fb] .w1bar-fill, .w1bar-hint { transition: none; } }
`;

export default function ReadingProgressBarForLongArticle() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    
      var off = [];
      var SPEED = 60; // demo scroll in px per second before anyone touches the box; 0 turns it off
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
    
      // Without scroll timelines: set the bar from scrollTop (kept for reduced motion too, it is position, not decoration).
      if (!native) {
        root.setAttribute("data-fb", "");
        var fill = root.querySelector(".w1bar-fill"), f2 = 0;
        var draw = function () {
          f2 = 0;
          var max = root.scrollHeight - root.clientHeight;
          fill.style.transform = "scaleX(" + (max > 0 ? root.scrollTop / max : 0).toFixed(4) + ")";
        };
        on(root, "scroll", function () { if (!f2) f2 = requestAnimationFrame(draw); });
        off.push(function () { cancelAnimationFrame(f2); });
        draw();
      }
    return () => off.forEach((f: any) => f());
  }, [prefersReduced]);

  return (
    <section className="w1bar" data-w1bar="" ref={rootRef} tabIndex={0} aria-label="Boatyard journal article, scrollable">
    <style>{STYLES}</style>
      <div className="w1bar-top">
        <div className="w1bar-row">
          <span className="w1bar-brand">Kessler Boatyard · Journal</span>
          <span className="w1bar-hint" aria-hidden="true">Scroll inside</span>
        </div>
        <div className="w1bar-rail" aria-hidden="true"><span className="w1bar-fill"></span></div>
      </div>
      <article className="w1bar-art">
        <p className="w1bar-kicker">Restoration notes</p>
        <h2 className="w1bar-h">Bringing an old mahogany launch back to the water</h2>
        <p className="w1bar-by">Written in the shed by the restoration crew · 6 minute read</p>
        <p>She arrived on a borrowed trailer in early spring, grey from years under a tarpaulin and lighter than she should have been. A wooden boat that has dried out for a long time tells you everything through its seams: you could see daylight between the planks along the garboard.</p>
        <p>The first month was only looking. We photographed every fitting before it came off, numbered the floorboards in pencil, and drew the sheer line from three sides so we would know if anything moved once the old fastenings were out.</p>
        <h3>Planks, frames and patience</h3>
        <p>Most of the hull was sound. Two planks near the stern had soft spots where rainwater had sat against them, and four steamed oak frames had cracked at the turn of the bilge. Those were replaced one at a time, so the shape of the boat was always held by the timber around them.</p>
        <blockquote className="w1bar-quote">The rule in the shed is simple: never take out more than you can put back the same afternoon.</blockquote>
        <p>New frames were bent from green oak straight out of the steam box, clamped into place while they were still pliable, and riveted with copper once they had cooled. It is slow work, and it is the reason these boats last.</p>
        <h3>Varnish is a season, not a coat</h3>
        <p>The brightwork took longer than the woodwork. Mahogany wants thin coats, a light sanding between each, and a dry, still day for every one of them. By the time she was ready to launch, the transom had ten coats and a depth you could put your hand into.</p>
        <p>She went back into the water on a calm morning in late summer. The planks took up overnight, the bilge pump ran twice, and by the second day she was dry. Her owner took her out at dawn and did not come back until lunch.</p>
        <a href="#" className="w1bar-btn">Ask about a restoration</a>
      </article>
    </section>
  );
}

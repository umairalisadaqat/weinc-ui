import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version; the comments in CSS name the values to change.
const STYLES = `
  /* Change these: --w1pin-bg, --w1pin-ink, --w1pin-clay (accent), the track height (one box height per step),
     and the % stops in the w1pin-s1..s4 keyframes if you add or remove steps. */
  .w1pin { --w1pin-bg: #f5ece2; --w1pin-ink: #2d1f17; --w1pin-clay: #a3472b; --w1pin-box: 620px;
    height: var(--w1pin-box); overflow-y: auto; overflow-x: hidden; position: relative; background: var(--w1pin-bg); color: var(--w1pin-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; scrollbar-width: thin; }
  /* To pin against the page instead: delete height and overflow above, set --w1pin-box: 100vh, and in the script use window scroll. */
  .w1pin:focus-visible { outline: 3px solid var(--w1pin-clay); outline-offset: -3px; }
  .w1pin-hint { position: sticky; top: 0; height: 0; z-index: 3; display: flex; align-items: flex-start; justify-content: flex-end; pointer-events: none; }
  .w1pin-hint span { margin: 12px 12px 0 0; padding: 5px 12px; border-radius: 999px; background: rgba(45,31,23,.82); color: #f5ece2;
    font-size: 12px; letter-spacing: .04em; transition: opacity .5s ease; }
  .w1pin[data-touched] .w1pin-hint span { opacity: 0; }
  .w1pin-track { height: calc(var(--w1pin-box) * 4); view-timeline: --w1pin-t block; }
  .w1pin-stage { position: sticky; top: 0; height: var(--w1pin-box); box-sizing: border-box; max-width: 64rem; margin: 0 auto;
    padding: 56px 20px 40px; display: flex; flex-direction: column; }
  .w1pin-eyebrow { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: var(--w1pin-clay); }
  .w1pin-h { margin: 12px 0 0; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(1.9rem, 4.4vw, 2.9rem); line-height: 1.1; letter-spacing: -.015em; }
  .w1pin-rail { margin-top: 24px; height: 3px; border-radius: 3px; background: #e2d2c2; overflow: hidden; }
  .w1pin-fill { display: block; height: 100%; background: var(--w1pin-clay); transform-origin: 0 50%; transform: scaleX(.25); }
  .w1pin-steps { list-style: none; margin: 0; padding: 0; flex: 1; display: grid; align-items: center; }
  .w1pin-s { grid-area: 1 / 1; display: grid; grid-template-columns: auto 1fr; gap: 0 28px; align-items: center; }
  .w1pin-s + .w1pin-s { opacity: 0; }
  .w1pin-n { font-family: Georgia, serif; font-size: clamp(5rem, 16vw, 11rem); line-height: .9; color: var(--w1pin-clay); letter-spacing: -.04em; }
  .w1pin-when { margin: 0; font-size: .8125rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #6e5646; }
  .w1pin-s h3 { margin: 6px 0 0; font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 600; }
  .w1pin-s h3 + p { margin: 10px 0 0; max-width: 30rem; font-size: 1.0625rem; line-height: 1.6; color: #4d3a2e; }
  .w1pin-end { max-width: 64rem; margin: 0 auto; padding: 56px 20px 72px; display: flex; flex-wrap: wrap; gap: 16px 24px; align-items: center; justify-content: space-between; }
  .w1pin-end p { margin: 0; font-size: 1.0625rem; }
  .w1pin-btn { display: inline-flex; min-height: 46px; align-items: center; padding: 0 22px; border-radius: 999px; background: var(--w1pin-clay);
    color: #fff; font-weight: 600; font-size: .9375rem; text-decoration: none; }
  .w1pin-btn:hover { background: #8a3a22; }
  .w1pin-btn:focus-visible { outline: 3px solid var(--w1pin-ink); outline-offset: 3px; }
  @media (max-width: 600px) { .w1pin-s { grid-template-columns: 1fr; } .w1pin-n { font-size: 4.5rem; margin-bottom: 8px; } }
  @media (min-width: 720px) { .w1pin-stage, .w1pin-end { padding-left: 40px; padding-right: 40px; } }
  /* Each step holds for a quarter of the pinned scroll, with a short cross-fade between. */
  @keyframes w1pin-s1 { 0%, 21% { opacity: 1; transform: none; } 24%, 100% { opacity: 0; transform: translateY(-18px); } }
  @keyframes w1pin-s2 { 0%, 24% { opacity: 0; transform: translateY(18px); } 27%, 46% { opacity: 1; transform: none; } 49%, 100% { opacity: 0; transform: translateY(-18px); } }
  @keyframes w1pin-s3 { 0%, 49% { opacity: 0; transform: translateY(18px); } 52%, 71% { opacity: 1; transform: none; } 74%, 100% { opacity: 0; transform: translateY(-18px); } }
  @keyframes w1pin-s4 { 0%, 74% { opacity: 0; transform: translateY(18px); } 77%, 100% { opacity: 1; transform: none; } }
  @keyframes w1pin-grow { from { transform: scaleX(.25); } to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    .w1pin:not([data-fb]) .w1pin-s { animation: w1pin-s1 linear both; animation-timeline: --w1pin-t; animation-range: contain 0% contain 100%; }
    .w1pin:not([data-fb]) .w1pin-s:nth-child(2) { animation-name: w1pin-s2; }
    .w1pin:not([data-fb]) .w1pin-s:nth-child(3) { animation-name: w1pin-s3; }
    .w1pin:not([data-fb]) .w1pin-s:nth-child(4) { animation-name: w1pin-s4; }
    .w1pin:not([data-fb]) .w1pin-fill { animation: w1pin-grow linear both; animation-timeline: --w1pin-t; animation-range: contain 0% contain 100%; }
  }
  /* Fallback set by the script: data-step picks the visible step. */
  .w1pin[data-fb] .w1pin-s { opacity: 0; transform: translateY(18px); transition: opacity .45s ease, transform .6s cubic-bezier(.2,.7,.2,1); }
  .w1pin[data-step="1"] .w1pin-s:nth-child(1), .w1pin[data-step="2"] .w1pin-s:nth-child(2),
  .w1pin[data-step="3"] .w1pin-s:nth-child(3), .w1pin[data-step="4"] .w1pin-s:nth-child(4) { opacity: 1; transform: none; }
  .w1pin[data-fb] .w1pin-fill { transition: transform .3s ease; }
  /* Reduced motion: no pinning, the four steps read as a plain list. */
  @media (prefers-reduced-motion: reduce) {
    .w1pin-track { height: auto; }
    .w1pin-stage { position: static; height: auto; }
    .w1pin-rail { display: none; }
    .w1pin-steps { display: block; margin-top: 24px; }
    .w1pin .w1pin-s, .w1pin[data-fb] .w1pin-s { animation: none !important; opacity: 1; transform: none; transition: none; padding: 20px 0; border-top: 1px solid #e2d2c2; }
    .w1pin-n { font-size: 3rem; }
  }
`;

export default function PinnedPanelStepsCrossfadeOnScroll() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    
      var off = [];
      var SPEED = 90; // demo scroll in px per second before anyone touches the box; 0 turns it off
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
    
      // Without scroll-driven animations: work out the step from how far the track has scrolled.
      if (!reduce && !native) {
        root.setAttribute("data-fb", "");
        var track = root.querySelector(".w1pin-track"), fill = root.querySelector(".w1pin-fill"), f2 = 0;
        var draw = function () {
          f2 = 0;
          var span = track.offsetHeight - root.clientHeight;
          var p = Math.min(1, Math.max(0, (root.scrollTop - track.offsetTop) / span));
          root.setAttribute("data-step", String(Math.min(4, 1 + Math.floor(p * 4))));
          fill.style.transform = "scaleX(" + (0.25 + 0.75 * p).toFixed(3) + ")";
        };
        on(root, "scroll", function () { if (!f2) f2 = requestAnimationFrame(draw); });
        off.push(function () { cancelAnimationFrame(f2); });
        draw();
      }
    return () => off.forEach((f: any) => f());
  }, [prefersReduced]);

  return (
    <section className="w1pin" data-w1pin="" ref={rootRef} tabIndex={0} aria-label="How a Marrow and Rye loaf is made, scrollable">
    <style>{STYLES}</style>
      <div className="w1pin-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w1pin-track">
        <div className="w1pin-stage">
          <div className="w1pin-head">
            <p className="w1pin-eyebrow">Marrow &amp; Rye Bakery</p>
            <h2 className="w1pin-h">How a loaf gets made</h2>
            <div className="w1pin-rail" aria-hidden="true"><span className="w1pin-fill"></span></div>
          </div>
          <ol className="w1pin-steps">
            <li className="w1pin-s"><span className="w1pin-n" aria-hidden="true">01</span><div><p className="w1pin-when">Day one, evening</p><h3>Mix</h3><p>Stoneground flour, warm water and a spoon of last night's starter, mixed by hand and then left alone for an hour.</p></div></li>
            <li className="w1pin-s"><span className="w1pin-n" aria-hidden="true">02</span><div><p className="w1pin-when">Overnight</p><h3>Ferment</h3><p>A few sets of folds in the first hours, then the dough rests in the cool room while the yeast does its slow work.</p></div></li>
            <li className="w1pin-s"><span className="w1pin-n" aria-hidden="true">03</span><div><p className="w1pin-when">Day two, before dawn</p><h3>Shape</h3><p>Divided, rested and shaped again with tension on the skin, then laid seam up in linen-lined baskets.</p></div></li>
            <li className="w1pin-s"><span className="w1pin-n" aria-hidden="true">04</span><div><p className="w1pin-when">Day two, morning</p><h3>Bake</h3><p>Scored and baked hot on the stone deck with steam, then left on the racks to cool before anyone slices it.</p></div></li>
          </ol>
        </div>
      </div>
      <div className="w1pin-end">
        <p>Loaves are on the counter from eight, until they run out.</p>
        <a href="#" className="w1pin-btn">Reserve a loaf</a>
      </div>
    </section>
  );
}

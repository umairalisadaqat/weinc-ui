import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version; the comments in CSS name the values to change.
const STYLES = `
  /* Change these: --w1zom-from (starting zoom), --w1zom-bg, --w1zom-ink, --w1zom-accent,
     and animation-range on .w1zom-img (where in the box the zoom finishes). */
  .w1zom { --w1zom-from: 1.15; --w1zom-bg: #efe7da; --w1zom-ink: #2b241d; --w1zom-accent: #7c5532;
    height: 620px; overflow-y: auto; overflow-x: hidden; position: relative; background: var(--w1zom-bg); color: var(--w1zom-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; scrollbar-width: thin; }
  /* To use page scroll: delete height and overflow above and set root: null in the script. */
  .w1zom:focus-visible { outline: 3px solid var(--w1zom-accent); outline-offset: -3px; }
  .w1zom-hint { position: sticky; top: 0; height: 0; z-index: 3; display: flex; align-items: flex-start; justify-content: flex-end; pointer-events: none; }
  .w1zom-hint span { margin: 12px 12px 0 0; padding: 5px 12px; border-radius: 999px; background: rgba(43,36,29,.82); color: #f6f0e6;
    font-size: 12px; letter-spacing: .04em; transition: opacity .5s ease; }
  .w1zom[data-touched] .w1zom-hint span { opacity: 0; }
  .w1zom-wrap { max-width: 66rem; margin: 0 auto; padding: 64px 20px 88px; }
  .w1zom-eyebrow { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: var(--w1zom-accent); }
  .w1zom-h { margin: 14px 0 0; max-width: 38rem; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(1.9rem, 4.6vw, 3.1rem); line-height: 1.1; letter-spacing: -.015em; }
  .w1zom-lead { margin: 16px 0 0; max-width: 34rem; font-size: 1.0625rem; line-height: 1.65; color: #574a3c; }
  .w1zom-fig { margin: 40px 0 0; }
  .w1zom-frame { overflow: hidden; border-radius: 18px; aspect-ratio: 3 / 2; background: #d8cbb6; box-shadow: 0 30px 60px -30px rgba(60,40,20,.45); }
  .w1zom-img { display: block; width: 100%; height: 100%; object-fit: cover; transform-origin: 50% 60%; }
  .w1zom-cap { margin: 14px 0 0; font-size: .875rem; color: #6a5b4a; }
  .w1zom-cols { margin-top: 48px; display: grid; gap: 28px; }
  .w1zom-cols h3 { margin: 0; font-size: 1.125rem; font-weight: 600; }
  .w1zom-cols p { margin: 8px 0 0; font-size: .96875rem; line-height: 1.65; color: #574a3c; }
  .w1zom-btn { margin-top: 36px; display: inline-flex; min-height: 46px; align-items: center; padding: 0 22px; border-radius: 10px;
    background: var(--w1zom-ink); color: #f6f0e6; font-weight: 600; font-size: .9375rem; text-decoration: none; }
  .w1zom-btn:hover { background: #45392c; }
  .w1zom-btn:focus-visible { outline: 3px solid var(--w1zom-accent); outline-offset: 3px; }
  @media (min-width: 720px) { .w1zom-wrap { padding: 80px 40px 104px; } .w1zom-cols { grid-template-columns: 1fr 1fr; gap: 48px; } }
  @keyframes w1zom-zoom { from { transform: scale(var(--w1zom-from)); } to { transform: none; } }
  @keyframes w1zom-cap { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  @supports (animation-timeline: view()) {
    .w1zom-frame { view-timeline: --w1zom-v block; }
    .w1zom:not([data-fb]) .w1zom-img { animation: w1zom-zoom linear both; animation-timeline: --w1zom-v; animation-range: entry 0% cover 55%; }
    .w1zom:not([data-fb]) .w1zom-cap { animation: w1zom-cap linear both; animation-timeline: --w1zom-v; animation-range: cover 35% cover 55%; }
  }
  /* Fallback set by the script: the zoom is scrubbed from the scroll position. */
  @media (prefers-reduced-motion: reduce) {
    .w1zom .w1zom-img, .w1zom .w1zom-cap { animation: none !important; transform: none !important; opacity: 1; }
  }
`;

export default function PhotoZoomsOutAsItScrollsIn() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    
      var off = [];
      var SPEED = 34; // demo scroll in px per second before anyone touches the box; 0 turns it off
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
    
      // Without scroll-driven animations: scrub the zoom from the frame's position, once per frame at most.
      if (!reduce && !native) {
        root.setAttribute("data-fb", "");
        var FROM = 1.15; // keep in step with --w1zom-from
        var frame2 = 0;
        var fr = root.querySelector(".w1zom-frame"), img = root.querySelector(".w1zom-img");
        var draw = function () {
          frame2 = 0;
          var a = root.getBoundingClientRect(), b = fr.getBoundingClientRect();
          var p = Math.min(1, Math.max(0, (a.bottom - b.top) / (0.55 * (a.height + b.height))));
          img.style.transform = "scale(" + (FROM - (FROM - 1) * p).toFixed(4) + ")";
        };
        on(root, "scroll", function () { if (!frame2) frame2 = requestAnimationFrame(draw); });
        off.push(function () { cancelAnimationFrame(frame2); });
        draw();
      }
    return () => off.forEach((f: any) => f());
  }, [prefersReduced]);

  return (
    <section className="w1zom" data-w1zom="" ref={rootRef} tabIndex={0} aria-label="Fenna Clay studio, scrollable">
    <style>{STYLES}</style>
      <div className="w1zom-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w1zom-wrap">
        <p className="w1zom-eyebrow">Fenna Clay · Pottery studio</p>
        <h2 className="w1zom-h">Thrown, trimmed and fired in one small room.</h2>
        <p className="w1zom-lead">Every mug and bowl on our shelves passes through the same two hands. Come for an evening class or pick a piece straight off the drying rack.</p>
        <figure className="w1zom-fig">
          <div className="w1zom-frame">
            <img className="w1zom-img" src="https://images.pexels.com/photos/37827282/pexels-photo-37827282.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="A potter arranging glazed bowls and cups on wooden shelves in a sunlit studio" loading="eager" width="1600" height="1067" />
          </div>
          <figcaption className="w1zom-cap">The glaze shelf on a Thursday morning, after the second firing.</figcaption>
        </figure>
        <div className="w1zom-cols">
          <div>
            <h3>Evening wheel classes</h3>
            <p>Six people around three wheels, clay and firing included. You leave with two pieces of your own after the glaze week.</p>
          </div>
          <div>
            <h3>The studio shelf</h3>
            <p>Seconds and one-offs go on the front shelf every Saturday. When a piece is gone, it is gone.</p>
          </div>
        </div>
        <a href="#" className="w1zom-btn">See class dates</a>
      </div>
    </section>
  );
}

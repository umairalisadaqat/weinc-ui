import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version; the comments in CSS name the values to change.
const STYLES = `
  /* Change these: --w1alt-push (sideways start distance), --w1alt-tilt (start angle), --w1alt-bg, --w1alt-card, --w1alt-accent. */
  .w1alt { --w1alt-push: 90px; --w1alt-tilt: 2.5deg; --w1alt-bg: #10213a; --w1alt-card: #f3ead9; --w1alt-accent: #b8562f;
    height: 620px; overflow-y: auto; overflow-x: hidden; position: relative; background: var(--w1alt-bg); color: #eef1f6;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; scrollbar-width: thin; scrollbar-color: #3a4d6b transparent; }
  /* To use page scroll: delete height and overflow above and set root: null in the script. */
  .w1alt:focus-visible { outline: 3px solid #f0b48f; outline-offset: -3px; }
  .w1alt-hint { position: sticky; top: 0; height: 0; z-index: 3; display: flex; align-items: flex-start; justify-content: flex-end; pointer-events: none; }
  .w1alt-hint span { margin: 12px 12px 0 0; padding: 5px 12px; border-radius: 999px; background: rgba(238,241,246,.14); color: #eef1f6;
    font-size: 12px; letter-spacing: .04em; transition: opacity .5s ease; }
  .w1alt[data-touched] .w1alt-hint span { opacity: 0; }
  .w1alt-wrap { max-width: 60rem; margin: 0 auto; padding: 64px 20px 80px; }
  .w1alt-eyebrow { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: #f0b48f; }
  .w1alt-h { margin: 14px 0 0; max-width: 34rem; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(1.9rem, 4.4vw, 2.9rem); line-height: 1.1; letter-spacing: -.015em; }
  .w1alt-lead { margin: 14px 0 0; max-width: 32rem; font-size: 1.0625rem; line-height: 1.6; color: #c4cede; }
  .w1alt-list { list-style: none; margin: 40px 0 0; padding: 0; display: grid; gap: 22px; }
  .w1alt-card { --dir: -1; box-sizing: border-box; width: 100%; padding: 24px 24px 26px; border-radius: 16px; background: var(--w1alt-card); color: #1d2534;
    box-shadow: 0 24px 40px -24px rgba(0,0,0,.6); }
  .w1alt-card:nth-child(even) { --dir: 1; justify-self: end; }
  .w1alt-meta { margin: 0; font-size: .8125rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #9a4423; }
  .w1alt-card h3 { margin: 8px 0 0; font-size: 1.375rem; font-weight: 600; }
  .w1alt-card h3 + p { margin: 8px 0 0; font-size: 1rem; line-height: 1.6; color: #3b4456; }
  .w1alt-btn { margin-top: 36px; display: inline-flex; min-height: 46px; align-items: center; padding: 0 22px; border-radius: 999px;
    background: var(--w1alt-accent); color: #fff; font-weight: 600; font-size: .9375rem; text-decoration: none; }
  .w1alt-btn:hover { background: #a14a27; }
  .w1alt-btn:focus-visible { outline: 3px solid #f3ead9; outline-offset: 3px; }
  @media (min-width: 720px) { .w1alt-wrap { padding: 80px 40px 96px; } .w1alt-card { width: 60%; padding: 28px 30px 30px; } }
  @media (max-width: 719px) { .w1alt { --w1alt-push: 44px; } }
  @keyframes w1alt-in { from { opacity: 0; transform: translateX(calc(var(--dir) * var(--w1alt-push))) rotate(calc(var(--dir) * var(--w1alt-tilt))); } to { opacity: 1; transform: none; } }
  @supports (animation-timeline: view()) {
    .w1alt:not([data-fb]) .w1alt-card { animation: w1alt-in linear both; animation-timeline: view(); animation-range: entry 0% cover 30%; }
  }
  /* Fallback set by the script: each card slides in once. */
  .w1alt[data-fb] .w1alt-card { opacity: 0; transform: translateX(calc(var(--dir) * var(--w1alt-push))) rotate(calc(var(--dir) * var(--w1alt-tilt)));
    transition: opacity .6s ease, transform .9s cubic-bezier(.2,.75,.2,1); }
  .w1alt[data-fb] .w1alt-card.w1alt-in { opacity: 1; transform: none; }
  @media (prefers-reduced-motion: reduce) {
    .w1alt .w1alt-card, .w1alt[data-fb] .w1alt-card { animation: none !important; opacity: 1; transform: none; transition: none; }
  }
`;

export default function CardsSlideInAlternatingSidesOnScroll() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    
      var off = [];
      var SPEED = 40; // demo scroll in px per second before anyone touches the box; 0 turns it off
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
    
      // Without scroll-driven animations: slide each card in once as it enters the box.
      if (!reduce && !native) {
        root.setAttribute("data-fb", "");
        var io = keep(new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("w1alt-in"); io.unobserve(e.target); } });
        }, { root: root, rootMargin: "0px 0px -10% 0px" }));
        root.querySelectorAll(".w1alt-card").forEach(function (el) { io.observe(el); });
      }
    return () => off.forEach((f: any) => f());
  }, [prefersReduced]);

  return (
    <section className="w1alt" data-w1alt="" ref={rootRef} tabIndex={0} aria-label="Ridgeway Guiding trips, scrollable">
    <style>{STYLES}</style>
      <div className="w1alt-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w1alt-wrap">
        <p className="w1alt-eyebrow">Ridgeway Guiding</p>
        <h2 className="w1alt-h">Five ways onto the high ground this season</h2>
        <p className="w1alt-lead">Small groups, a qualified mountain leader, and routes chosen the evening before from the forecast.</p>
        <ol className="w1alt-list">
          <li className="w1alt-card"><p className="w1alt-meta">One day · Easy</p><h3>Valley to the tarn</h3><p>A steady walk up the old miners' track to a high lake, lunch on the shore and back down by mid afternoon.</p></li>
          <li className="w1alt-card"><p className="w1alt-meta">One day · Moderate</p><h3>The long ridge</h3><p>Four summits linked by a grassy spine, with wide views out to the coast when the cloud lifts.</p></li>
          <li className="w1alt-card"><p className="w1alt-meta">Two days · Moderate</p><h3>Bothy overnight</h3><p>Walk in with light packs, sleep in a stone shelter by the river and cross the pass at first light.</p></li>
          <li className="w1alt-card"><p className="w1alt-meta">One day · Hard</p><h3>Scramble day</h3><p>Hands-on rock on a classic grade one line, with a rope in the leader's bag and helmets provided.</p></li>
          <li className="w1alt-card"><p className="w1alt-meta">Half day · Easy</p><h3>Map and compass</h3><p>Learn to read contours and walk a bearing in the low hills, so the next trip can be your own.</p></li>
        </ol>
        <a href="#" className="w1alt-btn">Check dates and places</a>
      </div>
    </section>
  );
}

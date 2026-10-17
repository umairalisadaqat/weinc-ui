import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version; the comments in CSS name the values to change.
const STYLES = `
  /* Change these: --w1msk-bg, --w1msk-ink, --w1msk-gold (accent), and --k on .w1msk-m:nth-child (gap between lines). */
  .w1msk { --w1msk-bg: #15181d; --w1msk-ink: #ece6da; --w1msk-gold: #c9a46a;
    height: 620px; overflow-y: auto; overflow-x: hidden; position: relative; background: var(--w1msk-bg); color: var(--w1msk-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; scrollbar-width: thin; scrollbar-color: #444 transparent; }
  /* To use page scroll: delete height and overflow above and set root: null in the script. */
  .w1msk:focus-visible { outline: 3px solid var(--w1msk-gold); outline-offset: -3px; }
  .w1msk-hint { position: sticky; top: 0; height: 0; z-index: 3; display: flex; align-items: flex-start; justify-content: flex-end; pointer-events: none; }
  .w1msk-hint span { margin: 12px 12px 0 0; padding: 5px 12px; border-radius: 999px; background: rgba(236,230,218,.14); color: var(--w1msk-ink);
    font-size: 12px; letter-spacing: .04em; transition: opacity .5s ease; }
  .w1msk[data-touched] .w1msk-hint span { opacity: 0; }
  .w1msk-wrap { max-width: 60rem; margin: 0 auto; padding: 72px 20px 120px; }
  .w1msk-eyebrow { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; color: var(--w1msk-gold); }
  .w1msk-block { padding: 36px 0 120px; }
  .w1msk-block + .w1msk-block { border-top: 1px solid rgba(236,230,218,.14); padding-top: 72px; }
  .w1msk-h { margin: 0; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(2.3rem, 7vw, 5rem); line-height: 1.02; letter-spacing: -.025em; }
  .w1msk-m { display: block; overflow: hidden; padding-bottom: .1em; margin-bottom: -.1em; }
  .w1msk-l { display: block; }
  .w1msk-cap { margin: 28px 0 0; max-width: 28rem; font-size: 1rem; line-height: 1.65; color: #b9b2a5; }
  .w1msk-btn { display: inline-flex; min-height: 48px; align-items: center; padding: 0 24px; border-radius: 999px; background: var(--w1msk-ink);
    color: var(--w1msk-bg); font-weight: 600; font-size: .9375rem; text-decoration: none; }
  .w1msk-btn:hover { background: #fff; }
  .w1msk-btn:focus-visible { outline: 3px solid var(--w1msk-gold); outline-offset: 3px; }
  .w1msk-m:nth-child(2) { --k: 5%; --kd: 110ms; }
  .w1msk-m:nth-child(3) { --k: 10%; --kd: 220ms; }
  @keyframes w1msk-rise { from { transform: translateY(105%); } to { transform: none; } }
  @keyframes w1msk-fade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  @supports (animation-timeline: view()) {
    .w1msk-m { view-timeline: --w1msk-v block; }
    .w1msk:not([data-fb]) .w1msk-l { animation: w1msk-rise linear both; animation-timeline: --w1msk-v;
      animation-range: cover calc(var(--k, 0%) + 4%) cover calc(var(--k, 0%) + 26%); }
    .w1msk:not([data-fb]) .w1msk-cap { animation: w1msk-fade linear both; animation-timeline: view(); animation-range: cover 6% cover 30%; }
  }
  /* Fallback set by the script: lines rise once when their heading enters. */
  .w1msk[data-fb] .w1msk-l { transform: translateY(105%); transition: transform .9s cubic-bezier(.2,.75,.15,1); transition-delay: var(--kd, 0ms); }
  .w1msk[data-fb] .w1msk-cap { opacity: 0; transition: opacity .8s ease .35s; }
  .w1msk[data-fb] .w1msk-in .w1msk-l { transform: none; }
  .w1msk[data-fb] .w1msk-in .w1msk-cap { opacity: 1; }
  @media (min-width: 720px) { .w1msk-wrap { padding: 88px 48px 140px; } }
  @media (prefers-reduced-motion: reduce) {
    .w1msk .w1msk-l, .w1msk .w1msk-cap, .w1msk[data-fb] .w1msk-l, .w1msk[data-fb] .w1msk-cap { animation: none !important; transform: none; opacity: 1; transition: none; }
  }
`;

export default function HeadlineLinesRiseFromMasksOnScroll() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    
      var off = [];
      var SPEED = 30; // demo scroll in px per second before anyone touches the box; 0 turns it off
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
    
      // Without scroll-driven animations: reveal each statement once as it enters.
      if (!reduce && !native) {
        root.setAttribute("data-fb", "");
        var io = keep(new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("w1msk-in"); io.unobserve(e.target); } });
        }, { root: root, rootMargin: "0px 0px -12% 0px" }));
        root.querySelectorAll(".w1msk-block").forEach(function (el) { io.observe(el); });
      }
    return () => off.forEach((f: any) => f());
  }, [prefersReduced]);

  return (
    <section className="w1msk" data-w1msk="" ref={rootRef} tabIndex={0} aria-label="Ostra Studio principles, scrollable">
    <style>{STYLES}</style>
      <div className="w1msk-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w1msk-wrap">
        <p className="w1msk-eyebrow">Ostra Studio · Architects</p>
        <div className="w1msk-block">
          <h2 className="w1msk-h"><span className="w1msk-m"><span className="w1msk-l">We draw houses</span></span><span className="w1msk-m"><span className="w1msk-l">that grow better</span></span><span className="w1msk-m"><span className="w1msk-l">with age.</span></span></h2>
          <p className="w1msk-cap">Lime plaster, oiled oak and stone that weathers into its place. We pick materials for how they look in thirty winters, not on handover day.</p>
        </div>
        <div className="w1msk-block">
          <h2 className="w1msk-h"><span className="w1msk-m"><span className="w1msk-l">Light comes first,</span></span><span className="w1msk-m"><span className="w1msk-l">the walls follow,</span></span><span className="w1msk-m"><span className="w1msk-l">the rest after.</span></span></h2>
          <p className="w1msk-cap">Every project starts with a sun study of the plot, hour by hour, before a single room is placed on paper.</p>
        </div>
        <div className="w1msk-block">
          <h2 className="w1msk-h"><span className="w1msk-m"><span className="w1msk-l">Small rooms,</span></span><span className="w1msk-m"><span className="w1msk-l">long views,</span></span><span className="w1msk-m"><span className="w1msk-l">honest stone.</span></span></h2>
          <p className="w1msk-cap">We take on four houses a year so each one gets the same two people from first sketch to last snag.</p>
        </div>
        <a href="#" className="w1msk-btn">Start a conversation</a>
      </div>
    </section>
  );
}

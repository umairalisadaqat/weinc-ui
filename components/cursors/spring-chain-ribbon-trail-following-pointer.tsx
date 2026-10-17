import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version. The CSS comments name the values to change.
const STYLES = `
  /* Change these: --w7rbn-bg, --w7rbn-ink, --w7rbn-rope (ribbon colour). Stiffness, damping and length are in the script. */
  .w7rbn { --w7rbn-bg: #10213a; --w7rbn-ink: #eef1f4; --w7rbn-rope: #e2c79a;
    position: relative; height: 560px; overflow: hidden; background: radial-gradient(120% 90% at 85% 10%, #1a3254 0%, var(--w7rbn-bg) 60%); color: var(--w7rbn-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; touch-action: pan-y; }
  .w7rbn-rope { position: absolute; inset: 0; pointer-events: none; }
  .w7rbn-rope i { position: absolute; left: 0; top: 0; width: 100px; border-radius: 99px; background: var(--w7rbn-rope); transform-origin: 0 50%; will-change: transform; }
  .w7rbn-body { position: relative; width: 100%; max-width: 64rem; margin: 0 auto; padding: 32px 20px; }
  .w7rbn-eye { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: var(--w7rbn-rope); }
  .w7rbn-h { margin: 14px 0 0; max-width: 15ch; font-size: clamp(2.3rem, 6.2vw, 4.4rem); font-weight: 600; line-height: 1.02; letter-spacing: -.03em; }
  .w7rbn-p { margin: 20px 0 0; max-width: 32rem; font-size: 16px; line-height: 1.65; color: #c4ccd8; }
  .w7rbn-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }
  .w7rbn-btn, .w7rbn-ghost { display: inline-flex; align-items: center; min-height: 48px; padding: 0 24px; border-radius: 6px; font-weight: 600; font-size: 15px; text-decoration: none; }
  .w7rbn-btn { background: var(--w7rbn-rope); color: #1b1408; }
  .w7rbn-btn:hover { background: #efd8b0; }
  .w7rbn-ghost { color: var(--w7rbn-ink); border: 1px solid rgba(238,241,244,.35); }
  .w7rbn-ghost:hover { border-color: var(--w7rbn-ink); }
  .w7rbn-btn:focus-visible, .w7rbn-ghost:focus-visible { outline: 3px solid var(--w7rbn-ink); outline-offset: 3px; }
  .w7rbn-tags { display: flex; flex-wrap: wrap; gap: 8px 22px; margin: 36px 0 0; padding: 0; list-style: none; font-size: 13px; letter-spacing: .06em; color: #9fb0c5; }
  @media (min-width: 720px) { .w7rbn-body { padding: 40px 48px; } }
  @media (prefers-reduced-motion: reduce) { .w7rbn-rope i { will-change: auto; } }
`;

export default function SpringChainRibbonTrailFollowingPointer() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    const off: Array<() => void> = [];
    
      var N = 36, STIFF = .08, LINK = .3, DAMP = .82, IDLE_AFTER = 1800; // links, head pull, pull between links, motion kept per frame, ms before the demo resumes
      var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      var layer = root.querySelector(".w7rbn-rope"), segs = [], P = [];
      for (var i = 0; i < N; i++) {
        P.push({ x: 0, y: 0, vx: 0, vy: 0 });
        if (!i) continue;
        var s = document.createElement("i"), f = 1 - i / N;
        s.style.height = (3 + 13 * f).toFixed(1) + "px";
        s.style.marginTop = -(1.5 + 6.5 * f).toFixed(1) + "px";
        s.style.opacity = (.2 + .8 * f).toFixed(2);
        layer.appendChild(s); segs.push(s);
      }
      off.push(function () { layer.textContent = ""; });
      function path(t) { var w = root.clientWidth, h = root.clientHeight; return [w * (.62 + .28 * Math.sin(t * .0011)), h * (.5 + .32 * Math.sin(t * .0022))]; }
      function draw() {
        for (var i = 1; i < N; i++) {
          var a = P[i - 1], b = P[i], dx = a.x - b.x, dy = a.y - b.y;
          segs[i - 1].style.transform = "translate(" + b.x.toFixed(1) + "px," + b.y.toFixed(1) + "px) rotate(" + Math.atan2(dy, dx).toFixed(3) + "rad) scaleX(" + ((Math.hypot(dx, dy) + 2) / 100).toFixed(3) + ")";
        }
      }
      if (reduce) {
        // A still, gently curved ribbon drawn once.
        for (var r = 0; r < N; r++) { var w = root.clientWidth; P[r].x = w * .9 - r * w * .018; P[r].y = root.clientHeight * (.3 + .12 * Math.sin(r / 4)); }
        draw(); return;
      }
      var tx = 0, ty = 0, real = 0, raf = 0, seen = true;
      var s0t = performance.now(), s0 = path(s0t);
      P.forEach(function (p) { p.x = s0[0]; p.y = s0[1]; });
      function sim(t) {
        if (!real || t - real > IDLE_AFTER) { var q = path(t); tx = q[0]; ty = q[1]; }
        var h = P[0];
        h.vx = (h.vx + (tx - h.x) * STIFF) * DAMP; h.vy = (h.vy + (ty - h.y) * STIFF) * DAMP;
        h.x += h.vx; h.y += h.vy;
        // Every later link eases toward the one ahead of it, so the chain trails and swings behind the head.
        for (var i = 1; i < N; i++) { P[i].x += (P[i - 1].x - P[i].x) * LINK; P[i].y += (P[i - 1].y - P[i].y) * LINK; }
      }
      function tick(t) { raf = requestAnimationFrame(tick); sim(t); draw(); }
      // Run the demo for a second up front so the ribbon is already flowing in the first frame.
      for (var j = 70; j > 0; j--) sim(s0t - j * 16.7);
      draw();
      function aim(x, y) { var b = root.getBoundingClientRect(); tx = x - b.left; ty = y - b.top; real = performance.now(); }
      function move(e) { aim(e.clientX, e.clientY); }
      function focus(e) { var r = e.target.getBoundingClientRect(); aim(r.left + r.width / 2, r.bottom + 16); real += 4000; }
      function leave() { real = 0; }
      root.addEventListener("pointermove", move);
      root.addEventListener("pointerdown", move);
      root.addEventListener("pointerleave", leave);
      root.addEventListener("focusin", focus);
      off.push(function () { root.removeEventListener("pointermove", move); root.removeEventListener("pointerdown", move); root.removeEventListener("pointerleave", leave); root.removeEventListener("focusin", focus); });
      function play() { if (!raf && seen) raf = requestAnimationFrame(tick); }
      function stop() { cancelAnimationFrame(raf); raf = 0; }
      var io = new IntersectionObserver(function (e) { seen = e[0].isIntersecting; if (seen) play(); else stop(); });
      io.observe(root);
      off.push(stop, function () { io.disconnect(); });
      play();
    return () => off.forEach((f) => f());
  }, [prefersReduced]);

  return (
    <section className="w7rbn" data-w7rbn="" ref={rootRef} aria-label="Tidewater Sail Loft">
      <style>{STYLES}</style>
      <div className="w7rbn-rope" aria-hidden="true"></div>
      <div className="w7rbn-body">
        <p className="w7rbn-eye">Tidewater Sail Loft</p>
        <h2 className="w7rbn-h">Sails cut for the water you actually sail</h2>
        <p className="w7rbn-p">We measure your boat at its mooring, ask where you go and how hard you push, then cut and stitch each panel in our loft above the harbour chandlery.</p>
        <div className="w7rbn-row">
          <a className="w7rbn-btn" href="#">Ask for a quote</a>
          <a className="w7rbn-ghost" href="#">Book a repair</a>
        </div>
        <ul className="w7rbn-tags">
          <li>Cruising dacron</li><li>Racing laminates</li><li>Winter repairs</li>
        </ul>
      </div>
    </section>
  );
}

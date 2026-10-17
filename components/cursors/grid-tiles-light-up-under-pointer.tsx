import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version. The CSS comments name the values to change.
const STYLES = `
  /* Change these: --w7til-size (tile size), --w7til-glow (light colour), --w7til-bg, --w7til-ink. Reach and brightness are in the script. */
  .w7til { --w7til-size: 56px; --w7til-glow: #f2d39d; --w7til-bg: #141518; --w7til-ink: #f1ede4;
    position: relative; height: 560px; overflow: hidden; background: var(--w7til-bg); color: var(--w7til-ink); touch-action: pan-y;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; }
  .w7til-grid { position: absolute; inset: 0; pointer-events: none;
    background-image: linear-gradient(rgba(241,237,228,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(241,237,228,.06) 1px, transparent 1px);
    background-size: var(--w7til-size) var(--w7til-size); }
  .w7til-grid i { position: absolute; left: 0; top: 0; width: calc(var(--w7til-size) - 1px); height: calc(var(--w7til-size) - 1px); margin: 1px 0 0 1px; background: var(--w7til-glow); opacity: 0; }
  .w7til-body { position: relative; max-width: 42rem; padding: 32px 20px; text-align: center; }
  .w7til-eye { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: var(--w7til-glow); }
  .w7til-h { margin: 14px 0 0; font-size: clamp(2.2rem, 5.8vw, 4rem); font-weight: 600; line-height: 1.04; letter-spacing: -.03em; text-shadow: 0 2px 24px rgba(20,21,24,.9); }
  .w7til-p { margin: 18px auto 0; max-width: 30rem; font-size: 16px; line-height: 1.65; color: #cfc9bd; text-shadow: 0 1px 12px rgba(20,21,24,.95); }
  .w7til-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 30px; }
  .w7til-btn, .w7til-ghost { display: inline-flex; align-items: center; min-height: 48px; padding: 0 24px; border-radius: 999px; font-weight: 600; font-size: 15px; text-decoration: none; }
  .w7til-btn { background: var(--w7til-glow); color: #1d1608; }
  .w7til-btn:hover { background: #f8e2bb; }
  .w7til-ghost { background: rgba(20,21,24,.7); color: var(--w7til-ink); border: 1px solid rgba(241,237,228,.3); }
  .w7til-ghost:hover { border-color: var(--w7til-ink); }
  .w7til-btn:focus-visible, .w7til-ghost:focus-visible { outline: 3px solid var(--w7til-ink); outline-offset: 3px; }
`;

export default function GridTilesLightUpUnderPointer() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    const off: Array<() => void> = [];
    
      var REACH = 150, MAX = .42, FADE = .05, IDLE_AFTER = 1800; // px radius of light, brightest tile, fade-out speed per frame, ms before the demo resumes
      var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      var grid = root.querySelector(".w7til-grid"), tiles = [], cx = [], cy = [], cur = [];
      var tx = -999, ty = -999, real = 0, raf = 0, seen = true;
      function build() {
        grid.textContent = ""; tiles = []; cx = []; cy = []; cur = [];
        var S = parseFloat(getComputedStyle(root).getPropertyValue("--w7til-size")) || 56;
        for (var y = 0; y < root.clientHeight; y += S) for (var x = 0; x < root.clientWidth; x += S) {
          var t = document.createElement("i");
          t.style.transform = "translate(" + x + "px," + y + "px)";
          grid.appendChild(t); tiles.push(t); cx.push(x + S / 2); cy.push(y + S / 2); cur.push(0);
        }
      }
      function light(px, py, ease) {
        for (var i = 0; i < tiles.length; i++) {
          var d = Math.hypot(cx[i] - px, cy[i] - py), g = d < REACH ? Math.pow(1 - d / REACH, 2) * MAX : 0;
          var n = ease ? cur[i] + (g - cur[i]) * (g > cur[i] ? .3 : FADE) : g;
          if (Math.abs(n - cur[i]) > .003 || !ease) { cur[i] = n; tiles[i].style.opacity = n.toFixed(3); }
        }
      }
      build();
      off.push(function () { grid.textContent = ""; });
      if (reduce) { light(root.clientWidth * .78, root.clientHeight * .3, false); return; }
      function path(t) { return [root.clientWidth * (.5 + .4 * Math.sin(t * .0006)), root.clientHeight * (.5 + .34 * Math.cos(t * .0011))]; }
      function tick(t) {
        raf = requestAnimationFrame(tick);
        if (!real || t - real > IDLE_AFTER) { var q = path(t); tx = q[0]; ty = q[1]; }
        light(tx, ty, true);
      }
      for (var j = 40; j > 0; j--) { var q = path(performance.now() - j * 17); light(q[0], q[1], true); }
      function aim(x, y, hold) { var b = root.getBoundingClientRect(); tx = x - b.left; ty = y - b.top; real = performance.now() + (hold || 0); }
      function move(e) { aim(e.clientX, e.clientY); }
      function focus(e) { var r = e.target.getBoundingClientRect(); aim(r.left + r.width / 2, r.top + r.height / 2, 4000); }
      function leave() { real = 0; }
      root.addEventListener("pointermove", move);
      root.addEventListener("pointerdown", move);
      root.addEventListener("pointerleave", leave);
      root.addEventListener("focusin", focus);
      var once = true, ro = new ResizeObserver(function () { if (once) once = false; else build(); });
      ro.observe(root);
      off.push(function () { root.removeEventListener("pointermove", move); root.removeEventListener("pointerdown", move); root.removeEventListener("pointerleave", leave); root.removeEventListener("focusin", focus); ro.disconnect(); });
      function play() { if (!raf && seen) raf = requestAnimationFrame(tick); }
      function stop() { cancelAnimationFrame(raf); raf = 0; }
      var io = new IntersectionObserver(function (e) { seen = e[0].isIntersecting; if (seen) play(); else stop(); });
      io.observe(root);
      off.push(stop, function () { io.disconnect(); });
      play();
    return () => off.forEach((f) => f());
  }, [prefersReduced]);

  return (
    <section className="w7til" data-w7til="" ref={rootRef} aria-label="Fieldlight Studio lighting design">
      <style>{STYLES}</style>
      <div className="w7til-grid" aria-hidden="true"></div>
      <div className="w7til-body">
        <p className="w7til-eye">Fieldlight Studio</p>
        <h2 className="w7til-h">Lighting for rooms that are lived in after dark</h2>
        <p className="w7til-p">We plan light the way a cabinetmaker plans joints: a lamp where you read, a low wash where you cook, and nothing glaring at the sofa.</p>
        <div className="w7til-row">
          <a className="w7til-btn" href="#">Book a night visit</a>
          <a className="w7til-ghost" href="#">See finished rooms</a>
        </div>
      </div>
    </section>
  );
}

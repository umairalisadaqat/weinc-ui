import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version. The CSS comments name the values to change.
const STYLES = `
  /* Change these: --w7cmp-paper (blueprint blue), --w7cmp-line (mark and grid colour), --w7cmp-cell (grid size). Spacing and life of marks are in the script. */
  .w7cmp { --w7cmp-paper: #1d3a5f; --w7cmp-line: #dce8f5; --w7cmp-cell: 24px;
    position: relative; height: 560px; overflow: hidden; color: var(--w7cmp-line); touch-action: pan-y;
    background-color: var(--w7cmp-paper);
    background-image: linear-gradient(rgba(220,232,245,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(220,232,245,.07) 1px, transparent 1px),
      linear-gradient(rgba(220,232,245,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(220,232,245,.12) 1px, transparent 1px);
    background-size: var(--w7cmp-cell) var(--w7cmp-cell), var(--w7cmp-cell) var(--w7cmp-cell), calc(var(--w7cmp-cell) * 5) calc(var(--w7cmp-cell) * 5), calc(var(--w7cmp-cell) * 5) calc(var(--w7cmp-cell) * 5);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; }
  .w7cmp-marks { position: absolute; inset: 0; pointer-events: none; }
  .w7cmp-mark { position: absolute; left: -48px; top: -48px; width: 96px; height: 96px; opacity: 0; fill: none; stroke: var(--w7cmp-line); stroke-width: 1.3; stroke-linecap: round; will-change: transform, opacity; }
  .w7cmp-mark .w7cmp-dot, .w7cmp-mark .w7cmp-n { fill: var(--w7cmp-line); stroke: none; }
  .w7cmp-sheet { position: absolute; inset: 14px; border: 1px solid rgba(220,232,245,.35); pointer-events: none; }
  .w7cmp-body { position: relative; width: 100%; max-width: 64rem; margin: 0 auto; padding: 28px 32px 90px; }
  .w7cmp-eye { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .26em; text-transform: uppercase; color: #a9c3e0; }
  .w7cmp-h { margin: 14px 0 0; max-width: 14ch; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(2.2rem, 5.8vw, 4.2rem); line-height: 1.04; letter-spacing: -.02em; color: #f4f8fc; }
  .w7cmp-p { margin: 18px 0 0; max-width: 31rem; font-size: 16px; line-height: 1.65; color: #c5d5e7; }
  .w7cmp-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
  .w7cmp-btn, .w7cmp-ghost { display: inline-flex; align-items: center; min-height: 48px; padding: 0 22px; border-radius: 2px; font-weight: 600; font-size: 15px; text-decoration: none; }
  .w7cmp-btn { background: #f4f8fc; color: var(--w7cmp-paper); }
  .w7cmp-btn:hover { background: #fff; }
  .w7cmp-ghost { color: #f4f8fc; border: 1px solid rgba(220,232,245,.5); background: rgba(29,58,95,.6); }
  .w7cmp-ghost:hover { border-color: #f4f8fc; }
  .w7cmp-btn:focus-visible, .w7cmp-ghost:focus-visible { outline: 3px solid #f2c46b; outline-offset: 3px; }
  .w7cmp-block { position: absolute; right: 14px; bottom: 14px; display: flex; margin: 0; border-top: 1px solid rgba(220,232,245,.35); border-left: 1px solid rgba(220,232,245,.35); background: rgba(29,58,95,.85); }
  .w7cmp-block div { padding: 8px 14px; border-left: 1px solid rgba(220,232,245,.2); }
  .w7cmp-block div:first-child { border-left: 0; }
  .w7cmp-block dt { font-size: 10px; letter-spacing: .16em; text-transform: uppercase; color: #a9c3e0; }
  .w7cmp-block dd { margin: 2px 0 0; font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }
  @media (min-width: 720px) { .w7cmp-body { padding: 40px 64px 60px; } }
  @media (prefers-reduced-motion: reduce) { .w7cmp .w7cmp-mark:first-child { opacity: .6; left: auto; right: 10%; top: 16%; width: 120px; height: 120px; transform: rotate(18deg); } }
`;

export default function BlueprintCompassMarksTrailingTheCursor() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    const off: Array<() => void> = [];
    
      var GAP = 90, LIFE = 2800, POOL = 12, IDLE_AFTER = 1800; // px between marks, ms each mark lasts, marks reused, ms before the demo resumes
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      var layer = root.querySelector(".w7cmp-marks"), tpl = layer.firstElementChild, pool = [tpl], anims = [], k = 0;
      for (var i = 1; i < POOL; i++) { var c = tpl.cloneNode(true); layer.appendChild(c); pool.push(c); }
      off.push(function () { anims.forEach(function (a) { a.cancel(); }); while (layer.children.length > 1) layer.removeChild(layer.lastChild); });
      var lx = -999, ly = -999, real = 0, raf = 0, seen = true;
      function mark(x, y, age) {
        var n = k++ % POOL, a = Math.atan2(y - ly, x - lx) * 57.3 + 90, base = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" + a.toFixed(1) + "deg)";
        if (anims[n]) anims[n].cancel();
        anims[n] = pool[n].animate([
          { opacity: 0, transform: base + " scale(.5) rotate(-40deg)" },
          { opacity: .95, transform: base + " scale(1)", offset: .14 },
          { opacity: .7, transform: base + " scale(1)", offset: .5 },
          { opacity: 0, transform: base + " scale(1.08)" }
        ], { duration: LIFE, easing: "cubic-bezier(.2,.7,.2,1)", fill: "forwards" });
        if (age) anims[n].currentTime = age;
        lx = x; ly = y;
      }
      function near(x, y) { if (Math.hypot(x - lx, y - ly) > GAP) mark(x, y, 0); }
      function path(t) { return [root.clientWidth * (.62 + .3 * Math.sin(t * .0005)), root.clientHeight * (.48 + .32 * Math.sin(t * .00115 + .6))]; }
      var now = performance.now();
      for (var j = 6; j > 0; j--) { var q = path(now - j * 520); mark(q[0], q[1], j * 330); }
      function tick(t) {
        raf = requestAnimationFrame(tick);
        if (real && t - real < IDLE_AFTER) return;
        var p = path(t); near(p[0], p[1]);
      }
      function at(e) { var b = root.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; }
      function move(e) { if (e.pointerType === "touch") return; real = performance.now(); var p = at(e); near(p[0], p[1]); }
      function tap(e) { if (e.pointerType !== "touch") return; real = performance.now(); var p = at(e); mark(p[0], p[1], 0); }
      function leave() { real = 0; }
      root.addEventListener("pointermove", move);
      root.addEventListener("pointerdown", tap);
      root.addEventListener("pointerleave", leave);
      off.push(function () { root.removeEventListener("pointermove", move); root.removeEventListener("pointerdown", tap); root.removeEventListener("pointerleave", leave); });
      function play() { if (!raf && seen) raf = requestAnimationFrame(tick); }
      function stop() { cancelAnimationFrame(raf); raf = 0; }
      var io = new IntersectionObserver(function (e) { seen = e[0].isIntersecting; if (seen) play(); else stop(); });
      io.observe(root);
      off.push(stop, function () { io.disconnect(); });
      play();
    return () => off.forEach((f) => f());
  }, [prefersReduced]);

  return (
    <section className="w7cmp" data-w7cmp="" ref={rootRef} aria-label="Arden Vale Architects">
      <style>{STYLES}</style>
      <div className="w7cmp-marks" aria-hidden="true">
        <svg className="w7cmp-mark" viewBox="-30 -30 60 60"><circle r="17" /><circle r="2.2" className="w7cmp-dot" /><path d="M0 -26V-19M0 19V26M-26 0H-19M19 0H26M-12 -12L-9 -9M12 12L9 9M12 -12L9 -9M-12 12L-9 9" /><path d="M0 -15L4 -4L0 -6L-4 -4Z" className="w7cmp-n" /></svg>
      </div>
      <div className="w7cmp-sheet" aria-hidden="true"></div>
      <div className="w7cmp-body">
        <p className="w7cmp-eye">Arden Vale Architects</p>
        <h2 className="w7cmp-h">Houses drawn around the way you live</h2>
        <p className="w7cmp-p">We start with a week of your routines, not a style. Where the morning light lands, where the boots go, which door everyone really uses. The plan follows from that.</p>
        <div className="w7cmp-row">
          <a className="w7cmp-btn" href="#">Start with a site visit</a>
          <a className="w7cmp-ghost" href="#">View drawings</a>
        </div>
      </div>
      <dl className="w7cmp-block">
        <div><dt>Drawing</dt><dd>AV-014</dd></div>
        <div><dt>Sheet</dt><dd>Ground floor</dd></div>
        <div><dt>Scale</dt><dd>1:50</dd></div>
      </dl>
    </section>
  );
}

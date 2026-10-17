import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version. The CSS comments name the values to change.
const STYLES = `
  /* Change these: --w7mag-bg, --w7mag-ink, --w7mag-clay (fill colour), --w7mag-size (disc size). Pull strength and reach are in the script. */
  .w7mag { --w7mag-bg: #efe5d6; --w7mag-ink: #2e2219; --w7mag-clay: #b4532a; --w7mag-size: 64px;
    position: relative; padding: 64px 20px 72px; background: var(--w7mag-bg); color: var(--w7mag-ink); text-align: center;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .w7mag-in { max-width: 44rem; margin: 0 auto; }
  .w7mag-eye { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: #8e3d1b; }
  .w7mag-h { margin: 12px 0 0; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(1.9rem, 4.6vw, 3rem); line-height: 1.08; letter-spacing: -.015em; }
  .w7mag-p { margin: 14px auto 0; max-width: 30rem; font-size: 16px; line-height: 1.6; color: #5c4a3c; }
  .w7mag-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 18px 22px; margin: 40px 0 0; padding: 0; list-style: none; }
  .w7mag-i { display: flex; flex-direction: column; align-items: center; gap: 12px; width: 88px; padding: 6px 0; border-radius: 12px; color: var(--w7mag-ink); text-decoration: none; outline: none; }
  .w7mag-disc { position: relative; display: grid; place-items: center; width: var(--w7mag-size); height: var(--w7mag-size); border-radius: 50%; border: 1.5px solid rgba(46,34,25,.3); will-change: transform; }
  .w7mag-disc::before { content: ""; position: absolute; inset: -1.5px; border-radius: 50%; background: var(--w7mag-clay); transform: scale(0); transition: transform .45s cubic-bezier(.2,.8,.2,1); }
  .w7mag-disc svg { position: relative; width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linejoin: round; stroke-linecap: round; transition: color .3s; will-change: transform; }
  .w7mag-lab { font-size: 13px; font-weight: 600; }
  .w7mag-i:hover .w7mag-disc::before, .w7mag-i:focus-visible .w7mag-disc::before, .w7mag-i[data-near] .w7mag-disc::before { transform: scale(1); }
  .w7mag-i:hover svg, .w7mag-i:focus-visible svg, .w7mag-i[data-near] svg { color: #fff6ec; }
  .w7mag-i:focus-visible .w7mag-disc { box-shadow: 0 0 0 3px var(--w7mag-bg), 0 0 0 5px var(--w7mag-ink); }
  @media (prefers-reduced-motion: reduce) { .w7mag-disc::before { transition: none; } }
`;

export default function MagneticSocialIconRowInStudioFooter() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    const off: Array<() => void> = [];
    
      var REACH = 110, PULL = .38, INNER = .18, IDLE_AFTER = 2500; // px of reach, disc pull, extra icon pull, ms before the demo resumes
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      var items = [].slice.call(root.querySelectorAll(".w7mag-i")).map(function (a) {
        return { a: a, d: a.querySelector(".w7mag-disc"), s: a.querySelector("svg"), x: 0, y: 0 };
      });
      var px = -9999, py = -9999, real = 0, raf = 0, seen = true;
      function tick(t) {
        raf = requestAnimationFrame(tick);
        if (!real || t - real > IDLE_AFTER) {
          // A pretend pointer drifts along the row so the preview shows the pull.
          var f = items[0].d.getBoundingClientRect(), l = items[items.length - 1].d.getBoundingClientRect();
          px = f.left + (l.right - f.left) * (.5 + .55 * Math.sin(t * .0009)); py = f.top + f.height / 2 + 14 * Math.sin(t * .002);
        }
        items.forEach(function (it) {
          var r = it.d.getBoundingClientRect(), cx = r.left + r.width / 2 - it.x, cy = r.top + r.height / 2 - it.y;
          var dx = px - cx, dy = py - cy, near = Math.hypot(dx, dy) < REACH * .6, k = Math.max(0, 1 - Math.hypot(dx, dy) / REACH);
          it.x += (dx * PULL * k - it.x) * .18; it.y += (dy * PULL * k - it.y) * .18;
          it.d.style.transform = "translate(" + it.x.toFixed(2) + "px," + it.y.toFixed(2) + "px)";
          it.s.style.transform = "translate(" + (it.x * INNER / PULL).toFixed(2) + "px," + (it.y * INNER / PULL).toFixed(2) + "px)";
          if (!real || t - real > IDLE_AFTER) it.a.toggleAttribute("data-near", near); else it.a.removeAttribute("data-near");
        });
      }
      function move(e) { if (e.pointerType === "touch") return; px = e.clientX; py = e.clientY; real = performance.now(); }
      function leave() { px = py = -9999; real = performance.now(); }
      function focus() { px = py = -9999; real = performance.now() + 4000; }
      root.addEventListener("pointermove", move);
      root.addEventListener("pointerleave", leave);
      root.addEventListener("focusin", focus);
      off.push(function () {
        root.removeEventListener("pointermove", move); root.removeEventListener("pointerleave", leave); root.removeEventListener("focusin", focus);
        items.forEach(function (it) { it.d.style.transform = it.s.style.transform = ""; it.a.removeAttribute("data-near"); });
      });
      function play() { if (!raf && seen) raf = requestAnimationFrame(tick); }
      function stop() { cancelAnimationFrame(raf); raf = 0; }
      var io = new IntersectionObserver(function (e) { seen = e[0].isIntersecting; if (seen) play(); else stop(); });
      io.observe(root);
      off.push(stop, function () { io.disconnect(); });
      play();
    return () => off.forEach((f) => f());
  }, [prefersReduced]);

  return (
    <section className="w7mag" data-w7mag="" ref={rootRef} aria-label="Follow Kestrel Print Studio">
      <style>{STYLES}</style>
      <div className="w7mag-in">
        <p className="w7mag-eye">Kestrel Print Studio</p>
        <h2 className="w7mag-h">Follow the presses between visits</h2>
        <p className="w7mag-p">New prints, open studio dates and the occasional misprint sale, wherever you prefer to hear about them.</p>
        <ul className="w7mag-row">
          <li><a className="w7mag-i" href="#"><span className="w7mag-disc"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6.5 12 13l8.5-6.5" /></svg></span><span className="w7mag-lab">Newsletter</span></a></li>
          <li><a className="w7mag-i" href="#"><span className="w7mag-disc"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg></span><span className="w7mag-lab">Photo diary</span></a></li>
          <li><a className="w7mag-i" href="#"><span className="w7mag-disc"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></svg></span><span className="w7mag-lab">Podcast</span></a></li>
          <li><a className="w7mag-i" href="#"><span className="w7mag-disc"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M10 9.5v5l4.5-2.5z" /></svg></span><span className="w7mag-lab">Videos</span></a></li>
          <li><a className="w7mag-i" href="#"><span className="w7mag-disc"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg></span><span className="w7mag-lab">Find the studio</span></a></li>
        </ul>
      </div>
    </section>
  );
}

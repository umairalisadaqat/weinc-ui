import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version; the first CSS comment names the values to change.
const STYLES = `
  /* Change these: the colours below, --w1crp-box (box height), and the translate() and scale() on .w1crp-img for each data-step. */
  .w1crp { --w1crp-bg: #f5ede6; --w1crp-ink: #2a1c15; --w1crp-soft: #5b4537; --w1crp-accent: #9a3d20; --w1crp-btnink: #fff; --w1crp-card: #fffaf6;
    --w1crp-line: #e6d6c8; --w1crp-panel: #d9cfc4; --w1crp-chip: rgba(42,28,21,.86); --w1crp-chipink: #f8efe8;
    --w1crp-display: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; --w1crp-dw: 700; --w1crp-r: 6px; }
  .w1crp { --w1crp-box: 640px; height: var(--w1crp-box); overflow-y: auto; overflow-x: hidden; position: relative;
    background: var(--w1crp-bg); color: var(--w1crp-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; scrollbar-width: thin; }
  /* On a normal page: delete height and overflow above, set --w1crp-box: 100vh, and in the script use root: null. */
  .w1crp:focus-visible { outline: 3px solid var(--w1crp-accent); outline-offset: -3px; }
  .w1crp-hint { position: sticky; top: 0; height: 0; z-index: 5; display: flex; align-items: flex-start; justify-content: flex-end; pointer-events: none; }
  .w1crp-hint span { margin: 12px 12px 0 0; padding: 5px 12px; border-radius: 999px; background: var(--w1crp-chip); color: var(--w1crp-chipink);
    font-size: 12px; letter-spacing: .04em; transition: opacity .5s ease; }
  .w1crp[data-touched] .w1crp-hint span { opacity: 0; }
  .w1crp-grid { max-width: 72rem; margin: 0 auto; padding: 0 32px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 0 56px; }
  .w1crp[data-side="left"] .w1crp-grid { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); }
  .w1crp-vis { grid-column: 2; grid-row: 1; align-self: start; position: sticky; top: 0; z-index: 1; height: var(--w1crp-box);
    box-sizing: border-box; padding: 28px 0; display: flex; align-items: center; justify-content: center; }
  .w1crp[data-side="left"] .w1crp-vis { grid-column: 1; }
  .w1crp[data-side="left"] .w1crp-col { grid-column: 2; }
  .w1crp-frame { position: relative; width: min(100%, calc((var(--w1crp-box) - 56px) * 1.5)); aspect-ratio: 1.5; overflow: hidden;
    border-radius: var(--w1crp-r, 18px); background: var(--w1crp-panel);
    box-shadow: 0 1px 2px rgba(0,0,0,.08), 0 28px 56px -28px rgba(0,0,0,.35); }
  .w1crp-col { grid-column: 1; grid-row: 1; position: relative; z-index: 2; min-width: 0; }
  .w1crp-head { padding: 56px 0 8px; }
  .w1crp-eyebrow { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--w1crp-accent); }
  .w1crp-h { margin: 12px 0 0; font-family: var(--w1crp-display); font-weight: var(--w1crp-dw, 600); font-size: clamp(1.75rem, 3.6vw, 2.6rem); line-height: 1.1; letter-spacing: -.02em; }
  .w1crp-lede { margin: 14px 0 0; max-width: 30rem; font-size: 1.0625rem; line-height: 1.6; color: var(--w1crp-soft); }
  .w1crp-steps { list-style: none; margin: 0; padding: 0 0 calc(var(--w1crp-box) * .42); }
  .w1crp-step { min-height: calc(var(--w1crp-box) * .62); display: flex; align-items: center; }
  .w1crp-card { box-sizing: border-box; width: 100%; padding: 22px 24px; border-radius: 14px; background: var(--w1crp-card); border: 1px solid var(--w1crp-line);
    opacity: .55; transition: opacity .45s ease; }
  .w1crp[data-step="1"] .w1crp-step[data-i="1"] .w1crp-card,
  .w1crp[data-step="2"] .w1crp-step[data-i="2"] .w1crp-card,
  .w1crp[data-step="3"] .w1crp-step[data-i="3"] .w1crp-card,
  .w1crp[data-step="4"] .w1crp-step[data-i="4"] .w1crp-card,
  .w1crp[data-step="5"] .w1crp-step[data-i="5"] .w1crp-card { opacity: 1; }
  .w1crp-when { margin: 0; font-size: .8125rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--w1crp-accent); }
  .w1crp-card h3 { margin: 6px 0 0; font-size: 1.375rem; line-height: 1.25; font-weight: 650; }
  .w1crp-card h3 + p { margin: 8px 0 0; font-size: 1rem; line-height: 1.6; color: var(--w1crp-soft); }
  .w1crp-end { max-width: 72rem; margin: 0 auto; padding: 48px 32px 64px; display: flex; flex-wrap: wrap; gap: 16px 24px; align-items: center; justify-content: space-between; border-top: 1px solid var(--w1crp-line); }
  .w1crp-end p { margin: 0; font-size: 1.0625rem; }
  .w1crp-btn { display: inline-flex; min-height: 46px; align-items: center; padding: 0 22px; border-radius: 999px; background: var(--w1crp-accent);
    color: var(--w1crp-btnink); font-weight: 600; font-size: .9375rem; text-decoration: none; transition: transform .2s ease; }
  .w1crp-btn:hover { transform: translateY(-1px); }
  .w1crp-btn:focus-visible { outline: 3px solid var(--w1crp-ink); outline-offset: 3px; }
  /* Phones: the visual pins at the top and the steps scroll up over it on solid cards. */
  @media (max-width: 760px) {
    .w1crp-grid, .w1crp[data-side="left"] .w1crp-grid { grid-template-columns: minmax(0, 1fr); padding: 0 16px; }
    .w1crp-vis, .w1crp[data-side="left"] .w1crp-vis { grid-column: 1; grid-row: 2; height: 280px; padding: 12px 0; background: var(--w1crp-bg); }
    .w1crp-frame { width: min(100%, calc(252px * 1.5)); }
    .w1crp-col, .w1crp[data-side="left"] .w1crp-col { display: contents; }
    .w1crp-head { grid-row: 1; padding: 36px 0 4px; }
    .w1crp-steps { grid-row: 3; position: relative; z-index: 2; }
    .w1crp-step { min-height: calc(var(--w1crp-box) * .5); align-items: flex-end; }
    .w1crp-card { opacity: 1; box-shadow: 0 14px 34px -16px rgba(0,0,0,.4); }
    .w1crp-end { padding: 40px 16px 56px; }
  }
  /* Reduced motion: nothing pins, the steps read as a plain list and the visual shows its final state. */
  @media (prefers-reduced-motion: reduce) {
    .w1crp-vis, .w1crp[data-side="left"] .w1crp-vis { position: relative; height: auto; }
    .w1crp-step { min-height: 0; padding: 8px 0; }
    .w1crp-steps { padding-bottom: 32px; }
    .w1crp .w1crp-card { opacity: 1; }
    .w1crp *, .w1crp *::before { transition: none !important; }
  }
  .w1crp-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform-origin: 50% 50%;
    transition: transform 1.1s cubic-bezier(.65,0,.25,1); will-change: transform; }
  .w1crp[data-step="2"] .w1crp-img { transform: translate(13.2%, -44%) scale(2.2); }
  .w1crp[data-step="3"] .w1crp-img { transform: translate(5.2%, 7.8%) scale(2.6); }
  .w1crp[data-step="4"] .w1crp-img { transform: translate(-25.5%, 6%) scale(3); }
  .w1crp[data-step="5"] .w1crp-img { transform: translate(0, 64.4%) scale(2.3); }
  .w1crp-cap { position: absolute; left: 0; bottom: 0; margin: 0; display: grid; padding: 14px; }
  .w1crp-cap span { grid-area: 1 / 1; justify-self: start; padding: 7px 12px; border-radius: 4px; background: var(--w1crp-chip); color: var(--w1crp-chipink);
    font-size: 13px; font-weight: 600; letter-spacing: .02em; opacity: 0; transform: translateY(8px); transition: opacity .35s ease .3s, transform .5s ease .3s; }
  .w1crp[data-step="1"] .w1crp-cap span:nth-child(1), .w1crp[data-step="2"] .w1crp-cap span:nth-child(2), .w1crp[data-step="3"] .w1crp-cap span:nth-child(3),
  .w1crp[data-step="4"] .w1crp-cap span:nth-child(4), .w1crp[data-step="5"] .w1crp-cap span:nth-child(5) { opacity: 1; transform: none; }
  @media (prefers-reduced-motion: reduce) { .w1crp .w1crp-img { transform: none; } .w1crp-cap { display: none; } }
`;

export default function PhotoZoomsToEachDetailAsStepsScroll() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    const off: any[] = [];
    (function () {
  var SPEED = 100; // demo scroll in px per second until someone touches the box; 0 turns it off
  var MID = "-48% 0px -48% 0px"; // a step becomes active when it crosses the middle of the box
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var steps = root.querySelectorAll("[data-i]"), lastStep = steps[steps.length - 1].getAttribute("data-i");
  function on(el, n, f) { el.addEventListener(n, f, { passive: true }); off.push(function () { el.removeEventListener(n, f); }); }
  function set(i) {
    if (root.getAttribute("data-step") === i) return;
    root.setAttribute("data-step", i);
  }
  if (reduce) set(lastStep);
  else {
    // Which step is active: one observer on the nearest scroller. For a section on a normal page use root: null.
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) set(e.target.getAttribute("data-i")); });
    }, { root: root, rootMargin: MID });
    steps.forEach(function (s) { io.observe(s); });
    off.push(function () { io.disconnect(); });
    // Slow demo scroll so the preview moves; any wheel, touch, click or key hands control back.
    var frame = 0, t0 = 0, pos = 0, seen = true, done = !SPEED;
    var tick = function (t) {
      pos += t0 ? SPEED * Math.min(t - t0, 50) / 1000 : 0;
      t0 = t;
      if (pos >= root.scrollHeight - root.clientHeight) pos = 0;
      root.scrollTop = pos;
      frame = requestAnimationFrame(tick);
    };
    var play = function () { if (!done && seen && !frame) { t0 = 0; frame = requestAnimationFrame(tick); } };
    var stop = function () { cancelAnimationFrame(frame); frame = 0; };
    off.push(stop);
    var vis = new IntersectionObserver(function (e) { seen = e[0].isIntersecting; if (seen) play(); else stop(); });
    vis.observe(root);
    off.push(function () { vis.disconnect(); });
    ["wheel", "touchstart", "pointerdown", "keydown"].forEach(function (n) {
      on(root, n, function () { done = true; stop(); root.setAttribute("data-touched", ""); });
    });
    play();
  }
    })();
    return () => off.forEach((f) => f());
  }, [prefersReduced]);

  return (
    <section className="w1crp" ref={rootRef} data-w1crp="" data-step="1" data-side="left" tabIndex="0" aria-label="What is on your board at a pottery class, scrollable">
        <style>{STYLES}</style>
      <div className="w1crp-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w1crp-grid">
        <div className="w1crp-vis">
          <div className="w1crp-frame" role="img" aria-label="Overhead photo of a pottery board holding a lump of brown clay, a round yellow sponge, a blue sponge on a wooden stick, tubs of slip and a small metal turntable.">
            <img className="w1crp-img" src="https://images.pexels.com/photos/27837201/pexels-photo-27837201.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="" width="1600" height="1067" decoding="async" />
            <p className="w1crp-cap" aria-hidden="true"><span>The whole board</span><span>Stoneware clay</span><span>Natural sponge</span><span>Sponge stick</span><span>Banding wheel</span></p>
          </div>
        </div>
        <div className="w1crp-col">
          <header className="w1crp-head" data-i="1"><p className="w1crp-eyebrow">Ashgrove Clay Studio</p><h2 className="w1crp-h">What is on your board on a Tuesday night</h2><p className="w1crp-lede">Our beginners' wheel course starts with the same small kit for everyone. Scroll and the photo closes in on each piece.</p></header>
          <ol className="w1crp-steps">
          <li className="w1crp-step" data-i="1"><div className="w1crp-card"><p className="w1crp-when">Your board</p><h3>Everything arrives on one board</h3><p>Each place at the wheel gets the same kit, laid out before you sit down, so the first minutes go on clay rather than hunting for tools.</p></div></li>
          <li className="w1crp-step" data-i="2"><div className="w1crp-card"><p className="w1crp-when">Clay</p><h3>A kilo of buff stoneware</h3><p>Wedged and wrapped that morning. It is soft enough to centre on a first try and fires to a warm oatmeal colour.</p></div></li>
          <li className="w1crp-step" data-i="3"><div className="w1crp-card"><p className="w1crp-when">Sponge</p><h3>A natural sponge for water</h3><p>Squeezed over the clay as it spins, it keeps the surface slick without flooding the wheel head.</p></div></li>
          <li className="w1crp-step" data-i="4"><div className="w1crp-card"><p className="w1crp-when">Sponge stick</p><h3>A sponge on a dowel</h3><p>For the inside of tall pots, where a hand will not reach. It lifts out the water that pools at the bottom.</p></div></li>
          <li className="w1crp-step" data-i="5"><div className="w1crp-card"><p className="w1crp-when">Week four</p><h3>A small banding wheel</h3><p>Not for throwing. Once your pieces are dry you set them on it and turn them slowly while you paint bands of slip.</p></div></li>
          </ol>
        </div>
      </div>
      <div className="w1crp-end"><p>Six Tuesday evenings, clay and firing included.</p><a href="#" className="w1crp-btn">See course dates</a></div>
    </section>
  );
}

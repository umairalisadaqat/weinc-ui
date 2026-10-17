import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version; the first CSS comment names the values to change.
const STYLES = `
  /* Change these: the colours below, --w1pln-box (box height), and the room rectangles in the SVG and the glow colour in #w1pln-glow. */
  .w1pln { --w1pln-bg: #0e1726; --w1pln-ink: #e9eef6; --w1pln-soft: #b3bfd1; --w1pln-accent: #e8b766; --w1pln-btnink: #1b1407; --w1pln-card: #142035;
    --w1pln-line: #26375a; --w1pln-panel: #0b1322; --w1pln-chip: rgba(232,183,102,.94); --w1pln-chipink: #1b1407;
    --w1pln-display: Georgia, "Iowan Old Style", serif; --w1pln-dw: 400; --w1pln-r: 14px; }
  .w1pln { --w1pln-box: 640px; height: var(--w1pln-box); overflow-y: auto; overflow-x: hidden; position: relative;
    background: var(--w1pln-bg); color: var(--w1pln-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; scrollbar-width: thin; }
  /* On a normal page: delete height and overflow above, set --w1pln-box: 100vh, and in the script use root: null. */
  .w1pln:focus-visible { outline: 3px solid var(--w1pln-accent); outline-offset: -3px; }
  .w1pln-hint { position: sticky; top: 0; height: 0; z-index: 5; display: flex; align-items: flex-start; justify-content: flex-end; pointer-events: none; }
  .w1pln-hint span { margin: 12px 12px 0 0; padding: 5px 12px; border-radius: 999px; background: var(--w1pln-chip); color: var(--w1pln-chipink);
    font-size: 12px; letter-spacing: .04em; transition: opacity .5s ease; }
  .w1pln[data-touched] .w1pln-hint span { opacity: 0; }
  .w1pln-grid { max-width: 72rem; margin: 0 auto; padding: 0 32px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 0 56px; }
  .w1pln[data-side="left"] .w1pln-grid { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); }
  .w1pln-vis { grid-column: 2; grid-row: 1; align-self: start; position: sticky; top: 0; z-index: 1; height: var(--w1pln-box);
    box-sizing: border-box; padding: 28px 0; display: flex; align-items: center; justify-content: center; }
  .w1pln[data-side="left"] .w1pln-vis { grid-column: 1; }
  .w1pln[data-side="left"] .w1pln-col { grid-column: 2; }
  .w1pln-frame { position: relative; width: min(100%, calc((var(--w1pln-box) - 56px) * 1.3333)); aspect-ratio: 1.3333; overflow: hidden;
    border-radius: var(--w1pln-r, 18px); background: var(--w1pln-panel);
    box-shadow: 0 1px 2px rgba(0,0,0,.08), 0 28px 56px -28px rgba(0,0,0,.35); }
  .w1pln-col { grid-column: 1; grid-row: 1; position: relative; z-index: 2; min-width: 0; }
  .w1pln-head { padding: 56px 0 8px; }
  .w1pln-eyebrow { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--w1pln-accent); }
  .w1pln-h { margin: 12px 0 0; font-family: var(--w1pln-display); font-weight: var(--w1pln-dw, 600); font-size: clamp(1.75rem, 3.6vw, 2.6rem); line-height: 1.1; letter-spacing: -.02em; }
  .w1pln-lede { margin: 14px 0 0; max-width: 30rem; font-size: 1.0625rem; line-height: 1.6; color: var(--w1pln-soft); }
  .w1pln-steps { list-style: none; margin: 0; padding: 0 0 calc(var(--w1pln-box) * .42); }
  .w1pln-step { min-height: calc(var(--w1pln-box) * .62); display: flex; align-items: center; }
  .w1pln-card { box-sizing: border-box; width: 100%; padding: 22px 24px; border-radius: 14px; background: var(--w1pln-card); border: 1px solid var(--w1pln-line);
    opacity: .55; transition: opacity .45s ease; }
  .w1pln[data-step="1"] .w1pln-step[data-i="1"] .w1pln-card,
  .w1pln[data-step="2"] .w1pln-step[data-i="2"] .w1pln-card,
  .w1pln[data-step="3"] .w1pln-step[data-i="3"] .w1pln-card,
  .w1pln[data-step="4"] .w1pln-step[data-i="4"] .w1pln-card,
  .w1pln[data-step="5"] .w1pln-step[data-i="5"] .w1pln-card { opacity: 1; }
  .w1pln-when { margin: 0; font-size: .8125rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--w1pln-accent); }
  .w1pln-card h3 { margin: 6px 0 0; font-size: 1.375rem; line-height: 1.25; font-weight: 650; }
  .w1pln-card h3 + p { margin: 8px 0 0; font-size: 1rem; line-height: 1.6; color: var(--w1pln-soft); }
  .w1pln-end { max-width: 72rem; margin: 0 auto; padding: 48px 32px 64px; display: flex; flex-wrap: wrap; gap: 16px 24px; align-items: center; justify-content: space-between; border-top: 1px solid var(--w1pln-line); }
  .w1pln-end p { margin: 0; font-size: 1.0625rem; }
  .w1pln-btn { display: inline-flex; min-height: 46px; align-items: center; padding: 0 22px; border-radius: 999px; background: var(--w1pln-accent);
    color: var(--w1pln-btnink); font-weight: 600; font-size: .9375rem; text-decoration: none; transition: transform .2s ease; }
  .w1pln-btn:hover { transform: translateY(-1px); }
  .w1pln-btn:focus-visible { outline: 3px solid var(--w1pln-ink); outline-offset: 3px; }
  /* Phones: the visual pins at the top and the steps scroll up over it on solid cards. */
  @media (max-width: 760px) {
    .w1pln-grid, .w1pln[data-side="left"] .w1pln-grid { grid-template-columns: minmax(0, 1fr); padding: 0 16px; }
    .w1pln-vis, .w1pln[data-side="left"] .w1pln-vis { grid-column: 1; grid-row: 2; height: 290px; padding: 12px 0; background: var(--w1pln-bg); }
    .w1pln-frame { width: min(100%, calc(262px * 1.3333)); }
    .w1pln-col, .w1pln[data-side="left"] .w1pln-col { display: contents; }
    .w1pln-head { grid-row: 1; padding: 36px 0 4px; }
    .w1pln-steps { grid-row: 3; position: relative; z-index: 2; }
    .w1pln-step { min-height: calc(var(--w1pln-box) * .5); align-items: flex-end; }
    .w1pln-card { opacity: 1; box-shadow: 0 14px 34px -16px rgba(0,0,0,.4); }
    .w1pln-end { padding: 40px 16px 56px; }
  }
  /* Reduced motion: nothing pins, the steps read as a plain list and the visual shows its final state. */
  @media (prefers-reduced-motion: reduce) {
    .w1pln-vis, .w1pln[data-side="left"] .w1pln-vis { position: relative; height: auto; }
    .w1pln-step { min-height: 0; padding: 8px 0; }
    .w1pln-steps { padding-bottom: 32px; }
    .w1pln .w1pln-card { opacity: 1; }
    .w1pln *, .w1pln *::before { transition: none !important; }
  }
  .w1pln-frame { border: 1px solid var(--w1pln-line); }
  .w1pln-svg { display: block; width: 100%; height: 100%; }
  .w1pln-lit { opacity: 0; transition: opacity .9s ease; }
  .w1pln[data-step="1"] .w1pln-r1, .w1pln[data-step="2"] .w1pln-r2, .w1pln[data-step="3"] .w1pln-r3,
  .w1pln[data-step="4"] .w1pln-r4, .w1pln[data-step="5"] .w1pln-r5 { opacity: 1; }
  .w1pln[data-step="2"] .w1pln-r1, .w1pln[data-step="3"] .w1pln-r1, .w1pln[data-step="3"] .w1pln-r2,
  .w1pln[data-step="4"] .w1pln-r1, .w1pln[data-step="4"] .w1pln-r2, .w1pln[data-step="4"] .w1pln-r3,
  .w1pln[data-step="5"] .w1pln-r1, .w1pln[data-step="5"] .w1pln-r2, .w1pln[data-step="5"] .w1pln-r3, .w1pln[data-step="5"] .w1pln-r4 { opacity: .22; }
  @media (prefers-reduced-motion: reduce) { .w1pln .w1pln-lit { opacity: .8; } }
`;

export default function FloorPlanLightsEachRoomOnScroll() {
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
    <section className="w1pln" ref={rootRef} data-w1pln="" data-step="1" tabIndex="0" aria-label="A tour of Larkspur Cottage, scrollable">
        <style>{STYLES}</style>
      <div className="w1pln-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w1pln-grid">
        <div className="w1pln-vis">
          <div className="w1pln-frame" role="img" aria-label="Floor plan of Larkspur Cottage: a kitchen in the top left, a living room across the top right, a bedroom in the bottom left, then a bathroom and a garden room along the bottom right.">
            <svg className="w1pln-svg" viewBox="0 0 400 300" aria-hidden="true">
              <defs><radialGradient id="w1pln-glow" cx="50%" cy="45%" r="70%"><stop offset="0" stopColor="#f6c97a" stopOpacity=".95"></stop><stop offset=".55" stopColor="#d7953f" stopOpacity=".45"></stop><stop offset="1" stopColor="#d7953f" stopOpacity=".08"></stop></radialGradient></defs>
              <rect x="20" y="20" width="360" height="260" fill="#111c30"></rect>
              <rect className="w1pln-lit w1pln-r1" x="20" y="20" width="150" height="120" fill="url(#w1pln-glow)"></rect>
              <rect className="w1pln-lit w1pln-r2" x="170" y="20" width="210" height="150" fill="url(#w1pln-glow)"></rect>
              <rect className="w1pln-lit w1pln-r3" x="20" y="140" width="180" height="140" fill="url(#w1pln-glow)"></rect>
              <rect className="w1pln-lit w1pln-r4" x="200" y="170" width="90" height="110" fill="url(#w1pln-glow)"></rect>
              <rect className="w1pln-lit w1pln-r5" x="290" y="170" width="90" height="110" fill="url(#w1pln-glow)"></rect>
              <g fill="none" stroke="#5c6f8f" strokeWidth="1.5">
                <rect x="34" y="34" width="122" height="22" rx="2"></rect><circle cx="132" cy="102" r="16"></circle>
                <rect x="196" y="40" width="96" height="34" rx="8"></rect><rect x="300" y="96" width="60" height="40" rx="3"></rect>
                <rect x="40" y="170" width="76" height="92" rx="4"></rect><rect x="46" y="176" width="64" height="18" rx="3"></rect>
                <rect x="214" y="186" width="34" height="62" rx="12"></rect><rect x="304" y="186" width="62" height="40" rx="3"></rect>
              </g>
              <g stroke="#cdd6e5" strokeWidth="5" fill="none" strokeLinecap="square">
                <rect x="20" y="20" width="360" height="260"></rect>
                <path d="M170 20 V70 M170 104 V140 M20 140 H120 M154 140 H200 M200 140 V280 M200 170 H230 M262 170 H380 M290 170 V212 M290 246 V280"></path>
              </g>
              <g fontSize="11" fontWeight="600" textAnchor="middle" fill="#e9eef6" fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing=".04em"><text x="95" y="126">Kitchen</text><text x="275" y="156">Living room</text><text x="110" y="266">Bedroom</text><text x="245" y="266">Bath</text><text x="335" y="266">Garden room</text></g>
            </svg>
          </div>
        </div>
        <div className="w1pln-col">
          <header className="w1pln-head" data-i="1"><p className="w1pln-eyebrow">Larkspur Cottage, sleeps two</p><h2 className="w1pln-h">Walk through the cottage before you arrive</h2><p className="w1pln-lede">A small stone cottage at the end of a farm lane. Scroll and the lights come on room by room.</p></header>
          <ol className="w1pln-steps">
          <li className="w1pln-step" data-i="1"><div className="w1pln-card"><p className="w1pln-when">Kitchen</p><h3>A table by the window</h3><p>A round oak table for two, a range cooker and a dresser stocked with the basics. Mornings bring sun straight through the east window.</p></div></li>
          <li className="w1pln-step" data-i="2"><div className="w1pln-card"><p className="w1pln-when">Living room</p><h3>The wood burner and the long sofa</h3><p>The biggest room, with a stove that heats the whole cottage and a deep window seat looking up the valley.</p></div></li>
          <li className="w1pln-step" data-i="3"><div className="w1pln-card"><p className="w1pln-when">Bedroom</p><h3>A king-size bed under the eaves</h3><p>Linen sheets, blackout curtains and thick stone walls, so it stays quiet even when the farm starts early.</p></div></li>
          <li className="w1pln-step" data-i="4"><div className="w1pln-card"><p className="w1pln-when">Bathroom</p><h3>A deep bath, not a shower tray</h3><p>A cast iron tub with a hand shower, heated towel rail and a skylight above it.</p></div></li>
          <li className="w1pln-step" data-i="5"><div className="w1pln-card"><p className="w1pln-when">Garden room</p><h3>Breakfast looking at the hills</h3><p>Glazed on two sides and opening onto a small walled garden with a bench and a fire pit.</p></div></li>
          </ol>
        </div>
      </div>
      <div className="w1pln-end"><p>Three night minimum, dogs welcome by arrangement.</p><a href="#" className="w1pln-btn">Check dates</a></div>
    </section>
  );
}

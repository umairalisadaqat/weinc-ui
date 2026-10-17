import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version; the first CSS comment names the values to change.
const STYLES = `
  /* Change these: the colours below, --w1map-box (box height), and the pan and pin transforms for each data-step near the end. */
  .w1map { --w1map-bg: #eef0e7; --w1map-ink: #20271f; --w1map-soft: #4a5446; --w1map-accent: #a3441f; --w1map-btnink: #fff; --w1map-card: #fbfcf7;
    --w1map-line: #d9dccd; --w1map-panel: #e7e2cf; --w1map-chip: rgba(32,39,31,.86); --w1map-chipink: #f2f3ec;
    --w1map-display: Georgia, "Iowan Old Style", serif; --w1map-dw: 400; }
  .w1map { --w1map-box: 640px; height: var(--w1map-box); overflow-y: auto; overflow-x: hidden; position: relative;
    background: var(--w1map-bg); color: var(--w1map-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; scrollbar-width: thin; }
  /* On a normal page: delete height and overflow above, set --w1map-box: 100vh, and in the script use root: null. */
  .w1map:focus-visible { outline: 3px solid var(--w1map-accent); outline-offset: -3px; }
  .w1map-hint { position: sticky; top: 0; height: 0; z-index: 5; display: flex; align-items: flex-start; justify-content: flex-end; pointer-events: none; }
  .w1map-hint span { margin: 12px 12px 0 0; padding: 5px 12px; border-radius: 999px; background: var(--w1map-chip); color: var(--w1map-chipink);
    font-size: 12px; letter-spacing: .04em; transition: opacity .5s ease; }
  .w1map[data-touched] .w1map-hint span { opacity: 0; }
  .w1map-grid { max-width: 72rem; margin: 0 auto; padding: 0 32px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 0 56px; }
  .w1map[data-side="left"] .w1map-grid { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); }
  .w1map-vis { grid-column: 2; grid-row: 1; align-self: start; position: sticky; top: 0; z-index: 1; height: var(--w1map-box);
    box-sizing: border-box; padding: 28px 0; display: flex; align-items: center; justify-content: center; }
  .w1map[data-side="left"] .w1map-vis { grid-column: 1; }
  .w1map[data-side="left"] .w1map-col { grid-column: 2; }
  .w1map-frame { position: relative; width: min(100%, calc((var(--w1map-box) - 56px) * 1.3333)); aspect-ratio: 1.3333; overflow: hidden;
    border-radius: var(--w1map-r, 18px); background: var(--w1map-panel);
    box-shadow: 0 1px 2px rgba(0,0,0,.08), 0 28px 56px -28px rgba(0,0,0,.35); }
  .w1map-col { grid-column: 1; grid-row: 1; position: relative; z-index: 2; min-width: 0; }
  .w1map-head { padding: 56px 0 8px; }
  .w1map-eyebrow { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--w1map-accent); }
  .w1map-h { margin: 12px 0 0; font-family: var(--w1map-display); font-weight: var(--w1map-dw, 600); font-size: clamp(1.75rem, 3.6vw, 2.6rem); line-height: 1.1; letter-spacing: -.02em; }
  .w1map-lede { margin: 14px 0 0; max-width: 30rem; font-size: 1.0625rem; line-height: 1.6; color: var(--w1map-soft); }
  .w1map-steps { list-style: none; margin: 0; padding: 0 0 calc(var(--w1map-box) * .42); }
  .w1map-step { min-height: calc(var(--w1map-box) * .62); display: flex; align-items: center; }
  .w1map-card { box-sizing: border-box; width: 100%; padding: 22px 24px; border-radius: 14px; background: var(--w1map-card); border: 1px solid var(--w1map-line);
    opacity: .55; transition: opacity .45s ease; }
  .w1map[data-step="1"] .w1map-step[data-i="1"] .w1map-card,
  .w1map[data-step="2"] .w1map-step[data-i="2"] .w1map-card,
  .w1map[data-step="3"] .w1map-step[data-i="3"] .w1map-card,
  .w1map[data-step="4"] .w1map-step[data-i="4"] .w1map-card { opacity: 1; }
  .w1map-when { margin: 0; font-size: .8125rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--w1map-accent); }
  .w1map-card h3 { margin: 6px 0 0; font-size: 1.375rem; line-height: 1.25; font-weight: 650; }
  .w1map-card h3 + p { margin: 8px 0 0; font-size: 1rem; line-height: 1.6; color: var(--w1map-soft); }
  .w1map-end { max-width: 72rem; margin: 0 auto; padding: 48px 32px 64px; display: flex; flex-wrap: wrap; gap: 16px 24px; align-items: center; justify-content: space-between; border-top: 1px solid var(--w1map-line); }
  .w1map-end p { margin: 0; font-size: 1.0625rem; }
  .w1map-btn { display: inline-flex; min-height: 46px; align-items: center; padding: 0 22px; border-radius: 999px; background: var(--w1map-accent);
    color: var(--w1map-btnink); font-weight: 600; font-size: .9375rem; text-decoration: none; transition: transform .2s ease; }
  .w1map-btn:hover { transform: translateY(-1px); }
  .w1map-btn:focus-visible { outline: 3px solid var(--w1map-ink); outline-offset: 3px; }
  /* Phones: the visual pins at the top and the steps scroll up over it on solid cards. */
  @media (max-width: 760px) {
    .w1map-grid, .w1map[data-side="left"] .w1map-grid { grid-template-columns: minmax(0, 1fr); padding: 0 16px; }
    .w1map-vis, .w1map[data-side="left"] .w1map-vis { grid-column: 1; grid-row: 2; height: 300px; padding: 12px 0; background: var(--w1map-bg); }
    .w1map-frame { width: min(100%, calc(272px * 1.3333)); }
    .w1map-col, .w1map[data-side="left"] .w1map-col { display: contents; }
    .w1map-head { grid-row: 1; padding: 36px 0 4px; }
    .w1map-steps { grid-row: 3; position: relative; z-index: 2; }
    .w1map-step { min-height: calc(var(--w1map-box) * .5); align-items: flex-end; }
    .w1map-card { opacity: 1; box-shadow: 0 14px 34px -16px rgba(0,0,0,.4); }
    .w1map-end { padding: 40px 16px 56px; }
  }
  /* Reduced motion: nothing pins, the steps read as a plain list and the visual shows its final state. */
  @media (prefers-reduced-motion: reduce) {
    .w1map-vis, .w1map[data-side="left"] .w1map-vis { position: relative; height: auto; }
    .w1map-step { min-height: 0; padding: 8px 0; }
    .w1map-steps { padding-bottom: 32px; }
    .w1map .w1map-card { opacity: 1; }
    .w1map *, .w1map *::before { transition: none !important; }
  }
  .w1map-svg { display: block; width: 100%; height: 100%; }
  .w1map-pan { transform-box: view-box; transform-origin: 0 0; transform: translate(0, -90px) scale(1.3); transition: transform 1.1s cubic-bezier(.6,0,.2,1); }
  .w1map-pin { transform: translate(60px, 252px); transition: transform 1s cubic-bezier(.5,0,.2,1); }
  .w1map-seg { opacity: 0; transition: opacity .7s ease .25s; }
  .w1map-read { position: absolute; left: 14px; bottom: 14px; margin: 0; display: grid; }
  .w1map-read span { grid-area: 1 / 1; padding: 7px 12px; border-radius: 8px; background: var(--w1map-chip); color: var(--w1map-chipink); font-size: 13px; font-weight: 600;
    opacity: 0; transform: translateY(6px); transition: opacity .4s ease, transform .4s ease; }
  .w1map[data-step="1"] .w1map-read span:nth-child(1), .w1map[data-step="2"] .w1map-read span:nth-child(2),
  .w1map[data-step="3"] .w1map-read span:nth-child(3), .w1map[data-step="4"] .w1map-read span:nth-child(4) { opacity: 1; transform: none; }
  .w1map[data-step="2"] .w1map-pan { transform: translate(-40px, -45px) scale(1.3); }
  .w1map[data-step="3"] .w1map-pan { transform: translate(-120px, 0) scale(1.3); }
  .w1map[data-step="4"] .w1map-pan { transform: none; }
  .w1map[data-step="2"] .w1map-pin { transform: translate(185px, 150px); }
  .w1map[data-step="3"] .w1map-pin { transform: translate(300px, 80px); }
  .w1map[data-step="4"] .w1map-pin { transform: translate(345px, 240px); }
  .w1map[data-step="2"] .w1map-s1, .w1map[data-step="3"] .w1map-s1, .w1map[data-step="3"] .w1map-s2, .w1map[data-step="4"] .w1map-seg { opacity: 1; }
`;

export default function WalkingRouteGrowsAcrossPinnedMap() {
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
    <section className="w1map" ref={rootRef} data-w1map="" data-step="1" tabIndex="0" aria-label="The Hollins Round walking route, scrollable">
        <style>{STYLES}</style>
      <div className="w1map-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w1map-grid">
        <div className="w1map-vis">
          <div className="w1map-frame" role="img" aria-label="Map of the Hollins Round: from Alder Gate car park north-east to Fernwater tarn, up to Hollins Top, then south down to the Mill Inn.">
            <svg className="w1map-svg" viewBox="0 0 400 300" aria-hidden="true">
              <g className="w1map-pan">
                <rect width="400" height="300" fill="#e7e2cf"></rect>
                <path d="M0 40 C60 20 110 60 150 30 C170 15 190 0 200 0 L0 0Z M300 300 C320 260 370 270 400 250 L400 300Z M0 180 C30 170 40 210 20 230 C10 240 0 236 0 236Z" fill="#cfd6ba"></path>
                <g fill="none" stroke="#d2c7a8" strokeWidth="1.2">
                  <ellipse cx="300" cy="84" rx="34" ry="22"></ellipse>
                  <ellipse cx="300" cy="88" rx="62" ry="42"></ellipse>
                  <ellipse cx="296" cy="94" rx="94" ry="64"></ellipse>
                  <ellipse cx="290" cy="100" rx="128" ry="90"></ellipse>
                </g>
                <path d="M232 112 C244 150 250 190 238 230 C228 262 236 286 244 300" fill="none" stroke="#9fb6b8" strokeWidth="2.4"></path>
                <ellipse cx="214" cy="98" rx="36" ry="18" fill="#adc2c2"></ellipse>
                <path d="M60 252 C90 220 120 200 185 150 C220 130 250 120 300 80 C330 120 360 170 345 240" fill="none" stroke="#a89c80" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round"></path>
                <path className="w1map-seg w1map-s1" d="M60 252 C90 220 120 200 185 150" fill="none" stroke="#a3441f" strokeWidth="4" strokeLinecap="round"></path>
                <path className="w1map-seg w1map-s2" d="M185 150 C220 130 250 120 300 80" fill="none" stroke="#a3441f" strokeWidth="4" strokeLinecap="round"></path>
                <path className="w1map-seg w1map-s3" d="M300 80 C330 120 360 170 345 240" fill="none" stroke="#a3441f" strokeWidth="4" strokeLinecap="round"></path>
                <g fill="#fbfcf7" stroke="#20271f" strokeWidth="2">
                  <circle cx="60" cy="252" r="5"></circle><circle cx="185" cy="150" r="5"></circle><circle cx="300" cy="80" r="5"></circle><circle cx="345" cy="240" r="5"></circle>
                </g>
                <g fontSize="10" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="600" fill="#20271f">
                  <text x="72" y="268">Alder Gate</text><text x="120" y="172">Fernwater</text><text x="312" y="70">Hollins Top</text><text x="290" y="262">Mill Inn</text>
                </g>
                <g className="w1map-pin"><path d="M0 0 C-3 -8 -10 -12 -10 -20 A10 10 0 0 1 10 -20 C10 -12 3 -8 0 0Z" fill="#20271f"></path><circle cy="-20" r="3.6" fill="#f2f3ec"></circle></g>
              </g>
              <g transform="translate(332 22)" fill="none" stroke="#20271f" strokeWidth="1.4"><circle r="13" fill="#fbfcf7" fillOpacity=".8"></circle><path d="M0 -9 L4 3 L0 1 L-4 3Z" fill="#20271f"></path></g>
            </svg>
            <p className="w1map-read" aria-hidden="true"><span>Alder Gate, 0 km</span><span>Fernwater, 4.2 km</span><span>Hollins Top, 8.9 km</span><span>Mill Inn, 14.1 km</span></p>
          </div>
        </div>
        <div className="w1map-col">
          <header className="w1map-head" data-i="1"><p className="w1map-eyebrow">Fellside Guiding</p><h2 className="w1map-h">The Hollins Round, one stop at a time</h2><p className="w1map-lede">A full-day guided walk over the fells. Scroll and the map follows the group from the car park to the inn.</p></header>
          <ol className="w1map-steps">
          <li className="w1map-step" data-i="1"><div className="w1map-card"><p className="w1map-when">Start, 9:00</p><h3>Alder Gate car park</h3><p>Boots on and maps out by the gate. The first hour follows an old drovers' track through birch and bracken, climbing gently.</p></div></li>
          <li className="w1map-step" data-i="2"><div className="w1map-card"><p className="w1map-when">4.2 km</p><h3>Lunch at Fernwater</h3><p>The track levels out beside a small tarn. We stop on the flat rocks at its southern end, out of the westerly wind.</p></div></li>
          <li className="w1map-step" data-i="3"><div className="w1map-card"><p className="w1map-when">8.9 km</p><h3>Hollins Top</h3><p>The steepest pull of the day, a stepped path up to the cairn. On a clear afternoon the coast shows as a pale line to the west.</p></div></li>
          <li className="w1map-step" data-i="4"><div className="w1map-card"><p className="w1map-when">14.1 km, about 16:30</p><h3>Down to the Mill Inn</h3><p>A long, easy descent on the east shoulder ends at the inn by the river, where the minibus waits to take everyone back.</p></div></li>
          </ol>
        </div>
      </div>
      <div className="w1map-end"><p>Groups of eight, Saturdays from May to September.</p><a href="#" className="w1map-btn">Book a place</a></div>
    </section>
  );
}

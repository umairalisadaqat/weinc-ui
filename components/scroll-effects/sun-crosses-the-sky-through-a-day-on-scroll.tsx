import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version; the first CSS comment names the values to change.
const STYLES = `
  /* Change these: the colours below, --w1sky-box (box height), and the rotate() angle of .w1sky-arm and the boat translateX() for each data-step. */
  .w1sky { --w1sky-bg: #f3efe7; --w1sky-ink: #1d2830; --w1sky-soft: #4b5862; --w1sky-accent: #1b5a75; --w1sky-btnink: #fff; --w1sky-card: #fffdf9;
    --w1sky-line: #e2dbcd; --w1sky-panel: #8fa7c0; --w1sky-chip: rgba(29,40,48,.86); --w1sky-chipink: #fff;
    --w1sky-display: Georgia, "Iowan Old Style", serif; --w1sky-dw: 400; --w1sky-r: 22px; }
  .w1sky { --w1sky-box: 640px; height: var(--w1sky-box); overflow-y: auto; overflow-x: hidden; position: relative;
    background: var(--w1sky-bg); color: var(--w1sky-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; scrollbar-width: thin; }
  /* On a normal page: delete height and overflow above, set --w1sky-box: 100vh, and in the script use root: null. */
  .w1sky:focus-visible { outline: 3px solid var(--w1sky-accent); outline-offset: -3px; }
  .w1sky-hint { position: sticky; top: 0; height: 0; z-index: 5; display: flex; align-items: flex-start; justify-content: flex-end; pointer-events: none; }
  .w1sky-hint span { margin: 12px 12px 0 0; padding: 5px 12px; border-radius: 999px; background: var(--w1sky-chip); color: var(--w1sky-chipink);
    font-size: 12px; letter-spacing: .04em; transition: opacity .5s ease; }
  .w1sky[data-touched] .w1sky-hint span { opacity: 0; }
  .w1sky-grid { max-width: 72rem; margin: 0 auto; padding: 0 32px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 0 56px; }
  .w1sky[data-side="left"] .w1sky-grid { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); }
  .w1sky-vis { grid-column: 2; grid-row: 1; align-self: start; position: sticky; top: 0; z-index: 1; height: var(--w1sky-box);
    box-sizing: border-box; padding: 28px 0; display: flex; align-items: center; justify-content: center; }
  .w1sky[data-side="left"] .w1sky-vis { grid-column: 1; }
  .w1sky[data-side="left"] .w1sky-col { grid-column: 2; }
  .w1sky-frame { position: relative; width: min(100%, calc((var(--w1sky-box) - 56px) * 1.25)); aspect-ratio: 1.25; overflow: hidden;
    border-radius: var(--w1sky-r, 18px); background: var(--w1sky-panel);
    box-shadow: 0 1px 2px rgba(0,0,0,.08), 0 28px 56px -28px rgba(0,0,0,.35); }
  .w1sky-col { grid-column: 1; grid-row: 1; position: relative; z-index: 2; min-width: 0; }
  .w1sky-head { padding: 56px 0 8px; }
  .w1sky-eyebrow { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--w1sky-accent); }
  .w1sky-h { margin: 12px 0 0; font-family: var(--w1sky-display); font-weight: var(--w1sky-dw, 600); font-size: clamp(1.75rem, 3.6vw, 2.6rem); line-height: 1.1; letter-spacing: -.02em; }
  .w1sky-lede { margin: 14px 0 0; max-width: 30rem; font-size: 1.0625rem; line-height: 1.6; color: var(--w1sky-soft); }
  .w1sky-steps { list-style: none; margin: 0; padding: 0 0 calc(var(--w1sky-box) * .42); }
  .w1sky-step { min-height: calc(var(--w1sky-box) * .62); display: flex; align-items: center; }
  .w1sky-card { box-sizing: border-box; width: 100%; padding: 22px 24px; border-radius: 14px; background: var(--w1sky-card); border: 1px solid var(--w1sky-line);
    opacity: .55; transition: opacity .45s ease; }
  .w1sky[data-step="1"] .w1sky-step[data-i="1"] .w1sky-card,
  .w1sky[data-step="2"] .w1sky-step[data-i="2"] .w1sky-card,
  .w1sky[data-step="3"] .w1sky-step[data-i="3"] .w1sky-card,
  .w1sky[data-step="4"] .w1sky-step[data-i="4"] .w1sky-card { opacity: 1; }
  .w1sky-when { margin: 0; font-size: .8125rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--w1sky-accent); }
  .w1sky-card h3 { margin: 6px 0 0; font-size: 1.375rem; line-height: 1.25; font-weight: 650; }
  .w1sky-card h3 + p { margin: 8px 0 0; font-size: 1rem; line-height: 1.6; color: var(--w1sky-soft); }
  .w1sky-end { max-width: 72rem; margin: 0 auto; padding: 48px 32px 64px; display: flex; flex-wrap: wrap; gap: 16px 24px; align-items: center; justify-content: space-between; border-top: 1px solid var(--w1sky-line); }
  .w1sky-end p { margin: 0; font-size: 1.0625rem; }
  .w1sky-btn { display: inline-flex; min-height: 46px; align-items: center; padding: 0 22px; border-radius: 999px; background: var(--w1sky-accent);
    color: var(--w1sky-btnink); font-weight: 600; font-size: .9375rem; text-decoration: none; transition: transform .2s ease; }
  .w1sky-btn:hover { transform: translateY(-1px); }
  .w1sky-btn:focus-visible { outline: 3px solid var(--w1sky-ink); outline-offset: 3px; }
  /* Phones: the visual pins at the top and the steps scroll up over it on solid cards. */
  @media (max-width: 760px) {
    .w1sky-grid, .w1sky[data-side="left"] .w1sky-grid { grid-template-columns: minmax(0, 1fr); padding: 0 16px; }
    .w1sky-vis, .w1sky[data-side="left"] .w1sky-vis { grid-column: 1; grid-row: 2; height: 290px; padding: 12px 0; background: var(--w1sky-bg); }
    .w1sky-frame { width: min(100%, calc(262px * 1.25)); }
    .w1sky-col, .w1sky[data-side="left"] .w1sky-col { display: contents; }
    .w1sky-head { grid-row: 1; padding: 36px 0 4px; }
    .w1sky-steps { grid-row: 3; position: relative; z-index: 2; }
    .w1sky-step { min-height: calc(var(--w1sky-box) * .5); align-items: flex-end; }
    .w1sky-card { opacity: 1; box-shadow: 0 14px 34px -16px rgba(0,0,0,.4); }
    .w1sky-end { padding: 40px 16px 56px; }
  }
  /* Reduced motion: nothing pins, the steps read as a plain list and the visual shows its final state. */
  @media (prefers-reduced-motion: reduce) {
    .w1sky-vis, .w1sky[data-side="left"] .w1sky-vis { position: relative; height: auto; }
    .w1sky-step { min-height: 0; padding: 8px 0; }
    .w1sky-steps { padding-bottom: 32px; }
    .w1sky .w1sky-card { opacity: 1; }
    .w1sky *, .w1sky *::before { transition: none !important; }
  }
  .w1sky-sky { position: absolute; inset: 0; opacity: 0; transition: opacity 1s ease; }
  .w1sky-l1 { background: linear-gradient(#7f98b6, #e8bf9c 70%); opacity: 1; }
  .w1sky-l2 { background: linear-gradient(#a9cde4, #eef4f2 72%); }
  .w1sky-l3 { background: linear-gradient(#7fb4d8, #d6eaf3 72%); }
  .w1sky-l4 { background: linear-gradient(#3f4f7a, #e58a57 72%); }
  .w1sky[data-step="2"] .w1sky-l2, .w1sky[data-step="3"] .w1sky-l3, .w1sky[data-step="4"] .w1sky-l4 { opacity: 1; }
  .w1sky-arm { position: absolute; left: 50%; top: 72%; width: 0; height: 0; transform: rotate(-74deg); transition: transform 1.3s cubic-bezier(.5,0,.25,1); }
  .w1sky-sun { position: absolute; left: -26px; top: -26px; width: 52px; height: 52px; border-radius: 50%; background: radial-gradient(circle, #fff6dc 30%, #ffd98c 60%, rgba(255,210,130,0) 72%); }
  .w1sky-frame { container-type: inline-size; }
  .w1sky-sun { transform: translateY(-46cqi); }
  .w1sky[data-step="2"] .w1sky-arm { transform: rotate(-30deg); }
  .w1sky[data-step="3"] .w1sky-arm { transform: rotate(14deg); }
  .w1sky[data-step="4"] .w1sky-arm { transform: rotate(64deg); }
  .w1sky-sea { position: absolute; left: 0; right: 0; top: 72%; bottom: 0; background: linear-gradient(#2c6a86, #1d4c63); }
  .w1sky-sea::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 2px; background: rgba(255,255,255,.35); }
  .w1sky-dusk { position: absolute; inset: 0; background: linear-gradient(#5a3f52, #1a2a3c); opacity: 0; transition: opacity 1s ease; }
  .w1sky[data-step="4"] .w1sky-dusk { opacity: .7; }
  .w1sky-boat { position: absolute; left: 8%; top: -22px; width: 54px; transform: translateX(0); transition: transform 1.3s cubic-bezier(.5,0,.25,1); }
  .w1sky[data-step="2"] .w1sky-boat { transform: translateX(16cqi); }
  .w1sky[data-step="3"] .w1sky-boat { transform: translateX(52cqi); }
  .w1sky[data-step="4"] .w1sky-boat { transform: translateX(22cqi); }
  .w1sky-time { position: absolute; left: 18px; top: 14px; margin: 0; display: grid; }
  .w1sky-time span { grid-area: 1 / 1; padding: 6px 12px; border-radius: 999px; background: var(--w1sky-chip); color: var(--w1sky-chipink);
    font: 600 15px/1.2 ui-monospace, "SF Mono", Menlo, monospace; opacity: 0; transition: opacity .4s ease; }
  .w1sky[data-step="1"] .w1sky-time span:nth-child(1), .w1sky[data-step="2"] .w1sky-time span:nth-child(2),
  .w1sky[data-step="3"] .w1sky-time span:nth-child(3), .w1sky[data-step="4"] .w1sky-time span:nth-child(4) { opacity: 1; }
`;

export default function SunCrossesTheSkyThroughADayOnScroll() {
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
    <section className="w1sky" ref={rootRef} data-w1sky="" data-step="1" tabIndex="0" aria-label="A day on the boat Kittiwake, scrollable">
        <style>{STYLES}</style>
      <div className="w1sky-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w1sky-grid">
        <div className="w1sky-vis">
          <div className="w1sky-frame" role="img" aria-label="A painted seascape. The sun rises low on the left at 5:30, stands high at 9:00 and 13:00, and sets on the right at 17:30 while a small boat crosses the bay.">
            <div className="w1sky-sky w1sky-l1"></div><div className="w1sky-sky w1sky-l2"></div><div className="w1sky-sky w1sky-l3"></div><div className="w1sky-sky w1sky-l4"></div>
            <div className="w1sky-arm" aria-hidden="true"><span className="w1sky-sun"></span></div>
            <div className="w1sky-sea" aria-hidden="true"><span className="w1sky-dusk"></span>
              <svg className="w1sky-boat" viewBox="0 0 60 40"><path d="M6 28 H54 L47 36 H12Z" fill="#1d2830"></path><path d="M29 4 V27 M29 6 L44 25 H29Z" fill="#f3efe7" stroke="#1d2830" strokeWidth="1.5"></path></svg>
            </div>
            <p className="w1sky-time" aria-hidden="true"><span>05:30</span><span>09:00</span><span>13:00</span><span>17:30</span></p>
          </div>
        </div>
        <div className="w1sky-col">
          <header className="w1sky-head" data-i="1"><p className="w1sky-eyebrow">Hartness Bay Sea Trips</p><h2 className="w1sky-h">A day aboard the Kittiwake</h2><p className="w1sky-lede">Our full-day trip leaves before sunrise and comes home with the light going. Scroll through the hours.</p></header>
          <ol className="w1sky-steps">
          <li className="w1sky-step" data-i="1"><div className="w1sky-card"><p className="w1sky-when">05:30</p><h3>Cast off in the half light</h3><p>Coffee in the wheelhouse as we clear the harbour wall. Gulls follow the boat out and the town is still asleep behind us.</p></div></li>
          <li className="w1sky-step" data-i="2"><div className="w1sky-card"><p className="w1sky-when">09:00</p><h3>Lines down over the mackerel ground</h3><p>Two miles out, where the sea floor drops away. Rods are on board for everyone, and the crew shows first-timers how to feel a bite.</p></div></li>
          <li className="w1sky-step" data-i="3"><div className="w1sky-card"><p className="w1sky-when">13:00</p><h3>Lunch at anchor in Ketch Cove</h3><p>A sheltered bay with seals on the rocks. Whatever was caught that morning goes on the grill, with bread and salad from the galley.</p></div></li>
          <li className="w1sky-step" data-i="4"><div className="w1sky-card"><p className="w1sky-when">17:30</p><h3>Home on the evening tide</h3><p>The run back faces the setting sun. We tie up at the quay as the lights come on along the front.</p></div></li>
          </ol>
        </div>
      </div>
      <div className="w1sky-end"><p>Twelve guests at most, life jackets and rods provided.</p><a href="#" className="w1sky-btn">Book the day trip</a></div>
    </section>
  );
}

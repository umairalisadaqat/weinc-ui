import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version; the first CSS comment names the values to change.
const STYLES = `
  /* Change these: the colours below, --w1wks-box (box height), and the four season colours in .w1wks-q1 to .w1wks-q4 and the 0.035s stagger per week. */
  .w1wks { --w1wks-bg: #f4f0e6; --w1wks-ink: #23281e; --w1wks-soft: #50574a; --w1wks-accent: #3d6833; --w1wks-btnink: #fff; --w1wks-card: #fffdf7;
    --w1wks-line: #e0dacb; --w1wks-panel: #fffdf7; --w1wks-chip: rgba(35,40,30,.86); --w1wks-chipink: #f4f0e6;
    --w1wks-display: Georgia, "Iowan Old Style", serif; --w1wks-dw: 400; --w1wks-r: 16px; }
  .w1wks { --w1wks-box: 640px; height: var(--w1wks-box); overflow-y: auto; overflow-x: hidden; position: relative;
    background: var(--w1wks-bg); color: var(--w1wks-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; scrollbar-width: thin; }
  /* On a normal page: delete height and overflow above, set --w1wks-box: 100vh, and in the script use root: null. */
  .w1wks:focus-visible { outline: 3px solid var(--w1wks-accent); outline-offset: -3px; }
  .w1wks-hint { position: sticky; top: 0; height: 0; z-index: 5; display: flex; align-items: flex-start; justify-content: flex-end; pointer-events: none; }
  .w1wks-hint span { margin: 12px 12px 0 0; padding: 5px 12px; border-radius: 999px; background: var(--w1wks-chip); color: var(--w1wks-chipink);
    font-size: 12px; letter-spacing: .04em; transition: opacity .5s ease; }
  .w1wks[data-touched] .w1wks-hint span { opacity: 0; }
  .w1wks-grid { max-width: 72rem; margin: 0 auto; padding: 0 32px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 0 56px; }
  .w1wks[data-side="left"] .w1wks-grid { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); }
  .w1wks-vis { grid-column: 2; grid-row: 1; align-self: start; position: sticky; top: 0; z-index: 1; height: var(--w1wks-box);
    box-sizing: border-box; padding: 28px 0; display: flex; align-items: center; justify-content: center; }
  .w1wks[data-side="left"] .w1wks-vis { grid-column: 1; }
  .w1wks[data-side="left"] .w1wks-col { grid-column: 2; }
  .w1wks-frame { position: relative; width: min(100%, calc((var(--w1wks-box) - 56px) * 1.3)); aspect-ratio: 1.3; overflow: hidden;
    border-radius: var(--w1wks-r, 18px); background: var(--w1wks-panel);
    box-shadow: 0 1px 2px rgba(0,0,0,.08), 0 28px 56px -28px rgba(0,0,0,.35); }
  .w1wks-col { grid-column: 1; grid-row: 1; position: relative; z-index: 2; min-width: 0; }
  .w1wks-head { padding: 56px 0 8px; }
  .w1wks-eyebrow { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--w1wks-accent); }
  .w1wks-h { margin: 12px 0 0; font-family: var(--w1wks-display); font-weight: var(--w1wks-dw, 600); font-size: clamp(1.75rem, 3.6vw, 2.6rem); line-height: 1.1; letter-spacing: -.02em; }
  .w1wks-lede { margin: 14px 0 0; max-width: 30rem; font-size: 1.0625rem; line-height: 1.6; color: var(--w1wks-soft); }
  .w1wks-steps { list-style: none; margin: 0; padding: 0 0 calc(var(--w1wks-box) * .42); }
  .w1wks-step { min-height: calc(var(--w1wks-box) * .62); display: flex; align-items: center; }
  .w1wks-card { box-sizing: border-box; width: 100%; padding: 22px 24px; border-radius: 14px; background: var(--w1wks-card); border: 1px solid var(--w1wks-line);
    opacity: .55; transition: opacity .45s ease; }
  .w1wks[data-step="1"] .w1wks-step[data-i="1"] .w1wks-card,
  .w1wks[data-step="2"] .w1wks-step[data-i="2"] .w1wks-card,
  .w1wks[data-step="3"] .w1wks-step[data-i="3"] .w1wks-card,
  .w1wks[data-step="4"] .w1wks-step[data-i="4"] .w1wks-card { opacity: 1; }
  .w1wks-when { margin: 0; font-size: .8125rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--w1wks-accent); }
  .w1wks-card h3 { margin: 6px 0 0; font-size: 1.375rem; line-height: 1.25; font-weight: 650; }
  .w1wks-card h3 + p { margin: 8px 0 0; font-size: 1rem; line-height: 1.6; color: var(--w1wks-soft); }
  .w1wks-end { max-width: 72rem; margin: 0 auto; padding: 48px 32px 64px; display: flex; flex-wrap: wrap; gap: 16px 24px; align-items: center; justify-content: space-between; border-top: 1px solid var(--w1wks-line); }
  .w1wks-end p { margin: 0; font-size: 1.0625rem; }
  .w1wks-btn { display: inline-flex; min-height: 46px; align-items: center; padding: 0 22px; border-radius: 999px; background: var(--w1wks-accent);
    color: var(--w1wks-btnink); font-weight: 600; font-size: .9375rem; text-decoration: none; transition: transform .2s ease; }
  .w1wks-btn:hover { transform: translateY(-1px); }
  .w1wks-btn:focus-visible { outline: 3px solid var(--w1wks-ink); outline-offset: 3px; }
  /* Phones: the visual pins at the top and the steps scroll up over it on solid cards. */
  @media (max-width: 760px) {
    .w1wks-grid, .w1wks[data-side="left"] .w1wks-grid { grid-template-columns: minmax(0, 1fr); padding: 0 16px; }
    .w1wks-vis, .w1wks[data-side="left"] .w1wks-vis { grid-column: 1; grid-row: 2; height: 300px; padding: 12px 0; background: var(--w1wks-bg); }
    .w1wks-frame { width: min(100%, calc(272px * 1.3)); }
    .w1wks-col, .w1wks[data-side="left"] .w1wks-col { display: contents; }
    .w1wks-head { grid-row: 1; padding: 36px 0 4px; }
    .w1wks-steps { grid-row: 3; position: relative; z-index: 2; }
    .w1wks-step { min-height: calc(var(--w1wks-box) * .5); align-items: flex-end; }
    .w1wks-card { opacity: 1; box-shadow: 0 14px 34px -16px rgba(0,0,0,.4); }
    .w1wks-end { padding: 40px 16px 56px; }
  }
  /* Reduced motion: nothing pins, the steps read as a plain list and the visual shows its final state. */
  @media (prefers-reduced-motion: reduce) {
    .w1wks-vis, .w1wks[data-side="left"] .w1wks-vis { position: relative; height: auto; }
    .w1wks-step { min-height: 0; padding: 8px 0; }
    .w1wks-steps { padding-bottom: 32px; }
    .w1wks .w1wks-card { opacity: 1; }
    .w1wks *, .w1wks *::before { transition: none !important; }
  }
  .w1wks-frame { border: 1px solid var(--w1wks-line); }
  .w1wks-cal { position: absolute; inset: 0; padding: 6% 6%; display: grid; align-content: center; gap: 4.5%; container-type: inline-size; }
  .w1wks-row { display: grid; grid-template-columns: 22cqi 1fr; grid-template-rows: auto auto; gap: 4px 3cqi; align-items: center; }
  .w1wks-lab { margin: 0; grid-row: 1 / 3; display: grid; }
  .w1wks-lab b { font-family: Georgia, serif; font-weight: 400; font-size: clamp(14px, 4.6cqi, 22px); }
  .w1wks-lab span { font-size: clamp(10px, 2.6cqi, 12px); color: #5c6455; letter-spacing: .04em; }
  .w1wks-cells { display: grid; grid-template-columns: repeat(13, 1fr); gap: .9cqi; }
  .w1wks-cells i { aspect-ratio: 1; border-radius: 3px; background: #ece7da; position: relative; overflow: hidden; }
  .w1wks-cells i::after { content: ""; position: absolute; inset: 0; background: var(--w1wks-c); opacity: 0; transform: scale(.4);
    transition: opacity .35s ease var(--d), transform .5s cubic-bezier(.3,1.4,.5,1) var(--d); border-radius: 3px; }
  .w1wks-crop { margin: 0; font-size: clamp(10px, 2.6cqi, 13px); color: #50574a; opacity: 0; transition: opacity .4s ease .4s; }
  .w1wks-q1 { --w1wks-c: #7fa75a; } .w1wks-q2 { --w1wks-c: #d99a2b; } .w1wks-q3 { --w1wks-c: #b45a2a; } .w1wks-q4 { --w1wks-c: #5f7f95; }
  .w1wks[data-step="1"] .w1wks-q1 i::after, .w1wks[data-step="2"] .w1wks-q1 i::after, .w1wks[data-step="2"] .w1wks-q2 i::after,
  .w1wks[data-step="3"] .w1wks-row:not(.w1wks-q4) i::after, .w1wks[data-step="4"] .w1wks-row i::after { opacity: 1; transform: none; }
  .w1wks[data-step="1"] .w1wks-q1 .w1wks-crop, .w1wks[data-step="2"] .w1wks-q1 .w1wks-crop, .w1wks[data-step="2"] .w1wks-q2 .w1wks-crop,
  .w1wks[data-step="3"] .w1wks-row:not(.w1wks-q4) .w1wks-crop, .w1wks[data-step="4"] .w1wks-crop { opacity: 1; }
  @media (prefers-reduced-motion: reduce) { .w1wks .w1wks-cells i::after { transition: none; } }
`;

export default function YearOfWeeksFillsSeasonBySeasonOnScroll() {
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
    <section className="w1wks" ref={rootRef} data-w1wks="" data-step="1" data-side="left" tabIndex="0" aria-label="A year of Oak Row Farm veg boxes, scrollable">
        <style>{STYLES}</style>
      <div className="w1wks-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w1wks-grid">
        <div className="w1wks-vis">
          <div className="w1wks-frame" role="img" aria-label="A calendar of 52 weekly boxes in four rows. Spring, March to May: asparagus, radish, wild garlic. Summer, June to August: beans, courgettes, tomatoes. Autumn, September to November: squash, apples, leeks. Winter, December to February: kale, parsnips, stored roots.">
            <div className="w1wks-cal" aria-hidden="true">
            <div className="w1wks-row w1wks-q1"><p className="w1wks-lab"><b>Spring</b><span>Mar to May</span></p><div className="w1wks-cells"><i style={{ "--d": "0.000s" } as any}></i><i style={{ "--d": "0.035s" } as any}></i><i style={{ "--d": "0.070s" } as any}></i><i style={{ "--d": "0.105s" } as any}></i><i style={{ "--d": "0.140s" } as any}></i><i style={{ "--d": "0.175s" } as any}></i><i style={{ "--d": "0.210s" } as any}></i><i style={{ "--d": "0.245s" } as any}></i><i style={{ "--d": "0.280s" } as any}></i><i style={{ "--d": "0.315s" } as any}></i><i style={{ "--d": "0.350s" } as any}></i><i style={{ "--d": "0.385s" } as any}></i><i style={{ "--d": "0.420s" } as any}></i></div><p className="w1wks-crop">Asparagus, radish, wild garlic</p></div>
            <div className="w1wks-row w1wks-q2"><p className="w1wks-lab"><b>Summer</b><span>Jun to Aug</span></p><div className="w1wks-cells"><i style={{ "--d": "0.000s" } as any}></i><i style={{ "--d": "0.035s" } as any}></i><i style={{ "--d": "0.070s" } as any}></i><i style={{ "--d": "0.105s" } as any}></i><i style={{ "--d": "0.140s" } as any}></i><i style={{ "--d": "0.175s" } as any}></i><i style={{ "--d": "0.210s" } as any}></i><i style={{ "--d": "0.245s" } as any}></i><i style={{ "--d": "0.280s" } as any}></i><i style={{ "--d": "0.315s" } as any}></i><i style={{ "--d": "0.350s" } as any}></i><i style={{ "--d": "0.385s" } as any}></i><i style={{ "--d": "0.420s" } as any}></i></div><p className="w1wks-crop">Beans, courgettes, tomatoes</p></div>
            <div className="w1wks-row w1wks-q3"><p className="w1wks-lab"><b>Autumn</b><span>Sep to Nov</span></p><div className="w1wks-cells"><i style={{ "--d": "0.000s" } as any}></i><i style={{ "--d": "0.035s" } as any}></i><i style={{ "--d": "0.070s" } as any}></i><i style={{ "--d": "0.105s" } as any}></i><i style={{ "--d": "0.140s" } as any}></i><i style={{ "--d": "0.175s" } as any}></i><i style={{ "--d": "0.210s" } as any}></i><i style={{ "--d": "0.245s" } as any}></i><i style={{ "--d": "0.280s" } as any}></i><i style={{ "--d": "0.315s" } as any}></i><i style={{ "--d": "0.350s" } as any}></i><i style={{ "--d": "0.385s" } as any}></i><i style={{ "--d": "0.420s" } as any}></i></div><p className="w1wks-crop">Squash, apples, leeks</p></div>
            <div className="w1wks-row w1wks-q4"><p className="w1wks-lab"><b>Winter</b><span>Dec to Feb</span></p><div className="w1wks-cells"><i style={{ "--d": "0.000s" } as any}></i><i style={{ "--d": "0.035s" } as any}></i><i style={{ "--d": "0.070s" } as any}></i><i style={{ "--d": "0.105s" } as any}></i><i style={{ "--d": "0.140s" } as any}></i><i style={{ "--d": "0.175s" } as any}></i><i style={{ "--d": "0.210s" } as any}></i><i style={{ "--d": "0.245s" } as any}></i><i style={{ "--d": "0.280s" } as any}></i><i style={{ "--d": "0.315s" } as any}></i><i style={{ "--d": "0.350s" } as any}></i><i style={{ "--d": "0.385s" } as any}></i><i style={{ "--d": "0.420s" } as any}></i></div><p className="w1wks-crop">Kale, parsnips, stored roots</p></div>
            </div>
          </div>
        </div>
        <div className="w1wks-col">
          <header className="w1wks-head" data-i="1"><p className="w1wks-eyebrow">Oak Row Farm</p><h2 className="w1wks-h">Fifty-two boxes, four seasons</h2><p className="w1wks-lede">A veg box subscription follows the field, not the supermarket. Scroll and the year fills in, one square per weekly box.</p></header>
          <ol className="w1wks-steps">
          <li className="w1wks-step" data-i="1"><div className="w1wks-card"><p className="w1wks-when">Spring</p><h3>The hungry gap ends</h3><p>Thirteen boxes from March. The first are lean, with stored potatoes and forced rhubarb, then asparagus and radishes arrive in a rush.</p></div></li>
          <li className="w1wks-step" data-i="2"><div className="w1wks-card"><p className="w1wks-when">Summer</p><h3>More than fits in the box</h3><p>Beans, courgettes and tomatoes by the crate. We add a recipe card most weeks, because nobody plans for that many courgettes.</p></div></li>
          <li className="w1wks-step" data-i="3"><div className="w1wks-card"><p className="w1wks-when">Autumn</p><h3>The heavy boxes</h3><p>Squash, apples from the old orchard and the first leeks. These are the weeks the box needs both hands.</p></div></li>
          <li className="w1wks-step" data-i="4"><div className="w1wks-card"><p className="w1wks-when">Winter</p><h3>Roots, greens and the store</h3><p>Kale and parsnips straight from frozen ground, plus onions and squash kept back from autumn. Every week of the year is covered.</p></div></li>
          </ol>
        </div>
      </div>
      <div className="w1wks-end"><p>Skip any week from your account, up to the Friday before.</p><a href="#" className="w1wks-btn">Start a box</a></div>
    </section>
  );
}

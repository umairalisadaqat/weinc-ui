import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version; the first CSS comment names the values to change.
const STYLES = `
  /* Change these: the colours below, --w1lyr-box (box height), and the translateY() gaps for each plate per data-step and the plate colours in .w1lyr-face, .w1lyr-mem, .w1lyr-lin. */
  .w1lyr { --w1lyr-bg: #1c1e21; --w1lyr-ink: #eceae6; --w1lyr-soft: #b6b3ad; --w1lyr-accent: #e0874f; --w1lyr-btnink: #1c1208; --w1lyr-card: #25282c;
    --w1lyr-line: #34383e; --w1lyr-panel: #212428; --w1lyr-chip: rgba(236,234,230,.92); --w1lyr-chipink: #1c1e21;
    --w1lyr-display: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; --w1lyr-dw: 700; --w1lyr-r: 10px; }
  .w1lyr { --w1lyr-box: 640px; height: var(--w1lyr-box); overflow-y: auto; overflow-x: hidden; position: relative;
    background: var(--w1lyr-bg); color: var(--w1lyr-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; scrollbar-width: thin; }
  /* On a normal page: delete height and overflow above, set --w1lyr-box: 100vh, and in the script use root: null. */
  .w1lyr:focus-visible { outline: 3px solid var(--w1lyr-accent); outline-offset: -3px; }
  .w1lyr-hint { position: sticky; top: 0; height: 0; z-index: 5; display: flex; align-items: flex-start; justify-content: flex-end; pointer-events: none; }
  .w1lyr-hint span { margin: 12px 12px 0 0; padding: 5px 12px; border-radius: 999px; background: var(--w1lyr-chip); color: var(--w1lyr-chipink);
    font-size: 12px; letter-spacing: .04em; transition: opacity .5s ease; }
  .w1lyr[data-touched] .w1lyr-hint span { opacity: 0; }
  .w1lyr-grid { max-width: 72rem; margin: 0 auto; padding: 0 32px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 0 56px; }
  .w1lyr[data-side="left"] .w1lyr-grid { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); }
  .w1lyr-vis { grid-column: 2; grid-row: 1; align-self: start; position: sticky; top: 0; z-index: 1; height: var(--w1lyr-box);
    box-sizing: border-box; padding: 28px 0; display: flex; align-items: center; justify-content: center; }
  .w1lyr[data-side="left"] .w1lyr-vis { grid-column: 1; }
  .w1lyr[data-side="left"] .w1lyr-col { grid-column: 2; }
  .w1lyr-frame { position: relative; width: min(100%, calc((var(--w1lyr-box) - 56px) * 1.15)); aspect-ratio: 1.15; overflow: hidden;
    border-radius: var(--w1lyr-r, 18px); background: var(--w1lyr-panel);
    box-shadow: 0 1px 2px rgba(0,0,0,.08), 0 28px 56px -28px rgba(0,0,0,.35); }
  .w1lyr-col { grid-column: 1; grid-row: 1; position: relative; z-index: 2; min-width: 0; }
  .w1lyr-head { padding: 56px 0 8px; }
  .w1lyr-eyebrow { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--w1lyr-accent); }
  .w1lyr-h { margin: 12px 0 0; font-family: var(--w1lyr-display); font-weight: var(--w1lyr-dw, 600); font-size: clamp(1.75rem, 3.6vw, 2.6rem); line-height: 1.1; letter-spacing: -.02em; }
  .w1lyr-lede { margin: 14px 0 0; max-width: 30rem; font-size: 1.0625rem; line-height: 1.6; color: var(--w1lyr-soft); }
  .w1lyr-steps { list-style: none; margin: 0; padding: 0 0 calc(var(--w1lyr-box) * .42); }
  .w1lyr-step { min-height: calc(var(--w1lyr-box) * .62); display: flex; align-items: center; }
  .w1lyr-card { box-sizing: border-box; width: 100%; padding: 22px 24px; border-radius: 14px; background: var(--w1lyr-card); border: 1px solid var(--w1lyr-line);
    opacity: .55; transition: opacity .45s ease; }
  .w1lyr[data-step="1"] .w1lyr-step[data-i="1"] .w1lyr-card,
  .w1lyr[data-step="2"] .w1lyr-step[data-i="2"] .w1lyr-card,
  .w1lyr[data-step="3"] .w1lyr-step[data-i="3"] .w1lyr-card,
  .w1lyr[data-step="4"] .w1lyr-step[data-i="4"] .w1lyr-card { opacity: 1; }
  .w1lyr-when { margin: 0; font-size: .8125rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--w1lyr-accent); }
  .w1lyr-card h3 { margin: 6px 0 0; font-size: 1.375rem; line-height: 1.25; font-weight: 650; }
  .w1lyr-card h3 + p { margin: 8px 0 0; font-size: 1rem; line-height: 1.6; color: var(--w1lyr-soft); }
  .w1lyr-end { max-width: 72rem; margin: 0 auto; padding: 48px 32px 64px; display: flex; flex-wrap: wrap; gap: 16px 24px; align-items: center; justify-content: space-between; border-top: 1px solid var(--w1lyr-line); }
  .w1lyr-end p { margin: 0; font-size: 1.0625rem; }
  .w1lyr-btn { display: inline-flex; min-height: 46px; align-items: center; padding: 0 22px; border-radius: 999px; background: var(--w1lyr-accent);
    color: var(--w1lyr-btnink); font-weight: 600; font-size: .9375rem; text-decoration: none; transition: transform .2s ease; }
  .w1lyr-btn:hover { transform: translateY(-1px); }
  .w1lyr-btn:focus-visible { outline: 3px solid var(--w1lyr-ink); outline-offset: 3px; }
  /* Phones: the visual pins at the top and the steps scroll up over it on solid cards. */
  @media (max-width: 760px) {
    .w1lyr-grid, .w1lyr[data-side="left"] .w1lyr-grid { grid-template-columns: minmax(0, 1fr); padding: 0 16px; }
    .w1lyr-vis, .w1lyr[data-side="left"] .w1lyr-vis { grid-column: 1; grid-row: 2; height: 300px; padding: 12px 0; background: var(--w1lyr-bg); }
    .w1lyr-frame { width: min(100%, calc(272px * 1.15)); }
    .w1lyr-col, .w1lyr[data-side="left"] .w1lyr-col { display: contents; }
    .w1lyr-head { grid-row: 1; padding: 36px 0 4px; }
    .w1lyr-steps { grid-row: 3; position: relative; z-index: 2; }
    .w1lyr-step { min-height: calc(var(--w1lyr-box) * .5); align-items: flex-end; }
    .w1lyr-card { opacity: 1; box-shadow: 0 14px 34px -16px rgba(0,0,0,.4); }
    .w1lyr-end { padding: 40px 16px 56px; }
  }
  /* Reduced motion: nothing pins, the steps read as a plain list and the visual shows its final state. */
  @media (prefers-reduced-motion: reduce) {
    .w1lyr-vis, .w1lyr[data-side="left"] .w1lyr-vis { position: relative; height: auto; }
    .w1lyr-step { min-height: 0; padding: 8px 0; }
    .w1lyr-steps { padding-bottom: 32px; }
    .w1lyr .w1lyr-card { opacity: 1; }
    .w1lyr *, .w1lyr *::before { transition: none !important; }
  }
  .w1lyr-frame { background: radial-gradient(90% 70% at 50% 40%, #2b2f34, #1c1e21 75%); border: 1px solid var(--w1lyr-line); }
  .w1lyr-stage { position: absolute; inset: 0; container-type: size; }
  .w1lyr-pl { position: absolute; left: 44%; top: 50%; width: 0; height: 0; transition: transform 1s cubic-bezier(.55,0,.2,1), opacity .5s ease; }
  .w1lyr-plate { position: absolute; width: 42cqmin; height: 42cqmin; left: -21cqmin; top: -21cqmin; border-radius: 10px;
    transform: rotateX(58deg) rotateZ(-45deg); box-shadow: 0 30px 40px -18px rgba(0,0,0,.6); }
  .w1lyr-face { background: repeating-linear-gradient(0deg, rgba(0,0,0,.12) 0 1px, transparent 1px 9px), repeating-linear-gradient(90deg, rgba(0,0,0,.12) 0 1px, transparent 1px 9px), linear-gradient(135deg, #d06b35, #a94b20); }
  .w1lyr-mem { background: linear-gradient(135deg, rgba(230,236,242,.85), rgba(170,184,198,.7)); }
  .w1lyr-lin { background: repeating-linear-gradient(45deg, rgba(255,255,255,.07) 0 2px, transparent 2px 7px), linear-gradient(135deg, #59636e, #3c444d); }
  .w1lyr-tag { position: absolute; left: 25cqmin; top: -10px; white-space: nowrap; padding: 4px 10px; border-radius: 999px; background: var(--w1lyr-chip); color: var(--w1lyr-chipink);
    font-size: 12px; font-weight: 700; opacity: 0; transform: translateX(-8px); transition: opacity .4s ease .3s, transform .5s ease .3s; }
  .w1lyr-p-face { z-index: 3; transform: translateY(-3cqmin); }
  .w1lyr-p-mem { z-index: 2; }
  .w1lyr-p-lin { z-index: 1; transform: translateY(3cqmin); }
  .w1lyr:not([data-step="1"]) .w1lyr-p-face { transform: translateY(-24cqmin); }
  .w1lyr:not([data-step="1"]) .w1lyr-p-lin { transform: translateY(24cqmin); }
  .w1lyr:not([data-step="1"]) .w1lyr-pl { opacity: .35; }
  .w1lyr:not([data-step="1"]) .w1lyr-tag { opacity: 1; transform: none; }
  .w1lyr[data-step="2"] .w1lyr-p-face, .w1lyr[data-step="3"] .w1lyr-p-mem, .w1lyr[data-step="4"] .w1lyr-p-lin { opacity: 1; }
  .w1lyr[data-step="2"] .w1lyr-p-face { transform: translateY(-28cqmin); }
  @media (prefers-reduced-motion: reduce) { .w1lyr .w1lyr-pl { opacity: 1; } }
`;

export default function JacketLayersSeparateIntoExplodedView() {
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
    <section className="w1lyr" ref={rootRef} data-w1lyr="" data-step="1" tabIndex="0" aria-label="Inside the Scar Fell shell jacket, scrollable">
        <style>{STYLES}</style>
      <div className="w1lyr-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w1lyr-grid">
        <div className="w1lyr-vis">
          <div className="w1lyr-frame" role="img" aria-label="Exploded diagram of a jacket fabric: a rust coloured ripstop face fabric on top, a thin pale membrane in the middle and a grey grid lining underneath.">
            <div className="w1lyr-stage" aria-hidden="true">
              <div className="w1lyr-pl w1lyr-p-face"><div className="w1lyr-plate w1lyr-face"></div><span className="w1lyr-tag">Face fabric</span></div>
              <div className="w1lyr-pl w1lyr-p-mem"><div className="w1lyr-plate w1lyr-mem"></div><span className="w1lyr-tag">Membrane</span></div>
              <div className="w1lyr-pl w1lyr-p-lin"><div className="w1lyr-plate w1lyr-lin"></div><span className="w1lyr-tag">Lining</span></div>
            </div>
          </div>
        </div>
        <div className="w1lyr-col">
          <header className="w1lyr-head" data-i="1"><p className="w1lyr-eyebrow">Bracken Outerwear</p><h2 className="w1lyr-h">Three layers, pulled apart</h2><p className="w1lyr-lede">The Scar Fell shell feels like one fabric. It is really three, bonded together. Scroll to separate them.</p></header>
          <ol className="w1lyr-steps">
          <li className="w1lyr-step" data-i="1"><div className="w1lyr-card"><p className="w1lyr-when">The shell</p><h3>One fabric, as far as you can tell</h3><p>Light enough to roll into a hip pack and stiff enough to keep its shape in a crosswind. The three layers are laminated, so nothing shifts or bunches.</p></div></li>
          <li className="w1lyr-step" data-i="2"><div className="w1lyr-card"><p className="w1lyr-when">Outside</p><h3>A ripstop face that sheds rain</h3><p>Tight nylon with a grid woven in, so a snag on a fence stops at the next line instead of running. The finish makes water bead and roll off.</p></div></li>
          <li className="w1lyr-step" data-i="3"><div className="w1lyr-card"><p className="w1lyr-when">Middle</p><h3>A membrane that breathes</h3><p>A thin film with pores far smaller than a raindrop but large enough for water vapour, so sweat gets out while weather stays out.</p></div></li>
          <li className="w1lyr-step" data-i="4"><div className="w1lyr-card"><p className="w1lyr-when">Inside</p><h3>A lining that does not cling</h3><p>A soft knit printed with a raised grid, which keeps the membrane off damp skin and slides easily over a fleece.</p></div></li>
          </ol>
        </div>
      </div>
      <div className="w1lyr-end"><p>Every seam is taped from the inside so rain cannot creep through the stitching.</p><a href="#" className="w1lyr-btn">Shop the Scar Fell</a></div>
    </section>
  );
}

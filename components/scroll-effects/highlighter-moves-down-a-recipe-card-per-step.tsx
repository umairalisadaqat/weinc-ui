import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version; the first CSS comment names the values to change.
const STYLES = `
  /* Change these: the colours below, --w1rec-box (box height), and the translateY() line offsets and scaleY() line counts on .w1rec-mark for each data-step. */
  .w1rec { --w1rec-bg: #ece4d4; --w1rec-ink: #2a2118; --w1rec-soft: #574838; --w1rec-accent: #2c4777; --w1rec-btnink: #fff; --w1rec-card: #fbf7ee;
    --w1rec-line: #dcd0ba; --w1rec-panel: #e3d8c3; --w1rec-chip: rgba(42,33,24,.86); --w1rec-chipink: #fbf7ee;
    --w1rec-display: Georgia, "Iowan Old Style", serif; --w1rec-dw: 400; --w1rec-r: 8px; --w1rec-lh: 7.4cqi; }
  .w1rec { --w1rec-box: 640px; height: var(--w1rec-box); overflow-y: auto; overflow-x: hidden; position: relative;
    background: var(--w1rec-bg); color: var(--w1rec-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; scrollbar-width: thin; }
  /* On a normal page: delete height and overflow above, set --w1rec-box: 100vh, and in the script use root: null. */
  .w1rec:focus-visible { outline: 3px solid var(--w1rec-accent); outline-offset: -3px; }
  .w1rec-hint { position: sticky; top: 0; height: 0; z-index: 5; display: flex; align-items: flex-start; justify-content: flex-end; pointer-events: none; }
  .w1rec-hint span { margin: 12px 12px 0 0; padding: 5px 12px; border-radius: 999px; background: var(--w1rec-chip); color: var(--w1rec-chipink);
    font-size: 12px; letter-spacing: .04em; transition: opacity .5s ease; }
  .w1rec[data-touched] .w1rec-hint span { opacity: 0; }
  .w1rec-grid { max-width: 72rem; margin: 0 auto; padding: 0 32px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 0 56px; }
  .w1rec[data-side="left"] .w1rec-grid { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); }
  .w1rec-vis { grid-column: 2; grid-row: 1; align-self: start; position: sticky; top: 0; z-index: 1; height: var(--w1rec-box);
    box-sizing: border-box; padding: 28px 0; display: flex; align-items: center; justify-content: center; }
  .w1rec[data-side="left"] .w1rec-vis { grid-column: 1; }
  .w1rec[data-side="left"] .w1rec-col { grid-column: 2; }
  .w1rec-frame { position: relative; width: min(100%, calc((var(--w1rec-box) - 56px) * 0.95)); aspect-ratio: 0.95; overflow: hidden;
    border-radius: var(--w1rec-r, 18px); background: var(--w1rec-panel);
    box-shadow: 0 1px 2px rgba(0,0,0,.08), 0 28px 56px -28px rgba(0,0,0,.35); }
  .w1rec-col { grid-column: 1; grid-row: 1; position: relative; z-index: 2; min-width: 0; }
  .w1rec-head { padding: 56px 0 8px; }
  .w1rec-eyebrow { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--w1rec-accent); }
  .w1rec-h { margin: 12px 0 0; font-family: var(--w1rec-display); font-weight: var(--w1rec-dw, 600); font-size: clamp(1.75rem, 3.6vw, 2.6rem); line-height: 1.1; letter-spacing: -.02em; }
  .w1rec-lede { margin: 14px 0 0; max-width: 30rem; font-size: 1.0625rem; line-height: 1.6; color: var(--w1rec-soft); }
  .w1rec-steps { list-style: none; margin: 0; padding: 0 0 calc(var(--w1rec-box) * .42); }
  .w1rec-step { min-height: calc(var(--w1rec-box) * .62); display: flex; align-items: center; }
  .w1rec-card { box-sizing: border-box; width: 100%; padding: 22px 24px; border-radius: 14px; background: var(--w1rec-card); border: 1px solid var(--w1rec-line);
    opacity: .55; transition: opacity .45s ease; }
  .w1rec[data-step="1"] .w1rec-step[data-i="1"] .w1rec-card,
  .w1rec[data-step="2"] .w1rec-step[data-i="2"] .w1rec-card,
  .w1rec[data-step="3"] .w1rec-step[data-i="3"] .w1rec-card,
  .w1rec[data-step="4"] .w1rec-step[data-i="4"] .w1rec-card,
  .w1rec[data-step="5"] .w1rec-step[data-i="5"] .w1rec-card { opacity: 1; }
  .w1rec-when { margin: 0; font-size: .8125rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--w1rec-accent); }
  .w1rec-card h3 { margin: 6px 0 0; font-size: 1.375rem; line-height: 1.25; font-weight: 650; }
  .w1rec-card h3 + p { margin: 8px 0 0; font-size: 1rem; line-height: 1.6; color: var(--w1rec-soft); }
  .w1rec-end { max-width: 72rem; margin: 0 auto; padding: 48px 32px 64px; display: flex; flex-wrap: wrap; gap: 16px 24px; align-items: center; justify-content: space-between; border-top: 1px solid var(--w1rec-line); }
  .w1rec-end p { margin: 0; font-size: 1.0625rem; }
  .w1rec-btn { display: inline-flex; min-height: 46px; align-items: center; padding: 0 22px; border-radius: 999px; background: var(--w1rec-accent);
    color: var(--w1rec-btnink); font-weight: 600; font-size: .9375rem; text-decoration: none; transition: transform .2s ease; }
  .w1rec-btn:hover { transform: translateY(-1px); }
  .w1rec-btn:focus-visible { outline: 3px solid var(--w1rec-ink); outline-offset: 3px; }
  /* Phones: the visual pins at the top and the steps scroll up over it on solid cards. */
  @media (max-width: 760px) {
    .w1rec-grid, .w1rec[data-side="left"] .w1rec-grid { grid-template-columns: minmax(0, 1fr); padding: 0 16px; }
    .w1rec-vis, .w1rec[data-side="left"] .w1rec-vis { grid-column: 1; grid-row: 2; height: 300px; padding: 12px 0; background: var(--w1rec-bg); }
    .w1rec-frame { width: min(100%, calc(272px * 0.95)); }
    .w1rec-col, .w1rec[data-side="left"] .w1rec-col { display: contents; }
    .w1rec-head { grid-row: 1; padding: 36px 0 4px; }
    .w1rec-steps { grid-row: 3; position: relative; z-index: 2; }
    .w1rec-step { min-height: calc(var(--w1rec-box) * .5); align-items: flex-end; }
    .w1rec-card { opacity: 1; box-shadow: 0 14px 34px -16px rgba(0,0,0,.4); }
    .w1rec-end { padding: 40px 16px 56px; }
  }
  /* Reduced motion: nothing pins, the steps read as a plain list and the visual shows its final state. */
  @media (prefers-reduced-motion: reduce) {
    .w1rec-vis, .w1rec[data-side="left"] .w1rec-vis { position: relative; height: auto; }
    .w1rec-step { min-height: 0; padding: 8px 0; }
    .w1rec-steps { padding-bottom: 32px; }
    .w1rec .w1rec-card { opacity: 1; }
    .w1rec *, .w1rec *::before { transition: none !important; }
  }
  .w1rec-desk { position: absolute; inset: 0; display: grid; place-items: center; container-type: inline-size;
    background: radial-gradient(80% 60% at 40% 30%, #eadfca, #d9ccb3); }
  .w1rec-card2 { width: 84cqi; box-sizing: border-box; padding: 5cqi 6cqi 6cqi; background: #fbf7ee; border-radius: 4px; transform: rotate(-1.6deg);
    box-shadow: 0 1px 1px rgba(0,0,0,.08), 0 18px 34px -16px rgba(60,40,20,.45); color: #2a2a3d; font-family: "Bradley Hand", "Segoe Print", "Comic Neue", Georgia, serif; }
  .w1rec-title { margin: 0 0 2cqi; font-size: 5.4cqi; line-height: 1.2; color: #8a2f1f; }
  .w1rec-lines { position: relative; background: repeating-linear-gradient(transparent 0 calc(var(--w1rec-lh) - 1px), #c9d6e8 calc(var(--w1rec-lh) - 1px) var(--w1rec-lh)); }
  .w1rec-lines p { position: relative; margin: 0; height: var(--w1rec-lh); line-height: calc(var(--w1rec-lh) + .6cqi); font-size: 3.7cqi; white-space: nowrap; }
  .w1rec-mark { position: absolute; left: -1.5cqi; right: -1.5cqi; top: .4cqi; height: calc(var(--w1rec-lh) - .8cqi); border-radius: 3px;
    background: #f2cf55; opacity: .55; transform-origin: 50% 0; transform: scaleY(4.1); transition: transform .8s cubic-bezier(.6,0,.2,1); }
  .w1rec[data-step="2"] .w1rec-mark { transform: translateY(calc(var(--w1rec-lh) * 4)) scaleY(2.05); }
  .w1rec[data-step="3"] .w1rec-mark { transform: translateY(calc(var(--w1rec-lh) * 6)) scaleY(1); }
  .w1rec[data-step="4"] .w1rec-mark { transform: translateY(calc(var(--w1rec-lh) * 7)) scaleY(1); }
  .w1rec[data-step="5"] .w1rec-mark { transform: translateY(calc(var(--w1rec-lh) * 8)) scaleY(1); }
  @media (prefers-reduced-motion: reduce) { .w1rec .w1rec-mark { opacity: 0; } }
`;

export default function HighlighterMovesDownARecipeCardPerStep() {
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
    <section className="w1rec" ref={rootRef} data-w1rec="" data-step="1" tabIndex="0" aria-label="How we bake Ada's brown soda bread, scrollable">
        <style>{STYLES}</style>
      <div className="w1rec-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w1rec-grid">
        <div className="w1rec-vis">
          <div className="w1rec-frame" role="img" aria-label="A handwritten recipe card for Ada's brown soda bread listing wholemeal flour, oats, bicarbonate of soda, salt, buttermilk and black treacle, then mixing, shaping and baking at 200 degrees for 40 minutes.">
            <div className="w1rec-desk" aria-hidden="true">
              <div className="w1rec-card2">
                <p className="w1rec-title">Ada's brown soda bread</p>
                <div className="w1rec-lines">
                  <span className="w1rec-mark"></span>
                  <p>450 g wholemeal flour</p>
                  <p>50 g oats, and a handful for the top</p>
                  <p>1 tsp bicarbonate of soda</p>
                  <p>1 tsp fine salt</p>
                  <p>400 ml buttermilk</p>
                  <p>1 tbsp black treacle</p>
                  <p>Dry first, then wet, with a fork. No kneading.</p>
                  <p>Shape a round, cut a deep cross.</p>
                  <p>200&#176;C for 40 min, till it sounds hollow.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w1rec-col">
          <header className="w1rec-head" data-i="1"><p className="w1rec-eyebrow">Pellow &amp; Daughter Deli</p><h2 className="w1rec-h">The bread card we bake from every morning</h2><p className="w1rec-lede">Ada wrote this out in 1974 and we still follow it to the letter. Scroll and we will walk you down her card.</p></header>
          <ol className="w1rec-steps">
          <li className="w1rec-step" data-i="1"><div className="w1rec-card"><p className="w1rec-when">Lines one to four</p><h3>The dry things, in one bowl</h3><p>Coarse wholemeal, oats, soda and salt, whisked so the soda is spread evenly. Lumps of soda taste bitter, which is why she underlined it.</p></div></li>
          <li className="w1rec-step" data-i="2"><div className="w1rec-card"><p className="w1rec-when">Lines five and six</p><h3>Buttermilk and a spoon of treacle</h3><p>Warm the treacle a little so it slides off the spoon, then stir it into the buttermilk before it goes near the flour.</p></div></li>
          <li className="w1rec-step" data-i="3"><div className="w1rec-card"><p className="w1rec-when">Line seven</p><h3>A fork, not your hands</h3><p>Pour the wet into a well in the dry and bring it together with a fork. It should look shaggy. Working it more makes the loaf tough.</p></div></li>
          <li className="w1rec-step" data-i="4"><div className="w1rec-card"><p className="w1rec-when">Line eight</p><h3>A round with a deep cross</h3><p>Tip it onto a floured tray, pat it into a low dome and cut a cross almost to the bottom so the middle cooks through.</p></div></li>
          <li className="w1rec-step" data-i="5"><div className="w1rec-card"><p className="w1rec-when">Line nine</p><h3>Bake until it sounds hollow</h3><p>Forty minutes in a hot oven, then turn it over and knock on the base. A hollow sound means done; a dull one means five more minutes.</p></div></li>
          </ol>
        </div>
      </div>
      <div className="w1rec-end"><p>Fresh loaves from seven, and the card is printed on our bags.</p><a href="#" className="w1rec-btn">Order for Saturday</a></div>
    </section>
  );
}

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version; the first CSS comment names the values to change.
const STYLES = `
  /* Change these: the colours below, --w1cht-box (box height), and the two data arrays in the SVG paths and the .w1cht-goal line position. */
  .w1cht { --w1cht-bg: #f6f7f9; --w1cht-ink: #17202b; --w1cht-soft: #475365; --w1cht-accent: #0d6b62; --w1cht-btnink: #fff; --w1cht-card: #ffffff;
    --w1cht-line: #dde2e8; --w1cht-panel: #ffffff; --w1cht-chip: rgba(23,32,43,.88); --w1cht-chipink: #f6f7f9;
    --w1cht-display: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; --w1cht-dw: 680; --w1cht-r: 12px; }
  .w1cht { --w1cht-box: 640px; height: var(--w1cht-box); overflow-y: auto; overflow-x: hidden; position: relative;
    background: var(--w1cht-bg); color: var(--w1cht-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; scrollbar-width: thin; }
  /* On a normal page: delete height and overflow above, set --w1cht-box: 100vh, and in the script use root: null. */
  .w1cht:focus-visible { outline: 3px solid var(--w1cht-accent); outline-offset: -3px; }
  .w1cht-hint { position: sticky; top: 0; height: 0; z-index: 5; display: flex; align-items: flex-start; justify-content: flex-end; pointer-events: none; }
  .w1cht-hint span { margin: 12px 12px 0 0; padding: 5px 12px; border-radius: 999px; background: var(--w1cht-chip); color: var(--w1cht-chipink);
    font-size: 12px; letter-spacing: .04em; transition: opacity .5s ease; }
  .w1cht[data-touched] .w1cht-hint span { opacity: 0; }
  .w1cht-grid { max-width: 72rem; margin: 0 auto; padding: 0 32px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 0 56px; }
  .w1cht[data-side="left"] .w1cht-grid { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); }
  .w1cht-vis { grid-column: 2; grid-row: 1; align-self: start; position: sticky; top: 0; z-index: 1; height: var(--w1cht-box);
    box-sizing: border-box; padding: 28px 0; display: flex; align-items: center; justify-content: center; }
  .w1cht[data-side="left"] .w1cht-vis { grid-column: 1; }
  .w1cht[data-side="left"] .w1cht-col { grid-column: 2; }
  .w1cht-frame { position: relative; width: min(100%, calc((var(--w1cht-box) - 56px) * 1.5)); aspect-ratio: 1.5; overflow: hidden;
    border-radius: var(--w1cht-r, 18px); background: var(--w1cht-panel);
    box-shadow: 0 1px 2px rgba(0,0,0,.08), 0 28px 56px -28px rgba(0,0,0,.35); }
  .w1cht-col { grid-column: 1; grid-row: 1; position: relative; z-index: 2; min-width: 0; }
  .w1cht-head { padding: 56px 0 8px; }
  .w1cht-eyebrow { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--w1cht-accent); }
  .w1cht-h { margin: 12px 0 0; font-family: var(--w1cht-display); font-weight: var(--w1cht-dw, 600); font-size: clamp(1.75rem, 3.6vw, 2.6rem); line-height: 1.1; letter-spacing: -.02em; }
  .w1cht-lede { margin: 14px 0 0; max-width: 30rem; font-size: 1.0625rem; line-height: 1.6; color: var(--w1cht-soft); }
  .w1cht-steps { list-style: none; margin: 0; padding: 0 0 calc(var(--w1cht-box) * .42); }
  .w1cht-step { min-height: calc(var(--w1cht-box) * .62); display: flex; align-items: center; }
  .w1cht-card { box-sizing: border-box; width: 100%; padding: 22px 24px; border-radius: 14px; background: var(--w1cht-card); border: 1px solid var(--w1cht-line);
    opacity: .55; transition: opacity .45s ease; }
  .w1cht[data-step="1"] .w1cht-step[data-i="1"] .w1cht-card,
  .w1cht[data-step="2"] .w1cht-step[data-i="2"] .w1cht-card,
  .w1cht[data-step="3"] .w1cht-step[data-i="3"] .w1cht-card,
  .w1cht[data-step="4"] .w1cht-step[data-i="4"] .w1cht-card { opacity: 1; }
  .w1cht-when { margin: 0; font-size: .8125rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--w1cht-accent); }
  .w1cht-card h3 { margin: 6px 0 0; font-size: 1.375rem; line-height: 1.25; font-weight: 650; }
  .w1cht-card h3 + p { margin: 8px 0 0; font-size: 1rem; line-height: 1.6; color: var(--w1cht-soft); }
  .w1cht-end { max-width: 72rem; margin: 0 auto; padding: 48px 32px 64px; display: flex; flex-wrap: wrap; gap: 16px 24px; align-items: center; justify-content: space-between; border-top: 1px solid var(--w1cht-line); }
  .w1cht-end p { margin: 0; font-size: 1.0625rem; }
  .w1cht-btn { display: inline-flex; min-height: 46px; align-items: center; padding: 0 22px; border-radius: 999px; background: var(--w1cht-accent);
    color: var(--w1cht-btnink); font-weight: 600; font-size: .9375rem; text-decoration: none; transition: transform .2s ease; }
  .w1cht-btn:hover { transform: translateY(-1px); }
  .w1cht-btn:focus-visible { outline: 3px solid var(--w1cht-ink); outline-offset: 3px; }
  /* Phones: the visual pins at the top and the steps scroll up over it on solid cards. */
  @media (max-width: 760px) {
    .w1cht-grid, .w1cht[data-side="left"] .w1cht-grid { grid-template-columns: minmax(0, 1fr); padding: 0 16px; }
    .w1cht-vis, .w1cht[data-side="left"] .w1cht-vis { grid-column: 1; grid-row: 2; height: 270px; padding: 12px 0; background: var(--w1cht-bg); }
    .w1cht-frame { width: min(100%, calc(242px * 1.5)); }
    .w1cht-col, .w1cht[data-side="left"] .w1cht-col { display: contents; }
    .w1cht-head { grid-row: 1; padding: 36px 0 4px; }
    .w1cht-steps { grid-row: 3; position: relative; z-index: 2; }
    .w1cht-step { min-height: calc(var(--w1cht-box) * .5); align-items: flex-end; }
    .w1cht-card { opacity: 1; box-shadow: 0 14px 34px -16px rgba(0,0,0,.4); }
    .w1cht-end { padding: 40px 16px 56px; }
  }
  /* Reduced motion: nothing pins, the steps read as a plain list and the visual shows its final state. */
  @media (prefers-reduced-motion: reduce) {
    .w1cht-vis, .w1cht[data-side="left"] .w1cht-vis { position: relative; height: auto; }
    .w1cht-step { min-height: 0; padding: 8px 0; }
    .w1cht-steps { padding-bottom: 32px; }
    .w1cht .w1cht-card { opacity: 1; }
    .w1cht *, .w1cht *::before { transition: none !important; }
  }
  .w1cht-frame { border: 1px solid var(--w1cht-line); }
  .w1cht-svg { display: block; width: 100%; height: 100%; }
  .w1cht-y2 { transform-box: view-box; transform-origin: 0 270px; transform: scaleY(0); opacity: 0;
    transition: transform 1.1s cubic-bezier(.3,.7,.2,1), opacity .4s ease; }
  .w1cht-band, .w1cht-note, .w1cht-goal { opacity: 0; transition: opacity .6s ease; }
  .w1cht-note { transform: translateY(8px); transition: opacity .5s ease .2s, transform .6s ease .2s; }
  .w1cht-goal { transform: translateX(-24px); transition: opacity .5s ease, transform .8s cubic-bezier(.3,.7,.2,1); }
  .w1cht-y1 { transition: opacity .6s ease; }
  .w1cht:not([data-step="1"]) .w1cht-y2 { transform: none; opacity: 1; }
  .w1cht[data-step="2"] .w1cht-y1 { opacity: .55; }
  .w1cht[data-step="3"] .w1cht-band, .w1cht[data-step="3"] .w1cht-note, .w1cht[data-step="4"] .w1cht-band,
  .w1cht[data-step="4"] .w1cht-note, .w1cht[data-step="4"] .w1cht-goal { opacity: 1; transform: none; }
  .w1cht-key { position: absolute; right: 14px; top: 10px; margin: 0; padding: 0; list-style: none; display: flex; gap: 12px; font-size: 12px; font-weight: 600; color: var(--w1cht-soft); }
  .w1cht-key li::before { content: ""; display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; background: #7d8a9e; vertical-align: -1px; }
  .w1cht-key .w1cht-k2 { opacity: .35; transition: opacity .4s ease; }
  .w1cht-key .w1cht-k2::before { background: #0d6b62; }
  .w1cht:not([data-step="1"]) .w1cht-k2 { opacity: 1; }
`;

export default function AreaChartGainsAYearOfDataPerStep() {
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
    <section className="w1cht" ref={rootRef} data-w1cht="" data-step="1" tabIndex="0" aria-label="Saltmarsh Solar output story, scrollable">
        <style>{STYLES}</style>
      <div className="w1cht-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w1cht-grid">
        <div className="w1cht-vis">
          <div className="w1cht-frame" role="img" aria-label="Area chart of monthly output in megawatt hours. In 2024 output peaks at 32 in July. In 2025, after the school roof array went live in June, output peaks at 52 in July. A dashed target line sits at 40 for summer months.">
            <svg className="w1cht-svg" viewBox="0 0 480 320" aria-hidden="true">
              <g fontSize="11" fontFamily="ui-sans-serif, system-ui, sans-serif" fill="#5b6576">
                <g stroke="#e6e9ee" strokeWidth="1" textAnchor="end"><line x1="56" x2="456" y1="270" y2="270"></line><text x="44" y="274">0</text><line x1="56" x2="456" y1="230" y2="230"></line><text x="44" y="234">10</text><line x1="56" x2="456" y1="190" y2="190"></line><text x="44" y="194">20</text><line x1="56" x2="456" y1="150" y2="150"></line><text x="44" y="154">30</text><line x1="56" x2="456" y1="110" y2="110"></line><text x="44" y="114">40</text><line x1="56" x2="456" y1="70" y2="70"></line><text x="44" y="74">50</text></g>
                <g textAnchor="middle"><text x="56" y="290">J</text><text x="92.4" y="290">F</text><text x="128.7" y="290">M</text><text x="165.1" y="290">A</text><text x="201.5" y="290">M</text><text x="237.8" y="290">J</text><text x="274.2" y="290">J</text><text x="310.5" y="290">A</text><text x="346.9" y="290">S</text><text x="383.3" y="290">O</text><text x="419.6" y="290">N</text><text x="456" y="290">D</text></g>
                <text x="56" y="18" fill="#17202b" fontWeight="700">MWh per month</text>
              </g>
              <rect className="w1cht-band" x="221.8" y="30" width="104.69999999999999" height="240" fill="#b45309" fillOpacity=".09"></rect>
              <g className="w1cht-y1">
                <path d="M56 238 L92.4 226 L128.7 202 L165.1 178 L201.5 158 L237.8 146 L274.2 142 L310.5 158 L346.9 186 L383.3 214 L419.6 234 L456 242 L456 270 L56 270Z" fill="#8592a6" fillOpacity=".16"></path>
                <path d="M56 238 L92.4 226 L128.7 202 L165.1 178 L201.5 158 L237.8 146 L274.2 142 L310.5 158 L346.9 186 L383.3 214 L419.6 234 L456 242" fill="none" stroke="#7d8a9e" strokeWidth="2.5" strokeLinejoin="round"></path>
                <g fill="#fff" stroke="#7d8a9e" strokeWidth="2"><circle cx="56" cy="238" r="3"></circle><circle cx="92.4" cy="226" r="3"></circle><circle cx="128.7" cy="202" r="3"></circle><circle cx="165.1" cy="178" r="3"></circle><circle cx="201.5" cy="158" r="3"></circle><circle cx="237.8" cy="146" r="3"></circle><circle cx="274.2" cy="142" r="3"></circle><circle cx="310.5" cy="158" r="3"></circle><circle cx="346.9" cy="186" r="3"></circle><circle cx="383.3" cy="214" r="3"></circle><circle cx="419.6" cy="234" r="3"></circle><circle cx="456" cy="242" r="3"></circle></g>
              </g>
              <g className="w1cht-y2">
                <path d="M56 234 L92.4 222 L128.7 198 L165.1 170 L201.5 150 L237.8 82 L274.2 62 L310.5 86 L346.9 134 L383.3 182 L419.6 214 L456 226 L456 270 L56 270Z" fill="#0d6b62" fillOpacity=".18"></path>
                <path d="M56 234 L92.4 222 L128.7 198 L165.1 170 L201.5 150 L237.8 82 L274.2 62 L310.5 86 L346.9 134 L383.3 182 L419.6 214 L456 226" fill="none" stroke="#0d6b62" strokeWidth="3" strokeLinejoin="round"></path>
                <g fill="#fff" stroke="#0d6b62" strokeWidth="2"><circle cx="56" cy="234" r="3"></circle><circle cx="92.4" cy="222" r="3"></circle><circle cx="128.7" cy="198" r="3"></circle><circle cx="165.1" cy="170" r="3"></circle><circle cx="201.5" cy="150" r="3"></circle><circle cx="237.8" cy="82" r="3"></circle><circle cx="274.2" cy="62" r="3"></circle><circle cx="310.5" cy="86" r="3"></circle><circle cx="346.9" cy="134" r="3"></circle><circle cx="383.3" cy="182" r="3"></circle><circle cx="419.6" cy="214" r="3"></circle><circle cx="456" cy="226" r="3"></circle></g>
              </g>
              <g className="w1cht-note" fontFamily="ui-sans-serif, system-ui, sans-serif">
                <text x="274.2" y="36" textAnchor="middle" fontSize="12" fontWeight="700" fill="#8a3f07">School roof live</text>
                <text x="274.2" y="50" textAnchor="middle" fontSize="11" fill="#5b4a3a">June to August</text>
              </g>
              <g className="w1cht-goal">
                <line x1="56" x2="456" y1="110" y2="110" stroke="#b45309" strokeWidth="1.6" strokeDasharray="5 5"></line>
                <rect x="352" y="84" width="104" height="20" rx="4" fill="#b45309"></rect>
                <text x="404" y="98" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="ui-sans-serif, system-ui, sans-serif">2026 target, 40</text>
              </g>
            </svg>
            <ul className="w1cht-key" aria-hidden="true"><li className="w1cht-k1">2024</li><li className="w1cht-k2">2025</li></ul>
          </div>
        </div>
        <div className="w1cht-col">
          <header className="w1cht-head" data-i="1"><p className="w1cht-eyebrow">Saltmarsh Solar Co-op</p><h2 className="w1cht-h">What one new roof did for our output</h2><p className="w1cht-lede">Members asked whether the school roof array was worth it. Here is a year of meter readings, added a layer at a time.</p></header>
          <ol className="w1cht-steps">
          <li className="w1cht-step" data-i="1"><div className="w1cht-card"><p className="w1cht-when">2024</p><h3>A normal year on the barn roofs</h3><p>Our first full year with the barn arrays alone. Output follows the sun, topping out at 32 megawatt hours in July.</p></div></li>
          <li className="w1cht-step" data-i="2"><div className="w1cht-card"><p className="w1cht-when">2025</p><h3>The second year rises above it</h3><p>The same months a year later. Spring tracks 2024 closely, then the summer line pulls well clear of the old one.</p></div></li>
          <li className="w1cht-step" data-i="3"><div className="w1cht-card"><p className="w1cht-when">June to August</p><h3>The school roof is the difference</h3><p>The new array on the primary school went live in the first week of June, and almost all of the extra output lands in these three months.</p></div></li>
          <li className="w1cht-step" data-i="4"><div className="w1cht-card"><p className="w1cht-when">Next year</p><h3>A target members voted for</h3><p>At the spring meeting members set a goal of 40 megawatt hours in every summer month, which 2025 already cleared.</p></div></li>
          </ol>
        </div>
      </div>
      <div className="w1cht-end"><p>Members get the full meter readings every quarter.</p><a href="#" className="w1cht-btn">Become a member</a></div>
    </section>
  );
}

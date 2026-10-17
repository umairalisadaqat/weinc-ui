import { useEffect, useRef } from "react";

const stages = [
  {
    "n": "Stage 1",
    "side": "up",
    "title": "Survey on the hard",
    "text": "We lift her out, sound every plank with a mallet and mark the soft wood in chalk."
  },
  {
    "n": "Stage 2",
    "side": "down",
    "title": "Strip back to bare cedar",
    "text": "Old paint comes off by scraper and low heat, so the timber is never scorched."
  },
  {
    "n": "Stage 3",
    "side": "up",
    "title": "Steam new oak frames",
    "text": "Cracked frames are steamed soft, bent to the curve of the hull and riveted in copper."
  },
  {
    "n": "Stage 4",
    "side": "down",
    "title": "Plank lap over lap",
    "text": "New larch planks are cut from patterns of the old ones and fastened one over the next."
  },
  {
    "n": "Stage 5",
    "side": "up",
    "title": "Fair, prime and paint",
    "text": "Coat after coat above the waterline, sanded between each, with antifouling below."
  },
  {
    "n": "Stage 6",
    "side": "down",
    "title": "Back in on a spring tide",
    "text": "She takes up water for a day or two at the mooring, then sails the following week."
  }
];

const css = `
.w5tml-root { --w5tml-h: 600px; --w5tml-run: 1600px; position: relative; height: var(--w5tml-h); overflow-x: hidden; overflow-y: auto; scrollbar-width: thin; }
.w5tml-root *, .w5tml-root *::before, .w5tml-root *::after { box-sizing: border-box; }
.w5tml-track { height: calc(var(--w5tml-h) + var(--w5tml-run)); }
.w5tml-stage { position: sticky; top: 0; height: var(--w5tml-h); overflow: hidden; container-type: inline-size; }
.w5tml-row { position: relative; display: flex; width: max-content; will-change: transform; }
.w5tml-hint { position: absolute; top: 12px; left: 0; right: 0; z-index: 5; display: flex; justify-content: center; pointer-events: none; transition: opacity .4s ease; }
.w5tml-hint span { padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; letter-spacing: .04em; }
.w5tml-root[data-scrolled] .w5tml-hint { opacity: 0; }
@keyframes w5tml-slide { to { transform: translateX(calc(-100% + 100cqi)); } }
@supports (animation-timeline: view()) {
  @media (min-width: 640px) and (prefers-reduced-motion: no-preference) {
    .w5tml-track { view-timeline: --w5tml-tl block; }
    .w5tml-row { animation: w5tml-slide linear both; animation-timeline: --w5tml-tl; animation-range: contain 0% contain 100%; }
  }
}
@media (max-width: 639px), (prefers-reduced-motion: reduce) {
  .w5tml-track { height: auto; }
  .w5tml-stage { position: static; height: auto; min-height: var(--w5tml-h); overflow: visible; }
  .w5tml-hint { display: none; }
  .w5tml-row { width: auto; overflow-x: auto; scroll-snap-type: x mandatory; transform: none !important; animation: none !important; scrollbar-width: thin; scroll-padding-inline: clamp(20px, 5cqi, 64px); }
  .w5tml-panel { scroll-snap-align: start; }
}
.w5tml-root { --w5tml-navy: #0e1d30; --w5tml-brass: #d9b56c; --w5tml-col: 300px; background: radial-gradient(120% 90% at 20% 0%, #183150 0%, var(--w5tml-navy) 60%); color: #efe9dd; font-family: ui-sans-serif, system-ui, sans-serif; scrollbar-color: #2e4868 transparent; }
.w5tml-root:focus-visible { outline: 3px solid var(--w5tml-brass); outline-offset: -3px; }
.w5tml-hint span { background: var(--w5tml-brass); color: var(--w5tml-navy); }
.w5tml-stage { display: flex; flex-direction: column; justify-content: center; gap: 8px; }
.w5tml-head { padding: 0 clamp(20px, 5cqi, 64px); }
.w5tml-label { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: var(--w5tml-brass); }
.w5tml-title { margin: 8px 0 0; max-width: 18ch; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(28px, 3.8cqi, 42px); line-height: 1.12; }
.w5tml-row { padding: 0 clamp(20px, 5cqi, 64px); }
.w5tml-list { display: flex; margin: 0; padding: 0; list-style: none; }
.w5tml-panel { position: relative; flex: 0 0 var(--w5tml-col); height: 400px; }
.w5tml-line { position: absolute; top: 200px; left: calc(clamp(20px, 5cqi, 64px) + 25px); right: calc(clamp(20px, 5cqi, 64px) + 280px + var(--w5tml-col) - 25px); height: 2px; background: rgba(239, 233, 221, .16); }
.w5tml-ink { position: absolute; inset: 0; background: var(--w5tml-brass); transform: scaleX(0); transform-origin: 0 50%; }
.w5tml-dot { position: absolute; top: 193px; left: 17px; width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--w5tml-brass); background: var(--w5tml-navy); }
.w5tml-dot::after { content: ""; position: absolute; inset: 2px; border-radius: 50%; background: var(--w5tml-brass); opacity: 0; transform: scale(.4); transition: opacity .35s ease, transform .35s cubic-bezier(.3, 1.6, .5, 1); }
.w5tml-panel[data-on] .w5tml-dot::after { opacity: 1; transform: scale(1); }
.w5tml-card { position: absolute; left: 0; width: calc(var(--w5tml-col) - 36px); padding: 0 0 0 24px; border-left: 1px solid rgba(217, 181, 108, .45); }
.w5tml-up .w5tml-card { bottom: 228px; }
.w5tml-down .w5tml-card { top: 228px; }
.w5tml-n { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--w5tml-brass); }
.w5tml-h { margin: 6px 0 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: 22px; line-height: 1.25; }
.w5tml-text { margin: 8px 0 0; font-size: 15px; line-height: 1.6; color: #c9c3b8; }
.w5tml-end { flex-basis: 280px; }
.w5tml-cta { top: 150px; border-left: 0; padding: 0; }
.w5tml-btn { display: inline-flex; align-items: center; min-height: 44px; margin-top: 16px; padding: 0 20px; border-radius: 999px; background: var(--w5tml-brass); color: var(--w5tml-navy); font-size: 14px; font-weight: 600; text-decoration: none; }
.w5tml-btn:hover { background: #ecd29a; }
.w5tml-btn:focus-visible { outline: 3px solid #efe9dd; outline-offset: 3px; }
@keyframes w5tml-draw { to { transform: scaleX(1); } }
@supports (animation-timeline: view()) {
  @media (min-width: 640px) and (prefers-reduced-motion: no-preference) {
    .w5tml-ink { animation: w5tml-draw linear both; animation-timeline: --w5tml-tl; animation-range: contain 0% contain 100%; }
  }
}
@media (max-width: 639px), (prefers-reduced-motion: reduce) {
  .w5tml-stage { justify-content: center; gap: 24px; padding: 32px 0; }
  .w5tml-row { padding: 0; }
  .w5tml-list { gap: 16px; padding: 0 20px 12px; }
  .w5tml-line, .w5tml-dot { display: none; }
  .w5tml-panel, .w5tml-end { flex: 0 0 min(80%, 300px); height: auto; scroll-snap-align: start; }
  .w5tml-card, .w5tml-cta { position: static; width: auto; height: 100%; padding: 20px; border: 1px solid rgba(217, 181, 108, .4); border-radius: 14px; background: rgba(255, 255, 255, .04); }
}
@media (max-width: 639px), (prefers-reduced-motion: reduce) {
  .w5tml-row { overflow: visible; }
  .w5tml-list { overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding-inline: 20px; scrollbar-width: thin; }
}
`;

// Same script as the HTML version. It also checks prefers-reduced-motion itself.
function init(root: HTMLElement): () => void {
  // The box scrolls itself. For page scroll: remove height and overflow from .w5tml-root, set --w5tml-h to 100vh,
  // then use window scroll events and (scrollY minus the track's page top) instead of root.scrollTop.
  var AUTO = 80; // demo scroll speed in px per second until someone scrolls; 0 turns it off
  var $ = function (s: string): any { return root.querySelector(s); };
  var track = $(".w5tml-track"), stage = $(".w5tml-stage"), row = $(".w5tml-row");
  var still = matchMedia("(prefers-reduced-motion: reduce), (max-width: 639px)");
  var css = window.CSS && CSS.supports("animation-timeline: view()"); // CSS moves the row itself there
  var af = requestAnimationFrame, caf = cancelAnimationFrame, raf = 0, demo = 0, last = 0, pos = 0, seen = true, done = !AUTO;
  var ink = $(".w5tml-ink"), dots = root.querySelectorAll(".w5tml-dot"), n = dots.length;
  function cl(x: number) { return Math.min(1, Math.max(0, x)) || 0; }
  function span() { return track.offsetHeight - root.clientHeight; }
  function shift(el: any, p: number, flat: boolean) {
    if (!css) el.style.transform = flat ? "" : "translateX(" + -p * Math.max(0, el.offsetWidth - stage.clientWidth) + "px)";
  }
  function paint() {
    raf = 0;
    var p = cl((root.scrollTop - track.offsetTop) / span()), flat = still.matches;
    root.toggleAttribute("data-scrolled", root.scrollTop > 160);
    shift(row, p, flat);
    if (!css) ink.style.transform = flat ? "" : "scaleX(" + p + ")";
    dots.forEach(function (d: any, i: number) { d.parentNode.toggleAttribute("data-on", flat || p >= i / (n - 1) - 0.02); });
  }
  function queue() { if (!raf) raf = af(paint); }
  function step(now: number) {
    var dt = last ? Math.min(now - last, 50) : 0;
    last = now;
    pos += (AUTO * dt) / 1000;
    if (pos >= root.scrollHeight - root.clientHeight) { done = true; demo = 0; return; }
    root.scrollTop = pos;
    demo = af(step);
  }
  function start() { if (!done && seen && !demo && !still.matches) { last = 0; pos = root.scrollTop; demo = af(step); } }
  function stop() { caf(demo); demo = 0; }
  function hand() { done = true; stop(); }
  // Tabbing to a card off to the side scrolls the box to the point where that card is in view.
  function focusIn(e: any) {
    var card = e.target.closest(".w5tml-panel");
    stage.scrollLeft = 0;
    if (!card || still.matches) return;
    hand();
    var w = stage.clientWidth;
    root.scrollTop = track.offsetTop + span() * cl((card.offsetLeft - (w - card.offsetWidth) / 2) / (row.offsetWidth - w));
  }
  var ac = new AbortController(), o = { passive: true, signal: ac.signal };
  var io = new IntersectionObserver(function (e) { seen = e[0].isIntersecting; seen ? start() : stop(); });
  io.observe(root);
  ["wheel", "touchstart", "pointerdown", "keydown"].forEach(function (ev) { root.addEventListener(ev, hand, o); });
  root.addEventListener("scroll", queue, o);
  row.addEventListener("focusin", focusIn, o);
  row.addEventListener("scroll", queue, o);
  window.addEventListener("resize", queue, o);
  paint();
  start();
  return function () {
    stop();
    caf(raf);
    io.disconnect();
    ac.abort();

  };
}

export default function PinnedBoatRestorationTimelineDrawingSideways() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? init(ref.current) : undefined), []);
  return (
    <section ref={ref} className="w5tml-root" data-w5tml tabIndex="0" aria-label="Restoration timeline, scroll to move along it">
    <style>{css}</style>
      <div className="w5tml-track">
        <div className="w5tml-stage">
          <div className="w5tml-hint" aria-hidden="true"><span>Scroll inside</span></div>
          <div className="w5tml-head">
            <p className="w5tml-label">Merrow Boatworks</p>
            <h2 className="w5tml-title">How we bring a wooden dayboat back</h2>
          </div>
          <div className="w5tml-row">
            <span className="w5tml-line" aria-hidden="true"><span className="w5tml-ink"></span></span>
            <ol className="w5tml-list">
              {stages.map((it, i) => (
    <li key={i} className={`w5tml-panel w5tml-${it.side}`}>
                <span className="w5tml-dot" aria-hidden="true"></span>
                <div className="w5tml-card">
                  <p className="w5tml-n">{it.n}</p>
                  <h3 className="w5tml-h">{it.title}</h3>
                  <p className="w5tml-text">{it.text}</p>
                </div>
              </li>
    ))}
              <li className="w5tml-panel w5tml-end">
                <div className="w5tml-card w5tml-cta">
                  <h3 className="w5tml-h">Have a boat that needs this?</h3>
                  <a href="#" className="w5tml-btn">Book a hull survey</a>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

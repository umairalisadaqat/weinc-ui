import { useEffect, useRef } from "react";

const pieces = [
  {
    "img": "https://images.pexels.com/photos/9736720/pexels-photo-9736720.jpeg?auto=compress&cs=tinysrgb&w=900",
    "alt": "Small round pots with a deep red-brown glaze arranged on a worn wooden board",
    "shape": "wide",
    "name": "Ember jars",
    "glaze": "Iron red over raw clay",
    "price": "$38 each"
  },
  {
    "img": "https://images.pexels.com/photos/15122643/pexels-photo-15122643.jpeg?auto=compress&cs=tinysrgb&w=900",
    "alt": "A shelf of tall white ceramic vases in rounded and tapered shapes",
    "shape": "tall",
    "name": "Chalk vases",
    "glaze": "Satin white, five shapes",
    "price": "$64 to $120"
  },
  {
    "img": "https://images.pexels.com/photos/8063803/pexels-photo-8063803.jpeg?auto=compress&cs=tinysrgb&w=900",
    "alt": "Rows of unglazed white mugs with handles waiting on a studio shelf",
    "shape": "wide",
    "name": "Morning mugs",
    "glaze": "Pick your glaze before firing",
    "price": "$32"
  },
  {
    "img": "https://images.pexels.com/photos/29282184/pexels-photo-29282184.jpeg?auto=compress&cs=tinysrgb&w=900",
    "alt": "Handmade bowls in teal with a wave pattern and in burnt orange, close up in soft light",
    "shape": "wide",
    "name": "Tide bowls",
    "glaze": "Teal slip, carved by hand",
    "price": "$46"
  },
  {
    "img": "https://images.pexels.com/photos/37472728/pexels-photo-37472728.jpeg?auto=compress&cs=tinysrgb&w=900",
    "alt": "Black and white photo of a potter shaping a tall bottle at the wheel among rows of unfired pots",
    "shape": "tall",
    "name": "Made to order",
    "glaze": "Commissions open in March",
    "price": "From $90"
  }
];

const css = `
.w5pgr-root { --w5pgr-h: 600px; --w5pgr-run: 1400px; position: relative; height: var(--w5pgr-h); overflow-x: hidden; overflow-y: auto; scrollbar-width: thin; }
.w5pgr-root *, .w5pgr-root *::before, .w5pgr-root *::after { box-sizing: border-box; }
.w5pgr-track { height: calc(var(--w5pgr-h) + var(--w5pgr-run)); }
.w5pgr-stage { position: sticky; top: 0; height: var(--w5pgr-h); overflow: hidden; container-type: inline-size; }
.w5pgr-row { position: relative; display: flex; width: max-content; will-change: transform; }
.w5pgr-hint { position: absolute; top: 12px; left: 0; right: 0; z-index: 5; display: flex; justify-content: center; pointer-events: none; transition: opacity .4s ease; }
.w5pgr-hint span { padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; letter-spacing: .04em; }
.w5pgr-root[data-scrolled] .w5pgr-hint { opacity: 0; }
@keyframes w5pgr-slide { to { transform: translateX(calc(-100% + 100cqi)); } }
@supports (animation-timeline: view()) {
  @media (min-width: 640px) and (prefers-reduced-motion: no-preference) {
    .w5pgr-track { view-timeline: --w5pgr-tl block; }
    .w5pgr-row { animation: w5pgr-slide linear both; animation-timeline: --w5pgr-tl; animation-range: contain 0% contain 100%; }
  }
}
@media (max-width: 639px), (prefers-reduced-motion: reduce) {
  .w5pgr-track { height: auto; }
  .w5pgr-stage { position: static; height: auto; min-height: var(--w5pgr-h); overflow: visible; }
  .w5pgr-hint { display: none; }
  .w5pgr-row { width: auto; overflow-x: auto; scroll-snap-type: x mandatory; transform: none !important; animation: none !important; scrollbar-width: thin; scroll-padding-inline: clamp(20px, 5cqi, 64px); }
  .w5pgr-panel { scroll-snap-align: start; }
}
.w5pgr-root { --w5pgr-paper: #f2ebe0; --w5pgr-rust: #9a4424; --w5pgr-img: 290px; background: var(--w5pgr-paper); color: #2b211a; font-family: ui-sans-serif, system-ui, sans-serif; scrollbar-color: #c9b9a3 transparent; }
.w5pgr-root:focus-visible { outline: 3px solid var(--w5pgr-rust); outline-offset: -3px; }
.w5pgr-hint span { background: #2b211a; color: #f2ebe0; }
.w5pgr-stage { display: flex; flex-direction: column; justify-content: center; gap: 28px; }
.w5pgr-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding: 0 clamp(20px, 5cqi, 64px); }
.w5pgr-label { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: var(--w5pgr-rust); }
.w5pgr-title { margin: 8px 0 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(28px, 4.2cqi, 44px); line-height: 1.1; }
.w5pgr-lede { margin: 10px 0 0; max-width: 46ch; font-size: 15px; line-height: 1.6; color: #5a4a3c; }
.w5pgr-meter { display: grid; justify-items: end; gap: 10px; flex: 0 0 auto; }
.w5pgr-count { font-size: 13px; font-weight: 600; letter-spacing: .08em; font-variant-numeric: tabular-nums; }
.w5pgr-rule { display: block; width: 160px; height: 2px; background: #d9ccba; overflow: hidden; }
.w5pgr-fill { display: block; height: 100%; background: var(--w5pgr-rust); transform: scaleX(0); transform-origin: 0 50%; }
.w5pgr-row { margin: 0; padding: 0 clamp(20px, 5cqi, 64px); list-style: none; gap: 28px; align-items: flex-start; }
.w5pgr-panel { flex: 0 0 auto; }
.w5pgr-card { display: block; color: inherit; text-decoration: none; border-radius: 6px; }
.w5pgr-card:focus-visible { outline: 3px solid var(--w5pgr-rust); outline-offset: 6px; }
.w5pgr-frame { display: block; height: var(--w5pgr-img); overflow: hidden; border-radius: 4px; background: #e2d6c4; box-shadow: 0 18px 40px -28px rgba(60, 35, 15, .55); }
.w5pgr-wide .w5pgr-frame { width: calc(var(--w5pgr-img) * 4 / 3); }
.w5pgr-tall .w5pgr-frame { width: calc(var(--w5pgr-img) * 3 / 4); }
.w5pgr-frame img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform .6s cubic-bezier(.2, .7, .2, 1); }
.w5pgr-card:hover img, .w5pgr-card:focus-visible img { transform: scale(1.04); }
.w5pgr-cap { display: flex; justify-content: space-between; gap: 12px; margin-top: 14px; font-size: 15px; }
.w5pgr-name { font-weight: 600; }
.w5pgr-price { color: #5a4a3c; font-variant-numeric: tabular-nums; }
.w5pgr-glaze { display: block; margin-top: 4px; font-size: 13px; color: #6b5a4a; }
.w5pgr-end { align-self: stretch; width: 260px; display: flex; flex-direction: column; justify-content: center; gap: 18px; padding: 0 8px; border-left: 1px solid #d9ccba; padding-left: 28px; height: var(--w5pgr-img); }
.w5pgr-endtext { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: 20px; line-height: 1.4; }
.w5pgr-btn { align-self: flex-start; display: inline-flex; align-items: center; min-height: 44px; padding: 0 20px; border-radius: 999px; background: #2b211a; color: #f2ebe0; font-size: 14px; font-weight: 600; text-decoration: none; }
.w5pgr-btn:hover { background: var(--w5pgr-rust); }
.w5pgr-btn:focus-visible { outline: 3px solid var(--w5pgr-rust); outline-offset: 3px; }
@keyframes w5pgr-grow { to { transform: scaleX(1); } }
@supports (animation-timeline: view()) {
  @media (min-width: 640px) and (prefers-reduced-motion: no-preference) {
    .w5pgr-fill { animation: w5pgr-grow linear both; animation-timeline: --w5pgr-tl; animation-range: contain 0% contain 100%; }
  }
}
@media (max-width: 639px), (prefers-reduced-motion: reduce) {
  .w5pgr-root { --w5pgr-img: 250px; }
  .w5pgr-stage { justify-content: center; padding: 32px 0; }
  .w5pgr-meter { display: none; }
  .w5pgr-row { padding-bottom: 12px; }
  .w5pgr-frame img { transition: none; }
}
@media (max-width: 639px) { .w5pgr-wide .w5pgr-frame { width: min(calc(var(--w5pgr-img) * 4 / 3), 78vw); } }
`;

// Same script as the HTML version. It also checks prefers-reduced-motion itself.
function init(root: HTMLElement): () => void {
  // The box scrolls itself. For page scroll: remove height and overflow from .w5pgr-root, set --w5pgr-h to 100vh,
  // then use window scroll events and (scrollY minus the track's page top) instead of root.scrollTop.
  var AUTO = 80; // demo scroll speed in px per second until someone scrolls; 0 turns it off
  var $ = function (s: string): any { return root.querySelector(s); };
  var track = $(".w5pgr-track"), stage = $(".w5pgr-stage"), row = $(".w5pgr-row");
  var still = matchMedia("(prefers-reduced-motion: reduce), (max-width: 639px)");
  var css = window.CSS && CSS.supports("animation-timeline: view()"); // CSS moves the row itself there
  var af = requestAnimationFrame, caf = cancelAnimationFrame, raf = 0, demo = 0, last = 0, pos = 0, seen = true, done = !AUTO;
  var fill = $(".w5pgr-fill"), count = $(".w5pgr-count"), n = row.querySelectorAll("img").length;
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
    if (!css) fill.style.transform = flat ? "" : "scaleX(" + p + ")";
    count.textContent = "0" + (Math.round(p * (n - 1)) + 1) + " / 0" + n;
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
    var card = e.target.closest(".w5pgr-panel");
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

export default function PinnedPotteryGalleryRowSlidingSidewaysOnScroll() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? init(ref.current) : undefined), []);
  return (
    <section ref={ref} className="w5pgr-root" data-w5pgr tabIndex="0" aria-label="Ember series gallery, scroll to move sideways">
    <style>{css}</style>
      <div className="w5pgr-track">
        <div className="w5pgr-stage">
          <div className="w5pgr-hint" aria-hidden="true"><span>Scroll inside</span></div>
          <div className="w5pgr-head">
            <div>
              <p className="w5pgr-label">Halden Clay Works</p>
              <h2 className="w5pgr-title">The Ember series</h2>
              <p className="w5pgr-lede">Thrown, trimmed and fired in our back room kiln. Each piece is a little different from the photo.</p>
            </div>
            <div className="w5pgr-meter" aria-hidden="true">
              <span className="w5pgr-count">01 / 05</span>
              <span className="w5pgr-rule"><span className="w5pgr-fill"></span></span>
            </div>
          </div>
          <ul className="w5pgr-row" role="list">
            {pieces.map((it, i) => (
    <li key={i} className={`w5pgr-panel w5pgr-${it.shape}`}>
              <a href="#" className="w5pgr-card">
                <span className="w5pgr-frame"><img src={it.img} alt={it.alt} width="900" height="675" loading="eager" /></span>
                <span className="w5pgr-cap"><span className="w5pgr-name">{it.name}</span><span className="w5pgr-price">{it.price}</span></span>
                <span className="w5pgr-glaze">{it.glaze}</span>
              </a>
            </li>
    ))}
            <li className="w5pgr-panel w5pgr-end">
              <p className="w5pgr-endtext">Open studio every Saturday, 10 to 4. Pick pieces off the shelf and see the next firing.</p>
              <a href="#" className="w5pgr-btn">Plan a visit</a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

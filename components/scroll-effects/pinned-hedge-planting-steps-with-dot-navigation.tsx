import { useEffect, useRef } from "react";

const steps = [
  {
    "k": "1",
    "img": "https://images.pexels.com/photos/32209937/pexels-photo-32209937.jpeg?auto=compress&cs=tinysrgb&w=1000",
    "alt": "Rows of young saplings growing in black bags at an outdoor nursery",
    "title": "Pick plants for your soil",
    "text": "Tell us whether your ground is heavy clay, sandy or somewhere between, and we choose hawthorn, beech or field maple to match.",
    "tip": "Bare-root plants travel from November to March."
  },
  {
    "k": "2",
    "img": "https://images.pexels.com/photos/18303688/pexels-photo-18303688.jpeg?auto=compress&cs=tinysrgb&w=1000",
    "alt": "Two hands firming dark soil around a newly planted sapling",
    "title": "Plant in a double row",
    "text": "Set them in two staggered lines a hand's width deeper than they grew, then firm the soil with your heel.",
    "tip": "Soak the roots in a bucket for an hour first."
  },
  {
    "k": "3",
    "img": "https://images.pexels.com/photos/7656746/pexels-photo-7656746.jpeg?auto=compress&cs=tinysrgb&w=1000",
    "alt": "A metal watering can pouring water at the base of a young staked tree",
    "title": "Water through the first summer",
    "text": "A long drink once a week beats a sprinkle every evening. Roots follow the water down and hold on in dry spells.",
    "tip": "Stop once autumn rain takes over."
  },
  {
    "k": "4",
    "img": "https://images.pexels.com/photos/9890699/pexels-photo-9890699.jpeg?auto=compress&cs=tinysrgb&w=1000",
    "alt": "Close view of brown bark mulch lying in sunlight",
    "title": "Mulch to keep weeds off",
    "text": "Spread bark a few inches deep along the row, clear of the stems, so grass cannot compete for water.",
    "tip": "Top it up each spring for three years."
  },
  {
    "k": "5",
    "img": "https://images.pexels.com/photos/27397124/pexels-photo-27397124.jpeg?auto=compress&cs=tinysrgb&w=1000",
    "alt": "A long mown garden path running between tall clipped green hedges",
    "title": "Trim and let it thicken",
    "text": "Cut back by a third after planting, then lightly each summer. The hedge fills from the base and stays dense.",
    "tip": "Ask us for a trimming reminder by email."
  }
];

const css = `
.w5stp-root { --w5stp-h: 620px; --w5stp-run: 2000px; position: relative; height: var(--w5stp-h); overflow-x: hidden; overflow-y: auto; scrollbar-width: thin; }
.w5stp-root *, .w5stp-root *::before, .w5stp-root *::after { box-sizing: border-box; }
.w5stp-track { height: calc(var(--w5stp-h) + var(--w5stp-run)); }
.w5stp-stage { position: sticky; top: 0; height: var(--w5stp-h); overflow: hidden; container-type: inline-size; }
.w5stp-row { position: relative; display: flex; width: max-content; will-change: transform; }
.w5stp-hint { position: absolute; top: 12px; left: 0; right: 0; z-index: 5; display: flex; justify-content: center; pointer-events: none; transition: opacity .4s ease; }
.w5stp-hint span { padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; letter-spacing: .04em; }
.w5stp-root[data-scrolled] .w5stp-hint { opacity: 0; }
@keyframes w5stp-slide { to { transform: translateX(calc(-100% + 100cqi)); } }
@supports (animation-timeline: view()) {
  @media (min-width: 640px) and (prefers-reduced-motion: no-preference) {
    .w5stp-track { view-timeline: --w5stp-tl block; }
    .w5stp-row { animation: w5stp-slide linear both; animation-timeline: --w5stp-tl; animation-range: contain 0% contain 100%; }
  }
}
@media (max-width: 639px), (prefers-reduced-motion: reduce) {
  .w5stp-track { height: auto; }
  .w5stp-stage { position: static; height: auto; min-height: var(--w5stp-h); overflow: visible; }
  .w5stp-hint { display: none; }
  .w5stp-row { width: auto; overflow-x: auto; scroll-snap-type: x mandatory; transform: none !important; animation: none !important; scrollbar-width: thin; scroll-padding-inline: clamp(20px, 5cqi, 64px); }
  .w5stp-panel { scroll-snap-align: start; }
}
.w5stp-root { --w5stp-moss: #1c3328; --w5stp-sage: #b7cf9f; background: var(--w5stp-moss); color: #f1eee4; font-family: ui-sans-serif, system-ui, sans-serif; scrollbar-color: #36543f transparent; }
.w5stp-root { scroll-snap-type: y proximity; }
.w5stp-root:focus-visible { outline: 3px solid var(--w5stp-sage); outline-offset: -3px; }
.w5stp-hint span { background: var(--w5stp-sage); color: var(--w5stp-moss); }
.w5stp-track { position: relative; }
.w5stp-snap { position: absolute; left: 0; width: 1px; height: 1px; scroll-snap-align: start; }
.w5stp-snap:nth-child(2) { top: calc(var(--w5stp-run) * .25); }
.w5stp-snap:nth-child(3) { top: calc(var(--w5stp-run) * .5); }
.w5stp-snap:nth-child(4) { top: calc(var(--w5stp-run) * .75); }
.w5stp-snap:nth-child(5) { top: var(--w5stp-run); }
.w5stp-stage { display: flex; flex-direction: column; justify-content: center; }
.w5stp-label { margin: 0 0 20px; padding: 0 clamp(20px, 5cqi, 64px); font-size: 12px; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; color: var(--w5stp-sage); }
.w5stp-row { margin: 0; padding: 0; list-style: none; }
.w5stp-panel { flex: 0 0 100cqi; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: clamp(24px, 4cqi, 56px); align-items: center; padding: 0 clamp(20px, 5cqi, 64px); }
.w5stp-photo { aspect-ratio: 4 / 3; max-height: 420px; overflow: hidden; border-radius: 18px; background: #284433; box-shadow: 0 30px 60px -36px rgba(0, 0, 0, .7); }
.w5stp-photo img { display: block; width: 100%; height: 100%; object-fit: cover; }
.w5stp-n { margin: 0; font-size: 13px; font-weight: 600; letter-spacing: .08em; color: var(--w5stp-sage); }
.w5stp-h { margin: 10px 0 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(26px, 3.4cqi, 40px); line-height: 1.12; }
.w5stp-text { margin: 14px 0 0; max-width: 42ch; font-size: 16px; line-height: 1.65; color: #d6dccf; }
.w5stp-tip { margin: 16px 0 0; padding-left: 14px; border-left: 2px solid var(--w5stp-sage); font-size: 14px; color: #e4e9dc; }
.w5stp-link { display: inline-flex; align-items: center; min-height: 44px; margin-top: 14px; color: #f1eee4; font-size: 14px; font-weight: 600; text-decoration: underline; text-decoration-color: var(--w5stp-sage); text-underline-offset: 5px; border-radius: 4px; }
.w5stp-link:focus-visible { outline: 3px solid var(--w5stp-sage); outline-offset: 2px; }
.w5stp-dots { display: flex; justify-content: center; gap: 4px; margin-top: 22px; }
.w5stp-dot { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; border-radius: 50%; background: transparent; cursor: pointer; }
.w5stp-dot span { width: 28px; height: 4px; border-radius: 4px; background: rgba(241, 238, 228, .3); transform: scaleX(.45); transition: transform .35s cubic-bezier(.3, 1.4, .5, 1), background-color .35s ease; }
.w5stp-dot[aria-current] span { background: var(--w5stp-sage); transform: scaleX(1); }
.w5stp-dot:not([aria-current]):hover span { background: rgba(241, 238, 228, .6); }
.w5stp-dot:focus-visible { outline: 3px solid var(--w5stp-sage); outline-offset: -4px; }
@media (max-width: 639px), (prefers-reduced-motion: reduce) {
  .w5stp-root { scroll-snap-type: none !important; }
  .w5stp-snap { display: none; }
  .w5stp-stage { padding: 28px 0 12px; }
  .w5stp-row { scroll-padding-inline: 0; }
  .w5stp-panel { grid-template-columns: 1fr; align-items: start; gap: 18px; padding: 0 20px; }
  .w5stp-dot span { transition: none; }
}
@media (prefers-reduced-motion: reduce) and (min-width: 640px) { .w5stp-panel { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); align-items: center; } }
@media (max-width: 639px) { .w5stp-text { font-size: 15px; } .w5stp-link { margin-top: 6px; } }
`;

// Same script as the HTML version. It also checks prefers-reduced-motion itself.
function init(root: HTMLElement): () => void {
  // The box scrolls itself. For page scroll: remove height and overflow from .w5stp-root, set --w5stp-h to 100vh,
  // then use window scroll events and (scrollY minus the track's page top) instead of root.scrollTop.
  var $ = function (s: string): any { return root.querySelector(s); };
  var track = $(".w5stp-track"), stage = $(".w5stp-stage"), row = $(".w5stp-row");
  var still = matchMedia("(prefers-reduced-motion: reduce), (max-width: 639px)");
  var css = window.CSS && CSS.supports("animation-timeline: view()"); // CSS moves the row itself there
  var raf = 0, seen = true;
  var dots = root.querySelectorAll(".w5stp-dot"), n = dots.length;
  function go(i: number) {
    var b: any = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    still.matches ? row.scrollTo({ left: row.children[i].offsetLeft - row.offsetLeft, behavior: b })
      : root.scrollTo({ top: track.offsetTop + (span() * i) / (n - 1), behavior: b });
  }
  dots.forEach(function (d: any, i: number) { d.onclick = function () { go(i); }; });
  function cl(x: number) { return Math.min(1, Math.max(0, x)) || 0; }
  function span() { return track.offsetHeight - root.clientHeight; }
  function paint() {
    raf = 0;
    var p = cl((root.scrollTop - track.offsetTop) / span()), flat = still.matches;
    root.toggleAttribute("data-scrolled", root.scrollTop > 160);
    if (!css) row.style.transform = flat ? "" : "translateX(" + -p * Math.max(0, row.offsetWidth - stage.clientWidth) + "px)";
    var a = Math.round(flat ? row.scrollLeft / row.clientWidth : p * (n - 1));
    dots.forEach(function (d: any, i: number) { i === a ? d.setAttribute("aria-current", "step") : d.removeAttribute("aria-current"); });
  }
  function queue() { if (seen && !raf) raf = requestAnimationFrame(paint); }
  // Tabbing to a card off to the side scrolls the box to the point where that card is in view.
  function focusIn(e: any) {
    var card = e.target.closest(".w5stp-panel"), w = stage.clientWidth;
    stage.scrollLeft = 0;
    if (card && !still.matches) root.scrollTop = track.offsetTop + span() * cl((card.offsetLeft - (w - card.offsetWidth) / 2) / (row.offsetWidth - w));
  }
  var ac = new AbortController(), o = { passive: true, signal: ac.signal };
  var io = new IntersectionObserver(function (e) { seen = e[0].isIntersecting; queue(); });
  io.observe(root);
  root.addEventListener("scroll", queue, o);
  row.addEventListener("focusin", focusIn, o);
  row.addEventListener("scroll", queue, o);
  window.addEventListener("resize", queue, o);
  paint();
  return function () {
    cancelAnimationFrame(raf);
    io.disconnect();
    ac.abort();

  };
}

export default function PinnedHedgePlantingStepsWithDotNavigation() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? init(ref.current) : undefined), []);
  return (
    <section ref={ref} className="w5stp-root" data-w5stp tabIndex="0" aria-label="Hedge planting steps, scroll to move sideways">
    <style>{css}</style>
      <div className="w5stp-track">
        <span className="w5stp-snap" aria-hidden="true"></span><span className="w5stp-snap" aria-hidden="true"></span><span className="w5stp-snap" aria-hidden="true"></span><span className="w5stp-snap" aria-hidden="true"></span><span className="w5stp-snap" aria-hidden="true"></span>
        <div className="w5stp-stage">
          <div className="w5stp-hint" aria-hidden="true"><span>Scroll inside</span></div>
          <p className="w5stp-label">Larchfield Nursery &middot; Planting a hedge</p>
          <ol className="w5stp-row">
            {steps.map((it, i) => (
    <li key={i} className="w5stp-panel">
              <div className="w5stp-photo"><img src={it.img} alt={it.alt} width="1000" height="750" loading="eager" /></div>
              <div className="w5stp-copy">
                <p className="w5stp-n">Step {it.k} of 5</p>
                <h3 className="w5stp-h">{it.title}</h3>
                <p className="w5stp-text">{it.text}</p>
                <p className="w5stp-tip">{it.tip}</p>
                <a href="#" className="w5stp-link">Read the full guide</a>
              </div>
            </li>
    ))}
          </ol>
          <nav className="w5stp-dots" aria-label="Steps">
            {steps.map((it, i) => (
    <button key={i} type="button" className="w5stp-dot" aria-label={`Step ${it.k}: ${it.title}`}><span></span></button>
    ))}
          </nav>
        </div>
      </div>
    </section>
  );
}

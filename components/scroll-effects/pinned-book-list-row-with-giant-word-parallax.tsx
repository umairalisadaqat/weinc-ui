import { useEffect, useRef } from "react";

const books = [
  {
    "tone": "c1",
    "title": "The Salt Road",
    "author": "Ines Marlow",
    "kind": "Novel, out in March",
    "price": "$24"
  },
  {
    "tone": "c2",
    "title": "Small Hours",
    "author": "Theo Garrick",
    "kind": "Poems, out in March",
    "price": "$18"
  },
  {
    "tone": "c3",
    "title": "A Field Guide to Fog",
    "author": "Rhona Pell",
    "kind": "Essays, out in April",
    "price": "$22"
  },
  {
    "tone": "c4",
    "title": "Under the Viaduct",
    "author": "Sami Okoro",
    "kind": "Stories, out in April",
    "price": "$20"
  },
  {
    "tone": "c5",
    "title": "Tending",
    "author": "Mae Lindqvist",
    "kind": "Memoir, out in May",
    "price": "$26"
  },
  {
    "tone": "c6",
    "title": "The Ninth Lock",
    "author": "Dara Finch",
    "kind": "Crime, out in May",
    "price": "$19"
  }
];

const css = `
.w5gwd-root { --w5gwd-h: 620px; --w5gwd-run: 1500px; position: relative; height: var(--w5gwd-h); overflow-x: hidden; overflow-y: auto; scrollbar-width: thin; }
.w5gwd-root *, .w5gwd-root *::before, .w5gwd-root *::after { box-sizing: border-box; }
.w5gwd-track { height: calc(var(--w5gwd-h) + var(--w5gwd-run)); }
.w5gwd-stage { position: sticky; top: 0; height: var(--w5gwd-h); overflow: hidden; container-type: inline-size; }
.w5gwd-row { position: relative; display: flex; width: max-content; will-change: transform; }
.w5gwd-hint { position: absolute; top: 12px; left: 0; right: 0; z-index: 5; display: flex; justify-content: center; pointer-events: none; transition: opacity .4s ease; }
.w5gwd-hint span { padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; letter-spacing: .04em; }
.w5gwd-root[data-scrolled] .w5gwd-hint { opacity: 0; }
@keyframes w5gwd-slide { to { transform: translateX(calc(-100% + 100cqi)); } }
@supports (animation-timeline: view()) {
  @media (min-width: 640px) and (prefers-reduced-motion: no-preference) {
    .w5gwd-track { view-timeline: --w5gwd-tl block; }
    .w5gwd-row { animation: w5gwd-slide linear both; animation-timeline: --w5gwd-tl; animation-range: contain 0% contain 100%; }
  }
}
@media (max-width: 639px), (prefers-reduced-motion: reduce) {
  .w5gwd-track { height: auto; }
  .w5gwd-stage { position: static; height: auto; min-height: var(--w5gwd-h); overflow: visible; }
  .w5gwd-hint { display: none; }
  .w5gwd-row { width: auto; overflow-x: auto; scroll-snap-type: x mandatory; transform: none !important; animation: none !important; scrollbar-width: thin; scroll-padding-inline: clamp(20px, 5cqi, 64px); }
  .w5gwd-panel { scroll-snap-align: start; }
}
.w5gwd-root { --w5gwd-ink: #1b1c1f; --w5gwd-amber: #e3a857; background: var(--w5gwd-ink); color: #ecebe6; font-family: ui-sans-serif, system-ui, sans-serif; scrollbar-color: #3a3b40 transparent; }
.w5gwd-root:focus-visible { outline: 3px solid var(--w5gwd-amber); outline-offset: -3px; }
.w5gwd-hint span { background: var(--w5gwd-amber); color: var(--w5gwd-ink); }
.w5gwd-stage { display: flex; flex-direction: column; justify-content: flex-end; padding-bottom: 48px; }
.w5gwd-head { position: absolute; top: 44px; left: clamp(20px, 5cqi, 64px); }
.w5gwd-label { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: var(--w5gwd-amber); }
.w5gwd-title { margin: 8px 0 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(26px, 3.4cqi, 38px); line-height: 1.15; }
.w5gwd-word { position: absolute; top: 120px; left: 0; margin: 0; padding: 0 clamp(20px, 5cqi, 64px); width: max-content; white-space: nowrap; font-family: Georgia, "Times New Roman", serif; font-style: italic; font-size: 210px; line-height: 1; color: transparent; -webkit-text-stroke: 1.5px rgba(236, 235, 230, .2); will-change: transform; pointer-events: none; }
.w5gwd-row { margin: 0; padding: 0 clamp(20px, 5cqi, 64px); list-style: none; gap: 36px; align-items: flex-end; }
.w5gwd-panel { flex: 0 0 auto; }
.w5gwd-panel:nth-child(even) { margin-bottom: 44px; }
.w5gwd-book { display: block; width: 210px; color: inherit; text-decoration: none; border-radius: 4px; }
.w5gwd-book:focus-visible { outline: 3px solid var(--w5gwd-amber); outline-offset: 8px; }
.w5gwd-cover { position: relative; display: flex; flex-direction: column; justify-content: space-between; height: 300px; padding: 22px 20px; overflow: hidden; border-radius: 3px 8px 8px 3px; box-shadow: inset 6px 0 0 rgba(0, 0, 0, .18), 0 24px 40px -22px rgba(0, 0, 0, .8); transition: transform .5s cubic-bezier(.2, .7, .2, 1); }
.w5gwd-cover::before { content: ""; position: absolute; }
.w5gwd-book:hover .w5gwd-cover, .w5gwd-book:focus-visible .w5gwd-cover { transform: translateY(-8px) rotate(-1deg); }
.w5gwd-ct { position: relative; font-family: Georgia, "Times New Roman", serif; font-size: 25px; line-height: 1.12; }
.w5gwd-ca { position: relative; font-size: 11px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; }
.w5gwd-c1 { background: #b4532a; color: #f7e9d7; }
.w5gwd-c1::before { width: 150px; height: 150px; right: -40px; bottom: 40px; border-radius: 50%; background: #e7b98f; opacity: .55; }
.w5gwd-c2 { background: #1f4b48; color: #e5efe8; }
.w5gwd-c2::before { inset: 110px 20px 70px; background: repeating-linear-gradient(0deg, rgba(229, 239, 232, .35) 0 1px, transparent 1px 12px); }
.w5gwd-c3 { background: #d3a648; color: #2a2010; }
.w5gwd-c3::before { left: -30px; right: -30px; top: 130px; height: 80px; background: rgba(255, 250, 235, .5); border-radius: 50%; }
.w5gwd-c4 { background: #3b4e6d; color: #eef1f6; }
.w5gwd-c4::before { left: 20px; right: 20px; bottom: 60px; height: 90px; border: 2px solid rgba(238, 241, 246, .45); border-bottom: 0; border-radius: 90px 90px 0 0; }
.w5gwd-c5 { background: #e9e2d0; color: #3a3a24; }
.w5gwd-c5::before { width: 10px; height: 120px; left: 50%; bottom: 84px; background: #6b7040; border-radius: 6px; box-shadow: -26px 30px 0 #8d915e, 26px 50px 0 #8d915e; }
.w5gwd-c6 { background: #6b2330; color: #f4e3e3; }
.w5gwd-c6::before { inset: 100px 60px 60px; border: 2px solid rgba(244, 227, 227, .5); border-radius: 4px; }
.w5gwd-bt { display: block; margin-top: 16px; font-weight: 600; font-size: 15px; }
.w5gwd-ba { display: block; margin-top: 2px; font-size: 14px; color: #b9b8b2; }
.w5gwd-bk { display: flex; justify-content: space-between; margin-top: 8px; font-size: 13px; color: #a3a29c; }
.w5gwd-end { align-self: center; width: 250px; padding-left: 28px; border-left: 1px solid #3a3b40; }
.w5gwd-endtext { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: 20px; line-height: 1.4; }
.w5gwd-btn { display: inline-flex; align-items: center; min-height: 44px; margin-top: 18px; padding: 0 20px; border-radius: 999px; background: var(--w5gwd-amber); color: var(--w5gwd-ink); font-size: 14px; font-weight: 600; text-decoration: none; }
.w5gwd-btn:hover { background: #f0c488; }
.w5gwd-btn:focus-visible { outline: 3px solid #ecebe6; outline-offset: 3px; }
@supports (animation-timeline: view()) {
  @media (min-width: 640px) and (prefers-reduced-motion: no-preference) {
    .w5gwd-word { animation: w5gwd-slide linear both; animation-timeline: --w5gwd-tl; animation-range: contain 0% contain 100%; }
  }
}
@media (max-width: 639px), (prefers-reduced-motion: reduce) {
  .w5gwd-stage { justify-content: center; gap: 28px; padding: 36px 0; }
  .w5gwd-head { position: static; padding: 0 20px; }
  .w5gwd-word { display: none; }
  .w5gwd-row { gap: 20px; padding-bottom: 12px; align-items: flex-start; }
  .w5gwd-panel:nth-child(even) { margin-bottom: 0; }
  .w5gwd-book { width: 180px; }
  .w5gwd-cover { height: 258px; transition: none; }
}
`;

// Same script as the HTML version. It also checks prefers-reduced-motion itself.
function init(root: HTMLElement): () => void {
  // The box scrolls itself. For page scroll: remove height and overflow from .w5gwd-root, set --w5gwd-h to 100vh,
  // then use window scroll events and (scrollY minus the track's page top) instead of root.scrollTop.
  var AUTO = 80; // demo scroll speed in px per second until someone scrolls; 0 turns it off
  var $ = function (s: string): any { return root.querySelector(s); };
  var track = $(".w5gwd-track"), stage = $(".w5gwd-stage"), row = $(".w5gwd-row");
  var still = matchMedia("(prefers-reduced-motion: reduce), (max-width: 639px)");
  var css = window.CSS && CSS.supports("animation-timeline: view()"); // CSS moves the row itself there
  var af = requestAnimationFrame, caf = cancelAnimationFrame, raf = 0, demo = 0, last = 0, pos = 0, seen = true, done = !AUTO;
  var word = $(".w5gwd-word");
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
    shift(word, p, flat);
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
    var card = e.target.closest(".w5gwd-panel");
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

export default function PinnedBookListRowWithGiantWordParallax() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? init(ref.current) : undefined), []);
  return (
    <section ref={ref} className="w5gwd-root" data-w5gwd tabIndex="0" aria-label="Spring books, scroll to move sideways">
    <style>{css}</style>
      <div className="w5gwd-track">
        <div className="w5gwd-stage">
          <div className="w5gwd-hint" aria-hidden="true"><span>Scroll inside</span></div>
          <p className="w5gwd-word" aria-hidden="true">New for spring</p>
          <div className="w5gwd-head">
            <p className="w5gwd-label">Oxbow Press</p>
            <h2 className="w5gwd-title">Six new books for spring</h2>
          </div>
          <ul className="w5gwd-row" role="list">
            {books.map((it, i) => (
    <li key={i} className="w5gwd-panel">
              <a href="#" className="w5gwd-book">
                <span className={`w5gwd-cover w5gwd-${it.tone}`} aria-hidden="true"><span className="w5gwd-ct">{it.title}</span><span className="w5gwd-ca">{it.author}</span></span>
                <span className="w5gwd-bt">{it.title}</span>
                <span className="w5gwd-ba">{it.author}</span>
                <span className="w5gwd-bk"><span>{it.kind}</span><span>{it.price}</span></span>
              </a>
            </li>
    ))}
            <li className="w5gwd-panel w5gwd-end">
              <p className="w5gwd-endtext">Order any two before publication and we post them together, signed where we can.</p>
              <a href="#" className="w5gwd-btn">See the full catalogue</a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

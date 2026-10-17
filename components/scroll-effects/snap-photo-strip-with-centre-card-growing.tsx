import { useEffect, useRef } from "react";

const homes = [
  {
    "img": "https://images.pexels.com/photos/27390890/pexels-photo-27390890.jpeg?auto=compress&cs=tinysrgb&w=700",
    "alt": "A small stone cottage with a turf roof above a rocky shore under an evening sky",
    "name": "The Bothy",
    "place": "Carrick Point",
    "sleeps": "Sleeps 2",
    "price": "from $140 a night"
  },
  {
    "img": "https://images.pexels.com/photos/38235551/pexels-photo-38235551.jpeg?auto=compress&cs=tinysrgb&w=700",
    "alt": "A white house on a grassy dune above a pebble beach and grey sea",
    "name": "Dune House",
    "place": "Hessel Bay",
    "sleeps": "Sleeps 6",
    "price": "from $260 a night"
  },
  {
    "img": "https://images.pexels.com/photos/5823211/pexels-photo-5823211.jpeg?auto=compress&cs=tinysrgb&w=700",
    "alt": "A lone house on top of a dark green hill above a quiet shore",
    "name": "Hill End",
    "place": "Morrow Head",
    "sleeps": "Sleeps 4",
    "price": "from $190 a night"
  },
  {
    "img": "https://images.pexels.com/photos/6916146/pexels-photo-6916146.jpeg?auto=compress&cs=tinysrgb&w=700",
    "alt": "A pale yellow house with a red roof on rocks, lit by a pink sunset",
    "name": "Signal Cottage",
    "place": "Ness Harbour",
    "sleeps": "Sleeps 4",
    "price": "from $210 a night"
  },
  {
    "img": "https://images.pexels.com/photos/36707272/pexels-photo-36707272.jpeg?auto=compress&cs=tinysrgb&w=700",
    "alt": "A red wooden boathouse at the edge of a still lake below misty green hills",
    "name": "The Boathouse",
    "place": "Lake Ferrin",
    "sleeps": "Sleeps 2",
    "price": "from $150 a night"
  },
  {
    "img": "https://images.pexels.com/photos/19680864/pexels-photo-19680864.jpeg?auto=compress&cs=tinysrgb&w=700",
    "alt": "A farmhouse among cypress trees on rolling green fields in morning mist",
    "name": "Upper Fold Farm",
    "place": "Calder Vale",
    "sleeps": "Sleeps 8",
    "price": "from $320 a night"
  }
];

const css = `
.w5ctr-root { --w5ctr-clay: #7b3421; --w5ctr-card: 280px; --w5ctr-small: .84; padding: 52px 0 40px; background: var(--w5ctr-clay); color: #fbefe4; font-family: ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
.w5ctr-root *, .w5ctr-root *::before { box-sizing: border-box; }
.w5ctr-head { padding: 0 20px; text-align: center; }
.w5ctr-label { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: #f4c8a8; }
.w5ctr-title { margin: 8px 0 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(28px, 4vw, 40px); line-height: 1.12; }
.w5ctr-row { display: flex; gap: 8px; margin: 26px 0 0; padding: 10px calc(50% - var(--w5ctr-card) / 2) 14px; list-style: none; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior-x: contain; }
.w5ctr-row::-webkit-scrollbar { display: none; }
.w5ctr-row:focus-visible { outline: 3px solid #f4c8a8; outline-offset: -3px; }
.w5ctr-card { flex: 0 0 var(--w5ctr-card); scroll-snap-align: center; view-timeline: --w5ctr-card inline; }
.w5ctr-in { display: block; color: inherit; text-decoration: none; text-align: center; border-radius: 16px; transform: scale(var(--w5ctr-small)); will-change: transform; }
.w5ctr-in:focus-visible { outline: 3px solid #f4c8a8; outline-offset: 6px; }
.w5ctr-photo { position: relative; display: block; aspect-ratio: 4 / 5; overflow: hidden; border-radius: 16px; background: #5e2718; box-shadow: 0 26px 50px -30px rgba(20, 5, 0, .8); }
.w5ctr-photo img { display: block; width: 100%; height: 100%; object-fit: cover; }
.w5ctr-dim { position: absolute; inset: 0; background: #3a150b; opacity: .45; }
.w5ctr-name { display: block; margin-top: 16px; font-family: Georgia, "Times New Roman", serif; font-size: 22px; }
.w5ctr-meta { display: block; margin-top: 4px; font-size: 14px; color: #f1d8c6; }
.w5ctr-price { display: block; margin-top: 4px; font-size: 14px; font-weight: 600; }
.w5ctr-btns { display: flex; justify-content: center; gap: 12px; margin-top: 18px; }
.w5ctr-btns button { display: grid; place-items: center; width: 48px; height: 48px; padding: 0; border: 1px solid rgba(251, 239, 228, .4); border-radius: 50%; background: transparent; color: #fbefe4; cursor: pointer; transition: background-color .2s ease; }
.w5ctr-btns button:hover { background: rgba(251, 239, 228, .12); }
.w5ctr-btns button[aria-disabled="true"] { opacity: .35; cursor: default; }
.w5ctr-btns button:focus-visible { outline: 3px solid #f4c8a8; outline-offset: 3px; }
@keyframes w5ctr-grow { 0%, 100% { transform: scale(var(--w5ctr-small)); } 50% { transform: scale(1); } }
@keyframes w5ctr-lift { 0%, 100% { opacity: .45; } 50% { opacity: 0; } }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .w5ctr-in { animation: w5ctr-grow linear both; animation-timeline: --w5ctr-card; }
    .w5ctr-dim { animation: w5ctr-lift linear both; animation-timeline: --w5ctr-card; }
  }
}
@media (prefers-reduced-motion: reduce) {
  .w5ctr-in { transform: none; }
  .w5ctr-dim { opacity: 0; }
  .w5ctr-row { gap: 20px; }
  .w5ctr-btns button { transition: none; }
}
@media (max-width: 639px) { .w5ctr-root { --w5ctr-card: 240px; } }
`;

// Same script as the HTML version. It also checks prefers-reduced-motion itself.
function init(root: HTMLElement): () => void {
  var $ = function (s: string): any { return root.querySelector(s); };
  var row = $(".w5ctr-row"), prev = $(".w5ctr-prev"), next = $(".w5ctr-next");
  var rm = matchMedia("(prefers-reduced-motion: reduce)");
  var ac = new AbortController(), o = { passive: true, signal: ac.signal };
  var go = function (d: number) { row.scrollBy({ left: d * row.clientWidth * 0.8, behavior: rm.matches ? "auto" : "smooth" }); };
  var START = 1, SMALL = 0.84; // card centred on load, and side card scale
  var cards = [].slice.call(row.children), css = window.CSS && CSS.supports("animation-timeline: view()");
  var seen = true, raf = 0;
  var io = new IntersectionObserver(function (e) { seen = e[0].isIntersecting; });
  io.observe(root);
  // Fallback for browsers without view timelines: scale each card by its distance from the centre.
  function grow() {
    raf = 0;
    var mid = row.scrollLeft + row.clientWidth / 2;
    cards.forEach(function (c: any) {
      var d = Math.min(1, Math.abs(c.offsetLeft - row.offsetLeft + c.offsetWidth / 2 - mid) / (c.offsetWidth + 8));
      c.firstElementChild.style.transform = "scale(" + (1 - (1 - SMALL) * d) + ")";
      c.querySelector(".w5ctr-dim").style.opacity = 0.45 * d;
    });
  }
  var c0 = cards[START];
  row.scrollLeft = c0.offsetLeft - row.offsetLeft - (row.clientWidth - c0.offsetWidth) / 2;
  function paint() {
    var max = row.scrollWidth - row.clientWidth, x = row.scrollLeft;
    prev.setAttribute("aria-disabled", String(x < 4));
    next.setAttribute("aria-disabled", String(x > max - 4));
    if (!css && !rm.matches && seen && !raf) raf = requestAnimationFrame(grow);
  }
  prev.addEventListener("click", function () { go(-1); }, o);
  next.addEventListener("click", function () { go(1); }, o);
  row.addEventListener("scroll", paint, o);
  window.addEventListener("resize", paint, o);
  paint();
  return function () {
    ac.abort();
    io.disconnect();
    cancelAnimationFrame(raf);
  };
}

export default function SnapPhotoStripWithCentreCardGrowing() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? init(ref.current) : undefined), []);
  return (
    <section ref={ref} className="w5ctr-root" data-w5ctr aria-labelledby="w5ctr-title">
    <style>{css}</style>
      <div className="w5ctr-head">
        <p className="w5ctr-label">Saltmarsh Stays</p>
        <h2 className="w5ctr-title" id="w5ctr-title">Six houses at the edge of the map</h2>
      </div>
      <ul className="w5ctr-row" id="w5ctr-row" role="list" tabIndex="0" aria-label="Holiday houses, scroll sideways">
        {homes.map((it, i) => (
    <li key={i} className="w5ctr-card">
          <a href="#" className="w5ctr-in">
            <span className="w5ctr-photo"><img src={it.img} alt={it.alt} width="700" height="875" loading="eager" /><span className="w5ctr-dim" aria-hidden="true"></span></span>
            <span className="w5ctr-name">{it.name}</span>
            <span className="w5ctr-meta">{it.place} &middot; {it.sleeps}</span>
            <span className="w5ctr-price">{it.price}</span>
          </a>
        </li>
    ))}
      </ul>
      <div className="w5ctr-btns">
        <button type="button" className="w5ctr-prev" aria-controls="w5ctr-row" aria-label="Previous house"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        <button type="button" className="w5ctr-next" aria-controls="w5ctr-row" aria-label="Next house"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      </div>
    </section>
  );
}

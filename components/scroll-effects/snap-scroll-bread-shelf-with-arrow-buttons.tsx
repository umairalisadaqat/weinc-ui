import { useEffect, useRef } from "react";

const loaves = [
  {
    "img": "https://images.pexels.com/photos/32935771/pexels-photo-32935771.jpeg?auto=compress&cs=tinysrgb&w=700",
    "alt": "Scored sourdough loaves with a deep golden crust, close up",
    "name": "Country sourdough",
    "price": "$9",
    "note": "Three day ferment, dark bake, open crumb."
  },
  {
    "img": "https://images.pexels.com/photos/8599725/pexels-photo-8599725.jpeg?auto=compress&cs=tinysrgb&w=700",
    "alt": "Thick slices of dark seeded rye bread on a white surface",
    "name": "Seeded rye",
    "price": "$8",
    "note": "Dense and sour, best sliced thin with butter."
  },
  {
    "img": "https://images.pexels.com/photos/34936588/pexels-photo-34936588.jpeg?auto=compress&cs=tinysrgb&w=700",
    "alt": "Golden baguettes stacked together on a bakery shelf",
    "name": "Morning baguette",
    "price": "$4",
    "note": "Out of the oven at seven, gone by ten."
  },
  {
    "img": "https://images.pexels.com/photos/33657315/pexels-photo-33657315.jpeg?auto=compress&cs=tinysrgb&w=700",
    "alt": "Squares of focaccia topped with cherry tomatoes and rosemary in a pan",
    "name": "Tomato focaccia",
    "price": "$7",
    "note": "Olive oil, sea salt and roasted tomatoes."
  },
  {
    "img": "https://images.pexels.com/photos/30632209/pexels-photo-30632209.jpeg?auto=compress&cs=tinysrgb&w=700",
    "alt": "A whole grain loaf covered in seeds held over a checked cloth",
    "name": "Granary tin",
    "price": "$7",
    "note": "Malted flakes for a soft, nutty sandwich loaf."
  },
  {
    "img": "https://images.pexels.com/photos/31132628/pexels-photo-31132628.jpeg?auto=compress&cs=tinysrgb&w=700",
    "alt": "Spiral morning buns on a tray in a bakery window behind a handwritten label",
    "name": "Morning buns",
    "price": "$4.75",
    "note": "Orange zest and cinnamon, Saturdays only."
  }
];

const css = `
.w5shf-root { --w5shf-flour: #f1e8d8; --w5shf-crust: #7a3c1b; --w5shf-card: 260px; --w5shf-max: 1160px; --w5shf-pad: max(20px, calc((100% - var(--w5shf-max)) / 2)); padding: 56px 0 48px; background: var(--w5shf-flour); color: #2d231a; font-family: ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
.w5shf-root *, .w5shf-root *::before { box-sizing: border-box; }
.w5shf-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding: 0 var(--w5shf-pad); }
.w5shf-label { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: var(--w5shf-crust); }
.w5shf-title { margin: 8px 0 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(28px, 4vw, 40px); line-height: 1.12; }
.w5shf-lede { margin: 10px 0 0; max-width: 48ch; font-size: 15px; line-height: 1.6; color: #5b4a3a; }
.w5shf-btns { display: flex; gap: 10px; flex: 0 0 auto; }
.w5shf-btns button { display: grid; place-items: center; width: 48px; height: 48px; padding: 0; border: 1px solid #cdbba1; border-radius: 50%; background: #fbf6ee; color: #2d231a; cursor: pointer; transition: background-color .2s ease, transform .2s ease; }
.w5shf-btns button:hover { background: #fff; }
.w5shf-btns button:active { transform: scale(.94); }
.w5shf-btns button[aria-disabled="true"] { opacity: .4; cursor: default; }
.w5shf-btns button:focus-visible, .w5shf-row:focus-visible, .w5shf-add:focus-visible { outline: 3px solid var(--w5shf-crust); outline-offset: 3px; }
.w5shf-row { display: flex; gap: 22px; margin: 28px 0 0; padding: 4px var(--w5shf-pad) 8px; list-style: none; overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding-inline: var(--w5shf-pad); scrollbar-width: none; overscroll-behavior-x: contain; }
.w5shf-row::-webkit-scrollbar { display: none; }
.w5shf-card { position: relative; flex: 0 0 var(--w5shf-card); scroll-snap-align: start; }
.w5shf-photo { aspect-ratio: 4 / 5; overflow: hidden; border-radius: 14px; background: #e3d5bf; }
.w5shf-photo img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform .6s cubic-bezier(.2, .7, .2, 1); }
.w5shf-card:hover img, .w5shf-card:focus-within img { transform: scale(1.04); }
.w5shf-line { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-top: 14px; }
.w5shf-name { margin: 0; font-size: 16px; font-weight: 600; }
.w5shf-price { font-size: 15px; font-variant-numeric: tabular-nums; color: #5b4a3a; }
.w5shf-note { margin: 6px 0 0; font-size: 14px; line-height: 1.5; color: #5b4a3a; }
.w5shf-add { display: inline-flex; align-items: center; min-height: 40px; margin-top: 4px; font-size: 14px; font-weight: 600; color: var(--w5shf-crust); text-decoration: underline; text-underline-offset: 4px; border-radius: 4px; }
.w5shf-bar { height: 2px; margin: 18px var(--w5shf-pad) 0; background: #dccdb6; overflow: hidden; }
.w5shf-fill { display: block; height: 100%; background: var(--w5shf-crust); transform: scaleX(.3); transform-origin: 0 50%; }
.w5shf-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (max-width: 639px) { .w5shf-head { flex-direction: column; align-items: flex-start; } .w5shf-root { --w5shf-card: 230px; } }
@media (prefers-reduced-motion: reduce) { .w5shf-photo img, .w5shf-btns button { transition: none; } }
`;

// Same script as the HTML version. It also checks prefers-reduced-motion itself.
function init(root: HTMLElement): () => void {
  var $ = function (s: string): any { return root.querySelector(s); };
  var row = $(".w5shf-row"), prev = $(".w5shf-prev"), next = $(".w5shf-next");
  var rm = matchMedia("(prefers-reduced-motion: reduce)");
  var ac = new AbortController(), o = { passive: true, signal: ac.signal };
  var go = function (d: number) { row.scrollBy({ left: d * row.clientWidth * 0.8, behavior: rm.matches ? "auto" : "smooth" }); };

  function paint() {
    var max = row.scrollWidth - row.clientWidth, x = row.scrollLeft;
    prev.setAttribute("aria-disabled", String(x < 4));
    next.setAttribute("aria-disabled", String(x > max - 4));
    var seen = row.clientWidth / row.scrollWidth;
    $(".w5shf-fill").style.transform = "scaleX(" + (seen + (1 - seen) * (max > 0 ? x / max : 1)) + ")";
  }
  prev.addEventListener("click", function () { go(-1); }, o);
  next.addEventListener("click", function () { go(1); }, o);
  row.addEventListener("scroll", paint, o);
  window.addEventListener("resize", paint, o);
  paint();
  return function () {
    ac.abort();

  };
}

export default function SnapScrollBreadShelfWithArrowButtons() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? init(ref.current) : undefined), []);
  return (
    <section ref={ref} className="w5shf-root" data-w5shf aria-labelledby="w5shf-title">
    <style>{css}</style>
      <div className="w5shf-head">
        <div>
          <p className="w5shf-label">Fennick Bakehouse</p>
          <h2 className="w5shf-title" id="w5shf-title">On the shelf this week</h2>
          <p className="w5shf-lede">Order by Thursday night and we hold your loaves at the counter until noon on Saturday.</p>
        </div>
        <div className="w5shf-btns">
          <button type="button" className="w5shf-prev" aria-controls="w5shf-row" aria-label="Previous loaves"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          <button type="button" className="w5shf-next" aria-controls="w5shf-row" aria-label="Next loaves"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        </div>
      </div>
      <ul className="w5shf-row" id="w5shf-row" role="list" tabIndex="0" aria-label="Breads, scroll sideways">
        {loaves.map((it, i) => (
    <li key={i} className="w5shf-card">
          <div className="w5shf-photo"><img src={it.img} alt={it.alt} width="700" height="875" loading="eager" /></div>
          <div className="w5shf-line"><h3 className="w5shf-name">{it.name}</h3><span className="w5shf-price">{it.price}</span></div>
          <p className="w5shf-note">{it.note}</p>
          <a href="#" className="w5shf-add">Reserve<span className="w5shf-sr"> {it.name}</span></a>
        </li>
    ))}
      </ul>
      <div className="w5shf-bar" aria-hidden="true"><span className="w5shf-fill"></span></div>
    </section>
  );
}

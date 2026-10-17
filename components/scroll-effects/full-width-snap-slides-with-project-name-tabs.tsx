import { useEffect, useRef } from "react";

const projects = [
  {
    "img": "https://images.pexels.com/photos/13041129/pexels-photo-13041129.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "alt": "A low concrete house with tall glass doors opening onto a stone path and a lawn",
    "k": "1",
    "name": "Hollow Lane House",
    "kind": "New home in a walled garden",
    "text": "A single storey house set low behind an old brick wall, so the garden reads first and the building second. Every room opens onto grass."
  },
  {
    "img": "https://images.pexels.com/photos/12713154/pexels-photo-12713154.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "alt": "A grey concrete house built from stacked box shapes with planting along its front and an open garage",
    "k": "2",
    "name": "Quarry Street",
    "kind": "Two homes on a narrow plot",
    "text": "Two family houses stacked like blocks on a gap site, with roof terraces where the street could not give them gardens."
  },
  {
    "img": "https://images.pexels.com/photos/31390421/pexels-photo-31390421.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "alt": "A library hall with curved tiers of seating below tall wooden bookshelves",
    "k": "3",
    "name": "Westbrook Library",
    "kind": "Public library refit",
    "text": "We took out a suspended ceiling, found the original timber roof and wrapped the reading room in shelves and stepped seats."
  },
  {
    "img": "https://images.pexels.com/photos/15391694/pexels-photo-15391694.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "alt": "A two storey concrete villa with dark window frames half hidden by palm trees",
    "k": "4",
    "name": "Palm Court",
    "kind": "Holiday house in a warm climate",
    "text": "Thick walls and deep window reveals keep the rooms cool without much help, and the planting is left to grow up the facade."
  }
];

const css = `
.w5prj-root { --w5prj-ink: #1e293b; --w5prj-line: #d5dbe3; --w5prj-max: 1160px; --w5prj-pad: max(20px, calc((100% - var(--w5prj-max)) / 2)); padding: 52px 0 44px; background: #ffffff; color: var(--w5prj-ink); font-family: ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
.w5prj-root *, .w5prj-root *::before { box-sizing: border-box; }
.w5prj-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding: 0 var(--w5prj-pad); }
.w5prj-label { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: #475569; }
.w5prj-title { margin: 8px 0 0; font-size: clamp(28px, 4vw, 40px); font-weight: 600; letter-spacing: -.02em; line-height: 1.1; }
.w5prj-btns { display: flex; align-items: center; gap: 8px; }
.w5prj-count { margin-right: 8px; font-size: 14px; font-variant-numeric: tabular-nums; color: #475569; }
.w5prj-btns button { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 1px solid var(--w5prj-line); border-radius: 10px; background: #fff; color: var(--w5prj-ink); cursor: pointer; transition: background-color .2s ease, border-color .2s ease; }
.w5prj-btns button:hover { background: #f1f5f9; border-color: #94a3b8; }
.w5prj-btns button[aria-disabled="true"] { opacity: .4; cursor: default; }
.w5prj-tabs { display: flex; gap: 4px 28px; flex-wrap: wrap; margin: 24px var(--w5prj-pad) 0; border-bottom: 1px solid var(--w5prj-line); }
.w5prj-tab { position: relative; min-height: 44px; padding: 0; border: 0; background: none; color: #475569; font: inherit; font-size: 15px; cursor: pointer; }
.w5prj-tab::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--w5prj-ink); transform: scaleX(0); transform-origin: 0 50%; transition: transform .4s cubic-bezier(.2, .7, .2, 1); }
.w5prj-tab:hover { color: var(--w5prj-ink); }
.w5prj-tab[aria-current="true"] { color: var(--w5prj-ink); font-weight: 600; }
.w5prj-tab[aria-current="true"]::after { transform: scaleX(1); }
.w5prj-btns button:focus-visible, .w5prj-tab:focus-visible, .w5prj-row:focus-visible, .w5prj-link:focus-visible { outline: 3px solid #334155; outline-offset: 3px; border-radius: 6px; }
.w5prj-row { display: flex; margin: 28px 0 0; padding: 0; list-style: none; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior-x: contain; }
.w5prj-row::-webkit-scrollbar { display: none; }
.w5prj-slide { flex: 0 0 100%; display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: clamp(24px, 4vw, 56px); align-items: center; padding: 0 var(--w5prj-pad); scroll-snap-align: start; scroll-snap-stop: always; }
.w5prj-photo { aspect-ratio: 16 / 10; overflow: hidden; border-radius: 4px; background: #e2e8f0; }
.w5prj-photo img { display: block; width: 100%; height: 100%; object-fit: cover; }
.w5prj-k { margin: 0; font-size: 13px; color: #475569; font-variant-numeric: tabular-nums; }
.w5prj-name { margin: 10px 0 0; font-size: clamp(24px, 3vw, 32px); font-weight: 600; letter-spacing: -.015em; line-height: 1.15; }
.w5prj-kind { margin: 6px 0 0; font-size: 15px; color: #475569; }
.w5prj-text { margin: 18px 0 0; max-width: 44ch; font-size: 16px; line-height: 1.65; color: #334155; }
.w5prj-link { display: inline-flex; align-items: center; min-height: 44px; margin-top: 12px; color: var(--w5prj-ink); font-size: 15px; font-weight: 600; text-decoration: underline; text-underline-offset: 5px; }
@media (max-width: 767px) {
  .w5prj-slide { grid-template-columns: 1fr; align-items: start; gap: 18px; }
  .w5prj-tabs { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; gap: 22px; }
  .w5prj-tab { flex: 0 0 auto; }
  .w5prj-count { display: none; }
}
@media (prefers-reduced-motion: reduce) { .w5prj-tab::after, .w5prj-btns button { transition: none; } }
`;

// Same script as the HTML version. It also checks prefers-reduced-motion itself.
function init(root: HTMLElement): () => void {
  var $ = function (s: string): any { return root.querySelector(s); };
  var row = $(".w5prj-row"), prev = $(".w5prj-prev"), next = $(".w5prj-next");
  var rm = matchMedia("(prefers-reduced-motion: reduce)");
  var ac = new AbortController(), o = { passive: true, signal: ac.signal };
  var go = function (d: number) { row.scrollBy({ left: d * row.clientWidth * 0.8, behavior: rm.matches ? "auto" : "smooth" }); };
  var tabs = root.querySelectorAll(".w5prj-tab"), count = $(".w5prj-count"), cur = -1;
  tabs.forEach(function (t: any, i: number) {
    t.addEventListener("click", function () { row.scrollTo({ left: i * row.clientWidth, behavior: rm.matches ? "auto" : "smooth" }); }, o);
  });
  go = function (d: number) { row.scrollBy({ left: d * row.clientWidth, behavior: rm.matches ? "auto" : "smooth" }); };
  function paint() {
    var max = row.scrollWidth - row.clientWidth, x = row.scrollLeft;
    prev.setAttribute("aria-disabled", String(x < 4));
    next.setAttribute("aria-disabled", String(x > max - 4));
    var a = Math.round(x / row.clientWidth);
    if (a === cur) return;
    cur = a;
    count.textContent = a + 1 + " / " + tabs.length;
    tabs.forEach(function (t: any, i: number) { t.setAttribute("aria-current", String(i === a)); });
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

export default function FullWidthSnapSlidesWithProjectNameTabs() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? init(ref.current) : undefined), []);
  return (
    <section ref={ref} className="w5prj-root" data-w5prj aria-labelledby="w5prj-title">
    <style>{css}</style>
      <div className="w5prj-head">
        <div>
          <p className="w5prj-label">Arden &amp; Vale Architects</p>
          <h2 className="w5prj-title" id="w5prj-title">Selected projects</h2>
        </div>
        <div className="w5prj-btns">
          <span className="w5prj-count" aria-hidden="true">1 / 4</span>
          <button type="button" className="w5prj-prev" aria-controls="w5prj-row" aria-label="Previous project"><svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          <button type="button" className="w5prj-next" aria-controls="w5prj-row" aria-label="Next project"><svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        </div>
      </div>
      <nav className="w5prj-tabs" aria-label="Projects">
        {projects.map((it, i) => (
    <button key={i} type="button" className="w5prj-tab" aria-controls="w5prj-row">{it.name}</button>
    ))}
      </nav>
      <ul className="w5prj-row" id="w5prj-row" role="list" tabIndex="0" aria-label="Projects, scroll sideways">
        {projects.map((it, i) => (
    <li key={i} className="w5prj-slide">
          <div className="w5prj-photo"><img src={it.img} alt={it.alt} width="1200" height="900" loading="eager" /></div>
          <div className="w5prj-copy">
            <p className="w5prj-k">Project {it.k} of 4</p>
            <h3 className="w5prj-name">{it.name}</h3>
            <p className="w5prj-kind">{it.kind}</p>
            <p className="w5prj-text">{it.text}</p>
            <a href="#" className="w5prj-link">Read about {it.name}</a>
          </div>
        </li>
    ))}
      </ul>
    </section>
  );
}

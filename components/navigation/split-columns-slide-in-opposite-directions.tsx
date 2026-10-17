import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { useReducedMotion } from "framer-motion";

// Same styles as the plain HTML version; the comment at the top of STYLES names the values to change.
const STYLES = `
  /* Change these: --w6col-paper, --w6col-ink, --w6col-blue (accent), the 48px and 30% travel in the
     w6col keyframes, and the .55s durations. */
  .w6col { --w6col-paper: #fafaf9; --w6col-ink: #1e293b; --w6col-blue: #35577a;
    height: 620px; display: flex; flex-direction: column; background: var(--w6col-paper); color: var(--w6col-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
  .w6col *, .w6col *::before { box-sizing: border-box; }
  .w6col-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 24px; padding: 16px clamp(16px, 4.5vw, 52px); border-bottom: 1px solid #e2e8f0; }
  .w6col-brand { margin: 0; font-size: 1rem; font-weight: 700; letter-spacing: -.01em; }
  .w6col-brand span { font-weight: 400; color: #475569; }
  .w6col-nav { display: flex; gap: 2px; margin: 0 -12px; padding: 0; list-style: none; }
  .w6col-nav a { display: inline-flex; align-items: center; min-height: 40px; padding: 0 12px; border-radius: 999px; color: #475569; font-size: .9375rem; text-decoration: none; }
  .w6col-nav a:hover { color: var(--w6col-ink); }
  .w6col-nav a[aria-current="page"] { background: #e8eef5; color: var(--w6col-blue); font-weight: 600; }
  .w6col a:focus-visible, .w6col h2:focus-visible { outline: 2px solid var(--w6col-blue); outline-offset: 3px; }
  .w6col h2:focus { outline: none; }
  .w6col-stage { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; }
  .w6col-view { display: flex; flex-direction: column-reverse; }
  .w6col-view[hidden] { display: none; }
  .w6col-pic { height: 210px; overflow: hidden; background: #e2e8f0; }
  .w6col-pic img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .w6col-txt { padding: 22px clamp(16px, 4.5vw, 52px) 28px; background: var(--w6col-paper); }
  .w6col-num { margin: 0; font-size: .8125rem; font-weight: 700; letter-spacing: .12em; color: var(--w6col-blue); font-variant-numeric: tabular-nums; }
  .w6col h2 { margin: 8px 0 0; font-size: clamp(1.6rem, 3.4vw, 2.5rem); font-weight: 650; line-height: 1.08; letter-spacing: -.025em; max-width: 15ch; }
  .w6col-txt > p:not(.w6col-num) { margin: 14px 0 0; max-width: 30rem; font-size: 1rem; line-height: 1.6; color: #475569; }
  .w6col-list { margin: 18px 0 0; padding: 0; list-style: none; display: grid; gap: 8px; }
  .w6col-list li { display: flex; gap: 10px; font-size: .9375rem; }
  .w6col-list li::before { content: ""; flex: none; width: 6px; height: 6px; margin-top: .55em; border-radius: 50%; background: var(--w6col-blue); }
  .w6col-more { display: inline-flex; align-items: center; min-height: 44px; margin-top: 20px; padding: 0 20px; border-radius: 999px; background: var(--w6col-ink); color: #fff; font-size: .875rem; font-weight: 600; text-decoration: none; }
  .w6col-more:hover { background: var(--w6col-blue); }
  @media (min-width: 820px) {
    .w6col-stage { overflow: hidden; }
    .w6col-view { height: 100%; flex-direction: row; }
    .w6col-txt { flex: 1.1; align-self: center; padding: 32px 52px; }
    .w6col-pic { flex: 1; height: 100%; }
  }

  /* Two named columns, named only while the page changes. Going forward the text rises and the photo falls,
     going back they swap directions; each group clips its own snapshot so nothing spills over the header.
     Separate pages: add  @view-transition { navigation: auto; }  and give both columns these names on every page. */
  ::view-transition-group(w6col-text), ::view-transition-group(w6col-pic) { animation: none; overflow: clip; }
  ::view-transition-old(w6col-text), ::view-transition-new(w6col-text), ::view-transition-old(w6col-pic), ::view-transition-new(w6col-pic) { mix-blend-mode: normal; }
  ::view-transition-old(w6col-text) { animation: w6col-up-out .3s cubic-bezier(.4, 0, .6, 1) both; }
  ::view-transition-new(w6col-text) { animation: w6col-up-in .55s .1s cubic-bezier(.2, .8, .2, 1) both; }
  ::view-transition-old(w6col-pic) { animation: w6col-down-out .55s cubic-bezier(.6, 0, .3, 1) both; }
  ::view-transition-new(w6col-pic) { animation: w6col-down-in .55s cubic-bezier(.6, 0, .3, 1) both; }
  :root[data-w6col-dir="b"]::view-transition-old(w6col-text) { animation-name: w6col-down-fade; }
  :root[data-w6col-dir="b"]::view-transition-new(w6col-text) { animation-name: w6col-down-text; }
  :root[data-w6col-dir="b"]::view-transition-old(w6col-pic) { animation-name: w6col-up-pic; }
  :root[data-w6col-dir="b"]::view-transition-new(w6col-pic) { animation-name: w6col-up-from; }
  @keyframes w6col-up-out { to { opacity: 0; transform: translateY(-48px); } }
  @keyframes w6col-up-in { from { opacity: 0; transform: translateY(48px); } }
  @keyframes w6col-down-fade { to { opacity: 0; transform: translateY(48px); } }
  @keyframes w6col-down-text { from { opacity: 0; transform: translateY(-48px); } }
  @keyframes w6col-down-out { to { transform: translateY(100%); } }
  @keyframes w6col-down-in { from { transform: translateY(-100%); } }
  @keyframes w6col-up-pic { to { transform: translateY(-100%); } }
  @keyframes w6col-up-from { from { transform: translateY(100%); } }
  /* Fallback without view transitions: the new columns arrive from opposite sides. */
  .w6col[data-fb] .w6col-view:not([hidden]) .w6col-txt { animation: w6col-up-in .5s cubic-bezier(.2, .8, .2, 1) both; }
  .w6col[data-fb] .w6col-view:not([hidden]) .w6col-pic img { animation: w6col-settle .6s cubic-bezier(.2, .8, .2, 1) both; }
  @keyframes w6col-settle { from { opacity: 0; transform: scale(1.08); } }
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(w6col-text), ::view-transition-group(w6col-pic), ::view-transition-old(w6col-text), ::view-transition-new(w6col-text),
    ::view-transition-old(w6col-pic), ::view-transition-new(w6col-pic) { animation: none; }
    .w6col .w6col-txt, .w6col .w6col-pic img { animation: none !important; }
  }
`;

const PAGES = [
  { nav: "Kitchens", title: "Kitchens made to the inch", more: "Next: Wardrobes",
    text: "Painted shaker doors on oak carcasses, worktops cut from a single board where the room allows, and drawers that run on hardwood.",
    list: ["Survey and drawings in two weeks", "Fitted by the people who made it", "From £14,000"],
    src: "https://images.pexels.com/photos/7746657/pexels-photo-7746657.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "A kitchen with grey panelled cabinets, a wooden worktop and a steel sink" },
  { nav: "Wardrobes", title: "Wardrobes that use the whole wall", more: "Next: Staircases",
    text: "Built into alcoves, under eaves and around chimney breasts, with the inside planned around what you actually hang and fold.",
    list: ["Doors to the ceiling, no gaps to dust", "Lights that come on as a door opens", "From £3,800"],
    src: "https://images.pexels.com/photos/31759521/pexels-photo-31759521.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "A wall of fitted grey wardrobes with drawers and an open shelf, beside a tall window" },
  { nav: "Staircases", title: "Stairs you notice on the way up", more: "Back to Kitchens",
    text: "New oak treads over an old frame, or a whole new flight with a handrail turned in the workshop and fitted in one day.",
    list: ["Oak, ash or painted pine", "Drawings made in the workshop", "From £6,500"],
    src: "https://images.pexels.com/photos/13005094/pexels-photo-13005094.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "A light oak staircase with a curving black iron railing against a white wall" },
];
const DEMO = [700, 1700, 3000]; // idle demo: ms before each automatic page change; [] turns it off
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Gives (or takes away) each column of a view its view-transition-name from data-vt.
const tag = (v: Element | null, on: boolean) => v?.querySelectorAll<HTMLElement>("[data-vt]").forEach((n) => {
  if (on) n.style.setProperty("view-transition-name", n.dataset.vt!); else n.style.removeProperty("view-transition-name");
});

export default function SplitColumnsSlideInOppositeDirections() {
  const reduce = useReducedMotion();
  const [cur, setCur] = useState(0);
  const [fb, setFb] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const views = useRef<(HTMLElement | null)[]>([]);
  const heads = useRef<(HTMLHeadingElement | null)[]>([]);
  const st = useRef({ cur: 0, busy: false, auto: DEMO.length > 0 });
  const afterCommit = useRef<null | (() => void)>(null);

  useIso(() => { const f = afterCommit.current; afterCommit.current = null; f?.(); }, [cur]);

  const go = (i: number, person: boolean) => {
    const s = st.current;
    if (i === s.cur || s.busy) return;
    const dir = i > s.cur ? "f" : "b", was = views.current[s.cur];
    s.cur = i;
    const landed = () => {
      if (stageRef.current) stageRef.current.scrollTop = 0;
      if (person) heads.current[i]?.focus({ preventScroll: true });
    };
    const doc = document as any;
    if (reduce || matchMedia("(prefers-reduced-motion: reduce)").matches) { afterCommit.current = landed; setCur(i); return; }
    if (doc.startViewTransition) {
      s.busy = true;
      tag(was, true);
      const html = document.documentElement;
      html.setAttribute("data-w6col-dir", dir);
      doc.startViewTransition(() => new Promise<void>((done) => {
        afterCommit.current = () => { tag(was, false); tag(views.current[i], true); landed(); done(); };
        setCur(i);
      })).finished.finally(() => { tag(views.current[i], false); html.removeAttribute("data-w6col-dir"); s.busy = false; });
    } else { afterCommit.current = landed; setFb(true); setCur(i); }
  };
  const goRef = useRef(go);
  goRef.current = go;

  // Idle demo: changes page now and then while the piece is on screen and nobody has used it.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduce || !DEMO.length) return;
    let timer = 0, turns = 0, seen = false;
    const tick = () => {
      timer = 0;
      if (!st.current.auto || !seen) return;
      goRef.current((st.current.cur + 1) % PAGES.length, false);
      turns++;
      timer = window.setTimeout(tick, DEMO[Math.min(turns, DEMO.length - 1)]);
    };
    // The demo waits for the page to finish loading, so the first thing anyone sees is the resting view.
    const kick = () => { if (seen && st.current.auto && !timer && document.readyState === "complete") timer = window.setTimeout(tick, DEMO[Math.min(turns, DEMO.length - 1)]); };
    window.addEventListener("load", kick);
    const io = new IntersectionObserver((e) => {
      seen = e[0].isIntersecting;
      if (seen) kick(); else { clearTimeout(timer); timer = 0; }
    });
    io.observe(root);
    const stop = () => { st.current.auto = false; };
    root.addEventListener("pointerdown", stop);
    root.addEventListener("keydown", stop);
    return () => { io.disconnect(); clearTimeout(timer); window.removeEventListener("load", kick); root.removeEventListener("pointerdown", stop); root.removeEventListener("keydown", stop); };
  }, [reduce]);

  const link = (i: number) => (e: MouseEvent) => { e.preventDefault(); st.current.auto = false; go(i, true); };

  return (
    <div className="w6col" ref={rootRef} data-fb={fb ? "" : undefined}>
      <style>{STYLES}</style>
      <header className="w6col-top">
        <p className="w6col-brand">Cobble &amp; Finch <span>Joinery</span></p>
        <nav aria-label="Joinery pages">
          <ul className="w6col-nav">
            {PAGES.map((p, i) => (
              <li key={p.nav}><a href="#" onClick={link(i)} aria-current={i === cur ? "page" : undefined}>{p.nav}</a></li>
            ))}
          </ul>
        </nav>
      </header>
      <div className="w6col-stage" ref={stageRef}>
        {PAGES.map((p, i) => (
          <section key={p.nav} className="w6col-view" aria-labelledby={`w6col-h${i}`} hidden={i !== cur} ref={(el) => { views.current[i] = el; }}>
            <div className="w6col-txt" data-vt="w6col-text">
              <p className="w6col-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</p>
              <h2 id={`w6col-h${i}`} tabIndex={-1} ref={(el) => { heads.current[i] = el; }}>{p.title}</h2>
              <p>{p.text}</p>
              <ul className="w6col-list">{p.list.map((l) => <li key={l}>{l}</li>)}</ul>
              <a className="w6col-more" href="#" onClick={link((i + 1) % PAGES.length)}>{p.more}</a>
            </div>
            <div className="w6col-pic" data-vt="w6col-pic"><img src={p.src} alt={p.alt} width={600} height={900} /></div>
          </section>
        ))}
      </div>
    </div>
  );
}

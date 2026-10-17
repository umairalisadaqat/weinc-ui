import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { useReducedMotion } from "framer-motion";

// Same styles as the plain HTML version; the comment at the top of STYLES names the values to change.
const STYLES = `
  /* Change these: --w6sld-paper (background), --w6sld-ink (text), --w6sld-red (accent),
     the 22% and 12% in the w6sld keyframes (how far pages slide) and the .26s and .5s durations. */
  .w6sld { --w6sld-paper: #f4eee3; --w6sld-ink: #2b211a; --w6sld-red: #8c2f24;
    height: 600px; display: flex; flex-direction: column; box-sizing: border-box; background: var(--w6sld-paper); color: var(--w6sld-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
  .w6sld *, .w6sld *::before { box-sizing: border-box; }
  .w6sld-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 24px; padding: 20px clamp(16px, 5vw, 56px);
    border-bottom: 1px solid #ddd0bd; }
  .w6sld-brand { margin: 0; font-family: Georgia, "Iowan Old Style", serif; font-size: 1.25rem; letter-spacing: -.01em; }
  .w6sld-brand span { font-style: italic; color: var(--w6sld-red); }
  .w6sld-brand small { margin-left: 6px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: .7rem; letter-spacing: .16em; text-transform: uppercase; color: #6b5a4b; }
  .w6sld-nav { display: flex; gap: 2px; margin: 0 -10px; padding: 0; list-style: none; }
  .w6sld a { color: inherit; }
  .w6sld-nav a { display: inline-flex; align-items: center; min-height: 40px; padding: 0 10px; font-size: .9375rem; text-decoration: none; border-radius: 6px;
    text-underline-offset: 6px; }
  .w6sld-nav a:hover { text-decoration: underline; }
  .w6sld-nav a[aria-current="page"] { color: var(--w6sld-red); text-decoration: underline; text-decoration-thickness: 2px; }
  .w6sld a:focus-visible, .w6sld h2:focus-visible { outline: 2px solid var(--w6sld-red); outline-offset: 3px; }
  .w6sld h2:focus { outline: none; }
  .w6sld-stage { position: relative; flex: 1; min-height: 0; overflow-x: hidden; overflow-y: auto; }
  .w6sld-view { min-height: 100%; display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; gap: 18px;
    padding: 28px clamp(16px, 5vw, 56px) 24px; }
  .w6sld-view[hidden] { display: none; }
  .w6sld-num { margin: 0; font-family: Georgia, serif; font-style: italic; font-size: 2.5rem; line-height: 1; color: var(--w6sld-red); }
  .w6sld-eye { margin: 0; font-size: .75rem; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: #6b5a4b; }
  .w6sld h2 { margin: 8px 0 0; max-width: 18ch; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(1.75rem, 4.2vw, 2.75rem);
    line-height: 1.08; letter-spacing: -.02em; }
  .w6sld-lead { margin: 14px 0 0; max-width: 36rem; font-size: 1.0625rem; line-height: 1.6; color: #4a3b2f; }
  .w6sld-list { margin: 20px 0 0; padding: 0; list-style: none; max-width: 36rem; border-top: 1px solid #ddd0bd; }
  .w6sld-list li { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 2px 16px; padding: 11px 0; border-bottom: 1px solid #ddd0bd; font-size: .9375rem; }
  .w6sld-list b { font-weight: 600; }
  .w6sld-list span { color: #5c4b3d; }
  @media (max-width: 520px) { .w6sld-list li { flex-direction: column; } }
  .w6sld-pager { display: flex; flex-wrap: wrap; gap: 8px 28px; margin: 4px 0 0; font-size: .9375rem; }
  .w6sld-pager a { display: inline-flex; align-items: center; min-height: 40px; font-weight: 600; text-underline-offset: 5px; }
  .w6sld-pager a:last-child:not(:first-child) { margin-left: auto; }
  @media (min-width: 860px) {
    .w6sld-view { grid-template-columns: minmax(0, 1fr) 15rem; column-gap: 48px; padding-top: 40px; }
    .w6sld-num { grid-column: 2; grid-row: 1; justify-self: end; font-size: 9rem; letter-spacing: -.04em; opacity: .9; }
    .w6sld-body { grid-column: 1; grid-row: 1; }
    .w6sld-pager { grid-column: 1 / -1; }
  }

  /* The slide. Only the stage is named, and only while a transition runs, so the header stays put.
     For a multi-page site add  @view-transition { navigation: auto; }  and give the main element the name on every page. */
  ::view-transition-group(w6sld-stage) { animation: none; overflow: clip; }
  ::view-transition-old(w6sld-stage), ::view-transition-new(w6sld-stage) { mix-blend-mode: normal; }
  /* The old page leaves quickly, the new one follows a beat later, so the two never sit on top of each other for long. */
  ::view-transition-old(w6sld-stage) { animation: w6sld-out .26s cubic-bezier(.2, 0, .2, 1) both; }
  ::view-transition-new(w6sld-stage) { animation: w6sld-in .5s .1s cubic-bezier(.2, .7, .2, 1) both; }
  :root[data-w6sld-dir="b"]::view-transition-old(w6sld-stage) { animation-name: w6sld-out-b; }
  :root[data-w6sld-dir="b"]::view-transition-new(w6sld-stage) { animation-name: w6sld-in-b; }
  @keyframes w6sld-out { to { opacity: 0; transform: translateX(-12%); } }
  @keyframes w6sld-in { from { opacity: 0; transform: translateX(22%); } }
  @keyframes w6sld-out-b { to { opacity: 0; transform: translateX(12%); } }
  @keyframes w6sld-in-b { from { opacity: 0; transform: translateX(-22%); } }
  /* Fallback for browsers without view transitions: the new page slides in on its own. */
  .w6sld[data-fb="f"] .w6sld-view:not([hidden]) { animation: w6sld-in .5s cubic-bezier(.2, .7, .2, 1) both; }
  .w6sld[data-fb="b"] .w6sld-view:not([hidden]) { animation: w6sld-in-b .5s cubic-bezier(.2, .7, .2, 1) both; }
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(w6sld-stage), ::view-transition-old(w6sld-stage), ::view-transition-new(w6sld-stage) { animation: none; }
    .w6sld .w6sld-view { animation: none !important; }
  }
`;

const PAGES = [
  {
    nav: "Shop", eye: "The shop", title: "Two rooms of books above the old print works",
    lead: "New fiction, poetry and local history at the front, and a back room of secondhand finds sorted by whoever had the afternoon free.",
    rows: [["The Salt Year", "Ines Harrow, paperback"], ["Field Notes from a Flooded Valley", "Tom Ashdown, hardback"], ["Small Hours", "Mira Coyle, poems"]],
  },
  {
    nav: "Events", eye: "Events", title: "Readings in the back room",
    lead: "Thirty folding chairs, a kettle and a writer. Seats are free, but tell us you are coming so we set out enough cups.",
    rows: [["Thu 23 Oct, 7pm", "Poetry night with three local poets"], ["Sat 1 Nov, 11am", "Story hour for under sevens"], ["Wed 12 Nov, 7pm", "Tom Ashdown on rivers and memory"]],
  },
  {
    nav: "Visit", eye: "Visit", title: "Up the stairs at 14 Tanner Row",
    lead: "The door is the green one next to the bakery. There is a ramp at the side entrance and a bench by the poetry shelves.",
    rows: [["Tuesday to Friday", "10am to 6pm"], ["Saturday", "9am to 5pm"], ["Sunday and Monday", "Closed, except for readings"]],
  },
  {
    nav: "Orders", eye: "Orders", title: "Ask for any book still in print",
    lead: "Leave the title at the counter or by phone and we will call when it lands, usually within three working days.",
    rows: [["Phone", "01632 960 418"], ["Counter", "Any opening hour"], ["Collection", "Kept for two weeks under your name"]],
  },
];
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const DEMO = [700, 1700, 3200]; // idle demo: ms before each automatic page turn; [] turns it off

export default function SiblingPagesSlideInReadingDirection() {
  const reduce = useReducedMotion();
  const [cur, setCur] = useState(0);
  const [fb, setFb] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const heads = useRef<(HTMLHeadingElement | null)[]>([]);
  const curRef = useRef(0);
  const busy = useRef(false);
  const auto = useRef(DEMO.length > 0);
  const focusNext = useRef(false);
  const commit = useRef<null | (() => void)>(null);

  // Runs after React has written the new page: lets the view transition take its "after" snapshot, then moves focus.
  useIso(() => {
    commit.current?.();
    commit.current = null;
    if (focusNext.current) { focusNext.current = false; heads.current[cur]?.focus({ preventScroll: true }); }
  }, [cur]);

  const go = (i: number, person: boolean) => {
    if (i === curRef.current || busy.current) return;
    const dir = i > curRef.current ? "f" : "b";
    curRef.current = i;
    focusNext.current = person;
    const doc = document as any;
    if (reduce || matchMedia("(prefers-reduced-motion: reduce)").matches) { setCur(i); return; }
    if (doc.startViewTransition && stageRef.current) {
      busy.current = true;
      const stage = stageRef.current, html = document.documentElement;
      stage.style.setProperty("view-transition-name", "w6sld-stage");
      html.setAttribute("data-w6sld-dir", dir);
      doc.startViewTransition(() => new Promise<void>((done) => { commit.current = done; setCur(i); })).finished.finally(() => {
        stage.style.removeProperty("view-transition-name"); html.removeAttribute("data-w6sld-dir"); busy.current = false;
      });
    } else { setFb(dir); setCur(i); }
  };
  const goRef = useRef(go);
  goRef.current = go;

  // Idle demo while on screen and untouched.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduce || !DEMO.length) return;
    let timer = 0, turns = 0, seen = false;
    const tick = () => {
      timer = 0;
      if (!auto.current || !seen) return;
      goRef.current((curRef.current + 1) % PAGES.length, false);
      turns++;
      timer = window.setTimeout(tick, DEMO[Math.min(turns, DEMO.length - 1)]);
    };
    // The demo waits for the page to finish loading, so the first thing anyone sees is the resting view.
    const kick = () => { if (seen && auto.current && !timer && document.readyState === "complete") timer = window.setTimeout(tick, DEMO[Math.min(turns, DEMO.length - 1)]); };
    window.addEventListener("load", kick);
    const io = new IntersectionObserver((e) => {
      seen = e[0].isIntersecting;
      if (seen) kick(); else { clearTimeout(timer); timer = 0; }
    });
    io.observe(root);
    const stop = () => { auto.current = false; };
    root.addEventListener("pointerdown", stop);
    root.addEventListener("keydown", stop);
    return () => { io.disconnect(); clearTimeout(timer); window.removeEventListener("load", kick); root.removeEventListener("pointerdown", stop); root.removeEventListener("keydown", stop); };
  }, [reduce]);

  const link = (i: number) => (e: MouseEvent) => { e.preventDefault(); auto.current = false; go(i, true); };

  return (
    <div className="w6sld" ref={rootRef} data-fb={fb || undefined}>
      <style>{STYLES}</style>
      <header className="w6sld-top">
        <p className="w6sld-brand">Hollins <span>&amp;</span> Vale <small>Booksellers</small></p>
        <nav aria-label="Bookshop pages">
          <ul className="w6sld-nav">
            {PAGES.map((p, i) => (
              <li key={p.nav}><a href="#" onClick={link(i)} aria-current={i === cur ? "page" : undefined}>{p.nav}</a></li>
            ))}
          </ul>
        </nav>
      </header>
      <div className="w6sld-stage" ref={stageRef}>
        {PAGES.map((p, i) => (
          <section key={p.nav} className="w6sld-view" aria-labelledby={`w6sld-h${i}`} hidden={i !== cur}>
            <p className="w6sld-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</p>
            <div className="w6sld-body">
              <p className="w6sld-eye">{p.eye}</p>
              <h2 id={`w6sld-h${i}`} tabIndex={-1} ref={(el) => { heads.current[i] = el; }}>{p.title}</h2>
              <p className="w6sld-lead">{p.lead}</p>
              <ul className="w6sld-list">
                {p.rows.map(([a, b]) => <li key={a}><b>{a}</b><span>{b}</span></li>)}
              </ul>
            </div>
            <p className="w6sld-pager">
              {i > 0 && <a href="#" onClick={link(i - 1)}>Previous: {PAGES[i - 1].nav}</a>}
              {i < PAGES.length - 1 && <a href="#" onClick={link(i + 1)}>Next: {PAGES[i + 1].nav}</a>}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}

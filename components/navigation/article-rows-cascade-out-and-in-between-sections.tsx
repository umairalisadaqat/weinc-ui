import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { useReducedMotion } from "framer-motion";

// Same styles as the plain HTML version; the comment at the top of STYLES names the values to change.
const STYLES = `
  /* Change these: --w6stg-ink (background), --w6stg-paper (text), --w6stg-amber (accent), the 40ms delay steps
     between rows further down, and the 28px travel in the w6stg keyframes. */
  .w6stg { --w6stg-ink: #151412; --w6stg-paper: #eee7db; --w6stg-amber: #dba468;
    height: 560px; display: flex; flex-direction: column; background: var(--w6stg-ink); color: var(--w6stg-paper);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
  .w6stg *, .w6stg *::before { box-sizing: border-box; }
  .w6stg-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 24px; padding: 18px clamp(16px, 5vw, 56px); border-bottom: 1px solid #2c2a26; }
  .w6stg-brand { margin: 0; font-family: Georgia, "Iowan Old Style", serif; font-size: 1.2rem; font-style: italic; }
  .w6stg-brand span { font-family: ui-sans-serif, system-ui, sans-serif; font-style: normal; font-size: .7rem; letter-spacing: .2em; text-transform: uppercase; color: #a39b8e; margin-left: 4px; }
  .w6stg-nav { display: flex; gap: 4px; margin: 0 -10px; padding: 0; list-style: none; }
  .w6stg-nav a { display: inline-flex; align-items: center; min-height: 40px; padding: 0 10px; color: #b5ad9f; font-size: .9375rem; text-decoration: none; border-radius: 4px; }
  .w6stg-nav a:hover { color: var(--w6stg-paper); }
  .w6stg-nav a[aria-current="page"] { color: var(--w6stg-amber); }
  .w6stg a:focus-visible, .w6stg h2:focus-visible { outline: 2px solid var(--w6stg-amber); outline-offset: 3px; }
  .w6stg h2:focus { outline: none; }
  .w6stg-stage { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 26px clamp(16px, 5vw, 56px) 8px; }
  .w6stg-view[hidden] { display: none; }
  .w6stg-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 20px; }
  .w6stg h2 { margin: 0; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(2rem, 5vw, 3.4rem); line-height: 1; letter-spacing: -.02em; }
  .w6stg-head p { margin: 0; font-size: .875rem; color: #a39b8e; }
  .w6stg-rows { margin: 18px 0 0; padding: 0; list-style: none; border-top: 1px solid #34312c; }
  .w6stg-rows li { border-bottom: 1px solid #34312c; background: var(--w6stg-ink); }
  .w6stg-rows a { display: grid; grid-template-columns: 2.25rem minmax(0, 1fr); gap: 2px 14px; padding: 15px 2px; color: inherit; text-decoration: none; border-radius: 4px; }
  .w6stg-n { grid-row: span 2; padding-top: 4px; font-size: .75rem; color: var(--w6stg-amber); font-variant-numeric: tabular-nums; }
  .w6stg-rows b { font-family: Georgia, serif; font-weight: 400; font-size: clamp(1.05rem, 2vw, 1.3rem); line-height: 1.3; }
  .w6stg-rows small { font-size: .8125rem; color: #a39b8e; }
  .w6stg-rows a:hover b { color: #fff; text-decoration: underline; text-decoration-color: var(--w6stg-amber); text-underline-offset: 4px; }
  .w6stg-foot { margin: 0; padding: 14px clamp(16px, 5vw, 56px) 18px; border-top: 1px solid #2c2a26; font-size: .875rem; color: #b5ad9f; }
  .w6stg-foot a { color: var(--w6stg-amber); text-underline-offset: 4px; }
  @media (min-width: 860px) {
    .w6stg-rows a { grid-template-columns: 3rem minmax(0, 1fr) auto; align-items: baseline; }
    .w6stg-n { grid-row: auto; }
  }

  /* The heading and each row carry their own name during the change, so they can leave and arrive one after another.
     Forward rows exit left and enter from the right; back reverses it. Delays step by 40ms per row.
     Separate pages: add  @view-transition { navigation: auto; }  and the same names on every page. */
  ::view-transition-group(w6stg-head), ::view-transition-group(w6stg-r1), ::view-transition-group(w6stg-r2),
  ::view-transition-group(w6stg-r3), ::view-transition-group(w6stg-r4) { animation: none; }
  ::view-transition-old(w6stg-head), ::view-transition-old(w6stg-r1), ::view-transition-old(w6stg-r2), ::view-transition-old(w6stg-r3), ::view-transition-old(w6stg-r4) {
    mix-blend-mode: normal; animation: w6stg-out .2s cubic-bezier(.4, 0, 1, 1) both; }
  ::view-transition-new(w6stg-head), ::view-transition-new(w6stg-r1), ::view-transition-new(w6stg-r2), ::view-transition-new(w6stg-r3), ::view-transition-new(w6stg-r4) {
    mix-blend-mode: normal; animation: w6stg-in .4s .18s cubic-bezier(.2, .8, .2, 1) both; }
  ::view-transition-old(w6stg-r1) { animation-delay: 40ms; } ::view-transition-new(w6stg-r1) { animation-delay: .22s; }
  ::view-transition-old(w6stg-r2) { animation-delay: 80ms; } ::view-transition-new(w6stg-r2) { animation-delay: .26s; }
  ::view-transition-old(w6stg-r3) { animation-delay: 120ms; } ::view-transition-new(w6stg-r3) { animation-delay: .3s; }
  ::view-transition-old(w6stg-r4) { animation-delay: 160ms; } ::view-transition-new(w6stg-r4) { animation-delay: .34s; }
  :root[data-w6stg-dir="b"]::view-transition-old(w6stg-head), :root[data-w6stg-dir="b"]::view-transition-old(w6stg-r1), :root[data-w6stg-dir="b"]::view-transition-old(w6stg-r2),
  :root[data-w6stg-dir="b"]::view-transition-old(w6stg-r3), :root[data-w6stg-dir="b"]::view-transition-old(w6stg-r4) { animation-name: w6stg-out-b; }
  :root[data-w6stg-dir="b"]::view-transition-new(w6stg-head), :root[data-w6stg-dir="b"]::view-transition-new(w6stg-r1), :root[data-w6stg-dir="b"]::view-transition-new(w6stg-r2),
  :root[data-w6stg-dir="b"]::view-transition-new(w6stg-r3), :root[data-w6stg-dir="b"]::view-transition-new(w6stg-r4) { animation-name: w6stg-in-b; }
  @keyframes w6stg-out { to { opacity: 0; transform: translateX(-28px); } }
  @keyframes w6stg-in { from { opacity: 0; transform: translateX(28px); } }
  @keyframes w6stg-out-b { to { opacity: 0; transform: translateX(28px); } }
  @keyframes w6stg-in-b { from { opacity: 0; transform: translateX(-28px); } }
  /* Fallback without view transitions: new rows arrive in the same cascade. */
  .w6stg[data-fb] .w6stg-view:not([hidden]) .w6stg-head, .w6stg[data-fb] .w6stg-view:not([hidden]) li { animation: w6stg-in .46s cubic-bezier(.2, .8, .2, 1) both; }
  .w6stg[data-fb] .w6stg-view:not([hidden]) li:nth-child(2) { animation-delay: 40ms; }
  .w6stg[data-fb] .w6stg-view:not([hidden]) li:nth-child(3) { animation-delay: 80ms; }
  .w6stg[data-fb] .w6stg-view:not([hidden]) li:nth-child(4) { animation-delay: 120ms; }
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-old(w6stg-head), ::view-transition-new(w6stg-head), ::view-transition-old(w6stg-r1), ::view-transition-new(w6stg-r1),
    ::view-transition-old(w6stg-r2), ::view-transition-new(w6stg-r2), ::view-transition-old(w6stg-r3), ::view-transition-new(w6stg-r3),
    ::view-transition-old(w6stg-r4), ::view-transition-new(w6stg-r4) { animation: none; }
    .w6stg .w6stg-head, .w6stg .w6stg-view li { animation: none !important; }
  }
`;

const SECTIONS = [
  { name: "Latest", sub: "Autumn issue, out now", rows: [
    ["The year the river moved", "Hana Okafor", "14 min"], ["Notes on mending a dry stone wall", "Pete Garroway", "9 min"],
    ["What the hedgerow remembers", "Lin Marsh", "11 min"], ["A field guide to October light", "Ruth Sallow", "6 min"]] },
  { name: "Essays", sub: "Long reads from the back pages", rows: [
    ["Against tidy gardens", "Owen Brack", "18 min"], ["The economics of a village shop", "Dee Annand", "16 min"],
    ["On walking the same path for ten years", "Hana Okafor", "12 min"], ["Weather as a second language", "Cal Peary", "10 min"]] },
  { name: "Interviews", sub: "Conversations at kitchen tables", rows: [
    ["A shepherd on losing the hill farm", "with Morag Telfer", "21 min"], ["The last thatcher in the valley", "with Ivo Penhale", "15 min"],
    ["Running a ferry with one engine", "with Sue Rendle", "13 min"], ["Bees, bookkeeping and patience", "with Amit Dhar", "17 min"]] },
];
const DEMO = [700, 1800, 3000]; // idle demo: ms before each automatic section change; [] turns it off
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Gives (or takes away) the heading and rows of a view their view-transition-name from data-vt.
const tag = (v: Element | null, on: boolean) => v?.querySelectorAll<HTMLElement>("[data-vt]").forEach((n) => {
  if (on) n.style.setProperty("view-transition-name", n.dataset.vt!); else n.style.removeProperty("view-transition-name");
});

export default function ArticleRowsCascadeOutAndInBetweenSections() {
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
      html.setAttribute("data-w6stg-dir", dir);
      doc.startViewTransition(() => new Promise<void>((done) => {
        afterCommit.current = () => { tag(was, false); tag(views.current[i], true); landed(); done(); };
        setCur(i);
      })).finished.finally(() => { tag(views.current[i], false); html.removeAttribute("data-w6stg-dir"); s.busy = false; });
    } else { afterCommit.current = landed; setFb(true); setCur(i); }
  };
  const goRef = useRef(go);
  goRef.current = go;

  // Idle demo: moves through the sections while the piece is on screen and nobody has used it.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduce || !DEMO.length) return;
    let timer = 0, turns = 0, seen = false;
    const tick = () => {
      timer = 0;
      if (!st.current.auto || !seen) return;
      goRef.current((st.current.cur + 1) % SECTIONS.length, false);
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
    <div className="w6stg" ref={rootRef} data-fb={fb ? "" : undefined}>
      <style>{STYLES}</style>
      <header className="w6stg-top">
        <p className="w6stg-brand">The Long Field <span>Journal</span></p>
        <nav aria-label="Journal sections">
          <ul className="w6stg-nav">
            {SECTIONS.map((s, i) => (
              <li key={s.name}><a href="#" onClick={link(i)} aria-current={i === cur ? "page" : undefined}>{s.name}</a></li>
            ))}
          </ul>
        </nav>
      </header>
      <div className="w6stg-stage" ref={stageRef}>
        {SECTIONS.map((s, i) => (
          <section key={s.name} className="w6stg-view" aria-labelledby={`w6stg-h${i}`} hidden={i !== cur} ref={(el) => { views.current[i] = el; }}>
            <div className="w6stg-head" data-vt="w6stg-head">
              <h2 id={`w6stg-h${i}`} tabIndex={-1} ref={(el) => { heads.current[i] = el; }}>{s.name}</h2>
              <p>{s.sub}</p>
            </div>
            <ol className="w6stg-rows">
              {s.rows.map(([t, a, m], k) => (
                <li key={t} data-vt={`w6stg-r${k + 1}`}>
                  <a href="#"><span className="w6stg-n" aria-hidden="true">{String(k + 1).padStart(2, "0")}</span><b>{t}</b><small>{a} · {m} read</small></a>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
      <p className="w6stg-foot">Printed four times a year on uncoated paper. <a href="#">Subscribe for £36</a></p>
    </div>
  );
}

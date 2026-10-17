import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { useReducedMotion } from "framer-motion";

// Same styles as the plain HTML version; the comment at the top of STYLES names the values to change.
const STYLES = `
  /* Change these: --w6stk-bg, --w6stk-ink, --w6stk-stone (accent), the .55s / .6s durations and the .92 scale
     in the w6stk keyframes (how far the page underneath sinks back). */
  .w6stk { --w6stk-bg: #1c1d1f; --w6stk-ink: #ece8e2; --w6stk-stone: #cdbca4;
    height: 620px; display: flex; flex-direction: column; background: var(--w6stk-bg); color: var(--w6stk-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
  .w6stk *, .w6stk *::before { box-sizing: border-box; }
  .w6stk-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 24px; padding: 16px clamp(16px, 4vw, 44px); }
  .w6stk-brand { margin: 0; font-size: .9375rem; font-weight: 600; letter-spacing: .02em; }
  .w6stk-brand span { font-weight: 400; color: #a9a39b; }
  .w6stk-nav { display: flex; gap: 4px; margin: 0 -10px; padding: 0; list-style: none; }
  .w6stk-nav a { display: inline-flex; align-items: baseline; gap: 6px; min-height: 40px; padding: 10px; color: #b9b3ab; font-size: .9375rem; text-decoration: none; border-radius: 6px; }
  .w6stk-nav small { font-size: .6875rem; color: #8d877f; font-variant-numeric: tabular-nums; }
  .w6stk-nav a:hover, .w6stk-nav a[aria-current="page"] { color: var(--w6stk-ink); }
  .w6stk-nav a[aria-current="page"] small { color: var(--w6stk-stone); }
  .w6stk a:focus-visible, .w6stk h2:focus-visible { outline: 2px solid var(--w6stk-stone); outline-offset: 3px; }
  .w6stk h2:focus { outline: none; }
  .w6stk-stage { position: relative; flex: 1; min-height: 0; overflow-x: hidden; overflow-y: auto; }
  .w6stk-view { min-height: 100%; display: grid; background: #26272a; border-top: 1px solid #3a3b3f; }
  .w6stk-view[hidden] { display: none; }
  .w6stk-pic { overflow: hidden; aspect-ratio: 16 / 9; background: #333; }
  .w6stk-pic img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .w6stk-txt { padding: 24px clamp(16px, 4vw, 44px) 28px; }
  .w6stk-eye { margin: 0; font-size: .75rem; letter-spacing: .18em; text-transform: uppercase; color: var(--w6stk-stone); }
  .w6stk h2 { margin: 10px 0 0; font-size: clamp(1.6rem, 3.2vw, 2.4rem); font-weight: 500; line-height: 1.1; letter-spacing: -.02em; max-width: 16ch; }
  .w6stk-txt > p:not(.w6stk-eye) { margin: 14px 0 0; max-width: 32rem; font-size: 1rem; line-height: 1.6; color: #c9c4bc; }
  .w6stk-facts { margin: 20px 0 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; border-top: 1px solid #3f4044; padding-top: 14px; }
  .w6stk-facts dt { font-size: .75rem; color: #9d978f; }
  .w6stk-facts dd { margin: 4px 0 0; font-size: .875rem; }
  .w6stk-more { display: inline-flex; align-items: center; min-height: 44px; margin-top: 18px; padding: 0 18px; border: 1px solid #5a5b60; border-radius: 999px;
    color: var(--w6stk-ink); font-size: .875rem; text-decoration: none; }
  .w6stk-more:hover { border-color: var(--w6stk-stone); }
  .w6stk-more::after { content: "→"; margin-left: 10px; color: var(--w6stk-stone); }
  @media (min-width: 860px) {
    .w6stk-view { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); }
    .w6stk-pic { aspect-ratio: auto; height: 100%; }
    .w6stk-txt { align-self: center; padding: 32px 44px; }
  }
  @media (max-width: 480px) { .w6stk-facts { grid-template-columns: 1fr 1fr; } }

  /* Forward: the new page slides up over the old one, which sinks back and darkens. Back: the top page slides away
     downwards and the one underneath comes forward. Only the stage is named, and only during the change.
     Separate pages: add  @view-transition { navigation: auto; }  and name the main element on every page. */
  ::view-transition-group(w6stk-stage) { animation: none; overflow: clip; }
  ::view-transition-old(w6stk-stage), ::view-transition-new(w6stk-stage) { mix-blend-mode: normal; }
  ::view-transition-old(w6stk-stage) { animation: w6stk-sink .6s cubic-bezier(.3, 0, .2, 1) both; }
  ::view-transition-new(w6stk-stage) { animation: w6stk-rise .6s cubic-bezier(.2, .8, .2, 1) both; }
  :root[data-w6stk-dir="b"]::view-transition-old(w6stk-stage) { z-index: 1; animation: w6stk-drop .55s cubic-bezier(.5, 0, .7, .4) both; }
  :root[data-w6stk-dir="b"]::view-transition-new(w6stk-stage) { animation: w6stk-lift .6s cubic-bezier(.2, .8, .2, 1) both; }
  @keyframes w6stk-sink { to { transform: scale(.92); opacity: .25; } }
  @keyframes w6stk-rise { from { transform: translateY(100%); } }
  @keyframes w6stk-drop { to { transform: translateY(100%); } }
  @keyframes w6stk-lift { from { transform: scale(.92); opacity: .25; } }
  /* Fallback without view transitions: the new page rises a little and fades in. */
  @keyframes w6stk-in { from { transform: translateY(40px); opacity: 0; } }
  .w6stk[data-fb] .w6stk-view:not([hidden]) { animation: w6stk-in .5s cubic-bezier(.2, .8, .2, 1) both; }
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(w6stk-stage), ::view-transition-old(w6stk-stage), ::view-transition-new(w6stk-stage) { animation: none; }
    .w6stk .w6stk-view { animation: none !important; }
  }
`;

const PAGES = [
  {
    nav: "Work", eye: "Selected work", title: "Houses that sit low in the land", more: "How we work",
    src: "https://images.pexels.com/photos/6342356/pexels-photo-6342356.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "A white house with dark window frames on a rocky, planted hillside",
    text: "A family house on a terraced slope, built around the old retaining walls rather than through them, with every room a step lower than the last.",
    facts: [["Year", "2025"], ["Area", "180 m²"], ["Built in", "Stone, lime, oak"]],
  },
  {
    nav: "Studio", eye: "The studio", title: "Eleven people in a former print hall", more: "Start a project",
    src: "https://images.pexels.com/photos/12780906/pexels-photo-12780906.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "A concrete hallway with lift doors in red frames and long bands of sunlight across the floor",
    text: "Every project starts with a day on site and a model on the long table, and the same two partners stay with it until the keys are handed over.",
    facts: [["Founded", "2011"], ["Partners", "Ana Marrick, Joel Lowe"], ["Projects", "Homes, schools, workshops"]],
  },
  {
    nav: "Contact", eye: "Contact", title: "Tell us about the site first", more: "Back to the work",
    src: "https://images.pexels.com/photos/27953061/pexels-photo-27953061.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Two plain white gabled houses against a clear blue sky",
    text: "Send a few photos, the address and roughly what you hope for. We reply within a week, including when we are not the right fit.",
    facts: [["Phone", "020 7946 0321"], ["Studio", "Unit 4, Coldharbour Yard"], ["Hours", "Mon to Fri, 9 to 6"]],
  },
];
const DEMO = [700, 1700, 3200]; // idle demo: ms before each automatic page change; [] turns it off
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function NewPageSlidesUpOverTheOldOne() {
  const reduce = useReducedMotion();
  const [cur, setCur] = useState(0);
  const [fb, setFb] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const heads = useRef<(HTMLHeadingElement | null)[]>([]);
  const st = useRef({ cur: 0, busy: false, auto: DEMO.length > 0, focus: false });
  const commit = useRef<null | (() => void)>(null);

  // After React writes the new page: let the transition take its "after" snapshot, then move focus.
  useIso(() => {
    if (stageRef.current) stageRef.current.scrollTop = 0;
    commit.current?.();
    commit.current = null;
    if (st.current.focus) { st.current.focus = false; heads.current[cur]?.focus({ preventScroll: true }); }
  }, [cur]);

  // A later page lands on top of the stack; an earlier one is uncovered from underneath.
  const go = (i: number, person: boolean) => {
    const s = st.current;
    if (i === s.cur || s.busy) return;
    const dir = i > s.cur ? "f" : "b";
    s.cur = i;
    s.focus = person;
    const doc = document as any;
    if (reduce || matchMedia("(prefers-reduced-motion: reduce)").matches) { setCur(i); return; }
    if (doc.startViewTransition && stageRef.current) {
      s.busy = true;
      const stage = stageRef.current, html = document.documentElement;
      stage.style.setProperty("view-transition-name", "w6stk-stage");
      html.setAttribute("data-w6stk-dir", dir);
      doc.startViewTransition(() => new Promise<void>((done) => { commit.current = done; setCur(i); })).finished.finally(() => {
        stage.style.removeProperty("view-transition-name"); html.removeAttribute("data-w6stk-dir"); s.busy = false;
      });
    } else { setFb(true); setCur(i); }
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
    <div className="w6stk" ref={rootRef} data-fb={fb ? "" : undefined}>
      <style>{STYLES}</style>
      <header className="w6stk-top">
        <p className="w6stk-brand">Marrick Lowe <span>Architects</span></p>
        <nav aria-label="Practice pages">
          <ul className="w6stk-nav">
            {PAGES.map((p, i) => (
              <li key={p.nav}>
                <a href="#" onClick={link(i)} aria-current={i === cur ? "page" : undefined}><small>{String(i + 1).padStart(2, "0")}</small>{p.nav}</a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <div className="w6stk-stage" ref={stageRef}>
        {PAGES.map((p, i) => (
          <section key={p.nav} className="w6stk-view" aria-labelledby={`w6stk-h${i}`} hidden={i !== cur}>
            <div className="w6stk-pic"><img src={p.src} alt={p.alt} width={900} height={600} /></div>
            <div className="w6stk-txt">
              <p className="w6stk-eye">{p.eye}</p>
              <h2 id={`w6stk-h${i}`} tabIndex={-1} ref={(el) => { heads.current[i] = el; }}>{p.title}</h2>
              <p>{p.text}</p>
              <dl className="w6stk-facts">
                {p.facts.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}
              </dl>
              <a className="w6stk-more" href="#" onClick={link((i + 1) % PAGES.length)}>{p.more}</a>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

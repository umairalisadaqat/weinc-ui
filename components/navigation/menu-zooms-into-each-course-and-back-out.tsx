import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { useReducedMotion } from "framer-motion";

// Same styles as the plain HTML version; the comment at the top of STYLES names the values to change.
const STYLES = `
  /* Change these: --w6zom-navy, --w6zom-cream, --w6zom-brass (accent), and the 1.12 / .9 scales in the
     w6zom keyframes (how deep the zoom goes). */
  .w6zom { --w6zom-navy: #0f1a2b; --w6zom-cream: #f0e8da; --w6zom-brass: #d6b77f;
    height: 600px; display: flex; flex-direction: column; background: var(--w6zom-navy); color: var(--w6zom-cream);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
  .w6zom *, .w6zom *::before { box-sizing: border-box; }
  .w6zom-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 4px 20px; padding: 20px clamp(16px, 5vw, 56px); border-bottom: 1px solid #24324a; }
  .w6zom-brand { margin: 0; font-family: Georgia, "Iowan Old Style", serif; font-size: 1.25rem; }
  .w6zom-brand em { color: var(--w6zom-brass); }
  .w6zom-when { margin: 0; font-size: .8125rem; color: #b6bdc8; }
  .w6zom-stage { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; }
  .w6zom-view { padding: 28px clamp(16px, 5vw, 56px) 30px; }
  .w6zom-view[hidden] { display: none; }
  .w6zom-eye { margin: 0; font-size: .75rem; letter-spacing: .18em; text-transform: uppercase; color: var(--w6zom-brass); }
  .w6zom h2 { margin: 10px 0 0; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(1.6rem, 3.4vw, 2.4rem); line-height: 1.12; letter-spacing: -.01em; }
  .w6zom-menu h2 { font-size: clamp(2.2rem, 5vw, 3.4rem); }
  .w6zom h2:focus { outline: none; }
  .w6zom a:focus-visible, .w6zom h2:focus-visible { outline: 2px solid var(--w6zom-brass); outline-offset: 3px; }
  .w6zom-list { margin: 22px 0 0; padding: 0; list-style: none; border-top: 1px solid #2b3a54; }
  .w6zom-list a { display: grid; grid-template-columns: 5.5rem 1fr auto; align-items: baseline; gap: 6px 18px; padding: 18px 4px; color: inherit; text-decoration: none; border-bottom: 1px solid #2b3a54; border-radius: 4px; }
  .w6zom-list small { font-size: .75rem; letter-spacing: .14em; text-transform: uppercase; color: #aab3c1; }
  .w6zom-list b { font-family: Georgia, serif; font-weight: 400; font-size: clamp(1.1rem, 2.2vw, 1.45rem); }
  .w6zom-list span { font-size: .8125rem; color: var(--w6zom-brass); }
  .w6zom-list span::after { content: "  +"; }
  .w6zom-list a:hover b { text-decoration: underline; text-underline-offset: 5px; text-decoration-color: var(--w6zom-brass); }
  .w6zom-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px 24px; margin-top: 28px; }
  .w6zom-foot p { margin: 0; font-size: .9375rem; color: #c3cad5; }
  .w6zom-foot a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 22px; border-radius: 999px; background: var(--w6zom-brass); color: #16202f; font-size: .9375rem; font-weight: 600; text-decoration: none; }
  .w6zom-foot a:hover { background: #e3c891; }
  .w6zom-view img { display: block; width: 100%; height: auto; aspect-ratio: 3 / 2; object-fit: cover; border-radius: 4px; background: #1c2a40; }
  .w6zom-txt { margin-top: 20px; }
  .w6zom-txt > p:not([class]) { margin: 12px 0 0; max-width: 30rem; font-size: 1rem; line-height: 1.6; color: #d3cbbd; }
  .w6zom-meta { margin: 14px 0 0; font-size: .8125rem; color: #aab3c1; }
  .w6zom-nav { display: flex; flex-wrap: wrap; gap: 6px 26px; margin: 18px 0 0; }
  .w6zom-nav a { display: inline-flex; align-items: center; min-height: 40px; color: var(--w6zom-brass); font-size: .9375rem; text-underline-offset: 5px; border-radius: 4px; }
  @media (max-width: 560px) { .w6zom-list a { grid-template-columns: 1fr; } .w6zom-list span { display: none; } }
  @media (min-width: 860px) {
    .w6zom-view:not(.w6zom-menu) { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 44px; align-items: center; padding-top: 40px; }
    .w6zom-view[hidden] { display: none; }
    .w6zom-txt { margin-top: 0; }
  }

  /* Opening a course zooms into the page (old grows and fades, new settles from slightly small);
     going back to the menu zooms out. Only the stage carries a name, and only during the change.
     Separate pages: add  @view-transition { navigation: auto; }  and name the main element on each page. */
  ::view-transition-group(w6zom-stage) { animation: none; overflow: clip; }
  ::view-transition-old(w6zom-stage), ::view-transition-new(w6zom-stage) { mix-blend-mode: normal; }
  ::view-transition-old(w6zom-stage) { animation: w6zom-past .3s cubic-bezier(.3, 0, .3, 1) both; }
  ::view-transition-new(w6zom-stage) { animation: w6zom-near .55s .08s cubic-bezier(.2, .8, .2, 1) both; }
  :root[data-w6zom-dir="out"]::view-transition-old(w6zom-stage) { animation-name: w6zom-away; }
  :root[data-w6zom-dir="out"]::view-transition-new(w6zom-stage) { animation-name: w6zom-back; }
  @keyframes w6zom-past { to { opacity: 0; transform: scale(1.12); } }
  @keyframes w6zom-near { from { opacity: 0; transform: scale(.9); } }
  @keyframes w6zom-away { to { opacity: 0; transform: scale(.9); } }
  @keyframes w6zom-back { from { opacity: 0; transform: scale(1.12); } }
  .w6zom[data-fb="in"] .w6zom-view:not([hidden]) { animation: w6zom-near .45s cubic-bezier(.2, .8, .2, 1) both; }
  .w6zom[data-fb="out"] .w6zom-view:not([hidden]) { animation: w6zom-back .45s cubic-bezier(.2, .8, .2, 1) both; }
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(w6zom-stage), ::view-transition-old(w6zom-stage), ::view-transition-new(w6zom-stage) { animation: none; }
    .w6zom .w6zom-view { animation: none !important; }
  }
`;

const COURSES = [
  { label: "Start", name: "Crab cake, pea purée, crème fraîche", next: "Next course",
    src: "https://images.pexels.com/photos/23644633/pexels-photo-23644633.jpeg?auto=compress&cs=tinysrgb&w=1000",
    alt: "A small golden crab cake topped with cream on a bed of green purée, on a white plate",
    text: "Brown and white crab from the harbour boats, bound with a little potato and fried to order in brown butter.",
    meta: "With a glass of Picpoul, £8 · Contains shellfish, egg, milk" },
  { label: "Main", name: "Grilled prawns, carrot purée, pickled shallot", next: "Next course",
    src: "https://images.pexels.com/photos/24289165/pexels-photo-24289165.jpeg?auto=compress&cs=tinysrgb&w=1000",
    alt: "A grilled prawn on a mound of grains beside a swirl of orange purée, on a teal plate",
    text: "Prawns over charcoal with a sweet roast carrot purée, sharp shallot and toasted spelt to soak up the juices.",
    meta: "With a glass of Albariño, £9 · Contains shellfish, gluten" },
  { label: "Pudding", name: "Brown butter sponge, mango, dark chocolate", next: "Back to the start",
    src: "https://images.pexels.com/photos/34520947/pexels-photo-34520947.jpeg?auto=compress&cs=tinysrgb&w=1000",
    alt: "A small sponge pudding with cubes of mango and a stroke of chocolate sauce on a speckled plate",
    text: "A warm sponge baked in small tins, ripe mango and a spoon of bitter chocolate sauce poured at the table.",
    meta: "With a glass of late harvest Riesling, £7 · Contains gluten, egg, milk" },
];
const DEMO = [[700, 1], [1700, 2], [1700, 0], [2600, 3], [1700, 0]]; // idle demo: [wait ms, view]; [] turns it off
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function MenuZoomsIntoEachCourseAndBackOut() {
  const reduce = useReducedMotion();
  const [cur, setCur] = useState(0); // 0 is the menu, 1 to 3 are the courses
  const [fb, setFb] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const heads = useRef<(HTMLHeadingElement | null)[]>([]);
  const rows = useRef<(HTMLAnchorElement | null)[]>([]);
  const st = useRef({ cur: 0, busy: false, auto: DEMO.length > 0 });
  const afterCommit = useRef<null | (() => void)>(null);

  useIso(() => { const f = afterCommit.current; afterCommit.current = null; f?.(); }, [cur]);

  // Going to the menu zooms out; going to any course zooms in.
  const go = (i: number, person: boolean) => {
    const s = st.current;
    if (i === s.cur || s.busy) return;
    const dir = i ? "in" : "out", was = s.cur;
    s.cur = i;
    const landed = () => {
      if (stageRef.current) stageRef.current.scrollTop = 0;
      if (person) (i ? heads.current[i] : rows.current[was])?.focus({ preventScroll: true });
    };
    const doc = document as any;
    if (reduce || matchMedia("(prefers-reduced-motion: reduce)").matches) { afterCommit.current = landed; setCur(i); return; }
    if (doc.startViewTransition && stageRef.current) {
      s.busy = true;
      const stage = stageRef.current, html = document.documentElement;
      stage.style.setProperty("view-transition-name", "w6zom-stage");
      html.setAttribute("data-w6zom-dir", dir);
      doc.startViewTransition(() => new Promise<void>((done) => { afterCommit.current = () => { landed(); done(); }; setCur(i); })).finished.finally(() => {
        stage.style.removeProperty("view-transition-name"); html.removeAttribute("data-w6zom-dir"); s.busy = false;
      });
    } else { afterCommit.current = landed; setFb(dir); setCur(i); }
  };
  const goRef = useRef(go);
  goRef.current = go;

  // Idle demo: opens courses and returns to the menu while the piece is on screen and untouched.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduce || !DEMO.length) return;
    let timer = 0, step = 0, seen = false;
    const tick = () => {
      timer = 0;
      if (!st.current.auto || !seen) return;
      goRef.current(DEMO[step][1], false);
      step = (step + 1) % DEMO.length;
      timer = window.setTimeout(tick, DEMO[step][0]);
    };
    // The demo waits for the page to finish loading, so the first thing anyone sees is the resting view.
    const kick = () => { if (seen && st.current.auto && !timer && document.readyState === "complete") timer = window.setTimeout(tick, DEMO[step][0]); };
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
    <div className="w6zom" ref={rootRef} data-fb={fb || undefined}>
      <style>{STYLES}</style>
      <header className="w6zom-top">
        <p className="w6zom-brand">Saltmarsh <em>Kitchen</em></p>
        <p className="w6zom-when">Dinner, Wednesday to Saturday</p>
      </header>
      <div className="w6zom-stage" ref={stageRef}>
        <section className="w6zom-view w6zom-menu" aria-labelledby="w6zom-h0" hidden={cur !== 0}>
          <p className="w6zom-eye">Set menu, three courses, £46</p>
          <h2 id="w6zom-h0" tabIndex={-1} ref={(el) => { heads.current[0] = el; }}>Tonight's menu</h2>
          <ol className="w6zom-list">
            {COURSES.map((c, k) => (
              <li key={c.label}>
                <a href="#" ref={(el) => { rows.current[k + 1] = el; }} onClick={link(k + 1)}><small>{c.label}</small><b>{c.name}</b><span>Open course</span></a>
              </li>
            ))}
          </ol>
          <div className="w6zom-foot"><p>Vegetarian set on request. Tables for up to eight, last orders at 9pm.</p><a href="#">Book a table</a></div>
        </section>
        {COURSES.map((c, k) => (
          <section key={c.label} className="w6zom-view" aria-labelledby={`w6zom-h${k + 1}`} hidden={cur !== k + 1}>
            <img src={c.src} alt={c.alt} width={600} height={400} />
            <div className="w6zom-txt">
              <p className="w6zom-eye">{c.label}</p>
              <h2 id={`w6zom-h${k + 1}`} tabIndex={-1} ref={(el) => { heads.current[k + 1] = el; }}>{c.name}</h2>
              <p>{c.text}</p>
              <p className="w6zom-meta">{c.meta}</p>
              <p className="w6zom-nav">
                <a href="#" onClick={link(0)}>Whole menu</a>
                <a href="#" onClick={link(((k + 1) % COURSES.length) + 1)}>{c.next}</a>
              </p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

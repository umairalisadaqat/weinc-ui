import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { useReducedMotion } from "framer-motion";

// Same styles as the plain HTML version; the comment at the top of STYLES names the values to change.
const STYLES = `
  /* Change these: --w6tab-bg, --w6tab-ink, --w6tab-moss (accent and underline), MS in the script (underline glide)
     and the .4s on the w6tab-rise keyframe (how long new content takes to settle). */
  .w6tab { --w6tab-bg: #edf1e7; --w6tab-ink: #1c2f25; --w6tab-moss: #2e5e45;
    height: 500px; display: flex; flex-direction: column; background: var(--w6tab-bg); color: var(--w6tab-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
  .w6tab *, .w6tab *::before { box-sizing: border-box; }
  .w6tab-top { padding: 22px clamp(16px, 5vw, 56px) 0; border-bottom: 1px solid #cdd7c6; }
  .w6tab-brand { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 1.0625rem; font-weight: 600; color: var(--w6tab-moss); }
  .w6tab-nav { display: flex; gap: clamp(14px, 3.5vw, 36px); margin: 14px 0 0; padding: 0; list-style: none; overflow-x: auto; scrollbar-width: none; }
  .w6tab-nav a { position: relative; display: inline-flex; align-items: center; min-height: 44px; padding: 0 2px; color: #3f5649; font-size: .9375rem; font-weight: 500; text-decoration: none; white-space: nowrap; border-radius: 4px; }
  .w6tab-nav a:hover, .w6tab-nav a[aria-current="page"] { color: var(--w6tab-ink); }
  .w6tab-bar { position: absolute; left: 0; right: 0; bottom: -1px; height: 3px; border-radius: 3px 3px 0 0; background: var(--w6tab-moss); opacity: 0; }
  .w6tab-nav a[aria-current="page"] .w6tab-bar { opacity: 1; }
  .w6tab a:focus-visible, .w6tab h2:focus-visible { outline: 2px solid var(--w6tab-moss); outline-offset: 3px; }
  .w6tab h2:focus { outline: none; }
  .w6tab-panel { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; }
  .w6tab-view { display: grid; gap: 24px; padding: 30px clamp(16px, 5vw, 56px) 28px; }
  .w6tab-view[hidden] { display: none; }
  .w6tab h2 { margin: 0; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(1.7rem, 3.6vw, 2.6rem); line-height: 1.1; letter-spacing: -.015em; max-width: 17ch; }
  .w6tab-intro p { margin: 14px 0 0; max-width: 30rem; font-size: 1.0625rem; line-height: 1.6; color: #3c5246; }
  .w6tab-tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 0; padding: 0; list-style: none; }
  .w6tab-tiles li { display: grid; gap: 6px; align-content: start; min-height: 96px; padding: 16px; border-radius: 14px; background: #fbfcf8; box-shadow: 0 1px 2px rgba(28,47,37,.08), 0 8px 20px -16px rgba(28,47,37,.35); }
  .w6tab-tiles b { font-size: .9375rem; font-weight: 600; }
  .w6tab-tiles span { font-size: .875rem; color: #4a5f53; }
  @media (min-width: 880px) { .w6tab-view { grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: 48px; align-items: start; padding-top: 44px; } }

  /* Two named parts: the active underline glides to the new link (moved by the script with transform),
     and the panel content drops out while the new content rises in. Names exist only during the change.
     Multi-page sites: add  @view-transition { navigation: auto; }  and the same names on every page. */
  ::view-transition-group(w6tab-bar) { animation: none; transform-origin: 0 0; }
  ::view-transition-old(w6tab-bar) { animation: none; opacity: 0; }
  ::view-transition-new(w6tab-bar) { animation: none; }
  ::view-transition-group(w6tab-panel) { animation: none; overflow: clip; }
  ::view-transition-old(w6tab-panel), ::view-transition-new(w6tab-panel) { mix-blend-mode: normal; }
  ::view-transition-old(w6tab-panel) { animation: w6tab-drop .16s cubic-bezier(0, 0, .2, 1) both; }
  ::view-transition-new(w6tab-panel) { animation: w6tab-rise .4s .12s cubic-bezier(.2, .8, .2, 1) both; }
  @keyframes w6tab-drop { to { opacity: 0; transform: translateY(-8px); } }
  @keyframes w6tab-rise { from { opacity: 0; transform: translateY(16px); } }
  .w6tab[data-fb] .w6tab-view:not([hidden]) { animation: w6tab-rise .4s cubic-bezier(.2, .8, .2, 1) both; }
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(w6tab-bar), ::view-transition-group(w6tab-panel), ::view-transition-old(w6tab-panel), ::view-transition-new(w6tab-panel) { animation: none; }
    .w6tab .w6tab-view { animation: none !important; }
  }
`;

const TABS = [
  { nav: "Plants", title: "Grown here, in peat-free compost", text: "Everything on the benches spent at least one winter outside in our valley, so it is ready for yours.",
    tiles: [["Hardy ferns", "2 litre pots, £9"], ["Woodland perennials", "9 cm pots, £5.50"], ["Native hedging", "Bare root, from £1.80"], ["Fruit trees", "Two year old, £38"]] },
  { nav: "Workshops", title: "Saturday mornings in the potting shed", text: "Small groups of eight, tea included, and you take home whatever you planted.",
    tiles: [["Winter pruning", "8 Nov, 10am, £25"], ["Planting a hedge", "22 Nov, 10am, £25"], ["Wreaths from the woods", "6 Dec, 10am, £32"], ["Seed sowing basics", "14 Feb, 10am, £20"]] },
  { nav: "Delivery", title: "Big plants, brought by our own van", text: "We deliver on Tuesdays and Fridays and carry everything round to the back garden.",
    tiles: [["Within 5 miles", "£6 per drop"], ["5 to 15 miles", "£12"], ["Trees over 2 m", "Two people, £20"], ["Planting service", "Quoted on the day"]] },
  { nav: "Visit", title: "Open every day but Christmas", text: "Down the lane past the church, with parking in the paddock and a dog bowl by the gate.",
    tiles: [["Monday to Saturday", "9am to 5pm"], ["Sunday", "10am to 4pm"], ["Address", "Mill Lane, Ashcombe"], ["Phone", "01632 960 552"]] },
];
const MS = 420; // underline glide in ms
const DEMO = [700, 1600, 2800]; // idle demo: ms before each automatic tab change; [] turns it off
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function PageTabsWithGlidingUnderlineAndRisingContent() {
  const reduce = useReducedMotion();
  const [cur, setCur] = useState(0);
  const [fb, setFb] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const heads = useRef<(HTMLHeadingElement | null)[]>([]);
  const st = useRef({ cur: 0, busy: false, auto: DEMO.length > 0 });
  const afterCommit = useRef<null | (() => void)>(null);

  useIso(() => { const f = afterCommit.current; afterCommit.current = null; f?.(); }, [cur]);

  // Slides and stretches the underline from rect a to rect b with transform only.
  const glide = (el: Element, a: DOMRect, b: DOMRect, pseudo?: string) => {
    const s = ` scale(${a.width / b.width},1)`;
    el.animate({ transform: pseudo ? [`translate(${a.left}px,${a.top}px)${s}`, `translate(${b.left}px,${b.top}px)`] : [`translate(${a.left - b.left}px,0)${s}`, "none"] },
      { duration: MS, easing: "cubic-bezier(.3,.8,.2,1)", pseudoElement: pseudo } as KeyframeAnimationOptions);
  };

  const go = (i: number, person: boolean) => {
    const s = st.current, panel = panelRef.current;
    if (i === s.cur || s.busy || !panel) return;
    const from = bars.current[s.cur]!, to = bars.current[i]!, a = from.getBoundingClientRect();
    s.cur = i;
    const landed = () => { panel.scrollTop = 0; if (person) heads.current[i]?.focus({ preventScroll: true }); };
    if (reduce || matchMedia("(prefers-reduced-motion: reduce)").matches) { afterCommit.current = landed; setCur(i); return; }
    s.busy = true;
    const doc = document as any;
    if (doc.startViewTransition) {
      from.style.setProperty("view-transition-name", "w6tab-bar");
      panel.style.setProperty("view-transition-name", "w6tab-panel");
      const t = doc.startViewTransition(() => new Promise<void>((done) => {
        afterCommit.current = () => { from.style.removeProperty("view-transition-name"); landed(); to.style.setProperty("view-transition-name", "w6tab-bar"); done(); };
        setCur(i);
      }));
      t.ready.then(() => glide(document.documentElement, a, to.getBoundingClientRect(), "::view-transition-group(w6tab-bar)"));
      t.finished.finally(() => { to.style.removeProperty("view-transition-name"); panel.style.removeProperty("view-transition-name"); s.busy = false; });
    } else {
      setFb(true);
      afterCommit.current = () => { landed(); to.style.transformOrigin = "0 0"; glide(to, a, to.getBoundingClientRect()); };
      setCur(i);
      window.setTimeout(() => { s.busy = false; }, MS);
    }
  };
  const goRef = useRef(go);
  goRef.current = go;

  // Idle demo: steps through the tabs while the piece is on screen and nobody has used it.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduce || !DEMO.length) return;
    let timer = 0, turns = 0, seen = false;
    const tick = () => {
      timer = 0;
      if (!st.current.auto || !seen) return;
      goRef.current((st.current.cur + 1) % TABS.length, false);
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
    <div className="w6tab" ref={rootRef} data-fb={fb ? "" : undefined}>
      <style>{STYLES}</style>
      <header className="w6tab-top">
        <p className="w6tab-brand">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 21V9m0 0C12 5 9 3 5 3c0 4 3 6 7 6Zm0 4c0-3 3-5 7-5 0 3-3 5-7 5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Fernhollow Nursery
        </p>
        <nav aria-label="Nursery pages">
          <ul className="w6tab-nav">
            {TABS.map((t, i) => (
              <li key={t.nav}>
                <a href="#" onClick={link(i)} aria-current={i === cur ? "page" : undefined}>
                  {t.nav}<span className="w6tab-bar" aria-hidden="true" ref={(el) => { bars.current[i] = el; }} />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <div className="w6tab-panel" ref={panelRef}>
        {TABS.map((t, i) => (
          <section key={t.nav} className="w6tab-view" aria-labelledby={`w6tab-h${i}`} hidden={i !== cur}>
            <div className="w6tab-intro">
              <h2 id={`w6tab-h${i}`} tabIndex={-1} ref={(el) => { heads.current[i] = el; }}>{t.title}</h2>
              <p>{t.text}</p>
            </div>
            <ul className="w6tab-tiles">
              {t.tiles.map(([a, b]) => <li key={a}><b>{a}</b><span>{b}</span></li>)}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

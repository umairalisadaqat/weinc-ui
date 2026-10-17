import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { useReducedMotion } from "framer-motion";

// Same styles as the plain HTML version; the comment at the top of STYLES names the values to change.
const STYLES = `
  /* Change these: --w6mph-bg, --w6mph-ink, --w6mph-clay (accent), the 3 / 2 aspect-ratio
     (keep card photo and detail photo the same shape so the morph never stretches) and MS in the script. */
  .w6mph { --w6mph-bg: #f4e9df; --w6mph-ink: #2e1d14; --w6mph-clay: #a2441f;
    height: 640px; display: flex; flex-direction: column; background: var(--w6mph-bg); color: var(--w6mph-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
  .w6mph *, .w6mph *::before { box-sizing: border-box; }
  .w6mph-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 4px 20px; padding: 20px clamp(16px, 4.5vw, 52px) 14px; }
  .w6mph-brand { margin: 0; font-size: 1.0625rem; font-weight: 700; letter-spacing: -.01em; }
  .w6mph-brand span { font-weight: 400; color: var(--w6mph-clay); }
  .w6mph-note { margin: 0; font-size: .8125rem; color: #6a4b3a; }
  .w6mph-stage { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 8px clamp(16px, 4.5vw, 52px) 28px; }
  .w6mph-view[hidden] { display: none; }
  .w6mph h2 { margin: 0; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(1.7rem, 3.6vw, 2.5rem); line-height: 1.1; letter-spacing: -.015em; }
  .w6mph h2:focus { outline: none; }
  .w6mph h2:focus-visible { outline: 2px solid var(--w6mph-clay); outline-offset: 4px; }
  .w6mph-intro { margin: 10px 0 0; max-width: 34rem; font-size: 1rem; line-height: 1.55; color: #5a3f30; }
  .w6mph-cards { margin: 24px 0 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 14px; }
  .w6mph-cards a { display: grid; gap: 2px; color: inherit; text-decoration: none; border-radius: 12px; }
  .w6mph-cards a:focus-visible { outline: 2px solid var(--w6mph-clay); outline-offset: 4px; }
  .w6mph img { display: block; width: 100%; height: auto; aspect-ratio: 3 / 2; object-fit: cover; border-radius: 10px; background: #e3cfbf; }
  .w6mph-cards img { margin-bottom: 8px; box-shadow: 0 1px 2px rgba(46,29,20,.12); transition: transform .4s cubic-bezier(.2,.7,.2,1); }
  .w6mph-cards a:hover img, .w6mph-cards a:focus-visible img { transform: translateY(-3px); }
  .w6mph-cards b { font-size: .9375rem; font-weight: 600; }
  .w6mph-cards span { font-size: .875rem; color: #6a4b3a; }
  .w6mph-foot { margin: 26px 0 0; padding-top: 14px; border-top: 1px solid #e0c9b8; font-size: .875rem; color: #6a4b3a; }
  .w6mph-crumbs { display: flex; justify-content: space-between; gap: 16px; margin: 0 0 10px; }
  .w6mph-crumbs a { display: inline-flex; align-items: center; min-height: 40px; color: var(--w6mph-clay); font-size: .9375rem; font-weight: 600; text-underline-offset: 5px; border-radius: 6px; }
  .w6mph-crumbs a:first-child::before { content: "←"; margin-right: 8px; }
  .w6mph-crumbs a:last-child::after { content: "→"; margin-left: 8px; }
  .w6mph-crumbs a:focus-visible, .w6mph-btn:focus-visible { outline: 2px solid var(--w6mph-ink); outline-offset: 3px; }
  .w6mph-split { display: grid; gap: 20px; }
  .w6mph-hero { box-shadow: 0 18px 40px -24px rgba(46,29,20,.55); }
  .w6mph-price { margin: 8px 0 0; font-size: 1.0625rem; color: var(--w6mph-clay); font-weight: 600; }
  .w6mph-desc { margin: 12px 0 0; font-size: 1rem; line-height: 1.6; color: #4d3528; max-width: 30rem; }
  .w6mph-facts { margin: 16px 0 0; display: grid; gap: 0; border-top: 1px solid #e0c9b8; }
  .w6mph-facts div { display: grid; grid-template-columns: 5rem 1fr; gap: 12px; padding: 9px 0; border-bottom: 1px solid #e0c9b8; font-size: .9rem; }
  .w6mph-facts dt { color: #6a4b3a; }
  .w6mph-facts dd { margin: 0; }
  .w6mph-btn { margin-top: 20px; min-height: 46px; padding: 0 22px; border: 0; border-radius: 999px; background: var(--w6mph-clay); color: #fff;
    font: inherit; font-size: .9375rem; font-weight: 600; cursor: pointer; }
  .w6mph-btn:hover { background: #87381a; }
  @media (min-width: 900px) {
    .w6mph-cards { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
    .w6mph-split { grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 40px; align-items: start; }
  }

  /* The morph: the clicked photo carries the name w6mph-photo through the swap. The script moves the group with
     transform only (same shape before and after, one even scale), so nothing animates width or height.
     For separate pages, add  @view-transition { navigation: auto; }  and give the photo the same name on both pages. */
  ::view-transition-group(w6mph-photo) { animation: none; transform-origin: 0 0; }
  ::view-transition-old(w6mph-photo) { animation: none; opacity: 0; }
  ::view-transition-new(w6mph-photo) { animation: none; }
  /* Fallback without view transitions: the text of the new view fades up while the photo is moved by the script. */
  @keyframes w6mph-up { from { opacity: 0; transform: translateY(12px); } }
  .w6mph[data-fb] .w6mph-view:not([hidden]) .w6mph-txt, .w6mph[data-fb] .w6mph-view:not([hidden]) .w6mph-intro { animation: w6mph-up .45s .1s cubic-bezier(.2,.7,.2,1) both; }
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(w6mph-photo), ::view-transition-old(w6mph-photo), ::view-transition-new(w6mph-photo) { animation: none; }
    .w6mph .w6mph-txt, .w6mph .w6mph-intro, .w6mph-cards img { animation: none !important; transition: none; }
  }
`;

const PIECES = [
  { name: "Hearth bowl", price: "£24 each", src: "https://images.pexels.com/photos/33703946/pexels-photo-33703946.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Stacks of rustic clay bowls on workshop shelves",
    desc: "Wide enough for soup, shallow enough for salad.", size: "15 cm across, 7 cm deep", glaze: "Bare clay outside, honey glaze inside", care: "Wash by hand" },
  { name: "Dipped bud vase", price: "£36", src: "https://images.pexels.com/photos/8063882/pexels-photo-8063882.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Ceramic vases dipped in grey, coral and white glaze on a wooden shelf",
    desc: "Dipped twice by hand, so no two bands sit at the same height.", size: "18 cm tall", glaze: "Grey, coral or white over a raw foot", care: "Rinse by hand" },
  { name: "Tidepool dish", price: "£22", src: "https://images.pexels.com/photos/28271468/pexels-photo-28271468.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Small dishes with a deep teal glaze laid out on a white cloth",
    desc: "For olives, salt or rings by the sink. The teal pools darker where the glaze runs thick.", size: "11 cm across", glaze: "Reactive teal with an iron edge", care: "Wash by hand" },
  { name: "Bisque mug", price: "£18", src: "https://images.pexels.com/photos/8063803/pexels-photo-8063803.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Rows of unglazed white mugs on a dusty studio shelf",
    desc: "Fired once and waiting. Choose the glaze and we fire it again for collection in a week.", size: "300 ml", glaze: "Your choice of five", care: "Ready in seven days" },
];
const MS = 520; // length of the photo morph
const DEMO = [[700, 2], [1500, 3], [1500, 0], [2600, 4], [1500, 1], [1500, 0]]; // idle demo: [wait ms, view]; [] turns it off
const NAME = "w6mph-photo";
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function GridThumbnailGrowsIntoTheDetailPhoto() {
  const reduce = useReducedMotion();
  const [cur, setCur] = useState(0); // 0 is the grid, 1 to 4 are the pieces
  const [fb, setFb] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const heroRefs = useRef<(HTMLImageElement | null)[]>([]);
  const headRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const st = useRef({ cur: 0, busy: false, auto: DEMO.length > 0 });
  const afterCommit = useRef<null | (() => void)>(null);

  // Runs once React has written the new view, inside the view transition callback when there is one.
  useIso(() => { const f = afterCommit.current; afterCommit.current = null; f?.(); }, [cur]);

  const photoOf = (v: number, other: number) => (v ? heroRefs.current[v - 1] : cardRefs.current[other - 1]?.querySelector("img")) as HTMLElement;

  const go = (i: number, person: boolean) => {
    const s = st.current;
    if (s.busy || i === s.cur) return;
    const was = s.cur, from = photoOf(was, i), morph = !was || !i;
    s.cur = i;
    const landed = () => {
      if (stageRef.current) stageRef.current.scrollTop = 0;
      if (person) (i ? headRefs.current[i - 1] : cardRefs.current[was - 1])?.focus({ preventScroll: true });
      return photoOf(i, was);
    };
    if (reduce || matchMedia("(prefers-reduced-motion: reduce)").matches) { afterCommit.current = landed; setCur(i); return; }
    const a = from.getBoundingClientRect();
    // Moves the photo from where it was (a) to where it lands (b) with one even scale: transform only.
    const move = (to: HTMLElement, pseudo?: string) => {
      const b = to.getBoundingClientRect(), k = ` scale(${a.width / b.width})`;
      const frames = pseudo
        ? [`translate(${a.left}px,${a.top}px)${k}`, `translate(${b.left}px,${b.top}px)`]
        : [`translate(${a.left - b.left}px,${a.top - b.top}px)${k}`, "none"];
      (pseudo ? document.documentElement : to).animate({ transform: frames }, { duration: MS, easing: "cubic-bezier(.2,.75,.2,1)", pseudoElement: pseudo } as KeyframeAnimationOptions);
    };
    s.busy = true;
    const doc = document as any;
    if (doc.startViewTransition) {
      let to: HTMLElement | null = null;
      if (morph) from.style.setProperty("view-transition-name", NAME);
      const t = doc.startViewTransition(() => new Promise<void>((done) => {
        afterCommit.current = () => {
          from.style.removeProperty("view-transition-name");
          to = landed();
          if (morph) to.style.setProperty("view-transition-name", NAME);
          done();
        };
        setCur(i);
      }));
      if (morph) t.ready.then(() => to && move(to, `::view-transition-group(${NAME})`));
      t.finished.finally(() => { to?.style.removeProperty("view-transition-name"); s.busy = false; });
    } else {
      setFb(true);
      afterCommit.current = () => { const to = landed(); if (morph) { to.style.transformOrigin = "0 0"; move(to); } };
      setCur(i);
      window.setTimeout(() => { s.busy = false; }, MS);
    }
  };
  const goRef = useRef(go);
  goRef.current = go;

  // Idle demo: open a piece, step to the next one, go back, then repeat with other cards.
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
    <div className="w6mph" ref={rootRef} data-fb={fb ? "" : undefined}>
      <style>{STYLES}</style>
      <header className="w6mph-top">
        <p className="w6mph-brand">Ochre Lane <span>Pottery</span></p>
        <p className="w6mph-note">Studio sale, this weekend only</p>
      </header>
      <div className="w6mph-stage" ref={stageRef}>
        <section className="w6mph-view w6mph-grid" aria-labelledby="w6mph-h0" hidden={cur !== 0}>
          <h2 id="w6mph-h0" tabIndex={-1}>From this week's firing</h2>
          <p className="w6mph-intro">Four small batches out of the kiln on Thursday. Open a piece to see its glaze, size and how to look after it.</p>
          <ul className="w6mph-cards">
            {PIECES.map((c, k) => (
              <li key={c.name}>
                <a href="#" ref={(el) => { cardRefs.current[k] = el; }} onClick={link(k + 1)}>
                  <img src={c.src} alt={c.alt} width={600} height={400} />
                  <b>{c.name}</b><span>{c.price}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="w6mph-foot">Collect from the studio door on Saturday, 10am to 4pm, or we can post your order.</p>
        </section>
        {PIECES.map((p, k) => (
          <section key={p.name} className="w6mph-view" aria-labelledby={`w6mph-h${k + 1}`} hidden={cur !== k + 1}>
            <p className="w6mph-crumbs">
              <a href="#" onClick={link(0)}>All pieces</a>
              <a href="#" onClick={link(((k + 1) % PIECES.length) + 1)}>Next piece</a>
            </p>
            <div className="w6mph-split">
              <img className="w6mph-hero" ref={(el) => { heroRefs.current[k] = el; }} src={p.src} alt={p.alt} width={600} height={400} />
              <div className="w6mph-txt">
                <h2 id={`w6mph-h${k + 1}`} tabIndex={-1} ref={(el) => { headRefs.current[k] = el; }}>{p.name}</h2>
                <p className="w6mph-price">{p.price}</p>
                <p className="w6mph-desc">{p.desc}</p>
                <dl className="w6mph-facts">
                  <div><dt>Size</dt><dd>{p.size}</dd></div>
                  <div><dt>Glaze</dt><dd>{p.glaze}</dd></div>
                  <div><dt>Care</dt><dd>{p.care}</dd></div>
                </dl>
                <button type="button" className="w6mph-btn">Reserve this piece</button>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

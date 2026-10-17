import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// Same styles as the plain HTML version; the comment at the top of STYLES names the values to change.
const STYLES = `
  /* Change these: --w6stp-sand, --w6stp-ink, --w6stp-rust (accent), the 32% push in the w6stp keyframes
     and the .5s durations. */
  .w6stp { --w6stp-sand: #f1e9db; --w6stp-ink: #2f271d; --w6stp-rust: #9a4f24;
    height: 620px; display: flex; flex-direction: column; background: var(--w6stp-sand); color: var(--w6stp-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
  .w6stp *, .w6stp *::before { box-sizing: border-box; }
  .w6stp-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 24px; padding: 18px clamp(16px, 5vw, 56px); border-bottom: 1px solid #dccfb9; }
  .w6stp-brand { margin: 0; font-family: Georgia, "Iowan Old Style", serif; font-size: 1.2rem; }
  .w6stp-brand span { display: block; font-family: ui-sans-serif, system-ui, sans-serif; font-size: .75rem; color: #6b5c49; }
  .w6stp-prog { width: min(260px, 100%); }
  .w6stp-count { margin: 0 0 8px; font-size: .8125rem; color: #5c4e3d; }
  .w6stp-track { height: 4px; border-radius: 4px; background: #ddd0bb; overflow: hidden; }
  .w6stp-fill { display: block; height: 100%; background: var(--w6stp-rust); transform-origin: 0 50%; transform: scaleX(.3333); transition: transform .6s cubic-bezier(.3, .8, .2, 1); }
  .w6stp-body { flex: 1; min-height: 0; display: flex; }
  .w6stp-stage { flex: 1; min-width: 0; overflow-y: auto; overflow-x: hidden; }
  .w6stp-aside { display: none; }
  @media (min-width: 980px) {
    .w6stp-aside { display: block; flex: 0 0 17rem; align-self: start; margin: 26px clamp(16px, 5vw, 56px) 0 0; padding: 20px; border-radius: 14px; background: #faf6ef; border: 1px solid #e2d6c3; }
    .w6stp-aside h3 { margin: 0; font-family: Georgia, serif; font-weight: 400; font-size: 1.15rem; }
    .w6stp-aside p { margin: 8px 0 0; font-size: .875rem; line-height: 1.55; color: #574937; }
    .w6stp-aside ul { margin: 12px 0 0; padding: 12px 0 0; list-style: none; border-top: 1px solid #e2d6c3; display: grid; gap: 6px; font-size: .8125rem; color: #4a3d2e; }
  }
  .w6stp-view { padding: 26px clamp(16px, 5vw, 56px) 28px; max-width: 46rem; }
  .w6stp-view[hidden] { display: none; }
  .w6stp h2 { margin: 0; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(1.7rem, 3.6vw, 2.4rem); line-height: 1.1; }
  .w6stp h2:focus { outline: none; }
  .w6stp h2:focus-visible { outline: 2px solid var(--w6stp-rust); outline-offset: 4px; }
  .w6stp-lead { margin: 10px 0 0; font-size: 1rem; line-height: 1.55; color: #574937; }
  .w6stp-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .w6stp-opts { margin: 18px 0 0; padding: 0; border: 0; display: grid; gap: 10px; }
  .w6stp-opts label { position: relative; display: block; cursor: pointer; }
  .w6stp-opts input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
  .w6stp-opts span { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 2px 14px; align-items: baseline; min-height: 54px; padding: 15px 18px 15px 46px;
    border: 1px solid #d6c7ae; border-radius: 12px; background: #faf6ef; }
  .w6stp-opts span::before { content: ""; position: absolute; left: 17px; top: 18px; width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #8c7a62; background: #fff; }
  .w6stp-opts input:checked + span { border-color: var(--w6stp-rust); background: #fff; box-shadow: 0 0 0 1px var(--w6stp-rust); }
  .w6stp-opts input:checked + span::before { border: 5px solid var(--w6stp-rust); }
  .w6stp-opts input:focus-visible + span { outline: 2px solid var(--w6stp-ink); outline-offset: 2px; }
  .w6stp-opts b { font-weight: 600; font-size: .9375rem; }
  .w6stp-opts small { font-size: .8125rem; color: #6b5c49; }
  .w6stp-room { display: grid; gap: 14px; margin-top: 18px; }
  .w6stp-room img { display: block; width: 100%; height: auto; aspect-ratio: 3 / 2; object-fit: cover; border-radius: 12px; background: #e3d6c1; }
  .w6stp-room .w6stp-opts { margin: 0; align-content: start; }
  .w6stp-btns { display: flex; flex-wrap: wrap; gap: 10px; margin: 22px 0 0; }
  .w6stp button { min-height: 46px; padding: 0 22px; border-radius: 999px; font: inherit; font-size: .9375rem; font-weight: 600; cursor: pointer; }
  .w6stp-go { border: 0; background: var(--w6stp-rust); color: #fff; }
  .w6stp-go:hover { background: #80411d; }
  .w6stp-back { border: 1px solid #b9a88f; background: transparent; color: var(--w6stp-ink); }
  .w6stp button:focus-visible, .w6stp-input:focus-visible { outline: 2px solid var(--w6stp-ink); outline-offset: 3px; }
  .w6stp-sum { margin: 18px 0 0; border-top: 1px solid #dccfb9; }
  .w6stp-sum div { display: flex; justify-content: space-between; gap: 16px; padding: 11px 0; border-bottom: 1px solid #dccfb9; font-size: .9375rem; }
  .w6stp-sum dt { color: #6b5c49; }
  .w6stp-sum dd { margin: 0; font-weight: 600; text-align: right; }
  .w6stp-field { display: block; margin-top: 18px; font-size: .875rem; font-weight: 600; }
  .w6stp-input { display: block; width: 100%; max-width: 22rem; min-height: 46px; margin-top: 6px; padding: 0 14px; border: 1px solid #b9a88f; border-radius: 10px; background: #fff; font: inherit; color: inherit; }
  .w6stp-note { margin: 12px 0 0; min-height: 1.4em; font-size: .9375rem; color: #3f6b3a; }
  @media (min-width: 760px) { .w6stp-room { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: start; } }

  /* The step area is named only during a change: forward pushes the old step up and out while the next rises
     from below; back pushes downwards. The bar fill is named too and keeps its live CSS transition.
     Real multi-page forms: add  @view-transition { navigation: auto; }  and these names on each page. */
  ::view-transition-group(w6stp-stage) { animation: none; overflow: clip; }
  ::view-transition-group(w6stp-fill) { animation: none; }
  ::view-transition-old(w6stp-fill) { animation: none; opacity: 0; }
  ::view-transition-new(w6stp-fill) { animation: none; }
  ::view-transition-old(w6stp-stage), ::view-transition-new(w6stp-stage) { mix-blend-mode: normal; }
  ::view-transition-old(w6stp-stage) { animation: w6stp-up-out .3s cubic-bezier(.4, 0, .9, .6) both; }
  ::view-transition-new(w6stp-stage) { animation: w6stp-up-in .5s .06s cubic-bezier(.2, .8, .2, 1) both; }
  :root[data-w6stp-dir="b"]::view-transition-old(w6stp-stage) { animation-name: w6stp-down-out; }
  :root[data-w6stp-dir="b"]::view-transition-new(w6stp-stage) { animation-name: w6stp-down-in; }
  @keyframes w6stp-up-out { to { opacity: 0; transform: translateY(-32%); } }
  @keyframes w6stp-up-in { from { opacity: 0; transform: translateY(32%); } }
  @keyframes w6stp-down-out { to { opacity: 0; transform: translateY(32%); } }
  @keyframes w6stp-down-in { from { opacity: 0; transform: translateY(-32%); } }
  .w6stp[data-fb="f"] .w6stp-view:not([hidden]) { animation: w6stp-up-in .45s cubic-bezier(.2, .8, .2, 1) both; }
  .w6stp[data-fb="b"] .w6stp-view:not([hidden]) { animation: w6stp-down-in .45s cubic-bezier(.2, .8, .2, 1) both; }
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(w6stp-stage), ::view-transition-old(w6stp-stage), ::view-transition-new(w6stp-stage) { animation: none; }
    .w6stp .w6stp-view { animation: none !important; }
    .w6stp-fill { transition: none; }
  }
`;

const DATES = [
  { value: "Fri 7 to Sun 9 Nov", nights: 2 },
  { value: "Fri 14 to Mon 17 Nov", nights: 3 },
  { value: "Thu 20 to Sun 23 Nov", nights: 3 },
];
const ROOMS = [
  { value: "Dune Room", note: "Sea view, king bed, £140 a night", price: 140 },
  { value: "Garden Room", note: "Own terrace, double bed, £115 a night", price: 115 },
];
const DEMO = [800, 1800, 2600, 2600]; // idle demo: ms before each automatic step; [] turns it off
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function BookingStepsPushUpWithAFillingProgressBar() {
  const reduce = useReducedMotion();
  const [cur, setCur] = useState(0);
  const [fb, setFb] = useState("");
  const [date, setDate] = useState(0);
  const [room, setRoom] = useState(0);
  const [note, setNote] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const heads = useRef<(HTMLHeadingElement | null)[]>([]);
  const st = useRef({ cur: 0, busy: false, auto: DEMO.length > 0 });
  const afterCommit = useRef<null | (() => void)>(null);

  useIso(() => { const f = afterCommit.current; afterCommit.current = null; f?.(); }, [cur]);

  const go = (i: number, person: boolean) => {
    const s = st.current;
    if (i === s.cur || s.busy) return;
    const dir = i > s.cur ? "f" : "b";
    s.cur = i;
    const landed = () => {
      if (stageRef.current) stageRef.current.scrollTop = 0;
      if (person) heads.current[i]?.focus({ preventScroll: true });
    };
    const doc = document as any;
    if (reduce || matchMedia("(prefers-reduced-motion: reduce)").matches) { afterCommit.current = landed; setCur(i); return; }
    if (doc.startViewTransition && stageRef.current && fillRef.current) {
      s.busy = true;
      const stage = stageRef.current, fill = fillRef.current, html = document.documentElement;
      stage.style.setProperty("view-transition-name", "w6stp-stage");
      fill.style.setProperty("view-transition-name", "w6stp-fill");
      html.setAttribute("data-w6stp-dir", dir);
      doc.startViewTransition(() => new Promise<void>((done) => { afterCommit.current = () => { landed(); done(); }; setCur(i); })).finished.finally(() => {
        stage.style.removeProperty("view-transition-name"); fill.style.removeProperty("view-transition-name");
        html.removeAttribute("data-w6stp-dir"); s.busy = false;
      });
    } else { afterCommit.current = landed; setFb(dir); setCur(i); }
  };
  const goRef = useRef(go);
  goRef.current = go;

  // Idle demo: walks forward through the steps, then back to the start, while on screen and untouched.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduce || !DEMO.length) return;
    let timer = 0, turns = 0, seen = false;
    const tick = () => {
      timer = 0;
      if (!st.current.auto || !seen) return;
      const c = st.current.cur;
      goRef.current(c < 2 ? c + 1 : 0, false);
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

  const step = (i: number) => () => { st.current.auto = false; go(i, true); };
  const d = DATES[date], r = ROOMS[room];

  return (
    <div className="w6stp" ref={rootRef} data-fb={fb || undefined}>
      <style>{STYLES}</style>
      <header className="w6stp-top">
        <p className="w6stp-brand">Marram House <span>Rooms by the dunes</span></p>
        <div className="w6stp-prog">
          <p className="w6stp-count" aria-live="polite">Step <b>{cur + 1}</b> of 3</p>
          <div className="w6stp-track" aria-hidden="true"><span className="w6stp-fill" ref={fillRef} style={{ transform: `scaleX(${(cur + 1) / 3})` }} /></div>
        </div>
      </header>
      <div className="w6stp-body">
      <div className="w6stp-stage" ref={stageRef}>
        <section className="w6stp-view" aria-labelledby="w6stp-h0" hidden={cur !== 0}>
          <h2 id="w6stp-h0" tabIndex={-1} ref={(el) => { heads.current[0] = el; }}>When are you coming?</h2>
          <p className="w6stp-lead">These weekends still have rooms. Check-in from 3pm, breakfast until 10.</p>
          <fieldset className="w6stp-opts">
            <legend className="w6stp-sr">Dates</legend>
            {DATES.map((o, k) => (
              <label key={o.value} htmlFor={`w6stp-d${k}`}>
                <input type="radio" id={`w6stp-d${k}`} name="w6stp-d" value={o.value} checked={date === k} onChange={() => setDate(k)} />
                <span><b>{o.value}</b><small>{o.nights} nights</small></span>
              </label>
            ))}
          </fieldset>
          <p className="w6stp-btns"><button type="button" className="w6stp-go" onClick={step(1)}>Choose a room</button></p>
        </section>
        <section className="w6stp-view" aria-labelledby="w6stp-h1" hidden={cur !== 1}>
          <h2 id="w6stp-h1" tabIndex={-1} ref={(el) => { heads.current[1] = el; }}>Pick a room</h2>
          <div className="w6stp-room">
            <img src="https://images.pexels.com/photos/2736388/pexels-photo-2736388.jpeg?auto=compress&cs=tinysrgb&w=900" alt="A made-up double bed with white linen, a padded headboard and a lit bedside lamp" width={600} height={400} />
            <fieldset className="w6stp-opts">
              <legend className="w6stp-sr">Room</legend>
              {ROOMS.map((o, k) => (
                <label key={o.value} htmlFor={`w6stp-r${k}`}>
                  <input type="radio" id={`w6stp-r${k}`} name="w6stp-r" value={o.value} checked={room === k} onChange={() => setRoom(k)} />
                  <span><b>{o.value}</b><small>{o.note}</small></span>
                </label>
              ))}
            </fieldset>
          </div>
          <p className="w6stp-btns">
            <button type="button" className="w6stp-back" onClick={step(0)}>Back</button>
            <button type="button" className="w6stp-go" onClick={step(2)}>Check details</button>
          </p>
        </section>
        <section className="w6stp-view" aria-labelledby="w6stp-h2" hidden={cur !== 2}>
          <h2 id="w6stp-h2" tabIndex={-1} ref={(el) => { heads.current[2] = el; }}>Check and send</h2>
          <dl className="w6stp-sum">
            <div><dt>Dates</dt><dd>{d.value}</dd></div>
            <div><dt>Room</dt><dd>{r.value}</dd></div>
            <div><dt>Total</dt><dd>£{d.nights * r.price} with breakfast</dd></div>
          </dl>
          <label className="w6stp-field" htmlFor="w6stp-name">Your name</label>
          <input className="w6stp-input" id="w6stp-name" type="text" autoComplete="name" placeholder="As on your card" />
          <p className="w6stp-btns">
            <button type="button" className="w6stp-back" onClick={step(1)}>Back</button>
            <button type="button" className="w6stp-go" onClick={() => { st.current.auto = false; setNote("Request sent. We reply by email within a few hours."); }}>Request these dates</button>
          </p>
          <p className="w6stp-note" aria-live="polite">{note}</p>
        </section>
      </div>
      <aside className="w6stp-aside" aria-label="About the house">
        <h3>Eight rooms behind the dunes</h3>
        <p>Two minutes from the beach path at Shore Road, Holme, with breakfast from the farm next door.</p>
        <ul><li>Check-in 3pm, check-out 11am</li><li>Dogs welcome in garden rooms</li><li>Arrival from 3pm on the first day</li></ul>
      </aside>
      </div>
    </div>
  );
}

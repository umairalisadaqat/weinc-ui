import { useEffect, useRef } from "react";

/* Styles shared with the HTML version; class and keyframe names are prefixed so several pieces can share a page. */
const css = `
  /* Change these: page colour, card, ink, accent, icon stroke weight. */
  .m3tlb { --m3tlb-bg: #eceee9; --m3tlb-card: #fbfbf8; --m3tlb-ink: #1e2622; --m3tlb-accent: #2f6a55; --m3tlb-stroke: 1.75; }
  .m3tlb { background: var(--m3tlb-bg); padding: 72px 16px; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; color: var(--m3tlb-ink); }
  .m3tlb-card { max-width: 760px; margin: 0 auto; background: var(--m3tlb-card); border: 1px solid #dfe2dc; border-radius: 20px; padding: 28px; box-shadow: 0 1px 2px rgba(30,38,34,.05), 0 18px 40px -24px rgba(30,38,34,.28); }
  .m3tlb-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 8px 24px; padding-bottom: 22px; border-bottom: 1px solid #e7e9e3; }
  .m3tlb-kicker { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--m3tlb-accent); }
  .m3tlb-title { margin: 6px 0 0; font-size: 22px; font-weight: 600; letter-spacing: -.01em; }
  .m3tlb-meta { margin: 0; font-size: 14px; color: #55605a; }
  .m3tlb-bar { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; margin-top: 22px; }
  .m3tlb-btn { display: flex; flex-direction: column; align-items: center; gap: 8px; min-height: 92px; padding: 10px 4px 10px; border: 0; border-radius: 14px; background: transparent; color: var(--m3tlb-ink); font: inherit; font-size: 12.5px; font-weight: 500; cursor: pointer; transition: background-color .25s ease, color .25s ease; }
  .m3tlb-btn:focus-visible { outline: 2px solid var(--m3tlb-accent); outline-offset: 2px; }
  .m3tlb-btn.is-on, .m3tlb-btn:focus-visible { background: #edf3ee; color: var(--m3tlb-accent); }
  .m3tlb-tile { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; background: #fff; border: 1px solid #e3e6e0; box-shadow: 0 1px 1px rgba(30,38,34,.04), 0 4px 10px -6px rgba(30,38,34,.18); transition: border-color .25s ease; }
  .m3tlb-btn.is-on .m3tlb-tile, .m3tlb-btn:focus-visible .m3tlb-tile { border-color: #b9cfc2; }
  .m3tlb-ic { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: var(--m3tlb-stroke); stroke-linecap: round; stroke-linejoin: round; overflow: visible; }
  .m3tlb-ic g, .m3tlb-ic path { transform-box: fill-box; }
  .m3tlb-bell { transform-origin: 50% 0; }
  .m3tlb-sync { transform-origin: 50% 50%; }
  .m3tlb-lid { transform-origin: 0% 100%; }
  .m3tlb-heart { transform-origin: 50% 60%; }
  .m3tlb-lens { transform-origin: 50% 50%; }
  .m3tlb-fill { fill: currentColor; stroke: none; opacity: 0; transition: opacity .3s ease; }
  .m3tlb-btn[aria-pressed="true"] .m3tlb-fill { opacity: 1; }
  .m3tlb-foot { margin: 18px 0 0; font-size: 13px; color: #5d6862; text-align: center; }
  .m3tlb-btn.is-on .m3tlb-bell, .m3tlb-btn:focus-visible .m3tlb-bell { animation: m3tlb-swing .9s cubic-bezier(.36,.07,.19,.97); }
  .m3tlb-btn.is-on .m3tlb-clap, .m3tlb-btn:focus-visible .m3tlb-clap { animation: m3tlb-clap .9s ease; }
  .m3tlb-btn.is-on .m3tlb-sync, .m3tlb-btn:focus-visible .m3tlb-sync { animation: m3tlb-turn .8s cubic-bezier(.6,0,.3,1); }
  .m3tlb-btn.is-on .m3tlb-lid, .m3tlb-btn:focus-visible .m3tlb-lid { animation: m3tlb-lid .8s ease; }
  .m3tlb-btn.is-on .m3tlb-plane, .m3tlb-btn:focus-visible .m3tlb-plane { animation: m3tlb-fly .8s cubic-bezier(.5,0,.3,1); }
  .m3tlb-btn.is-on .m3tlb-arrow, .m3tlb-btn:focus-visible .m3tlb-arrow { animation: m3tlb-drop .8s ease; }
  .m3tlb-btn.is-on .m3tlb-heart, .m3tlb-btn:focus-visible .m3tlb-heart { animation: m3tlb-beat .7s ease; }
  .m3tlb-btn.is-on .m3tlb-lens, .m3tlb-btn:focus-visible .m3tlb-lens { animation: m3tlb-scan .9s ease-in-out; }
  .m3tlb-btn.is-on .m3tlb-shackle, .m3tlb-btn:focus-visible .m3tlb-shackle { animation: m3tlb-lift .8s ease; }
  @media (hover: hover) {
    .m3tlb-btn:hover { background: #eef2ee; }
    .m3tlb-btn:hover .m3tlb-bell { animation: m3tlb-swing .9s cubic-bezier(.36,.07,.19,.97); }
    .m3tlb-btn:hover .m3tlb-clap { animation: m3tlb-clap .9s ease; }
    .m3tlb-btn:hover .m3tlb-sync { animation: m3tlb-turn .8s cubic-bezier(.6,0,.3,1); }
    .m3tlb-btn:hover .m3tlb-lid { animation: m3tlb-lid .8s ease; }
    .m3tlb-btn:hover .m3tlb-plane { animation: m3tlb-fly .8s cubic-bezier(.5,0,.3,1); }
    .m3tlb-btn:hover .m3tlb-arrow { animation: m3tlb-drop .8s ease; }
    .m3tlb-btn:hover .m3tlb-heart { animation: m3tlb-beat .7s ease; }
    .m3tlb-btn:hover .m3tlb-lens { animation: m3tlb-scan .9s ease-in-out; }
    .m3tlb-btn:hover .m3tlb-shackle { animation: m3tlb-lift .8s ease; }
  }
  @keyframes m3tlb-swing { 0%,100% { transform: rotate(0); } 20% { transform: rotate(14deg); } 40% { transform: rotate(-10deg); } 60% { transform: rotate(6deg); } 80% { transform: rotate(-3deg); } }
  @keyframes m3tlb-clap { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-1.6px); } 45% { transform: translateX(1.4px); } 65% { transform: translateX(-.8px); } }
  @keyframes m3tlb-turn { from { transform: rotate(0); } to { transform: rotate(180deg); } }
  @keyframes m3tlb-lid { 0%,100% { transform: none; } 40%,60% { transform: translateY(-2px) rotate(-16deg); } }
  @keyframes m3tlb-fly { 0% { transform: none; opacity: 1; } 45% { transform: translate(7px,-7px); opacity: 0; } 46% { transform: translate(-6px,6px); opacity: 0; } 100% { transform: none; opacity: 1; } }
  @keyframes m3tlb-drop { 0%,100% { transform: none; } 35% { transform: translateY(3px); } 55% { transform: translateY(-1px); } 75% { transform: translateY(1.5px); } }
  @keyframes m3tlb-beat { 0%,100% { transform: scale(1); } 30% { transform: scale(1.16); } 55% { transform: scale(.96); } 75% { transform: scale(1.05); } }
  @keyframes m3tlb-scan { 0%,100% { transform: none; } 30% { transform: translate(-1.5px,-1px) rotate(-8deg); } 65% { transform: translate(1.5px,-1px) rotate(8deg); } }
  @keyframes m3tlb-lift { 0%,100% { transform: none; } 35%,65% { transform: translateY(-2.5px); } }
  .m3tlb[data-off] * { animation-play-state: paused !important; }
  @media (max-width: 640px) { .m3tlb-bar { grid-template-columns: repeat(4, 1fr); } .m3tlb-card { padding: 22px 16px; } }
  @media (prefers-reduced-motion: reduce) { .m3tlb * { animation: none !important; } }
`;

export default function DocumentToolbarIconsThatAnimate() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const STEP = 1100; // idle demo: one icon every 1.1 s until a person arrives
    const HOLD = 1050; // how long a tapped icon stays highlighted
    const btns = Array.from(root.querySelectorAll<HTMLButtonElement>(".m3tlb-btn"));
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = new Map<HTMLButtonElement, number>();
    let i = 0, interval = 0, seen = true;
    const flash = (b: HTMLButtonElement) => {
      b.classList.remove("is-on");
      void b.offsetWidth; // restart the keyframes
      b.classList.add("is-on");
      window.clearTimeout(timers.get(b));
      timers.set(b, window.setTimeout(() => b.classList.remove("is-on"), HOLD));
    };
    const stopIdle = () => { window.clearInterval(interval); interval = 0; };
    const onClick = (e: Event) => {
      const b = (e.target as Element).closest<HTMLButtonElement>(".m3tlb-btn");
      if (!b) return;
      stopIdle();
      if (b.hasAttribute("aria-pressed")) b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
      flash(b);
    };
    const onEnter = (e: PointerEvent) => { if (e.pointerType === "mouse") stopIdle(); };
    const tick = () => { if (seen && !document.hidden) { flash(btns[i]); i = (i + 1) % btns.length; } };
    root.addEventListener("click", onClick);
    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("focusin", stopIdle);
    // Pauses CSS motion and the demo while the toolbar is off screen.
    const io = new IntersectionObserver(([en]) => {
      seen = en.isIntersecting;
      if (seen) root.removeAttribute("data-off"); else root.setAttribute("data-off", "");
    });
    io.observe(root);
    const first = calm ? 0 : window.setTimeout(tick, 250);
    if (!calm) interval = window.setInterval(tick, STEP);
    return () => {
      stopIdle();
      window.clearTimeout(first);
      timers.forEach((t) => window.clearTimeout(t));
      io.disconnect();
      root.removeEventListener("click", onClick);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("focusin", stopIdle);
    };
  }, []);

  return (
    <>
      <style>{css}</style>
      <section ref={ref} className="m3tlb" aria-labelledby="m3tlb-h">
        <div className="m3tlb-card">
          <div className="m3tlb-head">
            <div>
              <p className="m3tlb-kicker">Fernway Studio</p>
              <h2 className="m3tlb-title" id="m3tlb-h">Spring catalogue, draft 3</h2>
            </div>
            <p className="m3tlb-meta">Edited by Ines Calder</p>
          </div>
          <div className="m3tlb-bar" role="toolbar" aria-label="Document actions">
            <button className="m3tlb-btn" type="button" data-a="bell">
              <span className="m3tlb-tile"><svg className="m3tlb-ic" viewBox="0 0 24 24" aria-hidden="true"><g className="m3tlb-bell"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path className="m3tlb-clap" d="M10 20.5a2 2 0 0 0 4 0"/></g></svg></span>
              <span>Alerts</span>
            </button>
            <button className="m3tlb-btn" type="button" data-a="sync">
              <span className="m3tlb-tile"><svg className="m3tlb-ic" viewBox="0 0 24 24" aria-hidden="true"><g className="m3tlb-sync"><path d="M19.5 12a7.5 7.5 0 0 1-13.4 4.6"/><path d="M4.5 12a7.5 7.5 0 0 1 13.4-4.6"/><path d="M18.4 3.8v3.9h-3.9"/><path d="M5.6 20.2v-3.9h3.9"/></g></svg></span>
              <span>Sync</span>
            </button>
            <button className="m3tlb-btn" type="button" data-a="trash">
              <span className="m3tlb-tile"><svg className="m3tlb-ic" viewBox="0 0 24 24" aria-hidden="true"><g className="m3tlb-lid"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/></g><path d="M6.5 7l.9 12.5h9.2l.9-12.5"/><path d="M10.2 11v5.5M13.8 11v5.5"/></svg></span>
              <span>Delete</span>
            </button>
            <button className="m3tlb-btn" type="button" data-a="send">
              <span className="m3tlb-tile"><svg className="m3tlb-ic" viewBox="0 0 24 24" aria-hidden="true"><g className="m3tlb-plane"><path d="M20.5 3.5L10 14"/><path d="M20.5 3.5l-6.6 17-3.9-6.5-6.5-3.9z"/></g></svg></span>
              <span>Send</span>
            </button>
            <button className="m3tlb-btn" type="button" data-a="down">
              <span className="m3tlb-tile"><svg className="m3tlb-ic" viewBox="0 0 24 24" aria-hidden="true"><g className="m3tlb-arrow"><path d="M12 3.5v11"/><path d="M7.5 10l4.5 4.5 4.5-4.5"/></g><path d="M5 19.5h14"/></svg></span>
              <span>Download</span>
            </button>
            <button className="m3tlb-btn" type="button" data-a="heart" aria-pressed="false">
              <span className="m3tlb-tile"><svg className="m3tlb-ic" viewBox="0 0 24 24" aria-hidden="true"><g className="m3tlb-heart"><path className="m3tlb-fill" d="M12 19.5s-7-4.3-7-9.6A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.3c0 5.3-7 9.6-7 9.6z"/><path d="M12 19.5s-7-4.3-7-9.6A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.3c0 5.3-7 9.6-7 9.6z"/></g></svg></span>
              <span>Favourite</span>
            </button>
            <button className="m3tlb-btn" type="button" data-a="find">
              <span className="m3tlb-tile"><svg className="m3tlb-ic" viewBox="0 0 24 24" aria-hidden="true"><g className="m3tlb-lens"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l4.5 4.5"/></g></svg></span>
              <span>Search</span>
            </button>
            <button className="m3tlb-btn" type="button" data-a="lock">
              <span className="m3tlb-tile"><svg className="m3tlb-ic" viewBox="0 0 24 24" aria-hidden="true"><path className="m3tlb-shackle" d="M8 11V8a4 4 0 0 1 8 0v3"/><rect x="5" y="11" width="14" height="9.5" rx="2.2"/><path d="M12 14.8v2"/></svg></span>
              <span>Lock</span>
            </button>
          </div>
          <p className="m3tlb-foot">Hover, focus or tap an action to see its icon move.</p>
        </div>
      </section>
    </>
  );
}

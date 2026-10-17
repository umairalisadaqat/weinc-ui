import { useEffect, useRef, type CSSProperties } from "react";

/* Styles shared with the HTML version; class and keyframe names are prefixed so several pieces can share a page. */
const css = `
  /* Change these: page, card, ink, accent (ticked boxes), gap between ticks during the entrance. */
  .m3tsk { --m3tsk-bg: #e7ece6; --m3tsk-card: #fcfdfb; --m3tsk-ink: #1d2a22; --m3tsk-accent: #2c5e45; --m3tsk-gap: .22s; }
  .m3tsk { background: var(--m3tsk-bg); padding: 64px 16px; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; color: var(--m3tsk-ink); }
  .m3tsk-card { max-width: 480px; margin: 0 auto; background: var(--m3tsk-card); border: 1px solid #dbe3db; border-radius: 20px; padding: 26px 24px 22px; box-shadow: 0 1px 2px rgba(29,42,34,.05), 0 22px 44px -28px rgba(29,42,34,.38); }
  .m3tsk-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .m3tsk-kicker { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--m3tsk-accent); }
  .m3tsk-title { margin: 6px 0 0; font-size: 22px; font-weight: 600; letter-spacing: -.01em; }
  .m3tsk-replay { min-height: 40px; padding: 0 14px; border: 1px solid #d3ddd4; border-radius: 999px; background: #fff; color: #3b4a40; font: inherit; font-size: 13px; cursor: pointer; }
  .m3tsk-list { list-style: none; margin: 18px 0 0; padding: 0; }
  .m3tsk-list li + li { border-top: 1px solid #edf1ec; }
  .m3tsk-row { position: relative; display: flex; align-items: center; gap: 14px; min-height: 56px; cursor: pointer; }
  .m3tsk-row input { position: absolute; opacity: 0; width: 1px; height: 1px; }
  .m3tsk-box { flex: none; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 8px; border: 1.75px solid #9aa89e; background: #fff; position: relative; overflow: hidden; }
  .m3tsk-box::before { content: ""; position: absolute; inset: 0; background: var(--m3tsk-accent); opacity: 0; transform: scale(.4); border-radius: 6px; transition: opacity .25s ease, transform .3s cubic-bezier(.2,.8,.3,1); }
  .m3tsk-box svg { position: relative; width: 20px; height: 20px; fill: none; stroke: #fff; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
  .m3tsk-tick { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset .3s ease-out .08s; }
  .m3tsk-row input:checked + .m3tsk-box { border-color: var(--m3tsk-accent); }
  .m3tsk-row input:checked + .m3tsk-box::before { opacity: 1; transform: none; }
  .m3tsk-row input:checked + .m3tsk-box .m3tsk-tick { stroke-dashoffset: 0; }
  .m3tsk-row input:focus-visible + .m3tsk-box { outline: 2px solid var(--m3tsk-accent); outline-offset: 3px; }
  .m3tsk-replay:focus-visible { outline: 2px solid var(--m3tsk-accent); outline-offset: 3px; }
  .m3tsk-label { position: relative; flex: 0 1 auto; font-size: 15.5px; transition: color .3s ease; }
  .m3tsk-label::after { content: ""; position: absolute; left: 0; top: 52%; width: 100%; height: 1.5px; background: currentColor; transform: scaleX(0); transform-origin: 0 50%; transition: transform .35s ease .1s; }
  .m3tsk-row input:checked ~ .m3tsk-label { color: #56645a; }
  .m3tsk-row input:checked ~ .m3tsk-label::after { transform: scaleX(1); }
  .m3tsk-time { margin-left: auto; font-size: 13px; color: #56645a; font-variant-numeric: tabular-nums; }
  .m3tsk-done { margin: 14px 0 0; padding: 12px 14px; border-radius: 12px; background: #e9f1eb; color: var(--m3tsk-accent); font-size: 14.5px; font-weight: 600; transition: opacity .3s ease; }
  /* Entrance: the boxes fill and tick one after another, then the summary appears. */
  .m3tsk[data-play] .m3tsk-box::before { animation: m3tsk-fill .3s calc(var(--i) * var(--m3tsk-gap) + .15s) cubic-bezier(.2,.8,.3,1) both; }
  .m3tsk[data-play] .m3tsk-tick { animation: m3tsk-draw .3s calc(var(--i) * var(--m3tsk-gap) + .3s) ease-out both; }
  .m3tsk[data-play] .m3tsk-label::after { animation: m3tsk-strike .35s calc(var(--i) * var(--m3tsk-gap) + .35s) ease both; }
  .m3tsk[data-play] .m3tsk-done { animation: m3tsk-rise .4s 1.2s ease-out both; }
  @keyframes m3tsk-fill { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: none; } }
  @keyframes m3tsk-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
  @keyframes m3tsk-strike { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes m3tsk-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .m3tsk * { animation: none !important; transition: none !important; } .m3tsk *::before, .m3tsk *::after { animation: none !important; transition: none !important; } }
`;

export default function OpeningChecklistThatTicksOff() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    // Plays once when the list comes into view of its nearest scroller; ticking a box by hand updates the summary.
    const boxes = Array.from(root.querySelectorAll<HTMLInputElement>("input"));
    const done = root.querySelector<HTMLElement>(".m3tsk-done")!;
    let t = 0;
    const count = () => {
      const n = boxes.filter((b) => b.checked).length;
      done.textContent = n === boxes.length ? `All ${n} tasks done` : `${n} of ${boxes.length} tasks done`;
    };
    const play = () => {
      boxes.forEach((b) => { b.checked = true; });
      count();
      root.removeAttribute("data-play");
      void root.offsetWidth; // restart the keyframes
      root.setAttribute("data-play", "");
      window.clearTimeout(t);
      t = window.setTimeout(() => root.removeAttribute("data-play"), 1700);
    };
    const onChange = () => { root.removeAttribute("data-play"); count(); };
    boxes.forEach((b) => b.addEventListener("change", onChange));
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { play(); io.disconnect(); }
    });
    io.observe(root);
    const replay = root.querySelector(".m3tsk-replay")!;
    replay.addEventListener("click", play);
    return () => {
      window.clearTimeout(t);
      io.disconnect();
      boxes.forEach((b) => b.removeEventListener("change", onChange));
      replay.removeEventListener("click", play);
    };
  }, []);

  return (
    <>
      <style>{css}</style>
      <section ref={ref} className="m3tsk" aria-labelledby="m3tsk-h">
        <div className="m3tsk-card">
          <div className="m3tsk-head">
            <div>
              <p className="m3tsk-kicker">Hollis Street Cafe</p>
              <h2 className="m3tsk-title" id="m3tsk-h">Opening checklist</h2>
            </div>
            <button className="m3tsk-replay" type="button">Replay</button>
          </div>
          <ul className="m3tsk-list">
            <li style={{ "--i": "0" } as CSSProperties}><label className="m3tsk-row" htmlFor="m3tsk-c1"><input id="m3tsk-c1" type="checkbox" defaultChecked /><span className="m3tsk-box" aria-hidden="true"><svg viewBox="0 0 24 24"><path className="m3tsk-tick" pathLength={1} d="M6.5 12.5l3.6 3.6 7.4-7.6"/></svg></span><span className="m3tsk-label">Grinder calibrated</span><span className="m3tsk-time">6:42</span></label></li>
            <li style={{ "--i": "1" } as CSSProperties}><label className="m3tsk-row" htmlFor="m3tsk-c2"><input id="m3tsk-c2" type="checkbox" defaultChecked /><span className="m3tsk-box" aria-hidden="true"><svg viewBox="0 0 24 24"><path className="m3tsk-tick" pathLength={1} d="M6.5 12.5l3.6 3.6 7.4-7.6"/></svg></span><span className="m3tsk-label">Pastry case filled</span><span className="m3tsk-time">6:50</span></label></li>
            <li style={{ "--i": "2" } as CSSProperties}><label className="m3tsk-row" htmlFor="m3tsk-c3"><input id="m3tsk-c3" type="checkbox" defaultChecked /><span className="m3tsk-box" aria-hidden="true"><svg viewBox="0 0 24 24"><path className="m3tsk-tick" pathLength={1} d="M6.5 12.5l3.6 3.6 7.4-7.6"/></svg></span><span className="m3tsk-label">Milk delivery checked</span><span className="m3tsk-time">6:55</span></label></li>
            <li style={{ "--i": "3" } as CSSProperties}><label className="m3tsk-row" htmlFor="m3tsk-c4"><input id="m3tsk-c4" type="checkbox" defaultChecked /><span className="m3tsk-box" aria-hidden="true"><svg viewBox="0 0 24 24"><path className="m3tsk-tick" pathLength={1} d="M6.5 12.5l3.6 3.6 7.4-7.6"/></svg></span><span className="m3tsk-label">Front door unlocked</span><span className="m3tsk-time">7:00</span></label></li>
          </ul>
          <p className="m3tsk-done" role="status">All 4 tasks done</p>
        </div>
      </section>
    </>
  );
}

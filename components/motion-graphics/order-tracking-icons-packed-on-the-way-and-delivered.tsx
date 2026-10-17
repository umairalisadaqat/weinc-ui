import { useEffect, useRef, type CSSProperties } from "react";

/* Styles shared with the HTML version; class and keyframe names are prefixed so several pieces can share a page. */
const css = `
  /* Change these: page, card, ink, accent (done steps and connectors). The step delays are the --d values in the markup. */
  .m3trk { --m3trk-bg: #ede6dc; --m3trk-card: #fffcf7; --m3trk-ink: #26211c; --m3trk-accent: #3d6650; }
  .m3trk { background: var(--m3trk-bg); padding: 64px 16px; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; color: var(--m3trk-ink); }
  .m3trk-card { max-width: 640px; margin: 0 auto; background: var(--m3trk-card); border: 1px solid #e4dbcf; border-radius: 20px; padding: 28px; box-shadow: 0 1px 2px rgba(38,33,28,.05), 0 22px 44px -28px rgba(38,33,28,.4); }
  .m3trk-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .m3trk-kicker { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: #5f564c; }
  .m3trk-title { margin: 6px 0 0; font-size: 22px; font-weight: 600; letter-spacing: -.01em; }
  .m3trk-replay { flex: none; min-height: 40px; padding: 0 14px; border: 1px solid #ddd2c4; border-radius: 999px; background: #fff; color: #4a4239; font: inherit; font-size: 13px; cursor: pointer; }
  .m3trk-replay:focus-visible { outline: 2px solid var(--m3trk-accent); outline-offset: 3px; }
  .m3trk-steps { list-style: none; margin: 28px 0 0; padding: 0; display: flex; align-items: flex-start; }
  .m3trk-step { flex: none; width: 104px; display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
  .m3trk-tile { display: grid; place-items: center; width: 56px; height: 56px; margin-bottom: 8px; border-radius: 16px; background: #e9f0eb; color: var(--m3trk-accent); }
  .m3trk-ic { width: 28px; height: 28px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; overflow: visible; }
  .m3trk-ic * { transform-box: fill-box; transform-origin: 50% 50%; }
  .m3trk-tick { stroke-dasharray: 1; stroke-dashoffset: 0; }
  .m3trk-speed { opacity: 0; }
  .m3trk-name { font-size: 14.5px; font-weight: 600; }
  .m3trk-when { font-size: 13px; color: #625a50; font-variant-numeric: tabular-nums; }
  .m3trk-line { flex: 1; height: 2px; margin-top: 27px; border-radius: 2px; background: #e2d9cc; overflow: hidden; }
  .m3trk-line span { display: block; height: 100%; background: var(--m3trk-accent); transform-origin: 0 50%; }
  .m3trk-foot { margin: 24px 0 0; padding-top: 16px; border-top: 1px solid #efe8de; font-size: 14px; color: #5f564c; }
  /* Entrance, step by step: the lid closes, the line fills, the van pulls in, the line fills, the check draws. */
  .m3trk[data-play] .m3trk-tile { animation: m3trk-tile .4s var(--d) ease-out both; }
  .m3trk[data-play] .m3trk-lid { animation: m3trk-lid .45s calc(var(--d) + .1s) cubic-bezier(.3,.7,.3,1) both; }
  .m3trk[data-play] .m3trk-line span { animation: m3trk-fill .35s var(--d) ease-in-out both; }
  .m3trk[data-play] .m3trk-van { animation: m3trk-van .5s calc(var(--d) + .05s) cubic-bezier(.2,.8,.3,1) both; }
  .m3trk[data-play] .m3trk-speed { animation: m3trk-speed .5s calc(var(--d) + .05s) ease-out both; }
  .m3trk[data-play] .m3trk-tick { animation: m3trk-draw .35s calc(var(--d) + .2s) ease-out both; }
  @keyframes m3trk-tile { from { opacity: .35; transform: scale(.88); } to { opacity: 1; transform: none; } }
  @keyframes m3trk-lid { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
  @keyframes m3trk-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes m3trk-van { from { opacity: 0; transform: translateX(-7px); } to { opacity: 1; transform: none; } }
  @keyframes m3trk-speed { 0% { opacity: 0; } 40% { opacity: 1; } 100% { opacity: 0; } }
  @keyframes m3trk-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
  @media (max-width: 520px) {
    .m3trk-card { padding: 22px 16px; }
    .m3trk-step { width: 84px; }
    .m3trk-tile { width: 48px; height: 48px; }
    .m3trk-line { margin-top: 23px; }
  }
  @media (prefers-reduced-motion: reduce) { .m3trk * { animation: none !important; } }
`;

export default function OrderTrackingIconsPackedOnTheWayDelivered() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    // Plays once when the piece first enters the view of its nearest scroller; Replay plays it again.
    const play = () => {
      root.removeAttribute("data-play");
      void root.offsetWidth; // restart the keyframes
      root.setAttribute("data-play", "");
    };
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { play(); io.disconnect(); }
    });
    io.observe(root);
    const replay = root.querySelector(".m3trk-replay");
    replay?.addEventListener("click", play);
    return () => {
      io.disconnect();
      replay?.removeEventListener("click", play);
    };
  }, []);

  return (
    <>
      <style>{css}</style>
      <section ref={ref} className="m3trk" aria-labelledby="m3trk-h">
        <div className="m3trk-card">
          <div className="m3trk-head">
            <div>
              <p className="m3trk-kicker">Fernhill Tea Co. order 4471</p>
              <h2 className="m3trk-title" id="m3trk-h" role="status">Delivered today at 14:20</h2>
            </div>
            <button className="m3trk-replay" type="button">Replay</button>
          </div>
          <ol className="m3trk-steps">
            <li className="m3trk-step" style={{ "--d": "0s" } as CSSProperties}>
              <span className="m3trk-tile"><svg className="m3trk-ic" viewBox="0 0 24 24" aria-hidden="true"><path className="m3trk-box" d="M4 9.5h16v9.8a1.2 1.2 0 0 1-1.2 1.2H5.2A1.2 1.2 0 0 1 4 19.3z"/><g className="m3trk-lid"><path d="M4 9.5l2.2-5h11.6L20 9.5"/><path d="M12 4.5v5"/></g><path d="M8 16.5h3"/></svg></span>
              <span className="m3trk-name">Packed</span><span className="m3trk-when">Mon 09:10</span>
            </li>
            <li className="m3trk-line" aria-hidden="true" style={{ "--d": ".45s" } as CSSProperties}><span></span></li>
            <li className="m3trk-step" style={{ "--d": ".75s" } as CSSProperties}>
              <span className="m3trk-tile"><svg className="m3trk-ic" viewBox="0 0 24 24" aria-hidden="true"><g className="m3trk-van"><path d="M3.5 6.5h10v10h-10z"/><path d="M13.5 9.5h4l3 3.4v3.6h-7"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></g><path className="m3trk-speed" d="M1 10h-.5M1.5 13H0"/></svg></span>
              <span className="m3trk-name">On the way</span><span className="m3trk-when">Tue 07:45</span>
            </li>
            <li className="m3trk-line" aria-hidden="true" style={{ "--d": "1.15s" } as CSSProperties}><span></span></li>
            <li className="m3trk-step" style={{ "--d": "1.4s" } as CSSProperties}>
              <span className="m3trk-tile"><svg className="m3trk-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 11L12 4.5l8.5 6.5"/><path d="M6 9.5v10.5h12V9.5"/><path className="m3trk-tick" pathLength={1} d="M9.2 14.6l2 2 3.8-3.9"/></svg></span>
              <span className="m3trk-name">Delivered</span><span className="m3trk-when">Tue 14:20</span>
            </li>
          </ol>
          <p className="m3trk-foot">Left in the porch, signed for by R. Amadi.</p>
        </div>
      </section>
    </>
  );
}

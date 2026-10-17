import { useEffect, useRef } from "react";

/* Styles shared with the HTML version; class and keyframe names are prefixed so several pieces can share a page. */
const css = `
  /* Change these: page colour, card, ink, accent (badge and envelope edge), speed of the whole sequence. */
  .m3env { --m3env-bg: #f1e7da; --m3env-card: #fffaf3; --m3env-ink: #2a1f19; --m3env-accent: #a8482a; --m3env-time: 1; }
  .m3env { background: var(--m3env-bg); padding: 64px 16px; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; color: var(--m3env-ink); }
  .m3env-card { max-width: 480px; margin: 0 auto; background: var(--m3env-card); border: 1px solid #eadccb; border-radius: 22px; padding: 36px 30px 28px; text-align: center; box-shadow: 0 1px 2px rgba(42,31,25,.05), 0 26px 50px -30px rgba(42,31,25,.42); }
  .m3env-svg { display: block; width: 112px; height: 112px; margin: 0 auto; overflow: visible; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .m3env-svg * { transform-box: fill-box; transform-origin: 50% 50%; }
  .m3env-paper { fill: #fff; stroke: #c9b7a3; stroke-width: 1.5; transform: translateY(15px); }
  .m3env-lines { stroke: #d8c8b6; stroke-width: 1.5; transform: translateY(15px); }
  .m3env-body { fill: #f7ecdf; stroke: var(--m3env-ink); stroke-width: 2; }
  .m3env-fold { stroke: #c9b7a3; stroke-width: 1.5; }
  .m3env-flap { stroke: var(--m3env-ink); stroke-width: 2; transform-origin: 50% 0; }
  .m3env-badge circle { fill: var(--m3env-accent); stroke: var(--m3env-card); stroke-width: 2.5; }
  .m3env-tick { stroke: #fff; stroke-width: 2.4; stroke-dasharray: 1; stroke-dashoffset: 0; }
  .m3env-title { margin: 16px 0 0; font-size: 26px; font-weight: 600; letter-spacing: -.015em; }
  .m3env-sub { margin: 8px auto 0; max-width: 36ch; font-size: 15px; line-height: 1.55; color: #5e5047; }
  .m3env-sum { margin: 22px 0 0; padding: 14px 16px; border-radius: 14px; background: #f6eee4; text-align: left; }
  .m3env-sum div { display: grid; grid-template-columns: 76px 1fr; gap: 10px; padding: 5px 0; font-size: 14px; }
  .m3env-sum dt { color: #6a5b50; }
  .m3env-sum dd { margin: 0; font-weight: 600; overflow-wrap: anywhere; }
  .m3env-actions { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px 12px; margin-top: 22px; }
  .m3env-btn { display: inline-flex; align-items: center; min-height: 44px; padding: 0 22px; border-radius: 999px; background: var(--m3env-ink); color: #fff; font-size: 15px; font-weight: 600; text-decoration: none; }
  .m3env-replay { min-height: 44px; padding: 0 12px; border: 0; background: none; color: #6a5b50; font: inherit; font-size: 13.5px; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
  .m3env-btn:focus-visible, .m3env-replay:focus-visible { outline: 2px solid var(--m3env-accent); outline-offset: 3px; }
  /* The sequence: letter slides in, flap folds shut, envelope settles, badge and check arrive. Done by about 1.5 s. */
  .m3env[data-play] .m3env-paper, .m3env[data-play] .m3env-lines { animation: m3env-in calc(.5s * var(--m3env-time)) cubic-bezier(.55,0,.3,1) both; }
  .m3env[data-play] .m3env-flap { animation: m3env-shut calc(.45s * var(--m3env-time)) calc(.45s * var(--m3env-time)) cubic-bezier(.55,0,.3,1) both; }
  .m3env[data-play] .m3env-svg { animation: m3env-settle calc(.5s * var(--m3env-time)) calc(.8s * var(--m3env-time)) ease-out both; }
  .m3env[data-play] .m3env-badge { animation: m3env-pop calc(.35s * var(--m3env-time)) calc(.95s * var(--m3env-time)) cubic-bezier(.2,.8,.3,1) both; }
  .m3env[data-play] .m3env-tick { animation: m3env-draw calc(.3s * var(--m3env-time)) calc(1.15s * var(--m3env-time)) ease-out both; }
  .m3env[data-play] .m3env-card > :not(svg) { animation: m3env-rise calc(.45s * var(--m3env-time)) calc(1s * var(--m3env-time)) ease-out both; }
  @keyframes m3env-in { from { transform: translateY(-4px); } to { transform: translateY(15px); } }
  @keyframes m3env-shut { from { transform: scaleY(-1); } to { transform: scaleY(1); } }
  @keyframes m3env-settle { 0% { transform: none; } 45% { transform: translateY(-3px); } 100% { transform: none; } }
  @keyframes m3env-pop { from { opacity: 0; transform: scale(.5); } to { opacity: 1; transform: scale(1); } }
  @keyframes m3env-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
  @keyframes m3env-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @media (max-width: 480px) { .m3env-card { padding: 30px 18px 22px; } }
  @media (prefers-reduced-motion: reduce) { .m3env * { animation: none !important; } }
`;

export default function FormSentEnvelopeThatSeals() {
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
    const replay = root.querySelector(".m3env-replay");
    replay?.addEventListener("click", play);
    return () => {
      io.disconnect();
      replay?.removeEventListener("click", play);
    };
  }, []);

  return (
    <>
      <style>{css}</style>
      <section ref={ref} className="m3env" aria-labelledby="m3env-h">
        <div className="m3env-card">
          <svg className="m3env-svg" viewBox="0 0 64 64" aria-hidden="true">
            <rect className="m3env-paper" x="15" y="8" width="34" height="26" rx="2.5"/>
            <path className="m3env-lines" d="M21 15h22M21 20.5h16"/>
            <rect className="m3env-body" x="8" y="22" width="48" height="32" rx="4.5"/>
            <path className="m3env-fold" d="M8.8 52.5l17.5-13M55.2 52.5l-17.5-13"/>
            <path className="m3env-flap" d="M9.5 23.5L32 40l22.5-16.5"/>
            <g className="m3env-badge"><circle cx="53" cy="50" r="9.5"/><path className="m3env-tick" pathLength={1} d="M48.8 50.2l2.9 2.9 5.4-5.6"/></g>
          </svg>
          <h2 className="m3env-title" id="m3env-h" role="status">Message sent</h2>
          <p className="m3env-sub">Thanks, Leo. Your note is with Saltmarsh Ceramics, and Mara replies from the studio inbox.</p>
          <dl className="m3env-sum">
            <div><dt>Subject</dt><dd>A set of six bowls in sea glaze</dd></div>
            <div><dt>Reply to</dt><dd>leo.hart@example.com</dd></div>
          </dl>
          <div className="m3env-actions">
            <a className="m3env-btn" href="#">Write another message</a>
            <button className="m3env-replay" type="button">Replay</button>
          </div>
        </div>
      </section>
    </>
  );
}

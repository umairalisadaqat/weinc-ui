import { useEffect, useRef } from "react";

/* Styles shared with the HTML version; class and keyframe names are prefixed so several pieces can share a page. */
const css = `
  /* Change these: page colour, card, ink, accent (circle and check), total length of the entrance. */
  .m3pay { --m3pay-bg: #efe9df; --m3pay-card: #fffdf9; --m3pay-ink: #22201c; --m3pay-accent: #2d6b4f; --m3pay-time: 1; }
  .m3pay { background: var(--m3pay-bg); padding: 64px 16px; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; color: var(--m3pay-ink); }
  .m3pay-card { max-width: 460px; margin: 0 auto; background: var(--m3pay-card); border: 1px solid #e6dfd2; border-radius: 22px; padding: 36px 32px 30px; text-align: center; box-shadow: 0 1px 2px rgba(34,32,28,.05), 0 26px 50px -30px rgba(34,32,28,.4); }
  .m3pay-svg { display: block; margin: 0 auto; width: 104px; height: 104px; overflow: visible; }
  .m3pay-svg * { transform-box: fill-box; transform-origin: 50% 50%; }
  .m3pay-halo { fill: var(--m3pay-accent); opacity: .08; }
  .m3pay-disc { fill: var(--m3pay-accent); opacity: .12; }
  .m3pay-ring { fill: none; stroke: var(--m3pay-accent); stroke-width: 3; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 0; transform: rotate(-90deg); }
  .m3pay-check { fill: none; stroke: var(--m3pay-accent); stroke-width: 4.5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 0; }
  .m3pay-title { margin: 18px 0 0; font-size: 26px; font-weight: 600; letter-spacing: -.015em; }
  .m3pay-sub { margin: 8px auto 0; max-width: 34ch; font-size: 15px; line-height: 1.55; color: #57524a; }
  .m3pay-rows { margin: 24px 0 0; padding: 4px 0; border-top: 1px solid #ece6db; border-bottom: 1px solid #ece6db; text-align: left; }
  .m3pay-rows div { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; font-size: 14.5px; }
  .m3pay-rows dt { color: #5f594f; }
  .m3pay-rows dd { margin: 0; font-weight: 600; font-variant-numeric: tabular-nums; }
  .m3pay-actions { display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 24px; }
  .m3pay-btn { display: inline-flex; align-items: center; min-height: 44px; padding: 0 22px; border-radius: 999px; background: var(--m3pay-ink); color: #fff; font-size: 15px; font-weight: 600; text-decoration: none; }
  .m3pay-replay { min-height: 44px; padding: 0 14px; border: 0; background: none; color: #5f594f; font: inherit; font-size: 13.5px; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
  .m3pay-btn:focus-visible, .m3pay-replay:focus-visible { outline: 2px solid var(--m3pay-accent); outline-offset: 3px; }
  /* The entrance: ring draws, disc settles, check draws, words rise. Ends by about 1.4 s. */
  .m3pay[data-play] .m3pay-ring { animation: m3pay-draw calc(.6s * var(--m3pay-time)) cubic-bezier(.65,0,.35,1) both; }
  .m3pay[data-play] .m3pay-disc { animation: m3pay-settle calc(.5s * var(--m3pay-time)) calc(.35s * var(--m3pay-time)) ease-out both; }
  .m3pay[data-play] .m3pay-check { animation: m3pay-draw calc(.4s * var(--m3pay-time)) calc(.55s * var(--m3pay-time)) cubic-bezier(.65,0,.35,1) both; }
  .m3pay[data-play] .m3pay-halo { animation: m3pay-halo calc(.9s * var(--m3pay-time)) calc(.7s * var(--m3pay-time)) ease-out both; }
  .m3pay[data-play] .m3pay-copy > * { animation: m3pay-rise calc(.5s * var(--m3pay-time)) ease-out both; }
  .m3pay[data-play] .m3pay-copy > :nth-child(1) { animation-delay: calc(.6s * var(--m3pay-time)); }
  .m3pay[data-play] .m3pay-copy > :nth-child(2) { animation-delay: calc(.7s * var(--m3pay-time)); }
  .m3pay[data-play] .m3pay-copy > :nth-child(3) { animation-delay: calc(.8s * var(--m3pay-time)); }
  .m3pay[data-play] .m3pay-copy > :nth-child(4) { animation-delay: calc(.9s * var(--m3pay-time)); }
  @keyframes m3pay-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
  @keyframes m3pay-settle { from { opacity: 0; transform: scale(.7); } to { opacity: .12; transform: scale(1); } }
  @keyframes m3pay-halo { 0% { opacity: 0; transform: scale(.8); } 50% { opacity: .14; } 100% { opacity: .08; transform: scale(1); } }
  @keyframes m3pay-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @media (max-width: 480px) { .m3pay-card { padding: 30px 20px 24px; } }
  @media (prefers-reduced-motion: reduce) { .m3pay * { animation: none !important; } }
`;

export default function PaymentReceivedCheckmarkInCircle() {
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
    const replay = root.querySelector(".m3pay-replay");
    replay?.addEventListener("click", play);
    return () => {
      io.disconnect();
      replay?.removeEventListener("click", play);
    };
  }, []);

  return (
    <>
      <style>{css}</style>
      <section ref={ref} className="m3pay" aria-labelledby="m3pay-h">
        <div className="m3pay-card">
          <div className="m3pay-mark">
            <svg className="m3pay-svg" viewBox="0 0 96 96" aria-hidden="true">
              <circle className="m3pay-halo" cx="48" cy="48" r="44"/>
              <circle className="m3pay-disc" cx="48" cy="48" r="34"/>
              <circle className="m3pay-ring" cx="48" cy="48" r="34" pathLength={1}/>
              <path className="m3pay-check" pathLength={1} d="M34 49.5l9.5 9.5L63 38.5"/>
            </svg>
          </div>
          <div className="m3pay-copy">
            <h2 className="m3pay-title" id="m3pay-h" role="status">Payment received</h2>
            <p className="m3pay-sub">Thank you. Alder &amp; Pine Joinery has been told and a receipt is on its way to your inbox.</p>
            <dl className="m3pay-rows">
              <div><dt>Invoice</dt><dd>AP-2087</dd></div>
              <div><dt>Paid on</dt><dd>14 October</dd></div>
              <div><dt>Method</dt><dd>Card ending 4418</dd></div>
            </dl>
            <div className="m3pay-actions">
              <a className="m3pay-btn" href="#">View receipt</a>
              <button className="m3pay-replay" type="button">Replay</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

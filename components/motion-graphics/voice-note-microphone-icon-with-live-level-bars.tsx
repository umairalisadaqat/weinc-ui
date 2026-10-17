import { useEffect, useRef } from "react";

/* Styles shared with the HTML version; class and keyframe names are prefixed so several pieces can share a page. */
const css = `
  /* Change these: page, card, ink, record red, bar colour. */
  .m3mic { --m3mic-bg: #dfe4e8; --m3mic-card: #fbfcfc; --m3mic-ink: #18222c; --m3mic-rec: #c2362b; --m3mic-bar: #3b5a78; }
  .m3mic { background: var(--m3mic-bg); padding: 64px 16px; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; color: var(--m3mic-ink); }
  .m3mic-card { max-width: 520px; margin: 0 auto; background: var(--m3mic-card); border: 1px solid #d5dce2; border-radius: 22px; padding: 28px; box-shadow: 0 1px 2px rgba(24,34,44,.05), 0 22px 44px -28px rgba(24,34,44,.42); }
  .m3mic-kicker { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #4a5866; }
  .m3mic-title { margin: 6px 0 0; font-size: 22px; font-weight: 600; letter-spacing: -.01em; line-height: 1.25; }
  .m3mic-sub { margin: 6px 0 0; font-size: 15px; color: #4f5d6a; }
  .m3mic-panel { display: flex; align-items: center; gap: 16px; margin-top: 22px; padding: 14px 18px 14px 14px; border-radius: 18px; background: #eef2f5; }
  .m3mic-btn { position: relative; flex: none; display: grid; place-items: center; width: 60px; height: 60px; border: 0; border-radius: 999px; background: var(--m3mic-ink); color: #fff; cursor: pointer; transition: background-color .25s ease; }
  .m3mic-btn::before { content: ""; position: absolute; inset: -6px; border-radius: 999px; border: 2px solid var(--m3mic-rec); opacity: 0; transform: scale(.9); transition: opacity .3s ease, transform .3s ease; }
  .m3mic-btn:focus-visible { outline: 2px solid var(--m3mic-ink); outline-offset: 10px; }
  .m3mic-ic { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .m3mic-ic * { transform-box: fill-box; transform-origin: 50% 50%; transition: opacity .25s ease, transform .3s ease; }
  .m3mic-stop { fill: currentColor; stroke: none; opacity: 0; transform: scale(.5); }
  .m3mic-info { flex: none; min-width: 108px; }
  .m3mic-state { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 14.5px; font-weight: 600; }
  .m3mic-dot { width: 8px; height: 8px; border-radius: 99px; background: var(--m3mic-rec); opacity: 0; }
  .m3mic-time { margin: 3px 0 0; font-size: 13.5px; color: #4f5d6a; font-variant-numeric: tabular-nums; }
  .m3mic-bars { flex: 0 1 150px; min-width: 0; height: 44px; margin-left: auto; fill: var(--m3mic-bar); }
  .m3mic-bars rect { transform-box: fill-box; transform-origin: 50% 50%; transform: scaleY(.2); opacity: .4; transition: transform .35s ease, opacity .35s ease; }
  .m3mic-note { margin: 14px 0 0; font-size: 12.5px; color: #56636f; }
  .m3mic-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  /* Recording: mic gives way to a stop square, the ring and dot appear, the bars move out of phase. */
  .m3mic[data-rec] .m3mic-btn { background: var(--m3mic-rec); }
  .m3mic[data-rec] .m3mic-btn::before { opacity: .35; transform: none; animation: m3mic-ring 1.6s ease-in-out infinite; }
  .m3mic[data-rec] .m3mic-mic { opacity: 0; transform: scale(.6); }
  .m3mic[data-rec] .m3mic-stop { opacity: 1; transform: none; }
  .m3mic[data-rec] .m3mic-dot { animation: m3mic-blink 1.2s ease-in-out infinite; }
  .m3mic[data-rec] .m3mic-bars rect { opacity: 1; animation: m3mic-level .9s ease-in-out infinite alternate; }
  .m3mic[data-rec] .m3mic-bars rect:nth-child(2n) { animation-duration: .7s; animation-delay: -.3s; }
  .m3mic[data-rec] .m3mic-bars rect:nth-child(3n) { animation-duration: 1.1s; animation-delay: -.6s; }
  .m3mic[data-rec] .m3mic-bars rect:nth-child(5n) { animation-duration: .8s; animation-delay: -.15s; }
  @keyframes m3mic-level { 0% { transform: scaleY(.4); } 60% { transform: scaleY(1); } 100% { transform: scaleY(.6); } }
  @keyframes m3mic-blink { 0%,100% { opacity: 1; } 50% { opacity: .25; } }
  @keyframes m3mic-ring { 0%,100% { opacity: .35; transform: none; } 50% { opacity: .15; transform: scale(1.06); } }
  .m3mic[data-off] * { animation-play-state: paused !important; }
  .m3mic[data-off] *::before { animation-play-state: paused !important; }
  @media (max-width: 480px) { .m3mic-card { padding: 22px 16px; } .m3mic-panel { gap: 12px; } .m3mic-info { min-width: 96px; } }
  @media (prefers-reduced-motion: reduce) {
    .m3mic *, .m3mic *::before { animation: none !important; transition: none !important; }
    .m3mic[data-rec] .m3mic-bars rect { transform: scaleY(.7); }
    .m3mic[data-rec] .m3mic-dot { opacity: 1; }
  }
`;

export default function VoiceNoteMicrophoneIconWithLevelBars() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    // The interface only: connect your own recorder (getUserMedia + MediaRecorder) inside start() and stop().
    const btn = root.querySelector<HTMLButtonElement>(".m3mic-btn")!;
    const word = root.querySelector<HTMLElement>(".m3mic-word")!;
    const time = root.querySelector<HTMLElement>(".m3mic-time")!;
    const live = root.querySelector<HTMLElement>(".m3mic-live")!;
    let secs = 0, tick = 0, seen = true;
    const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    const start = (say: boolean) => {
      root.setAttribute("data-rec", "");
      btn.setAttribute("aria-pressed", "true");
      btn.setAttribute("aria-label", "Stop recording");
      word.textContent = "Recording";
      secs = 0;
      time.textContent = fmt(0);
      if (say) live.textContent = "Recording started";
      window.clearInterval(tick);
      tick = window.setInterval(() => { if (seen) time.textContent = fmt(++secs); }, 1000);
    };
    const stop = () => {
      root.removeAttribute("data-rec");
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", "Record voice note");
      window.clearInterval(tick);
      word.textContent = "Note ready";
      live.textContent = `Recording stopped at ${fmt(secs)}`;
    };
    // Preview only: starts a silent recording state shortly after load. Remove for real use.
    const demo = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : window.setTimeout(() => start(false), 500);
    const onClick = () => {
      window.clearTimeout(demo);
      if (root.hasAttribute("data-rec")) stop(); else start(true);
    };
    btn.addEventListener("click", onClick);
    // Pauses the bars and the timer while the panel is off screen.
    const io = new IntersectionObserver(([en]) => {
      seen = en.isIntersecting;
      if (seen) root.removeAttribute("data-off"); else root.setAttribute("data-off", "");
    });
    io.observe(root);
    return () => {
      window.clearTimeout(demo);
      window.clearInterval(tick);
      io.disconnect();
      btn.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <>
      <style>{css}</style>
      <section ref={ref} className="m3mic" aria-labelledby="m3mic-h">
        <div className="m3mic-card">
          <p className="m3mic-kicker">Brightwater Lettings</p>
          <h2 className="m3mic-title" id="m3mic-h">Describe the repair in a voice note</h2>
          <p className="m3mic-sub">Say which room, what is wrong and when someone can visit.</p>
          <div className="m3mic-panel">
            <button className="m3mic-btn" type="button" aria-pressed="false" aria-label="Record voice note">
              <svg className="m3mic-ic" viewBox="0 0 24 24" aria-hidden="true">
                <g className="m3mic-mic"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M6 11.5a6 6 0 0 0 12 0"/><path d="M12 17.5v3"/></g>
                <rect className="m3mic-stop" x="7.5" y="7.5" width="9" height="9" rx="2"/>
              </svg>
            </button>
            <div className="m3mic-info">
              <p className="m3mic-state"><span className="m3mic-dot" aria-hidden="true"></span><span className="m3mic-word">Tap to record</span></p>
              <p className="m3mic-time">0:00</p>
            </div>
            <svg className="m3mic-bars" viewBox="0 0 64 24" aria-hidden="true">
              <rect x="1" y="7" width="3" height="10" rx="1.5"/><rect x="9" y="4" width="3" height="16" rx="1.5"/><rect x="17" y="2" width="3" height="20" rx="1.5"/><rect x="25" y="5" width="3" height="14" rx="1.5"/><rect x="33" y="3" width="3" height="18" rx="1.5"/><rect x="41" y="6" width="3" height="12" rx="1.5"/><rect x="49" y="4" width="3" height="16" rx="1.5"/><rect x="57" y="8" width="3" height="8" rx="1.5"/>
            </svg>
          </div>
          <p className="m3mic-note">This demo shows the interface only; it does not use your microphone.</p>
          <p className="m3mic-live" role="status"></p>
        </div>
      </section>
    </>
  );
}

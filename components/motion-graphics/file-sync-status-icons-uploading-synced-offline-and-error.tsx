import { useEffect, useRef } from "react";

/* Styles shared with the HTML version; class and keyframe names are prefixed so several pieces can share a page. */
const css = `
  /* Change these: page, card, and the four state colours. */
  .m3sts { --m3sts-bg: #e9edf1; --m3sts-card: #ffffff; --m3sts-up: #2f5f93; --m3sts-ok: #2b7350; --m3sts-off: #5d6672; --m3sts-err: #b4432c; }
  .m3sts { background: var(--m3sts-bg); padding: 64px 16px; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; color: #1c2430; }
  .m3sts-card { max-width: 620px; margin: 0 auto; background: var(--m3sts-card); border: 1px solid #dde3ea; border-radius: 20px; padding: 26px; box-shadow: 0 1px 2px rgba(28,36,48,.05), 0 22px 44px -28px rgba(28,36,48,.35); }
  .m3sts-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .m3sts-kicker { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #4f5a68; }
  .m3sts-title { margin: 6px 0 0; font-size: 21px; font-weight: 600; letter-spacing: -.01em; }
  .m3sts-replay { min-height: 40px; padding: 0 14px; border: 1px solid #d3dae2; border-radius: 999px; background: #fff; color: #3a4552; font: inherit; font-size: 13px; cursor: pointer; }
  .m3sts-list { list-style: none; margin: 20px 0 0; padding: 0; }
  .m3sts-row { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-top: 1px solid #edf0f4; }
  .m3sts-ic { flex: none; width: 40px; height: 40px; padding: 8px; box-sizing: border-box; border-radius: 12px; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; overflow: visible; }
  .m3sts-ic g, .m3sts-ic path { transform-box: fill-box; transform-origin: 50% 50%; }
  .m3sts-row[data-s="up"] .m3sts-ic { color: var(--m3sts-up); background: #e8eff7; }
  .m3sts-row[data-s="done"] .m3sts-ic, .m3sts-row[data-s="ok"] .m3sts-ic { color: var(--m3sts-ok); background: #e6f2eb; }
  .m3sts-row[data-s="off"] .m3sts-ic { color: var(--m3sts-off); background: #eef0f3; }
  .m3sts-row[data-s="err"] .m3sts-ic { color: var(--m3sts-err); background: #f8e9e5; }
  .m3sts-row[data-s="sync"] .m3sts-ic { color: var(--m3sts-up); background: #e8eff7; }
  .m3sts-ic { transition: color .3s ease, background-color .3s ease; }
  .m3sts-text { flex: 1; min-width: 0; }
  .m3sts-name { margin: 0; font-size: 15px; font-weight: 600; overflow-wrap: anywhere; }
  .m3sts-txt { margin: 3px 0 0; font-size: 13.5px; color: #4f5a68; }
  .m3sts-retry { flex: none; min-height: 40px; padding: 0 16px; border: 0; border-radius: 999px; background: #1c2430; color: #fff; font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: opacity .25s ease; }
  .m3sts-row:not([data-s="err"]) .m3sts-retry { opacity: 0; pointer-events: none; }
  .m3sts-retry:focus-visible, .m3sts-replay:focus-visible { outline: 2px solid var(--m3sts-up); outline-offset: 3px; }
  .m3sts-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  /* Crossfade between the three icons of the retry row. */
  .m3sts-g { opacity: 0; transition: opacity .3s ease; }
  .m3sts-row[data-s="err"] .m3sts-g-err, .m3sts-row[data-s="sync"] .m3sts-g-sync, .m3sts-row[data-s="ok"] .m3sts-g-done { opacity: 1; }
  .m3sts-draw, .m3sts-tick { stroke-dasharray: 1; stroke-dashoffset: 0; }
  /* Motion: the arrow loops only while uploading; the sync arrows turn only while syncing; checks draw once. */
  .m3sts-arrow { animation: m3sts-rise 1.8s ease-in-out infinite; }
  .m3sts-row[data-s="sync"] .m3sts-spin { animation: m3sts-turn 1.1s linear infinite; }
  .m3sts-row[data-s="ok"] .m3sts-tick { animation: m3sts-draw .5s .15s ease-out both; }
  .m3sts[data-in] .m3sts-draw { animation: m3sts-draw .6s .2s ease-out both; }
  .m3sts[data-in] .m3sts-late { animation-delay: .45s; }
  .m3sts[data-in] .m3sts-row[data-s="err"] .m3sts-g-err { animation: m3sts-nudge .5s .7s ease-in-out both; }
  @keyframes m3sts-rise { 0% { transform: translateY(2px); opacity: 0; } 30%,70% { opacity: 1; } 100% { transform: translateY(-2.5px); opacity: 0; } }
  @keyframes m3sts-turn { to { transform: rotate(360deg); } }
  @keyframes m3sts-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
  @keyframes m3sts-nudge { 0%,100% { transform: none; } 25% { transform: translateX(-1.5px); } 50% { transform: translateX(1.5px); } 75% { transform: translateX(-.8px); } }
  .m3sts[data-off] * { animation-play-state: paused !important; }
  @media (prefers-reduced-motion: reduce) { .m3sts * { animation: none !important; transition: none !important; } }
`;

export default function FileSyncStatusIconsWithRetry() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const SPIN = 1800; // how long the retry spins before it reports success
    const DONE = "Uploaded just now";
    const WAIT = "Uploading again";
    const row = root.querySelector<HTMLElement>('[data-s="err"]')!;
    const txt = row.querySelector<HTMLElement>(".m3sts-txt")!;
    const live = root.querySelector<HTMLElement>(".m3sts-live")!;
    const first = txt.textContent ?? "";
    const name = row.querySelector(".m3sts-name")!.textContent;
    let t = 0;
    const set = (s: string, msg: string, say: boolean) => {
      row.setAttribute("data-s", s);
      txt.textContent = msg;
      if (say) live.textContent = `${name}: ${msg}`;
    };
    const retry = (say: boolean) => {
      set("sync", WAIT, say);
      window.clearTimeout(t);
      t = window.setTimeout(() => set("ok", DONE, say), SPIN);
    };
    // Preview: one quiet retry shortly after load (not announced); remove for real use.
    let demo = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : window.setTimeout(() => retry(false), 900);
    const stopDemo = () => window.clearTimeout(demo);
    const onRetry = () => { stopDemo(); retry(true); };
    const onReplay = () => {
      window.clearTimeout(t); stopDemo();
      set("err", first, false);
      live.textContent = "";
      root.removeAttribute("data-in");
      void root.offsetWidth;
      root.setAttribute("data-in", "");
    };
    const retryBtn = row.querySelector(".m3sts-retry")!;
    const replayBtn = root.querySelector(".m3sts-replay")!;
    retryBtn.addEventListener("click", onRetry);
    replayBtn.addEventListener("click", onReplay);
    root.addEventListener("focusin", stopDemo);
    // Draws the checks the first time the card is seen, and pauses loops off screen.
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { root.setAttribute("data-in", ""); root.removeAttribute("data-off"); }
      else root.setAttribute("data-off", "");
    });
    io.observe(root);
    return () => {
      window.clearTimeout(t); stopDemo(); demo = 0;
      io.disconnect();
      retryBtn.removeEventListener("click", onRetry);
      replayBtn.removeEventListener("click", onReplay);
      root.removeEventListener("focusin", stopDemo);
    };
  }, []);

  return (
    <>
      <style>{css}</style>
      <section ref={ref} className="m3sts" aria-labelledby="m3sts-h">
        <div className="m3sts-card">
          <div className="m3sts-head">
            <div>
              <p className="m3sts-kicker">Juniper Lane Bakery</p>
              <h2 className="m3sts-title" id="m3sts-h">Shared folder: autumn menu</h2>
            </div>
            <button className="m3sts-replay" type="button">Replay</button>
          </div>
          <ul className="m3sts-list">
            <li className="m3sts-row" data-s="up">
              <svg className="m3sts-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 14.5v4h14v-4"/><g className="m3sts-arrow"><path d="M12 14V5"/><path d="M8.5 8.5L12 5l3.5 3.5"/></g></svg>
              <div className="m3sts-text"><p className="m3sts-name">menu-photos (8 files)</p><p className="m3sts-txt">Uploading, 3 of 8 done</p></div>
            </li>
            <li className="m3sts-row" data-s="done">
              <svg className="m3sts-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 19h9a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 6.6 12.1 3.5 3.5 0 0 0 7.5 19z"/><path className="m3sts-draw" pathLength={1} d="M9.4 14.6l1.9 1.9 3.4-3.6"/></svg>
              <div className="m3sts-text"><p className="m3sts-name">price-cards.pdf</p><p className="m3sts-txt">Synced just now</p></div>
            </li>
            <li className="m3sts-row" data-s="off">
              <svg className="m3sts-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 19h9a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 6.6 12.1 3.5 3.5 0 0 0 7.5 19z"/><path className="m3sts-draw m3sts-late" pathLength={1} d="M4 4.5l16 16"/></svg>
              <div className="m3sts-text"><p className="m3sts-name">counter-sign.png</p><p className="m3sts-txt">Offline, syncs when you reconnect</p></div>
            </li>
            <li className="m3sts-row" data-s="err">
              <svg className="m3sts-ic" viewBox="0 0 24 24" aria-hidden="true">
                <g className="m3sts-g m3sts-g-err"><path d="M10.6 5.2a1.6 1.6 0 0 1 2.8 0l7 12.2a1.6 1.6 0 0 1-1.4 2.4H5a1.6 1.6 0 0 1-1.4-2.4z"/><path d="M12 10v3.6"/><path d="M12 16.6v.1"/></g>
                <g className="m3sts-g m3sts-g-sync"><g className="m3sts-spin"><path d="M19 12a7 7 0 0 1-12.5 4.3"/><path d="M5 12a7 7 0 0 1 12.5-4.3"/><path d="M17.9 4.4v3.6h-3.6"/><path d="M6.1 19.6V16h3.6"/></g></g>
                <g className="m3sts-g m3sts-g-done"><path d="M7.5 19h9a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 6.6 12.1 3.5 3.5 0 0 0 7.5 19z"/><path className="m3sts-tick" pathLength={1} d="M9.4 14.6l1.9 1.9 3.4-3.6"/></g>
              </svg>
              <div className="m3sts-text"><p className="m3sts-name">supplier-list.csv</p><p className="m3sts-txt">Could not upload: the file is open elsewhere</p></div>
              <button className="m3sts-retry" type="button">Retry</button>
            </li>
          </ul>
          <p className="m3sts-live" role="status"></p>
        </div>
      </section>
    </>
  );
}

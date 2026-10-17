import { useEffect, useRef } from "react";

/* Styles shared with the HTML version; class and keyframe names are prefixed so several pieces can share a page. */
const css = `
  /* Change these: page colour, code panel, text, accent for the check, how long "Copied" stays (also HOLD in the script). */
  .m3cpy { --m3cpy-bg: #e4e2dd; --m3cpy-card: #fbfaf7; --m3cpy-code: #1d2025; --m3cpy-ink: #202326; --m3cpy-accent: #7fd1a8; }
  .m3cpy { background: var(--m3cpy-bg); padding: 64px 16px; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; color: var(--m3cpy-ink); }
  .m3cpy-card { max-width: 600px; margin: 0 auto; background: var(--m3cpy-card); border: 1px solid #dcd8d0; border-radius: 20px; padding: 28px; box-shadow: 0 1px 2px rgba(32,35,38,.05), 0 22px 44px -28px rgba(32,35,38,.4); }
  .m3cpy-kicker { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #5a5f66; }
  .m3cpy-title { margin: 6px 0 0; font-size: 22px; font-weight: 600; letter-spacing: -.01em; }
  .m3cpy-sub { margin: 6px 0 0; font-size: 15px; color: #565b62; }
  .m3cpy-steps { list-style: none; margin: 20px 0 0; padding: 0; display: grid; gap: 14px; }
  .m3cpy-steps li { min-width: 0; }
  .m3cpy-step { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #4b5057; }
  .m3cpy-code { display: flex; align-items: center; gap: 12px; padding: 8px 8px 8px 16px; border-radius: 12px; background: var(--m3cpy-code); color: #e9e6df; }
  .m3cpy-code code { flex: 1; min-width: 0; overflow-x: auto; white-space: nowrap; font: 14px/1.5 ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
  .m3cpy-btn { flex: none; display: inline-flex; align-items: center; gap: 7px; min-height: 40px; min-width: 96px; padding: 0 12px; border: 1px solid rgba(233,230,223,.16); border-radius: 9px; background: rgba(233,230,223,.06); color: #e9e6df; font: inherit; font-size: 13.5px; font-weight: 500; cursor: pointer; transition: background-color .2s ease, border-color .2s ease; }
  .m3cpy-btn:hover { background: rgba(233,230,223,.12); }
  .m3cpy-btn:focus-visible { outline: 2px solid var(--m3cpy-accent); outline-offset: 2px; }
  .m3cpy-ic { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; overflow: visible; }
  .m3cpy-ic * { transform-box: fill-box; transform-origin: 50% 50%; }
  /* The crossfade: clipboard shrinks away while the check draws in its place. */
  .m3cpy-clip { transition: opacity .2s ease, transform .25s ease; }
  .m3cpy-check { stroke: var(--m3cpy-accent); stroke-width: 2.2; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; transition: stroke-dashoffset .35s ease-out, opacity .15s ease; }
  .m3cpy-btn.is-done { border-color: rgba(127,209,168,.4); }
  .m3cpy-btn.is-done .m3cpy-clip { opacity: 0; transform: scale(.7); }
  .m3cpy-btn.is-done .m3cpy-check { opacity: 1; stroke-dashoffset: 0; transition-delay: .1s, .08s; }
  .m3cpy-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  @media (max-width: 480px) { .m3cpy-card { padding: 22px 16px; } .m3cpy-btn { min-width: 0; } .m3cpy-word { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); } }
  @media (prefers-reduced-motion: reduce) { .m3cpy * { transition: none !important; } }
`;

export default function CopyToClipboardIconThatTurnsIntoCheck() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const HOLD = 2000; // how long the check stays
    const DONE = "Copied";
    const IDLE = "Copy";
    const live = root.querySelector<HTMLElement>(".m3cpy-live")!;
    const btns = Array.from(root.querySelectorAll<HTMLButtonElement>(".m3cpy-btn"));
    const timers = new Map<HTMLButtonElement, number>();
    const word = (b: HTMLButtonElement) => b.querySelector(".m3cpy-word")!;
    const mark = (b: HTMLButtonElement, say: boolean) => {
      b.classList.add("is-done");
      word(b).textContent = DONE;
      if (say) live.textContent = "Command copied";
      window.clearTimeout(timers.get(b));
      timers.set(b, window.setTimeout(() => {
        b.classList.remove("is-done");
        word(b).textContent = IDLE;
        live.textContent = "";
      }, HOLD));
    };
    // Preview only: shows the copied state once without touching the clipboard. Remove for real use.
    const demo = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : window.setTimeout(() => mark(btns[0], false), 1000);
    const stopDemo = () => window.clearTimeout(demo);
    const onClick = (e: Event) => {
      const b = (e.target as Element).closest<HTMLButtonElement>(".m3cpy-btn");
      if (!b) return;
      stopDemo();
      const text = b.parentElement?.querySelector("code")?.textContent ?? "";
      navigator.clipboard?.writeText(text).then(
        () => mark(b, true),
        () => { live.textContent = "Copy failed, select the text instead"; },
      );
    };
    root.addEventListener("click", onClick);
    root.addEventListener("focusin", stopDemo);
    return () => {
      stopDemo();
      timers.forEach((t) => window.clearTimeout(t));
      root.removeEventListener("click", onClick);
      root.removeEventListener("focusin", stopDemo);
    };
  }, []);

  return (
    <>
      <style>{css}</style>
      <section ref={ref} className="m3cpy" aria-labelledby="m3cpy-h">
        <div className="m3cpy-card">
          <p className="m3cpy-kicker">Quarry Notes docs</p>
          <h2 className="m3cpy-title" id="m3cpy-h">Set up the notes server</h2>
          <p className="m3cpy-sub">Run these two lines in a terminal inside your project folder.</p>
          <ol className="m3cpy-steps">
            <li>
              <span className="m3cpy-step">1. Install</span>
              <div className="m3cpy-code"><code>npm install quarry-notes</code>
                <button className="m3cpy-btn" type="button" aria-label="Copy install command">
                  <svg className="m3cpy-ic" viewBox="0 0 24 24" aria-hidden="true">
                    <g className="m3cpy-clip"><rect x="8" y="8" width="11.5" height="12.5" rx="2.2"/><path d="M15.5 8V5.7a2.2 2.2 0 0 0-2.2-2.2H6.7a2.2 2.2 0 0 0-2.2 2.2v8.6a2.2 2.2 0 0 0 2.2 2.2H8"/></g>
                    <path className="m3cpy-check" pathLength={1} d="M5.5 12.5l4.2 4.2 8.8-9"/>
                  </svg>
                  <span className="m3cpy-word">Copy</span>
                </button>
              </div>
            </li>
            <li>
              <span className="m3cpy-step">2. Start</span>
              <div className="m3cpy-code"><code>npx quarry-notes serve --port 4310</code>
                <button className="m3cpy-btn" type="button" aria-label="Copy start command">
                  <svg className="m3cpy-ic" viewBox="0 0 24 24" aria-hidden="true">
                    <g className="m3cpy-clip"><rect x="8" y="8" width="11.5" height="12.5" rx="2.2"/><path d="M15.5 8V5.7a2.2 2.2 0 0 0-2.2-2.2H6.7a2.2 2.2 0 0 0-2.2 2.2v8.6a2.2 2.2 0 0 0 2.2 2.2H8"/></g>
                    <path className="m3cpy-check" pathLength={1} d="M5.5 12.5l4.2 4.2 8.8-9"/>
                  </svg>
                  <span className="m3cpy-word">Copy</span>
                </button>
              </div>
            </li>
          </ol>
          <p className="m3cpy-live" role="status"></p>
        </div>
      </section>
    </>
  );
}

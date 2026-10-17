import { useEffect, useRef } from "react";

/* Styles shared with the HTML version; class and keyframe names are prefixed so several pieces can share a page. */
const css = `
  /* Change these: page colour, card, ink, error red, warning amber. */
  .m3wrn { --m3wrn-bg: #e8e6e2; --m3wrn-card: #fcfbf9; --m3wrn-ink: #1f2226; --m3wrn-err: #b02a1f; --m3wrn-warn: #8a5500; }
  .m3wrn { background: var(--m3wrn-bg); padding: 64px 16px; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; color: var(--m3wrn-ink); }
  .m3wrn-card { max-width: 460px; margin: 0 auto; background: var(--m3wrn-card); border: 1px solid #dedad3; border-radius: 20px; padding: 28px 26px; box-shadow: 0 1px 2px rgba(31,34,38,.05), 0 22px 44px -28px rgba(31,34,38,.4); }
  .m3wrn-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .m3wrn-title { margin: 0; font-size: 21px; font-weight: 600; letter-spacing: -.01em; line-height: 1.25; }
  .m3wrn-replay { flex: none; min-height: 40px; padding: 0 14px; border: 1px solid #d6d1c8; border-radius: 999px; background: #fff; color: #444a50; font: inherit; font-size: 13px; cursor: pointer; }
  .m3wrn-banner { display: flex; gap: 12px; align-items: flex-start; margin-top: 18px; padding: 12px 14px; border-radius: 12px; background: #fbf0d9; color: var(--m3wrn-warn); }
  .m3wrn-banner p { margin: 1px 0 0; font-size: 14px; line-height: 1.45; color: #5e3d06; }
  .m3wrn-ic { flex: none; width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; overflow: visible; }
  .m3wrn-ic * { transform-box: fill-box; transform-origin: 50% 50%; }
  .m3wrn-draw { stroke-dasharray: 1; stroke-dashoffset: 0; }
  .m3wrn-circ .m3wrn-draw { transform: rotate(-90deg); }
  .m3wrn-dot { stroke-width: 2.4; }
  .m3wrn-label { display: block; margin-top: 22px; font-size: 14px; font-weight: 600; }
  .m3wrn-field { margin-top: 8px; }
  .m3wrn-input { box-sizing: border-box; width: 100%; min-height: 48px; padding: 0 14px; border: 1.5px solid var(--m3wrn-err); border-radius: 12px; background: #fff; color: var(--m3wrn-ink); font: inherit; font-size: 15.5px; }
  .m3wrn-input:focus-visible { outline: 3px solid rgba(176,42,31,.25); outline-offset: 1px; }
  .m3wrn-err { display: flex; gap: 8px; align-items: flex-start; margin: 10px 0 0; color: var(--m3wrn-err); font-size: 14px; line-height: 1.45; }
  .m3wrn-err .m3wrn-ic { width: 20px; height: 20px; }
  .m3wrn-submit { margin-top: 22px; width: 100%; min-height: 48px; border: 0; border-radius: 12px; background: var(--m3wrn-ink); color: #fff; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; }
  .m3wrn-submit:focus-visible, .m3wrn-replay:focus-visible { outline: 2px solid var(--m3wrn-ink); outline-offset: 3px; }
  .m3wrn-err.is-ok { color: #2b6a48; }
  .m3wrn-ok { opacity: 0; transition: opacity .25s ease; }
  .m3wrn-err.is-ok .m3wrn-ok { opacity: 1; }
  .m3wrn-err.is-ok .m3wrn-bar, .m3wrn-err.is-ok .m3wrn-dot { opacity: 0; }
  .m3wrn-input.is-ok { border-color: #2b6a48; }
  /* Entrance: outlines draw, the bar and dot drop in, the field nudges once. Done by about 1.3 s. */
  .m3wrn[data-play] .m3wrn-draw { animation: m3wrn-draw .55s ease-out both; }
  .m3wrn[data-play] .m3wrn-bar { animation: m3wrn-drop .3s .45s ease-out both; }
  .m3wrn[data-play] .m3wrn-dot { animation: m3wrn-fade .25s .65s ease-out both; }
  .m3wrn[data-play] .m3wrn-err .m3wrn-draw { animation-delay: .35s; }
  .m3wrn[data-play] .m3wrn-err .m3wrn-bar { animation-delay: .75s; }
  .m3wrn[data-play] .m3wrn-err .m3wrn-dot { animation-delay: .95s; }
  .m3wrn[data-play] .m3wrn-field { animation: m3wrn-nudge .45s .6s ease-in-out both; }
  .m3wrn[data-play] .m3wrn-err span { animation: m3wrn-fade .35s .5s ease-out both; }
  @keyframes m3wrn-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
  @keyframes m3wrn-drop { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: none; } }
  @keyframes m3wrn-fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes m3wrn-nudge { 0%,100% { transform: none; } 20% { transform: translateX(-5px); } 45% { transform: translateX(4px); } 70% { transform: translateX(-2px); } }
  @media (max-width: 480px) { .m3wrn-card { padding: 22px 18px; } }
  @media (prefers-reduced-motion: reduce) { .m3wrn * { animation: none !important; } }
`;

export default function FormErrorAndWarningIcons() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    // Plays once in view; Replay plays again; submitting checks the address and updates the message.
    const BAD = "maya.okafor@harbourline"; // the sample mistake the demo starts with
    const input = root.querySelector<HTMLInputElement>(".m3wrn-input")!;
    const err = root.querySelector<HTMLElement>(".m3wrn-err")!;
    const msg = err.querySelector("span")!;
    const first = msg.textContent;
    const form = root.querySelector("form")!;
    const replay = root.querySelector(".m3wrn-replay")!;
    const play = () => {
      root.removeAttribute("data-play");
      void root.offsetWidth; // restart the keyframes
      root.setAttribute("data-play", "");
    };
    const show = (ok: boolean) => {
      input.setAttribute("aria-invalid", String(!ok));
      input.classList.toggle("is-ok", ok);
      err.classList.toggle("is-ok", ok);
      msg.textContent = ok ? "Looks good. You are on the list." : first;
      if (!ok) play();
    };
    const onSubmit = (e: Event) => {
      e.preventDefault();
      show(/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(input.value.trim()));
    };
    const onReplay = () => { input.value = BAD; show(false); };
    form.addEventListener("submit", onSubmit);
    replay.addEventListener("click", onReplay);
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { play(); io.disconnect(); }
    });
    io.observe(root);
    return () => {
      io.disconnect();
      form.removeEventListener("submit", onSubmit);
      replay.removeEventListener("click", onReplay);
    };
  }, []);

  return (
    <>
      <style>{css}</style>
      <section ref={ref} className="m3wrn" aria-labelledby="m3wrn-h">
        <form className="m3wrn-card" noValidate>
          <div className="m3wrn-head">
            <h2 className="m3wrn-title" id="m3wrn-h">Join the Tidewater Rowing Club list</h2>
            <button className="m3wrn-replay" type="button">Replay</button>
          </div>
          <div className="m3wrn-banner">
            <svg className="m3wrn-ic m3wrn-tri" viewBox="0 0 24 24" aria-hidden="true"><path className="m3wrn-draw" pathLength={1} d="M10.6 4.6a1.6 1.6 0 0 1 2.8 0l7.3 12.8a1.6 1.6 0 0 1-1.4 2.4H4.7a1.6 1.6 0 0 1-1.4-2.4z"/><path className="m3wrn-bar" d="M12 9.5v4"/><path className="m3wrn-dot" d="M12 16.6v.1"/></svg>
            <p>Saturday sessions move to the north jetty from next week.</p>
          </div>
          <label className="m3wrn-label" htmlFor="m3wrn-email">Email address</label>
          <div className="m3wrn-field">
            <input className="m3wrn-input" id="m3wrn-email" type="email" defaultValue="maya.okafor@harbourline" aria-invalid="true" aria-describedby="m3wrn-err" autoComplete="email" />
          </div>
          <p className="m3wrn-err" id="m3wrn-err">
            <svg className="m3wrn-ic m3wrn-circ" viewBox="0 0 24 24" aria-hidden="true"><circle className="m3wrn-draw" pathLength={1} cx="12" cy="12" r="8.5"/><path className="m3wrn-bar" d="M12 7.8v4.6"/><path className="m3wrn-dot" d="M12 15.9v.1"/><path className="m3wrn-ok" d="M8.3 12.3l2.6 2.6 4.8-5"/></svg>
            <span role="status">That address is missing its ending, such as .com or .org.</span>
          </p>
          <button className="m3wrn-submit" type="submit">Join the list</button>
        </form>
      </section>
    </>
  );
}

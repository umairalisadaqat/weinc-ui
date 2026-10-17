import { useEffect, useRef } from "react";

const MIN = 1000; // shortest time the cover shows, in ms
const CAP = 1500; // longest the cover waits for images, in ms
const EXIT = 1000; // length of the exit, in ms
// On a real page: give the cover position: fixed; inset: 0 and put data-page on your <main>.

const CSS = `
  .w2mat { --w2mat-mat: #efe7da; --w2mat-ink: #2f2a22; --w2mat-shadow: rgba(60,48,30,.28); height: 600px; background: #d9cfbf; color: var(--w2mat-ink); font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; }
  .w2mat-page { position: relative; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 0 clamp(16px, 4vw, 48px) clamp(16px, 4vw, 44px); }
  .w2mat-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: scale(1.12); transition: transform 1.6s cubic-bezier(.2,.75,.15,1); }
  .w2mat.is-out .w2mat-bg { transform: none; }
  .w2mat-nav, .w2mat-panel { position: relative; }
  .w2mat-nav { display: flex; align-items: center; justify-content: space-between; height: 76px; }
  .w2mat-brand { color: inherit; font-family: ui-serif, Georgia, 'Times New Roman', serif; font-size: 22px; text-decoration: none; }
  .w2mat-link { display: inline-flex; align-items: center; min-height: 42px; padding: 0 18px; border-radius: 999px; background: var(--w2mat-ink); color: #f7f2ea; font-size: 14px; text-decoration: none; }
  .w2mat-panel { max-width: 27rem; background: rgba(250,246,239,.94); padding: clamp(20px, 3vw, 30px); border-radius: 4px; box-shadow: 0 20px 50px -24px var(--w2mat-shadow); }
  .w2mat-kicker { margin: 0; font-size: 12px; letter-spacing: .2em; text-transform: uppercase; color: #6b5d48; }
  .w2mat-title { margin: 10px 0 0; font-family: ui-serif, Georgia, 'Times New Roman', serif; font-size: clamp(28px, 3.6vw, 42px); line-height: 1.08; font-weight: 400; }
  .w2mat-row { display: flex; gap: 14px; align-items: center; margin: 16px 0 18px; }
  .w2mat-row img { width: 88px; height: 60px; object-fit: cover; border-radius: 2px; flex: none; }
  .w2mat-row p { margin: 0; font-size: 15px; line-height: 1.5; color: #4f4637; }
  .w2mat-replay { border: 1px solid #cdbfa8; background: transparent; color: var(--w2mat-ink); }
  .w2mat-cover { position: absolute; inset: 0; z-index: 2; }
  .w2mat-t, .w2mat-b, .w2mat-l, .w2mat-r { position: absolute; background: var(--w2mat-mat); transition: transform .9s cubic-bezier(.7,0,.2,1) .1s; }
  .w2mat-t { top: 0; left: 0; right: 0; height: 34%; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 18px; }
  .w2mat-b { bottom: 0; left: 0; right: 0; height: 34%; display: flex; align-items: flex-start; justify-content: center; padding-top: 18px; }
  .w2mat-l { top: 33.9%; bottom: 33.9%; left: 0; width: 34%; }
  .w2mat-r { top: 33.9%; bottom: 33.9%; right: 0; width: 34%; }
  .w2mat-edge { position: absolute; top: 34%; bottom: 34%; left: 34%; right: 34%; box-shadow: inset 0 2px 10px var(--w2mat-shadow); transition: opacity .3s ease; }
  .w2mat.is-out .w2mat-edge, .w2mat.is-out .w2mat-name, .w2mat.is-out .w2mat-pct { opacity: 0; }
  .w2mat.is-out .w2mat-t { transform: translateY(-101%); }
  .w2mat.is-out .w2mat-b { transform: translateY(101%); }
  .w2mat.is-out .w2mat-l { transform: translateX(-101%); }
  .w2mat.is-out .w2mat-r { transform: translateX(101%); }
  .w2mat-name { font-family: ui-serif, Georgia, 'Times New Roman', serif; font-size: clamp(26px, 4vw, 40px); color: var(--w2mat-ink); transition: opacity .25s ease; }
  .w2mat-pct { font-size: 13px; letter-spacing: .2em; text-transform: uppercase; color: #5f5340; font-variant-numeric: tabular-nums; transition: opacity .25s ease; }
  @media (max-width: 767px) {
    .w2mat-l, .w2mat-r { width: 18%; }
    .w2mat-edge { left: 18%; right: 18%; }
    .w2mat-row img { width: 72px; height: 50px; }
  }

  .w2mat { position: relative; overflow: hidden; }
  .w2mat-cover[hidden] { display: none; }
  .w2mat.is-snap, .w2mat.is-snap * { transition: none !important; }
  .w2mat[data-paused] * { animation-play-state: paused !important; }
  .w2mat-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .w2mat-replay { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px; border-radius: 999px; font: 600 13px/1 ui-sans-serif, system-ui, sans-serif; cursor: pointer; }
  .w2mat-replay:focus-visible, .w2mat a:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) {
    .w2mat *, .w2mat *::before, .w2mat *::after { animation: none !important; transition-duration: 0s !important; transition-delay: 0s !important; }
    .w2mat .w2mat-cover { transition: opacity .45s ease !important; }
    .w2mat.is-out .w2mat-cover { opacity: 0; }
    .w2mat-cover *:not([data-bar]), .w2mat-page * { transform: none !important; opacity: 1; }
  }
`;

export default function LinenMatAperturePreloader() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const page = root.querySelector<HTMLElement>("[data-page]")!;
    const cover = root.querySelector<HTMLElement>("[data-cover]")!;
    const live = root.querySelector<HTMLElement>("[data-live]")!;
    const again = root.querySelector<HTMLButtonElement>("[data-replay]")!;
    const nums = root.querySelectorAll<HTMLElement>("[data-num]");
    const bars = root.querySelectorAll<HTMLElement>("[data-bar]");
    const ticks = root.querySelectorAll<HTMLElement>("[data-tick]");
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    let run = 0, frame = 0, seen = true, timer = 0;
    let step: ((now: number) => void) | null = null;
    const draw = (v: number) => {
      const t = String(Math.round(v * 100));
      nums.forEach((n) => { n.textContent = t; });
      bars.forEach((b) => { b.style.transform = `scaleX(${v})`; });
    };
    const start = (refocus: boolean) => {
      const id = ++run, t0 = performance.now(), imgs = page.querySelectorAll("img"), total = imgs.length;
      let done = 0, shown = 0;
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      root.classList.add("is-snap");
      root.classList.remove("is-out");
      cover.hidden = false;
      void root.offsetWidth;
      root.classList.remove("is-snap");
      page.inert = true;
      page.setAttribute("aria-busy", "true");
      live.textContent = "Loading";
      ticks.forEach((k) => k.classList.remove("is-on"));
      // Real progress: one step per image that fires load or error.
      imgs.forEach((img, i) => {
        const hit = () => { if (id !== run) return; done++; ticks[i]?.classList.add("is-on"); };
        if (img.complete) hit();
        else { img.addEventListener("load", hit, { once: true }); img.addEventListener("error", hit, { once: true }); }
      });
      step = (now: number) => {
        let real = total ? done / total : 1;
        const t = now - t0;
        if (t > CAP) real = 1;
        shown += (real - shown) * (rm.matches ? 1 : 0.2);
        if (real - shown < 0.004) shown = real;
        draw(shown);
        if (shown === 1 && t >= MIN) {
          step = null;
          frame = 0;
          root.classList.add("is-out");
          live.textContent = "Page ready";
          page.inert = false;
          page.removeAttribute("aria-busy");
          timer = window.setTimeout(() => { cover.hidden = true; if (refocus) again.focus(); }, rm.matches ? 500 : EXIT);
          return;
        }
        frame = seen ? requestAnimationFrame(step) : 0;
      };
      frame = requestAnimationFrame(step);
    };
    // Off screen: stop the frame loop and pause CSS loops.
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      root.toggleAttribute("data-paused", !seen);
      if (seen && step && !frame) frame = requestAnimationFrame(step);
    });
    io.observe(root);
    const onReplay = () => start(true);
    again.addEventListener("click", onReplay);
    start(false);
    return () => {
      run++;
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      io.disconnect();
      again.removeEventListener("click", onReplay);
    };
  }, []);

  return (
    <section ref={ref} className="w2mat">
      <style>{CSS}</style>
      <div className="w2mat-page" data-page="" aria-busy={true}>
        <img className="w2mat-bg" src="https://images.pexels.com/photos/7232397/pexels-photo-7232397.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Close view of soft beige linen fabric gathered in loose folds" width="1600" height="900" />
        <header className="w2mat-nav">
          <a href="#" className="w2mat-brand">Weft &amp; Fold</a>
          <a href="#" className="w2mat-link">Shop bedding</a>
        </header>
        <div className="w2mat-panel">
          <p className="w2mat-kicker">Stonewashed linen</p>
          <h2 className="w2mat-title">Sheets that soften with every wash.</h2>
          <div className="w2mat-row">
            <img src="https://images.pexels.com/photos/11733651/pexels-photo-11733651.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Stack of folded sage green linen napkins" width="600" height="400" />
            <p>Sage, oat and chalk, cut and hemmed in a small mill.</p>
          </div>
          <button type="button" className="w2mat-replay" data-replay="">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10a6 6 0 1 0 1.8-4.3" /><path d="M4 3.5v3.2h3.2" /></svg>
              Replay intro
            </button>
        </div>
      </div>
      <div className="w2mat-cover" data-cover="" aria-hidden="true">
        <span className="w2mat-t"><span className="w2mat-name">Weft &amp; Fold</span></span>
        <span className="w2mat-b"><span className="w2mat-pct"><span data-num="">0</span>% woven</span></span>
        <span className="w2mat-l"></span>
        <span className="w2mat-r"></span>
        <span className="w2mat-edge"></span>
      </div>
      <p className="w2mat-sr" data-live="" aria-live="polite"></p>
    </section>
  );
}

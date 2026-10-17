import { useEffect, useRef } from "react";

const MIN = 800; // shortest time the cover shows, in ms
const CAP = 1400; // longest the cover waits for images, in ms
const EXIT = 800; // length of the exit, in ms
// On a real page: give the cover position: fixed; inset: 0 and put data-page on your <main>.

const CSS = `
  .w2cir { --w2cir-espresso: #251913; --w2cir-crema: #d9a66b; --w2cir-milk: #f4ece2; height: 600px; background: var(--w2cir-milk); color: #241812; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; }
  .w2cir-page { height: 100%; display: flex; flex-direction: column; padding: 0 clamp(16px, 4vw, 48px); }
  .w2cir-nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 72px; }
  .w2cir-brand { display: inline-flex; align-items: center; gap: 10px; color: inherit; font-weight: 700; font-size: 17px; text-decoration: none; }
  .w2cir-dot { width: 14px; height: 14px; border-radius: 50%; background: var(--w2cir-espresso); }
  .w2cir-link { display: inline-flex; align-items: center; min-height: 40px; color: #7a4a22; font-size: 14px; font-weight: 600; text-underline-offset: 4px; }
  .w2cir-hero { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: clamp(20px, 4vw, 56px); align-items: center; min-height: 0; padding-bottom: 24px; }
  .w2cir-kicker { margin: 0; font-size: 12px; letter-spacing: .2em; text-transform: uppercase; color: #7a4a22; }
  .w2cir-title { margin: 12px 0 0; font-size: clamp(30px, 4.4vw, 54px); line-height: 1.04; letter-spacing: -.03em; font-weight: 700; }
  .w2cir-copy { margin: 16px 0 0; font-size: 16px; line-height: 1.6; color: #5b4637; max-width: 28rem; }
  .w2cir-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
  .w2cir-cta { display: inline-flex; align-items: center; min-height: 44px; padding: 0 22px; border-radius: 999px; background: var(--w2cir-espresso); color: var(--w2cir-milk); font-size: 14px; font-weight: 600; text-decoration: none; }
  .w2cir-replay { border: 1px solid #d6c3ad; background: transparent; color: #241812; }
  .w2cir-pics { position: relative; height: 100%; max-height: 430px; }
  .w2cir-pics img { position: absolute; object-fit: cover; display: block; }
  .w2cir-a { top: 0; left: 0; width: 78%; height: 100%; border-radius: 220px 220px 8px 8px; transform: scale(.94); transition: transform 1.2s cubic-bezier(.2,.75,.15,1) .35s; }
  .w2cir-b { right: 0; bottom: 30px; width: 40%; aspect-ratio: 1; height: auto; border-radius: 50%; border: 6px solid var(--w2cir-milk); transform: scale(.7); transition: transform 1.2s cubic-bezier(.3,1.3,.5,1) .5s; }
  .w2cir.is-out .w2cir-a, .w2cir.is-out .w2cir-b { transform: none; }
  .w2cir-cover { position: absolute; inset: 0; z-index: 2; overflow: hidden; }
  .w2cir-disc { --w2cir-d: max(300%, 1500px); position: absolute; left: calc(clamp(16px, 4vw, 48px) + 7px); top: 36px; width: var(--w2cir-d); height: auto; aspect-ratio: 1; margin-left: calc(var(--w2cir-d) / -2); margin-top: calc(var(--w2cir-d) / -2); border-radius: 50%; background: var(--w2cir-espresso); transition: transform .75s cubic-bezier(.5,0,.85,.35); }
  .w2cir.is-out .w2cir-disc { transform: scale(0); }
  .w2cir-mid { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--w2cir-milk); transition: opacity .25s ease; }
  .w2cir.is-out .w2cir-mid { opacity: 0; }
  .w2cir-bean { position: relative; width: 30px; height: 42px; border-radius: 50%; background: var(--w2cir-crema); animation: w2cir-turn 2.4s cubic-bezier(.6,0,.4,1) infinite; }
  .w2cir-bean span { position: absolute; left: 50%; top: 6px; bottom: 6px; width: 3px; margin-left: -1.5px; border-radius: 3px; background: var(--w2cir-espresso); transform: rotate(8deg); }
  @keyframes w2cir-turn { 0%, 20% { transform: rotate(0deg); } 50%, 70% { transform: rotate(180deg); } 100% { transform: rotate(360deg); } }
  .w2cir-pct { margin: 10px 0 0; font-size: clamp(44px, 7vw, 76px); font-weight: 300; line-height: 1; font-variant-numeric: tabular-nums; }
  .w2cir-note { margin: 0; font-size: 13px; letter-spacing: .2em; text-transform: uppercase; color: var(--w2cir-crema); }
  @media (max-width: 767px) {
    .w2cir-link { font-size: 13px; }
    .w2cir-hero { grid-template-columns: 1fr; align-content: start; gap: 18px; }
    .w2cir-pics { height: 170px; order: -1; }
    .w2cir-a { width: 100%; border-radius: 120px 120px 8px 8px; }
    .w2cir-b { display: none; }
    .w2cir-copy { font-size: 15px; margin-top: 12px; }
  }

  .w2cir { position: relative; overflow: hidden; }
  .w2cir-cover[hidden] { display: none; }
  .w2cir.is-snap, .w2cir.is-snap * { transition: none !important; }
  .w2cir[data-paused] * { animation-play-state: paused !important; }
  .w2cir-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .w2cir-replay { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px; border-radius: 999px; font: 600 13px/1 ui-sans-serif, system-ui, sans-serif; cursor: pointer; }
  .w2cir-replay:focus-visible, .w2cir a:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) {
    .w2cir *, .w2cir *::before, .w2cir *::after { animation: none !important; transition-duration: 0s !important; transition-delay: 0s !important; }
    .w2cir .w2cir-cover { transition: opacity .45s ease !important; }
    .w2cir.is-out .w2cir-cover { opacity: 0; }
    .w2cir-cover *:not([data-bar]), .w2cir-page * { transform: none !important; opacity: 1; }
  }
`;

export default function EspressoCircleShrinkPreloader() {
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
    <section ref={ref} className="w2cir">
      <style>{CSS}</style>
      <div className="w2cir-page" data-page="" aria-busy={true}>
        <header className="w2cir-nav">
          <a href="#" className="w2cir-brand"><span className="w2cir-dot" aria-hidden="true"></span>Ember &amp; Ash</a>
          <a href="#" className="w2cir-link">Coffee subscriptions</a>
        </header>
        <div className="w2cir-hero">
          <div className="w2cir-text">
            <p className="w2cir-kicker">Small batch roastery</p>
            <h2 className="w2cir-title">Roasted on Monday, at your door by Wednesday.</h2>
            <p className="w2cir-copy">Single origin beans roasted in twelve kilo batches, light enough to taste where they came from.</p>
            <div className="w2cir-row"><a href="#" className="w2cir-cta">Choose a coffee</a><button type="button" className="w2cir-replay" data-replay="">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10a6 6 0 1 0 1.8-4.3" /><path d="M4 3.5v3.2h3.2" /></svg>
              Replay intro
            </button></div>
          </div>
          <div className="w2cir-pics">
            <img className="w2cir-a" src="https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Freshly roasted coffee beans turning in the drum of a large roaster" width="1200" height="800" />
            <img className="w2cir-b" src="https://images.pexels.com/photos/14848712/pexels-photo-14848712.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Close view of dark roasted coffee beans filling a container" width="800" height="533" />
          </div>
        </div>
      </div>
      <div className="w2cir-cover" data-cover="" aria-hidden="true">
        <span className="w2cir-disc"></span>
        <div className="w2cir-mid">
          <span className="w2cir-bean"><span></span></span>
          <p className="w2cir-pct"><span data-num="">0</span>%</p>
          <p className="w2cir-note">Roasting the page</p>
        </div>
      </div>
      <p className="w2cir-sr" data-live="" aria-live="polite"></p>
    </section>
  );
}

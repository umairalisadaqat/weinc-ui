import { useEffect, useRef } from "react";

const MIN = 900; // shortest time the cover shows, in ms
const CAP = 1500; // longest the cover waits for images, in ms
const EXIT = 1100; // length of the exit, in ms
// On a real page: give the cover position: fixed; inset: 0 and put data-page on your <main>.

const CSS = `
  .w2lft { --w2lft-forest: #1d3a2c; --w2lft-moss: #b9c9a3; --w2lft-cream: #f4f1e8; height: 600px; background: var(--w2lft-forest); color: var(--w2lft-cream); font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; }
  .w2lft-page { position: relative; height: 100%; display: flex; flex-direction: column; padding: 0 clamp(16px, 4vw, 48px) clamp(18px, 4vw, 44px); }
  .w2lft-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: translateY(40px) scale(1.08); transition: transform 1.5s cubic-bezier(.2,.75,.15,1) .15s; }
  .w2lft.is-out .w2lft-bg { transform: none; }
  .w2lft-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(16,30,22,.55), rgba(16,30,22,.1) 35%, rgba(16,30,22,.78)); }
  .w2lft-nav, .w2lft-body { position: relative; }
  .w2lft-nav { display: flex; align-items: center; justify-content: space-between; height: 76px; }
  .w2lft-brand { color: inherit; font-weight: 700; letter-spacing: .04em; text-decoration: none; }
  .w2lft-book { display: inline-flex; align-items: center; min-height: 42px; padding: 0 18px; border-radius: 999px; background: var(--w2lft-cream); color: var(--w2lft-forest); font-size: 14px; font-weight: 600; text-decoration: none; }
  .w2lft-body { flex: 1; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }
  .w2lft-text { max-width: 34rem; transform: translateY(30px); opacity: .001; transition: transform 1s cubic-bezier(.2,.75,.15,1) .35s, opacity .7s ease .35s; }
  .w2lft.is-out .w2lft-text { transform: none; opacity: 1; }
  .w2lft-title { margin: 0; font-family: ui-serif, Georgia, 'Times New Roman', serif; font-size: clamp(32px, 5vw, 64px); line-height: 1.03; font-weight: 400; }
  .w2lft-copy { margin: 14px 0 20px; font-size: 16px; line-height: 1.6; color: #e1e6d8; }
  .w2lft-replay { border: 1px solid rgba(244,241,232,.55); background: rgba(16,30,22,.35); color: var(--w2lft-cream); }
  .w2lft-card { margin: 0; width: 240px; flex: none; background: var(--w2lft-cream); color: #1f2b22; padding: 8px 8px 12px; border-radius: 6px; box-shadow: 0 24px 50px -20px rgba(0,0,0,.55); transform: translateY(40px); opacity: .001; transition: transform 1s cubic-bezier(.2,.75,.15,1) .5s, opacity .7s ease .5s; }
  .w2lft.is-out .w2lft-card { transform: rotate(-2deg); opacity: 1; }
  .w2lft-card img { display: block; width: 100%; height: auto; aspect-ratio: 3 / 2; object-fit: cover; border-radius: 3px; }
  .w2lft-card figcaption { margin: 10px 4px 0; font-size: 13px; line-height: 1.45; color: #3d4a40; }
  .w2lft-card strong { display: block; color: #1f2b22; font-size: 14px; }
  .w2lft-cover { position: absolute; inset: 0; z-index: 2; background: var(--w2lft-forest); display: flex; flex-direction: column; justify-content: center; align-items: center; transition: transform 1s cubic-bezier(.76,0,.24,1); }
  .w2lft.is-out .w2lft-cover { transform: translateY(calc(-100% - 160px)); }
  .w2lft-curve { position: absolute; top: calc(100% - 1px); left: -25%; width: 150%; height: 150px; border-radius: 0 0 50% 50%; background: var(--w2lft-forest); }
  .w2lft-word { margin: 0; font-family: ui-serif, Georgia, 'Times New Roman', serif; font-size: clamp(40px, 8vw, 100px); color: var(--w2lft-cream); letter-spacing: -.01em; text-align: center; line-height: 1.05; padding: 0 16px; }
  .w2lft-foot { position: absolute; left: clamp(16px, 4vw, 48px); right: clamp(16px, 4vw, 48px); bottom: 48px; display: flex; justify-content: space-between; font-size: 14px; color: var(--w2lft-moss); font-variant-numeric: tabular-nums; }
  .w2lft-track { position: absolute; left: clamp(16px, 4vw, 48px); right: clamp(16px, 4vw, 48px); bottom: 34px; height: 2px; background: rgba(185,201,163,.2); }
  .w2lft-track span { display: block; height: 100%; background: var(--w2lft-moss); transform: scaleX(0); transform-origin: left; }
  @media (max-width: 767px) {
    .w2lft-body { flex-direction: column; align-items: stretch; justify-content: flex-end; }
    .w2lft-card { display: none; }
    .w2lft-copy { font-size: 15px; }
  }

  .w2lft { position: relative; overflow: hidden; }
  .w2lft-cover[hidden] { display: none; }
  .w2lft.is-snap, .w2lft.is-snap * { transition: none !important; }
  .w2lft[data-paused] * { animation-play-state: paused !important; }
  .w2lft-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .w2lft-replay { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px; border-radius: 999px; font: 600 13px/1 ui-sans-serif, system-ui, sans-serif; cursor: pointer; }
  .w2lft-replay:focus-visible, .w2lft a:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) {
    .w2lft *, .w2lft *::before, .w2lft *::after { animation: none !important; transition-duration: 0s !important; transition-delay: 0s !important; }
    .w2lft .w2lft-cover { transition: opacity .45s ease !important; }
    .w2lft.is-out .w2lft-cover { opacity: 0; }
    .w2lft-cover *:not([data-bar]), .w2lft-page * { transform: none !important; opacity: 1; }
  }
`;

export default function ForestCurvedCurtainPreloader() {
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
    <section ref={ref} className="w2lft">
      <style>{CSS}</style>
      <div className="w2lft-page" data-page="" aria-busy={true}>
        <img className="w2lft-bg" src="https://images.pexels.com/photos/5865768/pexels-photo-5865768.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Wooden cabin on a green meadow below a pine forest with low mist on the hills" width="1600" height="1067" />
        <div className="w2lft-shade"></div>
        <header className="w2lft-nav">
          <a href="#" className="w2lft-brand">Pinewood Hollow</a>
          <a href="#" className="w2lft-book">Check dates</a>
        </header>
        <div className="w2lft-body">
          <div className="w2lft-text">
            <h2 className="w2lft-title">Six cabins at the end of a gravel road.</h2>
            <p className="w2lft-copy">Wood stoves, no televisions and a lake a short walk through the trees.</p>
            <button type="button" className="w2lft-replay" data-replay="">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10a6 6 0 1 0 1.8-4.3" /><path d="M4 3.5v3.2h3.2" /></svg>
              Replay intro
            </button>
          </div>
          <figure className="w2lft-card">
            <img src="https://images.pexels.com/photos/29277697/pexels-photo-29277697.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Small wooden cabin among tall pines with rocky mountain peaks behind" width="800" height="533" />
            <figcaption><strong>Cabin four</strong> Sleeps two, closest to the ridge path</figcaption>
          </figure>
        </div>
      </div>
      <div className="w2lft-cover" data-cover="" aria-hidden="true">
        <span className="w2lft-curve"></span>
        <p className="w2lft-word">Pinewood Hollow</p>
        <div className="w2lft-foot">
          <span>Fetching the view</span><span><span data-num="">0</span>%</span>
        </div>
        <span className="w2lft-track"><span data-bar=""></span></span>
      </div>
      <p className="w2lft-sr" data-live="" aria-live="polite"></p>
    </section>
  );
}

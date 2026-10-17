import { useEffect, useRef } from "react";

const MIN = 800; // shortest time the cover shows, in ms
const CAP = 1400; // longest the cover waits for images, in ms
const EXIT = 850; // length of the exit, in ms
// On a real page: give the cover position: fixed; inset: 0 and put data-page on your <main>.

const CSS = `
  .w2spl { --w2spl-navy: #13203a; --w2spl-gold: #c8a96a; --w2spl-ivory: #f7f3ec; height: 600px; background: var(--w2spl-navy); color: var(--w2spl-ivory); font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; }
  .w2spl-page { position: relative; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 0 clamp(16px, 4vw, 48px) clamp(16px, 4vw, 44px); }
  .w2spl-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: scale(1.1); transition: transform 1.8s cubic-bezier(.2,.7,.2,1) .2s; }
  .w2spl.is-out .w2spl-bg { transform: none; }
  .w2spl-shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(14,24,44,.78), rgba(14,24,44,.15) 70%); }
  .w2spl-nav, .w2spl-card { position: relative; }
  .w2spl-nav { display: flex; align-items: center; justify-content: space-between; height: 76px; }
  .w2spl-brand { color: inherit; font-family: ui-serif, Georgia, 'Times New Roman', serif; font-size: 20px; letter-spacing: .04em; text-decoration: none; }
  .w2spl-book { display: inline-flex; align-items: center; min-height: 42px; padding: 0 18px; border-radius: 999px; background: var(--w2spl-ivory); color: var(--w2spl-navy); font-size: 14px; font-weight: 600; text-decoration: none; }
  .w2spl-card { max-width: 30rem; background: var(--w2spl-ivory); color: var(--w2spl-navy); padding: clamp(20px, 3vw, 32px); border-radius: 4px; box-shadow: 0 30px 60px -30px rgba(0,0,0,.6); transform: translateY(24px); opacity: .001; transition: transform .9s cubic-bezier(.2,.75,.15,1) .45s, opacity .6s ease .45s; }
  .w2spl.is-out .w2spl-card { transform: none; opacity: 1; }
  .w2spl-kicker { margin: 0; font-size: 12px; letter-spacing: .2em; text-transform: uppercase; color: #6d5a33; }
  .w2spl-title { margin: 10px 0 0; font-family: ui-serif, Georgia, 'Times New Roman', serif; font-size: clamp(26px, 3.4vw, 40px); line-height: 1.1; font-weight: 400; }
  .w2spl-row { display: flex; gap: 14px; align-items: center; margin: 16px 0 18px; }
  .w2spl-thumb { width: 96px; height: 64px; object-fit: cover; border-radius: 2px; flex: none; }
  .w2spl-copy { margin: 0; font-size: 15px; line-height: 1.55; color: #3c4658; }
  .w2spl-replay { border: 1px solid #c9c2b4; background: transparent; color: var(--w2spl-navy); }
  .w2spl-cover { position: absolute; inset: 0; z-index: 2; }
  .w2spl-half { position: absolute; left: 0; right: 0; height: 50%; overflow: hidden; background: var(--w2spl-navy); transition: transform .7s cubic-bezier(.55,0,.85,.4) .1s; }
  .w2spl-top { top: 0; } .w2spl-bot { bottom: 0; }
  .w2spl.is-out .w2spl-top { transform: translateY(-101%); }
  .w2spl.is-out .w2spl-bot { transform: translateY(101%); }
  .w2spl-mark { position: absolute; left: 0; right: 0; margin: 0; height: 1em; line-height: 1; text-align: center; font-family: ui-serif, Georgia, 'Times New Roman', serif; font-size: clamp(80px, 17vw, 220px); letter-spacing: .02em; color: var(--w2spl-ivory); transition: opacity .3s ease .15s; }
  .w2spl.is-out .w2spl-mark { opacity: 0; }
  .w2spl-top .w2spl-mark { bottom: -.5em; } .w2spl-bot .w2spl-mark { top: -.5em; }
  .w2spl-seam { position: absolute; left: 0; right: 0; top: 50%; height: 1px; transition: opacity .2s ease; }
  .w2spl-seam span { display: block; height: 100%; background: var(--w2spl-gold); transform: scaleX(0); }
  .w2spl.is-out .w2spl-seam, .w2spl.is-out .w2spl-pct { opacity: 0; }
  .w2spl-pct { position: absolute; left: 0; right: 0; bottom: 36px; margin: 0; text-align: center; font-size: 13px; letter-spacing: .3em; color: var(--w2spl-gold); font-variant-numeric: tabular-nums; transition: opacity .2s ease; }
  @media (max-width: 767px) {
    .w2spl-thumb { width: 76px; height: 54px; }
    .w2spl-shade { background: linear-gradient(0deg, rgba(14,24,44,.7), rgba(14,24,44,.2)); }
  }

  .w2spl { position: relative; overflow: hidden; }
  .w2spl-cover[hidden] { display: none; }
  .w2spl.is-snap, .w2spl.is-snap * { transition: none !important; }
  .w2spl[data-paused] * { animation-play-state: paused !important; }
  .w2spl-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .w2spl-replay { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px; border-radius: 999px; font: 600 13px/1 ui-sans-serif, system-ui, sans-serif; cursor: pointer; }
  .w2spl-replay:focus-visible, .w2spl a:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) {
    .w2spl *, .w2spl *::before, .w2spl *::after { animation: none !important; transition-duration: 0s !important; transition-delay: 0s !important; }
    .w2spl .w2spl-cover { transition: opacity .45s ease !important; }
    .w2spl.is-out .w2spl-cover { opacity: 0; }
    .w2spl-cover *:not([data-bar]), .w2spl-page * { transform: none !important; opacity: 1; }
  }
`;

export default function NavySplitHalvesPreloader() {
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
    <section ref={ref} className="w2spl">
      <style>{CSS}</style>
      <div className="w2spl-page" data-page="" aria-busy={true}>
        <img className="w2spl-bg" src="https://images.pexels.com/photos/7507131/pexels-photo-7507131.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Hotel room with sheer white curtains drawn across a tall window in soft daylight" width="1600" height="1067" />
        <div className="w2spl-shade"></div>
        <header className="w2spl-nav">
          <a href="#" className="w2spl-brand">The Calder Rooms</a>
          <a href="#" className="w2spl-book">Book a room</a>
        </header>
        <div className="w2spl-card">
          <p className="w2spl-kicker">Harbour Road, open all year</p>
          <h2 className="w2spl-title">Twenty-two quiet rooms above the harbour.</h2>
          <div className="w2spl-row">
            <img className="w2spl-thumb" src="https://images.pexels.com/photos/11063185/pexels-photo-11063185.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Black and white photo of a made bed beside a window with a framed print of trees" width="600" height="400" />
            <p className="w2spl-copy">Linen sheets, a deep bath and breakfast served until eleven.</p>
          </div>
          <button type="button" className="w2spl-replay" data-replay="">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10a6 6 0 1 0 1.8-4.3" /><path d="M4 3.5v3.2h3.2" /></svg>
              Replay intro
            </button>
        </div>
      </div>
      <div className="w2spl-cover" data-cover="" aria-hidden="true">
        <div className="w2spl-half w2spl-top"><p className="w2spl-mark">Calder</p></div>
        <div className="w2spl-half w2spl-bot"><p className="w2spl-mark">Calder</p></div>
        <span className="w2spl-seam"><span data-bar=""></span></span>
        <p className="w2spl-pct"><span data-num="">0</span>%</p>
      </div>
      <p className="w2spl-sr" data-live="" aria-live="polite"></p>
    </section>
  );
}

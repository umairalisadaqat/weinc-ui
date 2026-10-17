import { useEffect, useRef } from "react";

const MIN = 900; // shortest time the cover shows, in ms
const CAP = 1500; // longest the cover waits for images, in ms
const EXIT = 1000; // length of the exit, in ms
// On a real page: give the cover position: fixed; inset: 0 and put data-page on your <main>.

const CSS = `
  .w2shu { --w2shu-cover: #26282b; --w2shu-page: #eceae6; --w2shu-ink: #1d1f22; height: 600px; background: var(--w2shu-page); color: var(--w2shu-ink); font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; }
  .w2shu-page { height: 100%; display: flex; flex-direction: column; padding: 0 clamp(16px, 4vw, 48px); }
  .w2shu-nav { display: flex; align-items: center; justify-content: space-between; height: 72px; border-bottom: 1px solid #d3d0ca; }
  .w2shu-brand { color: inherit; font-weight: 700; letter-spacing: .02em; text-decoration: none; }
  .w2shu-nav ul { display: flex; gap: 28px; margin: 0; padding: 0; list-style: none; }
  .w2shu-nav ul a { color: #4a4d52; font-size: 14px; text-decoration: none; }
  .w2shu-hero { flex: 1; display: grid; grid-template-columns: 1fr 1.15fr; gap: clamp(20px, 4vw, 56px); align-items: center; padding: 28px 0; min-height: 0; }
  .w2shu-kicker { margin: 0; font-size: 12px; letter-spacing: .22em; text-transform: uppercase; color: #5d6066; }
  .w2shu-title { margin: 16px 0 0; font-size: clamp(30px, 4.4vw, 54px); line-height: 1.04; letter-spacing: -.03em; font-weight: 600; }
  .w2shu-copy { margin: 18px 0 0; max-width: 30rem; font-size: 16px; line-height: 1.6; color: #4a4d52; }
  .w2shu-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
  .w2shu-cta { display: inline-flex; align-items: center; min-height: 44px; padding: 0 22px; background: var(--w2shu-ink); color: #f4f2ee; border-radius: 2px; font-size: 14px; font-weight: 600; text-decoration: none; }
  .w2shu-replay { border: 1px solid #b9b5ae; background: transparent; color: var(--w2shu-ink); }
  .w2shu-pics { position: relative; height: 100%; max-height: 430px; }
  .w2shu-pics img { position: absolute; object-fit: cover; display: block; box-shadow: 0 24px 50px -24px rgba(20,20,22,.45); }
  .w2shu-a { inset: 0 18% 14% 0; width: 82%; height: 86%; }
  .w2shu-b { right: 0; bottom: 0; width: 44%; height: 42%; border: 6px solid var(--w2shu-page); }
  .w2shu-pics img { transform: scale(1.06); transition: transform 1.4s cubic-bezier(.2,.7,.2,1) .3s; }
  .w2shu.is-out .w2shu-pics img { transform: none; }
  .w2shu-cover { position: absolute; inset: 0; display: flex; z-index: 2; }
  .w2shu-slat { flex: 1; height: 100%; background: var(--w2shu-cover); transition: transform .7s cubic-bezier(.7,0,.25,1); }
  .w2shu-slat + .w2shu-slat { box-shadow: inset 1px 0 rgba(255,255,255,.04); }
  .w2shu-slat:nth-child(2) { transition-delay: .05s; } .w2shu-slat:nth-child(3) { transition-delay: .1s; }
  .w2shu-slat:nth-child(4) { transition-delay: .15s; } .w2shu-slat:nth-child(5) { transition-delay: .2s; } .w2shu-slat:nth-child(6) { transition-delay: .25s; }
  .w2shu.is-out .w2shu-slat:nth-child(odd) { transform: translateY(-101%); }
  .w2shu.is-out .w2shu-slat:nth-child(even) { transform: translateY(101%); }
  .w2shu-mark { position: absolute; left: clamp(16px, 4vw, 48px); right: clamp(16px, 4vw, 48px); bottom: 40px; color: #e9e6e0; transition: opacity .25s ease, transform .4s ease; }
  .w2shu.is-out .w2shu-mark { opacity: 0; transform: translateY(-12px); }
  .w2shu-name { margin: 0; font-size: 13px; letter-spacing: .3em; text-transform: uppercase; color: #a9a6a0; }
  .w2shu-count { margin: 6px 0 14px; font-size: clamp(56px, 9vw, 112px); font-weight: 300; line-height: 1; letter-spacing: -.04em; font-variant-numeric: tabular-nums; }
  .w2shu-line { display: block; height: 1px; background: rgba(233,230,224,.18); }
  .w2shu-line span { display: block; height: 100%; background: #e9e6e0; transform: scaleX(0); transform-origin: left; }
  @media (max-width: 767px) {
    .w2shu-nav ul li:not(:last-child) { display: none; }
    .w2shu-hero { grid-template-columns: 1fr; align-content: start; gap: 22px; padding-top: 22px; }
    .w2shu-pics { height: 170px; }
    .w2shu-b { display: none; }
    .w2shu-a { inset: 0; width: 100%; height: 100%; }
    .w2shu-copy { font-size: 15px; }
  }

  .w2shu { position: relative; overflow: hidden; }
  .w2shu-cover[hidden] { display: none; }
  .w2shu.is-snap, .w2shu.is-snap * { transition: none !important; }
  .w2shu[data-paused] * { animation-play-state: paused !important; }
  .w2shu-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .w2shu-replay { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px; border-radius: 999px; font: 600 13px/1 ui-sans-serif, system-ui, sans-serif; cursor: pointer; }
  .w2shu-replay:focus-visible, .w2shu a:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) {
    .w2shu *, .w2shu *::before, .w2shu *::after { animation: none !important; transition-duration: 0s !important; transition-delay: 0s !important; }
    .w2shu .w2shu-cover { transition: opacity .45s ease !important; }
    .w2shu.is-out .w2shu-cover { opacity: 0; }
    .w2shu-cover *:not([data-bar]), .w2shu-page * { transform: none !important; opacity: 1; }
  }
`;

export default function GraphiteShutterPreloader() {
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
    <section ref={ref} className="w2shu">
      <style>{CSS}</style>
      <div className="w2shu-page" data-page="" aria-busy={true}>
        <header className="w2shu-nav">
          <a href="#" className="w2shu-brand">Ostrander Hale</a>
          <nav aria-label="Main"><ul><li><a href="#">Houses</a></li><li><a href="#">Practice</a></li><li><a href="#">Contact</a></li></ul></nav>
        </header>
        <div className="w2shu-hero">
          <div className="w2shu-text">
            <p className="w2shu-kicker">Architects, Wellington Road</p>
            <h2 className="w2shu-title">Houses drawn around the light they get.</h2>
            <p className="w2shu-copy">We design new homes and quiet extensions, from the first site visit to the last coat of limewash.</p>
            <div className="w2shu-row"><a href="#" className="w2shu-cta">See recent houses</a><button type="button" className="w2shu-replay" data-replay="">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10a6 6 0 1 0 1.8-4.3" /><path d="M4 3.5v3.2h3.2" /></svg>
              Replay intro
            </button></div>
          </div>
          <div className="w2shu-pics">
            <img className="w2shu-a" src="https://images.pexels.com/photos/18273285/pexels-photo-18273285.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Two-storey modern house with dark cladding and white render behind young trees" width="1200" height="800" />
            <img className="w2shu-b" src="https://images.pexels.com/photos/7031622/pexels-photo-7031622.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Open plan room with a concrete floor and wide windows facing a lake" width="1200" height="800" />
          </div>
        </div>
      </div>
      <div className="w2shu-cover" data-cover="" aria-hidden="true">
        <span className="w2shu-slat"></span><span className="w2shu-slat"></span><span className="w2shu-slat"></span><span className="w2shu-slat"></span><span className="w2shu-slat"></span><span className="w2shu-slat"></span>
        <div className="w2shu-mark">
          <p className="w2shu-name">Ostrander Hale</p>
          <p className="w2shu-count"><span data-num="">0</span>%</p>
          <span className="w2shu-line"><span data-bar=""></span></span>
        </div>
      </div>
      <p className="w2shu-sr" data-live="" aria-live="polite"></p>
    </section>
  );
}

import { useEffect, useRef } from "react";

const MIN = 900; // shortest time the cover shows, in ms
const CAP = 1500; // longest the cover waits for images, in ms
const EXIT = 1100; // length of the exit, in ms
// On a real page: give the cover position: fixed; inset: 0 and put data-page on your <main>.

const CSS = `
  .w2wip { --w2wip-front: #3a231a; --w2wip-back: #b4552f; --w2wip-page: #f5ece2; height: 600px; background: var(--w2wip-page); color: #2b1a13; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; }
  .w2wip-page { height: 100%; display: flex; flex-direction: column; padding: 0 clamp(16px, 4vw, 48px); }
  .w2wip-nav { display: flex; align-items: center; justify-content: space-between; height: 72px; }
  .w2wip-brand { color: var(--w2wip-back); font-family: ui-serif, Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 700; text-decoration: none; }
  .w2wip-nav ul { display: flex; gap: 26px; margin: 0; padding: 0; list-style: none; }
  .w2wip-nav ul a { color: #5a4135; font-size: 14px; text-decoration: none; }
  .w2wip-hero { flex: 1; display: grid; grid-template-columns: 1fr 1.3fr; gap: clamp(20px, 4vw, 56px); align-items: center; min-height: 0; padding-bottom: 24px; }
  .w2wip-title { margin: 0; font-family: ui-serif, Georgia, 'Times New Roman', serif; font-size: clamp(30px, 4.2vw, 52px); line-height: 1.08; font-weight: 400; }
  .w2wip-copy { margin: 18px 0 0; font-size: 16px; line-height: 1.6; color: #5a4135; max-width: 28rem; }
  .w2wip-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 26px; }
  .w2wip-cta { display: inline-flex; align-items: center; min-height: 44px; padding: 0 22px; border-radius: 999px; background: #9e4423; color: #fff8f2; font-size: 14px; font-weight: 600; text-decoration: none; }
  .w2wip-replay { border: 1px solid #d9c3b2; background: #fffaf5; color: #3a231a; }
  .w2wip-pics { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .w2wip-pics figure { margin: 0; }
  
  .w2wip-pics img { display: block; width: 100%; height: auto; aspect-ratio: 3 / 4; object-fit: cover; border-radius: 3px; transform: translateY(18px); opacity: .001; transition: transform .9s cubic-bezier(.2,.75,.15,1) .35s, opacity .6s ease .35s; }
  .w2wip-pics figure + figure img { transition-delay: .48s; margin-top: 36px; }
  .w2wip.is-out .w2wip-pics img { transform: none; opacity: 1; }
  .w2wip-pics figcaption { margin-top: 8px; font-size: 13px; color: #6b4e40; }
  .w2wip-cover { position: absolute; inset: 0; z-index: 2; }
  .w2wip-back, .w2wip-front { position: absolute; inset: 0; transition: transform .75s cubic-bezier(.75,0,.2,1); }
  .w2wip-back { background: var(--w2wip-back); transition-delay: .16s; }
  .w2wip-front { background: var(--w2wip-front); color: #f3e3d6; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; }
  .w2wip.is-out .w2wip-back, .w2wip.is-out .w2wip-front { transform: translateX(101%); }
  .w2wip-word { margin: 0; font-family: ui-serif, Georgia, 'Times New Roman', serif; font-size: clamp(48px, 9vw, 104px); font-weight: 700; letter-spacing: -.02em; }
  .w2wip-pct { margin: 0; font-size: 13px; letter-spacing: .18em; text-transform: uppercase; color: #d9b9a4; font-variant-numeric: tabular-nums; }
  @media (max-width: 767px) {
    .w2wip-nav ul li:not(:first-child) { display: none; }
    .w2wip-hero { grid-template-columns: 1fr; align-content: start; gap: 20px; }
    .w2wip-pics img { aspect-ratio: 4 / 3; }
    .w2wip-pics figure + figure img { margin-top: 0; }
    .w2wip-copy { font-size: 15px; margin-top: 12px; }
    .w2wip-row { margin-top: 18px; }
  }

  .w2wip { position: relative; overflow: hidden; }
  .w2wip-cover[hidden] { display: none; }
  .w2wip.is-snap, .w2wip.is-snap * { transition: none !important; }
  .w2wip[data-paused] * { animation-play-state: paused !important; }
  .w2wip-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .w2wip-replay { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px; border-radius: 999px; font: 600 13px/1 ui-sans-serif, system-ui, sans-serif; cursor: pointer; }
  .w2wip-replay:focus-visible, .w2wip a:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) {
    .w2wip *, .w2wip *::before, .w2wip *::after { animation: none !important; transition-duration: 0s !important; transition-delay: 0s !important; }
    .w2wip .w2wip-cover { transition: opacity .45s ease !important; }
    .w2wip.is-out .w2wip-cover { opacity: 0; }
    .w2wip-cover *:not([data-bar]), .w2wip-page * { transform: none !important; opacity: 1; }
  }
`;

export default function TerracottaDoubleWipePreloader() {
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
    <section ref={ref} className="w2wip">
      <style>{CSS}</style>
      <div className="w2wip-page" data-page="" aria-busy={true}>
        <header className="w2wip-nav">
          <a href="#" className="w2wip-brand">Clayhouse</a>
          <nav aria-label="Shop"><ul><li><a href="#">Vases</a></li><li><a href="#">Tableware</a></li><li><a href="#">Classes</a></li></ul></nav>
        </header>
        <div className="w2wip-hero">
          <div>
            <h2 className="w2wip-title">Stoneware thrown and glazed by hand on Hollis Street.</h2>
            <p className="w2wip-copy">New vases come out of the kiln every second Friday. Each one is signed on the foot.</p>
            <div className="w2wip-row"><a href="#" className="w2wip-cta">Shop this firing</a><button type="button" className="w2wip-replay" data-replay="">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10a6 6 0 1 0 1.8-4.3" /><path d="M4 3.5v3.2h3.2" /></svg>
              Replay intro
            </button></div>
          </div>
          <div className="w2wip-pics">
            <figure><img src="https://images.pexels.com/photos/15122643/pexels-photo-15122643.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Rows of matte white ceramic vases in different shapes on a wooden shelf" width="1200" height="800" /><figcaption>White matte, tall forms</figcaption></figure>
            <figure><img src="https://images.pexels.com/photos/8063872/pexels-photo-8063872.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Glazed white vases and jugs lined up on a pottery studio shelf" width="1200" height="800" /><figcaption>Gloss glaze, small jugs</figcaption></figure>
          </div>
        </div>
      </div>
      <div className="w2wip-cover" data-cover="" aria-hidden="true">
        <span className="w2wip-back"></span>
        <div className="w2wip-front">
          <p className="w2wip-word">Clayhouse</p>
          <p className="w2wip-pct">Unloading the kiln <span data-num="">0</span>%</p>
        </div>
      </div>
      <p className="w2wip-sr" data-live="" aria-live="polite"></p>
    </section>
  );
}

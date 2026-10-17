import { useEffect, useRef } from "react";

const MIN = 1000; // shortest time the cover shows, in ms
const CAP = 1500; // longest the cover waits for images, in ms
const EXIT = 1100; // length of the exit, in ms
// On a real page: give the cover position: fixed; inset: 0 and put data-page on your <main>.

const CSS = `
  .w2cnt { --w2cnt-paper: #f2ece1; --w2cnt-ink: #211c16; --w2cnt-rust: #9a4a26; height: 600px; background: var(--w2cnt-paper); color: var(--w2cnt-ink); font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; }
  .w2cnt-page { height: 100%; display: flex; flex-direction: column; padding: 0 clamp(16px, 4vw, 48px); }
  .w2cnt-nav { display: flex; align-items: center; justify-content: space-between; height: 72px; }
  .w2cnt-brand { color: inherit; font-family: ui-serif, Georgia, 'Times New Roman', serif; font-size: 20px; font-style: italic; text-decoration: none; }
  .w2cnt-link { color: var(--w2cnt-rust); font-size: 14px; font-weight: 600; text-underline-offset: 4px; display: inline-flex; align-items: center; min-height: 40px; }
  .w2cnt-hero { flex: 1; display: grid; grid-template-columns: 1.4fr 1fr; gap: clamp(20px, 4vw, 64px); align-items: end; padding-bottom: 44px; min-height: 0; }
  .w2cnt-title { margin: 0; font-size: clamp(44px, 8.4vw, 124px); line-height: .94; letter-spacing: -.045em; font-weight: 600; }
  .w2cnt-mask { display: block; overflow: hidden; padding-bottom: .06em; }
  .w2cnt-line { display: block; transform: translateY(105%); transition: transform .9s cubic-bezier(.2,.75,.15,1); }
  .w2cnt-mask:nth-child(2) .w2cnt-line { transition-delay: .08s; } .w2cnt-mask:nth-child(3) .w2cnt-line { transition-delay: .16s; color: var(--w2cnt-rust); }
  .w2cnt.is-out .w2cnt-line { transform: none; }
  .w2cnt-frame { overflow: hidden; aspect-ratio: 4 / 3; border-radius: 4px; }
  .w2cnt-frame img { width: 100%; height: 100%; object-fit: cover; display: block; transform: scale(1.08); transition: transform 1.3s cubic-bezier(.2,.75,.15,1) .2s; }
  .w2cnt.is-out .w2cnt-frame img { transform: none; }
  .w2cnt-copy { margin: 16px 0 14px; font-size: 15px; line-height: 1.6; color: #4b4339; }
  .w2cnt-replay { border: 1px solid #c9bfae; background: #fbf8f2; color: var(--w2cnt-ink); }
  .w2cnt-cover { position: absolute; inset: 0; z-index: 2; background: var(--w2cnt-paper); display: flex; flex-direction: column; justify-content: flex-end; padding: 0 clamp(16px, 4vw, 48px) 44px; transition: opacity .5s ease .45s; }
  .w2cnt.is-out .w2cnt-cover { opacity: 0; }
  .w2cnt-label { position: absolute; top: 26px; left: clamp(16px, 4vw, 48px); margin: 0; font-size: 13px; color: #6a6054; transition: opacity .3s ease; }
  .w2cnt.is-out .w2cnt-label { opacity: 0; }
  .w2cnt-big { margin: 0; font-size: clamp(110px, 22vw, 300px); line-height: .9; font-weight: 600; letter-spacing: -.06em; font-variant-numeric: tabular-nums; }
  .w2cnt-num { display: block; transition: transform .6s cubic-bezier(.6,0,.3,1); }
  .w2cnt-num small { font-size: .3em; letter-spacing: 0; vertical-align: top; color: var(--w2cnt-rust); }
  .w2cnt.is-out .w2cnt-num { transform: translateY(-105%); }
  .w2cnt-rule { display: block; height: 2px; margin-top: 18px; background: #ddd3c3; overflow: hidden; }
  .w2cnt-rule span { display: block; height: 100%; background: var(--w2cnt-ink); transform: scaleX(0); transform-origin: left; }
  @media (max-width: 767px) {
    .w2cnt-hero { grid-template-columns: 1fr; align-content: end; gap: 18px; padding-bottom: 28px; }
    .w2cnt-frame { aspect-ratio: 16 / 9; max-height: 170px; width: 100%; }
    .w2cnt-copy { margin: 12px 0 10px; }
  }

  .w2cnt { position: relative; overflow: hidden; }
  .w2cnt-cover[hidden] { display: none; }
  .w2cnt.is-snap, .w2cnt.is-snap * { transition: none !important; }
  .w2cnt[data-paused] * { animation-play-state: paused !important; }
  .w2cnt-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .w2cnt-replay { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px; border-radius: 999px; font: 600 13px/1 ui-sans-serif, system-ui, sans-serif; cursor: pointer; }
  .w2cnt-replay:focus-visible, .w2cnt a:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) {
    .w2cnt *, .w2cnt *::before, .w2cnt *::after { animation: none !important; transition-duration: 0s !important; transition-delay: 0s !important; }
    .w2cnt .w2cnt-cover { transition: opacity .45s ease !important; }
    .w2cnt.is-out .w2cnt-cover { opacity: 0; }
    .w2cnt-cover *:not([data-bar]), .w2cnt-page * { transform: none !important; opacity: 1; }
  }
`;

export default function PaperCounterHandoverPreloader() {
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
    <section ref={ref} className="w2cnt">
      <style>{CSS}</style>
      <div className="w2cnt-page" data-page="" aria-busy={true}>
        <header className="w2cnt-nav">
          <a href="#" className="w2cnt-brand">Marrow &amp; Pine</a>
          <a href="#" className="w2cnt-link">Start a project</a>
        </header>
        <div className="w2cnt-hero">
          <h2 className="w2cnt-title">
            <span className="w2cnt-mask"><span className="w2cnt-line">Packaging</span></span>
            <span className="w2cnt-mask"><span className="w2cnt-line">people keep</span></span>
            <span className="w2cnt-mask"><span className="w2cnt-line">on the shelf.</span></span>
          </h2>
          <div className="w2cnt-side">
            <div className="w2cnt-frame"><img src="https://images.pexels.com/photos/414974/pexels-photo-414974.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Desk seen from above with a laptop, colour swatches, pencils and sketches" width="1200" height="800" /></div>
            <p className="w2cnt-copy">A four-person studio for labels, boxes and the small printed things that go inside them.</p>
            <button type="button" className="w2cnt-replay" data-replay="">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10a6 6 0 1 0 1.8-4.3" /><path d="M4 3.5v3.2h3.2" /></svg>
              Replay intro
            </button>
          </div>
        </div>
      </div>
      <div className="w2cnt-cover" data-cover="" aria-hidden="true">
        <p className="w2cnt-label">Marrow &amp; Pine, design studio</p>
        <p className="w2cnt-big"><span className="w2cnt-mask"><span className="w2cnt-num"><span data-num="">0</span><small>%</small></span></span></p>
        <span className="w2cnt-rule"><span data-bar=""></span></span>
      </div>
      <p className="w2cnt-sr" data-live="" aria-live="polite"></p>
    </section>
  );
}

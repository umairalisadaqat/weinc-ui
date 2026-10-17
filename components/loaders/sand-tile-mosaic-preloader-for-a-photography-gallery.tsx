import { useEffect, useRef } from "react";

const MIN = 1000; // shortest time the cover shows, in ms
const CAP = 1500; // longest the cover waits for images, in ms
const EXIT = 1050; // length of the exit, in ms
// On a real page: give the cover position: fixed; inset: 0 and put data-page on your <main>.

const CSS = `
  .w2til { --w2til-tile: #2b251d; --w2til-sand: #ebe0cc; --w2til-ink: #241f18; height: 600px; background: var(--w2til-sand); color: var(--w2til-ink); font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; }
  .w2til-page { height: 100%; display: flex; flex-direction: column; padding: 0 clamp(16px, 4vw, 48px) clamp(16px, 3vw, 36px); }
  .w2til-nav { display: flex; align-items: center; justify-content: space-between; height: 68px; }
  .w2til-brand { color: inherit; font-weight: 700; font-size: 15px; letter-spacing: .06em; text-transform: uppercase; text-decoration: none; }
  .w2til-link { color: inherit; font-size: 14px; display: inline-flex; align-items: center; min-height: 40px; text-underline-offset: 4px; }
  .w2til-hero { flex: 1; display: grid; grid-template-columns: 1.5fr 1fr; gap: clamp(16px, 3vw, 40px); min-height: 0; }
  .w2til-main { width: 100%; height: 100%; min-height: 0; object-fit: cover; display: block; border-radius: 2px; }
  .w2til-text { display: flex; flex-direction: column; justify-content: flex-end; }
  .w2til-kicker { margin: 0; font-size: 12px; letter-spacing: .2em; text-transform: uppercase; color: #6a5c45; }
  .w2til-title { margin: 8px 0 0; font-family: ui-serif, Georgia, 'Times New Roman', serif; font-size: clamp(40px, 5.6vw, 76px); line-height: 1; font-weight: 400; }
  .w2til-copy { margin: 14px 0 18px; font-size: 15px; line-height: 1.6; color: #4b4133; }
  .w2til-small { width: 100%; height: auto; aspect-ratio: 2 / 1; object-fit: cover; margin-bottom: 18px; border-radius: 2px; }
  .w2til-replay { align-self: flex-start; border: 1px solid #bfae90; background: #f5eee1; color: var(--w2til-ink); }
  .w2til-cover { position: absolute; inset: 0; z-index: 2; }
  .w2til-grid { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(4, 1fr); }
  .w2til-tile { background: var(--w2til-tile); transition: transform .5s cubic-bezier(.6,0,.3,1), opacity .5s ease; margin: -1px; }
  .w2til-tile:nth-child(1) { transition-delay: 0.000s; } .w2til-tile:nth-child(2) { transition-delay: 0.045s; } .w2til-tile:nth-child(3) { transition-delay: 0.090s; } .w2til-tile:nth-child(4) { transition-delay: 0.135s; } .w2til-tile:nth-child(5) { transition-delay: 0.180s; } .w2til-tile:nth-child(6) { transition-delay: 0.225s; } .w2til-tile:nth-child(7) { transition-delay: 0.045s; } .w2til-tile:nth-child(8) { transition-delay: 0.090s; } .w2til-tile:nth-child(9) { transition-delay: 0.135s; } .w2til-tile:nth-child(10) { transition-delay: 0.180s; } .w2til-tile:nth-child(11) { transition-delay: 0.225s; } .w2til-tile:nth-child(12) { transition-delay: 0.270s; } .w2til-tile:nth-child(13) { transition-delay: 0.090s; } .w2til-tile:nth-child(14) { transition-delay: 0.135s; } .w2til-tile:nth-child(15) { transition-delay: 0.180s; } .w2til-tile:nth-child(16) { transition-delay: 0.225s; } .w2til-tile:nth-child(17) { transition-delay: 0.270s; } .w2til-tile:nth-child(18) { transition-delay: 0.315s; } .w2til-tile:nth-child(19) { transition-delay: 0.135s; } .w2til-tile:nth-child(20) { transition-delay: 0.180s; } .w2til-tile:nth-child(21) { transition-delay: 0.225s; } .w2til-tile:nth-child(22) { transition-delay: 0.270s; } .w2til-tile:nth-child(23) { transition-delay: 0.315s; } .w2til-tile:nth-child(24) { transition-delay: 0.360s; }
  .w2til.is-out .w2til-tile { transform: scale(0); opacity: 0; }
  .w2til-pct { position: absolute; left: 0; right: 0; top: 50%; margin: -10px 0 0; text-align: center; font-size: 15px; letter-spacing: .24em; text-transform: uppercase; color: #f1e8d8; font-variant-numeric: tabular-nums; transition: opacity .2s ease; }
  .w2til.is-out .w2til-pct { opacity: 0; }
  @media (max-width: 767px) {
    .w2til-hero { grid-template-columns: 1fr; grid-template-rows: 230px auto; gap: 18px; }
    .w2til-text { justify-content: flex-start; }
    .w2til-small { display: none; }
    .w2til-copy { margin: 10px 0 14px; }
  }

  .w2til { position: relative; overflow: hidden; }
  .w2til-cover[hidden] { display: none; }
  .w2til.is-snap, .w2til.is-snap * { transition: none !important; }
  .w2til[data-paused] * { animation-play-state: paused !important; }
  .w2til-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .w2til-replay { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px; border-radius: 999px; font: 600 13px/1 ui-sans-serif, system-ui, sans-serif; cursor: pointer; }
  .w2til-replay:focus-visible, .w2til a:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) {
    .w2til *, .w2til *::before, .w2til *::after { animation: none !important; transition-duration: 0s !important; transition-delay: 0s !important; }
    .w2til .w2til-cover { transition: opacity .45s ease !important; }
    .w2til.is-out .w2til-cover { opacity: 0; }
    .w2til-cover *:not([data-bar]), .w2til-page * { transform: none !important; opacity: 1; }
  }
`;

export default function SandTileMosaicPreloader() {
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
    <section ref={ref} className="w2til">
      <style>{CSS}</style>
      <div className="w2til-page" data-page="" aria-busy={true}>
        <header className="w2til-nav">
          <a href="#" className="w2til-brand">Field Notes Gallery</a>
          <a href="#" className="w2til-link">Visit</a>
        </header>
        <div className="w2til-hero">
          <img className="w2til-main" src="https://images.pexels.com/photos/6877573/pexels-photo-6877573.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Narrow corridor lined with framed photographs under warm lights and a polished wooden floor" width="1200" height="800" />
          <div className="w2til-text">
            <p className="w2til-kicker">Now showing, ground floor</p>
            <h2 className="w2til-title">Quiet Rooms</h2>
            <p className="w2til-copy">Black and white photographs of empty interiors, hung close together along the long corridor.</p>
            <img className="w2til-small" src="https://images.pexels.com/photos/310435/pexels-photo-310435.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Ten small black and white photographs in black frames hung in two rows on a white wall" width="800" height="540" />
            <button type="button" className="w2til-replay" data-replay="">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10a6 6 0 1 0 1.8-4.3" /><path d="M4 3.5v3.2h3.2" /></svg>
              Replay intro
            </button>
          </div>
        </div>
      </div>
      <div className="w2til-cover" data-cover="" aria-hidden="true">
        <div className="w2til-grid"><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span><span className="w2til-tile"></span></div>
        <p className="w2til-pct">Hanging the prints <span data-num="">0</span>%</p>
      </div>
      <p className="w2til-sr" data-live="" aria-live="polite"></p>
    </section>
  );
}

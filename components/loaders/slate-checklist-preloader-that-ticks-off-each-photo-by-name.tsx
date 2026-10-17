import { useEffect, useRef } from "react";

const MIN = 1100; // shortest time the cover shows, in ms
const CAP = 1500; // longest the cover waits for images, in ms
const EXIT = 900; // length of the exit, in ms
// On a real page: give the cover position: fixed; inset: 0 and put data-page on your <main>.

const CSS = `
  .w2lst { --w2lst-slate: #2f3a45; --w2lst-white: #ffffff; --w2lst-accent: #3f6f8f; height: 600px; background: var(--w2lst-white); color: var(--w2lst-slate); font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; }
  .w2lst-page { height: 100%; display: flex; flex-direction: column; padding: 0 clamp(16px, 4vw, 48px) clamp(16px, 3vw, 36px); }
  .w2lst-nav { display: flex; align-items: center; justify-content: space-between; height: 72px; }
  .w2lst-brand { color: inherit; font-weight: 700; text-decoration: none; }
  .w2lst-nav ul { display: flex; gap: 26px; margin: 0; padding: 0; list-style: none; }
  .w2lst-nav ul a { color: #4f5b67; font-size: 14px; text-decoration: none; }
  .w2lst-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin: 18px 0 26px; }
  .w2lst-title { margin: 0; max-width: 40rem; font-size: clamp(30px, 4.6vw, 58px); line-height: 1.04; letter-spacing: -.03em; font-weight: 600; }
  .w2lst-replay { flex: none; border: 1px solid #c9d1d9; background: #f5f7f9; color: var(--w2lst-slate); }
  .w2lst-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 0; padding: 0; list-style: none; }
  .w2lst-grid li { display: flex; flex-direction: column; min-height: 0; transform: translateY(26px); opacity: .001; transition: transform .9s cubic-bezier(.2,.75,.15,1) .25s, opacity .6s ease .25s; }
  .w2lst-grid li:nth-child(2) { transition-delay: .35s; } .w2lst-grid li:nth-child(3) { transition-delay: .45s; }
  .w2lst.is-out .w2lst-grid li { transform: none; opacity: 1; }
  .w2lst-grid img { width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: cover; display: block; border-radius: 6px; }
  .w2lst-grid p { margin: 10px 0 0; font-size: 14px; color: #4f5b67; }
  .w2lst-cover { position: absolute; inset: 0; z-index: 2; background: var(--w2lst-white); display: flex; align-items: center; justify-content: center; padding: 16px; transition: opacity .45s ease .35s; }
  .w2lst.is-out .w2lst-cover { opacity: 0; }
  .w2lst-box { width: min(100%, 380px); transition: transform .6s cubic-bezier(.6,0,.3,1), opacity .4s ease; }
  .w2lst.is-out .w2lst-box { transform: translateY(-18px); opacity: 0; }
  .w2lst-label { margin: 0 0 18px; font-size: 12px; letter-spacing: .22em; text-transform: uppercase; color: #5d6875; }
  .w2lst-list { margin: 0; padding: 0; list-style: none; }
  .w2lst-list li { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid #e3e7eb; font-size: 15px; color: #6b7681; transition: color .3s ease; }
  .w2lst-list li.is-on { color: var(--w2lst-slate); }
  .w2lst-dot { position: relative; display: grid; place-items: center; width: 22px; height: 22px; flex: none; border-radius: 50%; border: 1.5px solid #c3cbd3; color: #fff; }
  .w2lst-dot::before { content: ""; position: absolute; inset: -1.5px; border-radius: 50%; background: var(--w2lst-accent); transform: scale(0); transition: transform .35s cubic-bezier(.3,1.4,.5,1); }
  .w2lst-dot svg { position: relative; opacity: 0; transition: opacity .2s ease .1s; }
  .w2lst-list li.is-on .w2lst-dot::before { transform: scale(1); }
  .w2lst-list li.is-on .w2lst-dot svg { opacity: 1; }
  .w2lst-meter { display: flex; align-items: center; gap: 14px; margin-top: 14px; }
  .w2lst-bar { flex: 1; height: 3px; border-radius: 3px; background: #e3e7eb; overflow: hidden; }
  .w2lst-bar span { display: block; height: 100%; background: var(--w2lst-accent); transform: scaleX(0); transform-origin: left; }
  .w2lst-pct { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; min-width: 3.2em; text-align: right; }
  @media (max-width: 767px) {
    .w2lst-nav ul li:not(:last-child) { display: none; }
    .w2lst-head { flex-direction: column; align-items: flex-start; margin: 10px 0 18px; }
    .w2lst-grid { grid-template-columns: 1fr 1fr; }
    .w2lst-grid li:nth-child(3) { display: none; }
    .w2lst-grid p { font-size: 13px; }
  }

  .w2lst { position: relative; overflow: hidden; }
  .w2lst-cover[hidden] { display: none; }
  .w2lst.is-snap, .w2lst.is-snap * { transition: none !important; }
  .w2lst[data-paused] * { animation-play-state: paused !important; }
  .w2lst-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .w2lst-replay { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px; border-radius: 999px; font: 600 13px/1 ui-sans-serif, system-ui, sans-serif; cursor: pointer; }
  .w2lst-replay:focus-visible, .w2lst a:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) {
    .w2lst *, .w2lst *::before, .w2lst *::after { animation: none !important; transition-duration: 0s !important; transition-delay: 0s !important; }
    .w2lst .w2lst-cover { transition: opacity .45s ease !important; }
    .w2lst.is-out .w2lst-cover { opacity: 0; }
    .w2lst-cover *:not([data-bar]), .w2lst-page * { transform: none !important; opacity: 1; }
  }
`;

export default function SlateChecklistPreloader() {
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
    <section ref={ref} className="w2lst">
      <style>{CSS}</style>
      <div className="w2lst-page" data-page="" aria-busy={true}>
        <header className="w2lst-nav">
          <a href="#" className="w2lst-brand">Northlight Interiors</a>
          <nav aria-label="Main"><ul><li><a href="#">Projects</a></li><li><a href="#">Studio</a></li><li><a href="#">Enquire</a></li></ul></nav>
        </header>
        <div className="w2lst-head">
          <h2 className="w2lst-title">Calm rooms for busy households.</h2>
          <button type="button" className="w2lst-replay" data-replay="">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10a6 6 0 1 0 1.8-4.3" /><path d="M4 3.5v3.2h3.2" /></svg>
              Replay intro
            </button>
        </div>
        <ul className="w2lst-grid">
          <li><img src="https://images.pexels.com/photos/12277014/pexels-photo-12277014.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Beige sofa beside a low wooden console with a potted plant against a white wall" width="1200" height="675" /><p>Living room, oak console</p></li>
          <li><img src="https://images.pexels.com/photos/7195900/pexels-photo-7195900.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Long wooden dining table with black chairs next to a bright white kitchen" width="1200" height="800" /><p>Dining room, walnut table</p></li>
          <li><img src="https://images.pexels.com/photos/7031622/pexels-photo-7031622.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Open plan room with a concrete floor and tall windows looking out over a lake" width="1200" height="800" /><p>Lake house, open plan</p></li>
        </ul>
      </div>
      <div className="w2lst-cover" data-cover="" aria-hidden="true">
        <div className="w2lst-box">
          <p className="w2lst-label">Northlight Interiors</p>
          <ul className="w2lst-list">
            <li data-tick=""><span className="w2lst-dot"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg></span>Living room, oak console</li>
            <li data-tick=""><span className="w2lst-dot"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg></span>Dining room, walnut table</li>
            <li data-tick=""><span className="w2lst-dot"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg></span>Lake house, open plan</li>
          </ul>
          <div className="w2lst-meter"><span className="w2lst-bar"><span data-bar=""></span></span><span className="w2lst-pct"><span data-num="">0</span>%</span></div>
        </div>
      </div>
      <p className="w2lst-sr" data-live="" aria-live="polite"></p>
    </section>
  );
}

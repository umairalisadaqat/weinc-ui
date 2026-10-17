import { useEffect, useRef } from "react";

const MIN = 900; // shortest time the cover shows, in ms
const CAP = 1500; // longest the cover waits for images, in ms
const EXIT = 1100; // length of the exit, in ms
// On a real page: give the cover position: fixed; inset: 0 and put data-page on your <main>.

const CSS = `
  .w2stk { --w2stk-rye: #3b2517; --w2stk-crust: #c7843f; --w2stk-flour: #f3e9d6; height: 600px; background: var(--w2stk-flour); color: #2c1c11; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; }
  .w2stk-page { height: 100%; display: flex; flex-direction: column; padding: 0 clamp(16px, 4vw, 48px); }
  .w2stk-nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 72px; }
  .w2stk-brand { color: inherit; font-family: ui-serif, Georgia, 'Times New Roman', serif; font-size: 20px; font-weight: 700; text-decoration: none; }
  .w2stk-link { display: inline-flex; align-items: center; min-height: 40px; color: #8a4b17; font-size: 14px; font-weight: 600; text-underline-offset: 4px; }
  .w2stk-hero { flex: 1; display: grid; grid-template-columns: 1fr 1.1fr; gap: clamp(20px, 4vw, 56px); align-items: center; min-height: 0; padding-bottom: 24px; }
  .w2stk-title { margin: 0; font-family: ui-serif, Georgia, 'Times New Roman', serif; font-size: clamp(32px, 4.6vw, 58px); line-height: 1.02; font-weight: 700; letter-spacing: -.015em; }
  .w2stk-copy { margin: 16px 0 0; font-size: 16px; line-height: 1.6; color: #5a4331; max-width: 28rem; }
  .w2stk-hours { display: flex; gap: 28px; margin: 20px 0 22px; }
  .w2stk-hours dt { font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: #7a5a3f; }
  .w2stk-hours dd { margin: 4px 0 0; font-size: 15px; font-weight: 600; }
  .w2stk-replay { border: 1px solid #d8c19e; background: #fbf5ea; color: #2c1c11; }
  .w2stk-pics { position: relative; height: 100%; max-height: 440px; }
  .w2stk-pics img { position: absolute; object-fit: cover; display: block; border-radius: 4px; }
  .w2stk-a { top: 0; right: 0; width: 86%; height: 78%; transform: translateY(30px); transition: transform 1.1s cubic-bezier(.2,.75,.15,1) .5s; }
  .w2stk-b { left: 0; bottom: 0; width: 46%; height: 40%; border: 6px solid var(--w2stk-flour); box-shadow: 0 20px 40px -18px rgba(60,35,15,.5); transform: translateY(60px); transition: transform 1.1s cubic-bezier(.2,.75,.15,1) .6s; }
  .w2stk.is-out .w2stk-a, .w2stk.is-out .w2stk-b { transform: none; }
  .w2stk-cover { position: absolute; inset: 0; z-index: 2; }
  .w2stk-l1, .w2stk-l2, .w2stk-l3 { position: absolute; inset: 0; transition: transform .8s cubic-bezier(.76,0,.24,1); }
  .w2stk-l3 { background: var(--w2stk-flour); transition-delay: .26s; box-shadow: 0 10px 0 #e2d3b8; }
  .w2stk-l2 { background: var(--w2stk-crust); transition-delay: .13s; }
  .w2stk-l1 { background: var(--w2stk-rye); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--w2stk-flour); }
  .w2stk.is-out .w2stk-l1, .w2stk.is-out .w2stk-l2, .w2stk.is-out .w2stk-l3 { transform: translateY(-104%); }
  .w2stk-word { margin: 0; font-family: ui-serif, Georgia, 'Times New Roman', serif; font-size: clamp(44px, 9vw, 110px); font-weight: 700; letter-spacing: -.02em; text-align: center; line-height: 1; padding: 0 16px; }
  .w2stk-pct { margin: 0; font-size: 13px; letter-spacing: .2em; text-transform: uppercase; color: #e0c39b; font-variant-numeric: tabular-nums; }
  @media (max-width: 767px) {
    .w2stk-nav { height: 64px; }
    .w2stk-brand { font-size: 17px; }
    .w2stk-hero { grid-template-columns: 1fr; align-content: start; gap: 18px; }
    .w2stk-pics { height: 160px; order: -1; }
    .w2stk-b { display: none; }
    .w2stk-a { width: 100%; height: 100%; }
    .w2stk-copy { font-size: 15px; margin-top: 12px; }
    .w2stk-hours { margin: 14px 0 16px; }
  }

  .w2stk { position: relative; overflow: hidden; }
  .w2stk-cover[hidden] { display: none; }
  .w2stk.is-snap, .w2stk.is-snap * { transition: none !important; }
  .w2stk[data-paused] * { animation-play-state: paused !important; }
  .w2stk-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .w2stk-replay { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px; border-radius: 999px; font: 600 13px/1 ui-sans-serif, system-ui, sans-serif; cursor: pointer; }
  .w2stk-replay:focus-visible, .w2stk a:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) {
    .w2stk *, .w2stk *::before, .w2stk *::after { animation: none !important; transition-duration: 0s !important; transition-delay: 0s !important; }
    .w2stk .w2stk-cover { transition: opacity .45s ease !important; }
    .w2stk.is-out .w2stk-cover { opacity: 0; }
    .w2stk-cover *:not([data-bar]), .w2stk-page * { transform: none !important; opacity: 1; }
  }
`;

export default function BakeryLayeredLiftPreloader() {
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
    <section ref={ref} className="w2stk">
      <style>{CSS}</style>
      <div className="w2stk-page" data-page="" aria-busy={true}>
        <header className="w2stk-nav">
          <a href="#" className="w2stk-brand">Bramble Street Bakery</a>
          <a href="#" className="w2stk-link">Order for Saturday</a>
        </header>
        <div className="w2stk-hero">
          <div className="w2stk-text">
            <h2 className="w2stk-title">Sourdough out of the oven by seven.</h2>
            <p className="w2stk-copy">Country loaves, rye and a short list of pastries, baked through the night in a stone deck oven.</p>
            <dl className="w2stk-hours"><div><dt>Tue to Fri</dt><dd>7 am to 3 pm</dd></div><div><dt>Sat and Sun</dt><dd>8 am to 1 pm</dd></div></dl>
            <button type="button" className="w2stk-replay" data-replay="">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10a6 6 0 1 0 1.8-4.3" /><path d="M4 3.5v3.2h3.2" /></svg>
              Replay intro
            </button>
          </div>
          <div className="w2stk-pics">
            <img className="w2stk-a" src="https://images.pexels.com/photos/1383908/pexels-photo-1383908.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Rows of crusty rustic bread loaves stacked on a wooden board" width="1200" height="800" />
            <img className="w2stk-b" src="https://images.pexels.com/photos/10481790/pexels-photo-10481790.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Round loaves baking on the shelves of a lit commercial oven" width="800" height="530" />
          </div>
        </div>
      </div>
      <div className="w2stk-cover" data-cover="" aria-hidden="true">
        <span className="w2stk-l3"></span>
        <span className="w2stk-l2"></span>
        <div className="w2stk-l1">
          <p className="w2stk-word">Bramble Street</p>
          <p className="w2stk-pct">Warming the oven <span data-num="">0</span>%</p>
        </div>
      </div>
      <p className="w2stk-sr" data-live="" aria-live="polite"></p>
    </section>
  );
}

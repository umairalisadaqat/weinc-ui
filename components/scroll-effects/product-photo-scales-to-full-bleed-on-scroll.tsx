import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version. The CSS comments name the values to change.
const STYLES = `
  /* Change these: --w7scl-from (starting scale), --w7scl-bg, --w7scl-ink, --w7scl-brass, and .w7scl-stage height. */
  .w7scl { --w7scl-from: .42; --w7scl-bg: #1c1d20; --w7scl-ink: #ecebe7; --w7scl-brass: #d2ad74;
    position: relative; height: 640px; overflow-y: auto; overflow-x: hidden; background: var(--w7scl-bg); color: var(--w7scl-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; scrollbar-color: #3a3c41 transparent; }
  /* To run on page scroll: delete height and overflow above (view() then follows the page) and read the window in the fallback. */
  .w7scl:focus-visible { outline: 3px solid var(--w7scl-brass); outline-offset: -3px; }
  .w7scl-hint { position: sticky; top: 0; height: 0; z-index: 3; display: flex; justify-content: flex-end; pointer-events: none; }
  .w7scl-hint span { margin: 14px 14px 0 0; padding: 5px 12px; border-radius: 999px; background: rgba(236,235,231,.12); font-size: 12px; transition: opacity .5s; }
  .w7scl[data-touched] .w7scl-hint span { opacity: 0; }
  .w7scl-wrap { max-width: 60rem; margin: 0 auto; padding: 52px 20px 36px; text-align: center; }
  .w7scl-eye { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; color: var(--w7scl-brass); }
  .w7scl-h { margin: 12px 0 0; font-size: clamp(2.2rem, 5.6vw, 4rem); font-weight: 600; letter-spacing: -.035em; line-height: 1.02; }
  .w7scl-p { margin: 16px auto 0; max-width: 32rem; font-size: 16px; line-height: 1.6; color: #b9b8b2; }
  .w7scl-price { margin: 18px 0 0; font-size: 18px; font-weight: 600; }
  .w7scl-price span { margin-left: 10px; font-size: 14px; font-weight: 400; color: #a9a8a2; }
  .w7scl-stage { height: min(560px, 75vw); padding: 0; }
  .w7scl-frame { position: relative; height: 100%; margin: 0; overflow: hidden; border-radius: 14px; transform: scale(var(--w7scl-from)); transform-origin: 50% 40%; background: #2a2b2f; box-shadow: 0 30px 60px -30px rgba(0,0,0,.6); }
  .w7scl-frame img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .w7scl-cap { position: absolute; left: 20px; bottom: 18px; max-width: 22rem; padding: 10px 14px; border-radius: 8px; background: rgba(28,29,32,.82); font-size: 14px; line-height: 1.45; opacity: 0; }
  .w7scl-after { padding-top: 40px; padding-bottom: 72px; }
  .w7scl-spec { display: grid; gap: 1px; margin: 0; background: rgba(236,235,231,.14); border: 1px solid rgba(236,235,231,.14); border-radius: 10px; overflow: hidden; text-align: left; }
  .w7scl-spec div { padding: 16px 18px; background: var(--w7scl-bg); }
  .w7scl-spec dt { font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: #a9a8a2; }
  .w7scl-spec dd { margin: 6px 0 0; font-size: 16px; }
  .w7scl-btn { display: inline-flex; align-items: center; min-height: 48px; margin-top: 32px; padding: 0 26px; border-radius: 999px; background: var(--w7scl-ink); color: var(--w7scl-bg); font-weight: 600; font-size: 15px; text-decoration: none; }
  .w7scl-btn:hover { background: #fff; }
  .w7scl-btn:focus-visible { outline: 3px solid var(--w7scl-brass); outline-offset: 3px; }
  @media (min-width: 720px) { .w7scl-spec { grid-template-columns: repeat(3, 1fr); } }
  .w7scl[data-fb] .w7scl-cap { transition: opacity .4s ease; }
  @keyframes w7scl-grow { to { transform: scale(1); } }
  @keyframes w7scl-show { to { opacity: 1; } }
  /* Full size when the frame is centred in the box (cover 50%). */
  @supports (animation-timeline: view()) {
    .w7scl:not([data-fb]) .w7scl-stage { view-timeline: --w7scl-v block; }
    .w7scl:not([data-fb]) .w7scl-frame { animation: w7scl-grow linear both; animation-timeline: --w7scl-v; animation-range: cover 22% cover 50%; }
    .w7scl:not([data-fb]) .w7scl-cap { animation: w7scl-show linear both; animation-timeline: --w7scl-v; animation-range: cover 46% cover 56%; }
  }
  @media (prefers-reduced-motion: reduce) {
    .w7scl .w7scl-frame { animation: none !important; transform: none !important; }
    .w7scl .w7scl-cap { animation: none !important; opacity: 1 !important; }
  }
`;

export default function ProductPhotoScalesToFullBleedOnScroll() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    const off: Array<() => void> = [];
    
      var SPEED = 32; // px per second of demo scroll before anyone touches the box; 0 turns it off
      var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      var frame = 0, last = 0, pos = 0, seen = true, done = reduce || !SPEED;
      function step(t) {
        var dt = last ? Math.min(t - last, 50) : 0;
        last = t; pos += SPEED * dt / 1000;
        if (pos >= root.scrollHeight - root.clientHeight) pos = 0;
        root.scrollTop = pos;
        frame = requestAnimationFrame(step);
      }
      function play() { if (!done && seen && !frame) { last = 0; frame = requestAnimationFrame(step); } }
      function stop() { cancelAnimationFrame(frame); frame = 0; }
      function hand() { done = true; stop(); root.setAttribute("data-touched", ""); }
      ["wheel", "touchstart", "pointerdown", "keydown"].forEach(function (n) {
        root.addEventListener(n, hand, { passive: true });
        off.push(function () { root.removeEventListener(n, hand); });
      });
      var vis = new IntersectionObserver(function (e) { seen = e[0].isIntersecting; if (seen) play(); else stop(); });
      vis.observe(root);
      off.push(stop, function () { vis.disconnect(); });
      play();
      // Fallback: the same scale curve worked out from the frame's position, once per frame while scrolling.
      if (reduce || (window.CSS && CSS.supports("animation-timeline: view()"))) return;
      root.setAttribute("data-fb", "");
      var stage = root.querySelector(".w7scl-stage"), fig = root.querySelector(".w7scl-frame"), cap = root.querySelector(".w7scl-cap"), raf = 0;
      var from = parseFloat(getComputedStyle(root).getPropertyValue("--w7scl-from")) || .42;
      function draw() {
        raf = 0;
        var r = stage.getBoundingClientRect(), b = root.getBoundingClientRect();
        var p = Math.min(1, Math.max(0, ((b.bottom - r.top) / (b.height + r.height) - .22) / .28));
        fig.style.transform = "scale(" + (from + (1 - from) * p).toFixed(4) + ")";
        cap.style.opacity = p > .95 ? 1 : 0;
      }
      function onScroll() { if (!raf) raf = requestAnimationFrame(draw); }
      root.addEventListener("scroll", onScroll, { passive: true });
      draw();
      off.push(function () { root.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); fig.style.transform = ""; cap.style.opacity = ""; root.removeAttribute("data-fb"); });
    return () => off.forEach((f) => f());
  }, [prefersReduced]);

  return (
    <section className="w7scl" data-w7scl="" ref={rootRef} tabIndex={0} aria-label="Orrin Lighting, the Orrin task lamp, scrollable">
      <style>{STYLES}</style>
      <div className="w7scl-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w7scl-wrap">
        <p className="w7scl-eye">Orrin Lighting</p>
        <h2 className="w7scl-h">The Orrin task lamp</h2>
        <p className="w7scl-p">A folded steel arm that holds any angle without a knob to tighten, and a shade shaped to keep light on the page and out of your eyes.</p>
        <p className="w7scl-price">£185 <span>Matte black or bone</span></p>
      </div>
      <div className="w7scl-stage">
        <figure className="w7scl-frame">
          <img src="https://images.pexels.com/photos/7439754/pexels-photo-7439754.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Three matte black task lamps with angled arms lined up along a long white desk" width="1600" height="1067" loading="eager" />
          <figcaption className="w7scl-cap">Powder-coated steel, a linen cable and a dimmer in the base.</figcaption>
        </figure>
      </div>
      <div className="w7scl-wrap w7scl-after">
        <dl className="w7scl-spec">
          <div><dt>Height</dt><dd>52 cm at full reach</dd></div>
          <div><dt>Light</dt><dd>Warm LED, 2700 K</dd></div>
          <div><dt>Cable</dt><dd>2 m, linen wrapped</dd></div>
        </dl>
        <a className="w7scl-btn" href="#">Reserve one from the next batch</a>
      </div>
    </section>
  );
}

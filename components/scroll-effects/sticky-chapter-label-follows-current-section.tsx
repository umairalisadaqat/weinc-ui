import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version. The CSS comments name the values to change.
const STYLES = `
  /* Change these: --w7chp-bg, --w7chp-ink, --w7chp-vine (accent), and rootMargin in the script (where on screen a chapter takes over). */
  .w7chp { --w7chp-bg: #f7f8fa; --w7chp-ink: #1e293b; --w7chp-vine: #3f6b4f;
    position: relative; height: 620px; overflow-y: auto; overflow-x: hidden; background: var(--w7chp-bg); color: var(--w7chp-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  /* To run on page scroll: delete height and overflow above and use root: null in the script observer. */
  .w7chp:focus-visible { outline: 3px solid var(--w7chp-vine); outline-offset: -3px; }
  .w7chp-bar { position: sticky; top: 0; z-index: 3; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 20px; background: rgba(247,248,250,.96); border-bottom: 1px solid #dde2ea; }
  .w7chp-name { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
  .w7chp-now { display: flex; align-items: center; gap: 12px; font-size: 15px; font-weight: 600; }
  .w7chp-k { display: none; font-size: 12px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: #64748b; }
  .w7chp-mask { display: block; height: 1.5em; overflow: hidden; line-height: 1.5; min-width: 7.5em; text-align: right; }
  .w7chp-roll { display: flex; flex-direction: column; color: var(--w7chp-vine); transition: transform .6s cubic-bezier(.65,0,.2,1); }
  .w7chp-ticks { display: none; gap: 4px; }
  .w7chp-ticks i { display: block; width: 18px; height: 3px; border-radius: 2px; background: #cfd6df; overflow: hidden; }
  .w7chp-ticks i::after { content: ""; display: block; height: 100%; background: var(--w7chp-vine); transform: scaleX(0); transform-origin: 0 50%; transition: transform .5s ease; }
  .w7chp-ticks i.w7chp-on::after { transform: scaleX(1); }
  .w7chp-hint { position: sticky; top: 0; height: 0; z-index: 2; display: flex; justify-content: flex-end; pointer-events: none; }
  .w7chp-hint span { margin: 60px 14px 0 0; padding: 5px 12px; border-radius: 999px; background: rgba(30,41,59,.08); font-size: 12px; transition: opacity .5s; }
  .w7chp[data-touched] .w7chp-hint span { opacity: 0; }
  .w7chp-wrap { max-width: 48rem; margin: 0 auto; padding: 8px 20px 72px; }
  .w7chp-sec { padding: 36px 0 150px; }
  .w7chp-sec:last-child { padding-bottom: 40px; }
  .w7chp-num { margin: 0; font-size: clamp(4rem, 12vw, 7.5rem); font-weight: 200; line-height: 1; letter-spacing: -.05em; color: #c3ccd7; }
  .w7chp-sec h2 { margin: 6px 0 0; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(2rem, 5vw, 3.2rem); letter-spacing: -.02em; line-height: 1.05; }
  .w7chp-when { margin: 10px 0 0; font-size: 14px; font-weight: 600; letter-spacing: .06em; color: var(--w7chp-vine); }
  .w7chp-p { margin: 16px 0 0; max-width: 36rem; font-size: 17px; line-height: 1.7; color: #475569; }
  .w7chp-btn { display: inline-flex; align-items: center; min-height: 48px; margin-top: 28px; padding: 0 24px; border-radius: 8px; background: var(--w7chp-vine); color: #fff; font-weight: 600; font-size: 15px; text-decoration: none; }
  .w7chp-btn:hover { background: #335a41; }
  .w7chp-btn:focus-visible { outline: 3px solid var(--w7chp-ink); outline-offset: 3px; }
  @media (min-width: 640px) { .w7chp-k, .w7chp-ticks { display: flex; } .w7chp-k { display: inline; } .w7chp-bar { padding: 16px 32px; } }
  @media (prefers-reduced-motion: reduce) { .w7chp .w7chp-roll, .w7chp .w7chp-ticks i::after { transition: none; } }
`;

export default function StickyChapterLabelFollowsCurrentSection() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    const off: Array<() => void> = [];
    
      var SPEED = 34; // px per second of demo scroll before anyone touches the box; 0 turns it off
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
      // The label follows whichever chapter crosses a line just under the bar (this also runs with reduced motion, without the slide).
      var secs = [].slice.call(root.querySelectorAll(".w7chp-sec")), roll = root.querySelector(".w7chp-roll"), ticks = root.querySelectorAll(".w7chp-ticks i");
      function set(i) {
        roll.style.transform = "translateY(" + (-i * 100 / secs.length) + "%)";
        ticks.forEach(function (t, k) { t.classList.toggle("w7chp-on", k <= i); });
      }
      set(0);
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) set(secs.indexOf(e.target)); });
      }, { root: root, rootMargin: "-30% 0px -60% 0px" });
      secs.forEach(function (s) { io.observe(s); });
      off.push(function () { io.disconnect(); });
    return () => off.forEach((f) => f());
  }, [prefersReduced]);

  return (
    <section className="w7chp" data-w7chp="" ref={rootRef} tabIndex={0} aria-label="Callow Hill Vineyard, a year in four chapters, scrollable">
      <style>{STYLES}</style>
      <div className="w7chp-bar">
        <p className="w7chp-name">Callow Hill Vineyard</p>
        <div className="w7chp-now" aria-hidden="true">
          <span className="w7chp-k">Chapter</span>
          <span className="w7chp-mask"><span className="w7chp-roll"><span>01 Pruning</span><span>02 Bud break</span><span>03 Flowering</span><span>04 Harvest</span></span></span>
          <span className="w7chp-ticks"><i></i><i></i><i></i><i></i></span>
        </div>
      </div>
      <div className="w7chp-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w7chp-wrap">
        <article className="w7chp-sec">
          <p className="w7chp-num" aria-hidden="true">01</p>
          <h2>Pruning</h2>
          <p className="w7chp-when">January to March</p>
          <p className="w7chp-p">Every vine is cut back by hand to two canes, one row a morning while the frost lifts. It is the slowest job of the year and it decides how much fruit we will ask each plant to carry.</p>
        </article>
        <article className="w7chp-sec">
          <p className="w7chp-num" aria-hidden="true">02</p>
          <h2>Bud break</h2>
          <p className="w7chp-when">April and May</p>
          <p className="w7chp-p">The first green appears at the tips of the canes. We walk the slope at dawn with a thermometer, because one late frost in this fortnight can take half the crop.</p>
        </article>
        <article className="w7chp-sec">
          <p className="w7chp-num" aria-hidden="true">03</p>
          <h2>Flowering</h2>
          <p className="w7chp-when">June</p>
          <p className="w7chp-p">Tiny, scentless flowers that most visitors never notice. Warm, still weather now means full bunches in autumn; wind and rain mean loose, uneven ones.</p>
        </article>
        <article className="w7chp-sec">
          <p className="w7chp-num" aria-hidden="true">04</p>
          <h2>Harvest</h2>
          <p className="w7chp-when">Late September</p>
          <p className="w7chp-p">Friends, neighbours and a few regular guests pick for three days, and the press runs until midnight. Lunch is in the barn and the first juice is poured warm.</p>
          <a className="w7chp-btn" href="#">Join a picking day</a>
        </article>
      </div>
    </section>
  );
}

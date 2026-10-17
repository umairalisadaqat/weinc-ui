import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version. The CSS comments name the values to change.
const STYLES = `
  /* Change these: --w7sts-bg, --w7sts-ink, --w7sts-sand (figures), --w7sts-step (delay between digits), --w7sts-dur. */
  .w7sts { --w7sts-bg: #0f1d33; --w7sts-ink: #eef1f5; --w7sts-sand: #e3c497; --w7sts-step: 55ms; --w7sts-dur: .9s;
    position: relative; height: 620px; overflow-y: auto; overflow-x: hidden; background: var(--w7sts-bg); color: var(--w7sts-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; scrollbar-color: #33435c transparent; }
  /* To run on page scroll: delete height and overflow above and use root: null in the script observer. */
  .w7sts:focus-visible { outline: 3px solid var(--w7sts-sand); outline-offset: -3px; }
  .w7sts-hint { position: sticky; top: 0; height: 0; z-index: 2; display: flex; justify-content: flex-end; pointer-events: none; }
  .w7sts-hint span { margin: 14px 14px 0 0; padding: 5px 12px; border-radius: 999px; background: rgba(238,241,245,.12); font-size: 12px; transition: opacity .5s; }
  .w7sts[data-touched] .w7sts-hint span { opacity: 0; }
  .w7sts-wrap { max-width: 68rem; margin: 0 auto; padding: 52px 20px 80px; }
  .w7sts-eye { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: var(--w7sts-sand); }
  .w7sts-h { margin: 14px 0 0; font-size: clamp(1.6rem, 3.4vw, 2.4rem); font-weight: 600; letter-spacing: -.02em; line-height: 1.15; }
  .w7sts-h + .w7sts-band { margin-top: 28px; }
  .w7sts-copy + .w7sts-h { margin-top: 120px; }
  .w7sts-band { display: grid; grid-template-columns: repeat(2, 1fr); margin: 0; border-top: 1px solid rgba(238,241,245,.18); }
  .w7sts-cell { display: flex; flex-direction: column-reverse; justify-content: flex-end; gap: 6px; padding: 22px 16px 24px 0; border-bottom: 1px solid rgba(238,241,245,.18); }
  .w7sts-cell dt { font-size: 14px; color: #b7c1d0; }
  .w7sts-cell dd { margin: 0; font-size: clamp(2.8rem, 7vw, 4.6rem); font-weight: 300; line-height: 1; letter-spacing: -.03em; color: var(--w7sts-sand); font-variant-numeric: tabular-nums; }
  .w7sts-f { display: inline-flex; overflow: hidden; padding-bottom: .06em; }
  .w7sts-d { display: inline-block; }
  .w7sts-copy { margin: 26px 0 0; max-width: 36rem; font-size: 16px; line-height: 1.65; color: #c9d1dc; }
  .w7sts-btn { display: inline-flex; align-items: center; min-height: 48px; margin-top: 44px; padding: 0 26px; border-radius: 999px; background: var(--w7sts-sand); color: #1a1408; font-weight: 600; font-size: 15px; text-decoration: none; }
  .w7sts-btn:hover { background: #f0d7b0; }
  .w7sts-btn:focus-visible { outline: 3px solid var(--w7sts-ink); outline-offset: 3px; }
  @media (min-width: 760px) {
    .w7sts-band { grid-template-columns: repeat(4, 1fr); }
    .w7sts-cell { padding: 26px 20px 28px; border-bottom: 0; border-left: 1px solid rgba(238,241,245,.18); }
    .w7sts-cell:first-child { border-left: 0; padding-left: 0; }
    .w7sts-wrap { padding: 60px 48px 90px; }
  }
  /* Armed by the script: bands below the fold wait, then each digit slides up a step after the one before. */
  .w7sts[data-armed] .w7sts-d { transition: transform var(--w7sts-dur) cubic-bezier(.16,.84,.24,1); transition-delay: calc(var(--i, 0) * var(--w7sts-step)); }
  .w7sts[data-armed] .w7sts-band:not(.w7sts-in) .w7sts-d { transform: translateY(105%); }
  .w7sts[data-armed] .w7sts-cell dt { transition: opacity .6s ease calc(var(--c, 0) * 90ms + .2s); }
  .w7sts[data-armed] .w7sts-band:not(.w7sts-in) dt { opacity: 0; }
  @media (prefers-reduced-motion: reduce) {
    .w7sts .w7sts-d, .w7sts .w7sts-cell dt { transform: none !important; opacity: 1 !important; transition: none !important; }
  }
`;

export default function StatsBandFiguresSlideUpIntoPlace() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    const off: Array<() => void> = [];
    
      var SPEED = 28; // px per second of demo scroll before anyone touches the box; 0 turns it off
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
      if (reduce) return;
      // Split every figure into digit spans; screen readers keep the whole figure via aria-label.
      root.querySelectorAll(".w7sts-band").forEach(function (band) {
        var n = 0;
        band.querySelectorAll(".w7sts-cell").forEach(function (cell, c) {
          cell.style.setProperty("--c", c);
          var f = cell.querySelector(".w7sts-f"), text = f.textContent;
          f.setAttribute("aria-label", text);
          f.textContent = "";
          text.split("").forEach(function (ch) {
            var d = document.createElement("span");
            d.className = "w7sts-d"; d.textContent = ch; d.setAttribute("aria-hidden", "true");
            d.style.setProperty("--i", n++);
            f.appendChild(d);
          });
          off.push(function () { f.textContent = text; f.removeAttribute("aria-label"); });
        });
      });
      var bands = root.querySelectorAll(".w7sts-band"), box = root.getBoundingClientRect();
      bands.forEach(function (b) { if (b.getBoundingClientRect().bottom < box.bottom) b.classList.add("w7sts-in"); });
      root.setAttribute("data-armed", "");
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("w7sts-in"); io.unobserve(e.target); } });
      }, { root: root, rootMargin: "0px 0px -15% 0px" });
      bands.forEach(function (b) { io.observe(b); });
      off.push(function () { io.disconnect(); root.removeAttribute("data-armed"); });
    return () => off.forEach((f) => f());
  }, [prefersReduced]);

  return (
    <section className="w7sts" data-w7sts="" ref={rootRef} tabIndex={0} aria-label="Ridgeway Cycle Tours, the Long Ridge tour in figures, scrollable">
      <style>{STYLES}</style>
      <div className="w7sts-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w7sts-wrap">
        <p className="w7sts-eye">Ridgeway Cycle Tours · The Long Ridge</p>
        <h2 className="w7sts-h">A week on quiet roads, in four numbers</h2>
        <dl className="w7sts-band">
          <div className="w7sts-cell"><dt>Days in the saddle</dt><dd><span className="w7sts-f">6</span></dd></div>
          <div className="w7sts-cell"><dt>Kilometres ridden</dt><dd><span className="w7sts-f">412</span></dd></div>
          <div className="w7sts-cell"><dt>Riders per group</dt><dd><span className="w7sts-f">12</span></dd></div>
          <div className="w7sts-cell"><dt>Support vans</dt><dd><span className="w7sts-f">2</span></dd></div>
        </dl>
        <p className="w7sts-copy">The route keeps to lanes and old drovers' tracks, with a van carrying luggage, spares and lunch. You ride; we handle the rest of the day.</p>
        <h2 className="w7sts-h">The climbing, honestly</h2>
        <dl className="w7sts-band">
          <div className="w7sts-cell"><dt>Metres of ascent</dt><dd><span className="w7sts-f">3,180</span></dd></div>
          <div className="w7sts-cell"><dt>Named passes</dt><dd><span className="w7sts-f">4</span></dd></div>
          <div className="w7sts-cell"><dt>Longest descent, km</dt><dd><span className="w7sts-f">38</span></dd></div>
          <div className="w7sts-cell"><dt>Rest day</dt><dd><span className="w7sts-f">1</span></dd></div>
        </dl>
        <p className="w7sts-copy">Day three is the hard one. Everyone who has started it has finished it, some of them walking the last bend, which is allowed.</p>
        <h2 className="w7sts-h">What the price covers</h2>
        <dl className="w7sts-band">
          <div className="w7sts-cell"><dt>Nights in village inns</dt><dd><span className="w7sts-f">6</span></dd></div>
          <div className="w7sts-cell"><dt>Ride leaders</dt><dd><span className="w7sts-f">2</span></dd></div>
          <div className="w7sts-cell"><dt>Mechanic on the road</dt><dd><span className="w7sts-f">1</span></dd></div>
          <div className="w7sts-cell"><dt>Per rider, GBP</dt><dd><span className="w7sts-f">1,640</span></dd></div>
        </dl>
        <a className="w7sts-btn" href="#">Read the route notes</a>
      </div>
    </section>
  );
}

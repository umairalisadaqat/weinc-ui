import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version. The CSS comments name the values to change.
const STYLES = `
  /* Change these: --w7wrd-bg, --w7wrd-ink, --w7wrd-moss (accent), --w7wrd-step (delay between words), --w7wrd-dur (rise time). */
  .w7wrd { --w7wrd-bg: #f3efe4; --w7wrd-ink: #1f3a2c; --w7wrd-moss: #5b7a4a; --w7wrd-step: 75ms; --w7wrd-dur: .8s;
    position: relative; height: 620px; overflow-y: auto; overflow-x: hidden; background: var(--w7wrd-bg); color: var(--w7wrd-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  /* To run on page scroll: delete height and overflow above and use root: null in the script observer. */
  .w7wrd:focus-visible { outline: 3px solid var(--w7wrd-moss); outline-offset: -3px; }
  .w7wrd-hint { position: sticky; top: 0; height: 0; z-index: 2; display: flex; justify-content: flex-end; pointer-events: none; }
  .w7wrd-hint span { margin: 14px 14px 0 0; padding: 5px 12px; border-radius: 999px; background: rgba(31,58,44,.1); font-size: 12px; transition: opacity .5s; }
  .w7wrd[data-touched] .w7wrd-hint span { opacity: 0; }
  .w7wrd-wrap { max-width: 64rem; margin: 0 auto; padding: 56px 20px 96px; }
  .w7wrd-brand { margin: 0 0 40px; font-size: 13px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: var(--w7wrd-moss); }
  .w7wrd-sec { display: grid; gap: 14px; padding: 36px 0 110px; border-top: 1px solid rgba(31,58,44,.18); }
  .w7wrd-sec:last-child { padding-bottom: 40px; }
  .w7wrd-num { margin: 0; font-size: 13px; font-weight: 600; letter-spacing: .08em; color: var(--w7wrd-moss); }
  .w7wrd-h { margin: 0; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(2.2rem, 6.4vw, 4.4rem); line-height: 1.06; letter-spacing: -.02em; }
  .w7wrd-m { display: inline-block; overflow: hidden; vertical-align: top; padding-bottom: .12em; margin-bottom: -.12em; }
  .w7wrd-w { display: inline-block; transform-origin: 0 100%; }
  .w7wrd-p { margin: 18px 0 0; max-width: 34rem; font-size: 17px; line-height: 1.65; color: #3d5245; }
  .w7wrd-btn { display: inline-flex; align-items: center; min-height: 48px; margin-top: 28px; padding: 0 26px; border-radius: 999px; background: var(--w7wrd-ink); color: var(--w7wrd-bg); font-weight: 600; font-size: 15px; text-decoration: none; }
  .w7wrd-btn:hover { background: #2d5240; }
  .w7wrd-btn:focus-visible { outline: 3px solid var(--w7wrd-moss); outline-offset: 3px; }
  @media (min-width: 760px) { .w7wrd-sec { grid-template-columns: 11rem 1fr; gap: 32px; } .w7wrd-num { padding-top: 14px; } .w7wrd-wrap { padding: 64px 48px 110px; } }
  /* Armed by the script: headings below the fold wait, then their words rise one after another. */
  .w7wrd[data-armed] .w7wrd-w { transition: transform var(--w7wrd-dur) cubic-bezier(.2,.8,.2,1); transition-delay: calc(var(--i, 0) * var(--w7wrd-step)); }
  .w7wrd[data-armed] .w7wrd-h:not(.w7wrd-in) .w7wrd-w { transform: translateY(108%) rotate(5deg); }
  .w7wrd[data-armed] .w7wrd-p, .w7wrd[data-armed] .w7wrd-btn { transition: opacity .7s ease .45s, transform .7s ease .45s; }
  .w7wrd[data-armed] .w7wrd-sec:not(.w7wrd-on) .w7wrd-p, .w7wrd[data-armed] .w7wrd-sec:not(.w7wrd-on) .w7wrd-btn { opacity: 0; transform: translateY(12px); }
  @media (prefers-reduced-motion: reduce) {
    .w7wrd .w7wrd-w, .w7wrd .w7wrd-p, .w7wrd .w7wrd-btn { transform: none !important; opacity: 1 !important; transition: none !important; }
  }
`;

export default function SectionHeaderWordsRiseOneByOneOnScroll() {
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
      var secs = root.querySelectorAll(".w7wrd-sec");
      root.querySelectorAll(".w7wrd-h").forEach(function (h) {
        h.querySelectorAll(".w7wrd-w").forEach(function (w, i) { w.style.setProperty("--i", i); });
      });
      // Headings already on screen stay put; the rest wait below the fold.
      var box = root.getBoundingClientRect();
      function show(s) { s.classList.add("w7wrd-on"); s.querySelector(".w7wrd-h").classList.add("w7wrd-in"); }
      secs.forEach(function (s) { if (s.querySelector(".w7wrd-h").getBoundingClientRect().bottom < box.bottom) show(s); });
      root.setAttribute("data-armed", "");
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { show(e.target.parentNode.parentNode); io.unobserve(e.target); } });
      }, { root: root, rootMargin: "0px 0px -18% 0px" });
      secs.forEach(function (s) { io.observe(s.querySelector(".w7wrd-h")); });
      off.push(function () { io.disconnect(); root.removeAttribute("data-armed"); });
    return () => off.forEach((f) => f());
  }, [prefersReduced]);

  return (
    <section className="w7wrd" data-w7wrd="" ref={rootRef} tabIndex={0} aria-label="Fernhill Garden Design, how we work, scrollable">
      <style>{STYLES}</style>
      <div className="w7wrd-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w7wrd-wrap">
        <p className="w7wrd-brand">Fernhill Garden Design</p>
        <article className="w7wrd-sec">
          <p className="w7wrd-num">01 · Planting</p>
          <div>
            <h2 className="w7wrd-h"><span className="w7wrd-m"><span className="w7wrd-w">Gardens</span></span> <span className="w7wrd-m"><span className="w7wrd-w">planted</span></span> <span className="w7wrd-m"><span className="w7wrd-w">for</span></span> <span className="w7wrd-m"><span className="w7wrd-w">the</span></span> <span className="w7wrd-m"><span className="w7wrd-w">slow</span></span> <span className="w7wrd-m"><span className="w7wrd-w">seasons</span></span></h2>
            <p className="w7wrd-p">We design borders that still look considered in February: seed heads left standing, evergreen bones, bark that catches the low winter sun.</p>
          </div>
        </article>
        <article className="w7wrd-sec">
          <p className="w7wrd-num">02 · Ground</p>
          <div>
            <h2 className="w7wrd-h"><span className="w7wrd-m"><span className="w7wrd-w">Every</span></span> <span className="w7wrd-m"><span className="w7wrd-w">plan</span></span> <span className="w7wrd-m"><span className="w7wrd-w">begins</span></span> <span className="w7wrd-m"><span className="w7wrd-w">with</span></span> <span className="w7wrd-m"><span className="w7wrd-w">a</span></span> <span className="w7wrd-m"><span className="w7wrd-w">soil</span></span> <span className="w7wrd-m"><span className="w7wrd-w">pit</span></span></h2>
            <p className="w7wrd-p">Before drawing a line we dig, crumble and test the ground, then choose plants that want to live there instead of ones that need rescuing every July.</p>
          </div>
        </article>
        <article className="w7wrd-sec">
          <p className="w7wrd-num">03 · Making</p>
          <div>
            <h2 className="w7wrd-h"><span className="w7wrd-m"><span className="w7wrd-w">Built</span></span> <span className="w7wrd-m"><span className="w7wrd-w">by</span></span> <span className="w7wrd-m"><span className="w7wrd-w">the</span></span> <span className="w7wrd-m"><span className="w7wrd-w">hands</span></span> <span className="w7wrd-m"><span className="w7wrd-w">that</span></span> <span className="w7wrd-m"><span className="w7wrd-w">drew</span></span> <span className="w7wrd-m"><span className="w7wrd-w">it</span></span></h2>
            <p className="w7wrd-p">The designer who walks your plot is there on planting days too, nudging pots around by eye until each group of grasses sits where it should.</p>
          </div>
        </article>
        <article className="w7wrd-sec">
          <p className="w7wrd-num">04 · Care</p>
          <div>
            <h2 className="w7wrd-h"><span className="w7wrd-m"><span className="w7wrd-w">Then</span></span> <span className="w7wrd-m"><span className="w7wrd-w">we</span></span> <span className="w7wrd-m"><span className="w7wrd-w">return</span></span> <span className="w7wrd-m"><span className="w7wrd-w">each</span></span> <span className="w7wrd-m"><span className="w7wrd-w">spring</span></span></h2>
            <p className="w7wrd-p">One visit a year to divide, cut back and rethink, because a garden is a draft that keeps being revised.</p>
            <a className="w7wrd-btn" href="#">Book a garden walk</a>
          </div>
        </article>
      </div>
    </section>
  );
}

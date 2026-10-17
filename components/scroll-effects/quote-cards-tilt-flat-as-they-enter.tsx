import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version. The CSS comments name the values to change.
const STYLES = `
  /* Change these: --w7tlt-tilt (starting lean), --w7tlt-depth (perspective), --w7tlt-paper, --w7tlt-ink, --w7tlt-ox (accent). */
  .w7tlt { --w7tlt-tilt: 34deg; --w7tlt-depth: 900px; --w7tlt-paper: #f4ede1; --w7tlt-ink: #2d2620; --w7tlt-ox: #7a2e2a;
    position: relative; height: 620px; overflow-y: auto; overflow-x: hidden; background: var(--w7tlt-paper); color: var(--w7tlt-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  /* To run on page scroll: delete height and overflow above (view() then follows the page) and use root: null in the fallback observer. */
  .w7tlt:focus-visible { outline: 3px solid var(--w7tlt-ox); outline-offset: -3px; }
  .w7tlt-hint { position: sticky; top: 0; height: 0; z-index: 3; display: flex; justify-content: flex-end; pointer-events: none; }
  .w7tlt-hint span { margin: 14px 14px 0 0; padding: 5px 12px; border-radius: 999px; background: rgba(45,38,32,.1); font-size: 12px; transition: opacity .5s; }
  .w7tlt[data-touched] .w7tlt-hint span { opacity: 0; }
  .w7tlt-wrap { max-width: 44rem; margin: 0 auto; padding: 52px 20px 80px; }
  .w7tlt-eye { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: var(--w7tlt-ox); }
  .w7tlt-h { margin: 12px 0 0; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(1.9rem, 4.4vw, 2.9rem); line-height: 1.1; letter-spacing: -.015em; }
  .w7tlt-list { list-style: none; margin: 36px 0 0; padding: 0; display: grid; gap: 48px; }
  .w7tlt-card { position: relative; padding: 28px 26px 22px; border-radius: 4px; background: #fffaf2; border: 1px solid rgba(45,38,32,.1);
    box-shadow: 0 1px 0 rgba(45,38,32,.06), 0 22px 40px -26px rgba(60,40,20,.45); transform-origin: 50% 0; }
  .w7tlt-card::before { content: ""; position: absolute; left: 26px; top: 0; width: 42px; height: 3px; background: var(--w7tlt-ox); }
  .w7tlt-card blockquote { margin: 0; }
  .w7tlt-card blockquote p { margin: 0; font-family: Georgia, "Iowan Old Style", serif; font-size: clamp(1.1rem, 2.4vw, 1.3rem); line-height: 1.55; }
  .w7tlt-who { display: flex; align-items: center; gap: 12px; margin: 20px 0 0; font-size: 14px; color: #5b4d41; }
  .w7tlt-who strong { display: block; color: var(--w7tlt-ink); font-weight: 600; }
  .w7tlt-av { display: grid; place-items: center; width: 40px; height: 40px; flex: none; border-radius: 50%; background: #e6d8c3; color: var(--w7tlt-ox); font-size: 13px; font-weight: 700; }
  .w7tlt-btn { display: inline-flex; align-items: center; min-height: 48px; margin-top: 44px; padding: 0 26px; border-radius: 4px; background: var(--w7tlt-ox); color: #fff8ee; font-weight: 600; font-size: 15px; text-decoration: none; }
  .w7tlt-btn:hover { background: #5f2220; }
  .w7tlt-btn:focus-visible { outline: 3px solid var(--w7tlt-ink); outline-offset: 3px; }
  @keyframes w7tlt-flat { from { transform: perspective(var(--w7tlt-depth)) rotateX(var(--w7tlt-tilt)) translateY(28px); opacity: .35; } to { transform: perspective(var(--w7tlt-depth)); opacity: 1; } }
  /* Each card lies back and stands up as it comes in; it is flat once fully on screen. */
  @supports (animation-timeline: view()) {
    .w7tlt:not([data-fb]) .w7tlt-card { animation: w7tlt-flat cubic-bezier(.3,.6,.3,1) both; animation-timeline: view(); animation-range: entry 0% entry 100%; }
  }
  .w7tlt[data-fb] .w7tlt-card { transition: transform .9s cubic-bezier(.2,.8,.2,1), opacity .9s ease; }
  .w7tlt[data-fb] .w7tlt-card:not(.w7tlt-in) { transform: perspective(var(--w7tlt-depth)) rotateX(var(--w7tlt-tilt)) translateY(28px); opacity: .35; }
  @media (prefers-reduced-motion: reduce) { .w7tlt .w7tlt-card { animation: none !important; transform: none !important; opacity: 1 !important; transition: none !important; } }
`;

export default function QuoteCardsTiltFlatAsTheyEnter() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    const off: Array<() => void> = [];
    
      var SPEED = 30; // px per second of demo scroll before anyone touches the box; 0 turns it off
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
      // Fallback: each card stands up once when most of it is in view.
      if (reduce || (window.CSS && CSS.supports("animation-timeline: view()"))) return;
      var cards = root.querySelectorAll(".w7tlt-card"), box = root.getBoundingClientRect();
      cards.forEach(function (c) { if (c.getBoundingClientRect().bottom < box.bottom) c.classList.add("w7tlt-in"); });
      root.setAttribute("data-fb", "");
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("w7tlt-in"); io.unobserve(e.target); } });
      }, { root: root, threshold: 0.4 });
      cards.forEach(function (c) { io.observe(c); });
      off.push(function () { io.disconnect(); root.removeAttribute("data-fb"); });
    return () => off.forEach((f) => f());
  }, [prefersReduced]);

  return (
    <section className="w7tlt" data-w7tlt="" ref={rootRef} tabIndex={0} aria-label="Marrow and Vellum Bindery, letters from clients, scrollable">
      <style>{STYLES}</style>
      <div className="w7tlt-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w7tlt-wrap">
        <p className="w7tlt-eye">Marrow &amp; Vellum Bindery</p>
        <h2 className="w7tlt-h">Notes from people whose books came back</h2>
        <ul className="w7tlt-list">
          <li className="w7tlt-card"><blockquote><p>My grandmother's recipe book arrived in eleven loose pieces. It came home sewn, with the burn marks on the cover left exactly where she made them.</p></blockquote><p className="w7tlt-who"><span className="w7tlt-av" aria-hidden="true">OF</span><span><strong>Odile Ferrant</strong> Rebound family cookbook</span></p></li>
          <li className="w7tlt-card"><blockquote><p>They talked me out of new leather and into repairing the old spine instead. It cost less and it still smells like the library it lived in.</p></blockquote><p className="w7tlt-who"><span className="w7tlt-av" aria-hidden="true">TB</span><span><strong>Tomas Bright</strong> Spine repair, 1890s atlas</span></p></li>
          <li className="w7tlt-card"><blockquote><p>Forty copies of our wedding guest book, each with a different marbled end paper. Guests keep sending photos of theirs on bookshelves.</p></blockquote><p className="w7tlt-who"><span className="w7tlt-av" aria-hidden="true">RN</span><span><strong>Ruth and Nnamdi</strong> Small edition, hand marbled</span></p></li>
          <li className="w7tlt-card"><blockquote><p>I brought a thesis and left with a book I am not embarrassed to give my mother. The cloth is the green of the department door.</p></blockquote><p className="w7tlt-who"><span className="w7tlt-av" aria-hidden="true">HL</span><span><strong>Hana Lindqvist</strong> Thesis binding, buckram</span></p></li>
        </ul>
        <a className="w7tlt-btn" href="#">Bring us a book</a>
      </div>
    </section>
  );
}

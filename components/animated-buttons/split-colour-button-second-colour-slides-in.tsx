import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version. The CSS comments name the values to change.
const STYLES = `
  /* Change these: --w7spl-ink, --w7spl-wine (second colour), --w7spl-bone (page), --w7spl-dur (slide time). */
  .w7spl { --w7spl-ink: #1c1a17; --w7spl-wine: #8c2f39; --w7spl-bone: #f1ebe1; --w7spl-dur: .55s;
    padding: 56px 20px; background: var(--w7spl-bone); color: var(--w7spl-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .w7spl-card { max-width: 46rem; margin: 0 auto; text-align: center; }
  .w7spl-eye { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: var(--w7spl-wine); }
  .w7spl-h { margin: 14px 0 0; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(1.7rem, 4vw, 2.6rem); line-height: 1.15; letter-spacing: -.01em; }
  .w7spl-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; margin-top: 34px; }
  .w7spl-b { position: relative; display: inline-grid; min-height: 52px; padding: 0 28px; place-items: center; overflow: hidden; border-radius: 4px; font-size: 15px; font-weight: 600; letter-spacing: .01em; text-decoration: none; isolation: isolate; }
  .w7spl-a { background: var(--w7spl-ink); color: var(--w7spl-bone); }
  .w7spl-o { box-shadow: inset 0 0 0 1.5px var(--w7spl-ink); color: var(--w7spl-ink); }
  .w7spl-u { background: #e3d7c5; color: var(--w7spl-ink); }
  /* The mask carries the second colour; its label moves the opposite way, so the text stays still and changes colour at the edge. */
  .w7spl-m { position: absolute; inset: 0; display: grid; place-items: center; overflow: hidden; background: var(--w7spl-wine); color: #fbf3ea; transform: translateX(-101%); transition: transform var(--w7spl-dur) cubic-bezier(.7,0,.2,1); }
  .w7spl-m .w7spl-t { transform: translateX(101%); transition: transform var(--w7spl-dur) cubic-bezier(.7,0,.2,1); }
  .w7spl-o .w7spl-m { transform: translateY(101%); } .w7spl-o .w7spl-m .w7spl-t { transform: translateY(-101%); }
  .w7spl-u .w7spl-m { transform: translateX(101%); background: var(--w7spl-ink); } .w7spl-u .w7spl-m .w7spl-t { transform: translateX(-101%); }
  .w7spl-b:hover .w7spl-m, .w7spl-b:focus-visible .w7spl-m, .w7spl-b[data-demo] .w7spl-m,
  .w7spl-b:hover .w7spl-m .w7spl-t, .w7spl-b:focus-visible .w7spl-m .w7spl-t, .w7spl-b[data-demo] .w7spl-m .w7spl-t { transform: none; }
  .w7spl-b:focus-visible { outline: 3px solid var(--w7spl-wine); outline-offset: 3px; }
  .w7spl-note { margin: 22px 0 0; font-size: 14px; color: #5e564c; }
  @media (prefers-reduced-motion: reduce) { .w7spl-m, .w7spl-m .w7spl-t { transition: none; } }
`;

export default function SplitColourButtonSecondColourSlidesIn() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    const off: Array<() => void> = [];
    
      var STEP = 1500; // ms each button shows its second colour during the demo
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // Demo only: buttons take turns until someone points at, taps or tabs into the section.
      var btns = root.querySelectorAll(".w7spl-b"), i = 0, timer = 0, seen = true, done = false;
      function clear() { btns.forEach(function (b) { b.removeAttribute("data-demo"); }); }
      function step() { clear(); btns[i++ % btns.length].setAttribute("data-demo", ""); timer = setTimeout(step, STEP); }
      function play() { if (!done && seen && !timer) step(); }
      function stop() { clearTimeout(timer); timer = 0; clear(); }
      function hand() { done = true; stop(); }
      ["pointerenter", "focusin", "touchstart"].forEach(function (n) { root.addEventListener(n, hand, { passive: true }); off.push(function () { root.removeEventListener(n, hand); }); });
      var io = new IntersectionObserver(function (e) { seen = e[0].isIntersecting; if (seen) play(); else stop(); });
      io.observe(root);
      off.push(stop, function () { io.disconnect(); });
      play();
    return () => off.forEach((f) => f());
  }, [prefersReduced]);

  return (
    <section className="w7spl" data-w7spl="" ref={rootRef} aria-label="Lowtide Wine Bar bookings">
      <style>{STYLES}</style>
      <div className="w7spl-card">
        <p className="w7spl-eye">Lowtide Wine Bar</p>
        <h2 className="w7spl-h">Thirty bottles open by the glass, and a short menu to go with them</h2>
        <div className="w7spl-row">
          <a className="w7spl-b w7spl-a" href="#"><span className="w7spl-t">Book a table</span><span className="w7spl-m" aria-hidden="true"><span className="w7spl-t">Book a table</span></span></a>
          <a className="w7spl-b w7spl-o" href="#"><span className="w7spl-t">Tasting Thursdays</span><span className="w7spl-m" aria-hidden="true"><span className="w7spl-t">Tasting Thursdays</span></span></a>
          <a className="w7spl-b w7spl-u" href="#"><span className="w7spl-t">Gift a bottle</span><span className="w7spl-m" aria-hidden="true"><span className="w7spl-t">Gift a bottle</span></span></a>
        </div>
        <p className="w7spl-note">Walk-ins welcome at the bar until nine.</p>
      </div>
    </section>
  );
}

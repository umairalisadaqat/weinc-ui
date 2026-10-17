import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version; the comments in CSS name the values to change.
const STYLES = `
  /* Change these: the --x, --y and --r start values on each .w1pil-p (where the pile sits), --w1pil-bg, --w1pil-ink,
     and animation-range on .w1pil-p (how much scrolling the sort takes). */
  .w1pil { --w1pil-bg: #2a2b2e; --w1pil-ink: #f1efe9;
    height: 620px; overflow-y: auto; overflow-x: hidden; position: relative; background: var(--w1pil-bg); color: var(--w1pil-ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; scrollbar-width: thin; scrollbar-color: #55575c transparent; }
  /* To use page scroll: delete height and overflow above and set root: null in the script. */
  .w1pil:focus-visible { outline: 3px solid #e3b67a; outline-offset: -3px; }
  .w1pil-hint { position: sticky; top: 0; height: 0; z-index: 9; display: flex; align-items: flex-start; justify-content: flex-end; pointer-events: none; }
  .w1pil-hint span { margin: 12px 12px 0 0; padding: 5px 12px; border-radius: 999px; background: rgba(241,239,233,.16); color: var(--w1pil-ink);
    font-size: 12px; letter-spacing: .04em; transition: opacity .5s ease; }
  .w1pil[data-touched] .w1pil-hint span { opacity: 0; }
  .w1pil-wrap { max-width: 60rem; margin: 0 auto; padding: 60px 20px 88px; }
  .w1pil-eyebrow { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: #e3b67a; }
  .w1pil-h { margin: 14px 0 0; max-width: 34rem; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(1.9rem, 4.4vw, 2.8rem); line-height: 1.1; letter-spacing: -.015em; }
  .w1pil-lead { margin: 14px 0 0; max-width: 32rem; font-size: 1rem; line-height: 1.6; color: #c9c6be; }
  .w1pil-grid { list-style: none; margin: 40px 0 0; padding: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; view-timeline: --w1pil-v block; }
  .w1pil-p figure { margin: 0; padding: 8px 8px 0; background: #fbfaf7; border-radius: 3px; box-shadow: 0 18px 30px -14px rgba(0,0,0,.65), 0 2px 4px rgba(0,0,0,.25); }
  .w1pil-p img { display: block; width: 100%; height: auto; aspect-ratio: 1; object-fit: cover; }
  .w1pil-p figcaption { padding: 8px 2px 10px; font-size: .8125rem; color: #3a3b3e; }
  /* Phone: two columns, the pile gathers in the middle row. */
  .w1pil-p:nth-child(1) { --x: 52%; --y: 100%; --r: -9deg; }
  .w1pil-p:nth-child(2) { --x: -48%; --y: 96%; --r: 7deg; }
  .w1pil-p:nth-child(3) { --x: 56%; --y: 4%; --r: 4deg; }
  .w1pil-p:nth-child(4) { --x: -52%; --y: -2%; --r: -6deg; }
  .w1pil-p:nth-child(5) { --x: 46%; --y: -98%; --r: 10deg; }
  .w1pil-p:nth-child(6) { --x: -54%; --y: -102%; --r: -3deg; }
  @media (min-width: 720px) {
    .w1pil-wrap { padding: 76px 40px 100px; }
    .w1pil-grid { grid-template-columns: repeat(3, 1fr); gap: 22px; }
    .w1pil-p:nth-child(1) { --x: 96%; --y: 50%; --r: -9deg; }
    .w1pil-p:nth-child(2) { --x: 6%; --y: 58%; --r: 6deg; }
    .w1pil-p:nth-child(3) { --x: -92%; --y: 46%; --r: -4deg; }
    .w1pil-p:nth-child(4) { --x: 104%; --y: -48%; --r: 8deg; }
    .w1pil-p:nth-child(5) { --x: -4%; --y: -54%; --r: -7deg; }
    .w1pil-p:nth-child(6) { --x: -100%; --y: -44%; --r: 3deg; }
  }
  .w1pil-end { margin-top: 36px; display: flex; flex-wrap: wrap; gap: 16px 24px; align-items: center; justify-content: space-between; }
  .w1pil-end p { margin: 0; font-size: 1rem; color: #dcd9d1; }
  .w1pil-btn { display: inline-flex; min-height: 46px; align-items: center; padding: 0 22px; border-radius: 999px; background: var(--w1pil-ink);
    color: #2a2b2e; font-weight: 600; font-size: .9375rem; text-decoration: none; }
  .w1pil-btn:hover { background: #fff; }
  .w1pil-btn:focus-visible { outline: 3px solid #e3b67a; outline-offset: 3px; }
  @keyframes w1pil-sort { from { transform: translate(var(--x), var(--y)) rotate(var(--r)); } to { transform: none; } }
  @supports (animation-timeline: view()) {
    .w1pil:not([data-fb]) .w1pil-p { animation: w1pil-sort linear both; animation-timeline: --w1pil-v; animation-range: cover 18% cover 52%; }
  }
  /* Fallback set by the script: the pile sorts once when the grid is mostly in view. */
  .w1pil[data-fb] .w1pil-p { transform: translate(var(--x), var(--y)) rotate(var(--r)); transition: transform 1.1s cubic-bezier(.2,.8,.2,1); }
  .w1pil[data-fb] .w1pil-p:nth-child(even) { transition-delay: 90ms; }
  .w1pil[data-fb] .w1pil-in .w1pil-p { transform: none; }
  @media (prefers-reduced-motion: reduce) {
    .w1pil .w1pil-p, .w1pil[data-fb] .w1pil-p { animation: none !important; transform: none; transition: none; }
  }
`;

export default function PhotoPileSettlesIntoGridOnScroll() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    
      var off = [];
      var SPEED = 40; // demo scroll in px per second before anyone touches the box; 0 turns it off
      var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      var frame = 0, last = 0, pos = 0, seen = true, done = reduce || !SPEED;
      function on(el, n, f) { el.addEventListener(n, f, { passive: true }); off.push(function () { el.removeEventListener(n, f); }); }
      function keep(o) { off.push(function () { o.disconnect(); }); return o; }
    
      // Slow demo scroll so the preview moves; any wheel, touch, click or key hands control back.
      function step(t) {
        var dt = last ? Math.min(t - last, 50) : 0;
        last = t;
        pos += SPEED * dt / 1000;
        if (pos >= root.scrollHeight - root.clientHeight) pos = 0;
        root.scrollTop = pos;
        frame = requestAnimationFrame(step);
      }
      function play() { if (!done && seen && !frame) { last = 0; frame = requestAnimationFrame(step); } }
      function stop() { cancelAnimationFrame(frame); frame = 0; }
      off.push(stop);
      keep(new IntersectionObserver(function (e) { seen = e[0].isIntersecting; if (seen) play(); else stop(); })).observe(root);
      ["wheel", "touchstart", "pointerdown", "keydown"].forEach(function (n) {
        on(root, n, function () { done = true; stop(); root.setAttribute("data-touched", ""); });
      });
      play();
      var native = window.CSS && CSS.supports("animation-timeline: view()");
    
      // Without scroll-driven animations: sort the pile once when half the grid is in view.
      if (!reduce && !native) {
        root.setAttribute("data-fb", "");
        var io = keep(new IntersectionObserver(function (es) {
          if (es[0].isIntersecting) { es[0].target.classList.add("w1pil-in"); io.disconnect(); }
        }, { root: root, threshold: 0.5 }));
        io.observe(root.querySelector(".w1pil-grid"));
      }
    return () => off.forEach((f: any) => f());
  }, [prefersReduced]);

  return (
    <section className="w1pil" data-w1pil="" ref={rootRef} tabIndex={0} aria-label="Fieldwork Prints coast series, scrollable">
    <style>{STYLES}</style>
      <div className="w1pil-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="w1pil-wrap">
        <p className="w1pil-eyebrow">Fieldwork Prints</p>
        <h2 className="w1pil-h">The coast series, printed on cotton rag</h2>
        <p className="w1pil-lead">Six photographs from one winter on the shore. Scroll and the pile on the table sorts itself onto the wall.</p>
        <ul className="w1pil-grid">
          <li className="w1pil-p"><figure><img src="https://images.pexels.com/photos/10867143/pexels-photo-10867143.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Rugged sandstone cliffs above a calm sea under a pale blue sky" loading="eager" width="800" height="800" /><figcaption>Sandstone point</figcaption></figure></li>
          <li className="w1pil-p"><figure><img src="https://images.pexels.com/photos/8990439/pexels-photo-8990439.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Aerial view of a pale rocky headland ringed by white surf and deep turquoise water" loading="eager" width="800" height="800" /><figcaption>The headland</figcaption></figure></li>
          <li className="w1pil-p"><figure><img src="https://images.pexels.com/photos/39982422/pexels-photo-39982422.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Grassy dunes running down to a wide beach and a green headland" loading="eager" width="800" height="800" /><figcaption>Dune path</figcaption></figure></li>
          <li className="w1pil-p"><figure><img src="https://images.pexels.com/photos/3030015/pexels-photo-3030015.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Aerial view of rows of painted fishing boats moored tightly in a harbour" loading="eager" width="800" height="800" /><figcaption>Harbour at rest</figcaption></figure></li>
          <li className="w1pil-p"><figure><img src="https://images.pexels.com/photos/18163250/pexels-photo-18163250.jpeg?auto=compress&cs=tinysrgb&w=800" alt="A small white lighthouse on a green cliff above a rocky shore and blue sea" loading="eager" width="800" height="800" /><figcaption>Lighthouse cliff</figcaption></figure></li>
          <li className="w1pil-p"><figure><img src="https://images.pexels.com/photos/17647534/pexels-photo-17647534.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Blue cornflowers and dry grasses against a soft blue summer sky" loading="eager" width="800" height="800" /><figcaption>Cornflowers</figcaption></figure></li>
        </ul>
        <div className="w1pil-end">
          <p>Each print is made to order and signed on the back.</p>
          <a href="#" className="w1pil-btn">Browse the series</a>
        </div>
      </div>
    </section>
  );
}

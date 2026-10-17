import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Same markup, styles and script as the plain HTML version. The CSS comments name the values to change.
const STYLES = `
  /* Change these: --w7crd-bg, --w7crd-card, --w7crd-lift (how far a card rises), --w7crd-shadow (colour of the hover shadow). */
  .w7crd { --w7crd-bg: #26322b; --w7crd-card: #f6f1e8; --w7crd-ink: #1f2420; --w7crd-lift: -10px; --w7crd-shadow: rgba(6,12,8,.55);
    padding: 56px 20px 64px; background: var(--w7crd-bg); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .w7crd-in { max-width: 66rem; margin: 0 auto; }
  .w7crd-top { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px 20px; color: #f6f1e8; }
  .w7crd-h { margin: 0; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(1.7rem, 3.6vw, 2.4rem); }
  .w7crd-all { display: inline-flex; align-items: center; min-height: 44px; color: #e6d9bf; font-size: 15px; font-weight: 600; text-underline-offset: 4px; }
  .w7crd-all:focus-visible, .w7crd-txt a:focus-visible, .w7crd-add:focus-visible { outline: 3px solid #e6b85c; outline-offset: 3px; }
  .w7crd-grid { display: grid; gap: 22px; margin: 28px 0 0; padding: 0; list-style: none; }
  .w7crd-c { position: relative; border-radius: 10px; background: var(--w7crd-card); color: var(--w7crd-ink); transform: translateY(0); transition: transform .45s cubic-bezier(.2,.8,.2,1); }
  /* The big soft shadow is drawn once here; hover only fades it in. */
  .w7crd-c::after { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: 10px; box-shadow: 0 30px 50px -18px var(--w7crd-shadow), 0 10px 18px -10px var(--w7crd-shadow); opacity: 0; transition: opacity .45s ease; }
  .w7crd-img { position: relative; overflow: hidden; border-radius: 10px 10px 0 0; aspect-ratio: 1; background: #ddd3c3; }
  .w7crd-img img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform .7s cubic-bezier(.2,.8,.2,1); }
  .w7crd-bar { position: absolute; left: 12px; right: 12px; bottom: 12px; transform: translateY(calc(100% + 14px)); transition: transform .45s cubic-bezier(.2,.8,.2,1); }
  .w7crd-add { width: 100%; min-height: 44px; border: 0; border-radius: 6px; background: var(--w7crd-ink); color: #f6f1e8; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
  .w7crd-add:hover { background: #3a463e; }
  .w7crd-txt { display: grid; grid-template-columns: 1fr auto; gap: 2px 12px; padding: 16px 18px 18px; }
  .w7crd-txt h3 { margin: 0; font-size: 16px; font-weight: 600; }
  .w7crd-txt a { color: inherit; text-decoration: none; }
  .w7crd-txt p { grid-column: 1; margin: 0; font-size: 14px; color: #535a54; }
  .w7crd-txt .w7crd-pr { grid-column: 2; grid-row: 1; font-size: 16px; font-weight: 600; color: var(--w7crd-ink); }
  .w7crd-c:hover, .w7crd-c:focus-within, .w7crd-c[data-demo] { transform: translateY(var(--w7crd-lift)); }
  .w7crd-c:hover::after, .w7crd-c:focus-within::after, .w7crd-c[data-demo]::after { opacity: 1; }
  .w7crd-c:hover img, .w7crd-c:focus-within img, .w7crd-c[data-demo] img { transform: scale(1.05); }
  .w7crd-c:hover .w7crd-bar, .w7crd-c:focus-within .w7crd-bar, .w7crd-c[data-demo] .w7crd-bar { transform: none; }
  @media (min-width: 720px) { .w7crd-grid { grid-template-columns: repeat(3, 1fr); } }
  /* Touch screens have no hover, so the add button is always shown. */
  @media (hover: none) { .w7crd-bar { transform: none; } }
  @media (prefers-reduced-motion: reduce) { .w7crd-c, .w7crd-c::after, .w7crd-img img, .w7crd-bar { transition: none; } .w7crd-c:hover img, .w7crd-c:focus-within img, .w7crd-c[data-demo] img { transform: none; } }
`;

export default function ProductCardsLiftWithShadowLayerAndQuickAdd() {
  const rootRef = useRef<any>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    const off: Array<() => void> = [];
    
      var STEP = 1700; // ms each card stays lifted during the demo
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // Demo only: cards take turns lifting until someone points at, taps or tabs into the grid.
      var cards = root.querySelectorAll(".w7crd-c"), i = 1, timer = 0, seen = true, done = false;
      function clear() { cards.forEach(function (c) { c.removeAttribute("data-demo"); }); }
      function step() { clear(); cards[i++ % cards.length].setAttribute("data-demo", ""); timer = setTimeout(step, STEP); }
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
    <section className="w7crd" data-w7crd="" ref={rootRef} aria-label="Hollow Lane homeware, new in">
      <style>{STYLES}</style>
      <div className="w7crd-in">
        <div className="w7crd-top">
          <h2 className="w7crd-h">New in the kitchen</h2>
          <a className="w7crd-all" href="#">Shop all homeware</a>
        </div>
        <ul className="w7crd-grid">
          <li className="w7crd-c">
            <div className="w7crd-img"><img src="https://images.pexels.com/photos/31785816/pexels-photo-31785816.jpeg?auto=compress&cs=tinysrgb&w=800" alt="A speckled deep blue stoneware mug on a wooden table" width="800" height="800" loading="eager" />
              <div className="w7crd-bar"><button className="w7crd-add" type="button">Add to basket</button></div></div>
            <div className="w7crd-txt"><h3><a href="#">Tidepool mug</a></h3><p>Reactive glaze, 340 ml</p><p className="w7crd-pr">£24</p></div>
          </li>
          <li className="w7crd-c">
            <div className="w7crd-img"><img src="https://images.pexels.com/photos/7233906/pexels-photo-7233906.jpeg?auto=compress&cs=tinysrgb&w=800" alt="A lit candle in a dark stoneware pot surrounded by dried flowers and matches" width="800" height="800" loading="eager" />
              <div className="w7crd-bar"><button className="w7crd-add" type="button">Add to basket</button></div></div>
            <div className="w7crd-txt"><h3><a href="#">Hearth candle</a></h3><p>Cedar and fig, 40 hour burn</p><p className="w7crd-pr">£32</p></div>
          </li>
          <li className="w7crd-c">
            <div className="w7crd-img"><img src="https://images.pexels.com/photos/12480291/pexels-photo-12480291.jpeg?auto=compress&cs=tinysrgb&w=800" alt="A white mug with a blue glazed rim beside a matching blue spoon" width="800" height="800" loading="eager" />
              <div className="w7crd-bar"><button className="w7crd-add" type="button">Add to basket</button></div></div>
            <div className="w7crd-txt"><h3><a href="#">Harbour mug and spoon</a></h3><p>Dipped rim, set of two</p><p className="w7crd-pr">£38</p></div>
          </li>
        </ul>
      </div>
    </section>
  );
}

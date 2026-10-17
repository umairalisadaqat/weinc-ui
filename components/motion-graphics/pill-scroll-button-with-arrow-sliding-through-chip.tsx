import { useEffect, useRef } from "react";

// Change these first: --m5pil-loop (one drop of the arrow), --m5pil-cream (pill and card colour), --m5pil-wheat (hover colour of the chip), --m5pil-box (frame height).
// Same markup, styles and script as the plain HTML version.
const CSS = `
.m5pil { position: relative; box-sizing: border-box; height: var(--m5pil-box); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; scrollbar-width: thin; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
/* To use on a real page: delete height and overflow above, make the hero 100vh, and set BOX = null in the script. */
.m5pil *, .m5pil *::before, .m5pil *::after { box-sizing: border-box; }
.m5pil:focus-visible { outline: 3px solid var(--m5pil-focus); outline-offset: -3px; }
.m5pil [tabindex="-1"]:focus { outline: none; }
.m5pil-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.m5pil-hint { position: sticky; top: 0; height: 0; z-index: 6; display: flex; justify-content: center; align-items: flex-start; pointer-events: none; }
.m5pil-hint span { margin: 10px 0 0; padding: 4px 11px; border-radius: 999px; background: var(--m5pil-hintbg); color: var(--m5pil-hintfg); font-size: 11.5px; letter-spacing: .04em; transition: opacity .5s ease; }
.m5pil[data-touched] .m5pil-hint span { opacity: 0; }
@media (max-width: 600px) { .m5pil-hint { justify-content: flex-end; } .m5pil-hint span { margin-right: 10px; } }
.m5pil-hero { position: relative; min-height: var(--m5pil-box); }
.m5pil-cue { -webkit-tap-highlight-color: transparent; transition: opacity .45s ease, transform .45s ease, visibility 0s linear 0s; }
.m5pil-cue:focus-visible { outline: 2px solid var(--m5pil-focus); outline-offset: 4px; }
/* Faded once the marker below the hero is in view; the loop is paused while hidden or off screen. */
.m5pil[data-gone] .m5pil-cue { opacity: 0; visibility: hidden; transform: translateY(10px); pointer-events: none; transition: opacity .45s ease, transform .45s ease, visibility 0s linear .45s; }
.m5pil[data-gone] .m5pil-cue *, .m5pil[data-off] .m5pil-cue * { animation-play-state: paused !important; }
.m5pil-mark { height: 1px; margin-bottom: -1px; }
/* Reduced motion: the cue stands still at full strength and the link jumps instead of gliding. */
@media (prefers-reduced-motion: reduce) {
  .m5pil *, .m5pil *::before, .m5pil *::after { animation: none !important; transition: none !important; }
}
.m5pil { --m5pil-box: 620px; --m5pil-bg: #2b2017; --m5pil-cream: #f7efe1; --m5pil-ink: #2b2017; --m5pil-quiet: #6b5644; --m5pil-wheat: #b9832f; --m5pil-focus: #f7efe1; --m5pil-hintbg: rgba(43,32,23,.78); --m5pil-hintfg: #f7efe1; --m5pil-loop: 2.4s;
  background: var(--m5pil-bg); color: var(--m5pil-ink); }
.m5pil-hero { overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px 110px; }
.m5pil-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.m5pil-shade { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 45%, rgba(30,22,15,.2), rgba(30,22,15,.6) 80%); }
.m5pil-card { position: relative; max-width: 520px; padding: 34px clamp(22px, 4vw, 40px) 30px; background: var(--m5pil-cream); border-radius: 4px; text-align: center; box-shadow: 0 30px 60px -28px rgba(20,12,6,.75); }
.m5pil-brand { margin: 0 0 14px; color: var(--m5pil-wheat); font-size: 12.5px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; }
.m5pil-h { margin: 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(30px, 4vw, 42px); line-height: 1.08; letter-spacing: -.015em; }
.m5pil-lede { margin: 14px 0 0; color: var(--m5pil-quiet); font-size: 15.5px; line-height: 1.6; }
.m5pil-cue { position: absolute; left: 0; right: 0; bottom: 32px; margin: 0 auto; width: max-content; display: inline-flex; align-items: center; gap: 14px; min-height: 52px; padding: 6px 6px 6px 22px; border-radius: 999px; background: var(--m5pil-cream); color: var(--m5pil-ink); text-decoration: none; font-size: 15px; font-weight: 600; box-shadow: 0 16px 30px -16px rgba(20,12,6,.8); }
.m5pil-cue:hover .m5pil-chip { background: var(--m5pil-wheat); }
.m5pil-cue:focus-visible { outline-color: var(--m5pil-cream); }
.m5pil-chip { position: relative; width: 40px; height: 40px; border-radius: 50%; background: var(--m5pil-ink); overflow: hidden; display: grid; place-items: center; transition: background-color .2s ease; }
.m5pil-arrow { width: 16px; height: 18px; fill: none; stroke: var(--m5pil-cream); stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; animation: m5pil-slide var(--m5pil-loop) cubic-bezier(.6,0,.3,1) infinite; }
/* One arrow drops out of the bottom of the round chip while an identical one slides in from the top; the loop restarts on a matching frame. */
@keyframes m5pil-slide {
  0%, 50% { transform: translateY(0); }
  78%, 100% { transform: translateY(30px); }
}
@keyframes m5pil-slide-in {
  0%, 50% { transform: translateY(-30px); }
  78%, 100% { transform: translateY(0); }
}
.m5pil-arrow { grid-area: 1 / 1; }
.m5pil-arrow2 { animation-name: m5pil-slide-in; }
@media (prefers-reduced-motion: reduce) { .m5pil-arrow2 { display: none; } }
.m5pil-next { padding: 60px clamp(20px, 5vw, 60px) 76px; background: var(--m5pil-cream); }
.m5pil-h2 { margin: 0 0 22px; font-family: Georgia, serif; font-weight: 400; font-size: 32px; }
.m5pil-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0 28px; }
.m5pil-list li { padding: 18px 0; border-top: 1px solid #ddcdb4; }
.m5pil-list h3 { margin: 0; font-size: 17px; }
.m5pil-list p { margin: 6px 0 0; color: var(--m5pil-quiet); font-size: 15px; line-height: 1.55; }
@media (max-width: 600px) { .m5pil-hero { padding: 40px 16px 104px; } .m5pil-lede { font-size: 15px; } }
`;

export default function PillScrollButtonWithArrowSliding() {
  const rootRef = useRef<any>(null);

  // Fades the cue when a marker below the hero scrolls into view, pauses the loop off screen,
  // and glides to the next section on click (a plain jump when reduced motion is requested).
  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    var off = [];
    var BOX = root; // the scrolling box; set to null when the hero is on the page itself
    var cue = root.querySelector(".m5pil-cue"), mark = root.querySelector(".m5pil-mark");
    var reduce = matchMedia("(prefers-reduced-motion: reduce)");
    function on(el, n, f, o) { el.addEventListener(n, f, o); off.push(function () { el.removeEventListener(n, f, o); }); }
    function watch(cb, opts, el) { var o = new IntersectionObserver(cb, opts); o.observe(el); off.push(function () { o.disconnect(); }); }
    // Fade the cue once the marker just below the hero comes into view (or has gone past the top).
    watch(function (es) {
      var e = es[0], top = e.rootBounds ? e.rootBounds.top : 0;
      root.toggleAttribute("data-gone", e.isIntersecting || e.boundingClientRect.top < top);
    }, { root: BOX, rootMargin: "0px 0px -12% 0px" }, mark);
    // Pause the loop while the whole piece is off screen.
    watch(function (es) { root.toggleAttribute("data-off", !es[0].isIntersecting); }, {}, root);
    on(BOX || window, "scroll", function () { root.setAttribute("data-touched", ""); }, { passive: true, once: true });
    function go(ev) {
      var t = root.querySelector(cue.getAttribute("href"));
      if (!t) return;
      ev.preventDefault();
      var y = BOX ? t.getBoundingClientRect().top - BOX.getBoundingClientRect().top + BOX.scrollTop : t.getBoundingClientRect().top + scrollY;
      (BOX || window).scrollTo({ top: y, behavior: reduce.matches ? "auto" : "smooth" });
      t.focus({ preventScroll: true });
    }
    on(cue, "click", go);
    return () => off.forEach((f: any) => f());
  }, []);

  return (
    <section ref={rootRef} className="m5pil" data-m5pil="" tabIndex="0" aria-label="Mill Lane Bakery first screen, scrollable">
      <style>{CSS}</style>
      <div className="m5pil-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <header className="m5pil-hero">
        <img className="m5pil-photo" src="https://images.pexels.com/photos/1383908/pexels-photo-1383908.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="A stack of floury rustic loaves piled on wooden shelves" width="1600" height="1067" />
        <div className="m5pil-shade" aria-hidden="true"></div>
        <div className="m5pil-card">
          <p className="m5pil-brand">Mill Lane Bakery</p>
          <h1 className="m5pil-h">Bread from the wood oven, out at seven.</h1>
          <p className="m5pil-lede">Sourdough, rye and a few sweet buns, baked overnight on Mill Lane and sold from the hatch until the shelves are empty.</p>
        </div>
        <a className="m5pil-cue" href="#m5pil-next">
          <span className="m5pil-label">See today's loaves</span>
          <span className="m5pil-chip" aria-hidden="true">
            <svg className="m5pil-arrow" viewBox="0 0 16 18" focusable="false"><path d="M8 2V15M3 10.5L8 15.5l5-5" /></svg>
            <svg className="m5pil-arrow m5pil-arrow2" viewBox="0 0 16 18" focusable="false"><path d="M8 2V15M3 10.5L8 15.5l5-5" /></svg>
          </span>
        </a>
      </header>
      <div className="m5pil-mark" aria-hidden="true"></div>
      <section className="m5pil-next" id="m5pil-next" tabIndex="-1" aria-labelledby="m5pil-loaves">
        <h2 className="m5pil-h2" id="m5pil-loaves">Today's loaves</h2>
        <ul className="m5pil-list">
          <li><h3>Country white</h3><p>A long, cool rise and a dark, crackling crust.</p></li>
          <li><h3>Seeded rye</h3><p>Dense and sour, with sunflower and linseed.</p></li>
          <li><h3>Spelt and honey</h3><p>Soft crumb, a little sweet, good for toast.</p></li>
          <li><h3>Cardamom buns</h3><p>Knotted by hand, from ten in the morning.</p></li>
        </ul>
      </section>
    </section>
  );
}

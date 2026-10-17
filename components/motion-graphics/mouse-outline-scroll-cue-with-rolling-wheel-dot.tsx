import { useEffect, useRef } from "react";

// Change these first: --m5mse-loop (how long one roll of the wheel dot takes), --m5mse-ink (cue and heading colour), --m5mse-box (height of the scrolling frame), and the photo in .m5mse-photo.
// Same markup, styles and script as the plain HTML version.
const CSS = `
.m5mse { position: relative; box-sizing: border-box; height: var(--m5mse-box); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; scrollbar-width: thin; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
/* To use on a real page: delete height and overflow above, make the hero 100vh, and set BOX = null in the script. */
.m5mse *, .m5mse *::before, .m5mse *::after { box-sizing: border-box; }
.m5mse:focus-visible { outline: 3px solid var(--m5mse-focus); outline-offset: -3px; }
.m5mse [tabindex="-1"]:focus { outline: none; }
.m5mse-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.m5mse-hint { position: sticky; top: 0; height: 0; z-index: 6; display: flex; justify-content: center; align-items: flex-start; pointer-events: none; }
.m5mse-hint span { margin: 10px 0 0; padding: 4px 11px; border-radius: 999px; background: var(--m5mse-hintbg); color: var(--m5mse-hintfg); font-size: 11.5px; letter-spacing: .04em; transition: opacity .5s ease; }
.m5mse[data-touched] .m5mse-hint span { opacity: 0; }
@media (max-width: 600px) { .m5mse-hint { justify-content: flex-end; } .m5mse-hint span { margin-right: 10px; } }
.m5mse-hero { position: relative; min-height: var(--m5mse-box); }
.m5mse-cue { -webkit-tap-highlight-color: transparent; transition: opacity .45s ease, transform .45s ease, visibility 0s linear 0s; }
.m5mse-cue:focus-visible { outline: 2px solid var(--m5mse-focus); outline-offset: 4px; }
/* Faded once the marker below the hero is in view; the loop is paused while hidden or off screen. */
.m5mse[data-gone] .m5mse-cue { opacity: 0; visibility: hidden; transform: translateY(10px); pointer-events: none; transition: opacity .45s ease, transform .45s ease, visibility 0s linear .45s; }
.m5mse[data-gone] .m5mse-cue *, .m5mse[data-off] .m5mse-cue * { animation-play-state: paused !important; }
.m5mse-mark { height: 1px; margin-bottom: -1px; }
/* Reduced motion: the cue stands still at full strength and the link jumps instead of gliding. */
@media (prefers-reduced-motion: reduce) {
  .m5mse *, .m5mse *::before, .m5mse *::after { animation: none !important; transition: none !important; }
}
.m5mse { --m5mse-box: 620px; --m5mse-bg: #141a15; --m5mse-ink: #f3f1ea; --m5mse-quiet: #c9cdc3; --m5mse-moss: #a9c49a; --m5mse-focus: #f3f1ea; --m5mse-hintbg: rgba(20,26,21,.7); --m5mse-hintfg: #f3f1ea; --m5mse-loop: 2.2s;
  background: var(--m5mse-bg); color: var(--m5mse-ink); }
.m5mse-hero { overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; padding: 26px clamp(20px, 5vw, 56px) 34px; }
.m5mse-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 60%; transform: scaleX(-1); }
.m5mse-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(14,19,15,.55) 0%, rgba(14,19,15,.1) 34%, rgba(14,19,15,.25) 58%, rgba(14,19,15,.86) 100%); }
.m5mse-bar, .m5mse-copy, .m5mse-cue { position: relative; }
.m5mse-bar { display: flex; justify-content: space-between; gap: 16px; font-size: 13px; letter-spacing: .02em; }
.m5mse-brand { font-weight: 650; letter-spacing: .14em; text-transform: uppercase; font-size: 12px; }
.m5mse-where { color: var(--m5mse-quiet); }
.m5mse-copy { max-width: 560px; margin-top: auto; padding-bottom: 92px; }
.m5mse-eyebrow { margin: 0 0 12px; color: var(--m5mse-moss); font-size: 12.5px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; }
.m5mse-h { margin: 0; font-family: Georgia, "Iowan Old Style", "Times New Roman", serif; font-weight: 400; font-size: clamp(36px, 5.4vw, 60px); line-height: 1.02; letter-spacing: -.02em; }
.m5mse-lede { margin: 16px 0 0; max-width: 30em; color: #e2e4dc; font-size: 16px; line-height: 1.6; }
.m5mse-cue { position: absolute; left: 0; right: 0; bottom: 26px; margin: 0 auto; width: max-content; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 6px 0; color: var(--m5mse-ink); text-decoration: none; }
.m5mse-mouse { width: 26px; height: 41px; display: block; overflow: visible; }
.m5mse-body { fill: rgba(243,241,234,.06); stroke: currentColor; stroke-width: 1.6; }
.m5mse-dot { fill: currentColor; transform-box: fill-box; transform-origin: center; animation: m5mse-wheel var(--m5mse-loop) cubic-bezier(.45,0,.3,1) infinite; }
.m5mse-label { white-space: nowrap; font-size: 12px; font-weight: 500; letter-spacing: .12em; text-transform: uppercase; color: var(--m5mse-quiet); }
.m5mse-cue:hover .m5mse-label { color: var(--m5mse-ink); }
/* The wheel dot rolls down the mouse and fades, then reappears at the top. */
@keyframes m5mse-wheel {
  0%, 30% { transform: translateY(0) scale(1); opacity: 1; }
  72% { transform: translateY(11px) scale(.8); opacity: 0; }
  73% { transform: translateY(0) scale(.8); opacity: 0; }
  92%, 100% { transform: translateY(0) scale(1); opacity: 1; }
}
.m5mse-next { padding: 64px clamp(20px, 5vw, 56px) 80px; background: #f3f1ea; color: #1c241d; }
.m5mse-h2 { margin: 0 0 28px; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: 34px; letter-spacing: -.01em; }
.m5mse-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0 28px; }
.m5mse-list li { padding: 18px 0; border-top: 1px solid #cfd2c6; }
.m5mse-list h3 { margin: 0; font-size: 17px; font-weight: 650; }
.m5mse-list p { margin: 6px 0 0; font-size: 15px; line-height: 1.55; color: #4a5248; }
@media (max-width: 600px) { .m5mse-where { display: none; } .m5mse-copy { padding-bottom: 104px; } }
@media (prefers-reduced-motion: reduce) { .m5mse-dot { opacity: 1; transform: none; } }
`;

export default function MouseOutlineScrollCueWithRolling() {
  const rootRef = useRef<any>(null);

  // Fades the cue when a marker below the hero scrolls into view, pauses the loop off screen,
  // and glides to the next section on click (a plain jump when reduced motion is requested).
  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    var off = [];
    var BOX = root; // the scrolling box; set to null when the hero is on the page itself
    var cue = root.querySelector(".m5mse-cue"), mark = root.querySelector(".m5mse-mark");
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
    <section ref={rootRef} className="m5mse" data-m5mse="" tabIndex="0" aria-label="Larchwood Cabins first screen, scrollable">
      <style>{CSS}</style>
      <div className="m5mse-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <header className="m5mse-hero">
        <img className="m5mse-photo" src="https://images.pexels.com/photos/19367250/pexels-photo-19367250.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="A weathered wooden cabin on a grassy slope below a misty pine forest" width="1600" height="1067" />
        <div className="m5mse-shade" aria-hidden="true"></div>
        <div className="m5mse-bar">
          <span className="m5mse-brand">Larchwood Cabins</span>
          <span className="m5mse-where">Glen Ardle, open all year</span>
        </div>
        <div className="m5mse-copy">
          <p className="m5mse-eyebrow">Four cabins, one hillside</p>
          <h1 className="m5mse-h">Wake up above the fog line.</h1>
          <p className="m5mse-lede">Timber cabins with wood stoves and no signal, a short walk up from the lane. Bring boots; we bring the kindling.</p>
        </div>
        <a className="m5mse-cue" href="#m5mse-next">
          <svg className="m5mse-mouse" viewBox="0 0 28 44" aria-hidden="true" focusable="false">
            <rect className="m5mse-body" x="1.5" y="1.5" width="25" height="41" rx="12.5" />
            <circle className="m5mse-dot" cx="14" cy="12" r="2.6" />
          </svg>
          <span className="m5mse-label">Scroll to the cabins</span>
        </a>
      </header>
      <div className="m5mse-mark" aria-hidden="true"></div>
      <section className="m5mse-next" id="m5mse-next" tabIndex="-1" aria-labelledby="m5mse-cabins">
        <h2 className="m5mse-h2" id="m5mse-cabins">The cabins</h2>
        <ul className="m5mse-list">
          <li><h3>Rowan</h3><p>Sleeps two. A box bed under the window that faces down the glen.</p></li>
          <li><h3>Alder</h3><p>Sleeps four. Bunk room for children and a porch with a bench.</p></li>
          <li><h3>Birch</h3><p>Sleeps two. The highest cabin, with a cast iron bath on the deck.</p></li>
          <li><h3>Holly</h3><p>Sleeps three. Step-free from the track, closest to the wood store.</p></li>
        </ul>
      </section>
    </section>
  );
}

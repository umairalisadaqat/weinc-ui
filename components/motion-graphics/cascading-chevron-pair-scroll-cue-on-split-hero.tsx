import { useEffect, useRef } from "react";

// Change these first: --m5chv-loop (length of one pulse), --m5chv-ink (the round chip behind the chevrons), --m5chv-clay (accent), --m5chv-box (frame height).
// Same markup, styles and script as the plain HTML version.
const CSS = `
.m5chv { position: relative; box-sizing: border-box; height: var(--m5chv-box); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; scrollbar-width: thin; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
/* To use on a real page: delete height and overflow above, make the hero 100vh, and set BOX = null in the script. */
.m5chv *, .m5chv *::before, .m5chv *::after { box-sizing: border-box; }
.m5chv:focus-visible { outline: 3px solid var(--m5chv-focus); outline-offset: -3px; }
.m5chv [tabindex="-1"]:focus { outline: none; }
.m5chv-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.m5chv-hint { position: sticky; top: 0; height: 0; z-index: 6; display: flex; justify-content: center; align-items: flex-start; pointer-events: none; }
.m5chv-hint span { margin: 10px 0 0; padding: 4px 11px; border-radius: 999px; background: var(--m5chv-hintbg); color: var(--m5chv-hintfg); font-size: 11.5px; letter-spacing: .04em; transition: opacity .5s ease; }
.m5chv[data-touched] .m5chv-hint span { opacity: 0; }
@media (max-width: 600px) { .m5chv-hint { justify-content: flex-end; } .m5chv-hint span { margin-right: 10px; } }
.m5chv-hero { position: relative; min-height: var(--m5chv-box); }
.m5chv-cue { -webkit-tap-highlight-color: transparent; transition: opacity .45s ease, transform .45s ease, visibility 0s linear 0s; }
.m5chv-cue:focus-visible { outline: 2px solid var(--m5chv-focus); outline-offset: 4px; }
/* Faded once the marker below the hero is in view; the loop is paused while hidden or off screen. */
.m5chv[data-gone] .m5chv-cue { opacity: 0; visibility: hidden; transform: translateY(10px); pointer-events: none; transition: opacity .45s ease, transform .45s ease, visibility 0s linear .45s; }
.m5chv[data-gone] .m5chv-cue *, .m5chv[data-off] .m5chv-cue * { animation-play-state: paused !important; }
.m5chv-mark { height: 1px; margin-bottom: -1px; }
/* Reduced motion: the cue stands still at full strength and the link jumps instead of gliding. */
@media (prefers-reduced-motion: reduce) {
  .m5chv *, .m5chv *::before, .m5chv *::after { animation: none !important; transition: none !important; }
}
.m5chv { --m5chv-box: 620px; --m5chv-bg: #efe4d4; --m5chv-ink: #2e1d14; --m5chv-quiet: #6a4f3f; --m5chv-clay: #a5492a; --m5chv-focus: #a5492a; --m5chv-hintbg: rgba(46,29,20,.8); --m5chv-hintfg: #f6eee2; --m5chv-loop: 1.8s;
  background: var(--m5chv-bg); color: var(--m5chv-ink); }
.m5chv-hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.m5chv-text { position: relative; display: flex; flex-direction: column; padding: 28px clamp(20px, 4.5vw, 60px) 30px; }
.m5chv-brand { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: 19px; font-style: italic; }
.m5chv-copy { margin: auto 0; padding: 24px 0; }
.m5chv-eyebrow { margin: 0 0 14px; color: var(--m5chv-clay); font-size: 12.5px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; }
.m5chv-h { margin: 0; font-family: Georgia, "Iowan Old Style", serif; font-weight: 400; font-size: clamp(34px, 4.4vw, 54px); line-height: 1.04; letter-spacing: -.02em; max-width: 12em; }
.m5chv-lede { margin: 18px 0 0; max-width: 28em; color: var(--m5chv-quiet); font-size: 16px; line-height: 1.6; }
.m5chv-cue { align-self: flex-start; display: inline-flex; align-items: center; gap: 14px; min-height: 48px; padding: 4px 18px 4px 4px; border-radius: 999px; color: var(--m5chv-ink); text-decoration: none; font-size: 15px; font-weight: 600; }
.m5chv-chev { width: 40px; height: 40px; padding: 6px 9px; border-radius: 50%; background: var(--m5chv-ink); color: #f6eee2; overflow: visible; }
.m5chv-chev path { fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; transform-box: fill-box; transform-origin: center; animation: m5chv-fall var(--m5chv-loop) ease-in-out infinite; }
.m5chv-chev .m5chv-c2 { animation-delay: calc(var(--m5chv-loop) * .18); }
.m5chv-cue:hover .m5chv-label { text-decoration: underline; text-underline-offset: 5px; }
/* Each chevron brightens and drops a little in turn, so the pair reads as one downward pulse. */
@keyframes m5chv-fall {
  0%, 100% { opacity: .35; transform: translateY(-2px); }
  45% { opacity: 1; transform: translateY(1.5px); }
}
.m5chv-fig { margin: 0; position: relative; overflow: hidden; }
.m5chv-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 60% 50%; }
.m5chv-next { padding: 60px clamp(20px, 4.5vw, 60px) 76px; background: #f7f0e6; }
.m5chv-h2 { margin: 0 0 22px; font-family: Georgia, serif; font-weight: 400; font-size: 32px; }
.m5chv-list { list-style: none; margin: 0; padding: 0; max-width: 760px; }
.m5chv-list li { display: grid; grid-template-columns: 64px 1fr; gap: 16px; padding: 18px 0; border-top: 1px solid #dccbb5; }
.m5chv-day { color: var(--m5chv-clay); font-weight: 700; font-size: 13px; letter-spacing: .1em; text-transform: uppercase; padding-top: 3px; }
.m5chv-list h3 { margin: 0; font-size: 17px; }
.m5chv-list p { margin: 4px 0 0; color: var(--m5chv-quiet); font-size: 15px; line-height: 1.55; }
@media (max-width: 760px) {
  .m5chv-hero { grid-template-columns: 1fr; grid-template-rows: 190px 1fr; }
  .m5chv-fig { grid-row: 1; }
  .m5chv-text { padding-top: 22px; }
  .m5chv-copy { padding: 18px 0 20px; }
  .m5chv-h { font-size: 32px; }
  .m5chv-lede { font-size: 15px; margin-top: 12px; }
}
@media (prefers-reduced-motion: reduce) { .m5chv-chev path { opacity: 1; transform: none; } }
`;

export default function CascadingChevronPairScrollCueOn() {
  const rootRef = useRef<any>(null);

  // Fades the cue when a marker below the hero scrolls into view, pauses the loop off screen,
  // and glides to the next section on click (a plain jump when reduced motion is requested).
  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    var off = [];
    var BOX = root; // the scrolling box; set to null when the hero is on the page itself
    var cue = root.querySelector(".m5chv-cue"), mark = root.querySelector(".m5chv-mark");
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
    <section ref={rootRef} className="m5chv" data-m5chv="" tabIndex="0" aria-label="Ashby Clay Studio first screen, scrollable">
      <style>{CSS}</style>
      <div className="m5chv-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <header className="m5chv-hero">
        <div className="m5chv-text">
          <p className="m5chv-brand">Ashby Clay Studio</p>
          <div className="m5chv-copy">
            <p className="m5chv-eyebrow">Wheel and hand-building, Tuesday to Saturday</p>
            <h1 className="m5chv-h">Learn to throw a pot that holds water.</h1>
            <p className="m5chv-lede">Small evening groups of six at a wheel each, in a converted dairy on Kiln Lane. Glazes, firing and tea are part of every course.</p>
          </div>
          <a className="m5chv-cue" href="#m5chv-next">
            <svg className="m5chv-chev" viewBox="0 0 24 30" aria-hidden="true" focusable="false">
              <path className="m5chv-c1" d="M5 6l7 7 7-7" />
              <path className="m5chv-c2" d="M5 16l7 7 7-7" />
            </svg>
            <span className="m5chv-label">See the classes</span>
          </a>
        </div>
        <figure className="m5chv-fig">
          <img className="m5chv-photo" src="https://images.pexels.com/photos/31875677/pexels-photo-31875677.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Clay-covered hands opening up a small pot on a spinning potter's wheel" width="1200" height="801" />
        </figure>
      </header>
      <div className="m5chv-mark" aria-hidden="true"></div>
      <section className="m5chv-next" id="m5chv-next" tabIndex="-1" aria-labelledby="m5chv-classes">
        <h2 className="m5chv-h2" id="m5chv-classes">Classes this term</h2>
        <ul className="m5chv-list">
          <li><span className="m5chv-day">Tue</span><div><h3>First clay</h3><p>Centring, opening and pulling up a cylinder over six weeks.</p></div></li>
          <li><span className="m5chv-day">Thu</span><div><h3>Bowls and lids</h3><p>Trimming feet, fitting lids and turning a set of four.</p></div></li>
          <li><span className="m5chv-day">Sat</span><div><h3>Coil and slab</h3><p>Hand-built planters and platters, no wheel needed.</p></div></li>
        </ul>
      </section>
    </section>
  );
}

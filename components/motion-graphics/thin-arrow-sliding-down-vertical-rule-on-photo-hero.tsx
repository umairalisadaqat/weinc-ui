import { useEffect, useRef } from "react";

// Change these first: --m5rul-loop (one slide of the arrow), --m5rul-sun (arrow and number colour), the 86px travel in m5rul-run (keep it under the rule height), --m5rul-box (frame height).
// Same markup, styles and script as the plain HTML version.
const CSS = `
.m5rul { position: relative; box-sizing: border-box; height: var(--m5rul-box); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; scrollbar-width: thin; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
/* To use on a real page: delete height and overflow above, make the hero 100vh, and set BOX = null in the script. */
.m5rul *, .m5rul *::before, .m5rul *::after { box-sizing: border-box; }
.m5rul:focus-visible { outline: 3px solid var(--m5rul-focus); outline-offset: -3px; }
.m5rul [tabindex="-1"]:focus { outline: none; }
.m5rul-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.m5rul-hint { position: sticky; top: 0; height: 0; z-index: 6; display: flex; justify-content: center; align-items: flex-start; pointer-events: none; }
.m5rul-hint span { margin: 10px 0 0; padding: 4px 11px; border-radius: 999px; background: var(--m5rul-hintbg); color: var(--m5rul-hintfg); font-size: 11.5px; letter-spacing: .04em; transition: opacity .5s ease; }
.m5rul[data-touched] .m5rul-hint span { opacity: 0; }
@media (max-width: 600px) { .m5rul-hint { justify-content: flex-end; } .m5rul-hint span { margin-right: 10px; } }
.m5rul-hero { position: relative; min-height: var(--m5rul-box); }
.m5rul-cue { -webkit-tap-highlight-color: transparent; transition: opacity .45s ease, transform .45s ease, visibility 0s linear 0s; }
.m5rul-cue:focus-visible { outline: 2px solid var(--m5rul-focus); outline-offset: 4px; }
/* Faded once the marker below the hero is in view; the loop is paused while hidden or off screen. */
.m5rul[data-gone] .m5rul-cue { opacity: 0; visibility: hidden; transform: translateY(10px); pointer-events: none; transition: opacity .45s ease, transform .45s ease, visibility 0s linear .45s; }
.m5rul[data-gone] .m5rul-cue *, .m5rul[data-off] .m5rul-cue * { animation-play-state: paused !important; }
.m5rul-mark { height: 1px; margin-bottom: -1px; }
/* Reduced motion: the cue stands still at full strength and the link jumps instead of gliding. */
@media (prefers-reduced-motion: reduce) {
  .m5rul *, .m5rul *::before, .m5rul *::after { animation: none !important; transition: none !important; }
}
.m5rul { --m5rul-box: 620px; --m5rul-bg: #12202a; --m5rul-ink: #ffffff; --m5rul-quiet: #d8e0e3; --m5rul-sun: #f0c674; --m5rul-focus: #ffffff; --m5rul-hintbg: rgba(18,32,42,.72); --m5rul-hintfg: #fff; --m5rul-loop: 2.8s;
  background: var(--m5rul-bg); color: var(--m5rul-ink); }
.m5rul-hero { overflow: hidden; display: flex; flex-direction: column; padding: 26px clamp(20px, 5vw, 60px) 40px; }
.m5rul-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 40%; }
.m5rul-shade { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(10,20,27,.88) 0%, rgba(10,20,27,.5) 42%, rgba(10,20,27,0) 70%), linear-gradient(180deg, rgba(10,20,27,.45), rgba(10,20,27,0) 22%); }
.m5rul-brand, .m5rul-low { position: relative; }
.m5rul-brand { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; }
.m5rul-low { margin-top: auto; display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: end; gap: 40px; }
.m5rul-cue { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; padding: 4px 6px 4px 0; color: var(--m5rul-ink); text-decoration: none; }
.m5rul-rule { width: 16px; height: 120px; display: block; overflow: visible; }
.m5rul-rule path { fill: none; stroke-linecap: round; stroke-linejoin: round; }
.m5rul-track { stroke: rgba(255,255,255,.35); stroke-width: 1; }
.m5rul-head path { stroke: var(--m5rul-sun); stroke-width: 1.8; }
.m5rul-head { transform-box: view-box; animation: m5rul-run var(--m5rul-loop) cubic-bezier(.55,0,.3,1) infinite; }
.m5rul-label { display: flex; flex-direction: column; gap: 4px; max-width: 8em; font-size: 13px; font-weight: 600; line-height: 1.35; letter-spacing: .02em; }
.m5rul-num { color: var(--m5rul-sun); font-size: 11px; letter-spacing: .16em; }
.m5rul-cue:hover .m5rul-label { text-decoration: underline; text-underline-offset: 4px; }
/* The arrow slides down the thin rule, fades near the end, then comes back in at the top. */
@keyframes m5rul-run {
  0% { transform: translateY(0); opacity: 0; }
  12%, 62% { opacity: 1; }
  80% { transform: translateY(86px); opacity: 0; }
  100% { transform: translateY(86px); opacity: 0; }
}
.m5rul-copy { max-width: 560px; padding-bottom: 4px; }
.m5rul-eyebrow { margin: 0 0 12px; color: var(--m5rul-sun); font-size: 12.5px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
.m5rul-h { margin: 0; font-size: clamp(34px, 5vw, 58px); font-weight: 700; line-height: 1; letter-spacing: -.03em; }
.m5rul-lede { margin: 16px 0 0; max-width: 30em; color: var(--m5rul-quiet); font-size: 16px; line-height: 1.6; }
.m5rul-next { padding: 60px clamp(20px, 5vw, 60px) 76px; background: #eef2f1; color: #14232c; }
.m5rul-h2 { margin: 0 0 22px; font-size: 30px; letter-spacing: -.02em; }
.m5rul-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0 28px; }
.m5rul-list li { padding: 18px 0; border-top: 2px solid #14232c; }
.m5rul-list h3 { margin: 0; font-size: 17px; }
.m5rul-list p { margin: 6px 0 0; color: #455760; font-size: 15px; line-height: 1.55; }
@media (max-width: 640px) {
  .m5rul-low { grid-template-columns: 1fr; gap: 26px; }
  .m5rul-cue { order: 2; flex-direction: row; align-items: center; }
  .m5rul-rule { height: 72px; }
  .m5rul-head { animation-name: m5rul-run-short; }
  .m5rul-label { max-width: none; }
}
@keyframes m5rul-run-short { 0% { transform: translateY(0); opacity: 0; } 12%, 60% { opacity: 1; } 80%, 100% { transform: translateY(40px); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .m5rul-head { opacity: 1; transform: translateY(40px); } }
`;

export default function ThinArrowSlidingDownVerticalRule() {
  const rootRef = useRef<any>(null);

  // Fades the cue when a marker below the hero scrolls into view, pauses the loop off screen,
  // and glides to the next section on click (a plain jump when reduced motion is requested).
  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    var off = [];
    var BOX = root; // the scrolling box; set to null when the hero is on the page itself
    var cue = root.querySelector(".m5rul-cue"), mark = root.querySelector(".m5rul-mark");
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
    <section ref={rootRef} className="m5rul" data-m5rul="" tabIndex="0" aria-label="Ridgeback Walking first screen, scrollable">
      <style>{CSS}</style>
      <div className="m5rul-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <header className="m5rul-hero">
        <img className="m5rul-photo" src="https://images.pexels.com/photos/19273401/pexels-photo-19273401.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="A grassy mountain ridge in early morning light with a narrow footpath along its crest" width="1600" height="900" />
        <div className="m5rul-shade" aria-hidden="true"></div>
        <p className="m5rul-brand">Ridgeback Walking</p>
        <div className="m5rul-low">
          <a className="m5rul-cue" href="#m5rul-next">
            <svg className="m5rul-rule" viewBox="0 0 16 120" aria-hidden="true" focusable="false">
              <path className="m5rul-track" d="M8 2V118" />
              <g className="m5rul-head"><path d="M8 4V30" /><path d="M3.5 25.5L8 30l4.5-4.5" /></g>
            </svg>
            <span className="m5rul-label"><span className="m5rul-num">01</span>Routes for this season</span>
          </a>
          <div className="m5rul-copy">
            <p className="m5rul-eyebrow">Guided hill days, small groups</p>
            <h1 className="m5rul-h">Follow the ridge, not the crowd.</h1>
            <p className="m5rul-lede">Full-day walks led by local guides who know where the path forks and when the weather turns. Lunch is carried; maps are ours.</p>
          </div>
        </div>
      </header>
      <div className="m5rul-mark" aria-hidden="true"></div>
      <section className="m5rul-next" id="m5rul-next" tabIndex="-1" aria-labelledby="m5rul-routes">
        <h2 className="m5rul-h2" id="m5rul-routes">Routes for this season</h2>
        <ul className="m5rul-list">
          <li><h3>The long crest</h3><p>Eighteen kilometres along the main ridge, steady climbs, open views most of the way.</p></li>
          <li><h3>Two tarns loop</h3><p>A shorter circuit past two mountain lakes, good for a first hill day.</p></li>
          <li><h3>Dawn summit</h3><p>An early start with head torches to reach the top as the light comes up.</p></li>
        </ul>
      </section>
    </section>
  );
}

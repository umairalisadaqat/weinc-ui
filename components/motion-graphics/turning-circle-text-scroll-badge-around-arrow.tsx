import { useEffect, useRef } from "react";

// Change these first: --m5ring-turn (seconds per full turn of the ring of words), --m5ring-crema (arrow colour), the words inside textPath, --m5ring-box (frame height).
// Same markup, styles and script as the plain HTML version.
const CSS = `
.m5ring { position: relative; box-sizing: border-box; height: var(--m5ring-box); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; scrollbar-width: thin; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
/* To use on a real page: delete height and overflow above, make the hero 100vh, and set BOX = null in the script. */
.m5ring *, .m5ring *::before, .m5ring *::after { box-sizing: border-box; }
.m5ring:focus-visible { outline: 3px solid var(--m5ring-focus); outline-offset: -3px; }
.m5ring [tabindex="-1"]:focus { outline: none; }
.m5ring-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.m5ring-hint { position: sticky; top: 0; height: 0; z-index: 6; display: flex; justify-content: center; align-items: flex-start; pointer-events: none; }
.m5ring-hint span { margin: 10px 0 0; padding: 4px 11px; border-radius: 999px; background: var(--m5ring-hintbg); color: var(--m5ring-hintfg); font-size: 11.5px; letter-spacing: .04em; transition: opacity .5s ease; }
.m5ring[data-touched] .m5ring-hint span { opacity: 0; }
@media (max-width: 600px) { .m5ring-hint { justify-content: flex-end; } .m5ring-hint span { margin-right: 10px; } }
.m5ring-hero { position: relative; min-height: var(--m5ring-box); }
.m5ring-cue { -webkit-tap-highlight-color: transparent; transition: opacity .45s ease, transform .45s ease, visibility 0s linear 0s; }
.m5ring-cue:focus-visible { outline: 2px solid var(--m5ring-focus); outline-offset: 4px; }
/* Faded once the marker below the hero is in view; the loop is paused while hidden or off screen. */
.m5ring[data-gone] .m5ring-cue { opacity: 0; visibility: hidden; transform: translateY(10px); pointer-events: none; transition: opacity .45s ease, transform .45s ease, visibility 0s linear .45s; }
.m5ring[data-gone] .m5ring-cue *, .m5ring[data-off] .m5ring-cue * { animation-play-state: paused !important; }
.m5ring-mark { height: 1px; margin-bottom: -1px; }
/* Reduced motion: the cue stands still at full strength and the link jumps instead of gliding. */
@media (prefers-reduced-motion: reduce) {
  .m5ring *, .m5ring *::before, .m5ring *::after { animation: none !important; transition: none !important; }
}
.m5ring { --m5ring-box: 620px; --m5ring-bg: #17110d; --m5ring-ink: #f4ebe0; --m5ring-quiet: #d3c4b3; --m5ring-crema: #d9a46b; --m5ring-focus: #f4ebe0; --m5ring-hintbg: rgba(23,17,13,.75); --m5ring-hintfg: #f4ebe0; --m5ring-turn: 16s;
  background: var(--m5ring-bg); color: var(--m5ring-ink); }
.m5ring-hero { overflow: hidden; display: flex; flex-direction: column; padding: 26px clamp(20px, 5vw, 60px) 40px; }
.m5ring-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 60% 50%; }
.m5ring-shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(18,12,9,.9) 0%, rgba(18,12,9,.62) 46%, rgba(18,12,9,.12) 100%), linear-gradient(0deg, rgba(18,12,9,.5), rgba(18,12,9,0) 40%); }
.m5ring-brand, .m5ring-copy { position: relative; }
.m5ring-brand { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: .02em; }
.m5ring-brand span { font-weight: 400; color: var(--m5ring-quiet); margin-left: 6px; }
.m5ring-copy { margin-top: auto; max-width: 540px; }
.m5ring-eyebrow { margin: 0 0 14px; color: var(--m5ring-crema); font-size: 12.5px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
.m5ring-h { margin: 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(32px, 4.4vw, 52px); line-height: 1.06; letter-spacing: -.02em; }
.m5ring-lede { margin: 18px 0 0; max-width: 30em; color: var(--m5ring-quiet); font-size: 16px; line-height: 1.6; }
.m5ring-cue { position: absolute; right: clamp(20px, 5vw, 60px); bottom: 40px; display: block; width: 124px; height: 124px; border-radius: 50%; color: var(--m5ring-ink); }
.m5ring-ring { width: 100%; height: 100%; display: block; overflow: visible; }
.m5ring-disc { fill: rgba(23,17,13,.5); stroke: rgba(244,235,224,.28); stroke-width: .8; }
.m5ring-words { fill: currentColor; font-size: 8.4px; font-weight: 600; letter-spacing: .5px; }
.m5ring-turn { transform-box: view-box; transform-origin: 50% 50%; animation: m5ring-turn var(--m5ring-turn) linear infinite; }
.m5ring-arrow { transform-box: view-box; transform-origin: 50% 50%; animation: m5ring-nudge 2.4s ease-in-out infinite; }
.m5ring-arrow path { fill: none; stroke: var(--m5ring-crema); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.m5ring-cue:hover .m5ring-disc { fill: rgba(23,17,13,.75); }
/* The ring of words turns slowly; the arrow in the middle nods down on its own, shorter beat. */
@keyframes m5ring-turn { to { transform: rotate(360deg); } }
@keyframes m5ring-nudge { 0%, 100% { transform: translateY(-2px); } 50% { transform: translateY(3px); } }
.m5ring-next { padding: 60px clamp(20px, 5vw, 60px) 76px; background: #f4ebe0; color: #2a1d15; }
.m5ring-h2 { margin: 0 0 22px; font-family: Georgia, serif; font-weight: 400; font-size: 32px; }
.m5ring-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0 28px; }
.m5ring-list li { padding: 18px 0; border-top: 1px solid #d9c9b6; }
.m5ring-list h3 { margin: 0; font-size: 17px; }
.m5ring-list p { margin: 6px 0 0; color: #5d4a3c; font-size: 15px; line-height: 1.55; }
@media (max-width: 760px) {
  .m5ring-copy { padding-bottom: 128px; }
  .m5ring-cue { width: 104px; height: 104px; bottom: 26px; left: 0; right: 0; margin: 0 auto; }
  .m5ring-shade { background: linear-gradient(0deg, rgba(18,12,9,.94) 0%, rgba(18,12,9,.7) 55%, rgba(18,12,9,.3) 100%); }
}
`;

export default function TurningCircleTextScrollBadgeAround() {
  const rootRef = useRef<any>(null);

  // Fades the cue when a marker below the hero scrolls into view, pauses the loop off screen,
  // and glides to the next section on click (a plain jump when reduced motion is requested).
  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    var off = [];
    var BOX = root; // the scrolling box; set to null when the hero is on the page itself
    var cue = root.querySelector(".m5ring-cue"), mark = root.querySelector(".m5ring-mark");
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
    <section ref={rootRef} className="m5ring" data-m5ring="" tabIndex="0" aria-label="Harbour Line Coffee first screen, scrollable">
      <style>{CSS}</style>
      <div className="m5ring-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <header className="m5ring-hero">
        <img className="m5ring-photo" src="https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Freshly roasted coffee beans turning in the cooling drum of a roaster" width="1600" height="1067" />
        <div className="m5ring-shade" aria-hidden="true"></div>
        <p className="m5ring-brand">Harbour Line <span>Coffee Roasters</span></p>
        <div className="m5ring-copy">
          <p className="m5ring-eyebrow">Roasted on Pier Road every Monday</p>
          <h1 className="m5ring-h">Small batches, cooled by hand, bagged the same day.</h1>
          <p className="m5ring-lede">Three single origins and one house blend at a time, roasted light enough to taste where they grew.</p>
        </div>
        <a className="m5ring-cue" href="#m5ring-next">
          <span className="m5ring-sr">Scroll to this week's roasts</span>
          <svg className="m5ring-ring" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
            <defs><path id="m5ring-circle" d="M50 50m-37 0a37 37 0 1 1 74 0a37 37 0 1 1 -74 0" /></defs>
            <circle className="m5ring-disc" cx="50" cy="50" r="48" />
            <g className="m5ring-turn">
              <text className="m5ring-words"><textPath href="#m5ring-circle" textLength="228" lengthAdjust="spacing">SCROLL DOWN · THIS WEEK'S ROASTS · </textPath></text>
            </g>
            <g className="m5ring-arrow">
              <path d="M50 38V61" />
              <path d="M42.5 53.5L50 61l7.5-7.5" />
            </g>
          </svg>
        </a>
      </header>
      <div className="m5ring-mark" aria-hidden="true"></div>
      <section className="m5ring-next" id="m5ring-next" tabIndex="-1" aria-labelledby="m5ring-roasts">
        <h2 className="m5ring-h2" id="m5ring-roasts">This week's roasts</h2>
        <ul className="m5ring-list">
          <li><h3>Huila, Colombia</h3><p>Red apple and panela. Washed, light roast.</p></li>
          <li><h3>Sidama, Ethiopia</h3><p>Bergamot and apricot. Natural, light roast.</p></li>
          <li><h3>Breakwater blend</h3><p>Cocoa and toasted hazelnut, for milk and moka pots.</p></li>
        </ul>
      </section>
    </section>
  );
}

import { useEffect, useRef } from "react";

// Change these first: --m5num-loop (one pass of the tick mark), --m5num-oak (accent), the chapter numbers and Next label, --m5num-box (frame height).
// Same markup, styles and script as the plain HTML version.
const CSS = `
.m5num { position: relative; box-sizing: border-box; height: var(--m5num-box); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; scrollbar-width: thin; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
/* To use on a real page: delete height and overflow above, make the hero 100vh, and set BOX = null in the script. */
.m5num *, .m5num *::before, .m5num *::after { box-sizing: border-box; }
.m5num:focus-visible { outline: 3px solid var(--m5num-focus); outline-offset: -3px; }
.m5num [tabindex="-1"]:focus { outline: none; }
.m5num-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.m5num-hint { position: sticky; top: 0; height: 0; z-index: 6; display: flex; justify-content: center; align-items: flex-start; pointer-events: none; }
.m5num-hint span { margin: 10px 0 0; padding: 4px 11px; border-radius: 999px; background: var(--m5num-hintbg); color: var(--m5num-hintfg); font-size: 11.5px; letter-spacing: .04em; transition: opacity .5s ease; }
.m5num[data-touched] .m5num-hint span { opacity: 0; }
@media (max-width: 600px) { .m5num-hint { justify-content: flex-end; } .m5num-hint span { margin-right: 10px; } }
.m5num-hero { position: relative; min-height: var(--m5num-box); }
.m5num-cue { -webkit-tap-highlight-color: transparent; transition: opacity .45s ease, transform .45s ease, visibility 0s linear 0s; }
.m5num-cue:focus-visible { outline: 2px solid var(--m5num-focus); outline-offset: 4px; }
/* Faded once the marker below the hero is in view; the loop is paused while hidden or off screen. */
.m5num[data-gone] .m5num-cue { opacity: 0; visibility: hidden; transform: translateY(10px); pointer-events: none; transition: opacity .45s ease, transform .45s ease, visibility 0s linear .45s; }
.m5num[data-gone] .m5num-cue *, .m5num[data-off] .m5num-cue * { animation-play-state: paused !important; }
.m5num-mark { height: 1px; margin-bottom: -1px; }
/* Reduced motion: the cue stands still at full strength and the link jumps instead of gliding. */
@media (prefers-reduced-motion: reduce) {
  .m5num *, .m5num *::before, .m5num *::after { animation: none !important; transition: none !important; }
}
.m5num { --m5num-box: 620px; --m5num-bg: #26272a; --m5num-ink: #f1eee8; --m5num-quiet: #b9b5ad; --m5num-oak: #d6a96f; --m5num-focus: #f1eee8; --m5num-hintbg: rgba(241,238,232,.12); --m5num-hintfg: #f1eee8; --m5num-loop: 2.6s;
  background: var(--m5num-bg); color: var(--m5num-ink); }
.m5num-hero { height: var(--m5num-box); display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: clamp(24px, 4vw, 56px); padding: 28px clamp(20px, 5vw, 60px) 34px; }
.m5num-text { display: flex; flex-direction: column; }
.m5num-brand { margin: 0; font-size: 15px; font-weight: 700; }
.m5num-brand span { margin-left: 8px; font-weight: 400; color: var(--m5num-quiet); }
.m5num-copy { margin: auto 0; padding: 24px 0; }
.m5num-eyebrow { margin: 0 0 14px; color: var(--m5num-oak); font-size: 12.5px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
.m5num-h { margin: 0; max-width: 12em; font-size: clamp(34px, 4.6vw, 56px); font-weight: 600; line-height: 1.02; letter-spacing: -.035em; }
.m5num-lede { margin: 18px 0 0; max-width: 30em; color: var(--m5num-quiet); font-size: 16px; line-height: 1.6; }
.m5num-cue { align-self: flex-start; display: flex; align-items: flex-end; gap: 18px; padding: 4px 8px 4px 0; color: var(--m5num-ink); text-decoration: none; }
.m5num-count { display: flex; align-items: baseline; gap: 6px; font-variant-numeric: tabular-nums; }
.m5num-count b { font-size: 46px; font-weight: 600; line-height: .9; letter-spacing: -.04em; }
.m5num-count span { color: var(--m5num-quiet); font-size: 15px; }
.m5num-side { display: flex; flex-direction: column; gap: 10px; padding-bottom: 3px; }
.m5num-ticks { width: 96px; height: 6px; display: block; overflow: visible; }
.m5num-ticks path { fill: none; stroke-width: 2.4; stroke-linecap: round; }
.m5num-t-on { stroke: var(--m5num-ink); }
.m5num-t-off { stroke: rgba(241,238,232,.24); }
.m5num-t-run { stroke: var(--m5num-oak); animation: m5num-run var(--m5num-loop) cubic-bezier(.6,0,.3,1) infinite; }
.m5num-label { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; }
.m5num-arrow { width: 12px; height: 14px; fill: none; stroke: var(--m5num-oak); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; animation: m5num-nod var(--m5num-loop) ease-in-out infinite; }
.m5num-cue:hover .m5num-label { text-decoration: underline; text-underline-offset: 4px; }
/* A short oak mark leaves the first tick and travels toward the second, hinting at the next chapter. */
@keyframes m5num-run {
  0%, 20% { transform: translateX(0); opacity: 0; }
  30% { opacity: 1; }
  70% { transform: translateX(24px); opacity: 1; }
  88%, 100% { transform: translateX(24px); opacity: 0; }
}
@keyframes m5num-nod { 0%, 30%, 100% { transform: translateY(0); } 60% { transform: translateY(3px); } }
.m5num-fig { margin: 0; position: relative; display: flex; flex-direction: column; gap: 10px; min-height: 0; }
.m5num-fig > .m5num-photo { position: absolute; inset: 0 0 28px; height: calc(100% - 28px); width: 100%; object-fit: cover; border-radius: 2px; box-shadow: 0 30px 60px -30px rgba(0,0,0,.7); }
.m5num-fig figcaption { margin-top: auto; color: var(--m5num-quiet); font-size: 12.5px; }
.m5num-next { padding: 60px clamp(20px, 5vw, 60px) 76px; background: #ece8e1; color: #222326; }
.m5num-chap { margin: 0 0 6px; color: #77706a; font-size: 13px; font-variant-numeric: tabular-nums; }
.m5num-h2 { margin: 0 0 22px; font-size: 34px; letter-spacing: -.03em; }
.m5num-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0 28px; }
.m5num-list li { padding: 18px 0; border-top: 1px solid #c9c3ba; }
.m5num-list h3 { margin: 0; font-size: 17px; }
.m5num-list p { margin: 6px 0 0; color: #55524d; font-size: 15px; line-height: 1.55; }
@media (max-width: 760px) {
  .m5num-hero { grid-template-columns: 1fr; grid-template-rows: auto 1fr; gap: 0; padding-top: 22px; }
  .m5num-fig { display: none; }
  .m5num-hero { grid-template-rows: 1fr; }
  .m5num-brand span { display: none; }
}
@media (prefers-reduced-motion: reduce) { .m5num-t-run { opacity: 0; } }
`;

export default function NumberedChapterScrollCueWithNext() {
  const rootRef = useRef<any>(null);

  // Fades the cue when a marker below the hero scrolls into view, pauses the loop off screen,
  // and glides to the next section on click (a plain jump when reduced motion is requested).
  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    var off = [];
    var BOX = root; // the scrolling box; set to null when the hero is on the page itself
    var cue = root.querySelector(".m5num-cue"), mark = root.querySelector(".m5num-mark");
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
    <section ref={rootRef} className="m5num" data-m5num="" tabIndex="0" aria-label="Wren and Ash Furniture first screen, scrollable">
      <style>{CSS}</style>
      <div className="m5num-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <header className="m5num-hero">
        <div className="m5num-text">
          <p className="m5num-brand">Wren &amp; Ash <span>Furniture workshop</span></p>
          <div className="m5num-copy">
            <p className="m5num-eyebrow">Catalogue, in four chapters</p>
            <h1 className="m5num-h">Made slowly in ash, oak and woven cane.</h1>
            <p className="m5num-lede">Chairs, tables, shelving and small things for the hall, built to order in a two-bench workshop and finished by hand with oil and wax.</p>
          </div>
          <a className="m5num-cue" href="#m5num-next">
            <span className="m5num-count" aria-hidden="true"><b>01</b><span>/ 04</span></span>
            <span className="m5num-side">
              <svg className="m5num-ticks" viewBox="0 0 96 6" aria-hidden="true" focusable="false">
                <path className="m5num-t-on" d="M3 3H21" />
                <path className="m5num-t-off" d="M27 3H45M51 3H69M75 3H93" />
                <path className="m5num-t-run" d="M3 3H21" />
              </svg>
              <span className="m5num-label"><span className="m5num-sr">Chapter 1 of 4. </span>Next: Chairs
                <svg className="m5num-arrow" viewBox="0 0 12 14" aria-hidden="true" focusable="false"><path d="M6 1.5V12M2 8l4 4 4-4" /></svg>
              </span>
            </span>
          </a>
        </div>
        <figure className="m5num-fig">
          <img className="m5num-photo" src="https://images.pexels.com/photos/20316942/pexels-photo-20316942.jpeg?auto=compress&cs=tinysrgb&w=1000" alt="Two wooden chairs with woven cane backs throwing patterned shadows on a pale wall" width="1000" height="1333" />
          <figcaption>Cane back chair, oiled ash</figcaption>
        </figure>
      </header>
      <div className="m5num-mark" aria-hidden="true"></div>
      <section className="m5num-next" id="m5num-next" tabIndex="-1" aria-labelledby="m5num-chairs">
        <p className="m5num-chap">02 / 04</p>
        <h2 className="m5num-h2" id="m5num-chairs">Chairs</h2>
        <ul className="m5num-list">
          <li><h3>Cane back side chair</h3><p>Steam-bent back rail, hand-woven cane, ash or oak frame.</p></li>
          <li><h3>Low reading chair</h3><p>A wide seat close to the floor, with a loose wool cushion.</p></li>
          <li><h3>Stacking stool</h3><p>Three legs, a dished seat, and stacks five high in a corner.</p></li>
        </ul>
      </section>
    </section>
  );
}

import { useEffect, useRef } from "react";

// Change these first: --m5lin-loop (one draw and run-off), --m5lin-ink (the drawn line and text), --m5lin-rule (the faint track and rules), --m5lin-box (frame height).
// Same markup, styles and script as the plain HTML version.
const CSS = `
.m5lin { position: relative; box-sizing: border-box; height: var(--m5lin-box); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; scrollbar-width: thin; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
/* To use on a real page: delete height and overflow above, make the hero 100vh, and set BOX = null in the script. */
.m5lin *, .m5lin *::before, .m5lin *::after { box-sizing: border-box; }
.m5lin:focus-visible { outline: 3px solid var(--m5lin-focus); outline-offset: -3px; }
.m5lin [tabindex="-1"]:focus { outline: none; }
.m5lin-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.m5lin-hint { position: sticky; top: 0; height: 0; z-index: 6; display: flex; justify-content: center; align-items: flex-start; pointer-events: none; }
.m5lin-hint span { margin: 10px 0 0; padding: 4px 11px; border-radius: 999px; background: var(--m5lin-hintbg); color: var(--m5lin-hintfg); font-size: 11.5px; letter-spacing: .04em; transition: opacity .5s ease; }
.m5lin[data-touched] .m5lin-hint span { opacity: 0; }
@media (max-width: 600px) { .m5lin-hint { justify-content: flex-end; } .m5lin-hint span { margin-right: 10px; } }
.m5lin-hero { position: relative; min-height: var(--m5lin-box); }
.m5lin-cue { -webkit-tap-highlight-color: transparent; transition: opacity .45s ease, transform .45s ease, visibility 0s linear 0s; }
.m5lin-cue:focus-visible { outline: 2px solid var(--m5lin-focus); outline-offset: 4px; }
/* Faded once the marker below the hero is in view; the loop is paused while hidden or off screen. */
.m5lin[data-gone] .m5lin-cue { opacity: 0; visibility: hidden; transform: translateY(10px); pointer-events: none; transition: opacity .45s ease, transform .45s ease, visibility 0s linear .45s; }
.m5lin[data-gone] .m5lin-cue *, .m5lin[data-off] .m5lin-cue * { animation-play-state: paused !important; }
.m5lin-mark { height: 1px; margin-bottom: -1px; }
/* Reduced motion: the cue stands still at full strength and the link jumps instead of gliding. */
@media (prefers-reduced-motion: reduce) {
  .m5lin *, .m5lin *::before, .m5lin *::after { animation: none !important; transition: none !important; }
}
.m5lin { --m5lin-box: 620px; --m5lin-bg: #f4eee3; --m5lin-ink: #221d18; --m5lin-quiet: #5f564b; --m5lin-rule: #d8cebd; --m5lin-focus: #221d18; --m5lin-hintbg: rgba(34,29,24,.82); --m5lin-hintfg: #f4eee3; --m5lin-loop: 2.6s;
  background: var(--m5lin-bg); color: var(--m5lin-ink); }
.m5lin-hero { display: flex; flex-direction: column; padding: 26px clamp(20px, 5vw, 64px) 30px; }
.m5lin-top { display: flex; justify-content: space-between; padding-bottom: 14px; border-bottom: 1px solid var(--m5lin-rule); font-size: 13px; }
.m5lin-brand { font-family: Georgia, "Times New Roman", serif; font-size: 20px; letter-spacing: -.01em; }
.m5lin-issue { color: var(--m5lin-quiet); align-self: flex-end; }
.m5lin-copy { margin: auto 0; padding: 30px 0 24px; text-align: center; }
.m5lin-eyebrow { margin: 0 0 18px; color: var(--m5lin-quiet); font-size: 12.5px; letter-spacing: .16em; text-transform: uppercase; }
.m5lin-h { margin: 0 auto; max-width: 13em; font-family: Georgia, "Iowan Old Style", "Times New Roman", serif; font-weight: 400; font-size: clamp(40px, 7vw, 84px); line-height: .98; letter-spacing: -.03em; }
.m5lin-h em { font-style: italic; color: #8a3b24; }
.m5lin-facts { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px 36px; margin: 30px 0 0; font-size: 14px; }
.m5lin-facts div { display: flex; gap: 8px; }
.m5lin-facts dt { color: var(--m5lin-quiet); }
.m5lin-facts dd { margin: 0; font-weight: 600; }
.m5lin-cue { align-self: center; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 6px 14px 0; color: var(--m5lin-ink); text-decoration: none; }
.m5lin-label { font-family: Georgia, serif; font-style: italic; font-size: 16px; }
.m5lin-cue:hover .m5lin-label { text-decoration: underline; text-underline-offset: 4px; }
.m5lin-line { width: 10px; height: 80px; display: block; }
.m5lin-line path { fill: none; stroke-linecap: round; }
.m5lin-track { stroke: var(--m5lin-rule); stroke-width: 1.4; }
.m5lin-draw { stroke: var(--m5lin-ink); stroke-width: 1.6; stroke-dasharray: 1 1; animation: m5lin-draw var(--m5lin-loop) cubic-bezier(.65,0,.35,1) infinite; }
/* The ink line draws down the faint track, then runs off the bottom and starts again from the top. */
@keyframes m5lin-draw {
  0% { stroke-dashoffset: 1; }
  50%, 58% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -1; }
}
.m5lin-next { padding: 56px clamp(20px, 5vw, 64px) 72px; border-top: 1px solid var(--m5lin-rule); }
.m5lin-h2 { margin: 0 0 20px; font-family: Georgia, serif; font-weight: 400; font-size: 30px; }
.m5lin-list { margin: 0; padding: 0 0 0 22px; display: grid; gap: 14px; max-width: 640px; }
.m5lin-list h3 { margin: 0; font-family: Georgia, serif; font-weight: 400; font-style: italic; font-size: 19px; }
.m5lin-list p { margin: 4px 0 0; color: var(--m5lin-quiet); font-size: 15px; line-height: 1.55; }
@media (max-width: 600px) { .m5lin-issue { display: none; } .m5lin-facts { flex-direction: column; align-items: center; } }
@media (prefers-reduced-motion: reduce) { .m5lin-draw { stroke-dashoffset: 0; } }
`;

export default function VerticalInkLineScrollCueThat() {
  const rootRef = useRef<any>(null);

  // Fades the cue when a marker below the hero scrolls into view, pauses the loop off screen,
  // and glides to the next section on click (a plain jump when reduced motion is requested).
  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    var off = [];
    var BOX = root; // the scrolling box; set to null when the hero is on the page itself
    var cue = root.querySelector(".m5lin-cue"), mark = root.querySelector(".m5lin-mark");
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
    <section ref={rootRef} className="m5lin" data-m5lin="" tabIndex="0" aria-label="Folio and Finch Books first screen, scrollable">
      <style>{CSS}</style>
      <div className="m5lin-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <header className="m5lin-hero">
        <div className="m5lin-top">
          <span className="m5lin-brand">Folio &amp; Finch</span>
          <span className="m5lin-issue">Shop notes, autumn</span>
        </div>
        <div className="m5lin-copy">
          <p className="m5lin-eyebrow">An independent bookshop on Wharf Street</p>
          <h1 className="m5lin-h">Long books for <em>short</em> evenings.</h1>
          <dl className="m5lin-facts">
            <div><dt>Open</dt><dd>Wed to Sun, 10 till 6</dd></div>
            <div><dt>Reading group</dt><dd>First Thursday, upstairs</dd></div>
            <div><dt>Orders</dt><dd>Most titles in two days</dd></div>
          </dl>
        </div>
        <a className="m5lin-cue" href="#m5lin-next">
          <span className="m5lin-label">Read on</span>
          <svg className="m5lin-line" viewBox="0 0 10 80" aria-hidden="true" focusable="false">
            <path className="m5lin-track" d="M5 2V78" />
            <path className="m5lin-draw" d="M5 2V78" pathLength="1" />
          </svg>
        </a>
      </header>
      <div className="m5lin-mark" aria-hidden="true"></div>
      <section className="m5lin-next" id="m5lin-next" tabIndex="-1" aria-labelledby="m5lin-picks">
        <h2 className="m5lin-h2" id="m5lin-picks">On the front table</h2>
        <ol className="m5lin-list">
          <li><h3>A winter atlas of rivers</h3><p>Maps and field notes from one walker's year along the water.</p></li>
          <li><h3>The salt orchard</h3><p>A family novel set over three generations on a coastal farm.</p></li>
          <li><h3>Notes on bread</h3><p>Short essays on baking, patience and early mornings.</p></li>
        </ol>
      </section>
    </section>
  );
}

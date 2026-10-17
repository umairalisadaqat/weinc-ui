import { useEffect, useRef } from "react";

// Change these first: --m5flp-leaf (chip colour), --m5flp-loop (arrow nod), the two labels .m5flp-l1 and .m5flp-l2, --m5flp-box (frame height).
// Same markup, styles and script as the plain HTML version.
const CSS = `
.m5flp { position: relative; box-sizing: border-box; height: var(--m5flp-box); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; scrollbar-width: thin; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
/* To use on a real page: delete height and overflow above, make the hero 100vh, and set BOX = null in the script. */
.m5flp *, .m5flp *::before, .m5flp *::after { box-sizing: border-box; }
.m5flp:focus-visible { outline: 3px solid var(--m5flp-focus); outline-offset: -3px; }
.m5flp [tabindex="-1"]:focus { outline: none; }
.m5flp-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.m5flp-hint { position: sticky; top: 0; height: 0; z-index: 6; display: flex; justify-content: center; align-items: flex-start; pointer-events: none; }
.m5flp-hint span { margin: 10px 0 0; padding: 4px 11px; border-radius: 999px; background: var(--m5flp-hintbg); color: var(--m5flp-hintfg); font-size: 11.5px; letter-spacing: .04em; transition: opacity .5s ease; }
.m5flp[data-touched] .m5flp-hint span { opacity: 0; }
@media (max-width: 600px) { .m5flp-hint { justify-content: flex-end; } .m5flp-hint span { margin-right: 10px; } }
.m5flp-hero { position: relative; min-height: var(--m5flp-box); }
.m5flp-cue { -webkit-tap-highlight-color: transparent; transition: opacity .45s ease, transform .45s ease, visibility 0s linear 0s; }
.m5flp-cue:focus-visible { outline: 2px solid var(--m5flp-focus); outline-offset: 4px; }
/* Faded once the marker below the hero is in view; the loop is paused while hidden or off screen. */
.m5flp[data-gone] .m5flp-cue { opacity: 0; visibility: hidden; transform: translateY(10px); pointer-events: none; transition: opacity .45s ease, transform .45s ease, visibility 0s linear .45s; }
.m5flp[data-gone] .m5flp-cue *, .m5flp[data-off] .m5flp-cue * { animation-play-state: paused !important; }
.m5flp-mark { height: 1px; margin-bottom: -1px; }
/* Reduced motion: the cue stands still at full strength and the link jumps instead of gliding. */
@media (prefers-reduced-motion: reduce) {
  .m5flp *, .m5flp *::before, .m5flp *::after { animation: none !important; transition: none !important; }
}
.m5flp { --m5flp-box: 620px; --m5flp-bg: #fbfaf7; --m5flp-ink: #1f2a2e; --m5flp-quiet: #56636a; --m5flp-leaf: #2f6b4f; --m5flp-rule: #dfe3e0; --m5flp-focus: #2f6b4f; --m5flp-hintbg: rgba(31,42,46,.85); --m5flp-hintfg: #fff; --m5flp-loop: 2.2s;
  background: var(--m5flp-bg); color: var(--m5flp-ink); }
.m5flp-hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(24px, 4vw, 56px); padding: 28px clamp(20px, 5vw, 60px) 104px; }
.m5flp-text { display: flex; flex-direction: column; }
.m5flp-brand { margin: 0; font-size: 16px; font-weight: 700; color: var(--m5flp-leaf); }
.m5flp-brand span { color: var(--m5flp-ink); font-weight: 400; }
.m5flp-copy { margin: auto 0; }
.m5flp-eyebrow { margin: 0 0 14px; color: var(--m5flp-quiet); font-size: 12.5px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
.m5flp-h { margin: 0; font-size: clamp(34px, 4.4vw, 54px); font-weight: 650; line-height: 1.03; letter-spacing: -.035em; }
.m5flp-lede { margin: 18px 0 0; max-width: 30em; color: var(--m5flp-quiet); font-size: 16px; line-height: 1.6; }
.m5flp-fig { margin: 0; position: relative; border-radius: 14px; overflow: hidden; min-height: 0; }
.m5flp-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.m5flp-next, .m5flp-more { padding: 56px clamp(20px, 5vw, 60px); border-top: 1px solid var(--m5flp-rule); }
.m5flp-h2 { margin: 0 0 20px; font-size: 30px; letter-spacing: -.03em; }
.m5flp-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0 28px; }
.m5flp-list li { padding: 16px 0; border-top: 2px solid var(--m5flp-leaf); }
.m5flp-list h3 { margin: 0; font-size: 17px; }
.m5flp-list p, .m5flp-more p { margin: 6px 0 0; color: var(--m5flp-quiet); font-size: 15.5px; line-height: 1.6; max-width: 40em; }
.m5flp-end { position: relative; padding: 40px clamp(20px, 5vw, 60px) 120px; background: var(--m5flp-ink); color: #dfe6e3; font-size: 14px; }
.m5flp-end p { margin: 0; }
.m5flp-endmark { position: absolute; left: 0; bottom: 0; width: 1px; height: 60px; }
.m5flp-dock { position: sticky; bottom: 0; height: 0; z-index: 5; }
.m5flp-cue { position: absolute; right: clamp(16px, 4vw, 40px); bottom: 26px; display: inline-flex; align-items: center; gap: 12px; min-height: 48px; padding: 4px 4px 4px 18px; border-radius: 999px; background: #fff; color: var(--m5flp-ink); text-decoration: none; font-size: 14px; font-weight: 600; box-shadow: 0 1px 0 rgba(31,42,46,.06), 0 14px 30px -14px rgba(31,42,46,.45); }
.m5flp-labels { display: grid; }
.m5flp-labels > span { grid-area: 1 / 1; white-space: nowrap; transition: opacity .35s ease, transform .35s ease; }
.m5flp-l2 { opacity: 0; transform: translateY(6px); text-align: right; }
.m5flp-chip { width: 40px; height: 40px; border-radius: 50%; background: var(--m5flp-leaf); display: grid; place-items: center; }
.m5flp-flip { width: 16px; height: 18px; overflow: visible; transition: transform .5s cubic-bezier(.3,.7,.2,1); }
.m5flp-flip path { fill: none; stroke: #fff; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.m5flp-nudge { animation: m5flp-nudge var(--m5flp-loop) ease-in-out infinite; }
.m5flp-cue:hover .m5flp-chip { background: var(--m5flp-ink); }
/* A small nod along the arrow's own direction; at the end the arrow turns to point up. */
@keyframes m5flp-nudge { 0%, 100% { transform: translateY(-1.5px); } 50% { transform: translateY(2.5px); } }
.m5flp[data-end][data-gone] .m5flp-cue { opacity: 1; visibility: visible; transform: none; pointer-events: auto; transition: opacity .45s ease, transform .45s ease; }
.m5flp[data-end]:not([data-off]) .m5flp-cue * { animation-play-state: running !important; }
.m5flp[data-end] .m5flp-l1 { opacity: 0; transform: translateY(-6px); }
.m5flp[data-end] .m5flp-l2 { opacity: 1; transform: none; }
.m5flp[data-end] .m5flp-flip { transform: rotate(180deg); }
@media (max-width: 760px) {
  .m5flp-hero { grid-template-columns: 1fr; grid-template-rows: auto 170px; gap: 22px; padding-top: 22px; }
  .m5flp-copy { margin: 26px 0 0; }
  .m5flp-h { font-size: 32px; }
  .m5flp-lede { font-size: 15px; }
  .m5flp-cue { right: 0; left: 0; margin: 0 auto; width: max-content; }
}
`;

export default function ScrollCueThatTurnsIntoBack() {
  const rootRef = useRef<any>(null);

  // Fades the cue when a marker below the hero scrolls into view, pauses the loop off screen,
  // and glides to the next section on click (a plain jump when reduced motion is requested).
  useEffect(() => {
    const root: any = rootRef.current;
    if (!root) return;
    var off = [];
    var BOX = root; // the scrolling box; set to null when the hero is on the page itself
    var cue = root.querySelector(".m5flp-cue"), mark = root.querySelector(".m5flp-mark");
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
    // At the bottom of the page the cue comes back as a back-to-top link: arrow turns, label swaps, target changes.
    var l1 = root.querySelector(".m5flp-l1"), l2 = root.querySelector(".m5flp-l2");
    watch(function (es) {
      var end = es[0].isIntersecting;
      root.toggleAttribute("data-end", end);
      cue.setAttribute("href", end ? "#m5flp-top" : "#m5flp-next");
      l1.setAttribute("aria-hidden", String(end));
      l2.setAttribute("aria-hidden", String(!end));
    }, { root: BOX }, root.querySelector(".m5flp-endmark"));
    return () => off.forEach((f: any) => f());
  }, []);

  return (
    <section ref={rootRef} className="m5flp" data-m5flp="" tabIndex="0" aria-label="Fernhouse Kitchen Garden page, scrollable">
      <style>{CSS}</style>
      <div className="m5flp-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <header className="m5flp-hero" id="m5flp-top" tabIndex="-1">
        <div className="m5flp-text">
          <p className="m5flp-brand">Fernhouse <span>Kitchen Garden</span></p>
          <div className="m5flp-copy">
            <p className="m5flp-eyebrow">A walled garden you can pick from</p>
            <h1 className="m5flp-h">Rent a raised bed and grow your own salad.</h1>
            <p className="m5flp-lede">Twenty-four timber beds inside an old orchard wall, with water on tap, shared tools in the shed and a gardener on site at weekends.</p>
          </div>
        </div>
        <figure className="m5flp-fig">
          <img className="m5flp-photo" src="https://images.pexels.com/photos/37487180/pexels-photo-37487180.jpeg?auto=compress&cs=tinysrgb&w=1400" alt="Rows of wooden raised beds planted with vegetables on gravel paths, trees behind" width="1400" height="1050" />
        </figure>
      </header>
      <div className="m5flp-mark" aria-hidden="true"></div>
      <section className="m5flp-next" id="m5flp-next" tabIndex="-1" aria-labelledby="m5flp-beds">
        <h2 className="m5flp-h2" id="m5flp-beds">The beds</h2>
        <ul className="m5flp-list">
          <li><h3>Half bed</h3><p>One by two metres, enough for salad leaves and herbs.</p></li>
          <li><h3>Full bed</h3><p>One by four metres, room for beans, courgettes and roots.</p></li>
          <li><h3>Shared bed</h3><p>Split with a neighbour, planned together at the start of spring.</p></li>
        </ul>
      </section>
      <section className="m5flp-more" aria-labelledby="m5flp-season">
        <h2 className="m5flp-h2" id="m5flp-season">Through the season</h2>
        <p>Spring starts with a seed swap in the shed. In summer, the water butts are filled from the roof and the gate stays open until dusk. Autumn ends with a bonfire for the prunings and a long table of soup from the beds.</p>
      </section>
      <footer className="m5flp-end">
        <p>Fernhouse Kitchen Garden, Orchard Walk</p>
        <div className="m5flp-endmark" aria-hidden="true"></div>
      </footer>
      <div className="m5flp-dock">
        <a className="m5flp-cue" href="#m5flp-next">
          <span className="m5flp-labels">
            <span className="m5flp-l1">Scroll for the beds</span>
            <span className="m5flp-l2" aria-hidden="true">Back to top</span>
          </span>
          <span className="m5flp-chip" aria-hidden="true">
            <svg className="m5flp-flip" viewBox="0 0 16 18" focusable="false"><g className="m5flp-nudge"><path d="M8 2V15M3 10.5L8 15.5l5-5" /></g></svg>
          </span>
        </a>
      </div>
    </section>
  );
}

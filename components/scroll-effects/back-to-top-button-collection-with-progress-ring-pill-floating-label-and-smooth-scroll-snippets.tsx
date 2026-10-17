import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/*
  Back to top button collection.
  Every button is the same component you copy. On a real page it watches the window and sits
  "fixed" in a corner; here each one is handed a scrolling frame (scrollRef) and a "sticky"
  position so it lives inside its preview instead of on the window. Scroll any frame to try it.
*/

type Lang = "react" | "vanilla";
type Item = { name: string; note: string; Demo: () => JSX.Element; code: Record<Lang, string> };
const LANGS: Record<Lang, string> = { react: "React + Tailwind", vanilla: "HTML, CSS and JS" };

/* ---------- shared logic ---------- */
type Props = { scrollRef?: RefObject<HTMLElement | null>; topId?: string; showAfter?: number; position?: string };

function useScrollPosition(scrollRef?: RefObject<HTMLElement | null>) {
  const [state, setState] = useState({ y: 0, pct: 0 });
  useEffect(() => {
    const el = scrollRef?.current ?? null;
    const read = () => {
      const y = el ? el.scrollTop : window.scrollY;
      const max = el ? el.scrollHeight - el.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
      setState({ y, pct: max > 0 ? Math.min(y / max, 1) : 0 });
    };
    const target: HTMLElement | Window = el ?? window;
    read();
    target.addEventListener("scroll", read, { passive: true });
    return () => target.removeEventListener("scroll", read);
  }, [scrollRef]);
  return state;
}

function scrollToTop(scrollRef: RefObject<HTMLElement | null> | undefined, topId: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = scrollRef?.current ?? null;
  (el ?? window).scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  document.getElementById(topId)?.focus({ preventScroll: true });
}

const HOOK_SRC = `import { useEffect, useState } from "react";
import type { RefObject } from "react";

type Props = { scrollRef?: RefObject<HTMLElement | null>; topId?: string; showAfter?: number; position?: string };

// Reads how far the page (or a scrolling box passed as scrollRef) has scrolled.
function useScrollPosition(scrollRef?: RefObject<HTMLElement | null>) {
  const [state, setState] = useState({ y: 0, pct: 0 });
  useEffect(() => {
    const el = scrollRef?.current ?? null;
    const read = () => {
      const y = el ? el.scrollTop : window.scrollY;
      const max = el ? el.scrollHeight - el.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
      setState({ y, pct: max > 0 ? Math.min(y / max, 1) : 0 });
    };
    const target: HTMLElement | Window = el ?? window;
    read();
    target.addEventListener("scroll", read, { passive: true });
    return () => target.removeEventListener("scroll", read);
  }, [scrollRef]);
  return state;
}

// Smooth unless the visitor asked for reduced motion, then moves keyboard focus to the
// element with id={topId} (give it tabIndex={-1}) so the next Tab starts at the top.
function scrollToTop(scrollRef: RefObject<HTMLElement | null> | undefined, topId: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = scrollRef?.current ?? null;
  (el ?? window).scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  document.getElementById(topId)?.focus({ preventScroll: true });
}`;

const VANILLA_JS = `<script>
  // Shows the button after SHOW_AFTER pixels, exposes progress as --progress (0 to 1),
  // scrolls smoothly unless reduced motion is on, then moves focus to #top.
  const btn = document.querySelector(".to-top");
  const SHOW_AFTER = 400;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  function update() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const y = window.scrollY;
    btn.classList.toggle("is-visible", y > SHOW_AFTER);
    btn.style.setProperty("--progress", max > 0 ? Math.min(y / max, 1) : 0);
  }
  window.addEventListener("scroll", update, { passive: true });
  update();
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduce.matches ? "auto" : "smooth" });
    document.getElementById("top").focus({ preventScroll: true });
  });
</script>`;

const TOP_NOTE = `<!-- Put this at the start of your page: <h1 id="top" tabindex="-1">Page title</h1> -->`;
const HIDDEN_CSS = `.to-top { visibility: hidden; opacity: 0; transform: translateY(12px); transition: opacity .2s, transform .2s, visibility .2s; }
.to-top.is-visible { visibility: visible; opacity: 1; transform: none; }
.to-top:focus-visible { outline: 2px solid #2563eb; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .to-top { transition: none; } }`;

const ARROW = "M12 19V5M5 12l7-7 7 7";
const ARROW_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;

function Arrow({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={ARROW} />
    </svg>
  );
}
const ARROW_SRC = `function Arrow({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}`;

/* ---------- 1. Simple square ---------- */
function BackToTopSimple({ scrollRef, topId = "top", showAfter = 400, position = "fixed bottom-6 right-6 z-40" }: Props) {
  const { y } = useScrollPosition(scrollRef);
  const show = y > showAfter;
  return (
    <div className={"pointer-events-none " + position}>
      <button
        type="button"
        aria-label="Back to top"
        onClick={() => scrollToTop(scrollRef, topId)}
        className={
          "pointer-events-auto grid h-11 w-11 place-items-center rounded-lg bg-slate-900 text-white shadow-[0_6px_20px_-6px_rgba(15,23,42,0.5)] transition-all duration-200 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 motion-reduce:transition-none " +
          (show ? "visible translate-y-0 opacity-100" : "invisible translate-y-3 opacity-0")
        }
      >
        <Arrow />
      </button>
    </div>
  );
}

const SIMPLE_REACT = `${HOOK_SRC}

${ARROW_SRC}

export function BackToTopSimple({ scrollRef, topId = "top", showAfter = 400, position = "fixed bottom-6 right-6 z-40" }: Props) {
  const { y } = useScrollPosition(scrollRef);
  const show = y > showAfter;
  return (
    <div className={"pointer-events-none " + position}>
      <button
        type="button"
        aria-label="Back to top"
        onClick={() => scrollToTop(scrollRef, topId)}
        className={
          "pointer-events-auto grid h-11 w-11 place-items-center rounded-lg bg-slate-900 text-white shadow-[0_6px_20px_-6px_rgba(15,23,42,0.5)] transition-all duration-200 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 motion-reduce:transition-none " +
          (show ? "visible translate-y-0 opacity-100" : "invisible translate-y-3 opacity-0")
        }
      >
        <Arrow />
      </button>
    </div>
  );
}`;

const SIMPLE_VANILLA = `${TOP_NOTE}
<button type="button" class="to-top" aria-label="Back to top">${ARROW_SVG}</button>

<style>
.to-top {
  position: fixed; right: 24px; bottom: 24px; z-index: 40;
  display: grid; place-items: center; width: 44px; height: 44px;
  border: 0; border-radius: 8px; background: #0f172a; color: #fff; cursor: pointer;
  box-shadow: 0 6px 20px -6px rgba(15, 23, 42, .5);
}
.to-top:hover { background: #334155; }
${HIDDEN_CSS}
</style>

${VANILLA_JS}`;

/* ---------- 2. Progress ring ---------- */
const R = 21;
const C = 2 * Math.PI * R;

function BackToTopRing({ scrollRef, topId = "top", showAfter = 400, position = "fixed bottom-6 right-6 z-40" }: Props) {
  const { y, pct } = useScrollPosition(scrollRef);
  const show = y > showAfter;
  return (
    <div className={"pointer-events-none " + position}>
      <button
        type="button"
        aria-label={"Back to top, " + Math.round(pct * 100) + "% read"}
        onClick={() => scrollToTop(scrollRef, topId)}
        className={
          "pointer-events-auto relative grid h-12 w-12 place-items-center rounded-full bg-white text-teal-800 shadow-[0_8px_24px_-10px_rgba(15,23,42,0.45)] transition-all duration-200 hover:text-teal-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 motion-reduce:transition-none " +
          (show ? "visible scale-100 opacity-100" : "invisible scale-90 opacity-0")
        }
      >
        <svg viewBox="0 0 48 48" aria-hidden="true" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="24" cy="24" r={R} fill="none" stroke="#e2e8f0" strokeWidth="3" />
          <circle cx="24" cy="24" r={R} fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} />
        </svg>
        <Arrow className="relative h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

const RING_REACT = `${HOOK_SRC}

${ARROW_SRC}

const R = 21;
const C = 2 * Math.PI * R;

// The ring fills as the reader moves down the page; the label says how far they are.
export function BackToTopRing({ scrollRef, topId = "top", showAfter = 400, position = "fixed bottom-6 right-6 z-40" }: Props) {
  const { y, pct } = useScrollPosition(scrollRef);
  const show = y > showAfter;
  return (
    <div className={"pointer-events-none " + position}>
      <button
        type="button"
        aria-label={"Back to top, " + Math.round(pct * 100) + "% read"}
        onClick={() => scrollToTop(scrollRef, topId)}
        className={
          "pointer-events-auto relative grid h-12 w-12 place-items-center rounded-full bg-white text-teal-800 shadow-[0_8px_24px_-10px_rgba(15,23,42,0.45)] transition-all duration-200 hover:text-teal-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 motion-reduce:transition-none " +
          (show ? "visible scale-100 opacity-100" : "invisible scale-90 opacity-0")
        }
      >
        <svg viewBox="0 0 48 48" aria-hidden="true" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="24" cy="24" r={R} fill="none" stroke="#e2e8f0" strokeWidth="3" />
          <circle cx="24" cy="24" r={R} fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} />
        </svg>
        <Arrow className="relative h-[18px] w-[18px]" />
      </button>
    </div>
  );
}`;

const RING_VANILLA = `${TOP_NOTE}
<button type="button" class="to-top" aria-label="Back to top">
  <svg class="to-top-ring" viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="21" pathLength="100" />
    <circle class="to-top-fill" cx="24" cy="24" r="21" pathLength="100" />
  </svg>
  ${ARROW_SVG}
</button>

<style>
.to-top {
  position: fixed; right: 24px; bottom: 24px; z-index: 40;
  display: grid; place-items: center; width: 48px; height: 48px;
  border: 0; border-radius: 50%; background: #fff; color: #115e59; cursor: pointer;
  box-shadow: 0 8px 24px -10px rgba(15, 23, 42, .45);
}
.to-top > svg:last-child { position: relative; width: 18px; height: 18px; }
.to-top-ring { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
.to-top-ring circle { fill: none; stroke: #e2e8f0; stroke-width: 3; }
/* pathLength="100" lets the dash offset be a plain percentage of the ring. */
.to-top-ring .to-top-fill { stroke: #0f766e; stroke-linecap: round; stroke-dasharray: 100; stroke-dashoffset: calc(100 - var(--progress, 0) * 100); }
${HIDDEN_CSS}
</style>

${VANILLA_JS}`;

/* ---------- 3. Pill with text ---------- */
function BackToTopPill({ scrollRef, topId = "top", showAfter = 400, position = "fixed bottom-6 left-1/2 z-40 -translate-x-1/2" }: Props) {
  const { y } = useScrollPosition(scrollRef);
  const show = y > showAfter;
  return (
    <div className={"pointer-events-none " + position}>
      <button
        type="button"
        onClick={() => scrollToTop(scrollRef, topId)}
        className={
          "pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full border border-stone-300 bg-white/95 pl-3.5 pr-4 text-sm font-medium text-stone-900 shadow-[0_10px_30px_-12px_rgba(28,25,23,0.35)] backdrop-blur transition-all duration-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 motion-reduce:transition-none " +
          (show ? "visible translate-y-0 opacity-100" : "invisible translate-y-4 opacity-0")
        }
      >
        <Arrow className="h-4 w-4" />
        Back to top
      </button>
    </div>
  );
}

const PILL_REACT = `${HOOK_SRC}

${ARROW_SRC}

// A text button reads more clearly than an icon for visitors who do not know the arrow.
// It sits centred at the bottom, where it does not cover a chat or cookie button.
export function BackToTopPill({ scrollRef, topId = "top", showAfter = 400, position = "fixed bottom-6 left-1/2 z-40 -translate-x-1/2" }: Props) {
  const { y } = useScrollPosition(scrollRef);
  const show = y > showAfter;
  return (
    <div className={"pointer-events-none " + position}>
      <button
        type="button"
        onClick={() => scrollToTop(scrollRef, topId)}
        className={
          "pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full border border-stone-300 bg-white/95 pl-3.5 pr-4 text-sm font-medium text-stone-900 shadow-[0_10px_30px_-12px_rgba(28,25,23,0.35)] backdrop-blur transition-all duration-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 motion-reduce:transition-none " +
          (show ? "visible translate-y-0 opacity-100" : "invisible translate-y-4 opacity-0")
        }
      >
        <Arrow className="h-4 w-4" />
        Back to top
      </button>
    </div>
  );
}`;

const PILL_VANILLA = `${TOP_NOTE}
<button type="button" class="to-top">${ARROW_SVG} Back to top</button>

<style>
.to-top {
  position: fixed; left: 50%; bottom: 24px; z-index: 40; margin-left: -66px;
  display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 16px 0 14px;
  border: 1px solid #d6d3d1; border-radius: 999px; background: rgba(255, 255, 255, .95); color: #1c1917;
  font: 500 14px/1 system-ui, sans-serif; cursor: pointer;
  box-shadow: 0 10px 30px -12px rgba(28, 25, 23, .35);
}
.to-top svg { width: 16px; height: 16px; }
${HIDDEN_CSS}
</style>

${VANILLA_JS}`;

/* ---------- 4. Floating label ---------- */
function BackToTopLabel({ scrollRef, topId = "top", showAfter = 400, position = "fixed bottom-6 right-6 z-40" }: Props) {
  const { y } = useScrollPosition(scrollRef);
  const show = y > showAfter;
  return (
    <div className={"pointer-events-none " + position}>
      <button
        type="button"
        onClick={() => scrollToTop(scrollRef, topId)}
        className={
          "group pointer-events-auto flex h-12 items-center rounded-full bg-indigo-700 pl-3.5 pr-3.5 text-white shadow-[0_10px_30px_-10px_rgba(67,56,202,0.7)] transition-all duration-300 hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2 motion-reduce:transition-none " +
          (show ? "visible translate-y-0 opacity-100" : "invisible translate-y-4 opacity-0")
        }
      >
        <Arrow />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:ml-2 group-hover:max-w-[7rem] group-focus-visible:ml-2 group-focus-visible:max-w-[7rem] motion-reduce:transition-none">Back to top</span>
      </button>
    </div>
  );
}

const LABEL_REACT = `${HOOK_SRC}

${ARROW_SRC}

// A round icon that slides its label out on hover or keyboard focus. The label text is
// always in the button, so screen readers hear "Back to top" even while it is clipped.
export function BackToTopLabel({ scrollRef, topId = "top", showAfter = 400, position = "fixed bottom-6 right-6 z-40" }: Props) {
  const { y } = useScrollPosition(scrollRef);
  const show = y > showAfter;
  return (
    <div className={"pointer-events-none " + position}>
      <button
        type="button"
        onClick={() => scrollToTop(scrollRef, topId)}
        className={
          "group pointer-events-auto flex h-12 items-center rounded-full bg-indigo-700 pl-3.5 pr-3.5 text-white shadow-[0_10px_30px_-10px_rgba(67,56,202,0.7)] transition-all duration-300 hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2 motion-reduce:transition-none " +
          (show ? "visible translate-y-0 opacity-100" : "invisible translate-y-4 opacity-0")
        }
      >
        <Arrow />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:ml-2 group-hover:max-w-[7rem] group-focus-visible:ml-2 group-focus-visible:max-w-[7rem] motion-reduce:transition-none">Back to top</span>
      </button>
    </div>
  );
}`;

const LABEL_VANILLA = `${TOP_NOTE}
<button type="button" class="to-top">${ARROW_SVG}<span>Back to top</span></button>

<style>
.to-top {
  position: fixed; right: 24px; bottom: 24px; z-index: 40;
  display: flex; align-items: center; height: 48px; padding: 0 14px;
  border: 0; border-radius: 999px; background: #4338ca; color: #fff; cursor: pointer;
  box-shadow: 0 10px 30px -10px rgba(67, 56, 202, .7);
}
.to-top:hover { background: #3730a3; }
.to-top span { max-width: 0; overflow: hidden; white-space: nowrap; font: 600 14px/1 system-ui, sans-serif; transition: max-width .3s, margin .3s; }
.to-top:hover span, .to-top:focus-visible span { max-width: 7rem; margin-left: 8px; }
${HIDDEN_CSS}
@media (prefers-reduced-motion: reduce) { .to-top span { transition: none; } }
</style>

${VANILLA_JS}`;

/* ---------- 5. Reading bar with a Top link ---------- */
function ReadingBarTop({ scrollRef, topId = "top", showAfter = 400, position = "fixed inset-x-0 top-0 z-40" }: Props) {
  const { y, pct } = useScrollPosition(scrollRef);
  const show = y > showAfter;
  return (
    <div className={position}>
      <div className="flex h-10 items-center justify-between gap-3 border-b border-amber-900/10 bg-[#fffaf0]/95 px-4 backdrop-blur">
        <p className="truncate text-xs font-medium text-stone-700">Repotting a fiddle-leaf fig</p>
        <button
          type="button"
          onClick={() => scrollToTop(scrollRef, topId)}
          className={"inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 " + (show ? "visible" : "invisible")}
        >
          <Arrow className="h-3.5 w-3.5" />
          Top
        </button>
      </div>
      <div className="h-[3px] bg-amber-900/10" aria-hidden="true">
        <div className="h-full origin-left bg-amber-600" style={{ transform: `scaleX(${pct})` }} />
      </div>
    </div>
  );
}

const BAR_REACT = `${HOOK_SRC}

${ARROW_SRC}

// A slim header with the article title, a Top link once the reader is past showAfter,
// and a bar that fills with reading progress. The bar is decorative, so it is hidden
// from screen readers.
export function ReadingBarTop({ scrollRef, topId = "top", showAfter = 400, position = "fixed inset-x-0 top-0 z-40" }: Props) {
  const { y, pct } = useScrollPosition(scrollRef);
  const show = y > showAfter;
  return (
    <div className={position}>
      <div className="flex h-10 items-center justify-between gap-3 border-b border-amber-900/10 bg-[#fffaf0]/95 px-4 backdrop-blur">
        <p className="truncate text-xs font-medium text-stone-700">Repotting a fiddle-leaf fig</p>
        <button
          type="button"
          onClick={() => scrollToTop(scrollRef, topId)}
          className={"inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 " + (show ? "visible" : "invisible")}
        >
          <Arrow className="h-3.5 w-3.5" />
          Top
        </button>
      </div>
      <div className="h-[3px] bg-amber-900/10" aria-hidden="true">
        <div className="h-full origin-left bg-amber-600" style={{ transform: "scaleX(" + pct + ")" }} />
      </div>
    </div>
  );
}`;

const BAR_VANILLA = `${TOP_NOTE}
<div class="read-bar">
  <div class="read-bar-row">
    <p>Repotting a fiddle-leaf fig</p>
    <button type="button" class="to-top">${ARROW_SVG} Top</button>
  </div>
  <div class="read-bar-track" aria-hidden="true"><div class="read-bar-fill"></div></div>
</div>

<style>
.read-bar { position: fixed; inset: 0 0 auto 0; z-index: 40; }
.read-bar-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 40px; padding: 0 16px; background: rgba(255, 250, 240, .95); border-bottom: 1px solid rgba(120, 53, 15, .1); }
.read-bar-row p { margin: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font: 500 12px/1 system-ui, sans-serif; color: #44403c; }
.to-top { display: inline-flex; align-items: center; gap: 4px; height: 32px; padding: 0 8px; border: 0; border-radius: 6px; background: none; color: #78350f; font: 600 12px/1 system-ui, sans-serif; cursor: pointer; }
.to-top svg { width: 14px; height: 14px; }
.to-top:not(.is-visible) { visibility: hidden; }
.to-top:focus-visible { outline: 2px solid #b45309; outline-offset: 2px; }
.read-bar-track { height: 3px; background: rgba(120, 53, 15, .1); }
.read-bar-fill { height: 100%; background: #d97706; transform-origin: left; transform: scaleX(var(--progress, 0)); }
</style>

${VANILLA_JS.replace('btn.style.setProperty("--progress"', 'document.querySelector(".read-bar").style.setProperty("--progress"')}`;

/* ---------- 6. Edge tab ---------- */
function BackToTopEdge({ scrollRef, topId = "top", showAfter = 400, position = "fixed bottom-24 right-0 z-40" }: Props) {
  const { y } = useScrollPosition(scrollRef);
  const show = y > showAfter;
  return (
    <div className={"pointer-events-none " + position}>
      <button
        type="button"
        onClick={() => scrollToTop(scrollRef, topId)}
        className={
          "pointer-events-auto flex w-10 flex-col items-center gap-2 rounded-l-lg bg-rose-900 py-3 text-white shadow-[0_8px_24px_-10px_rgba(76,5,25,0.6)] transition-all duration-300 hover:bg-rose-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-900 focus-visible:ring-offset-2 motion-reduce:transition-none " +
          (show ? "visible translate-x-0 opacity-100" : "invisible translate-x-full opacity-0")
        }
      >
        <Arrow className="h-4 w-4" />
        <span className="rotate-180 text-xs font-semibold tracking-wide [writing-mode:vertical-rl]">Back to top</span>
      </button>
    </div>
  );
}

const EDGE_REACT = `${HOOK_SRC}

${ARROW_SRC}

// A tab that slides in from the right edge. It never covers content in the middle of the
// screen, which suits pages with wide tables or images.
export function BackToTopEdge({ scrollRef, topId = "top", showAfter = 400, position = "fixed bottom-24 right-0 z-40" }: Props) {
  const { y } = useScrollPosition(scrollRef);
  const show = y > showAfter;
  return (
    <div className={"pointer-events-none " + position}>
      <button
        type="button"
        onClick={() => scrollToTop(scrollRef, topId)}
        className={
          "pointer-events-auto flex w-10 flex-col items-center gap-2 rounded-l-lg bg-rose-900 py-3 text-white shadow-[0_8px_24px_-10px_rgba(76,5,25,0.6)] transition-all duration-300 hover:bg-rose-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-900 focus-visible:ring-offset-2 motion-reduce:transition-none " +
          (show ? "visible translate-x-0 opacity-100" : "invisible translate-x-full opacity-0")
        }
      >
        <Arrow className="h-4 w-4" />
        <span className="rotate-180 text-xs font-semibold tracking-wide [writing-mode:vertical-rl]">Back to top</span>
      </button>
    </div>
  );
}`;

const EDGE_VANILLA = `${TOP_NOTE}
<button type="button" class="to-top">${ARROW_SVG}<span>Back to top</span></button>

<style>
.to-top {
  position: fixed; right: 0; bottom: 96px; z-index: 40;
  display: flex; flex-direction: column; align-items: center; gap: 8px; width: 40px; padding: 12px 0;
  border: 0; border-radius: 8px 0 0 8px; background: #881337; color: #fff; cursor: pointer;
  box-shadow: 0 8px 24px -10px rgba(76, 5, 25, .6);
}
.to-top svg { width: 16px; height: 16px; }
.to-top span { writing-mode: vertical-rl; transform: rotate(180deg); font: 600 12px/1 system-ui, sans-serif; letter-spacing: .025em; }
${HIDDEN_CSS.replace("translateY(12px)", "translateX(100%)")}
</style>

${VANILLA_JS}`;

/* ---------- preview frame: a scrolling article that stands in for the window ---------- */
const PARAS = [
  ["Pick the right moment", "Spring and early summer are best, when the plant is putting out new leaves and can recover quickly. Avoid repotting a fig that has just been moved or is dropping leaves."],
  ["Choose a pot one size up", "Go no more than five centimetres wider than the current pot. A much larger pot holds water the roots cannot reach, and the soil stays wet for too long."],
  ["Mix a free-draining soil", "Combine two parts houseplant compost with one part bark and one part perlite. The mix should crumble in your hand rather than pack into a ball."],
  ["Loosen the root ball", "Ease the plant out, tease the outer roots apart with your fingers and trim any that are dark and soft. Healthy roots are pale and firm."],
  ["Set the height", "Add soil until the top of the root ball sits about two centimetres below the rim, then fill around the sides and press gently to remove large air pockets."],
  ["Water once, then wait", "Water until it runs from the drainage holes and let the pot drain fully. Then leave it until the top few centimetres are dry before watering again."],
  ["Expect a pause", "A repotted fig often stops growing for two or three weeks while its roots settle. Keep it in the same bright spot and resist moving it around."],
];

function Frame({ topId, tone, Button, atTop = false }: { topId: string; tone: string; Button: (p: Props) => JSX.Element; atTop?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 560;
  }, []);
  const sticky = atTop ? "sticky top-0 z-10" : Button === BackToTopPill ? "sticky bottom-4 z-10 flex justify-center" : Button === BackToTopEdge ? "sticky bottom-6 z-10 flex justify-end" : "sticky bottom-4 z-10 flex justify-end pr-4";
  const btn = <Button scrollRef={ref} topId={topId} showAfter={240} position={sticky} />;
  return (
    <div ref={ref} tabIndex={0} aria-label="Sample article, scroll to try the button" className={"relative h-[320px] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 " + tone}>
      {atTop && btn}
      <article className="px-5 pb-6 pt-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-600">Plant care</p>
        <h4 id={topId} tabIndex={-1} className="mt-1 text-lg font-semibold tracking-tight text-slate-900 focus:outline-none">
          Repotting a fiddle-leaf fig
        </h4>
        {PARAS.map(([h, p]) => (
          <section key={h} className="mt-4">
            <h5 className="text-sm font-semibold text-slate-900">{h}</h5>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">{p}</p>
          </section>
        ))}
      </article>
      {!atTop && btn}
    </div>
  );
}

/* ---------- catalogue ---------- */
const ITEMS: Item[] = [
  { name: "Progress ring", note: "The ring fills as you read; the label reports the percentage.", Demo: () => <Frame topId="btt-1" tone="bg-white" Button={BackToTopRing} />, code: { react: RING_REACT, vanilla: RING_VANILLA } },
  { name: "Simple square", note: "One icon, shown after a set distance, slides in from below.", Demo: () => <Frame topId="btt-2" tone="bg-slate-50" Button={BackToTopSimple} />, code: { react: SIMPLE_REACT, vanilla: SIMPLE_VANILLA } },
  { name: "Pill with text", note: "Centred and labelled, for visitors who skip icons.", Demo: () => <Frame topId="btt-3" tone="bg-[#faf9f7]" Button={BackToTopPill} />, code: { react: PILL_REACT, vanilla: PILL_VANILLA } },
  { name: "Floating label", note: "Round icon that slides its label out on hover or focus.", Demo: () => <Frame topId="btt-4" tone="bg-white" Button={BackToTopLabel} />, code: { react: LABEL_REACT, vanilla: LABEL_VANILLA } },
  { name: "Reading bar with Top link", note: "Slim header with the title, a progress line and a Top link.", Demo: () => <Frame topId="btt-5" tone="bg-[#fffdf8]" Button={ReadingBarTop} atTop />, code: { react: BAR_REACT, vanilla: BAR_VANILLA } },
  { name: "Edge tab", note: "Slides in from the right edge, clear of the content.", Demo: () => <Frame topId="btt-6" tone="bg-white" Button={BackToTopEdge} />, code: { react: EDGE_REACT, vanilla: EDGE_VANILLA } },
];

const CSS_SMOOTH = `html { scroll-behavior: smooth; }

/* Turn it off for people who asked for less motion. */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}

/* Stop a sticky header from covering the heading you land on. */
:target { scroll-margin-top: 72px; }`;

const JS_SMOOTH = `const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });

// Then move focus, or the next Tab jumps back to where the reader was.
document.getElementById("top").focus({ preventScroll: true });`;

const RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef1f4]";

function Card({ item, n }: { item: Item; n: number }) {
  const [lang, setLang] = useState<Lang>("react");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const code = item.code[lang];
  const id = `btt-code-${n}`;
  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(code);
      ok = true;
    } catch {
      ok = false;
    }
    if (!ok) setOpen(true);
    setCopied(ok);
    setMsg(ok ? `${item.name}, ${LANGS[lang]}, copied` : "Copy was blocked. The code is open below so you can select it.");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }
  const Demo = item.Demo;
  const tool = `inline-flex h-10 items-center justify-center rounded-lg px-3 text-[12.5px] font-semibold transition-colors ${RING}`;
  return (
    <li className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white ${open ? "md:col-span-2 lg:col-span-3" : ""}`}>
      <div className="flex items-start gap-3 px-4 pt-4">
        <span className="mt-0.5 font-mono text-[11px] text-slate-500">{String(n).padStart(2, "0")}</span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">{item.name}</h3>
          <p className="mt-0.5 text-[13px] leading-snug text-slate-600">{item.note}</p>
        </div>
      </div>
      <div className="p-4">
        <Demo />
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50/80 px-3 py-2">
        <div role="group" aria-label={`Code version for ${item.name}`} className="flex rounded-lg bg-slate-200/70 p-0.5">
          {(Object.keys(LANGS) as Lang[]).map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={`h-9 rounded-md px-2.5 text-[12px] font-medium ${RING} ${lang === l ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
              {l === "react" ? "React" : "Vanilla"}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className={`${tool} text-slate-700 hover:bg-slate-200/70`}>
          {open ? "Hide" : "Code"}
        </button>
        <button type="button" onClick={copy} aria-label={`Copy ${LANGS[lang]} code for ${item.name}`} className={`${tool} ${copied ? "bg-emerald-700 text-white" : "bg-slate-900 text-white hover:bg-slate-700"}`}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {msg}
      </p>
      {open && (
        <pre id={id} tabIndex={0} aria-label={`${item.name} code`} className={`max-h-96 overflow-auto border-t border-slate-800 bg-[#0f1419] p-4 font-mono text-[11.5px] leading-[1.65] text-slate-200 ${RING}`}>
          <code>{code}</code>
        </pre>
      )}
    </li>
  );
}

export default function BackToTopCollection() {
  return (
    <section className="bg-[#eef1f4] px-4 py-12 text-slate-900 sm:px-8 sm:py-14" style={{ fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-slate-600">React · vanilla JS · CSS</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">Back to top buttons and smooth scroll</h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-600">
            Six buttons that appear after the reader scrolls, glide back up unless reduced motion is on, and put keyboard focus at the top of the page. Scroll any article to try one.
          </p>
        </header>

        <div className="mt-8 h-[1120px] overflow-y-auto overscroll-contain border-t border-slate-300/80 pr-1 pt-6" tabIndex={0} aria-label="Back to top examples and smooth scroll reference">
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ITEMS.map((it, i) => (
              <Card key={it.name} item={it} n={i + 1} />
            ))}
          </ul>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h3 className="text-lg font-semibold tracking-tight">Smooth scroll: CSS or JavaScript</h3>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold">CSS, one line for every link on the page</p>
                <pre tabIndex={0} aria-label="CSS smooth scroll code" className={`mt-2 overflow-auto rounded-lg bg-[#0f1419] p-4 font-mono text-[11.5px] leading-[1.65] text-slate-200 ${RING}`}>
                  <code>{CSS_SMOOTH}</code>
                </pre>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">JavaScript, for one button with focus handling</p>
                <pre tabIndex={0} aria-label="JavaScript smooth scroll code" className={`mt-2 overflow-auto rounded-lg bg-[#0f1419] p-4 font-mono text-[11.5px] leading-[1.65] text-slate-200 ${RING}`}>
                  <code>{JS_SMOOTH}</code>
                </pre>
              </div>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th scope="col" className="py-2 pr-4 font-medium"><span className="sr-only">Aspect</span></th>
                    <th scope="col" className="py-2 pr-4 font-medium">scroll-behavior: smooth</th>
                    <th scope="col" className="py-2 font-medium">scrollTo with behavior</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  <tr className="border-b border-slate-100 align-top">
                    <th scope="row" className="py-2.5 pr-4 font-semibold text-slate-900">Applies to</th>
                    <td className="py-2.5 pr-4">Every anchor link and script scroll on that scroll container</td>
                    <td className="py-2.5">Only the call you make</td>
                  </tr>
                  <tr className="border-b border-slate-100 align-top">
                    <th scope="row" className="py-2.5 pr-4 font-semibold text-slate-900">Reduced motion</th>
                    <td className="py-2.5 pr-4">Needs the media query shown above</td>
                    <td className="py-2.5">Check matchMedia before calling</td>
                  </tr>
                  <tr className="border-b border-slate-100 align-top">
                    <th scope="row" className="py-2.5 pr-4 font-semibold text-slate-900">Moves focus</th>
                    <td className="py-2.5 pr-4">Following an in-page link moves the next Tab start to its target</td>
                    <td className="py-2.5">No, call focus() yourself</td>
                  </tr>
                  <tr className="align-top">
                    <th scope="row" className="py-2.5 pr-4 font-semibold text-slate-900">Speed control</th>
                    <td className="py-2.5 pr-4">None; the browser picks the duration</td>
                    <td className="py-2.5">None either; animate scrollTop yourself if you need it</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

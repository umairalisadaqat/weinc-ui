import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const EASE = 0.3; // how quickly the cursor follows (0 to 1)
const IDLE_MS = 1700; // how long the demo rests on each target
const ORDER = [0, 2, 1, 3]; // demo visits: first paragraph, first button, second paragraph, second button

export default function ContextCursorCaretOverTextRingOverButtons() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const curRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current, cur = curRef.current;
    if (!root || !cur || reduce || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const spots = Array.from(root.querySelectorAll<HTMLElement>("[data-c]"));
    root.setAttribute("data-on", "");
    let x = 0, y = 0, tx = 0, ty = 0, live = false, mode = "", frame = 0, idle = 0;
    let hot: HTMLElement | null = null;
    const t0 = performance.now();
    const setMode = (m: string) => { if (m !== mode) { mode = m; if (m) root.setAttribute("data-mode", m); else root.removeAttribute("data-mode"); } };
    // In text, the caret sits on the middle of the line under the pointer.
    const onLine = (el: HTMLElement, yy: number, o: DOMRect) => {
      const r = el.getBoundingClientRect(), lh = parseFloat(getComputedStyle(el).lineHeight), top = r.top - o.top;
      return top + (Math.floor((yy - top) / lh) + 0.5) * lh;
    };
    const loop = (now: number) => {
      const o = root.getBoundingClientRect();
      let target = hot;
      if (!live) {
        const t = Math.max(0, now - t0) / IDLE_MS, el = spots[ORDER[Math.floor(t) % 4]], r = el.getBoundingClientRect(), f = t % 1, text = el.dataset.c === "text";
        target = el;
        tx = r.left - o.left + r.width * (text ? 0.15 + 0.6 * f : 0.5);
        ty = r.top - o.top + r.height * (text ? 0.4 : 0.5);
      }
      const m = target ? target.dataset.c || "" : "";
      setMode(m);
      const yy = m === "text" && target ? onLine(target, ty, o) : ty;
      x += (tx - x) * EASE; y += (yy - y) * EASE;
      cur.style.transform = `translate(${x}px, ${y}px)`;
      frame = requestAnimationFrame(loop);
    };
    const start = () => { if (!frame) { frame = requestAnimationFrame(loop); root.removeAttribute("data-paused"); } };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; root.setAttribute("data-paused", ""); };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const o = root.getBoundingClientRect(); tx = e.clientX - o.left; ty = e.clientY - o.top;
      hot = (e.target as HTMLElement).closest<HTMLElement>("[data-c]"); live = true; clearTimeout(idle);
      root.setAttribute("data-live", ""); root.removeAttribute("data-kb");
    };
    const onLeave = () => { hot = null; root.removeAttribute("data-live"); idle = window.setTimeout(() => { live = false; }, 1500); };
    const onFocus = () => { if (root.querySelector(":focus-visible")) root.setAttribute("data-kb", ""); };
    const onBlur = () => root.removeAttribute("data-kb");
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(root);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("focusin", onFocus);
    root.addEventListener("focusout", onBlur);
    return () => {
      stop(); io.disconnect(); clearTimeout(idle);
      ["data-on", "data-mode", "data-live", "data-kb", "data-paused"].forEach((a) => root.removeAttribute(a));
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("focusout", onBlur);
    };
  }, [reduce]);

  const btn = "inline-flex min-h-[48px] items-center rounded-full px-6 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#2e1c14] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4e9df]";

  return (
    <section ref={rootRef} className="w2car-root relative overflow-hidden bg-[#f4e9df] px-5 py-14 text-[#2e1c14] sm:px-10 sm:py-[72px]">
      <style>{`
        .w2car-cur { position: absolute; left: 0; top: 0; pointer-events: none; opacity: 0; transition: opacity .3s ease; will-change: transform; }
        .w2car-cur > span { position: absolute; left: 0; top: 0; transition: opacity .2s ease, transform .35s cubic-bezier(.2,.9,.3,1.2); }
        .w2car-dot { width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 50%; background: #b4532a; }
        .w2car-bar { width: 2px; height: 28px; margin: -14px 0 0 -1px; background: #b4532a; opacity: 0; transform: scaleY(.3); }
        .w2car-ring { width: 58px; height: 58px; margin: -29px 0 0 -29px; border-radius: 50%; border: 2px solid #2e1c14; background: rgba(255,248,242,.18); opacity: 0; transform: scale(.2); }
        .w2car-root[data-on] .w2car-cur { opacity: 1; }
        .w2car-root[data-kb] .w2car-cur { opacity: 0; }
        .w2car-root[data-mode="text"] .w2car-dot, .w2car-root[data-mode="btn"] .w2car-dot { opacity: 0; transform: scale(.2); }
        .w2car-root[data-mode="text"] .w2car-bar { opacity: 1; transform: none; animation: w2car-blink 1.1s steps(1) .5s infinite; }
        .w2car-root[data-mode="btn"] .w2car-ring { opacity: 1; transform: none; }
        @keyframes w2car-blink { 50% { opacity: .15; } }
        .w2car-root[data-paused] .w2car-bar { animation-play-state: paused; }
        @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
          .w2car-root[data-live], .w2car-root[data-live] * { cursor: none; }
        }
        @media (prefers-reduced-motion: reduce) { .w2car-cur { display: none; } }
      `}</style>
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#93401d]">Kiln Notes, from Ashgrove Pottery</p>
        <h2 className="mt-3.5 font-serif text-[clamp(1.9rem,4.4vw,2.8rem)] font-normal leading-[1.12]">What the last firing taught us about ash glaze</h2>
        <p data-c="text" className="mt-5 font-serif text-lg leading-[1.7] text-[#4a3226]">We packed the back of the kiln tighter than usual and the ash settled thickest on the shoulders of the tall jars. Where it pooled, the glaze ran green and glassy; where it thinned, the clay came through warm and orange.</p>
        <p data-c="text" className="mt-5 font-serif text-lg leading-[1.7] text-[#4a3226]">Next time we will leave a hand&apos;s width between the rows and load the wide bowls lower down, where the flame moves slowest.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" data-c="btn" className={`${btn} bg-[#b4532a] text-[#fff8f2] hover:bg-[#9c4622]`}>Get the next letter</button>
          <a href="#" data-c="btn" className={`${btn} shadow-[inset_0_0_0_1.5px_rgba(46,28,20,.35)] hover:bg-[#2e1c14]/5`}>Read past issues</a>
        </div>
      </div>
      <span ref={curRef} className="w2car-cur" aria-hidden="true">
        <span className="w2car-dot" />
        <span className="w2car-bar" />
        <span className="w2car-ring" />
      </span>
    </section>
  );
}

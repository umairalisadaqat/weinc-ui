import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const DOTS = 20; // how many ink dots make up the trail
const HEAD_EASE = 0.26; // how quickly the first dot catches the pointer (0 to 1)
const TAIL_EASE = 0.3; // how tightly each dot follows the one ahead of it
const notes = [
  { k: "Paper", v: "120 gsm cream, fountain pen safe" },
  { k: "Binding", v: "Thread sewn, opens flat" },
  { k: "Made in", v: "A two-room bindery by the canal" },
];

export default function InkDotCursorTrailFadingOverStationeryHero() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const blotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const layer = layerRef.current;
    if (!root || !layer || reduce) return;
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) {
      // Touch: a tap leaves a soft ink blot instead of a trail.
      const blot = blotRef.current!;
      const onDown = (e: PointerEvent) => {
        const r = root.getBoundingClientRect();
        blot.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
        blot.classList.remove("w2ink-go");
        void blot.offsetWidth;
        blot.classList.add("w2ink-go");
      };
      root.addEventListener("pointerdown", onDown);
      return () => root.removeEventListener("pointerdown", onDown);
    }
    root.setAttribute("data-on", "");
    const dots = Array.from(layer.children) as HTMLElement[];
    const pts = dots.map(() => ({ x: -50, y: -50 }));
    let tx = 0, ty = 0, live = false, frame = 0, idle = 0, t0 = performance.now();
    const loop = (now: number) => {
      if (!live) {
        const t = (now - t0) / 1000;
        tx = root.clientWidth * (0.5 + 0.34 * Math.sin(t * 0.85));
        ty = root.clientHeight * (0.52 + 0.24 * Math.sin(t * 1.7));
      }
      pts.forEach((p, i) => {
        const lead = i ? pts[i - 1] : { x: tx, y: ty };
        const k = i ? TAIL_EASE : HEAD_EASE;
        p.x += (lead.x - p.x) * k;
        p.y += (lead.y - p.y) * k;
        dots[i].style.transform = `translate(${p.x}px, ${p.y}px) scale(${1 - (i / DOTS) * 0.82})`;
      });
      frame = requestAnimationFrame(loop);
    };
    const start = () => { if (!frame) frame = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = root.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      live = true; clearTimeout(idle);
      root.removeAttribute("data-kb");
    };
    const onLeave = () => { idle = window.setTimeout(() => { live = false; t0 = performance.now() - 2000; }, 1400); };
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
      root.removeAttribute("data-on");
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("focusout", onBlur);
    };
  }, [reduce]);

  return (
    <section ref={rootRef} className="w2ink-root relative overflow-hidden px-5 py-14 sm:px-10 sm:py-20">
      <style>{`
        .w2ink-root { background: radial-gradient(120% 90% at 20% 0%, #fbf7ef 0%, #f1e9da 60%, #e9dfcc 100%); color: #1d2433; }
        .w2ink-layer { position: absolute; inset: 0; pointer-events: none; z-index: 0; opacity: 0; transition: opacity .4s ease; }
        .w2ink-root[data-on] .w2ink-layer { opacity: 1; }
        .w2ink-root[data-kb] .w2ink-layer { opacity: 0; }
        .w2ink-dot { position: absolute; left: -7px; top: -7px; width: 14px; height: 14px; border-radius: 50%;
          background: radial-gradient(circle at 38% 35%, #3b4a6b 0%, #1b2540 70%); will-change: transform; }
        .w2ink-blot { position: absolute; left: -30px; top: -30px; width: 60px; height: 60px; border-radius: 50%; opacity: 0;
          background: radial-gradient(circle, rgba(27,37,64,.35) 0%, rgba(27,37,64,0) 70%); pointer-events: none; }
        .w2ink-blot.w2ink-go { animation: w2ink-spread .9s ease-out forwards; }
        @keyframes w2ink-spread { from { opacity: 1; scale: .3 } to { opacity: 0; scale: 1.6 } }
        @media (prefers-reduced-motion: reduce) { .w2ink-layer, .w2ink-blot { display: none; } }
      `}</style>
      <div ref={layerRef} className="w2ink-layer" aria-hidden="true">
        {Array.from({ length: DOTS }, (_, i) => (
          <span key={i} className="w2ink-dot" style={{ opacity: 0.9 - (i / DOTS) * 0.8 }} />
        ))}
      </div>
      <span ref={blotRef} className="w2ink-blot" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-5xl">
        <nav aria-label="Marlow and Finch" className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <a href="#" className="rounded font-serif text-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a4b2a] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f4eee2]">Marlow &amp; Finch</a>
          <ul className="flex gap-1 text-[#4a4f5c]">
            {["Notebooks", "Ink", "Workshop"].map((l) => (
              <li key={l}><a href="#" className="inline-flex min-h-[40px] items-center rounded px-3 hover:text-[#1d2433] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a4b2a]">{l}</a></li>
            ))}
          </ul>
        </nav>
        <div className="mt-14 max-w-2xl sm:mt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4b2a]">Spring stock, bound by hand</p>
          <h1 className="mt-4 font-serif text-4xl leading-[1.08] tracking-tight sm:text-6xl">Paper that holds a thought until you are ready for it.</h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[#4a4f5c] sm:text-lg">Notebooks and letter sets cut from heavy cotton stock, sewn in small runs and sent out wrapped in plain brown paper.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#" className="inline-flex min-h-[44px] items-center rounded-full bg-[#1d2433] px-6 text-sm font-semibold text-[#f6f1e7] shadow-[0_8px_24px_-12px_rgba(29,36,51,.6)] transition hover:bg-[#2c3550] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a4b2a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4eee2]">Browse the notebooks</a>
            <a href="#" className="inline-flex min-h-[44px] items-center rounded-full border border-[#1d2433]/25 bg-[#fbf8f2] px-6 text-sm font-semibold transition hover:border-[#1d2433]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a4b2a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4eee2]">Visit the shop</a>
          </div>
        </div>
        <dl className="mt-14 grid gap-6 border-t border-[#1d2433]/15 pt-6 sm:grid-cols-3">
          {notes.map((n) => (
            <div key={n.k}>
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4b2a]">{n.k}</dt>
              <dd className="mt-1 text-sm text-[#3a3f4c]">{n.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

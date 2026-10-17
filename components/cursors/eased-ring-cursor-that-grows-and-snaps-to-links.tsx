import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const EASE = 0.16; // how quickly the ring catches up (0 to 1)
const SIZE = 40; // ring diameter in px
const PULL = 0.18; // how far a snapped ring still leans toward the pointer
const projects = [
  { name: "Kettle Yard Library", place: "Ashby, 2025" },
  { name: "Salt Store Housing", place: "Felixmouth, 2024" },
  { name: "Orchard Lane School", place: "Brimley, 2023" },
  { name: "Tidemill Studios", place: "Harwick, 2022" },
];

export default function EasedRingCursorThatGrowsAndSnapsToLinks() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current, ring = ringRef.current, dot = dotRef.current;
    if (!root || !ring || !dot || reduce || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const snaps = Array.from(root.querySelectorAll<HTMLElement>("[data-snap]"));
    root.setAttribute("data-on", "");
    let px = 0, py = 0, rx = 0, ry = 0, rs = 1, live = false, frame = 0, idle = 0;
    let hot: HTMLElement | null = null, was: boolean | null = null;
    const t0 = performance.now();
    const box = (el: HTMLElement) => {
      const a = (el.querySelector(".w2rng-arrow") || el).getBoundingClientRect(), o = root.getBoundingClientRect();
      return { x: a.left - o.left + a.width / 2, y: a.top - o.top + a.height / 2, s: Math.min(Math.max(a.width, a.height) + 14, 84) / SIZE };
    };
    const loop = (now: number) => {
      const target = live ? hot : snaps[Math.floor(Math.max(0, now - t0) / 1700) % snaps.length];
      let tx = px, ty = py, ts = 1;
      if (target) {
        const b = box(target);
        if (!live) { px += (b.x - px) * 0.1; py += (b.y - py) * 0.1; }
        tx = b.x + (px - b.x) * PULL; ty = b.y + (py - b.y) * PULL; ts = b.s;
      }
      rx += (tx - rx) * EASE; ry += (ty - ry) * EASE; rs += (ts - rs) * EASE;
      ring.style.transform = `translate(${rx}px, ${ry}px) scale(${rs})`;
      dot.style.transform = `translate(${px}px, ${py}px)`;
      if (!!target !== was) { was = !!target; root.toggleAttribute("data-hot", was); }
      frame = requestAnimationFrame(loop);
    };
    const start = () => { if (!frame) frame = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const o = root.getBoundingClientRect();
      px = e.clientX - o.left; py = e.clientY - o.top;
      hot = (e.target as HTMLElement).closest<HTMLElement>("[data-snap]");
      live = true; clearTimeout(idle);
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
      ["data-on", "data-live", "data-hot", "data-kb"].forEach((a) => root.removeAttribute(a));
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("focusout", onBlur);
    };
  }, [reduce]);

  const navLink = "inline-flex min-h-[40px] items-center rounded-full px-3 text-sm text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

  return (
    <section ref={rootRef} className="w2rng-root relative overflow-hidden bg-[#f6f7f9] px-5 pb-16 pt-12 text-slate-800 sm:px-10 sm:pb-[72px] sm:pt-14">
      <style>{`
        .w2rng-ring, .w2rng-dot { position: absolute; left: 0; top: 0; pointer-events: none; opacity: 0; transition: opacity .3s ease; will-change: transform; }
        .w2rng-ring { width: 40px; height: 40px; margin: -20px 0 0 -20px; border-radius: 50%; border: 1px solid #1e293b; }
        .w2rng-fill { position: absolute; inset: 0; border-radius: 50%; background: rgba(30,41,59,.08); opacity: 0; transition: opacity .3s ease; }
        .w2rng-root[data-hot] .w2rng-fill { opacity: 1; }
        .w2rng-dot { width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: #1e293b; }
        .w2rng-root[data-on] .w2rng-ring, .w2rng-root[data-on] .w2rng-dot { opacity: 1; }
        .w2rng-root[data-kb] .w2rng-ring, .w2rng-root[data-kb] .w2rng-dot { opacity: 0; }
        .w2rng-name { transition: transform .4s cubic-bezier(.2,.8,.2,1); }
        .w2rng-row:hover .w2rng-name, .w2rng-row:focus-visible .w2rng-name { transform: translateX(8px); }
        @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
          .w2rng-root[data-on][data-live], .w2rng-root[data-on][data-live] * { cursor: none; }
        }
        @media (prefers-reduced-motion: reduce) { .w2rng-ring, .w2rng-dot { display: none; } .w2rng-name { transition: none; } }
      `}</style>
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Halden Works" className="flex flex-wrap items-center justify-between gap-3">
          <a href="#" data-snap className="inline-flex min-h-[40px] items-center rounded font-bold tracking-tight text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Halden Works</a>
          <ul className="flex gap-1">
            {["Studio", "Journal", "Contact"].map((l) => (
              <li key={l}><a href="#" data-snap className={navLink}>{l}</a></li>
            ))}
          </ul>
        </nav>
        <h2 className="mb-4 mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Selected buildings</h2>
        <ul className="border-b border-[#d5dae1]">
          {projects.map((p) => (
            <li key={p.name}>
              <a href="#" data-snap className="w2rng-row grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-t border-[#d5dae1] py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f6f7f9] md:grid-cols-[1fr_200px_auto]">
                <span className="w2rng-name text-[clamp(1.4rem,3.6vw,2.4rem)] font-semibold leading-tight tracking-tight">{p.name}</span>
                <span className="col-start-1 text-sm text-slate-600 md:col-start-2 md:row-start-1">{p.place}</span>
                <span aria-hidden="true" className="w2rng-arrow col-start-2 row-span-2 row-start-1 grid h-12 w-12 place-items-center rounded-full border border-[#c5ccd6] bg-white text-lg md:col-start-3 md:row-span-1">→</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <span ref={ringRef} className="w2rng-ring" aria-hidden="true"><span className="w2rng-fill" /></span>
      <span ref={dotRef} className="w2rng-dot" aria-hidden="true" />
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const EASE = 0.2; // how quickly the label catches the pointer
const IDLE_MS = 1800; // time the demo spends on each card
const plants = [
  { name: "Bearded iris", note: "Violet, May", c: "#6d5a9c" },
  { name: "Lady's mantle", note: "Lime froth, June", c: "#b7c35a" },
  { name: "Catmint", note: "Soft blue, all summer", c: "#8e93c4" },
  { name: "Hakone grass", note: "Gold, autumn", c: "#c9a43a" },
  { name: "Sedum", note: "Rust heads, October", c: "#a4553a" },
];
const card = "w2lbl-card relative block aspect-[4/3] overflow-hidden rounded-[14px] bg-[#dfe5da] shadow-[0_1px_2px_rgba(29,43,34,.08),0_18px_40px_-24px_rgba(29,43,34,.45)] md:aspect-[4/5]";
const ring = "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#b45309] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef1ea]";

function Caption({ title, chip }: { title: string; chip: string }) {
  return (
    <span className="absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-[#f7f8f4]/95 px-3 py-2.5">
      <span className="text-[15px] font-semibold">{title}</span>
      <span className="rounded-full bg-[#1d2b22] px-2.5 py-1 text-xs font-semibold text-[#f1efe6]">{chip}</span>
    </span>
  );
}

export default function LabelCursorReadingViewDragOrPlayOnCards() {
  const reduce = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const curRef = useRef<HTMLSpanElement>(null);
  const txtRef = useRef<HTMLSpanElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  // Mouse drag on the plant palette; touch and arrow keys scroll it natively.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    let dragX: number | null = null, from = 0;
    const down = (e: PointerEvent) => { if (e.pointerType === "mouse") { dragX = e.clientX; from = strip.scrollLeft; strip.setPointerCapture(e.pointerId); strip.style.scrollSnapType = "none"; } };
    const move = (e: PointerEvent) => { if (dragX !== null) strip.scrollLeft = from - (e.clientX - dragX); };
    const up = () => { dragX = null; strip.style.scrollSnapType = ""; };
    strip.addEventListener("pointerdown", down);
    strip.addEventListener("pointermove", move);
    strip.addEventListener("pointerup", up);
    return () => { strip.removeEventListener("pointerdown", down); strip.removeEventListener("pointermove", move); strip.removeEventListener("pointerup", up); };
  }, []);

  useEffect(() => {
    const root = rootRef.current, cur = curRef.current, txt = txtRef.current;
    if (!root || !cur || !txt || reduce || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-label]"));
    let x = 0, y = 0, s = 0, tx = 0, ty = 0, label = "", live = false, frame = 0, idle = 0;
    let hot: HTMLElement | null = null;
    const t0 = performance.now();
    const loop = (now: number) => {
      const o = root.getBoundingClientRect();
      let target = hot;
      if (!live) {
        const t = Math.max(0, now - t0) / IDLE_MS;
        target = cards[Math.floor(t) % cards.length];
        const c = target.getBoundingClientRect();
        tx = c.left - o.left + c.width * (0.42 + 0.12 * Math.sin(t * 3)); ty = c.top - o.top + c.height * 0.4;
      }
      const want = target ? target.dataset.label || "" : "";
      if (want && want !== label) { label = want; txt.textContent = want; s *= 0.6; }
      x += (tx - x) * EASE; y += (ty - y) * EASE; s += ((target ? 1 : 0) - s) * 0.18;
      cur.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
      frame = requestAnimationFrame(loop);
    };
    const start = () => { if (!frame) frame = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const o = root.getBoundingClientRect();
      tx = e.clientX - o.left; ty = e.clientY - o.top; hot = (e.target as HTMLElement).closest<HTMLElement>("[data-label]");
      live = true; clearTimeout(idle); root.setAttribute("data-live", ""); root.removeAttribute("data-kb");
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
      root.removeAttribute("data-live");
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("focusout", onBlur);
    };
  }, [reduce]);

  return (
    <section ref={rootRef} className="w2lbl-root relative overflow-hidden bg-[#eef1ea] px-5 pb-14 pt-12 text-[#1d2b22] sm:px-10 sm:py-16">
      <style>{`
        .w2lbl-card img { transition: transform .7s cubic-bezier(.2,.8,.2,1); }
        .w2lbl-card:hover img, .w2lbl-card:focus-visible img { transform: scale(1.04); }
        .w2lbl-strip { scrollbar-width: none; user-select: none; scroll-snap-type: x mandatory; }
        .w2lbl-cur { position: absolute; left: 0; top: 0; width: 92px; height: 92px; margin: -46px 0 0 -46px; border-radius: 50%; background: #1d2b22; color: #f1efe6;
          display: grid; place-items: center; pointer-events: none; will-change: transform; box-shadow: 0 10px 30px -12px rgba(29,43,34,.6); transform: scale(0); }
        .w2lbl-root[data-kb] .w2lbl-cur { opacity: 0; }
        @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
          .w2lbl-root[data-live] [data-label], .w2lbl-root[data-live] [data-label] * { cursor: none; }
        }
        @media (prefers-reduced-motion: reduce) { .w2lbl-cur { display: none; } .w2lbl-card img { transition: none; } }
      `}</style>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
          <h2 className="font-serif text-[clamp(1.9rem,4vw,2.75rem)] font-normal">Recent gardens</h2>
          <p className="max-w-sm text-[15px] leading-relaxed text-[#3f4d43]">Ferncombe &amp; Lowe design planted gardens for farmhouses, schools and small town yards.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
          <a href="#" data-label="View" className={`${card} ${ring}`}>
            <img src="https://images.pexels.com/photos/38162588/pexels-photo-38162588.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Pale violet bearded irises flowering along a weathered wooden picket fence" loading="lazy" width={800} height={1200} className="absolute inset-0 h-full w-full object-cover" />
            <Caption title="Iris walk, Holloway Farm" chip="View project" />
          </a>
          <div data-label="Drag" className={`${card} bg-[#e4e8de]`}>
            <div ref={stripRef} tabIndex={0} role="region" aria-label="Plant palette, scrolls sideways" className={`w2lbl-strip absolute inset-x-0 bottom-[72px] top-0 flex gap-3 overflow-x-auto p-4 ${ring}`}>
              {plants.map((p) => (
                <div key={p.name} className="flex flex-[0_0_62%] snap-start flex-col justify-end gap-0.5 rounded-[10px] bg-[#f7f8f4] bg-no-repeat p-3" style={{ backgroundImage: `linear-gradient(${p.c}, ${p.c})`, backgroundSize: "100% 64%" }}>
                  <b className="text-[15px]">{p.name}</b>
                  <span className="text-[13px] text-[#3f4d43]">{p.note}</span>
                </div>
              ))}
            </div>
            <Caption title="The spring plant palette" chip="Drag to browse" />
          </div>
          <div data-label="Play" className={card}>
            <img src="https://images.pexels.com/photos/30371404/pexels-photo-30371404.jpeg?auto=compress&cs=tinysrgb&w=800" alt="A gardener's hands setting young seedlings into dark, freshly turned soil" loading="lazy" width={800} height={533} className="absolute inset-0 h-full w-full object-cover brightness-[.72]" />
            <button type="button" aria-pressed={playing} aria-label="Play the film: planting a spring border" onClick={() => setPlaying((v) => !v)} className={`absolute left-1/2 top-[42%] -ml-8 -mt-8 grid h-16 w-16 place-items-center rounded-full ${playing ? "bg-[#1d2b22] text-[#f1efe6]" : "bg-[#f7f8f4]/90 text-[#1d2b22]"} ${ring}`}>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
            </button>
            <Caption title="Planting a spring border" chip="Play film" />
          </div>
        </div>
      </div>
      <span ref={curRef} className="w2lbl-cur" aria-hidden="true"><span ref={txtRef} className="text-xs font-bold uppercase tracking-[0.16em]">View</span></span>
    </section>
  );
}

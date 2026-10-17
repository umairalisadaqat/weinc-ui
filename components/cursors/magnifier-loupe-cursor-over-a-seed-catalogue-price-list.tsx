import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const ZOOM = 1.8; // magnification inside the loupe
const LENS = 240; // loupe diameter in px
const seeds = [
  { name: "Broad bean, Winter Lantern", note: "Sow Feb to Apr. Thirty seeds.", price: "$3.40" },
  { name: "Pea, Hedgerow Sugar", note: "Sweet flat pods, climbs to 5 ft.", price: "$3.10" },
  { name: "Beetroot, Cellar Blood", note: "Deep red globes that store well.", price: "$2.80" },
  { name: "Carrot, Long Barn", note: "Tapered roots for heavy soil.", price: "$2.60" },
  { name: "Lettuce, Velvet Oak", note: "Pick-again leaves, bronze tips.", price: "$2.90" },
  { name: "Chard, Five Lamps", note: "Stems in gold, pink and white.", price: "$3.00" },
  { name: "Tomato, Ridge Cherry", note: "Small fruit, early, very sweet.", price: "$3.80" },
  { name: "Squash, Pale Moon", note: "Grey-blue skin, dense orange flesh.", price: "$3.60" },
  { name: "Leek, Frost Hold", note: "Stands all winter in the bed.", price: "$2.70" },
  { name: "Kale, Black Crow", note: "Crinkled leaves, sweeter after frost.", price: "$2.90" },
  { name: "Sweet pea, Old Parlour", note: "Strong scent, mixed soft colours.", price: "$3.50" },
  { name: "Calendula, Ember Mix", note: "Edible petals, self-seeds gently.", price: "$2.40" },
];

function SeedList() {
  return (
    <div className="w2lup-list px-5 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-[#3b2f22] pb-3">
        <h3 className="font-serif text-xl font-semibold">Spring sowing list</h3>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b5641]">Price per packet</p>
      </div>
      <ul className="mt-2 grid gap-x-10 md:grid-cols-2">
        {seeds.map((s) => (
          <li key={s.name} className="flex items-baseline gap-3 border-b border-dotted border-[#b9a68c] py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">{s.name}</span>
              <span className="block text-[13px] italic text-[#5c4a37]">{s.note}</span>
            </span>
            <span className="text-[15px] font-semibold tabular-nums">{s.price}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MagnifierLoupeCursorOverASeedCataloguePriceList() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current, sheet = sheetRef.current, lens = lensRef.current, clone = cloneRef.current;
    if (!root || !sheet || !lens || !clone || reduce || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    root.setAttribute("data-on", "");
    const R = LENS / 2;
    let x = 0, y = 0, tx = 0, ty = 0, live = false, frame = 0, idle = 0;
    const t0 = performance.now();
    const fit = () => { clone.style.width = `${sheet.clientWidth}px`; };
    const loop = (now: number) => {
      if (!live) {
        const t = (now - t0) / 1000;
        tx = sheet.clientWidth * (0.5 + 0.38 * Math.sin(t * 0.42)); ty = sheet.clientHeight * (0.5 + 0.36 * Math.sin(t * 0.9 + 0.5));
      }
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      lens.style.transform = `translate(${x - R}px, ${y - R}px)`;
      clone.style.transform = `translate(${R - x * ZOOM}px, ${R - y * ZOOM}px) scale(${ZOOM})`;
      frame = requestAnimationFrame(loop);
    };
    const start = () => { if (!frame) frame = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = sheet.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      live = true; clearTimeout(idle); root.removeAttribute("data-kb");
    };
    const onLeave = () => { idle = window.setTimeout(() => { live = false; }, 1500); };
    const onFocus = () => { if (root.querySelector(":focus-visible")) root.setAttribute("data-kb", ""); };
    const onBlur = () => root.removeAttribute("data-kb");
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(sheet);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(root);
    sheet.addEventListener("pointermove", onMove);
    sheet.addEventListener("pointerleave", onLeave);
    root.addEventListener("focusin", onFocus);
    root.addEventListener("focusout", onBlur);
    return () => {
      stop(); io.disconnect(); ro.disconnect(); clearTimeout(idle);
      root.removeAttribute("data-on");
      sheet.removeEventListener("pointermove", onMove);
      sheet.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("focusout", onBlur);
    };
  }, [reduce]);

  return (
    <section ref={rootRef} className="w2lup-root bg-[#e9dfcd] px-5 py-14 text-[#2b2117] sm:px-10 sm:py-16">
      <style>{`
        .w2lup-lens { position: absolute; left: 0; top: 0; width: ${LENS}px; height: ${LENS}px; border-radius: 50%; overflow: hidden; pointer-events: none;
          background: #fbf6ec; opacity: 0; transition: opacity .35s ease; will-change: transform;
          box-shadow: 0 0 0 5px #3b2f22, 0 0 0 6px rgba(255,255,255,.25), 0 18px 40px -10px rgba(43,33,23,.55); }
        .w2lup-lens::after { content: ""; position: absolute; inset: 0; border-radius: 50%;
          background: radial-gradient(circle at 32% 26%, rgba(255,255,255,.45), rgba(255,255,255,0) 42%), radial-gradient(circle, rgba(0,0,0,0) 62%, rgba(43,33,23,.18) 100%); }
        .w2lup-clone { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
        .w2lup-root[data-on] .w2lup-lens { opacity: 1; }
        .w2lup-root[data-kb] .w2lup-lens { opacity: 0; }
        @media (prefers-reduced-motion: reduce) { .w2lup-lens { display: none; } }
      `}</style>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7a4b22]">Aldergrove Seed Co.</p>
            <h2 className="mt-2 font-serif text-[clamp(1.8rem,4vw,2.6rem)] leading-tight">The fine print, up close</h2>
          </div>
          <a href="#" className="inline-flex min-h-[44px] items-center rounded-md bg-[#2b2117] px-5 text-sm font-semibold text-[#f6efe2] hover:bg-[#3e3022] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a4b22] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9dfcd]">Order a seed box</a>
        </div>
        <div ref={sheetRef} className="relative overflow-hidden rounded-sm bg-[#fbf6ec] shadow-[0_1px_0_rgba(43,33,23,.12),0_24px_50px_-30px_rgba(43,33,23,.6)]">
          <SeedList />
          <div ref={lensRef} className="w2lup-lens" aria-hidden="true">
            <div ref={cloneRef} className="w2lup-clone">
              <SeedList />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

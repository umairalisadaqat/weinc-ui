import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * The platters. Every photograph is shot on pure black, so on a black stage the picture has no edge.
 * `box` is where the plate and food sit in the square picture: left, top, right and front edge, as fractions.
 */
const plates = [
  { name: "Salmon moriawase", detail: "14 pieces, salmon five ways", price: 24, src: "https://images.pexels.com/photos/36292346/pexels-photo-36292346.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Round black plate of salmon sashimi, salmon nigiri, small rolls and pickled ginger", box: [0.18, 0.297, 0.849, 0.726] },
  { name: "Counter selection", detail: "22 pieces, tuna and white fish", price: 31, src: "https://images.pexels.com/photos/36292347/pexels-photo-36292347.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Black plate with tuna and white fish sashimi, salmon nigiri and a seaweed hand roll", box: [0.152, 0.276, 0.853, 0.737] },
  { name: "Hot roll platter", detail: "30 pieces, fried and fresh", price: 36, src: "https://images.pexels.com/photos/36292343/pexels-photo-36292343.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Large black plate of fried rolls with cream, salmon rolls and sashimi under shredded seaweed", box: [0.17, 0.245, 0.828, 0.725] },
  { name: "Salmon nigiri", detail: "8 pieces on slate", price: 17, src: "https://images.pexels.com/photos/36292350/pexels-photo-36292350.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Row of salmon nigiri on a black slate with a fan of cucumber and ginger", box: [0.148, 0.372, 0.86, 0.6] },
  { name: "Uramaki for two", detail: "40 pieces, four rolls", price: 42, src: "https://images.pexels.com/photos/36292344/pexels-photo-36292344.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Black plate filled with rows of inside-out rolls, salmon sashimi and crisp potato threads", box: [0.163, 0.29, 0.836, 0.725] },
  { name: "Sashimi fans", detail: "12 slices of salmon", price: 19, src: "https://images.pexels.com/photos/36292348/pexels-photo-36292348.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Two fans of sliced salmon sashimi with cucumber on a black slate", box: [0.139, 0.328, 0.858, 0.591] },
  { name: "Chef's round", detail: "26 pieces, sashimi and rolls", price: 34, src: "https://images.pexels.com/photos/36292345/pexels-photo-36292345.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Round black plate of salmon and white fish sashimi with fried and fresh rolls", box: [0.177, 0.278, 0.841, 0.727] },
];
const CURRENCY = "£";
const BELT_SPEED = 34; // pixels a second, right to left
const BELT_SCALE = 0.5; // size of a plate on the belt against the one on the counter
const HOLD_MS = 3600; // how long the demo leaves a plate on the counter
const LIFT_STIFF = 70;
const LIFT_DAMP = 13.5;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const N = plates.length;

function layoutFor(w: number) {
  const big = clamp(w * 1.1, 400, 760);
  const small = big * BELT_SCALE;
  const beltLine = Math.round(80 + small * 0.49);
  const counterLine = Math.round(beltLine + 52 + big * 0.49);
  const wide = w >= 1060;
  const loop = Math.max(N * small * 0.84, w + small * 1.1);
  return { w, big, small, beltLine, counterLine, wide, loop, height: counterLine + Math.round(big * 0.07) + (wide ? 40 : 216) };
}

export default function SushiConveyorCarousel() {
  const reduce = !!useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const beltRef = useRef<HTMLDivElement>(null);
  const plateRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [lay, setLay] = useState(() => layoutFor(1280));
  const [sel, setSel] = useState(0);
  const [added, setAdded] = useState<number[]>([]);
  const live = useRef({ lay, sel: 0, offset: 120, vel: BELT_SPEED, lift: plates.map((_, i) => (i === 0 ? 1 : 0)), liftV: plates.map(() => 0), drag: false, moved: 0, lastX: 0, lastT: 0, touched: false, since: 0 });
  live.current.lay = lay;

  const choose = useCallback((i: number) => {
    live.current.sel = i;
    live.current.since = performance.now();
    setSel(i);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setLay(layoutFor(el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const s = live.current;
    let raf = 0;
    let last = performance.now();
    let seen = true;
    s.since = last + 1700; // the first plate stays out a little longer
    const io = new IntersectionObserver(([e]) => (seen = e.isIntersecting));
    if (stageRef.current) io.observe(stageRef.current);
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!seen || document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      const L = s.lay;
      if (!s.drag && !reduce) {
        s.vel += (BELT_SPEED - s.vel) * Math.min(1, dt * 1.6); // a flick coasts, then the motor takes over again
        s.offset += s.vel * dt;
      }
      const spacing = L.loop / N;
      const margin = L.small * 0.62;
      let best = -1;
      let bestD = 1e9;
      for (let i = 0; i < N; i += 1) {
        const el = plateRefs.current[i];
        if (!el) continue;
        const b = plates[i].box;
        const target = i === s.sel ? 1 : 0;
        if (reduce) s.lift[i] = target;
        else {
          s.liftV[i] += (-LIFT_STIFF * (s.lift[i] - target) - LIFT_DAMP * s.liftV[i]) * dt;
          s.lift[i] += s.liftV[i] * dt;
        }
        const l = s.lift[i];
        const e = clamp(l, 0, 1);
        const bx = ((((i * spacing - s.offset) % L.loop) + L.loop) % L.loop) - margin;
        const d = Math.abs(bx - L.w * 0.56);
        if (i !== s.sel && d < bestD) {
          bestD = d;
          best = i;
        }
        const sc = BELT_SCALE + (1 - BELT_SCALE) * l;
        const cx = bx + (L.w / 2 - bx) * e;
        const cy = L.beltLine + (L.counterLine - L.beltLine) * e - Math.sin(Math.PI * e) * L.big * 0.1;
        const midX = (b[0] + b[2]) / 2;
        el.style.transform = `translate3d(${(cx - sc * L.big * midX).toFixed(2)}px, ${(cy - sc * L.big * b[3]).toFixed(2)}px, 0) scale(${sc.toFixed(4)})`;
        const up = l > 0.03;
        el.style.mixBlendMode = up ? "normal" : "lighten";
        el.style.zIndex = up ? (i === s.sel ? "6" : "5") : "2";
      }
      if (beltRef.current) beltRef.current.style.backgroundPositionX = `${(-s.offset).toFixed(1)}px`;
      // the demo: swap the plate on the counter for whichever is passing the middle
      if (!reduce && !s.touched && !s.drag && now - s.since > HOLD_MS && best >= 0 && bestD < spacing * 0.3) choose(best);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [choose, reduce]);

  // drag or flick the belt
  useEffect(() => {
    const s = live.current;
    const move = (e: PointerEvent) => {
      if (!s.drag) return;
      const now = performance.now();
      const dx = e.clientX - s.lastX;
      s.moved += Math.abs(dx);
      s.offset -= dx;
      s.vel = s.vel * 0.5 + (-dx / Math.max(1, now - s.lastT)) * 1000 * 0.5;
      s.lastX = e.clientX;
      s.lastT = now;
    };
    const up = () => {
      s.drag = false;
      s.vel = clamp(s.vel, -1400, 1400);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);
  const onBeltDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || reduce) return;
    const s = live.current;
    s.drag = true;
    s.touched = true;
    s.moved = 0;
    s.lastX = e.clientX;
    s.lastT = performance.now();
  };

  const p = plates[sel];
  const isAdded = added.includes(sel);
  const railTop = lay.beltLine + 5;

  return (
    <section className="relative overflow-hidden bg-black">
      <style>{`@keyframes sushi-conveyor-card-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } } @media (prefers-reduced-motion: reduce) { .sushi-conveyor-card { animation: none !important; } }`}</style>
      <div ref={stageRef} className="relative w-full select-none" style={{ height: lay.height }}>
        {/* the belt: a dark band that comes out of the shadow, slats sliding with it */}
        <div
          ref={beltRef}
          aria-hidden="true"
          onPointerDown={onBeltDown}
          className="absolute inset-x-0 cursor-grab touch-pan-y active:cursor-grabbing"
          style={{
            top: lay.beltLine - lay.small * 0.36,
            height: lay.small * 0.36 + 6,
            backgroundColor: "#060607",
            backgroundImage: "repeating-linear-gradient(104deg, rgba(255,255,255,0) 0 70px, rgba(255,255,255,0.12) 70px 71.5px, rgba(0,0,0,0.9) 71.5px 75px)",
            WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 55%)",
            maskImage: "linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 55%)",
          }}
        />
        {/* steel rail, the dark fascia under it and a warm strip of light on the counter */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0" style={{ top: railTop, height: 13, background: "linear-gradient(180deg, #2b2c2e 0%, #e4e6e8 16%, #9c9fa3 30%, #55585c 52%, #1a1b1d 78%, #060606 100%)" }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 22%, rgba(255,255,255,0.25) 52%, rgba(0,0,0,0) 78%, rgba(0,0,0,0.75) 100%)" }} />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0" style={{ top: railTop + 13, height: 20, background: "linear-gradient(180deg, #0c0c0d, #030303)" }} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0" style={{ top: railTop + 33, height: 1.5, background: "linear-gradient(90deg, rgba(255,176,92,0) 4%, rgba(255,176,92,0.85) 30%, rgba(255,200,130,1) 50%, rgba(255,176,92,0.85) 70%, rgba(255,176,92,0) 96%)", boxShadow: "0 0 10px 1px rgba(255,150,60,0.55)" }} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 z-[8]" style={{ top: railTop + 34, height: lay.big * 0.34, mixBlendMode: "screen", background: "radial-gradient(58% 100% at 50% 0%, rgba(255,150,60,0.13) 0%, rgba(255,150,60,0.04) 55%, rgba(255,150,60,0) 100%)" }} />

        {plates.map((pl, i) => {
          const b = pl.box;
          const rx = ((b[2] - b[0]) / 2) * 108;
          const ry = ((b[3] - b[1]) / 2) * 110;
          const mask = `radial-gradient(ellipse ${rx.toFixed(1)}% ${ry.toFixed(1)}% at ${((b[0] + b[2]) * 50).toFixed(1)}% ${((b[1] + b[3]) * 50).toFixed(1)}%, #000 90%, rgba(0,0,0,0) 100%)`;
          return (
            <div
              key={pl.src}
              ref={(el) => {
                plateRefs.current[i] = el;
              }}
              className="pointer-events-none absolute left-0 top-0"
              style={{ width: lay.big, height: lay.big, transformOrigin: "0 0", willChange: "transform", mixBlendMode: "lighten" }}
            >
              <img src={pl.src} alt={pl.alt} draggable={false} className="absolute inset-0 h-full w-full bg-black" style={{ WebkitMaskImage: mask, maskImage: mask }} />
              <button
                type="button"
                aria-pressed={i === sel}
                aria-label={i === sel ? `${pl.name}, on the counter` : `Lift ${pl.name} off the belt`}
                onPointerDown={onBeltDown}
                onClick={() => {
                  if (live.current.moved > 8) return;
                  live.current.touched = true;
                  choose(i);
                }}
                className="pointer-events-auto absolute cursor-pointer rounded-[50%] outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
                style={{ left: `${b[0] * 100}%`, top: `${b[1] * 100}%`, width: `${(b[2] - b[0]) * 100}%`, height: `${(b[3] - b[1]) * 100}%`, touchAction: "pan-y" }}
              />
            </div>
          );
        })}

        {/* the tent card that stands beside the plate on the counter */}
        <div
          className="absolute z-10"
          style={lay.wide ? { left: lay.w / 2 + lay.big * 0.41 + 8, top: lay.counterLine - 168, width: 208 } : { left: "50%", marginLeft: -112, top: lay.counterLine + Math.round(lay.big * 0.06) + 18, width: 224 }}
        >
                    <div className="relative rounded-[2px] px-4 pb-4 pt-3 text-[#1b1712]" style={{ borderTop: "5px solid #fffdf6", transformOrigin: "50% 100%", transform: "perspective(900px) rotateX(7deg)", background: "linear-gradient(178deg, #fbf6ea 0%, #f0e8d8 58%, #cfc4ad 100%)", boxShadow: "inset 0 1px 0 #ffffff, inset 0 -1px 0 rgba(0,0,0,0.3), 0 1px 0 #2a251d" }}>
            <div key={sel} className="sushi-conveyor-card" style={{ animation: "sushi-conveyor-card-in 420ms cubic-bezier(0.2,0.8,0.2,1) both" }} aria-live="polite">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#7a2a17]">Plate {String(sel + 1).padStart(2, "0")} of {String(N).padStart(2, "0")}</p>
              <p className="mt-1.5 text-[19px] font-semibold leading-tight tracking-tight">{p.name}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-[#4c4438]">{p.detail}</p>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#1b1712]/20 pt-3">
              <span className="text-[19px] font-semibold tabular-nums tracking-tight">
                {CURRENCY}
                {p.price}
              </span>
              <button
                type="button"
                aria-pressed={isAdded}
                onClick={() => {
                  live.current.touched = true;
                  setAdded((a) => (a.includes(sel) ? a.filter((x) => x !== sel) : [...a, sel]));
                }}
                className="min-h-[40px] rounded-full bg-[#1b1712] px-4 text-[13px] font-medium text-[#fbf6ea] transition-transform duration-150 hover:scale-[1.04] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a2a17] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe7d6]"
              >
                {isAdded ? "On your tab" : "Take this plate"}
              </button>
            </div>
          </div>
          <div aria-hidden="true" className="h-7" style={{ background: "linear-gradient(180deg, rgba(240,230,212,0.26), rgba(240,230,212,0.05) 55%, rgba(240,230,212,0))", filter: "blur(1.2px)" }} />
        </div>

        <p className="pointer-events-none absolute left-5 top-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-neutral-400 sm:left-8 sm:top-7">
          <span className="text-white">Tonight on the belt</span>
          <span className="block">Tap a plate to lift it off</span>
        </p>
        <p className="pointer-events-none absolute right-5 top-5 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-400 sm:right-8 sm:top-7" aria-live="polite">
          {added.length === 0 ? "Tab is empty" : `${added.length} on your tab · ${CURRENCY}${added.reduce((t, k) => t + plates[k].price, 0)}`}
        </p>
      </div>
    </section>
  );
}

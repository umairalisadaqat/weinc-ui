import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

/** The records in the stack, front first. `tone` shows while a cover loads, `label` is the paper label on the disc. */
const records = [
  { title: "Violet Hour", side: "Side A", cat: "OPN 014", src: "https://images.pexels.com/photos/11608677/pexels-photo-11608677.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Woman with a dark bob looking over her shoulder, her orange shadow thrown on a violet wall", tone: "#5b34c9", label: "#f08a1c", ink: "#2a1466" },
  { title: "Paper Crane", side: "Side A", cat: "OPN 021", src: "https://images.pexels.com/photos/33798260/pexels-photo-33798260.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Model in a pleated white paper costume and long white gloves kneeling on a red set", tone: "#b3141f", label: "#f3efe6", ink: "#8f0f18" },
  { title: "Cobalt Mask", side: "Side B", cat: "OPN 009", src: "https://images.pexels.com/photos/2035464/pexels-photo-2035464.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Woman with white line face paint, hoop earrings and a red collar against deep blue", tone: "#0d1670", label: "#e2382b", ink: "#fbe9d2" },
  { title: "Teal Curtain", side: "Side A", cat: "OPN 030", src: "https://images.pexels.com/photos/13430269/pexels-photo-13430269.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Woman with long braids in a red blouse in front of a teal curtain", tone: "#12a3a8", label: "#0e8f95", ink: "#fff4e0" },
];

const N = records.length;
// Design pixels; the whole scene is scaled down to fit narrow screens.
const S = 360; // sleeve edge
const T = 9; // sleeve thickness
const D = 340; // disc diameter
const OUT = 214; // how far the disc travels out of the sleeve
const SCENE_W = 700;
const SCENE_H = 560;
const HOLD_MS = 4200;
// each sleeve further back steps left, up and away, and leans a little more
const FAN_X = 40;
const FAN_Y = 19;
const FAN_Z = 16;
const FAN_R = 3.2;

const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const card = "#d9d2c3"; // bare board on the edges of a sleeve

function Disc({ rec, spinning }: { rec: (typeof records)[number]; spinning: boolean }) {
  return (
    <div className="absolute inset-0 rounded-full" style={{ background: "#070708", boxShadow: "0 0 0 1px rgba(255,255,255,0.16) inset, 0 0 0 3px #0c0c0d inset, 0 0 0 4px rgba(255,255,255,0.09) inset" }}>
      {/* grooves */}
      <div className="absolute inset-[6px] rounded-full" style={{ background: "repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px)" }} />
      {/* the smooth gaps between tracks */}
      <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0 38.4%, rgba(0,0,0,0.9) 38.6% 39.3%, rgba(0,0,0,0) 39.5% 51.8%, rgba(0,0,0,0.85) 52% 52.5%, rgba(0,0,0,0) 52.7% 61%, rgba(0,0,0,0.85) 61.2% 61.7%, rgba(0,0,0,0) 61.9% 68.6%, rgba(8,8,9,0.95) 68.8% 70.7%)" }} />
      {/* light raking across the grooves: stays put while the label turns */}
      <div className="absolute inset-[5px] rounded-full" style={{ background: "conic-gradient(from 18deg at 50% 50%, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.38) 20deg, rgba(255,236,214,0.12) 31deg, rgba(255,255,255,0) 52deg, rgba(255,255,255,0) 170deg, rgba(210,225,255,0.10) 190deg, rgba(255,255,255,0.24) 203deg, rgba(255,255,255,0) 232deg, rgba(255,255,255,0) 360deg)" }} />
      <div className="absolute inset-[5px] rounded-full" style={{ background: "conic-gradient(from 96deg at 50% 50%, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.07) 14deg, rgba(255,255,255,0) 30deg, rgba(255,255,255,0) 180deg, rgba(255,255,255,0.06) 196deg, rgba(255,255,255,0) 214deg)" }} />
      {/* run-out area and paper label */}
      <div className="absolute rounded-full" style={{ inset: "31.5%", background: "radial-gradient(circle, #0b0b0c 0 96%, rgba(255,255,255,0.14) 98%, #0b0b0c 100%)" }} />
      <div
        className={`vinyl-sleeve-gallery-label absolute rounded-full ${spinning ? "vinyl-sleeve-gallery-spin" : ""}`}
        style={{ inset: "33.5%", background: rec.label, color: rec.ink, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25), inset 0 2px 3px rgba(255,255,255,0.35), inset 0 -3px 6px rgba(0,0,0,0.22)" }}
      >
        <div className="absolute inset-[7%] rounded-full" style={{ border: "1px solid currentColor", opacity: 0.55 }} />
        <div className="absolute inset-x-0 top-[17%] text-center text-[9px] font-black uppercase leading-none tracking-[0.14em]">{rec.title}</div>
        <div className="absolute inset-x-0 bottom-[19%] text-center font-mono text-[6px] uppercase leading-none tracking-[0.2em]">
          {rec.side} / 33 rpm
        </div>
        <div className="absolute left-[12%] top-1/2 -translate-y-1/2 font-mono text-[6px] uppercase leading-none tracking-[0.12em]">{rec.cat}</div>
        <div className="absolute right-[13%] top-1/2 -translate-y-1/2 font-mono text-[6px] uppercase leading-none tracking-[0.12em]">Stereo</div>
        {/* glossy paper */}
        <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 45%, rgba(0,0,0,0.16))" }} />
        {/* spindle hole */}
        <div className="absolute left-1/2 top-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "#d8d3c8", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.75), 0 0 0 1px rgba(0,0,0,0.3)" }} />
      </div>
    </div>
  );
}

function Sleeve({ rec, index, slot, prevSlot, open, reduce, onPick }: { rec: (typeof records)[number]; index: number; slot: number; prevSlot: number; open: boolean; reduce: boolean; onPick: () => void }) {
  const front = slot === 0;
  const out = useSpring(0, { stiffness: 120, damping: 15, mass: 1.1 });
  const back = useTransform(out, (v) => -v);
  const lipShade = useTransform(out, (v) => clamp(v / 60, 0, 1));
  useEffect(() => {
    const v = front && open ? OUT : 0;
    if (reduce) out.jump(v);
    else out.set(v);
  }, [front, open, reduce, out]);

  // where a sleeve rests for its place in the stack
  const rest = { x: -slot * FAN_X, y: -slot * FAN_Y, z: -slot * FAN_Z, rotateZ: -slot * FAN_R };
  const wrapped = (prevSlot === 0 && slot === N - 1) || (prevSlot === N - 1 && slot === 0);
  const animate = wrapped && !reduce
    ? { x: [-prevSlot * FAN_X, -S * 0.98, rest.x], y: [-prevSlot * FAN_Y, 30, rest.y], z: [-prevSlot * FAN_Z, -N * 12, rest.z], rotateZ: [-prevSlot * FAN_R, -13, rest.rotateZ] }
    : rest;
  const transition = reduce ? { duration: 0 } : wrapped ? { duration: 0.95, times: [0, 0.46, 1], ease: [0.45, 0, 0.2, 1] as [number, number, number, number] } : { type: "spring" as const, stiffness: 150, damping: 20, delay: 0.12 };

  return (
    <motion.div className="absolute" style={{ left: -S / 2, top: -S / 2, width: S, height: S, transformStyle: "preserve-3d" }} initial={false} animate={animate} transition={transition}>
      {/* back board */}
      <div className="absolute inset-0" style={{ transform: `translateZ(${-T / 2}px)`, background: "linear-gradient(135deg, #cfc7b6, #a59c8a)" }} />
      {/* the disc, riding inside the sleeve */}
      <motion.div aria-hidden="true" className="absolute overflow-hidden rounded-full" style={{ left: (S - D) / 2, top: (S - D) / 2, width: D, height: D, x: out }}>
        <Disc rec={rec} spinning={front && open && !reduce} />
        {/* shadow the sleeve mouth drops on the vinyl */}
        <motion.div className="absolute inset-y-0" style={{ left: (S + D) / 2 - (S - D), width: 70, x: back, opacity: lipShade, background: "linear-gradient(90deg, rgba(0,0,0,0.78), rgba(0,0,0,0.3) 28%, rgba(0,0,0,0))" }} />
      </motion.div>
      {/* edges: spine, top, bottom and the two lips of the mouth (only the front sleeve needs them) */}
      {front && (
        <>
          <div className="absolute" style={{ left: -T / 2, top: 0, width: T, height: S, transform: "rotateY(90deg)", background: `linear-gradient(180deg, ${rec.tone}, ${rec.tone})` }}>
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.35), rgba(255,255,255,0.18) 50%, rgba(0,0,0,0.3))" }} />
          </div>
          <div className="absolute" style={{ left: 0, top: -T / 2, width: S, height: T, transform: "rotateX(90deg)", background: `linear-gradient(180deg, #f1ece1, ${card})` }} />
          <div className="absolute" style={{ left: 0, top: S - T / 2, width: S, height: T, transform: "rotateX(90deg)", background: "linear-gradient(180deg, #8d8575, #6f6859)" }} />
          {[1, -1].map((side) => (
            <div key={side} className="absolute" style={{ left: S - 1.5, top: 0, width: 3, height: S, transform: `translateZ(${side * (T / 2 - 1.5)}px) rotateY(90deg)`, background: "linear-gradient(180deg, #f6f2e9, #cfc8b9)" }} />
          ))}
        </>
      )}
      {/* cover */}
      <button
        type="button"
        onClick={onPick}
        tabIndex={front ? 0 : -1}
        aria-hidden={front ? undefined : true}
        aria-pressed={front ? open : undefined}
        aria-label={`${rec.title}: ${open && front ? "slide the record back into its sleeve" : "slide the record out"}`}
        className="absolute inset-0 block cursor-pointer overflow-hidden outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white"
        style={{ transform: `translateZ(${T / 2}px)`, background: rec.tone }}
      >
        <img src={rec.src} alt={front ? rec.alt : ""} width={S} height={S} draggable={false} loading={index === 0 ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover" />
        <span className="absolute left-[18px] top-[16px] text-left text-[13px] font-black uppercase leading-[1.05] tracking-[0.06em] text-white" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}>
          {rec.title}
        </span>
        <span className="absolute right-[18px] top-[17px] font-mono text-[8px] uppercase tracking-[0.2em] text-white/90" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}>
          {rec.cat}
        </span>
        {/* ring wear from the disc inside, laminate sheen, worn edges */}
        <span aria-hidden="true" className="absolute rounded-full" style={{ left: (S - D) / 2 + 4, top: (S - D) / 2 + 4, width: D - 8, height: D - 8, boxShadow: "0 0 0 1px rgba(255,255,255,0.07), inset 0 0 0 1px rgba(0,0,0,0.07), 0 0 5px 1px rgba(255,255,255,0.05)" }} />
        <span aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(112deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.04) 22%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 62%, rgba(0,0,0,0.14) 100%)" }} />
        <span aria-hidden="true" className="absolute inset-0" style={{ boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.45), inset -1px -1px 0 rgba(0,0,0,0.25), inset 0 0 22px rgba(0,0,0,0.12)" }} />
        {/* sleeves further back sit in the shade of the ones in front */}
        <motion.span aria-hidden="true" className="absolute inset-0 bg-black" initial={false} animate={{ opacity: slot === 0 ? 0 : 0.05 + slot * 0.06 }} transition={{ duration: reduce ? 0 : 0.5 }} />
      </button>
    </motion.div>
  );
}

export default function VinylSleeveGallery() {
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [prevActive, setPrevActive] = useState(0);
  const [open, setOpen] = useState(false);
  const busy = useRef(false);
  const paused = useRef(false);
  const timers = useRef<number[]>([]);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const ry = useSpring(useTransform(px, (v) => -19 + v * 9), { stiffness: 70, damping: 14 });
  const rx = useSpring(useTransform(py, (v) => 5 - v * 7), { stiffness: 70, damping: 14 });
  const shadowOpen = useSpring(0, { stiffness: 120, damping: 18 });

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  };

  const go = useCallback(
    (dir: number) => {
      if (busy.current) return;
      busy.current = true;
      setOpen(false);
      later(
        () => {
          setActive((a) => {
            setPrevActive(a);
            return mod(a + dir, N);
          });
          later(
            () => {
              setOpen(true);
              busy.current = false;
            },
            reduce ? 0 : 900,
          );
        },
        reduce ? 0 : 430,
      );
    },
    [reduce],
  );

  useEffect(() => {
    shadowOpen.set(open ? 1 : 0);
  }, [open, shadowOpen]);

  useEffect(() => {
    const first = window.setTimeout(() => setOpen(true), reduce ? 0 : 350);
    const loop = reduce ? 0 : window.setInterval(() => !paused.current && !document.hidden && go(1), HOLD_MS);
    return () => {
      window.clearTimeout(first);
      if (loop) window.clearInterval(loop);
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, [go, reduce]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    if (!wrap || !scene) return;
    const measure = () => {
      const sc = clamp(wrap.clientWidth / (SCENE_W + 80), 0.45, 1);
      wrap.style.height = `${Math.round(SCENE_H * sc + 96)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 2 - 1);
    py.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
    paused.current = false;
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      go(-1);
    }
  };

  const btn = "grid h-10 w-10 place-items-center rounded-full border border-neutral-900/15 bg-white/50 text-neutral-900 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900";

  return (
    <section className="relative overflow-hidden bg-[#e4dfd3]">
      <style>{`
        @keyframes vinyl-sleeve-gallery-turn { to { transform: rotate(360deg); } }
        .vinyl-sleeve-gallery-spin { animation: vinyl-sleeve-gallery-turn 1.8s linear infinite; }
        @keyframes vinyl-sleeve-gallery-float { 0%, 100% { transform: translateY(0) rotateY(-1.6deg); } 50% { transform: translateY(-7px) rotateY(1.6deg); } }
        .vinyl-sleeve-gallery-idle { animation: vinyl-sleeve-gallery-float 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .vinyl-sleeve-gallery-spin, .vinyl-sleeve-gallery-idle { animation: none; } }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 64% at 46% 38%, #f7f4ec 0%, #ebe6db 46%, #d6d0c2 100%)" }} />
      <div
        ref={wrapRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Stack of record sleeves. Use the left and right arrow keys to bring the next record forward."
        onKeyDown={onKey}
        onPointerMove={onMove}
        onPointerEnter={() => (paused.current = true)}
        onPointerLeave={onLeave}
        onFocus={() => (paused.current = true)}
        onBlur={() => (paused.current = false)}
        className="relative mx-auto w-full overflow-hidden"
        style={{ height: SCENE_H + 96 }}
      >
        <div ref={sceneRef} className="absolute left-1/2 top-0 select-none" style={{ width: SCENE_W, height: SCENE_H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "2100px", perspectiveOrigin: "50% 42%" }}>
          <div className="vinyl-sleeve-gallery-idle absolute" style={{ left: SCENE_W / 2 - 52, top: SCENE_H / 2 + 22, width: 0, height: 0, transformStyle: "preserve-3d" }}>
            {/* soft shadows on the floor under the stack and under the disc */}
            <div aria-hidden="true" className="absolute" style={{ left: -S / 2 - 130, top: S / 2 + 22, width: S + 200, height: 84, transform: "translateZ(-120px)", background: "radial-gradient(50% 50% at 50% 50%, rgba(40,32,20,0.42) 0%, rgba(40,32,20,0.2) 42%, rgba(40,32,20,0) 100%)" }} />
            <motion.div aria-hidden="true" className="absolute" style={{ left: S / 2 - 150, top: S / 2 + 32, width: 420, height: 60, opacity: shadowOpen, z: -120, background: "radial-gradient(50% 50% at 50% 50%, rgba(40,32,20,0.3) 0%, rgba(40,32,20,0.12) 45%, rgba(40,32,20,0) 100%)" }} />
            <motion.div className="absolute left-0 top-0" style={{ width: 0, height: 0, transformStyle: "preserve-3d", rotateX: rx, rotateY: ry }}>
              {records.map((rec, i) => (
                <Sleeve key={rec.cat} rec={rec} index={i} slot={mod(i - active, N)} prevSlot={mod(i - prevActive, N)} open={open} reduce={reduce} onPick={() => (mod(i - active, N) === 0 ? setOpen((o) => !o) : undefined)} />
              ))}
            </motion.div>
          </div>
        </div>

        <p aria-live="polite" className="absolute bottom-5 left-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-neutral-600 sm:bottom-8 sm:left-8">
          <span className="tabular-nums text-neutral-950">{String(active + 1).padStart(2, "0")}</span>
          <span className="mx-2 text-neutral-500">/</span>
          <span className="tabular-nums">{String(N).padStart(2, "0")}</span>
          <span className="block text-neutral-950">{records[active].title}</span>
        </p>
        <div className="absolute bottom-4 right-4 flex gap-2 sm:bottom-7 sm:right-8">
          <button type="button" onClick={() => go(-1)} aria-label="Bring the previous record to the front" className={btn}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4l-6 6 6 6" />
            </svg>
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Bring the next record to the front" className={btn}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 4l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

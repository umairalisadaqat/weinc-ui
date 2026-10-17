import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

/** The loose prints in the box, top of the pile first. `tone` shows while a photograph loads. */
const prints = [
  { title: "Pool blue", src: "https://images.pexels.com/photos/35707515/pexels-photo-35707515.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Woman with an afro and dark glasses crouching in a pink dress against a bright blue backdrop", tone: "#1583d8", focus: "50% 30%" },
  { title: "Paper peony", src: "https://images.pexels.com/photos/9121152/pexels-photo-9121152.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Model in a white paper flower headpiece with a translucent red disc across the lower half of the frame", tone: "#c9cfca", focus: "50% 40%" },
  { title: "Blue on ochre", src: "https://images.pexels.com/photos/14793003/pexels-photo-14793003.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Seated woman in a blazer washed in blue light in front of an ochre backdrop", tone: "#c79a0c", focus: "50% 45%" },
  { title: "Moss and magenta", src: "https://images.pexels.com/photos/21352926/pexels-photo-21352926.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Woman in a moss green top with one arm behind her head against a magenta backdrop", tone: "#c40f43", focus: "50% 30%" },
  { title: "Silver crop", src: "https://images.pexels.com/photos/24972993/pexels-photo-24972993.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Black and white studio portrait of a seated woman with cropped silver hair resting her face on her hand", tone: "#5d5d5d", focus: "50% 24%" },
];
const cover = { title: "Colour studies", box: "Box 03", src: "https://images.pexels.com/photos/28262886/pexels-photo-28262886.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "Model in round glasses under a pleated white paper hat", tone: "#d9d9d9" };

const N = prints.length;
// Design pixels in the box's own space: x across, y from the hinge toward you, z up off the table.
const W = 300;
const D = 390;
const T = 9; // board thickness
const WH = 44; // wall height
const PW = 250;
const PL = 330;
const LID_OPEN = 101; // degrees: just past upright, so the lid leans back
const LEAN = -80; // angle of a print resting on the lid
const SCENE_W = 460;
const SCENE_H = 700;
const HOLD_MS = 2500;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rad = (d: number) => (d * Math.PI) / 180;
const jitter = [-1.3, 0.9, -0.5, 1.5, -0.8, 0.6];
const nudge = [-3, 4, -1, 3, -4, 2];

const CLOTH = "#cdc4b2";
const weave = "repeating-linear-gradient(0deg, rgba(60,48,30,0.10) 0 1px, rgba(0,0,0,0) 1px 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.14) 0 1px, rgba(0,0,0,0) 1px 3px)";
const LINING = "#efeae0";

/** A wall standing on the line y = `y`, facing you. */
function WallY({ y, x = 0, w, h, z = 0, bg, children }: { y: number; x?: number; w: number; h: number; z?: number; bg: React.CSSProperties; children?: React.ReactNode }) {
  return (
    <div className="absolute" style={{ left: x, top: y - h, width: w, height: h, transformOrigin: "50% 100%", transform: `translateZ(${z}px) rotateX(-90deg)`, ...bg }}>
      {children}
    </div>
  );
}
/** A wall standing on the line x = `x`, facing right. */
function WallX({ x, y = 0, d, h, z = 0, bg }: { x: number; y?: number; d: number; h: number; z?: number; bg: React.CSSProperties }) {
  return <div className="absolute" style={{ left: x - h, top: y, width: h, height: d, transformOrigin: "100% 50%", transform: `translateZ(${z}px) rotateY(90deg)`, ...bg }} />;
}

/**
 * One loose print. `t` runs from 0 (lying in the tray) to 1 (leaning on the lid). The foot of the
 * print skids toward the hinge exactly as fast as the top swings up, so the top edge climbs the lid
 * and never passes through it. When the spring overshoots, the print rocks back off the lid.
 */
function Print({ i, up, top, delay, reduce }: { i: number; up: boolean; top: boolean; delay: number; reduce: boolean }) {
  const p = prints[i];
  const t = useSpring(0, { stiffness: 62, damping: 9.5, mass: 1 });
  useEffect(() => {
    const v = up ? 1 : 0;
    if (reduce) {
      t.jump(v);
      return;
    }
    const id = window.setTimeout(() => t.set(v), up ? 0 : delay);
    return () => window.clearTimeout(id);
  }, [up, delay, reduce, t]);

  const flatZ = 5 + (N - 1 - i) * 2.4;
  const footEnd = 18 + i * 3;
  const slack = D - (D - PL) / 2 - footEnd - PL * (1 - Math.cos(rad(LEAN)));
  const transform = useTransform(t, (raw) => {
    const v = raw > 1 ? 2 - raw : Math.abs(raw);
    const a = LEAN * v;
    const foot = footEnd + PL * (Math.cos(rad(a)) - Math.cos(rad(LEAN))) + slack * (1 - v);
    const z = flatZ + (16 + i * 0.6 - flatZ) * v;
    const twist = jitter[N - 1 - i] * 0.5 * (1 - v) + jitter[i] * v;
    return `translate3d(${(nudge[i] * v).toFixed(2)}px, ${(foot - PL).toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${a.toFixed(2)}deg) rotateZ(${twist.toFixed(2)}deg)`;
  });
  const gloss = useTransform(t, (v) => clamp(v, 0, 1));
  const shade = useTransform(t, (v) => 0.2 * (1 - clamp(v, 0, 1)));

  return (
    <motion.div className="absolute overflow-hidden bg-[#f8f6f0]" style={{ left: (W - PW) / 2, top: 0, width: PW, height: PL, transformOrigin: "50% 100%", transform, boxShadow: "0 0 0 0.5px rgba(0,0,0,0.35)" }}>
      <div className="absolute overflow-hidden" style={{ left: 13, right: 13, top: 13, bottom: 38, background: p.tone }}>
        <img src={p.src} alt={top ? p.alt : ""} draggable={false} loading={i < 2 ? "eager" : "lazy"} className="h-full w-full object-cover" style={{ objectPosition: p.focus }} />
        <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.3)" }} />
      </div>
      <div className="absolute inset-x-[14px] bottom-[13px] flex items-baseline justify-between font-mono text-[7.5px] uppercase tracking-[0.18em] text-neutral-800">
        <span className="font-semibold">{p.title}</span>
        <span className="tabular-nums text-neutral-600">
          {String(i + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
        </span>
      </div>
      {/* glossy when it catches the light, dull when it lies in the box or behind another print */}
      <motion.div aria-hidden="true" className="absolute inset-0" style={{ opacity: gloss, background: "linear-gradient(118deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.03) 26%, rgba(255,255,255,0) 60%, rgba(0,0,0,0.1) 100%)" }} />
      <motion.div aria-hidden="true" className="absolute inset-0 bg-[#1a1712]" style={{ opacity: shade }} />
      <div aria-hidden="true" className="absolute inset-0 bg-[#1a1712] transition-opacity duration-500" style={{ opacity: up && !top ? 0.12 : 0 }} />
    </motion.div>
  );
}

export default function ArchiveBoxGallery() {
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(0); // how many prints stand on the lid
  const paused = useRef(false);
  const timers = useRef<number[]>([]);
  const live = useRef({ open: false, shown: 0 });
  live.current = { open, shown };

  const lid = useSpring(0, { stiffness: 70, damping: 13, mass: 1.2 });
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rz = useSpring(useTransform(px, (v) => -13 + v * 7), { stiffness: 60, damping: 14 });
  const rx = useSpring(useTransform(py, (v) => 51 - v * 4), { stiffness: 60, damping: 14 });
  const trayShade = useTransform(lid, (v) => 0.55 * (1 - clamp(v / 70, 0, 1)));

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => {
    const v = open ? LID_OPEN : 0;
    if (reduce) lid.jump(v);
    else lid.set(v);
  }, [open, reduce, lid]);

  const next = useCallback(() => {
    const s = live.current;
    if (!s.open) {
      setOpen(true);
      later(() => setShown(1), reduce ? 0 : 650);
    } else setShown(s.shown >= N ? 0 : s.shown + 1);
  }, [reduce]);
  const prev = useCallback(() => {
    const s = live.current;
    if (!s.open) return;
    if (s.shown > 0) setShown(s.shown - 1);
    else setOpen(false);
  }, []);
  const toggle = useCallback(() => {
    const s = live.current;
    if (!s.open) return next();
    setShown(0);
    later(() => setOpen(false), reduce || s.shown === 0 ? 0 : 520);
  }, [next, reduce]);

  useEffect(() => {
    if (reduce) {
      setOpen(true);
      setShown(1);
      return;
    }
    const first = window.setTimeout(next, 300);
    const loop = window.setInterval(() => !paused.current && !document.hidden && next(), HOLD_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, [next, reduce]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    if (!wrap || !scene) return;
    const measure = () => {
      const sc = clamp(wrap.clientWidth / (SCENE_W - 10), 0.6, 1);
      wrap.style.height = `${Math.round(SCENE_H * sc + 78)}px`;
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
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      prev();
    }
  };

  const cloth = { backgroundColor: CLOTH, backgroundImage: weave };
  const clothDark = { backgroundColor: "#a39a88", backgroundImage: weave };
  const clothSide = { backgroundColor: "#b9b09d", backgroundImage: weave };
  const current = shown > 0 ? prints[shown - 1] : null;
  const btn = "grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-neutral-200 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

  return (
    <section className="relative overflow-hidden bg-[#0e0e10]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(58% 60% at 50% 44%, #3a3a3e 0%, #232326 40%, #121214 74%, #0b0b0d 100%)" }} />
      <div
        ref={wrapRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Archive box of loose photographic prints. Use the right arrow key to stand the next print on the lid and the left arrow key to put it back."
        onKeyDown={onKey}
        onPointerMove={onMove}
        onPointerEnter={() => (paused.current = true)}
        onPointerLeave={() => {
          paused.current = false;
          px.set(0);
          py.set(0);
        }}
        onFocus={() => (paused.current = true)}
        onBlur={() => (paused.current = false)}
        className="relative mx-auto w-full overflow-hidden"
        style={{ height: SCENE_H + 78 }}
      >
        <div ref={sceneRef} className="absolute left-1/2 top-0 select-none" style={{ width: SCENE_W, height: SCENE_H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "2400px", perspectiveOrigin: "50% 45%" }}>
          <motion.div className="absolute" style={{ left: SCENE_W / 2 - W / 2, top: 404, width: W, height: D, transformStyle: "preserve-3d", transformOrigin: `${W / 2}px 30px`, rotateX: rx, rotateZ: rz, scale: 0.92 }}>
            {/* shadows on the table */}
            <div aria-hidden="true" className="absolute rounded-[14px] bg-black" style={{ left: -34, top: -30, width: W + 96, height: D + 76, filter: "blur(26px)", opacity: 0.7 }} />
            <div aria-hidden="true" className="absolute bg-black" style={{ left: -2, top: -2, width: W + 8, height: D + 8, filter: "blur(4px)", opacity: 0.8 }} />

            {/* tray: floor, outer walls, inner walls, and the top of the boards */}
            <div className="absolute" style={{ left: T, top: T, width: W - T * 2, height: D - T * 2, transform: "translateZ(2px)", background: `linear-gradient(180deg, #a9a498 0%, #c9c4b8 30%, ${LINING} 100%)` }} />
            <WallY y={0} w={W} h={WH} bg={clothDark} />
            <WallY y={D} w={W} h={WH} bg={cloth}>
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0, rgba(255,255,255,0) 5px, rgba(0,0,0,0) 50%, rgba(0,0,0,0.3) 100%)" }} />
              {/* brass label holder */}
              <div className="absolute left-1/2 top-[9px] h-[26px] w-[118px] -translate-x-1/2 rounded-[2px] p-[3px]" style={{ background: "linear-gradient(180deg, #f1dc9a 0%, #b8923c 34%, #7d5e1e 62%, #d7b862 100%)", boxShadow: "0 1px 2px rgba(0,0,0,0.5), inset 0 0 0 0.5px rgba(60,40,0,0.6)" }}>
                <div className="flex h-full items-center justify-between bg-[#f4efe2] px-[6px] font-mono text-[6.5px] font-semibold uppercase tracking-[0.14em] text-neutral-800" style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)" }}>
                  <span>{cover.title}</span>
                  <span>{cover.box.slice(-2)}</span>
                </div>
                {[4, 110].map((l) => (
                  <span key={l} className="absolute top-1/2 h-[3px] w-[3px] -translate-y-1/2 rounded-full" style={{ left: l - 3.5, background: "radial-gradient(circle at 35% 30%, #fff3c4, #7d5e1e)" }} />
                ))}
              </div>
            </WallY>
            {/* the right outer wall always faces away from the camera, so it is left out */}
            <WallX x={0} d={D} h={WH} bg={clothSide} />
            <WallY y={T} x={T} w={W - T * 2} h={WH - 2} z={2} bg={{ background: `linear-gradient(180deg, ${LINING}, #b7b2a6)` }} />
            <WallY y={D - T} x={T} w={W - T * 2} h={WH - 2} z={2} bg={{ background: "#8f8a7e" }} />
            <WallX x={T} y={T} d={D - T * 2} h={WH - 2} z={2} bg={{ background: "linear-gradient(90deg, #d9d4c8, #a5a094)" }} />
            <WallX x={W - T} y={T} d={D - T * 2} h={WH - 2} z={2} bg={{ background: "linear-gradient(90deg, #e3ded2, #b4afa3)" }} />
            {[
              { left: 0, top: 0, width: W, height: T },
              { left: 0, top: D - T, width: W, height: T },
              { left: 0, top: T, width: T, height: D - T * 2 },
              { left: W - T, top: T, width: T, height: D - T * 2 },
            ].map((r, i) => (
              <div key={i} className="absolute" style={{ ...r, transform: `translateZ(${WH}px)`, backgroundColor: "#ddd5c4", backgroundImage: weave, boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.18)" }} />
            ))}
            {/* the shut lid keeps the inside dark */}
            <motion.div aria-hidden="true" className="pointer-events-none absolute bg-black" style={{ left: T, top: T, width: W - T * 2, height: D - T * 2, transform: "translateZ(22px)", opacity: trayShade }} />

            {/* the prints */}
            {prints.map((p, i) => (
              <Print key={p.title} i={i} up={i < shown} top={i === shown - 1} delay={shown === 0 ? (N - 1 - i) * 70 : 0} reduce={reduce} />
            ))}

            {/* the lid, hinged along the far wall */}
            <motion.div className="absolute left-0 top-0" style={{ width: W, height: D, transformStyle: "preserve-3d", transformOrigin: "50% 0%", z: WH + 0.5, rotateX: lid }}>
              {/* lining */}
              <div className="absolute inset-0" style={{ transform: "translateZ(0.5px)", background: `linear-gradient(180deg, #d5d0c4 0%, ${LINING} 30%, #f6f2e9 100%)`, boxShadow: "inset 0 0 0 9px #d9d1c0, inset 0 0 0 9.5px rgba(0,0,0,0.2), inset 0 0 40px rgba(0,0,0,0.12)" }} />
              {/* shadow the standing prints throw on the lining */}
              <div aria-hidden="true" className="absolute bg-black transition-opacity duration-700" style={{ left: (W - PW) / 2 - 6, top: 10, width: PW + 12, height: PL - 44, transform: "translateZ(0.2px)", filter: "blur(8px)", opacity: shown > 0 ? 0.16 : 0 }} />
              {/* board edges */}
              <WallY y={D} w={W} h={T} bg={cloth} />
              <WallY y={0} w={W} h={T} bg={clothDark} />
              <WallX x={0} d={D} h={T} bg={clothSide} />
              {/* cloth cover with a tipped-in plate */}
              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-label={open ? `Close ${cover.box}, ${cover.title}` : `Open ${cover.box}, ${cover.title}`}
                className="absolute inset-0 block cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white"
                style={{ transform: `translateZ(${T}px)`, ...cloth }}
              >
                <span className="absolute left-1/2 top-[78px] block h-[178px] w-[142px] -translate-x-1/2" style={{ background: "#b5ac9a", boxShadow: "inset 0 2px 3px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(255,255,255,0.5), 0 1px 0 rgba(255,255,255,0.35)" }}>
                  <span className="absolute inset-[5px] block overflow-hidden" style={{ background: cover.tone }}>
                    <img src={cover.src} alt={cover.alt} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: "50% 30%" }} />
                  </span>
                </span>
                <span className="absolute inset-x-0 top-[280px] block text-center text-[15px] font-semibold uppercase tracking-[0.34em] text-[#4b4436]" style={{ textShadow: "0 1px 0 rgba(255,255,255,0.45), 0 -1px 0 rgba(0,0,0,0.25)" }}>
                  {cover.title}
                </span>
                <span className="absolute inset-x-0 top-[306px] block text-center font-mono text-[8px] uppercase tracking-[0.3em] text-[#5c5444]" style={{ textShadow: "0 1px 0 rgba(255,255,255,0.4)" }}>
                  {cover.box} / {N} prints
                </span>
                <span aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(140deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.14) 100%)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.3), inset 0 0 18px rgba(0,0,0,0.12)" }} />
              </button>
            </motion.div>
          </motion.div>
        </div>

        <p aria-live="polite" className="absolute bottom-5 left-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-neutral-300 sm:bottom-8 sm:left-8">
          <span className="tabular-nums text-white">{String(shown).padStart(2, "0")}</span>
          <span className="mx-2 text-neutral-500">/</span>
          <span className="tabular-nums">{String(N).padStart(2, "0")}</span>
          <span className="block text-neutral-400">{current ? current.title : open ? "All prints in the box" : `${cover.box} is shut`}</span>
        </p>
        <div className="absolute bottom-4 right-4 flex gap-2 sm:bottom-7 sm:right-8">
          <button type="button" onClick={prev} aria-label={shown > 0 ? "Put the front print back in the box" : "Close the lid"} className={btn}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8l6 6 6-6" />
            </svg>
          </button>
          <button type="button" onClick={next} aria-label={!open ? "Open the box" : shown >= N ? "Put every print back in the box" : "Stand the next print on the lid"} className={btn}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12l6-6 6 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

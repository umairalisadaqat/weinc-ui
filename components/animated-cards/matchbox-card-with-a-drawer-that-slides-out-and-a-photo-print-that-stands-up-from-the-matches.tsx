import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

/** Everything printed on the box and the card inside it. */
const box = {
  name: "Afterglow",
  number: "No. 7",
  line: "Forty safety matches and one print",
  cover: { src: "https://images.pexels.com/photos/7516560/pexels-photo-7516560.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Woman in a red dress standing in front of a yellow wall with a large red circle", tone: "#e3a70f", focus: "50% 34%" },
  print: { src: "https://images.pexels.com/photos/7658850/pexels-photo-7658850.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Profile of a woman lit in orange and green studio light", tone: "#b5561a", focus: "50% 30%" },
};

// Design pixels in the box's own space: x runs along the box, y across it, z up off the table.
const W = 400;
const DP = 250;
const H = 84;
const WALL = 5; // gap between sleeve and tray
const TRAY_H = 66;
const MATCH_Z = 34; // height of the bed of matches inside the tray
const OUT = 296; // travel of the drawer
const CARD_W = 184; // across the box
const CARD_L = 222; // along the box
const LIFT = 63; // degrees the print stands up
const SCENE_W = 900;
const HINGE = 64; // how far in from the drawer's outer end the print is hinged
const SCENE_H = 620;
// how one design pixel along x lands on screen for the resting camera (used to turn a drag into travel)
const TURN = 39;
const TIP = 54;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rad = (d: number) => (d * Math.PI) / 180;

const PAPER = "#efe6d2";
const RED = "#cf2f20";
const speckle = "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.16) 0 0.6px, rgba(0,0,0,0) 1px), radial-gradient(circle at 70% 60%, rgba(0,0,0,0.5) 0 0.7px, rgba(0,0,0,0) 1.1px), radial-gradient(circle at 45% 85%, rgba(255,255,255,0.1) 0 0.5px, rgba(0,0,0,0) 0.9px)";

export default function MatchboxPrintCard() {
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const state = useRef({ scale: 1, dragging: false, moved: 0, lastX: 0, lastY: 0, lastT: 0, vel: 0, paused: false, touched: false });

  const out = useSpring(0, { stiffness: 150, damping: 17, mass: 1.15 });
  const lift = useSpring(0, { stiffness: 90, damping: 11, mass: 1 });
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rz = useSpring(useTransform(px, (v) => TURN + v * 5), { stiffness: 60, damping: 14 });
  const rx = useSpring(useTransform(py, (v) => TIP - v * 4), { stiffness: 60, damping: 14 });

  const back = useTransform(out, (v) => -v);
  const mouthShade = useTransform(out, (v) => clamp(v / 50, 0, 1));
  const hinge = useTransform(lift, (v) => `translate3d(${W - HINGE}px, ${DP / 2}px, ${MATCH_Z + 5}px) rotateY(${(v * LIFT).toFixed(2)}deg)`);
  const cardShadow = useTransform(lift, (v) => 0.55 - clamp(v, 0, 1) * 0.3);
  const cardShadowX = useTransform(lift, (v) => clamp(v, 0, 1.2) * 34);
  const cardGloss = useTransform(lift, (v) => 0.1 + clamp(v, 0, 1) * 0.5);
  const tableShadowW = useTransform(out, (v) => (W + v + 44) / (W + 44));

  const slide = useCallback(
    (to: boolean) => {
      setOpen(to);
      if (reduce) {
        out.jump(to ? OUT : 0);
        lift.jump(to ? 1 : 0);
      } else out.set(to ? OUT : 0);
    },
    [lift, out, reduce],
  );

  // the print stands up once the drawer has cleared the sleeve, and lies down again as it goes back
  useEffect(() => out.on("change", (v) => !reduce && lift.set(v > OUT * 0.8 ? 1 : 0)), [lift, out, reduce]);

  useEffect(() => {
    if (reduce) {
      slide(true);
      return;
    }
    const s = state.current;
    let n = 0;
    const first = window.setTimeout(() => slide(true), 320);
    const loop = window.setInterval(() => {
      if (s.paused || s.touched || document.hidden) return;
      n += 1;
      slide(n % 4 !== 3);
    }, 1700);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
    };
  }, [reduce, slide]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    if (!wrap || !scene) return;
    const measure = () => {
      const sc = clamp(wrap.clientWidth / (SCENE_W - 40), 0.42, 1);
      state.current.scale = sc;
      wrap.style.height = `${Math.round(SCENE_H * sc + 84)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // dragging the drawer: project the pointer's movement onto the direction the drawer runs on screen
  const axis = useMemo(() => {
    const vx = Math.cos(rad(TURN));
    const vy = Math.sin(rad(TURN)) * Math.cos(rad(TIP));
    const len = Math.hypot(vx, vy);
    return { ux: vx / len, uy: vy / len, len };
  }, []);
  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const s = state.current;
    s.dragging = true;
    s.touched = true;
    s.moved = 0;
    s.vel = 0;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    s.lastT = performance.now();
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onDrag = (e: React.PointerEvent) => {
    const s = state.current;
    if (!s.dragging) return;
    const d = ((e.clientX - s.lastX) * axis.ux + (e.clientY - s.lastY) * axis.uy) / (axis.len * s.scale);
    const now = performance.now();
    s.vel = s.vel * 0.6 + (d / Math.max(1, now - s.lastT)) * 0.4;
    s.moved += Math.abs(d);
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    s.lastT = now;
    const raw = out.get() + d;
    // rubber band past either end
    out.jump(raw < 0 ? raw * 0.5 : raw > OUT ? OUT + (raw - OUT) * 0.35 : raw);
  };
  const onUp = () => {
    const s = state.current;
    if (!s.dragging) return;
    s.dragging = false;
    if (s.moved < 4) slide(!open);
    else slide(out.get() + s.vel * 260 > OUT / 2);
  };

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 2 - 1);
    py.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };

  const matches = useMemo(
    () =>
      Array.from({ length: 17 }, (_, i) => ({
        top: 6 + i * 13.4,
        shift: [0, 5, -3, 7, 2, -4, 6, 0, 4, -2, 8, 1, -5, 3, 6, -1, 4][i],
        tilt: [0.3, -0.5, 0.2, 0.6, -0.3, 0.1, -0.6, 0.4, 0, -0.2, 0.5, -0.4, 0.2, 0.3, -0.5, 0.1, -0.1][i],
      })),
    [],
  );

  const trayW = W - WALL * 2;
  const trayD = DP - WALL * 2;
  const kraft = "linear-gradient(180deg, #c9a878, #b08b58)";

  return (
    <section className="relative overflow-hidden bg-[#0f3a30]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(64% 60% at 44% 40%, #1f6a57 0%, #14493c 46%, #0b2b24 100%)" }} />
      <div
        ref={wrapRef}
        onPointerMove={onMove}
        onPointerEnter={() => (state.current.paused = true)}
        onPointerLeave={() => {
          state.current.paused = false;
          px.set(0);
          py.set(0);
        }}
        onFocus={() => (state.current.paused = true)}
        onBlur={() => (state.current.paused = false)}
        className="relative mx-auto w-full overflow-hidden"
        style={{ height: SCENE_H + 84 }}
      >
        <div ref={sceneRef} className="absolute left-1/2 top-0 select-none" style={{ width: SCENE_W, height: SCENE_H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "2600px", perspectiveOrigin: "50% 40%" }}>
          <motion.div className="absolute" style={{ left: SCENE_W / 2 - W / 2 - 118, top: SCENE_H / 2 - DP / 2 + 8, width: W, height: DP, transformStyle: "preserve-3d", transformOrigin: `${W / 2 + 118}px ${DP / 2}px`, rotateX: rx, rotateZ: rz }}>
            {/* shadow on the table: one under the sleeve, one that grows with the drawer */}
            <motion.div aria-hidden="true" className="absolute rounded-[10px] bg-black" style={{ left: -6, top: 4, width: W + 44, height: DP + 30, transformOrigin: "0 50%", scaleX: tableShadowW, filter: "blur(20px)", opacity: 0.5 }} />
            <div aria-hidden="true" className="absolute bg-black" style={{ left: 2, top: 2, width: W, height: DP + 4, filter: "blur(5px)", opacity: 0.55 }} />

            {/* the drawer */}
            <motion.div onPointerDown={onDown} onPointerMove={onDrag} onPointerUp={onUp} onPointerCancel={onUp} className="absolute left-0 top-0 cursor-grab touch-none active:cursor-grabbing" style={{ width: W, height: DP, transformStyle: "preserve-3d", x: out }}>
              <motion.div aria-hidden="true" className="absolute bg-black" style={{ left: WALL + 2, top: WALL + 2, width: trayW, height: trayD + 3, filter: "blur(5px)", opacity: mouthShade, transform: "translateZ(0.5px)" }} />
              {/* floor */}
              <div className="absolute" style={{ left: WALL, top: WALL, width: trayW, height: trayD, transform: "translateZ(3px)", background: "#2b1d10" }} />
              {/* far and near walls */}
              <div className="absolute" style={{ left: WALL, top: WALL - TRAY_H, width: trayW, height: TRAY_H, transformOrigin: "50% 100%", transform: "rotateX(-90deg)", background: "linear-gradient(180deg, #d9bb8b, #b6925c 60%, #7c5f37)" }} />
              <div className="absolute" style={{ left: WALL, top: DP - WALL - TRAY_H, width: trayW, height: TRAY_H, transformOrigin: "50% 100%", transform: "rotateX(-90deg)", background: kraft }}>
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.28) 0, rgba(255,255,255,0) 4px, rgba(0,0,0,0) 60%, rgba(0,0,0,0.3))" }} />
              </div>
              {/* inner and outer ends */}
              <div className="absolute" style={{ left: WALL - TRAY_H, top: WALL, width: TRAY_H, height: trayD, transformOrigin: "100% 50%", transform: "rotateY(90deg)", background: "#8a6a3f" }} />
              <div className="absolute overflow-hidden" style={{ left: W - WALL - TRAY_H, top: WALL, width: TRAY_H, height: trayD, transformOrigin: "100% 50%", transform: "rotateY(90deg)", background: RED }}>
                <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.3) 0, rgba(255,255,255,0.06) 5px, rgba(0,0,0,0) 55%, rgba(0,0,0,0.34))" }} />
                <div className="absolute left-1/2 top-1/2 whitespace-nowrap font-mono text-[9px] font-semibold uppercase tracking-[0.3em] text-[#fbe6c8]" style={{ transform: "translate(-50%,-50%) rotate(-90deg)" }}>
                  {box.number} / pull
                </div>
              </div>
              {/* bed of matches */}
              <div aria-hidden="true" className="absolute overflow-hidden" style={{ left: WALL + 1, top: WALL + 1, width: trayW - 2, height: trayD - 2, transform: `translateZ(${MATCH_Z}px)`, background: "repeating-linear-gradient(180deg, #5d4423 0 9px, #1e140a 9px 13.4px)" }}>
                {matches.map((m, i) => (
                  <div key={i} className="absolute h-[10.5px] rounded-[2px]" style={{ top: m.top, left: 14 + m.shift, width: trayW - 44, transform: `rotate(${m.tilt}deg)`, background: "linear-gradient(180deg, #f8e6bd 0%, #ecd09a 38%, #c9a568 78%, #9a7842 100%)", boxShadow: "0 3px 3px rgba(0,0,0,0.5)" }}>
                    <span className="absolute -right-[10px] -top-[2.5px] h-[15.5px] w-[27px] rounded-[50%]" style={{ background: "radial-gradient(60% 55% at 38% 30%, #ff9c8c 0%, #e2392b 34%, #b01d14 68%, #6d0e09 100%)", boxShadow: "0 2px 3px rgba(0,0,0,0.5)" }} />
                  </div>
                ))}
                {/* the dark inside of the sleeve falling across the matches */}
                <motion.div className="absolute inset-y-0" style={{ left: trayW - WALL - 4, width: 120, x: back, opacity: mouthShade, background: "linear-gradient(90deg, rgba(0,0,0,0.92), rgba(0,0,0,0.5) 22%, rgba(0,0,0,0.12) 60%, rgba(0,0,0,0))" }} />
              </div>
              {/* soft shadow under the print */}
              <motion.div aria-hidden="true" className="absolute bg-black" style={{ left: W - HINGE - CARD_L + 6, top: DP / 2 - CARD_W / 2 + 4, width: CARD_L - 4, height: CARD_W + 4, transform: `translateZ(${MATCH_Z + 1.5}px)`, x: cardShadowX, filter: "blur(9px)", opacity: cardShadow }} />
              {/* the print, hinged on the edge nearest you */}
              <motion.div className="absolute left-0 top-0" style={{ width: 0, height: 0, transformStyle: "preserve-3d", transform: hinge }}>
                <div className="absolute overflow-hidden rounded-[2px] bg-[#f7f4ed]" style={{ left: -CARD_L / 2 - CARD_W / 2, top: -CARD_L / 2, width: CARD_W, height: CARD_L, transform: "rotateZ(-90deg)", boxShadow: "0 0 0 0.5px rgba(0,0,0,0.25)" }}>
                  <div className="absolute overflow-hidden" style={{ left: 9, right: 9, top: 9, bottom: 34, background: box.print.tone }}>
                    <img src={box.print.src} alt={box.print.alt} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: box.print.focus }} />
                  </div>
                  <div className="absolute inset-x-[10px] bottom-[11px] flex items-baseline justify-between font-mono text-[7.5px] uppercase tracking-[0.18em] text-neutral-800">
                    <span className="font-semibold">{box.name}</span>
                    <span className="text-neutral-600">Print 1 of 1</span>
                  </div>
                  <motion.div aria-hidden="true" className="absolute inset-0" style={{ opacity: cardGloss, background: "linear-gradient(118deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 68%, rgba(0,0,0,0.18) 100%)" }} />
                </div>
              </motion.div>
            </motion.div>

            {/* the sleeve: long sides with striker strips, the rim of its mouth, and the printed top */}
            <div className="absolute" style={{ left: 0, top: -H, width: W, height: H, transformOrigin: "50% 100%", transform: "rotateX(-90deg)", background: "#b7ad98" }} />
            <div className="absolute overflow-hidden" style={{ left: 0, top: DP - H, width: W, height: H, transformOrigin: "50% 100%", transform: "rotateX(-90deg)", background: PAPER }}>
              <div className="absolute inset-x-0 bottom-[10px] top-[10px]" style={{ background: "#2f1c14", backgroundImage: speckle, backgroundSize: "7px 6px, 5px 7px, 9px 5px", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.6), inset 0 -1px 0 rgba(255,255,255,0.08)" }}>
                {/* scratches where matches have been struck */}
                <div className="absolute left-[18%] top-[30%] h-[2px] w-[90px] rounded-full bg-[#7b5a48]/50" style={{ transform: "rotate(-4deg)" }} />
                <div className="absolute left-[46%] top-[58%] h-[2px] w-[120px] rounded-full bg-[#7b5a48]/40" style={{ transform: "rotate(3deg)" }} />
                <div className="absolute left-[30%] top-[70%] h-px w-[70px] rounded-full bg-[#8a6a58]/50" style={{ transform: "rotate(-2deg)" }} />
              </div>
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0, rgba(255,255,255,0) 5px, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.16))" }} />
            </div>
            <div aria-hidden="true" className="absolute" style={{ left: W - H, top: 0, width: H, height: DP, transformOrigin: "100% 50%", transform: "rotateY(90deg)", borderStyle: "solid", borderColor: "#d8cdb4", borderWidth: "3px 3px 3px 0", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25)" }} />
            <button
              type="button"
              onClick={() => {
                state.current.touched = true;
                slide(!open);
              }}
              aria-expanded={open}
              aria-label={open ? `Slide the ${box.name} matchbox shut` : `Slide the ${box.name} matchbox open`}
              className="absolute left-0 top-0 block cursor-pointer overflow-hidden outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white"
              style={{ width: W, height: DP, transform: `translateZ(${H}px)`, background: PAPER }}
            >
              <span className="absolute overflow-hidden" style={{ left: 12, top: 12, right: 12, bottom: 44, background: box.cover.tone }}>
                <img src={box.cover.src} alt={box.cover.alt} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: box.cover.focus }} />
                <span className="absolute left-[12px] top-[10px] text-left text-[26px] font-black uppercase leading-[0.9] tracking-[-0.01em] text-[#fff6df]" style={{ textShadow: "0 1px 0 rgba(120,20,10,0.55)" }}>
                  {box.name}
                </span>
                <span className="absolute right-[10px] top-[10px] grid h-[38px] w-[38px] place-items-center rounded-full font-mono text-[9px] font-bold uppercase leading-none tracking-[0.06em] text-[#fff6df]" style={{ background: RED, boxShadow: "0 0 0 2px #fff6df inset" }}>
                  {box.number}
                </span>
              </span>
              <span className="absolute inset-x-[13px] bottom-[14px] flex items-center justify-between font-mono text-[8.5px] font-semibold uppercase tracking-[0.2em]" style={{ color: RED }}>
                <span>{box.line}</span>
                <span>Strike on box</span>
              </span>
              <span aria-hidden="true" className="absolute inset-[5px]" style={{ border: `1.5px solid ${RED}` }} />
              {/* paper sheen and the soft crease along each fold */}
              <span aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(124deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.05) 26%, rgba(255,255,255,0) 46%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.16) 100%)" }} />
              <span aria-hidden="true" className="absolute inset-0" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.4), inset 0 -3px 5px rgba(0,0,0,0.12), inset 0 3px 5px rgba(255,255,255,0.25)" }} />
            </button>
          </motion.div>
        </div>

        <p className="absolute bottom-5 left-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-emerald-100/80 sm:bottom-8 sm:left-8">
          <span className="text-white">
            {box.name} {box.number}
          </span>
          <span className="block">{open ? "Press the lid to slide it shut" : "Press the lid or drag the drawer"}</span>
        </p>
      </div>
    </section>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { ReactNode } from "react";

/** Everything printed on the carton and packed inside it. */
const parcel = {
  courier: "Fennick Parcel Co.",
  tape: "FENNICK PARCEL CO.  /  PACKED BY HAND  /  ",
  order: "Order 48-2217",
  to: ["Ines Calder", "14 Tannery Row", "Halewick HW3 9QT"],
  route: "HW3",
  bay: "07",
  item: "Fisherman rib jumper",
  detail: "Marigold lambswool, size M",
  maker: "Marrow Knitwear",
  photo: { src: "https://images.pexels.com/photos/1487703/pexels-photo-1487703.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Close view of a marigold yellow cable knit jumper", tone: "#d99413" },
};

// Design pixels in the carton's own space: x runs along it, y across it, z up off the table.
const W = 340;
const D = 236;
const H = 186;
const F = D / 2; // every flap is half the short side, as on a real regular slotted carton
const T = 5; // board thickness
const TAPE = 46; // tape width
const TAB = 58; // how far the tape runs down the end wall
const FILL = H - 42; // height of the packed contents
const SCENE_W = 900;
const SCENE_H = 600;
const TURN = 33;
const TIP = 54;
// resting angles of the four flaps when the box is open, in degrees from closed
const BACK_OPEN = 109;
const LEFT_OPEN = 116;
const FRONT_OPEN = 203;
const RIGHT_OPEN = 207;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const svg = (s: string) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;

// paper fibre for the kraft liner, and a crumpled sheet for the tissue
const fibre = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='f' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.9 0.32' numOctaves='3' seed='8' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.26  0 0 0 0 0.15  0 0 0 0 0.05  0 0 0 -1.5 0.94'/></filter><rect width='260' height='260' filter='url(#f)'/></svg>",
);
const mottle = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='m' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.012 0.02' numOctaves='3' seed='21' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 0.9  0 0 0 0 0.72  0 0 0 -0.7 0.36'/></filter><rect width='400' height='400' filter='url(#m)'/></svg>",
);
const crumple = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' width='340' height='340'><filter id='t' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.022 0.03' numOctaves='4' seed='5'/><feDiffuseLighting surfaceScale='5.5' diffuseConstant='1.16' lighting-color='#fffdf7'><feDistantLight azimuth='220' elevation='58'/></feDiffuseLighting></filter><rect width='340' height='340' filter='url(#t)'/></svg>",
);

const KRAFT = "#c39a64";
const KRAFT_IN = "#c9a26d";
const INK = "#4a3015";
const RED = "#c5311f";
const TAPE_PAPER = "#efe6d3";
const flutesX = "repeating-linear-gradient(90deg, rgba(255,240,214,0.07) 0 3.5px, rgba(60,34,8,0.07) 3.5px 7px)";
const flutesY = "repeating-linear-gradient(180deg, rgba(255,240,214,0.07) 0 3.5px, rgba(60,34,8,0.07) 3.5px 7px)";
const cutEdgeX = "linear-gradient(180deg, #e2c598 0 1px, rgba(0,0,0,0) 1px 4px, #a98250 4px), repeating-linear-gradient(90deg, #7d5c33 0 1px, #d6b684 1px 2.6px, #9c7747 2.6px 4px)";
const cutEdgeY = "linear-gradient(90deg, #e2c598 0 1px, rgba(0,0,0,0) 1px 4px, #a98250 4px), repeating-linear-gradient(180deg, #7d5c33 0 1px, #d6b684 1px 2.6px, #9c7747 2.6px 4px)";

const board = (ribs: string, base = KRAFT) => ({ backgroundColor: base, backgroundImage: `${ribs}, ${fibre}, ${mottle}`, backgroundSize: "auto, 260px 260px, 400px 400px" });

const barcode = [2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 1, 3, 2, 1, 2, 1, 1, 3, 1, 2, 1, 2, 3, 1, 1, 2, 1];

/** One flap with real thickness: printed outside, plain inside and a fluted cut edge all round. */
function Flap({ w, h, ribs, shade, children }: { w: number; h: number; ribs: string; shade: string; children?: ReactNode }) {
  return (
    <>
      <div className="absolute left-0 top-0 overflow-hidden" style={{ width: w, height: h, backfaceVisibility: "hidden", ...board(ribs) }}>
        {children}
        <div className="absolute inset-0" style={{ background: "linear-gradient(128deg, rgba(255,246,226,0.2) 0%, rgba(255,246,226,0) 42%, rgba(40,22,4,0.1) 100%)", boxShadow: "inset 0 0 0 1px rgba(90,58,22,0.28), inset 0 0 14px rgba(90,58,22,0.14)" }} />
      </div>
      <div className="absolute left-0 top-0" style={{ width: w, height: h, transform: `translateZ(${-T}px)`, ...board(ribs, KRAFT_IN) }}>
        <div className="absolute inset-0" style={{ background: shade, boxShadow: "inset 0 0 0 1px rgba(90,58,22,0.3)" }} />
      </div>
      <div className="absolute left-0 top-0" style={{ width: w, height: T, transformOrigin: "50% 0", transform: "rotateX(-90deg)", background: cutEdgeX }} />
      <div className="absolute left-0" style={{ top: h - T, width: w, height: T, transformOrigin: "50% 100%", transform: "rotateX(90deg)", background: cutEdgeX }} />
      <div className="absolute left-0 top-0" style={{ width: T, height: h, transformOrigin: "0 50%", transform: "rotateY(90deg)", background: cutEdgeY }} />
      <div className="absolute top-0" style={{ left: w - T, width: T, height: h, transformOrigin: "100% 50%", transform: "rotateY(-90deg)", background: cutEdgeY }} />
    </>
  );
}

function TapePrint({ flip = false }: { flip?: boolean }) {
  return (
    <span className="absolute inset-0 overflow-hidden" style={{ backgroundColor: TAPE_PAPER, backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.5) 0 10%, rgba(255,255,255,0) 34%, rgba(90,60,20,0.1) 100%), ${fibre}`, backgroundSize: "auto, 200px 200px" }}>
      <span className="absolute inset-x-0 top-[5px] h-px" style={{ background: RED, opacity: 0.85 }} />
      <span className="absolute inset-x-0 bottom-[5px] h-px" style={{ background: RED, opacity: 0.85 }} />
      <span className="absolute left-0 top-1/2 block whitespace-nowrap font-mono text-[10.5px] font-bold uppercase leading-none tracking-[0.2em]" style={{ color: RED, transform: `translateY(-50%)${flip ? " rotate(180deg)" : ""}` }}>
        {parcel.tape.repeat(4)}
      </span>
    </span>
  );
}

export default function CardboardParcelUnboxing() {
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  const timers = useRef<number[]>([]);
  const state = useRef({ paused: false, touched: false });

  const flapSpring = { stiffness: 62, damping: 9.5, mass: 1 };
  const peel = useMotionValue(1); // 0 = taped shut, 1 = tape off
  const fBack = useSpring(1, flapSpring);
  const fFront = useSpring(0.9, { stiffness: 54, damping: 8.5, mass: 1.1 });
  const fLeft = useSpring(1, flapSpring);
  const fRight = useSpring(1, { stiffness: 58, damping: 8.5, mass: 1 });
  const tissue = useSpring(0.5, { stiffness: 46, damping: 12 });
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rz = useSpring(useTransform(px, (v) => TURN + v * 5), { stiffness: 50, damping: 14 });
  const rx = useSpring(useTransform(py, (v) => TIP - v * 3.5), { stiffness: 50, damping: 14 });

  const backT = useTransform(fBack, (v) => `translateZ(${H + T}px) rotateX(${(v * BACK_OPEN).toFixed(2)}deg)`);
  const frontT = useTransform(fFront, (v) => `translateZ(${H + T}px) rotateX(${(-v * FRONT_OPEN).toFixed(2)}deg)`);
  const leftT = useTransform(fLeft, (v) => `translateZ(${H}px) rotateY(${(-v * LEFT_OPEN).toFixed(2)}deg)`);
  const rightT = useTransform(fRight, (v) => `translateZ(${H}px) rotateY(${(v * RIGHT_OPEN).toFixed(2)}deg)`);
  const frontShade = useTransform(fFront, (v) => clamp((v - 0.55) * 2.2, 0, 1));
  const rightShade = useTransform(fRight, (v) => clamp((v - 0.55) * 2.2, 0, 1));
  const inside = useTransform(fBack, (v) => clamp(v * 3, 0, 1));

  // the tape: a strip stuck across the seam whose free end lifts, folds back and curls as it is pulled
  const stuck = useTransform(peel, (p) => `inset(0 ${(clamp((p - 0.14) / 0.86, 0, 1) * 100).toFixed(2)}% 0 0)`);
  const tailT = useTransform(peel, (p) => {
    const q = clamp((p - 0.14) / 0.86, 0, 1);
    const a = 90 - clamp(p / 0.3, 0, 1) * 222;
    return `translate3d(${(W * (1 - q) + (p < 0.14 ? 1 : 0)).toFixed(1)}px, ${D / 2 - TAPE / 2}px, ${H + T + 1}px) rotateY(${a.toFixed(1)}deg)`;
  });
  const tailW = useTransform(peel, (p) => clamp(TAB + W * clamp((p - 0.14) / 0.86, 0, 1), TAB, 132));
  const curlT = useTransform(peel, (p) => `rotateY(${(-clamp((p - 0.08) / 0.3, 0, 1) * 52).toFixed(1)}deg)`);
  const tailO = useTransform(peel, (p) => clamp((0.99 - p) / 0.07, 0, 1));
  const offO = useTransform(peel, (p) => clamp((p - 0.9) / 0.1, 0, 1));
  const partL = useTransform(tissue, (v) => `translateZ(${FILL + 5}px) rotateY(${(-v * 30).toFixed(1)}deg) scaleX(${(1 - v * 0.68).toFixed(3)})`);
  const partR = useTransform(tissue, (v) => `translateZ(${FILL + 6}px) rotateY(${(v * 30).toFixed(1)}deg) scaleX(${(1 - v * 0.66).toFixed(3)})`);

  const play = useCallback(
    (to: boolean) => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      setOpen(to);
      if (reduce) {
        [fBack, fFront, fLeft, fRight, tissue].forEach((m) => m.jump(to ? 1 : 0));
        peel.set(to ? 1 : 0);
        return;
      }
      const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
      if (to) {
        animate(peel, 1, { duration: 1.05, ease: [0.35, 0, 0.25, 1] });
        at(900, () => fBack.set(1));
        at(1040, () => fFront.set(1));
        at(1380, () => fLeft.set(1));
        at(1480, () => fRight.set(1));
        at(1900, () => tissue.set(1));
      } else {
        tissue.set(0);
        at(380, () => fLeft.set(0));
        at(470, () => fRight.set(0));
        at(980, () => fBack.set(0));
        at(1120, () => fFront.set(0));
        at(1900, () => animate(peel, 0, { duration: 0.95, ease: [0.3, 0, 0.2, 1] }));
      }
    },
    [fBack, fFront, fLeft, fRight, peel, reduce, tissue],
  );

  // self-playing demo: start packed open, then seal it and cut it open again until someone takes over
  useEffect(() => {
    if (reduce) {
      fFront.jump(1);
      tissue.jump(1);
      return;
    }
    // the last of the unpacking settles as the page loads
    fFront.set(1);
    tissue.set(1);
    const s = state.current;
    let shut = false;
    let id = window.setTimeout(function tick() {
      if (s.touched) return;
      if (!s.paused && !document.hidden) {
        shut = !shut;
        play(!shut);
      }
      id = window.setTimeout(tick, shut ? 4300 : 6400);
    }, 3700);
    return () => {
      window.clearTimeout(id);
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, [fFront, play, reduce, tissue]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    if (!wrap || !scene) return;
    const measure = () => {
      const sc = clamp(wrap.clientWidth / (SCENE_W - 60), 0.42, 1.16);
      wrap.style.height = `${Math.round(SCENE_H * sc + 70)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const toggle = () => {
    state.current.touched = true;
    play(!open);
  };
  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 2 - 1);
    py.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };

  const p3 = "preserve-3d" as const;

  return (
    <section className="relative overflow-hidden bg-[#1b3140]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(62% 58% at 46% 46%, #3d6278 0%, #264557 44%, #152733 100%)" }} />
      <div
        ref={wrapRef}
        onPointerMove={onMove}
        onPointerEnter={() => (state.current.paused = true)}
        onPointerLeave={() => {
          state.current.paused = false;
          px.set(0);
          py.set(0);
        }}
        className="relative mx-auto w-full overflow-hidden"
        style={{ height: SCENE_H + 70 }}
      >
        <div ref={sceneRef} onClick={toggle} className="absolute left-1/2 top-0 cursor-pointer select-none" style={{ width: SCENE_W, height: SCENE_H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "2800px", perspectiveOrigin: "50% 36%" }}>
          <motion.div aria-hidden={false} className="absolute" style={{ left: SCENE_W / 2 - W / 2 + 6, top: SCENE_H / 2 - D / 2 + 92, width: W, height: D, transformStyle: p3, rotateX: rx, rotateZ: rz }}>
            {/* shadows on the table */}
            <div aria-hidden="true" className="absolute rounded-[30px] bg-black" style={{ left: -4, top: 6, width: W + 120, height: D + 96, filter: "blur(30px)", opacity: 0.5 }} />
            <div aria-hidden="true" className="absolute bg-black" style={{ left: 3, top: 3, width: W + 6, height: D + 6, filter: "blur(6px)", opacity: 0.6 }} />

            {/* the strip of tape after it has been pulled off, lying on the table */}
            <motion.div aria-hidden="true" className="absolute" style={{ left: W + 30, top: D - 50, width: 176, height: TAPE, opacity: offO, transform: "translateZ(1px) rotate(-64deg)" }}>
              <div className="absolute inset-0 bg-black" style={{ filter: "blur(6px)", opacity: 0.5, transform: "translate(5px, 7px)" }} />
              <div className="absolute inset-0 overflow-hidden rounded-[1px]">
                <TapePrint />
                <span className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(255,255,255,0.3) 14%, rgba(0,0,0,0.12) 34%, rgba(255,255,255,0.26) 52%, rgba(0,0,0,0.16) 76%, rgba(255,255,255,0.22) 90%, rgba(0,0,0,0.24) 100%)" }} />
              </div>
            </motion.div>

            {/* floor, then the two inside walls */}
            <div className="absolute" style={{ left: 0, top: 0, width: W, height: D, transform: "translateZ(2px)", background: "#6f5231" }} />
            <div className="absolute" style={{ left: 0, top: -H, width: W, height: H, transformOrigin: "50% 100%", transform: "rotateX(-90deg)", ...board(flutesX, KRAFT_IN) }}>
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,244,222,0.16) 0%, rgba(60,36,10,0.08) 22%, rgba(40,22,4,0.5) 100%), linear-gradient(90deg, rgba(40,22,4,0.4) 0%, rgba(40,22,4,0) 34%)" }} />
            </div>
            <div className="absolute" style={{ left: -H, top: 0, width: H, height: D, transformOrigin: "100% 50%", transform: "rotateY(90deg)", ...board(flutesY, "#b08955") }}>
              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(40,22,4,0.1) 0%, rgba(40,22,4,0.22) 26%, rgba(30,16,2,0.62) 100%)" }} />
            </div>

            {/* what is packed inside */}
            <motion.div className="absolute" style={{ left: 3, top: 3, width: W - 6, height: D - 6, transform: `translateZ(${FILL}px)`, opacity: inside, backgroundColor: parcel.photo.tone }}>
              <img src={parcel.photo.src} alt={parcel.photo.alt} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
              <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(40,18,0,0.62) 0%, rgba(40,18,0,0.16) 22%, rgba(40,18,0,0) 44%), linear-gradient(180deg, rgba(40,18,0,0.6) 0%, rgba(40,18,0,0.12) 26%, rgba(40,18,0,0) 48%), linear-gradient(0deg, rgba(40,18,0,0.2) 0%, rgba(40,18,0,0) 14%)" }} />
              {/* the fold of the jumper and the paper band round it */}
              <div aria-hidden="true" className="absolute inset-y-0" style={{ left: "72%", width: 26, background: "linear-gradient(90deg, rgba(60,28,0,0) 0%, rgba(60,28,0,0.34) 46%, rgba(255,226,150,0.3) 56%, rgba(255,226,150,0) 100%)" }} />
              <div className="absolute inset-y-0 overflow-hidden" style={{ left: "30%", width: 104, backgroundColor: "#f3ecdc", backgroundImage: fibre, backgroundSize: "220px 220px", boxShadow: "0 0 0 0.5px rgba(60,36,10,0.4), 5px 4px 9px rgba(50,24,0,0.5)" }}>
                <div className="absolute inset-x-0 top-0 h-[38%]" style={{ background: "linear-gradient(180deg, rgba(40,18,0,0.4), rgba(40,18,0,0))" }} />
                <div className="absolute left-1/2 top-[56%] w-[92px] -translate-x-1/2 -translate-y-1/2 text-center" style={{ color: INK }}>
                  <div className="mx-auto mb-[7px] grid h-[26px] w-[26px] place-items-center rounded-full text-[13px] font-black leading-none" style={{ border: `1.5px solid ${INK}` }}>
                    M
                  </div>
                  <div className="text-[11px] font-black uppercase leading-[1.05] tracking-[0.08em]">{parcel.maker}</div>
                  <div className="mx-auto my-[5px] h-px w-[40px]" style={{ background: INK }} />
                  <div className="font-mono text-[6.5px] uppercase leading-[1.5] tracking-[0.14em]">{parcel.item}</div>
                  <div className="font-mono text-[6.5px] uppercase leading-[1.5] tracking-[0.14em]">{parcel.detail}</div>
                </div>
              </div>
            </motion.div>
            {/* two sheets of tissue that part and bunch against the ends */}
            <motion.div aria-hidden="true" className="absolute" style={{ left: 4, top: 4, width: W / 2 + 6, height: D - 8, transformOrigin: "0 50%", transform: partL, opacity: inside, backgroundColor: "#f6f1e6", backgroundImage: crumple, backgroundSize: "300px 300px", boxShadow: "4px 3px 10px rgba(50,24,0,0.45)" }}>
              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(60,34,8,0.42) 0%, rgba(60,34,8,0) 30%), linear-gradient(180deg, rgba(60,34,8,0.4) 0%, rgba(60,34,8,0) 30%)" }} />
            </motion.div>
            <motion.div aria-hidden="true" className="absolute" style={{ left: W / 2 - 10, top: 4, width: W / 2 + 6, height: D - 8, transformOrigin: "100% 50%", transform: partR, opacity: inside, backgroundColor: "#f8f3e8", backgroundImage: crumple, backgroundSize: "300px 300px", backgroundPosition: "120px 70px", boxShadow: "-4px 3px 10px rgba(50,24,0,0.45)" }}>
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(60,34,8,0.36) 0%, rgba(60,34,8,0) 28%)" }} />
            </motion.div>

            {/* front wall, printed with handling marks */}
            <div className="absolute overflow-hidden" style={{ left: 0, top: D - H, width: W, height: H, transformOrigin: "50% 100%", transform: "rotateX(-90deg)", ...board(flutesX) }}>
              <div className="absolute bottom-[18px] left-[20px] flex items-end gap-[12px]" style={{ color: INK, opacity: 0.82 }}>
                <svg aria-hidden="true" viewBox="0 0 150 46" className="h-[46px] w-[150px]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
                  <rect x="1.5" y="1.5" width="43" height="43" />
                  <path d="M15 37V13M9 19l6-7 6 7M30 37V13M24 19l6-7 6 7M8 40h30" />
                  <rect x="53.5" y="1.5" width="43" height="43" />
                  <path d="M66 9h18l-2 12a7 7 0 0 1-14 0zM75 28v9M68 38h14" />
                  <rect x="105.5" y="1.5" width="43" height="43" />
                  <path d="M113 24a14 14 0 0 1 28 0zM127 24v11a4 4 0 0 1-8 0M127 7v3" />
                </svg>
                <div className="pb-[1px] font-mono text-[8px] font-bold uppercase leading-[1.45] tracking-[0.2em]">
                  <div>This way up</div>
                  <div>Fragile, keep dry</div>
                  <div className="opacity-70">Board 32 ECT / single wall</div>
                </div>
              </div>
              <div className="absolute right-[18px] top-[20px] text-right text-[21px] font-black uppercase leading-[0.9] tracking-[0.02em]" style={{ color: INK, opacity: 0.8 }}>
                Fennick
                <div className="mt-[4px] font-mono text-[7.5px] font-bold tracking-[0.34em]">Parcel Co.</div>
              </div>
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,244,222,0.22) 0, rgba(255,244,222,0) 6px, rgba(40,22,4,0) 55%, rgba(40,22,4,0.2) 100%), linear-gradient(90deg, rgba(255,244,222,0.08), rgba(40,22,4,0.08))", boxShadow: "inset 0 0 0 1px rgba(90,58,22,0.3)" }} />
              <motion.div aria-hidden="true" className="absolute inset-x-0 top-0 h-[78%]" style={{ opacity: frontShade, background: "linear-gradient(180deg, rgba(30,16,2,0.6) 0%, rgba(30,16,2,0.42) 62%, rgba(30,16,2,0) 100%)" }} />
            </div>

            {/* right end wall */}
            <div className="absolute overflow-hidden" style={{ left: W - H, top: 0, width: H, height: D, transformOrigin: "100% 50%", transform: "rotateY(90deg)", ...board(flutesY, "#a98150") }}>
              <div className="absolute left-0" style={{ top: D, width: D, height: H, transformOrigin: "0 0", transform: "rotate(-90deg)" }}>
                <div className="absolute bottom-[20px] left-[22px] px-[9px] py-[6px] text-center text-white" style={{ background: RED, transform: "rotate(-3deg)", boxShadow: "0 0 0 2px #f6efe2, 1px 2px 3px rgba(40,22,4,0.4)" }}>
                  <div className="text-[15px] font-black uppercase leading-none tracking-[0.12em]">Fragile</div>
                  <div className="mt-[3px] font-mono text-[6px] font-bold uppercase leading-none tracking-[0.2em]">Handle with care</div>
                </div>
                <div className="absolute bottom-[22px] right-[20px] font-mono text-[7px] font-bold uppercase leading-[1.5] tracking-[0.2em]" style={{ color: INK, opacity: 0.75 }}>
                  <div>Gross 0.9 kg</div>
                  <div>34 x 24 x 19 cm</div>
                </div>
              </div>
              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(255,244,222,0.14) 0, rgba(255,244,222,0) 6px, rgba(40,22,4,0.1) 50%, rgba(40,22,4,0.34) 100%)", boxShadow: "inset 0 0 0 1px rgba(90,58,22,0.3)" }} />
              <motion.div aria-hidden="true" className="absolute inset-y-0 left-0 w-[76%]" style={{ opacity: rightShade, background: "linear-gradient(90deg, rgba(30,16,2,0.55) 0%, rgba(30,16,2,0.36) 62%, rgba(30,16,2,0) 100%)" }} />
            </div>

            {/* the two short flaps, folded in first */}
            <motion.div className="absolute left-0 top-0" style={{ width: F, height: D, transformStyle: p3, transformOrigin: "0 50%", transform: leftT }}>
              <Flap w={F} h={D} ribs={flutesY} shade="linear-gradient(90deg, rgba(40,22,4,0.3) 0%, rgba(255,244,222,0.12) 30%, rgba(255,244,222,0.2) 100%)" />
            </motion.div>
            <motion.div className="absolute top-0" style={{ left: W - F, width: F, height: D, transformStyle: p3, transformOrigin: "100% 50%", transform: rightT }}>
              <Flap w={F} h={D} ribs={flutesY} shade="linear-gradient(270deg, rgba(40,22,4,0.24) 0%, rgba(255,244,222,0.06) 26%, rgba(255,244,222,0.16) 100%)" />
            </motion.div>

            {/* the two long flaps that meet under the tape */}
            <motion.div className="absolute left-0 top-0" style={{ width: W, height: F, transformStyle: p3, transformOrigin: "50% 0", transform: backT }}>
              <Flap w={W} h={F} ribs={flutesX} shade="linear-gradient(180deg, rgba(40,22,4,0.3) 0%, rgba(255,244,222,0.14) 28%, rgba(255,244,222,0.26) 100%)">
                <div className="absolute left-[22px] top-[20px] font-mono text-[8px] font-bold uppercase leading-[1.5] tracking-[0.22em]" style={{ color: INK, opacity: 0.8 }}>
                  <div>Open this side</div>
                  <div className="opacity-70">Pull the tape, do not cut</div>
                </div>
                <div className="absolute right-[24px] top-[16px] grid h-[58px] w-[58px] place-items-center rounded-full text-center font-mono text-[6.5px] font-bold uppercase leading-[1.35] tracking-[0.14em]" style={{ color: INK, opacity: 0.72, border: `1.5px solid ${INK}`, transform: "rotate(-9deg)" }}>
                  <span>
                    Packed
                    <br />
                    <span className="text-[13px] font-black tracking-normal">No. 12</span>
                    <br />
                    Halewick
                  </span>
                </div>
              </Flap>
            </motion.div>
            <motion.div className="absolute left-0" style={{ top: D - F, width: W, height: F, transformStyle: p3, transformOrigin: "50% 100%", transform: frontT }}>
              <Flap w={W} h={F} ribs={flutesX} shade="linear-gradient(0deg, rgba(40,22,4,0.2) 0%, rgba(255,244,222,0.1) 26%, rgba(255,244,222,0.22) 100%)">
                {/* the courier's label */}
                <div className="absolute overflow-hidden rounded-[2px] bg-[#fbfaf5] text-neutral-900" style={{ left: 22, top: 30, width: 176, height: 78, transform: "rotate(-1.4deg)", boxShadow: "0 0 0 0.5px rgba(40,22,4,0.4), 1px 2px 2px rgba(40,22,4,0.3)" }}>
                  <div className="absolute left-[7px] top-[6px] bg-neutral-900 px-[5px] py-[3px] text-[8px] font-black uppercase leading-none tracking-[0.12em] text-white">Fennick</div>
                  <div className="absolute left-[62px] top-[8px] font-mono text-[5.5px] font-bold uppercase leading-none tracking-[0.16em]">Tracked 48</div>
                  <div className="absolute left-[7px] top-[23px] font-mono text-[6px] font-semibold uppercase leading-[1.42] tracking-[0.06em]">
                    {parcel.to.map((l) => (
                      <div key={l}>{l}</div>
                    ))}
                  </div>
                  <div className="absolute bottom-[6px] left-[7px] flex h-[19px] items-stretch gap-[1px]">
                    {barcode.map((b, i) => (
                      <span key={i} className={i % 2 ? "" : "bg-neutral-900"} style={{ width: b * 1.15 }} />
                    ))}
                  </div>
                  <div className="absolute inset-y-0 right-0 w-[58px] border-l border-neutral-900 text-center">
                    <div className="mt-[9px] text-[22px] font-black leading-none tracking-[-0.02em]">{parcel.route}</div>
                    <div className="mx-auto mt-[6px] w-[40px] bg-neutral-900 py-[3px] text-[13px] font-black leading-none text-white">{parcel.bay}</div>
                    <div className="mt-[6px] font-mono text-[5px] font-bold uppercase leading-none tracking-[0.16em]">Bay</div>
                  </div>
                </div>
              </Flap>
            </motion.div>

            {/* tape across the seam */}
            <motion.div aria-hidden="true" className="absolute left-0" style={{ top: D / 2 - TAPE / 2, width: W, height: TAPE, transform: `translateZ(${H + T + 0.8}px)`, clipPath: stuck }}>
              <TapePrint />
              <span className="absolute inset-0" style={{ boxShadow: "inset 0 0 0 0.5px rgba(90,58,22,0.4)", background: "linear-gradient(180deg, rgba(0,0,0,0) 46%, rgba(60,34,8,0.2) 49.5%, rgba(255,255,255,0.3) 51%, rgba(0,0,0,0) 54%)" }} />
            </motion.div>
            <motion.div aria-hidden="true" className="absolute left-0 top-0" style={{ width: tailW, height: TAPE, transformStyle: p3, transformOrigin: "0 50%", transform: tailT, opacity: tailO }}>
              <span className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                <TapePrint />
              </span>
              <span className="absolute inset-0" style={{ transform: "translateZ(-0.6px)", background: "linear-gradient(90deg, #cfc2a4 0%, #e9dfc8 30%, #f7f0df 62%, #d8ccb0 100%)", boxShadow: "inset 0 0 0 0.5px rgba(90,58,22,0.35)" }} />
              <motion.span className="absolute top-0 block" style={{ left: "100%", width: 44, height: TAPE, transformOrigin: "0 50%", transform: curlT, background: "linear-gradient(90deg, #d8ccb0 0%, #f7f0df 44%, #c9bc9c 100%)", boxShadow: "inset 0 0 0 0.5px rgba(90,58,22,0.35)" }} />
            </motion.div>
          </motion.div>
        </div>

        <p className="pointer-events-none absolute bottom-7 left-4 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-sky-100/80 sm:bottom-8 sm:left-8">
          <span className="text-white">{parcel.order}</span>
          <span className="hidden sm:block">
            {parcel.item}, {parcel.courier}
          </span>
        </p>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={open}
          className="absolute bottom-4 right-4 min-h-[44px] rounded-full bg-[#f3ecdc] px-5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#1b3140] shadow-[0_6px_16px_rgba(0,0,0,0.35)] outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-white/80 active:translate-y-0 motion-reduce:transition-none sm:bottom-7 sm:right-8"
        >
          {open ? "Tape it shut" : "Open the box"}
        </button>
      </div>
    </section>
  );
}

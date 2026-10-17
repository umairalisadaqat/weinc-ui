import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";

/** The set on the shelf. One volume per chapter: change words, cloth, foil and plate here. */
const series = "The Studio Handbook";
const volumes = [
  { no: "01", title: "Red Ground", line: "Choosing one colour and letting it fill the frame.", cloth: "#1f5759", foil: "gold", end: "#d8452c", t: 52, h: 372, d: 244, photo: "https://images.pexels.com/photos/13023364/pexels-photo-13023364.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "A pale flower in a blue glass bottle against a red wall", tone: "#c9483b", focus: "50% 40%" },
  { no: "02", title: "Tall Grasses", line: "Dried stems, a low table and a long afternoon.", cloth: "#d8cdb3", foil: "ink", end: "#a9502a", t: 42, h: 340, d: 232, photo: "https://images.pexels.com/photos/9956158/pexels-photo-9956158.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Dried foxtail lilies standing on a white table in front of a burnt orange wall", tone: "#7a3513", focus: "50% 50%" },
  { no: "03", title: "Yellow Room", line: "Still life with glass, oranges and one hard light.", cloth: "#1e2947", foil: "gold", end: "#e2b621", t: 62, h: 392, d: 250, photo: "https://images.pexels.com/photos/39780460/pexels-photo-39780460.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Glass vase of dried flowers and orange balls on a mirrored table against a yellow wall", tone: "#c9a514", focus: "50% 55%" },
  { no: "04", title: "Hard Shadow", line: "Buildings at noon, when the sun draws the lines.", cloth: "#c7932a", foil: "ink", end: "#2c55a6", t: 46, h: 356, d: 238, photo: "https://images.pexels.com/photos/3068581/pexels-photo-3068581.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Yellow building wall cut by a deep black diagonal shadow", tone: "#e0a01c", focus: "40% 50%" },
  { no: "05", title: "Blue Door", line: "White walls, a strip of sky and a painted door.", cloth: "#b5502e", foil: "pearl", end: "#3c7ccb", t: 68, h: 384, d: 250, photo: "https://images.pexels.com/photos/16615603/pexels-photo-16615603.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "White and blue modern facade with an orange door under a clear sky", tone: "#7fb2e6", focus: "60% 50%" },
  { no: "06", title: "Night Vase", line: "One lamp, a dark room and a green glass vase.", cloth: "#27503a", foil: "gold", end: "#ae1630", t: 44, h: 332, d: 228, photo: "https://images.pexels.com/photos/36174582/pexels-photo-36174582.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Wavy green glass vase holding red flowers against a black background", tone: "#0c1410", focus: "50% 45%" },
  { no: "07", title: "Red Veil", line: "Portraits through tulle, lit from one side.", cloth: "#2b2927", foil: "copper", end: "#c0181d", t: 58, h: 366, d: 244, photo: "https://images.pexels.com/photos/31167809/pexels-photo-31167809.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in dramatic make-up wrapped in red tulle against a black backdrop", tone: "#6d0f10", focus: "50% 25%" },
  { no: "08", title: "One Stem", line: "A single flower and nothing else on the table.", cloth: "#c58c84", foil: "pearl", end: "#e2761c", t: 48, h: 348, d: 236, photo: "https://images.pexels.com/photos/8801127/pexels-photo-8801127.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Orange gerbera daisy in a matching orange vase on a pale grey background", tone: "#cfcfcd", focus: "50% 40%" },
];
type Volume = (typeof volumes)[number];
type Pose = "in" | "out" | "open";

const FOIL: Record<string, string> = {
  gold: "linear-gradient(100deg, #8e6c22 0%, #f6e29a 22%, #b98f30 45%, #fff3bd 62%, #a37c27 80%, #e9cf7c 100%)",
  copper: "linear-gradient(100deg, #7d4426 0%, #f0b48c 24%, #a85f38 46%, #ffd3b3 64%, #8c4d2c 82%, #dd9a72 100%)",
  pearl: "linear-gradient(100deg, #d9d2c2 0%, #fffdf6 30%, #e2dccd 55%, #ffffff 72%, #d6cfbe 100%)",
  ink: "linear-gradient(100deg, #1c1916 0%, #33302b 50%, #1c1916 100%)",
};

// Two layouts in the scene's own pixels: one long shelf, or (on narrow screens) a display shelf above the row.
const WIDE = { W: 1000, H: 650, shelfY: 520, rowX: 84, dispY: 520, closedX: 706, openX: 742, eye: "50% -12%" };
const TALL = { W: 500, H: 1066, shelfY: 930, rowX: 22, dispY: 462, closedX: 128, openX: 224, eye: "50% 26%" };
type Layout = typeof WIDE;
const LANE = 292; // how far a volume is pulled forward before it travels along the shelf
const SHELF_BACK = 284; // distance from the spines to the wall
const RY_OUT = -63;
const RY_OPEN = -77;
const AJAR = 87; // cover angle while standing closed (90 is shut)
const COVER_OPEN = -56;
const WALL = "#e6e0d4";
const PAPER = "#f3ecda";
const weave = "repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0 1px, rgba(0,0,0,0) 1px 2px), repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0 1px, rgba(0,0,0,0) 1px 2px)";
const grain = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 -0.08'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\")";
const fibre = grain.replace("0.5 -0.08", "0.16 -0.02");
const foilText = (kind: string) => ({ backgroundImage: FOIL[kind], WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }) as const;

function rest(pose: Pose, L: Layout, x0: number) {
  if (pose === "in") return { x: 0, y: 0, z: 0, rx: 0, ry: 0, cv: 90 };
  const open = pose === "open";
  return { x: (open ? L.openX : L.closedX) - x0, y: L.dispY - L.shelfY, z: -22, rx: 0, ry: open ? RY_OPEN : RY_OUT, cv: open ? COVER_OPEN : AJAR };
}

function Book({ v, x0, L, pose, lean, wait, reduce, onPick, onCover }: { v: Volume; x0: number; L: Layout; pose: Pose; lean: boolean; wait: number; reduce: boolean; onPick: () => void; onCover: () => void }) {
  const start = rest(pose, L, x0);
  const x = useMotionValue(start.x);
  const y = useMotionValue(start.y);
  const z = useMotionValue(start.z);
  const rx = useMotionValue(start.rx);
  const ry = useMotionValue(start.ry);
  const cv = useMotionValue(start.cv);
  const [hover, setHover] = useState(false);
  const prev = useRef({ pose, L });
  const running = useRef<{ stop: () => void }[]>([]);

  useEffect(() => {
    const was = prev.current;
    prev.current = { pose, L };
    const to = rest(pose, L, x0);
    const all: [MotionValue<number>, number][] = [[x, to.x], [y, to.y], [z, to.z], [rx, to.rx], [ry, to.ry], [cv, to.cv]];
    running.current.forEach((a) => a.stop());
    running.current = [];
    if (reduce || was.L !== L || was.pose === pose) {
      all.forEach(([m, val]) => m.set(val));
      return;
    }
    const run = (m: MotionValue<number>, keys: number[], opts: object) => running.current.push(animate(m, [m.get(), ...keys], opts));
    if (was.pose === "in") {
      // tip the top of the spine forward, pull the volume clear of the row, carry it along, stand it down turned
      const o = { duration: 1.15, times: [0, 0.14, 0.42, 0.8, 1], ease: "easeInOut", delay: wait } as const;
      run(rx, [-9, 0, 0, 0], o);
      run(z, [28, LANE, LANE, to.z], o);
      run(x, [0, 0, to.x, to.x], o);
      run(y, [0, 0, to.y, to.y], o);
      run(ry, [0, 0, -36, to.ry], o);
      running.current.push(animate(cv, to.cv, { type: "spring", stiffness: 70, damping: 9, delay: wait + 1.05 }));
    } else if (pose === "in") {
      const o = { duration: 0.82, times: [0, 0.24, 0.62, 0.9, 1], ease: "easeInOut" } as const;
      running.current.push(animate(cv, 90, { duration: 0.22, ease: "easeIn" }));
      run(z, [LANE, LANE, 22, 0], o);
      run(x, [x.get(), 0, 0, 0], o);
      run(y, [y.get(), 0, 0, 0], o);
      run(ry, [-30, 0, 0, 0], o);
      run(rx, [0, 0, -6, 0], o);
    } else {
      const s = { type: "spring", stiffness: 60, damping: 12, mass: 1 } as const;
      all.forEach(([m, val]) => running.current.push(animate(m, val, m === cv ? { type: "spring", stiffness: 46, damping: 8.5 } : s)));
    }
  }, [pose, L, reduce, x0, wait, x, y, z, rx, ry, cv]);
  useEffect(() => () => running.current.forEach((a) => a.stop()), []);

  // a finger on the head of the spine: the volume rocks forward a little before it is pulled
  useEffect(() => {
    if (reduce || pose !== "in" || prev.current.pose !== "in") return;
    const a = animate(rx, hover ? -7 : 0, { type: "spring", stiffness: 220, damping: 16 });
    const b = animate(z, hover ? 18 : 0, { type: "spring", stiffness: 220, damping: 18 });
    return () => {
      a.stop();
      b.stop();
    };
  }, [hover, pose, reduce, rx, z]);

  const dark = v.foil === "ink";
  const out = pose !== "in";
  const round = "linear-gradient(90deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.08) 14%, rgba(255,255,255,0.2) 32%, rgba(255,255,255,0.04) 52%, rgba(0,0,0,0.1) 78%, rgba(0,0,0,0.4) 100%)";

  return (
    <motion.div className="pointer-events-none absolute" style={{ left: x0, top: L.shelfY - v.h, width: v.t, height: v.h, transformStyle: "preserve-3d", transformOrigin: `${v.t / 2}px ${v.h}px`, x, y, z, rotateX: rx, rotateY: ry }}>
      <motion.div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: "0% 100%" }} animate={{ rotateZ: lean && !reduce ? -3.1 : 0 }} transition={{ type: "spring", stiffness: 120, damping: 9 }} initial={false}>
        {/* back board */}
        <div aria-hidden="true" className="absolute left-0 top-0" style={{ width: v.d, height: v.h, transformOrigin: "0 50%", transform: "rotateY(90deg)", backgroundColor: v.cloth, backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.25), rgba(0,0,0,0.5)), ${weave}` }} />
        {/* the page block seen from above, with its headband, set down inside the boards */}
        <div aria-hidden="true" className="absolute" style={{ left: 3, top: 5, width: v.t - 6, height: v.d - 7, transformOrigin: "50% 0", transform: "rotateX(-90deg)", backgroundColor: "#ece3cd", backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.5) 0, rgba(0,0,0,0) 3px), linear-gradient(180deg, rgba(255,255,255,0.3), rgba(0,0,0,0.05) 40%, rgba(60,40,10,0.38)), repeating-linear-gradient(90deg, rgba(90,70,40,0.34) 0 0.6px, rgba(0,0,0,0) 0.6px 2px)" }}>
          <div className="absolute inset-x-0 top-0 h-[7px]" style={{ backgroundColor: v.end, backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.75) 0 2px, rgba(0,0,0,0) 2px 4px), linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0) 60%)" }} />
        </div>
        {/* cloth over the head of the spine and the edge of the back board */}
        <div aria-hidden="true" className="absolute left-0 top-0" style={{ width: v.t - 3, height: v.d, transformOrigin: "50% 0", transform: "rotateX(-90deg)", backgroundImage: `linear-gradient(180deg, ${v.cloth} 0 5px, rgba(0,0,0,0) 5px), linear-gradient(90deg, ${v.cloth} 0 3px, rgba(0,0,0,0) 3px)` }} />
        {/* first leaf, printed with the chapter opening */}
        <div className="absolute overflow-hidden" style={{ left: v.t - 4, top: 5, width: v.d - 7, height: v.h - 10, transformOrigin: "0 50%", transform: "rotateY(90deg)", backgroundColor: PAPER, backgroundImage: `linear-gradient(90deg, rgba(60,40,10,0.42) 0, rgba(60,40,10,0.08) 16px, rgba(0,0,0,0) 44px), linear-gradient(100deg, rgba(255,255,255,0.3), rgba(255,255,255,0) 50%, rgba(80,60,20,0.1)), ${fibre}` }}>
          <div className="absolute inset-x-[22px] top-[20px] overflow-hidden" style={{ height: Math.round(v.h * 0.4), backgroundColor: v.tone }}>
            <img src={v.photo} alt="" draggable={false} className="h-full w-full object-cover" style={{ objectPosition: v.focus }} />
          </div>
          <div className="absolute inset-x-[22px] text-[#2a2118]" style={{ top: Math.round(v.h * 0.4) + 32 }}>
            <p className="font-mono text-[8.5px] uppercase tracking-[0.26em] text-[#6b5a44]">Chapter {v.no}</p>
            <p className="mt-[6px] font-serif text-[27px] leading-[1] tracking-[-0.01em]">{v.title}</p>
            <div className="mt-[11px] h-px w-[34px] bg-[#2a2118]" />
            <p className="mt-[10px] font-serif text-[12px] italic leading-[1.42] text-[#4a3d2e]">{v.line}</p>
          </div>
          <a href="#" tabIndex={pose === "open" ? 0 : -1} className="pointer-events-auto absolute bottom-[16px] left-[22px] inline-flex min-h-[40px] items-center gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-[#2a2118] underline decoration-[#2a2118]/40 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[#2a2118]">
            Read chapter {v.no}
            <svg aria-hidden="true" width="14" height="8" viewBox="0 0 14 8" fill="none"><path d="M0 4h12M9 1l3 3-3 3" stroke="currentColor" strokeWidth="1.2" /></svg>
          </a>
          <span className="absolute bottom-[18px] right-[18px] font-serif text-[10px] text-[#6b5a44]">{Number(v.no) * 24 - 17}</span>
        </div>
        {/* spine */}
        <button
          type="button"
          onClick={onPick}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}
          aria-current={out ? "true" : undefined}
          aria-label={`Chapter ${v.no}, ${v.title}`}
          className="pointer-events-auto absolute inset-0 block cursor-pointer overflow-hidden rounded-[1.5px] outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-sky-400"
          style={{ backgroundColor: v.cloth, backgroundImage: `${round}, ${weave}` }}
        >
          <span aria-hidden="true" className="absolute inset-0 opacity-60 mix-blend-multiply" style={{ backgroundImage: grain }} />
          {/* foil rules at head and tail */}
          {[18, 23, v.h - 76, v.h - 24].map((top) => (
            <span key={top} aria-hidden="true" className="absolute inset-x-[5px] h-[1.5px]" style={{ top, backgroundImage: FOIL[v.foil] }} />
          ))}
          <span aria-hidden="true" className="absolute left-1/2 top-[38px] whitespace-nowrap font-serif text-[17px] uppercase leading-none tracking-[0.2em]" style={{ ...foilText(v.foil), writingMode: "vertical-rl", transform: "translateX(-50%)", fontSize: v.t < 46 ? 15 : 18, filter: dark ? "none" : "drop-shadow(0 0.5px 0 rgba(0,0,0,0.45))" }}>
            {v.title}
          </span>
          <span aria-hidden="true" className="absolute inset-x-0 text-center font-serif text-[15px] leading-none" style={{ ...foilText(v.foil), top: v.h - 59 }}>
            {v.no}
          </span>
          <span aria-hidden="true" className="absolute left-1/2 h-[9px] w-[9px] -translate-x-1/2 rotate-45" style={{ top: v.h - 16, backgroundImage: FOIL[v.foil], opacity: 0.9 }} />
          {/* the groove where the cloth turns onto each board */}
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-black/25" />
          <span aria-hidden="true" className="absolute inset-y-0 right-0 w-[3px] bg-black/30" />
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[5px]" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0))" }} />
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[26px]" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.42), rgba(0,0,0,0))" }} />
        </button>
        {/* front board, hinged on the spine */}
        <motion.div className="absolute top-0" style={{ left: v.t - 3, width: v.d, height: v.h, transformStyle: "preserve-3d", transformOrigin: "0 50%", rotateY: cv }}>
          <button
            type="button"
            onClick={onCover}
            tabIndex={out ? 0 : -1}
            aria-expanded={pose === "open"}
            aria-label={pose === "open" ? `Close ${v.title}` : `Open ${v.title} at chapter ${v.no}`}
            className="pointer-events-auto absolute inset-0 block cursor-pointer overflow-hidden rounded-r-[2px] outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-sky-400"
            style={{ transform: "translateZ(3px)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", backgroundColor: v.cloth, backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.3) 0, rgba(0,0,0,0.3) 9px, rgba(255,255,255,0.16) 11px, rgba(0,0,0,0) 26px), ${weave}` }}
          >
            <span aria-hidden="true" className="absolute inset-0 opacity-60 mix-blend-multiply" style={{ backgroundImage: grain }} />
            {/* the plate, pasted into a pressed panel */}
            <span className="absolute block" style={{ left: 38, right: 30, top: 34, height: Math.round(v.h * 0.56), backgroundColor: "rgba(0,0,0,0.2)", boxShadow: "inset 0 2px 3px rgba(0,0,0,0.55), inset 0 -1px 0 rgba(255,255,255,0.22), 0 1px 0 rgba(255,255,255,0.14)" }}>
              <span className="absolute inset-[5px] block overflow-hidden" style={{ backgroundColor: v.tone, boxShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                <img src={v.photo} alt={v.alt} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: v.focus }} />
                <span aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(125deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 34%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.14))" }} />
              </span>
            </span>
            <span aria-hidden="true" className="absolute block text-left" style={{ left: 38, right: 30, top: Math.round(v.h * 0.56) + 52 }}>
              <span className="block font-serif text-[22px] uppercase leading-[1.02] tracking-[0.14em]" style={{ ...foilText(v.foil), filter: dark ? "none" : "drop-shadow(0 0.6px 0 rgba(0,0,0,0.5))" }}>
                {v.title}
              </span>
              <span className="mt-[9px] block h-[1.5px] w-[30px]" style={{ backgroundImage: FOIL[v.foil] }} />
              <span className="mt-[9px] block font-mono text-[8px] uppercase tracking-[0.3em]" style={foilText(v.foil)}>
                {series} / {v.no}
              </span>
            </span>
            <span aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(112deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 30%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.26) 100%)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1), inset -2px 0 3px rgba(0,0,0,0.25)" }} />
          </button>
          {/* inside of the board: coloured endpaper inside the cloth turn-ins */}
          <div aria-hidden="true" className="absolute inset-0" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", backgroundColor: v.cloth, backgroundImage: weave }}>
            <div className="absolute" style={{ left: 9, right: 0, top: 9, bottom: 9, backgroundColor: v.end, backgroundImage: `linear-gradient(270deg, rgba(0,0,0,0.42) 0, rgba(0,0,0,0.06) 22px, rgba(0,0,0,0) 60px), linear-gradient(120deg, rgba(255,255,255,0.2), rgba(255,255,255,0) 40%, rgba(0,0,0,0.12)), ${fibre}` }} />
          </div>
          {/* thickness of the board along its head and its long edge */}
          <div aria-hidden="true" className="absolute left-0 top-0 h-[3px]" style={{ width: v.d, transformOrigin: "50% 0", transform: "rotateX(90deg)", backgroundColor: v.cloth, backgroundImage: "linear-gradient(rgba(255,255,255,0.22), rgba(255,255,255,0.22))" }} />
          <div aria-hidden="true" className="absolute top-0 w-[3px]" style={{ left: v.d, height: v.h, transformOrigin: "0 50%", transform: "rotateY(-90deg)", backgroundColor: v.cloth, backgroundImage: "linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2))" }} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function ClothBoundChapterShelf() {
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [tall, setTall] = useState(false);
  const [pick, setPick] = useState(2);
  const [open, setOpen] = useState(false);
  const [wait, setWait] = useState(0);
  const idle = useRef({ paused: false, touched: false });
  const L = tall ? TALL : WIDE;
  const landed = useRef(false);
  useEffect(() => {
    landed.current = !reduce;
  }, [reduce]);
  const tilt = useSpring(0, { stiffness: 50, damping: 14 });
  const drift = useMotionValue(0);
  const turn = useTransform([tilt, drift], ([a, b]: number[]) => a + b);
  // the camera never quite stands still
  useEffect(() => {
    if (reduce) return;
    const a = animate(drift, [-1.5, 1.5], { duration: 5.5, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" });
    return () => a.stop();
  }, [drift, reduce]);

  const choose = useCallback(
    (i: number, byHand: boolean) => {
      if (byHand) idle.current.touched = true;
      setPick((was) => {
        if (was === i) return was;
        setWait(0.36);
        setOpen(false);
        return i;
      });
    },
    [],
  );
  const toggle = useCallback((byHand: boolean) => {
    if (byHand) idle.current.touched = true;
    setOpen((o) => !o);
  }, []);

  // self-playing demo: open the standing volume, hold, then fetch the next one
  useEffect(() => {
    if (reduce) {
      setOpen(true);
      return;
    }
    let step = 0;
    let timer = 0;
    const tick = () => {
      const s = idle.current;
      if (s.touched) return;
      if (!s.paused && !document.hidden) {
        step += 1;
        if (step % 2 === 1) setOpen(true);
        else {
          setWait(0.36);
          setOpen(false);
          setPick((p) => (p + 3) % volumes.length);
        }
      }
      timer = window.setTimeout(tick, step % 2 === 1 ? 3000 : 3300);
    };
    timer = window.setTimeout(tick, 3400);
    return () => window.clearTimeout(timer);
  }, [reduce]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    if (!wrap || !scene) return;
    const measure = () => {
      const isTall = wrap.clientWidth < 720;
      const lay = isTall ? TALL : WIDE;
      setTall(isTall);
      const sc = Math.min(1.12, wrap.clientWidth / (lay.W + (isTall ? 0 : 60)));
      wrap.style.height = `${Math.round(lay.H * sc)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  let run = L.rowX;
  const slots = volumes.map((v) => {
    const at = run;
    run += v.t + 1;
    return at;
  });
  const endX = run + 2;
  const shelves = tall ? [L.dispY, L.shelfY] : [L.shelfY];
  const oak = "linear-gradient(180deg, #e9d3ad 0%, #d9bd8f 38%, #c4a373 100%)";
  const figure = "repeating-linear-gradient(91deg, rgba(120,84,40,0.16) 0 1px, rgba(0,0,0,0) 1px 7px), repeating-linear-gradient(89deg, rgba(255,255,255,0.14) 0 2px, rgba(0,0,0,0) 2px 23px)";
  const v = volumes[pick];

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: WALL }}>
      <div
        ref={wrapRef}
        onPointerMove={(e) => {
          if (reduce || e.pointerType === "touch") return;
          const r = e.currentTarget.getBoundingClientRect();
          tilt.set((((e.clientX - r.left) / r.width) * 2 - 1) * -2.2);
        }}
        onPointerEnter={() => (idle.current.paused = true)}
        onPointerLeave={() => {
          idle.current.paused = false;
          tilt.set(0);
        }}
        onFocus={() => (idle.current.paused = true)}
        onBlur={() => (idle.current.paused = false)}
        className="relative mx-auto w-full overflow-hidden"
        style={{ height: WIDE.H }}
      >
        <div ref={sceneRef} className="absolute left-1/2 top-0 select-none" style={{ width: L.W, height: L.H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "2200px", perspectiveOrigin: L.eye }}>
          <motion.nav aria-label={`${series}: chapters`} className="pointer-events-none absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: `50% 60% -${SHELF_BACK / 2}px`, rotateY: turn }}>
            {/* the wall behind, with the light pooling on it and the shadows the books throw */}
            <div aria-hidden="true" className="pointer-events-none absolute" style={{ left: -700, top: -400, width: L.W + 1400, height: L.H + 800, transform: `translateZ(-${SHELF_BACK}px)`, backgroundColor: WALL, backgroundImage: `radial-gradient(60% 55% at 46% 36%, #f6f2e9 0%, #ebe5da 45%, #d6cfc1 100%), ${grain}`, backgroundBlendMode: "normal" }}>
              {shelves.map((sy) => (
                <div key={sy} className="absolute" style={{ left: 0, right: 0, top: 400 + sy + 22, height: 120, background: "linear-gradient(180deg, rgba(60,45,25,0.42), rgba(60,45,25,0.12) 42%, rgba(60,45,25,0))" }} />
              ))}
              {volumes.map((b, i) => (
                <motion.div key={b.no} className="absolute" style={{ left: 700 + slots[i] + 20, top: 400 + L.shelfY - b.h + 16, width: b.t + 8, height: b.h, background: "rgba(48,36,20,0.5)", filter: "blur(16px)" }} initial={false} animate={{ opacity: i === pick ? 0 : 1 }} transition={{ duration: 0.5, delay: i === pick ? 0.2 : 0.5 }} />
              ))}
              <div className="absolute" style={{ left: 700 + endX + 16, top: 400 + L.shelfY - 150, width: 60, height: 160, background: "rgba(48,36,20,0.42)", filter: "blur(16px)" }} />
              <motion.div key={pick} className="absolute" style={{ left: 700 + L.closedX + 40, top: 400 + L.dispY - v.h + 20, width: 250, height: v.h, background: "rgba(48,36,20,0.34)", filter: "blur(30px)" }} initial={{ opacity: landed.current ? 0 : 1 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: wait + 0.95 }} />
            </div>

            {shelves.map((sy) => (
              <div key={sy} aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
                <div className="absolute" style={{ left: -700, top: sy, width: L.W + 1400, height: SHELF_BACK + 18, transformOrigin: "50% 0", transform: "translateZ(18px) rotateX(-90deg)", backgroundColor: "#dcc195", backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.3) 0, rgba(255,255,255,0) 30px, rgba(70,48,20,0) 40%, rgba(70,48,20,0.5) 100%), ${figure}` }}>
                  {sy === L.dispY && <motion.div key={pick} className="absolute" style={{ left: 700 + L.closedX - 10, top: 26, width: 300, height: 150, background: "rgba(40,28,12,0.5)", filter: "blur(18px)", borderRadius: "40%" }} initial={{ opacity: landed.current ? 0 : 1 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: wait + 0.95 }} />}
                </div>
                <div className="absolute" style={{ left: -700, top: sy, width: L.W + 1400, height: 30, transform: "translateZ(18px)", backgroundColor: "#d2b585", backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.55) 0, rgba(255,255,255,0) 2px, rgba(0,0,0,0) 70%, rgba(60,40,15,0.35) 100%), ${figure}, ${oak}` }} />
                <div className="absolute" style={{ left: -700, top: sy + 30, width: L.W + 1400, height: 20, transform: "translateZ(18px)", background: "linear-gradient(180deg, rgba(50,36,16,0.34), rgba(50,36,16,0))" }} />
              </div>
            ))}

            {/* a block of dark green marble holds the row up */}
            <div aria-hidden="true" className="pointer-events-none absolute" style={{ left: endX, top: L.shelfY - 150, width: 44, height: 150 }}>
              {/* its top is drawn flat, as the camera sees it, so the block stays one plane */}
              <div className="absolute inset-x-0 bottom-full h-[30px]" style={{ clipPath: tall ? "polygon(2% 0, 94% 0, 100% 100%, 0 100%)" : "polygon(0 0, 91% 0, 100% 100%, 0 100%)", backgroundColor: "#2f6551", backgroundImage: "linear-gradient(170deg, rgba(255,255,255,0.5), rgba(255,255,255,0.1) 55%, rgba(0,0,0,0.12)), linear-gradient(64deg, rgba(0,0,0,0) 44%, rgba(220,240,225,0.6) 47%, rgba(0,0,0,0) 51%)" }} />
              <div className="absolute inset-0" style={{ backgroundColor: "#17382d", backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.22) 0, rgba(255,255,255,0) 4px, rgba(0,0,0,0) 80%, rgba(0,0,0,0.4)), linear-gradient(118deg, rgba(0,0,0,0) 30%, rgba(214,236,222,0.42) 31.5%, rgba(0,0,0,0) 34%), linear-gradient(72deg, rgba(0,0,0,0) 58%, rgba(214,236,222,0.3) 59%, rgba(0,0,0,0) 62%), linear-gradient(140deg, rgba(0,0,0,0) 70%, rgba(214,236,222,0.2) 71%, rgba(0,0,0,0) 73%), radial-gradient(80% 60% at 30% 20%, #2f6a54, #143328)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), inset 1px 0 0 rgba(255,255,255,0.25), inset 0 -18px 18px -10px rgba(0,0,0,0.5)" }}>
                <div className="absolute inset-y-0 left-[7px] w-[9px]" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.3), rgba(255,255,255,0))" }} />
              </div>
            </div>

            {volumes.map((b, i) => (
              <Book key={b.no} v={b} x0={slots[i]} L={L} pose={i === pick ? (open ? "open" : "out") : "in"} lean={i === pick + 1} wait={wait} reduce={reduce} onPick={() => (i === pick ? toggle(true) : choose(i, true))} onCover={() => toggle(true)} />
            ))}
          </motion.nav>
        </div>

        <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-4 sm:inset-x-8 sm:bottom-7">
          <p aria-live="polite" className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-stone-600">
            <span className="text-stone-900">
              {v.no} / {v.title}
            </span>
            <span className="block">{open ? "Press the cover to close it" : "Pick a spine, then open the cover"}</span>
          </p>
          <div className="flex gap-2">
            {[-1, 1].map((d) => (
              <button key={d} type="button" onClick={() => choose((pick + d + volumes.length) % volumes.length, true)} aria-label={d < 0 ? "Previous chapter" : "Next chapter"} className="grid h-10 w-10 place-items-center rounded-full border border-stone-900/25 bg-white/50 text-stone-900 outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-stone-900">
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d={d < 0 ? "M9 2 4 7l5 5" : "M5 2l5 5-5 5"} stroke="currentColor" strokeWidth="1.5" /></svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

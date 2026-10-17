import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject, PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, animate, motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

/** The airline and the flights on offer. Each press books the one on show, the next press deals the next pass. */
const airline = "Ostrel Air";
const flights = [
  {
    number: "OS 417",
    from: { code: "PCW", city: "Port Callow" },
    to: { code: "SEV", city: "Saint Elvary" },
    date: "14 MAR",
    boards: "09:40",
    gate: "B12",
    seat: "14A",
    fare: "184",
    photo: { src: "https://images.pexels.com/photos/8633909/pexels-photo-8633909.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Turquoise cove under orange sea cliffs seen from the air", tone: "#1c8f96", focus: "42% 60%" },
  },
  {
    number: "OS 652",
    from: { code: "SEV", city: "Saint Elvary" },
    to: { code: "KSB", city: "Kossu Bay" },
    date: "21 MAR",
    boards: "16:05",
    gate: "A3",
    seat: "22F",
    fare: "129",
    photo: { src: "https://images.pexels.com/photos/15048076/pexels-photo-15048076.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "White surf breaking on pale cliffs above green water", tone: "#3f9c94", focus: "70% 60%" },
  },
];

// Design pixels. The pass is drawn at this size and the whole scene is scaled to fit.
const SCENE_W = 900;
const SCENE_H = 500;
const H = 264;
const MAIN_W = 478;
const STUB_W = 176;
const R = 16; // corner radius
const NOTCH = 12; // the half-moon bites where the perforation meets the edges
const HOLE = 2.3; // radius of each perforation
const PITCH = 9.5;
const OPEN = 17; // degrees the stub swings open before the last tooth lets go
const REST = { x: 26, y: 40, r: 8 }; // where the loose stub comes to rest, relative to where it hung
const INK = "#14213f";
const PAPER = "#f6f3ec";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** The two outlines. They share the same ragged teeth, so the halves mate exactly until they are torn apart. */
function outlines() {
  const ys: number[] = [];
  for (let y = NOTCH + 8; y <= H - NOTCH - 8 + 0.01; y += PITCH) ys.push(y);
  const jag = (i: number, k: number) => {
    const n = Math.sin((i + 1) * 91.7 + k * 37.3) * 43758.5453;
    return (n - Math.floor(n) - 0.5) * 2.1;
  };
  let down = "";
  ys.forEach((y, i) => {
    down += ` L ${MAIN_W} ${(y - HOLE).toFixed(2)} A ${HOLE} ${HOLE} 0 0 0 ${MAIN_W} ${(y + HOLE).toFixed(2)}`;
    if (i < ys.length - 1) down += ` L ${(MAIN_W + jag(i, 1)).toFixed(2)} ${(y + PITCH * 0.4).toFixed(2)} L ${(MAIN_W + jag(i, 2)).toFixed(2)} ${(y + PITCH * 0.62).toFixed(2)}`;
  });
  let up = "";
  [...ys].reverse().forEach((y, r) => {
    const i = ys.length - 1 - r;
    if (i < ys.length - 1) up += ` L ${jag(i, 2).toFixed(2)} ${(y + PITCH * 0.62).toFixed(2)} L ${jag(i, 1).toFixed(2)} ${(y + PITCH * 0.4).toFixed(2)}`;
    up += ` L 0 ${(y + HOLE).toFixed(2)} A ${HOLE} ${HOLE} 0 0 0 0 ${(y - HOLE).toFixed(2)}`;
  });
  const main = `M ${R} 0 H ${MAIN_W - NOTCH} A ${NOTCH} ${NOTCH} 0 0 0 ${MAIN_W} ${NOTCH}${down} L ${MAIN_W} ${H - NOTCH} A ${NOTCH} ${NOTCH} 0 0 0 ${MAIN_W - NOTCH} ${H} H ${R} A ${R} ${R} 0 0 1 0 ${H - R} V ${R} A ${R} ${R} 0 0 1 ${R} 0 Z`;
  const stub = `M ${NOTCH} 0 H ${STUB_W - R} A ${R} ${R} 0 0 1 ${STUB_W} ${R} V ${H - R} A ${R} ${R} 0 0 1 ${STUB_W - R} ${H} H ${NOTCH} A ${NOTCH} ${NOTCH} 0 0 0 0 ${H - NOTCH}${up} L 0 ${NOTCH} A ${NOTCH} ${NOTCH} 0 0 0 ${NOTCH} 0 Z`;
  return { main, stub };
}

function bars(seed: number, count: number) {
  const out: { x: number; w: number }[] = [];
  let x = 0;
  for (let i = 0; i < count; i++) {
    const n = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
    const f = n - Math.floor(n);
    const w = f < 0.5 ? 1.2 : f < 0.82 ? 2.4 : 3.6;
    if (i % 2 === 0) out.push({ x, w });
    x += w;
  }
  return { list: out, total: x };
}

const flecks = [
  { y: 34, s: 3.2, dx: 16, dy: 22, spin: 140 },
  { y: 78, s: 2.4, dx: 30, dy: 12, spin: -200 },
  { y: 118, s: 3.6, dx: 12, dy: 40, spin: 90 },
  { y: 150, s: 2.2, dx: 26, dy: 30, spin: 260 },
  { y: 188, s: 3, dx: 9, dy: 26, spin: -120 },
  { y: 222, s: 2.6, dx: 22, dy: 20, spin: 180 },
];
const paperLight = "linear-gradient(128deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 32%, rgba(0,0,0,0) 62%, rgba(40,20,0,0.09) 100%)";
const label = "font-mono text-[8.5px] font-semibold uppercase leading-none tracking-[0.2em] text-[#5b6680]";

type Flight = (typeof flights)[number];
type Api = { tear: () => void };

function Plane({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M19 10c0 .8-.9 1.3-2 1.3h-4.2l-3.6 6.2H7.5l1.9-6.2H5.5l-1.4 1.9H2.8L3.6 10l-.8-3.2h1.3l1.4 1.9h3.9L7.5 2.5h1.7l3.6 6.2H17c1.1 0 2 .5 2 1.3z" />
    </svg>
  );
}

function Pass({ flight, reduce, startTorn, torn, scale, api, onTorn, onPress }: { flight: Flight; reduce: boolean; startTorn: boolean; torn: boolean; scale: MutableRefObject<number>; api: MutableRefObject<Api | null>; onTorn: () => void; onPress: () => void }) {
  const shapes = useMemo(outlines, []);
  const code = useMemo(() => bars(flight.number.length + flight.seat.charCodeAt(0), 74), [flight]);
  const done = useRef(startTorn);
  const [burst, setBurst] = useState(false);
  const drag = useRef({ on: false, x: 0, y: 0, moved: 0, sx: 0, sy: 0, loose: false });

  const tear = useMotionValue(startTorn ? 1 : 0);
  const sx = useMotionValue(startTorn ? REST.x : 0);
  const sy = useMotionValue(startTorn ? REST.y : 0);
  const sr = useMotionValue(startTorn ? REST.r - OPEN : 0);
  const lift = useMotionValue(0);
  const pull = useMotionValue(0);
  const recoil = useSpring(pull, { stiffness: 320, damping: 9, mass: 0.7 });

  const stubRot = useTransform([tear, sr], (v) => (v[0] as number) * OPEN + (v[1] as number));
  const stubScale = useTransform(lift, (v) => 1 + v * 0.035);
  const mainRot = useTransform(recoil, (v) => -v * 1.5);
  const mainX = useTransform(recoil, (v) => -v * 4);
  const shOx = useTransform(lift, (v) => 5 + v * 13);
  const shOy = useTransform(lift, (v) => 9 + v * 20);
  const shBl = useTransform(lift, (v) => 9 + v * 14);
  const shA = useTransform(lift, (v) => 0.42 - v * 0.14);
  const stubShadow = useMotionTemplate`drop-shadow(0 1px 0.5px rgba(70,20,0,0.5)) drop-shadow(${shOx}px ${shOy}px ${shBl}px rgba(84,22,0,${shA}))`;

  const detach = useCallback(() => {
    if (done.current) return;
    done.current = true;
    pull.set(0);
    if (reduce) {
      tear.set(1);
      sx.set(REST.x);
      sy.set(REST.y);
      sr.set(REST.r - OPEN);
      lift.set(0);
    } else {
      animate(sx, REST.x, { type: "spring", stiffness: 90, damping: 15, velocity: 120 });
      animate(sy, REST.y, { type: "spring", stiffness: 80, damping: 12 });
      animate(sr, REST.r - OPEN, { type: "spring", stiffness: 70, damping: 8, velocity: 60 });
      animate(lift, [lift.get(), 1, 0], { duration: 0.62, times: [0, 0.35, 1], ease: "easeInOut" });
      setBurst(true);
    }
    onTorn();
  }, [lift, onTorn, pull, reduce, sr, sx, sy, tear]);

  // while the stub is still attached, how far it has opened also lifts it and tugs the pass
  useEffect(
    () =>
      tear.on("change", (v) => {
        if (done.current) return;
        lift.set(Math.min(1, v * 1.5));
        pull.set(v);
      }),
    [lift, pull, tear],
  );

  const run = useCallback(() => {
    if (done.current) return;
    if (reduce) return detach();
    // the teeth let go in fits and starts, never in one smooth pull
    const from = tear.get();
    animate(tear, [from, 0.2, 0.16, 0.48, 0.43, 0.8, 0.76, 1].map((v) => Math.max(v, from)), { duration: 0.9, times: [0, 0.16, 0.22, 0.42, 0.5, 0.72, 0.8, 1], ease: "easeInOut" }).then(detach);
  }, [detach, reduce, tear]);

  useEffect(() => {
    api.current = { tear: run };
    return () => {
      api.current = null;
    };
  }, [api, run]);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    drag.current = { on: true, x: e.clientX, y: e.clientY, moved: 0, sx: sx.get(), sy: sy.get(), loose: done.current };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.on) return;
    const dx = (e.clientX - d.x) / scale.current;
    const dy = (e.clientY - d.y) / scale.current;
    d.moved = Math.max(d.moved, Math.hypot(dx, dy));
    if (done.current) {
      // once it is loose the stub is just a piece of paper you can push around the counter
      if (d.moved < 5) return;
      sx.set(clamp(d.sx + dx, -40, 150));
      sy.set(clamp(d.sy + dy, -120, 130));
      lift.set(0.6);
      return;
    }
    const t = clamp(Math.max(dx, dx * 0.6 + dy * 0.6) / 120, 0, 1);
    tear.set(t);
    if (t >= 1) detach();
  };
  const onUp = () => {
    const d = drag.current;
    if (!d.on) return;
    d.on = false;
    if (d.moved < 5) return onPress();
    if (d.loose) {
      animate(lift, 0, { duration: 0.25 });
      return;
    }
    if (done.current) return;
    if (tear.get() > 0.5) run();
    else animate(tear, 0, { type: "spring", stiffness: 260, damping: 18 });
  };

  return (
    <motion.div
      className="absolute"
      style={{ left: SCENE_W / 2 - (MAIN_W + STUB_W) / 2 - 16, top: SCENE_H / 2 - H / 2 - 14, width: MAIN_W + STUB_W, height: H }}
      initial={reduce ? false : { opacity: 0, y: -70, rotate: -11, scale: 1.05 }}
      animate={{ opacity: 1, y: 0, rotate: -5, scale: 1, transition: { type: "spring", stiffness: 170, damping: 17 } }}
      exit={reduce ? { opacity: 0, transition: { duration: 0.01 } } : { opacity: 0, x: -150, y: 26, rotate: -13, transition: { duration: 0.36, ease: "easeIn" } }}
    >
      {/* the part the airline keeps */}
      <motion.div className="absolute left-0 top-0" style={{ width: MAIN_W + 4, height: H, rotate: mainRot, x: mainX, transformOrigin: "0% 50%", filter: "drop-shadow(0 1px 0.5px rgba(70,20,0,0.5)) drop-shadow(5px 9px 9px rgba(84,22,0,0.42)) drop-shadow(14px 30px 34px rgba(84,22,0,0.28))" }}>
        <button
          type="button"
          onClick={onPress}
          aria-label={torn ? `Booked. Show the next ${airline} flight` : `Book seat ${flight.seat} on ${airline} ${flight.number} from ${flight.from.city} to ${flight.to.city}, from ${flight.fare} dollars`}
          className="group absolute inset-0 block cursor-pointer text-left outline-none"
          style={{ clipPath: `path('${shapes.main}')`, background: PAPER, color: INK }}
        >
          {/* destination photograph, printed to the left edge */}
          <span className="absolute inset-y-0 left-0 block w-[150px] overflow-hidden" style={{ background: flight.photo.tone }}>
            <img src={flight.photo.src} alt={flight.photo.alt} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: flight.photo.focus }} />
            <span aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,20,45,0.5) 0%, rgba(8,20,45,0) 34%, rgba(8,20,45,0) 62%, rgba(8,20,45,0.55) 100%)" }} />
            <span className="absolute left-[16px] top-[15px] flex items-center gap-[7px] text-white">
              <span className="grid h-[20px] w-[20px] place-items-center rounded-full bg-white text-[#14213f]">
                <Plane className="h-[11px] w-[11px] -rotate-45" />
              </span>
              <span className="text-[12.5px] font-extrabold uppercase leading-none tracking-[0.14em]">{airline}</span>
            </span>
            <span className="absolute bottom-[15px] left-[16px] block text-white">
              <span className="block font-mono text-[8px] font-semibold uppercase leading-none tracking-[0.22em] text-white/80">Flight</span>
              <span className="mt-[5px] block text-[20px] font-black leading-none tracking-[-0.01em]">{flight.number}</span>
            </span>
          </span>

          {/* fine security rings, as on any printed ticket */}
          <span aria-hidden="true" className="absolute inset-y-0 left-[150px] right-0" style={{ background: "repeating-radial-gradient(circle at 104% -8%, rgba(20,33,63,0.06) 0 1px, rgba(20,33,63,0) 1px 7px)" }} />

          <span className="absolute left-[172px] right-[40px] top-[20px] flex items-center justify-between">
            <span className={label}>Boarding pass</span>
            <span className={label}>Economy</span>
          </span>

          <span className="absolute left-[172px] right-[40px] top-[44px] flex items-end justify-between">
            <span className="block">
              <span className="block text-[50px] font-black leading-[0.86] tracking-[-0.035em]">{flight.from.code}</span>
              <span className="mt-[7px] block text-[10.5px] font-semibold leading-none text-[#3b4763]">{flight.from.city}</span>
            </span>
            <span aria-hidden="true" className="relative mb-[26px] block h-[22px] flex-1 px-[10px] text-[#e4572e]">
              <svg viewBox="0 0 100 22" preserveAspectRatio="none" className="absolute inset-x-[10px] top-0 h-full w-[calc(100%-20px)] overflow-visible">
                <path d="M0 19 Q50 -12 100 19" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </svg>
              <Plane className="absolute left-1/2 top-[-6px] h-[17px] w-[17px] -translate-x-1/2" />
            </span>
            <span className="block text-right">
              <span className="block text-[50px] font-black leading-[0.86] tracking-[-0.035em]">{flight.to.code}</span>
              <span className="mt-[7px] block text-[10.5px] font-semibold leading-none text-[#3b4763]">{flight.to.city}</span>
            </span>
          </span>

          <span className="absolute left-[172px] right-[40px] top-[136px] grid grid-cols-[1.35fr_1.2fr_1fr_0.8fr] gap-x-[8px] whitespace-nowrap border-t border-dashed border-[#14213f]/25 pt-[13px]">
            {[
              ["Date", flight.date],
              ["Boards", flight.boards],
              ["Gate", flight.gate],
              ["Seat", flight.seat],
            ].map(([k, v]) => (
              <span key={k} className="block">
                <span className={label}>{k}</span>
                <span className="mt-[6px] block text-[17px] font-extrabold leading-none tracking-[-0.01em]">{v}</span>
              </span>
            ))}
          </span>

          {/* the offer, printed where a gate agent would look */}
          <span className="absolute bottom-[19px] left-[172px] right-[40px] flex items-center justify-between rounded-full py-[9px] pl-[15px] pr-[9px] text-white" style={{ background: INK }}>
            <span className="text-[11.5px] font-bold leading-none tracking-[0.01em]">{torn ? `Booked. Seat ${flight.seat} is yours` : `Tear the stub to book, from $${flight.fare}`}</span>
            <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-[#e4572e]">
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-[12px] w-[12px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                {torn ? <path d="M4.5 10.5l3.6 3.6 7.4-8" /> : <path d="M4 10h11M11 5.5l4.5 4.5-4.5 4.5" />}
              </svg>
            </span>
          </span>

          {/* foil strip beside the perforation */}
          <span aria-hidden="true" className="boarding-pass-tear-foil absolute bottom-[19px] right-[15px] top-[20px] w-[9px] rounded-[2px]" />

          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-60 mix-blend-multiply"><rect width="100%" height="100%" filter="url(#boarding-pass-tear-fibre)" /></svg>
          <span aria-hidden="true" className="absolute inset-0" style={{ background: paperLight, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1.5px 0 rgba(60,30,0,0.2)" }} />
          <span aria-hidden="true" className="absolute inset-y-0 right-0 w-[26px]" style={{ background: "linear-gradient(270deg, rgba(60,30,0,0.1), rgba(60,30,0,0) 40%, rgba(255,255,255,0.5) 75%, rgba(255,255,255,0))" }} />
          <span aria-hidden="true" className="absolute inset-[5px] rounded-[12px] opacity-0 ring-[3px] ring-[#14213f] group-focus-visible:opacity-100" />
        </button>
      </motion.div>

      {/* crumbs of paper shaken out of the perforation as it gives */}
      {burst &&
        flecks.map((f, i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="absolute block rounded-[1px]"
            style={{ left: MAIN_W + 2, top: f.y, width: f.s, height: f.s * 0.7, background: PAPER, boxShadow: "0 1px 1px rgba(70,20,0,0.45)" }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: f.dx, y: f.dy, rotate: f.spin, opacity: [1, 1, 0] }}
            transition={{ duration: 0.75, ease: "easeOut", opacity: { duration: 1.5, times: [0, 0.7, 1] } }}
          />
        ))}

      {/* the stub you keep */}
      <motion.div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="absolute top-0 cursor-grab touch-none active:cursor-grabbing"
        style={{ left: MAIN_W, width: STUB_W, height: H, x: sx, y: sy, rotate: stubRot, scale: stubScale, transformOrigin: `0px ${H - NOTCH}px`, filter: stubShadow }}
      >
        <div className="absolute inset-0" style={{ clipPath: `path('${shapes.stub}')`, background: PAPER, color: INK }}>
          <div aria-hidden="true" className="absolute inset-0" style={{ background: "repeating-radial-gradient(circle at -10% 108%, rgba(20,33,63,0.06) 0 1px, rgba(20,33,63,0) 1px 7px)" }} />
          <div className="absolute left-[24px] right-[18px] top-[20px] flex items-center justify-between">
            <span className={label}>Your stub</span>
            <span className={label}>{flight.number}</span>
          </div>
          <div className="absolute left-[24px] right-[18px] top-[44px]">
            <div className="flex items-center gap-[6px] text-[25px] font-black leading-none tracking-[-0.03em]">
              <span>{flight.from.code}</span>
              <Plane className="h-[13px] w-[13px] text-[#e4572e]" />
              <span>{flight.to.code}</span>
            </div>
            <div className="mt-[15px] grid grid-cols-2 gap-x-[8px] gap-y-[11px]">
              {[
                ["Seat", flight.seat],
                ["Gate", flight.gate],
                ["Boards", flight.boards],
                ["Date", flight.date],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className={label}>{k}</div>
                  <div className="mt-[5px] text-[14px] font-extrabold leading-none">{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div aria-hidden="true" className="absolute bottom-[32px] left-[24px] right-[18px] h-[40px] overflow-hidden">
            <svg viewBox={`0 0 ${code.total} 40`} preserveAspectRatio="none" className="h-full w-full">
              {code.list.map((b, i) => (
                <rect key={i} x={b.x} y={0} width={b.w} height={40} fill={INK} />
              ))}
            </svg>
          </div>
          <div className="absolute bottom-[17px] left-[24px] right-[18px] flex justify-between font-mono text-[7.5px] font-semibold uppercase leading-none tracking-[0.24em] text-[#5b6680]">
            <span>{flight.number.replace(" ", "")}</span>
            <span>{flight.seat}</span>
            <span>{flight.gate}</span>
          </div>
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-60 mix-blend-multiply"><rect width="100%" height="100%" filter="url(#boarding-pass-tear-fibre)" /></svg>
          <div aria-hidden="true" className="absolute inset-0" style={{ background: paperLight, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1.5px 0 rgba(60,30,0,0.2)" }} />
          <div aria-hidden="true" className="absolute inset-y-0 left-0 w-[22px]" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.75), rgba(255,255,255,0) 45%, rgba(60,30,0,0.06) 70%, rgba(60,30,0,0))" }} />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function BoardingPassTearCallToAction() {
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const scale = useRef(1);
  const api = useRef<Api | null>(null);
  const live = useRef({ touched: false, paused: false, clock: 0, torn: false });
  const [idx, setIdx] = useState(0);
  const [torn, setTorn] = useState(false);
  useEffect(() => {
    if (!reduce) return;
    live.current.torn = true;
    setTorn(true);
  }, [reduce]);
  const flight = flights[idx % flights.length];

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const tiltY = useSpring(useTransform(px, (v) => v * 7), { stiffness: 70, damping: 15 });
  const tiltX = useSpring(useTransform(py, (v) => -v * 6), { stiffness: 70, damping: 15 });

  const onTorn = useCallback(() => {
    live.current.torn = true;
    live.current.clock = 0;
    setTorn(true);
  }, []);
  const next = useCallback(() => {
    live.current.torn = false;
    live.current.clock = 0;
    setTorn(false);
    setIdx((i) => i + 1);
  }, []);
  const press = useCallback(() => {
    live.current.touched = true;
    if (live.current.torn) next();
    else api.current?.tear();
  }, [next]);

  // the demo: tear the pass shortly after it lands, admire it, deal the next one
  useEffect(() => {
    if (reduce) return;
    const s = live.current;
    const tick = window.setInterval(() => {
      if (s.touched || s.paused || document.hidden) return;
      s.clock += 100;
      if (!s.torn && s.clock === 800) api.current?.tear();
      if (s.torn && s.clock >= 3600) next();
    }, 100);
    return () => window.clearInterval(tick);
  }, [next, reduce]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    if (!wrap || !scene) return;
    const measure = () => {
      const sc = clamp(wrap.clientWidth / (SCENE_W - 170), 0.4, 1.3);
      scale.current = sc;
      wrap.style.height = `${Math.round(Math.max(SCENE_H * sc, 360) + 56)}px`;
      scene.style.transform = `translate(-50%, -50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#e4572e]">
      <style>{`
        .boarding-pass-tear-foil { background: linear-gradient(180deg, #ffd9a8, #ff9fd0 16%, #9fd8ff 34%, #b6ffd9 50%, #fff3a6 66%, #ffa9c4 82%, #a9c8ff); background-size: 100% 260%; box-shadow: inset 0 0 0 0.5px rgba(20,33,63,0.35), inset 2px 0 1px rgba(255,255,255,0.7); animation: boarding-pass-tear-foil 5s ease-in-out infinite alternate; }
        @keyframes boarding-pass-tear-foil { from { background-position: 0 0; } to { background-position: 0 100%; } }
        @media (prefers-reduced-motion: reduce) { .boarding-pass-tear-foil { animation: none; } }
      `}</style>
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <filter id="boarding-pass-tear-fibre" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.55" numOctaves="3" seed="7" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.36  0 0 0 0 0.29  0 0 0 0 0.2  0.85 0 0 0 -0.3" />
        </filter>
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 66% at 42% 36%, #f47a4c 0%, #e4572e 48%, #c13f1b 100%)" }} />
      <div
        ref={wrapRef}
        onPointerMove={(e) => {
          if (reduce || e.pointerType === "touch") return;
          const r = e.currentTarget.getBoundingClientRect();
          px.set(((e.clientX - r.left) / r.width) * 2 - 1);
          py.set(((e.clientY - r.top) / r.height) * 2 - 1);
        }}
        onPointerEnter={() => (live.current.paused = true)}
        onPointerLeave={() => {
          live.current.paused = false;
          px.set(0);
          py.set(0);
        }}
        className="relative mx-auto w-full overflow-hidden"
        style={{ height: SCENE_H * 1.3 + 56 }}
      >
        <div ref={sceneRef} className="absolute left-1/2 top-[47%] select-none" style={{ width: SCENE_W, height: SCENE_H, transform: "translate(-50%, -50%)", perspective: "1500px" }}>
          <motion.div className="absolute inset-0" style={{ rotateX: tiltX, rotateY: tiltY }}>
            <AnimatePresence initial={!reduce}>
              <Pass key={idx} flight={flight} reduce={reduce} startTorn={reduce && idx === 0} torn={torn} scale={scale} api={api} onTorn={onTorn} onPress={press} />
            </AnimatePresence>
          </motion.div>
        </div>

        <p className="absolute bottom-5 left-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#3a0f00] sm:bottom-8 sm:left-8">
          <span className="font-semibold text-white">
            {airline} {flight.number}
          </span>
          <span className="block">{torn ? "Stub is yours. Press for the next flight" : "Press the pass or pull the stub"}</span>
        </p>
        <p aria-live="polite" className="sr-only">
          {torn ? `Booked: seat ${flight.seat}, ${flight.from.city} to ${flight.to.city}.` : ""}
        </p>
      </div>
    </section>
  );
}

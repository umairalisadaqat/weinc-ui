import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";

/** The order and the four places it passes. Edit the list to rename or retime the stations. */
const order = {
  number: "OT-70418",
  courier: "Otterline",
  line: "Line 3",
  stations: [
    { name: "Packed", place: "Halewick depot", time: "Tue 08:12", note: "Your parcel is packed and labelled at the Halewick depot." },
    { name: "Sorted", place: "Ashby hub", time: "Tue 21:40", note: "It was sorted overnight at the Ashby hub." },
    { name: "On the van", place: "Route 14", time: "Wed 07:05", note: "It is on the van for route 14 and due before noon." },
    { name: "Delivered", place: "Front porch", time: "Wed 11:26", note: "Delivered to the front porch on Wednesday at 11:26." },
  ],
};

// Design pixels in the conveyor's own space: x runs along the line, y across it, z up off the floor.
const L = 820; // length of the line
const CW = 150; // width between the rails
const CH = 74; // height of the roller tops
const RAIL = 8;
const PITCH = 24; // one roller every 24px
const ROLL = 19; // roller diameter
const PW = 118; // the parcel: length, depth, height
const PD = 96;
const PH = 70;
const SIGN_W = 176;
const SIGN_H = 252;
const PLATE_H = 88;
const SCENE_W = 940;
const SCENE_H = 548;
const TURN = -20;
const TIP = 60;
const START = 2; // the station the parcel is waiting at when the page loads

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const svg = (s: string) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const stops = order.stations.map((_, k) => 96 + k * ((L - 192) / (order.stations.length - 1)));
const rollers = Array.from({ length: Math.floor((L - 6) / PITCH) }, (_, i) => 6 + i * PITCH);

const fibre = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='f' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.9 0.32' numOctaves='3' seed='8' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.26  0 0 0 0 0.15  0 0 0 0 0.05  0 0 0 -1.5 0.94'/></filter><rect width='220' height='220' filter='url(#f)'/></svg>",
);
const grit = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='g' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' seed='14' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0 0.18  0 0 0 -1.3 0.72'/></filter><rect width='300' height='300' filter='url(#g)'/></svg>",
);
const YELLOW = "#f0b21c";
const ENAMEL = "#143a31";
const kraft = (ribs: string, base: string) => ({ backgroundColor: base, backgroundImage: `${ribs}, ${fibre}`, backgroundSize: "auto, 220px 220px" });
const ribsX = "repeating-linear-gradient(90deg, rgba(255,240,214,0.08) 0 3px, rgba(60,34,8,0.07) 3px 6px)";
const ribsY = "repeating-linear-gradient(180deg, rgba(255,240,214,0.08) 0 3px, rgba(60,34,8,0.07) 3px 6px)";
const steel = "linear-gradient(90deg, #4c5359 0%, #8d969d 14%, #e9eef2 34%, #ffffff 42%, #c3cbd1 56%, #7b848b 78%, #3d4348 100%)";
const tapePaper = { backgroundColor: "#efe6d3", backgroundImage: fibre, backgroundSize: "200px 200px" };

export default function RollerConveyorTracker() {
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(START);
  const [at, setAt] = useState(START); // the last station the parcel has actually reached
  const [running, setRunning] = useState(false);
  const [touched, setTouched] = useState(false);
  const live = useRef({ step: START, touched: false, paused: false, timer: 0 });

  const x = useSpring(stops[START] - PW / 2, { stiffness: 22, damping: 10.5, mass: 1 });
  const parcelT = useTransform(x, (v) => {
    const wave = (v / PITCH) * Math.PI * 2;
    return `translate3d(${v.toFixed(2)}px, 0px, ${(CH + 1 + Math.sin(wave) * 0.5).toFixed(2)}px) rotateY(${(Math.cos(wave) * 0.35).toFixed(3)}deg)`;
  });
  const parcelO = useTransform(x, (v) => clamp(Math.min((v + 190) / 60, (L + 30 - v) / 70), 0, 1));
  const shadowO = useTransform(parcelO, (o) => o * 0.6);
  const shadowT = useTransform(x, (v) => `translate3d(${(v + 4).toFixed(2)}px, 0px, ${CH + 0.6}px)`);

  useEffect(
    () =>
      x.on("change", (v) => {
        const moving = Math.abs(x.getVelocity()) > 6;
        setRunning((r) => (r === moving ? r : moving));
        const k = live.current.step;
        if (Math.abs(v + PW / 2 - stops[k]) < 14) setAt((a) => (a === k ? a : k));
      }),
    [x],
  );

  const go = useCallback(
    (k: number) => {
      const s = live.current;
      window.clearTimeout(s.timer);
      const from = s.step;
      s.step = k;
      setStep(k);
      const target = stops[k] - PW / 2;
      if (reduce) {
        x.jump(target);
        setAt(k);
        return;
      }
      if (k < from) {
        // a new parcel: the old one runs off the end and the next is fed on at the start
        setAt(-1);
        x.set(L + 60);
        s.timer = window.setTimeout(() => {
          x.jump(-190);
          x.set(target);
        }, 1300);
      } else x.set(target);
    },
    [reduce, x],
  );

  // self-playing demo: waits at the third station, then delivers and starts the next order
  useEffect(() => {
    if (reduce) return;
    const s = live.current;
    let id = window.setTimeout(function tick() {
      if (s.touched) return;
      if (!s.paused && !document.hidden) go((s.step + 1) % order.stations.length);
      id = window.setTimeout(tick, s.step === order.stations.length - 1 ? 3600 : s.step === 0 ? 4200 : 3000);
    }, 3500);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(s.timer);
    };
  }, [go, reduce]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    if (!wrap || !scene) return;
    const measure = () => {
      const sc = clamp(wrap.clientWidth / (SCENE_W - 20), 0.36, 1.1);
      wrap.style.height = `${Math.round(SCENE_H * sc)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const pick = (k: number) => {
    live.current.touched = true;
    setTouched(true);
    go(k);
  };
  const p3 = "preserve-3d" as const;
  const stand = { transformOrigin: "50% 100%", transform: "rotateX(-90deg)" };

  return (
    <section className="relative overflow-hidden bg-[#dcdfdb]">
      <style>{`
        @keyframes roller-conveyor-tracker-seam { 0% { transform: translateX(-4px); opacity: 0; } 12% { opacity: 1; } 88% { opacity: 1; } 100% { transform: translateX(${ROLL + 1}px); opacity: 0; } }
        @keyframes roller-conveyor-tracker-lamp { 0%, 100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.22); } }
        .roller-conveyor-tracker-seam { animation: roller-conveyor-tracker-seam 0.62s linear infinite; animation-play-state: paused; }
        .roller-conveyor-tracker-on .roller-conveyor-tracker-seam { animation-play-state: running; }
        .roller-conveyor-tracker-glow { animation: roller-conveyor-tracker-lamp 1.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .roller-conveyor-tracker-seam, .roller-conveyor-tracker-glow { animation: none; } }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage: `radial-gradient(66% 60% at 46% 44%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.2) 46%, rgba(70,80,76,0.3) 100%), ${grit}`, backgroundSize: "auto, 300px 300px" }} />

      <div className="relative mx-auto w-full max-w-[1280px] pb-7 pt-6 sm:pt-10">
        <div ref={wrapRef} onPointerEnter={() => (live.current.paused = true)} onPointerLeave={() => (live.current.paused = false)} className="relative w-full overflow-hidden" style={{ height: SCENE_H }}>
          <div ref={sceneRef} aria-hidden="true" className={`absolute left-1/2 top-0 select-none ${running ? "roller-conveyor-tracker-on" : ""}`} style={{ width: SCENE_W, height: SCENE_H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "3200px", perspectiveOrigin: "50% 50%" }}>
            <div className="absolute" style={{ left: 52, top: 392, width: 0, height: 0, transformStyle: p3, transformOrigin: "0 0", transform: `rotateX(${TIP}deg) rotateZ(${TURN}deg)` }}>
              {/* floor: shadow under the line and a painted walkway stripe */}
              <div className="absolute bg-black" style={{ left: -6, top: 14, width: L + 60, height: CW + 60, filter: "blur(26px)", opacity: 0.36 }} />
              <div className="absolute" style={{ left: -40, top: CW + 70, width: L + 120, height: 12, opacity: 0.85, background: "repeating-linear-gradient(120deg, #e9ab14 0 14px, #26292b 14px 28px)", boxShadow: "0 0 0 1px rgba(0,0,0,0.15)" }} />

              {/* far legs */}
              <div className="absolute" style={{ left: 0, top: -RAIL - CH, width: L, height: CH, ...stand }}>
                {[40, 300, 560, 790].map((lx) => (
                  <div key={lx} className="absolute bottom-0" style={{ left: lx - 7, width: 14, height: CH - 20, background: "linear-gradient(90deg, #3d4347, #7f888e 40%, #4a5055)" }} />
                ))}
              </div>

              {/* station signs on posts behind the line */}
              {order.stations.map((s, k) => {
                const lit = k <= at && k <= step;
                const now = k === at && k === step;
                return (
                  <div key={s.name} className="absolute" style={{ left: stops[k] - SIGN_W / 2, top: -34 - SIGN_H, width: SIGN_W, height: SIGN_H, ...stand }}>
                    <div className="absolute bottom-0 left-1/2 w-[9px] -translate-x-1/2" style={{ top: PLATE_H - 4, background: "linear-gradient(90deg, #454b50, #b9c1c7 38%, #eef2f5 48%, #7a8389 72%, #3a4044)" }} />
                    <div className="absolute inset-x-0 top-0 overflow-hidden rounded-[7px]" style={{ height: PLATE_H, backgroundColor: ENAMEL, backgroundImage: "linear-gradient(168deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.06) 22%, rgba(255,255,255,0) 46%, rgba(0,0,0,0.24) 100%)", boxShadow: "inset 0 0 0 2px #0b241e, inset 0 0 0 4px #f4efe2, inset 0 0 0 5px rgba(0,0,0,0.35), 0 2px 0 #0a1f1a, 0 10px 14px rgba(0,0,0,0.3)" }}>
                      {[
                        [9, 9],
                        [SIGN_W - 14, 9],
                        [9, PLATE_H - 14],
                        [SIGN_W - 14, PLATE_H - 14],
                      ].map(([sx, sy]) => (
                        <span key={`${sx}-${sy}`} className="absolute h-[5px] w-[5px] rounded-full" style={{ left: sx, top: sy, background: "radial-gradient(circle at 35% 30%, #ffffff, #9aa3a9 55%, #40464a)" }} />
                      ))}
                      {/* the lamp */}
                      <span className="absolute left-[17px] top-[17px] block h-[30px] w-[30px] rounded-full" style={{ background: "linear-gradient(145deg, #f2f4f5, #7c858b 55%, #2f3438)", boxShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
                        {now && <span className="roller-conveyor-tracker-glow absolute -inset-[9px] rounded-full" style={{ background: "radial-gradient(circle, rgba(92,255,160,0.75) 0%, rgba(92,255,160,0.25) 45%, rgba(92,255,160,0) 70%)" }} />}
                        <span
                          className="absolute inset-[4px] rounded-full transition-[background,box-shadow] duration-300 motion-reduce:transition-none"
                          style={{
                            background: lit ? "radial-gradient(circle at 36% 30%, #f1fff6 0%, #8dffbd 22%, #25d274 52%, #0b8a48 100%)" : "radial-gradient(circle at 36% 30%, #6f8f82 0%, #27463d 34%, #0f251f 100%)",
                            boxShadow: lit ? "0 0 10px 2px rgba(80,255,150,0.75), inset 0 -2px 3px rgba(0,60,30,0.5)" : "inset 0 -2px 3px rgba(0,0,0,0.6)",
                          }}
                        />
                      </span>
                      <span className="absolute right-[16px] top-[15px] font-mono text-[9px] font-bold leading-none tracking-[0.18em] text-[#f4efe2]/70">0{k + 1}</span>
                      <span className="absolute left-[55px] top-[22px] whitespace-nowrap text-[15px] font-black uppercase leading-none tracking-[0.03em] text-[#f4efe2]">{s.name}</span>
                      <span className="absolute inset-x-[16px] top-[54px] h-px bg-[#f4efe2]/30" />
                      <span className="absolute inset-x-[17px] top-[62px] flex justify-between whitespace-nowrap font-mono text-[7.5px] font-semibold uppercase leading-none tracking-[0.1em] text-[#f4efe2]/90">
                        <span>{s.place}</span>
                        <span>{s.time}</span>
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* the dark well under the rollers, then the rollers themselves */}
              <div className="absolute" style={{ left: 0, top: 0, width: L, height: CW, transform: `translateZ(${CH - 12}px)`, background: "#17191b" }} />
              <div className="absolute" style={{ left: 0, top: -12, width: L, height: 12, ...stand, transform: `translateZ(${CH - 6}px) rotateX(-90deg)`, background: "linear-gradient(180deg, #c98f10, #9a6b08)" }} />
              <div className="absolute left-0 top-0" style={{ width: L, height: CW, transform: `translateZ(${CH}px)` }}>
                {rollers.map((rx, i) => (
                  <div key={rx} className="absolute top-0 overflow-hidden" style={{ left: rx, width: ROLL, height: CW, borderRadius: "2px", background: steel, boxShadow: "2px 0 2px rgba(0,0,0,0.5)" }}>
                    <span className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0, rgba(0,0,0,0) 12px, rgba(0,0,0,0) 72%, rgba(0,0,0,0.26) 100%)" }} />
                    <span className="roller-conveyor-tracker-seam absolute inset-y-0 left-0 w-[3px]" style={{ background: "linear-gradient(90deg, rgba(30,36,40,0), rgba(30,36,40,0.34), rgba(255,255,255,0.4))", animationDelay: `${-((i * 37) % 62) / 100}s` }} />
                  </div>
                ))}
              </div>

              {/* the parcel and the shadow it drags across the rollers */}
              <motion.div className="absolute bg-black" style={{ left: 0, top: (CW - PD) / 2 + 3, width: PW + 22, height: PD + 14, filter: "blur(7px)", opacity: shadowO, transform: shadowT }} />
              <motion.div className="absolute left-0" style={{ top: (CW - PD) / 2, width: PW, height: PD, transformStyle: p3, transformOrigin: "50% 50%", transform: parcelT, opacity: parcelO }}>
                {/* front, end and top */}
                <div className="absolute overflow-hidden" style={{ left: 0, top: PD - PH, width: PW, height: PH, ...stand, ...kraft(ribsX, "#c39a64") }}>
                  <svg viewBox="0 0 74 22" className="absolute bottom-[9px] left-[9px] h-[20px] w-[68px]" fill="none" stroke="#4a3015" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" opacity="0.8">
                    <rect x="1" y="1" width="20" height="20" />
                    <path d="M7.5 17V7M4.8 9.6 7.5 6.5l2.7 3.1M14.5 17V7M11.8 9.6l2.7-3.1 2.7 3.1" />
                    <rect x="27" y="1" width="20" height="20" />
                    <path d="M32.5 5h9l-1 5.6a3.5 3.5 0 0 1-7 0zM37 13.6V17M34 17.4h6" />
                    <rect x="53" y="1" width="20" height="20" />
                    <path d="M56.5 12a6.5 6.5 0 0 1 13 0zM63 12v4.6a1.8 1.8 0 0 1-3.6 0" />
                  </svg>
                  <span className="absolute right-[8px] top-[9px] text-right text-[10px] font-black uppercase leading-none tracking-[0.04em] text-[#4a3015]/80">{order.courier}</span>
                  <span className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,244,222,0.24) 0, rgba(255,244,222,0) 5px, rgba(40,22,4,0.06) 55%, rgba(40,22,4,0.3) 100%)", boxShadow: "inset 0 0 0 1px rgba(90,58,22,0.3)" }} />
                </div>
                <div className="absolute overflow-hidden" style={{ left: PW - PH, top: 0, width: PH, height: PD, transformOrigin: "100% 50%", transform: "rotateY(90deg)", ...kraft(ribsY, "#a47c4b") }}>
                  <span className="absolute left-0 block" style={{ top: PD / 2 - 11, width: 24, height: 22, ...tapePaper, boxShadow: "inset 0 0 0 0.5px rgba(90,58,22,0.4)" }} />
                  <span className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(255,244,222,0.14) 0, rgba(255,244,222,0) 5px, rgba(40,22,4,0.12) 50%, rgba(40,22,4,0.36) 100%)", boxShadow: "inset 0 0 0 1px rgba(90,58,22,0.3)" }} />
                </div>
                <div className="absolute left-0 top-0 overflow-hidden" style={{ width: PW, height: PD, transform: `translateZ(${PH}px)`, ...kraft(ribsX, "#cba570") }}>
                  <span className="absolute inset-x-0 top-1/2 block h-px" style={{ background: "rgba(60,34,8,0.5)" }} />
                  <span className="absolute inset-x-0 block overflow-hidden" style={{ top: PD / 2 - 11, height: 22, ...tapePaper, boxShadow: "inset 0 0 0 0.5px rgba(90,58,22,0.4)" }}>
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[6px] font-bold uppercase leading-none tracking-[0.2em] text-[#c5311f]">{`${order.courier} / tracked / `.repeat(4)}</span>
                  </span>
                  <span className="absolute overflow-hidden rounded-[1px] bg-[#fbfaf5]" style={{ left: 8, top: PD / 2 + 14, width: 62, height: 27, transform: "rotate(-2deg)", boxShadow: "0 0 0 0.5px rgba(40,22,4,0.4)" }}>
                    <span className="absolute left-[4px] top-[4px] bg-neutral-900 px-[3px] py-[1.5px] text-[4.5px] font-black uppercase leading-none tracking-[0.1em] text-white">{order.courier}</span>
                    <span className="absolute bottom-[4px] left-[4px] h-[9px] w-[36px]" style={{ background: "repeating-linear-gradient(90deg, #171717 0 1px, #fbfaf5 1px 2px, #171717 2px 4px, #fbfaf5 4px 5px, #171717 5px 6px, #fbfaf5 6px 8.5px)" }} />
                    <span className="absolute right-[4px] top-[5px] text-[11px] font-black leading-none text-neutral-900">14</span>
                  </span>
                  <span className="absolute inset-0" style={{ background: "linear-gradient(128deg, rgba(255,246,226,0.26) 0%, rgba(255,246,226,0) 44%, rgba(40,22,4,0.1) 100%)", boxShadow: "inset 0 0 0 1px rgba(90,58,22,0.28)" }} />
                </div>
              </motion.div>

              {/* rail tops, the near rail with its bolts and legs, and the end of the line */}
              <div className="absolute" style={{ left: -4, top: -RAIL, width: L + 12, height: RAIL, transform: `translateZ(${CH + 6}px)`, background: "linear-gradient(180deg, #ffd35a, #e5a512)" }} />
              <div className="absolute" style={{ left: -4, top: CW, width: L + 12, height: RAIL, transform: `translateZ(${CH + 6}px)`, background: "linear-gradient(180deg, #ffe07c, #f4b722)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }} />
              <div className="absolute" style={{ left: -4, top: CW + RAIL - (CH + 6), width: L + 12, height: CH + 6, ...stand }}>
                {[44, 304, 564, 794].map((lx) => (
                  <div key={lx} className="absolute bottom-0" style={{ left: lx - 8, width: 16, top: 30, background: "linear-gradient(90deg, #4b5257, #b2bbc1 30%, #e8edf0 44%, #848d93 70%, #41474b)" }}>
                    <span className="absolute -inset-x-[9px] bottom-0 h-[5px]" style={{ background: "linear-gradient(180deg, #c6cdd2, #5b6267)" }} />
                  </div>
                ))}
                <div className="absolute inset-x-[44px] h-[5px]" style={{ top: CH - 14, background: "linear-gradient(180deg, #dfe4e8, #7c858b 60%, #4a5055)" }} />
                <div className="absolute inset-x-0 top-0 h-[30px]" style={{ backgroundColor: YELLOW, backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.5) 0, rgba(255,255,255,0.12) 3px, rgba(255,255,255,0) 9px, rgba(120,70,0,0) 62%, rgba(120,70,0,0.34) 100%), ${grit}`, backgroundSize: "auto, 300px 300px", boxShadow: "inset 0 0 0 1px rgba(110,64,0,0.4), 0 3px 4px rgba(0,0,0,0.25)" }}>
                  {rollers.map((rx) => (
                    <span key={rx} className="absolute top-[9px] h-[9px] w-[9px] rounded-full" style={{ left: rx + 4 + ROLL / 2 - 4.5, background: "radial-gradient(circle at 36% 30%, #ffffff 0%, #b8c0c6 30%, #5a6166 70%, #2a2e31 100%)", boxShadow: "0 1px 1px rgba(80,44,0,0.6)" }} />
                  ))}
                  <span className="absolute left-[172px] top-[19px] whitespace-nowrap bg-[#1c1e20] px-[5px] py-[2px] font-mono text-[5.5px] font-bold uppercase leading-none tracking-[0.2em] text-[#f0b21c]">
                    {order.courier} / {order.line}
                  </span>
                </div>
              </div>
              <div className="absolute" style={{ left: L + 8 - 30, top: -RAIL, width: 30, height: CW + RAIL * 2, transformOrigin: "100% 50%", transform: `translateZ(${CH - 24}px) rotateY(90deg)`, background: "linear-gradient(180deg, #b47c08, #d99b12 12%, #c98f10 88%, #9a6b08)", boxShadow: "inset 0 0 0 1px rgba(110,64,0,0.5)" }} />
            </div>
          </div>
        </div>

        {/* the same four steps as real, full-size controls */}
        <div className="relative mx-auto mt-2 w-full max-w-4xl px-4 sm:px-8">
          <p aria-live={touched ? "polite" : "off"} className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-neutral-700">
            <span className="font-bold text-neutral-900">Order {order.number}</span>
            <span className="block normal-case tracking-normal sm:text-[13px]">{order.stations[step].note}</span>
          </p>
          <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {order.stations.map((s, k) => (
              <li key={s.name}>
                <button
                  type="button"
                  onClick={() => pick(k)}
                  aria-current={k === step ? "step" : undefined}
                  className={`flex min-h-[48px] w-full items-center gap-3 rounded-[8px] border px-3 text-left outline-none transition-colors duration-200 focus-visible:ring-4 focus-visible:ring-emerald-900/40 motion-reduce:transition-none ${k === step ? "border-[#143a31] bg-[#143a31] text-[#f4efe2]" : "border-neutral-400 bg-white/60 text-neutral-800 hover:bg-white"}`}
                >
                  <span aria-hidden="true" className={`h-[10px] w-[10px] shrink-0 rounded-full ${k <= step ? "bg-emerald-400 shadow-[0_0_0_2px_rgba(16,185,129,0.3)]" : "border border-neutral-500 bg-transparent"}`} />
                  <span>
                    <span className="block text-[13px] font-bold leading-tight">{s.name}</span>
                    <span className={`block font-mono text-[10px] leading-tight ${k === step ? "text-[#f4efe2]/80" : "text-neutral-600"}`}>{k <= step ? s.time : "Pending"}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

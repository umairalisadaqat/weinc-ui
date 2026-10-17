import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";

/** What is printed on the two sides of the card. */
const hotel = { name: "The Aldermoor", room: "Room 214" };
const sides = {
  quiet: { lines: ["Do not", "disturb"], note: "Sleeping in. Thank you for the quiet.", said: "Do not disturb is showing" },
  service: { lines: ["Please", "make up", "my room"], note: "Out for the day. Fresh towels welcome.", said: "Please make up my room is showing" },
};

// Design pixels, measured from the middle of the door knob.
const CW = 178; // card
const CH = 404;
const HOLE = 38; // radius of the hole in the card
const HOLE_Y = 64; // its centre, down from the top of the card
const NECK = 15; // radius of the knob's neck, where the card rests
const HEAD = 31; // radius of the knob itself, small enough to pass through the hole
const ROSE = 47; // the plate behind it
const DROP = HOLE - NECK; // how far the card must be lifted to clear the knob
const PIVOT_Y = HOLE_Y - DROP;
const KNOB_TOP = 176; // knob centre, down from the top of the scene
const SCENE_H = 650;
const GRAVITY = 30; // swing stiffness, per second squared
const DRAG = 1.05; // how fast the swing dies away
const OXBLOOD = "#7a1c22";
const CREAM = "#efe6d1";
const GREEN = "#1d4a3c";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const outline = `M 30 0 H ${CW - 30} A 30 30 0 0 1 ${CW} 30 V ${CH - 14} A 14 14 0 0 1 ${CW - 14} ${CH} H 14 A 14 14 0 0 1 0 ${CH - 14} V 30 A 30 30 0 0 1 30 0 Z M ${CW / 2 - HOLE} ${HOLE_Y} a ${HOLE} ${HOLE} 0 1 0 ${HOLE * 2} 0 a ${HOLE} ${HOLE} 0 1 0 ${-HOLE * 2} 0 Z`;
const cut = `path(evenodd, '${outline}')`;

function Face({ which }: { which: "quiet" | "service" }) {
  const quiet = which === "quiet";
  const s = sides[which];
  const ink = quiet ? CREAM : GREEN;
  return (
    <div className="absolute inset-0" style={{ filter: "drop-shadow(1px 1.6px 0 rgba(40,25,10,0.5))", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: quiet ? undefined : "rotateY(180deg)" }}>
      <div className="absolute inset-0" style={{ clipPath: cut, background: quiet ? OXBLOOD : CREAM, color: ink }}>
        {/* keyline */}
        <div aria-hidden="true" className="absolute rounded-[7px]" style={{ left: 10, right: 10, top: HOLE_Y + HOLE + 16, bottom: 10, border: `1px solid ${ink}`, opacity: 0.75 }} />
        <div aria-hidden="true" className="absolute rounded-[5px]" style={{ left: 13.5, right: 13.5, top: HOLE_Y + HOLE + 19.5, bottom: 13.5, border: `0.5px solid ${ink}`, opacity: 0.6 }} />

        <div className="absolute inset-x-0 text-center" style={{ top: HOLE_Y + HOLE + 40 }}>
          <svg viewBox="0 0 40 40" aria-hidden="true" className="mx-auto h-[34px] w-[34px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {quiet ? (
              <>
                <path d="M27.5 24.5A12 12 0 0 1 15.2 8.3 12 12 0 1 0 31.7 24a12.3 12.3 0 0 1-4.2.5z" fill="currentColor" fillOpacity="0.18" />
                <path d="M26 7.5h5l-5 6h5M33 15.5h3.5l-3.5 4.2h3.5" />
              </>
            ) : (
              <>
                <path d="M7 28.5a13 13 0 0 1 26 0z" fill="currentColor" fillOpacity="0.14" />
                <path d="M4.5 32h31M20 15.5v-3M17 12.5h6M11.5 26a8.6 8.6 0 0 1 5-6.3" />
              </>
            )}
          </svg>
          <p className="m-0 mt-[16px] font-serif italic leading-[0.92] tracking-[-0.01em]" style={{ fontSize: quiet ? 39 : 33 }}>
            {s.lines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </p>
          <span aria-hidden="true" className="mx-auto mt-[17px] block h-px w-[34px]" style={{ background: ink, opacity: 0.7 }} />
          <p className="mx-auto mb-0 mt-[15px] w-[124px] font-serif text-[11.5px] leading-[1.35]" style={{ opacity: 0.92 }}>
            {s.note}
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-[25px] text-center font-mono font-semibold uppercase leading-none">
          <span className="block text-[9px] tracking-[0.3em]">{hotel.name}</span>
          <span className="mt-[7px] block text-[7.5px] tracking-[0.34em]" style={{ opacity: 0.8 }}>
            {hotel.room}
          </span>
        </div>

        {/* coated board: fibre under the varnish, then a sheen and a soft roll at the edges */}
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full mix-blend-multiply" style={{ opacity: quiet ? 0.55 : 0.4 }}>
          <rect width="100%" height="100%" filter="url(#door-hanger-flip-fibre)" />
        </svg>
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(118deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.06) 22%, rgba(255,255,255,0) 40%, rgba(0,0,0,0) 66%, rgba(0,0,0,0.2) 100%)" }} />
        <div aria-hidden="true" className="absolute inset-0" style={{ borderRadius: "30px 30px 14px 14px", boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.45), inset 1.5px 0 0 rgba(255,255,255,0.22), inset -1px -1.5px 1px rgba(0,0,0,0.3)" }} />
        {/* the cut edge of the hole */}
        <div aria-hidden="true" className="absolute rounded-full" style={{ left: CW / 2 - HOLE - 2.5, top: HOLE_Y - HOLE - 2.5, width: HOLE * 2 + 5, height: HOLE * 2 + 5, border: "2.5px solid rgba(0,0,0,0)", borderTopColor: "rgba(0,0,0,0.3)", borderLeftColor: "rgba(0,0,0,0.2)", borderBottomColor: "rgba(255,255,255,0.4)", borderRightColor: "rgba(255,255,255,0.28)" }} />
      </div>
    </div>
  );
}

export default function DoorHangerFlipCard() {
  const reduce = !!useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const swingRef = useRef<HTMLButtonElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const live = useRef({ th: 0.16, w: 0, scale: 1, drag: false, held: false, aim: 0, grab: 0, moved: 0, x: 0, y: 0, touched: false, paused: false, busy: false, gust: 2.6, clock: 0 });
  const [quiet, setQuiet] = useState(false);
  const [above, setAbove] = useState(false);
  const [said, setSaid] = useState("");

  const flip = useMotionValue(180); // 0 shows "do not disturb", 180 the other side
  const twist = useMotionValue(0);
  const hook = useMotionValue(0);
  const lift = useMotionValue(0);
  const turn = useTransform([flip, twist], (v) => (v[0] as number) + (v[1] as number));
  const grow = useTransform(lift, (v) => 1 + v * 0.1);
  const shadeX = useTransform(lift, (v) => 11 + v * 26);
  const shadeY = useTransform(lift, (v) => 15 + v * 34);
  const shadeW = useTransform([flip, twist, lift], (v) => Math.max(0.05, Math.abs(Math.cos((((v[0] as number) + (v[1] as number)) * Math.PI) / 180))) * (1 + (v[2] as number) * 0.12));
  const shadeA = useTransform(lift, (v) => 0.42 - v * 0.17);
  const shadeNear = useTransform(lift, (v) => 0.5 * (1 - v));
  const shadeBlur = useTransform(lift, (v) => `blur(${(8 + v * 12).toFixed(1)}px)`);

  const turnOver = useCallback(
    (to?: boolean) => {
      const s = live.current;
      if (s.busy) return;
      const next = to ?? flip.get() > 90;
      setQuiet(next);
      const end = next ? 0 : 180;
      if (reduce) {
        flip.set(end);
        return;
      }
      s.busy = true;
      s.held = true;
      // lift it clear of the knob, bring it forward, turn it, hang it back and let it swing
      animate(hook, -DROP, { duration: 0.16, ease: "easeOut" }).then(() => {
        setAbove(true);
        animate(lift, 1, { duration: 0.2, ease: "easeOut" });
        animate(flip, end, { type: "spring", stiffness: 120, damping: 15, mass: 0.9 });
        window.setTimeout(() => {
          animate(lift, 0, { duration: 0.2, ease: "easeIn" }).then(() => {
            setAbove(false);
            animate(hook, 0, { type: "spring", stiffness: 420, damping: 13 });
            s.held = false;
            s.busy = false;
            s.w += next ? 1.5 : -1.5;
          });
        }, 520);
      });
    },
    [flip, hook, lift, reduce],
  );

  // the pendulum, the draught that keeps it alive, and the demo that turns the card over
  useEffect(() => {
    const root = rootRef.current;
    const swing = swingRef.current;
    const shade = shadeRef.current;
    if (!root || !swing || !shade) return;
    const s = live.current;
    if (reduce) {
      s.th = 0;
      flip.set(0);
      setQuiet(true);
      return;
    }
    let raf = 0;
    let last = performance.now();
    let seen = true;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.034, (now - last) / 1000);
      last = now;
      if (!seen || document.hidden) return;
      if (s.drag) {
        const before = s.th;
        s.th += (s.aim - s.th) * Math.min(1, dt * 20);
        s.w = s.w * 0.6 + ((s.th - before) / Math.max(dt, 0.001)) * 0.4;
      } else if (s.held) {
        s.th += (0 - s.th) * Math.min(1, dt * 12);
        s.w = 0;
      } else {
        s.w += (-GRAVITY * Math.sin(s.th) - DRAG * s.w) * dt;
        s.th += s.w * dt;
        s.gust -= dt;
        if (s.gust < 0 && !s.paused) {
          s.w += (Math.random() < 0.5 ? -1 : 1) * 0.42;
          s.gust = 2.2 + Math.random() * 1.8;
        }
      }
      const deg = ((-s.th * 180) / Math.PI).toFixed(3);
      swing.style.transform = `rotate(${deg}deg)`;
      shade.style.transform = `rotate(${deg}deg)`;
      twist.set(s.held ? 0 : clamp(s.w * 5, -18, 18));
      if (!s.touched && !s.paused && !s.busy) {
        s.clock += dt;
        if (s.clock > (flip.get() > 90 ? 0.85 : 4.2)) {
          s.clock = flip.get() > 90 ? 0 : -1.6;
          turnOver();
        }
      }
    };
    raf = requestAnimationFrame(frame);
    const io = new IntersectionObserver((entries) => {
      seen = entries[0]?.isIntersecting ?? true;
    });
    io.observe(root);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [flip, reduce, turnOver, twist]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;
    const measure = () => {
      const sc = clamp(root.clientWidth / 1000, 0.82, 1.16);
      live.current.scale = sc;
      root.style.height = `${Math.round(SCENE_H * sc)}px`;
      stage.style.transform = `scale(${sc.toFixed(4)})`;
      stage.style.top = `${Math.round(KNOB_TOP * sc)}px`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  const angleTo = (e: ReactPointerEvent) => {
    const stage = stageRef.current;
    if (!stage) return 0;
    const r = stage.getBoundingClientRect();
    return Math.atan2(e.clientX - r.left, Math.max(20, e.clientY - r.top));
  };
  const onDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const s = live.current;
    if (e.button !== 0 || s.busy) return;
    s.touched = true;
    s.moved = 0;
    s.x = e.clientX;
    s.y = e.clientY;
    if (reduce) return;
    s.drag = true;
    s.grab = angleTo(e) - s.th;
    s.aim = s.th;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const s = live.current;
    if (!s.drag) return;
    s.moved = Math.max(s.moved, Math.hypot(e.clientX - s.x, e.clientY - s.y));
    s.aim = clamp(angleTo(e) - s.grab, -1.15, 1.15);
  };
  const onUp = () => {
    live.current.drag = false;
  };

  const brass = "radial-gradient(circle at 33% 27%, #fff8d8 0%, #f6dc8e 7%, rgba(246,220,142,0) 27%), linear-gradient(172deg, rgba(90,55,5,0) 0%, rgba(90,55,5,0) 50%, rgba(84,50,4,0.5) 56%, rgba(84,50,4,0.12) 78%, rgba(255,226,160,0.3) 100%), radial-gradient(circle at 74% 82%, rgba(255,214,140,0.5) 0%, rgba(255,214,140,0) 26%), radial-gradient(circle at 46% 42%, #dcb052 0%, #c4942f 42%, #99691c 70%, #6c4610 88%, #47300a 100%)";

  return (
    <section
      ref={rootRef}
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") live.current.paused = true;
      }}
      onPointerLeave={() => (live.current.paused = false)}
      className="relative overflow-hidden bg-[#c3c9b8]"
      style={{ height: SCENE_H * 1.16 }}
    >
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <filter id="door-hanger-flip-fibre" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85 0.6" numOctaves="3" seed="3" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0 0.12  0.9 0 0 0 -0.3" />
        </filter>
        <filter id="door-hanger-flip-paint" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.4 0.01" numOctaves="3" seed="9" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.16  0 0 0 0 0.2  0 0 0 0 0.12  1.3 0 0 0 -0.52" />
        </filter>
      </svg>

      {/* the painted door: light falling from the upper left, brush marks running with the grain */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(90% 80% at 30% 18%, #d6dccb 0%, #c3c9b8 46%, #a4ab99 100%)" }} />
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.17] mix-blend-multiply">
        <rect width="100%" height="100%" filter="url(#door-hanger-flip-paint)" />
      </svg>

      <div ref={stageRef} className="absolute left-1/2 select-none" style={{ top: KNOB_TOP, width: 0, height: 0, transformOrigin: "0 0" }}>
        {/* sunk panel with its moulding */}
        <div aria-hidden="true" className="pointer-events-none absolute" style={{ left: -690, top: -96, width: 510, height: 900, borderStyle: "solid", borderWidth: 13, borderTopColor: "#97a08c", borderLeftColor: "#a2aa97", borderBottomColor: "#dfe4d5", borderRightColor: "#dce1d2", boxShadow: "0 0 0 1px rgba(255,255,255,0.35), -1px -1px 0 1px rgba(60,70,50,0.22)" }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(60,70,50,0.14), rgba(60,70,50,0) 22%)", boxShadow: "inset 5px 6px 9px rgba(50,60,40,0.3), inset -1px -1px 0 rgba(255,255,255,0.4)" }} />
        </div>
        {/* the edge of the door, the gap, and the frame beyond it */}
        <div aria-hidden="true" className="pointer-events-none absolute" style={{ left: 300, top: -400, width: 900, height: 1400, background: "linear-gradient(90deg, #cdd3c2 0, #e1e6d8 12px, #d3d9c9 26px, #b9c0ad 30px, #d9decf 36px, #dde2d3 92px, #c2c9b6 98px, #e3e8da 104px, #d6dbcc 150px, #b4bba8 156px, #d2d8c8 164px, #d2d8c8 100%)", boxShadow: "-5px 0 0 #3b4034, -6.5px 0 0 rgba(255,255,255,0.5), -11px 0 9px rgba(50,60,40,0.22)" }} />

        {/* back plate of the knob */}
        <div aria-hidden="true" className="pointer-events-none absolute rounded-full" style={{ left: -ROSE, top: -ROSE, width: ROSE * 2, height: ROSE * 2, background: "conic-gradient(from 20deg, #b78930, #ecd083, #a9792a, #e2c16c, #9a6c20, #e8cb7c, #b0812c, #ecd083, #b78930)", boxShadow: "inset 0 2px 1.5px rgba(255,246,205,0.85), inset 0 -2.5px 3px rgba(70,40,0,0.6), 0 1px 1px rgba(40,30,0,0.6), 5px 8px 10px rgba(45,55,35,0.45), 12px 20px 26px rgba(45,55,35,0.22)" }}>
          <div className="absolute rounded-full" style={{ inset: 13, boxShadow: "inset 0 2px 3px rgba(60,35,0,0.7), 0 1px 0 rgba(255,244,200,0.7)", background: "radial-gradient(circle at 40% 30%, #b98a34, #8a611b 70%, #6b490f)" }} />
        </div>

        {/* shadow of the card on the door */}
        <div ref={shadeRef} aria-hidden="true" className="pointer-events-none absolute" style={{ left: -CW / 2, top: -PIVOT_Y, width: CW, height: CH, transformOrigin: `${CW / 2}px ${PIVOT_Y}px`, zIndex: 5 }}>
          <motion.div className="absolute inset-0" style={{ x: shadeX, y: shadeY, scaleX: shadeW, opacity: shadeA, filter: shadeBlur }}>
            <motion.div className="absolute inset-0 bg-[#1e2616]" style={{ clipPath: cut, y: hook }} />
          </motion.div>
          <motion.div className="absolute inset-0" style={{ x: 2.5, y: 3.5, scaleX: shadeW, opacity: shadeNear, filter: "blur(2.5px)" }}>
            <motion.div className="absolute inset-0 bg-[#1e2616]" style={{ clipPath: cut, y: hook }} />
          </motion.div>
        </div>

        {/* the card: one button that turns it over, and something to drag */}
        <button
          ref={swingRef}
          type="button"
          aria-pressed={quiet}
          aria-label={`Do not disturb sign for ${hotel.room}. ${quiet ? sides.quiet.said : sides.service.said}. Press to turn the card over`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onClick={() => {
            const s = live.current;
            s.touched = true;
            if (s.moved < 6 && !s.busy) {
              setSaid(flip.get() > 90 ? sides.quiet.said : sides.service.said);
              turnOver();
            }
            s.moved = 0;
          }}
          className="absolute block cursor-grab touch-none appearance-none rounded-b-[16px] rounded-t-[32px] border-0 bg-transparent p-0 outline-none focus-visible:ring-4 focus-visible:ring-[#7a1c22] focus-visible:ring-offset-4 focus-visible:ring-offset-[#c3c9b8] active:cursor-grabbing"
          style={{ left: -CW / 2, top: -PIVOT_Y, width: CW, height: CH, transformOrigin: `${CW / 2}px ${PIVOT_Y}px`, perspective: "1100px", zIndex: above ? 30 : 10 }}
        >
          <motion.span className="absolute inset-0 block" style={{ transformStyle: "preserve-3d", rotateY: turn, scale: grow, y: hook }}>
            <Face which="quiet" />
            <Face which="service" />
          </motion.span>
        </button>

        {/* the knob, in front of the card while it hangs */}
        <div aria-hidden="true" className="pointer-events-none absolute rounded-full bg-[#1e2616]" style={{ left: -HEAD + 7, top: -HEAD + 11, width: HEAD * 2, height: HEAD * 2, filter: "blur(6px)", opacity: 0.55, zIndex: 15 }} />
        <div aria-hidden="true" className="pointer-events-none absolute rounded-full" style={{ left: -HEAD, top: -HEAD, width: HEAD * 2, height: HEAD * 2, background: brass, boxShadow: "inset 0 2px 2px rgba(255,248,215,0.7), inset 0 -4px 6px rgba(60,32,0,0.55), 0 0.5px 1px rgba(30,20,0,0.8)", zIndex: 20 }}>
          <div className="absolute rounded-full" style={{ inset: 17, background: "radial-gradient(circle at 36% 30%, #fbe9a8 0%, #d2a441 45%, #8d6118 100%)", boxShadow: "0 0 0 1px rgba(70,40,0,0.55), 0 1.5px 0 1px rgba(255,240,190,0.5), inset 0 -1px 2px rgba(60,32,0,0.5)" }} />
          <div className="absolute rounded-full" style={{ left: "16%", top: "11%", width: "34%", height: "20%", background: "rgba(255,255,255,0.75)", filter: "blur(3px)", transform: "rotate(-32deg)" }} />
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-5 left-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#3d4435] sm:bottom-8 sm:left-8">
        <span className="font-semibold text-[#161a11]">
          {hotel.name} / {hotel.room}
        </span>
        <span className="block">Press the card to turn it, drag to swing</span>
      </p>
      <p aria-live="polite" className="sr-only">
        {said}
      </p>
    </section>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";

/** The pile, bottom first. `look` picks one of the masthead treatments in `Masthead`. */
const issues = [
  { name: "Loud", no: "No. 14", season: "Autumn", line: "The colour issue", second: "Forty pages without a single neutral", look: "block", ink: "#ffffff", spine: "#c2185b", photo: "https://images.pexels.com/photos/11026096/pexels-photo-11026096.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Dancer in a lime top and blue trousers stretching her arms up against a pink wall", tone: "#b81d63", focus: "30% 30%" },
  { name: "Halide", no: "No. 31", season: "Winter", line: "Portraits by one lamp", second: "A light, a wall and an afternoon", look: "italic", ink: "#fff3d6", spine: "#2f3c41", photo: "https://images.pexels.com/photos/31569208/pexels-photo-31569208.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Man in round sunglasses and a black roll neck in front of a glowing orange disc", tone: "#56676a", focus: "50% 30%" },
  { name: "Tangent", no: "No. 08", season: "Spring", line: "One figure, one field of blue", second: "Notes on standing still", look: "mono", ink: "#ffffff", spine: "#0a2fd0", photo: "https://images.pexels.com/photos/13767168/pexels-photo-13767168.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in black wearing white sunglasses standing side on against a deep blue backdrop", tone: "#0832dc", focus: "50% 40%" },
  { name: "Pollen", no: "No. 22", season: "Summer", line: "Orange, all the way down", second: "Dressing for the hottest week", look: "serif", ink: "#1a0f08", spine: "#ef6a10", photo: "https://images.pexels.com/photos/18506138/pexels-photo-18506138.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in a black hat and top and orange trousers sitting against an orange studio wall", tone: "#f2700f", focus: "40% 30%" },
  { name: "Overcast", no: "No. 05", season: "Autumn", line: "After dark, in violet", second: "Shirts worn two sizes up", look: "wide", ink: "#ffffff", spine: "#7a1fb0", photo: "https://images.pexels.com/photos/11813320/pexels-photo-11813320.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Model with a short bob and an oversized shirt lit red against a purple and pink glow", tone: "#a41ec0", focus: "50% 30%" },
  { name: "Marrow", no: "No. 17", season: "Spring", line: "Everything you own, at once", second: "The wardrobe edit", look: "stack", ink: "#f1ee4a", spine: "#4d2a86", photo: "https://images.pexels.com/photos/11059420/pexels-photo-11059420.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in a lime blazer and red glasses holding an armful of bright clothes against a purple wall", tone: "#55308e", focus: "50% 30%" },
];
type Issue = (typeof issues)[number];

// Sizes in the scene's own pixels. The table is tipped back and turned, and every issue lies on it.
const W = 250;
const H = 330;
const T = 7; // thickness of one issue
const TIP = 46;
const TURN = -14;
const LIFT = 190; // how high the chosen issue is held
const FACE = 0.86; // 1 would hold it square to the camera
const WIDE = { W: 1000, H: 690, cx: 500, cy: 420, step: 128, sweep: 6.5 };
const SMALL = { W: 620, H: 900, cx: 310, cy: 470, step: 62, sweep: 5 };
type Layout = typeof WIDE;
const TABLE = "#141217";
const grain = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.09 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E\")";
const pages = "repeating-linear-gradient(0deg, #fbf9f4 0 1px, #c9c3b6 1px 1.7px)";
const jitter = [
  { x: -6, y: 5, r: -3.5 },
  { x: 7, y: -4, r: 2.4 },
  { x: -3, y: -7, r: -1.2 },
  { x: 5, y: 6, r: 4.1 },
  { x: -8, y: 1, r: -2.2 },
  { x: 2, y: -2, r: 1.1 },
];

const spin = (x: number, y: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};

/** Where issue i rests for a given amount of fan (0 piled, 1 spread) and whether it is the one held up. */
function place(i: number, fan: number, held: boolean, L: Layout) {
  const mid = (issues.length - 1) / 2;
  const j = jitter[i % jitter.length];
  const lean = (Math.asin((T + 0.8) / L.step) * 180) / Math.PI;
  if (held) return { x: 0, y: 58, z: LIFT, r: -TURN + 2, tilt: 0, lift: -TIP * FACE };
  const k = i - mid;
  // the fan runs level on screen, so its line is turned back against the table's own turn
  const [fx, fy] = spin(k * L.step, k * k * 5 - 14, -TURN);
  return {
    x: j.x * (1 - fan) + fx * fan,
    y: j.y * (1 - fan) + fy * fan,
    z: i * (T + 0.6) * (1 - fan) + (i === 0 ? 0 : (W / 2) * Math.sin((lean * Math.PI) / 180) * fan),
    r: j.r * (1 - fan) + k * L.sweep * fan,
    tilt: i === 0 ? 0 : lean * fan,
    lift: 0,
  };
}

function Masthead({ m }: { m: Issue }) {
  const c = { color: m.ink };
  if (m.look === "block") return <span className="absolute inset-x-[12px] top-[6px] block text-left font-sans text-[84px] font-black uppercase leading-[0.86] tracking-[-0.07em]" style={c}>{m.name}</span>;
  if (m.look === "italic") return <span className="absolute inset-x-0 top-[10px] block text-center font-serif text-[70px] italic leading-none tracking-[-0.03em]" style={c}>{m.name}</span>;
  if (m.look === "mono")
    return (
      <span className="absolute inset-x-[14px] top-[14px] block border-b border-white/80 pb-[9px] text-left font-mono text-[25px] font-medium uppercase leading-none tracking-[0.36em]" style={c}>
        {m.name}
      </span>
    );
  if (m.look === "serif") return <span className="absolute inset-x-[12px] top-[2px] block text-left font-serif text-[82px] lowercase leading-none tracking-[-0.06em]" style={c}>{m.name}</span>;
  if (m.look === "wide") return <span className="absolute inset-x-0 top-[16px] block text-center font-sans text-[30px] font-light uppercase leading-none tracking-[0.3em]" style={{ ...c, textIndent: "0.3em" }}>{m.name}</span>;
  return <span className="absolute left-[12px] top-[8px] block w-[110px] break-all text-left font-sans text-[66px] font-black uppercase leading-[0.8] tracking-[-0.05em]" style={c}>{m.name}</span>;
}

function Magazine({ m, i, L, fan, held, covered, reduce, rx, rz, onPress }: { m: Issue; i: number; L: Layout; fan: number; held: boolean; covered: boolean; reduce: boolean; rx: MotionValue<number>; rz: MotionValue<number>; onPress: () => void }) {
  const to = place(i, fan, held, L);
  // issues higher in the pile are on looser springs, so they trail the ones beneath
  const cfg = { stiffness: 190 - i * 17, damping: 19 - i * 0.6, mass: 1 };
  const sx = useSpring(to.x, cfg);
  const sy = useSpring(to.y, cfg);
  const sz = useSpring(to.z, { stiffness: 150 - i * 8, damping: 15, mass: 1 });
  const sr = useSpring(to.r, cfg);
  const st = useSpring(to.tilt, cfg);
  const sl = useSpring(to.lift, { stiffness: 110, damping: 13, mass: 1 });
  useEffect(() => {
    const pairs = [[sx, to.x], [sy, to.y], [sz, to.z], [sr, to.r], [st, to.tilt], [sl, to.lift]] as const;
    pairs.forEach(([s, v]) => (reduce ? s.jump(v) : s.set(v)));
  }, [reduce, sl, sr, st, sx, sy, sz, to.lift, to.r, to.tilt, to.x, to.y, to.z]);

  const transform = useTransform([sx, sy, sz, sr, st, sl], ([x, y, z, r, t, l]: number[]) => `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateZ(${r.toFixed(2)}deg) rotateY(${t.toFixed(2)}deg) rotateX(${l.toFixed(2)}deg)`);
  const shadow = useTransform([sx, sy, sz, sr], ([x, y, z, r]: number[]) => `translate3d(${(x + z * 0.3).toFixed(1)}px, ${(y + z * 0.46).toFixed(1)}px, 0.4px) rotateZ(${r.toFixed(2)}deg) scale(${(1 + z / 700).toFixed(3)})`);
  const shadowFade = useTransform(sz, (z) => 0.62 - Math.min(0.34, z / 520));
  const gloss = useTransform(sl, (l) => `${(120 + l * 3.4).toFixed(1)}% 0`);
  // where the next issue's bound edge crosses this cover, in this cover's own pixels
  const k = i - (issues.length - 1) / 2;
  const [dx, dy] = spin(L.step, 5 * (2 * k + 1), -TURN - k * L.sweep);
  const edge = [W / 2 + dx - (W / 2) * Math.cos((L.sweep * Math.PI) / 180), H / 2 + dy - (W / 2) * Math.sin((L.sweep * Math.PI) / 180)];
  const base = { left: L.cx - W / 2, top: L.cy - H / 2, width: W, height: H } as const;

  // a held issue is painted over the rest, and keeps that place until it has landed again
  const [above, setAbove] = useState(held);
  useEffect(() => {
    if (held) {
      setAbove(true);
      return;
    }
    const t = window.setTimeout(() => setAbove(false), reduce ? 0 : 520);
    return () => window.clearTimeout(t);
  }, [held, reduce]);

  // every issue is its own little 3D world on the same tipped table, stacked in paint order
  return (
    <motion.div className="pointer-events-none absolute inset-0" style={{ zIndex: above ? 40 : i + 1, transformStyle: "preserve-3d", transformOrigin: `${L.cx}px ${L.cy}px`, rotateX: rx, rotateZ: rz }}>
      <motion.div aria-hidden="true" className="pointer-events-none absolute rounded-[6px] bg-black" style={{ ...base, transform: shadow, opacity: shadowFade, filter: "blur(13px)" }} />
      <motion.div className="pointer-events-none absolute" style={{ ...base, transformStyle: "preserve-3d", transform }}>
        <div className={`absolute inset-0 ${held ? "magazine-fan-held" : ""}`} style={{ transformStyle: "preserve-3d" }}>
          {/* underside, then the three cut edges and the glued spine */}
          <div aria-hidden="true" className="absolute inset-0" style={{ backgroundColor: m.tone, backgroundImage: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55))" }} />
          <div aria-hidden="true" className="absolute left-0" style={{ top: H, width: W, height: T, transformOrigin: "50% 0", transform: `translateZ(${T}px) rotateX(-90deg)`, backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.3) 0, rgba(0,0,0,0) 10px), ${pages}` }} />
          <div aria-hidden="true" className="absolute left-0 top-0" style={{ width: W, height: T, transformOrigin: "50% 0", transform: "rotateX(90deg)", backgroundImage: pages }} />
          <div aria-hidden="true" className="absolute top-0" style={{ left: W, width: T, height: H, transformOrigin: "0 50%", transform: `translateZ(${T}px) rotateY(90deg)`, backgroundImage: "repeating-linear-gradient(90deg, #f3f0e9 0 1px, #bdb7aa 1px 1.7px)" }} />
          <div aria-hidden="true" className="absolute left-0 top-0 overflow-hidden" style={{ width: T, height: H, transformOrigin: "0 50%", transform: "rotateY(-90deg)", backgroundColor: m.spine, backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.3), rgba(255,255,255,0.16) 60%, rgba(255,255,255,0.3))" }}>
            <span className="absolute left-0 right-0 top-[18px] h-[70px] bg-white/85" />
            <span className="absolute bottom-[16px] left-0 right-0 h-[26px] bg-white/60" />
          </div>
          {/* cover */}
          <button
            type="button"
            onClick={onPress}
            aria-pressed={held}
            aria-label={`${m.name} ${m.no}, ${m.line}`}
            className="pointer-events-auto absolute inset-0 block cursor-pointer overflow-hidden rounded-r-[2px] outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white"
            style={{ transform: `translateZ(${T}px)`, backgroundColor: m.tone }}
          >
            <img src={m.photo} alt={m.alt} draggable={false} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: m.focus }} />
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[42%]" style={{ background: m.look === "serif" ? "none" : "linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0))" }} />
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[38%]" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.5), rgba(0,0,0,0))" }} />
            <Masthead m={m} />
            <span className="absolute bottom-[14px] left-[14px] right-[78px] block text-left text-white">
              <span className="block font-mono text-[7.5px] uppercase tracking-[0.24em] text-white/90">
                {m.no} / {m.season}
              </span>
              <span className="mt-[5px] block font-sans text-[15px] font-bold leading-[1.08] tracking-[-0.01em]">{m.line}</span>
              <span className="mt-[4px] block font-serif text-[10px] italic leading-[1.25] text-white/90">{m.second}</span>
            </span>
            {/* a plain price box with rules standing in for the code strip */}
            <span aria-hidden="true" className="absolute bottom-[14px] right-[12px] block h-[34px] w-[52px] bg-white p-[4px]">
              <span className="block h-[18px] w-full" style={{ backgroundImage: "repeating-linear-gradient(90deg, #111 0 1px, #fff 1px 2px, #111 2px 4px, #fff 4px 5px, #111 5px 6px, #fff 6px 8.5px)" }} />
              <span className="mt-[2px] block text-center font-mono text-[5.5px] leading-none tracking-[0.12em] text-black">12.00</span>
            </span>
            {/* the shadow the next issue in the fan drops along its bound edge */}
            <span aria-hidden="true" className="absolute transition-opacity duration-300" style={{ left: edge[0] - 26, top: edge[1] - (H + 160) / 2, width: 26, height: H + 160, transformOrigin: "100% 50%", transform: `rotate(${L.sweep}deg)`, opacity: covered && !held ? fan * fan : 0, background: "linear-gradient(90deg, rgba(0,0,0,0), rgba(0,0,0,0.12) 45%, rgba(0,0,0,0.5))" }} />
            {/* the crease beside the glued spine, the sheen of coated stock, a bright cut edge */}
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[14px]" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.3) 0, rgba(255,255,255,0.05) 4px, rgba(0,0,0,0.3) 7px, rgba(0,0,0,0) 14px)" }} />
            <motion.span aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: "linear-gradient(112deg, rgba(255,255,255,0) 34%, rgba(255,255,255,0.1) 42%, rgba(255,255,255,0.42) 50%, rgba(255,255,255,0.1) 58%, rgba(255,255,255,0) 66%)", backgroundSize: "260% 100%", backgroundPosition: gloss, backgroundRepeat: "no-repeat" }} />
            <span aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(150deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.2))", boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.35)" }} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MagazineStackFanGallery() {
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [small, setSmall] = useState(false);
  const [fan, setFan] = useState(1);
  const [held, setHeld] = useState<number | null>(3);
  const idle = useRef({ paused: false, touched: false, scale: 1 });
  const drag = useRef({ on: false, x: 0, from: 1, moved: 0 });
  const L = small ? SMALL : WIDE;
  const px = useSpring(0, { stiffness: 50, damping: 14 });
  const py = useSpring(0, { stiffness: 50, damping: 14 });
  const rz = useTransform(px, (v) => TURN + v * 3.2);
  const rx = useTransform(py, (v) => TIP - v * 2.4);

  const press = useCallback(
    (i: number) => {
      idle.current.touched = true;
      if (drag.current.moved > 8) return;
      if (fan < 0.5) {
        setFan(1);
        return;
      }
      setHeld((h) => (h === i ? null : i));
    },
    [fan],
  );

  // self-playing demo: put the held issue down, square the pile, fan it again, pick up another
  useEffect(() => {
    if (reduce) return;
    let step = 0;
    let next = 3;
    let timer = 0;
    const plan = [3500, 1100, 1700, 1300];
    const tick = () => {
      const s = idle.current;
      if (s.touched) return;
      if (!s.paused && !document.hidden) {
        const phase = step % 4;
        if (phase === 0) setHeld(null);
        if (phase === 1) setFan(0);
        if (phase === 2) setFan(1);
        if (phase === 3) {
          next = (next + 4) % issues.length;
          setHeld(next);
        }
        step += 1;
      }
      timer = window.setTimeout(tick, plan[step % 4]);
    };
    timer = window.setTimeout(tick, plan[0]);
    return () => window.clearTimeout(timer);
  }, [reduce]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    if (!wrap || !scene) return;
    const measure = () => {
      const isSmall = wrap.clientWidth < 700;
      const lay = isSmall ? SMALL : WIDE;
      setSmall(isSmall);
      const sc = Math.min(1.1, wrap.clientWidth / lay.W);
      idle.current.scale = sc;
      wrap.style.height = `${Math.round(lay.H * sc)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const shown = held === null ? null : issues[held];
  const piled = fan < 0.5;

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: TABLE }}>
      <style>{`@keyframes magazine-stack-gallery-that-fans-out-hold { 0%, 100% { transform: translateZ(0) rotateZ(-0.5deg) rotateY(-1.4deg); } 50% { transform: translateZ(9px) rotateZ(0.5deg) rotateY(1.6deg); } }
.magazine-fan-held { animation: magazine-stack-gallery-that-fans-out-hold 4.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .magazine-fan-held { animation: none; } }`}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage: `radial-gradient(70% 62% at 50% 56%, #37323d 0%, #201d25 44%, #0d0c10 100%), ${grain}`, backgroundBlendMode: "screen" }} />
      <div
        ref={wrapRef}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d.on) {
            const dx = e.clientX - d.x;
            d.moved = Math.max(d.moved, Math.abs(dx));
            if (d.moved > 8) {
              setHeld(null);
              setFan(Math.min(1, Math.max(0, d.from + dx / (360 * idle.current.scale))));
            }
          }
          if (reduce || e.pointerType === "touch") return;
          const r = e.currentTarget.getBoundingClientRect();
          px.set(((e.clientX - r.left) / r.width) * 2 - 1);
          py.set(((e.clientY - r.top) / r.height) * 2 - 1);
        }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          idle.current.touched = true;
          drag.current = { on: true, x: e.clientX, from: fan, moved: 0 };
        }}
        onPointerUp={() => {
          const d = drag.current;
          if (d.on && d.moved > 8) setFan((f) => (f > 0.5 ? 1 : 0));
          d.on = false;
          // the press that ends a drag still reaches the cover under it: let that one pass, then forget the drag
          window.setTimeout(() => (d.moved = 0), 0);
        }}
        onPointerCancel={() => (drag.current.on = false)}
        onPointerEnter={() => (idle.current.paused = true)}
        onPointerLeave={() => {
          idle.current.paused = false;
          drag.current.on = false;
          px.set(0);
          py.set(0);
        }}
        onFocus={() => (idle.current.paused = true)}
        onBlur={() => (idle.current.paused = false)}
        className="relative mx-auto w-full touch-pan-y overflow-hidden"
        style={{ height: WIDE.H }}
      >
        <div ref={sceneRef} className="absolute left-1/2 top-0 select-none" style={{ width: L.W, height: L.H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "1900px", perspectiveOrigin: "50% 34%" }}>
          {issues.map((m, i) => (
            <Magazine key={m.name} m={m} i={i} L={L} fan={fan} held={held === i} covered={i < issues.length - 1 && held !== i + 1} reduce={reduce} rx={rx} rz={rz} onPress={() => press(i)} />
          ))}
        </div>

        <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-4 sm:inset-x-8 sm:bottom-7">
          <p aria-live="polite" className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-stone-400">
            <span className="text-white">{shown ? `${shown.name} ${shown.no} / ${shown.line}` : piled ? `${issues.length} issues in the pile` : `${issues.length} issues on the table`}</span>
            <span className="block">{piled ? "Press the pile or drag right to fan it" : shown ? "Press it again to put it down" : "Press a cover to pick it up"}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              idle.current.touched = true;
              setHeld(null);
              setFan(piled ? 1 : 0);
            }}
            aria-pressed={!piled}
            className="min-h-[40px] shrink-0 rounded-full border border-white/30 bg-white/10 px-4 font-mono text-[11px] uppercase tracking-[0.18em] text-white outline-none transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
          >
            {piled ? "Fan out" : "Stack"}
          </button>
        </div>
      </div>
    </section>
  );
}

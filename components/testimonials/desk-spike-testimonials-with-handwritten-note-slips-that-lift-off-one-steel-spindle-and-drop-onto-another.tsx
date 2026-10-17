import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** One slip per client. They start on the left spike in this order, first one on top. */
const notes = [
  {
    name: "Arjun Mehta",
    company: "Mehta Optics",
    quote: "I asked for a simple page. I got a simple page. You would be amazed how rare that is.",
    paper: "#fbeeb4",
    photo: { src: "https://images.pexels.com/photos/15241179/pexels-photo-15241179.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Young man in a white t-shirt in front of a pink lit wall", tone: "#c2559a", focus: "50% 38%" },
  },
  {
    name: "Clara Voss",
    company: "Voss Joinery",
    quote: "You built a joiner's site that somehow smells of sawdust. The first enquiry was for a staircase.",
    paper: "#fdfaf1",
    photo: { src: "https://images.pexels.com/photos/18490818/pexels-photo-18490818.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Woman in a denim dress and silver necklace leaning against a mustard wall", tone: "#a8851e", focus: "55% 26%" },
  },
  {
    name: "Ingrid Solberg",
    company: "Solberg Yarn",
    quote: "My daughter said the shop looked like me. Best review I have had since I opened the place.",
    paper: "#f8d5da",
    photo: { src: "https://images.pexels.com/photos/7544773/pexels-photo-7544773.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Older woman with long grey hair in a green dress talking on a phone against a blue backdrop", tone: "#1f4f7a", focus: "45% 18%" },
  },
  {
    name: "Walter Finch",
    company: "Finch and Daughter, Tailors",
    quote: "Forty years of cutting cloth and nobody had ever measured my business this carefully.",
    paper: "#d5ecd8",
    photo: { src: "https://images.pexels.com/photos/33041187/pexels-photo-33041187.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Elderly man with a white beard in an orange jacket and scarf holding a straw hat", tone: "#4a2f22", focus: "50% 22%" },
  },
  {
    name: "Paloma Reyes",
    company: "Casa Reyes Hats",
    quote: "They kept every hat, kept the mess I like, and somehow the checkout takes one thumb.",
    paper: "#d6e6f6",
    photo: { src: "https://images.pexels.com/photos/18506131/pexels-photo-18506131.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Woman with curly hair holding a black hat on her head, sitting against an orange backdrop", tone: "#e2660c", focus: "50% 22%" },
  },
  {
    name: "Sana Qureshi",
    company: "Loop Denim Repair",
    quote: "Launch day was so quiet I thought it had broken. It had just worked the first time.",
    paper: "#f7e2cc",
    photo: { src: "https://images.pexels.com/photos/34366695/pexels-photo-34366695.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Woman looking over the raised collar of a denim jacket against a red backdrop", tone: "#b3141c", focus: "40% 30%" },
  },
];
const TURNS = [-19, 13, -7, 26, -13, 8]; // how each slip happens to sit on a spike, in degrees

// A slip is drawn at reading size. Everything on the desk lives on a plane tipped away by TILT.
const PW = 300;
const PH = 420;
const HOLE_X = 150;
const HOLE_Y = 196;
const TILT = 60;
const GAP = 5; // rise of the pile per slip
const WIDE = { w: 1100, h: 660, gy: 500, spx: 378, kit: 1.1, small: 0.47, big: 1, cy: 290 };
const TALL = { w: 400, h: 740, gy: 630, spx: 108, kit: 0.6, small: 0.47, big: 0.9, cy: 236 };
const SPIKE_H = 250;
const BASE_R = 94;
const BASE_H = 17;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);
const rad = (d: number) => (d * Math.PI) / 180;
const HAND = `"Bradley Hand", "Segoe Print", "Noteworthy", "Marker Felt", cursive`;
const svg = (s: string) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const FIBRE = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='p' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='4' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0 0.1  0 0 0 0.5 -0.16'/></filter><rect width='160' height='160' filter='url(#p)'/></svg>`,
);

// sx is which spike the slip is over (-1 left, 1 right, in between while it crosses), dest is the one it belongs on
type Slip = { h: number; hv: number; u: number; uv: number; rot: number; rv: number; sx: number; sxv: number; dest: number; held: boolean; landed: boolean };
type Layout = typeof WIDE;

const levelOf = (k: number, side: number) => (side > 0 ? k : notes.length - 1 - k);
const restH = (k: number, side: number, L: Layout) => (BASE_H + 5 + levelOf(k, side) * GAP) * L.kit;

export default function DeskSpikeNotes() {
  const reduce = !!useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const slipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shadowRef = useRef<HTMLSpanElement>(null);
  const [tall, setTall] = useState(false);
  // slips before `at` are on the right spike, slips after it on the left, and slip `at` is in the hand once `holding`
  const [at, setAt] = useState(1);
  const [holding, setHolding] = useState(reduce);
  const where = useRef({ at: 1, holding: reduce });
  const sim = useRef<Slip[]>(notes.map((_, k) => ({ h: restH(k, k < 1 ? 1 : -1, WIDE), hv: 0, u: reduce && k === 1 ? 1 : 0, uv: 0, rot: TURNS[k], rv: 0, sx: k < 1 ? 1 : -1, sxv: 0, dest: k < 1 ? 1 : -1, held: reduce && k === 1, landed: true })));
  const env = useRef({ scale: 1, layout: WIDE as Layout, touched: false, inside: false, visible: true, wake: () => {} });

  const paint = useCallback((k: number) => {
    const el = slipRefs.current[k];
    if (!el) return;
    const L = env.current.layout;
    const s = sim.current[k];
    const e = ease(clamp(s.u, 0, 1));
    // where the hole has to be for the slip to sit centred and facing you
    const hx = k % 2 ? 6 : -6;
    const hz = (L.gy - L.cy + (PH / 2 - HOLE_Y) * L.big) / Math.sin(rad(TILT));
    const x = lerp(s.sx * L.spx, hx, e);
    const z = lerp(s.h, hz, e) + Math.sin(e * Math.PI) * 34 * L.kit;
    const size = lerp(L.small * L.kit, L.big, e);
    const turn = lerp(s.rot, k % 2 ? 1.6 : -1.8, e);
    // it rattles on the steel while it travels along the spike
    const rattle = (1 - e) * clamp(s.hv / 60, -1, 1) * Math.sin(s.h * 0.16) * 7;
    el.style.transform = `translate3d(${x.toFixed(2)}px, 0px, ${z.toFixed(2)}px) rotateX(${(-TILT * e).toFixed(2)}deg) rotateZ(${turn.toFixed(2)}deg) rotateY(${rattle.toFixed(2)}deg) scale(${size.toFixed(4)})`;
    el.style.setProperty("--lit", e.toFixed(3));
    // the slip in the hand throws a soft shadow on the pad below it
    if (shadowRef.current) shadowRef.current.style.opacity = Math.max(...sim.current.map((o) => clamp(o.u, 0, 1))).toFixed(3);
    // slips further down a pile sit in the shade of the ones above
    const w = where.current;
    const deep = s.dest > 0 ? w.at - 1 - k : k - w.at - (w.holding ? 1 : 0);
    el.style.setProperty("--under", (clamp(deep, 0, 4) * 0.07 * (1 - e)).toFixed(3));
  }, []);

  const go = useCallback(
    (nextAt: number, byHand: boolean) => {
      if (byHand) env.current.touched = true;
      const w = where.current;
      const to = clamp(nextAt, 0, notes.length - 1);
      if (w.holding && to === w.at) return;
      w.at = to;
      w.holding = true;
      setAt(to);
      setHolding(true);
      const L = env.current.layout;
      sim.current.forEach((s, k) => {
        s.held = k === to;
        if (!s.held) {
          const dest = k < to ? 1 : -1;
          if (s.u > 0.02 || s.dest !== dest) s.landed = false;
          s.dest = dest;
        } else s.landed = false;
        if (reduce) {
          s.u = s.held ? 1 : 0;
          s.sx = s.dest;
          s.h = restH(k, s.dest, L);
          s.landed = !s.held;
        }
        paint(k);
      });
      env.current.wake();
    },
    [paint, reduce],
  );

  useEffect(() => {
    const root = rootRef.current;
    const scene = sceneRef.current;
    if (!root || !scene) return;
    const measure = () => {
      const narrow = root.clientWidth < 700;
      const L = narrow ? TALL : WIDE;
      const sc = clamp(root.clientWidth / L.w, 0.5, 1.14);
      const was = env.current.layout;
      env.current.scale = sc;
      env.current.layout = L;
      root.style.height = `${Math.round(L.h * sc)}px`;
      scene.style.width = `${L.w}px`;
      scene.style.height = `${L.h}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
      setTall(narrow);
      sim.current.forEach((s, k) => {
        if (was !== L && s.landed) s.h = restH(k, s.dest, L);
        paint(k);
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [paint]);

  useEffect(() => {
    sim.current.forEach((_, k) => paint(k));
  }, [tall, paint]);

  useEffect(() => {
    if (reduce) return;
    const root = rootRef.current;
    if (!root) return;
    const e = env.current;
    let raf = 0;
    let last = performance.now();
    let wait = 0.45;
    let dir = 1;
    let breeze = 2.4;
    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(0.03, (now - last) / 1000);
      last = now;
      const L = e.layout;
      const top = (SPIKE_H + 30) * L.kit;
      if (!e.touched && !e.inside) {
        wait -= dt;
        if (wait < 0) {
          const w = where.current;
          if (!w.holding) go(w.at, false);
          else {
            if (w.at + dir > notes.length - 1 || w.at + dir < 0) dir = -dir;
            go(w.at + dir, false);
          }
          wait = 4.2;
        }
      }
      breeze -= dt;
      sim.current.forEach((s, k) => {
        const floor = restH(k, s.dest, L);
        const lift = () => {
          s.hv += (210 * (top - s.h) - 21 * s.hv) * dt;
          s.h += s.hv * dt;
        };
        if (s.held) {
          if (s.u < 0.04 && s.h < top - 5) lift(); // up the spike first
          else {
            s.h = top;
            s.hv = 0;
            s.uv += (58 * (1 - s.u) - 13.5 * s.uv) * dt;
            s.u += s.uv * dt;
          }
        } else if (s.u > 0.03) {
          // out of the hand and over the tip of the spike it belongs on
          s.h = top;
          s.sx = s.dest;
          s.uv += (64 * (-0.04 - s.u) - 14 * s.uv) * dt;
          s.u = Math.max(0, s.u + s.uv * dt);
          if (s.u <= 0.03) {
            s.u = 0;
            s.uv = 0;
            s.hv = -120 * L.kit;
            s.rv += k % 2 ? 150 : -150;
          }
        } else if (!s.landed && Math.abs(s.sx - s.dest) > 0.01) {
          // caught half way: clear the tip, then cross to the other spike
          if (s.h < top - 5) lift();
          else {
            s.sxv += (46 * (s.dest - s.sx) - 12 * s.sxv) * dt;
            s.sx += s.sxv * dt;
          }
        } else if (!s.landed) {
          // and down the steel under its own weight
          s.sx = s.dest;
          s.sxv = 0;
          s.hv -= 2300 * L.kit * dt;
          s.h += s.hv * dt;
          if (s.h <= floor) {
            s.h = floor;
            s.hv = -s.hv * 0.34;
            if (s.hv < 70 * L.kit) {
              s.hv = 0;
              s.landed = true;
            }
          }
        }
        // every slip can swivel on the steel
        if (breeze < 0 && s.landed && k % 3 === 1) s.rv += (k % 2 ? 1 : -1) * 22;
        s.rv += (34 * (TURNS[k] - s.rot) - 5.5 * s.rv) * dt;
        s.rot += s.rv * dt;
        const still = s.held ? Math.abs(1 - s.u) < 0.0006 && Math.abs(s.uv) < 0.002 : s.landed && Math.abs(s.rv) < 0.05 && Math.abs(TURNS[k] - s.rot) < 0.02;
        if (!still) paint(k);
      });
      if (breeze < 0) breeze = 3.6;
      if (e.visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf && e.visible && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    e.wake = start;
    const io = new IntersectionObserver(([en]) => {
      e.visible = en.isIntersecting;
      start();
    });
    io.observe(root);
    document.addEventListener("visibilitychange", start);
    start();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", start);
      e.wake = () => {};
    };
  }, [go, paint, reduce]);

  // a passing pointer turns the top slips on their spikes
  const onMove = (ev: React.PointerEvent) => {
    const scene = sceneRef.current;
    if (!scene || reduce) return;
    const e = env.current;
    const L = e.layout;
    const r = scene.getBoundingClientRect();
    const x = (ev.clientX - r.left) / e.scale - L.w / 2;
    const y = (ev.clientY - r.top) / e.scale - L.gy;
    const reach = 150 * L.kit;
    sim.current.forEach((s, k) => {
      if (!s.landed || s.held) return;
      if (Math.abs(x - s.dest * L.spx) < reach && Math.abs(y) < reach * 0.6) s.rv += clamp(ev.movementX, -30, 30) * 0.5 * (levelOf(k, s.dest) + 1);
    });
  };

  const L = tall ? TALL : WIDE;
  const now = notes[at];
  const canNext = !holding || at < notes.length - 1;
  const canPrev = holding && at > 0;
  const next = () => go(where.current.holding ? where.current.at + 1 : where.current.at, true);
  const prev = () => go(where.current.at - 1, true);
  const ring = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d27a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1626]";

  return (
    <section ref={rootRef} aria-label="Notes kept on the desk spikes" className="relative w-full select-none overflow-hidden bg-[#0d1626]" style={{ height: WIDE.h, backgroundImage: "radial-gradient(75% 70% at 50% 46%, #2a3f60 0%, #172641 44%, #0a111e 100%)" }} onPointerMove={onMove} onPointerEnter={() => (env.current.inside = true)} onPointerLeave={() => (env.current.inside = false)}>
      <style>{`
        .desk-spike-notes-slip::after { content: ""; position: absolute; inset: 0; background: #060c18; opacity: calc(0.14 * (1 - var(--lit, 0)) + var(--under, 0) * 0.5); pointer-events: none; }
        .desk-spike-notes-slip { box-shadow: 0 2px 5px rgba(0,6,18,0.55); }
      `}</style>

      <div ref={sceneRef} className="absolute left-1/2 top-0 origin-top" style={{ width: L.w, height: L.h, transform: "translateX(-50%)", perspective: 3400, perspectiveOrigin: "50% 42%" }}>
        {/* the desk: everything in here is laid on a plane tipped back from the eye */}
        <div className="absolute" style={{ left: L.w / 2, top: L.gy, width: 0, height: 0, transformStyle: "preserve-3d", transform: `rotateX(${TILT}deg)` }}>
          {/* leather desk pad with a stitched edge */}
          <div aria-hidden="true" className="absolute rounded-[30px]" style={{ left: -(L.spx + 190 * L.kit), top: -230 * L.kit - (tall ? 90 : 0), width: (L.spx + 190 * L.kit) * 2, height: 500 * L.kit + (tall ? 150 : 0), background: "linear-gradient(180deg, #1b2b47, #22365a 60%, #1a2a46)", boxShadow: "inset 0 0 0 1px rgba(160,190,235,0.16), inset 0 2px 0 rgba(160,190,235,0.12), 0 14px 30px rgba(0,0,0,0.55)" }}>
            <span className="absolute inset-[13px] rounded-[20px] border-2 border-dashed border-[#9db4d8]/25" />
          </div>
          <span ref={shadowRef} aria-hidden="true" className="absolute rounded-[50%]" style={{ left: -210 * L.big, top: tall ? -210 : -40, width: 420 * L.big, height: 250, opacity: 0, background: "radial-gradient(closest-side, rgba(0,5,16,0.7), rgba(0,5,16,0.34) 55%, rgba(0,5,16,0) 100%)", transform: "translateZ(1px)" }} />
          {[-1, 1].map((sd) => {
            const R = BASE_R * L.kit;
            const BH = BASE_H * L.kit;
            const SH = SPIKE_H * L.kit;
            const SW = Math.max(4, 6.5 * L.kit);
            return (
              <div key={sd} aria-hidden="true" className="absolute" style={{ transformStyle: "preserve-3d", transform: `translate3d(${sd * L.spx}px, 0, 0)` }}>
                <span className="absolute rounded-full" style={{ left: -R * 3.4, top: -R * 3.4, width: R * 6.8, height: R * 6.8, background: "radial-gradient(closest-side, rgba(120,160,220,0.2), rgba(120,160,220,0) 100%)" }} />
                <span className="absolute rounded-full" style={{ left: -R * 1.5, top: -R * 1.25, width: R * 3.3, height: R * 3.1, background: "radial-gradient(closest-side, rgba(0,4,12,0.85), rgba(0,4,12,0.5) 50%, rgba(0,4,12,0) 100%)" }} />
                <span className="absolute rounded-full" style={{ left: -R, top: -R, width: R * 2, height: R * 2, background: "linear-gradient(90deg, #3a280c 0%, #8a6520 10%, #f3dc8e 28%, #c79a35 42%, #8a6520 68%, #5c4014 88%, #2e1f08 100%)", boxShadow: "inset 0 -3px 3px rgba(30,16,0,0.55)" }} />
                <span className="absolute" style={{ left: -R, top: -(BH - 2), width: R * 2, height: BH - 2, transformOrigin: "50% 100%", transform: "rotateX(-90deg)", background: "linear-gradient(90deg, #3a280c 0%, #8a6520 10%, #f3dc8e 28%, #c79a35 42%, #8a6520 68%, #5c4014 88%, #2e1f08 100%)" }} />
                <span className="absolute rounded-full" style={{ left: -R, top: -R, width: R * 2, height: R * 2, transform: `translateZ(${BH}px)`, background: "radial-gradient(circle, rgba(60,36,4,0) 0 62%, rgba(60,36,4,0.3) 64%, rgba(255,240,190,0.45) 67%, rgba(60,36,4,0) 71%, rgba(60,36,4,0) 90%, rgba(255,244,200,0.7) 96%, rgba(120,84,20,0.6) 100%), conic-gradient(from 20deg, #b88a2c, #f6e3a1 9%, #c39733 20%, #8f6a1f 31%, #e9cf80 44%, #b3862a 55%, #f1da93 66%, #9b7423 78%, #dcbf6c 90%, #b88a2c)" }} />
                <span className="absolute rounded-full" style={{ left: -R * 0.24, top: -R * 0.24, width: R * 0.48, height: R * 0.48, transform: `translateZ(${BH + 1}px)`, background: "radial-gradient(circle at 40% 35%, #fff3c4, #c79a35 45%, #6b4a12 100%)", boxShadow: "0 2px 3px rgba(40,20,0,0.6)" }} />
                <span className="absolute" style={{ left: -SW / 2, top: -SH, width: SW, height: SH, transformOrigin: "50% 100%", transform: `translateZ(${BH}px) rotateX(-90deg)`, background: "linear-gradient(90deg, #23262b 0%, #7d828a 16%, #ffffff 34%, #dfe3e8 42%, #555960 62%, #1e2126 78%, #8b9098 92%, #2a2d32 100%)", clipPath: "polygon(50% 0, 60% 6%, 100% 30%, 100% 100%, 0 100%, 0 30%, 40% 6%)" }} />
              </div>
            );
          })}

          {notes.map((n, k) => (
            <div key={n.name} ref={(el) => void (slipRefs.current[k] = el)} aria-hidden="true" className="desk-spike-notes-slip absolute overflow-hidden rounded-[3px]" style={{ left: -HOLE_X, top: -HOLE_Y, width: PW, height: PH, transformOrigin: `${HOLE_X}px ${HOLE_Y}px`, transform: `translate3d(${(k < 1 ? 1 : -1) * L.spx}px, 0px, ${restH(k, k < 1 ? 1 : -1, L)}px) rotateZ(${TURNS[k]}deg) scale(${L.small * L.kit})`, backgroundColor: n.paper, backgroundImage: `${FIBRE}, linear-gradient(140deg, rgba(255,255,255,0.5), rgba(255,255,255,0) 40%, rgba(120,80,30,0.14))` }}>
              <div className="absolute inset-x-[20px] top-[18px] flex items-end justify-between border-b-2 border-[#b3321f] pb-[6px] text-[#b3321f]">
                <span className="text-[17px] font-black uppercase leading-none tracking-[0.14em]">Kind word</span>
                <span className="font-mono text-[11px] font-bold leading-none tracking-[0.1em]">No. {String(214 + k * 7).padStart(4, "0")}</span>
              </div>
              <div className="absolute left-[20px] top-[58px] h-[122px] w-[98px] -rotate-[2.5deg] bg-white p-[5px]" style={{ boxShadow: "0 1px 2px rgba(40,20,0,0.45), 0 5px 9px -4px rgba(40,20,0,0.4)" }}>
                <div className="h-full w-full overflow-hidden" style={{ background: n.photo.tone }}>
                  <img src={n.photo.src} alt="" width={88} height={112} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: n.photo.focus }} />
                </div>
                <span className="absolute -top-[4px] left-[38px] h-[5px] w-[22px] rounded-[1.5px]" style={{ background: "linear-gradient(180deg, #f5f7fa, #9aa0a8 55%, #5d6168)", boxShadow: "0 1px 1px rgba(0,0,0,0.5)" }} />
              </div>
              <div className="absolute left-[136px] right-[18px] top-[64px]">
                <p className="text-[8.5px] font-bold uppercase tracking-[0.26em] text-[#b3321f]">From</p>
                <p className="mt-[1px] border-b border-[#b3321f]/40 pb-[1px] text-[21px] leading-[28px] text-[#16224e]" style={{ fontFamily: HAND }}>{n.name}</p>
                <p className="mt-[9px] text-[8.5px] font-bold uppercase tracking-[0.26em] text-[#b3321f]">Of</p>
                <p className="mt-[1px] border-b border-[#b3321f]/40 pb-[1px] text-[16px] leading-[24px] text-[#16224e]" style={{ fontFamily: HAND }}>{n.company}</p>
              </div>
              {/* where the spike went through */}
              <span className="absolute h-[9px] w-[9px] rounded-full bg-[#120d0a]" style={{ left: HOLE_X - 4.5, top: HOLE_Y - 4.5, boxShadow: "0 1px 0 rgba(255,255,255,0.7), inset 0 1px 2px #000" }} />
              <span className="absolute h-[1.5px] w-[9px] rounded-full bg-[#3a2a1c]/60" style={{ left: HOLE_X + 4, top: HOLE_Y + 1, transform: "rotate(24deg)", transformOrigin: "0 50%" }} />
              <p className="absolute left-[22px] right-[18px] top-[214px] text-[19.5px] leading-[31px] text-[#16224e]" style={{ fontFamily: HAND, backgroundImage: "linear-gradient(rgba(179,50,31,0) 30px, rgba(179,50,31,0.28) 30px)", backgroundSize: "100% 31px", minHeight: 155 }}>
                {n.quote}
              </p>
              <p className="absolute bottom-[14px] left-[22px] right-[18px] flex justify-between text-[7.5px] font-bold uppercase tracking-[0.24em] text-[#b3321f]/80">
                <span>File copy</span>
                <span>Keep on the spike</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* pressing a pile is a shortcut for the pointer; the arrow buttons below are the real controls */}
      <div aria-hidden="true" onClick={() => canNext && next()} className={`absolute bottom-16 left-0 top-0 w-[30%] ${canNext ? "cursor-pointer" : ""}`} />
      <div aria-hidden="true" onClick={() => canPrev && prev()} className={`absolute bottom-16 right-0 top-0 w-[30%] ${canPrev ? "cursor-pointer" : ""}`} />

      <p className="pointer-events-none absolute bottom-4 left-5 text-[10px] font-bold uppercase leading-relaxed tracking-[0.22em] text-[#f1f4f9]">
        Spike file
        <span className="hidden font-medium text-[#b9c6da] sm:block">Read on the left, done on the right</span>
      </p>
      <div className="absolute bottom-4 right-5 flex gap-2">
        <button type="button" onClick={prev} disabled={!canPrev} aria-label="Previous note" className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-35 ${ring}`}>
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </button>
        <button type="button" onClick={next} disabled={!canNext} aria-label="Next note" className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-35 ${ring}`}>
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <figure className="sr-only" aria-live="polite">
        {holding && (
          <>
            <blockquote>{now.quote}</blockquote>
            <figcaption>
              {now.name}, {now.company}
            </figcaption>
          </>
        )}
      </figure>
    </section>
  );
}

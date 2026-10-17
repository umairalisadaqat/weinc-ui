import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The shop's name on the bag, and what drops into it, in order. Sizes are the cartons in design pixels. */
const shop = { name: "Pallant", line: "Objects for the house" };
const goods = [
  { name: "Sea glass frames", price: 64, w: 112, h: 60, d: 88, x: -48, rest: 0, turn: 0, card: "#12a6a6", kg: 0.6, src: "https://images.pexels.com/photos/20093366/pexels-photo-20093366.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "Green sunglasses resting on a pink roll against a turquoise wall", focus: "50% 38%" },
  { name: "Bottle vase pair", price: 88, w: 100, h: 150, d: 84, x: 56, rest: 0, turn: 0, card: "#c23f93", kg: 1.3, src: "https://images.pexels.com/photos/34775286/pexels-photo-34775286.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "Two white ceramic vases against a pink wall on a blue table", focus: "40% 70%" },
  { name: "Marbled silk square", price: 72, w: 112, h: 44, d: 86, x: -48, rest: 60, turn: 0, card: "#e63f8f", kg: 0.4, src: "https://images.pexels.com/photos/1561020/pexels-photo-1561020.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "Marbled paint in pink, mint green and white", focus: "50% 50%" },
  { name: "Hand wash duo", price: 38, w: 106, h: 204, d: 78, x: -50, rest: 104, turn: -3, card: "#1f2c63", kg: 1.1, src: "https://images.pexels.com/photos/4176566/pexels-photo-4176566.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "Two cream pump bottles on an orange table in front of a red wall", focus: "55% 78%" },
  { name: "Stem vase", price: 46, w: 86, h: 236, d: 62, x: 57, rest: 150, turn: 4, card: "#5ba9c4", kg: 0.9, src: "https://images.pexels.com/photos/7486841/pexels-photo-7486841.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "Single calla lily in a small pink vase in front of an orange panel", focus: "40% 50%" },
];

// Design pixels: x across the bag, y up from the table, z toward you.
const BW = 252;
const BH = 282;
const BD = 112;
const STRIPS = 18; // the front is this many panels so it can belly out
const CUFF = 30; // the turned-over band at the mouth
const SCENE_W = 900;
const SCENE_H = 730;
const FLOOR = 652;
const ZOOM = 1.32;
const DROP = 640; // height a carton falls from
const GRAVITY = 3300;

const RED = "#e5442a";
const RED_SIDE = "#c2331c";
const INSIDE = "#f1e7d6";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const TOOTH = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='5'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.8 0.46'/></filter><rect width='180' height='180' filter='url(#n)'/></svg>")}")`;
// what is printed and creased on the front, drawn once and shared by every panel
const FRONT = [
  `linear-gradient(180deg, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.05) ${CUFF - 1}px, rgba(60,0,0,0.34) ${CUFF}px, rgba(60,0,0,0) ${CUFF + 7}px)`,
  `linear-gradient(180deg, rgba(60,0,0,0) ${BH - 75}px, rgba(60,0,0,0.3) ${BH - 73.5}px, rgba(255,225,205,0.2) ${BH - 72}px, rgba(255,225,205,0) ${BH - 64}px)`,
  `linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 40%, rgba(60,0,0,0.22) 100%)`,
  TOOTH,
].join(", ");

type Spring = { x: number; v: number; to: number; k: number; c: number };
const spring = (x: number, k: number, c: number): Spring => ({ x, v: 0, to: x, k, c });
const pull = (s: Spring, dt: number) => {
  s.v += ((s.to - s.x) * s.k - s.v * s.c) * dt;
  s.x += s.v * dt;
};

function Cord({ back }: { back?: boolean }) {
  const d = "M9 96 C 9 -22, 109 -22, 109 96";
  return (
    <svg width="118" height="100" viewBox="0 0 118 100" className="absolute left-0 top-0 overflow-visible" aria-hidden="true">
      <path d={d} fill="none" stroke="rgba(40,10,0,0.35)" strokeWidth="11" strokeLinecap="round" transform="translate(1.5 2.5)" />
      <path d={d} fill="none" stroke={back ? "#b9a888" : "#d9c9a8"} strokeWidth="9.5" strokeLinecap="round" />
      <path d={d} fill="none" stroke={back ? "#8d7c5e" : "#a8946c"} strokeWidth="9.5" strokeDasharray="1.8 4.6" />
      <path d={d} fill="none" stroke="rgba(255,250,235,0.7)" strokeWidth="2.4" strokeLinecap="round" transform="translate(-2 -1.4)" strokeDasharray="3.2 3.2" />
    </svg>
  );
}

export default function PaperShoppingBag() {
  const reduce = !!useReducedMotion();
  const [count, setCount] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const camRef = useRef<HTMLDivElement>(null);
  const bagRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const stripRefs = useRef<(HTMLDivElement | null)[]>([]);
  const glintRefs = useRef<(HTMLDivElement | null)[]>([]);
  const markRef = useRef<HTMLDivElement>(null);
  const gussetRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cordRefs = useRef<(HTMLDivElement | null)[]>([]);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sim = useRef({
    n: 0,
    items: goods.map(() => ({ on: false, y: DROP, v: 0, landed: false, down: false })),
    belly: spring(0, 150, 9),
    fold: spring(21, 110, 12),
    lean: spring(0, 120, 6.5),
    squash: spring(1, 520, 22),
    cordF: spring(-34, 80, 5),
    cordB: spring(-9, 70, 4.5),
    lift: 0,
    liftV: 0,
    phase: "stand" as "stand" | "lift" | "land",
    camX: 0,
    camY: 0,
    aimX: 0,
    aimY: 0,
    touched: false,
    paused: false,
    wake: () => {},
  });

  const settle = useCallback(() => {
    const s = sim.current;
    let kg = 0;
    let tip = 0;
    goods.forEach((g, i) => {
      if (!s.items[i].down) return;
      kg += g.kg;
      tip += g.kg * g.x;
    });
    s.belly.to = clamp(kg * 6, 0, 25);
    s.fold.to = clamp(21 - kg * 4.4, 3, 21);
    s.lean.to = clamp(tip * 0.085, -3.4, 3.4);
  }, []);

  const add = useCallback(() => {
    const s = sim.current;
    if (s.phase !== "stand") return;
    if (reduce) {
      // no travel: the carton is simply in the bag, and a full bag is simply empty again
      if (s.n >= goods.length) {
        s.items.forEach((it) => (it.on = it.landed = it.down = false));
        s.n = 0;
      } else {
        const it = s.items[s.n];
        it.on = it.landed = it.down = true;
        it.y = goods[s.n].rest;
        s.n += 1;
      }
      setCount(s.n);
      s.wake();
      return;
    }
    if (s.n >= goods.length) {
      s.phase = "lift";
      s.cordF.to = -3;
      s.cordB.to = -1;
      s.wake();
      return;
    }
    const it = s.items[s.n];
    it.on = true;
    it.y = DROP;
    it.v = 0;
    it.landed = false;
    it.down = false;
    s.n += 1;
    setCount(s.n);
    s.wake();
  }, [reduce]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    const cam = camRef.current;
    const bag = bagRef.current;
    if (!wrap || !scene || !cam || !bag) return;
    const s = sim.current;
    let raf = 0;
    let running = false;
    let visible = true;
    let last = 0;
    let still = 0;

    const fit = () => {
      const sc = clamp(wrap.clientWidth / (SCENE_W - 200), 0.5, 1);
      wrap.style.height = `${Math.round(SCENE_H * sc + (sc < 0.8 ? 104 : 64))}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };

    const draw = () => {
      const b = s.belly.x;
      const sw = BW / STRIPS;
      cam.style.transform = `scale3d(${ZOOM}, ${ZOOM}, ${ZOOM}) rotateX(${(-17 + s.camX).toFixed(2)}deg) rotateY(${(-31 + s.camY).toFixed(2)}deg)`;
      bag.style.transform = `translate3d(0, ${(-s.lift).toFixed(1)}px, 0) rotateZ(${s.lean.x.toFixed(2)}deg) scaleY(${s.squash.x.toFixed(4)})`;
      if (shadeRef.current) {
        const k = clamp(1 - s.lift / 420, 0, 1);
        shadeRef.current.style.opacity = (0.2 + k * 0.5).toFixed(3);
        shadeRef.current.style.transform = `translate3d(${(s.lean.x * -5).toFixed(1)}px, 0, 0) rotateX(90deg) scale(${(1.25 - k * 0.25).toFixed(3)})`;
      }
      // the front: a row of panels laid along an arc
      for (let i = 0; i < STRIPS; i++) {
        const el = stripRefs.current[i];
        if (!el) continue;
        const z0 = b * Math.sin((Math.PI * i) / STRIPS);
        const z1 = b * Math.sin((Math.PI * (i + 1)) / STRIPS);
        const out = Math.atan2((z0 + z1) / 2, BH);
        const ang = Math.atan2(z1 - z0, sw);
        el.style.transform = `translate3d(${(-BW / 2 + i * sw - (i ? 1.6 : 0)).toFixed(2)}px, ${-BH}px, ${BD / 2}px) rotateX(${((-out * 180) / Math.PI).toFixed(3)}deg) rotateY(${((-ang * 90) / Math.PI).toFixed(3)}deg)`;
        const g = glintRefs.current[i];
        if (g) g.style.background = ang > 0 ? `rgba(255,232,214,${clamp(ang * 0.5, 0, 0.2).toFixed(3)})` : `rgba(70,0,0,${clamp(-ang * 0.95, 0, 0.36).toFixed(3)})`;
      }
      if (markRef.current) markRef.current.style.transform = `translate3d(-50%, 0, ${(BD / 2 + b * 0.56 + 1).toFixed(2)}px) rotateX(${((-Math.atan2(b, BH) * 180) / Math.PI).toFixed(2)}deg)`;
      // side gussets: two panels each, meeting on a crease that the load pushes flat
      const f = s.fold.x;
      const glen = Math.hypot(BD / 2, f);
      const a1 = (Math.atan2(BD / 2, -f) * 180) / Math.PI;
      const a2 = (Math.atan2(BD / 2, f) * 180) / Math.PI;
      const sides = [
        `translate3d(${BW / 2}px, ${-BH}px, ${BD / 2}px) rotateY(${a1.toFixed(2)}deg)`,
        `translate3d(${(BW / 2 - f).toFixed(2)}px, ${-BH}px, 0) rotateY(${a2.toFixed(2)}deg)`,
        `translate3d(${-BW / 2}px, ${-BH}px, ${BD / 2}px) rotateY(${(180 - a1).toFixed(2)}deg)`,
        `translate3d(${(-BW / 2 + f).toFixed(2)}px, ${-BH}px, 0) rotateY(${(180 - a2).toFixed(2)}deg)`,
      ];
      sides.forEach((t, i) => {
        const el = gussetRefs.current[i];
        if (!el) return;
        el.style.width = `${(glen + 0.5).toFixed(2)}px`;
        el.style.transform = t;
      });
      const hole = BD / 2 + b * Math.sin(Math.PI * 0.3) * 0.95;
      if (cordRefs.current[0]) cordRefs.current[0].style.transform = `translate3d(-59px, ${-BH - 86}px, ${(hole + 1.2).toFixed(2)}px) rotateX(${s.cordF.x.toFixed(2)}deg)`;
      if (cordRefs.current[1]) cordRefs.current[1].style.transform = `translate3d(-59px, ${-BH - 86}px, ${-BD / 2 + 2}px) rotateX(${s.cordB.x.toFixed(2)}deg)`;
      goods.forEach((g, i) => {
        const el = itemRefs.current[i];
        if (!el) return;
        const it = s.items[i];
        el.style.visibility = it.on ? "visible" : "hidden";
        if (!it.on) return;
        const air = clamp((it.y - g.rest) / DROP, 0, 1);
        el.style.transform = `translate3d(${(g.x - g.w / 2 + air * (i % 2 ? 26 : -22)).toFixed(1)}px, ${(-it.y - g.h).toFixed(1)}px, ${(air * 10).toFixed(1)}px) rotateZ(${(g.turn + air * (i % 2 ? 19 : -16)).toFixed(2)}deg) rotateY(${(air * (i % 2 ? -24 : 20)).toFixed(2)}deg)`;
      });
    };

    const step = (dt: number) => {
      let busy = false;
      goods.forEach((g, i) => {
        const it = s.items[i];
        if (!it.on || it.landed) return;
        busy = true;
        it.v -= GRAVITY * dt;
        it.y += it.v * dt;
        if (it.y <= g.rest) {
          it.y = g.rest;
          const hit = -it.v;
          it.down = true;
          settle();
          if (hit <= 260) {
            it.v = 0;
            it.landed = true;
          } else {
            it.v = hit * 0.2;
            const m = g.kg * (hit / 1800);
            s.belly.v += 95 * m;
            s.fold.v -= 60 * m;
            s.squash.v -= 0.5 * m;
            s.lean.v += g.x * 0.36 * m;
            s.cordF.v += 190 * m;
            s.cordB.v -= 150 * m;
          }
        }
      });
      if (s.phase === "lift") {
        busy = true;
        s.liftV += 2600 * dt;
        s.lift += s.liftV * dt;
        s.lean.to = Math.sin(s.lift / 90) * 2.2;
        if (s.lift > 900) {
          s.items.forEach((it) => {
            it.on = it.landed = it.down = false;
          });
          s.n = 0;
          setCount(0);
          settle();
          s.belly.x = 0;
          s.fold.x = 21;
          s.phase = "land";
          s.lift = 640;
          s.liftV = 0;
          s.cordF.to = -34;
          s.cordB.to = -9;
        }
      } else if (s.phase === "land") {
        busy = true;
        s.liftV -= GRAVITY * 0.7 * dt;
        s.lift += s.liftV * dt;
        if (s.lift <= 0) {
          s.lift = 0;
          s.squash.v -= 0.9;
          s.cordF.v += 260;
          s.cordB.v -= 200;
          s.lean.v += 9;
          s.liftV = 0;
          s.phase = "stand";
        }
      }
      [s.belly, s.fold, s.lean, s.squash, s.cordF, s.cordB].forEach((sp) => pull(sp, dt));
      s.cordF.x = clamp(s.cordF.x, -80, 6);
      s.cordB.x = clamp(s.cordB.x, -40, 24);
      s.camX += (s.aimY * -3 - s.camX) * Math.min(1, dt * 5);
      s.camY += (s.aimX * 6 - s.camY) * Math.min(1, dt * 5);
      const moving = Math.abs(s.belly.v) + Math.abs(s.lean.v) + Math.abs(s.cordF.v) + Math.abs(s.cordB.v) + Math.abs(s.squash.v) * 50 + Math.abs(s.aimX * 6 - s.camY) * 4 + Math.abs(s.aimY * -3 - s.camX) * 4;
      return busy || moving > 0.25;
    };

    const frame = (now: number) => {
      const dt = Math.min(0.034, (now - last) / 1000);
      last = now;
      const a = step(dt / 2);
      const awake = step(dt / 2) || a;
      draw();
      still = awake ? 0 : still + 1;
      if (still > 20) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running || reduce || !visible || document.hidden) return;
      running = true;
      still = 0;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const jump = () => {
      settle();
      [s.belly, s.fold, s.lean].forEach((sp) => (sp.x = sp.to));
      draw();
    };
    s.wake = reduce ? jump : start;

    if (reduce) {
      s.items.forEach((it, i) => {
        it.on = it.landed = it.down = true;
        it.y = goods[i].rest;
      });
      s.n = goods.length;
      setCount(goods.length);
      jump();
    }
    fit();
    draw();

    // the demo: drop everything in, wait, carry the bag off and set down an empty one
    let tick = 0;
    const timer = window.setInterval(() => {
      if (reduce || s.touched || s.paused || document.hidden || !visible) return;
      tick += 1;
      if (s.n < goods.length) {
        if (tick >= 1) add();
      } else if (tick > goods.length + 9) {
        add();
        tick = -4;
      }
    }, 480);
    const first = window.setTimeout(() => !reduce && !s.touched && add(), 120);

    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(wrap);
    const vis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", vis);
    start();
    return () => {
      stop();
      window.clearInterval(timer);
      window.clearTimeout(first);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, [add, reduce, settle]);

  const press = () => {
    sim.current.touched = true;
    add();
  };
  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    sim.current.aimX = ((e.clientX - r.left) / r.width) * 2 - 1;
    sim.current.aimY = ((e.clientY - r.top) / r.height) * 2 - 1;
    sim.current.wake();
  };

  const next = goods[count];
  const total = goods.slice(0, count).reduce((sum, g) => sum + g.price, 0);
  const sw = BW / STRIPS;
  const sidePaper = { backgroundColor: RED_SIDE, backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.03) ${CUFF - 1}px, rgba(60,0,0,0.3) ${CUFF}px, rgba(60,0,0,0) ${CUFF + 7}px), ${TOOTH}` } as const;

  return (
    <section className="relative overflow-hidden bg-[#dfe2e6]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(64% 56% at 50% 46%, #f4f5f6 0%, #e3e6ea 52%, #c6cbd3 100%)" }} />
      <div
        ref={wrapRef}
        onPointerMove={onMove}
        onPointerEnter={() => (sim.current.paused = true)}
        onPointerLeave={() => {
          sim.current.paused = false;
          sim.current.aimX = 0;
          sim.current.aimY = 0;
          sim.current.wake();
        }}
        className="relative mx-auto w-full overflow-hidden"
        style={{ height: SCENE_H + 64 }}
      >
        <div ref={sceneRef} className="absolute left-1/2 top-0 select-none" style={{ width: SCENE_W, height: SCENE_H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "2100px", perspectiveOrigin: "50% 30%" }}>
          <div ref={camRef} className="absolute" style={{ left: SCENE_W / 2 - 8, top: FLOOR, width: 0, height: 0, transformStyle: "preserve-3d", transform: `scale3d(${ZOOM}, ${ZOOM}, ${ZOOM}) rotateX(-17deg) rotateY(-31deg)` }}>
            {/* shadow on the table */}
            <div ref={shadeRef} aria-hidden="true" className="absolute" style={{ left: -250, top: -150, width: 520, height: 300, transform: "rotateX(90deg)", background: "radial-gradient(closest-side, rgba(28,30,44,0.62) 0%, rgba(28,30,44,0.38) 42%, rgba(28,30,44,0) 100%)" }} />

            <div aria-hidden="true" className="absolute" style={{ left: -BW / 2 - 6, top: -BD / 2 - 6, width: BW + 30, height: BD + 22, transform: "rotateX(90deg)", background: "rgba(20,22,34,0.55)", filter: "blur(9px)" }} />
            <div ref={bagRef} className="absolute left-0 top-0" style={{ width: 0, height: 0, transformStyle: "preserve-3d", transformOrigin: "0 0" }}>
              {/* back panel and the bottom, seen through the mouth */}
              <div aria-hidden="true" className="absolute" style={{ left: -BW / 2, top: -BH, width: BW, height: BH, transform: `translateZ(${-BD / 2}px)`, backgroundColor: INSIDE, backgroundImage: `linear-gradient(180deg, rgba(70,44,20,0.16) 0%, rgba(60,36,14,0.5) 16%, rgba(40,22,8,0.86) 60%), ${TOOTH}` }} />
              <div aria-hidden="true" className="absolute" style={{ left: -BW / 2 + 24, top: -BD / 2, width: BW - 48, height: BD, transform: "rotateX(90deg)", background: "#3a2414" }} />

              {/* gussets: right pair is the outside you see, left pair is the inside */}
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  ref={(el) => {
                    gussetRefs.current[i] = el;
                  }}
                  aria-hidden="true"
                  className="absolute left-0 top-0"
                  style={{ height: BH, transformOrigin: "0 0", ...(i < 2 ? sidePaper : { backgroundColor: INSIDE, backgroundImage: `linear-gradient(180deg, rgba(90,60,30,0.14) 0%, rgba(60,36,14,0.66) 100%), ${TOOTH}` }) }}
                >
                  {i < 2 && (
                    <>
                      <div className="absolute inset-0" style={{ background: i === 0 ? "linear-gradient(90deg, rgba(255,255,255,0.14), rgba(50,0,0,0.3))" : "linear-gradient(90deg, rgba(50,0,0,0.42), rgba(50,0,0,0.12))" }} />
                      {/* the diagonal folds at the foot of a gusset */}
                      <div className="absolute bottom-0 h-[58px] w-full" style={{ background: i === 0 ? "linear-gradient(to top left, rgba(50,0,0,0) 49.2%, rgba(50,0,0,0.4) 50%, rgba(255,220,200,0.2) 51%, rgba(50,0,0,0) 52%)" : "linear-gradient(to top right, rgba(50,0,0,0) 49.2%, rgba(50,0,0,0.4) 50%, rgba(255,220,200,0.16) 51%, rgba(50,0,0,0) 52%)" }} />
                    </>
                  )}
                </div>
              ))}

              {/* cartons */}
              {goods.map((g, i) => (
                <div
                  key={g.name}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  className="absolute left-0 top-0"
                  style={{ width: g.w, height: g.h, transformStyle: "preserve-3d", visibility: "hidden" }}
                >
                  <div className="absolute inset-0 overflow-hidden" style={{ transform: `translateZ(${g.d / 2}px)`, background: g.card }}>
                    <img src={g.src} alt={g.alt} draggable={false} className="absolute inset-[5px] h-[calc(100%-10px)] w-[calc(100%-10px)] object-cover" style={{ objectPosition: g.focus }} />
                    <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 0 5px rgba(255,255,255,0.94), inset 0 0 0 5.5px rgba(0,0,0,0.25)" }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 34%, rgba(0,0,0,0) 66%, rgba(0,0,0,0.16) 100%)" }} />
                  </div>
                  <div aria-hidden="true" className="absolute inset-0" style={{ transform: `translateZ(${-g.d / 2}px)`, background: g.card }} />
                  <div aria-hidden="true" className="absolute top-0" style={{ left: (g.w - g.d) / 2, width: g.d, height: g.h, transform: `rotateY(90deg) translateZ(${g.w / 2}px)`, backgroundColor: g.card, backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.12), rgba(0,0,0,0.34))" }}>
                    <div className="absolute left-1/2 top-1/2 whitespace-nowrap font-mono text-[6.5px] font-semibold uppercase tracking-[0.24em] text-white/85" style={{ transform: "translate(-50%,-50%) rotate(-90deg)" }}>
                      {g.h > 100 ? g.name : shop.name}
                    </div>
                  </div>
                  <div aria-hidden="true" className="absolute top-0" style={{ left: (g.w - g.d) / 2, width: g.d, height: g.h, transform: `rotateY(-90deg) translateZ(${g.w / 2}px)`, backgroundColor: g.card, backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.3), rgba(0,0,0,0.1))" }} />
                  <div aria-hidden="true" className="absolute left-0" style={{ top: (g.h - g.d) / 2, width: g.w, height: g.d, transform: `rotateX(90deg) translateZ(${g.h / 2}px)`, backgroundColor: g.card, backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0.14))", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.2)" }}>
                    <div className="absolute inset-x-0 top-1/2 h-px bg-black/20" />
                  </div>
                </div>
              ))}

              {/* back cord, front panels, front cord */}
              <div
                ref={(el) => {
                  cordRefs.current[1] = el;
                }}
                aria-hidden="true"
                className="absolute left-0 top-0"
                style={{ width: 118, height: 100, transformOrigin: "50% 96px" }}
              >
                <Cord back />
              </div>
              {Array.from({ length: STRIPS }, (_, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    stripRefs.current[i] = el;
                  }}
                  aria-hidden="true"
                  className="absolute left-0 top-0"
                  style={{ width: sw + 3.2, height: BH, transformOrigin: "0 100%", backgroundColor: RED, backgroundImage: FRONT, backgroundSize: `${BW}px ${BH}px, ${BW}px ${BH}px, ${BW}px ${BH}px, 180px 180px`, backgroundPosition: `${-i * sw}px 0, ${-i * sw}px 0, ${-i * sw}px 0, ${-i * sw}px 0` }}
                >
                  <div
                    ref={(el) => {
                      glintRefs.current[i] = el;
                    }}
                    className="absolute inset-0"
                  />
                  {(i === 5 || i === 12) && (
                    <span className="absolute h-[9px] w-[9px] rounded-full" style={{ top: 10, left: i === 5 ? sw * 0.43 - 4 : sw * 0.57 - 4, background: "radial-gradient(circle at 40% 35%, #2a0c06, #100402)", boxShadow: "0 0 0 1.5px rgba(255,214,190,0.5), 0 1px 0 rgba(255,255,255,0.25)" }} />
                  )}
                </div>
              ))}
              <div ref={markRef} className="pointer-events-none absolute left-0 text-center text-[#fff1e6]" style={{ top: -BH + 112, width: 180 }}>
                <div className="font-serif text-[34px] italic leading-none tracking-[-0.01em]">{shop.name}</div>
                <div className="mt-[9px] font-mono text-[6.5px] font-semibold uppercase tracking-[0.34em] text-[#fff1e6]/80">{shop.line}</div>
              </div>
              <div
                ref={(el) => {
                  cordRefs.current[0] = el;
                }}
                aria-hidden="true"
                className="absolute left-0 top-0"
                style={{ width: 118, height: 100, transformOrigin: "50% 96px" }}
              >
                <Cord />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 sm:bottom-8 sm:left-8 sm:right-8">
          <p className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#5a606b]" aria-live="polite">
            <span className="text-[#16181d]">
              {count} of {goods.length} in the bag
            </span>
            <span className="block">Total £{total}</span>
          </p>
          <button
            type="button"
            onClick={press}
            className="min-h-[40px] max-w-[58%] shrink-0 rounded-full border border-[#16181d]/20 bg-white/70 px-4 py-2 text-right font-mono text-[11px] uppercase leading-snug tracking-[0.16em] text-[#16181d] outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-[#e5442a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#dfe2e6]"
          >
            {next ? `Drop in the ${next.name.toLowerCase()}, £${next.price}` : "Carry it off and start again"}
          </button>
        </div>
      </div>
    </section>
  );
}

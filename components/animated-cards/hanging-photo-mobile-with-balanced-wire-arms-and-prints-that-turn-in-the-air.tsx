import { useCallback, useEffect, useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";

/** The prints, from the heaviest (hung highest, on the long arm) to the lightest. */
const prints = [
  { title: "Spot, signal red", src: "https://images.pexels.com/photos/14598236/pexels-photo-14598236.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Woman in dark sunglasses and a black top in front of a pale spotlight circle on a red wall", focus: "50% 35%", tone: "#b3202a", w: 186, h: 246, rest: -0.4 },
  { title: "Half sun", src: "https://images.pexels.com/photos/7516560/pexels-photo-7516560.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Woman in a red dress standing against a yellow wall with a large red half circle", focus: "50% 40%", tone: "#e0a21a", w: 150, h: 200, rest: 0.34 },
  { title: "Blue on blue", src: "https://images.pexels.com/photos/30755172/pexels-photo-30755172.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Woman in pale blue clothes crouching against a deep blue backdrop", focus: "50% 45%", tone: "#1f4fa3", w: 132, h: 176, rest: -0.26 },
  { title: "Wide brim", src: "https://images.pexels.com/photos/35024256/pexels-photo-35024256.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Person in a pale yellow suit and a wide black hat against a dark red backdrop", focus: "50% 35%", tone: "#6e0f14", w: 118, h: 156, rest: 0.46 },
];

// Design pixels for a 900 wide scene, drawn large and scaled down to fit so it stays sharp.
const W = 900;
const H = 780;
const CEILING = { x: 375, y: -8 };
const PULL = 96; // how far a print can be pulled from where it hangs
const GRAVITY = 0.3; // pixels per step squared, at 120 steps a second
const DAMPING = 0.9986;
const SHADOW = { x: 44, y: 56 };
const EYELET = 13; // how far below a print's top edge its thread ties on
const THICK = 4; // card thickness
const ARMS = [[225, 168], [126, 156], [93, 108]]; // left and right length of each wire arm, top arm first
const PIVOT = 0.3; // weight of a wire's hanging loop
const END = 0.3; // weight of a wire's end loop
const TIE = 0.2; // weight of the knot at a print's eyelet

type Pt = { x: number; y: number; px: number; py: number; w: number };
type Rod = { l: number; p: number; r: number };
type Card = { t: number; m: number; hx: number; hy: number };
type Model = { pts: Pt[]; links: [number, number, number][]; rods: Rod[]; cards: Card[]; threads: [number, number][] };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Three wire arms, each hung from the one above. Arm lengths and print weights are chosen so
 * that weight times arm length matches on both sides of every pivot, which is what makes a
 * real mobile hang level.
 */
function buildModel(): Model {
  const pts: Pt[] = [];
  const links: [number, number, number][] = [];
  const rods: Rod[] = [];
  const cards: Card[] = [];
  const threads: [number, number][] = [];
  const add = (x: number, y: number, mass: number) => pts.push({ x, y, px: x, py: y, w: mass === 0 ? 0 : 1 / mass }) - 1;
  const join = (a: number, b: number) => links.push([a, b, Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y)]);
  const rod = (from: number, thread: number, armL: number, armR: number, rise: number) => {
    const p = add(pts[from].x, pts[from].y + thread, PIVOT);
    const l = add(pts[p].x - armL, pts[p].y + rise, END);
    const r = add(pts[p].x + armR, pts[p].y + rise, END);
    join(from, p);
    join(p, l);
    join(p, r);
    join(l, r);
    threads.push([from, p]);
    rods.push({ l, p, r });
    return { l, r };
  };
  const card = (from: number, thread: number, index: number, mass: number) => {
    const t = add(pts[from].x, pts[from].y + thread, TIE);
    const m = add(pts[t].x, pts[t].y + prints[index].h * 0.5, mass);
    join(from, t);
    join(t, m);
    threads.push([from, t]);
    cards[index] = { t, m, hx: pts[m].x, hy: pts[m].y };
  };
  // work the weights out from the lightest print upward
  const m4 = 1;
  const m3 = ((END + TIE + m4) * ARMS[2][1]) / ARMS[2][0] - END - TIE;
  const massC = PIVOT + 2 * END + 2 * TIE + m3 + m4;
  const m2 = ((END + massC) * ARMS[1][1]) / ARMS[1][0] - END - TIE;
  const massB = PIVOT + 2 * END + TIE + m2 + massC;
  const m1 = ((END + massB) * ARMS[0][1]) / ARMS[0][0] - END - TIE;
  const pin = add(CEILING.x, CEILING.y, 0);
  const a = rod(pin, 99, ARMS[0][0], ARMS[0][1], 33);
  card(a.l, 84, 0, m1);
  const b = rod(a.r, 69, ARMS[1][0], ARMS[1][1], 24);
  card(b.l, 159, 1, m2);
  const c = rod(b.r, 48, ARMS[2][0], ARMS[2][1], 20);
  card(c.l, 186, 2, m3);
  card(c.r, 57, 3, m4);
  return { pts, links, rods, cards, threads };
}

export default function HangingPhotoMobile() {
  const reduce = useReducedMotion();
  const model = useMemo(buildModel, []);
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const slabRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shadeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sheenRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shadowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wireRefs = useRef<(SVGPathElement | null)[]>([]);
  const threadRefs = useRef<(SVGPathElement | null)[]>([]);
  const sim = useRef({
    scale: 1,
    drag: -1,
    tx: 0,
    ty: 0,
    ox: 0,
    oy: 0,
    lastTouch: 0,
    time: 0,
    gust: 1,
    yaw: prints.map((p) => p.rest),
    spin: prints.map(() => 0),
  });

  const breeze = useCallback(
    (strength: number) => {
      const s = sim.current;
      s.gust = -s.gust;
      model.cards.forEach((c, i) => {
        model.pts[c.m].px -= s.gust * strength * (1.05 + 0.33 * i);
        s.spin[i] += s.gust * strength * 0.0006 * (i % 2 ? -1 : 1);
      });
      s.lastTouch = performance.now();
    },
    [model],
  );

  useEffect(() => {
    const root = rootRef.current;
    const scene = sceneRef.current;
    if (!root || !scene) return;
    const s = sim.current;
    const { pts, links, rods, cards, threads } = model;
    let raf = 0;
    let running = false;
    let visible = true;
    let last = 0;
    let acc = 0;

    const fit = () => {
      s.scale = Math.min(1, root.clientWidth / W);
      scene.style.transform = `translateX(-50%) scale(${s.scale})`;
      root.style.height = `${Math.round(Math.max(H * s.scale, 420))}px`;
    };

    const stepOnce = () => {
      s.time += 1 / 120;
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        const vx = clamp((p.x - p.px) * DAMPING, -24, 24);
        const vy = clamp((p.y - p.py) * DAMPING, -24, 24);
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + GRAVITY;
        if (p.y < 8) p.y = 8; // nothing swings up through the ceiling
      }
      for (let it = 0; it < 70; it++) {
        if (s.drag >= 0) {
          const g = pts[cards[s.drag].m];
          g.x += (s.tx - g.x) * 0.3;
          g.y += (s.ty - g.y) * 0.3;
        }
        for (let i = 0; i < links.length; i++) {
          const a = pts[links[i][0]];
          const b = pts[links[i][1]];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 0.0001;
          const sum = a.w + b.w;
          const k = (d - links[i][2]) / d;
          a.x += dx * k * (a.w / sum);
          a.y += dy * k * (a.w / sum);
          b.x -= dx * k * (b.w / sum);
          b.y -= dy * k * (b.w / sum);
        }
      }
      // each print also turns on its thread: the twist in the thread winds it back,
      // moving through the air turns it, and the room is never perfectly still
      for (let i = 0; i < cards.length; i++) {
        const m = pts[cards[i].m];
        const vx = m.x - m.px;
        s.spin[i] += (prints[i].rest - s.yaw[i]) * 0.00008 - s.spin[i] * 0.004 + vx * 0.0003 * (i % 2 ? -1 : 1) + Math.sin(s.time * (0.5 + i * 0.13) + i * 1.9) * 0.000016;
        s.spin[i] = clamp(s.spin[i], -0.06, 0.06);
        s.yaw[i] += s.spin[i];
      }
    };

    const draw = () => {
      for (let i = 0; i < cards.length; i++) {
        const t = pts[cards[i].t];
        const m = pts[cards[i].m];
        const p = prints[i];
        const tilt = (Math.atan2(-(m.x - t.x), m.y - t.y) * 180) / Math.PI;
        const yaw = s.yaw[i];
        const x = t.x - p.w / 2;
        const y = t.y - EYELET;
        const el = cardRefs.current[i];
        if (el) el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${tilt.toFixed(2)}deg)`;
        const slab = slabRefs.current[i];
        if (slab) slab.style.transform = `rotateY(${((yaw * 180) / Math.PI).toFixed(2)}deg)`;
        const facing = Math.cos(yaw);
        const shade = shadeRefs.current[i];
        if (shade) shade.style.opacity = (0.5 * (1 - Math.abs(facing)) + (Math.sin(yaw) > 0 ? 0.07 : 0)).toFixed(3);
        const sheen = sheenRefs.current[i];
        if (sheen) {
          const off = yaw + 0.3;
          sheen.style.opacity = (0.4 * Math.exp(-(off * off) / 0.05)).toFixed(3);
          sheen.style.transform = `translateX(${(off * 160).toFixed(1)}%)`;
        }
        const sh = shadowRefs.current[i];
        if (sh) sh.style.transform = `translate3d(${(x + SHADOW.x).toFixed(2)}px, ${(y + SHADOW.y).toFixed(2)}px, 0) rotate(${tilt.toFixed(2)}deg) scaleX(${Math.max(0.04, Math.abs(facing)).toFixed(3)})`;
      }
      let wires = "";
      let loops = "";
      for (const r of rods) {
        const l = pts[r.l];
        const p = pts[r.p];
        const rr = pts[r.r];
        const cx = 2 * p.x - (l.x + rr.x) / 2;
        const cy = 2 * p.y - (l.y + rr.y) / 2;
        wires += `M${l.x.toFixed(1)} ${l.y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${rr.x.toFixed(1)} ${rr.y.toFixed(1)}`;
        for (const e of [l, rr]) loops += `M${(e.x + 4.6).toFixed(1)} ${(e.y + 4.4).toFixed(1)}a4.6 4.6 0 1 1 -9.2 0a4.6 4.6 0 1 1 9.2 0`;
        loops += `M${(p.x + 4.4).toFixed(1)} ${(p.y - 4.4).toFixed(1)}a4.4 4.4 0 1 1 -8.8 0a4.4 4.4 0 1 1 8.8 0`;
      }
      let lines = "";
      for (const [a, b] of threads) lines += `M${pts[a].x.toFixed(1)} ${pts[a].y.toFixed(1)}L${pts[b].x.toFixed(1)} ${pts[b].y.toFixed(1)}`;
      wireRefs.current.forEach((el, i) => el && el.setAttribute("d", i < 3 ? wires : wires + loops));
      threadRefs.current.forEach((el) => el && el.setAttribute("d", lines));
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      acc += Math.min(0.05, (now - last) / 1000);
      last = now;
      let n = 0;
      while (acc >= 1 / 120 && n < 6) {
        stepOnce();
        acc -= 1 / 120;
        n++;
      }
      if (s.drag < 0 && now - s.lastTouch > 6500) breeze(1.3);
      draw();
    };

    const start = () => {
      if (running || reduce || !visible || document.hidden) return;
      running = true;
      last = performance.now();
      acc = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    fit();
    if (!reduce) {
      // start it already moving, as if someone has just walked past
      breeze(1.7);
      s.lastTouch = performance.now();
    }
    draw();
    const ro = new ResizeObserver(fit);
    ro.observe(root);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(root);
    const vis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", vis);
    start();
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, [reduce, model, breeze]);

  const aim = (e: ReactPointerEvent) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const s = sim.current;
    const r = scene.getBoundingClientRect();
    s.tx = (e.clientX - r.left) / s.scale + s.ox;
    s.ty = (e.clientY - r.top) / s.scale + s.oy;
    if (s.drag >= 0) {
      const home = model.cards[s.drag];
      const dx = s.tx - home.hx;
      const dy = s.ty - home.hy;
      const d = Math.hypot(dx, dy);
      if (d > PULL) {
        s.tx = home.hx + (dx / d) * PULL;
        s.ty = home.hy + (dy / d) * PULL;
      }
    }
  };
  const grab = (i: number) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const s = sim.current;
    const m = model.pts[model.cards[i].m];
    s.ox = 0;
    s.oy = 0;
    aim(e);
    s.ox = m.x - s.tx;
    s.oy = m.y - s.ty;
    s.drag = i;
    aim(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const release = () => {
    sim.current.drag = -1;
    sim.current.lastTouch = performance.now();
  };

  return (
    <div
      ref={rootRef}
      className="relative h-[780px] w-full select-none overflow-hidden bg-[#efeeea]"
      style={{ backgroundImage: "radial-gradient(110% 90% at 30% 8%, #ffffff 0%, #f1f0ec 48%, #dddbd4 100%)" }}
    >
      <div ref={sceneRef} className="absolute left-1/2 top-0 origin-top" style={{ width: W, height: H, transform: "translateX(-50%)", perspective: 1900, perspectiveOrigin: "50% 45%" }}>
        {/* shadows on the wall behind */}
        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible blur-[6px]" width={W} height={H} style={{ transform: `translate(${SHADOW.x}px, ${SHADOW.y}px)` }} aria-hidden="true">
          <path ref={(el) => { wireRefs.current[0] = el; }} fill="none" stroke="#1d1a14" strokeOpacity="0.2" strokeWidth="5" strokeLinecap="round" />
          <path ref={(el) => { threadRefs.current[0] = el; }} fill="none" stroke="#1d1a14" strokeOpacity="0.12" strokeWidth="2" />
        </svg>
        {prints.map((p, i) => (
          <div
            key={p.title}
            ref={(el) => { shadowRefs.current[i] = el; }}
            className="pointer-events-none absolute left-0 top-0 rounded-[3px] bg-[#1d1a14]/25 blur-[18px]"
            style={{ width: p.w, height: p.h, transformOrigin: `50% ${EYELET}px` }}
          />
        ))}

        {/* threads */}
        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={W} height={H} aria-hidden="true">
          <path ref={(el) => { threadRefs.current[1] = el; }} fill="none" stroke="#5c5850" strokeWidth="1.3" />
        </svg>

        {/* the prints */}
        {prints.map((p, i) => (
          <div
            key={p.title}
            ref={(el) => { cardRefs.current[i] = el; }}
            onPointerDown={grab(i)}
            onPointerMove={(e) => sim.current.drag === i && aim(e)}
            onPointerUp={release}
            onPointerCancel={release}
            className="absolute left-0 top-0 cursor-grab touch-none active:cursor-grabbing"
            style={{ width: p.w, height: p.h, transformOrigin: `50% ${EYELET}px`, transformStyle: "preserve-3d" }}
          >
            <div ref={(el) => { slabRefs.current[i] = el; }} className="absolute inset-0" style={{ transformStyle: "preserve-3d", transform: `rotateY(${p.rest}rad)` }}>
              {/* front: the photograph with a white border */}
              <div className="absolute inset-0 overflow-hidden rounded-[2px] bg-[#fbfaf6]" style={{ transform: `translateZ(${THICK / 2}px)`, backfaceVisibility: "hidden", boxShadow: "inset 0 0 0 0.5px rgba(40,36,28,0.28)" }}>
                <div className="absolute inset-x-[9px] bottom-[9px] top-[27px] overflow-hidden" style={{ backgroundColor: p.tone }}>
                  <img src={p.src} alt={p.alt} draggable={false} width={p.w - 18} height={p.h - 36} className="h-full w-full object-cover" style={{ objectPosition: p.focus }} />
                  <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.25)" }} />
                </div>
                <span className="absolute left-[10px] top-[9px] font-mono text-[7.5px] uppercase leading-none tracking-[0.18em] text-[#8a8473]">No. {String(i + 1).padStart(2, "0")}</span>
                <div ref={(el) => { shadeRefs.current[i] = el; }} className="pointer-events-none absolute inset-0 bg-[#14110b]" style={{ opacity: 0 }} />
                <div ref={(el) => { sheenRefs.current[i] = el; }} className="pointer-events-none absolute inset-y-0 left-[20%] w-[60%]" style={{ opacity: 0, background: "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0) 100%)" }} />
              </div>
              {/* back: plain card with the print's number and title */}
              <div className="absolute inset-0 flex flex-col justify-end rounded-[2px] bg-[#e9e5da] p-[14px]" style={{ transform: `rotateY(180deg) translateZ(${THICK / 2}px)`, backfaceVisibility: "hidden", boxShadow: "inset 0 0 0 0.5px rgba(40,36,28,0.3), inset 0 0 30px rgba(60,50,30,0.16)" }}>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6b6455]">No. {String(i + 1).padStart(2, "0")}</span>
                <span className="mt-[4px] font-serif text-[16px] italic leading-tight text-[#2c2820]">{p.title}</span>
              </div>
              {/* the two long edges, so the card has thickness when it turns side on */}
              <div className="absolute top-0 h-full bg-[#cfcabd]" style={{ width: THICK, left: -THICK / 2, transform: "rotateY(90deg)" }} />
              <div className="absolute top-0 h-full bg-[#f4f1e8]" style={{ width: THICK, right: -THICK / 2, transform: "rotateY(90deg)" }} />
              {/* brass eyelet the thread ties through */}
              <div className="absolute h-[13px] w-[13px] rounded-full" style={{ left: "calc(50% - 6.5px)", top: EYELET - 6.5, transform: `translateZ(${THICK / 2 + 0.4}px)`, background: "radial-gradient(circle at 35% 30%, #fff6cf 0%, #d9b458 45%, #8a6519 100%)", boxShadow: "0 0.5px 1px rgba(0,0,0,0.5)", backfaceVisibility: "hidden" }}>
                <div className="absolute inset-[3.8px] rounded-full bg-[#2a251b]" />
              </div>
            </div>
          </div>
        ))}

        {/* wire arms, in front of the threads */}
        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={W} height={H} aria-hidden="true">
          <path ref={(el) => { wireRefs.current[3] = el; }} fill="none" stroke="#17150f" strokeWidth="3.8" strokeLinecap="round" />
          <path ref={(el) => { wireRefs.current[1] = el; }} fill="none" stroke="#8d8573" strokeWidth="1.2" strokeLinecap="round" transform="translate(-0.7 -1.1)" />
          <path ref={(el) => { wireRefs.current[2] = el; }} fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.6" strokeLinecap="round" transform="translate(-0.8 -1.3)" />
        </svg>
      </div>

      <p className="pointer-events-none absolute bottom-6 left-6 font-mono text-[10px] uppercase leading-[1.7] tracking-[0.18em] text-[#77736a]">
        <span className="font-semibold text-[#1d1a14]">Four prints / three wires</span>
        <br />
        Pull one and the rest answer
      </p>
      <button
        type="button"
        onClick={() => breeze(3)}
        aria-label="Send a breeze through the mobile"
        className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full border border-[#1d1a14]/20 bg-white/70 text-[#1d1a14] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1a14] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efeeea]"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2.5 7.5h8.2a2.3 2.3 0 1 0-2.2-3" />
          <path d="M2.5 11h12.3a2.4 2.4 0 1 1-2.3 3.2" />
          <path d="M2.5 14.5h5.5" />
        </svg>
      </button>
    </div>
  );
}

import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/** What is stamped on the fob and engraved on the plate above the hook. */
const room = { number: "12", house: "Larkmoor", floor: "First floor, garden side" };

// Design pixels for a 340 wide scene; the whole scene is scaled to fit.
const W = 340;
const H = 500;
const CX = 170; // centre line the plate and hook sit on
const HOOK = { x: CX - 9, y: 173 }; // the point inside the hook that the ring rests on
const RING_R = 18;
const FOB_W = 88;
const FOB_H = 164;
const FOB_HOLE = { x: 44, y: 18 };
const FOB_LEN = 84; // hole to the fob's centre of weight
const KEY_W = 40;
const KEY_H = 124;
const KEY_HOLE = { x: 20, y: 11 };
const KEY_LEN = 52;
const GRAVITY = 0.27; // pixels per step squared, at 120 steps a second
const DAMPING = 0.9978;
const SHADOW = { x: 16, y: 22 };

type Pt = { x: number; y: number; px: number; py: number; w: number };
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Points: 0 hook (pinned), 1 and 2 where fob and key sit on the ring, 3 fob weight, 4 key weight.
const REST = [
  { x: 0, y: 0, w: 0 },
  { x: -11.5, y: 29.5, w: 1.6 },
  { x: 11.5, y: 29.5, w: 1.6 },
  { x: -11.5, y: 29.5 + FOB_LEN, w: 0.1 },
  { x: 11.5, y: 29.5 + KEY_LEN, w: 0.42 },
];
const LINKS: [number, number][] = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4]];
const LENGTHS = LINKS.map(([a, b]) => Math.hypot(REST[a].x - REST[b].x, REST[a].y - REST[b].y));
// Contact between the two: three spots along the key are tested against the fob's oval outline.
const KEY_BUMPERS = [0.7, 1.35, 2.05]; // as multiples of KEY_LEN from the key's hole
const FOB_MID = FOB_H / 2 - FOB_HOLE.y; // hole to the middle of the oval
const TUCK = 0.8; // how much of the fob's half width the key has to clear; under 1 lets it sit partly behind

function makePoints(angle: number): Pt[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return REST.map((p) => {
    const x = HOOK.x + p.x * c - p.y * s;
    const y = HOOK.y + p.x * s + p.y * c;
    return { x, y, px: x, py: y, w: p.w };
  });
}

function link(a: Pt, b: Pt, len: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 0.0001;
  const sum = a.w + b.w;
  const k = (d - len) / d;
  a.x += dx * k * (a.w / sum);
  a.y += dy * k * (a.w / sum);
  b.x -= dx * k * (b.w / sum);
  b.y -= dy * k * (b.w / sum);
}

const BRASS = "linear-gradient(90deg, #6a4a10 0%, #c79a3c 18%, #fff0b8 36%, #dcb457 52%, #8f6a1c 78%, #5a3e0b 100%)";

export default function HotelKeyFob() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const fobRef = useRef<HTMLDivElement>(null);
  const keyRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);
  const fobShadowRef = useRef<HTMLDivElement>(null);
  const keyShadowRef = useRef<HTMLDivElement>(null);
  const ringShadowRef = useRef<HTMLDivElement>(null);
  const fobEdgeRef = useRef<HTMLDivElement>(null);
  const keyEdgeRef = useRef<SVGGElement>(null);
  const rimRef = useRef<HTMLDivElement>(null);
  const glossRef = useRef<HTMLDivElement>(null);
  const sim = useRef({ pts: makePoints(0), scale: 1, drag: -1, tx: 0, ty: 0, ox: 0, oy: 0, lastTouch: 0, side: 1 });

  const push = useCallback(() => {
    const s = sim.current;
    s.side = -s.side;
    s.pts[3].px -= s.side * 5.2;
    s.pts[4].px -= s.side * 2.4;
    s.lastTouch = performance.now();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const scene = sceneRef.current;
    const fobEl = fobRef.current;
    const keyEl = keyRef.current;
    if (!root || !scene || !fobEl || !keyEl) return;
    const s = sim.current;
    s.pts = makePoints(reduce ? 0 : -0.95);
    let raf = 0;
    let running = false;
    let visible = true;
    let last = 0;
    let acc = 0;

    const fit = () => {
      s.scale = Math.min(1.6, root.clientWidth / W);
      scene.style.transform = `translateX(-50%) scale(${s.scale})`;
      root.style.height = `${Math.round(H * s.scale)}px`;
    };

    const stepOnce = () => {
      const pts = s.pts;
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        const vx = clamp((p.x - p.px) * DAMPING, -36, 36);
        const vy = clamp((p.y - p.py) * DAMPING, -36, 36);
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + GRAVITY;
      }
      const fob = pts[3];
      const key = pts[4];
      for (let it = 0; it < 16; it++) {
        if (s.drag > 0) {
          const g = pts[s.drag];
          g.x += (s.tx - g.x) * 0.35;
          g.y += (s.ty - g.y) * 0.35;
        }
        for (let i = 0; i < LINKS.length; i++) link(pts[LINKS[i][0]], pts[LINKS[i][1]], LENGTHS[i]);
        // the key hangs on one side of the fob, tucked a little way behind its edge, and cannot
        // pass through: measure each key bumper against the fob's oval outline and push apart
        const ax = fob.x - pts[1].x;
        const ay = fob.y - pts[1].y;
        const al = Math.hypot(ax, ay) || 0.0001;
        const ux = ax / al;
        const uy = ay / al;
        for (const at of KEY_BUMPERS) {
          const bx = pts[2].x + (key.x - pts[2].x) * at - pts[1].x;
          const by = pts[2].y + (key.y - pts[2].y) * at - pts[1].y;
          const along = bx * ux + by * uy;
          const side = bx * uy - by * ux;
          const t = (along - FOB_MID) / (FOB_H / 2);
          const half = t > -1 && t < 1 ? (FOB_W / 2) * Math.sqrt(1 - t * t) : 0;
          const need = half * TUCK + 7 - side;
          if (need > 0) {
            const sum = fob.w + key.w;
            key.x += uy * need * (key.w / sum) * 0.7;
            key.y -= ux * need * (key.w / sum) * 0.7;
            fob.x -= uy * need * (fob.w / sum) * 0.7;
            fob.y += ux * need * (fob.w / sum) * 0.7;
          }
        }
      }
    };

    const draw = () => {
      const [, a1, a2, fob, key] = s.pts;
      const rotF = Math.atan2(-(fob.x - a1.x), fob.y - a1.y);
      const rotK = Math.atan2(-(key.x - a2.x), key.y - a2.y);
      const degF = (rotF * 180) / Math.PI;
      const degK = (rotK * 180) / Math.PI;
      const fx = a1.x - FOB_HOLE.x;
      const fy = a1.y - FOB_HOLE.y;
      const kx = a2.x - KEY_HOLE.x;
      const ky = a2.y - KEY_HOLE.y;
      fobEl.style.transform = `translate3d(${fx.toFixed(2)}px, ${fy.toFixed(2)}px, 0) rotate(${degF.toFixed(2)}deg)`;
      keyEl.style.transform = `translate3d(${kx.toFixed(2)}px, ${ky.toFixed(2)}px, 0) rotate(${degK.toFixed(2)}deg)`;
      if (fobShadowRef.current) fobShadowRef.current.style.transform = `translate3d(${(fx + SHADOW.x).toFixed(2)}px, ${(fy + SHADOW.y).toFixed(2)}px, 0) rotate(${degF.toFixed(2)}deg)`;
      if (keyShadowRef.current) keyShadowRef.current.style.transform = `translate3d(${(kx + SHADOW.x * 0.8).toFixed(2)}px, ${(ky + SHADOW.y * 0.8).toFixed(2)}px, 0) rotate(${degK.toFixed(2)}deg)`;
      // the ring hangs from the hook and passes through both holes
      const mx = (a1.x + a2.x) / 2 - HOOK.x;
      const my = (a1.y + a2.y) / 2 - HOOK.y;
      const ml = Math.hypot(mx, my) || 1;
      const cx = HOOK.x + (mx / ml) * (RING_R - 2);
      const cy = HOOK.y + (my / ml) * (RING_R - 2);
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${(cx - 24).toFixed(2)}px, ${(cy - 24).toFixed(2)}px, 0)`;
      if (ringShadowRef.current) ringShadowRef.current.style.transform = `translate3d(${(cx - RING_R + SHADOW.x * 0.6).toFixed(2)}px, ${(cy - RING_R + SHADOW.y * 0.6).toFixed(2)}px, 0)`;
      // cut edges and highlights keep facing the lamp while the pieces turn
      const c = Math.cos(-rotF);
      const sn = Math.sin(-rotF);
      if (fobEdgeRef.current) fobEdgeRef.current.style.transform = `translate(${(2 * c - 3.4 * sn).toFixed(2)}px, ${(2 * sn + 3.4 * c).toFixed(2)}px)`;
      if (rimRef.current) rimRef.current.style.background = `linear-gradient(${(138 - degF).toFixed(1)}deg, #fff6cf 0%, #e6c268 18%, #a57b25 42%, #6b4a0f 60%, #c9a047 82%, #f6dd94 100%)`;
      if (glossRef.current) {
        const lx = 50 + (-26 * c + 34 * sn) * 1;
        const ly = 50 + (-26 * sn - 34 * c) * 0.6;
        glossRef.current.style.background = `radial-gradient(52% 34% at ${lx.toFixed(1)}% ${ly.toFixed(1)}%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.14) 45%, rgba(255,255,255,0) 100%)`;
      }
      const ck = Math.cos(-rotK);
      const sk = Math.sin(-rotK);
      if (keyEdgeRef.current) keyEdgeRef.current.setAttribute("transform", `translate(${(1.4 * ck - 2.2 * sk).toFixed(2)} ${(1.4 * sk + 2.2 * ck).toFixed(2)})`);
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
      const fob = s.pts[3];
      if (s.drag < 0 && now - s.lastTouch > 4800 && Math.abs(fob.x - fob.px) < 0.02) {
        s.side = -s.side;
        fob.px -= s.side * 3.6;
        s.pts[4].px += s.side * 1.2;
        s.lastTouch = now;
      }
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

    const toScene = (e: PointerEvent) => {
      const r = scene.getBoundingClientRect();
      return { x: (e.clientX - r.left) / s.scale, y: (e.clientY - r.top) / s.scale };
    };
    const aim = (e: PointerEvent) => {
      const p = toScene(e);
      const reach = 28 + (s.drag === 3 ? FOB_LEN : KEY_LEN);
      let x = p.x + s.ox;
      let y = p.y + s.oy;
      const dx = x - HOOK.x;
      const dy = y - HOOK.y;
      const d = Math.hypot(dx, dy);
      if (d > reach) {
        x = HOOK.x + (dx / d) * reach;
        y = HOOK.y + (dy / d) * reach;
      }
      s.tx = x;
      s.ty = y;
    };
    const grab = (index: number, el: HTMLElement) => (e: PointerEvent) => {
      if (reduce) return;
      const p = toScene(e);
      s.drag = index;
      s.ox = s.pts[index].x - p.x;
      s.oy = s.pts[index].y - p.y;
      aim(e);
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (s.drag > 0) aim(e);
    };
    const up = () => {
      s.drag = -1;
      s.lastTouch = performance.now();
      fobEl.style.cursor = "grab";
      keyEl.style.cursor = "grab";
    };
    const grabFob = grab(3, fobEl);
    const grabKey = grab(4, keyEl);

    fit();
    // with motion reduced nothing animates, so settle the key against the fob before the one drawing
    if (reduce) for (let i = 0; i < 900; i++) stepOnce();
    draw();
    s.lastTouch = performance.now();
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
    fobEl.addEventListener("pointerdown", grabFob);
    keyEl.addEventListener("pointerdown", grabKey);
    for (const el of [fobEl, keyEl]) {
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    }
    start();
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      fobEl.removeEventListener("pointerdown", grabFob);
      keyEl.removeEventListener("pointerdown", grabKey);
      for (const el of [fobEl, keyEl]) {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
      }
    };
  }, [reduce]);

  // The key outline: bow at the top with its hole, a collar, the shaft and the bit.
  const keyPath = "M20 1C9.5 1 2 8 2 17.5 2 25.5 7.6 31.4 15.6 32.8V38H13.4V44H15.6V112.5C15.6 116.8 17.5 120 20 120S24.4 116.8 24.4 112.5V110H37V103.5H31.5V98.5H37V88H31.5V83.5H24.4V44H26.6V38H24.4V32.8C32.4 31.4 38 25.5 38 17.5 38 8 30.5 1 20 1ZM20 5.6A5.4 5.4 0 1 1 20 16.4 5.4 5.4 0 0 1 20 5.6Z";

  return (
    <div
      ref={rootRef}
      className="relative h-[800px] w-full select-none overflow-hidden bg-[#10231c]"
      style={{ backgroundImage: "radial-gradient(90% 80% at 30% 14%, #24493c 0%, #17352b 38%, #0c1c16 100%)" }}
    >
      {/* painted boards: a fine joint every so often, and a little grain */}
      <div className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 150px, rgba(0,0,0,0.42) 150px, rgba(0,0,0,0.42) 151.5px, rgba(255,255,255,0.05) 151.5px, rgba(255,255,255,0.05) 153px)", backgroundPosition: "center top" }} />
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.22] mix-blend-overlay" aria-hidden="true">
        <filter id="hotel-key-wall">
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.012" numOctaves="3" seed="3" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.1" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hotel-key-wall)" />
      </svg>

      <div ref={sceneRef} className="absolute left-1/2 top-0 origin-top" style={{ width: W, height: H, transform: "translateX(-50%)" }}>
        {/* engraved number plate */}
        <div className="absolute rounded-[50%] bg-black/50 blur-[5px]" style={{ left: CX - 38 + 7, top: 48 + 9, width: 76, height: 46 }} />
        <div
          className="absolute flex items-center justify-center rounded-[50%]"
          style={{ left: CX - 38, top: 48, width: 76, height: 46, background: "linear-gradient(140deg, #fff3c4 0%, #dfbb62 22%, #b08630 55%, #7a5914 78%, #c9a24a 100%)", boxShadow: "inset 0 0 0 1px rgba(60,38,4,0.8), inset 0 0 0 3px rgba(255,240,190,0.25), inset 0 0 0 4px rgba(60,38,4,0.35), 0 1px 0 rgba(0,0,0,0.6)" }}
        >
          <span className="absolute left-[7px] top-1/2 h-[5px] w-[5px] -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #fff3c4, #8a6519 70%)", boxShadow: "inset 0 0 0 0.5px rgba(40,25,0,0.8)" }} />
          <span className="absolute right-[7px] top-1/2 h-[5px] w-[5px] -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #fff3c4, #8a6519 70%)", boxShadow: "inset 0 0 0 0.5px rgba(40,25,0,0.8)" }} />
          <span className="font-serif text-[24px] leading-none" style={{ color: "#3d2a05", textShadow: "0 1px 0 rgba(255,240,190,0.7)" }}>{room.number}</span>
        </div>

        {/* shadows on the wall */}
        <div ref={ringShadowRef} className="pointer-events-none absolute left-0 top-0 rounded-full border-[4px] border-black/55 blur-[3px]" style={{ width: RING_R * 2, height: RING_R * 2 }} />
        <div ref={keyShadowRef} className="pointer-events-none absolute left-0 top-0 blur-[5px]" style={{ width: KEY_W, height: KEY_H, transformOrigin: `${KEY_HOLE.x}px ${KEY_HOLE.y}px` }}>
          <svg width={KEY_W} height={KEY_H} viewBox={`0 0 ${KEY_W} ${KEY_H}`} aria-hidden="true">
            <path d={keyPath} fill="rgba(0,0,0,0.55)" fillRule="evenodd" />
          </svg>
        </div>
        <div ref={fobShadowRef} className="pointer-events-none absolute left-0 top-0 rounded-[50%] bg-black/55 blur-[11px]" style={{ width: FOB_W, height: FOB_H, transformOrigin: `${FOB_HOLE.x}px ${FOB_HOLE.y}px` }} />

        {/* cup hook: its plate, then the ring, key and fob, then the hook wire over the ring */}
        <div className="absolute rounded-full" style={{ left: CX - 14, top: 120, width: 28, height: 28, background: "radial-gradient(circle at 36% 30%, #fff8d8 0%, #efcd76 24%, #c0933a 58%, #7f5c16 86%, #4f3708 100%)", boxShadow: "0 3px 6px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(60,38,4,0.8), inset 0 0 0 4px rgba(255,240,190,0.16), inset 0 0 0 5px rgba(60,38,4,0.32)" }} />

        {/* the key */}
        <div ref={keyRef} className="absolute left-0 top-0 cursor-grab touch-none" style={{ width: KEY_W, height: KEY_H, transformOrigin: `${KEY_HOLE.x}px ${KEY_HOLE.y}px`, willChange: "transform" }}>
          <svg width={KEY_W} height={KEY_H} viewBox={`0 0 ${KEY_W} ${KEY_H}`} className="overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id="hotel-key-brass" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#6e4d11" />
                <stop offset="0.22" stopColor="#d0a443" />
                <stop offset="0.42" stopColor="#fff2bd" />
                <stop offset="0.6" stopColor="#d8b052" />
                <stop offset="0.85" stopColor="#8a651a" />
                <stop offset="1" stopColor="#56390a" />
              </linearGradient>
              <linearGradient id="hotel-key-shaft" x1="15" y1="0" x2="25" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#5e4210" />
                <stop offset="0.3" stopColor="#fff2bd" />
                <stop offset="0.55" stopColor="#cfa446" />
                <stop offset="1" stopColor="#4f3508" />
              </linearGradient>
              <radialGradient id="hotel-key-bow" cx="0.38" cy="0.3" r="0.8">
                <stop offset="0" stopColor="#fff6cf" />
                <stop offset="0.3" stopColor="#e6c268" />
                <stop offset="0.7" stopColor="#a37a26" />
                <stop offset="1" stopColor="#5a3e0b" />
              </radialGradient>
            </defs>
            <g ref={keyEdgeRef}>
              <path d={keyPath} fill="#3a2706" fillRule="evenodd" />
            </g>
            <path d={keyPath} fill="url(#hotel-key-brass)" fillRule="evenodd" stroke="#3a2706" strokeWidth="0.6" />
            <path d="M20 1C9.5 1 2 8 2 17.5 2 25.5 7.6 31.4 15.6 32.8H24.4C32.4 31.4 38 25.5 38 17.5 38 8 30.5 1 20 1ZM20 5.6A5.4 5.4 0 1 1 20 16.4 5.4 5.4 0 0 1 20 5.6Z" fill="url(#hotel-key-bow)" fillRule="evenodd" />
            <ellipse cx="20" cy="18" rx="13.2" ry="11.6" fill="none" stroke="#5a3e0b" strokeOpacity="0.55" strokeWidth="0.8" />
            <ellipse cx="20" cy="18.6" rx="13.2" ry="11.6" fill="none" stroke="#fff6cf" strokeOpacity="0.5" strokeWidth="0.6" />
            <text x="20" y="27.4" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7.5" fill="#4a3206" fillOpacity="0.85">{room.number}</text>
            <rect x="15.6" y="44" width="8.8" height="76" rx="4.4" fill="url(#hotel-key-shaft)" />
            <rect x="13.4" y="38" width="13.2" height="6" rx="1" fill="url(#hotel-key-brass)" stroke="#3a2706" strokeWidth="0.5" />
            <path d="M13.8 39.4H26.2" stroke="#fff6cf" strokeOpacity="0.8" strokeWidth="0.7" />
            <path d="M24.8 84.2H31V88.6H36.4M24.8 98.9H31V103.9H36.4" fill="none" stroke="#fff6cf" strokeOpacity="0.65" strokeWidth="0.7" />
            <circle cx="20" cy="11" r="5.4" fill="none" stroke="#3a2706" strokeOpacity="0.8" strokeWidth="0.9" />
          </svg>
        </div>

        {/* the fob */}
        <div ref={fobRef} className="absolute left-0 top-0 cursor-grab touch-none" style={{ width: FOB_W, height: FOB_H, transformOrigin: `${FOB_HOLE.x}px ${FOB_HOLE.y}px`, willChange: "transform" }}>
          <div ref={fobEdgeRef} className="absolute inset-0 rounded-[50%] bg-[#33230a]" />
          <div ref={rimRef} className="absolute inset-0 rounded-[50%]" style={{ background: "linear-gradient(138deg, #fff6cf 0%, #e6c268 18%, #a57b25 42%, #6b4a0f 60%, #c9a047 82%, #f6dd94 100%)", boxShadow: "inset 0 0 0 0.8px rgba(50,32,4,0.85)" }} />
          <div
            className="absolute inset-[6px] overflow-hidden rounded-[50%]"
            style={{ background: "radial-gradient(70% 60% at 42% 34%, #b42a2c 0%, #8c1519 48%, #5a0a0f 100%)", boxShadow: "inset 0 2.5px 5px rgba(20,0,0,0.75), inset 0 -1px 1px rgba(255,160,150,0.25), 0 0 0 1px rgba(50,32,4,0.7)" }}
          >
            <div className="absolute inset-[5px] rounded-[50%] border border-[#e9c871]/55" />
            <div className="absolute inset-x-0 top-[40px] text-center font-mono text-[6.5px] uppercase leading-none tracking-[0.34em] text-[#ecd08a]" style={{ textIndent: "0.34em" }}>Room</div>
            <div
              className="absolute inset-x-0 top-[50px] text-center font-serif text-[44px] leading-none"
              style={{ backgroundImage: "linear-gradient(180deg, #fff3bf 0%, #e8c468 42%, #a67c22 78%, #dcb65a 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 1px 0 rgba(40,0,0,0.7))" }}
            >
              {room.number}
            </div>
            <div className="absolute left-1/2 top-[101px] h-px w-[26px] -translate-x-1/2 bg-[#e9c871]/70" />
            <div className="absolute inset-x-0 top-[108px] text-center font-serif text-[9px] italic leading-none text-[#f0d490]">{room.house}</div>
            <div ref={glossRef} className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(52% 34% at 30% 22%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.14) 45%, rgba(255,255,255,0) 100%)" }} />
          </div>
          {/* brass grommet round the hole */}
          <div className="absolute rounded-full" style={{ left: FOB_HOLE.x - 8.5, top: FOB_HOLE.y - 8.5, width: 17, height: 17, background: "radial-gradient(circle at 36% 30%, #fff6cf 0%, #e3bf66 40%, #8a6519 100%)", boxShadow: "0 1px 2px rgba(0,0,0,0.6), inset 0 0 0 0.7px rgba(50,32,4,0.8)" }}>
            <div className="absolute inset-[4px] rounded-full bg-[#0b1712]" style={{ boxShadow: "inset 0 1.5px 2px rgba(0,0,0,0.9)" }} />
          </div>
        </div>

        {/* split ring, in front of both holes */}
        <svg ref={ringRef} className="pointer-events-none absolute left-0 top-0 overflow-visible" width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="25.4" r={RING_R} fill="none" stroke="#000" strokeOpacity="0.4" strokeWidth="4" />
          <circle cx="24" cy="24" r={RING_R} fill="none" stroke="#4a3408" strokeWidth="4.6" />
          <circle cx="24" cy="24" r={RING_R} fill="none" stroke="#c9a047" strokeWidth="3.2" />
          <circle cx="24" cy="24" r={RING_R + 0.2} fill="none" stroke="#7d5c18" strokeWidth="0.7" />
          <path d={`M${24 - RING_R * 0.92} ${24 - RING_R * 0.4}A${RING_R} ${RING_R} 0 0 1 ${24 + RING_R * 0.2} ${24 - RING_R * 0.98}`} fill="none" stroke="#fff6cf" strokeWidth="1.5" strokeLinecap="round" transform="translate(0.5 0.5)" />
          <path d={`M${24 + RING_R * 0.5} ${24 + RING_R * 0.87}A${RING_R} ${RING_R} 0 0 1 ${24 - RING_R * 0.3} ${24 + RING_R * 0.95}`} fill="none" stroke="#f3d98f" strokeOpacity="0.7" strokeWidth="1" strokeLinecap="round" />
        </svg>

        {/* hook wire: down from the plate, round under the ring and up to a small ball */}
        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={W} height={H} style={{ transform: `translate(${CX - 230}px, -14px)` }} aria-hidden="true">
          <path d="M230 150V180A9.5 9.5 0 0 1 211 180V172" fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="7" strokeLinecap="round" transform="translate(2 3)" />
          <path d="M230 150V180A9.5 9.5 0 0 1 211 180V172" fill="none" stroke="#4a3408" strokeWidth="7.4" strokeLinecap="round" />
          <path d="M230 150V180A9.5 9.5 0 0 1 211 180V172" fill="none" stroke="#c79a3c" strokeWidth="5.6" strokeLinecap="round" />
          <path d="M228.6 150V180A8.2 8.2 0 0 1 212.3 180V172" fill="none" stroke="#fff3c4" strokeOpacity="0.85" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="211" cy="170.5" r="4.6" fill="#d6ae54" stroke="#4a3408" strokeWidth="0.9" />
          <circle cx="209.8" cy="169.2" r="1.4" fill="#fff6cf" />
          <circle cx="230" cy="148" r="6" fill="#c79a3c" stroke="#4a3408" strokeWidth="0.9" />
          <circle cx="228.4" cy="146.4" r="1.8" fill="#fff6cf" fillOpacity="0.9" />
        </svg>
      </div>

      <p className="pointer-events-none absolute bottom-6 left-6 font-mono text-[10px] uppercase leading-[1.7] tracking-[0.18em] text-[#8fa89c]">
        <span className="font-semibold text-[#f0e2b6]">{room.house} / room {room.number}</span>
        <br />
        {room.floor}
      </p>
      <button
        type="button"
        onClick={push}
        aria-label="Flick the room key so it swings"
        className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full border border-[#f0e2b6]/30 bg-[#0c1c16]/60 text-[#f0e2b6] transition-colors hover:bg-[#1c3a30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0e2b6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10231c]"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="7" cy="6" r="3.5" />
          <path d="M9.4 8.6l6.6 6.6M13.2 12.4l-1.8 1.8M15.4 14.6l-1.6 1.6" />
        </svg>
      </button>
    </div>
  );
}

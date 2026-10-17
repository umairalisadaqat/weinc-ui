import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/** What is typed on the card behind the window, and pressed into the leather under it. */
const tag = {
  name: "Ines Calloway",
  street: "14 Marlow Lane",
  town: "Whitby YO21 3QT",
  route: "LIS to OSL",
  monogram: "I.C.",
};

// Everything is in design pixels for a 460 wide scene; the whole scene is scaled to fit.
const W = 460;
const H = 678;
const PEG = { x: 230, y: 96 }; // where the strap hangs from
const PEG_R = 17; // radius the strap wraps round
const LINKS = 7; // strap segments
const LINK = 30; // length of one segment
const BODY = 122; // slot to the tag's centre of weight
const TAG_W = 172;
const TAG_H = 256;
const SLOT = { x: 86, y: 30 }; // slot position inside the tag
const GRAVITY = 0.27; // pixels per step squared, at 120 steps a second
const DAMPING = 0.9982;
const SHADOW = { x: 20, y: 28 }; // which way the wall shadow falls

type Pt = { x: number; y: number; px: number; py: number; w: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function makePoints(angle: number): Pt[] {
  const pts: Pt[] = [];
  let x = PEG.x;
  let y = PEG.y;
  const dx = Math.sin(angle);
  const dy = Math.cos(angle);
  for (let i = 0; i <= LINKS + 1; i++) {
    pts.push({ x, y, px: x, py: y, w: i === 0 ? 0 : i <= LINKS ? 3 : 0.12 });
    const len = i < LINKS ? LINK : BODY;
    x += dx * len;
    y += dy * len;
  }
  pts[LINKS].w = 1.2;
  return pts;
}

function link(a: Pt, b: Pt, len: number, stiff: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 0.0001;
  const sum = a.w + b.w;
  if (sum === 0) return;
  const k = ((d - len) / d) * stiff;
  a.x += dx * k * (a.w / sum);
  a.y += dy * k * (a.w / sum);
  b.x -= dx * k * (b.w / sum);
  b.y -= dy * k * (b.w / sum);
}

/** A smooth path through a list of points. */
function through(p: { x: number; y: number }[], move: boolean) {
  let d = `${move ? "M" : "L"}${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i].x + p[i + 1].x) / 2;
    const my = (p[i].y + p[i + 1].y) / 2;
    d += `Q${p[i].x.toFixed(1)} ${p[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const last = p[p.length - 1];
  return `${d}L${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
}

const TAG_RADIUS = "48px 48px 24px 24px";

export default function LeatherLuggageTag() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const keeperRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const edgeRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const glossRef = useRef<HTMLDivElement>(null);
  const buckleRef = useRef<HTMLDivElement>(null);
  const strapRefs = useRef<(SVGPathElement | null)[]>([]);
  const sim = useRef({
    pts: makePoints(0),
    scale: 1,
    dragging: false,
    tx: 0,
    ty: 0,
    ox: 0,
    oy: 0,
    twist: 0,
    twistVel: 0,
    lastTouch: 0,
    side: 1,
  });

  const push = useCallback(() => {
    const s = sim.current;
    const m = s.pts[LINKS + 1];
    s.side = -s.side;
    m.px -= s.side * 7.5;
    s.pts[LINKS].px -= s.side * 3;
    s.lastTouch = performance.now();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const scene = sceneRef.current;
    const tagEl = tagRef.current;
    if (!root || !scene || !tagEl) return;
    const s = sim.current;
    s.pts = makePoints(reduce ? 0 : 0.72);
    let raf = 0;
    let running = false;
    let visible = true;
    let last = 0;
    let acc = 0;

    const fit = () => {
      const width = root.clientWidth;
      s.scale = Math.min(1.18, width / W);
      scene.style.transform = `translateX(-50%) scale(${s.scale})`;
      root.style.height = `${Math.round(H * s.scale)}px`;
    };

    const stepOnce = () => {
      const pts = s.pts;
      const m = pts[LINKS + 1];
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        const vx = clamp((p.x - p.px) * DAMPING, -42, 42);
        const vy = clamp((p.y - p.py) * DAMPING, -42, 42);
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + GRAVITY;
      }
      for (let it = 0; it < 14; it++) {
        if (s.dragging) {
          m.x += (s.tx - m.x) * 0.35;
          m.y += (s.ty - m.y) * 0.35;
        }
        for (let i = 0; i < LINKS; i++) link(pts[i], pts[i + 1], LINK, 1);
        link(pts[LINKS], m, BODY, 1);
        // leather does not fold sharply: a soft constraint between every other point
        for (let i = 0; i < LINKS - 1; i++) link(pts[i], pts[i + 2], LINK * 2, 0.07);
      }
      const target = clamp((m.x - m.px) * 0.085, -0.5, 0.5);
      s.twistVel += (target - s.twist) * 0.012 - s.twistVel * 0.06;
      s.twist += s.twistVel;
    };

    const draw = () => {
      const pts = s.pts;
      const slot = pts[LINKS];
      const m = pts[LINKS + 1];
      const rot = Math.atan2(-(m.x - slot.x), m.y - slot.y);
      const deg = (rot * 180) / Math.PI;
      const tw = (s.twist * 180) / Math.PI;
      const base = `translate3d(${(slot.x - SLOT.x).toFixed(2)}px, ${(slot.y - SLOT.y).toFixed(2)}px, 0) rotate(${deg.toFixed(2)}deg) rotateY(${tw.toFixed(2)}deg)`;
      tagEl.style.transform = `perspective(900px) ${base}`;
      if (keeperRef.current) keeperRef.current.style.transform = `perspective(900px) ${base}`;
      // the shadow sits further from the tag the more the tag lifts off the wall
      const lift = 1 + Math.abs(s.twist) * 0.9;
      if (shadowRef.current) shadowRef.current.style.transform = `translate3d(${(slot.x - SLOT.x + SHADOW.x * lift).toFixed(2)}px, ${(slot.y - SLOT.y + SHADOW.y * lift).toFixed(2)}px, 0) rotate(${deg.toFixed(2)}deg) scaleX(${Math.cos(s.twist).toFixed(3)})`;
      // thickness and light stay where the lamp is, whatever the tag is doing
      const c = Math.cos(-rot);
      const sn = Math.sin(-rot);
      if (edgeRef.current) edgeRef.current.style.transform = `translate(${(2.2 * c - 3.2 * sn).toFixed(2)}px, ${(2.2 * sn + 3.2 * c).toFixed(2)}px)`;
      if (lightRef.current) lightRef.current.style.background = `linear-gradient(${(128 - deg).toFixed(1)}deg, rgba(255,236,200,0.34) 0%, rgba(255,236,200,0.06) 34%, rgba(30,12,0,0) 55%, rgba(30,12,0,0.34) 100%)`;
      if (glossRef.current) glossRef.current.style.transform = `translateX(${(-deg * 1.5 - tw * 2.4).toFixed(1)}px) skewX(-18deg)`;

      // the strap: a loop from the slot, up one side, over the peg and down the other
      const left: { x: number; y: number }[] = [];
      const right: { x: number; y: number }[] = [];
      for (let i = 0; i <= LINKS; i++) {
        const a = pts[Math.max(0, i - 1)];
        const b = pts[Math.min(LINKS, i + 1)];
        const tx = b.x - a.x;
        const ty = b.y - a.y;
        const tl = Math.hypot(tx, ty) || 1;
        const nx = ty / tl;
        const ny = -tx / tl;
        const t = i / LINKS;
        const half = PEG_R + (6.2 - PEG_R) * Math.pow(t, 0.72);
        left.push({ x: pts[i].x - nx * half, y: pts[i].y - ny * half });
        right.push({ x: pts[i].x + nx * half, y: pts[i].y + ny * half });
      }
      // run the two ends on through the slot so they disappear behind the keeper
      const ex = (slot.x - pts[LINKS - 1].x) / LINK;
      const ey = (slot.y - pts[LINKS - 1].y) / LINK;
      left.push({ x: left[LINKS].x + ex * 11, y: left[LINKS].y + ey * 11 });
      right.push({ x: right[LINKS].x + ex * 11, y: right[LINKS].y + ey * 11 });
      const d = `${through([...left].reverse(), true)}A${PEG_R} ${PEG_R} 0 0 1 ${right[0].x.toFixed(1)} ${right[0].y.toFixed(1)}${through(right, false)}`;
      for (const el of strapRefs.current) if (el) el.setAttribute("d", d);

      if (buckleRef.current) {
        const a = right[3];
        const b = right[4];
        const ang = (Math.atan2(-(b.x - a.x), b.y - a.y) * 180) / Math.PI;
        buckleRef.current.style.transform = `translate3d(${((a.x + b.x) / 2 - 13).toFixed(2)}px, ${((a.y + b.y) / 2 - 14).toFixed(2)}px, 0) rotate(${ang.toFixed(2)}deg)`;
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += dt;
      let n = 0;
      while (acc >= 1 / 120 && n < 6) {
        stepOnce();
        acc -= 1 / 120;
        n++;
      }
      // a small push of its own when it has been left hanging still for a while
      const m = s.pts[LINKS + 1];
      if (!s.dragging && now - s.lastTouch > 5200 && Math.abs(m.x - m.px) < 0.02 && Math.abs(m.x - PEG.x) < 3) {
        s.side = -s.side;
        m.px -= s.side * 5.5;
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
    const reach = LINKS * LINK + BODY - 4;
    const aim = (e: PointerEvent) => {
      const p = toScene(e);
      let x = p.x + s.ox;
      let y = p.y + s.oy;
      const dx = x - PEG.x;
      const dy = y - PEG.y;
      const d = Math.hypot(dx, dy);
      if (d > reach) {
        x = PEG.x + (dx / d) * reach;
        y = PEG.y + (dy / d) * reach;
      }
      s.tx = x;
      s.ty = y;
    };
    const down = (e: PointerEvent) => {
      if (reduce) return;
      const p = toScene(e);
      const m = s.pts[LINKS + 1];
      s.ox = m.x - p.x;
      s.oy = m.y - p.y;
      s.dragging = true;
      aim(e);
      tagEl.setPointerCapture(e.pointerId);
      tagEl.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (s.dragging) aim(e);
    };
    const up = () => {
      s.dragging = false;
      s.lastTouch = performance.now();
      tagEl.style.cursor = "grab";
    };

    fit();
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
    tagEl.addEventListener("pointerdown", down);
    tagEl.addEventListener("pointermove", move);
    tagEl.addEventListener("pointerup", up);
    tagEl.addEventListener("pointercancel", up);
    start();
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      tagEl.removeEventListener("pointerdown", down);
      tagEl.removeEventListener("pointermove", move);
      tagEl.removeEventListener("pointerup", up);
      tagEl.removeEventListener("pointercancel", up);
    };
  }, [reduce]);

  const strapLayers = [
    { stroke: "#2f190b", width: 13.6, dash: undefined, opacity: 1 },
    { stroke: "#7c4a22", width: 11.4, dash: undefined, opacity: 1 },
    { stroke: "#a26a35", width: 8.2, dash: undefined, opacity: 0.5 },
    { stroke: "#7c4a22", width: 5.4, dash: undefined, opacity: 0.9 },
    { stroke: "#f0dcb2", width: 1, dash: "3.6 3", opacity: 0.92 },
  ];

  return (
    <div
      ref={rootRef}
      className="relative h-[800px] w-full select-none overflow-hidden bg-[#d6cdbd]"
      style={{ backgroundImage: "radial-gradient(120% 90% at 28% 12%, #ebe4d6 0%, #d9d0c0 46%, #bfb4a0 100%)" }}
    >
      {/* plaster grain on the wall */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16] mix-blend-multiply" aria-hidden="true">
        <filter id="luggage-tag-wall">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="7" />
          <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.26  0 0 0 0 0.2  0 0 0 -1.5 1.05" />
        </filter>
        <rect width="100%" height="100%" filter="url(#luggage-tag-wall)" />
      </svg>

      <div ref={sceneRef} className="absolute left-1/2 top-0 origin-top" style={{ width: W, height: H, transform: "translateX(-50%)" }}>
        {/* shadows on the wall */}
        <div className="pointer-events-none absolute rounded-full bg-[#3a2a16]/45 blur-[7px]" style={{ left: PEG.x - 6, top: PEG.y - 2, width: 46, height: 30, transform: "rotate(54deg)", transformOrigin: "8px 8px" }} />
        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible blur-[5px]" width={W} height={H} style={{ transform: `translate(${SHADOW.x * 0.55}px, ${SHADOW.y * 0.55}px)` }} aria-hidden="true">
          <path ref={(el) => { strapRefs.current[0] = el; }} fill="none" stroke="#2c1d0c" strokeOpacity="0.34" strokeWidth="13" strokeLinecap="round" />
        </svg>
        <div ref={shadowRef} className="pointer-events-none absolute left-0 top-0 bg-[#2c1d0c]/40 blur-[14px]" style={{ width: TAG_W, height: TAG_H, borderRadius: TAG_RADIUS, transformOrigin: `${SLOT.x}px ${SLOT.y}px` }} />

        {/* the tag */}
        <div
          ref={tagRef}
          className="absolute left-0 top-0 cursor-grab touch-none"
          style={{ width: TAG_W, height: TAG_H, transformOrigin: `${SLOT.x}px ${SLOT.y}px`, willChange: "transform" }}
        >
          <div ref={edgeRef} className="absolute inset-0 bg-[#3b2110]" style={{ borderRadius: TAG_RADIUS }} />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              borderRadius: TAG_RADIUS,
              background: "linear-gradient(168deg, #b9763a 0%, #a5622b 42%, #8f5122 100%)",
              boxShadow: "inset 0 0 0 1px rgba(58,28,8,0.75), inset 0 0 0 2.5px rgba(214,150,88,0.28), inset 0 0 22px rgba(58,24,4,0.6)",
            }}
          >
            {/* pebbled grain, lit from the top left */}
            <svg className="absolute inset-0 h-full w-full opacity-60 mix-blend-soft-light" aria-hidden="true">
              <filter id="luggage-tag-grain" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="4" seed="11" result="n" />
                <feDiffuseLighting in="n" surfaceScale="2.4" diffuseConstant="1.05" lightingColor="#ffffff">
                  <feDistantLight azimuth="225" elevation="52" />
                </feDiffuseLighting>
              </filter>
              <rect width="100%" height="100%" filter="url(#luggage-tag-grain)" />
            </svg>
            {/* saddle stitching: the holes, then the thread */}
            <div className="absolute inset-[9px] border-[1.6px] border-dashed border-[#2b1505]/70" style={{ borderRadius: "40px 40px 16px 16px", transform: "translate(0.6px, 1px)" }} />
            <div className="absolute inset-[9px] border-[1.6px] border-dashed border-[#f3e1b9]" style={{ borderRadius: "40px 40px 16px 16px" }} />

            {/* slot the strap goes through */}
            <div className="absolute rounded-full bg-[#1c0e05]" style={{ left: SLOT.x - 27, top: SLOT.y - 5.5, width: 54, height: 11, boxShadow: "inset 0 2px 3px rgba(0,0,0,0.9), 0 1px 0 rgba(236,180,120,0.4)" }} />

            {/* window with the address card behind clear vinyl */}
            <div className="absolute left-[21px] right-[21px] top-[70px] h-[118px] rounded-[7px] bg-[#2a1608]" style={{ boxShadow: "0 1px 0 rgba(240,190,130,0.45), 0 -1px 0 rgba(40,18,4,0.6)" }}>
              <div className="absolute inset-[3px] overflow-hidden rounded-[4.5px] bg-[#f4eddc]" style={{ boxShadow: "inset 0 3px 6px rgba(40,20,5,0.55), inset 0 0 0 1px rgba(40,20,5,0.25)" }}>
                <div className="px-[10px] pt-[9px] font-mono text-[6.5px] uppercase leading-none tracking-[0.2em] text-[#7b6c55]">Name</div>
                <div className="px-[10px] pt-[4px] font-serif text-[15px] italic leading-none text-[#22304f]">{tag.name}</div>
                <div className="mx-[10px] mt-[6px] h-px bg-[#c9bda4]" />
                <div className="px-[10px] pt-[7px] font-mono text-[6.5px] uppercase leading-none tracking-[0.2em] text-[#7b6c55]">Return to</div>
                <div className="px-[10px] pt-[4px] font-mono text-[9px] leading-[1.35] text-[#2b2a27]">
                  {tag.street}
                  <br />
                  {tag.town}
                </div>
                <div className="absolute bottom-[8px] left-[10px] right-[10px] flex items-center justify-between font-mono text-[6.5px] uppercase leading-none tracking-[0.2em] text-[#7b6c55]">
                  <span>Flight</span>
                  <span className="rounded-[2px] border border-[#b4472f] px-[4px] py-[2.5px] font-semibold text-[#b4472f]">{tag.route}</span>
                </div>
                {/* the sheen on the vinyl slides as the tag turns */}
                <div ref={glossRef} className="pointer-events-none absolute -inset-y-4 left-[18%] w-[34%]" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.16) 60%, rgba(255,255,255,0) 100%)", transform: "skewX(-18deg)" }} />
              </div>
            </div>

            {/* initials pressed into the leather */}
            <div className="absolute bottom-[26px] left-0 right-0 text-center font-serif text-[21px] tracking-[0.18em]" style={{ color: "rgba(58,26,6,0.6)", textShadow: "0 1px 0 rgba(255,206,150,0.42), 0 -1px 0 rgba(30,12,0,0.5)" }}>
              {tag.monogram}
            </div>
            <div ref={lightRef} className="pointer-events-none absolute inset-0" />
          </div>
        </div>

        {/* the strap */}
        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={W} height={H} aria-hidden="true">
          {strapLayers.map((l, i) => (
            <path key={i} ref={(el) => { strapRefs.current[i + 1] = el; }} fill="none" stroke={l.stroke} strokeWidth={l.width} strokeDasharray={l.dash} strokeOpacity={l.opacity} strokeLinecap="butt" strokeLinejoin="round" />
          ))}
        </svg>

        {/* brass buckle on one side of the loop */}
        <div ref={buckleRef} className="pointer-events-none absolute left-0 top-0 h-[28px] w-[26px]" style={{ transformOrigin: "13px 14px" }}>
          <div className="absolute inset-x-[4px] top-[-9px] h-[7px] rounded-[1.5px] bg-[#5d3618]" style={{ boxShadow: "inset 0 1px 0 rgba(230,170,110,0.5), 0 1px 2px rgba(0,0,0,0.5)" }} />
          <div
            className="absolute inset-0 rounded-[6px] border-[4px]"
            style={{ borderColor: "#fbe7a4 #b88a34 #7d5a1a #e0bb62", boxShadow: "0 2px 3px rgba(30,15,0,0.55), inset 0 1px 1px rgba(60,35,5,0.7)" }}
          />
          <div className="absolute left-[11.3px] top-[2px] h-[24px] w-[3.4px] rounded-full" style={{ background: "linear-gradient(90deg, #fff0bd, #c59a40 55%, #7d5a1a)", boxShadow: "0 1px 1px rgba(0,0,0,0.5)" }} />
        </div>

        {/* keeper band riveted across the tag under the slot; the strap ends tuck behind it */}
        <div ref={keeperRef} className="pointer-events-none absolute left-0 top-0" style={{ width: TAG_W, height: TAG_H, transformOrigin: `${SLOT.x}px ${SLOT.y}px` }}>
          <div
            className="absolute rounded-[4px]"
            style={{
              left: SLOT.x - 42,
              top: SLOT.y + 5.5,
              width: 84,
              height: 17,
              background: "linear-gradient(180deg, #7a4520 0%, #63361a 100%)",
              boxShadow: "0 2px 3px rgba(25,10,0,0.6), inset 0 1px 0 rgba(236,170,104,0.5), inset 0 -1px 0 rgba(25,10,0,0.6)",
            }}
          >
            {[7, 69].map((x) => (
              <span key={x} className="absolute top-[4.5px] h-[8px] w-[8px] rounded-full" style={{ left: x, background: "radial-gradient(circle at 35% 30%, #fff6cf 0%, #e3bf66 35%, #94701f 80%, #5e430c 100%)", boxShadow: "0 1px 1.5px rgba(0,0,0,0.6)" }} />
            ))}
          </div>
        </div>

        {/* turned brass peg */}
        <div className="pointer-events-none absolute rounded-full" style={{ left: PEG.x - 15, top: PEG.y - 15, width: 30, height: 30, background: "radial-gradient(circle at 36% 30%, #fff8d8 0%, #f0cf78 22%, #c89b3c 55%, #8a6519 82%, #5a3f0a 100%)", boxShadow: "0 3px 5px rgba(30,18,0,0.55), 0 0 0 1px rgba(70,45,5,0.7), inset 0 0 0 3px rgba(255,236,170,0.18), inset 0 0 0 4px rgba(80,52,8,0.35), inset 0 0 0 7.5px rgba(255,236,170,0.12), inset 0 0 0 8.5px rgba(80,52,8,0.3)" }} />
      </div>

      <p className="pointer-events-none absolute bottom-6 left-6 font-mono text-[10px] uppercase leading-[1.7] tracking-[0.18em] text-[#5b4f3d]">
        <span className="font-semibold text-[#2f2618]">Saddle tan / brass</span>
        <br />
        Pull the tag and let go
      </p>
      <button
        type="button"
        onClick={push}
        aria-label="Give the luggage tag a push"
        className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full border border-[#2f2618]/25 bg-[#efe8da]/70 text-[#2f2618] transition-colors hover:bg-[#f7f1e4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f2618] focus-visible:ring-offset-2 focus-visible:ring-offset-[#d6cdbd]"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 2.5v5" />
          <path d="M10 7.5l-4.2 7.2" strokeDasharray="1.5 2.2" />
          <circle cx="13.6" cy="14.4" r="2.6" />
          <path d="M10 7.5l2.4 4.6" />
        </svg>
      </button>
    </div>
  );
}

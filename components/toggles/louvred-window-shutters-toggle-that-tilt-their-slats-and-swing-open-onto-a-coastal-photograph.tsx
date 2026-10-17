import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

/** What is outside the window. `tone` shows while the photograph loads. */
const view = {
  src: "https://images.pexels.com/photos/2422259/pexels-photo-2422259.jpeg?auto=compress&cs=tinysrgb&w=1100",
  alt: "A fishing village on a rocky headland above a turquoise sea, with yellow broom in flower in the foreground",
  tone: "#2f9ea0",
  focus: "50% 58%",
  place: "Room 4, the harbour side",
};

const WALL = "#3a2520"; // the room's plaster, in shade
const PAINT = { lit: "#93a58c", mid: "#55644f", dark: "#2c352b" }; // shutter paint
const SLATS = 14; // louvres in each of the four panels
const TILT = 62; // degrees the louvres turn
const SWING = 60; // degrees each leaf opens
const SCENE_W = 560;
const SCENE_H = 640;
// the opening in the wall as seen from the room, and how deep the wall is
const O = { x: 96, y: 44, w: 368, h: 496, depth: 28 };
const A = { x: O.x + O.depth, y: O.y + O.depth, w: O.w - O.depth * 2, h: O.h - O.depth * 2 };
const LEAF_W = A.w / 2 - 0.8;
const RAIL = { top: 22, mid: 20, bottom: 30, stile: 17 };
const PANEL_H = (A.h - RAIL.top - RAIL.mid - RAIL.bottom) / 2;
const PITCH = PANEL_H / SLATS;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function LouvredWindowShutters() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const sim = useRef({ want: false, t: 0, tV: 0, l: 0, lV: 0, r: 0, rV: 0, px: 0, pxTo: 0, touched: -1e9, wake: () => {}, reduce: false });

  const set = useCallback((to: boolean, fromUser: boolean) => {
    const s = sim.current;
    if (fromUser) s.touched = performance.now();
    s.want = to;
    setOpen(to);
    if (s.reduce) { s.t = to ? 1 : 0; s.l = s.r = to ? 1 : 0; }
    s.wake();
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current, scene = sceneRef.current;
    if (!wrap || !scene) return;
    const s = sim.current;
    s.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const measure = () => {
      const sc = Math.min(1.12, wrap.clientWidth / (SCENE_W - 76), wrap.clientHeight / (SCENE_H + 20));
      scene.style.transform = `translate(-50%, -50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);

    const paint = (time: number) => {
      const breeze = s.reduce ? 0 : Math.sin(time / 900) * 0.012 + Math.sin(time / 370) * 0.004;
      const l = s.l + breeze * s.l, r = s.r - breeze * 0.8 * s.r;
      if (leftRef.current) leftRef.current.style.transform = `rotateY(${(-l * SWING).toFixed(2)}deg)`;
      if (rightRef.current) rightRef.current.style.transform = `rotateY(${(r * SWING).toFixed(2)}deg)`;
      if (photoRef.current) photoRef.current.style.transform = `translate3d(${(-s.px * 12).toFixed(2)}px, ${(Math.abs(s.px) * -2).toFixed(2)}px, 0) scale(1.1)`;
      scene.style.setProperty("--t", clamp(s.t, 0, 1.08).toFixed(3));
      scene.style.setProperty("--o", clamp((s.l + s.r) / 2, 0, 1).toFixed(3));
      wrap.style.setProperty("--o", clamp((s.l + s.r) / 2, 0, 1).toFixed(3));
      wrap.style.setProperty("--t", clamp(s.t, 0, 1).toFixed(3));
    };

    let raf = 0, last = 0, seen = true, t0 = 0, nextDemo = 250;
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      // Opening: the louvres turn first, then the leaves are pushed out. Closing runs the other way round.
      const tiltTo = s.want || s.l > 0.06 || s.r > 0.06 ? 1 : 0;
      const leafTo = s.want && s.t > 0.7 ? 1 : 0;
      s.tV += (150 * (tiltTo - s.t) - 15 * s.tV) * dt; s.t += s.tV * dt;
      s.lV += (34 * (leafTo - s.l) - 6.4 * s.lV) * dt; s.l += s.lV * dt;
      // the right leaf is a touch heavier and follows a moment later
      s.rV += (27 * ((leafTo ? (s.l > 0.12 ? 1 : 0) : 0) - s.r) - 5.6 * s.rV) * dt; s.r += s.rV * dt;
      // a leaf cannot pass through its neighbour: it knocks shut and bounces once
      if (s.l < 0) { s.l = 0; s.lV = Math.abs(s.lV) * 0.3; }
      if (s.r < 0) { s.r = 0; s.rV = Math.abs(s.rV) * 0.3; }
      s.px += (s.pxTo - s.px) * Math.min(1, dt * 5);
      if (now - s.touched > 7000) {
        s.pxTo = 0.6 * Math.sin(t / 2400);
        if (t > nextDemo) { nextDemo = t + (s.want ? 2600 : 5600); set(!s.want, false); }
      }
      paint(t);
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    s.wake = () => { if (s.reduce) paint(0); else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    if (s.reduce) set(true, false); else s.wake();

    const onMove = (e: PointerEvent) => {
      const b = wrap.getBoundingClientRect();
      s.touched = Math.max(s.touched, performance.now() - 3000);
      s.pxTo = clamp(((e.clientX - b.left) / b.width) * 2 - 1, -1, 1);
      if (s.reduce) { s.px = s.pxTo; paint(0); }
    };
    wrap.addEventListener("pointermove", onMove);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) s.wake(); });
    io.observe(wrap);
    const onVis = () => { if (!document.hidden) s.wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [set]);

  const wood = (deg: number) => `linear-gradient(${deg}deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.12) 100%), repeating-linear-gradient(${deg + 90}deg, rgba(0,0,0,0.035) 0 1px, rgba(0,0,0,0) 1px 5px, rgba(255,255,255,0.02) 5px 6px, rgba(0,0,0,0) 6px 13px)`;
  const member: CSSProperties = { backgroundColor: PAINT.mid, boxShadow: "inset 0 0 0 99px rgba(255,236,190,calc(var(--o) * 0.16)), inset 0 0 0 99px rgba(8,12,8,calc(0.42 - var(--o) * 0.3 - var(--t) * 0.1))" };

  const leaf = (side: "left" | "right") => {
    const isLeft = side === "left";
    return (
      <div ref={isLeft ? leftRef : rightRef} aria-hidden="true" className="absolute top-0" style={{ [side]: 0, width: LEAF_W, height: A.h, transformStyle: "preserve-3d", transformOrigin: isLeft ? "0 50%" : "100% 50%" }}>
        {/* stiles and rails */}
        {[{ left: 0 }, { right: 0 }].map((pos, i) => (
          <span key={i} className="absolute inset-y-0" style={{ ...pos, ...member, width: RAIL.stile, backgroundImage: `${wood(90)}, linear-gradient(90deg, rgba(255,255,255,${i ? 0.02 : 0.14}) 0, rgba(0,0,0,0) 3px, rgba(0,0,0,0) calc(100% - 3px), rgba(0,0,0,0.35) 100%)` }} />
        ))}
        {[{ top: 0, height: RAIL.top }, { top: RAIL.top + PANEL_H, height: RAIL.mid }, { bottom: 0, height: RAIL.bottom }].map((pos, i) => (
          <span key={i} className="absolute" style={{ ...pos, ...member, left: RAIL.stile, right: RAIL.stile, backgroundImage: `${wood(180)}, linear-gradient(180deg, rgba(255,255,255,0.16) 0, rgba(0,0,0,0) 3px, rgba(0,0,0,0) calc(100% - 3px), rgba(0,0,0,0.4) 100%)` }} />
        ))}
        {/* two panels of louvres, each with its tilt rod */}
        {[RAIL.top, RAIL.top + PANEL_H + RAIL.mid].map((top) => (
          <span key={top} className="absolute" style={{ top, left: RAIL.stile, right: RAIL.stile, height: PANEL_H, transformStyle: "preserve-3d" }}>
            {Array.from({ length: SLATS }, (_, i) => (
              <span
                key={i}
                className="absolute inset-x-0"
                style={{
                  top: i * PITCH - 1.2,
                  height: PITCH + 2.4,
                  transform: `rotateX(calc(var(--t) * ${TILT}deg))`,
                  background: `linear-gradient(180deg, ${PAINT.lit} 0, ${PAINT.mid} 2.5px, ${PAINT.mid} 55%, ${PAINT.dark} 100%)`,
                  boxShadow: "inset 0 0 0 99px rgba(255,238,196,calc(var(--t) * 0.2 + var(--o) * 0.06)), inset 0 0 0 99px rgba(8,12,8,calc(0.44 - var(--t) * 0.36)), 0 1px 0 rgba(0,0,0,0.5)",
                }}
              />
            ))}
            <span className="absolute rounded-full" style={{ left: "50%", top: 5, width: 6, marginLeft: -3, height: PANEL_H - 10, transform: "translateZ(7px) translateY(calc(var(--t) * -7px))", background: `linear-gradient(90deg, ${PAINT.lit}, ${PAINT.mid} 45%, ${PAINT.dark})`, boxShadow: "3px 2px 3px rgba(0,0,0,0.45)" }} />
          </span>
        ))}
        {/* porcelain knob on the meeting stile */}
        <span className="absolute h-[13px] w-[13px] rounded-full" style={{ top: RAIL.top + PANEL_H + RAIL.mid / 2 - 6.5, [isLeft ? "right" : "left"]: 2, transform: "translateZ(5px)", background: "radial-gradient(circle at 35% 30%, #fffdf4, #d9d2bf 50%, #7d7767 100%)", boxShadow: "2px 3px 3px rgba(0,0,0,0.5)" }} />
        {/* the leaf's own shading: darker toward the hinge once it stands open */}
        <span className="absolute inset-0" style={{ transform: "translateZ(0.5px)", pointerEvents: "none", background: `linear-gradient(${isLeft ? 90 : 270}deg, rgba(0,0,0,calc(var(--o) * 0.34)), rgba(0,0,0,0) 80%)` }} />
      </div>
    );
  };

  const lit = (base: string, glow: string, k: number): CSSProperties => ({ backgroundColor: base, boxShadow: `inset 0 0 0 999px rgba(${glow},calc(var(--o) * ${k} + var(--t) * ${(k * 0.12).toFixed(3)}))` });
  /** A face of the wall: its lit colour, then shading laid over the top so it never goes flat. */
  const faceOf = (clip: string, base: string, glow: string, k: number, shade: string, extra?: JSX.Element) => (
    <span className="absolute inset-0" style={{ clipPath: clip, ...lit(base, glow, k) }}>
      <span className="absolute inset-0" style={{ background: shade }} />
      {extra}
    </span>
  );

  return (
    <section ref={wrapRef} className="relative h-[640px] w-full overflow-hidden sm:h-[720px]" style={{ backgroundColor: WALL, ["--o" as string]: 0, ["--t" as string]: 0 }}>
      {/* limewashed plaster: trowel marks, a darker ceiling line, and the daylight that reaches the wall once the leaves are open */}
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-[0.55] mix-blend-soft-light">
        <filter id="shutters-plaster" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="8" />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0.6 0.6 0.6 0 -0.5" />
        </filter>
        <rect width="100%" height="100%" filter="url(#shutters-plaster)" />
      </svg>
      <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(75% 90% at 50% 44%, rgba(176,106,84,0.22) 0%, rgba(0,0,0,0) 70%), linear-gradient(180deg, rgba(0,0,0,0.36) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 66%, rgba(0,0,0,0.46) 100%)" }} />
      <div aria-hidden="true" className="absolute inset-0" style={{ opacity: "calc(var(--o) * 0.92 + var(--t) * 0.08)", background: "radial-gradient(50% 72% at 50% 46%, rgba(255,200,150,0.42) 0%, rgba(255,186,136,0.16) 50%, rgba(0,0,0,0) 84%)" }} />

      <div ref={sceneRef} className="absolute left-1/2 top-1/2 select-none" style={{ width: SCENE_W, height: SCENE_H, transform: "translate(-50%, -50%)" }}>
        {/* architrave: a moulded timber surround, lit along its inner edge by the window */}
        <div aria-hidden="true" className="absolute" style={{ left: O.x - 26, top: O.y - 26, width: O.w + 52, height: O.h + 28, backgroundColor: "#5a4a40", backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(0,0,0,0) 36%, rgba(0,0,0,0.3))", borderRadius: "2px 2px 0 0", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.55), inset 0 1px 0 1px rgba(255,255,255,0.14), inset 0 0 0 6px rgba(0,0,0,0), inset 0 0 0 7px rgba(0,0,0,0.4), inset 0 0 0 8.5px rgba(255,255,255,0.1), inset 0 0 0 15px rgba(0,0,0,0.08), inset 0 0 0 16px rgba(0,0,0,0.4), inset 0 0 0 17.5px rgba(255,236,200,calc(0.08 + var(--o) * 0.4)), inset 0 0 0 999px rgba(255,214,170,calc(var(--o) * 0.2)), 0 26px 46px -8px rgba(0,0,0,0.6), 0 3px 4px rgba(0,0,0,0.6)" }} />

        {/* the depth of the wall: four faces running back to the shutters */}
        <div aria-hidden="true" className="absolute" style={{ left: O.x, top: O.y, width: O.w, height: O.h, backgroundColor: "#15100d" }}>
          {faceOf(`polygon(0 0, 100% 0, calc(100% - ${O.depth}px) ${O.depth}px, ${O.depth}px ${O.depth}px)`, "#2c211c", "214,176,150", 0.4, `linear-gradient(180deg, rgba(20,8,4,0.6), rgba(20,8,4,0.15) ${O.depth}px)`)}
          {faceOf(`polygon(0 0, ${O.depth}px ${O.depth}px, ${O.depth}px calc(100% - ${O.depth}px), 0 100%)`, "#33261f", "255,226,194", 0.76, `linear-gradient(90deg, rgba(50,20,10,0.55), rgba(50,20,10,0.08) ${O.depth - 5}px, rgba(255,250,235,0.22) ${O.depth}px), linear-gradient(180deg, rgba(30,10,4,0.5), rgba(30,10,4,0) 34%, rgba(255,240,200,0) 70%, rgba(255,240,200,0.16))`)}
          {faceOf(`polygon(100% 0, 100% 100%, calc(100% - ${O.depth}px) calc(100% - ${O.depth}px), calc(100% - ${O.depth}px) ${O.depth}px)`, "#33261f", "255,226,194", 0.76, `linear-gradient(270deg, rgba(50,20,10,0.55), rgba(50,20,10,0.08) ${O.depth - 5}px, rgba(255,250,235,0.22) ${O.depth}px), linear-gradient(180deg, rgba(30,10,4,0.5), rgba(30,10,4,0) 34%, rgba(255,240,200,0) 70%, rgba(255,240,200,0.16))`)}
          {faceOf(
            `polygon(${O.depth}px calc(100% - ${O.depth}px), calc(100% - ${O.depth}px) calc(100% - ${O.depth}px), 100% 100%, 0 100%)`, "#3d2e25", "255,232,198", 0.8,
            `linear-gradient(0deg, rgba(70,30,12,0.4), rgba(70,30,12,0) ${O.depth}px), linear-gradient(90deg, rgba(40,14,4,0.5), rgba(0,0,0,0) 18%, rgba(0,0,0,0) 82%, rgba(40,14,4,0.5))`,
            // bars of sun through the louvres while the leaves are still shut
            <span className="absolute inset-x-0 bottom-0" style={{ height: O.depth, opacity: "calc(var(--t) * (1 - var(--o)) * 0.9)", background: "repeating-linear-gradient(180deg, rgba(255,226,160,0.85) 0 2.6px, rgba(255,226,160,0) 3.4px 6px)" }} />,
          )}
        </div>

        {/* the opening itself */}
        <div className="absolute overflow-hidden" style={{ left: A.x, top: A.y, width: A.w, height: A.h, backgroundColor: view.tone, perspective: "900px", boxShadow: "0 0 0 1px rgba(0,0,0,0.7)" }}>
          <div ref={photoRef} className="absolute inset-0" style={{ transform: "scale(1.1)" }}>
            <img src={view.src} alt={view.alt} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: view.focus, filter: "brightness(1.06) saturate(1.15) contrast(1.04)" }} />
          </div>
          {/* outdoor glare: the eye is adjusted to the room */}
          <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 36%)" }} />
          <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-[26px] -translate-x-1/2" style={{ opacity: "calc(1 - var(--o))", background: "linear-gradient(90deg, rgba(255,236,190,0), rgba(255,236,190,0.9) 50%, rgba(255,236,190,0))", filter: "blur(5px)", transform: "translateZ(1px)" }} />
          {leaf("left")}
          {leaf("right")}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 10px 14px -8px rgba(0,0,0,0.6), inset 6px 0 10px -8px rgba(0,0,0,0.5), inset -6px 0 10px -8px rgba(0,0,0,0.5)" }} />
        </div>

        {/* sill board: oiled oak, its top catching the light and its nosing in shade */}
        <div aria-hidden="true" className="absolute" style={{ left: O.x - 44, top: O.y + O.h, width: O.w + 88, height: 24, clipPath: "polygon(20px 0, calc(100% - 20px) 0, 100% 100%, 0 100%)", ...lit("#4a3526", "255,214,160", 0.5) }}>
          <span className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(40,16,6,0.55), rgba(0,0,0,0) 10px), repeating-linear-gradient(90deg, rgba(40,18,6,0.16) 0 1px, rgba(0,0,0,0) 1px 7px, rgba(255,230,190,0.07) 7px 8px, rgba(0,0,0,0) 8px 19px, rgba(40,18,6,0.1) 19px 21px, rgba(0,0,0,0) 21px 37px), linear-gradient(90deg, rgba(40,16,6,0.6), rgba(0,0,0,0) 22%, rgba(0,0,0,0) 78%, rgba(40,16,6,0.6))" }} />
          <span className="absolute inset-0" style={{ opacity: "calc(var(--t) * (1 - var(--o)) * 0.75)", background: "repeating-linear-gradient(180deg, rgba(255,226,160,0) 0 3px, rgba(255,226,160,0.8) 4px 8px, rgba(255,226,160,0) 9px 12px)", clipPath: "polygon(15% 0, 85% 0, 90% 100%, 10% 100%)" }} />
        </div>
        <div aria-hidden="true" className="absolute rounded-b-[4px]" style={{ left: O.x - 44, top: O.y + O.h + 24, width: O.w + 88, height: 16, backgroundColor: "#35251a", backgroundImage: "linear-gradient(180deg, rgba(255,236,200,0.5) 0, rgba(255,236,200,0.08) 2px, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5)), repeating-linear-gradient(90deg, rgba(0,0,0,0.14) 0 1px, rgba(0,0,0,0) 1px 9px, rgba(255,230,190,0.05) 9px 10px, rgba(0,0,0,0) 10px 23px)", boxShadow: "inset 0 0 0 999px rgba(255,214,170,calc(var(--o) * 0.14)), 0 22px 26px -6px rgba(0,0,0,0.65), 0 3px 3px rgba(0,0,0,0.5)" }} />

        <button
          type="button"
          role="switch"
          aria-checked={open}
          aria-label="Shutters open"
          onClick={() => set(!open, true)}
          className="absolute cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-amber-200 focus-visible:ring-offset-4 focus-visible:ring-offset-[#3a2520]"
          style={{ left: O.x, top: O.y, width: O.w, height: O.h + 40 }}
        />
      </div>

      <p className="absolute bottom-5 left-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-stone-300 sm:bottom-8 sm:left-8">
        <span className="text-white">{view.place}</span>
        <span className="block" aria-live="polite">{open ? "Shutters open. Press to close them" : "Shutters closed. Press to open them"}</span>
      </p>
    </section>
  );
}

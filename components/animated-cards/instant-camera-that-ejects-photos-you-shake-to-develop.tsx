import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The roll of film: shot in this order, then round again. `note` is pencilled on the white border. */
const photos = [
  { src: "https://images.pexels.com/photos/11039284/pexels-photo-11039284.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "Woman in a black dress and sunglasses against a yellow wall", note: "Noon, Calle Ocho" },
  { src: "https://images.pexels.com/photos/11608677/pexels-photo-11608677.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "Woman with a bob looking over her shoulder in purple and orange light", note: "Odile, studio B" },
  { src: "https://images.pexels.com/photos/28893013/pexels-photo-28893013.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "Half an orange on a white ledge against a peach wall", note: "Breakfast" },
  { src: "https://images.pexels.com/photos/30089260/pexels-photo-30089260.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "Silhouette of a person in sunglasses in deep blue light", note: "Blue hour" },
  { src: "https://images.pexels.com/photos/32825246/pexels-photo-32825246.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "Man in a red beret and white jacket seated against an orange backdrop", note: "Remy waits" },
  { src: "https://images.pexels.com/photos/2907454/pexels-photo-2907454.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "Bananas and dragon fruit on yellow and pink plates", note: "Still life no. 4" },
];

/** Where photos come to rest: x in units of the spread, y in pixels from the top, tilt in degrees. */
const spots = [
  { kx: -1.5, y: 474, r: -9 },
  { kx: 1.5, y: 466, r: 7 },
  { kx: -0.5, y: 508, r: 6 },
  { kx: 0.52, y: 478, r: -8 },
];

const NODES = 5;
const PHOTO_W = 188;
const PHOTO_H = 226;
const SLOT_Y = 205;
const DEVELOP_SECONDS = 7;
const STAGE_H = 700;

type Phase = "off" | "eject" | "free" | "held" | "leave";
type Body = { phase: Phase; x: number; y: number; r: number; vx: number; vy: number; vr: number; tx: number; ty: number; tr: number; lift: number; d: number; t0: number; energy: number; fade: number; spot: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (v: number) => {
  const t = clamp(v, 0, 1);
  return t * t * (3 - 2 * t);
};

export default function InstantCameraThatEjectsPhotos() {
  const reduce = useReducedMotion();
  const [film, setFilm] = useState<number[]>([0, 1, 2, 3, 4]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Two photos on the table.");

  const stageRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const veilRefs = useRef<(HTMLDivElement | null)[]>([]);
  const glossRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shadeRefs = useRef<(HTMLDivElement | null)[]>([]);

  const world = useRef({
    bodies: Array.from({ length: NODES }, (_, i): Body => ({ phase: i < 2 ? "free" : "off", x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, tx: 0, ty: 0, tr: 0, lift: 0, d: i < 2 ? 1 : 0, t0: 0, energy: 0, fade: 1, spot: i < 2 ? i : -1 })),
    shots: 0,
    z: 20,
    raf: 0,
    last: 0,
    spread: 190,
    scale: 1,
    width: 1200,
    held: -1,
    grabX: 0,
    grabY: 0,
    lastShot: -1e9,
    lastTouch: -1e9,
    visible: true,
    ready: false,
  });

  const draw = useCallback((i: number) => {
    const w = world.current;
    const b = w.bodies[i];
    const node = nodeRefs.current[i];
    if (!node) return;
    if (b.phase === "off") {
      node.style.opacity = "0";
      node.style.pointerEvents = "none";
      return;
    }
    const size = w.scale * (1 + 0.07 * b.lift);
    node.style.opacity = b.fade.toFixed(3);
    node.style.pointerEvents = b.phase === "eject" || b.phase === "leave" ? "none" : "auto";
    node.style.transform = `translate(-50%,-50%) translate3d(${b.x.toFixed(1)}px,${b.y.toFixed(1)}px,0) rotate(${b.r.toFixed(2)}deg) scale(${size.toFixed(3)})`;
    if (b.phase === "eject") {
      const top = b.y - (PHOTO_H * w.scale) / 2;
      node.style.clipPath = `inset(${Math.max(0, (SLOT_Y - top) / w.scale).toFixed(1)}px -60px -80px -60px)`;
    } else if (node.style.clipPath) node.style.clipPath = "";
    const shade = shadeRefs.current[i];
    if (shade) {
      shade.style.transform = `translate(${(6 * b.lift).toFixed(1)}px,${(9 + 30 * b.lift).toFixed(1)}px) scale(${(1 + 0.05 * b.lift).toFixed(3)})`;
      shade.style.opacity = (0.62 - 0.26 * b.lift).toFixed(3);
    }
    const gloss = glossRefs.current[i];
    if (gloss) gloss.style.backgroundPosition = `${(50 + b.r * 3.2 + b.x * 0.05).toFixed(1)}% 0`;
    // Developing: a milky veil clears while contrast and colour come up from a warm, flat start.
    const image = imageRefs.current[i];
    const veil = veilRefs.current[i];
    if (image && veil) {
      const d = b.d;
      veil.style.opacity = (1 - smooth(d * 1.5)).toFixed(3);
      image.style.filter = d >= 1 ? "none" : `contrast(${(0.5 + 0.5 * smooth(d)).toFixed(3)}) saturate(${(0.15 + 0.85 * smooth((d - 0.25) / 0.75)).toFixed(3)}) brightness(${(1.3 - 0.3 * smooth(d)).toFixed(3)}) sepia(${(0.55 * (1 - smooth(d))).toFixed(3)})`;
    }
  }, []);

  const measure = useCallback(() => {
    const w = world.current;
    const width = stageRef.current?.clientWidth ?? 1200;
    w.width = width;
    w.spread = clamp(0.22 * width - 22, 52, 190);
    w.scale = width < 480 ? 0.82 : 1;
    w.bodies.forEach((b) => {
      if (b.spot >= 0 && b.phase === "free") {
        b.tx = spots[b.spot].kx * w.spread;
        b.ty = spots[b.spot].y;
        b.tr = spots[b.spot].r;
      }
    });
  }, []);

  const step = useCallback(
    (now: number) => {
      const w = world.current;
      w.raf = 0;
      const dt = Math.min(0.033, (now - w.last) / 1000 || 0.016);
      w.last = now;
      let awake = false;
      for (let i = 0; i < NODES; i++) {
        const b = w.bodies[i];
        if (b.phase === "off") continue;
        if (b.phase === "eject") {
          const t = clamp((now - b.t0) / 950, 0, 1);
          const from = SLOT_Y - (PHOTO_H * w.scale) / 2 + 4;
          const to = SLOT_Y + (PHOTO_H * w.scale) / 2 + 10;
          // The rollers push it out in three short pulls.
          const feed = (Math.floor(t * 3) + smooth((t * 3) % 1)) / 3;
          b.x = 0;
          b.y = from + (to - from) * Math.min(1, feed);
          b.r = 0;
          awake = true;
          if (t >= 1) {
            b.phase = "free";
            b.vy = 260;
            b.vx = (b.tx - b.x) * 0.6;
            b.vr = b.tr * 5;
            const old = w.bodies.findIndex((o, n) => n !== i && o.spot === b.spot && o.phase !== "off");
            if (old >= 0) {
              w.bodies[old].phase = "leave";
              w.bodies[old].spot = -1;
            }
          }
        } else {
          const held = b.phase === "held";
          const k = held ? 300 : b.phase === "leave" ? 30 : 110;
          const c = held ? 26 : b.phase === "leave" ? 6 : 15;
          if (b.phase === "leave") {
            b.ty = STAGE_H + 260;
            b.fade = clamp(b.fade - dt * 1.6, 0, 1);
            if (b.fade <= 0) b.phase = "off";
          }
          if (held) b.tr = clamp(b.vx * 0.045, -24, 24);
          b.vx += (k * (b.tx - b.x) - c * b.vx) * dt;
          b.vy += (k * (b.ty - b.y) - c * b.vy) * dt;
          b.vr += (90 * (b.tr - b.r) - 11 * b.vr) * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.r += b.vr * dt;
          b.lift += ((held ? 1 : 0) - b.lift) * Math.min(1, dt * 12);
          const speed = Math.hypot(b.vx, b.vy);
          b.energy = held ? b.energy * 0.92 + Math.min(1, speed / 900) * 0.4 : b.energy * 0.9;
          if (held || b.phase === "leave" || speed > 3 || Math.abs(b.vr) > 2 || Math.hypot(b.tx - b.x, b.ty - b.y) > 0.4 || b.lift > 0.01) awake = true;
        }
        if (b.d < 1) {
          b.d = Math.min(1, b.d + (dt / DEVELOP_SECONDS) * (1 + b.energy * 2.4));
          awake = true;
        }
        draw(i);
      }
      if (awake) w.raf = requestAnimationFrame(step);
    },
    [draw],
  );

  const wake = useCallback(() => {
    const w = world.current;
    if (w.raf) return;
    w.last = performance.now();
    w.raf = requestAnimationFrame(step);
  }, [step]);

  const shoot = useCallback(() => {
    const w = world.current;
    const now = performance.now();
    if (now - w.lastShot < 1250) return;
    w.lastShot = now;
    const k = w.shots++;
    const i = (2 + k) % NODES;
    const spot = (2 + k) % spots.length;
    const frame = (2 + k) % photos.length;
    setFilm((list) => list.map((value, n) => (n === i ? frame : value)));
    setStatus(`New photo: ${photos[frame].alt}. It takes a few seconds to develop.`);
    const b = w.bodies[i];
    Object.assign(b, { x: 0, y: SLOT_Y - PHOTO_H / 2, r: 0, vx: 0, vy: 0, vr: 0, lift: 0, d: 0, energy: 0, fade: 1, spot, t0: now });
    b.tx = spots[spot].kx * w.spread;
    b.ty = spots[spot].y;
    b.tr = spots[spot].r + (k % 2 ? 2 : -2);
    const node = nodeRefs.current[i];
    if (node) node.style.zIndex = String(++w.z);
    if (reduce) {
      const old = w.bodies.findIndex((o, n) => n !== i && o.spot === spot && o.phase !== "off");
      if (old >= 0) {
        w.bodies[old].phase = "off";
        w.bodies[old].spot = -1;
        draw(old);
      }
      Object.assign(b, { phase: "free", x: b.tx, y: b.ty, r: b.tr, d: 1 });
      draw(i);
      return;
    }
    b.phase = "eject";
    setBusy(true);
    window.setTimeout(() => setBusy(false), 1250);
    flashRef.current?.animate?.([{ opacity: 0.9 }, { opacity: 0.25, offset: 0.25 }, { opacity: 0 }], { duration: 520, easing: "ease-out" });
    cameraRef.current?.animate?.([{ transform: "translateY(0)" }, { transform: "translateY(3px) rotate(-0.6deg)" }, { transform: "translateY(0)" }], { duration: 260, easing: "ease-out" });
    wake();
  }, [draw, reduce, wake]);

  // Lay out the table, then keep shooting until someone takes over (and again after a quiet spell).
  useEffect(() => {
    const w = world.current;
    const stage = stageRef.current;
    measure();
    w.bodies.forEach((b, i) => {
      if (b.phase === "free" && !w.ready) Object.assign(b, { x: b.tx, y: b.ty, r: b.tr });
      draw(i);
    });
    w.ready = true;
    const resize = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => { measure(); if (reduce) w.bodies.forEach((b, i) => { if (b.phase === "free") { Object.assign(b, { x: b.tx, y: b.ty, r: b.tr }); draw(i); } }); else wake(); }) : null;
    const seen = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([entry]) => { w.visible = entry.isIntersecting; }) : null;
    if (stage) {
      resize?.observe(stage);
      seen?.observe(stage);
    }
    let first = 0;
    let loop = 0;
    if (!reduce) {
      const auto = () => {
        if (w.visible && !document.hidden && performance.now() - w.lastTouch > 9000) shoot();
      };
      first = window.setTimeout(auto, 350);
      loop = window.setInterval(auto, 4300);
    }
    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
      resize?.disconnect();
      seen?.disconnect();
      if (w.raf) cancelAnimationFrame(w.raf);
      w.raf = 0;
    };
  }, [draw, measure, reduce, shoot, wake]);

  const local = (event: React.PointerEvent) => {
    const box = stageRef.current?.getBoundingClientRect();
    return { x: event.clientX - (box ? box.left + box.width / 2 : 0), y: event.clientY - (box ? box.top : 0) };
  };
  const grab = (i: number) => (event: React.PointerEvent<HTMLDivElement>) => {
    const w = world.current;
    const b = w.bodies[i];
    w.lastTouch = performance.now();
    if (reduce || (b.phase !== "free" && b.phase !== "held")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = local(event);
    w.held = i;
    w.grabX = p.x - b.x;
    w.grabY = p.y - b.y;
    b.phase = "held";
    b.spot = -1;
    event.currentTarget.style.zIndex = String(++w.z);
    wake();
  };
  const drag = (i: number) => (event: React.PointerEvent<HTMLDivElement>) => {
    const w = world.current;
    if (w.held !== i) return;
    const p = local(event);
    const b = w.bodies[i];
    b.tx = p.x - w.grabX;
    b.ty = p.y - w.grabY;
    w.lastTouch = performance.now();
    wake();
  };
  const drop = (i: number) => () => {
    const w = world.current;
    if (w.held !== i) return;
    w.held = -1;
    const b = w.bodies[i];
    b.phase = "free";
    const reach = Math.max(0, w.width / 2 - 70);
    b.tx = clamp(b.tx, -reach, reach);
    b.ty = clamp(b.ty, 330, STAGE_H - 110);
    b.tr = clamp(b.r * 0.5 + b.vx * 0.01, -14, 14);
    wake();
  };

  return (
    <section
      ref={stageRef}
      className="relative w-full select-none overflow-hidden"
      style={{ height: STAGE_H, background: "radial-gradient(90% 70% at 50% 22%,#3a3d38 0%,#262925 45%,#161816 100%)", ["--s" as string]: "clamp(52px, 22vw - 22px, 190px)" }}
    >
      {/* a pool of light on the table */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%]" style={{ background: "radial-gradient(60% 70% at 50% 60%,rgba(255,244,224,.09),transparent 70%)" }} aria-hidden="true" />

      {/* the photos */}
      {film.map((frame, i) => {
        const photo = photos[frame];
        const start = i < 2 ? spots[i] : null;
        return (
          <div
            key={i}
            ref={(node) => {
              nodeRefs.current[i] = node;
            }}
            onPointerDown={grab(i)}
            onPointerMove={drag(i)}
            onPointerUp={drop(i)}
            onPointerCancel={drop(i)}
            className="absolute left-1/2 top-0 cursor-grab touch-none active:cursor-grabbing"
            style={{
              width: PHOTO_W,
              height: PHOTO_H,
              zIndex: 10 + i,
              opacity: start ? 1 : 0,
              willChange: "transform",
              transform: start ? `translate(-50%,-50%) translate(calc(var(--s) * ${start.kx}),${start.y}px) rotate(${start.r}deg)` : "translate(-50%,-50%)",
            }}
          >
            <div
              ref={(node) => {
                shadeRefs.current[i] = node;
              }}
              className="absolute inset-0 rounded-[6px] bg-black"
              style={{ filter: "blur(13px)", opacity: 0.62, transform: "translate(0,9px)" }}
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 rounded-[3px]"
              style={{
                background: "linear-gradient(170deg,#fdfcf8 0%,#f3f0e8 60%,#e9e5da 100%)",
                boxShadow: "0 1px 0 #d6d1c4, 0 2px 0 #b9b4a6, 0 3px 1px rgba(0,0,0,.5), inset 0 1px 0 #fff, inset 0 0 0 1px rgba(120,110,90,.12)",
              }}
            >
              <div className="absolute left-[13px] top-[13px] overflow-hidden rounded-[1px] bg-[#8f9a98]" style={{ width: PHOTO_W - 26, height: PHOTO_W - 26, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.35)" }}>
                <img
                  alt={photo.alt}
                  src={photo.src}
                  ref={(node) => {
                    imageRefs.current[i] = node;
                  }}
                  width={PHOTO_W - 26}
                  height={PHOTO_W - 26}
                  loading="lazy"
                  draggable={false}
                  className="h-full w-full object-cover"
                />
                <div
                  ref={(node) => {
                    veilRefs.current[i] = node;
                  }}
                  className="absolute inset-0"
                  style={{ opacity: 0, background: "radial-gradient(120% 120% at 30% 20%,#b9c2bd 0%,#8f9a98 55%,#6e7a7c 100%)" }}
                  aria-hidden="true"
                />
                <div
                  ref={(node) => {
                    glossRefs.current[i] = node;
                  }}
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(112deg,rgba(255,255,255,0) 38%,rgba(255,255,255,.28) 47%,rgba(255,255,255,.06) 53%,rgba(255,255,255,0) 62%)", backgroundSize: "300% 100%", backgroundPosition: "50% 0", boxShadow: "inset 0 2px 5px rgba(0,0,0,.35), inset 0 0 0 1px rgba(0,0,0,.2)" }}
                  aria-hidden="true"
                />
              </div>
              <p className="absolute inset-x-0 bottom-[11px] text-center font-serif text-[13px] italic text-[#4a5568]" style={{ transform: "rotate(-1.5deg)" }}>
                {photo.note}
              </p>
            </div>
          </div>
        );
      })}

      {/* the camera */}
      <div ref={cameraRef} className="absolute left-1/2 top-[40px] z-[5] -ml-[140px] h-[176px] w-[280px]">
        <div
          className="absolute inset-0 rounded-[30px]"
          style={{
            background: "linear-gradient(180deg,#f6f1e6 0%,#e9e2d2 52%,#d3cab6 100%)",
            boxShadow: "inset 0 2px 0 rgba(255,255,255,.9), inset 0 -5px 8px rgba(96,80,50,.35), inset 3px 0 5px rgba(255,255,255,.4), inset -3px 0 6px rgba(96,80,50,.2), 0 28px 40px -14px rgba(0,0,0,.75), 0 6px 10px rgba(0,0,0,.4)",
          }}
          aria-hidden="true"
        >
          {/* colour band */}
          <div className="absolute inset-x-0 top-[82px] h-[5px] bg-[#e4572e]" />
          <div className="absolute inset-x-0 top-[87px] h-[5px] bg-[#f2a541]" />
          {/* flash */}
          <div className="absolute left-[22px] top-[20px] h-[36px] w-[62px] rounded-[9px] p-[4px]" style={{ background: "linear-gradient(180deg,#2c2c2f,#141416)", boxShadow: "0 1px 0 rgba(255,255,255,.7), inset 0 1px 2px rgba(0,0,0,.8)" }}>
            <div className="h-full w-full rounded-[5px]" style={{ background: "repeating-linear-gradient(90deg,rgba(255,255,255,.55) 0 1px,rgba(255,255,255,0) 1px 4px),radial-gradient(60% 90% at 50% 50%,#fffdf2 0%,#d9d6c8 55%,#8c8a80 100%)" }} />
          </div>
          {/* viewfinder */}
          <div className="absolute right-[26px] top-[20px] h-[30px] w-[38px] rounded-[7px] p-[4px]" style={{ background: "linear-gradient(180deg,#2c2c2f,#141416)", boxShadow: "0 1px 0 rgba(255,255,255,.7)" }}>
            <div className="h-full w-full rounded-[3px]" style={{ background: "linear-gradient(135deg,#5b6f86 0%,#1b2330 45%,#0c1017 100%)" }} />
          </div>
          {/* lens */}
          <div className="absolute left-1/2 top-[24px] -ml-[59px] h-[118px] w-[118px] rounded-full" style={{ background: "conic-gradient(from 210deg,#3a3a3d,#0f0f11,#4a4a4e,#161618,#3a3a3d)", boxShadow: "0 0 0 5px #ede7d9, 0 0 0 6px rgba(96,80,50,.35), 0 8px 12px rgba(0,0,0,.45), inset 0 2px 3px rgba(255,255,255,.25)" }}>
            <div className="absolute inset-[11px] rounded-full" style={{ background: "repeating-conic-gradient(#1a1a1c 0 4deg,#2b2b2e 4deg 8deg)", boxShadow: "inset 0 0 0 2px #050506" }} />
            <div className="absolute inset-[23px] rounded-full" style={{ background: "radial-gradient(circle at 50% 50%,#05060a 0 22%,#1b2a5a 40%,#3a2468 58%,#0a0c18 78%,#000 100%)", boxShadow: "inset 0 0 12px #000, 0 0 0 2px #0a0a0b" }} />
            <div className="absolute left-[36px] top-[31px] h-[20px] w-[30px] rounded-full" style={{ background: "radial-gradient(closest-side,rgba(255,255,255,.75),rgba(255,255,255,0))", transform: "rotate(-32deg)" }} />
            <div className="absolute bottom-[34px] right-[36px] h-[9px] w-[13px] rounded-full" style={{ background: "radial-gradient(closest-side,rgba(180,210,255,.6),rgba(255,255,255,0))" }} />
          </div>
          {/* print slot */}
          <div className="absolute inset-x-[26px] bottom-[9px] h-[9px] rounded-full" style={{ background: "linear-gradient(180deg,#050505,#2a2a2a)", boxShadow: "0 1px 0 rgba(255,255,255,.75), inset 0 2px 3px #000" }} />
          <span className="absolute bottom-[26px] left-[26px] text-[8px] font-bold uppercase tracking-[0.28em] text-[#8a7d62]">Instant 70</span>
        </div>
        <button
          type="button"
          onClick={() => {
            world.current.lastTouch = performance.now();
            shoot();
          }}
          aria-label="Take a photo"
          aria-disabled={busy}
          className="absolute right-[20px] top-[100px] h-[44px] w-[44px] rounded-full outline-none transition-transform duration-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9e2d2] active:scale-90"
          style={{ background: "radial-gradient(circle at 38% 30%,#ff8f73 0%,#e4572e 45%,#a5321a 100%)", boxShadow: "0 0 0 4px #d9d0bd, 0 0 0 5px rgba(96,80,50,.4), 0 4px 6px rgba(0,0,0,.4), inset 0 2px 2px rgba(255,255,255,.5), inset 0 -3px 4px rgba(90,20,5,.5)" }}
        />
      </div>

      {/* flash */}
      <div ref={flashRef} className="pointer-events-none absolute inset-0 z-[90]" style={{ opacity: 0, background: "radial-gradient(70% 60% at calc(50% - 87px) 78px,#fffdf5 0%,rgba(255,250,235,.85) 30%,rgba(255,250,235,.35) 100%)" }} aria-hidden="true" />

      <p className="pointer-events-none absolute inset-x-4 bottom-5 z-[4] text-center text-[13px] text-stone-400">Press the red button. Pick a photo up and shake it to develop it faster.</p>
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
    </section>
  );
}

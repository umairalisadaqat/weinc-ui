import { useEffect, useRef } from "react";

// The values worth changing.
const SETTINGS = {
  density: 520, // square pixels per streak; lower draws more wind
  speed: 1, // how fast the air moves; 0.6 is a calm day
  trail: 0.075, // how quickly old strokes fade; higher gives shorter streaks
  calm: "rgba(118, 152, 178, 0.55)", // slow air
  breeze: "rgba(196, 216, 228, 0.7)", // middling air
  gust: "rgba(255, 226, 184, 0.9)", // the fastest air, near the low
};

// The wind: a slow rolling field plus one low-pressure system that air spirals into.
function windAngle(x: any, y: any, t: any, w: any, h: any) {
  const base = Math.sin(x * 0.0019 + t * 0.045) * 1.5 + Math.cos(y * 0.0026 - t * 0.035) * 1.3 + Math.sin((x + y) * 0.0011 + 1.3);
  const cx = w * (w < 700 ? 0.6 : 0.72) + Math.sin(t * 0.05) * 40;
  const cy = h * (w < 700 ? 0.8 : 0.5) + Math.cos(t * 0.04) * 30;
  const dx = x - cx;
  const dy = y - cy;
  const d = Math.sqrt(dx * dx + dy * dy) + 1;
  const spin = Math.atan2(dy, dx) + Math.PI / 2 + 0.35;
  const k = Math.exp(-d / (Math.min(w, h) * 0.42));
  // Blend directions as vectors, not angles, so there is no seam where the angle wraps around.
  const vx = Math.cos(base) * (1 - k) + Math.cos(spin) * k;
  const vy = Math.sin(base) * (1 - k) + Math.sin(spin) * k;
  return { a: Math.atan2(vy, vx), s: 0.55 + 0.25 * Math.sin(x * 0.004 + y * 0.003 + t * 0.2) + k * 1.4 };
}

const SCENE: any = {
  start: 0,
  still: 0,
  init(ctx: any, w: any, h: any) {
    const n = Math.round((w * h) / SETTINGS.density);
    const ps: any[] = [];
    for (let i = 0; i < n; i++) ps.push({ x: Math.random() * w, y: Math.random() * h, life: Math.random() * 160 });
    const st = { ps, t: 0 };
    ctx.clearRect(0, 0, w, h);
    // Run the wind for a while first so the very first frame is already full of streaks.
    for (let i = 0; i < 70; i++) SCENE.step(ctx, w, h, st, 1 / 60);
    return st;
  },
  step(ctx: any, w: any, h: any, st: any, dt: any) {
    st.t += dt;
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = `rgba(0,0,0,${SETTINGS.trail})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
    const paths = [new Path2D(), new Path2D(), new Path2D()];
    const move = SETTINGS.speed * dt * 60 * 1.6;
    for (const p of st.ps) {
      const f = windAngle(p.x, p.y, st.t, w, h);
      const nx = p.x + Math.cos(f.a) * f.s * move;
      const ny = p.y + Math.sin(f.a) * f.s * move;
      const bucket = f.s < 0.6 ? 0 : f.s < 1 ? 1 : 2;
      paths[bucket].moveTo(p.x, p.y);
      paths[bucket].lineTo(nx, ny);
      p.x = nx;
      p.y = ny;
      p.life -= dt * 60;
      if (p.life < 0 || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) {
        p.x = Math.random() * w;
        p.y = Math.random() * h;
        p.life = 80 + Math.random() * 160;
      }
    }
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    const colours = [SETTINGS.calm, SETTINGS.breeze, SETTINGS.gust];
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = colours[i];
      ctx.stroke(paths[i]);
    }
  },
  draw(ctx: any, w: any, h: any, t: any, st: any, ptr: any, dt: any) {
    if (dt > 0) SCENE.step(ctx, w, h, st, dt);
  },
};

// Runs a scene on a canvas: sizes it to the block, pauses off screen and in hidden tabs, cleans up after itself.
function runScene(root: any, canvas: any, scene: any, reduced: boolean) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  let w = 0;
  let h = 0;
  let st: any = null;
  let raf = 0;
  let last = 0;
  let acc = 0;
  let onScreen = true;
  let time = reduced ? (scene.still ?? scene.start ?? 0) : (scene.start ?? 0);
  const ptr: any = { x: 0, y: 0, on: false, down: 0 };
  const step = 1 / (scene.fps || 60);
  const resize = () => {
    const r = root.getBoundingClientRect();
    const nw = Math.max(1, Math.round(r.width));
    const nh = Math.max(1, Math.round(r.height));
    if (nw === w && nh === h && st) return;
    w = nw;
    h = nh;
    // Device pixels are capped at 1.5 and scaled by the scene's own quality factor.
    const d = Math.min(window.devicePixelRatio || 1, 1.5) * (scene.scale || 1);
    canvas.width = Math.max(1, Math.round(w * d));
    canvas.height = Math.max(1, Math.round(h * d));
    ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    st = scene.init(ctx, w, h, canvas.width / w);
    scene.draw(ctx, w, h, time, st, ptr, 0);
  };
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const dt = last ? Math.min(0.1, (now - last) / 1000) : step;
    last = now;
    acc += dt;
    if (acc < step * 0.95) return;
    const used = Math.min(acc, 0.1);
    acc = 0;
    time += used;
    scene.draw(ctx, w, h, time, st, ptr, used);
  };
  const play = () => {
    if (raf || reduced || !onScreen || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const ro = new ResizeObserver(resize);
  ro.observe(root);
  const io = new IntersectionObserver((entries: any) => {
    onScreen = entries[0].isIntersecting;
    if (onScreen) play();
    else stop();
  });
  io.observe(root);
  const onVis = () => (document.hidden ? stop() : play());
  const onMove = (e: any) => {
    const r = root.getBoundingClientRect();
    ptr.x = e.clientX - r.left;
    ptr.y = e.clientY - r.top;
    ptr.on = true;
  };
  const onLeave = () => {
    ptr.on = false;
  };
  const onDown = (e: any) => {
    onMove(e);
    ptr.down += 1;
  };
  document.addEventListener("visibilitychange", onVis);
  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerleave", onLeave);
  root.addEventListener("pointerdown", onDown);
  resize();
  play();
  return () => {
    stop();
    ro.disconnect();
    io.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    root.removeEventListener("pointermove", onMove);
    root.removeEventListener("pointerleave", onLeave);
    root.removeEventListener("pointerdown", onDown);
  };
}

export default function WindMapFlowFieldBackground() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    // Visitors who prefer reduced motion get one settled frame and no loop.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return runScene(root, canvas, SCENE, reduced);
  }, []);

  return (
    <section ref={rootRef} className="relative h-[640px] w-full overflow-hidden bg-[#0c1520] text-[#f2f5f7]" style={{ backgroundImage: "linear-gradient(rgba(140,170,200,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(140,170,200,.06) 1px, transparent 1px)", backgroundSize: "72px 72px" }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 block h-full w-full" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(12,21,32,.92) 0%, rgba(12,21,32,.7) 38%, rgba(12,21,32,0) 70%)" }} />
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center items-start text-left px-6 py-14 sm:px-10">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f3d9b1]">Fairlead marine forecasts</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">Know the wind before you leave the mooring.</h2>
          <p className="mt-5 text-base leading-relaxed text-[#c3ced8] sm:text-lg">Hour by hour wind, gusts and swell for the anchorages you actually sail, checked by forecasters who live on the coast.</p>
          <a href="#" className="mt-8 inline-flex h-12 items-center rounded-[6px] bg-[#f3d9b1] px-6 text-sm font-semibold text-[#1a1410] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3d9b1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1520]">See this week’s forecast</a>
        </div>
      </div>
    </section>
  );
}

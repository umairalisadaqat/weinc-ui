import { useEffect, useRef } from "react";

// The values worth changing.
const SETTINGS = {
  gap: 22, // distance between dots in pixels
  ink: "rgba(36, 44, 58, 0.62)", // dots at rest
  thread: "rgba(190, 82, 46, 0.95)", // dots pulled furthest by the pointer
  reach: 180, // radius of the pointer's push, in pixels
  push: 46, // how far the cloth is pressed at the centre
  spring: 18, // how quickly the cloth springs back; lower is looser
};

const SCENE: any = {
  start: 0,
  still: 2.2,
  init(ctx: any, w: any, h: any) {
    const g = SETTINGS.gap;
    const cols = Math.ceil(w / g) + 1;
    const rows = Math.ceil(h / g) + 1;
    const ox = (w - (cols - 1) * g) / 2;
    const oy = (h - (rows - 1) * g) / 2;
    const n = cols * rows;
    const st: any = { cols, rows, ox, oy, dx: new Float32Array(n), dy: new Float32Array(n), vx: new Float32Array(n), vy: new Float32Array(n), px: w * 0.7, py: h * 0.5 };
    // Settle the cloth around the idle pointer before the first frame.
    for (let i = 0; i < 40; i++) SCENE.step(st, w, h, 1 / 60, i / 60, { on: false });
    return st;
  },
  step(st: any, w: any, h: any, dt: any, t: any, ptr: any) {
    // Without a real pointer, an unseen hand drifts across the cloth in a slow figure of eight.
    const tx = ptr.on ? ptr.x : w * (0.62 + 0.28 * Math.sin(t * 0.37));
    const ty = ptr.on ? ptr.y : h * (0.5 + 0.32 * Math.sin(t * 0.74));
    st.px += (tx - st.px) * Math.min(1, dt * 6);
    st.py += (ty - st.py) * Math.min(1, dt * 6);
    const g = SETTINGS.gap;
    const R = SETTINGS.reach;
    const k = SETTINGS.spring;
    const damp = Math.exp(-dt * 5.5);
    for (let r = 0; r < st.rows; r++) {
      for (let c = 0; c < st.cols; c++) {
        const i = r * st.cols + c;
        const bx = st.ox + c * g;
        const by = st.oy + r * g;
        const ex = bx - st.px;
        const ey = by - st.py;
        const d2 = ex * ex + ey * ey;
        let fx = -st.dx[i] * k * k * 0.05;
        let fy = -st.dy[i] * k * k * 0.05;
        if (d2 < R * R * 4) {
          const d = Math.sqrt(d2) + 0.001;
          const fall = Math.exp(-d2 / (R * R * 0.5));
          fx += (ex / d) * fall * SETTINGS.push * 9;
          fy += (ey / d) * fall * SETTINGS.push * 9;
        }
        st.vx[i] = (st.vx[i] + fx * dt) * damp;
        st.vy[i] = (st.vy[i] + fy * dt) * damp;
        st.dx[i] += st.vx[i] * dt;
        st.dy[i] += st.vy[i] * dt;
      }
    }
  },
  draw(ctx: any, w: any, h: any, t: any, st: any, ptr: any, dt: any) {
    if (dt > 0) SCENE.step(st, w, h, dt, t, ptr);
    ctx.clearRect(0, 0, w, h);
    const g = SETTINGS.gap;
    const calm = new Path2D();
    const mid = new Path2D();
    const hot = new Path2D();
    for (let r = 0; r < st.rows; r++) {
      for (let c = 0; c < st.cols; c++) {
        const i = r * st.cols + c;
        const x = st.ox + c * g + st.dx[i];
        const y = st.oy + r * g + st.dy[i];
        const m = Math.sqrt(st.dx[i] * st.dx[i] + st.dy[i] * st.dy[i]) / SETTINGS.push;
        // Stretched cloth shows bigger, warmer dots, as if the weave opens under the press.
        const rad = 1.35 + Math.min(1.8, m * 1.8);
        const p = m < 0.15 ? calm : m < 0.4 ? mid : hot;
        p.moveTo(x + rad, y);
        p.arc(x, y, rad, 0, 6.2832);
      }
    }
    // A soft shadow where the cloth is pressed in.
    const dent = ctx.createRadialGradient(st.px, st.py, 0, st.px, st.py, SETTINGS.reach * 1.1);
    dent.addColorStop(0, "rgba(60, 50, 40, 0.10)");
    dent.addColorStop(0.6, "rgba(60, 50, 40, 0.04)");
    dent.addColorStop(1, "rgba(60, 50, 40, 0)");
    ctx.fillStyle = dent;
    ctx.fillRect(st.px - SETTINGS.reach * 1.2, st.py - SETTINGS.reach * 1.2, SETTINGS.reach * 2.4, SETTINGS.reach * 2.4);
    ctx.fillStyle = SETTINGS.ink;
    ctx.fill(calm);
    ctx.fillStyle = "rgba(120, 70, 56, 0.75)";
    ctx.fill(mid);
    ctx.fillStyle = SETTINGS.thread;
    ctx.fill(hot);
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

export default function DotGridFabricBackground() {
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
    <section ref={rootRef} className="relative h-[600px] w-full overflow-hidden bg-[#f3f1ec] text-[#1e2733]">
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 block h-full w-full" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 46% 44% at 50% 50%, rgba(243,241,236,0.96) 0%, rgba(243,241,236,0.8) 60%, rgba(243,241,236,0) 100%)" }} />
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center items-center text-center px-6 py-14 sm:px-10">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a8452a]">Weft and Warp Studio</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">Woven textiles for quiet rooms.</h2>
          <p className="mt-5 text-base leading-relaxed text-[#48505c] sm:text-lg">Upholstery and curtain cloth designed in our studio and woven on old shuttle looms.</p>
          <a href="#" className="mt-8 inline-flex h-12 items-center rounded-full bg-[#a8452a] px-6 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a8452a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3f1ec]">Browse the swatch library</a>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef } from "react";

// The values worth changing.
const SETTINGS = {
  horizon: 0.68, // where the land meets the sky, as a share of the height
  shimmer: 7, // how far the hot air bends the horizon, in pixels
  band: 90, // how tall the shimmering band is, in pixels
  skyTop: "#f6ead9", // the pale sky behind the headline
  skyLow: "#f4c595", // the warm glow at the horizon
  sand: "#d9a172", // near dunes
};

const SCENE: any = {
  start: 0,
  still: 0,
  scale: 0.8,
  init(ctx: any, w: any, h: any, k: any) {
    // Paint the whole landscape once; each frame only re-draws it in thin, shifted strips.
    const off = document.createElement("canvas");
    off.width = Math.round(w * k);
    off.height = Math.round(h * k);
    const c = off.getContext("2d");
    c.scale(k, k);
    const hy = Math.round(h * SETTINGS.horizon);
    const sky = c.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, SETTINGS.skyTop);
    sky.addColorStop(0.55, "#f6dcbc");
    sky.addColorStop(1, SETTINGS.skyLow);
    c.fillStyle = sky;
    c.fillRect(0, 0, w, hy + 1);
    const sx = w * (w < 700 ? 0.74 : 0.7);
    const sun = c.createRadialGradient(sx, hy - 18, 0, sx, hy - 18, Math.max(w, h) * 0.35);
    sun.addColorStop(0, "rgba(255,248,232,0.95)");
    sun.addColorStop(0.06, "rgba(255,240,214,0.85)");
    sun.addColorStop(0.07, "rgba(255,228,190,0.45)");
    sun.addColorStop(1, "rgba(255,214,170,0)");
    c.fillStyle = sun;
    c.fillRect(0, 0, w, hy + 1);
    // Two ranges of mesas, the far one paler from the haze.
    const range = (seed: any, top: any, colour: any, rough: any) => {
      c.beginPath();
      c.moveTo(0, hy + 1);
      let y = top;
      for (let x = 0; x <= w + 8; x += 8) {
        const n = Math.sin(x * 0.011 + seed) + Math.sin(x * 0.027 + seed * 2.1) * 0.5;
        const flat = n > 0.55 ? -rough : n > -0.2 ? -rough * 0.35 : 0;
        y += (hy + flat - y) * 0.35;
        c.lineTo(x, y);
      }
      c.lineTo(w, hy + 1);
      c.closePath();
      c.fillStyle = colour;
      c.fill();
    };
    range(1.3, hy, "rgba(205,150,132,0.55)", Math.min(46, h * 0.07));
    range(4.1, hy, "rgba(166,108,96,0.75)", Math.min(26, h * 0.04));
    const ground = c.createLinearGradient(0, hy, 0, h);
    ground.addColorStop(0, "#efc49a");
    ground.addColorStop(0.08, "#e8b689");
    ground.addColorStop(1, SETTINGS.sand);
    c.fillStyle = ground;
    c.fillRect(0, hy, w, h - hy);
    // A mirage: a pale strip of sky reflected just below the horizon.
    const mir = c.createLinearGradient(0, hy, 0, hy + 22);
    mir.addColorStop(0, "rgba(248,214,176,0.9)");
    mir.addColorStop(1, "rgba(248,214,176,0)");
    c.fillStyle = mir;
    c.fillRect(0, hy, w, 22);
    // Soft dune ridges, lighter on the lit side.
    for (let i = 0; i < 7; i++) {
      const y0 = hy + 30 + i * i * 7 + i * 10;
      c.beginPath();
      for (let x = -20; x <= w + 20; x += 10) {
        const y = y0 + Math.sin(x * (0.004 + i * 0.0007) + i * 1.7) * (6 + i * 3);
        if (x === -20) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.strokeStyle = `rgba(255,236,210,${0.28 - i * 0.02})`;
      c.lineWidth = 1.2 + i * 0.4;
      c.stroke();
      c.strokeStyle = `rgba(150,90,60,${0.1})`;
      c.lineWidth = 1;
      c.translate(0, 3 + i);
      c.stroke();
      c.setTransform(k, 0, 0, k, 0, 0);
    }
    return { off, k, hy };
  },
  draw(ctx: any, w: any, h: any, t: any, st: any) {
    const { off, k, hy } = st;
    const top = Math.max(0, hy - SETTINGS.band * 0.6);
    const bottom = Math.min(h, hy + SETTINGS.band * 0.4);
    ctx.drawImage(off, 0, 0, off.width, top * k, 0, 0, w, top);
    ctx.drawImage(off, 0, bottom * k, off.width, off.height - bottom * k, 0, bottom, w, h - bottom);
    // Hot air: each strip near the horizon slides sideways and stretches a little, strongest at the horizon itself.
    for (let y = top; y < bottom; y += 2) {
      const near = 1 - Math.abs(y - hy) / (SETTINGS.band * 0.6);
      const amp = SETTINGS.shimmer * near * near;
      const dx = amp * (Math.sin(y * 0.33 + t * 3.1) * 0.7 + Math.sin(y * 0.09 - t * 1.6) * 0.5);
      const dy = amp * 0.3 * Math.sin(y * 0.21 + t * 2.3);
      ctx.drawImage(off, 0, (y + dy) * k, off.width, 2 * k, dx - 8, y, w + 16, 2.2);
    }
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

export default function DesertHeatHazeBackground() {
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
    <section ref={rootRef} className="relative h-[660px] w-full overflow-hidden bg-[#f6ead9] text-[#3a2416]">
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 block h-full w-full" />
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-start items-start text-left px-6 py-14 sm:px-10">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c4a26]">Saltpan Overland</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">Four slow days across the salt flats.</h2>
          <p className="mt-5 text-base leading-relaxed text-[#5b3d2a] sm:text-lg">Small-group crossings with camp cooks, star charts and a guide who grew up on the edge of the pan.</p>
          <a href="#" className="mt-8 inline-flex h-12 items-center rounded-full bg-[#3a2416] px-6 text-sm font-semibold text-[#f8efe2] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a2416] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6ead9]">See departure dates</a>
        </div>
      </div>
    </section>
  );
}

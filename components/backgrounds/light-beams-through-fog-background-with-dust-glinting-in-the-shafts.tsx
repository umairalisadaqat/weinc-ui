import { useEffect, useRef } from "react";

// The values worth changing.
const SETTINGS = {
  beams: 6, // shafts of light from the high windows
  light: [255, 236, 196], // colour of the light as [red, green, blue]
  fog: [120, 160, 150], // colour of the fog banks
  tilt: 0.32, // lean of the shafts in radians; 0 falls straight down
  motes: 150, // specks of dust that glint inside the light
};

function beamSprite() {
  // One soft shaft, narrow at the window and wider at the floor, fading as it falls.
  const sw = 96;
  const sh = 256;
  const c = document.createElement("canvas");
  c.width = sw;
  c.height = sh;
  const g = c.getContext("2d");
  const img = g.createImageData(sw, sh);
  const [r, gr, b] = SETTINGS.light;
  for (let y = 0; y < sh; y++) {
    const v = y / sh;
    const width = 0.16 + v * 0.3;
    const fall = Math.pow(1 - v, 1.4) * Math.min(1, v * 12);
    for (let x = 0; x < sw; x++) {
      const u = (x / sw - 0.5) / width;
      const a = Math.exp(-u * u * 3) * fall;
      const o = (y * sw + x) * 4;
      img.data[o] = r;
      img.data[o + 1] = gr;
      img.data[o + 2] = b;
      img.data[o + 3] = a * 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

function fogSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const [r, gr, b] = SETTINGS.fog;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, `rgba(${r},${gr},${b},0.55)`);
  grad.addColorStop(0.5, `rgba(${r},${gr},${b},0.22)`);
  grad.addColorStop(1, `rgba(${r},${gr},${b},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return c;
}

const SCENE: any = {
  start: 6,
  still: 6,
  scale: 0.7,
  init(ctx: any, w: any, h: any) {
    const rand = (a: any, b: any) => a + Math.random() * (b - a);
    const beams: any[] = [];
    for (let i = 0; i < SETTINGS.beams; i++) {
      beams.push({ x: (0.3 + (i / SETTINGS.beams) * 0.85) * w + rand(-30, 30), width: rand(120, 230), strength: rand(0.35, 0.75), phase: rand(0, 6.28), rate: rand(0.15, 0.35) });
    }
    const fogs: any[] = [];
    for (let i = 0; i < 16; i++) fogs.push({ x: rand(-0.2, 1.2) * w, y: rand(0.25, 1.05) * h, s: rand(0.35, 0.8) * Math.max(w, h), v: rand(4, 14), a: rand(0.25, 0.6) });
    const motes: any[] = [];
    for (let i = 0; i < SETTINGS.motes; i++) motes.push({ x: rand(0, w), y: rand(0, h), v: rand(2, 9), p: rand(0, 6.28), s: rand(0.6, 1.6) });
    return { beam: beamSprite(), fog: fogSprite(), beams, fogs, motes, last: 0 };
  },
  draw(ctx: any, w: any, h: any, t: any, st: any, ptr: any, dt: any) {
    ctx.globalCompositeOperation = "source-over";
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0d1b19");
    bg.addColorStop(1, "#081110");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    // Fog banks drift slowly sideways and wrap around.
    for (const f of st.fogs) {
      const x = ((f.x + t * f.v + f.s) % (w + f.s * 2)) - f.s;
      ctx.globalAlpha = f.a;
      ctx.drawImage(st.fog, x - f.s / 2, f.y - f.s * 0.25, f.s, f.s * 0.5);
    }
    // Shafts of light, added on top, breathing as unseen clouds pass the windows.
    ctx.globalCompositeOperation = "lighter";
    const len = h * 1.5;
    for (const b of st.beams) {
      const breathe = 0.65 + 0.35 * Math.sin(t * b.rate + b.phase) * Math.sin(t * b.rate * 0.37 + b.phase * 2);
      ctx.globalAlpha = b.strength * breathe;
      ctx.save();
      ctx.translate(b.x + Math.sin(t * 0.05 + b.phase) * 12, -h * 0.08);
      ctx.rotate(SETTINGS.tilt);
      ctx.drawImage(st.beam, -b.width, 0, b.width * 2, len);
      ctx.restore();
    }
    // Dust: bright only where it floats inside a shaft.
    const [r, g, bl] = SETTINGS.light;
    const sin = Math.sin(SETTINGS.tilt);
    const cos = Math.cos(SETTINGS.tilt);
    for (const m of st.motes) {
      const y = (m.y + t * m.v) % h;
      const x = m.x + Math.sin(t * 0.4 + m.p) * 10;
      let lit = 0;
      for (const b of st.beams) {
        const ox = x - b.x;
        const oy = y + h * 0.08;
        const across = ox * cos - oy * sin;
        const along = ox * sin + oy * cos;
        const half = b.width * (0.16 + (along / len) * 0.3);
        lit = Math.max(lit, Math.exp(-(across * across) / (half * half * 0.5)) * b.strength);
      }
      if (lit < 0.05) continue;
      ctx.globalAlpha = Math.min(1, lit * (0.6 + 0.4 * Math.sin(t * 2 + m.p)));
      ctx.fillStyle = `rgb(${r},${g},${bl})`;
      ctx.fillRect(x, y, m.s, m.s);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
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

export default function LightBeamsThroughFogBackground() {
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
    <section ref={rootRef} className="relative h-[640px] w-full overflow-hidden bg-[#0b1715] text-[#f4efe4]">
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 block h-full w-full" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,17,16,0.85) 0%, rgba(8,17,16,0.55) 40%, rgba(8,17,16,0) 65%)" }} />
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center items-start text-left px-6 py-14 sm:px-10">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f1dfb8]">Saint Brannoc’s, autumn season</p>
          <h2 className="font-serif mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">Evensong in the old nave.</h2>
          <p className="mt-5 text-base leading-relaxed text-[#cbd3cc] sm:text-lg">Choral evenings under the high windows, Thursdays at seven. Doors open half an hour before.</p>
          <a href="#" className="mt-8 inline-flex h-12 items-center rounded-full bg-[#f1dfb8] px-6 text-sm font-semibold text-[#1b1a14] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1dfb8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1715]">Reserve a seat</a>
        </div>
      </div>
    </section>
  );
}

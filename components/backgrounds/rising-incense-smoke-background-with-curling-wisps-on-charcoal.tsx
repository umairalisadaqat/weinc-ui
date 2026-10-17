import { useEffect, useRef } from "react";

// The values worth changing.
const SETTINGS = {
  smoke: [214, 210, 204], // colour of the smoke as [red, green, blue]
  ember: "#ff9a4d", // the glowing tip of the incense stick
  rise: 38, // how fast the smoke climbs, in pixels per second
  curl: 1, // how much the wisps twist; 0.5 is a still room, 1.6 a draughty one
  puffs: 900, // how many puffs make up the smoke; fewer is cheaper and thinner
};

function smokeSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const [r, gr, b] = SETTINGS.smoke;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${r},${gr},${b},1)`);
  grad.addColorStop(0.4, `rgba(${r},${gr},${b},0.45)`);
  grad.addColorStop(1, `rgba(${r},${gr},${b},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

const SCENE: any = {
  start: 0,
  still: 0,
  scale: 0.75,
  init(ctx: any, w: any, h: any) {
    const narrow = w < 700;
    const src = { x: w * (narrow ? 0.72 : 0.68), y: h * (narrow ? 0.9 : 0.82) };
    const st: any = { ps: [], src, sprite: smokeSprite(), t: 0, narrow };
    // Let the incense burn for a while first so the column is already tall on the first frame.
    for (let i = 0; i < 600; i++) SCENE.step(st, 1 / 60, h);
    return st;
  },
  step(st: any, dt: any, h: any) {
    st.t += dt;
    const t = st.t;
    const life = (st.src.y + 40) / SETTINGS.rise;
    const spawn = (SETTINGS.puffs / life) * dt;
    st.carry = (st.carry || 0) + spawn;
    while (st.carry >= 1) {
      st.carry -= 1;
      st.ps.push({ x: st.src.x + (Math.random() - 0.5) * 1.5, y: st.src.y - 4, vx: 0, age: 0, seed: Math.random() * 6.28 });
    }
    const c = SETTINGS.curl;
    for (const p of st.ps) {
      p.age += dt;
      const up = st.src.y - p.y;
      // Near the stick the smoke rises as a thin laminar thread, then breaks into curls higher up.
      const turb = Math.min(1, up / (h * 0.25));
      const sway = Math.sin(t * 0.35 + up * 0.004) * 30 * turb;
      const curlx = (Math.sin(up * 0.021 - t * 1.1 + p.seed * 0.15) * 22 + Math.sin(up * 0.047 + t * 0.7) * 9) * turb * turb * c;
      p.vx += ((sway + curlx) - p.vx) * Math.min(1, dt * 2.2);
      p.x += p.vx * dt + Math.sin(t * 0.9 + p.seed) * 0.08 * turb * c;
      p.x += (Math.random() - 0.5) * turb * 0.9;
      p.y -= SETTINGS.rise * dt * (1 + 0.3 * turb);
    }
    st.ps = st.ps.filter((p: any) => p.y > -60);
  },
  draw(ctx: any, w: any, h: any, t: any, st: any, ptr: any, dt: any) {
    if (dt > 0) SCENE.step(st, dt, h);
    const bg = ctx.createRadialGradient(st.src.x, h * 0.45, 0, st.src.x, h * 0.45, Math.max(w, h) * 0.8);
    bg.addColorStop(0, "#26211d");
    bg.addColorStop(1, "#0f0d0c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const sy = st.src.y;
    for (const p of st.ps) {
      const up = sy - p.y;
      const k = up / sy;
      const size = 3 + up * 0.09;
      const a = Math.min(1, up / 18) * Math.pow(Math.max(0, 1 - k), 1.6) * (0.16 - Math.min(0.1, up * 0.0004));
      if (a <= 0.002) continue;
      ctx.globalAlpha = a;
      ctx.drawImage(st.sprite, p.x - size, p.y - size, size * 2, size * 2);
    }
    ctx.globalAlpha = 1;
    // The incense stick and its ember.
    ctx.strokeStyle = "#5a4636";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(st.src.x, sy);
    ctx.lineTo(st.src.x + 18, h + 4);
    ctx.stroke();
    const glow = ctx.createRadialGradient(st.src.x, sy, 0, st.src.x, sy, 16);
    glow.addColorStop(0, "rgba(255,170,90,0.9)");
    glow.addColorStop(0.25, "rgba(255,120,50,0.35)");
    glow.addColorStop(1, "rgba(255,120,50,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(st.src.x - 16, sy - 16, 32, 32);
    ctx.fillStyle = SETTINGS.ember;
    ctx.beginPath();
    ctx.arc(st.src.x, sy, 1.8, 0, 6.29);
    ctx.fill();
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

export default function IncenseSmokeBackground() {
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
    <section ref={rootRef} className="relative h-[640px] w-full overflow-hidden bg-[#141110] text-[#f3ede6]">
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 block h-full w-full" />
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center items-start text-left px-6 py-14 sm:px-10">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e7b98c]">Juniper Hall Incense Works</p>
          <h2 className="font-serif mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">Cedar and hinoki, rolled by hand.</h2>
          <p className="mt-5 text-base leading-relaxed text-[#cfc6bc] sm:text-lg">Slow-burning sticks made in small batches, with no added perfume and nothing that catches in the throat.</p>
          <a href="#" className="mt-8 inline-flex h-12 items-center rounded-[2px] bg-[#e9dccb] px-6 text-sm font-semibold text-[#1c1612] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9dccb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141110]">Shop the sampler</a>
        </div>
      </div>
    </section>
  );
}

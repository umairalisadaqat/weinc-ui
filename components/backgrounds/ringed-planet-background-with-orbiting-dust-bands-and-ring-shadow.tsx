import { useEffect, useRef } from "react";

// The values worth changing.
const SETTINGS = {
  dust: [236, 220, 194], // ring dust colour as [red, green, blue]
  planet: ["#e3c79c", "#9c7451", "#2a1c14"], // lit side, middle, night side
  grains: 3200, // dust grains in the ring; fewer is cheaper
  tilt: -0.22, // how much the ring leans, in radians
  speed: 1, // how fast the ring turns
};

const SCENE: any = {
  start: 0,
  still: 0,
  init(ctx: any, w: any, h: any) {
    const narrow = w < 700;
    const R = narrow ? w * 0.3 : Math.min(w * 0.15, h * 0.3);
    const cx = narrow ? w * 0.6 : w * 0.72;
    const cy = narrow ? h * 0.8 : h * 0.56;
    // Bands of dust with gaps between them, like real ring systems.
    const bands = [[1.38, 1.55, 0.5], [1.58, 1.86, 1], [1.93, 2.12, 0.75], [2.16, 2.24, 0.35]];
    const grains: any[] = [];
    for (let i = 0; i < SETTINGS.grains; i++) {
      const b = bands[Math.floor(Math.random() * bands.length)];
      const r = b[0] + Math.random() * (b[1] - b[0]);
      grains.push({ r, a: Math.random() * 6.2832, s: Math.random() < 0.08 ? 1.6 : 1, l: b[2] * (0.35 + Math.random() * 0.65) });
    }
    const stars: any[] = [];
    for (let i = 0; i < 160; i++) stars.push({ x: Math.random() * w, y: Math.random() * h, a: 0.15 + Math.random() * 0.6, s: Math.random() < 0.1 ? 1.5 : 1 });
    return { R, cx, cy, bands, grains, stars };
  },
  ring(ctx: any, st: any, t: any, front: any) {
    const { R, cx, cy } = st;
    const flat = 0.24;
    const [dr, dg, db] = SETTINGS.dust;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(SETTINGS.tilt);
    // A faint continuous sheen under the grains gives each band body.
    for (const b of st.bands) {
      ctx.strokeStyle = `rgba(${dr},${dg},${db},${(front ? 0.3 : 0.2) * b[2]})`;
      ctx.lineWidth = (b[1] - b[0]) * R * flat * 1.15;
      ctx.beginPath();
      ctx.ellipse(0, 0, ((b[0] + b[1]) / 2) * R, ((b[0] + b[1]) / 2) * R * flat, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = `rgb(${dr},${dg},${db})`;
    for (const g of st.grains) {
      // Inner dust orbits faster than outer dust.
      const a = g.a + (t * SETTINGS.speed * 0.12) / Math.pow(g.r, 1.5);
      const sa = Math.sin(a);
      if (front ? sa < 0 : sa >= 0) continue;
      const x = Math.cos(a) * g.r * R;
      const y = sa * g.r * R * flat;
      // Dust on the far right is lit by the sun; dust in the planet's shadow goes dark.
      const shadow = !front && Math.abs(x) < R * 1.02 ? 0.25 : 1;
      ctx.globalAlpha = Math.min(1, g.l * shadow * (0.7 + 0.5 * Math.cos(a - 0.6)));
      ctx.fillRect(x, y, g.s, g.s);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  },
  draw(ctx: any, w: any, h: any, t: any, st: any) {
    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, w, h);
    for (const s of st.stars) {
      ctx.globalAlpha = s.a;
      ctx.fillStyle = "#e8ecf5";
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;
    SCENE.ring(ctx, st, t, false);
    const { R, cx, cy } = st;
    // The planet: lit from the upper left, with soft cloud belts and a dark limb.
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 6.2832);
    ctx.clip();
    const body = ctx.createRadialGradient(cx - R * 0.45, cy - R * 0.5, R * 0.1, cx, cy, R * 1.15);
    body.addColorStop(0, SETTINGS.planet[0]);
    body.addColorStop(0.55, SETTINGS.planet[1]);
    body.addColorStop(1, SETTINGS.planet[2]);
    ctx.fillStyle = body;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.translate(cx, cy);
    ctx.rotate(SETTINGS.tilt);
    for (let i = -9; i <= 9; i++) {
      const y = (i / 9) * R + Math.sin(i * 1.7 + t * 0.02) * 3;
      ctx.fillStyle = i % 2 ? "rgba(60,36,20,0.1)" : "rgba(255,236,200,0.06)";
      ctx.fillRect(-R * 1.2, y, R * 2.4, R * (0.05 + 0.04 * Math.abs(Math.sin(i * 2.3))));
    }
    ctx.rotate(-SETTINGS.tilt);
    // Night side: the sun is up and to the left, so the lower right falls into shadow.
    const night = ctx.createRadialGradient(-R * 0.55, -R * 0.6, R * 0.6, -R * 0.35, -R * 0.4, R * 2.1);
    night.addColorStop(0, "rgba(5,7,13,0)");
    night.addColorStop(0.55, "rgba(5,7,13,0.55)");
    night.addColorStop(1, "rgba(5,7,13,0.97)");
    ctx.fillStyle = night;
    ctx.fillRect(-R, -R, R * 2, R * 2);
    ctx.restore();
    // A thin bright crescent on the lit edge.
    ctx.strokeStyle = "rgba(255,240,215,0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, R - 0.75, Math.PI * 0.95, Math.PI * 1.6);
    ctx.stroke();
    SCENE.ring(ctx, st, t, true);
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

export default function RingedPlanetBackground() {
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
    <section ref={rootRef} className="relative h-[660px] w-full overflow-hidden bg-[#05070d] text-[#f1f2f6]">
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 block h-full w-full" />
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-start items-start text-left px-6 py-14 sm:px-10">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ead9bc]">Perihelion Observatory</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">Public nights under a dark sky.</h2>
          <p className="mt-5 text-base leading-relaxed text-[#c4c9d6] sm:text-lg">Look through the big telescope on the ridge every clear Friday, with an astronomer at the eyepiece.</p>
          <a href="#" className="mt-8 inline-flex h-12 items-center rounded-[6px] bg-[#ead9bc] px-6 text-sm font-semibold text-[#14100a] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ead9bc] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070d]">Book a viewing night</a>
        </div>
      </div>
    </section>
  );
}

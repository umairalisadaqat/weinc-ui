import { useEffect, useRef } from "react";

// The values worth changing.
const SETTINGS = {
  night: ["#0a0f1c", "#141b2d"], // the dark street behind the glass, top to bottom
  lights: ["255,176,92", "255,214,150", "120,200,210", "232,96,80", "190,170,255"], // blurred street lights as "red,green,blue"
  runners: 60, // big drops on the pane; most cling, a few run at a time
  beads: 520, // small drops stuck to the glass
  rain: 1, // how often big drops break loose and run
};

function streetSprite(w: any, h: any, k: any) {
  // The view through the glass: out-of-focus lamps, shop signs and car lights on a dark street.
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * k));
  c.height = Math.max(1, Math.round(h * k));
  const g = c.getContext("2d");
  g.scale(k, k);
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, SETTINGS.night[0]);
  bg.addColorStop(1, SETTINGS.night[1]);
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  let s = 7;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < 46; i++) {
    const col = SETTINGS.lights[Math.floor(rnd() * SETTINGS.lights.length)];
    const x = (0.25 + rnd() * 0.8) * w;
    const y = (0.3 + rnd() * 0.55) * h;
    const r = 18 + rnd() * 46;
    const a = 0.1 + rnd() * 0.22;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(${col},${a})`);
    grad.addColorStop(0.75, `rgba(${col},${a * 0.8})`);
    grad.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return c;
}

const SCENE: any = {
  start: 0,
  still: 0,
  scale: 0.85,
  init(ctx: any, w: any, h: any, k: any) {
    const rand = (a: any, b: any) => a + Math.random() * (b - a);
    const blur = streetSprite(w, h, k);
    // Beads: small drops painted once onto their own layer.
    const beads = document.createElement("canvas");
    beads.width = blur.width;
    beads.height = blur.height;
    const b = beads.getContext("2d");
    b.scale(k, k);
    for (let i = 0; i < SETTINGS.beads; i++) {
      const x = rand(0, w);
      const y = rand(0, h);
      const r = rand(0.8, 2.8);
      b.fillStyle = "rgba(0,0,0,0.22)";
      b.beginPath();
      b.arc(x, y - r * 0.2, r, 0, 6.29);
      b.fill();
      b.fillStyle = "rgba(255,226,190,0.22)";
      b.beginPath();
      b.arc(x, y + r * 0.25, r * 0.8, 0, 6.29);
      b.fill();
      b.fillStyle = "rgba(255,240,220,0.45)";
      b.beginPath();
      b.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, 6.29);
      b.fill();
    }
    const runners: any[] = [];
    for (let i = 0; i < SETTINGS.runners; i++) runners.push({ x: rand(0, w), y: rand(0, h), r: rand(3, 9), v: 0, wait: i < 8 ? rand(0, 1.5) : rand(3, 24) });
    return { blur, beads, runners, trail: [], k, rand };
  },
  draw(ctx: any, w: any, h: any, t: any, st: any, ptr: any, dt: any) {
    ctx.drawImage(st.blur, 0, 0, w, h);
    ctx.drawImage(st.beads, 0, 0, w, h);
    // Trails of tiny drops left behind by the runners, slowly evaporating.
    for (const d of st.trail) {
      d.life -= dt * 0.12;
      ctx.fillStyle = `rgba(255,232,200,${0.35 * Math.max(0, d.life)})`;
      ctx.fillRect(d.x, d.y, d.r, d.r);
    }
    st.trail = st.trail.filter((d: any) => d.life > 0);
    const bw = st.blur.width / w;
    for (const d of st.runners) {
      // Drops cling, then break loose and run in bursts, wandering a little sideways.
      if (dt > 0) {
        if (d.wait > 0) d.wait -= dt * SETTINGS.rain;
        else {
          d.v = Math.min(150, d.v + dt * 260 * (0.5 + Math.random()));
          if (Math.random() < dt * 1.2) d.v *= 0.2;
          d.y += d.v * dt * (d.r / 6);
          d.x += (Math.random() - 0.5) * 0.8;
          if (Math.random() < dt * 20) st.trail.push({ x: d.x + (Math.random() - 0.5) * d.r, y: d.y - d.r * 1.5, r: 0.8 + Math.random() * 1.4, life: 1 });
          if (d.y - d.r * 2 > h) {
            // A new drop gathers somewhere else on the pane and clings for a while.
            d.y = st.rand(0, h * 0.7);
            d.x = st.rand(0, w);
            d.r = st.rand(3, 9);
            d.v = 0;
            d.wait = st.rand(2, 14);
          }
        }
      }
      // Each drop is a tiny lens: it gathers a wide patch of the street, upside down and brighter.
      const rx = d.r;
      const ry = d.r * 1.12;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, rx, ry, 0, 0, 6.29);
      ctx.clip();
      const view = d.r * 14;
      ctx.translate(d.x, d.y);
      ctx.scale(-1, -1);
      ctx.drawImage(st.blur, (d.x - view) * bw, (d.y - view * 0.6) * bw, view * 2 * bw, view * 1.2 * bw, -rx, -ry, rx * 2, ry * 2);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.6;
      ctx.drawImage(st.blur, (d.x - view) * bw, (d.y - view * 0.6) * bw, view * 2 * bw, view * 1.2 * bw, -rx, -ry, rx * 2, ry * 2);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
      // Light pools along the lower rim and a dark edge sits along the top, as in a real bead of water.
      const rim = ctx.createLinearGradient(0, d.y - ry, 0, d.y + ry);
      rim.addColorStop(0, "rgba(0,0,0,0.5)");
      rim.addColorStop(0.45, "rgba(0,0,0,0)");
      rim.addColorStop(0.8, "rgba(255,236,210,0.08)");
      rim.addColorStop(1, "rgba(255,236,210,0.45)");
      ctx.strokeStyle = rim;
      ctx.lineWidth = Math.max(0.8, d.r * 0.22);
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, rx * 0.92, ry * 0.92, 0, 0, 6.29);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,248,236,0.85)";
      ctx.beginPath();
      ctx.ellipse(d.x - rx * 0.32, d.y - ry * 0.45, Math.max(0.6, rx * 0.2), Math.max(0.4, ry * 0.12), -0.5, 0, 6.29);
      ctx.fill();
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

export default function RainOnWindowNightBackground() {
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
    <section ref={rootRef} className="relative h-[640px] w-full overflow-hidden bg-[#0a0f1c] text-[#f5f1ea]">
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 block h-full w-full" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,12,22,0.82) 0%, rgba(8,12,22,0.5) 45%, rgba(8,12,22,0) 72%)" }} />
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center items-start text-left px-6 py-14 sm:px-10">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffcf8a]">The Lamplight, Harbour Street</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">Rainy night? Your window seat is waiting.</h2>
          <p className="mt-5 text-base leading-relaxed text-[#cdd2dc] sm:text-lg">Small plates, a long list of bitter aperitifs and a pianist from nine. Walk in, no booking for two.</p>
          <a href="#" className="mt-8 inline-flex h-12 items-center rounded-full bg-[#ffcf8a] px-6 text-sm font-semibold text-[#1a140c] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffcf8a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1c]">See the menu</a>
        </div>
      </div>
    </section>
  );
}

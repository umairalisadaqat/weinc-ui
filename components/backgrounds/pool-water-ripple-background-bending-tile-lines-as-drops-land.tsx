import { useEffect, useRef } from "react";

// The values worth changing.
const SETTINGS = {
  tile: 46, // tile size in pixels
  water: ["#b9e4e2", "#7fc6cc"], // shallow and deep water over the tiles
  grout: "rgba(255, 255, 255, 0.75)", // the lines between tiles
  drops: 1.4, // drops falling each second; 0 leaves only the ones you tap
  bend: 16, // how strongly the ripples bend the tile lines
  calm: 0.986, // how long rings last; closer to 1 rings travel further
};

const SCENE: any = {
  start: 0,
  still: 0,
  init(ctx: any, w: any, h: any) {
    const cell = 8;
    const gw = Math.ceil(w / cell) + 2;
    const gh = Math.ceil(h / cell) + 2;
    const off = document.createElement("canvas");
    off.width = gw;
    off.height = gh;
    const octx = off.getContext("2d");
    const st: any = { cell, gw, gh, a: new Float32Array(gw * gh), b: new Float32Array(gw * gh), off, octx, img: octx.createImageData(gw, gh), clock: 0, taps: 0 };
    // A few drops have already landed when the block first appears.
    for (let i = 0; i < 5; i++) {
      SCENE.drop(st, Math.random() * w, Math.random() * h, 1);
      for (let k = 0; k < 22; k++) SCENE.step(st);
    }
    return st;
  },
  drop(st: any, x: any, y: any, power: any) {
    const cx = Math.round(x / st.cell) + 1;
    const cy = Math.round(y / st.cell) + 1;
    for (let j = -2; j <= 2; j++)
      for (let i = -2; i <= 2; i++) {
        const xi = cx + i;
        const yj = cy + j;
        if (xi < 1 || yj < 1 || xi >= st.gw - 1 || yj >= st.gh - 1) continue;
        const d = Math.sqrt(i * i + j * j);
        st.a[yj * st.gw + xi] -= Math.max(0, 1 - d / 2.6) * 14 * power;
      }
  },
  step(st: any) {
    // The classic two-buffer wave: each cell moves toward the average of its neighbours, then loses a little energy.
    const { gw, gh, a, b } = st;
    for (let y = 1; y < gh - 1; y++) {
      for (let x = 1; x < gw - 1; x++) {
        const i = y * gw + x;
        b[i] = ((a[i - 1] + a[i + 1] + a[i - gw] + a[i + gw]) / 2 - b[i]) * SETTINGS.calm;
      }
    }
    st.a = b;
    st.b = a;
  },
  draw(ctx: any, w: any, h: any, t: any, st: any, ptr: any, dt: any) {
    if (dt > 0) {
      st.clock += dt * SETTINGS.drops;
      while (st.clock > 1) {
        st.clock -= Math.random() * 1.5;
        SCENE.drop(st, Math.random() * w, Math.random() * h, 0.6 + Math.random() * 0.6);
      }
      if (ptr.down !== st.taps) {
        st.taps = ptr.down;
        SCENE.drop(st, ptr.x, ptr.y, 1.4);
      }
      if (ptr.on && Math.random() < 0.25) SCENE.drop(st, ptr.x, ptr.y, 0.25);
      SCENE.step(st);
      SCENE.step(st);
    }
    const { gw, gh, cell } = st;
    const hgt = st.a;
    const water = ctx.createLinearGradient(0, 0, w, h);
    water.addColorStop(0, SETTINGS.water[0]);
    water.addColorStop(1, SETTINGS.water[1]);
    ctx.fillStyle = water;
    ctx.fillRect(0, 0, w, h);
    const slope = (x: any, y: any) => {
      const xi = Math.min(gw - 2, Math.max(1, Math.round(x / cell) + 1));
      const yi = Math.min(gh - 2, Math.max(1, Math.round(y / cell) + 1));
      const i = yi * gw + xi;
      return [hgt[i + 1] - hgt[i - 1], hgt[i + gw] - hgt[i - gw]];
    };
    // Grout lines, each point pushed sideways by the slope of the water above it.
    const k = SETTINGS.bend / 10;
    ctx.strokeStyle = SETTINGS.grout;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const s = SETTINGS.tile;
    for (let x = (w % s) / 2; x <= w; x += s) {
      for (let y = -6; y <= h + 6; y += 6) {
        const g = slope(x, y);
        if (y === -6) ctx.moveTo(x + g[0] * k, y + g[1] * k);
        else ctx.lineTo(x + g[0] * k, y + g[1] * k);
      }
    }
    for (let y = (h % s) / 2; y <= h; y += s) {
      for (let x = -6; x <= w + 6; x += 6) {
        const g = slope(x, y);
        if (x === -6) ctx.moveTo(x + g[0] * k, y + g[1] * k);
        else ctx.lineTo(x + g[0] * k, y + g[1] * k);
      }
    }
    ctx.stroke();
    // Light and shade on each ring: slopes facing the sun brighten, the far side darkens.
    const data = st.img.data;
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const i = y * gw + x;
        const l = x > 0 && y > 0 && x < gw - 1 && y < gh - 1 ? hgt[i - 1] - hgt[i + 1] + hgt[i - gw] - hgt[i + gw] : 0;
        const o = i * 4;
        if (l > 0) {
          data[o] = 255;
          data[o + 1] = 255;
          data[o + 2] = 250;
          data[o + 3] = Math.min(150, l * 90);
        } else {
          data[o] = 20;
          data[o + 1] = 92;
          data[o + 2] = 110;
          data[o + 3] = Math.min(90, -l * 60);
        }
      }
    }
    st.octx.putImageData(st.img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(st.off, -cell, -cell, gw * cell, gh * cell);
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

export default function PoolWaterRippleBackground() {
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
    <section ref={rootRef} className="relative h-[620px] w-full overflow-hidden bg-[#b9e4e2] text-[#0f2f36]">
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 block h-full w-full" />
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center items-start text-left px-6 py-14 sm:px-10">
        <div className="max-w-xl rounded-2xl border p-7 sm:p-10 bg-[#f7fbfa] border-[rgba(15,47,54,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c5c]">Saltwater Lido</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">Heated outdoor pool, open from six.</h2>
          <p className="mt-5 text-base leading-relaxed text-[#2c4b52] sm:text-lg">Lane swimming in the morning, family sessions after school and a sauna by the deep end.</p>
          <a href="#" className="mt-8 inline-flex h-12 items-center rounded-[10px] bg-[#0f4c5c] px-6 text-sm font-semibold text-[#f2fbfa] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f4c5c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#b9e4e2]">Book a lane</a>
        </div>
      </div>
    </section>
  );
}

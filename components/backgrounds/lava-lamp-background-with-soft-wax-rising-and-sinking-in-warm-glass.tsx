import { useEffect, useRef } from "react";

// The values worth changing. Colours are [red, green, blue] from 0 to 255.
const SETTINGS = {
  blobs: 7, // pieces of wax in the lamp
  hot: [255, 168, 92], // the bright middle of the wax
  cool: [214, 72, 44], // the edge of the wax
  glass: [34, 14, 12], // the liquid around it
  speed: 1, // how fast the wax rises and sinks
  cell: 4, // CSS pixels per computed sample; higher is cheaper and softer
};

const SCENE: any = {
  start: 12,
  still: 12,
  fps: 30,
  init(ctx: any, w: any, h: any) {
    const gw = Math.max(8, Math.ceil(w / SETTINGS.cell));
    const gh = Math.max(8, Math.ceil(h / SETTINGS.cell));
    const off = document.createElement("canvas");
    off.width = gw;
    off.height = gh;
    const octx = off.getContext("2d");
    const narrow = w < 700;
    const blobs: any[] = [];
    for (let i = 0; i < SETTINGS.blobs; i++) {
      blobs.push({
        // On wide blocks the wax stays right of the copy; on phones it lives in the lower half.
        x: narrow ? 0.15 + Math.random() * 0.7 : 0.55 + Math.random() * 0.38,
        r: (narrow ? 0.07 : 0.055) + Math.random() * 0.04,
        period: 22 + Math.random() * 18,
        phase: Math.random() * 6.28,
        sway: 0.02 + Math.random() * 0.03,
      });
    }
    return { gw, gh, off, octx, img: octx.createImageData(gw, gh), blobs, narrow };
  },
  draw(ctx: any, w: any, h: any, time: any, st: any) {
    const t = time * SETTINGS.speed;
    const { gw, gh, img, blobs, narrow } = st;
    const aspect = gw / gh;
    const top = narrow ? 0.5 : 0.06;
    // Each blob rises while warm and sinks while cool: a slow, eased up-and-down loop.
    const pos = blobs.map((b: any) => {
      const cyc = Math.sin((t / b.period) * 6.28 + b.phase);
      const y = top + (1 - top) * (0.5 - 0.42 * cyc);
      const x = b.x + Math.sin(t * 0.13 + b.phase) * b.sway;
      return [x * aspect, y, b.r * (1 + 0.12 * Math.sin(t * 0.3 + b.phase)) * (narrow ? 1 : 1)];
    });
    // Pools of wax resting on the bottom and clinging to the top.
    pos.push([(narrow ? 0.5 : 0.74) * aspect, 1.08, narrow ? 0.16 : 0.12]);
    const data = img.data;
    const [hr, hg, hb] = SETTINGS.hot;
    const [cr, cg, cb] = SETTINGS.cool;
    const [gr, gg, gb] = SETTINGS.glass;
    let o = 0;
    for (let j = 0; j < gh; j++) {
      const y = j / gh;
      for (let i = 0; i < gw; i++) {
        const x = (i / gh);
        let f = 0;
        for (let k = 0; k < pos.length; k++) {
          const p = pos[k];
          const dx = x - p[0];
          const dy = y - p[1];
          f += (p[2] * p[2]) / (dx * dx + dy * dy + 0.0004);
        }
        // Glass: dark, with a warm glow that grows near the wax.
        const glow = Math.min(1, f * 0.22);
        let r = gr + 120 * glow * glow;
        let g = gg + 34 * glow * glow;
        let b = gb + 14 * glow * glow;
        const edge = Math.min(1, Math.max(0, (f - 0.96) / 0.08));
        if (edge > 0) {
          const core = Math.min(1, (f - 1) / 2.2);
          const m = core < 0 ? 0 : core;
          const shade = 0.82 + 0.18 * (1 - y);
          const wr = (cr + (hr - cr) * m) * shade;
          const wg = (cg + (hg - cg) * m) * shade;
          const wb = (cb + (hb - cb) * m) * shade;
          r += (wr - r) * edge;
          g += (wg - g) * edge;
          b += (wb - b) * edge;
        }
        data[o] = r;
        data[o + 1] = g;
        data[o + 2] = b;
        data[o + 3] = 255;
        o += 4;
      }
    }
    st.octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(st.off, 0, 0, w, h);
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

export default function LavaLampWaxBackground() {
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
    <section ref={rootRef} className="relative h-[640px] w-full overflow-hidden bg-[#220e0c] text-[#fbeee2]">
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 block h-full w-full" />
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-start items-start text-left px-6 py-14 sm:px-10">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffb27a]">Lowtide Records</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">Late-night listening room and used vinyl.</h2>
          <p className="mt-5 text-base leading-relaxed text-[#e8cfc0] sm:text-lg">Pull a record from the crates, take a booth and let the needle drop. Open until one on weekends.</p>
          <a href="#" className="mt-8 inline-flex h-12 items-center rounded-full bg-[#ffb27a] px-6 text-sm font-semibold text-[#2a100c] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb27a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#220e0c]">See tonight’s sessions</a>
        </div>
      </div>
    </section>
  );
}

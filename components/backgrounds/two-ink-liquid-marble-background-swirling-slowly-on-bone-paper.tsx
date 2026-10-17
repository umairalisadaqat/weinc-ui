import { useEffect, useRef } from "react";

// The values worth changing. Colours are [red, green, blue] from 0 to 255.
const SETTINGS = {
  paper: [239, 232, 219], // the bare sheet between the inks
  inkA: [28, 41, 70], // the deep ink
  inkB: [172, 96, 56], // the warm ink
  speed: 1, // how fast the inks swirl; 0.5 is barely moving
  cell: 4, // CSS pixels per computed sample; higher is cheaper and softer
};

function inkMix(a: any, b: any, k: any) {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

function smooth(e0: any, e1: any, x: any) {
  const k = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return k * k * (3 - 2 * k);
}

const SCENE: any = {
  start: 40,
  still: 40,
  fps: 30,
  init(ctx: any, w: any, h: any) {
    const gw = Math.max(8, Math.ceil(w / SETTINGS.cell));
    const gh = Math.max(8, Math.ceil(h / SETTINGS.cell));
    const off = document.createElement("canvas");
    off.width = gw;
    off.height = gh;
    const octx = off.getContext("2d");
    return { gw, gh, off, octx, img: octx.createImageData(gw, gh) };
  },
  draw(ctx: any, w: any, h: any, time: any, st: any) {
    const t = time * SETTINGS.speed;
    const { gw, gh, img } = st;
    const data = img.data;
    const unit = 2.4 / Math.min(gw, gh);
    let o = 0;
    for (let j = 0; j < gh; j++) {
      const v = j * unit;
      for (let i = 0; i < gw; i++) {
        const u = i * unit;
        // Two rounds of warping fold the bands into slow marble swirls.
        const q1 = Math.sin(u * 1.7 + t * 0.07) + Math.sin(v * 2.3 - t * 0.05);
        const q2 = Math.cos(v * 1.9 + t * 0.06) + Math.sin(u * 2.1 + t * 0.04);
        const wx = u + 0.55 * q1;
        const wy = v + 0.55 * q2;
        // Thin, winding strata of ink, like a cut through marbled paper: the stripe index picks the colour.
        const band = wx * 1.5 + wy * 0.7 + 0.6 * Math.sin(wy * 2.2 + wx * 0.7 + t * 0.04);
        const f = band - Math.floor(band);
        let c = SETTINGS.paper;
        // Each stripe: paper, a dark vein, a band of the deep ink, paper, a hairline, a band of the warm ink.
        const inA = smooth(0.08, 0.12, f) * (1 - smooth(0.3, 0.34, f));
        const inB = smooth(0.56, 0.6, f) * (1 - smooth(0.74, 0.78, f));
        c = inkMix(c, SETTINGS.inkA, inA * (0.75 + 0.25 * Math.sin(band * 1.7)));
        c = inkMix(c, SETTINGS.inkB, inB * (0.7 + 0.3 * Math.cos(band * 1.3)));
        const vein = Math.max(0, 1 - Math.abs(f - 0.05) * 18) + Math.max(0, 1 - Math.abs(f - 0.47) * 20) * 0.6 + Math.max(0, 1 - Math.abs(f - 0.9) * 20) * 0.4;
        const dark = 1 - vein * 0.22;
        data[o] = c[0] * dark;
        data[o + 1] = c[1] * dark;
        data[o + 2] = c[2] * dark;
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

export default function TwoInkLiquidMarbleBackground() {
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
    <section ref={rootRef} className="relative h-[620px] w-full overflow-hidden bg-[#efe8dc] text-[#1c2333]">
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 block h-full w-full" />
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center items-center text-center px-6 py-14 sm:px-10">
        <div className="max-w-xl rounded-2xl border p-7 sm:p-10 bg-[#f5f0e6] border-[rgba(28,41,70,0.18)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a4a28]">Halden and Rowe Bindery</p>
          <h2 className="font-serif mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">Endpapers marbled one sheet at a time.</h2>
          <p className="mt-5 text-base leading-relaxed text-[#3d4352] sm:text-lg">Hand-floated papers in two inks for journals, wedding albums and small-run books, cut to your trim size.</p>
          <a href="#" className="mt-8 inline-flex h-12 items-center rounded-[2px] bg-[#1c2946] px-6 text-sm font-semibold text-[#f4efe5] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c2946] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe8dc]">Order a sample pack</a>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef } from "react";

// The values worth changing.
const SETTINGS = {
  paper: "#f3f1ec", // the page colour; also hides the lines behind each hill
  line: [38, 44, 54], // graphite line colour as [red, green, blue]
  accent: "rgba(184, 84, 48, 0.85)", // the one contour line picked out in rust
  speed: 1.1, // how fast the ground glides toward you
  relief: 1, // height of the hills; 0.5 is rolling farmland, 1.6 is alpine
  rows: 46, // lines from front to back
  cols: 96, // lines from left to right
};

function terrainHeight(x: any, z: any) {
  const a = Math.sin(x * 0.18 + z * 0.07) * 1.1 + Math.sin(z * 0.13 - x * 0.05) * 1.4;
  const b = Math.sin(x * 0.41 + z * 0.29 + 1.7) * 0.45 + Math.sin(x * 0.07 - z * 0.21) * 1.6;
  const ridge = 1 - Math.abs(Math.sin(x * 0.09 + z * 0.045));
  return (a + b + ridge * ridge * 2.4) * SETTINGS.relief;
}

const SCENE: any = {
  start: 0,
  still: 0,
  init() {
    return {};
  },
  draw(ctx: any, w: any, h: any, t: any) {
    ctx.fillStyle = SETTINGS.paper;
    ctx.fillRect(0, 0, w, h);
    const horizon = h * (w < 700 ? 0.56 : 0.5);
    const focal = Math.max(w, 700) * 0.9;
    const camY = 7.5;
    const dz = 1;
    const scroll = t * SETTINGS.speed;
    const shift = scroll % dz;
    const rows = SETTINGS.rows;
    const cols = SETTINGS.cols;
    const span = 90;
    const pts: any[] = [];
    // Project a grid of ground points; row 0 is nearest the viewer.
    for (let r = 0; r < rows; r++) {
      const z = 1.6 + r * dz - shift;
      const row: any[] = [];
      for (let c = 0; c <= cols; c++) {
        const x = (c / cols - 0.5) * span;
        const y = terrainHeight(x, z + scroll);
        row.push([w / 2 + (x * focal) / (z * 3.2), horizon + ((camY - y) * focal) / (z * 4.2), y]);
      }
      pts.push({ z, row });
    }
    const [lr, lg, lb] = SETTINGS.line;
    ctx.lineJoin = "round";
    // Draw from back to front so the fog fades distant lines into the paper.
    for (let r = rows - 1; r >= 0; r--) {
      const { z, row } = pts[r];
      const fade = Math.max(0, Math.min(1, (rows - z) / (rows * 0.75))) * Math.min(1, (z - 1.2) * 1.2);
      // Paper under this row hides whatever lies behind the ridge.
      ctx.fillStyle = SETTINGS.paper;
      ctx.beginPath();
      ctx.moveTo(row[0][0], h + 2);
      for (let c = 0; c <= cols; c++) ctx.lineTo(row[c][0], row[c][1]);
      ctx.lineTo(row[cols][0], h + 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(${lr},${lg},${lb},${0.62 * fade})`;
      ctx.lineWidth = 0.6 + 0.9 * fade;
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        if (c === 0) ctx.moveTo(row[c][0], row[c][1]);
        else ctx.lineTo(row[c][0], row[c][1]);
      }
      ctx.stroke();
      if (r > 0) {
        const near = pts[r - 1].row;
        ctx.strokeStyle = `rgba(${lr},${lg},${lb},${0.34 * fade})`;
        ctx.lineWidth = 0.6 + 0.5 * fade;
        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
          ctx.moveTo(row[c][0], row[c][1]);
          ctx.lineTo(near[c][0], near[c][1]);
        }
        ctx.stroke();
        // One contour height traced in rust where the ground crosses it.
        ctx.strokeStyle = SETTINGS.accent.replace(/[\d.]+\)$/, `${0.85 * fade})`);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        const level = 3.2;
        for (let c = 0; c < cols; c++) {
          const a = row[c];
          const b = row[c + 1];
          const d = near[c];
          const cross = (p: any, q: any) => {
            if ((p[2] - level) * (q[2] - level) >= 0) return null;
            const s = (level - p[2]) / (q[2] - p[2]);
            return [p[0] + (q[0] - p[0]) * s, p[1] + (q[1] - p[1]) * s];
          };
          const hits = [cross(a, b), cross(a, d), cross(b, near[c + 1]), cross(d, near[c + 1])].filter(Boolean) as any;
          if (hits.length >= 2) {
            ctx.moveTo(hits[0][0], hits[0][1]);
            ctx.lineTo(hits[1][0], hits[1][1]);
          }
        }
        ctx.stroke();
      }
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

export default function WireframeTerrainBackground() {
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
    <section ref={rootRef} className="relative h-[640px] w-full overflow-hidden bg-[#f3f1ec] text-[#1f242c]">
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 block h-full w-full" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(243,241,236,0.96) 0%, rgba(243,241,236,0.85) 42%, rgba(243,241,236,0) 62%)" }} />
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-start items-center text-center px-6 py-14 sm:px-10">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a4424]">Ridgeline Survey Co.</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">Ground models you can build on.</h2>
          <p className="mt-5 text-base leading-relaxed text-[#4a515c] sm:text-lg">Measured terrain for architects and landscape designers, walked on foot and flown by drone.</p>
          <a href="#" className="mt-8 inline-flex h-12 items-center rounded-[4px] bg-[#1f242c] px-6 text-sm font-semibold text-[#f3f1ec] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f242c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3f1ec]">Request a survey</a>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";

// What is carved into the clay, and the two lines of the caption underneath.
const LABEL = "Reserve a seat";
const IDLE_NOTE = "Thursday wheel class. Six seats left.";
const HELD_NOTE = "Seat held for you. Five left.";
// Glaze where it runs thin, where it pools, and the bare stoneware under it (red, green, blue).
const THIN = [214, 230, 214];
const DEEP = [58, 122, 106];
const CLAY = [203, 184, 156];
const W = 340, H = 128; // size of the piece in CSS pixels

const hash = (x: number, y: number) => { const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return v - Math.floor(v); };
const noise = (x: number, y: number) => {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
};
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const boxBlur = (src: Float32Array, w: number, h: number, r: number) => {
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length), k = 1 / (2 * r + 1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let i = -r; i <= r; i++) s += src[y * w + clamp(x + i, 0, w - 1)]; tmp[y * w + x] = s * k; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let i = -r; i <= r; i++) s += tmp[clamp(y + i, 0, h - 1) * w + x]; out[y * w + x] = s * k; }
  return out;
};

// Shapes the piece once: a height for every pixel, then slope, glaze colour and gloss worked out from it.
function throwPiece(S: number) {
  const w = Math.round(W * S), h = Math.round(H * S), n = w * h;
  const hgt = new Float32Array(n), edge = new Float32Array(n);
  const R = 46, hw = W / 2, hh = H / 2;

  const tc = document.createElement("canvas"); tc.width = w; tc.height = h;
  const tx = tc.getContext("2d");
  let carve = new Float32Array(n);
  if (tx) {
    tx.font = `italic 600 ${41 * S}px "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif`;
    tx.textAlign = "center"; tx.textBaseline = "middle"; tx.fillStyle = "#000";
    tx.fillText(LABEL, w / 2, h / 2 + 1 * S, w - 84 * S);
    const px = tx.getImageData(0, 0, w, h).data;
    for (let i = 0; i < n; i++) carve[i] = px[i * 4 + 3] / 255;
    carve = boxBlur(boxBlur(carve, w, h, Math.max(1, Math.round(0.45 * S))), w, h, 1);
  }

  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const px = (x + 0.5) / S, py = (y + 0.5) / S, i = y * w + x;
    const qx = Math.abs(px - hw) - (hw - R), qy = Math.abs(py - hh) - (hh - R);
    const d = R - Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - Math.min(Math.max(qx, qy), 0);
    edge[i] = d;
    if (d <= -1) continue;
    const t = clamp(d / 24) * 0.955 + 0.045;
    const ux = (px - hw) / hw, uy = (py - hh) / hh;
    let z = 15 * Math.sqrt(1 - (1 - t) * (1 - t)) + 5 * (1 - ux * ux * 0.6 - uy * uy * 0.6);
    z -= 1.5 * Math.exp(-((d - 15.5) * (d - 15.5)) / 2.2); // the line the potter scored round the rim
    z -= 2.3 * carve[i];
    z += 0.42 * noise(px / 34, py / 34) + 0.05 * noise(px / 9 + 9, py / 9);
    hgt[i] = z;
  }

  const sx = new Float32Array(n), sy = new Float32Array(n);
  let lap = new Float32Array(n);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    sx[i] = -(hgt[i + 1] - hgt[i - 1]) * 0.5 * S; sy[i] = -(hgt[i + w] - hgt[i - w]) * 0.5 * S;
    lap[i] = (hgt[i + 1] + hgt[i - 1] + hgt[i + w] + hgt[i - w] - 4 * hgt[i]) * S * S;
  }
  lap = boxBlur(lap, w, h, Math.max(1, Math.round(0.9 * S)));

  const alb = new Float32Array(n * 3), gloss = new Float32Array(n), mask = new Float32Array(n);
  const cell = 10;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, d = edge[i];
    mask[i] = clamp(d * S + 0.5);
    if (mask[i] === 0) continue;
    const px = (x + 0.5) / S, py = (y + 0.5) / S;
    // Glaze runs off ridges and settles in hollows, so curvature decides how deep the green is.
    const thick = clamp(0.5 + lap[i] * 0.8 + 0.2 * (noise(px / 44 + 3, py / 44) - 0.5) + 0.25 * clamp(1 - d / 9));
    const k = thick * thick * (3 - 2 * thick), bare = clamp((0.17 - thick) / 0.17) * 0.5;
    // Crazing: the fine crackle net, found as the borders between scattered cells.
    const cx = Math.floor(px / cell), cy = Math.floor(py / cell);
    let d1 = 1e9, d2 = 1e9;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const gx = cx + ox, gy = cy + oy;
      const dd = Math.hypot((gx + hash(gx, gy)) * cell - px, (gy + hash(gy + 40, gx)) * cell - py);
      if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd;
    }
    const patch = clamp((noise(px / 58 + 7, py / 58 + 2) - 0.36) * 3.2);
    const craze = clamp(1 - (d2 - d1) / 0.62) * patch * 0.34;
    const foot = clamp((1.5 - d) / 0.9);
    for (let c = 0; c < 3; c++) {
      let v = THIN[c] + (DEEP[c] - THIN[c]) * k;
      v += ([226, 208, 176][c] - v) * bare;
      v += ([96, 86, 62][c] - v) * craze;
      v += (CLAY[c] * (0.9 + 0.2 * noise(px * 1.3, py * 1.3)) - v) * foot;
      alb[i * 3 + c] = v;
    }
    gloss[i] = 1 - foot;
  }
  // Iron specks that burn through the glaze in the kiln.
  let seed = 11;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let s = 0; s < 64; s++) {
    const px = rand() * W, py = rand() * H, r = (0.35 + rand() * rand() * 1.5) * S, a = 0.35 + rand() * 0.5;
    const x0 = Math.round(px * S), y0 = Math.round(py * S), rr = Math.ceil(r * 2.2);
    for (let y = y0 - rr; y <= y0 + rr; y++) for (let x = x0 - rr; x <= x0 + rr; x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const i = y * w + x, f = Math.exp(-((x - x0) * (x - x0) + (y - y0) * (y - y0)) / (r * r)) * a;
      alb[i * 3] += (104 - alb[i * 3]) * f; alb[i * 3 + 1] += (74 - alb[i * 3 + 1]) * f; alb[i * 3 + 2] += (46 - alb[i * 3 + 2]) * f;
    }
  }
  return { w, h, sx, sy, alb, gloss, mask };
}

export default function GlazedCeramicButton() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const far = useRef<HTMLDivElement>(null);
  const near = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [held, setHeld] = useState(false);
  const heldRef = useRef(false);
  const api = useRef<{ tap: () => void; sync: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, st = stage.current, bd = body.current, btn = button.current;
    if (!cv || !st || !bd || !btn) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const S = Math.min(2.6, (window.devicePixelRatio || 1) * 1.5); // drawn half as large again as its box for wide screens
    const P = throwPiece(S);
    cv.width = P.w; cv.height = P.h;
    const img = ctx.createImageData(P.w, P.h), out = img.data, n = P.w * P.h;

    // p is how far the piece is pushed down, tx and ty how far it has rocked, lx and ly where the window sits.
    const s = { p: 0, pv: 0, tx: 0, tv: 0, ty: 0, uv: 0, down: false, ax: 0, ay: 0, lx: 0, ly: 0, lxTo: 0, lyTo: 0, kick: -1e9 };

    const draw = () => {
      const { sx, sy, alb, gloss, mask } = P;
      const Lx = -0.42, Ly = -0.58, Lz = 0.7;
      const wx = -0.26 + s.lx, wy = -0.74 + s.ly, band = -0.055 + s.ly * 0.6 - s.lx * 0.2;
      for (let i = 0, j = 0, k = 0; i < n; i++, j += 4, k += 3) {
        const m = mask[i];
        if (m === 0) { out[j + 3] = 0; continue; }
        const ax = sx[i] + s.tx, ay = sy[i] + s.ty;
        const nz = 1 / Math.sqrt(ax * ax + ay * ay + 1), nx = ax * nz, ny = ay * nz;
        const dif = nx * Lx + ny * Ly + nz * Lz;
        const shade = 0.3 + 0.78 * (dif > 0 ? dif : 0);
        // What the glaze mirrors: a long studio window with glazing bars, a fill lamp and the pale room.
        const rx = 2 * nz * nx, ry = 2 * nz * ny;
        let u = (rx - wx) * 1.45, v = (ry - wy) * 4.2; if (u < 0) u = -u; if (v < 0) v = -v;
        let win = 0;
        if (u < 1 && v < 1) { const eu = (1 - u) * 7, ev = (1 - v) * 7; win = (eu > 1 ? 1 : eu) * (ev > 1 ? 1 : ev); const bar = (u * 3.5) % 1; if (bar < 0.07 || bar > 0.93) win *= 0.35; win *= 1 - u * 0.45; }
        const fx = rx - 0.62, fy = ry - 0.2, inv = 1 - nz, soft = 0.5 - ry * 2.6 - rx * 1.2;
        // The edge of a bright ceiling panel, which falls across the flat of the face.
        let sheen = (band - ry - 0.32 * rx) * 38; sheen = sheen < 0 ? 0 : sheen > 1 ? 1 : sheen; sheen *= sheen * (3 - 2 * sheen);
        let fade = 1 + (ry + 0.3 * rx) * 2.6; fade = fade < 0 ? 0 : fade;
        const spec = gloss[i] * (win * 0.9 + sheen * fade * 0.14 + 0.05 * (soft < 0 ? 0 : soft > 1 ? 1 : soft) + 0.2 * Math.exp(-(fx * fx + fy * fy) * 9) + inv * inv * (0.75 - 0.6 * ry) + 0.03 * (1 - ry));
        const hi = 255 * spec;
        out[j] = alb[k] * shade + hi; out[j + 1] = alb[k + 1] * shade + hi; out[j + 2] = alb[k + 2] * shade * 1.02 + hi * 0.98; out[j + 3] = m * 255;
      }
      ctx.putImageData(img, 0, 0);
      bd.style.transform = `translate3d(0,${(s.p * 5).toFixed(2)}px,0) scale(${(1 - s.p * 0.014).toFixed(4)})`;
      if (far.current) { far.current.style.opacity = (1 - s.p * 0.55).toFixed(3); far.current.style.transform = `translate3d(${(10 - s.p * 6).toFixed(1)}px,${(22 - s.p * 14).toFixed(1)}px,0) scale(${(1 - s.p * 0.03).toFixed(3)})`; }
      if (near.current) near.current.style.opacity = (0.75 + s.p * 0.25).toFixed(3);
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, nextDemo = 1250, demoEnd = 0, demoSide = -1;
    const rest = () => (heldRef.current ? 0.42 : 0);
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      if (now - touched > 4500) {
        // Nobody is here: the window drifts and an invisible finger rocks the piece now and then.
        s.lxTo = 0.16 * Math.sin(t / 1900); s.lyTo = 0.07 * Math.cos(t / 2600);
        if (t > nextDemo) { demoEnd = t + 620; nextDemo = t + 2900; demoSide = -demoSide; s.ax = demoSide * 0.62; s.ay = 0.25; }
      }
      const pressed = s.down || t < demoEnd || now - s.kick < 170;
      const pTo = pressed ? 1 : rest(), txTo = pressed ? -s.ax * 0.06 : 0, tyTo = pressed ? -s.ay * 0.045 : 0;
      // A stiff spring going down, a looser one coming back, so it lands with a knock and rises with a wobble.
      const k = pressed ? 900 : 420, c = pressed ? 46 : 17;
      s.pv += (k * (pTo - s.p) - c * s.pv) * dt; s.p += s.pv * dt;
      s.tv += (380 * (txTo - s.tx) - 15 * s.tv) * dt; s.tx += s.tv * dt;
      s.uv += (380 * (tyTo - s.ty) - 15 * s.uv) * dt; s.ty += s.uv * dt;
      s.lx += (s.lxTo - s.lx) * Math.min(1, dt * 5); s.ly += (s.lyTo - s.ly) * Math.min(1, dt * 5);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const still = () => { s.p = s.down ? 1 : rest(); s.tx = 0; s.ty = 0; s.lx = s.lxTo; s.ly = s.lyTo; draw(); };
    api.current = { tap: () => { touched = performance.now(); s.kick = touched; if (!s.down) { s.ax = 0; s.ay = 0; } if (reduce) still(); else wake(); }, sync: () => { if (reduce) still(); else wake(); } };
    if (reduce) still(); else wake();

    const where = (e: PointerEvent) => { const b = btn.getBoundingClientRect(); return [clamp(((e.clientX - b.left) / b.width) * 2 - 1, -1.6, 1.6), clamp(((e.clientY - b.top) / b.height) * 2 - 1, -1.6, 1.6)]; };
    const onMove = (e: PointerEvent) => {
      touched = performance.now();
      const [x, y] = where(e);
      s.lxTo = x * 0.13; s.lyTo = y * 0.09;
      if (s.down) { s.ax = clamp(x, -1, 1); s.ay = clamp(y, -1, 1); }
      if (reduce) still();
    };
    const onDown = (e: PointerEvent) => { touched = performance.now(); const [x, y] = where(e); s.down = true; s.ax = clamp(x, -1, 1); s.ay = clamp(y, -1, 1); if (reduce) still(); else wake(); };
    const onUp = () => { if (!s.down) return; s.down = false; touched = performance.now(); if (reduce) still(); };
    st.addEventListener("pointermove", onMove);
    btn.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      st.removeEventListener("pointermove", onMove); btn.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp);
      io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const toggle = () => { heldRef.current = !heldRef.current; setHeld(heldRef.current); api.current?.tap(); };

  return (
    <div ref={stage} className="relative flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[#e6e0d6] px-4 py-16 sm:min-h-[800px]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_34%_22%,#f6f2eb_0%,#e6e0d6_55%,#d3ccc0_100%)]" />
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.22] mix-blend-multiply">
        <filter id="glazed-celadon-ceramic-button-grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" /><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.34  0 0 0 0.9 -0.2" /></filter>
        <rect width="100%" height="100%" filter="url(#glazed-celadon-ceramic-button-grain)" />
      </svg>
      <div className="relative h-[128px] w-[340px] sm:my-10 sm:scale-150">
        <div ref={far} aria-hidden="true" className="absolute inset-x-2 inset-y-1 rounded-[46px] bg-[#3d2e1e]/55 blur-[18px]" style={{ transform: "translate3d(10px,22px,0)" }} />
        <div ref={near} aria-hidden="true" className="absolute inset-0 translate-x-[2px] translate-y-[5px] rounded-[46px] bg-[#3a2c1e]/70 blur-[5px]" style={{ opacity: 0.75 }} />
        <div ref={body} className="absolute inset-0 will-change-transform">
          <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        </div>
        <button
          ref={button}
          type="button"
          aria-pressed={held}
          onClick={toggle}
          className="absolute inset-0 cursor-pointer touch-manipulation select-none rounded-[46px] outline-none focus-visible:ring-2 focus-visible:ring-[#2f6b5c] focus-visible:ring-offset-4 focus-visible:ring-offset-[#e6e0d6]"
        >
          <span className="sr-only">{LABEL}</span>
        </button>
      </div>
      <p aria-live="polite" className="relative mt-12 min-h-[20px] text-center font-serif text-[15px] italic text-[#5b5245] sm:mt-20 sm:text-[17px]">
        {held ? HELD_NOTE : IDLE_NOTE}
      </p>
    </div>
  );
}

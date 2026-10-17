import { useEffect, useRef, useState } from "react";

// The tubes in the box. `rgb` is the pigment, `strength` is how hard it tints a mix (white and blue dominate, as they do in oils).
const tubes = [
  { name: "Titanium White", short: "white", rgb: [247, 245, 238], strength: 2.4 },
  { name: "Cadmium Yellow", short: "yellow", rgb: [250, 198, 40], strength: 1 },
  { name: "Scarlet Lake", short: "scarlet", rgb: [212, 36, 34], strength: 1.1 },
  { name: "Ultramarine", short: "ultramarine", rgb: [26, 64, 170], strength: 1 },
  { name: "Burnt Sienna", short: "sienna", rgb: [138, 58, 26], strength: 1 },
];
const START = [1, 2, 0, 1, 0]; // parts already on the tray when the piece loads
const MAX_PARTS = 10; // the tray is full after this many squeezes
const DEMO_ORDER = [2, 1, 4, 3, 0]; // what the self-running demo squeezes until someone touches it
const M = 40; // spare canvas around the scene so soft shadows are never cut off

type Pose = { x: number; y: number; r: number };
const TILT = [0.035, -0.05, 0.02, -0.03, 0.045];
const layoutFor = (wide: boolean) =>
  wide
    ? { W: 810, H: 540, tray: { x: 322, y: 100, w: 424, h: 328 }, pile: { x: 520, y: 258 }, tube: (i: number): Pose => ({ x: 160 + (i % 2) * 10, y: 100 + i * 82, r: -Math.PI / 2 + TILT[i] }), knife: { x: 688, y: 366, r: -0.64 } as Pose }
    : { W: 380, H: 620, tray: { x: 12, y: 196, w: 356, h: 344 }, pile: { x: 176, y: 350 }, tube: (i: number): Pose => ({ x: 46 + i * 72, y: 92 + (i % 2) * 8, r: TILT[i] }), knife: { x: 292, y: 440, r: -0.35 } as Pose };

// Pigments multiply rather than add: yellow and blue make green, not grey.
const mixOf = (parts: number[]) => {
  let W = 0; const s = [0, 0, 0];
  parts.forEach((p, i) => { const w = p * tubes[i].strength; W += w; for (let c = 0; c < 3; c++) s[c] += w * Math.log(Math.max(8, tubes[i].rgb[c]) / 255); });
  return W ? s.map((v) => Math.round(255 * Math.exp(v / W))) : null;
};
const hexOf = (c: number[]) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();

export default function OilPaintTubeColourMixer() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pad = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(true);
  const [parts, setParts] = useState(START);
  const partsRef = useRef(START);
  const [live, setLive] = useState(false);
  const user = useRef(false);
  const api = useRef<{ squeeze: (i: number) => void; clean: () => void } | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWide(el.clientWidth >= 760));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const cv = canvas.current, hit = pad.current;
    if (!cv || !hit) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const L = layoutFor(wide);
    let px = 1;

    // The wet paint lives on a grid: one thickness value per pigment per cell.
    const well = { x: L.tray.x + 15, y: L.tray.y + 15, w: L.tray.w - 30, h: L.tray.h - 30 };
    const G = 1.5, gw = Math.round(well.w * G), gh = Math.round(well.h * G), N = gw * gh, K = tubes.length;
    const P = tubes.map(() => new Float32Array(N));
    const T = new Float32Array(N);
    const LN = tubes.map((t) => t.rgb.map((v) => Math.log(Math.max(8, v) / 255)));
    const STR = tubes.map((t) => t.strength);
    const pc = document.createElement("canvas"); pc.width = gw; pc.height = gh;
    const pctx = pc.getContext("2d");
    if (!pctx) return;
    const img = pctx.createImageData(gw, gh);
    let dx0 = 1e9, dy0 = 1e9, dx1 = -1, dy1 = -1;
    const touch = (x: number, y: number, r: number) => { if (x - r < dx0) dx0 = x - r; if (y - r < dy0) dy0 = y - r; if (x + r > dx1) dx1 = x + r; if (y + r > dy1) dy1 = y + r; };

    // Turn thickness into a lit, glossy surface: slope gives the shading, steep ridges catch a highlight, thick paint shadows the enamel.
    const shade = () => {
      if (dx1 < 0) return;
      const x0 = Math.max(0, Math.floor(dx0) - 7), y0 = Math.max(0, Math.floor(dy0) - 7), x1 = Math.min(gw - 1, Math.ceil(dx1) + 7), y1 = Math.min(gh - 1, Math.ceil(dy1) + 7);
      dx0 = dy0 = 1e9; dx1 = dy1 = -1;
      if (x1 < x0 || y1 < y0) return;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * gw + x; let t = 0; for (let k = 0; k < K; k++) t += P[k][i]; T[i] = t; }
      const d = img.data, S = 2.7;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * gw + x, t = T[i], o = i * 4;
        const far = x >= 5 && y >= 6 ? T[i - 5 - 6 * gw] : 0, near = x >= 2 && y >= 2 ? T[i - 2 - 2 * gw] : 0;
        const occ = Math.min(0.5, Math.max(0, Math.max(far * 0.8, near) - t) * 0.42);
        if (t < 0.004) { d[o] = 24; d[o + 1] = 18; d[o + 2] = 10; d[o + 3] = occ * 255; continue; }
        let W = 0, r = 0, g = 0, b = 0;
        for (let k = 0; k < K; k++) { const a = P[k][i]; if (a > 0.0005) { const w = a * STR[k]; W += w; r += w * LN[k][0]; g += w * LN[k][1]; b += w * LN[k][2]; } }
        if (W <= 0) { d[o + 3] = occ * 255; continue; }
        r = Math.exp(r / W); g = Math.exp(g / W); b = Math.exp(b / W);
        const nx = -((x < gw - 1 ? T[i + 1] : t) - (x > 0 ? T[i - 1] : t)) * S, ny = -((y < gh - 1 ? T[i + gw] : t) - (y > 0 ? T[i - gw] : t)) * S;
        const inv = 1 / Math.sqrt(nx * nx + ny * ny + 1);
        const diff = Math.max(0, (nx * -0.45 + ny * -0.6 + 0.66) * inv);
        let sp = Math.max(0, (nx * -0.247 + ny * -0.33 + 0.912) * inv); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
        sp *= Math.min(1, t * 2.5) * 215;
        const lit = (0.4 + 0.78 * diff) * 255, cov = 1 - Math.exp(-11 * t), A = cov + (1 - cov) * occ, k2 = ((1 - occ * 0.7) * cov) / A;
        d[o] = Math.min(255, (r * lit + sp) * k2); d[o + 1] = Math.min(255, (g * lit + sp) * k2); d[o + 2] = Math.min(255, (b * lit + sp) * k2); d[o + 3] = A * 255;
      }
      pctx.putImageData(img, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
    };

    // One round blob of a single pigment. A row of these is the worm that comes out of the nozzle.
    const stamp = (k: number, lx: number, ly: number, rad: number, amt: number) => {
      const gx = (lx - well.x) * G, gy = (ly - well.y) * G, R = rad * G;
      for (let y = Math.max(0, Math.floor(gy - R)); y <= Math.min(gh - 1, Math.ceil(gy + R)); y++) for (let x = Math.max(0, Math.floor(gx - R)); x <= Math.min(gw - 1, Math.ceil(gx + R)); x++) {
        const d2 = ((x - gx) * (x - gx) + (y - gy) * (y - gy)) / (R * R);
        if (d2 >= 1) continue;
        const v = amt * Math.pow(1 - d2, 0.6), i = y * gw + x;
        if (P[k][i] < v) { const keep = 1 - 0.9 * Math.min(1, (v / amt) * 1.6); for (let j = 0; j < K; j++) if (j !== k) P[j][i] *= keep; P[k][i] = v; }
      }
      touch(gx, gy, R + 1);
    };

    // The knife pushes whatever is under its blade along with it, hardest at the middle and in uneven bands,
    // which is what folds two colours into streaks and, after a few passes, into one.
    const RB = 36 * G, SIDE = Math.ceil(RB) * 2 + 4, tmp = new Float32Array(SIDE * SIDE), fb = new Float32Array(SIDE * SIDE);
    let seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const band = Array.from({ length: 40 }, () => rand());
    const wet = { r: 0, g: 0, b: 0, a: 0 };
    const drag = (ax: number, ay: number, bx: number, by: number, rot: number) => {
      const x0 = (ax - well.x) * G, y0 = (ay - well.y) * G, x1 = (bx - well.x) * G, y1 = (by - well.y) * G;
      const dist = Math.hypot(x1 - x0, y1 - y0);
      if (dist < 0.02) return;
      const steps = Math.max(1, Math.ceil(dist / 5)), mx = (x1 - x0) / steps, my = (y1 - y0) / steps, ux = -Math.sin(rot), uy = Math.cos(rot);
      for (let s = 1; s <= steps; s++) {
        const cx = x0 + mx * s, cy = y0 + my * s;
        const xa = Math.max(2, Math.floor(cx - RB)), xb = Math.min(gw - 3, Math.ceil(cx + RB)), ya = Math.max(2, Math.floor(cy - RB)), yb = Math.min(gh - 3, Math.ceil(cy + RB)), w = xb - xa + 1;
        if (w <= 0 || yb < ya) continue;
        for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
          const ex = x - cx, ey = y - cy, al = ex * ux + ey * uy, ac = ex * uy - ey * ux, q = (al * al) / (RB * RB) + (ac * ac) / (RB * RB * 0.2);
          let f = 0;
          if (q < 1) { f = 1 - q; f = f * f * (3 - 2 * f); const u = (al / RB + 1) * 19, n = Math.floor(u), t = u - n; f *= 0.5 + 0.5 * (band[n] + (band[n + 1] - band[n]) * t); }
          fb[(y - ya) * w + (x - xa)] = f;
        }
        for (let k = 0; k < K; k++) {
          const A = P[k];
          for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
            const j = (y - ya) * w + (x - xa), f = fb[j], i = y * gw + x;
            if (f <= 0) { tmp[j] = A[i]; continue; }
            const sx = x - mx * f, sy = y - my * f, ix = Math.floor(sx), iy = Math.floor(sy), tx2 = sx - ix, ty2 = sy - iy, i0 = iy * gw + ix;
            tmp[j] = (A[i0] * (1 - tx2) + A[i0 + 1] * tx2) * (1 - ty2) + (A[i0 + gw] * (1 - tx2) + A[i0 + gw + 1] * tx2) * ty2;
          }
          for (let y = ya; y <= yb; y++) { const o = y * gw + xa, j = (y - ya) * w; for (let x = 0; x < w; x++) A[o + x] = tmp[j + x]; }
        }
      }
      touch(Math.min(x0, x1), Math.min(y0, y1), RB + 2); touch(Math.max(x0, x1), Math.max(y0, y1), RB + 2);
      // What is under the blade now is what clings to it.
      const ci = Math.round(y1) * gw + Math.round(x1);
      if (ci > 0 && ci < N) {
        let W = 0, r = 0, g = 0, b = 0, t = 0;
        for (let k = 0; k < K; k++) { const v = P[k][ci]; t += v; const wv = v * STR[k]; W += wv; r += wv * LN[k][0]; g += wv * LN[k][1]; b += wv * LN[k][2]; }
        if (t > 0.08 && W > 0) { const m = wet.a < 0.05 ? 1 : 0.12; wet.r += (235 * Math.exp(r / W) - wet.r) * m; wet.g += (235 * Math.exp(g / W) - wet.g) * m; wet.b += (235 * Math.exp(b / W) - wet.b) * m; wet.a = Math.min(0.9, wet.a + 0.06); }
      }
    };

    const depAt = (n: number) => { const a = n * 2.4 + 0.6; return [L.pile.x + Math.cos(a) * 42, L.pile.y + Math.sin(a) * 31]; };
    const stirAt = (n: number, u: number) => { const a = n * 1.7 + u * Math.PI * 2 * 1.9, rad = 56 - 44 * u; return [L.pile.x + Math.cos(a) * rad * 1.2 + 12 * Math.sin(a * 2.3 + n), L.pile.y + Math.sin(a) * rad * 0.86 + 9 * Math.cos(a * 1.7 + n)]; };
    const stirRot = (n: number, u: number) => L.knife.r + 0.26 * Math.sin(u * 15 + n);
    const nozzleOf = (p: Pose) => [p.x - Math.sin(p.r) * 86, p.y + Math.cos(p.r) * 86];
    const wormFor = (i: number, n: number) => {
      const dep = depAt(n), rest = nozzleOf(L.tube(i));
      const len = Math.hypot(rest[0] - dep[0], rest[1] - dep[1]) || 1, dir = [(rest[0] - dep[0]) / len, (rest[1] - dep[1]) / len];
      let r1 = Math.atan2(dir[0], -dir[1]); const r0 = L.tube(i).r;
      while (r1 - r0 > Math.PI) r1 -= Math.PI * 2; while (r1 - r0 < -Math.PI) r1 += Math.PI * 2;
      r1 = r0 + Math.max(-0.5, Math.min(0.5, r1 - r0));
      const at = (v: number) => [dep[0] + dir[0] * 46 * v - dir[1] * Math.sin(v * 7.5) * 6, dep[1] + dir[1] * 46 * v + dir[0] * Math.sin(v * 7.5) * 6];
      return { dir, r1, at };
    };
    const layWorm = (i: number, at: (v: number) => number[], from: number, to: number) => { for (let v = from; v <= to; v += 0.02) { const q = at(v); stamp(i, q[0], q[1], 13.5 - 2.5 * v, 2.2); } };

    let nDep = 0;
    const used = tubes.map(() => 0);
    const rebuild = (want: number[]) => {
      for (const p of P) p.fill(0); T.fill(0); wet.a = 0; img.data.fill(0); pctx.clearRect(0, 0, gw, gh);
      nDep = 0; const left = want.slice(); let any = true;
      while (any) {
        any = false;
        for (let i = 0; i < K; i++) if (left[i] > 0) {
          left[i]--; any = true; const n = nDep++;
          layWorm(i, wormFor(i, n).at, 0, 1);
          let prev = stirAt(n, 0);
          for (let s = 1; s <= 60; s++) { const q = stirAt(n, s / 60); drag(prev[0], prev[1], q[0], q[1], stirRot(n, s / 60)); prev = q; }
        }
      }
      // The paint that was already down has been worked a little longer than the newest bead.
      if (nDep > 1) for (let extra = 0; extra < 4; extra++) { let prev = stirAt(extra + 7, 0.15); for (let s = 1; s <= 50; s++) { const u = 0.15 + (0.85 * s) / 50, q = stirAt(extra + 7, u); drag(prev[0], prev[1], q[0], q[1], stirRot(extra, u)); prev = q; } }
      want.forEach((v, i) => { used[i] = v; });
      dx0 = dy0 = 0; dx1 = gw; dy1 = gh; shade();
    };

    // ---- drawing ----
    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    const bg = document.createElement("canvas");
    const paintTray = () => {
      const c = bg.getContext("2d");
      if (!c) return;
      bg.width = cv.width; bg.height = cv.height;
      c.setTransform(px, 0, 0, px, M * px, M * px);
      const { x, y, w, h } = L.tray;
      c.save(); c.shadowColor = "rgba(0,0,0,0.6)"; c.shadowBlur = 44 * px; c.shadowOffsetX = 12 * px; c.shadowOffsetY = 28 * px; c.beginPath(); rr(c, x, y, w, h, 30); c.fillStyle = "#e7e3d8"; c.fill(); c.restore();
      c.save(); c.shadowColor = "rgba(0,0,0,0.7)"; c.shadowBlur = 5 * px; c.shadowOffsetX = 1 * px; c.shadowOffsetY = 3 * px; c.beginPath(); rr(c, x, y, w, h, 30); c.fillStyle = "#e7e3d8"; c.fill(); c.restore();
      const rim = c.createLinearGradient(x, y, x + w, y + h); rim.addColorStop(0, "#fdfcf9"); rim.addColorStop(0.5, "#efece4"); rim.addColorStop(1, "#d6d2c6");
      c.beginPath(); rr(c, x, y, w, h, 30); c.fillStyle = rim; c.fill();
      c.beginPath(); rr(c, x + 1.6, y + 1.6, w - 3.2, h - 3.2, 28.5); c.lineWidth = 3.2; c.strokeStyle = "#1c2a55"; c.stroke();
      c.beginPath(); rr(c, x + 4.2, y + 4.2, w - 8.4, h - 8.4, 26); c.lineWidth = 1.1; c.strokeStyle = "rgba(255,255,255,0.95)"; c.stroke();
      c.beginPath(); rr(c, x + 3.4, y + 3.4, w - 6.8, h - 6.8, 27); c.lineWidth = 0.6; c.strokeStyle = "rgba(120,140,220,0.5)"; c.stroke();
      // The well: a floor a few millimetres below the rim, shadowed by the wall nearest the lamp.
      c.save(); c.beginPath(); rr(c, well.x, well.y, well.w, well.h, 17); c.clip();
      const floor = c.createLinearGradient(well.x, well.y, well.x + well.w, well.y + well.h); floor.addColorStop(0, "#e9e6dd"); floor.addColorStop(0.45, "#f3f1ea"); floor.addColorStop(1, "#f8f6f1");
      c.fillStyle = floor; c.fillRect(well.x, well.y, well.w, well.h);
      const gloss = c.createLinearGradient(well.x + well.w * 0.25, well.y, well.x + well.w * 0.75, well.y + well.h); gloss.addColorStop(0.3, "rgba(255,255,255,0)"); gloss.addColorStop(0.46, "rgba(255,255,255,0.5)"); gloss.addColorStop(0.5, "rgba(255,255,255,0.1)"); gloss.addColorStop(0.56, "rgba(255,255,255,0.35)"); gloss.addColorStop(0.7, "rgba(255,255,255,0)");
      c.fillStyle = gloss; c.fillRect(well.x, well.y, well.w, well.h);
      c.shadowColor = "rgba(46,34,12,0.55)"; c.shadowBlur = 11 * px; c.shadowOffsetX = 6 * px; c.shadowOffsetY = 7 * px;
      c.beginPath(); c.rect(x - 60, y - 60, w + 120, h + 120); rr(c, well.x, well.y, well.w, well.h, 17); c.fillStyle = "#000"; c.fill("evenodd");
      c.shadowColor = "rgba(255,255,255,0.95)"; c.shadowBlur = 3 * px; c.shadowOffsetX = -2 * px; c.shadowOffsetY = -2.5 * px;
      c.beginPath(); c.rect(x - 60, y - 60, w + 120, h + 120); rr(c, well.x, well.y, well.w, well.h, 17); c.fill("evenodd");
      c.restore();
      c.beginPath(); rr(c, well.x, well.y, well.w, well.h, 17); c.lineWidth = 0.7; c.strokeStyle = "rgba(60,50,30,0.28)"; c.stroke();
      // Two chips in the enamel where the steel shows through.
      const chip = (cx: number, cy: number, s: number, a: number) => {
        c.save(); c.translate(cx, cy); c.rotate(a); c.scale(s, s);
        c.beginPath(); c.moveTo(-5, -1); c.lineTo(-2, -3.4); c.lineTo(2.4, -2.6); c.lineTo(5.2, 0.4); c.lineTo(2.2, 3); c.lineTo(-2.6, 2.4); c.closePath();
        c.fillStyle = "#6b3a1c"; c.fill(); c.scale(0.72, 0.72); c.fillStyle = "#17140f"; c.fill();
        c.restore();
      };
      chip(x + w - 20, y + 6.5, 1, 0.7); chip(x + 6.5, y + h * 0.62, 0.8, 1.5); chip(x + w * 0.36, y + h - 6, 0.6, 0.1);
    };

    const metal = (c: CanvasRenderingContext2D, a: number, b: number, dark = 0) => {
      const g = c.createLinearGradient(a, 0, b, 0);
      const stops: [number, number][] = [[0, 96], [0.07, 150], [0.24, 236], [0.33, 250], [0.44, 214], [0.66, 172], [0.86, 128], [0.95, 96], [1, 70]];
      for (const [p, v] of stops) { const s = Math.max(0, v - dark); g.addColorStop(p, `rgb(${s},${s + 2},${Math.min(255, s + 5)})`); }
      return g;
    };
    const drawTube = (i: number, pose: Pose, lift: number, sq: number) => {
      const c = ctx, t = tubes[i], col = `rgb(${t.rgb[0]},${t.rgb[1]},${t.rgb[2]})`, wear = Math.min(1, used[i] * 0.3 + sq);
      const body = () => { c.beginPath(); c.moveTo(-29, -60); c.lineTo(29, -60); c.bezierCurveTo(29, -34, 25, -24, 25, -4); c.lineTo(25, 58); c.lineTo(-25, 58); c.lineTo(-25, -4); c.bezierCurveTo(-25, -24, -29, -34, -29, -60); c.closePath(); };
      c.save(); c.translate(pose.x, pose.y); c.rotate(pose.r); c.scale(1 - 0.05 * sq, 1);
      c.save(); c.shadowColor = "rgba(0,0,0,0.55)"; c.shadowBlur = (9 + 20 * lift) * px; c.shadowOffsetX = (4 + 9 * lift) * px; c.shadowOffsetY = (8 + 20 * lift) * px; body(); c.fillStyle = "#333"; c.fill(); c.restore();
      // crimped end
      const cr = c.createLinearGradient(0, -69, 0, -59); cr.addColorStop(0, "#f2f3f4"); cr.addColorStop(0.42, "#a4a8ad"); cr.addColorStop(0.5, "#e2e4e6"); cr.addColorStop(1, "#7f8388");
      c.beginPath(); rr(c, -30.5, -69, 61, 10, 1.6); c.fillStyle = cr; c.fill(); c.lineWidth = 0.5; c.strokeStyle = "rgba(0,0,0,0.4)"; c.stroke();
      c.lineWidth = 0.6; c.strokeStyle = "rgba(0,0,0,0.2)"; c.beginPath(); for (let x = -28; x <= 28; x += 2.6) { c.moveTo(x, -67.4); c.lineTo(x, -61.2); } c.stroke();
      // body
      body(); c.fillStyle = metal(c, -29, 29); c.fill();
      const flat = c.createLinearGradient(0, -60, 0, 4); flat.addColorStop(0, "rgba(214,217,220,0.92)"); flat.addColorStop(0.5, "rgba(206,209,213,0.5)"); flat.addColorStop(1, "rgba(206,209,213,0)");
      body(); c.fillStyle = flat; c.fill();
      c.save(); body(); c.clip();
      const fold = (x0: number, y0: number, x1: number, y1: number, a: number) => {
        c.lineCap = "round"; c.lineWidth = 1.5; c.strokeStyle = `rgba(0,0,0,${0.2 * a})`; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
        c.lineWidth = 1.1; c.strokeStyle = `rgba(255,255,255,${0.7 * a})`; c.beginPath(); c.moveTo(x0 + 1.5, y0 + 0.4); c.lineTo(x1 + 1.5, y1 + 0.4); c.stroke();
      };
      fold(-24, -59, -9, -26, 0.9); fold(22, -59, 8, -30, 0.9); fold(-4, -59, 1, -40, 0.6);
      if (wear > 0.02) {
        const dent = c.createRadialGradient(-3, -34, 1, 1, -30, 24); dent.addColorStop(0, `rgba(20,24,30,${0.34 * wear})`); dent.addColorStop(0.7, `rgba(20,24,30,${0.12 * wear})`); dent.addColorStop(1, "rgba(20,24,30,0)");
        c.fillStyle = dent; c.fillRect(-29, -60, 58, 60);
        c.lineWidth = 1.3; c.strokeStyle = `rgba(255,255,255,${0.75 * wear})`; c.beginPath(); c.ellipse(1, -31, 15, 19, 0, 0.1, 1.5); c.stroke();
        fold(-17, -22, 14, -19, wear * 0.8);
      }
      // paper label
      c.fillStyle = col; c.fillRect(-25, -14, 50, 60);
      c.fillStyle = "#1b1a18"; c.fillRect(-25, -14, 50, 2.6); c.fillRect(-25, 43.4, 50, 2.6);
      c.fillStyle = "#f1ecdf"; c.fillRect(-13, -8, 26, 48);
      c.lineWidth = 0.5; c.strokeStyle = "rgba(27,26,24,0.75)"; c.strokeRect(-11.4, -6.4, 22.8, 44.8);
      c.save(); c.translate(0, 16); c.rotate(Math.PI / 2); c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#1b1a18";
      c.font = "700 5.1px Georgia, 'Times New Roman', serif"; c.fillText(t.name.toUpperCase(), 0, -4.6, 41);
      c.fillRect(-13, -0.3, 26, 0.5);
      c.font = "400 3.9px Georgia, 'Times New Roman', serif"; c.fillText("Artists' oil colour  37 ml", 0, 4.6, 41);
      c.restore();
      const round = c.createLinearGradient(-25, 0, 25, 0); round.addColorStop(0, "rgba(0,0,0,0.5)"); round.addColorStop(0.1, "rgba(0,0,0,0.18)"); round.addColorStop(0.27, "rgba(255,255,255,0.3)"); round.addColorStop(0.4, "rgba(255,255,255,0)"); round.addColorStop(0.72, "rgba(0,0,0,0.1)"); round.addColorStop(0.92, "rgba(0,0,0,0.34)"); round.addColorStop(1, "rgba(0,0,0,0.56)");
      c.fillStyle = round; c.fillRect(-25, -14, 50, 60);
      c.restore();
      body(); c.lineWidth = 0.6; c.strokeStyle = "rgba(0,0,0,0.42)"; c.stroke();
      // shoulder, thread and the paint at the mouth
      c.beginPath(); c.moveTo(-25, 58); c.lineTo(25, 58); c.quadraticCurveTo(20, 70, 9, 74); c.lineTo(-9, 74); c.quadraticCurveTo(-20, 70, -25, 58); c.closePath();
      c.fillStyle = metal(c, -25, 25, 14); c.fill(); c.lineWidth = 0.6; c.strokeStyle = "rgba(0,0,0,0.42)"; c.stroke();
      c.lineWidth = 0.7; c.strokeStyle = "rgba(0,0,0,0.3)"; c.beginPath(); c.moveTo(-25, 58.4); c.lineTo(25, 58.4); c.stroke();
      c.strokeStyle = "rgba(255,255,255,0.6)"; c.beginPath(); c.moveTo(-24, 59.6); c.lineTo(24, 59.6); c.stroke();
      c.fillStyle = metal(c, -7.5, 7.5, 6); c.fillRect(-7.5, 73.5, 15, 11.5);
      for (let y = 75.2; y < 84.6; y += 2.3) { c.fillStyle = "rgba(0,0,0,0.34)"; c.fillRect(-7.5, y, 15, 0.9); c.fillStyle = "rgba(255,255,255,0.4)"; c.fillRect(-7.5, y + 0.9, 15, 0.5); }
      c.strokeStyle = "rgba(0,0,0,0.5)"; c.lineWidth = 0.5; c.strokeRect(-7.5, 73.5, 15, 11.5);
      c.beginPath(); c.ellipse(0, 85.6, 5.6, 2.9, 0, 0, Math.PI * 2); c.fillStyle = col; c.fill(); c.lineWidth = 0.5; c.strokeStyle = "rgba(0,0,0,0.35)"; c.stroke();
      c.beginPath(); c.ellipse(-1.6, 84.9, 1.9, 0.8, 0, 0, Math.PI * 2); c.fillStyle = "rgba(255,255,255,0.6)"; c.fill();
      c.restore();
    };

    const drawKnife = (x: number, y: number, r: number, lift: number) => {
      const c = ctx;
      const blade = () => { c.beginPath(); c.moveTo(0, -40); c.bezierCurveTo(5.5, -31, 10, -8, 10, 8); c.bezierCurveTo(10, 20, 4.4, 28, 1.9, 32); c.lineTo(-1.9, 32); c.bezierCurveTo(-4.4, 28, -10, 20, -10, 8); c.bezierCurveTo(-10, -8, -5.5, -31, 0, -40); c.closePath(); };
      const handle = () => { c.beginPath(); c.moveTo(-4.6, 61); c.bezierCurveTo(-8.4, 82, -8.4, 114, -5.4, 130); c.quadraticCurveTo(0, 137, 5.4, 130); c.bezierCurveTo(8.4, 114, 8.4, 82, 4.6, 61); c.closePath(); };
      c.save(); c.translate(x, y); c.rotate(r); c.scale(1.3, 1.3);
      c.save(); c.shadowColor = "rgba(0,0,0,0.5)"; c.shadowBlur = (5 + 12 * lift) * px; c.shadowOffsetX = (3 + 9 * lift) * px; c.shadowOffsetY = (5 + 16 * lift) * px; c.fillStyle = "#444";
      blade(); c.fill(); c.fillRect(-1.9, 30, 3.8, 24); handle(); c.fill(); c.restore();
      const st = c.createLinearGradient(-10, -12, 10, 8); st.addColorStop(0, "#737a82"); st.addColorStop(0.3, "#e9edf0"); st.addColorStop(0.46, "#b4bac1"); st.addColorStop(0.6, "#fafbfc"); st.addColorStop(0.78, "#aab0b7"); st.addColorStop(1, "#6a7179");
      blade(); c.fillStyle = st; c.fill();
      if (wet.a > 0.02) {
        c.save(); blade(); c.clip();
        const a = wet.a, cc = [Math.round(wet.r), Math.round(wet.g), Math.round(wet.b)];
        const sm = c.createRadialGradient(0, 2, 2, 0, 0, 30);
        sm.addColorStop(0, `rgba(${cc[0]},${cc[1]},${cc[2]},${a})`); sm.addColorStop(0.6, `rgba(${cc[0]},${cc[1]},${cc[2]},${a * 0.85})`); sm.addColorStop(1, `rgba(${cc[0]},${cc[1]},${cc[2]},0)`);
        c.fillStyle = sm; c.fillRect(-10, -40, 20, 62);
        c.strokeStyle = `rgba(255,255,255,${0.5 * a})`; c.lineWidth = 1.1; c.lineCap = "round"; c.beginPath(); c.moveTo(-4, -16); c.quadraticCurveTo(-6, 0, -4.5, 12); c.stroke();
        c.restore();
      }
      blade(); c.lineWidth = 0.5; c.strokeStyle = "rgba(20,24,30,0.55)"; c.stroke();
      const rod = c.createLinearGradient(-2, 0, 2, 0); rod.addColorStop(0, "#60666d"); rod.addColorStop(0.4, "#f1f3f5"); rod.addColorStop(1, "#555b62");
      c.fillStyle = rod; c.fillRect(-1.9, 31, 3.8, 23);
      const br = c.createLinearGradient(-5, 0, 5, 0); br.addColorStop(0, "#6e4f17"); br.addColorStop(0.35, "#f3da92"); br.addColorStop(0.6, "#b98b2e"); br.addColorStop(1, "#5c400f");
      c.beginPath(); rr(c, -4.9, 52, 9.8, 10.5, 1.2); c.fillStyle = br; c.fill(); c.lineWidth = 0.5; c.strokeStyle = "rgba(0,0,0,0.5)"; c.stroke();
      c.fillStyle = "rgba(0,0,0,0.25)"; c.fillRect(-4.9, 55, 9.8, 0.7); c.fillRect(-4.9, 59, 9.8, 0.7);
      const wd = c.createLinearGradient(-8, 0, 8, 0); wd.addColorStop(0, "#2b1a0e"); wd.addColorStop(0.28, "#8b5a33"); wd.addColorStop(0.4, "#c08a58"); wd.addColorStop(0.55, "#7c4f2b"); wd.addColorStop(1, "#27170c");
      handle(); c.fillStyle = wd; c.fill(); c.lineWidth = 0.5; c.strokeStyle = "rgba(0,0,0,0.55)"; c.stroke();
      c.save(); handle(); c.clip(); c.strokeStyle = "rgba(30,16,6,0.25)"; c.lineWidth = 0.5;
      for (let g = -6; g <= 6; g += 1.7) { c.beginPath(); c.moveTo(g, 60); c.bezierCurveTo(g * 1.5, 85, g * 1.4, 110, g * 0.8, 134); c.stroke(); }
      c.strokeStyle = "rgba(255,236,206,0.5)"; c.lineWidth = 1; c.beginPath(); c.moveTo(-2.6, 66); c.quadraticCurveTo(-4.4, 96, -2.8, 124); c.stroke();
      c.restore();
      c.restore();
    };

    // ---- state ----
    type Squeeze = { i: number; n: number; phase: number; p: number; at: (v: number) => number[]; dir: number[]; r1: number; laid: number };
    let tube: Squeeze | null = null;
    const queue: number[] = [];
    let kmode: "rest" | "to" | "stir" | "back" | "user" = "rest", kx = L.knife.x, ky = L.knife.y, kr = L.knife.r, klift = 0, kp = 0, kn = 0, kfx = kx, kfy = ky, kfr = kr, stirNext = -1, tx = kx, ty = ky, down = false;
    let fade = 1, fadeTo = 1, afterFade: number[] | null = null;
    let raf = 0, last = 0, t0 = 0, seen = true, nextDemo = 0.9, demoAt = 0, needDraw = true;
    const ease = (p: number) => p * p * (3 - 2 * p);
    const mixPose = (a: Pose, b: Pose, p: number): Pose => ({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, r: a.r + (b.r - a.r) * p });

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(bg, 0, 0);
      ctx.setTransform(px, 0, 0, px, M * px, M * px);
      ctx.save(); ctx.beginPath(); rr(ctx, well.x, well.y, well.w, well.h, 17); ctx.clip();
      ctx.globalAlpha = fade; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.drawImage(pc, well.x, well.y, well.w, well.h); ctx.restore();
      let pose: Pose | null = null, lift = 0, sq = 0;
      if (tube) {
        const rest = L.tube(tube.i), s = tube;
        const hold = (v: number): Pose => { const q = s.at(v), r = s.r1 + Math.sin(v * 9) * 0.035, tipx = q[0] + s.dir[0] * 5, tipy = q[1] + s.dir[1] * 5; return { x: tipx + Math.sin(r) * 86, y: tipy - Math.cos(r) * 86, r }; };
        if (s.phase === 1) { const e = ease(s.p); pose = mixPose(rest, hold(0), e); lift = Math.sin(Math.PI * s.p) * 0.75 + 0.25 * e; }
        else if (s.phase === 2) { pose = hold(ease(s.p)); lift = 0.25; sq = Math.pow(Math.sin(Math.PI * s.p), 0.6); }
        else { const e = ease(s.p); pose = mixPose(hold(1), rest, e); lift = Math.sin(Math.PI * s.p) * 0.75 + 0.25 * (1 - e); }
      }
      for (let i = 0; i < K; i++) if (!tube || tube.i !== i) drawTube(i, L.tube(i), 0, 0);
      drawKnife(kx, ky, kr, klift);
      if (tube && pose) drawTube(tube.i, pose, lift, sq);
    };

    const step = (dt: number) => {
      let busy = false;
      if (!tube && queue.length) { const i = queue.shift() as number, n = nDep++, w = wormFor(i, n); tube = { i, n, phase: 1, p: 0, at: w.at, dir: w.dir, r1: w.r1, laid: 0 }; }
      if (tube) {
        busy = true;
        tube.p += dt / (tube.phase === 2 ? 0.56 : 0.36);
        if (tube.phase === 2) { const v = ease(Math.min(1, tube.p)); layWorm(tube.i, tube.at, tube.laid, v); tube.laid = v; }
        if (tube.p >= 1) { if (tube.phase === 2) { used[tube.i]++; stirNext = tube.n; } tube.p = 0; tube.phase++; if (tube.phase > 3) tube = null; }
      }
      if (kmode === "user") {
        busy = true;
        const ox = kx, oy = ky; kx += (tx - kx) * Math.min(1, dt * 24); ky += (ty - ky) * Math.min(1, dt * 24);
        kr += (L.knife.r + Math.max(-0.4, Math.min(0.4, (kx - ox) * 0.05)) - kr) * Math.min(1, dt * 8);
        klift += ((down ? 0.12 : 0.8) - klift) * Math.min(1, dt * 12);
        if (down) drag(ox, oy, kx, ky, kr);
      } else {
        if (stirNext >= 0 && (kmode === "rest" || kmode === "back")) { kmode = "to"; kn = stirNext; stirNext = -1; kp = 0; kfx = kx; kfy = ky; kfr = kr; }
        if (kmode === "to") {
          busy = true; kp = Math.min(1, kp + dt / 0.3); const e = ease(kp), q = stirAt(kn, 0);
          kx = kfx + (q[0] - kfx) * e; ky = kfy + (q[1] - kfy) * e; kr = kfr + (stirRot(kn, 0) - kfr) * e; klift = Math.max(0.12, Math.sin(Math.PI * kp));
          if (kp >= 1) { kmode = "stir"; kp = 0; }
        } else if (kmode === "stir") {
          busy = true; kp = Math.min(1, kp + dt / 1.5); const q = stirAt(kn, kp), nr = stirRot(kn, kp);
          drag(kx, ky, q[0], q[1], nr); kx = q[0]; ky = q[1]; kr = nr; klift = 0.12;
          if (kp >= 1) { kp = 0; kfx = kx; kfy = ky; kfr = kr; kmode = "back"; }
        } else if (kmode === "back") {
          busy = true; kp = Math.min(1, kp + dt / 0.5); const e = ease(kp);
          kx = kfx + (L.knife.x - kfx) * e; ky = kfy + (L.knife.y - kfy) * e; kr = kfr + (L.knife.r - kfr) * e; klift = Math.sin(Math.PI * kp) * 0.9;
          if (kp >= 1) { kmode = "rest"; klift = 0; }
        }
      }
      if (fade !== fadeTo) {
        busy = true; fade += Math.sign(fadeTo - fade) * Math.min(Math.abs(fadeTo - fade), dt / 0.32);
        if (fade <= 0 && afterFade) { rebuild(afterFade); afterFade = null; fadeTo = 1; }
      }
      shade();
      return busy;
    };

    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      if (!user.current && t > nextDemo && !tube && !queue.length && kmode === "rest" && fade === 1) {
        const cur = partsRef.current, total = cur.reduce((a, b) => a + b, 0);
        if (total >= 8) { partsRef.current = START; setParts(START); afterFade = START; fadeTo = 0; }
        else { const i = DEMO_ORDER[demoAt++ % DEMO_ORDER.length], next = cur.map((v, j) => (j === i ? v + 1 : v)); partsRef.current = next; setParts(next); queue.push(i); }
        nextDemo = t + 4.4;
      }
      const busy = step(dt);
      if (busy || needDraw) { draw(); needDraw = false; }
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    const size = () => {
      const b = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      if (!b.width) return;
      cv.width = Math.round(b.width * dpr); cv.height = Math.round((b.width * dpr * (L.H + M * 2)) / (L.W + M * 2));
      px = cv.width / (L.W + M * 2); paintTray(); needDraw = true;
      if (reduce) draw();
    };
    rebuild(partsRef.current);
    size();
    const ro = new ResizeObserver(size); ro.observe(cv);

    api.current = {
      squeeze: (i) => {
        if (reduce) { rebuild(partsRef.current); draw(); return; }
        if (queue.length < 4) queue.push(i);
        wake();
      },
      clean: () => {
        queue.length = 0; stirNext = -1;
        if (reduce) { rebuild(partsRef.current); draw(); return; }
        afterFade = partsRef.current; fadeTo = 0; wake();
      },
    };
    if (reduce) draw(); else wake();

    const where = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); return [((e.clientX - b.left) / b.width) * (L.W + M * 2) - M, ((e.clientY - b.top) / b.height) * (L.H + M * 2) - M]; };
    const onDown = (e: PointerEvent) => {
      user.current = true; setLive(true);
      const q = where(e); tx = q[0]; ty = q[1]; down = true;
      if (reduce) { kx = tx; ky = ty; draw(); } else { kmode = "user"; stirNext = -1; }
      hit.setPointerCapture(e.pointerId); e.preventDefault(); wake();
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const q = where(e);
      if (reduce) { drag(kx, ky, q[0], q[1], kr); kx = q[0]; ky = q[1]; shade(); draw(); } else { tx = q[0]; ty = q[1]; }
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      if (reduce) { kx = L.knife.x; ky = L.knife.y; draw(); return; }
      kmode = "back"; kp = 0; kfx = kx; kfy = ky; kfr = kr;
    };
    hit.addEventListener("pointerdown", onDown); hit.addEventListener("pointermove", onMove); hit.addEventListener("pointerup", onUp); hit.addEventListener("pointercancel", onUp);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect();
      hit.removeEventListener("pointerdown", onDown); hit.removeEventListener("pointermove", onMove); hit.removeEventListener("pointerup", onUp); hit.removeEventListener("pointercancel", onUp);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [wide]);

  const L = layoutFor(wide);
  const total = parts.reduce((a, b) => a + b, 0);
  const mix = mixOf(parts);
  const full = total >= MAX_PARTS;
  const squeeze = (i: number) => {
    user.current = true; setLive(true);
    if (full) return;
    const next = partsRef.current.map((v, j) => (j === i ? v + 1 : v));
    partsRef.current = next; setParts(next); api.current?.squeeze(i);
  };
  const clean = () => {
    user.current = true; setLive(true);
    const next = tubes.map(() => 0);
    partsRef.current = next; setParts(next); api.current?.clean();
  };
  const recipe = parts.map((p, i) => (p ? `${p} ${tubes[i].short}` : "")).filter(Boolean).join(", ");

  return (
    <div ref={root} className="flex min-h-[680px] w-full flex-col items-center justify-center overflow-hidden bg-[#15120e] bg-[radial-gradient(110%_78%_at_46%_36%,#2c261e_0%,#15120e_66%)] px-4 py-10 sm:min-h-[720px]">
      <div className={`relative w-full ${wide ? "max-w-[920px]" : "max-w-[440px]"}`} style={{ aspectRatio: `${L.W} / ${L.H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute" style={{ left: `${(-M / L.W) * 100}%`, top: `${(-M / L.H) * 100}%`, width: `${((L.W + M * 2) / L.W) * 100}%`, height: `${((L.H + M * 2) / L.H) * 100}%` }} />
        <div
          ref={pad}
          aria-hidden="true"
          className="absolute cursor-crosshair touch-none rounded-2xl"
          style={{ left: `${((L.tray.x + 15) / L.W) * 100}%`, top: `${((L.tray.y + 15) / L.H) * 100}%`, width: `${((L.tray.w - 30) / L.W) * 100}%`, height: `${((L.tray.h - 30) / L.H) * 100}%` }}
        />
        <div role="group" aria-label="Paint tubes">
          {tubes.map((t, i) => {
            const p = L.tube(i), box = wide ? { x: p.x - 70, y: p.y - 31, w: 160, h: 62 } : { x: p.x - 31, y: p.y - 70, w: 62, h: 160 };
            return (
              <button
                key={t.name}
                type="button"
                aria-disabled={full}
                aria-label={`Squeeze ${t.name}. ${parts[i]} ${parts[i] === 1 ? "part" : "parts"} on the tray`}
                onClick={() => squeeze(i)}
                className="absolute cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#15120e]"
                style={{ left: `${(box.x / L.W) * 100}%`, top: `${(box.y / L.H) * 100}%`, width: `${(box.w / L.W) * 100}%`, height: `${(box.h / L.H) * 100}%` }}
              />
            );
          })}
        </div>
      </div>
      <div className="mt-7 flex min-h-[44px] flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">
        <span aria-hidden="true" className="h-5 w-5 rounded-full ring-1 ring-white/25" style={{ backgroundColor: mix ? hexOf(mix) : "#f1eee6" }} />
        <output aria-live={live ? "polite" : "off"} className="text-center">
          <span className="text-stone-100">{mix ? hexOf(mix) : "Clean tray"}</span>
          <span className="mx-2 text-stone-600">/</span>
          {mix ? recipe : "squeeze a tube to start"}
          {full ? <span className="text-amber-300"> / tray is full</span> : null}
        </output>
        <button
          type="button"
          onClick={clean}
          className="h-10 rounded-full border border-stone-600 px-4 font-mono text-[11px] uppercase tracking-[0.16em] text-stone-200 outline-none transition-colors hover:border-stone-300 hover:text-white focus-visible:ring-2 focus-visible:ring-amber-300 motion-reduce:transition-none"
        >
          Scrape clean
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

/** The made-up island and what is engraved on its brass plate. */
const island = { name: "Skerrow", plate: "Relief model no. 12", scale: "1 : 25 000" };

/**
 * Walks that can be lit. `path` is a list of [u, v] points across the board, each from -1 to 1
 * (u left to right, v back to front). A smooth line is drawn through them and bulbs are set along it.
 */
const routes = [
  { id: "summit", name: "Summit path", detail: "Quay to Hollin Top, 6.4 km", flag: "#e2452c", path: [[0.08, 0.4], [0.2, 0.27], [0.05, 0.17], [-0.12, 0.2], [-0.3, 0.1], [-0.32, -0.05], [-0.13, -0.07]] },
  { id: "light", name: "Lighthouse walk", detail: "Quay to Gannet Light, 5.1 km", flag: "#f4f1e8", path: [[0.08, 0.4], [0.2, 0.27], [0.4, 0.3], [0.6, 0.22], [0.72, 0.05]] },
  { id: "shore", name: "West shore", detail: "Quay to Selkie Cove, 9.8 km", flag: "#2f9c95", path: [[0.08, 0.4], [-0.1, 0.38], [-0.35, 0.3], [-0.55, 0.2], [-0.66, 0], [-0.55, -0.3], [-0.3, -0.5]] },
];

// Design pixels.
const LW = 700; // drawing size
const LH = 500;
const BW = 520; // board, left to right
const BD = 400; // board, back to front
const ROT = -0.34; // how far the board is turned on the table, in radians
const CY = 0.6; // camera: how much the ground is squashed
const SZ = 0.8; // camera: how tall one pixel of height looks
const PLINTH = 46;
const STEP = 5.4; // thickness of one plywood sheet
const NL = 9; // number of sheets at the summit
const FRAME = 9;
const GAP = 13.5; // distance between bulbs
const BULB = 2.9;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const cosR = Math.cos(ROT);
const sinR = Math.sin(ROT);
const GD = BW * Math.abs(sinR) + BD * cosR; // depth of the turned board on the ground
const GCY = GD / 2;
const TOP0 = 262 - GCY * CY; // screen y of the back of the ground plane

const hash = (x: number, y: number) => {
  let n = (x * 374761393 + y * 668265263) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  n = n ^ (n >>> 16);
  return ((n >>> 0) % 100000) / 100000;
};
const vnoise = (x: number, y: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const fbm = (x: number, y: number) => {
  let s = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < 4; i++) {
    s += a * vnoise(x * f, y * f);
    a *= 0.5;
    f *= 2.03;
  }
  return s / 0.9375;
};

/** Height of the land at a point on the board. Above zero is land, below is sea bed. */
function elev(u: number, v: number) {
  const wu = u + 0.22 * (fbm(u * 1.9 + 3, v * 1.9) - 0.5);
  const wv = v + 0.22 * (fbm(u * 1.9, v * 1.9 + 7) - 0.5);
  const a = (wu + 0.02) / 0.84;
  const b = wv / 0.72;
  let h = 0.72 * (1 - Math.sqrt(a * a + b * b));
  h += 0.74 * Math.exp(-((wu + 0.26) ** 2 + (wv + 0.1) ** 2) / 0.05); // Hollin Top
  h += 0.46 * Math.exp(-((wu - 0.4) ** 2 + (wv - 0.02) ** 2) / 0.022); // the east hill
  h -= 0.6 * Math.exp(-((wu - 0.1) ** 2 + (wv - 0.56) ** 2) / 0.03); // the harbour bay
  h -= 0.3 * Math.exp(-((wu - 0.1) ** 2 + (wv + 0.62) ** 2) / 0.03);
  h += 0.44 * (fbm(u * 3.3 + 11, v * 3.3 + 5) - 0.5);
  h += 0.5 * Math.exp(-((u + 0.76) ** 2 + (v - 0.6) ** 2) / 0.005); // the skerry
  h -= 3 * (Math.max(0, Math.abs(u) - 0.8) + Math.max(0, Math.abs(v) - 0.8));
  return h;
}
const sheets = (h: number) => (h > 0 ? Math.min(NL, 1 + Math.floor(h / 0.15)) : 0);

/** Board point (in pixels from its centre) and height to a point on the drawing. */
const project = (wx: number, wy: number, z: number) => ({ x: LW / 2 + wx * cosR - wy * sinR, y: TOP0 + (GCY + wx * sinR + wy * cosR) * CY - z * SZ });

/** A smooth line through the route's points, cut into equal steps. */
function along(path: number[][], gap: number) {
  const pts = path.map(([u, v]) => [(u * BW) / 2, (v * BD) / 2]);
  const fine: number[][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < 24; k++) {
      const t = k / 24;
      const t2 = t * t;
      const t3 = t2 * t;
      fine.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (p2[d] - p0[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (3 * p1[d] - p0[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  fine.push(pts[pts.length - 1]);
  const out = [fine[0]];
  let need = gap;
  for (let i = 1; i < fine.length; i++) {
    let seg = Math.hypot(fine[i][0] - fine[i - 1][0], fine[i][1] - fine[i - 1][1]);
    let from = fine[i - 1];
    while (seg >= need) {
      const t = need / seg;
      from = [from[0] + (fine[i][0] - from[0]) * t, from[1] + (fine[i][1] - from[1]) * t];
      out.push(from);
      seg -= need;
      need = gap;
    }
    need -= seg;
  }
  return { fine, stops: out };
}

type Bulb = { x: number; y: number };

/** Builds the whole model once: every pixel of plywood, sea, walnut and shadow. */
function buildModel(S: number) {
  const CW = Math.ceil(LW * S);
  const CH = Math.ceil(LH * S);
  const GH = Math.ceil(GD * S) + 2;
  const cx = (LW / 2) * S;
  const gcy = GCY * S;
  const PL = PLINTH * S;
  const ST = STEP * S;

  // heights are worked out on a half-size grid and smoothed up, which also rounds the cut edges
  const EW = (CW >> 1) + 2;
  const EH = (GH >> 1) + 2;
  const E = new Float32Array(EW * EH);
  for (let j = 0; j < EH; j++)
    for (let i = 0; i < EW; i++) {
      const dx = i * 2 - cx;
      const dy = j * 2 - gcy;
      E[j * EW + i] = elev((dx * cosR + dy * sinR) / ((BW / 2) * S), (-dx * sinR + dy * cosR) / ((BD / 2) * S));
    }
  const H = new Float32Array(CW * GH).fill(-1); // height above the table, -1 where there is no board
  const M = new Uint8Array(CW * GH); // 1 frame, 2 sea, 3 land
  const D = new Float32Array(CW * GH);
  for (let gy = 0; gy < GH; gy++)
    for (let gx = 0; gx < CW; gx++) {
      const dx = gx - cx;
      const dy = gy - gcy;
      const wx = dx * cosR + dy * sinR;
      const wy = -dx * sinR + dy * cosR;
      const ax = Math.abs(wx) / S;
      const ay = Math.abs(wy) / S;
      if (ax > BW / 2 || ay > BD / 2) continue;
      const i = gy * CW + gx;
      if (ax > BW / 2 - FRAME || ay > BD / 2 - FRAME) {
        H[i] = PL + 3 * S;
        M[i] = 1;
        continue;
      }
      const fx = gx / 2;
      const fy = gy / 2;
      const x0 = fx | 0;
      const y0 = fy | 0;
      const tx = fx - x0;
      const ty = fy - y0;
      const k = y0 * EW + x0;
      const e = (E[k] * (1 - tx) + E[k + 1] * tx) * (1 - ty) + (E[k + EW] * (1 - tx) + E[k + EW + 1] * tx) * ty;
      const n = sheets(e);
      D[i] = e;
      M[i] = n ? 3 : 2;
      H[i] = PL + n * ST;
    }

  // the three walks, scored into the wood
  const toGround = (p: number[]) => [cx + (p[0] * cosR - p[1] * sinR) * S, gcy + (p[0] * sinR + p[1] * cosR) * S];
  const laid = routes.map((r) => along(r.path, GAP));
  const score = document.createElement("canvas");
  score.width = CW;
  score.height = GH;
  const sc = score.getContext("2d")!;
  sc.strokeStyle = "#fff";
  sc.lineWidth = 1.5 * S;
  sc.lineJoin = "round";
  for (const l of laid) {
    sc.beginPath();
    l.fine.forEach((p, i) => {
      const g = toGround(p);
      i ? sc.lineTo(g[0], g[1]) : sc.moveTo(g[0], g[1]);
    });
    sc.stroke();
  }
  const scored = sc.getImageData(0, 0, CW, GH).data;

  const img = new ImageData(CW, CH);
  const px = img.data;
  const top0 = TOP0 * S;
  const LX = -0.6; // toward the lamp, on the ground
  const LY = -0.8;
  const at = (gx: number, gy: number) => (gx < 0 || gy < 0 || gx >= CW || gy >= GH ? -1 : H[(gy | 0) * CW + (gx | 0)]);
  const put = (x: number, y: number, r: number, g: number, b: number) => {
    if (y < 0 || y >= CH) return;
    const o = (y * CW + x) * 4;
    px[o] = r;
    px[o + 1] = g;
    px[o + 2] = b;
    px[o + 3] = 255;
  };
  for (let gx = 0; gx < CW; gx++) {
    for (let gy = 0; gy < GH; gy++) {
      const i = gy * CW + gx;
      const h = H[i];
      if (h < 0) continue;
      const m = M[i];
      const yTop = top0 + gy * CY - h * SZ;
      const y0 = Math.floor(yTop);
      const y1 = Math.floor(yTop + CY);
      const dx = gx - cx;
      const dy = gy - gcy;
      const wx = (dx * cosR + dy * sinR) / S;
      const wy = (-dx * sinR + dy * cosR) / S;
      if (y1 > y0) {
        // how much of the lamp is blocked by taller sheets, and whether this is a lit cut edge
        let block = 0;
        for (let k = 1; k <= 8; k++) {
          const d = k * 1.5 * S;
          if (at(gx + LX * d, gy + LY * d) - h > d * 0.5) block++;
        }
        const shade = 1 - 0.56 * Math.min(1, block / 2.6);
        const rim = at(gx + LX * 1.6 * S, gy + LY * 1.6 * S) < h - 1 ? 1 : 0;
        const snug = at(gx - LX * 1.6 * S, gy - LY * 1.6 * S) > h + 1 ? 0.86 : 1;
        let r = 0;
        let g = 0;
        let b = 0;
        if (m === 3) {
          const n = Math.round((h - PL) / ST);
          const t = Math.pow(n / NL, 0.8);
          const grain = 0.92 + 0.13 * vnoise(wx * 0.05 + n * 31, wy * 1.3 + n * 7) + 0.04 * (hash(gx, gy) - 0.5);
          const cut = 1 - 0.5 * (scored[i * 4 + 3] / 255);
          const k = grain * shade * snug * cut * (1 + rim * 0.07);
          r = (190 + 44 * t) * k;
          g = (156 + 58 * t) * k;
          b = (110 + 68 * t) * k;
        } else if (m === 2) {
          const e = D[i];
          const deep = clamp(-e / 0.55, 0, 1);
          const ring = e < -0.04 && (-e * 8) % 1 < 0.09 ? 1.16 : 1;
          const edge = e > -0.03 ? 1.25 : 1;
          const sx = gx / S;
          const sy = yTop / S;
          const gloss = Math.exp(-(((sx * 0.62 + sy - 470) / 46) ** 2)) * 30 + Math.exp(-(((sx * 0.62 + sy - 600) / 16) ** 2)) * 16;
          const k = shade * ring * edge;
          r = (26 - 18 * deep) * k + gloss * shade;
          g = (98 - 62 * deep) * k + gloss * shade;
          b = (108 - 52 * deep) * k + gloss * shade;
        } else {
          const k = (0.82 + 0.3 * vnoise((wx + wy) * 0.6, (wx - wy) * 0.03)) * shade * (1 + rim * 0.3);
          r = 104 * k;
          g = 66 * k;
          b = 40 * k;
        }
        for (let y = y0; y < y1; y++) put(gx, y, r, g, b);
      }
      // the cut face of this column, where the one in front is lower
      const hf = gy + 1 < GH ? Math.max(0, H[i + CW]) : 0;
      if (h > hf) {
        const yEnd = Math.floor(top0 + (gy + 1) * CY - hf * SZ);
        const turn = clamp((at(gx - 2 * S, gy) - at(gx + 2 * S, gy)) / ST, -1, 1);
        const u = wx / (BW / 2);
        const v = wy / (BD / 2);
        // which side of the plinth this is, for its share of the lamp
        const side = Math.abs(u) > Math.abs(v);
        const lit = side ? 1.25 : 0.86;
        const run = side ? wy : wx;
        for (let y = y1; y < yEnd; y++) {
          const z = h - (y - yTop - CY) / SZ;
          if (z > PL + 0.5 && m === 3) {
            // plywood edge: three plies to a sheet, browned by the laser
            const ply = (((z - PL) / ST) * 3) % 1;
            const k = (0.78 - 0.22 * turn) * (ply < 0.5 ? 1 : 0.66) * (0.9 + 0.2 * hash(gx, y));
            put(gx, y, 126 * k, 86 * k, 50 * k);
          } else {
            const zl = z / S;
            let k = lit * (0.78 + 0.34 * vnoise(run * 0.55, zl * 0.05 + (side ? 9 : 0))) * (0.62 + 0.38 * clamp(zl / 16, 0, 1));
            if (zl > PLINTH + 1.6) k *= 1.5;
            if (zl > 9 && zl < 11.4) put(gx, y, 214 * lit, 170 * lit, 92 * lit);
            else put(gx, y, 86 * k, 53 * k, 32 * k);
          }
        }
      }
    }
  }

  const model = document.createElement("canvas");
  model.width = CW;
  model.height = CH;
  model.getContext("2d")!.putImageData(img, 0, 0);

  const out = document.createElement("canvas");
  out.width = CW;
  out.height = CH;
  const ctx = out.getContext("2d")!;
  // shadow thrown onto the table
  const foot = [project(-BW / 2, -BD / 2, 0), project(BW / 2, -BD / 2, 0), project(BW / 2, BD / 2, 0), project(-BW / 2, BD / 2, 0)];
  for (const [blur, ox, oy, a] of [[34, 30, 20, 0.75], [9, 8, 5, 0.8]] as const) {
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${a})`;
    ctx.shadowBlur = blur * S;
    ctx.shadowOffsetX = (ox + 3000) * S;
    ctx.shadowOffsetY = oy * S;
    ctx.beginPath();
    foot.forEach((p, i) => (i ? ctx.lineTo((p.x - 3000) * S, p.y * S) : ctx.moveTo((p.x - 3000) * S, p.y * S)));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.drawImage(model, 0, 0);

  // lettering cut into the sea, lying flat on it
  const flat = project(0, 0, PLINTH);
  ctx.save();
  ctx.setTransform(cosR * S, sinR * CY * S, -sinR * S, cosR * CY * S, flat.x * S, flat.y * S);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const cutText = (t: string, x: number, y: number, size: number, gap: number, a: number, italic = false) => {
    ctx.font = `${italic ? "italic " : "600 "}${size}px Georgia, "Times New Roman", serif`;
    (ctx as unknown as { letterSpacing: string }).letterSpacing = `${gap}px`;
    ctx.fillStyle = `rgba(0,10,16,${a * 0.9})`;
    ctx.fillText(t, x + 0.5, y + 0.9);
    ctx.fillStyle = `rgba(206,236,234,${a})`;
    ctx.fillText(t, x, y);
  };
  cutText(island.name.toUpperCase(), -128, 164, 19, 9, 0.62);
  cutText("Marl Deep", 176, 150, 10, 1.5, 0.5, true);
  cutText("Gannet Sound", 150, -158, 10, 1.5, 0.42, true);
  cutText("The Quay", 62, 128, 7.5, 0.6, 0.6, true);
  ctx.restore();

  // brass plate on the front of the plinth
  const plate = project(-98, BD / 2, 40);
  ctx.save();
  ctx.setTransform(cosR * S, sinR * CY * S, 0, SZ * S, plate.x * S, plate.y * S);
  ctx.scale(1.32, 1.32);
  const brass = ctx.createLinearGradient(0, 0, 0, 20);
  brass.addColorStop(0, "#f1d79a");
  brass.addColorStop(0.35, "#c9a05a");
  brass.addColorStop(0.7, "#a37a3a");
  brass.addColorStop(1, "#d6b06a");
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0.6, 1.2, 148, 20);
  ctx.fillStyle = brass;
  ctx.fillRect(0, 0, 148, 20);
  ctx.fillStyle = "rgba(255,246,214,0.75)";
  ctx.fillRect(0, 0, 148, 0.8);
  for (const sxp of [5.5, 142.5]) {
    ctx.beginPath();
    ctx.arc(sxp, 10, 1.7, 0, Math.PI * 2);
    ctx.fillStyle = "#7a5a2a";
    ctx.fill();
    ctx.fillStyle = "#f6e2ae";
    ctx.fillRect(sxp - 1.3, 9.7, 2.6, 0.6);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#3a2a10";
  ctx.font = '700 7.4px Georgia, "Times New Roman", serif';
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "2.4px";
  ctx.fillText(island.name.toUpperCase(), 74, 7);
  ctx.font = '5px Georgia, "Times New Roman", serif';
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "1px";
  ctx.fillText(`${island.plate.toUpperCase()}  /  ${island.scale}`, 74, 14.6);
  ctx.restore();

  // where each bulb sits, and a pennant at the far end of every walk
  const heightAt = (p: number[]) => PLINTH + Math.max(1, sheets(elev(p[0] / (BW / 2), p[1] / (BD / 2)))) * STEP;
  const bulbs: Bulb[][] = laid.map((l) => l.stops.map((p) => project(p[0], p[1], heightAt(p))));
  ctx.setTransform(S, 0, 0, S, 0, 0);
  laid.forEach((l, k) => {
    const end = l.fine[l.fine.length - 1];
    const p = project(end[0], end[1], heightAt(end));
    ctx.strokeStyle = "rgba(20,10,0,0.45)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 13, p.y + 6);
    ctx.stroke();
    const pole = ctx.createLinearGradient(p.x - 1, 0, p.x + 1, 0);
    pole.addColorStop(0, "#f4f0e6");
    pole.addColorStop(1, "#8d8a84");
    ctx.fillStyle = pole;
    ctx.fillRect(p.x - 0.7, p.y - 21, 1.4, 21);
    ctx.fillStyle = routes[k].flag;
    ctx.beginPath();
    ctx.moveTo(p.x + 0.7, p.y - 21);
    ctx.lineTo(p.x + 11, p.y - 17.6);
    ctx.lineTo(p.x + 0.7, p.y - 14.4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.moveTo(p.x + 0.7, p.y - 17.6);
    ctx.lineTo(p.x + 11, p.y - 17.6);
    ctx.lineTo(p.x + 0.7, p.y - 14.4);
    ctx.closePath();
    ctx.fill();
  });
  return { canvas: out, bulbs };
}

/** Small pictures of one bulb, dark and lit, and of the light it throws. */
function buildSprites(S: number) {
  const make = (size: number, draw: (c: CanvasRenderingContext2D) => void) => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = Math.ceil(size * S);
    const c = cv.getContext("2d")!;
    c.scale(S, S);
    c.translate(size / 2, size / 2);
    draw(c);
    return cv;
  };
  const dome = (c: CanvasRenderingContext2D, stops: [number, string][]) => {
    c.fillStyle = "rgba(40,20,0,0.4)";
    c.beginPath();
    c.ellipse(1.6, 1.4, BULB + 1.8, (BULB + 1.8) * CY, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#6f5222";
    c.beginPath();
    c.ellipse(0, 0.9, BULB + 1.4, (BULB + 1.4) * CY, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#d9b469";
    c.beginPath();
    c.ellipse(-0.3, 0.5, BULB + 1.1, (BULB + 1.1) * CY, 0, 0, Math.PI * 2);
    c.fill();
    const g = c.createRadialGradient(-1, -2.8, 0.2, 0, -1.4, BULB + 0.4);
    stops.forEach(([o, col]) => g.addColorStop(o, col));
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, -1.4, BULB, 0, Math.PI * 2);
    c.fill();
  };
  const dark = make(20, (c) => {
    dome(c, [[0, "#e6d2ab"], [0.35, "#b08c5c"], [0.8, "#62431f"], [1, "#8a6638"]]);
    c.fillStyle = "rgba(255,244,220,0.85)";
    c.beginPath();
    c.ellipse(-1.2, -2.9, 0.9, 0.55, -0.6, 0, Math.PI * 2);
    c.fill();
  });
  const lit = make(20, (c) => dome(c, [[0, "#ffffff"], [0.55, "#fffbe8"], [0.85, "#ffd98a"], [1, "#ffa838"]]));
  const glow = make(96, (c) => {
    c.save();
    c.scale(1, CY);
    const spill = c.createRadialGradient(0, 2, 0, 0, 2, 46);
    spill.addColorStop(0, "rgba(255,190,100,0.42)");
    spill.addColorStop(0.3, "rgba(255,160,70,0.16)");
    spill.addColorStop(1, "rgba(255,130,40,0)");
    c.fillStyle = spill;
    c.fillRect(-48, -48, 96, 96);
    c.restore();
    const halo = c.createRadialGradient(0, -1.4, 0, 0, -1.4, 15);
    halo.addColorStop(0, "rgba(255,244,214,1)");
    halo.addColorStop(0.3, "rgba(255,206,120,0.5)");
    halo.addColorStop(1, "rgba(255,170,80,0)");
    c.fillStyle = halo;
    c.fillRect(-16, -18, 32, 32);
  });
  return { dark, lit, glow };
}

export default function ReliefIslandRouteModel() {
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const lampRef = useRef<HTMLCanvasElement>(null);
  const [route, setRoute] = useState(0);
  const live = useRef({ route: 0, since: 0, touched: false, paused: false, replay: 0 });
  const tiltX = useSpring(useMotionValue(0), { stiffness: 70, damping: 15 });
  const tiltY = useSpring(useMotionValue(0), { stiffness: 70, damping: 15 });

  const pick = (i: number, byHand: boolean) => {
    if (byHand) live.current.touched = true;
    live.current.route = i;
    live.current.replay++;
    setRoute(i);
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const base = baseRef.current;
    const lamp = lampRef.current;
    if (!wrap || !base || !lamp) return;
    const S = clamp((wrap.clientWidth / LW) * Math.min(2, window.devicePixelRatio || 1), 1, 2);
    let raf = 0;
    let seen = true;
    let stopped = false;
    let bulbs: Bulb[][] = [];
    let level: number[][] = [];
    const sprites = buildSprites(S);
    const lc = lamp.getContext("2d")!;
    const state = live.current;
    let replay = -1;
    let last = 0;

    const draw = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      if (replay !== state.replay) {
        replay = state.replay;
        state.since = now;
      }
      const t = (now - state.since) / 1000;
      lc.setTransform(1, 0, 0, 1, 0, 0);
      lc.clearRect(0, 0, lamp.width, lamp.height);
      lc.setTransform(S, 0, 0, S, 0, 0);
      bulbs.forEach((line, r) => {
        const on = r === state.route;
        const n = line.length;
        // the walk lights from the quay outward, then a brighter pulse keeps travelling along it
        const reach = reduce ? n : (t - 0.12) * 17;
        const pulse = ((t * 0.42) % 1.25) * n;
        line.forEach((b, i) => {
          let want = 0;
          if (on && i < reach) want = reduce ? 0.95 : 0.74 + 0.26 * Math.exp(-(((i - pulse) / 1.6) ** 2)) + 0.03 * Math.sin(now / 53 + i * 2.1);
          const cur = level[r][i];
          // filaments warm quickly and cool slowly
          level[r][i] = reduce ? want : cur + (want - cur) * (1 - Math.exp(-dt / (want > cur ? 0.07 : 0.3)));
        });
      });
      // light first, so each glass dome sits on top of the glow around it
      bulbs.forEach((line, r) =>
        line.forEach((b, i) => {
          const v = level[r][i];
          if (v < 0.01) return;
          lc.globalAlpha = Math.min(1, v);
          lc.drawImage(sprites.glow, b.x - 48, b.y - 48, 96, 96);
        }),
      );
      bulbs.forEach((line, r) =>
        line.forEach((b, i) => {
          const v = level[r][i];
          lc.globalAlpha = 1;
          lc.drawImage(sprites.dark, b.x - 10, b.y - 10, 20, 20);
          if (v > 0.01) {
            lc.globalAlpha = Math.min(1, v * 1.5);
            lc.drawImage(sprites.lit, b.x - 10, b.y - 10, 20, 20);
          }
        }),
      );
      lc.globalAlpha = 1;
      if (!reduce && seen && !document.hidden && !stopped) raf = requestAnimationFrame(draw);
    };
    const kick = () => {
      if (!raf && !stopped) raf = requestAnimationFrame(draw);
    };

    // build after the first paint so the stage shows straight away
    const start = window.setTimeout(() => {
      const built = buildModel(S);
      for (const cv of [base, lamp]) {
        cv.width = built.canvas.width;
        cv.height = built.canvas.height;
      }
      base.getContext("2d")!.drawImage(built.canvas, 0, 0);
      bulbs = built.bulbs;
      level = bulbs.map((l) => l.map(() => 0));
      state.replay++;
      kick();
    }, 30);

    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      if (seen) kick();
    });
    io.observe(wrap);
    const onVis = () => !document.hidden && kick();
    document.addEventListener("visibilitychange", onVis);
    // with motion reduced there is no loop, so a change of route asks for one redraw
    const poll = reduce ? window.setInterval(() => replay !== state.replay && kick(), 120) : 0;
    const tour = window.setInterval(() => {
      if (reduce || state.touched || state.paused || document.hidden || !seen) return;
      state.route = (state.route + 1) % routes.length;
      state.replay++;
      setRoute(state.route);
    }, 6200);
    return () => {
      stopped = true;
      window.clearTimeout(start);
      window.clearInterval(tour);
      if (poll) window.clearInterval(poll);
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduce]);

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    tiltY.set((((e.clientX - r.left) / r.width) * 2 - 1) * 3.2);
    tiltX.set((((e.clientY - r.top) / r.height) * 2 - 1) * -2.6);
  };

  return (
    <section className="relative overflow-hidden bg-[#0b0a09]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(58% 60% at 46% 44%, #2c2620 0%, #17130f 46%, #0b0a09 100%)" }} />
      <div
        onPointerMove={onMove}
        onPointerEnter={() => (live.current.paused = true)}
        onPointerLeave={() => {
          live.current.paused = false;
          tiltX.set(0);
          tiltY.set(0);
        }}
        className="relative mx-auto w-full max-w-[940px] px-2 pt-6 sm:pt-8"
        style={{ perspective: "1600px" }}
      >
        <motion.div ref={wrapRef} className="relative w-full" style={{ aspectRatio: `${LW} / ${LH}`, rotateX: tiltX, rotateY: tiltY }}>
          <canvas ref={baseRef} role="img" aria-label={`Relief model of the island of ${island.name}, built from stacked plywood sheets on a walnut plinth, with three walking routes marked by rows of small bulbs`} className="absolute inset-0 h-full w-full" />
          <canvas ref={lampRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
        </motion.div>
      </div>

      <div className="relative flex flex-col gap-3 px-5 pb-6 pt-2 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pb-8">
        <p className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-stone-400">
          <span className="text-stone-100">
            {island.name} / {island.plate}
          </span>
          <span className="block" aria-live="polite">
            {routes[route].name}: {routes[route].detail}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {routes.map((r, i) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={route === i}
              onClick={() => pick(i, true)}
              className={`flex h-10 items-center gap-2 rounded-full px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0a09] ${route === i ? "bg-amber-200 text-stone-900" : "bg-stone-800 text-stone-200 hover:bg-stone-700"}`}
            >
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: r.flag }} />
              {r.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here.
const setting = { name: "Quiet hours", on: "On", off: "Off", offNote: "Furled, and getting wet" };
const CANOPY = [240, 178, 30]; // the cloth from outside
const LINING = [156, 104, 22]; // the same cloth from underneath
const RIBS = 8;
const RAIN = 170; // drops in the air at once
const DEMO = true; // furl and reopen by itself until somebody touches it

const W = 720, H = 700, CX = 360, TOP = 132, L = 262, GY = 628; // canvas, shaft, apex, rib length, ground
const SEG = 12, COLS = 6, JOINT = 5, STRUT = L * 0.5, TILT = 0.19, PY = TOP + L * 1.42;
const SHUT = 0.075, TAU = Math.PI * 2, HALF = Math.PI / RIBS;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
type V3 = [number, number, number];
type Quad = { p: number[]; z: number; near: boolean; col: string; line: string; inside: boolean; bead: number; rib: number; hem: boolean; tip: boolean };

// One rib, from the notch at the top to its tip: how far out and how far down each point sits.
const profile = (open: number, cut: number) => {
  const r: number[] = [5], h: number[] = [0];
  const ds = (L * cut) / SEG;
  for (let j = 1; j <= SEG; j++) {
    const s = ((j - 0.5) / SEG) * cut;
    const t = SHUT + (((80 - 52 * s) * Math.PI) / 180 - SHUT) * open;
    r.push(r[j - 1] + Math.sin(t) * ds); h.push(h[j - 1] + Math.cos(t) * ds);
  }
  return { r, h };
};
const scallop = (u: number) => 1 - 0.1 * Math.pow(Math.sin(Math.PI * u), 0.7); // the hem is cut in a curve between the ribs
const FULL = profile(1, 1);

export default function YellowUmbrellaToggle() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const tally = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(true);
  const live = useRef({ on: true, touched: false });
  const api = useRef<{ wake: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The canvas covers the whole stage so the rain has no edge. The umbrella keeps its own 720 by 700 box in the middle.
    let k = 1, ox = 0, VW = W, VH = H;
    const fit = () => {
      const cw = cv.clientWidth || W, ch = cv.clientHeight || H, sc = Math.min(cw / 620, (ch - 44) / H), dpr = Math.min(2, window.devicePixelRatio || 1);
      k = sc * dpr; VW = cw / sc; VH = ch / sc; ox = (VW - W) / 2;
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    };

    const s = { o: 1, v: 0, psi: 0.2, lean: -0.05, wind: -0.35, windTo: -0.35, t: 0, hits: 0, shake: false, shown: -1 };
    const env = new Float32Array(W / 2 + 2);
    const acc = new Float32Array(RIBS);
    const tips: number[][] = [];
    const rnd = Math.random;
    type Drop = { x: number; y: number; gy: number; layer: number };
    const drops: Drop[] = [];
    const seed = (d: Drop, fresh: boolean) => {
      d.x = rnd() * (VW + 360) - 180 - ox; d.y = fresh ? rnd() * VH : -20 - rnd() * 80;
      d.gy = d.layer === 0 ? GY - 14 : d.layer === 1 ? GY - 2 + rnd() * 52 : VH + 30;
    };
    const pour = () => {
      const wide = clamp(VW / W, 1, 2.6);
      for (let i = 0; i < RAIN * 1.9 * wide; i++) { const d = { x: 0, y: 0, gy: 0, layer: i % 19 < 6 ? 0 : i % 19 < 16 ? 1 : 2 }; seed(d, true); drops.push(d); }
    };
    const beads: { x: number; y: number; vx: number; vy: number; life: number; big: boolean }[] = [];
    const rings: { x: number; y: number; age: number }[] = [];
    const flecks: { x: number; y: number; age: number; a: number }[] = [];

    const LT: V3 = [-0.42, -0.64, 0.64];
    const sT = Math.sin(TILT), cT = Math.cos(TILT);
    const HV: V3 = (() => { const x = LT[0], y = LT[1] + sT, z = LT[2] + cT, n = Math.hypot(x, y, z); return [x / n, y / n, z / n]; })();
    const tone = (c: number[], m: number, add: number) => `rgb(${clamp(c[0] * m + add, 0, 255) | 0},${clamp(c[1] * m + add, 0, 255) | 0},${clamp(c[2] * m + add * 0.9, 0, 255) | 0})`;

    // Drops that cling to the cloth, at fixed places so they turn with it.
    const wet = new Float32Array(RIBS * COLS * SEG);
    for (let i = 0; i < 64; i++) wet[2 + ((rnd() * (wet.length - 2)) | 0)] = 0.9 + rnd() * 1.3;
    let quads: Quad[] = [];
    let runY = 0, joints: number[][] = [];
    const leaned = (X: number, Y: number): [number, number] => {
      const dx = X - CX, dy = Y - PY, c = Math.cos(s.lean), n = Math.sin(s.lean);
      return [CX + dx * c - dy * n, PY + dx * n + dy * c];
    };
    const geometry = () => {
      const e = s.o > 1 ? 1 + (s.o - 1) * 0.45 : Math.max(0, s.o);
      const rib = profile(e, 1);
      const P: V3[][][] = []; // P[gore][column][point]: column 0 lies on a rib, the rest are cloth between two ribs
      for (let i = 0; i < RIBS; i++) {
        const cols: V3[][] = [];
        for (let c = 0; c < COLS; c++) {
          const u = c / COLS, a = s.psi + (i * TAU) / RIBS + u * 2 * HALF, ca = Math.cos(a), sa = Math.sin(a);
          const pr = c ? profile(e, scallop(u)) : rib, fu = c ? profile(1, scallop(u)) : FULL;
          const flat = Math.cos(HALF) / Math.cos((u - 0.5) * 2 * HALF), bow = Math.sin(Math.PI * u);
          const p: V3[] = [];
          for (let j = 0; j <= SEG; j++) {
            // Cloth that the ribs no longer hold taut folds outward and wraps round, like a furled umbrella.
            const half = fu.r[j] * Math.sin(HALF), chord = pr.r[j] * Math.sin(HALF);
            const slack = Math.sqrt(Math.max(0, half * half - chord * chord)) * bow;
            const rr = pr.r[j] * flat + slack * 0.22, tg = slack * 0.42;
            p.push([rr * ca - tg * sa, pr.h[j], rr * sa + tg * ca]);
          }
          cols.push(p);
        }
        P.push(cols);
      }
      const jr = rib.r[JOINT];
      runY = rib.h[JOINT] + Math.sqrt(Math.max(0, STRUT * STRUT - jr * jr));
      const px = (v: V3) => CX + v[0], py = (v: V3) => TOP + v[1] * cT - v[2] * sT;
      joints = P.map((g) => [px(g[0][JOINT]), py(g[0][JOINT]), g[0][JOINT][2]]);
      quads = [];
      env.fill(1e9);
      tips.length = 0;
      for (let i = 0; i < RIBS; i++) {
        const nx = (i + 1) % RIBS;
        const tp = leaned(px(P[i][0][SEG]), py(P[i][0][SEG])); tips.push([tp[0], tp[1], P[i][0][SEG][2]]);
        for (let half = 0; half < COLS; half++) {
          const A = P[i][half], B = half === COLS - 1 ? P[nx][0] : P[i][half + 1];
          for (let j = 0; j < SEG; j++) {
            const a = A[j], b = B[j], c = B[j + 1], d = A[j + 1];
            const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2], vx = d[0] - b[0], vy = d[1] - b[1], vz = d[2] - b[2];
            let x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx;
            const n = Math.hypot(x, y, z) || 1; x /= n; y /= n; z /= n;
            const mx = (a[0] + c[0]) / 2, mz = (a[2] + c[2]) / 2;
            if (x * mx + z * mz - y * 40 < 0) { x = -x; y = -y; z = -z; }
            const inside = y * sT + z * cT < 0;
            const lit = Math.max(0, x * LT[0] + y * LT[1] + z * LT[2]);
            const hv = Math.max(0, x * HV[0] + y * HV[1] + z * HV[2]), sp = Math.pow(hv, 40) * 1.5 + Math.pow(hv, 7) * 0.3;
            const along = (1 - 0.1 * (j / SEG)) * (0.95 + 0.09 * Math.sin((Math.PI * (half + 0.5)) / COLS)); // cloth dips a little at each seam
            const col = inside ? tone(LINING, (0.46 + 0.9 * lit) * along, 0) : tone(CANOPY, (0.52 + 0.6 * lit) * along, sp * 70);
            const line = inside ? "rgba(214,220,226,0.75)" : tone(CANOPY, 0.3 + 0.4 * lit, 0);
            const p = [px(a), py(a), px(b), py(b), px(c), py(c), px(d), py(d)];
            quads.push({ p, bead: wet[(i * COLS + half) * SEG + j], z: (a[2] + b[2] + c[2] + d[2]) / 4 + (inside ? -0.5 : 0), near: mz >= 0, col, line, inside, rib: half === 0 ? 0 : half === COLS - 1 ? 2 : -1, hem: j === SEG - 1, tip: !half && j === SEG - 1 });
            for (let q = 0; q < 4; q++) {
              const [x0, y0] = leaned(p[q * 2], p[q * 2 + 1]), [x1, y1] = leaned(p[((q + 1) % 4) * 2], p[((q + 1) % 4) * 2 + 1]);
              const lo = Math.max(0, Math.ceil(Math.min(x0, x1) / 2)), hi = Math.min(env.length - 1, Math.floor(Math.max(x0, x1) / 2));
              for (let ix = lo; ix <= hi; ix++) { const f = x1 === x0 ? 0 : (ix * 2 - x0) / (x1 - x0), yy = y0 + (y1 - y0) * f; if (yy < env[ix]) env[ix] = yy; }
            }
          }
        }
      }
      quads.sort((a, b) => a.z - b.z);
      return e;
    };

    const metal = (x: number, w: number) => {
      const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      g.addColorStop(0, "#2b3036"); g.addColorStop(0.3, "#f2f5f8"); g.addColorStop(0.55, "#8d959e"); g.addColorStop(1, "#22262b");
      return g;
    };
    const brassy = (x: number, w: number) => {
      const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      g.addColorStop(0, "#5a3c0c"); g.addColorStop(0.28, "#ffe9a8"); g.addColorStop(0.5, "#c4922f"); g.addColorStop(1, "#4a3008");
      return g;
    };
    const cloth = (q: Quad) => {
      const p = q.p;
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[2], p[3]); ctx.lineTo(p[4], p[5]); ctx.lineTo(p[6], p[7]); ctx.closePath();
      ctx.fillStyle = q.col; ctx.fill(); ctx.lineWidth = Math.max(0.9, 1.5 / k); ctx.strokeStyle = q.col; ctx.stroke();
      // The seam over each rib, or the steel rib itself when the cloth is seen from below.
      const e = q.rib;
      if (e >= 0) { ctx.beginPath(); ctx.moveTo(p[e], p[e + 1]); ctx.lineTo(p[e ? 4 : 6], p[e ? 5 : 7]); ctx.lineWidth = q.inside ? 1.5 : 1.1; ctx.strokeStyle = q.line; ctx.stroke(); }
      if (q.hem) { ctx.beginPath(); ctx.moveTo(p[6], p[7]); ctx.lineTo(p[4], p[5]); ctx.lineWidth = 2.2; ctx.strokeStyle = q.inside ? "rgba(70,44,6,0.7)" : "rgba(120,78,6,0.75)"; ctx.stroke(); }
      if (q.bead && !q.inside) {
        const bx = (p[0] + p[4]) / 2, by = (p[1] + p[5]) / 2, r = q.bead;
        ctx.beginPath(); ctx.ellipse(bx, by + r * 0.5, r * 1.1, r * 1.35, 0, 0, TAU); ctx.fillStyle = "rgba(90,52,0,0.4)"; ctx.fill();
        ctx.beginPath(); ctx.ellipse(bx, by, r, r * 1.25, 0, 0, TAU); ctx.fillStyle = "rgba(255,236,170,0.55)"; ctx.fill();
        ctx.beginPath(); ctx.arc(bx - r * 0.3, by - r * 0.45, r * 0.42, 0, TAU); ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.fill();
      }
      if (q.tip) {
        ctx.beginPath(); ctx.arc(p[6], p[7], 3, 0, TAU); ctx.fillStyle = "#c9d0d7"; ctx.fill();
        ctx.beginPath(); ctx.arc(p[6] - 0.9, p[7] - 0.9, 1.1, 0, TAU); ctx.fillStyle = "#ffffff"; ctx.fill();
      }
    };
    const umbrella = () => {
      const bob = reduce ? 0 : Math.sin(s.t * 1.3) * 2.2;
      ctx.save(); ctx.translate(CX, PY + bob); ctx.rotate(s.lean); ctx.translate(-CX, -PY);
      for (const q of quads) if (!q.near) cloth(q);
      // Shaft, runner and the eight stretchers that push the ribs out.
      const y1 = TOP + L * 1.3 * cT;
      ctx.fillStyle = metal(CX, 7); ctx.fillRect(CX - 3.5, TOP - 4, 7, y1 - TOP + 4);
      const ry = TOP + runY * cT;
      ctx.lineCap = "round";
      for (const j of joints) {
        ctx.beginPath(); ctx.moveTo(CX, ry - 2 - j[2] * 0.02); ctx.lineTo(j[0], j[1]);
        ctx.lineWidth = 2.6; ctx.strokeStyle = j[2] < 0 ? "#3b4148" : "#59616a"; ctx.stroke();
        ctx.lineWidth = 0.9; ctx.strokeStyle = j[2] < 0 ? "#8b949d" : "#e6ebf0"; ctx.stroke();
        ctx.beginPath(); ctx.arc(j[0], j[1], 2.2, 0, TAU); ctx.fillStyle = "#aeb6be"; ctx.fill();
      }
      ctx.fillStyle = brassy(CX, 15); ctx.fillRect(CX - 7.5, ry - 7, 15, 20);
      ctx.fillStyle = "rgba(40,24,0,0.5)"; ctx.fillRect(CX - 7.5, ry + 3, 15, 1.4);
      ctx.fillStyle = "rgba(255,246,210,0.7)"; ctx.fillRect(CX - 7.5, ry - 7, 15, 1.2);
      // The crook: turned wood with a lacquer highlight, under a brass collar.
      const hx = Math.cos(s.psi * 0.9), R = 23, y2 = TOP + L * 1.5 * cT, cx = CX + R * hx;
      const hook = () => { ctx.beginPath(); ctx.moveTo(CX, y1 - 2); ctx.lineTo(CX, y2); ctx.ellipse(cx, y2, Math.abs(R * hx), R, 0, hx < 0 ? 0 : Math.PI, hx < 0 ? Math.PI * 1.22 : -Math.PI * 0.22, hx >= 0); };
      for (const [w, dx, dy, col] of [[19, 0, 0, "#3a1f0c"], [15, -1, -1, "#6f3f1b"], [9, -3, -2, "#9a5e2c"], [3.4, -5.2, -3, "rgba(232,176,116,0.85)"], [1.2, -5.8, -3.4, "rgba(255,244,226,0.75)"]] as [number, number, number, string][]) {
        ctx.save(); ctx.translate(dx, dy); hook(); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke(); ctx.restore();
      }
      ctx.fillStyle = brassy(CX, 22); ctx.fillRect(CX - 11, y1 - 12, 22, 12);
      ctx.fillStyle = "rgba(255,246,210,0.75)"; ctx.fillRect(CX - 11, y1 - 12, 22, 1.3);
      ctx.fillStyle = "rgba(40,24,0,0.55)"; ctx.fillRect(CX - 11, y1 - 1.6, 22, 1.6);
      for (const q of quads) if (q.near) cloth(q);
      // Cap and ferrule above the cloth.
      ctx.beginPath(); ctx.ellipse(CX, TOP + 1, 11, 4.2, 0, 0, TAU); ctx.fillStyle = tone(CANOPY, 0.62, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(CX - 4.2, TOP); ctx.lineTo(CX - 1.6, TOP - 34); ctx.lineTo(CX + 1.6, TOP - 34); ctx.lineTo(CX + 4.2, TOP); ctx.closePath(); ctx.fillStyle = metal(CX, 9); ctx.fill();
      ctx.beginPath(); ctx.arc(CX, TOP - 35, 2.6, 0, TAU); ctx.fillStyle = "#dfe5ea"; ctx.fill();
      ctx.restore();
    };

    const ground = (e: number) => {
      const wide = 40 + (FULL.r[SEG] - 30) * clamp(e, 0, 1);
      const floor = ctx.createLinearGradient(0, GY - 40, 0, H);
      floor.addColorStop(0, "rgba(150,180,210,0)"); floor.addColorStop(0.3, "rgba(150,180,210,0.07)"); floor.addColorStop(1, "rgba(150,180,210,0.02)");
      ctx.fillStyle = floor; ctx.fillRect(-ox, GY - 40, VW, VH - GY + 40);
      // The cloth's colour lying in the wet, and the dry shadow under it.
      ctx.save(); ctx.translate(CX + s.lean * -260, GY + 22); ctx.scale(1, 0.2);
      const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, wide * 1.15);
      glow.addColorStop(0, `rgba(${CANOPY[0]},${CANOPY[1]},${CANOPY[2]},${0.03 + 0.12 * clamp(e, 0, 1)})`); glow.addColorStop(1, `rgba(${CANOPY[0]},${CANOPY[1]},${CANOPY[2]},0)`);
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, wide * 1.15, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      const dark = ctx.createRadialGradient(0, 0, 2, 0, 0, wide * 0.55);
      dark.addColorStop(0, "rgba(4,8,12,0.5)"); dark.addColorStop(1, "rgba(4,8,12,0)");
      ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(0, 0, wide * 0.55, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.lineWidth = 1;
      for (const r of rings) {
        const a = 1 - r.age / 0.7, rad = 3 + r.age * 34;
        ctx.beginPath(); ctx.ellipse(r.x, r.y, rad, rad * 0.26, 0, 0, TAU); ctx.strokeStyle = `rgba(206,226,246,${0.5 * a})`; ctx.stroke();
      }
    };

    const streaks = (layer: number) => {
      const sp = layer === 0 ? 640 : layer === 1 ? 960 : 1350, tau = layer === 2 ? 0.03 : 0.024;
      ctx.beginPath();
      for (const d of drops) if (d.layer === layer) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - s.wind * 250 * (sp / 960) * tau, d.y - sp * tau); }
      ctx.lineWidth = layer === 0 ? 0.8 : layer === 1 ? 1.15 : 2.4; ctx.lineCap = "round";
      ctx.strokeStyle = layer === 0 ? "rgba(170,198,226,0.24)" : layer === 1 ? "rgba(214,232,250,0.62)" : "rgba(214,232,250,0.13)"; ctx.stroke();
    };

    const draw = (e: number) => {
      ctx.setTransform(k, 0, 0, k, ox * k, 0);
      ctx.clearRect(-ox, 0, VW, VH);
      streaks(0);
      ground(e);
      umbrella();
      streaks(1);
      for (const f of flecks) { ctx.beginPath(); ctx.ellipse(f.x, f.y, 5 + f.age * 40, 1.4, f.a, 0, TAU); ctx.fillStyle = `rgba(255,255,255,${0.75 * (1 - f.age / 0.12)})`; ctx.fill(); }
      ctx.fillStyle = "rgba(226,240,254,0.92)";
      for (const b of beads) if (b.big) { ctx.beginPath(); ctx.ellipse(b.x, b.y, 1.9, 3 + Math.min(4, b.vy * 0.006), 0, 0, TAU); ctx.fill(); }
      ctx.beginPath();
      for (const b of beads) if (!b.big) { ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.008, b.y - b.vy * 0.008); }
      ctx.lineWidth = 1.1; ctx.strokeStyle = "rgba(226,240,254,0.6)"; ctx.stroke();
      streaks(2);
    };

    const step = (dt: number) => {
      s.t += dt;
      const to = live.current.on ? 1 : 0, opening = to === 1;
      s.v += (165 * (to - s.o) - (opening ? 14.5 : 24) * s.v) * dt; s.o += s.v * dt;
      if (s.shake && s.o > 0.86) {
        s.shake = false;
        for (const t of tips) for (let n = 0; n < 4; n++) beads.push({ x: t[0], y: t[1], vx: (t[0] - CX) * (1 + rnd()) * 1.2, vy: -60 - rnd() * 220, life: 0.9, big: false });
      }
      s.wind += (s.windTo - s.wind) * Math.min(1, dt * 2.4);
      s.lean += (s.wind * 0.16 + Math.sin(s.t * 0.7) * 0.012 - s.lean) * Math.min(1, dt * 3);
      s.psi = 0.2 + Math.sin(s.t * 0.42) * 0.2 + s.wind * 0.25;
      const e = geometry();
      for (const d of drops) {
        const sp = d.layer === 0 ? 640 : d.layer === 1 ? 960 : 1350;
        const py = d.y; d.x += s.wind * 250 * (sp / 960) * dt; d.y += sp * dt;
        if (d.layer === 1) {
          const ix = Math.round(d.x / 2), top = ix >= 2 && ix < env.length - 2 ? env[ix] : 1e9;
          if (py <= top + 6 && d.y >= top) {
            const slope = (env[ix + 2] - env[ix - 2]) / 8, fl = Math.abs(slope) > 30 ? 0 : slope, nn = Math.hypot(fl, 1);
            for (let n = 0; n < 2; n++) { const up = 90 + rnd() * 170; beads.push({ x: d.x, y: top - 1, vx: (fl / nn) * up + (rnd() - 0.5) * 150 + fl * 60, vy: -up / nn, life: 0.34, big: false }); }
            flecks.push({ x: d.x, y: top, age: 0, a: Math.atan(fl) });
            if (e > 0.6) {
              s.hits++;
              let best = 0, bd = 1e9; const aim = d.x + Math.sign(fl) * 70;
              for (let i = 0; i < tips.length; i++) { const q = Math.abs(tips[i][0] - aim); if (q < bd) { bd = q; best = i; } }
              acc[best] += 1;
            }
            seed(d, false); continue;
          }
        }
        if (d.y >= d.gy) { if (d.layer === 1 && rings.length < 60) rings.push({ x: d.x, y: d.gy, age: 0 }); seed(d, false); }
      }
      if (e > 0.6) for (let i = 0; i < RIBS; i++) if (acc[i] >= 4 && tips[i]) { acc[i] -= 4; beads.push({ x: tips[i][0], y: tips[i][1] + 3, vx: s.wind * 30, vy: 20, life: 2, big: true }); }
      for (let i = beads.length - 1; i >= 0; i--) {
        const b = beads[i]; b.vy += 1500 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
        const gy = GY + 24;
        if (b.big && b.y > gy) { rings.push({ x: b.x, y: gy, age: 0 }); beads.splice(i, 1); } else if (b.life <= 0 || b.y > VH) beads.splice(i, 1);
      }
      for (let i = rings.length - 1; i >= 0; i--) { rings[i].age += dt; if (rings[i].age > 0.7) rings.splice(i, 1); }
      for (let i = flecks.length - 1; i >= 0; i--) { flecks[i].age += dt; if (flecks[i].age > 0.12) flecks.splice(i, 1); }
      return e;
    };

    const say = () => { if (tally.current && s.hits !== s.shown) { s.shown = s.hits; tally.current.textContent = `${s.hits} drops turned away`; } };
    let raf = 0, last = 0, seen = true, told = 0, was = true;
    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.034, (now - last) / 1000); last = now;
      if (DEMO && !live.current.touched) {
        const c = s.t % 12, want = c < 5.6 || c > 8.3;
        if (want !== live.current.on) { live.current.on = want; setOn(want); }
      }
      if (live.current.on && !was) s.shake = true;
      was = live.current.on;
      draw(step(dt));
      if (now - told > 300) { told = now; say(); }
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const still = () => { s.o = live.current.on ? 1 : 0; s.v = 0; draw(geometry()); };
    const wake = () => { if (reduce) { still(); return; } if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
    api.current = { wake };
    fit(); pour();
    if (!reduce) for (let i = 0; i < 90; i++) step(1 / 60); // rain is already falling in the first frame
    s.hits = 0; s.t = 0; say(); wake();

    const host = cv.parentElement;
    const onMove = (ev: PointerEvent) => { const r = cv.getBoundingClientRect(); s.windTo = clamp(((ev.clientX - r.left - r.width / 2) / Math.min(r.width / 2, 420)), -1, 1) * 0.9; };
    const onLeave = () => { s.windTo = -0.35; };
    host?.addEventListener("pointermove", onMove); host?.addEventListener("pointerleave", onLeave);
    const ro = new ResizeObserver(() => { fit(); if (reduce) still(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      host?.removeEventListener("pointermove", onMove); host?.removeEventListener("pointerleave", onLeave);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const flip = () => {
    const next = !on;
    live.current.on = next; live.current.touched = true;
    setOn(next); api.current?.wake();
  };

  return (
    <div className="relative h-[480px] w-full overflow-hidden bg-[#16202b] bg-[radial-gradient(78%_64%_at_50%_34%,#3d5166_0%,#233242_48%,#101821_100%)] sm:h-[740px]">
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={setting.name}
        onClick={flip}
        className="absolute left-1/2 top-[9%] aspect-square h-[72%] max-w-full -translate-x-1/2 cursor-pointer rounded-[40px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ffd66b]"
      />
      <p className="absolute inset-x-0 bottom-5 px-4 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-[#a9b9c9]">
        <span className="text-[#f3f6f9]">{setting.name} {on ? setting.on : setting.off}</span>
        <span className="mx-2 text-[#55677a]">/</span>
        <span ref={tally} className={on ? "text-[#ffd66b]" : "hidden"} />
        {on ? null : <span>{setting.offNote}</span>}
      </p>
    </div>
  );
}

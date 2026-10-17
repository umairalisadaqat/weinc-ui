import { useEffect, useRef, useState } from "react";

// One entry per die: body colour as r, g, b, then the pip paint and the paint of the single pip on the one.
const dice = [
  { body: [246, 238, 222], pip: "#19130f", ace: "#b3261e" },
  { body: [158, 30, 38], pip: "#f7eeda", ace: "#f7eeda" },
];
const FELT = [30, 112, 74]; // baize colour, r, g, b
const GRAVITY = 34; // die widths per second squared: lower it for a slower, floatier throw
const BOUNCE = 0.5; // how much speed survives a landing on the cloth
const GRIP = 0.42; // friction of the cloth
const W = 720, H = 500; // drawing size in CSS pixels
const NUMBER = ["one", "two", "three", "four", "five", "six"];

type Die = { p: number[]; v: number[]; q: number[]; w: number[]; m: number[]; sleep: boolean };
const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const CORNERS = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [i & 1 ? 0.5 : -0.5, i & 2 ? 0.5 : -0.5, i & 4 ? 0.5 : -0.5]);
const A = 0.25;
const PIPS: number[][][] = [[[0, 0]], [[-A, -A], [A, A]], [[-A, -A], [0, 0], [A, A]], [[-A, -A], [A, -A], [-A, A], [A, A]], [[-A, -A], [A, -A], [0, 0], [-A, A], [A, A]], [[-A, -A], [-A, 0], [-A, A], [A, -A], [A, 0], [A, A]]];
// Opposite faces add up to seven, as on a real die.
const faceValue = (axis: number, sign: number) => (sign > 0 ? [2, 1, 3][axis] : [5, 6, 4][axis]);

export default function WalnutDiceTray() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pad = useRef<HTMLDivElement>(null);
  const api = useRef<{ roll: () => void } | null>(null);
  const [faces, setFaces] = useState<number[] | null>(null);

  useEffect(() => {
    const cv = canvas.current, hit = pad.current;
    if (!cv || !hit) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;

    // The camera looks down at sixty degrees with no perspective, so every face is a plain parallelogram.
    const S = 56, SP = Math.sin(Math.PI / 3), CP = Math.cos(Math.PI / 3), CX = W / 2, CY = 248;
    const HX = 4.5, HZ = 2.9; // half the floor of the tray, in die widths
    const sx = (x: number) => CX + x * S, sy = (y: number, z: number) => CY + (z * SP - y * CP) * S;
    const norm = (a: number[]) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const LIGHT = norm([-0.52, 0.8, -0.22]), FILL = norm([0.25, 0.35, 0.9]), VIEW = [0, SP, CP], HALF = norm([LIGHT[0] + VIEW[0], LIGHT[1] + VIEW[1], LIGHT[2] + VIEW[2]]);
    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    let seed = 11;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // Tray, cloth and wood are painted once and reused every frame.
    const FX = sx(-HX), FW = 2 * HX * S, FY = sy(0, -HZ), FH = 2 * HZ * S * SP;
    const LIFT = 17, RIM = 30, RIMZ = 27, SIDE = 22;
    const OX = FX - RIM, OY = FY - LIFT - RIMZ, OW = FW + RIM * 2, OH = FH + RIMZ * 2;
    const tray = document.createElement("canvas");
    tray.width = cv.width; tray.height = cv.height;
    const t = tray.getContext("2d");
    if (t) {
      t.scale(dpr, dpr);
      t.save(); t.shadowColor = "rgba(0,0,0,0.7)"; t.shadowBlur = 46 * dpr; t.shadowOffsetY = 26 * dpr; rr(t, OX + 6, OY + SIDE, OW - 12, OH - 6, 34); t.fillStyle = "#0a0705"; t.fill(); t.restore();
      const side = t.createLinearGradient(0, OY + OH - 20, 0, OY + OH + SIDE);
      side.addColorStop(0, "#3a2414"); side.addColorStop(0.5, "#2a190d"); side.addColorStop(1, "#150c06");
      rr(t, OX, OY + SIDE, OW, OH, 34); t.fillStyle = side; t.fill();
      // Rim: walnut with long wandering grain.
      t.save(); rr(t, OX, OY, OW, OH, 34); t.clip();
      const wood = t.createLinearGradient(OX, OY, OX + OW, OY + OH);
      wood.addColorStop(0, "#7a4f2e"); wood.addColorStop(0.45, "#5e3a20"); wood.addColorStop(1, "#472a16");
      t.fillStyle = wood; t.fillRect(OX, OY, OW, OH);
      for (let i = 0; i < 260; i++) {
        const y0 = OY + rnd() * OH, amp = 1 + rnd() * 3, ph = rnd() * 6, len = 0.004 + rnd() * 0.008, x0 = OX + rnd() * OW * 0.7 - 40, span = 120 + rnd() * 380;
        t.beginPath();
        for (let x = 0; x <= span; x += 8) { const y = y0 + Math.sin(ph + (x0 + x) * len * 3) * amp; if (x === 0) t.moveTo(x0 + x, y); else t.lineTo(x0 + x, y); }
        t.lineWidth = 0.5 + rnd() * 1.1; t.strokeStyle = rnd() > 0.3 ? `rgba(28,14,6,${0.08 + rnd() * 0.2})` : `rgba(214,160,104,${0.05 + rnd() * 0.1})`; t.stroke();
      }
      const lit = t.createLinearGradient(OX, OY, OX + OW * 0.6, OY + OH);
      lit.addColorStop(0, "rgba(255,214,160,0.2)"); lit.addColorStop(0.5, "rgba(255,214,160,0)"); lit.addColorStop(1, "rgba(0,0,0,0.24)");
      t.fillStyle = lit; t.fillRect(OX, OY, OW, OH);
      t.restore();
      const edge = t.createLinearGradient(0, OY, 0, OY + OH);
      edge.addColorStop(0, "rgba(255,224,180,0.6)"); edge.addColorStop(0.3, "rgba(255,224,180,0.08)"); edge.addColorStop(1, "rgba(0,0,0,0.55)");
      rr(t, OX + 0.75, OY + 0.75, OW - 1.5, OH - 1.5, 33.5); t.lineWidth = 1.5; t.strokeStyle = edge; t.stroke();
      // A brass line let into the rim.
      const brass = t.createLinearGradient(OX, OY, OX + OW, OY + OH);
      brass.addColorStop(0, "#f6dc97"); brass.addColorStop(0.3, "#a47a2c"); brass.addColorStop(0.55, "#e8c877"); brass.addColorStop(0.8, "#8a6220"); brass.addColorStop(1, "#d9b765");
      rr(t, OX + 12, OY + 11, OW - 24, OH - 22, 25); t.lineWidth = 2; t.strokeStyle = "rgba(0,0,0,0.45)"; t.stroke();
      rr(t, OX + 12, OY + 10.2, OW - 24, OH - 22, 25); t.lineWidth = 1.4; t.strokeStyle = brass; t.stroke();
      // The well: lined walls, then the cloth floor seen below the far wall.
      rr(t, FX, FY - LIFT, FW, FH, 20);
      const wall = t.createLinearGradient(0, FY - LIFT, 0, FY + 6);
      wall.addColorStop(0, `rgb(${FELT[0] * 0.3 | 0},${FELT[1] * 0.3 | 0},${FELT[2] * 0.3 | 0})`); wall.addColorStop(1, `rgb(${FELT[0] * 0.62 | 0},${FELT[1] * 0.62 | 0},${FELT[2] * 0.62 | 0})`);
      t.fillStyle = wall; t.fill();
      t.save(); rr(t, FX, FY - LIFT, FW, FH, 20); t.clip(); rr(t, FX, FY, FW, FH, 20); t.clip();
      const cloth = t.createRadialGradient(CX - 110, CY - 60, 30, CX, CY, 360);
      cloth.addColorStop(0, `rgb(${FELT[0] * 1.3 | 0},${FELT[1] * 1.2 | 0},${FELT[2] * 1.22 | 0})`); cloth.addColorStop(0.6, `rgb(${FELT[0]},${FELT[1]},${FELT[2]})`); cloth.addColorStop(1, `rgb(${FELT[0] * 0.6 | 0},${FELT[1] * 0.66 | 0},${FELT[2] * 0.66 | 0})`);
      t.fillStyle = cloth; t.fillRect(FX, FY, FW, FH);
      for (let i = 0; i < 26000; i++) { // the nap: thousands of short fibres
        const x = FX + rnd() * FW, y = FY + rnd() * FH, a = rnd() * Math.PI, l = 1.2 + rnd() * 2.6;
        t.beginPath(); t.moveTo(x, y); t.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * SP);
        t.lineWidth = 0.6; t.strokeStyle = rnd() > 0.5 ? `rgba(190,255,214,${0.03 + rnd() * 0.07})` : `rgba(0,22,10,${0.05 + rnd() * 0.12})`; t.stroke();
      }
      const far = t.createLinearGradient(0, FY, 0, FY + 46);
      far.addColorStop(0, "rgba(0,14,6,0.6)"); far.addColorStop(1, "rgba(0,14,6,0)");
      t.fillStyle = far; t.fillRect(FX, FY, FW, 46);
      const left = t.createLinearGradient(FX, 0, FX + 40, 0);
      left.addColorStop(0, "rgba(0,14,6,0.55)"); left.addColorStop(1, "rgba(0,14,6,0)");
      t.fillStyle = left; t.fillRect(FX, FY, 40, FH);
      t.restore();
      rr(t, FX, FY - LIFT, FW, FH, 20); t.lineWidth = 1.2; t.strokeStyle = "rgba(0,0,0,0.5)"; t.stroke();
      const lip = t.createLinearGradient(0, FY - LIFT, 0, FY - LIFT + FH);
      lip.addColorStop(0, "rgba(255,226,180,0)"); lip.addColorStop(0.8, "rgba(255,226,180,0)"); lip.addColorStop(1, "rgba(255,226,180,0.5)");
      rr(t, FX - 1, FY - LIFT - 1, FW + 2, FH + 2, 21); t.lineWidth = 1; t.strokeStyle = lip; t.stroke();
    }

    const mat = (d: Die) => {
      const [w, x, y, z] = d.q;
      d.m = [1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y), 2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x), 2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)];
    };
    const axis = (d: Die, k: number) => [d.m[k], d.m[3 + k], d.m[6 + k]];
    const top = (d: Die) => { let k = 0; for (let i = 1; i < 3; i++) if (Math.abs(d.m[3 + i]) > Math.abs(d.m[3 + k])) k = i; return { k, s: d.m[3 + k] > 0 ? 1 : -1 }; };
    const spin = (d: Die, dt: number) => {
      const [w, x, y, z] = d.q, [a, b, c] = d.w, h = dt * 0.5;
      const q = [w - h * (a * x + b * y + c * z), x + h * (a * w + b * z - c * y), y + h * (b * w + c * x - a * z), z + h * (c * w + a * y - b * x)];
      const l = Math.hypot(q[0], q[1], q[2], q[3]);
      d.q = [q[0] / l, q[1] / l, q[2] / l, q[3] / l]; mat(d);
    };
    const all: Die[] = dice.map((_, i) => ({ p: [i * 1.6 - 0.8, 0.5, 0], v: [0, 0, 0], q: [1, 0, 0, 0], w: [0, 0, 0], m: [1, 0, 0, 0, 1, 0, 0, 0, 1], sleep: true }));
    const PLANES = [
      { n: [0, 1, 0], d: 0, e: BOUNCE, mu: GRIP }, { n: [1, 0, 0], d: -HX, e: 0.5, mu: 0.25 }, { n: [-1, 0, 0], d: -HX, e: 0.5, mu: 0.25 },
      { n: [0, 0, 1], d: -HZ, e: 0.5, mu: 0.25 }, { n: [0, 0, -1], d: -HZ, e: 0.5, mu: 0.25 },
    ];
    let airtime = 0, held = false, rolling = false;
    const hand = { x: 0, z: 0, vx: 0, vz: 0, t: 0 };

    // One small step of a real rigid body: gravity, then an impulse at every corner that is through a surface.
    const step = (d: Die, dt: number) => {
      if (d.sleep) return;
      d.v[1] -= GRAVITY * dt;
      for (let i = 0; i < 3; i++) d.p[i] += d.v[i] * dt;
      spin(d, dt);
      let onFloor = false;
      PLANES.forEach((pl, pi) => {
        let deep = 0;
        for (const c of CORNERS) {
          const r = [d.m[0] * c[0] + d.m[1] * c[1] + d.m[2] * c[2], d.m[3] * c[0] + d.m[4] * c[1] + d.m[5] * c[2], d.m[6] * c[0] + d.m[7] * c[1] + d.m[8] * c[2]];
          const dist = pl.n[0] * (d.p[0] + r[0]) + pl.n[1] * (d.p[1] + r[1]) + pl.n[2] * (d.p[2] + r[2]) - pl.d;
          if (dist >= 0) continue;
          if (pi === 0) onFloor = true;
          deep = Math.max(deep, -dist);
          let wr = cross(d.w, r);
          const vn = (d.v[0] + wr[0]) * pl.n[0] + (d.v[1] + wr[1]) * pl.n[1] + (d.v[2] + wr[2]) * pl.n[2];
          if (vn >= 0) continue;
          const rn = cross(r, pl.n);
          const jn = (-(1 + (vn < -0.7 ? pl.e : 0)) * vn) / (1 + 6 * dot(rn, rn)); // a cube's inertia is its mass over six
          for (let i = 0; i < 3; i++) { d.v[i] += jn * pl.n[i]; d.w[i] += 6 * rn[i] * jn; }
          wr = cross(d.w, r);
          const vc = [d.v[0] + wr[0], d.v[1] + wr[1], d.v[2] + wr[2]], along = dot(vc, pl.n);
          const vt = [vc[0] - along * pl.n[0], vc[1] - along * pl.n[1], vc[2] - along * pl.n[2]], sl = Math.hypot(vt[0], vt[1], vt[2]);
          if (sl > 1e-4) {
            const tg = [vt[0] / sl, vt[1] / sl, vt[2] / sl], rt = cross(r, tg), jt = Math.min(pl.mu * jn, sl / (1 + 6 * dot(rt, rt)));
            for (let i = 0; i < 3; i++) { d.v[i] -= jt * tg[i]; d.w[i] -= 6 * rt[i] * jt; }
          }
        }
        for (let i = 0; i < 3; i++) d.p[i] += pl.n[i] * deep;
      });
      if (onFloor) {
        // The cloth soaks up spin, and a die that has dithered too long is eased onto its nearest face.
        const { k, s } = top(d), up = axis(d, k).map((v) => v * s), lean = cross(up, [0, 1, 0]), push = airtime > 3 ? 260 : up[1] > 0.9 ? 14 : 0;
        const drag = 1 - (airtime > 3 ? 6 : 0.5) * dt;
        for (let i = 0; i < 3; i++) d.w[i] = (d.w[i] + lean[i] * push * dt) * drag;
        if (up[1] > 0.9995 && Math.hypot(d.v[0], d.v[1], d.v[2]) < 0.7 && Math.hypot(d.w[0], d.w[1], d.w[2]) < 1.1) {
          const ang = Math.asin(Math.min(1, Math.hypot(lean[0], lean[1], lean[2])));
          if (ang > 1e-6) { const ax = norm(lean), sh = Math.sin(ang / 2), ch = Math.cos(ang / 2), [w, x, y, z] = d.q, [a, b, c] = [ax[0] * sh, ax[1] * sh, ax[2] * sh]; d.q = [ch * w - a * x - b * y - c * z, ch * x + a * w + b * z - c * y, ch * y + b * w + c * x - a * z, ch * z + c * w + a * y - b * x]; mat(d); }
          d.p[1] = 0.5; d.v = [0, 0, 0]; d.w = [0, 0, 0]; d.sleep = true;
        }
      }
    };
    const knock = () => {
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        const a = all[i], b = all[j], dl = [b.p[0] - a.p[0], b.p[1] - a.p[1], b.p[2] - a.p[2]], dist = Math.hypot(dl[0], dl[1], dl[2]) || 1;
        if (dist >= 1.42) continue;
        const n = [dl[0] / dist, dl[1] / dist, dl[2] / dist], rel = (b.v[0] - a.v[0]) * n[0] + (b.v[1] - a.v[1]) * n[1] + (b.v[2] - a.v[2]) * n[2], gap = (1.42 - dist) / 2;
        if (a.sleep && b.sleep) continue;
        a.sleep = false; b.sleep = false;
        for (let k = 0; k < 3; k++) { a.p[k] -= n[k] * gap; b.p[k] += n[k] * gap; if (rel < 0) { a.v[k] += n[k] * rel * 0.7; b.v[k] -= n[k] * rel * 0.7; } }
        if (rel < -1) { a.w[1] += rel * 0.6; b.w[1] -= rel * 0.6; }
      }
    };
    const report = () => { rolling = false; setFaces(all.map((d) => { const { k, s } = top(d); return faceValue(k, s); })); };
    const advance = (dt: number) => {
      const n = 8;
      for (let i = 0; i < n; i++) { all.forEach((d) => step(d, dt / n)); knock(); }
      airtime += dt;
      if (rolling && all.every((d) => d.sleep)) report();
    };
    const fling = (from: number[], vel: number[], low: boolean) => {
      all.forEach((d, i) => {
        d.sleep = false;
        d.p = [from[0] + (i - 0.5) * 0.3 + Math.random() * 0.2, low ? 1.5 : 3 + i * 0.5, from[2] + (i - 0.5) * 1.5];
        d.v = [vel[0] * (0.85 + Math.random() * 0.3), 1 + Math.random() * 2, vel[2] + (i - 0.5) * -2.4 + Math.random() * 2 - 1];
        const along = norm([d.v[2], 0, -d.v[0]]), sp = 14 + Math.random() * 10;
        d.w = [along[0] * sp + Math.random() * 8 - 4, Math.random() * 12 - 6, along[2] * sp + Math.random() * 8 - 4];
        const q = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5], l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
        d.q = q.map((v) => v / l); mat(d);
      });
      airtime = 0; rolling = true; setFaces(null);
    };

    const hull = (pts: number[][]) => {
      const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), turn = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      const lo: number[][] = [], hi: number[][] = [];
      for (const q of p) { while (lo.length > 1 && turn(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
      for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (hi.length > 1 && turn(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
      return lo.slice(0, -1).concat(hi.slice(0, -1));
    };
    const shade = (rgb: number[], k: number) => `rgb(${Math.min(255, rgb[0] * k) | 0},${Math.min(255, rgb[1] * (k * 0.98 + 0.005)) | 0},${Math.min(255, rgb[2] * (k * 0.94 + 0.03)) | 0})`;

    const drawDie = (d: Die, look: (typeof dice)[number]) => {
      const seen: { n: number[]; u: number[]; w: number[]; val: number }[] = [];
      for (let k = 0; k < 3; k++) for (const s of [1, -1]) {
        const n = axis(d, k).map((v) => v * s);
        if (dot(n, VIEW) > 0.012) seen.push({ n, u: axis(d, (k + 1) % 3), w: axis(d, (k + 2) % 3), val: faceValue(k, s) });
      }
      const mid = seen.length === 3 ? [0, 1, 2].map((i) => (seen[0].n[i] + seen[1].n[i] + seen[2].n[i]) * 0.5) : null;
      for (const f of seen) {
        const c = [d.p[0] + f.n[0] * 0.5, d.p[1] + f.n[1] * 0.5, d.p[2] + f.n[2] * 0.5];
        ctx.setTransform(dpr * f.u[0] * S, dpr * (f.u[2] * SP - f.u[1] * CP) * S, dpr * f.w[0] * S, dpr * (f.w[2] * SP - f.w[1] * CP) * S, dpr * sx(c[0]), dpr * sy(c[1], c[2]));
        const k = 0.42 + 0.6 * Math.max(0, dot(f.n, LIGHT)) + 0.2 * Math.max(0, dot(f.n, FILL));
        if (mid) { // fill the notch where three rounded faces meet
          const mu = dot(mid, f.u) - dot(f.n, f.u) * 0.5, mw = dot(mid, f.w) - dot(f.n, f.w) * 0.5;
          ctx.fillStyle = shade(look.body, 0.98); ctx.fillRect(mu > 0 ? 0.3 : -0.5, mw > 0 ? 0.3 : -0.5, 0.2, 0.2);
        }
        rr(ctx, -0.5, -0.5, 1, 1, 0.15); ctx.fillStyle = shade(look.body, k * 0.9); ctx.fill();
        const lu = dot(LIGHT, f.u), lw = dot(LIGHT, f.w);
        const g = ctx.createLinearGradient(-lu * 0.6, -lw * 0.6, lu * 0.6, lw * 0.6);
        g.addColorStop(0, shade(look.body, k * 0.9)); g.addColorStop(1, shade(look.body, k * 1.07));
        rr(ctx, -0.455, -0.455, 0.91, 0.91, 0.125); ctx.fillStyle = g; ctx.fill();
        const gl = Math.pow(Math.max(0, dot(f.n, HALF)), 14);
        if (gl > 0.02) {
          const hi = ctx.createRadialGradient(lu * 0.5, lw * 0.5, 0, lu * 0.5, lw * 0.5, 0.75);
          hi.addColorStop(0, `rgba(255,255,255,${0.55 * gl})`); hi.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = hi; ctx.fill();
        }
        // Drilled pips: paint in the pit, a shadow under the lit lip and a glint on the wall that faces the lamp.
        const la = Math.atan2(lw, lu);
        for (const [pu, pw] of PIPS[f.val - 1]) {
          const r = f.val === 1 ? 0.135 : 0.092;
          ctx.beginPath(); ctx.arc(pu, pw, r, 0, Math.PI * 2); ctx.fillStyle = f.val === 1 ? look.ace : look.pip; ctx.fill();
          ctx.lineWidth = 0.026; ctx.beginPath(); ctx.arc(pu, pw, r - 0.013, la - 1.1, la + 1.1); ctx.strokeStyle = "rgba(0,0,0,0.42)"; ctx.stroke();
          ctx.lineWidth = 0.02; ctx.beginPath(); ctx.arc(pu, pw, r - 0.012, la + Math.PI - 0.9, la + Math.PI + 0.9); ctx.strokeStyle = `rgba(255,255,255,${0.16 + 0.3 * k * 0.6})`; ctx.stroke();
        }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(tray, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.save(); ctx.beginPath(); ctx.rect(FX, FY, FW, FH - LIFT); ctx.clip();
      for (const d of all) {
        const pts = CORNERS.map((c) => {
          const r = [d.m[0] * c[0] + d.m[1] * c[1] + d.m[2] * c[2], d.m[3] * c[0] + d.m[4] * c[1] + d.m[5] * c[2], d.m[6] * c[0] + d.m[7] * c[1] + d.m[8] * c[2]];
          const y = d.p[1] + r[1];
          return [sx(d.p[0] + r[0] - (y * LIGHT[0]) / LIGHT[1]), sy(0, d.p[2] + r[2] - (y * LIGHT[2]) / LIGHT[1])];
        });
        const lift = Math.max(0, d.p[1] - 0.5);
        for (const [blur, alpha] of [[5 + lift * 9, 0.55 / (1 + lift * 0.7)], [1.5 + lift * 4, 0.3 / (1 + lift * 2)]]) {
          ctx.save(); ctx.shadowColor = `rgba(0,10,4,${alpha})`; ctx.shadowBlur = blur * dpr; ctx.shadowOffsetX = 3000 * dpr;
          ctx.beginPath(); hull(pts).forEach((p, i) => (i ? ctx.lineTo(p[0] - 3000, p[1]) : ctx.moveTo(p[0] - 3000, p[1]))); ctx.closePath(); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
        }
      }
      ctx.restore();
      all.map((d, i) => ({ d, i })).sort((a, b) => a.d.p[2] * CP + a.d.p[1] * SP - (b.d.p[2] * CP + b.d.p[1] * SP)).forEach(({ d, i }) => drawDie(d, dice[i]));
      // The near rim stands in front of anything low in the tray.
      const cut = (FY + FH - LIFT) * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(tray, 0, cut, cv.width, cv.height - cut, 0, cut, cv.width, cv.height - cut);
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, rest = 0;
    const roll = () => { const side = Math.random() < 0.5 ? -1 : 1; fling([3.3 * side, 0, 1.1], [-8.6 * side, 0, -2.2], false); }; // from the left or the right
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (held) {
        hand.t += dt;
        all.forEach((d, i) => {
          const goal = [hand.x + Math.cos(hand.t * 9 + i * 3) * 0.5, 2.1 + Math.sin(hand.t * 13 + i) * 0.25, hand.z + Math.sin(hand.t * 9 + i * 3) * 0.5];
          for (let k = 0; k < 3; k++) { d.v[k] = (goal[k] - d.p[k]) * 16; d.p[k] += d.v[k] * dt; }
          d.w = [7 + i * 3, 9 - i * 4, 5]; spin(d, dt);
        });
      } else advance(dt);
      rest = all.every((d) => d.sleep) ? rest + dt : 0;
      if (rest > 3.4 && now - touched > 7000) roll(); // nobody is playing: throw again
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    // With motion reduced the whole throw is worked out at once and only the result is shown.
    const settle = () => { for (let i = 0; i < 900 && !all.every((d) => d.sleep); i++) advance(1 / 60); draw(); };
    api.current = { roll: () => { touched = performance.now(); held = false; roll(); if (reduce) settle(); else wake(); } };
    fling([-2.9, 0, 0.8], [6.6, 0, -1.6], true);
    if (reduce) settle(); else wake();

    const where = (e: PointerEvent) => {
      const b = hit.getBoundingClientRect(), x = ((e.clientX - b.left) / b.width) * W, y = ((e.clientY - b.top) / b.height) * H;
      return [Math.max(-HX + 1.1, Math.min(HX - 1.1, (x - CX) / S)), Math.max(-HZ + 1.1, Math.min(HZ - 1.1, ((y - CY) / S + 2.1 * CP) / SP))];
    };
    let stamp = 0;
    const onDown = (e: PointerEvent) => {
      if (reduce) { api.current?.roll(); return; }
      const [x, z] = where(e);
      held = true; hand.x = x; hand.z = z; hand.vx = 0; hand.vz = 0; stamp = performance.now(); touched = stamp; rolling = true; setFaces(null);
      all.forEach((d) => { d.sleep = false; });
      hit.setPointerCapture(e.pointerId); e.preventDefault(); wake();
    };
    const onMove = (e: PointerEvent) => {
      if (!held) return;
      const [x, z] = where(e), now = performance.now(), dt = Math.max(0.008, (now - stamp) / 1000);
      hand.vx += ((x - hand.x) / dt - hand.vx) * 0.5; hand.vz += ((z - hand.z) / dt - hand.vz) * 0.5;
      hand.x = x; hand.z = z; stamp = now; touched = now;
    };
    const onUp = () => {
      if (!held) return;
      held = false; touched = performance.now();
      let vx = hand.vx, vz = hand.vz;
      if (performance.now() - stamp > 120) { vx = 0; vz = 0; }
      const sp = Math.hypot(vx, vz);
      if (sp < 5) { const a = Math.atan2(-hand.z, -hand.x) + Math.random() - 0.5; vx = Math.cos(a) * 9; vz = Math.sin(a) * 6; } else if (sp > 22) { vx *= 22 / sp; vz *= 22 / sp; }
      fling([hand.x, 0, hand.z], [vx, 0, vz], false);
    };
    hit.addEventListener("pointerdown", onDown); hit.addEventListener("pointermove", onMove);
    hit.addEventListener("pointerup", onUp); hit.addEventListener("pointercancel", onUp);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      hit.removeEventListener("pointerdown", onDown); hit.removeEventListener("pointermove", onMove);
      hit.removeEventListener("pointerup", onUp); hit.removeEventListener("pointercancel", onUp);
      io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const total = faces ? faces.reduce((a, b) => a + b, 0) : 0;
  return (
    <div className="flex min-h-[520px] w-full flex-col items-center justify-center bg-[#0d0b0a] bg-[radial-gradient(110%_80%_at_50%_34%,#221c17_0%,#0d0b0a_64%)] px-4 py-10 sm:min-h-[720px]">
      <div className="relative w-full max-w-[720px]" style={{ aspectRatio: `${W} / ${H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div ref={pad} aria-hidden="true" className="absolute inset-[12%] cursor-grab touch-none active:cursor-grabbing" />
      </div>
      <p aria-live="polite" className="mt-2 min-h-[20px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-stone-400">
        {faces ? (
          <>
            <span className="text-stone-100">{faces.map((f) => NUMBER[f - 1]).join(" and ")}</span>
            <span className="mx-2 text-stone-600">/</span>
            total {total}
          </>
        ) : (
          "Rolling"
        )}
      </p>
      <button
        type="button"
        onClick={() => api.current?.roll()}
        className="mt-5 h-11 rounded-full border border-[#c9a45c]/50 bg-[#c9a45c]/10 px-6 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ecdcae] outline-none transition-colors duration-200 hover:bg-[#c9a45c]/20 focus-visible:ring-2 focus-visible:ring-[#e8c877] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0b0a] motion-reduce:transition-none"
      >
        Throw the dice
      </button>
    </div>
  );
}

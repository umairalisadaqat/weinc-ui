import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here.
const TASK = "Sending proof sheets";
const DONE = "Sent";
const STEPS = 5; // drops of ink it takes to reach 100%
const VALUE: number | null = null; // 0 to 1 shows real progress (one drop per 1/STEPS); null plays the demo
const INK = "#1c2cab";
const EVERY = 2.7; // seconds between drops in the demo

const W = 560, H = 580, CX = 280, TOP = 150, BOT = 494, RT = 114, RB = 100, WALL = 5, BASE = 26, TIP = 88;
const rgb = (hex: string) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const mix = (a: string, b: string, t: number, al = 1) => {
  const p = rgb(a), q = rgb(b);
  return `rgba(${p.map((v, i) => Math.round(v + (q[i] - v) * t)).join(",")},${al})`;
};
const BLUE = "#" + rgb(INK).map((v) => Math.round(v + (255 - v) * 0.18).toString(16).padStart(2, "0")).join(""); // the ink thinned by water
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
type Ctx = CanvasRenderingContext2D;
type Pair = { x: number; y: number; dx: number; dy: number; g: number; a: number; age: number; gen: number; split: boolean };

export default function InkDropProgressGlass() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [pct, setPct] = useState(VALUE === null ? 40 : Math.round(VALUE * 100));
  const api = useRef<{ add: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const yF = BOT - BASE, yS = TOP + 50; // the floor of the glass and the surface of the water
    const rO = (y: number) => RT + ((RB - RT) * (y - TOP)) / (BOT - TOP);
    const rI = (y: number) => rO(y) - WALL;
    const ec = (y: number) => 0.17 + (0.07 * (y - TOP)) / (BOT - TOP);
    const slab = (c: Ctx, y0: number, y1: number, rf: (y: number) => number) => {
      c.beginPath(); c.moveTo(CX - rf(y0), y0); c.lineTo(CX - rf(y1), y1);
      c.ellipse(CX, y1, rf(y1), rf(y1) * ec(y1), 0, Math.PI, 0, true);
      c.lineTo(CX + rf(y0), y0); c.ellipse(CX, y0, rf(y0), rf(y0) * ec(y0), 0, 0, Math.PI, true); c.closePath();
    };
    let k = 1, seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // One soft dot of ink, stamped a couple of thousand times a frame.
    const dot = document.createElement("canvas"); dot.width = dot.height = 64;
    {
      const c = dot.getContext("2d");
      if (c) {
        const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, mix(INK, "#000000", 0.1, 1)); g.addColorStop(0.35, mix(INK, "#ffffff", 0, 0.62)); g.addColorStop(0.7, mix(INK, "#ffffff", 0.06, 0.16)); g.addColorStop(1, mix(INK, "#ffffff", 0.1, 0));
        c.fillStyle = g; c.fillRect(0, 0, 64, 64);
      }
    }
    const ink = document.createElement("canvas");
    const iX = CX - RT, iY = yS - 8, iW = RT * 2, iH = yF - yS + 44;
    let ictx: Ctx | null = null, kq = 1;
    const fit = () => {
      const b = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.max(2, Math.round(b.width * dpr)); cv.height = Math.round((cv.width * H) / W); k = cv.width / W;
      kq = Math.min(k, 1.2) * 0.75; /* ink is soft, so it is painted small and scaled up */ ink.width = Math.ceil(iW * kq); ink.height = Math.ceil(iH * kq); ictx = ink.getContext("2d");
    };

    // The ink is a cloud of points carried by sinking vortex pairs. A pair rolls the ink into a mushroom, then
    // breaks into two smaller pairs, which is what makes a real drop branch like a chandelier.
    const N = 380, MAX = N * STEPS;
    const px = new Float32Array(MAX), py = new Float32Array(MAX), pa = new Float32Array(MAX);
    let count = 0;
    let pairs: Pair[] = [];
    const xs = [-10, 30, -44, 12, 52, -26, 40, -6];
    const s = {
      t: 0, landed: 0, shown: 0, next: 0.4, held: 0, clear: 0, light: 0, lightTo: 0, pip: CX + xs[0],
      drop: { on: 0, t: 0, x: 0, y: 0, v: 0 }, rip: [] as { x: number; t: number }[], mx: 0, my: 0, mvx: 0, mvy: 0, min: false,
    };

    const land = (x: number) => {
      const from = count >= MAX ? 0 : count;
      if (count >= MAX) count = 0;
      for (let i = 0; i < N; i++) {
        const a = rand() * Math.PI * 2, stem = i % 5 === 0, d = Math.sqrt(rand()) * (stem ? 2.4 : 6.5);
        px[from + i] = x + Math.cos(a) * d; py[from + i] = yS + (stem ? 4 + rand() * 30 : 10 + Math.sin(a) * d * 0.8); pa[from + i] = rand() * 0.2;
      }
      count = Math.max(count, from + N);
      pairs.push({ x, y: yS + 9, dx: (rand() - 0.5) * 0.16, dy: 1, g: 1900, a: 8, age: 0, gen: 0, split: false });
      s.rip.push({ x, t: 0 }); s.landed++;
    };

    const step = (dt: number) => {
      const born: Pair[] = [];
      for (const p of pairs) {
        p.age += dt;
        const room = clamp((yF - 26 - p.y) / 60), sp = (p.g / (2 * p.a)) * room;
        p.x += p.dx * sp * dt; p.y += p.dy * sp * dt;
        p.g *= Math.exp(-dt / (p.gen ? 2.3 : 1.9)); p.a += (3.5 + 34 * (1 - room)) * dt;
        const lim = rI(p.y) - p.a - 10; p.x = clamp(p.x, CX - lim, CX + lim);
        if (!p.split && p.gen < 3 && p.age > 0.6 + p.gen * 0.25) {
          p.split = true;
          for (const sgn of [-1, 1]) {
            const turn = sgn * (0.36 + rand() * 0.34), c = Math.cos(turn), sn = Math.sin(turn);
            born.push({ x: p.x - p.dy * p.a * sgn * -1, y: p.y + p.dx * p.a * sgn * -1 + 4, dx: p.dx * c - p.dy * sn, dy: Math.max(0.5, p.dx * sn + p.dy * c), g: p.g * 0.6, a: p.a * 0.6, age: 0, gen: p.gen + 1, split: false });
          }
          p.g *= 0.34;
        }
      }
      pairs = pairs.concat(born).filter((p) => p.g > 6);
      const n = pairs.length, t = s.t;
      for (let i = 0; i < count; i++) {
        const x = px[i], y = py[i];
        const wall = rI(y) - Math.abs(x - CX); // ink is eased off the glass so it never stacks up in a hard line
        let u = 3 * Math.cos(x * 0.021 + t * 0.31) * Math.sin(y * 0.017 - t * 0.2) + (wall < 26 ? (x > CX ? -1 : 1) * (26 - wall) * 0.9 : 0), v = -4 * Math.sin(x * 0.021 + t * 0.31) * Math.cos(y * 0.017 - t * 0.2) + (4 + 30 * ((i * 0.618) % 1) ** 2) * Math.exp(-pa[i] / 9); // ink is heavier than water, and uneven sinking pulls a cloud out into threads
        for (let j = 0; j < n; j++) {
          const p = pairs[j], ox = -p.dy * p.a, oy = p.dx * p.a, core = p.a * p.a * 0.3;
          let ax = x - (p.x + ox), ay = y - (p.y + oy), r2 = ax * ax + ay * ay + core;
          u -= (p.g * ay) / r2; v += (p.g * ax) / r2;
          ax = x - (p.x - ox); ay = y - (p.y - oy); r2 = ax * ax + ay * ay + core;
          u += (p.g * ay) / r2; v -= (p.g * ax) / r2;
        }
        if (s.min) { const ax = x - s.mx, ay = y - s.my, w = Math.exp(-(ax * ax + ay * ay) / 1700); u += s.mvx * w * 0.8; v += s.mvy * w * 0.8; }
        const jit = Math.sqrt(dt) * 3; // a little diffusion, so threads stay threads and do not bead up
        let nx = x + clamp(u, -260, 260) * dt + (Math.random() - 0.5) * jit, ny = y + clamp(v, -260, 260) * dt + (Math.random() - 0.5) * jit;
        ny = clamp(ny, yS + 3, yF + 6);
        const lim = rI(ny) - 5 - (ny > yF - 12 ? (ny - yF + 12) * 1.5 : 0);
        nx = clamp(nx, CX - lim, CX + lim);
        px[i] = nx; py[i] = ny; pa[i] += dt;
      }
    };

    const side = (d: number, y0: number, y1: number, w: number, col: string, dir: number) => {
      ctx.beginPath(); ctx.moveTo(CX + dir * (rO(y0) - d), y0); ctx.lineTo(CX + dir * (rO(y1) - d), y1); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke();
    };

    const draw = () => {
      ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, W, H);
      const lx = s.light * 10, live = 1 - s.clear, tint = s.shown * live, blue = BLUE;
      let g: CanvasGradient;

      // On the table: shade, a contact line, and the bright smear a glass of water throws beside itself.
      const floorY = BOT + RB * ec(BOT) * 0.55;
      ctx.save(); ctx.translate(CX + 40, floorY + 5); ctx.scale(1, 0.2);
      g = ctx.createRadialGradient(0, 0, 10, 0, 0, 250);
      g.addColorStop(0, "rgba(38,54,74,0.42)"); g.addColorStop(0.45, "rgba(38,54,74,0.17)"); g.addColorStop(1, "rgba(38,54,74,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 250, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(CX + 4, floorY + 1); ctx.scale(1, 0.24);
      g = ctx.createRadialGradient(0, 0, RB * 0.6, 0, 0, RB * 1.22);
      g.addColorStop(0, "rgba(24,36,52,0.6)"); g.addColorStop(1, "rgba(24,36,52,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, RB * 1.22, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      for (const [ox, len, al] of [[128, 96, 0.95], [150, 58, 0.6]]) {
        ctx.save(); ctx.translate(CX + ox, floorY + 10); ctx.rotate(-0.04); ctx.scale(1, 0.13);
        g = ctx.createRadialGradient(0, 0, 0, 0, 0, len);
        g.addColorStop(0, mix("#ffffff", blue, tint * 0.8, al)); g.addColorStop(0.4, mix("#ffffff", blue, tint, al * 0.5)); g.addColorStop(1, mix("#ffffff", blue, tint, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, len, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }

      // The far wall.
      slab(ctx, TOP, BOT, rO);
      g = ctx.createLinearGradient(CX - RT, 0, CX + RT, 0);
      g.addColorStop(0, "rgba(96,116,136,0.3)"); g.addColorStop(0.15, "rgba(255,255,255,0.5)"); g.addColorStop(0.5, "rgba(255,255,255,0.24)"); g.addColorStop(0.85, "rgba(226,236,244,0.34)"); g.addColorStop(1, "rgba(90,110,130,0.34)");
      ctx.fillStyle = g; ctx.fill();

      // The water, then the ink in it.
      ctx.save(); slab(ctx, yS, yF, rI); ctx.clip();
      g = ctx.createLinearGradient(CX - RT, 0, CX + RT, 0);
      g.addColorStop(0, "rgba(150,186,206,0.6)"); g.addColorStop(0.2, "rgba(232,244,250,0.5)"); g.addColorStop(0.55, "rgba(246,251,253,0.42)"); g.addColorStop(0.86, "rgba(206,228,240,0.5)"); g.addColorStop(1, "rgba(140,176,198,0.66)");
      ctx.fillStyle = g; ctx.fillRect(CX - RT, yS - 30, RT * 2, yF - yS + 80);
      g = ctx.createLinearGradient(0, yS, 0, yF);
      g.addColorStop(0, mix(INK, "#ffffff", 0.3, tint * 0.3)); g.addColorStop(1, mix(INK, "#ffffff", 0.12, tint * 0.62));
      ctx.fillStyle = g; ctx.fillRect(CX - RT, yS - 30, RT * 2, yF - yS + 80);
      if (ictx && count) {
        ictx.setTransform(kq, 0, 0, kq, 0, 0); ictx.clearRect(0, 0, iW, iH);
        for (let i = 0; i < count; i++) {
          const age = pa[i], r = 2.8 + age * 0.27 + age * age * 0.032, al = Math.min(0.3, 2.6 / (r * r));
          if (al < 0.03) continue; // by now this ink is part of the even tint of the water
          const rr = Math.min(r, 40) * 2.1; ictx.globalAlpha = al; ictx.drawImage(dot, px[i] - iX - rr, py[i] - iY - rr, rr * 2, rr * 2);
          if (i % 6 === 0) { const hr = rr * 2.6; ictx.globalAlpha = clamp(al * 0.3, 0.04, 0.09); ictx.drawImage(dot, px[i] - iX - hr, py[i] - iY - hr, hr * 2, hr * 2); } // a veil of thinner ink round the dense threads
        }
        ctx.globalAlpha = live; ctx.drawImage(ink, iX, iY, iW, iH); ctx.globalAlpha = 1;
      }
      // Water in a round glass: dark where the wall turns away, one soft column of light, deeper toward the floor.
      g = ctx.createLinearGradient(CX - RT, 0, CX + RT, 0);
      g.addColorStop(0, "rgba(30,60,84,0.42)"); g.addColorStop(0.05, "rgba(30,60,84,0.1)"); g.addColorStop(0.1, "rgba(255,255,255,0.3)"); g.addColorStop(0.2, "rgba(255,255,255,0)");
      g.addColorStop(0.8, "rgba(255,255,255,0)"); g.addColorStop(0.9, "rgba(255,255,255,0.22)"); g.addColorStop(0.95, "rgba(30,60,84,0.12)"); g.addColorStop(1, "rgba(30,60,84,0.46)");
      ctx.fillStyle = g; ctx.fillRect(CX - RT, yS - 30, RT * 2, yF - yS + 80);
      g = ctx.createLinearGradient(0, yS, 0, yF + 20);
      g.addColorStop(0, "rgba(255,255,255,0.34)"); g.addColorStop(0.07, "rgba(255,255,255,0)"); g.addColorStop(0.7, "rgba(20,50,80,0)"); g.addColorStop(1, "rgba(20,50,80,0.16)");
      ctx.fillStyle = g; ctx.fillRect(CX - RT, yS - 30, RT * 2, yF - yS + 80);
      ctx.restore();

      // The surface, seen a little from above, with the rings a landing drop sends out.
      const rs = rI(yS), ry = rs * ec(yS);
      ctx.save(); ctx.beginPath(); ctx.ellipse(CX, yS, rs, ry, 0, 0, Math.PI * 2); ctx.clip();
      g = ctx.createLinearGradient(0, yS - ry, 0, yS + ry);
      g.addColorStop(0, mix("#c3d6e2", blue, tint * 0.5, 0.78)); g.addColorStop(0.5, mix("#eef6fa", blue, tint * 0.4, 0.66)); g.addColorStop(1, mix("#ffffff", blue, tint * 0.3, 0.8));
      ctx.fillStyle = g; ctx.fillRect(CX - rs, yS - ry, rs * 2, ry * 2);
      ctx.beginPath(); ctx.ellipse(CX - rs * 0.34 + lx, yS - ry * 0.16, rs * 0.36, ry * 0.3, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fill();
      for (const r of s.rip) for (let j = 0; j < 2; j++) {
        const q = clamp(r.t / 1.3 - j * 0.22); if (q <= 0) continue;
        ctx.beginPath(); ctx.ellipse(r.x, yS + 1, 5 + q * rs * 0.9, (5 + q * rs * 0.9) * ec(yS), 0, 0, Math.PI * 2);
        ctx.lineWidth = 2.2 * (1 - q) + 0.4; ctx.strokeStyle = `rgba(40,70,110,${0.4 * (1 - q)})`; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(r.x, yS + 2.4, 5 + q * rs * 0.9, (5 + q * rs * 0.9) * ec(yS), 0, 0, Math.PI * 2);
        ctx.lineWidth = 1.6 * (1 - q) + 0.3; ctx.strokeStyle = `rgba(255,255,255,${0.85 * (1 - q)})`; ctx.stroke();
      }
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(CX, yS, rs - 0.5, ry - 0.4, 0, 0.04 * Math.PI, 0.96 * Math.PI); ctx.lineWidth = 1.8; ctx.strokeStyle = "rgba(255,255,255,0.95)"; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(CX, yS, rs - 0.5, ry - 0.4, 0, 1.04 * Math.PI, 1.96 * Math.PI); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(70,100,128,0.5)"; ctx.stroke();

      // A drop on its way down.
      const d = s.drop;
      if (d.on) {
        const r = d.on === 1 ? 5.4 * clamp(d.t / 0.42) : 5.4, stretch = d.on === 2 ? 1 + Math.min(0.5, d.v / 1500) : 1.12;
        ctx.beginPath(); ctx.moveTo(d.x, d.y - r * stretch * 1.5);
        ctx.bezierCurveTo(d.x + r * 0.5, d.y - r * 0.7, d.x + r, d.y - r * 0.1, d.x + r, d.y + r * 0.25);
        ctx.arc(d.x, d.y + r * 0.25, r, 0, Math.PI);
        ctx.bezierCurveTo(d.x - r, d.y - r * 0.1, d.x - r * 0.5, d.y - r * 0.7, d.x, d.y - r * stretch * 1.5);
        ctx.fillStyle = mix(INK, "#000000", 0.25); ctx.fill();
        ctx.beginPath(); ctx.ellipse(d.x - r * 0.35, d.y, r * 0.2, r * 0.36, 0.3, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fill();
      }

      // The heavy foot: a lens that picks up the colour of the water above it.
      const rF = rO(yF);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(CX - rF, yF); ctx.lineTo(CX - RB, BOT); ctx.ellipse(CX, BOT, RB, RB * ec(BOT), 0, Math.PI, 0, true); ctx.lineTo(CX + rF, yF);
      ctx.ellipse(CX, yF, rF, rF * ec(yF), 0, 0, Math.PI, false); ctx.closePath(); ctx.clip();
      const mid = mix("#dfeaf1", blue, tint * 0.75, 0.62);
      g = ctx.createLinearGradient(CX - RB, 0, CX + RB, 0);
      g.addColorStop(0, "rgba(54,72,92,0.66)"); g.addColorStop(0.05, "rgba(255,255,255,0.92)"); g.addColorStop(0.15, "rgba(176,196,212,0.55)"); g.addColorStop(0.32, mid);
      g.addColorStop(0.64, mid); g.addColorStop(0.8, "rgba(255,255,255,0.86)"); g.addColorStop(0.92, "rgba(190,208,222,0.6)"); g.addColorStop(1, "rgba(54,72,92,0.7)");
      ctx.fillStyle = g; ctx.fillRect(CX - RT, yF, RT * 2, BASE + 44);
      g = ctx.createLinearGradient(0, yF + 8, 0, BOT + RB * ec(BOT));
      g.addColorStop(0, "rgba(30,50,72,0.3)"); g.addColorStop(0.4, "rgba(30,50,72,0)"); g.addColorStop(0.75, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(255,255,255,0.7)");
      ctx.fillStyle = g; ctx.fillRect(CX - RT, yF, RT * 2, BASE + 44);
      ctx.beginPath(); ctx.ellipse(CX + 20 + lx, BOT - 6, RB * 0.52, RB * ec(BOT) * 0.5, 0, 0.1 * Math.PI, 0.9 * Math.PI); ctx.lineWidth = 3; ctx.strokeStyle = mix("#ffffff", blue, tint * 0.5, 0.9); ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(CX, yF, rF - 1, (rF - 1) * ec(yF), 0, 0.04 * Math.PI, 0.96 * Math.PI); ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(CX, yF + 1.6, rF - 1, (rF - 1) * ec(yF), 0, 0.06 * Math.PI, 0.94 * Math.PI); ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(40,62,86,0.34)"; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(CX, BOT, RB - 0.8, (RB - 0.8) * ec(BOT), 0, 0.03 * Math.PI, 0.97 * Math.PI); ctx.lineWidth = 1.6; ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.stroke();

      // The wall: a dark line at each silhouette, a lit line inside it, and the studio window down the left.
      ctx.lineCap = "round";
      for (const dir of [-1, 1]) {
        side(0.6, TOP, BOT, 1.3, "rgba(52,70,90,0.62)", dir); side(2.6, TOP + 3, BOT - 3, 1.6, "rgba(255,255,255,0.85)", dir); side(WALL + 0.8, TOP + 6, yF - 4, 1, "rgba(44,64,86,0.24)", dir);
      }
      const streak = (d0: number, d1: number, y0: number, y1: number, al: number) => {
        ctx.beginPath(); ctx.moveTo(CX - rO(y0) + d0 + lx, y0); ctx.lineTo(CX - rO(y0) + d1 + lx, y0); ctx.lineTo(CX - rO(y1) + d1 * 0.86 + lx, y1); ctx.lineTo(CX - rO(y1) + d0 * 0.86 + lx, y1); ctx.closePath();
        const q = ctx.createLinearGradient(0, y0, 0, y1);
        q.addColorStop(0, "rgba(255,255,255,0)"); q.addColorStop(0.07, `rgba(255,255,255,${al})`); q.addColorStop(0.5, `rgba(255,255,255,${al * 0.7})`); q.addColorStop(0.93, `rgba(255,255,255,${al * 0.5})`); q.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = q; ctx.fill();
      };
      streak(18, 33, TOP + 16, yF - 10, 0.8); streak(38, 41.5, TOP + 22, yF - 26, 0.46); streak(RT * 2 - 31, RT * 2 - 27, TOP + 18, yF - 14, 0.55);
      streak(RT * 2 - 84, RT * 2 - 50, TOP + 26, TOP + 170, 0.14);
      // The rim.
      ctx.beginPath(); ctx.ellipse(CX, TOP, RT - 0.6, RT * ec(TOP), 0, 0, Math.PI * 2); ctx.lineWidth = 3.4; ctx.strokeStyle = "rgba(240,246,250,0.9)"; ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(60,80,102,0.5)"; ctx.beginPath(); ctx.ellipse(CX, TOP, RT + 1, RT * ec(TOP) + 1, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(CX, TOP, RT - 3.4, RT * ec(TOP) - 2.2, 0, 0, Math.PI * 2); ctx.strokeStyle = "rgba(60,80,102,0.32)"; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(CX, TOP, RT - 0.8, RT * ec(TOP) - 0.2, 0, 1.12 * Math.PI + s.light * 0.2, 1.52 * Math.PI + s.light * 0.2); ctx.lineWidth = 2.4; ctx.strokeStyle = "#ffffff"; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(CX, TOP, RT - 0.8, RT * ec(TOP) - 0.2, 0, 0.2 * Math.PI, 0.44 * Math.PI); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.95)"; ctx.stroke();

      // The glass dropper the ink comes from.
      const x = s.pip, tube = (w0: number, w1: number) => {
        ctx.beginPath(); ctx.moveTo(x - w0, -8); ctx.lineTo(x - w0, 46); ctx.bezierCurveTo(x - w0, 66, x - w1, 70, x - w1, TIP); ctx.lineTo(x + w1, TIP);
        ctx.bezierCurveTo(x + w1, 70, x + w0, 66, x + w0, 46); ctx.lineTo(x + w0, -8); ctx.closePath();
      };
      tube(10.5, 3.2); ctx.fillStyle = "rgba(236,243,248,0.7)"; ctx.fill();
      ctx.save(); tube(8, 1.9); ctx.clip();
      g = ctx.createLinearGradient(x - 7, 0, x + 7, 0);
      g.addColorStop(0, mix(INK, "#000000", 0.45)); g.addColorStop(0.3, mix(INK, "#ffffff", 0.12)); g.addColorStop(1, mix(INK, "#000000", 0.5));
      ctx.fillStyle = g; ctx.fillRect(x - 11, 14 + s.landed * 5 * live, 22, TIP);
      ctx.restore();
      tube(10.5, 3.2); ctx.lineWidth = 1.1; ctx.strokeStyle = "rgba(56,74,96,0.6)"; ctx.stroke();
      g = ctx.createLinearGradient(0, -8, 0, TIP);
      g.addColorStop(0, "rgba(255,255,255,0.9)"); g.addColorStop(0.55, "rgba(255,255,255,0.85)"); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(x - 7.6, -8, 2.6, 60); ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.fillRect(x + 5.8, -8, 1.3, 56);
    };

    let lastPct = -1;
    const say = () => { const p = Math.round(s.shown * (1 - s.clear) * 100); if (p !== lastPct) { lastPct = p; setPct(p); } };
    const release = () => { if (!s.drop.on && s.landed < STEPS && !s.clear) { s.drop.on = 1; s.drop.t = 0; s.drop.x = CX + xs[s.landed % xs.length]; return true; } return false; };
    const tick = (dt: number) => {
      s.t += dt;
      const d = s.drop, goal = CX + xs[s.landed % xs.length];
      s.pip += (goal - s.pip) * Math.min(1, dt * 7);
      if (d.on === 1) { d.t += dt; d.x = s.pip; d.y = TIP + 3 + 5.4 * clamp(d.t / 0.42); if (d.t > 0.5 && Math.abs(goal - s.pip) < 1.5) { d.on = 2; d.v = 40; } }
      else if (d.on === 2) { d.v += 2300 * dt; d.y += d.v * dt; if (d.y > yS - 2) { d.on = 0; land(d.x); s.next = s.t + EVERY; } }
      step(dt);
      for (const r of s.rip) r.t += dt;
      s.rip = s.rip.filter((r) => r.t < 1.6);
      const want = VALUE === null ? s.landed / STEPS : clamp(VALUE);
      s.shown += (want - s.shown) * Math.min(1, dt * 0.9);
      if (Math.abs(want - s.shown) < 0.004) s.shown = want;
      if (VALUE !== null) { if (s.landed < Math.round(clamp(VALUE) * STEPS)) release(); }
      else if (s.clear) {
        s.clear = Math.min(1, s.clear + dt / 1.5);
        if (s.clear >= 1) { count = 0; pairs = []; s.landed = 0; s.shown = 0; s.clear = 0; s.next = s.t + 0.5; }
      } else if (s.landed >= STEPS) { s.held += dt; if (s.held > 4.2) { s.held = 0; s.clear = 0.001; } }
      else if (s.t > s.next) release();
      s.mvx *= Math.exp(-dt * 5); s.mvy *= Math.exp(-dt * 5);
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 5);
    };

    // Start part of the way through, so the first thing anyone sees is ink already in bloom.
    const warm = (drops: number, gap: number, tail: number) => {
      for (let i = 0; i < drops; i++) { land(CX + xs[i % xs.length]); for (let j = 0; j < gap * 30; j++) { s.t += 1 / 30; step(1 / 30); } }
      for (let j = 0; j < tail * 30; j++) { s.t += 1 / 30; step(1 / 30); }
      s.rip = []; s.shown = s.landed / STEPS; s.pip = CX + xs[s.landed % xs.length];
    };
    if (reduce) warm(VALUE === null ? STEPS : Math.round(clamp(VALUE) * STEPS), 1.6, 3);
    else if (VALUE === null) { warm(1, 2.4, 0); warm(1, 1.5, 0); s.next = s.t + 0.15; }

    let raf = 0, last = 0, seen = true;
    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      tick(dt); say(); draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (reduce) { say(); draw(); } else if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
    api.current = {
      add: () => {
        if (VALUE !== null) return;
        if (reduce) { // no animation: each press shows the next still
          if (s.landed >= STEPS) { count = 0; pairs = []; s.landed = 0; s.shown = 0; } else warm(1, 2, 0);
          say(); draw(); return;
        }
        if (s.landed >= STEPS) { if (!s.clear) { s.held = 0; s.clear = 0.001; } } else if (release()) s.next = s.t + EVERY + 1;
        wake();
      },
    };
    fit(); wake();

    const host = cv.parentElement;
    let lt = 0;
    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect(), x = ((e.clientX - b.left) / b.width) * W, y = ((e.clientY - b.top) / b.height) * H, now = performance.now();
      s.lightTo = clamp((x / W) * 2 - 1, -1, 1);
      if (s.min && now - lt < 120) { const dt = Math.max(8, now - lt) / 1000; s.mvx = clamp((x - s.mx) / dt, -420, 420); s.mvy = clamp((y - s.my) / dt, -420, 420); }
      s.mx = x; s.my = y; lt = now; s.min = y > yS && y < yF + 10 && Math.abs(x - CX) < RT;
    };
    const onLeave = () => { s.lightTo = 0; s.min = false; };
    host?.addEventListener("pointermove", onMove); host?.addEventListener("pointerleave", onLeave);
    const ro = new ResizeObserver(() => { fit(); if (reduce) draw(); });
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

  const done = pct >= 100;
  return (
    <div className="flex min-h-[640px] w-full flex-col items-center justify-center bg-[#e3e9ee] bg-[radial-gradient(120%_85%_at_50%_34%,#fbfcfd_0%,#e6ecf1_50%,#c6d0d9_100%)] px-4 py-8 sm:min-h-[760px]">
      <div className="relative w-full" style={{ maxWidth: 640, aspectRatio: `${W} / ${H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <button
          type="button"
          aria-label={done ? "Start again with clean water" : "Add a drop of ink"}
          onClick={() => api.current?.add()}
          className="absolute left-1/2 top-[25%] h-[63%] w-[44%] -translate-x-1/2 cursor-pointer touch-manipulation rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
        />
      </div>
      <div
        role="progressbar"
        aria-label={TASK}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-600"
      >
        <span className="text-slate-900">{done ? DONE : TASK}</span>
        <span aria-hidden="true" className="text-slate-400">/</span>
        <span className="w-[4ch] text-right tabular-nums text-slate-900">{pct}%</span>
      </div>
    </div>
  );
}

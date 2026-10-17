import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here.
const gauge = { label: "Rain collected", unit: "mm" };
const CAPACITY = 50; // what the top line of the printed scale reads
const START = 0.6; // how full it is on load, from 0 to 1
const PER_DROP = 0.0034; // how much each caught drop adds
const EVERY = 0.15; // seconds between drops that land inside the glass
const LOOP = true; // tip itself out a few seconds after it reaches the top line
const WATER = [38, 132, 158]; // red, green and blue of the water

const W = 720, H = 700, CX = 360, GY = 596, HORIZON = 476; // canvas, centre line, table contact, back edge of the table
const HC = 452, R = 70, WALL = 5.5, RI = R - WALL, EL = 0.2, FOOT = 106; // tube height and radius, how flat the ellipses are
const Y0 = -36, Y100 = -404, FLOOR = -30, MID = -HC / 2;
const TAU = Math.PI * 2;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const rgba = (c: number[], m: number, a: number) => `rgba(${(c[0] * m) | 0},${(c[1] * m) | 0},${(c[2] * m) | 0},${a})`;

export default function GlassRainGaugeProgressMeter() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [pct, setPct] = useState(Math.round(START * 100));
  const api = useRef<{ tip: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let k = 1, ox = 0, VW = W, VH = H;
    const fit = () => {
      const cw = cv.clientWidth || W, ch = cv.clientHeight || H, sc = Math.min(cw / 560, (ch - 40) / H), dpr = Math.min(2, window.devicePixelRatio || 1);
      k = sc * dpr; VW = cw / sc; VH = ch / sc; ox = (VW - W) / 2;
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    };
    const rnd = Math.random;
    const s = { p: START, show: START, wob: 0, wobV: 0, th: 0, thV: 0, tipT: -1, area: 0, t: 0, next: 0, full: 0, said: -1 };
    const rain: { x: number; y: number; gy: number; sp: number }[] = [];
    const caught: { x: number; y: number }[] = [];
    const ripples: { x: number; age: number }[] = [];
    const beads: { x: number; y: number; vx: number; vy: number; life: number; r: number }[] = [];
    const bubbles: { x: number; y: number; r: number; ph: number }[] = [];
    const rings: { x: number; y: number; age: number }[] = [];
    const clings = [[-38, -300, 3.4], [22, -352, 2.6], [41, -214, 3], [-14, -420, 2.2], [-46, -150, 2.4], [34, -96, 3.2], [8, -262, 2], [-30, -388, 1.8], [47, -330, 2], [-8, -122, 2.3]].map(([x, y, r]) => ({ x, y, r, v: 0 }));
    let puddle = 0;
    const sow = (d: { x: number; y: number; gy: number; sp: number }, fresh: boolean) => {
      d.x = rnd() * (VW + 200) - 100 - ox; d.y = fresh ? rnd() * VH : -30 - rnd() * 90; d.sp = 760 + rnd() * 380;
      d.gy = HORIZON + 24 + rnd() * rnd() * (VH - HORIZON - 30);
    };
    const pour = () => { for (let i = 0; i < 34 * clamp(VW / W, 1, 2.4); i++) { const d = { x: 0, y: 0, gy: 0, sp: 0 }; sow(d, true); rain.push(d); } };

    const tilted = () => Math.abs(s.th) > 0.004 || s.tipT >= 0;
    const lift = () => Math.sin(clamp(s.th / 2.25, 0, 1) * Math.PI * 0.5) * 78;
    const world = (lx: number, ly: number): [number, number] => {
      const c = Math.cos(s.th), n = Math.sin(s.th), dy = ly - MID;
      return [CX + lx * c - dy * n, GY + MID - lift() + lx * n + dy * c];
    };
    // Area of the tube's inside that lies below a level line, used while the glass is tipped.
    const inside = (): [number, number][] => [world(-RI, FLOOR), world(RI, FLOOR), world(RI, -HC), world(-RI, -HC)];
    const below = (poly: [number, number][], level: number) => {
      const out: [number, number][] = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length], ia = a[1] >= level, ib = b[1] >= level;
        if (ia) out.push(a);
        if (ia !== ib) { const f = (level - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * f, level]); }
      }
      return out;
    };
    const areaOf = (poly: [number, number][]) => { let a = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; };
    const levelFor = (poly: [number, number][], area: number) => {
      let lo = Math.min(...poly.map((p) => p[1])), hi = Math.max(...poly.map((p) => p[1]));
      for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; if (areaOf(below(poly, m)) > area) lo = m; else hi = m; }
      return (lo + hi) / 2;
    };
    const surfaceY = () => Y0 + (Y100 - Y0) * clamp(s.show, 0, 1.02) + s.wob;

    const stage = () => {
      const wall = ctx.createLinearGradient(0, 0, 0, HORIZON);
      wall.addColorStop(0, "#f3f1ec"); wall.addColorStop(1, "#dcd8d0");
      ctx.fillStyle = wall; ctx.fillRect(-ox, 0, VW, HORIZON);
      const table = ctx.createLinearGradient(0, HORIZON, 0, VH);
      table.addColorStop(0, "#c5c0b6"); table.addColorStop(0.12, "#d2cdc4"); table.addColorStop(1, "#b9b3a8");
      ctx.fillStyle = table; ctx.fillRect(-ox, HORIZON, VW, VH - HORIZON);
      const lit = ctx.createRadialGradient(CX - 60, 250, 30, CX - 60, 250, 560);
      lit.addColorStop(0, "rgba(255,255,255,0.5)"); lit.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = lit; ctx.fillRect(-ox, 0, VW, VH);
      // Shadow across the table, with the bright streak a column of water focuses inside it.
      const up = lift() / 78, wet = clamp(s.show, 0, 1) * (1 - up);
      ctx.save(); ctx.translate(CX + 120 + up * 30, GY - 2); ctx.rotate(-0.05); ctx.scale(1, 0.17);
      const sh = ctx.createRadialGradient(-60, 0, 6, 0, 0, 270);
      sh.addColorStop(0, `rgba(52,46,38,${0.5 - 0.24 * up})`); sh.addColorStop(0.5, `rgba(52,46,38,${0.26 - 0.1 * up})`); sh.addColorStop(1, "rgba(52,46,38,0)");
      ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(0, 0, 270, 0, TAU); ctx.fill();
      const ca = ctx.createRadialGradient(20, 0, 1, 20, 0, 130);
      ca.addColorStop(0, `rgba(236,252,255,${0.85 * wet})`); ca.addColorStop(0.35, rgba([150, 214, 226], 1, 0.4 * wet)); ca.addColorStop(1, "rgba(200,240,250,0)");
      ctx.save(); ctx.scale(1, 0.4); ctx.fillStyle = ca; ctx.beginPath(); ctx.arc(20, 0, 130, 0, TAU); ctx.fill(); ctx.restore();
      ctx.restore();
      if (puddle > 0.01) {
        ctx.save(); ctx.translate(CX + 176, GY + 22); ctx.scale(1, 0.2);
        const pg = ctx.createRadialGradient(0, 0, 2, 0, 0, 120 * Math.min(1, puddle + 0.3));
        pg.addColorStop(0, rgba(WATER, 1.3, 0.2 * Math.min(1, puddle))); pg.addColorStop(0.8, rgba(WATER, 0.9, 0.26 * Math.min(1, puddle))); pg.addColorStop(1, rgba(WATER, 0.7, 0));
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(0, 0, 130, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 112 * Math.min(1, puddle + 0.3), Math.PI * 1.05, Math.PI * 1.7); ctx.lineWidth = 9; ctx.strokeStyle = `rgba(255,255,255,${0.3 * Math.min(1, puddle)})`; ctx.stroke(); ctx.restore();
      }
      ctx.lineWidth = 1;
      for (const r of rings) { const a = 1 - r.age / 0.6, rad = 2 + r.age * 30; ctx.beginPath(); ctx.ellipse(r.x, r.y, rad, rad * 0.24, 0, 0, TAU); ctx.strokeStyle = `rgba(70,80,86,${0.34 * a})`; ctx.stroke(); }
    };

    const arc = (y: number, rx: number, a0: number, a1: number) => { ctx.beginPath(); ctx.ellipse(0, y, rx, rx * EL, 0, a0, a1); };
    const glassBack = () => {
      // The foot: a thick moulded disc.
      const fy = -13;
      ctx.beginPath(); ctx.ellipse(0, 0, FOOT, FOOT * EL, 0, 0, Math.PI); ctx.lineTo(-FOOT, fy); ctx.ellipse(0, fy, FOOT, FOOT * EL, 0, Math.PI, 0, true); ctx.closePath();
      const side = ctx.createLinearGradient(-FOOT, 0, FOOT, 0);
      side.addColorStop(0, "rgba(70,96,92,0.75)"); side.addColorStop(0.1, "rgba(214,232,228,0.8)"); side.addColorStop(0.22, "rgba(120,150,145,0.5)"); side.addColorStop(0.6, "rgba(168,196,190,0.42)"); side.addColorStop(0.86, "rgba(236,248,246,0.85)"); side.addColorStop(1, "rgba(60,86,82,0.8)");
      ctx.fillStyle = side; ctx.fill();
      arc(fy, FOOT, 0, TAU);
      const topF = ctx.createLinearGradient(-FOOT, 0, FOOT, 0);
      topF.addColorStop(0, "rgba(150,176,170,0.7)"); topF.addColorStop(0.3, "rgba(236,246,243,0.85)"); topF.addColorStop(0.7, "rgba(196,216,211,0.7)"); topF.addColorStop(1, "rgba(120,148,142,0.75)");
      ctx.fillStyle = topF; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(50,74,70,0.6)"; ctx.stroke();
      arc(0, FOOT, 0.1, Math.PI - 0.1); ctx.lineWidth = 1.4; ctx.strokeStyle = "rgba(34,52,50,0.7)"; ctx.stroke();
      arc(fy + 2.5, FOOT - 1.5, Math.PI * 0.56, Math.PI * 0.9); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.stroke();
      // The tube, seen through from the front: darker where the wall turns edge-on.
      ctx.beginPath(); ctx.moveTo(-R, -HC); ctx.lineTo(-R, -12); ctx.ellipse(0, -12, R, R * EL, 0, Math.PI, 0, true); ctx.lineTo(R, -HC); ctx.closePath();
      const body = ctx.createLinearGradient(-R, 0, R, 0);
      body.addColorStop(0, "rgba(58,84,80,0.62)"); body.addColorStop(0.045, "rgba(120,150,144,0.3)"); body.addColorStop(0.12, "rgba(255,255,255,0.2)"); body.addColorStop(0.5, "rgba(236,244,242,0.1)"); body.addColorStop(0.9, "rgba(170,196,190,0.2)"); body.addColorStop(0.96, "rgba(100,130,124,0.36)"); body.addColorStop(1, "rgba(50,76,72,0.66)");
      ctx.fillStyle = body; ctx.fill();
      // The table shows faintly in the lower part of the glass.
      const room = ctx.createLinearGradient(0, HORIZON - GY - 30, 0, HORIZON - GY + 6);
      room.addColorStop(0, "rgba(120,108,90,0)"); room.addColorStop(1, "rgba(120,108,90,0.13)");
      ctx.fillStyle = room; ctx.fill();
      arc(-HC, R, Math.PI, TAU); ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(70,96,92,0.55)"; ctx.stroke();
      arc(-HC, RI, 0, TAU); ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.fill();
    };

    const waterBody = (path: () => void, x0: number, x1: number, yTop: number, yBot: number) => {
      path();
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, rgba(WATER, 0.55, 0.86)); g.addColorStop(0.14, rgba(WATER, 0.9, 0.66)); g.addColorStop(0.42, rgba(WATER, 1.25, 0.46)); g.addColorStop(0.7, rgba(WATER, 1.5, 0.4)); g.addColorStop(0.88, rgba(WATER, 0.95, 0.62)); g.addColorStop(1, rgba(WATER, 0.5, 0.88));
      ctx.fillStyle = g; ctx.fill();
      path();
      const d = ctx.createLinearGradient(0, yTop, 0, yBot);
      d.addColorStop(0, "rgba(255,255,255,0.1)"); d.addColorStop(0.3, "rgba(0,40,56,0)"); d.addColorStop(1, "rgba(0,40,56,0.3)");
      ctx.fillStyle = d; ctx.fill();
    };

    const waterUpright = () => {
      const ys = surfaceY(), ry = RI * EL;
      const path = () => { ctx.beginPath(); ctx.moveTo(-RI, ys); ctx.lineTo(-RI, FLOOR); ctx.ellipse(0, FLOOR, RI, ry, 0, Math.PI, 0, true); ctx.lineTo(RI, ys); ctx.ellipse(0, ys, RI, ry, 0, 0, Math.PI); ctx.closePath(); };
      waterBody(path, -RI, RI, ys, FLOOR + ry);
      ctx.save(); path(); ctx.clip();
      // Light gathered into a soft column on the far side from the lamp.
      const col = ctx.createLinearGradient(RI * 0.1, 0, RI * 0.8, 0);
      col.addColorStop(0, "rgba(255,255,255,0)"); col.addColorStop(0.5, "rgba(236,252,255,0.3)"); col.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = col; ctx.fillRect(RI * 0.1, ys, RI * 0.7, FLOOR - ys + ry);
      for (const b of bubbles) {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fillStyle = "rgba(255,255,255,0.16)"; ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(240,252,255,0.75)"; ctx.stroke();
        ctx.beginPath(); ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.28, 0, TAU); ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.fill();
      }
      ctx.restore();
      // The surface, seen from a little above, and the meniscus where it climbs the glass.
      arc(ys, RI, 0, TAU);
      const top = ctx.createLinearGradient(0, ys - ry, 0, ys + ry);
      top.addColorStop(0, "rgba(244,250,250,0.97)"); top.addColorStop(0.45, "rgba(206,230,234,0.94)"); top.addColorStop(1, rgba(WATER, 1.25, 0.95));
      ctx.fillStyle = top; ctx.fill();
      ctx.save(); arc(ys, RI, 0, TAU); ctx.clip();
      for (const r of ripples) {
        const a = 1 - r.age / 0.9, rad = 4 + r.age * 74;
        ctx.beginPath(); ctx.ellipse(r.x, ys, rad, rad * EL, 0, 0, TAU); ctx.lineWidth = 1.6; ctx.strokeStyle = `rgba(255,255,255,${0.8 * a})`; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(r.x, ys + 1.6, rad, rad * EL, 0, 0, TAU); ctx.lineWidth = 1; ctx.strokeStyle = rgba(WATER, 0.5, 0.5 * a); ctx.stroke();
      }
      ctx.restore();
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * RI, ys - 5.5); ctx.quadraticCurveTo(sx * (RI - 1.5), ys - 0.5, sx * (RI - 11), ys + 2.6); ctx.lineTo(sx * RI, ys + 3); ctx.closePath(); ctx.fillStyle = rgba(WATER, 0.8, 0.8); ctx.fill(); }
      arc(ys + 1.4, RI - 0.6, 0.06, Math.PI - 0.06); ctx.lineWidth = 2.6; ctx.strokeStyle = rgba(WATER, 0.36, 0.72); ctx.stroke();
      arc(ys - 0.6, RI - 1, 0.2, Math.PI - 0.2); ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.stroke();
      arc(ys, RI - 1, Math.PI + 0.25, TAU - 0.25); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.stroke();
    };

    const glassFront = () => {
      // Solid glass under the water.
      ctx.beginPath(); ctx.moveTo(-RI, FLOOR); ctx.ellipse(0, FLOOR, RI, RI * EL, 0, Math.PI, 0, true); ctx.lineTo(R - 1, -12); ctx.ellipse(0, -12, R - 1, (R - 1) * EL, 0, 0, Math.PI); ctx.closePath();
      const slab = ctx.createLinearGradient(-R, 0, R, 0);
      slab.addColorStop(0, "rgba(40,70,66,0.6)"); slab.addColorStop(0.2, "rgba(226,244,240,0.75)"); slab.addColorStop(0.36, "rgba(120,160,152,0.42)"); slab.addColorStop(0.74, "rgba(176,206,200,0.38)"); slab.addColorStop(0.9, "rgba(240,252,250,0.7)"); slab.addColorStop(1, "rgba(40,70,66,0.6)");
      ctx.fillStyle = slab; ctx.fill();
      arc(FLOOR, RI, 0.05, Math.PI - 0.05); ctx.lineWidth = 1.3; ctx.strokeStyle = "rgba(30,56,54,0.6)"; ctx.stroke();
      arc(FLOOR + 2.4, RI - 3, 0.5, Math.PI - 0.9); ctx.lineWidth = 1.4; ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.stroke();
      // Edges of the tube.
      for (const sx of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(sx * R, -HC); ctx.lineTo(sx * R, -12); ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(38,60,58,0.78)"; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx * RI, -HC + 4); ctx.lineTo(sx * RI, FLOOR); ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(60,86,82,0.34)"; ctx.stroke();
      }
      // The printed scale wraps round the front of the tube, so every tick is a short arc.
      ctx.strokeStyle = "#17324f"; ctx.fillStyle = "#17324f"; ctx.lineCap = "butt";
      ctx.font = '600 15px "Helvetica Neue", Helvetica, Arial, sans-serif'; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      for (let v = 0; v <= CAPACITY; v++) {
        const y = Y0 + ((Y100 - Y0) * v) / CAPACITY, ten = v % 10 === 0, five = v % 5 === 0, a0 = Math.PI / 2 + 0.12;
        arc(y, R, a0, a0 + (ten ? 0.82 : five ? 0.58 : 0.36)); ctx.lineWidth = ten ? 1.9 : 1.1; ctx.stroke();
        if (ten && v) ctx.fillText(String(v), R * 0.08, y + R * EL * 0.98);
      }
      ctx.font = '600 9px "Helvetica Neue", Helvetica, Arial, sans-serif';
      ctx.fillText(gauge.unit.toUpperCase(), R * 0.1, Y100 - 16);
      ctx.fillStyle = "#b3261e"; ctx.fillRect(R * 0.08, Y100 + R * EL - 13, 16, 2);
      // Reflections of a tall window on the left and the room on the right.
      const tall = ctx.createLinearGradient(0, -HC + 14, 0, -24);
      tall.addColorStop(0, "rgba(255,255,255,0)"); tall.addColorStop(0.05, "rgba(255,255,255,0.95)"); tall.addColorStop(0.9, "rgba(255,255,255,0.9)"); tall.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = tall; ctx.fillRect(-R + 9, -HC + 14, 6.5, HC - 38); ctx.globalAlpha = 0.55; ctx.fillRect(-R + 19, -HC + 30, 1.6, HC - 70); ctx.globalAlpha = 1;
      const soft = ctx.createLinearGradient(R - 30, 0, R - 8, 0);
      soft.addColorStop(0, "rgba(255,255,255,0)"); soft.addColorStop(0.6, "rgba(255,255,255,0.42)"); soft.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = soft; ctx.fillRect(R - 30, -HC + 12, 22, HC - 30);
      // Drops clinging to the outside.
      for (const c of clings) {
        ctx.beginPath(); ctx.ellipse(c.x, c.y, c.r, c.r * 1.3, 0, 0, TAU);
        const g = ctx.createRadialGradient(c.x - c.r * 0.3, c.y - c.r * 0.5, 0.2, c.x, c.y, c.r * 1.3);
        g.addColorStop(0, "rgba(255,255,255,0.75)"); g.addColorStop(0.5, "rgba(214,234,236,0.3)"); g.addColorStop(1, "rgba(40,70,74,0.5)");
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(c.x - c.r * 0.32, c.y - c.r * 0.5, c.r * 0.26, 0, TAU); ctx.fillStyle = "#ffffff"; ctx.fill();
        ctx.beginPath(); ctx.ellipse(c.x + c.r * 0.2, c.y + c.r * 0.75, c.r * 0.45, c.r * 0.2, 0, 0, TAU); ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fill();
      }
      // The lip: a rolled rim with one hard glint.
      arc(-HC, R + 2.5, 0, Math.PI); ctx.lineWidth = 6; ctx.strokeStyle = "rgba(150,180,174,0.9)"; ctx.stroke();
      arc(-HC - 1.2, R + 2.5, 0, Math.PI); ctx.lineWidth = 2.2; ctx.strokeStyle = "rgba(250,255,255,0.95)"; ctx.stroke();
      arc(-HC + 3, R + 2.5, 0.05, Math.PI - 0.05); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(34,56,54,0.7)"; ctx.stroke();
      arc(-HC, R + 2.5, Math.PI, TAU); ctx.lineWidth = 2.4; ctx.strokeStyle = "rgba(196,216,212,0.9)"; ctx.stroke();
      arc(-HC - 0.8, R + 2.5, Math.PI * 1.1, Math.PI * 1.42); ctx.lineWidth = 1.6; ctx.strokeStyle = "#ffffff"; ctx.stroke();
    };

    const draw = () => {
      ctx.setTransform(k, 0, 0, k, ox * k, 0);
      stage();
      ctx.beginPath();
      for (const d of rain) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + 2.4, d.y - d.sp * 0.02); }
      ctx.lineWidth = 1; ctx.lineCap = "round"; ctx.strokeStyle = "rgba(70,84,96,0.2)"; ctx.stroke();
      const tip = tilted();
      const frame = () => { const [x, y] = world(0, MID); ctx.translate(x, y); ctx.rotate(s.th); ctx.translate(0, -MID); };
      ctx.save(); frame(); glassBack(); if (!tip) waterUpright(); ctx.restore();
      if (tip && s.area > 40) {
        const poly = below(inside(), levelFor(inside(), s.area));
        if (poly.length > 2) {
          const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]), top = Math.min(...ys);
          waterBody(() => { ctx.beginPath(); poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); }, Math.min(...xs), Math.max(...xs), top, Math.max(...ys));
          const edge = poly.filter((p) => Math.abs(p[1] - top) < 0.5).map((p) => p[0]);
          if (edge.length > 1) { ctx.beginPath(); ctx.moveTo(Math.min(...edge), top); ctx.lineTo(Math.max(...edge), top); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(240,252,255,0.9)"; ctx.stroke(); }
        }
      }
      for (const b of beads) {
        ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r, b.r * (1 + Math.min(0.8, Math.abs(b.vy) * 0.002)), 0, 0, TAU); ctx.fillStyle = rgba(WATER, 1.15, 0.78); ctx.fill();
        ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.34, 0, TAU); ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fill();
      }
      for (const c of caught) {
        const x = CX + c.x;
        ctx.beginPath(); ctx.moveTo(x, c.y - 17); ctx.quadraticCurveTo(x + 3.6, c.y - 2, x, c.y + 3); ctx.quadraticCurveTo(x - 3.6, c.y - 2, x, c.y - 17); ctx.fillStyle = rgba(WATER, 1.0, 0.7); ctx.fill();
        ctx.beginPath(); ctx.arc(x - 0.9, c.y - 2, 0.9, 0, TAU); ctx.fillStyle = "#ffffff"; ctx.fill();
      }
      ctx.save(); frame(); glassFront(); ctx.restore();
    };

    const step = (dt: number) => {
      s.t += dt;
      for (const d of rain) { d.y += d.sp * dt; d.x += 26 * dt; if (d.y >= d.gy) { if (rings.length < 40 && d.gy > HORIZON + 30) rings.push({ x: d.x, y: d.gy, age: 0 }); sow(d, false); } }
      for (let i = rings.length - 1; i >= 0; i--) { rings[i].age += dt; if (rings[i].age > 0.6) rings.splice(i, 1); }
      // Tipping: a spring swings the glass over and back.
      if (s.tipT >= 0) s.tipT += dt;
      const aim = s.tipT >= 0 && s.tipT < 1.9 ? 2.25 : 0;
      s.thV += (38 * (aim - s.th) - 9.6 * s.thV) * dt; s.th += s.thV * dt;
      if (s.tipT > 1.9 && Math.abs(s.th) < 0.004 && Math.abs(s.thV) < 0.02) { s.tipT = -1; s.th = 0; s.thV = 0; s.p = Math.max(0, s.area / (2 * RI) - 6) / (Y0 - Y100); s.show = s.p; s.wobV = 90; s.full = 0; }
      if (tilted()) {
        const poly = inside(), lip = Math.max(poly[2][1], poly[3][1]), lv = levelFor(poly, s.area);
        if (s.area > 0 && lv < lip - 0.5) {
          const out = Math.min(s.area, 46000 * dt); s.area -= out; s.p = Math.max(0, s.area / (2 * RI) - 6) / (Y0 - Y100);
          const at = poly[2][1] > poly[3][1] ? poly[2] : poly[3], ax = Math.sin(s.th), ay = -Math.cos(s.th);
          for (let n = 0; n < 5; n++) beads.push({ x: at[0] - 3 - rnd() * 9, y: at[1] - 2 - rnd() * 7, vx: ax * (50 + rnd() * 90), vy: ay * (50 + rnd() * 90), life: 2, r: 3 + rnd() * 3.4 });
        }
      } else {
        // Rain that lands inside the glass.
        s.next -= dt;
        if (s.next <= 0) { s.next = EVERY * (0.5 + rnd()); caught.push({ x: (rnd() * 2 - 1) * (RI - 10), y: -20 }); }
        if (s.p >= 1) { s.full += dt; if (LOOP && s.full > 3.6) start(); }
      }
      const sy = GY + surfaceY();
      for (let i = caught.length - 1; i >= 0; i--) {
        const c = caught[i]; c.y += 980 * dt;
        if (tilted()) { if (c.y > GY) caught.splice(i, 1); continue; }
        if (c.y >= sy) {
          caught.splice(i, 1);
          s.p = Math.min(1, s.p + PER_DROP); s.wobV += 26;
          ripples.push({ x: c.x, age: 0 });
          for (let n = 0; n < 3; n++) beads.push({ x: CX + c.x + (rnd() - 0.5) * 6, y: sy - 2, vx: (rnd() - 0.5) * 70, vy: -110 - rnd() * 130, life: 0.5, r: 1.1 + rnd() * 1.1 });
          if (bubbles.length < 14) for (let n = 0; n < 2; n++) bubbles.push({ x: c.x + (rnd() - 0.5) * 10, y: surfaceY() + 10 + rnd() * 26, r: 1.2 + rnd() * 1.8, ph: rnd() * 6 });
        }
      }
      s.show += (s.p - s.show) * Math.min(1, dt * 5);
      s.wobV += (-210 * s.wob - 9 * s.wobV) * dt; s.wob += s.wobV * dt;
      for (let i = ripples.length - 1; i >= 0; i--) { ripples[i].age += dt; if (ripples[i].age > 0.9) ripples.splice(i, 1); }
      for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.y -= (38 + b.r * 16) * dt; b.x += Math.sin(s.t * 7 + b.ph) * 12 * dt; if (b.y < surfaceY() + b.r) bubbles.splice(i, 1); }
      for (let i = beads.length - 1; i >= 0; i--) {
        const b = beads[i]; b.vy += 1500 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
        if (b.r > 2.4 && b.y > GY + 16) { puddle = Math.min(1.2, puddle + 0.012); if (rings.length < 50) rings.push({ x: b.x, y: GY + 20, age: 0 }); beads.splice(i, 1); } else if (b.life <= 0 || (b.r <= 2.4 && b.vy > 0 && b.y > sy)) beads.splice(i, 1);
      }
      puddle = Math.max(0, puddle - dt * 0.09);
      // One clinging drop at a time lets go and runs down the outside.
      for (const c of clings) { if (c.v > 0) { c.v = Math.min(150, c.v + 160 * dt); c.y += c.v * dt; if (c.y > -40) { c.y = -HC + 30 + rnd() * 60; c.x = (rnd() * 2 - 1) * (R - 14); c.v = 0; } } else if (rnd() < dt * 0.09) c.v = 6; }
      const now = Math.round(clamp(s.p, 0, 1) * 100);
      if (now !== s.said) { s.said = now; setPct(now); }
    };
    const start = () => {
      if (s.tipT >= 0) return;
      if (reduce) { s.p = s.p > 0.02 ? 0 : START; s.show = s.p; s.full = 0; const now = Math.round(s.p * 100); s.said = now; setPct(now); draw(); return; }
      s.area = 2 * RI * (6 + clamp(s.show, 0, 1) * (Y0 - Y100)); s.tipT = 0; caught.length = 0; ripples.length = 0; bubbles.length = 0; wake();
    };

    let raf = 0, last = 0, seen = true;
    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.034, (now - last) / 1000); last = now;
      step(dt); draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    function wake() { if (reduce) { draw(); return; } if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
    api.current = { tip: start };
    fit(); pour();
    if (!reduce) { for (let i = 0; i < 70; i++) step(1 / 60); s.p = START; s.show = START; } else caught.push({ x: 12, y: 250 }, { x: -20, y: 90 });
    wake();

    const ro = new ResizeObserver(() => { fit(); if (reduce) draw(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const amount = Math.round((pct / 100) * CAPACITY);

  return (
    <div className="relative h-[500px] w-full overflow-hidden bg-[#dcd8d0] sm:h-[740px]">
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <div role="progressbar" aria-label={gauge.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`${amount} of ${CAPACITY} ${gauge.unit}`} className="sr-only" />
      <button
        type="button"
        onClick={() => api.current?.tip()}
        aria-label="Tip the gauge out and start again"
        className="absolute left-1/2 top-[14%] h-[72%] w-[210px] max-w-[52%] -translate-x-1/2 cursor-pointer rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-[#0f6f86] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      />
      <p className="absolute inset-x-0 bottom-5 px-4 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-[#57534b]">
        <span className="text-[#16242b]">{gauge.label} {amount} {gauge.unit}</span>
        <span className="mx-2 text-[#9a958b]">/</span>
        <span className="text-[#0b5f74]">{pct >= 100 ? "Full, tipping out" : `${pct}% of the glass`}</span>
      </p>
    </div>
  );
}

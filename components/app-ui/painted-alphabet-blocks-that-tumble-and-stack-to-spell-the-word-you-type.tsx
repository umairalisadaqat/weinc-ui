import { useEffect, useRef, useState } from "react";

// The first word is on the table when the page loads. The rest play in turn until someone types.
const WORDS = ["PLAYTIME", "HOMEWORK", "NOTEBOOK", "BOOKWORM"];
const MAX = 8; // most blocks on the table: four along the bottom, four on top
const PAINTS = ["#c9402e", "#2c6aa8", "#dfa322", "#3d8a5a", "#d8642b", "#77508f"]; // one milk paint per face
const MAPLE: [number, number, number] = [230, 197, 148];
const DEMO = true; // set to false to stop the self-running words
const LABEL = "Spell a word";

type V3 = [number, number, number];
type Q = [number, number, number, number];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, MAX);
const hash = (x: number, y: number, s: number) => { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); };
const noise = (x: number, y: number, s: number) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
// Quaternions: x is right, y is down, z comes towards you.
const qmul = (a: Q, b: Q): Q => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
const qaxis = (x: number, y: number, z: number, ang: number): Q => { const s = Math.sin(ang / 2); return [x * s, y * s, z * s, Math.cos(ang / 2)]; };
const qrot = (q: Q, v: V3): V3 => {
  const [x, y, z, w] = q, tx = 2 * (y * v[2] - z * v[1]), ty = 2 * (z * v[0] - x * v[2]), tz = 2 * (x * v[1] - y * v[0]);
  return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)];
};
const qslerp = (a: Q, b0: Q, t: number): Q => {
  let d = a[0] * b0[0] + a[1] * b0[1] + a[2] * b0[2] + a[3] * b0[3];
  const b: Q = d < 0 ? [-b0[0], -b0[1], -b0[2], -b0[3]] : b0; d = Math.abs(d);
  let wa = 1 - t, wb = t;
  if (d < 0.9995) { const th = Math.acos(d), s = Math.sin(th); wa = Math.sin((1 - t) * th) / s; wb = Math.sin(t * th) / s; }
  const r: Q = [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb, a[3] * wa + b[3] * wb], l = Math.hypot(r[0], r[1], r[2], r[3]) || 1;
  return [r[0] / l, r[1] / l, r[2] / l, r[3] / l];
};
// The turn that brings each of the six faces round to the front with its letter upright.
const FRONT: Q[] = [[0, 0, 0, 1], qaxis(0, 1, 0, -Math.PI / 2), qaxis(0, 1, 0, Math.PI), qaxis(0, 1, 0, Math.PI / 2), qaxis(1, 0, 0, -Math.PI / 2), qaxis(1, 0, 0, Math.PI / 2)];
const FACES = FRONT.map((q) => { const c: Q = [-q[0], -q[1], -q[2], q[3]]; return { n: qrot(c, [0, 0, 1]), u: qrot(c, [1, 0, 0]), v: qrot(c, [0, 1, 0]) }; });
const TILT = 0.3, CT = Math.cos(TILT), ST = Math.sin(TILT); // how far the camera looks down at the table
const view = (p: V3): V3 => [p[0], p[1] * CT + p[2] * ST, -p[1] * ST + p[2] * CT];
const LIGHT: V3 = [-0.46, -0.76, 0.46];
const T = 192; // face texture size

type Anim = { kind: "hop" | "drop" | "leave"; start: number; dur: number; from: V3; to: V3; qa: Q; qb: Q; spin: number; axis: V3; lift: number };
type Block = { on: boolean; p: V3; q: Q; face: number; chars: string[]; anim: Anim | null; rest: number };

export default function PaintedAlphabetBlocks() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [word, setWord] = useState(WORDS[0]);
  const api = useRef<{ spell: (w: string, fromUser: boolean) => void } | null>(null);

  useEffect(() => {
    const box = wrap.current, cv = canvas.current;
    if (!box || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0, h = 50, ox = 0, oy = 0;
    const soft = document.createElement("canvas"), sx = soft.getContext("2d"); // cast shadows, drawn small and scaled up so they blur
    const SH = 10;

    // Three boards of maple, so neighbouring blocks are not cut from the same stick.
    const boards = [3, 8, 13].map((seed, bi) => {
      const c = document.createElement("canvas"); c.width = c.height = T;
      const x = c.getContext("2d");
      if (!x) return c;
      const im = x.createImageData(T, T);
      for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) {
        const g = bi === 1 ? py : px, a = bi === 1 ? px : py;
        const warp = noise(g * 0.006, a * 0.03, seed) * 6 + noise(g * 0.03, a * 0.12, seed + 3) * 1.1;
        const ring = Math.pow(0.5 + 0.5 * Math.sin((a * 0.16 + warp) * 2.3), 3);
        const fibre = noise(g * 0.06, a * 1.9, seed + 9) - 0.5, tone = noise(g * 0.008, a * 0.02, seed + 5) - 0.5;
        const k = 1 - 0.065 * ring - 0.05 * fibre + 0.07 * tone, i = (py * T + px) * 4;
        im.data[i] = clamp(MAPLE[0] * k + 4 * ring, 0, 255); im.data[i + 1] = clamp(MAPLE[1] * k, 0, 255); im.data[i + 2] = clamp(MAPLE[2] * k - 8 * ring, 0, 255); im.data[i + 3] = 255;
      }
      x.putImageData(im, 0, 0);
      return c;
    });

    // One printed face: raised paint on bare wood, with the chips a few years of play knock out of it.
    const cache = new Map<string, HTMLCanvasElement>();
    const faceTex = (ch: string, paint: string, solid: boolean, board: number) => {
      const key = `${ch}${paint}${solid ? 1 : 0}${board}`, hit = cache.get(key);
      if (hit) return hit;
      const c = document.createElement("canvas"); c.width = c.height = T;
      const p = document.createElement("canvas"); p.width = p.height = T;
      const x = c.getContext("2d"), y = p.getContext("2d");
      cache.set(key, c);
      if (!x || !y) return c;
      const rr = (g: CanvasRenderingContext2D, inset: number, r: number) => { g.beginPath(); if (g.roundRect) g.roundRect(inset, inset, T - inset * 2, T - inset * 2, r); else g.rect(inset, inset, T - inset * 2, T - inset * 2); };
      const seed = ch.charCodeAt(0) + board * 31 + (solid ? 7 : 0);
      y.font = `900 ${T * 0.66}px Georgia, "Times New Roman", serif`; y.textAlign = "center"; y.textBaseline = "alphabetic";
      const m = y.measureText(ch), ty = T / 2 + ((m.actualBoundingBoxAscent || T * 0.45) - (m.actualBoundingBoxDescent || 0)) / 2;
      y.fillStyle = paint; y.strokeStyle = paint;
      if (solid) { rr(y, 15, 9); y.fill(); y.globalCompositeOperation = "destination-out"; y.fillText(ch, T / 2, ty); y.lineWidth = 2.4; rr(y, 25, 5); y.stroke(); }
      else { y.lineWidth = 11; rr(y, 20, 9); y.stroke(); y.fillText(ch, T / 2, ty); }
      // brushed gloss: paint is lighter where the light skims it
      y.globalCompositeOperation = "source-atop";
      const gl = y.createLinearGradient(0, 0, T, T);
      gl.addColorStop(0, "rgba(255,255,255,0.3)"); gl.addColorStop(0.45, "rgba(255,255,255,0.02)"); gl.addColorStop(1, "rgba(0,0,0,0.2)");
      y.fillStyle = gl; y.fillRect(0, 0, T, T);
      for (let i = 0; i < 46; i++) { y.fillStyle = `rgba(${hash(i, 2, seed) > 0.5 ? "255,255,255" : "0,0,0"},0.05)`; y.fillRect(0, hash(i, 1, seed) * T, T, 1 + hash(i, 3, seed) * 3); }
      // chips and scuffs, most of them along the edges where blocks knock together
      y.globalCompositeOperation = "destination-out"; y.fillStyle = "#000";
      for (let i = 0; i < 44; i++) {
        const edge = hash(i, 4, seed) < 0.72, side = Math.floor(hash(i, 5, seed) * 4), along = 14 + hash(i, 6, seed) * (T - 28), off = 14 + hash(i, 7, seed) * 16;
        const cx = edge ? (side === 0 ? off : side === 1 ? T - off : along) : 20 + hash(i, 8, seed) * (T - 40);
        const cy = edge ? (side === 2 ? off : side === 3 ? T - off : along) : 20 + hash(i, 9, seed) * (T - 40);
        const r = 1 + Math.pow(hash(i, 10, seed), 2.4) * (edge ? 7.5 : 4);
        y.beginPath();
        for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2, rad = r * (0.45 + hash(i, 11 + k, seed) * 0.7); if (k === 0) y.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); else y.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
        y.closePath(); y.fill();
      }
      y.lineWidth = 0.9; y.strokeStyle = "rgba(0,0,0,0.55)";
      for (let i = 0; i < 4; i++) { const ax = hash(i, 20, seed) * T, ay = hash(i, 21, seed) * T, ang = hash(i, 22, seed) * 6.3, len = 18 + hash(i, 23, seed) * 46; y.beginPath(); y.moveTo(ax, ay); y.lineTo(ax + Math.cos(ang) * len, ay + Math.sin(ang) * len); y.stroke(); }

      x.save(); rr(x, 1.5, 15); x.clip();
      x.drawImage(boards[board], 0, 0);
      x.save(); x.shadowColor = "rgba(62,32,8,0.6)"; x.shadowBlur = 2.4; x.shadowOffsetX = 1.2; x.shadowOffsetY = 2; x.drawImage(p, 0, 0); x.restore();
      x.globalAlpha = 0.3; x.globalCompositeOperation = "lighter"; x.drawImage(p, -0.9, -1.1); x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; x.drawImage(p, 0, 0);
      // corners worn round and a little darker with handling
      const worn = x.createRadialGradient(T / 2, T / 2, T * 0.42, T / 2, T / 2, T * 0.74);
      worn.addColorStop(0, "rgba(90,50,14,0)"); worn.addColorStop(1, "rgba(90,50,14,0.34)");
      x.fillStyle = worn; x.fillRect(0, 0, T, T);
      x.lineWidth = 3; x.strokeStyle = "rgba(255,246,226,0.55)"; x.beginPath(); x.moveTo(3, T - 16); x.lineTo(3, 16); x.quadraticCurveTo(3, 3, 16, 3); x.lineTo(T - 16, 3); x.stroke();
      x.strokeStyle = "rgba(70,36,8,0.4)"; x.beginPath(); x.moveTo(T - 3, 16); x.lineTo(T - 3, T - 16); x.quadraticCurveTo(T - 3, T - 3, T - 16, T - 3); x.lineTo(16, T - 3); x.stroke();
      x.restore();
      return c;
    };

    const extra = "QXZKJVW5M8R3GH2";
    const blocks: Block[] = Array.from({ length: MAX }, (_, i) => ({ on: false, p: [0, 0, 0], q: [0, 0, 0, 1], face: 0, chars: Array.from({ length: 6 }, (_, f) => extra[(i * 5 + f * 3) % extra.length]), anim: null, rest: 0 }));
    const paintOf = (i: number, f: number) => PAINTS[(i * 2 + f * 5 + (f > 3 ? 1 : 0)) % PAINTS.length];
    let current = "";

    const slots = (n: number) => {
      const bottom = n <= 4 ? n : Math.ceil(n / 2), top = n - bottom, gap = h * 2.2;
      return Array.from({ length: n }, (_, i) => {
        const up = i < top, idx = up ? i : i - top, cnt = up ? top : bottom;
        return { p: [(idx - (cnt - 1) / 2) * gap + (hash(i, 3, 1) - 0.5) * 0.1 * h, up ? -3 * h : -h, (hash(i, 5, 2) - 0.5) * (up ? 0.16 : 0.36) * h] as V3, yaw: (hash(i, 7, 3) - 0.5) * (up ? 0.3 : 0.2) };
      });
    };
    const hidden = (b: Block, yaw: Q) => { let best = 0, by = -9; FACES.forEach((f, g) => { const y = qrot(qmul(yaw, FRONT[b.face]), f.n)[1]; if (y > by) { by = y; best = g; } }); return best; };

    const spell = (next: string, now: number, instant: boolean) => {
      const S = slots(next.length);
      blocks.forEach((b, i) => {
        if (i < next.length) {
          const s = S[i], yaw = qaxis(0, 1, 0, s.yaw);
          if (!b.on) {
            b.on = true; b.chars[b.face] = next[i]; b.rest = s.p[1];
            const qb = qmul(yaw, FRONT[b.face]);
            if (instant) { b.p = s.p; b.q = qb; b.anim = null; return; }
            const ax: V3 = [hash(i, 1, now) - 0.5, hash(i, 2, now) - 0.5, hash(i, 3, now) - 0.2], l = Math.hypot(ax[0], ax[1], ax[2]) || 1;
            b.p = [s.p[0] + (hash(i, 4, now) - 0.5) * h, -(oy + 3 * h) / CT, s.p[2]]; b.q = qb;
            b.anim = { kind: "drop", start: now + 0.16 + i * 0.09, dur: 0.95, from: b.p, to: s.p, qa: qb, qb, spin: 2.2 + hash(i, 5, now), axis: [ax[0] / l, ax[1] / l, ax[2] / l], lift: 0 };
          } else {
            const changed = b.chars[b.face] !== next[i], moved = Math.hypot(b.p[0] - s.p[0], b.p[1] - s.p[1]) > 1;
            if (!changed && !moved && !b.anim) return;
            if (changed) { const g = hidden(b, yaw); b.chars[g] = next[i]; b.face = g; }
            const qb = qmul(yaw, FRONT[b.face]); b.rest = s.p[1];
            if (instant) { b.p = s.p; b.q = qb; b.anim = null; return; }
            b.anim = { kind: "hop", start: now + (s.p[1] < -2 * h ? 0.2 : 0) + i * 0.06, dur: 0.72, from: b.p, to: s.p, qa: b.q, qb, spin: 0, axis: [1, 0, 0], lift: h * (1.2 + (i % 3) * 0.3) + Math.abs(b.p[0] - s.p[0]) * 0.18 };
          }
        } else if (b.on) {
          if (instant) { b.on = false; b.anim = null; return; }
          b.anim = { kind: "leave", start: now + (MAX - i) * 0.04, dur: 0.85, from: b.p, to: [W / 2 + 3 * h, -h, b.p[2] + h], qa: b.q, qb: b.q, spin: 0, axis: [0, 0, 1], lift: h * 1.3 };
        }
      });
      current = next;
    };

    const advance = (b: Block, now: number) => {
      const a = b.anim;
      if (!a) return;
      const u = clamp((now - a.start) / a.dur, 0, 1);
      if (u <= 0) return;
      const mixp = (e: number): V3 => [a.from[0] + (a.to[0] - a.from[0]) * e, a.from[1] + (a.to[1] - a.from[1]) * e, a.from[2] + (a.to[2] - a.from[2]) * e];
      let rock = 0;
      if (a.kind === "hop") {
        const k = Math.min(1, u / 0.78), e = k * k * (3 - 2 * k), w = (u - 0.78) / 0.22;
        b.p = mixp(e); b.p[1] -= a.lift * 4 * k * (1 - k);
        if (u > 0.78) { b.p[1] = a.to[1] - 0.12 * h * Math.sin(Math.PI * w); rock = 0.05 * Math.sin(Math.PI * 2 * w) * (1 - w); }
        b.q = qmul(qslerp(a.qa, a.qb, e), qaxis(a.axis[0], a.axis[1], a.axis[2], Math.PI * 2 * a.spin * (1 - e)));
      } else if (a.kind === "drop") {
        const k = Math.min(1, u / 0.56);
        b.p = mixp(k); b.p[1] = a.from[1] + (a.to[1] - a.from[1]) * k * k;
        if (u > 0.56 && u <= 0.84) { const w = (u - 0.56) / 0.28; b.p[1] = a.to[1] - 0.5 * h * 4 * w * (1 - w); rock = 0.1 * Math.sin(Math.PI * 2 * w); }
        if (u > 0.84) { const w = (u - 0.84) / 0.16; b.p[1] = a.to[1] - 0.1 * h * 4 * w * (1 - w); rock = -0.03 * Math.sin(Math.PI * 2 * w); }
        b.q = qmul(a.qb, qaxis(a.axis[0], a.axis[1], a.axis[2], a.spin * Math.PI * (1 - k) * (1 - k * 0.3)));
      } else {
        const e = u * u;
        b.p = mixp(e); b.p[1] = a.from[1] + (a.to[1] - a.from[1]) * Math.min(1, u * 1.6) - a.lift * Math.sin(Math.PI * Math.min(1, u * 1.5)) * (1 - u * 0.4);
        b.q = qmul(qaxis(0, 0, 1, Math.PI * 3 * e), a.qa);
      }
      if (rock) b.q = qmul(qaxis(0, 0, 1, rock), b.q);
      if (u >= 1) { if (a.kind === "leave") b.on = false; else { b.p = a.to; b.q = a.qb; } b.anim = null; }
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const live = blocks.map((b, i) => ({ b, i, c: view(b.p) })).filter((o) => o.b.on).sort((m, n) => m.c[2] - n.c[2]);
      // cast shadows: every corner slides down the light onto the table
      if (sx) {
        sx.setTransform(1, 0, 0, 1, 0, 0); sx.clearRect(0, 0, soft.width, soft.height);
        for (const { b } of live) for (const f of FACES) {
          // a block high in the air throws a weaker shadow
          sx.fillStyle = `rgba(42,28,12,${clamp(1.1 - (b.rest - b.p[1]) / (h * 3.4), 0, 1)})`; sx.beginPath();
          [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([su, sv], k) => {
            const l = qrot(b.q, [(f.n[0] + f.u[0] * su + f.v[0] * sv) * h, (f.n[1] + f.u[1] * su + f.v[1] * sv) * h, (f.n[2] + f.u[2] * su + f.v[2] * sv) * h]);
            const py = Math.min(0, b.p[1] + l[1]), s = view([b.p[0] + l[0] - py * (0.27 - sway * 0.5), 0, b.p[2] + l[2] - py * 0.3]);
            const X = (ox + s[0]) / SH, Y = (oy + s[1]) / SH;
            if (k === 0) sx.moveTo(X, Y); else sx.lineTo(X, Y);
          });
          sx.closePath(); sx.fill();
        }
        ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.globalAlpha = 0.085;
        ctx.drawImage(soft, -3, -2, W + 6, H + 4); ctx.drawImage(soft, 3, 2, W - 6, H - 4); ctx.drawImage(soft, 0, 0, W, H); ctx.restore();
      }
      for (const { b, i, c } of live) {
        // where a block touches what is under it, the light cannot get in
        const base = view([b.p[0], b.p[1] + h, b.p[2]]), near = clamp(1 - (b.rest - b.p[1]) / (h * 1.6), 0, 1);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (near > 0.02) {
          ctx.save(); ctx.translate(ox + base[0], oy + base[1] + h * 0.06); ctx.scale(1, 0.36);
          const reach = b.rest < -1.5 * h ? h * 1.04 : h * 1.5, g = ctx.createRadialGradient(0, 0, h * 0.5, 0, 0, reach);
          g.addColorStop(0, `rgba(48,28,8,${0.6 * near})`); g.addColorStop(1, "rgba(48,28,8,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, reach, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
        FACES.forEach((f, fi) => {
          const nw = qrot(b.q, f.n), n = view(nw);
          if (n[2] <= 0.004) return;
          const u = view(qrot(b.q, f.u)), v = view(qrot(b.q, f.v)), k = (2 * h) / T;
          ctx.setTransform(dpr * u[0] * k, dpr * u[1] * k, dpr * v[0] * k, dpr * v[1] * k, dpr * (ox + c[0] + h * (n[0] - u[0] - v[0])), dpr * (oy + c[1] + h * (n[1] - u[1] - v[1])));
          ctx.fillStyle = "#b98d55"; ctx.fillRect(0, 0, T, T);
          ctx.drawImage(faceTex(b.chars[fi], paintOf(i, fi), (i + fi) % 3 === 1, (i + (fi >> 1)) % 3), 0, 0);
          const d = (nw[0] * (LIGHT[0] + sway) + nw[1] * LIGHT[1] + nw[2] * LIGHT[2]) - 0.46;
          ctx.fillStyle = d > 0 ? `rgba(255,248,232,${Math.min(0.3, d * 0.5)})` : `rgba(36,18,4,${Math.min(0.55, -d * 0.5)})`;
          ctx.fillRect(0, 0, T, T);
        });
      }
    };

    let sway = 0;
    let raf = 0, seen = true, touched = -1e9, nextDemo = 4.6, demoAt = 0, t0 = 0, greeted = false;
    const clock = () => performance.now() / 1000;
    const frame = () => {
      raf = 0;
      const now = clock();
      if (!t0) t0 = now;
      const t = now - t0;
      if (!greeted && t > 2.7) { greeted = true; flip(1, now); }
      sway = Math.sin(t / 1.7) * 0.22;
      if (DEMO && now - touched > 1e8 && t > nextDemo) { demoAt = (demoAt + 1) % WORDS.length; const w = clean(WORDS[demoAt]); spell(w, now, false); setWord(w); nextDemo = t + 3.4; }
      blocks.forEach((b) => advance(b, now));
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) raf = requestAnimationFrame(frame); };
    const flip = (i: number, now: number) => {
      const b = blocks[i];
      if (!b || !b.on || b.anim) return;
      const ax: V3 = hash(i, now, 4) > 0.5 ? [1, 0, 0] : [0, 1, 0];
      b.anim = { kind: "hop", start: now, dur: 0.8, from: b.p, to: [b.p[0], b.rest, b.p[2]], qa: b.q, qb: b.q, spin: hash(i, now, 5) > 0.5 ? 1 : -1, axis: ax, lift: h * 1.5 };
    };

    const layout = () => {
      W = box.clientWidth; H = W < 560 ? 330 : 480;
      h = Math.min(60, (W - 28) / 10); ox = W / 2 - h * 0.3; oy = H - (W < 560 ? 56 : 78);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = `${H}px`;
      soft.width = Math.ceil(W / SH); soft.height = Math.ceil(H / SH);
    };
    layout();
    spell(clean(WORDS[0]), clock(), true);
    api.current = { spell: (w, fromUser) => { if (fromUser) touched = clock() + 1e9; if (w === current) return; spell(w, clock(), reduce); if (reduce) draw(); else wake(); } };
    if (reduce) draw(); else wake();

    const onDown = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect(), px = e.clientX - r.left - ox, py = e.clientY - r.top - oy;
      let pick = -1, depth = -1e9;
      blocks.forEach((b, i) => { const c = view(b.p); if (b.on && Math.abs(c[0] - px) < h && Math.abs(c[1] - py) < h && c[2] > depth) { depth = c[2]; pick = i; } });
      if (pick >= 0 && !reduce) { flip(pick, clock()); wake(); }
    };
    cv.addEventListener("pointerdown", onDown);
    let lastW = W;
    const ro = new ResizeObserver(() => { if (box.clientWidth !== lastW) { lastW = box.clientWidth; layout(); spell(current, clock(), true); blocks.forEach((b, i) => { if (i >= current.length) b.on = false; }); draw(); } });
    ro.observe(box);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      cv.removeEventListener("pointerdown", onDown);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const type = (raw: string) => { const w = clean(raw); setWord(w); api.current?.spell(w, true); };

  return (
    <div className="flex min-h-[620px] w-full flex-col items-center justify-center bg-[#ece2cf] bg-[radial-gradient(90%_70%_at_44%_38%,#f8f1e3_0%,#ece2cf_56%,#ddd0b8_100%)] px-3 py-10 sm:min-h-[720px] sm:px-8">
      <div ref={wrap} className="w-full max-w-[760px]">
        <canvas ref={canvas} aria-hidden="true" className="block w-full cursor-pointer touch-manipulation select-none" />
      </div>
      <div className="mt-2 flex flex-col items-center">
        <label htmlFor="alphabet-blocks-word" className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-600">
          {LABEL}
        </label>
        <input
          id="alphabet-blocks-word"
          type="text"
          value={word}
          maxLength={MAX}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          onChange={(e) => type(e.target.value)}
          onFocus={() => api.current?.spell(word, true)}
          placeholder="Up to 8 letters"
          className="mt-3 h-12 w-[264px] max-w-full rounded-full border border-stone-400/70 bg-[#fbf7ee] pl-[0.34em] text-center font-mono text-lg font-semibold uppercase tracking-[0.34em] text-stone-900 shadow-[inset_0_2px_4px_rgba(90,60,20,0.14)] outline-none placeholder:text-[11px] placeholder:font-medium placeholder:tracking-[0.18em] placeholder:text-stone-500 focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 focus-visible:ring-offset-[#ece2cf]"
        />
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-stone-600">Tap a block to toss it</p>
      </div>
    </div>
  );
}

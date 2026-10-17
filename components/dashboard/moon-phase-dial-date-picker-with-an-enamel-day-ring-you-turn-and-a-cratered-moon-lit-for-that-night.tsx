import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

const CAPTION = "Night paddle on Loch Arden"; // the small line above the dial
const HOUR = 21; // the moon is drawn as it stands at this hour of the chosen evening
const AUTOPLAY = true; // step through a few nights until the dial is first touched
const BRIGHT = 0.3; // the dial opens on the next evening this far into the lunar month (0 new, 0.5 full)

const SIZE = 560, C = 280, MR = 140;
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY = 864e5, SYNODIC = 29.530588853, NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const mod = (a: number, n: number) => ((a % n) + n) % n;
const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const plus = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
// Fraction of the lunar month that has passed at HOUR on a date: 0 is new, 0.5 is full.
const lunar = (d: Date, extra = 0) => mod((new Date(d.getFullYear(), d.getMonth(), d.getDate(), HOUR).getTime() + extra * DAY - NEW_MOON) / DAY, SYNODIC) / SYNODIC;
const phaseName = (f: number) => f < 0.02 || f > 0.98 ? "New moon" : f < 0.23 ? "Waxing crescent" : f < 0.27 ? "First quarter" : f < 0.48 ? "Waxing gibbous" : f < 0.52 ? "Full moon" : f < 0.73 ? "Waning gibbous" : f < 0.77 ? "Last quarter" : "Waning crescent";
const litPart = (f: number) => Math.round(((1 - Math.cos(f * Math.PI * 2)) / 2) * 100);

export default function MoonPhaseDialDatePicker() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pad = useRef<HTMLDivElement>(null);
  const [today] = useState(() => midnight(new Date()));
  const [first] = useState(() => { for (let k = 0; k < 30; k++) { const f = lunar(plus(today, k)); if (f >= BRIGHT && f < BRIGHT + 0.07) return k; } return 0; });
  const [off, setOff] = useState(first); // chosen date, in days from today
  const offRef = useRef(first);
  const api = useRef<{ go: (d: number) => void; aim: () => number } | null>(null);

  useEffect(() => {
    const cv = canvas.current, el = pad.current;
    if (!cv || !el) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = SIZE * dpr; cv.height = SIZE * dpr;
    const TAU = Math.PI * 2, LIGHT = -2.2;
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    const ramp = (stops: number[][]) => (v: number, a = 1) => {
      const x = clamp(v) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(x)), f = x - i, p = stops[i], q = stops[i + 1];
      return `rgba(${(p[0] + (q[0] - p[0]) * f) | 0},${(p[1] + (q[1] - p[1]) * f) | 0},${(p[2] + (q[2] - p[2]) * f) | 0},${a})`;
    };
    const steel = ramp([[30, 34, 44], [96, 102, 114], [168, 172, 180], [222, 225, 230], [255, 255, 255]]);
    const gilt = ramp([[44, 26, 8], [122, 80, 30], [198, 148, 70], [240, 204, 132], [255, 246, 222]]);
    const BANDS: [number, number][] = [[0, 1], [0.03, 0.96], [0.085, 0.6], [0.16, 0.3], [0.23, 0.1], [0.31, 0.24], [0.4, 0.52], [0.455, 0.76], [0.5, 0.94], [0.54, 0.72], [0.6, 0.44], [0.69, 0.14], [0.76, 0.3], [0.84, 0.42], [0.92, 0.72], [0.97, 0.95], [1, 1]];
    const sheen = (x: CanvasRenderingContext2D, ang: number, lo: number, hi: number, col: (v: number, a?: number) => string) => {
      if (typeof x.createConicGradient !== "function") return col((lo + hi) / 2);
      const g = x.createConicGradient(ang, C, C);
      for (const [p, v] of BANDS) g.addColorStop(p, col(lo + (hi - lo) * v));
      return g;
    };
    const layer = () => { const c = document.createElement("canvas"); c.width = SIZE * dpr; c.height = SIZE * dpr; const x = c.getContext("2d")!; x.scale(dpr, dpr); return { c, x }; };
    const band = (x: CanvasRenderingContext2D, r0: number, r1: number) => { x.beginPath(); x.arc(C, C, r1, 0, TAU); x.arc(C, C, r0, 0, TAU, true); };
    const ringLine = (x: CanvasRenderingContext2D, r: number, w: number, col: string) => { x.beginPath(); x.arc(C, C, r, 0, TAU); x.lineWidth = w; x.strokeStyle = col; x.stroke(); };
    let seed = 23;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // ---- The moon's surface: a height map with maria, craters and one rayed crater, made once.
    const res = Math.round(MR * 2 * dpr), half = res / 2;
    const moon = document.createElement("canvas"); moon.width = res; moon.height = res;
    const mx = moon.getContext("2d")!, img = mx.createImageData(res, res);
    const H = new Float32Array(res * res), AL = new Float32Array(res * res), NX = new Float32Array(res * res), NZ = new Float32Array(res * res), EDGE = new Float32Array(res * res);
    const hash = (i: number, j: number) => { const n = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return n - Math.floor(n); };
    const noise = (x: number, y: number) => {
      const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v);
      return hash(i, j) * (1 - a) * (1 - b) + hash(i + 1, j) * a * (1 - b) + hash(i, j + 1) * (1 - a) * b + hash(i + 1, j + 1) * a * b;
    };
    const fbm = (x: number, y: number) => noise(x, y) * 0.5 + noise(x * 2.03, y * 2.03) * 0.25 + noise(x * 4.1, y * 4.1) * 0.125 + noise(x * 8.2, y * 8.2) * 0.0625;
    const inside: number[] = [];
    for (let py = 0; py < res; py++) for (let px = 0; px < res; px++) {
      const x = (px + 0.5 - half) / half, y = (py + 0.5 - half) / half, d = Math.sqrt(x * x + y * y), j = py * res + px;
      if (d > 1) continue;
      inside.push(j); EDGE[j] = clamp((1 - d) * half * 0.9);
      const z = Math.sqrt(1 - d * d);
      // maria: dark plains with ragged shores
      const wx = x + (noise(x * 3 + 5, y * 3) - 0.5) * 0.5, wy = y + (noise(x * 3, y * 3 + 9) - 0.5) * 0.5;
      const m = fbm(wx * 2.7 + z * 0.5 + 3.1, wy * 2.7 + 7.4) - 0.07 * (x * 0.4 + y);
      const mare = clamp((m - 0.5) / 0.075);
      AL[j] = (0.86 + (fbm(x * 11 + 20, y * 11) - 0.47) * 0.34 + (noise(x * 60, y * 60) - 0.5) * 0.07) * (1 - mare * 0.47);
      H[j] = ((fbm(x * 22, y * 22 + 40) - 0.47) * 0.011 + (noise(x * 70, y * 70) - 0.5) * 0.0022) * (1 - mare * 0.8);
    }
    // One crater: a flat floor, a steep wall and a thin raised lip. `glow` adds a pale apron, `rays` long streaks.
    const stamp = (cx: number, cy: number, rc: number, glow: number, rays: boolean) => {
      const cz = Math.sqrt(Math.max(0, 1 - cx * cx - cy * cy)), reach = rays ? 0.8 : rc * (glow ? 3.2 : 1.5);
      const x0 = Math.max(0, Math.floor((cx - reach) * half + half)), x1 = Math.min(res - 1, Math.ceil((cx + reach) * half + half));
      const y0 = Math.max(0, Math.floor((cy - reach) * half + half)), y1 = Math.min(res - 1, Math.ceil((cy + reach) * half + half));
      const depth = rc * 0.2, rim = rc * 0.05;
      for (let py = y0; py <= y1; py++) for (let px = x0; px <= x1; px++) {
        const x = (px + 0.5 - half) / half, y = (py + 0.5 - half) / half, d2 = x * x + y * y;
        if (d2 >= 1) continue;
        const z = Math.sqrt(1 - d2), dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2), t = dist / rc, j = py * res + px;
        if (t < 1.5) {
          const w = clamp((t - 0.5) / 0.5), wall = w * w * (3 - 2 * w);
          H[j] = H[j] * (t < 1 ? 0.3 + 0.7 * wall : 1) - depth * (1 - wall) + rim * Math.exp(-(((t - 1) / 0.16) ** 2));
        }
        if (glow && t < 3.2) AL[j] = Math.min(1.08, AL[j] + glow * Math.exp(-((t / 1.5) ** 2)));
        if (rays && t > 1) {
          const ang = Math.atan2(y - cy, x - cx), streak = Math.pow(Math.max(0, noise(ang * 6 + 9, 3.3) - 0.3) / 0.7, 2);
          AL[j] = Math.min(1.08, AL[j] + 0.4 * streak * Math.exp(-dist / 0.34));
        }
      }
    };
    for (let k = 0; k < 620; k++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * 0.985, cx = Math.cos(a) * d, cy = Math.sin(a) * d, rc = 0.006 + 0.062 * Math.pow(rand(), 5);
      const j = Math.floor(cy * half + half) * res + Math.floor(cx * half + half);
      if (AL[j] < 0.6 && rand() < 0.72) continue; // the plains keep fewer craters
      stamp(cx, cy, rc, rc < 0.014 && rand() < 0.22 ? 0.16 : 0, false);
    }
    stamp(-0.1, 0.68, 0.036, 0.22, true); stamp(-0.42, -0.2, 0.03, 0.2, true);
    stamp(0.36, -0.34, 0.058, 0, false); stamp(-0.6, 0.3, 0.07, 0, false); stamp(0.2, 0.42, 0.05, 0, false);
    for (const j of inside) {
      const px = j % res, py = (j / res) | 0, x = (px + 0.5 - half) / half, y = (py + 0.5 - half) / half, z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
      const hx = (H[j + 1] - H[j - 1]) * (res / 4), hy = (H[j + res] - H[j - res]) * (res / 4);
      const nx = x - hx * 1.25, ny = y - hy * 1.25, len = Math.sqrt(nx * nx + ny * ny + z * z) || 1;
      NX[j] = nx / len; NZ[j] = z / len;
    }
    const TONE = new Float32Array(1025); for (let i = 0; i <= 1024; i++) TONE[i] = Math.pow(i / 1024, 0.5);
    let shaded = -1;
    const shadeMoon = (f: number) => {
      if (Math.abs(f - shaded) < 0.0004) return;
      shaded = f;
      const e = f * TAU, lx = Math.sin(e), lz = -Math.cos(e), px = img.data;
      for (const j of inside) {
        const dot = NX[j] * lx + NZ[j] * lz, a = AL[j], v = dot > 0 ? TONE[Math.min(1024, (dot * 1024) | 0)] * a : 0, q = j * 4;
        px[q] = Math.min(255, v * 292 + a * 9); px[q + 1] = Math.min(255, v * 284 + a * 12); px[q + 2] = Math.min(255, v * 270 + a * 19); px[q + 3] = EDGE[j] * 255;
      }
      mx.putImageData(img, 0, 0);
    };

    // ---- Fixed parts: steel bezel, gilt inner ring, the night behind the moon.
    const base = layer();
    {
      const x = base.x;
      band(x, 0, 274); x.fillStyle = "#14161b"; x.fill();
      band(x, 247, 273.5); x.fillStyle = sheen(x, LIGHT, 0.1, 1, steel); x.fill();
      band(x, 252, 266); x.fillStyle = sheen(x, LIGHT + 0.45, 0.04, 0.96, steel); x.fill();
      for (let r = 252.6; r < 266; r += 0.7) { const v = rand(); ringLine(x, r, 0.5, v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.24})` : `rgba(10,14,24,${(0.5 - v) * 0.26})`); }
      for (let k = 0; k < 200; k++) { const a = (k / 200) * TAU, sn = Math.sin(a), cs = Math.cos(a); x.beginPath(); x.moveTo(C + sn * 267.4, C - cs * 267.4); x.lineTo(C + sn * 273.5, C - cs * 273.5); x.lineWidth = 1.3; x.strokeStyle = "rgba(8,10,16,0.5)"; x.stroke(); }
      ringLine(x, 252, 0.9, "rgba(8,10,16,0.75)"); ringLine(x, 266.6, 0.9, "rgba(8,10,16,0.8)"); ringLine(x, 253, 0.7, "rgba(255,255,255,0.4)"); ringLine(x, 247.4, 1, "rgba(0,0,0,0.85)"); ringLine(x, 273.6, 1, "rgba(0,0,0,0.85)");
      // night sky and its stars
      const sky = x.createRadialGradient(C, C, 40, C, C, 182);
      sky.addColorStop(0, "#0d1730"); sky.addColorStop(0.7, "#070c1c"); sky.addColorStop(1, "#02040a");
      band(x, 0, 181); x.fillStyle = sky; x.fill();
      for (let k = 0; k < 90; k++) { const a = rand() * TAU, r = MR + 7 + rand() * (176 - MR - 9), s = 0.35 + Math.pow(rand(), 3) * 1.1; x.beginPath(); x.arc(C + Math.cos(a) * r, C + Math.sin(a) * r, s, 0, TAU); x.fillStyle = `rgba(${220 + rand() * 35},${225 + rand() * 30},255,${0.35 + rand() * 0.6})`; x.fill(); }
      // gilt ring round the opening
      band(x, 179, 190.5); x.fillStyle = sheen(x, LIGHT, 0.12, 1, gilt); x.fill();
      band(x, 182, 187.5); x.fillStyle = sheen(x, LIGHT + 0.7, 0.3, 0.95, gilt); x.fill();
      ringLine(x, 179.3, 0.9, "rgba(0,0,0,0.85)"); ringLine(x, 190.3, 0.9, "rgba(0,0,0,0.8)"); ringLine(x, 182, 0.6, "rgba(40,20,0,0.7)"); ringLine(x, 187.5, 0.6, "rgba(40,20,0,0.7)");
    }
    // ---- Fixed light over everything: enamel gloss, shadows thrown by the raised rings, the crystal.
    const over = layer();
    {
      const x = over.x;
      // A soft streak of reflected light, made from a shadow so it works where canvas filters do not.
      const glint = (r: number, a0: number, a1: number, w: number, blur: number, col: string) => {
        x.save(); x.shadowColor = col; x.shadowBlur = blur * dpr; x.shadowOffsetX = 3000 * dpr; x.lineCap = "round";
        x.beginPath(); x.arc(C - 3000, C, r, a0, a1); x.lineWidth = w; x.strokeStyle = "#000"; x.stroke(); x.restore();
      };
      x.save(); band(x, 190.5, 247); x.clip();
      // sunburst: the engine-turned metal under the enamel throws bright wedges that stay with the lamp
      if (typeof x.createConicGradient === "function") {
        const burst = x.createConicGradient(LIGHT + 0.25, C, C);
        for (const [p, v] of BANDS) burst.addColorStop(p, `rgba(120,165,255,${(v * v * 0.55).toFixed(3)})`);
        x.fillStyle = burst; x.fillRect(0, 0, SIZE, SIZE);
      }
      const lip = x.createRadialGradient(C, C, 190, C, C, 247);
      lip.addColorStop(0, "rgba(0,0,10,0.6)"); lip.addColorStop(0.12, "rgba(0,0,10,0)"); lip.addColorStop(0.84, "rgba(0,0,10,0)"); lip.addColorStop(1, "rgba(0,0,10,0.75)");
      x.fillStyle = lip; x.fillRect(0, 0, SIZE, SIZE);
      glint(241, -2.95, -1.72, 1.6, 2.5, "rgba(255,255,255,0.55)");
      glint(197, 0.5, 1.2, 2, 3, "rgba(255,255,255,0.3)");
      x.restore();
      x.save(); band(x, 0, 179.5); x.clip();
      const well = x.createRadialGradient(C + 8, C + 11, 150, C + 8, C + 11, 190);
      well.addColorStop(0, "rgba(0,0,0,0)"); well.addColorStop(1, "rgba(0,0,0,0.85)");
      x.fillStyle = well; x.fillRect(0, 0, SIZE, SIZE);
      const dome = x.createRadialGradient(C - 86, C - 108, 0, C - 86, C - 108, 150);
      dome.addColorStop(0, "rgba(200,220,255,0.16)"); dome.addColorStop(1, "rgba(200,220,255,0)");
      x.fillStyle = dome; x.fillRect(0, 0, SIZE, SIZE);
      glint(171, -2.75, -1.95, 3, 4, "rgba(225,236,255,0.4)");
      glint(172, 0.45, 0.95, 2.4, 4, "rgba(225,236,255,0.16)");
      x.restore();
    }

    // ---- The enamel day ring for one month. Redrawn only when the month changes.
    const ring = layer();
    let ringKey = "";
    const paintRing = (y: number, m: number) => {
      const key = `${y}-${m}`; if (key === ringKey) return; ringKey = key;
      const x = ring.x, n = new Date(y, m + 1, 0).getDate();
      x.clearRect(0, 0, SIZE, SIZE);
      const en = x.createRadialGradient(C, C, 190, C, C, 247);
      en.addColorStop(0, "#0d1b45"); en.addColorStop(0.5, "#1a3180"); en.addColorStop(1, "#0f2058");
      band(x, 190, 247.5); x.fillStyle = en; x.fill();
      for (let k = 0; k < 360; k++) { const a = (k / 360) * TAU, sn = Math.sin(a), cs = Math.cos(a); x.beginPath(); x.moveTo(C + sn * 191, C - cs * 191); x.lineTo(C + sn * 247, C - cs * 247); x.lineWidth = 0.7; x.strokeStyle = k % 2 ? "rgba(150,185,255,0.085)" : "rgba(0,0,30,0.16)"; x.stroke(); }
      x.textAlign = "center"; x.textBaseline = "middle";
      for (let d = 1; d <= n; d++) {
        const a = ((d - 1) / n) * TAU, wd = new Date(y, m, d).getDay(), rest = wd === 0 || wd === 6;
        x.save(); x.translate(C, C); x.rotate(a);
        x.font = "600 19px Georgia, 'Times New Roman', serif";
        x.fillStyle = "rgba(0,0,20,0.6)"; x.fillText(String(d), 0.6, -213.2);
        x.fillStyle = rest ? "#f0c987" : "#eef1f8"; x.fillText(String(d), 0, -214);
        x.font = "700 7.5px ui-monospace, SFMono-Regular, Menlo, monospace";
        x.fillStyle = rest ? "rgba(240,201,135,0.85)" : "rgba(214,224,250,0.62)"; x.fillText(DOW[wd].toUpperCase(), 0, -235.5);
        x.rotate(TAU / n / 2);
        x.fillStyle = "rgba(214,224,250,0.5)"; x.beginPath(); x.arc(0, -214, 1.1, 0, TAU); x.fill();
        x.restore();
      }
    };

    const s = { t: first, v: 0, target: first as number | null, drag: false };
    const view = () => { const r = Math.round(s.t), o = s.t - r; return r + o - (Math.sin(o * TAU) / TAU) * 0.86; }; // the ring lags leaving a day and falls into the next
    const draw = () => {
      const shown = view(), whole = Math.round(shown), frac = shown - whole, date = plus(today, whole);
      const n = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(), turn = -((date.getDate() - 1 + frac) / n) * TAU;
      paintRing(date.getFullYear(), date.getMonth());
      const f = lunar(today, shown);
      shadeMoon(f);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base.c, 0, 0);
      ctx.translate(C * dpr, C * dpr); ctx.rotate(turn); ctx.drawImage(ring.c, -C * dpr, -C * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const lit = (1 - Math.cos(f * TAU)) / 2, halo = ctx.createRadialGradient(C, C, MR - 4, C, C, MR + 46);
      halo.addColorStop(0, `rgba(196,212,255,${0.2 * lit})`); halo.addColorStop(1, "rgba(196,212,255,0)");
      band(ctx, MR - 2, 179); ctx.fillStyle = halo; ctx.fill();
      ctx.drawImage(moon, C - MR, C - MR, MR * 2, MR * 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(over.c, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // the reading window: a steel frame with a lens that enlarges the chosen day
      const wy = C - 221, ww = 23, wh = 31, lens = () => { ctx.beginPath(); ctx.roundRect(C - ww, wy - wh, ww * 2, wh * 2, 9); };
      ctx.save(); ctx.shadowColor = "rgba(0,0,12,0.75)"; ctx.shadowBlur = 9 * dpr; ctx.shadowOffsetX = 2.5 * dpr; ctx.shadowOffsetY = 4 * dpr;
      ctx.beginPath(); ctx.roundRect(C - ww - 3.5, wy - wh - 3.5, ww * 2 + 7, wh * 2 + 7, 12); ctx.fillStyle = "#0a0d16"; ctx.fill(); ctx.restore();
      ctx.save(); lens(); ctx.clip();
      ctx.fillStyle = "#1c3690"; ctx.fillRect(C - ww, wy - wh, ww * 2, wh * 2);
      ctx.translate(C, wy); ctx.scale(1.28, 1.28); ctx.translate(-C, -wy);
      ctx.translate(C, C); ctx.rotate(turn); ctx.drawImage(ring.c, -C, -C, SIZE, SIZE);
      ctx.restore();
      ctx.save(); lens(); ctx.clip();
      const glass = ctx.createLinearGradient(C - ww, wy - wh, C + ww * 0.4, wy + wh);
      glass.addColorStop(0, "rgba(255,255,255,0.34)"); glass.addColorStop(0.34, "rgba(255,255,255,0.04)"); glass.addColorStop(1, "rgba(0,0,20,0.22)");
      ctx.fillStyle = glass; ctx.fillRect(C - ww, wy - wh, ww * 2, wh * 2);
      ctx.restore();
      const frame = ctx.createLinearGradient(C - ww, wy - wh, C + ww, wy + wh);
      frame.addColorStop(0, "#ffffff"); frame.addColorStop(0.3, "#aab0bc"); frame.addColorStop(0.55, "#4b5262"); frame.addColorStop(0.8, "#c6cad2"); frame.addColorStop(1, "#6d7380");
      ctx.beginPath(); ctx.roundRect(C - ww - 1.6, wy - wh - 1.6, ww * 2 + 3.2, wh * 2 + 3.2, 10.5); ctx.lineWidth = 3.6; ctx.strokeStyle = frame; ctx.stroke();
      ctx.beginPath(); ctx.roundRect(C - ww - 3.6, wy - wh - 3.6, ww * 2 + 7.2, wh * 2 + 7.2, 12.5); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(0,0,0,0.85)"; ctx.stroke();
      lens(); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(0,0,0,0.8)"; ctx.stroke();
    };

    let raf = 0, last = 0, seen = true, demo = AUTOPLAY && !reduce, t0 = 0, nextStep = 1000, lastAngle = 0, lastMove = 0;
    const publish = () => { const d = Math.round(s.t); if (d !== offRef.current) { offRef.current = d; setOff(d); } };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (demo && now - t0 > nextStep && !s.drag) { s.target = Math.round(s.t) + 1; nextStep += 1250; }
      let moving = s.drag;
      if (!s.drag) {
        if (s.target !== null) {
          s.v += (150 * (s.target - s.t) - 19 * s.v) * dt; s.t += s.v * dt; moving = true;
          if (Math.abs(s.target - s.t) < 0.0015 && Math.abs(s.v) < 0.02) { s.t = s.target; s.v = 0; s.target = null; }
        } else if (s.v !== 0) {
          s.v *= Math.exp(-2.2 * dt); s.t += s.v * dt; moving = true;
          if (Math.abs(s.v) < 2) s.target = Math.round(s.t + s.v * 0.18);
        }
      }
      publish(); draw();
      if (seen && !document.hidden && (moving || demo)) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const settle = () => { if (s.target !== null) s.t = s.target; s.t = Math.round(s.t); s.v = 0; s.target = null; publish(); draw(); };
    api.current = { go: (d) => { demo = false; s.target = d; if (reduce) settle(); else wake(); }, aim: () => s.target ?? Math.round(s.t) };
    draw(); wake();

    const angleAt = (e: PointerEvent) => { const b = el.getBoundingClientRect(); return Math.atan2(e.clientX - (b.left + b.width / 2), -(e.clientY - (b.top + b.height / 2))); };
    const span = () => { const d = plus(today, Math.round(s.t)); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); };
    const onDown = (e: PointerEvent) => { demo = false; s.drag = true; s.target = null; s.v = 0; lastAngle = angleAt(e); lastMove = performance.now(); el.setPointerCapture(e.pointerId); wake(); };
    const onMove = (e: PointerEvent) => {
      if (!s.drag) return;
      const now = performance.now(), a = angleAt(e); let d = a - lastAngle; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
      lastAngle = a;
      const dd = -(d / TAU) * span(), dt = Math.max(0.008, (now - lastMove) / 1000); lastMove = now;
      s.t += dd; s.v = Math.max(-60, Math.min(60, s.v * 0.6 + (dd / dt) * 0.4));
      if (reduce) { publish(); draw(); }
    };
    const onUp = () => { if (!s.drag) return; s.drag = false; if (performance.now() - lastMove > 120 || Math.abs(s.v) < 2) { s.v = 0; s.target = Math.round(s.t); } if (reduce) settle(); };
    el.addEventListener("pointerdown", onDown); el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp); el.addEventListener("pointercancel", onUp);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      el.removeEventListener("pointerdown", onDown); el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp); el.removeEventListener("pointercancel", onUp);
      io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, [today, first]);

  const date = plus(today, off), days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const f = lunar(date), name = phaseName(f), lit = litPart(f);
  const dateText = `${DOW[date.getDay()]} ${date.getDate()} ${MON[date.getMonth()]} ${date.getFullYear()}`;
  const go = (d: number) => api.current?.go(d);
  const month = (dir: number) => {
    const len = new Date(date.getFullYear(), date.getMonth() + dir + 1, 0).getDate();
    const to = new Date(date.getFullYear(), date.getMonth() + dir, Math.min(date.getDate(), len));
    go(Math.round((to.getTime() - today.getTime()) / DAY));
  };
  const onKey = (e: ReactKeyboardEvent) => {
    const k = e.key, cur = api.current?.aim() ?? offRef.current, aimed = plus(today, cur); // steps add up even while the ring is still turning
    const to = k === "ArrowRight" || k === "ArrowUp" ? cur + 1 : k === "ArrowLeft" || k === "ArrowDown" ? cur - 1 : k === "PageUp" ? cur + 7 : k === "PageDown" ? cur - 7 : k === "Home" ? cur - (aimed.getDate() - 1) : k === "End" ? cur + (new Date(aimed.getFullYear(), aimed.getMonth() + 1, 0).getDate() - aimed.getDate()) : null;
    if (to === null) return;
    e.preventDefault(); go(to);
  };
  const arrow = "flex h-10 w-10 items-center justify-center rounded-full text-stone-600 outline-none transition-colors hover:bg-stone-900/5 hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-[#1a3180] motion-reduce:transition-none";

  return (
    <div className="flex min-h-[700px] w-full flex-col items-center justify-center bg-[#e6e1d6] bg-[radial-gradient(100%_70%_at_50%_36%,#f6f3ec_0%,#e6e1d6_58%,#d6d0c2_100%)] px-4 py-10 sm:min-h-[780px]">
      <p className="mb-6 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.2em] text-stone-600">{CAPTION} <span className="mx-1 hidden text-stone-400 sm:inline">/</span> <span className="block sm:inline">pick an evening</span></p>
      <div
        ref={pad}
        role="slider"
        tabIndex={0}
        aria-label="Day of the month"
        aria-valuemin={1}
        aria-valuemax={days}
        aria-valuenow={date.getDate()}
        aria-valuetext={`${dateText}, ${name}, ${lit} percent lit`}
        onKeyDown={onKey}
        className="relative aspect-square w-full max-w-[540px] cursor-grab touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#1a3180] focus-visible:ring-offset-4 focus-visible:ring-offset-[#e6e1d6] active:cursor-grabbing"
      >
        <div aria-hidden="true" className="absolute inset-[3%] rounded-full shadow-[0_50px_60px_-22px_rgba(52,42,24,0.75),0_14px_22px_-4px_rgba(52,42,24,0.45),0_2px_3px_rgba(52,42,24,0.5)]" />
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      </div>
      <div className="mt-6 flex items-center gap-2">
        <button type="button" onClick={() => month(-1)} aria-label="Previous month" className={arrow}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4.5 6.5 10l5.5 5.5" /></svg>
        </button>
        <p aria-live="polite" className="min-w-[230px] text-center">
          <span className="block text-[17px] font-semibold leading-6 tracking-tight text-stone-900">{dateText}</span>
          <span className="block font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-stone-600">{name} <span className="mx-1 text-stone-400">/</span> {lit}% lit</span>
        </p>
        <button type="button" onClick={() => month(1)} aria-label="Next month" className={arrow}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m8 4.5 5.5 5.5L8 15.5" /></svg>
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here.
const DRINK = "Nitro cold brew";
const VALUE: number | null = null; // 0 to 1 shows real progress as how far the glass has settled; null plays the loop
const COFFEE = "#1b0d06"; // the settled drink
const SURGE = "#c08c56"; // the cloudy cascade straight after the pour
const CREAM = "#f5ead3"; // the head
const POUR = 2.3, SETTLE = 7.5, HOLD = 2.2, DRAIN = 1.5; // seconds for each part of the loop

const W = 560, H = 580, CX = 280, TOP = 84, BOT = 488, RT = 102, RB = 75, WALL = 5, BASE = 34;
const rgb = (hex: string) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const mix = (a: string, b: string, t: number, al = 1) => {
  const p = rgb(a), q = rgb(b);
  return `rgba(${p.map((v, i) => Math.round(v + (q[i] - v) * t)).join(",")},${al})`;
};
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
type Ctx = CanvasRenderingContext2D;

export default function NitroColdBrewTumblerLoader() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [label, setLabel] = useState("Settling");
  const [pct, setPct] = useState(VALUE === null ? 60 : Math.round(VALUE * 100));
  const api = useRef<{ again: () => void; knock: (d: number) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const yF = BOT - BASE, yFull = TOP + 30; // the floor of the glass and the top of a full pour
    const rO = (y: number) => RT + ((RB - RT) * (y - TOP)) / (BOT - TOP);
    const rI = (y: number) => rO(y) - WALL;
    const ec = (y: number) => 0.17 + (0.07 * (y - TOP)) / (BOT - TOP); // lower rings are seen more from above
    // The slice of a tapered round glass between two heights, as seen from the front.
    const slab = (c: Ctx, y0: number, y1: number, rf: (y: number) => number) => {
      c.beginPath(); c.moveTo(CX - rf(y0), y0); c.lineTo(CX - rf(y1), y1);
      c.ellipse(CX, y1, rf(y1), rf(y1) * ec(y1), 0, Math.PI, 0, true);
      c.lineTo(CX + rf(y0), y0); c.ellipse(CX, y0, rf(y0), rf(y0) * ec(y0), 0, 0, Math.PI, true); c.closePath();
    };
    let k = 1, seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // A tile of the surge: wavy bands of tiny bubbles, made once and scrolled.
    const tile = document.createElement("canvas"); tile.width = tile.height = 256;
    {
      const c = tile.getContext("2d");
      if (c) {
        const img = c.createImageData(256, 256), a = rgb(SURGE), hi = rgb(CREAM);
        const hash = (x: number, y: number, o: number) => { const n = Math.sin(x * 127.1 + y * 311.7 + o * 74.7) * 43758.5453; return n - Math.floor(n); };
        const vn = (x: number, y: number, nx: number, ny: number, o: number) => {
          const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
          const p = hash(xi % nx, yi % ny, o), q = hash((xi + 1) % nx, yi % ny, o), r = hash(xi % nx, (yi + 1) % ny, o), t = hash((xi + 1) % nx, (yi + 1) % ny, o);
          return p + (q - p) * sx + (r - p) * sy + (p - q - r + t) * sx * sy;
        };
        for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
          const u = x / 256, v = y / 256;
          const n = vn(u * 3, v * 4, 3, 4, 1) * 0.5 + vn(u * 6, v * 9, 6, 9, 2) * 0.3 + vn(u * 14, v * 20, 14, 20, 3) * 0.2;
          const band = 0.5 + 0.5 * Math.sin(v * Math.PI * 14 + n * 10 + Math.sin(u * Math.PI * 2) * 1.8);
          const d = clamp(0.1 + 0.9 * band * (0.45 + n)), l = clamp(band * n * 1.1 - 0.3), i = (y * 256 + x) * 4;
          img.data[i] = a[0] + (hi[0] - a[0]) * l; img.data[i + 1] = a[1] + (hi[1] - a[1]) * l; img.data[i + 2] = a[2] + (hi[2] - a[2]) * l; img.data[i + 3] = 255 * d;
        }
        c.putImageData(img, 0, 0);
      }
    }
    const fx = document.createElement("canvas"), lace = document.createElement("canvas");
    const fxX = CX - RT, fxY = yFull - 14, fxW = RT * 2, fxH = yF - yFull + 44;
    let fctx: Ctx | null = null, pat: CanvasPattern | null = null, kf = 1;

    const fit = () => {
      const b = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.max(2, Math.round(b.width * dpr)); cv.height = Math.round((cv.width * H) / W); k = cv.width / W;
      kf = Math.min(k, 1.2) * 0.8; /* the surge is soft, so it is painted small and scaled up */ fx.width = Math.ceil(fxW * kf); fx.height = Math.ceil(fxH * kf);
      fctx = fx.getContext("2d"); pat = fctx ? fctx.createPattern(tile, "repeat") : null;
      // Foam left behind on the wall each time the level drops.
      lace.width = cv.width; lace.height = cv.height;
      const c = lace.getContext("2d");
      if (!c) return;
      c.setTransform(k, 0, 0, k, 0, 0); c.lineCap = "round"; seed = 11;
      for (let ring = 0; ring < 9; ring++) {
        const y = yFull + 12 + ring * ((yF - yFull - 40) / 8) + rand() * 10, r = rI(y) - 1.2;
        for (let j = 0; j < 26; j++) {
          const a0 = rand() * Math.PI * 2, len = 0.05 + rand() * 0.3, front = Math.sin(a0 + len / 2) > 0;
          c.beginPath(); c.ellipse(CX, y + (rand() - 0.5) * 7, r, r * ec(y), 0, a0, a0 + len);
          c.lineWidth = 0.8 + rand() * rand() * 5; c.strokeStyle = mix(CREAM, "#ffffff", 0.3, (front ? 0.8 : 0.36) * (0.4 + rand() * 0.6)); c.stroke();
        }
      }
    };

    const s = { phase: "settle", pt: SETTLE * 0.03, level: 1, settle: 0.05, tilt: 0, tv: 0, lace: 0, scroll: 0, stream: 0, light: 0, lightTo: 0, t: 0 };

    const draw = () => {
      ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, W, H);
      const ys = yF - s.level * (yF - yFull), has = s.level > 0.004;
      const head = (7 + 27 * s.settle) * clamp(s.level * 4), yi = Math.min(yF - 2, ys + head);
      const lx = s.light * 10;

      // On the table: a soft pool of shade, a tight contact line and the warm light the drink throws.
      const floorY = BOT + RB * ec(BOT) * 0.55;
      ctx.save(); ctx.translate(CX + 34, floorY + 4); ctx.scale(1, 0.2);
      let g = ctx.createRadialGradient(0, 0, 10, 0, 0, 210);
      g.addColorStop(0, "rgba(70,48,28,0.5)"); g.addColorStop(0.45, "rgba(70,48,28,0.2)"); g.addColorStop(1, "rgba(70,48,28,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 210, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(CX + 4, floorY + 1); ctx.scale(1, 0.24);
      g = ctx.createRadialGradient(0, 0, RB * 0.6, 0, 0, RB * 1.25);
      g.addColorStop(0, "rgba(40,24,12,0.75)"); g.addColorStop(1, "rgba(40,24,12,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, RB * 1.25, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(CX + 96, floorY + 9); ctx.rotate(-0.05); ctx.scale(1, 0.16);
      g = ctx.createRadialGradient(0, 0, 0, 0, 0, 74);
      g.addColorStop(0, `rgba(255,190,110,${0.5 * s.level})`); g.addColorStop(0.5, `rgba(240,150,70,${0.2 * s.level})`); g.addColorStop(1, "rgba(240,150,70,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 74, 0, Math.PI * 2); ctx.fill(); ctx.restore();

      // The far wall of the empty glass.
      slab(ctx, TOP, BOT, rO);
      g = ctx.createLinearGradient(CX - RT, 0, CX + RT, 0);
      g.addColorStop(0, "rgba(120,104,84,0.3)"); g.addColorStop(0.16, "rgba(255,255,255,0.42)"); g.addColorStop(0.5, "rgba(255,255,255,0.2)"); g.addColorStop(0.84, "rgba(236,226,210,0.3)"); g.addColorStop(1, "rgba(110,94,74,0.34)");
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.ellipse(CX, yF, rI(yF), rI(yF) * ec(yF), 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.fill();
      // Lacing above the drink.
      if (s.lace > 0.01) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, TOP, W, Math.max(0, ys - TOP - 2)); ctx.clip();
        ctx.globalAlpha = s.lace; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(lace, 0, 0); ctx.restore(); ctx.setTransform(k, 0, 0, k, 0, 0);
      }

      if (has) {
        ctx.save(); slab(ctx, TOP + 4, yF, rI); ctx.clip();
        ctx.translate(CX, ys); ctx.rotate(s.tilt); ctx.translate(-CX, -ys);
        // The drink itself.
        slab(ctx, ys, yF + 30, rI); ctx.fillStyle = COFFEE; ctx.fill();
        // The surge: bands of bubbles falling down the wall while the dark drink clears from the floor up.
        if (fctx && pat && s.settle < 0.995) {
          const front = yF + 60 - s.settle * (yF + 60 - (yi - 34));
          fctx.setTransform(kf, 0, 0, kf, 0, 0); fctx.globalCompositeOperation = "source-over"; fctx.clearRect(0, 0, fxW, fxH);
          fctx.fillStyle = mix(SURGE, COFFEE, 0.42, 0.9); fctx.fillRect(0, 0, fxW, fxH);
          for (const [sc, sp, al] of [[1, 1, 0.9], [0.62, 1.6, 0.5]]) {
            const o = (s.scroll * sp) % (256 * sc);
            fctx.save(); fctx.globalAlpha = al; fctx.translate(sp * 37, o - 256 * sc); fctx.scale(sc, sc); fctx.fillStyle = pat;
            fctx.fillRect(-120, 0, fxW / sc + 240, (fxH + 256 * sc) / sc); fctx.restore();
          }
          fctx.globalCompositeOperation = "destination-in";
          const m = fctx.createLinearGradient(0, front - fxY - 56, 0, front - fxY + 18);
          m.addColorStop(0, "rgba(0,0,0,1)"); m.addColorStop(0.5, "rgba(0,0,0,0.8)"); m.addColorStop(1, "rgba(0,0,0,0)");
          fctx.fillStyle = m; fctx.fillRect(0, 0, fxW, fxH);
          ctx.drawImage(fx, fxX, fxY, fxW, fxH);
        }
        // A round glass of dark liquid: black through the middle, amber where the light gets through at the sides.
        slab(ctx, ys, yF + 30, rI);
        g = ctx.createLinearGradient(CX - RT, 0, CX + RT, 0);
        g.addColorStop(0, "rgba(255,150,60,0.34)"); g.addColorStop(0.07, "rgba(120,50,10,0.2)"); g.addColorStop(0.2, "rgba(10,4,0,0.3)"); g.addColorStop(0.5, "rgba(10,4,0,0.04)");
        g.addColorStop(0.8, "rgba(10,4,0,0.34)"); g.addColorStop(0.94, "rgba(140,60,14,0.22)"); g.addColorStop(1, "rgba(255,160,70,0.4)");
        ctx.fillStyle = g; ctx.fill();
        g = ctx.createRadialGradient(CX + 34, yF + 4, 0, CX + 34, yF + 4, 120);
        g.addColorStop(0, "rgba(214,112,36,0.5)"); g.addColorStop(0.5, "rgba(170,80,20,0.16)"); g.addColorStop(1, "rgba(170,80,20,0)");
        ctx.save(); ctx.translate(0, yF + 4); ctx.scale(1, 0.5); ctx.translate(0, -(yF + 4)); ctx.fillStyle = g; ctx.fillRect(CX - RT, yF - 140, RT * 2, 300); ctx.restore();

        // Dark liquid mirrors the room: one broad soft window and a thin one beside it.
        g = ctx.createLinearGradient(0, yi, 0, yF);
        g.addColorStop(0, "rgba(255,236,214,0)"); g.addColorStop(0.12, "rgba(255,236,214,0.13)"); g.addColorStop(0.7, "rgba(255,236,214,0.05)"); g.addColorStop(1, "rgba(255,236,214,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(CX - rI(yi) + 46 + lx, yi); ctx.lineTo(CX - rI(yi) + 84 + lx, yi); ctx.lineTo(CX - rI(yF) + 70 + lx, yF); ctx.lineTo(CX - rI(yF) + 40 + lx, yF); ctx.closePath(); ctx.fill();

        // The head: cream where it sits, tan where it is still feeding from the surge below.
        for (let j = 5; j >= 1; j--) {
          ctx.beginPath(); ctx.ellipse(CX, yi + j * 2.6, rI(yi), rI(yi) * ec(yi), 0, 0, Math.PI);
          ctx.lineWidth = 5; ctx.strokeStyle = mix(CREAM, SURGE, 0.35 + j * 0.1, 0.5 - j * 0.085); ctx.stroke();
        }
        slab(ctx, ys, yi, rI);
        g = ctx.createLinearGradient(0, ys, 0, yi + rI(yi) * ec(yi));
        g.addColorStop(0, mix(CREAM, "#ffffff", 0.25)); g.addColorStop(0.6, CREAM); g.addColorStop(1, mix(CREAM, SURGE, 0.42));
        ctx.fillStyle = g; ctx.fill();
        g = ctx.createLinearGradient(CX - RT, 0, CX + RT, 0);
        g.addColorStop(0, "rgba(120,78,36,0.5)"); g.addColorStop(0.14, "rgba(120,78,36,0.08)"); g.addColorStop(0.32, "rgba(255,255,255,0.3)"); g.addColorStop(0.52, "rgba(255,255,255,0)");
        g.addColorStop(0.84, "rgba(120,78,36,0.12)"); g.addColorStop(1, "rgba(104,64,28,0.55)");
        ctx.fillStyle = g; ctx.fill();
        // Its top, seen a little from above.
        const rs = rI(ys), ry = rs * ec(ys);
        ctx.beginPath(); ctx.ellipse(CX, ys, rs, ry, 0, 0, Math.PI * 2);
        g = ctx.createRadialGradient(CX - rs * 0.3, ys - ry * 0.3, 2, CX, ys, rs);
        g.addColorStop(0, "#fffaf0"); g.addColorStop(0.6, mix(CREAM, "#ffffff", 0.2)); g.addColorStop(1, mix(CREAM, SURGE, 0.1));
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.ellipse(CX, ys, rs - 0.6, ry - 0.4, 0, 0.06 * Math.PI, 0.94 * Math.PI); ctx.lineWidth = 1.4; ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.stroke();
        seed = 5;
        for (let j = 0; j < 46; j++) {
          const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * 0.92, br = 0.5 + rand() * rand() * 2.6;
          ctx.beginPath(); ctx.ellipse(CX + Math.cos(a) * d * rs, ys + Math.sin(a) * d * ry, br, br * 0.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(150,104,58,0.2)"; ctx.fill();
        }
        if (s.stream > 0.02) {
          ctx.beginPath(); ctx.ellipse(CX + 26, ys + 2, 26 * s.stream, 8 * s.stream, 0, 0, Math.PI * 2); ctx.fillStyle = mix(SURGE, CREAM, 0.45, 0.85); ctx.fill();
          ctx.beginPath(); ctx.ellipse(CX + 26, ys + 2, (38 + 6 * Math.sin(s.t * 19)) * s.stream, 11 * s.stream, 0, 0, Math.PI * 2); ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.stroke();
        }
        ctx.restore();
      }

      // The pour.
      if (s.stream > 0.02) {
        const w = 6.5 * s.stream, x = CX + 26, end = Math.min(yF, ys + 4);
        ctx.beginPath(); ctx.moveTo(x - w, -6);
        for (let y = 0; y <= end; y += 18) ctx.lineTo(x - w * (0.72 + 0.2 * Math.sin(y * 0.05 - s.t * 22)) + Math.sin(y * 0.03 + s.t * 9) * 0.8, y);
        for (let y = end; y >= -6; y -= 18) ctx.lineTo(x + w * (0.72 + 0.2 * Math.sin(y * 0.05 - s.t * 22 + 2)) + Math.sin(y * 0.03 + s.t * 9) * 0.8, y);
        ctx.closePath();
        g = ctx.createLinearGradient(x - w, 0, x + w, 0);
        g.addColorStop(0, mix(COFFEE, SURGE, 0.25)); g.addColorStop(0.3, mix(SURGE, CREAM, 0.5)); g.addColorStop(0.46, mix(COFFEE, SURGE, 0.6)); g.addColorStop(1, COFFEE);
        ctx.fillStyle = g; ctx.fill();
      }

      // The heavy foot of the glass: a lens that carries the colour of the drink and one hard line of light.
      const rF = rO(yF);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(CX - rF, yF); ctx.lineTo(CX - RB, BOT); ctx.ellipse(CX, BOT, RB, RB * ec(BOT), 0, Math.PI, 0, true); ctx.lineTo(CX + rF, yF);
      ctx.ellipse(CX, yF, rF, rF * ec(yF), 0, 0, Math.PI, false); ctx.closePath(); ctx.clip();
      g = ctx.createLinearGradient(CX - RB, 0, CX + RB, 0);
      const dk = mix(COFFEE, "#7a3f16", 0.5 * s.level, 0.25 + 0.6 * clamp(s.level * 5));
      g.addColorStop(0, "rgba(72,58,42,0.72)"); g.addColorStop(0.06, "rgba(255,255,255,0.86)"); g.addColorStop(0.17, "rgba(214,202,184,0.5)"); g.addColorStop(0.3, dk);
      g.addColorStop(0.62, dk); g.addColorStop(0.76, "rgba(255,236,208,0.7)"); g.addColorStop(0.9, "rgba(255,255,255,0.86)"); g.addColorStop(1, "rgba(80,64,46,0.72)");
      ctx.fillStyle = g; ctx.fillRect(CX - RT, yF, RT * 2, BASE + 40);
      g = ctx.createLinearGradient(0, yF + 8, 0, BOT + RB * ec(BOT));
      g.addColorStop(0, "rgba(40,24,10,0.36)"); g.addColorStop(0.4, "rgba(40,24,10,0)"); g.addColorStop(0.78, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(255,255,255,0.6)");
      ctx.fillStyle = g; ctx.fillRect(CX - RT, yF, RT * 2, BASE + 40);
      ctx.beginPath(); ctx.ellipse(CX + 18 + lx, BOT - 7, RB * 0.5, RB * ec(BOT) * 0.5, 0, 0.1 * Math.PI, 0.9 * Math.PI); ctx.lineWidth = 3; ctx.strokeStyle = `rgba(255,214,160,${0.4 + 0.5 * s.level})`; ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(CX, yF, rF - 1, (rF - 1) * ec(yF), 0, 0.04 * Math.PI, 0.96 * Math.PI); ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(CX, BOT, RB - 0.8, (RB - 0.8) * ec(BOT), 0, 0.03 * Math.PI, 0.97 * Math.PI); ctx.lineWidth = 1.6; ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.stroke();

      // The wall: a dark line at each silhouette, a lit line inside it, and the studio window down the left.
      const side = (d: number, y0: number, y1: number, w: number, col: string, dir: number) => {
        ctx.beginPath(); ctx.moveTo(CX + dir * (rO(y0) - d), y0); ctx.lineTo(CX + dir * (rO(y1) - d), y1); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke();
      };
      ctx.lineCap = "round";
      for (const dir of [-1, 1]) {
        side(0.6, TOP, BOT, 1.3, "rgba(70,54,36,0.62)", dir); side(2.6, TOP + 3, BOT - 3, 1.6, "rgba(255,255,255,0.78)", dir); side(WALL + 0.8, TOP + 6, yF - 4, 1, "rgba(60,44,28,0.26)", dir);
      }
      const streak = (d0: number, d1: number, y0: number, y1: number, al: number) => {
        ctx.beginPath(); ctx.moveTo(CX - rO(y0) + d0 + lx, y0); ctx.lineTo(CX - rO(y0) + d1 + lx, y0); ctx.lineTo(CX - rO(y1) + d1 * 0.8 + lx, y1); ctx.lineTo(CX - rO(y1) + d0 * 0.8 + lx, y1); ctx.closePath();
        const q = ctx.createLinearGradient(0, y0, 0, y1);
        q.addColorStop(0, "rgba(255,255,255,0)"); q.addColorStop(0.07, `rgba(255,255,255,${al})`); q.addColorStop(0.5, `rgba(255,255,255,${al * 0.7})`); q.addColorStop(0.93, `rgba(255,255,255,${al * 0.5})`); q.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = q; ctx.fill();
      };
      streak(17, 31, TOP + 16, yF - 10, 0.74); streak(36, 39.5, TOP + 22, yF - 24, 0.42); streak(RT * 2 - 30, RT * 2 - 26, TOP + 18, yF - 14, 0.5);
      streak(RT * 2 - 76, RT * 2 - 44, TOP + 28, TOP + 150, 0.13);
      // The rim: cut glass has a flat top that catches light all the way round.
      ctx.beginPath(); ctx.ellipse(CX, TOP, RT - 0.6, RT * ec(TOP), 0, 0, Math.PI * 2); ctx.lineWidth = 3.4; ctx.strokeStyle = "rgba(246,240,230,0.85)"; ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(84,66,46,0.5)"; ctx.beginPath(); ctx.ellipse(CX, TOP, RT + 1, RT * ec(TOP) + 1, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(CX, TOP, RT - 3.4, RT * ec(TOP) - 2.2, 0, 0, Math.PI * 2); ctx.strokeStyle = "rgba(84,66,46,0.34)"; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(CX, TOP, RT - 0.8, RT * ec(TOP) - 0.2, 0, 1.12 * Math.PI + s.light * 0.2, 1.52 * Math.PI + s.light * 0.2); ctx.lineWidth = 2.4; ctx.strokeStyle = "#ffffff"; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(CX, TOP, RT - 0.8, RT * ec(TOP) - 0.2, 0, 0.2 * Math.PI, 0.44 * Math.PI); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.92)"; ctx.stroke();
    };

    let lastLabel = "", lastPct = -1;
    const say = (text: string, p: number) => {
      if (text !== lastLabel) { lastLabel = text; setLabel(text); }
      if (p !== lastPct) { lastPct = p; setPct(p); }
    };
    const ease = (p: number) => 1 - Math.pow(1 - clamp(p), 1.25);
    const go = (phase: string) => { s.phase = phase; s.pt = 0; };

    let raf = 0, last = 0, seen = true;
    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      s.t += dt; s.pt += dt;
      if (VALUE !== null) {
        s.level = 1; s.settle += (clamp(VALUE) - s.settle) * Math.min(1, dt * 3); s.scroll += dt * 52 * (1 - s.settle * 0.6);
        say(VALUE >= 1 ? "Ready" : "Settling", Math.round(clamp(VALUE) * 100));
      } else if (s.phase === "settle") {
        const p = s.pt / SETTLE; s.settle = ease(p); s.level = 1; s.stream += (0 - s.stream) * Math.min(1, dt * 9);
        s.scroll += dt * (150 - 104 * clamp(p * 4)) * (1 - s.settle * 0.55); say("Settling", Math.min(99, Math.round(s.settle * 100)));
        if (p >= 1) go("hold");
      } else if (s.phase === "hold") {
        s.settle = 1; say("Ready", 100);
        if (s.pt > HOLD) { go("drain"); s.lace = 1; }
      } else if (s.phase === "drain") {
        const p = clamp(s.pt / DRAIN); s.level = 1 - p * p * (3 - 2 * p); say("Next glass", 100);
        if (p >= 1) go("pause");
      } else if (s.phase === "pause") {
        s.level = 0; s.settle = 0; if (s.pt > 0.45) go("pour");
      } else {
        const p = clamp((s.pt - 0.18) / POUR); s.level = p; s.settle = 0; s.scroll += dt * 170;
        s.stream += ((s.pt < POUR + 0.05 ? 1 : 0) - s.stream) * Math.min(1, dt * 10); s.tv += (Math.random() - 0.5) * dt * 0.9; say("Pouring", 0);
        if (p >= 1) { go("settle"); s.lace = 0; }
      }
      s.tv += (-90 * s.tilt - 5 * s.tv) * dt; s.tilt += s.tv * dt;
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 5);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const still = () => { s.level = 1; s.settle = VALUE === null ? 1 : clamp(VALUE); s.stream = 0; s.tilt = 0; say(s.settle >= 1 ? "Ready" : "Settling", Math.round(s.settle * 100)); draw(); };
    const wake = () => { if (reduce) still(); else if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
    api.current = {
      again: () => { if (VALUE === null && !reduce && (s.phase === "settle" || s.phase === "hold")) { go("drain"); s.lace = 1; } wake(); },
      knock: (d) => { s.tv += d; wake(); },
    };
    fit(); wake();

    const host = cv.parentElement;
    let px = 0;
    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect(), x = ((e.clientX - b.left) / b.width) * W;
      s.lightTo = clamp((x / W) * 2 - 1, -1, 1);
      for (const edge of [CX - RT, CX + RT]) if ((x - edge) * (px - edge) < 0) s.tv += clamp((x - px) * 0.012, -0.5, 0.5);
      px = x;
    };
    const onLeave = () => { s.lightTo = 0; };
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

  return (
    <div className="flex min-h-[640px] w-full flex-col items-center justify-center bg-[#e9e1d3] bg-[radial-gradient(120%_85%_at_50%_34%,#fbf8f2_0%,#ece5d8_50%,#d3c8b5_100%)] px-4 py-8 sm:min-h-[760px]">
      <div className="relative w-full" style={{ maxWidth: 640, aspectRatio: `${W} / ${H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <button
          type="button"
          aria-label={`Pour another ${DRINK.toLowerCase()}`}
          onClick={() => { api.current?.knock(0.5); api.current?.again(); }}
          className="absolute left-1/2 top-[14%] h-[72%] w-[42%] -translate-x-1/2 cursor-pointer rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-stone-900/70 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
        />
      </div>
      <div
        role="progressbar"
        aria-label={`${DRINK}: ${label.toLowerCase()}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-stone-600"
      >
        <span className="text-stone-900">{DRINK}</span>
        <span aria-hidden="true" className="text-stone-400">/</span>
        <span>{label}</span>
        <span className="w-[4ch] text-right tabular-nums text-stone-900">{pct}%</span>
      </div>
    </div>
  );
}

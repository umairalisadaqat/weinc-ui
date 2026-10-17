import { useEffect, useRef, useState } from "react";

// One reel per colour, left to right. `stamp` is the short name branded into the rail under it.
const threads = [
  { name: "Madder red", stamp: "MADDER", color: "#b3261e" },
  { name: "Saffron", stamp: "SAFFRON", color: "#e0a019" },
  { name: "Moss", stamp: "MOSS", color: "#5f7a34" },
  { name: "Teal", stamp: "TEAL", color: "#12767c" },
  { name: "Indigo", stamp: "INDIGO", color: "#27357e" },
  { name: "Plum", stamp: "PLUM", color: "#6e2a5e" },
  { name: "Chalk", stamp: "CHALK", color: "#e9e3d3" },
  { name: "Charcoal", stamp: "CHARCOAL", color: "#34343a" },
];
const START = [0, 3, 6]; // colours that are already let down when the page opens
const DROP = 118; // how far a chosen button hangs below the rail, in design pixels
const RAIL = "#6a4124"; // the rail timber, seen from the front
const RAIL_TOP = "#8b5e3a"; // the same timber where the light falls on its top
const BEECH = "#d9b888"; // the reel ends
const RF = 36, RB = 27.5, HT = 108, FT = 6.5, ET = 7.6; // flange radius, wound radius, reel height, flange thickness, how round the ends look
const N = 9; // links in each hanging thread

const layoutFor = (narrow: boolean) => {
  const per = narrow ? 4 : threads.length, pitch = narrow ? 90 : 106, x0 = narrow ? 60 : 104, drop = narrow ? DROP * 0.78 : DROP;
  const rowH = HT + 80 + drop, rows = Math.ceil(threads.length / per);
  return { W: x0 * 2 + (per - 1) * pitch + (narrow ? 8 : 14), H: 30 + rows * rowH + 22, per, drop, rows, rowH, x1: x0 * 2 + (per - 1) * pitch + (narrow ? 8 : 14), reels: threads.map((_, i) => ({ x: x0 + (i % per) * pitch, y: 30 + HT + 14 + Math.floor(i / per) * rowH })) };
};

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const tone = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => clamp(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
};

export default function ThreadSpoolRackColourFilter() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [picked, setPicked] = useState<boolean[]>(() => threads.map((_, i) => START.includes(i)));
  const live = useRef<boolean[]>(picked);
  const api = useRef<{ wake: () => void; stopDemo: () => void } | null>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < 700));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const L = layoutFor(narrow);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mk = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
    let seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    // Paints only the blurred shadow of a shape: the shape itself is drawn far off the canvas.
    const cast = (c: CanvasRenderingContext2D, sc: number, blur: number, ox: number, oy: number, col: string, path: () => void) => {
      c.save(); c.shadowColor = col; c.shadowBlur = blur * sc; c.shadowOffsetX = ox * sc + 30000; c.shadowOffsetY = oy * sc;
      c.translate(-30000 / sc, 0); c.fillStyle = "#000"; c.beginPath(); path(); c.fill(); c.restore();
    };
    const wood = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, sd: number) => {
      seed = sd;
      const g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, tone(base, 0.1)); g.addColorStop(1, tone(base, -0.16));
      c.fillStyle = g; c.fillRect(x, y, w, h);
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
      const f = (2.2 * Math.PI * 2) / w, ph = rand() * 6;
      for (let i = 0; i < h * 2.2; i++) {
        const y0 = y + rand() * h, v = rand(), amp = 1.5 + rand() * 2;
        c.beginPath(); for (let px = x; px <= x + w + 6; px += 6) c.lineTo(px, y0 + Math.sin(px * f + ph + y0 * 0.05) * amp);
        c.lineWidth = 0.3 + rand() * (i % 9 === 0 ? 3 : 0.8); c.globalAlpha = 0.05 + rand() * 0.16;
        c.strokeStyle = v > 0.6 ? tone(base, 0.5) : tone(base, -0.6); c.stroke();
      }
      c.globalAlpha = 1;
      for (let i = 0; i < (w * h) / 26; i++) { c.fillStyle = `rgba(30,14,4,${0.1 + rand() * 0.22})`; c.fillRect(x + rand() * w, y + rand() * h, 1.5 + rand() * 5, 0.45); }
      c.restore();
    };

    const RH = 34, RT = 15; // rail front height, depth of the rail top we can see
    const eye = (i: number) => ({ x: L.reels[i].x + RB + 0.5, y: L.reels[i].y + RH + 4.5 });
    const s = {
      len: threads.map((_, i) => (live.current[i] ? L.drop : 13)), lv: threads.map(() => 0), ang: threads.map((_, i) => i * 1.7),
      x: threads.map((_, i) => Array.from({ length: N + 1 }, () => eye(i).x)),
      y: threads.map((_, i) => Array.from({ length: N + 1 }, (_v, j) => eye(i).y + ((live.current[i] ? L.drop : 13) * j) / N)),
      px: threads.map((_, i) => Array.from({ length: N + 1 }, () => eye(i).x)),
      py: threads.map((_, i) => Array.from({ length: N + 1 }, (_v, j) => eye(i).y + ((live.current[i] ? L.drop : 13) * j) / N)),
    };

    // 1. Each reel is kept as its own small picture and repainted only while it is turning.
    const SW = RF * 2 + 10, SH = HT + ET * 2 + 22;
    let k = 1;
    const sprites = threads.map(() => mk(1, 1));
    const drawn = threads.map(() => NaN);
    const paintReel = (i: number) => {
      const sp = sprites[i], c = sp.getContext("2d");
      if (!c) return;
      const col = threads[i].color, a = s.ang[i];
      c.setTransform(k, 0, 0, k, 0, 0); c.clearRect(0, 0, SW, SH);
      const cx = SW / 2, yB = SH - ET - 3, yT = yB - HT;
      const turned = (x0: number, x1: number, base: string) => { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, tone(base, -0.5)); g.addColorStop(0.1, tone(base, -0.18)); g.addColorStop(0.3, tone(base, 0.34)); g.addColorStop(0.46, tone(base, 0.04)); g.addColorStop(0.82, tone(base, -0.3)); g.addColorStop(1, tone(base, -0.58)); return g; };
      const flange = (yTop: number, face: boolean) => {
        c.beginPath(); c.ellipse(cx, yTop + FT, RF, ET, 0, 0, Math.PI); c.lineTo(cx - RF, yTop); c.ellipse(cx, yTop, RF, ET, 0, Math.PI, 0, true); c.closePath();
        c.fillStyle = turned(cx - RF, cx + RF, BEECH); c.fill();
        c.lineWidth = 0.5; c.strokeStyle = "rgba(60,34,10,0.5)"; c.stroke();
        c.beginPath(); c.ellipse(cx, yTop, RF, ET, 0, 0, Math.PI * 2);
        const top = c.createLinearGradient(cx - RF, yTop - ET, cx + RF, yTop + ET);
        top.addColorStop(0, tone(BEECH, 0.42)); top.addColorStop(0.55, tone(BEECH, 0.12)); top.addColorStop(1, tone(BEECH, -0.2));
        c.fillStyle = top; c.fill();
        c.lineWidth = 0.6; c.strokeStyle = "rgba(255,244,220,0.8)"; c.beginPath(); c.ellipse(cx, yTop, RF - 0.4, ET - 0.3, 0, Math.PI * 1.02, Math.PI * 1.98); c.stroke();
        if (!face) return;
        // Printed paper end label, with marks that travel round as the reel turns.
        c.beginPath(); c.ellipse(cx, yTop, RF - 5, ET - 1.1, 0, 0, Math.PI * 2); c.fillStyle = "#f4ecd8"; c.fill();
        c.lineWidth = 1.5; c.strokeStyle = tone(col, col === "#e9e3d3" ? -0.25 : 0); c.beginPath(); c.ellipse(cx, yTop, RF - 8, ET - 1.9, 0, 0, Math.PI * 2); c.stroke();
        for (let m = 0; m < 3; m++) {
          const th = a + (m / 3) * Math.PI * 2, mx = cx + Math.cos(th) * (RF - 13.5), my = yTop + Math.sin(th) * (ET - 3);
          c.beginPath(); c.ellipse(mx, my, 2.6, 0.8, 0, 0, Math.PI * 2); c.fillStyle = m === 0 ? tone(col, col === "#e9e3d3" ? -0.3 : -0.1) : "rgba(60,40,24,0.75)"; c.fill();
        }
        // The peg it sits on pokes through the middle.
        c.beginPath(); c.ellipse(cx, yTop, 7, 1.7, 0, 0, Math.PI * 2); c.fillStyle = "#1c110a"; c.fill();
        c.beginPath(); c.ellipse(cx, yTop - 0.4, 5, 1.2, 0, 0, Math.PI); c.lineTo(cx - 5, yTop - 7); c.ellipse(cx, yTop - 7, 5, 1.2, 0, Math.PI, 0, true); c.closePath(); c.fillStyle = turned(cx - 5, cx + 5, RAIL); c.fill();
        c.beginPath(); c.ellipse(cx, yTop - 7, 5, 1.2, 0, 0, Math.PI * 2); c.fillStyle = tone(RAIL, 0.3); c.fill();
      };
      flange(yB - FT, false);
      // The wound thread: a slightly fat cylinder, lit from the left, with two sets of wraps crossing.
      const y1 = yT + FT, y2 = yB - FT, bulge = 3.2, er = (ET * RB) / RF;
      cast(c, k, 5, 0, 3, "rgba(0,0,0,0.5)", () => { c.ellipse(cx, y2 + 1, RB + 1, er + 1, 0, 0, Math.PI * 2); });
      c.save();
      c.beginPath(); c.moveTo(cx - RB, y1 - 2); c.quadraticCurveTo(cx - RB - bulge * 2, (y1 + y2) / 2, cx - RB, y2);
      c.ellipse(cx, y2, RB, er, 0, Math.PI, 0, true);
      c.quadraticCurveTo(cx + RB + bulge * 2, (y1 + y2) / 2, cx + RB, y1 - 2); c.closePath();
      c.clip();
      c.fillStyle = turned(cx - RB - bulge, cx + RB + bulge, col); c.fillRect(cx - RF, y1 - 4, RF * 2, y2 - y1 + ET + 6);
      const gap = 2.3, off = (((a * 3.4) % gap) + gap) % gap;
      c.lineWidth = 0.75;
      for (let fam = 0; fam < 2; fam++) {
        c.strokeStyle = fam ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.26)";
        for (let y = y1 - 12 + (fam ? gap - off : off); y < y2 + 8; y += gap) {
          const t = (y - y1) / (y2 - y1), wide = RB + bulge * (1 - Math.pow(Math.max(-1, Math.min(1, t * 2 - 1)), 2)) + 1;
          c.beginPath(); c.ellipse(cx, y, wide, er + 1.2, fam ? 0.085 : -0.085, 0, Math.PI); c.stroke();
        }
      }
      // A long soft shine down the lit side, and the shade under the top flange.
      const shine = c.createLinearGradient(cx - RB, 0, cx + RB, 0);
      shine.addColorStop(0.16, "rgba(255,255,255,0)"); shine.addColorStop(0.3, "rgba(255,255,255,0.3)"); shine.addColorStop(0.4, "rgba(255,255,255,0)");
      shine.addColorStop(0.86, "rgba(255,255,255,0)"); shine.addColorStop(0.93, "rgba(255,255,255,0.1)"); shine.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = shine; c.fillRect(cx - RF, y1 - 4, RF * 2, y2 - y1 + 12);
      const under = c.createLinearGradient(0, y1, 0, y1 + 20); under.addColorStop(0, "rgba(0,0,0,0.62)"); under.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = under; c.fillRect(cx - RF, y1 - 4, RF * 2, 26);
      c.restore();
      flange(yT, true);
    };

    // 2. Wall shadows, rails, stamped names and screw eyes: painted once per size.
    const base = mk(1, 1);
    const fit = () => {
      const w = cv.clientWidth || L.W, dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr); cv.height = Math.round((w * L.H) / L.W * dpr); k = cv.width / L.W;
      base.width = cv.width; base.height = cv.height;
      sprites.forEach((sp, i) => { sp.width = Math.ceil(SW * k); sp.height = Math.ceil(SH * k); drawn[i] = NaN; });
      const c = base.getContext("2d");
      if (!c) return;
      c.setTransform(k, 0, 0, k, 0, 0);
      const rx0 = narrow ? 16 : 40, rx1 = L.W - rx0;
      for (let r = 0; r < L.rows; r++) {
        const ry = L.reels[r * L.per].y;
        cast(c, k, narrow ? 12 : 20, narrow ? 5 : 12, 18, "rgba(60,44,24,0.42)", () => c.rect(rx0 + 4, ry - RT + 4, rx1 - rx0 - 8, RH + RT - 4));
        cast(c, k, 5, 2, 5, "rgba(50,34,16,0.5)", () => c.rect(rx0 + 2, ry, rx1 - rx0 - 4, RH));
        L.reels.forEach((p, i) => { if (Math.floor(i / L.per) === r) cast(c, k, 14, narrow ? 12 : 20, 14, "rgba(60,44,24,0.3)", () => c.rect(p.x - RB, p.y - HT + 4, RB * 2, HT - 14)); });
        wood(c, rx0 + 3, ry - RT, rx1 - rx0 - 6, RT, RAIL_TOP, 77 + r);
        wood(c, rx0, ry, rx1 - rx0, RH, RAIL, 131 + r * 17);
        const bev = c.createLinearGradient(0, ry, 0, ry + RH);
        bev.addColorStop(0, "rgba(255,226,180,0.7)"); bev.addColorStop(0.05, "rgba(255,226,180,0.16)"); bev.addColorStop(0.3, "rgba(0,0,0,0)"); bev.addColorStop(0.86, "rgba(0,0,0,0.12)"); bev.addColorStop(1, "rgba(0,0,0,0.6)");
        c.fillStyle = bev; c.fillRect(rx0, ry, rx1 - rx0, RH);
        const far = c.createLinearGradient(0, ry - RT, 0, ry); far.addColorStop(0, "rgba(0,0,0,0.3)"); far.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = far; c.fillRect(rx0 + 3, ry - RT, rx1 - rx0 - 6, RT);
        // Two slotted brass screws hold the rail to the wall.
        (narrow ? [] : [rx0 + 13, rx1 - 13]).forEach((sx, n) => {
          const sy = ry + RH / 2, g = c.createRadialGradient(sx - 1.4, sy - 1.6, 0.3, sx, sy, 4.6);
          g.addColorStop(0, "#fff3c2"); g.addColorStop(0.55, "#c2923a"); g.addColorStop(1, "#5c3d0d");
          c.beginPath(); c.arc(sx, sy + 0.8, 5.2, 0, Math.PI * 2); c.fillStyle = "rgba(0,0,0,0.5)"; c.fill();
          c.beginPath(); c.arc(sx, sy, 4.6, 0, Math.PI * 2); c.fillStyle = g; c.fill();
          const a = 0.6 + n * 1.9; c.lineWidth = 1; c.strokeStyle = "rgba(40,22,2,0.85)";
          c.beginPath(); c.moveTo(sx - Math.cos(a) * 3.8, sy - Math.sin(a) * 3.8); c.lineTo(sx + Math.cos(a) * 3.8, sy + Math.sin(a) * 3.8); c.stroke();
        });
      }
      threads.forEach((t, i) => {
        const p = L.reels[i], e = eye(i);
        // Where the reel stands on the rail.
        const g = c.createRadialGradient(p.x + 4, p.y - RT / 2 + 1, RF * 0.5, p.x + 4, p.y - RT / 2 + 1, RF * 1.5);
        g.addColorStop(0, "rgba(0,0,0,0.6)"); g.addColorStop(1, "rgba(0,0,0,0)");
        c.save(); c.beginPath(); c.rect(0, p.y - RT, L.W, RT); c.clip(); c.translate(p.x + 4, p.y - RT / 2 + 1); c.scale(1, 0.3); c.translate(-(p.x + 4), -(p.y - RT / 2 + 1)); c.fillStyle = g; c.fillRect(p.x - 80, p.y - 200, 170, 400); c.restore();
        // Name stamped into the timber and filled with gilt.
        c.font = `700 ${narrow ? 8.4 : 9.4}px ui-monospace, SFMono-Regular, Menlo, monospace`; c.textAlign = "center"; c.textBaseline = "middle";
        const tx = p.x - 5, ty = p.y + RH / 2 + 1, sp2 = narrow ? 1 : 1.6;
        const spaced = (dy: number) => { let x = tx - ((t.stamp.length - 1) * (5.6 + sp2)) / 2; for (const chr of t.stamp) { c.fillText(chr, x, ty + dy); x += 5.6 + sp2; } };
        c.fillStyle = "rgba(14,6,0,0.75)"; spaced(-0.8);
        c.fillStyle = "rgba(236,202,146,0.88)"; spaced(0);
        // Brass screw eye under the rail.
        c.lineWidth = 1.6; c.strokeStyle = "#5c3d0d"; c.beginPath(); c.moveTo(e.x, p.y + RH - 1); c.lineTo(e.x, e.y - 3.6); c.stroke();
        cast(c, k, 4, 3, 4, "rgba(50,34,16,0.45)", () => c.arc(e.x, e.y, 4.6, 0, Math.PI * 2));
        const br = c.createLinearGradient(e.x - 5, e.y - 5, e.x + 5, e.y + 5); br.addColorStop(0, "#fff0b8"); br.addColorStop(0.45, "#c9983c"); br.addColorStop(1, "#6f4a12");
        c.lineWidth = 2; c.strokeStyle = br; c.beginPath(); c.arc(e.x, e.y, 3.7, 0, Math.PI * 2); c.stroke();
        c.lineWidth = 0.5; c.strokeStyle = "rgba(40,22,2,0.6)"; c.beginPath(); c.arc(e.x, e.y, 4.8, 0, Math.PI * 2); c.stroke();
      });
    };

    const button = (i: number, bx: number, by: number, rot: number) => {
      const col = threads[i].color, r = narrow ? 13 : 15, pale = col === "#e9e3d3";
      // Its shadow lands on the wall a little down and to the right.
      const sh = ctx.createRadialGradient(bx + 12, by + 13, r * 0.3, bx + 12, by + 13, r * 1.5);
      sh.addColorStop(0, "rgba(60,44,24,0.36)"); sh.addColorStop(1, "rgba(60,44,24,0)");
      ctx.fillStyle = sh; ctx.fillRect(bx - r, by - r, r * 4, r * 4);
      ctx.save(); ctx.translate(bx, by); ctx.rotate(rot);
      const body = ctx.createRadialGradient(-r * 0.4, -r * 0.45, r * 0.1, 0, 0, r);
      body.addColorStop(0, tone(col, 0.38)); body.addColorStop(0.5, tone(col, 0.02)); body.addColorStop(1, tone(col, -0.42));
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill();
      ctx.lineWidth = 0.6; ctx.strokeStyle = pale ? "rgba(90,70,40,0.6)" : "rgba(0,0,0,0.45)"; ctx.stroke();
      // Raised rim and the dished middle.
      ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.beginPath(); ctx.arc(0, 0, r - 1.3, Math.PI * 1.02, Math.PI * 1.6); ctx.stroke();
      const dish = ctx.createLinearGradient(-r * 0.6, -r * 0.6, r * 0.6, r * 0.6);
      dish.addColorStop(0, tone(col, -0.38)); dish.addColorStop(0.5, tone(col, -0.08)); dish.addColorStop(1, tone(col, 0.26));
      ctx.beginPath(); ctx.arc(0, 0, r * 0.66, 0, Math.PI * 2); ctx.fillStyle = dish; ctx.fill();
      ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.beginPath(); ctx.arc(0, 0, r * 0.66, Math.PI * 0.1, Math.PI * 0.6); ctx.stroke();
      const h = r * 0.24;
      for (let n = 0; n < 4; n++) {
        const hx = (n % 2 ? 1 : -1) * h, hy = (n < 2 ? -1 : 1) * h;
        ctx.beginPath(); ctx.arc(hx, hy, r * 0.115, 0, Math.PI * 2); ctx.fillStyle = pale ? "#6b5a40" : "#0c0a08"; ctx.fill();
        ctx.lineWidth = 0.5; ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.beginPath(); ctx.arc(hx, hy, r * 0.13, Math.PI * 0.1, Math.PI * 0.7); ctx.stroke();
      }
      // The thread is knotted through the top pair of holes.
      ctx.lineCap = "round"; ctx.lineWidth = 1.7; ctx.strokeStyle = tone(col, pale ? -0.3 : -0.25);
      ctx.beginPath(); ctx.moveTo(-h, -h); ctx.lineTo(h, -h); ctx.stroke();
      ctx.restore();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0);
      threads.forEach((_, i) => {
        if (drawn[i] !== s.ang[i]) { paintReel(i); drawn[i] = s.ang[i]; }
        ctx.drawImage(sprites[i], Math.round((L.reels[i].x - SW / 2) * k), Math.round((L.reels[i].y - RT / 2 - 1 - (SH - ET - 3)) * k));
      });
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      threads.forEach((t, i) => {
        const p = L.reels[i], e = eye(i), xs = s.x[i], ys = s.y[i], pale = t.color === "#e9e3d3";
        const path = (dx: number, dy: number) => {
          ctx.beginPath(); ctx.moveTo(p.x + RB + 1.6 + dx, p.y - RT / 2 - HT * 0.52 + dy); ctx.lineTo(e.x + dx, e.y - 3 + dy);
          for (let j = 1; j < N; j++) ctx.quadraticCurveTo(xs[j] + dx, ys[j] + dy, (xs[j] + xs[j + 1]) / 2 + dx, (ys[j] + ys[j + 1]) / 2 + dy);
          ctx.lineTo(xs[N] + dx, ys[N] + dy);
        };
        if (s.len[i] > 22) { ctx.save(); ctx.beginPath(); ctx.rect(0, p.y + RH + 6, L.W, L.H); ctx.clip(); path(9, 10); ctx.lineWidth = 1.6; ctx.strokeStyle = "rgba(60,44,24,0.13)"; ctx.stroke(); ctx.restore(); }
        path(0, 0); ctx.lineWidth = 2.5; ctx.strokeStyle = pale ? "rgba(90,74,48,0.75)" : tone(t.color, -0.55); ctx.stroke();
        path(0, 0); ctx.lineWidth = 1.5; ctx.strokeStyle = tone(t.color, 0.04); ctx.stroke();
        path(0, 0); ctx.setLineDash([1.6, 2.2]); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(255,255,255,0.38)"; ctx.stroke(); ctx.setLineDash([]);
        const r = narrow ? 13 : 15, ax = xs[N] - xs[N - 1], ay = ys[N] - ys[N - 1], rot = Math.atan2(ax, -ay) + Math.PI, un = Math.hypot(ax, ay) || 1;
        button(i, xs[N] + (ax / un) * r * 0.3, ys[N] + (ay / un) * r * 0.3, rot);
      });
    };

    // 3. The hanging threads are chains of points; the button is the heavy last point.
    const sim = (dt: number, t: number) => {
      for (let i = 0; i < threads.length; i++) {
        const to = live.current[i] ? L.drop : 13, before = s.len[i];
        s.lv[i] += (60 * (to - s.len[i]) - 12.5 * s.lv[i]) * dt; s.len[i] += s.lv[i] * dt;
        s.ang[i] += (s.len[i] - before) / RB; // the reel turns by exactly the thread that left it
        if (Math.abs(to - s.len[i]) < 0.02 && Math.abs(s.lv[i]) < 0.02) { s.len[i] = to; s.lv[i] = 0; }
        const xs = s.x[i], ys = s.y[i], px = s.px[i], py = s.py[i], e = eye(i), seg = s.len[i] / N;
        const breeze = Math.sin(t * 0.9 + i * 1.9) * 26 + Math.sin(t * 2.3 + i) * 10;
        for (let j = 1; j <= N; j++) {
          const vx = (xs[j] - px[j]) * 0.992, vy = (ys[j] - py[j]) * 0.992;
          px[j] = xs[j]; py[j] = ys[j];
          xs[j] += vx + breeze * (j / N) * dt * dt; ys[j] += vy + 2600 * dt * dt;
        }
        xs[0] = e.x; ys[0] = e.y;
        for (let it = 0; it < 8; it++) for (let j = 0; j < N; j++) {
          const dx = xs[j + 1] - xs[j], dy = ys[j + 1] - ys[j], d = Math.hypot(dx, dy) || 0.0001, diff = (d - seg) / d;
          const wa = j === 0 ? 0 : j === N - 1 ? 0.86 : 0.5, wb = j === 0 ? 1 : j === N - 1 ? 0.14 : 0.5;
          xs[j] += dx * diff * wa; ys[j] += dy * diff * wa; xs[j + 1] -= dx * diff * wb; ys[j + 1] -= dy * diff * wb;
        }
      }
    };
    const still = () => {
      threads.forEach((_, i) => { const e = eye(i), to = live.current[i] ? L.drop : 13; s.ang[i] += (to - s.len[i]) / RB; s.len[i] = to; s.lv[i] = 0; for (let j = 0; j <= N; j++) { s.x[i][j] = s.px[i][j] = e.x; s.y[i][j] = s.py[i][j] = e.y + (to * j) / N; } });
      draw();
    };

    let raf = 0, last = 0, t0 = 0, seen = true, demo = !reduce, nextAt = 2.6, step = 0;
    const order = [5, 0, 1, 3, 7, 6, 2, 5, 4, 1, 0, 7, 3, 2, 6, 4];
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.034, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      if (demo && t > nextAt) {
        const i = order[step % order.length] % threads.length; step++; nextAt = t + 2.1;
        const next = live.current.map((on, j) => (j === i ? !on : on));
        live.current = next; setPicked(next);
      }
      sim(dt / 2, t); sim(dt / 2, t + dt / 2);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (reduce) still(); else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    api.current = { wake, stopDemo: () => { demo = false; } };
    fit(); wake();

    // A pointer passing a hanging button knocks it, and it swings until it settles.
    const host = cv.parentElement;
    let lx = 0, ly = 0, lt = 0;
    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect(), x = ((e.clientX - b.left) / b.width) * L.W, y = ((e.clientY - b.top) / b.height) * L.H, now = performance.now();
      if (now - lt < 120 && !reduce) {
        const vx = Math.max(-14, Math.min(14, (x - lx) * 0.45)), vy = Math.max(-8, Math.min(8, (y - ly) * 0.3));
        threads.forEach((_, i) => { for (let j = 2; j <= N; j++) if (s.len[i] > 30 && Math.hypot(s.x[i][j] - x, s.y[i][j] - y) < 26) { s.x[i][j] += vx * (j / N); s.y[i][j] += vy * (j / N); } });
      }
      lx = x; ly = y; lt = now;
    };
    host?.addEventListener("pointermove", onMove);
    const ro = new ResizeObserver(() => { fit(); if (reduce) still(); else { draw(); wake(); } });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; host?.removeEventListener("pointermove", onMove); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, [narrow]);

  const L = layoutFor(narrow);
  const set = (next: boolean[]) => { api.current?.stopDemo(); live.current = next; setPicked(next); api.current?.wake(); };
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const chosen = threads.filter((_, i) => picked[i]);

  return (
    <div ref={stage} className="flex min-h-[720px] w-full flex-col items-center justify-center bg-[#e3dccf] bg-[radial-gradient(85%_75%_at_30%_22%,#f6f1e7_0%,#e9e2d5_48%,#d6cdbc_100%)] px-3 py-12 sm:px-6">
      <div role="group" aria-label="Filter by thread colour" className="relative w-full" style={{ maxWidth: narrow ? 400 : 1000, aspectRatio: `${L.W} / ${L.H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        {threads.map((t, i) => (
          <label
            key={t.name}
            style={{ left: pct(L.reels[i].x - RF - 6, L.W), top: pct(L.reels[i].y - HT - 22, L.H), width: pct(RF * 2 + 16, L.W), height: pct(HT + 62 + (picked[i] ? L.drop + 12 : 30), L.H) }}
            className="absolute cursor-pointer"
          >
            <input type="checkbox" aria-label={t.name} checked={picked[i]} onChange={() => set(live.current.map((on, j) => (j === i ? !on : on)))} className="peer sr-only" />
            <span aria-hidden="true" className="absolute inset-0 rounded-xl peer-focus-visible:ring-2 peer-focus-visible:ring-[#7a3b12]" />
          </label>
        ))}
      </div>
      <div className="mt-6 flex min-h-[44px] max-w-[760px] flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-stone-600">
        <p aria-live="polite">
          <span className="font-semibold text-[#7a3b12]">{chosen.length ? "Showing" : "Tap a reel to let its button down"}</span>
          {chosen.length > 0 && <span className="mx-2 text-stone-500">/</span>}
          <span className="font-semibold text-stone-900">{chosen.map((t) => t.name).join(" + ")}</span>
        </p>
        {chosen.length > 0 && (
          <button type="button" onClick={() => set(threads.map(() => false))} className="min-h-[40px] rounded-full border border-stone-500 px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-900 outline-none transition-colors hover:border-stone-900 focus-visible:ring-2 focus-visible:ring-[#7a3b12]">
            Wind them back
          </button>
        )}
      </div>
    </div>
  );
}

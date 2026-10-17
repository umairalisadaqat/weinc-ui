import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// The pencils in the roll, left to right. `name` is stamped on the barrel and written under each swatch.
const pencils = [
  { name: "Lemon", rgb: [244, 212, 44] },
  { name: "Tangerine", rgb: [240, 136, 34] },
  { name: "Poppy", rgb: [214, 48, 44] },
  { name: "Raspberry", rgb: [198, 40, 106] },
  { name: "Violet", rgb: [112, 66, 172] },
  { name: "Cobalt", rgb: [40, 86, 192] },
  { name: "Lagoon", rgb: [28, 158, 196] },
  { name: "Viridian", rgb: [22, 140, 104] },
  { name: "Leaf", rgb: [112, 162, 50] },
  { name: "Walnut", rgb: [114, 76, 50] },
];
const START = [7, 1]; // swatches already on the card; the last one is the selected pencil
const DEMO = [3, 5, 0, 8, 2, 6, 9, 4]; // picked in this order until a visitor chooses

const layoutFor = (wide: boolean) =>
  wide
    ? { W: 880, H: 520, roll: { x: 64, y: 50, w: 408, h: 410 }, pitch: 36, pw: 23, len: 256, tip: 94, pocket: 282, card: { x: 536, y: 146, w: 296, h: 220 }, hold: -0.4, strap: true }
    : { W: 380, H: 640, roll: { x: 6, y: 250, w: 368, h: 370 }, pitch: 34, pw: 21.5, len: 232, tip: 290, pocket: 456, card: { x: 30, y: 22, w: 320, h: 198 }, hold: -0.34, strap: false };
type Layout = ReturnType<typeof layoutFor>;
const pencilX = (L: Layout, i: number) => L.roll.x + (L.roll.w - pencils.length * L.pitch) / 2 + L.pitch * (i + 0.5);
const hexOf = (c: number[]) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
const RAISE = 30;
const M = 44; // spare canvas around the scene so shadows and a tilted pencil are never cut off // how far the chosen pencil stands proud of the others

export default function ColouredPencilRollColourPicker() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const [wide, setWide] = useState(true);
  const [sel, setSel] = useState(START[START.length - 1]);
  const selRef = useRef(START[START.length - 1]);
  const [live, setLive] = useState(false);
  const user = useRef(false);
  const api = useRef<{ pick: (i: number) => void } | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWide(el.clientWidth >= 760));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const L = layoutFor(wide), R = L.roll, C = L.card, n = pencils.length;
    let px = 1, seed = 31;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const pocketBot = R.y + R.h - 13, clear = L.tip + L.len - L.pocket + 10; // how far a pencil must rise to leave its pocket

    const bg = document.createElement("canvas"), fg = document.createElement("canvas"), scr = document.createElement("canvas"), tooth = document.createElement("canvas"), tmp = document.createElement("canvas"), old = document.createElement("canvas");
    const weave = document.createElement("canvas"), grainT = document.createElement("canvas");
    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };

    // Two small tiles: the plain weave of waxed canvas, and the fine grain of the card.
    const makeTiles = () => {
      weave.width = weave.height = 96; grainT.width = grainT.height = 128;
      const w = weave.getContext("2d"), g = grainT.getContext("2d");
      if (!w || !g) return;
      const wi = w.createImageData(96, 96), gi = g.createImageData(128, 128);
      for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) {
        const o = (y * 96 + x) * 4, over = (Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0;
        const v = (over ? 7 : -5) + (x % 2 === 0 ? 3 : -2) + (y % 2 === 0 ? 2 : -2) + (rand() - 0.5) * 11;
        wi.data[o] = 43 + v; wi.data[o + 1] = 47 + v; wi.data[o + 2] = 56 + v; wi.data[o + 3] = 255;
      }
      for (let i = 0; i < 128 * 128; i++) { const v = (rand() - 0.5) * 10; gi.data[i * 4] = 247 + v; gi.data[i * 4 + 1] = 243 + v; gi.data[i * 4 + 2] = 234 + v; gi.data[i * 4 + 3] = 255; }
      w.putImageData(wi, 0, 0); g.putImageData(gi, 0, 0);
    };
    const cloth = (c: CanvasRenderingContext2D) => { const p = c.createPattern(weave, "repeat"); if (p) { p.setTransform(new DOMMatrix().scale(0.5, 0.5)); c.fillStyle = p; } else c.fillStyle = "#2b2f38"; };
    const stitch = (c: CanvasRenderingContext2D, pts: number[][]) => {
      c.save(); c.lineCap = "round"; c.setLineDash([4.2, 3.2]);
      c.lineWidth = 1.5; c.strokeStyle = "rgba(0,0,0,0.5)"; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0] + 0.6, p[1] + 0.9) : c.moveTo(p[0] + 0.6, p[1] + 0.9))); c.stroke();
      c.lineWidth = 1.25; c.strokeStyle = "#ddd2b9"; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
      c.restore();
    };

    const cardFace = (c: CanvasRenderingContext2D, x: number, y: number) => {
      c.beginPath(); rr(c, x, y, C.w, C.h, 4); const p = c.createPattern(grainT, "repeat"); if (p) { p.setTransform(new DOMMatrix().scale(0.5, 0.5)); c.fillStyle = p; } else c.fillStyle = "#f7f3ea"; c.fill();
      const lg = c.createLinearGradient(x, y, x + C.w, y + C.h); lg.addColorStop(0, "rgba(255,255,255,0.35)"); lg.addColorStop(1, "rgba(120,100,70,0.08)"); c.fillStyle = lg; c.fill();
      c.fillStyle = "rgba(70,74,84,0.72)"; c.font = "600 6.6px ui-monospace, SFMono-Regular, Menlo, monospace"; c.textBaseline = "alphabetic"; c.textAlign = "left";
      c.fillText("S W A T C H   C A R D", x + 14, y + 19); c.textAlign = "right"; c.fillText("2 4 0  G S M", x + C.w - 14, y + 19); c.textAlign = "left";
      c.fillStyle = "rgba(70,74,84,0.3)"; c.fillRect(x + 14, y + 25, C.w - 28, 0.7);
    };
    const paintScene = () => {
      const c = bg.getContext("2d"), f = fg.getContext("2d");
      if (!c || !f) return;
      bg.width = fg.width = cv.width; bg.height = fg.height = cv.height;
      c.setTransform(px, 0, 0, px, M * px, M * px); f.setTransform(px, 0, 0, px, M * px, M * px);
      // the roll
      c.save(); c.shadowColor = "rgba(70,50,30,0.5)"; c.shadowBlur = 36 * px; c.shadowOffsetX = 10 * px; c.shadowOffsetY = 24 * px; c.beginPath(); rr(c, R.x, R.y, R.w, R.h, 12); c.fillStyle = "#2b2f38"; c.fill(); c.restore();
      c.save(); c.shadowColor = "rgba(40,28,16,0.6)"; c.shadowBlur = 4 * px; c.shadowOffsetX = 1 * px; c.shadowOffsetY = 3 * px; c.beginPath(); rr(c, R.x, R.y, R.w, R.h, 12); c.fillStyle = "#2b2f38"; c.fill(); c.restore();
      c.beginPath(); rr(c, R.x, R.y, R.w, R.h, 12); cloth(c); c.fill();
      const lit = c.createLinearGradient(R.x, R.y, R.x + R.w, R.y + R.h); lit.addColorStop(0, "rgba(255,255,255,0.13)"); lit.addColorStop(0.45, "rgba(255,255,255,0.02)"); lit.addColorStop(1, "rgba(0,0,0,0.3)");
      c.fillStyle = lit; c.fill();
      c.save(); c.beginPath(); rr(c, R.x, R.y, R.w, R.h, 12); c.clip();
      // waxed canvas keeps a pale mark wherever it has been folded
      for (let k = 0; k < 16; k++) {
        const x0 = R.x + rand() * R.w, y0 = R.y + rand() * R.h, a = rand() * Math.PI, len = 50 + rand() * 150;
        c.strokeStyle = `rgba(226,232,244,${0.035 + rand() * 0.06})`; c.lineWidth = 0.6 + rand() * 1.4;
        c.beginPath(); c.moveTo(x0, y0); c.bezierCurveTo(x0 + Math.cos(a) * len * 0.3 + (rand() - 0.5) * 22, y0 + Math.sin(a) * len * 0.3 + (rand() - 0.5) * 22, x0 + Math.cos(a) * len * 0.7 + (rand() - 0.5) * 22, y0 + Math.sin(a) * len * 0.7 + (rand() - 0.5) * 22, x0 + Math.cos(a) * len, y0 + Math.sin(a) * len); c.stroke();
      }
      for (const fx of [R.x + R.w * 0.335, R.x + R.w * 0.668]) { const g = c.createLinearGradient(fx - 7, 0, fx + 7, 0); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.45, "rgba(0,0,0,0.22)"); g.addColorStop(0.55, "rgba(235,240,250,0.11)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.fillRect(fx - 7, R.y, 14, R.h); }
      c.restore();
      c.beginPath(); rr(c, R.x + 0.6, R.y + 0.6, R.w - 1.2, R.h - 1.2, 11.5); c.lineWidth = 1; c.strokeStyle = "rgba(255,255,255,0.16)"; c.stroke();
      stitch(c, [[R.x + 14, R.y + 8], [R.x + R.w - 14, R.y + 8]]); stitch(c, [[R.x + 8, R.y + 14], [R.x + 8, R.y + R.h - 14]]); stitch(c, [[R.x + R.w - 8, R.y + 14], [R.x + R.w - 8, R.y + R.h - 14]]);
      // leather strap that ties the roll shut, sewn on at the edge
      if (L.strap) {
        const sy = R.y + 150, ex = R.x + 30;
        const shape = () => { c.beginPath(); c.moveTo(ex - 2, sy - 9); c.lineTo(26, sy - 9); c.quadraticCurveTo(10, sy - 6, 6, sy); c.quadraticCurveTo(10, sy + 6, 26, sy + 9); c.lineTo(ex - 2, sy + 9); c.quadraticCurveTo(ex, sy + 9, ex, sy + 7); c.lineTo(ex, sy - 7); c.quadraticCurveTo(ex, sy - 9, ex - 2, sy - 9); c.closePath(); };
        c.save(); c.shadowColor = "rgba(40,26,12,0.5)"; c.shadowBlur = 7 * px; c.shadowOffsetX = 2 * px; c.shadowOffsetY = 5 * px; shape(); c.fillStyle = "#a9743d"; c.fill(); c.restore();
        const lg = c.createLinearGradient(0, sy - 9, 0, sy + 9); lg.addColorStop(0, "#cf9960"); lg.addColorStop(0.45, "#b07a42"); lg.addColorStop(1, "#80532a"); shape(); c.fillStyle = lg; c.fill();
        c.lineWidth = 1; c.strokeStyle = "rgba(60,34,10,0.6)"; c.stroke();
        c.strokeStyle = "rgba(255,230,190,0.45)"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(ex - 3, sy - 7.4); c.lineTo(27, sy - 7.4); c.stroke();
        for (const hx of [22, 33, 44]) { c.beginPath(); c.arc(hx, sy, 1.7, 0, Math.PI * 2); c.fillStyle = "#33200e"; c.fill(); c.beginPath(); c.arc(hx + 0.3, sy + 0.4, 1.7, 0.2, 2.2); c.strokeStyle = "rgba(255,226,180,0.5)"; c.lineWidth = 0.5; c.stroke(); }
        c.save(); c.setLineDash([2.6, 2.2]); c.lineCap = "round"; c.lineWidth = 0.9; c.strokeStyle = "#f0dfbe"; c.strokeRect(R.x + 5, sy - 5.6, 20, 11.2); c.restore();
      }
      // spare cards under the one in use
      for (const [dx, dy, a] of [[7, 8, 0.045], [-5, 5, -0.03]]) {
        c.save(); c.translate(C.x + C.w / 2 + dx, C.y + C.h / 2 + dy); c.rotate(a);
        c.shadowColor = "rgba(70,50,30,0.3)"; c.shadowBlur = 10 * px; c.shadowOffsetX = 3 * px; c.shadowOffsetY = 6 * px;
        c.beginPath(); rr(c, -C.w / 2, -C.h / 2, C.w, C.h, 4); c.fillStyle = "#efeadf"; c.fill(); c.restore();
      }
      c.save(); c.shadowColor = "rgba(70,50,30,0.35)"; c.shadowBlur = 14 * px; c.shadowOffsetX = 4 * px; c.shadowOffsetY = 8 * px; c.beginPath(); rr(c, C.x, C.y, C.w, C.h, 4); c.fillStyle = "#f7f3ea"; c.fill(); c.restore();
      cardFace(c, C.x, C.y);
      // the pocket: a second layer of cloth stitched into ten sleeves, drawn over the pencils
      const top = () => { f.beginPath(); f.moveTo(R.x + 5, pocketBot); f.lineTo(R.x + 5, L.pocket + 2); for (let i = 0; i < n; i++) { const x = pencilX(L, i); f.lineTo(x - L.pitch / 2, L.pocket + 2); f.quadraticCurveTo(x, L.pocket - 3.5, x + L.pitch / 2, L.pocket + 2); } f.lineTo(R.x + R.w - 5, L.pocket + 2); f.lineTo(R.x + R.w - 5, pocketBot); f.closePath(); };
      const ao = f.createLinearGradient(0, L.pocket - 9, 0, L.pocket + 2); ao.addColorStop(0, "rgba(0,0,0,0)"); ao.addColorStop(1, "rgba(0,0,0,0.5)"); f.fillStyle = ao; f.fillRect(R.x + 6, L.pocket - 9, R.w - 12, 12);
      f.save(); f.shadowColor = "rgba(0,0,0,0.5)"; f.shadowBlur = 5 * px; f.shadowOffsetY = -1 * px; top(); cloth(f); f.fill(); f.restore();
      top(); f.fillStyle = "rgba(255,255,255,0.05)"; f.fill();
      f.save(); top(); f.clip();
      for (let i = 0; i < n; i++) {
        const x = pencilX(L, i), g = f.createLinearGradient(x - L.pitch / 2, 0, x + L.pitch / 2, 0);
        g.addColorStop(0, "rgba(0,0,0,0.5)"); g.addColorStop(0.16, "rgba(0,0,0,0.16)"); g.addColorStop(0.36, "rgba(235,240,255,0.14)"); g.addColorStop(0.56, "rgba(235,240,255,0.05)"); g.addColorStop(0.84, "rgba(0,0,0,0.2)"); g.addColorStop(1, "rgba(0,0,0,0.52)");
        f.fillStyle = g; f.fillRect(x - L.pitch / 2, L.pocket - 6, L.pitch, pocketBot - L.pocket + 6);
        const end = L.tip + L.len, eg = f.createLinearGradient(0, end - 5, 0, end + 14); eg.addColorStop(0, "rgba(0,0,0,0)"); eg.addColorStop(0.4, "rgba(0,0,0,0.3)"); eg.addColorStop(1, "rgba(0,0,0,0.12)");
        f.fillStyle = eg; f.fillRect(x - L.pitch / 2 + 4, end - 5, L.pitch - 8, pocketBot - end + 5);
      }
      const hem = f.createLinearGradient(0, L.pocket - 4, 0, L.pocket + 13); hem.addColorStop(0, "rgba(255,255,255,0.2)"); hem.addColorStop(0.7, "rgba(255,255,255,0.03)"); hem.addColorStop(0.75, "rgba(0,0,0,0.3)"); hem.addColorStop(1, "rgba(0,0,0,0)"); f.fillStyle = hem; f.fillRect(R.x, L.pocket - 4, R.w, 17);
      const low = f.createLinearGradient(0, pocketBot - 60, 0, pocketBot); low.addColorStop(0, "rgba(0,0,0,0)"); low.addColorStop(1, "rgba(0,0,0,0.3)"); f.fillStyle = low; f.fillRect(R.x, pocketBot - 60, R.w, 60);
      f.restore();
      const hemLine: number[][] = []; for (let i = 0; i < n; i++) { const x = pencilX(L, i); hemLine.push([x - L.pitch / 2 + 2, L.pocket + 7.5], [x, L.pocket + 3.6], [x + L.pitch / 2 - 2, L.pocket + 7.5]); }
      stitch(f, hemLine);
      for (let i = 0; i <= n; i++) { const x = pencilX(L, 0) - L.pitch / 2 + i * L.pitch; stitch(f, [[x, L.pocket + 11], [x, pocketBot - 6]]); }
      stitch(f, [[R.x + 14, pocketBot - 3], [R.x + R.w - 14, pocketBot - 3]]);
    };

    const buildTooth = () => {
      const w = Math.round(C.w * px), h = Math.round(C.h * px);
      scr.width = tooth.width = tmp.width = old.width = w; scr.height = tooth.height = tmp.height = old.height = h;
      const t = tooth.getContext("2d");
      if (!t) return;
      const im = t.createImageData(w, h), sm = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) sm[i] = rand();
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, a = (sm[i] * 2 + sm[y * w + Math.max(0, x - 1)] + sm[Math.max(0, y - 1) * w + x] + sm[Math.max(0, y - 1) * w + Math.max(0, x - 1)]) / 5;
        im.data[i * 4 + 3] = Math.max(0, Math.min(1, (a - 0.5) * 4.4)) * 215;
      }
      t.putImageData(im, 0, 0);
    };

    // ---- swatches on the card ----
    type Slot = { i: number; u: number; ink: number; pts: number[][]; len: number };
    let slots: Slot[] = [];
    const pathFor = (k: number, sd: number) => {
      let s = sd * 7919 + 13; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      const bw = C.w / 3 - 20, bx = C.x + (C.w / 3) * k + 10, by = C.y + 40, bh = C.h - 96, N = 19, pts: number[][] = [];
      for (let m = 0; m <= N; m++) { const f = m / N, up = m % 2 === 1; pts.push([bx + f * (bw - 12) + (up ? 12 : 0) + (rnd() - 0.5) * 4, up ? by + rnd() * 9 : by + bh - rnd() * 9]); }
      let len = 0; for (let m = 1; m < pts.length; m++) len += Math.hypot(pts[m][0] - pts[m - 1][0], pts[m][1] - pts[m - 1][1]);
      return { pts, len };
    };
    const addSlot = (i: number, u: number) => { const p = pathFor(slots.length, i + slots.length * 3); slots.push({ i, u, ink: u, pts: p.pts, len: p.len }); };
    const tipAt = (s: Slot, u: number) => {
      let left = s.len * u;
      for (let m = 1; m < s.pts.length; m++) { const a = s.pts[m - 1], b = s.pts[m], d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (left <= d) return [a[0] + ((b[0] - a[0]) * left) / d, a[1] + ((b[1] - a[1]) * left) / d]; left -= d; }
      return s.pts[s.pts.length - 1];
    };
    const drawSlot = (c: CanvasRenderingContext2D, s: Slot) => {
      const col = pencils[s.i].rgb, trace = (dx: number, dy: number) => {
        let left = s.len * s.u; c.beginPath(); c.moveTo(s.pts[0][0] - C.x + dx, s.pts[0][1] - C.y + dy);
        for (let m = 1; m < s.pts.length && left > 0; m++) { const a = s.pts[m - 1], b = s.pts[m], d = Math.hypot(b[0] - a[0], b[1] - a[1]), f = Math.min(1, left / d); c.lineTo(a[0] + (b[0] - a[0]) * f - C.x + dx, a[1] + (b[1] - a[1]) * f - C.y + dy); left -= d; }
      };
      c.lineJoin = "round"; c.lineCap = "round";
      c.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},0.58)`; c.lineWidth = 6.6; trace(0, 0); c.stroke();
      c.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},0.6)`; c.lineWidth = 3.4; trace(0.5, 0.3); c.stroke();
      c.strokeStyle = `rgba(${Math.round(col[0] * 0.8)},${Math.round(col[1] * 0.8)},${Math.round(col[2] * 0.8)},0.5)`; c.lineWidth = 1.3; trace(-0.9, 0.5); c.stroke();
    };
    const redrawScr = () => {
      const c = scr.getContext("2d");
      if (!c) return;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, scr.width, scr.height); c.setTransform(px, 0, 0, px, 0, 0);
      for (const s of slots) if (s.u > 0) drawSlot(c, s);
    };
    const inked = (target: CanvasRenderingContext2D, x: number, y: number) => {
      const t = tmp.getContext("2d");
      if (!t) return;
      t.globalCompositeOperation = "source-over"; t.clearRect(0, 0, tmp.width, tmp.height); t.drawImage(scr, 0, 0);
      t.globalCompositeOperation = "destination-out"; t.drawImage(tooth, 0, 0); t.globalCompositeOperation = "source-over";
      target.globalCompositeOperation = "multiply"; target.drawImage(tmp, x, y, C.w, C.h); target.globalCompositeOperation = "source-over";
      target.textAlign = "center"; target.textBaseline = "alphabetic"; target.font = "italic 14px 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive";
      slots.forEach((s, k) => { if (s.ink <= 0) return; target.fillStyle = `rgba(74,76,86,${0.86 * s.ink})`; target.fillText(pencils[s.i].name, x + (C.w / 3) * (k + 0.5), y + C.h - 30, C.w / 3 - 12); target.fillStyle = `rgba(74,76,86,${0.5 * s.ink})`; target.font = "600 6.4px ui-monospace, SFMono-Regular, Menlo, monospace"; target.fillText(hexOf(pencils[s.i].rgb).split("").join(" "), x + (C.w / 3) * (k + 0.5), y + C.h - 17); target.font = "italic 14px 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive"; });
      target.textAlign = "left";
    };

    // ---- a pencil ----
    const shadeOf = (c: number[], k: number, lift = 0) => `rgb(${c.map((v) => Math.max(0, Math.min(255, Math.round(v * k + lift)))).join(",")})`;
    const drawPencil = (i: number, x: number, y: number, rot: number, lift: number) => {
      const c = ctx, col = pencils[i].rgb, w = L.pw, h = w / 2, q = w / 4, len = L.len;
      const barrel = () => { c.beginPath(); c.moveTo(-h, 36); c.quadraticCurveTo(-h + q / 2, 27.5, -q, 35); c.quadraticCurveTo(0, 24, q, 35); c.quadraticCurveTo(h - q / 2, 27.5, h, 36); c.lineTo(h, len - 3); c.quadraticCurveTo(h, len, h - 3, len); c.lineTo(-h + 3, len); c.quadraticCurveTo(-h, len, -h, len - 3); c.closePath(); };
      c.save(); c.translate(x, y); c.rotate(rot);
      c.save(); c.shadowColor = "rgba(0,0,0,0.55)"; c.shadowBlur = (4 + 13 * lift) * px; c.shadowOffsetX = (2.5 + 9 * lift) * px; c.shadowOffsetY = (3 + 16 * lift) * px; c.fillStyle = "#222";
      c.beginPath(); c.moveTo(-0.8, 0); c.lineTo(0.8, 0); c.lineTo(h, 36); c.lineTo(h, len); c.lineTo(-h, len); c.lineTo(-h, 36); c.closePath(); c.fill(); c.restore();
      // sharpened cedar
      const wood = c.createLinearGradient(-h, 0, h, 0); wood.addColorStop(0, "#d9b47e"); wood.addColorStop(0.3, "#f2d9ae"); wood.addColorStop(0.55, "#dcb682"); wood.addColorStop(1, "#a97c48");
      c.beginPath(); c.moveTo(-2.3, 10); c.lineTo(2.3, 10); c.lineTo(h, 37); c.lineTo(-h, 37); c.closePath(); c.fillStyle = wood; c.fill();
      c.save(); c.clip(); c.lineWidth = 0.4; for (let g = -4; g <= 4; g++) { c.strokeStyle = g % 2 ? "rgba(120,80,40,0.22)" : "rgba(255,240,210,0.25)"; c.beginPath(); c.moveTo(g * 0.5, 10); c.lineTo(g * (h / 4.4), 37); c.stroke(); } c.restore();
      // the core
      const core = c.createLinearGradient(-2.4, 0, 2.4, 0); core.addColorStop(0, shadeOf(col, 0.95, 20)); core.addColorStop(0.35, shadeOf(col, 1, 46)); core.addColorStop(0.6, shadeOf(col, 0.9)); core.addColorStop(1, shadeOf(col, 0.6));
      c.beginPath(); c.moveTo(-0.9, 0.4); c.quadraticCurveTo(0, -0.5, 0.9, 0.4); c.lineTo(2.4, 10.4); c.quadraticCurveTo(0, 11.6, -2.4, 10.4); c.closePath(); c.fillStyle = core; c.fill();
      // lacquered hexagonal barrel: three faces show, each catching the lamp differently
      const face = c.createLinearGradient(-h, 0, h, 0);
      face.addColorStop(0, shadeOf(col, 1.05, 34)); face.addColorStop(0.25, shadeOf(col, 1.02, 16)); face.addColorStop(0.25, shadeOf(col, 0.98, 4)); face.addColorStop(0.5, shadeOf(col, 0.94)); face.addColorStop(0.75, shadeOf(col, 0.86)); face.addColorStop(0.75, shadeOf(col, 0.62)); face.addColorStop(1, shadeOf(col, 0.44));
      barrel(); c.fillStyle = face; c.fill();
      c.save(); barrel(); c.clip();
      const gl = c.createLinearGradient(-q, 0, -q + 5, 0); gl.addColorStop(0, "rgba(255,255,255,0.75)"); gl.addColorStop(0.3, "rgba(255,255,255,0.28)"); gl.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gl; c.fillRect(-q, 24, 5, len);
      c.fillStyle = "rgba(255,255,255,0.3)"; c.fillRect(-h + 0.9, 24, 1.1, len); c.fillStyle = "rgba(0,0,0,0.3)"; c.fillRect(q - 0.4, 24, 0.8, len);
      c.fillStyle = shadeOf(col, 0.42); c.fillRect(-h, len - 15, w, 15); c.fillStyle = "rgba(255,255,255,0.22)"; c.fillRect(-q, len - 15, 3.5, 15);
      const gold = c.createLinearGradient(-h, 0, h, 0); gold.addColorStop(0, "#f8e7a8"); gold.addColorStop(0.3, "#e6c66a"); gold.addColorStop(0.76, "#b08a30"); gold.addColorStop(1, "#6f5416"); c.fillStyle = gold; c.fillRect(-h, len - 18.4, w, 2.8);
      c.save(); c.translate(1.6, 62); c.rotate(Math.PI / 2); c.fillStyle = "rgba(246,226,160,0.92)"; c.textBaseline = "middle"; c.textAlign = "left";
      c.font = `700 ${w * 0.3}px Georgia, 'Times New Roman', serif`; c.fillText(`TALLOW HILL  ${String(i + 1).padStart(2, "0")}  ${pencils[i].name.toUpperCase()}`, 0, 0); c.restore();
      c.restore();
      barrel(); c.lineWidth = 0.5; c.strokeStyle = "rgba(0,0,0,0.42)"; c.stroke();
      c.restore();
    };

    // ---- state ----
    const raise: number[] = pencils.map((_, i) => (i === selRef.current ? RAISE : 0));
    let act = -1, phase = 0, bp = 0, pending = -1, slot: Slot | null = null;
    const fly = { x: 0, y: 0, r: 0, lift: 0 }; let from = { ...fly };
    let swap = 0; // 0 = no card leaving; otherwise progress of the old card sliding away
    const ease = (p: number) => p * p * (3 - 2 * p);
    const snapshot = () => { const o = old.getContext("2d"); if (!o) return; o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, old.width, old.height); o.setTransform(px, 0, 0, px, 0, 0); cardFace(o, 0, 0); inked(o, 0, 0); };
    const begin = (i: number) => {
      act = i; phase = 1; bp = 0;
      if (slots.length >= 3) { snapshot(); slots = []; redrawScr(); swap = 0.001; }
      addSlot(i, 0); slot = slots[slots.length - 1];
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(bg, 0, 0);
      ctx.setTransform(px, 0, 0, px, M * px, M * px);
      for (let i = 0; i < n; i++) if (!(i === act && phase >= 2 && phase <= 4)) drawPencil(i, pencilX(L, i), L.tip - raise[i], 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(fg, 0, 0); ctx.setTransform(px, 0, 0, px, M * px, M * px);
      inked(ctx, C.x, C.y);
      if (swap > 0) { const e = ease(swap); ctx.save(); ctx.globalAlpha = 1 - e * e; ctx.translate(C.x + C.w / 2 + e * 150, C.y + C.h / 2 - e * 46); ctx.rotate(e * 0.3); ctx.shadowColor = "rgba(70,50,30,0.35)"; ctx.shadowBlur = 16 * px; ctx.shadowOffsetY = 10 * px; ctx.drawImage(old, -C.w / 2, -C.h / 2, C.w, C.h); ctx.restore(); }
      if (act >= 0 && phase >= 2 && phase <= 4) drawPencil(act, fly.x, fly.y, fly.r, fly.lift);
    };

    const step = (dt: number) => {
      let busy = false;
      for (let i = 0; i < n; i++) {
        if (i === act && phase > 0) continue;
        const want = i === selRef.current ? RAISE : 0;
        if (Math.abs(raise[i] - want) > 0.05) { raise[i] += (want - raise[i]) * Math.min(1, dt * 11); busy = true; } else raise[i] = want;
      }
      if (swap > 0) { swap = Math.min(1, swap + dt / 0.5); if (swap >= 1) swap = 0; busy = true; }
      for (const s of slots) if (s.u >= 1 && s.ink < 1) { s.ink = Math.min(1, s.ink + dt / 0.5); busy = true; }
      if (act < 0 && pending >= 0) { const i = pending; pending = -1; begin(i); }
      if (act >= 0 && slot) {
        busy = true;
        const x0 = pencilX(L, act), dur = [0, 0.26, 0.4, 1.05, 0.4, 0.3][phase];
        bp = Math.min(1, bp + dt / dur); const e = ease(bp), start = tipAt(slot, 0);
        if (phase === 1) raise[act] += (clear - raise[act]) * Math.min(1, e * 1.4);
        else if (phase === 2) { fly.x = x0 + (start[0] - x0) * e; fly.y = L.tip - clear + (start[1] - (L.tip - clear)) * e; fly.r = L.hold * e; fly.lift = Math.sin(Math.PI * bp) * 0.9 + 0.1 * e; }
        else if (phase === 3) { slot.u = bp; const p = tipAt(slot, bp); fly.x = p[0]; fly.y = p[1]; fly.r = L.hold + Math.sin(bp * 60) * 0.035; fly.lift = 0.1; redrawScr(); }
        else if (phase === 4) { fly.x = from.x + (x0 - from.x) * e; fly.y = from.y + (L.tip - clear - from.y) * e; fly.r = from.r * (1 - e); fly.lift = Math.sin(Math.PI * bp) * 0.9 + 0.1 * (1 - e); }
        else { const want = act === selRef.current ? RAISE : 0; raise[act] = clear + (want - clear) * e; }
        if (bp >= 1) {
          bp = 0; from = { ...fly };
          if (phase === 3) { slot.u = 1; redrawScr(); }
          phase++;
          if (phase > 5) { act = -1; phase = 0; slot = null; }
        }
      }
      return busy;
    };

    let raf = 0, last = 0, t0 = 0, seen = true, nextDemo = 0.55, demoAt = 0, needDraw = true;
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      if (!user.current && t > nextDemo && act < 0) { const i = DEMO[demoAt++ % DEMO.length]; selRef.current = i; setSel(i); begin(i); nextDemo = t + 4.6; }
      const busy = step(dt);
      if (busy || needDraw) { draw(); needDraw = false; }
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    START.forEach((i) => addSlot(i, 1));
    const size = () => {
      const b = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      if (!b.width) return;
      cv.width = Math.round(b.width * dpr); cv.height = Math.round((b.width * dpr * (L.H + M * 2)) / (L.W + M * 2));
      px = cv.width / (L.W + M * 2); seed = 31; makeTiles(); paintScene(); buildTooth(); redrawScr(); needDraw = true;
      if (reduce) draw();
    };
    size();
    const ro = new ResizeObserver(size); ro.observe(cv);

    api.current = {
      pick: (i) => {
        if (reduce) { if (slots.length >= 3) slots = []; addSlot(i, 1); pencils.forEach((_, j) => { raise[j] = j === i ? RAISE : 0; }); redrawScr(); draw(); return; }
        if (act < 0) begin(i); else pending = i;
        wake();
      },
    };
    if (reduce) draw(); else wake();
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, [wide]);

  const L = layoutFor(wide);
  const choose = (i: number) => {
    user.current = true; setLive(true);
    if (selRef.current === i) return;
    selRef.current = i; setSel(i); api.current?.pick(i);
  };
  const onKey = (e: ReactKeyboardEvent, i: number) => {
    const n = pencils.length;
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % n : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i + n - 1) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault(); choose(next); radios.current[next]?.focus();
  };

  return (
    <div ref={root} className="flex min-h-[720px] w-full flex-col overflow-hidden items-center justify-center bg-[#d9c8b6] bg-[radial-gradient(105%_80%_at_50%_36%,#ecdfd0_0%,#d9c8b6_72%)] px-4 py-10">
      <div className={`relative w-full ${wide ? "max-w-[940px]" : "max-w-[440px]"}`} style={{ aspectRatio: `${L.W} / ${L.H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute" style={{ left: `${(-M / L.W) * 100}%`, top: `${(-M / L.H) * 100}%`, width: `${((L.W + M * 2) / L.W) * 100}%`, height: `${((L.H + M * 2) / L.H) * 100}%` }} />
        <div role="radiogroup" aria-label="Pencil colour">
          {pencils.map((p, i) => {
            const x = pencilX(L, i) - L.pitch / 2, y = L.tip - RAISE - 4, h = L.roll.y + L.roll.h - 10 - y;
            return (
              <button
                key={p.name}
                ref={(el) => { radios.current[i] = el; }}
                type="button"
                role="radio"
                aria-checked={sel === i}
                aria-label={p.name}
                tabIndex={sel === i ? 0 : -1}
                onClick={() => choose(i)}
                onKeyDown={(e) => onKey(e, i)}
                className="absolute cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-[#2b2f38]"
                style={{ left: `${(x / L.W) * 100}%`, top: `${(y / L.H) * 100}%`, width: `${(L.pitch / L.W) * 100}%`, height: `${(h / L.H) * 100}%` }}
              />
            );
          })}
        </div>
      </div>
      <output aria-live={live ? "polite" : "off"} className="mt-6 flex min-h-[24px] items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[#5a4a3c]">
        <span aria-hidden="true" className="h-4 w-4 rounded-full ring-1 ring-black/20" style={{ backgroundColor: hexOf(pencils[sel].rgb) }} />
        <span className="text-[#2a211a]">{pencils[sel].name}</span>
        <span className="text-[#8a7867]">/</span>
        {hexOf(pencils[sel].rgb)}
      </output>
    </div>
  );
}

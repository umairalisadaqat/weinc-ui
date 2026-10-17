import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// The twelve half pans, left to right, top row first. `rgb` is the colour of one even wash on white paper.
const pans = [
  { name: "Lemon Yellow", rgb: [246, 220, 62] },
  { name: "Gamboge", rgb: [240, 166, 34] },
  { name: "Vermilion", rgb: [222, 74, 44] },
  { name: "Alizarin Crimson", rgb: [178, 32, 64] },
  { name: "Quinacridone Rose", rgb: [216, 62, 122] },
  { name: "Dioxazine Violet", rgb: [96, 58, 146] },
  { name: "Ultramarine", rgb: [46, 68, 172] },
  { name: "Cerulean Blue", rgb: [44, 134, 194] },
  { name: "Cobalt Teal", rgb: [34, 164, 162] },
  { name: "Viridian", rgb: [24, 124, 98] },
  { name: "Sap Green", rgb: [100, 144, 54] },
  { name: "Burnt Sienna", rgb: [152, 76, 38] },
];
const START = 1; // the pan that is already on the paper at load
const DEMO = [4, 7, 9, 2, 5, 10, 0, 6]; // what the brush picks by itself until someone chooses
const COLS = 6;
const M = 40; // spare canvas around the scene so soft shadows are never cut off

const layoutFor = (wide: boolean) =>
  wide
    ? { W: 860, H: 560, tin: { x: 60, y: 144, w: 300, lid: 132 }, pw: 46, ph: 56, paper: { x: 470, y: 84, w: 326, h: 392, r: -0.035 }, rest: { x: 414, y: 484, a: -Math.PI / 2 + 0.03 }, use: -0.92, len: 1.28 }
    : { W: 380, H: 650, tin: { x: 22, y: 14, w: 336, lid: 92 }, pw: 52, ph: 56, paper: { x: 38, y: 290, w: 304, h: 292, r: -0.025 }, rest: { x: 64, y: 624, a: 0 }, use: 1.36, len: 0.8 };
type Layout = ReturnType<typeof layoutFor>;
const panBox = (L: Layout, i: number) => ({ x: L.tin.x + (L.tin.w - COLS * L.pw) / 2 + (i % COLS) * L.pw, y: L.tin.y + L.tin.lid + 18 + Math.floor(i / COLS) * L.ph, w: L.pw, h: L.ph });
const hexOf = (c: number[]) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();

export default function WatercolourPanTinColourPicker() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const [wide, setWide] = useState(true);
  const [sel, setSel] = useState(START);
  const selRef = useRef(START);
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
    const L = layoutFor(wide), P = L.paper;
    let px = 1;
    const wash = { x: 30, y: 32, w: P.w - 60, h: P.h - 124 }; // the painted patch, in paper coordinates

    // Smooth noise: paper tooth, the wobble of a wet edge and the uneven front of a bloom all come from this.
    let seed = 23;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const RT = new Float32Array(128 * 128); for (let i = 0; i < RT.length; i++) RT[i] = rand();
    const vn = (x: number, y: number) => {
      const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = RT[(xi & 127) + ((yi & 127) << 7)], b = RT[((xi + 1) & 127) + ((yi & 127) << 7)], c = RT[(xi & 127) + (((yi + 1) & 127) << 7)], d = RT[((xi + 1) & 127) + (((yi + 1) & 127) << 7)];
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };

    // The wash itself is a small grid of how much light each pigment lets through. It is redrawn only while a bloom spreads or dries.
    const FG = 0.7, FM = 22, FW = Math.ceil((wash.w + FM * 2) * FG), FH = Math.ceil((wash.h + FM * 2) * FG), FN = FW * FH;
    const fieldC = document.createElement("canvas"); fieldC.width = FW; fieldC.height = FH;
    const fctx = fieldC.getContext("2d");
    if (!fctx) return;
    const fimg = fctx.createImageData(FW, FH);
    const dens = new Float32Array(FN), arrive = new Float32Array(FN), ko = [new Float32Array(FN), new Float32Array(FN), new Float32Array(FN)];
    const kOf = (i: number) => pans[i].rgb.map((v) => -Math.log(Math.max(6, v) / 255));
    let kn = kOf(selRef.current), bloom = 1, wet = 0, amax = 1, shown = selRef.current, inkIn = 1;
    for (let j = 0; j < FN; j++) {
      const lx = wash.x - FM + ((j % FW) + 0.5) / FG, ly = wash.y - FM + (Math.floor(j / FW) + 0.5) / FG;
      dens[j] = 0.72 + 0.7 * (vn(lx / 38 + 1, ly / 38 + 5) - 0.5) + 0.2 * (vn(lx / 12, ly / 12) - 0.5) + 0.26 * ((ly - wash.y) / wash.h - 0.4);
      for (let c = 0; c < 3; c++) ko[c][j] = kn[c];
    }
    const curve = (m: number) => (m <= 0 ? 0 : m >= 1 ? 1 : m * m * (3 - 2 * m));
    const front = () => (bloom >= 1 ? 1e9 : (amax + 45) * (0.55 * bloom + 0.45 * bloom * bloom * bloom));
    const renderField = () => {
      const R = front(), d = fimg.data, live2 = bloom < 1 ? 1 : 0;
      for (let j = 0; j < FN; j++) {
        const m = curve((R - arrive[j]) / 40), dd = dens[j] * (1 + 0.26 * wet + 0.7 * 4 * m * (1 - m) * (1 - m) * live2), o = j * 4;
        d[o] = 255 * Math.exp(-dd * (ko[0][j] + (kn[0] - ko[0][j]) * m));
        d[o + 1] = 255 * Math.exp(-dd * (ko[1][j] + (kn[1] - ko[1][j]) * m));
        d[o + 2] = 255 * Math.exp(-dd * (ko[2][j] + (kn[2] - ko[2][j]) * m));
        d[o + 3] = 255;
      }
      fctx.putImageData(fimg, 0, 0);
    };
    const startBloom = (i: number, tx: number, ty: number) => {
      const R = front();
      for (let j = 0; j < FN; j++) { const m = curve((R - arrive[j]) / 40); for (let c = 0; c < 3; c++) ko[c][j] += (kn[c] - ko[c][j]) * m; }
      kn = kOf(i); amax = 0; const sd = rand() * 50;
      for (let j = 0; j < FN; j++) {
        const lx = wash.x - FM + ((j % FW) + 0.5) / FG, ly = wash.y - FM + (Math.floor(j / FW) + 0.5) / FG;
        const a = Math.hypot(lx - tx, ly - ty) * (0.6 + 0.5 * vn(lx / 38 + sd, ly / 38) + 0.3 * vn(lx / 15, ly / 15 + sd));
        arrive[j] = a; if (a > amax) amax = a;
      }
      bloom = 0; wet = 1; shown = i; inkIn = 0;
    };

    // Full resolution layers: the sheet, and a grey map of where pigment pools (the hard wet edge and the valleys of the paper).
    const paperC = document.createElement("canvas"), grainC = document.createElement("canvas"), washC = document.createElement("canvas"), bg = document.createElement("canvas");
    const buildPaper = () => {
      const pw = Math.round(P.w * px), ph = Math.round(P.h * px), n = pw * ph;
      paperC.width = grainC.width = washC.width = pw; paperC.height = grainC.height = washC.height = ph;
      const pc = paperC.getContext("2d"), gc = grainC.getContext("2d");
      if (!pc || !gc) return;
      const H = new Float32Array(n), pi = pc.createImageData(pw, ph), gi = gc.createImageData(pw, ph), pd = pi.data, gd = gi.data;
      for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) { const lx = x / px, ly = y / px; H[y * pw + x] = 0.6 * vn(lx / 2.3, ly / 2.3) + 0.32 * vn(lx / 5.6 + 9, ly / 5.6 + 3) + 0.08 * vn(lx / 1.4, ly / 1.4 + 40); }
      const cx = wash.x + wash.w / 2, cy = wash.y + wash.h / 2, hw = wash.w / 2, hh = wash.h / 2, rad = 20;
      for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
        const i = y * pw + x, o = i * 4, lx = x / px, ly = y / px, h = H[i], up = x > 0 && y > 0 ? H[i - pw - 1] : h;
        let v = 1 + (h - up) * 0.2, a = 1; const de = Math.min(lx, ly, P.w - lx, P.h - ly);
        if (de < 8) { a = Math.max(0, Math.min(1, (de - 1.4 - (vn(lx / 7, ly / 7) - 0.5) * 2.6 - (vn(lx * 0.8, ly * 0.8) - 0.5) * 1.5) / 0.9)); v += (1 - de / 8) * 0.025; }
        pd[o] = Math.min(255, 246 * v); pd[o + 1] = Math.min(255, 242 * v); pd[o + 2] = Math.min(255, 232 * v); pd[o + 3] = a * 255;
        const qx = Math.abs(lx - cx) - (hw - rad), qy = Math.abs(ly - cy) - (hh - rad);
        if (qx > 26 || qy > 26) continue;
        const sd = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad + (vn(lx / 26 + 3, ly / 26 + 7) - 0.5) * 15 + (vn(lx / 7.5, ly / 7.5) - 0.5) * 4 + (vn(lx / 1.6, ly / 1.6) - 0.5) * 1.1;
        const al = Math.max(0, Math.min(1, 0.5 - sd / 1.2));
        if (al <= 0) continue;
        const rim = Math.exp(-((sd + 1.9) * (sd + 1.9)) / 4.6), g = Math.max(0.5, Math.min(1, 0.985 - 0.26 * rim - 0.3 * (0.5 - h) - 0.05 * Math.exp(sd / 22)));
        gd[o] = gd[o + 1] = gd[o + 2] = 255 * g; gd[o + 3] = 255 * al;
      }
      pc.putImageData(pi, 0, 0); gc.putImageData(gi, 0, 0);
    };
    const compose = () => {
      const w = washC.getContext("2d");
      if (!w) return;
      w.globalCompositeOperation = "source-over"; w.clearRect(0, 0, washC.width, washC.height);
      w.imageSmoothingEnabled = true; w.imageSmoothingQuality = "high";
      w.drawImage(fieldC, (wash.x - FM) * px, (wash.y - FM) * px, (FW / FG) * px, (FH / FG) * px);
      w.globalCompositeOperation = "multiply"; w.drawImage(grainC, 0, 0);
      w.globalCompositeOperation = "destination-in"; w.drawImage(grainC, 0, 0);
    };

    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    const inset = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, blur: number, ox: number, oy: number, col: string) => {
      c.save(); c.beginPath(); rr(c, x, y, w, h, r); c.clip();
      c.shadowColor = col; c.shadowBlur = blur * px; c.shadowOffsetX = ox * px; c.shadowOffsetY = oy * px;
      c.beginPath(); c.rect(x - 40, y - 40, w + 80, h + 80); rr(c, x, y, w, h, r); c.fillStyle = "#000"; c.fill("evenodd"); c.restore();
    };
    const tinH = L.tin.lid + 8 + L.ph * 2 + 20;
    const cake = (i: number, f: number) => pans[i].rgb.map((v) => Math.round(255 * Math.pow(v / 255, f)));
    const paintScene = () => {
      const c = bg.getContext("2d");
      if (!c) return;
      bg.width = cv.width; bg.height = cv.height; c.setTransform(px, 0, 0, px, M * px, M * px);
      const T = L.tin;
      // the tin: black enamel outside, white inside, lid folded back above the pans
      c.save(); c.shadowColor = "rgba(40,48,36,0.5)"; c.shadowBlur = 34 * px; c.shadowOffsetX = 10 * px; c.shadowOffsetY = 22 * px; c.beginPath(); rr(c, T.x, T.y, T.w, tinH, 14); c.fillStyle = "#17181a"; c.fill(); c.restore();
      c.save(); c.shadowColor = "rgba(20,24,18,0.6)"; c.shadowBlur = 4 * px; c.shadowOffsetY = 3 * px; c.beginPath(); rr(c, T.x, T.y, T.w, tinH, 14); c.fillStyle = "#17181a"; c.fill(); c.restore();
      const sheen = c.createLinearGradient(T.x, T.y, T.x + T.w, T.y + tinH); sheen.addColorStop(0, "#3a3c40"); sheen.addColorStop(0.2, "#1b1c1f"); sheen.addColorStop(0.8, "#0e0f11"); sheen.addColorStop(1, "#060607");
      c.beginPath(); rr(c, T.x, T.y, T.w, tinH, 14); c.fillStyle = sheen; c.fill();
      c.beginPath(); rr(c, T.x + 0.8, T.y + 0.8, T.w - 1.6, tinH - 1.6, 13.2); c.lineWidth = 1; c.strokeStyle = "rgba(255,255,255,0.3)"; c.stroke();
      const halves = [{ y: T.y + 6, h: T.lid - 6 }, { y: T.y + T.lid + 8, h: L.ph * 2 + 14 }];
      for (const h of halves) {
        const fl = c.createLinearGradient(T.x, h.y, T.x + T.w, h.y + h.h); fl.addColorStop(0, "#e8e6df"); fl.addColorStop(0.5, "#f5f4ef"); fl.addColorStop(1, "#fbfaf7");
        c.beginPath(); rr(c, T.x + 6, h.y, T.w - 12, h.h, 9); c.fillStyle = fl; c.fill();
        inset(c, T.x + 6, h.y, T.w - 12, h.h, 9, 7, 3, 4, "rgba(30,30,20,0.6)");
        inset(c, T.x + 6, h.y, T.w - 12, h.h, 9, 2, -1.5, -1.5, "rgba(255,255,255,0.9)");
      }
      // hinge knuckles
      for (const f of [0.22, 0.5, 0.78]) {
        const hx = T.x + T.w * f - 19, hy = T.y + T.lid + 0.5, g = c.createLinearGradient(0, hy, 0, hy + 7); g.addColorStop(0, "#f4f5f6"); g.addColorStop(0.35, "#a9adb2"); g.addColorStop(0.6, "#d9dcdf"); g.addColorStop(1, "#5b5f65");
        c.beginPath(); rr(c, hx, hy, 38, 7, 3.4); c.fillStyle = g; c.fill(); c.lineWidth = 0.5; c.strokeStyle = "rgba(0,0,0,0.6)"; c.stroke();
      }
      // three mixing wells in the lid, with what earlier washes left behind
      const ww = (T.w - 12 - 4 * 9) / 3, wy = T.y + 6 + 9, wh = T.lid - 6 - 18;
      const stains = [[34, 164, 162], [216, 62, 122], [240, 166, 34]];
      for (let k = 0; k < 3; k++) {
        const wx = T.x + 6 + 9 + k * (ww + 9);
        const g = c.createLinearGradient(wx, wy, wx + ww, wy + wh); g.addColorStop(0, "#e4e2da"); g.addColorStop(1, "#f7f6f2");
        c.beginPath(); rr(c, wx, wy, ww, wh, 11); c.fillStyle = g; c.fill();
        c.save(); c.beginPath(); rr(c, wx, wy, ww, wh, 11); c.clip();
        const s = stains[k];
        for (let b = 0; b < 9; b++) {
          const bx = wx + ww * (0.22 + 0.56 * rand()), by = wy + wh * (0.25 + 0.5 * rand()), br = Math.min(ww, wh) * (0.14 + 0.24 * rand()), al = 0.05 + 0.1 * rand();
          const pg = c.createRadialGradient(bx, by, br * 0.1, bx, by, br);
          pg.addColorStop(0, `rgba(${s[0]},${s[1]},${s[2]},${al * 1.5})`); pg.addColorStop(0.55, `rgba(${s[0]},${s[1]},${s[2]},${al})`); pg.addColorStop(1, `rgba(${s[0]},${s[1]},${s[2]},0)`);
          c.save(); c.translate(bx, by); c.rotate(rand() * 3); c.scale(1.3, 0.7 + rand() * 0.3); c.translate(-bx, -by); c.fillStyle = pg; c.fillRect(bx - br, by - br, br * 2, br * 2); c.restore();
        }
        c.restore();
        inset(c, wx, wy, ww, wh, 11, 6, 2.5, 3.5, "rgba(30,30,20,0.55)");
        inset(c, wx, wy, ww, wh, 11, 2, -1.2, -1.2, "rgba(255,255,255,0.95)");
      }
      // the pans
      for (let i = 0; i < pans.length; i++) {
        const b = panBox(L, i), x = b.x + 2.5, y = b.y + 2.5, w = b.w - 5, h = b.h - 5;
        c.save(); c.shadowColor = "rgba(0,0,0,0.35)"; c.shadowBlur = 3 * px; c.shadowOffsetX = 1 * px; c.shadowOffsetY = 1.5 * px; c.beginPath(); rr(c, x, y, w, h, 4.5); c.fillStyle = "#f6f4ee"; c.fill(); c.restore();
        c.beginPath(); rr(c, x + 0.5, y + 0.5, w - 1, h - 1, 4); c.lineWidth = 1; c.strokeStyle = "rgba(255,255,255,0.95)"; c.stroke();
        c.beginPath(); rr(c, x, y, w, h, 4.5); c.lineWidth = 0.5; c.strokeStyle = "rgba(0,0,0,0.3)"; c.stroke();
        const ix = x + 4, iy = y + 4, iw = w - 8, ih = h - 8, mid = cake(i, 1.25), rim = cake(i, 2.1);
        const cg = c.createRadialGradient(ix + iw * 0.46, iy + ih * 0.56, 2, ix + iw / 2, iy + ih / 2, ih * 0.72);
        cg.addColorStop(0, `rgb(${mid[0]},${mid[1]},${mid[2]})`); cg.addColorStop(0.55, `rgb(${Math.round((mid[0] + rim[0]) / 2)},${Math.round((mid[1] + rim[1]) / 2)},${Math.round((mid[2] + rim[2]) / 2)})`); cg.addColorStop(1, `rgb(${rim[0]},${rim[1]},${rim[2]})`);
        c.beginPath(); rr(c, ix, iy, iw, ih, 2.5); c.fillStyle = cg; c.fill();
        c.save(); c.beginPath(); rr(c, ix, iy, iw, ih, 2.5); c.clip();
        for (let s = 0; s < 46; s++) { c.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.1)"; c.beginPath(); c.arc(ix + rand() * iw, iy + rand() * ih, 0.3 + rand() * 0.6, 0, Math.PI * 2); c.fill(); }
        const worn = c.createRadialGradient(ix + iw * 0.46, iy + ih * 0.56, 1, ix + iw * 0.46, iy + ih * 0.56, iw * 0.42); worn.addColorStop(0, "rgba(255,255,255,0.16)"); worn.addColorStop(0.7, "rgba(255,255,255,0.05)"); worn.addColorStop(1, "rgba(255,255,255,0)");
        c.fillStyle = worn; c.fillRect(ix, iy, iw, ih);
        c.restore();
        inset(c, ix, iy, iw, ih, 2.5, 3, 1.5, 2, "rgba(0,0,0,0.6)");
      }
      // the sheet, taped down at two corners
      c.save(); c.translate(P.x + P.w / 2, P.y + P.h / 2); c.rotate(P.r); c.translate(-P.w / 2, -P.h / 2);
      c.save(); c.shadowColor = "rgba(40,48,36,0.42)"; c.shadowBlur = 22 * px; c.shadowOffsetX = 7 * px; c.shadowOffsetY = 14 * px; c.fillStyle = "#f3efe5"; c.fillRect(5, 5, P.w - 10, P.h - 10); c.restore();
      c.save(); c.shadowColor = "rgba(30,36,28,0.45)"; c.shadowBlur = 3 * px; c.shadowOffsetX = 1 * px; c.shadowOffsetY = 2 * px; c.fillStyle = "#f3efe5"; c.fillRect(4, 4, P.w - 8, P.h - 8); c.restore();
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high"; c.drawImage(paperC, 0, 0, P.w, P.h);
      for (const [tx, ty, ta] of [[14, 10, -0.72], [P.w - 14, 12, 0.66]] as number[][]) {
        c.save(); c.translate(tx, ty); c.rotate(ta);
        c.shadowColor = "rgba(40,40,20,0.3)"; c.shadowBlur = 3 * px; c.shadowOffsetY = 1.5 * px;
        c.beginPath(); c.moveTo(-34, -11); c.lineTo(-30, -7); c.lineTo(-33, -3); c.lineTo(-30, 2); c.lineTo(-34, 7); c.lineTo(-31, 11); c.lineTo(32, 11); c.lineTo(35, 6); c.lineTo(31, 1); c.lineTo(34, -5); c.lineTo(31, -11); c.closePath();
        c.fillStyle = "rgba(231,217,170,0.88)"; c.fill(); c.shadowColor = "transparent";
        c.strokeStyle = "rgba(120,100,50,0.14)"; c.lineWidth = 0.6; for (let s = -26; s < 30; s += 5 + rand() * 6) { c.beginPath(); c.moveTo(s, -11); c.lineTo(s + 1.5, 11); c.stroke(); }
        const tg = c.createLinearGradient(0, -11, 0, 11); tg.addColorStop(0, "rgba(255,255,255,0.3)"); tg.addColorStop(0.5, "rgba(255,255,255,0)"); tg.addColorStop(1, "rgba(90,70,20,0.12)"); c.fillStyle = tg; c.fillRect(-34, -11, 69, 22);
        c.restore();
      }
      c.restore();
    };

    // ---- the brush ----
    const B = { x: L.rest.x, y: L.rest.y, a: L.rest.a, lift: 0 };
    let phase = 0, bp = 0, goal = selRef.current, from = { ...B }, tint = pans[selRef.current].rgb.slice(), tintTo = tint.slice(), dabN = 0, dab = [0, 0];
    const panWet: number[] = pans.map((_, i) => (i === selRef.current ? 1 : 0));
    const drawBrush = () => {
      const c = ctx, k = L.len;
      const tuft = () => { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(8, -1.4, 18, -5.9, 24, -5.7); c.lineTo(31, -4.7); c.lineTo(31, 4.7); c.lineTo(24, 5.7); c.bezierCurveTo(18, 5.9, 8, 1.4, 0, 0); c.closePath(); };
      const ferrule = () => { c.beginPath(); c.moveTo(30.5, -4.8); c.lineTo(76, -5.9); c.lineTo(76, 5.9); c.lineTo(30.5, 4.8); c.closePath(); };
      const handle = () => { c.beginPath(); c.moveTo(75.5, -5.9); c.bezierCurveTo(100, -7.8, 130, -7.3, 170, -5); c.bezierCurveTo(210, -3.1, 240, -2.1, 256, -1.6); c.quadraticCurveTo(260.5, 0, 256, 1.6); c.bezierCurveTo(240, 2.1, 210, 3.1, 170, 5); c.bezierCurveTo(130, 7.3, 100, 7.8, 75.5, 5.9); c.closePath(); };
      c.save(); c.translate(B.x, B.y); c.rotate(B.a); c.scale(k, k);
      c.save(); c.shadowColor = "rgba(30,38,26,0.5)"; c.shadowBlur = (4 + 12 * B.lift) * px; c.shadowOffsetX = (3 + 9 * B.lift) * px; c.shadowOffsetY = (4 + 15 * B.lift) * px; c.fillStyle = "#333";
      tuft(); c.fill(); ferrule(); c.fill(); handle(); c.fill(); c.restore();
      const across = (stops: [number, string][]) => { const g = c.createLinearGradient(0, -7.5, 0, 7.5); for (const [p, v] of stops) g.addColorStop(p, v); return g; };
      handle(); c.fillStyle = across([[0, "#2e0408"], [0.2, "#9c1428"], [0.3, "#f0647a"], [0.37, "#b81a32"], [0.72, "#6c0b19"], [1, "#240306"]]); c.fill();
      c.save(); handle(); c.clip();
      c.fillStyle = across([[0, "#060606"], [0.26, "#3a3a3c"], [0.33, "#bcbcc0"], [0.4, "#2a2a2c"], [1, "#000"]]); c.fillRect(224, -8, 40, 16);
      c.fillStyle = across([[0, "#6a4d14"], [0.3, "#f6e19c"], [0.6, "#b98d30"], [1, "#4f380c"]]); c.fillRect(221.5, -8, 2.6, 16);
      c.fillStyle = "rgba(244,214,130,0.92)"; c.font = "600 4.4px Georgia, 'Times New Roman', serif"; c.textBaseline = "middle"; c.fillText("KESTREL  ROUND  No. 8", 98, 0.6);
      c.restore();
      handle(); c.lineWidth = 0.4; c.strokeStyle = "rgba(0,0,0,0.5)"; c.stroke();
      ferrule(); c.fillStyle = across([[0, "#50545a"], [0.18, "#c4c8cc"], [0.3, "#ffffff"], [0.46, "#b0b5ba"], [0.8, "#787d84"], [1, "#43474d"]]); c.fill(); c.lineWidth = 0.4; c.strokeStyle = "rgba(0,0,0,0.55)"; c.stroke();
      for (const fx of [61, 65.5]) { c.fillStyle = "rgba(0,0,0,0.38)"; c.fillRect(fx, -5.7, 0.9, 11.4); c.fillStyle = "rgba(255,255,255,0.6)"; c.fillRect(fx + 0.9, -5.7, 0.7, 11.4); }
      tuft(); c.fillStyle = across([[0, "#2a170a"], [0.28, "#8b5b30"], [0.42, "#b98450"], [0.7, "#5c391c"], [1, "#20110a"]]); c.fill();
      const tg = c.createLinearGradient(0, 0, 31, 0), t = tint.map((v) => Math.round(v * 0.8));
      tg.addColorStop(0, `rgba(${t[0]},${t[1]},${t[2]},0.96)`); tg.addColorStop(0.6, `rgba(${t[0]},${t[1]},${t[2]},0.8)`); tg.addColorStop(1, `rgba(${t[0]},${t[1]},${t[2]},0.05)`);
      tuft(); c.fillStyle = tg; c.fill();
      c.save(); tuft(); c.clip(); c.lineWidth = 0.45;
      for (let s = -3; s <= 3; s++) { c.strokeStyle = s % 2 ? "rgba(255,255,255,0.16)" : "rgba(20,10,4,0.3)"; c.beginPath(); c.moveTo(31, s * 1.35); c.quadraticCurveTo(16, s * 1.9, 0, 0); c.stroke(); }
      c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 0.9; c.lineCap = "round"; c.beginPath(); c.moveTo(5, -0.7); c.quadraticCurveTo(14, -3.4, 23, -3.5); c.stroke();
      c.restore();
      tuft(); c.lineWidth = 0.4; c.strokeStyle = "rgba(0,0,0,0.45)"; c.stroke();
      c.restore();
    };

    const toCanvas = (lx: number, ly: number) => { const dx = lx - P.w / 2, dy = ly - P.h / 2, cs = Math.cos(P.r), sn = Math.sin(P.r); return [P.x + P.w / 2 + dx * cs - dy * sn, P.y + P.h / 2 + dx * sn + dy * cs]; };
    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(bg, 0, 0);
      ctx.setTransform(px, 0, 0, px, M * px, M * px);
      ctx.save(); ctx.translate(P.x + P.w / 2, P.y + P.h / 2); ctx.rotate(P.r); ctx.translate(-P.w / 2, -P.h / 2);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
      ctx.globalCompositeOperation = "multiply"; ctx.drawImage(washC, 0, 0, P.w, P.h); ctx.globalCompositeOperation = "source-over";
      // pencilled note under the wash
      ctx.globalAlpha = 0.84 * inkIn; ctx.fillStyle = "#4c4c54"; ctx.textBaseline = "alphabetic";
      ctx.save(); ctx.translate(wash.x + 6, wash.y + wash.h + 44); ctx.rotate(-0.02);
      ctx.font = "italic 19px 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive"; ctx.fillText(pans[shown].name, 0, 0, wash.w - 12);
      ctx.font = "italic 12px 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive"; ctx.globalAlpha = 0.6 * inkIn; ctx.fillText(`pan ${shown + 1} of ${pans.length}, one wash`, 1, 21, wash.w - 12);
      ctx.restore(); ctx.globalAlpha = 1;
      ctx.restore();
      // a pan that has been touched with water is glossy until it dries
      for (let i = 0; i < pans.length; i++) {
        const w = panWet[i];
        if (w < 0.02) continue;
        const b = panBox(L, i), x = b.x + 6.5, y = b.y + 6.5, ww = b.w - 13, hh = b.h - 13, m = pans[i].rgb;
        ctx.save(); ctx.beginPath(); rr(ctx, x, y, ww, hh, 2.5); ctx.clip();
        ctx.fillStyle = `rgba(${m[0]},${m[1]},${m[2]},${0.5 * w})`; ctx.fillRect(x, y, ww, hh);
        const g = ctx.createLinearGradient(x, y, x + ww, y + hh); g.addColorStop(0.18, "rgba(255,255,255,0)"); g.addColorStop(0.34, `rgba(255,255,255,${0.75 * w})`); g.addColorStop(0.42, `rgba(255,255,255,${0.12 * w})`); g.addColorStop(0.5, `rgba(255,255,255,${0.4 * w})`); g.addColorStop(0.62, "rgba(255,255,255,0)");
        ctx.fillStyle = g; ctx.fillRect(x, y, ww, hh);
        ctx.fillStyle = `rgba(255,255,255,${0.85 * w})`; ctx.beginPath(); ctx.ellipse(x + ww * 0.72, y + hh * 0.74, 3.2, 1.5, -0.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      drawBrush();
    };

    const ease = (p: number) => p * p * (3 - 2 * p);
    const DABS = [[0.36, 0.34], [0.64, 0.6], [0.3, 0.66], [0.66, 0.3], [0.5, 0.48]];
    let fieldTick = 0;
    const step = (dt: number) => {
      let busy = false;
      if (phase > 0) {
        busy = true;
        const b = panBox(L, goal), pcx = b.x + b.w / 2, pcy = b.y + b.h / 2 + 2;
        const dur = [0, 0.36, 0.44, 0.42, 0.62, 0.55][phase];
        bp = Math.min(1, bp + dt / dur); const e = ease(bp);
        if (phase === 1) { B.x = from.x + (pcx - from.x) * e; B.y = from.y + (pcy - from.y) * e; B.a = from.a + (L.use - from.a) * e; B.lift = Math.max(from.lift * (1 - e), Math.sin(Math.PI * bp) * 0.9); }
        else if (phase === 2) { B.x = pcx + Math.cos(bp * 14) * 5 * Math.sin(Math.PI * bp); B.y = pcy + Math.sin(bp * 14) * 5 * Math.sin(Math.PI * bp); B.a = L.use + Math.sin(bp * 14) * 0.05; B.lift = 0.1; if (bp > 0.25) { tintTo = pans[goal].rgb.slice(); panWet[goal] = Math.min(1, panWet[goal] + dt * 6); } }
        else if (phase === 3) { B.x = from.x + (dab[0] - from.x) * e; B.y = from.y + (dab[1] - from.y) * e; B.a = L.use + 0.12 * Math.sin(Math.PI * bp); B.lift = 0.1 + Math.sin(Math.PI * bp) * 0.9; }
        else if (phase === 4) { B.x = dab[0] + Math.sin(bp * 9.4) * 24 * (1 - bp * 0.3); B.y = dab[1] + bp * 20 - 4; B.a = L.use + Math.sin(bp * 9.4) * 0.07; B.lift = 0.08; }
        else { B.x = from.x + (L.rest.x - from.x) * e; B.y = from.y + (L.rest.y - from.y) * e; B.a = from.a + (L.rest.a - from.a) * e; B.lift = Math.sin(Math.PI * bp) * 0.9; }
        if (bp >= 1) {
          bp = 0; from = { ...B };
          if (phase === 2) { const d = DABS[dabN++ % DABS.length]; dab = toCanvas(wash.x + wash.w * d[0], wash.y + wash.h * d[1]); phase = 3; }
          else if (phase === 3) { const d = DABS[(dabN - 1) % DABS.length]; startBloom(goal, wash.x + wash.w * d[0], wash.y + wash.h * d[1]); phase = 4; }
          else if (phase === 5) { phase = 0; B.lift = 0; }
          else phase++;
        }
      }
      for (let c = 0; c < 3; c++) if (Math.abs(tint[c] - tintTo[c]) > 0.5) { tint[c] += (tintTo[c] - tint[c]) * Math.min(1, dt * 9); busy = true; }
      for (let i = 0; i < pans.length; i++) if (i !== goal && panWet[i] > 0) { panWet[i] = Math.max(0, panWet[i] - dt / 2.2); busy = true; }
      if (inkIn < 1) { inkIn = Math.min(1, inkIn + dt / 0.7); busy = true; }
      if (bloom < 1 || wet > 0.01) {
        busy = true;
        if (bloom < 1) bloom = Math.min(1, bloom + dt / 5); else wet = Math.max(0, wet - dt / 3.2);
        if (wet <= 0.01) wet = 0;
        fieldTick += dt;
        if (fieldTick > 0.03 || wet === 0) { fieldTick = 0; renderField(); compose(); }
      }
      return busy;
    };

    let raf = 0, last = 0, t0 = 0, seen = true, nextDemo = 0.3, demoAt = 0, needDraw = true;
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      if (!user.current && t > nextDemo && phase === 0) { const i = DEMO[demoAt++ % DEMO.length]; selRef.current = i; setSel(i); goal = i; phase = 1; bp = 0; from = { ...B }; nextDemo = t + 5.4; }
      const busy = step(dt);
      if (busy || needDraw) { draw(); needDraw = false; }
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    const size = () => {
      const b = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      if (!b.width) return;
      cv.width = Math.round(b.width * dpr); cv.height = Math.round((b.width * dpr * (L.H + M * 2)) / (L.W + M * 2));
      px = cv.width / (L.W + M * 2); seed = 23; buildPaper(); paintScene(); renderField(); compose(); needDraw = true;
      if (reduce) draw();
    };
    size();
    const ro = new ResizeObserver(size); ro.observe(cv);

    api.current = {
      pick: (i) => {
        goal = i;
        if (reduce) { kn = kOf(i); for (let c = 0; c < 3; c++) ko[c].fill(kn[c]); bloom = 1; wet = 0; shown = i; inkIn = 1; tint = pans[i].rgb.slice(); tintTo = tint.slice(); pans.forEach((_, j) => { panWet[j] = j === i ? 1 : 0; }); renderField(); compose(); draw(); return; }
        phase = 1; bp = 0; from = { ...B }; wake();
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
    const n = pans.length;
    const next = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i + n - 1) % n : e.key === "ArrowDown" ? (i + COLS) % n : e.key === "ArrowUp" ? (i + n - COLS) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault(); choose(next); radios.current[next]?.focus();
  };

  return (
    <div ref={root} className="flex min-h-[720px] w-full flex-col items-center justify-center overflow-hidden bg-[#a9b5a2] bg-[radial-gradient(105%_80%_at_50%_38%,#c6d0bf_0%,#a9b5a2_70%)] px-4 py-10">
      <div className={`relative w-full ${wide ? "max-w-[920px]" : "max-w-[440px]"}`} style={{ aspectRatio: `${L.W} / ${L.H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute" style={{ left: `${(-M / L.W) * 100}%`, top: `${(-M / L.H) * 100}%`, width: `${((L.W + M * 2) / L.W) * 100}%`, height: `${((L.H + M * 2) / L.H) * 100}%` }} />
        <div role="radiogroup" aria-label="Watercolour pan">
          {pans.map((p, i) => {
            const b = panBox(L, i);
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
                className="absolute cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#1f2a1c] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                style={{ left: `${(b.x / L.W) * 100}%`, top: `${(b.y / L.H) * 100}%`, width: `${(b.w / L.W) * 100}%`, height: `${(b.h / L.H) * 100}%` }}
              />
            );
          })}
        </div>
      </div>
      <output aria-live={live ? "polite" : "off"} className="mt-6 flex min-h-[24px] items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[#3b4737]">
        <span aria-hidden="true" className="h-4 w-4 rounded-full ring-1 ring-black/20" style={{ backgroundColor: hexOf(pans[sel].rgb) }} />
        <span className="text-[#182015]">{pans[sel].name}</span>
        <span className="text-[#5d6b58]">/</span>
        {hexOf(pans[sel].rgb)}
      </output>
    </div>
  );
}

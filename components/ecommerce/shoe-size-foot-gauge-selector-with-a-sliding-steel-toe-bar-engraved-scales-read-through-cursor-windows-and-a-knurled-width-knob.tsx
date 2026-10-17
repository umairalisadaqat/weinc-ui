import { useEffect, useRef, useState } from "react";

// The scale. Whole sizes get a number and a radio; half sizes get a short tick only.
const FIRST = 36, LAST = 46;
const sizes = Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i);
const footCm = (eu: number) => eu / 1.5 - 1.5; // a Paris point is two thirds of a centimetre of last; the foot is about 1.5 cm shorter
const widths = [
  { key: "N", name: "Narrow" },
  { key: "R", name: "Regular" },
  { key: "W", name: "Wide" },
];
const START_SIZE = 42, START_WIDTH = 1;
const HAIR = "#e5402a"; // the hairlines in the two windows and the dot on the width knob
const LEN = 660, WID = 236, PAD = 44; // the plate, and the room left round it for its shadow
const U0 = 212, STEP = 38; // where size 36 sits along the plate, and the distance between whole sizes
const SLOT_U = 150; // where the width slot crosses the plate

const sizeU = (i: number) => U0 + i * STEP;
const widthV = (j: number) => WID / 2 + (j - (widths.length - 1) / 2) * 34;
const layoutFor = (narrow: boolean) => (narrow ? { W: WID + PAD * 2, H: LEN + PAD * 2 + 8 } : { W: LEN + PAD * 2, H: WID + PAD * 2 + 10 });

export default function ShoeSizeFootGaugeSelector() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pad = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [size, setSize] = useState(sizes.indexOf(START_SIZE));
  const [width, setWidth] = useState(START_WIDTH);
  const live = useRef({ size: sizes.indexOf(START_SIZE), width: START_WIDTH });
  const api = useRef<{ wake: () => void; stopDemo: () => void } | null>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < 700));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const cv = canvas.current, hit = pad.current;
    if (!cv || !hit) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const L = layoutFor(narrow);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mk = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
    let seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    // Puts the plate's own axes on a canvas: u runs heel to toe, v runs across. A phone stands the plate on its heel.
    const place = (c: CanvasRenderingContext2D, sc: number) => { c.setTransform(sc, 0, 0, sc, 0, 0); if (narrow) { c.translate(PAD, PAD + LEN); c.rotate(-Math.PI / 2); } else c.translate(PAD, PAD); };
    const cast = (c: CanvasRenderingContext2D, sc: number, blur: number, ox: number, oy: number, col: string, path: () => void) => {
      c.save(); c.shadowColor = col; c.shadowBlur = blur * sc; c.shadowOffsetX = ox * sc + 30000; c.shadowOffsetY = oy * sc;
      c.translate(narrow ? 0 : -30000 / sc, narrow ? -30000 / sc : 0); c.fillStyle = "#000"; c.strokeStyle = "#000"; path(); c.restore();
    };
    // Lettering is always upright, whichever way the plate lies.
    const text = (c: CanvasRenderingContext2D, str: string, u: number, v: number, font: string, fill: string, gap = 0) => {
      c.save(); c.translate(u, v); if (narrow) c.rotate(Math.PI / 2);
      c.font = font; c.textAlign = "center"; c.textBaseline = "middle";
      const put = (dy: number) => { if (!gap) { c.fillText(str, 0, dy); return; } const wd = str.split("").map((ch) => c.measureText(ch).width + gap); let x = -(wd.reduce((a, b) => a + b, 0) - gap) / 2; str.split("").forEach((ch, n) => { c.fillText(ch, x + (wd[n] - gap) / 2, dy); x += wd[n]; }); };
      c.fillStyle = "rgba(0,0,0,0.85)"; put(-0.7); c.fillStyle = fill; put(0);
      c.restore();
    };
    const steel = (c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) => { const g = c.createLinearGradient(x0, y0, x1, y1); [[0, "#fbfcfd"], [0.1, "#cfd3d8"], [0.32, "#a4a9b0"], [0.5, "#e4e7ea"], [0.66, "#9a9fa7"], [0.88, "#6d727a"], [1, "#b9bdc3"]].forEach(([p, col]) => g.addColorStop(p as number, col as string)); return g; };
    const screw = (c: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) => {
      c.beginPath(); c.arc(x, y + 0.7, r + 0.9, 0, Math.PI * 2); c.fillStyle = "rgba(0,0,0,0.55)"; c.fill();
      const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, "#ffffff"); g.addColorStop(0.5, "#b3b8bf"); g.addColorStop(1, "#5d626a");
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = g; c.fill();
      c.lineWidth = r * 0.28; c.strokeStyle = "rgba(10,12,16,0.9)"; c.beginPath(); c.moveTo(x - Math.cos(a) * r * 0.8, y - Math.sin(a) * r * 0.8); c.lineTo(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8); c.stroke();
    };
    const PAINT = "#eceae3", SS = 3;

    // 1. The toe bar, painted once: brushed steel, two cursor windows, a ridged black grip, knurled ends.
    const BW = 46, BH = WID + 12;
    const bar = mk(BW * SS, BH * SS);
    {
      const c = bar.getContext("2d");
      if (c) {
        c.scale(SS, SS);
        rr(c, 0, 0, BW, BH, 5); c.save(); c.clip();
        const g = c.createLinearGradient(0, 0, BW, 0);
        g.addColorStop(0, "#ffffff"); g.addColorStop(0.07, "#dfe2e6"); g.addColorStop(0.5, "#b9bdc3"); g.addColorStop(0.9, "#90959c"); g.addColorStop(1, "#555a61");
        c.fillStyle = g; c.fillRect(0, 0, BW, BH);
        for (let i = 0; i < 520; i++) { const x = rand() * BW, y0 = rand() * BH, len = 20 + rand() * 120; c.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${0.05 + rand() * 0.16})` : `rgba(0,0,0,${0.04 + rand() * 0.12})`; c.fillRect(x, y0, 0.4 + rand() * 0.5, len); }
        // Knurled ends that hook over the edges of the plate.
        [0, BH - 17].forEach((y0) => {
          c.save(); c.beginPath(); c.rect(0, y0, BW, 17); c.clip();
          c.fillStyle = "rgba(40,44,50,0.5)"; c.fillRect(0, y0, BW, 17);
          c.lineWidth = 0.7;
          for (let d = -40; d < BW + 40; d += 3) { c.strokeStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.moveTo(d, y0); c.lineTo(d + 17, y0 + 17); c.stroke(); c.strokeStyle = "rgba(0,0,0,0.55)"; c.beginPath(); c.moveTo(d + 17, y0); c.lineTo(d, y0 + 17); c.stroke(); }
          c.restore();
          c.fillStyle = "rgba(0,0,0,0.5)"; c.fillRect(0, y0 === 0 ? 17 : y0 - 0.8, BW, 0.8); c.fillStyle = "rgba(255,255,255,0.6)"; c.fillRect(0, y0 === 0 ? 17.8 : y0 - 1.6, BW, 0.8);
        });
        c.restore();
        // Windows cut through the bar over each scale.
        const wins = [[6, 20, BW - 12, 37], [6, BH - 57, BW - 12, 37]];
        wins.forEach(([x, y, w, h], n) => {
          c.save(); c.globalCompositeOperation = "destination-out"; c.fillStyle = "#000"; rr(c, x, y, w, h, 3); c.fill(); c.restore();
          rr(c, x, y, w, h, 3); c.fillStyle = "rgba(210,230,255,0.05)"; c.fill();
          c.save(); rr(c, x, y, w, h, 3); c.clip();
          const sh = c.createLinearGradient(0, y, 0, y + 7); sh.addColorStop(0, "rgba(0,0,0,0.6)"); sh.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = sh; c.fillRect(x, y, w, 5);
          const sl = c.createLinearGradient(x, 0, x + 6, 0); sl.addColorStop(0, "rgba(0,0,0,0.5)"); sl.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = sl; c.fillRect(x, y, 4, h);
          const gl = c.createLinearGradient(x, y, x + w, y + h); gl.addColorStop(0.3, "rgba(255,255,255,0)"); gl.addColorStop(0.46, "rgba(255,255,255,0.16)"); gl.addColorStop(0.56, "rgba(255,255,255,0)"); c.fillStyle = gl; c.fillRect(x, y, w, h);
          c.fillStyle = HAIR; c.fillRect(BW / 2 - 0.6, n === 0 ? y : y + h - 19, 1.2, 19);
          c.restore();
          c.lineWidth = 0.8; c.strokeStyle = "rgba(20,22,26,0.8)"; rr(c, x - 0.4, y - 0.4, w + 0.8, h + 0.8, 3.2); c.stroke();
          c.strokeStyle = "rgba(255,255,255,0.75)"; c.beginPath(); c.moveTo(x + 3, y + h + 1.1); c.lineTo(x + w - 3, y + h + 1.1); c.stroke();
        });
        // Black grip with ridges across the direction of travel.
        const gy = BH / 2 - 46, gh = 92;
        c.save(); c.shadowColor = "rgba(0,0,0,0.6)"; c.shadowBlur = 5 * SS; c.shadowOffsetY = 2 * SS; c.shadowOffsetX = 1 * SS; rr(c, 6, gy, BW - 12, gh, 6); c.fillStyle = "#17181b"; c.fill(); c.restore();
        c.save(); rr(c, 6, gy, BW - 12, gh, 6); c.clip();
        const gg = c.createLinearGradient(6, 0, BW - 6, 0); gg.addColorStop(0, "#4a4d53"); gg.addColorStop(0.25, "#26282c"); gg.addColorStop(1, "#0c0d0f"); c.fillStyle = gg; c.fillRect(6, gy, BW - 12, gh);
        for (let x = 9; x < BW - 8; x += 3.4) { c.fillStyle = "rgba(255,255,255,0.26)"; c.fillRect(x, gy, 0.9, gh); c.fillStyle = "rgba(0,0,0,0.7)"; c.fillRect(x + 0.9, gy, 1.5, gh); }
        const gs = c.createLinearGradient(0, gy, 0, gy + gh); gs.addColorStop(0, "rgba(255,255,255,0.2)"); gs.addColorStop(0.12, "rgba(255,255,255,0)"); gs.addColorStop(0.85, "rgba(0,0,0,0)"); gs.addColorStop(1, "rgba(0,0,0,0.5)"); c.fillStyle = gs; c.fillRect(6, gy, BW - 12, gh);
        c.restore();
        screw(c, BW / 2, 68, 4, 0.5); screw(c, BW / 2, BH - 68, 4, 2.1);
        // Bevels on the long edges.
        c.fillStyle = "rgba(255,255,255,0.95)"; c.fillRect(0.4, 5, 1, BH - 10); c.fillStyle = "rgba(0,0,0,0.45)"; c.fillRect(BW - 1.2, 5, 1.2, BH - 10);
      }
    }
    // 2. The width knob on its little carriage.
    const KS = 56, KR = 17;
    const knob = mk(KS * SS, KS * SS);
    {
      const c = knob.getContext("2d");
      if (c) {
        c.scale(SS, SS); const m = KS / 2;
        rr(c, m - 22, m - 13, 44, 26, 4); c.fillStyle = steel(c, m - 22, m - 13, m + 22, m + 13); c.fill(); c.lineWidth = 0.6; c.strokeStyle = "rgba(0,0,0,0.6)"; c.stroke();
        c.fillStyle = "rgba(255,255,255,0.8)"; c.fillRect(m - 19, m - 12.4, 38, 0.8);
        c.beginPath(); c.arc(m + 2, m + 4, KR + 1, 0, Math.PI * 2); c.fillStyle = "rgba(0,0,0,0.45)"; c.fill();
        for (let i = 0; i < 44; i++) { const a0 = (i / 44) * Math.PI * 2, lit = 0.5 + 0.5 * Math.cos(a0 + 2.2); c.beginPath(); c.moveTo(m, m); c.arc(m, m, KR, a0, a0 + Math.PI / 44); c.closePath(); c.fillStyle = `rgb(${80 + lit * 170},${84 + lit * 168},${90 + lit * 165})`; c.fill(); c.beginPath(); c.moveTo(m, m); c.arc(m, m, KR, a0 + Math.PI / 44, a0 + Math.PI / 22); c.closePath(); c.fillStyle = `rgb(${30 + lit * 60},${32 + lit * 60},${36 + lit * 60})`; c.fill(); }
        c.beginPath(); c.arc(m, m, KR - 3.4, 0, Math.PI * 2);
        if (typeof c.createConicGradient === "function") { const cg = c.createConicGradient(-2.2, m, m); [[0, 250], [0.09, 170], [0.2, 110], [0.32, 160], [0.45, 235], [0.5, 250], [0.57, 180], [0.7, 105], [0.84, 150], [0.94, 225], [1, 250]].forEach(([p, v]) => cg.addColorStop(p, `rgb(${v},${v + 2},${v + 6})`)); c.fillStyle = cg; } else c.fillStyle = steel(c, m - KR, m - KR, m + KR, m + KR);
        c.fill(); c.lineWidth = 0.7; c.strokeStyle = "rgba(0,0,0,0.6)"; c.stroke();
        for (let r = 2; r < KR - 4; r += 1.3) { c.beginPath(); c.arc(m, m, r, 0, Math.PI * 2); c.lineWidth = 0.4; c.strokeStyle = rand() > 0.5 ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.16)"; c.stroke(); }
        c.beginPath(); c.arc(m - 7.5, m, 2, 0, Math.PI * 2); c.fillStyle = "rgba(0,0,0,0.5)"; c.fill(); c.beginPath(); c.arc(m - 7.5, m, 1.6, 0, Math.PI * 2); c.fillStyle = HAIR; c.fill();
      }
    }

    // 3. The plate with everything fixed to it, painted once per size.
    const base = mk(1, 1);
    let k = 1;
    const fit = () => {
      const w = cv.clientWidth || L.W, dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr); cv.height = Math.round((w * L.H) / L.W * dpr); k = cv.width / L.W;
      base.width = cv.width; base.height = cv.height;
      const c = base.getContext("2d");
      if (!c) return;
      place(c, k); seed = 23;
      cast(c, k, 30, 10, 26, "rgba(60,36,0,0.5)", () => { rr(c, 6, 6, LEN - 12, WID - 12, 30); c.fill(); });
      cast(c, k, 6, 2, 5, "rgba(40,22,0,0.6)", () => { rr(c, 1, 1, LEN - 2, WID - 2, 30); c.fill(); });
      // Polished edge, then the black crackle-free enamel inside it.
      rr(c, 0, 0, LEN, WID, 30); c.fillStyle = steel(c, 0, 0, LEN * 0.4, WID); c.fill();
      c.lineWidth = 0.6; c.strokeStyle = "rgba(0,0,0,0.5)"; c.stroke();
      rr(c, 4, 4, LEN - 8, WID - 8, 26.5); c.save(); c.clip();
      const en = c.createLinearGradient(0, 0, LEN * 0.5, WID); en.addColorStop(0, "#33353a"); en.addColorStop(0.45, "#1c1d20"); en.addColorStop(1, "#111214");
      c.fillStyle = en; c.fillRect(0, 0, LEN, WID);
      for (let i = 0; i < 9000; i++) { c.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${rand() * 0.07})` : `rgba(0,0,0,${rand() * 0.2})`; c.fillRect(rand() * LEN, rand() * WID, 0.9, 0.9); }
      // A long soft reflection of the room across the enamel.
      const refl = c.createLinearGradient(LEN * 0.1, 0, LEN * 0.62, WID); refl.addColorStop(0.3, "rgba(255,255,255,0)"); refl.addColorStop(0.44, "rgba(255,255,255,0.075)"); refl.addColorStop(0.5, "rgba(255,255,255,0.02)"); refl.addColorStop(0.56, "rgba(255,255,255,0.05)"); refl.addColorStop(0.66, "rgba(255,255,255,0)");
      c.fillStyle = refl; c.fillRect(0, 0, LEN, WID);
      c.restore();
      c.lineWidth = 1; c.strokeStyle = "rgba(0,0,0,0.85)"; rr(c, 4, 4, LEN - 8, WID - 8, 26.5); c.stroke();
      // Printed outline of a sole, heel in the cup.
      const mid = WID / 2;
      c.save(); c.setLineDash([5, 4]); c.lineWidth = 1; c.strokeStyle = "rgba(236,234,227,0.2)";
      c.beginPath(); c.moveTo(24, mid); c.bezierCurveTo(24, mid - 46, 96, mid - 52, 150, mid - 40); c.bezierCurveTo(250, mid - 22, 300, mid - 66, 420, mid - 68); c.bezierCurveTo(540, mid - 70, 632, mid - 40, 632, mid + 4);
      c.bezierCurveTo(632, mid + 46, 540, mid + 64, 430, mid + 62); c.bezierCurveTo(300, mid + 60, 240, mid + 50, 150, mid + 46); c.bezierCurveTo(96, mid + 52, 24, mid + 46, 24, mid); c.stroke(); c.restore();
      // The two scales: sizes along one edge, centimetres along the other.
      const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";
      const tick = (u: number, v0: number, v1: number, wdt: number) => { c.fillStyle = "rgba(0,0,0,0.85)"; c.fillRect(u - wdt / 2 - 0.6, v0, wdt, v1 - v0); c.fillStyle = PAINT; c.fillRect(u - wdt / 2, v0, wdt, v1 - v0); };
      for (let h = 0; h <= (LAST - FIRST) * 2; h++) { const u = U0 + (h * STEP) / 2; if (h % 2 === 0) { tick(u, 13, 30, 1.6); text(c, String(FIRST + h / 2), u, 43, `700 13px ${mono}`, PAINT); } else tick(u, 13, 22, 1); }
      const cmU = (cm: number) => U0 + ((cm + 1.5) * 1.5 - FIRST) * STEP;
      for (let m = Math.ceil(footCm(FIRST) * 10); m <= Math.floor(footCm(LAST) * 10); m++) { const u = cmU(m / 10); if (m % 10 === 0) { tick(u, WID - 30, WID - 13, 1.6); text(c, String(m / 10), u, WID - 43, `700 13px ${mono}`, PAINT); } else if (m % 5 === 0) tick(u, WID - 24, WID - 13, 1.1); else tick(u, WID - 19, WID - 13, 0.7); }
      text(c, "EU", U0 - 34, 30, `700 9px ${mono}`, "rgba(236,234,227,0.7)", 1.5); text(c, "CM", U0 - 34, WID - 30, `700 9px ${mono}`, "rgba(236,234,227,0.7)", 1.5);
      // The groove the toe bar rides in.
      const groove = (x: number, y: number, w: number, h: number) => {
        rr(c, x, y, w, h, Math.min(w, h) / 2); c.fillStyle = "#050506"; c.fill();
        c.save(); rr(c, x, y, w, h, Math.min(w, h) / 2); c.clip(); const g = c.createLinearGradient(x, y, x + (w < h ? w : 0), y + (w < h ? 0 : h)); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(70,74,80,0.9)"); c.fillStyle = g; c.fillRect(x, y, w, h); c.restore();
        c.lineWidth = 0.8; c.strokeStyle = "rgba(255,255,255,0.22)"; rr(c, x - 0.6, y - 0.6, w + 1.2, h + 1.2, Math.min(w, h) / 2 + 0.6); c.stroke();
      };
      groove(U0 - 24, mid - 4, sizeU(sizes.length - 1) - U0 + 48, 8);
      groove(SLOT_U - 4.5, widthV(0) - 14, 9, widthV(widths.length - 1) - widthV(0) + 28);
      widths.forEach((wd, j) => { tick(SLOT_U - 15, widthV(j) - 0.8, widthV(j) + 0.8, 8); text(c, wd.key, SLOT_U - 30, widthV(j), `700 10px ${mono}`, PAINT); });
      text(c, "WIDTH", SLOT_U, widthV(0) - 26, `700 7px ${mono}`, "rgba(236,234,227,0.6)", 1.6);
      text(c, "FITTING GAUGE  No. 7", narrow ? LEN - 30 : LEN - 96, narrow ? mid : mid + 22, `700 6.5px ${mono}`, "rgba(236,234,227,0.42)", 1.2);
      // The heel cup: a curved steel wall seen from above.
      const cupPath = () => { c.beginPath(); c.moveTo(96, mid - 54); c.lineTo(70, mid - 54); c.arc(70, mid, 54, -Math.PI / 2, Math.PI / 2, true); c.lineTo(96, mid + 54); };
      c.lineCap = "round";
      cast(c, k, 9, 6, 9, "rgba(0,0,0,0.85)", () => { cupPath(); c.lineWidth = 10; c.stroke(); });
      cupPath(); c.lineWidth = 11.5; c.strokeStyle = "#2a2d32"; c.stroke();
      cupPath(); c.lineWidth = 9.5;
      if (typeof c.createConicGradient === "function") { const cg = c.createConicGradient(narrow ? -0.9 : -2.4, 70, mid); [[0, 252], [0.08, 190], [0.2, 120], [0.34, 170], [0.46, 236], [0.52, 250], [0.6, 176], [0.74, 104], [0.86, 160], [0.95, 232], [1, 252]].forEach(([p, v]) => cg.addColorStop(p, `rgb(${v - 4},${v},${v + 5})`)); c.strokeStyle = cg; } else c.strokeStyle = steel(c, 16, mid - 54, 96, mid + 54);
      c.stroke();
      cupPath(); c.lineWidth = 1; c.strokeStyle = "rgba(255,255,255,0.5)"; c.stroke();
      c.lineCap = "butt";
      screw(c, 30, 30, 4.2, 0.7); screw(c, 30, WID - 30, 4.2, 2.4); screw(c, LEN - 26, 30, 4.2, 1.6); screw(c, LEN - 26, WID - 30, 4.2, 0.2);
    };

    const s = { u: sizeU(live.current.size), uv: 0, v: widthV(live.current.width), vv: 0, drag: 0, raw: 0 };
    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0);
      place(ctx, k);
      cast(ctx, k, 7, 3, 6, "rgba(0,0,0,0.6)", () => { rr(ctx, SLOT_U - 21, s.v - 12, 42, 24, 4); ctx.fill(); });
      ctx.drawImage(knob, SLOT_U - KS / 2, s.v - KS / 2, KS, KS);
      // The bar's shadow, kept out of the two windows so the figures in them stay the brightest thing on the plate.
      ctx.save(); ctx.beginPath(); ctx.rect(-PAD, -PAD, LEN + PAD * 2, WID + PAD * 2); ctx.rect(s.u - BW / 2 + 6, 14, BW - 12, 37); ctx.rect(s.u - BW / 2 + 6, BH - 63, BW - 12, 37); ctx.clip("evenodd");
      cast(ctx, k, 9, 7, 9, "rgba(0,0,0,0.62)", () => { rr(ctx, s.u - BW / 2 + 12, -5, BW - 12, BH - 2, 5); ctx.fill(); });
      ctx.restore();
      ctx.drawImage(bar, s.u - BW / 2, -6, BW, BH);
      // The lamp does not move, so the bright band slides along the bar as the bar travels.
      const at = 0.2 + ((s.u - U0) / (sizeU(sizes.length - 1) - U0)) * 0.5;
      ctx.save(); rr(ctx, s.u - BW / 2, -6, BW, BH, 5); ctx.clip();
      const band = ctx.createLinearGradient(0, -6, 0, BH - 6);
      band.addColorStop(Math.max(0, at - 0.16), "rgba(255,255,255,0)"); band.addColorStop(at, "rgba(255,255,255,0.4)"); band.addColorStop(Math.min(1, at + 0.2), "rgba(255,255,255,0)");
      const gy = BH / 2 - 46; ctx.fillStyle = band;
      ctx.fillRect(s.u - BW / 2, 52, BW, gy - 59); ctx.fillRect(s.u - BW / 2, gy + 87, BW, BH - gy - 151);
      ctx.restore();
    };

    let raf = 0, last = 0, t0 = 0, seen = true, demo = !reduce, nextAt = 2.6, step = 0, first = true;
    const tour: [string, number][] = [["s", 44], ["w", 2], ["s", 39], ["s", 41], ["w", 0], ["s", 45], ["w", 1], ["s", 42]];
    const choose = (kind: string, i: number) => {
      if (kind === "s" && live.current.size !== i) { live.current.size = i; setSize(i); }
      if (kind === "w" && live.current.width !== i) { live.current.width = i; setWidth(i); }
    };
    const nearest = (val: number, count: number, at: (i: number) => number) => { let b = 0; for (let i = 1; i < count; i++) if (Math.abs(at(i) - val) < Math.abs(at(b) - val)) b = i; return b; };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.034, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      if (demo && t > nextAt && !s.drag) { const [kind, val] = tour[step % tour.length]; step++; nextAt = t + 1.9; choose(kind, kind === "s" ? Math.max(0, sizes.indexOf(val)) : val); }
      let tu = sizeU(live.current.size), tv = widthV(live.current.width);
      if (s.drag === 1) { const n = nearest(s.raw, sizes.length, sizeU), off = s.raw - sizeU(n); tu = sizeU(n) + off - (Math.sin((off / STEP) * Math.PI * 2) * STEP) / (Math.PI * 2) * 0.86; choose("s", n); }
      if (s.drag === 2) { const n = nearest(s.raw, widths.length, widthV); tv = Math.max(widthV(0) - 4, Math.min(widthV(widths.length - 1) + 4, s.raw)); choose("w", n); }
      const ks = s.drag ? 900 : 260, kd = s.drag ? 52 : 21;
      s.uv += (ks * (tu - s.u) - kd * s.uv) * dt; s.u += s.uv * dt;
      s.vv += (ks * (tv - s.v) - kd * s.vv) * dt; s.v += s.vv * dt;
      const moving = first || s.drag > 0 || Math.abs(s.uv) > 0.05 || Math.abs(s.vv) > 0.05 || Math.abs(tu - s.u) > 0.05 || Math.abs(tv - s.v) > 0.05;
      first = false;
      if (moving) draw();
      if ((moving || demo) && seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const still = () => { s.u = sizeU(live.current.size); s.v = widthV(live.current.width); s.uv = 0; s.vv = 0; draw(); };
    const wake = () => { first = true; if (reduce) still(); else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    api.current = { wake, stopDemo: () => { demo = false; } };
    fit(); wake();

    // Dragging: grab near the width slot to move the knob, anywhere else to move the toe bar.
    const local = (e: PointerEvent) => { const b = cv.getBoundingClientRect(), x = ((e.clientX - b.left) / b.width) * L.W, y = ((e.clientY - b.top) / b.height) * L.H; return narrow ? { u: PAD + LEN - y, v: x - PAD } : { u: x - PAD, v: y - PAD }; };
    const onDown = (e: PointerEvent) => {
      const p = local(e); demo = false;
      const held = document.activeElement; if (held instanceof HTMLInputElement && cv.parentElement?.contains(held)) held.blur(); // a drag takes over from a radio that had keyboard focus
      s.drag = Math.abs(p.u - SLOT_U) < 34 && p.v > widthV(0) - 30 && p.v < widthV(widths.length - 1) + 30 ? 2 : 1;
      s.raw = s.drag === 2 ? p.v : Math.max(U0 - 8, Math.min(sizeU(sizes.length - 1) + 8, p.u));
      hit.setPointerCapture(e.pointerId); e.preventDefault();
      if (reduce) { if (s.drag === 1) choose("s", nearest(s.raw, sizes.length, sizeU)); else choose("w", nearest(s.raw, widths.length, widthV)); s.drag = 0; still(); } else wake();
    };
    const onMove = (e: PointerEvent) => { if (!s.drag) return; const p = local(e); s.raw = s.drag === 2 ? p.v : Math.max(U0 - 8, Math.min(sizeU(sizes.length - 1) + 8, p.u)); wake(); };
    const onUp = () => { if (!s.drag) return; if (s.drag === 1) choose("s", nearest(s.raw, sizes.length, sizeU)); else choose("w", nearest(s.raw, widths.length, widthV)); s.drag = 0; wake(); };
    hit.addEventListener("pointerdown", onDown); hit.addEventListener("pointermove", onMove); hit.addEventListener("pointerup", onUp); hit.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(() => { fit(); if (reduce) still(); else { draw(); wake(); } });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      hit.removeEventListener("pointerdown", onDown); hit.removeEventListener("pointermove", onMove); hit.removeEventListener("pointerup", onUp); hit.removeEventListener("pointercancel", onUp);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, [narrow]);

  const L = layoutFor(narrow);
  const pickSize = (i: number) => { api.current?.stopDemo(); live.current.size = i; setSize(i); api.current?.wake(); };
  const pickWidth = (j: number) => { api.current?.stopDemo(); live.current.width = j; setWidth(j); api.current?.wake(); };
  // A box given in the plate's own axes, turned into percentages of the stage for either orientation.
  const box = (u: number, v: number, du: number, dv: number) => {
    const r = narrow ? { x: PAD + v, y: PAD + LEN - u - du, w: dv, h: du } : { x: PAD + u, y: PAD + v, w: du, h: dv };
    return { left: `${(r.x / L.W) * 100}%`, top: `${(r.y / L.H) * 100}%`, width: `${(r.w / L.W) * 100}%`, height: `${(r.h / L.H) * 100}%` };
  };
  const ring = "pointer-events-none absolute rounded-lg peer-focus-visible:ring-2 peer-focus-visible:ring-[#1c1300] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#d9a62e]";

  return (
    <div ref={stage} className="flex min-h-[720px] w-full flex-col items-center justify-center bg-[#d9a62e] bg-[radial-gradient(80%_70%_at_32%_24%,#edc55a_0%,#dcaa33_50%,#bf8b1c_100%)] px-3 py-10 sm:px-6">
      <div className="relative w-full" style={{ maxWidth: narrow ? 330 : 1010, aspectRatio: `${L.W} / ${L.H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div ref={pad} aria-hidden="true" className="absolute cursor-grab touch-none active:cursor-grabbing" style={box(0, 0, LEN, WID)} />
        <div role="radiogroup" aria-label="Shoe size" className="pointer-events-none absolute inset-0">
          {sizes.map((eu, i) => (
            <label key={eu} className="absolute" style={box(sizeU(i) - STEP / 2, 0, STEP, WID)}>
              <input type="radio" name="foot-gauge-size" aria-label={`EU ${eu}`} checked={size === i} onChange={() => pickSize(i)} className="peer sr-only" />
              <span aria-hidden="true" className={`${ring} -inset-x-1 -inset-y-2`} />
            </label>
          ))}
        </div>
        <div role="radiogroup" aria-label="Width" className="pointer-events-none absolute inset-0">
          {widths.map((wd, j) => (
            <label key={wd.key} className="absolute" style={box(SLOT_U - 40, widthV(j) - 17, 64, 34)}>
              <input type="radio" name="foot-gauge-width" aria-label={wd.name} checked={width === j} onChange={() => pickWidth(j)} className="peer sr-only" />
              <span aria-hidden="true" className={`${ring} inset-0`} />
            </label>
          ))}
        </div>
      </div>
      <p aria-live="polite" className="mt-5 max-w-[640px] text-center font-mono text-[11px] font-semibold uppercase leading-6 tracking-[0.18em] text-[#2e1f00]">
        <span className="text-[#1c1300]">EU {sizes[size]}</span>
        <span className="mx-2">/</span>
        foot {footCm(sizes[size]).toFixed(1)} cm
        <span className="mx-2">/</span>
        <span className="text-[#1c1300]">{widths[width].name}</span> width
      </p>
    </div>
  );
}

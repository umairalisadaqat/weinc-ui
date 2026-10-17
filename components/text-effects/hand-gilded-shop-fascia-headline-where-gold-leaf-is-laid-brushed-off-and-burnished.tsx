import { useEffect, useRef, useState } from "react";

/** The name in gold leaf and the painted line under it. */
const NAME = "MARIGOLD";
const TRADE = "CUT FLOWERS & HOUSE PLANTS";
/** Gloss paint of the shopfront: light, body, deep shadow. Try ["#7a2330", "#571722", "#330c13"] for claret. */
const PAINT = ["#1f5a47", "#12392c", "#08211a"];
const FACE = '"Bodoni 72", Didot, "Bodoni MT", "Playfair Display", Georgia, "Times New Roman", serif';
const SLUG = "hand-gilded-shop-fascia";

type Leaf = { x: number; y: number; rot: number; flip: number; at: number };
type Flake = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; size: number; life: number; tone: number; phase: number };

const cleanName = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9 &'.\-]/g, "").slice(0, 14);
const cleanTrade = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9 &'.,\-]/g, "").slice(0, 34);

export default function HandGildedShopFascia() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState(NAME);
  const [trade, setTrade] = useState(TRADE);
  const api = useRef<{ set: (name: string, trade: string) => void; again: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, box = wrap.current;
    if (!cv || !box) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const make = () => document.createElement("canvas");
    const base = make(), mask = make(), hole = make(), gold = make(), temp = make(), loose = make();
    let seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const words = { name: NAME, trade: TRADE };

    // All measurements are in canvas pixels.
    const g = { W: 0, H: 0, px: 0, py: 0, pw: 0, ph: 0, fx: 0, fy: 0, fw: 0, fh: 0, size: 0, track: 0, cy: 0, x0: 0, tw: 0, rx: 0, ry: 0, rw: 0, rh: 0, s: 0 };
    let leaves: Leaf[] = [], flakes: Flake[] = [], specks: number[][] = [];
    const time = { lay: 0.12, step: 0.07, wipe: 1, wipeFor: 0.55, burn: 1.6, burnFor: 0.6 };

    const spaced = (c: CanvasRenderingContext2D, text: string, cx: number, y: number, track: number, stroke = false) => {
      const widths = [...text].map((ch) => c.measureText(ch).width);
      let x = cx - (widths.reduce((a, b) => a + b, 0) + track * (text.length - 1)) / 2;
      c.textAlign = "left";
      [...text].forEach((ch, i) => { if (stroke) c.strokeText(ch, x, y); else c.fillText(ch, x, y); x += widths[i] + track; });
    };
    const widthOf = (c: CanvasRenderingContext2D, text: string, track: number) => [...text].reduce((a, ch) => a + c.measureText(ch).width, 0) + track * Math.max(0, text.length - 1);

    // One book-leaf of gold: thin enough to crinkle, never quite one colour.
    const paintLeaf = (cvs: HTMLCanvasElement, s: number, crinkle: number, ragged: boolean) => {
      cvs.width = cvs.height = Math.ceil(s);
      const c = cvs.getContext("2d"); if (!c) return;
      const m = c.createLinearGradient(0, 0, s, s);
      m.addColorStop(0, "#f3d572"); m.addColorStop(0.35, "#dcb146"); m.addColorStop(0.62, "#efce66"); m.addColorStop(1, "#c79a30");
      c.fillStyle = m; c.fillRect(0, 0, s, s);
      // Patches where the sheet lies a little off the surface, then creases: a few long folds and many short ones.
      for (let i = 0; i < 7; i++) {
        const x = rand() * s, y = rand() * s, rr = s * (0.14 + rand() * 0.24), tone = c.createRadialGradient(x, y, 0, x, y, rr), a = (0.1 + rand() * 0.14) * crinkle;
        tone.addColorStop(0, rand() > 0.5 ? `rgba(255,246,196,${a})` : `rgba(122,80,10,${a})`); tone.addColorStop(1, "rgba(200,150,40,0)");
        c.fillStyle = tone; c.fillRect(0, 0, s, s);
      }
      for (let i = 0; i < 34 * crinkle; i++) {
        const long = i < 3, x = rand() * s, y = rand() * s, a = rand() * 6.3, len = s * (long ? 0.5 + rand() * 0.5 : 0.04 + rand() * 0.16), alpha = (long ? 0.34 : 0.12 + rand() * 0.3) * crinkle, kink = (rand() - 0.5) * len * 0.16;
        c.lineWidth = long ? 1.4 : 0.5 + rand() * 0.9;
        for (const [dx, col] of [[0, `rgba(255,250,214,${alpha})`], [c.lineWidth, `rgba(104,66,6,${alpha * 0.75})`]] as [number, string][]) {
          c.strokeStyle = col; c.beginPath(); c.moveTo(x + dx, y + dx);
          c.lineTo(x + Math.cos(a) * len * 0.5 - Math.sin(a) * kink + dx, y + Math.sin(a) * len * 0.5 + Math.cos(a) * kink + dx); c.lineTo(x + Math.cos(a) * len + dx, y + Math.sin(a) * len + dx); c.stroke();
        }
      }
      for (let i = 0; i < s * 3; i++) { c.fillStyle = rand() > 0.5 ? "rgba(255,250,210,0.14)" : "rgba(90,58,6,0.12)"; c.fillRect(rand() * s, rand() * s, 1, 1); }
      if (ragged) {
        c.globalCompositeOperation = "destination-out";
        for (let i = 0; i < 16; i++) { const side = Math.floor(rand() * 4), p = rand() * s, d = s * (0.006 + rand() * 0.02); c.beginPath(); if (side === 0) { c.moveTo(p - d, 0); c.lineTo(p, d * 1.4); c.lineTo(p + d, 0); } else if (side === 1) { c.moveTo(p - d, s); c.lineTo(p, s - d * 1.4); c.lineTo(p + d, s); } else if (side === 2) { c.moveTo(0, p - d); c.lineTo(d * 1.4, p); c.lineTo(0, p + d); } else { c.moveTo(s, p - d); c.lineTo(s - d * 1.4, p); c.lineTo(s, p + d); } c.fill(); }
      }
    };

    const build = () => {
      const cssW = Math.min(box.clientWidth, 1000), narrow = cssW < 560;
      const cssH = Math.round(cssW * (narrow ? 0.8 : 0.4));
      cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr); cv.style.height = `${cssH}px`;
      for (const c of [base, temp]) { c.width = cv.width; c.height = cv.height; }
      const W = (g.W = cv.width), H = (g.H = cv.height);
      const side = W * 0.03, eave = H * 0.13, drop = H * 0.11;
      g.px = side; g.py = eave; g.pw = W - side * 2; g.ph = H - eave - drop;
      const mould = g.ph * 0.075;
      g.fx = g.px + mould; g.fy = g.py + mould; g.fw = g.pw - mould * 2; g.fh = g.ph - mould * 2;
      const c = base.getContext("2d"); if (!c) return;
      c.clearRect(0, 0, W, H);
      seed = 11;

      // Shadow on the wall, then the painted board.
      c.save(); c.shadowColor = "rgba(40,36,24,0.5)"; c.shadowBlur = H * 0.06; c.shadowOffsetY = H * 0.035; c.fillStyle = "#000"; c.fillRect(g.px + 4, g.py + 4, g.pw - 8, g.ph - 8); c.restore();
      const paint = c.createLinearGradient(0, g.py, 0, g.py + g.ph); paint.addColorStop(0, PAINT[0]); paint.addColorStop(0.45, PAINT[1]); paint.addColorStop(1, PAINT[2]);
      c.fillStyle = paint; c.fillRect(g.px, g.py, g.pw, g.ph);
      // Brush marks left in the gloss, and the sky it reflects.
      c.save(); c.beginPath(); c.rect(g.fx, g.fy, g.fw, g.fh); c.clip();
      for (let i = 0; i < 260; i++) { const y = g.fy + rand() * g.fh, x = g.fx + rand() * g.fw, len = g.fw * (0.1 + rand() * 0.5); c.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${0.012 + rand() * 0.03})` : `rgba(0,0,0,${0.02 + rand() * 0.05})`; c.fillRect(x, y, len, Math.max(1, dpr * (0.5 + rand()))); }
      const sky = c.createLinearGradient(g.fx, g.fy, g.fx + g.fw * 0.5, g.fy + g.fh); sky.addColorStop(0, "rgba(214,238,226,0.2)"); sky.addColorStop(0.3, "rgba(214,238,226,0.05)"); sky.addColorStop(0.6, "rgba(214,238,226,0)");
      c.fillStyle = sky; c.fillRect(g.fx, g.fy, g.fw, g.fh);
      const well = c.createLinearGradient(0, g.fy, 0, g.fy + g.fh * 0.3); well.addColorStop(0, "rgba(0,0,0,0.5)"); well.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = well; c.fillRect(g.fx, g.fy, g.fw, g.fh * 0.3);
      c.restore();
      // The moulding round the field: four mitred lengths, each lit from above.
      const quad = (pts: number[], fill: string | CanvasGradient) => { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fillStyle = fill; c.fill(); };
      const x0 = g.px, y0 = g.py, x1 = g.px + g.pw, y1 = g.py + g.ph, m = mould;
      const lit = (a: string, b: string, c2: string, ax: number, ay: number, bx: number, by: number) => { const gr = c.createLinearGradient(ax, ay, bx, by); gr.addColorStop(0, a); gr.addColorStop(0.5, b); gr.addColorStop(1, c2); return gr; };
      quad([x0, y0, x1, y0, x1 - m, y0 + m, x0 + m, y0 + m], lit("#4d9079", PAINT[0], "#0c2a20", 0, y0, 0, y0 + m));
      quad([x0, y1, x1, y1, x1 - m, y1 - m, x0 + m, y1 - m], lit("#03120d", PAINT[2], "#2c6e59", 0, y1, 0, y1 - m));
      quad([x0, y0, x0 + m, y0 + m, x0 + m, y1 - m, x0, y1], lit("#3f8570", PAINT[1], "#0a251c", x0, 0, x0 + m, 0));
      quad([x1, y0, x1 - m, y0 + m, x1 - m, y1 - m, x1, y1], lit("#04150f", PAINT[2], "#1f5a47", x1, 0, x1 - m, 0));
      c.strokeStyle = "rgba(0,0,0,0.55)"; c.lineWidth = dpr; c.strokeRect(g.fx - 0.5, g.fy - 0.5, g.fw + 1, g.fh + 1);
      // A lining in gold paint with nipped corners.
      const q = g.fh * 0.085, r = g.fh * 0.07, lx0 = g.fx + q, ly0 = g.fy + q, lx1 = g.fx + g.fw - q, ly1 = g.fy + g.fh - q;
      const liner = (off: number) => { c.beginPath(); c.moveTo(lx0 + r, ly0 + off); c.lineTo(lx1 - r, ly0 + off); c.arc(lx1, ly0 + off, r, Math.PI, Math.PI / 2, true); c.lineTo(lx1, ly1 - r + off); c.arc(lx1, ly1 + off, r, -Math.PI / 2, Math.PI, true); c.lineTo(lx0 + r, ly1 + off); c.arc(lx0, ly1 + off, r, 0, -Math.PI / 2, true); c.lineTo(lx0, ly0 + r + off); c.arc(lx0, ly0 + off, r, Math.PI / 2, 0, true); c.stroke(); };
      const gilt = c.createLinearGradient(g.fx, 0, g.fx + g.fw, 0);
      ([[0, "#b88c30"], [0.2, "#ecd07a"], [0.42, "#c39a3c"], [0.63, "#f3dc90"], [0.82, "#bf953a"], [1, "#e6c96f"]] as [number, string][]).forEach(([p, col]) => gilt.addColorStop(p, col));
      c.lineWidth = Math.max(1.5, g.fh * 0.008); c.strokeStyle = "rgba(0,0,0,0.5)"; liner(c.lineWidth); c.strokeStyle = gilt; liner(0);
      // The cornice over the board and the shadow it drops, then the sill underneath.
      const bands: [number, number, string, string][] = [[0, 0.2, "#5a9c85", "#2f745f"], [0.2, 0.62, "#2a6c58", "#0e3024"], [0.62, 0.78, "#3d826c", "#1b4f3f"], [0.78, 1, "#143d30", "#06180f"]];
      for (const [a, b, top, bot] of bands) { const inset = a * side * 0.9, gr = c.createLinearGradient(0, eave * a, 0, eave * b); gr.addColorStop(0, top); gr.addColorStop(1, bot); c.fillStyle = gr; c.fillRect(inset, eave * a, W - inset * 2, eave * (b - a) + 1); c.fillStyle = "rgba(190,236,214,0.3)"; c.fillRect(inset, eave * a, W - inset * 2, dpr); c.fillStyle = "rgba(0,0,0,0.45)"; c.fillRect(inset, eave * b - dpr, W - inset * 2, dpr); }
      const shade = c.createLinearGradient(0, g.py, 0, g.py + g.ph * 0.24); shade.addColorStop(0, "rgba(0,0,0,0.62)"); shade.addColorStop(0.35, "rgba(0,0,0,0.26)"); shade.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = shade; c.fillRect(g.px, g.py, g.pw, g.ph * 0.24);
      const sill = c.createLinearGradient(0, y1, 0, y1 + drop * 0.34); sill.addColorStop(0, "#3f8570"); sill.addColorStop(0.25, PAINT[1]); sill.addColorStop(1, "#05150f");
      c.fillStyle = sill; c.fillRect(side * 0.45, y1, W - side * 0.9, drop * 0.34);

      // Set out the lettering.
      const tradeSize = Math.max(9 * dpr, g.fh * 0.085);
      g.size = g.fh * 0.5; g.track = g.size * 0.07;
      c.font = `700 ${g.size}px ${FACE}`;
      const fitTo = (g.fw - q * 2 - r * 2.4) * 0.9, full = widthOf(c, words.name, g.track);
      if (full > fitTo) { g.size *= fitTo / full; g.track = g.size * 0.07; c.font = `700 ${g.size}px ${FACE}`; }
      g.tw = widthOf(c, words.name, g.track);
      const capH = c.measureText("H").actualBoundingBoxAscent || g.size * 0.68;
      g.cy = g.fy + g.fh * (words.trade ? 0.42 : 0.5); g.x0 = g.fx + g.fw / 2 - g.tw / 2;
      const baseY = g.cy + capH / 2;
      g.s = capH * 1.42;
      g.rx = Math.floor(g.x0 - g.s * 0.3); g.ry = Math.floor(g.cy - g.s * 0.62); g.rw = Math.ceil(g.tw + g.s * 0.6); g.rh = Math.ceil(g.s * 1.24);
      // The blocked shade, then the letters in gold size, which is what the leaf sticks to.
      c.textBaseline = "alphabetic";
      const depth = Math.max(2, g.size * 0.055);
      for (let d = depth; d >= 1; d -= 0.5) { c.fillStyle = d > depth * 0.5 ? "#04130d" : "#0b2a20"; spaced(c, words.name, g.fx + g.fw / 2 + d, baseY + d, g.track); }
      c.lineJoin = "round"; c.lineWidth = Math.max(1.5, g.size * 0.022); c.strokeStyle = "#04130d"; spaced(c, words.name, g.fx + g.fw / 2, baseY, g.track, true);
      c.fillStyle = "#a98334"; spaced(c, words.name, g.fx + g.fw / 2, baseY, g.track);
      if (words.trade) {
        c.font = `700 ${tradeSize}px ${FACE}`;
        let tt = tradeSize * 0.34; const room = g.fw - q * 2 - r * 2.4, natural = widthOf(c, words.trade, tt), flourish = (room - tradeSize * 7.6) / natural > 0.85, tfit = (flourish ? room - tradeSize * 7.6 : room * 0.94) / natural;
        if (tfit < 1) { c.font = `700 ${tradeSize * tfit}px ${FACE}`; tt *= tfit; }
        const ty = g.fy + g.fh * 0.845, half = widthOf(c, words.trade, tt) / 2, mid = g.fx + g.fw / 2;
        c.fillStyle = "rgba(0,0,0,0.5)"; spaced(c, words.trade, mid + dpr, ty + dpr, tt);
        c.fillStyle = gilt; spaced(c, words.trade, mid, ty, tt);
        if (flourish) for (const sgn of [-1, 1]) { const ox = mid + sgn * (half + tradeSize * 1.5), oy = ty - tradeSize * 0.34, d = tradeSize * 0.2; c.beginPath(); c.moveTo(ox - d, oy); c.lineTo(ox, oy - d); c.lineTo(ox + d, oy); c.lineTo(ox, oy + d); c.closePath(); c.fill(); c.fillRect(sgn > 0 ? ox + d * 2 : ox - d * 2 - tradeSize * 1.6, oy - dpr * 0.5, tradeSize * 1.6, dpr); }
      }

      // The letter shapes on their own, and the same shapes punched out of a sheet.
      for (const cvs of [mask, hole, gold]) { cvs.width = g.rw; cvs.height = g.rh; }
      const mc = mask.getContext("2d"), hc = hole.getContext("2d"), gc = gold.getContext("2d");
      if (!mc || !hc || !gc) return;
      mc.font = `700 ${g.size}px ${FACE}`; mc.textBaseline = "alphabetic"; mc.fillStyle = "#fff"; spaced(mc, words.name, g.fx + g.fw / 2 - g.rx, baseY - g.ry, g.track);
      hc.fillStyle = "#000"; hc.fillRect(0, 0, g.rw, g.rh); hc.globalCompositeOperation = "destination-out"; hc.drawImage(mask, 0, 0);
      // Where each leaf goes: one row, each overlapping the last by an eighth.
      const pitch = g.s * 0.87, n = Math.max(2, Math.ceil((g.tw + g.s * 0.2) / pitch));
      time.step = Math.min(0.075, 0.66 / n); time.wipe = time.lay + n * time.step + 0.14; time.burn = time.wipe + time.wipeFor + 0.03;
      const start = g.x0 + g.tw / 2 - ((n - 1) * pitch) / 2;
      leaves = Array.from({ length: n }, (_, i) => ({ x: start + i * pitch + (rand() - 0.5) * g.s * 0.05, y: g.cy + (rand() - 0.5) * g.s * 0.07, rot: (rand() - 0.5) * 0.09, flip: rand() > 0.5 ? 1 : -1, at: time.lay + i * time.step }));
      paintLeaf(loose, g.s, 1, true);
      // The finished gilding: the same leaves pressed flat, cut to the letters, with a rounded edge worked in.
      const flat = make(); paintLeaf(flat, g.s, 0.3, false);
      gc.fillStyle = "#d9ae42"; gc.fillRect(0, 0, g.rw, g.rh);
      leaves.forEach((lf, i) => { gc.save(); gc.translate(lf.x - g.rx, lf.y - g.ry); gc.rotate(lf.rot); gc.scale(lf.flip, 1); gc.globalAlpha = 0.86 + (i % 3) * 0.07; gc.drawImage(flat, -g.s / 2, -g.s / 2, g.s, g.s); gc.globalAlpha = 0.5; gc.strokeStyle = "rgba(255,244,196,0.55)"; gc.lineWidth = dpr * 0.7; gc.strokeRect(-g.s / 2, -g.s / 2, g.s, g.s); gc.restore(); });
      gc.globalCompositeOperation = "destination-in"; gc.drawImage(mask, 0, 0);
      gc.globalCompositeOperation = "source-atop";
      const edge = Math.max(1.5, g.size * 0.024);
      gc.shadowColor = "rgba(84,50,4,0.95)"; gc.shadowBlur = edge * 1.5; gc.shadowOffsetX = -edge; gc.shadowOffsetY = -edge; gc.drawImage(hole, 0, 0);
      gc.shadowColor = "rgba(255,250,214,0.95)"; gc.shadowBlur = edge * 1.1; gc.shadowOffsetX = edge * 0.9; gc.shadowOffsetY = edge * 0.9; gc.drawImage(hole, 0, 0);
      gc.shadowColor = "transparent"; gc.globalCompositeOperation = "source-over";
      specks = Array.from({ length: 46 }, () => [g.rx + rand() * g.rw, g.ry + g.rh * (0.1 + rand() * 0.85), 0.6 + rand() * 1.2, 0.25 + rand() * 0.5]);
    };

    // A band of light and its darker neighbours, cut to the letters, laid over the gold.
    const glaze = (stops: [number, string][], at: number, op: GlobalCompositeOperation, upTo: number) => {
      const tc = temp.getContext("2d"); if (!tc) return;
      tc.globalCompositeOperation = "source-over"; tc.clearRect(g.rx, g.ry, g.rw, g.rh);
      const span = g.rw * 1.6, x = g.rx + g.rw * at;
      const gr = tc.createLinearGradient(x - span / 2, g.ry, x + span / 2 + g.rh * 0.3, g.ry + g.rh);
      stops.forEach(([p, col]) => gr.addColorStop(p, col));
      tc.fillStyle = gr; tc.fillRect(g.rx, g.ry, Math.max(0, Math.min(g.rw, upTo - g.rx)), g.rh);
      tc.globalCompositeOperation = "destination-in"; tc.drawImage(mask, g.rx, g.ry);
      ctx.globalCompositeOperation = op; ctx.drawImage(temp, g.rx, g.ry, g.rw, g.rh, g.rx, g.ry, g.rw, g.rh); ctx.globalCompositeOperation = "source-over";
    };

    let light = 0.55, lightTo = 0.55, held = -1e9;
    const draw = (t: number) => {
      ctx.clearRect(0, 0, g.W, g.H); ctx.drawImage(base, 0, 0);
      const wipeAt = Math.max(0, Math.min(1, (t - time.wipe) / time.wipeFor)), burnAt = Math.max(0, Math.min(1, (t - time.burn) / time.burnFor));
      const brush = g.rx + g.rw * (wipeAt * wipeAt * (3 - 2 * wipeAt)), front = g.rx + g.rw * burnAt;
      if (wipeAt > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(g.rx, g.ry, brush - g.rx, g.rh); ctx.clip(); ctx.drawImage(gold, g.rx, g.ry); ctx.restore();
        if (burnAt > 0) {
          glaze([[0, "rgba(104,60,0,0.5)"], [0.14, "rgba(255,255,255,0)"], [0.24, "rgba(255,255,255,0)"], [0.37, "rgba(110,64,0,0.5)"], [0.47, "rgba(255,255,255,0)"], [0.57, "rgba(255,255,255,0)"], [0.7, "rgba(110,64,0,0.52)"], [0.8, "rgba(255,255,255,0)"], [0.9, "rgba(255,255,255,0)"], [1, "rgba(104,60,0,0.5)"]], light, "multiply", front);
          glaze([[0, "rgba(255,226,130,0)"], [0.15, "rgba(255,226,130,0)"], [0.19, "rgba(255,232,150,0.5)"], [0.23, "rgba(255,226,130,0)"], [0.46, "rgba(255,226,130,0)"], [0.505, "rgba(255,238,160,0.55)"], [0.525, "rgba(255,250,214,0.95)"], [0.545, "rgba(255,238,160,0.4)"], [0.59, "rgba(255,226,130,0)"], [0.81, "rgba(255,226,130,0)"], [0.85, "rgba(255,232,150,0.5)"], [0.89, "rgba(255,226,130,0)"], [1, "rgba(255,226,130,0)"]], light, "screen", front);
        }
        for (const sp of specks) { if (sp[0] > brush) continue; ctx.fillStyle = `rgba(240,208,110,${sp[3]})`; ctx.fillRect(sp[0], sp[1], sp[2] * dpr, sp[2] * dpr); }
      }
      if (wipeAt < 1) {
        ctx.save(); ctx.beginPath(); ctx.rect(brush, 0, g.W, g.H); ctx.clip();
        for (const lf of leaves) {
          const a = Math.max(0, Math.min(1, (t - lf.at) / 0.16)); if (a <= 0) continue;
          const e = 1 - Math.pow(1 - a, 3);
          ctx.save(); ctx.translate(lf.x, lf.y - (1 - e) * g.s * 0.12); ctx.rotate(lf.rot + (1 - e) * 0.12 * lf.flip); ctx.scale(lf.flip * (1.1 - 0.1 * e), 1.1 - 0.1 * e);
          ctx.globalAlpha = e; ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = (1 - e) * 14 * dpr + 2 * dpr; ctx.shadowOffsetY = (1 - e) * 10 * dpr + dpr;
          ctx.drawImage(loose, -g.s / 2, -g.s / 2, g.s, g.s); ctx.restore();
        }
        ctx.restore();
      }
      if (burnAt > 0 && burnAt < 1) glaze([[0, "rgba(255,255,255,0)"], [0.47, "rgba(255,255,255,0)"], [0.5, "rgba(255,255,255,0.95)"], [0.53, "rgba(255,255,255,0)"], [1, "rgba(255,255,255,0)"]], burnAt, "screen", g.rx + g.rw);
      for (const f of flakes) {
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot); ctx.scale(1, Math.cos(f.phase));
        ctx.globalAlpha = Math.min(1, f.life * 2.2); ctx.fillStyle = f.tone > 0.66 ? "#fff1b4" : f.tone > 0.33 ? "#e8c257" : "#c2932c";
        ctx.fillRect(-f.size / 2, -f.size / 2, f.size, f.size * 0.8); ctx.restore();
      }
    };

    let raf = 0, last = 0, t = 0, seen = true;
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.033, (now - last) / 1000 || 0.016); last = now; t += dt;
      const wipeAt = (t - time.wipe) / time.wipeFor;
      if (wipeAt > 0 && wipeAt < 1) {
        // The mop knocks the loose gold off as it passes.
        const brush = g.rx + g.rw * (wipeAt * wipeAt * (3 - 2 * wipeAt));
        for (let i = 0; i < 5; i++) flakes.push({ x: brush + (rand() - 0.3) * g.s * 0.2, y: g.ry + rand() * g.rh, vx: (60 + rand() * 300) * dpr, vy: (-200 + rand() * 240) * dpr, rot: rand() * 6.3, vr: (rand() - 0.5) * 14, size: (0.8 + rand() * rand() * 4.2) * dpr, life: 0.35 + rand() * 0.6, tone: rand(), phase: rand() * 6.3 });
      }
      for (const f of flakes) { f.vy += 900 * dpr * dt; f.vx *= 1 - 2.6 * dt; f.vy *= 1 - 1.5 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt; f.phase += dt * 11; f.life -= dt; }
      flakes = flakes.filter((f) => f.life > 0 && f.y < g.H + 20);
      if (now - held > 2600) lightTo = 0.5 + 0.32 * Math.sin(t * 0.8 - 1.2);
      light += (lightTo - light) * Math.min(1, dt * 5);
      draw(t);
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (reduce) { draw(99); return; } if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    build(); wake();
    api.current = {
      set: (n, tr) => { if (n === words.name && tr === words.trade) return; words.name = n; words.trade = tr; build(); t = 0; flakes = []; wake(); },
      again: () => { t = 0; flakes = []; wake(); },
    };
    let width = box.clientWidth;
    const ro = new ResizeObserver(() => { if (box.clientWidth === width) return; width = box.clientWidth; build(); if (t < time.burn + time.burnFor) t = 99; wake(); });
    ro.observe(box);
    const onMove = (ev: PointerEvent) => { const b = cv.getBoundingClientRect(); held = performance.now(); lightTo = Math.max(0.05, Math.min(0.95, (ev.clientX - b.left) / b.width)); if (reduce) { light = lightTo; draw(99); } };
    cv.addEventListener("pointermove", onMove); cv.addEventListener("pointerdown", onMove);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerdown", onMove); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  // Re-gild a moment after the typing stops, not on every key.
  useEffect(() => {
    const id = window.setTimeout(() => api.current?.set(name.trim() || " ", trade.trim()), 320);
    return () => window.clearTimeout(id);
  }, [name, trade]);

  const field = "h-10 w-full rounded-md border border-[#a9ae9d] bg-[#f3f4ee] px-3 font-mono text-[12px] uppercase tracking-[0.14em] text-[#1c2a22] outline-none focus-visible:ring-2 focus-visible:ring-[#12392c]";
  return (
    <div className="flex min-h-[620px] w-full flex-col items-center justify-center bg-[#d9dccf] bg-[radial-gradient(90%_80%_at_50%_30%,#e9ebe0_0%,#d9dccf_55%,#c6cabb_100%)] px-4 py-12 sm:min-h-[740px]">
      <h2 className="sr-only">{name}{trade ? `. ${trade}` : ""}</h2>
      <div ref={wrap} className="w-full max-w-[1000px]">
        <canvas ref={canvas} aria-hidden="true" className="mx-auto block w-full touch-pan-y" style={{ height: 400 }} />
      </div>
      <div className="mt-8 flex w-full max-w-[620px] flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-[170px]">
          <label htmlFor={`${SLUG}-name`} className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-[#4c5648]">Name in gold</label>
          <input id={`${SLUG}-name`} value={name} spellCheck={false} onChange={(e) => setName(cleanName(e.target.value))} className={field} />
        </div>
        <div className="flex-1">
          <label htmlFor={`${SLUG}-trade`} className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-[#4c5648]">Line beneath</label>
          <input id={`${SLUG}-trade`} value={trade} spellCheck={false} onChange={(e) => setTrade(cleanTrade(e.target.value))} className={field} />
        </div>
        <button type="button" onClick={() => api.current?.again()} className="h-10 shrink-0 rounded-md bg-[#12392c] px-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[#f1e3b4] outline-none transition-colors hover:bg-[#1a4a3a] focus-visible:ring-2 focus-visible:ring-[#12392c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#d9dccf] motion-reduce:hidden motion-reduce:transition-none">
          Gild again
        </button>
      </div>
    </div>
  );
}

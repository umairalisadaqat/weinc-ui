import { useEffect, useRef, useState } from "react";

// The picture inside the bag, the cloth, and the label sewn to the front.
const PHOTO = {
  src: "https://images.pexels.com/photos/21352928/pexels-photo-21352928.jpeg?auto=compress&cs=tinysrgb&w=900",
  alt: "Woman in an olive roll-neck with a black jacket over one shoulder against a magenta backdrop",
  fallback: "#c2163f", // shown inside the bag until the photograph arrives
  focusY: 0.02, // 0 keeps the top of the photo, 1 the bottom
};
const CLOTH: [number, number, number] = [36, 66, 52]; // bottle green waxed canvas
const LINING: [number, number, number] = [236, 226, 204]; // ecru ticking on the turned-back edges
const STRIPE: [number, number, number] = [44, 58, 96];
const LABEL = "NO. 12";
const OPEN_AT_REST = 0.8; // how far the demo (and reduced motion) leaves the zip, 0 to 1

// Design space: everything is drawn for a 440 by 700 scene and scaled to the box.
const SW = 440, SH = 700, CX = 220, PEG_Y = 30, TOP = 78, BOT = 672, HW = 172;
const Z0 = TOP + 16, Z1 = BOT - 62, PAD = 64; // PAD is spare canvas round the scene so shadows are never cut off
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function GarmentBagZipReveal() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const api = useRef<{ go: (v: number) => void } | null>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const cv = canvas.current, wrap = box.current, pad = track.current, img = photo.current;
    if (!cv || !wrap || !pad) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let k = 1;

    // Woven tiles, made once: a duck canvas for the bag and a striped ticking for its inside face.
    let seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const tile = (size: number, fn: (i: number, j: number) => [number, number, number]) => {
      const c = document.createElement("canvas"); c.width = c.height = size;
      const x = c.getContext("2d");
      if (!x) return c;
      const im = x.createImageData(size, size);
      for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
        const [r, g, b] = fn(i, j), o = (j * size + i) * 4;
        im.data[o] = clamp(r, 0, 255); im.data[o + 1] = clamp(g, 0, 255); im.data[o + 2] = clamp(b, 0, 255); im.data[o + 3] = 255;
      }
      x.putImageData(im, 0, 0);
      return c;
    };
    const thread = (i: number, j: number, p: number) => {
      const fx = (i % p) / p, fy = (j % p) / p, over = (Math.floor(i / p) + Math.floor(j / p)) & 1;
      const along = over ? fx : fy, across = over ? fy : fx;
      return Math.pow(Math.sin(Math.PI * along), 0.55) * (0.72 + 0.28 * Math.sin(Math.PI * across));
    };
    const clothTile = tile(144, (i, j) => {
      const cloud = Math.sin((i / 144) * Math.PI * 2 + 1) * Math.sin((j / 144) * Math.PI * 2 + 2.2) * 0.035 + Math.sin((i / 144) * Math.PI * 4 + (j / 144) * Math.PI * 2) * 0.02;
      const v = 0.74 + 0.3 * thread(i, j, 6) + (rand() - 0.5) * 0.1 + cloud;
      return [CLOTH[0] * v, CLOTH[1] * v, CLOTH[2] * v];
    });
    const liningTile = tile(144, (i, j) => {
      const v = 0.86 + 0.14 * thread(i, j, 4) + (rand() - 0.5) * 0.05;
      const m = i % 48, stripe = m < 6 || (m >= 10 && m < 12) || (m >= 42 && m < 44);
      const c = stripe ? STRIPE : LINING, w = stripe ? v * 0.96 : v;
      return [c[0] * w, c[1] * w, c[2] * w];
    });
    const pat = (src: HTMLCanvasElement) => { const p = ctx.createPattern(src, "repeat"); if (p && p.setTransform) p.setTransform(new DOMMatrix().scale(0.5)); return p || "#244234"; };
    const clothPat = pat(clothTile), liningPat = pat(liningTile);

    const s = { z: 0, zv: 0, target: 0, raw: 0, drag: false, swing: 0, sv: 0, lean: 0, tab: 0, tv: 0 };

    const body = () => {
      ctx.beginPath();
      ctx.moveTo(CX - 22, TOP);
      ctx.bezierCurveTo(CX - 74, TOP + 2, CX - HW, TOP + 16, CX - HW, TOP + 72);
      ctx.lineTo(CX - HW, BOT - 26); ctx.quadraticCurveTo(CX - HW, BOT, CX - HW + 26, BOT);
      ctx.lineTo(CX + HW - 26, BOT); ctx.quadraticCurveTo(CX + HW, BOT, CX + HW, BOT - 26);
      ctx.lineTo(CX + HW, TOP + 72);
      ctx.bezierCurveTo(CX + HW, TOP + 16, CX + 74, TOP + 2, CX + 22, TOP);
      ctx.closePath();
    };
    const brass = (x0: number, x1: number) => {
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, "#6a4a16"); g.addColorStop(0.22, "#c79d3e"); g.addColorStop(0.4, "#fff1b4"); g.addColorStop(0.58, "#d2a84a"); g.addColorStop(0.82, "#8a6420"); g.addColorStop(1, "#553a0e");
      return g;
    };
    // A truly soft line: the stroke itself is drawn far off the canvas and only its blurred shadow lands in view.
    const haze = (x: CanvasRenderingContext2D, path: () => void, colour: string, width: number, blur: number) => {
      x.save(); x.shadowColor = colour; x.shadowBlur = blur * k; x.shadowOffsetX = 6000; x.translate(-6000 / k, 0);
      x.lineWidth = width; x.lineCap = "round"; x.strokeStyle = "#000"; path(); x.stroke(); x.restore();
    };
    // Light and drape are painted once into two layers: the hanging folds of the whole front, and the creases round the slider.
    const shade = document.createElement("canvas"), crease = document.createElement("canvas");
    const SM = 24, CW = 190, CH = 210;
    const bake = () => {
      shade.width = Math.ceil((HW * 2 + SM * 2) * k); shade.height = Math.ceil((BOT - TOP) * k);
      const x = shade.getContext("2d");
      if (x) {
        x.setTransform(k, 0, 0, k, -(CX - HW - SM) * k, -TOP * k);
        const round = x.createLinearGradient(CX - HW, 0, CX + HW, 0);
        round.addColorStop(0, "rgba(0,0,0,0.5)"); round.addColorStop(0.09, "rgba(0,0,0,0.16)"); round.addColorStop(0.27, "rgba(255,255,255,0.08)"); round.addColorStop(0.45, "rgba(255,255,255,0.02)"); round.addColorStop(0.8, "rgba(0,0,0,0.12)"); round.addColorStop(1, "rgba(0,0,0,0.56)");
        x.fillStyle = round; x.fillRect(CX - HW - SM, TOP, (HW + SM) * 2, BOT - TOP);
        const fall = x.createLinearGradient(0, TOP, 0, BOT);
        fall.addColorStop(0, "rgba(255,255,255,0.1)"); fall.addColorStop(0.3, "rgba(255,255,255,0)"); fall.addColorStop(1, "rgba(0,0,0,0.34)");
        x.fillStyle = fall; x.fillRect(CX - HW - SM, TOP, (HW + SM) * 2, BOT - TOP);
        // Long folds that hang from the shoulders, each a dark valley beside a lit ridge.
        const drapes: [number, number, number, number][] = [[-150, -138, 8, 0.8], [-112, -84, 15, 1], [-62, -66, 9, 0.6], [58, 70, 10, 0.7], [104, 86, 16, 1], [148, 140, 8, 0.8]];
        for (const [x0, x1, w, a] of drapes) {
          const line = (dx: number) => () => { x.beginPath(); x.moveTo(CX + x0 + dx, TOP + 40); x.bezierCurveTo(CX + x0 + dx, TOP + 230, CX + x1 + dx, BOT - 250, CX + x1 + dx, BOT + 10); };
          haze(x, line(w * 0.6), `rgba(0,0,0,${0.5 * a})`, w * 0.9, w * 1.3);
          haze(x, line(-w * 0.5), `rgba(214,244,224,${0.22 * a})`, w * 0.5, w);
        }
        // The hanger inside pushes a ridge out under each shoulder, and the weight makes the hem smile.
        for (const sg of [-1, 1]) {
          const ridge = (dy: number) => () => { x.beginPath(); x.moveTo(CX + sg * 26, TOP + 16 + dy); x.quadraticCurveTo(CX + sg * 96, TOP + 22 + dy, CX + sg * 158, TOP + 64 + dy); };
          haze(x, ridge(0), "rgba(214,244,224,0.5)", 5, 7); haze(x, ridge(13), "rgba(0,0,0,0.5)", 7, 9);
          const sag = (y: number, dy: number) => () => { x.beginPath(); x.moveTo(CX + sg * 26, BOT - y + dy); x.quadraticCurveTo(CX + sg * 104, BOT - y + 26 + dy, CX + sg * 170, BOT - y - 18 + dy); };
          haze(x, sag(58, 0), "rgba(0,0,0,0.3)", 8, 14); haze(x, sag(58, -14), "rgba(214,244,224,0.12)", 5, 12);
        }
      }
      crease.width = Math.ceil(CW * 2 * k); crease.height = Math.ceil(CH * k);
      const c = crease.getContext("2d");
      if (c) {
        c.setTransform(k, 0, 0, k, CW * k, 20 * k);
        for (const sg of [-1, 1]) for (const [ang, len, w] of [[0.3, 168, 9], [0.66, 150, 8], [1.02, 120, 7], [1.36, 92, 6]] as const) {
          const dx = Math.sin(ang) * sg, dy = Math.cos(ang);
          const line = (off: number) => () => { c.beginPath(); c.moveTo(sg * 22 + dx * 16 + off * dy, 6 + dy * 16 - off * dx); c.quadraticCurveTo(sg * 22 + dx * len * 0.5 + off * dy, 24 + dy * len * 0.46 - off * dx, sg * 22 + dx * len + off * dy, 12 + dy * len * 0.84 - off * dx); };
          haze(c, line(w * 0.55), "rgba(0,0,0,0.42)", w * 0.5, w); haze(c, line(-w * 0.55), "rgba(214,244,224,0.22)", w * 0.3, w * 0.8);
        }
        // Fade the creases out where they leave the slider so no stroke has a visible end.
        c.globalCompositeOperation = "destination-in";
        const fade = c.createRadialGradient(0, 10, 20, 0, 10, 176);
        fade.addColorStop(0, "rgba(0,0,0,1)"); fade.addColorStop(0.5, "rgba(0,0,0,0.8)"); fade.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = fade; c.fillRect(-CW, -20, CW * 2, CH);
      }
    };
    const tooth = (x: number, y: number, ang: number) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.fillStyle = "#4e370d"; ctx.fillRect(-0.6, -2.5, 8.2, 5.4);
      ctx.fillStyle = "#b98f36"; ctx.fillRect(-0.6, -2.5, 7.6, 4.4);
      ctx.fillStyle = "#f6e09a"; ctx.fillRect(0.4, -2.2, 5.6, 1.5);
      ctx.fillStyle = "#e2c06a"; ctx.fillRect(4.6, -1.6, 2, 2.6);
      ctx.restore();
    };

    const draw = () => {
      ctx.setTransform(k, 0, 0, k, PAD * k, PAD * k);
      ctx.clearRect(-PAD, -PAD, SW + PAD * 2, SH + PAD * 2);
      const ys = Z0 + 24 + s.z * (Z1 - Z0 - 44);
      const reach = 54 + 40 * s.z, ease = 150;
      const U = ys - (TOP - 12), N = 30;
      const fold: [number, number][] = [], edge: [number, number][] = [];
      for (let i = 0; i <= N; i++) {
        const u = (U * i) / N, f = reach * (1 - Math.exp(-u / ease)) + 0.045 * u, cap = HW - 40;
        const e = -10 * Math.log(Math.exp(-(f * 1.72) / 10) + Math.exp(-cap / 10));
        fold.push([f, ys - u]); edge.push([Math.min(e, cap), ys - u]);
      }

      // The peg on the wall and the wire hook over it.
      ctx.save(); ctx.shadowColor = "rgba(60,44,20,0.35)"; ctx.shadowBlur = 10 * k; ctx.shadowOffsetX = 5 * k; ctx.shadowOffsetY = 8 * k;
      const pg = ctx.createRadialGradient(CX - 3, PEG_Y - 4, 1, CX, PEG_Y, 11);
      pg.addColorStop(0, "#f3dcb4"); pg.addColorStop(0.55, "#c99a5c"); pg.addColorStop(1, "#8a5e2c");
      ctx.beginPath(); ctx.arc(CX, PEG_Y, 10, 0, Math.PI * 2); ctx.fillStyle = pg; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(CX, PEG_Y, 6.4, 0, Math.PI * 2); ctx.strokeStyle = "rgba(90,58,22,0.35)"; ctx.lineWidth = 0.8; ctx.stroke();

      ctx.save();
      ctx.translate(CX, PEG_Y); ctx.rotate(s.swing); ctx.translate(-CX, -PEG_Y);

      // Shadow of the whole bag on the wall, then the hook.
      ctx.save(); ctx.shadowColor = "rgba(58,42,18,0.42)"; ctx.shadowBlur = 46 * k; ctx.shadowOffsetX = 20 * k; ctx.shadowOffsetY = 30 * k;
      body(); ctx.fillStyle = "#1c3327"; ctx.fill(); ctx.restore();
      ctx.save(); ctx.shadowColor = "rgba(40,28,10,0.5)"; ctx.shadowBlur = 5 * k; ctx.shadowOffsetX = 3 * k; ctx.shadowOffsetY = 4 * k;
      const hook = () => { ctx.beginPath(); ctx.arc(CX, PEG_Y, 14.5, Math.PI * 0.8, Math.PI * 2.5); ctx.lineTo(CX, TOP + 4); };
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.lineWidth = 5.4; ctx.strokeStyle = "#6f7377"; hook(); ctx.stroke(); ctx.restore();
      ctx.lineWidth = 3; ctx.strokeStyle = "#d9dde0"; hook(); ctx.stroke();
      ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.save(); ctx.translate(-0.8, -0.8); hook(); ctx.stroke(); ctx.restore();

      ctx.save(); body(); ctx.clip();

      // What is inside: the photograph, pushed back by a little darkness.
      ctx.fillStyle = PHOTO.fallback; ctx.fillRect(CX - HW, TOP, HW * 2, BOT - TOP);
      if (img && img.complete && img.naturalWidth > 0) {
        const bw = HW * 2, bh = BOT - TOP, sc = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
        const dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
        ctx.drawImage(img, CX - dw / 2, TOP - (dh - bh) * PHOTO.focusY, dw, dh);
      }
      const deep = ctx.createLinearGradient(0, TOP, 0, TOP + 130);
      deep.addColorStop(0, "rgba(10,6,8,0.5)"); deep.addColorStop(1, "rgba(10,6,8,0)");
      ctx.fillStyle = deep; ctx.fillRect(CX - HW, TOP, HW * 2, 130);

      // The two halves of the front, each throwing a shadow down onto the photograph.
      const half = (sgn: number) => {
        ctx.beginPath(); ctx.moveTo(CX, ys);
        for (const [f, y] of fold) ctx.lineTo(CX + sgn * f, y);
        ctx.lineTo(CX + sgn * (HW + 30), TOP - 12); ctx.lineTo(CX + sgn * (HW + 30), BOT + 12); ctx.lineTo(CX, BOT + 12); ctx.closePath();
      };
      for (const sgn of [-1, 1]) {
        ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.72)"; ctx.shadowBlur = 26 * k; ctx.shadowOffsetX = -sgn * 5 * k; ctx.shadowOffsetY = 9 * k;
        half(sgn); ctx.fillStyle = clothPat; ctx.fill(); ctx.restore();
      }

      // Light and drape on the cloth: a rounded front, long hanging folds, and creases pulled toward the slider.
      ctx.save();
      ctx.beginPath();
      for (const sgn of [-1, 1]) { ctx.moveTo(CX, ys); for (const [f, y] of fold) ctx.lineTo(CX + sgn * f, y); ctx.lineTo(CX + sgn * (HW + 30), TOP - 12); ctx.lineTo(CX + sgn * (HW + 30), BOT + 12); ctx.lineTo(CX, BOT + 12); ctx.closePath(); }
      ctx.clip();
      const lean = clamp(s.sv * 0.05 + (s.swing - s.lean) * 0.12, -0.03, 0.03); // the folds trail the swing
      ctx.save(); ctx.transform(1, 0, -lean, 1, lean * (TOP + 120), 0);
      ctx.drawImage(shade, CX - HW - SM, TOP, HW * 2 + SM * 2, BOT - TOP); ctx.restore();
      ctx.globalAlpha = Math.min(1, s.z * 3) * Math.min(1, 0.62 + Math.abs(s.zv) * 0.5);
      ctx.drawImage(crease, CX - CW, ys - 6, CW * 2, CH); ctx.globalAlpha = 1;
      ctx.restore();

      // Bound edge with a row of stitching, and the woven label.
      ctx.lineJoin = "round";
      body(); ctx.lineWidth = 24; ctx.strokeStyle = "rgba(14,30,22,0.9)"; ctx.stroke();
      body(); ctx.lineWidth = 24.6; ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.stroke();
      ctx.save(); ctx.translate(CX, (TOP + BOT) / 2); ctx.scale(0.925, 0.957); ctx.translate(-CX, -(TOP + BOT) / 2);
      body(); ctx.setLineDash([5.2, 3.6]); ctx.lineWidth = 1.25; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.save(); ctx.translate(0, 0.9); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = "#d8b56a"; ctx.stroke(); ctx.setLineDash([]); ctx.restore();

      ctx.save(); ctx.translate(CX + 74, BOT - 84); ctx.rotate(-0.012);
      ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 5 * k; ctx.shadowOffsetY = 2 * k;
      ctx.fillStyle = "#ece3cf"; ctx.fillRect(0, 0, 66, 25); ctx.shadowColor = "transparent";
      const lg = ctx.createLinearGradient(0, 0, 0, 25); lg.addColorStop(0, "rgba(255,255,255,0.5)"); lg.addColorStop(1, "rgba(120,96,50,0.22)");
      ctx.fillStyle = lg; ctx.fillRect(0, 0, 66, 25);
      ctx.strokeStyle = "rgba(60,44,20,0.14)"; ctx.lineWidth = 0.5; for (let y = 1.5; y < 25; y += 1.6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(66, y); ctx.stroke(); }
      ctx.fillStyle = "#1f3a2e"; ctx.font = "700 9.5px ui-monospace, SFMono-Regular, Menlo, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(LABEL, 33, 13);
      ctx.strokeStyle = "#9c2f25"; ctx.lineWidth = 1.2; ctx.setLineDash([2.4, 1.8]);
      for (const x of [3, 63]) { ctx.beginPath(); ctx.moveTo(x, 1.5); ctx.lineTo(x, 23.5); ctx.stroke(); }
      ctx.setLineDash([]); ctx.restore();

      // The closed run of the zip below the slider: tape, two rows of stitching and meshed teeth.
      ctx.save();
      const tapeShade = ctx.createLinearGradient(CX - 20, 0, CX + 20, 0);
      tapeShade.addColorStop(0, "rgba(0,0,0,0.5)"); tapeShade.addColorStop(0.18, "#152a20"); tapeShade.addColorStop(0.82, "#152a20"); tapeShade.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = tapeShade; ctx.fillRect(CX - 15, ys, 30, Z1 + 16 - ys);
      ctx.setLineDash([4.6, 3.2]); ctx.lineWidth = 1.15; ctx.strokeStyle = "#d8b56a";
      for (const x of [-19.5, 19.5]) { ctx.beginPath(); ctx.moveTo(CX + x, ys + 18); ctx.lineTo(CX + x, Z1 + 20); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(CX - 19.5, Z1 + 20); ctx.lineTo(CX + 19.5, Z1 + 20); ctx.stroke(); ctx.setLineDash([]);
      let n = 0;
      for (let y = Z1 - 2; y > ys + 12; y -= 5) { tooth(n % 2 ? CX - 6.6 : CX + 6.6, y, n % 2 ? 0 : Math.PI); n++; }
      ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 4 * k; ctx.shadowOffsetY = 2 * k;
      ctx.fillStyle = brass(CX - 9, CX + 9); ctx.beginPath(); ctx.roundRect(CX - 9, Z1 + 1, 18, 11, 2.2); ctx.fill();
      ctx.restore();

      // The turned-back edges: striped inside face, a soft roll at the fold, tape and teeth on the far side.
      for (const sgn of [-1, 1]) {
        const lapel = () => { ctx.beginPath(); ctx.moveTo(CX, ys); for (const [f, y] of fold) ctx.lineTo(CX + sgn * f, y); for (let i = N; i >= 0; i--) ctx.lineTo(CX + sgn * edge[i][0], edge[i][1]); ctx.closePath(); };
        const along = (pts: [number, number][], off: number) => () => { ctx.beginPath(); pts.forEach(([f, y], i) => { const x = CX + sgn * (f + off); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); };
        ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 16 * k; ctx.shadowOffsetX = sgn * 7 * k; ctx.shadowOffsetY = 10 * k;
        lapel(); ctx.fillStyle = "#e9dfc8"; ctx.fill(); ctx.restore();
        ctx.save(); lapel(); ctx.clip();
        const tilt = Math.atan2(edge[N][0] - edge[0][0], U) * sgn;
        ctx.save(); ctx.translate(CX, ys); ctx.rotate(tilt); ctx.fillStyle = liningPat; ctx.fillRect(-400, -900, 800, 1000); ctx.restore();
        for (const [off, w, col] of [[0, 12, "rgba(30,20,8,0.16)"], [0, 6, "rgba(30,20,8,0.2)"], [0, 2.4, "rgba(30,20,8,0.3)"], [12, 18, "rgba(255,253,246,0.2)"], [12, 9, "rgba(255,253,246,0.26)"], [12, 3, "rgba(255,253,246,0.3)"], [30, 30, "rgba(70,50,20,0.07)"]] as const) { ctx.lineWidth = w; ctx.strokeStyle = col; along(fold, off)(); ctx.stroke(); }
        for (const [w, a] of [[52, 0.05], [40, 0.07], [32, 0.1]] as const) { ctx.lineWidth = w; ctx.strokeStyle = `rgba(40,26,8,${a})`; along(edge, 0)(); ctx.stroke(); }
        ctx.lineWidth = 27; ctx.strokeStyle = "#152a20"; along(edge, 0)(); ctx.stroke();
        ctx.setLineDash([4.6, 3.2]); ctx.lineWidth = 1.15; ctx.strokeStyle = "#d8b56a"; along(edge, -9.5)(); ctx.stroke(); ctx.setLineDash([]);
        ctx.restore();
        let acc = sgn > 0 ? 4 : 9.4;
        for (let i = 1; i <= N; i++) {
          const ax = CX + sgn * edge[i - 1][0], ay = edge[i - 1][1], bx = CX + sgn * edge[i][0], by = edge[i][1];
          const seg = Math.hypot(bx - ax, by - ay), ang = Math.atan2(by - ay, bx - ax);
          while (acc < seg) { const t = acc / seg; tooth(ax + (bx - ax) * t, ay + (by - ay) * t, ang + (sgn > 0 ? Math.PI / 2 : -Math.PI / 2)); acc += 10.8; }
          acc -= seg;
        }
      }
      ctx.restore(); // end of the clip to the bag

      // The slider and its pull tab.
      ctx.save(); ctx.translate(CX, ys + 4);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.65)"; ctx.shadowBlur = 9 * k; ctx.shadowOffsetX = 3 * k; ctx.shadowOffsetY = 6 * k;
      ctx.beginPath(); ctx.moveTo(-15, -17); ctx.quadraticCurveTo(-16.5, -22, -11, -22); ctx.lineTo(-4, -22); ctx.lineTo(0, -14); ctx.lineTo(4, -22); ctx.lineTo(11, -22); ctx.quadraticCurveTo(16.5, -22, 15, -17);
      ctx.lineTo(10.5, 13); ctx.quadraticCurveTo(9.5, 18, 4.5, 18); ctx.lineTo(-4.5, 18); ctx.quadraticCurveTo(-9.5, 18, -10.5, 13); ctx.closePath();
      ctx.fillStyle = brass(-16, 16); ctx.fill(); ctx.restore();
      ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(60,38,6,0.85)"; ctx.stroke();
      const sl = ctx.createLinearGradient(0, -22, 0, 18); sl.addColorStop(0, "rgba(255,255,255,0.45)"); sl.addColorStop(0.3, "rgba(255,255,255,0)"); sl.addColorStop(1, "rgba(40,24,0,0.4)");
      ctx.fillStyle = sl; ctx.fill();
      ctx.save(); ctx.shadowColor = "rgba(40,24,0,0.7)"; ctx.shadowBlur = 3 * k; ctx.shadowOffsetY = 1.5 * k;
      ctx.fillStyle = brass(-6, 6); ctx.beginPath(); ctx.roundRect(-5, -12, 10, 24, 3); ctx.fill(); ctx.restore();
      ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(255,246,200,0.8)"; ctx.beginPath(); ctx.roundRect(-4.4, -11.4, 8.8, 22.8, 2.6); ctx.stroke();
      ctx.translate(0, 3); ctx.rotate(s.tab);
      ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 8 * k; ctx.shadowOffsetX = 4 * k; ctx.shadowOffsetY = 6 * k;
      ctx.beginPath(); ctx.roundRect(-8, -6, 16, 62, [6, 6, 8, 8]); ctx.roundRect(-3.6, -1.5, 7.2, 11, 3.4);
      ctx.fillStyle = brass(-9, 9); ctx.fill("evenodd"); ctx.shadowColor = "transparent";
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(60,38,6,0.8)"; ctx.stroke();
      const tl = ctx.createLinearGradient(0, -6, 0, 56); tl.addColorStop(0, "rgba(255,255,255,0.35)"); tl.addColorStop(0.5, "rgba(255,255,255,0)"); tl.addColorStop(1, "rgba(40,24,0,0.35)");
      ctx.fillStyle = tl; ctx.fill("evenodd");
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(70,46,8,0.55)"; ctx.beginPath(); ctx.roundRect(-4.6, 17, 9.2, 32, 3); ctx.stroke();
      ctx.strokeStyle = "rgba(255,244,196,0.7)"; ctx.beginPath(); ctx.roundRect(-4.6, 17.9, 9.2, 32, 3); ctx.stroke();
      ctx.restore();

      ctx.restore(); // end of the swing
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, t0 = 0, demoAt = 450, shown = 0, scrolling = false;
    const size = () => { const w = wrap.clientWidth; k = (w / SW) * dpr; cv.width = Math.round((SW + PAD * 2) * k); cv.height = Math.round((SH + PAD * 2) * k); bake(); };
    const report = () => { const v = Math.round(s.target * 100); if (v !== shown) { shown = v; setValue(v); } };

    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      if (!scrolling && now - touched > 7000 && t > demoAt) { s.target = s.target > 0.4 ? 0 : OPEN_AT_REST; demoAt = t + (s.target ? 5200 : 2200); report(); }
      const before = s.zv;
      if (s.drag) { const nz = s.z + (s.raw - s.z) * Math.min(1, dt * 26); s.zv = (nz - s.z) / Math.max(dt, 0.001); s.z = nz; }
      else { s.zv += (58 * (s.target - s.z) - 13 * s.zv) * dt; s.z += s.zv * dt; }
      // Pulling the zip tugs the bag off plumb; it swings on its hook and settles.
      s.sv += (-30 * (s.swing - s.lean) - 2.4 * s.sv) * dt + (s.zv - before) * 0.07; s.swing += s.sv * dt;
      // The tab follows the hand: down when opening, flipped up when closing, then it drops and rings.
      const aim = (s.zv < -0.12 ? Math.PI * 0.94 : 0) - s.swing;
      s.tv += (110 * (aim - s.tab) - 9 * s.tv) * dt; s.tab += s.tv * dt;
      draw();
      const busy = s.drag || Math.abs(s.zv) > 0.002 || Math.abs(s.target - s.z) > 0.0015 || Math.abs(s.sv) > 0.002 || Math.abs(s.swing - s.lean) > 0.001 || Math.abs(s.tv) > 0.01 || Math.abs(aim - s.tab) > 0.004;
      if (seen && !document.hidden) raf = busy ? requestAnimationFrame(frame) : window.setTimeout(() => { raf = requestAnimationFrame(frame); }, 220);
    };
    const stop = () => { cancelAnimationFrame(raf); window.clearTimeout(raf); raf = 0; };
    const wake = () => { if (reduce) return; stop(); last = performance.now(); raf = requestAnimationFrame(frame); };
    const settle = () => { s.z = s.target; s.zv = 0; s.swing = 0; s.sv = 0; s.tab = 0; s.tv = 0; draw(); };

    size();
    if (reduce) { s.target = OPEN_AT_REST; report(); settle(); } else { draw(); wake(); }
    api.current = { go: (v) => { touched = performance.now(); scrolling = false; s.target = clamp(v, 0, 1); report(); if (reduce) settle(); else wake(); } };

    const at = (e: PointerEvent) => { const b = wrap.getBoundingClientRect(), y = ((e.clientY - b.top) / b.height) * SH; s.lean = clamp((((e.clientX - b.left) / b.width) * SW - CX) / 900, -0.07, 0.07); return clamp((y - Z0 - 24) / (Z1 - Z0 - 44), 0, 1); };
    const onDown = (e: PointerEvent) => { touched = performance.now(); scrolling = false; s.drag = true; s.raw = at(e); s.target = s.raw; pad.setPointerCapture(e.pointerId); e.preventDefault(); report(); if (reduce) settle(); else wake(); };
    const onMove = (e: PointerEvent) => { if (!s.drag) return; touched = performance.now(); s.raw = at(e); s.target = s.raw; report(); if (reduce) settle(); };
    const onUp = () => { if (!s.drag) return; s.drag = false; s.lean = 0; touched = performance.now(); s.target = s.z; if (reduce) settle(); };
    pad.addEventListener("pointerdown", onDown); pad.addEventListener("pointermove", onMove);
    pad.addEventListener("pointerup", onUp); pad.addEventListener("pointercancel", onUp);

    // On a real page the zip follows the scroll: closed as the bag arrives, open by the time it is centred.
    const onScroll = () => {
      if (s.drag) return;
      const b = wrap.getBoundingClientRect(), vh = window.innerHeight;
      scrolling = true; touched = performance.now();
      s.target = clamp((vh - b.top - b.height * 0.42) / (vh * 0.55), 0, 1) * 0.9; report();
      if (reduce) settle(); else wake();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => { size(); draw(); });
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); else stop(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    const onLoad = () => { draw(); };
    img?.addEventListener("load", onLoad);
    return () => {
      stop(); api.current = null;
      pad.removeEventListener("pointerdown", onDown); pad.removeEventListener("pointermove", onMove);
      pad.removeEventListener("pointerup", onUp); pad.removeEventListener("pointercancel", onUp);
      window.removeEventListener("scroll", onScroll); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", onVis); img?.removeEventListener("load", onLoad);
    };
  }, []);

  return (
    <div className="flex min-h-[720px] w-full flex-col overflow-hidden items-center justify-center bg-[#e6dfd2] bg-[radial-gradient(90%_70%_at_38%_30%,#f4efe6_0%,#e6dfd2_55%,#d6cdbd_100%)] px-4 py-6 sm:min-h-[790px]">
      <div ref={box} className="relative aspect-[440/700] w-full max-w-[440px]">
        <img ref={photo} src={PHOTO.src} alt={PHOTO.alt} width={900} height={1350} loading="eager" className="pointer-events-none absolute left-1/2 top-1/3 h-px w-px opacity-0" />
        <canvas ref={canvas} aria-hidden="true" style={{ left: `${(-PAD / SW) * 100}%`, top: `${(-PAD / SH) * 100}%`, width: `${((SW + PAD * 2) / SW) * 100}%`, height: `${((SH + PAD * 2) / SH) * 100}%` }} className="pointer-events-none absolute max-w-none" />
        <input
          type="range" min={0} max={100} step={5} value={value}
          aria-label="How far the zip is open" aria-valuetext={value === 0 ? "Closed" : `${value} percent open`}
          onChange={(e) => api.current?.go(Number(e.target.value) / 100)}
          className="peer absolute left-1/2 top-1/2 h-px w-px opacity-0"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[9%] bottom-[2.5%] top-[10%] rounded-[28px] ring-[#1f3a2e] ring-offset-4 ring-offset-[#e6dfd2] peer-focus-visible:ring-2" />
        <div ref={track} aria-hidden="true" className="absolute bottom-[8%] left-1/2 top-[12%] w-[26%] -translate-x-1/2 cursor-grab touch-none active:cursor-grabbing" />
      </div>
      <p className="mt-1 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-stone-600">
        <span className="text-stone-900">Garment bag</span>
        <span className="mx-2 text-stone-400">/</span>
        Pull the zip, or scroll
      </p>
    </div>
  );
}

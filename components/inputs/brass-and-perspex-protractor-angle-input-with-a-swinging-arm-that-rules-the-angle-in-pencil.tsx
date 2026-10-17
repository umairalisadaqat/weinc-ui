import { useEffect, useRef, useState } from "react";

const LABEL = "Angle";
const START = 64; // degrees, measured anticlockwise from the right like a real protractor
const TOUR = [118, 35, 90, 152, 64]; // where the arm goes by itself until someone takes it
const DEMO = true; // set to false inside a real form
const INK = "24,34,44"; // printed scale
const RED = "176,52,40"; // the inner, reversed scale
const MAKER = "HALDEN & ROWE   SCHOOL PATTERN   No. 2";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const kind = (a: number) => (a === 0 ? "No turn" : a < 90 ? "Acute" : a === 90 ? "Right angle" : a < 180 ? "Obtuse" : "Straight line");

export default function BrassAndPerspexProtractor() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(START);
  const [geo, setGeo] = useState({ x: 0, y: 0, r: 0, bar: 0 });
  const api = useRef<{ set: (v: number) => void } | null>(null);

  useEffect(() => {
    const box = root.current, cv = canvas.current, pad = hit.current;
    if (!box || !cv || !pad) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const hasConic = typeof ctx.createConicGradient === "function";
    let W = 0, H = 0, R = 200, ox = 0, oy = 0, bar = 30, ri = 120, gapY = 20, rh = 28, small = false, armLen = 240, armW = 15, rk = 15;
    const P = 34; // spare room around each cached layer
    let paper: HTMLCanvasElement | null = null, body: HTMLCanvasElement | null = null, cast: HTMLCanvasElement | null = null, arm: HTMLCanvasElement | null = null, armCast: HTMLCanvasElement | null = null, knob: HTMLCanvasElement | null = null;
    let lead: CanvasPattern | null = null;
    const s = { a: START, v: 0, target: START, drag: false, glint: 0.2, glintTo: 0.2, shown: START };
    const layer = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w * dpr)); c.height = Math.max(1, Math.round(h * dpr)); const x = c.getContext("2d"); if (x) x.scale(dpr, dpr); return [c, x] as const; };
    let seed = 5;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // The outline of the protractor with the centre at 0,0: a half disc on a bar, with a window cut out of it.
    const shape = (c: CanvasRenderingContext2D) => {
      const rc = 5, a0 = Math.asin(gapY / ri), a1 = Math.asin(gapY / rh);
      c.beginPath();
      c.moveTo(-R, 0); c.arc(0, 0, R, Math.PI, Math.PI * 2);
      c.lineTo(R, bar - rc); c.arcTo(R, bar, R - rc, bar, rc); c.lineTo(-R + rc, bar); c.arcTo(-R, bar, -R, bar - rc, rc); c.closePath();
      c.moveTo(-ri * Math.cos(a0), -gapY); c.arc(0, 0, ri, Math.PI + a0, Math.PI * 2 - a0);
      c.lineTo(rh * Math.cos(a1), -gapY); c.arc(0, 0, rh, -a1, Math.PI + a1, true); c.closePath();
    };

    const build = () => {
      W = box.clientWidth; H = box.clientHeight; small = W < 560;
      R = small ? Math.min(158, (W - 30) / 2) : Math.min(292, (W - 150) / 2);
      bar = R * 0.15; ri = R * 0.6; gapY = R * 0.1; rh = R * 0.145;
      armLen = R + (small ? 16 : 34); armW = small ? 11 : 16; rk = small ? 10.5 : 15;
      ox = W / 2; oy = Math.round(H * 0.5 + R * 0.36 - (small ? 30 : 34));
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      setGeo({ x: ox, y: oy, r: R, bar });

      // Squared exercise paper with a ruled margin.
      const [pc, px] = layer(W, H);
      if (px) {
        px.fillStyle = "#f4f0e3"; px.fillRect(0, 0, W, H);
        const g = small ? 10 : 12, x0 = (ox % g) - g, y0 = (oy % g) - g, mx = Math.round((ox - x0) / g) % 5, my = Math.round((oy - y0) / g) % 5;
        for (let x = x0, i = 0; x < W + g; x += g, i++) { px.fillStyle = (i - mx) % 5 === 0 ? "rgba(58,128,172,0.34)" : "rgba(58,128,172,0.15)"; px.fillRect(Math.round(x), 0, 1, H); }
        for (let y = y0, i = 0; y < H + g; y += g, i++) { px.fillStyle = (i - my) % 5 === 0 ? "rgba(58,128,172,0.34)" : "rgba(58,128,172,0.15)"; px.fillRect(0, Math.round(y), W, 1); }
        px.fillStyle = "rgba(214,72,72,0.5)"; px.fillRect(small ? 22 : 70, 0, 1.5, H);
        const im = px.getImageData(0, 0, pc.width, pc.height);
        for (let i = 0; i < im.data.length; i += 4) { const n = (rand() - 0.5) * 9; im.data[i] += n; im.data[i + 1] += n; im.data[i + 2] += n; }
        px.putImageData(im, 0, 0);
        const fall = px.createRadialGradient(W * 0.4, H * 0.32, 60, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
        fall.addColorStop(0, "rgba(255,252,240,0.5)"); fall.addColorStop(0.5, "rgba(255,252,240,0)"); fall.addColorStop(1, "rgba(120,100,60,0.2)");
        px.fillStyle = fall; px.fillRect(0, 0, W, H);
      }
      paper = pc;
      const [lc, lx] = layer(48, 48);
      if (lx) { for (let i = 0; i < 1500; i++) { lx.fillStyle = `rgba(62,64,72,${0.25 + rand() * 0.7})`; lx.fillRect(rand() * 48, rand() * 48, 1.2, 1.2); } lx.fillStyle = "rgba(62,64,72,0.42)"; lx.fillRect(0, 0, 48, 48); }
      lead = ctx.createPattern(lc, "repeat");

      const bw = R * 2 + P * 2, bhh = R + bar + P * 2;
      // What clear plastic leaves on the paper: almost nothing from the sheet, a darker line from each edge.
      const [cc, cx] = layer(bw, bhh);
      if (cx) {
        cx.translate(P + R, P + R);
        cx.save(); cx.shadowColor = "rgba(40,52,66,0.2)"; cx.shadowBlur = 10 * dpr; cx.shadowOffsetX = 9000; cx.translate(-9000 / dpr, 0); shape(cx); cx.fill("evenodd"); cx.restore();
        cx.save(); cx.shadowColor = "rgba(30,44,58,0.5)"; cx.shadowBlur = 4 * dpr; cx.shadowOffsetX = 9000; cx.translate(-9000 / dpr, 0); cx.lineWidth = small ? 2.2 : 3; shape(cx); cx.stroke(); cx.restore();
        // light gathered by the polished edge lands as a thin bright line beside its shadow
        cx.save(); cx.shadowColor = "rgba(255,255,246,0.8)"; cx.shadowBlur = 2 * dpr; cx.shadowOffsetX = 9000 + 3 * dpr; cx.shadowOffsetY = 3.5 * dpr; cx.translate(-9000 / dpr, 0); cx.lineWidth = 1.2; shape(cx); cx.stroke(); cx.restore();
      }
      cast = cc;

      const [bc, bx] = layer(bw, bhh);
      if (bx) {
        bx.translate(P + R, P + R);
        bx.save(); shape(bx); bx.clip("evenodd");
        const tint = bx.createLinearGradient(-R, -R, R, bar);
        tint.addColorStop(0, "rgba(206,236,240,0.34)"); tint.addColorStop(0.5, "rgba(170,216,226,0.16)"); tint.addColorStop(1, "rgba(140,198,212,0.26)");
        bx.fillStyle = tint; bx.fillRect(-R - 2, -R - 2, R * 2 + 4, R + bar + 4);
        // The scale is printed on the underside, so it throws a faint twin onto the paper below it.
        const print = (alpha: number) => {
          const ink = (a: number) => `rgba(${INK},${a * alpha})`;
          for (let d = 0; d <= 180; d++) {
            const t = (d * Math.PI) / 180, c = Math.cos(t), sn = -Math.sin(t), ten = d % 10 === 0, five = d % 5 === 0;
            const len = R * (ten ? 0.085 : five ? 0.06 : 0.036);
            bx.strokeStyle = ink(ten ? 0.92 : 0.8); bx.lineWidth = ten ? 1.15 : small ? 0.6 : 0.75;
            bx.beginPath(); bx.moveTo(c * (R - 2.5), sn * (R - 2.5)); bx.lineTo(c * (R - 2.5 - len), sn * (R - 2.5 - len)); bx.stroke();
            if (ten) { bx.strokeStyle = ink(0.3); bx.lineWidth = 0.6; bx.beginPath(); bx.moveTo(c * (R * 0.76), sn * (R * 0.76)); bx.lineTo(c * (ri + 5), sn * (ri + 5)); bx.stroke(); }
            if (ten) for (const [rad, txt, col, size] of [[R * 0.865, String(d), ink(0.95), R * 0.047], [R * 0.795, String(180 - d), `rgba(${RED},${0.9 * alpha})`, R * 0.038]] as [number, string, string, number][]) {
              const lt = (clamp(d, 5.5, 174.5) * Math.PI) / 180;
              bx.save(); bx.translate(Math.cos(lt) * rad, -Math.sin(lt) * rad); bx.rotate(Math.PI / 2 - lt);
              bx.font = `600 ${Math.max(6.5, size)}px "Helvetica Neue", Helvetica, Arial, sans-serif`; bx.textAlign = "center"; bx.textBaseline = "middle"; bx.fillStyle = col; bx.fillText(txt, 0, 0); bx.restore();
            }
          }
          bx.strokeStyle = ink(0.55); bx.lineWidth = 0.7;
          bx.beginPath(); bx.arc(0, 0, ri + 5, Math.PI, Math.PI * 2); bx.stroke();
          bx.beginPath(); bx.arc(0, 0, R * 0.76, Math.PI, Math.PI * 2); bx.stroke();
          // base line, centre mark and a millimetre rule along the bottom edge
          bx.strokeStyle = ink(0.9); bx.lineWidth = 0.9; bx.beginPath(); bx.moveTo(-R + 3, 0); bx.lineTo(R - 3, 0); bx.stroke();
          bx.beginPath(); bx.moveTo(0, -rh * 0.72); bx.lineTo(0, bar * 0.4); bx.stroke();
          const mm = (R * 1.8) / 140;
          for (let i = 0; i <= 140; i++) { const x = -R * 0.9 + i * mm, big = i % 10 === 0, mid = i % 5 === 0; bx.strokeStyle = ink(big ? 0.9 : 0.7); bx.lineWidth = big ? 0.9 : 0.55; bx.beginPath(); bx.moveTo(x, bar - 1.5); bx.lineTo(x, bar - 1.5 - bar * (big ? 0.34 : mid ? 0.25 : 0.16)); bx.stroke(); if (big && !(small && i % 20)) { bx.font = `600 ${Math.max(6, R * 0.03)}px "Helvetica Neue", Helvetica, Arial, sans-serif`; bx.textAlign = "center"; bx.textBaseline = "middle"; bx.fillStyle = ink(0.9); bx.fillText(String(i / 10), x, bar * 0.36); } }
          if (!small) { bx.font = `600 ${R * 0.022}px "Helvetica Neue", Helvetica, Arial, sans-serif`; bx.textAlign = "left"; bx.fillStyle = ink(0.6); bx.fillText(MAKER.split("").join(" "), rh + 12, -gapY * 0.5); }
        };
        bx.save(); bx.translate(2.2, 2.8); print(0.14); bx.restore();
        print(1);
        // the polished edge: seen from above it is a pale band with a dark line at the very rim
        shape(bx); bx.lineWidth = small ? 9 : 14; bx.strokeStyle = "rgba(120,196,206,0.16)"; bx.stroke();
        shape(bx); bx.lineWidth = small ? 5 : 7; bx.strokeStyle = "rgba(255,255,255,0.42)"; bx.stroke();
        shape(bx); bx.lineWidth = 2.2; bx.strokeStyle = "rgba(34,104,116,0.45)"; bx.stroke();
        bx.restore();
        bx.save(); bx.translate(1.4, 2); shape(bx); bx.lineWidth = 0.8; bx.strokeStyle = "rgba(30,90,104,0.22)"; bx.stroke(); bx.restore();
        shape(bx); bx.lineWidth = 0.9; bx.strokeStyle = "rgba(26,76,88,0.55)"; bx.stroke();
        const lit = bx.createLinearGradient(-R, -R, R * 0.4, 0);
        lit.addColorStop(0, "rgba(255,255,255,0)"); lit.addColorStop(0.25, "rgba(255,255,255,0.95)"); lit.addColorStop(0.6, "rgba(255,255,255,0.5)"); lit.addColorStop(1, "rgba(255,255,255,0)");
        bx.strokeStyle = lit; bx.lineWidth = 1.6; bx.beginPath(); bx.arc(0, 0, R - 1.6, Math.PI * 1.02, Math.PI * 1.72); bx.stroke();
        bx.beginPath(); bx.arc(0, 0, ri + 1.6, Math.PI * 1.55, Math.PI * 1.95); bx.stroke();
      }
      body = bc;

      // The brass arm, lying along +x from the pivot, with a sight slot over the scale.
      const tail = R * 0.1, aw = armLen + tail + P * 2, ah = armW + P * 2;
      const armPath = (c: CanvasRenderingContext2D) => {
        const hw = armW / 2, tip = armLen;
        c.beginPath(); c.moveTo(-tail, -hw * 0.8); c.lineTo(tip - hw * 2.4, -hw); c.lineTo(tip, 0); c.lineTo(tip - hw * 2.4, hw); c.lineTo(-tail, hw * 0.8);
        c.arc(-tail, 0, hw * 0.8, Math.PI / 2, Math.PI * 1.5); c.closePath();
      };
      const slot = (c: CanvasRenderingContext2D) => { const a = R * 0.7, b = R * 0.985, hh = armW * 0.2; c.beginPath(); c.moveTo(a + hh, -hh); c.lineTo(b - hh, -hh); c.arc(b - hh, 0, hh, -Math.PI / 2, Math.PI / 2); c.lineTo(a + hh, hh); c.arc(a + hh, 0, hh, Math.PI / 2, Math.PI * 1.5); c.closePath(); };
      const [ac, ax] = layer(aw, ah);
      if (ax) {
        ax.translate(P + tail, P + armW / 2);
        ax.save(); armPath(ax); ax.clip();
        const g = ax.createLinearGradient(0, -armW / 2, 0, armW / 2);
        g.addColorStop(0, "#fdf0b8"); g.addColorStop(0.1, "#d9ae4e"); g.addColorStop(0.34, "#f7dc8a"); g.addColorStop(0.5, "#cf9f3e"); g.addColorStop(0.82, "#a87724"); g.addColorStop(1, "#6a4710");
        ax.fillStyle = g; ax.fillRect(-tail - 10, -armW, armLen + tail + 20, armW * 2);
        for (let i = 0; i < 70; i++) { ax.fillStyle = rand() > 0.5 ? `rgba(255,246,206,${rand() * 0.16})` : `rgba(70,40,4,${rand() * 0.14})`; ax.fillRect(-tail + rand() * armLen * 0.4, -armW / 2 + rand() * armW, armLen * (0.3 + rand() * 0.7), 0.6); }
        const along = ax.createLinearGradient(0, 0, armLen, 0);
        along.addColorStop(0, "rgba(60,34,4,0.24)"); along.addColorStop(0.3, "rgba(255,248,214,0.14)"); along.addColorStop(0.62, "rgba(60,34,4,0.1)"); along.addColorStop(0.86, "rgba(255,248,214,0.2)"); along.addColorStop(1, "rgba(60,34,4,0.16)");
        ax.fillStyle = along; ax.fillRect(-tail - 10, -armW, armLen + tail + 20, armW * 2);
        ax.restore();
        armPath(ax); ax.lineWidth = 0.9; ax.strokeStyle = "rgba(70,42,6,0.75)"; ax.stroke();
        ax.strokeStyle = "rgba(52,30,4,0.8)"; ax.lineWidth = 0.7; ax.beginPath(); ax.moveTo(rk + 3, 0); ax.lineTo(R * 0.7, 0); ax.moveTo(R * 0.985, 0); ax.lineTo(armLen - 3, 0); ax.stroke();
        ax.strokeStyle = "rgba(255,246,206,0.5)"; ax.lineWidth = 0.6; ax.beginPath(); ax.moveTo(rk + 3, 0.9); ax.lineTo(R * 0.7, 0.9); ax.stroke();
        ax.globalCompositeOperation = "destination-out"; slot(ax); ax.fill(); ax.globalCompositeOperation = "source-over";
        slot(ax); ax.lineWidth = 1.2; ax.strokeStyle = "rgba(60,36,4,0.85)"; ax.stroke();
        ax.save(); slot(ax); ax.clip(); ax.strokeStyle = "rgba(255,240,180,0.9)"; ax.lineWidth = 1.4; ax.beginPath(); ax.moveTo(R * 0.7, armW * 0.2); ax.lineTo(R * 0.985, armW * 0.2); ax.stroke();
        ax.strokeStyle = "rgba(10,10,12,0.9)"; ax.lineWidth = 0.8; ax.beginPath(); ax.moveTo(R * 0.7, 0); ax.lineTo(R * 0.985, 0); ax.stroke(); ax.restore();
      }
      arm = ac;
      const [sc, sx] = layer(aw, ah);
      if (sx) { sx.translate(P + tail, P + armW / 2); sx.shadowColor = "rgba(34,30,20,0.5)"; sx.shadowBlur = 5 * dpr; sx.shadowOffsetX = 9000; sx.translate(-9000 / dpr, 0); armPath(sx); slot(sx); sx.fill("evenodd"); }
      armCast = sc;

      // The knurled thumb nut on the pivot.
      const ks = (rk + 12) * 2;
      const [kc, kx] = layer(ks, ks);
      if (kx) {
        const c = ks / 2;
        kx.save(); kx.shadowColor = "rgba(30,22,8,0.55)"; kx.shadowBlur = 6 * dpr; kx.shadowOffsetX = 2.5 * dpr; kx.shadowOffsetY = 4 * dpr; kx.beginPath(); kx.arc(c, c, rk, 0, Math.PI * 2); kx.fillStyle = "#5a3c0c"; kx.fill(); kx.restore();
        const teeth = small ? 30 : 40, st = (Math.PI * 2) / teeth;
        for (let i = 0; i < teeth; i++) {
          const a0 = i * st, face = Math.cos(a0 + st / 2 + 2.3), litv = 0.5 + 0.5 * face;
          for (let hlf = 0; hlf < 2; hlf++) { kx.beginPath(); kx.moveTo(c, c); kx.arc(c, c, rk, a0 + hlf * st * 0.5, a0 + (hlf + 1) * st * 0.5 + 0.01); kx.closePath(); const v = hlf === 0 ? 120 + litv * 135 : 60 + litv * 70; kx.fillStyle = `rgb(${v | 0},${(v * 0.76) | 0},${(v * 0.3) | 0})`; kx.fill(); }
        }
        const top = rk * 0.74;
        kx.beginPath(); kx.arc(c, c, top + 1, 0, Math.PI * 2); kx.fillStyle = "#5c3d0c"; kx.fill();
        if (hasConic) { const cg = kx.createConicGradient(-2.2, c, c); ([[0, "#fff4c2"], [0.1, "#d8aa48"], [0.24, "#8c611a"], [0.4, "#d2a444"], [0.5, "#f8e29a"], [0.6, "#c9983a"], [0.76, "#7e5514"], [0.9, "#dcb152"], [1, "#fff4c2"]] as [number, string][]).forEach(([p, col]) => cg.addColorStop(p, col)); kx.fillStyle = cg; }
        else kx.fillStyle = "#d2a444";
        kx.beginPath(); kx.arc(c, c, top, 0, Math.PI * 2); kx.fill();
        kx.lineWidth = 0.7; kx.strokeStyle = "rgba(60,36,4,0.45)"; for (let r = 2; r < top; r += 1.7) { kx.beginPath(); kx.arc(c, c, r, 0, Math.PI * 2); kx.globalAlpha = 0.25 + rand() * 0.4; kx.stroke(); }
        kx.globalAlpha = 1; kx.strokeStyle = "rgba(255,248,214,0.7)"; kx.lineWidth = 0.8; kx.beginPath(); kx.arc(c, c, top - 0.5, Math.PI * 1.05, Math.PI * 1.6); kx.stroke();
      }
      knob = kc;
    };

    const pencil = (stroke: () => void, w: number) => {
      ctx.save(); ctx.lineCap = "round"; ctx.strokeStyle = lead || "rgba(62,64,72,0.7)"; ctx.lineWidth = w; stroke();
      ctx.globalAlpha = 0.45; ctx.lineWidth = w * 0.55; ctx.translate(0.5, 0.4); stroke(); ctx.restore();
    };
    const marks = (deg: number) => {
      const t = (deg * Math.PI) / 180, far = R + (small ? 26 : 62);
      pencil(() => { ctx.beginPath(); ctx.moveTo(ox - R - (small ? 8 : 40), oy); ctx.lineTo(ox + far, oy); ctx.stroke(); }, 1.5);
      pencil(() => { ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(t) * far, oy - Math.sin(t) * far); ctx.stroke(); }, 1.5);
      if (deg > 1.5) pencil(() => { ctx.beginPath(); ctx.arc(ox, oy, R * 0.3, -t, 0); ctx.stroke(); }, 1.25);
      const m = (clamp(deg, 26, 154) * Math.PI) / 360;
      ctx.save(); ctx.translate(ox + Math.cos(m) * R * 0.43, oy - Math.sin(m) * R * 0.43); ctx.rotate(-0.07);
      ctx.font = `italic 500 ${Math.max(13, R * 0.085)}px "Bradley Hand", "Segoe Print", "Comic Sans MS", Georgia, serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = lead || "rgba(62,64,72,0.8)"; ctx.fillText(`${Math.round(deg)}°`, 0, 0); ctx.restore();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (paper) ctx.drawImage(paper, 0, 0, W, H);
      marks(s.a);
      const bw = R * 2 + P * 2, bhh = R + bar + P * 2, bx0 = ox - R - P, by0 = oy - R - P;
      if (cast) ctx.drawImage(cast, bx0 + (small ? 4 : 7), by0 + (small ? 6 : 10), bw, bhh);
      // through the sheet everything on the paper sits a little out of place
      ctx.save(); ctx.translate(ox, oy); shape(ctx); ctx.clip("evenodd"); ctx.translate(-ox, -oy);
      const rx = small ? -1.6 : -2.6, ry = small ? -1.4 : -2.2;
      if (paper) ctx.drawImage(paper, rx, ry, W, H);
      ctx.save(); ctx.translate(rx, ry); marks(s.a); ctx.restore();
      if (cast) { ctx.globalAlpha = 0.7; ctx.drawImage(cast, bx0 + (small ? 4 : 7), by0 + (small ? 6 : 10), bw, bhh); ctx.globalAlpha = 1; }
      // a window reflected in the surface, sliding as the light moves
      const gx = ox + s.glint * R * 0.7, g = ctx.createLinearGradient(gx - R * 0.5, oy - R, gx + R * 0.1, oy + bar);
      g.addColorStop(0.3, "rgba(255,255,255,0)"); g.addColorStop(0.42, "rgba(255,255,255,0.34)"); g.addColorStop(0.5, "rgba(255,255,255,0.1)"); g.addColorStop(0.56, "rgba(255,255,255,0.26)"); g.addColorStop(0.64, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(ox - R, oy - R, R * 2, R + bar);
      ctx.restore();
      if (body) ctx.drawImage(body, bx0, by0, bw, bhh);
      const t = (-s.a * Math.PI) / 180, tail = R * 0.1, aw = armLen + tail + P * 2, ah = armW + P * 2;
      if (armCast) { ctx.save(); ctx.translate(ox + (small ? 3 : 5), oy + (small ? 5 : 8)); ctx.rotate(t); ctx.drawImage(armCast, -P - tail, -P - armW / 2, aw, ah); ctx.restore(); }
      if (arm) { ctx.save(); ctx.translate(ox, oy); ctx.rotate(t); ctx.drawImage(arm, -P - tail, -P - armW / 2, aw, ah); ctx.restore(); }
      if (knob) { const ks = (rk + 12) * 2; ctx.drawImage(knob, ox - ks / 2, oy - ks / 2, ks, ks); }
      ctx.save(); ctx.translate(ox, oy); ctx.rotate(t + 0.5); ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(40,24,2,0.9)"; ctx.lineWidth = small ? 1.6 : 2.2; ctx.beginPath(); ctx.moveTo(-rk * 0.5, 0); ctx.lineTo(rk * 0.5, 0); ctx.stroke();
      ctx.strokeStyle = "rgba(255,244,196,0.7)"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-rk * 0.5, 1.4); ctx.lineTo(rk * 0.5, 1.4); ctx.stroke(); ctx.restore();
    };

    let raf = 0, last = 0, seen = true, t0 = 0, touched = -1e9, nextDemo = 2950, tour = 0;
    const show = (v: number) => { const n = clamp(Math.round(v), 0, 180); if (n !== s.shown) { s.shown = n; setValue(n); } };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      if (DEMO && now - touched > 7000 && t > nextDemo && !s.drag) { s.target = TOUR[tour % TOUR.length]; tour++; show(s.target); nextDemo = t + 2500; }
      if (now - touched > 7000) s.glintTo = 0.15 + 0.5 * Math.sin(t / 1900);
      const k = s.drag ? 520 : 120, d = s.drag ? 36 : 13;
      s.v += (k * (s.target - s.a) - d * s.v) * dt; s.a += s.v * dt;
      if (s.a < 0) { s.a = 0; s.v = Math.abs(s.v) * 0.3; } if (s.a > 180) { s.a = 180; s.v = -Math.abs(s.v) * 0.3; }
      s.glint += (s.glintTo - s.glint) * Math.min(1, dt * 4);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const settle = () => { s.a = s.target; s.v = 0; draw(); };
    api.current = { set: (v) => { touched = performance.now(); s.target = clamp(v, 0, 180); show(s.target); if (reduce) settle(); else wake(); } };

    build();
    if (reduce) settle(); else wake();

    const angleAt = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect(), x = e.clientX - b.left - ox, y = oy - (e.clientY - b.top);
      if (y < 0) return x >= 0 ? 0 : 180;
      return clamp((Math.atan2(y, x) * 180) / Math.PI, 0, 180);
    };
    const onDown = (e: PointerEvent) => { s.drag = true; touched = performance.now(); s.target = Math.round(angleAt(e)); show(s.target); pad.setPointerCapture(e.pointerId); e.preventDefault(); if (reduce) settle(); else wake(); };
    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect();
      if (!s.drag) { s.glintTo = clamp((e.clientX - b.left - ox) / R, -1, 1) * 0.6; touched = Math.max(touched, performance.now() - 5200); if (reduce) { s.glint = s.glintTo; draw(); } return; }
      touched = performance.now(); s.target = Math.round(angleAt(e)); show(s.target); if (reduce) settle();
    };
    const onUp = () => { if (s.drag) { s.drag = false; touched = performance.now(); } };
    pad.addEventListener("pointerdown", onDown);
    pad.addEventListener("pointermove", onMove);
    pad.addEventListener("pointerup", onUp);
    pad.addEventListener("pointercancel", onUp);
    let lw = box.clientWidth, lh = box.clientHeight;
    const ro = new ResizeObserver(() => { if (box.clientWidth !== lw || box.clientHeight !== lh) { lw = box.clientWidth; lh = box.clientHeight; build(); draw(); } });
    ro.observe(box);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      pad.removeEventListener("pointerdown", onDown); pad.removeEventListener("pointermove", onMove);
      pad.removeEventListener("pointerup", onUp); pad.removeEventListener("pointercancel", onUp);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div ref={root} className="relative flex h-[620px] w-full flex-col items-center justify-end overflow-hidden bg-[#f4f0e3] pb-8 sm:h-[740px] sm:pb-10">
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full select-none" />
      <div
        ref={hit}
        aria-hidden="true"
        className="absolute cursor-grab touch-none active:cursor-grabbing"
        style={{ left: geo.x - geo.r - 24, top: geo.y - geo.r - 30, width: geo.r * 2 + 48, height: geo.r + geo.bar + 40 }}
      />
      <input
        id="protractor-angle"
        type="range"
        min={0}
        max={180}
        step={1}
        value={value}
        aria-valuetext={`${value} degrees, ${kind(value).toLowerCase()}`}
        onChange={(e) => api.current?.set(Number(e.target.value))}
        className="peer sr-only"
      />
      <span aria-hidden="true" className="pointer-events-none absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full ring-sky-700 ring-offset-2 ring-offset-transparent peer-focus-visible:ring-2" style={{ left: geo.x, top: geo.y }} />
      <div className="relative flex items-end gap-5 px-4">
        <div>
          <label htmlFor="protractor-angle" className="block font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-600">
            {LABEL}
          </label>
          <output htmlFor="protractor-angle" className="block font-serif text-5xl font-semibold tabular-nums tracking-tight text-stone-900 sm:text-6xl">
            {value}&deg;
          </output>
        </div>
        <p aria-live="polite" className="pb-2 font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-stone-600">
          <span className="text-stone-900">{kind(value)}</span>
          <br />
          Drag the brass arm
        </p>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";

/** How many flakes float in the water. 260 reads as a proper flurry; halve it for a calmer globe. */
const FLAKES = 260;
/** Fall speed of a settled flurry in pixels a second. Lower is thicker liquid. */
const SETTLE = 16;
/** The engraved brass plate on the base. */
const PLATE = "FIRST SNOW";
/** Lamp colour in the cabin window, as red, green, blue. */
const LAMP = "255,186,92";

const R = 188; // glass radius in drawing units
const CY = 262; // centre of the glass
const FOOT = 590; // where the base meets the table

// The turned base, top to bottom: [height, half width]. Edit the pairs to cut a different profile.
const PROFILE: [number, number][] = [[404, 124], [426, 131], [432, 119], [447, 143], [462, 126], [478, 151], [538, 166], [548, 176], [560, 169], [573, 183], [FOOT, 185]];

const ground = (x: number) => CY + R * 0.5 - 30 * Math.exp(-(((x + 34) / 92) ** 2)) - 12 * Math.exp(-(((x - 96) / 52) ** 2));

export default function SnowGlobeYouShake() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const api = useRef<{ shake: () => void } | null>(null);
  const [shakes, setShakes] = useState(0);

  useEffect(() => {
    const cv = canvas.current, pad = hit.current;
    if (!cv || !pad) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dpr = 1, scale = 1, ox = 0, oy = 0, box = cv.getBoundingClientRect();
    let baseLayer: HTMLCanvasElement | null = null, sceneLayer: HTMLCanvasElement | null = null;

    let seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    type Flake = { x: number; y: number; vx: number; vy: number; z: number; ph: number; rest: boolean };
    const scatter = (f: Flake) => {
      for (let k = 0; k < 40; k++) {
        const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * (R - 12);
        f.x = Math.cos(a) * d; f.y = CY + Math.sin(a) * d;
        if (f.y < ground(f.x) - 3) break;
      }
      f.vx = 0; f.vy = 0; f.rest = false;
    };
    const flakes: Flake[] = Array.from({ length: FLAKES }, () => {
      const f: Flake = { x: 0, y: 0, vx: 0, vy: 0, z: rand(), ph: rand() * 6.28, rest: false };
      scatter(f);
      return f;
    });

    // The whole object: where it is, how fast it moves, and how stirred up the water is.
    const s = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, drag: false, ux: 0, uy: 0, energy: reduce ? 0 : 210, light: 0, lightTo: 0, shakeAt: -1 };

    const bake = (x0: number, y0: number, w: number, h: number, paint: (c: CanvasRenderingContext2D) => void) => {
      const off = document.createElement("canvas");
      const k = dpr * scale;
      off.width = Math.max(1, Math.ceil(w * k)); off.height = Math.max(1, Math.ceil(h * k));
      const c = off.getContext("2d");
      if (c) { c.setTransform(k, 0, 0, k, -x0 * k, -y0 * k); paint(c); }
      return off;
    };

    const outline = (c: CanvasRenderingContext2D) => {
      const p = PROFILE;
      c.beginPath(); c.moveTo(-p[0][1], p[0][0]);
      for (let i = 1; i < p.length; i++) { const my = (p[i - 1][0] + p[i][0]) / 2; c.bezierCurveTo(-p[i - 1][1], my, -p[i][1], my, -p[i][1], p[i][0]); }
      c.ellipse(0, FOOT, p[p.length - 1][1], 13, 0, Math.PI, 0, true);
      for (let i = p.length - 1; i > 0; i--) { const my = (p[i - 1][0] + p[i][0]) / 2; c.bezierCurveTo(p[i][1], my, p[i - 1][1], my, p[i - 1][1], p[i - 1][0]); }
      c.closePath();
    };

    const paintBase = (c: CanvasRenderingContext2D) => {
      const W = 185;
      c.save(); outline(c); c.clip();
      // A cylinder of oiled walnut: dark at both edges, one broad highlight left of centre.
      const g = c.createLinearGradient(-W, 0, W, 0);
      const wood: [number, string][] = [[0, "#150b06"], [0.07, "#3a2013"], [0.2, "#7a4a2a"], [0.31, "#a8703f"], [0.4, "#8a5630"], [0.6, "#56311b"], [0.82, "#2b170d"], [0.94, "#1a0e08"], [1, "#3a2416"]];
      for (const [p, col] of wood) g.addColorStop(p, col);
      c.fillStyle = g; c.fillRect(-W - 4, 396, W * 2 + 8, 220);
      // Grain follows the turning, so it wraps the base as shallow arcs.
      for (let i = 0; i < 150; i++) {
        const y = 398 + rand() * 204, v = rand();
        c.beginPath(); c.ellipse(rand() * 30 - 15, y - 10, W + 30, 9 + rand() * 6, 0, 0.12 + rand() * 0.5, Math.PI - 0.12 - rand() * 0.5);
        c.lineWidth = 0.5 + rand() * 1.3;
        c.strokeStyle = v > 0.45 ? `rgba(18,8,3,${0.1 + rand() * 0.24})` : `rgba(255,196,140,${0.03 + rand() * 0.07})`;
        c.stroke();
      }
      // Every bead and cove catches light on its upper slope and falls into shade underneath.
      for (let i = 1; i < PROFILE.length; i++) {
        const [y0, w0] = PROFILE[i - 1], [y1, w1] = PROFILE[i];
        const v = c.createLinearGradient(0, y0, 0, y1);
        if (w1 > w0 + 1) { v.addColorStop(0, "rgba(255,214,170,0.02)"); v.addColorStop(0.55, "rgba(255,214,170,0.2)"); v.addColorStop(1, "rgba(255,214,170,0.04)"); }
        else if (w1 < w0 - 1) { v.addColorStop(0, "rgba(0,0,0,0.12)"); v.addColorStop(1, "rgba(0,0,0,0.6)"); }
        else { v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0)"); }
        c.fillStyle = v; c.fillRect(-W - 4, y0, W * 2 + 8, y1 - y0);
        c.beginPath(); c.ellipse(0, y1 - 9, w1 + 1, 9, 0, 0.05, Math.PI - 0.05);
        c.lineWidth = 1; c.strokeStyle = w1 < w0 ? "rgba(0,0,0,0.5)" : "rgba(255,225,190,0.16)"; c.stroke();
      }
      // The long reflection of the lamp down the lacquer.
      const streak = c.createLinearGradient(-112, 0, -52, 0);
      streak.addColorStop(0, "rgba(255,236,214,0)"); streak.addColorStop(0.5, "rgba(255,236,214,0.2)"); streak.addColorStop(1, "rgba(255,236,214,0)");
      c.fillStyle = streak; c.fillRect(-112, 396, 60, 220);
      const thin = c.createLinearGradient(-92, 0, -80, 0);
      thin.addColorStop(0, "rgba(255,244,228,0)"); thin.addColorStop(0.5, "rgba(255,244,228,0.34)"); thin.addColorStop(1, "rgba(255,244,228,0)");
      c.fillStyle = thin; c.fillRect(-92, 478, 12, 62);
      const back = c.createLinearGradient(150, 0, 186, 0);
      back.addColorStop(0, "rgba(120,160,230,0)"); back.addColorStop(1, "rgba(120,160,230,0.22)");
      c.fillStyle = back; c.fillRect(150, 400, 40, 210);
      const foot = c.createLinearGradient(0, 566, 0, 606);
      foot.addColorStop(0, "rgba(0,0,0,0)"); foot.addColorStop(1, "rgba(0,0,0,0.55)");
      c.fillStyle = foot; c.fillRect(-W - 4, 566, W * 2 + 8, 40);
      c.restore();

      // Brass plate, pinned with two round-head nails.
      const px = -66, py = 494, pw = 132, ph = 30;
      c.save();
      c.shadowColor = "rgba(0,0,0,0.6)"; c.shadowBlur = 5; c.shadowOffsetY = 2 * dpr * scale;
      const brass = c.createLinearGradient(px, py, px + pw, py + ph);
      brass.addColorStop(0, "#f3dc9a"); brass.addColorStop(0.3, "#c79a3e"); brass.addColorStop(0.55, "#e8cb7c"); brass.addColorStop(1, "#7d5a1a");
      c.beginPath(); c.roundRect(px, py, pw, ph, 4); c.fillStyle = brass; c.fill();
      c.restore();
      c.lineWidth = 0.8; c.strokeStyle = "rgba(255,244,200,0.7)"; c.beginPath(); c.roundRect(px + 0.6, py + 0.6, pw - 1.2, ph - 1.2, 3.5); c.stroke();
      c.strokeStyle = "rgba(60,38,6,0.5)"; c.beginPath(); c.roundRect(px + 4, py + 4, pw - 8, ph - 8, 2); c.stroke();
      c.font = "600 10.5px Georgia, 'Times New Roman', serif"; c.textAlign = "center"; c.textBaseline = "middle";
      const spaced = PLATE.split("").join("\u200A\u200A");
      c.fillStyle = "rgba(255,246,210,0.7)"; c.fillText(spaced, 0, py + ph / 2 + 1.4);
      c.fillStyle = "#4a3208"; c.fillText(spaced, 0, py + ph / 2 + 0.6);
      for (const nx of [px + 9, px + pw - 9]) {
        c.beginPath(); c.arc(nx, py + ph / 2, 2.2, 0, Math.PI * 2); c.fillStyle = "#8a6520"; c.fill();
        c.beginPath(); c.arc(nx - 0.6, py + ph / 2 - 0.7, 0.9, 0, Math.PI * 2); c.fillStyle = "rgba(255,250,220,0.9)"; c.fill();
      }
    };

    // The brass collar the glass is bedded in. `front` is the half that overlaps the sphere.
    const collar = (c: CanvasRenderingContext2D, front: boolean) => {
      const y = 404, w = 124, h = 15;
      const g = c.createLinearGradient(-w, 0, w, 0);
      const stops: [number, string][] = [[0, "#3d2a0a"], [0.1, "#8f6b22"], [0.26, "#f1d68c"], [0.33, "#fff6cf"], [0.42, "#c9a045"], [0.66, "#7a5918"], [0.9, "#4a340d"], [1, "#b08a38"]];
      for (const [p, col] of stops) g.addColorStop(p, col);
      c.beginPath();
      if (front) { c.ellipse(0, y, w, 17, 0, 0, Math.PI); c.lineTo(-w - 2, y + h); c.ellipse(0, y + h, w + 2, 18, 0, Math.PI, 0, true); c.closePath(); }
      else c.ellipse(0, y, w, 17, 0, 0, Math.PI * 2);
      c.fillStyle = front ? g : "#2a1c07"; c.fill();
      if (front) {
        c.beginPath(); c.ellipse(0, y, w, 17, 0, 0.04, Math.PI - 0.04); c.lineWidth = 1.4; c.strokeStyle = "rgba(255,248,214,0.75)"; c.stroke();
        c.beginPath(); c.ellipse(0, y + h, w + 2, 18, 0, 0.04, Math.PI - 0.04); c.lineWidth = 1.2; c.strokeStyle = "rgba(30,18,2,0.7)"; c.stroke();
      }
    };

    const pine = (c: CanvasRenderingContext2D, x: number, by: number, h: number, dim: number) => {
      c.fillStyle = "#2a1a10"; c.fillRect(x - h * 0.035, by - h * 0.12, h * 0.07, h * 0.14);
      const tiers = 5;
      for (let i = 0; i < tiers; i++) {
        const k = i / tiers, top = by - h + k * h * 0.74, bot = by - h * 0.08 - (tiers - 1 - i) * h * 0.13, half = h * (0.11 + k * 0.26);
        const g = c.createLinearGradient(x - half, 0, x + half, 0);
        g.addColorStop(0, `rgba(${62 * dim | 0},${122 * dim | 0},${92 * dim | 0},1)`); g.addColorStop(0.45, `rgba(${28 * dim | 0},${78 * dim | 0},${60 * dim | 0},1)`); g.addColorStop(1, `rgba(${8 * dim | 0},${34 * dim | 0},${30 * dim | 0},1)`);
        c.beginPath(); c.moveTo(x, top);
        c.quadraticCurveTo(x + half * 0.5, top + (bot - top) * 0.7, x + half, bot);
        c.quadraticCurveTo(x + half * 0.5, bot + h * 0.035, x, bot - h * 0.012);
        c.quadraticCurveTo(x - half * 0.5, bot + h * 0.035, x - half, bot);
        c.quadraticCurveTo(x - half * 0.5, top + (bot - top) * 0.7, x, top); c.closePath();
        c.fillStyle = g; c.fill();
        // Snow lying on the lit side of each bough.
        c.beginPath(); c.moveTo(x, top - 1);
        c.quadraticCurveTo(x - half * 0.5, top + (bot - top) * 0.66, x - half * 0.96, bot - 1);
        c.quadraticCurveTo(x - half * 0.5, bot - h * 0.02, x - half * 0.18, top + (bot - top) * 0.62);
        c.quadraticCurveTo(x + half * 0.08, top + (bot - top) * 0.5, x + half * 0.3, top + (bot - top) * 0.56);
        c.quadraticCurveTo(x + half * 0.16, top + (bot - top) * 0.28, x, top - 1); c.closePath();
        c.fillStyle = `rgb(${250 * (0.55 + dim * 0.45) | 0},${252 * (0.6 + dim * 0.4) | 0},${255 * (0.72 + dim * 0.28) | 0})`; c.fill();
      }
    };

    const paintScene = (c: CanvasRenderingContext2D) => {
      c.save(); c.beginPath(); c.arc(0, CY, R - 1, 0, Math.PI * 2); c.clip();
      pine(c, -134, ground(-134) + 4, 78, 0.62); pine(c, 58, ground(58) + 2, 96, 0.62); pine(c, 146, ground(146) + 3, 60, 0.6); pine(c, -96, ground(-96) + 3, 58, 0.55);
      // The drift.
      c.beginPath(); c.moveTo(-R, CY + R);
      for (let x = -R; x <= R; x += 6) c.lineTo(x, ground(x));
      c.lineTo(R, CY + R); c.closePath();
      const snow = c.createLinearGradient(0, CY + R * 0.3, 0, CY + R * 0.86);
      snow.addColorStop(0, "#fbfdff"); snow.addColorStop(0.3, "#dce8f7"); snow.addColorStop(0.7, "#9db6d8"); snow.addColorStop(1, "#5e7ba6");
      c.fillStyle = snow; c.fill();
      const side = c.createLinearGradient(-R, 0, R, 0);
      side.addColorStop(0, "rgba(255,255,255,0.25)"); side.addColorStop(0.4, "rgba(255,255,255,0)"); side.addColorStop(1, "rgba(20,40,90,0.42)");
      c.fillStyle = side; c.fill();

      // The cabin: a gable end facing us and one wall running back to the right.
      const bx = -74, by = ground(-40) + 5, fw = 58, fh = 34, sw = 46, rise = 8, peak = 30;
      c.save(); c.translate(-40, by); c.scale(1.34, 1.34); c.translate(40, -by);
      c.beginPath(); c.ellipse(bx + 60, by + 3, 76, 8, 0, 0, Math.PI * 2); c.fillStyle = "rgba(40,62,110,0.35)"; c.fill();
      const wallF = c.createLinearGradient(bx, 0, bx + fw, 0); wallF.addColorStop(0, "#8a5a36"); wallF.addColorStop(1, "#5f3a22");
      c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by - fh); c.lineTo(bx + fw / 2, by - fh - peak); c.lineTo(bx + fw, by - fh); c.lineTo(bx + fw, by); c.closePath(); c.fillStyle = wallF; c.fill();
      c.beginPath(); c.moveTo(bx + fw, by); c.lineTo(bx + fw, by - fh); c.lineTo(bx + fw + sw, by - fh - rise); c.lineTo(bx + fw + sw, by - rise); c.closePath(); c.fillStyle = "#3d2414"; c.fill();
      c.lineWidth = 0.7; c.strokeStyle = "rgba(20,10,4,0.55)";
      for (let i = 1; i < 6; i++) {
        const y = by - (fh / 6) * i;
        c.beginPath(); c.moveTo(bx, y); c.lineTo(bx + fw, y); c.lineTo(bx + fw + sw, y - rise); c.stroke();
      }
      // Door and lit window.
      c.fillStyle = "#2c1a0f"; c.fillRect(bx + 9, by - 22, 13, 22);
      c.fillStyle = "rgba(255,225,170,0.9)"; c.fillRect(bx + 18.4, by - 12, 1.6, 1.6);
      const wx = bx + 31, wy = by - 25, ws = 15;
      c.fillStyle = `rgb(${LAMP})`; c.fillRect(wx, wy, ws, ws);
      const pane = c.createRadialGradient(wx + ws / 2, wy + ws / 2, 1, wx + ws / 2, wy + ws / 2, ws * 0.8);
      pane.addColorStop(0, "rgba(255,250,225,0.95)"); pane.addColorStop(1, "rgba(255,250,225,0)");
      c.fillStyle = pane; c.fillRect(wx, wy, ws, ws);
      c.strokeStyle = "#2c1a0f"; c.lineWidth = 1.5; c.strokeRect(wx, wy, ws, ws);
      c.beginPath(); c.moveTo(wx + ws / 2, wy); c.lineTo(wx + ws / 2, wy + ws); c.moveTo(wx, wy + ws / 2); c.lineTo(wx + ws, wy + ws / 2); c.lineWidth = 1.1; c.stroke();
      c.fillStyle = `rgba(${LAMP},0.85)`; c.fillRect(bx + fw + 16, by - 25, 9, 12);
      c.strokeRect(bx + fw + 16, by - 25, 9, 12);
      // Chimney, then the roof under a thick slab of snow.
      c.fillStyle = "#4a2c1a"; c.fillRect(bx + fw + 20, by - fh - peak - 6, 10, 20);
      c.fillStyle = "#f6faff"; c.beginPath(); c.roundRect(bx + fw + 18, by - fh - peak - 10, 14, 6, 3); c.fill();
      const ex = 7;
      c.beginPath(); c.moveTo(bx + fw / 2, by - fh - peak - 2); c.lineTo(bx + fw / 2 + sw, by - fh - peak - rise - 2); c.lineTo(bx + fw + sw + ex, by - fh - rise + 5); c.lineTo(bx + fw + ex, by - fh + 6); c.closePath();
      const roofS = c.createLinearGradient(0, by - fh - peak, 0, by - fh + 6); roofS.addColorStop(0, "#d3e2f5"); roofS.addColorStop(1, "#8faed6");
      c.fillStyle = roofS; c.fill();
      c.beginPath(); c.moveTo(bx - ex, by - fh + 6); c.lineTo(bx + fw / 2, by - fh - peak - 3);
      c.lineTo(bx + fw + ex, by - fh + 6); c.quadraticCurveTo(bx + fw + ex - 2, by - fh + 11, bx + fw + ex - 7, by - fh + 9);
      c.lineTo(bx + fw / 2, by - fh - peak + 9); c.lineTo(bx - ex + 7, by - fh + 9); c.quadraticCurveTo(bx - ex + 1, by - fh + 11, bx - ex, by - fh + 6); c.closePath();
      c.fillStyle = "#ffffff"; c.fill();
      c.lineWidth = 1; c.strokeStyle = "rgba(120,150,200,0.55)"; c.stroke();
      // Lamplight spilling onto the drift.
      c.globalCompositeOperation = "lighter";
      const pool = c.createRadialGradient(wx + ws / 2, by + 6, 2, wx + ws / 2, by + 6, 64);
      pool.addColorStop(0, `rgba(${LAMP},0.5)`); pool.addColorStop(1, `rgba(${LAMP},0)`);
      c.save(); c.translate(0, by + 6); c.scale(1, 0.34); c.translate(0, -(by + 6)); c.fillStyle = pool; c.fillRect(wx - 70, by - 60, 150, 132); c.restore();
      const halo = c.createRadialGradient(wx + ws / 2, wy + ws / 2, 2, wx + ws / 2, wy + ws / 2, 40);
      halo.addColorStop(0, `rgba(${LAMP},0.42)`); halo.addColorStop(1, `rgba(${LAMP},0)`);
      c.fillStyle = halo; c.fillRect(wx - 40, wy - 40, 100, 100);
      c.globalCompositeOperation = "source-over";
      c.restore();
      pine(c, 104, ground(104) + 12, 132, 1); pine(c, -140, ground(-140) + 16, 56, 0.95);
      c.restore();
    };

    const drawFlakes = (front: boolean) => {
      ctx.fillStyle = "#ffffff";
      for (const f of flakes) {
        if (f.rest || f.z > 0.55 !== front) continue;
        ctx.globalAlpha = 0.42 + f.z * 0.58;
        ctx.beginPath(); ctx.arc(f.x, f.y, 0.7 + f.z * f.z * 2.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      const k = dpr * scale;
      ctx.setTransform(k, 0, 0, k, ox * dpr, oy * dpr);

      // Shadow and a breath of blue light on the table.
      const sh = ctx.createRadialGradient(s.x * 0.5, FOOT + 6, 20, s.x * 0.5, FOOT + 6, 290);
      sh.addColorStop(0, "rgba(0,0,0,0.78)"); sh.addColorStop(0.5, "rgba(0,0,0,0.34)"); sh.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save(); ctx.translate(0, FOOT + 6); ctx.scale(1, 0.13); ctx.translate(0, -(FOOT + 6)); ctx.fillStyle = sh; ctx.fillRect(-320, FOOT - 300, 640, 620); ctx.restore();
      const spill = ctx.createRadialGradient(70 + s.x * 0.5, FOOT + 14, 4, 70 + s.x * 0.5, FOOT + 14, 190);
      spill.addColorStop(0, "rgba(150,190,255,0.2)"); spill.addColorStop(1, "rgba(150,190,255,0)");
      ctx.save(); ctx.translate(0, FOOT + 14); ctx.scale(1, 0.12); ctx.translate(0, -(FOOT + 14)); ctx.fillStyle = spill; ctx.fillRect(-140, FOOT - 190, 420, 410); ctx.restore();

      // Everything else leans and travels with the hand.
      const tilt = Math.max(-0.16, Math.min(0.16, s.x * 0.0016 + s.vx * 0.00006));
      ctx.translate(s.x, s.y); ctx.translate(0, FOOT); ctx.rotate(tilt); ctx.translate(0, -FOOT);

      collar(ctx, false);
      if (baseLayer) ctx.drawImage(baseLayer, -200, 390, 400, 226);

      // Water: almost clear in the middle, thicker and bluer where you look through more glass.
      const body = ctx.createRadialGradient(-20, CY - 30, R * 0.1, 0, CY, R);
      body.addColorStop(0, "rgba(120,160,230,0.07)"); body.addColorStop(0.62, "rgba(96,138,214,0.1)"); body.addColorStop(0.9, "rgba(140,184,255,0.2)"); body.addColorStop(1, "rgba(200,226,255,0.4)");
      // Nothing of the sphere shows below the lip of the collar.
      ctx.save(); ctx.beginPath(); ctx.rect(-R - 4, CY - R - 4, R * 2 + 8, 404 - (CY - R - 4)); ctx.ellipse(0, 404, 124, 17, 0, 0, Math.PI); ctx.clip();
      ctx.beginPath(); ctx.arc(0, CY, R, 0, Math.PI * 2); ctx.fillStyle = "rgba(9,15,30,0.55)"; ctx.fill(); ctx.fillStyle = body; ctx.fill();

      ctx.save(); ctx.beginPath(); ctx.arc(0, CY, R - 1.5, 0, Math.PI * 2); ctx.clip();
      drawFlakes(false);
      if (sceneLayer) ctx.drawImage(sceneLayer, -R, CY - R, R * 2, R * 2);
      drawFlakes(true);
      // The wall of the glass: a dark band just inside the rim, then the rim itself.
      const wall = ctx.createRadialGradient(0, CY, R * 0.8, 0, CY, R);
      wall.addColorStop(0, "rgba(4,10,26,0)"); wall.addColorStop(0.8, "rgba(4,10,26,0.34)"); wall.addColorStop(0.95, "rgba(4,10,26,0.16)"); wall.addColorStop(1, "rgba(210,230,255,0.5)");
      ctx.fillStyle = wall; ctx.fillRect(-R, CY - R, R * 2, R * 2);
      // Where the sphere sinks into the collar.
      const seat = ctx.createLinearGradient(0, CY + R * 0.62, 0, CY + R * 0.82);
      seat.addColorStop(0, "rgba(6,10,22,0)"); seat.addColorStop(1, "rgba(6,10,22,0.55)");
      ctx.fillStyle = seat; ctx.fillRect(-R, CY + R * 0.6, R * 2, R * 0.4);

      // Reflections stay with the lamp, not with the globe, so they are drawn un-tilted.
      const la = -2.3 + s.light - tilt;
      ctx.save(); ctx.translate(0, CY); ctx.rotate(la + Math.PI / 2);
      const box1 = ctx.createLinearGradient(0, -R * 0.93, 0, -R * 0.56);
      box1.addColorStop(0, "rgba(255,255,255,0.7)"); box1.addColorStop(0.5, "rgba(255,255,255,0.2)"); box1.addColorStop(1, "rgba(255,255,255,0)");
      // A four-pane window, bent round the glass: two bands, each split by the glazing bar.
      for (const [r0, r1] of [[0.925, 0.77], [0.745, 0.56]]) for (const [a0, a1] of [[-0.44, -0.07], [-0.03, 0.3]]) {
        const pinch = (0.925 - r1) * 0.22;
        ctx.beginPath(); ctx.arc(0, 0, R * r0, -Math.PI / 2 + a0, -Math.PI / 2 + a1); ctx.arc(0, 0, R * r1, -Math.PI / 2 + a1 - pinch * Math.sign(a1), -Math.PI / 2 + a0 + pinch, true); ctx.closePath();
        ctx.fillStyle = box1; ctx.fill();
      }
      ctx.rotate(Math.PI - 0.25);
      const box2 = ctx.createLinearGradient(0, -R * 0.96, 0, -R * 0.8);
      box2.addColorStop(0, "rgba(190,214,255,0.5)"); box2.addColorStop(1, "rgba(190,214,255,0)");
      ctx.beginPath(); ctx.arc(0, 0, R * 0.965, -Math.PI / 2 - 0.62, -Math.PI / 2 + 0.62); ctx.arc(0, 0, R * 0.82, -Math.PI / 2 + 0.5, -Math.PI / 2 - 0.5, true); ctx.closePath();
      ctx.fillStyle = box2; ctx.fill();
      ctx.restore();
      ctx.restore();

      const rim = ctx.createLinearGradient(-R, CY - R, R, CY + R);
      rim.addColorStop(0, "rgba(255,255,255,0.95)"); rim.addColorStop(0.4, "rgba(220,235,255,0.35)"); rim.addColorStop(0.75, "rgba(160,190,240,0.2)"); rim.addColorStop(1, "rgba(220,235,255,0.6)");
      ctx.beginPath(); ctx.arc(0, CY, R - 0.6, 0, Math.PI * 2); ctx.lineWidth = 1.6; ctx.strokeStyle = rim; ctx.stroke();
      // One hard glint from the lamp itself.
      const hx = Math.cos(la - 0.5) * R * 0.8, hy = CY + Math.sin(la - 0.5) * R * 0.8;
      const hot = ctx.createRadialGradient(hx, hy, 0, hx, hy, 13);
      hot.addColorStop(0, "rgba(255,255,255,1)"); hot.addColorStop(0.25, "rgba(255,255,255,0.75)"); hot.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hot; ctx.fillRect(hx - 14, hy - 14, 28, 28);
      ctx.restore();
      collar(ctx, true);
    };

    const fit = () => {
      box = cv.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(box.width * dpr); cv.height = Math.round(box.height * dpr);
      const bottom = box.width < 640 ? 96 : 70; // room for the caption row
      scale = Math.min(box.width / 500, (box.height - bottom) / 640);
      ox = box.width / 2; oy = Math.max(0, (box.height - bottom - 640 * scale) / 2 + 12 * scale);
      const w = 300 * scale, h = 560 * scale;
      pad.style.left = `${ox - w / 2}px`; pad.style.top = `${oy + 60 * scale}px`; pad.style.width = `${w}px`; pad.style.height = `${h}px`;
      seed = 5;
      baseLayer = bake(-200, 390, 400, 226, paintBase);
      sceneLayer = bake(-R, CY - R, R * 2, R * 2, paintScene);
    };

    let raf = 0, last = 0, t = 0, seen = true, touched = -1e9, nextDemo = 5.2;
    const step = (dt: number) => {
      t += dt;
      // A programmed shake is a short decaying wobble of the target the globe springs toward.
      if (s.shakeAt >= 0) {
        const q = (t - s.shakeAt) / 0.75;
        if (q >= 1) { s.shakeAt = -1; s.tx = 0; s.ty = 0; } else { s.tx = 62 * Math.sin(q * 21) * (1 - q); s.ty = 14 * Math.sin(q * 15 + 1) * (1 - q); }
      }
      const kq = s.drag || s.shakeAt >= 0 ? 520 : 170, cq = s.drag || s.shakeAt >= 0 ? 30 : 9;
      const pvx = s.vx, pvy = s.vy;
      s.vx += (kq * (s.tx - s.x) - cq * s.vx) * dt; s.vy += (kq * (s.ty - s.y) - cq * s.vy) * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      // The water lags the glass: every change of speed stirs it and shoves it the other way.
      const dvx = s.vx - pvx, dvy = s.vy - pvy;
      s.energy = Math.min(330, s.energy + Math.hypot(dvx, dvy) * 0.5);
      s.ux -= dvx * 0.55; s.uy -= dvy * 0.55;
      const fade = Math.exp(-dt * 3.2); s.ux *= fade; s.uy *= fade;
      s.energy *= Math.exp(-dt * 0.42);
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 5);
      const E = s.energy, lim = R - 8, follow = Math.min(1, dt * 5);
      for (const f of flakes) {
        if (f.rest) {
          if (E > 55 && Math.random() < dt * (E / 60)) { f.rest = false; f.vx = (Math.random() - 0.5) * E; f.vy = -E * (0.3 + Math.random() * 0.7); }
          continue;
        }
        // Two layers of eddies taken from a stream function, so the flow never bunches the flakes together.
        const a1 = f.x * 0.019 + t * 0.9, b1 = f.y * 0.017 - t * 0.7, a2 = f.x * 0.043 - t * 1.4 + 2, b2 = f.y * 0.039 + t * 1.1;
        const gx = Math.sin(a1) * Math.cos(b1) + 0.5 * Math.sin(a2) * Math.cos(b2) + 0.35 * Math.sin(t * 2.3 + f.ph * 3);
        const gy = -Math.cos(a1) * Math.sin(b1) * 1.1 - 0.55 * Math.cos(a2) * Math.sin(b2) + 0.35 * Math.cos(t * 1.9 + f.ph * 5);
        const wantX = s.ux + E * gx + Math.sin(t * 0.8 + f.ph) * 5;
        const wantY = s.uy + E * (gy - 0.05) + SETTLE * (0.55 + f.z);
        // Water turns back at the glass, so flakes near the wall are carried inward again.
        const edge = Math.hypot(f.x, f.y - CY) / lim;
        const turn = edge > 0.8 ? ((edge - 0.8) / 0.2) * E * 0.9 : 0;
        f.vx += (wantX - (f.x / (edge * lim || 1)) * turn - f.vx) * follow; f.vy += (wantY - ((f.y - CY) / (edge * lim || 1)) * turn - f.vy) * follow;
        f.x += f.vx * dt; f.y += f.vy * dt;
        const dx = f.x, dy = f.y - CY, d = Math.hypot(dx, dy);
        if (d > lim) { const nx = dx / d, ny = dy / d, vn = f.vx * nx + f.vy * ny; f.x = nx * lim; f.y = CY + ny * lim; if (vn > 0) { f.vx -= vn * nx * 1.3; f.vy -= vn * ny * 1.3; } }
        const g = ground(f.x) - 1.5;
        if (f.y > g) { f.y = g; if (E < 42) f.rest = true; else { f.vy = -E * (0.25 + Math.random() * 0.6); f.vx += (Math.random() - 0.5) * E; } }
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      let dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!s.drag && s.shakeAt < 0 && t > nextDemo && now - touched > 6000) { s.shakeAt = t; nextDemo = t + 8.5; }
      while (dt > 0) { const h = Math.min(dt, 1 / 120); step(h); dt -= h; }
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(frame); } };

    api.current = {
      shake: () => {
        touched = performance.now();
        if (reduce) { for (const f of flakes) scatter(f); draw(); return; }
        s.shakeAt = t; wake();
      },
    };

    const local = (e: PointerEvent) => ({ x: (e.clientX - box.left - ox) / scale, y: (e.clientY - box.top - oy) / scale });
    let grab = { x: 0, y: 0 };
    const onDown = (e: PointerEvent) => {
      if (reduce) return;
      box = cv.getBoundingClientRect();
      const p = local(e); grab = { x: p.x - s.x, y: p.y - s.y };
      s.drag = true; s.shakeAt = -1; touched = performance.now();
      pad.setPointerCapture(e.pointerId); e.preventDefault(); wake();
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      s.lightTo = Math.max(-0.35, Math.min(0.35, p.x * 0.0011));
      if (!s.drag) { if (reduce) { s.light = s.lightTo; draw(); } return; }
      touched = performance.now();
      let tx = p.x - grab.x, ty = p.y - grab.y;
      const far = Math.hypot(tx, ty * 1.6);
      if (far > 96) { tx *= 96 / far; ty *= 96 / far; }
      s.tx = tx; s.ty = ty;
    };
    const onUp = () => { if (!s.drag) return; s.drag = false; s.tx = 0; s.ty = 0; touched = performance.now(); };
    pad.addEventListener("pointerdown", onDown);
    pad.addEventListener("pointermove", onMove);
    pad.addEventListener("pointerup", onUp);
    pad.addEventListener("pointercancel", onUp);

    fit();
    if (reduce) draw(); else wake();
    const ro = new ResizeObserver(() => { fit(); if (reduce || !raf) draw(); });
    ro.observe(cv);
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
    <div className="relative flex h-[600px] w-full flex-col overflow-hidden bg-[#0a101d] bg-[radial-gradient(110%_78%_at_50%_34%,#1d2c49_0%,#111a2d_46%,#0a101d_78%)] sm:h-[720px]">
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <div ref={hit} aria-hidden="true" className="absolute cursor-grab touch-none rounded-[40%] active:cursor-grabbing" />
      <div className="pointer-events-none relative mx-auto mt-auto flex w-full max-w-[880px] flex-col items-center gap-3 px-5 pb-6 text-[13px] sm:flex-row sm:justify-between sm:pb-8">
        <p className="text-center text-slate-300 sm:text-left">
          <span className="font-semibold text-white">Snow globe</span>
          <span className="mx-2 text-slate-500">/</span>
          pick it up and shake it
        </p>
        <button
          type="button"
          onClick={() => { api.current?.shake(); setShakes((n) => n + 1); }}
          className="pointer-events-auto min-h-[40px] shrink-0 rounded-full bg-white px-5 font-medium text-[#0a101d] shadow-[0_12px_24px_-12px_rgba(140,180,255,0.7)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a101d] motion-reduce:transition-none"
        >
          Shake it
        </button>
        <span aria-live="polite" className="sr-only">{shakes > 0 ? `Shaken ${shakes} ${shakes === 1 ? "time" : "times"}. The snow is falling.` : ""}</span>
      </div>
    </div>
  );
}

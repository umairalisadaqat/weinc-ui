import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// Everything a visitor is likely to change sits here.
const SLATE = { production: "First Light", roll: "A12", scene: "24C", take: 3, director: "M. Okafor", camera: "J. Lindqvist", date: "14 Mar" };
const COUNT_FROM = 6; // seconds on the timecode window when the sticks meet
const FPS = 24; // frames a second shown in the last pair of digits
const OPEN = 20; // how far the top stick is held open, in degrees
const FIRST_CLAP_MS = 3900; // the demo waits this long so the open slate can be seen first
const TILT = -3.5; // the whole slate lies a little crooked on the table, in degrees
const LED = "#ff3b21";
const CHALK_FONT = 'Chalkduster, "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive';
const LABEL_FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

// Design pixels. The lower stick's top-left corner is the origin.
const BW = 540, BH = 330, ST = 46, PIV = 26, SWEEP = 176, OY = (BH - SWEEP) / 2 + ST / 2;
const ROW = [ST, ST + 84, ST + 176, ST + 246, ST + BH];
const DIGITS: Record<string, string> = { "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcdfg" };

const rng = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
type Ctx = CanvasRenderingContext2D;
const rr = (c: Ctx, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
};

/** One stick: painted wood with diagonal bars, a gloss along the top edge and a few chips. */
function paintStick(c: Ctx, y: number, lean: 1 | -1, seed: number) {
  const r = rng(seed);
  c.save();
  rr(c, 0, y, BW, ST, 4); c.clip();
  c.fillStyle = "#efe9dc"; c.fillRect(0, y, BW, ST);
  c.fillStyle = "#161514";
  const SW = 51;
  for (let i = -2; i * SW * 2 < BW + ST; i++) {
    const x0 = i * SW * 2 + 18;
    c.beginPath();
    if (lean > 0) { c.moveTo(x0, y + ST); c.lineTo(x0 + SW, y + ST); c.lineTo(x0 + SW + ST, y); c.lineTo(x0 + ST, y); }
    else { c.moveTo(x0, y); c.lineTo(x0 + SW, y); c.lineTo(x0 + SW + ST, y + ST); c.lineTo(x0 + ST, y + ST); }
    c.closePath(); c.fill();
  }
  // brush marks in the paint
  for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "0,0,0"},${0.02 + r() * 0.04})`; c.fillRect(r() * BW, y + r() * ST, 30 + r() * 120, 0.7); }
  // chips where the edges have knocked together
  c.fillStyle = "#b98f5a";
  for (let i = 0; i < 16; i++) { const x = r() * BW, e = r() > 0.5 ? y : y + ST, w = 2 + r() * 7, d = (1 + r() * 2.4) * (e === y ? 1 : -1); c.beginPath(); c.moveTo(x, e); c.lineTo(x + w, e); c.lineTo(x + w * 0.4, e + d); c.closePath(); c.fill(); }
  const g = c.createLinearGradient(0, y, 0, y + ST);
  g.addColorStop(0, "rgba(255,255,255,0.34)"); g.addColorStop(0.16, "rgba(255,255,255,0.08)"); g.addColorStop(0.6, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.3)");
  c.fillStyle = g; c.fillRect(0, y, BW, ST);
  c.restore();
  c.strokeStyle = "rgba(255,255,255,0.5)"; c.lineWidth = 1; c.beginPath(); c.moveTo(4, y + 0.8); c.lineTo(BW - 4, y + 0.8); c.stroke();
  c.strokeStyle = "rgba(0,0,0,0.55)"; c.beginPath(); c.moveTo(4, y + ST - 0.5); c.lineTo(BW - 4, y + ST - 0.5); c.stroke();
}

/** A steel hinge leaf with two slotted screws. */
function paintLeaf(c: Ctx, y: number, seed: number) {
  const r = rng(seed);
  const g = c.createLinearGradient(0, y, 0, y + ST - 10);
  g.addColorStop(0, "#f1f2f4"); g.addColorStop(0.3, "#a9acb2"); g.addColorStop(0.55, "#d6d8dc"); g.addColorStop(1, "#6d7077");
  c.save(); c.shadowColor = "rgba(0,0,0,0.6)"; c.shadowBlur = 3; c.shadowOffsetY = 1.5;
  rr(c, 5, y + 5, 62, ST - 10, 3); c.fillStyle = g; c.fill(); c.restore();
  c.save(); rr(c, 5, y + 5, 62, ST - 10, 3); c.clip();
  for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "0,0,0"},${0.04 + r() * 0.07})`; c.fillRect(5, y + 5 + r() * (ST - 10), 62, 0.6); }
  c.restore();
  for (const sx of [46, 59]) {
    const sy = y + ST / 2 + (sx === 46 ? -7 : 7);
    const sg = c.createRadialGradient(sx - 1.2, sy - 1.2, 0.4, sx, sy, 4.4);
    sg.addColorStop(0, "#fafafa"); sg.addColorStop(0.6, "#8f9299"); sg.addColorStop(1, "#3c3e43");
    c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, 4.2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(20,20,22,0.85)"; c.lineWidth = 1.1; const a = r() * Math.PI; c.beginPath(); c.moveTo(sx - Math.cos(a) * 3.2, sy - Math.sin(a) * 3.2); c.lineTo(sx + Math.cos(a) * 3.2, sy + Math.sin(a) * 3.2); c.stroke();
  }
}

/** Handwriting in chalk: two passes of the letters on a scratch layer, then grit knocked back out of them. */
function chalk(c: Ctx, text: string, x: number, y: number, size: number, seed: number, k: number, align: CanvasTextAlign = "left") {
  const r = rng(seed);
  const font = `${size}px ${CHALK_FONT}`;
  c.font = font;
  const w = c.measureText(text).width, tw = w + 24, th = size * 1.7;
  const tmp = document.createElement("canvas");
  tmp.width = Math.ceil(tw * k); tmp.height = Math.ceil(th * k);
  const t = tmp.getContext("2d");
  if (!t) return;
  t.setTransform(k, 0, 0, k, 12 * k, size * 1.2 * k);
  t.font = font; t.textBaseline = "alphabetic";
  t.fillStyle = "rgba(246,242,232,0.92)"; t.fillText(text, 0, 0);
  t.fillStyle = "rgba(246,242,232,0.3)"; t.fillText(text, 0.7, 0.5);
  t.globalCompositeOperation = "destination-out";
  for (let i = 0; i < (w * size) / 8; i++) { t.globalAlpha = 0.25 + r() * 0.5; t.beginPath(); t.arc(r() * w, -r() * size * 0.95 + size * 0.12, 0.3 + r() * 0.8, 0, Math.PI * 2); t.fill(); }
  t.lineWidth = 0.6; t.strokeStyle = "#000";
  for (let i = 0; i < w / 5; i++) { t.globalAlpha = 0.25; const sx = r() * w, sy = -r() * size * 0.8; t.beginPath(); t.moveTo(sx, sy); t.lineTo(sx + 5 + r() * 8, sy - 2 - r() * 3); t.stroke(); }
  c.save();
  c.translate(x, y); c.rotate((r() - 0.5) * 0.05);
  c.drawImage(tmp, (align === "center" ? -w / 2 : 0) - 12, -size * 1.2, tw, th);
  c.restore();
}

function spaced(c: Ctx, text: string, x: number, y: number, gap: number) {
  for (const ch of text) { c.fillText(ch, x, y); x += c.measureText(ch).width + gap; }
}

export default function ClapperboardCountdown() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const api = useRef({ press: () => {}, hover: false });
  const [take, setTake] = useState(SLATE.take);
  const [status, setStatus] = useState("Sticks open.");

  useEffect(() => {
    const wrap = wrapRef.current, cv = cvRef.current, btn = btnRef.current;
    if (!wrap || !cv || !btn) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let W = 0, H = 0, s = 1, k = 1, cx = 0, cy = 0, raf = 0, visible = true, last = performance.now();
    const bg = document.createElement("canvas"), slate = document.createElement("canvas"), stick = document.createElement("canvas"), takeCv = document.createElement("canvas");
    const PAD = 70; // room round the slate layer for its shadow
    const st = { phase: "open" as "open" | "drop" | "run" | "done", theta: OPEN, omega: 0, hit: false, tClap: 0, tDone: 0, nextClap: last + FIRST_CLAP_MS, take: SLATE.take, bumped: false, alpha: 1, reveal: 1, parts: [] as { x: number; y: number; vx: number; vy: number; life: number; age: number; r: number }[] };
    const rnd = rng(77);

    const layer = (cvs: HTMLCanvasElement, w: number, h: number) => {
      cvs.width = Math.ceil(w * k); cvs.height = Math.ceil(h * k);
      const c = cvs.getContext("2d")!; c.setTransform(k, 0, 0, k, 0, 0); c.clearRect(0, 0, w, h);
      return c;
    };

    const paintTake = () => {
      const c = layer(takeCv, 180, 92);
      chalk(c, String(st.take), 96, 74, 50, 900 + st.take, k, "center");
    };

    const build = () => {
      // The table: a sheet of saffron paper under one soft lamp.
      const b = bg.getContext("2d")!;
      bg.width = cv.width; bg.height = cv.height;
      const d = k / s;
      b.setTransform(d, 0, 0, d, 0, 0);
      const g = b.createRadialGradient(W * 0.4, H * 0.3, 20, W * 0.5, H * 0.5, Math.max(W, H) * 0.78);
      g.addColorStop(0, "#f0c35c"); g.addColorStop(0.5, "#deaa3c"); g.addColorStop(1, "#b98322");
      b.fillStyle = g; b.fillRect(0, 0, W, H);
      const r = rng(5);
      for (let i = 0; i < (W * H) / 70; i++) { b.fillStyle = `rgba(${r() > 0.5 ? "255,240,200" : "70,40,0"},${0.03 + r() * 0.05})`; b.fillRect(r() * W, r() * H, 1, 1); }
      // a stub of chalk and its dust, when there is room beside the slate
      if (W > 860) {
        b.save(); b.translate(cx, cy); b.rotate((TILT * Math.PI) / 180); b.scale(s, s); b.translate(-BW / 2, -OY);
        for (let i = 0; i < 120; i++) { const a = r() * Math.PI * 2, q = r() * r() * 46; b.fillStyle = `rgba(255,252,240,${0.1 + r() * 0.3})`; b.fillRect(BW + 86 + Math.cos(a) * q, ST + BH - 46 + Math.sin(a) * q * 0.7, 1.2, 1.2); }
        b.translate(BW + 84, ST + BH - 50); b.rotate(0.5);
        b.shadowColor = "rgba(70,40,0,0.45)"; b.shadowBlur = 9; b.shadowOffsetX = 4; b.shadowOffsetY = 7;
        const cg = b.createLinearGradient(0, -7, 0, 7);
        cg.addColorStop(0, "#ffffff"); cg.addColorStop(0.45, "#f3efe4"); cg.addColorStop(1, "#bdb6a4");
        rr(b, -30, -7, 60, 14, 5); b.fillStyle = cg; b.fill();
        b.shadowColor = "transparent"; b.fillStyle = "rgba(120,110,90,0.25)"; b.beginPath(); b.ellipse(27.5, 0, 2.6, 6.4, 0, 0, Math.PI * 2); b.fill();
        b.restore();
      }

      // The slate: lower stick and board, baked with its shadow.
      const c = layer(slate, BW + PAD * 2, ST + BH + PAD * 2);
      c.translate(PAD, PAD);
      c.save(); c.shadowColor = "rgba(74,42,0,0.6)"; c.shadowBlur = 34 * k; c.shadowOffsetX = 14 * k; c.shadowOffsetY = 26 * k; rr(c, 0, 0, BW, ST + BH, 6); c.fillStyle = "#111"; c.fill();
      c.shadowColor = "rgba(50,25,0,0.75)"; c.shadowBlur = 7 * k; c.shadowOffsetX = 3 * k; c.shadowOffsetY = 5 * k; c.fill(); c.restore();
      const bgr = c.createLinearGradient(0, ST, BW, ST + BH);
      bgr.addColorStop(0, "#232324"); bgr.addColorStop(0.5, "#161617"); bgr.addColorStop(1, "#0f0f10");
      rr(c, 0, ST - 6, BW, BH + 6, 6); c.fillStyle = bgr; c.fill();
      c.save(); rr(c, 0, ST, BW, BH, 6); c.clip();
      const r2 = rng(11);
      // chalk haze left by an eraser, heavier where the take number keeps changing
      for (let i = 0; i < 26; i++) {
        const tk = i < 7, x = tk ? 400 + r2() * 110 : r2() * BW, y = tk ? ROW[1] + 20 + r2() * 60 : ST + r2() * BH, rx = 40 + r2() * 110, ry = 10 + r2() * 26;
        c.save(); c.translate(x, y); c.rotate((r2() - 0.5) * 0.7); c.scale(1, ry / rx);
        const hz = c.createRadialGradient(0, 0, 0, 0, 0, rx); hz.addColorStop(0, `rgba(240,236,226,${tk ? 0.05 : 0.035})`); hz.addColorStop(1, "rgba(240,236,226,0)");
        c.fillStyle = hz; c.beginPath(); c.arc(0, 0, rx, 0, Math.PI * 2); c.fill(); c.restore();
      }
      for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(255,255,255,${0.02 + r2() * 0.06})`; c.fillRect(r2() * BW, ST + r2() * BH, 0.9, 0.9); }
      // the lamp's soft reflection in the lacquer
      const sheen = c.createLinearGradient(40, ST, 330, ST + BH); sheen.addColorStop(0, "rgba(255,255,255,0.09)"); sheen.addColorStop(0.35, "rgba(255,255,255,0.03)"); sheen.addColorStop(0.6, "rgba(255,255,255,0)");
      c.fillStyle = sheen; c.fillRect(0, ST, BW, BH);
      c.restore();
      // painted rules
      c.strokeStyle = "rgba(236,231,220,0.9)"; c.lineWidth = 2; c.lineCap = "round";
      rr(c, 10, ST + 10, BW - 20, BH - 20, 2); c.stroke();
      c.beginPath();
      for (const y of [ROW[1], ROW[2], ROW[3]]) { c.moveTo(10, y); c.lineTo(BW - 10, y); }
      c.moveTo(190, ROW[1]); c.lineTo(190, ROW[2]); c.moveTo(370, ROW[1]); c.lineTo(370, ROW[2]);
      c.moveTo(270, ROW[2]); c.lineTo(270, ROW[3]); c.moveTo(190, ROW[3]); c.lineTo(190, ROW[4] - 10);
      c.stroke();
      // printed labels
      c.fillStyle = "rgba(236,231,220,0.86)"; c.font = `700 9.5px ${LABEL_FONT}`; c.textBaseline = "alphabetic"; c.textAlign = "left";
      for (const [t, x, y] of [["PROD.", 22, ROW[0] + 28], ["ROLL", 22, ROW[1] + 19], ["SCENE", 202, ROW[1] + 19], ["TAKE", 382, ROW[1] + 19], ["DIRECTOR", 22, ROW[2] + 19], ["CAMERA", 282, ROW[2] + 19], ["DATE", 22, ROW[3] + 19], ["TIMECODE", 202, ROW[3] + 19]] as [string, number, number][]) spaced(c, t, x, y, 1.6);
      c.fillStyle = "rgba(236,231,220,0.5)"; c.font = `600 7.5px ${LABEL_FONT}`; spaced(c, "HR   MIN   SEC   FR", BW - 138, ROW[3] + 19, 1.2);
      // chalked details
      chalk(c, SLATE.production, 84, ROW[1] - 22, 38, 1, k);
      chalk(c, SLATE.roll, 100, ROW[2] - 20, 42, 2, k, "center");
      chalk(c, SLATE.scene, 282, ROW[2] - 20, 42, 3, k, "center");
      chalk(c, SLATE.director, 24, ROW[3] - 15, 23, 4, k);
      chalk(c, SLATE.camera, 284, ROW[3] - 15, 23, 5, k);
      chalk(c, SLATE.date, 24, ROW[4] - 26, 25, 6, k);
      // the timecode window: a slot cut in the board with dark red glass over the digits
      const wx = 202, wy = ROW[3] + 27, ww = BW - 22 - wx, wh = 43;
      rr(c, wx - 2, wy - 2, ww + 4, wh + 4, 5); c.fillStyle = "rgba(255,255,255,0.1)"; c.fill();
      rr(c, wx, wy, ww, wh, 4); const wg = c.createLinearGradient(0, wy, 0, wy + wh); wg.addColorStop(0, "#090101"); wg.addColorStop(1, "#200605"); c.fillStyle = wg; c.fill();
      c.save(); rr(c, wx, wy, ww, wh, 4); c.clip();
      const sh = c.createLinearGradient(0, wy, 0, wy + 12); sh.addColorStop(0, "rgba(0,0,0,0.85)"); sh.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = sh; c.fillRect(wx, wy, ww, 12);
      c.restore();
      // board bevel, then the fixed stick and its hinge leaf
      c.strokeStyle = "rgba(255,255,255,0.16)"; c.lineWidth = 1; c.beginPath(); c.moveTo(0.6, ST + BH - 6); c.lineTo(0.6, ST); c.stroke();
      const eg = c.createLinearGradient(0, ST + BH - 5, 0, ST + BH); eg.addColorStop(0, "#47474a"); eg.addColorStop(0.3, "#242425"); eg.addColorStop(1, "#060606");
      c.fillStyle = eg; c.fillRect(5, ST + BH - 5, BW - 10, 5);
      const eg2 = c.createLinearGradient(BW - 4, 0, BW, 0); eg2.addColorStop(0, "#3a3a3c"); eg2.addColorStop(1, "#070707");
      c.fillStyle = eg2; c.fillRect(BW - 4, ST + 4, 4, BH - 9);
      paintStick(c, 0, -1, 21);
      paintLeaf(c, 0, 31);

      // The moving stick, on its own layer so it can turn about the hinge pin.
      const u = layer(stick, BW + 40, ST + 40);
      u.translate(20, 20 + ST); // the pivot row is the stick's bottom edge
      paintStick(u, -ST, 1, 22);
      paintLeaf(u, -ST, 32);
      paintTake();
    };

    const digit = (ch: string, x: number, y: number, dw: number, dh: number, lit: boolean) => {
      const th = 4.4, on = lit ? DIGITS[ch] || "" : "";
      const bar = (seg: string, hx: number, hy: number, len: number, horiz: boolean) => {
        const o = on.includes(seg);
        ctx.fillStyle = o ? LED : "rgba(255,60,30,0.1)";
        ctx.shadowColor = o ? LED : "transparent"; ctx.shadowBlur = o ? 7 * k : 0;
        ctx.beginPath();
        if (horiz) { ctx.moveTo(hx + th / 2, hy); ctx.lineTo(hx + len - th / 2, hy); ctx.lineTo(hx + len, hy + th / 2); ctx.lineTo(hx + len - th / 2, hy + th); ctx.lineTo(hx + th / 2, hy + th); ctx.lineTo(hx, hy + th / 2); }
        else { ctx.moveTo(hx + th / 2, hy); ctx.lineTo(hx + th, hy + th / 2); ctx.lineTo(hx + th, hy + len - th / 2); ctx.lineTo(hx + th / 2, hy + len); ctx.lineTo(hx, hy + len - th / 2); ctx.lineTo(hx, hy + th / 2); }
        ctx.closePath(); ctx.fill();
      };
      const half = (dh - th) / 2;
      bar("a", x + 1.2, y, dw - 2.4, true); bar("g", x + 1.2, y + half, dw - 2.4, true); bar("d", x + 1.2, y + dh - th, dw - 2.4, true);
      bar("f", x, y + 1.2, half + th - 2.4, false); bar("b", x + dw - th, y + 1.2, half + th - 2.4, false);
      bar("e", x, y + half + 1.2, half + th - 2.4, false); bar("c", x + dw - th, y + half + 1.2, half + th - 2.4, false);
    };

    const draw = (now: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(bg, 0, 0);
      const sinceHit = st.hit ? (now - st.tClap) / 1000 : 9;
      const jolt = Math.exp(-9 * sinceHit);
      ctx.setTransform(k, 0, 0, k, cx * (k / s), (cy + 5 * jolt * Math.cos(38 * sinceHit)) * (k / s));
      ctx.rotate(((TILT + 0.5 * jolt * Math.sin(30 * sinceHit)) * Math.PI) / 180);
      ctx.translate(-BW / 2, -OY);
      // the top stick is drawn twice: first with its shadow, which the slate then covers, so the shadow only reaches the table
      const topStick = (shadow: boolean) => {
        ctx.save();
        ctx.translate(PIV, 0); ctx.rotate((-st.theta * Math.PI) / 180);
        if (shadow) { ctx.shadowColor = "rgba(74,42,0,0.6)"; ctx.shadowBlur = 20 * k; ctx.shadowOffsetX = 12 * k; ctx.shadowOffsetY = 22 * k; }
        ctx.drawImage(stick, -PIV - 20, -ST - 20, BW + 40, ST + 40);
        ctx.restore();
      };
      topStick(true);
      ctx.drawImage(slate, -PAD, -PAD, BW + PAD * 2, ST + BH + PAD * 2);
      // the take number, wiped and rewritten between takes
      if (st.alpha > 0.01) {
        ctx.save(); ctx.globalAlpha = st.alpha;
        ctx.beginPath(); ctx.rect(372, ROW[1] + 2, 180 * st.reveal, 90); ctx.clip();
        ctx.drawImage(takeCv, 366, ROW[1] + 1, 180, 92); ctx.restore();
      }
      // timecode
      let rem = COUNT_FROM, lit = true;
      if (st.hit && (st.phase === "drop" || st.phase === "run")) rem = Math.max(0, COUNT_FROM - sinceHit);
      if (st.phase === "done") { const t = (now - st.tDone) / 1000; if (t < 1.3) { rem = 0; lit = Math.floor(t * 5) % 2 === 0; } }
      const sec = Math.floor(rem), fr = Math.min(FPS - 1, Math.floor((rem - sec) * FPS));
      const txt = `0000${String(sec).padStart(2, "0")}${String(fr).padStart(2, "0")}`;
      ctx.save();
      ctx.transform(1, 0, -0.08, 1, 0, 0);
      const dw = 19, dh = 29, y0 = ROW[3] + 34;
      let x = 232 + (y0 + dh / 2) * 0.08;
      for (let i = 0; i < 8; i++) {
        digit(txt[i], x, y0, dw, dh, lit);
        x += dw + 7;
        if (i % 2 === 1 && i < 7) {
          ctx.fillStyle = lit ? LED : "rgba(255,60,30,0.1)"; ctx.shadowColor = lit ? LED : "transparent"; ctx.shadowBlur = lit ? 7 * k : 0;
          ctx.fillRect(x + 1.5, y0 + 8, 3.6, 3.6); ctx.fillRect(x + 1.5, y0 + 18, 3.6, 3.6);
          x += 13;
        }
      }
      ctx.restore();
      ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
      // a slanted reflection across the window glass
      const gl = ctx.createLinearGradient(202, ROW[3] + 27, 330, ROW[3] + 70);
      gl.addColorStop(0, "rgba(255,255,255,0)"); gl.addColorStop(0.45, "rgba(255,255,255,0.07)"); gl.addColorStop(0.5, "rgba(255,255,255,0)");
      ctx.fillStyle = gl; rr(ctx, 202, ROW[3] + 27, BW - 224, 43, 4); ctx.fill();
      // the top stick
      topStick(false);
      // hinge pin
      const pg = ctx.createRadialGradient(PIV - 2.5, -2.5, 1, PIV, 0, 10);
      pg.addColorStop(0, "#ffffff"); pg.addColorStop(0.45, "#aeb1b7"); pg.addColorStop(1, "#34363b");
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.beginPath(); ctx.arc(PIV + 0.8, 1.6, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(PIV, 0, 9.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#2a2c30"; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3 + 0.4; ctx.lineTo(PIV + Math.cos(a) * 4, Math.sin(a) * 4); } ctx.closePath(); ctx.fill();
      // chalk dust knocked loose by the clap
      for (const p of st.parts) { const a = 1 - p.age / p.life; ctx.fillStyle = `rgba(255,251,240,${(0.5 * a).toFixed(3)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1.6 - a * 0.6), 0, Math.PI * 2); ctx.fill(); }
    };

    const clap = (now: number) => {
      st.hit = true; st.tClap = now;
      for (let i = 0; i < 46; i++) st.parts.push({ x: PIV + 40 + Math.pow(rnd(), 0.6) * (BW - PIV - 46), y: (rnd() - 0.5) * 4, vx: (rnd() - 0.3) * 60, vy: (rnd() - 0.5) * 190, life: 0.5 + rnd() * 0.9, age: 0, r: 0.7 + rnd() * 1.8 });
      setStatus(`Take ${st.take} marked. Timecode counting down from ${COUNT_FROM} seconds.`);
    };

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (st.phase === "open" || st.phase === "done") {
        const t = (now - st.tDone) / 1000;
        const held = st.phase === "done" && t < 0.4;
        const target = held ? 0 : OPEN + (api.current.hover ? 4 : 0) + Math.sin(now / 900) * 0.6;
        st.omega += (110 * (target - st.theta) - 14 * st.omega) * dt; st.theta = Math.max(0, st.theta + st.omega * dt);
        if (st.phase === "open" && now > st.nextClap) { st.phase = "drop"; st.hit = false; st.omega = 0; }
        if (st.phase === "done") {
          if (!st.bumped) { st.alpha = 1 - Math.min(1, Math.max(0, (t - 0.8) / 0.45)); if (t > 1.3) { st.bumped = true; st.take += 1; paintTake(); setTake(st.take); st.reveal = 0; st.alpha = 1; } }
          else st.reveal = Math.min(1, (t - 1.35) / 0.55);
          if (t > 2.3) { st.phase = "open"; st.hit = false; st.nextClap = now + 2800; setStatus(`Sticks open for take ${st.take}.`); }
        }
      } else if (st.phase === "drop") {
        st.omega -= 2600 * dt; st.theta += st.omega * dt;
        if (st.theta <= 0) { st.theta = 0; if (!st.hit) clap(now); st.omega = -st.omega * 0.22; if (Math.abs(st.omega) < 30) { st.omega = 0; st.phase = "run"; } }
      } else if (now - st.tClap > COUNT_FROM * 1000) { st.phase = "done"; st.tDone = now; st.bumped = false; }
      for (const p of st.parts) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - 3 * dt; p.vy *= 1 - 3.4 * dt; }
      st.parts = st.parts.filter((p) => p.age < p.life);
      draw(now);
      if (visible && !document.hidden) raf = requestAnimationFrame(tick);
    };

    const size = () => {
      W = wrap.clientWidth;
      s = Math.min(1, Math.max(0.5, (W - 36) / 600));
      H = W < 640 ? Math.round((ST * 2 + BH + SWEEP) * s + 220) : 700;
      wrap.style.height = `${H}px`;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      k = dpr * s;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cx = W / 2; cy = H / 2 + (W < 640 ? -26 : -6);
      // from here on, positions are in design pixels: divide the centre by the scale
      const top = cy - (OY + ST + SWEEP) * s;
      btn.style.left = `${cx - (BW * s) / 2}px`; btn.style.top = `${top}px`;
      btn.style.width = `${BW * s}px`; btn.style.height = `${(ST * 2 + BH + SWEEP) * s}px`;
      btn.style.transformOrigin = `50% ${cy - top}px`; btn.style.transform = `rotate(${TILT}deg)`;
      build();
      draw(performance.now());
    };

    api.current.press = () => {
      const now = performance.now();
      if (reduce) { st.theta = st.theta > 1 ? 0 : OPEN; if (st.theta === 0) { setStatus(`Take ${st.take} marked.`); } else { st.take += 1; paintTake(); setTake(st.take); setStatus(`Sticks open for take ${st.take}.`); } draw(now); return; }
      if (st.phase === "open") { st.phase = "drop"; st.hit = false; st.omega = 0; }
      else if (st.phase === "run") { st.phase = "done"; st.tDone = now - 400; st.bumped = false; }
    };

    size();
    const ro = new ResizeObserver(size); ro.observe(wrap);
    const start = () => { cancelAnimationFrame(raf); if (!reduce && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); });
    io.observe(wrap);
    document.addEventListener("visibilitychange", start);
    start();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", start); };
  }, [reduce]);

  return (
    <section ref={wrapRef} className="relative w-full overflow-hidden bg-[#deaa3c]" style={{ height: 700 }}>
      <canvas ref={cvRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <button
        ref={btnRef}
        type="button"
        onClick={() => api.current.press()}
        onPointerEnter={() => { api.current.hover = true; }}
        onPointerLeave={() => { api.current.hover = false; }}
        aria-label={`Clapperboard for ${SLATE.production}, scene ${SLATE.scene}, take ${take}. Press to snap the sticks and start the countdown.`}
        className="absolute cursor-pointer rounded-md bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-4 focus-visible:ring-offset-[#deaa3c]"
      />
      <p className="absolute bottom-[76px] left-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#2b1c03] sm:bottom-8 sm:left-8">
        <span className="font-semibold">{SLATE.production} / Sc {SLATE.scene} / Take {take}</span>
        <span className="block text-[#4a3207]">Press the slate to mark it</span>
      </p>
      <a href="#" className="absolute bottom-4 left-5 right-5 inline-flex h-11 items-center justify-center gap-2 sm:left-auto rounded-full bg-[#171514] px-5 text-[13px] font-medium text-[#f6f0e2] transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-[#deaa3c] sm:bottom-7 sm:right-8">
        Book the premiere
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
      </a>
      <p aria-live="polite" className="sr-only">{status}</p>
    </section>
  );
}

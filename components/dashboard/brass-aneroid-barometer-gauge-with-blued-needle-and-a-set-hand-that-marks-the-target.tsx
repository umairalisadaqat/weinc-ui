import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// Everything a visitor is likely to change sits here.
const dial = { title: "WEEKLY ORDERS", maker: "HALE & ORCHARD", noun: "orders" };
const MIN = 0, MAX = 600; // the two ends of the printed scale
const STEP = 10; // one press of an arrow key moves the set hand this far
const bands = [{ at: 75, word: "SLOW" }, { at: 225, word: "STEADY" }, { at: 375, word: "BRISK" }, { at: 525, word: "RUSH" }];
const readings = [412, 436, 398, 455, 471, 428]; // the needle visits these in turn
const START_TARGET = 380; // where the brass set hand is parked
const HOLD = 3800; // milliseconds between readings
const W0 = 8.5, ZETA = 0.3; // how fast the needle swings and how soon it settles

const W = 600, H = 640, CX = 300, CY = 328, RO = 250, RD = 201; // canvas, centre, case radius, dial radius
const TAU = Math.PI * 2;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const ang = (v: number) => ((-135 + (270 * (v - MIN)) / (MAX - MIN)) * Math.PI) / 180; // 0 is straight up

export default function BrassAneroidBarometerGauge() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const knobHit = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [target, setTarget] = useState(START_TARGET);
  const [said, setSaid] = useState("");
  const live = useRef({ reading: readings[0], target: START_TARGET, touched: 0 });
  const api = useRef<{ poke: (kick?: boolean) => void } | null>(null);

  const reading = readings[idx];
  live.current.reading = reading;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (document.hidden || performance.now() - live.current.touched < HOLD) return;
      setIdx((i) => (i + 1) % readings.length);
      api.current?.poke();
    }, HOLD);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const cv = canvas.current, pad = knobHit.current;
    if (!cv || !pad) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasConic = typeof ctx.createConicGradient === "function";
    let k = 1; // canvas pixels per design pixel

    const brass = (c: CanvasRenderingContext2D, x: number, y: number, r: number, turn: number) => {
      if (!hasConic) {
        const g = c.createLinearGradient(x - r, y - r, x + r, y + r);
        g.addColorStop(0, "#fff0bd"); g.addColorStop(0.3, "#c79a3c"); g.addColorStop(0.55, "#f3d584"); g.addColorStop(0.8, "#7a5616"); g.addColorStop(1, "#c79a3c");
        return g;
      }
      const g = c.createConicGradient(turn, x, y);
      const stops: [number, string][] = [[0, "#fffbe4"], [0.04, "#f0cd76"], [0.13, "#a97824"], [0.25, "#5b3d0c"], [0.34, "#b08028"], [0.44, "#f4d886"], [0.5, "#fffbe6"], [0.56, "#dbae4e"], [0.7, "#66460f"], [0.8, "#a27522"], [0.92, "#ecc96e"], [1, "#fffbe4"]];
      for (const [o, col] of stops) g.addColorStop(o, col);
      return g;
    };
    const ring = (c: CanvasRenderingContext2D, r1: number, r0: number) => { c.beginPath(); c.arc(CX, CY, r1, 0, TAU); c.arc(CX, CY, r0, 0, TAU, true); c.closePath(); };
    const at = (a: number, r: number): [number, number] => [CX + Math.sin(a) * r, CY - Math.cos(a) * r];
    const spaced = (c: CanvasRenderingContext2D, text: string, x: number, y: number, gap: number) => {
      const ws = [...text].map((ch) => c.measureText(ch).width + gap);
      let px = x - (ws.reduce((p, q) => p + q, 0) - gap) / 2;
      c.textAlign = "left";
      [...text].forEach((ch, i) => { c.fillText(ch, px, y); px += ws[i]; });
    };
    const curved = (c: CanvasRenderingContext2D, text: string, mid: number, r: number, gap: number) => {
      const ws = [...text].map((ch) => c.measureText(ch).width + gap);
      let a = mid - (ws.reduce((p, q) => p + q, 0) - gap) / r / 2;
      c.textAlign = "center";
      [...text].forEach((ch, i) => {
        const ac = a + (ws[i] - gap) / r / 2, [x, y] = at(ac, r);
        c.save(); c.translate(x, y); c.rotate(ac); c.fillText(ch, 0, 0); c.restore();
        a += ws[i] / r;
      });
    };

    // Layer 1: case, bezel and printed dial. None of it moves, so it is painted once.
    const base = document.createElement("canvas");
    const build = () => {
      const b = base.getContext("2d");
      if (!b) return;
      base.width = cv.width; base.height = cv.height;
      b.setTransform(k, 0, 0, k, 0, 0);
      const SERIF = 'Georgia, "Times New Roman", Times, serif';

      // Shadows on the wall: one wide and soft, one tight under the case.
      for (const [blur, ox, oy, al] of [[46, 18, 34, 0.8], [12, 4, 7, 0.7]]) {
        b.save(); b.shadowColor = `rgba(0,0,0,${al})`; b.shadowBlur = blur * k; b.shadowOffsetX = ox * k; b.shadowOffsetY = oy * k;
        b.beginPath(); b.arc(CX, CY, RO - 2, 0, TAU); b.fillStyle = "#2a1c06"; b.fill(); b.restore();
      }
      // The hanging loop and its lug.
      const ly = CY - RO - 20;
      b.save(); b.shadowColor = "rgba(0,0,0,0.5)"; b.shadowBlur = 8 * k; b.shadowOffsetX = 5 * k; b.shadowOffsetY = 9 * k;
      b.beginPath(); b.arc(CX, ly, 15, 0, TAU); b.lineWidth = 6; b.strokeStyle = brass(b, CX, ly, 18, -2.2); b.stroke(); b.restore();
      b.beginPath(); b.arc(CX, ly, 17.2, Math.PI * 1.05, Math.PI * 1.6); b.lineWidth = 1; b.strokeStyle = "rgba(255,255,255,0.7)"; b.stroke();
      b.beginPath(); b.arc(CX, ly, 12.4, Math.PI * 0.1, Math.PI * 0.6); b.lineWidth = 1; b.strokeStyle = "rgba(40,20,0,0.5)"; b.stroke();
      b.beginPath(); b.arc(CX, CY - RO + 2, 11, Math.PI, 0); b.fillStyle = brass(b, CX, CY - RO, 12, -2.4); b.fill();
      b.beginPath(); b.arc(CX, ly - 15.5, 2.6, 0, TAU); b.fillStyle = "#1a1408"; b.fill(); // the pin it hangs on

      // Case: a rolled outer edge, a coin-milled band, a sloped bezel and the seat for the glass.
      b.beginPath(); b.arc(CX, CY, RO, 0, TAU); b.fillStyle = brass(b, CX, CY, RO, -2.25); b.fill();
      const roll = b.createRadialGradient(CX, CY, RO - 15, CX, CY, RO);
      roll.addColorStop(0, "rgba(40,22,0,0.7)"); roll.addColorStop(0.22, "rgba(40,22,0,0.05)"); roll.addColorStop(0.5, "rgba(255,250,224,0.42)"); roll.addColorStop(0.8, "rgba(40,22,0,0.1)"); roll.addColorStop(1, "rgba(24,12,0,0.75)");
      ring(b, RO, RO - 15); b.fillStyle = roll; b.fill();
      b.save(); b.lineCap = "round"; b.shadowColor = "rgba(255,250,220,0.9)"; b.shadowBlur = 6 * k;
      b.beginPath(); b.arc(CX, CY, RO - 7.5, Math.PI * 1.08, Math.PI * 1.46); b.lineWidth = 2.2; b.strokeStyle = "rgba(255,253,240,0.85)"; b.stroke();
      b.beginPath(); b.arc(CX, CY, RO - 7.5, Math.PI * 0.12, Math.PI * 0.34); b.lineWidth = 1.6; b.strokeStyle = "rgba(255,246,214,0.45)"; b.stroke();
      b.restore();
      ring(b, RO - 15, RO - 26); b.fillStyle = "rgba(40,24,2,0.84)"; b.fill();
      for (let i = 0; i < 200; i++) {
        const a = (i / 200) * TAU, lit = Math.max(0, Math.cos(a + Math.PI * 0.75)), back = Math.pow(Math.max(0, Math.cos(a - Math.PI * 0.25)), 3);
        b.beginPath(); b.moveTo(CX + Math.cos(a) * (RO - 25.4), CY + Math.sin(a) * (RO - 25.4)); b.lineTo(CX + Math.cos(a) * (RO - 15.6), CY + Math.sin(a) * (RO - 15.6));
        b.lineWidth = 1.7; b.strokeStyle = `rgba(255,232,160,${Math.min(1, 0.12 + 0.88 * lit + 0.5 * back)})`; b.stroke();
      }
      ring(b, RO - 26, RD + 5); b.fillStyle = brass(b, CX, CY, RO, 0.95); b.fill();
      const slope = b.createRadialGradient(CX, CY, RD + 5, CX, CY, RO - 26);
      slope.addColorStop(0, "rgba(30,15,0,0.62)"); slope.addColorStop(0.2, "rgba(30,15,0,0.12)"); slope.addColorStop(0.62, "rgba(255,250,224,0.2)"); slope.addColorStop(1, "rgba(30,15,0,0.5)");
      ring(b, RO - 26, RD + 5); b.fillStyle = slope; b.fill();
      b.save(); b.lineCap = "round"; b.shadowColor = "rgba(255,250,220,0.8)"; b.shadowBlur = 10 * k;
      b.beginPath(); b.arc(CX, CY, (RO - 26 + RD + 5) / 2 + 1, Math.PI * 1.12, Math.PI * 1.42); b.lineWidth = 7; b.strokeStyle = "rgba(255,250,225,0.5)"; b.stroke();
      b.beginPath(); b.arc(CX, CY, (RO - 26 + RD + 5) / 2 + 1, Math.PI * 0.16, Math.PI * 0.36); b.lineWidth = 5; b.strokeStyle = "rgba(255,244,205,0.3)"; b.stroke();
      b.restore();
      b.beginPath(); b.arc(CX, CY, RO - 26, Math.PI * 0.95, Math.PI * 1.6); b.lineWidth = 1; b.strokeStyle = "rgba(255,255,255,0.55)"; b.stroke();
      const seat = b.createRadialGradient(CX, CY, RD, CX, CY, RD + 5);
      seat.addColorStop(0, "#120c03"); seat.addColorStop(1, "#5c4011");
      ring(b, RD + 5, RD - 1); b.fillStyle = seat; b.fill();

      // Silvered dial with a faint spun grain, shaded where the bezel stands over it.
      const face = b.createRadialGradient(CX - 46, CY - 66, 20, CX, CY, RD);
      face.addColorStop(0, "#fdfaf0"); face.addColorStop(0.55, "#f1ead6"); face.addColorStop(1, "#d8cdae");
      b.beginPath(); b.arc(CX, CY, RD, 0, TAU); b.fillStyle = face; b.fill();
      b.save(); b.beginPath(); b.arc(CX, CY, RD, 0, TAU); b.clip();
      for (let r = 4; r < RD; r += 2.2) { b.beginPath(); b.arc(CX, CY, r, 0, TAU); b.lineWidth = 0.6; b.strokeStyle = (r / 2.2) % 2 < 1 ? "rgba(255,255,255,0.2)" : "rgba(90,70,30,0.05)"; b.stroke(); }
      b.shadowColor = "rgba(40,24,0,0.6)"; b.shadowBlur = 16 * k; b.shadowOffsetX = 7 * k; b.shadowOffsetY = 11 * k;
      b.beginPath(); b.arc(CX, CY, RD + 12, 0, TAU); b.lineWidth = 22; b.strokeStyle = "#000"; b.stroke();
      b.restore();

      // The printed scale.
      const INK = "#1d1710", R1 = RD - 15, R0 = R1 - 12;
      b.lineCap = "butt";
      for (const r of [R1, R0]) { b.beginPath(); b.arc(CX, CY, r, ang(MIN) - Math.PI / 2, ang(MAX) - Math.PI / 2); b.lineWidth = r === R1 ? 1.5 : 0.8; b.strokeStyle = INK; b.stroke(); }
      b.textBaseline = "middle"; b.fillStyle = INK;
      for (let v = MIN; v <= MAX + 0.001; v += 10) {
        const a = ang(v), big = v % 100 === 0, mid = v % 50 === 0;
        const [x0, y0] = at(a, R1), [x1, y1] = at(a, big ? R0 - 9 : mid ? R0 - 5 : R0);
        b.beginPath(); b.moveTo(x0, y0); b.lineTo(x1, y1); b.lineWidth = big ? 2.2 : mid ? 1.3 : 0.8; b.strokeStyle = INK; b.stroke();
        if (big) { const [x, y] = at(a, R0 - 27); b.font = `700 19px ${SERIF}`; b.textAlign = "center"; b.fillText(String(v), x, y); }
      }
      b.font = `700 12.5px ${SERIF}`; b.fillStyle = "#2a2118";
      for (const band of bands) curved(b, band.word, ang(band.at), R0 - 63, 3.2);
      // Dividers between the words, as on a weather dial.
      for (const v of [150, 300, 450]) { const [x0, y0] = at(ang(v), R0 - 55), [x1, y1] = at(ang(v), R0 - 70); b.beginPath(); b.moveTo(x0, y0); b.lineTo(x1, y1); b.lineWidth = 0.8; b.strokeStyle = "rgba(29,23,16,0.6)"; b.stroke(); }
      for (const [r, w] of [[R0 - 80, 1.2], [R0 - 83.5, 0.6]]) { b.beginPath(); b.arc(CX, CY, r, 0, TAU); b.lineWidth = w; b.strokeStyle = "rgba(29,23,16,0.75)"; b.stroke(); }
      // Two blued screws hold the dial to the movement.
      for (const sx of [CX - 62, CX + 62]) {
        b.beginPath(); b.arc(sx, CY + 0.8, 4.4, 0, TAU); b.fillStyle = "rgba(60,40,0,0.35)"; b.fill();
        const sg = b.createRadialGradient(sx - 1.2, CY - 1.4, 0.4, sx, CY, 4);
        sg.addColorStop(0, "#8fb0ee"); sg.addColorStop(0.45, "#2b4686"); sg.addColorStop(1, "#0c1630");
        b.beginPath(); b.arc(sx, CY, 3.8, 0, TAU); b.fillStyle = sg; b.fill();
        b.save(); b.translate(sx, CY); b.rotate(sx * 0.4); b.fillStyle = "rgba(4,8,20,0.9)"; b.fillRect(-3.4, -0.6, 6.8, 1.2); b.restore();
      }
      b.fillStyle = INK; b.font = `700 12px ${SERIF}`; spaced(b, dial.title, CX, CY + 126, 2.6);
      b.fillStyle = "rgba(29,23,16,0.72)"; b.font = `600 7.5px ${SERIF}`; spaced(b, dial.maker, CX, CY + 144, 2.2);
      b.beginPath(); b.moveTo(CX - 20, CY + 135.5); b.lineTo(CX + 20, CY + 135.5); b.lineWidth = 0.6; b.strokeStyle = "rgba(29,23,16,0.6)"; b.stroke();
    };

    const fit = () => {
      const w = cv.clientWidth || W;
      k = (w / W) * Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * k); cv.height = Math.round(H * k);
      build();
    };

    // x is the needle's reading and v its speed. tg is where the set hand is drawn.
    const s = { x: MIN, v: 0, tg: live.current.target, light: -0.2, lightTo: -0.2 };

    const needle = (a: number) => {
      ctx.save(); ctx.translate(CX, CY); ctx.rotate(a);
      ctx.shadowColor = "rgba(52,32,0,0.42)"; ctx.shadowBlur = 5 * k; ctx.shadowOffsetX = 5 * k; ctx.shadowOffsetY = 8 * k;
      const steel = ctx.createLinearGradient(-4, 0, 4, 0);
      steel.addColorStop(0, "#0c1630"); steel.addColorStop(0.42, "#33528f"); steel.addColorStop(0.6, "#1a2c57"); steel.addColorStop(1, "#080f22");
      ctx.fillStyle = steel;
      ctx.beginPath(); ctx.moveTo(0, -R_TIP); ctx.lineTo(4.6, -R_TIP + 26); ctx.lineTo(1.3, -R_TIP + 22); ctx.lineTo(3, 0); ctx.lineTo(1.8, 36); ctx.lineTo(-1.8, 36); ctx.lineTo(-3, 0); ctx.lineTo(-1.3, -R_TIP + 22); ctx.lineTo(-4.6, -R_TIP + 26); ctx.closePath(); ctx.fill();
      // The counterweight: an open crescent on the tail.
      ctx.beginPath(); ctx.arc(0, 47, 12, 0, TAU); ctx.arc(0, 43.5, 7.5, 0, TAU, true); ctx.fill("evenodd");
      ctx.shadowColor = "transparent";
      ctx.beginPath(); ctx.moveTo(-0.7, -R_TIP + 20); ctx.lineTo(-1.6, -4); ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(150,190,255,0.75)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 47, 11.4, Math.PI * 1.1, Math.PI * 1.6); ctx.lineWidth = 0.6; ctx.stroke();
      ctx.restore();
    };
    const R_TIP = RD - 22;

    const setHand = (a: number) => {
      ctx.save(); ctx.translate(CX, CY); ctx.rotate(a);
      // It rides on the glass, well clear of the dial, so its shadow falls further away and softer.
      ctx.shadowColor = "rgba(52,32,0,0.3)"; ctx.shadowBlur = 9 * k; ctx.shadowOffsetX = 10 * k; ctx.shadowOffsetY = 16 * k;
      const g = ctx.createLinearGradient(-5, 0, 5, 0);
      g.addColorStop(0, "#6a480e"); g.addColorStop(0.38, "#f0cc6c"); g.addColorStop(0.6, "#b58222"); g.addColorStop(1, "#553909");
      ctx.fillStyle = g;
      const tip = RD - 26;
      ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-1.25, -tip + 28); ctx.lineTo(-6.6, -tip + 16); ctx.lineTo(0, -tip); ctx.lineTo(6.6, -tip + 16); ctx.lineTo(1.25, -tip + 28); ctx.lineTo(2, 0); ctx.closePath();
      ctx.moveTo(0, -tip + 9); ctx.lineTo(-2.7, -tip + 16.4); ctx.lineTo(0, -tip + 22); ctx.lineTo(2.7, -tip + 16.4); ctx.closePath();
      ctx.fill("evenodd");
      ctx.restore();
    };

    const knob = (a: number) => {
      const la = -2.3 + s.light * 0.4;
      ctx.save(); ctx.shadowColor = "rgba(30,18,0,0.6)"; ctx.shadowBlur = 13 * k; ctx.shadowOffsetX = 7 * k; ctx.shadowOffsetY = 12 * k;
      ctx.beginPath(); ctx.arc(CX, CY, 22, 0, TAU); ctx.fillStyle = "#4a3208"; ctx.fill(); ctx.restore();
      const teeth = 34, step = TAU / teeth;
      for (let i = 0; i < teeth; i++) {
        const t0 = a + i * step, f = Math.cos(t0 - la - Math.PI / 2), lit = 0.5 + 0.5 * f, glint = Math.pow(Math.max(0, f), 6);
        for (let h = 0; h < 2; h++) {
          const a0 = t0 + h * step * 0.5 - Math.PI / 2, a1 = a0 + step * 0.5 + 0.004;
          const v = h === 0 ? 0.36 + lit * 0.5 + glint * 0.5 : 0.14 + lit * 0.2;
          ctx.beginPath(); ctx.arc(CX, CY, h === 0 ? 23 : 21, a0, a1); ctx.arc(CX, CY, 14, a1, a0, true); ctx.closePath();
          ctx.fillStyle = `rgb(${Math.min(255, 255 * v) | 0},${Math.min(255, 206 * v) | 0},${Math.min(255, 104 * v) | 0})`; ctx.fill();
        }
      }
      ctx.beginPath(); ctx.arc(CX, CY, 16.4, 0, TAU); ctx.fillStyle = "#3c2806"; ctx.fill();
      ctx.beginPath(); ctx.arc(CX, CY, 15.4, 0, TAU); ctx.fillStyle = brass(ctx, CX, CY, 16, la); ctx.fill();
      for (let r = 2.5; r < 15; r += 1.7) { ctx.beginPath(); ctx.arc(CX, CY, r, 0, TAU); ctx.lineWidth = 0.5; ctx.strokeStyle = (r / 1.7) % 2 < 1 ? "rgba(255,255,255,0.22)" : "rgba(60,36,0,0.16)"; ctx.stroke(); }
      ctx.beginPath(); ctx.arc(CX, CY, 15, 0, TAU); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(255,248,214,0.7)"; ctx.stroke();
      ctx.save(); ctx.translate(CX, CY); ctx.rotate(a);
      ctx.beginPath(); ctx.arc(0, -9.6, 1.9, 0, TAU); ctx.fillStyle = "#231704"; ctx.fill();
      ctx.restore();
    };

    const glass = () => {
      const sl = s.light;
      ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, RD, 0, TAU); ctx.clip();
      const edge = ctx.createRadialGradient(CX, CY, RD * 0.8, CX, CY, RD);
      edge.addColorStop(0, "rgba(40,24,0,0)"); edge.addColorStop(1, "rgba(40,24,0,0.2)");
      ctx.fillStyle = edge; ctx.fillRect(CX - RD, CY - RD, RD * 2, RD * 2);
      const bloom = ctx.createRadialGradient(CX - 78 + sl * 46, CY - 112, 6, CX - 60 + sl * 46, CY - 90, 190);
      bloom.addColorStop(0, "rgba(255,255,255,0.3)"); bloom.addColorStop(0.4, "rgba(255,255,255,0.08)"); bloom.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bloom; ctx.fillRect(CX - RD, CY - RD, RD * 2, RD * 2);
      // The crescent a domed glass throws back from a window.
      const a0 = Math.PI * (1.06 + sl * 0.1), a1 = Math.PI * (1.6 + sl * 0.1);
      const cres = ctx.createLinearGradient(CX - RD, CY - RD, CX, CY);
      cres.addColorStop(0, "rgba(255,255,255,0.8)"); cres.addColorStop(1, "rgba(255,255,255,0.04)");
      ctx.beginPath(); ctx.arc(CX, CY, RD - 7, a0, a1); ctx.arc(CX + 15, CY + 20, RD - 7, a1 - 0.07, a0 + 0.1, true); ctx.closePath(); ctx.fillStyle = cres; ctx.fill();
      ctx.beginPath(); ctx.arc(CX, CY, RD - 5, Math.PI * (0.08 + sl * 0.06), Math.PI * (0.42 + sl * 0.06)); ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.stroke();
      // Four window panes, bent a little by the curve of the glass.
      const wx = CX + 58 + sl * 38, wy = CY - 132;
      ctx.fillStyle = "rgba(255,255,255,0.13)";
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        const x = wx + i * 27 + j * 5, y = wy + j * 31 + i * 7;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 23, y + 6); ctx.lineTo(x + 27, y + 33); ctx.lineTo(x + 4.5, y + 27); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      needle(ang(s.x));
      setHand(ang(s.tg));
      knob(ang(s.tg));
      glass();
    };

    let raf = 0, last = 0, seen = true, moved = -1e9;
    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      const span = MAX - MIN;
      for (let i = 0; i < 4; i++) {
        const h = dt / 4;
        s.v += (W0 * W0 * (live.current.reading - s.x) - 2 * ZETA * W0 * s.v) * h; s.x += s.v * h;
        // End pins: the needle taps them and comes back off.
        if (s.x > MAX + span * 0.03) { s.x = MAX + span * 0.03; s.v *= -0.3; }
        if (s.x < MIN - span * 0.03) { s.x = MIN - span * 0.03; s.v *= -0.3; }
      }
      s.tg += (live.current.target - s.tg) * Math.min(1, dt * 16);
      if (now - moved > 2500) s.lightTo = 0.5 * Math.sin(now / 2100) - 0.1;
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 5);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const still = () => { s.x = live.current.reading; s.v = 0; s.tg = live.current.target; draw(); };
    const wake = (kick?: boolean) => {
      if (reduce) { still(); return; }
      if (kick) s.v += (Math.random() < 0.5 ? -1 : 1) * (220 + Math.random() * 120); // a knuckle on the glass
      if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
    };
    api.current = { poke: wake };
    fit(); wake();

    // The knob in the middle of the glass turns the set hand.
    let drag = false, lastA = 0, val = 0;
    const angleAt = (e: PointerEvent) => { const r = pad.getBoundingClientRect(); return Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))); };
    const onDown = (e: PointerEvent) => { drag = true; lastA = angleAt(e); val = live.current.target; pad.setPointerCapture(e.pointerId); e.preventDefault(); };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      const a = angleAt(e); let d = a - lastA; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; lastA = a;
      val = clamp(val + (d / ((270 * Math.PI) / 180)) * (MAX - MIN), MIN, MAX);
      const next = Math.round(val / STEP) * STEP;
      if (next !== live.current.target) { live.current.target = next; live.current.touched = performance.now(); setTarget(next); wake(); }
    };
    const onUp = () => { drag = false; };
    const onLight = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); moved = performance.now(); s.lightTo = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1); };
    pad.addEventListener("pointerdown", onDown); pad.addEventListener("pointermove", onMove);
    pad.addEventListener("pointerup", onUp); pad.addEventListener("pointercancel", onUp);
    const host = cv.parentElement;
    host?.addEventListener("pointermove", onLight);
    const ro = new ResizeObserver(() => { fit(); if (reduce) still(); else draw(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      pad.removeEventListener("pointerdown", onDown); pad.removeEventListener("pointermove", onMove);
      pad.removeEventListener("pointerup", onUp); pad.removeEventListener("pointercancel", onUp);
      host?.removeEventListener("pointermove", onLight);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const gap = reading - target;
  const verdict = gap === 0 ? "On target" : `${Math.abs(gap)} ${gap > 0 ? "ahead" : "behind"}`;
  const moveTarget = (next: number) => {
    const v = clamp(next, MIN, MAX);
    live.current.target = v; live.current.touched = performance.now();
    setTarget(v); setSaid(`Target ${v}. Reading ${reading}, ${v === reading ? "on target" : `${Math.abs(reading - v)} ${reading > v ? "ahead" : "behind"}`}.`);
    api.current?.poke();
  };
  const tap = () => {
    const next = (idx + 1) % readings.length;
    live.current.touched = performance.now(); live.current.reading = readings[next];
    setIdx(next); setSaid(`Reading ${readings[next]} ${dial.noun}.`);
    api.current?.poke(true);
  };
  const onKey = (e: ReactKeyboardEvent) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowUp" ? target + STEP : e.key === "ArrowLeft" || e.key === "ArrowDown" ? target - STEP : e.key === "PageUp" ? target + STEP * 5 : e.key === "PageDown" ? target - STEP * 5 : e.key === "Home" ? MIN : e.key === "End" ? MAX : null;
    if (next === null) return;
    e.preventDefault(); moveTarget(next);
  };
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  return (
    <div className="flex min-h-[720px] w-full flex-col items-center justify-center bg-[#14271f] bg-[radial-gradient(80%_72%_at_44%_40%,#2f5a4a_0%,#1b382d_46%,#0d1a15_100%)] px-4 py-8">
      <div className="relative w-full" style={{ maxWidth: 548, aspectRatio: `${W} / ${H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <button
          type="button"
          onClick={tap}
          aria-label="Tap the glass for the next reading"
          style={{ left: pct(CX - RD, W), top: pct(CY - RD, H), width: pct(RD * 2, W), height: pct(RD * 2, H) }}
          className="absolute cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#ffe08a] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
        />
        <div
          ref={knobHit}
          role="slider"
          tabIndex={0}
          aria-label="Target, shown by the brass set hand"
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={target}
          aria-valuetext={`${target} ${dial.noun}`}
          onKeyDown={onKey}
          style={{ left: pct(CX - 44, W), top: pct(CY - 44, H), width: pct(88, W), height: pct(88, H) }}
          className="absolute cursor-grab touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#ffe08a] active:cursor-grabbing"
        />
      </div>
      <p className="-mt-1 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-[#b9c8bd]">
        <span className="text-[#f4ecd4]">{reading} {dial.noun}</span>
        <span className="mx-2 text-[#5d7568]">/</span>
        Target {target}
        <span className="mx-2 text-[#5d7568]">/</span>
        <span className="text-[#ffd98a]">{verdict}</span>
      </p>
      <p aria-live="polite" className="sr-only">{said}</p>
    </div>
  );
}

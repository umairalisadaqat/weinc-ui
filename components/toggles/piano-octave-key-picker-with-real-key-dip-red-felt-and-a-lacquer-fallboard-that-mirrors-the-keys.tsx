import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// One octave, left to right. `sharp` makes a black key. Rename the labels to reuse it as any twelve-way picker.
const keys = [
  { label: "C", sharp: false, note: "No sharps or flats" },
  { label: "D flat", sharp: true, note: "Five flats" },
  { label: "D", sharp: false, note: "Two sharps" },
  { label: "E flat", sharp: true, note: "Three flats" },
  { label: "E", sharp: false, note: "Four sharps" },
  { label: "F", sharp: false, note: "One flat" },
  { label: "F sharp", sharp: true, note: "Six sharps" },
  { label: "G", sharp: false, note: "One sharp" },
  { label: "A flat", sharp: true, note: "Four flats" },
  { label: "A", sharp: false, note: "Three sharps" },
  { label: "B flat", sharp: true, note: "Two flats" },
  { label: "B", sharp: false, note: "Five sharps" },
];
const START = 0; // the key that is held down on load
const DEMO = [4, 7, 10, 5, 2, 0]; // keys the idle demo walks through
const SOUND_ON = false; // set to true to hear a soft tone on each key you press
const FELT = [163, 22, 31]; // red, green, blue of the felt strip behind the keys
const RING = "#ffb454"; // keyboard focus outline

// The model, in millimetres. x runs left to right, y is up, z runs from the front of the keys to the fallboard.
const WK = 23.5, GAP = 1.1, LEN = 150, BZ = 55, BW = 5.6, BT = 4.5, BH = 11.5, CHEEK = 23, CH = 15, BASE = -34, FALL = 76, BACK = 22, SLIPZ = -15, SLIPY = -10, PIVOT = 235, DIP = 10.5, SINK = 7.5;
const NUDGE = [-1.8, 1.8, -2.4, 0, 2.4]; // black keys are not centred on the gaps of a real keyboard
const WHITES = keys.filter((k) => !k.sharp).length, HALF = (WHITES * WK) / 2, FX = HALF + CHEEK;
const layout = (() => {
  let w = 0, b = 0;
  return keys.map((k) => (k.sharp ? { x: -HALF + w * WK + NUDGE[b++ % 5], w: w - 1 } : { x: -HALF + w * WK, w: w++ }));
})();

// A fixed camera in front of and above the keyboard, and a fit of the whole case into the canvas.
const CW = 720, CH2 = 640, CAM_Y = 700, CAM_Z = -790, SIN = Math.sin(0.68), COS = Math.cos(0.68);
const unit = (x: number, y: number, z: number) => { const dy = y - CAM_Y, dz = z - CAM_Z, d = dz * COS - dy * SIN; return [x / d, -(dy * COS + dz * SIN) / d]; };
const fitBox = (() => {
  let x1 = 0, y0 = 9, y1 = -9;
  for (const y of [BASE, FALL]) for (const z of [SLIPZ, LEN + BACK]) { const [ux, uy] = unit(FX, y, z); x1 = Math.max(x1, ux); y0 = Math.min(y0, uy); y1 = Math.max(y1, uy); }
  const S = Math.min((CW - 150) / (2 * x1), (CH2 - 84) / (y1 - y0));
  return { S, OX: CW / 2, OY: 26 - y0 * S };
})();
const P = (x: number, y: number, z: number): [number, number] => { const [ux, uy] = unit(x, y, z); return [fitBox.OX + ux * fitBox.S, fitBox.OY + uy * fitBox.S]; };
// Screen boxes for the real buttons that sit over each key, as fractions of the canvas.
const boxes = keys.map((k, i) => {
  const g = layout[i];
  const pts = k.sharp ? [P(g.x - BW, 0, BZ), P(g.x + BW, 0, BZ), P(g.x - BT, BH, LEN), P(g.x + BT, BH, LEN)] : [P(g.x, -20, 0), P(g.x + WK, -20, 0), P(g.x + 3, 0, BZ), P(g.x + WK - 3, 0, BZ)];
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  if (!k.sharp) { xs.push(P(g.x + 1, 0, 0)[0], P(g.x + WK - 1, 0, 0)[0]); }
  const l = Math.min(...xs), t = Math.min(...ys);
  return { left: l / CW, top: t / CH2, width: (Math.max(...xs) - l) / CW, height: (Math.max(...ys) - t) / CH2 };
});

let audio: AudioContext | null = null;
const tone = (i: number) => {
  if (!SOUND_ON || typeof window === "undefined") return;
  audio = audio || new AudioContext();
  const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
  o.type = "triangle"; o.frequency.value = 261.63 * Math.pow(2, i / 12);
  g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
  o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + 0.9);
};

type V = [number, number, number];

export default function PianoOctaveKeyPicker() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const [value, setValue] = useState(START);
  const valueRef = useRef(START);
  const api = useRef<{ go: (i: number) => void; focus: (i: number) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, box = wrap.current;
    if (!cv || !box) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let k = dpr, mirror = false;
    const s = { p: keys.map((_, i) => (i === START ? 1 : 0)), v: keys.map(() => 0), hover: -1, drag: false, focus: -1 };

    const pt = (v: V) => P(v[0], v[1], mirror ? 2 * LEN - v[2] : v[2]);
    const path = (vs: V[]) => { ctx.beginPath(); vs.forEach((v, i) => { const [x, y] = pt(v); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.closePath(); };
    const grad = (a: V, b: V, stops: [number, string][]) => { const [x0, y0] = pt(a), [x1, y1] = pt(b); const g = ctx.createLinearGradient(x0, y0, x1, y1); for (const [o, c] of stops) g.addColorStop(o, c); return g; };
    const quad = (vs: V[], fill: string | CanvasGradient) => { path(vs); ctx.fillStyle = fill; ctx.fill(); };
    const line = (a: V, b: V, w: number, c: string | CanvasGradient) => { const [x0, y0] = pt(a), [x1, y1] = pt(b); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(); };
    // A blurred shape with nothing solid under it: the shape is drawn off the canvas and only its shadow lands.
    const soft = (vs: V[], colour: string, blur: number) => {
      ctx.save(); ctx.shadowColor = colour; ctx.shadowBlur = blur * k; ctx.shadowOffsetX = 3000 * k; ctx.translate(-3000, 0); path(vs); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
    };
    // How far the top of a key has dropped at a given depth. Keys pivot far behind the fallboard, so the front moves most.
    const drop = (i: number, z: number) => Math.max(-0.04, s.p[i]) * (keys[i].sharp ? SINK * (PIVOT - z) / (PIVOT - BZ) : DIP * (PIVOT - z) / PIVOT);
    const whiteAt = (w: number) => keys.findIndex((key, i) => !key.sharp && layout[i].w === w);
    let seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const flecks = Array.from({ length: 520 }, () => [(rand() * 2 - 1) * HALF, rand(), rand()]);

    const whiteKeys = () => {
      const order = keys.map((_, i) => i).filter((i) => !keys[i].sharp).sort((a, b) => Math.abs(layout[b].x + WK / 2) - Math.abs(layout[a].x + WK / 2));
      for (const i of order) {
        const p = Math.max(0, s.p[i]), xl = layout[i].x + GAP / 2, xr = xl + WK - GAP, d0 = drop(i, 0), d1 = drop(i, LEN);
        const shade = (v: number) => `rgb(${(v - 26 * p) | 0},${(v - 3 - 28 * p) | 0},${(v - 14 - 32 * p) | 0})`;
        if (!mirror) quad([[xl, -d0, 0], [xr, -d0, 0], [xr, -d0 - 22, 0], [xl, -d0 - 22, 0]], grad([0, -d0, 0], [0, -d0 - 22, 0], [[0, "#f1ecdf"], [0.3, "#d9d3c3"], [1, "#958e7c"]]));
        // A tilted key throws the light somewhere else, so the bright band slides and the whole top dims.
        const b = 0.34 + 0.2 * p;
        quad([[xl, -d0, 0], [xr, -d0, 0], [xr, -d1, LEN], [xl, -d1, LEN]], grad([0, -d0, 0], [0, -d1, LEN], [[0, shade(249)], [b - 0.2, shade(240)], [b - 0.05, shade(255)], [b + 0.07, shade(255)], [b + 0.22, shade(238)], [0.8, shade(226)], [1, shade(190)]]));
        if (mirror) continue;
        line([xl + 0.3, -d0, 0], [xl + 0.3, -d1, LEN], 0.9, "rgba(255,255,255,0.85)");
        line([xr - 0.3, -d0, 0], [xr - 0.3, -d1, LEN], 0.9, "rgba(90,74,44,0.2)");
        line([xl + 0.6, -d0 - 0.3, 0], [xr - 0.6, -d0 - 0.3, 0], 1.7, "#ffffff");
        line([xl + 0.6, -d0 - 1.6, 0], [xr - 0.6, -d0 - 1.6, 0], 0.9, "rgba(120,104,70,0.35)");
      }
      if (mirror) return;
      // Where one key is lower than the next, the bare wooden side of the higher one shows.
      for (let w = 0; w < WHITES - 1; w++) {
        const a = whiteAt(w), b = whiteAt(w + 1), xe = -HALF + (w + 1) * WK;
        if (Math.abs(xe) < 0.01) continue;
        const hi = xe < 0 ? a : b, lo = xe < 0 ? b : a, x = xe < 0 ? xe - GAP / 2 : xe + GAP / 2;
        if (drop(lo, 0) - drop(hi, 0) < 0.05) continue;
        quad([[x, -drop(hi, 0), 0], [x, -drop(lo, 0), 0], [x, -drop(lo, LEN), LEN], [x, -drop(hi, LEN), LEN]], grad([x, 0, 0], [x, 0, LEN], [[0, "#c79f68"], [0.5, "#a9824f"], [1, "#6d5131"]]));
        line([x, -drop(hi, 0), 0], [x, -drop(hi, LEN), LEN], 0.8, "rgba(255,255,255,0.7)");
      }
      // And the higher key shades the lower one.
      for (let w = 0; w < WHITES; w++) {
        const i = whiteAt(w), left = w > 0 ? whiteAt(w - 1) : -1, d = drop(i, 0) - (left < 0 ? 0 : drop(left, 0)), x = layout[i].x + GAP / 2;
        if (d < 0.1) continue;
        const reach = d * 0.62;
        quad([[x, -drop(i, 0), 0], [x + reach, -drop(i, 0), 0], [x + reach * 0.3, -drop(i, LEN), LEN], [x, -drop(i, LEN), LEN]], grad([x, 0, 0], [x + reach, 0, 0], [[0, "rgba(50,34,10,0.5)"], [0.7, "rgba(50,34,10,0.3)"], [1, "rgba(50,34,10,0)"]]));
      }
    };

    const blackKeys = () => {
      keys.forEach((key, i) => {
        if (!key.sharp) return;
        const xc = layout[i].x, s0 = drop(i, BZ), s1 = drop(i, LEN), h0 = BH - s0, h1 = BH - s1, t = Math.max(0, s0 / BH);
        const zs = BZ + 7, zb = BZ + 7 * t, wb = BW + (BT - BW) * t; // where the sloped nose meets the white keys once it has sunk
        if (!mirror && Math.abs(xc) > 2) {
          const sgn = xc < 0 ? 1 : -1, near = whiteAt(layout[i].w + (xc < 0 ? 1 : 0)), xb = xc + sgn * BW, xt = xc + sgn * BT;
          quad([[xc + sgn * wb, 0, zb], [xb, -drop(near, BZ), BZ], [xb, -drop(near, LEN), LEN], [xt, h1, LEN], [xt, h0, zs]], grad([xb, 0, BZ], [xb, BH, BZ], [[0, "#050506"], [0.6, "#1d1e21"], [1, "#3b3c42"]]));
        }
        if (!mirror) quad([[xc - wb, 0, zb], [xc + wb, 0, zb], [xc + BT, h0, zs], [xc - BT, h0, zs]], grad([xc, 0, zb], [xc, h0, zs], [[0, "#101012"], [0.5, "#33343a"], [1, "#7c7d85"]]));
        quad([[xc - BT, h0, zs], [xc + BT, h0, zs], [xc + BT, h1, LEN], [xc - BT, h1, LEN]], grad([xc, h0, zs], [xc, h1, LEN], [[0, "#55565d"], [0.05, "#2a2b30"], [0.3, "#17171a"], [0.52, "#2e2f34"], [0.62, "#35363c"], [0.8, "#141416"], [1, "#060607"]]));
        if (mirror) return;
        line([xc - BT + 0.5, h0, zs + 2], [xc - BT + 0.5, h1, LEN - 8], 1.1, "rgba(255,255,255,0.32)");
        line([xc - BT + 0.4, h0, zs], [xc + BT - 0.4, h0, zs], 1.2, "rgba(255,255,255,0.6)");
      });
    };

    const cheeks = (inner: boolean) => {
      for (const sg of [-1, 1]) {
        const xi = sg * HALF, xo = sg * FX;
        if (inner) {
          quad([[xi, -16, SLIPZ], [xi, CH, SLIPZ], [xi, CH, LEN], [xi, -16, LEN]], grad([xi, CH, 0], [xi, -4, 0], [[0, "#0a0a0c"], [0.55, "#1a1a1d"], [0.8, sg < 0 ? "#34322d" : "#5b5850"], [1, "#2b2924"]]));
          continue;
        }
        quad([[xi, CH, SLIPZ], [xo, CH, SLIPZ], [xo, CH, LEN], [xi, CH, LEN]], grad([0, CH, SLIPZ], [0, CH, LEN], [[0, "#3d3e44"], [0.06, "#1b1c1f"], [0.3, "#0d0d0f"], [0.48, "#2b2c31"], [0.6, "#303136"], [0.75, "#101012"], [1, "#050506"]]));
        if (mirror) continue;
        quad([[xi, CH, SLIPZ], [xo, CH, SLIPZ], [xo, BASE, SLIPZ], [xi, BASE, SLIPZ]], grad([0, CH, SLIPZ], [0, BASE, SLIPZ], [[0, "#2a2b2f"], [0.25, "#121214"], [0.7, "#0a0a0b"], [1, "#020202"]]));
        line([xi, CH, SLIPZ], [xo, CH, SLIPZ], 1.3, "rgba(255,255,255,0.55)");
        line([xi, CH, SLIPZ], [xi, CH, LEN], 1, sg < 0 ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.42)");
      }
    };

    const draw = () => {
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.clearRect(0, 0, CW, CH2);
      mirror = false;
      const ZB = LEN + BACK;

      // Shadows on the table: a long soft one from the tall back, a short one from the low front, and a dark seam where the case meets the surface.
      soft([[-FX + 8, BASE, SLIPZ - 7], [FX + 12, BASE, SLIPZ - 7], [FX + 20, BASE, ZB + 8], [-FX + 20, BASE, ZB + 8]], "rgba(48,12,2,0.45)", 26);
      soft([[-FX + 1, BASE, SLIPZ - 3], [FX + 3, BASE, SLIPZ - 3], [FX + 3, BASE, SLIPZ + 12], [-FX + 1, BASE, SLIPZ + 12]], "rgba(20,4,0,0.8)", 5);

      // The back of the case: its top, and the fallboard that faces the player.
      quad([[-FX, FALL, LEN], [FX, FALL, LEN], [FX, FALL, ZB], [-FX, FALL, ZB]], grad([0, FALL, LEN], [0, FALL, ZB], [[0, "#4a4b52"], [0.12, "#1e1f22"], [0.5, "#2f3035"], [1, "#0c0c0e"]]));
      const board: V[] = [[-FX, FALL, LEN], [FX, FALL, LEN], [FX, BASE, LEN], [-FX, BASE, LEN]];
      quad(board, grad([0, FALL, LEN], [0, 0, LEN], [[0, "#2c2d32"], [0.05, "#131316"], [0.55, "#0a0a0c"], [1, "#050506"]]));
      // Black lacquer is a dark mirror: draw the keyboard again, reflected in the plane of the board.
      ctx.save(); path(board); ctx.clip();
      mirror = true; whiteKeys(); blackKeys(); cheeks(false); mirror = false;
      quad(board, grad([0, 0, LEN], [0, FALL * 0.8, LEN], [[0, "rgba(6,6,8,0.5)"], [0.3, "rgba(6,6,8,0.8)"], [0.7, "rgba(6,6,8,0.97)"], [1, "rgba(6,6,8,1)"]]));
      quad(board, grad([0, FALL, LEN], [0, FALL - 30, LEN], [[0, "rgba(255,255,255,0.1)"], [1, "rgba(255,255,255,0)"]]));
      ctx.restore();
      line([-FX, FALL, LEN], [FX, FALL, LEN], 1.4, "rgba(255,255,255,0.5)");

      // Keybed, then the keys.
      quad([[-HALF, -16, SLIPZ], [HALF, -16, SLIPZ], [HALF, -16, LEN], [-HALF, -16, LEN]], "#0b0806");
      cheeks(true);
      whiteKeys();
      ctx.save(); path([[-HALF, 0, 0], [HALF, 0, 0], [HALF, 0, LEN], [-HALF, 0, LEN]]); ctx.clip();
      soft([[-HALF, 0, -4], [-HALF + CH * 0.42, 0, -4], [-HALF + CH * 0.42, 0, LEN], [-HALF, 0, LEN]], "rgba(40,26,6,0.5)", 5);
      keys.forEach((key, i) => {
        if (!key.sharp) return;
        const h = BH - drop(i, BZ), x = layout[i].x, o = h * 0.62;
        soft([[x - BW + 1, 0, BZ], [x + BW + o, 0, BZ - h * 0.12], [x + BW + o, 0, LEN], [x - BW + 1, 0, LEN]], "rgba(40,26,6,0.62)", 4.5);
      });
      quad([[-HALF, 0, LEN - 46], [HALF, 0, LEN - 46], [HALF, 0, LEN], [-HALF, 0, LEN]], grad([0, 0, LEN - 46], [0, 0, LEN], [[0, "rgba(26,14,2,0)"], [1, "rgba(26,14,2,0.5)"]]));
      ctx.restore();
      // Felt strip lying across the backs of the keys.
      const [fr, fg, fb] = FELT, FZ = LEN - 9;
      quad([[-HALF, 4, FZ], [HALF, 4, FZ], [HALF, -2, FZ], [-HALF, -2, FZ]], `rgb(${fr * 0.45 | 0},${fg * 0.45 | 0},${fb * 0.45 | 0})`);
      quad([[-HALF, 4, FZ], [HALF, 4, FZ], [HALF, 4, LEN], [-HALF, 4, LEN]], grad([0, 4, FZ], [0, 4, LEN], [[0, `rgb(${Math.min(255, fr * 1.2) | 0},${fg * 1.5 | 0},${fb * 1.4 | 0})`], [0.5, `rgb(${fr},${fg},${fb})`], [1, `rgb(${fr * 0.5 | 0},${fg * 0.5 | 0},${fb * 0.5 | 0})`]]));
      for (const [fx, fz, fv] of flecks) { const [x, y] = pt([fx, 4, FZ + fz * 9]); ctx.fillStyle = fv > 0.5 ? `rgba(255,190,170,${(fv - 0.5) * 0.5})` : `rgba(30,0,0,${(0.5 - fv) * 0.8})`; ctx.fillRect(x, y, 1.5, 0.8); }
      blackKeys();

      // Cheek blocks, and the rail the key fronts drop behind.
      cheeks(false);
      quad([[-HALF, SLIPY, SLIPZ], [HALF, SLIPY, SLIPZ], [HALF, SLIPY, -1.2], [-HALF, SLIPY, -1.2]], grad([0, SLIPY, SLIPZ], [0, SLIPY, -1.2], [[0, "#6a6b73"], [0.25, "#2b2c31"], [0.7, "#1a1a1d"], [1, "#3a3936"]]));
      quad([[-HALF, SLIPY, SLIPZ], [HALF, SLIPY, SLIPZ], [HALF, BASE, SLIPZ], [-HALF, BASE, SLIPZ]], grad([0, SLIPY, SLIPZ], [0, BASE, SLIPZ], [[0, "#2f3035"], [0.16, "#121214"], [0.45, "#1c1d20"], [0.6, "#0d0d0f"], [1, "#020202"]]));
      const glint = ctx.createLinearGradient(pt([-HALF, 0, 0])[0], 0, pt([HALF, 0, 0])[0], 0);
      glint.addColorStop(0, "rgba(255,255,255,0.1)"); glint.addColorStop(0.28, "rgba(255,255,255,0.75)"); glint.addColorStop(0.6, "rgba(255,255,255,0.3)"); glint.addColorStop(1, "rgba(255,255,255,0.08)");
      line([-HALF, SLIPY, SLIPZ], [HALF, SLIPY, SLIPZ], 1.5, glint);
      line([-FX, BASE, SLIPZ], [FX, BASE, SLIPZ], 1.2, "rgba(0,0,0,0.9)");

      // Brass lock plate in the middle of the fall.
      const [ex, ey] = pt([0, FALL - 22, LEN]), r = Math.abs(pt([0, FALL - 22, LEN])[1] - pt([0, FALL - 29, LEN])[1]);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.85)"; ctx.shadowBlur = 3 * k; ctx.shadowOffsetY = 1.5 * k; ctx.shadowOffsetX = 1 * k;
      ctx.beginPath(); ctx.ellipse(ex, ey, r * 0.68, r, 0, 0, Math.PI * 2);
      const br = ctx.createRadialGradient(ex - r * 0.25, ey - r * 0.45, 0.5, ex, ey, r * 1.1); br.addColorStop(0, "#fff3c4"); br.addColorStop(0.4, "#d0a03c"); br.addColorStop(1, "#6a4810");
      ctx.fillStyle = br; ctx.fill(); ctx.restore();
      ctx.fillStyle = "#130c02"; ctx.beginPath(); ctx.arc(ex, ey - r * 0.22, r * 0.22, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(ex - r * 0.1, ey - r * 0.2, r * 0.2, r * 0.66);

      if (s.focus >= 0) {
        const i = s.focus, g = layout[i];
        const outline: V[] = keys[i].sharp
          ? [[g.x - BT, BH - drop(i, BZ), BZ + 7], [g.x + BT, BH - drop(i, BZ), BZ + 7], [g.x + BT, BH - drop(i, LEN), LEN - 10], [g.x - BT, BH - drop(i, LEN), LEN - 10]]
          : [[g.x + 1.6, -drop(i, 0), 1.5], [g.x + WK - 1.6, -drop(i, 0), 1.5], [g.x + WK - 1.6, -drop(i, BZ), BZ - 4], [g.x + 1.6, -drop(i, BZ), BZ - 4]];
        ctx.save(); ctx.shadowColor = RING; ctx.shadowBlur = 8 * k; path(outline); ctx.lineJoin = "round"; ctx.lineWidth = 3; ctx.strokeStyle = RING; ctx.stroke(); ctx.restore();
      }
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, nextDemo = 900, t0 = 0, step = 0;
    const select = (i: number) => { if (valueRef.current !== i) { valueRef.current = i; setValue(i); } };
    const settle = () => { s.p = keys.map((_, i) => (i === valueRef.current ? 1 : 0)); s.v = keys.map(() => 0); draw(); };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      if (now - touched > 5000 && t > nextDemo && !s.drag) { select(DEMO[step++ % DEMO.length]); nextDemo = t + 1500; }
      keys.forEach((_, i) => {
        const to = i === valueRef.current ? 1 : i === s.hover ? 0.14 : 0, down = to > s.p[i];
        // Going down a key is pushed and stops dead on its felt. Coming up it is thrown by its own weight and settles.
        for (let n = 0; n < 3; n++) {
          s.v[i] += ((down ? 1300 : 560) * (to - s.p[i]) - (down ? 34 : 21) * s.v[i]) * (dt / 3); s.p[i] += s.v[i] * (dt / 3);
          if (s.p[i] > 1) { s.p[i] = 1; s.v[i] *= -0.22; }
        }
      });
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    api.current = {
      go: (i) => { touched = performance.now(); select(i); tone(i); if (reduce) settle(); else wake(); },
      focus: (i) => { s.focus = i; if (reduce) draw(); },
    };

    const fit = () => { k = (cv.clientWidth / CW) * dpr; cv.width = Math.round(CW * k); cv.height = Math.round(CH2 * k); draw(); };
    fit();
    if (reduce) settle(); else wake();
    const ro = new ResizeObserver(fit); ro.observe(cv);

    const inside = (x: number, y: number, vs: V[]) => {
      let hit = false;
      for (let a = 0, b = vs.length - 1; a < vs.length; b = a++) { const [xa, ya] = pt(vs[a]), [xb, yb] = pt(vs[b]); if (ya > y !== yb > y && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) hit = !hit; }
      return hit;
    };
    const at = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect(), x = ((e.clientX - b.left) / b.width) * CW, y = ((e.clientY - b.top) / b.height) * CH2;
      for (let i = 0; i < keys.length; i++) { const g = layout[i]; if (keys[i].sharp && inside(x, y, [[g.x - BW, 0, BZ], [g.x + BW, 0, BZ], [g.x + BT, BH, LEN], [g.x - BT, BH, LEN]])) return i; }
      for (let i = 0; i < keys.length; i++) { const g = layout[i]; if (!keys[i].sharp && inside(x, y, [[g.x, -24, 0], [g.x + WK, -24, 0], [g.x + WK, 0, LEN], [g.x, 0, LEN]])) return i; }
      return -1;
    };
    const onDown = (e: PointerEvent) => {
      const i = at(e); if (i < 0) return;
      s.drag = true; s.hover = -1; box.setPointerCapture(e.pointerId); api.current?.go(i);
    };
    const onMove = (e: PointerEvent) => {
      const i = at(e);
      if (s.drag) { if (i >= 0 && i !== valueRef.current) api.current?.go(i); return; } // slide across the keys like a glissando
      if (e.pointerType === "mouse" && i !== s.hover) { s.hover = i; touched = Math.max(touched, performance.now() - 3500); }
    };
    const onUp = () => { s.drag = false; };
    const onLeave = () => { s.hover = -1; };
    box.addEventListener("pointerdown", onDown); box.addEventListener("pointermove", onMove);
    box.addEventListener("pointerup", onUp); box.addEventListener("pointercancel", onUp); box.addEventListener("pointerleave", onLeave);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect();
      box.removeEventListener("pointerdown", onDown); box.removeEventListener("pointermove", onMove);
      box.removeEventListener("pointerup", onUp); box.removeEventListener("pointercancel", onUp); box.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const choose = (i: number) => { valueRef.current = i; setValue(i); api.current?.go(i); };
  const onKey = (e: ReactKeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowUp" ? (i + 1) % keys.length : e.key === "ArrowLeft" || e.key === "ArrowDown" ? (i + keys.length - 1) % keys.length : e.key === "Home" ? 0 : e.key === "End" ? keys.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault(); choose(next); radios.current[next]?.focus();
  };
  const pc = (n: number) => `${n * 100}%`;

  return (
    <div className="flex min-h-[600px] w-full flex-col items-center justify-center overflow-hidden bg-[#a9472f] bg-[radial-gradient(110%_80%_at_50%_34%,#c25a3c_0%,#a9472f_55%,#933a25_100%)] px-2 py-10 sm:min-h-[780px]">
      <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ffe9dc] sm:mb-4">Key signature</p>
      <div ref={wrap} className="relative aspect-[600/640] w-full max-w-[590px] touch-pan-y select-none">
        <canvas ref={canvas} aria-hidden="true" className="absolute left-[-10%] top-0 h-full w-[120%] max-w-none" />
        <div role="radiogroup" aria-label="Key signature" className="absolute left-[-10%] top-0 h-full w-[120%]">
          {keys.map((key, i) => (
            <button
              key={key.label}
              ref={(el) => { radios.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={value === i}
              aria-label={`${key.label} major, ${key.note.toLowerCase()}`}
              tabIndex={value === i ? 0 : -1}
              onClick={() => choose(i)}
              onKeyDown={(e) => onKey(e, i)}
              onFocus={(e) => api.current?.focus(e.currentTarget.matches(":focus-visible") ? i : -1)}
              onBlur={() => api.current?.focus(-1)}
              style={{ left: pc(boxes[i].left), top: pc(boxes[i].top), width: pc(boxes[i].width), height: pc(boxes[i].height) }}
              className={`absolute cursor-pointer bg-transparent outline-none ${key.sharp ? "z-10" : ""}`}
            />
          ))}
        </div>
      </div>
      <p aria-live="polite" className="mt-1 min-h-[20px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-[#ffd9c7] sm:mt-3">
        <span className="font-semibold text-white">{keys[value].label} major</span>
        <span className="mx-2 text-[#f0a98d]">/</span>
        {keys[value].note}
      </p>
    </div>
  );
}

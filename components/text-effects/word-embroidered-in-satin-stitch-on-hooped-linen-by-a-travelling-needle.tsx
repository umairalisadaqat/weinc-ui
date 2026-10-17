import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";

// What gets stitched, and the colour of the floss for each. Keep each one short enough for the hoop.
const pieces = [
  { text: "hello", thread: "#d4362c" },
  { text: "take care", thread: "#1e4fb8" },
  { text: "slowly", thread: "#e0a019" },
];

/** The undyed linen. Every weave thread, fold and shadow is mixed from this one colour. */
const LINEN = "#e6dbc4";
/** Angle of the stitches in radians. Zero lays them flat, a negative value tips them up to the right. */
const SLANT = -0.52;
/** Seconds to stitch a whole word. */
const PACE = 5;

type Stitch = { x0: number; y0: number; x1: number; y1: number; tone: number; band: number };

function parse(hex: string) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function mix(hex: string, k: number, toward = 0) {
  const [r, g, b] = parse(hex);
  const f = (c: number) => Math.round(Math.min(255, Math.max(0, toward ? c + (255 - c) * k : c * k)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function rand(n: number) {
  const s = Math.sin(n * 91.7 + 13.3) * 43758.5453;
  return s - Math.floor(s);
}

export default function WordEmbroideredInSatinStitchOnHoopedLinenByATravellingNeedle() {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const lampAim = useRef({ x: 0.3, y: 0.2, at: -1e6 });
  const skip = useRef(0);
  const redraw = useRef<() => void>(() => {});
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = stage.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const make = () => document.createElement("canvas");
    const base = make();
    const shadows = make();
    const threads = make();
    let W = 0;
    let H = 0;
    let ratio = 1;
    let cx = 0;
    let cy = 0;
    let rx = 0;
    let ry = 0;
    let stitches: Stitch[] = [];
    let bandWidth = 12;
    let drawn = 0;
    let current = 0;
    let phaseStart = performance.now();
    let headStart = 0.56;
    let raf = 0;
    let visible = true;
    let seenSkip = skip.current;
    const lamp = { x: 0.3, y: 0.2 };
    const needle = { x: 0, y: 0, lift: 0, ready: false };

    const oval = (c: CanvasRenderingContext2D, a: number, b: number) => {
      c.beginPath();
      c.ellipse(cx, cy, a, b, 0, 0, Math.PI * 2);
    };

    const buildBase = () => {
      base.width = cv.width;
      base.height = cv.height;
      const c = base.getContext("2d")!;
      c.setTransform(ratio, 0, 0, ratio, 0, 0);
      // One small square of plain weave: each thread goes over one and under the next.
      const tile = make();
      const cell = 3;
      tile.width = tile.height = 96 * ratio;
      const t = tile.getContext("2d")!;
      t.scale(ratio, ratio);
      t.fillStyle = mix(LINEN, 0.86);
      t.fillRect(0, 0, 96, 96);
      for (let j = 0; j < 32; j++) {
        for (let i = 0; i < 32; i++) {
          const over = (i + j) % 2 === 0;
          const tone = 0.95 + rand(i * 17.3 + j * 5.9) * 0.07;
          t.fillStyle = mix(LINEN, tone);
          if (over) t.fillRect(i * cell - 0.6, j * cell + 0.35, cell + 1.2, cell - 0.7);
          else t.fillRect(i * cell + 0.35, j * cell - 0.6, cell - 0.7, cell + 1.2);
          t.fillStyle = "rgba(255,255,255,0.16)";
          if (over) t.fillRect(i * cell, j * cell + 0.5, cell, 0.7);
          else t.fillRect(i * cell + 0.5, j * cell, 0.7, cell);
        }
      }
      c.fillStyle = c.createPattern(tile, "repeat")!;
      c.save();
      c.scale(1 / ratio, 1 / ratio);
      c.fillRect(0, 0, cv.width, cv.height);
      c.restore();
      // Linen is uneven: thick places in single threads, and broad patches a shade off.
      for (let i = 0; i < (W * H) / 2600; i++) {
        const x = rand(i * 3.1) * W;
        const y = rand(i * 7.7 + 1) * H;
        const len = 6 + rand(i * 1.9) * rand(i * 4.3) * 46;
        c.fillStyle = rand(i * 5.3) > 0.5 ? "rgba(255,250,235,0.1)" : "rgba(90,66,30,0.05)";
        const across = rand(i * 9.1) > 0.5;
        c.fillRect(Math.round(x / cell) * cell, Math.round(y / cell) * cell, across ? len : cell - 0.8, across ? cell - 0.8 : len);
      }
      for (let i = 0; i < 26; i++) {
        const x = rand(i * 11.3) * W;
        const y = rand(i * 4.9 + 2) * H;
        const r = 120 + rand(i * 2.3) * 260;
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, i % 2 ? "rgba(255,248,230,0.09)" : "rgba(92,66,30,0.06)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = g;
        c.fillRect(x - r, y - r, r * 2, r * 2);
      }
      // Loose cloth outside the hoop lies in soft folds.
      c.save();
      oval(c, rx + 24, ry + 24);
      c.rect(0, 0, W, H);
      c.clip("evenodd");
      c.fillStyle = "rgba(70,48,20,0.07)";
      c.fillRect(0, 0, W, H);
      for (let i = 0; i < 7; i++) {
        const a = -0.9 + rand(i * 3.7) * 0.5 + (i % 2 ? 1.9 : 0);
        const ox = rand(i * 8.1) * W;
        const oy = rand(i * 2.9) * H;
        const g = c.createLinearGradient(ox, oy, ox + Math.cos(a) * 280, oy + Math.sin(a) * 280);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(0.4, "rgba(60,40,14,0.1)");
        g.addColorStop(0.6, "rgba(255,250,236,0.12)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
      }
      c.restore();

      // The hoop's shadow on the cloth.
      c.save();
      c.shadowColor = "rgba(58,38,14,0.5)";
      c.shadowBlur = 22;
      c.shadowOffsetX = 7 * ratio;
      c.shadowOffsetY = 13 * ratio;
      oval(c, rx + 13, ry + 13);
      c.lineWidth = 24;
      c.strokeStyle = "#8f6a3c";
      c.stroke();
      c.restore();
      // Inside the ring the cloth is drum tight: lighter in the middle, shaded under the wood.
      c.save();
      oval(c, rx, ry);
      c.clip();
      const tight = c.createRadialGradient(cx - rx * 0.2, cy - ry * 0.25, 0, cx, cy, rx);
      tight.addColorStop(0, "rgba(255,251,240,0.2)");
      tight.addColorStop(1, "rgba(255,251,240,0)");
      c.fillStyle = tight;
      c.fillRect(0, 0, W, H);
      c.shadowColor = "rgba(50,32,10,0.55)";
      c.shadowBlur = 16;
      c.shadowOffsetX = 3 * ratio;
      c.shadowOffsetY = 6 * ratio;
      oval(c, rx + 6, ry + 6);
      c.lineWidth = 12;
      c.strokeStyle = "#7c5a30";
      c.stroke();
      c.restore();

      // Two beech rings: the outer one is split at the top and drawn shut by a brass screw.
      const wood = (a: number, b: number, width: number, light: string, dark: string) => {
        const g = c.createLinearGradient(cx - a, cy - b, cx + a, cy + b);
        g.addColorStop(0, light);
        g.addColorStop(0.5, mix(light, 0.9));
        g.addColorStop(1, dark);
        oval(c, a, b);
        c.lineWidth = width;
        c.strokeStyle = g;
        c.stroke();
        c.lineWidth = 0.8;
        c.strokeStyle = "rgba(70,44,16,0.55)";
        oval(c, a + width / 2, b + width / 2);
        c.stroke();
        oval(c, a - width / 2, b - width / 2);
        c.stroke();
        // Grain follows the bend of the ring.
        for (let i = 0; i < 90; i++) {
          const off = (rand(i * 5.1 + a) - 0.5) * (width - 2);
          const from = rand(i * 2.7 + a) * Math.PI * 2;
          c.beginPath();
          c.ellipse(cx, cy, a + off, b + off, 0, from, from + 0.25 + rand(i * 8.3) * 1.1);
          c.lineWidth = 0.5 + rand(i * 3.9) * 0.7;
          c.strokeStyle = rand(i * 6.1) > 0.4 ? "rgba(96,62,24,0.2)" : "rgba(255,240,208,0.22)";
          c.stroke();
        }
        // A rounded edge catches the light along its upper left.
        c.beginPath();
        c.ellipse(cx, cy, a + width / 2 - 1.6, b + width / 2 - 1.6, 0, Math.PI * 0.95, Math.PI * 1.7);
        c.lineWidth = 1.4;
        c.strokeStyle = "rgba(255,246,222,0.6)";
        c.stroke();
      };
      wood(rx + 16, ry + 16, 18, "#e8ca98", "#ad8048");
      wood(rx + 2.5, ry + 2.5, 9, "#dcbb86", "#a27640");
      // The clamp.
      const top = cy - ry - 25;
      c.fillStyle = mix(LINEN, 0.9);
      c.fillRect(cx - 3, top - 2, 6, 20);
      for (const side of [-1, 1]) {
        const g = c.createLinearGradient(0, top - 16, 0, top + 6);
        g.addColorStop(0, "#ecd09f");
        g.addColorStop(1, "#b38a52");
        c.fillStyle = g;
        c.beginPath();
        c.roundRect(cx + side * 3 - (side < 0 ? 17 : 0), top - 22, 17, 31, 3);
        c.fill();
        c.strokeStyle = "rgba(70,44,16,0.6)";
        c.lineWidth = 0.8;
        c.stroke();
      }
      const brass = c.createLinearGradient(0, top - 15, 0, top - 2);
      brass.addColorStop(0, "#fff3c2");
      brass.addColorStop(0.35, "#e0b950");
      brass.addColorStop(1, "#8a6a1e");
      c.fillStyle = brass;
      c.fillRect(cx - 32, top - 12, 68, 7);
      c.beginPath();
      c.roundRect(cx - 38, top - 15.5, 7, 14, 2);
      c.fill();
      c.beginPath();
      c.roundRect(cx + 26, top - 18, 19, 19, 2.5);
      c.fill();
      c.fillStyle = "rgba(80,56,10,0.45)";
      for (let i = 0; i < 7; i++) c.fillRect(cx + 28 + i * 2.5, top - 17.5, 1, 18);
      c.fillStyle = "rgba(255,250,220,0.7)";
      c.fillRect(cx - 32, top - 11.2, 58, 1);
    };

    const buildStitches = () => {
      const piece = pieces[current % pieces.length];
      const words = W < 640 && piece.text.includes(" ") ? piece.text.split(" ") : [piece.text];
      const mw = Math.ceil(rx * 2);
      const mh = Math.ceil(ry * 2);
      const m = make();
      m.width = mw;
      m.height = mh;
      const c = m.getContext("2d", { willReadFrequently: true })!;
      const face = (px: number) => `italic 700 ${px}px Georgia, "Times New Roman", serif`;
      let px = Math.min(ry * (words.length > 1 ? 0.62 : 0.92), 240);
      c.font = face(px);
      const widest = Math.max(...words.map((w) => c.measureText(w).width));
      px *= Math.min(1, (rx * (words.length > 1 ? 1.36 : 1.6)) / widest);
      c.font = face(px);
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.lineJoin = "round";
      c.lineWidth = Math.max(2, px * 0.03);
      const lead = px * 0.92;
      words.forEach((w, i) => {
        const y = mh / 2 + (i - (words.length - 1) / 2) * lead - px * 0.03;
        c.fillText(w, mw / 2, y);
        c.strokeText(w, mw / 2, y);
      });
      const data = c.getImageData(0, 0, mw, mh).data;
      const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < mw && y < mh && data[((y | 0) * mw + (x | 0)) * 4 + 3] > 110;

      const dx = Math.cos(SLANT);
      const dy = Math.sin(SLANT);
      const gap = 2.05;
      const longest = Math.max(15, px * 0.16);
      const reach = Math.hypot(mw, mh) / 2;
      const ox = cx - rx;
      const oy = cy - ry;
      bandWidth = Math.max(8, px * 0.09);
      const list: (Stitch & { row: number })[] = [];
      let row = 0;
      for (let k = -reach; k < reach; k += gap, row++) {
        const lx = mw / 2 - dy * k;
        const ly = mh / 2 + dx * k;
        let start = NaN;
        for (let t = -reach; t <= reach; t += 1) {
          const hit = inside(lx + dx * t, ly + dy * t);
          if (hit && Number.isNaN(start)) start = t;
          if (!hit && !Number.isNaN(start)) {
            const length = t - 1 - start;
            if (length >= 1.5) {
              // A long run is laid as several stitches, with the joins staggered row to row like bricks.
              const parts = Math.ceil(length / longest);
              const each = length / parts;
              const shift = parts > 1 ? (((row % 3) - 1) / 3) * each * 0.8 : 0;
              for (let j = 0; j < parts; j++) {
                const a = start + j * each + (j > 0 ? shift : 0) - 1.6;
                const b = start + (j + 1) * each + (j < parts - 1 ? shift : 0) + 1.6;
                const n = list.length;
                const x0 = ox + lx + dx * a + (rand(n) - 0.5) * 0.7;
                const y0 = oy + ly + dy * a + (rand(n + 0.3) - 0.5) * 0.7;
                const x1 = ox + lx + dx * b + (rand(n + 0.6) - 0.5) * 0.7;
                const y1 = oy + ly + dy * b + (rand(n + 0.9) - 0.5) * 0.7;
                list.push({ x0, y0, x1, y1, tone: 0.84 + rand(n * 1.7) * 0.2, band: Math.floor(((x0 + x1) / 2 - ox) / bandWidth), row });
              }
            }
            start = NaN;
          }
        }
      }
      // The needle works along the word, a narrow band at a time, filling each band from the top down.
      list.sort((p, q) => p.band - q.band || p.row - q.row);
      stitches = list;
      for (const layer of [shadows, threads]) {
        layer.width = cv.width;
        layer.height = cv.height;
      }
      drawn = 0;
    };

    const lay = (from: number, to: number) => {
      const piece = pieces[current % pieces.length];
      const s = shadows.getContext("2d")!;
      const t = threads.getContext("2d")!;
      for (const c of [s, t]) {
        c.setTransform(ratio, 0, 0, ratio, 0, 0);
        c.lineCap = "round";
      }
      s.strokeStyle = "rgba(64,40,14,0.2)";
      s.lineWidth = 3.6;
      for (let i = from; i < to; i++) {
        const q = stitches[i];
        s.beginPath();
        s.moveTo(q.x0 + 1.5, q.y0 + 2.4);
        s.lineTo(q.x1 + 1.5, q.y1 + 2.4);
        s.stroke();
        // A strand of floss is a small cylinder: dark underneath, its own colour, then a pale ridge.
        t.strokeStyle = mix(piece.thread, 0.6 * q.tone);
        t.lineWidth = 2.9;
        t.beginPath();
        t.moveTo(q.x0, q.y0);
        t.lineTo(q.x1, q.y1);
        t.stroke();
        t.strokeStyle = mix(piece.thread, q.tone);
        t.lineWidth = 2;
        t.beginPath();
        t.moveTo(q.x0 - 0.25, q.y0 - 0.35);
        t.lineTo(q.x1 - 0.25, q.y1 - 0.35);
        t.stroke();
        t.strokeStyle = mix(piece.thread, 0.2 + (q.tone - 0.84), 1);
        t.lineWidth = 0.8;
        t.beginPath();
        t.moveTo(q.x0 * 0.9 + q.x1 * 0.1 - 0.55, q.y0 * 0.9 + q.y1 * 0.1 - 0.65);
        t.lineTo(q.x0 * 0.1 + q.x1 * 0.9 - 0.55, q.y0 * 0.1 + q.y1 * 0.9 - 0.65);
        t.stroke();
      }
    };
    /** Pull out everything from stitch number `keep` on: the band it sits in and every band to its right. */
    const unpick = (keep: number) => {
      const edge = keep <= 0 ? 0 : cx - rx + stitches[Math.min(keep, stitches.length - 1)].band * bandWidth - 2;
      for (const layer of [shadows, threads]) {
        const c = layer.getContext("2d")!;
        c.setTransform(ratio, 0, 0, ratio, 0, 0);
        c.clearRect(edge, 0, W, H);
      }
    };

    const drawNeedle = (x: number, y: number, lift: number, thread: string, tx: number, ty: number) => {
      const length = Math.min(165, rx * 0.5);
      const angle = -0.95;
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      // lift 0: the needle is deep in the cloth with only its top half showing. lift 1: nearly all of it is out.
      const out = length * (0.42 + 0.55 * lift);
      const ex = x + ux * out;
      const ey = y + uy * out;
      const nx = -uy;
      const ny = ux;
      const shape = (offX: number, offY: number) => {
        ctx.beginPath();
        ctx.moveTo(x + offX, y + offY);
        ctx.lineTo(x + ux * out * 0.3 + nx * 2 + offX, y + uy * out * 0.3 + ny * 2 + offY);
        ctx.lineTo(ex + nx * 2.7 + offX, ey + ny * 2.7 + offY);
        ctx.quadraticCurveTo(ex + ux * 3 + offX, ey + uy * 3 + offY, ex - nx * 2.7 + offX, ey - ny * 2.7 + offY);
        ctx.lineTo(x + ux * out * 0.3 - nx * 2 + offX, y + uy * out * 0.3 - ny * 2 + offY);
        ctx.closePath();
      };
      ctx.save();
      ctx.filter = "none";
      ctx.fillStyle = "rgba(50,32,10,0.26)";
      shape(5 + lift * 5, 8 + lift * 8);
      ctx.fill();
      // The working thread, from the last stitch up to the eye.
      const ix = ex - ux * 7;
      const iy = ey - uy * 7;
      ctx.lineCap = "round";
      ctx.strokeStyle = mix(thread, 0.6);
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo((tx + ix) / 2 + 26, (ty + iy) / 2 + 18, ix, iy);
      ctx.stroke();
      ctx.strokeStyle = mix(thread, 1);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(tx - 0.3, ty - 0.4);
      ctx.quadraticCurveTo((tx + ix) / 2 + 25.6, (ty + iy) / 2 + 17.5, ix - 0.3, iy - 0.4);
      ctx.stroke();
      const steel = ctx.createLinearGradient(x + nx * 2.7, y + ny * 2.7, x - nx * 2.7, y - ny * 2.7);
      steel.addColorStop(0, "#6b7078");
      steel.addColorStop(0.45, "#f7f8fa");
      steel.addColorStop(0.7, "#aeb3bb");
      steel.addColorStop(1, "#565a62");
      ctx.fillStyle = steel;
      shape(0, 0);
      ctx.fill();
      ctx.strokeStyle = "rgba(34,38,46,0.8)";
      ctx.lineWidth = 0.7;
      ctx.stroke();
      // The eye, with the thread through it.
      ctx.strokeStyle = "rgba(30,32,38,0.85)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ex - ux * 4.5, ey - uy * 4.5);
      ctx.lineTo(ex - ux * 11, ey - uy * 11);
      ctx.stroke();
      // Where it enters the cloth.
      ctx.fillStyle = "rgba(40,24,6,0.45)";
      ctx.beginPath();
      ctx.ellipse(x, y, 2, 1.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const paint = (stamp: number) => {
      if (!W) return;
      const piece = pieces[current % pieces.length];
      const total = stitches.length;
      const t = (stamp - phaseStart) / 1000;
      const hold = 4.2;
      const pull = 0.9;
      let amount = 1;
      let pulling = false;
      if (!reduce) {
        amount = Math.min(1, headStart + t / PACE);
        const after = t - (1 - headStart) * PACE - hold;
        if (after > 0) {
          pulling = true;
          amount = Math.max(0, 1 - after / pull);
          amount *= amount;
        }
        if (after > pull + 0.35 || seenSkip !== skip.current) {
          seenSkip = skip.current;
          current += 1;
          setIndex(current % pieces.length);
          headStart = 0;
          phaseStart = stamp;
          buildStitches();
          return paint(stamp);
        }
      }
      const want = Math.round(total * amount);
      if (want > drawn) lay(drawn, want);
      else if (want < drawn) unpick(want);
      drawn = want;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "copy";
      ctx.drawImage(base, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(shadows, 0, 0);
      ctx.drawImage(threads, 0, 0);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      // Satin sheen: every stitch arches over the cloth, so each shows one bright stretch, and where that falls depends on the lamp.
      const idle = stamp - lampAim.current.at > 2400;
      const ax = idle && !reduce ? Math.sin(stamp / 1900) * 0.75 : lampAim.current.x;
      const ay = idle && !reduce ? Math.cos(stamp / 2600) * 0.6 : lampAim.current.y;
      lamp.x += (ax - lamp.x) * (reduce ? 1 : 0.08);
      lamp.y += (ay - lamp.y) * (reduce ? 1 : 0.08);
      const ux = Math.cos(SLANT);
      const uy = Math.sin(SLANT);
      const lx = cx + lamp.x * rx * 1.3;
      const ly = cy + lamp.y * ry * 1.3;
      ctx.lineCap = "round";
      for (let pass = 0; pass < 2; pass++) {
        ctx.beginPath();
        for (let i = 0; i < drawn; i++) {
          const q = stitches[i];
          const mx = (q.x0 + q.x1) / 2;
          const my = (q.y0 + q.y1) / 2;
          const pullTo = Math.max(-1, Math.min(1, ((lx - mx) * ux + (ly - my) * uy) / (rx * 0.9)));
          const mid = 0.5 + pullTo * 0.3;
          const half = pass ? 0.11 : 0.24;
          const a = Math.max(0.08, mid - half);
          const b = Math.min(0.92, mid + half);
          ctx.moveTo(q.x0 + (q.x1 - q.x0) * a - 0.4, q.y0 + (q.y1 - q.y0) * a - 0.5);
          ctx.lineTo(q.x0 + (q.x1 - q.x0) * b - 0.4, q.y0 + (q.y1 - q.y0) * b - 0.5);
        }
        ctx.strokeStyle = pass ? "rgba(255,255,255,0.36)" : "rgba(255,255,255,0.08)";
        ctx.lineWidth = pass ? 0.9 : 1.7;
        ctx.stroke();
      }
      // The lamp also warms the cloth nearest to it.
      const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, rx * 1.2);
      glow.addColorStop(0, "rgba(255,248,226,0.16)");
      glow.addColorStop(1, "rgba(255,248,226,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // The needle follows the newest stitch, then parks beside the word.
      const head = stitches[Math.max(0, Math.min(total - 1, drawn - 1))];
      const working = !reduce && !pulling && drawn < total && drawn > 0;
      const restX = cx + rx * 0.62;
      const restY = cy + ry * 0.52;
      const goX = working && head ? head.x1 : restX;
      const goY = working && head ? head.y1 : restY;
      if (!needle.ready || reduce) {
        needle.x = goX;
        needle.y = goY;
        needle.ready = true;
      }
      needle.x += (goX - needle.x) * 0.3;
      needle.y += (goY - needle.y) * 0.3;
      const goLift = working ? 0.5 + 0.5 * Math.sin(stamp / 70) : 0.25;
      needle.lift += (goLift - needle.lift) * 0.25;
      const last = stitches[total - 1];
      const tail = working || !last || drawn < total ? { x: needle.x, y: needle.y } : { x: last.x1, y: last.y1 };
      if (total) drawNeedle(needle.x, needle.y, needle.lift, piece.thread, tail.x, tail.y);
    };

    const resize = () => {
      W = el.clientWidth;
      H = el.clientHeight;
      if (!W || !H) return;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * ratio);
      cv.height = Math.round(H * ratio);
      cx = W / 2;
      cy = H * 0.47;
      rx = Math.min(W * 0.5 - 30, 340);
      ry = W < 640 ? rx : rx * 0.74;
      buildBase();
      const keep = drawn && stitches.length ? drawn / stitches.length : 0;
      buildStitches();
      if (keep) {
        drawn = Math.round(stitches.length * keep);
        lay(0, drawn);
      }
      needle.ready = false;
      paint(performance.now());
    };

    const loop = (stamp: number) => {
      paint(stamp);
      raf = visible && !document.hidden && !reduce ? requestAnimationFrame(loop) : 0;
    };
    const wake = () => {
      if (!raf && visible && !document.hidden && !reduce) raf = requestAnimationFrame(loop);
    };
    redraw.current = () => {
      if (!reduce) return;
      if (seenSkip !== skip.current) {
        seenSkip = skip.current;
        current += 1;
        setIndex(current % pieces.length);
        buildStitches();
      }
      paint(performance.now());
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", wake);
    resize();
    wake();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
    };
  }, [reduce]);

  function aim(e: ReactPointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    lampAim.current = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1, at: performance.now() };
    redraw.current();
  }
  function next() {
    skip.current += 1;
    redraw.current();
  }

  return (
    <section className="relative isolate flex min-h-[760px] w-full flex-col items-center overflow-hidden px-4" style={{ backgroundColor: LINEN }}>
      <div ref={stage} onPointerMove={aim} onPointerDown={aim} className="absolute inset-0 touch-pan-y">
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      </div>
      <h2 className="sr-only" aria-live="polite">
        {pieces[index].text}
      </h2>

      <div className="pointer-events-none relative mt-auto flex w-full max-w-[880px] items-center justify-between gap-4 pb-8 text-[13px]">
        <p className="rounded-full bg-[#f3ebdb]/90 px-4 py-2.5 text-[#5b4526] shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_6px_14px_-8px_rgba(60,40,14,0.5)]">
          <span className="font-semibold text-[#2f2210]">Satin stitch</span>
          <span className="hidden sm:inline">
            <span className="mx-2 opacity-50">/</span>
            move the lamp with your pointer
          </span>
        </p>
        <button
          type="button"
          onClick={next}
          className="pointer-events-auto min-h-[40px] shrink-0 rounded-full bg-[#2f2210] px-5 font-medium text-[#f6efe0] shadow-[0_10px_20px_-10px_rgba(47,34,16,0.8)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f2210] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e6dbc4]"
        >
          Unpick and restitch
        </button>
      </div>
    </section>
  );
}

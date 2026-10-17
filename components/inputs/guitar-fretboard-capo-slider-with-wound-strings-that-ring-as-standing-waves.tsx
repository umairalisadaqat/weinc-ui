import { useEffect, useRef, useState } from "react";

// The capo can sit behind any of these frets. `sounds` is the key that G chord shapes come out in.
const stops = [
  { fret: 1, name: "1st fret", sounds: "A flat" },
  { fret: 2, name: "2nd fret", sounds: "A" },
  { fret: 3, name: "3rd fret", sounds: "B flat" },
  { fret: 4, name: "4th fret", sounds: "B" },
  { fret: 5, name: "5th fret", sounds: "C" },
  { fret: 6, name: "6th fret", sounds: "D flat" },
  { fret: 7, name: "7th fret", sounds: "D" },
];
const START = 1; // index into `stops` on load
const DEMO = [3, 1, 4, 2]; // where the idle demo moves the capo
const SOUND_ON = false; // set to true to hear each string when it is plucked or strummed
const BRASS = "#d9a441"; // the thumbscrew on the capo and the focus ring
const GAUGE = [1.8, 1.45, 1.15, 0.85, 0.56, 0.46]; // string widths in millimetres, low E first
const WOUND = 4; // how many of them are bronze wound

// Everything is measured in millimetres along a 648 mm scale, with 0 at the nut.
const SCALE = 648, X_LEFT = -24, X_RIGHT = 232, X_END = 520;
const fretX = (n: number) => SCALE * (1 - Math.pow(2, -n / 12));
const capoX = (i: number) => fretX(stops[i].fret) - 8.5;
const halfWidth = (x: number) => 21.5 + (Math.max(0, x) / 324) * 4.6;
const stringY = (i: number, x: number) => (2.5 - i) * (x >= 0 ? 7 + (x / 324) * 1.7 : 7 - x * 0.028);
const OPEN = [82.41, 110, 146.83, 196, 246.94, 329.63];

let audio: AudioContext | null = null;
const twang = (i: number, fret: number, loud: number) => {
  if (!SOUND_ON || typeof window === "undefined") return;
  audio = audio || new AudioContext();
  const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
  o.type = "triangle"; o.frequency.value = OPEN[i] * Math.pow(2, fret / 12);
  g.gain.setValueAtTime(0.1 * Math.min(1, loud), t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
  o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + 1.4);
};

export default function GuitarFretboardCapoSlider() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(START);
  const valueRef = useRef(START);
  const api = useRef<{ go: (i: number, user: boolean) => void; focus: (on: boolean) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, grip = handle.current;
    if (!cv || !grip) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const base = document.createElement("canvas");
    let c: CanvasRenderingContext2D = ctx, w = 1, h = 1, sc = 3, th = -0.15, mx = 0, my = 0;
    const XMID = (X_LEFT + X_RIGHT) / 2;
    const s = { x: capoX(START), v: 0, to: capoX(START), lift: 0, drag: false, strum: false, focus: false, amp: GAUGE.map(() => 0), over: GAUGE.map(() => 0), ph: GAUGE.map((_, i) => i * 1.7), queue: [] as { at: number; i: number; a: number }[] };

    const neck = () => { c.setTransform(dpr, 0, 0, dpr, 0, 0); c.translate(mx, my); c.rotate(th); c.scale(sc, sc); c.translate(-XMID, 0); };
    const toNeck = (px: number, py: number) => { const dx = px - mx, dy = py - my, co = Math.cos(-th), si = Math.sin(-th); return [(dx * co - dy * si) / sc + XMID, (dx * si + dy * co) / sc]; };
    const toScreen = (x: number, y: number) => { const dx = (x - XMID) * sc, dy = y * sc, co = Math.cos(th), si = Math.sin(th); return [mx + dx * co - dy * si, my + dx * si + dy * co]; };
    const lin = (x0: number, y0: number, x1: number, y1: number, stops2: [number, string][]) => { const g = c.createLinearGradient(x0, y0, x1, y1); for (const [o, col] of stops2) g.addColorStop(o, col); return g; };
    const rr = (x: number, y: number, ww: number, hh: number, r: number) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + ww, y, x + ww, y + hh, r); c.arcTo(x + ww, y + hh, x, y + hh, r); c.arcTo(x, y + hh, x, y, r); c.arcTo(x, y, x + ww, y, r); c.closePath(); };
    const board = () => { c.beginPath(); c.moveTo(0, -halfWidth(0)); c.lineTo(X_END, -halfWidth(X_END)); c.lineTo(X_END, halfWidth(X_END)); c.lineTo(0, halfWidth(0)); c.closePath(); };
    const head = () => { c.beginPath(); c.moveTo(0.2, -21.8); c.lineTo(-16, -23.4); c.lineTo(-40, -31); c.lineTo(-140, -37); c.lineTo(-140, 37); c.lineTo(-40, 31); c.lineTo(-16, 23.4); c.lineTo(0.2, 21.8); c.closePath(); };
    // The lamp is up and to the left of the screen, so shadows fall down and right whatever angle the neck lies at.
    const fall = (mm: number) => { const co = Math.cos(-th), si = Math.sin(-th), sx = 0.42 * mm, sy = 0.78 * mm; return [sx * co - sy * si, sx * si + sy * co]; };

    const paintBase = () => {
      c = base.getContext("2d") as CanvasRenderingContext2D;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, base.width, base.height);
      neck();
      for (const [blur, dx, dy, a] of [[34, 12, 26, 0.34], [7, 3, 6, 0.42]]) {
        c.save(); c.shadowColor = `rgba(38,44,28,${a})`; c.shadowBlur = blur * dpr; c.shadowOffsetX = dx * dpr; c.shadowOffsetY = dy * dpr; c.fillStyle = "#2a1a10";
        board(); c.fill(); head(); c.fill(); c.restore();
      }
      // Headstock: gloss black face with a cream line round it and the little cover over the truss rod.
      head(); c.fillStyle = lin(-140, -40, -10, 30, [[0, "#0d0d0e"], [0.38, "#1a1b1d"], [0.5, "#3a3c40"], [0.58, "#232427"], [1, "#0a0a0b"]]); c.fill();
      c.save(); c.clip(); head(); c.lineWidth = 2.4; c.strokeStyle = "#d8ccb0"; c.stroke(); head(); c.lineWidth = 1.5; c.strokeStyle = "#141416"; c.stroke(); c.restore();
      c.beginPath(); c.moveTo(-7, -4.6); c.lineTo(-23, -8.4); c.quadraticCurveTo(-35, -7, -35, 0); c.quadraticCurveTo(-35, 7, -23, 8.4); c.lineTo(-7, 4.6); c.closePath();
      c.fillStyle = "#070708"; c.fill(); c.lineWidth = 0.4; c.strokeStyle = "rgba(217,205,178,0.55)"; c.stroke();
      for (const sx of [-10, -31]) { c.beginPath(); c.arc(sx, 0, 1.15, 0, Math.PI * 2); c.fillStyle = lin(sx - 1, -1, sx + 1, 1, [[0, "#f1f2f4"], [1, "#6b6e73"]]); c.fill(); c.fillStyle = "rgba(0,0,0,0.7)"; c.fillRect(sx - 0.9, -0.14, 1.8, 0.28); }

      // Fretboard: dark rosewood, rounder than it looks, with long open grain.
      board(); c.fillStyle = lin(0, -26, 0, 26, [[0, "#22110a"], [0.24, "#45291b"], [0.42, "#573524"], [0.7, "#3b2216"], [1, "#1c0e08"]]); c.fill();
      c.save(); c.clip();
      let seed = 23;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let n = 0; n < 420; n++) {
        const x0 = rand() * X_END, y0 = (rand() - 0.5) * 60, len = 14 + rand() * 110, a = 0.05 + rand() * 0.2, light = rand() > 0.72;
        c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + len / 2, y0 + (rand() - 0.5) * 1.6, x0 + len, y0 + (rand() - 0.5) * 1.2);
        c.lineWidth = 0.1 + rand() * 0.3; c.strokeStyle = light ? `rgba(196,140,98,${a * 0.6})` : `rgba(14,5,1,${a})`; c.stroke();
      }
      for (let n = 0; n < 900; n++) { c.fillStyle = `rgba(10,3,0,${0.1 + rand() * 0.25})`; c.fillRect(rand() * X_END, (rand() - 0.5) * 60, 0.5 + rand() * 1.6, 0.14); }
      c.restore();
      // Cream binding down both edges.
      for (const sg of [-1, 1]) {
        c.beginPath(); c.moveTo(0, sg * halfWidth(0)); c.lineTo(X_END, sg * halfWidth(X_END)); c.lineTo(X_END, sg * (halfWidth(X_END) - 1.5)); c.lineTo(0, sg * (halfWidth(0) - 1.5)); c.closePath();
        c.fillStyle = sg < 0 ? "#f1e7cf" : "#cdbf9f"; c.fill();
        c.beginPath(); c.moveTo(0, sg * (halfWidth(0) - 1.5)); c.lineTo(X_END, sg * (halfWidth(X_END) - 1.5)); c.lineWidth = 0.22; c.strokeStyle = "rgba(10,5,0,0.7)"; c.stroke();
      }
      // Pearl position dots.
      for (const n of [3, 5, 7, 9, 15]) {
        const x = (fretX(n - 1) + fretX(n)) / 2, r = 3.1;
        c.beginPath(); c.arc(x, 0.3, r + 0.25, 0, Math.PI * 2); c.fillStyle = "rgba(8,3,0,0.6)"; c.fill();
        c.beginPath(); c.arc(x, 0, r, 0, Math.PI * 2);
        if (typeof c.createConicGradient === "function") {
          const g = c.createConicGradient(n * 1.3, x, 0);
          ["#f6f3ec", "#dfeaf2", "#f7e6ee", "#e3f1e4", "#fbf7ee", "#d9e3ef", "#f4e9d8", "#f6f3ec"].forEach((col, q, all) => g.addColorStop(q / (all.length - 1), col));
          c.fillStyle = g;
        } else c.fillStyle = "#efece4";
        c.fill();
        const gl = c.createRadialGradient(x, 0, 0.2, x, 0, r); gl.addColorStop(0, "rgba(255,255,255,0.9)"); gl.addColorStop(0.6, "rgba(255,255,255,0.15)"); gl.addColorStop(1, "rgba(120,110,90,0.12)");
        c.fillStyle = gl; c.fill();
      }
      // Fret wire: a rounded nickel bead with its shadow on the wood.
      const [fx, fy] = fall(1.3);
      for (let n = 1; fretX(n) < X_END; n++) {
        const x = fretX(n), hw = halfWidth(x) - 0.15;
        rr(x - 1.3 + fx, -hw + fy, 2.6, hw * 2, 1.2); c.fillStyle = "rgba(8,3,0,0.45)"; c.fill();
        rr(x - 1.3, -hw, 2.6, hw * 2, 1.2);
        c.fillStyle = lin(x - 1.3, 0, x + 1.3, 0, [[0, "#46484b"], [0.26, "#fbfbfc"], [0.42, "#d3d6da"], [0.7, "#8a8d92"], [1, "#35373a"]]); c.fill();
      }
      // Bone nut with a slot for each string.
      const hw0 = halfWidth(0) + 0.2;
      rr(-5.4 + fx, -hw0 + fy, 5.6, hw0 * 2, 0.9); c.fillStyle = "rgba(0,0,0,0.4)"; c.fill();
      rr(-5.4, -hw0, 5.6, hw0 * 2, 0.9); c.fillStyle = lin(-5.4, 0, 0.2, 0, [[0, "#c4b89c"], [0.35, "#faf5e6"], [0.7, "#ebe2cb"], [1, "#a99d81"]]); c.fill();
      GAUGE.forEach((g, i) => { c.fillStyle = "rgba(70,52,24,0.55)"; c.fillRect(-5.4, stringY(i, 0) - g / 2 - 0.15, 5.6, g + 0.3); });
      c = ctx;
    };

    // One string as a path. `k` scales how far it is pulled from rest at this instant.
    const trace = (i: number, k: number, from: number, to: number, oy = 0, ox = 0) => {
      const live = SCALE - s.x;
      c.beginPath();
      for (let x = from, first = true; x <= to + 0.01; x = x < 0 ? Math.min(0, x + 20) : x + 4, first = false) {
        const u = (x - s.x) / live, y = stringY(i, x) + oy + (u > 0 && k !== 0 ? k * (Math.sin(Math.PI * u) + 0.22 * s.over[i] * Math.sin(Math.PI * 3 * u)) : 0);
        if (first) c.moveTo(x + ox, y); else c.lineTo(x + ox, y);
      }
    };
    const paintString = (i: number, k: number, from: number, to: number, alpha: number) => {
      const g = GAUGE[i], wound = i < WOUND;
      c.globalAlpha = alpha; c.lineCap = "butt";
      trace(i, k, from, to); c.lineWidth = g; c.strokeStyle = wound ? "#3a2910" : "#4d5257"; c.stroke();
      trace(i, k, from, to); c.lineWidth = g * 0.7; c.strokeStyle = wound ? "#a8823f" : "#bfc5ca"; c.stroke();
      if (wound) { trace(i, k, from, to); c.setLineDash([0.3, 0.36]); c.lineWidth = g * 0.9; c.strokeStyle = "rgba(38,24,6,0.5)"; c.stroke(); c.setLineDash([]); }
      trace(i, k, from, to, -g * 0.17); c.lineWidth = g * 0.24; c.strokeStyle = wound ? "#f6e3ae" : "#ffffff"; c.stroke();
      c.globalAlpha = 1;
    };

    const draw = (now: number) => {
      c = ctx;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.drawImage(base, 0, 0);
      neck();
      const [hx, hy] = fall(2.4);
      GAUGE.forEach((g, i) => {
        trace(i, 0, -140, X_END, hy, hx); c.lineWidth = g * 1.15; c.strokeStyle = `rgba(10,4,0,${0.36 / (1 + s.amp[i] * 1.6)})`; c.stroke();
      });
      GAUGE.forEach((g, i) => {
        const a = s.amp[i];
        paintString(i, 0, -140, s.x, 1);
        if (a < 0.03) { paintString(i, 0, s.x, X_END, 1); return; }
        // A ringing string is a blur between its two extremes, with the string itself caught at a few instants inside it.
        const live = SCALE - s.x;
        c.beginPath();
        for (let x = s.x; x <= X_END; x += 4) { const u = (x - s.x) / live; const y = stringY(i, x) - a * Math.sin(Math.PI * u) - g / 2; if (x === s.x) c.moveTo(x, y); else c.lineTo(x, y); }
        for (let x = X_END; x >= s.x; x -= 4) { const u = (x - s.x) / live; c.lineTo(x, stringY(i, x) + a * Math.sin(Math.PI * u) + g / 2); }
        c.closePath(); c.fillStyle = i < WOUND ? `rgba(176,136,72,${0.2 + 0.1 / (1 + a)})` : `rgba(226,230,234,${0.26 + 0.1 / (1 + a)})`; c.fill();
        const ph = s.ph[i] + now * 0.001 * (38 + i * 9);
        paintString(i, a * Math.cos(ph), s.x, X_END, 0.5);
        paintString(i, a * Math.cos(ph + 2.2), s.x, X_END, 0.36);
        paintString(i, a * Math.cos(ph + 4.1), s.x, X_END, 0.3);
      });

      // The capo: a rubber-faced bar clamped across all six strings, with a knurled brass screw at the near end.
      const hw = halfWidth(s.x), lift = s.lift, [sx, sy] = fall(7 + lift * 9), top = -hw - 5.5, len = hw * 2 + 11, ky = hw + 13.5;
      const drop = (7 + lift * 9) * sc;
      c.save(); c.shadowColor = `rgba(8,3,0,${0.6 - lift * 0.2})`; c.shadowBlur = (8 + lift * 10) * dpr; c.shadowOffsetX = 0.42 * drop * dpr; c.shadowOffsetY = 0.78 * drop * dpr;
      c.fillStyle = "#0c0c0d"; rr(s.x - 6, top, 12, len + 6, 4); c.fill(); c.beginPath(); c.arc(s.x, ky, 9, 0, Math.PI * 2); c.fill(); c.restore();
      c.save(); c.translate(s.x, 0); c.scale(1 + lift * 0.035, 1 + lift * 0.035); c.translate(-s.x, 0);
      rr(s.x - 6.5, top + 1.4, 13, len - 2.8, 3); c.fillStyle = "#070708"; c.fill();
      c.fillStyle = "rgba(255,255,255,0.09)"; c.fillRect(s.x - 6.5, top + 3, 0.5, len - 6);
      c.beginPath(); c.arc(s.x, ky, 9.6, 0, Math.PI * 2); c.fillStyle = lin(s.x - 9.6, ky - 9.6, s.x + 9.6, ky + 9.6, [[0, "#5d5f66"], [0.4, "#232427"], [1, "#0a0a0b"]]); c.fill();
      rr(s.x - 5, top, 10, len + 9, 4.4); c.fillStyle = lin(s.x - 5, 0, s.x + 5, 0, [[0, "#101012"], [0.1, "#6c6e75"], [0.2, "#3a3b40"], [0.5, "#1c1d20"], [0.8, "#2b2c30"], [0.93, "#4a4b51"], [1, "#0c0c0d"]]); c.fill();
      c.fillStyle = lin(0, top, 0, top + len, [[0, "rgba(255,255,255,0.3)"], [0.18, "rgba(255,255,255,0)"], [0.8, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,0.3)"]]); c.fill();
      c.fillStyle = "rgba(255,255,255,0.55)"; c.fillRect(s.x - 4.05, top + 4.5, 0.32, len - 8);
      c.fillStyle = "rgba(0,0,0,0.5)"; c.fillRect(s.x - 0.9, top + 9, 0.3, len - 22); c.fillRect(s.x + 0.9, top + 9, 0.3, len - 22);
      c.beginPath(); c.arc(s.x, top + 4.6, 1.7, 0, Math.PI * 2); c.fillStyle = lin(s.x - 1.7, top + 3, s.x + 1.7, top + 6.3, [[0, "#f3f4f6"], [0.5, "#8d9096"], [1, "#3a3c40"]]); c.fill(); c.lineWidth = 0.25; c.strokeStyle = "rgba(0,0,0,0.8)"; c.stroke();
      // Thumbscrew.
      const teeth = 40;
      c.beginPath(); c.arc(s.x, ky, 8.1, 0, Math.PI * 2); c.fillStyle = "#3d2a08"; c.fill();
      for (let n = 0; n < teeth; n++) {
        const a0 = (n / teeth) * Math.PI * 2, face = Math.cos(a0 + th + 2.2);
        c.beginPath(); c.arc(s.x, ky, 8.1, a0, a0 + Math.PI / teeth); c.arc(s.x, ky, 5.6, a0 + Math.PI / teeth, a0, true); c.closePath();
        c.fillStyle = `rgb(${150 + face * 90 | 0},${108 + face * 72 | 0},${38 + face * 34 | 0})`; c.fill();
      }
      c.beginPath(); c.arc(s.x, ky, 5.9, 0, Math.PI * 2);
      const cap = c.createRadialGradient(s.x - 1.8, ky - 2, 0.4, s.x, ky, 6.4); cap.addColorStop(0, "#fff0bd"); cap.addColorStop(0.45, BRASS); cap.addColorStop(1, "#7a5411");
      c.fillStyle = cap; c.fill(); c.lineWidth = 0.35; c.strokeStyle = "rgba(60,36,4,0.8)"; c.stroke();
      c.beginPath(); c.arc(s.x, ky, 3.4, 0, Math.PI * 2); c.lineWidth = 0.3; c.strokeStyle = "rgba(255,244,200,0.7)"; c.stroke();
      if (s.focus) { rr(s.x - 8.5, top - 3.5, 17, len + 28, 8); c.lineWidth = 1; c.strokeStyle = "#1f2a14"; c.stroke(); rr(s.x - 9.6, top - 4.6, 19.2, len + 30.2, 9); c.lineWidth = 0.8; c.strokeStyle = BRASS; c.stroke(); }
      c.restore();
      const [gx, gy] = toScreen(s.x, 4);
      grip.style.transform = `translate(${gx}px, ${gy}px) translate(-50%, -50%)`;
      grip.style.width = grip.style.height = `${Math.max(56, hw * 2 * sc + 30)}px`;
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, nextDemo = 1250, t0 = 0, step = 0;
    const select = (i: number) => { if (valueRef.current !== i) { valueRef.current = i; setValue(i); } };
    const pluck = (i: number, a: number) => { s.amp[i] = Math.min(2.7, s.amp[i] * 0.4 + a); s.over[i] = 1; s.ph[i] = Math.random() * 6; twang(i, stops[valueRef.current].fret, a / 2); };
    const strum = (now: number) => { GAUGE.forEach((_, i) => s.queue.push({ at: now + i * 30, i, a: 2.5 - i * 0.2 })); };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; strum(now + 120); }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      if (now - touched > 6000 && t > nextDemo && !s.drag) { const n = DEMO[step++ % DEMO.length]; select(n); s.to = capoX(n); s.strum = true; nextDemo = t + 3000; }
      if (!s.drag) { s.v += (300 * (s.to - s.x) - 27 * s.v) * dt; s.x += s.v * dt; }
      const moving = s.drag || Math.abs(s.to - s.x) > 0.4 || Math.abs(s.v) > 6;
      s.lift += ((moving ? 1 : 0) - s.lift) * Math.min(1, dt * 12);
      if (!moving && s.strum) { s.strum = false; strum(now + 60); }
      s.queue = s.queue.filter((q) => { if (q.at > now) return true; pluck(q.i, q.a); return false; });
      // Thin strings die away sooner than thick ones, and a capo on the move damps them all.
      GAUGE.forEach((_, i) => { s.amp[i] *= Math.exp(-dt / (moving ? 0.07 : 1.9 - i * 0.16)); s.over[i] *= Math.exp(-dt * 5); });
      draw(now);
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const still = () => { s.x = s.to; s.v = 0; s.lift = 0; s.amp = GAUGE.map(() => 0); draw(0); };
    api.current = {
      go: (i, user) => { if (user) touched = performance.now(); select(i); s.to = capoX(i); s.strum = true; if (reduce) still(); else wake(); },
      focus: (on) => { s.focus = on; if (reduce) draw(0); },
    };

    const fit = () => {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = base.width = Math.round(w * dpr); cv.height = base.height = Math.round(h * dpr);
      // Lay the neck as flat as the box allows. A narrow box turns it steeper so the same seven frets still fit.
      sc = Math.max(2.3, Math.min(4.1, w / 255));
      const need = (X_RIGHT - X_LEFT) * sc + 24;
      let best = 8, bestLen = 0;
      for (let a = 8; a <= 62; a++) { const r = (a * Math.PI) / 180, len = Math.min(w / Math.cos(r), (h - 150) / Math.sin(r)); if (len > bestLen) { best = a; bestLen = len; } if (len >= need) break; }
      th = (-best * Math.PI) / 180; mx = w / 2 + (best > 30 ? 14 : 0); my = h / 2 - (best > 30 ? 34 : 6);
      paintBase(); draw(performance.now());
    };
    fit();
    if (reduce) still(); else wake();
    const ro = new ResizeObserver(fit); ro.observe(cv);

    // Dragging the capo.
    let grab = 0;
    const local = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); return toNeck(e.clientX - b.left, e.clientY - b.top); };
    const nearest = (x: number) => { let n = 0; stops.forEach((_, i) => { if (Math.abs(capoX(i) - x) < Math.abs(capoX(n) - x)) n = i; }); return n; };
    const onGrab = (e: PointerEvent) => { s.drag = true; s.v = 0; touched = performance.now(); grab = local(e)[0] - s.x; grip.setPointerCapture(e.pointerId); e.preventDefault(); wake(); };
    const onDrag = (e: PointerEvent) => {
      if (!s.drag) return;
      touched = performance.now();
      s.x = Math.max(capoX(0) - 5, Math.min(capoX(stops.length - 1) + 5, local(e)[0] - grab)); select(nearest(s.x));
      if (reduce) { s.to = capoX(valueRef.current); still(); }
    };
    const onDrop = () => { if (!s.drag) return; s.drag = false; touched = performance.now(); const n = nearest(s.x); select(n); s.to = capoX(n); s.strum = true; };
    grip.addEventListener("pointerdown", onGrab); grip.addEventListener("pointermove", onDrag); grip.addEventListener("pointerup", onDrop); grip.addEventListener("pointercancel", onDrop);
    // Brushing the strings, and tapping a fret to send the capo there.
    let px = 0, py = 0, have = false, downX = 0, downY = 0;
    const onMove = (e: PointerEvent) => {
      const [x, y] = local(e);
      if (have && x > s.x + 7 && !reduce) GAUGE.forEach((_, i) => { const sy = stringY(i, x); if ((py - sy) * (y - sy) < 0) { touched = Math.max(touched, performance.now() - 3000); pluck(i, Math.min(2.4, 0.7 + Math.abs(y - py) * 0.5)); } });
      px = x; py = y; have = true;
    };
    const onLeave = () => { have = false; };
    const onDown = (e: PointerEvent) => { downX = e.clientX; downY = e.clientY; const [x, y] = local(e); px = x; py = y; have = true; };
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      const [x, y] = local(e);
      if (Math.abs(y) > halfWidth(x) || x < 0) return;
      let n = stops.findIndex((st) => x <= fretX(st.fret)); if (n < 0) n = stops.length - 1;
      api.current?.go(n, true);
    };
    cv.addEventListener("pointermove", onMove); cv.addEventListener("pointerleave", onLeave); cv.addEventListener("pointerdown", onDown); cv.addEventListener("pointerup", onUp);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
      grip.removeEventListener("pointerdown", onGrab); grip.removeEventListener("pointermove", onDrag); grip.removeEventListener("pointerup", onDrop); grip.removeEventListener("pointercancel", onDrop);
      cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerleave", onLeave); cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointerup", onUp);
    };
  }, []);

  const stop = stops[value];

  return (
    <div className="relative flex min-h-[700px] w-full flex-col items-center overflow-hidden bg-[#d5d9ca] bg-[radial-gradient(100%_75%_at_45%_35%,#e6e9dd_0%,#d5d9ca_60%,#c3c8b6_100%)] sm:min-h-[760px]">
      <p className="pointer-events-none absolute left-0 right-0 top-8 z-10 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[#3d4433] sm:top-12">Capo position</p>
      <div className="absolute inset-0">
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full touch-pan-y" />
        <div ref={handle} aria-hidden="true" className="absolute left-0 top-0 h-14 w-14 cursor-grab touch-none rounded-full active:cursor-grabbing" />
        <label htmlFor="capo-fret" className="sr-only">Capo position</label>
        <input
          id="capo-fret"
          type="range"
          min={0}
          max={stops.length - 1}
          step={1}
          value={value}
          aria-valuetext={`${stop.name}, G shapes sound in ${stop.sounds}`}
          onChange={(e) => { const n = Number(e.target.value); valueRef.current = n; setValue(n); api.current?.go(n, true); }}
          onFocus={(e) => api.current?.focus(e.currentTarget.matches(":focus-visible"))}
          onBlur={() => api.current?.focus(false)}
          className="absolute bottom-0 left-1/2 h-px w-px opacity-0"
        />
      </div>
      <p aria-live="polite" className="pointer-events-none absolute bottom-6 left-1/2 z-10 w-max max-w-[92%] -translate-x-1/2 rounded-2xl bg-[#e9ecdf]/90 px-4 py-2 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-[#4a5140] shadow-sm sm:bottom-10">
        <span className="font-semibold text-[#1f2618]">Capo on the {stop.name}</span>
        <span className="mx-2 text-[#6c745f]">/</span>
        G shapes sound in {stop.sounds}
      </p>
    </div>
  );
}

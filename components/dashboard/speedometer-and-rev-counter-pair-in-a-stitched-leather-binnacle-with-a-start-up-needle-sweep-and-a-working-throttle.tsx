import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here.
const TOP_SPEED = 160; // last number on the speedometer, in the unit below
const UNIT = "MPH";
const REDLINE = 6500; // the red band on the rev counter starts here
const MAX_RPM = 8000;
const RATIOS = [118, 74, 52, 40, 33, 27]; // engine revs per unit of speed in each gear
const PULL = [26, 17, 12, 8.5, 6.2, 4.6]; // how hard each gear accelerates at full throttle
const NEEDLE = "#ff4a1f"; // needle paint, start-button halo and focus rings
const ODOMETER = 48213.4; // reading on load
const lamps = [
  { label: "OIL", color: "#ff3b30" },
  { label: "GEN", color: "#ffb020" },
  { label: "SHIFT", color: "#ffd84a" },
];

const A0 = (135 * Math.PI) / 180, SPAN = (270 * Math.PI) / 180; // both needles sweep three quarters of a turn
const layoutFor = (narrow: boolean) =>
  narrow
    ? { W: 380, H: 780, rev: { x: 190, y: 178 }, spd: { x: 190, y: 494 }, lamp: [{ x: 62, y: 716 }, { x: 110, y: 716 }, { x: 158, y: 716 }], btn: { x: 290, y: 714 }, top: 150 }
    : { W: 790, H: 430, rev: { x: 205, y: 222 }, spd: { x: 585, y: 222 }, lamp: [{ x: 395, y: 108 }, { x: 395, y: 150 }, { x: 395, y: 192 }], btn: { x: 395, y: 322 }, top: 190 };

export default function SpeedometerAndRevCounterPair() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pedal = useRef<HTMLInputElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [on, setOn] = useState(true);
  const live = useRef({ on: true, thr: 0.5 });
  const api = useRef<{ engine: (v: boolean) => void; throttle: (v: number) => void; press: (v: boolean) => void } | null>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < 640));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const L = layoutFor(narrow);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasConic = typeof ctx.createConicGradient === "function";
    let k = 1;
    const RB = 150, RF = 124; // bezel and face radius
    const base = document.createElement("canvas"), glass = document.createElement("canvas");
    const SANS = "ui-sans-serif, system-ui, 'Helvetica Neue', Arial, sans-serif", MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

    const hood = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rt: number, rb: number) => {
      c.beginPath(); c.moveTo(x + rt, y); c.arcTo(x + w, y, x + w, y + h, rt); c.arcTo(x + w, y + h, x, y + h, rb); c.arcTo(x, y + h, x, y, rb); c.arcTo(x, y, x + w, y, rt); c.closePath();
    };
    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => hood(c, x, y, w, h, r, r);
    const chrome = (c: CanvasRenderingContext2D, x: number, y: number, turn: number, r: number) => {
      if (!hasConic) { const g = c.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, "#f6f7f8"); g.addColorStop(0.4, "#7d8187"); g.addColorStop(0.6, "#e3e5e8"); g.addColorStop(1, "#44474c"); return g; }
      const g = c.createConicGradient(turn, x, y);
      for (const [p, v] of [[0, "#f8f9fa"], [0.06, "#c9ccd1"], [0.13, "#6b6f75"], [0.2, "#2d2f33"], [0.27, "#8c9096"], [0.36, "#eceef0"], [0.44, "#a4a8ae"], [0.5, "#4b4e53"], [0.56, "#9a9ea4"], [0.64, "#f3f4f6"], [0.72, "#b6b9bf"], [0.79, "#3b3d42"], [0.86, "#7b7f85"], [0.94, "#dfe1e4"], [1, "#f8f9fa"]] as [number, string][]) g.addColorStop(p, v);
      return g;
    };
    const polar = (d: { x: number; y: number }, f: number, r: number) => { const a = A0 + SPAN * f; return { x: d.x + Math.cos(a) * r, y: d.y + Math.sin(a) * r }; };

    const dial = (b: CanvasRenderingContext2D, d: { x: number; y: number }, kind: "rev" | "spd") => {
      // Shadow on the hide, then a bezel turned like a ring: bright shoulder, dark throat.
      b.save(); b.shadowColor = "rgba(0,0,0,0.85)"; b.shadowBlur = 22 * k; b.shadowOffsetY = 12 * k;
      b.beginPath(); b.arc(d.x, d.y, RB - 1, 0, Math.PI * 2); b.fillStyle = "#000"; b.fill(); b.restore();
      b.beginPath(); b.arc(d.x, d.y, RB, 0, Math.PI * 2); b.fillStyle = chrome(b, d.x, d.y, -2.3, RB); b.fill();
      b.beginPath(); b.arc(d.x, d.y, RB - 9, 0, Math.PI * 2); b.fillStyle = chrome(b, d.x, d.y, 0.9, RB); b.fill();
      const lipG = b.createLinearGradient(d.x, d.y - RB, d.x, d.y + RB); lipG.addColorStop(0, "rgba(255,255,255,0.95)"); lipG.addColorStop(0.5, "rgba(255,255,255,0.25)"); lipG.addColorStop(1, "rgba(0,0,0,0.5)");
      b.beginPath(); b.arc(d.x, d.y, RB - 9, 0, Math.PI * 2); b.lineWidth = 1; b.strokeStyle = lipG; b.stroke();
      b.beginPath(); b.arc(d.x, d.y, RB - 0.5, 0, Math.PI * 2); b.lineWidth = 1; b.strokeStyle = "rgba(0,0,0,0.6)"; b.stroke();
      const throat = b.createLinearGradient(d.x - RF, d.y - RF, d.x + RF, d.y + RF); throat.addColorStop(0, "#020202"); throat.addColorStop(0.55, "#101113"); throat.addColorStop(1, "#4a4d52");
      b.beginPath(); b.arc(d.x, d.y, RF + 8, 0, Math.PI * 2); b.fillStyle = throat; b.fill();
      const face = b.createRadialGradient(d.x, d.y - 30, 10, d.x, d.y, RF);
      face.addColorStop(0, "#1e1f22"); face.addColorStop(0.7, "#131416"); face.addColorStop(1, "#0b0b0d");
      b.beginPath(); b.arc(d.x, d.y, RF, 0, Math.PI * 2); b.fillStyle = face; b.fill();
      // The bezel shades the top of the face.
      b.save(); b.beginPath(); b.arc(d.x, d.y, RF, 0, Math.PI * 2); b.clip();
      b.beginPath(); b.arc(d.x, d.y, RF + 6, 0, Math.PI * 2); b.arc(d.x + 4, d.y + 12, RF + 2, 0, Math.PI * 2, true);
      b.shadowColor = "rgba(0,0,0,0.9)"; b.shadowBlur = 12 * k; b.fillStyle = "rgba(0,0,0,0.85)"; b.fill("evenodd"); b.restore();
      // A fine turned ring inside the numerals.
      b.beginPath(); b.arc(d.x, d.y, 62, 0, Math.PI * 2); b.lineWidth = 1; b.strokeStyle = "rgba(255,255,255,0.07)"; b.stroke();
      b.beginPath(); b.arc(d.x, d.y, 63, 0, Math.PI * 2); b.lineWidth = 1; b.strokeStyle = "rgba(0,0,0,0.6)"; b.stroke();

      const INK = "#efe8d6", max = kind === "rev" ? MAX_RPM / 1000 : TOP_SPEED, major = kind === "rev" ? 1 : 20, minors = kind === "rev" ? 10 : 4;
      const red = kind === "rev" ? REDLINE / 1000 : Infinity;
      if (kind === "rev") {
        b.beginPath(); b.arc(d.x, d.y, 113.5, A0 + SPAN * (red / max), A0 + SPAN); b.lineWidth = 7; b.strokeStyle = "#c8261c"; b.stroke();
      }
      b.lineCap = "butt";
      const n = Math.round(max / major) * minors;
      for (let i = 0; i <= n; i++) {
        const v = (i / minors) * major, f = v / max, big = i % minors === 0, mid = !big && i % (minors / 2) === 0;
        const p0 = polar(d, f, big ? 101 : mid ? 106 : 110), p1 = polar(d, f, 117);
        b.beginPath(); b.moveTo(p0.x, p0.y); b.lineTo(p1.x, p1.y); b.lineWidth = big ? 2.8 : mid ? 1.8 : 1.1;
        b.strokeStyle = v >= red && !big ? "#ffd9d2" : big ? INK : mid ? "rgba(239,232,214,0.85)" : "rgba(239,232,214,0.55)"; b.stroke();
        if (big) {
          const q = polar(d, f, kind === "rev" ? 83 : 80);
          b.font = `700 ${kind === "rev" ? 22 : 15}px ${SANS}`; b.textAlign = "center"; b.textBaseline = "middle";
          b.fillStyle = v >= red ? "#ff6a5c" : INK; b.fillText(String(v), q.x, q.y + 1);
        }
      }
      b.font = `600 8px ${MONO}`; b.textAlign = "center"; b.textBaseline = "middle"; b.fillStyle = "rgba(239,232,214,0.6)";
      if (kind === "rev") { b.fillText("RPM  x1000", d.x, d.y - 42); b.fillText("GEAR", d.x, d.y + 86); } else { b.fillText(UNIT, d.x, d.y - 42); b.fillText("MILES", d.x, d.y + 72); }
      // Recess for the gear window or the odometer drums.
      const w = kind === "rev" ? 30 : 74, h = kind === "rev" ? 28 : 21, wy = d.y + (kind === "rev" ? 44 : 38);
      rr(b, d.x - w / 2 - 2.5, wy - 2.5, w + 5, h + 5, 4.5); b.fillStyle = "#000"; b.fill();
      const wl = b.createLinearGradient(0, wy - 3, 0, wy + h + 3); wl.addColorStop(0, "rgba(0,0,0,1)"); wl.addColorStop(1, "rgba(150,152,158,0.7)");
      rr(b, d.x - w / 2 - 2.5, wy - 2.5, w + 5, h + 5, 4.5); b.lineWidth = 1; b.strokeStyle = wl; b.stroke();
    };

    const jewelSeat = (b: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      b.save(); b.shadowColor = "rgba(0,0,0,0.8)"; b.shadowBlur = 5 * k; b.shadowOffsetY = 2.5 * k;
      b.beginPath(); b.arc(x, y, r, 0, Math.PI * 2); b.fillStyle = chrome(b, x, y, -2.2, r); b.fill(); b.restore();
      b.beginPath(); b.arc(x, y, r * 0.72, 0, Math.PI * 2); b.fillStyle = "#060606"; b.fill();
    };

    const build = () => {
      const b = base.getContext("2d"), g = glass.getContext("2d");
      if (!b || !g) return;
      base.width = glass.width = cv.width; base.height = glass.height = cv.height;
      b.setTransform(k, 0, 0, k, 0, 0); g.setTransform(k, 0, 0, k, 0, 0);
      let seed = 41;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

      // The binnacle: black hide stretched over a cowl, grained, with a cream saddle stitch.
      const X = 8, Y = 8, BW = L.W - 16, BH = L.H - 20, RT = L.top, RBm = 44;
      b.save(); b.shadowColor = "rgba(0,0,0,0.8)"; b.shadowBlur = 28 * k; b.shadowOffsetY = 16 * k;
      hood(b, X, Y, BW, BH, RT, RBm); b.fillStyle = "#0c0c0d"; b.fill(); b.restore();
      const hide = b.createLinearGradient(0, Y, 0, Y + BH);
      hide.addColorStop(0, "#3b3c40"); hide.addColorStop(0.16, "#27282b"); hide.addColorStop(0.6, "#1b1c1e"); hide.addColorStop(1, "#111113");
      hood(b, X, Y, BW, BH, RT, RBm); b.fillStyle = hide; b.fill();
      b.save(); hood(b, X, Y, BW, BH, RT, RBm); b.clip();
      const count = Math.round((L.W * L.H) / 7);
      for (let i = 0; i < count; i++) {
        // Pores, the pale shoulder beside each one, and now and then a short crease.
        const x = rand() * L.W, y = rand() * L.H, r = 0.3 + rand() * 0.75;
        b.beginPath(); b.arc(x, y, r, 0, Math.PI * 2); b.fillStyle = `rgba(0,0,0,${0.2 + rand() * 0.3})`; b.fill();
        if (i % 2 === 0) { b.beginPath(); b.arc(x - 0.8, y - 0.9, r * 0.9, 0, Math.PI * 2); b.fillStyle = `rgba(255,255,255,${0.02 + rand() * 0.05})`; b.fill(); }
        if (i % 22 === 0) { const a = rand() * Math.PI, n = 3 + rand() * 7; b.beginPath(); b.moveTo(x, y); b.quadraticCurveTo(x + Math.cos(a) * n * 0.5 + rand() * 3 - 1.5, y + Math.sin(a) * n * 0.5 + rand() * 3 - 1.5, x + Math.cos(a) * n, y + Math.sin(a) * n); b.lineWidth = 0.5; b.strokeStyle = `rgba(0,0,0,${0.18 + rand() * 0.2})`; b.stroke(); }
      }
      for (const [wd, al] of [[64, 0.1], [40, 0.12], [20, 0.16], [8, 0.2]]) { hood(b, X, Y, BW, BH, RT, RBm); b.lineWidth = wd; b.strokeStyle = `rgba(0,0,0,${al})`; b.stroke(); }
      const sheen = b.createLinearGradient(0, Y, 0, Y + 120);
      sheen.addColorStop(0, "rgba(255,255,255,0.13)"); sheen.addColorStop(0.35, "rgba(255,255,255,0.04)"); sheen.addColorStop(1, "rgba(255,255,255,0)");
      b.fillStyle = sheen; b.fillRect(0, 0, L.W, 140);
      const roll = b.createLinearGradient(0, Y, 0, Y + BH * 0.5); roll.addColorStop(0, "rgba(255,255,255,0.2)"); roll.addColorStop(1, "rgba(255,255,255,0)");
      hood(b, X + 5, Y + 5, BW - 10, BH - 10, RT - 5, RBm - 5); b.lineWidth = 9; b.strokeStyle = roll; b.stroke();
      b.restore();
      const rim = b.createLinearGradient(0, Y, 0, Y + BH); rim.addColorStop(0, "rgba(255,255,255,0.42)"); rim.addColorStop(0.2, "rgba(255,255,255,0.05)"); rim.addColorStop(1, "rgba(0,0,0,0.6)");
      hood(b, X + 0.7, Y + 0.7, BW - 1.4, BH - 1.4, RT - 0.7, RBm - 0.7); b.lineWidth = 1.4; b.strokeStyle = rim; b.stroke();

      const SI = 15, sx = X + SI, sy = Y + SI, sw = BW - SI * 2, sh = BH - SI * 2, rt = RT - SI, rb = RBm - SI + 2;
      hood(b, sx, sy + 1, sw, sh, rt, rb); b.lineWidth = 4.2; b.strokeStyle = "rgba(255,255,255,0.07)"; b.stroke();
      hood(b, sx, sy, sw, sh, rt, rb); b.lineWidth = 3.4; b.strokeStyle = "rgba(0,0,0,0.6)"; b.stroke();
      const pts: { x: number; y: number; a: number }[] = [];
      const edge = (x0: number, y0: number, x1: number, y1: number) => { const n = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0); for (let d = 0; d < n; d += 1) pts.push({ x: x0 + Math.cos(a) * d, y: y0 + Math.sin(a) * d, a }); };
      const bend = (cx: number, cy: number, r: number, a0: number) => { for (let d = 0; d < (Math.PI / 2) * r; d += 1) { const a = a0 + d / r; pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, a: a + Math.PI / 2 }); } };
      edge(sx + rt, sy, sx + sw - rt, sy); bend(sx + sw - rt, sy + rt, rt, -Math.PI / 2);
      edge(sx + sw, sy + rt, sx + sw, sy + sh - rb); bend(sx + sw - rb, sy + sh - rb, rb, 0);
      edge(sx + sw - rb, sy + sh, sx + rb, sy + sh); bend(sx + rb, sy + sh - rb, rb, Math.PI / 2);
      edge(sx, sy + sh - rb, sx, sy + rt); bend(sx + rt, sy + rt, rt, Math.PI);
      b.lineCap = "round";
      for (let i = 4; i < pts.length - 4; i += 9) {
        const p = pts[i], ca = Math.cos(p.a + 0.2) * 3, sa = Math.sin(p.a + 0.2) * 3;
        b.beginPath(); b.moveTo(p.x - ca + 0.6, p.y - sa + 1.3); b.lineTo(p.x + ca + 0.6, p.y + sa + 1.3); b.lineWidth = 2.4; b.strokeStyle = "rgba(0,0,0,0.7)"; b.stroke();
        b.beginPath(); b.moveTo(p.x - ca, p.y - sa); b.lineTo(p.x + ca, p.y + sa); b.lineWidth = 1.9; b.strokeStyle = "#d9c9a6"; b.stroke();
        b.beginPath(); b.moveTo(p.x - ca * 0.7, p.y - sa * 0.7 - 0.5); b.lineTo(p.x + ca * 0.5, p.y + sa * 0.5 - 0.5); b.lineWidth = 0.7; b.strokeStyle = "rgba(255,255,255,0.5)"; b.stroke();
      }
      b.lineCap = "butt";

      dial(b, L.rev, "rev"); dial(b, L.spd, "spd");

      // Lamp seats, their legends, and the ring of the start button.
      lamps.forEach((lamp, i) => {
        const p = L.lamp[i]; jewelSeat(b, p.x, p.y, 10.5);
        b.font = `600 7px ${MONO}`; b.textAlign = "center"; b.textBaseline = "middle";
        const ly = narrow ? p.y + 22 : p.y + 20;
        b.fillStyle = "rgba(0,0,0,0.8)"; b.fillText(lamp.label, p.x, ly + 0.8); b.fillStyle = "rgba(226,218,200,0.72)"; b.fillText(lamp.label, p.x, ly);
      });
      b.save(); b.shadowColor = "rgba(0,0,0,0.85)"; b.shadowBlur = 9 * k; b.shadowOffsetY = 5 * k;
      b.beginPath(); b.arc(L.btn.x, L.btn.y, 31, 0, Math.PI * 2); b.fillStyle = chrome(b, L.btn.x, L.btn.y, -2.3, 31); b.fill(); b.restore();
      b.beginPath(); b.arc(L.btn.x, L.btn.y, 25.5, 0, Math.PI * 2); b.fillStyle = "#050505"; b.fill();

      // Glass over each dial: a broad soft crescent, one hard streak of window, a faint rim opposite.
      for (const d of [L.rev, L.spd]) {
        g.save(); g.beginPath(); g.arc(d.x, d.y, RF + 7, 0, Math.PI * 2); g.clip();
        const soft = g.createLinearGradient(d.x - RF, d.y - RF, d.x + RF * 0.3, d.y + RF * 0.4);
        soft.addColorStop(0, "rgba(255,255,255,0.2)"); soft.addColorStop(0.5, "rgba(255,255,255,0.05)"); soft.addColorStop(1, "rgba(255,255,255,0)");
        g.beginPath(); g.arc(d.x, d.y, RF + 7, 0, Math.PI * 2); g.arc(d.x + 34, d.y + 50, RF + 18, 0, Math.PI * 2, true); g.fillStyle = soft; g.fill("evenodd");
        g.lineCap = "round";
        g.shadowColor = "rgba(255,255,255,0.5)"; g.shadowBlur = 6 * k;
        g.beginPath(); g.arc(d.x, d.y, RF - 9, Math.PI * 1.14, Math.PI * 1.36); g.lineWidth = 5; g.strokeStyle = "rgba(255,255,255,0.3)"; g.stroke();
        g.beginPath(); g.arc(d.x, d.y, RF - 9, Math.PI * 1.39, Math.PI * 1.43); g.lineWidth = 5; g.strokeStyle = "rgba(255,255,255,0.22)"; g.stroke();
        g.shadowBlur = 0;
        g.beginPath(); g.arc(d.x, d.y, RF + 2, Math.PI * 0.12, Math.PI * 0.42); g.lineWidth = 2; g.strokeStyle = "rgba(255,255,255,0.1)"; g.stroke();
        g.restore();
      }
    };

    const s = { phase: "run" as "off" | "sweep" | "run", pt: 0, v: 46, g: 2, rpm: 46 * RATIOS[2], cut: 0, fr: 0, frv: 0, fs: 0, fsv: 0, odo: ODOMETER, lamp: lamps.map(() => 0), halo: 1, press: 0, pressTo: 0, thr: 0.55 };
    s.fr = s.rpm / MAX_RPM; s.fs = s.v / TOP_SPEED;

    const needle = (d: { x: number; y: number }, f: number, len: number) => {
      const a = A0 + SPAN * Math.max(-0.02, Math.min(1.03, f));
      const shape = () => { ctx.beginPath(); ctx.moveTo(-26, -3.4); ctx.lineTo(len, -0.9); ctx.lineTo(len + 3, 0); ctx.lineTo(len, 0.9); ctx.lineTo(-26, 3.4); ctx.closePath(); };
      ctx.save(); ctx.translate(d.x + 4, d.y + 8); ctx.rotate(a); shape(); ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 5 * k; ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(a);
      shape(); ctx.fillStyle = NEEDLE; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-26, -3.4); ctx.lineTo(len, -0.9); ctx.lineTo(len, -0.1); ctx.lineTo(-26, -1.2); ctx.closePath(); ctx.fillStyle = "rgba(255,255,255,0.32)"; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-26, 3.4); ctx.lineTo(len, 0.9); ctx.lineTo(len, 0.2); ctx.lineTo(-26, 1.6); ctx.closePath(); ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.fill();
      ctx.restore();
      // Hub cap: a black dome with one window in it.
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 7 * k; ctx.shadowOffsetY = 4 * k;
      ctx.beginPath(); ctx.arc(d.x, d.y, 19, 0, Math.PI * 2); ctx.fillStyle = "#0a0a0b"; ctx.fill(); ctx.restore();
      const cap = ctx.createRadialGradient(d.x - 6, d.y - 8, 1, d.x, d.y, 19);
      cap.addColorStop(0, "#6a6d73"); cap.addColorStop(0.3, "#2b2c30"); cap.addColorStop(0.8, "#0d0d0f"); cap.addColorStop(1, "#2a2b2f");
      ctx.beginPath(); ctx.arc(d.x, d.y, 19, 0, Math.PI * 2); ctx.fillStyle = cap; ctx.fill();
      ctx.beginPath(); ctx.ellipse(d.x - 6, d.y - 8.5, 6, 3, -0.6, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fill();
      ctx.beginPath(); ctx.arc(d.x, d.y, 18.4, Math.PI * 0.15, Math.PI * 0.7); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.stroke();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(base, 0, 0);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";

      // Gear window.
      const gy = L.rev.y + 58;
      const moving = s.phase === "run" && (s.v > 1 || s.thr > 0.03);
      ctx.font = `700 22px ${MONO}`; ctx.fillStyle = s.phase === "off" ? "rgba(239,232,214,0.25)" : "#efe8d6"; ctx.fillText(moving ? String(s.g + 1) : "N", L.rev.x, gy + 1);

      // Odometer: six drums, each one turning only while the drum to its right passes nine.
      const ox = L.spd.x - 37, oy = L.spd.y + 38, cw = 74 / 6, ch = 21, tenths = s.odo * 10, f0 = tenths % 1;
      ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, 74, ch); ctx.clip();
      let carry = true;
      for (let p = 0; p < 6; p++) {
        const digit = Math.floor(tenths / Math.pow(10, p)) % 10, roll = p === 0 ? f0 : carry ? f0 : 0, x = ox + (5 - p) * cw;
        ctx.fillStyle = p === 0 ? "#e8e1cf" : "#0d0d0e"; ctx.fillRect(x + 0.5, oy, cw - 1, ch);
        ctx.font = `700 12px ${MONO}`; ctx.fillStyle = p === 0 ? "#141414" : "#efe8d6";
        ctx.fillText(String(digit), x + cw / 2, oy + ch / 2 + 1 - roll * ch); ctx.fillText(String((digit + 1) % 10), x + cw / 2, oy + ch / 2 + 1 + ch - roll * ch);
        carry = carry && digit === 9;
      }
      const drum = ctx.createLinearGradient(0, oy, 0, oy + ch);
      drum.addColorStop(0, "rgba(0,0,0,0.85)"); drum.addColorStop(0.3, "rgba(0,0,0,0)"); drum.addColorStop(0.5, "rgba(255,255,255,0.08)"); drum.addColorStop(0.72, "rgba(0,0,0,0)"); drum.addColorStop(1, "rgba(0,0,0,0.8)");
      ctx.fillStyle = drum; ctx.fillRect(ox, oy, 74, ch); ctx.restore();

      needle(L.rev, s.fr, 110); needle(L.spd, s.fs, 110);

      // Warning jewels.
      lamps.forEach((lamp, i) => {
        const p = L.lamp[i], lit = s.lamp[i];
        ctx.save(); ctx.globalAlpha = 0.2 + 0.8 * lit; ctx.shadowColor = lamp.color; ctx.shadowBlur = 18 * lit * k;
        ctx.beginPath(); ctx.arc(p.x, p.y, 6.6, 0, Math.PI * 2); ctx.fillStyle = lamp.color; ctx.fill(); ctx.restore();
        const hot = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 6.6); hot.addColorStop(0, `rgba(255,255,255,${0.75 * lit})`); hot.addColorStop(0.6, "rgba(255,255,255,0)");
        ctx.beginPath(); ctx.arc(p.x, p.y, 6.6, 0, Math.PI * 2); ctx.fillStyle = hot; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, 6.6, 0, Math.PI * 2); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(p.x - 2, p.y - 2.6, 2.4, 1.3, -0.6, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.4 * lit})`; ctx.fill();
      });

      // Start button: a lit ring, then a satin cap that sinks when pressed.
      const bx = L.btn.x, by = L.btn.y, sink = s.press;
      ctx.save(); ctx.shadowColor = NEEDLE; ctx.shadowBlur = 12 * s.halo * k; ctx.globalAlpha = 0.18 + 0.82 * s.halo;
      ctx.beginPath(); ctx.arc(bx, by, 23.6, 0, Math.PI * 2); ctx.lineWidth = 2.6; ctx.strokeStyle = NEEDLE; ctx.stroke(); ctx.restore();
      const r = 21 - sink * 0.9;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = (6 - sink * 4) * k; ctx.shadowOffsetY = (3 - sink * 2.4) * k;
      ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fillStyle = "#111"; ctx.fill(); ctx.restore();
      const capG = ctx.createLinearGradient(bx - r, by - r, bx + r, by + r);
      capG.addColorStop(0, sink > 0.5 ? "#55585d" : "#7b7e84"); capG.addColorStop(0.45, "#2f3135"); capG.addColorStop(1, "#151618");
      ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fillStyle = capG; ctx.fill();
      ctx.beginPath(); ctx.arc(bx, by, r - 0.6, Math.PI * 1.05, Math.PI * 1.6); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.stroke();
      ctx.font = `700 6.4px ${MONO}`; ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillText("ENGINE", bx, by - 5.2 + sink * 0.6); ctx.fillText(s.phase === "off" ? "START" : "STOP", bx, by + 4.8 + sink * 0.6);
      ctx.fillStyle = "#efe8d6"; ctx.fillText("ENGINE", bx, by - 6 + sink * 0.6); ctx.fillText(s.phase === "off" ? "START" : "STOP", bx, by + 4 + sink * 0.6);

      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(glass, 0, 0);
    };

    // One slice of driving: throttle in, speed, gear and revs out.
    const drive = (dt: number, thr: number, brake: number) => {
      const g = s.g, torque = 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, s.rpm / 7200));
      s.cut = Math.max(0, s.cut - dt);
      const push = s.cut > 0 ? 0 : thr * PULL[g] * torque;
      const dragged = 0.012 * s.v + 0.00075 * s.v * s.v + (s.v > 0.2 ? 0.5 + (thr < 0.03 ? 2.2 : 0) : 0) + brake;
      s.v = Math.max(0, Math.min(TOP_SPEED * 0.985, s.v + (push - dragged) * dt));
      const road = s.v * RATIOS[s.g], slip = 850 + thr * 2100;
      const target = Math.min(MAX_RPM * 0.93, Math.max(s.g === 0 ? slip : 850, road));
      s.rpm += (target - s.rpm) * Math.min(1, dt * (s.cut > 0 ? 9 : 14));
      if (s.cut <= 0) {
        if (s.g < RATIOS.length - 1 && road > 2200 + thr * 4300) { s.g++; s.cut = 0.22; }
        else if (s.g > 0 && road < 1250 + thr * 1500) { s.g--; s.cut = 0.16; }
      }
      s.odo += (s.v * dt) / 600; // sped up so the drums are seen to turn
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, t0 = 0, shown = -1, wasOn = true;
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const idle = now - touched > 9000;
      let brake = 0;
      if (idle) {
        // The self-running lap: pull, lift, kick down, stop, switch off, start again.
        const T = ((now - t0) / 1000) % 27;
        const wantOn = !(T >= 14.6 && T < 16.2);
        if (wantOn !== wasOn) { wasOn = wantOn; live.current.on = wantOn; setOn(wantOn); if (wantOn) { s.phase = "sweep"; s.pt = 0; } else s.phase = "off"; }
        live.current.thr = T < 6 ? 0.55 : T < 9.5 ? 0.1 : T < 12 ? 0.95 : T < 18.6 ? 0 : 0.7;
        if (T >= 12 && T < 14.6) brake = 46;
      } else wasOn = live.current.on;
      const want = live.current.thr;
      s.thr += (want - s.thr) * Math.min(1, dt * 10);
      let fr = 0, fs = 0;
      if (s.phase === "run") { drive(dt, s.thr, brake); fr = s.rpm / MAX_RPM; fs = s.v / TOP_SPEED; }
      else if (s.phase === "sweep") {
        s.pt += dt; s.v = 0; s.g = 0;
        fr = fs = s.pt < 0.8 ? 1 : 0;
        if (s.pt > 1.75) { s.phase = "run"; s.rpm = 1700; }
      } else { s.v = Math.max(0, s.v - 60 * dt); s.rpm = 0; s.g = 0; fs = s.v / TOP_SPEED; }
      // Needles are sprung and damped: the rev needle is the livelier of the two.
      const stiff = s.phase === "sweep" ? 46 : 150, damp = s.phase === "sweep" ? 11 : 17;
      s.frv += (stiff * (fr - s.fr) - damp * s.frv) * dt; s.fr += s.frv * dt;
      s.fsv += ((s.phase === "sweep" ? 46 : 80) * (fs - s.fs) - (s.phase === "sweep" ? 11 : 14) * s.fsv) * dt; s.fs += s.fsv * dt;
      const test = s.phase === "sweep";
      const wantLamp = [test ? 1 : 0, test ? 1 : 0, test || (s.phase === "run" && s.rpm > 5900) ? 1 : 0];
      s.lamp = s.lamp.map((v, i) => v + (wantLamp[i] - v) * Math.min(1, dt * 16));
      s.halo += ((s.phase === "off" ? 0 : 1) - s.halo) * Math.min(1, dt * 8);
      s.press += (s.pressTo - s.press) * Math.min(1, dt * 26);
      if (idle && pedal.current) { const pct = Math.round(s.thr * 100); if (pct !== shown) { shown = pct; pedal.current.value = String(pct); pedal.current.style.setProperty("--fill", `${pct}%`); } }
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    // With motion reduced there is no loop: show where the needles would come to rest.
    const steady = () => {
      const thr = live.current.thr;
      if (!live.current.on) { s.phase = "off"; s.v = 0; s.rpm = 0; s.g = 0; s.halo = 0; }
      else {
        s.phase = "run"; s.halo = 1; s.thr = thr; s.v = TOP_SPEED * 0.9 * Math.sqrt(thr);
        s.g = 0; while (s.g < RATIOS.length - 1 && s.v * RATIOS[s.g] > 2200 + thr * 4300) s.g++;
        s.rpm = Math.max(850, s.v * RATIOS[s.g]);
      }
      s.fr = s.rpm / MAX_RPM; s.fs = s.v / TOP_SPEED; s.press = s.pressTo; s.lamp = lamps.map(() => 0); draw();
    };

    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1), wpx = Math.max(200, cv.clientWidth);
      cv.width = Math.round(wpx * dpr); cv.height = Math.round((wpx * dpr * L.H) / L.W); k = cv.width / L.W;
      build(); draw();
    };
    size();
    const ro = new ResizeObserver(size); ro.observe(cv);

    api.current = {
      engine: (v) => { touched = performance.now(); live.current.on = v; if (v) { s.phase = "sweep"; s.pt = 0; } else s.phase = "off"; if (reduce) steady(); else wake(); },
      throttle: (v) => { touched = performance.now(); live.current.thr = v; if (reduce) steady(); else wake(); },
      press: (v) => { s.pressTo = v ? 1 : 0; if (reduce) steady(); else wake(); },
    };
    if (reduce) steady(); else wake();

    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, [narrow]);

  const L = layoutFor(narrow);
  const toggle = () => { const next = !live.current.on; live.current.on = next; setOn(next); api.current?.engine(next); };

  return (
    <div ref={stage} className="flex min-h-[640px] w-full flex-col items-center justify-center bg-[#090b0f] bg-[radial-gradient(110%_80%_at_50%_30%,#1a1f28_0%,#090b0f_62%)] px-4 py-10 sm:min-h-[760px]">
      <style>{`
        .srcp-pedal { -webkit-appearance: none; appearance: none; height: 40px; background: transparent; cursor: pointer; --fill: 55%; }
        .srcp-pedal::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; background: linear-gradient(90deg, ${NEEDLE} var(--fill), #05060a var(--fill)); box-shadow: inset 0 1px 2px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.12); }
        .srcp-pedal::-moz-range-track { height: 6px; border-radius: 3px; background: linear-gradient(90deg, ${NEEDLE} var(--fill), #05060a var(--fill)); box-shadow: inset 0 1px 2px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.12); }
        .srcp-pedal::-webkit-slider-thumb { -webkit-appearance: none; width: 26px; height: 26px; margin-top: -10px; border-radius: 50%; border: 1px solid #1b1c1f; background: radial-gradient(circle at 34% 28%, #ffffff 0%, #d6d8dc 22%, #8b8f95 52%, #4a4d52 78%, #9da1a7 100%); box-shadow: 0 4px 8px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.35); }
        .srcp-pedal::-moz-range-thumb { width: 26px; height: 26px; border-radius: 50%; border: 1px solid #1b1c1f; background: radial-gradient(circle at 34% 28%, #ffffff 0%, #d6d8dc 22%, #8b8f95 52%, #4a4d52 78%, #9da1a7 100%); box-shadow: 0 4px 8px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.35); }
        .srcp-pedal:focus-visible { outline: 2px solid ${NEEDLE}; outline-offset: 4px; border-radius: 8px; }
      `}</style>
      <div className={`relative w-full ${narrow ? "max-w-[340px]" : "max-w-[940px]"}`} style={{ aspectRatio: `${L.W} / ${L.H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <button
          type="button"
          aria-pressed={on}
          aria-label="Engine"
          onClick={toggle}
          onPointerDown={() => api.current?.press(true)}
          onPointerUp={() => api.current?.press(false)}
          onPointerLeave={() => api.current?.press(false)}
          onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") api.current?.press(true); }}
          onKeyUp={() => api.current?.press(false)}
          style={{ left: `${(L.btn.x / L.W) * 100}%`, top: `${(L.btn.y / L.H) * 100}%`, width: `${(64 / L.W) * 100}%` }}
          className="absolute aspect-square min-w-[44px] -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#ff4a1f] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        />
      </div>
      <div className="mt-6 flex w-full max-w-[340px] items-center gap-4 sm:max-w-[420px]">
        <label htmlFor="srcp-throttle" className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-300">Throttle</label>
        <input
          id="srcp-throttle"
          ref={pedal}
          type="range"
          min={0}
          max={100}
          defaultValue={55}
          onInput={(e) => { const v = Number(e.currentTarget.value); e.currentTarget.style.setProperty("--fill", `${v}%`); api.current?.throttle(v / 100); }}
          className="srcp-pedal min-w-0 flex-1"
        />
      </div>
      <p aria-live="polite" className="mt-3 min-h-[20px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-slate-400">
        <span className="text-slate-100">{on ? "Engine running" : "Engine off"}</span>
        <span className="mx-2 text-slate-600">/</span>
        {on ? "Slide the throttle" : "Press start"}
      </p>
    </div>
  );
}

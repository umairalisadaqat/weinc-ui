import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// Everything a visitor is likely to change sits here.
const channels = ["Left", "Right"]; // printed in the corner of each face
const MARKS = [-20, -10, -7, -5, -3, -2, -1, 0, 1, 2, 3]; // the numbers on the arc, in VU
const DB_MIN = -12, DB_MAX = 6; // travel of the drive knob in decibels
const LAMP = "#ffb648"; // colour of the pilot jewel and the focus ring
const TEMPO = 96; // beats a minute of the pretend programme
const MW = 328, MH = 212; // one meter window in design pixels
const KNOB = 1.3; // size of the drive knob

// A real VU needle moves with voltage, so the scale is crowded on the left and wide on the right.
const frac = (db: number) => Math.pow(10, (db - 3) / 20);
const SPAN = 49; // degrees either side of straight up
const needleAngle = (f: number) => ((-SPAN + 2 * SPAN * f) * Math.PI) / 180;

const layoutFor = (narrow: boolean) =>
  narrow
    ? { W: 380, H: 690, meters: [{ x: 26, y: 26 }, { x: 26, y: 258 }], sw: { x: 66, y: 584 }, knob: { x: 196, y: 574 }, jack: { x: 320, y: 584 } }
    : { W: 760, H: 460, meters: [{ x: 36, y: 34 }, { x: 396, y: 34 }], sw: { x: 150, y: 352 }, knob: { x: 380, y: 346 }, jack: { x: 610, y: 352 } };

export default function StereoVuMeterPair() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const knobHit = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [db, setDb] = useState(0);
  const [on, setOn] = useState(true);
  const live = useRef({ db: 0, on: true });
  const api = useRef<{ poke: () => void } | null>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < 640));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const cv = canvas.current, pad = knobHit.current;
    if (!cv || !pad) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const L = layoutFor(narrow);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasConic = typeof ctx.createConicGradient === "function";
    let k = 1; // canvas pixels per design pixel

    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };
    const hex = (c: CanvasRenderingContext2D, x: number, y: number, r: number, turn: number) => {
      c.beginPath(); for (let i = 0; i < 6; i++) { const a = turn + (i * Math.PI) / 3; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath();
    };
    const engrave = (c: CanvasRenderingContext2D, text: string, x: number, y: number, size = 8.5, alpha = 0.62) => {
      c.font = `600 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillStyle = "rgba(0,0,0,0.8)"; c.fillText(text, x, y + 0.8);
      c.fillStyle = `rgba(232,228,220,${alpha})`; c.fillText(text, x, y);
    };
    const metal = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      const g = c.createLinearGradient(x - r, y - r, x + r, y + r);
      g.addColorStop(0, "#f2f3f5"); g.addColorStop(0.35, "#9a9da3"); g.addColorStop(0.55, "#d9dbdf"); g.addColorStop(0.8, "#5a5d63"); g.addColorStop(1, "#a9acb2");
      return g;
    };

    // Layer 1: the brushed faceplate with everything that never moves.
    const base = document.createElement("canvas");
    // Layer 2: the printed scale, shared by both meters.
    const scale = document.createElement("canvas");
    const PX = MW / 2, PY = MH - 23, R = 146; // needle pivot and arc radius inside one window

    const build = () => {
      const b = base.getContext("2d");
      if (!b) return;
      base.width = cv.width; base.height = cv.height;
      b.setTransform(k, 0, 0, k, 0, 0);
      const plate = b.createLinearGradient(0, 0, 0, L.H);
      plate.addColorStop(0, "#313236"); plate.addColorStop(0.5, "#232427"); plate.addColorStop(1, "#1a1b1e");
      rr(b, 0, 0, L.W, L.H, 10); b.fillStyle = plate; b.fill();
      b.save(); rr(b, 0, 0, L.W, L.H, 10); b.clip();
      let seed = 11;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let y = 0; y < L.H; y += 0.5) {
        const v = rand(), x0 = rand() * L.W * 0.4, x1 = L.W - rand() * L.W * 0.4;
        b.beginPath(); b.moveTo(x0, y); b.lineTo(x1, y); b.lineWidth = 0.5;
        b.strokeStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.11})` : `rgba(0,0,0,${(0.5 - v) * 0.32})`; b.stroke();
      }
      // A soft band of light across the plate, as from a lamp above the rack.
      const band = b.createLinearGradient(0, 0, L.W, L.H * 0.6);
      band.addColorStop(0, "rgba(255,255,255,0.07)"); band.addColorStop(0.4, "rgba(255,255,255,0)"); band.addColorStop(0.75, "rgba(255,255,255,0.035)"); band.addColorStop(1, "rgba(0,0,0,0.12)");
      b.fillStyle = band; b.fillRect(0, 0, L.W, L.H);
      b.restore();
      const edge = b.createLinearGradient(0, 0, 0, L.H);
      edge.addColorStop(0, "rgba(255,255,255,0.42)"); edge.addColorStop(0.08, "rgba(255,255,255,0.08)"); edge.addColorStop(0.9, "rgba(0,0,0,0.3)"); edge.addColorStop(1, "rgba(0,0,0,0.75)");
      rr(b, 0.6, 0.6, L.W - 1.2, L.H - 1.2, 9.5); b.lineWidth = 1.2; b.strokeStyle = edge; b.stroke();

      // Four socket screws.
      for (const [sx, sy] of [[15, 15], [L.W - 15, 15], [15, L.H - 15], [L.W - 15, L.H - 15]]) {
        b.beginPath(); b.arc(sx, sy + 0.8, 5.6, 0, Math.PI * 2); b.fillStyle = "rgba(0,0,0,0.7)"; b.fill();
        b.beginPath(); b.arc(sx, sy, 5, 0, Math.PI * 2); b.fillStyle = metal(b, sx, sy, 5); b.fill();
        hex(b, sx, sy, 2.6, sx * 0.7); b.fillStyle = "#0b0b0c"; b.fill();
      }

      // The two recesses the meters sit in: dark at the top lip, lit at the bottom lip.
      for (const m of L.meters) {
        b.save(); b.shadowColor = "rgba(255,255,255,0.16)"; b.shadowBlur = 0; b.shadowOffsetY = 1.2 * k;
        rr(b, m.x, m.y, MW, MH, 13); b.fillStyle = "#050506"; b.fill(); b.restore();
        const lip = b.createLinearGradient(0, m.y, 0, m.y + MH);
        lip.addColorStop(0, "rgba(0,0,0,0.9)"); lip.addColorStop(0.5, "rgba(60,60,64,0.6)"); lip.addColorStop(1, "rgba(150,150,156,0.55)");
        rr(b, m.x + 3, m.y + 3, MW - 6, MH - 6, 10.5); b.lineWidth = 5; b.strokeStyle = "#17181a"; b.stroke();
        rr(b, m.x + 0.8, m.y + 0.8, MW - 1.6, MH - 1.6, 12.4); b.lineWidth = 1; b.strokeStyle = lip; b.stroke();
        rr(b, m.x + 6.2, m.y + 6.2, MW - 12.4, MH - 12.4, 8); b.lineWidth = 1; b.strokeStyle = "rgba(255,255,255,0.14)"; b.stroke();
      }

      // Drive knob scale.
      for (let i = 0; i <= 18; i++) {
        const a = ((-135 + i * 15) * Math.PI) / 180, long = i % 6 === 0, r0 = 58, r1 = long ? 68 : 63;
        b.beginPath(); b.moveTo(L.knob.x + Math.sin(a) * r0, L.knob.y - Math.cos(a) * r0); b.lineTo(L.knob.x + Math.sin(a) * r1, L.knob.y - Math.cos(a) * r1);
        b.lineWidth = long ? 1.5 : 1; b.strokeStyle = long ? "rgba(232,228,220,0.85)" : "rgba(232,228,220,0.35)"; b.stroke();
      }
      engrave(b, String(DB_MIN), L.knob.x - 60, L.knob.y + 60, 8.5);
      engrave(b, `+${DB_MAX}`, L.knob.x + 60, L.knob.y + 60, 8.5);
      engrave(b, "0", L.knob.x + 58, L.knob.y - 57, 8.5);
      engrave(b, "DRIVE  dB", L.knob.x, L.knob.y + 78, 8.5, 0.5);

      // Power switch: nut, collar, legends.
      b.save(); b.shadowColor = "rgba(0,0,0,0.7)"; b.shadowBlur = 5 * k; b.shadowOffsetY = 2 * k;
      hex(b, L.sw.x, L.sw.y, 17, 0.26); b.fillStyle = metal(b, L.sw.x, L.sw.y, 17); b.fill(); b.restore();
      hex(b, L.sw.x, L.sw.y, 17, 0.26); b.lineWidth = 0.8; b.strokeStyle = "rgba(0,0,0,0.5)"; b.stroke();
      b.beginPath(); b.arc(L.sw.x, L.sw.y, 10.5, 0, Math.PI * 2); b.fillStyle = metal(b, L.sw.x, L.sw.y, -10.5); b.fill();
      b.beginPath(); b.arc(L.sw.x, L.sw.y, 7.2, 0, Math.PI * 2); b.fillStyle = "#08080a"; b.fill();
      engrave(b, "ON", L.sw.x, L.sw.y - 44, 8.5); engrave(b, "OFF", L.sw.x, L.sw.y + 45, 8.5, 0.45);
      engrave(b, "POWER", L.sw.x, L.sw.y + 62, 8.5, 0.5);
      // Chrome ring of the pilot jewel.
      b.beginPath(); b.arc(L.sw.x + 42, L.sw.y, 8.6, 0, Math.PI * 2); b.fillStyle = metal(b, L.sw.x + 42, L.sw.y, 8.6); b.fill();
      b.beginPath(); b.arc(L.sw.x + 42, L.sw.y, 6.2, 0, Math.PI * 2); b.fillStyle = "#0a0707"; b.fill();

      // Headphone socket.
      b.save(); b.shadowColor = "rgba(0,0,0,0.7)"; b.shadowBlur = 5 * k; b.shadowOffsetY = 2 * k;
      hex(b, L.jack.x, L.jack.y, 18, 0.1); b.fillStyle = metal(b, L.jack.x, L.jack.y, 18); b.fill(); b.restore();
      b.beginPath(); b.arc(L.jack.x, L.jack.y, 12, 0, Math.PI * 2); b.fillStyle = metal(b, L.jack.x, L.jack.y, -12); b.fill();
      b.lineWidth = 0.7; b.strokeStyle = "rgba(0,0,0,0.5)"; b.stroke();
      const hole = b.createRadialGradient(L.jack.x - 1, L.jack.y - 2, 1, L.jack.x, L.jack.y, 7.4);
      hole.addColorStop(0, "#000"); hole.addColorStop(0.75, "#060606"); hole.addColorStop(1, "#2a2b2e");
      b.beginPath(); b.arc(L.jack.x, L.jack.y, 7.4, 0, Math.PI * 2); b.fillStyle = hole; b.fill();
      engrave(b, "PHONES", L.jack.x, L.jack.y + 62, 8.5, 0.5);
      if (!narrow) engrave(b, "STEREO LEVEL  /  TYPE 2B", L.jack.x, L.jack.y - 44, 7.5, 0.34);

      // The printed scale.
      const s = scale.getContext("2d");
      if (!s) return;
      scale.width = Math.ceil(MW * k); scale.height = Math.ceil(MH * k);
      s.setTransform(k, 0, 0, k, 0, 0);
      const INK = "#1c140a", RED = "#b3261a";
      const zero = needleAngle(frac(0)) - Math.PI / 2, lo = needleAngle(frac(-20)) - Math.PI / 2, hi = needleAngle(1) - Math.PI / 2;
      s.lineCap = "butt";
      s.beginPath(); s.arc(PX, PY, R, lo, zero); s.lineWidth = 1.5; s.strokeStyle = INK; s.stroke();
      s.beginPath(); s.arc(PX, PY, R + 2.6, zero, hi); s.lineWidth = 6.6; s.strokeStyle = RED; s.stroke();
      s.textAlign = "center"; s.textBaseline = "middle";
      for (const m of MARKS) {
        const a = needleAngle(frac(m)), sin = Math.sin(a), cos = -Math.cos(a), red = m > 0;
        s.beginPath(); s.moveTo(PX + sin * R, PY + cos * R); s.lineTo(PX + sin * (R + 11), PY + cos * (R + 11));
        s.lineWidth = m === 0 ? 2 : 1.4; s.strokeStyle = red ? RED : INK; s.stroke();
        s.font = `700 ${m === 0 ? 14 : 12}px ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif`;
        s.fillStyle = red ? RED : INK; s.fillText(String(Math.abs(m)), PX + sin * (R + 22), PY + cos * (R + 22));
      }
      // Half-step ticks between the numbers.
      for (const m of [-15, -8.5, -6, -4, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5]) {
        const a = needleAngle(frac(m)), sin = Math.sin(a), cos = -Math.cos(a);
        s.beginPath(); s.moveTo(PX + sin * R, PY + cos * R); s.lineTo(PX + sin * (R + 6), PY + cos * (R + 6));
        s.lineWidth = 0.9; s.strokeStyle = m > 0 ? RED : INK; s.stroke();
      }
      s.font = `700 13px ui-sans-serif, system-ui, sans-serif`;
      const aMinus = needleAngle(frac(-20) - 0.075), aPlus = needleAngle(1.07);
      s.fillStyle = INK; s.fillText("−", PX + Math.sin(aMinus) * (R + 22), PY - Math.cos(aMinus) * (R + 22));
      s.fillStyle = RED; s.fillText("+", PX + Math.sin(aPlus) * (R + 20), PY - Math.cos(aPlus) * (R + 20));
      // The percentage scale underneath, as on a broadcast meter.
      s.beginPath(); s.arc(PX, PY, R - 13, needleAngle(0) - Math.PI / 2, zero); s.lineWidth = 0.8; s.strokeStyle = INK; s.stroke();
      s.font = `600 7.5px ui-sans-serif, system-ui, sans-serif`; s.fillStyle = INK;
      for (let p = 0; p <= 100; p += 10) {
        const a = needleAngle((p / 100) * frac(0)), sin = Math.sin(a), cos = -Math.cos(a), long = p % 20 === 0;
        s.beginPath(); s.moveTo(PX + sin * (R - 13), PY + cos * (R - 13)); s.lineTo(PX + sin * (R - (long ? 19 : 16.5)), PY + cos * (R - (long ? 19 : 16.5)));
        s.lineWidth = 0.8; s.stroke();
        if (long) s.fillText(String(p), PX + sin * (R - 26.5), PY + cos * (R - 26.5));
      }
      s.font = `800 27px ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif`; s.fillStyle = INK; s.fillText("VU", PX, PY - 66);
      s.font = `600 6.5px ui-monospace, SFMono-Regular, Menlo, monospace`; s.fillStyle = "rgba(28,20,10,0.7)"; s.fillText("PROGRAMME LEVEL", PX, PY - 46);
    };

    const fit = () => {
      const w = cv.clientWidth || L.W;
      k = (w / L.W) * Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(L.W * k); cv.height = Math.round(L.H * k);
      build();
    };

    // Needle state. x is the fraction of full scale, v its speed.
    const s = { x: [0, 0], v: [0, 0], peak: [0, 0], lamp: 0, lever: 1, leverV: 0, knob: 0, knobV: 0, light: -0.3, lightTo: -0.3, n: [0, 0], nTo: [0, 0], nAt: 0 };
    const knobTarget = () => (live.current.db - DB_MIN) / (DB_MAX - DB_MIN);
    s.knob = knobTarget();

    // The pretend programme: kick, snare, a bass line that swells, and a little hiss, a touch different per side.
    const signal = (t: number, ch: number) => {
      const beat = (t * TEMPO) / 60, ph = beat % 1, n = Math.floor(beat) % 4;
      const kick = Math.exp(-ph * 6.5) * (n % 2 === 0 ? 1 : 0.5);
      const snare = n % 2 === 1 ? Math.exp(-ph * 9) : 0;
      const off = Math.exp(-((beat * 2) % 1) * 12) * 0.22;
      const swell = 0.8 + 0.2 * Math.sin(t * 0.37 + ch * 0.5) * Math.sin(t * 0.11 + 1);
      const bass = 0.3 + 0.16 * Math.sin(t * 1.9 + ch);
      return swell * (bass + kick * (ch ? 0.42 : 0.6) + snare * (ch ? 0.62 : 0.3) + off + s.n[ch] * 0.16);
    };

    const face = (m: { x: number; y: number }, ch: number) => {
      const fx = m.x + 9, fy = m.y + 9, fw = MW - 18, fh = MH - 18, px = m.x + PX, py = m.y + PY;
      ctx.save(); rr(ctx, fx, fy, fw, fh, 5.5); ctx.clip();
      // Card stock, first unlit and then with the lamps behind it.
      const dull = ctx.createLinearGradient(0, fy, 0, fy + fh);
      dull.addColorStop(0, "#8f8466"); dull.addColorStop(1, "#6f6650");
      ctx.fillStyle = dull; ctx.fillRect(fx, fy, fw, fh);
      const glow = ctx.createRadialGradient(px, fy + fh + 34, 18, px, fy + fh - 10, 268);
      glow.addColorStop(0, "#fffbe6"); glow.addColorStop(0.3, "#fdebb2"); glow.addColorStop(0.62, "#f3c672"); glow.addColorStop(0.86, "#d99a45"); glow.addColorStop(1, "#b0702a");
      ctx.globalAlpha = s.lamp; ctx.fillStyle = glow; ctx.fillRect(fx, fy, fw, fh); ctx.globalAlpha = 1;
      ctx.drawImage(scale, m.x, m.y, MW, MH);

      // Needle and the shadow it throws on the card a few millimetres behind it.
      const a = needleAngle(s.x[ch]), sin = Math.sin(a), cos = -Math.cos(a);
      const line = (ox: number, oy: number, w0: number, col: string) => {
        ctx.beginPath(); ctx.moveTo(px + ox + sin * 14 - cos * w0, py + oy + cos * 14 + sin * w0); ctx.lineTo(px + ox + sin * (R + 9), py + oy + cos * (R + 9));
        ctx.lineTo(px + ox + sin * 14 + cos * w0, py + oy + cos * 14 - sin * w0); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      };
      ctx.save(); ctx.filter = "blur(1.6px)"; line(5 + s.light * 3, 6, 1.8, `rgba(70,36,4,${0.2 + 0.2 * s.lamp})`); ctx.restore();
      line(0, 0, 1.25, "#120c06");
      ctx.beginPath(); ctx.moveTo(px + sin * 16, py + cos * 16); ctx.lineTo(px + sin * (R + 6), py + cos * (R + 6)); ctx.lineWidth = 0.4; ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.stroke();

      // The cowl over the movement.
      const cowl = ctx.createLinearGradient(0, py - 34, 0, py + 20);
      cowl.addColorStop(0, "#35363a"); cowl.addColorStop(0.2, "#17181a"); cowl.addColorStop(1, "#050506");
      ctx.save(); ctx.shadowColor = "rgba(40,20,0,0.55)"; ctx.shadowBlur = 9 * k; ctx.shadowOffsetY = 3 * k;
      ctx.beginPath(); ctx.arc(px, py + 16, 46, Math.PI, 0); ctx.lineTo(px + 46, py + 40); ctx.lineTo(px - 46, py + 40); ctx.closePath(); ctx.fillStyle = cowl; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(px, py + 16, 45.4, Math.PI * 1.08, Math.PI * 1.92); ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(px, py + 1, 3.6, 0, Math.PI * 2); ctx.fillStyle = metal(ctx, px, py + 1, 3.6); ctx.fill();
      ctx.beginPath(); ctx.moveTo(px - 2.4, py + 1); ctx.lineTo(px + 2.4, py + 1); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(0,0,0,0.75)"; ctx.stroke();

      // Channel name and the peak lamp.
      ctx.font = "700 7.5px ui-monospace, SFMono-Regular, Menlo, monospace"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
      ctx.fillStyle = "rgba(28,20,10,0.78)"; ctx.fillText(channels[ch].toUpperCase(), fx + 12, fy + fh - 13);
      ctx.textAlign = "right"; ctx.fillText("PEAK", fx + fw - 24, fy + fh - 13);
      const lx = fx + fw - 14, ly = fy + fh - 13.5, pk = Math.min(1, s.peak[ch]) * s.lamp;
      ctx.beginPath(); ctx.arc(lx, ly, 4.4, 0, Math.PI * 2); ctx.fillStyle = "#2a1410"; ctx.fill();
      ctx.save(); ctx.shadowColor = "#ff3b22"; ctx.shadowBlur = 12 * k * pk;
      ctx.beginPath(); ctx.arc(lx, ly, 3.2, 0, Math.PI * 2); ctx.fillStyle = `rgb(${(96 + 159 * pk) | 0},${(22 + 50 * pk) | 0},${(16 + 20 * pk) | 0})`; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(lx - 1, ly - 1.1, 1, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * pk})`; ctx.fill();

      // Glass: the bezel's shadow at the top, a darkened rim, and two slanted reflections that follow the light.
      const top = ctx.createLinearGradient(0, fy, 0, fy + 30);
      top.addColorStop(0, "rgba(20,10,0,0.55)"); top.addColorStop(0.35, "rgba(20,10,0,0.2)"); top.addColorStop(1, "rgba(20,10,0,0)");
      ctx.fillStyle = top; ctx.fillRect(fx, fy, fw, 30);
      const rim = ctx.createRadialGradient(px, fy + fh * 0.55, fh * 0.5, px, fy + fh * 0.55, fw * 0.66);
      rim.addColorStop(0, "rgba(30,14,0,0)"); rim.addColorStop(1, "rgba(30,14,0,0.42)");
      ctx.fillStyle = rim; ctx.fillRect(fx, fy, fw, fh);
      const sx = fx + fw * (0.2 + 0.2 * s.light);
      const sh = ctx.createLinearGradient(0, fy, 0, fy + fh);
      sh.addColorStop(0, "rgba(255,255,255,0.22)"); sh.addColorStop(0.6, "rgba(255,255,255,0.05)"); sh.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sh;
      ctx.beginPath(); ctx.moveTo(sx, fy); ctx.lineTo(sx + 58, fy); ctx.lineTo(sx - 46, fy + fh); ctx.lineTo(sx - 104, fy + fh); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sx + 72, fy); ctx.lineTo(sx + 86, fy); ctx.lineTo(sx - 18, fy + fh); ctx.lineTo(sx - 32, fy + fh); ctx.closePath(); ctx.fill();
      ctx.restore();
      // Light spilling from the window onto the bezel.
      ctx.save(); ctx.globalAlpha = s.lamp * 0.5; rr(ctx, fx - 0.5, fy - 0.5, fw + 1, fh + 1, 6); ctx.lineWidth = 1; ctx.strokeStyle = "#ffd58a"; ctx.shadowColor = "#ffb84d"; ctx.shadowBlur = 12 * k; ctx.stroke(); ctx.restore();
    };

    const controls = () => {
      const { sw, knob } = L;
      // Pilot jewel.
      const jx = sw.x + 42, p = s.lamp;
      ctx.save(); ctx.shadowColor = LAMP; ctx.shadowBlur = 18 * k * p;
      const jewel = ctx.createRadialGradient(jx - 1.5, sw.y - 2, 0.5, jx, sw.y, 5.6);
      jewel.addColorStop(0, p > 0.5 ? "#fff3d0" : "#7a4a1c"); jewel.addColorStop(0.5, p > 0.5 ? LAMP : "#4a2a10"); jewel.addColorStop(1, p > 0.5 ? "#b8650f" : "#22120a");
      ctx.beginPath(); ctx.arc(jx, sw.y, 5.6, 0, Math.PI * 2); ctx.fillStyle = jewel; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(jx - 1.8, sw.y - 2, 1.3, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fill();

      // Bat lever, seen from the front: it shortens as it passes through centre.
      const q = s.lever, ty = sw.y - 27 * q, len = Math.abs(q);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 7 * k; ctx.shadowOffsetX = 4 * k; ctx.shadowOffsetY = 6 * k;
      const lg = ctx.createLinearGradient(sw.x - 6, 0, sw.x + 6, 0);
      lg.addColorStop(0, "#54575c"); lg.addColorStop(0.3, "#fafbfc"); lg.addColorStop(0.55, "#a4a7ad"); lg.addColorStop(1, "#3a3c40");
      ctx.beginPath(); ctx.moveTo(sw.x - 3.6, sw.y); ctx.lineTo(sw.x - 5.6, ty); ctx.lineTo(sw.x + 5.6, ty); ctx.lineTo(sw.x + 3.6, sw.y); ctx.closePath(); ctx.fillStyle = lg; ctx.fill();
      const tip = ctx.createRadialGradient(sw.x - 2, ty - 2, 0.5, sw.x, ty, 7.5 + 1.5 * (1 - len));
      tip.addColorStop(0, "#ffffff"); tip.addColorStop(0.45, "#b9bcc2"); tip.addColorStop(1, "#4b4e53");
      ctx.beginPath(); ctx.arc(sw.x, ty, 6.2 + 1.6 * (1 - len), 0, Math.PI * 2); ctx.fillStyle = tip; ctx.fill(); ctx.restore();

      // Drive knob: a fluted black skirt under a spun aluminium cap.
      const ang = ((-135 + 270 * s.knob) * Math.PI) / 180, la = -2.3 + s.light * 0.5;
      ctx.save(); ctx.translate(knob.x, knob.y); ctx.scale(KNOB, KNOB); ctx.translate(-knob.x, -knob.y);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 16 * k; ctx.shadowOffsetX = 5 * k; ctx.shadowOffsetY = 11 * k;
      ctx.beginPath(); ctx.arc(knob.x, knob.y, 36, 0, Math.PI * 2); ctx.fillStyle = "#0a0a0b"; ctx.fill(); ctx.restore();
      const teeth = 30, step = (Math.PI * 2) / teeth;
      for (let i = 0; i < teeth; i++) {
        const t0 = ang + i * step, f = Math.cos(t0 - la - Math.PI / 2), lit = 0.5 + 0.5 * f, glint = Math.pow(Math.max(0, f), 7);
        for (let h = 0; h < 2; h++) {
          const a0 = t0 + h * step * 0.5 - Math.PI / 2, a1 = a0 + step * 0.5 + 0.004, v = h === 0 ? 30 + lit * 46 + glint * 110 : 10 + lit * 18;
          ctx.beginPath(); ctx.arc(knob.x, knob.y, h === 0 ? 37 : 34.5, a0, a1); ctx.arc(knob.x, knob.y, 24, a1, a0, true); ctx.closePath();
          ctx.fillStyle = `rgb(${v | 0},${v | 0},${(v + 3) | 0})`; ctx.fill();
        }
      }
      let cap: CanvasGradient;
      if (hasConic) {
        cap = ctx.createConicGradient(la, knob.x, knob.y);
        const stops: [number, number][] = [[0, 250], [0.08, 176], [0.2, 104], [0.3, 150], [0.42, 200], [0.5, 238], [0.58, 150], [0.7, 96], [0.82, 150], [0.93, 214], [1, 250]];
        for (const [o, v] of stops) cap.addColorStop(o, `rgb(${v - 4},${v},${Math.min(255, v + 6)})`);
      } else cap = metal(ctx, knob.x, knob.y, 26);
      ctx.beginPath(); ctx.arc(knob.x, knob.y, 26.5, 0, Math.PI * 2); ctx.fillStyle = "#0b0b0c"; ctx.fill();
      ctx.beginPath(); ctx.arc(knob.x, knob.y, 25, 0, Math.PI * 2); ctx.fillStyle = cap; ctx.fill();
      for (let r = 3; r < 25; r += 1.6) { ctx.beginPath(); ctx.arc(knob.x, knob.y, r, 0, Math.PI * 2); ctx.lineWidth = 0.5; ctx.strokeStyle = r % 3.2 < 1.6 ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.1)"; ctx.stroke(); }
      ctx.beginPath(); ctx.arc(knob.x, knob.y, 24.4, 0, Math.PI * 2); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.stroke();
      ctx.save(); ctx.translate(knob.x, knob.y); ctx.rotate(ang); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, -21.5); ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -8.5); ctx.lineTo(0, -21); ctx.lineWidth = 2.4; ctx.strokeStyle = "#16161a"; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -34.5); ctx.lineTo(0, -29); ctx.lineWidth = 2; ctx.strokeStyle = "#f1ede4"; ctx.stroke();
      ctx.restore();
      ctx.restore();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      L.meters.forEach((m, i) => face(m, i));
      controls();
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9;
    const gain = () => Math.pow(10, (DB_MIN + s.knob * (DB_MAX - DB_MIN)) / 20);
    const W0 = 13.2, ZETA = 0.8; // 300 ms to reach the mark, about one percent of overshoot
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000, pw = live.current.on;
      // Filament warm-up, lever throw and knob follow.
      s.lamp += ((pw ? 1 : 0) - s.lamp) * Math.min(1, dt * (pw ? 5 : 9));
      s.leverV += (900 * ((pw ? 1 : -1) - s.lever) - 34 * s.leverV) * dt; s.lever += s.leverV * dt;
      s.knobV += (300 * (knobTarget() - s.knob) - 30 * s.knobV) * dt; s.knob += s.knobV * dt;
      if (now - touched > 2500) s.lightTo = 0.45 * Math.sin(t * 0.5);
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 5);
      if (t > s.nAt) { s.nAt = t + 0.07; s.nTo = [Math.random(), Math.random()]; }
      for (let ch = 0; ch < 2; ch++) {
        s.n[ch] += (s.nTo[ch] - s.n[ch]) * Math.min(1, dt * 20);
        const raw = signal(t, ch) * gain() * 1.12, target = pw ? Math.min(1.25, raw > 0.7 ? 0.7 + (raw - 0.7) * 0.5 : raw) : 0;
        for (let i = 0; i < 4; i++) {
          const h = dt / 4;
          s.v[ch] += (W0 * W0 * (target - s.x[ch]) - 2 * ZETA * W0 * s.v[ch]) * h; s.x[ch] += s.v[ch] * h;
          // End stops: the needle taps the pin and comes off it.
          if (s.x[ch] > 1.06) { s.x[ch] = 1.06; s.v[ch] *= -0.25; }
          if (s.x[ch] < -0.02) { s.x[ch] = -0.02; s.v[ch] *= -0.3; }
        }
        s.peak[ch] = target > frac(0) * 1.06 && pw ? 1.6 : Math.max(0, s.peak[ch] - dt * 3.2);
      }
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const still = () => {
      const pw = live.current.on, g = Math.pow(10, live.current.db / 20);
      s.knob = knobTarget(); s.lamp = pw ? 1 : 0; s.lever = pw ? 1 : -1;
      s.x = pw ? [Math.min(1.04, 0.62 * g), Math.min(1.04, 0.54 * g)] : [0, 0];
      s.peak = s.x.map((x) => (x > frac(0) ? 1 : 0));
      draw();
    };
    const wake = () => { if (reduce) still(); else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    api.current = { poke: wake };
    fit(); wake();

    // Turning the knob by its rim, like the real thing.
    let drag = false, lastA = 0, val = 0;
    const angleAt = (e: PointerEvent) => { const b = pad.getBoundingClientRect(); return Math.atan2(e.clientX - (b.left + b.width / 2), -(e.clientY - (b.top + b.height / 2))); };
    const onDown = (e: PointerEvent) => { drag = true; lastA = angleAt(e); val = (live.current.db - DB_MIN) / (DB_MAX - DB_MIN); pad.setPointerCapture(e.pointerId); e.preventDefault(); };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      const a = angleAt(e); let d = a - lastA; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; lastA = a;
      val = Math.max(0, Math.min(1, val + d / ((270 * Math.PI) / 180)));
      const next = Math.round(DB_MIN + val * (DB_MAX - DB_MIN));
      if (next !== live.current.db) { live.current.db = next; setDb(next); wake(); }
    };
    const onUp = () => { drag = false; };
    const onLight = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); touched = performance.now(); s.lightTo = Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1)); };
    pad.addEventListener("pointerdown", onDown); pad.addEventListener("pointermove", onMove);
    pad.addEventListener("pointerup", onUp); pad.addEventListener("pointercancel", onUp);
    const host = cv.parentElement;
    host?.addEventListener("pointermove", onLight);
    const ro = new ResizeObserver(() => { fit(); if (reduce) still(); });
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
  }, [narrow]);

  const L = layoutFor(narrow);
  const change = (next: number) => { const v = Math.max(DB_MIN, Math.min(DB_MAX, next)); live.current.db = v; setDb(v); api.current?.poke(); };
  const flip = () => { live.current.on = !live.current.on; setOn(live.current.on); api.current?.poke(); };
  const onKey = (e: ReactKeyboardEvent) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowUp" ? db + 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? db - 1 : e.key === "PageUp" ? db + 3 : e.key === "PageDown" ? db - 3 : e.key === "Home" ? DB_MIN : e.key === "End" ? DB_MAX : null;
    if (next === null) return;
    e.preventDefault(); change(next);
  };
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const sign = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : "0");

  return (
    <div ref={stage} className="flex min-h-[720px] w-full flex-col items-center justify-center bg-[#0a0908] bg-[radial-gradient(90%_70%_at_50%_42%,#211b14_0%,#0a0908_70%)] px-4 py-14">
      <div
        className="relative w-full rounded-[10px] shadow-[0_1px_0_rgba(255,255,255,0.06),0_2px_3px_rgba(0,0,0,0.7),0_18px_30px_-8px_rgba(0,0,0,0.75),0_60px_90px_-20px_rgba(0,0,0,0.9)]"
        style={{ maxWidth: L.W, aspectRatio: `${L.W} / ${L.H}` }}
      >
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full rounded-[10px]" />
        <button
          type="button"
          aria-pressed={on}
          aria-label="Power"
          onClick={flip}
          style={{ left: pct(L.sw.x - 26, L.W), top: pct(L.sw.y - 40, L.H), width: pct(52, L.W), height: pct(80, L.H) }}
          className="absolute cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#ffb648]"
        />
        <div
          ref={knobHit}
          role="slider"
          tabIndex={0}
          aria-label="Input drive"
          aria-valuemin={DB_MIN}
          aria-valuemax={DB_MAX}
          aria-valuenow={db}
          aria-valuetext={`${db > 0 ? "plus " : db < 0 ? "minus " : ""}${Math.abs(db)} decibels`}
          onKeyDown={onKey}
          style={{ left: pct(L.knob.x - 52, L.W), top: pct(L.knob.y - 52, L.H), width: pct(104, L.W), height: pct(104, L.H) }}
          className="absolute cursor-grab touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#ffb648] active:cursor-grabbing"
        />
      </div>
      <p aria-live="polite" className="mt-10 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-stone-400">
        <span className="text-stone-200">{on ? "Power on" : "Power off"}</span>
        <span className="mx-2 text-stone-600">/</span>
        Drive {sign(db)} dB
      </p>
    </div>
  );
}

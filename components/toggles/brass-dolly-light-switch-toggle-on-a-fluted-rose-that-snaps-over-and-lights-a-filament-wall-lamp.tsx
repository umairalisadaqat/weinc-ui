import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

// Everything a visitor is likely to change sits here.
const LABEL = "Hall lamp"; // what the switch controls, read out and shown in the caption
const START_ON = true; // the state it opens in
const FLUTES = 28; // ribs round the brass rose
const SNAP = 1150; // spring that throws the dolly over: higher is a harder snap
const BOUNCE = 0.34; // how much speed the dolly keeps when it hits its stop
const WARM_UP = 9; // how fast the filament comes up to full brightness
const COOL_DOWN = 4.5; // how fast it fades after the contact opens
const SELF_RUN = true; // flick itself off and on while nobody is touching it

const W = 340, H = 340; // drawing units: the canvas is scaled to whatever box it is given
const SX = 96, SY = 190, PLATE = 58; // the switch
const BX = 246, BY = 98, BULB = 46; // the lamp
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export default function BrassDollyLightSwitch() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(START_ON);
  const onRef = useRef(START_ON);
  const api = useRef<{ flip: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, btn = button.current, pool = glow.current;
    if (!cv || !btn || !pool) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const k = 1.9 * Math.min(2, window.devicePixelRatio || 1); // sharp at its largest shown size
    cv.width = W * k; cv.height = H * k;

    // Brass runs from a green-black shadow through ochre to a pale straw highlight.
    const ramp: [number, number, number, number][] = [[0, 16, 12, 4], [60, 78, 54, 14], [120, 148, 108, 34], [180, 208, 164, 70], [226, 244, 214, 132], [255, 255, 248, 222]];
    const brass = (v: number) => {
      const c = clamp(v, 0, 255);
      let i = 0;
      while (i < ramp.length - 2 && c > ramp[i + 1][0]) i++;
      const p = ramp[i], q = ramp[i + 1], t = (c - p[0]) / (q[0] - p[0]);
      return `rgb(${(p[1] + (q[1] - p[1]) * t) | 0},${(p[2] + (q[2] - p[2]) * t) | 0},${(p[3] + (q[3] - p[3]) * t) | 0})`;
    };

    // tilt: -1 is up (off), +1 is down (on). lamp is the filament brightness from 0 to 1.
    const s = { tilt: START_ON ? 1 : -1, vel: 0, target: START_ON ? 1 : -1, lamp: START_ON ? 1 : 0, held: false, flipped: false };
    const ROOM = 0.6; // the dim daylight that is always there, coming from the upper left
    const roomAt = -2.3; // its direction

    // How bright a surface is when its normal points along `a`, seen from a point at (x, y).
    const lit = (a: number, x: number, y: number, power = 1.4) => {
      const toLamp = Math.atan2(BY - y, BX - x);
      return ROOM * Math.pow(Math.max(0, Math.cos(a - roomAt)), power) + s.lamp * 1.08 * Math.pow(Math.max(0, Math.cos(a - toLamp)), power);
    };
    // A ring shaded all the way round, for rolled edges and collars.
    const hasConic = typeof ctx.createConicGradient === "function";
    const ring = (x: number, y: number, r: number, width: number, lo: number, gain: number, inward = false) => {
      const n = hasConic ? 60 : 180; ctx.lineWidth = width; ctx.lineCap = "butt";
      const tone = (a: number) => brass(lo + gain * lit(inward ? a + Math.PI : a, x, y));
      if (hasConic) {
        const g = ctx.createConicGradient(0, x, y);
        for (let i = 0; i <= n; i++) g.addColorStop(i / n, tone((i / n) * Math.PI * 2));
        ctx.strokeStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
        return;
      }
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        ctx.strokeStyle = tone(a); ctx.beginPath(); ctx.arc(x, y, r, a - 0.006, a + (Math.PI * 2) / n + 0.006); ctx.stroke();
      }
    };
    // A polished dome. Polished brass is mostly dark with small hard highlights, one for each light,
    // and a thin bright line round the far edge where it picks up the wall.
    const dome = (x: number, y: number, r: number, lo: number, hi: number) => {
      const level = ROOM + s.lamp * 0.6;
      const body = ctx.createRadialGradient(x + Math.cos(roomAt) * r * 0.3, y + Math.sin(roomAt) * r * 0.3, 0, x, y, r);
      body.addColorStop(0, brass(lo + (hi - lo) * 0.62 * level)); body.addColorStop(0.5, brass(lo + (hi - lo) * 0.22 * level)); body.addColorStop(0.86, brass(lo * 0.42)); body.addColorStop(1, brass(lo * 0.42 + 70 * level));
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill();
      const spot = (dir: number, strength: number, warm: boolean) => {
        if (strength <= 0.01) return;
        const hx = x + Math.cos(dir) * r * 0.52, hy = y + Math.sin(dir) * r * 0.52;
        const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 0.8);
        const c = warm ? "255,232,160" : "240,238,214";
        g.addColorStop(0, `rgba(255,252,236,${Math.min(1, 1.1 * strength)})`); g.addColorStop(0.1, `rgba(${c},${0.8 * strength})`); g.addColorStop(0.34, `rgba(${c},${0.26 * strength})`); g.addColorStop(1, `rgba(${c},0)`);
        ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
      };
      spot(roomAt, ROOM, false); spot(Math.atan2(BY - y, BX - x), s.lamp, true);
    };
    // A shadow thrown on the wall: a short one from the room and a long one away from the lamp.
    const wallShadow = (x: number, y: number, r: number, depth: number) => {
      const d = Math.hypot(x - BX, y - BY) || 1, ux = (x - BX) / d, uy = (y - BY) / d;
      const cast = (ox: number, oy: number, blur: number, alpha: number) => {
        if (alpha <= 0.01) return;
        ctx.save(); ctx.shadowColor = `rgba(2,6,4,${alpha})`; ctx.shadowBlur = blur * k; ctx.shadowOffsetX = ox * k; ctx.shadowOffsetY = oy * k + 1000 * k;
        ctx.beginPath(); ctx.arc(x, y - 1000, r, 0, Math.PI * 2); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      };
      cast(depth * 0.35, depth * 0.7, depth * 1.3, 0.6);
      cast(ux * depth * 1.5, uy * depth * 1.5 + depth * 0.3, depth * 1.2, 0.7 * s.lamp);
    };

    const drawSwitch = () => {
      wallShadow(SX, SY, PLATE - 1, 11);
      // The rolled outer edge and the flat it stands on.
      ctx.beginPath(); ctx.arc(SX, SY, PLATE, 0, Math.PI * 2); ctx.fillStyle = brass(30); ctx.fill();
      ring(SX, SY, PLATE - 2.4, 4.8, 22, 215);
      ring(SX, SY, PLATE - 1.1, 1, 10, 90);
      ring(SX, SY, PLATE - 5.2, 1.2, 16, 130, true);

      // The fluted band. Each rib is a half-round with a rounded outer end, shaded across its width in fourteen strips.
      const r0 = 27, r1 = PLATE - 5.6, step = (Math.PI * 2) / FLUTES, toLamp = Math.atan2(BY - SY, BX - SX);
      const half = (r1 * step) / 2 / (1 + step / 2) * 0.96; // radius of the rounded end
      ctx.beginPath(); ctx.arc(SX, SY, r1 + 0.6, 0, Math.PI * 2); ctx.fillStyle = brass(14 + 30 * s.lamp); ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(SX, SY, r1 - half, 0, Math.PI * 2);
      for (let i = 0; i < FLUTES; i++) { const cx = SX + Math.cos(i * step) * (r1 - half), cy = SY + Math.sin(i * step) * (r1 - half); ctx.moveTo(cx + half, cy); ctx.arc(cx, cy, half, 0, Math.PI * 2); }
      ctx.clip();
      const STRIPS = 14;
      for (let i = 0; i < FLUTES; i++) {
        const mid = i * step;
        for (let j = 0; j < STRIPS; j++) {
          const lean = ((j + 0.5) / STRIPS) * 2 - 1; // -1 on one flank, 0 on the crest, +1 on the other flank
          const a0 = mid + (j / STRIPS - 0.5) * step, a1 = a0 + step / STRIPS + 0.003, a = (a0 + a1) / 2;
          const up = Math.sqrt(1 - lean * lean);
          const face = (dir: number) => Math.max(0, lean * Math.sin(dir - a) * 0.86 + up * 0.5 + Math.cos(dir - a) * 0.12);
          const fr = face(roomAt), fl = face(toLamp);
          const v = 26 + 150 * (ROOM * fr + s.lamp * fl) + 120 * (ROOM * Math.pow(fr, 5) + s.lamp * Math.pow(fl, 5)) - 44 * Math.pow(Math.abs(lean), 5);
          ctx.beginPath(); ctx.arc(SX, SY, r1 + 1, a0, a1); ctx.arc(SX, SY, r0, a1, a0, true); ctx.closePath();
          ctx.fillStyle = brass(v); ctx.fill();
        }
      }
      ctx.restore();
      // The band dishes down towards the middle, so it darkens there and under the rim.
      const dish = ctx.createRadialGradient(SX, SY, r0, SX, SY, r1);
      dish.addColorStop(0, "rgba(8,6,0,0.6)"); dish.addColorStop(0.28, "rgba(8,6,0,0.06)"); dish.addColorStop(0.8, "rgba(8,6,0,0)"); dish.addColorStop(1, "rgba(8,6,0,0.36)");
      ctx.beginPath(); ctx.arc(SX, SY, r1, 0, Math.PI * 2); ctx.arc(SX, SY, r0, 0, Math.PI * 2, true); ctx.fillStyle = dish; ctx.fill("evenodd");

      // The turned boss in the middle, with a stepped collar round the slot.
      ring(SX, SY, r0 - 0.4, 2.4, 30, 210);
      dome(SX, SY, r0 - 1.6, 96, 250);
      ring(SX, SY, 15.6, 1.4, 14, 110, true);
      dome(SX, SY, 14.9, 84, 236);
      // The slot the dolly rocks in.
      const slot = (inset: number, fill: string) => { ctx.beginPath(); ctx.roundRect(SX - 5.8 + inset, SY - 11 + inset, 11.6 - inset * 2, 22 - inset * 2, 5.8 - inset); ctx.fillStyle = fill; ctx.fill(); };
      slot(-0.9, brass(40 + 170 * lit(Math.PI / 2, SX, SY))); slot(0, "#070502");

      // The dolly, seen end on: a tapered brass stalk with a ball end that comes towards you.
      const tx = SX, ty = SY + s.tilt * 16.5;
      const lean = Math.abs(s.tilt), rb = 5.4, rt = 9.6;
      // Its shadow falls on the boss, away from whichever light is stronger.
      const d = Math.hypot(SX - BX, SY - BY), ux = (SX - BX) / d, uy = (SY - BY) / d;
      ctx.save(); ctx.beginPath(); ctx.arc(SX, SY, r0 - 1.6, 0, Math.PI * 2); ctx.clip();
      ctx.shadowColor = `rgba(10,6,0,${0.55 + 0.3 * s.lamp})`; ctx.shadowBlur = 5 * k;
      ctx.shadowOffsetX = (2.5 * (1 - s.lamp) + ux * 9 * s.lamp) * k; ctx.shadowOffsetY = (4 * (1 - s.lamp) + (uy * 9 + 2) * s.lamp) * k + 1000 * k;
      ctx.lineCap = "round"; ctx.lineWidth = rt * 1.8; ctx.strokeStyle = "#000";
      ctx.beginPath(); ctx.moveTo(SX, SY - 1000); ctx.lineTo(tx, ty - 1000 + 0.01); ctx.stroke(); ctx.restore();
      if (lean > 0.05) {
        const dirY = Math.sign(s.tilt);
        const stalk = ctx.createLinearGradient(SX - rt, 0, SX + rt, 0);
        const sideL = lit(Math.PI, SX, SY, 1), sideR = lit(0, SX, SY, 1);
        stalk.addColorStop(0, brass(24 + 150 * sideL)); stalk.addColorStop(0.3, brass(70 + 190 * (ROOM + s.lamp * 0.25))); stalk.addColorStop(0.55, brass(52 + 90 * (ROOM + s.lamp * 0.5)));
        stalk.addColorStop(0.8, brass(60 + 215 * sideR)); stalk.addColorStop(1, brass(18 + 110 * sideR));
        ctx.beginPath(); ctx.moveTo(SX - rb, SY); ctx.lineTo(tx - rt, ty); ctx.lineTo(tx + rt, ty); ctx.lineTo(SX + rb, SY);
        ctx.arc(SX, SY, rb, 0, Math.PI, dirY > 0); ctx.closePath(); ctx.fillStyle = stalk; ctx.fill();
      }
      ctx.save(); ctx.shadowColor = "rgba(10,6,0,0.6)"; ctx.shadowBlur = 3 * k; ctx.shadowOffsetY = 1.5 * k;
      ctx.beginPath(); ctx.arc(tx, ty, rt, 0, Math.PI * 2); ctx.fillStyle = brass(60); ctx.fill(); ctx.restore();
      dome(tx, ty, rt, 104, 255);
      ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(10,6,0,0.5)"; ctx.beginPath(); ctx.arc(tx, ty, rt, 0, Math.PI * 2); ctx.stroke();
    };

    const drawLamp = () => {
      const L = s.lamp, baseY = BY + 152;
      // Back plate on the wall, the arm that rises from it and the lampholder.
      wallShadow(BX, baseY, 21, 8);
      ctx.beginPath(); ctx.arc(BX, baseY, 22, 0, Math.PI * 2); ctx.fillStyle = brass(26); ctx.fill();
      ring(BX, baseY, 20.4, 3.4, 26, 190);
      dome(BX, baseY, 18.6, 84, 232);
      ring(BX, baseY, 9.6, 1.2, 14, 80, true);
      dome(BX, baseY, 9, 80, 236);
      const tube = (x: number, y0: number, y1: number, half: number, lo: number) => {
        const g = ctx.createLinearGradient(x - half, 0, x + half, 0);
        const l = lit(Math.PI, x, y0, 1), r = lit(0, x, y0, 1), top = ROOM * 0.6 + L * 0.55;
        g.addColorStop(0, brass(lo * 0.5 + 60 * l)); g.addColorStop(0.24, brass(lo + 230 * Math.max(l, top * 0.9))); g.addColorStop(0.5, brass(lo + 110 * top)); g.addColorStop(0.8, brass(lo + 150 * Math.max(r, top * 0.5))); g.addColorStop(1, brass(lo * 0.4));
        ctx.fillStyle = g; ctx.fillRect(x - half, y0, half * 2, y1 - y0);
      };
      ctx.save(); ctx.shadowColor = "rgba(8,5,0,0.6)"; ctx.shadowBlur = 5 * k; ctx.shadowOffsetX = 3 * k; ctx.shadowOffsetY = 2 * k;
      ctx.fillStyle = brass(40); ctx.fillRect(BX - 3.6, BY + 88, 7.2, 62); ctx.restore();
      tube(BX, BY + 86, baseY, 3.6, 46);
      // A knuckle on the arm, the cup and its lip.
      tube(BX, BY + 92, BY + 98, 5.6, 56);
      ctx.beginPath(); ctx.moveTo(BX - 14.5, BY + 60); ctx.lineTo(BX + 14.5, BY + 60); ctx.lineTo(BX + 11, BY + 86); ctx.quadraticCurveTo(BX, BY + 91, BX - 11, BY + 86); ctx.closePath();
      ctx.save(); ctx.clip(); tube(BX, BY + 58, BY + 92, 14.5, 50);
      // Fine knurling round the cup and the shade thrown by the lip.
      for (let x = -14; x <= 14; x += 1.7) { ctx.fillStyle = "rgba(10,6,0,0.28)"; ctx.fillRect(BX + x, BY + 70, 0.8, 7); }
      ctx.fillStyle = "rgba(10,6,0,0.3)"; ctx.fillRect(BX - 15, BY + 69, 30, 0.8); ctx.fillRect(BX - 15, BY + 77, 30, 0.8);
      const under = ctx.createLinearGradient(0, BY + 60, 0, BY + 92); under.addColorStop(0, `rgba(8,5,0,${0.2 + 0.35 * L})`); under.addColorStop(0.5, "rgba(8,5,0,0)"); under.addColorStop(1, "rgba(8,5,0,0.45)");
      ctx.fillStyle = under; ctx.fillRect(BX - 15, BY + 58, 30, 36); ctx.restore();
      ctx.beginPath(); ctx.roundRect(BX - 16.5, BY + 56, 33, 5.4, 2.4); ctx.save(); ctx.clip(); tube(BX, BY + 55, BY + 62, 16.5, 70);
      ctx.fillStyle = `rgba(255,236,170,${0.5 * L})`; ctx.fillRect(BX - 16.5, BY + 56, 33, 1.6); ctx.restore();

      // The bulb: a clear globe on a short neck.
      const glass = new Path2D();
      glass.arc(BX, BY, BULB, Math.PI * 0.5 + 0.36, Math.PI * 0.5 - 0.36 + Math.PI * 2);
      glass.bezierCurveTo(BX + 13, BY + 49, BX + 12.4, BY + 52, BX + 12.4, BY + 58);
      glass.lineTo(BX - 12.4, BY + 58);
      glass.bezierCurveTo(BX - 12.4, BY + 52, BX - 13, BY + 49, BX - Math.sin(0.36) * BULB, BY + Math.cos(0.36) * BULB);
      glass.closePath();
      // Light spilling off the glass onto the wall close to it.
      if (L > 0.01) {
        const bloom = ctx.createRadialGradient(BX, BY, BULB * 0.5, BX, BY, 93);
        bloom.addColorStop(0, `rgba(255,200,120,${0.6 * L})`); bloom.addColorStop(0.5, `rgba(255,176,90,${0.2 * L})`); bloom.addColorStop(1, "rgba(255,170,80,0)");
        ctx.fillStyle = bloom; ctx.fillRect(BX - 94, BY - 94, 188, 188);
      }
      ctx.save(); ctx.clip(glass);
      const shell = ctx.createRadialGradient(BX, BY, BULB * 0.25, BX, BY, BULB);
      shell.addColorStop(0, "rgba(190,214,204,0.05)"); shell.addColorStop(0.72, "rgba(190,214,204,0.09)"); shell.addColorStop(0.93, "rgba(214,236,226,0.3)"); shell.addColorStop(1, "rgba(236,250,244,0.5)");
      ctx.fillStyle = shell; ctx.fillRect(BX - BULB, BY - BULB, BULB * 2, BULB * 2 + 14);
      const fill = ctx.createRadialGradient(BX, BY - 2, 2, BX, BY, BULB);
      fill.addColorStop(0, `rgba(255,244,214,${0.96 * L})`); fill.addColorStop(0.3, `rgba(255,208,128,${0.8 * L})`); fill.addColorStop(0.75, `rgba(255,166,62,${0.5 * L})`); fill.addColorStop(1, `rgba(255,150,40,${0.62 * L})`);
      ctx.fillStyle = fill; ctx.fillRect(BX - BULB, BY - BULB, BULB * 2, BULB * 2 + 14);

      // The glass stem and the cage of filament it holds up.
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.lineWidth = 5; ctx.strokeStyle = `rgba(220,240,232,${0.16 + 0.1 * L})`; ctx.beginPath(); ctx.moveTo(BX, BY + 56); ctx.lineTo(BX, BY + 15); ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = `rgba(240,252,246,${0.4})`; ctx.beginPath(); ctx.moveTo(BX - 2.2, BY + 54); ctx.lineTo(BX - 2.2, BY + 17); ctx.stroke();
      const loops = 7, cage: [number, number][] = [];
      for (let i = 0; i <= loops * 2; i++) {
        const a = (i / (loops * 2)) * Math.PI * 2 + 0.3, top = i % 2 === 0;
        cage.push([BX + Math.cos(a) * (top ? 15 : 12), BY + (top ? -22 : 10) + Math.sin(a) * (top ? 4.5 : 3.5)]);
      }
      ctx.lineWidth = 0.7; ctx.strokeStyle = `rgba(20,14,6,${0.75 * (1 - L)})`;
      for (const [x, y] of cage.filter((_, i) => i % 4 === 1)) { ctx.beginPath(); ctx.moveTo(BX, BY + 16); ctx.lineTo(x, y); ctx.stroke(); }
      const trace = () => { ctx.beginPath(); cage.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
      ctx.lineWidth = 0.9; ctx.strokeStyle = `rgba(34,24,12,${0.9 * (1 - L)})`; trace(); ctx.stroke();
      if (L > 0.01) {
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        ctx.shadowColor = "rgba(255,150,40,1)"; ctx.shadowBlur = 12 * k;
        ctx.lineWidth = 2.6; ctx.strokeStyle = `rgba(255,170,70,${0.9 * L})`; trace(); ctx.stroke();
        ctx.shadowBlur = 4 * k; ctx.lineWidth = 1.3; ctx.strokeStyle = `rgba(255,250,232,${Math.min(1, L * 1.3)})`; trace(); ctx.stroke();
        ctx.restore();
      }

      // What the room does to the glass: a window in the upper left, a line of sky lower right.
      const dim = 1 - 0.55 * L;
      ctx.lineWidth = 7; ctx.strokeStyle = `rgba(255,255,255,${0.26 * dim})`; ctx.beginPath(); ctx.arc(BX, BY, BULB - 9, -2.72, -2.02); ctx.stroke();
      ctx.lineWidth = 2.2; ctx.strokeStyle = `rgba(255,255,255,${0.5 * dim})`; ctx.beginPath(); ctx.arc(BX, BY, BULB - 5.4, -2.62, -2.2); ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = `rgba(255,255,255,${0.12 * dim})`; ctx.beginPath(); ctx.arc(BX, BY, BULB - 7, 0.5, 1.05); ctx.stroke();
      ctx.restore();
      const edge = ctx.createLinearGradient(BX - BULB, BY - BULB, BX + BULB, BY + BULB);
      edge.addColorStop(0, `rgba(255,255,255,${0.75 - 0.2 * L})`); edge.addColorStop(0.5, `rgba(255,236,200,${0.14 + 0.3 * L})`); edge.addColorStop(1, `rgba(255,236,200,${0.3 + 0.3 * L})`);
      ctx.lineWidth = 0.9; ctx.strokeStyle = edge; ctx.stroke(glass);
    };

    const draw = () => {
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.clearRect(0, 0, W, H);
      drawLamp(); drawSwitch();
      pool.style.opacity = String(s.lamp);
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, t0 = 0, startY = 0, startTilt = 0, moved = 0;
    let nextDemo = 750, demoStep = 0;
    const select = (v: boolean) => { if (onRef.current !== v) { onRef.current = v; setOn(v); } };
    const throwTo = (v: boolean) => { s.target = v ? 1 : -1; select(v); };

    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      if (!s.held || s.flipped) {
        // Two short steps a frame keep the hard spring stable. The dolly hits its stop and bounces.
        for (let i = 0; i < 2; i++) {
          const h = dt / 2;
          s.vel += (SNAP * (s.target - s.tilt) - 15 * s.vel) * h; s.tilt += s.vel * h;
          if (Math.abs(s.tilt) > 1) { s.tilt = Math.sign(s.tilt); s.vel *= -BOUNCE; }
        }
      }
      // The contact closes as the dolly passes the middle.
      const want = s.tilt > 0 ? 1 : 0;
      s.lamp += (want - s.lamp) * Math.min(1, dt * (want ? WARM_UP : COOL_DOWN));
      if (SELF_RUN && now - touched > 6000 && t > nextDemo) {
        throwTo(!onRef.current); demoStep++;
        nextDemo = t + (onRef.current ? 3300 : demoStep < 2 ? 700 : 1050); // long on, short off
      }
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const settle = () => { s.tilt = s.target; s.vel = 0; s.lamp = s.target > 0 ? 1 : 0; draw(); };

    api.current = { flip: () => { touched = performance.now(); throwTo(!onRef.current); if (reduce) settle(); else wake(); } };
    if (reduce) settle(); else wake();

    const unit = () => btn.getBoundingClientRect().height / (PLATE * 2 + 12); // screen pixels per drawing unit
    const onDown = (e: PointerEvent) => {
      touched = performance.now(); s.held = true; s.flipped = false; startY = e.clientY; startTilt = s.target; moved = 0;
      btn.setPointerCapture(e.pointerId); wake();
    };
    const onMove = (e: PointerEvent) => {
      if (!s.held || s.flipped) return;
      touched = performance.now();
      const dy = (e.clientY - startY) / unit(); moved = Math.max(moved, Math.abs(dy));
      // The dolly leans with the finger, stiffly, until it passes the middle. Then the spring takes it.
      const lean = clamp(startTilt + (dy / 15.5) * 0.8, -1, 1);
      s.vel = 0; s.tilt = lean;
      if (Math.sign(lean) !== Math.sign(startTilt) && Math.abs(lean) > 0.04) { s.flipped = true; s.vel = Math.sign(lean) * 9; throwTo(lean > 0); if (reduce) settle(); }
      else if (reduce) draw();
    };
    const onUp = () => {
      if (!s.held) return;
      s.held = false; touched = performance.now();
      if (!s.flipped && moved < 3) throwTo(!onRef.current); // a plain tap or click
      if (reduce) settle();
    };
    btn.addEventListener("pointerdown", onDown);
    btn.addEventListener("pointermove", onMove);
    btn.addEventListener("pointerup", onUp);
    btn.addEventListener("pointercancel", onUp);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      btn.removeEventListener("pointerdown", onDown); btn.removeEventListener("pointermove", onMove);
      btn.removeEventListener("pointerup", onUp); btn.removeEventListener("pointercancel", onUp);
      io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Pointer presses are handled above. A click with no pointer behind it comes from the keyboard or a screen reader.
  const onClick = (e: ReactMouseEvent) => { if (e.detail === 0) api.current?.flip(); };

  return (
    <div className="relative flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[#12211b] px-0 py-10 sm:min-h-[720px]">
      {/* Tongue and groove boards: one dark line and one catch of light at every joint. */}
      <div aria-hidden="true" className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0)_0px,rgba(0,0,0,0)_69px,rgba(0,0,0,0.5)_70px,rgba(0,0,0,0.5)_71px,rgba(255,255,255,0.05)_72px,rgba(0,0,0,0)_74px)] bg-[position:center_top]" />
      <div className="relative h-[340px] w-[340px] sm:h-[640px] sm:w-[640px]">
        <div
          ref={glow}
          aria-hidden="true"
          style={{ left: `${(BX / W) * 100}%`, top: `${(BY / H) * 100}%`, opacity: START_ON ? 1 : 0 }}
          className="pointer-events-none absolute h-[1500px] w-[1500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,200,120,0.7)_0%,rgba(246,176,92,0.42)_13%,rgba(206,150,74,0.22)_32%,rgba(160,130,70,0.09)_58%,rgba(170,120,70,0)_100%)]"
        />
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <button
          ref={button}
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={LABEL}
          onClick={onClick}
          style={{ left: `${((SX - PLATE - 6) / W) * 100}%`, top: `${((SY - PLATE - 6) / H) * 100}%`, width: `${((PLATE * 2 + 12) / W) * 100}%`, height: `${((PLATE * 2 + 12) / H) * 100}%` }}
          className="absolute cursor-pointer touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#12211b]"
        />
      </div>
      <p aria-live="polite" className="relative -mt-4 min-h-[20px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-[#a9bdb1] sm:-mt-16">
        <span className="text-white">{LABEL}</span>
        <span className="mx-2 text-[#6f8479]">/</span>
        {on ? "On" : "Off"}
      </p>
    </div>
  );
}

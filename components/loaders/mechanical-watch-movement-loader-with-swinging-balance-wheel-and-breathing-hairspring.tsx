import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// What the loader says underneath. The first line is also what a screen reader announces.
const LABEL = "Setting things in motion";
const HINT = "Press the movement to wind it";

// Timing of the escapement.
const BEATS_PER_SECOND = 2.5; // ticks a second; the balance swings once for every two
const REST_SWING = 1.9; // balance swing, in radians, when the spring is nearly run down
const FULL_SWING = 2.9; // swing straight after a wind
const AUTO_WIND_EVERY = 4.6; // seconds between the winds it gives itself

// Where the parts sit, on a 400 by 400 drawing.
const C = 200;
const PLATE_R = 172;
const BARREL = { x: 214, y: 147, r: 62 };
const CROWN = { x: 148, y: 88, r: 24 };
const THIRD = { x: 155, y: 184, r: 50 };
const FOURTH = { x: 135, y: 238, r: 44 };
const ESCAPE = { x: 165, y: 280, r: 27 };
const FORK = { x: 213, y: 287 };
const BALANCE = { x: 272, y: 262, r: 64 };

const GOLD = ["#fbeab2", "#d9ae4f", "#8c6524", "#ecd08a", "#a67c30"];
const STEEL = ["#fbfbfc", "#c3c7ce", "#737984", "#e6e8ec", "#8d939d"];
const ROSE = ["#ffe1cf", "#dba083", "#8f5a44", "#f1c2aa", "#a9705a"];

type Ctx = CanvasRenderingContext2D;

function sheen(ctx: Ctx, x: number, y: number, light: number, p: string[]) {
  const g = ctx.createConicGradient(light, x, y);
  g.addColorStop(0, p[0]);
  g.addColorStop(0.1, p[1]);
  g.addColorStop(0.27, p[2]);
  g.addColorStop(0.42, p[1]);
  g.addColorStop(0.5, p[3]);
  g.addColorStop(0.6, p[1]);
  g.addColorStop(0.77, p[4]);
  g.addColorStop(0.92, p[1]);
  g.addColorStop(1, p[0]);
  return g;
}

// A spoked wheel: toothed rim, hub, and windows cut between the spokes.
function wheelPath(ctx: Ctx, r: number, teeth: number, depth: number, spokes: number, hub: number, rim: number, spokeW: number) {
  const p = (Math.PI * 2) / teeth;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a = i * p;
    const pts: [number, number][] = [
      [a, r - depth],
      [a + p * 0.22, r - depth],
      [a + p * 0.38, r],
      [a + p * 0.62, r],
      [a + p * 0.78, r - depth],
    ];
    for (const [ang, rad] of pts) {
      const X = Math.cos(ang) * rad;
      const Y = Math.sin(ang) * rad;
      if (i === 0 && ang === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    }
  }
  ctx.closePath();
  if (spokes > 0) {
    const ro = r - depth - rim;
    const mo = spokeW / (2 * ro);
    const mi = spokeW / (2 * hub);
    for (let s = 0; s < spokes; s++) {
      const a = (s / spokes) * Math.PI * 2;
      const b = ((s + 1) / spokes) * Math.PI * 2;
      ctx.moveTo(Math.cos(a + mo) * ro, Math.sin(a + mo) * ro);
      ctx.arc(0, 0, ro, a + mo, b - mo);
      ctx.arc(0, 0, hub, b - mi, a + mi, true);
      ctx.closePath();
    }
  }
}

// The escape wheel: long, hooked teeth that the pallets catch.
function escapePath(ctx: Ctx, r: number, teeth: number) {
  const p = (Math.PI * 2) / teeth;
  const root = r * 0.6;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a = i * p;
    const pts: [number, number][] = [
      [a, root],
      [a + p * 0.5, r],
      [a + p * 0.68, r - 0.6],
      [a + p * 0.62, root + 2],
    ];
    for (const [ang, rad] of pts) {
      const X = Math.cos(ang) * rad;
      const Y = Math.sin(ang) * rad;
      if (i === 0 && ang === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    }
  }
  ctx.closePath();
  const ro = root - 3.5;
  for (let s = 0; s < 4; s++) {
    const a = (s / 4) * Math.PI * 2;
    const b = ((s + 1) / 4) * Math.PI * 2;
    ctx.moveTo(Math.cos(a + 0.2) * ro, Math.sin(a + 0.2) * ro);
    ctx.arc(0, 0, ro, a + 0.2, b - 0.2);
    ctx.arc(0, 0, 5.5, b - 0.5, a + 0.5, true);
    ctx.closePath();
  }
}

function jewel(ctx: Ctx, x: number, y: number, s: number, light: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, 7.4 * s, 0, Math.PI * 2);
  ctx.fillStyle = sheen(ctx, 0, 0, light, GOLD);
  ctx.fill();
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = "rgba(90,60,10,0.55)";
  ctx.stroke();
  const g = ctx.createRadialGradient(-1.4 * s, -1.6 * s, 0.4, 0, 0, 4.9 * s);
  g.addColorStop(0, "#ff9db0");
  g.addColorStop(0.35, "#e0183f");
  g.addColorStop(1, "#5e0318");
  ctx.beginPath();
  ctx.arc(0, 0, 4.9 * s, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 1.2 * s, 0, Math.PI * 2);
  ctx.fillStyle = "#2a0009";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-1.9 * s, -2.1 * s, 1.5 * s, 0.8 * s, -0.7, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fill();
  ctx.restore();
}

function screw(ctx: Ctx, x: number, y: number, r: number, turn: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, r + 1.4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(6,8,12,0.55)";
  ctx.fill();
  const g = ctx.createRadialGradient(-r * 0.4, -r * 0.5, 0.5, 0, 0, r);
  g.addColorStop(0, "#8fb0ff");
  g.addColorStop(0.45, "#3558c4");
  g.addColorStop(1, "#16235e");
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.rotate(turn);
  ctx.fillStyle = "rgba(8,12,40,0.85)";
  ctx.fillRect(-r * 0.92, -r * 0.16, r * 1.84, r * 0.32);
  ctx.restore();
}

// A finger bridge: a polished bar from the edge of the plate to a wheel's pivot.
function bridgePath(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, w0: number, w1: number) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  const nx = Math.cos(a + Math.PI / 2);
  const ny = Math.sin(a + Math.PI / 2);
  ctx.beginPath();
  ctx.arc(x0, y0, w0, a + Math.PI / 2, a - Math.PI / 2);
  ctx.lineTo(x1 - nx * w1, y1 - ny * w1);
  ctx.arc(x1, y1, w1, a - Math.PI / 2, a + Math.PI / 2);
  ctx.lineTo(x0 + nx * w0, y0 + ny * w0);
  ctx.closePath();
}

const bridges = [
  { from: [56, 142], to: [THIRD.x, THIRD.y], w0: 11, w1: 8.5, turn: 0.6 },
  { from: [46, 266], to: [FOURTH.x, FOURTH.y], w0: 11, w1: 8.5, turn: 2.1 },
  { from: [146, 358], to: [ESCAPE.x, ESCAPE.y], w0: 10, w1: 8, turn: 1.2 },
  { from: [356, 300], to: [BALANCE.x, BALANCE.y], w0: 14, w1: 10, turn: 0.2 },
];

// Perlage: rows of small overlapping circles ground into the plate. It is the costly part, so it is drawn once.
function drawGrain(ctx: Ctx) {
  const step = 6.5;
  let row = 0;
  for (let y = C - PLATE_R - step; y < C + PLATE_R + step; y += step * 0.86) {
    const off = row % 2 ? step / 2 : 0;
    for (let x = C - PLATE_R - step + off; x < C + PLATE_R + step; x += step) {
      const g = ctx.createConicGradient(-1.9, x, y);
      g.addColorStop(0, "rgba(255,255,255,0.2)");
      g.addColorStop(0.25, "rgba(10,12,18,0.22)");
      g.addColorStop(0.5, "rgba(255,255,255,0.1)");
      g.addColorStop(0.75, "rgba(10,12,18,0.24)");
      g.addColorStop(1, "rgba(255,255,255,0.2)");
      ctx.beginPath();
      ctx.arc(x, y, step * 0.72, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }
    row++;
  }
}

function drawPlate(ctx: Ctx, light: number, grain: HTMLCanvasElement) {
  // main plate
  ctx.save();
  ctx.shadowColor = "rgba(40,36,30,0.5)";
  ctx.shadowBlur = 9;
  ctx.shadowOffsetY = 5;
  ctx.beginPath();
  ctx.arc(C, C, PLATE_R + 8, 0, Math.PI * 2);
  ctx.fillStyle = "#6f747d";
  ctx.fill();
  ctx.restore();
  // polished outer ring
  ctx.beginPath();
  ctx.arc(C, C, PLATE_R + 8, 0, Math.PI * 2);
  ctx.fillStyle = sheen(ctx, C, C, light, STEEL);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(C, C, PLATE_R, 0, Math.PI * 2);
  ctx.fillStyle = "#454850";
  ctx.fill();
  // perlage, painted once and reused (see drawGrain)
  ctx.save();
  ctx.beginPath();
  ctx.arc(C, C, PLATE_R - 0.5, 0, Math.PI * 2);
  ctx.clip();
  if (grain.width) ctx.drawImage(grain, 0, 0, 400, 400);
  // the plate is dished toward the edge
  const v = ctx.createRadialGradient(C - 40, C - 60, 30, C, C, PLATE_R);
  v.addColorStop(0, "rgba(255,255,255,0.16)");
  v.addColorStop(0.6, "rgba(255,255,255,0)");
  v.addColorStop(1, "rgba(8,10,16,0.5)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, 400, 400);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(C, C, PLATE_R, 0, Math.PI * 2);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "rgba(40,44,54,0.55)";
  ctx.stroke();
  // engraving round the empty quarter of the plate
  ctx.save();
  ctx.font = "600 7.5px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const words = "FIVE JEWELS     WOUND BY HAND";
  for (let i = 0; i < words.length; i++) {
    const a = -1.08 + i * 0.043;
    ctx.save();
    ctx.translate(C + Math.cos(a) * 156, C + Math.sin(a) * 156);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillText(words[i], 0.4, 0.6);
    ctx.fillStyle = "rgba(232,212,150,0.95)";
    ctx.fillText(words[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
  // sunk wells under the wheels
  for (const w of [THIRD, FOURTH, ESCAPE, BALANCE, BARREL]) {
    const g = ctx.createRadialGradient(w.x, w.y, w.r * 0.3, w.x, w.y, w.r + 7);
    g.addColorStop(0, "rgba(24,25,31,0.95)");
    g.addColorStop(0.85, "rgba(20,21,27,0.95)");
    g.addColorStop(1, "rgba(8,9,12,0.98)");
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.r + 6, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.stroke();
  }
}

function drawBridges(ctx: Ctx, light: number, _grain: HTMLCanvasElement) {
  for (const b of bridges) {
    const [x0, y0] = b.from;
    const [x1, y1] = b.to;
    ctx.save();
    ctx.shadowColor = "rgba(10,10,16,0.6)";
    ctx.shadowBlur = 9;
    ctx.shadowOffsetY = 5;
    bridgePath(ctx, x0, y0, x1, y1, b.w0, b.w1);
    ctx.fillStyle = "#b9bdc5";
    ctx.fill();
    ctx.restore();
    // straight graining along the bar, then a bright chamfer
    bridgePath(ctx, x0, y0, x1, y1, b.w0, b.w1);
    const a = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2;
    const g = ctx.createLinearGradient(x0 - Math.cos(a) * b.w0, y0 - Math.sin(a) * b.w0, x0 + Math.cos(a) * b.w0, y0 + Math.sin(a) * b.w0);
    const tilt = Math.cos(a - light);
    g.addColorStop(0, tilt > 0 ? "#8b909a" : "#e6e8ec");
    g.addColorStop(0.5, "#c2c6cd");
    g.addColorStop(1, tilt > 0 ? "#eceef1" : "#8f949e");
    ctx.fillStyle = g;
    ctx.fill();
    // Geneva stripes across the bar
    ctx.save();
    ctx.clip();
    ctx.translate(x0, y0);
    ctx.rotate(0.62);
    for (let x = -320; x < 320; x += 9) {
      const st = ctx.createLinearGradient(x, 0, x + 9, 0);
      st.addColorStop(0, "rgba(255,255,255,0.38)");
      st.addColorStop(0.55, "rgba(255,255,255,0)");
      st.addColorStop(1, "rgba(40,46,60,0.28)");
      ctx.fillStyle = st;
      ctx.fillRect(x, -320, 9, 640);
    }
    ctx.restore();
    bridgePath(ctx, x0, y0, x1, y1, b.w0, b.w1);
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.stroke();
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "rgba(60,64,74,0.7)";
    ctx.stroke();
    screw(ctx, x0, y0, b.w0 * 0.46, b.turn);
    jewel(ctx, x1, y1, 0.78, light);
  }
  // loose plate screws
  screw(ctx, 322, 222, 5.5, 0.9);
  screw(ctx, 96, 318, 6, 2.4);
  screw(ctx, 250, 352, 6, 0.3);
  jewel(ctx, FORK.x, FORK.y, 0.62, light);
}

export default function MechanicalWatchMovementLoader() {
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLButtonElement>(null);
  const windRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const plate = document.createElement("canvas");
    const grain = document.createElement("canvas");
    const top = document.createElement("canvas");
    let size = 0;
    let dpr = 1;
    let lightDrawn = 99;
    let light = -2.3;
    let lightTarget = -2.3;
    let pointerOn = false;

    const cache = () => {
      for (const [cv, fn] of [[plate, drawPlate], [top, drawBridges]] as const) {
        cv.width = canvas.width;
        cv.height = canvas.height;
        const c = cv.getContext("2d");
        if (!c) continue;
        c.setTransform((size * dpr) / 400, 0, 0, (size * dpr) / 400, 0, 0);
        fn(c, light, grain);
      }
      lightDrawn = light;
    };
    const resize = () => {
      const s = Math.round(wrap.clientWidth * 1.12);
      if (s < 2 || s === size) return;
      size = s;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      grain.width = canvas.width;
      grain.height = canvas.height;
      const gc = grain.getContext("2d");
      if (gc) {
        gc.setTransform((size * dpr) / 400, 0, 0, (size * dpr) / 400, 0, 0);
        drawGrain(gc);
      }
      cache();
      if (reduce) draw();
    };

    // state of the going train
    let t = 0.13;
    let phase = 0.42;
    let swing = FULL_SWING - 0.3;
    let ticks = 0;
    let sinceTick = 1;
    let ratchet = 0;
    let ratchetTo = 0;
    let ratchetV = 0;
    let sinceWind = AUTO_WIND_EVERY - 0.5;
    let seenWinds = windRef.current;

    const wheel = (w: { x: number; y: number; r: number }, rot: number, pal: string[], teeth: number, depth: number, spokes: number, hub: number, rim: number, spokeW: number) => {
      ctx.save();
      ctx.translate(w.x, w.y);
      ctx.rotate(rot);
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 7 * ((size * dpr) / 400);
      ctx.shadowOffsetY = 4 * ((size * dpr) / 400);
      wheelPath(ctx, w.r, teeth, depth, spokes, hub, rim, spokeW);
      ctx.fillStyle = sheen(ctx, 0, 0, light - rot, pal);
      ctx.fill("evenodd");
      ctx.shadowColor = "transparent";
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = "rgba(60,40,10,0.5)";
      ctx.stroke();
      ctx.restore();
    };

    function draw() {
      const k = (size * dpr) / 400;
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.drawImage(plate, 0, 0);
      ctx!.setTransform(k, 0, 0, k, 0, 0);

      const step = Math.min(1, sinceTick / 0.085);
      const back = 1 + 2.2 * Math.pow(step - 1, 3) + 1.2 * Math.pow(step - 1, 2); // lands with a small recoil
      const escapeRot = (ticks - 1 + back) * ((Math.PI * 2) / 30);
      const fourthRot = -escapeRot / 6;
      const thirdRot = -fourthRot / 5;
      const theta = swing * Math.sin(phase);

      // going train, lowest wheel first
      wheel(THIRD, thirdRot + 0.4, GOLD, 66, 3.4, 5, 9, 6, 6.5);
      wheel(FOURTH, fourthRot, GOLD, 58, 3.2, 5, 8, 5.5, 5.5);

      // ratchet wheel on the barrel, with a sunray finish that shows it turning
      ctx!.save();
      ctx!.translate(BARREL.x, BARREL.y);
      ctx!.rotate(ratchet);
      ctx!.shadowColor = "rgba(0,0,0,0.6)";
      ctx!.shadowBlur = 9 * k;
      ctx!.shadowOffsetY = 5 * k;
      wheelPath(ctx!, BARREL.r, 54, 4.2, 0, 0, 0, 0);
      ctx!.fillStyle = sheen(ctx!, 0, 0, light - ratchet, STEEL);
      ctx!.fill();
      ctx!.shadowColor = "transparent";
      ctx!.lineWidth = 0.6;
      for (let i = 0; i < 96; i++) {
        const a = (i / 96) * Math.PI * 2;
        ctx!.beginPath();
        ctx!.moveTo(Math.cos(a) * 15, Math.sin(a) * 15);
        ctx!.lineTo(Math.cos(a) * (BARREL.r - 6), Math.sin(a) * (BARREL.r - 6));
        ctx!.strokeStyle = i % 2 ? "rgba(255,255,255,0.3)" : "rgba(50,56,70,0.2)";
        ctx!.stroke();
      }
      ctx!.beginPath();
      ctx!.arc(0, 0, BARREL.r - 5.5, 0, Math.PI * 2);
      ctx!.strokeStyle = "rgba(50,56,70,0.45)";
      ctx!.stroke();
      ctx!.beginPath();
      ctx!.arc(0, 0, 15, 0, Math.PI * 2);
      ctx!.fillStyle = sheen(ctx!, 0, 0, light - ratchet + 1, STEEL);
      ctx!.fill();
      ctx!.stroke();
      ctx!.restore();
      screw(ctx!, BARREL.x, BARREL.y, 8.5, ratchet + 0.5);

      // crown wheel that drives it
      const crownRot = -ratchet * (BARREL.r / CROWN.r) + 0.1;
      ctx!.save();
      ctx!.translate(CROWN.x, CROWN.y);
      ctx!.rotate(crownRot);
      ctx!.shadowColor = "rgba(0,0,0,0.55)";
      ctx!.shadowBlur = 7 * k;
      ctx!.shadowOffsetY = 4 * k;
      wheelPath(ctx!, CROWN.r, 21, 4.2, 0, 0, 0, 0);
      ctx!.fillStyle = sheen(ctx!, 0, 0, light - crownRot, STEEL);
      ctx!.fill();
      ctx!.shadowColor = "transparent";
      ctx!.lineWidth = 0.6;
      ctx!.strokeStyle = "rgba(50,56,70,0.5)";
      for (const r of [CROWN.r - 6, 9]) {
        ctx!.beginPath();
        ctx!.arc(0, 0, r, 0, Math.PI * 2);
        ctx!.stroke();
      }
      ctx!.restore();
      screw(ctx!, CROWN.x, CROWN.y, 5.5, crownRot);

      // escape wheel
      ctx!.save();
      ctx!.translate(ESCAPE.x, ESCAPE.y);
      ctx!.rotate(escapeRot);
      ctx!.shadowColor = "rgba(0,0,0,0.6)";
      ctx!.shadowBlur = 5 * k;
      ctx!.shadowOffsetY = 3 * k;
      escapePath(ctx!, ESCAPE.r, 15);
      ctx!.fillStyle = sheen(ctx!, 0, 0, light - escapeRot, ROSE);
      ctx!.fill("evenodd");
      ctx!.restore();

      // pallet fork, thrown from one banking pin to the other on every tick
      const side = ticks % 2 ? 1 : -1;
      const forkRot = Math.atan2(BALANCE.y - FORK.y, BALANCE.x - FORK.x) + side * (2 * Math.min(1, back) - 1) * 0.14;
      ctx!.save();
      ctx!.translate(FORK.x, FORK.y);
      ctx!.rotate(forkRot);
      ctx!.shadowColor = "rgba(0,0,0,0.55)";
      ctx!.shadowBlur = 4 * k;
      ctx!.shadowOffsetY = 2 * k;
      ctx!.beginPath();
      ctx!.moveTo(0, -3.2);
      ctx!.lineTo(40, -2.2);
      ctx!.lineTo(47, -6.5);
      ctx!.lineTo(49, -3);
      ctx!.lineTo(44, 0);
      ctx!.lineTo(49, 3);
      ctx!.lineTo(47, 6.5);
      ctx!.lineTo(40, 2.2);
      ctx!.lineTo(0, 3.2);
      ctx!.lineTo(-14, 23);
      ctx!.lineTo(-20, 20);
      ctx!.lineTo(-9, 0);
      ctx!.lineTo(-20, -20);
      ctx!.lineTo(-14, -23);
      ctx!.closePath();
      ctx!.fillStyle = sheen(ctx!, 0, 0, light - forkRot, STEEL);
      ctx!.fill();
      ctx!.shadowColor = "transparent";
      ctx!.fillStyle = "#d3163c";
      ctx!.fillRect(-23, 17, 9, 4.5);
      ctx!.fillRect(-23, -21.5, 9, 4.5);
      ctx!.restore();

      // hairspring: outer end pinned, inner end turning with the balance, so the coils breathe
      ctx!.save();
      ctx!.translate(BALANCE.x, BALANCE.y);
      const turns = Math.PI * 2 * 6.5;
      const pin = 0.35;
      ctx!.beginPath();
      for (let i = 0; i <= 220; i++) {
        const u = i / 220;
        const ang = pin - (1 - u) * (turns - theta);
        const rad = 8 + (BALANCE.r - 27) * u;
        const X = Math.cos(ang) * rad;
        const Y = Math.sin(ang) * rad;
        if (i === 0) ctx!.moveTo(X, Y);
        else ctx!.lineTo(X, Y);
      }
      ctx!.lineWidth = 1.7;
      ctx!.strokeStyle = "#2748b4";
      ctx!.stroke();
      ctx!.lineWidth = 0.6;
      ctx!.strokeStyle = "rgba(196,214,255,0.95)";
      ctx!.stroke();

      // balance wheel
      ctx!.rotate(theta);
      ctx!.shadowColor = "rgba(0,0,0,0.6)";
      ctx!.shadowBlur = 9 * k;
      ctx!.shadowOffsetY = 5 * k;
      ctx!.beginPath();
      ctx!.arc(0, 0, BALANCE.r, 0, Math.PI * 2);
      ctx!.arc(0, 0, BALANCE.r - 9, 0, Math.PI * 2, true);
      ctx!.closePath();
      ctx!.moveTo(-BALANCE.r + 5, -4);
      ctx!.lineTo(-9, -5.5);
      ctx!.arc(0, 0, 9, Math.PI + 0.6, -0.6);
      ctx!.lineTo(BALANCE.r - 5, -4);
      ctx!.lineTo(BALANCE.r - 5, 4);
      ctx!.lineTo(9, 5.5);
      ctx!.arc(0, 0, 9, 0.6, Math.PI - 0.6);
      ctx!.lineTo(-BALANCE.r + 5, 4);
      ctx!.closePath();
      ctx!.fillStyle = sheen(ctx!, 0, 0, light - theta, GOLD);
      ctx!.fill();
      ctx!.shadowColor = "transparent";
      ctx!.lineWidth = 0.5;
      ctx!.strokeStyle = "rgba(70,46,8,0.6)";
      ctx!.stroke();
      // timing screws round the rim
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + 0.31;
        const X = Math.cos(a) * (BALANCE.r - 4.5);
        const Y = Math.sin(a) * (BALANCE.r - 4.5);
        const g = ctx!.createRadialGradient(X - 0.8, Y - 0.8, 0.2, X, Y, 2.8);
        g.addColorStop(0, "#fff6d4");
        g.addColorStop(1, "#8c6524");
        ctx!.beginPath();
        ctx!.arc(X, Y, 2.7, 0, Math.PI * 2);
        ctx!.fillStyle = g;
        ctx!.fill();
      }
      ctx!.restore();

      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.drawImage(top, 0, 0);

      // a band of reflection on the glass over the movement, lying across the direction of the light
      ctx!.setTransform(k, 0, 0, k, 0, 0);
      ctx!.save();
      ctx!.beginPath();
      ctx!.arc(C, C, PLATE_R, 0, Math.PI * 2);
      ctx!.clip();
      const lx = Math.cos(light);
      const ly = Math.sin(light);
      const gl = ctx!.createLinearGradient(C + lx * 170, C + ly * 170, C - lx * 60, C - ly * 60);
      gl.addColorStop(0, "rgba(255,255,255,0.3)");
      gl.addColorStop(0.3, "rgba(255,255,255,0.07)");
      gl.addColorStop(0.42, "rgba(255,255,255,0.16)");
      gl.addColorStop(0.5, "rgba(255,255,255,0.02)");
      gl.addColorStop(1, "rgba(255,255,255,0)");
      ctx!.fillStyle = gl;
      ctx!.fillRect(0, 0, 400, 400);
      ctx!.restore();
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    if (reduce) {
      draw();
      return () => ro.disconnect();
    }

    let raf = 0;
    let visible = true;
    let last = performance.now();
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;

      // winding: by itself every few seconds, or whenever the button is pressed
      sinceWind += dt;
      if (windRef.current !== seenWinds || sinceWind > AUTO_WIND_EVERY) {
        seenWinds = windRef.current;
        sinceWind = 0;
        ratchetTo += (Math.PI * 2) / 54 * 4;
        swing = Math.min(FULL_SWING, swing + 0.55);
      }
      ratchetV += ((ratchetTo - ratchet) * 220 - ratchetV * 17) * dt;
      ratchet += ratchetV * dt;
      swing += (REST_SWING - swing) * (1 - Math.exp(-dt * 0.35));

      // the balance, and a tick each time it passes centre
      const before = Math.floor(phase / Math.PI);
      phase += dt * Math.PI * BEATS_PER_SECOND;
      sinceTick += dt;
      if (Math.floor(phase / Math.PI) !== before) {
        ticks++;
        sinceTick = 0;
      }

      // the light wanders slowly, or comes from wherever the pointer is
      if (!pointerOn) lightTarget = -2.3 + Math.sin(t * 0.5) * 0.5;
      let d = lightTarget - light;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      light += d * (1 - Math.exp(-dt * 6));
      if (Math.abs(light - lightDrawn) > 0.045) cache();

      draw();
      if (visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && visible && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      start();
    });
    io.observe(wrap);
    const onVis = () => start();
    document.addEventListener("visibilitychange", onVis);
    const move = (ev: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      pointerOn = true;
      lightTarget = Math.atan2(ev.clientY - (r.top + r.height / 2), ev.clientX - (r.left + r.width / 2));
    };
    const leave = () => {
      pointerOn = false;
    };
    wrap.addEventListener("pointermove", move);
    wrap.addEventListener("pointerleave", leave);
    wrap.addEventListener("pointercancel", leave);
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      wrap.removeEventListener("pointermove", move);
      wrap.removeEventListener("pointerleave", leave);
      wrap.removeEventListener("pointercancel", leave);
    };
  }, [reduce]);

  return (
    <section className="relative flex min-h-[600px] w-full flex-col items-center justify-center overflow-hidden bg-[#e9e6e0] px-4 py-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 38%, rgba(255,255,255,0.9), rgba(233,230,224,0) 60%)" }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[min(84vw,430px)] w-[min(84vw,430px)] -translate-x-1/2 -translate-y-[48%] rounded-full bg-[#3b352b]/45 blur-2xl" />
      <button
        ref={wrapRef}
        type="button"
        aria-label="Wind the movement"
        onClick={() => {
          windRef.current += 1;
        }}
        className="relative aspect-square w-[min(84vw,430px)] cursor-pointer rounded-full transition-transform duration-200 ease-out active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b3f8f] focus-visible:ring-offset-8 focus-visible:ring-offset-[#e9e6e0] motion-reduce:transition-none"
      >
        <canvas ref={canvasRef} aria-hidden="true" className="absolute -inset-[6%] h-[112%] w-[112%]" />
      </button>
      <div role="status" className="relative mt-10 text-center">
        <p className="text-[13px] font-medium uppercase tracking-[0.26em] text-[#3c3a36]">{LABEL}</p>
        <p className="mt-2 text-[12px] tracking-wide text-[#6b6860]">{HINT}</p>
      </div>
    </section>
  );
}

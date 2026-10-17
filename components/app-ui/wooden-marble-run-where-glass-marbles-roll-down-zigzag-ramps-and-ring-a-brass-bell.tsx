import { useEffect, useRef, useState } from "react";

// The marbles: glass tint and the colour of the twisted vane inside. Add or remove entries freely.
const marbles = [
  { glass: "36,92,214", vane: "#f6f1e3" },
  { glass: "226,150,24", vane: "#b3261e" },
  { glass: "22,140,98", vane: "#f3d34a" },
  { glass: "196,38,52", vane: "#fbe9d0" },
  { glass: "150,176,196", vane: "#1f4fd1" },
  { glass: "118,70,196", vane: "#ffb84d" },
];
/** Each ramp is the top edge of a beech rail, from its high end to its low end. */
const ramps: [number, number, number, number][] = [
  [-176, 150, 118, 196],
  [176, 280, -118, 326],
  [-176, 410, 62, 447],
];
const GRAVITY = 1250; // pixels a second squared
const BOUNCE = 0.34; // how much speed a marble keeps when it lands on wood
const RAD = 18; // marble radius
/** Paint the low end of each rail is dipped in, one per rail. */
const DIPS = ["#d8342c", "#f0b429", "#1f8f86"];
const STAMP = "No. 4  BEECH & BRASS";

const WALL = 188; // inner face of the side rails
const FLOOR: [number, number, number, number] = [-WALL, 572, WALL, 552]; // the felt tray, tipped a little to the left
const PIVOT = { x: 132, y: 446 }, ARM = 42, BELL = 24;
const START = { x: -146, y: 104 };

export default function WoodenMarbleRun() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const api = useRef<{ drop: () => void } | null>(null);
  const [rings, setRings] = useState(0);

  useEffect(() => {
    const cv = canvas.current, pad = hit.current;
    if (!cv || !pad) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dpr = 1, scale = 1, ox = 0, oy = 0, box = cv.getBoundingClientRect();
    let back: HTMLCanvasElement | null = null;
    let seed = 3;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // Rails as fat line segments: the centre line sits 8 below the top edge.
    const mount = ([ax, ay, bx, by]: [number, number, number, number]) => {
      const len = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / len, uy = (by - ay) / len;
      const nx = ux > 0 ? -uy : uy, ny = ux > 0 ? ux : -ux; // points into the wood
      return { ax: ax + nx * 8, ay: ay + ny * 8, bx: bx + nx * 8, by: by + ny * 8, len, angle: Math.atan2(by - ay, bx - ax), tx: ax, ty: ay };
    };
    const rails = ramps.map(mount);
    const tray = mount([FLOOR[2], FLOOR[3], FLOOR[0], FLOOR[1]]);

    type Marble = { x: number; y: number; vx: number; vy: number; rot: number; mode: "free" | "held" | "carried"; q: number; fx: number; fy: number; lift: number; idle: number; i: number };
    // Start mid-play: three on the rails, three waiting in the tray.
    const seedSpots: [number, number, number, number][] = [[-60, 152, 150, 24], [40, 286, -210, 32], [-40, 414, 230, 36], [-168, 552, 0, 0], [-130, 550, 0, 0], [-92, 548, 0, 0]];
    const balls: Marble[] = marbles.map((_, i) => {
      const p = seedSpots[i % seedSpots.length];
      return { x: p[0], y: p[1], vx: p[2], vy: p[3], rot: i * 1.3, mode: "free", q: 0, fx: 0, fy: 0, lift: 0, idle: i * 0.4, i };
    });
    const bell = { a: 0, w: 0, ring: 0 };
    let count = 0;

    const bake = (paint: (c: CanvasRenderingContext2D) => void) => {
      const off = document.createElement("canvas");
      const k = dpr * scale;
      off.width = Math.max(1, Math.ceil(520 * k)); off.height = Math.max(1, Math.ceil(660 * k));
      const c = off.getContext("2d");
      if (c) { c.setTransform(k, 0, 0, k, 260 * k, 0); paint(c); }
      return off;
    };

    // A length of timber lying along x: gradient across the grain, then the grain itself.
    const timber = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rad: number, light: string, dark: string, lines: number, tone: string) => {
      c.save();
      c.beginPath(); c.roundRect(x, y, w, h, rad); c.clip();
      const g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, light); g.addColorStop(1, dark);
      c.fillStyle = g; c.fillRect(x, y, w, h);
      for (let i = 0; i < lines; i++) {
        const gy = y + rand() * h, wob = (rand() - 0.5) * 5;
        c.beginPath(); c.moveTo(x, gy); c.bezierCurveTo(x + w * 0.3, gy + wob, x + w * 0.66, gy - wob, x + w, gy + wob * 0.5);
        c.lineWidth = 0.4 + rand() * 0.9; c.strokeStyle = `rgba(${tone},${0.05 + rand() * 0.16})`; c.stroke();
      }
      c.restore();
    };
    const screw = (c: CanvasRenderingContext2D, x: number, y: number, turn: number) => {
      c.beginPath(); c.arc(x, y + 0.8, 3.6, 0, Math.PI * 2); c.fillStyle = "rgba(40,22,6,0.5)"; c.fill();
      const g = c.createRadialGradient(x - 1, y - 1.2, 0.3, x, y, 3.4);
      g.addColorStop(0, "#fff3c4"); g.addColorStop(0.5, "#cfa046"); g.addColorStop(1, "#7a5616");
      c.beginPath(); c.arc(x, y, 3.2, 0, Math.PI * 2); c.fillStyle = g; c.fill();
      c.save(); c.translate(x, y); c.rotate(turn); c.fillStyle = "rgba(50,30,6,0.85)"; c.fillRect(-2.6, -0.5, 5.2, 1); c.restore();
    };

    const paintBack = (c: CanvasRenderingContext2D) => {
      // The birch board, with the plies showing along its lower edge.
      c.save(); c.shadowColor = "rgba(8,18,60,0.5)"; c.shadowBlur = 40; c.shadowOffsetX = 14 * dpr * scale; c.shadowOffsetY = 26 * dpr * scale;
      c.beginPath(); c.roundRect(-214, 40, 428, 572, 20); c.fillStyle = "#8a6a3c"; c.fill(); c.restore();
      c.save(); c.beginPath(); c.roundRect(-214, 40, 428, 572, 20); c.clip();
      for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? "#c9a56a" : "#8d6936"; c.fillRect(-214, 598 + i * 2.4, 428, 2.4); }
      c.restore();
      timber(c, -214, 40, 428, 560, 20, "#f0dcb4", "#e2c794", 0, "0,0,0");
      c.save(); c.beginPath(); c.roundRect(-214, 40, 428, 560, 20); c.clip();
      for (let i = 0; i < 170; i++) {
        const gx = -214 + rand() * 428, wob = (rand() - 0.5) * 9;
        c.beginPath(); c.moveTo(gx, 40); c.bezierCurveTo(gx + wob, 220, gx - wob, 400, gx + wob * 0.6, 600);
        c.lineWidth = 0.5 + rand() * 1.5; c.strokeStyle = rand() > 0.3 ? `rgba(150,104,48,${0.04 + rand() * 0.1})` : `rgba(255,250,232,${0.08 + rand() * 0.14})`; c.stroke();
      }
      const sheen = c.createLinearGradient(-214, 40, 214, 600);
      sheen.addColorStop(0, "rgba(255,255,255,0.2)"); sheen.addColorStop(0.5, "rgba(255,255,255,0)"); sheen.addColorStop(1, "rgba(90,50,10,0.14)");
      c.fillStyle = sheen; c.fillRect(-214, 40, 428, 560);
      c.restore();
      c.lineWidth = 1.2; c.strokeStyle = "rgba(255,252,236,0.7)"; c.beginPath(); c.roundRect(-213.4, 40.6, 426.8, 559, 19.4); c.stroke();

      // Branded into the board with a hot iron.
      c.save(); c.font = "700 9px ui-monospace, SFMono-Regular, Menlo, monospace"; c.textAlign = "right"; c.textBaseline = "middle";
      const brand = STAMP.split("").join("\u200A"), bw = c.measureText(brand).width;
      c.fillStyle = "rgba(94,52,16,0.62)"; c.fillText(brand, 170, 88);
      c.beginPath(); c.arc(170 - bw - 16, 88, 7, 0, Math.PI * 2); c.lineWidth = 1.4; c.strokeStyle = "rgba(94,52,16,0.55)"; c.stroke();
      c.beginPath(); c.arc(170 - bw - 16, 88, 2.4, 0, Math.PI * 2); c.fill();
      c.restore();

      // Side rails in walnut, each throwing a shadow onto the board.
      for (const side of [-1, 1]) {
        c.save(); c.shadowColor = "rgba(60,30,6,0.5)"; c.shadowBlur = 10; c.shadowOffsetX = 4 * dpr * scale; c.shadowOffsetY = 6 * dpr * scale;
        c.beginPath(); c.roundRect(side < 0 ? -214 : WALL, 40, 26, 572, 9); c.fillStyle = "#5a3520"; c.fill(); c.restore();
        c.save(); c.translate(side < 0 ? -214 : WALL, 612); c.rotate(-Math.PI / 2);
        timber(c, 0, 0, 572, 26, 9, "#7d4c2c", "#4b2a17", 40, "20,8,2");
        const edge = c.createLinearGradient(0, 0, 0, 26); edge.addColorStop(0, "rgba(255,220,180,0.38)"); edge.addColorStop(0.16, "rgba(255,220,180,0)"); edge.addColorStop(0.8, "rgba(0,0,0,0)"); edge.addColorStop(1, "rgba(0,0,0,0.4)");
        c.fillStyle = edge; c.beginPath(); c.roundRect(0, 0, 572, 26, 9); c.fill();
        c.restore();
        screw(c, side * 201, 70, 0.6 * side); screw(c, side * 201, 330, 2.1); screw(c, side * 201, 584, 1.2 * side);
      }

      // The rails the marbles ride, seen a little from above: a pale routed top and a darker front face.
      [...rails, tray].forEach((r, i) => {
        const felt = r === tray, x0 = felt ? 0 : -10, w = felt ? r.len : r.len + 18;
        c.save(); c.translate(r.tx, r.ty); c.rotate(r.angle);
        if (Math.cos(r.angle) < 0) c.scale(1, -1);
        c.save(); c.shadowColor = "rgba(70,36,6,0.6)"; c.shadowBlur = 14; c.shadowOffsetX = 6 * dpr * scale; c.shadowOffsetY = 11 * dpr * scale;
        c.beginPath(); c.roundRect(x0, -4, w, 26, 5); c.fillStyle = "#b98a52"; c.fill(); c.restore();
        timber(c, x0, 2, w, 20, 5, "#e9c48a", "#b8854a", 18, "110,60,14");
        const face = c.createLinearGradient(0, 2, 0, 22); face.addColorStop(0, "rgba(255,240,205,0.35)"); face.addColorStop(0.3, "rgba(255,240,205,0)"); face.addColorStop(0.8, "rgba(60,28,4,0)"); face.addColorStop(1, "rgba(60,28,4,0.45)");
        c.fillStyle = face; c.beginPath(); c.roundRect(x0, 2, w, 20, 5); c.fill();
        // Top face.
        c.beginPath(); c.roundRect(x0, -5, w, 9, 4);
        if (felt) {
          const g = c.createLinearGradient(0, -5, 0, 4); g.addColorStop(0, "#2f7a60"); g.addColorStop(1, "#1c5241"); c.fillStyle = g; c.fill();
          c.save(); c.clip();
          for (let n = 0; n < 500; n++) { c.fillStyle = `rgba(${rand() > 0.5 ? "200,246,222" : "0,24,14"},${rand() * 0.2})`; c.fillRect(x0 + rand() * w, -5 + rand() * 9, 1.1, 1.1); }
          c.restore();
        } else {
          const g = c.createLinearGradient(0, -5, 0, 4); g.addColorStop(0, "#f3ddb0"); g.addColorStop(1, "#fdeecb"); c.fillStyle = g; c.fill();
          c.fillStyle = "rgba(120,70,20,0.3)"; c.fillRect(x0 + 5, -2.2, w - 10, 2.4);
          c.fillStyle = "rgba(255,252,238,0.9)"; c.fillRect(x0 + 5, 0.2, w - 10, 0.9);
        }
        c.fillStyle = "rgba(255,250,232,0.8)"; c.fillRect(x0 + 3, 3.6, w - 6, 0.9);
        if (!felt) {
          // The dipped end: glossy paint over the last stretch of the rail, top and front.
          const dx = x0 + w - 30;
          c.save(); c.beginPath(); c.roundRect(x0, -5, w, 27, 5); c.clip();
          c.fillStyle = DIPS[i % DIPS.length]; c.fillRect(dx, -6, 31, 29);
          const gloss = c.createLinearGradient(0, -5, 0, 22);
          gloss.addColorStop(0, "rgba(255,255,255,0.5)"); gloss.addColorStop(0.2, "rgba(255,255,255,0.12)"); gloss.addColorStop(0.3, "rgba(0,0,0,0.12)"); gloss.addColorStop(0.42, "rgba(255,255,255,0.3)"); gloss.addColorStop(0.6, "rgba(255,255,255,0)"); gloss.addColorStop(1, "rgba(0,0,0,0.4)");
          c.fillStyle = gloss; c.fillRect(dx, -6, 31, 29);
          c.fillStyle = "rgba(0,0,0,0.22)"; c.fillRect(dx - 0.8, -6, 0.8, 29);
          c.restore();
        }
        c.restore();
        if (felt) return;
        const along = (d: number) => ({ x: r.ax + (r.bx - r.ax) * d, y: r.ay + (r.by - r.ay) * d + 5 });
        const p0 = along(0.06), p1 = along(0.8);
        screw(c, p0.x, p0.y, 0.4 + i); screw(c, p1.x, p1.y, 1.7 + i);
      });

      // The arm the bell hangs from.
      c.save(); c.shadowColor = "rgba(70,36,6,0.5)"; c.shadowBlur = 8; c.shadowOffsetX = 4 * dpr * scale; c.shadowOffsetY = 7 * dpr * scale;
      const armG = c.createLinearGradient(0, PIVOT.y - 12, 0, PIVOT.y - 4); armG.addColorStop(0, "#f7e2a0"); armG.addColorStop(0.5, "#c59a3c"); armG.addColorStop(1, "#7b5718");
      c.beginPath(); c.roundRect(PIVOT.x - 7, PIVOT.y - 13, WALL - PIVOT.x + 9, 9, 4.5); c.fillStyle = armG; c.fill(); c.restore();
    };

    const drawMarble = (m: Marble) => {
      const col = marbles[m.i], r = RAD * (1 + m.lift * 0.22), off = 1 + m.lift * 2.4;
      // Shadow on the board, with the bright spot glass focuses into it.
      const sx = m.x + 6 * off, sy = m.y + 10 * off;
      const sh = ctx.createRadialGradient(sx, sy, r * 0.2, sx, sy, r * (1.25 + m.lift * 0.5));
      sh.addColorStop(0, `rgba(60,30,6,${0.5 - m.lift * 0.22})`); sh.addColorStop(0.6, `rgba(60,30,6,${0.3 - m.lift * 0.15})`); sh.addColorStop(1, "rgba(60,30,6,0)");
      ctx.fillStyle = sh; ctx.fillRect(sx - r * 2, sy - r * 2, r * 4, r * 4);
      const cz = ctx.createRadialGradient(sx + 1, sy + 1, 0, sx + 1, sy + 1, r * 0.55);
      cz.addColorStop(0, `rgba(${col.glass},0.6)`); cz.addColorStop(0.4, "rgba(255,240,200,0.3)"); cz.addColorStop(1, "rgba(255,240,200,0)");
      ctx.fillStyle = cz; ctx.fillRect(sx - r, sy - r, r * 2, r * 2);

      ctx.save(); ctx.translate(m.x, m.y);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      const body = ctx.createRadialGradient(-r * 0.3, -r * 0.36, r * 0.05, 0, 0, r);
      body.addColorStop(0, `rgba(${col.glass},0.42)`); body.addColorStop(0.55, `rgba(${col.glass},0.74)`); body.addColorStop(0.88, `rgba(${col.glass},0.96)`); body.addColorStop(1, "rgba(8,10,24,0.92)");
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fill(); ctx.fillStyle = body; ctx.fill();
      ctx.save(); ctx.clip();
      // The cat's-eye vane, turning as the marble rolls.
      ctx.rotate(m.rot);
      // One broad ribbon bent into an S, with a thin second colour laid along it.
      ctx.beginPath(); ctx.moveTo(-r * 0.72, r * 0.1); ctx.bezierCurveTo(-r * 0.4, -r * 0.62, r * 0.1, -r * 0.1, r * 0.72, -r * 0.1);
      ctx.bezierCurveTo(r * 0.4, r * 0.62, -r * 0.1, r * 0.1, -r * 0.72, r * 0.1); ctx.closePath();
      ctx.fillStyle = col.vane; ctx.globalAlpha = 0.94; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-r * 0.6, r * 0.04); ctx.bezierCurveTo(-r * 0.3, -r * 0.3, r * 0.1, r * 0.2, r * 0.6, -r * 0.04);
      ctx.lineWidth = r * 0.11; ctx.lineCap = "round"; ctx.strokeStyle = `rgb(${col.glass})`; ctx.globalAlpha = 0.75; ctx.stroke();
      ctx.globalAlpha = 1; ctx.rotate(-m.rot);
      // Light gathered on the far side of the glass.
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createRadialGradient(r * 0.38, r * 0.44, 0, r * 0.38, r * 0.44, r * 0.72);
      glow.addColorStop(0, "rgba(255,255,255,0.62)"); glow.addColorStop(0.5, `rgba(${col.glass},0.3)`); glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow; ctx.fillRect(-r, -r, r * 2, r * 2);
      ctx.globalCompositeOperation = "source-over";
      const shade = ctx.createRadialGradient(0, 0, r * 0.74, 0, 0, r);
      shade.addColorStop(0, "rgba(0,0,0,0)"); shade.addColorStop(1, "rgba(0,0,20,0.42)");
      ctx.fillStyle = shade; ctx.fillRect(-r, -r, r * 2, r * 2);
      ctx.restore();
      // Window reflection and a pin of light.
      ctx.beginPath(); ctx.ellipse(-r * 0.36, -r * 0.44, r * 0.34, r * 0.2, -0.7, 0, Math.PI * 2);
      const spec = ctx.createLinearGradient(0, -r * 0.8, 0, -r * 0.1); spec.addColorStop(0, "rgba(255,255,255,0.98)"); spec.addColorStop(1, "rgba(255,255,255,0.3)");
      ctx.fillStyle = spec; ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.5, r * 0.56, r * 0.07, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, r - 0.5, 0.4, 1.9); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.stroke();
      ctx.restore();
    };

    const drawBell = () => {
      const bx = PIVOT.x + Math.sin(bell.a) * ARM, by = PIVOT.y + Math.cos(bell.a) * ARM;
      // Shadow first, then the leather loop, then the bell turned about its hook.
      ctx.save(); ctx.translate(PIVOT.x + 6, PIVOT.y + 10); ctx.rotate(-bell.a);
      const sh = ctx.createRadialGradient(0, ARM, 4, 0, ARM, 34);
      sh.addColorStop(0, "rgba(60,30,6,0.5)"); sh.addColorStop(1, "rgba(60,30,6,0)"); ctx.fillStyle = sh; ctx.fillRect(-36, 0, 72, 76); ctx.restore();
      if (bell.ring > 0.02) {
        ctx.save(); ctx.lineCap = "round";
        for (let i = 0; i < 3; i++) {
          const q = ((1 - bell.ring) * 1.4 + i * 0.22) % 1, rr = BELL + 10 + q * 34;
          ctx.globalAlpha = bell.ring * (1 - q) * 0.8; ctx.lineWidth = 2.2; ctx.strokeStyle = "#8a5a12";
          ctx.beginPath(); ctx.arc(bx, by, rr, -0.55, 0.55); ctx.stroke(); ctx.beginPath(); ctx.arc(bx, by, rr, Math.PI - 0.55, Math.PI + 0.55); ctx.stroke();
        }
        ctx.restore();
      }
      ctx.save(); ctx.translate(PIVOT.x, PIVOT.y - 8); ctx.rotate(-bell.a);
      ctx.lineWidth = 3; ctx.strokeStyle = "#3b2414"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, ARM - BELL + 8); ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,210,170,0.35)"; ctx.beginPath(); ctx.moveTo(-0.8, 1); ctx.lineTo(-0.8, ARM - BELL + 6); ctx.stroke();
      const top = ARM - BELL + 4, R2 = BELL + 2;
      // Clapper.
      ctx.beginPath(); ctx.arc(bell.w * 1.6, top + R2 * 1.72, 4.4, 0, Math.PI * 2); ctx.fillStyle = "#5a3d10"; ctx.fill();
      ctx.beginPath(); ctx.arc(bell.w * 1.6 - 1.2, top + R2 * 1.72 - 1.3, 1.4, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,240,190,0.8)"; ctx.fill();
      const brass = ctx.createLinearGradient(-R2 * 1.1, 0, R2 * 1.1, 0);
      const stops: [number, string][] = [[0, "#4d3408"], [0.12, "#9a7424"], [0.28, "#f3d98c"], [0.35, "#fffbe0"], [0.44, "#d9b352"], [0.68, "#8a6418"], [0.9, "#553a0a"], [1, "#b48d36"]];
      for (const [p, col] of stops) brass.addColorStop(p, col);
      ctx.beginPath(); ctx.moveTo(-5, top);
      ctx.bezierCurveTo(-R2 * 0.72, top + 2, -R2 * 0.7, top + R2 * 0.9, -R2 * 0.92, top + R2 * 1.3);
      ctx.quadraticCurveTo(-R2 * 1.02, top + R2 * 1.52, -R2 * 1.14, top + R2 * 1.6);
      ctx.quadraticCurveTo(0, top + R2 * 1.84, R2 * 1.14, top + R2 * 1.6);
      ctx.quadraticCurveTo(R2 * 1.02, top + R2 * 1.52, R2 * 0.92, top + R2 * 1.3);
      ctx.bezierCurveTo(R2 * 0.7, top + R2 * 0.9, R2 * 0.72, top + 2, 5, top); ctx.closePath();
      ctx.fillStyle = brass; ctx.fill();
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(50,30,2,0.6)"; ctx.stroke();
      const under = ctx.createLinearGradient(0, top + R2 * 1.2, 0, top + R2 * 1.8); under.addColorStop(0, "rgba(40,24,2,0)"); under.addColorStop(1, "rgba(40,24,2,0.45)");
      ctx.fillStyle = under; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(60,36,4,0.45)";
      ctx.beginPath(); ctx.moveTo(-R2 * 0.8, top + R2 * 1.02); ctx.quadraticCurveTo(0, top + R2 * 1.16, R2 * 0.8, top + R2 * 1.02); ctx.stroke();
      ctx.strokeStyle = "rgba(255,250,214,0.6)";
      ctx.beginPath(); ctx.moveTo(-R2 * 0.8, top + R2 * 1.08); ctx.quadraticCurveTo(0, top + R2 * 1.22, R2 * 0.8, top + R2 * 1.08); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, top, 5, 0, Math.PI * 2); ctx.fillStyle = "#c59a3c"; ctx.fill(); ctx.strokeStyle = "rgba(50,30,2,0.6)"; ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.arc(PIVOT.x, PIVOT.y - 8, 3, 0, Math.PI * 2); ctx.fillStyle = "#fff0b8"; ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(50,30,2,0.7)"; ctx.stroke();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      const k = dpr * scale;
      ctx.setTransform(k, 0, 0, k, ox * dpr, oy * dpr);
      if (back) ctx.drawImage(back, -260, 0, 520, 660);
      drawBell();
      const order = [...balls].sort((a, b) => a.lift - b.lift);
      for (const m of order) drawMarble(m);
    };

    const fit = () => {
      box = cv.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(box.width * dpr); cv.height = Math.round(box.height * dpr);
      const bottom = box.width < 640 ? 100 : 74;
      scale = Math.min(box.width / 470, (box.height - bottom) / 650);
      ox = box.width / 2; oy = Math.max(0, (box.height - bottom - 650 * scale) / 2);
      pad.style.left = `${ox - 214 * scale}px`; pad.style.top = `${oy + 40 * scale}px`; pad.style.width = `${428 * scale}px`; pad.style.height = `${572 * scale}px`;
      seed = 3;
      back = bake(paintBack);
    };

    const collideLine = (m: Marble, ax: number, ay: number, bx: number, by: number, thick: number, soft: boolean) => {
      const ex = bx - ax, ey = by - ay, q = Math.max(0, Math.min(1, ((m.x - ax) * ex + (m.y - ay) * ey) / (ex * ex + ey * ey)));
      const dx = m.x - (ax + ex * q), dy = m.y - (ay + ey * q), d = Math.hypot(dx, dy), min = RAD + thick;
      if (d >= min || d === 0) return;
      const nx = dx / d, ny = dy / d, vn = m.vx * nx + m.vy * ny;
      m.x += nx * (min - d); m.y += ny * (min - d);
      if (vn < 0) { const e = -vn > 90 ? (soft ? 0.12 : BOUNCE) : 0; m.vx -= (1 + e) * vn * nx; m.vy -= (1 + e) * vn * ny; }
      if (soft) { m.vx *= 0.988; m.vy *= 0.988; }
      m.rot += (m.vx * -ny + m.vy * nx) / RAD / 240;
    };

    let time = 0;
    const step = (h: number) => {
      time += h;
      // The bell is a damped pendulum.
      bell.w += (-58 * Math.sin(bell.a) - 1.5 * bell.w) * h; bell.a += bell.w * h;
      bell.ring *= Math.exp(-h * 2.4);
      const cb = Math.cos(bell.a), sb = Math.sin(bell.a), bx = PIVOT.x + sb * ARM, by = PIVOT.y + cb * ARM;
      for (const m of balls) {
        if (m.mode === "carried") {
          // Lifted off the tray and carried to the top by an unseen hand.
          m.q = Math.min(1, m.q + h / 0.8);
          const e = m.q * m.q * (3 - 2 * m.q);
          m.x = m.fx + (START.x - m.fx) * e; m.y = m.fy + (START.y - m.fy) * e - Math.sin(e * Math.PI) * 26;
          m.lift = Math.sin(Math.min(1, m.q * 1.12) * Math.PI); m.rot += h * 3;
          if (m.q >= 1) { m.mode = "free"; m.vx = 30; m.vy = 0; m.lift = 0; m.idle = 0; }
          continue;
        }
        if (m.mode === "held") { m.lift += (1 - m.lift) * Math.min(1, h * 14); continue; }
        m.lift += (0 - m.lift) * Math.min(1, h * 14);
        m.vy += GRAVITY * h;
        m.vx *= 1 - 0.1 * h; m.vy *= 1 - 0.1 * h;
        m.x += m.vx * h; m.y += m.vy * h;
        for (const r of rails) collideLine(m, r.ax, r.ay, r.bx, r.by, 8, false);
        collideLine(m, FLOOR[0] - 40, FLOOR[1] + 2.1, FLOOR[2] + 40, FLOOR[3] - 2.1, 0, true);
        if (m.x < -WALL + RAD) { m.x = -WALL + RAD; if (m.vx < 0) m.vx *= -0.4; }
        if (m.x > WALL - RAD) { m.x = WALL - RAD; if (m.vx > 0) m.vx *= -0.4; }
        if (m.y < 40 + RAD && m.vy < 0) m.vy *= -0.3;
        // Striking the bell: the marble gives up some of its speed to the swing.
        const dx = m.x - bx, dy = m.y - by, d = Math.hypot(dx, dy), min = RAD + BELL;
        if (d < min && d > 0) {
          const nx = dx / d, ny = dy / d, tn = cb * nx - sb * ny;
          const vrel = (m.vx - ARM * bell.w * cb) * nx + (m.vy + ARM * bell.w * sb) * ny;
          m.x += nx * (min - d); m.y += ny * (min - d);
          if (vrel < 0) {
            const j = (-(1 + 0.5) * vrel) / (1 + (tn * tn) / 1.5);
            m.vx += j * nx; m.vy += j * ny; bell.w -= (j * tn) / (1.5 * ARM);
            if (j > 170) { if (bell.ring < 0.3) { count += 1; setRings(count); } bell.ring = 1; }
          }
        }
        const still = Math.hypot(m.vx, m.vy) < 26 && m.y > 520;
        m.idle = still ? m.idle + h : 0;
      }
      for (let a = 0; a < balls.length; a++) for (let b = a + 1; b < balls.length; b++) {
        const p = balls[a], q = balls[b];
        if (p.lift > 0.3 || q.lift > 0.3) continue;
        const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
        if (d >= RAD * 2 || d === 0) continue;
        const nx = dx / d, ny = dy / d, push = (RAD * 2 - d) / 2;
        p.x -= nx * push; p.y -= ny * push; q.x += nx * push; q.y += ny * push;
        const vn = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
        if (vn < 0) { const j = -(1 + 0.6) * vn / 2; p.vx -= j * nx; p.vy -= j * ny; q.vx += j * nx; q.vy += j * ny; }
      }
    };

    const send = () => {
      // The marble that has waited longest in the tray goes next.
      let best: Marble | null = null;
      for (const m of balls) if (m.mode === "free" && m.idle > 0.25 && (!best || m.idle > best.idle)) best = m;
      if (!best) for (const m of balls) if (m.mode === "free" && m.y > 500 && (!best || m.y > best.y)) best = m;
      if (!best) return false;
      best.mode = "carried"; best.q = 0; best.fx = best.x; best.fy = best.y; best.idle = 0;
      return true;
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, nextDemo = 0.5;
    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      let dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (time > nextDemo && now - touched > 4000) { send(); nextDemo = time + 1.7; }
      while (dt > 1e-5) { const h = Math.min(dt, 1 / 240); step(h); dt -= h; }
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(frame); } };

    api.current = {
      drop: () => {
        touched = performance.now();
        if (reduce) {
          // Without motion: work out where everything ends up and show that.
          if (send()) for (let i = 0; i < 240 * 9; i++) step(1 / 240);
          draw(); return;
        }
        send(); wake();
      },
    };

    const local = (e: PointerEvent) => ({ x: (e.clientX - box.left - ox) / scale, y: (e.clientY - box.top - oy) / scale });
    let held: Marble | null = null, px = 0, py = 0, pt = 0;
    const onDown = (e: PointerEvent) => {
      box = cv.getBoundingClientRect();
      const p = local(e);
      let best: Marble | null = null, bd = RAD + 16;
      for (const m of balls) { const d = Math.hypot(m.x - p.x, m.y - p.y); if (d < bd && m.mode !== "carried") { bd = d; best = m; } }
      if (!best || reduce) return;
      held = best; best.mode = "held"; best.vx = 0; best.vy = 0; px = p.x; py = p.y; pt = performance.now(); touched = pt;
      pad.setPointerCapture(e.pointerId); e.preventDefault(); wake();
    };
    const onMove = (e: PointerEvent) => {
      if (!held) return;
      const p = local(e), now = performance.now(), dt = Math.max(0.008, (now - pt) / 1000);
      const x = Math.max(-WALL + RAD, Math.min(WALL - RAD, p.x)), y = Math.max(40 + RAD, Math.min(FLOOR[3] - RAD, p.y));
      held.vx = held.vx * 0.5 + ((x - px) / dt) * 0.5; held.vy = held.vy * 0.5 + ((y - py) / dt) * 0.5;
      held.rot += (x - px) / RAD;
      held.x = x; held.y = y; px = x; py = y; pt = now; touched = now;
    };
    const onUp = () => {
      if (!held) return;
      const sp = Math.hypot(held.vx, held.vy), cap = 1100;
      if (sp > cap) { held.vx *= cap / sp; held.vy *= cap / sp; }
      if (performance.now() - pt > 90) { held.vx = 0; held.vy = 0; }
      held.mode = "free"; held.idle = 0; held = null; touched = performance.now();
    };
    pad.addEventListener("pointerdown", onDown);
    pad.addEventListener("pointermove", onMove);
    pad.addEventListener("pointerup", onUp);
    pad.addEventListener("pointercancel", onUp);

    fit();
    if (reduce) { for (let i = 0; i < 120; i++) step(1 / 240); draw(); } else wake();
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
    <div className="relative flex h-[620px] w-full flex-col overflow-hidden bg-[#3a5fc4] bg-[radial-gradient(100%_80%_at_42%_30%,#5c82e6_0%,#3a5fc4_55%,#2b4aa3_100%)] sm:h-[760px]">
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <div ref={hit} aria-hidden="true" className="absolute cursor-grab touch-none active:cursor-grabbing" />
      <div className="pointer-events-none relative mx-auto mt-auto flex w-full max-w-[880px] flex-col items-center gap-3 px-5 pb-6 text-[13px] sm:flex-row sm:justify-between sm:pb-8">
        <p className="text-center text-blue-50 sm:text-left">
          <span className="font-semibold text-white">Marble run</span>
          <span className="mx-2 text-blue-200">/</span>
          pick up a marble and let go anywhere
          <span aria-live="polite" className="ml-3 inline-block min-w-[92px] rounded-full bg-[#213a86] px-3 py-1 text-center font-mono text-[11px] text-white">
            bell rung {rings}
          </span>
        </p>
        <button
          type="button"
          onClick={() => api.current?.drop()}
          className="pointer-events-auto min-h-[40px] shrink-0 rounded-full bg-[#f6e3bd] px-5 font-medium text-[#3b2414] shadow-[0_12px_24px_-12px_rgba(10,20,70,0.8)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#3a5fc4] motion-reduce:transition-none"
        >
          Drop a marble
        </button>
      </div>
    </div>
  );
}

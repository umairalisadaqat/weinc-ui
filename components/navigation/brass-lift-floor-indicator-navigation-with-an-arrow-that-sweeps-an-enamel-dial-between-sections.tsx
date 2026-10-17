import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// The floors, left to right across the dial. `mark` is engraved on the enamel, `name` under it.
const floors = [
  { mark: "G", name: "Lobby", note: "Front desk, post room and the way in from the street" },
  { mark: "1", name: "Work", note: "Twelve recent buildings, drawn and photographed" },
  { mark: "2", name: "Studio", note: "Nine architects, two model makers and a dog" },
  { mark: "3", name: "Journal", note: "Site diaries and notes from the drawing board" },
  { mark: "4", name: "Contact", note: "Ring the bell or write to the top floor" },
];
const SWEEP = 128; // degrees between the first floor and the last
const SPEED = 1.15; // how fast the car travels, in radians of needle per second
const LAMP = "#ffab3d"; // the direction lamps
const START = 2; // floor the car is waiting at when the page loads
const VW = 600, VH = 424; // drawing size in design pixels
const PX = 300, PY = 318; // the needle's pivot
const R = 246; // radius of the brass plate

const floorAngle = (i: number) => ((floors.length === 1 ? 0 : i / (floors.length - 1) - 0.5) * SWEEP * Math.PI) / 180;

export default function BrassLiftFloorIndicator() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [floor, setFloor] = useState(START);
  const floorRef = useRef(START);
  const api = useRef<{ go: (i: number, fromUser: boolean) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, wrap = stage.current;
    if (!cv || !wrap) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1) * 1.2;
    cv.width = VW * dpr; cv.height = VH * dpr;
    const hasConic = typeof ctx.createConicGradient === "function";
    let seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // Brass runs from a red-brown shadow through gold to a pale straw highlight.
    const brass = (v: number, a = 1) => { const t = Math.max(0, Math.min(1, v / 255)); return `rgba(${(52 + 203 * t) | 0},${(31 + 203 * Math.pow(t, 1.12)) | 0},${(6 + 160 * Math.pow(t, 1.7)) | 0},${a})`; };
    const platePath = (c: CanvasRenderingContext2D, inset = 0) => {
      c.beginPath(); c.arc(PX, PY, R - inset, Math.PI, Math.PI * 2);
      c.lineTo(PX + R - inset, PY + 40 - inset); c.lineTo(PX - R + inset, PY + 40 - inset); c.closePath();
    };
    const band = (c: CanvasRenderingContext2D, r0: number, r1: number) => { c.beginPath(); c.arc(PX, PY, r1, Math.PI, Math.PI * 2); c.arc(PX, PY, r0, Math.PI * 2, Math.PI, true); c.closePath(); };

    // Brushing: the plate was spun against an abrasive, so the grain is circles about the pivot. Drawn once.
    const grain = document.createElement("canvas");
    grain.width = cv.width; grain.height = cv.height;
    const gx = grain.getContext("2d");
    if (gx) {
      gx.scale(dpr, dpr);
      for (let r = 3; r < R + 44; r += 0.5) {
        const v = rand(), from = Math.PI * (1 + rand() * 0.25), to = from + Math.PI * (0.3 + rand() * 0.9);
        gx.beginPath(); gx.arc(PX, PY, r, r < R ? Math.PI * 0.9 : from, r < R ? Math.PI * 2.1 : to);
        gx.lineWidth = 0.45 + rand() * 0.4;
        gx.strokeStyle = v > 0.5 ? `rgba(255,244,205,${(v - 0.5) * 0.36})` : `rgba(40,20,0,${(0.5 - v) * 0.34})`;
        gx.stroke();
      }
      // a few longer scratches from eighty years of polishing
      for (let k = 0; k < 26; k++) {
        const r = 20 + rand() * (R - 24), a0 = Math.PI * (1 + rand());
        gx.beginPath(); gx.arc(PX, PY, r, a0, a0 + 0.1 + rand() * 0.5);
        gx.lineWidth = 0.6; gx.strokeStyle = `rgba(255,248,220,${0.1 + rand() * 0.16})`; gx.stroke();
      }
    }
    // Fine speckle baked into the enamel so it does not read as flat paint.
    const fleck = document.createElement("canvas");
    fleck.width = cv.width; fleck.height = cv.height;
    const fx = fleck.getContext("2d");
    if (fx) {
      fx.scale(dpr, dpr);
      for (let k = 0; k < 2600; k++) {
        const r = 128 + rand() * 82, a = Math.PI * (1 + rand());
        fx.fillStyle = rand() > 0.5 ? `rgba(120,96,60,${rand() * 0.1})` : `rgba(255,255,255,${rand() * 0.2})`;
        fx.fillRect(PX + Math.cos(a) * r, PY + Math.sin(a) * r, 0.5 + rand() * 0.9, 0.5 + rand() * 0.9);
      }
    }

    const s = { a: floorAngle(START), v: 0, target: floorAngle(START), light: 0, lightTo: 0, up: 0, down: 0, glow: floors.map((_, i) => (i === START ? 1 : 0)) };

    const sheen = (shift: number, lo: number, hi: number) => {
      if (!hasConic) { const g = ctx.createLinearGradient(PX - R, 0, PX + R, 0); g.addColorStop(0, brass(lo)); g.addColorStop(0.42 + shift * 0.2, brass(hi)); g.addColorStop(1, brass(lo)); return g; }
      const g = ctx.createConicGradient(Math.PI + shift, PX, PY);
      const mid = (lo + hi) / 2;
      const stops: [number, number][] = [[0, lo + 6], [0.05, mid - 8], [0.1, lo - 6], [0.15, mid + 12], [0.185, hi - 18], [0.21, hi], [0.235, hi - 30], [0.27, mid + 2], [0.31, lo + 12], [0.35, mid - 14], [0.385, mid + 30], [0.41, mid - 4], [0.45, lo - 10], [0.5, lo + 4], [0.75, lo - 16], [1, lo + 6]];
      for (const [p, v] of stops) g.addColorStop(p, brass(v));
      return g;
    };

    const engrave = (text: string, x: number, y: number, ink: string) => {
      ctx.fillStyle = "rgba(255,246,214,0.55)"; ctx.fillText(text, x + 0.5, y + 0.9);
      ctx.fillStyle = ink; ctx.fillText(text, x, y);
    };

    const lamp = (x: number, upward: boolean, on: number) => {
      // brass bezel, dark socket, glass triangle
      ctx.save(); ctx.shadowColor = "rgba(40,18,0,0.55)"; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2 * dpr;
      ctx.beginPath(); ctx.arc(x, PY + 20, 14, 0, Math.PI * 2); ctx.fillStyle = brass(120); ctx.fill(); ctx.restore();
      const bz = ctx.createLinearGradient(0, PY + 6, 0, PY + 34); bz.addColorStop(0, brass(250)); bz.addColorStop(0.5, brass(150)); bz.addColorStop(1, brass(70));
      ctx.beginPath(); ctx.arc(x, PY + 20, 14, 0, Math.PI * 2); ctx.fillStyle = bz; ctx.fill();
      ctx.beginPath(); ctx.arc(x, PY + 20, 10.5, 0, Math.PI * 2); ctx.fillStyle = "#170d05"; ctx.fill();
      const d = upward ? -1 : 1, cy = PY + 20 + d * 1.2;
      ctx.save();
      ctx.beginPath(); ctx.moveTo(x, cy + d * 6.4); ctx.lineTo(x - 6.6, cy - d * 5); ctx.lineTo(x + 6.6, cy - d * 5); ctx.closePath();
      ctx.shadowColor = LAMP; ctx.shadowBlur = 22 * on; ctx.globalAlpha = 0.2 + 0.8 * on; ctx.fillStyle = LAMP; ctx.fill();
      ctx.shadowBlur = 0; ctx.globalAlpha = on; ctx.fillStyle = "rgba(255,244,214,0.75)";
      ctx.beginPath(); ctx.moveTo(x, cy + d * 3.4); ctx.lineTo(x - 3.2, cy - d * 2.6); ctx.lineTo(x + 3.2, cy - d * 2.6); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(x - 3.5, PY + 14.5, 4.6, 2.2, -0.5, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fill();
    };

    const needle = () => {
      const g = ctx.createLinearGradient(-11, 0, 11, 0);
      g.addColorStop(0, "#05070c"); g.addColorStop(0.42, "#1c2536"); g.addColorStop(0.5, "#5d6f8f"); g.addColorStop(0.58, "#1a2231"); g.addColorStop(1, "#04060a");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -128);
      ctx.bezierCurveTo(5, -116, 13.5, -100, 14, -88); ctx.lineTo(4, -95); ctx.lineTo(5.6, -20);
      ctx.bezierCurveTo(5.8, 2, 5.2, 8, 3.6, 13);
      ctx.lineTo(-3.6, 13);
      ctx.bezierCurveTo(-5.2, 8, -5.8, 2, -5.6, -20); ctx.lineTo(-4, -95); ctx.lineTo(-14, -88);
      ctx.bezierCurveTo(-13.5, -100, -5, -116, 0, -128);
      ctx.closePath(); ctx.fill();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, VW, VH);
      const la = s.light;

      // The plate's shadow on the stone: one wide and soft, one tight under its edge.
      ctx.save(); ctx.shadowColor = "rgba(64,44,20,0.42)"; ctx.shadowBlur = 34 * dpr; ctx.shadowOffsetY = 18 * dpr; ctx.shadowOffsetX = -5 * la * dpr;
      platePath(ctx, 6); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      ctx.save(); ctx.shadowColor = "rgba(40,24,6,0.6)"; ctx.shadowBlur = 5 * dpr; ctx.shadowOffsetY = 3 * dpr;
      platePath(ctx, 1); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();

      // Brass plate: sheen, brushing, then the cast mouldings.
      platePath(ctx); ctx.fillStyle = sheen(la * 0.22, 88, 252); ctx.fill();
      ctx.save(); platePath(ctx); ctx.clip();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(grain, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const fall = ctx.createLinearGradient(0, PY - R, 0, PY + 40);
      fall.addColorStop(0, "rgba(255,246,210,0.2)"); fall.addColorStop(0.4, "rgba(255,246,210,0)"); fall.addColorStop(1, "rgba(48,22,0,0.3)");
      ctx.fillStyle = fall; ctx.fillRect(0, 0, VW, VH);
      ctx.restore();
      // outer bevel
      const edge = ctx.createLinearGradient(0, PY - R, 0, PY + 40);
      edge.addColorStop(0, "rgba(255,250,226,0.95)"); edge.addColorStop(0.5, "rgba(255,240,190,0.25)"); edge.addColorStop(1, "rgba(50,24,0,0.75)");
      platePath(ctx, 1); ctx.lineWidth = 2; ctx.strokeStyle = edge; ctx.stroke();
      // a raised bead running round the rim
      for (const [inset, w, c0, c1] of [[9, 5, "rgba(46,22,0,0.5)", "rgba(255,248,214,0.5)"], [10.2, 2.4, "rgba(255,250,224,0.85)", "rgba(70,36,0,0.6)"]] as [number, number, string, string][]) {
        const g = ctx.createLinearGradient(0, PY - R, 0, PY + 40); g.addColorStop(0, c0); g.addColorStop(1, c1);
        platePath(ctx, inset); ctx.lineWidth = w; ctx.strokeStyle = g; ctx.stroke();
      }

      // Engraved sunburst in the centre of the plate.
      ctx.save(); ctx.lineCap = "round";
      for (let k = 1; k < 30; k++) {
        const a = Math.PI + (k / 30) * Math.PI, long = k % 2 === 0, r0 = long ? 34 : 58, r1 = long ? 114 : 104;
        const cos = Math.cos(a), sin = Math.sin(a);
        ctx.lineWidth = long ? 1.2 : 0.8;
        ctx.strokeStyle = "rgba(255,246,210,0.5)"; ctx.beginPath(); ctx.moveTo(PX + cos * r0 + 0.5, PY + sin * r0 + 0.9); ctx.lineTo(PX + cos * r1 + 0.5, PY + sin * r1 + 0.9); ctx.stroke();
        ctx.strokeStyle = "rgba(58,28,0,0.62)"; ctx.beginPath(); ctx.moveTo(PX + cos * r0, PY + sin * r0); ctx.lineTo(PX + cos * r1, PY + sin * r1); ctx.stroke();
      }
      ctx.restore();

      // The enamel band, let into the brass.
      band(ctx, 126, 212); ctx.fillStyle = "rgba(40,18,0,0.7)"; ctx.fill();
      const en = ctx.createRadialGradient(PX, PY, 128, PX, PY, 210);
      en.addColorStop(0, "#e2d6ba"); en.addColorStop(0.12, "#f1e8d2"); en.addColorStop(0.6, "#f8f1df"); en.addColorStop(0.9, "#efe5cc"); en.addColorStop(1, "#cfc19f");
      band(ctx, 128, 210); ctx.fillStyle = en; ctx.fill();
      ctx.save(); band(ctx, 128, 210); ctx.clip();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(fleck, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // shadow the brass lip throws onto the enamel, and the gloss of the glaze
      ctx.lineWidth = 7; ctx.strokeStyle = "rgba(70,44,10,0.26)"; ctx.beginPath(); ctx.arc(PX - la * 2, PY + 3.5, 211, Math.PI, Math.PI * 2); ctx.stroke();
      if (hasConic) {
        const gl = ctx.createConicGradient(Math.PI + la * 0.3, PX, PY);
        gl.addColorStop(0, "rgba(255,255,255,0)"); gl.addColorStop(0.14, "rgba(255,255,255,0)"); gl.addColorStop(0.2, "rgba(255,255,255,0.75)"); gl.addColorStop(0.24, "rgba(255,255,255,0.1)"); gl.addColorStop(0.27, "rgba(255,255,255,0.4)"); gl.addColorStop(0.3, "rgba(255,255,255,0)"); gl.addColorStop(1, "rgba(255,255,255,0)");
        ctx.lineWidth = 9; ctx.strokeStyle = gl; ctx.beginPath(); ctx.arc(PX, PY, 197, Math.PI, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      // brass fillets either side of the enamel
      for (const r of [126.5, 211.5]) {
        ctx.lineWidth = 2.6; ctx.strokeStyle = sheen(la * 0.22 + 0.4, 120, 255); ctx.beginPath(); ctx.arc(PX, PY, r, Math.PI, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(50,24,0,0.55)"; ctx.beginPath(); ctx.arc(PX, PY, r + (r < 200 ? 1.5 : -1.5), Math.PI, Math.PI * 2); ctx.stroke();
      }

      // Scale: a minute track, then numerals and names fired into the glaze.
      const half = (SWEEP / 2 + 9) * (Math.PI / 180);
      for (let k = -40; k <= 40; k++) {
        const ang = (k * 2 * Math.PI) / 180;
        if (Math.abs(ang) > half) continue;
        const sin = Math.sin(ang), cos = -Math.cos(ang);
        const main = floors.some((_, i) => Math.abs(floorAngle(i) - ang) < 0.012), five = k % 4 === 0;
        ctx.beginPath(); ctx.moveTo(PX + sin * 204.5, PY + cos * 204.5); ctx.lineTo(PX + sin * (main ? 191 : five ? 197 : 200), PY + cos * (main ? 191 : five ? 197 : 200));
        ctx.lineWidth = main ? 2 : 0.9; ctx.strokeStyle = main ? "#191512" : "rgba(25,21,18,0.6)"; ctx.stroke();
      }
      ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(25,21,18,0.75)";
      ctx.beginPath(); ctx.arc(PX, PY, 205, -Math.PI / 2 - half, -Math.PI / 2 + half); ctx.stroke();
      ctx.beginPath(); ctx.arc(PX, PY, 134, -Math.PI / 2 - half, -Math.PI / 2 + half); ctx.stroke();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      floors.forEach((f, i) => {
        const ang = floorAngle(i), on = s.glow[i];
        ctx.save(); ctx.translate(PX + Math.sin(ang) * 174, PY - Math.cos(ang) * 174); ctx.rotate(ang);
        ctx.font = '700 34px Didot, "Bodoni MT", "Bodoni 72", Georgia, "Times New Roman", serif';
        ctx.fillStyle = `rgb(${(25 + 138 * on) | 0},${(21 + 4 * on) | 0},${(18 - 2 * on) | 0})`;
        ctx.fillText(f.mark, 0, 1);
        ctx.font = "700 7.2px ui-sans-serif, system-ui, -apple-system, Helvetica, Arial, sans-serif";
        ctx.fillStyle = `rgba(25,21,18,${0.62 + 0.38 * on})`;
        const word = f.name.toUpperCase().split("").join("  ");
        ctx.fillText(word, 0, 27);
        ctx.restore();
      });

      // The base bar: lamps, legend, screws.
      lamp(PX - 196, true, s.up); lamp(PX + 196, false, s.down);
      ctx.font = "700 8px ui-sans-serif, system-ui, -apple-system, Helvetica, Arial, sans-serif"; ctx.textBaseline = "middle";
      ctx.textAlign = "left"; engrave("U P", PX - 174, PY + 20.5, "rgba(52,26,0,0.85)");
      ctx.textAlign = "right"; engrave("D O W N", PX + 174, PY + 20.5, "rgba(52,26,0,0.85)");
      for (const [x, y, rot] of [[PX - 232, PY + 20, 0.6], [PX + 232, PY + 20, -0.3], [PX, PY - R + 22, 1.2]] as [number, number, number][]) {
        ctx.beginPath(); ctx.arc(x, y + 0.8, 5.4, 0, Math.PI * 2); ctx.fillStyle = "rgba(40,18,0,0.6)"; ctx.fill();
        const sg = ctx.createRadialGradient(x - 1.5, y - 2, 0.5, x, y, 5); sg.addColorStop(0, brass(255)); sg.addColorStop(0.6, brass(170)); sg.addColorStop(1, brass(84));
        ctx.beginPath(); ctx.arc(x, y, 4.6, 0, Math.PI * 2); ctx.fillStyle = sg; ctx.fill();
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = "rgba(34,14,0,0.85)"; ctx.fillRect(-4, -0.7, 8, 1.4); ctx.fillStyle = "rgba(255,246,210,0.5)"; ctx.fillRect(-4, 0.7, 8, 0.5); ctx.restore();
      }

      // Needle: its shadow lies further from it the higher it stands off the dial, and slides with the light.
      ctx.save(); ctx.translate(PX + 5 - la * 4, PY + 10); ctx.rotate(s.a); ctx.filter = "blur(3px)"; ctx.globalAlpha = 0.34; ctx.fillStyle = "#2a1600";
      needle(); ctx.restore();
      ctx.save(); ctx.translate(PX + 1.5, PY + 2.5); ctx.rotate(s.a); ctx.globalAlpha = 0.3; needle(); ctx.restore();
      ctx.save(); ctx.translate(PX, PY); ctx.rotate(s.a); needle();
      ctx.strokeStyle = "rgba(170,196,240,0.5)"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-0.6, -124); ctx.lineTo(-0.6, 12); ctx.stroke();
      ctx.restore();

      // Hub: a domed brass boss with a slotted screw.
      ctx.save(); ctx.shadowColor = "rgba(30,12,0,0.6)"; ctx.shadowBlur = 8 * dpr; ctx.shadowOffsetY = 4 * dpr;
      ctx.beginPath(); ctx.arc(PX, PY, 19, 0, Math.PI * 2); ctx.fillStyle = brass(130); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(PX, PY, 19, 0, Math.PI * 2); ctx.fillStyle = hasConic ? sheen(la * 0.3 + 0.9, 96, 255) : brass(190); ctx.fill();
      const dome = ctx.createRadialGradient(PX - 6 - la * 3, PY - 8, 1, PX, PY, 19);
      dome.addColorStop(0, "rgba(255,252,236,0.95)"); dome.addColorStop(0.3, "rgba(255,240,190,0.25)"); dome.addColorStop(0.75, "rgba(60,30,0,0)"); dome.addColorStop(1, "rgba(50,22,0,0.6)");
      ctx.beginPath(); ctx.arc(PX, PY, 19, 0, Math.PI * 2); ctx.fillStyle = dome; ctx.fill();
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(40,18,0,0.7)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(PX, PY, 7.5, 0, Math.PI * 2); ctx.fillStyle = brass(210); ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(40,18,0,0.75)"; ctx.stroke();
      ctx.save(); ctx.translate(PX, PY); ctx.rotate(0.5); ctx.fillStyle = "rgba(30,12,0,0.9)"; ctx.fillRect(-7, -1, 14, 2); ctx.fillStyle = "rgba(255,248,220,0.6)"; ctx.fillRect(-7, 1, 14, 0.6); ctx.restore();
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, nextDemo = 500, t0 = 0, step = 0;
    const tour = [3, 1, 4, 0, 2]; // the floors the idle car visits
    const select = (i: number) => { if (floorRef.current !== i) { floorRef.current = i; setFloor(i); } };

    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      // A lift runs at a steady speed and only eases over the last stretch, so the pull is capped.
      const gap = s.target - s.a;
      s.v += (70 * Math.max(-0.42, Math.min(0.42, gap)) - 13 * s.v) * dt;
      s.v = Math.max(-SPEED, Math.min(SPEED, s.v));
      s.a += s.v * dt;
      const moving = Math.abs(gap) > 0.03;
      s.up += ((moving && gap > 0 ? 1 : 0) - s.up) * Math.min(1, dt * (moving ? 16 : 5));
      s.down += ((moving && gap < 0 ? 1 : 0) - s.down) * Math.min(1, dt * (moving ? 16 : 5));
      s.glow = s.glow.map((v, i) => v + ((i === floorRef.current && !moving ? 1 : 0) - v) * Math.min(1, dt * 7));
      if (now - touched > 6000) {
        s.lightTo = 0.55 * Math.sin(t / 2300);
        if (t > nextDemo && !moving) { const n = tour[step++ % tour.length]; s.target = floorAngle(n); select(n); nextDemo = t + 2900; }
      }
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 5);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const settle = () => { s.a = s.target; s.v = 0; s.up = 0; s.down = 0; s.glow = floors.map((_, i) => (i === floorRef.current ? 1 : 0)); draw(); };

    api.current = { go: (i, fromUser) => { if (fromUser) touched = performance.now(); s.target = floorAngle(i); select(i); if (reduce) settle(); else wake(); } };
    if (reduce) settle(); else wake();

    const onMove = (e: PointerEvent) => {
      const b = wrap.getBoundingClientRect();
      touched = Math.max(touched, performance.now() - 4200);
      s.lightTo = Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1));
      if (reduce) { s.light = s.lightTo; draw(); }
    };
    wrap.addEventListener("pointermove", onMove);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      wrap.removeEventListener("pointermove", onMove);
      io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const choose = (i: number) => { floorRef.current = i; setFloor(i); api.current?.go(i, true); };
  const onKey = (e: ReactKeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowUp" ? Math.min(floors.length - 1, i + 1) : e.key === "ArrowLeft" || e.key === "ArrowDown" ? Math.max(0, i - 1) : e.key === "Home" ? 0 : e.key === "End" ? floors.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault(); choose(next); tabs.current[next]?.focus();
  };

  return (
    <div ref={stage} className="flex min-h-[620px] w-full flex-col items-center justify-center bg-[#e6dfd2] bg-[radial-gradient(90%_70%_at_38%_22%,#f6f1e7_0%,#e6dfd2_52%,#cfc6b4_100%)] px-3 py-12 sm:min-h-[720px]">
      <div className="relative aspect-[600/424] w-full max-w-[600px] lg:max-w-[720px]">
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div role="tablist" aria-label="Floors" className="absolute inset-0">
          {floors.map((f, i) => {
            const a = floorAngle(i);
            return (
              <button
                key={f.name}
                ref={(el) => { tabs.current[i] = el; }}
                type="button"
                role="tab"
                id={`lift-tab-${i}`}
                aria-controls="lift-panel"
                aria-selected={floor === i}
                aria-label={`Floor ${f.mark}, ${f.name}`}
                tabIndex={floor === i ? 0 : -1}
                onClick={() => choose(i)}
                onKeyDown={(e) => onKey(e, i)}
                style={{ left: `${((PX + Math.sin(a) * 166) / VW) * 100}%`, top: `${((PY - Math.cos(a) * 166) / VH) * 100}%` }}
                className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#7a1a12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ecd8] sm:h-16 sm:w-16"
              />
            );
          })}
        </div>
      </div>
      <div id="lift-panel" role="tabpanel" aria-labelledby={`lift-tab-${floor}`} aria-live="polite" className="mt-1 min-h-[72px] max-w-[440px] text-center sm:mt-0">
        <p className="font-serif text-[28px] leading-none tracking-[-0.01em] text-[#2a2118]">
          <span className="mr-3 align-middle font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a5a16]">Floor {floors[floor].mark}</span>
          {floors[floor].name}
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase leading-5 tracking-[0.14em] text-[#5c5143]">{floors[floor].note}</p>
      </div>
    </div>
  );
}

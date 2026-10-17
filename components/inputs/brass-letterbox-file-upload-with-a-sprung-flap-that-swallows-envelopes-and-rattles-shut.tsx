import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

// The word cast into the flap, the hint under the plate and the post that arrives while nobody is using it.
const plate = { word: "LETTERS", hint: "Post a file through the door", rule: "PDF, image or zip, up to 20 MB each" };
const samples = [
  { name: "site-plan.pdf", size: "2.4 MB" },
  { name: "signed-lease.pdf", size: "310 KB" },
  { name: "kitchen-photos.zip", size: "18 MB" },
];
const MAX_SHOWN = 3;

type Posted = { key: number; name: string; size: string };
type Api = { post: (name: string) => void; hold: (on: boolean) => void; peek: (on: boolean) => void };
const sizeOf = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export default function BrassLetterboxFileUpload() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const api = useRef<Api | null>(null);
  const waiting = useRef<Posted[]>([]);
  const serial = useRef(0);
  const depth = useRef(0);
  const [posted, setPosted] = useState<Posted[]>([]);
  const [mine, setMine] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = Math.min(2, window.devicePixelRatio || 1);
    const fixed = document.createElement("canvas"), face = document.createElement("canvas");
    const fc = fixed.getContext("2d"), tc = face.getContext("2d");
    if (!fc || !tc) return;

    let W = 720, H = 430, S = 1, cx = 360, cy = 170;
    let PW = 0, PH = 0, AW = 0, AH = 0, ax = 0, ay = 0; // plate and aperture
    const flap = { a: 0, v: 0, want: 0, push: false };
    type Letter = { art: HTMLCanvasElement; name: string; t: number; demo: boolean; done: boolean };
    let letters: Letter[] = [], queue: { name: string; demo: boolean }[] = [];
    let demo = true, demoAt = 0.45, demoIx = 0, hold = false, peek = false, light = 0, lightTo = 0;
    let raf = 0, last = 0, seen = true, clock = 0, touched = -1e9, kinds = 0;
    let seed = 3;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };
    // Polished brass mirrors the room: a pale ceiling, a dark line where wall meets floor, then warm floor light.
    const brass = (c: CanvasRenderingContext2D, y0: number, y1: number, shift: number) => {
      const g = c.createLinearGradient(0, y0, 0, y1), s = (p: number) => Math.max(0, Math.min(1, p + shift));
      g.addColorStop(0, "#fff2c0"); g.addColorStop(s(0.1), "#f3d684"); g.addColorStop(s(0.32), "#d7ab4a"); g.addColorStop(s(0.47), "#a67a29");
      g.addColorStop(s(0.515), "#6c4a13"); g.addColorStop(s(0.56), "#b98d35"); g.addColorStop(s(0.78), "#deb75a"); g.addColorStop(1, "#8d661f");
      return g;
    };
    const brushed = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const v = rand(), yy = y + rand() * h, x0 = x + rand() * w * 0.6, len = w * (0.15 + rand() * 0.5);
        c.fillStyle = v > 0.5 ? `rgba(255,250,220,${(v - 0.5) * 0.2})` : `rgba(70,44,6,${(0.5 - v) * 0.2})`;
        c.fillRect(x0, yy, Math.min(len, x + w - x0), 0.6);
      }
    };
    const screw = (c: CanvasRenderingContext2D, x: number, y: number, r: number, turn: number) => {
      c.beginPath(); c.arc(x, y + r * 0.18, r * 1.18, 0, Math.PI * 2); c.fillStyle = "rgba(50,30,4,0.55)"; c.fill();
      const g = c.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.1, x, y, r);
      g.addColorStop(0, "#fff6d2"); g.addColorStop(0.35, "#e4bf63"); g.addColorStop(0.8, "#a67b2a"); g.addColorStop(1, "#6d4c14");
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = g; c.fill();
      c.save(); c.translate(x, y); c.rotate(turn);
      c.fillStyle = "#3a2606"; c.fillRect(-r * 0.92, -r * 0.16, r * 1.84, r * 0.32);
      c.fillStyle = "rgba(255,240,190,0.7)"; c.fillRect(-r * 0.9, r * 0.16, r * 1.8, r * 0.1);
      c.restore();
    };

    const paintFixed = () => {
      fc.setTransform(q, 0, 0, q, 0, 0); fc.clearRect(0, 0, W, H); seed = 3;
      const px = cx - PW / 2, py = cy - PH / 2, R = 9 * S;
      // The plate stands a few millimetres off the paint: a tight contact shadow and a wide soft one.
      fc.save(); fc.shadowColor = "rgba(0,0,0,0.5)"; fc.shadowBlur = 34 * q * S; fc.shadowOffsetY = 20 * q * S; rr(fc, px + 6, py + 8, PW - 12, PH - 12, R); fc.fillStyle = "#000"; fc.fill(); fc.restore();
      fc.save(); fc.shadowColor = "rgba(0,0,0,0.7)"; fc.shadowBlur = 6 * q * S; fc.shadowOffsetY = 4 * q * S; rr(fc, px, py, PW, PH, R); fc.fillStyle = "#000"; fc.fill(); fc.restore();
      rr(fc, px, py, PW, PH, R); fc.fillStyle = brass(fc, py, py + PH, 0); fc.fill();
      fc.save(); rr(fc, px, py, PW, PH, R); fc.clip();
      brushed(fc, px, py, PW, PH, 520);
      // Outer bevel: lit along the top, shaded along the foot.
      const bev = fc.createLinearGradient(0, py, 0, py + PH);
      bev.addColorStop(0, "rgba(255,252,230,0.95)"); bev.addColorStop(0.5, "rgba(255,240,190,0.25)"); bev.addColorStop(1, "rgba(60,36,4,0.8)");
      fc.lineWidth = 5 * S; fc.strokeStyle = bev; rr(fc, px + 1.5 * S, py + 1.5 * S, PW - 3 * S, PH - 3 * S, R - 1); fc.stroke();
      fc.lineWidth = 1; fc.strokeStyle = "rgba(70,44,6,0.5)"; rr(fc, px + 5 * S, py + 5 * S, PW - 10 * S, PH - 10 * S, R - 3); fc.stroke();
      fc.restore();
      // Raised frame round the opening.
      const f = 9 * S;
      rr(fc, ax - f, ay - f, AW + f * 2, AH + f * 2, 5 * S); fc.fillStyle = brass(fc, ay - f - 20 * S, ay + AH + f + 16 * S, 0.06); fc.fill();
      const ring = fc.createLinearGradient(0, ay - f, 0, ay + AH + f);
      ring.addColorStop(0, "rgba(255,250,225,0.95)"); ring.addColorStop(0.2, "rgba(255,240,190,0.2)"); ring.addColorStop(0.8, "rgba(60,36,4,0.3)"); ring.addColorStop(1, "rgba(50,30,2,0.85)");
      fc.lineWidth = 2 * S; fc.strokeStyle = ring; rr(fc, ax - f + S, ay - f + S, AW + f * 2 - 2 * S, AH + f * 2 - 2 * S, 4 * S); fc.stroke();
      fc.save(); fc.shadowColor = "rgba(40,22,0,0.55)"; fc.shadowBlur = 5 * q * S; fc.shadowOffsetY = 3 * q * S; fc.lineWidth = 1; fc.strokeStyle = "rgba(60,36,4,0.6)"; rr(fc, ax - f, ay - f, AW + f * 2, AH + f * 2, 5 * S); fc.stroke(); fc.restore();
      // The hole, and the two rows of draught bristles behind it.
      const hole = fc.createLinearGradient(0, ay, 0, ay + AH);
      hole.addColorStop(0, "#000"); hole.addColorStop(0.5, "#0d0a06"); hole.addColorStop(1, "#1d150a");
      fc.fillStyle = hole; fc.fillRect(ax, ay, AW, AH);
      for (let x = ax; x < ax + AW; x += 1.1) {
        const v = rand(), mid = ay + AH * (0.56 + (rand() - 0.5) * 0.07);
        fc.strokeStyle = `rgba(${70 + v * 60},${62 + v * 52},${50 + v * 40},${0.16 + v * 0.3})`; fc.lineWidth = 0.6;
        fc.beginPath(); fc.moveTo(x, ay + AH * 0.1); fc.lineTo(x + (rand() - 0.5) * 3, mid); fc.stroke();
        fc.beginPath(); fc.moveTo(x, ay + AH); fc.lineTo(x + (rand() - 0.5) * 3, mid + 1.5); fc.stroke();
      }
      const inner = fc.createLinearGradient(0, ay, 0, ay + AH);
      inner.addColorStop(0, "rgba(0,0,0,0.95)"); inner.addColorStop(0.45, "rgba(0,0,0,0.25)"); inner.addColorStop(1, "rgba(0,0,0,0)");
      fc.fillStyle = inner; fc.fillRect(ax, ay, AW, AH);
      fc.fillStyle = "rgba(255,236,170,0.5)"; fc.fillRect(ax, ay + AH - 1, AW, 1);
      const sx = (PW - AW) / 4 + f * 0.1;
      screw(fc, px + sx, cy, 6.5 * S, 0.5); screw(fc, px + PW - sx, cy, 6.5 * S, -0.9);

      // The flap is painted once, flat, and squeezed as it swings.
      face.width = Math.ceil(AW * q); face.height = Math.ceil(AH * q);
      tc.setTransform(q, 0, 0, q, 0, 0); tc.clearRect(0, 0, AW, AH);
      tc.fillStyle = brass(tc, -AH * 0.54, AH * 2.06, 0); tc.fillRect(0, 0, AW, AH);
      brushed(tc, 0, 0, AW, AH, 300);
      // Hinge barrel along the top edge.
      const hb = 7 * S, hg = tc.createLinearGradient(0, 0, 0, hb);
      hg.addColorStop(0, "#8a6520"); hg.addColorStop(0.3, "#fff3c6"); hg.addColorStop(0.55, "#d3a745"); hg.addColorStop(1, "#5d400f");
      tc.fillStyle = hg; tc.fillRect(0, 0, AW, hb);
      tc.fillStyle = "rgba(50,30,2,0.55)"; tc.fillRect(0, hb, AW, 1.2);
      for (let x = AW / 10; x < AW - 4; x += AW / 5) { tc.fillStyle = "rgba(50,30,2,0.7)"; tc.fillRect(x, 0, 1, hb); tc.fillStyle = "rgba(255,246,205,0.6)"; tc.fillRect(x + 1, 0, 0.8, hb); }
      // Raised border and the cast word.
      const edge = tc.createLinearGradient(0, hb, 0, AH);
      edge.addColorStop(0, "rgba(255,250,225,0.8)"); edge.addColorStop(0.5, "rgba(255,240,190,0.12)"); edge.addColorStop(1, "rgba(60,36,4,0.7)");
      tc.lineWidth = 1.6 * S; tc.strokeStyle = edge; rr(tc, 9 * S, hb + 7 * S, AW - 18 * S, AH - hb - 14 * S, 3 * S); tc.stroke();
      tc.font = `700 ${22 * S}px Georgia, "Times New Roman", serif`; tc.textBaseline = "middle"; tc.textAlign = "left";
      const gap = 9 * S, widths = [...plate.word].map((ch) => tc.measureText(ch).width), total = widths.reduce((a, b) => a + b, 0) + gap * (plate.word.length - 1);
      const ty = hb + (AH - hb) / 2 + S;
      for (const [dy, col] of [[1.5 * S, "rgba(56,32,2,0.85)"], [-1.1 * S, "rgba(255,250,222,0.95)"], [0, "#dcb455"]] as const) {
        let x = (AW - total) / 2; tc.fillStyle = col;
        [...plate.word].forEach((ch, i) => { tc.fillText(ch, x, ty + dy); x += widths[i] + gap; });
      }
      // A thick lower lip.
      const lip = tc.createLinearGradient(0, AH - 5 * S, 0, AH); lip.addColorStop(0, "rgba(255,246,205,0)"); lip.addColorStop(0.5, "rgba(255,246,205,0.75)"); lip.addColorStop(1, "rgba(80,50,6,0.9)");
      tc.fillStyle = lip; tc.fillRect(0, AH - 5 * S, AW, 5 * S);
    };

    // Each envelope is drawn flat, then laid down in perspective strip by strip.
    const envelope = (name: string) => {
      const kind = kinds++ % 3, w = 300, h = 200, c = document.createElement("canvas");
      c.width = w * 2; c.height = h * 2;
      const e = c.getContext("2d"); if (!e) return c;
      e.scale(2, 2);
      e.fillStyle = kind === 0 ? "#f5efe0" : kind === 1 ? "#c9a26b" : "#dfe9f1"; e.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) { const v = rand(); e.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.3})` : `rgba(60,40,10,${(0.5 - v) * 0.16})`; e.fillRect(rand() * w, rand() * h, 1.4, 0.7); }
      if (kind === 0) {
        // Airmail edging.
        e.save(); e.beginPath(); e.rect(0, 0, w, h); e.rect(11, 11, w - 22, h - 22); e.clip("evenodd");
        for (let x = -h; x < w + h; x += 26) { e.fillStyle = Math.round(x / 26) % 2 ? "#c7352d" : "#27478f"; e.beginPath(); e.moveTo(x, 0); e.lineTo(x + 13, 0); e.lineTo(x + 13 - h, h); e.lineTo(x - h, h); e.closePath(); e.fill(); }
        e.restore();
      }
      if (kind === 1) { e.strokeStyle = "rgba(90,58,20,0.5)"; e.lineWidth = 1.2; e.beginPath(); e.moveTo(0, 0); e.lineTo(w / 2, h * 0.36); e.lineTo(w, 0); e.stroke(); }
      // A stamp, a postmark and the address label that carries the file name.
      const sx = w - 66, sy = kind === 0 ? 24 : 16;
      e.fillStyle = "#fbf8ef"; e.fillRect(sx, sy, 42, 50);
      e.fillStyle = kind === 1 ? "#2f6f62" : "#b8562f"; e.fillRect(sx + 4, sy + 4, 34, 42);
      e.fillStyle = "rgba(255,255,255,0.85)"; e.beginPath(); e.moveTo(sx + 6, sy + 40); e.lineTo(sx + 17, sy + 20); e.lineTo(sx + 24, sy + 31); e.lineTo(sx + 29, sy + 25); e.lineTo(sx + 36, sy + 40); e.closePath(); e.fill();
      e.strokeStyle = "rgba(30,30,40,0.55)"; e.lineWidth = 1.3;
      e.beginPath(); e.arc(sx - 22, sy + 30, 19, 0, Math.PI * 2); e.stroke(); e.beginPath(); e.arc(sx - 22, sy + 30, 13, 0, Math.PI * 2); e.stroke();
      for (let k = 0; k < 4; k++) { e.beginPath(); for (let x = 0; x <= 40; x += 4) e.lineTo(sx - 4 + x, sy + 14 + k * 8 + Math.sin(x * 0.5) * 2); e.stroke(); }
      e.fillStyle = "#fffdf6"; e.fillRect(34, 92, 190, 70);
      e.fillStyle = "rgba(0,0,0,0.12)"; e.fillRect(34, 162, 190, 1.5);
      e.fillStyle = "#22252c"; e.font = '700 17px "Courier New", Courier, monospace'; e.textBaseline = "middle"; e.textAlign = "left";
      let label = name; while (label.length > 4 && e.measureText(label).width > 170) label = label.slice(0, -2);
      e.fillText(label === name ? name : `${label.slice(0, -1)}...`, 44, 116);
      e.fillStyle = "rgba(34,37,44,0.5)"; e.fillRect(44, 134, 120, 3); e.fillRect(44, 145, 84, 3);
      return c;
    };

    const TRAVEL = 3.4, ARRIVE = 0.75;
    // How far in the letter is, 0 to 1: one push, a breath, then the rest drops through.
    const pushed = (t: number) => {
      const u = Math.max(0, Math.min(1, (t - ARRIVE) / TRAVEL));
      const ease = (x: number) => x * x * (3 - 2 * x);
      return u < 0.3 ? 0.3 * ease(u / 0.3) : u < 0.56 ? 0.3 + 0.04 * ((u - 0.3) / 0.26) : 0.34 + 0.66 * Math.pow((u - 0.56) / 0.44, 1.8);
    };

    const drawLetter = (l: Letter) => {
      const a = Math.max(0, Math.min(1, l.t / ARRIVE)), near = 1 - (1 - a) * (1 - a), p = pushed(l.t);
      if (p >= 1) return;
      const slot = ay + AH * 0.6, w0 = AW * 0.8, out = 150 * S * (1 - p), n = Math.max(2, Math.ceil(out / 2));
      ctx.save();
      ctx.translate(cx, slot + (1 - near) * 80 * S); ctx.rotate((1 - near) * -0.07); ctx.scale(1 + (1 - near) * 0.12, 1 + (1 - near) * 0.5);
      ctx.globalAlpha = Math.min(1, a * 3.2);
      // Its shadow on the door and the plate, longer the further it still sticks out.
      ctx.save(); ctx.setTransform(q, 0, 0, q, -6000, 0); ctx.shadowOffsetX = 6000; ctx.shadowColor = `rgba(0,0,0,${0.5 * Math.min(1, (1 - p) * 5)})`; ctx.shadowBlur = (10 + (1 - near) * 22) * q * S;
      ctx.fillStyle = "#000"; ctx.fillRect(cx - w0 * 0.52, slot + (1 - near) * 130 * S + 6 * S, w0 * 1.04, out * 1.42 + 6 * S); ctx.restore();
      for (let i = 0; i < n; i++) {
        const f0 = i / n, f1 = (i + 1) / n, v0 = p + (1 - p) * f0, v1 = p + (1 - p) * f1, wide = w0 * (1 + 0.17 * (v0 - p));
        ctx.drawImage(l.art, 0, v0 * l.art.height, l.art.width, Math.max(1, (v1 - v0) * l.art.height), -wide / 2, out * f0, wide, out / n + 0.7);
      }
      const wn = w0 * (1 + 0.17 * (1 - p));
      // Shade where it passes under the frame, light along the near edge, then the thickness of the paper.
      const shade = ctx.createLinearGradient(0, 0, 0, Math.min(out, 26 * S)); shade.addColorStop(0, "rgba(0,0,0,0.62)"); shade.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = shade; ctx.beginPath(); ctx.moveTo(-w0 / 2, 0); ctx.lineTo(w0 / 2, 0); ctx.lineTo(wn / 2, out); ctx.lineTo(-wn / 2, out); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fillRect(-wn / 2, out - 0.4, wn, 1.2 * S);
      ctx.fillStyle = "rgba(120,104,80,0.95)"; ctx.fillRect(-wn / 2, out + 0.8 * S, wn, 1.5 * S);
      ctx.restore();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(fixed, 0, 0);
      ctx.setTransform(q, 0, 0, q, 0, 0);
      // The flap: hinged along the top, swinging away from us, so it shortens and narrows a little.
      const cos = Math.cos(flap.a), sin = Math.sin(flap.a), fh = AH * cos, inset = (AW / 2) * (1 - 1 / (1 + sin * 0.08));
      ctx.save();
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + AW, ay); ctx.lineTo(ax + AW - inset, ay + fh); ctx.lineTo(ax + inset, ay + fh); ctx.closePath(); ctx.clip();
      ctx.drawImage(face, ax, ay, AW, Math.max(1, fh));
      const tilt = ctx.createLinearGradient(0, ay, 0, ay + fh);
      tilt.addColorStop(0, `rgba(0,0,0,${0.12 + sin * 0.5})`); tilt.addColorStop(0.5, `rgba(20,12,0,${sin * 0.42})`); tilt.addColorStop(1, `rgba(20,12,0,${sin * 0.6})`);
      ctx.fillStyle = tilt; ctx.fillRect(ax, ay, AW, fh);
      // One soft reflection that slides as the light moves.
      const gx = ax + AW * (0.32 + light * 0.22);
      const glare = ctx.createLinearGradient(gx - 70 * S, 0, gx + 90 * S, 0); glare.addColorStop(0, "rgba(255,255,240,0)"); glare.addColorStop(0.45, `rgba(255,255,240,${0.34 * cos})`); glare.addColorStop(1, "rgba(255,255,240,0)");
      ctx.fillStyle = glare; ctx.beginPath(); ctx.moveTo(gx - 50 * S, ay); ctx.lineTo(gx + 90 * S, ay); ctx.lineTo(gx + 50 * S, ay + fh); ctx.lineTo(gx - 90 * S, ay + fh); ctx.closePath(); ctx.fill();
      ctx.restore();
      if (flap.a < 0.04) { ctx.fillStyle = "rgba(40,22,0,0.5)"; ctx.fillRect(ax, ay + AH - 0.6, AW, 1.2); }
      // The same reflection carried across the fixed plate.
      const px = cx - PW / 2, py = cy - PH / 2, g2 = px + PW * (0.72 + light * 0.12);
      ctx.save(); rr(ctx, px, py, PW, PH, 9 * S); ctx.rect(ax - 9 * S, ay - 9 * S, AW + 18 * S, AH + 18 * S); ctx.clip("evenodd");
      const sweep = ctx.createLinearGradient(g2 - 60 * S, 0, g2 + 60 * S, 0); sweep.addColorStop(0, "rgba(255,255,240,0)"); sweep.addColorStop(0.5, "rgba(255,255,240,0.3)"); sweep.addColorStop(1, "rgba(255,255,240,0)");
      ctx.fillStyle = sweep; ctx.beginPath(); ctx.moveTo(g2 - 20 * S, py); ctx.lineTo(g2 + 100 * S, py); ctx.lineTo(g2 + 20 * S, py + PH); ctx.lineTo(g2 - 100 * S, py + PH); ctx.closePath(); ctx.fill();
      ctx.restore();
      for (const l of letters) drawLetter(l);
    };

    const layout = () => {
      const wide = cv.getBoundingClientRect().width >= 560;
      W = wide ? 720 : 400; H = wide ? 400 : 290; S = wide ? 1 : 0.68;
      cv.style.aspectRatio = `${W} / ${H}`;
      for (const c of [cv, fixed]) { c.width = W * q; c.height = H * q; }
      cx = W / 2; cy = wide ? 118 : 84; PW = 548 * S; PH = 168 * S; AW = 420 * S; AH = 86 * S; ax = cx - AW / 2; ay = cy - AH / 2;
      kinds = 0; paintFixed();
      for (const l of letters) l.art = envelope(l.name);
    };

    const deliver = (l: Letter) => { l.done = true; window.dispatchEvent(new CustomEvent("brass-letterbox-file-upload-delivered", { detail: { name: l.name, demo: l.demo, canvas: cv } })); };
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.04, (now - last) / 1000 || 0.016); last = now; clock += dt;
      if (demo && clock > demoAt && !letters.length) { queue.push({ name: samples[demoIx++ % samples.length].name, demo: true }); demoAt = clock + 6.4; }
      if (queue.length && !letters.some((l) => pushed(l.t) < 0.62)) { const n = queue.shift(); if (n) letters.push({ art: envelope(n.name), name: n.name, t: 0, demo: n.demo, done: false }); }
      let pushing = hold ? 0.98 + Math.sin(clock * 31) * 0.025 : peek ? 0.34 : 0;
      for (const l of letters) { l.t += dt; const p = pushed(l.t); if (l.t > ARRIVE - 0.16 && p < 1) pushing = Math.max(pushing, 1.02 - p * 0.1); if (p >= 1 && !l.done) deliver(l); }
      letters = letters.filter((l) => !l.done);
      if (pushing > 0) { flap.v += (170 * (pushing - flap.a) - 20 * flap.v) * dt; }
      else { flap.v += (-150 * flap.a - 26 - 2.6 * flap.v) * dt; } // let go: the spring throws it shut
      flap.a += flap.v * dt;
      if (flap.a < 0) { flap.a = 0; flap.v = Math.abs(flap.v) > 0.5 ? -flap.v * 0.46 : 0; } // it clacks against the frame and bounces
      if (now - touched > 4000) lightTo = Math.sin(clock * 0.7);
      light += (lightTo - light) * Math.min(1, dt * 4);
      draw();
      const busy = demo || letters.length || queue.length || flap.a > 0.001 || Math.abs(flap.v) > 0.01 || Math.abs(light - lightTo) > 0.01 || hold || peek;
      if (busy && seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const still = () => { flap.a = hold ? 0.98 : peek ? 0.34 : demo ? 0.98 : 0; letters = demo ? [{ art: envelope(samples[0].name), name: samples[0].name, t: ARRIVE + TRAVEL * 0.4, demo: true, done: false }] : []; kinds = demo ? 0 : kinds; draw(); };

    api.current = {
      post: (name) => { if (demo) { demo = false; letters = letters.filter((l) => !l.demo); queue = []; } if (reduce) { window.dispatchEvent(new CustomEvent("brass-letterbox-file-upload-delivered", { detail: { name, demo: false, canvas: cv } })); still(); } else { queue.push({ name, demo: false }); wake(); } },
      hold: (on) => { hold = on; if (reduce) still(); else wake(); },
      peek: (on) => { peek = on; if (reduce) still(); else wake(); },
    };

    layout();
    if (reduce) still(); else wake();
    const onMove = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); touched = performance.now(); lightTo = Math.max(-1.4, Math.min(1.4, ((e.clientX - b.left) / b.width - 0.5) * 2.4)); if (reduce) { light = lightTo; draw(); } else wake(); };
    window.addEventListener("pointermove", onMove);
    let width = cv.getBoundingClientRect().width;
    const ro = new ResizeObserver(() => { const w = cv.getBoundingClientRect().width; const flip = (w >= 560) !== (width >= 560); width = w; if (!flip) return; layout(); if (reduce) still(); else wake(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; window.removeEventListener("pointermove", onMove); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  // The canvas says when an envelope has gone all the way through; only then does the file join the list.
  useEffect(() => {
    const onDelivered = (e: Event) => {
      const d = (e as CustomEvent<{ name: string; demo: boolean; canvas: HTMLCanvasElement }>).detail;
      if (d.canvas !== canvas.current) return;
      const sample = samples.find((s) => s.name === d.name);
      const next = d.demo ? { key: ++serial.current, name: d.name, size: sample ? sample.size : "" } : waiting.current.shift();
      if (!next) return;
      setPosted((old) => [next, ...old].slice(0, MAX_SHOWN));
      if (!d.demo) setNote(`${next.name} delivered`);
    };
    window.addEventListener("brass-letterbox-file-upload-delivered", onDelivered);
    return () => window.removeEventListener("brass-letterbox-file-upload-delivered", onDelivered);
  }, []);

  const take = (files: FileList | null) => {
    if (!files || !files.length) return;
    if (!mine) { setMine(true); setPosted([]); }
    for (const file of Array.from(files)) { waiting.current.push({ key: ++serial.current, name: file.name, size: sizeOf(file.size) }); api.current?.post(file.name); }
  };
  const onPick = (e: ChangeEvent<HTMLInputElement>) => { take(e.target.files); e.target.value = ""; };
  const onEnter = (e: DragEvent) => { e.preventDefault(); depth.current++; api.current?.hold(true); };
  const onLeave = () => { depth.current = Math.max(0, depth.current - 1); if (!depth.current) api.current?.hold(false); };
  const onDrop = (e: DragEvent) => { e.preventDefault(); depth.current = 0; api.current?.hold(false); take(e.dataTransfer.files); };

  return (
    <div onDragEnter={onEnter} onDragOver={(e) => e.preventDefault()} onDragLeave={onLeave} onDrop={onDrop} className="relative flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[#12382c] px-4 py-10 sm:min-h-[740px]">
      <style>{`@keyframes brass-letterbox-file-upload-with-a-sprung-flap-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
        .brass-letterbox-file-upload-with-a-sprung-flap-row { animation: brass-letterbox-file-upload-with-a-sprung-flap-in 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.2) both; }
        @media (prefers-reduced-motion: reduce) { .brass-letterbox-file-upload-with-a-sprung-flap-row { animation: none; } }`}</style>
      {/* The door: gloss paint with brush marks, a window reflected in it and the edges of two sunk panels. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_34%,#1d4f3e_0%,#12382c_55%,#0b271e_100%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(102deg,transparent_18%,rgba(255,255,255,0.05)_26%,rgba(255,255,255,0.015)_34%,transparent_40%,transparent_62%,rgba(255,255,255,0.03)_68%,transparent_76%)]" />
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.13] mix-blend-overlay">
        <filter id="brass-letterbox-file-upload-paint"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.012" numOctaves="2" seed="4" /><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.4 -0.2" /></filter>
        <rect width="100%" height="100%" filter="url(#brass-letterbox-file-upload-paint)" />
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-[7%] -top-10 h-[120px] rounded-md shadow-[inset_0_-1px_0_rgba(255,255,255,0.16),inset_0_-12px_16px_-8px_rgba(255,255,255,0.08),inset_0_14px_22px_rgba(0,0,0,0.4),0_2px_3px_rgba(0,0,0,0.45)] sm:h-[150px]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-[7%] -bottom-16 h-[96px] rounded-md shadow-[inset_0_1px_0_rgba(0,0,0,0.5),inset_0_14px_20px_-6px_rgba(0,0,0,0.45),0_-1px_0_rgba(255,255,255,0.12)] sm:h-[120px]" />

      <div className="relative w-full max-w-[720px]">
        <input id="brass-letterbox-file-upload-input" type="file" multiple onChange={onPick} onFocus={() => api.current?.peek(true)} onBlur={() => api.current?.peek(false)} className="peer sr-only" />
        <label htmlFor="brass-letterbox-file-upload-input" onPointerEnter={() => api.current?.peek(true)} onPointerLeave={() => api.current?.peek(false)} className="block w-full cursor-pointer">
          <canvas ref={canvas} aria-hidden="true" className="block w-full" />
          <span className="sr-only">{plate.hint}. {plate.rule}.</span>
        </label>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[1.5%] top-[7%] hidden h-[44%] rounded-2xl ring-2 ring-[#f6e3a4] peer-focus-visible:block sm:inset-x-[10.5%] sm:top-[6.5%] sm:h-[46%]" />
      </div>

      <div className="relative -mt-2 mb-[120px] flex w-full max-w-[420px] flex-col items-center sm:-mt-10 sm:mb-[130px]">
        <p className="rounded-full px-3 py-1 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f1e6c4]">{plate.hint}</p>
        <p className="mt-1 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9cdbd]">{plate.rule}</p>
        <ul aria-label={mine ? "Files delivered" : "Example files delivered"} className="absolute left-0 top-full mt-5 flex w-full flex-col gap-2">
          {posted.map((f) => (
            <li key={f.key} className="brass-letterbox-file-upload-with-a-sprung-flap-row flex h-10 items-center gap-3 rounded-md bg-black/25 px-3 text-[13px] text-[#f4efe2] ring-1 ring-white/10">
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 flex-none text-[#f3d684]"><path d="M3 5.5h14v9H3z M3 5.5l7 5.2 7-5.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
              <span className="min-w-0 flex-1 truncate font-medium">{f.name}</span>
              <span className="flex-none font-mono text-[11px] text-[#b9cdbd]">{f.size}</span>
              <span className="flex-none font-mono text-[10px] uppercase tracking-[0.14em] text-[#f3d684]">Delivered</span>
            </li>
          ))}
        </ul>
      </div>
      <p aria-live="polite" className="sr-only">{note}</p>
    </div>
  );
}

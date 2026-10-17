import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// Stations on the dial. Frequencies are in megahertz, between LOW and HIGH.
const stations = [
  { at: 89.3, name: "Harbour Jazz", tempo: 84 },
  { at: 93.7, name: "The Night Desk", tempo: 112 },
  { at: 98.1, name: "Cedar Street Soul", tempo: 96 },
  { at: 102.6, name: "Radio Lantern", tempo: 126 },
  { at: 106.2, name: "Open Water", tempo: 72 },
];
const LOW = 87.5, HIGH = 108.5;
const SHELL = ["#ee5f41", "#d9462b", "#b93521"]; // the moulded case, light to dark
const NEEDLE = "#d92b1c";

// Design pixels. The case is 360 by 560 inside a 480 by 740 drawing, which leaves room for the aerial and the shadow.
const W = 480, H = 740, BX = 50, BY = 124, BW = 360, BH = 560, BR = 36;
const FX = 84, FY = 160, FW = 292, FH = 92; // the dial card behind the glass
const X0 = FX + 46, X1 = FX + FW - 46; // where 88 and 108 sit
const GX = 230, GY = 474, GR = 148; // speaker grille
const xOf = (f: number) => X0 + ((f - 88) / 20) * (X1 - X0);
const nearest = (f: number) => stations.reduce((a, b) => (Math.abs(b.at - f) < Math.abs(a.at - f) ? b : a));
const lock = (f: number) => Math.exp(-Math.pow((nearest(f).at - f) / 0.26, 2)); // 1 on a station, 0 between

export default function PocketRadio() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const dialHit = useRef<HTMLDivElement>(null);
  const wheelHit = useRef<HTMLDivElement>(null);
  const [freq, setFreq] = useState(98.1);
  const [on, setOn] = useState(true);
  const live = useRef({ freq: 98.1, on: true });
  const api = useRef<{ tune: (f: number) => void; step: (by: number) => void; poke: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, pad = dialHit.current, wheel = wheelHit.current;
    if (!cv || !pad || !wheel) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let k = 1;

    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };
    const disc = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); };
    const chrome = (c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) => {
      const g = c.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, "#fdfdfd"); g.addColorStop(0.22, "#b3b6bb"); g.addColorStop(0.42, "#f4f5f6"); g.addColorStop(0.6, "#7d8086"); g.addColorStop(0.8, "#d4d6da"); g.addColorStop(1, "#8f9298");
      return g;
    };

    const body = document.createElement("canvas"); // the case, with the grille holes punched right through
    const dial = document.createElement("canvas"); // the print on the dial card

    const build = () => {
      const b = body.getContext("2d");
      if (!b) return;
      body.width = cv.width; body.height = cv.height;
      b.setTransform(k, 0, 0, k, 0, 0);
      let seed = 3;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

      // Telescopic aerial lying up and to the right of the case, with the shadow it throws on the table.
      const aerial = (shadow: boolean) => {
        b.save(); b.translate(322, BY + 9); b.rotate(-1.19);
        if (shadow) { b.shadowColor = "rgba(40,48,38,0.38)"; b.shadowBlur = 7 * k; b.shadowOffsetX = 7 * k; b.shadowOffsetY = 12 * k; }
        let x = 0;
        for (const [len, half] of [[44, 3.6], [38, 2.7], [36, 1.9]] as const) {
          b.fillStyle = chrome(b, 0, -half, 0, half); b.fillRect(x, -half, len + 1, half * 2);
          if (!shadow) { b.fillStyle = "rgba(0,0,0,0.35)"; b.fillRect(x + len - 0.6, -half, 0.9, half * 2); }
          x += len;
        }
        disc(b, x + 2.5, 0, 4.2);
        const tip = b.createRadialGradient(x + 1.2, -1.6, 0.4, x + 2.5, 0, 4.2); tip.addColorStop(0, "#fff"); tip.addColorStop(0.5, "#b5b8bd"); tip.addColorStop(1, "#5e6166");
        b.fillStyle = tip; b.fill();
        b.restore();
      };
      aerial(true); aerial(false);

      // Case shadow, then the case.
      b.save(); b.shadowColor = "rgba(40,48,38,0.42)"; b.shadowBlur = 34 * k; b.shadowOffsetX = 10 * k; b.shadowOffsetY = 22 * k; rr(b, BX, BY, BW, BH, BR); b.fillStyle = SHELL[2]; b.fill(); b.restore();
      b.save(); b.shadowColor = "rgba(30,20,14,0.6)"; b.shadowBlur = 6 * k; b.shadowOffsetX = 1.5 * k; b.shadowOffsetY = 3 * k; rr(b, BX, BY, BW, BH, BR); b.fillStyle = SHELL[2]; b.fill(); b.restore();
      const shell = b.createLinearGradient(BX, BY, BX + BW * 0.5, BY + BH);
      shell.addColorStop(0, SHELL[0]); shell.addColorStop(0.5, SHELL[1]); shell.addColorStop(1, SHELL[2]);
      rr(b, BX, BY, BW, BH, BR); b.fillStyle = shell; b.fill();
      b.save(); rr(b, BX, BY, BW, BH, BR); b.clip();
      // Rounded-over edges: light catches the top and left, the bottom and right fall away.
      for (let i = 0; i < 16; i++) {
        const t = i / 16;
        rr(b, BX + i * 0.8, BY + i * 0.8, BW - i * 1.6, BH - i * 1.6, BR - i * 0.8); b.lineWidth = 1.4;
        const g = b.createLinearGradient(BX, BY, BX + BW, BY + BH);
        g.addColorStop(0, `rgba(255,236,224,${0.42 * (1 - t) * (1 - t)})`); g.addColorStop(0.5, "rgba(255,255,255,0)"); g.addColorStop(1, `rgba(60,8,0,${0.5 * (1 - t) * (1 - t)})`);
        b.strokeStyle = g; b.stroke();
      }
      // A long soft reflection of the window in the gloss.
      const gloss = b.createLinearGradient(BX, BY, BX + BW, BY + BH * 0.7);
      gloss.addColorStop(0, "rgba(255,255,255,0.2)"); gloss.addColorStop(0.3, "rgba(255,255,255,0.03)"); gloss.addColorStop(0.5, "rgba(255,255,255,0)"); gloss.addColorStop(0.72, "rgba(255,255,255,0.05)"); gloss.addColorStop(1, "rgba(0,0,0,0.08)");
      b.fillStyle = gloss; b.fillRect(BX, BY, BW, BH);
      for (let i = 0; i < 5200; i++) { b.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.045)" : "rgba(60,10,0,0.05)"; b.fillRect(BX + rand() * BW, BY + rand() * BH, 0.9, 0.9); }
      b.restore();
      // The seam where the two halves of the case meet.
      rr(b, BX + 9, BY + 9, BW - 18, BH - 18, BR - 8); b.lineWidth = 1; b.strokeStyle = "rgba(70,12,2,0.55)"; b.stroke();
      rr(b, BX + 10, BY + 10, BW - 20, BH - 20, BR - 9); b.lineWidth = 0.8; b.strokeStyle = "rgba(255,214,196,0.35)"; b.stroke();

      // Chrome trim round the dial and the dark well behind it.
      b.save(); b.shadowColor = "rgba(60,8,0,0.6)"; b.shadowBlur = 5 * k; b.shadowOffsetY = 2 * k; rr(b, FX - 9, FY - 9, FW + 18, FH + 18, 13); b.fillStyle = "#999"; b.fill(); b.restore();
      rr(b, FX - 9, FY - 9, FW + 18, FH + 18, 13); b.fillStyle = chrome(b, FX, FY - 9, FX + FW * 0.4, FY + FH + 9); b.fill();
      rr(b, FX - 8.4, FY - 8.4, FW + 16.8, FH + 16.8, 12.4); b.lineWidth = 0.8; b.strokeStyle = "rgba(255,255,255,0.9)"; b.stroke();
      rr(b, FX - 3, FY - 3, FW + 6, FH + 6, 8); b.fillStyle = "#0c0a08"; b.fill();

      // Slot for the tuning wheel and a ring of groove round the speaker.
      rr(b, BX + BW - 17, FY - 4, 20, FH + 8, 5); b.fillStyle = "#1a0705"; b.fill();
      rr(b, BX + BW - 17, FY - 4, 20, FH + 8, 5); b.lineWidth = 1; b.strokeStyle = "rgba(255,214,196,0.3)"; b.stroke();
      disc(b, GX, GY, GR + 9); b.lineWidth = 1.6; b.strokeStyle = "rgba(70,12,2,0.5)"; b.stroke();
      disc(b, GX, GY, GR + 10.2); b.lineWidth = 0.9; b.strokeStyle = "rgba(255,214,196,0.32)"; b.stroke();

      // Legends moulded into the case and filled with cream paint.
      const paint = (text: string, x: number, y: number, size: number, align: CanvasTextAlign = "center") => {
        b.font = `700 ${size}px ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif`; b.textAlign = align; b.textBaseline = "middle";
        b.fillStyle = "rgba(70,12,2,0.5)"; b.fillText(text, x, y + 0.8); b.fillStyle = "#fbeede"; b.fillText(text, x, y);
      };
      paint("T U N E D", FX + 16, FY + FH + 30, 6.5, "left");
      paint("P O W E R", FX + FW - 62, FY + FH + 30, 6.5, "right");
      paint("TWO BAND  ·  SOLID STATE", GX, BY + BH - 30, 7);
      // Wells for the tuned lamp and the power key.
      disc(b, FX + 4, FY + FH + 30, 5.4); b.fillStyle = "#3a0d06"; b.fill(); disc(b, FX + 4, FY + FH + 30.6, 5.6); b.lineWidth = 0.8; b.strokeStyle = "rgba(255,214,196,0.35)"; b.stroke();
      rr(b, FX + FW - 54, FY + FH + 17, 58, 26, 13); b.fillStyle = "#3a0d06"; b.fill(); rr(b, FX + FW - 54, FY + FH + 17.6, 58, 26, 13); b.lineWidth = 0.8; b.strokeStyle = "rgba(255,214,196,0.35)"; b.stroke();

      // The grille: every hole has a shadowed upper wall and a lit lower lip, then goes right through the layer.
      const step = 11.2, rows = Math.ceil(GR / (step * 0.866)), holes: [number, number][] = [];
      for (let j = -rows; j <= rows; j++) for (let i = -14; i <= 14; i++) {
        const x = GX + (i + (j & 1 ? 0.5 : 0)) * step, y = GY + j * step * 0.866;
        if (Math.hypot(x - GX, y - GY) < GR - 3) holes.push([x, y]);
      }
      for (const [x, y] of holes) { disc(b, x + 0.5, y + 0.7, 4.1); b.fillStyle = "rgba(255,206,186,0.42)"; b.fill(); }
      for (const [x, y] of holes) { disc(b, x - 0.3, y - 0.45, 4); b.fillStyle = "rgba(84,16,4,0.9)"; b.fill(); }
      b.globalCompositeOperation = "destination-out";
      for (const [x, y] of holes) { disc(b, x + 0.25, y + 0.35, 3.25); b.fill(); }
      b.globalCompositeOperation = "source-over";

      // Print on the dial card.
      const d = dial.getContext("2d");
      if (!d) return;
      dial.width = Math.ceil(FW * k); dial.height = Math.ceil(FH * k);
      d.setTransform(k, 0, 0, k, -FX * k, -FY * k);
      const INK = "#231a10";
      d.textBaseline = "middle"; d.textAlign = "center"; d.fillStyle = INK; d.strokeStyle = INK;
      d.font = `800 10px ui-sans-serif, system-ui, sans-serif`; d.fillText("FM", FX + 18, FY + 24); d.fillText("AM", FX + 18, FY + 70);
      d.font = `600 6px ui-sans-serif, system-ui, sans-serif`; d.fillText("MHz", FX + FW - 18, FY + 24); d.fillText("kHz", FX + FW - 18, FY + 70);
      d.beginPath(); d.moveTo(X0 - 8, FY + 36); d.lineTo(X1 + 8, FY + 36); d.lineWidth = 1; d.stroke();
      d.beginPath(); d.moveTo(X0 - 8, FY + 58); d.lineTo(X1 + 8, FY + 58); d.stroke();
      for (let f = 88; f <= 108; f++) {
        const x = xOf(f), long = f % 4 === 0;
        d.beginPath(); d.moveTo(x, FY + 36); d.lineTo(x, FY + 36 - (long ? 7 : 4)); d.lineWidth = long ? 1.2 : 0.8; d.stroke();
        if (long) { d.font = `700 9.5px ui-sans-serif, system-ui, sans-serif`; d.fillText(String(f), x, FY + 20); }
      }
      // Medium wave is printed the way it really falls on a tuning capacitor: wide at the bottom, cramped at the top.
      const am = (kHz: number) => X0 + (Math.log(kHz / 530) / Math.log(1600 / 530)) * (X1 - X0);
      for (let f = 550; f <= 1600; f += 50) { const x = am(f); d.beginPath(); d.moveTo(x, FY + 58); d.lineTo(x, FY + 58 + (f % 100 === 0 ? 5.5 : 3.5)); d.lineWidth = 0.8; d.stroke(); }
      d.font = `700 8.5px ui-sans-serif, system-ui, sans-serif`;
      for (const f of [530, 600, 700, 800, 1000, 1200, 1400, 1600]) d.fillText(String(f / 10), am(f), FY + 74);
      // A coloured wedge marks each station.
      for (const st of stations) { const x = xOf(st.at); d.beginPath(); d.moveTo(x - 3.2, FY + 41); d.lineTo(x + 3.2, FY + 41); d.lineTo(x, FY + 46.5); d.closePath(); d.fillStyle = NEEDLE; d.fill(); }
    };

    const fit = () => {
      const w = cv.clientWidth || W;
      k = (w / W) * Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * k); cv.height = Math.round(H * k);
      build();
    };

    const s = { f: 98.1, v: 0, auto: 98.1 as number | null, drag: false, lamp: 1, cone: 0, coneV: 0, light: 0, lightTo: 0, roll: 0, key: 1, hiss: 0, hissTo: 0, hissAt: 0, tuned: 1, hold: false };

    const draw = () => {
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // The loudspeaker seen through the holes: paper cone, roll surround, dust cap. It pumps with the programme.
      const push = s.cone;
      ctx.save(); disc(ctx, GX, GY, GR); ctx.clip();
      ctx.fillStyle = "#0d0907"; ctx.fillRect(GX - GR, GY - GR, GR * 2, GR * 2);
      const cone = ctx.createRadialGradient(GX - 26, GY - 34, 10, GX, GY, 124 + push * 3);
      cone.addColorStop(0, "#5a4a40"); cone.addColorStop(0.5, "#33281f"); cone.addColorStop(1, "#16100c");
      disc(ctx, GX, GY, 122 + push * 2.5); ctx.fillStyle = cone; ctx.fill();
      disc(ctx, GX, GY, 128 + push * 1.5); ctx.lineWidth = 9; ctx.strokeStyle = "#241b15"; ctx.stroke();
      disc(ctx, GX - 1.5, GY - 2, 126 + push * 1.5); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(190,160,140,0.3)"; ctx.stroke();
      const cap = ctx.createRadialGradient(GX - 12 - push * 2, GY - 16 - push * 2, 2, GX, GY, 46 + push * 7);
      cap.addColorStop(0, "#b39a88"); cap.addColorStop(0.45, "#6b5749"); cap.addColorStop(1, "#2a2019");
      disc(ctx, GX, GY, 44 + push * 7); ctx.fillStyle = cap; ctx.fill();
      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(body, 0, 0); ctx.setTransform(k, 0, 0, k, 0, 0);

      // Dial card, lit from behind by two small lamps at the ends.
      ctx.save(); rr(ctx, FX, FY, FW, FH, 5); ctx.clip();
      ctx.fillStyle = "#93886a"; ctx.fillRect(FX, FY, FW, FH);
      ctx.globalAlpha = s.lamp;
      const card = ctx.createLinearGradient(FX, 0, FX + FW, 0);
      card.addColorStop(0, "#fff7d6"); card.addColorStop(0.2, "#fbe3a6"); card.addColorStop(0.5, "#f2cd85"); card.addColorStop(0.8, "#fbe3a6"); card.addColorStop(1, "#fff7d6");
      ctx.fillStyle = card; ctx.fillRect(FX, FY, FW, FH);
      ctx.globalAlpha = 1;
      ctx.drawImage(dial, FX, FY, FW, FH);
      // Needle on its carriage, and its shadow on the card.
      const nx = xOf(s.f);
      ctx.fillStyle = `rgba(70,36,4,${0.22 + 0.16 * s.lamp})`; ctx.fillRect(nx + 3 + s.light * 2.4, FY, 2.6, FH);
      const ng = ctx.createLinearGradient(nx - 1.3, 0, nx + 1.3, 0); ng.addColorStop(0, "#ff6a55"); ng.addColorStop(0.5, NEEDLE); ng.addColorStop(1, "#8e1409");
      ctx.fillStyle = ng; ctx.fillRect(nx - 1.3, FY, 2.6, FH);
      ctx.fillStyle = "#1a1512"; ctx.fillRect(nx - 5, FY + FH - 7, 10, 7); ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.fillRect(nx - 5, FY + FH - 7, 10, 0.8);
      // Glass.
      const top = ctx.createLinearGradient(0, FY, 0, FY + 22); top.addColorStop(0, "rgba(20,10,0,0.55)"); top.addColorStop(1, "rgba(20,10,0,0)");
      ctx.fillStyle = top; ctx.fillRect(FX, FY, FW, 22);
      const side = ctx.createLinearGradient(FX, 0, FX + FW, 0); side.addColorStop(0, "rgba(20,10,0,0.3)"); side.addColorStop(0.06, "rgba(20,10,0,0)"); side.addColorStop(0.94, "rgba(20,10,0,0)"); side.addColorStop(1, "rgba(20,10,0,0.3)");
      ctx.fillStyle = side; ctx.fillRect(FX, FY, FW, FH);
      const sx = FX + FW * (0.3 + 0.22 * s.light), sh = ctx.createLinearGradient(0, FY, 0, FY + FH);
      sh.addColorStop(0, "rgba(255,255,255,0.3)"); sh.addColorStop(0.7, "rgba(255,255,255,0.06)"); sh.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sh;
      ctx.beginPath(); ctx.moveTo(sx, FY); ctx.lineTo(sx + 54, FY); ctx.lineTo(sx + 8, FY + FH); ctx.lineTo(sx - 46, FY + FH); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sx + 66, FY); ctx.lineTo(sx + 78, FY); ctx.lineTo(sx + 32, FY + FH); ctx.lineTo(sx + 20, FY + FH); ctx.closePath(); ctx.fill();
      ctx.restore();

      // Tuning wheel: ridges roll past, the top and bottom curve away into shade.
      const wx = BX + BW - 14, wy = FY, ww = 24, wh = FH;
      ctx.save(); ctx.shadowColor = "rgba(40,48,38,0.45)"; ctx.shadowBlur = 6 * k; ctx.shadowOffsetX = 4 * k; ctx.shadowOffsetY = 6 * k; rr(ctx, wx, wy, ww, wh, 4); ctx.fillStyle = "#141414"; ctx.fill(); ctx.restore();
      ctx.save(); rr(ctx, wx, wy, ww, wh, 4); ctx.clip();
      for (let i = -1; i < 26; i++) {
        const u = ((i * 0.13 + s.roll) % 3.2 + 3.2) % 3.2 - 1.6; // angle of this ridge on the visible half of the wheel
        if (Math.abs(u) > 1.5) continue;
        const y = wy + wh / 2 + Math.sin(u) * (wh / 2), thick = Math.max(0.6, 3.2 * Math.cos(u)), lit = Math.max(0, Math.cos(u + 0.5));
        ctx.fillStyle = `rgb(${(26 + lit * 70) | 0},${(26 + lit * 70) | 0},${(28 + lit * 72) | 0})`; ctx.fillRect(wx, y - thick / 2, ww, thick);
        ctx.fillStyle = `rgba(255,255,255,${0.32 * lit})`; ctx.fillRect(wx, y - thick / 2, ww, 0.7);
      }
      const round = ctx.createLinearGradient(0, wy, 0, wy + wh); round.addColorStop(0, "rgba(0,0,0,0.85)"); round.addColorStop(0.3, "rgba(0,0,0,0)"); round.addColorStop(0.7, "rgba(0,0,0,0.1)"); round.addColorStop(1, "rgba(0,0,0,0.9)");
      ctx.fillStyle = round; ctx.fillRect(wx, wy, ww, wh);
      const across = ctx.createLinearGradient(wx, 0, wx + ww, 0); across.addColorStop(0, "rgba(0,0,0,0.7)"); across.addColorStop(0.3, "rgba(0,0,0,0)"); across.addColorStop(1, "rgba(0,0,0,0.25)");
      ctx.fillStyle = across; ctx.fillRect(wx, wy, ww, wh);
      ctx.restore();

      // Tuned lamp and power key.
      const lx = FX + 4, ly = FY + FH + 30, lit = s.tuned * s.lamp;
      ctx.save(); ctx.shadowColor = "#ffd27a"; ctx.shadowBlur = 14 * k * lit;
      const jewel = ctx.createRadialGradient(lx - 1.2, ly - 1.4, 0.3, lx, ly, 4.2);
      jewel.addColorStop(0, `rgb(255,${(170 + 80 * lit) | 0},${(120 + 110 * lit) | 0})`); jewel.addColorStop(0.6, `rgb(${(120 + 135 * lit) | 0},${(60 + 130 * lit) | 0},${(20 + 60 * lit) | 0})`); jewel.addColorStop(1, `rgb(${(70 + 120 * lit) | 0},${(28 + 70 * lit) | 0},10)`);
      disc(ctx, lx, ly, 4.2); ctx.fillStyle = jewel; ctx.fill(); ctx.restore();
      const kx = FX + FW - 51 + 26 * s.key, ky = FY + FH + 20;
      ctx.save(); ctx.shadowColor = "rgba(40,6,0,0.7)"; ctx.shadowBlur = 4 * k; ctx.shadowOffsetX = 1.5 * k; ctx.shadowOffsetY = 2.5 * k; rr(ctx, kx, ky, 26, 20, 10); ctx.fillStyle = chrome(ctx, kx, ky, kx + 12, ky + 22); ctx.fill(); ctx.restore();
      rr(ctx, kx + 0.5, ky + 0.5, 25, 19, 9.5); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.stroke();
      for (const o of [-3, 0, 3]) { ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(kx + 12.6 + o, ky + 5, 0.9, 10); }
    };

    const say = () => { const r = Math.round(s.f * 10) / 10; if (r !== live.current.freq) { live.current.freq = r; setFreq(r); } };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, nextDemo = 2250;
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000, pw = live.current.on, before = s.f;
      if (!s.drag) {
        if (s.auto !== null) {
          // Tuning by key or by the demo: a firm spring with a touch of overshoot.
          s.v += (34 * (s.auto - s.f) - 8.4 * s.v) * dt; s.f += s.v * dt;
          if (Math.abs(s.auto - s.f) < 0.004 && Math.abs(s.v) < 0.02) { s.f = s.auto; s.v = 0; s.auto = null; }
        } else {
          // After a flick the wheel coasts, then a station pulls the needle in when it passes close and slowly.
          const st = nearest(s.f), off = st.at - s.f;
          if (!s.hold && Math.abs(off) < 0.42 && Math.abs(s.v) < 2.4) s.v += (40 * off - 7 * s.v) * dt;
          s.v *= Math.exp(-2.6 * dt); s.f += s.v * dt;
        }
        if (s.f < LOW) { s.f = LOW; s.v = Math.abs(s.v) * 0.3; } else if (s.f > HIGH) { s.f = HIGH; s.v = -Math.abs(s.v) * 0.3; }
      }
      s.roll -= (s.f - before) * 0.42;
      if (now - touched > 5000) {
        s.lightTo = Math.sin(t * 0.55) * 0.8;
        if (now - t0 > nextDemo && !s.drag && s.auto === null) { const i = stations.indexOf(nearest(s.f)); s.auto = stations[(i + 1) % stations.length].at; nextDemo = now - t0 + 3400; }
      }
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 5);
      s.lamp += ((pw ? 1 : 0) - s.lamp) * Math.min(1, dt * (pw ? 6 : 10));
      s.key += ((pw ? 1 : 0) - s.key) * Math.min(1, dt * 16);
      // What would be coming out of the speaker: the station's rhythm when locked, hiss when not.
      const q = lock(s.f), st = nearest(s.f), beat = (t * st.tempo) / 60, ph = beat % 1;
      if (t > s.hissAt) { s.hissAt = t + 0.03; s.hissTo = Math.random() * 2 - 1; }
      s.hiss += (s.hissTo - s.hiss) * Math.min(1, dt * 40);
      const music = Math.exp(-ph * 6) * (Math.floor(beat) % 2 ? 0.6 : 1) + 0.25 * Math.sin(t * 9 + st.at);
      const drive = pw ? q * music + (1 - q) * s.hiss * 0.35 : 0;
      s.coneV += (700 * (drive - s.cone) - 30 * s.coneV) * dt; s.cone += s.coneV * dt;
      s.tuned += (q * (0.85 + 0.15 * Math.sin(t * 31) * (1 - q)) - s.tuned) * Math.min(1, dt * 14);
      draw(); say();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const still = () => { if (s.auto !== null) { s.f = s.auto; s.auto = null; } s.v = 0; s.lamp = live.current.on ? 1 : 0; s.key = s.lamp; s.cone = 0; s.tuned = lock(s.f); s.roll = -s.f * 0.42; draw(); say(); };
    const wake = () => { if (reduce) still(); else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    api.current = {
      tune: (f) => { touched = performance.now(); s.hold = true; s.auto = Math.max(LOW, Math.min(HIGH, f)); wake(); },
      // Key presses add up even while the needle is still on its way, and a station does not pull a keyed value back.
      step: (by) => { touched = performance.now(); s.hold = true; s.auto = Math.max(LOW, Math.min(HIGH, Math.round(((s.auto ?? s.f) + by) * 10) / 10)); wake(); },
      poke: () => { touched = performance.now(); wake(); },
    };
    fit(); wake();

    // Drag the needle along the dial, or roll the wheel on the edge of the case.
    let px = 0, py = 0, pt = 0, byWheel = false;
    const down = (wheelDrag: boolean) => (e: PointerEvent) => {
      touched = performance.now(); s.drag = true; s.hold = false; s.auto = null; s.v = 0; byWheel = wheelDrag; px = e.clientX; py = e.clientY; pt = performance.now();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); e.preventDefault(); wake();
    };
    const move = (e: PointerEvent) => {
      if (!s.drag) return;
      const b = cv.getBoundingClientRect(), now = performance.now(), unit = b.width / W;
      const d = byWheel ? -(e.clientY - py) / unit * 0.05 : ((e.clientX - px) / unit / (X1 - X0)) * 20;
      const dt = Math.max(0.008, (now - pt) / 1000); px = e.clientX; py = e.clientY; pt = now; touched = now;
      s.f = Math.max(LOW, Math.min(HIGH, s.f + d)); s.v = s.v * 0.6 + (d / dt) * 0.4;
      if (reduce) still();
    };
    const up = () => { if (!s.drag) return; s.drag = false; touched = performance.now(); if (performance.now() - pt > 90) s.v = 0; if (reduce) { s.auto = lock(s.f) > 0.1 ? nearest(s.f).at : null; still(); } };
    const onDial = down(false), onWheel = down(true);
    pad.addEventListener("pointerdown", onDial); wheel.addEventListener("pointerdown", onWheel);
    for (const el of [pad, wheel]) { el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up); }
    const onLight = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); if (!s.drag) touched = Math.max(touched, performance.now() - 3500); s.lightTo = Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1)); };
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
      pad.removeEventListener("pointerdown", onDial); wheel.removeEventListener("pointerdown", onWheel);
      for (const el of [pad, wheel]) { el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); }
      host?.removeEventListener("pointermove", onLight);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const here = Math.abs(nearest(freq).at - freq) < 0.16 ? nearest(freq) : null;
  const onKey = (e: ReactKeyboardEvent) => {
    const i = stations.indexOf(nearest(freq));
    const seek = (dir: number) => { const list = dir > 0 ? stations.filter((x) => x.at > freq + 0.05) : stations.filter((x) => x.at < freq - 0.05); return dir > 0 ? (list[0] ?? stations[i]).at : (list[list.length - 1] ?? stations[i]).at; };
    if (e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); api.current?.step(e.key === "ArrowRight" || e.key === "ArrowUp" ? 0.1 : -0.1); return; }
    const next = e.key === "PageUp" ? seek(1) : e.key === "PageDown" ? seek(-1) : e.key === "Home" ? LOW : e.key === "End" ? HIGH : null;
    if (next === null) return;
    e.preventDefault(); api.current?.tune(Math.round(next * 10) / 10);
  };
  const power = () => { live.current.on = !live.current.on; setOn(live.current.on); api.current?.poke(); };
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[#fff3d6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#d9462b]";

  return (
    <div className="flex min-h-[790px] w-full flex-col items-center justify-center bg-[#cdd6cb] bg-[radial-gradient(75%_65%_at_50%_42%,#dfe6dc_0%,#cdd6cb_58%,#bcc7ba_100%)] px-4 py-8">
      <div className="relative w-full max-w-[470px]" style={{ aspectRatio: `${W} / ${H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div
          ref={dialHit}
          role="slider"
          tabIndex={0}
          aria-label="Tuning"
          aria-valuemin={LOW}
          aria-valuemax={HIGH}
          aria-valuenow={freq}
          aria-valuetext={`${freq.toFixed(1)} megahertz, ${here ? here.name : "between stations"}`}
          onKeyDown={onKey}
          style={{ left: pct(FX - 6, W), top: pct(FY - 6, H), width: pct(FW + 12, W), height: pct(FH + 12, H) }}
          className={`absolute cursor-ew-resize touch-none rounded-lg ${ring}`}
        />
        <div
          ref={wheelHit}
          aria-hidden="true"
          style={{ left: pct(BX + BW - 26, W), top: pct(FY - 14, H), width: pct(60, W), height: pct(FH + 28, H) }}
          className="absolute cursor-ns-resize touch-none"
        />
        <button
          type="button"
          aria-label="Power"
          aria-pressed={on}
          onClick={power}
          style={{ left: pct(FX + FW - 64, W), top: pct(FY + FH + 4, H), width: pct(78, W), height: pct(54, H) }}
          className={`absolute cursor-pointer rounded-full ${ring}`}
        />
      </div>
      <p className="mt-1 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-emerald-950/70">
        <span className="tabular-nums text-emerald-950">{freq.toFixed(1)} FM</span>
        <span className="mx-2 text-emerald-950/40">/</span>
        <span aria-live="polite">{!on ? "Switched off" : here ? here.name : "Static"}</span>
      </p>
    </div>
  );
}

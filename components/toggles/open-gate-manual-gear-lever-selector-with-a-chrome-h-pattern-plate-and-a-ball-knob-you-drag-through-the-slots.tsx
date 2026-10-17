import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// The options. `col` is the slot (0 is the far left), `row` is -1 for the top of a slot, 1 for the bottom, 0 for the cross channel.
const gears = [
  { id: "R", name: "Reverse", note: "Backing out of the bay", col: 0, row: -1 },
  { id: "N", name: "Neutral", note: "Out of gear, lever centred", col: 2, row: 0 },
  { id: "1", name: "First", note: "Pulling away", col: 1, row: -1 },
  { id: "2", name: "Second", note: "Hairpins and car parks", col: 1, row: 1 },
  { id: "3", name: "Third", note: "Town traffic", col: 2, row: -1 },
  { id: "4", name: "Fourth", note: "Open country road", col: 2, row: 1 },
  { id: "5", name: "Fifth", note: "Dual carriageway", col: 3, row: -1 },
  { id: "6", name: "Sixth", note: "Motorway cruise", col: 3, row: 1 },
];
const START = 3; // index of the option selected on load
const LAMP = "#ff6a1a"; // light behind the numeral of the engaged gear, and the focus ring
const LEATHER = ["#a8643a", "#84492a", "#4a2614"]; // highlight, body and shade of the hide
const COLS = [-108, -36, 36, 108]; // slot centres, in design pixels from the middle of the plate
const THROW = 84; // how far a slot runs above and below the cross channel
const SLOT = 25; // slot width
const W = 400, H = 500, CX = 200, CY = 252;

const point = (i: number) => ({ x: COLS[gears[i].col], y: gears[i].row * THROW });
const NEUTRAL = gears.findIndex((g) => g.row === 0);

export default function OpenGateGearLever() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const [gear, setGear] = useState(START);
  const gearRef = useRef(START);
  const api = useRef<{ go: (i: number) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, pad = hit.current, box = wrap.current;
    if (!cv || !pad || !box) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let k = 1;
    const base = document.createElement("canvas");

    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };
    // The gate as one path: the cross channel and every slot that has a gear at its end.
    const gate = (c: CanvasRenderingContext2D, dx = 0, dy = 0) => {
      c.beginPath();
      c.moveTo(CX + COLS[0] + dx, CY + dy); c.lineTo(CX + COLS[COLS.length - 1] + dx, CY + dy);
      gears.forEach((g) => { if (g.row !== 0) { c.moveTo(CX + COLS[g.col] + dx, CY + dy); c.lineTo(CX + COLS[g.col] + dx, CY + g.row * THROW + dy); } });
    };
    const labelAt = (i: number) => ({ x: CX + COLS[gears[i].col], y: CY + gears[i].row * (THROW + SLOT / 2 + 21) });
    const WIN = { x: CX - 136, y: CY + 44, w: 56, h: 46 };
    const FONT = "700 19px ui-sans-serif, system-ui, 'Helvetica Neue', Arial, sans-serif";

    const build = () => {
      const b = base.getContext("2d");
      if (!b) return;
      base.width = cv.width; base.height = cv.height;
      b.setTransform(k, 0, 0, k, 0, 0);
      let seed = 23;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

      // The leather pad: body colour, pebbled grain, a padded roll at the edge.
      const PX = 10, PY = 10, PW = W - 20, PH = H - 20, PR = 40;
      b.save(); b.shadowColor = "rgba(0,0,0,0.75)"; b.shadowBlur = 26 * k; b.shadowOffsetY = 14 * k;
      rr(b, PX, PY, PW, PH, PR); b.fillStyle = LEATHER[2]; b.fill(); b.restore();
      const hide = b.createRadialGradient(CX - 60, 90, 20, CX, CY, 330);
      hide.addColorStop(0, LEATHER[0]); hide.addColorStop(0.45, LEATHER[1]); hide.addColorStop(1, LEATHER[2]);
      rr(b, PX, PY, PW, PH, PR); b.fillStyle = hide; b.fill();
      b.save(); rr(b, PX, PY, PW, PH, PR); b.clip();
      for (let i = 0; i < 26000; i++) {
        // Pores, the pale shoulder beside each one, and now and then a short crease.
        const x = rand() * W, y = rand() * H, r = 0.3 + rand() * 0.75;
        b.beginPath(); b.arc(x, y, r, 0, Math.PI * 2); b.fillStyle = `rgba(30,10,2,${0.1 + rand() * 0.22})`; b.fill();
        if (i % 2 === 0) { b.beginPath(); b.arc(x - 0.8, y - 0.9, r * 0.9, 0, Math.PI * 2); b.fillStyle = `rgba(255,214,170,${0.03 + rand() * 0.07})`; b.fill(); }
        if (i % 22 === 0) { const a = rand() * Math.PI, n = 3 + rand() * 7; b.beginPath(); b.moveTo(x, y); b.quadraticCurveTo(x + Math.cos(a) * n * 0.5 + rand() * 3 - 1.5, y + Math.sin(a) * n * 0.5 + rand() * 3 - 1.5, x + Math.cos(a) * n, y + Math.sin(a) * n); b.lineWidth = 0.5; b.strokeStyle = `rgba(30,10,2,${0.1 + rand() * 0.14})`; b.stroke(); }
      }
      for (const [wd, al] of [[58, 0.07], [40, 0.08], [24, 0.1], [10, 0.16]]) { rr(b, PX, PY, PW, PH, PR); b.lineWidth = wd; b.strokeStyle = `rgba(20,6,0,${al})`; b.stroke(); }
      const sheen = b.createLinearGradient(40, 20, 300, 330);
      sheen.addColorStop(0, "rgba(255,226,190,0.2)"); sheen.addColorStop(0.3, "rgba(255,226,190,0.04)"); sheen.addColorStop(0.6, "rgba(255,226,190,0)"); sheen.addColorStop(1, "rgba(0,0,0,0.16)");
      b.fillStyle = sheen; b.fillRect(0, 0, W, H);
      b.restore();
      const rim = b.createLinearGradient(0, PY, 0, PY + PH);
      rim.addColorStop(0, "rgba(255,220,180,0.5)"); rim.addColorStop(0.2, "rgba(255,220,180,0.06)"); rim.addColorStop(1, "rgba(0,0,0,0.5)");
      rr(b, PX + 0.7, PY + 0.7, PW - 1.4, PH - 1.4, PR - 0.7); b.lineWidth = 1.4; b.strokeStyle = rim; b.stroke();

      // The seam: a pressed groove, then one saddle stitch at a time, each with its own shadow.
      const SI = 19, sx = PX + SI, sy = PY + SI, sw = PW - SI * 2, sh = PH - SI * 2, sr = PR - SI + 4;
      rr(b, sx, sy + 1, sw, sh, sr); b.lineWidth = 4.5; b.strokeStyle = "rgba(255,214,170,0.12)"; b.stroke();
      rr(b, sx, sy, sw, sh, sr); b.lineWidth = 3.6; b.strokeStyle = "rgba(22,7,0,0.5)"; b.stroke();
      const pts: { x: number; y: number; a: number }[] = [];
      const edge = (x0: number, y0: number, x1: number, y1: number) => { const n = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0); for (let d = 0; d < n; d += 1) pts.push({ x: x0 + Math.cos(a) * d, y: y0 + Math.sin(a) * d, a }); };
      const bend = (cx: number, cy: number, a0: number) => { for (let d = 0; d < (Math.PI / 2) * sr; d += 1) { const a = a0 + d / sr; pts.push({ x: cx + Math.cos(a) * sr, y: cy + Math.sin(a) * sr, a: a + Math.PI / 2 }); } };
      edge(sx + sr, sy, sx + sw - sr, sy); bend(sx + sw - sr, sy + sr, -Math.PI / 2);
      edge(sx + sw, sy + sr, sx + sw, sy + sh - sr); bend(sx + sw - sr, sy + sh - sr, 0);
      edge(sx + sw - sr, sy + sh, sx + sr, sy + sh); bend(sx + sr, sy + sh - sr, Math.PI / 2);
      edge(sx, sy + sh - sr, sx, sy + sr); bend(sx + sr, sy + sr, Math.PI);
      b.lineCap = "round";
      for (let i = 4; i < pts.length - 4; i += 9) {
        const p = pts[i], ca = Math.cos(p.a + 0.2) * 3, sa = Math.sin(p.a + 0.2) * 3;
        b.beginPath(); b.moveTo(p.x - ca + 0.6, p.y - sa + 1.3); b.lineTo(p.x + ca + 0.6, p.y + sa + 1.3); b.lineWidth = 2.4; b.strokeStyle = "rgba(15,4,0,0.55)"; b.stroke();
        b.beginPath(); b.moveTo(p.x - ca, p.y - sa); b.lineTo(p.x + ca, p.y + sa); b.lineWidth = 2; b.strokeStyle = "#e7d4ae"; b.stroke();
        b.beginPath(); b.moveTo(p.x - ca * 0.7, p.y - sa * 0.7 - 0.5); b.lineTo(p.x + ca * 0.5, p.y + sa * 0.5 - 0.5); b.lineWidth = 0.7; b.strokeStyle = "rgba(255,255,255,0.6)"; b.stroke();
      }
      b.lineCap = "butt";

      // The plate: polished steel, sunk a little into the hide.
      const GX = CX - 158, GY = CY - 152, GW = 316, GH = 304, GR = 24;
      b.save(); b.shadowColor = "rgba(10,3,0,0.85)"; b.shadowBlur = 22 * k; b.shadowOffsetY = 10 * k;
      rr(b, GX, GY, GW, GH, GR); b.fillStyle = "#111"; b.fill(); b.restore();
      rr(b, GX - 1.5, GY - 1.5, GW + 3, GH + 3, GR + 1.5); b.fillStyle = "rgba(12,4,0,0.8)"; b.fill();
      const steel = b.createLinearGradient(GX, GY, GX + GW, GY + GH);
      for (const [p, c] of [[0, "#fbfcfd"], [0.12, "#d3d6da"], [0.27, "#8b8f95"], [0.4, "#c9ccd1"], [0.5, "#f5f6f7"], [0.6, "#b3b7bd"], [0.76, "#72767c"], [0.9, "#c5c8cd"], [1, "#9a9ea4"]] as [number, string][]) steel.addColorStop(p, c);
      rr(b, GX, GY, GW, GH, GR); b.fillStyle = steel; b.fill();
      b.save(); rr(b, GX, GY, GW, GH, GR); b.clip();
      for (let y = GY; y < GY + GH; y += 0.6) { const v = rand(); b.beginPath(); b.moveTo(GX + rand() * 90, y); b.lineTo(GX + GW - rand() * 90, y); b.lineWidth = 0.5; b.strokeStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.22})` : `rgba(0,0,0,${(0.5 - v) * 0.12})`; b.stroke(); }
      // The warm hide shows faintly in the lower edge of the plate.
      const warm = b.createLinearGradient(0, GY + GH - 70, 0, GY + GH);
      warm.addColorStop(0, "rgba(160,90,45,0)"); warm.addColorStop(1, "rgba(160,90,45,0.22)");
      b.fillStyle = warm; b.fillRect(GX, GY, GW, GH);
      b.restore();
      const bev = b.createLinearGradient(GX, GY, GX + GW * 0.4, GY + GH);
      bev.addColorStop(0, "#ffffff"); bev.addColorStop(0.5, "#a4a8ae"); bev.addColorStop(1, "#3c3f44");
      rr(b, GX + 1.5, GY + 1.5, GW - 3, GH - 3, GR - 1.5); b.lineWidth = 3; b.strokeStyle = bev; b.stroke();
      rr(b, GX + 4, GY + 4, GW - 8, GH - 8, GR - 4); b.lineWidth = 0.8; b.strokeStyle = "rgba(0,0,0,0.28)"; b.stroke();
      rr(b, GX + 4.9, GY + 4.9, GW - 9.8, GH - 9.8, GR - 4.9); b.lineWidth = 0.8; b.strokeStyle = "rgba(255,255,255,0.75)"; b.stroke();

      // Four countersunk slotted screws.
      [[GX + 21, GY + 21, 0.5], [GX + GW - 21, GY + 21, 2.1], [GX + 21, GY + GH - 21, 1.2], [GX + GW - 21, GY + GH - 21, 2.8]].forEach(([x, y, turn]) => {
        b.beginPath(); b.arc(x, y, 8.2, 0, Math.PI * 2); const sink = b.createLinearGradient(x, y - 8, x, y + 8); sink.addColorStop(0, "#2a2c30"); sink.addColorStop(1, "#f4f5f6"); b.fillStyle = sink; b.fill();
        const head = b.createLinearGradient(x - 6, y - 6, x + 6, y + 6); head.addColorStop(0, "#fdfdfd"); head.addColorStop(0.5, "#9da1a7"); head.addColorStop(1, "#5c5f65");
        b.beginPath(); b.arc(x, y, 6.6, 0, Math.PI * 2); b.fillStyle = head; b.fill();
        b.save(); b.translate(x, y); b.rotate(turn); b.fillStyle = "#16171a"; b.fillRect(-6.2, -1.1, 12.4, 2.2); b.fillStyle = "rgba(255,255,255,0.55)"; b.fillRect(-6.2, 1.1, 12.4, 0.6); b.restore();
      });

      // The gate itself: a chamfered lip, then the cut, darkest where the plate overhangs it.
      b.lineCap = "round"; b.lineJoin = "round";
      gate(b, 0, 1.8); b.lineWidth = SLOT + 7; b.strokeStyle = "#ffffff"; b.stroke();
      gate(b, 0, -1.8); b.lineWidth = SLOT + 7; b.strokeStyle = "#3a3d42"; b.stroke();
      gate(b); b.lineWidth = SLOT + 5.5; b.strokeStyle = "#a9adb3"; b.stroke();
      const cut = document.createElement("canvas"); cut.width = cv.width; cut.height = cv.height;
      const c2 = cut.getContext("2d");
      if (c2) {
        c2.setTransform(k, 0, 0, k, 0, 0); c2.lineCap = "round"; c2.lineJoin = "round";
        gate(c2); c2.lineWidth = SLOT; c2.strokeStyle = "#030303"; c2.stroke();
        c2.globalCompositeOperation = "source-atop";
        c2.shadowColor = "#2b2623"; c2.shadowBlur = 7 * k;
        gate(c2, 5, 9); c2.lineWidth = SLOT - 6; c2.strokeStyle = "#2b2623"; c2.stroke();
        b.save(); b.setTransform(1, 0, 0, 1, 0, 0); b.drawImage(cut, 0, 0); b.restore();
      }
      b.lineCap = "butt";

      // A small glass window in the empty corner of the plate that repeats the engaged gear.
      b.save(); b.shadowColor = "rgba(255,255,255,0.9)"; b.shadowBlur = 0; b.shadowOffsetY = 1.2 * k;
      rr(b, WIN.x - 3.5, WIN.y - 3.5, WIN.w + 7, WIN.h + 7, 10.5); b.fillStyle = "#2c2e32"; b.fill(); b.restore();
      const wb = b.createLinearGradient(WIN.x, WIN.y - 4, WIN.x + WIN.w, WIN.y + WIN.h + 4);
      wb.addColorStop(0, "#55585d"); wb.addColorStop(0.5, "#e9ebee"); wb.addColorStop(1, "#6c7076");
      rr(b, WIN.x - 2.2, WIN.y - 2.2, WIN.w + 4.4, WIN.h + 4.4, 9.2); b.lineWidth = 2.2; b.strokeStyle = wb; b.stroke();
      const glass = b.createLinearGradient(0, WIN.y, 0, WIN.y + WIN.h);
      glass.addColorStop(0, "#050506"); glass.addColorStop(1, "#17120f");
      rr(b, WIN.x, WIN.y, WIN.w, WIN.h, 7); b.fillStyle = glass; b.fill();
      b.font = "600 7px ui-monospace, SFMono-Regular, Menlo, monospace"; b.textAlign = "center"; b.textBaseline = "middle";
      b.fillStyle = "rgba(255,255,255,0.8)"; b.fillText("GEAR", WIN.x + WIN.w / 2, WIN.y + WIN.h + 13.9);
      b.fillStyle = "#1b1c1f"; b.fillText("GEAR", WIN.x + WIN.w / 2, WIN.y + WIN.h + 13);

      // Numerals, cut into the plate and filled with black enamel.
      b.font = FONT; b.textAlign = "center"; b.textBaseline = "middle";
      gears.forEach((g, i) => {
        if (g.row === 0) return;
        const l = labelAt(i);
        b.fillStyle = "rgba(255,255,255,0.85)"; b.fillText(g.id, l.x, l.y + 1.1);
        b.fillStyle = g.id === "R" ? "#a3201a" : "#15161a"; b.fillText(g.id, l.x, l.y);
      });
    };

    const p0 = point(START);
    const s = { x: p0.x, y: p0.y, gx: p0.x, gy: p0.y, kx: 0, ky: 0, kvx: 0, kvy: 0, drag: false, lamp: gears.map((_, i) => (i === START ? 1 : 0)) };
    const knobHome = () => ({ x: s.x * 1.2, y: s.y * 1.2 - 54 });
    { const h = knobHome(); s.kx = h.x; s.ky = h.y; }

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(k, 0, 0, k, 0, 0);

      // The engaged numeral lights from behind.
      ctx.font = FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      gears.forEach((g, i) => {
        const on = s.lamp[i];
        if (g.row === 0 || on < 0.02) return;
        const l = labelAt(i);
        ctx.save(); ctx.globalAlpha = on; ctx.shadowColor = LAMP; ctx.shadowBlur = 14 * k; ctx.fillStyle = LAMP; ctx.fillText(g.id, l.x, l.y);
        ctx.shadowBlur = 0; ctx.globalAlpha = on * 0.55; ctx.fillStyle = "#fff3d6"; ctx.fillText(g.id, l.x, l.y); ctx.restore();
      });

      // The window: the outgoing character fades as the new one warms up, under a streak of glass glare.
      ctx.save(); rr(ctx, WIN.x, WIN.y, WIN.w, WIN.h, 7); ctx.clip();
      ctx.font = "700 30px ui-monospace, SFMono-Regular, Menlo, monospace";
      gears.forEach((g, i) => {
        const on = s.lamp[i];
        if (on < 0.02) return;
        ctx.globalAlpha = on; ctx.shadowColor = LAMP; ctx.shadowBlur = 12 * k; ctx.fillStyle = LAMP; ctx.fillText(g.id, WIN.x + WIN.w / 2, WIN.y + WIN.h / 2 + 1.5);
        ctx.shadowBlur = 0; ctx.globalAlpha = on * 0.5; ctx.fillStyle = "#fff1d2"; ctx.fillText(g.id, WIN.x + WIN.w / 2, WIN.y + WIN.h / 2 + 1.5);
      });
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      const glare = ctx.createLinearGradient(WIN.x, WIN.y, WIN.x + WIN.w * 0.8, WIN.y + WIN.h);
      glare.addColorStop(0, "rgba(255,255,255,0.22)"); glare.addColorStop(0.38, "rgba(255,255,255,0.05)"); glare.addColorStop(0.4, "rgba(255,255,255,0)");
      ctx.fillStyle = glare; ctx.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
      ctx.restore();

      const bx = CX + s.x, by = CY + s.y, kx = CX + s.kx, ky = CY + s.ky, R = 40;
      // Ball joint down in the slot.
      const boot = ctx.createRadialGradient(bx - 2, by - 3, 1, bx, by, SLOT / 2);
      boot.addColorStop(0, "#5a5d62"); boot.addColorStop(0.6, "#1c1d20"); boot.addColorStop(1, "#000");
      ctx.beginPath(); ctx.arc(bx, by, SLOT / 2 - 1.5, 0, Math.PI * 2); ctx.fillStyle = boot; ctx.fill();

      // Shadows thrown on the plate by the shaft and the knob.
      const hx = kx + 20, hy = ky + 40;
      ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(bx + 2, by + 3); ctx.lineTo(hx, hy); ctx.lineWidth = 11; ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.stroke();
      const sh = ctx.createRadialGradient(hx, hy, R * 0.25, hx, hy, R * 1.55);
      sh.addColorStop(0, "rgba(0,0,0,0.55)"); sh.addColorStop(0.55, "rgba(0,0,0,0.3)"); sh.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(hx, hy, R * 1.55, 0, Math.PI * 2); ctx.fillStyle = sh; ctx.fill();

      // The shaft: a polished rod, lit along one side.
      const dx = kx - bx, dy = ky - by, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
      const rod = ctx.createLinearGradient(bx - nx * 7, by - ny * 7, bx + nx * 7, by + ny * 7);
      for (const [p, c] of [[0, "#4b4e53"], [0.22, "#d9dbdf"], [0.36, "#ffffff"], [0.55, "#9da1a7"], [0.8, "#33363a"], [1, "#85898f"]] as [number, string][]) rod.addColorStop(p, c);
      ctx.beginPath(); ctx.moveTo(bx - nx * 6.2, by - ny * 6.2); ctx.lineTo(kx - nx * 7.2, ky - ny * 7.2); ctx.lineTo(kx + nx * 7.2, ky + ny * 7.2); ctx.lineTo(bx + nx * 6.2, by + ny * 6.2); ctx.closePath();
      ctx.fillStyle = rod; ctx.fill();
      ctx.beginPath(); ctx.arc(bx, by, 5.6, 0, Math.PI * 2); ctx.fillStyle = "#2a2c30"; ctx.fill();
      ctx.lineCap = "butt";

      // The knob: a mirror-polished ball. Sky in the middle, the room squeezed into a ring near the edge.
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 8 * k; ctx.shadowOffsetY = 4 * k;
      ctx.beginPath(); ctx.arc(kx, ky, R, 0, Math.PI * 2); ctx.fillStyle = "#222"; ctx.fill(); ctx.restore();
      const ox = -s.x * 0.035, oy = -s.y * 0.035;
      const ball = ctx.createRadialGradient(kx - R * 0.16 + ox, ky - R * 0.22 + oy, R * 0.04, kx, ky, R);
      for (const [p, c] of [[0, "#ffffff"], [0.24, "#eef0f2"], [0.44, "#b9bcc2"], [0.58, "#63666c"], [0.67, "#1d1e21"], [0.75, "#3b281c"], [0.85, "#6b4732"], [0.93, "#2e1c13"], [1, "#0d0807"]] as [number, string][]) ball.addColorStop(p, c);
      ctx.beginPath(); ctx.arc(kx, ky, R, 0, Math.PI * 2); ctx.fillStyle = ball; ctx.fill();
      // The plate, mirrored as a pale crescent low on the ball.
      ctx.save(); ctx.beginPath(); ctx.arc(kx, ky, R, 0, Math.PI * 2); ctx.clip();
      const cres = ctx.createRadialGradient(kx, ky + R * 1.5, R * 0.9, kx, ky + R * 1.5, R * 1.5);
      cres.addColorStop(0, "rgba(235,238,242,0.75)"); cres.addColorStop(0.5, "rgba(200,204,210,0.28)"); cres.addColorStop(1, "rgba(200,204,210,0)");
      ctx.fillStyle = cres; ctx.fillRect(kx - R, ky, R * 2, R);
      // Soft window light, upper left, and its small echo opposite.
      ctx.translate(kx - R * 0.36 + ox * 2, ky - R * 0.44 + oy * 2); ctx.rotate(-0.72);
      const win = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.42);
      win.addColorStop(0, "rgba(255,255,255,1)"); win.addColorStop(0.5, "rgba(255,255,255,0.8)"); win.addColorStop(1, "rgba(255,255,255,0)");
      ctx.scale(1, 0.5); ctx.beginPath(); ctx.arc(0, 0, R * 0.42, 0, Math.PI * 2); ctx.fillStyle = win; ctx.fill();
      ctx.restore();
      ctx.beginPath(); ctx.arc(kx, ky, R - 0.6, Math.PI * 0.95, Math.PI * 1.7); ctx.lineWidth = 1.1; ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(kx, ky, R - 0.6, Math.PI * 0.05, Math.PI * 0.6); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,200,150,0.35)"; ctx.stroke();
    };

    const select = (i: number) => { if (gearRef.current !== i) { gearRef.current = i; setGear(i); } };
    const EPS = 0.01;
    const travel = (dist: number) => {
      let left = dist;
      for (let n = 0; n < 3 && left > 0; n++) {
        if (Math.abs(s.x - s.gx) > EPS) {
          if (Math.abs(s.y) > EPS) { const d = Math.min(left, Math.abs(s.y)); s.y -= Math.sign(s.y) * d; left -= d; }
          else { s.y = 0; const d = Math.min(left, Math.abs(s.gx - s.x)); s.x += Math.sign(s.gx - s.x) * d; left -= d; }
        } else { s.x = s.gx; const d = Math.min(left, Math.abs(s.gy - s.y)); s.y += Math.sign(s.gy - s.y) * d; left -= d; if (d === 0) break; }
      }
    };
    const pathLeft = () => (Math.abs(s.x - s.gx) > EPS ? Math.abs(s.y) + Math.abs(s.gx - s.x) + Math.abs(s.gy) : Math.abs(s.gy - s.y));
    // Which option the lever is in right now: a gear once it is most of the way down a slot, otherwise neutral.
    const engaged = () => { let best = NEUTRAL; gears.forEach((g, i) => { if (g.row !== 0 && Math.abs(s.x - COLS[g.col]) < 2 && s.y * g.row > THROW * 0.72) best = i; }); return best; };
    const nearestGear = (x: number, y: number, reach: number) => { let best = -1, bd = reach; gears.forEach((_, i) => { const q = point(i), d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = i; } }); return best; };
    // The closest spot the gate allows to a free point.
    const clampToGate = (x: number, y: number) => {
      let best = { x: Math.max(COLS[0], Math.min(COLS[COLS.length - 1], x)), y: 0 }, bd = Math.hypot(best.x - x, y);
      gears.forEach((g) => { if (g.row === 0) return; const cy = g.row < 0 ? Math.max(-THROW, Math.min(0, y)) : Math.max(0, Math.min(THROW, y)), d = Math.hypot(COLS[g.col] - x, cy - y); if (d < bd) { bd = d; best = { x: COLS[g.col], y: cy }; } });
      return best;
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, t0 = 0, step = 0;
    const tour = [4, 5, 6, 7, 1, 2, 3]; // the order the idle demo walks through
    let nextDemo = 900;

    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      if (now - touched > 5200 && !s.drag && t > nextDemo) {
        const n = tour[step % tour.length]; step++;
        const q = point(n); s.gx = q.x; s.gy = q.y;
        nextDemo = t + (step === 1 ? 3000 : 1900);
      }
      const left = pathLeft();
      if (left > 0) travel(Math.min(left, Math.max(left * (1 - Math.exp(-dt * (s.drag ? 30 : 9))), (s.drag ? 500 : 150) * dt)));
      select(engaged());
      const h = knobHome();
      s.kvx += (420 * (h.x - s.kx) - 24 * s.kvx) * dt; s.kvy += (420 * (h.y - s.ky) - 24 * s.kvy) * dt;
      s.kx += s.kvx * dt; s.ky += s.kvy * dt;
      s.lamp = s.lamp.map((v, i) => v + ((i === gearRef.current ? 1 : 0) - v) * Math.min(1, dt * (i === gearRef.current ? 16 : 6)));
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const settle = () => { s.x = s.gx; s.y = s.gy; const h = knobHome(); s.kx = h.x; s.ky = h.y; s.kvx = 0; s.kvy = 0; select(engaged()); s.lamp = gears.map((_, i) => (i === gearRef.current ? 1 : 0)); draw(); };

    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1), wpx = Math.max(200, box.clientWidth);
      cv.width = Math.round(wpx * dpr); cv.height = Math.round((wpx * dpr * H) / W); k = cv.width / W;
      build(); draw();
    };
    size();
    const ro = new ResizeObserver(size); ro.observe(box);

    api.current = { go: (i) => { touched = performance.now(); const q = point(i); s.gx = q.x; s.gy = q.y; if (reduce) settle(); else wake(); } };
    if (reduce) settle(); else wake();

    const at = (e: PointerEvent) => { const r = pad.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W - CX, y: ((e.clientY - r.top) / r.height) * H - CY }; };
    let grab = { x: 0, y: 0 }, moved = 0, down = { x: 0, y: 0 };
    const aim = (q: { x: number; y: number }) => { const g = clampToGate(q.x - grab.x, q.y - grab.y); s.gx = g.x; s.gy = g.y; };
    const onDown = (e: PointerEvent) => {
      const q = at(e); touched = performance.now(); moved = 0; down = q;
      const onKnob = Math.hypot(q.x - s.kx, q.y - s.ky) < 50;
      grab = onKnob ? { x: q.x - s.x, y: q.y - s.y } : { x: 0, y: 0 };
      s.drag = onKnob; pad.setPointerCapture(e.pointerId); e.preventDefault(); wake();
    };
    const onMove = (e: PointerEvent) => {
      if (!pad.hasPointerCapture(e.pointerId)) return;
      const q = at(e); moved = Math.max(moved, Math.hypot(q.x - down.x, q.y - down.y)); touched = performance.now();
      if (!s.drag && moved > 6) { s.drag = true; grab = { x: 0, y: 0 }; }
      if (s.drag) { aim(q); if (reduce) settle(); }
    };
    const onUp = (e: PointerEvent) => {
      if (!pad.hasPointerCapture(e.pointerId)) return;
      pad.releasePointerCapture(e.pointerId); touched = performance.now();
      const q = at(e);
      let n: number;
      if (moved <= 6) { n = nearestGear(q.x, q.y * 0.86, 52); if (n < 0) n = gearRef.current; } // a tap on a numeral or slot end goes there
      else { n = NEUTRAL; gears.forEach((g, i) => { if (g.row !== 0 && Math.abs(s.gx - COLS[g.col]) < 2 && s.gy * g.row > THROW * 0.42) n = i; }); }
      s.drag = false; const g = point(n); s.gx = g.x; s.gy = g.y;
      if (reduce) settle();
    };
    pad.addEventListener("pointerdown", onDown); pad.addEventListener("pointermove", onMove);
    pad.addEventListener("pointerup", onUp); pad.addEventListener("pointercancel", onUp);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect();
      pad.removeEventListener("pointerdown", onDown); pad.removeEventListener("pointermove", onMove);
      pad.removeEventListener("pointerup", onUp); pad.removeEventListener("pointercancel", onUp);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const choose = (i: number) => { api.current?.go(i); };
  const onKey = (e: ReactKeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % gears.length : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i + gears.length - 1) % gears.length : e.key === "Home" ? 0 : e.key === "End" ? gears.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault(); choose(next); radios.current[next]?.focus();
  };

  return (
    <div className="flex min-h-[640px] w-full flex-col items-center justify-center bg-[#120c09] bg-[radial-gradient(110%_80%_at_50%_35%,#2a1b13_0%,#120c09_64%)] px-4 py-10 sm:min-h-[760px]">
      <div ref={wrap} className="relative aspect-[4/5] w-full max-w-[340px] sm:max-w-[468px]">
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div ref={hit} aria-hidden="true" className="absolute inset-[4%] cursor-grab touch-none active:cursor-grabbing" />
        <div role="radiogroup" aria-label="Gear" className="pointer-events-none absolute inset-0">
          {gears.map((g, i) => (
            <button
              key={g.id}
              ref={(el) => { radios.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={gear === i}
              aria-label={g.name}
              tabIndex={gear === i ? 0 : -1}
              onClick={() => choose(i)}
              onKeyDown={(e) => onKey(e, i)}
              style={{ left: `${((CX + COLS[g.col]) / W) * 100}%`, top: `${((CY + g.row * (THROW + SLOT / 2 + 21)) / H) * 100}%` }}
              className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a1a] focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
            />
          ))}
        </div>
      </div>
      <p aria-live="polite" className="mt-7 min-h-[20px] max-w-[320px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-[#b79d8a]">
        <span className="text-[#f3e6d8]">{gears[gear].name}</span>
        <span className="mx-2 text-[#6f5646]">/</span>
        {gears[gear].note}
      </p>
    </div>
  );
}

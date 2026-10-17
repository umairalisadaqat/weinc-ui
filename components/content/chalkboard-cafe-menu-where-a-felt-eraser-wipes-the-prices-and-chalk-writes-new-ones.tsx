import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// Everything a visitor is likely to change sits here.
const HEADING = "Today";
const STRAPLINE = "BAKED AT FIVE, GONE BY FOUR";
// Each item carries one price per entry in `sittings`.
const menu = [
  { name: "Flat white", note: "DOUBLE SHOT, STEAMED MILK", prices: ["4.20", "3.50"] },
  { name: "Apricot danish", note: "LAMINATED THIS MORNING", prices: ["4.80", "3.00"] },
  { name: "Cardamom bun", note: "PEARL SUGAR, BROWN BUTTER", prices: ["4.00", "2.50"] },
  { name: "Sourdough toast", note: "CULTURED BUTTER, PLUM JAM", prices: ["6.50", "5.00"] },
  { name: "Filter coffee", note: "REFILLS WHILE YOU SIT", prices: ["3.00", "2.00"] },
];
const sittings = [
  { label: "Morning", footer: "morning prices, till three", chalk: "#f2efe6" },
  { label: "After 3 pm", footer: "last bakes, marked down", chalk: "#f1cd6b" },
];
const PHOTO = "https://images.pexels.com/photos/13546334/pexels-photo-13546334.jpeg?auto=compress&cs=tinysrgb&w=600";
const PHOTO_ALT = "Two apricot pastries beside a cup of coffee on a speckled white plate";
const HAND = "Chalkduster, 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive"; // local fonts only

// The board in design pixels.
const W = 548, H = 652, BX = 24, BY = 18, BW = 500, BH = 588, F = 22;
const LEFT = BX + F + 30, RIGHT = BX + BW - F - 26, ROW0 = 216, ROW = 58, FOOT = 538, TRAY = BY + BH - 5;

export default function ChalkboardCafeMenu() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [sitting, setSitting] = useState(0);
  const live = useRef(0);
  const api = useRef<{ poke: () => void; stopDemo: () => void } | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mk = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
    let seed = 9;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // Chalk never covers slate completely. This tile of specks is cut out of everything written.
    const grit = mk(256, 256);
    {
      const g = grit.getContext("2d");
      if (g) {
        for (let i = 0; i < 11000; i++) { g.fillStyle = `rgba(0,0,0,${0.3 + rand() * 0.7})`; g.fillRect(rand() * 256, rand() * 256, 1 + rand() * 1.8, 1 + rand() * 0.6); }
        g.strokeStyle = "rgba(0,0,0,0.5)"; g.lineWidth = 1;
        for (let i = 0; i < 90; i++) { const x = rand() * 256, y = rand() * 256, l = 6 + rand() * 22; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y - l * 0.35); g.stroke(); }
      }
    }
    const roughen = (c: CanvasRenderingContext2D, w: number, h: number) => {
      const p = c.createPattern(grit, "repeat");
      if (!p) return;
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "destination-out"; c.fillStyle = p; c.fillRect(0, 0, w, h); c.restore();
    };

    // The parts that get wiped and rewritten: five prices and the line at the foot of the board.
    type Slot = { sx: number; sy: number; w: number; h: number; base: number; right: boolean; font: string; text: (m: number) => string; cv: HTMLCanvasElement; x0: number; tw: number; rv: number; dur: number };
    const slots: Slot[] = [
      ...menu.map((item, i) => ({ sx: RIGHT - 104, sy: ROW0 + i * ROW - 38, w: 110, h: 52, base: 38, right: true, font: `400 31px ${HAND}`, text: (m: number) => item.prices[m], cv: mk(1, 1), x0: 0, tw: 0, rv: 1, dur: 0.3 })),
      { sx: LEFT, sy: FOOT - 30, w: 340, h: 44, base: 30, right: false, font: `400 18px ${HAND}`, text: (m: number) => sittings[m].footer, cv: mk(1, 1), x0: 0, tw: 0, rv: 1, dur: 0.75 },
    ];
    let k = 1, shown = live.current;
    const scribe = (s: Slot, m: number) => {
      s.cv = mk(s.w * k, s.h * k);
      const c = s.cv.getContext("2d");
      if (!c) return;
      c.setTransform(k, 0, 0, k, 0, 0); c.font = s.font; c.textBaseline = "alphabetic";
      const t = s.text(m); s.tw = c.measureText(t).width; s.x0 = s.right ? s.w - 6 - s.tw : 2;
      c.fillStyle = sittings[m].chalk; c.globalAlpha = 0.94; c.fillText(t, s.x0, s.base);
      c.globalAlpha = 0.3; c.fillText(t, s.x0 + 0.5, s.base + 0.4);
      roughen(c, s.cv.width, s.cv.height);
    };

    let base = mk(1, 1), dust = mk(1, 1);
    const build = () => {
      base = mk(cv.width, cv.height); dust = mk(cv.width, cv.height);
      const b = base.getContext("2d");
      if (!b) return;
      b.setTransform(k, 0, 0, k, 0, 0); seed = 21;
      // Shadow of the board on the wall.
      b.save(); b.shadowColor = "rgba(60,40,20,0.36)"; b.shadowBlur = 16 * k; b.shadowOffsetX = (4 + 3000) * k; b.shadowOffsetY = 9 * k; b.fillStyle = "#000"; b.fillRect(BX - 3000, BY + 4, BW, BH); b.restore();
      // Slate.
      const sx = BX + F, sy = BY + F, sw = BW - F * 2, sh = BH - F * 2;
      const slate = b.createLinearGradient(sx, sy, sx + sw, sy + sh);
      slate.addColorStop(0, "#2b3430"); slate.addColorStop(0.5, "#222a27"); slate.addColorStop(1, "#1a201e");
      b.fillStyle = slate; b.fillRect(sx - 2, sy - 2, sw + 4, sh + 4);
      b.save(); b.beginPath(); b.rect(sx, sy, sw, sh); b.clip();
      // Years of wiping: pale clouds, long arcs from a cloth, and fine tooth.
      for (let i = 0; i < 46; i++) {
        const x = sx + rand() * sw, y = sy + rand() * sh, r = 40 + rand() * 120, g = b.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(226,232,224,${0.02 + rand() * 0.045})`); g.addColorStop(1, "rgba(226,232,224,0)");
        b.fillStyle = g; b.fillRect(x - r, y - r, r * 2, r * 2);
      }
      b.lineCap = "round";
      for (let i = 0; i < 26; i++) {
        const x = sx + rand() * sw, y = sy + rand() * sh, len = 120 + rand() * 260, bend = (rand() - 0.5) * 120;
        b.beginPath(); b.moveTo(x, y); b.quadraticCurveTo(x + len / 2, y + bend, x + len, y + (rand() - 0.5) * 60);
        b.lineWidth = 16 + rand() * 30; b.strokeStyle = `rgba(226,232,224,${0.012 + rand() * 0.02})`; b.stroke();
      }
      for (let i = 0; i < 5200; i++) { b.fillStyle = rand() > 0.55 ? `rgba(240,244,236,${rand() * 0.07})` : `rgba(0,0,0,${rand() * 0.16})`; b.fillRect(sx + rand() * sw, sy + rand() * sh, 0.6 + rand() * 1.4, 0.6 + rand()); }
      b.restore();

      // Everything that stays put is written on its own sheet, roughened once, then laid on the slate.
      const ink = mk(cv.width, cv.height), c = ink.getContext("2d");
      if (c) {
        c.setTransform(k, 0, 0, k, 0, 0); c.textBaseline = "alphabetic"; c.fillStyle = "#f2efe6";
        c.font = `400 60px ${HAND}`; c.globalAlpha = 0.95; c.fillText(HEADING, LEFT - 3, 122);
        c.globalAlpha = 0.3; c.fillText(HEADING, LEFT - 2.2, 122.6);
        // A double rule drawn in one pull, thicker where the stick was pressed.
        c.globalAlpha = 0.85; c.lineCap = "round"; c.strokeStyle = "#f2efe6";
        for (const [dy, lw] of [[0, 2.6], [6, 1.1]]) { c.beginPath(); c.moveTo(LEFT, 140 + dy); c.quadraticCurveTo(LEFT + 120, 137 + dy, LEFT + 262, 141 + dy); c.lineWidth = lw; c.stroke(); }
        const spaced = (t: string, x: number, y: number, gap: number) => { for (const ch of t) { c.fillText(ch, x, y); x += c.measureText(ch).width + gap; } };
        c.font = "600 10.5px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"; c.globalAlpha = 0.72; spaced(STRAPLINE, LEFT, 168, 2.1);
        menu.forEach((item, i) => {
          const y = ROW0 + i * ROW;
          c.font = "400 24px Georgia, 'Times New Roman', serif"; c.globalAlpha = 0.94; c.fillStyle = "#f2efe6"; c.fillText(item.name, LEFT, y);
          const end = LEFT + c.measureText(item.name).width + 12;
          c.globalAlpha = 0.28; c.fillText(item.name, LEFT + 0.5, y + 0.4);
          c.font = "600 9.5px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"; c.globalAlpha = 0.6; spaced(item.note, LEFT, y + 18, 1.7);
          c.globalAlpha = 0.55; for (let x = end; x < RIGHT - 96; x += 8) { c.beginPath(); c.arc(x, y - 3 + ((x * 7) % 3) * 0.4, 1.1, 0, Math.PI * 2); c.fill(); }
        });
        roughen(c, ink.width, ink.height);
        b.setTransform(1, 0, 0, 1, 0, 0); b.drawImage(ink, 0, 0); b.setTransform(k, 0, 0, k, 0, 0);
      }

      // Oak frame: four mitred lengths with a rounded outer edge and a shadow thrown onto the slate.
      const inner = b.createLinearGradient(0, sy, 0, sy + 16);
      inner.addColorStop(0, "rgba(0,0,0,0.6)"); inner.addColorStop(1, "rgba(0,0,0,0)");
      b.fillStyle = inner; b.fillRect(sx, sy, sw, 16);
      const innerL = b.createLinearGradient(sx, 0, sx + 12, 0);
      innerL.addColorStop(0, "rgba(0,0,0,0.5)"); innerL.addColorStop(1, "rgba(0,0,0,0)");
      b.fillStyle = innerL; b.fillRect(sx, sy, 12, sh);
      const sides: [number, number, number, number, boolean][] = [[BX, BY, BW, F, true], [BX, BY + BH - F, BW, F, true], [BX, BY, F, BH, false], [BX + BW - F, BY, F, BH, false]];
      sides.forEach(([x, y, w, h, flat], n) => {
        b.save(); b.beginPath();
        if (n === 0) { b.moveTo(x, y); b.lineTo(x + w, y); b.lineTo(x + w - F, y + F); b.lineTo(x + F, y + F); }
        else if (n === 1) { b.moveTo(x + F, y); b.lineTo(x + w - F, y); b.lineTo(x + w, y + F); b.lineTo(x, y + F); }
        else if (n === 2) { b.moveTo(x, y); b.lineTo(x + F, y + F); b.lineTo(x + F, y + h - F); b.lineTo(x, y + h); }
        else { b.moveTo(x + F, y); b.lineTo(x + F, y + h); b.lineTo(x, y + h - F); b.lineTo(x, y + F); }
        b.closePath(); b.clip();
        const g = flat ? b.createLinearGradient(0, y, 0, y + h) : b.createLinearGradient(x, 0, x + w, 0);
        const lit = n === 0 || n === 2;
        g.addColorStop(0, lit ? "#d8a976" : "#a9773f"); g.addColorStop(0.18, lit ? "#c18f58" : "#b5834d"); g.addColorStop(0.8, lit ? "#b17f48" : "#9a6a36"); g.addColorStop(1, lit ? "#8c5f30" : "#6f4a22");
        b.fillStyle = g; b.fillRect(x, y, w, h);
        for (let i = 0; i < 46; i++) {
          const v = rand(), along = rand(), off = rand(), len = 30 + rand() * 160;
          b.beginPath();
          if (flat) { const gx = x + along * w, gy = y + off * h; b.moveTo(gx, gy); b.bezierCurveTo(gx + len * 0.3, gy + (rand() - 0.5) * 2, gx + len * 0.7, gy + (rand() - 0.5) * 2, gx + len, gy + (rand() - 0.5)); }
          else { const gx = x + off * w, gy = y + along * h; b.moveTo(gx, gy); b.bezierCurveTo(gx + (rand() - 0.5) * 2, gy + len * 0.3, gx + (rand() - 0.5) * 2, gy + len * 0.7, gx + (rand() - 0.5), gy + len); }
          b.lineWidth = 0.5 + rand() * 0.7; b.strokeStyle = v > 0.6 ? "rgba(255,230,190,0.2)" : "rgba(70,40,14,0.24)"; b.stroke();
        }
        b.restore();
      });
      b.strokeStyle = "rgba(60,34,12,0.55)"; b.lineWidth = 0.7;
      for (const [x1, y1, x2, y2] of [[BX, BY, BX + F, BY + F], [BX + BW, BY, BX + BW - F, BY + F], [BX, BY + BH, BX + F, BY + BH - F], [BX + BW, BY + BH, BX + BW - F, BY + BH - F]]) { b.beginPath(); b.moveTo(x1, y1); b.lineTo(x2, y2); b.stroke(); }
      b.strokeStyle = "rgba(255,238,206,0.7)"; b.lineWidth = 1; b.beginPath(); b.moveTo(BX + 0.5, BY + BH - 1); b.lineTo(BX + 0.5, BY + 0.5); b.lineTo(BX + BW - 1, BY + 0.5); b.stroke();
      b.strokeStyle = "rgba(40,22,6,0.6)"; b.beginPath(); b.moveTo(BX + BW - 0.5, BY + 1); b.lineTo(BX + BW - 0.5, BY + BH - 0.5); b.lineTo(BX + 1, BY + BH - 0.5); b.stroke();
      b.strokeStyle = "rgba(30,16,4,0.7)"; b.lineWidth = 1.2; b.strokeRect(sx - 0.4, sy - 0.4, sw + 0.8, sh + 0.8);
      b.strokeStyle = "rgba(255,236,200,0.35)"; b.lineWidth = 0.8; b.beginPath(); b.moveTo(sx, sy + sh + 1.2); b.lineTo(sx + sw + 1.2, sy + sh + 1.2); b.lineTo(sx + sw + 1.2, sy); b.stroke();

      // The chalk ledge, with the dust that collects on it.
      const tx = BX + 26, tw = BW - 52;
      b.save(); b.shadowColor = "rgba(40,22,6,0.6)"; b.shadowBlur = 9 * k; b.shadowOffsetY = 6 * k;
      const ledge = b.createLinearGradient(0, TRAY, 0, TRAY + 20);
      ledge.addColorStop(0, "#e2b480"); ledge.addColorStop(0.34, "#c69259"); ledge.addColorStop(0.36, "#a9773f"); ledge.addColorStop(1, "#7a5226");
      b.fillStyle = ledge; b.beginPath(); b.moveTo(tx + 4, TRAY); b.lineTo(tx + tw - 4, TRAY); b.lineTo(tx + tw, TRAY + 7); b.lineTo(tx + tw, TRAY + 17); b.arcTo(tx + tw, TRAY + 20, tx + tw - 3, TRAY + 20, 3); b.lineTo(tx + 3, TRAY + 20); b.arcTo(tx, TRAY + 20, tx, TRAY + 17, 3); b.lineTo(tx, TRAY + 7); b.closePath(); b.fill(); b.restore();
      b.fillStyle = "rgba(255,240,214,0.6)"; b.fillRect(tx + 1, TRAY + 6.6, tw - 2, 0.9);
      for (let i = 0; i < 240; i++) { b.fillStyle = `rgba(250,248,240,${0.25 + rand() * 0.5})`; b.fillRect(tx + 8 + rand() * (tw - 16), TRAY + 0.5 + rand() * 6, 0.6 + rand() * 1.6, 0.6 + rand() * 0.8); }
      slots.forEach((s) => scribe(s, shown));
    };
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth || W;
      cv.width = Math.round(w * dpr); cv.height = Math.round((w * dpr * H) / W); k = cv.width / W;
      build();
    };

    // Tools. `lift` is how far off the board they are: 0 touching, 1 parked on the ledge.
    const stick = (x: number, y: number, a: number, col: string, lift: number) => {
      const draw = (shadow: boolean) => {
        ctx.save(); ctx.translate(x + (shadow ? 3 + lift * 2 : 0), y + (shadow ? 4 + lift * 3 : 0)); ctx.rotate(a);
        ctx.beginPath(); ctx.moveTo(0, -1.4); ctx.lineTo(4, -4.6); ctx.lineTo(50, -4.6); ctx.arcTo(52.5, -4.6, 52.5, 0, 2); ctx.arcTo(52.5, 4.6, 50, 4.6, 2); ctx.lineTo(3, 4.6); ctx.lineTo(0, 2.6); ctx.closePath();
        if (shadow) { ctx.fillStyle = "rgba(0,0,0,0.42)"; ctx.filter = "blur(2.5px)"; ctx.fill(); ctx.restore(); return; }
        ctx.fillStyle = col; ctx.fill();
        const g = ctx.createLinearGradient(0, -4.6, 0, 4.6);
        g.addColorStop(0, "rgba(0,0,0,0.26)"); g.addColorStop(0.22, "rgba(255,255,255,0.5)"); g.addColorStop(0.5, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,0.42)");
        ctx.fillStyle = g; ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.12)"; for (let i = 0; i < 14; i++) ctx.fillRect(6 + ((i * 37) % 43), -3.4 + ((i * 13) % 7), 1, 0.8);
        ctx.restore();
      };
      draw(true); draw(false);
    };
    const eraser = (x: number, y: number, a: number, lift: number) => {
      const shape = () => { ctx.beginPath(); ctx.moveTo(-33, -13); ctx.arcTo(35, -13, 35, 15, 4); ctx.arcTo(35, 15, -35, 15, 4); ctx.arcTo(-35, 15, -35, -13, 4); ctx.arcTo(-35, -13, 35, -13, 4); ctx.closePath(); };
      ctx.save(); ctx.translate(x + 4 + lift * 3, y + 6 + lift * 4); ctx.rotate(a); shape(); ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.filter = "blur(4px)"; ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      // Felt pad showing under the wooden back.
      shape(); ctx.fillStyle = "#3a3b3d"; ctx.fill();
      ctx.save(); ctx.clip();
      for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? "#57585b" : "#2c2d2f"; ctx.fillRect(-35, 6 + i * 2, 70, 2); }
      ctx.fillStyle = "rgba(240,240,232,0.3)"; ctx.fillRect(-35, 12, 70, 3);
      ctx.restore();
      // Wooden back with a finger groove.
      const wood = ctx.createLinearGradient(0, -13, 0, 6);
      wood.addColorStop(0, "#d79a6c"); wood.addColorStop(0.2, "#b06a3e"); wood.addColorStop(1, "#7c4424");
      ctx.beginPath(); ctx.moveTo(-31, -13); ctx.arcTo(35, -13, 35, 6, 4); ctx.lineTo(35, 6); ctx.lineTo(-35, 6); ctx.arcTo(-35, -13, 35, -13, 4); ctx.closePath(); ctx.fillStyle = wood; ctx.fill();
      const groove = ctx.createLinearGradient(0, -7, 0, 0);
      groove.addColorStop(0, "rgba(70,40,14,0.55)"); groove.addColorStop(1, "rgba(255,236,204,0.5)");
      ctx.fillStyle = groove; ctx.beginPath(); ctx.moveTo(-26, -7); ctx.arcTo(26, -7, 26, 0, 3.5); ctx.arcTo(26, 0, -26, 0, 3.5); ctx.arcTo(-26, 0, -26, -7, 3.5); ctx.arcTo(-26, -7, 26, -7, 3.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,246,226,0.75)"; ctx.fillRect(-31, -12.6, 62, 0.9);
      ctx.restore();
    };

    const restE = { x: BX + 118, y: TRAY - 14, a: 0.02 }, restC = [{ x: BX + 250, y: TRAY - 4, a: 0.03 }, { x: BX + 318, y: TRAY - 4.4, a: -0.02 }];
    const s = { ex: restE.x, ey: restE.y, ea: restE.a, el: 1, cx: restC[0].x, cy: restC[0].y, ca: restC[0].a, cl: 1 };
    let motes: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    type Phase = "idle" | "wipe" | "write";
    let phase: Phase = "idle", p = 0, wi = 0, hand = shown;

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0); ctx.drawImage(dust, 0, 0);
      for (const sl of slots) {
        if (sl.rv <= 0) continue;
        const wpx = Math.min(sl.cv.width, Math.ceil((sl.x0 + sl.tw * sl.rv + 2) * k));
        ctx.drawImage(sl.cv, 0, 0, wpx, sl.cv.height, Math.round(sl.sx * k), Math.round(sl.sy * k), wpx, sl.cv.height);
      }
      ctx.setTransform(k, 0, 0, k, 0, 0);
      for (const m of motes) { ctx.fillStyle = `rgba(245,242,232,${Math.min(0.8, m.life * 1.6)})`; ctx.fillRect(m.x, m.y, 1.4, 1.4); }
      // The stick that is not in the hand stays on the ledge.
      const other = 1 - hand;
      if (sittings[other]) stick(restC[other].x, restC[other].y, restC[other].a, sittings[other].chalk, 1);
      eraser(s.ex, s.ey, s.ea, s.el);
      stick(s.cx, s.cy, s.ca, sittings[hand].chalk, s.cl);
    };

    const wipeAt = (q: number) => {
      const last = ROW0 + (menu.length - 1) * ROW;
      if (q < 0.7) { const u = q / 0.7; return { x: RIGHT - 52 + Math.sin(u * Math.PI * 7) * 26, y: ROW0 - 34 + (last - ROW0 + 44) * u, a: Math.sin(u * Math.PI * 7) * 0.16 }; }
      if (q < 0.78) { const u = (q - 0.7) / 0.08; return { x: RIGHT - 52 - u * 80, y: last + 10 + (FOOT - 8 - last - 10) * u, a: 0.1 }; }
      const u = (q - 0.78) / 0.22; return { x: RIGHT - 132 - u * (RIGHT - 132 - LEFT - 20), y: FOOT - 8 + Math.sin(u * Math.PI * 5) * 5, a: Math.sin(u * Math.PI * 5) * 0.1 };
    };
    const rub = () => {
      // Take chalk off whatever the felt is touching, and leave a pale smear behind.
      for (const sl of slots) {
        if (s.ex + 36 < sl.sx || s.ex - 36 > sl.sx + sl.w || s.ey + 18 < sl.sy || s.ey - 16 > sl.sy + sl.h) continue;
        const c = sl.cv.getContext("2d");
        if (!c) continue;
        c.save(); c.setTransform(k, 0, 0, k, 0, 0); c.globalCompositeOperation = "destination-out"; c.translate(s.ex - sl.sx, s.ey - sl.sy); c.rotate(s.ea);
        c.fillStyle = "rgba(0,0,0,0.45)"; c.fillRect(-37, -16, 74, 34); c.fillStyle = "rgba(0,0,0,0.82)"; c.fillRect(-34, -13, 68, 28); c.restore();
      }
      const d = dust.getContext("2d");
      if (d) { d.save(); d.setTransform(k, 0, 0, k, 0, 0); d.translate(s.ex, s.ey); d.rotate(s.ea); d.filter = "blur(5px)"; d.fillStyle = "rgba(232,236,226,0.022)"; d.fillRect(-34, -13, 68, 28); d.restore(); }
    };

    let raf = 0, last = 0, t0 = 0, seen = true, demo = !reduce, demoAt = 5.4;
    const begin = () => {
      phase = "wipe"; p = 0;
      const d = dust.getContext("2d");
      if (d) { d.save(); d.setTransform(1, 0, 0, 1, 0, 0); d.globalCompositeOperation = "destination-out"; d.fillStyle = "rgba(0,0,0,0.45)"; d.fillRect(0, 0, dust.width, dust.height); d.restore(); }
    };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      if (demo && t > demoAt) { demoAt = t + 7.5; live.current = 1 - live.current; setSitting(live.current); }
      if (phase === "idle" && live.current !== shown) begin();
      let et = { ...restE }, el = 1, ct = { ...restC[hand] }, cl = 1, ef = 7, cf = 7;
      if (phase === "wipe") {
        p += dt / 2.1;
        if (p > 0.1) { const q = Math.min(1, (p - 0.1) / 0.82); et = wipeAt(q); el = 0; ef = 22; if (Math.hypot(s.ex - et.x, s.ey - et.y) < 30 && q < 1) rub(); }
        if (p >= 1) { shown = live.current; hand = shown; slots.forEach((sl) => { scribe(sl, shown); sl.rv = 0; }); s.cx = restC[hand].x; s.cy = restC[hand].y; phase = "write"; wi = 0; p = -0.5; }
      } else if (phase === "write") {
        while (wi < slots.length && slots[wi].rv >= 1 && p <= 0) wi++;
        const sl = slots[wi];
        if (!sl) phase = "idle";
        else {
          p += dt / sl.dur;
          const rv = Math.max(0, Math.min(1, p)); sl.rv = Math.max(sl.rv, p > 0 ? rv : 0);
          ct = { x: sl.sx + sl.x0 + sl.tw * rv, y: sl.sy + sl.base - 11 + Math.sin(rv * sl.tw * 0.42) * 6.5, a: -0.95 + Math.sin(rv * sl.tw * 0.42) * 0.06 }; cl = 0; cf = 24;
          if (p > 0 && p < 1 && motes.length < 46 && Math.random() < 0.6) motes.push({ x: s.cx + (Math.random() - 0.5) * 4, y: s.cy + 2, vx: (Math.random() - 0.5) * 14, vy: 6 + Math.random() * 20, life: 0.5 + Math.random() * 0.5 });
          if (p >= 1.45) { sl.rv = 1; wi++; p = -0.05; }
        }
      }
      const ease = (f: number) => Math.min(1, dt * f);
      s.ex += (et.x - s.ex) * ease(ef); s.ey += (et.y - s.ey) * ease(ef); s.ea += (et.a - s.ea) * ease(14); s.el += (el - s.el) * ease(10);
      s.cx += (ct.x - s.cx) * ease(cf); s.cy += (ct.y - s.cy) * ease(cf); s.ca += (ct.a - s.ca) * ease(12); s.cl += (cl - s.cl) * ease(10);
      for (const m of motes) { m.vy += 160 * dt; m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt; }
      motes = motes.filter((m) => m.life > 0 && m.y < TRAY);
      draw();
      const settled = phase === "idle" && !demo && motes.length === 0 && Math.hypot(s.ex - restE.x, s.ey - restE.y) < 0.3 && Math.hypot(s.cx - restC[hand].x, s.cy - restC[hand].y) < 0.3;
      if (!settled && seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const still = () => {
      shown = live.current; hand = shown; phase = "idle"; motes = [];
      slots.forEach((sl) => { scribe(sl, shown); sl.rv = 1; });
      Object.assign(s, { ex: restE.x, ey: restE.y, ea: restE.a, el: 1, cx: restC[hand].x, cy: restC[hand].y, ca: restC[hand].a, cl: 1 });
      draw();
    };
    const wake = () => { if (reduce) still(); else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    api.current = { poke: wake, stopDemo: () => { demo = false; } };
    fit();
    if (!reduce) {
      // Open on the last two prices still to be written, so the board is seen being finished.
      slots.forEach((sl, i) => { sl.rv = i === menu.length - 2 || i === menu.length - 1 ? 0 : 1; });
      phase = "write"; wi = menu.length - 2; p = -0.6;
    }
    wake();

    const ro = new ResizeObserver(() => { fit(); if (reduce) still(); else { slots.forEach((sl) => { if (phase === "idle") sl.rv = 1; }); draw(); wake(); } });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const choose = (i: number) => { api.current?.stopDemo(); live.current = i; setSitting(i); api.current?.poke(); };
  const onKey = (e: ReactKeyboardEvent) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (sitting + step + sittings.length) % sittings.length;
    choose(next); tabs.current[next]?.focus();
  };
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  return (
    <div className="flex min-h-[640px] w-full sm:min-h-[820px] flex-col items-center justify-center bg-[#e6ddcf] bg-[radial-gradient(85%_70%_at_30%_22%,#f6f0e6_0%,#e9e0d2_48%,#d5c9b7_100%)] px-4 py-10">
      <div className="relative w-full max-w-[580px]" style={{ aspectRatio: `${W} / ${H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <figure className="absolute m-0 rotate-[5deg] bg-[#fbf8f1] shadow-[0_1px_1px_rgba(0,0,0,0.35),0_10px_18px_-6px_rgba(0,0,0,0.6)]" style={{ left: pct(BX + BW - F - 138, W), top: pct(BY + F + 10, H), width: pct(114, W), padding: pct(6, W), paddingBottom: pct(16, W) }}>
          <img src={PHOTO} alt={PHOTO_ALT} width={600} height={600} loading="eager" className="block aspect-square w-full bg-[#e7d9c6] object-cover" />
          <span aria-hidden="true" className="absolute left-1/2 top-0 h-[13%] w-[46%] -translate-x-1/2 -translate-y-1/2 -rotate-[4deg] bg-[#efe2b8]/80 shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
        </figure>
        <ul className="sr-only" aria-live="polite" aria-label={`Menu, ${sittings[sitting].label} prices`}>
          {menu.map((item) => (
            <li key={item.name}>{`${item.name}, ${item.prices[sitting]}`}</li>
          ))}
        </ul>
      </div>
      <div role="radiogroup" aria-label="Which prices to show" onKeyDown={onKey} className="mt-3 inline-flex rounded-full bg-[#2a322f] p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_10px_20px_-10px_rgba(60,40,20,0.7)]">
        {sittings.map((sit, i) => (
          <button
            key={sit.label}
            ref={(el) => { tabs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={sitting === i}
            tabIndex={sitting === i ? 0 : -1}
            onClick={() => choose(i)}
            className={`min-h-[44px] rounded-full px-6 font-mono text-[11px] uppercase tracking-[0.18em] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[#2a322f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e6ddcf] ${sitting === i ? "bg-[#f2efe6] text-[#1d2421]" : "text-[#d9d6cc] hover:text-white"}`}
          >
            {sit.label}
          </button>
        ))}
      </div>
    </div>
  );
}

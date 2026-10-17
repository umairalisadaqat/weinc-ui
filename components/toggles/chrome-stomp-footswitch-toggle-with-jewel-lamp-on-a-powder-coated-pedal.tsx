import { useEffect, useRef, useState } from "react";

// What the switch controls, and the words printed on the box.
const effect = { name: "Tremolo", on: "Engaged", off: "Bypassed", print: "TREMOLO", foot: "ON / BYPASS" };
const BOX = [214, 68, 40]; // powder coat, as red, green, blue
const LAMP = [255, 176, 32]; // the jewel when lit
const W = 320, H = 470;

export default function ChromeStompFootswitchToggle() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState(true);
  const onRef = useRef(true);
  const api = useRef<{ press: (down: boolean) => void; set: (v: boolean, pulse: boolean) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1) * 1.2;
    cv.width = W * dpr; cv.height = H * dpr;
    const BX = 44, BY = 26, BW = 232, BH = 376, BR = 26, DEPTH = 13;
    const JX = 160, JY = 136, SXc = 160, SYc = 292;
    const hasConic = typeof ctx.createConicGradient === "function";
    const box = (k: number, a = 1) => `rgba(${Math.min(255, BOX[0] * k) | 0},${Math.min(255, BOX[1] * k) | 0},${Math.min(255, BOX[2] * k) | 0},${a})`;

    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };
    let seed = 23;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // The die-cast box is painted once: side wall, top face, the orange-peel of the powder coat, rolled edges, print.
    const still = document.createElement("canvas");
    still.width = cv.width; still.height = cv.height;
    const sc = still.getContext("2d");
    if (sc) {
      sc.scale(dpr, dpr);
      // Jack sockets poke out of both sides, under the lip of the lid.
      for (const dir of [-1, 1]) {
        const jx = dir < 0 ? BX : BX + BW, jy = BY + 150;
        const g = sc.createLinearGradient(0, jy - 13, 0, jy + 13);
        g.addColorStop(0, "#5d656c"); g.addColorStop(0.18, "#f5f8fa"); g.addColorStop(0.36, "#a3acb3"); g.addColorStop(0.55, "#41474d"); g.addColorStop(0.7, box(0.55)); g.addColorStop(0.86, "#d9dde0"); g.addColorStop(1, "#33383d");
        sc.fillStyle = g;
        sc.save(); sc.shadowColor = "rgba(20,26,36,0.5)"; sc.shadowBlur = 5 * dpr; sc.shadowOffsetY = 5 * dpr;
        sc.fillRect(dir < 0 ? jx - 7 : jx - 2, jy - 13, 9, 26); sc.restore();
        sc.fillRect(dir < 0 ? jx - 15 : jx + 7, jy - 9, 8, 18);
        sc.fillStyle = "rgba(0,0,0,0.35)"; sc.fillRect(dir < 0 ? jx - 7.6 : jx + 7, jy - 13, 0.6, 26);
        for (let k = 0; k < 4; k++) { sc.fillStyle = "rgba(0,0,0,0.3)"; sc.fillRect(dir < 0 ? jx - 14 + k * 2 : jx + 8 + k * 2, jy - 9, 0.6, 18); }
      }
      sc.save(); sc.shadowColor = "rgba(20,26,36,0.55)"; sc.shadowBlur = 6 * dpr; sc.shadowOffsetY = 4 * dpr;
      rr(sc, BX, BY + DEPTH, BW, BH, BR); sc.fillStyle = "#000"; sc.fill(); sc.restore();
      const wall = sc.createLinearGradient(BX, 0, BX + BW, 0);
      wall.addColorStop(0, box(0.42)); wall.addColorStop(0.12, box(0.66)); wall.addColorStop(0.5, box(0.56)); wall.addColorStop(0.9, box(0.44)); wall.addColorStop(1, box(0.3));
      rr(sc, BX, BY + DEPTH, BW, BH, BR); sc.fillStyle = wall; sc.fill();
      rr(sc, BX, BY, BW, BH, BR); sc.fillStyle = box(1); sc.fill();
      sc.save(); rr(sc, BX, BY, BW, BH, BR); sc.clip();
      for (let i = 0; i < 9000; i++) {
        const v = rand(), r = 0.4 + rand() * 0.7;
        sc.fillStyle = v > 0.5 ? `rgba(255,235,220,${(v - 0.5) * 0.2})` : `rgba(60,0,0,${(0.5 - v) * 0.26})`;
        sc.beginPath(); sc.arc(BX + rand() * BW, BY + rand() * BH, r, 0, Math.PI * 2); sc.fill();
      }
      const wash = sc.createLinearGradient(BX, BY, BX + BW * 0.5, BY + BH);
      wash.addColorStop(0, "rgba(255,240,225,0.2)"); wash.addColorStop(0.4, "rgba(255,240,225,0.03)"); wash.addColorStop(1, "rgba(40,0,0,0.2)");
      sc.fillStyle = wash; sc.fillRect(BX, BY, BW, BH);
      // Rolled edge: a few clipped strokes of falling width make a soft round-over.
      const roll = sc.createLinearGradient(0, BY, 0, BY + BH);
      roll.addColorStop(0, "rgba(255,244,232,0.026)"); roll.addColorStop(0.3, "rgba(255,244,232,0.006)"); roll.addColorStop(0.7, "rgba(50,0,0,0.012)"); roll.addColorStop(1, "rgba(50,0,0,0.06)");
      for (let w = 30; w >= 1; w -= 1.5) { rr(sc, BX, BY, BW, BH, BR); sc.lineWidth = w; sc.strokeStyle = roll; sc.stroke(); }
      rr(sc, BX + 0.5, BY + 0.5, BW - 1, BH - 1, BR - 0.5); sc.lineWidth = 1; sc.strokeStyle = "rgba(255,236,222,0.35)"; sc.stroke();
      sc.restore();

      // Screen print: white ink with the faintest edge under it.
      const print = (text: string, y: number, size: number, gap: number) => {
        sc.font = `700 ${size}px "Helvetica Neue", Helvetica, Arial, sans-serif`; sc.textBaseline = "middle"; sc.textAlign = "left";
        const widths = [...text].map((ch) => sc.measureText(ch).width + gap), total = widths.reduce((a, b) => a + b, 0) - gap;
        let x = 160 - total / 2;
        [...text].forEach((ch, i) => { sc.fillStyle = "rgba(70,10,0,0.35)"; sc.fillText(ch, x, y + 0.9); sc.fillStyle = "rgba(255,250,242,0.96)"; sc.fillText(ch, x, y); x += widths[i]; });
      };
      print(effect.print, BY + 50, 19, 5.5);
      print(effect.foot, BY + BH - 30, 8.5, 2.6);
      sc.strokeStyle = "rgba(255,250,242,0.9)"; sc.lineWidth = 1.4;
      sc.beginPath(); sc.moveTo(BX + 34, BY + 72); sc.lineTo(BX + BW - 34, BY + 72); sc.stroke();
      sc.beginPath(); sc.arc(SXc, SYc, 62, Math.PI * 0.62, Math.PI * 2.38); sc.stroke();
    }

    const chrome = (c: CanvasRenderingContext2D, x: number, y: number, rot: number) => {
      if (!hasConic) { const g = c.createLinearGradient(x - 40, y - 40, x + 40, y + 40); g.addColorStop(0, "#fafcfd"); g.addColorStop(0.5, "#737b82"); g.addColorStop(1, "#e8edf0"); return g; }
      const g = c.createConicGradient(rot, x, y);
      const stops: [number, string][] = [[0, "#f7fafc"], [0.06, "#c4ccd2"], [0.13, "#5e666d"], [0.2, "#a7b0b7"], [0.29, "#eef2f5"], [0.37, "#8b949b"], [0.46, "#3c4248"], [0.52, "#9aa3aa"], [0.6, "#f9fbfc"], [0.68, "#a9b2b9"], [0.77, "#555c63"], [0.86, "#b9c1c7"], [0.94, "#e9eef1"], [1, "#f7fafc"]];
      for (const [p, col] of stops) g.addColorStop(p, col);
      return g;
    };
    // A polished cylinder seen from the side: bands of sky, horizon and the red box.
    const barrel = (x: number, r: number) => {
      const g = ctx.createLinearGradient(x - r, 0, x + r, 0);
      const stops: [number, string][] = [[0, "#22262a"], [0.06, "#8d969d"], [0.16, "#f4f7f9"], [0.27, "#aab3ba"], [0.4, "#4a5057"], [0.5, "#2b2f34"], [0.6, box(0.6)], [0.72, "#c9a59b"], [0.84, "#f6f8fa"], [0.94, "#7c858c"], [1, "#1d2024"]];
      for (const [p, col] of stops) g.addColorStop(p, col);
      return g;
    };

    const s = { x: 0, v: 0, held: false, pulse: 0, lamp: 1, lx: -0.42, ly: -0.5 };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(still, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const L = s.lamp, [lr, lg, lb] = LAMP;

      // ---- Jewel lamp ----
      if (L > 0.01) {
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        const spill = ctx.createRadialGradient(JX, JY, 12, JX, JY, 96);
        spill.addColorStop(0, `rgba(${lr},${lg},${lb},${0.5 * L})`); spill.addColorStop(0.35, `rgba(${lr},${lg},${lb},${0.14 * L})`); spill.addColorStop(1, `rgba(${lr},${lg},${lb},0)`);
        rr(ctx, BX, BY, BW, BH, BR); ctx.clip(); ctx.fillStyle = spill; ctx.fillRect(JX - 96, JY - 96, 192, 192); ctx.restore();
      }
      ctx.save(); ctx.shadowColor = "rgba(40,0,0,0.6)"; ctx.shadowBlur = 7 * dpr; ctx.shadowOffsetY = 5 * dpr; ctx.shadowOffsetX = 2 * dpr;
      ctx.beginPath(); ctx.arc(JX, JY, 28, 0, Math.PI * 2); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(JX, JY, 29, 0, Math.PI * 2); ctx.fillStyle = chrome(ctx, JX, JY, s.lx * 0.5 + 0.4); ctx.fill();
      ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(JX, JY, 23.5, 0, Math.PI * 2); ctx.fillStyle = chrome(ctx, JX, JY, s.lx * 0.5 + 2.2); ctx.fill();
      ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(JX, JY, 19.4, 0, Math.PI * 2); ctx.fillStyle = "#0a0503"; ctx.fill();
      const R = 18.2;
      const glass = ctx.createRadialGradient(JX, JY, 0, JX, JY, R);
      const mix = (off: number, lit: number) => (off + (lit - off) * L) | 0;
      glass.addColorStop(0, `rgb(${mix(150, 255)},${mix(60, 250)},${mix(6, 214)})`);
      glass.addColorStop(0.45, `rgb(${mix(120, 255)},${mix(44, 190)},${mix(4, 52)})`);
      glass.addColorStop(1, `rgb(${mix(62, 226)},${mix(20, 104)},${mix(2, 4)})`);
      ctx.save(); if (L > 0.01) { ctx.shadowColor = `rgba(${lr},${lg},${lb},${L})`; ctx.shadowBlur = 26 * dpr; }
      ctx.beginPath(); ctx.arc(JX, JY, R, 0, Math.PI * 2); ctx.fillStyle = glass; ctx.fill(); ctx.restore();
      // Cut facets: an outer ring of wedges and an inner star, each catching the light differently.
      ctx.save(); ctx.beginPath(); ctx.arc(JX, JY, R, 0, Math.PI * 2); ctx.clip();
      const N = 14;
      for (let ring = 0; ring < 2; ring++) for (let i = 0; i < N; i++) {
        const a0 = ((i + ring * 0.5) / N) * Math.PI * 2, a1 = a0 + (Math.PI * 2) / N, am = (a0 + a1) / 2;
        const r0 = ring ? 0 : 9.6, r1 = ring ? 9.6 : R;
        const face = Math.cos(am - Math.atan2(s.ly, s.lx)), v = (i % 2 ? 0.5 : -0.5) + face * 0.6;
        ctx.beginPath(); ctx.moveTo(JX + Math.cos(a0) * r0, JY + Math.sin(a0) * r0); ctx.lineTo(JX + Math.cos(a0) * r1, JY + Math.sin(a0) * r1); ctx.lineTo(JX + Math.cos(a1) * r1, JY + Math.sin(a1) * r1); ctx.lineTo(JX + Math.cos(a1) * r0, JY + Math.sin(a1) * r0); ctx.closePath();
        ctx.fillStyle = v > 0 ? `rgba(255,${ring ? 250 : 226},${ring ? 200 : 150},${v * (0.2 + 0.24 * L)})` : `rgba(50,8,0,${-v * (0.42 - 0.2 * L)})`; ctx.fill();
        ctx.strokeStyle = `rgba(255,236,190,${0.1 + 0.2 * L})`; ctx.lineWidth = 0.4; ctx.stroke();
      }
      const rim = ctx.createRadialGradient(JX, JY, R * 0.55, JX, JY, R);
      rim.addColorStop(0, "rgba(0,0,0,0)"); rim.addColorStop(1, `rgba(40,6,0,${0.6 - 0.3 * L})`);
      ctx.fillStyle = rim; ctx.fillRect(JX - R, JY - R, R * 2, R * 2);
      ctx.restore();
      ctx.save(); ctx.translate(JX + s.lx * 13.5, JY + s.ly * 13.5); ctx.rotate(-0.6); ctx.scale(1, 0.55);
      const hot = ctx.createRadialGradient(0, 0, 0, 0, 0, 6.5); hot.addColorStop(0, "rgba(255,255,255,0.95)"); hot.addColorStop(0.5, "rgba(255,255,255,0.3)"); hot.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hot; ctx.fillRect(-7, -7, 14, 14); ctx.restore();

      // ---- Footswitch ----
      const x = SXc, y = SYc, press = Math.max(-0.15, Math.min(1.08, s.x));
      const top = 14 + 15 * (1 - press); // how far the cap stands above the box
      // Washer.
      ctx.save(); ctx.shadowColor = "rgba(40,0,0,0.55)"; ctx.shadowBlur = 5 * dpr; ctx.shadowOffsetY = 3 * dpr; ctx.shadowOffsetX = 1.5 * dpr;
      ctx.beginPath(); ctx.arc(x, y, 43, 0, Math.PI * 2); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(x, y, 43.5, 0, Math.PI * 2); ctx.fillStyle = chrome(ctx, x, y, 1.1 + s.lx * 0.4); ctx.fill();
      ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 42.4, 0, Math.PI * 2); ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.stroke();
      // Long shadow of the switch across washer and box.
      ctx.save(); ctx.shadowColor = "rgba(30,0,0,0.5)"; ctx.shadowBlur = 9 * dpr; ctx.shadowOffsetX = (4 + top * 0.3) * dpr; ctx.shadowOffsetY = (8 + top * 0.55) * dpr;
      ctx.beginPath(); ctx.arc(x, y - 3, 30, 0, Math.PI * 2); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      // Hex nut: the three sides that face us, then the top with its chamfer.
      const HEXR = 36, NH = 8, pt = (i: number, lift: number): [number, number] => [x + Math.cos((i / 6) * Math.PI * 2 + 0.26) * HEXR, y + Math.sin((i / 6) * Math.PI * 2 + 0.26) * HEXR - lift];
      for (let i = 0; i < 6; i++) {
        const a = pt(i, 0), b = pt(i + 1, 0), nx = (a[0] + b[0]) / 2 - x, ny = (a[1] + b[1]) / 2 - y;
        if (ny < 2) continue;
        const a2 = pt(i, NH), b2 = pt(i + 1, NH);
        const g = ctx.createLinearGradient(a[0], 0, b[0], 0), tone = 0.5 + 0.5 * (-nx / HEXR);
        g.addColorStop(0, `rgb(${(70 + tone * 150) | 0},${(76 + tone * 150) | 0},${(82 + tone * 150) | 0})`); g.addColorStop(0.5, `rgb(${(160 + tone * 90) | 0},${(120 + tone * 110) | 0},${(112 + tone * 110) | 0})`); g.addColorStop(1, `rgb(${(50 + tone * 120) | 0},${(54 + tone * 120) | 0},${(60 + tone * 120) | 0})`);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(b2[0], b2[1]); ctx.lineTo(a2[0], a2[1]); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = 0.5; ctx.strokeStyle = "rgba(0,0,0,0.45)"; ctx.stroke();
      }
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const p = pt(i, NH); ctx.lineTo(p[0], p[1]); } ctx.closePath();
      ctx.fillStyle = chrome(ctx, x, y - NH, 2.6 + s.lx * 0.5); ctx.fill(); ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y - NH, 30.4, 0, Math.PI * 2); ctx.fillStyle = chrome(ctx, x, y - NH, 0.2 + s.lx * 0.5); ctx.fill();
      ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.stroke();
      // Threaded bush, then the plunger rising out of it.
      const tube = (r: number, from: number, to: number, threads: boolean) => {
        ctx.beginPath(); ctx.arc(x, y - from, r, 0, Math.PI); ctx.lineTo(x - r, y - to); ctx.arc(x, y - to, r, Math.PI, 0, true); ctx.closePath();
        ctx.fillStyle = barrel(x, r); ctx.fill(); ctx.lineWidth = 0.5; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.stroke();
        if (threads) for (let h = from + 1.2; h < to; h += 1.7) { ctx.beginPath(); ctx.arc(x, y - h, r, 0.06, Math.PI - 0.06); ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(0,0,0,0.42)"; ctx.stroke(); }
      };
      ctx.beginPath(); ctx.arc(x + 1.5, y - NH + 2.5, 24, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,0,0,0.42)"; ctx.fill();
      tube(22.5, NH, 14, true);
      ctx.beginPath(); ctx.arc(x, y - 14, 22.5, 0, Math.PI * 2); ctx.fillStyle = chrome(ctx, x, y - 14, 1.7); ctx.fill(); ctx.lineWidth = 0.5; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 1, y - 12.5, 19.6, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fill();
      tube(18.6, 14, top, false);
      // Domed cap: a convex mirror. The room is in the middle, the horizon is a dark ring, the red box wraps the rim.
      const cy = y - top, CR = 18.6;
      ctx.save(); ctx.beginPath(); ctx.arc(x, cy, CR, 0, Math.PI * 2); ctx.clip();
      const dome = ctx.createRadialGradient(x + s.lx * 6, cy + s.ly * 6, 0, x, cy, CR);
      dome.addColorStop(0, "#ffffff"); dome.addColorStop(0.3, "#e3e9ed"); dome.addColorStop(0.5, "#aeb8bf"); dome.addColorStop(0.64, "#59616a"); dome.addColorStop(0.73, "#1c1f23"); dome.addColorStop(0.8, box(0.5)); dome.addColorStop(0.9, box(1.08)); dome.addColorStop(0.97, "#f0c9bd"); dome.addColorStop(1, "#40201a");
      ctx.fillStyle = dome; ctx.fillRect(x - CR, cy - CR, CR * 2, CR * 2);
      // The lamp shows up in the cap as a small warm smear near the top edge.
      if (L > 0.02) { const g = ctx.createRadialGradient(x, cy - CR * 0.78, 0, x, cy - CR * 0.78, 7); g.addColorStop(0, `rgba(${lr},${lg},${lb},${0.95 * L})`); g.addColorStop(1, `rgba(${lr},${lg},${lb},0)`); ctx.save(); ctx.translate(x, cy - CR * 0.78); ctx.scale(1.6, 0.5); ctx.translate(-x, -(cy - CR * 0.78)); ctx.fillStyle = g; ctx.fillRect(x - 8, cy - CR * 0.78 - 8, 16, 16); ctx.restore(); }
      // A window, bent by the dome.
      ctx.translate(x + s.lx * 8.5, cy + s.ly * 8.5); ctx.rotate(Math.atan2(s.ly, s.lx) + Math.PI / 2);
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.beginPath(); ctx.ellipse(-2.7, 0, 2.3, 3.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(2.7, 0, 2.3, 3.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.beginPath(); ctx.arc(x, cy, CR, 0, Math.PI * 2); ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.stroke();
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, t0 = 0, nextDemo = 1.05;
    const flip = (v: boolean) => { onRef.current = v; setOn(v); };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      if (now - touched > 5000 && !s.held) {
        s.lx += (-0.42 + 0.3 * Math.sin(t * 0.9) - s.lx) * Math.min(1, dt * 3); s.ly += (-0.5 + 0.12 * Math.cos(t * 0.7) - s.ly) * Math.min(1, dt * 3);
        if (t > nextDemo) { s.pulse = 0.17; flip(!onRef.current); nextDemo = t + 1.3; }
      }
      if (s.pulse > 0) s.pulse -= dt;
      // Going down the spring is stiff and dead; coming back it is lighter and overshoots once.
      const down = s.held || s.pulse > 0, k = down ? 1500 : 620, c = down ? 62 : 17;
      s.v += (k * ((down ? 1 : 0) - s.x) - c * s.v) * dt; s.x += s.v * dt;
      const want = onRef.current ? 1 : 0;
      s.lamp += (want - s.lamp) * Math.min(1, dt * (want ? 24 : 9)); // a filament: quick to light, slower to fade
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const settle = () => { s.x = s.held ? 1 : 0; s.v = 0; s.lamp = onRef.current ? 1 : 0; draw(); };

    api.current = {
      press: (down) => { touched = performance.now(); s.held = down; if (reduce) settle(); else wake(); },
      set: (v, pulse) => { touched = performance.now(); onRef.current = v; if (pulse) s.pulse = 0.14; if (reduce) settle(); else wake(); },
    };
    if (reduce) settle(); else wake();

    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect(), px = (e.clientX - b.left) / b.width - 0.5, py = (e.clientY - b.top) / b.height - 0.62;
      const len = Math.max(0.35, Math.hypot(px, py));
      touched = Math.max(touched, performance.now() - 3600);
      s.lx += ((px / len) * 0.62 - s.lx) * 0.18; s.ly += ((py / len) * 0.62 - s.ly) * 0.18;
      if (reduce) draw();
    };
    window.addEventListener("pointermove", onMove);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; window.removeEventListener("pointermove", onMove); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const held = useRef(false);
  const toggle = () => { const next = !on; setOn(next); api.current?.set(next, !held.current); };

  return (
    <div className="flex min-h-[640px] w-full flex-col items-center justify-center bg-[#d3d9df] bg-[radial-gradient(95%_70%_at_50%_36%,#e9edf1_0%,#d3d9df_72%)] px-4 py-10 sm:min-h-[740px]">
      <div className="relative h-[470px] w-[320px] sm:my-8 sm:scale-[1.2]">
        <div aria-hidden="true" className="absolute left-[58px] right-[46px] top-[330px] h-[110px] rounded-[40%] bg-[#1c2836] opacity-50 blur-2xl" />
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={effect.name}
          onClick={toggle}
          onPointerDown={() => { held.current = true; api.current?.press(true); }}
          onPointerUp={() => { api.current?.press(false); window.setTimeout(() => { held.current = false; }, 0); }}
          onPointerLeave={() => { if (held.current) { held.current = false; api.current?.press(false); } }}
          onPointerCancel={() => { held.current = false; api.current?.press(false); }}
          className="absolute left-[106px] top-[226px] h-[108px] w-[108px] cursor-pointer touch-manipulation rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#d64428]"
        />
      </div>
      <p aria-live="polite" className="mt-2 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-slate-600 sm:mt-8">
        <span className="font-semibold text-slate-900">{effect.name}</span>
        <span className="mx-2 text-slate-400">/</span>
        {on ? effect.on : effect.off}
      </p>
    </div>
  );
}

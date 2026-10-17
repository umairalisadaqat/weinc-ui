import { useEffect, useRef, useState } from "react";

// The eight pans, left to right, top row first. `finish` decides how each one catches the lamp.
const pans: { name: string; hex: string; finish: "matte" | "shimmer" | "metallic" }[] = [
  { name: "Bone", hex: "#e6d3ba", finish: "matte" },
  { name: "Apricot Silk", hex: "#e0a077", finish: "shimmer" },
  { name: "Terracotta", hex: "#b4583a", finish: "matte" },
  { name: "Copper Coin", hex: "#b9683a", finish: "metallic" },
  { name: "Rosewood", hex: "#8e4649", finish: "matte" },
  { name: "Fig Jam", hex: "#63304a", finish: "shimmer" },
  { name: "Gilded Moss", hex: "#857a38", finish: "metallic" },
  { name: "Soot", hex: "#2e2523", finish: "matte" },
];
const product = { name: "Dusk palette", detail: "8 shades", price: "£42", card: "THE TRIO" };
const FIRST_TRIO = [1, 3, 7]; // the three shades already swiped when the page loads
const VW = 560, VH = 550; // drawing space; the canvas scales this to its width

type Ctx = CanvasRenderingContext2D;
type Mark = { pan: number; x: number; y: number; r: number; born: number; baked: boolean };
const SHINE = { matte: 0, shimmer: 0.6, metallic: 1 };
const centre = (i: number) => ({ x: 112 + 112 * (i % 4), y: 106 + 112 * Math.floor(i / 4) });

export default function EyeshadowPaletteTrioPicker() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [trio, setTrio] = useState(FIRST_TRIO);
  const api = useRef<{ press: (i: number, px?: number, py?: number) => void; smooth: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, box = stage.current;
    if (!cv || !box) return;
    const c = cv.getContext("2d");
    const still = document.createElement("canvas");
    const g = still.getContext("2d");
    if (!c || !g) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scale = 1, seed = 23;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const TAU = 6.2832, PR = 39.5;

    const tone = (hex: string, k: number, a = 1) => {
      const n = parseInt(hex.slice(1), 16), to = k > 0 ? 255 : 0, m = Math.min(1, Math.abs(k));
      const ch = (v: number) => Math.round(v + (to - v) * m);
      return `rgba(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)},${a})`;
    };
    const rr = (x: Ctx, l: number, t: number, w: number, h: number, r: number) => { x.beginPath(); x.roundRect(l, t, w, h, r); };

    const grain = document.createElement("canvas"); grain.width = grain.height = 128;
    const gx = grain.getContext("2d");
    if (gx) { const d = gx.createImageData(128, 128); for (let i = 0; i < d.data.length; i += 4) { const v = rnd(); d.data[i] = d.data[i + 1] = d.data[i + 2] = v > 0.5 ? 255 : 0; d.data[i + 3] = Math.abs(v - 0.5) * 110; } gx.putImageData(d, 0, 0); }

    const s = { trio: [...FIRST_TRIO], prog: [1, 1, 1], turn: 0, lx: 150, ly: 60, lxTo: 150, lyTo: 60 };
    let marks: Mark[] = FIRST_TRIO.map((p, i) => ({ pan: p, x: [-9, 8, -4][i], y: [6, -5, 9][i], r: [-0.35, 0.2, -0.15][i], born: -1e9, baked: true }));
    let dust: { x: number; y: number; vx: number; vy: number; life: number; hex: string; r: number }[] = [];
    const flecks = pans.map((p) => Array.from({ length: Math.round(90 * SHINE[p.finish]) }, () => { const a = rnd() * TAU, r = Math.sqrt(rnd()) * (PR - 5); return { x: Math.cos(a) * r, y: Math.sin(a) * r, ph: rnd() * TAU, sz: 0.3 + rnd() * 0.6 }; }));
    const strands = Array.from({ length: 30 }, (_, j) => { const o = (j / 29) * 2 - 1, body = 1 - Math.pow(Math.abs(o), 1.8); return { o, end: Math.min(1, 0.5 + 0.5 * body * (0.75 + 0.25 * rnd())), k: (rnd() - 0.5) * 0.2, w: 0.8 + rnd() * 0.8, skip: rnd() }; });

    const fingerprint = (x: Ctx, m: Mark, alpha: number) => {
      const p = pans[m.pan], q = centre(m.pan), lift = p.finish === "matte" ? -0.16 : 0.14;
      x.save(); x.translate(q.x + m.x, q.y + m.y); x.rotate(m.r); x.globalAlpha = alpha;
      const b = x.createRadialGradient(0, 0, 2, 0, 0, 20); b.addColorStop(0, tone(p.hex, lift * 1.2, 0.9)); b.addColorStop(0.72, tone(p.hex, lift, 0.8)); b.addColorStop(1, tone(p.hex, lift, 0));
      x.fillStyle = b; x.beginPath(); x.ellipse(0, 0, 15.5, 19.5, 0, 0, TAU); x.fill();
      // a dent: dark under the upper lip, pale where the lower lip catches the lamp
      x.lineCap = "round"; x.lineWidth = 2.6; x.strokeStyle = tone(p.hex, -0.5, 0.3); x.beginPath(); x.ellipse(0.8, 1, 13.5, 17.5, 0, Math.PI * 0.86, Math.PI * 1.7); x.stroke();
      x.lineWidth = 1.5; x.strokeStyle = tone(p.hex, 0.5, 0.3); x.beginPath(); x.ellipse(-0.4, -0.6, 14.2, 18.2, 0, -0.2, Math.PI * 0.66); x.stroke();
      x.lineWidth = 0.55; x.strokeStyle = tone(p.hex, lift > 0 ? -0.4 : 0.5, 0.2);
      for (let k = 1; k <= 5; k++) { x.beginPath(); x.ellipse(0, 4, 2.3 * k, 3.1 * k, 0, Math.PI * 1.08, Math.PI * 1.92); x.stroke(); }
      // crumbs pushed out at the lower edge
      for (let k = 0; k < 6; k++) { const a = 0.2 + k * 0.3 + Math.sin(k * 7.3 + m.x) * 0.22, d = 1.1 + Math.abs(Math.sin(k * 3.7 + m.y)) * 0.34; x.fillStyle = tone(p.hex, 0.25, 0.75); x.beginPath(); x.arc(Math.cos(a) * 15.5 * d, Math.sin(a) * 19.5 * d, 0.4 + Math.abs(Math.sin(k * 5.1)) * 0.9, 0, TAU); x.fill(); }
      x.restore();
    };

    const CARD = { x: 280, y: 436, rot: -0.035, w: 436, h: 176 };
    const slotX = (i: number) => -140 + 140 * i;
    const swipe = (x: Ctx, slot: number, p: number) => {
      if (p <= 0.001) return;
      const sh = pans[s.trio[slot]], base = 54 / 30;
      const at = (u: number, o: number): [number, number] => { const env = Math.min(1, Math.sqrt(u / 0.12)) * (1 - 0.18 * u); return [u * 130, o * 27 * env - Math.sin(u * Math.PI) * 8]; };
      const run = (st: (typeof strands)[number], to: number) => { if (to <= 0) return false; x.beginPath(); for (let i = 0; i <= 12; i++) { const [px, py] = at((to * i) / 12, st.o); if (i) x.lineTo(px, py); else x.moveTo(px, py); } return true; };
      x.save(); x.translate(CARD.x, CARD.y); x.rotate(CARD.rot); x.translate(slotX(slot) - 36, 44); x.rotate(-1.0); x.lineCap = "round"; x.lineJoin = "round";
      x.strokeStyle = tone(sh.hex, -0.2, 0.09); x.lineWidth = base * 5.5; for (const st of strands) if (run(st, Math.min(p, st.end))) x.stroke();
      for (const st of strands) { x.strokeStyle = tone(sh.hex, st.k, 0.5 + st.skip * 0.42); x.lineWidth = base * 2.3 * st.w; if (run(st, Math.min(p, st.end))) x.stroke(); }
      if (SHINE[sh.finish] > 0) {
        x.globalCompositeOperation = "lighter";
        for (const st of strands) for (let k = 0; k < 4; k++) { const u = ((st.skip * 7 + k * 0.29) % 1) * st.end; if (u > p) continue; const [px, py] = at(u, st.o + Math.sin(k * 9 + st.skip * 20) * 0.06); x.fillStyle = `rgba(255,236,206,${0.22 * SHINE[sh.finish] + 0.1})`; x.beginPath(); x.arc(px, py, 0.3 + ((st.skip * 13 + k) % 1) * 0.5, 0, TAU); x.fill(); }
      }
      x.restore();
    };

    // everything that does not move is painted once into a second canvas
    const paintStill = () => {
      g.setTransform(scale, 0, 0, scale, 0, 0); g.clearRect(0, 0, VW, VH);
      // the case: champagne metal with a bevel, then a black flocked tray
      g.save(); g.shadowColor = "rgba(0,0,0,0.6)"; g.shadowBlur = 34 * scale; g.shadowOffsetX = 14 * scale; g.shadowOffsetY = 24 * scale; rr(g, 30, 24, 500, 276, 28); g.fillStyle = "#b99a72"; g.fill(); g.restore();
      const body = g.createLinearGradient(30, 24, 530, 300); body.addColorStop(0, "#fbf0db"); body.addColorStop(0.3, "#e2c9a2"); body.addColorStop(0.55, "#c4a57a"); body.addColorStop(0.8, "#e6cfa9"); body.addColorStop(1, "#8b7049");
      rr(g, 30, 24, 500, 276, 28); g.fillStyle = body; g.fill();
      g.save(); rr(g, 30, 24, 500, 276, 28); g.clip();
      for (let y = 24; y < 300; y += 1.4) { g.fillStyle = `rgba(${rnd() > 0.5 ? "255,255,255" : "60,40,10"},${rnd() * 0.07})`; g.fillRect(30, y, 500, 0.7); }
      g.restore();
      g.lineWidth = 1.4; const edge = g.createLinearGradient(30, 24, 530, 300); edge.addColorStop(0, "rgba(255,255,255,0.95)"); edge.addColorStop(0.5, "rgba(255,255,255,0.15)"); edge.addColorStop(1, "rgba(50,30,6,0.7)");
      rr(g, 31, 25, 498, 274, 27); g.strokeStyle = edge; g.stroke();
      rr(g, 42, 36, 476, 252, 18); g.fillStyle = "#120e0f"; g.fill();
      g.lineWidth = 1.6; const lip = g.createLinearGradient(42, 36, 518, 288); lip.addColorStop(0, "rgba(40,24,4,0.9)"); lip.addColorStop(0.6, "rgba(255,244,220,0.5)"); lip.addColorStop(1, "rgba(255,250,235,0.95)");
      rr(g, 41.5, 35.5, 477, 253, 18.5); g.strokeStyle = lip; g.stroke();
      g.save(); rr(g, 42, 36, 476, 252, 18); g.clip();
      const well = g.createLinearGradient(0, 36, 0, 70); well.addColorStop(0, "rgba(0,0,0,0.85)"); well.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = well; g.fillRect(42, 36, 476, 34);
      const well2 = g.createLinearGradient(42, 0, 70, 0); well2.addColorStop(0, "rgba(0,0,0,0.7)"); well2.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = well2; g.fillRect(42, 36, 28, 252);
      const pat0 = g.createPattern(grain, "repeat"); if (pat0) { g.globalAlpha = 0.16; g.fillStyle = pat0; g.fillRect(42, 36, 476, 252); g.globalAlpha = 1; }
      g.restore();
      pans.forEach((p, i) => {
        const q = centre(i);
        // tin rim
        g.fillStyle = "rgba(0,0,0,0.6)"; g.beginPath(); g.arc(q.x + 2, q.y + 3.5, 45.5, 0, TAU); g.fill();
        const tin = g.createConicGradient(-2.2, q.x, q.y);
        ["#ffffff", "#b9b6b0", "#77736c", "#c9c6c0", "#f4f2ee", "#8d8982", "#5f5b55", "#d6d3cd", "#ffffff"].forEach((col, k) => tin.addColorStop(k / 8, col));
        g.beginPath(); g.arc(q.x, q.y, 44, 0, TAU); g.fillStyle = tin; g.fill();
        g.beginPath(); g.arc(q.x, q.y, 40.6, 0, TAU); g.fillStyle = "#231d1a"; g.fill();
        // pressed powder
        g.save(); g.beginPath(); g.arc(q.x, q.y, PR, 0, TAU); g.clip();
        const pw = g.createRadialGradient(q.x - 14, q.y - 16, 4, q.x, q.y, PR * 1.1); pw.addColorStop(0, tone(p.hex, 0.14)); pw.addColorStop(0.6, p.hex); pw.addColorStop(1, tone(p.hex, -0.2));
        g.fillStyle = pw; g.fillRect(q.x - PR, q.y - PR, 2 * PR, 2 * PR);
        if (p.finish === "matte") { // the cloth weave left by the press
          g.lineWidth = 0.5;
          for (let d = -80; d <= 80; d += 3) { g.strokeStyle = tone(p.hex, -0.5, 0.2); g.beginPath(); g.moveTo(q.x + d - 40, q.y - 40); g.lineTo(q.x + d + 40, q.y + 40); g.stroke(); g.strokeStyle = tone(p.hex, 0.5, 0.17); g.beginPath(); g.moveTo(q.x + d + 40, q.y - 40); g.lineTo(q.x + d - 40, q.y + 40); g.stroke(); }
        } else {
          for (let k = 0; k < 260; k++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * PR; g.fillStyle = rnd() > 0.35 ? tone(p.hex, 0.55, 0.55) : tone(p.hex, -0.4, 0.4); g.fillRect(q.x + Math.cos(a) * r, q.y + Math.sin(a) * r, 0.9, 0.9); }
        }
        const pat = g.createPattern(grain, "repeat"); if (pat) { g.globalAlpha = p.finish === "matte" ? 0.3 : 0.2; g.fillStyle = pat; g.save(); g.scale(0.5, 0.5); g.fillRect((q.x - PR) * 2, (q.y - PR) * 2, 4 * PR, 4 * PR); g.restore(); g.globalAlpha = 1; }
        for (const m of marks) if (m.pan === i && m.baked) fingerprint(g, m, 1);
        // the rim's shadow lies on the powder at the upper left
        const inner = g.createRadialGradient(q.x + 5, q.y + 7, PR - 9, q.x + 1, q.y + 1.5, PR + 1); inner.addColorStop(0, "rgba(0,0,0,0)"); inner.addColorStop(1, "rgba(0,0,0,0.6)");
        g.fillStyle = inner; g.fillRect(q.x - PR, q.y - PR, 2 * PR, 2 * PR);
        g.restore();
        g.lineWidth = 1; g.strokeStyle = "rgba(255,255,255,0.85)"; g.beginPath(); g.arc(q.x, q.y, 42.6, Math.PI * 0.95, Math.PI * 1.7); g.stroke();
        g.strokeStyle = "rgba(255,255,255,0.45)"; g.beginPath(); g.arc(q.x, q.y, 40.4, 0.1, Math.PI * 0.6); g.stroke();
      });
      // the swatch card
      g.save(); g.translate(CARD.x, CARD.y); g.rotate(CARD.rot);
      g.save(); g.shadowColor = "rgba(0,0,0,0.55)"; g.shadowBlur = 26 * scale; g.shadowOffsetX = 10 * scale; g.shadowOffsetY = 18 * scale; rr(g, -CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 5); g.fillStyle = "#f3ece0"; g.fill(); g.restore();
      const paper = g.createLinearGradient(-CARD.w / 2, -CARD.h / 2, CARD.w / 2, CARD.h / 2); paper.addColorStop(0, "#fbf6ec"); paper.addColorStop(1, "#e6dccb");
      rr(g, -CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 5); g.fillStyle = paper; g.fill();
      const pat1 = g.createPattern(grain, "repeat"); if (pat1) { g.save(); rr(g, -CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 5); g.clip(); g.globalAlpha = 0.12; g.fillStyle = pat1; g.fillRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h); g.restore(); }
      g.fillStyle = "#4a4038"; g.textBaseline = "middle"; g.font = "600 7px ui-monospace,SFMono-Regular,Menlo,monospace";
      const spaced = (text: string, x0: number, y: number, gap: number, align: number) => { const w = [...text].reduce((t, ch) => t + g.measureText(ch).width + gap, -gap); let x = x0 - w * align; g.textAlign = "left"; for (const ch of text) { g.fillText(ch, x, y); x += g.measureText(ch).width + gap; } };
      spaced(product.card, -CARD.w / 2 + 16, -CARD.h / 2 + 16, 2.4, 0);
      g.fillStyle = "rgba(74,64,56,0.35)"; g.fillRect(-CARD.w / 2 + 16, CARD.h / 2 - 30, CARD.w - 32, 0.6);
      g.fillStyle = "#4a4038";
      s.trio.forEach((pi, k) => spaced(`0${k + 1}  ${pans[pi].name.toUpperCase()}`, slotX(k), CARD.h / 2 - 17, 1.5, 0.5));
      g.restore();
      s.trio.forEach((_, k) => { if (s.prog[k] >= 1) swipe(g, k, 1); });
    };

    const draw = () => {
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.drawImage(still, 0, 0);
      c.setTransform(scale, 0, 0, scale, 0, 0);
      const now = performance.now();
      for (const m of marks) if (!m.baked) fingerprint(c, m, Math.min(1, (now - m.born) / 220));
      s.trio.forEach((_, k) => { if (s.prog[k] < 1) swipe(c, k, s.prog[k]); });
      // the lamp: a soft bloom on every pan, a hard one on the metallics, and flecks that flash in turn
      c.globalCompositeOperation = "lighter";
      pans.forEach((p, i) => {
        const q = centre(i), sh = SHINE[p.finish], dx = s.lx - q.x, dy = s.ly - q.y, d = Math.hypot(dx, dy) || 1, k = Math.min(26, d * 0.2);
        c.save(); c.beginPath(); c.arc(q.x, q.y, PR, 0, TAU); c.clip();
        const hx = q.x + (dx / d) * k, hy = q.y + (dy / d) * k, bloom = c.createRadialGradient(hx, hy, 0, hx, hy, 34 + sh * 10);
        bloom.addColorStop(0, `rgba(255,240,214,${0.07 + sh * 0.42})`); bloom.addColorStop(0.5, `rgba(255,232,200,${0.03 + sh * 0.14})`); bloom.addColorStop(1, "rgba(255,232,200,0)");
        c.fillStyle = bloom; c.fillRect(q.x - PR, q.y - PR, 2 * PR, 2 * PR);
        for (const f of flecks[i]) { const v = Math.pow(Math.max(0, Math.cos(f.ph + s.lx * 0.03 + s.ly * 0.045 + f.x * 0.05)), 14); if (v < 0.04) continue; c.fillStyle = `rgba(255,248,230,${v})`; c.beginPath(); c.arc(q.x + f.x, q.y + f.y, f.sz * (0.55 + v * 0.8), 0, TAU); c.fill(); }
        c.restore();
      });
      c.globalCompositeOperation = "source-over";
      for (const p of dust) { c.fillStyle = tone(p.hex, 0.25, Math.min(1, p.life * 1.6)); c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); }
    };
    const fit = () => {
      const w = cv.clientWidth; if (!w) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = still.width = Math.round(w * dpr); cv.height = still.height = Math.round(((w * VH) / VW) * dpr); scale = cv.width / VW; paintStill(); draw();
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, nextDemo = 4600, step = 0;
    const tour = [4, 0, 5, 2, 6, 1, 3, 7];
    const press = (i: number, px = (rnd() - 0.5) * 30, py = (rnd() - 0.5) * 30) => {
      const lim = Math.hypot(px, py), max = PR - 21, kx = lim > max ? max / lim : 1, now = performance.now();
      marks = [...marks.filter((m) => m.pan !== i).concat(marks.filter((m) => m.pan === i).slice(-2)), { pan: i, x: px * kx, y: py * kx, r: (rnd() - 0.5) * 0.9, born: now, baked: reduce }];
      const q = centre(i);
      if (!reduce) for (let k = 0; k < 16; k++) { const a = rnd() * TAU, v = 20 + rnd() * 70; dust = [...dust, { x: q.x + px * kx + Math.cos(a) * 12, y: q.y + py * kx + Math.sin(a) * 15, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 14, life: 0.5 + rnd() * 0.5, hex: pans[i].hex, r: 0.6 + rnd() * 1.3 }]; }
      let slot = s.trio.indexOf(i);
      if (slot < 0) { slot = s.turn; s.turn = (s.turn + 1) % 3; s.trio = s.trio.map((v, k) => (k === slot ? i : v)); setTrio(s.trio); }
      s.prog = s.prog.map((v, k) => (k === slot ? (reduce ? 1 : 0) : v));
      paintStill(); if (reduce) draw();
    };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      let repaint = false;
      for (const m of marks) if (!m.baked && now - m.born > 240) { m.baked = true; repaint = true; }
      s.prog = s.prog.map((v) => { if (v >= 1) return 1; const n = Math.min(1, v + dt / 0.55); if (n >= 1) repaint = true; return n; });
      if (repaint) paintStill();
      dust = dust.map((p) => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, vx: p.vx * (1 - 3.2 * dt), vy: p.vy * (1 - 3.2 * dt) + 30 * dt, life: p.life - dt })).filter((p) => p.life > 0);
      if (now - touched > 7000) {
        s.lxTo = 280 + Math.cos(t / 1300) * 230; s.lyTo = 160 + Math.sin(t / 1300) * 120;
        if (t > nextDemo) { press(tour[step % tour.length]); step++; nextDemo = t + 2700; }
      }
      s.lx += (s.lxTo - s.lx) * Math.min(1, dt * 6); s.ly += (s.lyTo - s.ly) * Math.min(1, dt * 6);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    api.current = {
      press: (i, px, py) => {
        touched = performance.now();
        if (px === undefined || py === undefined) press(i);
        else { const b = cv.getBoundingClientRect(), q = centre(i); press(i, ((px - b.left) / b.width) * VW - q.x, ((py - b.top) / b.height) * VH - q.y); }
        wake();
      },
      smooth: () => { touched = performance.now(); marks = []; paintStill(); if (reduce) draw(); else wake(); },
    };
    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect();
      s.lxTo = ((e.clientX - b.left) / b.width) * VW; s.lyTo = ((e.clientY - b.top) / b.height) * VH; touched = Math.max(touched, performance.now() - 3500);
      if (reduce) { s.lx = s.lxTo; s.ly = s.lyTo; draw(); }
    };
    box.addEventListener("pointermove", onMove);
    const ro = new ResizeObserver(fit); ro.observe(cv);
    const io = new IntersectionObserver(([en]) => { seen = en.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    fit(); wake();
    return () => {
      cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect();
      box.removeEventListener("pointermove", onMove); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <section className="relative flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[#10141f] bg-[radial-gradient(66%_60%_at_46%_40%,#33405f_0%,#1a2033_48%,#0b0e16_90%)] px-4 pb-6 pt-6 sm:min-h-[740px] sm:pb-10">
      <div ref={stage} className="relative w-full max-w-[680px]">
        <canvas ref={canvas} aria-hidden="true" className="block w-full" style={{ aspectRatio: `${VW} / ${VH}` }} />
        <div role="group" aria-label="Eyeshadow shades: press three">
          {pans.map((p, i) => {
            const q = centre(i);
            return (
              <button
                key={p.name}
                type="button"
                aria-label={`${p.name}, ${p.finish}`}
                aria-pressed={trio.includes(i)}
                onClick={(e) => (e.detail === 0 ? api.current?.press(i) : api.current?.press(i, e.clientX, e.clientY))}
                className="absolute cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#120e0f]"
                style={{ left: `${((q.x - 46) / VW) * 100}%`, top: `${((q.y - 46) / VH) * 100}%`, width: `${(92 / VW) * 100}%`, height: `${(92 / VH) * 100}%` }}
              />
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex w-full max-w-[680px] flex-col gap-4 sm:absolute sm:inset-x-8 sm:bottom-8 sm:mt-0 sm:w-auto sm:max-w-none sm:flex-row sm:items-end sm:justify-between">
        <p className="text-[#aeb7cf]">
          <span aria-live="polite" className="block font-serif text-[19px] italic leading-tight text-[#f6f1e7]">{trio.map((i) => pans[i].name).join(", ")}</span>
          <span className="mt-1 block font-mono text-[10.5px] uppercase leading-relaxed tracking-[0.18em]">
            {product.name} <span className="mx-1 text-[#6f7996]">/</span> {product.detail} <span className="mx-1 text-[#6f7996]">/</span> <span className="text-[#f6f1e7]">{product.price}</span>
          </span>
        </p>
        <button type="button" onClick={() => api.current?.smooth()} className="h-10 self-start rounded-full border border-[#aeb7cf]/50 px-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#f6f1e7] outline-none transition-colors duration-200 hover:border-white hover:bg-white hover:text-[#10141f] focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none sm:self-auto">
          Smooth the pans
        </button>
      </div>
    </section>
  );
}

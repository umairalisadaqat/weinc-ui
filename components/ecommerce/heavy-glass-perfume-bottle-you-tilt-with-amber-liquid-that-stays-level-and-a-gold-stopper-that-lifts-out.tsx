import { useEffect, useRef, useState } from "react";

// The scent on show. The first two lines are printed on the glass.
const scent = {
  name: "Tamarind Smoke",
  kind: "EAU DE PARFUM",
  size: "50 ml",
  price: "£128",
  notes: "Bergamot peel, tamarind, cedar, smoked amber",
};
const FILL = 0.64; // how full the bottle is, 0 to 1
const LIFT = 108; // how far the stopper rises, in drawing units
const VW = 420, VH = 560; // drawing space; the canvas scales this to its width

export default function HeavyGlassPerfumeBottle() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const [lifted, setLifted] = useState(false);
  const liftedRef = useRef(false);
  const api = useRef<{ lift: () => void; nudge: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, pad = hit.current;
    if (!cv || !pad) return;
    const ctx = cv.getContext("2d");
    const off = document.createElement("canvas");
    const g = off.getContext("2d");
    if (!ctx || !g) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scale = 1;

    const CX = VW / 2, FLOOR = 466;
    const BW = 196, BH = 236, WALL = 14, BASE = 34, NECK_W = 44, NECK_H = 24, COLLAR_W = 60, COLLAR_H = 15, CAP_W = 74, CAP_H = 66;
    const cav = { x0: -BW / 2 + WALL, x1: BW / 2 - WALL, top: -BH + 20, bot: -BASE };
    const surf0 = cav.bot - (cav.bot - cav.top) * FILL;

    // a is the lean of the bottle, phi the lean of the liquid surface, both measured against the table
    const s = { a: reduce ? 0 : 0.2, av: 0, hold: reduce ? 0 : 0.2, held: !reduce, phi: 0, pv: 0, rip: 0, lift: 0, lv: 0, lx: -0.3, lxTo: -0.3, drag: false, t: 0 };

    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rt: number, rb: number) => {
      c.beginPath(); c.moveTo(x + rt, y); c.lineTo(x + w - rt, y); c.quadraticCurveTo(x + w, y, x + w, y + rt);
      c.lineTo(x + w, y + h - rb); c.quadraticCurveTo(x + w, y + h, x + w - rb, y + h); c.lineTo(x + rb, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - rb); c.lineTo(x, y + rt); c.quadraticCurveTo(x, y, x + rt, y); c.closePath();
    };
    const hgrad = (c: CanvasRenderingContext2D, x0: number, x1: number, stops: [number, string][]) => { const gr = c.createLinearGradient(x0, 0, x1, 0); for (const [o, col] of stops) gr.addColorStop(Math.max(0, Math.min(1, o)), col); return gr; };
    const vgrad = (c: CanvasRenderingContext2D, y0: number, y1: number, stops: [number, string][]) => { const gr = c.createLinearGradient(0, y0, 0, y1); for (const [o, col] of stops) gr.addColorStop(o, col); return gr; };

    const bottle = (c: CanvasRenderingContext2D) => {
      const hl = 0.5 + s.lx * 0.22; // where the lamp sits across the glass, 0 to 1
      const pivot = s.a >= 0 ? BW / 2 - 8 : -(BW / 2 - 8);
      c.save(); c.translate(CX + pivot, FLOOR); c.rotate(s.a); c.translate(-pivot, 0);

      // the block of glass, dark where you look through it at the room
      rr(c, -BW / 2, -BH, BW, BH, 30, 16);
      c.fillStyle = hgrad(c, -BW / 2, BW / 2, [[0, "rgba(96,74,52,0.55)"], [0.06, "rgba(30,21,14,0.62)"], [0.5, "rgba(16,11,7,0.5)"], [0.94, "rgba(30,21,14,0.62)"], [1, "rgba(80,60,42,0.55)"]]);
      c.fill();

      // the thick foot gathers the colour of the scent and throws it back as bright bands
      c.save(); rr(c, -BW / 2, -BH, BW, BH, 30, 16); c.clip();
      c.fillStyle = vgrad(c, -BASE, 0, [[0, "rgba(70,26,4,0.9)"], [0.2, "rgba(190,96,16,0.85)"], [0.34, "rgba(255,196,96,0.95)"], [0.44, "rgba(150,66,8,0.85)"], [0.7, "rgba(60,22,4,0.9)"], [0.86, "rgba(214,128,34,0.8)"], [1, "rgba(40,16,4,0.95)"]]);
      c.fillRect(-BW / 2, -BASE + 3, BW, BASE);
      c.fillStyle = hgrad(c, -BW / 2, BW / 2, [[0, "rgba(10,6,3,0.75)"], [0.12, "rgba(10,6,3,0)"], [hl - 0.12, "rgba(255,230,170,0)"], [hl, "rgba(255,230,170,0.55)"], [hl + 0.12, "rgba(255,230,170,0)"], [0.88, "rgba(10,6,3,0)"], [1, "rgba(10,6,3,0.75)"]]);
      c.fillRect(-BW / 2, -BASE + 3, BW, BASE);
      c.restore();

      // the scent, with a surface that stays level while the glass leans
      c.save(); rr(c, cav.x0, cav.top, cav.x1 - cav.x0, cav.bot - cav.top, 18, 12); c.clip();
      const slope = Math.max(-1.3, Math.min(1.3, Math.tan(s.a - s.phi)));
      const yAt = (x: number) => surf0 - slope * x + Math.sin(x * 0.05 + s.t * 8) * s.rip + Math.sin(x * 0.11 - s.t * 11) * s.rip * 0.35;
      const line = () => { for (let i = 0; i <= 28; i++) { const x = cav.x0 + ((cav.x1 - cav.x0) * i) / 28; if (i) c.lineTo(x, yAt(x)); else c.moveTo(x, yAt(x)); } };
      c.beginPath(); line(); c.lineTo(cav.x1, cav.bot + 2); c.lineTo(cav.x0, cav.bot + 2); c.closePath();
      c.fillStyle = hgrad(c, cav.x0, cav.x1, [[0, "#2c0e02"], [0.07, "#7a3206"], [0.22, "#c06a12"], [hl - 0.16, "#dc8420"], [hl, "#f6a843"], [hl + 0.16, "#dc8420"], [0.8, "#b55e0e"], [0.93, "#6e2a05"], [1, "#2a0c02"]]);
      c.fill();
      c.save(); c.clip();
      const glow = c.createRadialGradient(0, cav.bot - 50, 4, 0, cav.bot - 50, 120);
      glow.addColorStop(0, "rgba(255,190,90,0.5)"); glow.addColorStop(1, "rgba(255,160,60,0)");
      c.globalCompositeOperation = "lighter"; c.fillStyle = glow; c.fillRect(cav.x0, cav.top, cav.x1 - cav.x0, cav.bot - cav.top);
      c.globalCompositeOperation = "source-over";
      c.fillStyle = vgrad(c, surf0 - 60, cav.bot, [[0, "rgba(40,12,0,0)"], [0.75, "rgba(40,12,0,0.12)"], [1, "rgba(30,8,0,0.6)"]]);
      c.fillRect(cav.x0, cav.top, cav.x1 - cav.x0, cav.bot - cav.top);
      c.restore();
      // the skin of the liquid: a pale band seen from just above, and the bright line where it meets the glass
      c.beginPath(); line(); c.lineWidth = 9; c.strokeStyle = "rgba(255,206,120,0.3)"; c.stroke();
      c.beginPath(); line(); c.lineWidth = 2; c.strokeStyle = "rgba(255,238,196,0.95)"; c.stroke();
      c.restore();

      // the dip rod under the stopper, bent a little where it enters the liquid
      const rise = s.lift * LIFT, rodTop = -BH - NECK_H - COLLAR_H - rise, rodEnd = rodTop + 158;
      c.save();
      const wet = Math.min(rodEnd, Math.max(rodTop, yAt(0)));
      c.fillStyle = hgrad(c, -3.5, 3.5, [[0, "rgba(255,255,255,0.75)"], [0.3, "rgba(255,255,255,0.14)"], [0.7, "rgba(255,255,255,0.1)"], [1, "rgba(255,255,255,0.5)"]]);
      c.fillRect(-3.5, rodTop, 7, wet - rodTop);
      if (rodEnd > wet) { c.fillStyle = hgrad(c, -2, 8, [[0, "rgba(255,226,160,0.75)"], [0.35, "rgba(110,46,6,0.5)"], [1, "rgba(255,214,140,0.6)"]]); rr(c, -2, wet, 10, rodEnd - wet, 0, 4); c.fill(); }
      else { c.fillStyle = "rgba(240,150,40,0.9)"; c.beginPath(); c.ellipse(0, rodEnd + 1, 3.6, 4.6, 0, 0, 6.3); c.fill(); c.fillStyle = "rgba(255,240,200,0.9)"; c.beginPath(); c.arc(-1, rodEnd, 1, 0, 6.3); c.fill(); }
      c.restore();

      // inside wall of the glass
      rr(c, cav.x0, cav.top, cav.x1 - cav.x0, cav.bot - cav.top, 18, 12);
      c.lineWidth = 1.4; c.strokeStyle = hgrad(c, cav.x0, cav.x1, [[0, "rgba(255,236,200,0.75)"], [0.1, "rgba(255,236,200,0.12)"], [0.9, "rgba(255,236,200,0.1)"], [1, "rgba(255,236,200,0.6)"]]); c.stroke();

      // lettering fired onto the front
      c.textAlign = "center"; c.textBaseline = "middle";
      const type = (text: string, y: number, font: string, gap: number, col: string) => {
        c.font = font; const w = [...text].reduce((t, ch) => t + c.measureText(ch).width + gap, -gap); let x = -w / 2;
        for (const ch of text) { const cw = c.measureText(ch).width; c.fillStyle = "rgba(40,14,0,0.5)"; c.fillText(ch, x + cw / 2 + 0.6, y + 0.9); c.fillStyle = col; c.fillText(ch, x + cw / 2, y); x += cw + gap; }
      };
      const serif = `"Didot","Bodoni MT","Playfair Display",Georgia,"Times New Roman",serif`;
      type(scent.name.toUpperCase(), -106, `500 13px ${serif}`, 2.8, "rgba(255,246,226,0.96)");
      c.fillStyle = "rgba(255,246,226,0.7)"; c.fillRect(-16, -92.5, 32, 0.8);
      type(scent.kind, -80, `600 6.6px ui-monospace,SFMono-Regular,Menlo,monospace`, 2.6, "rgba(255,246,226,0.86)");
      type(scent.size.toUpperCase(), -BASE - 14, `600 6px ui-monospace,SFMono-Regular,Menlo,monospace`, 2.4, "rgba(255,246,226,0.62)");

      // what the lamp does to the outside: one hard streak, one soft pane, bright edges
      c.save(); rr(c, -BW / 2, -BH, BW, BH, 30, 16); c.clip();
      const sx = -BW / 2 + 9 + (s.lx + 1) * 5;
      c.fillStyle = vgrad(c, -BH, 0, [[0, "rgba(255,255,255,0)"], [0.1, "rgba(255,255,255,0.92)"], [0.6, "rgba(255,255,255,0.7)"], [0.92, "rgba(255,255,255,0)"]]);
      rr(c, sx, -BH + 16, 3.2, BH - 30, 1.6, 1.6); c.fill();
      c.fillStyle = hgrad(c, sx + 8, sx + 30, [[0, "rgba(255,255,255,0.2)"], [1, "rgba(255,255,255,0)"]]);
      c.fillRect(sx + 8, -BH + 26, 22, BH - 70);
      const px = BW * (hl - 0.5) * 1.5 + 34;
      c.beginPath(); c.moveTo(px, -BH + 12); c.lineTo(px + 34, -BH + 12); c.lineTo(px + 8, -BH + 150); c.lineTo(px - 22, -BH + 150); c.closePath();
      c.fillStyle = vgrad(c, -BH + 12, -BH + 150, [[0, "rgba(255,255,255,0.17)"], [1, "rgba(255,255,255,0)"]]); c.fill();
      c.fillStyle = hgrad(c, BW / 2 - 9, BW / 2, [[0, "rgba(255,220,170,0)"], [0.6, "rgba(255,220,170,0.42)"], [1, "rgba(255,220,170,0.1)"]]);
      c.fillRect(BW / 2 - 9, -BH + 24, 9, BH - 44);
      c.fillStyle = vgrad(c, -BH, -BH + 16, [[0, "rgba(255,255,255,0.75)"], [0.25, "rgba(255,255,255,0.22)"], [1, "rgba(255,255,255,0)"]]);
      c.fillRect(-BW / 2, -BH, BW, 16);
      c.restore();
      rr(c, -BW / 2, -BH, BW, BH, 30, 16);
      c.lineWidth = 1.3; c.strokeStyle = hgrad(c, -BW / 2, BW / 2, [[0, "rgba(255,246,230,0.9)"], [0.3, "rgba(255,246,230,0.3)"], [0.7, "rgba(255,246,230,0.22)"], [1, "rgba(255,230,196,0.75)"]]); c.stroke();

      // neck and its gold collar
      c.fillStyle = hgrad(c, -NECK_W / 2, NECK_W / 2, [[0, "rgba(255,246,230,0.6)"], [0.12, "rgba(60,44,30,0.6)"], [0.3, "rgba(255,255,255,0.3)"], [0.5, "rgba(24,16,10,0.55)"], [0.88, "rgba(60,44,30,0.6)"], [1, "rgba(255,236,206,0.5)"]]);
      c.fillRect(-NECK_W / 2, -BH - NECK_H, NECK_W, NECK_H + 1);
      const metal = (x0: number, x1: number): CanvasGradient => hgrad(c, x0, x1, [[0, "#2e1c04"], [0.06, "#8d6418"], [hl * 0.6 - 0.04, "#d9ae54"], [hl * 0.6 + 0.04, "#fff3c8"], [hl * 0.6 + 0.12, "#e0b860"], [0.58, "#a67820"], [0.76, "#5c3d0c"], [0.9, "#c79a3e"], [0.96, "#f1d88e"], [1, "#4a3008"]]);
      rr(c, -COLLAR_W / 2, -BH - NECK_H - COLLAR_H, COLLAR_W, COLLAR_H, 3, 3); c.fillStyle = metal(-COLLAR_W / 2, COLLAR_W / 2); c.fill();
      c.fillStyle = "rgba(40,24,2,0.5)"; c.fillRect(-COLLAR_W / 2 + 1, -BH - NECK_H - 5, COLLAR_W - 2, 1);
      c.fillStyle = "rgba(255,246,210,0.6)"; c.fillRect(-COLLAR_W / 2 + 1, -BH - NECK_H - COLLAR_H + 1, COLLAR_W - 2, 1);
      if (s.lift > 0.02) { c.fillStyle = "rgba(10,6,3,0.9)"; c.beginPath(); c.ellipse(0, -BH - NECK_H - COLLAR_H + 0.5, 11, 2.6, 0, 0, 6.3); c.fill(); }

      // the stopper: a turned gold cap, seen from a little above
      c.save(); c.translate(0, -BH - NECK_H - COLLAR_H - rise); c.rotate(s.lift * 0.05 * Math.sin(s.t * 1.7));
      if (s.lift > 0.02) { c.fillStyle = metal(-9, 9); c.fillRect(-9, -2, 18, 12 * Math.min(1, s.lift * 6)); }
      rr(c, -CAP_W / 2, -CAP_H - 1, CAP_W, CAP_H, 9, 3); c.fillStyle = metal(-CAP_W / 2, CAP_W / 2); c.fill();
      c.save(); rr(c, -CAP_W / 2, -CAP_H - 1, CAP_W, CAP_H, 9, 3); c.clip();
      c.fillStyle = vgrad(c, -CAP_H, 0, [[0, "rgba(255,250,224,0.7)"], [0.1, "rgba(255,250,224,0)"], [0.8, "rgba(30,16,0,0)"], [1, "rgba(30,16,0,0.55)"]]);
      c.fillRect(-CAP_W / 2, -CAP_H - 1, CAP_W, CAP_H);
      for (const y of [-CAP_H + 13, -12]) { c.fillStyle = "rgba(46,28,4,0.6)"; c.fillRect(-CAP_W / 2, y, CAP_W, 1.2); c.fillStyle = "rgba(255,246,206,0.55)"; c.fillRect(-CAP_W / 2, y + 1.2, CAP_W, 0.9); }
      c.restore();
      c.lineWidth = 0.8; c.strokeStyle = "rgba(255,240,200,0.5)"; rr(c, -CAP_W / 2, -CAP_H - 1, CAP_W, CAP_H, 9, 3); c.stroke();
      c.restore();
      c.restore();
    };

    const draw = () => {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, VW, VH);
      g.setTransform(scale, 0, 0, scale, 0, 0);
      g.clearRect(0, 0, VW, VH);
      bottle(g);

      // light that has passed through the scent pools on the table
      const cx = CX - s.lx * 16 + Math.sin(s.a) * 30;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      ctx.translate(cx, FLOOR + 12); ctx.scale(1, 0.16);
      const pool = ctx.createRadialGradient(0, 0, 6, 0, 0, 185);
      pool.addColorStop(0, "rgba(255,170,60,0.62)"); pool.addColorStop(0.35, "rgba(214,110,20,0.26)"); pool.addColorStop(1, "rgba(160,70,10,0)");
      ctx.fillStyle = pool; ctx.beginPath(); ctx.arc(0, 0, 185, 0, 6.3); ctx.fill();
      ctx.restore();
      // one bright crescent inside the pool, where the foot focuses the lamp
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.translate(cx - s.phi * 90, FLOOR + 9); ctx.scale(1, 0.13);
      const hot = ctx.createRadialGradient(0, 0, 0, 0, 0, 74);
      hot.addColorStop(0, "rgba(255,214,130,0.75)"); hot.addColorStop(0.4, "rgba(255,170,70,0.28)"); hot.addColorStop(1, "rgba(255,150,40,0)");
      ctx.fillStyle = hot; ctx.beginPath(); ctx.arc(0, 0, 74, 0, 6.3); ctx.fill(); ctx.restore();

      // the table is polished black stone, so the bottle stands on its own reflection
      ctx.save(); ctx.globalAlpha = 0.34;
      ctx.setTransform(1, 0, 0, -1, 0, 2 * FLOOR * scale + 2 * scale); ctx.drawImage(off, 0, 0);
      ctx.restore(); ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.save(); ctx.globalCompositeOperation = "destination-out";
      const cutout = ctx.createLinearGradient(0, FLOOR, 0, FLOOR + 110);
      cutout.addColorStop(0, "rgba(0,0,0,0)"); cutout.addColorStop(1, "rgba(0,0,0,1)");
      ctx.fillStyle = cutout; ctx.fillRect(0, FLOOR, VW, VH - FLOOR); ctx.restore();
      // where glass meets stone
      ctx.save(); ctx.translate(CX + Math.sin(s.a) * 150, FLOOR + 1); ctx.scale(1 - Math.min(0.6, Math.abs(s.a) * 2.2), 0.07);
      const con = ctx.createRadialGradient(0, 0, 10, 0, 0, 120);
      con.addColorStop(0, "rgba(0,0,0,0.85)"); con.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = con; ctx.beginPath(); ctx.arc(0, 0, 120, 0, 6.3); ctx.fill(); ctx.restore();

      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(off, 0, 0);
    };

    const fit = () => {
      const w = cv.clientWidth; if (!w) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = off.width = Math.round(w * dpr); cv.height = off.height = Math.round(((w * VH) / VW) * dpr); scale = cv.width / VW; draw();
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, step = 0, nextDemo = 3300, dragX = 0, dragA = 0, moved = 0, onCap = false;
    const setLift = (v: boolean) => { if (liftedRef.current !== v) { liftedRef.current = v; setLifted(v); } };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0; s.t = t / 1000;
      const before = s.a;
      if (s.drag || s.held) { const to = s.hold; s.av = (to - s.a) * 14; s.a += (to - s.a) * Math.min(1, dt * 14); }
      else {
        // let go, the bottle falls back onto its foot and rocks from corner to corner until it settles
        s.av += -Math.sign(s.a) * 13 * Math.cos(Math.min(1.2, Math.abs(s.a) * 2)) * dt;
        const next = s.a + s.av * dt;
        if (next * s.a < 0 || next === 0) { s.av *= -0.42; s.rip = Math.min(2, s.rip + Math.abs(s.av) * 1.6); s.a = Math.abs(s.av) < 0.08 ? 0 : s.av * dt; if (Math.abs(s.av) < 0.08) s.av = 0; }
        else s.a = next;
      }
      // the liquid is dragged round with the glass, then swings back to level
      s.pv += (s.a - before) * 7 + (-74 * s.phi - 4.2 * s.pv) * dt; s.phi += s.pv * dt;
      s.rip = Math.max(0, s.rip - dt * 1.9) + Math.abs(s.pv) * dt * 3;
      s.rip = Math.min(2, s.rip);
      const lt = liftedRef.current ? 1 : 0;
      s.lv += (150 * (lt - s.lift) - 15 * s.lv) * dt; s.lift += s.lv * dt;
      if (now - touched > 6500) {
        s.lxTo = Math.sin(t / 1700) * 0.8;
        if (t > nextDemo && !s.drag) {
          const acts = [() => { s.held = false; }, () => setLift(true), () => setLift(false), () => { s.held = true; s.hold = -0.24; }, () => { s.held = false; }, () => { s.held = true; s.hold = 0.2; }];
          const waits = [2300, 2600, 1300, 1500, 2600, 2400];
          acts[step % acts.length](); nextDemo = t + waits[step % waits.length]; step++;
        }
      }
      s.lx += (s.lxTo - s.lx) * Math.min(1, dt * 5);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const still = () => { s.a = s.drag ? s.hold : 0; s.phi = 0; s.rip = 0; s.lift = liftedRef.current ? 1 : 0; s.lx = s.lxTo; draw(); };

    api.current = {
      lift: () => { touched = performance.now(); setLift(!liftedRef.current); if (reduce) still(); else wake(); },
      nudge: () => { touched = performance.now(); s.held = false; if (reduce) return; s.av += (s.a >= 0 ? 1 : -1) * 1.5; s.a += (s.a >= 0 ? 1 : -1) * 0.02; wake(); },
    };

    const local = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); return { x: ((e.clientX - b.left) / b.width) * VW, y: ((e.clientY - b.top) / b.height) * VH, w: b.width }; };
    const onDown = (e: PointerEvent) => {
      const p = local(e);
      touched = performance.now(); moved = 0; dragX = e.clientX; dragA = s.a;
      onCap = Math.abs(p.x - CX) < CAP_W / 2 + 14 && p.y < FLOOR - BH - NECK_H + 6 && p.y > FLOOR - BH - NECK_H - COLLAR_H - CAP_H - s.lift * LIFT - 18 && Math.abs(s.a) < 0.1;
      s.drag = !onCap; s.held = false; s.hold = s.a;
      pad.setPointerCapture(e.pointerId); wake();
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      s.lxTo = Math.max(-1, Math.min(1, (p.x / VW) * 2 - 1)); touched = Math.max(touched, performance.now() - 3000);
      moved = Math.max(moved, Math.abs(e.clientX - dragX));
      if (s.drag) { touched = performance.now(); s.hold = Math.max(-0.5, Math.min(0.5, dragA + ((e.clientX - dragX) / p.w) * 1.9)); }
      if (reduce) still();
    };
    const onUp = () => {
      touched = performance.now();
      if (onCap && moved < 8) setLift(!liftedRef.current);
      else if (s.drag && moved < 5) { s.av += (s.a >= 0 ? 1 : -1) * 1.5; s.a += (s.a >= 0 ? 1 : -1) * 0.02; } // a tap gives it a knock
      s.drag = false; onCap = false;
      if (reduce) still();
    };
    pad.addEventListener("pointerdown", onDown);
    pad.addEventListener("pointermove", onMove);
    pad.addEventListener("pointerup", onUp);
    pad.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(fit); ro.observe(cv);
    const io = new IntersectionObserver(([en]) => { seen = en.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    fit();
    if (reduce) still(); else wake();
    return () => {
      cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect();
      pad.removeEventListener("pointerdown", onDown); pad.removeEventListener("pointermove", onMove);
      pad.removeEventListener("pointerup", onUp); pad.removeEventListener("pointercancel", onUp);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const pill = "h-10 rounded-full border border-[#6b4a1c] bg-[#17100a]/80 px-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#f1dcb0] outline-none transition-colors duration-200 hover:border-[#c79a3e] hover:text-white focus-visible:ring-2 focus-visible:ring-[#f1c86a] motion-reduce:transition-none";
  return (
    <section className="relative flex min-h-[660px] w-full flex-col items-center justify-center overflow-hidden bg-[#0c0806] bg-[radial-gradient(62%_56%_at_50%_46%,#4a2409_0%,#231207_42%,#0c0806_78%)] px-4 pb-24 pt-6 sm:min-h-[720px] sm:pb-10">
      <div className="relative w-full max-w-[500px]">
        <canvas ref={canvas} aria-hidden="true" className="block w-full" style={{ aspectRatio: `${VW} / ${VH}` }} />
        <div ref={hit} aria-hidden="true" className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing" />
      </div>
      <p className="pointer-events-none absolute bottom-[76px] left-5 right-5 text-[#cdb58a] sm:bottom-8 sm:left-8 sm:right-auto sm:max-w-[330px]">
        <span className="block font-serif text-[17px] italic leading-tight text-[#fff3dc]">{scent.name}</span>
        <span className="mt-1 block font-mono text-[10.5px] uppercase leading-relaxed tracking-[0.18em]">
          {scent.kind} <span className="mx-1 text-[#8a7350]">/</span> {scent.size} <span className="mx-1 text-[#8a7350]">/</span> <span className="text-[#fff3dc]">{scent.price}</span>
        </span>
        <span aria-live="polite" className="mt-1 block min-h-[18px] font-mono text-[10.5px] uppercase leading-relaxed tracking-[0.18em]">
          {lifted ? scent.notes : "Drag the bottle to lean it"}
        </span>
      </p>
      <div className="absolute bottom-5 left-5 flex gap-2 sm:bottom-8 sm:left-auto sm:right-8">
        <button type="button" aria-pressed={lifted} onClick={() => api.current?.lift()} className={pill}>
          {lifted ? "Seat the stopper" : "Lift the stopper"}
        </button>
        <button type="button" onClick={() => api.current?.nudge()} className={pill}>
          Knock it
        </button>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";

// What the loader says. The first is read while it runs, the second when it finishes.
const LABEL = "Shaping your export";
const DONE_LABEL = "Export ready";
const DEMO_SECONDS = 9; // length of one self-running throw
const DEMO_START = 0.42; // the first run opens part way up so the page never shows a bare lump
const STAGE = "#e9e1d3";
const CLAY: [number, number, number] = [176, 92, 58]; // wet terracotta, as red, green, blue
const W = 460, H = 540; // drawing size in CSS pixels
const TILT = 0.25; // how far the camera looks down on the wheel
const RISE_FROM = 52, RISE_TO = 262; // height of the clay at 0 and at 100 percent

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const bump = (t: number, at: number, wide: number) => Math.exp(-(((t - at) / wide) ** 2));

// Radius of the clay at height fraction t (0 at the wheel, 1 at the lip) for progress p.
const profile = (t: number, p: number) => {
  const puck = 76 - 5 * t * t;
  const vase = 37 + 43 * bump(t, 0.34, 0.3) - 9 * bump(t, 0.83, 0.11) + 15 * smooth(0.86, 1, t) - 6 * smooth(0.12, 0, t);
  return puck + (vase - puck) * smooth(0.04, 0.92, p);
};
const heightAt = (p: number) => RISE_FROM + (RISE_TO - RISE_FROM) * (1 - (1 - p) ** 1.2);

export default function BandingWheelClayVaseLoader() {
  const canvas = useRef<HTMLCanvasElement>(null);
  // Write your own 0 to 1 value into this ref and delete the demo clock in the frame loop.
  const progress = useRef(DEMO_START);
  const restart = useRef<(() => void) | null>(null);
  const [pct, setPct] = useState(Math.round(DEMO_START * 100));

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1) * 1.3;
    cv.width = W * dpr; cv.height = H * dpr;
    const CX = 200, FLOOR = 452, HEAD = 412, HEAD_R = 148, TAU = Math.PI * 2;
    const hasConic = typeof ctx.createConicGradient === "function";

    // Shading for a turned surface: across is the position round the pot, down is how far the wall leans.
    const TW = 256, TH = 72;
    const tex = document.createElement("canvas"); tex.width = TW; tex.height = TH;
    const tx = tex.getContext("2d");
    const img = tx ? tx.createImageData(TW, TH) : null;
    let bakedFor = 99;
    const bake = (lx: number) => {
      if (!tx || !img || Math.abs(lx - bakedFor) < 0.012) return;
      bakedFor = lx;
      const ll = Math.hypot(lx, 0.62, 0.74), Lx = lx / ll, Ly = 0.62 / ll, Lz = 0.74 / ll;
      const hl = Math.hypot(Lx, Ly, Lz + 1), Hx = Lx / hl, Hy = Ly / hl, Hz = (Lz + 1) / hl;
      for (let j = 0; j < TH; j++) {
        const up = (j / (TH - 1)) * 1.7 - 0.85, flat = Math.sqrt(1 - up * up);
        for (let i = 0; i < TW; i++) {
          const u = (i + 0.5) / TW * 2 - 1, nx = u * flat, nz = Math.sqrt(Math.max(0, 1 - u * u)) * flat;
          const d = nx * Lx + up * Ly + nz * Lz, lit = clamp(d * 0.78 + 0.22);
          const sp = Math.max(0, nx * Hx + up * Hy + nz * Hz);
          const gloss = sp ** 70 * 0.95 + sp ** 9 * 0.2; // wet slip: one tight glint and a wide soft one
          const rim = (1 - nz / Math.max(0.001, flat)) ** 3; // the pale table bounced into both edges
          const back = clamp(-d) * 0.16;
          const k = 0.2 + lit * 0.98, o = (j * TW + i) * 4;
          img.data[o] = clamp((CLAY[0] * k + 255 * gloss + 210 * rim * 0.34 + 96 * back) / 255) * 255;
          img.data[o + 1] = clamp((CLAY[1] * k * (0.9 + lit * 0.14) + 250 * gloss + 172 * rim * 0.3 + 52 * back) / 255) * 255;
          img.data[o + 2] = clamp((CLAY[2] * k * (0.82 + lit * 0.2) + 244 * gloss + 140 * rim * 0.28 + 44 * back) / 255) * 255;
          img.data[o + 3] = 255 * clamp((1 - Math.abs(u)) * TW * 0.42);
        }
      }
      tx.putImageData(img, 0, 0);
    };

    // Streaks of slip that ride round with the pot, so the turning can be read.
    let seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const streaks = Array.from({ length: 64 }, () => ({ a: rand() * TAU, t: 0.04 + rand() * 0.92, w: 5 + rand() * 16, pale: rand() > 0.45, o: 0.06 + rand() * 0.12 }));
    const smears = Array.from({ length: 26 }, () => ({ a: rand() * TAU, r: 60 + rand() * 82, len: 0.3 + rand() * 1.5, w: 1 + rand() * 5, o: 0.1 + rand() * 0.28 }));
    const lumps = Array.from({ length: 220 }, () => rand() - 0.5);

    const s = { p: DEMO_START, pv: 0, spin: 0, w: 9, light: -0.5, lightTo: -0.5, drag: false };
    const metal = (x0: number, x1: number, tones: number[]) => { const g = ctx.createLinearGradient(x0, 0, x1, 0); tones.forEach((v, i) => g.addColorStop(i / (tones.length - 1), `rgb(${v},${v - 3},${v - 9})`)); return g; };
    const oval = (x: number, y: number, r: number, ry = r * TILT) => { ctx.beginPath(); ctx.ellipse(x, y, r, ry, 0, 0, TAU); };
    const drum = (y: number, r: number, thick: number) => { ctx.beginPath(); ctx.ellipse(CX, y + thick, r, r * TILT, 0, 0, Math.PI); ctx.lineTo(CX - r, y); ctx.ellipse(CX, y, r, r * TILT, 0, Math.PI, 0, true); ctx.closePath(); };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const p = clamp(s.p), lx = s.light;
      bake(lx);
      const tall = heightAt(p), top = HEAD - tall, wall = 30 - 23 * smooth(0, 0.8, p);
      const live = clamp(Math.abs(s.w) / 9), wob = 2.4 * live * (1 - p * 0.72);
      const lean = (t: number) => wob * t * Math.sin(s.spin + t * 2.1);
      const ridge = (h: number) => 0.2 * Math.sin(h * 0.47 - s.spin) + 0.1 * Math.sin(h * 1.13 - s.spin + 1.7) + 0.16 * lumps[((h * 0.5) | 0) % 220];
      const rad = (h: number) => profile(h / tall, p) + ridge(h);

      // Floor shadow, then the cast-iron foot, the shaft and the turned aluminium head.
      const fs = ctx.createRadialGradient(CX - lx * 30, FLOOR + 16, 10, CX - lx * 30, FLOOR + 16, 178);
      fs.addColorStop(0, "rgba(72,48,26,0.5)"); fs.addColorStop(0.42, "rgba(72,48,26,0.2)"); fs.addColorStop(1, "rgba(72,48,26,0)");
      ctx.save(); ctx.translate(0, (FLOOR + 16) * (1 - 0.3)); ctx.scale(1, 0.3); ctx.fillStyle = fs; ctx.fillRect(-60, FLOOR - 260, W + 120, 560); ctx.restore();
      drum(FLOOR - 4, 104, 16); ctx.fillStyle = metal(CX - 104, CX + 104, [22, 58, 96, 60, 34, 24, 44, 26]); ctx.fill();
      oval(CX, FLOOR - 4, 104); ctx.fillStyle = metal(CX - 104, CX + 104, [62, 92, 124, 96, 66, 52]); ctx.fill();
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(255,255,255,0.3)"; oval(CX, FLOOR - 3.4, 103); ctx.stroke();
      oval(CX, FLOOR - 4, 40); ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fill();
      drum(HEAD + 10, 25, FLOOR - HEAD - 16); ctx.fillStyle = metal(CX - 25, CX + 25, [40, 120, 214, 150, 78, 50, 96, 42]); ctx.fill();
      const under = ctx.createLinearGradient(0, HEAD + 14, 0, HEAD + 40); under.addColorStop(0, "rgba(20,14,8,0.85)"); under.addColorStop(1, "rgba(20,14,8,0)");
      drum(HEAD + 10, 25, 30); ctx.fillStyle = under; ctx.fill();
      drum(HEAD, HEAD_R, 13); ctx.fillStyle = metal(CX - HEAD_R, CX + HEAD_R, [70, 150, 232, 250, 188, 120, 84, 108, 168, 96, 62]); ctx.fill();
      ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(30,24,18,0.4)";
      for (const dy of [3.4, 6.2, 9.6]) { ctx.beginPath(); ctx.ellipse(CX, HEAD + dy, HEAD_R, HEAD_R * TILT, 0, 0.04, Math.PI - 0.04); ctx.stroke(); }

      ctx.save(); ctx.translate(CX, HEAD); ctx.scale(1, TILT);
      ctx.beginPath(); ctx.arc(0, 0, HEAD_R, 0, TAU);
      if (hasConic) {
        const g = ctx.createConicGradient(-1.9 + lx * 0.5, 0, 0);
        [206, 244, 214, 172, 150, 176, 222, 190, 156, 170, 228, 252, 206].forEach((v, i, all) => g.addColorStop(i / (all.length - 1), `rgb(${v},${v - 3},${v - 10})`));
        ctx.fillStyle = g;
      } else ctx.fillStyle = "#cfcac0";
      ctx.fill(); ctx.clip();
      for (let r = 8; r < HEAD_R; r += 2.6) { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.lineWidth = 0.9; ctx.strokeStyle = (r * 7) % 5 < 2.4 ? "rgba(255,255,255,0.22)" : "rgba(40,30,20,0.13)"; ctx.stroke(); }
      // Slurry thrown off the pot, dragged into arcs as the head turns.
      ctx.rotate(s.spin); ctx.lineCap = "round";
      for (const m of smears) { ctx.beginPath(); ctx.arc(0, 0, m.r, m.a, m.a + m.len); ctx.lineWidth = m.w; ctx.strokeStyle = `rgba(${CLAY[0] - 8},${CLAY[1] - 6},${CLAY[2] - 4},${m.o})`; ctx.stroke(); }
      ctx.rotate(-s.spin);
      const pool = ctx.createRadialGradient(0, 0, 40, 0, 0, 112);
      pool.addColorStop(0, `rgba(${CLAY[0] - 30},${CLAY[1] - 22},${CLAY[2] - 16},0.95)`); pool.addColorStop(0.72, `rgba(${CLAY[0]},${CLAY[1]},${CLAY[2]},0.5)`); pool.addColorStop(1, `rgba(${CLAY[0]},${CLAY[1]},${CLAY[2]},0)`);
      ctx.fillStyle = pool; ctx.fillRect(-HEAD_R, -HEAD_R, HEAD_R * 2, HEAD_R * 2);
      const cast = ctx.createRadialGradient(-lx * 70, 46, 20, -lx * 70, 46, 150);
      cast.addColorStop(0, "rgba(40,18,8,0.62)"); cast.addColorStop(1, "rgba(40,18,8,0)");
      ctx.fillStyle = cast; ctx.fillRect(-HEAD_R, -HEAD_R, HEAD_R * 2, HEAD_R * 2);
      ctx.restore();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.beginPath(); ctx.ellipse(CX, HEAD + 0.6, HEAD_R - 0.6, (HEAD_R - 0.6) * TILT, 0, 0.5, 2.5); ctx.stroke();

      // Height gauge: a brass rod on a walnut block whose pointer marks where the lip must end up.
      const GX = 392, tipX = CX + profile(1, 1) + 5, tipY = HEAD - RISE_TO + 2;
      oval(GX - lx * 12, FLOOR + 14, 34, 7); ctx.fillStyle = "rgba(72,48,26,0.28)"; ctx.fill();
      const wood = ctx.createLinearGradient(GX - 24, 0, GX + 24, 0); wood.addColorStop(0, "#3d2415"); wood.addColorStop(0.4, "#7a4d2d"); wood.addColorStop(0.62, "#8f5d38"); wood.addColorStop(1, "#472a18");
      ctx.beginPath(); ctx.roundRect(GX - 24, FLOOR - 4, 48, 20, 3); ctx.fillStyle = wood; ctx.fill();
      ctx.beginPath(); ctx.roundRect(GX - 24, FLOOR - 4, 48, 3, [3, 3, 0, 0]); ctx.fillStyle = "rgba(255,226,190,0.4)"; ctx.fill();
      const brass = (a: number, b: number, vertical: boolean) => { const g = vertical ? ctx.createLinearGradient(0, a, 0, b) : ctx.createLinearGradient(a, 0, b, 0); g.addColorStop(0, "#6a4a14"); g.addColorStop(0.3, "#e8c873"); g.addColorStop(0.46, "#fff3c4"); g.addColorStop(0.7, "#b88a33"); g.addColorStop(1, "#5a3d10"); return g; };
      ctx.fillStyle = brass(GX - 2.6, GX + 2.6, false); ctx.fillRect(GX - 2.6, tipY - 40, 5.2, FLOOR - tipY + 38);
      oval(GX, tipY - 40, 2.6, 1.2); ctx.fillStyle = "#fff0bd"; ctx.fill();
      ctx.fillStyle = brass(tipY - 2, tipY + 2, true); ctx.beginPath(); ctx.moveTo(GX + 16, tipY - 2); ctx.lineTo(tipX + 16, tipY - 2); ctx.lineTo(tipX, tipY); ctx.lineTo(tipX + 16, tipY + 2); ctx.lineTo(GX + 16, tipY + 2); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.shadowColor = "rgba(40,24,8,0.45)"; ctx.shadowBlur = 5 * dpr; ctx.shadowOffsetY = 2.5 * dpr;
      ctx.beginPath(); ctx.roundRect(GX - 8, tipY - 8, 16, 16, 2.5); ctx.fillStyle = brass(GX - 8, GX + 8, false); ctx.fill(); ctx.restore();
      oval(GX, tipY, 4.4, 4.4); ctx.fillStyle = "#5c3f12"; ctx.fill();
      oval(GX - 0.6, tipY - 0.6, 3.6, 3.6); ctx.fillStyle = brass(GX - 4, GX + 4, false); ctx.fill();
      ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(60,38,8,0.8)"; ctx.beginPath(); ctx.moveTo(GX - 2.6, tipY + 1.6); ctx.lineTo(GX + 1.6, tipY - 2.6); ctx.stroke();

      // The clay, one thin slice at a time from the lip down to the wheel.
      const step = 1 / dpr, rows = TH - 1;
      const row = (y: number, r: number, off: number, up: number) => {
        const j = Math.round(clamp((up + 0.85) / 1.7) * rows);
        ctx.drawImage(tex, 0, j, TW, 1, CX + off - r, y, r * 2, step * 1.6);
      };
      for (let y = top; y < HEAD; y += step) {
        const h = HEAD - y, r = rad(h), slope = (rad(h + 1) - rad(h - 1)) / 2;
        row(y, r, lean(h / tall), -slope / Math.hypot(1, slope) * 0.9);
      }
      const foot = rad(0.5), fy = foot * TILT;
      for (let dy = 0; dy < fy; dy += step) row(HEAD + dy, foot * Math.sqrt(1 - (dy / fy) ** 2), 0, -0.3 - 0.5 * (dy / fy));
      for (const k of streaks) {
        const c = Math.cos(k.a + s.spin * (0.99 + k.t * 0.02)); if (c < 0.12) continue;
        const h = k.t * tall, r = rad(h), x = CX + lean(k.t) + r * Math.sin(k.a + s.spin);
        ctx.beginPath(); ctx.ellipse(x, HEAD - h, k.w * c * (0.4 + live * 0.6), 0.75, 0, 0, TAU);
        ctx.fillStyle = k.pale ? `rgba(244,196,160,${k.o * c})` : `rgba(74,30,14,${k.o * c})`; ctx.fill();
      }

      // The lip and the dark well inside it.
      const lipR = rad(tall), ox = CX + lean(1), inR = Math.max(6, lipR - wall), lit = clamp(0.5 - lx * 0.5);
      const lip = ctx.createLinearGradient(ox - lipR, 0, ox + lipR, 0);
      const tone = (k: number) => `rgb(${(CLAY[0] * k) | 0},${(CLAY[1] * k) | 0},${(CLAY[2] * k) | 0})`;
      lip.addColorStop(0, tone(0.62 + 0.5 * lit)); lip.addColorStop(clamp(0.5 - lx * 0.34), tone(1.26)); lip.addColorStop(1, tone(1.12 - 0.5 * lit));
      oval(ox, top, lipR); ctx.fillStyle = lip; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(255,240,226,0.9)"; ctx.beginPath(); ctx.ellipse(ox, top, lipR - 1.6, (lipR - 1.6) * TILT, 0, Math.PI * (0.52 + lx * 0.24), Math.PI * (0.8 + lx * 0.24)); ctx.stroke();
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(255,226,206,0.5)"; ctx.beginPath(); ctx.ellipse(ox, top, lipR - 0.5, (lipR - 0.5) * TILT, 0, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      ctx.save(); oval(ox, top + 0.6, inR); ctx.clip();
      const well = ctx.createLinearGradient(0, top - inR * TILT, 0, top + inR * TILT);
      well.addColorStop(0, tone(0.72)); well.addColorStop(0.5, tone(0.36)); well.addColorStop(1, tone(0.14));
      ctx.fillStyle = well; ctx.fillRect(ox - inR, top - inR, inR * 2, inR * 2);
      const far = ctx.createRadialGradient(ox - lx * inR * 0.7, top - inR * TILT * 0.9, 1, ox - lx * inR * 0.7, top - inR * TILT * 0.9, inR * 1.1);
      far.addColorStop(0, "rgba(255,190,150,0.5)"); far.addColorStop(1, "rgba(255,190,150,0)");
      ctx.fillStyle = far; ctx.fillRect(ox - inR, top - inR, inR * 2, inR * 2);
      if (p < 0.5) { // while the piece is still low you can see the wet floor of the well
        oval(ox, top + inR * TILT * 0.5, inR * 0.72, inR * TILT * 0.5); ctx.fillStyle = `rgba(${CLAY[0]},${CLAY[1]},${CLAY[2]},${0.5 * (1 - p * 2)})`; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = `rgba(255,236,220,${0.5 * (1 - p * 2)})`; ctx.beginPath(); ctx.ellipse(ox - lx * 8, top + inR * TILT * 0.5, inR * 0.42, inR * TILT * 0.24, 0, 3.5, 5.2); ctx.stroke();
      }
      ctx.restore();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(52,20,8,0.55)"; ctx.beginPath(); ctx.ellipse(ox, top + 0.6, inR, inR * TILT, 0, Math.PI, TAU); ctx.stroke();
    };

    let raf = 0, last = 0, seen = true, clock = DEMO_START * DEMO_SECONDS, shown = -1, lastX = 0, touched = -1e9, idle = 0;
    const HOLD = 3;
    const report = (p: number) => { const n = Math.round(clamp(p) * 100); if (n !== shown) { shown = n; setPct(n); } };
    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.033, (now - last) / 1000); last = now;

      // Demo clock. Delete this block when `progress.current` is fed from real work.
      clock += dt;
      if (clock < DEMO_SECONDS) { const t = clock / DEMO_SECONDS; progress.current = Math.min(1, t + 0.03 * Math.sin(t * Math.PI * 7) * (1 - t)); }
      else if (clock < DEMO_SECONDS + HOLD) progress.current = 1;
      else { clock = 0; progress.current = 0; }

      const target = clamp(progress.current);
      // The clay follows the number on a soft spring, so a reset sinks back down instead of jumping.
      s.pv += ((target - s.p) * 60 - s.pv * 14) * dt; s.p += s.pv * dt;
      const cruise = target >= 1 && s.p > 0.985 ? 0 : 9;
      if (!s.drag) s.w += (cruise - s.w) * Math.min(1, dt * (cruise ? 2.4 : 1.1));
      s.spin += s.w * dt;
      idle += dt;
      if (now - touched > 3500) s.lightTo = -0.5 + 0.16 * Math.sin(idle / 2.6);
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 5);
      report(target);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(frame); } };
    const still = () => { progress.current = 1; s.p = 1; s.w = 0; report(1); draw(); };
    restart.current = () => { clock = 0; progress.current = 0; if (reduce) still(); else wake(); };
    if (reduce) still(); else wake();

    const onDown = (e: PointerEvent) => { s.drag = true; lastX = e.clientX; touched = performance.now(); cv.setPointerCapture(e.pointerId); };
    const onMove = (e: PointerEvent) => {
      if (reduce) return;
      const b = cv.getBoundingClientRect();
      touched = performance.now();
      if (!s.drag) { s.lightTo = clamp(((e.clientX - b.left) / b.width) * 2 - 1, -0.85, 0.85); return; }
      const d = ((e.clientX - lastX) / b.width) * 5; lastX = e.clientX;
      s.spin += d; s.w = s.w * 0.6 + (d / 0.016) * 0.4; // a push carries the wheel on after you let go
    };
    const onUp = () => { s.drag = false; };
    cv.addEventListener("pointerdown", onDown); cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp); cv.addEventListener("pointercancel", onUp);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); restart.current = null;
      cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onUp); cv.removeEventListener("pointercancel", onUp);
      io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const done = pct >= 100;
  return (
    <div
      className="flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[radial-gradient(90%_70%_at_50%_38%,#f6f0e4_0%,#e9e1d3_55%,#d9cfbd_100%)] px-4 py-10 sm:min-h-[760px]"
      style={{ backgroundColor: STAGE }}
    >
      <div
        role="progressbar"
        aria-label={LABEL}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={done ? DONE_LABEL : `${pct} percent thrown`}
        className="relative h-[400px] w-[340px] sm:h-[620px] sm:w-[530px]"
      >
        <canvas
          ref={canvas}
          aria-hidden="true"
          className="absolute left-1/2 top-0 h-[540px] w-[460px] max-w-none origin-top -translate-x-1/2 scale-[0.74] cursor-grab touch-pan-y active:cursor-grabbing sm:scale-[1.15]"
        />
      </div>
      <div className="mt-2 flex flex-col items-center gap-3">
        <p aria-hidden="true" className="font-mono text-[34px] font-medium tabular-nums leading-none tracking-tight text-stone-800">
          {pct}
          <span className="ml-1 text-[15px] text-stone-600">%</span>
        </p>
        <p role="status" className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone-700">
          {done ? DONE_LABEL : LABEL}
        </p>
        <button
          type="button"
          onClick={() => restart.current?.()}
          className="flex h-10 items-center rounded-full border border-stone-500 px-5 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-800 outline-none transition-colors hover:bg-stone-900/5 focus-visible:ring-2 focus-visible:ring-stone-800 motion-reduce:transition-none"
        >
          Throw again
        </button>
      </div>
    </div>
  );
}

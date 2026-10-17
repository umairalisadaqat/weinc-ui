import { useEffect, useRef, useState } from "react";

// What the loader says. The first is read while it runs, the second when it finishes.
const LABEL = "Exporting your cut";
const DONE_LABEL = "Export finished";
const DEMO_SECONDS = 7; // length of the self-running demo
const W = 680, H = 460; // the bench is drawn on this grid and scaled to its box
const FILM = ["#1c0f07", "#3a2110", "#6b3f1c", "#b97a3a"]; // the wound stock, shadow to shine
const LAMP = "#ffb44a"; // the light in the gate

const FEED = { x: 190, y: 226 }, TAKE = { x: 490, y: 226 };
const FLANGE = 112, HUB = 34, FULL = 101; // reel sizes: flange, bare core, full pack
const ROLL_A = { x: 304, y: 84 }, ROLL_B = { x: 376, y: 84 }, ROLL_R = 9;
const COUNTER = { x: 340, y: 346 };

export default function FilmRewindBenchLoader() {
  const canvas = useRef<HTMLCanvasElement>(null);
  // Write your own 0 to 1 value into this ref and delete the demo clock in the frame loop.
  const progress = useRef(0);
  const restart = useRef<(() => void) | null>(null);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1) * 1.3;
    cv.width = W * dpr; cv.height = H * dpr;
    const TAU = Math.PI * 2;
    const hasConic = typeof ctx.createConicGradient === "function";

    // Spinning marks for a flange and the wound edge of the film, each drawn once.
    const texture = (r0: number, r1: number, step: number, light: number, dark: number, seed: number) => {
      const c = document.createElement("canvas"); c.width = c.height = Math.ceil(240 * dpr);
      const x = c.getContext("2d");
      if (x) {
        x.scale(dpr, dpr);
        const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        for (let r = r0; r < r1; r += step) {
          const v = rand();
          x.beginPath(); x.arc(120, 120, r, 0, TAU); x.lineWidth = 0.45 + rand() * 0.4;
          x.strokeStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * light})` : `rgba(0,0,0,${(0.5 - v) * dark})`; x.stroke();
        }
      }
      return c;
    };
    const flangeMarks = texture(8, FLANGE, 0.6, 0.3, 0.26, 5);
    const filmMarks = texture(HUB, FULL + 1, 0.5, 0.2, 0.5, 23);
    const stamp = (tex: HTMLCanvasElement, x: number, y: number) => { ctx.drawImage(tex, x - 120, y - 120, 240, 240); };

    const grey = (v: number) => { const c = Math.max(0, Math.min(255, v)); const k = c > 170 ? 0 : (170 - c) * 0.07; return `rgb(${Math.max(0, c - k) | 0},${c | 0},${Math.min(255, c + k * 1.5) | 0})`; };
    const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const filmTone = (t: number) => { const f = Math.max(0, Math.min(0.999, t)) * (FILM.length - 1), i = Math.floor(f), a = hex(FILM[i]), b = hex(FILM[i + 1]); return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * (f - i))).join(",")})`; };
    const BANDS: [number, number][] = [[0, 1], [0.035, 0.97], [0.09, 0.62], [0.17, 0.2], [0.24, 0.02], [0.32, 0.3], [0.4, 0.58], [0.455, 0.74], [0.5, 0.94], [0.545, 0.7], [0.61, 0.46], [0.7, 0.04], [0.77, 0.22], [0.85, 0.4], [0.925, 0.74], [0.97, 0.95], [1, 1]];
    const sheen = (x: number, y: number, angle: number, colour: (t: number) => string, r: number) => {
      if (!hasConic) { const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, colour(1)); g.addColorStop(0.5, colour(0.1)); g.addColorStop(1, colour(0.8)); return g; }
      const g = ctx.createConicGradient(angle, x, y);
      for (const [p, t] of BANDS) g.addColorStop(p, colour(t));
      return g;
    };
    const metal = (lo: number, hi: number) => (t: number) => grey(lo + (hi - lo) * t);
    const disc = (x: number, y: number, r: number) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); };

    // The upper flange: a disc with three windows, three lightening holes and the spindle hole.
    const flangePath = (x: number, y: number, ang: number) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.beginPath(); ctx.arc(0, 0, FLANGE, 0, TAU); ctx.closePath();
      const r0 = 47, r1 = 99, half = 0.78, cr = 9;
      for (let i = 0; i < 3; i++) {
        const m = (i / 3) * TAU, a0 = m - half, a1 = m + half, pol = (r: number, a: number): [number, number] => [Math.cos(a) * r, Math.sin(a) * r];
        const d1 = cr / r1, d0 = cr / r0, mid = (r0 + r1) / 2;
        ctx.moveTo(...pol(r1, a0 + d1)); ctx.arc(0, 0, r1, a0 + d1, a1 - d1);
        ctx.arcTo(...pol(r1, a1), ...pol(mid, a1), cr); ctx.arcTo(...pol(r0, a1), ...pol(r0, a1 - d0), cr);
        ctx.arc(0, 0, r0, a1 - d0, a0 + d0, true);
        ctx.arcTo(...pol(r0, a0), ...pol(mid, a0), cr); ctx.arcTo(...pol(r1, a0), ...pol(r1, a0 + d1), cr); ctx.closePath();
        const hx = Math.cos(m + TAU / 6) * 35, hy = Math.sin(m + TAU / 6) * 35;
        ctx.moveTo(hx + 5, hy); ctx.arc(hx, hy, 5, 0, TAU); ctx.closePath();
      }
      ctx.restore();
    };

    const s = { p: 0, aL: 0.4, aR: 1.3, travel: 0, light: -2.2, lightTo: -2.2 };
    const packs = (p: number) => { const span = FULL * FULL - HUB * HUB; return [Math.sqrt(HUB * HUB + span * (1 - p)), Math.sqrt(HUB * HUB + span * p)]; };
    // Where a taut strand touches two round things it passes over.
    const over = (a: { x: number; y: number }, ra: number, b: { x: number; y: number }, rb: number) => {
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), base = Math.atan2(dy, dx), off = Math.acos(Math.max(-1, Math.min(1, (ra - rb) / d)));
      const g = Math.sin(base - off) < Math.sin(base + off) ? base - off : base + off;
      return { g, x0: a.x + Math.cos(g) * ra, y0: a.y + Math.sin(g) * ra, x1: b.x + Math.cos(g) * rb, y1: b.y + Math.sin(g) * rb };
    };
    const strand = (rL: number, rR: number, ox: number, oy: number) => {
      const t1 = over(FEED, rL, ROLL_A, ROLL_R), t3 = over(ROLL_B, ROLL_R, TAKE, rR);
      ctx.beginPath(); ctx.moveTo(t1.x0 + ox, t1.y0 + oy); ctx.lineTo(t1.x1 + ox, t1.y1 + oy);
      ctx.arc(ROLL_A.x + ox, ROLL_A.y + oy, ROLL_R, t1.g, -Math.PI / 2);
      ctx.arc(ROLL_B.x + ox, ROLL_B.y + oy, ROLL_R, -Math.PI / 2, t3.g);
      ctx.lineTo(t3.x1 + ox, t3.y1 + oy);
    };
    const rounded = (x: number, y: number, w: number, h: number, r: number) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };

    const reelBase = (c: { x: number; y: number }, r: number, la: number) => {
      // Shadow of the whole reel on the bench.
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 22 * dpr; ctx.shadowOffsetX = 5 * dpr; ctx.shadowOffsetY = 13 * dpr;
      disc(c.x, c.y, FLANGE - 2); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      // Lower flange, seen in shade through the windows.
      disc(c.x, c.y, FLANGE); ctx.fillStyle = sheen(c.x, c.y, la + 0.4, metal(34, 120), FLANGE); ctx.fill();
      // The wound film.
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 7 * dpr; ctx.shadowOffsetX = 2 * dpr; ctx.shadowOffsetY = 4 * dpr;
      disc(c.x, c.y, r); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      disc(c.x, c.y, r); ctx.fillStyle = sheen(c.x, c.y, la - 0.25, filmTone, r); ctx.fill();
      ctx.save(); disc(c.x, c.y, r); ctx.clip(); stamp(filmMarks, c.x, c.y); ctx.restore();
      ctx.lineWidth = 1.1; ctx.strokeStyle = "rgba(255,186,110,0.4)"; disc(c.x, c.y, r - 0.6); ctx.stroke();
      // The core the film is wound on.
      const core = ctx.createRadialGradient(c.x - 8, c.y - 10, 2, c.x, c.y, HUB);
      core.addColorStop(0, "#4b4e55"); core.addColorStop(1, "#16171a");
      disc(c.x, c.y, HUB); ctx.fillStyle = core; ctx.fill();
    };

    const reelTop = (c: { x: number; y: number }, ang: number, la: number) => {
      // The flange throws a shadow onto the film just under it.
      ctx.save(); disc(c.x, c.y, FLANGE); ctx.clip();
      ctx.shadowColor = "rgba(0,0,0,0.75)"; ctx.shadowBlur = 6 * dpr; ctx.shadowOffsetX = 2.5 * dpr; ctx.shadowOffsetY = 5 * dpr;
      flangePath(c.x, c.y, ang); ctx.fillStyle = "#000"; ctx.fill("evenodd"); ctx.restore();
      // Its cut edge, then the face.
      flangePath(c.x, c.y + 1.7, ang); ctx.fillStyle = "#3d4047"; ctx.fill("evenodd");
      flangePath(c.x, c.y, ang); ctx.fillStyle = sheen(c.x, c.y, la, metal(112, 252), FLANGE); ctx.fill("evenodd");
      ctx.save(); flangePath(c.x, c.y, ang); ctx.clip("evenodd"); stamp(flangeMarks, c.x, c.y);
      const dish = ctx.createRadialGradient(c.x, c.y, 40, c.x, c.y, FLANGE);
      dish.addColorStop(0, "rgba(0,0,0,0.1)"); dish.addColorStop(0.5, "rgba(255,255,255,0.06)"); dish.addColorStop(0.93, "rgba(0,0,0,0)"); dish.addColorStop(1, "rgba(0,0,0,0.3)");
      ctx.fillStyle = dish; ctx.fillRect(c.x - FLANGE, c.y - FLANGE, FLANGE * 2, FLANGE * 2); ctx.restore();
      flangePath(c.x, c.y - 0.5, ang); ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.stroke();
      flangePath(c.x, c.y + 0.4, ang); ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.stroke();
      // Rolled rim.
      ctx.lineWidth = 3; ctx.strokeStyle = sheen(c.x, c.y, la + 0.6, metal(70, 255), FLANGE); disc(c.x, c.y, FLANGE - 1.5); ctx.stroke();
      // Raised boss with the keyed spindle through it.
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 5 * dpr; ctx.shadowOffsetY = 3 * dpr;
      disc(c.x, c.y, 21); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      disc(c.x, c.y, 21); ctx.fillStyle = sheen(c.x, c.y, la + 0.3, metal(120, 255), 21); ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(0,0,0,0.35)"; disc(c.x, c.y, 15); ctx.stroke();
      ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(255,255,255,0.7)"; disc(c.x, c.y, 16); ctx.stroke();
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(ang);
      ctx.fillStyle = "#08090b"; ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, TAU); ctx.fill();
      for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.fillRect(-1.7, -11.5, 3.4, 7); }
      ctx.fillStyle = "#c8ccd3"; ctx.beginPath(); ctx.arc(0, 0, 3.2, 0, TAU); ctx.fill();
      ctx.restore();
    };

    const roller = (c: { x: number; y: number }) => {
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 8 * dpr; ctx.shadowOffsetX = 2 * dpr; ctx.shadowOffsetY = 6 * dpr;
      disc(c.x, c.y, ROLL_R - 0.6); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      const g = ctx.createRadialGradient(c.x - 3, c.y - 3.5, 0.5, c.x, c.y, ROLL_R - 0.6);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.35, "#c5cad2"); g.addColorStop(0.8, "#5d626b"); g.addColorStop(1, "#9aa0aa");
      disc(c.x, c.y, ROLL_R - 0.6); ctx.fillStyle = g; ctx.fill();
      disc(c.x, c.y, 2.6); ctx.fillStyle = "#17181b"; ctx.fill();
    };

    const counter = (v: number) => {
      const { x, y } = COUNTER, w = 104, h = 46;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 10 * dpr; ctx.shadowOffsetY = 5 * dpr;
      rounded(x - w / 2, y - h / 2, w, h, 9); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      const bezel = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
      bezel.addColorStop(0, "#f4f5f7"); bezel.addColorStop(0.2, "#aab0b9"); bezel.addColorStop(0.55, "#5f646d"); bezel.addColorStop(0.85, "#a4a9b2"); bezel.addColorStop(1, "#3c3f45");
      rounded(x - w / 2, y - h / 2, w, h, 9); ctx.fillStyle = bezel; ctx.fill();
      const iw = 90, ih = 32, cell = iw / 3;
      ctx.save(); rounded(x - iw / 2, y - ih / 2, iw, ih, 4); ctx.clip();
      ctx.fillStyle = "#0b0b0d"; ctx.fillRect(x - iw / 2, y - ih / 2, iw, ih);
      // Three number drums. Each one starts to roll as the drum to its right passes nine.
      const ones = v % 10, tens = (Math.floor(v / 10) % 10) + Math.max(0, ones - 9), hundreds = Math.floor(v / 100) + Math.max(0, (v % 100) - 99);
      ctx.font = "700 25px ui-monospace, SFMono-Regular, Menlo, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      [hundreds, tens, ones].forEach((val, i) => {
        const cx = x - iw / 2 + cell * (i + 0.5), n = Math.floor(val + 1e-6), f = val - n;
        ctx.fillStyle = i === 2 ? "#17110a" : "#131316"; ctx.fillRect(cx - cell / 2 + 0.6, y - ih / 2, cell - 1.2, ih);
        if (i === 2) { ctx.fillStyle = "#efe6d2"; ctx.fillRect(cx - cell / 2 + 0.6, y - ih / 2, cell - 1.2, ih); }
        ctx.fillStyle = i === 2 ? "#b3261a" : "#f1ece0";
        ctx.fillText(String(n % 10), cx, y + 1.5 - f * ih); ctx.fillText(String((n + 1) % 10), cx, y + 1.5 + (1 - f) * ih);
      });
      const curve = ctx.createLinearGradient(0, y - ih / 2, 0, y + ih / 2);
      curve.addColorStop(0, "rgba(0,0,0,0.85)"); curve.addColorStop(0.3, "rgba(0,0,0,0.05)"); curve.addColorStop(0.5, "rgba(255,255,255,0.07)"); curve.addColorStop(0.7, "rgba(0,0,0,0.05)"); curve.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.fillStyle = curve; ctx.fillRect(x - iw / 2, y - ih / 2, iw, ih);
      ctx.restore();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(0,0,0,0.7)"; rounded(x - iw / 2, y - ih / 2, iw, ih, 4); ctx.stroke();
      ctx.font = "600 8px ui-monospace, SFMono-Regular, Menlo, monospace"; ctx.fillStyle = "rgba(236,238,240,0.5)"; ctx.textAlign = "center";
      ctx.fillText("PERCENT WOUND", x, y - h / 2 - 11);
      ctx.fillText("FEED", FEED.x, 372); ctx.fillText("TAKE-UP", TAKE.x, 372);
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const la = s.light, [rL, rR] = packs(s.p);

      // The bench plate, black anodised, held down by four screws.
      ctx.save(); ctx.shadowColor = "rgba(84,52,0,0.5)"; ctx.shadowBlur = 26 * dpr; ctx.shadowOffsetY = 16 * dpr;
      rounded(36, 34, W - 72, 358, 34); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      const plate = ctx.createLinearGradient(0, 34, 0, 392);
      plate.addColorStop(0, "#2a2c30"); plate.addColorStop(0.5, "#1a1b1e"); plate.addColorStop(1, "#111214");
      rounded(36, 34, W - 72, 358, 34); ctx.fillStyle = plate; ctx.fill();
      const lip = ctx.createLinearGradient(0, 34, 0, 392);
      lip.addColorStop(0, "rgba(255,255,255,0.5)"); lip.addColorStop(0.3, "rgba(255,255,255,0.05)"); lip.addColorStop(1, "rgba(0,0,0,0.7)");
      ctx.lineWidth = 1.4; ctx.strokeStyle = lip; rounded(36.7, 34.7, W - 73.4, 356.6, 33.3); ctx.stroke();
      for (const [x, y] of [[62, 60], [W - 62, 60], [62, 366], [W - 62, 366]]) {
        disc(x, y + 0.8, 6.2); ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fill();
        const g = ctx.createRadialGradient(x - 2, y - 2, 0.5, x, y, 6); g.addColorStop(0, "#d9dce1"); g.addColorStop(0.6, "#7c818a"); g.addColorStop(1, "#34373c");
        disc(x, y, 5.6); ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + x * 0.01; ctx.lineTo(x + Math.cos(a) * 2.7, y + Math.sin(a) * 2.7); } ctx.closePath(); ctx.fillStyle = "#0c0d0f"; ctx.fill();
      }

      // The gate between the rollers, with its lamp.
      rounded(ROLL_A.x + 14, ROLL_A.y - 6, ROLL_B.x - ROLL_A.x - 28, 34, 6); ctx.fillStyle = "#0a0a0c"; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.16)"; ctx.stroke();
      const mx = (ROLL_A.x + ROLL_B.x) / 2;
      const glow = ctx.createRadialGradient(mx, ROLL_A.y - 6, 1, mx, ROLL_A.y - 6, 46);
      glow.addColorStop(0, "rgba(255,180,74,0.75)"); glow.addColorStop(0.3, "rgba(255,180,74,0.22)"); glow.addColorStop(1, "rgba(255,180,74,0)");
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = glow; ctx.fillRect(mx - 50, ROLL_A.y - 56, 100, 100); ctx.restore();
      rounded(mx - 9, ROLL_A.y - 3, 18, 7, 3); ctx.fillStyle = LAMP; ctx.fill();
      rounded(mx - 7, ROLL_A.y - 2, 14, 2.4, 1.2); ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fill();

      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 3 * dpr; ctx.shadowOffsetX = 1.5 * dpr; ctx.shadowOffsetY = 4 * dpr; strand(rL, rR, 0, 0); ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.strokeStyle = "#000"; ctx.stroke(); ctx.restore();
      reelBase(FEED, rL, la); reelBase(TAKE, rR, la);
      strand(rL, rR, 0, 0); ctx.lineWidth = 3.2; ctx.strokeStyle = FILM[2]; ctx.stroke();
      strand(rL, rR, 0, -0.8); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,200,140,0.8)"; ctx.stroke();
      // Pale splices ride along so you can see the stock travelling.
      strand(rL, rR, 0, 0); ctx.save(); ctx.lineCap = "butt"; ctx.setLineDash([5, 118]); ctx.lineDashOffset = -s.travel; ctx.lineWidth = 3.2; ctx.strokeStyle = "#f3e7cf"; ctx.stroke(); ctx.restore();
      roller(ROLL_A); roller(ROLL_B);
      reelTop(FEED, s.aL, la); reelTop(TAKE, s.aR, la);
      counter(s.p * 100);
    };

    let raf = 0, last = 0, seen = true, clock = 0, shown = -1, idle = 0, touched = -1e9;
    const HOLD = 1.7, REWIND = 1.5, REST = 0.35;
    const report = (p: number) => { const n = Math.round(p * 100); if (n !== shown) { shown = n; setPct(n); } };
    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.033, (now - last) / 1000); last = now;

      // Demo clock: wind, hold, rewind. Delete this block when `progress.current` is fed from real work.
      clock += dt;
      if (clock < DEMO_SECONDS) { const t = clock / DEMO_SECONDS; progress.current = Math.min(1, t + 0.03 * Math.sin(t * Math.PI * 5) * (1 - t)); }
      else if (clock < DEMO_SECONDS + HOLD) progress.current = 1;
      else if (clock < DEMO_SECONDS + HOLD + REWIND) { const t = (clock - DEMO_SECONDS - HOLD) / REWIND; progress.current = 1 - t * t * (3 - 2 * t); }
      else if (clock < DEMO_SECONDS + HOLD + REWIND + REST) progress.current = 0;
      else clock = 0;

      const p = Math.max(0, Math.min(1, progress.current)), moved = p - s.p, [rL, rR] = packs((p + s.p) / 2);
      // The same length of film leaves one reel and lands on the other, so the smaller pack turns faster.
      const length = moved * 1250;
      s.aL += length / rL; s.aR += length / rR; s.travel += length; s.p = p;
      idle += dt;
      if (now - touched > 4000) s.lightTo = -2.2 + 0.32 * Math.sin(idle / 2.4);
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 6);
      report(p); draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(frame); } };
    const still = () => { progress.current = 1; s.p = 1; report(1); draw(); };
    restart.current = () => { clock = 0; progress.current = 0; s.p = 0; if (reduce) still(); else wake(); };
    if (reduce) still(); else wake();

    const onMove = (e: PointerEvent) => { if (reduce) return; const b = cv.getBoundingClientRect(); touched = performance.now() - 2600; s.lightTo = Math.atan2(e.clientY - (b.top + b.height / 2), e.clientX - (b.left + b.width / 2)); };
    cv.addEventListener("pointermove", onMove);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); restart.current = null; cv.removeEventListener("pointermove", onMove); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const done = pct >= 100;
  return (
    <div className="flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[#f0b31c] bg-[radial-gradient(100%_80%_at_50%_36%,#f9c93f_0%,#f0b31c_55%,#e09f0a_100%)] px-4 py-10 sm:min-h-[720px]">
      <div
        role="progressbar"
        aria-label={LABEL}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={done ? DONE_LABEL : `${pct} percent wound`}
        className="relative aspect-[680/460] w-full max-w-[860px]"
      >
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      </div>
      <div className="-mt-3 flex flex-col items-center gap-3 sm:-mt-8">
        <p role="status" className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#221a02]">
          {done ? DONE_LABEL : LABEL}
        </p>
        <button
          type="button"
          onClick={() => restart.current?.()}
          className="flex h-10 items-center rounded-full border border-[#221a02]/50 px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#221a02] outline-none transition-colors hover:bg-[#221a02]/10 focus-visible:ring-2 focus-visible:ring-[#221a02] motion-reduce:transition-none"
        >
          Run again
        </button>
      </div>
    </div>
  );
}

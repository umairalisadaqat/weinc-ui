import { useEffect, useRef, useState } from "react";

// What the tape measures. The blade is printed from these numbers, so change them freely.
const LABEL = "Shelf width";
const UNIT = "cm";
const MIN = 0;
const MAX = 60;
const STEP = 1;
const START = 46;
const DEMO = true; // the tape plays by itself when left alone. Set to false inside a real form.
const SHELL = ["#ffd84a", "#f4b90c", "#d39300"]; // case plastic: lit, body, shaded
const BLADE = ["#fff0a0", "#f6cf3a", "#d9a916"]; // blade lacquer: bright band, body, edge
const TAB = "#e23b2e"; // the thumb lock

const snap = (v: number) => Math.max(MIN, Math.min(MAX, Math.round(v / STEP) * STEP));

export default function SteelTapeMeasureSlider() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const lockBtn = useRef<HTMLButtonElement>(null);
  const [value, setValue] = useState(START);
  const [locked, setLocked] = useState(true);
  const api = useRef<{ set: (v: number) => void; lock: (on: boolean) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const CW = 172, CH = 164; // the case, before scaling
    let W = 0, H = 0, k = 1, cx0 = 0, cy0 = 0, mx = 0, my = 0, Lmax = 1, ppu = 1, BH = 30;

    // Fine speckle that stops the plastic and rubber looking like flat fills.
    const grain = document.createElement("canvas");
    grain.width = grain.height = 96;
    const gx = grain.getContext("2d");
    if (gx) {
      const im = gx.createImageData(96, 96);
      let seed = 11;
      for (let i = 0; i < 96 * 96; i++) {
        seed = (seed * 16807) % 2147483647;
        const v = seed % 255;
        im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v > 127 ? 255 : 0;
        im.data[i * 4 + 3] = Math.abs(v - 127) * 0.2;
      }
      gx.putImageData(im, 0, 0);
    }
    const speckle = ctx.createPattern(grain, "repeat");

    const s = { u: DEMO ? START - 8 : START, uv: 0, target: DEMO ? START - 8 : START, raw: START, drag: false, held: false, locked: true, lockPos: 1, wob: 0, wobV: 0, kick: 0, kickV: 0, shown: START, lockShown: true, keyed: false };

    const layout = () => {
      W = cv.clientWidth; H = cv.clientHeight;
      const small = W < 560;
      k = small ? 0.8 : W >= 760 ? 1.42 : 1;
      cx0 = small ? 2 : 30; cy0 = H * 0.43 - CH * k * 0.66;
      mx = cx0 + (CW + 2) * k; my = cy0 + (CH - 25) * k; BH = 30 * k;
      Lmax = W - mx - (small ? 14 : 58); ppu = Lmax / (MAX - MIN);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      const b = lockBtn.current;
      if (b) { b.style.left = `${cx0 + (CW - 24) * k - 24}px`; b.style.top = `${cy0 + 55 * k - 32}px`; }
    };

    const rr = (x: number, y: number, w: number, h: number, r: number[]) => {
      ctx.beginPath(); ctx.moveTo(x + r[0], y);
      ctx.arcTo(x + w, y, x + w, y + h, r[1]); ctx.arcTo(x + w, y + h, x, y + h, r[2]);
      ctx.arcTo(x, y + h, x, y, r[3]); ctx.arcTo(x, y, x + w, y, r[0]); ctx.closePath();
    };
    const OUT = [50, 44, 20, 30];

    // The unsupported blade droops like a beam fixed at one end: flat at the mouth, steepest at the hook.
    const curve = (L: number, t: number) => {
      const n = L / Lmax;
      const def = 0.17 * Lmax * Math.pow(n, 2.2) + (s.wob + Math.sin(t / 1000) * 1.8) * n * n;
      const y = (x: number) => { const q = Math.max(0, x / Math.max(L, 1)); return (def * q * q * (6 - 4 * q + q * q)) / 3; };
      const slope = (x: number) => { const q = Math.max(0, x / Math.max(L, 1)); return (def * (12 * q - 12 * q * q + 4 * q * q * q)) / 3 / Math.max(L, 1); };
      return { y, slope };
    };

    const drawBlade = (L: number, c: ReturnType<typeof curve>) => {
      const SEG = 3, h = BH;
      const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      g.addColorStop(0, "#8f6c05"); g.addColorStop(0.05, BLADE[2]); g.addColorStop(0.2, BLADE[1]); g.addColorStop(0.36, BLADE[0]);
      g.addColorStop(0.5, BLADE[1]); g.addColorStop(0.82, BLADE[2]); g.addColorStop(0.9, "#a47d09"); g.addColorStop(0.93, "#6b5206"); g.addColorStop(1, "#3d2f04");
      for (let x = -6; x < L; x += SEG) {
        ctx.save(); ctx.translate(mx + x, my + c.y(x)); ctx.rotate(Math.atan(c.slope(x)));
        ctx.fillStyle = g; ctx.fillRect(0, -h / 2, Math.min(SEG, L - x) + 0.7, h);
        ctx.restore();
      }
      // Printed scale. Marks are measured from the hook, so the number at the mouth is the reading.
      const sub = ppu >= 9 ? 5 : ppu >= 5 ? 2 : 1;
      const top = -h / 2 + h * 0.05, face = h * 0.86;
      const count = Math.ceil(L / ppu) + 1;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (let i = 0; i <= count * sub; i++) {
        const d = i / sub, x = L - d * ppu;
        if (x < -2 || d > MAX - MIN + 0.01) continue;
        const whole = i % sub === 0, n = Math.round(d), ten = whole && n % 10 === 0, five = whole && n % 5 === 0;
        ctx.save(); ctx.translate(mx + x, my + c.y(x)); ctx.rotate(Math.atan(c.slope(x)));
        const len = ten ? face * 0.36 : five ? face * 0.44 : whole ? face * 0.32 : face * 0.17;
        ctx.fillStyle = whole ? "rgba(24,20,8,0.92)" : "rgba(24,20,8,0.7)";
        ctx.fillRect(-(whole ? 0.6 : 0.35), top, whole ? 1.2 : 0.7, len);
        if (!whole) ctx.fillRect(-0.35, top + face - len * 0.8, 0.7, len * 0.8);
        if (n > 0 && ten) {
          ctx.font = `800 ${h * 0.4}px ui-sans-serif, system-ui, Helvetica, Arial, sans-serif`;
          ctx.fillStyle = "#b3190f"; ctx.fillText(String(n + MIN), 0, h * 0.14);
        } else if (n > 0 && whole && (five || ppu >= 14)) {
          ctx.font = `700 ${h * (five ? 0.29 : 0.24)}px ui-sans-serif, system-ui, Helvetica, Arial, sans-serif`;
          ctx.fillStyle = "rgba(24,20,8,0.9)"; ctx.fillText(String(five ? n + MIN : n % 10), 0, h * 0.2);
        }
        ctx.restore();
      }
      // A thin run of light along the curl of the steel, and the shade the case throws on the first inch.
      ctx.lineCap = "round";
      for (const [off, wd, col] of [[-0.19, 1.6, "rgba(255,255,255,0.55)"], [0.39, 0.8, "rgba(255,255,255,0.28)"]] as [number, number, string][]) {
        ctx.beginPath();
        for (let x = 0; x <= L; x += 6) { const a = Math.atan(c.slope(x)); ctx.lineTo(mx + x - Math.sin(a) * h * off, my + c.y(x) + Math.cos(a) * h * off); }
        ctx.lineWidth = wd * k; ctx.strokeStyle = col; ctx.stroke();
      }
      const shade = ctx.createLinearGradient(mx, 0, mx + 46 * k, 0);
      shade.addColorStop(0, "rgba(20,12,0,0.5)"); shade.addColorStop(1, "rgba(20,12,0,0)");
      ctx.fillStyle = shade; ctx.fillRect(mx, my - h / 2 - 1, Math.min(L, 46 * k), h + 4);
    };

    const drawHook = (L: number, c: ReturnType<typeof curve>) => {
      const h = BH;
      ctx.save(); ctx.translate(mx + L, my + c.y(L)); ctx.rotate(Math.atan(c.slope(L)));
      const steel = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      steel.addColorStop(0, "#f4f5f6"); steel.addColorStop(0.35, "#c9cdd2"); steel.addColorStop(0.7, "#9097a0"); steel.addColorStop(1, "#5c626a");
      // The riveted tongue on top of the blade.
      rr(-24 * k, -h / 2 + h * 0.16, 25 * k, h * 0.64, [3 * k, 0, 0, 3 * k]); ctx.fillStyle = steel; ctx.fill();
      ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(40,44,50,0.65)"; ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillRect(-23 * k, -h / 2 + h * 0.18, 22 * k, 0.9);
      for (const ry of [-0.12, 0.2]) {
        const g = ctx.createRadialGradient(-13 * k - 0.8, h * ry - 0.8, 0.2, -13 * k, h * ry, 3.1 * k);
        g.addColorStop(0, "#ffffff"); g.addColorStop(0.5, "#aab0b8"); g.addColorStop(1, "#4b5058");
        ctx.beginPath(); ctx.arc(-13 * k, h * ry, 3 * k, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      }
      // The end tab that catches the edge of the work.
      const tab = ctx.createLinearGradient(-1, 0, 6 * k, 0);
      tab.addColorStop(0, "#f7f8f9"); tab.addColorStop(0.3, "#d5d9de"); tab.addColorStop(1, "#6c727b");
      rr(-0.5, -h / 2 - 2 * k, 5.5 * k, h + 17 * k, [1.5, 1.5, 3 * k, 3 * k]); ctx.fillStyle = tab; ctx.fill();
      ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(40,44,50,0.7)"; ctx.stroke();
      ctx.restore();
    };

    const screw = (x: number, y: number, turn: number) => {
      ctx.beginPath(); ctx.arc(x, y, 6.6, 0, Math.PI * 2); ctx.fillStyle = "rgba(60,36,0,0.5)"; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y + 0.7, 6.3, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,240,180,0.55)"; ctx.fill();
      const g = ctx.createRadialGradient(x - 1.6, y - 2, 0.4, x, y, 5.4);
      g.addColorStop(0, "#fbfbfc"); g.addColorStop(0.55, "#aeb3ba"); g.addColorStop(1, "#555b63");
      ctx.beginPath(); ctx.arc(x, y, 5.3, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      ctx.save(); ctx.translate(x, y); ctx.rotate(turn); ctx.fillStyle = "rgba(20,22,26,0.82)";
      ctx.fillRect(-3.5, -0.75, 7, 1.5); ctx.fillRect(-0.75, -3.5, 1.5, 7); ctx.restore();
    };

    const drawCase = () => {
      ctx.save(); ctx.translate(cx0 + s.kick, cy0); ctx.scale(k, k);
      // Rubber jacket.
      rr(0, 0, CW, CH, OUT);
      const rub = ctx.createLinearGradient(0, 0, CW * 0.6, CH);
      rub.addColorStop(0, "#3d3e42"); rub.addColorStop(0.35, "#232427"); rub.addColorStop(1, "#0f0f11");
      ctx.fillStyle = rub; ctx.fill();
      if (speckle) { ctx.save(); ctx.clip(); ctx.globalAlpha = 0.5; ctx.fillStyle = speckle; ctx.fillRect(0, 0, CW, CH); ctx.restore(); }
      rr(0.8, 0.8, CW - 1.6, CH - 1.6, OUT);
      const rim = ctx.createLinearGradient(0, 0, CW * 0.5, CH);
      rim.addColorStop(0, "rgba(255,255,255,0.5)"); rim.addColorStop(0.3, "rgba(255,255,255,0.06)"); rim.addColorStop(1, "rgba(0,0,0,0.6)");
      ctx.lineWidth = 1.6; ctx.strokeStyle = rim; ctx.stroke();
      // Grip ribs moulded into the heel.
      for (let i = 0; i < 6; i++) {
        const x = 16 + i * 8.5;
        ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(x, CH - 30, 3.2, 20);
        ctx.fillStyle = "rgba(255,255,255,0.13)"; ctx.fillRect(x + 3.2, CH - 30, 1, 20);
      }
      // The plastic shell that shows through the jacket.
      rr(11, 10, CW - 22, CH - 56, [41, 35, 12, 12]);
      const sh = ctx.createLinearGradient(20, 10, CW - 20, CH - 40);
      sh.addColorStop(0, SHELL[0]); sh.addColorStop(0.45, SHELL[1]); sh.addColorStop(1, SHELL[2]);
      ctx.fillStyle = sh; ctx.fill();
      ctx.save(); ctx.clip();
      if (speckle) { ctx.globalAlpha = 0.22; ctx.fillStyle = speckle; ctx.fillRect(0, 0, CW, CH); ctx.globalAlpha = 1; }
      const gloss = ctx.createRadialGradient(46, 22, 4, 46, 22, 120);
      gloss.addColorStop(0, "rgba(255,255,255,0.55)"); gloss.addColorStop(0.4, "rgba(255,255,255,0.1)"); gloss.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gloss; ctx.fillRect(0, 0, CW, CH);
      const under = ctx.createLinearGradient(0, CH - 80, 0, CH - 46);
      under.addColorStop(0, "rgba(120,60,0,0)"); under.addColorStop(1, "rgba(120,60,0,0.3)");
      ctx.fillStyle = under; ctx.fillRect(0, CH - 80, CW, 40);
      ctx.restore();
      rr(11.8, 10.8, CW - 23.6, CH - 57.6, [40, 34, 11, 11]);
      const bev = ctx.createLinearGradient(11, 10, CW - 30, CH - 40);
      bev.addColorStop(0, "rgba(255,255,255,0.85)"); bev.addColorStop(0.35, "rgba(255,255,255,0.1)"); bev.addColorStop(1, "rgba(90,50,0,0.55)");
      ctx.lineWidth = 1.5; ctx.strokeStyle = bev; ctx.stroke();
      rr(10.4, 9.4, CW - 20.8, CH - 54.8, [41.5, 35.5, 12.5, 12.5]);
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(0,0,0,0.7)"; ctx.stroke();

      // Centre badge: a spun steel ring around a black label.
      const bx = 72, by = 62;
      ctx.save(); ctx.shadowColor = "rgba(70,40,0,0.5)"; ctx.shadowBlur = 7 * dpr; ctx.shadowOffsetY = 3 * dpr;
      ctx.beginPath(); ctx.arc(bx, by, 37, 0, Math.PI * 2); ctx.fillStyle = "#777"; ctx.fill(); ctx.restore();
      let ring: CanvasGradient;
      if (typeof ctx.createConicGradient === "function") {
        ring = ctx.createConicGradient(-2.3, bx, by);
        for (const [p, v] of [[0, 250], [0.08, 190], [0.2, 96], [0.32, 170], [0.45, 240], [0.5, 205], [0.58, 110], [0.72, 80], [0.85, 160], [0.94, 228], [1, 250]] as [number, number][]) ring.addColorStop(p, `rgb(${v - 3},${v},${v + 4})`);
      } else { ring = ctx.createLinearGradient(bx - 37, by - 37, bx + 37, by + 37); ring.addColorStop(0, "#f4f5f6"); ring.addColorStop(1, "#6a6f77"); }
      ctx.beginPath(); ctx.arc(bx, by, 37, 0, Math.PI * 2); ctx.fillStyle = ring; ctx.fill();
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.stroke();
      const disc = ctx.createRadialGradient(bx - 10, by - 14, 2, bx, by, 32);
      disc.addColorStop(0, "#3a3b3f"); disc.addColorStop(0.6, "#18181a"); disc.addColorStop(1, "#0b0b0c");
      ctx.beginPath(); ctx.arc(bx, by, 31, 0, Math.PI * 2); ctx.fillStyle = disc; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(0,0,0,0.85)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(bx, by, 26.5, 0, Math.PI * 2); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(244,185,12,0.75)"; ctx.stroke();
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = SHELL[1];
      ctx.font = "800 21px ui-sans-serif, system-ui, Helvetica, Arial, sans-serif"; ctx.fillText(String(MAX), bx, by - 3);
      ctx.font = "700 6.5px ui-monospace, SFMono-Regular, Menlo, monospace"; ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.fillText(UNIT.toUpperCase() + "  CLASS II", bx, by + 13);
      const glint = ctx.createLinearGradient(bx - 30, by - 30, bx + 10, by + 6);
      glint.addColorStop(0, "rgba(255,255,255,0.2)"); glint.addColorStop(0.5, "rgba(255,255,255,0)");
      ctx.beginPath(); ctx.arc(bx, by, 31, 0, Math.PI * 2); ctx.fillStyle = glint; ctx.fill();

      screw(28, 100, 0.5); screw(132, 100, 1.2); screw(120, 22, 0.2);

      // Steel guard where the blade leaves the case.
      const gd = ctx.createLinearGradient(CW - 15, 0, CW + 3, 0);
      gd.addColorStop(0, "#8d939b"); gd.addColorStop(0.35, "#eef0f2"); gd.addColorStop(0.7, "#b9bec5"); gd.addColorStop(1, "#5d636b");
      rr(CW - 15, CH - 45, 18, 41, [2, 2, 2, 2]); ctx.fillStyle = gd; ctx.fill();
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.stroke();
      ctx.fillStyle = "#0a0a0b"; ctx.fillRect(CW - 0.5, CH - 41, 3.5, 33);

      // Thumb lock: a slot in the shoulder and a ribbed tab that slides down to pinch the blade.
      rr(CW - 31, 31, 14, 48, [7, 7, 7, 7]); ctx.fillStyle = "#070708"; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.16)"; ctx.stroke();
      const ty = 30 + s.lockPos * 25;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 5 * dpr; ctx.shadowOffsetY = 2.5 * dpr;
      rr(CW - 37, ty, 43, 25, [6, 9, 9, 6]);
      const tg = ctx.createLinearGradient(0, ty, 0, ty + 25);
      tg.addColorStop(0, "#ff8a7c"); tg.addColorStop(0.16, TAB); tg.addColorStop(0.75, "#b7241a"); tg.addColorStop(1, "#7f150e");
      ctx.fillStyle = tg; ctx.fill(); ctx.restore();
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = "rgba(70,0,0,0.6)"; ctx.fillRect(CW - 30, ty + 5 + i * 4.4, 28, 1.5);
        ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(CW - 30, ty + 6.5 + i * 4.4, 28, 0.7);
      }
      ctx.font = "700 6px ui-monospace, SFMono-Regular, Menlo, monospace"; ctx.textAlign = "right"; ctx.fillStyle = "rgba(60,36,0,0.8)";
      ctx.fillText("LOCK", CW - 41, 87);
      ctx.beginPath(); ctx.moveTo(CW - 54, 92); ctx.lineTo(CW - 46, 92); ctx.lineTo(CW - 50, 97); ctx.closePath(); ctx.fill();
      ctx.restore();
    };

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const L = Math.max(0, (s.u - MIN) * ppu), c = curve(L, t);
      // Shadows on the backdrop a hand's width behind: the case, then the blade.
      ctx.save();
      ctx.shadowColor = "rgba(70,52,20,0.34)"; ctx.shadowBlur = 34 * dpr; ctx.shadowOffsetX = 14 * dpr; ctx.shadowOffsetY = 30 * dpr;
      ctx.translate(cx0 + s.kick, cy0); ctx.scale(k, k); rr(4, 4, CW - 8, CH - 8, OUT); ctx.fillStyle = "#222"; ctx.fill();
      ctx.restore();
      if (L > 2) {
        ctx.save();
        ctx.shadowColor = "rgba(70,52,20,0.3)"; ctx.shadowBlur = 20 * dpr; ctx.shadowOffsetX = 12 * dpr; ctx.shadowOffsetY = 34 * dpr;
        ctx.beginPath(); for (let x = 0; x <= L; x += 8) ctx.lineTo(mx + x, my + c.y(x)); ctx.lineTo(mx + L, my + c.y(L));
        ctx.lineWidth = BH * 0.5; ctx.strokeStyle = "#caa21c"; ctx.stroke();
        ctx.restore();
      }
      drawBlade(L, c);
      drawHook(L, c);
      drawCase();
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, demoAt = 0, step = 0;
    // The self-running demo: it opens on the finished pull, then shows the lock and the rewind.
    const script: [number, () => void][] = [
      [650, () => { s.target = START; }],
      [4300, () => { s.locked = false; s.held = false; }],
      [5900, () => { s.held = true; s.target = MIN + (MAX - MIN) * 0.38; }],
      [7300, () => { s.locked = true; s.held = false; }],
      [8700, () => { s.target = START; }],
      [12600, () => { demoAt += 8300; step = 1; }],
    ];
    const publish = () => {
      const v = s.keyed ? s.target : snap(s.u); // a key press shows its result at once, the blade catches up
      if (v !== s.shown) { s.shown = v; setValue(v); }
      if (s.locked !== s.lockShown) { s.lockShown = s.locked; setLocked(s.locked); }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; demoAt = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (DEMO && now - touched > 6000) {
        if (touched > 0) { touched = -1e9; s.keyed = false; demoAt = now - 7300; step = 4; s.locked = true; s.held = false; s.target = snap(s.u); }
        while (step < script.length && now - demoAt >= script[step][0]) { const run = script[step][1]; step++; run(); }
      }
      const before = s.uv;
      if (s.drag) {
        const nu = s.u + (s.raw - s.u) * Math.min(1, dt * 28);
        s.uv = (nu - s.u) / Math.max(dt, 0.001); s.u = nu;
      } else if (s.locked || s.held) {
        s.uv += (120 * (s.target - s.u) - 17 * s.uv) * dt; s.u += s.uv * dt;
      } else if (s.u > MIN || s.uv !== 0) {
        // Lock off and nobody holding: the spring in the case wins.
        s.uv += (-26 * (s.u - MIN) - 1.6 * s.uv - (MAX - MIN) * 4.2) * dt; s.u += s.uv * dt;
        if (s.u <= MIN) { s.kickV += s.uv * ppu * 0.05; s.wobV -= 60; s.u = MIN; s.uv = Math.abs(s.uv) > (MAX - MIN) * 0.5 ? -s.uv * 0.16 : 0; s.target = MIN; }
      }
      s.wobV += (-150 * s.wob - 7 * s.wobV) * dt + (s.uv - before) * ppu * 0.05;
      s.wob = Math.max(-46, Math.min(46, s.wob + s.wobV * dt));
      s.kickV += (-700 * s.kick - 30 * s.kickV) * dt; s.kick += s.kickV * dt;
      s.lockPos += ((s.locked ? 1 : 0) - s.lockPos) * Math.min(1, dt * 22);
      publish();
      draw(now - t0);
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const still = () => {
      if (!s.locked && !s.drag && !s.held) s.target = MIN;
      if (!s.drag) s.u = s.target;
      s.uv = 0; s.wob = 0; s.kick = 0; s.lockPos = s.locked ? 1 : 0; publish(); draw(0);
    };
    const refresh = () => { if (reduce) still(); else wake(); };

    api.current = {
      // Arrow keys always engage the lock, so a keyboard user never watches a value rewind.
      set: (v) => { touched = performance.now(); s.locked = true; s.held = false; s.keyed = true; s.target = snap(v); publish(); refresh(); },
      lock: (on) => { touched = performance.now(); s.locked = on; s.held = false; s.keyed = false; if (on) s.target = snap(s.u); refresh(); },
    };

    layout();
    if (reduce) { s.u = s.target = START; still(); } else wake();

    let startX = 0, startU = 0;
    const onDown = (e: PointerEvent) => {
      touched = performance.now(); s.drag = true; s.keyed = false; startX = e.clientX; startU = s.u; s.raw = s.u;
      cv.setPointerCapture(e.pointerId); wake();
    };
    const onMove = (e: PointerEvent) => {
      if (!s.drag) return;
      touched = performance.now();
      let u = startU + (e.clientX - startX) / ppu;
      if (u > MAX) u = MAX + (u - MAX) * 0.12; // the blade is riveted to the drum, so the end gives only a little
      if (u < MIN) u = MIN;
      s.raw = u;
      if (reduce) { s.u = u; still(); }
    };
    const onUp = () => {
      if (!s.drag) return;
      s.drag = false; touched = performance.now(); s.target = snap(s.u);
      if (reduce) still();
    };
    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(() => { layout(); if (reduce) still(); else { draw(performance.now() - t0); wake(); } });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onUp); cv.removeEventListener("pointercancel", onUp);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="flex min-h-[620px] w-full flex-col items-center justify-center bg-[#e9e3d6] bg-[radial-gradient(90%_70%_at_38%_30%,#f6f1e7_0%,#e9e3d6_55%,#dcd4c3_100%)] px-3 py-10 sm:min-h-[740px] sm:px-8">
      <div className="relative w-full max-w-[920px]">
        <canvas ref={canvas} aria-hidden="true" className="block h-[300px] w-full cursor-grab touch-pan-y select-none active:cursor-grabbing sm:h-[470px]" />
        <button
          ref={lockBtn}
          type="button"
          aria-pressed={locked}
          aria-label="Blade lock"
          onClick={() => api.current?.lock(!locked)}
          className="absolute h-16 w-12 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4b90c]"
        />
      </div>
      <div className="flex w-full max-w-[920px] items-end justify-between gap-4 px-2 sm:px-9">
        <div>
          <input
            id="tape-measure-range"
            type="range"
            min={MIN}
            max={MAX}
            step={STEP}
            value={value}
            aria-valuetext={`${value} ${UNIT}`}
            onChange={(e) => api.current?.set(Number(e.target.value))}
            className="peer sr-only"
          />
          <label htmlFor="tape-measure-range" className="block rounded-md px-1 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-600 peer-focus-visible:ring-2 peer-focus-visible:ring-stone-900">
            {LABEL}
          </label>
          <output htmlFor="tape-measure-range" className="mt-1 block px-1 text-5xl font-semibold tabular-nums tracking-tight text-stone-900 sm:text-6xl">
            {value}
            <span className="ml-2 text-xl font-medium text-stone-500 sm:text-2xl">{UNIT}</span>
          </output>
        </div>
        <p aria-live="polite" className="max-w-[190px] pb-2 text-right font-mono text-[11px] uppercase leading-5 tracking-[0.14em] text-stone-600">
          <span className="text-stone-900">{locked ? "Lock on" : "Lock off"}</span>
          <br />
          {locked ? "Pull the blade or use the arrow keys" : "Let go and it rewinds to zero"}
        </p>
      </div>
    </div>
  );
}

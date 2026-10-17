import { useEffect, useId, useRef, useState } from "react";

// One pin per rule, front of the lock to the back. Four to six rules fit.
const rules: { label: string; test: (p: string) => boolean }[] = [
  { label: "10 characters", test: (p) => p.length >= 10 },
  { label: "Capital letter", test: (p) => /[A-Z]/.test(p) },
  { label: "Small letter", test: (p) => /[a-z]/.test(p) },
  { label: "Number", test: (p) => /[0-9]/.test(p) },
  { label: "Symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];
const DEMO = "Brass-Otter-42"; // what the lock types by itself until someone clicks into the field
const LAMP = "#6ee7b7"; // lamp above a set pin, and the line the pins meet on
const CUTS = [8, 24, 14, 30, 18, 22]; // how deep each cut in the key ends up

const N = rules.length;
const W = 760, H = 400, AX = 246, PR = 52, SH = AX - PR, KT = SH + 30, KB = KT + 58, SX0 = 252, SX1 = 620, TOP = 56, CH = 82;
const pinX = (i: number) => 322 + (N === 1 ? 124 : (i * 248) / (N - 1));
const check = (p: string) => rules.map((r) => r.test(p));

export default function PinTumblerPasswordField() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [value, setValue] = useState(DEMO);
  const [show, setShow] = useState(false);
  const met = check(value);
  const metRef = useRef<boolean[]>(met);
  const api = useRef<{ type: (v: string) => void; stop: () => boolean } | null>(null);
  const id = useId();
  const count = met.filter(Boolean).length, strong = count === N;

  useEffect(() => {
    const cv = canvas.current, box = wrap.current;
    if (!cv || !box) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let K = 1;
    const s = { cut: CUTS.slice(0, N), cutV: rules.map(() => 0), hop: 0, hopV: 0, kx: 0, kxV: 0, turn: 0, turnV: 0, bolt: 1, boltV: 0, glint: -1, lamp: rules.map(() => 1) };

    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    };
    const lin = (x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); for (const [p, c] of stops) g.addColorStop(p, c); return g; };
    const shadow = (shape: () => void, blur: number, dx: number, dy: number, alpha: number) => {
      ctx.save(); ctx.shadowColor = `rgba(0,0,0,${alpha})`; ctx.shadowBlur = blur * K; ctx.shadowOffsetX = (dx + 3000) * K; ctx.shadowOffsetY = dy * K;
      ctx.translate(-3000, 0); ctx.fillStyle = "#000"; shape(); ctx.restore();
    };
    // Section hatching, the draughtsman's way of saying "this face has been cut".
    const hatch = (x: number, y: number, w: number, h: number, lean: number, alpha: number) => {
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.lineWidth = 1;
      for (let d = -h; d < w + h; d += 8) {
        ctx.beginPath(); ctx.moveTo(x + d, lean > 0 ? y + h : y); ctx.lineTo(x + d + h, lean > 0 ? y : y + h);
        ctx.strokeStyle = `rgba(70,44,6,${alpha})`; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + d + 1, lean > 0 ? y + h : y); ctx.lineTo(x + d + h + 1, lean > 0 ? y : y + h);
        ctx.strokeStyle = `rgba(255,240,196,${alpha * 0.7})`; ctx.stroke();
      }
      ctx.restore();
    };
    const STEEL: [number, string][] = [[0, "#565b62"], [0.22, "#dfe4e8"], [0.36, "#ffffff"], [0.55, "#aab1b8"], [0.82, "#646a72"], [1, "#33363b"]];
    const COPPER: [number, string][] = [[0, "#5c2408"], [0.22, "#e9955a"], [0.36, "#ffd2ae"], [0.55, "#c9682f"], [0.82, "#84360f"], [1, "#43190a"]];
    const depth = (x: number) => { let d = 0; for (let i = 0; i < N; i++) d = Math.max(d, Math.min(s.cut[i], s.cut[i] - (Math.abs(x - pinX(i)) - 6))); return Math.max(0, d); };

    const draw = () => {
      ctx.setTransform(K, 0, 0, K, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineCap = "round"; ctx.lineJoin = "round";
      const turned = Math.max(0, Math.min(1, s.turn)), phi = (turned * Math.PI) / 2, flat = Math.max(0.13, Math.cos(phi)), inside = Math.max(0, Math.min(1, Math.cos(phi) * 1.5));
      const allSet = s.lamp.reduce((a, b) => a + b, 0) / N;
      const throwOut = Math.max(0, s.bolt);

      shadow(() => { ctx.beginPath(); ctx.ellipse(430, 352, 250, 13, 0, 0, Math.PI * 2); ctx.fill(); }, 22, 0, 0, 0.75);

      // Behind the cylinder: tailpiece, bolt case and the bolt it throws.
      const tail = 6 + 9 * Math.sin(phi);
      ctx.fillStyle = lin(0, AX - tail, 0, AX + tail, STEEL); ctx.fillRect(SX1, AX - tail, 40, tail * 2);
      ctx.fillStyle = lin(0, AX - 19, 0, AX + 19, STEEL); rr(700, AX - 19, 12 + 34 * throwOut, 38, 4); ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(700, AX - 19, 8, 38);
      rr(650, AX - 46, 56, 92, 7); ctx.fillStyle = lin(0, AX - 46, 0, AX + 46, [[0, "#4a4e55"], [0.08, "#2c2f34"], [0.6, "#1a1c1f"], [1, "#0b0c0d"]]); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 1; rr(650.5, AX - 45.5, 55, 91, 7); ctx.stroke();
      for (const sy of [AX - 34, AX + 34]) { ctx.beginPath(); ctx.arc(678, sy, 4, 0, Math.PI * 2); ctx.fillStyle = "#0a0a0b"; ctx.fill(); ctx.beginPath(); ctx.arc(678, sy - 0.6, 3, 0, Math.PI * 2); ctx.fillStyle = "#565a61"; ctx.fill(); ctx.fillStyle = "#111"; ctx.fillRect(675.4, sy - 1.1, 5.2, 1.2); }

      // The brass shell, cut down the middle.
      rr(SX0, TOP, SX1 - SX0, AX + PR + 18 - TOP, 14);
      ctx.fillStyle = lin(0, TOP, 0, AX + PR + 18, [[0, "#f1d68c"], [0.05, "#deb964"], [0.5, "#c59a45"], [0.92, "#a67c2d"], [1, "#7c5a1a"]]); ctx.fill();
      hatch(SX0, TOP, SX1 - SX0, AX + PR + 18 - TOP, 1, 0.16);
      ctx.save(); rr(SX0, TOP, SX1 - SX0, AX + PR + 18 - TOP, 14); ctx.clip();
      const bloom = ctx.createRadialGradient(330, TOP + 20, 10, 330, TOP + 20, 300); bloom.addColorStop(0, "rgba(255,250,224,0.42)"); bloom.addColorStop(1, "rgba(255,250,224,0)");
      ctx.fillStyle = bloom; ctx.fillRect(SX0, TOP, SX1 - SX0, 300);
      // the turned outside of the shell shows as a polished lip top and bottom
      ctx.fillStyle = lin(0, TOP, 0, TOP + 9, [[0, "#fff6cf"], [0.5, "#e9c877"], [1, "#8a651c"]]); ctx.fillRect(SX0, TOP, SX1 - SX0, 9);
      ctx.fillStyle = lin(0, AX + PR + 9, 0, AX + PR + 18, [[0, "#3d2a06"], [0.4, "#a37a2a"], [1, "#5f4410"]]); ctx.fillRect(SX0, AX + PR + 9, SX1 - SX0, 9);
      ctx.fillStyle = lin(0, SH - 12, 0, SH, [[0, "rgba(50,28,0,0)"], [1, "rgba(50,28,0,0.4)"]]); ctx.fillRect(SX0, SH - 12, SX1 - SX0, 12);
      ctx.fillStyle = lin(SX1 - 16, 0, SX1, 0, [[0, "rgba(50,28,0,0)"], [1, "rgba(50,28,0,0.45)"]]); ctx.fillRect(SX1 - 16, TOP, 16, 300);
      ctx.restore();

      // Pin chambers, each with a lamp above it.
      for (let i = 0; i < N; i++) {
        const x = pinX(i), on = s.lamp[i];
        ctx.fillStyle = lin(x - 12, 0, x + 12, 0, [[0, "#070504"], [0.3, "#1b1409"], [0.8, "#241a0b"], [1, "#0d0906"]]); ctx.save(); ctx.shadowColor = "rgba(40,22,0,0.7)"; ctx.shadowBlur = 7 * K; rr(x - 12, CH - 4, 24, SH - CH + 5, 3); ctx.fill(); ctx.restore();
        ctx.fillStyle = "rgba(255,240,200,0.35)"; ctx.fillRect(x + 12, CH, 1, SH - CH);
        ctx.beginPath(); ctx.arc(x, TOP + 12, 4.4, 0, Math.PI * 2); ctx.fillStyle = "#2a1c05"; ctx.fill();
        ctx.save(); ctx.shadowColor = LAMP; ctx.shadowBlur = 14 * on * K; ctx.globalAlpha = 0.12 + 0.88 * on;
        ctx.beginPath(); ctx.arc(x, TOP + 12, 3.1, 0, Math.PI * 2); ctx.fillStyle = LAMP; ctx.fill(); ctx.restore();
        ctx.beginPath(); ctx.arc(x - 1, TOP + 11, 0.9, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.6 * on})`; ctx.fill();
      }

      // The plug: a redder brass so the line it shears on is easy to find.
      ctx.fillStyle = lin(0, SH, 0, AX + PR, [[0, "#e7b872"], [0.5, "#c98f47"], [1, "#9a6526"]]); ctx.fillRect(SX0, SH, SX1 - SX0 + 4, PR * 2);
      hatch(SX0, SH, SX1 - SX0 + 4, PR * 2, -1, 0.14);
      ctx.fillStyle = lin(0, SH, 0, SH + 14, [[0, "rgba(50,24,0,0.38)"], [1, "rgba(50,24,0,0)"]]); ctx.fillRect(SX0, SH, SX1 - SX0 + 4, 14);
      ctx.fillStyle = lin(0, AX + PR - 16, 0, AX + PR, [[0, "rgba(50,24,0,0)"], [1, "rgba(50,24,0,0.45)"]]); ctx.fillRect(SX0, AX + PR - 16, SX1 - SX0 + 4, 16);
      ctx.fillStyle = "rgba(30,16,0,0.85)"; ctx.fillRect(SX0, SH - 0.9, SX1 - SX0, 1.8); ctx.fillRect(SX0, AX + PR - 0.7, SX1 - SX0, 1.4);
      ctx.save(); ctx.globalAlpha = allSet * allSet; ctx.shadowColor = LAMP; ctx.shadowBlur = 10 * K; ctx.fillStyle = LAMP; ctx.fillRect(SX0 + 6, SH - 0.7, SX1 - SX0 - 12, 1.4); ctx.restore();

      // Everything that lives in the plug turns with it: keyway, lower chambers, key pins and the key.
      ctx.save(); ctx.translate(0, AX); ctx.scale(1, flat); ctx.translate(0, -AX);
      ctx.save(); ctx.globalAlpha = inside;
      ctx.fillStyle = "#120c05"; ctx.fillRect(SX0, KT - 3, SX1 - SX0 - 10, KB - KT + 6);
      for (let i = 0; i < N; i++) { const x = pinX(i); ctx.fillStyle = lin(x - 12, 0, x + 12, 0, [[0, "#070504"], [0.3, "#1b1409"], [0.8, "#241a0b"], [1, "#0d0906"]]); ctx.fillRect(x - 12, SH + 1, 24, KT - SH); }
      ctx.restore();

      // The key.
      ctx.save(); ctx.translate(s.kx, 0);
      const metal = lin(0, AX - 70, 0, AX + 76, [[0, "#fbfcfc"], [0.12, "#d5dade"], [0.5, "#a3aab1"], [0.86, "#70767d"], [1, "#3f4348"]]);
      shadow(() => { rr(58, AX - 60, 164, 134, 56); ctx.fill(); }, 16, 5, 9, 0.55);
      ctx.fillStyle = metal;
      rr(58, AX - 60, 164, 134, 56); ctx.fill(); ctx.fillRect(206, KT, 50, KB - KT);
      ctx.beginPath(); ctx.moveTo(250, KT);
      for (let x = 252; x <= 588; x += 2) ctx.lineTo(x, KT + depth(x));
      ctx.lineTo(598, KT + 22); ctx.lineTo(608, KT + 38); ctx.lineTo(596, KB); ctx.lineTo(250, KB); ctx.closePath(); ctx.fill();
      // bright milled edge along the cuts, two long grooves, bevel round the bow
      ctx.beginPath(); ctx.moveTo(252, KT + 0.8); for (let x = 252; x <= 588; x += 2) ctx.lineTo(x, KT + depth(x) + 0.8); ctx.lineTo(598, KT + 22.8);
      ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1; ctx.stroke();
      for (const gy of [KT + 34, KT + 45]) { ctx.fillStyle = "rgba(20,24,28,0.5)"; ctx.fillRect(236, gy, 362, 1.6); ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.fillRect(236, gy + 1.6, 362, 1); }
      ctx.fillStyle = "rgba(20,22,26,0.35)"; ctx.fillRect(250, KB - 2, 346, 2);
      ctx.save(); rr(58, AX - 60, 164, 134, 56); ctx.clip();
      ctx.fillStyle = lin(70, AX - 60, 200, AX + 74, [[0, "rgba(255,255,255,0)"], [0.3, "rgba(255,255,255,0.42)"], [0.4, "rgba(255,255,255,0.06)"], [0.62, "rgba(255,255,255,0)"], [0.72, "rgba(255,255,255,0.2)"], [0.8, "rgba(255,255,255,0)"], [1, "rgba(0,0,0,0.22)"]]); ctx.fillRect(58, AX - 60, 164, 134);
      ctx.restore();
      ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.7)"; rr(60, AX - 58, 160, 130, 54); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(30,34,40,0.4)"; rr(69, AX - 49, 142, 112, 46); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; rr(70, AX - 48, 140, 110, 45); ctx.stroke();
      ctx.beginPath(); ctx.arc(100, AX + 7, 17, 0, Math.PI * 2); ctx.fillStyle = "#0e1110"; ctx.fill();
      ctx.lineWidth = 2.4; ctx.strokeStyle = "rgba(40,44,50,0.9)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(100, AX + 7, 18.6, 0.2, Math.PI * 0.9); ctx.lineWidth = 1.3; ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.stroke();
      ctx.font = "700 13px ui-monospace, SFMono-Regular, Menlo, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillText(`${N} PIN`, 163, AX + 8.9); ctx.fillStyle = "rgba(38,42,48,0.85)"; ctx.fillText(`${N} PIN`, 163, AX + 8);
      ctx.restore();

      // Key pins ride on the cuts.
      const lift = Math.max(0, s.hop);
      const tops: number[] = [];
      for (let i = 0; i < N; i++) {
        const x = pinX(i), len = 30 + CUTS[i], tip = KT + s.cut[i] - lift * (3 + (i % 3) * 2), top = tip - len;
        tops.push(top);
        ctx.save(); ctx.globalAlpha = inside;
        ctx.beginPath(); ctx.moveTo(x - 10, top + 2); ctx.quadraticCurveTo(x - 10, top, x - 8, top); ctx.lineTo(x + 8, top); ctx.quadraticCurveTo(x + 10, top, x + 10, top + 2);
        ctx.lineTo(x + 10, tip - 9); ctx.lineTo(x + 3, tip); ctx.lineTo(x - 3, tip); ctx.lineTo(x - 10, tip - 9); ctx.closePath();
        ctx.fillStyle = lin(x - 10, 0, x + 10, 0, STEEL); ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.28)"; ctx.fillRect(x - 10, tip - 10.5, 20, 1.5);
        ctx.restore();
      }
      ctx.restore();

      // Drivers and springs stay in the shell. A driver that straddles the line is what stops the plug.
      for (let i = 0; i < N; i++) {
        const x = pinX(i), bottom = turned > 0.02 ? SH : tops[i], top = bottom - 36;
        const coils = 6, span = top - (CH + 2);
        ctx.lineWidth = 2.3;
        for (let j = 0; j < coils; j++) {
          const y0 = CH + 2 + (span * j) / coils, y1 = CH + 2 + (span * (j + 0.5)) / coils, y2 = CH + 2 + (span * (j + 1)) / coils;
          ctx.strokeStyle = "#4d525a"; ctx.beginPath(); ctx.moveTo(x + 9, y1); ctx.lineTo(x - 9, y2); ctx.stroke();
          ctx.strokeStyle = "#e8ecef"; ctx.beginPath(); ctx.moveTo(x - 9, y0); ctx.lineTo(x + 9, y1); ctx.stroke();
        }
        rr(x - 10, top, 20, 36, 2.5); ctx.fillStyle = lin(x - 10, 0, x + 10, 0, COPPER); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(x - 9, top + 0.6, 18, 1);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(x - 10, bottom - 2, 20, 2);
      }

      // A slow band of light crossing the brass keeps the still lock alive.
      if (s.glint >= 0) {
        const gx = SX0 - 160 + s.glint * (SX1 - SX0 + 320);
        ctx.save(); rr(SX0, TOP, SX1 - SX0, AX + PR + 18 - TOP, 14); ctx.clip(); ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = lin(gx - 70, 0, gx + 70, 60, [[0, "rgba(255,244,210,0)"], [0.5, "rgba(255,244,210,0.2)"], [1, "rgba(255,244,210,0)"]]); ctx.fillRect(SX0, TOP, SX1 - SX0, 320); ctx.restore();
      }

      // Collar where the plug meets the door.
      rr(SX0 - 16, TOP - 8, 18, AX + PR + 34 - TOP, 5);
      ctx.fillStyle = lin(SX0 - 16, 0, SX0 + 2, 0, [[0, "#6f5118"], [0.25, "#f6dfa0"], [0.5, "#d2aa52"], [1, "#7d5c1c"]]); ctx.fill();
      ctx.fillStyle = "#0e0a05"; ctx.fillRect(SX0 - 16, AX - Math.max(3, 31 * flat), 18, Math.max(6, 62 * flat));
    };

    let raf = 0, last = 0, t0 = 0, seen = true, demo = !reduce, at = 3600, idx = DEMO.length, pulse = -1, bolted = metRef.current.every(Boolean);
    const snap = () => {
      const all = metRef.current.every(Boolean);
      s.cut = metRef.current.map((m, i) => (m ? CUTS[i] : 0)); s.turn = 0; s.bolt = all ? 1 : 0; s.lamp = metRef.current.map((m) => (m ? 1 : 0)); s.hop = 0; s.kx = 0; draw();
    };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0, m = metRef.current, all = m.every(Boolean);
      let settled = true;
      for (let i = 0; i < N; i++) {
        const want = s.turn > 0.12 || m[i] ? CUTS[i] : 0;
        s.cutV[i] += (300 * (want - s.cut[i]) - 15 * s.cutV[i]) * dt; s.cut[i] += s.cutV[i] * dt;
        if (Math.abs(want - s.cut[i]) > 0.8) settled = false;
        s.lamp[i] += ((m[i] ? 1 : 0) - s.lamp[i]) * Math.min(1, dt * 12);
      }
      // Once every stack agrees the key makes one quarter turn, throws the bolt and comes back upright.
      if (all && settled && !bolted && pulse < 0) pulse = t + 1150;
      if (!all) { bolted = false; if (pulse > t) pulse = t; }
      if (pulse > 0 && s.turn > 0.9) bolted = true;
      if (pulse > 0 && t >= pulse && s.turn < 0.04) pulse = -1;
      s.turnV += (80 * ((pulse > t ? 1 : 0) - s.turn) - 15 * s.turnV) * dt; s.turn += s.turnV * dt;
      s.boltV += (150 * ((bolted ? 1 : 0) - s.bolt) - 15 * s.boltV) * dt; s.bolt += s.boltV * dt;
      s.glint = ((t + 2600) % 5200) / 2400; if (s.glint > 1) s.glint = -1;
      s.hopV += (-420 * s.hop - 16 * s.hopV) * dt; s.hop += s.hopV * dt;
      s.kxV += (-600 * s.kx - 30 * s.kxV) * dt; s.kx += s.kxV * dt;
      if (demo && t > at) {
        if (idx >= DEMO.length) { idx = 0; type(""); setValue(""); at = t + 1300; }
        else { idx += 1; const v = DEMO.slice(0, idx); type(v); setValue(v); at = t + (idx >= DEMO.length ? 5200 : 150); }
      }
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const type = (v: string) => {
      metRef.current = check(v);
      if (reduce) { snap(); return; }
      if (s.turn < 0.2) { s.hopV = 26; s.kxV = 90; }
      wake();
    };
    const size = () => {
      const w = box.clientWidth, dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr); cv.height = Math.round((w * H) / W * dpr); K = cv.width / W; draw();
    };
    const ro = new ResizeObserver(size); ro.observe(box); size();
    api.current = { type, stop: () => { const was = demo; demo = false; return was; } };
    wake();
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const change = (v: string) => { api.current?.stop(); setValue(v); api.current?.type(v); };

  return (
    <div className="flex min-h-[640px] w-full flex-col items-center justify-center bg-[#0e1110] bg-[radial-gradient(80%_60%_at_50%_36%,#222926_0%,#0e1110_70%)] px-4 py-10 sm:min-h-[720px]">
      <div ref={wrap} className="w-full max-w-[860px]" style={{ aspectRatio: `${W} / ${H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="h-full w-full" />
      </div>
      <form className="mt-4 w-full max-w-[420px]" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor={id} className="block font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-300">New password</label>
        <div className="mt-2 flex items-stretch rounded-lg border border-[#3a3324] bg-[#171a18] focus-within:border-[#d9b35c] focus-within:ring-1 focus-within:ring-[#d9b35c]">
          <input
            id={id}
            type={show ? "text" : "password"}
            value={value}
            onFocus={() => { if (api.current?.stop()) change(""); }}
            onChange={(e) => change(e.target.value)}
            autoComplete="new-password"
            spellCheck={false}
            aria-describedby={`${id}-state`}
            className="h-12 min-w-0 flex-1 rounded-l-lg bg-transparent px-4 font-mono text-[16px] tracking-[0.08em] text-stone-100 outline-none placeholder:text-stone-500"
            placeholder="Type to cut the key"
          />
          <button type="button" aria-pressed={show} onClick={() => setShow((v) => !v)} className="rounded-r-lg px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e3c070] outline-none hover:text-[#f6e3ab] focus-visible:ring-2 focus-visible:ring-[#d9b35c]">
            {show ? "Hide" : "Show"}
          </button>
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {rules.map((r, i) => (
            <li key={r.label} className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-300 motion-reduce:transition-none ${met[i] ? "text-stone-100" : "text-stone-400"}`}>
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full transition-colors duration-300 motion-reduce:transition-none" style={{ backgroundColor: met[i] ? LAMP : "#4a4f4c" }} />
              {r.label}
              <span className="sr-only">{met[i] ? ", done" : ", still needed"}</span>
            </li>
          ))}
        </ul>
        <p id={`${id}-state`} aria-live="polite" className="mt-4 font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-stone-400">
          <span className="font-semibold text-stone-100">{count} of {N} pins set</span>
          <span className="mx-2 text-stone-600">/</span>
          {strong ? "Bolt thrown" : "A driver still blocks the line"}
        </p>
      </form>
    </div>
  );
}

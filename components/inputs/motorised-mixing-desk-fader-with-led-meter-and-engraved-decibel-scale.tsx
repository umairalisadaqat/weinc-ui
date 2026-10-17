import { useEffect, useRef, useState } from "react";

// The strip this fader belongs to, and the stops the motor visits while nobody is touching it.
const channel = { number: "04", name: "Lead vocal" };
const automation = [75, 44, 88, 60];
// Engraved scale: `p` is how far up the slot the mark sits (0 bottom, 1 top), `db` the gain there.
const marks = [
  { label: "+10", db: 10, p: 1 },
  { label: "+5", db: 5, p: 0.875 },
  { label: "0", db: 0, p: 0.75 },
  { label: "5", db: -5, p: 0.625 },
  { label: "10", db: -10, p: 0.5 },
  { label: "20", db: -20, p: 0.37 },
  { label: "30", db: -30, p: 0.25 },
  { label: "40", db: -40, p: 0.15 },
  { label: "60", db: -60, p: 0.06 },
  { label: "∞", db: -96, p: 0 },
];
const CAP = "#e9e1cd"; // the moulded cap
const INDEX = "#e23d2b"; // painted line across the cap and the unity mark
const LEDS = 24;
const W = 320, H = 580; // canvas size in CSS pixels

const dbAt = (p: number) => {
  for (let i = 0; i < marks.length - 1; i++) {
    const a = marks[i], b = marks[i + 1];
    if (p <= a.p && p >= b.p) return b.db + ((p - b.p) / (a.p - b.p)) * (a.db - b.db);
  }
  return marks[0].db;
};
const readout = (value: number) => {
  if (value <= 0) return "Off";
  const db = dbAt(value / 100);
  return `${db > 0.05 ? "+" : db < -0.05 ? "-" : ""}${Math.abs(db).toFixed(1)} dB`;
};

export default function MotorisedMixingDeskFader() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(automation[0]);
  const api = useRef<{ set: (v: number) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, pad = hit.current;
    if (!cv || !pad) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1) * 1.15;
    cv.width = W * dpr; cv.height = H * dpr;
    const SX = 178, LX = 104, Y0 = 478, Y1 = 104, TR = Y0 - Y1, CW = 52, CH = 82, LIFT = 8;
    const PX = 34, PY = 8, PW = 252, PH = 564;

    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };
    let seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // Everything that never moves is painted once: plate, grain, screws, slot, scale, unlit meter.
    const still = document.createElement("canvas");
    still.width = cv.width; still.height = cv.height;
    const sc = still.getContext("2d");
    if (sc) {
      sc.scale(dpr, dpr);
      sc.save(); sc.shadowColor = "rgba(0,0,0,0.7)"; sc.shadowBlur = 26; sc.shadowOffsetY = 14 * dpr;
      rr(sc, PX, PY, PW, PH, 9); sc.fillStyle = "#17181b"; sc.fill(); sc.restore();
      const body = sc.createLinearGradient(PX, 0, PX + PW, 0);
      body.addColorStop(0, "#2b2d31"); body.addColorStop(0.18, "#35373c"); body.addColorStop(0.5, "#2a2c30"); body.addColorStop(0.82, "#303236"); body.addColorStop(1, "#222427");
      rr(sc, PX, PY, PW, PH, 9); sc.fillStyle = body; sc.fill();
      // Brushed grain runs the length of the strip.
      sc.save(); rr(sc, PX, PY, PW, PH, 9); sc.clip();
      for (let i = 0; i < 1500; i++) {
        const x = PX + rand() * PW, y = PY - 40 + rand() * (PH + 40), len = 40 + rand() * 240, v = rand();
        sc.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.13})` : `rgba(0,0,0,${(0.5 - v) * 0.22})`;
        sc.fillRect(x, y, 0.5, len);
      }
      // Brushed metal answers a lamp with broad bands across the grain.
      for (const [y, h, a] of [[PY + 96, 150, 0.085], [PY + 372, 90, 0.045]]) {
        const band = sc.createLinearGradient(0, y - h, 0, y + h);
        band.addColorStop(0, "rgba(255,255,255,0)"); band.addColorStop(0.5, `rgba(235,240,255,${a})`); band.addColorStop(1, "rgba(255,255,255,0)");
        sc.fillStyle = band; sc.fillRect(PX, y - h, PW, h * 2);
      }
      const fall = sc.createLinearGradient(0, PY, 0, PY + PH);
      fall.addColorStop(0, "rgba(255,255,255,0.07)"); fall.addColorStop(0.3, "rgba(255,255,255,0)"); fall.addColorStop(1, "rgba(0,0,0,0.3)");
      sc.fillStyle = fall; sc.fillRect(PX, PY, PW, PH);
      sc.restore();
      const lip = sc.createLinearGradient(0, PY, 0, PY + PH);
      lip.addColorStop(0, "rgba(255,255,255,0.5)"); lip.addColorStop(0.06, "rgba(255,255,255,0.12)"); lip.addColorStop(0.9, "rgba(0,0,0,0.3)"); lip.addColorStop(1, "rgba(0,0,0,0.75)");
      rr(sc, PX + 0.6, PY + 0.6, PW - 1.2, PH - 1.2, 8.5); sc.lineWidth = 1.2; sc.strokeStyle = lip; sc.stroke();

      // Socket screws in the corners.
      for (const [x, y] of [[PX + 17, PY + 17], [PX + PW - 17, PY + 17], [PX + 17, PY + PH - 17], [PX + PW - 17, PY + PH - 17]]) {
        sc.beginPath(); sc.arc(x, y + 1, 7.4, 0, Math.PI * 2); sc.fillStyle = "rgba(0,0,0,0.55)"; sc.fill();
        const g = sc.createLinearGradient(x - 6, y - 6, x + 6, y + 6);
        g.addColorStop(0, "#9a9da3"); g.addColorStop(0.45, "#4b4d52"); g.addColorStop(1, "#1c1d20");
        sc.beginPath(); sc.arc(x, y, 6.4, 0, Math.PI * 2); sc.fillStyle = g; sc.fill();
        sc.beginPath(); sc.arc(x, y, 5.2, 0, Math.PI * 2); sc.strokeStyle = "rgba(255,255,255,0.22)"; sc.lineWidth = 0.6; sc.stroke();
        sc.beginPath();
        for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + x * 0.3; sc.lineTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3); }
        sc.closePath(); sc.fillStyle = "#08080a"; sc.fill(); sc.strokeStyle = "rgba(255,255,255,0.18)"; sc.lineWidth = 0.5; sc.stroke();
      }

      // Engraving: a dark cut with a paint fill sitting a fraction lower.
      const engrave = (text: string, x: number, y: number, font: string, colour: string, align: CanvasTextAlign) => {
        sc.font = font; sc.textAlign = align; sc.textBaseline = "middle";
        sc.fillStyle = "rgba(0,0,0,0.75)"; sc.fillText(text, x, y - 0.8);
        sc.fillStyle = colour; sc.fillText(text, x, y);
      };
      const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";
      engrave(channel.number, PX + PW / 2, PY + 24, `700 15px ${mono}`, "rgba(240,238,232,0.9)", "center");
      engrave(channel.name.toUpperCase(), PX + PW / 2, PY + PH - 20, `600 9px ${mono}`, "rgba(240,238,232,0.55)", "center");
      engrave("dB", SX + 62, Y1 - 34, `600 8px ${mono}`, "rgba(240,238,232,0.45)", "center");
      marks.forEach((m, i) => {
        const y = Y0 - m.p * TR, unity = m.db === 0;
        sc.fillStyle = "rgba(0,0,0,0.7)"; sc.fillRect(SX + 26, y - 1.5, unity ? 22 : 14, 1.6);
        sc.fillStyle = unity ? INDEX : "rgba(240,238,232,0.85)"; sc.fillRect(SX + 26, y - 0.8, unity ? 22 : 14, 1.6);
        engrave(m.label, SX + 76, y, `${unity ? 700 : 600} ${m.label === "∞" ? 15 : 11}px ${mono}`, unity ? "#ff6a55" : "rgba(240,238,232,0.8)", "right");
        const next = marks[i + 1];
        if (next) for (let k = 1; k < 4; k++) {
          const yy = y + ((m.p - next.p) * TR * k) / 4;
          sc.fillStyle = "rgba(240,238,232,0.3)"; sc.fillRect(SX + 26, yy - 0.5, 7, 1);
        }
      });

      // The slot the cap rides in: a dark cut with a bright lower lip.
      const slot = (x: number, y: number, w: number, h: number, r: number) => {
        rr(sc, x - 1, y - 1, w + 2, h + 2.6, r + 1); sc.fillStyle = "rgba(255,255,255,0.16)"; sc.fill();
        rr(sc, x - 1, y - 1.6, w + 2, h + 2, r + 1); sc.fillStyle = "rgba(0,0,0,0.6)"; sc.fill();
        rr(sc, x, y, w, h, r); sc.fillStyle = "#040405"; sc.fill();
      };
      slot(SX - 3.5, Y1 - 50, 7, TR + 100, 3.5);
      const dust = sc.createLinearGradient(SX - 3.5, 0, SX + 3.5, 0);
      dust.addColorStop(0, "rgba(255,255,255,0)"); dust.addColorStop(0.75, "rgba(255,255,255,0.09)"); dust.addColorStop(1, "rgba(255,255,255,0)");
      rr(sc, SX - 3.5, Y1 - 50, 7, TR + 100, 3.5); sc.fillStyle = dust; sc.fill();
      slot(LX - 13, Y1 - 12, 26, TR + 24, 4);
    }

    const ledColour = (i: number) => (i >= LEDS - 3 ? [255, 70, 52] : i >= LEDS - 9 ? [255, 190, 40] : [52, 226, 122]);
    const s = { p: automation[0] / 100, v: 0, target: automation[0] / 100, drag: false, grab: 0, level: 0, peak: 0, peakAt: 0, lx: -0.4 };

    const draw = (t: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(still, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const pitch = TR / LEDS, lit = s.level * LEDS, peakI = Math.min(LEDS - 1, Math.floor(s.peak * LEDS - 0.01));

      // Meter: every segment is a little tinted window; the lit ones glow and spill onto the plate.
      for (let i = 0; i < LEDS; i++) {
        const [r, g, b] = ledColour(i), y = Y0 - (i + 0.5) * pitch;
        let on = Math.max(0, Math.min(1, lit - i));
        if (i === peakI && s.peak > 0.02) on = Math.max(on, 0.9);
        rr(ctx, LX - 9, y - 5.2, 18, 10.4, 2);
        ctx.fillStyle = `rgb(${(r * 0.13) | 0},${(g * 0.13) | 0},${(b * 0.13) | 0})`; ctx.fill();
        if (on > 0.01) {
          ctx.save(); ctx.globalAlpha = on; ctx.shadowColor = `rgb(${r},${g},${b})`; ctx.shadowBlur = 14 * dpr;
          rr(ctx, LX - 9, y - 5.2, 18, 10.4, 2); ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fill(); ctx.restore();
          const core = ctx.createLinearGradient(0, y - 5, 0, y + 5);
          core.addColorStop(0, `rgba(255,255,255,${0.75 * on})`); core.addColorStop(0.5, `rgba(255,255,255,${0.25 * on})`); core.addColorStop(1, "rgba(255,255,255,0)");
          rr(ctx, LX - 7, y - 4, 14, 8, 1.5); ctx.fillStyle = core; ctx.fill();
          ctx.save(); ctx.globalCompositeOperation = "lighter";
          const spill = ctx.createRadialGradient(LX, y, 4, LX, y, 46);
          spill.addColorStop(0, `rgba(${r},${g},${b},${0.11 * on})`); spill.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = spill; ctx.fillRect(LX - 46, y - 46, 92, 92); ctx.restore();
        }
        ctx.fillStyle = `rgba(255,255,255,${0.1 + 0.2 * on})`; ctx.fillRect(LX - 7.5, y - 4.4, 15, 0.9);
      }

      // The cap.
      const cy = Y0 - s.p * TR, x0 = SX - CW / 2, y0 = cy - CH / 2;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 22 * dpr; ctx.shadowOffsetX = 9 * dpr; ctx.shadowOffsetY = 20 * dpr;
      rr(ctx, x0 + 3, y0 + 8, CW - 6, CH - 6, 6); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.85)"; ctx.shadowBlur = 5 * dpr; ctx.shadowOffsetX = 1.5 * dpr; ctx.shadowOffsetY = 4 * dpr;
      rr(ctx, x0, y0 + LIFT, CW, CH, 6); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      // The cap stands off the plate: its lower wall shows under the face.
      const skirt = ctx.createLinearGradient(x0, 0, x0 + CW, 0);
      skirt.addColorStop(0, "#8d846d"); skirt.addColorStop(0.12, "#b4ab93"); skirt.addColorStop(0.5, "#9a917a"); skirt.addColorStop(0.9, "#756d59"); skirt.addColorStop(1, "#4f4939");
      rr(ctx, x0, y0 + LIFT, CW, CH, 6); ctx.fillStyle = skirt; ctx.fill();
      const under = ctx.createLinearGradient(0, y0 + CH - 4, 0, y0 + CH + LIFT);
      under.addColorStop(0, "rgba(40,30,10,0.05)"); under.addColorStop(1, "rgba(30,22,8,0.5)");
      rr(ctx, x0, y0 + LIFT, CW, CH, 6); ctx.fillStyle = under; ctx.fill();

      // A skirt, two sloped shoulders and a finger dish: light comes from above, so the upper wall of the dish is in shade.
      const prof = ctx.createLinearGradient(0, y0, 0, y0 + CH);
      const stops: [number, string][] = [[0, "#fffdf6"], [0.035, "#f6efdd"], [0.1, "#e9e1cd"], [0.24, "#d8cfb9"], [0.3, "#b5ab93"], [0.4, "#bfb59e"], [0.485, "#cfc6b0"], [0.515, "#d6cdb8"], [0.62, "#efe8d6"], [0.71, "#fbf6e8"], [0.78, "#e6decb"], [0.9, "#cdc4ad"], [0.965, "#b0a68e"], [1, "#857c68"]];
      for (const [p, c] of stops) prof.addColorStop(p, c);
      rr(ctx, x0, y0, CW, CH, 6); ctx.fillStyle = prof; ctx.fill();
      ctx.save(); rr(ctx, x0, y0, CW, CH, 6); ctx.clip();
      const side = ctx.createLinearGradient(x0, 0, x0 + CW, 0);
      side.addColorStop(0, "rgba(255,255,255,0.55)"); side.addColorStop(0.07, "rgba(255,255,255,0.1)"); side.addColorStop(0.16, "rgba(255,255,255,0)"); side.addColorStop(0.8, "rgba(0,0,0,0)"); side.addColorStop(0.94, "rgba(60,40,10,0.22)"); side.addColorStop(1, "rgba(40,25,5,0.5)");
      ctx.fillStyle = side; ctx.fillRect(x0, y0, CW, CH);
      // Grip ribs on both shoulders.
      for (const base of [y0 + 7, y0 + CH - 19]) for (let k = 0; k < 3; k++) {
        const y = base + k * 4.4;
        ctx.fillStyle = "rgba(70,55,25,0.34)"; ctx.fillRect(x0 + 5, y, CW - 10, 1.3);
        ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillRect(x0 + 5, y + 1.3, CW - 10, 0.9);
      }
      // The painted index line sits in a groove.
      ctx.fillStyle = "rgba(60,20,10,0.55)"; ctx.fillRect(x0, cy - 2.2, CW, 4.4);
      ctx.fillStyle = INDEX; ctx.fillRect(x0, cy - 1.5, CW, 3);
      ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(x0, cy + 0.6, CW, 0.7);
      // A soft window reflection on the lower wall of the dish. It slides as the light moves.
      const hx = SX + s.lx * 16;
      const spec = ctx.createRadialGradient(hx, cy + CH * 0.19, 0, hx, cy + CH * 0.19, 22);
      spec.addColorStop(0, "rgba(255,255,255,0.85)"); spec.addColorStop(0.4, "rgba(255,255,255,0.25)"); spec.addColorStop(1, "rgba(255,255,255,0)");
      ctx.save(); ctx.translate(0, cy + CH * 0.19); ctx.scale(1, 0.3); ctx.translate(0, -(cy + CH * 0.19)); ctx.fillStyle = spec; ctx.fillRect(x0, cy - 60, CW, 160); ctx.restore();
      // The meter tints the side of the cap that faces it.
      const near = Math.max(0, Math.min(1, (s.level - s.p) * 7 + 0.5));
      if (near > 0.01) {
        const [r, g, b] = ledColour(Math.min(LEDS - 1, Math.floor(s.p * LEDS)));
        const tint = ctx.createLinearGradient(x0, 0, x0 + 20, 0);
        tint.addColorStop(0, `rgba(${r},${g},${b},${0.5 * near})`); tint.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = tint; ctx.fillRect(x0, y0, 20, CH);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.restore();
      rr(ctx, x0 + 0.4, y0 + 0.4, CW - 0.8, CH - 0.8, 5.6); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(50,40,20,0.5)"; ctx.stroke();
      void t;
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, t0 = 0, step = 0, nextDemo = 1000;
    const push = (p: number) => { const v = Math.round(p * 100); setValue((old) => (old === v ? old : v)); };
    const signal = (t: number) => {
      const beat = Math.exp(-((t * 1.9) % 1) * 5.5) * 0.3;
      return Math.max(0, Math.min(1, 0.56 + 0.16 * Math.sin(t * 2.3) + 0.1 * Math.sin(t * 5.9 + 1) + 0.07 * Math.sin(t * 13.1) + beat));
    };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      if (now - touched > 5000 && !s.drag) {
        s.lx += (-0.4 + 0.5 * Math.sin(t * 0.8) - s.lx) * Math.min(1, dt * 3);
        if (t * 1000 > nextDemo) { step = (step + 1) % automation.length; s.target = automation[step] / 100; push(s.target); nextDemo = t * 1000 + 1500; }
      }
      // Held, the cap tracks the finger tightly. Driven by the motor, it glides.
      const k = s.drag ? 900 : now - touched > 5000 ? 70 : 420, c = s.drag ? 52 : now - touched > 5000 ? 15 : 34;
      s.v += (k * (s.target - s.p) - c * s.v) * dt; s.p += s.v * dt;
      if (s.p > 1) { s.p = 1; s.v = 0; } if (s.p < 0) { s.p = 0; s.v = 0; }
      const want = Math.min(1, s.p * (0.5 + 0.62 * signal(t)));
      s.level += (want - s.level) * Math.min(1, dt * (want > s.level ? 30 : 5));
      if (s.level >= s.peak) { s.peak = s.level; s.peakAt = t; } else if (t - s.peakAt > 0.7) s.peak = Math.max(s.level, s.peak - dt * 0.7);
      draw(t);
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const settle = () => { s.p = s.target; s.v = 0; s.level = s.p * 0.86; s.peak = 0; draw(0); };

    api.current = { set: (v) => { touched = performance.now(); s.target = v / 100; if (reduce) settle(); else wake(); } };
    if (reduce) settle(); else wake();

    const where = (e: PointerEvent) => { const b = pad.getBoundingClientRect(); return { x: ((e.clientX - b.left) / b.width) * 2 - 1, y: Y1 - 60 + ((e.clientY - b.top) / b.height) * (TR + 120) }; };
    const toP = (y: number) => { let p = Math.max(0, Math.min(1, (Y0 - y) / TR)); if (Math.abs(p - 0.75) < 0.014) p = 0.75; return p; }; // a small notch at unity
    const onDown = (e: PointerEvent) => {
      const { y } = where(e), cy = Y0 - s.p * TR;
      s.grab = Math.abs(y - cy) < CH / 2 ? y - cy : 0;
      s.drag = true; touched = performance.now(); s.target = toP(y - s.grab); push(s.target);
      pad.setPointerCapture(e.pointerId); e.preventDefault();
      if (reduce) settle(); else wake();
    };
    const onMove = (e: PointerEvent) => {
      const { x, y } = where(e);
      s.lx += (x * 0.9 - s.lx) * 0.2;
      if (!s.drag) { touched = Math.max(touched, performance.now() - 3600); if (reduce) draw(0); return; }
      touched = performance.now(); s.target = toP(y - s.grab); push(s.target);
      if (reduce) settle();
    };
    const onUp = () => { if (s.drag) { s.drag = false; touched = performance.now(); } };
    pad.addEventListener("pointerdown", onDown);
    pad.addEventListener("pointermove", onMove);
    pad.addEventListener("pointerup", onUp);
    pad.addEventListener("pointercancel", onUp);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      pad.removeEventListener("pointerdown", onDown); pad.removeEventListener("pointermove", onMove);
      pad.removeEventListener("pointerup", onUp); pad.removeEventListener("pointercancel", onUp);
      io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="flex min-h-[700px] w-full flex-col items-center justify-center bg-[#0a0b0d] bg-[radial-gradient(110%_75%_at_50%_35%,#1c1e22_0%,#0a0b0d_64%)] px-4 py-10 sm:min-h-[780px]">
      <div className="relative h-[580px] w-[320px] sm:my-8 sm:scale-110">
        <input
          id="motorised-fader-level"
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          aria-label={`Channel ${channel.number} level, ${channel.name}`}
          aria-valuetext={readout(value)}
          onChange={(e) => { const v = Number(e.target.value); setValue(v); api.current?.set(v); }}
          className="peer absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 opacity-0"
        />
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[30px] inset-y-[4px] rounded-xl ring-[#ff6a55] ring-offset-4 ring-offset-[#0a0b0d] peer-focus-visible:ring-2" />
        <div ref={hit} aria-hidden="true" className="absolute left-[132px] top-[44px] h-[494px] w-[92px] cursor-grab touch-none active:cursor-grabbing" />
      </div>
      <p className="mt-6 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-zinc-400">
        <span className="text-zinc-200">Ch {channel.number}</span>
        <span className="mx-2 text-zinc-600">/</span>
        {channel.name}
        <span className="mx-2 text-zinc-600">/</span>
        <output htmlFor="motorised-fader-level" className="inline-block min-w-[72px] text-left text-zinc-100">{readout(value)}</output>
      </p>
    </div>
  );
}

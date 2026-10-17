import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// The positions, left to right. Add or remove entries and the stops space themselves out.
const modes = [
  { label: "Off", note: "Fan stopped" },
  { label: "Auto", note: "Follows the room temperature" },
  { label: "Boost", note: "Full speed for twenty minutes" },
];
const SWEEP = 104; // degrees between the first stop and the last
const LAMP = "#ff9d2e"; // the paint in the pointer notch and the lit lamp
const SIZE = 320; // canvas edge in CSS pixels

const stopAngle = (i: number) => ((modes.length === 1 ? 0 : i / (modes.length - 1) - 0.5) * SWEEP * Math.PI) / 180;

export default function LatheTurnedMetalDial() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const [mode, setMode] = useState(1);
  const modeRef = useRef(1);
  const api = useRef<{ go: (i: number, fromUser: boolean) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, pad = hit.current;
    if (!cv || !pad) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1) * 1.25; // the dial is shown a quarter larger on wide screens
    cv.width = SIZE * dpr; cv.height = SIZE * dpr;
    const C = SIZE / 2, FACE = 78, GRIP = 97, PLATE = 146;
    const hasConic = typeof ctx.createConicGradient === "function";

    // The lathe marks: hundreds of faint circles, drawn once and reused every frame.
    const rings = document.createElement("canvas");
    rings.width = cv.width; rings.height = cv.height;
    const rx = rings.getContext("2d");
    if (rx) {
      rx.scale(dpr, dpr);
      let seed = 7;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let r = 1.5; r < FACE; r += 0.55) {
        const v = rand();
        rx.beginPath(); rx.arc(C, C, r, 0, Math.PI * 2);
        rx.lineWidth = 0.5 + rand() * 0.4;
        rx.strokeStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.3})` : `rgba(0,0,0,${(0.5 - v) * 0.26})`;
        rx.stroke();
      }
    }

    const s = { a: stopAngle(1), v: 0, target: stopAngle(1), raw: stopAngle(1), drag: false, light: -2.2, lightTo: -2.2, lamp: modes.map((_, i) => (i === 1 ? 1 : 0)) };
    // Metal is never pure grey: the dark bands lean blue and the bright ones lean warm.
    const grey = (v: number) => { const c = Math.max(0, Math.min(255, v)); const k = (150 - c) * 0.09; return `rgb(${Math.max(0, Math.min(255, c - k)) | 0},${c | 0},${Math.max(0, Math.min(255, c + k * 1.6)) | 0})`; };

    // Bright and dark bands that meet at the centre, the way turned metal catches a lamp.
    const sheen = (angle: number, lo: number, hi: number) => {
      if (!hasConic) { const g = ctx.createLinearGradient(C - FACE, C - FACE, C + FACE, C + FACE); g.addColorStop(0, grey(hi)); g.addColorStop(0.5, grey(lo)); g.addColorStop(1, grey(hi)); return g; }
      const g = ctx.createConicGradient(angle, C, C);
      const mid = (lo + hi) / 2;
      const stops: [number, number][] = [[0, hi], [0.03, hi - 4], [0.085, mid + 10], [0.16, lo + 4], [0.23, lo - 14], [0.31, mid - 22], [0.4, mid + 6], [0.455, hi - 40], [0.5, hi - 16], [0.54, hi - 44], [0.6, mid - 6], [0.69, lo - 8], [0.76, lo + 10], [0.84, mid - 16], [0.92, mid + 30], [0.97, hi - 6], [1, hi]];
      for (const [p, v] of stops) g.addColorStop(p, grey(v));
      return g;
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, SIZE, SIZE);
      const la = s.light + s.a * 0.18;

      // The anodised plate the dial sits in.
      const plate = ctx.createRadialGradient(C, C - 30, 20, C, C, PLATE);
      plate.addColorStop(0, "#26282c"); plate.addColorStop(0.7, "#1a1c1f"); plate.addColorStop(1, "#141518");
      ctx.beginPath(); ctx.arc(C, C, PLATE, 0, Math.PI * 2); ctx.fillStyle = plate; ctx.fill();
      const lip = ctx.createLinearGradient(0, C - PLATE, 0, C + PLATE);
      lip.addColorStop(0, "rgba(255,255,255,0.34)"); lip.addColorStop(0.45, "rgba(255,255,255,0.03)"); lip.addColorStop(1, "rgba(0,0,0,0.6)");
      ctx.lineWidth = 1.5; ctx.strokeStyle = lip; ctx.beginPath(); ctx.arc(C, C, PLATE - 0.75, 0, Math.PI * 2); ctx.stroke();

      // Engraved scale and the three lamps.
      const half = (SWEEP / 2 + 12) * (Math.PI / 180);
      for (let k = -29; k <= 29; k++) {
        const ang = (k * 4 * Math.PI) / 180;
        if (Math.abs(ang) > half) continue;
        const sin = Math.sin(ang), cos = -Math.cos(ang);
        const long = modes.some((_, i) => Math.abs(stopAngle(i) - ang) < 0.02);
        ctx.beginPath(); ctx.moveTo(C + sin * 108, C + cos * 108); ctx.lineTo(C + sin * (long ? 121 : 114), C + cos * (long ? 121 : 114));
        ctx.lineWidth = long ? 1.6 : 1; ctx.strokeStyle = long ? "rgba(236,238,240,0.9)" : "rgba(236,238,240,0.32)"; ctx.stroke();
      }
      modes.forEach((_, i) => {
        const ang = stopAngle(i), x = C + Math.sin(ang) * 133, y = C - Math.cos(ang) * 133, on = s.lamp[i];
        ctx.beginPath(); ctx.arc(x, y, 4.2, 0, Math.PI * 2); ctx.fillStyle = "#08090a"; ctx.fill();
        ctx.save();
        ctx.shadowColor = LAMP; ctx.shadowBlur = 16 * on; ctx.globalAlpha = 0.16 + 0.84 * on;
        ctx.beginPath(); ctx.arc(x, y, 2.9, 0, Math.PI * 2); ctx.fillStyle = LAMP; ctx.fill();
        ctx.restore();
        ctx.beginPath(); ctx.arc(x - 0.9, y - 1, 0.9, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${0.15 + 0.55 * on})`; ctx.fill();
      });

      // A small engraved legend under the dial.
      ctx.save(); ctx.font = "600 8.5px ui-monospace, SFMono-Regular, Menlo, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const legend = "AIR  /  3 STOP";
      ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillText(legend, C, C + 125.8);
      ctx.fillStyle = "rgba(236,238,240,0.42)"; ctx.fillText(legend, C, C + 125);
      ctx.restore();

      // Shadow of the dial on the plate: one wide and soft, one tight where it meets the surface.
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.75)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 20 * dpr;
      ctx.beginPath(); ctx.arc(C, C, GRIP - 4, 0, Math.PI * 2); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 4 * dpr;
      ctx.beginPath(); ctx.arc(C, C, GRIP - 1, 0, Math.PI * 2); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();

      // Knurled grip: each tooth turns with the dial but takes its brightness from where the light is.
      const teeth = 112, step = (Math.PI * 2) / teeth;
      ctx.beginPath(); ctx.arc(C, C, GRIP, 0, Math.PI * 2); ctx.fillStyle = "#2c2e31"; ctx.fill();
      for (let i = 0; i < teeth; i++) {
        const t0 = s.a + i * step;
        const face = Math.cos(t0 - la), lit = 0.5 + 0.5 * face, glint = Math.pow(Math.max(0, face), 6) + 0.5 * Math.pow(Math.max(0, -face), 8);
        for (let h = 0; h < 2; h++) {
          const a0 = t0 + h * step * 0.5 - Math.PI / 2, a1 = a0 + step * 0.5 + 0.004;
          const v = h === 0 ? 84 + lit * 78 + glint * 92 : 30 + lit * 40 + glint * 40;
          ctx.beginPath(); ctx.arc(C, C, GRIP, a0, a1); ctx.arc(C, C, FACE + 3, a1, a0, true); ctx.closePath();
          ctx.fillStyle = grey(v); ctx.fill();
        }
      }
      const round = ctx.createRadialGradient(C, C, FACE + 3, C, C, GRIP);
      round.addColorStop(0, "rgba(0,0,0,0.5)"); round.addColorStop(0.3, "rgba(0,0,0,0)"); round.addColorStop(0.72, "rgba(0,0,0,0)"); round.addColorStop(1, "rgba(0,0,0,0.62)");
      ctx.beginPath(); ctx.arc(C, C, GRIP, 0, Math.PI * 2); ctx.arc(C, C, FACE + 3, 0, Math.PI * 2, true); ctx.fillStyle = round; ctx.fill("evenodd");

      // Polished chamfer between grip and face.
      ctx.beginPath(); ctx.arc(C, C, FACE + 3.5, 0, Math.PI * 2); ctx.fillStyle = sheen(la + 0.5, 70, 255); ctx.fill();
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.stroke();

      // The face: sheen, lathe rings, one machined step and a shallow dish.
      ctx.beginPath(); ctx.arc(C, C, FACE, 0, Math.PI * 2); ctx.fillStyle = sheen(la, 96, 252); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(C, C, FACE, 0, Math.PI * 2); ctx.clip();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(rings, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const dish = ctx.createRadialGradient(C, C + 14, 6, C, C, FACE);
      dish.addColorStop(0, "rgba(255,255,255,0.16)"); dish.addColorStop(0.55, "rgba(255,255,255,0)"); dish.addColorStop(1, "rgba(0,0,0,0.2)");
      ctx.fillStyle = dish; ctx.fillRect(C - FACE, C - FACE, FACE * 2, FACE * 2);
      ctx.restore();
      ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(0,0,0,0.36)"; ctx.beginPath(); ctx.arc(C, C, FACE * 0.7, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.beginPath(); ctx.arc(C, C, FACE * 0.7 + 1.1, 0, Math.PI * 2); ctx.stroke();

      // The pointer notch, milled into the face and filled with paint.
      ctx.save(); ctx.translate(C, C); ctx.rotate(s.a);
      ctx.lineCap = "round";
      ctx.lineWidth = 6.4; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.beginPath(); ctx.moveTo(0, -FACE + 9); ctx.lineTo(0, -FACE * 0.7 - 7); ctx.stroke();
      ctx.lineWidth = 4.2; ctx.strokeStyle = LAMP; ctx.beginPath(); ctx.moveTo(0, -FACE + 9.6); ctx.lineTo(0, -FACE * 0.7 - 6.6); ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.beginPath(); ctx.moveTo(1.1, -FACE + 10); ctx.lineTo(1.1, -FACE * 0.7 - 7); ctx.stroke();
      ctx.restore();
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, nextDemo = 1100, t0 = 0, moved = 0, lastAngle = 0;
    const first = stopAngle(0), end = stopAngle(modes.length - 1);
    const gap = modes.length > 1 ? SWEEP / (modes.length - 1) * (Math.PI / 180) : 1;
    const nearest = (a: number) => { let best = 0; modes.forEach((_, i) => { if (Math.abs(stopAngle(i) - a) < Math.abs(stopAngle(best) - a)) best = i; }); return best; };
    const select = (i: number) => { if (modeRef.current !== i) { modeRef.current = i; setMode(i); } };

    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      if (s.drag) {
        // While held, the dial resists leaving a stop and falls into the next one.
        const n = nearest(s.raw), off = s.raw - stopAngle(n);
        const sticky = stopAngle(n) + off - (Math.sin((off / gap) * Math.PI * 2) * gap) / (Math.PI * 2) * 0.82;
        s.v = (sticky - s.a) / Math.max(dt, 0.001) * 0.35; s.a += (sticky - s.a) * Math.min(1, dt * 30);
        select(n);
      } else {
        s.v += (520 * (s.target - s.a) - 19 * s.v) * dt; s.a += s.v * dt;
      }
      if (now - touched > 5000) {
        s.lightTo = -2.2 + 0.35 * Math.sin(t / 2100);
        if (t > nextDemo && !s.drag) { const n = (modeRef.current + 1) % modes.length; s.target = stopAngle(n); select(n); nextDemo = t + 1500; }
      }
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 6);
      s.lamp = s.lamp.map((v, i) => v + ((i === modeRef.current ? 1 : 0) - v) * Math.min(1, dt * (i === modeRef.current ? 14 : 7)));
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const settle = () => { s.a = s.target; s.v = 0; s.lamp = modes.map((_, i) => (i === modeRef.current ? 1 : 0)); draw(); };

    api.current = {
      go: (i, fromUser) => { if (fromUser) touched = performance.now(); s.target = stopAngle(i); select(i); if (reduce) settle(); else wake(); },
    };
    if (reduce) settle(); else wake();

    const angleAt = (e: PointerEvent) => { const b = pad.getBoundingClientRect(); return Math.atan2(e.clientX - (b.left + b.width / 2), -(e.clientY - (b.top + b.height / 2))); };
    const onDown = (e: PointerEvent) => {
      touched = performance.now(); s.drag = true; s.raw = s.a; moved = 0; lastAngle = angleAt(e);
      pad.setPointerCapture(e.pointerId); e.preventDefault(); wake();
    };
    const onMove = (e: PointerEvent) => {
      const b = pad.getBoundingClientRect();
      if (!s.drag) { touched = Math.max(touched, performance.now() - 3800); s.lightTo = Math.atan2(e.clientY - (b.top + b.height / 2) - 40, e.clientX - (b.left + b.width / 2)); if (reduce) { s.light = s.lightTo; draw(); } return; }
      touched = performance.now();
      const a = angleAt(e); let d = a - lastAngle; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
      lastAngle = a; moved += Math.abs(d);
      // Past the last stop the dial keeps going a little, with rising resistance.
      const over = s.raw + d > end ? s.raw + d - end : s.raw + d < first ? first - (s.raw + d) : 0;
      s.raw += over > 0 ? d * Math.max(0.08, 0.5 - over * 2.4) : d;
      if (reduce) { const n = nearest(s.raw); select(n); s.target = stopAngle(n); settle(); }
    };
    const onUp = () => {
      if (!s.drag) return;
      s.drag = false; touched = performance.now();
      const n = moved < 0.04 ? (modeRef.current + 1) % modes.length : nearest(s.raw); // a plain tap steps to the next stop
      s.target = stopAngle(n); select(n);
      if (reduce) settle();
    };
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

  const choose = (i: number) => { modeRef.current = i; setMode(i); api.current?.go(i, true); };
  const onKey = (e: ReactKeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? Math.min(modes.length - 1, i + 1) : e.key === "ArrowLeft" || e.key === "ArrowUp" ? Math.max(0, i - 1) : e.key === "Home" ? 0 : e.key === "End" ? modes.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault(); choose(next); radios.current[next]?.focus();
  };

  return (
    <div className="flex min-h-[640px] w-full sm:min-h-[720px] flex-col items-center justify-center bg-[#0b0c0e] bg-[radial-gradient(120%_80%_at_50%_30%,#1b1d21_0%,#0b0c0e_62%)] px-4 py-12">
      <div className="relative h-[320px] w-[320px] sm:my-12 sm:scale-125">
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div ref={hit} aria-hidden="true" className="absolute left-1/2 top-1/2 h-[198px] w-[198px] -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full active:cursor-grabbing" />
        <div role="radiogroup" aria-label="Fan mode" className="absolute inset-0 pointer-events-none">
          {modes.map((m, i) => {
            const a = stopAngle(i), x = 160 + Math.sin(a) * 160, y = 160 - Math.cos(a) * 164;
            return (
              <button
                key={m.label}
                ref={(el) => { radios.current[i] = el; }}
                type="button"
                role="radio"
                aria-checked={mode === i}
                tabIndex={mode === i ? 0 : -1}
                onClick={() => choose(i)}
                onKeyDown={(e) => onKey(e, i)}
                style={{ left: x, top: y, transform: `translate(${-50 + Math.sin(a) * 52}%, -50%)` }}
                className={`pointer-events-auto absolute flex h-10 min-w-[56px] items-center justify-center rounded-full px-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[#ff9d2e] motion-reduce:transition-none ${mode === i ? "text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>
      <p aria-live="polite" className="mt-9 min-h-[20px] max-w-[320px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-zinc-400">
        <span className="text-zinc-200">{modes[mode].label}</span>
        <span className="mx-2 text-zinc-600">/</span>
        {modes[mode].note}
      </p>
    </div>
  );
}

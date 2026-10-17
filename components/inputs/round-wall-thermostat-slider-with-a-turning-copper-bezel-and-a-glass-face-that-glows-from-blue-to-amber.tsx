import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// Everything a visitor is likely to change sits here.
const MIN = 10; // lowest setting, in degrees
const MAX = 30; // highest setting
const STEP = 0.5; // one click of the bezel
const START = 21.5; // where it opens
const ROOM = 19.5; // the reading shown as "room"
const ROOM_NAME = "Hallway";
const PER_DEGREE = 13.5; // how far the bezel turns for one degree, in degrees of arc
// The face colour from coldest to warmest. Each entry is [position 0..1, red, green, blue].
const HEAT: [number, number, number, number][] = [[0, 47, 125, 255], [0.34, 86, 190, 255], [0.5, 255, 232, 190], [0.7, 255, 170, 60], [1, 255, 74, 40]];

const SIZE = 400; // drawing units: the canvas is scaled to whatever box it is given
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const snap = (v: number) => clamp(Math.round(v / STEP) * STEP, MIN, MAX);
const heat = (v: number, a = 1) => {
  const t = clamp((v - MIN) / (MAX - MIN), 0, 1);
  let i = 0;
  while (i < HEAT.length - 2 && t > HEAT[i + 1][0]) i++;
  const p = HEAT[i], q = HEAT[i + 1], k = clamp((t - p[0]) / (q[0] - p[0]), 0, 1);
  return `rgba(${(p[1] + (q[1] - p[1]) * k) | 0},${(p[2] + (q[2] - p[2]) * k) | 0},${(p[3] + (q[3] - p[3]) * k) | 0},${a})`;
};
const verb = (v: number) => (v > ROOM + 0.2 ? "Heating to" : v < ROOM - 0.2 ? "Cooling to" : "Holding at");

export default function CopperBezelThermostat() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(START);
  const valueRef = useRef(START);
  const api = useRef<{ go: (v: number) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, pad = hit.current;
    if (!cv || !pad) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const px = 580 * Math.min(2, window.devicePixelRatio || 1); // sharp at its largest shown size
    cv.width = px; cv.height = px;
    const k = px / SIZE;
    const C = SIZE / 2, OUT = 136, IN = 100, GLASS = 96;
    const hasConic = typeof ctx.createConicGradient === "function";
    const sans = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif';

    // Copper is a ramp from near black through red-brown to a pale pink highlight.
    const ramp: [number, number, number, number][] = [[0, 34, 14, 8], [70, 104, 50, 28], [130, 168, 92, 56], [185, 214, 138, 96], [228, 244, 190, 152], [255, 255, 240, 226]];
    const copper = (v: number) => {
      const c = clamp(v, 0, 255);
      let i = 0;
      while (i < ramp.length - 2 && c > ramp[i + 1][0]) i++;
      const p = ramp[i], q = ramp[i + 1], t = (c - p[0]) / (q[0] - p[0]);
      return `rgb(${(p[1] + (q[1] - p[1]) * t) | 0},${(p[2] + (q[2] - p[2]) * t) | 0},${(p[3] + (q[3] - p[3]) * t) | 0})`;
    };
    const sheen = (angle: number, lo: number, hi: number) => {
      if (!hasConic) { const g = ctx.createLinearGradient(C - OUT, C - OUT, C + OUT, C + OUT); g.addColorStop(0, copper(hi)); g.addColorStop(0.5, copper(lo)); g.addColorStop(1, copper(hi - 30)); return g; }
      const g = ctx.createConicGradient(angle, C, C);
      const mid = (lo + hi) / 2;
      const stops: [number, number][] = [[0, hi], [0.035, hi - 10], [0.09, mid + 14], [0.17, lo + 8], [0.25, lo - 12], [0.33, mid - 18], [0.41, mid + 12], [0.47, hi - 34], [0.5, hi - 12], [0.535, hi - 40], [0.6, mid - 2], [0.69, lo - 6], [0.77, lo + 12], [0.85, mid - 10], [0.93, mid + 30], [0.975, hi - 8], [1, hi]];
      for (const [p, v] of stops) g.addColorStop(p, copper(v));
      return g;
    };

    // Circular brushing, painted once: it looks the same at every angle, so it never has to turn.
    const brush = document.createElement("canvas");
    brush.width = px; brush.height = px;
    const bx = brush.getContext("2d");
    if (bx) {
      bx.scale(k, k);
      let seed = 11;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let r = IN; r < OUT; r += 0.4) {
        const v = rand();
        bx.beginPath(); bx.arc(C, C, r, 0, Math.PI * 2);
        bx.lineWidth = 0.4 + rand() * 0.4;
        bx.strokeStyle = v > 0.5 ? `rgba(255,236,220,${(v - 0.5) * 0.34})` : `rgba(40,12,0,${(0.5 - v) * 0.3})`;
        bx.stroke();
      }
    }

    const s = { v: START, vel: 0, target: START, raw: START, drag: false, light: -2.25, lightTo: -2.25, press: 0 };

    const draw = () => {
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.clearRect(0, 0, SIZE, SIZE);
      const turn = ((s.v - (MIN + MAX) / 2) * PER_DEGREE * Math.PI) / 180;
      const la = s.light;

      // Coloured light the face spills on the wall, then two shadows under the body.
      const halo = ctx.createRadialGradient(C, C, OUT - 10, C, C, SIZE / 2);
      halo.addColorStop(0, heat(s.v, 0.62)); halo.addColorStop(0.4, heat(s.v, 0.24)); halo.addColorStop(1, heat(s.v, 0));
      ctx.fillStyle = halo; ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.save(); ctx.shadowColor = "rgba(58,40,22,0.42)"; ctx.shadowBlur = 46 * k; ctx.shadowOffsetX = 14 * k; ctx.shadowOffsetY = 34 * k;
      ctx.beginPath(); ctx.arc(C, C, OUT - 4, 0, Math.PI * 2); ctx.fillStyle = "#3a2a1c"; ctx.fill(); ctx.restore();
      ctx.save(); ctx.shadowColor = "rgba(40,26,14,0.6)"; ctx.shadowBlur = 9 * k; ctx.shadowOffsetX = 3 * k; ctx.shadowOffsetY = 6 * k;
      ctx.beginPath(); ctx.arc(C, C, OUT + 4, 0, Math.PI * 2); ctx.fillStyle = "#2a1c10"; ctx.fill(); ctx.restore();
      // The ivory base that screws to the wall. Only a thin edge of it shows, lit a little by the display.
      const base = ctx.createLinearGradient(C - OUT, C - OUT, C + OUT, C + OUT);
      base.addColorStop(0, "#fffdf8"); base.addColorStop(0.55, "#e9e2d6"); base.addColorStop(1, "#a99f90");
      ctx.beginPath(); ctx.arc(C, C, OUT + 5, 0, Math.PI * 2); ctx.fillStyle = base; ctx.fill();
      ctx.fillStyle = heat(s.v, 0.16); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(C, C, OUT + 5, 0, Math.PI * 2); ctx.clip();
      ctx.shadowColor = "rgba(30,14,4,0.85)"; ctx.shadowBlur = 5 * k; ctx.shadowOffsetX = 1.5 * k; ctx.shadowOffsetY = 3.5 * k;
      ctx.beginPath(); ctx.arc(C, C, OUT, 0, Math.PI * 2); ctx.fillStyle = "#1a0c04"; ctx.fill(); ctx.restore();

      // The bezel: a rounded outer shoulder, the brushed flat that carries the scale, and a polished inner lip.
      ctx.beginPath(); ctx.arc(C, C, OUT, 0, Math.PI * 2); ctx.fillStyle = sheen(la + 0.35, 24, 255); ctx.fill();
      ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(24,8,0,0.55)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(C, C, OUT - 6, 0, Math.PI * 2); ctx.fillStyle = sheen(la, 66, 255); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(C, C, OUT - 6, 0, Math.PI * 2); ctx.clip();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(brush, 0, 0); ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.restore();
      // The flat is very slightly crowned: darker at both edges.
      const crown = ctx.createRadialGradient(C, C, IN, C, C, OUT - 6);
      crown.addColorStop(0, "rgba(30,8,0,0.34)"); crown.addColorStop(0.22, "rgba(30,8,0,0)"); crown.addColorStop(0.8, "rgba(30,8,0,0)"); crown.addColorStop(1, "rgba(30,8,0,0.3)");
      ctx.beginPath(); ctx.arc(C, C, OUT - 6, 0, Math.PI * 2); ctx.arc(C, C, IN, 0, Math.PI * 2, true); ctx.fillStyle = crown; ctx.fill("evenodd");

      // Engraved scale. It is cut into the ring, so it turns with it while the reflections above stay put.
      ctx.save(); ctx.translate(C, C); ctx.rotate(turn);
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `600 10px ${sans}`; ctx.lineCap = "butt";
      for (let d = MIN; d <= MAX + 0.001; d += STEP) {
        const whole = Math.abs(d - Math.round(d)) < 0.01, even = whole && Math.round(d) % 2 === 0;
        ctx.save(); ctx.rotate((-(d - (MIN + MAX) / 2) * PER_DEGREE * Math.PI) / 180);
        const y0 = -(IN + 5), y1 = y0 - (whole ? 6.5 : 3.5);
        ctx.lineWidth = whole ? 1.3 : 0.9;
        ctx.strokeStyle = "rgba(255,238,224,0.5)"; ctx.beginPath(); ctx.moveTo(0.7, y0 - 0.5); ctx.lineTo(0.7, y1 - 0.5); ctx.stroke();
        ctx.strokeStyle = whole ? "rgba(44,16,4,0.92)" : "rgba(44,16,4,0.6)"; ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(0, y1); ctx.stroke();
        if (even) {
          ctx.fillStyle = "rgba(255,238,224,0.5)"; ctx.fillText(String(Math.round(d)), 0.5, -(IN + 19.9));
          ctx.fillStyle = "rgba(44,16,4,0.94)"; ctx.fillText(String(Math.round(d)), 0, -(IN + 20.5));
        }
        ctx.restore();
      }
      ctx.restore();

      // Bright rims where the shoulder and the lip catch the lamp.
      const rim = ctx.createLinearGradient(C - OUT, C - OUT, C + OUT, C + OUT);
      rim.addColorStop(0, "rgba(255,244,232,0.95)"); rim.addColorStop(0.45, "rgba(255,244,232,0.08)"); rim.addColorStop(1, "rgba(30,8,0,0.6)");
      ctx.lineWidth = 1.1; ctx.strokeStyle = rim; ctx.beginPath(); ctx.arc(C, C, OUT - 6, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(C, C, IN + 1.5, 0, Math.PI * 2); ctx.arc(C, C, GLASS, 0, Math.PI * 2, true); ctx.fillStyle = sheen(la + Math.PI, 30, 255); ctx.fill("evenodd");
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(20,6,0,0.7)"; ctx.beginPath(); ctx.arc(C, C, IN + 1.5, 0, Math.PI * 2); ctx.stroke();

      // Black glass.
      const press = s.press;
      const glass = ctx.createRadialGradient(C, C - 26, 8, C, C, GLASS);
      glass.addColorStop(0, "#1b1d21"); glass.addColorStop(0.7, "#0b0c0e"); glass.addColorStop(1, "#030304");
      ctx.beginPath(); ctx.arc(C, C, GLASS, 0, Math.PI * 2); ctx.fillStyle = glass; ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(C, C, GLASS, 0, Math.PI * 2); ctx.clip();
      // The lit display under the glass: a band of colour round the edge and a wash rising from below.
      const band = ctx.createRadialGradient(C, C, GLASS - 34, C, C, GLASS);
      band.addColorStop(0, heat(s.v, 0)); band.addColorStop(0.62, heat(s.v, 0.16 + press * 0.1)); band.addColorStop(0.9, heat(s.v, 0.74)); band.addColorStop(1, heat(s.v, 0.3));
      ctx.fillStyle = band; ctx.fillRect(C - GLASS, C - GLASS, GLASS * 2, GLASS * 2);
      const wash = ctx.createRadialGradient(C, C + GLASS * 0.9, 4, C, C + GLASS * 0.9, GLASS * 1.5);
      wash.addColorStop(0, heat(s.v, 0.5)); wash.addColorStop(0.5, heat(s.v, 0.13)); wash.addColorStop(1, heat(s.v, 0));
      ctx.fillStyle = wash; ctx.fillRect(C - GLASS, C - GLASS, GLASS * 2, GLASS * 2);

      // Fine marks all round. The lit run is the gap between the setting (top) and the room reading,
      // whose white mark rides round with the engraved scale.
      const gap = (s.v - ROOM) * PER_DEGREE, marks = 120;
      ctx.lineCap = "round";
      for (let i = 0; i < marks; i++) {
        const deg = i * (360 / marks) > 180 ? i * (360 / marks) - 360 : i * (360 / marks);
        const a = (deg * Math.PI) / 180, sn = Math.sin(a), cs = -Math.cos(a);
        const inside = gap >= 0 ? clamp(Math.min(deg + 1.5, gap - deg + 1.5) / 3, 0, 1) : clamp(Math.min(-deg + 1.5, deg - gap + 1.5) / 3, 0, 1);
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = inside > 0 ? heat(s.v - deg / PER_DEGREE, 0.25 + 0.75 * inside) : "rgba(255,255,255,0.14)";
        ctx.beginPath(); ctx.moveTo(C + sn * 71, C + cs * 71); ctx.lineTo(C + sn * 78, C + cs * 78); ctx.stroke();
      }
      const ra = (gap * Math.PI) / 180;
      ctx.lineWidth = 2.2; ctx.strokeStyle = "rgba(255,255,255,0.96)";
      ctx.beginPath(); ctx.moveTo(C + Math.sin(ra) * 66, C - Math.cos(ra) * 66); ctx.lineTo(C + Math.sin(ra) * 80, C - Math.cos(ra) * 80); ctx.stroke();

      // The reading.
      const shown = snap(s.v), whole = Math.floor(shown + 1e-6), half = shown - whole > 0.25;
      ctx.textBaseline = "alphabetic";
      ctx.save(); ctx.shadowColor = heat(s.v, 0.75); ctx.shadowBlur = 16 * k;
      ctx.font = `200 62px ${sans}`; ctx.textAlign = "center"; ctx.fillStyle = "#ffffff";
      const wNum = ctx.measureText(String(whole)).width;
      ctx.fillText(String(whole), C - 6, C + 20);
      ctx.restore();
      ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = `300 19px ${sans}`; ctx.fillText("°", C - 6 + wNum / 2 + 2, C - 10);
      ctx.font = `400 17px ${sans}`; ctx.fillStyle = "rgba(255,255,255,0.78)"; ctx.fillText(half ? ".5" : ".0", C - 6 + wNum / 2 + 2, C + 20);
      ctx.textAlign = "center"; ctx.font = `600 7.6px ${sans}`;
      const label = verb(shown).replace(/ (to|at)$/, "").toUpperCase();
      ctx.fillStyle = heat(s.v, 1); ctx.fillText(label.split("").join("  "), C, C - 38);
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fillText(`ROOM ${ROOM.toFixed(1)}°`.split("").join(" "), C, C + 46);

      // Reflections on the glass: one large soft window from the upper left and a thin line low on the right.
      const sx = Math.cos(la), sy = Math.sin(la);
      ctx.beginPath(); ctx.arc(C + sx * 92, C + sy * 92, 132, 0, Math.PI * 2);
      const refl = ctx.createLinearGradient(C + sx * GLASS, C + sy * GLASS, C - sx * 20, C - sy * 20);
      refl.addColorStop(0, "rgba(255,255,255,0.2)"); refl.addColorStop(0.6, "rgba(255,255,255,0.05)"); refl.addColorStop(1, "rgba(255,255,255,0.015)");
      ctx.fillStyle = refl; ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath(); ctx.arc(C, C, GLASS - 3.5, la + Math.PI - 0.5, la + Math.PI + 0.5); ctx.stroke();
      ctx.lineWidth = 1.6; ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath(); ctx.arc(C, C, GLASS - 3, la - 0.42, la + 0.42); ctx.stroke();
      ctx.restore();

      // The fixed index: a small painted arrow on the glass edge that the scale turns past.
      ctx.beginPath(); ctx.moveTo(C, C - GLASS + 3.5); ctx.lineTo(C - 4.4, C - GLASS + 11.5); ctx.lineTo(C + 4.4, C - GLASS + 11.5); ctx.closePath();
      ctx.save(); ctx.shadowColor = heat(s.v, 1); ctx.shadowBlur = 8 * k; ctx.fillStyle = "#ffffff"; ctx.fill(); ctx.restore();
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, t0 = 0, lastAngle = 0, step = 0;
    const tour = [24.5, 16, START]; // what the bezel does while nobody is touching it
    let nextDemo = 900;
    const select = (v: number) => { if (valueRef.current !== v) { valueRef.current = v; setValue(v); } };

    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      if (s.drag) {
        // While held, the bezel hangs back at each half degree and then drops into the next.
        const n = snap(s.raw), off = s.raw - n;
        const sticky = n + off - (Math.sin((off / STEP) * Math.PI * 2) * STEP) / (Math.PI * 2) * 0.8;
        s.v += (sticky - s.v) * Math.min(1, dt * 28); s.vel = 0;
        select(n);
      } else {
        const idle = now - touched > 5000;
        const stiff = idle ? 22 : 150, damp = idle ? 7.4 : 20; // slow and heavy by itself, quick under a key press
        s.vel += (stiff * (s.target - s.v) - damp * s.vel) * dt; s.v += s.vel * dt;
        if (idle) {
          s.lightTo = -2.25 + 0.22 * Math.sin(t / 2300);
          if (t > nextDemo) { s.target = tour[step % tour.length]; step++; select(s.target); nextDemo = t + 2700; }
        }
      }
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 5);
      s.press += ((s.drag ? 1 : 0) - s.press) * Math.min(1, dt * 10);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const settle = () => { s.v = s.target; s.vel = 0; draw(); };

    api.current = { go: (v) => { touched = performance.now(); s.target = v; select(v); if (reduce) settle(); else wake(); } };
    if (reduce) settle(); else wake();

    const angleAt = (e: PointerEvent) => { const b = pad.getBoundingClientRect(); return Math.atan2(e.clientX - (b.left + b.width / 2), -(e.clientY - (b.top + b.height / 2))); };
    const onDown = (e: PointerEvent) => {
      touched = performance.now(); s.drag = true; s.raw = s.v; lastAngle = angleAt(e);
      pad.setPointerCapture(e.pointerId); pad.focus({ preventScroll: true }); e.preventDefault(); wake();
    };
    const onMove = (e: PointerEvent) => {
      if (!s.drag) {
        const b = pad.getBoundingClientRect();
        touched = Math.max(touched, performance.now() - 3600);
        s.lightTo = clamp(Math.atan2(e.clientY - (b.top + b.height / 2) - 60, e.clientX - (b.left + b.width / 2)), -2.9, -1.5);
        if (reduce) { s.light = s.lightTo; draw(); }
        return;
      }
      touched = performance.now();
      const a = angleAt(e); let d = a - lastAngle; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
      lastAngle = a;
      // Turning clockwise brings the warmer numbers round to the index. Past either end it stiffens.
      const dv = (d * 180) / Math.PI / PER_DEGREE;
      const over = s.raw + dv > MAX ? s.raw + dv - MAX : s.raw + dv < MIN ? MIN - (s.raw + dv) : 0;
      s.raw += over > 0 ? dv * Math.max(0.06, 0.5 - over * 1.6) : dv;
      if (reduce) { s.target = snap(s.raw); select(s.target); settle(); }
    };
    const onUp = () => {
      if (!s.drag) return;
      s.drag = false; touched = performance.now();
      s.target = snap(s.raw); select(s.target);
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

  const set = (v: number) => { const n = snap(v); valueRef.current = n; setValue(n); api.current?.go(n); };
  const onKey = (e: ReactKeyboardEvent) => {
    const v = valueRef.current;
    const next = e.key === "ArrowRight" || e.key === "ArrowUp" ? v + STEP : e.key === "ArrowLeft" || e.key === "ArrowDown" ? v - STEP : e.key === "PageUp" ? v + 2 : e.key === "PageDown" ? v - 2 : e.key === "Home" ? MIN : e.key === "End" ? MAX : null;
    if (next === null) return;
    e.preventDefault(); set(next);
  };

  return (
    <div className="flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[#e6dfd3] bg-[radial-gradient(110%_90%_at_28%_12%,#f6f1e8_0%,#e6dfd3_52%,#d3cabb_100%)] px-0 py-12 sm:min-h-[720px]">
      <div className="relative h-[340px] w-[340px] sm:h-[580px] sm:w-[580px]">
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div
          ref={hit}
          role="slider"
          tabIndex={0}
          aria-label={`${ROOM_NAME} temperature`}
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={value}
          aria-valuetext={`${value.toFixed(1)} degrees, ${verb(value).split(" ")[0].toLowerCase()}`}
          onKeyDown={onKey}
          className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-4 focus-visible:ring-offset-[#e6dfd3] active:cursor-grabbing"
        />
      </div>
      <p className="mt-2 min-h-[20px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-stone-600 sm:-mt-4">
        <span className="text-stone-900">{ROOM_NAME}</span>
        <span className="mx-2 text-stone-400">/</span>
        {verb(value)} {value.toFixed(1)}&deg;
      </p>
    </div>
  );
}

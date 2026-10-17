import { useEffect, useRef, useState } from "react";

// What the loader says. The first is read while it runs, the second when it finishes.
const LABEL = "Fetching your library";
const DONE_LABEL = "Library ready";
const BALLS = 10; // one ball is seated for every 1 / BALLS of progress
const DEMO_SECONDS = 7; // length of the self-running demo
const SIZE = 340; // the bearing's box in CSS pixels
const PAD = 60; // extra canvas round the box so the shadow is never cut off
const STAGE = "#2445d8";

export default function SteelBallBearingLoader() {
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
    const dpr = Math.min(2, window.devicePixelRatio || 1) * 1.25;
    const FULL = SIZE + PAD * 2;
    cv.width = FULL * dpr; cv.height = FULL * dpr;
    const C = FULL / 2, OUT = 152, SHOULDER_O = 113, SHOULDER_I = 89, BORE = 54, PITCH = 101, BALL = 14.5;
    const hasConic = typeof ctx.createConicGradient === "function";
    const TAU = Math.PI * 2;

    // Turning marks for both rings, drawn once.
    const marks = document.createElement("canvas");
    marks.width = cv.width; marks.height = cv.height;
    const mx = marks.getContext("2d");
    if (mx) {
      mx.scale(dpr, dpr);
      let seed = 11;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let r = BORE; r < OUT; r += 0.6) {
        const v = rand();
        mx.beginPath(); mx.arc(C, C, r, 0, TAU);
        mx.lineWidth = 0.5 + rand() * 0.4;
        mx.strokeStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.34})` : `rgba(10,16,40,${(0.5 - v) * 0.24})`;
        mx.stroke();
      }
    }

    const s = { a: 0, v: 1.1, cage: 0.3, light: -2.25, lightTo: -2.25, drag: false, k: Array.from({ length: BALLS }, () => 0), kv: Array.from({ length: BALLS }, () => 0), seated: 0 };
    // Steel that picks up the blue of the table in its dark bands.
    const steel = (v: number) => { const c = Math.max(0, Math.min(255, v)); const k = Math.max(-40, 170 - c) * (c > 170 ? 0.03 : 0.16); return `rgb(${Math.max(0, c - k * 1.3) | 0},${Math.max(0, c - k * 0.3) | 0},${Math.min(255, c + k * 1.5) | 0})`; };
    const sheen = (angle: number, lo: number, hi: number) => {
      if (!hasConic) { const g = ctx.createLinearGradient(C - OUT, C - OUT, C + OUT, C + OUT); g.addColorStop(0, steel(hi)); g.addColorStop(0.5, steel(lo)); g.addColorStop(1, steel(hi)); return g; }
      const g = ctx.createConicGradient(angle, C, C);
      const mid = (lo + hi) / 2;
      const stops: [number, number][] = [[0, hi], [0.035, hi - 6], [0.09, mid + 14], [0.17, lo + 6], [0.24, lo - 16], [0.32, mid - 18], [0.4, mid + 10], [0.455, hi - 34], [0.5, hi - 10], [0.545, hi - 40], [0.61, mid - 4], [0.7, lo - 10], [0.77, lo + 12], [0.85, mid - 12], [0.925, mid + 32], [0.97, hi - 8], [1, hi]];
      for (const [p, v] of stops) g.addColorStop(p, steel(v));
      return g;
    };
    const ring = (r0: number, r1: number) => { ctx.beginPath(); ctx.arc(C, C, r1, 0, TAU); ctx.arc(C, C, r0, 0, TAU, true); };
    const etched = (text: string, r: number, start: number, size: number) => {
      ctx.save(); ctx.translate(C, C); ctx.rotate(start - ((text.length - 1) * size * 0.74) / r / 2);
      ctx.font = `600 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const ch of text) {
        ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.fillText(ch, 0.5, -r + 0.7);
        ctx.fillStyle = "rgba(24,30,52,0.72)"; ctx.fillText(ch, 0, -r);
        ctx.rotate((size * 0.74) / r);
      }
      ctx.restore();
    };

    const drawBall = (x: number, y: number, k: number, lx: number, ly: number) => {
      const lift = Math.max(0, 1 - k), R = BALL * (1 + lift * 0.85), alpha = Math.max(0, Math.min(1, k * 7));
      if (alpha <= 0) return;
      ctx.save(); ctx.globalAlpha = alpha;
      // Shadow on the race: far away while the ball is still in the air, tight once seated.
      ctx.beginPath(); ctx.arc(x - lx * (3 + lift * 30), y - ly * (3 + lift * 30), BALL * (1 + lift * 0.3), 0, TAU);
      ctx.fillStyle = `rgba(0,0,0,${0.5 - lift * 0.3})`; ctx.fill();
      const g = ctx.createRadialGradient(x + lx * R * 0.42, y + ly * R * 0.42, R * 0.04, x, y, R);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.2, "#f6f8fb"); g.addColorStop(0.48, "#bcc3cf"); g.addColorStop(0.74, "#5a6070"); g.addColorStop(0.91, "#1d2029"); g.addColorStop(1, "#8f9cc0");
      ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fillStyle = g; ctx.fill();
      // Brass of the cage thrown back off the far side of the ball.
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.clip();
      const b = ctx.createRadialGradient(x - lx * R * 0.8, y - ly * R * 0.8, 0, x - lx * R * 0.8, y - ly * R * 0.8, R * 0.85);
      b.addColorStop(0, "rgba(232,184,96,0.6)"); b.addColorStop(1, "rgba(232,184,96,0)");
      ctx.fillStyle = b; ctx.fillRect(x - R, y - R, R * 2, R * 2);
      ctx.restore();
      ctx.save(); ctx.translate(x + lx * R * 0.46, y + ly * R * 0.46); ctx.rotate(Math.atan2(ly, lx) + Math.PI / 2); ctx.scale(1, 0.55);
      ctx.beginPath(); ctx.arc(0, 0, R * 0.2, 0, TAU); ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.fill(); ctx.restore();
      ctx.restore();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, FULL, FULL);
      const la = s.light, lx = Math.cos(la), ly = Math.sin(la);

      // Shadow on the table: wide and soft, then tight where the steel touches.
      ctx.save(); ctx.shadowColor = "rgba(6,14,70,0.6)"; ctx.shadowBlur = 34 * dpr; ctx.shadowOffsetX = -lx * 10 * dpr; ctx.shadowOffsetY = 20 * dpr;
      ring(BORE, OUT - 4); ctx.fillStyle = "#000"; ctx.fill("evenodd"); ctx.restore();
      ctx.save(); ctx.shadowColor = "rgba(4,10,56,0.8)"; ctx.shadowBlur = 5 * dpr; ctx.shadowOffsetY = 3.5 * dpr;
      ring(BORE, OUT - 1); ctx.fillStyle = "#000"; ctx.fill("evenodd"); ctx.restore();

      // The groove the balls run in.
      const floor = ctx.createRadialGradient(C, C, SHOULDER_I - 2, C, C, SHOULDER_O + 2);
      floor.addColorStop(0, "#565c6c"); floor.addColorStop(0.22, "#101218"); floor.addColorStop(0.78, "#0d0f14"); floor.addColorStop(1, "#4b5162");
      ring(SHOULDER_I - 2, SHOULDER_O + 2); ctx.fillStyle = floor; ctx.fill("evenodd");

      // Pressed brass cage: a ribbon with a pocket for each ball and a rivet between pockets.
      const ribbon = ctx.createRadialGradient(C, C, PITCH - 8, C, C, PITCH + 8);
      ribbon.addColorStop(0, "#5c3f12"); ribbon.addColorStop(0.3, "#c79a45"); ribbon.addColorStop(0.5, "#f1d48a"); ribbon.addColorStop(0.72, "#b98a38"); ribbon.addColorStop(1, "#553a10");
      ring(PITCH - 7.5, PITCH + 7.5); ctx.fillStyle = ribbon; ctx.fill("evenodd");
      for (let i = 0; i < BALLS; i++) {
        const ang = s.cage + (i / BALLS) * TAU, x = C + Math.cos(ang) * PITCH, y = C + Math.sin(ang) * PITCH;
        const pocket = ctx.createRadialGradient(x + lx * 5, y + ly * 5, BALL - 2, x, y, BALL + 5);
        pocket.addColorStop(0, "#f6dc97"); pocket.addColorStop(0.55, "#c0913d"); pocket.addColorStop(1, "#553a10");
        ctx.beginPath(); ctx.arc(x, y, BALL + 4.5, 0, TAU); ctx.fillStyle = pocket; ctx.fill();
        const hole = ctx.createRadialGradient(x - lx * 4, y - ly * 4, 2, x, y, BALL + 1);
        hole.addColorStop(0, "#1a1c22"); hole.addColorStop(1, "#06070a");
        ctx.beginPath(); ctx.arc(x, y, BALL + 1, 0, TAU); ctx.fillStyle = hole; ctx.fill();
        const mid = ang + Math.PI / BALLS, rx = C + Math.cos(mid) * PITCH, ry = C + Math.sin(mid) * PITCH;
        ctx.beginPath(); ctx.arc(rx - lx * 0.8, ry - ly * 0.8, 3.1, 0, TAU); ctx.fillStyle = "rgba(60,38,8,0.75)"; ctx.fill();
        const rivet = ctx.createRadialGradient(rx + lx * 1.1, ry + ly * 1.1, 0.2, rx, ry, 2.7);
        rivet.addColorStop(0, "#fff3c9"); rivet.addColorStop(0.6, "#c99b46"); rivet.addColorStop(1, "#6b4a17");
        ctx.beginPath(); ctx.arc(rx, ry, 2.6, 0, TAU); ctx.fillStyle = rivet; ctx.fill();
      }
      for (let i = 0; i < BALLS; i++) if (s.k[i] > 0.6) { const ang = s.cage + (i / BALLS) * TAU; drawBall(C + Math.cos(ang) * PITCH, C + Math.sin(ang) * PITCH, s.k[i], lx, ly); }

      // The two rings. Their reflections hold still while the engraving turns.
      const steelRing = (r0: number, r1: number, off: number) => {
        ring(r0, r1); ctx.fillStyle = sheen(la + off, 104, 255); ctx.fill("evenodd");
        ctx.save(); ring(r0, r1); ctx.clip("evenodd");
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(marks, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const crown = ctx.createRadialGradient(C, C, r0, C, C, r1);
        crown.addColorStop(0, "rgba(8,14,44,0.4)"); crown.addColorStop(0.16, "rgba(8,14,44,0)"); crown.addColorStop(0.5, "rgba(255,255,255,0.14)"); crown.addColorStop(0.84, "rgba(8,14,44,0)"); crown.addColorStop(1, "rgba(8,14,44,0.46)");
        ctx.fillStyle = crown; ctx.fillRect(0, 0, FULL, FULL);
        ctx.restore();
        // Ground chamfers on both edges, lit from the opposite side to the flat.
        for (const [c0, c1] of [[r0, r0 + 3.4], [r1 - 3.4, r1]]) { ring(c0, c1); ctx.fillStyle = sheen(la + off + 0.62, 60, 255); ctx.fill("evenodd"); }
        ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(8,12,34,0.55)";
        for (const r of [r0, r0 + 3.4, r1 - 3.4, r1]) { ctx.beginPath(); ctx.arc(C, C, r, 0, TAU); ctx.stroke(); }
      };
      steelRing(SHOULDER_O, OUT, 0);
      steelRing(BORE, SHOULDER_I, 0.35);
      // A turned step on each ring, the seat a seal would snap into.
      for (const r of [121.5, 81.5]) {
        ctx.lineWidth = 1.3; ctx.strokeStyle = "rgba(8,12,34,0.5)"; ctx.beginPath(); ctx.arc(C, C, r, 0, TAU); ctx.stroke();
        ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.beginPath(); ctx.arc(C, C, r + (r > 100 ? 1.2 : -1.2), 0, TAU); ctx.stroke();
      }
      etched("DEEP GROOVE", 133, -0.62, 8.4);
      etched(`${BALLS} BALL`, 133, 0.62, 8.4);
      etched("CHROME STEEL", 133, Math.PI, 8.4);
      etched("30 x 62 x 16", 71.5, s.a, 7.6);
      for (const off of [2.1, 4.2]) {
        const x = C + Math.sin(s.a + off) * 71.5, y = C - Math.cos(s.a + off) * 71.5;
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fillStyle = "rgba(14,18,40,0.8)"; ctx.fill();
        ctx.beginPath(); ctx.arc(x - lx * 0.6, y - ly * 0.6, 2.2, 0, TAU); ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.stroke();
      }
      // Balls still on their way down are drawn over the rings.
      for (let i = 0; i < BALLS; i++) if (s.k[i] <= 0.6) { const ang = s.cage + (i / BALLS) * TAU; drawBall(C + Math.cos(ang) * PITCH, C + Math.sin(ang) * PITCH, s.k[i], lx, ly); }

      // The table seen through the bore, in the shadow of the inner ring.
      ctx.save(); ctx.beginPath(); ctx.arc(C, C, BORE, 0, TAU); ctx.clip();
      ctx.fillStyle = STAGE; ctx.fillRect(C - BORE, C - BORE, BORE * 2, BORE * 2);
      const well = ctx.createRadialGradient(C - lx * 12, C - ly * 12 + 6, BORE * 0.5, C, C, BORE + 6);
      well.addColorStop(0, "rgba(5,12,64,0)"); well.addColorStop(1, "rgba(5,12,64,0.72)");
      ctx.fillStyle = well; ctx.fillRect(C - BORE, C - BORE, BORE * 2, BORE * 2);
      ctx.restore();
    };

    let raf = 0, last = 0, seen = true, clock = 0, shown = -1, lastAngle = 0, touched = -1e9, idle = 0;
    const HOLD = 2.4;
    const report = (p: number) => { const n = Math.round(p * 100); if (n !== shown) { shown = n; setPct(n); } };
    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.033, (now - last) / 1000); last = now;

      // Demo clock. Delete this block when `progress.current` is fed from real work.
      clock += dt;
      if (clock < DEMO_SECONDS) { const t = clock / DEMO_SECONDS; progress.current = Math.min(1, t + 0.035 * Math.sin(t * Math.PI * 6) * (1 - t)); }
      else if (clock < DEMO_SECONDS + HOLD) progress.current = 1;
      else { clock = 0; progress.current = 0; }

      const p = Math.max(0, Math.min(1, progress.current));
      const want = Math.floor(p * BALLS + 1e-6);
      if (want > s.seated) s.v += 0.9 * (want - s.seated); // each ball that lands nudges the bearing round
      s.seated = want;
      for (let i = 0; i < BALLS; i++) {
        const to = i < want ? 1 : 0;
        if (to === 1) { s.kv[i] += (150 * (1 - s.k[i]) - 15 * s.kv[i]) * dt; s.k[i] += s.kv[i] * dt; }
        else { s.kv[i] = 0; s.k[i] = Math.max(0, s.k[i] - dt * 3.2); }
      }
      const cruise = p >= 1 ? 0.5 : 1.1 + 2.3 * p;
      if (!s.drag) { s.v += (cruise - s.v) * Math.min(1, dt * 1.1); s.a += s.v * dt; s.cage += s.v * 0.42 * dt; }
      idle += dt;
      if (now - touched > 4000) s.lightTo = -2.25 + 0.3 * Math.sin(idle / 2.3);
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 6);
      report(p);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(frame); } };
    const still = () => { progress.current = 1; s.k = s.k.map(() => 1); s.seated = BALLS; report(1); draw(); };
    restart.current = () => { clock = 0; progress.current = 0; if (reduce) still(); else wake(); };
    if (reduce) still(); else wake();

    const angleAt = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); return Math.atan2(e.clientY - (b.top + b.height / 2), e.clientX - (b.left + b.width / 2)); };
    const onDown = (e: PointerEvent) => { s.drag = true; lastAngle = angleAt(e); touched = performance.now(); cv.setPointerCapture(e.pointerId); };
    const onMove = (e: PointerEvent) => {
      if (reduce) return;
      if (!s.drag) { touched = performance.now() - 2600; s.lightTo = angleAt(e); return; }
      touched = performance.now();
      const a = angleAt(e); let d = a - lastAngle; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
      lastAngle = a; s.a += d; s.cage += d * 0.42; s.v = s.v * 0.6 + (d / 0.016) * 0.4; // a flick carries on after you let go
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
    <div className="flex min-h-[640px] w-full overflow-hidden flex-col items-center justify-center bg-[#2445d8] bg-[radial-gradient(110%_80%_at_50%_32%,#3a5cf0_0%,#2445d8_48%,#1a34b4_100%)] px-4 py-12 sm:min-h-[720px]">
      <div
        role="progressbar"
        aria-label={LABEL}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={done ? DONE_LABEL : `${pct} percent, ${Math.min(BALLS, Math.floor(pct / (100 / BALLS)))} of ${BALLS} balls seated`}
        className="relative h-[340px] w-[340px] sm:my-12 sm:scale-125"
      >
        <canvas ref={canvas} aria-hidden="true" className="absolute -left-[60px] -top-[60px] h-[460px] w-[460px] max-w-none cursor-grab touch-none rounded-full active:cursor-grabbing" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[26px] font-semibold tabular-nums tracking-tight text-white">
          {pct}
          <span className="ml-0.5 text-[13px] text-blue-100">%</span>
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center gap-3">
        <p role="status" className="font-mono text-[11px] uppercase tracking-[0.2em] text-white">
          {done ? DONE_LABEL : LABEL}
        </p>
        <button
          type="button"
          onClick={() => restart.current?.()}
          className="flex h-10 items-center rounded-full border border-white/40 px-5 font-mono text-[11px] uppercase tracking-[0.18em] text-white outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
        >
          Run again
        </button>
      </div>
    </div>
  );
}

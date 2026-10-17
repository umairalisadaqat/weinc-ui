import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

// One entry per wheel, left to right. Add a fourth and the housing does not grow by itself: widen W too.
const wheels = [
  { name: "Hundreds", mark: "x100" },
  { name: "Tens", mark: "x10" },
  { name: "Units", mark: "x1" },
];
const field = { label: "Print run", unit: "copies", name: "copies" };
const start = [2, 4, 8];
const demo = [[3, 1, 5], [0, 7, 2], [1, 9, 6], [2, 4, 8]]; // numbers it rolls to while idle
const WHEEL = [236, 96, 28]; // the knurled wheels, as red, green, blue
const W = 328, H = 236;
const UNIT = 92, LEFT = 26, CY = 112;

type Api = { nudge: (i: number, by: number) => void; to: (i: number, digit: number) => void; grab: (i: number, y: number) => void; drag: (y: number) => void; drop: () => void };
const digitOf = (n: number) => ((Math.round(n) % 10) + 10) % 10;

export default function ThumbwheelNumberPicker() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [digits, setDigits] = useState(start);
  const api = useRef<Api | null>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1) * 1.5; // shown one and a half times larger on wide screens
    cv.width = W * dpr; cv.height = H * dpr;
    const STEP = (Math.PI * 2) / 10, RD = 58, RW = 62, WIN = 37, SLOT = 56;
    const BX = 14, BY = 30, BW = 300, BH = 164;

    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };
    let seed = 5;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // The housing never changes, so it is painted once: moulded black plastic with a fine spark-eroded texture.
    const still = document.createElement("canvas");
    still.width = cv.width; still.height = cv.height;
    const sc = still.getContext("2d");
    if (sc) {
      sc.scale(dpr, dpr);
      sc.save(); sc.shadowColor = "rgba(40,26,6,0.6)"; sc.shadowBlur = 5 * dpr; sc.shadowOffsetY = 3 * dpr;
      rr(sc, BX, BY, BW, BH, 9); sc.fillStyle = "#000"; sc.fill(); sc.restore();
      const body = sc.createLinearGradient(0, BY, 0, BY + BH);
      body.addColorStop(0, "#3a3a3d"); body.addColorStop(0.05, "#2b2b2e"); body.addColorStop(0.5, "#232325"); body.addColorStop(0.93, "#19191b"); body.addColorStop(1, "#0d0d0e");
      rr(sc, BX, BY, BW, BH, 9); sc.fillStyle = body; sc.fill();
      sc.save(); rr(sc, BX, BY, BW, BH, 9); sc.clip();
      for (let i = 0; i < 5200; i++) {
        const v = rand();
        sc.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.12})` : `rgba(0,0,0,${(0.5 - v) * 0.3})`;
        sc.fillRect(BX + rand() * BW, BY + rand() * BH, 0.7, 0.7);
      }
      // A wide soft reflection across the top face.
      const sheen = sc.createLinearGradient(BX, BY, BX + BW * 0.7, BY + BH);
      sheen.addColorStop(0, "rgba(255,255,255,0.11)"); sheen.addColorStop(0.35, "rgba(255,255,255,0.02)"); sheen.addColorStop(1, "rgba(255,255,255,0)");
      sc.fillStyle = sheen; sc.fillRect(BX, BY, BW, BH);
      sc.restore();
      // Moulded chamfers along the long edges.
      const cham = sc.createLinearGradient(0, BY, 0, BY + BH);
      cham.addColorStop(0, "rgba(255,255,255,0.2)"); cham.addColorStop(0.036, "rgba(255,255,255,0.07)"); cham.addColorStop(0.04, "rgba(255,255,255,0)"); cham.addColorStop(0.955, "rgba(0,0,0,0)"); cham.addColorStop(0.96, "rgba(0,0,0,0.4)"); cham.addColorStop(1, "rgba(0,0,0,0.6)");
      rr(sc, BX, BY, BW, BH, 9); sc.fillStyle = cham; sc.fill();
      const lip = sc.createLinearGradient(0, BY, 0, BY + BH);
      lip.addColorStop(0, "rgba(255,255,255,0.5)"); lip.addColorStop(0.08, "rgba(255,255,255,0.1)"); lip.addColorStop(0.9, "rgba(0,0,0,0.2)"); lip.addColorStop(1, "rgba(0,0,0,0.8)");
      rr(sc, BX + 0.6, BY + 0.6, BW - 1.2, BH - 1.2, 8.5); sc.lineWidth = 1.2; sc.strokeStyle = lip; sc.stroke();

      // Part lines where the stacked sections meet, and a slotted screw in each end cap.
      for (let i = 0; i <= wheels.length; i++) {
        const x = LEFT + i * UNIT;
        sc.fillStyle = "rgba(0,0,0,0.85)"; sc.fillRect(x - 0.6, BY + 1, 1.2, BH - 2);
        sc.fillStyle = "rgba(255,255,255,0.13)"; sc.fillRect(x + 0.6, BY + 2, 0.7, BH - 4);
      }
      for (const [x, turn] of [[BX + 6, 0.5], [BX + BW - 6, 2.1]] as const) for (const y of [BY + 20, BY + BH - 20]) {
        sc.beginPath(); sc.arc(x, y, 3.4, 0, Math.PI * 2); sc.fillStyle = "#050505"; sc.fill();
        const g = sc.createLinearGradient(x - 3, y - 3, x + 3, y + 3); g.addColorStop(0, "#b9b6ae"); g.addColorStop(1, "#4a4843");
        sc.beginPath(); sc.arc(x, y, 2.7, 0, Math.PI * 2); sc.fillStyle = g; sc.fill();
        sc.strokeStyle = "#1a1917"; sc.lineWidth = 0.9; sc.beginPath(); sc.moveTo(x - Math.cos(turn + y) * 2.6, y - Math.sin(turn + y) * 2.6); sc.lineTo(x + Math.cos(turn + y) * 2.6, y + Math.sin(turn + y) * 2.6); sc.stroke();
      }

      wheels.forEach((w, i) => {
        const x0 = LEFT + i * UNIT, wx = x0 + 9, dx = x0 + 42;
        // Recesses: a bright lower lip, a dark upper one, then the hole.
        const well = (x: number, y: number, ww: number, hh: number, r: number) => {
          rr(sc, x - 2, y - 1.4, ww + 4, hh + 4.2, r + 2); sc.fillStyle = "rgba(255,255,255,0.2)"; sc.fill();
          rr(sc, x - 2, y - 2.4, ww + 4, hh + 4, r + 2); sc.fillStyle = "#070707"; sc.fill();
          rr(sc, x, y, ww, hh, r); sc.fillStyle = "#000"; sc.fill();
        };
        well(wx, CY - SLOT, 22, SLOT * 2, 3);
        well(dx, CY - WIN, 42, WIN * 2, 4);
        // White index ticks either side of the window, and the multiplier under it.
        sc.fillStyle = "rgba(245,242,234,0.92)";
        sc.fillRect(dx - 7.5, CY - 0.8, 4, 1.6); sc.fillRect(dx + 45.5, CY - 0.8, 3, 1.6);
        sc.font = "600 7.5px ui-monospace, SFMono-Regular, Menlo, monospace"; sc.textAlign = "center"; sc.textBaseline = "middle";
        sc.fillStyle = "rgba(0,0,0,0.8)"; sc.fillText(w.mark.toUpperCase(), dx + 21, CY + WIN + 17.2);
        sc.fillStyle = "rgba(245,242,234,0.62)"; sc.fillText(w.mark.toUpperCase(), dx + 21, CY + WIN + 18);
        // Moulded arrows that say which way the wheel adds.
        sc.fillStyle = "rgba(245,242,234,0.5)";
        sc.beginPath(); sc.moveTo(wx + 11, CY - SLOT - 12); sc.lineTo(wx + 15, CY - SLOT - 6.5); sc.lineTo(wx + 7, CY - SLOT - 6.5); sc.closePath(); sc.fill();
        sc.fillRect(wx + 7.5, CY + SLOT + 8, 7, 1.4);
      });
    }

    const s = wheels.map((_, i) => ({ a: start[i], v: 0, target: start[i], raw: start[i] }));
    let held = -1, heldY = 0, moved = 0, light = 0;
    const font = '700 40px "Helvetica Neue", Helvetica, Arial, sans-serif';

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(still, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      wheels.forEach((_, i) => {
        const x0 = LEFT + i * UNIT, wx = x0 + 9, dx = x0 + 42, a = s[i].a;

        // Knurled wheel: a cylinder seen edge on. Teeth bunch up towards the top and bottom, and the upper ones catch the light.
        ctx.save(); rr(ctx, wx, CY - SLOT, 22, SLOT * 2, 3); ctx.clip();
        const teeth = 46, dT = (Math.PI * 2) / teeth, spin = a * STEP;
        const yAt = (t: number) => CY + RW * Math.sin(Math.max(-Math.PI / 2, Math.min(Math.PI / 2, t)));
        const tone = (k: number, white: number) => `rgb(${Math.min(255, WHEEL[0] * k + white) | 0},${Math.min(255, WHEEL[1] * k + white) | 0},${Math.min(255, WHEEL[2] * k + white) | 0})`;
        ctx.fillStyle = tone(0.12, 0); ctx.fillRect(wx, CY - SLOT, 22, SLOT * 2);
        for (let j = 0; j < teeth; j++) {
          let th = j * dT - spin; th = Math.atan2(Math.sin(th), Math.cos(th));
          if (Math.abs(th) > Math.PI / 2 + dT) continue;
          const lit = Math.max(0, Math.cos(th + 0.42 + light * 0.2)), glint = Math.pow(lit, 14);
          // Each tooth has a face that looks up, a flat crown and a face that looks down into the next groove.
          ctx.fillStyle = tone(0.5 + 0.62 * lit, glint * 120); ctx.fillRect(wx, yAt(th), 22, yAt(th + dT * 0.22) - yAt(th) + 0.3);
          ctx.fillStyle = tone(0.4 + 0.5 * lit, glint * 30); ctx.fillRect(wx, yAt(th + dT * 0.22), 22, yAt(th + dT * 0.55) - yAt(th + dT * 0.22) + 0.3);
          ctx.fillStyle = tone(0.2 + 0.22 * lit, 0); ctx.fillRect(wx, yAt(th + dT * 0.55), 22, yAt(th + dT * 0.74) - yAt(th + dT * 0.55) + 0.3);
        }
        // Smooth flanges either side of the knurling.
        for (const fx of [wx, wx + 18.5]) {
          const fl = ctx.createLinearGradient(0, CY - SLOT, 0, CY + SLOT);
          fl.addColorStop(0, tone(0.3, 0)); fl.addColorStop(0.3, tone(1.06, 40)); fl.addColorStop(0.42, tone(0.96, 0)); fl.addColorStop(1, tone(0.3, 0));
          ctx.fillStyle = fl; ctx.fillRect(fx, CY - SLOT, 3.5, SLOT * 2);
          ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(fx === wx ? fx + 3.5 : fx - 0.6, CY - SLOT, 0.6, SLOT * 2);
        }
        const roll = ctx.createLinearGradient(0, CY - SLOT, 0, CY + SLOT);
        roll.addColorStop(0, "rgba(0,0,0,0.9)"); roll.addColorStop(0.14, "rgba(0,0,0,0.3)"); roll.addColorStop(0.3, "rgba(0,0,0,0)"); roll.addColorStop(0.66, "rgba(0,0,0,0.12)"); roll.addColorStop(0.86, "rgba(0,0,0,0.6)"); roll.addColorStop(1, "rgba(0,0,0,0.95)");
        ctx.fillStyle = roll; ctx.fillRect(wx, CY - SLOT, 22, SLOT * 2);
        const edge = ctx.createLinearGradient(wx, 0, wx + 22, 0);
        edge.addColorStop(0, "rgba(0,0,0,0.45)"); edge.addColorStop(0.1, "rgba(0,0,0,0)"); edge.addColorStop(0.86, "rgba(0,0,0,0)"); edge.addColorStop(1, "rgba(0,0,0,0.55)");
        ctx.fillStyle = edge; ctx.fillRect(wx, CY - SLOT, 22, SLOT * 2);
        ctx.restore();

        // Digit drum behind its window.
        ctx.save(); rr(ctx, dx, CY - WIN, 42, WIN * 2, 4); ctx.clip();
        const drum = ctx.createLinearGradient(0, CY - WIN, 0, CY + WIN);
        drum.addColorStop(0, "#020202"); drum.addColorStop(0.24, "#1d1d1f"); drum.addColorStop(0.42, "#343437"); drum.addColorStop(0.58, "#252527"); drum.addColorStop(0.84, "#0c0c0d"); drum.addColorStop(1, "#000");
        ctx.fillStyle = drum; ctx.fillRect(dx, CY - WIN, 42, WIN * 2);
        ctx.font = font; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const near = Math.round(a);
        for (let k = near - 2; k <= near + 2; k++) {
          const th = (k - a) * STEP;
          if (Math.abs(th) >= Math.PI / 2) continue;
          const cos = Math.cos(th);
          ctx.save(); ctx.translate(dx + 21, CY + RD * Math.sin(th) + 2 * cos); ctx.scale(1, cos);
          ctx.fillStyle = `rgba(246,243,234,${Math.pow(cos, 1.4)})`; ctx.fillText(String(digitOf(k)), 0, 0);
          ctx.restore();
          // The seam between two numerals.
          const ys = CY + RD * Math.sin(th + STEP / 2);
          if (Math.abs(th + STEP / 2) < Math.PI / 2) { ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(dx, ys, 42, 0.8); ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fillRect(dx, ys + 0.8, 42, 0.6); }
        }
        const fall = ctx.createLinearGradient(0, CY - WIN, 0, CY + WIN);
        fall.addColorStop(0, "rgba(0,0,0,0.96)"); fall.addColorStop(0.2, "rgba(0,0,0,0.45)"); fall.addColorStop(0.36, "rgba(0,0,0,0)"); fall.addColorStop(0.68, "rgba(0,0,0,0)"); fall.addColorStop(0.86, "rgba(0,0,0,0.55)"); fall.addColorStop(1, "rgba(0,0,0,0.92)");
        ctx.fillStyle = fall; ctx.fillRect(dx, CY - WIN, 42, WIN * 2);
        // A clear cover over the window: one soft band of reflection that drifts with the light.
        const gx = dx + 4 + light * 5;
        ctx.beginPath(); ctx.moveTo(gx, CY - WIN); ctx.lineTo(gx + 19, CY - WIN); ctx.lineTo(gx + 3, CY + WIN); ctx.lineTo(gx - 16, CY + WIN); ctx.closePath();
        const gloss = ctx.createLinearGradient(0, CY - WIN, 0, CY + WIN);
        gloss.addColorStop(0, "rgba(255,255,255,0.2)"); gloss.addColorStop(0.5, "rgba(255,255,255,0.05)"); gloss.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gloss; ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.fillRect(dx, CY - WIN, 42, 0.8);
        ctx.restore();
      });
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, t0 = 0, step = 0, nextDemo = 0.9;
    const queue: { at: number; i: number; d: number }[] = [];
    const publish = () => { const next = s.map((w) => digitOf(w.target)); setDigits((old) => (old.every((d, i) => d === next[i]) ? old : next)); };
    // Roll to a digit the short way round.
    const aim = (i: number, d: number) => { const cur = digitOf(s[i].target); let by = d - cur; if (by > 5) by -= 10; if (by < -5) by += 10; s[i].target += by; };

    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      if (now - touched > 5000 && held < 0) {
        light += (Math.sin(t * 0.9) - light) * Math.min(1, dt * 3);
        if (demo.length && t > nextDemo) { demo[step % demo.length].forEach((d, i) => queue.push({ at: t + i * 0.16, i, d })); step++; nextDemo = t + 1.5; }
      } else queue.length = 0;
      for (let q = queue.length - 1; q >= 0; q--) if (t >= queue[q].at) { aim(queue[q].i, queue[q].d); queue.splice(q, 1); publish(); }
      s.forEach((w, i) => {
        if (i === held) {
          // In the hand each wheel clings to a number, then drops into the next.
          const n = Math.round(w.raw), off = w.raw - n, sticky = n + off - (Math.sin(off * Math.PI * 2) / (Math.PI * 2)) * 0.8;
          w.v = ((sticky - w.a) / Math.max(dt, 0.001)) * 0.3; w.a += (sticky - w.a) * Math.min(1, dt * 34);
        } else { w.v += (330 * (w.target - w.a) - 21 * w.v) * dt; w.a += w.v * dt; }
      });
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const settle = () => { s.forEach((w) => { w.a = w.target; w.v = 0; }); draw(); };
    const after = () => { publish(); if (reduce) settle(); else wake(); };

    api.current = {
      nudge: (i, by) => { touched = performance.now(); s[i].target = Math.round(s[i].target) + by; after(); },
      to: (i, d) => { touched = performance.now(); aim(i, d); after(); },
      grab: (i, y) => { touched = performance.now(); held = i; heldY = y; moved = 0; s[i].raw = s[i].a; wake(); },
      drag: (y) => {
        if (held < 0) return;
        const w = s[held], dy = y - heldY; heldY = y; moved += Math.abs(dy); touched = performance.now();
        w.raw -= dy / (RD * STEP); // pushing the wheel up adds
        w.target = Math.round(w.raw); after();
      },
      drop: () => {
        if (held < 0) return;
        const w = s[held];
        w.target = moved < 4 ? Math.round(w.target) + 1 : Math.round(w.raw + w.v * 0.09); // a tap adds one, a flick carries on a little
        held = -1; touched = performance.now(); after();
      },
    };
    if (reduce) settle(); else wake();

    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const scaleOf = (el: HTMLElement) => el.getBoundingClientRect().height / el.offsetHeight || 1;
  const onDown = (e: ReactPointerEvent<HTMLDivElement>, i: number) => { e.currentTarget.setPointerCapture(e.pointerId); api.current?.grab(i, e.clientY / scaleOf(e.currentTarget)); };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) api.current?.drag(e.clientY / scaleOf(e.currentTarget)); };
  const onKey = (e: ReactKeyboardEvent, i: number) => {
    if (e.key === "ArrowUp" || e.key === "ArrowRight") api.current?.nudge(i, 1);
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") api.current?.nudge(i, -1);
    else if (e.key === "Home") api.current?.to(i, 0);
    else if (e.key === "End") api.current?.to(i, 9);
    else if (/^[0-9]$/.test(e.key)) api.current?.to(i, Number(e.key));
    else return;
    e.preventDefault();
  };
  const total = digits.reduce((n, d) => n * 10 + d, 0);

  return (
    <div className="flex min-h-[600px] w-full flex-col items-center justify-center bg-[#e6dfd0] bg-[radial-gradient(90%_70%_at_50%_38%,#f3eee3_0%,#e6dfd0_70%)] px-4 py-12 sm:min-h-[700px]">
      <p id="thumbwheel-picker-label" className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600 sm:mb-10">{field.label}</p>
      <div role="group" aria-labelledby="thumbwheel-picker-label" className="relative mt-2 h-[236px] w-[328px] sm:my-12 sm:scale-150">
        <div aria-hidden="true" className="absolute left-[34px] right-[34px] top-[150px] h-[62px] rounded-[50%] bg-[#4a3410] opacity-50 blur-xl" />
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        {wheels.map((w, i) => (
          <div
            key={w.name}
            role="spinbutton"
            tabIndex={0}
            aria-label={w.name}
            aria-valuemin={0}
            aria-valuemax={9}
            aria-valuenow={digits[i]}
            onPointerDown={(e) => onDown(e, i)}
            onPointerMove={onMove}
            onPointerUp={() => api.current?.drop()}
            onPointerCancel={() => api.current?.drop()}
            onKeyDown={(e) => onKey(e, i)}
            style={{ left: LEFT + i * UNIT + 3 }}
            className="absolute top-[36px] h-[152px] w-[86px] cursor-grab touch-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#ec601c] active:cursor-grabbing"
          />
        ))}
        <input type="hidden" name={field.name} value={total} />
      </div>
      <p aria-live="polite" className="mt-4 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-stone-600 sm:mt-10">
        <span className="font-semibold text-stone-900">{String(total).padStart(wheels.length, "0")}</span>
        <span className="mx-2 text-stone-400">/</span>
        {field.unit}
      </p>
    </div>
  );
}

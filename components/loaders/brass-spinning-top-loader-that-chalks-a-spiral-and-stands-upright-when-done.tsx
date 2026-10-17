import { useEffect, useRef, useState } from "react";

// What the loader says. The first is read while it runs, the second when it finishes.
const LABEL = "Syncing your notes";
const DONE_LABEL = "Everything is synced";
const DEMO_SECONDS = 7; // length of the self-running demo
const TICKS = 72; // marks on the ring chalked round the top
const BAND = ["#3d0b06", "#8f1d10", "#e2452c", "#ffd9cc", "#d83a22", "#7a160c", "#4a0d07", "#a8402c"]; // the enamel band, dark edge to rim light
const VIEW = 440; // the drawing is made on a 440 by 440 grid and scaled to its box

// Half-width of the top at each height above the tip, as turned on the lathe.
const PROFILE: [number, number][] = [[0, 0.6], [3, 2], [8, 3.2], [9, 6.2], [15, 7.6], [16, 9.5], [24, 17.5], [34, 29], [46, 41.5], [58, 52], [68, 58], [76, 61.2], [82, 62], [88, 61.4], [92, 58.5], [97, 51], [102, 41], [107, 30], [111, 21.5], [114, 16], [117, 12.4], [121, 10], [140, 8.4], [143, 8.4], [145, 11.6], [150, 13.2], [155, 12.2], [158, 9.4], [160, 5.5]];
const radiusAt = (h: number) => {
  for (let i = 1; i < PROFILE.length; i++) if (h <= PROFILE[i][0]) { const [h0, r0] = PROFILE[i - 1], [h1, r1] = PROFILE[i]; return r0 + ((r1 - r0) * (h - h0)) / (h1 - h0); }
  return PROFILE[PROFILE.length - 1][1];
};

export default function BrassSpinningTopLoader() {
  const canvas = useRef<HTMLCanvasElement>(null);
  // Write your own 0 to 1 value into this ref and delete the demo clock in `advance`.
  const progress = useRef(0);
  const actions = useRef<{ restart: () => void; flick: () => void } | null>(null);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1) * 1.2;
    cv.width = VIEW * dpr; cv.height = VIEW * dpr;
    const TAU = Math.PI * 2, OX = VIEW / 2, OY = 330, S = 1.5;
    const SE = Math.sin(0.5), CE = Math.cos(0.5); // the camera looks down at about 29 degrees
    const at = (x: number, y: number, z: number): [number, number] => [OX + x, OY + y * SE - z * CE];

    // One strip of shading per material, laid across the width of every slice.
    const strip = (stops: [number, string][]) => { const g = ctx.createLinearGradient(-1, 0, 1, 0); for (const [p, c] of stops) g.addColorStop(p, c); return g; };
    const brass = strip([[0, "#3a2607"], [0.07, "#7d5a1c"], [0.2, "#c79b45"], [0.29, "#f7e3a3"], [0.335, "#fffbe6"], [0.39, "#eccb78"], [0.55, "#b98a36"], [0.74, "#7a5519"], [0.88, "#4a3009"], [0.95, "#a57c36"], [1, "#5a3d10"]]);
    const enamel = strip([[0, BAND[0]], [0.14, BAND[1]], [0.28, BAND[2]], [0.335, BAND[3]], [0.4, BAND[4]], [0.66, BAND[5]], [0.88, BAND[6]], [0.96, BAND[7]], [1, BAND[6]]]);
    const cream = strip([[0, "#6f6753"], [0.3, "#fbf6e6"], [0.36, "#ffffff"], [0.6, "#d8cfb6"], [0.9, "#7d745e"], [1, "#a79e86"]]);
    const steel = strip([[0, "#1c1e22"], [0.26, "#c9ced6"], [0.34, "#ffffff"], [0.5, "#8b919b"], [0.85, "#22252a"], [1, "#6c727c"]]);
    const groove = "#2a1a04";
    const materialAt = (h: number) => (h < 9 ? steel : h >= 50 && h < 53 ? cream : h >= 53 && h < 76 ? enamel : h >= 76 && h < 79 ? cream : brass);
    const grooves = [16.5, 86, 90, 121.5, 143.5];

    const s = { p: 0, phi: 0.6, wander: 0, lean: 0, kick: 0, light: 0, trail: [] as [number, number][], clock: 0, time: 0 };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, VIEW, VIEW);

      // The chalk ring: one mark is rubbed in for each step of progress.
      const lit = s.p * TICKS;
      for (let i = 0; i < TICKS; i++) {
        const t = Math.PI / 2 + (i / TICKS) * TAU, // starts at the front, where nothing hides it
        long = i % 6 === 0, on = Math.max(0, Math.min(1, lit - i));
        const [x0, y0] = at(Math.cos(t) * 152, Math.sin(t) * 152, 0), [x1, y1] = at(Math.cos(t) * (long ? 170 : 162), Math.sin(t) * (long ? 170 : 162), 0);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
        ctx.lineCap = "round"; ctx.lineWidth = long ? 2 : 1.5; ctx.strokeStyle = `rgba(244,240,226,${0.2 + 0.75 * on})`; ctx.stroke();
      }

      // The line the tip has chalked so far.
      if (s.trail.length > 1) {
        ctx.beginPath();
        s.trail.forEach(([x, y], i) => { const [sx, sy] = at(x, y, 0); if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); });
        ctx.lineJoin = "round"; ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(244,240,226,0.62)"; ctx.stroke();
      }

      const dir = s.phi + 2.2, tilt = s.lean;
      const ax = Math.sin(tilt) * Math.cos(dir), ay = Math.sin(tilt) * Math.sin(dir), az = Math.cos(tilt);
      const tx = s.wander * Math.cos(s.phi), ty = s.wander * Math.sin(s.phi);
      const facing = Math.max(0.06, Math.abs(ay * CE + az * SE)); // how open each round slice looks from here
      const dx = ax, dy = ay * SE - az * CE, rot = Math.atan2(dy, dx) + Math.PI / 2;

      // Shadow thrown across the table, built from the same slices and blurred.
      const FAR = 2000;
      ctx.save(); ctx.shadowColor = "rgba(0,14,9,0.6)"; ctx.shadowBlur = 13 * dpr; ctx.shadowOffsetX = FAR * dpr;
      ctx.beginPath();
      for (let h = 0; h <= 160; h += 3) {
        const d = h * S, r = Math.max(2, radiusAt(h) * S), px = tx + ax * d, py = ty + ay * d, pz = az * d;
        const [gx, gy] = at(px + pz * 0.62, py - pz * 0.26, 0);
        ctx.moveTo(gx - FAR + r, gy); ctx.ellipse(gx - FAR, gy, r, r * SE, 0, 0, TAU);
      }
      ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      const [cx, cy] = at(tx, ty, 0);
      ctx.beginPath(); ctx.ellipse(cx + 2, cy + 0.5, 7, 2.6, 0, 0, TAU); ctx.fillStyle = "rgba(0,14,9,0.55)"; ctx.fill();

      // The top itself: a few hundred thin round slices from the tip upwards.
      let glint: [number, number, number] | null = null;
      for (let h = 0; h <= 160; h += 0.5) {
        const d = h * S, r = radiusAt(h) * S;
        const [x, y] = at(tx + ax * d, ty + ay * d, az * d);
        const slope = (radiusAt(h + 0.5) - radiusAt(h - 0.5));
        const up = -slope / Math.sqrt(1 + slope * slope); // above zero where the surface faces the lamp
        const cut = grooves.some((g) => Math.abs(g - h) < 0.4);
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(r, r * facing);
        ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU);
        ctx.fillStyle = cut ? groove : materialAt(h); ctx.fill();
        if (!cut && Math.abs(up) > 0.03) { ctx.fillStyle = up > 0 ? `rgba(255,246,214,${Math.min(0.34, up * 0.4)})` : `rgba(14,6,0,${Math.min(0.5, -up * 0.62)})`; ctx.fill(); }
        ctx.restore();
        if (h === 84) glint = [x, y, r];
      }
      const [kx, ky] = at(tx + ax * 160 * S, ty + ay * 160 * S, az * 160 * S);
      ctx.save(); ctx.translate(kx, ky); ctx.rotate(rot); ctx.scale(5.5 * S, 5.5 * S * facing);
      ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fillStyle = "#f3dc9a"; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, 0.45, 0, TAU); ctx.fillStyle = "#8a6522"; ctx.fill(); ctx.restore();

      // The lamp caught on the shoulder. It shivers a little because the top is turning.
      if (glint) {
        const [gx, gy, gr] = glint, wob = Math.sin(s.light) * 0.02;
        const hx = gx + Math.cos(rot) * gr * (-0.34 + wob), hy = gy + Math.sin(rot) * gr * (-0.34 + wob) + gr * facing * 0.82;
        const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 15);
        g.addColorStop(0, "rgba(255,255,255,0.95)"); g.addColorStop(0.25, "rgba(255,250,225,0.5)"); g.addColorStop(1, "rgba(255,250,225,0)");
        ctx.save(); ctx.translate(hx, hy); ctx.scale(0.5, 1); ctx.translate(-hx, -hy);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, 15, 0, TAU); ctx.fill(); ctx.restore();
      }
    };

    let shown = -1;
    const HOLD = 2.6;
    const report = (p: number) => { const n = Math.round(p * 100); if (n !== shown) { shown = n; setPct(n); } };
    const advance = (dt: number) => {
      // Demo clock. Delete this block when `progress.current` is fed from real work.
      s.clock += dt;
      if (s.clock < DEMO_SECONDS) { const t = s.clock / DEMO_SECONDS; progress.current = Math.min(1, t + 0.03 * Math.sin(t * Math.PI * 5) * (1 - t)); }
      else if (s.clock < DEMO_SECONDS + HOLD) progress.current = 1;
      else { s.clock = 0; progress.current = 0; }

      const p = Math.max(0, Math.min(1, progress.current));
      if (p < s.p - 0.2) s.trail = []; // a fresh run starts on a clean table
      s.p = p; s.time += dt;
      const left = 1 - p;
      // A top that is losing its wobble walks a shrinking circle and rises until it stands dead upright.
      const wanderTo = 66 * Math.pow(left, 1.1) + s.kick * 26;
      const leanTo = 0.36 * Math.pow(left, 1.05) + s.kick * 0.22 + 0.012 * left * Math.sin(s.time * 13);
      s.wander += (wanderTo - s.wander) * Math.min(1, dt * 5);
      s.lean += (leanTo - s.lean) * Math.min(1, dt * 7);
      s.kick *= Math.exp(-dt * 1.5);
      s.phi += dt * (3.6 + 1.6 * p);
      s.light += dt * 37;
      const x = s.wander * Math.cos(s.phi), y = s.wander * Math.sin(s.phi), tail = s.trail[s.trail.length - 1];
      if (!tail || Math.hypot(tail[0] - x, tail[1] - y) > 1.2) s.trail.push([x, y]);
      if (s.trail.length > 1600) s.trail.shift();
      report(p);
    };

    let raf = 0, last = 0, seen = true;
    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      advance(dt); draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(frame); } };
    // Reduced motion: run the whole spin in one go and show where it ends.
    const still = () => { s.clock = 0; s.trail = []; s.p = 0; s.wander = 66; s.lean = 0.36; for (let i = 0; i < DEMO_SECONDS * 60 + 30; i++) advance(1 / 60); s.wander = 0; s.lean = 0; draw(); };
    actions.current = {
      restart: () => { s.clock = 0; progress.current = 0; if (reduce) still(); else wake(); },
      flick: () => { if (!reduce) s.kick = 1; },
    };
    if (reduce) still(); else wake();

    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); actions.current = null; io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const done = pct >= 100;
  return (
    <div className="flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[#0e3a2c] bg-[radial-gradient(100%_75%_at_50%_42%,#1a5a44_0%,#0e3a2c_55%,#092a20_100%)] px-4 py-10 sm:min-h-[720px]">
      <div
        role="progressbar"
        aria-label={LABEL}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={done ? DONE_LABEL : `${pct} percent`}
        className="relative h-[328px] w-[328px] sm:h-[520px] sm:w-[520px]"
      >
        <canvas ref={canvas} aria-hidden="true" onPointerDown={() => actions.current?.flick()} className="absolute inset-0 h-full w-full cursor-pointer touch-manipulation" />
      </div>
      <div className="flex flex-col items-center gap-3">
        <p aria-hidden="true" className="font-mono text-[28px] font-semibold tabular-nums leading-none tracking-tight text-[#f4f0e2]">
          {pct}
          <span className="ml-0.5 text-[14px] text-emerald-200">%</span>
        </p>
        <p role="status" className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#f4f0e2]">
          {done ? DONE_LABEL : LABEL}
        </p>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={() => actions.current?.flick()}
            className="flex h-10 items-center rounded-full border border-[#f4f0e2]/40 px-5 font-mono text-[11px] uppercase tracking-[0.18em] text-[#f4f0e2] outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#f4f0e2] motion-reduce:transition-none"
          >
            Flick it
          </button>
          <button
            type="button"
            onClick={() => actions.current?.restart()}
            className="flex h-10 items-center rounded-full border border-[#f4f0e2]/40 px-5 font-mono text-[11px] uppercase tracking-[0.18em] text-[#f4f0e2] outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#f4f0e2] motion-reduce:transition-none"
          >
            Run again
          </button>
        </div>
      </div>
    </div>
  );
}

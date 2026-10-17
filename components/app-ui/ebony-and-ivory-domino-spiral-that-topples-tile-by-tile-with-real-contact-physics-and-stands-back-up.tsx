import { useEffect, useRef, useState } from "react";

const TURNS = 1.75; // how many times the line winds round before it ends
const OUTER = 8.3, INNER = 2.7; // radius of the spiral at its start and end, in tile widths
const PITCH = 0.95; // distance from one tile to the next
const TILE = { w: 1, h: 2, t: 0.3 }; // width, height and thickness of a tile
const IVORY = [246, 239, 224], EBONY = [50, 48, 56];
const PIP = "#17130f";
const GRAVITY = 45; // higher is a faster wave
const W = 720, H = 500; // drawing size in CSS pixels

type Phase = "standing" | "falling" | "down" | "rising";
const A = 0.25;
const PIPS: number[][][] = [[], [[0, 0]], [[-A, -A], [A, A]], [[-A, -A], [0, 0], [A, A]], [[-A, -A], [A, -A], [-A, A], [A, A]], [[-A, -A], [A, -A], [0, 0], [-A, A], [A, A]], [[-A, -A], [-A, 0], [-A, A], [A, -A], [A, 0], [A, A]]];

export default function DominoSpiral() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ push: () => void; stand: () => void } | null>(null);
  const [state, setState] = useState<{ phase: Phase; count: number; total: number; seconds: number }>({ phase: "standing", count: 0, total: 0, seconds: 0 });

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    const S = 30, SP = Math.sin(0.92), CP = Math.cos(0.92), CX = W / 2 + 6, CY = 262;
    const sx = (x: number) => CX + x * S, sy = (y: number, z: number) => CY + (z * SP - y * CP) * S;
    const norm = (a: number[]) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const LIGHT = norm([-0.46, 0.82, -0.3]), FILL = norm([0.2, 0.3, 0.93]), VIEW = [0, SP, CP], HALF = norm([LIGHT[0], LIGHT[1] + SP, LIGHT[2] + CP]);
    const rr = (x: number, y: number, w: number, h: number, r: number) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };

    // Walk along the spiral in equal steps and stand a tile at each one, facing down the line.
    const tiles: { x: number; z: number; e: number[]; c: number[]; a: number; b: number }[] = [];
    const sweep = Math.PI * 2 * TURNS, drop = (OUTER - INNER) / sweep;
    for (let f = 0, i = 0; f < sweep; i++) {
      const r = OUTER - drop * f, ang = Math.PI * 0.82 + f, cs = Math.cos(ang), sn = Math.sin(ang);
      const e = norm([-drop * cs - r * sn, 0, -drop * sn + r * cs]);
      tiles.push({ x: r * cs, z: r * sn, e, c: [-e[2], 0, e[0]], a: (i * 5 + 2) % 7, b: (i * 3 + 4) % 7 });
      f += PITCH / Math.hypot(r, drop);
    }
    const N = tiles.length, { w: TW, h: TH, t: TT } = TILE, TIP = Math.atan(TT / TH);
    const th = new Float64Array(N), om = new Float64Array(N), from = new Float64Array(N), lever = new Float64Array(N), gear = new Float64Array(N), touch = new Uint8Array(N);
    // The lean a tile forces on the next one, and the furthest a tile can lean onto the one in front of it.
    const pushTo = (a: number) => { const p = TH * Math.cos(a), q = PITCH - TH * Math.sin(a); return Math.asin(Math.min(1, TT / Math.hypot(p, q))) - Math.atan2(q, p); };
    const restOn = (a: number) => a - Math.asin(Math.max(-1, Math.min(1, (TT - PITCH * Math.cos(a)) / TH)));
    const s = { phase: "standing" as Phase, first: 0, clock: 0, took: 0, still: 0, idle: 0, auto: true };
    const report = () => setState({ phase: s.phase, count: N - s.first, total: N, seconds: s.took });

    const step = (dt: number) => {
      for (let i = s.first; i < N; i++) { if (th[i] <= 0) { if (om[i] < 0) om[i] = 0; continue; } om[i] += GRAVITY * Math.sin(th[i] - TIP) * dt; }
      // Which neighbours are pressing on each other, and by what ratio one turns the next.
      for (let i = s.first; i < N - 1; i++) {
        touch[i] = 0;
        if (th[i] < 0.1) continue;
        const need = pushTo(th[i]);
        if (th[i + 1] > need + 0.002) continue;
        gear[i] = Math.max(0.2, Math.min(4, (pushTo(th[i] + 0.001) - need) / 0.001));
        if (om[i] * gear[i] > om[i + 1]) touch[i] = 1;
      }
      touch[N - 1] = 0;
      // Tiles in contact move as one linkage, so their spin is shared out by those ratios. This is what sets the speed of the wave.
      for (let j = s.first; j < N; j++) {
        let k = j, num = om[j], den = 1; lever[j] = 1;
        while (k < N - 1 && touch[k]) { lever[k + 1] = lever[k] * gear[k]; k++; num += lever[k] * om[k]; den += lever[k] * lever[k]; }
        if (k === j) continue;
        const turn = k === N - 1 && th[k] >= Math.PI / 2 - 1e-9 ? 0 : Math.max(0, num / den);
        for (let m = j; m <= k; m++) om[m] = lever[m] * turn;
        j = k;
      }
      for (let i = s.first; i < N; i++) { th[i] += om[i] * dt; if (th[i] < 0) { th[i] = 0; om[i] = 0; } }
      if (th[N - 1] >= Math.PI / 2) { th[N - 1] = Math.PI / 2; om[N - 1] = 0; if (!s.took) s.took = s.clock; }
      for (let i = s.first; i < N - 1; i++) { if (th[i] < 0.1) continue; const need = Math.min(Math.PI / 2, pushTo(th[i])); if (th[i + 1] < need) th[i + 1] = need; }
      for (let i = N - 2; i >= s.first; i--) { const max = restOn(th[i + 1]); if (th[i] > max + 1e-9) { th[i] = max; if (om[i] > 0) om[i] = 0; } }
    };
    const rise = () => {
      let busy = false;
      for (let i = N - 1; i >= 0; i--) {
        const u = Math.max(0, Math.min(1, (s.clock - (N - 1 - i) * 0.016) / 0.55)), k = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
        th[i] = from[i] * (1 - k); if (u < 1) busy = true;
        if (i < N - 1) th[i] = Math.min(th[i], Math.max(0, restOn(th[i + 1])));
      }
      return busy;
    };

    const shade = (rgb: number[], k: number) => `rgb(${Math.min(255, rgb[0] * k) | 0},${Math.min(255, rgb[1] * k) | 0},${Math.min(255, rgb[2] * (k * 0.95 + 0.04)) | 0})`;
    const hull = (pts: number[][]) => {
      const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), turn = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      const lo: number[][] = [], hi: number[][] = [];
      for (const q of p) { while (lo.length > 1 && turn(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
      for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (hi.length > 1 && turn(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
      return lo.slice(0, -1).concat(hi.slice(0, -1));
    };
    const face = (c: number[], u: number[], v: number[]) => ctx.setTransform(dpr * u[0] * S, dpr * (u[2] * SP - u[1] * CP) * S, dpr * v[0] * S, dpr * (v[2] * SP - v[1] * CP) * S, dpr * sx(c[0]), dpr * sy(c[1], c[2]));
    const half = (value: number, cy: number, la: number) => {
      for (const [pu, pv] of PIPS[value]) {
        const x = pu * 1.06, y = cy + pv * 1.06;
        ctx.beginPath(); ctx.arc(x, y, 0.088, 0, Math.PI * 2); ctx.fillStyle = PIP; ctx.fill();
        ctx.lineWidth = 0.022; ctx.beginPath(); ctx.arc(x, y, 0.076, la + Math.PI - 0.9, la + Math.PI + 0.9); ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.stroke();
      }
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const boxes = tiles.map((tl, i) => {
        const c = Math.cos(th[i]), sn = Math.sin(th[i]);
        const ax = [tl.e[0] * c, -sn, tl.e[2] * c], up = [tl.e[0] * sn, c, tl.e[2] * sn]; // through the tile, and along its height
        const mid = [tl.x - ax[0] * TT / 2 + up[0] * TH / 2, -ax[1] * TT / 2 + up[1] * TH / 2, tl.z - ax[2] * TT / 2 + up[2] * TH / 2];
        return { tl, ax, up, mid, depth: dot(mid, VIEW) };
      });
      // Every shadow goes down in one blurred fill.
      ctx.save(); ctx.shadowColor = "rgba(6,16,58,0.5)"; ctx.shadowBlur = 5 * dpr; ctx.shadowOffsetX = 3000 * dpr; ctx.fillStyle = "#000"; ctx.beginPath();
      for (const b of boxes) {
        const pts: number[][] = [];
        for (const i of [-1, 1]) for (const j of [-1, 1]) for (const k of [-1, 1]) {
          const p = [b.mid[0] + b.ax[0] * i * TT / 2 + b.up[0] * j * TH / 2 + b.tl.c[0] * k * TW / 2, b.mid[1] + b.ax[1] * i * TT / 2 + b.up[1] * j * TH / 2, b.mid[2] + b.ax[2] * i * TT / 2 + b.up[2] * j * TH / 2 + b.tl.c[2] * k * TW / 2];
          pts.push([sx(p[0] - (p[1] * LIGHT[0]) / LIGHT[1]) - 3000, sy(0, p[2] - (p[1] * LIGHT[2]) / LIGHT[1])]);
        }
        hull(pts).forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
      }
      ctx.fill(); ctx.restore();

      boxes.sort((p, q) => p.depth - q.depth);
      for (const b of boxes) {
        const { tl, ax, up, mid } = b, back = [-ax[0], -ax[1], -ax[2]];
        const sides: { n: number[]; u: number[]; v: number[]; hu: number; hv: number; kind: number }[] = [
          { n: back, u: tl.c, v: up, hu: TW / 2, hv: TH / 2, kind: 0 }, { n: ax, u: tl.c, v: up, hu: TW / 2, hv: TH / 2, kind: 1 },
          { n: up, u: tl.c, v: ax, hu: TW / 2, hv: TT / 2, kind: 2 }, { n: [-up[0], -up[1], -up[2]], u: tl.c, v: ax, hu: TW / 2, hv: TT / 2, kind: 2 },
          { n: tl.c, u: up, v: ax, hu: TH / 2, hv: TT / 2, kind: 2 }, { n: [-tl.c[0], 0, -tl.c[2]], u: up, v: ax, hu: TH / 2, hv: TT / 2, kind: 2 },
        ];
        for (const f of sides) {
          const facing = dot(f.n, VIEW);
          if (facing <= 0.01) continue;
          const reach = f.kind === 2 ? 0 : TT / 2, k = 0.56 + 0.5 * Math.max(0, dot(f.n, LIGHT)) + 0.36 * Math.max(0, dot(f.n, FILL));
          const sign = f.kind === 0 ? -1 : 1, off = f.kind === 2 ? (f.hu === TW / 2 ? TH / 2 : TW / 2) : reach;
          const c = f.kind === 2 ? [mid[0] + f.n[0] * off, mid[1] + f.n[1] * off, mid[2] + f.n[2] * off] : [mid[0] + ax[0] * sign * off, mid[1] + ax[1] * sign * off, mid[2] + ax[2] * sign * off];
          face(c, f.u, f.v);
          const lu = dot(LIGHT, f.u), lv = dot(LIGHT, f.v), gloss = Math.pow(Math.max(0, dot(f.n, HALF)), 10);
          if (f.kind === 2) { // an edge: the ivory layer glued to the ebony one
            ctx.fillStyle = shade(EBONY, k * 1.1); ctx.fillRect(-f.hu, -f.hv, f.hu * 2, f.hv * 2);
            ctx.fillStyle = shade(IVORY, k * 0.96); ctx.fillRect(-f.hu, -f.hv, f.hu * 2, f.hv * 2 * 0.52);
            ctx.fillStyle = `rgba(255,255,255,${0.1 + 0.3 * gloss})`; ctx.fillRect(-f.hu, -f.hv + f.hv * 2 * 0.52, f.hu * 2, 0.02);
            continue;
          }
          const body = f.kind === 0 ? IVORY : EBONY, g = ctx.createLinearGradient(-lu * 0.9, -lv * 0.9, lu * 0.9, lv * 0.9);
          g.addColorStop(0, shade(body, k * (f.kind ? 0.8 : 0.93))); g.addColorStop(1, shade(body, k * (f.kind ? 1.35 : 1.05)));
          rr(-f.hu, -f.hv, f.hu * 2, f.hv * 2, 0.07); ctx.fillStyle = g; ctx.fill();
          ctx.lineWidth = 0.022; ctx.strokeStyle = f.kind ? "rgba(0,0,0,0.5)" : "rgba(96,74,38,0.42)"; ctx.stroke();
          if (gloss > 0.02) { const hi = ctx.createRadialGradient(lu * 0.4, lv * 0.7, 0, lu * 0.4, lv * 0.7, 1.1); hi.addColorStop(0, `rgba(255,255,255,${(f.kind ? 0.34 : 0.5) * gloss})`); hi.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = hi; ctx.fill(); }
          if (f.kind === 1) { rr(-f.hu + 0.1, -f.hv + 0.1, f.hu * 2 - 0.2, f.hv * 2 - 0.2, 0.04); ctx.lineWidth = 0.022; ctx.strokeStyle = "rgba(255,255,255,0.13)"; ctx.stroke(); continue; }
          // The numbered face: a scored line, a brass pin and drilled pips.
          const la = Math.atan2(lv, lu);
          ctx.fillStyle = "rgba(60,44,20,0.55)"; ctx.fillRect(-f.hu + 0.1, -0.014, f.hu * 2 - 0.2, 0.028);
          ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillRect(-f.hu + 0.1, 0.014, f.hu * 2 - 0.2, 0.014);
          half(tl.a, -TH / 4, la); half(tl.b, TH / 4, la);
          const pin = ctx.createRadialGradient(-0.02, -0.02, 0.005, 0, 0, 0.075); pin.addColorStop(0, "#fff1c2"); pin.addColorStop(0.6, "#c79a42"); pin.addColorStop(1, "#6f4d15");
          ctx.beginPath(); ctx.arc(0, 0, 0.07, 0, Math.PI * 2); ctx.fillStyle = pin; ctx.fill();
        }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const topple = (index: number) => {
      if (s.phase !== "standing") return;
      s.phase = "falling"; s.first = index; s.clock = 0; s.took = 0; s.still = 0;
      th[index] = 0.17; om[index] = 1.6; report();
    };
    const stand = () => {
      if (s.phase === "standing" || s.phase === "rising") return;
      s.phase = "rising"; s.clock = 0; from.set(th); om.fill(0); report();
    };
    const tick = (dt: number) => {
      s.clock += dt;
      if (s.phase === "falling") {
        for (let i = 0; i < 6; i++) step(dt / 6);
        let moving = 0; for (let i = s.first; i < N; i++) moving = Math.max(moving, Math.abs(om[i]));
        s.still = moving < 0.05 ? s.still + dt : 0;
        if (s.still > 0.2) { s.phase = "down"; if (!s.took) s.took = s.clock; s.idle = 0; report(); }
      } else if (s.phase === "rising") {
        if (!rise()) { th.fill(0); s.phase = "standing"; s.idle = 0; report(); }
      } else if (s.auto) {
        s.idle += dt;
        if (s.phase === "standing" && s.idle > 0.9) topple(0);
        if (s.phase === "down" && s.idle > 2.6) stand();
      }
    };

    let raf = 0, last = 0, seen = true;
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.034, (now - last) / 1000); last = now;
      const before = s.phase;
      tick(dt);
      if (before !== "standing" && before !== "down" || s.phase !== before) draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    // With motion reduced each action is worked out in full and only its end is drawn.
    const finish = () => { for (let i = 0; i < 4000 && (s.phase === "falling" || s.phase === "rising"); i++) tick(1 / 120); draw(); };
    api.current = {
      push: () => { s.auto = false; topple(0); if (reduce) finish(); else wake(); },
      stand: () => { s.auto = false; stand(); if (reduce) finish(); else wake(); },
    };
    if (reduce) s.auto = false;
    report(); draw(); wake();

    const onClick = (e: MouseEvent) => {
      const b = cv.getBoundingClientRect(), x = ((e.clientX - b.left) / b.width) * W, y = ((e.clientY - b.top) / b.height) * H;
      s.auto = false;
      if (s.phase === "down") { stand(); if (reduce) finish(); else wake(); return; }
      let best = -1, near = 34;
      tiles.forEach((tl, i) => { const d = Math.hypot(sx(tl.x) - x, sy(TH / 2, tl.z) - y); if (d < near) { near = d; best = i; } });
      if (best >= 0) { topple(best); if (reduce) finish(); else wake(); }
    };
    cv.addEventListener("click", onClick);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; cv.removeEventListener("click", onClick); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const line = state.phase === "standing" ? `${state.total || "All"} tiles standing`
    : state.phase === "falling" ? "Toppling"
    : state.phase === "rising" ? "Standing them back up"
    : `${state.count === state.total ? `All ${state.total}` : `${state.count} of ${state.total}`} down in ${state.seconds.toFixed(1)} seconds`;
  const pill = "h-11 rounded-full px-6 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2452c4] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none";

  return (
    <div className="flex min-h-[540px] w-full flex-col items-center justify-center bg-[#2452c4] bg-[radial-gradient(90%_70%_at_42%_36%,#3d73e6_0%,#2452c4_58%,#1b3f9e_100%)] px-4 py-10 sm:min-h-[720px]">
      <div className="relative w-full max-w-[720px]" style={{ aspectRatio: `${W} / ${H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full cursor-pointer" />
      </div>
      <p aria-live="polite" className="mt-1 min-h-[20px] text-center font-mono text-[11px] font-semibold uppercase leading-5 tracking-[0.18em] text-white">{line}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button type="button" disabled={state.phase !== "standing"} onClick={() => api.current?.push()} className={`${pill} bg-[#f6efe0] text-[#17130f] hover:bg-white`}>Push the first tile</button>
        <button type="button" disabled={state.phase !== "down"} onClick={() => api.current?.stand()} className={`${pill} border border-white/50 text-white hover:bg-white/10`}>Stand them up</button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";

// What the meter says. The first is read while it runs, the second when it finishes.
const LABEL = "Backing up your photos";
const DONE_LABEL = "Backup sealed";
const DEMO_SECONDS = 11; // length of one self-running fill
const DEMO_START = 0.36; // the first run opens part way through so the comb is never bare
const STAGE = "#10231d";
const W = 380, H = 330; // drawing size in its own units; the canvas scales to its box
const R = 10.4; // radius of one cell
const OPEN = 0.07; // share of cells the bees leave uncapped at the end

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export default function BeehiveFrameHoneyProgress() {
  const canvas = useRef<HTMLCanvasElement>(null);
  // Write your own 0 to 1 value into this ref and delete the demo clock in the frame loop.
  const progress = useRef(DEMO_START);
  const restart = useRef<(() => void) | null>(null);
  const [view, setView] = useState({ pct: Math.round(DEMO_START * 100), filled: 0, total: 0 });

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const K = Math.min(2, window.devicePixelRatio || 1) * 1.7;
    cv.width = W * K; cv.height = H * K;
    const TAU = Math.PI * 2, S3 = Math.sqrt(3);
    const IN = { x0: 44, y0: 62, x1: 336, y1: 268 }; // the opening inside the wooden bars
    let seed = 23;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const layer = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = Math.ceil(w * K); c.height = Math.ceil(h * K); const x = c.getContext("2d") as CanvasRenderingContext2D; x.scale(K, K); return { c, x }; };
    const hex = (x: CanvasRenderingContext2D, cx: number, cy: number, r: number, wobble = 0) => {
      x.beginPath();
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i * TAU) / 6, rr = r + (wobble ? (rand() - 0.5) * wobble : 0); if (i) x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); else x.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      x.closePath();
    };

    // Three little pictures stamped once per cell: the empty wax cup, the honey and the wax cap.
    const SP = R * 2 + 6, M = SP / 2;
    const empty = layer(SP, SP);
    {
      const x = empty.x;
      const wall = x.createLinearGradient(M - R, M - R, M + R, M + R);
      wall.addColorStop(0, "#f6cf74"); wall.addColorStop(0.45, "#d79a33"); wall.addColorStop(1, "#8f5713");
      hex(x, M, M, R + 0.9); x.fillStyle = wall; x.fill();
      const cup = x.createLinearGradient(M - R, M - R, M + R * 0.9, M + R * 0.9);
      cup.addColorStop(0, "#1a0c02"); cup.addColorStop(0.42, "#3a1f07"); cup.addColorStop(0.8, "#8a5213"); cup.addColorStop(1, "#c98a2b");
      hex(x, M, M, R - 1.5); x.fillStyle = cup; x.fill();
      const deep = x.createRadialGradient(M - 1.2, M - 1.2, 0.5, M - 0.6, M - 0.6, R * 0.78);
      deep.addColorStop(0, "rgba(10,5,1,0.96)"); deep.addColorStop(0.6, "rgba(18,9,2,0.82)"); deep.addColorStop(1, "rgba(18,9,2,0)");
      hex(x, M, M, R - 1.5); x.fillStyle = deep; x.fill();
      x.lineWidth = 0.5; x.strokeStyle = "rgba(255,236,170,0.75)"; hex(x, M - 0.25, M - 0.25, R - 0.2); x.stroke();
    }
    const honeys = Array.from({ length: 4 }, (_, v) => {
      const honey = layer(SP, SP), x = honey.x;
      const body = x.createRadialGradient(M + 2.6 - v * 0.5, M + 3 - (v % 2), 0.6, M, M, R);
      body.addColorStop(0, "#ffd65c"); body.addColorStop(0.34, "#f7a71b"); body.addColorStop(0.72, "#c96a08"); body.addColorStop(1, "#6d3004");
      hex(x, M, M, R - 1.3); x.fillStyle = body; x.fill();
      x.save(); hex(x, M, M, R - 1.3); x.clip();
      const shade = x.createLinearGradient(M - R, M - R, M + R * 0.2, M + R * 0.2);
      shade.addColorStop(0, "rgba(70,26,2,0.7)"); shade.addColorStop(1, "rgba(70,26,2,0)");
      x.fillStyle = shade; x.fillRect(0, 0, SP, SP);
      x.translate(M - 2.9 + (v % 2) * 0.7, M - 3.4 - (v >> 1) * 0.6); x.rotate(-0.62 - v * 0.09);
      x.beginPath(); x.ellipse(0, 0, 3.5 - v * 0.35, 1.25 - (v % 2) * 0.25, 0, 0, TAU); x.fillStyle = "rgba(255,255,255,0.95)"; x.fill();
      x.beginPath(); x.ellipse(5.2, 0.9, 0.9, 0.6, 0, 0, TAU); x.fillStyle = "rgba(255,255,255,0.8)"; x.fill();
      x.restore();
      x.lineWidth = 0.9; x.strokeStyle = "rgba(255,226,140,0.5)"; x.beginPath(); x.arc(M, M, R - 3.4, 0.35 + v * 0.1, 1.3); x.stroke();
      return honey.c;
    });
    const caps = Array.from({ length: 4 }, () => {
      const l = layer(SP, SP), x = l.x;
      const dome = x.createRadialGradient(M - 2.4, M - 2.8, 0.4, M, M, R + 1);
      dome.addColorStop(0, "#fff4cf"); dome.addColorStop(0.42, "#f1d488"); dome.addColorStop(0.82, "#d2a04a"); dome.addColorStop(1, "#9c6a1f");
      hex(x, M, M, R + 0.2, 1.5); x.fillStyle = dome; x.fill();
      x.save(); x.clip();
      for (let i = 0; i < 9; i++) { const a = rand() * TAU, d = rand() * R * 0.8, rr = 0.5 + rand() * 1.5; x.beginPath(); x.arc(M + Math.cos(a) * d, M + Math.sin(a) * d, rr, 0, TAU); x.fillStyle = rand() > 0.5 ? "rgba(255,250,224,0.5)" : "rgba(150,98,26,0.24)"; x.fill(); }
      x.restore();
      return l.c;
    });

    // Lay the cells out, then number them so honey spreads down from the top bar in an arc, as it does in a hive.
    const cells: { x: number; y: number; k: number; kv: number; c: number; cap: HTMLCanvasElement; honey: HTMLCanvasElement; open: boolean; order: number }[] = [];
    for (let row = -1, y = IN.y0 + 2; y < IN.y1 + R; row++, y = IN.y0 + 2 + (row + 1) * 1.5 * R) {
      for (let x = IN.x0 + ((row & 1) ? S3 * R / 2 : 0); x < IN.x1 + R; x += S3 * R) {
        cells.push({ x, y, k: 0, kv: 0, c: 0, cap: caps[(rand() * 4) | 0], honey: honeys[(rand() * 4) | 0], open: rand() < OPEN, order: Math.hypot((x - 190) * 0.62, y - IN.y0 + 70) + rand() * 34 });
      }
    }
    const visible = cells.filter((c) => c.x > IN.x0 - 2 && c.x < IN.x1 + 2 && c.y > IN.y0 - 2 && c.y < IN.y1 + 2);
    [...cells].sort((a, b) => a.order - b.order).forEach((c, i) => { c.order = i; });
    const N = cells.length;

    // The wooden frame, drawn once: top bar with lugs, two side bars, a thin bottom bar and the pegs it hangs on.
    const frameArt = layer(W, H);
    {
      const x = frameArt.x;
      const bar = (bx: number, by: number, bw: number, bh: number, along: boolean) => {
        const g = along ? x.createLinearGradient(0, by, 0, by + bh) : x.createLinearGradient(bx, 0, bx + bw, 0);
        g.addColorStop(0, "#f0d3a0"); g.addColorStop(0.16, "#dfba80"); g.addColorStop(0.7, "#c79a5e"); g.addColorStop(1, "#946a38");
        x.save(); x.beginPath(); x.roundRect(bx, by, bw, bh, 1.4); x.fillStyle = g; x.fill(); x.clip();
        for (let i = 0; i < (along ? bh : bw) * 1.6; i++) {
          const o = rand() * (along ? bh : bw), wave = (rand() - 0.5) * 1.6, len = along ? bw : bh;
          x.beginPath();
          if (along) { x.moveTo(bx, by + o); x.bezierCurveTo(bx + len * 0.3, by + o + wave, bx + len * 0.7, by + o - wave, bx + len, by + o + wave * 0.4); }
          else { x.moveTo(bx + o, by); x.bezierCurveTo(bx + o + wave, by + len * 0.3, bx + o - wave, by + len * 0.7, bx + o + wave * 0.4, by + len); }
          x.lineWidth = 0.25 + rand() * 0.5; x.strokeStyle = rand() > 0.4 ? `rgba(120,78,34,${0.1 + rand() * 0.2})` : `rgba(255,240,206,${0.1 + rand() * 0.2})`; x.stroke();
        }
        x.restore();
        x.fillStyle = "rgba(255,246,222,0.7)"; if (along) x.fillRect(bx + 1, by + 0.3, bw - 2, 0.7); else x.fillRect(bx + 0.3, by + 1, 0.7, bh - 2);
        x.fillStyle = "rgba(70,42,14,0.5)"; if (along) x.fillRect(bx + 1, by + bh - 0.8, bw - 2, 0.8); else x.fillRect(bx + bw - 0.8, by + 1, 0.8, bh - 2);
      };
      const peg = (px: number, py: number) => {
        const g = x.createRadialGradient(px - 1.6, py - 1.8, 0.4, px, py, 5.4);
        g.addColorStop(0, "#fff3c4"); g.addColorStop(0.4, "#d8ad52"); g.addColorStop(0.85, "#7c5516"); g.addColorStop(1, "#4a310a");
        x.beginPath(); x.arc(px, py, 5.2, 0, TAU); x.fillStyle = g; x.fill();
        x.lineWidth = 0.6; x.strokeStyle = "rgba(255,240,190,0.6)"; x.beginPath(); x.arc(px, py, 3.1, 0, TAU); x.stroke();
      };
      peg(21, 65); peg(359, 65);
      bar(32, 58, 13, 214, false); bar(335, 58, 13, 214, false);
      bar(32, 266, 316, 9, true);
      bar(12, 42, 356, 19, true);
      // End grain on the lugs, the saw kerf under them and the nail heads.
      for (const ex of [12, 364]) { x.fillStyle = "rgba(110,72,30,0.45)"; x.fillRect(ex, 43, 4, 17); }
      for (const [nx, ny] of [[38.5, 51], [341.5, 51], [38.5, 270.5], [341.5, 270.5]]) {
        x.beginPath(); x.arc(nx + 0.4, ny + 0.5, 1.9, 0, TAU); x.fillStyle = "rgba(60,36,10,0.55)"; x.fill();
        const g = x.createRadialGradient(nx - 0.5, ny - 0.6, 0.1, nx, ny, 1.7);
        g.addColorStop(0, "#f4f6f8"); g.addColorStop(0.6, "#8d949c"); g.addColorStop(1, "#3c4046");
        x.beginPath(); x.arc(nx, ny, 1.6, 0, TAU); x.fillStyle = g; x.fill();
      }
      x.font = "600 5.2px ui-monospace, SFMono-Regular, Menlo, monospace"; x.textAlign = "center"; x.fillStyle = "rgba(92,58,22,0.7)";
      x.fillText("N O.  0 7   ·   S U P E R", 190, 54);
    }

    const s = { lx: 120, ly: 110, tx: 120, ty: 110, drip: 0, fall: 0, fv: 0 };
    const draw = (p: number) => {
      ctx.setTransform(K, 0, 0, K, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Shadow of the frame on the wall behind it.
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.62)"; ctx.shadowBlur = 22 * K; ctx.shadowOffsetX = 7 * K; ctx.shadowOffsetY = 14 * K;
      ctx.fillStyle = "#000"; ctx.fillRect(34, 46, 312, 226); ctx.restore();

      ctx.save(); ctx.beginPath(); ctx.rect(IN.x0, IN.y0 - 2, IN.x1 - IN.x0, IN.y1 - IN.y0 + 2); ctx.clip();
      ctx.fillStyle = "#8f5713"; ctx.fillRect(IN.x0, IN.y0 - 2, IN.x1 - IN.x0, IN.y1 - IN.y0 + 2);
      for (const c of cells) {
        ctx.drawImage(empty.c, c.x - M, c.y - M, SP, SP);
        if (c.k > 0.01 && c.c < 0.995) {
          const z = (0.5 + 0.5 * Math.min(1, c.k)) * SP;
          ctx.globalAlpha = clamp(c.k * 2.2); ctx.drawImage(c.honey, c.x - z / 2, c.y - z / 2, z, z);
          // A fresh cell is brighter for a moment, like a drop still settling.
          const fresh = clamp(1 - Math.abs(c.k - 0.75) * 3) * (1 - c.c);
          if (fresh > 0.02) { ctx.globalAlpha = fresh * 0.5; ctx.globalCompositeOperation = "lighter"; ctx.drawImage(c.honey, c.x - z / 2, c.y - z / 2, z, z); ctx.globalCompositeOperation = "source-over"; }
          ctx.globalAlpha = 1;
        }
        if (c.c > 0.01) { const z = (0.72 + 0.28 * c.c) * SP; ctx.globalAlpha = clamp(c.c * 1.6); ctx.drawImage(c.cap, c.x - z / 2, c.y - z / 2, z, z); ctx.globalAlpha = 1; }
      }
      // A lamp glancing off the comb. It follows the pointer and drifts when left alone.
      ctx.globalCompositeOperation = "lighter";
      const sheen = ctx.createRadialGradient(s.lx, s.ly, 4, s.lx, s.ly, 150);
      sheen.addColorStop(0, "rgba(255,214,130,0.3)"); sheen.addColorStop(0.4, "rgba(255,190,90,0.1)"); sheen.addColorStop(1, "rgba(255,190,90,0)");
      ctx.fillStyle = sheen; ctx.fillRect(IN.x0, IN.y0, IN.x1 - IN.x0, IN.y1 - IN.y0);
      ctx.globalCompositeOperation = "source-over";
      const far = ctx.createRadialGradient(s.lx, s.ly, 120, s.lx, s.ly, 330);
      far.addColorStop(0, "rgba(20,8,0,0)"); far.addColorStop(1, "rgba(20,8,0,0.5)");
      ctx.fillStyle = far; ctx.fillRect(IN.x0, IN.y0, IN.x1 - IN.x0, IN.y1 - IN.y0);
      // The bars stand proud of the comb and shade its top and left edges.
      const top = ctx.createLinearGradient(0, IN.y0 - 2, 0, IN.y0 + 15); top.addColorStop(0, "rgba(30,12,0,0.78)"); top.addColorStop(1, "rgba(30,12,0,0)");
      ctx.fillStyle = top; ctx.fillRect(IN.x0, IN.y0 - 2, IN.x1 - IN.x0, 18);
      const left = ctx.createLinearGradient(IN.x0, 0, IN.x0 + 10, 0); left.addColorStop(0, "rgba(30,12,0,0.6)"); left.addColorStop(1, "rgba(30,12,0,0)");
      ctx.fillStyle = left; ctx.fillRect(IN.x0, IN.y0, 10, IN.y1 - IN.y0);
      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(frameArt.c, 0, 0); ctx.setTransform(K, 0, 0, K, 0, 0);

      // Honey that has run down to the bottom bar: a bead that swells, then lets go.
      if (s.drip > 0.02 || s.fall > 0) {
        const dx = 232, dy = 274.5, len = 3 + s.drip * 13, bulb = 2.2 + s.drip * 2.3;
        const g = ctx.createLinearGradient(dx - bulb, 0, dx + bulb, 0);
        g.addColorStop(0, "#8a4505"); g.addColorStop(0.35, "#f5a81c"); g.addColorStop(0.6, "#ffd465"); g.addColorStop(1, "#a85607");
        const bead = (by: number, r: number, neck: number) => {
          ctx.beginPath(); ctx.moveTo(dx - neck, by - r * 2.6); ctx.bezierCurveTo(dx - neck, by - r, dx - r, by - r * 0.9, dx - r, by);
          ctx.arc(dx, by, r, Math.PI, 0, true); ctx.bezierCurveTo(dx + r, by - r * 0.9, dx + neck, by - r, dx + neck, by - r * 2.6); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
          ctx.beginPath(); ctx.ellipse(dx - r * 0.34, by - r * 0.2, r * 0.2, r * 0.42, 0.3, 0, TAU); ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fill();
        };
        ctx.beginPath(); ctx.ellipse(dx, dy - 3, 9, 1.8, 0, 0, TAU); ctx.fillStyle = "#e39413"; ctx.fill();
        ctx.beginPath(); ctx.ellipse(dx - 2, dy - 3.5, 5, 0.6, 0, 0, TAU); ctx.fillStyle = "rgba(255,240,190,0.8)"; ctx.fill();
        ctx.fillStyle = g; ctx.fillRect(dx - 1.1, dy - 2, 2.2, len - bulb + 2);
        bead(dy + len, bulb, 1.1);
        if (s.fall > 0) bead(dy + 16 + s.fall, 3.6, 0.5);
      }
      void p;
    };

    let raf = 0, last = 0, seen = true, clock = DEMO_START * DEMO_SECONDS, touched = -1e9, idle = 0, shownPct = -1, shownFilled = -1;
    const HOLD = 3.4;
    const report = (p: number, filled: number) => { const n = Math.round(p * 100); if (n !== shownPct || filled !== shownFilled) { shownPct = n; shownFilled = filled; setView({ pct: n, filled, total: visible.length }); } };
    const targets = (p: number) => {
      const fill = p * N, capped = N * clamp((p - 0.34) / 0.66) ** 1.7;
      let filled = 0;
      for (const c of visible) if (c.order < fill) filled++;
      return { fill, capped, filled };
    };
    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.033, (now - last) / 1000); last = now;

      // Demo clock. Delete this block when `progress.current` is fed from real work.
      clock += dt;
      if (clock < DEMO_SECONDS) { const t = clock / DEMO_SECONDS; progress.current = Math.min(1, t + 0.025 * Math.sin(t * Math.PI * 6) * (1 - t)); }
      else if (clock < DEMO_SECONDS + HOLD) progress.current = 1;
      else { clock = 0; progress.current = 0; }

      const p = clamp(progress.current), t = targets(p);
      for (const c of cells) {
        const full = c.order < t.fill ? 1 : 0, cap = c.order < t.capped && !c.open ? 1 : 0;
        if (full) { c.kv += (90 * (1 - c.k) - 11 * c.kv) * dt; c.k += c.kv * dt; } else { c.kv = 0; c.k = Math.max(0, c.k - dt * 4); }
        c.c += ((cap && c.k > 0.9 ? 1 : 0) - c.c) * Math.min(1, dt * (cap ? 3.2 : 6));
      }
      idle += dt;
      if (now - touched > 3500) { s.tx = 190 + 120 * Math.sin(idle / 2.9); s.ty = 150 + 60 * Math.sin(idle / 2.1 + 1); }
      s.lx += (s.tx - s.lx) * Math.min(1, dt * 5); s.ly += (s.ty - s.ly) * Math.min(1, dt * 5);
      // The bead grows while honey is coming in, drops once it is heavy, and stops after the comb is sealed.
      if (s.fall > 0) { s.fv += 520 * dt; s.fall += s.fv * dt; if (s.fall > 90) { s.fall = 0; s.fv = 0; } }
      if (p > 0.2 && p < 1) { s.drip += dt * 0.36; if (s.drip >= 1) { s.drip = 0.12; s.fall = 0.01; } } else s.drip = Math.max(0, s.drip - dt * 0.5);
      report(p, t.filled);
      draw(p);
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(frame); } };
    const still = () => { progress.current = 1; for (const c of cells) { c.k = 1; c.c = c.open ? 0 : 1; } report(1, visible.length); draw(1); };
    // Start the comb already holding what the opening percentage implies.
    { const t = targets(DEMO_START); for (const c of cells) { c.k = c.order < t.fill - 6 ? 1 : 0; c.c = c.order < t.capped - 4 && !c.open ? 1 : 0; } }
    restart.current = () => { clock = 0; progress.current = 0; if (reduce) still(); else wake(); };
    if (reduce) still(); else wake();

    const onMove = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); touched = performance.now(); s.tx = ((e.clientX - b.left) / b.width) * W; s.ty = ((e.clientY - b.top) / b.height) * H; };
    cv.addEventListener("pointermove", onMove); cv.addEventListener("pointerdown", onMove);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); restart.current = null;
      cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerdown", onMove);
      io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const done = view.pct >= 100;
  return (
    <div
      className="flex min-h-[560px] w-full flex-col items-center justify-center overflow-hidden bg-[radial-gradient(80%_70%_at_50%_40%,#1d3b31_0%,#10231d_55%,#0a1612_100%)] px-4 py-10 sm:min-h-[780px]"
      style={{ backgroundColor: STAGE }}
    >
      <div
        role="progressbar"
        aria-label={LABEL}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={view.pct}
        aria-valuetext={done ? DONE_LABEL : `${view.pct} percent, ${view.filled} of ${view.total} cells filled`}
        className="w-full max-w-[660px]"
      >
        <canvas ref={canvas} aria-hidden="true" className="block h-auto w-full" style={{ aspectRatio: `${W} / ${H}` }} />
      </div>
      <div className="flex flex-col items-center gap-3">
        <p aria-hidden="true" className="font-mono text-[34px] font-medium tabular-nums leading-none tracking-tight text-amber-100">
          {view.pct}
          <span className="ml-1 text-[15px] text-amber-200">%</span>
        </p>
        <p role="status" className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-100">
          {done ? DONE_LABEL : LABEL}
        </p>
        <button
          type="button"
          onClick={() => restart.current?.()}
          className="flex h-10 items-center rounded-full border border-amber-200/50 px-5 font-mono text-[11px] uppercase tracking-[0.18em] text-amber-50 outline-none transition-colors hover:bg-amber-100/10 focus-visible:ring-2 focus-visible:ring-amber-200 motion-reduce:transition-none"
        >
          Fill again
        </button>
      </div>
    </div>
  );
}

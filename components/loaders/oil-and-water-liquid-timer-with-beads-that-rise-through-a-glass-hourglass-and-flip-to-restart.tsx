import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here.
const TITLE = "Steeping";
const DURATION = 24; // seconds for all of the oil to rise
const AUTO = true; // turn itself over when it runs out
const OIL = "#ff5a2c";
const WATER = "#7fd6e6";
const BRASS = ["#2c1e08", "#8b6a2a", "#ffe6a0", "#a98334", "#231803"]; // shadow, body, glint, body, shadow

const W = 480, H = 540, CX = 240, CY = 268, HB = 168, R = 88, NECK = 8.5, HOP = 46;
const rgb = (hex: string) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const mix = (a: string, b: string, t: number, al = 1) => {
  const p = rgb(a), q = rgb(b);
  return `rgba(${p.map((v, i) => Math.round(v + (q[i] - v) * t)).join(",")},${al})`;
};
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const clock = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
// Half the width of the glass at a distance t (0 at the neck, 1 at the end of a bulb).
const prof = (t: number) => {
  if (t < 0.6) { const q = t / 0.6; return NECK + (R - NECK) * (0.72 * q * q * (3 - 2 * q) + 0.28 * Math.sin((q * Math.PI) / 2)); }
  return R * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.6) / 0.4, 2.5)));
};
type Bead = { x: number; y: number; r: number; v: number; ph: number; sw: number };

export default function OilAndWaterLiquidTimer() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [left, setLeft] = useState(Math.ceil(DURATION * 0.56));
  const api = useRef<{ flip: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let k = 1;
    const fit = () => {
      const b = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.max(2, Math.round(b.width * dpr)); cv.height = Math.round((cv.width * H) / W); k = cv.width / W;
    };

    // Each bulb as a closed outline, in its own coordinates (the neck is the origin).
    const M = 30, local = [1, -1].map((sg) => {
      const p = new Float32Array((M + 1) * 4);
      for (let i = 0; i <= M; i++) {
        const t = (i / M) * 0.992, r = prof(t);
        p[i * 2] = -r; p[i * 2 + 1] = sg * t * HB; p[(2 * M + 1 - i) * 2] = r; p[(2 * M + 1 - i) * 2 + 1] = sg * t * HB;
      }
      return p;
    });
    const world = [new Float32Array(local[0].length), new Float32Array(local[0].length)];
    const buf = new Float32Array(local[0].length * 2 + 8);
    // Area of an outline above a horizontal line: this is what keeps the oil level while the glass turns.
    const above = (P: Float32Array, L: number) => {
      const n = P.length / 2; let m = 0;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, ax = P[i * 2], ay = P[i * 2 + 1], bx = P[j * 2], by = P[j * 2 + 1], ia = ay <= L, ib = by <= L;
        if (ia) { buf[m++] = ax; buf[m++] = ay; }
        if (ia !== ib) { buf[m++] = ax + ((bx - ax) * (L - ay)) / (by - ay); buf[m++] = L; }
      }
      let a = 0;
      for (let i = 0; i < m; i += 2) { const j = (i + 2) % m; a += buf[i] * buf[j + 1] - buf[j] * buf[i + 1]; }
      return Math.abs(a) / 2;
    };
    const AREA = above(local[0], 1e4), TOTAL = AREA * 0.36;
    const levelOf = (P: Float32Array, area: number) => {
      let lo = 1e9, hi = -1e9;
      for (let i = 1; i < P.length; i += 2) { lo = Math.min(lo, P[i]); hi = Math.max(hi, P[i]); }
      for (let i = 0; i < 15; i++) { const mid = (lo + hi) / 2; if (above(P, mid) < area) lo = mid; else hi = mid; }
      return (lo + hi) / 2;
    };

    // vol[0] is the oil in the bulb that hangs below the neck, vol[1] the oil above it.
    const s = {
      t: 0, vol: [TOTAL * 0.74, TOTAL * 0.26], shown: [TOTAL * 0.74, TOTAL * 0.26], th: 0, thv: 0, flipping: false, owed: 0, nextR: 10,
      wob: [0, 0], wobV: [0, 0], beads: [] as Bead[], rest: 0, light: 0, lightTo: 0, lv: [0, 0],
    };
    let seed = 3;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    const place = () => {
      const c = Math.cos(s.th), sn = Math.sin(s.th), cy = CY - HOP * Math.sin(clamp(s.th / Math.PI) * Math.PI);
      for (let b = 0; b < 2; b++) {
        const P = local[b], Q = world[b];
        for (let i = 0; i < P.length; i += 2) { Q[i] = CX + P[i] * c - P[i + 1] * sn; Q[i + 1] = cy + P[i] * sn + P[i + 1] * c; }
        s.lv[b] = levelOf(Q, Math.max(0.5, s.shown[b]));
      }
      return cy;
    };

    const metal = (x0: number, x1: number, h: number) => {
      const g = ctx.createLinearGradient(x0, 0, x1, 0), p = 0.5 + h;
      g.addColorStop(0, BRASS[0]); g.addColorStop(Math.max(0.03, p - 0.24), BRASS[1]); g.addColorStop(p, BRASS[2]); g.addColorStop(Math.min(0.97, p + 0.2), BRASS[3]); g.addColorStop(1, BRASS[4]);
      return g;
    };
    const outline = (P: Float32Array) => { ctx.beginPath(); ctx.moveTo(P[0], P[1]); for (let i = 2; i < P.length; i += 2) ctx.lineTo(P[i], P[i + 1]); ctx.closePath(); };

    const draw = () => {
      ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, W, H);
      const cy = place(), c = Math.cos(s.th), up = c >= 0 ? 1 : -1, face = Math.abs(c), lift = (CY - cy) / HOP, hl = -0.2 * c + s.light * 0.06;
      const floor = CY + HB + 17;
      let g: CanvasGradient;

      // The table: the glow the oil throws on it, and the shade of the timer.
      ctx.save(); ctx.translate(CX, floor + 4); ctx.scale(1, 0.2);
      g = ctx.createRadialGradient(0, 0, 20, 0, 0, 250);
      g.addColorStop(0, mix(OIL, "#000000", 0.1, 0.34)); g.addColorStop(0.5, mix(OIL, "#000000", 0.3, 0.1)); g.addColorStop(1, mix(OIL, "#000000", 0.3, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 250, 0, Math.PI * 2); ctx.fill();
      g = ctx.createRadialGradient(0, 0, 60, 0, 0, 132 + 40 * lift);
      g.addColorStop(0, `rgba(0,0,0,${0.85 - 0.4 * lift})`); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 180, 0, Math.PI * 2); ctx.fill(); ctx.restore();

      const frame = () => { ctx.setTransform(k, 0, 0, k, 0, 0); ctx.translate(CX, cy); ctx.rotate(s.th); };
      // Two brass rods behind the glass.
      frame();
      for (const x of [-99, 99]) { ctx.fillStyle = metal(x - 3, x + 3, hl); ctx.fillRect(x - 3, -HB + 4, 6, HB * 2 - 8); }

      // The glass and the water in it.
      ctx.setTransform(k, 0, 0, k, 0, 0);
      for (let b = 0; b < 2; b++) {
        const Q = world[b], L = s.lv[b] + 0.5;
        ctx.save(); outline(Q); ctx.clip();
        g = ctx.createLinearGradient(CX - R - 20, 0, CX + R + 20, 0);
        g.addColorStop(0, mix(WATER, "#ffffff", 0.3, 0.4)); g.addColorStop(0.2, mix(WATER, "#000000", 0.1, 0.16)); g.addColorStop(0.55, mix(WATER, "#000000", 0.2, 0.1)); g.addColorStop(0.85, mix(WATER, "#000000", 0.1, 0.2)); g.addColorStop(1, mix(WATER, "#ffffff", 0.2, 0.4));
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        // The oil floats, so it fills each bulb from the top down to one level line however the glass is turned.
        if (s.shown[b] > 1) {
          ctx.beginPath(); ctx.moveTo(CX - 240, -40); ctx.lineTo(CX + 240, -40);
          for (let x = CX + 240; x >= CX - 240; x -= 8) ctx.lineTo(x, L + s.wob[b] * Math.sin(x * 0.06 + s.t * 5.2) + s.wob[b] * 0.5 * Math.sin(x * 0.11 - s.t * 7));
          ctx.closePath();
          g = ctx.createLinearGradient(0, L - 130, 0, L);
          g.addColorStop(0, mix(OIL, "#ffe08a", 0.34)); g.addColorStop(0.55, OIL); g.addColorStop(0.92, mix(OIL, "#5a0010", 0.3)); g.addColorStop(1, mix(OIL, "#ffd0a0", 0.4));
          ctx.fillStyle = g; ctx.fill();
          g = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
          g.addColorStop(0, "rgba(60,0,10,0.5)"); g.addColorStop(0.14, "rgba(60,0,10,0.05)"); g.addColorStop(0.3, "rgba(255,236,190,0.28)"); g.addColorStop(0.46, "rgba(255,236,190,0)"); g.addColorStop(0.82, "rgba(60,0,10,0.12)"); g.addColorStop(1, "rgba(60,0,10,0.55)");
          ctx.fillStyle = g; ctx.fill();
          // Light gathered under the oil spills into the water just below it.
          g = ctx.createLinearGradient(0, L, 0, L + 46);
          g.addColorStop(0, mix(OIL, "#ffffff", 0.2, 0.3)); g.addColorStop(1, mix(OIL, "#ffffff", 0.2, 0));
          ctx.fillStyle = g; ctx.fillRect(CX - 240, L + 1, 480, 46);
        }
        ctx.restore();
      }

      // Beads on their way up. They squeeze long to pass the neck and round out as the bulb widens.
      frame();
      ctx.save(); ctx.beginPath(); ctx.rect(-R - 12, -HB, R * 2 + 24, HB + 1.5); ctx.clip(); // a bead only shows once it is clear of the oil below the neck
      for (const q of s.beads) {
        const room = Math.max(3.2, prof(Math.abs(q.y) / HB) - 2.4), rx = Math.min(q.r * (1 + 0.1 * Math.sin(s.t * 9 + q.ph)), room), ry = Math.min(30, (q.r * q.r) / rx);
        const x = q.x, y = q.y;
        ctx.beginPath(); ctx.ellipse(x, y, rx + 5, ry + 5, 0, 0, Math.PI * 2); ctx.fillStyle = mix(OIL, "#ffffff", 0.1, 0.1); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        g = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.4, 0, x, y, Math.max(rx, ry) * 1.05);
        g.addColorStop(0, mix(OIL, "#ffe9a8", 0.55)); g.addColorStop(0.5, OIL); g.addColorStop(1, mix(OIL, "#4a0010", 0.5));
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.ellipse(x, y, rx * 0.74, ry * 0.74, 0, 0.1 * Math.PI, 0.56 * Math.PI); ctx.lineWidth = Math.max(1, rx * 0.2); ctx.lineCap = "round"; ctx.strokeStyle = "rgba(255,226,170,0.62)"; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x - rx * 0.36, y - ry * 0.42, rx * 0.2, ry * 0.14, -0.5, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.fill();
      }
      ctx.restore();

      // The glass itself: lit edges, the room mirrored on the side facing the lamp, and nothing that turns with it.
      ctx.setTransform(k, 0, 0, k, 0, 0); ctx.lineJoin = "round";
      for (let b = 0; b < 2; b++) {
        outline(world[b]); ctx.lineWidth = 3.4; ctx.strokeStyle = "rgba(190,236,246,0.13)"; ctx.stroke(); ctx.lineWidth = 1.1; ctx.strokeStyle = "rgba(226,246,252,0.6)"; ctx.stroke();
      }
      frame();
      const strip = (sg: number, sd: number, t0: number, t1: number, in0: number, in1: number, al: number) => {
        ctx.beginPath();
        for (let i = 0; i <= 14; i++) { const t = t0 + ((t1 - t0) * i) / 14, w = Math.sin((i / 14) * Math.PI); ctx.lineTo(sd * Math.max(0, prof(t) - in0 - (1 - w) * (in1 - in0) * 0.5), sg * t * HB); }
        for (let i = 14; i >= 0; i--) { const t = t0 + ((t1 - t0) * i) / 14, w = Math.sin((i / 14) * Math.PI); ctx.lineTo(sd * Math.max(0, prof(t) - in1 + (1 - w) * (in1 - in0) * 0.5), sg * t * HB); }
        ctx.closePath(); ctx.fillStyle = `rgba(255,255,255,${al * face})`; ctx.fill();
      };
      const lit = -up; // which side of the turning glass faces the lamp
      for (const sg of [1, -1]) {
        strip(sg, lit, 0.2, 0.93, 7 - s.light * 2, 15 - s.light * 2, 0.5); strip(sg, lit, 0.3, 0.86, 19, 21.4, 0.3);
        strip(sg, -lit, 0.24, 0.9, 4.5, 7, 0.34); strip(sg, -lit, 0.42, 0.8, 24, 44, 0.05);
      }

      // Brass ends, with a collar where each bulb is seated.
      for (const sg of [1, -1]) {
        const y0 = sg * (HB - 10);
        ctx.fillStyle = metal(-46, 46, hl); ctx.fillRect(-46, Math.min(y0, y0 + sg * 8), 92, 8);
        ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(-46, sg > 0 ? y0 : y0 - 2, 92, 2);
        const a = sg * (HB - 2), b = sg * (HB + 17), y = Math.min(a, b);
        ctx.beginPath(); ctx.moveTo(-108, y + 3); ctx.arcTo(-108, y, -104, y, 3); ctx.lineTo(104, y); ctx.arcTo(108, y, 108, y + 3, 3); ctx.lineTo(108, y + 16); ctx.arcTo(108, y + 19, 104, y + 19, 3); ctx.lineTo(-104, y + 19); ctx.arcTo(-108, y + 19, -108, y + 16, 3); ctx.closePath();
        ctx.fillStyle = metal(-108, 108, hl); ctx.fill();
        g = ctx.createLinearGradient(0, y, 0, y + 19);
        const hi = `rgba(255,244,200,${0.75 * face})`, lo = "rgba(20,10,0,0.5)", first = up > 0 ? hi : lo; // the edge that faces the ceiling is the lit one
        g.addColorStop(0, first); g.addColorStop(0.16, "rgba(255,244,200,0)"); g.addColorStop(0.8, "rgba(20,10,0,0)"); g.addColorStop(1, first === hi ? lo : hi);
        ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.stroke();
        // A turned groove round the edge of the plate.
        ctx.fillStyle = "rgba(20,10,0,0.42)"; ctx.fillRect(-107, y + 9, 214, 1); ctx.fillStyle = `rgba(255,240,190,${0.4 * face + 0.1})`; ctx.fillRect(-107, y + (up > 0 ? 10 : 8), 214, 1);
      }
    };

    let shownLeft = -1;
    const say = () => { const v = Math.max(0, Math.ceil((s.vol[0] / TOTAL) * DURATION - 0.02)); if (v !== shownLeft) { shownLeft = v; setLeft(v); } };

    const tick = (dt: number) => {
      s.t += dt;
      if (s.flipping) {
        s.thv += (40 * (Math.PI - s.th) - 9.6 * s.thv) * dt; s.th += s.thv * dt;
        if (Math.abs(Math.PI - s.th) < 0.004 && Math.abs(s.thv) < 0.03) {
          // Upside down is the same object again: swap which bulb is which and carry on.
          s.th = 0; s.thv = 0; s.flipping = false; s.vol.reverse(); s.shown.reverse(); s.wob = [1.6, 1.6]; s.owed = 0; s.rest = 0;
        }
      } else {
        const lvUp = s.lv[1] - CY; // where the floating oil in the upper bulb ends, in the timer's own coordinates
        if (s.vol[0] > 0.5) {
          s.owed += (TOTAL / DURATION) * dt;
          const need = Math.min(s.vol[0], Math.PI * s.nextR * s.nextR);
          if (s.owed >= need) {
            s.owed -= need; s.vol[0] -= need; if (s.vol[0] < 2) s.vol[0] = 0;
            const r = Math.sqrt(need / Math.PI);
            s.beads.push({ x: 0, y: 10, r, v: 12, ph: rand() * 6.3, sw: (rand() - 0.5) * 1.5 }); s.nextR = 5 + rand() * rand() * 11; s.wobV[0] += 14;
          }
        } else if (!s.beads.length && AUTO) { s.rest += dt; if (s.rest > 2.6) { s.rest = 0; s.flipping = true; } }
        s.beads = s.beads.filter((q) => {
          const vt = 30 + q.r * 5; q.v += (vt - q.v) * Math.min(1, dt * 2.4); q.y -= q.v * dt;
          const room = Math.max(0, prof(Math.abs(q.y) / HB) - q.r - 5), want = q.y < 0 ? clamp(q.sw * room * Math.sin(q.ph + q.y * 0.034), -room, room) : 0;
          q.x += (want - q.x) * Math.min(1, dt * 5);
          const ry = (q.r * q.r) / Math.min(q.r, Math.max(3.2, prof(Math.abs(q.y) / HB) - 2.4));
          if (q.y - ry * 0.7 < lvUp || q.y < -HB * 0.97) { s.vol[1] += Math.PI * q.r * q.r; s.wobV[1] += 9 + q.r; return false; }
          return true;
        });
      }
      for (let b = 0; b < 2; b++) {
        s.shown[b] += (s.vol[b] - s.shown[b]) * Math.min(1, dt * 7);
        s.wobV[b] += (-70 * s.wob[b] - 5 * s.wobV[b]) * dt; s.wob[b] = clamp(s.wob[b] + s.wobV[b] * dt, -3.2, 3.2);
      }
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 5);
    };
    const flip = () => {
      if (s.flipping) return;
      for (const q of s.beads) s.vol[1] += Math.PI * q.r * q.r;
      s.beads = [];
      if (reduce) { s.vol.reverse(); s.shown = [s.vol[0], s.vol[1]]; say(); draw(); return; }
      s.flipping = true; wake();
    };

    // Start in the middle of a run, with beads already in the water.
    place();
    if (!reduce) for (let i = 0; i < 150; i++) { tick(1 / 30); place(); }
    else s.shown = [s.vol[0], s.vol[1]];

    let raf = 0, last = 0, seen = true;
    const loop = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      tick(dt); say(); draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const wake = () => { if (reduce) { say(); draw(); } else if (!raf) { last = 0; raf = requestAnimationFrame(loop); } };
    api.current = { flip };
    fit(); wake();
    // With reduced motion the timer still keeps time: the levels step once a second and nothing else moves.
    const slow = reduce ? window.setInterval(() => {
      const d = Math.min(s.vol[0], TOTAL / DURATION); s.vol[0] -= d; s.vol[1] += d; s.shown = [s.vol[0], s.vol[1]]; say(); draw();
    }, 1000) : 0;

    const host = cv.parentElement;
    const onMove = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); s.lightTo = clamp(((e.clientX - b.left) / b.width) * 2 - 1, -1, 1); };
    const onLeave = () => { s.lightTo = 0; };
    host?.addEventListener("pointermove", onMove); host?.addEventListener("pointerleave", onLeave);
    const ro = new ResizeObserver(() => { fit(); if (reduce) draw(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); window.clearInterval(slow); api.current = null;
      host?.removeEventListener("pointermove", onMove); host?.removeEventListener("pointerleave", onLeave);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="flex min-h-[640px] w-full flex-col items-center justify-center bg-[#0b1114] bg-[radial-gradient(110%_80%_at_50%_38%,#1c2a30_0%,#10181c_48%,#070b0d_100%)] px-4 py-8 sm:min-h-[760px]">
      <div className="relative w-full" style={{ maxWidth: 600, aspectRatio: `${W} / ${H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <button
          type="button"
          aria-label="Turn the timer over"
          onClick={() => api.current?.flip()}
          className="absolute left-1/2 top-[15%] h-[70%] w-[42%] -translate-x-1/2 cursor-pointer touch-manipulation rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
        />
      </div>
      <div className="flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
        <span className="text-slate-100">{TITLE}</span>
        <span aria-hidden="true" className="text-slate-600">/</span>
        <span role="timer" aria-label={`${TITLE}, time left`} className="tabular-nums text-slate-100">{left > 0 ? clock(left) : "Done"}</span>
        <span aria-hidden="true" className="text-slate-600">/</span>
        <span>Tap to turn</span>
      </div>
    </div>
  );
}

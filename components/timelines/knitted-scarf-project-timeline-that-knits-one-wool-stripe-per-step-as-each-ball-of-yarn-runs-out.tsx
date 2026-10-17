import { useEffect, useRef, useState } from "react";

// One stripe of the scarf and one ball of wool per step. Edit names, dates and colours here.
const STEPS = [
  { title: "Brief", when: "3 March", wool: "#dfa22f" },
  { title: "Designs", when: "17 March", wool: "#c4502b" },
  { title: "Build", when: "7 April", wool: "#2f6f58" },
  { title: "Launch", when: "28 April", wool: "#2c3f73" },
];
const ROWS_PER_STEP = 8; // rows knitted for each step
const STITCHES = 17; // stitches across the scarf
const DEMO_SECONDS = 15; // length of one self-running project
const DEMO_START = 0.5; // the first run opens part way in so the page never shows bare needles
const STAGE = "#ead3cb";
const W = 440, H = 400; // drawing size in its own units; the canvas scales to its box

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const tint = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return `rgb(${c.map((v) => Math.round(k <= 1 ? v * k : v + (255 - v) * (k - 1))).join(",")})`;
};

export default function KnittedScarfProjectTimeline() {
  const canvas = useRef<HTMLCanvasElement>(null);
  // Write your own 0 to 1 value into this ref and delete the demo clock in the frame loop.
  const progress = useRef(DEMO_START);
  const jump = useRef<((step: number) => void) | null>(null);
  const total = STEPS.length * ROWS_PER_STEP;
  const [rows, setRows] = useState(Math.floor(DEMO_START * total));

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const K = Math.min(2, window.devicePixelRatio || 1) * 1.6;
    cv.width = W * K; cv.height = H * K;
    const TAU = Math.PI * 2, SW = 11, RH = 7.1, FW = STITCHES * SW, X0 = (W - FW) / 2, TOP = 34, BALL = 30, BALL_Y = 352;
    const slot = (i: number) => (W / STEPS.length) * (i + 0.5);
    let seed = 41;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const layer = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = Math.ceil(w * K); c.height = Math.ceil(h * K); const x = c.getContext("2d") as CanvasRenderingContext2D; x.scale(K, K); return { c, x }; };

    // A length of plied yarn between two points: round in section, with the twist showing as slanted nicks.
    const strand = (x: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, w: number, wool: string, lift: number) => {
      const len = Math.hypot(bx - ax, by - ay);
      x.save(); x.translate((ax + bx) / 2, (ay + by) / 2); x.rotate(Math.atan2(by - ay, bx - ax));
      const g = x.createLinearGradient(0, -w / 2, 0, w / 2);
      g.addColorStop(0, tint(wool, 0.5 * lift)); g.addColorStop(0.3, tint(wool, 1.02 * lift)); g.addColorStop(0.48, tint(wool, Math.max(1.02, 1.24 * lift))); g.addColorStop(0.78, tint(wool, 0.8 * lift)); g.addColorStop(1, tint(wool, 0.4 * lift));
      x.beginPath(); x.roundRect(-len / 2, -w / 2, len, w, w / 2); x.fillStyle = g; x.fill(); x.clip();
      x.lineWidth = 0.45; x.strokeStyle = tint(wool, 0.42);
      x.globalAlpha = 0.5;
      for (let d = -len / 2 + 1; d < len / 2; d += 1.9) { x.beginPath(); x.moveTo(d - 0.9, -w / 2); x.lineTo(d + 0.9, w / 2); x.stroke(); }
      x.globalAlpha = 0.5; x.strokeStyle = tint(wool, 1.5); x.lineWidth = 0.35;
      for (let d = -len / 2 + 1.9; d < len / 2; d += 1.9) { x.beginPath(); x.moveTo(d - 0.5, -w * 0.3); x.lineTo(d + 0.1, w * 0.05); x.stroke(); }
      x.restore();
    };

    // Per colour: three slightly different stitches, a loop for the needle and a wound ball.
    const SPW = SW + 4, SPH = RH * 2.4;
    const art = STEPS.map(({ wool }) => {
      const stitches = Array.from({ length: 3 }, () => {
        const l = layer(SPW, SPH), x = l.x, cx = SPW / 2, j = () => (rand() - 0.5) * 0.5;
        strand(x, cx - 1.1 + j(), 1.4, 2.1 + j(), 1.4 + RH * 1.24, 4.5, wool, 0.92);
        strand(x, cx + 1.1 + j(), 1.4, SPW - 2.1 + j(), 1.4 + RH * 1.24, 4.5, wool, 1.04);
        x.lineWidth = 0.22; x.strokeStyle = tint(wool, 1.55); x.globalAlpha = 0.55; // loose fibres
        for (let i = 0; i < 5; i++) { const fx = 2 + rand() * SW, fy = 1 + rand() * RH * 1.3; x.beginPath(); x.moveTo(fx, fy); x.quadraticCurveTo(fx + j() * 4, fy + j() * 4, fx + j() * 7, fy + j() * 7); x.stroke(); }
        return l.c;
      });
      const loop = layer(10, 16);
      strand(loop.x, 3.6, 1.6, 6.4, 14.4, 5, wool, 1.05);
      const ball = layer(BALL * 2 + 8, BALL * 2 + 8);
      {
        const x = ball.x, c = BALL + 4;
        x.beginPath(); x.arc(c, c, BALL, 0, TAU); x.fillStyle = tint(wool, 0.5); x.fill(); x.save(); x.clip();
        for (let band = 0; band < 26; band++) {
          const turn = rand() * Math.PI, squash = 0.08 + rand() * 0.8, side = rand() > 0.5 ? 0 : Math.PI, tone = 0.72 + rand() * 0.5;
          for (let i = 0; i < 6; i++) {
            x.save(); x.translate(c, c); x.rotate(turn);
            x.beginPath(); x.ellipse(0, 0, BALL + 1, (BALL + 1) * clamp(squash + i * 0.07, 0.02, 0.98), 0, side, side + Math.PI);
            x.lineWidth = 3.1; x.strokeStyle = tint(wool, 0.4); x.stroke();
            x.lineWidth = 2.3; x.strokeStyle = tint(wool, tone); x.stroke();
            x.lineWidth = 0.7; x.strokeStyle = tint(wool, tone * 1.22 > 1 ? 1.1 + (tone - 0.8) * 0.4 : tone * 1.22); x.setLineDash([1.6, 1.3]); x.stroke();
            x.restore();
          }
        }
        x.restore();
      }
      return { stitches, loop: loop.c, ball: ball.c };
    });

    const s = { r: DEMO_START * total, out: 0, bob: 0, turn: 0, lampX: 150, lampTo: 150, px: -999, py: -999, ropeFor: -1 };
    const NODES = 18;
    const rope = Array.from({ length: NODES }, () => ({ x: 0, y: 0, ox: 0, oy: 0 }));
    const layRope = (ax: number, ay: number, bx: number, by: number) => {
      for (let i = 0; i < NODES; i++) { const t = i / (NODES - 1), bow = Math.sin(t * Math.PI) * 16 + Math.sin(t * TAU) * 7; rope[i].x = rope[i].ox = ax + (bx - ax) * t + bow; rope[i].y = rope[i].oy = ay + (by - ay) * t - Math.sin(t * TAU) * 5; }
    };
    const moveRope = (ax: number, ay: number, bx: number, by: number) => {
      const seg = (Math.hypot(bx - ax, by - ay) * 1.05 + 10) / (NODES - 1);
      for (let i = 1; i < NODES - 1; i++) {
        const n = rope[i], vx = (n.x - n.ox) * 0.8, vy = (n.y - n.oy) * 0.8; // heavy damping: the yarn lies on a table
        n.ox = n.x; n.oy = n.y; n.x += vx; n.y += vy;
        const dx = n.x - s.px, dy = n.y - s.py, d = Math.hypot(dx, dy);
        if (d < 30 && d > 0.01) { n.x += (dx / d) * (30 - d) * 0.5; n.y += (dy / d) * (30 - d) * 0.5; }
      }
      for (let pass = 0; pass < 8; pass++) {
        rope[0].x = ax; rope[0].y = ay; rope[NODES - 1].x = bx; rope[NODES - 1].y = by;
        for (let i = 0; i < NODES - 1; i++) {
          const a = rope[i], b = rope[i + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - seg) / d / 2;
          if (i > 0) { a.x += dx * f; a.y += dy * f; } if (i < NODES - 2) { b.x -= dx * f; b.y -= dy * f; }
        }
      }
    };

    const needle = (len: number, knob: string | null) => {
      // Drawn along the x axis from 0 to len, point at the far end.
      const g = ctx.createLinearGradient(0, -3.2, 0, 3.2);
      g.addColorStop(0, "#fff1cf"); g.addColorStop(0.28, "#ecd09a"); g.addColorStop(0.62, "#cfa768"); g.addColorStop(1, "#8a6332");
      ctx.beginPath(); ctx.moveTo(0, -3.1); ctx.lineTo(len - 18, -3.1); ctx.quadraticCurveTo(len - 5, -2.4, len, 0); ctx.quadraticCurveTo(len - 5, 2.4, len - 18, 3.1); ctx.lineTo(0, 3.1); ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.fillRect(2, -2, len - 22, 0.7);
      ctx.fillStyle = "rgba(120,84,40,0.35)"; for (const k of [0.23, 0.52, 0.8]) ctx.fillRect(len * k, -3.1, 0.6, 6.2);
      if (knob) {
        const kg = ctx.createRadialGradient(-5.5, -2.4, 0.5, -4, 0, 7);
        kg.addColorStop(0, tint(knob, 1.7)); kg.addColorStop(0.45, knob); kg.addColorStop(1, tint(knob, 0.42));
        ctx.beginPath(); ctx.arc(-4, 0, 6.2, 0, TAU); ctx.fillStyle = kg; ctx.fill();
        ctx.fillStyle = "#b08a52"; ctx.fillRect(1, -3.4, 2.2, 6.8);
      }
    };
    const shadowed = (dx: number, dy: number, blur: number, a: number, paint: () => void) => { ctx.save(); ctx.shadowColor = `rgba(92,44,30,${a})`; ctx.shadowBlur = blur * K; ctx.shadowOffsetX = dx * K; ctx.shadowOffsetY = dy * K; paint(); ctx.restore(); };
    const chain = (y: number, wool: string, n: number) => { for (let j = 0; j < n; j++) strand(ctx, X0 + j * SW - 1.5, y + 0.9, X0 + j * SW + SW + 1.5, y - 0.9, 4.4, wool, 1); };

    const draw = () => {
      ctx.setTransform(K, 0, 0, K, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const full = Math.floor(s.r + 1e-6), frac = s.r - full, done = s.r >= total - 1e-6;
      const step = Math.min(STEPS.length - 1, Math.floor(s.r / ROWS_PER_STEP)), wool = STEPS[step].wool;
      const worked = done ? 0 : Math.round(frac * STITCHES), fromRight = full % 2 === 0; // rows are worked right to left, then back
      const lo = fromRight ? STITCHES - worked : 0, hi = fromRight ? STITCHES : worked;
      const sink = clamp(frac * 5), NY = TOP + (full + sink) * RH + 6.5;
      const bottom = TOP + full * RH + (worked ? RH : 0);

      // The fabric: its shadow on the table, a dark ground, then every stitch.
      shadowed(5, 9, 13, 0.4, () => { ctx.fillStyle = tint(STEPS[0].wool, 0.5); ctx.beginPath(); ctx.roundRect(X0 - 1, TOP - 2, FW + 2, Math.max(3, full * RH + 3), 3); ctx.fill(); });
      for (let i = 0; i < full + (worked ? 1 : 0); i++) {
        const st = Math.min(STEPS.length - 1, Math.floor(i / ROWS_PER_STEP)), a = i < full ? 0 : lo, b = i < full ? STITCHES : hi;
        ctx.fillStyle = tint(STEPS[st].wool, 0.36); ctx.fillRect(X0 + a * SW - 0.5, TOP + i * RH - 0.5, (b - a) * SW + 1, RH + 1.5);
      }
      chain(TOP - 1.4, STEPS[0].wool, STITCHES);
      for (let i = 0; i < full + (worked ? 1 : 0); i++) {
        const a = art[Math.min(STEPS.length - 1, Math.floor(i / ROWS_PER_STEP))];
        for (let j = i < full ? 0 : lo; j < (i < full ? STITCHES : hi); j++) ctx.drawImage(a.stitches[(i * 7 + j * 5) % 3], X0 + j * SW - 2, TOP + i * RH - 1, SPW, SPH);
      }
      if (done && s.out > 0.3) chain(TOP + total * RH + 4.2, STEPS[STEPS.length - 1].wool, STITCHES);
      // The lamp: brighter where it falls, and the edges of the fabric roll away from it.
      ctx.save(); ctx.beginPath(); ctx.rect(X0 - 3, TOP - 5, FW + 6, bottom - TOP + 14); ctx.clip();
      const lamp = ctx.createRadialGradient(s.lampX, TOP + 40, 10, s.lampX, TOP + 60, 250);
      lamp.addColorStop(0, "rgba(255,244,226,0.2)"); lamp.addColorStop(0.5, "rgba(255,244,226,0)"); lamp.addColorStop(1, "rgba(60,20,30,0.3)");
      ctx.fillStyle = lamp; ctx.globalCompositeOperation = "source-atop"; ctx.fillRect(X0 - 3, TOP - 5, FW + 6, bottom - TOP + 14);
      for (const [ex, dir] of [[X0 - 3, 1], [X0 + FW + 3, -1]]) { const g = ctx.createLinearGradient(ex, 0, ex + dir * 11, 0); g.addColorStop(0, "rgba(40,14,20,0.5)"); g.addColorStop(1, "rgba(40,14,20,0)"); ctx.fillStyle = g; ctx.fillRect(Math.min(ex, ex + dir * 11), TOP - 5, 11, bottom - TOP + 14); }
      ctx.restore();

      // Balls of wool wait in a row. The one in use shrinks and turns as its yarn is pulled away.
      let bx = 0, by = 0, br = 0;
      STEPS.forEach((st, i) => {
        const left = i > step ? 1 : i < step || done ? 0 : 1 - (s.r - step * ROWS_PER_STEP) / ROWS_PER_STEP;
        if (left <= 0.004) return;
        const r = BALL * (0.36 + 0.64 * Math.sqrt(left)) * clamp(left * 12), x = slot(i), y = BALL_Y + (BALL - r) * 0.7, spin = i === step ? s.turn : i * 1.9;
        ctx.save(); ctx.translate(x + 4, y + r * 0.92); ctx.scale(1, 0.3);
        const sh = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.5); sh.addColorStop(0, "rgba(92,44,30,0.5)"); sh.addColorStop(1, "rgba(92,44,30,0)");
        ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(0, 0, r * 1.5, 0, TAU); ctx.fill(); ctx.restore();
        ctx.save(); ctx.translate(x, y); ctx.rotate(spin); const z = (r / BALL) * (BALL * 2 + 8); ctx.drawImage(art[i].ball, -z / 2, -z / 2, z, z); ctx.restore();
        const hi = ctx.createRadialGradient(x - r * 0.42, y - r * 0.48, r * 0.05, x - r * 0.1, y - r * 0.1, r * 1.12);
        hi.addColorStop(0, "rgba(255,246,230,0.4)"); hi.addColorStop(0.42, "rgba(255,246,230,0)"); hi.addColorStop(0.72, "rgba(40,10,20,0.14)"); hi.addColorStop(1, "rgba(40,10,20,0.62)");
        ctx.beginPath(); ctx.arc(x, y, r + 0.4, 0, TAU); ctx.fillStyle = hi; ctx.fill();
        if (i === step) { bx = x - r * 0.3; by = y - r * 0.86; br = r; }
      });

      // Working yarn from the stitch in hand to the ball, lying slack on the table.
      const wx = fromRight ? X0 + FW - worked * SW + 1 : X0 + worked * SW - 1, wy = NY + 1;
      if (br > 0 && !done) {
        if (s.ropeFor !== step) { layRope(wx, wy, bx, by); s.ropeFor = step; }
        const path = () => { ctx.beginPath(); ctx.moveTo(rope[0].x, rope[0].y); for (let i = 1; i < NODES - 1; i++) ctx.quadraticCurveTo(rope[i].x, rope[i].y, (rope[i].x + rope[i + 1].x) / 2, (rope[i].y + rope[i + 1].y) / 2); ctx.lineTo(rope[NODES - 1].x, rope[NODES - 1].y); };
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        shadowed(1.5, 3, 3, 0.45, () => { path(); ctx.lineWidth = 3.4; ctx.strokeStyle = tint(wool, 0.45); ctx.stroke(); });
        path(); ctx.lineWidth = 2.5; ctx.strokeStyle = tint(wool, 0.96); ctx.stroke();
        ctx.save(); ctx.translate(-0.4, -0.5); path(); ctx.lineWidth = 0.9; ctx.strokeStyle = tint(wool, 1.4); ctx.setLineDash([2.2, 1.7]); ctx.stroke(); ctx.restore();
      } else if (done) {
        // Cast off: a short tail left at the corner.
        const ty = TOP + total * RH + 4;
        const tail = () => { ctx.beginPath(); ctx.moveTo(X0 + 3, ty); ctx.bezierCurveTo(X0 - 26, ty + 4, X0 - 30, ty + 30, X0 - 8, ty + 34); ctx.bezierCurveTo(X0 + 8, ty + 36, X0 + 6, ty + 22, X0 - 6, ty + 24); };
        ctx.lineCap = "round"; shadowed(1.5, 3, 3, 0.45, () => { tail(); ctx.lineWidth = 3.2; ctx.strokeStyle = tint(wool, 0.45); ctx.stroke(); });
        tail(); ctx.lineWidth = 2.4; ctx.strokeStyle = tint(wool, 0.96); ctx.stroke();
      }

      // The needle holding the live stitches. When the scarf is cast off it slides out and rests beside the work.
      const o = s.out, e = o * o * (3 - 2 * o);
      ctx.save(); ctx.translate(X0 - 34 + e * 62, NY + e * 26); ctx.rotate(e * 0.07);
      shadowed(2.5, 5, 4, 0.5, () => needle(FW + 68, STEPS[STEPS.length - 1].wool));
      ctx.restore();
      if (o < 0.5) {
        ctx.globalAlpha = 1 - o * 2;
        for (let j = 0; j < STITCHES; j++) {
          const fresh = j >= lo && j < hi, a = art[fresh || full % ROWS_PER_STEP !== 0 || full === 0 ? step : Math.max(0, step - 1)];
          shadowed(0.8, 1.6, 1.4, 0.4, () => ctx.drawImage(a.loop, X0 + j * SW + SW / 2 - 5, NY - 8, 10, 16));
        }
        ctx.globalAlpha = 1;
      }
      // The second needle does the knitting: it dips into each stitch in turn.
      const th = 0.33 - e * 0.22, len = 134, dip = done ? 0 : Math.sin(s.bob) * 2.6;
      const tx = wx - 2 - Math.cos(th) * dip - e * 34, ty = NY - 0.5 - Math.sin(th) * dip + e * 46;
      ctx.save(); ctx.translate(tx + Math.cos(th) * len, ty + Math.sin(th) * len); ctx.rotate(Math.PI + th);
      shadowed(3, 7, 5, 0.45, () => needle(len, null));
      ctx.restore();
    };

    let raf = 0, last = 0, seen = true, clock = DEMO_START * DEMO_SECONDS, touched = -1e9, idle = 0, shown = -1;
    const HOLD = 3.6;
    const report = () => { const n = Math.min(total, Math.floor(s.r + 1e-6)); if (n !== shown) { shown = n; setRows(n); } };
    const ends = () => {
      const full = Math.floor(s.r + 1e-6), frac = s.r - full, worked = Math.round(frac * STITCHES), step = Math.min(STEPS.length - 1, Math.floor(s.r / ROWS_PER_STEP));
      const left = 1 - (s.r - step * ROWS_PER_STEP) / ROWS_PER_STEP, r = BALL * (0.36 + 0.64 * Math.sqrt(clamp(left))) * clamp(left * 12);
      return [full % 2 === 0 ? X0 + FW - worked * SW + 1 : X0 + worked * SW - 1, TOP + (full + clamp(frac * 5)) * RH + 7.5, slot(step) - r * 0.3, BALL_Y + (BALL - r) * 0.7 - r * 0.86] as const;
    };
    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.033, (now - last) / 1000); last = now;

      // Demo clock. Delete this block when `progress.current` is fed from real work.
      clock += dt;
      if (clock < DEMO_SECONDS) progress.current = clock / DEMO_SECONDS;
      else if (clock < DEMO_SECONDS + HOLD) progress.current = 1;
      else { clock = 0; progress.current = 0; }

      const want = clamp(progress.current) * total, before = s.r;
      // Knitting follows the number; going backwards rips rows out quickly instead of jumping.
      s.r = want >= s.r ? Math.min(want, s.r + dt * 30) : Math.max(want, s.r - dt * 46);
      const pulled = Math.abs(s.r - before);
      s.bob += pulled * STITCHES * TAU; s.turn += pulled * 0.9;
      s.out += ((s.r >= total - 1e-6 ? 1 : 0) - s.out) * Math.min(1, dt * 3.2);
      idle += dt;
      if (now - touched > 3000) { s.lampTo = 200 + 80 * Math.sin(idle / 2.7); s.px = -999; }
      s.lampX += (s.lampTo - s.lampX) * Math.min(1, dt * 5);
      if (s.r < total) { const [ax, ay, bx, by] = ends(); moveRope(ax, ay, bx, by); }
      report();
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(frame); } };
    const still = () => { progress.current = 1; s.r = total; s.out = 1; report(); draw(); };
    jump.current = (step: number) => { if (reduce) return; clock = (step / STEPS.length) * DEMO_SECONDS; progress.current = step / STEPS.length; wake(); };
    if (reduce) still(); else wake();

    const onMove = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); touched = performance.now(); s.px = ((e.clientX - b.left) / b.width) * W; s.py = ((e.clientY - b.top) / b.height) * H; s.lampTo = s.px; };
    const onLeave = () => { s.px = -999; };
    cv.addEventListener("pointermove", onMove); cv.addEventListener("pointerdown", onMove); cv.addEventListener("pointerleave", onLeave);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); jump.current = null;
      cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerdown", onMove); cv.removeEventListener("pointerleave", onLeave);
      io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, [total]);

  const done = rows >= total;
  const current = Math.min(STEPS.length - 1, Math.floor(rows / ROWS_PER_STEP));
  return (
    <div
      className="flex min-h-[600px] w-full flex-col items-center justify-center overflow-hidden bg-[radial-gradient(85%_70%_at_42%_34%,#f5e3dc_0%,#ead3cb_55%,#dcbfb6_100%)] px-4 py-10 sm:min-h-[780px]"
      style={{ backgroundColor: STAGE }}
    >
      <div className="w-full max-w-[640px]">
        <canvas ref={canvas} aria-hidden="true" className="block h-auto w-full touch-pan-y" style={{ aspectRatio: `${W} / ${H}` }} />
        <ol aria-label="Project steps" className="-mt-1 grid grid-cols-4">
          {STEPS.map((step, i) => {
            const state = done || i < current ? "done" : i === current ? "now" : "next";
            const inRow = Math.min(ROWS_PER_STEP, rows - i * ROWS_PER_STEP);
            return (
              <li key={step.title} className="flex justify-center">
                <button
                  type="button"
                  aria-current={state === "now" ? "step" : undefined}
                  onClick={() => jump.current?.(i)}
                  className="flex min-h-[44px] flex-col items-center rounded-lg px-2 py-1 text-center outline-none transition-colors hover:bg-rose-950/5 focus-visible:ring-2 focus-visible:ring-rose-950 motion-reduce:transition-none"
                >
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold tracking-tight text-rose-950 sm:text-[15px]">
                    {state === "done" && (
                      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 10.5l4 4 8-9" />
                      </svg>
                    )}
                    {step.title}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-rose-950/80 sm:text-[11px]">
                    {state === "now" ? `Row ${Math.min(ROWS_PER_STEP, inRow + 1)} of ${ROWS_PER_STEP}` : step.when}
                  </span>
                  <span className="sr-only">{state === "done" ? "Finished" : state === "now" ? "In progress" : "Not started"}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <p role="status" className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-rose-950">
        {done ? "Cast off. Every step finished" : `Step ${current + 1} of ${STEPS.length}: ${STEPS[current].title}`}
      </p>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here.
const LABEL = "Belay check"; // what locking the carabiner confirms
const START_LOCKED = true; // the state on load
const BODY = ["#0b3557", "#1c79b0", "#7fd0f5"]; // anodised colour: shade, face, highlight
const ROPE = ["#b8430c", "#f2691c", "#ffd45a", "#1d2430"]; // rope: shade, sheath, bright fleck, dark fleck
const WARN = "#dc2233"; // the band that shows while the sleeve is undone
const TRAVEL = 1.5; // seconds for the whole clip-and-lock move
const DEMO = true; // unlock and lock by itself until a visitor does

const SIZE = 1.12; // largest scale the drawing is shown at
const TILT = 0.2; // how far the carabiner is turned on the table, in radians
const BW = 340, BH = 490; // design pixels of the layer the carabiner is composed on
const NOSE = { x: -70, y: -112 }, HINGE = { x: -56, y: 122 };
const GATE = Math.hypot(NOSE.x - HINGE.x, NOSE.y - HINGE.y), REST = Math.atan2(NOSE.x - HINGE.x, -(NOSE.y - HINGE.y));
const TAU = Math.PI * 2;
const seg = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const ease = (x: number) => x * x * (3 - 2 * x);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const tone = (a: string, b: string, t: number) => {
  const n = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return `rgb(${[0, 1, 2].map((i) => Math.round(mix(n(a, i), n(b, i), t))).join(",")})`;
};

export default function ScrewgateCarabinerSwitch() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [locked, setLocked] = useState(START_LOCKED);
  const want = useRef(START_LOCKED);
  const api = useRef<{ go: () => void; hands: () => void } | null>(null);

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let k = 1, ox = 0, oy = 0; // canvas pixels per design pixel, and where the carabiner's centre lies
    const S = { p: want.current ? 1 : 0, gate: 0, gateV: 0, sheen: 0.3, sheenTo: 0.3, auto: DEMO && !reduce, born: performance.now() };
    const body = document.createElement("canvas"), obj = document.createElement("canvas");
    const place = (c: CanvasRenderingContext2D, x: number, y: number) => { c.setTransform(k, 0, 0, k, x, y); c.rotate(TILT); };
    const onLayer = (c: CanvasRenderingContext2D) => place(c, (BW / 2) * k, (BH / 2) * k);

    const frame = (c: CanvasRenderingContext2D) => {
      c.beginPath(); c.moveTo(NOSE.x, NOSE.y);
      c.bezierCurveTo(-80, -170, -22, -188, 30, -179); c.bezierCurveTo(72, -171, 93, -140, 92, -100);
      c.lineTo(80, 96); c.bezierCurveTo(77, 150, 40, 177, 0, 172); c.bezierCurveTo(-30, 169, -52, 150, HINGE.x, HINGE.y);
    };
    // The forged body never moves, so it is painted once: a tube shaded in ten passes, then grain and markings.
    const paintBody = () => {
      body.width = obj.width = Math.ceil(BW * k); body.height = obj.height = Math.ceil(BH * k);
      const b = body.getContext("2d");
      if (!b) return;
      onLayer(b); b.lineCap = "round"; b.lineJoin = "round";
      frame(b); b.lineWidth = 25; b.strokeStyle = "#062238"; b.stroke();
      for (let i = 0; i < 10; i++) {
        const t = i / 9;
        b.save(); b.translate(-t * 3.4, -t * 3.8); frame(b);
        b.lineWidth = 23.5 * (1 - t * 0.86); b.strokeStyle = t < 0.5 ? tone(BODY[0], BODY[1], t * 2) : tone(BODY[1], BODY[2], (t - 0.5) * 2); b.stroke(); b.restore();
      }
      b.save(); b.translate(-5.2, -5.8); frame(b); b.lineWidth = 1.5; b.strokeStyle = "rgba(255,255,255,0.7)"; b.stroke(); b.restore();
      b.save(); b.translate(7.6, 8); frame(b); b.lineWidth = 2; b.strokeStyle = "rgba(160,220,255,0.22)"; b.stroke(); b.restore();
      // The weight-saving groove forged into the spine, with its markings etched inside.
      b.beginPath(); b.moveTo(90.5, -92); b.lineTo(81.5, 86); b.lineWidth = 9; b.strokeStyle = tone(BODY[0], BODY[1], 0.25); b.stroke();
      b.beginPath(); b.moveTo(87.6, -91); b.lineTo(78.6, 86); b.lineWidth = 1.6; b.strokeStyle = "rgba(2,18,32,0.6)"; b.stroke();
      b.beginPath(); b.moveTo(94, -91); b.lineTo(85, 86); b.lineWidth = 1.2; b.strokeStyle = "rgba(190,235,255,0.6)"; b.stroke();
      b.save(); b.translate(86, -3); b.rotate(Math.PI / 2 + Math.atan2(9, 178));
      b.font = `600 6.4px "Helvetica Neue", Helvetica, Arial, sans-serif`; b.textAlign = "center"; b.textBaseline = "middle";
      b.fillStyle = "rgba(225,244,255,0.86)"; b.fillText("MAJOR 24 kN     MINOR 8 kN     GATE OPEN 7 kN", 0, 0.4);
      b.restore();
      // Bead-blast grain, kept inside the metal.
      b.globalCompositeOperation = "source-atop";
      let seed = 5;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 5200; i++) {
        b.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.09)" : "rgba(0,20,40,0.12)";
        b.fillRect(-110 + rand() * 220, -200 + rand() * 390, 0.8, 0.8);
      }
      b.globalCompositeOperation = "source-over";
    };

    const cylinder = (c: CanvasRenderingContext2D, w: number, cols: [number, string][]) => {
      const g = c.createLinearGradient(-w / 2, 0, w / 2, 0);
      for (const [p, col] of cols) g.addColorStop(p, col);
      return g;
    };
    const drawGate = (c: CanvasRenderingContext2D, open: number, sleeve: number) => {
      c.save(); c.translate(HINGE.x, HINGE.y); c.rotate(REST + open);
      const L = GATE, G = 9.5;
      // The bare aluminium gate.
      c.beginPath(); c.moveTo(-G, 0); c.lineTo(-G, -L + 9); c.quadraticCurveTo(-G, -L + 3, -3, -L + 3); c.lineTo(3, -L + 3); c.quadraticCurveTo(G, -L + 3, G, -L + 9); c.lineTo(G, 0); c.arc(0, 0, G, 0, Math.PI); c.closePath();
      c.fillStyle = cylinder(c, G * 2, [[0, "#6f757d"], [0.16, "#c9ced4"], [0.36, "#ffffff"], [0.55, "#c2c7cd"], [0.82, "#7b8088"], [1, "#4a4e55"]]); c.fill();
      c.lineWidth = 0.6; c.strokeStyle = "rgba(20,24,30,0.55)"; c.stroke();
      // The warning band near the nose and the thread lower down.
      c.fillStyle = WARN; c.fillRect(-G, -L + 9, G * 2, 17);
      const band = c.createLinearGradient(-G, 0, G, 0);
      band.addColorStop(0, "rgba(0,0,0,0.4)"); band.addColorStop(0.36, "rgba(255,255,255,0.42)"); band.addColorStop(1, "rgba(0,0,0,0.45)");
      c.fillStyle = band; c.fillRect(-G, -L + 9, G * 2, 17);
      for (let y = -L + 56; y < -L + 100; y += 2.3) { c.beginPath(); c.moveTo(-G, y + 0.9); c.lineTo(G, y - 0.9); c.lineWidth = 0.9; c.strokeStyle = "rgba(30,34,42,0.6)"; c.stroke(); c.beginPath(); c.moveTo(-G, y + 1.9); c.lineTo(G, y + 0.1); c.lineWidth = 0.5; c.strokeStyle = "rgba(255,255,255,0.55)"; c.stroke(); }
      // Hinge rivet.
      c.beginPath(); c.arc(0, 0, 5.2, 0, TAU); c.fillStyle = cylinder(c, 10.4, [[0, "#5c6068"], [0.35, "#f4f5f7"], [1, "#565a61"]]); c.fill(); c.lineWidth = 0.7; c.strokeStyle = "rgba(0,0,0,0.6)"; c.stroke();
      c.beginPath(); c.arc(-1, -1, 1.8, 0, TAU); c.fillStyle = "rgba(255,255,255,0.8)"; c.fill();
      // The sleeve: screwed up over the nose when locked, wound down when open.
      const top = -L - 10 + (1 - sleeve) * 37, len = 68, w = 31;
      c.save(); c.translate(0, top);
      c.shadowColor = "rgba(0,10,20,0.45)"; c.shadowBlur = 4 * k; c.shadowOffsetX = 2 * k; c.shadowOffsetY = 2.5 * k;
      c.beginPath(); c.moveTo(-w / 2 + 3, 0); c.lineTo(w / 2 - 3, 0); c.quadraticCurveTo(w / 2, 0, w / 2, 3.5); c.lineTo(w / 2, len - 3.5); c.quadraticCurveTo(w / 2, len, w / 2 - 3, len); c.lineTo(-w / 2 + 3, len); c.quadraticCurveTo(-w / 2, len, -w / 2, len - 3.5); c.lineTo(-w / 2, 3.5); c.quadraticCurveTo(-w / 2, 0, -w / 2 + 3, 0); c.closePath();
      c.fillStyle = cylinder(c, w, [[0, BODY[0]], [0.12, BODY[1]], [0.32, BODY[2]], [0.52, BODY[1]], [0.86, BODY[0]], [1, "#041a2b"]]); c.fill();
      c.shadowColor = "transparent"; c.lineWidth = 0.7; c.strokeStyle = "rgba(2,16,28,0.7)"; c.stroke();
      c.clip();
      // Grip ribs travel across the sleeve as it turns.
      const turn = sleeve * TAU * 1.75;
      for (let i = 0; i < 26; i++) {
        const a = ((((i / 26) * TAU + turn) % TAU) + TAU) % TAU;
        if (a > Math.PI) continue;
        const x = -Math.cos(a) * (w / 2), face = Math.sin(a);
        c.beginPath(); c.moveTo(x, 13); c.lineTo(x, len - 13); c.lineWidth = 0.5 + face * 1.3; c.strokeStyle = `rgba(2,18,32,${0.5 + 0.2 * (1 - face)})`; c.stroke();
        c.beginPath(); c.moveTo(x - 1.2 * face, 13); c.lineTo(x - 1.2 * face, len - 13); c.lineWidth = 0.6; c.strokeStyle = `rgba(200,240,255,${0.5 * face})`; c.stroke();
      }
      for (const y of [8.5, len - 8.5]) { c.fillStyle = "rgba(2,16,28,0.55)"; c.fillRect(-w / 2, y - 0.6, w, 1.2); c.fillStyle = "rgba(200,240,255,0.4)"; c.fillRect(-w / 2, y + 0.6, w, 0.7); }
      const lipTop = c.createLinearGradient(0, 0, 0, 5); lipTop.addColorStop(0, "rgba(255,255,255,0.55)"); lipTop.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = lipTop; c.fillRect(-w / 2, 0, w, 5);
      c.restore();
      c.restore();
    };

    // The rope is a curve walked at even steps, so each stitch of the braid is the same length.
    type Stitch = { x: number; y: number; nx: number; ny: number };
    const ropePoints = (clip: number, now: number) => {
      const breathe = reduce ? 0 : Math.sin(now / 1700) * 2.2;
      const p0 = { x: -345, y: 640 }, p3 = { x: mix(-140, 96, clip), y: -650 }, mid = mix(-146, 12, clip) + breathe;
      const cx = (8 * mid - p0.x - p3.x) / 6, p1 = { x: cx, y: 215 }, p2 = { x: cx, y: -300 };
      const at = (t: number) => { const u = 1 - t; return { x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x, y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y }; };
      const pts: Stitch[] = [];
      let prev = at(0), carry = 0, half = 0;
      for (let i = 1; i <= 160; i++) {
        const next = at(i / 160), dx = next.x - prev.x, dy = next.y - prev.y, d = Math.hypot(dx, dy) || 1;
        for (let s = carry; s < d; s += 3.6) pts.push({ x: prev.x + (dx * s) / d, y: prev.y + (dy * s) / d, nx: -dy / d, ny: dx / d });
        carry = (carry - d) % 3.6; if (carry < 0) carry += 3.6;
        if (i === 80) half = pts.length;
        prev = next;
      }
      return { pts, half };
    };
    const drawRope = (pts: Stitch[], from: number, to: number, lift: number) => {
      const line = (off: number) => { ctx.beginPath(); for (let i = from; i <= to; i++) { const q = pts[i]; ctx.lineTo(q.x + q.nx * off, q.y + q.ny * off); } };
      ctx.lineJoin = "round"; ctx.lineCap = "butt";
      ctx.save(); ctx.shadowColor = "rgba(38,42,54,0.4)"; ctx.shadowBlur = (9 + lift * 10) * k; ctx.shadowOffsetX = (6 + lift * 8) * k; ctx.shadowOffsetY = (9 + lift * 12) * k;
      line(0); ctx.lineWidth = 22; ctx.strokeStyle = ROPE[0]; ctx.stroke(); ctx.restore();
      line(-0.6); ctx.lineWidth = 19.5; ctx.strokeStyle = ROPE[1]; ctx.stroke();
      // The braid: every stitch is a pair of short strands leaning into the middle, like a herringbone.
      ctx.lineCap = "round"; ctx.lineWidth = 2.5;
      const stitch = (side: number, pick: (i: number) => string | null) => {
        let ink = "";
        for (let i = from; i <= to; i++) {
          const col = pick(i);
          if (!col) continue;
          if (col !== ink) { if (ink) ctx.stroke(); ctx.beginPath(); ctx.strokeStyle = col; ink = col; }
          const q = pts[i], tx = q.ny, ty = -q.nx;
          ctx.moveTo(q.x + q.nx * side * 0.6 + tx * 2.6, q.y + q.ny * side * 0.6 + ty * 2.6);
          ctx.lineTo(q.x + q.nx * side * 8.6 - tx * 2.6, q.y + q.ny * side * 8.6 - ty * 2.6);
        }
        if (ink) ctx.stroke();
      };
      for (const side of [1, -1]) {
        stitch(side, (i) => (i % 2 ? "rgba(120,36,0,0.42)" : null));
        stitch(side, (i) => ((i + (side > 0 ? 0 : 6)) % 12 < 2 ? ROPE[2] : null));
        stitch(side, (i) => ((i + (side > 0 ? 6 : 0)) % 24 === 4 ? ROPE[3] : null));
      }
      ctx.lineCap = "butt";
      line(9); ctx.lineWidth = 4.5; ctx.strokeStyle = "rgba(70,18,0,0.38)"; ctx.stroke();
      line(5.5); ctx.lineWidth = 5; ctx.strokeStyle = "rgba(70,18,0,0.14)"; ctx.stroke();
      line(-5.4); ctx.lineWidth = 4.4; ctx.strokeStyle = "rgba(255,240,214,0.26)"; ctx.stroke();
      line(-9.6); ctx.lineWidth = 1.6; ctx.strokeStyle = "rgba(90,26,0,0.3)"; ctx.stroke();
    };

    const draw = (now: number) => {
      const clip = ease(seg(S.p, 0, 0.56)), sleeve = ease(seg(S.p, 0.62, 1));
      const lift = Math.sin(seg(S.p, 0.04, 0.56) * Math.PI);
      // Carabiner and gate are composed off screen so one soft sheen and one shadow cover both.
      const o = obj.getContext("2d");
      if (!o) return;
      o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = "source-over"; o.clearRect(0, 0, obj.width, obj.height);
      o.drawImage(body, 0, 0);
      onLayer(o); drawGate(o, S.gate, sleeve);
      o.globalCompositeOperation = "source-atop";
      const sx = mix(-150, 170, S.sheen), sh = o.createLinearGradient(sx - 60, -120, sx + 60, 40);
      sh.addColorStop(0, "rgba(255,255,255,0)"); sh.addColorStop(0.5, "rgba(255,255,255,0.3)"); sh.addColorStop(1, "rgba(255,255,255,0)");
      o.fillStyle = sh; o.fillRect(-260, -260, 520, 520);

      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      place(ctx, ox, oy);
      const { pts, half } = ropePoints(clip, now);
      drawRope(pts, 0, half, lift * 0.4);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const lx = Math.round(ox - (BW / 2) * k), ly = Math.round(oy - (BH / 2) * k);
      ctx.shadowColor = "rgba(38,42,54,0.3)"; ctx.shadowBlur = 20 * k; ctx.shadowOffsetX = 11 * k; ctx.shadowOffsetY = 16 * k; ctx.drawImage(obj, lx, ly);
      ctx.shadowColor = "rgba(30,34,44,0.5)"; ctx.shadowBlur = 3.5 * k; ctx.shadowOffsetX = 2 * k; ctx.shadowOffsetY = 3 * k; ctx.drawImage(obj, lx, ly);
      ctx.restore(); place(ctx, ox, oy);
      drawRope(pts, half - 1, pts.length - 1, lift);
      drawRope(pts, 32, 64, lift);
    };

    let raf = 0, last = performance.now(), seen = true;
    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (S.auto) {
        const d = ((now - S.born) / 1000) % 9.5, should = d < 4 || d > 7.2;
        if (should !== want.current) api.current?.hands();
        S.sheenTo = 0.5 + Math.sin(now / 2100) * 0.42;
      }
      const goal = want.current ? 1 : 0;
      S.p = goal > S.p ? Math.min(goal, S.p + dt / TRAVEL) : Math.max(goal, S.p - dt / TRAVEL);
      // The rope shoulders the gate aside on its way through; a spring slams it back.
      const c = seg(S.p, 0, 0.56), push = ease(seg(c, 0.2, 0.44)) * (1 - seg(c, 0.66, 0.7)) * 0.4;
      for (let i = 0; i < 3; i++) { const h = dt / 3; S.gateV += ((push - S.gate) * 900 - S.gateV * (push > S.gate ? 60 : 13)) * h; S.gate += S.gateV * h; if (S.gate < 0) { S.gate = 0; S.gateV *= -0.38; } }
      S.sheen += (S.sheenTo - S.sheen) * Math.min(1, dt * 4);
      draw(now);
      if (seen && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const wake = () => { if (!reduce && !raf && seen && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    const still = () => { S.p = want.current ? 1 : 0; S.gate = 0; draw(performance.now()); };
    api.current = {
      hands: () => { want.current = !want.current; setLocked(want.current); if (reduce) still(); else wake(); },
      go: () => { S.auto = false; api.current?.hands(); },
    };

    const onMove = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); S.sheenTo = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); };
    const size = () => {
      const w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1), fit = Math.min(SIZE, w / 400, h / 640);
      k = fit * dpr; ox = (w / 2 + 12 * fit) * dpr; oy = h * 0.47 * dpr;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      paintBody();
      if (reduce) still(); else { draw(performance.now()); wake(); }
    };
    const ro = new ResizeObserver(size); ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    box.addEventListener("pointermove", onMove);
    size();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", onVis); box.removeEventListener("pointermove", onMove);
      api.current = null;
    };
  }, []);

  return (
    <div ref={stage} className="relative min-h-[760px] w-full overflow-hidden bg-[#e3e4e1] bg-[radial-gradient(75%_60%_at_42%_38%,#f6f6f3_0%,#e6e7e4_55%,#cfd1ce_100%)]">
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <button
        type="button"
        role="switch"
        aria-checked={locked}
        aria-label={`${LABEL}: carabiner locked`}
        onClick={() => api.current?.go()}
        className="absolute left-1/2 top-[47%] h-[66%] w-[min(84%,400px)] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-[48px] outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
      />
      <p aria-live="polite" className="absolute inset-x-0 bottom-7 mx-auto w-fit max-w-[92%] rounded-full bg-[#e3e4e1]/85 px-4 py-1.5 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-slate-600">
        <span className="font-semibold text-slate-900">{LABEL}</span>
        <span className="mx-2 text-slate-400">/</span>
        {locked ? "Rope clipped, gate locked" : "Open. Press to clip in and lock"}
      </p>
    </div>
  );
}

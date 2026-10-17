import { useEffect, useRef, useState } from "react";

// The measurement this control collects. The engraved scales are real, so keep MAX at 36 or below
// unless you also lengthen the beam (BEAM) further down.
const LABEL = "Bar diameter";
const UNIT = "mm";
const MIN = 0;
const MAX = 36;
const START = 28.4;
const TOUR = [28.4, 12.6, 33.2, 21.0]; // sizes the idle demo visits
const DEMO = true; // set to false inside a real form so the jaw only moves when the user moves it

const snap = (v: number) => Math.max(MIN, Math.min(MAX, Math.round(v * 10) / 10));

export default function StainlessVernierCaliperInput() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [value, setValue] = useState(START);
  const api = useRef<{ set: (v: number) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    // Everything below is laid out in millimetres. x = 0 is the fixed jaw's face, y = 0 the top of the beam.
    const BEAM = 96, BH = 18, Z0 = 12, HEAD = 46, TIP = 50, WIN0 = 4.2, WIN1 = 13.6;
    let W = 0, H = 0, ppm = 6, ox = 0, oy = 0;
    const X = (mm: number) => ox + mm * ppm, Y = (mm: number) => oy + mm * ppm;

    let seed = 5;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    // Brushed finish: long faint scratches along the beam.
    const brush = document.createElement("canvas");
    brush.width = 512; brush.height = 128;
    const bx = brush.getContext("2d");
    if (bx) for (let y = 0; y < 128; y++) { const off = rnd() * 512; let x = 0; while (x < 512) { const len = Math.min(512 - x, 24 + rnd() * 170), v = rnd(), at = (x + off) % 512; bx.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.5})` : `rgba(0,0,0,${(0.5 - v) * 0.36})`; bx.fillRect(at, y, len, 1); if (at + len > 512) bx.fillRect(at - 512, y, len, 1); x += len; } }
    const brushed = ctx.createPattern(brush, "repeat");
    const rings = Array.from({ length: 260 }, () => rnd());

    const s = { v: DEMO ? START + 3.4 : START, vel: 0, target: DEMO ? START + 3.4 : START, raw: START, drag: false, shown: START, keyed: false };

    const layout = () => {
      W = cv.clientWidth; H = cv.clientHeight;
      ppm = Math.min(W / 112, H / 85, 8.4);
      ox = W / 2 - 42.5 * ppm; oy = H / 2 - 23.5 * ppm;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    };

    const poly = (pts: number[][]) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)))); ctx.closePath(); };
    const box = (x0: number, y0: number, x1: number, y1: number) => { ctx.rect(X(x0), Y(y0), (x1 - x0) * ppm, (y1 - y0) * ppm); };

    // One recipe for every steel part: a banded sheen, the brushing, a lit top edge, a shaded bottom edge.
    const steel = (build: () => void, g: number[], lift: number, rule: CanvasFillRule = "nonzero") => {
      const grad = ctx.createLinearGradient(X(g[0]), Y(g[1]), X(g[2]), Y(g[3]));
      for (const [p, v] of [[0, 244], [0.18, 216], [0.36, 234], [0.6, 198], [0.8, 220], [1, 172]]) { const c = v + lift; grad.addColorStop(p, `rgb(${c - 5},${c - 1},${c + 4})`); }
      build(); ctx.fillStyle = grad; ctx.fill(rule);
      ctx.save(); ctx.clip(rule);
      if (brushed) { ctx.globalAlpha = 0.6; ctx.fillStyle = brushed; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
      ctx.lineWidth = 1.7; ctx.lineJoin = "round";
      ctx.translate(0, 1.1); build(); ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.stroke();
      ctx.translate(0, -2.3); build(); ctx.strokeStyle = "rgba(24,30,38,0.5)"; ctx.stroke();
      ctx.restore();
      build(); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(12,16,20,0.8)"; ctx.stroke();
    };
    // Graduations are etched: a dark cut with a hair of light on its lower right edge.
    const tick = (x: number, y0: number, y1: number, heavy = false) => {
      const w = Math.max(0.7, ppm * (heavy ? 0.16 : 0.12)), px = X(x) - w / 2;
      ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.fillRect(px + w * 0.9, Y(Math.min(y0, y1)), 0.6, Math.abs(y1 - y0) * ppm);
      ctx.fillStyle = "#14171b"; ctx.fillRect(px, Y(Math.min(y0, y1)), w, Math.abs(y1 - y0) * ppm);
    };
    const etch = (text: string, x: number, y: number, size: number, align: CanvasTextAlign = "left") => {
      ctx.font = `600 ${size * ppm}px ui-sans-serif, system-ui, Helvetica, Arial, sans-serif`; ctx.textAlign = align; ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fillText(text, X(x) + 0.5, Y(y) + 0.7);
      ctx.fillStyle = "#14171b"; ctx.fillText(text, X(x), Y(y));
    };

    const drawSlug = (v: number) => {
      const r = v / 2;
      if (r < 0.35) return;
      const cx = X(r), cy = Y(26.5 + r), R = r * ppm;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 18 * dpr; ctx.shadowOffsetX = 5 * dpr; ctx.shadowOffsetY = 12 * dpr;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = "#3a2a08"; ctx.fill(); ctx.restore();
      const brass = (b: number) => `rgb(${Math.min(255, b * 1.02) | 0},${(b * 0.8) | 0},${(b * 0.36) | 0})`;
      let face: CanvasGradient;
      if (typeof ctx.createConicGradient === "function") {
        face = ctx.createConicGradient(-2.25, cx, cy);
        for (const [p, b] of [[0, 255], [0.04, 246], [0.1, 200], [0.2, 150], [0.3, 176], [0.42, 226], [0.5, 250], [0.56, 214], [0.66, 152], [0.76, 138], [0.86, 186], [0.95, 240], [1, 255]]) face.addColorStop(p, brass(b));
      } else { face = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R); face.addColorStop(0, brass(250)); face.addColorStop(1, brass(150)); }
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = face; ctx.fill();
      // Facing marks left by the lathe tool, and the chamfer it cut on the rim.
      ctx.save(); ctx.clip();
      let i = 0;
      for (let q = 1.5; q < R; q += 1.25) { const a = rings[i++ % rings.length]; ctx.beginPath(); ctx.arc(cx, cy, q, 0, Math.PI * 2); ctx.lineWidth = 0.7; ctx.strokeStyle = a > 0.5 ? `rgba(255,244,200,${(a - 0.5) * 0.5})` : `rgba(70,40,0,${(0.5 - a) * 0.42})`; ctx.stroke(); }
      ctx.restore();
      const ch = Math.max(1.2, Math.min(0.9 * ppm, R * 0.16));
      ctx.beginPath(); ctx.arc(cx, cy, R - ch / 2, 0, Math.PI * 2); ctx.lineWidth = ch;
      const rim = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      rim.addColorStop(0, "rgba(255,250,222,0.95)"); rim.addColorStop(0.45, "rgba(214,170,74,0.5)"); rim.addColorStop(1, "rgba(82,52,8,0.85)");
      ctx.strokeStyle = rim; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, R - ch, 0, Math.PI * 2); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(70,42,4,0.55)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(40,24,2,0.8)"; ctx.stroke();
      if (R > 9) {
        const d = Math.min(0.8 * ppm, R * 0.12), pit = ctx.createRadialGradient(cx + d * 0.25, cy + d * 0.3, 0, cx, cy, d);
        pit.addColorStop(0, "#f5dd96"); pit.addColorStop(0.55, "#8a6417"); pit.addColorStop(1, "#3d2804");
        ctx.beginPath(); ctx.arc(cx, cy, d, 0, Math.PI * 2); ctx.fillStyle = pit; ctx.fill();
      }
    };

    const knurled = (x0: number, y0: number, x1: number, y1: number) => {
      const g = ctx.createLinearGradient(X(x0), 0, X(x1), 0);
      g.addColorStop(0, "#565c64"); g.addColorStop(0.28, "#f1f3f5"); g.addColorStop(0.55, "#b6bcc3"); g.addColorStop(1, "#484d55");
      ctx.beginPath(); box(x0, y0, x1, y1); ctx.fillStyle = g; ctx.fill();
      for (let x = x0 + 0.35; x < x1; x += 0.55) { ctx.fillStyle = "rgba(10,14,18,0.5)"; ctx.fillRect(X(x), Y(y0), Math.max(0.6, ppm * 0.14), (y1 - y0) * ppm); }
      ctx.beginPath(); box(x0, y0, x1, y1); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(12,16,20,0.85)"; ctx.stroke();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const v = Math.max(0, s.v);
      const fixed = [[-11, 0], [-6.6, 0], [-1.1, -13], [0, -13], [0, TIP], [-1.3, TIP], [-9.5, 26.5], [-11, 23.5]];
      const head = [[v, -13], [v + 1.1, -13], [v + 6.6, -3.5], [v + HEAD - 1, -3.5], [v + HEAD, -2.5], [v + HEAD, 23], [v + HEAD - 1, 24], [v + 11.5, 24], [v + 9.5, 26.5], [v + 1.3, TIP], [v, TIP]];
      const beam = () => { ctx.beginPath(); const r = 1.4 * ppm, x0 = X(-3), x1 = X(BEAM), y0 = Y(0), y1 = Y(BH); ctx.moveTo(x0, y0); ctx.arcTo(x1, y0, x1, y1, r); ctx.arcTo(x1, y1, x0, y1, r); ctx.lineTo(x0, y1); ctx.closePath(); };
      const slider = () => { poly(head); box(v + 8, WIN0, v + 41, WIN1); };

      // What the tool throws on the mat: a wide soft shadow and a tight one where the steel sits down.
      for (const [blur, dy, a] of [[26, 16, 0.42], [6, 4, 0.5]]) {
        ctx.save(); ctx.shadowColor = `rgba(0,0,0,${a})`; ctx.shadowBlur = blur * dpr; ctx.shadowOffsetX = dy * 0.4 * dpr; ctx.shadowOffsetY = dy * dpr; ctx.fillStyle = "#0c1512";
        beam(); ctx.fill(); poly(fixed); ctx.fill(); poly(head); ctx.fill(); ctx.restore();
      }
      drawSlug(v);

      steel(beam, [0, 0, 30, BH * 3], 0);
      // Main scale in millimetres along the lower edge of the opening, sixteenths of an inch along the upper.
      for (let i = 0; i <= 80; i++) tick(Z0 + i, WIN1 - (i % 10 === 0 ? 3.5 : i % 5 === 0 ? 2.7 : 1.8), WIN1, i % 10 === 0);
      if (ppm > 2.4) for (let i = 0; i <= 80; i += 10) etch(String(i), Z0 + i + 0.55, WIN1 - 3.9, 2.3);
      for (let j = 0; j <= 50; j++) tick(Z0 + j * 1.5875, WIN0, WIN0 + (j % 16 === 0 ? 3.1 : j % 8 === 0 ? 2.5 : j % 4 === 0 ? 2 : j % 2 === 0 ? 1.5 : 1.05), j % 16 === 0);
      if (ppm > 2.4) for (let j = 0; j <= 48; j += 16) etch(String(j / 16), Z0 + j * 1.5875 + 0.55, WIN0 + 2.75, 2);
      if (ppm > 4) { etch("in", Z0 - 2.2, WIN0 + 1.4, 1.9, "right"); etch("mm", Z0 - 2.2, WIN1 - 1.5, 1.9, "right"); }

      steel(() => poly(fixed), [-11, -13, 6, TIP], -6);
      // The ground measuring face of each jaw is a narrow, brighter land.
      const land = (x: number, dir: number) => {
        ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillRect(X(x) + (dir < 0 ? -1.25 * ppm : 0), Y(24.5), 1.25 * ppm, (TIP - 26) * ppm);
        ctx.fillStyle = "rgba(14,18,24,0.42)"; ctx.fillRect(X(x + dir * 1.25) - 0.4, Y(24.5), 0.8, (TIP - 26) * ppm);
      };
      land(0, -1);

      // Parts that sit behind the sliding head: the lock screw on top and the thumb roller underneath.
      ctx.beginPath(); box(v + 24.3, -5.3, v + 25.7, -3.2); ctx.fillStyle = "#8a9098"; ctx.fill();
      knurled(v + 22.2, -8.9, v + 27.8, -5.2);
      const wx = X(v + 36.5), wy = Y(24.4), wr = 4.3 * ppm;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 5 * dpr; ctx.shadowOffsetY = 3 * dpr;
      ctx.beginPath(); ctx.arc(wx, wy, wr, 0, Math.PI * 2); ctx.fillStyle = "#6f757d"; ctx.fill(); ctx.restore();
      const wg = ctx.createLinearGradient(wx - wr, wy - wr, wx + wr, wy + wr);
      wg.addColorStop(0, "#f2f4f6"); wg.addColorStop(0.5, "#a9afb7"); wg.addColorStop(1, "#4d535b");
      ctx.beginPath(); ctx.arc(wx, wy, wr, 0, Math.PI * 2); ctx.fillStyle = wg; ctx.fill();
      for (let i = 0; i < 28; i++) {
        const a = v / 4.3 + (i / 28) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(wx + Math.cos(a) * wr * 0.7, wy + Math.sin(a) * wr * 0.7); ctx.lineTo(wx + Math.cos(a) * wr, wy + Math.sin(a) * wr);
        ctx.lineWidth = Math.max(0.7, ppm * 0.16); ctx.strokeStyle = "rgba(10,14,18,0.6)"; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(wx, wy, wr, 0, Math.PI * 2); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(12,16,20,0.85)"; ctx.stroke();

      // The sliding head, with the opening the scales are read through. It shades the beam slightly.
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 5 * dpr; ctx.shadowOffsetY = 2.5 * dpr;
      slider(); ctx.fillStyle = "#c8ccd1"; ctx.fill("evenodd"); ctx.restore();
      steel(slider, [v, -13, v + 40, TIP], 8, "evenodd");
      land(v, 1);
      // Bevel under the opening that carries the vernier.
      const bev = ctx.createLinearGradient(0, Y(WIN1), 0, Y(WIN1 + 4.2));
      bev.addColorStop(0, "rgba(255,255,255,0.75)"); bev.addColorStop(0.2, "rgba(255,255,255,0.3)"); bev.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bev; ctx.fillRect(X(v + 8), Y(WIN1), 33 * ppm, 4.2 * ppm);
      // Ten divisions over nineteen millimetres: the vernier line that meets a beam line is the tenths digit.
      for (let i = 0; i <= 10; i++) tick(v + Z0 + i * 1.9, WIN1, WIN1 + (i % 5 === 0 ? 3.3 : 2.3), i % 5 === 0);
      if (ppm > 2.4) for (let i = 0; i <= 10; i += 5) etch(String(i), v + Z0 + i * 1.9, WIN1 + 5.4, 2.2, "center");
      if (ppm > 4) etch("0.1 mm", v + 43.5, WIN1 + 8, 1.7, "right");
      // Two countersunk screws hold the gib strip.
      for (const sx of [v + 12, v + 38]) {
        const px = X(sx), py = Y(0.4), r = 1.25 * ppm, g = ctx.createRadialGradient(px - r * 0.3, py - r * 0.4, 0, px, py, r);
        g.addColorStop(0, "#fafbfc"); g.addColorStop(0.6, "#a2a8b0"); g.addColorStop(1, "#4a5058");
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(12,16,20,0.8)"; ctx.stroke();
        ctx.fillStyle = "rgba(12,16,20,0.8)"; ctx.fillRect(px - r * 0.7, py - Math.max(0.4, r * 0.13), r * 1.4, Math.max(0.8, r * 0.26));
      }
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, demoAt = 650, stop = 0;
    const publish = () => { const v = s.keyed ? s.target : snap(s.v); // a key press shows its result at once, the jaw catches up
      if (v !== s.shown) { s.shown = v; setValue(v); } };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      if (DEMO && now - touched > 6000 && !s.drag && t > demoAt) { s.keyed = false; s.target = TOUR[stop % TOUR.length]; stop++; demoAt = t + (stop === 1 ? 3900 : 2900); }
      if (s.drag) { const nv = s.v + (s.raw - s.v) * Math.min(1, dt * 30); s.vel = (nv - s.v) / Math.max(dt, 0.001); s.v = nv; }
      else { s.vel += (150 * (s.target - s.v) - 21 * s.vel) * dt; s.v += s.vel * dt; }
      publish();
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const still = () => { if (!s.drag) s.v = s.target; s.vel = 0; publish(); draw(); };

    api.current = { set: (v) => { touched = performance.now(); s.keyed = true; s.target = snap(v); publish(); if (reduce) still(); else wake(); } };
    layout();
    if (reduce) { s.v = s.target = START; still(); } else wake();

    let startX = 0, startV = 0;
    const onDown = (e: PointerEvent) => { touched = performance.now(); s.drag = true; s.keyed = false; startX = e.clientX; startV = s.v; s.raw = s.v; cv.setPointerCapture(e.pointerId); wake(); };
    const onMove = (e: PointerEvent) => {
      if (!s.drag) return;
      touched = performance.now();
      s.raw = Math.max(MIN, Math.min(MAX, startV + (e.clientX - startX) / ppm));
      if (reduce) { s.v = s.raw; still(); }
    };
    const onUp = () => { if (!s.drag) return; s.drag = false; touched = performance.now(); s.target = snap(s.raw); if (reduce) still(); };
    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(() => { layout(); if (reduce) still(); else { draw(); wake(); } });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onUp); cv.removeEventListener("pointercancel", onUp);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="stainless-vernier-caliper-mat flex min-h-[600px] w-full flex-col items-center justify-center bg-[#17463a] px-3 py-10 sm:min-h-[760px] sm:px-8">
      <style>{`
        .stainless-vernier-caliper-mat {
          background-image:
            radial-gradient(90% 75% at 50% 42%, rgba(255,255,255,0.09) 0%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%),
            linear-gradient(rgba(226,244,226,0.11) 1px, transparent 1px),
            linear-gradient(90deg, rgba(226,244,226,0.11) 1px, transparent 1px),
            linear-gradient(rgba(226,244,226,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(226,244,226,0.04) 1px, transparent 1px);
          background-size: 100% 100%, 60px 60px, 60px 60px, 12px 12px, 12px 12px;
          background-position: center;
        }
      `}</style>
      <canvas ref={canvas} aria-hidden="true" className="block h-[270px] w-full max-w-[940px] cursor-ew-resize touch-pan-y select-none sm:h-[560px]" />
      <div className="flex w-full max-w-[720px] items-end justify-between gap-4 px-2">
        <div>
          <input
            id="vernier-caliper-range"
            type="range"
            min={MIN}
            max={MAX}
            step={0.1}
            value={value}
            aria-valuetext={`${value.toFixed(1)} ${UNIT}`}
            onChange={(e) => api.current?.set(Number(e.target.value))}
            className="peer sr-only"
          />
          <label htmlFor="vernier-caliper-range" className="block rounded-md px-1 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/80 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-300">
            {LABEL}
          </label>
          <output htmlFor="vernier-caliper-range" className="mt-1 block px-1 text-5xl font-semibold tabular-nums tracking-tight text-white sm:text-6xl">
            {value.toFixed(1)}
            <span className="ml-2 text-xl font-medium text-emerald-100/70 sm:text-2xl">{UNIT}</span>
          </output>
        </div>
        <p className="max-w-[200px] pb-2 text-right font-mono text-[11px] uppercase leading-5 tracking-[0.14em] text-emerald-100/80">
          Slide the jaw
          <br />
          Arrow keys move a tenth
        </p>
      </div>
    </div>
  );
}

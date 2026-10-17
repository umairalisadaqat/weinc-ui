import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// Opening hours, Monday first, as whole hours on a 24 hour clock. Give a closed day the same open and close.
const week = [
  { day: "Mon", open: 0, close: 0 },
  { day: "Tue", open: 9, close: 17 },
  { day: "Wed", open: 9, close: 17 },
  { day: "Thu", open: 9, close: 19 },
  { day: "Fri", open: 8, close: 19 },
  { day: "Sat", open: 8, close: 18 },
  { day: "Sun", open: 10, close: 15 },
];
const PLACE = "Fennel Yard garden cafe";
const MOTTO = "I COUNT ONLY THE OPEN HOURS";
const LATITUDE = 48; // degrees north; it sets how the hour lines fan out
const FIRST = 5, LAST = 19; // the hours engraved on the plate

const SIZE = 520, C = SIZE / 2, PLINTH = 250, PLATE = 204, RING_IN = 150, RING_OUT = 192;
const SIN_LAT = Math.sin((LATITUDE * Math.PI) / 180);
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
// Angle of an hour line, measured clockwise from north, for a flat dial at this latitude.
const lineAngle = (h: number) => { const H = ((h - 12) * 15 * Math.PI) / 180; return Math.atan2(SIN_LAT * Math.sin(H), Math.cos(H)); };
const clock = (h: number) => { const m = Math.round(h * 60); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`; };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const today = () => (new Date().getDay() + 6) % 7;
const nowHours = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; };

const verdict = (d: number, h: number) => {
  const w = week[d];
  if (w.close <= w.open) return "Closed all day";
  if (h < w.open) return `Opens at ${clock(w.open)}`;
  if (h < w.close) return `Open until ${clock(w.close)}`;
  return `Closed since ${clock(w.close)}`;
};

export default function BronzeGardenSundialOpeningHours() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pad = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState(1);
  const selRef = useRef(1);
  const [view, setView] = useState<{ h: number; live: boolean; now: number; dark: boolean } | null>(null);
  const api = useRef<{ nudge: (by: number) => void; home: () => void; day: (d: number) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, hit = pad.current;
    if (!cv || !hit) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const S = Math.min(2, window.devicePixelRatio || 1) * 1.2;
    cv.width = Math.round(SIZE * S); cv.height = Math.round(SIZE * S);
    const hasConic = typeof ctx.createConicGradient === "function";
    let seed = 5; const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const layer = () => { const c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height; const g = c.getContext("2d"); if (g) g.scale(S, S); return [c, g] as const; };
    const pt = (a: number, r: number): [number, number] => [C + Math.sin(a) * r, C - Math.cos(a) * r];

    // Limestone plinth: speckle, pits and a turned groove, painted once.
    const [stone, sg] = layer();
    if (sg) {
      const base = sg.createRadialGradient(C, C, 40, C, C, PLINTH); base.addColorStop(0, "#e9e2d2"); base.addColorStop(0.8, "#d8cfbb"); base.addColorStop(1, "#c3b9a2");
      sg.beginPath(); sg.arc(C, C, PLINTH, 0, Math.PI * 2); sg.fillStyle = base; sg.fill(); sg.save(); sg.clip();
      for (let i = 0; i < 5200; i++) { const x = rand() * SIZE, y = rand() * SIZE, v = rand(); sg.fillStyle = v > 0.55 ? `rgba(255,252,240,${rand() * 0.35})` : `rgba(74,62,40,${rand() * 0.2})`; sg.fillRect(x, y, 0.6 + rand() * 1.2, 0.6 + rand() * 1.2); }
      for (let i = 0; i < 46; i++) { const a = rand() * 7, r = PLATE + 6 + rand() * 38, x = C + Math.cos(a) * r, y = C + Math.sin(a) * r, s = 0.8 + rand() * 1.8; sg.fillStyle = "rgba(60,48,30,0.38)"; sg.beginPath(); sg.ellipse(x, y, s * 1.4, s, a, 0, 7); sg.fill(); sg.fillStyle = "rgba(255,250,235,0.5)"; sg.beginPath(); sg.ellipse(x + 0.7, y + 0.8, s * 1.2, s * 0.5, a, 0, 7); sg.fill(); }
      // Lichen that has taken hold on the weather side.
      for (let i = 0; i < 26; i++) { const a = 3.4 + rand() * 1.6, r = PLATE + 10 + rand() * 34, x = C + Math.cos(a) * r, y = C + Math.sin(a) * r, s = 3 + rand() * 9; const l = sg.createRadialGradient(x, y, 0, x, y, s); l.addColorStop(0, `rgba(150,160,84,${0.14 + rand() * 0.16})`); l.addColorStop(1, "rgba(150,160,84,0)"); sg.fillStyle = l; sg.fillRect(x - s, y - s, s * 2, s * 2); }
      sg.restore();
      sg.lineWidth = 1.4; sg.strokeStyle = "rgba(70,56,34,0.4)"; sg.beginPath(); sg.arc(C, C, PLINTH - 16, 0, 7); sg.stroke();
      sg.lineWidth = 1; sg.strokeStyle = "rgba(255,252,240,0.7)"; sg.beginPath(); sg.arc(C, C, PLINTH - 14.6, 0, 7); sg.stroke();
    }

    // Everything cut into the bronze: lathe marks, hour lines, numerals, the motto and the weathering.
    const [cut, eg] = layer();
    if (eg) {
      eg.save(); eg.beginPath(); eg.arc(C, C, PLATE, 0, 7); eg.clip();
      for (let r = 2; r < PLATE; r += 0.62) { const v = rand(); eg.beginPath(); eg.arc(C, C, r, 0, 7); eg.lineWidth = 0.45 + rand() * 0.4; eg.strokeStyle = v > 0.5 ? `rgba(255,236,190,${(v - 0.5) * 0.2})` : `rgba(30,16,0,${(0.5 - v) * 0.24})`; eg.stroke(); }
      // Verdigris creeping in from the rim and pooling in the cuts.
      for (let i = 0; i < 150; i++) { const a = rand() * 7, r = 96 + Math.pow(rand(), 0.55) * 108, x = C + Math.cos(a) * r, y = C + Math.sin(a) * r, s = 5 + rand() * 20; const p = eg.createRadialGradient(x, y, 0, x, y, s); const al = (0.05 + rand() * 0.15) * (r > 186 ? 1.6 : 1); p.addColorStop(0, `rgba(72,150,128,${al})`); p.addColorStop(1, "rgba(72,150,128,0)"); eg.fillStyle = p; eg.fillRect(x - s, y - s, s * 2, s * 2); }
      for (let i = 0; i < 34; i++) { const a = rand() * 7, r = rand() * 196, x = C + Math.cos(a) * r, y = C + Math.sin(a) * r, s = 8 + rand() * 26; const p = eg.createRadialGradient(x, y, 0, x, y, s); p.addColorStop(0, `rgba(40,22,4,${0.06 + rand() * 0.1})`); p.addColorStop(1, "rgba(40,22,4,0)"); eg.fillStyle = p; eg.fillRect(x - s, y - s, s * 2, s * 2); }
      eg.restore();
      // A cut reads as a dark line with a bright lip beside it.
      const groove = (draw: () => void, w: number) => { eg.save(); eg.translate(0.9, 0.9); eg.lineWidth = w; eg.strokeStyle = "rgba(255,238,190,0.5)"; draw(); eg.restore(); eg.lineWidth = w; eg.strokeStyle = "rgba(38,20,2,0.82)"; draw(); };
      const ring = (r: number, w: number) => groove(() => { eg.beginPath(); eg.arc(C, C, r, 0, 7); eg.stroke(); }, w);
      const spoke = (a: number, r0: number, r1: number, w: number) => groove(() => { eg.beginPath(); eg.moveTo(...pt(a, r0)); eg.lineTo(...pt(a, r1)); eg.stroke(); }, w);
      ring(PLATE - 5, 1.6); ring(RING_OUT, 1.2); ring(RING_IN, 1.2); ring(52, 1.1); ring(46, 0.7);
      eg.lineCap = "round";
      for (let q = FIRST * 4; q <= LAST * 4; q++) {
        const h = q / 4, a = lineAngle(h);
        if (q % 4 === 0) spoke(a, 52, RING_IN, 1.25); else if (q % 2 === 0) spoke(a, RING_IN - 20, RING_IN, 0.9); else spoke(a, RING_IN - 8, RING_IN, 0.7);
      }
      const engrave = (text: string, a: number, r: number, turn: number, font: string) => {
        eg.save(); eg.translate(...pt(a, r)); eg.rotate(a + turn); eg.font = font; eg.textAlign = "center"; eg.textBaseline = "middle";
        eg.fillStyle = "rgba(255,238,190,0.5)"; eg.fillText(text, 0.8, 0.9); eg.fillStyle = "rgba(34,18,2,0.9)"; eg.fillText(text, 0, 0); eg.restore();
      };
      for (let h = FIRST; h <= LAST; h++) engrave(ROMAN[((h + 11) % 12) + 1], lineAngle(h), 171, 0, '600 17px Georgia, "Times New Roman", serif');
      const span = 1.5, start = Math.PI + span / 2;
      [...MOTTO].forEach((ch, i) => engrave(ch, start - (i / (MOTTO.length - 1)) * span, 171, Math.PI, '600 10.5px Georgia, "Times New Roman", serif'));
      // Three slotted bronze screws hold the plate to the stone.
      for (const a of [Math.PI + 1.05, Math.PI - 1.05]) {
        const [x, y] = pt(a, 171);
        const sc = eg.createRadialGradient(x - 1.5, y - 1.5, 0.5, x, y, 6); sc.addColorStop(0, "#f3dca0"); sc.addColorStop(0.6, "#9a7434"); sc.addColorStop(1, "#3d2a0e");
        eg.beginPath(); eg.arc(x, y, 5, 0, 7); eg.fillStyle = sc; eg.fill(); eg.lineWidth = 0.8; eg.strokeStyle = "rgba(30,16,0,0.8)"; eg.stroke();
        eg.lineWidth = 1.3; eg.beginPath(); eg.moveTo(x - 3.2, y - 1.6); eg.lineTo(x + 3.2, y + 1.6); eg.stroke();
      }
    }

    const bronze = (v: number) => { const t = clamp(v, 0, 1); const mix = (a: number, b: number, c: number) => (t < 0.5 ? a + (b - a) * t * 2 : b + (c - b) * (t - 0.5) * 2) | 0; return `rgb(${mix(70, 164, 248)},${mix(46, 118, 220)},${mix(18, 50, 150)})`; };
    const sheen = (angle: number, lo: number, hi: number) => {
      if (!hasConic) { const g = ctx.createLinearGradient(C - PLATE, C - PLATE, C + PLATE, C + PLATE); g.addColorStop(0, bronze(hi)); g.addColorStop(0.5, bronze(lo)); g.addColorStop(1, bronze(hi)); return g; }
      const g = ctx.createConicGradient(angle, C, C), m = (lo + hi) / 2;
      const stops: [number, number][] = [[0, hi], [0.05, hi - 0.06], [0.12, m + 0.08], [0.2, lo + 0.04], [0.29, lo], [0.38, m - 0.06], [0.46, hi - 0.2], [0.5, hi - 0.1], [0.55, hi - 0.24], [0.63, m - 0.04], [0.71, lo + 0.02], [0.8, lo + 0.08], [0.88, m], [0.95, hi - 0.08], [1, hi]];
      for (const [p, v] of stops) g.addColorStop(p, bronze(v));
      return g;
    };

    const s = { h: FIRST + 0.4, v: 0, goal: 12, open: 12, close: 12, scrub: false, back: 0 };
    const OFF = 3000;
    const soft = (color: string, blur: number, dx: number, dy: number, path: () => void) => { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur * S; ctx.shadowOffsetX = (OFF + dx) * S; ctx.shadowOffsetY = dy * S; ctx.translate(-OFF, 0); ctx.fillStyle = "#000"; path(); ctx.fill(); ctx.restore(); };

    const draw = (t: number) => {
      ctx.setTransform(S, 0, 0, S, 0, 0);
      ctx.clearRect(0, 0, SIZE, SIZE);
      const a = lineAngle(clamp(s.h, FIRST, LAST)), sx = Math.sin(a), sy = -Math.cos(a); // the way shadows fall
      const light = Math.atan2(-sy, -sx);

      // Plinth on the lawn.
      soft("rgba(2,12,6,0.7)", 26, sx * 16, sy * 16 + 8, () => { ctx.beginPath(); ctx.arc(C, C, PLINTH - 14, 0, 7); });
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(stone, 0, 0); ctx.setTransform(S, 0, 0, S, 0, 0);
      const edge = ctx.createLinearGradient(C - sx * PLINTH, C - sy * PLINTH, C + sx * PLINTH, C + sy * PLINTH);
      edge.addColorStop(0, "rgba(255,253,244,0.9)"); edge.addColorStop(0.45, "rgba(255,253,244,0)"); edge.addColorStop(0.6, "rgba(60,46,24,0)"); edge.addColorStop(1, "rgba(60,46,24,0.55)");
      ctx.lineWidth = 7; ctx.strokeStyle = edge; ctx.beginPath(); ctx.arc(C, C, PLINTH - 3.5, 0, 7); ctx.stroke();

      // The plate sits a few millimetres proud of the stone.
      soft("rgba(40,26,6,0.6)", 9, sx * 5, sy * 5, () => { ctx.beginPath(); ctx.arc(C, C, PLATE, 0, 7); });
      ctx.beginPath(); ctx.arc(C, C, PLATE, 0, 7); ctx.fillStyle = sheen(light + 0.4, 0.2, 0.86); ctx.fill();
      // Hours we are open are polished back to bright metal; the rest is left to darken.
      const band = (from: number, to: number, fill: string) => { if (to - from < 0.01) return; const a0 = lineAngle(from) - Math.PI / 2, a1 = lineAngle(to) - Math.PI / 2; ctx.beginPath(); ctx.arc(C, C, RING_OUT, a0, a1); ctx.arc(C, C, RING_IN, a1, a0, true); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
      band(FIRST - 0.5, s.open, "rgba(22,30,20,0.42)"); band(s.close, LAST + 0.5, "rgba(22,30,20,0.42)");
      ctx.save(); ctx.globalCompositeOperation = "lighter"; band(s.open, s.close, "rgba(120,92,30,0.5)"); ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(cut, 0, 0); ctx.setTransform(S, 0, 0, S, 0, 0);
      const rim = ctx.createLinearGradient(C - sx * PLATE, C - sy * PLATE, C + sx * PLATE, C + sy * PLATE);
      rim.addColorStop(0, "rgba(255,244,206,0.95)"); rim.addColorStop(0.4, "rgba(255,244,206,0.1)"); rim.addColorStop(1, "rgba(30,16,0,0.75)");
      ctx.lineWidth = 2.4; ctx.strokeStyle = rim; ctx.beginPath(); ctx.arc(C, C, PLATE - 1.2, 0, 7); ctx.stroke();

      // The gnomon is a fin that rises towards north; its shadow is the triangle it throws.
      const reach = 196, tip: [number, number] = [C + sx * reach, C + sy * reach], foot = 122;
      const fin = () => { ctx.beginPath(); ctx.moveTo(C - 3, C + 2); ctx.lineTo(C - 4, C - foot); ctx.lineTo(tip[0], tip[1]); ctx.lineTo(C + 4, C - foot); ctx.lineTo(C + 3, C + 2); ctx.closePath(); };
      ctx.save(); ctx.beginPath(); ctx.arc(C, C, PLINTH, 0, 7); ctx.clip();
      const beam = () => { fin(); const px = -sy * 4.5, py = sx * 4.5; ctx.moveTo(C + px, C + py); ctx.lineTo(tip[0] + px * 0.5, tip[1] + py * 0.5); ctx.lineTo(tip[0] - px * 0.5, tip[1] - py * 0.5); ctx.lineTo(C - px, C - py); ctx.closePath(); };
      const pass = reduce ? 0 : ((t + 6000) % 9000) / 4600, cloud = pass < 1 ? Math.sin(pass * Math.PI) : 0;
      const dim = 1 - 0.62 * cloud * Math.max(0, 1 - Math.abs(C - 420 + pass * 840 - (C + sx * 90)) / 260);
      soft(`rgba(22,12,0,${0.4 * dim})`, 10 + 8 * (1 - dim), 0, 0, beam); soft(`rgba(22,12,0,${0.72 * dim})`, 2 + 5 * (1 - dim), 0, 0, beam);
      ctx.restore();

      // Now and then a cloud crosses: a soft band of shade that also takes the edge off the shadow.
      if (cloud > 0.01) {
        const cx = C - 420 + pass * 840, band = ctx.createLinearGradient(cx - 190, 0, cx + 190, 0);
        band.addColorStop(0, "rgba(14,26,22,0)"); band.addColorStop(0.5, `rgba(14,26,22,${0.34 * cloud})`); band.addColorStop(1, "rgba(14,26,22,0)");
        ctx.save(); ctx.beginPath(); ctx.arc(C, C, PLINTH, 0, 7); ctx.clip(); ctx.fillStyle = band; ctx.fillRect(0, 0, SIZE, SIZE); ctx.restore();
      }

      // The fin itself, seen from above: two faces either side of a sharp top edge.
      const lit = clamp(-sx, -1, 1); // which face the sun is on
      ctx.beginPath(); ctx.moveTo(C - 4.5, C + 4); ctx.lineTo(C - 4.5, C - foot); ctx.lineTo(C, C - foot - 5); ctx.lineTo(C, C + 4); ctx.closePath(); ctx.fillStyle = bronze(0.46 + lit * 0.36); ctx.fill();
      ctx.beginPath(); ctx.moveTo(C + 4.5, C + 4); ctx.lineTo(C + 4.5, C - foot); ctx.lineTo(C, C - foot - 5); ctx.lineTo(C, C + 4); ctx.closePath(); ctx.fillStyle = bronze(0.46 - lit * 0.36); ctx.fill();
      ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(255,246,214,0.9)"; ctx.beginPath(); ctx.moveTo(C, C + 3); ctx.lineTo(C, C - foot - 4); ctx.stroke();
      ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(24,12,0,0.75)"; ctx.beginPath(); ctx.moveTo(C - 4.5, C + 4); ctx.lineTo(C - 4.5, C - foot); ctx.lineTo(C, C - foot - 5); ctx.lineTo(C + 4.5, C - foot); ctx.lineTo(C + 4.5, C + 4); ctx.closePath(); ctx.stroke();
    };

    let raf = 0, last = 0, t0 = 0, seen = true, shownStep = -1, shownLive = true, timer = 0;
    // After dark there is no shadow to read, so it rests on the next opening time.
    const resting = () => {
      const n = nowHours();
      if (n >= FIRST + 0.3 && n <= LAST - 0.3) return { h: n, dark: false };
      for (let k = n > 12 ? 1 : 0; k < 8; k++) { const w = week[(today() + k) % 7]; if (w.close > w.open) return { h: clamp(w.open, FIRST, LAST), dark: true }; }
      return { h: 12, dark: true };
    };
    const report = () => {
      const r = resting(), live = !s.scrub, h = live ? r.h : s.goal, stepNow = Math.round((live ? nowHours() : h) * (live ? 60 : 12));
      if (stepNow === shownStep && live === shownLive) return;
      shownStep = stepNow; shownLive = live;
      setView({ h: live ? nowHours() : Math.round(h * 12) / 12, live, now: nowHours(), dark: r.dark });
    };
    const settle = () => { const w = week[selRef.current], shut = w.close <= w.open; s.h = s.goal; s.v = 0; s.open = shut ? 12 : w.open; s.close = shut ? 12 : w.close; draw(0); };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (s.scrub && s.back && now > s.back) { s.scrub = false; s.back = 0; }
      if (!s.scrub) s.goal = resting().h;
      s.v += (58 * (s.goal - s.h) - 13 * s.v) * dt; s.h += s.v * dt;
      const w = week[selRef.current], shut = w.close <= w.open, k = Math.min(1, dt * 7);
      s.open += ((shut ? 12 : w.open) - s.open) * k; s.close += ((shut ? 12 : w.close) - s.close) * k;
      report(); draw(now - t0);
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const scrubTo = (h: number, hold: number) => { s.scrub = true; s.goal = clamp(h, FIRST, LAST); s.back = hold ? performance.now() + hold : 0; if (reduce) { settle(); report(); } else wake(); };

    api.current = {
      nudge: (by) => scrubTo((s.scrub ? s.goal : Math.round(resting().h * 4) / 4) + by, 9000),
      home: () => { s.scrub = false; s.back = 0; if (reduce) { s.goal = resting().h; settle(); report(); } else wake(); },
      day: () => { if (reduce) settle(); else wake(); },
    };
    selRef.current = today(); setSel(selRef.current);
    s.goal = resting().h;
    if (reduce) { settle(); report(); timer = window.setInterval(() => { if (!s.scrub) { s.goal = resting().h; settle(); } report(); }, 20000); } else wake();

    const hourAt = (e: PointerEvent) => {
      const b = hit.getBoundingClientRect(), x = e.clientX - (b.left + b.width / 2), y = e.clientY - (b.top + b.height / 2);
      if (Math.hypot(x, y) < b.width * 0.06) return null;
      const a = Math.atan2(x, -y);
      return 12 + (Math.atan2(Math.sin(a), Math.cos(a) * SIN_LAT) * 12) / Math.PI;
    };
    let down = false;
    const onDown = (e: PointerEvent) => { down = true; hit.setPointerCapture(e.pointerId); const h = hourAt(e); if (h !== null) scrubTo(h, 0); };
    const onMove = (e: PointerEvent) => { if (e.pointerType !== "mouse" && !down) return; const h = hourAt(e); if (h !== null) scrubTo(h, 0); };
    const onUp = () => { if (down) { down = false; s.back = performance.now() + 4500; } };
    const onLeave = () => { if (!down && s.scrub) s.back = performance.now() + 900; };
    hit.addEventListener("pointerdown", onDown); hit.addEventListener("pointermove", onMove);
    hit.addEventListener("pointerup", onUp); hit.addEventListener("pointercancel", onUp); hit.addEventListener("pointerleave", onLeave);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); window.clearInterval(timer); api.current = null;
      hit.removeEventListener("pointerdown", onDown); hit.removeEventListener("pointermove", onMove);
      hit.removeEventListener("pointerup", onUp); hit.removeEventListener("pointercancel", onUp); hit.removeEventListener("pointerleave", onLeave);
      io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const pick = (d: number) => { selRef.current = d; setSel(d); api.current?.day(d); };
  const onKey = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); api.current?.nudge(0.25); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); api.current?.nudge(-0.25); }
    else if (e.key === "Home" || e.key === "Escape") { e.preventDefault(); api.current?.home(); }
  };
  const h = view ? view.h : 12;
  const status = view ? verdict(sel, h) : "";
  const lead = !view ? "Reading the light" : view.live ? `Now ${clock(view.now)}` : `At ${clock(h)}`;

  return (
    <div className="flex min-h-[700px] w-full flex-col items-center justify-center bg-[#1f3a2b] bg-[radial-gradient(80%_60%_at_50%_38%,#2f5540_0%,#1f3a2b_60%,#172d21_100%)] px-4 py-10 sm:min-h-[820px]">
      <div
        ref={pad}
        role="slider"
        tabIndex={0}
        aria-label={`Time of day on the ${PLACE} sundial`}
        aria-valuemin={FIRST}
        aria-valuemax={LAST}
        aria-valuenow={Math.round(clamp(h, FIRST, LAST) * 4) / 4}
        aria-valuetext={`${week[sel].day} ${clock(h)}, ${status}`}
        onKeyDown={onKey}
        className="relative aspect-square w-full max-w-[330px] cursor-crosshair touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-4 focus-visible:ring-offset-[#1f3a2b] sm:max-w-[560px]"
      >
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      </div>
      <p className="mt-7 min-h-[40px] max-w-[340px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-emerald-100/80 sm:max-w-none">
        <span className="tabular-nums text-white">{week[sel].day} / {lead}</span>
        <span className="mx-2 text-emerald-200/50">/</span>
        {status}
        {view && view.live && view.dark ? <span className="block text-emerald-100/70">The sun is down, so the shadow waits on opening time</span> : null}
      </p>
      <div role="group" aria-label={`${PLACE} opening hours by day`} className="mt-4 flex w-full max-w-[340px] justify-between sm:max-w-[470px]">
        {week.map((w, i) => (
          <button
            key={w.day}
            type="button"
            aria-pressed={sel === i}
            aria-label={`${w.day}, ${w.close > w.open ? `${clock(w.open)} to ${clock(w.close)}` : "closed"}`}
            onClick={() => pick(i)}
            className={`flex h-12 w-11 flex-col items-center justify-center rounded-lg font-mono text-[10px] uppercase tracking-[0.1em] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-amber-200 motion-reduce:transition-none sm:w-14 sm:text-[11px] ${sel === i ? "bg-[#e9dcb4] text-[#1c2f22]" : "text-emerald-100/80 hover:bg-white/10 hover:text-white"}`}
          >
            <span className="font-semibold">{w.day}</span>
            <span className="tabular-nums">{w.close > w.open ? `${Math.floor(w.open)}-${Math.floor(w.close)}` : "shut"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

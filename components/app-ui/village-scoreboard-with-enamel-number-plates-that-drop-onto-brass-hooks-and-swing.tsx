import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here.
const sides = ["Home", "Visitors"]; // painted above each pair of plates
const START = { scores: [12, 9], period: 2 }; // what hangs on the board at load
const PERIODS = 4; // the small red plate counts 1 to this, then starts again
const PAINT = ["#1f4d3b", "#173b2d"]; // board colour: lit and shaded
const ENAMEL = ["#fbf6e8", "#17191c"]; // plate and numeral
const ACCENT = ["#c2311f", "#fff6e4"]; // period plate and its numeral
const DEMO = true; // score by itself until a visitor does

type Slot = { x: number; y: number; w: number; h: number; red?: boolean };
const layoutFor = (narrow: boolean) =>
  narrow
    ? { W: 380, H: 560, plank: 62, labels: [{ x: 143, y: 64 }, { x: 143, y: 300 }], minor: { x: 310, y: 196 }, big: 21,
        slots: [{ x: 96, y: 96, w: 84, h: 114 }, { x: 190, y: 96, w: 84, h: 114 }, { x: 96, y: 332, w: 84, h: 114 }, { x: 190, y: 332, w: 84, h: 114 }, { x: 310, y: 226, w: 56, h: 76, red: true }] as Slot[] }
    : { W: 900, H: 384, plank: 75, labels: [{ x: 219, y: 82 }, { x: 681, y: 82 }], minor: { x: 450, y: 150 }, big: 30,
        slots: [{ x: 150, y: 132, w: 124, h: 168 }, { x: 288, y: 132, w: 124, h: 168 }, { x: 612, y: 132, w: 124, h: 168 }, { x: 750, y: 132, w: 124, h: 168 }, { x: 450, y: 184, w: 76, h: 104, red: true }] as Slot[] };
const PAD = { x: 36, top: 34, bottom: 78 }; // room round the board for its shadow and for plates that fall away
const TAU = Math.PI * 2;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;
const digitsOf = (scores: number[], period: number) => [Math.floor(scores[0] / 10) % 10, scores[0] % 10, Math.floor(scores[1] / 10) % 10, scores[1] % 10, period];

export default function VillageScoreboard() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [scores, setScores] = useState(START.scores);
  const [period, setPeriod] = useState(START.period);
  const live = useRef({ scores: START.scores, period: START.period });
  const api = useRef<{ show: (digits: number[]) => void; quiet: () => void } | null>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < 760));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const L = layoutFor(narrow), CW = L.W + PAD.x * 2, CH = L.H + PAD.top + PAD.bottom;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let k = 1, seed = 3;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };

    // One hanging plate per hook, plus the plates that have been lifted off and are falling away.
    const first = digitsOf(live.current.scores, live.current.period);
    const hung = L.slots.map((_, i) => ({ digit: first[i], a: reduce ? 0 : (i % 2 ? -0.05 : 0.06), v: 0, drop: 0, dropV: 0, chips: i * 7 + 1 }));
    const loose: { slot: number; digit: number; x: number; y: number; vx: number; vy: number; a: number; va: number; chips: number }[] = [];
    const S = { auto: DEMO && !reduce, born: performance.now(), step: 0, gust: 0 };

    // Each numeral plate is painted once per digit and reused: enamel, rim, chips, gloss.
    const stock = new Map<string, HTMLCanvasElement>();
    const plate = (digit: number, slot: Slot, chips: number) => {
      const key = `${digit}/${slot.w}/${slot.red ? 1 : 0}/${chips % 5}`;
      const have = stock.get(key);
      if (have) return have;
      const c = document.createElement("canvas"), m = 4, w = slot.w, h = slot.h;
      c.width = Math.ceil((w + m * 2) * k); c.height = Math.ceil((h + m * 2) * k);
      const p = c.getContext("2d");
      if (!p) return c;
      p.setTransform(k, 0, 0, k, m * k, m * k);
      const [base, ink] = slot.red ? ACCENT : ENAMEL, r = w * 0.07;
      rr(p, 0, 0, w, h, r); p.fillStyle = "#2a1b12"; p.fill(); // the steel shows at the very edge
      rr(p, 0.7, 0.7, w - 1.4, h - 1.4, r); p.fillStyle = base; p.fill();
      p.save(); rr(p, 0.7, 0.7, w - 1.4, h - 1.4, r); p.clip();
      const dome = p.createLinearGradient(0, 0, w * 0.6, h);
      dome.addColorStop(0, "rgba(255,255,255,0.3)"); dome.addColorStop(0.4, "rgba(255,255,255,0)"); dome.addColorStop(1, "rgba(60,40,10,0.24)");
      p.fillStyle = dome; p.fillRect(0, 0, w, h);
      // Rolled edge: dark where the enamel thins, bright where it catches the light.
      rr(p, 3.2, 3.2, w - 6.4, h - 6.4, r * 0.7); p.lineWidth = 1.5; p.strokeStyle = slot.red ? "rgba(255,240,220,0.75)" : ink; p.stroke();
      rr(p, 1.2, 1.2, w - 2.4, h - 2.4, r); p.lineWidth = 1.4; p.strokeStyle = "rgba(255,255,255,0.55)"; p.stroke();
      p.fillStyle = ink; p.textAlign = "center"; p.textBaseline = "alphabetic";
      p.font = `800 ${h * 0.76}px "Arial Narrow", "Helvetica Neue", Helvetica, Arial, sans-serif`;
      const met = p.measureText(String(digit)), th = met.actualBoundingBoxAscent;
      p.save(); p.translate(w / 2, h * 0.56 + th / 2); p.scale(Math.min(1, (w * 0.7) / met.width), 1); p.fillText(String(digit), 0, 0); p.restore();
      // Chips and rust where years of hooks and stacking have knocked the enamel off.
      let s2 = chips * 977 + digit * 131 + 11;
      const rnd = () => { s2 = (s2 * 16807) % 2147483647; return s2 / 2147483647; };
      for (let i = 0; i < 5; i++) {
        const edge = Math.floor(rnd() * 4), t = rnd(), cx = edge % 2 ? (edge === 1 ? w - 1 : 1) : t * w, cy = edge % 2 ? t * h : edge === 0 ? 1 : h - 1, size = 1.6 + rnd() * 3.4;
        p.beginPath(); for (let j = 0; j < 7; j++) { const a = (j / 7) * TAU, d = size * (0.6 + rnd() * 0.7); p.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); } p.closePath();
        p.fillStyle = "#3a2416"; p.fill(); p.lineWidth = 0.7; p.strokeStyle = "rgba(150,80,30,0.7)"; p.stroke();
      }
      for (let i = 0; i < 260; i++) { p.fillStyle = rnd() > 0.5 ? "rgba(255,255,255,0.1)" : "rgba(70,50,20,0.07)"; p.fillRect(rnd() * w, rnd() * h, 0.8, 0.8); }
      // Gloss: a soft window across the top corner.
      const gloss = p.createLinearGradient(0, 0, w * 0.9, h * 0.62);
      gloss.addColorStop(0, "rgba(255,255,255,0.5)"); gloss.addColorStop(0.3, "rgba(255,255,255,0.16)"); gloss.addColorStop(0.32, "rgba(255,255,255,0.03)"); gloss.addColorStop(1, "rgba(255,255,255,0)");
      p.fillStyle = gloss; p.fillRect(0, 0, w, h);
      p.restore();
      // The punched hole with its ring of bare, darkened steel.
      const hy = h * 0.085;
      p.beginPath(); p.arc(w / 2, hy, w * 0.058, 0, TAU); p.fillStyle = "#3a2416"; p.fill();
      p.globalCompositeOperation = "destination-out"; p.beginPath(); p.arc(w / 2, hy, w * 0.04, 0, TAU); p.fill(); p.globalCompositeOperation = "source-over";
      stock.set(key, c);
      return c;
    };

    // The board itself: frame, painted boards, lettering and the screw end of each hook.
    const board = document.createElement("canvas");
    const paintBoard = () => {
      board.width = cv.width; board.height = cv.height; stock.clear(); seed = 3;
      const b = board.getContext("2d");
      if (!b) return;
      b.setTransform(k, 0, 0, k, PAD.x * k, PAD.top * k);
      b.save(); b.shadowColor = "rgba(40,30,15,0.42)"; b.shadowBlur = 26 * k; b.shadowOffsetX = 8 * k; b.shadowOffsetY = 18 * k; rr(b, 0, 0, L.W, L.H, 5); b.fillStyle = "#e9e1cf"; b.fill(); b.restore();
      b.save(); b.shadowColor = "rgba(30,20,10,0.5)"; b.shadowBlur = 4 * k; b.shadowOffsetY = 3 * k; rr(b, 0, 0, L.W, L.H, 5); b.fill(); b.restore();
      // Mitred frame: each side takes the light differently.
      const F = 15;
      const side = (pts: number[], col: string) => { b.beginPath(); b.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) b.lineTo(pts[i], pts[i + 1]); b.closePath(); b.fillStyle = col; b.fill(); };
      side([0, 0, L.W, 0, L.W - F, F, F, F], "#fffaf0"); side([0, 0, F, F, F, L.H - F, 0, L.H], "#f3ecdc");
      side([L.W, 0, L.W, L.H, L.W - F, L.H - F, L.W - F, F], "#d6cdb8"); side([0, L.H, F, L.H - F, L.W - F, L.H - F, L.W, L.H], "#c3b9a2");
      b.lineWidth = 0.6; b.strokeStyle = "rgba(90,70,40,0.5)";
      for (const [x0, y0, x1, y1] of [[0, 0, F, F], [L.W, 0, L.W - F, F], [0, L.H, F, L.H - F], [L.W, L.H, L.W - F, L.H - F]]) { b.beginPath(); b.moveTo(x0, y0); b.lineTo(x1, y1); b.stroke(); }
      // Painted tongue-and-groove boards.
      b.save(); b.beginPath(); b.rect(F, F, L.W - F * 2, L.H - F * 2); b.clip();
      const wash = b.createLinearGradient(0, 0, L.W, L.H);
      wash.addColorStop(0, PAINT[0]); wash.addColorStop(1, PAINT[1]);
      b.fillStyle = wash; b.fillRect(0, 0, L.W, L.H);
      for (let x = F; x < L.W; x += L.plank) {
        b.fillStyle = `rgba(${rand() > 0.5 ? "255,255,255" : "0,0,0"},${0.02 + rand() * 0.05})`; b.fillRect(x, 0, L.plank, L.H);
        for (let i = 0; i < 26; i++) {
          const gx = x + rand() * L.plank, sway = (rand() - 0.5) * 7, y0 = rand() * L.H, len = 60 + rand() * 260;
          b.beginPath(); b.moveTo(gx, y0); b.bezierCurveTo(gx + sway, y0 + len * 0.3, gx - sway, y0 + len * 0.7, gx + sway * 0.4, y0 + len);
          b.lineWidth = 0.5 + rand() * 0.7; b.strokeStyle = rand() > 0.45 ? `rgba(0,0,0,${0.05 + rand() * 0.1})` : `rgba(255,255,255,${0.03 + rand() * 0.05})`; b.stroke();
        }
        b.fillStyle = "rgba(0,0,0,0.5)"; b.fillRect(x - 1.1, 0, 1.6, L.H); b.fillStyle = "rgba(255,255,255,0.13)"; b.fillRect(x + 0.5, 0, 1, L.H);
      }
      const sun = b.createLinearGradient(0, 0, L.W * 0.75, L.H);
      sun.addColorStop(0, "rgba(255,250,220,0.16)"); sun.addColorStop(0.45, "rgba(255,250,220,0.03)"); sun.addColorStop(1, "rgba(0,0,0,0.18)");
      b.fillStyle = sun; b.fillRect(0, 0, L.W, L.H);
      const inset = b.createLinearGradient(0, F, 0, F + 16); inset.addColorStop(0, "rgba(0,0,0,0.4)"); inset.addColorStop(1, "rgba(0,0,0,0)");
      b.fillStyle = inset; b.fillRect(F, F, L.W, 16);
      const insetL = b.createLinearGradient(F, 0, F + 12, 0); insetL.addColorStop(0, "rgba(0,0,0,0.3)"); insetL.addColorStop(1, "rgba(0,0,0,0)");
      b.fillStyle = insetL; b.fillRect(F, F, 12, L.H);
      // Signwriter's lettering, slightly thin where the brush ran dry.
      const letter = (text: string, x: number, y: number, size: number) => {
        b.font = `700 ${size}px Georgia, "Times New Roman", serif`; b.textBaseline = "middle"; b.textAlign = "left";
        const gap = size * 0.2, chars = [...text.toUpperCase()], widths = chars.map((ch) => b.measureText(ch).width + gap);
        let at = x - (widths.reduce((a, c) => a + c, 0) - gap) / 2;
        chars.forEach((ch, i) => { b.fillStyle = "rgba(0,0,0,0.3)"; b.fillText(ch, at + 0.8, y + 1.2); b.fillStyle = `rgba(250,244,228,${0.86 + rand() * 0.12})`; b.fillText(ch, at, y); at += widths[i]; });
        return at - x;
      };
      sides.forEach((name, i) => {
        const half = letter(name, L.labels[i].x, L.labels[i].y, L.big);
        b.fillStyle = "rgba(250,244,228,0.75)"; b.fillRect(L.labels[i].x - half, L.labels[i].y + L.big * 0.78, half * 2, 1.6);
      });
      letter("Period", L.minor.x, L.minor.y, L.big * 0.5);
      b.restore();
      // Brass screw plates the hooks grow out of.
      for (const s of L.slots) {
        const r = s.w * 0.062, y = s.y - s.h * 0.1;
        b.beginPath(); b.arc(s.x + 1, y + 2, r + 1, 0, TAU); b.fillStyle = "rgba(0,0,0,0.45)"; b.fill();
        const g = b.createRadialGradient(s.x - r * 0.4, y - r * 0.4, 0.5, s.x, y, r);
        g.addColorStop(0, "#fff1b8"); g.addColorStop(0.5, "#c99a3a"); g.addColorStop(1, "#6e4c14");
        b.beginPath(); b.arc(s.x, y, r, 0, TAU); b.fillStyle = g; b.fill();
        b.beginPath(); b.moveTo(s.x, y); b.lineTo(s.x, s.y); b.lineWidth = s.w * 0.05; b.lineCap = "round"; b.strokeStyle = "#8a6520"; b.stroke();
      }
    };

    const drawPlate = (slot: Slot, digit: number, chips: number, x: number, y: number, a: number, fade: number) => {
      const img = plate(digit, slot, chips), m = 4, hy = slot.h * 0.085, away = Math.min(1, Math.abs(a) * 3 + (1 - fade));
      ctx.save(); ctx.globalAlpha = fade; ctx.translate(x, y); ctx.rotate(a);
      ctx.shadowColor = "rgba(8,20,14,0.5)"; ctx.shadowBlur = (7 + away * 10) * k; ctx.shadowOffsetX = (4 + away * 6) * k; ctx.shadowOffsetY = (7 + away * 8) * k;
      ctx.drawImage(img, -slot.w / 2 - m, -hy - m, slot.w + m * 2, slot.h + m * 2);
      ctx.restore();
    };
    const drawHook = (s: Slot) => {
      // The upturned end of the cup hook, in front of the plate.
      const w = s.w * 0.052, g = ctx.createLinearGradient(s.x - w, 0, s.x + w, 0);
      g.addColorStop(0, "#7a5618"); g.addColorStop(0.35, "#ffe9a3"); g.addColorStop(0.6, "#c6953a"); g.addColorStop(1, "#5d4010");
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 2 * k; ctx.shadowOffsetX = 1.5 * k; ctx.shadowOffsetY = 2 * k;
      ctx.beginPath(); ctx.moveTo(s.x, s.y + s.w * 0.02); ctx.lineTo(s.x, s.y - s.h * 0.06); ctx.lineWidth = w * 2; ctx.lineCap = "round"; ctx.strokeStyle = g; ctx.stroke(); ctx.restore();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(board, 0, 0);
      ctx.setTransform(k, 0, 0, k, PAD.x * k, PAD.top * k);
      L.slots.forEach((s, i) => { const h = hung[i]; drawPlate(s, h.digit, h.chips, s.x, s.y + h.drop, h.a, 1); if (h.drop > -4) drawHook(s); });
      for (const f of loose) drawPlate(L.slots[f.slot], f.digit, f.chips, f.x, f.y, f.a, Math.max(0, Math.min(1, (L.H + PAD.bottom - 20 - f.y) / 60)));
    };

    let raf = 0, last = performance.now(), seen = true;
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (S.auto) {
        const due = Math.floor(((now - S.born) / 1000 - 0.4) / 3.4);
        if (due > S.step) { S.step = due; const who = due % 2 ? 0 : 1, next = live.current.scores.map((v, i) => (i === who ? (v + 1) % 100 : v)); live.current = { ...live.current, scores: next }; setScores(next); api.current?.show(digitsOf(next, live.current.period)); }
      }
      // A breath of wind now and then keeps the plates from ever hanging dead still.
      if (now > S.gust) { S.gust = now + 1500 + rand() * 1800; const push = (rand() - 0.5) * 0.5; hung.forEach((h, i) => { h.v += push * (0.6 + ((i * 37) % 10) / 14); }); }
      for (const h of hung) {
        for (let i = 0; i < 2; i++) { const st = dt / 2; h.v += (-58 * Math.sin(h.a) - 1.5 * h.v) * st; h.a += h.v * st; }
        if (h.drop < 0 || h.dropV !== 0) {
          h.dropV += 2600 * dt; h.drop += h.dropV * dt;
          if (h.drop >= 0) { h.drop = 0; if (h.dropV > 160) { h.dropV = -h.dropV * 0.22; h.drop = -0.01; } else h.dropV = 0; }
        }
      }
      for (let i = loose.length - 1; i >= 0; i--) { const f = loose[i]; f.vy += 2200 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.a += f.va * dt; if (f.y > L.H + PAD.bottom + 40) loose.splice(i, 1); }
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!reduce && !raf && seen && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    api.current = {
      quiet: () => { S.auto = false; },
      show: (digits) => {
        digits.forEach((d, i) => {
          const h = hung[i], s = L.slots[i];
          if (h.digit === d) return;
          if (!reduce) {
            // The old plate is flicked off its hook and falls; the new one drops on and swings.
            const dir = i % 2 ? 1 : -1;
            loose.push({ slot: i, digit: h.digit, x: s.x, y: s.y, vx: dir * (30 + rand() * 50), vy: -260, a: h.a, va: dir * (1.2 + rand() * 1.6), chips: h.chips });
            h.drop = -(s.y + s.h + PAD.top); h.dropV = 300; h.a = dir * 0.1; h.v = -dir * (1.6 + rand() * 1.2);
          }
          h.digit = d; h.chips += 3;
        });
        if (reduce) draw(); else wake();
      },
    };

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * CW - PAD.x, y = ((e.clientY - r.top) / r.height) * CH - PAD.top;
      L.slots.forEach((s, i) => { if (Math.abs(x - s.x) < s.w / 2 && y > s.y && y < s.y + s.h) hung[i].v += Math.max(-0.5, Math.min(0.5, e.movementX * 0.035)); });
      wake();
    };
    const size = () => {
      const w = cv.clientWidth;
      if (!w) return;
      k = (w / CW) * Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(CW * k); cv.height = Math.round(CH * k);
      paintBoard(); draw(); wake();
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
  }, [narrow]);

  const L = layoutFor(narrow), CW = L.W + PAD.x * 2, CH = L.H + PAD.top + PAD.bottom;
  const put = (nextScores: number[], nextPeriod: number) => {
    api.current?.quiet();
    live.current = { scores: nextScores, period: nextPeriod };
    setScores(nextScores); setPeriod(nextPeriod);
    api.current?.show(digitsOf(nextScores, nextPeriod));
  };
  const over = (a: Slot, b: Slot) => ({ left: pct(PAD.x + a.x - a.w / 2 - 6, CW), top: pct(PAD.top + a.y - a.h * 0.16, CH), width: pct(b.x - a.x + a.w + 12, CW), height: pct(a.h * 1.16, CH) });
  const ring = "absolute cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f4d3b]";
  const two = (n: number) => String(n).padStart(2, "0");

  return (
    <div ref={stage} className="flex min-h-[720px] w-full flex-col items-center justify-center bg-[#ddd5c4] bg-[radial-gradient(80%_70%_at_40%_30%,#efe9db_0%,#ddd5c4_55%,#c9bfaa_100%)] px-2 py-8">
      <div className="relative w-full" style={{ maxWidth: narrow ? 440 : 1010, aspectRatio: `${CW} / ${CH}` }}>
        <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
        {sides.map((name, i) => (
          <button
            key={name}
            type="button"
            aria-label={`Add a point for ${name}. Score ${scores[i]}`}
            onClick={() => put(scores.map((v, j) => (j === i ? (v + 1) % 100 : v)), period)}
            style={over(L.slots[i * 2], L.slots[i * 2 + 1])}
            className={ring}
          />
        ))}
        <button type="button" aria-label={`Next period. Now period ${period}`} onClick={() => put(scores, (period % PERIODS) + 1)} style={over(L.slots[4], L.slots[4])} className={ring} />
      </div>
      <div className="relative z-10 -mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-2">
        <p aria-live="polite" className="text-center font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-stone-600">
          <span className="font-semibold text-stone-900">{sides[0]} {two(scores[0])}</span>
          <span className="mx-2 text-stone-400">/</span>
          <span className="font-semibold text-stone-900">{sides[1]} {two(scores[1])}</span>
          <span className="mx-2 text-stone-400">/</span>
          Period {period}
        </p>
        <button
          type="button"
          onClick={() => put([0, 0], 1)}
          className="min-h-[40px] rounded-full border border-stone-500/50 px-4 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-800 outline-none transition-colors hover:bg-stone-900/5 focus-visible:ring-2 focus-visible:ring-stone-800 motion-reduce:transition-none"
        >
          Clear the board
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// The lengths on offer. `pearls` is how many show in front of the neck; the longest entry sets the size of the strand.
const lengths = [
  { label: "Choker", size: "40 cm", pearls: 12, price: "£640" },
  { label: "Princess", size: "45 cm", pearls: 16, price: "£820" },
  { label: "Matinee", size: "58 cm", pearls: 22, price: "£1,080" },
  { label: "Opera", size: "76 cm", pearls: 28, price: "£1,460" },
];
const strand = { name: "Akoya strand", detail: "Hand knotted on silk" };
const START = 2; // which length is on the bust at load
const VW = 520, VH = 470; // drawing space; the canvas scales this to its width

export default function PearlNecklaceLengthPicker() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const [pick, setPick] = useState(START);
  const pickRef = useRef(START);
  const api = useRef<{ go: (i: number, fromUser: boolean) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, pad = hit.current;
    if (!cv || !pad) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scale = 1;

    const CX = VW / 2, BY = 408, NW = 58, AY = -286; // bust centre, its base line, half the neck width, where the strand leaves the neck
    const NMAX = Math.max(...lengths.map((l) => l.pearls)) + 2, MID = (NMAX - 1) / 2;
    // graduated: the largest pearl hangs at the centre
    const rad = Array.from({ length: NMAX }, (_, i) => 7.2 + 4.2 * Math.pow(1 - Math.abs(i - MID) / (MID + 1), 1.4));
    const rest = Array.from({ length: NMAX - 1 }, (_, i) => rad[i] + rad[i + 1] + 0.9);
    const px = new Float32Array(NMAX), py = new Float32Array(NMAX), ox = new Float32Array(NMAX), oy = new Float32Array(NMAX);
    const s = { n: lengths[START].pearls, lx: -0.3, ly: -0.2, lxTo: -0.3, lyTo: -0.2, grab: -1, gx: 0, gy: 0, t: 0, wind: 0 };

    const grainCv = document.createElement("canvas"); grainCv.width = grainCv.height = 128;
    const gx = grainCv.getContext("2d");
    if (gx) {
      let seed = 3; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 9000; i++) { const v = rnd(); gx.fillStyle = v > 0.55 ? `rgba(255,255,255,${(v - 0.55) * 0.3})` : `rgba(0,0,0,${(0.55 - v) * 0.4})`; gx.fillRect(rnd() * 128, rnd() * 128, 0.6 + rnd() * 0.7, 0.6 + rnd() * 0.7); }
    }
    const grain = ctx.createPattern(grainCv, "repeat");

    const bust = () => {
      ctx.beginPath(); ctx.moveTo(-NW, -344);
      ctx.bezierCurveTo(-NW, -288, -NW - 2, -264, -102, -242); ctx.bezierCurveTo(-154, -224, -190, -198, -194, -150);
      ctx.bezierCurveTo(-198, -100, -152, -30, -130, 4); ctx.bezierCurveTo(-70, 24, 70, 24, 130, 4);
      ctx.bezierCurveTo(152, -30, 198, -100, 194, -150); ctx.bezierCurveTo(190, -198, 154, -224, 102, -242);
      ctx.bezierCurveTo(NW + 2, -264, NW, -288, NW, -344); ctx.bezierCurveTo(NW, -362, -NW, -362, -NW, -344); ctx.closePath();
    };

    // which pearls are in front of the neck, and how far the next one has been fed round
    const span = () => { const h = s.n / 2, lo = Math.floor(MID - h) + 1, hi = Math.ceil(MID + h) - 1; return { lo, hi, fl: lo - (MID - h), fr: MID + h - hi }; };

    const step = (dt: number) => {
      const { lo, hi, fl, fr } = span();
      for (let i = 0; i < NMAX; i++) {
        if (i < lo) { px[i] = ox[i] = -NW; py[i] = oy[i] = AY; continue; }
        if (i > hi) { px[i] = ox[i] = NW; py[i] = oy[i] = AY; continue; }
        if (i === s.grab) continue;
        // the bust leans back, so the pearls ride on velvet: gravity is softened and motion dies away quickly
        const vx = (px[i] - ox[i]) * 0.986, vy = (py[i] - oy[i]) * 0.986;
        ox[i] = px[i]; oy[i] = py[i];
        px[i] += vx + s.wind * dt * dt; py[i] += vy + 1500 * dt * dt;
      }
      if (s.grab >= lo && s.grab <= hi) {
        // you cannot pull a pearl further than the strand on either side of it allows
        let tx = s.gx, ty = Math.max(AY - 6, s.gy), reachL = rest[Math.max(0, lo - 1)] * fl, reachR = rest[Math.min(NMAX - 2, hi)] * fr;
        for (let i = lo; i < s.grab; i++) reachL += rest[i];
        for (let i = s.grab; i < hi; i++) reachR += rest[i];
        for (let k = 0; k < 4; k++) {
          let d = Math.hypot(tx + NW, ty - AY); if (d > reachL) { tx = -NW + ((tx + NW) * reachL) / d; ty = AY + ((ty - AY) * reachL) / d; }
          d = Math.hypot(tx - NW, ty - AY); if (d > reachR) { tx = NW + ((tx - NW) * reachR) / d; ty = AY + ((ty - AY) * reachR) / d; }
        }
        ox[s.grab] = px[s.grab]; oy[s.grab] = py[s.grab]; px[s.grab] += (tx - px[s.grab]) * 0.5; py[s.grab] += (ty - py[s.grab]) * 0.5;
      }
      for (let it = 0; it < 18; it++) {
        for (let i = Math.max(0, lo - 1); i <= Math.min(NMAX - 2, hi); i++) {
          const j = i + 1, want = rest[i] * (i === lo - 1 ? fl : i === hi ? fr : 1);
          const dx = px[j] - px[i], dy = py[j] - py[i], d = Math.hypot(dx, dy) || 0.001, k = (d - want) / d;
          const fi = i < lo || i === s.grab ? 0 : 1, fj = j > hi || j === s.grab ? 0 : 1, sum = fi + fj;
          if (!sum) continue;
          px[i] += dx * k * (fi / sum); py[i] += dy * k * (fi / sum); px[j] -= dx * k * (fj / sum); py[j] -= dy * k * (fj / sum);
        }
        if (it % 3 === 0) {
          // pearls are solid: two that are not neighbours still cannot share a place
          for (let i = lo; i <= hi; i++) for (let j = i + 2; j <= hi; j++) {
            const dx = px[j] - px[i], dy = py[j] - py[i], min = rad[i] + rad[j];
            if (Math.abs(dx) >= min || Math.abs(dy) >= min) continue;
            const d = Math.hypot(dx, dy) || 0.001; if (d >= min) continue;
            const k = ((min - d) / d) * 0.5, fi = i === s.grab ? 0 : 1, fj = j === s.grab ? 0 : 1;
            px[i] -= dx * k * fi; py[i] -= dy * k * fi; px[j] += dx * k * fj; py[j] += dy * k * fj;
          }
        }
      }
    };
    const relax = () => {
      const { lo, hi } = span();
      for (let i = 0; i < NMAX; i++) { const u = Math.max(0, Math.min(1, (i - lo + 1) / (hi - lo + 2))); px[i] = ox[i] = -NW + 2 * NW * u; py[i] = oy[i] = AY + Math.sin(u * Math.PI) * s.n * 8; }
      for (let k = 0; k < 500; k++) step(1 / 120);
      for (let i = 0; i < NMAX; i++) { ox[i] = px[i]; oy[i] = py[i]; }
    };

    const pearl = (x: number, y: number, r: number) => {
      const hx = x + (-0.34 + s.lx * 0.3) * r, hy = y + (-0.4 + s.ly * 0.22) * r;
      // body: nacre is brightest under the lamp and falls to a warm grey before the edge
      let g = ctx.createRadialGradient(hx, hy, r * 0.05, x, y, r);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.2, "#fdf8f1"); g.addColorStop(0.5, "#efe5da"); g.addColorStop(0.78, "#c9b9ad"); g.addColorStop(0.93, "#93857f"); g.addColorStop(1, "#6f6463");
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fillStyle = g; ctx.fill();
      ctx.save(); ctx.clip();
      // the dark velvet mirrored in the lower half, then light coming back up off it along the rim
      g = ctx.createLinearGradient(x, y - r * 0.1, x, y + r);
      g.addColorStop(0, "rgba(34,28,36,0)"); g.addColorStop(0.55, "rgba(34,28,36,0.3)"); g.addColorStop(0.8, "rgba(34,28,36,0.16)"); g.addColorStop(1, "rgba(255,238,230,0.5)");
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      // orient: the rose and green that float on a good pearl
      g = ctx.createRadialGradient(x - r * 0.5, y - r * 0.1, 0, x - r * 0.5, y - r * 0.1, r * 1.1);
      g.addColorStop(0, "rgba(255,170,190,0.2)"); g.addColorStop(1, "rgba(255,170,190,0)");
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      g = ctx.createRadialGradient(x + r * 0.55, y + r * 0.2, 0, x + r * 0.55, y + r * 0.2, r);
      g.addColorStop(0, "rgba(150,230,210,0.2)"); g.addColorStop(1, "rgba(150,230,210,0)");
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();
      // the lamp itself, soft edged because nacre is not glass
      g = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 0.34);
      g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.45, "rgba(255,255,255,0.8)"); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, r * 0.34, 0, 6.3); ctx.fill();
    };

    const draw = () => {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, VW, VH);
      ctx.translate(CX, BY);
      // shadow of the bust on the table
      ctx.save(); ctx.translate(-s.lx * 14, 18); ctx.scale(1, 0.15);
      let g = ctx.createRadialGradient(0, 0, 40, 0, 0, 200);
      g.addColorStop(0, "rgba(58,30,26,0.62)"); g.addColorStop(0.55, "rgba(58,30,26,0.28)"); g.addColorStop(1, "rgba(58,30,26,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 200, 0, 6.3); ctx.fill(); ctx.restore();

      // black velvet: dark where you face the pile, pale along every edge that turns away
      bust(); ctx.fillStyle = "#121013"; ctx.fill();
      ctx.save(); bust(); ctx.clip();
      const lampX = s.lx * 120, lampY = -150 + s.ly * 60;
      g = ctx.createRadialGradient(lampX, lampY, 10, lampX, lampY, 250);
      g.addColorStop(0, "rgba(96,90,108,0.5)"); g.addColorStop(0.5, "rgba(60,56,70,0.2)"); g.addColorStop(1, "rgba(40,36,48,0)");
      ctx.fillStyle = g; ctx.fillRect(-240, -370, 480, 410);
      ctx.save(); ctx.shadowColor = "rgba(176,168,196,0.9)"; ctx.shadowBlur = 30 * scale; ctx.lineWidth = 7; ctx.strokeStyle = "rgba(176,168,196,0.55)"; bust(); ctx.stroke();
      ctx.shadowColor = "rgba(226,220,236,0.8)"; ctx.shadowBlur = 7 * scale; ctx.lineWidth = 1.5; bust(); ctx.stroke(); ctx.restore();
      // the neck is a column: its own soft band of light, and shade where it meets the shoulders
      g = ctx.createLinearGradient(-NW, 0, NW, 0);
      const nh = 0.5 + s.lx * 0.3;
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(Math.max(0.05, nh - 0.3), "rgba(0,0,0,0.25)"); g.addColorStop(nh, "rgba(120,114,134,0.22)"); g.addColorStop(Math.min(0.95, nh + 0.3), "rgba(0,0,0,0.3)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(-NW, -348, NW * 2, 96);
      g = ctx.createLinearGradient(0, -282, 0, -214);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.5, "rgba(0,0,0,0.34)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(-150, -282, 300, 68);
      g = ctx.createLinearGradient(0, -40, 0, 26);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = g; ctx.fillRect(-230, -40, 460, 70);
      if (grain) { ctx.globalAlpha = 0.7; ctx.fillStyle = grain; ctx.fillRect(-240, -370, 480, 410); ctx.globalAlpha = 1; }
      ctx.restore();
      // the cut top of the neck
      ctx.beginPath(); ctx.ellipse(0, -344, NW, 14, 0, 0, 6.3);
      g = ctx.createLinearGradient(-NW, 0, NW, 0); g.addColorStop(0, "#2a262e"); g.addColorStop(nh, "#57515f"); g.addColorStop(1, "#211e25");
      ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(214,206,226,0.5)"; ctx.stroke();

      // the strand passes behind the neck, so pearls are only cut off where they meet its edge
      const { lo, hi } = span();
      ctx.save(); ctx.beginPath(); ctx.rect(-NW, -370, NW * 2, 120); ctx.rect(-VW, AY + 3, VW * 2, VH); ctx.clip();
      // light the pearls throw onto the velvet under them
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (let i = lo; i <= hi; i++) { const r = rad[i] * 2; g = ctx.createRadialGradient(px[i], py[i] + 2, rad[i] * 0.7, px[i], py[i] + 2, r); g.addColorStop(0, "rgba(255,236,226,0.08)"); g.addColorStop(1, "rgba(255,236,226,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px[i], py[i] + 2, r, 0, 6.3); ctx.fill(); }
      ctx.restore();
      // silk and its knots show in the gaps
      ctx.beginPath();
      for (let i = Math.max(0, lo - 1); i <= Math.min(NMAX - 1, hi + 1); i++) { if (i === Math.max(0, lo - 1)) ctx.moveTo(px[i], py[i]); else ctx.lineTo(px[i], py[i]); }
      ctx.lineWidth = 1.6; ctx.lineJoin = "round"; ctx.strokeStyle = "#e6dccb"; ctx.stroke();
      const order: number[] = [];
      for (let i = Math.max(0, lo - 1); i <= Math.min(NMAX - 1, hi + 1); i++) order.push(i);
      order.sort((a, b) => Math.abs(b - MID) - Math.abs(a - MID));
      for (const i of order) pearl(px[i], py[i], rad[i]);
      ctx.restore();
    };

    const fit = () => {
      const w = cv.clientWidth; if (!w) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr); cv.height = Math.round(((w * VH) / VW) * dpr); scale = cv.width / VW; draw();
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, nextDemo = 3400, act = 0, pluck = -1, pluckUntil = 0;
    const select = (i: number) => { if (pickRef.current !== i) { pickRef.current = i; setPick(i); } };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0; s.t = t / 1000;
      const target = lengths[pickRef.current].pearls;
      s.n += Math.max(-dt * 16, Math.min(dt * 16, target - s.n)); // pearls are fed round the neck at a steady rate
      if (now - touched > 6000) {
        s.lxTo = Math.sin(t / 1600) * 0.8; s.lyTo = Math.cos(t / 2300) * 0.5;
        if (t > nextDemo && s.grab < 0) {
          // the demo lifts the strand to one side and lets it swing, then tries another length
          if (act % 2 === 0) { const sp = span(); pluck = Math.round(MID + (act % 4 === 0 ? -1 : 1) * (sp.hi - sp.lo) * 0.2); pluckUntil = t + 520; nextDemo = t + 3000; }
          else { select((pickRef.current + 1) % lengths.length); nextDemo = t + 3200; }
          act++;
        }
        if (pluck >= 0) {
          if (t < pluckUntil) { const dir = pluck < MID ? -1 : 1; s.grab = pluck; s.gx = px[pluck] + dir * 5; s.gy = py[pluck] - 4; }
          else { s.grab = -1; pluck = -1; }
        }
      } else if (pluck >= 0) { s.grab = -1; pluck = -1; }
      s.wind = Math.sin(s.t * 1.1) * 70;
      s.lx += (s.lxTo - s.lx) * Math.min(1, dt * 5); s.ly += (s.lyTo - s.ly) * Math.min(1, dt * 5);
      step(dt / 2); step(dt / 2);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const still = () => { s.n = lengths[pickRef.current].pearls; s.grab = -1; s.lx = s.lxTo; s.ly = s.lyTo; relax(); draw(); };

    api.current = { go: (i, fromUser) => { if (fromUser) touched = performance.now(); select(i); if (reduce) still(); else wake(); } };

    const local = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); return { x: ((e.clientX - b.left) / b.width) * VW - CX, y: ((e.clientY - b.top) / b.height) * VH - BY }; };
    const onDown = (e: PointerEvent) => {
      const p = local(e), { lo, hi } = span();
      let best = -1, bd = 34;
      for (let i = lo; i <= hi; i++) { const d = Math.hypot(px[i] - p.x, py[i] - p.y); if (d < bd) { bd = d; best = i; } }
      touched = performance.now(); pluck = -1;
      if (best < 0 || reduce) return;
      s.grab = best; s.gx = p.x; s.gy = p.y; pad.setPointerCapture(e.pointerId); e.preventDefault(); wake();
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      s.lxTo = Math.max(-1, Math.min(1, p.x / (VW / 2))); s.lyTo = Math.max(-1, Math.min(1, (p.y + 200) / 260));
      touched = Math.max(touched, performance.now() - 3000);
      if (s.grab >= 0 && pluck < 0) { touched = performance.now(); s.gx = p.x; s.gy = p.y; }
      if (reduce) { s.lx = s.lxTo; s.ly = s.lyTo; draw(); }
    };
    const onUp = () => { if (pluck < 0) s.grab = -1; touched = performance.now(); };
    pad.addEventListener("pointerdown", onDown);
    pad.addEventListener("pointermove", onMove);
    pad.addEventListener("pointerup", onUp);
    pad.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(fit); ro.observe(cv);
    const io = new IntersectionObserver(([en]) => { seen = en.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    relax(); fit();
    if (!reduce) wake();
    return () => {
      cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect();
      pad.removeEventListener("pointerdown", onDown); pad.removeEventListener("pointermove", onMove);
      pad.removeEventListener("pointerup", onUp); pad.removeEventListener("pointercancel", onUp);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const choose = (i: number) => { pickRef.current = i; setPick(i); api.current?.go(i, true); };
  const onKey = (e: ReactKeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % lengths.length : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i + lengths.length - 1) % lengths.length : e.key === "Home" ? 0 : e.key === "End" ? lengths.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault(); choose(next); radios.current[next]?.focus();
  };
  const now = lengths[pick];

  return (
    <section className="relative flex min-h-[560px] w-full flex-col items-center overflow-hidden bg-[#dcc5bd] bg-[radial-gradient(80%_64%_at_50%_40%,#f3e6e0_0%,#e2cdc5_56%,#cdb2a9_100%)] px-4 pb-6 pt-4 sm:min-h-[720px] sm:justify-center sm:pb-4">
      <div className="relative w-full max-w-[640px] sm:-mt-16">
        <canvas ref={canvas} aria-hidden="true" className="block w-full" style={{ aspectRatio: `${VW} / ${VH}` }} />
        <div ref={hit} aria-hidden="true" className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing" />
      </div>
      <div className="flex w-full max-w-[540px] flex-col gap-4 sm:absolute sm:bottom-8 sm:left-8 sm:right-8 sm:w-auto sm:max-w-none sm:flex-row sm:items-end sm:justify-between">
        <p className="pointer-events-none text-[#5a443e]">
          <span className="block font-serif text-[17px] italic leading-tight text-[#2a1c19]">{strand.name}</span>
          <span className="mt-1 block font-mono text-[10.5px] uppercase tracking-[0.18em]">{strand.detail}</span>
          <span aria-live="polite" className="mt-1 block font-mono text-[10.5px] uppercase tracking-[0.18em]">
            {now.label} <span className="mx-1 text-[#9c827a]">/</span> {now.size} <span className="mx-1 text-[#9c827a]">/</span> <span className="text-[#2a1c19]">{now.price}</span>
          </span>
        </p>
        <div role="radiogroup" aria-label="Necklace length" className="flex flex-wrap gap-1.5">
          {lengths.map((l, i) => (
            <button
              key={l.label}
              ref={(el) => { radios.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={pick === i}
              tabIndex={pick === i ? 0 : -1}
              onClick={() => choose(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={`h-10 rounded-full border px-3.5 font-mono text-[10.5px] uppercase tracking-[0.14em] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#2a1c19] focus-visible:ring-offset-2 focus-visible:ring-offset-[#dcc5bd] motion-reduce:transition-none ${pick === i ? "border-[#1b1416] bg-[#1b1416] text-[#fbf1ea]" : "border-[#8f746c] bg-transparent text-[#3d2b27] hover:border-[#1b1416]"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

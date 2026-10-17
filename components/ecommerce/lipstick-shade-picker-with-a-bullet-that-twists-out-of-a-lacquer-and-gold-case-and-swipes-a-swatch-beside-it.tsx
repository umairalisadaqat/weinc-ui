import { useEffect, useRef, useState } from "react";

// The shades on offer. `hex` colours the bullet and the swatch swiped under it.
const shades = [
  { name: "Brick Lane", no: "04", hex: "#a8201c" },
  { name: "Rosehip", no: "11", hex: "#c4405a" },
  { name: "Burnt Fig", no: "17", hex: "#6d1a2c" },
  { name: "Clementine", no: "23", hex: "#d9522a" },
  { name: "Bare Clay", no: "30", hex: "#b4674f" },
];
const product = { line: "Satin lip colour", size: "3.5 g", price: "£26", engraving: "ROUGE SATIN" };
const START = 0; // which shade is out when the page loads
const VW = 600, VH = 470; // drawing space; the canvas scales this to its width

type Ctx = CanvasRenderingContext2D;
type Stops = [number, string][];

export default function LipstickShadePicker() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState(START);
  const [out, setOut] = useState(true);
  const api = useRef<{ pick: (i: number) => void; twist: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, pad = hit.current;
    if (!cv || !pad) return;
    const c = cv.getContext("2d") as Ctx | null;
    if (!c) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scale = 1;

    const LIP = { x: 258, y: 226, rot: -0.35 }, CAP = { x: 494, y: 128, rot: -1.12 };
    const SMEAR = { x: 104, y: 404, rot: -0.17, len: 380, wide: 78 };
    const s = { twist: 1, tv: 0, to: 1, shade: START, next: START, p: 1, old: shades[START].hex, oldA: 0, lx: 0, lxTo: 0 };

    const tone = (hex: string, k: number, a = 1) => {
      const n = parseInt(hex.slice(1), 16), to = k > 0 ? 255 : 0, m = Math.min(1, Math.abs(k));
      const ch = (v: number) => Math.round(v + (to - v) * m);
      return `rgba(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)},${a})`;
    };
    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r);
      c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
    };
    const across = (r: number, stops: Stops) => { const g = c.createLinearGradient(0, -r, 0, r); for (const [o, col] of stops) g.addColorStop(Math.max(0, Math.min(1, o)), col); return g; };
    const tube = (x0: number, x1: number, r: number, stops: Stops, rad = 2) => { rr(x0, -r, x1 - x0, 2 * r, rad); c.fillStyle = across(r, stops); c.fill(); };
    // a soft dark band along the tube, used where one part steps down to a narrower one
    const fall = (x: number, len: number, r: number, a: number) => { const g = c.createLinearGradient(x, 0, x + len, 0); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(Math.min(x, x + len), -r, Math.abs(len), 2 * r); };
    // where the lamp lands across a lying tube, from the way the tube points
    const lit = (rot: number) => Math.max(0.17, Math.min(0.46, 0.5 - 0.3 * (-0.6 * Math.sin(rot) + 0.8 * Math.cos(rot)) + s.lx * 0.07));
    const lacquer = (h: number): Stops => [[0, "#000"], [0.06, "#1c1c20"], [h - 0.085, "#2e2e33"], [h - 0.075, "#e9e9e4"], [h - 0.03, "#ffffff"], [h, "#a9a9ab"], [h + 0.02, "#2a2a2e"], [0.6, "#0d0d0f"], [0.8, "#050506"], [0.9, "#2b2723"], [0.96, "#57503f"], [1, "#0a0a0a"]];
    const gold = (h: number): Stops => [[0, "#3a2606"], [0.05, "#8d6418"], [h - 0.08, "#d6aa4e"], [h - 0.02, "#fff7d6"], [h + 0.05, "#e6c168"], [0.56, "#b08428"], [0.74, "#6b4810"], [0.88, "#c79a3e"], [0.95, "#f4dc96"], [1, "#4a3008"]];
    const wax = (hex: string, h: number): Stops => [[0, tone(hex, -0.6)], [0.08, tone(hex, -0.22)], [h - 0.12, hex], [h - 0.02, tone(hex, 0.62)], [h + 0.13, tone(hex, 0.06)], [0.7, tone(hex, -0.26)], [0.9, tone(hex, -0.44)], [0.96, tone(hex, -0.12)], [1, tone(hex, -0.55)]];

    // every object lies on the same table under the same lamp, so shadows are cast in screen space
    const cast = (path: () => void) => {
      c.save(); c.fillStyle = "#20261a";
      c.shadowColor = "rgba(38,48,26,0.34)"; c.shadowBlur = 26 * scale; c.shadowOffsetX = 13 * scale; c.shadowOffsetY = 20 * scale; path(); c.fill();
      c.shadowColor = "rgba(24,30,14,0.5)"; c.shadowBlur = 6 * scale; c.shadowOffsetX = 3 * scale; c.shadowOffsetY = 5 * scale; path(); c.fill();
      c.restore();
    };

    const bulletPath = (tip: number) => {
      c.beginPath(); c.moveTo(40, -19.5); c.lineTo(tip - 7, -19.5); c.quadraticCurveTo(tip + 1, -19.5, tip - 1.5, -13);
      c.lineTo(tip - 23, 16.5); c.quadraticCurveTo(tip - 25.5, 19.5, tip - 30, 19.5); c.lineTo(40, 19.5); c.closePath();
    };
    const lipstick = () => {
      const h = lit(LIP.rot), hex = shades[s.shade].hex, tip = 56 + Math.max(0, s.twist) * 94;
      c.save(); c.translate(LIP.x, LIP.y); c.rotate(LIP.rot);
      cast(() => { c.beginPath(); c.rect(-152, -29.5, 143, 59); c.rect(-10, -24.5, 69, 49); });
      if (tip > 61) {
        c.save(); c.fillStyle = "#20261a"; c.shadowColor = "rgba(38,48,26,0.3)"; c.shadowBlur = 20 * scale; c.shadowOffsetX = 12 * scale; c.shadowOffsetY = 18 * scale; bulletPath(tip); c.fill(); c.restore();
        // the bullet: waxy colour with a broad soft highlight and a paler cut face along the slant
        bulletPath(tip); c.fillStyle = across(19.5, wax(hex, h)); c.fill();
        c.save(); bulletPath(tip); c.clip();
        c.beginPath(); c.moveTo(tip + 2, -21); c.lineTo(tip - 26, 21); c.lineTo(tip - 36, 21); c.lineTo(tip - 9, -21); c.closePath();
        const face = c.createLinearGradient(tip - 30, 0, tip, 0); face.addColorStop(0, tone(hex, 0.3, 0)); face.addColorStop(0.55, tone(hex, 0.34, 0.5)); face.addColorStop(1, tone(hex, 0.6, 0.75));
        c.fillStyle = face; c.fill();
        fall(60, 16, 20, 0.5);
        c.restore();
        // the gold cup that carries the bullet
        const cup = 60 + Math.max(0, s.twist) * 13;
        tube(50, cup, 22, gold(h), 1.5); c.fillStyle = "rgba(60,36,4,0.55)"; c.fillRect(cup - 1.2, -21.5, 1.2, 43); fall(60, 9, 22, 0.42);
      }
      // inner sleeve
      tube(-10, 60, 25, gold(h), 1.5);
      c.fillStyle = "rgba(255,248,214,0.8)"; c.fillRect(58.4, -24, 1, 48); c.fillStyle = "rgba(70,44,6,0.6)"; c.fillRect(56.6, -24.5, 1.2, 49);
      fall(-8, 12, 25, 0.5);
      // knurled ring you turn; the ridges travel across it as it rotates
      tube(-24, -8, 30.5, gold(h).map(([o, col]) => [o, col] as [number, string]), 1);
      c.save(); rr(-24, -30.5, 16, 61, 1); c.clip();
      for (let i = 0; i < 46; i++) {
        const a = (i / 46) * 6.2832 + s.twist * 3.4, f = Math.cos(a); if (f <= 0.05) continue;
        const y = 30.5 * Math.sin(a), w = 2.1 * f;
        c.fillStyle = `rgba(52,30,2,${0.62 * f})`; c.fillRect(-24, y, 16, w); c.fillStyle = `rgba(255,244,200,${0.5 * f})`; c.fillRect(-24, y - w * 0.6, 16, w * 0.55);
      }
      c.restore();
      c.fillStyle = "rgba(60,36,4,0.6)"; c.fillRect(-24.6, -30.5, 1.2, 61); c.fillRect(-8.8, -30.5, 1, 61);
      // black lacquer base with a gold foot
      tube(-146, -24, 30, lacquer(h), 1); tube(-153, -146, 30, gold(h), 2);
      c.fillStyle = "rgba(40,24,2,0.55)"; c.fillRect(-146.6, -30, 1, 60);
      fall(-153, 5, 30, 0.35); fall(-24, -7, 30, 0.3);
      c.font = "600 6.6px ui-monospace,SFMono-Regular,Menlo,monospace"; c.textAlign = "center"; c.textBaseline = "middle";
      let tx = -85 - (product.engraving.length * 7.4) / 2;
      for (const ch of product.engraving) { c.fillStyle = "rgba(0,0,0,0.7)"; c.fillText(ch, tx + 0.5, 8.7); c.fillStyle = "#d9b25a"; c.fillText(ch, tx, 8); tx += 7.4; }
      c.restore();
    };

    const cap = () => {
      const h = lit(CAP.rot);
      c.save(); c.translate(CAP.x, CAP.y); c.rotate(CAP.rot);
      cast(() => rr(-66, -32, 132, 64, 3));
      tube(-66, 52, 32, lacquer(h), 3); tube(52, 66, 32, gold(h), 1.5);
      c.fillStyle = "rgba(40,24,2,0.6)"; c.fillRect(51.4, -32, 1, 64); c.fillStyle = "rgba(20,12,0,0.75)"; c.fillRect(64.6, -31, 1.4, 62);
      fall(-66, 7, 32, 0.4);
      c.restore();
    };

    // the swatch is a bundle of thin strands of paste, each ending where the lipstick ran dry
    let seed = 11;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const strands = Array.from({ length: 52 }, (_, j) => {
      const o = (j / 51) * 2 - 1, body = 1 - Math.pow(Math.abs(o), 1.7);
      return { o, end: Math.min(1, 0.46 + 0.54 * body * (0.8 + 0.2 * rnd()) + rnd() * 0.05), k: (rnd() - 0.5) * 0.3, w: 0.8 + rnd() * 0.9, wob: rnd() * 6.28, skip: rnd() };
    });
    const at = (u: number, o: number, wob: number): [number, number] => {
      const env = Math.min(1, Math.sqrt(u / 0.08)) * (1 - 0.24 * u);
      return [u * SMEAR.len + (u < 0.08 ? (1 - Math.sqrt(u / 0.08)) * 6 * (1 - o * o) : 0), o * (SMEAR.wide / 2) * env - Math.sin(u * 3.1416) * 20 + Math.sin(u * 7 + wob) * 1.1];
    };
    const run = (st: (typeof strands)[number], u0: number, u1: number) => {
      if (u1 <= u0) return false;
      c.beginPath();
      for (let i = 0; i <= 22; i++) { const [x, y] = at(u0 + (u1 - u0) * Math.pow(i / 22, 1.7), st.o, st.wob); if (i) c.lineTo(x, y); else c.moveTo(x, y); }
      return true;
    };
    const smear = (hex: string, p: number, alpha: number) => {
      if (alpha <= 0.01 || p <= 0.001) return;
      const base = SMEAR.wide / 52;
      // while it is being swiped, the leading edge is ragged: some strands run ahead of others
      const lead = (st: (typeof strands)[number]) => (p >= 1 ? 1 : Math.max(0, p * 1.2 - st.skip * 0.2));
      c.save(); c.translate(SMEAR.x, SMEAR.y); c.rotate(SMEAR.rot); c.lineCap = "round"; c.lineJoin = "round"; c.globalAlpha = alpha;
      // a thin shadow: the paste stands a hair proud of the table
      c.save(); c.translate(1.6, 3); c.strokeStyle = "rgba(50,40,20,0.2)"; c.lineWidth = base * 3;
      for (const st of strands) if (run(st, 0, Math.min(p, st.end - 0.05))) c.stroke();
      c.restore();
      for (const st of strands) {
        const body = Math.min(lead(st), st.end - 0.07);
        c.strokeStyle = tone(hex, st.k + (st.o > 0.55 ? -0.14 : 0)); c.lineWidth = base * 2.5 * st.w;
        if (run(st, 0, body)) c.stroke();
        // the dry tail: thinner, broken, letting the table show through
        c.globalAlpha = alpha * (0.4 + st.skip * 0.45); c.lineWidth = base * (1.3 + st.skip);
        if (run(st, Math.max(0, body - 0.01), Math.min(lead(st), st.end))) c.stroke();
        c.globalAlpha = alpha;
      }
      // sheen along the lit shoulder and where the paste pooled at the start
      c.globalCompositeOperation = "lighter";
      for (const st of strands) {
        if (st.o > -0.22 || st.o < -0.86 || st.skip < 0.3) continue;
        c.strokeStyle = `rgba(255,226,214,${0.07 + st.skip * 0.13})`; c.lineWidth = base * 1.3;
        if (run(st, 0.02, Math.min(p, st.end * (0.35 + st.skip * 0.4)))) c.stroke();
      }
      c.globalCompositeOperation = "source-over";
      if (p > 0.05) {
        const [bx, by] = at(0.1, -0.2, 0), blob = c.createRadialGradient(bx - 3, by - 5, 1, bx, by, 17);
        blob.addColorStop(0, tone(hex, 0.6, 0.5)); blob.addColorStop(0.5, tone(hex, 0.25, 0.2)); blob.addColorStop(1, tone(hex, 0, 0));
        c.fillStyle = blob; c.beginPath(); c.ellipse(bx, by, 17, 17, 0, 0, 6.3); c.fill();
      }
      c.restore();
    };

    const draw = () => {
      c.setTransform(scale, 0, 0, scale, 0, 0); c.clearRect(0, 0, VW, VH);
      smear(s.old, 1, s.oldA); smear(shades[s.shade].hex, s.p, 1);
      cap(); lipstick();
    };
    const fit = () => {
      const w = cv.clientWidth; if (!w) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr); cv.height = Math.round(((w * VH) / VW) * dpr); scale = cv.width / VW; draw();
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, nextDemo = 4600, drag = false, dx = 0, dy = 0, d0 = 1;
    const swap = () => { s.old = shades[s.shade].hex; s.oldA = 1; s.shade = s.next; s.p = 0; s.to = 1; setOut(true); };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      s.tv += (130 * (s.to - s.twist) - 17 * s.tv) * dt; s.twist += s.tv * dt;
      if (s.next !== s.shade && s.twist < 0.05) swap();
      if (s.twist > 0.45 && s.p < 1) { s.p = Math.min(1, s.p + dt / 0.85); }
      if (s.oldA > 0 && s.p > 0) s.oldA = Math.max(0, s.oldA - dt * 1.7);
      if (now - touched > 7000) {
        s.lxTo = Math.sin(t / 1500);
        if (t > nextDemo && !drag) { s.next = (s.next + 1) % shades.length; setPicked(s.next); s.to = 0; nextDemo = t + 4300; }
      }
      s.lx += (s.lxTo - s.lx) * Math.min(1, dt * 5);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const still = () => { if (s.next !== s.shade) swap(); s.twist = s.to; s.tv = 0; s.p = 1; s.oldA = 0; draw(); };

    api.current = {
      pick: (i) => { touched = performance.now(); setPicked(i); s.next = i; if (i !== s.shade) s.to = 0; if (reduce) still(); else wake(); },
      twist: () => { touched = performance.now(); s.to = s.to > 0.5 ? 0 : 1; setOut(s.to > 0.5); if (reduce) still(); else wake(); },
    };

    const onDown = (e: PointerEvent) => { drag = true; dx = e.clientX; dy = e.clientY; d0 = s.to; touched = performance.now(); pad.setPointerCapture(e.pointerId); wake(); };
    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect();
      s.lxTo = Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1)); touched = Math.max(touched, performance.now() - 4000);
      if (drag && s.next === s.shade) {
        // pulling along the case winds the bullet out, pushing back winds it in
        const along = ((e.clientX - dx) * Math.cos(LIP.rot) + (e.clientY - dy) * Math.sin(LIP.rot)) / b.width;
        s.to = Math.max(0, Math.min(1, d0 + along * 3.4)); touched = performance.now(); setOut(s.to > 0.5);
      }
      if (reduce) { s.lx = s.lxTo; still(); }
    };
    const onUp = () => { drag = false; touched = performance.now(); };
    pad.addEventListener("pointerdown", onDown); pad.addEventListener("pointermove", onMove);
    pad.addEventListener("pointerup", onUp); pad.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(fit); ro.observe(cv);
    const io = new IntersectionObserver(([en]) => { seen = en.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    fit(); wake();
    return () => {
      cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect();
      pad.removeEventListener("pointerdown", onDown); pad.removeEventListener("pointermove", onMove);
      pad.removeEventListener("pointerup", onUp); pad.removeEventListener("pointercancel", onUp);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const shade = shades[picked];
  return (
    <section className="relative flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[#dde2d4] bg-[radial-gradient(70%_62%_at_42%_38%,#f3f5ec_0%,#dde2d4_56%,#c5ccb8_100%)] px-4 pb-6 pt-6 sm:min-h-[720px] sm:pb-20">
      <div className="relative w-full max-w-[800px]">
        <canvas ref={canvas} aria-hidden="true" className="block w-full" style={{ aspectRatio: `${VW} / ${VH}` }} />
        <div ref={hit} aria-hidden="true" className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing" />
      </div>
      <div className="mt-3 flex w-full max-w-[660px] flex-col gap-4 sm:absolute sm:inset-x-8 sm:bottom-8 sm:mt-0 sm:w-auto sm:max-w-none sm:flex-row sm:items-end sm:justify-between">
        <p className="text-[#4d5740]">
          <span aria-live="polite" className="block font-serif text-[19px] italic leading-tight text-[#1f2518]">
            {shade.name} <span className="font-mono text-[11px] not-italic tracking-[0.16em] text-[#4d5740]">N° {shade.no}</span>
          </span>
          <span className="mt-1 block font-mono text-[10.5px] uppercase leading-relaxed tracking-[0.18em]">
            {product.line} <span className="mx-1 text-[#8b9479]">/</span> {product.size} <span className="mx-1 text-[#8b9479]">/</span> <span className="text-[#1f2518]">{product.price}</span>
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div role="group" aria-label="Shade" className="flex">
            {shades.map((sh, i) => (
              <button key={sh.no} type="button" aria-label={`${sh.name}, shade ${sh.no}`} aria-pressed={picked === i} onClick={() => api.current?.pick(i)} className="group grid h-10 w-10 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#1f2518]">
                <span className={`block h-6 w-6 rounded-full shadow-[inset_0_2px_3px_rgba(255,255,255,0.35),inset_0_-3px_4px_rgba(0,0,0,0.25)] ring-offset-2 ring-offset-[#dde2d4] transition-transform duration-200 group-hover:scale-110 motion-reduce:transition-none ${picked === i ? "ring-2 ring-[#1f2518]" : ""}`} style={{ backgroundColor: sh.hex }} />
              </button>
            ))}
          </div>
          <button type="button" aria-pressed={out} onClick={() => api.current?.twist()} className="h-10 rounded-full border border-[#1f2518]/40 px-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#1f2518] outline-none transition-colors duration-200 hover:border-[#1f2518] hover:bg-[#1f2518] hover:text-[#f3f5ec] focus-visible:ring-2 focus-visible:ring-[#1f2518] motion-reduce:transition-none">
            {out ? "Twist down" : "Twist up"}
          </button>
        </div>
      </div>
    </section>
  );
}

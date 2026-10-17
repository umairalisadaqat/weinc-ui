import { useEffect, useRef, useState } from "react";

// The tones the powder comes in. `hex` colours the pressed pan.
const tones = [
  { name: "Porcelain", no: "01", hex: "#f1dccb" },
  { name: "Warm Sand", no: "02", hex: "#e4bf9d" },
  { name: "Honey", no: "03", hex: "#cf9c6c" },
  { name: "Chestnut", no: "04", hex: "#a2694a" },
];
const product = { line: "Soft focus pressed powder", size: "9 g", price: "£34" };
// What the mirror sees. Any square portrait works; the face should sit near the middle.
const REFLECTION = { src: "https://images.pexels.com/photos/30509797/pexels-photo-30509797.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Woman with dark hair and soft pink lips looking into the mirror, in front of a pink wall" };
const OPEN = 1.84; // how far the lid swings back, in radians
const VW = 560, VH = 530; // drawing space; the canvas scales this to its width

type Stops = [number, string][];

export default function GoldPowderCompact() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const [tone, setTone] = useState(1);
  const [open, setOpen] = useState(true);
  const api = useRef<{ tone: (i: number) => void; toggle: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, pad = hit.current, img = photo.current;
    if (!cv || !pad || !img) return;
    const c = cv.getContext("2d");
    if (!c) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scale = 1;

    // the compact is seen from above and in front: flat discs become ellipses K high, heights shrink by E
    const K = 0.46, E = 0.888, CX = VW / 2, R = 150, HINGE = 318, TOP = HINGE + R * K, DEEP = 24 * E, LID = 11, RI = R * 0.86;
    const hexRgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
    const s = { a: OPEN, av: 0, to: OPEN, held: false, col: hexRgb(tones[1].hex), colTo: hexRgb(tones[1].hex), lx: 0, ly: 0, lxTo: 0, lyTo: 0, t: 0 };

    let loaded = img.complete && img.naturalWidth > 0;
    const onLoad = () => { loaded = true; draw(); };
    img.addEventListener("load", onLoad);

    // fine grain for the pressed powder, made once
    const grain = document.createElement("canvas"); grain.width = grain.height = 96;
    const gx = grain.getContext("2d");
    if (gx) { const d = gx.createImageData(96, 96); let sd = 5; for (let i = 0; i < d.data.length; i += 4) { sd = (sd * 1664525 + 1013904223) >>> 0; const v = sd / 4294967296; d.data[i] = d.data[i + 1] = d.data[i + 2] = v > 0.5 ? 255 : 40; d.data[i + 3] = Math.abs(v - 0.5) * 90; } gx.putImageData(d, 0, 0); }

    const pc = (k: number, a = 1) => { const to = k > 0 ? 255 : 0, m = Math.abs(k); return `rgba(${s.col.map((v) => Math.round(v + (to - v) * m)).join(",")},${a})`; };
    const ell = (cx: number, cy: number, rx: number, ry: number) => { c.beginPath(); c.ellipse(cx, cy, rx, Math.max(0.01, ry), 0, 0, 6.2832); };
    const hg = (x0: number, x1: number, stops: Stops) => { const g = c.createLinearGradient(x0, 0, x1, 0); for (const [o, col] of stops) g.addColorStop(Math.max(0, Math.min(1, o)), col); return g; };
    const vg = (y0: number, y1: number, stops: Stops) => { const g = c.createLinearGradient(0, y0, 0, y1); for (const [o, col] of stops) g.addColorStop(o, col); return g; };
    const side = (): Stops => { const h = 0.3 + s.lx * 0.08; return [[0, "#3a2606"], [0.04, "#8d6418"], [h - 0.1, "#d2a548"], [h, "#fff7d6"], [h + 0.07, "#e9c873"], [0.55, "#b58a2c"], [0.72, "#6b4810"], [0.86, "#c79a3e"], [0.94, "#f6e09c"], [1, "#4a3008"]]; };
    // a slab between two equal ellipses: the edge of the base or of the lid
    const slab = (y0: number, y1: number, ry: number) => { c.beginPath(); c.ellipse(CX, y0, R, Math.max(0.01, ry), 0, 0, 6.2832); c.rect(CX - R, Math.min(y0, y1), 2 * R, Math.abs(y1 - y0)); c.ellipse(CX, y1, R, Math.max(0.01, ry), 0, 0, 6.2832); c.fillStyle = hg(CX - R, CX + R, side()); c.fill(); };
    // spun metal: light and dark sectors that swing round as the lamp moves
    const spun = (r: number) => {
      const g = c.createConicGradient(-0.9 + s.lx * 0.5, 0, 0);
      const cols = ["#fff6d0", "#d9b25a", "#9b7220", "#e2bd68", "#fff1c0", "#c69a3c", "#8a6418", "#e8c672", "#fff6d0"];
      cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col));
      c.beginPath(); c.arc(0, 0, r, 0, 6.2832); c.fillStyle = g; c.fill();
    };

    const base = () => {
      const shut = Math.max(0, 1 - s.a / 1.1);
      // shadow on the table
      c.save(); c.translate(CX + 16, TOP + DEEP + 12); c.scale(1, K);
      const sh = c.createRadialGradient(0, 0, R * 0.5, 0, 0, R * 1.5); sh.addColorStop(0, "rgba(8,0,3,0.78)"); sh.addColorStop(0.55, "rgba(8,0,3,0.4)"); sh.addColorStop(1, "rgba(8,0,3,0)");
      c.fillStyle = sh; c.beginPath(); c.arc(0, 0, R * 1.5, 0, 6.2832); c.fill(); c.restore();
      slab(TOP, TOP + DEEP, R * K);
      c.fillStyle = vg(TOP, TOP + DEEP + R * K, [[0, "rgba(40,20,0,0)"], [0.6, "rgba(40,20,0,0)"], [1, "rgba(30,12,0,0.55)"]]); ell(CX, TOP + DEEP, R, R * K); c.fill();
      // rim, seen from above
      ell(CX, TOP, R, R * K); c.fillStyle = vg(TOP - R * K, TOP + R * K, [[0, "#a67c2a"], [0.5, "#dcb65e"], [0.86, "#fbeab4"], [1, "#e6c36c"]]); c.fill();
      c.lineWidth = 1; c.strokeStyle = "rgba(255,250,220,0.8)"; ell(CX, TOP + 0.6, R - 0.6, R * K - 0.6); c.stroke();
      // the well: its far wall shows, the powder sits a little below the rim
      c.save(); ell(CX, TOP, RI, RI * K); c.clip();
      c.fillStyle = hg(CX - RI, CX + RI, [[0, "#3a2606"], [0.25, "#8a6418"], [0.5, "#b48a30"], [0.75, "#7a5614"], [1, "#2e1c04"]]); c.fillRect(CX - RI, TOP - RI * K, 2 * RI, 2 * RI * K);
      const py = TOP + 6;
      c.save(); c.translate(CX, py); c.scale(1, K);
      const pg = c.createRadialGradient(-40, -50, 10, 0, 0, RI * 1.05); pg.addColorStop(0, pc(0.22)); pg.addColorStop(0.55, pc(0)); pg.addColorStop(1, pc(-0.16));
      c.beginPath(); c.arc(0, 0, RI, 0, 6.2832); c.fillStyle = pg; c.fill();
      // the pattern pressed into it: a ring, a sunburst, a ring
      const groove = (draw: () => void) => { c.lineWidth = 1.5; c.save(); c.translate(0.9, 1.6); c.strokeStyle = pc(-0.4, 0.5); draw(); c.restore(); c.save(); c.translate(-0.6, -1.3); c.strokeStyle = pc(0.7, 0.75); draw(); c.restore(); };
      groove(() => { c.beginPath(); c.arc(0, 0, RI - 13, 0, 6.2832); c.stroke(); });
      groove(() => { c.beginPath(); c.arc(0, 0, 21, 0, 6.2832); c.stroke(); });
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * 6.2832, ca = Math.cos(a), sa = Math.sin(a);
        groove(() => { c.beginPath(); c.moveTo(ca * 29, sa * 29); c.quadraticCurveTo(Math.cos(a + 0.13) * 74, Math.sin(a + 0.13) * 74, Math.cos(a + 0.03) * (RI - 21), Math.sin(a + 0.03) * (RI - 21)); c.stroke(); });
      }
      c.restore();
      const pat = c.createPattern(grain, "repeat"); if (pat) { c.save(); c.translate(CX, py); c.scale(0.5, 0.5); c.globalAlpha = 0.55; c.fillStyle = pat; c.fillRect(-2 * RI, -2 * RI * K, 4 * RI, 4 * RI * K); c.restore(); }
      // shade thrown by the far wall, and by the lid as it comes down
      c.fillStyle = vg(py - RI * K, py - RI * K + 38, [[0, "rgba(30,12,0,0.5)"], [1, "rgba(30,12,0,0)"]]); c.fillRect(CX - RI, py - RI * K, 2 * RI, 38);
      if (shut > 0) { c.fillStyle = `rgba(16,4,2,${shut * 0.7})`; c.fillRect(CX - RI, TOP - RI * K, 2 * RI, 2 * RI * K); }
      c.restore();
      c.lineWidth = 1.2; c.strokeStyle = "rgba(60,36,4,0.7)"; ell(CX, TOP, RI, RI * K); c.stroke();
      c.lineWidth = 0.8; c.strokeStyle = "rgba(255,248,214,0.7)"; c.beginPath(); c.ellipse(CX, TOP + 1.2, RI, RI * K, 0, 0.1, 3.04); c.stroke();
      // thumb catch at the front
      const cy = TOP + R * K + DEEP * 0.42;
      c.fillStyle = "rgba(30,12,0,0.5)"; c.beginPath(); c.ellipse(CX + 2, cy + 3.5, 21, 8, 0, 0, 6.2832); c.fill();
      c.beginPath(); c.ellipse(CX, cy, 19, 7.5, 0, 0, 6.2832); c.fillStyle = hg(CX - 19, CX + 19, [[0, "#6b4810"], [0.3, "#fff3c4"], [0.6, "#d0a548"], [1, "#5a3c0c"]]); c.fill();
      c.lineWidth = 0.8; c.strokeStyle = "rgba(60,36,4,0.7)"; c.stroke();
    };

    const lid = () => {
      const v = Math.cos(s.a) * K - Math.sin(s.a) * E, w = Math.cos(s.a) * E + Math.sin(s.a) * K;
      const iy = HINGE + R * v, oy = iy - LID * w, ry = R * Math.abs(v);
      slab(iy, oy, ry);
      c.save(); c.translate(CX, v < 0 ? iy : oy); c.scale(1, Math.max(0.004, Math.abs(v)));
      if (v < 0) {
        // inside of the lid: a gold frame and the glass
        spun(R); c.lineWidth = 1; c.strokeStyle = "rgba(255,250,220,0.75)"; c.beginPath(); c.arc(0, 0, R - 0.8, 0, 6.2832); c.stroke();
        const rm = R * 0.865;
        c.lineWidth = 1; c.strokeStyle = "rgba(70,44,6,0.5)"; c.beginPath(); c.arc(0, 0, R - 7, 0, 6.2832); c.stroke(); c.strokeStyle = "rgba(255,250,220,0.6)"; c.beginPath(); c.arc(0, 0, R - 8.2, 0, 6.2832); c.stroke();
        c.beginPath(); c.arc(0, 0, rm + 3.5, 0, 6.2832); c.fillStyle = "#3a2606"; c.fill();
        c.save(); c.beginPath(); c.arc(0, 0, rm, 0, 6.2832); c.clip();
        c.fillStyle = "#c2476b"; c.fillRect(-rm, -rm, 2 * rm, 2 * rm);
        // the reflection slides in the glass as the lid swings and as you move round it
        const d = rm * 2.2, ox = 16 - s.lx * 18, oy2 = (OPEN - s.a) * 150 - s.ly * 10 + 4;
        if (loaded) c.drawImage(img, -d / 2 + ox, -d / 2 + oy2, d, d);
        const dim = c.createRadialGradient(0, 0, rm * 0.55, 0, 0, rm); dim.addColorStop(0, "rgba(20,4,10,0)"); dim.addColorStop(1, "rgba(20,4,10,0.42)");
        c.fillStyle = dim; c.fillRect(-rm, -rm, 2 * rm, 2 * rm);
        const gl = c.createLinearGradient(-rm + s.lx * 50, -rm, rm * 0.5 + s.lx * 50, rm);
        gl.addColorStop(0.18, "rgba(255,255,255,0)"); gl.addColorStop(0.3, "rgba(255,255,255,0.26)"); gl.addColorStop(0.42, "rgba(255,255,255,0.05)"); gl.addColorStop(0.5, "rgba(255,255,255,0.16)"); gl.addColorStop(0.56, "rgba(255,255,255,0)");
        c.fillStyle = gl; c.fillRect(-rm, -rm, 2 * rm, 2 * rm);
        c.restore();
        // ground edge of the glass
        c.lineWidth = 2.4; c.strokeStyle = "rgba(10,2,6,0.55)"; c.beginPath(); c.arc(0, 0, rm - 1.2, 0, 6.2832); c.stroke();
        c.lineWidth = 1; c.strokeStyle = "rgba(255,255,255,0.75)"; c.beginPath(); c.arc(0, 0, rm - 2.6, 3.4, 5.2); c.stroke();
        c.strokeStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.arc(0, 0, rm - 2.6, 0.3, 1.7); c.stroke();
      } else {
        // outside of the lid: spun gold with an engraved sunburst and a domed stud
        spun(R);
        for (let i = 0; i < 60; i++) { const a = (i / 60) * 6.2832; c.strokeStyle = i % 2 ? "rgba(60,36,4,0.4)" : "rgba(255,250,220,0.5)"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); c.lineTo(Math.cos(a) * (R - 16), Math.sin(a) * (R - 16)); c.stroke(); }
        c.lineWidth = 1.4; c.strokeStyle = "rgba(60,36,4,0.55)"; c.beginPath(); c.arc(0, 0, R - 11, 0, 6.2832); c.stroke();
        c.strokeStyle = "rgba(255,250,220,0.8)"; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, R - 0.8, 0, 6.2832); c.stroke();
        const dome = c.createRadialGradient(-7, -8, 1, 0, 0, 24); dome.addColorStop(0, "#fffbe6"); dome.addColorStop(0.35, "#e6c168"); dome.addColorStop(1, "#6b4810");
        c.beginPath(); c.arc(0, 0, 23, 0, 6.2832); c.fillStyle = dome; c.fill(); c.lineWidth = 1; c.strokeStyle = "rgba(60,36,4,0.7)"; c.stroke();
      }
      c.restore();
      // hinge barrel
      c.fillStyle = "rgba(20,8,0,0.45)"; c.fillRect(CX - 31, HINGE + 1, 62, 9);
      const hb = vg(HINGE - 6, HINGE + 6, [[0, "#6b4810"], [0.25, "#fff3c4"], [0.55, "#c79a3e"], [1, "#3a2606"]]);
      for (const [x, wd] of [[-30, 18], [-10, 20], [12, 18]]) { c.fillStyle = hb; c.beginPath(); c.roundRect(CX + x, HINGE - 6, wd, 12, 3); c.fill(); c.lineWidth = 0.6; c.strokeStyle = "rgba(40,24,2,0.7)"; c.stroke(); }
    };

    const draw = () => { c.setTransform(scale, 0, 0, scale, 0, 0); c.clearRect(0, 0, VW, VH); base(); lid(); };
    const fit = () => {
      const w = cv.clientWidth; if (!w) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr); cv.height = Math.round(((w * VH) / VW) * dpr); scale = cv.width / VW; draw();
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, nextDemo = 4600, down = false, y0 = 0, a0 = 0, moved = 0;
    const aim = (o: boolean) => { s.to = o ? OPEN : 0; setOpen(o); };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0; s.t = t / 1000;
      const idle = now - touched > 7000;
      const to = s.to + (s.to > 1 && !s.held ? Math.sin(t / 900) * 0.035 : 0);
      s.av += ((s.held ? 300 : 70) * (to - s.a) - (s.held ? 30 : 8.5) * s.av) * dt; s.a += s.av * dt;
      if (s.a < 0) { s.a = 0; s.av = Math.abs(s.av) * 0.3; } // the lid lands on the base with a small bounce
      for (let i = 0; i < 3; i++) s.col[i] += (s.colTo[i] - s.col[i]) * Math.min(1, dt * 7);
      if (idle) {
        s.lxTo = Math.sin(t / 1600); s.lyTo = Math.cos(t / 2100) * 0.6;
        if (t > nextDemo && !down) { aim(s.to < 1); nextDemo = t + (s.to < 1 ? 1500 : 5200); }
      }
      s.lx += (s.lxTo - s.lx) * Math.min(1, dt * 5); s.ly += (s.lyTo - s.ly) * Math.min(1, dt * 5);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const still = () => { s.a = s.to; s.av = 0; s.col = [...s.colTo]; s.lx = s.lxTo; s.ly = s.lyTo; draw(); };

    api.current = {
      tone: (i) => { touched = performance.now(); setTone(i); s.colTo = hexRgb(tones[i].hex); if (s.to < 1) aim(true); if (reduce) still(); else wake(); },
      toggle: () => { touched = performance.now(); aim(s.to < 1); if (reduce) still(); else wake(); },
    };

    const onDown = (e: PointerEvent) => { down = true; moved = 0; y0 = e.clientY; a0 = s.a; touched = performance.now(); pad.setPointerCapture(e.pointerId); wake(); };
    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect();
      s.lxTo = Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1)); s.lyTo = Math.max(-1, Math.min(1, ((e.clientY - b.top) / b.height) * 2 - 1));
      touched = Math.max(touched, performance.now() - 4000);
      if (down) {
        moved = Math.max(moved, Math.abs(e.clientY - y0)); touched = performance.now();
        // pull the lid down toward you to close it, push it back to open it
        if (moved > 5) { s.held = true; s.to = Math.max(0, Math.min(OPEN + 0.1, a0 - ((e.clientY - y0) / b.height) * 4.4)); }
      }
      if (reduce) still();
    };
    const onUp = () => {
      if (!down) return;
      down = false; touched = performance.now();
      if (moved <= 5) aim(s.to < 1); else aim(s.to > OPEN * 0.45);
      s.held = false;
      if (reduce) still();
    };
    pad.addEventListener("pointerdown", onDown); pad.addEventListener("pointermove", onMove);
    pad.addEventListener("pointerup", onUp); pad.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(fit); ro.observe(cv);
    const io = new IntersectionObserver(([en]) => { seen = en.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    fit(); wake();
    return () => {
      cancelAnimationFrame(raf); api.current = null; img.removeEventListener("load", onLoad); ro.disconnect(); io.disconnect();
      pad.removeEventListener("pointerdown", onDown); pad.removeEventListener("pointermove", onMove);
      pad.removeEventListener("pointerup", onUp); pad.removeEventListener("pointercancel", onUp);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <section className="relative flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[#2a0a14] bg-[radial-gradient(64%_58%_at_50%_44%,#7a2238_0%,#431020_44%,#1b060d_86%)] px-4 pb-6 pt-6 sm:min-h-[720px] sm:pb-10">
      <div className="relative w-full max-w-[680px]">
        {/* the portrait is read from this image and painted into the mirror; it stays in the page for screen readers */}
        <img ref={photo} src={REFLECTION.src} alt={REFLECTION.alt} width={900} height={900} className="pointer-events-none absolute left-1/2 top-1/3 h-px w-px opacity-0" />
        <canvas ref={canvas} aria-hidden="true" className="block w-full" style={{ aspectRatio: `${VW} / ${VH}` }} />
        <div ref={hit} aria-hidden="true" className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing" />
      </div>
      <div className="mt-3 flex w-full max-w-[680px] flex-col gap-4 sm:absolute sm:inset-x-8 sm:bottom-8 sm:mt-0 sm:w-auto sm:max-w-none sm:flex-row sm:items-end sm:justify-between">
        <p className="text-[#e3b9c0]">
          <span aria-live="polite" className="block font-serif text-[19px] italic leading-tight text-[#fff1ea]">
            {tones[tone].name} <span className="font-mono text-[11px] not-italic tracking-[0.16em] text-[#e3b9c0]">N° {tones[tone].no}</span>
          </span>
          <span className="mt-1 block font-mono text-[10.5px] uppercase leading-relaxed tracking-[0.18em]">
            {product.line} <span className="mx-1 text-[#a8707c]">/</span> {product.size} <span className="mx-1 text-[#a8707c]">/</span> <span className="text-[#fff1ea]">{product.price}</span>
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div role="group" aria-label="Powder tone" className="flex">
            {tones.map((tn, i) => (
              <button key={tn.no} type="button" aria-label={`${tn.name}, tone ${tn.no}`} aria-pressed={tone === i} onClick={() => api.current?.tone(i)} className="group grid h-10 w-10 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#f6e09c]">
                <span className={`block h-6 w-6 rounded-full shadow-[inset_0_2px_3px_rgba(255,255,255,0.4),inset_0_-3px_4px_rgba(60,20,10,0.3)] ring-offset-2 ring-offset-[#2a0a14] transition-transform duration-200 group-hover:scale-110 motion-reduce:transition-none ${tone === i ? "ring-2 ring-[#f6e09c]" : ""}`} style={{ backgroundColor: tn.hex }} />
              </button>
            ))}
          </div>
          <button type="button" aria-pressed={open} onClick={() => api.current?.toggle()} className="h-10 rounded-full border border-[#c79a3e]/60 px-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#f6e09c] outline-none transition-colors duration-200 hover:border-[#f6e09c] hover:text-white focus-visible:ring-2 focus-visible:ring-[#f6e09c] motion-reduce:transition-none">
            {open ? "Close the compact" : "Open the compact"}
          </button>
        </div>
      </div>
    </section>
  );
}

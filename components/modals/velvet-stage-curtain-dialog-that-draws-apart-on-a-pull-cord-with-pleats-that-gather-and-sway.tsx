import { useEffect, useRef, useState } from "react";

// What the curtains open on. Change the words, the two actions and the photograph here.
const show = {
  kicker: "Tonight at eight",
  title: "The Long Interval",
  line: "A solo in three movements. Doors open at half past seven and the bar stays open after.",
  primary: "Reserve a seat",
  secondary: "Close the curtains",
  src: "https://images.pexels.com/photos/33865974/pexels-photo-33865974.jpeg?auto=compress&cs=tinysrgb&w=1100",
  alt: "Dancer in an orange leotard reaching one arm up under a spotlight on a dark stage",
};
const VELVET: [number, number, number] = [172, 20, 40]; // the lit colour of the cloth
const GOLD: [number, number, number] = [222, 170, 70]; // fringe, braid and cord
const FULLNESS = 1.36; // cloth width over closed width: more cloth means deeper pleats
const PLEAT = 46; // width of one pleat in pixels when the curtains are shut
const HOLD_MS = 6200; // how long the demo leaves the stage open before closing again

export default function VelvetStageCurtainDialog() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cord = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLButtonElement>(null);
  const api = useRef<{ set: (open: boolean) => void } | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const cv = canvas.current, box = stage.current;
    if (!cv || !box) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const bufs = [document.createElement("canvas"), document.createElement("canvas")];
    const top = document.createElement("canvas");
    let w = 0, h = 0, VH = 90, FLOOR = 34, hem = 0, shut = 0, away = 0, pleats = 14, cordX = 0;
    const LX = 0.52, LZ = 0.854; // the light sits low and in front, toward the middle of the stage

    // One vertical sliver of pleated velvet: how bright it is given where it sits on its fold.
    const sliver = (x: number, span: number, n: number, depth: number, seed: number) => {
      const t = x / span, kk = (n * Math.PI * 2) / span;
      const ph = (t + 0.004 * Math.sin(t * 23 + seed)) * n * Math.PI * 2 + seed;
      const z = Math.cos(ph) + 0.3 * Math.cos(2 * ph + 0.9 + seed);
      const dz = (-Math.sin(ph) - 0.6 * Math.sin(2 * ph + 0.9 + seed)) * kk * depth;
      const inv = 1 / Math.hypot(dz, 1), nx = -dz * inv, nz = inv;
      const lam = Math.max(0, nx * LX + nz * LZ);
      const occ = 0.22 + 0.78 * Math.pow((z + 1.3) / 2.6, 1.5);
      const nap = Math.pow(1 - nz, 1.6); // velvet is brightest where you see it edge on
      return { z, lit: occ * (0.07 + 0.93 * Math.pow(lam, 1.25)), rim: nap * (0.1 + 0.9 * lam) * occ };
    };
    const paint = (lit: number, rim: number, c: [number, number, number]) =>
      `rgb(${Math.min(255, c[0] * lit + 255 * rim * 0.62) | 0},${Math.min(255, c[1] * lit + 120 * rim * 0.5) | 0},${Math.min(255, c[2] * lit + 110 * rim * 0.5) | 0})`;

    const s = { top: 0, tv: 0, target: 0, bot: [0, 0], bv: [0, 0], drop: 0, dv: 0, swing: 0, sv: 0 };
    let lastSpan = -1;

    const weave = (which: number, span: number) => {
      const b = bufs[which].getContext("2d");
      if (!b) return;
      const cols = Math.max(2, Math.round(span * dpr)), H = bufs[which].height;
      const pitch = span / pleats, arc = (shut * FULLNESS) / pleats;
      const depth = Math.sqrt(Math.max(1, arc * arc - pitch * pitch)) / 4.4;
      const fr = 13 * dpr;
      b.clearRect(0, H - 40 * dpr, bufs[which].width, 40 * dpr);
      for (let i = 0; i < cols; i++) {
        const v = sliver(i / dpr, span, pleats, depth, which ? 2.1 : 0.4);
        const end = i > cols - 4 * dpr ? 0.45 : 1;
        const hb = H - (8 - Math.min(5.5, pitch * 0.2) * (v.z / 1.3)) * dpr;
        b.fillStyle = paint(v.lit * end, v.rim * end, VELVET); b.fillRect(i, 0, 1, hb - fr);
        b.fillStyle = "rgba(20,4,6,0.9)"; b.fillRect(i, hb - fr - 2.5 * dpr, 1, 2.5 * dpr);
        const g = (0.2 + 1.05 * v.lit + v.rim * 0.5) * end * (i % 3 === 0 ? 0.72 : 1);
        b.fillStyle = `rgb(${Math.min(255, GOLD[0] * g) | 0},${Math.min(255, GOLD[1] * g) | 0},${Math.min(255, GOLD[2] * g) | 0})`; b.fillRect(i, hb - fr, 1, fr);
        b.fillStyle = `rgba(255,236,170,${Math.min(0.9, v.lit * 0.9)})`; b.fillRect(i, hb - fr - 5.5 * dpr, 1, 2 * dpr);
      }
    };

    // The pelmet across the top is painted once: shallow box pleats, a scalloped edge and fringe.
    const pelmet = () => {
      top.width = Math.ceil(w * dpr); top.height = Math.ceil((VH + 4) * dpr);
      const b = top.getContext("2d");
      if (!b) return;
      const swags = Math.max(2, Math.round(w / 190)), n = Math.round(w / 31);
      for (let i = 0; i < top.width; i++) {
        const x = i / dpr, v = sliver(x, w, n, 5.2, 1.1), f = ((x / w) * swags) % 1;
        const hb = (VH - 22 + 22 * Math.pow(Math.sin(Math.PI * f), 0.8) + 2 * (v.z / 1.3)) * dpr, fr = 11 * dpr;
        const fall = 0.5 + 0.5 * Math.min(1, hb / (VH * dpr));
        b.fillStyle = paint(v.lit * 0.82 * fall, v.rim * 0.7, VELVET); b.fillRect(i, 0, 1, hb - fr);
        b.fillStyle = "rgba(20,4,6,0.9)"; b.fillRect(i, hb - fr - 2.5 * dpr, 1, 2.5 * dpr);
        const g = (0.25 + 1.0 * v.lit + v.rim * 0.4) * (i % 3 === 0 ? 0.7 : 1);
        b.fillStyle = `rgb(${Math.min(255, GOLD[0] * g) | 0},${Math.min(255, GOLD[1] * g) | 0},${Math.min(255, GOLD[2] * g) | 0})`; b.fillRect(i, hb - fr, 1, fr);
        b.fillStyle = `rgba(255,236,170,${Math.min(0.9, v.lit)})`; b.fillRect(i, hb - fr - 6 * dpr, 1, 2.2 * dpr);
      }
      const dark = b.createLinearGradient(0, 0, 0, VH * dpr);
      dark.addColorStop(0, "rgba(0,0,0,0.72)"); dark.addColorStop(0.5, "rgba(0,0,0,0.12)"); dark.addColorStop(1, "rgba(0,0,0,0)");
      b.globalCompositeOperation = "source-atop"; b.fillStyle = dark; b.fillRect(0, 0, top.width, top.height); b.globalCompositeOperation = "source-over";
    };

    const size = () => {
      w = box.clientWidth; h = box.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      VH = Math.max(70, Math.min(104, h * 0.135)); FLOOR = w < 640 ? 26 : 36; hem = h - FLOOR + 3;
      shut = w / 2 + 22; away = Math.max(64, w * 0.185); pleats = Math.max(5, Math.round(shut / PLEAT));
      cordX = w * 0.938;
      for (const b of bufs) { b.width = Math.ceil((shut + 4) * dpr); b.height = Math.ceil(hem * dpr); }
      pelmet(); lastSpan = -1;
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const span = s.top + 10;
      if (Math.abs(span - lastSpan) > 0.04) { weave(0, span); weave(1, span); lastSpan = span; }
      const cols = Math.max(2, Math.round(span * dpr)), band = 3;
      const edge = (side: number, y: number) => { const q = y / hem; return s.top + (s.bot[side] - s.top) * q * q + Math.sin(q * Math.PI) * 5 + q * 7; };

      // The apron of the stage with the glow of the footlights along its lip.
      const fl = ctx.createLinearGradient(0, h - FLOOR, 0, h);
      fl.addColorStop(0, "#2a1509"); fl.addColorStop(0.18, "#160b06"); fl.addColorStop(1, "#070403");
      ctx.fillStyle = fl; ctx.fillRect(0, h - FLOOR, w, FLOOR);
      ctx.fillStyle = "rgba(255,196,128,0.5)"; ctx.fillRect(0, h - FLOOR, w, 1.2);

      for (const side of [0, 1]) {
        ctx.save();
        if (side) { ctx.translate(w, 0); ctx.scale(-1, 1); }
        // Shadow thrown onto the stage behind the leading edge.
        ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.85)"; ctx.shadowBlur = 34 * dpr; ctx.shadowOffsetX = (side ? -16 : 16) * dpr;
        ctx.beginPath(); ctx.moveTo(-20, -10); ctx.lineTo(edge(side, 0), -10);
        for (let y = 0; y <= hem; y += 24) ctx.lineTo(edge(side, y), y);
        ctx.lineTo(-20, hem); ctx.closePath(); ctx.fillStyle = "#1a0406"; ctx.fill(); ctx.restore();
        for (let y = 0; y < hem; y += band) {
          const e = edge(side, y + band / 2) + 10;
          ctx.drawImage(bufs[side], 0, y * dpr, cols, band * dpr, -10, y, e, band + 0.6);
        }
        ctx.restore();
      }

      // Stage light on the cloth: dark up under the pelmet, warm where the footlights reach.
      ctx.save(); ctx.globalCompositeOperation = "source-atop";
      const up = ctx.createLinearGradient(0, 0, 0, hem);
      up.addColorStop(0, "rgba(0,0,0,0.62)"); up.addColorStop(0.22, "rgba(0,0,0,0.3)"); up.addColorStop(0.55, "rgba(0,0,0,0.04)"); up.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = up; ctx.fillRect(0, 0, w, hem - 14);
      ctx.globalCompositeOperation = "source-atop";
      const warm = ctx.createLinearGradient(0, hem, 0, hem * 0.45);
      warm.addColorStop(0, "rgba(255,168,96,0.17)"); warm.addColorStop(0.35, "rgba(255,150,90,0.07)"); warm.addColorStop(1, "rgba(255,150,90,0)");
      ctx.fillStyle = warm; ctx.fillRect(0, hem * 0.45, w, hem * 0.55 - 14);
      ctx.restore();

      // The pelmet, and its shadow on the curtains below.
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 26 * dpr; ctx.shadowOffsetY = 12 * dpr;
      ctx.drawImage(top, 0, 0, w, VH + 4); ctx.restore();

      // The pull cord: a twisted rope and a tassel that hangs in front of the right-hand curtain.
      const y0 = VH - 26, y1 = Math.min(h * 0.56, VH + 290) + s.drop;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 8 * dpr; ctx.shadowOffsetX = -6 * dpr; ctx.shadowOffsetY = 5 * dpr;
      ctx.lineWidth = 6.2; ctx.strokeStyle = "#7a5516"; ctx.beginPath(); ctx.moveTo(cordX, y0); ctx.lineTo(cordX, y1); ctx.stroke(); ctx.restore();
      ctx.lineWidth = 1.7; ctx.lineCap = "round";
      for (let y = y0 + ((s.drop % 5) + 5) % 5; y < y1 - 2; y += 5) {
        ctx.strokeStyle = "#f6dc93"; ctx.beginPath(); ctx.moveTo(cordX - 2.6, y + 2.8); ctx.lineTo(cordX + 2, y - 0.8); ctx.stroke();
        ctx.strokeStyle = "rgba(60,36,4,0.7)"; ctx.beginPath(); ctx.moveTo(cordX - 2.3, y + 4.6); ctx.lineTo(cordX + 2.3, y + 0.8); ctx.stroke();
      }
      ctx.translate(cordX, y1); ctx.rotate(s.swing); ctx.scale(1.3, 1.3);
      ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 10 * dpr; ctx.shadowOffsetX = -7 * dpr; ctx.shadowOffsetY = 6 * dpr;
      const ball = ctx.createRadialGradient(-3, 3, 1, 0, 7, 10);
      ball.addColorStop(0, "#fff0b8"); ball.addColorStop(0.5, "#d9a544"); ball.addColorStop(1, "#6f4a10");
      ctx.fillStyle = ball; ctx.beginPath(); ctx.arc(0, 7, 8.6, 0, Math.PI * 2); ctx.fill();
      const skirt = ctx.createLinearGradient(-10, 0, 10, 0);
      skirt.addColorStop(0, "#6f4a10"); skirt.addColorStop(0.3, "#e9bf62"); skirt.addColorStop(0.5, "#fff0b8"); skirt.addColorStop(0.75, "#c8943a"); skirt.addColorStop(1, "#5c3c0a");
      ctx.fillStyle = skirt; ctx.beginPath(); ctx.moveTo(-6, 15); ctx.lineTo(6, 15); ctx.lineTo(10.5, 56); ctx.quadraticCurveTo(0, 60, -10.5, 56); ctx.closePath(); ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(70,42,4,0.55)";
      for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 1.7, 20); ctx.lineTo(i * 3.1, 57); ctx.stroke(); }
      ctx.fillStyle = "#8a2a1c"; ctx.fillRect(-6.6, 14, 13.2, 4.6); ctx.fillStyle = "rgba(255,220,200,0.35)"; ctx.fillRect(-6.6, 14, 13.2, 1.2);
    };

    let raf = 0, last = 0, seen = true, t0 = 0, demo = true, demoAt = 380, isOpen = false;
    const goal = () => (isOpen ? away : shut);
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      if (demo && t > demoAt) { isOpen = !isOpen; s.target = goal(); s.dv += 520; demoAt = t + (isOpen ? HOLD_MS : 2300); setOpen(isOpen); }
      s.tv += (15 * (s.target - s.top) - 7.4 * s.tv) * dt; s.top += s.tv * dt;
      for (const i of [0, 1]) {
        const draft = Math.sin(t / (1700 + i * 420) + i * 2) * 60; // a little air from the wings keeps the hems alive
        s.bv[i] += ((20 - i * 3) * (s.top - s.bot[i]) - (2.5 + i * 0.5) * s.bv[i] + draft) * dt; s.bot[i] += s.bv[i] * dt;
      }
      s.dv += (-190 * s.drop - 9 * s.dv) * dt; s.drop += s.dv * dt;
      s.sv += (-40 * s.swing - 1.6 * s.sv - s.dv * 0.004) * dt; s.swing += s.sv * dt;
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const settle = () => { s.top = s.target; s.tv = 0; s.bot = [s.top, s.top]; s.bv = [0, 0]; s.drop = 0; s.dv = 0; s.swing = 0; s.sv = 0; draw(); };

    size();
    if (reduce) { isOpen = true; s.target = goal(); settle(); }
    else { s.target = s.top = shut; s.bot = [shut, shut]; draw(); wake(); }
    api.current = {
      set: (o) => { demo = false; isOpen = o; s.target = goal(); s.dv += 560; s.sv += 0.5; if (reduce) settle(); else wake(); },
    };

    const ro = new ResizeObserver(() => { const was = s.target === shut; size(); s.target = was ? shut : away; if (reduce) settle(); else { s.top = s.target; s.bot = [s.top, s.top]; draw(); } });
    ro.observe(box);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const toggle = (next: boolean) => {
    setOpen(next); api.current?.set(next);
    window.setTimeout(() => (next ? first.current : cord.current)?.focus(), next ? 500 : 0);
  };

  return (
    <div
      ref={stage}
      onKeyDown={(e) => { if (e.key === "Escape" && open) toggle(false); }}
      className="relative h-[640px] w-full overflow-hidden bg-[#070405] sm:h-[720px]"
    >
      {/* The stage: a spotlight, the photograph and the dialog that the curtains uncover. */}
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(40%_56%_at_50%_52%,#1c110d_0%,#0c0706_55%,#070405_100%)]" />
      <div className="absolute left-1/2 top-[7%] aspect-[2/3] h-[70%] -translate-x-1/2 lg:top-[4%] lg:h-[96%]">
        <img src={show.src} alt={show.alt} width={1100} height={1650} loading="eager" className="h-full w-full object-cover [mask-image:radial-gradient(50%_52%_at_50%_50%,#000_52%,transparent_100%)]" />
      </div>
      <div aria-hidden="true" className="absolute left-1/2 top-0 h-[92%] w-[46%] -translate-x-1/2 bg-gradient-to-b from-amber-100/20 to-amber-100/0 blur-2xl [clip-path:polygon(44%_0,56%_0,86%_100%,14%_100%)]" />
      <div
        role="dialog" aria-modal="true" aria-labelledby="velvet-curtain-title"
        className={`absolute inset-x-0 bottom-[7%] mx-auto flex w-[54%] max-w-[300px] flex-col items-center text-center transition-[visibility] lg:inset-x-auto lg:bottom-auto lg:left-[23%] lg:top-1/2 lg:mx-0 lg:w-[250px] lg:-translate-y-1/2 lg:items-start lg:text-left ${open ? "visible" : "invisible delay-700"} motion-reduce:delay-0`}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-200/90">{show.kicker}</p>
        <h2 id="velvet-curtain-title" className="mt-2 font-serif text-[22px] italic leading-[1.05] text-stone-50 sm:text-[32px] lg:text-[42px]">{show.title}</h2>
        <p className="mt-3 hidden text-[13px] leading-5 text-stone-300 lg:block">{show.line}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 lg:mt-6 lg:justify-start">
          <button ref={first} type="button" className="h-10 rounded-full bg-amber-300 px-5 text-[13px] font-semibold text-stone-950 outline-none transition-colors hover:bg-amber-200 focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070405] motion-reduce:transition-none">{show.primary}</button>
          <button type="button" onClick={() => toggle(false)} className="h-10 rounded-full px-1 text-[13px] font-medium text-stone-200 underline decoration-stone-500 underline-offset-4 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-amber-200">{show.secondary}</button>
        </div>
      </div>
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      <button
        ref={cord} type="button" aria-expanded={open} aria-label={open ? "Close the curtains" : "Open the curtains"}
        onClick={() => toggle(!open)}
        className="absolute right-[6.2%] top-[10%] h-[58%] w-12 translate-x-1/2 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
      />
    </div>
  );
}

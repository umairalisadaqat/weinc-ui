import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here.
const LABEL = "Book a fitting";
const CAPTION = "Press it. The glass flattens, then rings.";
const PHOTO = "https://images.pexels.com/photos/39325164/pexels-photo-39325164.jpeg?auto=compress&cs=tinysrgb&w=1000";
const PHOTO_ALT = "Woman in an orange halter top and lime skirt seated against a deep orange studio backdrop";
const FOCUS = { x: 0.5, y: 1 }; // which part of the photo stays in frame
const BEND = 36; // how far the rim bends the picture, in pixels
const SMOKE = 0.8; // 1 is clear glass, lower is darker
const RES = 2; // canvas pixels per CSS pixel

export default function ThickGlassPillButton() {
  const card = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const squash = useRef<HTMLSpanElement>(null);
  const shadow = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const cardEl = card.current, img = photo.current, btn = button.current, cv = canvas.current, sq = squash.current, sh = shadow.current;
    if (!cardEl || !img || !btn || !cv || !sq || !sh) return;
    const ctx = cv.getContext("2d");
    const bg = document.createElement("canvas");
    const bgx = bg.getContext("2d", { willReadFrequently: true });
    if (!ctx || !bgx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0, PAD = 0, bgW = 0, bgH = 0;
    let box = { bx: 0, by: 0, bw: 0, bh: 0, cw: 0, ch: 0 };
    let alpha = new Float32Array(0), gx = new Float32Array(0), gy = new Float32Array(0), rim = new Float32Array(0), bend = new Float32Array(0), gloss = new Float32Array(0);
    let out: ImageData | null = null;
    let broken = false;

    // One pass over the pill: how far each pixel is from the edge and which way the edge faces.
    const measure = () => {
      const c = cardEl.getBoundingClientRect(), b = btn.getBoundingClientRect();
      if (!b.width || !c.width) return;
      box = { bx: b.left - c.left, by: b.top - c.top, bw: b.width, bh: b.height, cw: c.width, ch: c.height };
      W = Math.round(b.width * RES); H = Math.round(b.height * RES);
      PAD = Math.round((BEND + 10) * RES);
      bgW = W + PAD * 2; bgH = H + PAD * 2;
      cv.width = W; cv.height = H; bg.width = bgW; bg.height = bgH;
      const n = W * H;
      alpha = new Float32Array(n); gx = new Float32Array(n); gy = new Float32Array(n); rim = new Float32Array(n); bend = new Float32Array(n); gloss = new Float32Array(n);
      out = ctx.createImageData(W, H);
      const r = H / 2, half = W / 2 - r, bevel = r * 0.58;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const px = x + 0.5 - W / 2, py = y + 0.5 - H / 2;
          const q = Math.abs(px) - half;
          let d: number, nx: number, ny: number;
          if (q <= 0) { d = r - Math.abs(py); nx = 0; ny = py < 0 ? -1 : 1; }
          else { const l = Math.hypot(q, py) || 1; d = r - l; nx = (px < 0 ? -q : q) / l; ny = py / l; }
          const i = y * W + x;
          alpha[i] = Math.max(0, Math.min(1, d + 0.5));
          gx[i] = nx; gy[i] = ny;
          const t = Math.max(0, Math.min(1, 1 - d / bevel)); // 1 at the edge, 0 on the flat top
          rim[i] = t;
          bend[i] = Math.pow(t, 1.7);
          gloss[i] = Math.max(0, 1 - (y / H) * 2.4) * (1 - t) * 0.5;
        }
      }
    };

    const state = { press: 0, vel: 0, target: 0, lx: -0.45, ly: -0.89, tlx: -0.45, tly: -0.89, ring: -1, rx: 0, ry: 0, zoom: 1.05 };

    const paint = (now: number) => {
      if (!out || broken || !img.complete || !img.naturalWidth) return;
      const { bx, by, bw, bh, cw, ch } = box;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const s0 = Math.max(cw / iw, ch / ih), z = state.zoom;
      const w = iw * s0, h = ih * s0;
      const x0 = (cw - w) * FOCUS.x, y0 = (ch - h) * FOCUS.y;
      bgx.setTransform(RES, 0, 0, RES, PAD - bx * RES, PAD - by * RES);
      bgx.drawImage(img, cw / 2 + (x0 - cw / 2) * z, ch / 2 + (y0 - ch / 2) * z, w * z, h * z);
      let src: Uint8ClampedArray;
      try { src = bgx.getImageData(0, 0, bgW, bgH).data; } catch { broken = true; setLive(false); return; }
      const dst = out.data;
      const S = BEND * RES * (1 - 0.55 * state.press);
      const lx = state.lx, ly = state.ly;
      const ringOn = state.ring >= 0;
      const ringR = state.ring * RES, ringAmp = ringOn ? 6 * RES * Math.max(0, 1 - state.ring / (bw * 0.9)) : 0;
      const cx = W / 2, cy = H / 2, mag = 0.94 + 0.04 * state.press;
      const maxX = bgW - 1, maxY = bgH - 1;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * W + x, o = i * 4, a = alpha[i];
          if (a <= 0) { dst[o + 3] = 0; continue; }
          const nx = gx[i], ny = gy[i], t = rim[i];
          let m = S * bend[i];
          let ox = 0, oy = 0;
          if (ringOn) {
            const dx = x - state.rx, dy = y - state.ry, dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const k = (dist - ringR) / (19 * RES);
            if (k > -1 && k < 1) { const wv = Math.sin(k * Math.PI) * ringAmp; ox = (dx / dist) * wv; oy = (dy / dist) * wv; }
          }
          const fx = PAD + cx + (x - cx) * mag + ox, fy = PAD + cy + (y - cy) * mag + oy;
          // Red, green and blue bend by slightly different amounts, which is what puts colour in the rim.
          let X = fx - nx * m * 0.86, Y = fy - ny * m * 0.86;
          const r = src[((Y < 0 ? 0 : Y > maxY ? maxY : Y) | 0) * bgW * 4 + ((X < 0 ? 0 : X > maxX ? maxX : X) | 0) * 4];
          X = fx - nx * m; Y = fy - ny * m;
          const g = src[((Y < 0 ? 0 : Y > maxY ? maxY : Y) | 0) * bgW * 4 + ((X < 0 ? 0 : X > maxX ? maxX : X) | 0) * 4 + 1];
          X = fx - nx * m * 1.16; Y = fy - ny * m * 1.16;
          const b = src[((Y < 0 ? 0 : Y > maxY ? maxY : Y) | 0) * bgW * 4 + ((X < 0 ? 0 : X > maxX ? maxX : X) | 0) * 4 + 2];
          const facing = nx * lx + ny * ly; // 1 where the edge faces the light
          const edge = t > 0.7 ? (t - 0.7) / 0.3 : 0;
          const lit = facing > 0 ? facing * facing : 0;
          const back = facing < -0.2 ? (-facing - 0.2) * 1.25 : 0;
          const spec = edge * Math.sqrt(edge) * (lit * 250 + back * back * 150) + (t > 0.9 ? (t - 0.9) * 10 * (50 + lit * 170) : 0) + gloss[i] * 64;
          // A pale crescent just inside the far rim, where light leaves the glass, and a thin dark line under the lit edge.
          const inner = t > 0.35 && t < 0.8 ? Math.sin(((t - 0.35) / 0.45) * Math.PI) : 0;
          const glow = facing < 0 ? inner * facing * facing * 64 : 0;
          const line = t > 0.62 && t < 0.86 ? Math.sin(((t - 0.62) / 0.24) * Math.PI) * lit * 0.22 : 0;
          const dark = SMOKE * (1 - line);
          const add = spec + glow;
          dst[o] = r * dark + add; dst[o + 1] = g * dark + add; dst[o + 2] = b * dark + add * 0.96; dst[o + 3] = a * 255;
        }
      }
      ctx.putImageData(out, 0, 0);
      setLive(true);
      void now;
    };

    let raf = 0, last = 0, start = 0, seen = true, touched = 0, nextDemo = 1300, demoUp = 0;
    const pressDown = (x: number, y: number) => { state.target = 1; state.rx = x * RES; state.ry = y * RES; state.ring = -1; };
    const pressUp = () => { if (state.target === 1) { state.target = 0; state.ring = 0; } };

    const frame = (now: number) => {
      raf = 0;
      if (!start) { start = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - start;
      // A soft spring carries the press, so the glass overshoots a little on release.
      const k = 380, damp = 17;
      state.vel += (k * (state.target - state.press) - damp * state.vel) * dt;
      state.press += state.vel * dt;
      if (state.ring >= 0) { state.ring += dt * 430; if (state.ring > box.bw * 0.95) state.ring = -1; }
      state.zoom = 1.06 + 0.035 * Math.sin(t / 2600);
      if (now - touched > 2600) {
        const a = -2.0 + 0.5 * Math.sin(t / 1900);
        state.tlx = Math.cos(a); state.tly = Math.sin(a);
        if (t > nextDemo && state.target === 0) { pressDown(box.bw * (0.3 + 0.4 * Math.random()), box.bh / 2); demoUp = t + 240; nextDemo = t + 3000; }
        if (demoUp && t > demoUp) { demoUp = 0; pressUp(); }
      }
      state.lx += (state.tlx - state.lx) * Math.min(1, dt * 7); state.ly += (state.tly - state.ly) * Math.min(1, dt * 7);
      const p = state.press;
      sq.style.transform = `translateY(${(p * 2.5).toFixed(2)}px) scale(${(1 + p * 0.028).toFixed(4)}, ${(1 - p * 0.075).toFixed(4)})`;
      sh.style.opacity = (1 - p * 0.45).toFixed(3);
      sh.style.transform = `translateY(${(-p * 5).toFixed(2)}px) scale(${(1 - p * 0.04).toFixed(3)})`;
      img.style.transform = `scale(${state.zoom.toFixed(4)})`;
      paint(now);
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    const still = () => { state.zoom = 1.06; img.style.transform = "scale(1.06)"; paint(0); };
    const setup = () => { measure(); if (reduce) still(); else wake(); };
    setup();
    if (!img.complete) img.addEventListener("load", setup);

    const local = (e: PointerEvent) => { const b = btn.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top, b }; };
    const onMove = (e: PointerEvent) => {
      const c = cardEl.getBoundingClientRect(), b = btn.getBoundingClientRect();
      const dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2) - 30;
      const l = Math.hypot(dx, dy) || 1;
      state.tlx = dx / l; state.tly = dy / l; touched = performance.now();
      void c;
      if (reduce) { state.lx = state.tlx; state.ly = state.tly; still(); }
    };
    const onDown = (e: PointerEvent) => {
      touched = performance.now(); const p = local(e); pressDown(p.x, p.y);
      if (reduce) { state.press = 1; sq.style.transform = "translateY(2px) scale(1.02, 0.94)"; still(); }
    };
    const onUp = () => {
      touched = performance.now(); pressUp();
      if (reduce) { state.press = 0; state.ring = -1; sq.style.transform = ""; still(); }
    };
    const onKeyDown = (e: KeyboardEvent) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { touched = performance.now(); pressDown(box.bw / 2, box.bh / 2); if (reduce) { state.press = 1; still(); } } };
    const onKeyUp = (e: KeyboardEvent) => { if (e.key === " " || e.key === "Enter") onUp(); };
    cardEl.addEventListener("pointermove", onMove);
    btn.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    btn.addEventListener("keydown", onKeyDown);
    btn.addEventListener("keyup", onKeyUp);
    btn.addEventListener("blur", onUp);

    const ro = new ResizeObserver(setup);
    ro.observe(cardEl);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cardEl);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      img.removeEventListener("load", setup);
      cardEl.removeEventListener("pointermove", onMove);
      btn.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      btn.removeEventListener("keydown", onKeyDown);
      btn.removeEventListener("keyup", onKeyUp);
      btn.removeEventListener("blur", onUp);
      ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="flex min-h-[660px] w-full flex-col items-center justify-center bg-[#ece8e1] px-4 py-12">
      <div ref={card} className="relative h-[430px] w-[300px] overflow-hidden rounded-[30px] bg-[#c9461c] shadow-[0_40px_70px_-30px_rgba(74,32,10,0.55),0_2px_0_rgba(255,255,255,0.6)_inset] sm:h-[480px] sm:w-[350px]">
        <img ref={photo} src={PHOTO} alt={PHOTO_ALT} crossOrigin="anonymous" width={1000} height={1498} className="absolute inset-0 h-full w-full object-cover will-change-transform" style={{ objectPosition: `${FOCUS.x * 100}% ${FOCUS.y * 100}%` }} />

        <div className="absolute inset-x-0 bottom-7 flex justify-center">
          <span className="relative block h-[76px] w-[236px] sm:w-[268px]">
            {/* The shadow the glass throws on the photo, and the light it gathers underneath. */}
            <span ref={shadow} aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full shadow-[0_26px_34px_-10px_rgba(50,10,0,0.7),0_9px_12px_-3px_rgba(50,10,0,0.55)]" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-10 -bottom-2.5 h-4 rounded-full bg-[#ffe6c2] opacity-70 blur-[7px]" />
            <span ref={squash} className="absolute inset-0 block will-change-transform">
              <button
                ref={button}
                type="button"
                onClick={() => setCount((c) => c + 1)}
                className={`group relative flex h-full w-full touch-manipulation select-none items-center justify-center gap-2.5 overflow-hidden rounded-full text-[17px] font-semibold tracking-tight text-white outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#c9461c] ${live ? "" : "border border-white/50 bg-black/25 backdrop-blur-md"}`}
              >
                <canvas ref={canvas} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${live ? "opacity-100" : "opacity-0"}`} />
                <span className="relative [text-shadow:0_1px_2px_rgba(60,20,0,0.75),0_0_14px_rgba(60,20,0,0.45)]">{LABEL}</span>
                <svg viewBox="0 0 20 20" aria-hidden="true" className="relative h-[18px] w-[18px] drop-shadow-[0_1px_2px_rgba(60,20,0,0.75)] transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
              </button>
            </span>
          </span>
        </div>
      </div>
      <p className="mt-7 text-center text-[13px] font-medium tracking-wide text-stone-600">{CAPTION}</p>
      <p className="sr-only" aria-live="polite">{count > 0 ? `Fitting request sent ${count} ${count === 1 ? "time" : "times"}.` : ""}</p>
    </div>
  );
}

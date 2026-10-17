import { useEffect, useRef, useState } from "react";

// The letter cut into the stamp, and the wax once it has cooled and while it is molten (red, green, blue).
const MONOGRAM = "R";
const COOL = [134, 18, 28];
const HOT = [214, 54, 30];
const OPEN_NOTE = "Still molten. Press to seal the letter.";
const SEALED_NOTE = "Sealed. Press again to melt it and start over.";
const BOX = 150; // canvas edge in CSS pixels
const DIE = 33; // radius of the stamp face

const hash = (x: number, y: number) => { const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return v - Math.floor(v); };
const noise = (x: number, y: number) => {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
};
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const boxBlur = (src: Float32Array, n: number, r: number) => {
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length), k = 1 / (2 * r + 1);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { let s = 0; for (let i = -r; i <= r; i++) s += src[y * n + clamp(x + i, 0, n - 1)]; tmp[y * n + x] = s * k; }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { let s = 0; for (let i = -r; i <= r; i++) s += tmp[clamp(y + i, 0, n - 1) * n + x]; out[y * n + x] = s * k; }
  return out;
};

// Two wax shapes are modelled once as height maps: the molten bead and the stamped seal. Every frame blends them.
function pourWax(S: number) {
  const n = Math.round(BOX * S), len = n * n, c = BOX / 2;
  const hA = new Float32Array(len), hB = new Float32Array(len), dA = new Float32Array(len), dB = new Float32Array(len), marble = new Float32Array(len);

  const tc = document.createElement("canvas"); tc.width = n; tc.height = n;
  const tx = tc.getContext("2d");
  let relief = new Float32Array(len);
  if (tx) {
    tx.font = `700 ${46 * S}px "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif`;
    tx.textAlign = "center"; tx.textBaseline = "alphabetic"; tx.fillStyle = "#000";
    const box = tx.measureText(MONOGRAM), up = box.actualBoundingBoxAscent || 30 * S, dn = box.actualBoundingBoxDescent || 0;
    tx.fillText(MONOGRAM, (c + 1.5) * S, (c - 1) * S + (up - dn) / 2, 44 * S);
    const px = tx.getImageData(0, 0, n, n).data;
    for (let i = 0; i < len; i++) relief[i] = px[i * 4 + 3] / 255;
    relief = boxBlur(boxBlur(relief, n, Math.max(1, Math.round(0.6 * S))), n, 1);
  }
  let seed = 5;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const pits = Array.from({ length: 3 }, () => { const a = rand() * 6.283, r = 40 + rand() * 7; return [c + Math.cos(a) * r, c + Math.sin(a) * r, 0.6 + rand() * 0.5]; });

  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const px = (x + 0.5) / S, py = (y + 0.5) / S, i = y * n + x;
    const ox = px - c, oy = py - c, r = Math.hypot(ox, oy), th = Math.atan2(oy, ox);
    const rA = 36 * (1 + 0.045 * Math.cos(2 * th + 1) + 0.03 * Math.cos(3 * th + 4));
    let lobe = th - 2.2; if (lobe < -Math.PI) lobe += Math.PI * 2;
    const rB = 53 * (1 + 0.04 * Math.cos(2 * th + 0.6) + 0.045 * Math.cos(3 * th + 2.1) + 0.028 * Math.cos(5 * th + 4) + 0.016 * Math.cos(8 * th + 1)) + 6.5 * Math.exp(-(lobe * lobe) / 0.07) + 3 * Math.exp(-((th + 0.6) * (th + 0.6)) / 0.05);
    dA[i] = rA - r; dB[i] = rB - r;
    const tA = clamp(dA[i] / 31);
    hA[i] = dA[i] > 0 ? 14 * Math.sqrt(1 - (1 - tA) * (1 - tA)) : 0;
    if (dB[i] > -1) {
      const tR = clamp(dB[i] / 8.5);
      const lump = 1 + 0.24 * (noise(px / 13 + 4, py / 13) - 0.5) + 0.04 * (noise(px / 5, py / 5 + 8) - 0.5);
      let rim = 8.8 * Math.sqrt(1 - (1 - tR) * (1 - tR)) * lump;
      for (const [bx, by, br] of pits) rim -= 1.5 * Math.exp(-((px - bx) * (px - bx) + (py - by) * (py - by)) / (br * br));
      const rd = Math.hypot(ox - 1.5, oy + 1);
      let wall = clamp((DIE + 1.3 - rd) / 2.6); wall = wall * wall * (3 - 2 * wall);
      const floor = 3.3 + 1.7 * Math.exp(-((rd - (DIE - 5.5)) * (rd - (DIE - 5.5))) / 1.5) + 3 * relief[i] + 0.3 * noise(px / 6, py / 6) ;
      hB[i] = rim * (1 - wall) + floor * wall;
    }
    // Slow streaks, as if two reds were stirred together in the spoon.
    marble[i] = noise(px / 26 + 2.5 * noise(px / 40, py / 40), py / 9 + 3) - 0.5;
  }
  // Soft shade inside the stamped hollow, taken from how far each point sits below its surroundings.
  const wide = boxBlur(hB, n, Math.max(2, Math.round(3.2 * S))), ao = new Float32Array(len);
  for (let i = 0; i < len; i++) ao[i] = clamp(1 - 0.085 * (wide[i] - hB[i]), 0.5, 1.06);
  return { n, hA, hB, dA, dB, marble, ao };
}

export default function WaxSealButton() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const stamp = useRef<HTMLDivElement>(null);
  const stampShadow = useRef<HTMLDivElement>(null);
  const waxShadow = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [sealed, setSealed] = useState(false);
  const sealedRef = useRef(false);
  const api = useRef<{ press: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, st = stage.current, btn = button.current;
    if (!cv || !st || !btn) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const S = Math.min(3.2, (window.devicePixelRatio || 1) * (window.innerWidth >= 1024 ? 1.9 : 1.5)); // matches the enlarged size on wide screens
    const P = pourWax(S), n = P.n, len = n * n;
    cv.width = n; cv.height = n;
    const img = ctx.createImageData(n, n), out = img.data, H = new Float32Array(len);

    // m: 0 is the molten bead, 1 the stamped seal. heat: 1 is liquid. down: 1 means the stamp is resting on the wax.
    const s = { m: 0, heat: 1, down: 0, dv: 0, mTo: 0, heatTo: 1, stampOn: false, since: 0, finger: false, melting: false, lx: 0, ly: 0, lxTo: 0, lyTo: 0 };
    let drawn = "";

    const draw = () => {
      const key = `${s.m.toFixed(3)}|${s.heat.toFixed(3)}|${s.lx.toFixed(2)}|${s.ly.toFixed(2)}`;
      if (key !== drawn) {
        drawn = key;
        const { hA, hB, dA, dB, marble, ao } = P, m = s.m, q = s.heat;
        const edgeW = 8.5 + 22 * (1 - m), edgeH = 9.4 + 5 * (1 - m);
        for (let i = 0; i < len; i++) {
          const d = dA[i] + (dB[i] - dA[i]) * m;
          if (d <= 0) { H[i] = 0; continue; }
          const t = d >= edgeW ? 0 : 1 - d / edgeW, cap = edgeH * Math.sqrt(1 - t * t), h = hA[i] + (hB[i] - hA[i]) * m;
          H[i] = h < cap ? h : cap;
        }
        let Lx = -0.44 + s.lx, Ly = -0.6 + s.ly; const Lz = 0.68, ll = 1 / Math.hypot(Lx, Ly, Lz); Lx *= ll; Ly *= ll;
        const lz = Lz * ll, hl = 1 / Math.hypot(Lx, Ly, lz + 1), hx = Lx * hl, hy = Ly * hl, hz = (lz + 1) * hl;
        const r0 = COOL[0] + (HOT[0] - COOL[0]) * q, g0 = COOL[1] + (HOT[1] - COOL[1]) * q, b0 = COOL[2] + (HOT[2] - COOL[2]) * q;
        const tight = 38 + 50 * q, shine = 0.66 + 0.34 * q;
        for (let y = 0, i = 0, j = 0; y < n; y++) for (let x = 0; x < n; x++, i++, j += 4) {
          const h = H[i];
          if (h <= 0 || x === 0 || y === 0 || x === n - 1 || y === n - 1) { out[j + 3] = 0; continue; }
          const ax = -(H[i + 1] - H[i - 1]) * 0.5 * S, ay = -(H[i + n] - H[i - n]) * 0.5 * S;
          const nz = 1 / Math.sqrt(ax * ax + ay * ay + 1), nx = ax * nz, ny = ay * nz;
          const dif = nx * Lx + ny * Ly + nz * lz;
          const occ = 1 + (ao[i] - 1) * m;
          // Wax lets a little light through, so thin edges and shaded sides never go fully dark.
          const thin = h < 3.2 ? (1 - h / 3.2) * 0.5 : 0;
          const shade = (0.3 + 0.2 * thin + 0.78 * (dif > 0 ? dif : dif * 0.25)) * occ;
          const mb = 1 + marble[i] * 0.2;
          let sp = nx * hx + ny * hy + nz * hz; sp = sp > 0 ? Math.pow(sp, tight) * shine : 0;
          // A softer second light, and the pale room mirrored where the surface turns away.
          const rx = 2 * nz * nx - 0.5, ry = 2 * nz * ny - 0.15, inv = 1 - nz;
          sp += 0.16 * shine * Math.exp(-(rx * rx + ry * ry) * 7) + inv * inv * 0.3;
          sp *= occ;
          out[j] = (r0 + thin * 60) * mb * shade + 255 * sp;
          out[j + 1] = (g0 + thin * 34) * mb * shade + 232 * sp;
          out[j + 2] = (b0 + thin * 8) * mb * shade + 214 * sp;
          const a = h * S * 1.3; out[j + 3] = a > 1 ? 255 : a * 255;
        }
        ctx.putImageData(img, 0, 0);
      }
      const up = 1 - s.down;
      if (stamp.current) {
        stamp.current.style.opacity = clamp(s.down * 3).toFixed(3);
        stamp.current.style.transform = `translate3d(${(up * 34).toFixed(1)}px,${(up * -58).toFixed(1)}px,0) scale(${(1 + up * 1.25 - clamp(s.down - 1, -1, 0.1) * 0.1).toFixed(3)})`;
        stamp.current.style.filter = up > 0.02 ? `blur(${(up * 5).toFixed(1)}px)` : "none";
      }
      if (stampShadow.current) {
        stampShadow.current.style.opacity = clamp(s.down * 1.6 - 0.1).toFixed(3);
        stampShadow.current.style.transform = `translate3d(${(4 + up * 46).toFixed(1)}px,${(6 + up * 62).toFixed(1)}px,0) scale(${(1 + up * 0.5).toFixed(3)})`;
      }
      if (waxShadow.current) waxShadow.current.style.transform = `translate3d(1.5px,3px,0) scale(${(0.68 + 0.32 * s.m).toFixed(3)})`;
      if (glow.current) glow.current.style.opacity = (s.heat * 0.5).toFixed(3);
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, nextDemo = 1050;
    const begin = (now: number) => {
      if (s.stampOn || s.melting) return;
      if (sealedRef.current) { s.melting = true; s.heatTo = 1; sealedRef.current = false; setSealed(false); }
      else { s.stampOn = true; s.since = now; sealedRef.current = true; setSealed(true); }
    };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      if (now - touched > 5200) {
        s.lxTo = 0.2 * Math.sin(t / 2300); s.lyTo = 0.1 * Math.cos(t / 3100);
        if (t > nextDemo) { begin(now); nextDemo = t + (sealedRef.current ? 4300 : 1500); }
      }
      // The stamp comes down on a spring; once it lands the wax is squeezed flat and out past its edge.
      const dTo = s.stampOn ? 1 : 0;
      s.dv += ((s.stampOn ? 620 : 210) * (dTo - s.down) - (s.stampOn ? 34 : 24) * s.dv) * dt; s.down += s.dv * dt;
      if (s.stampOn && s.down > 0.9) s.mTo = 1;
      if (s.stampOn && !s.finger && now - s.since > 640 && s.m > 0.98) { s.stampOn = false; s.heatTo = 0; }
      if (s.melting && s.heat > 0.75) s.mTo = 0;
      if (s.melting && s.m < 0.01) s.melting = false;
      s.m += (s.mTo - s.m) * Math.min(1, dt * (s.mTo === 1 ? 26 : 3.4));
      if (Math.abs(s.mTo - s.m) < 0.002) s.m = s.mTo;
      s.heat += (s.heatTo - s.heat) * Math.min(1, dt * (s.heatTo === 1 ? 5 : 1.5));
      s.lx += (s.lxTo - s.lx) * Math.min(1, dt * 5); s.ly += (s.lyTo - s.ly) * Math.min(1, dt * 5);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    // With motion reduced there is no stamp travel: the wax is simply shown sealed or molten.
    const still = () => { s.m = sealedRef.current ? 1 : 0; s.heat = sealedRef.current ? 0 : 1; s.down = 0; s.lx = s.lxTo; s.ly = s.lyTo; draw(); };
    api.current = { press: () => { touched = performance.now(); if (reduce) { sealedRef.current = !sealedRef.current; setSealed(sealedRef.current); still(); } else { begin(touched); wake(); } } };
    if (reduce) { sealedRef.current = true; setSealed(true); still(); } else wake();

    const onMove = (e: PointerEvent) => {
      touched = performance.now();
      const b = btn.getBoundingClientRect();
      s.lxTo = clamp(((e.clientX - b.left) / b.width) * 2 - 1, -2, 2) * 0.16; s.lyTo = clamp(((e.clientY - b.top) / b.height) * 2 - 1, -2, 2) * 0.16;
      if (reduce) still();
    };
    const onDown = () => { s.finger = true; touched = performance.now(); };
    const onUp = () => { s.finger = false; };
    st.addEventListener("pointermove", onMove);
    btn.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      st.removeEventListener("pointermove", onMove); btn.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp);
      io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div ref={stage} className="relative flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[#17222d] px-4 py-16 sm:min-h-[800px]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_70%_at_36%_24%,#2a3a4a_0%,#17222d_58%,#0e161e_100%)]" />
      <div className="relative h-[212px] w-[320px] sm:my-14 sm:scale-150 lg:my-24 lg:scale-[1.9]">
        {/* The envelope: back face, the two side folds and the pointed flap the wax holds shut. */}
        <svg aria-hidden="true" viewBox="0 0 320 212" className="absolute inset-0 h-full w-full overflow-visible drop-shadow-[0_26px_30px_rgba(0,0,0,0.5)]">
          <defs>
            <linearGradient id="wax-seal-button-paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6efdf" /><stop offset="1" stopColor="#e2d7bf" /></linearGradient>
            <linearGradient id="wax-seal-button-flap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f3ebd9" /><stop offset="1" stopColor="#fbf6ea" /></linearGradient>
            <filter id="wax-seal-button-fibre" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="8" /><feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.34  0 0 0 0 0.2  0 0 0 0.7 -0.2" /><feComposite in2="SourceGraphic" operator="in" /></filter>
            <filter id="wax-seal-button-lift" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2.2" stdDeviation="2.4" floodColor="#3b2a12" floodOpacity="0.38" /></filter>
          </defs>
          <rect width="320" height="212" rx="3" fill="url(#wax-seal-button-paper)" />
          <path d="M0 212 L132 104 M320 212 L188 104" stroke="#8d7b58" strokeOpacity="0.4" strokeWidth="0.8" fill="none" />
          <path d="M0.8 212 L132.8 104 M319.2 212 L187.2 104" stroke="#fffaf0" strokeOpacity="0.8" strokeWidth="0.6" fill="none" transform="translate(0 1)" />
          <path d="M0 0 H320 L168 116 Q160 122 152 116 Z" fill="url(#wax-seal-button-flap)" filter="url(#wax-seal-button-lift)" />
          <rect width="320" height="212" rx="3" fill="#000" filter="url(#wax-seal-button-fibre)" opacity="0.5" />
          <rect x="0.4" y="0.4" width="319.2" height="211.2" rx="2.6" fill="none" stroke="#fffdf6" strokeOpacity="0.7" strokeWidth="0.8" />
        </svg>
        <div className="absolute left-1/2 top-[112px] h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2">
          <div ref={glow} aria-hidden="true" className="absolute inset-[18px] rounded-full bg-[#ff7a2e]/50 blur-[14px]" />
          <div ref={waxShadow} aria-hidden="true" className="absolute inset-[20px] rounded-full bg-[#2b0d08]/75 blur-[5px]" />
          <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
          <div ref={stampShadow} aria-hidden="true" className="absolute inset-[30px] rounded-full bg-black/55 blur-[9px]" style={{ opacity: 0 }} />
          {/* The stamp seen from above: a brass head with a turned walnut handle standing on it. */}
          <div ref={stamp} aria-hidden="true" className="absolute inset-[28px] rounded-full will-change-transform" style={{ opacity: 0 }}>
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_210deg,#5b3d0c,#f4dc8e_9%,#b38427_17%,#fff3bf_26%,#8a6218_37%,#5b3d0c_50%,#e3c160_60%,#9a7020_70%,#fbe9a8_79%,#7a5514_90%,#5b3d0c)] shadow-[inset_0_0_0_1px_rgba(60,36,4,0.8),inset_0_2px_2px_rgba(255,250,220,0.7),inset_0_-3px_4px_rgba(50,30,0,0.6)]" />
            <div className="absolute inset-[7px] rounded-full bg-[conic-gradient(from_30deg,#3e2907,#d9b755_14%,#6b4a12_30%,#f1d98a_48%,#4a3209_64%,#c9a544_82%,#3e2907)] shadow-[inset_0_1px_1px_rgba(255,245,200,0.6)]" />
            <div className="absolute inset-[15px] rounded-full bg-black/60 blur-[3px] translate-x-[2px] translate-y-[4px]" />
            <div className="absolute inset-[15px] rounded-full bg-[radial-gradient(circle_at_36%_30%,#c98952_0%,#8a4f26_34%,#55290f_68%,#2c1305_100%)] shadow-[inset_0_0_0_1px_rgba(30,12,2,0.7),inset_0_-5px_8px_rgba(0,0,0,0.5)]" />
            <div className="absolute inset-[15px] rounded-full bg-[repeating-radial-gradient(circle_at_50%_50%,rgba(40,16,2,0)_0px,rgba(40,16,2,0)_2.2px,rgba(40,16,2,0.28)_2.8px,rgba(40,16,2,0)_3.4px)]" />
            <div className="absolute left-[30%] top-[25%] h-[20%] w-[28%] -rotate-[28deg] rounded-full bg-white/70 blur-[3px]" />
          </div>
          <button
            ref={button}
            type="button"
            aria-pressed={sealed}
            onClick={() => api.current?.press()}
            className="absolute inset-[14px] cursor-pointer touch-manipulation select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#17222d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f1e9d6]"
          >
            <span className="sr-only">Seal the letter with wax</span>
          </button>
        </div>
      </div>
      <p aria-live="polite" className="relative mt-12 min-h-[20px] max-w-[320px] text-center font-serif text-[15px] italic text-[#b9c3cd] sm:mt-14 sm:max-w-none sm:text-[17px]">
        {sealed ? SEALED_NOTE : OPEN_NOTE}
      </p>
    </div>
  );
}

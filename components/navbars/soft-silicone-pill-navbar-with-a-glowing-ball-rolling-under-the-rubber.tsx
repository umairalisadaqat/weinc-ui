import { useEffect, useRef, useState } from "react";

// Edit the menu here. Four to six short words fit the pill at phone width.
const links = ["Work", "Studio", "Journal", "Shop", "Contact"];
const RUBBER = [238, 233, 223]; // the silicone, as red, green, blue
const GLOW = [255, 62, 104]; // the lit ball under it
const RES = 2; // canvas pixels per CSS pixel

export default function SoftSiliconePillNavbar() {
  const nav = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const items = useRef<(HTMLAnchorElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const api = useRef<{ go: (i: number, fromUser: boolean) => void } | null>(null);

  useEffect(() => {
    const el = nav.current, cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0;
    let base = new Float32Array(0), alpha = new Float32Array(0), grain = new Float32Array(0), height = new Float32Array(0), lit = new Float32Array(0), halo = new Float32Array(0);
    let out: ImageData | null = null;
    let centres: number[] = [];

    const s = { lead: 0, leadV: 0, trail: 0, trailV: 0, press: 0, pressV: 0, pressTo: 0, dent: 0, dentTo: 0, px: 0, py: 0, ready: false };

    const measure = () => {
      const b = el.getBoundingClientRect();
      if (!b.width) return;
      W = Math.round(b.width * RES); H = Math.round(b.height * RES);
      cv.width = W; cv.height = H;
      const n = W * H;
      base = new Float32Array(n); alpha = new Float32Array(n); grain = new Float32Array(n); height = new Float32Array(n); lit = new Float32Array(n); halo = new Float32Array(n);
      out = ctx.createImageData(W, H);
      const r = H / 2, half = W / 2 - r, edge = r * 0.62, rise = H * 0.1;
      let seed = 11;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const px = x + 0.5 - W / 2, py = y + 0.5 - H / 2, q = Math.abs(px) - half;
          const d = q <= 0 ? r - Math.abs(py) : r - Math.hypot(q, py);
          const i = y * W + x, t = Math.max(0, Math.min(1, d / edge));
          alpha[i] = Math.max(0, Math.min(1, d + 0.5));
          base[i] = rise * (1 - (1 - t) * (1 - t)); // the pad is flat on top with soft rolled edges
          seed = (seed * 16807) % 2147483647;
          grain[i] = (seed / 2147483647 - 0.5) * 5;
        }
      }
      centres = items.current.map((a) => { if (!a) return 0; const k = a.getBoundingClientRect(); return (k.left - b.left + k.width / 2) * RES; });
      if (!s.ready && centres.length) { s.lead = s.trail = centres[activeRef.current]; s.ready = true; }
    };

    const paint = () => {
      if (!out) return;
      const dst = out.data;
      const xa = Math.min(s.lead, s.trail), xb = Math.max(s.lead, s.trail), cy = H / 2;
      const stretch = xb - xa;
      const A = H * 0.215 * Math.max(0.5, 1 - stretch / (260 * RES)); // a stretched bump is a lower bump
      const rad = H * 0.4, reach = rad * rad, inv = 1 / reach;
      const D = s.dent * RES, dsig = 12 * RES, dinv = 1 / (2 * dsig * dsig), dreach = dsig * dsig * 11;
      const dx0 = s.px * RES, dy0 = s.py * RES;
      for (let y = 0; y < H; y++) {
        const dy = y - cy, dy2 = dy * dy, ey = y - dy0, ey2 = ey * ey;
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          if (alpha[i] <= 0) { height[i] = 0; lit[i] = 0; halo[i] = 0; continue; }
          const gap = x < xa ? xa - x : x > xb ? x - xb : 0, d2 = gap * gap + dy2;
          let h = base[i], g = 0;
          if (d2 < reach) { const u = 1 - d2 * inv; g = u * Math.sqrt(u); h += A * g; } // a dome that meets the sheet without a crease
          if (D > 0.05) { const ex = x - dx0, e2 = ex * ex + ey2; if (e2 < dreach) h -= D * (Math.exp(-e2 * dinv) - 0.0041); }
          height[i] = h; lit[i] = g; halo[i] = d2 < reach * 5 ? Math.exp(-d2 * inv * 1.15) : 0;
        }
      }
      // Light from the upper left. Rubber is matte, so the highlight is wide and faint.
      const Lx = -0.37, Ly = -0.59, Lz = 0.72, Hx = -0.23, Hy = -0.37, Hz = 0.9;
      const [R, G, B] = RUBBER, [gr, gg, gb] = GLOW;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * W + x, o = i * 4, a = alpha[i];
          if (a <= 0) { dst[o + 3] = 0; continue; }
          const nx = (x > 0 ? height[i - 1] : 0) - (x < W - 1 ? height[i + 1] : 0);
          const ny = (y > 0 ? height[i - W] : 0) - (y < H - 1 ? height[i + W] : 0);
          const len = Math.sqrt(nx * nx * 0.25 + ny * ny * 0.25 + 1);
          const diff = Math.max(0, (nx * 0.5 * Lx + ny * 0.5 * Ly + Lz) / len);
          let sp = Math.max(0, (nx * 0.5 * Hx + ny * 0.5 * Hy + Hz) / len); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
          const shade = 0.5 + 0.6 * diff, hi = sp * 30 + grain[i];
          // Light from the ball soaks into the skin above it, strongest where the sheet is stretched thinnest.
          const g = lit[i], k = Math.min(0.93, g * (0.5 + 0.42 * g) + halo[i] * 0.36), core = g * g * g * 46, warm = 0.66 + 0.66 * diff;
          dst[o] = (R * shade + hi) * (1 - k) + gr * warm * k + core;
          dst[o + 1] = (G * shade + hi) * (1 - k) + gg * warm * k + core;
          dst[o + 2] = (B * shade + hi) * (1 - k) + gb * warm * k + core;
          dst[o + 3] = a * 255;
        }
      }
      ctx.putImageData(out, 0, 0);
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, nextDemo = 1250, dirty = true;
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0, target = centres[activeRef.current] ?? 0;
      // Two springs of different stiffness: the front of the bump arrives first and the back catches up.
      s.leadV += (330 * (target - s.lead) - 24 * s.leadV) * dt; s.lead += s.leadV * dt;
      s.trailV += (120 * (target - s.trail) - 17 * s.trailV) * dt; s.trail += s.trailV * dt;
      s.pressV += (420 * (s.pressTo - s.press) - 15 * s.pressV) * dt; s.press += s.pressV * dt;
      s.dent += (s.dentTo - s.dent) * Math.min(1, dt * 16);
      if (now - touched > 4200 && t > nextDemo) { const n = (activeRef.current + 1) % links.length; activeRef.current = n; setActive(n); nextDemo = t + 2100; }
      const moving = Math.abs(s.leadV) + Math.abs(s.trailV) > 0.6 || Math.abs(target - s.trail) > 0.3 || Math.abs(s.dentTo - s.dent) > 0.02 || Math.abs(s.pressV) > 0.002 || Math.abs(s.pressTo - s.press) > 0.002;
      if (moving || dirty) { paint(); dirty = false; el.style.transform = `scale(${(1 + s.press * 0.014).toFixed(4)}, ${(1 - s.press * 0.05).toFixed(4)})`; }
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const still = () => { const x = centres[activeRef.current] ?? 0; s.lead = s.trail = x; s.leadV = s.trailV = 0; s.dent = s.dentTo; paint(); };

    api.current = { go: (i, fromUser) => { if (fromUser) touched = performance.now(); activeRef.current = i; if (reduce) still(); else wake(); } };
    const setup = () => { measure(); dirty = true; if (reduce) still(); else wake(); };
    setup();

    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      s.px = e.clientX - b.left; s.py = e.clientY - b.top; touched = performance.now();
      if (s.dentTo < 4.5) s.dentTo = 4.5;
      dirty = true; if (reduce) still();
    };
    const onLeave = () => { s.dentTo = 0; s.pressTo = 0; dirty = true; if (reduce) still(); };
    const onDown = (e: PointerEvent) => { onMove(e); s.dentTo = 11; s.pressTo = 1; if (reduce) still(); };
    const onUp = () => { s.pressTo = 0; s.dentTo = s.dentTo > 0 ? 4.5 : 0; dirty = true; if (reduce) still(); };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onLeave);
    const ro = new ResizeObserver(setup);
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(el);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerleave", onLeave); el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onLeave);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const choose = (i: number) => { setActive(i); api.current?.go(i, true); };

  return (
    <div className="flex min-h-[420px] w-full flex-col items-center justify-center bg-[#b4c3e0] px-4 py-16">
      <div className="relative w-full max-w-[452px] sm:max-w-[540px]">
        {/* Where the pad rests on the table. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-3 bottom-[-10px] top-6 rounded-full bg-[#1f2f5c] opacity-45 blur-[14px]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-1 bottom-[-3px] top-3 rounded-full bg-[#1a2750] opacity-40 blur-[4px]" />
        <nav ref={nav} aria-label="Main" className="relative h-[68px] w-full sm:h-[78px] touch-manipulation select-none rounded-full bg-[#f3f0ea] will-change-transform">
          <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full rounded-full" />
          <ul className="relative flex h-full items-stretch px-[14px]">
            {links.map((label, i) => (
              <li key={label} className="flex min-w-0 flex-1">
                <a
                  ref={(a) => { items.current[i] = a; }}
                  href="#"
                  aria-current={active === i ? "page" : undefined}
                  onClick={(e) => { e.preventDefault(); choose(i); }}
                  className={`my-3 flex w-full items-center justify-center rounded-full text-[13px] font-semibold tracking-tight outline-none sm:text-[15px] transition-[color,transform] duration-500 ease-out focus-visible:ring-2 focus-visible:ring-[#1c2230] focus-visible:ring-offset-0 motion-reduce:transition-none ${active === i ? "scale-110 text-[#1c0810]" : "text-[#4a5061] hover:text-[#1c2230]"}`}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="mt-10 text-center text-[13px] font-medium text-[#27355c]">Push a finger into it. Pick a page and the light rolls there.</p>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";

// Edit the menu here. Four to six short words fit the tray at phone width.
const links = ["Index", "Projects", "Notes", "Lab", "Hello"];
const RES = 2; // canvas pixels per CSS pixel
const BRIGHT = [246, 248, 252]; // the brightest reflection in the metal
const DEEP = [13, 15, 21]; // the darkest
const INK = [12, 13, 16]; // label colour while it sits on the mercury
const PALE = [214, 217, 224]; // label colour on the black glass

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a: number, b: number, v: number) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

export default function MercuryDropPillNavbar() {
  const well = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const items = useRef<(HTMLAnchorElement | null)[]>([]);
  const [active, setActive] = useState(1);
  const activeRef = useRef(1);
  const api = useRef<{ go: (i: number, fromUser: boolean) => void } | null>(null);

  useEffect(() => {
    const el = well.current, cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0, slot = 0;
    let fld = new Float32Array(0), hgt = new Float32Array(0);
    let out: ImageData | null = null, px32 = new Uint32Array(0);
    let centres: number[] = [];
    // The drop is one long body (lead and trail) plus two beads that break away and catch up.
    const s = { lead: 0, leadV: 0, trail: 0, trailV: 0, b1: 0, b1V: 0, b2: 0, b2V: 0, squash: 0, squashV: 0, pull: 0, pullTo: 0, lift: 0, liftTo: 0, ready: false };

    const measure = () => {
      const b = el.getBoundingClientRect();
      if (!b.width) return;
      W = Math.round(b.width * RES); H = Math.round(b.height * RES);
      cv.width = W; cv.height = H;
      fld = new Float32Array(W * H); hgt = new Float32Array(W * H);
      out = ctx.createImageData(W, H); px32 = new Uint32Array(out.data.buffer);
      centres = items.current.map((a) => { if (!a) return 0; const k = a.getBoundingClientRect(); return (k.left - b.left + k.width / 2) * RES; });
      slot = W / Math.max(1, links.length);
      if (!s.ready && centres.length) { s.lead = s.trail = s.b1 = s.b2 = centres[activeRef.current]; s.ready = true; }
    };

    const paint = () => {
      if (!out) return;
      px32.fill(0);
      const dst = out.data;
      const xmin = Math.min(s.lead, s.trail), xmax = Math.max(s.lead, s.trail), stretch = xmax - xmin;
      // The same amount of metal: a longer drop is a thinner drop.
      const R = H * 0.365 * Math.max(0.6, 1 - stretch / (slot * 5.2)) * (1 - s.squash * 0.1);
      const L0 = Math.max(0, Math.min(slot * 0.5 - R - 3 * RES, R * 0.82)) * (1 + s.squash * 0.25);
      const wall = R * 1.04 + 2 * RES; // the drop piles up against the end of the tray, it never passes through
      const xa = Math.max(wall, xmin - L0 + s.pull * RES), xb = Math.min(W - wall, xmax + L0 + s.pull * RES);
      const cy = H * 0.5 + s.lift * RES, R2 = R * R;
      const r1 = R * 0.46, r2 = R * 0.33, r12 = r1 * r1, r22 = r2 * r2;
      const b1x = s.b1 + s.pull * RES * 1.9, b2x = s.b2 + s.pull * RES * 0.6;
      const b1y = cy + R * 0.2 + s.lift * RES * 0.8, b2y = cy - R * 0.26;
      const x0 = Math.max(1, Math.floor(Math.min(xa, b1x, b2x) - R * 2.3)), x1 = Math.min(W - 2, Math.ceil(Math.max(xb, b1x, b2x) + R * 2.3));
      const HM = R * 0.6;

      for (let y = 0; y < H; y++) {
        const dy = (y - cy) * 1.06, dy2 = dy * dy, e1y = y - b1y, e2y = y - b2y;
        for (let x = x0 - 1; x <= x1 + 1; x++) {
          const gap = x < xa ? xa - x : x > xb ? x - xb : 0;
          const e1x = x - b1x, e2x = x - b2x;
          const F = R2 / (gap * gap + dy2 + 1) + r12 / (e1x * e1x + e1y * e1y + 1) + r22 / (e2x * e2x + e2y * e2y + 1);
          const i = y * W + x;
          fld[i] = F;
          if (F <= 1) hgt[i] = 0; else { const q = 1 / F; hgt[i] = HM * Math.sqrt(1 - q * Math.sqrt(q)); } // a shallow lens with a steep rim
        }
      }
      for (let y = 1; y < H - 1; y++) {
        for (let x = x0; x <= x1; x++) {
          const i = y * W + x, F = fld[i];
          if (F < 0.3) continue;
          const o = i * 4;
          // A faint smear of light on the glass around the drop.
          const ring = F < 1 ? (F - 0.3) / 0.7 : 1, ga = ring * ring * ring * 0.13 * smooth(-R * 0.2, R * 0.9, y - cy);
          const fx = (fld[i + 1] - fld[i - 1]) * 0.5, fy = (fld[i + W] - fld[i - W]) * 0.5;
          const a = clamp01((F - 1) / (Math.sqrt(fx * fx + fy * fy) + 1e-4) + 0.5);
          if (a <= 0) { dst[o] = 205; dst[o + 1] = 214; dst[o + 2] = 232; dst[o + 3] = ga * 255; continue; }
          const nx = -(hgt[i + 1] - hgt[i - 1]) * 0.5, ny = -(hgt[i + W] - hgt[i - W]) * 0.5;
          const inv = 1 / Math.sqrt(nx * nx + ny * ny + 1), nz = inv;
          // Where the mirror points: straight up on the flat top, at the horizon on the shoulder, at the table on the rim.
          const rx = 2 * nz * nx * inv, ry = 2 * nz * ny * inv, rz = 2 * nz * nz - 1;
          let e: number;
          if (rz > 0) {
            const sky = 0.5 + 0.2 * rz + 0.24 * smooth(0.1, -0.9, ry) - 0.26 * smooth(0.08, 0.85, ry);
            e = 0.035 + (sky - 0.035) * smooth(0, 0.42, rz);
            const k = 1 / (rz + 0.28), u = rx * k, v = ry * k;
            e += (1 - e) * smooth(-0.98, -0.86, u) * smooth(0.42, 0.3, u) * smooth(-1.02, -0.9, v) * smooth(-0.3, -0.4, v) * 0.97; // the long lamp, upper left
            e += (1 - e) * smooth(0.62, 0.7, u) * smooth(0.92, 0.84, u) * smooth(-0.8, -0.6, v) * smooth(0.75, 0.45, v) * 0.5; // a strip light on the right
          } else {
            e = 0.035 + 0.42 * smooth(-0.35, -0.97, rz) * smooth(-0.15, 0.75, ry); // the rim picks up the room only along its lower edge
          }
          const warm = rz < 0 ? 0 : smooth(0.1, 0.9, ry) * 10;
          const cr = DEEP[0] + (BRIGHT[0] - DEEP[0]) * e + warm, cg = DEEP[1] + (BRIGHT[1] - DEEP[1]) * e + warm * 0.4, cb = DEEP[2] + (BRIGHT[2] - DEEP[2]) * e - warm * 0.5;
          const oa = a + (1 - a) * ga;
          dst[o] = (cr * a + 205 * ga * (1 - a)) / oa; dst[o + 1] = (cg * a + 214 * ga * (1 - a)) / oa; dst[o + 2] = (cb * a + 232 * ga * (1 - a)) / oa; dst[o + 3] = oa * 255;
        }
      }
      ctx.putImageData(out, 0, 0);
      // A label turns to ink while the metal is under it.
      const edge = R * 0.55;
      items.current.forEach((link, i) => {
        if (!link) return;
        const c = centres[i], d = c < xa ? xa - c : c > xb ? c - xb : 0, k = 1 - smooth(-edge, edge * 0.6, d - edge);
        link.style.color = `rgb(${Math.round(PALE[0] + (INK[0] - PALE[0]) * k)},${Math.round(PALE[1] + (INK[1] - PALE[1]) * k)},${Math.round(PALE[2] + (INK[2] - PALE[2]) * k)})`;
      });
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, nextDemo = 1300, dirty = true;
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0, target = centres[activeRef.current] ?? 0;
      s.leadV += (300 * (target - s.lead) - 21 * s.leadV) * dt; s.lead += s.leadV * dt;
      s.trailV += (120 * (target - s.trail) - 15 * s.trailV) * dt; s.trail += s.trailV * dt;
      s.b1V += (58 * (target - s.b1) - 10.5 * s.b1V) * dt; s.b1 += s.b1V * dt;
      s.b2V += (36 * (target - s.b2) - 8.6 * s.b2V) * dt; s.b2 += s.b2V * dt;
      // Arriving fast flattens the drop for a moment, then surface tension pulls it round again.
      const hit = Math.min(1, Math.abs(s.leadV) / (slot * 9));
      s.squashV += (260 * (hit * 0.9 - s.squash) - 11 * s.squashV) * dt; s.squash += s.squashV * dt;
      s.pull += (s.pullTo - s.pull) * Math.min(1, dt * 9); s.lift += (s.liftTo - s.lift) * Math.min(1, dt * 9);
      if (now - touched > 4200 && t > nextDemo) { const n = (activeRef.current + 1) % links.length; activeRef.current = n; setActive(n); nextDemo = t + 2300; }
      const moving = Math.abs(s.leadV) + Math.abs(s.trailV) + Math.abs(s.b1V) + Math.abs(s.b2V) > 0.5 || Math.abs(target - s.b2) > 0.3 || Math.abs(s.squashV) > 0.01 || Math.abs(s.pullTo - s.pull) + Math.abs(s.liftTo - s.lift) > 0.03;
      if (moving || dirty) { paint(); dirty = false; }
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const still = () => { const x = centres[activeRef.current] ?? 0; s.lead = s.trail = s.b1 = s.b2 = x; s.leadV = s.trailV = s.b1V = s.b2V = 0; s.squash = 0; s.pull = s.pullTo; s.lift = s.liftTo; paint(); };

    api.current = { go: (i, fromUser) => { if (fromUser) touched = performance.now(); activeRef.current = i; if (reduce) still(); else wake(); } };
    const setup = () => { measure(); dirty = true; if (reduce) still(); else wake(); };
    setup();

    // The drop leans toward a pointer, as if a magnet were moving under the glass.
    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      const dx = e.clientX - b.left - s.lead / RES, dy = e.clientY - b.top - b.height / 2;
      const near = 1 - smooth(40, 230, Math.abs(dx));
      s.pullTo = Math.max(-11, Math.min(11, dx * 0.16)) * near; s.liftTo = Math.max(-3.5, Math.min(3.5, dy * 0.14)) * near;
      touched = Math.max(touched, performance.now() - 2600); dirty = true; if (reduce) still();
    };
    const onLeave = () => { s.pullTo = 0; s.liftTo = 0; dirty = true; if (reduce) still(); };
    const onDown = () => { s.squashV += 7; touched = performance.now(); dirty = true; };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    const ro = new ResizeObserver(setup);
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(el);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerleave", onLeave); el.removeEventListener("pointerdown", onDown);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const choose = (i: number) => { activeRef.current = i; setActive(i); api.current?.go(i, true); };

  return (
    <div className="flex min-h-[520px] w-full flex-col items-center justify-center bg-[#d5d7dd] bg-[radial-gradient(110%_85%_at_50%_18%,#eceef2_0%,#d5d7dd_55%,#bfc2ca_100%)] px-4 py-16 sm:min-h-[640px]">
      <nav
        aria-label="Main"
        className="w-full max-w-[344px] rounded-full bg-[linear-gradient(180deg,#5d6068_0%,#2a2c31_22%,#17181b_60%,#3a3c42_100%)] p-[5px] shadow-[0_1px_0_rgba(255,255,255,0.75),0_-1px_0_rgba(0,0,0,0.25),0_42px_60px_-22px_rgba(28,32,48,0.55),0_14px_20px_-10px_rgba(28,32,48,0.45)] sm:max-w-[700px] sm:p-[6px]"
      >
        <div
          ref={well}
          className="relative h-[60px] overflow-hidden rounded-full bg-[#0b0c0e] bg-[linear-gradient(180deg,#141519_0%,#08090a_55%,#0d0e11_100%)] shadow-[inset_0_2px_3px_rgba(0,0,0,0.95),inset_0_-1px_0_rgba(255,255,255,0.09),inset_0_0_0_1px_rgba(0,0,0,0.6)] sm:h-[90px]"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-[4%] top-[3px] h-[40%] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0))] blur-sm" />
          <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
          <ul className="relative grid h-full" style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}>
            {links.map((label, i) => (
              <li key={label} className="flex">
                <a
                  ref={(a) => { items.current[i] = a; }}
                  href="#"
                  aria-current={active === i ? "page" : undefined}
                  onClick={(e) => { e.preventDefault(); choose(i); }}
                  className="flex flex-1 items-center justify-center rounded-full text-[13px] font-semibold tracking-[-0.01em] text-[#d6d9e0] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 sm:text-[17px]"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <p className="mt-10 max-w-[300px] text-center text-[13px] font-medium leading-5 text-slate-600 sm:mt-12">
        Pick a page and the mercury runs to it. Hold a pointer near and it leans.
      </p>
    </div>
  );
}

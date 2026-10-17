import { useEffect, useRef, useState } from "react";

// The words printed on the tape. Four to six short ones fit at phone width.
const links = ["Shirts", "Knits", "Denim", "Coats", "Repairs"];
const TAPE = [229, 218, 197]; // undyed cotton, as red, green, blue
const THREAD = "#b3261e"; // the sewing thread
const THREAD_LIGHT = "#e8695c";
const THREAD_DARK = "#6f120d";
const RES = 2; // canvas pixels per CSS pixel
const M = 22; // spare canvas around the tape, so the needle can poke past its edge

type Pt = { x: number; y: number };
type Loop = { pts: Pt[]; len: number[]; total: number; n: number; pitch: number };
const smooth = (a: number, b: number, v: number) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

export default function WovenRibbonTabBar() {
  const nav = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const items = useRef<(HTMLAnchorElement | null)[]>([]);
  const [active, setActive] = useState(1);
  const activeRef = useRef(1);
  const hover = useRef(-1);
  const api = useRef<{ go: (i: number, fromUser: boolean) => void; chalk: () => void } | null>(null);

  useEffect(() => {
    const el = nav.current, cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cloth = document.createElement("canvas");
    let W = 0, H = 0, loops: Loop[] = [];
    // One needle, one thread: `at` is the tab it is working on and `sewn` how many stitches are in.
    const s = { at: activeRef.current, sewn: 0, hop: 0, from: { x: 0, y: 0 }, hopping: false, ready: false, chalk: 0 };

    // Weave the tape once: herringbone twill, a tighter selvedge on both edges and pinked ends.
    const weave = () => {
      const w = Math.round(W * RES), h = Math.round(H * RES);
      cloth.width = w; cloth.height = h;
      const cx = cloth.getContext("2d");
      if (!cx) return;
      const img = cx.createImageData(w, h), d = img.data;
      const sel = 3.5 * RES, bands = H > 90 ? 8 : 6, bandH = (h - sel * 2) / bands, P = 3.5 * RES, tooth = 6 * RES;
      let seed = 23;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const rib = new Float32Array(Math.ceil((w + h * 2) / P) + 4).map(() => 0.96 + rand() * 0.08);
      for (let y = 0; y < h; y++) {
        const zig = tooth * Math.abs(((y / tooth) % 2) - 1);
        const inSel = y < sel || y >= h - sel;
        const by = y - sel, b = Math.floor(by / bandH), yy = b % 2 ? bandH - (by - b * bandH) : by - b * bandH;
        for (let x = 0; x < w; x++) {
          const o = (y * w + x) * 4;
          const a = Math.max(0, Math.min(1, Math.min(x - zig + 0.5, w - 1 - zig - x + 0.5)));
          if (a <= 0) { d[o + 3] = 0; continue; }
          let v: number;
          if (inSel) {
            // Plain weave at the edge: small squares, alternately warp and weft on top.
            const c = 1.5 * RES, ix = Math.floor(x / c), iy = Math.floor(y / c), fx = x / c - ix, fy = y / c - iy;
            v = 0.9 + 0.12 * Math.sin(Math.PI * ((ix + iy) % 2 ? fx : fy));
          } else {
            const u = x + yy, k = Math.floor(u / P), ph = u / P - k;
            const ridge = 0.5 - 0.5 * Math.cos(ph * Math.PI * 2);
            const float = 0.5 + 0.5 * Math.sin(((x - yy) / (4.5 * RES)) * Math.PI * 2 + k * 2.4);
            v = (0.845 + 0.19 * ridge + 0.03 * float * ridge) * rib[k + 2] * (b % 2 ? 1.02 : 0.975);
          }
          // The tape never lies perfectly flat: slow waves of light along its length.
          v *= 1 + 0.045 * Math.sin((x / w) * 9.4 + 0.8 + (y / h) * 0.9) + 0.015 * Math.sin((x / w) * 31 + y * 0.02);
          v *= 0.975 + rand() * 0.05;
          if (y < 1.2 * RES) v *= 1.07; else if (y > h - 2 * RES) v *= 0.8;
          const edge = Math.min(x - zig, w - 1 - zig - x); if (edge < 2 * RES) v *= 0.9;
          d[o] = TAPE[0] * v; d[o + 1] = TAPE[1] * (v - (1 - v) * 0.04); d[o + 2] = TAPE[2] * (v - (1 - v) * 0.12); d[o + 3] = a * 255;
        }
      }
      cx.putImageData(img, 0, 0);
    };

    // The stitching line round one tab: a rounded box, walked from its lower right corner.
    const outline = (x: number, y: number, w: number, h: number, r: number): Loop => {
      const pts: Pt[] = [];
      const arc = (cx: number, cy: number, a0: number) => { for (let k = 0; k <= 8; k++) { const a = a0 + (k / 8) * (Math.PI / 2); pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }); } };
      pts.push({ x: x + w - r, y: y + h });
      arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI); arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0);
      const len = [0];
      for (let k = 1; k < pts.length; k++) len.push(len[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y));
      const total = len[len.length - 1], n = Math.max(8, Math.round(total / 10.5));
      return { pts, len, total, n, pitch: total / n };
    };
    const along = (L: Loop, dist: number): Pt => {
      const t = ((dist % L.total) + L.total) % L.total;
      let k = 1; while (k < L.len.length - 1 && L.len[k] < t) k++;
      const f = (t - L.len[k - 1]) / Math.max(1e-6, L.len[k] - L.len[k - 1]);
      return { x: L.pts[k - 1].x + (L.pts[k].x - L.pts[k - 1].x) * f, y: L.pts[k - 1].y + (L.pts[k].y - L.pts[k - 1].y) * f };
    };

    const measure = () => {
      const b = el.getBoundingClientRect();
      if (!b.width) return;
      W = b.width; H = b.height;
      cv.width = Math.round((W + M * 2) * RES); cv.height = Math.round((H + M * 2) * RES);
      weave();
      const padY = H > 90 ? 20 : 12;
      loops = items.current.map((a) => {
        if (!a) return outline(0, 0, 10, 10, 2);
        const k = a.getBoundingClientRect(), padX = k.width > 90 ? 9 : 3.5;
        return outline(k.left - b.left + padX, padY, k.width - padX * 2, H - padY * 2, 7);
      });
      if (!s.ready && loops.length) { s.sewn = loops[s.at].n; s.ready = true; }
    };

    const line = (a: Pt, b: Pt, width: number, colour: string) => { ctx.lineWidth = width; ctx.strokeStyle = colour; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      // The tape and the shadow it drops on the table.
      ctx.save(); ctx.shadowColor = "rgba(60,22,10,0.5)"; ctx.shadowBlur = 16 * RES; ctx.shadowOffsetY = 10 * RES; ctx.drawImage(cloth, M * RES, M * RES); ctx.restore();
      ctx.save(); ctx.shadowColor = "rgba(60,22,10,0.55)"; ctx.shadowBlur = 2.5 * RES; ctx.shadowOffsetY = 1.5 * RES; ctx.drawImage(cloth, M * RES, M * RES); ctx.restore();
      ctx.setTransform(RES, 0, 0, RES, M * RES, M * RES);
      ctx.lineCap = "round";
      const L = loops[s.at];
      if (!L) return;

      // Tailor's chalk where the next line of stitches would go.
      if (s.chalk > 0.01 && hover.current >= 0 && hover.current !== s.at && loops[hover.current]) {
        const C = loops[hover.current];
        ctx.save(); ctx.globalAlpha = 0.75 * s.chalk; ctx.setLineDash([5, 5.5]); ctx.lineWidth = 1.3; ctx.strokeStyle = "#fffdf6";
        ctx.beginPath(); C.pts.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.stroke(); ctx.restore();
      }

      // Stitches: a hole at each end, a shadow, the thread, a highlight and the twist of the ply.
      const count = Math.min(L.n, Math.ceil(s.sewn));
      let tail = along(L, 0);
      for (let k = 0; k < count; k++) {
        const part = Math.min(1, s.sewn - k), d0 = k * L.pitch + L.pitch * 0.19, a = along(L, d0), full = along(L, d0 + L.pitch * 0.62);
        const b = { x: a.x + (full.x - a.x) * part, y: a.y + (full.y - a.y) * part };
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
        ctx.fillStyle = "rgba(48,26,12,0.5)";
        ctx.beginPath(); ctx.arc(a.x - ux * 0.6, a.y - uy * 0.6, 1.25, 0, Math.PI * 2); ctx.arc(full.x + ux * 0.6, full.y + uy * 0.6, 1.25, 0, Math.PI * 2); ctx.fill();
        line({ x: a.x + 0.5, y: a.y + 1.3 }, { x: b.x + 0.5, y: b.y + 1.3 }, 2.9, "rgba(58,26,10,0.38)");
        line(a, b, 2.7, THREAD_DARK);
        line(a, b, 2.1, THREAD);
        line({ x: a.x - uy * -0.45 - 0.2, y: a.y + ux * -0.45 - 0.35 }, { x: b.x - uy * -0.45 - 0.2, y: b.y + ux * -0.45 - 0.35 }, 0.85, THREAD_LIGHT);
        if (part > 0.6) for (let q = 1; q <= 3; q++) { const px = a.x + dx * (q / 4), py = a.y + dy * (q / 4); line({ x: px - ux * 0.5 + uy * 1.05, y: py - uy * 0.5 - ux * 1.05 }, { x: px + ux * 0.5 - uy * 1.05, y: py + uy * 0.5 + ux * 1.05 }, 0.5, "rgba(70,10,6,0.55)"); }
        tail = b;
      }

      // A glass-headed pin through each end holds the tape to the board.
      const pin = (x: number, turn: number, r: number) => {
        ctx.save(); ctx.translate(x, H / 2); ctx.rotate(turn);
        const y0 = -H * 0.2, y1 = H * 0.25, mid = y0 + (y1 - y0) * 0.5, out = y0 + (y1 - y0) * 0.76;
        ctx.fillStyle = "rgba(48,26,12,0.55)"; ctx.beginPath(); ctx.arc(0, mid, 1.1, 0, Math.PI * 2); ctx.arc(0, out, 1.1, 0, Math.PI * 2); ctx.fill();
        for (const [a, b] of [[y0, mid], [out, y1]]) { line({ x: 1.2, y: a + 1.6 }, { x: 1.2, y: b + 1.6 }, 1.5, "rgba(50,20,8,0.35)"); line({ x: 0, y: a }, { x: 0, y: b }, 1.5, "#5a5f68"); line({ x: -0.3, y: a }, { x: -0.3, y: b }, 0.6, "#e6eaf0"); }
        ctx.save(); ctx.shadowColor = "rgba(50,20,8,0.55)"; ctx.shadowBlur = 4 * RES; ctx.shadowOffsetX = 2 * RES; ctx.shadowOffsetY = 3.5 * RES;
        const g = ctx.createRadialGradient(-r * 0.35, y0 - r * 0.4, r * 0.08, 0, y0, r);
        g.addColorStop(0, "#e9fbfa"); g.addColorStop(0.2, "#49b3bb"); g.addColorStop(0.62, "#16606a"); g.addColorStop(1, "#07292f");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, y0, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.beginPath(); ctx.ellipse(-r * 0.38, y0 - r * 0.42, r * 0.2, r * 0.13, -0.6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(190,240,240,0.35)"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(0, y0, r - 0.8, 0.5, 2.1); ctx.stroke();
        ctx.restore();
      };
      const big = H > 90;
      pin(big ? 17 : 8.5, 0.14, big ? 6.2 : 4.2); pin(W - (big ? 17 : 8.5), -0.2, big ? 6.2 : 4.2);

      // The needle: it leads the stitching, hops between tabs, and parks through the cloth when the box is closed.
      const done = smooth(L.n - 2.5, L.n, s.sewn);
      const head = along(L, s.sewn * L.pitch + 5), ahead = along(L, s.sewn * L.pitch + 9);
      let ang = Math.atan2(ahead.y - head.y, ahead.x - head.x);
      const park = 0.62; // radians below the horizontal, pointing right
      let da = park - ang; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
      ang += da * done;
      let eye = { x: head.x + (tail.x + 5 - head.x) * done, y: head.y + (tail.y + 3 - head.y) * done }, lift = 0;
      if (s.hopping) { const t = smooth(0, 1, s.hop); eye = { x: s.from.x + (eye.x - s.from.x) * t, y: s.from.y + (eye.y - s.from.y) * t }; lift = Math.sin(Math.PI * s.hop) * 9; ang = ang * t + (1 - t) * -0.5; }
      const NL = H > 90 ? 36 : 25, cos = Math.cos(ang), sin = Math.sin(ang);
      const tip = { x: eye.x + cos * NL, y: eye.y + sin * NL - lift }, back = { x: eye.x - cos * 3, y: eye.y - sin * 3 - lift };
      // thread from the last stitch up to the eye
      ctx.lineWidth = 1.5; ctx.strokeStyle = THREAD;
      ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.quadraticCurveTo((tail.x + eye.x) / 2 + 2, (tail.y + eye.y) / 2 + 4 - lift * 0.2, eye.x, eye.y - lift); ctx.stroke();
      // shadow, then steel
      ctx.save(); ctx.filter = `blur(${(1 + lift * 0.12).toFixed(2)}px)`;
      line({ x: back.x + 1 + lift * 0.25, y: back.y + 2.2 + lift * 1.05 }, { x: tip.x + 1 + lift * 0.25, y: tip.y + 2.2 + lift * 1.05 }, 2, "rgba(50,20,8,0.45)"); ctx.restore();
      const nx = -sin, ny = cos;
      ctx.lineCap = "butt";
      ctx.fillStyle = "#4b4f57";
      ctx.beginPath(); ctx.moveTo(back.x + nx * 1.15, back.y + ny * 1.15); ctx.lineTo(tip.x - cos * 7 + nx * 0.95, tip.y - sin * 7 + ny * 0.95); ctx.lineTo(tip.x, tip.y); ctx.lineTo(tip.x - cos * 7 - nx * 0.95, tip.y - sin * 7 - ny * 0.95); ctx.lineTo(back.x - nx * 1.15, back.y - ny * 1.15); ctx.closePath(); ctx.fill();
      line({ x: back.x - nx * 0.25, y: back.y - ny * 0.25 }, { x: tip.x - cos * 3 - nx * 0.1, y: tip.y - sin * 3 - ny * 0.1 }, 1.15, "#c9ced6");
      line({ x: back.x - nx * 0.5 + cos * 2, y: back.y - ny * 0.5 + sin * 2 }, { x: tip.x - cos * 8 - nx * 0.4, y: tip.y - sin * 8 - ny * 0.4 }, 0.5, "#ffffff");
      ctx.lineCap = "round";
      line({ x: eye.x - cos * 0.8, y: eye.y - sin * 0.8 - lift }, { x: eye.x + cos * 2.4, y: eye.y + sin * 2.4 - lift }, 0.9, THREAD_DARK);
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, nextDemo = 2000, dirty = true;
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0, target = activeRef.current, L = loops[s.at];
      let moving = false;
      if (L) {
        if (s.hopping) { s.hop = Math.min(1, s.hop + dt / 0.3); if (s.hop >= 1) s.hopping = false; moving = true; }
        else if (s.at !== target) {
          s.sewn = Math.max(0, s.sewn - dt * 78); moving = true; // unpick, last stitch first
          if (s.sewn <= 0) { const p = along(L, 5); s.from = { x: p.x, y: p.y }; s.at = target; s.hop = 0; s.hopping = true; }
        } else if (s.sewn < L.n) { s.sewn = Math.min(L.n, s.sewn + dt * 44); moving = true; }
      }
      const chalkTo = hover.current >= 0 ? 1 : 0;
      if (Math.abs(chalkTo - s.chalk) > 0.01) { s.chalk += (chalkTo - s.chalk) * Math.min(1, dt * 12); moving = true; }
      if (now - touched > 4500 && t > nextDemo && !moving) { const n = (target + 1) % links.length; activeRef.current = n; setActive(n); nextDemo = t + 2500; }
      if (moving || dirty) { draw(); dirty = false; }
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const still = () => { s.at = activeRef.current; s.hopping = false; s.chalk = hover.current >= 0 ? 1 : 0; if (loops[s.at]) s.sewn = loops[s.at].n; draw(); };

    api.current = {
      go: (i, fromUser) => { if (fromUser) touched = performance.now(); activeRef.current = i; if (reduce) still(); else wake(); },
      chalk: () => { touched = Math.max(touched, performance.now() - 2500); dirty = true; if (reduce) still(); else wake(); },
    };
    const setup = () => { measure(); dirty = true; if (reduce) still(); else wake(); };
    setup();
    const ro = new ResizeObserver(setup);
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(el);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const choose = (i: number) => { activeRef.current = i; setActive(i); api.current?.go(i, true); };
  const point = (i: number) => { hover.current = i; api.current?.chalk(); };

  return (
    <div className="flex min-h-[520px] w-full flex-col items-center justify-center overflow-hidden bg-[#c4674a] bg-[radial-gradient(100%_80%_at_50%_22%,#d98464_0%,#c4674a_55%,#a9523a_100%)] px-4 py-16 sm:min-h-[640px]">
      <nav ref={nav} aria-label="Departments" className="relative h-[66px] w-full max-w-[344px] sm:h-[104px] sm:max-w-[760px]">
        <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute -inset-[22px] h-[calc(100%+44px)] w-[calc(100%+44px)] max-w-none" />
        <ul className="relative grid h-full px-[17px] sm:px-[36px]" style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}>
          {links.map((label, i) => (
            <li key={label} className="flex">
              <a
                ref={(a) => { items.current[i] = a; }}
                href="#"
                aria-current={active === i ? "page" : undefined}
                onClick={(e) => { e.preventDefault(); choose(i); }}
                onPointerEnter={() => point(i)}
                onPointerLeave={() => point(-1)}
                onFocus={() => point(i)}
                onBlur={() => point(-1)}
                className={`flex flex-1 items-center justify-center rounded-lg text-[10.5px] font-bold uppercase tracking-[0.04em] text-[#2b2019] mix-blend-multiply outline-none transition-opacity duration-300 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2b2019] motion-reduce:transition-none sm:text-[15px] sm:tracking-[0.18em] ${active === i ? "opacity-100" : "opacity-80"}`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <p className="mt-12 max-w-[300px] text-center text-[13px] font-medium leading-5 text-[#3d1a0e]">
        One needle, one thread. Pick a word and it unpicks the old box to sew a new one.
      </p>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";

// The page behind the ribbon. An invented florist.
const site = {
  name: "Thistle Lane Flowers",
  address: "thistlelaneflowers.example",
  links: ["Bunches", "Weddings", "Visit"],
  headline: "Flowers cut this morning.",
  copy: "Hand-tied bunches and weekly vases, made to order in the studio.",
  cta: "Order a bunch",
  photo: "https://images.pexels.com/photos/6641386/pexels-photo-6641386.jpeg?auto=compress&cs=tinysrgb&w=900",
};
const BLUE = "#4F98FB";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

const W = 760, H = 600; // the stage everything is laid out in
const POST_L = 124, POST_R = 636; // the two brass posts
const RY = 262; // height the ribbon is tied at
const FLOOR = 548;
const N = 26; // links in each half of the ribbon
const TIE = 13; // the ribbon leaves each knot on its inner side
const HALF = (POST_R - POST_L) / 2 - TIE;
const SEG = (HALF - 0.6) / N; // cut a touch short: its own weight stretches it into a shallow swag
const RIBBON = 46; // width of the satin
const PIVOT_Y = 322; // the screw of the scissors
const AWAY = 120; // how far the scissors are lowered as they are taken away
const FIRST_CUT = 5200, HOLD = 7600, TIED = 4200; // the demo

type Pt = { x: number; y: number; px: number; py: number };
type Api = { set: (live: boolean) => void };
type Rgb = [number, number, number];

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c: Rgb) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const INK: Rgb = [9, 24, 66], WHITE: Rgb = [255, 255, 255];
const FACE_LO: Rgb = [45, 112, 226], FACE_HI: Rgb = [104, 170, 255];
const BACK_LO: Rgb = [30, 78, 170], BACK_HI: Rgb = [58, 122, 220];

// One half of the scissors, drawn pointing up with its screw at 0,0.
function Half({ id, front }: { id: string; front: boolean }) {
  return (
    <svg width="160" height="320" viewBox="-80 -150 160 320" className="absolute left-0 top-0 overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-blade`} x1="-9" x2="7" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6b4c12" /><stop offset="0.22" stopColor="#d9b55c" /><stop offset="0.42" stopColor="#fff3c6" /><stop offset="0.6" stopColor="#c99f43" /><stop offset="1" stopColor="#7d5b17" />
        </linearGradient>
        <linearGradient id={`${id}-shank`} x1="-8" x2="26" y1="6" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8a651a" /><stop offset="0.35" stopColor="#f3d98c" /><stop offset="0.6" stopColor="#c0943a" /><stop offset="1" stopColor="#6b4c12" />
        </linearGradient>
        <linearGradient id={`${id}-ring`} x1="6" x2="56" y1="74" y2="146" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff0bb" /><stop offset="0.28" stopColor="#d6ae4f" /><stop offset="0.55" stopColor="#9a7120" /><stop offset="0.8" stopColor="#e2bf68" /><stop offset="1" stopColor="#6b4c12" />
        </linearGradient>
        <radialGradient id={`${id}-screw`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fffbe6" /><stop offset="0.4" stopColor="#d2aa4c" /><stop offset="1" stopColor="#5a3f0d" />
        </radialGradient>
      </defs>
      {/* blade, its ground edge and the hollow down its back */}
      <path d="M -8 8 L -9 -18 C -9 -72 -4 -112 1 -128 C 5 -102 7 -50 7 8 Z" fill={`url(#${id}-blade)`} stroke="#3f2c08" strokeWidth="0.7" />
      <path d="M 7 8 C 7 -50 5 -102 1 -128 C 2.6 -102 3.2 -50 3.2 8 Z" fill="#fffbe8" opacity="0.9" />
      <path d="M -4 2 C -4 -52 -2 -92 0 -112" fill="none" stroke="rgba(63,44,8,0.38)" strokeWidth="1" />
      {/* shank and the finger loop */}
      <path d="M -8 6 L 7 6 C 12 30 20 52 28 70 L 15 77 C 6 56 -4 34 -8 6 Z" fill={`url(#${id}-shank)`} stroke="#3f2c08" strokeWidth="0.7" />
      <g transform="rotate(-17 33 110)">
        <ellipse cx="33" cy="110" rx="21" ry="32" fill="none" stroke="#3f2c08" strokeWidth="11.4" />
        <ellipse cx="33" cy="110" rx="21" ry="32" fill="none" stroke={`url(#${id}-ring)`} strokeWidth="10" />
        <ellipse cx="33" cy="110" rx="23.4" ry="34.4" fill="none" stroke="#fff6d2" strokeWidth="1.5" strokeDasharray="44 200" strokeDashoffset="-128" strokeLinecap="round" opacity="0.9" />
        <ellipse cx="33" cy="110" rx="17.4" ry="28.4" fill="none" stroke="rgba(40,26,2,0.45)" strokeWidth="1.2" strokeDasharray="60 200" strokeDashoffset="-126" />
      </g>
      {front && (
        <g>
          <circle r="7.6" fill="#3f2c08" />
          <circle r="6.6" fill={`url(#${id}-screw)`} />
          <path d="M -4.4 -1.8 L 4.4 1.8" stroke="#3f2c08" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

function Post({ x }: { x: number }) {
  const brass = "linear-gradient(90deg,#4f370a 0%,#a67a22 16%,#f1d587 34%,#fff4c8 42%,#d2a846 56%,#8c661a 80%,#402c07 100%)";
  return (
    <div aria-hidden="true" className="absolute" style={{ left: x, top: 0 }}>
      {/* shadow on the floor, foot, pole, collar and ball */}
      <div className="absolute" style={{ left: -78, top: FLOOR - 9, width: 176, height: 22, background: "radial-gradient(closest-side,rgba(40,30,12,0.34),rgba(40,30,12,0.12) 60%,rgba(40,30,12,0))" }} />
      <div className="absolute" style={{ left: -46, top: FLOOR - 15, width: 92, height: 17, borderRadius: "46px 46px 8px 8px / 15px 15px 4px 4px", background: brass, boxShadow: "inset 0 -4px 5px rgba(50,32,4,0.55), inset 0 1px 0 rgba(255,250,220,0.8), 0 1px 0 #2e2006" }} />
      <div className="absolute" style={{ left: -17, top: FLOOR - 25, width: 34, height: 12, borderRadius: "17px 17px 2px 2px / 9px 9px 2px 2px", background: brass, boxShadow: "inset 0 -2px 3px rgba(50,32,4,0.5)" }} />
      <div className="absolute" style={{ left: -7, top: 246, width: 14, height: FLOOR - 268, background: brass, boxShadow: "0 0 0 0.5px #3a2806" }} />
      <div className="absolute" style={{ left: -11, top: 240, width: 22, height: 9, borderRadius: 3, background: brass, boxShadow: "0 0 0 0.5px #3a2806, inset 0 -2px 2px rgba(50,32,4,0.5)" }} />
      <div className="absolute rounded-full" style={{ left: -16, top: 210, width: 32, height: 32, background: "radial-gradient(circle at 34% 28%,#fffbe2 0%,#f0d283 16%,#c69a3a 46%,#7a5714 78%,#3d2a07 100%)", boxShadow: "0 0 0 0.5px #3a2806, inset -3px -4px 6px rgba(40,26,2,0.5)" }} />
    </div>
  );
}

export default function SatinOpeningRibbon() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const tools = useRef<(HTMLDivElement | null)[]>([]);
  const blades = useRef<(HTMLDivElement | null)[]>([]);
  const api = useRef<Api | null>(null);
  const [zoom, setZoom] = useState(1);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const st = stage.current, cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!st || !cv || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    const fit = () => setZoom(Math.max(0.44, Math.min(1.1, (st.clientWidth - 12) / W)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(st);

    const rope = (from: number, dir: number): Pt[] => Array.from({ length: N + 1 }, (_, i) => {
      const u = i / N, x = from + dir * HALF * u, y = RY + 14 * (1 - (1 - u) * (1 - u));
      return { x, y, px: x, py: y };
    });
    const L = rope(POST_L + TIE, 1), R = rope(POST_R - TIE, -1);
    const s = { joined: true, tying: false, phiL: 0, vL: 0, phiR: 0, vR: 0, open: 1, sy: 0, seq: "idle" as "idle" | "cut" | "tie", t0: 0, live: false, touched: -1e9, clock: 0 };

    const step = (dt: number) => {
      s.clock += dt;
      for (const [r, dir] of [[L, 1], [R, -1]] as [Pt[], number][]) {
        for (let i = 1; i <= N; i++) {
          const p = r[i], vx = (p.x - p.px) * 0.986, vy = (p.y - p.py) * 0.986;
          p.px = p.x; p.py = p.y;
          // weight, and a draught that keeps the satin moving
          p.x += vx + dir * 26 * Math.sin(s.clock * 1.7 + i * 0.5 + dir) * dt * dt;
          p.y += vy + 1900 * dt * dt;
        }
      }
      const mid = (L[N].x + R[N].x) / 2, midY = (L[N].y + R[N].y) / 2;
      if (s.tying) for (const r of [L, R]) { r[N].x += ((W / 2) - r[N].x) * 0.07; r[N].y += (RY + 12 - r[N].y) * 0.07; }
      for (let k = 0; k < 12; k++) {
        for (const r of [L, R]) {
          for (let i = 0; i < N; i++) {
            const a = r[i], b = r[i + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - SEG) / d;
            if (i === 0) { b.x -= dx * f; b.y -= dy * f; } else { a.x += dx * f * 0.5; a.y += dy * f * 0.5; b.x -= dx * f * 0.5; b.y -= dy * f * 0.5; }
          }
          // satin does not kink: every other link resists folding
          for (let i = 0; i < N - 1; i++) {
            const a = r[i], b = r[i + 2], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = ((d - SEG * 2) / d) * 0.06;
            if (d < SEG * 2) { if (i > 0) { a.x += dx * f; a.y += dy * f; } b.x -= dx * f; b.y -= dy * f; }
          }
        }
        if (s.joined) { const x = (L[N].x + R[N].x) / 2, y = (L[N].y + R[N].y) / 2; L[N].x = R[N].x = x; L[N].y = R[N].y = y; }
      }
      if (s.tying && Math.abs(mid - W / 2) < 3 && Math.hypot(L[N].x - R[N].x, L[N].y - R[N].y) < 16 && midY < RY + 40) { s.tying = false; s.joined = true; }
      // each loose half turns over as it falls and comes to rest part twisted
      const tl = s.joined || s.tying ? 0 : 2.2, tr = s.joined || s.tying ? 0 : -3.5;
      s.vL += (22 * (tl - s.phiL) - 4.2 * s.vL) * dt; s.phiL += s.vL * dt;
      s.vR += (22 * (tr - s.phiR) - 4.2 * s.vR) * dt; s.phiR += s.vR * dt;
    };

    const strip = (r: Pt[], phi: number, loose: boolean, other: Pt[]) => {
      const lx: number[] = [], ly: number[] = [], rx: number[] = [], ry: number[] = [], tw: number[] = [];
      for (let i = 0; i <= N; i++) {
        const a = r[Math.max(0, i - 1)], b = i < N ? r[i + 1] : loose ? r[N] : other[N - 1];
        let tx = b.x - a.x, ty = b.y - a.y; const d = Math.hypot(tx, ty) || 1; tx /= d; ty /= d;
        const c = Math.cos(phi * Math.pow(i / N, 1.25)); tw.push(c);
        const h = (RIBBON / 2) * Math.max(0.09, Math.abs(c)), cutSkew = i === N && loose ? 9 : 0;
        lx.push(r[i].x - ty * h + tx * cutSkew); ly.push(r[i].y + tx * h + ty * cutSkew);
        rx.push(r[i].x + ty * h - tx * cutSkew); ry.push(r[i].y - tx * h - ty * cutSkew);
      }
      for (let i = 0; i < N; i++) {
        const c = (tw[i] + tw[i + 1]) / 2, face = c >= 0;
        const ang = Math.atan2(r[i + 1].y - r[i].y, r[i + 1].x - r[i].x);
        const sheen = Math.max(0, Math.min(1, 0.5 + 0.34 * Math.cos(2 * ang + 0.7) + 0.16 * Math.sin((N - i) * 0.3 - s.clock * 0.7)));
        const lit = 0.55 + 0.45 * Math.abs(c);
        const base = mix(INK, face ? mix(FACE_LO, FACE_HI, sheen) : mix(BACK_LO, BACK_HI, sheen), lit);
        const g = ctx.createLinearGradient((lx[i] + lx[i + 1]) / 2, (ly[i] + ly[i + 1]) / 2, (rx[i] + rx[i + 1]) / 2, (ry[i] + ry[i + 1]) / 2);
        g.addColorStop(0, css(mix(base, INK, 0.5)));
        g.addColorStop(0.07, css(mix(base, INK, 0.12)));
        g.addColorStop(0.26, css(mix(base, WHITE, face ? 0.16 + 0.5 * sheen : 0.1)));
        g.addColorStop(0.5, css(base));
        g.addColorStop(0.9, css(mix(base, INK, 0.2)));
        g.addColorStop(1, css(mix(base, INK, 0.55)));
        ctx.fillStyle = g; ctx.strokeStyle = g; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(lx[i], ly[i]); ctx.lineTo(lx[i + 1], ly[i + 1]); ctx.lineTo(rx[i + 1], ry[i + 1]); ctx.lineTo(rx[i], ry[i]); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      // woven selvedge down both edges
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(226,240,255,0.42)";
      for (const [ax, ay, bx, by] of [[lx, ly, rx, ry], [rx, ry, lx, ly]] as number[][][]) {
        ctx.beginPath();
        for (let i = 0; i <= N; i++) { const x = ax[i] + (bx[i] - ax[i]) * 0.085, y = ay[i] + (by[i] - ay[i]) * 0.085; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.stroke();
      }
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // the shadow the ribbon throws on the wall and the page behind it
      ctx.save();
      ctx.shadowColor = "rgba(34,26,10,0.3)"; ctx.shadowBlur = 16 * dpr; ctx.shadowOffsetX = (4000 + 7) * dpr; ctx.shadowOffsetY = 17 * dpr;
      ctx.lineWidth = RIBBON * 0.72; ctx.lineCap = "butt"; ctx.lineJoin = "round"; ctx.strokeStyle = "#000";
      for (const r of [L, R]) { ctx.beginPath(); r.forEach((p, i) => (i ? ctx.lineTo(p.x - 4000, p.y) : ctx.moveTo(p.x - 4000, p.y))); ctx.stroke(); }
      ctx.restore();
      strip(L, s.phiL, !s.joined, R); strip(R, s.phiR, !s.joined, L);
    };
    const pose = () => {
      const deg = s.open * 15;
      tools.current.forEach((el) => { if (el) { el.style.transform = `translateY(${s.sy.toFixed(1)}px)`; el.style.opacity = Math.max(0, 1 - (s.sy / AWAY) * 1.25).toFixed(3); } });
      blades.current.forEach((el, i) => { if (el) el.style.transform = `rotate(${(i ? deg : -deg).toFixed(2)}deg)`; });
    };
    const tell = (now: boolean) => { if (now !== s.live) { s.live = now; setLive(now); } };
    const snip = () => {
      if (!s.joined) return;
      s.joined = false; s.tying = false;
      L[N].px += 1.6; L[N].py -= 2.2; R[N].px -= 1.6; R[N].py -= 2.2;
      s.vL += 5; s.vR -= 6;
    };

    let raf = 0, last = 0, seen = true, timer = 0, begin = () => {};
    const ease = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.034, (now - last) / 1000 || 0.016); last = now;
      const e = now - s.t0;
      if (s.seq === "cut") {
        // open a touch wider, bite, then carry the scissors down and away
        s.open = e < 150 ? 1 + 0.32 * ease(e / 150) : e < 235 ? 1.32 * (1 - ((e - 150) / 85) ** 2) : 0.04 + 0.3 * ease((e - 420) / 400);
        if (e >= 235) snip();
        s.sy = AWAY * ease((e - 520) / 520);
        if (e > 1200) s.seq = "idle";
      } else if (s.seq === "tie") {
        s.sy = AWAY * (1 - ease((e - 620) / 520));
        s.open = 0.34 + 0.66 * ease((e - 760) / 420);
        if (e > 1500 && !s.joined) { s.tying = false; s.joined = true; }
        if (e > 1300 && s.joined) s.seq = "idle";
      } else if (s.joined) s.open = 1 + 0.035 * Math.sin(now / 620);
      const n = Math.max(1, Math.round(dt * 120));
      for (let i = 0; i < n; i++) step(1 / 120);
      draw(); pose();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const go = (toLive: boolean) => {
      if (toLive === s.live) return;
      tell(toLive);
      if (reduce) {
        s.joined = !toLive; s.tying = false; s.sy = toLive ? AWAY : 0; s.open = toLive ? 0.3 : 1;
        if (!toLive) { const a = rope(POST_L + TIE, 1), b = rope(POST_R - TIE, -1); L.forEach((p, i) => Object.assign(p, a[i])); R.forEach((p, i) => Object.assign(p, b[i])); s.phiL = s.phiR = s.vL = s.vR = 0; }
        else for (let i = 0; i < 900; i++) step(1 / 120);
        draw(); pose(); return;
      }
      s.seq = toLive ? "cut" : "tie"; s.t0 = performance.now();
      if (!toLive) s.tying = true;
      wake();
    };
    api.current = { set: (v) => { s.touched = performance.now(); go(v); } };

    draw(); pose();
    if (!reduce) {
      wake();
      // The demo: cut, hold, tie a new one, wait. It stands down while someone is using it.
      const loop = (wait: number, cut: boolean) => { timer = window.setTimeout(() => { if (seen && !document.hidden && performance.now() - s.touched > 9000) go(cut); loop(cut ? HOLD : TIED, !cut); }, wait); };
      begin = () => loop(FIRST_CUT, true);
      if (document.readyState === "complete") begin(); else window.addEventListener("load", begin, { once: true });
    }
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen && !reduce) wake(); });
    io.observe(st);
    const vis = () => { if (!document.hidden && !reduce) wake(); };
    document.addEventListener("visibilitychange", vis);
    return () => {
      cancelAnimationFrame(raf); window.clearTimeout(timer); window.removeEventListener("load", begin); api.current = null;
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  const satin = "linear-gradient(90deg,#16357f 0%,#3f84ec 14%,#a6ccff 34%,#4F98FB 52%,#2f6fd6 80%,#122c6e 100%)";

  return (
    <div
      className="relative flex min-h-[560px] w-full flex-col items-center justify-center overflow-hidden overflow-clip bg-[#F6F4EF] bg-[radial-gradient(70%_55%_at_50%_34%,#FFFFFF_0%,#F6F4EF_55%,#E9E5DC_100%)] px-2 py-8 text-[#0B0D12] sm:min-h-[780px]"
      style={{ fontFamily: FONT }}
    >
      <style>{`
        .satin-opening-ribbon-page { transition: filter 700ms ease, box-shadow 700ms ease; }
        @media (prefers-reduced-motion: reduce) { .satin-opening-ribbon-page { transition: none; } }
      `}</style>
      <div ref={stage} className="relative flex w-full max-w-[1000px] justify-center" style={{ height: H * zoom }}>
        <div className="relative shrink-0" style={{ width: W, height: H, zoom }}>
          {/* where the wall meets the floor */}
          <div aria-hidden="true" className="absolute" style={{ left: -400, right: -400, top: FLOOR - 26, height: 140, background: "linear-gradient(180deg,rgba(214,207,193,0) 0%,rgba(214,207,193,0.55) 22%,rgba(226,221,210,0.4) 60%,rgba(226,221,210,0) 100%)" }} />

          {/* the page, mounted on board and hung on the wall */}
          <div aria-hidden="true" className="absolute rounded-[12px]" style={{ left: 196, top: 56, width: 400, height: 272, background: "rgba(60,46,20,0.3)", filter: "blur(22px)" }} />
          <div
            role="img"
            aria-label={`The ${site.name} homepage, ${live ? "now live" : "still a draft behind the ribbon"}`}
            className="satin-opening-ribbon-page absolute overflow-hidden rounded-[10px] bg-[#FFFFFF]"
            style={{ left: 180, top: 30, width: 400, height: 272, filter: live ? "none" : "saturate(0.5) brightness(0.93)", boxShadow: "0 0 0 1px rgba(11,13,18,0.1), 1px 1px 0 #d9d4c8, 2px 2px 0 #cdc7ba, 3px 3px 0 #c2bbad, 4px 4px 0 #b5ae9f, 10px 16px 22px -10px rgba(40,30,12,0.4)" }}
          >
            <div className="absolute left-[18px] right-[18px] top-[14px] flex h-[26px] items-center justify-between">
              <span className="flex items-center gap-[6px] whitespace-nowrap text-[12.5px] font-extrabold tracking-[-0.03em]"><span className="h-[9px] w-[9px] rounded-full" style={{ background: BLUE }} />{site.name}</span>
              <span className="flex gap-[13px] text-[10.5px] font-bold text-[#0B0D12]/70">{site.links.map((l) => <span key={l}>{l}</span>)}</span>
            </div>
            <div className="absolute left-[18px] top-[58px] w-[196px] text-[35px] font-extrabold leading-[0.95] tracking-[-0.05em]">{site.headline}</div>
            <div className="absolute left-[18px] top-[166px] w-[190px] text-[11.5px] font-semibold leading-[1.36] text-[#0B0D12]/70">{site.copy}</div>
            <div className="absolute left-[18px] top-[220px] flex h-[34px] items-center rounded-full bg-[#0B0D12] px-[16px] text-[12px] font-extrabold tracking-[-0.01em] text-white"><span className="mr-[7px] h-[6px] w-[6px] rounded-full" style={{ background: BLUE }} />{site.cta}</div>
            <div className="absolute right-[16px] top-[52px] h-[204px] w-[152px] overflow-hidden rounded-[14px] bg-[#d9cfc2]">
              <img src={site.photo} alt="" width={900} height={1350} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: "50% 46%" }} />
            </div>
            
          </div>

          <Post x={POST_L} />
          <Post x={POST_R} />

          {/* back blade, then the ribbon, then the front blade: the satin really is between them */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(-40px -40px ${H - FLOOR + 34}px -40px)` }}>
            <div ref={(el) => { tools.current[0] = el; }} className="absolute inset-0" style={{ willChange: "transform" }}>
            <div ref={(el) => { blades.current[0] = el; }} className="absolute" style={{ left: W / 2, top: PIVOT_Y, width: 0, height: 0, filter: "brightness(0.8) saturate(0.9)", willChange: "transform" }}>
              <div className="absolute" style={{ left: -80, top: -150, transform: "scale(1.2)", transformOrigin: "80px 150px" }}><Half id="satin-opening-ribbon-a" front={false} /></div>
            </div>
            </div>
          </div>
          <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute left-0 top-0" style={{ width: W, height: H }} />
          {/* the ribbon knotted round each post, with a short tail */}
          {[POST_L, POST_R].map((x, i) => (
            <div key={x} aria-hidden="true" className="absolute" style={{ left: x, top: RY }}>
              <div className="absolute" style={{ left: i ? 2 : -20, top: 14, width: 18, height: 58, background: satin, clipPath: "polygon(0 0,100% 0,100% 100%,50% 82%,0 100%)", transform: `rotate(${i ? -7 : 8}deg)`, transformOrigin: "50% 0", filter: "brightness(0.86)" }} />
              <div className="absolute" style={{ left: -12, top: -25, width: 24, height: 50, borderRadius: "9px / 5px", background: "linear-gradient(90deg,rgba(9,24,66,0.55) 0%,rgba(9,24,66,0) 26%,rgba(255,255,255,0.22) 44%,rgba(9,24,66,0) 62%,rgba(9,24,66,0.6) 100%),repeating-linear-gradient(176deg,rgba(9,24,66,0) 0 9px,rgba(9,24,66,0.3) 9px 10px,rgba(255,255,255,0.22) 10px 11px,rgba(9,24,66,0) 11px 17px),linear-gradient(180deg,#1b3f94 0%,#3f84ec 14%,#8fc0ff 32%,#4F98FB 52%,#2f6fd6 80%,#17367f 100%)", boxShadow: "0 6px 8px -3px rgba(20,24,50,0.5), 0 0 0 0.5px #122c6e" }} />
            </div>
          ))}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(-40px -40px ${H - FLOOR + 34}px -40px)` }}>
            <div ref={(el) => { tools.current[1] = el; }} className="absolute inset-0" style={{ willChange: "transform" }}>
            <div ref={(el) => { blades.current[1] = el; }} className="absolute" style={{ left: W / 2, top: PIVOT_Y, width: 0, height: 0, filter: "drop-shadow(5px 12px 8px rgba(40,30,12,0.35))", willChange: "transform" }}>
              <div className="absolute" style={{ left: -80, top: -150, transform: "scale(-1.2,1.2)", transformOrigin: "80px 150px" }}><Half id="satin-opening-ribbon-b" front /></div>
            </div>
            </div>
          </div>
          {/* press the scissors themselves */}
          {!live && <div aria-hidden="true" onClick={() => api.current?.set(true)} className="absolute cursor-pointer" style={{ left: W / 2 - 80, top: PIVOT_Y - 140, width: 160, height: 300 }} />}
        </div>
      </div>

      <div className="relative mt-2 flex items-center gap-[12px]">
        <span className="flex h-[30px] items-center gap-[8px] rounded-full bg-[#0B0D12]/[0.06] pl-[10px] pr-[13px] text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#0B0D12]">
          <span aria-hidden="true" className="h-[9px] w-[9px] rounded-full" style={{ background: live ? BLUE : "#9b968b", boxShadow: live ? "0 0 0 4px rgba(79,152,251,0.25)" : "none" }} />
          {live ? "Live" : "Draft"}
        </span>
        <button
          type="button"
          aria-pressed={live}
          onClick={() => api.current?.set(!live)}
          className="flex h-[52px] items-center gap-[10px] rounded-full bg-[#0B0D12] px-[26px] text-[15px] font-extrabold tracking-[-0.01em] text-[#F6F4EF] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_18px_28px_-14px_rgba(11,13,18,0.7)] outline-none transition-transform duration-150 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F4EF] motion-reduce:transition-none"
        >
          {live ? "Tie a new ribbon" : "Cut the ribbon"}
        </button>
      </div>
      <p aria-live="polite" className="mt-[12px] text-center text-[12px] font-semibold tracking-[-0.005em] text-[#0B0D12]/70">
        {live ? `${site.address} is open: ribbon cut, both halves down` : "Draft: the page is finished, the ribbon is still across it"}
      </p>
    </div>
  );
}

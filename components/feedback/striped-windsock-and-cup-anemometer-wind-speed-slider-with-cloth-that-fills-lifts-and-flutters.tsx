import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here.
const MAX = 30; // top of the slider, in knots
const START = 16; // wind on load
const BANDS = 5; // stripes on the sock
const KNOTS_PER_BAND = 3; // the rule of thumb: one more stripe flies for every three knots
const ORANGE = [246, 98, 22], WHITE = [250, 248, 242];
const DEMO = true; // let the wind drop and pick up again until somebody moves the slider
const names: [number, string][] = [[1, "Calm"], [4, "Light air"], [7, "Light breeze"], [11, "Gentle breeze"], [17, "Moderate breeze"], [22, "Fresh breeze"], [28, "Strong breeze"], [99, "Near gale"]];

const W = 720, H = 700, MX = 196, HX = 256, HY = 276, R0 = 50, R1 = 23, LEN = 336; // canvas, mast, hoop centre, mouth and tail radius, sock length
const N = 15, SUB = 4, SEG = LEN / N, SQUASH = 0.3, AY = 128; // chain links, smoothing, how edge-on the hoop is, cup height
const TAU = Math.PI * 2;
const STOPS = [-1, -0.8, -0.62, -0.5, -0.38, -0.15, 0.1, 0.35, 0.6, 0.8, 0.92, 1]; // where across the tube the cloth colour is worked out
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const nameFor = (v: number) => (names.find(([top]) => v < top) || names[names.length - 1])[1];

export default function StripedWindsockAndAnemometer() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [wind, setWind] = useState(START);
  const live = useRef({ wind: START, touched: false });
  const api = useRef<{ wake: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let k = 1, ox = 0, VW = W, VH = H;
    const fit = () => {
      const cw = cv.clientWidth || W, ch = cv.clientHeight || H, sc = Math.min(cw / 640, (ch - 96) / (H - 40)), dpr = Math.min(2, window.devicePixelRatio || 1);
      k = sc * dpr; VW = cw / sc; VH = ch / sc; ox = Math.max(0, (VW - W) / 2);
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    };
    const s = { t: 0, v: START, spin: 0, omega: START * 0.45, swing: 0 };
    // The sock is a chain of points pulled down by its weight and sideways by the wind.
    const px = new Float32Array(N + 1), py = new Float32Array(N + 1), qx = new Float32Array(N + 1), qy = new Float32Array(N + 1);
    for (let i = 0; i <= N; i++) { px[i] = qx[i] = HX + i * SEG; py[i] = qy[i] = HY; }
    const clouds = [[40, 150, 1.5, 0.5], [420, 96, 1.1, 0.34], [640, 250, 1.9, 0.62], [250, 420, 1.3, 0.42], [820, 470, 1.6, 0.56], [-160, 330, 1.2, 0.4]].map(([x, y, sz, sp]) => ({ x, y, sz, sp }));

    const sim = (dt: number) => {
      const gust = 1 + 0.16 * Math.sin(s.t * 1.7) + 0.1 * Math.sin(s.t * 4.3 + 1) + 0.05 * Math.sin(s.t * 9.1);
      const v = s.v * gust, G = 1500, push = G * 9.5 * (v / 15) * (v / 15), drag = Math.pow(0.9, dt * 60);
      for (let i = 2; i <= N; i++) {
        const f = i / N, flutter = G * 1.5 * Math.min(1, v / 7) * f * f * (Math.sin(i * 0.85 - s.t * (7 + v * 0.45)) + 0.5 * Math.sin(i * 1.7 - s.t * (11 + v * 0.6)));
        const vx = (px[i] - qx[i]) * drag, vy = (py[i] - qy[i]) * drag;
        qx[i] = px[i]; qy[i] = py[i];
        px[i] += vx + push * (1 - 0.46 * f) * dt * dt; py[i] += vy + (G + flutter) * dt * dt;
      }
      const a1 = Math.atan2(G, push + 1) * 0.5; // the hoop holds the first link part of the way up
      px[0] = HX; py[0] = HY; px[1] = HX + SEG * Math.cos(a1); py[1] = HY + SEG * Math.sin(a1);
      for (let n = 0; n < 14; n++) for (let i = 2; i <= N; i++) {
        const dx = px[i] - px[i - 1], dy = py[i] - py[i - 1], d = Math.hypot(dx, dy) || 1, c = (d - SEG) / d;
        if (i === 2) { px[i] -= dx * c; py[i] -= dy * c; } else { px[i] -= dx * c * 0.5; py[i] -= dy * c * 0.5; px[i - 1] += dx * c * 0.5; py[i - 1] += dy * c * 0.5; }
      }
      // It cannot blow through the mast side of the hoop.
      const keep = HX + 12 + 30 * (1 - clamp(s.v / 9, 0, 1));
      for (let i = 2; i <= N; i++) if (px[i] < keep) px[i] = keep;
    };

    const mix = (a: number[], b: number[], f: number) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
    const rgb = (c: number[], m: number) => `rgb(${clamp(c[0] * m, 0, 255) | 0},${clamp(c[1] * m, 0, 255) | 0},${clamp(c[2] * m, 0, 255) | 0})`;
    const steel = (x0: number, x1: number, dark = 0) => {
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, dark ? "#3a4048" : "#aeb7c0"); g.addColorStop(0.3, dark ? "#8b939c" : "#ffffff"); g.addColorStop(0.62, dark ? "#474d55" : "#d5dbe1"); g.addColorStop(1, dark ? "#1c2025" : "#7c8792");
      return g;
    };

    const sky = () => {
      const g = ctx.createLinearGradient(0, 0, 0, VH);
      g.addColorStop(0, "#5f9fd6"); g.addColorStop(0.55, "#a5cdea"); g.addColorStop(1, "#e3f0f8");
      ctx.fillStyle = g; ctx.fillRect(-ox, 0, VW, VH);
      for (const c of clouds) {
        for (const [dx, dy, r] of [[0, 0, 70], [62, 12, 54], [-58, 14, 50], [24, -22, 48], [110, 22, 36], [-104, 24, 32]]) {
          const x = c.x + dx * c.sz, y = c.y + dy * c.sz * 0.5, rr = r * c.sz;
          ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.46);
          const p = ctx.createRadialGradient(0, -rr * 0.2, rr * 0.1, 0, 0, rr);
          p.addColorStop(0, `rgba(255,255,255,${0.5 * c.sp + 0.16})`); p.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = p; ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.fill(); ctx.restore();
        }
      }
    };

    const cup = (a: number) => {
      const arm = 60, rc = 19, x = MX + Math.cos(a) * arm, z = Math.sin(a), y = AY + z * arm * 0.15;
      const dx = -Math.sin(a), dz = Math.cos(a), sx = dx >= 0 ? 1 : -1;
      // The arm, then the cup: a half ball whose open face looks along its path.
      ctx.beginPath(); ctx.moveTo(MX, AY + z * 2); ctx.lineTo(x, y); ctx.lineWidth = 4.2; ctx.lineCap = "round"; ctx.strokeStyle = "#2b3138"; ctx.stroke();
      ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(226,234,242,0.75)"; ctx.beginPath(); ctx.moveTo(MX, AY + z * 2 - 1.2); ctx.lineTo(x, y - 1.2); ctx.stroke();
      const shell = () => { ctx.beginPath(); ctx.arc(x, y, rc, sx > 0 ? Math.PI / 2 : -Math.PI / 2, sx > 0 ? Math.PI * 1.5 : Math.PI / 2); ctx.ellipse(x, y, Math.max(0.6, rc * Math.abs(dz)), rc, 0, sx > 0 ? -Math.PI / 2 : Math.PI / 2, sx > 0 ? Math.PI / 2 : Math.PI * 1.5); ctx.closePath(); };
      shell();
      const out = ctx.createRadialGradient(x - 7, y - 9, 1, x, y, rc * 1.25);
      out.addColorStop(0, "#9aa5b0"); out.addColorStop(0.28, "#4b535c"); out.addColorStop(1, "#14181c");
      ctx.fillStyle = out; ctx.fill();
      ctx.beginPath(); ctx.ellipse(x - 6.5 - sx * 2, y - 9.5, 5.4, 2.6, -0.5, 0, TAU); ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fill();
      if (dz > 0.04) {
        ctx.beginPath(); ctx.ellipse(x, y, rc * dz, rc, 0, 0, TAU);
        const inn = ctx.createLinearGradient(x, y - rc, x, y + rc);
        inn.addColorStop(0, "#07090b"); inn.addColorStop(0.6, "#262c33"); inn.addColorStop(1, "#59626c");
        ctx.fillStyle = inn; ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = "rgba(214,224,234,0.8)"; ctx.stroke();
      }
    };
    const anemometer = () => {
      const order = [0, 1, 2].map((i) => s.spin + (i * TAU) / 3).sort((a, b) => Math.sin(a) - Math.sin(b));
      ctx.fillStyle = steel(MX - 4, MX + 4); ctx.fillRect(MX - 4, AY + 6, 8, 96);
      for (const a of order) if (Math.sin(a) < 0) cup(a);
      ctx.fillStyle = steel(MX - 11, MX + 11, 1); ctx.beginPath(); ctx.moveTo(MX - 11, AY + 12); ctx.lineTo(MX - 11, AY - 7); ctx.quadraticCurveTo(MX, AY - 15, MX + 11, AY - 7); ctx.lineTo(MX + 11, AY + 12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillRect(MX - 11, AY + 3, 22, 1.2);
      for (const a of order) if (Math.sin(a) >= 0) cup(a);
    };

    const mast = () => {
      ctx.beginPath(); ctx.moveTo(MX - 7, 230); ctx.lineTo(MX + 7, 230); ctx.lineTo(MX + 10.5, VH + 4); ctx.lineTo(MX - 10.5, VH + 4); ctx.closePath(); ctx.fillStyle = steel(MX - 10, MX + 10); ctx.fill();
      for (const y of [452, 640]) { ctx.fillStyle = "rgba(60,72,84,0.28)"; ctx.fillRect(MX - 10, y, 20, 1.4); ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillRect(MX - 10, y + 1.4, 20, 1); }
      // Swivel sleeve and the two rods that carry the hoop round with the wind.
      const rod = (x0: number, y0: number, x1: number, y1: number) => {
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineCap = "round"; ctx.lineWidth = 5; ctx.strokeStyle = "#59636d"; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x0, y0 - 1.3); ctx.lineTo(x1, y1 - 1.3); ctx.lineWidth = 1.4; ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.stroke();
      };
      rod(MX + 6, HY - 26, HX, HY - R0); rod(MX + 6, HY + 26, HX, HY + R0);
      ctx.fillStyle = steel(MX - 13, MX + 13, 1); ctx.beginPath(); ctx.roundRect(MX - 13, HY - 40, 26, 80, 5); ctx.fill();
      for (const y of [HY - 30, HY + 28]) { ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(MX - 13, y, 26, 1.6); ctx.fillStyle = "rgba(255,255,255,0.32)"; ctx.fillRect(MX - 13, y + 1.6, 26, 1); }
    };

    const sock = () => {
      const fill = clamp(s.v / 9, 0, 1), body = 0.6 + 0.4 * fill;
      // Smooth the chain, then lay cloth either side of it.
      const cx: number[] = [], cy: number[] = [];
      for (let i = 0; i < N; i++) {
        const a = Math.max(0, i - 1), b = i, c = i + 1, d = Math.min(N, i + 2);
        for (let u = 0; u < SUB; u++) {
          const t = u / SUB, t2 = t * t, t3 = t2 * t;
          cx.push(0.5 * (2 * px[b] + (px[c] - px[a]) * t + (2 * px[a] - 5 * px[b] + 4 * px[c] - px[d]) * t2 + (3 * px[b] - px[a] - 3 * px[c] + px[d]) * t3));
          cy.push(0.5 * (2 * py[b] + (py[c] - py[a]) * t + (2 * py[a] - 5 * py[b] + 4 * py[c] - py[d]) * t2 + (3 * py[b] - py[a] - 3 * py[c] + py[d]) * t3));
        }
      }
      cx.push(px[N]); cy.push(py[N]);
      const M = cx.length - 1, nx: number[] = [], ny: number[] = [], rr: number[] = [];
      for (let j = 0; j <= M; j++) {
        const a = Math.max(0, j - 1), b = Math.min(M, j + 1), dx = cx[b] - cx[a], dy = cy[b] - cy[a], d = Math.hypot(dx, dy) || 1, f = j / M;
        // At the hoop the cloth is held upright, whichever way the rest of it hangs.
        const hold = 1 - clamp(j / (SUB * 2.5), 0, 1), ax = (-dy / d) * (1 - hold), ay = (dx / d) * (1 - hold) + hold, al = Math.hypot(ax, ay) || 1;
        nx.push(ax / al); ny.push(ay / al);
        const slack = 1 - body, wob = 1 + slack * 0.22 * Math.sin(f * 17 + 1.3) + 0.045 * fill * f * Math.sin(f * 22 - s.t * 11);
        rr.push((R0 + (R1 - R0) * f) * (1 - (1 - body) * Math.min(1, f * 5)) * wob);
      }
      // Soft shadow of the sock on itself is in the strips: lit from above, warm underneath, a little light back off the sky at the very bottom.
      for (let j = 0; j < M; j++) {
        const f = (j + 0.5) / M, band = Math.min(BANDS - 1, Math.floor(f * BANDS)), base = band % 2 ? WHITE : ORANGE;
        const turn = nx[j + 1] * ny[j] - ny[j + 1] * nx[j], ripple = 1 + 0.05 * Math.sin(j * 0.33 - s.t * 7) * fill;
        const ux = (cx[j] + cx[j + 1]) / 2, uy = (cy[j] + cy[j + 1]) / 2, mr = (rr[j] + rr[j + 1]) / 2;
        const g = ctx.createLinearGradient(ux - nx[j] * mr, uy - ny[j] * mr, ux + nx[j] * mr, uy + ny[j] * mr);
        for (const vm of STOPS) {
          let lum = 0.6 + 0.44 * Math.cos((vm + 0.38) * 1.32) + (vm > 0.72 ? 0.34 * (vm - 0.72) : 0) + 0.1 * Math.exp(-Math.pow((vm + 0.5) / 0.13, 2));
          lum *= ripple * (1 + clamp(turn * vm * 5, -0.2, 0.2)) * (1 + (1 - fill) * 0.14 * Math.sin(vm * 8 + f * 8) + 0.035 * Math.sin(vm * 13 + f * 11));
          if (j < 2) lum *= 0.86; // the binding tape round the mouth
          const shade = clamp((1 - lum) * 1.5, 0, 1);
          const col = band % 2 ? mix(base, [146, 172, 206], shade * 0.78) : mix(base, [160, 40, 4], shade * 0.82);
          g.addColorStop((vm + 1) / 2, rgb(col, band % 2 ? 0.74 + 0.28 * Math.min(1, lum) : 0.8 + 0.24 * Math.min(1.12, lum)));
        }
        ctx.beginPath();
        ctx.moveTo(cx[j] - nx[j] * rr[j], cy[j] - ny[j] * rr[j]); ctx.lineTo(cx[j + 1] - nx[j + 1] * rr[j + 1], cy[j + 1] - ny[j + 1] * rr[j + 1]);
        ctx.lineTo(cx[j + 1] + nx[j + 1] * rr[j + 1], cy[j + 1] + ny[j + 1] * rr[j + 1]); ctx.lineTo(cx[j] + nx[j] * rr[j], cy[j] + ny[j] * rr[j]); ctx.closePath();
        ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(0.8, 1.3 / k); ctx.strokeStyle = g; ctx.stroke();
        // Stitched seam where two colours meet.
        if (j && Math.floor(((j - 0.5) / M) * BANDS) !== band) {
          ctx.beginPath(); ctx.moveTo(cx[j] - nx[j] * rr[j], cy[j] - ny[j] * rr[j]); ctx.quadraticCurveTo(cx[j] + ny[j] * rr[j] * SQUASH * 0.9, cy[j] - nx[j] * rr[j] * SQUASH * 0.9, cx[j] + nx[j] * rr[j], cy[j] + ny[j] * rr[j]);
          ctx.lineWidth = 1.3; ctx.strokeStyle = "rgba(96,40,10,0.42)"; ctx.stroke();
        }
      }
      // The open tail, hemmed.
      const ta = Math.atan2(ny[M], nx[M]) - Math.PI / 2;
      ctx.save(); ctx.translate(cx[M], cy[M]); ctx.rotate(ta);
      ctx.beginPath(); ctx.ellipse(0, 0, rr[M] * SQUASH, rr[M], 0, -Math.PI / 2, Math.PI / 2); ctx.closePath();
      const tg = ctx.createLinearGradient(0, -rr[M], 0, rr[M]);
      tg.addColorStop(0, rgb(ORANGE, 1.02)); tg.addColorStop(1, rgb([164, 44, 6], 1));
      ctx.fillStyle = tg; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 0, rr[M] * SQUASH, rr[M], 0, -Math.PI / 2, Math.PI / 2); ctx.lineWidth = 2.2; ctx.strokeStyle = "rgba(120,36,4,0.8)"; ctx.stroke();
      ctx.restore();
      // The mouth: we look a little way into it, past the steel hoop the cloth is laced to.
      ctx.beginPath(); ctx.ellipse(HX, HY, R0 * SQUASH, R0, 0, 0, TAU);
      const ins = ctx.createLinearGradient(HX - R0 * SQUASH, HY - R0, HX + R0 * SQUASH, HY + R0);
      ins.addColorStop(0, "#5a1c02"); ins.addColorStop(0.55, "#b8480c"); ins.addColorStop(1, "#f08a3c");
      ctx.fillStyle = ins; ctx.fill();
      ctx.lineWidth = 5.5; ctx.strokeStyle = "#4b545e"; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(HX - 0.8, HY - 0.8, R0 * SQUASH, R0, 0, Math.PI * 0.95, Math.PI * 1.6); ctx.lineWidth = 1.6; ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.stroke();
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + 0.2; ctx.beginPath(); ctx.arc(HX + Math.cos(a) * R0 * SQUASH, HY + Math.sin(a) * R0, 1.5, 0, TAU); ctx.fillStyle = "#e6ebf0"; ctx.fill(); }
    };

    const draw = () => {
      ctx.setTransform(k, 0, 0, k, ox * k, 0);
      sky(); mast(); sock(); anemometer();
    };
    const step = (dt: number) => {
      s.t += dt;
      if (DEMO && !live.current.touched) {
        const c = s.t % 16, want = c < 6 ? START : c < 10.5 ? 5 : START;
        if (want !== live.current.wind && Math.abs(want - s.v) > 0.5) { const next = Math.round(live.current.wind + Math.sign(want - live.current.wind)); live.current.wind = next; setWind(next); }
      }
      s.v += (live.current.wind - s.v) * Math.min(1, dt * 1.6);
      s.omega += (Math.min(10.5, s.v * 0.46) - s.omega) * Math.min(1, dt * 1.2); s.spin += s.omega * dt;
      for (const c of clouds) { c.x += s.v * 2.2 * c.sp * dt; if (c.x > W + ox + 240 * c.sz) c.x = -ox - 240 * c.sz; }
      sim(dt / 2); sim(dt / 2);
    };

    let raf = 0, last = 0, seen = true;
    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.03, (now - last) / 1000); last = now;
      step(dt); draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const settle = () => { s.v = live.current.wind; for (let i = 0; i < 240; i++) sim(1 / 120); };
    const wake = () => { if (reduce) { settle(); draw(); return; } if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
    api.current = { wake };
    fit(); settle(); wake();

    const ro = new ResizeObserver(() => { fit(); if (reduce) draw(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const flying = Math.min(BANDS, Math.floor(wind / KNOTS_PER_BAND));
  const change = (next: number) => { live.current.wind = next; live.current.touched = true; setWind(next); api.current?.wake(); };

  return (
    <div className="relative h-[560px] w-full overflow-hidden bg-[#a5cdea] sm:h-[760px]">
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-x-0 bottom-5 mx-auto w-[min(88%,380px)] rounded-2xl bg-white/95 px-5 pb-3 pt-3 shadow-[0_10px_30px_-12px_rgba(20,50,90,0.45)] ring-1 ring-white/70">
        <div className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-[#3d5266]">
          <label htmlFor="windsock-speed" className="text-[#0f2233]">Wind {wind} kn</label>
          <span>{nameFor(wind)}</span>
        </div>
        <input
          id="windsock-speed"
          type="range"
          min={0}
          max={MAX}
          step={1}
          value={wind}
          onChange={(e) => change(Number(e.target.value))}
          aria-valuetext={`${wind} knots, ${nameFor(wind)}, ${flying} of ${BANDS} bands flying`}
          className="mt-2 h-6 w-full cursor-pointer accent-[#e2571c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2233] focus-visible:ring-offset-2"
        />
        <p className="mt-1 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-[#3d5266]">
          <span className="text-[#b8400c]">{flying} of {BANDS}</span> bands flying
        </p>
      </div>
    </div>
  );
}

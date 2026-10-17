import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

// What the switch controls, and the line shown for each state.
const LABEL = "Lock layout";
const NOTES = { on: "Clamped. Nothing moves until the jaws open.", off: "Open. Sections can be dragged around the page." };
const START_ON = true;
const DEMO = true; // the vice opens and shuts by itself when idle. Set to false for a real setting.
const PAINT = ["#79a8ee", "#2d63b6", "#143568"]; // enamel: lit, body, shaded
const TURNS = 3.25; // turns of the bar from fully open to biting
const OPEN = 96; // jaw gap when open
const BLOCK = 54; // width of the oak block the jaws close on

export default function CastIronBenchViceSwitch() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pad = useRef<HTMLButtonElement>(null);
  const [on, setOn] = useState(START_ON);
  const api = useRef<{ toggle: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, btn = pad.current;
    if (!cv || !btn) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0, k = 1, ox = 0, oy = 0;

    let seed = 23;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    // Hammered enamel: small pools of lighter and darker paint.
    const ham = document.createElement("canvas");
    ham.width = ham.height = 220;
    const hx2 = ham.getContext("2d");
    if (hx2) for (let i = 0; i < 3200; i++) {
      const x = rnd() * 220, y = rnd() * 220, r = 0.5 + rnd() * 2.1, light = rnd() > 0.5;
      for (const [dx, dy] of [[0, 0], [220, 0], [0, 220], [-220, 0], [0, -220]]) {
        hx2.beginPath(); hx2.ellipse(x + dx, y + dy, r, r * (0.6 + rnd() * 0.4), rnd() * 3, 0, Math.PI * 2);
        hx2.fillStyle = light ? `rgba(190,220,255,${0.04 + rnd() * 0.1})` : `rgba(0,10,40,${0.04 + rnd() * 0.11})`; hx2.fill();
      }
    }
    const hammer = ctx.createPattern(ham, "repeat");
    const grainA = Array.from({ length: 40 }, () => rnd());

    const s = { p: START_ON ? (DEMO ? 0.8 : 1) : 0, v: 0, target: START_ON ? (DEMO ? 0.8 : 1) : 0, on: START_ON, drag: false, raw: 0, jolt: 0, joltV: 0 };

    const layout = () => {
      W = cv.clientWidth; H = cv.clientHeight;
      k = Math.min(W / 560, H / 318, 1.75);
      ox = W / 2 - 292 * k; oy = H / 2 - 266 * k;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    };

    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    };
    const glow = (blur: number, dx: number, dy: number, a: number) => { ctx.shadowColor = `rgba(0,0,0,${a})`; ctx.shadowBlur = blur * dpr * k; ctx.shadowOffsetX = dx * dpr * k; ctx.shadowOffsetY = dy * dpr * k; };

    // Painted iron: a body gradient, the hammered texture, then soft light on the upper edges and shade on the lower.
    const casting = (build: () => void, g: number[]) => {
      const grad = ctx.createLinearGradient(g[0], g[1], g[2], g[3]);
      grad.addColorStop(0, PAINT[0]); grad.addColorStop(0.32, PAINT[1]); grad.addColorStop(1, PAINT[2]);
      build(); ctx.fillStyle = grad; ctx.fill();
      ctx.save(); ctx.clip();
      if (hammer) { ctx.fillStyle = hammer; ctx.fillRect(-200, 100, 900, 320); }
      // Wet-look gloss where the lamp sits on the enamel.
      const gl = ctx.createRadialGradient(g[0] + 14, g[1] + 22, 2, g[0] + 14, g[1] + 22, 74);
      gl.addColorStop(0, "rgba(235,245,255,0.5)"); gl.addColorStop(0.35, "rgba(235,245,255,0.12)"); gl.addColorStop(1, "rgba(235,245,255,0)");
      ctx.fillStyle = gl; ctx.fillRect(-200, 100, 900, 320);
      ctx.lineJoin = "round";
      ctx.translate(1.3, 2.4); build();
      ctx.lineWidth = 9; ctx.strokeStyle = "rgba(210,232,255,0.12)"; ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = "rgba(225,240,255,0.55)"; ctx.stroke();
      ctx.translate(-2.8, -5.2); build();
      ctx.lineWidth = 12; ctx.strokeStyle = "rgba(2,10,30,0.2)"; ctx.stroke();
      ctx.lineWidth = 2.4; ctx.strokeStyle = "rgba(2,10,30,0.5)"; ctx.stroke();
      ctx.restore();
      build(); ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(2,6,16,0.7)"; ctx.stroke();
    };
    // Bright steel bar lying left to right.
    const bar = (x: number, y: number, w: number, h: number, r = 1.5) => {
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, "#5d636b"); g.addColorStop(0.14, "#dfe3e7"); g.addColorStop(0.3, "#ffffff"); g.addColorStop(0.52, "#b4bac1"); g.addColorStop(0.84, "#676d76"); g.addColorStop(1, "#33373d");
      rr(x, y, w, h, r); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(4,6,10,0.9)"; ctx.stroke();
    };
    const ball = (x: number, y: number, r: number) => {
      const g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.08, x, y, r);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.22, "#e2e6ea"); g.addColorStop(0.6, "#8d949d"); g.addColorStop(0.88, "#3f444b"); g.addColorStop(1, "#6d737b");
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(4,6,10,0.9)"; ctx.stroke();
    };
    const plate = (x: number) => {
      const g = ctx.createLinearGradient(x, 0, x + 8, 0);
      g.addColorStop(0, "#f3f5f7"); g.addColorStop(0.4, "#b9bec5"); g.addColorStop(1, "#5a6068");
      rr(x, 173, 8, 40, 1); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(4,6,10,0.9)"; ctx.stroke();
      for (let y = 176; y < 211; y += 2.2) { ctx.fillStyle = "rgba(10,14,20,0.4)"; ctx.fillRect(x + 0.6, y, 6.8, 0.7); }
      ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.fillRect(x + 0.6, 173.6, 6.8, 0.9);
    };
    const bolt = (x: number) => {
      rr(x - 15, 334, 30, 4, 1); ctx.fillStyle = "#7d838b"; ctx.fill(); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(4,6,10,0.9)"; ctx.stroke();
      const g = ctx.createLinearGradient(x - 11, 0, x + 11, 0);
      g.addColorStop(0, "#8f959d"); g.addColorStop(0.27, "#9aa0a8"); g.addColorStop(0.28, "#eef0f3"); g.addColorStop(0.7, "#c6cbd1"); g.addColorStop(0.71, "#6c727a"); g.addColorStop(1, "#484d55");
      rr(x - 11, 323, 22, 11, 1.5); ctx.fillStyle = g; ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillRect(x - 10, 323.7, 20, 0.9);
    };

    const fixedBody = () => {
      ctx.beginPath(); ctx.moveTo(308, 172); ctx.lineTo(348, 172); ctx.quadraticCurveTo(362, 172, 366, 187); ctx.lineTo(371, 206); ctx.lineTo(450, 206);
      ctx.quadraticCurveTo(464, 206, 464, 220); ctx.lineTo(462, 238); ctx.quadraticCurveTo(458, 268, 448, 292); ctx.quadraticCurveTo(442, 318, 452, 338);
      ctx.lineTo(490, 338); ctx.quadraticCurveTo(502, 338, 502, 349); ctx.lineTo(502, 360); ctx.lineTo(228, 360); ctx.lineTo(228, 349); ctx.quadraticCurveTo(228, 338, 240, 338);
      ctx.lineTo(272, 338); ctx.quadraticCurveTo(298, 322, 300, 292); ctx.lineTo(300, 222); ctx.lineTo(308, 222); ctx.closePath();
    };
    const movingBody = () => {
      ctx.beginPath(); ctx.moveTo(292, 172); ctx.lineTo(254, 172); ctx.quadraticCurveTo(238, 172, 233, 190); ctx.lineTo(226, 224); ctx.quadraticCurveTo(218, 230, 218, 240);
      ctx.lineTo(218, 278); ctx.quadraticCurveTo(218, 288, 228, 288); ctx.lineTo(282, 288); ctx.quadraticCurveTo(292, 288, 292, 278); ctx.closePath();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.translate(ox + s.jolt * k, oy); ctx.scale(k, k);
      const p = s.p, gap = OPEN - Math.min(p, 1.02) * (OPEN - BLOCK), th = p * TURNS * Math.PI * 2 + 0.5;

      // The bench block the vice is bolted to.
      ctx.save(); glow(34, 0, 26, 0.7); rr(44, 362, 496, 40, 5); ctx.fillStyle = "#1d130b"; ctx.fill(); ctx.restore();
      const wood = ctx.createLinearGradient(0, 360, 0, 404);
      wood.addColorStop(0, "#c08d58"); wood.addColorStop(0.08, "#93663c"); wood.addColorStop(0.55, "#6b4626"); wood.addColorStop(1, "#3a2513");
      rr(40, 360, 504, 44, 5); ctx.fillStyle = wood; ctx.fill();
      ctx.save(); ctx.clip();
      for (let i = 0; i < 16; i++) {
        const y = 363 + i * 2.6 + grainA[i] * 1.6;
        ctx.beginPath(); ctx.moveTo(40, y);
        for (let x = 40; x <= 544; x += 42) ctx.lineTo(x, y + Math.sin(x * 0.011 + grainA[i + 16] * 9) * 1.5);
        ctx.lineWidth = 0.5 + grainA[i + 8] * 0.9; ctx.strokeStyle = grainA[i] > 0.4 ? `rgba(30,16,6,${0.2 + grainA[i] * 0.3})` : "rgba(240,200,150,0.14)"; ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,226,180,0.55)"; ctx.fillRect(40, 360, 504, 1.2);
      const foot = ctx.createLinearGradient(0, 360, 0, 367);
      foot.addColorStop(0, "rgba(0,0,0,0.5)"); foot.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = foot; ctx.fillRect(229, 360, 272, 7);
      ctx.restore();
      rr(40, 360, 504, 44, 5); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(10,6,2,0.9)"; ctx.stroke();

      // The slide the front jaw rides on, and the oak block standing on it.
      ctx.save(); glow(10, 0, 6, 0.5); bar(300 - gap - 30, 238, gap + 60, 34, 2); ctx.restore();
      ctx.fillStyle = "rgba(10,14,20,0.35)"; ctx.fillRect(300 - gap - 30, 253, gap + 60, 1);
      const bw = BLOCK - Math.max(0, p - 1) * 30, bx0 = 300 - bw;
      const oak = ctx.createLinearGradient(bx0, 0, bx0 + bw, 0);
      oak.addColorStop(0, "#c99555"); oak.addColorStop(0.2, "#e3b877"); oak.addColorStop(0.7, "#d3a463"); oak.addColorStop(1, "#a97a41");
      ctx.save(); glow(8, 3, 2, 0.5); ctx.beginPath(); ctx.rect(bx0, 136, bw, 102); ctx.fillStyle = oak; ctx.fill(); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(bx0, 136, bw, 102); ctx.clip();
      for (let i = 0; i < 20; i++) {
        const x = bx0 + (i / 20) * bw + grainA[i] * 2;
        ctx.beginPath(); ctx.moveTo(x, 136);
        for (let y = 136; y <= 238; y += 17) ctx.lineTo(x + Math.sin(y * 0.03 + grainA[i + 20] * 8) * 1.6, y);
        ctx.lineWidth = 0.4 + grainA[i + 10] * 1.1; ctx.strokeStyle = `rgba(110,66,20,${0.12 + grainA[i] * 0.3})`; ctx.stroke();
      }
      const top = ctx.createLinearGradient(0, 136, 0, 150);
      top.addColorStop(0, "rgba(255,240,205,0.75)"); top.addColorStop(0.16, "rgba(255,240,205,0.12)"); top.addColorStop(1, "rgba(255,240,205,0)");
      ctx.fillStyle = top; ctx.fillRect(bx0, 136, bw, 14);
      // Carpenter's pencil: a cut line and the tick that says which side is waste.
      ctx.strokeStyle = "rgba(40,36,34,0.7)"; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(bx0, 156); ctx.lineTo(bx0 + bw, 155.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx0 + bw * 0.42, 150); ctx.lineTo(bx0 + bw * 0.5, 155.6); ctx.lineTo(bx0 + bw * 0.62, 143); ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.rect(bx0, 136, bw, 102); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(50,28,6,0.85)"; ctx.stroke();

      // Back jaw, anvil and foot: one casting.
      ctx.save(); glow(16, 5, 9, 0.5); fixedBody(); ctx.fillStyle = PAINT[2]; ctx.fill(); ctx.restore();
      casting(fixedBody, [300, 170, 470, 372]);
      bar(373, 203.5, 76, 5, 1.5);
      // A recessed panel with the size cast into it.
      rr(318, 242, 112, 40, 6); ctx.lineWidth = 2.4; ctx.strokeStyle = "rgba(2,10,30,0.45)"; ctx.stroke();
      rr(319, 243.4, 112, 40, 6); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(200,225,255,0.4)"; ctx.stroke();
      ctx.font = "800 23px ui-sans-serif, system-ui, Helvetica, Arial, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(2,10,30,0.6)"; ctx.fillText("No. 4", 375.2, 264.6);
      ctx.fillStyle = "rgba(215,232,255,0.7)"; ctx.fillText("No. 4", 373.1, 262.1);
      ctx.fillStyle = PAINT[1]; ctx.fillText("No. 4", 374, 263.2);
      bolt(250); bolt(477);
      plate(300);

      // Front jaw: it and everything on it move together.
      ctx.save(); ctx.translate(-gap, 0);
      ctx.save(); glow(14, 4, 8, 0.5); movingBody(); ctx.fillStyle = PAINT[2]; ctx.fill(); ctx.restore();
      casting(movingBody, [226, 168, 300, 300]);
      plate(292);
      // The tommy bar tumbles through the screw head: the far half is drawn first, the near half last.
      const hx = 190, hy = 256, R = 78, c = Math.cos(th), z = Math.sin(th);
      const half = (sign: number) => {
        const ey = hy - sign * R * c, depth = sign * z, w = 9.5 * (1 + depth * 0.1);
        const g = ctx.createLinearGradient(hx - w / 2, 0, hx + w / 2, 0);
        g.addColorStop(0, "#565c64"); g.addColorStop(0.3, "#ffffff"); g.addColorStop(0.55, "#b6bcc3"); g.addColorStop(1, "#3a3f46");
        ctx.save(); glow(8, 5, 5, 0.45);
        ctx.beginPath(); ctx.rect(hx - w / 2, Math.min(hy, ey), w, Math.abs(ey - hy)); ctx.fillStyle = g; ctx.fill();
        ball(hx, ey, 10.5 * (1 + depth * 0.14)); ctx.restore();
      };
      half(z >= 0 ? -1 : 1);
      bar(202, 242, 17, 30, 2);
      bar(176, 245, 27, 24, 5);
      ctx.beginPath(); ctx.ellipse(hx, hy, 5.2, 6.6, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(6,8,12,0.75)"; ctx.fill();
      half(z >= 0 ? 1 : -1);
      ctx.restore();
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, demoAt = 450;
    const flip = (next: boolean) => { if (s.on !== next) { s.on = next; setOn(next); } };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      if (DEMO && now - touched > 6000 && !s.drag && t > demoAt) {
        if (s.target > 0.5 && s.target < 1) { s.target = 1; demoAt = t + 4300; }
        else { s.target = s.target === 1 ? 0 : 1; flip(s.target === 1); demoAt = t + (s.target === 1 ? 4300 : 2400); }
      }
      const was = s.p;
      if (s.drag) { const np = s.p + (s.raw - s.p) * Math.min(1, dt * 26); s.v = (np - s.p) / Math.max(dt, 0.001); s.p = np; }
      else {
        // Winding takes a moment: the spring that drives it is speed-limited like a hand on the bar.
        s.v += (70 * (s.target - s.p) - 15 * s.v) * dt; s.v = Math.max(-1.25, Math.min(1.25, s.v)); s.p += s.v * dt;
      }
      if (was < 1 && s.p >= 1) { s.joltV += 55 + Math.abs(s.v) * 60; if (!s.drag) { s.p = 1 + Math.min(0.02, s.v * 0.012); s.v *= -0.2; } }
      s.joltV += (-900 * s.jolt - 34 * s.joltV) * dt; s.jolt += s.joltV * dt;
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const still = () => { if (!s.drag) s.p = s.target; s.v = 0; s.jolt = 0; draw(); };

    api.current = { toggle: () => { touched = performance.now(); const next = !s.on; flip(next); s.target = next ? 1 : 0; if (reduce) still(); else wake(); } };
    layout();
    if (reduce) { s.p = s.target = START_ON ? 1 : 0; still(); } else wake();

    let startX = 0, startP = 0, moved = 0;
    const onDown = (e: PointerEvent) => { touched = performance.now(); s.drag = true; startX = e.clientX; startP = s.p; s.raw = s.p; moved = 0; btn.setPointerCapture(e.pointerId); wake(); };
    const onMove = (e: PointerEvent) => {
      if (!s.drag) return;
      touched = performance.now(); moved = Math.max(moved, Math.abs(e.clientX - startX));
      let p = startP + (e.clientX - startX) / (150 * k);
      if (p > 1) p = 1 + (p - 1) * 0.04; // the block does not give
      s.raw = Math.max(0, p);
      if (reduce) { s.p = Math.min(1, s.raw); draw(); }
    };
    const onUp = () => {
      if (!s.drag) return;
      s.drag = false; touched = performance.now();
      const next = moved < 5 ? !s.on : s.p > 0.6; // a tap toggles, a drag decides by where the jaw was left
      flip(next); s.target = next ? 1 : 0;
      if (reduce) still();
    };
    btn.addEventListener("pointerdown", onDown);
    btn.addEventListener("pointermove", onMove);
    btn.addEventListener("pointerup", onUp);
    btn.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(() => { layout(); if (reduce) still(); else { draw(); wake(); } });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      btn.removeEventListener("pointerdown", onDown); btn.removeEventListener("pointermove", onMove);
      btn.removeEventListener("pointerup", onUp); btn.removeEventListener("pointercancel", onUp);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Pointer taps are handled on release above; this catches Enter and Space, which arrive as a click with no detail.
  const onClick = (e: ReactMouseEvent) => { if (e.detail === 0) api.current?.toggle(); };

  return (
    <div className="flex min-h-[600px] w-full flex-col items-center justify-center bg-[#0f1013] bg-[radial-gradient(80%_60%_at_50%_40%,#2a2c33_0%,#16171b_48%,#0f1013_100%)] px-3 py-10 sm:min-h-[760px] sm:px-8">
      <div className="relative w-full max-w-[940px]">
        <canvas ref={canvas} aria-hidden="true" className="block h-[270px] w-full sm:h-[560px]" />
        <button
          ref={pad}
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={LABEL}
          aria-describedby="bench-vice-switch-note"
          onClick={onClick}
          className="absolute inset-0 cursor-grab touch-pan-y select-none rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-[#79a8ee] active:cursor-grabbing"
        />
      </div>
      <p id="bench-vice-switch-note" aria-live="polite" className="mt-2 max-w-[440px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-zinc-400">
        <span className="text-zinc-100">{LABEL}</span>
        <span className="mx-2 text-zinc-600">/</span>
        <span className="text-zinc-100">{on ? "On" : "Off"}</span>
        <br />
        {on ? NOTES.on : NOTES.off}
      </p>
    </div>
  );
}

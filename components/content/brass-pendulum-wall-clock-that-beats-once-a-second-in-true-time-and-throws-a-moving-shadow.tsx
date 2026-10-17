import { useEffect, useRef, useState } from "react";

const SWING = 5.5; // degrees the pendulum travels either side of centre at rest
const PUSH = 17; // degrees it reaches when you press the button
const SETTLE = 0.3; // how quickly a wide swing falls back into step (per second)
const FACE = "#f3ecdb"; // enamel dial
const NUMERALS = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
const W = 440, H = 600, CX = 220, CY = 140, R = 112, ROD = 352, BOB = 37;

const pad2 = (n: number) => String(n).padStart(2, "0");

export default function BrassPendulumWallClock() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const [clock, setClock] = useState("--:--:--");
  const push = useRef<() => void>(() => {});

  useEffect(() => {
    const cv = canvas.current, area = hit.current;
    if (!cv || !area) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    const conic = typeof ctx.createConicGradient === "function";
    const A0 = (SWING * Math.PI) / 180;

    // Brass from a brightness value: dark bronze through yellow to an almost white glint.
    const brass = (v: number) => { const c = Math.max(0, Math.min(255, v)), hi = Math.max(0, c - 196); return `rgb(${Math.min(255, c * 1.02 + 6) | 0},${Math.min(255, c * 0.78 + hi * 0.95) | 0},${Math.min(255, c * 0.36 + hi * 2) | 0})`; };
    const turned = (x: number, y: number, angle: number, lo: number, hi: number) => {
      if (!conic) { const g = ctx.createLinearGradient(x - 60, y - 60, x + 60, y + 60); g.addColorStop(0, brass(hi)); g.addColorStop(0.5, brass(lo)); g.addColorStop(1, brass(hi)); return g; }
      const g = ctx.createConicGradient(angle, x, y), mid = (lo + hi) / 2;
      const st: [number, number][] = [[0, hi], [0.04, hi - 8], [0.1, mid + 14], [0.18, lo + 6], [0.26, lo - 12], [0.34, mid - 20], [0.42, mid + 10], [0.47, hi - 30], [0.5, hi - 10], [0.54, hi - 40], [0.62, mid - 4], [0.7, lo - 6], [0.78, lo + 12], [0.86, mid - 12], [0.93, mid + 34], [0.97, hi - 6], [1, hi]];
      for (const [p, v] of st) g.addColorStop(p, brass(v));
      return g;
    };
    // Lathe rings for the bob, drawn once.
    const rings = document.createElement("canvas"); rings.width = rings.height = BOB * 2 * dpr;
    const rx = rings.getContext("2d");
    if (rx) {
      rx.scale(dpr, dpr); let seed = 5; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let r = 1; r < BOB; r += 0.6) { const v = rnd(); rx.beginPath(); rx.arc(BOB, BOB, r, 0, Math.PI * 2); rx.lineWidth = 0.5; rx.strokeStyle = v > 0.5 ? `rgba(255,244,200,${(v - 0.5) * 0.36})` : `rgba(50,24,0,${(0.5 - v) * 0.34})`; rx.stroke(); }
    }

    // The shape is drawn far off the canvas and only its blurred shadow lands in view.
    const pendulumShadow = (theta: number, ox: number, oy: number, blur: number, alpha: number) => {
      ctx.save(); ctx.shadowColor = `rgba(0,0,0,${alpha})`; ctx.shadowBlur = blur * dpr; ctx.shadowOffsetX = (ox + 2000) * dpr; ctx.shadowOffsetY = oy * dpr;
      ctx.translate(CX - 2000, CY); ctx.rotate(theta); ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.rect(-2.2, 0, 4.4, ROD); ctx.arc(0, ROD, BOB, 0, Math.PI * 2); ctx.rect(-5, ROD + BOB, 10, 20); ctx.fill();
      ctx.restore();
    };
    const pendulum = (theta: number, la: number) => {
      ctx.save(); ctx.translate(CX, CY); ctx.rotate(theta);
      // rod: a flat strip with a bright edge
      const rod = ctx.createLinearGradient(-2.4, 0, 2.4, 0); rod.addColorStop(0, brass(92)); rod.addColorStop(0.35, brass(250)); rod.addColorStop(0.6, brass(170)); rod.addColorStop(1, brass(70));
      ctx.fillStyle = rod; ctx.fillRect(-2.2, 0, 4.4, ROD + BOB + 8);
      // rating nut under the bob
      const nut = ctx.createLinearGradient(-6, 0, 6, 0); nut.addColorStop(0, brass(70)); nut.addColorStop(0.3, brass(252)); nut.addColorStop(0.55, brass(150)); nut.addColorStop(0.8, brass(210)); nut.addColorStop(1, brass(80));
      ctx.fillStyle = nut; ctx.fillRect(-6, ROD + BOB + 6, 12, 9);
      for (let k = -5; k <= 5; k += 2) { ctx.fillStyle = "rgba(50,24,0,0.4)"; ctx.fillRect(k, ROD + BOB + 6, 0.7, 9); }
      ctx.fillRect(-1.6, ROD + BOB + 15, 3.2, 7);
      // bob: a lens of turned brass. The sheen stays with the lamp while the disc swings.
      ctx.translate(0, ROD);
      ctx.beginPath(); ctx.arc(0, 0, BOB, 0, Math.PI * 2); ctx.fillStyle = turned(0, 0, la - theta, 104, 256); ctx.fill();
      ctx.save(); ctx.clip(); ctx.drawImage(rings, -BOB, -BOB, BOB * 2, BOB * 2);
      const dome = ctx.createRadialGradient(-10, -14, 2, 0, 0, BOB);
      dome.addColorStop(0, "rgba(255,250,225,0.5)"); dome.addColorStop(0.5, "rgba(255,250,225,0)"); dome.addColorStop(1, "rgba(40,18,0,0.5)");
      ctx.fillStyle = dome; ctx.fillRect(-BOB, -BOB, BOB * 2, BOB * 2); ctx.restore();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(50,24,0,0.6)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, BOB - 5, 0, Math.PI * 2); ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(50,24,0,0.4)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, BOB - 6, 0, Math.PI * 2); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(255,246,210,0.6)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 5.4, 0, Math.PI * 2); ctx.fillStyle = turned(0, 0, la - theta + 1, 70, 250); ctx.fill(); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(50,24,0,0.6)"; ctx.stroke();
      ctx.restore();
    };

    const hand = (angle: number, len: number, w: number, tail: number, la: number) => {
      ctx.save(); ctx.translate(CX, CY); ctx.rotate(angle);
      ctx.shadowColor = "rgba(40,26,8,0.42)"; ctx.shadowBlur = 4 * dpr; ctx.shadowOffsetX = -Math.cos(la) * 5 * dpr; ctx.shadowOffsetY = -Math.sin(la) * 5 * dpr + 2 * dpr;
      // a spade hand: slim stem, a swelling near the tip, a fine point
      ctx.beginPath(); ctx.moveTo(-w * 0.5, tail); ctx.lineTo(-w * 0.36, -len * 0.62);
      ctx.bezierCurveTo(-w * 2.3, -len * 0.7, -w * 1.6, -len * 0.86, 0, -len);
      ctx.bezierCurveTo(w * 1.6, -len * 0.86, w * 2.3, -len * 0.7, w * 0.36, -len * 0.62);
      ctx.lineTo(w * 0.5, tail); ctx.closePath();
      ctx.fillStyle = "#14171c"; ctx.fill(); ctx.shadowColor = "transparent";
      ctx.beginPath(); ctx.moveTo(-w * 0.12, tail); ctx.lineTo(-w * 0.1, -len * 0.6); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(120,150,210,0.6)"; ctx.stroke();
      ctx.restore();
    };

    const draw = (ms: number, theta: number, la: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const lx = Math.cos(la), ly = Math.sin(la); // direction the light comes from

      // Shadows on the wall. The pendulum hangs further out than the case, so its shadow falls further away.
      pendulumShadow(theta, -lx * 24, -ly * 24 + 8, 16, 0.5);
      pendulumShadow(theta, -lx * 21, -ly * 21 + 6, 4, 0.5);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 30 * dpr; ctx.shadowOffsetX = -lx * 22 * dpr; ctx.shadowOffsetY = (-ly * 22 + 12) * dpr;
      ctx.beginPath(); ctx.arc(CX, CY, R - 3, 0, Math.PI * 2); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 6 * dpr; ctx.shadowOffsetX = -lx * 5 * dpr; ctx.shadowOffsetY = (-ly * 5 + 3) * dpr;
      ctx.beginPath(); ctx.arc(CX, CY, R - 1, 0, Math.PI * 2); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();

      pendulum(theta, la);

      // Case: a rolled brass bezel in three steps.
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.fillStyle = turned(CX, CY, la + 0.2, 60, 250); ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(40,18,0,0.7)"; ctx.stroke();
      const roll = ctx.createRadialGradient(CX, CY, R - 20, CX, CY, R);
      roll.addColorStop(0, "rgba(40,18,0,0.55)"); roll.addColorStop(0.3, "rgba(255,246,214,0.22)"); roll.addColorStop(0.62, "rgba(255,246,214,0)"); roll.addColorStop(1, "rgba(40,18,0,0.6)");
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.fillStyle = roll; ctx.fill();
      ctx.beginPath(); ctx.arc(CX, CY, R - 17, 0, Math.PI * 2); ctx.fillStyle = turned(CX, CY, la + 2.2, 50, 245); ctx.fill();
      ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(40,18,0,0.75)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(CX, CY, R - 18.4, 0, Math.PI * 2); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(255,246,214,0.6)"; ctx.stroke();
      const DIAL = R - 24;
      ctx.beginPath(); ctx.arc(CX, CY, DIAL + 1.5, 0, Math.PI * 2); ctx.fillStyle = "#1f1408"; ctx.fill();

      // Enamel dial.
      const face = ctx.createRadialGradient(CX + lx * 30, CY + ly * 30, 6, CX, CY, DIAL);
      face.addColorStop(0, "#fffaf0"); face.addColorStop(0.55, FACE); face.addColorStop(1, "#d3c8ae");
      ctx.beginPath(); ctx.arc(CX, CY, DIAL, 0, Math.PI * 2); ctx.fillStyle = face; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.shadowColor = "rgba(40,26,8,0.7)"; ctx.shadowBlur = 10 * dpr; ctx.shadowOffsetX = -lx * 6 * dpr; ctx.shadowOffsetY = -ly * 6 * dpr;
      ctx.beginPath(); ctx.arc(CX, CY, DIAL + 8, 0, Math.PI * 2); ctx.lineWidth = 14; ctx.strokeStyle = "#000"; ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = "#16181c"; ctx.fillStyle = "#16181c";
      ctx.beginPath(); ctx.arc(CX, CY, DIAL - 5, 0, Math.PI * 2); ctx.lineWidth = 0.8; ctx.stroke();
      ctx.beginPath(); ctx.arc(CX, CY, DIAL - 11, 0, Math.PI * 2); ctx.lineWidth = 0.8; ctx.stroke();
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2, s = Math.sin(a), c = -Math.cos(a);
        if (i % 5 === 0) { ctx.beginPath(); ctx.arc(CX + s * (DIAL - 8), CY + c * (DIAL - 8), 1.9, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.beginPath(); ctx.moveTo(CX + s * (DIAL - 11), CY + c * (DIAL - 11)); ctx.lineTo(CX + s * (DIAL - 5), CY + c * (DIAL - 5)); ctx.lineWidth = 0.7; ctx.stroke(); }
      }
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = '400 17px Didot, "Bodoni MT", "Times New Roman", Georgia, serif';
      NUMERALS.forEach((n, i) => { ctx.save(); ctx.translate(CX, CY); ctx.rotate((i / 12) * Math.PI * 2); ctx.translate(0, -(DIAL - 27)); ctx.scale(0.86, 1.25); ctx.fillText(n, 0, 0.5); ctx.restore(); });
      ctx.beginPath(); ctx.arc(CX, CY, DIAL - 44, 0, Math.PI * 2); ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(22,24,28,0.5)"; ctx.stroke();
      ctx.font = 'italic 400 8px Didot, "Times New Roman", Georgia, serif'; ctx.fillStyle = "rgba(22,24,28,0.75)"; ctx.fillText("Eight Day", CX, CY + 22);

      // Blued steel hands. The minute hand moves on each beat.
      const d = new Date(ms), mins = d.getMinutes() + d.getSeconds() / 60, hrs = (d.getHours() % 12) + mins / 60;
      hand((hrs / 12) * Math.PI * 2, 46, 3.4, 9, la);
      hand((mins / 60) * Math.PI * 2, 72, 2.9, 12, la);
      ctx.beginPath(); ctx.arc(CX, CY, 5, 0, Math.PI * 2); ctx.fillStyle = turned(CX, CY, la, 70, 250); ctx.fill(); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(40,18,0,0.7)"; ctx.stroke();

      // Glass over the dial.
      ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, DIAL + 1, 0, Math.PI * 2); ctx.clip();
      const gx = CX + lx * 118, gy = CY + ly * 118;
      const gl = ctx.createRadialGradient(gx, gy, 20, gx, gy, 132);
      gl.addColorStop(0, "rgba(255,255,255,0.46)"); gl.addColorStop(0.9, "rgba(255,255,255,0.1)"); gl.addColorStop(0.915, "rgba(255,255,255,0)");
      ctx.fillStyle = gl; ctx.fillRect(CX - R, CY - R, R * 2, R * 2);
      ctx.beginPath(); ctx.arc(CX, CY, DIAL - 2.5, la + Math.PI - 0.45, la + Math.PI + 0.45); ctx.lineWidth = 1.8; ctx.lineCap = "round"; ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.stroke();
      ctx.restore();
    };

    // amp and phase describe the swing: theta = amp * cos(pi * seconds + phase). At rest phase is 0, so the
    // bob reaches one side on every whole second. After a push both drift back to that.
    const s = { amp: A0, phase: 0, held: false, grab: 0, la: -2.25, laTo: -2.25, touched: -1e9 };
    const thetaAt = (ms: number) => (s.held ? s.grab : s.amp * Math.cos(Math.PI * (ms / 1000) + s.phase));
    let raf = 0, seen = true, last = 0, said = "";
    const t0 = performance.now();
    const step = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const ms = Date.now();
      if (!s.held) { const k = Math.min(1, dt * SETTLE * 1.2); s.amp += (A0 - s.amp) * k; s.phase += (0 - s.phase) * Math.min(1, dt * SETTLE * 0.9); }
      if (now - s.touched > 4000) s.laTo = -2.25 + 0.4 * Math.sin((now - t0) / 2600);
      s.la = reduce ? s.laTo : s.la + (s.laTo - s.la) * Math.min(1, dt * 5);
      draw(ms, reduce ? 0 : thetaAt(ms), s.la);
      const d = new Date(ms), text = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
      if (text !== said) { said = text; setClock(text); }
      if (!reduce && seen && !document.hidden) raf = requestAnimationFrame(step);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(step); } };
    // Letting go at angle g: keep the bob exactly where it is and carry on from there.
    const release = (g: number) => {
      const ms = Date.now(), lim = (26 * Math.PI) / 180, a = Math.max(-lim, Math.min(lim, g));
      s.amp = Math.max(Math.abs(a), 0.01);
      let p = (a < 0 ? Math.PI : 0) - Math.PI * (ms / 1000);
      p = ((p + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      s.phase = p; s.held = false;
    };
    // A push keeps the bob where it is and the way it is heading, and only makes the swing wider.
    push.current = () => {
      if (reduce) return;
      s.touched = performance.now();
      const ms = Date.now(), cur = Math.PI * (ms / 1000) + s.phase, big = (PUSH * Math.PI) / 180;
      let a = Math.acos(Math.max(-1, Math.min(1, thetaAt(ms) / big))); if (Math.sin(cur) < 0) a = -a;
      let p = a - Math.PI * (ms / 1000);
      p = ((p + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      s.amp = big; s.phase = p; wake();
    };
    step(performance.now());
    const slow = reduce ? window.setInterval(() => step(performance.now()), 500) : 0;

    const toAngle = (e: PointerEvent) => { const b = cv.getBoundingClientRect(), k = W / b.width; return Math.atan2(-((e.clientX - b.left) * k - CX), (e.clientY - b.top) * k - CY); };
    const onDown = (e: PointerEvent) => { if (reduce) return; s.held = true; s.grab = toAngle(e); s.touched = performance.now(); area.setPointerCapture(e.pointerId); e.preventDefault(); };
    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect(), k = W / b.width;
      if (s.held) { const lim = (26 * Math.PI) / 180; s.grab = Math.max(-lim, Math.min(lim, toAngle(e))); s.touched = performance.now(); return; }
      // the lamp stays above the clock and slides left and right with the pointer
      s.touched = performance.now() - 2400; s.laTo = -Math.PI / 2 + Math.max(-1, Math.min(1, (((e.clientX - b.left) * k - CX) / W) * 2.4));
      if (reduce) step(performance.now());
    };
    const onUp = () => { if (s.held) release(s.grab); };
    area.addEventListener("pointerdown", onDown); area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerup", onUp); area.addEventListener("pointercancel", onUp);
    const io = new IntersectionObserver(([en]) => { seen = en.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); if (slow) window.clearInterval(slow); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
      area.removeEventListener("pointerdown", onDown); area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerup", onUp); area.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <div className="flex min-h-[760px] w-full flex-col items-center justify-center bg-[#15231e] bg-[radial-gradient(75%_60%_at_40%_28%,#4a7163_0%,#2a463c_40%,#132019_100%)] px-4 py-6 sm:min-h-[800px]">
      <div className="relative w-full max-w-[440px]" style={{ aspectRatio: `${W} / ${H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div ref={hit} aria-hidden="true" className="absolute inset-x-0 bottom-0 top-[42%] cursor-grab touch-pan-y active:cursor-grabbing" />
      </div>
      <div className="mt-1 flex flex-col items-center text-center">
        <time className="font-mono text-[30px] font-semibold tabular-nums leading-none tracking-tight text-[#f3ecdb]">{clock}</time>
        <p className="mt-3 max-w-[300px] font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-emerald-100/80 sm:max-w-none">One swing, one second. Pull the bob aside and let go.</p>
        <button type="button" onClick={() => push.current()} className="mt-4 h-10 rounded-full border border-[#e9c46a]/50 px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f1d488] outline-none transition-colors hover:bg-[#e9c46a]/10 focus-visible:ring-2 focus-visible:ring-[#f1d488] motion-reduce:hidden">
          Give it a push
        </button>
      </div>
    </div>
  );
}

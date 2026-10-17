import { useEffect, useRef, useState } from "react";
import type { ClipboardEvent as RClipboardEvent, KeyboardEvent as RKeyboardEvent, PointerEvent as RPointerEvent } from "react";

// The code that frees the cable. One wheel is drawn per character, so "471960" gives six (lower WHEEL_W to 56 for that).
const CODE = "4719";
const CABLE = "#e2553b"; // the vinyl sleeve on the cable and the two index marks
const WHEEL_W = 80; // width of one ring in drawing units
const HINT = "Sent to the phone ending 42. Try 4 7 1 9.";

const N = CODE.length;
const W = 700, H = 460, CY = 322, R = 56, BODY_R = 48, GAP = 8;
const X0 = (W - (N * WHEEL_W + (N - 1) * GAP)) / 2;
const LEFT = X0 - 78, RIGHT = W - LEFT;
const wheelX = (i: number) => X0 + i * (WHEEL_W + GAP);
const target = CODE.split("").map(Number);
const mod10 = (n: number) => ((Math.round(n) % 10) + 10) % 10;

const mix = (hex: string, to: number, t: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (to - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

export default function CombinationCableLockCodeInput() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<number[]>(target);
  const digitsRef = useRef<number[]>(target);
  const api = useRef<{ set: (next: number[], turns?: number[]) => void; tug: () => void; touch: () => void } | null>(null);
  const drag = useRef<{ i: number; y: number; from: number; step: number } | null>(null);
  const open = digits.join("") === CODE;

  useEffect(() => {
    const cv = canvas.current, box = wrap.current;
    if (!cv || !box) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let K = 1;
    const s = { pos: target.slice(), vel: target.map(() => 0), tgt: target.slice(), open: 1, openV: 0 };

    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    };
    const vgrad = (y0: number, y1: number, stops: [number, string][]) => { const g = ctx.createLinearGradient(0, y0, 0, y1); for (const [p, c] of stops) g.addColorStop(p, c); return g; };
    // Paints only the shadow of a shape: the shape itself is drawn far off to the left.
    const shadow = (shape: () => void, blur: number, dx: number, dy: number, alpha: number) => {
      ctx.save(); ctx.shadowColor = `rgba(58,38,18,${alpha})`; ctx.shadowBlur = blur * K; ctx.shadowOffsetX = (dx + 3000) * K; ctx.shadowOffsetY = dy * K;
      ctx.translate(-3000, 0); ctx.fillStyle = "#000"; ctx.strokeStyle = "#000"; shape(); ctx.restore();
    };
    const GRAPHITE: [number, string][] = [[0, "#08080a"], [0.07, "#1d1e22"], [0.2, "#55575e"], [0.27, "#7b7e86"], [0.36, "#3d3f45"], [0.62, "#232428"], [0.86, "#101113"], [0.95, "#1c1d20"], [1, "#050506"]];
    const BRASS: [number, string][] = [[0, "#241703"], [0.06, "#5d4210"], [0.17, "#b98f38"], [0.25, "#fbe7a4"], [0.31, "#f0cf79"], [0.45, "#cfa246"], [0.68, "#9a7225"], [0.86, "#5a3f0e"], [0.95, "#7a5a1c"], [1, "#1e1303"]];
    const STEEL: [number, string][] = [[0, "#3b3e44"], [0.2, "#c9ced4"], [0.32, "#ffffff"], [0.5, "#aeb4bb"], [0.8, "#5d6269"], [1, "#2a2c30"]];

    // Where the cable runs for a given amount of release (0 pinned in, 1 sprung free).
    const loop = (o: number) => {
      const phi = -0.16 * o, tx = 350 + 16 * o, ty = 78 - 20 * o, psi = (-58 * Math.PI) / 180 * o;
      const ex = RIGHT + 20 + 34 * o, ey = CY - 84 * o, reach = 120 - 14 * o;
      return { tx, ty, ex, ey, psi, c2x: tx - 290 * Math.cos(phi), c2y: ty - 290 * Math.sin(phi), c3x: tx + (290 - 70 * o) * Math.cos(phi), c3y: ty + (290 - 70 * o) * Math.sin(phi), c4x: ex + reach * Math.cos(psi), c4y: ey + reach * Math.sin(psi) };
    };
    const cable = (o: number) => {
      const p = loop(o);
      ctx.beginPath(); ctx.moveTo(LEFT - 20, CY); ctx.bezierCurveTo(LEFT - 140, CY, p.c2x, p.c2y, p.tx, p.ty); ctx.bezierCurveTo(p.c3x, p.c3y, p.c4x, p.c4y, p.ex, p.ey);
    };

    const draw = (time: number) => {
      ctx.setTransform(K, 0, 0, K, 0, 0); ctx.clearRect(0, 0, W, H);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      const o = Math.max(-0.05, s.open) + (reduce ? 0 : 0.022 * Math.sin(time / 850) * s.open);
      const p = loop(o);

      // Shadows on the table: cable first, then the barrel.
      shadow(() => { cable(o); ctx.lineWidth = 22; ctx.stroke(); }, 13, 9, 20, 0.3);
      shadow(() => { rr(LEFT, CY - BODY_R, RIGHT - LEFT, BODY_R * 2, 16); ctx.fill(); }, 26, 8, 30, 0.42);
      shadow(() => { rr(LEFT + 4, CY - BODY_R, RIGHT - LEFT - 8, BODY_R * 2, 16); ctx.fill(); }, 7, 2, 9, 0.5);

      // The steel pin on the free end, drawn before the barrel so it disappears into the socket.
      ctx.save(); ctx.translate(p.ex, p.ey); ctx.rotate(p.psi);
      if (o > 0.2) shadow(() => { rr(-70, -8, 50, 16, 7); ctx.fill(); }, 6, 5, 12, 0.3 * Math.min(1, o));
      const pg = ctx.createLinearGradient(0, -8, 0, 8); for (const [q, c] of STEEL) pg.addColorStop(q, c);
      rr(-70, -8, 52, 16, 7); ctx.fillStyle = pg; ctx.fill();
      ctx.fillStyle = "rgba(20,22,26,0.55)"; ctx.fillRect(-58, -8, 5, 16); ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillRect(-53, -8, 1, 16);
      ctx.restore();

      // Axle, then the two graphite end caps.
      ctx.fillStyle = vgrad(CY - 40, CY + 40, [[0, "#000"], [0.3, "#2a2b2f"], [1, "#000"]]); ctx.fillRect(X0 - 6, CY - 40, RIGHT - LEFT - 144, 80);
      const caps: [number, number, number[]][] = [[LEFT, 74, [16, 5, 5, 16]], [RIGHT - 74, 74, [5, 16, 16, 5]]];
      caps.forEach(([x, w], side) => {
        rr(x, CY - BODY_R, w, BODY_R * 2, 13); ctx.fillStyle = vgrad(CY - BODY_R, CY + BODY_R, GRAPHITE); ctx.fill();
        // square off the inner end, where the cap meets the wheels
        const ix = side === 0 ? x + w - 16 : x;
        ctx.fillRect(ix, CY - BODY_R, 16, BODY_R * 2);
        // turned grooves and a polished band
        for (let g = 0; g < 3; g++) {
          const gx = side === 0 ? x + 12 + g * 5 : x + w - 12 - g * 5;
          ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(gx, CY - BODY_R + 1, 1.4, BODY_R * 2 - 2);
          ctx.fillStyle = "rgba(255,255,255,0.13)"; ctx.fillRect(gx + 1.4, CY - BODY_R + 4, 0.8, BODY_R * 2 - 8);
        }
        const bx = side === 0 ? x + w - 13 : x + 5;
        ctx.fillStyle = vgrad(CY - BODY_R, CY + BODY_R, BRASS); ctx.fillRect(bx, CY - BODY_R, 8, BODY_R * 2);
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(bx - 1, CY - BODY_R, 1, BODY_R * 2); ctx.fillRect(bx + 8, CY - BODY_R, 1, BODY_R * 2);
        // index mark that shows which row is read
        const mx = side === 0 ? x + w - 22 : x + 22, dir = side === 0 ? 1 : -1;
        ctx.beginPath(); ctx.moveTo(mx, CY); ctx.lineTo(mx - 11 * dir, CY - 6.5); ctx.lineTo(mx - 11 * dir, CY + 6.5); ctx.closePath();
        ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fill(); ctx.save(); ctx.translate(-0.6 * dir, -0.8); ctx.fillStyle = CABLE; ctx.fill(); ctx.restore();
      });
      ctx.save(); ctx.font = "600 8.5px ui-monospace, SFMono-Regular, Menlo, monospace"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillText("HOLT", LEFT + 27, CY + 27.8); ctx.fillStyle = "rgba(226,228,232,0.5)"; ctx.fillText("HOLT", LEFT + 27, CY + 27); ctx.restore();

      // The brass rings.
      for (let i = 0; i < N; i++) {
        const x = wheelX(i), pos = s.pos[i];
        ctx.save(); rr(x, CY - R, WHEEL_W, R * 2, 5); ctx.clip();
        ctx.fillStyle = vgrad(CY - R, CY + R, BRASS); ctx.fillRect(x, CY - R, WHEEL_W, R * 2);
        // knurled shoulders: fifty teeth that travel with the ring
        for (let k = 0; k < 50; k++) {
          const th = ((k - pos * 5) * 7.2 * Math.PI) / 180, c = Math.cos(th);
          if (c <= 0.05) continue;
          const y = CY + R * Math.sin(th);
          ctx.fillStyle = `rgba(30,18,2,${0.5 * c})`; ctx.fillRect(x, y - 1.1 * c, 9, 2.2 * c); ctx.fillRect(x + WHEEL_W - 9, y - 1.1 * c, 9, 2.2 * c);
          ctx.fillStyle = `rgba(255,244,200,${0.4 * c})`; ctx.fillRect(x, y + 1.1 * c, 9, 0.9 * c); ctx.fillRect(x + WHEEL_W - 9, y + 1.1 * c, 9, 0.9 * c);
        }
        ctx.fillStyle = "rgba(40,24,2,0.6)"; ctx.fillRect(x + 9, CY - R, 1.2, R * 2); ctx.fillRect(x + WHEEL_W - 10.2, CY - R, 1.2, R * 2);
        ctx.fillStyle = "rgba(255,246,208,0.5)"; ctx.fillRect(x + 10.2, CY - R, 0.9, R * 2); ctx.fillRect(x + WHEEL_W - 11.1, CY - R, 0.9, R * 2);
        // ten faces: a milled groove between each pair, a stamped numeral on each
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "700 37px 'Helvetica Neue', Helvetica, Arial, sans-serif";
        for (let k = 0; k < 10; k++) {
          const gth = ((k + 0.5 - pos) * 36 * Math.PI) / 180, gc = Math.cos(gth);
          if (gc > 0.05) {
            const gy = CY + R * Math.sin(gth);
            ctx.fillStyle = `rgba(36,20,0,${0.75 * gc})`; ctx.fillRect(x + 11, gy - 1 * gc, WHEEL_W - 22, 2 * gc);
            ctx.fillStyle = `rgba(255,246,206,${0.6 * gc})`; ctx.fillRect(x + 11, gy + 1 * gc, WHEEL_W - 22, 1 * gc);
          }
          const th = ((k - pos) * 36 * Math.PI) / 180, c = Math.cos(th);
          if (c <= 0.12) continue;
          ctx.save(); ctx.translate(x + WHEEL_W / 2, CY + R * Math.sin(th)); ctx.scale(1, c);
          ctx.globalAlpha = Math.min(1, c * 1.15);
          ctx.fillStyle = "rgba(255,244,200,0.7)"; ctx.fillText(String(k), 0.4, 2.6);
          ctx.fillStyle = "#1a1104"; ctx.fillText(String(k), 0, 1.6);
          ctx.restore();
        }
        // the ring is a cylinder: darken it again towards both horizons
        ctx.fillStyle = vgrad(CY - R, CY + R, [[0, "rgba(10,6,0,0.82)"], [0.16, "rgba(10,6,0,0.18)"], [0.3, "rgba(10,6,0,0)"], [0.7, "rgba(10,6,0,0)"], [0.88, "rgba(10,6,0,0.4)"], [1, "rgba(10,6,0,0.9)"]]);
        ctx.fillRect(x, CY - R, WHEEL_W, R * 2);
        ctx.restore();
        // shade in the gap beside each ring
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(x - 1.2, CY - R + 4, 1.2, R * 2 - 8); ctx.fillRect(x + WHEEL_W, CY - R + 4, 1.2, R * 2 - 8);
      }

      // Crimped steel ferrules: one fixed, one on the free end.
      const ferrule = () => {
        const g = ctx.createLinearGradient(0, -17, 0, 17); for (const [q, c] of STEEL) g.addColorStop(q, c);
        rr(-22, -17, 24, 34, 5); ctx.fillStyle = g; ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(-15, -15, 1.4, 30); ctx.fillRect(-8, -15, 1.4, 30);
        ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.fillRect(-13.6, -13, 0.9, 26); ctx.fillRect(-6.6, -13, 0.9, 26);
      };
      ctx.save(); ctx.translate(LEFT - 20, CY); ctx.rotate(Math.PI); ferrule(); ctx.restore();
      ctx.save(); ctx.translate(p.ex, p.ey); ctx.rotate(p.psi); ferrule(); ctx.restore();

      // The cable: a dark edge, the sleeve, a soft inner light and a hard glint.
      cable(o); ctx.lineCap = "butt";
      ctx.lineWidth = 25; ctx.strokeStyle = mix(CABLE, 0, 0.55); ctx.stroke();
      ctx.lineWidth = 22.5; ctx.strokeStyle = mix(CABLE, 0, 0.12); ctx.stroke();
      ctx.save(); ctx.translate(-1.6, -3); cable(o); ctx.lineWidth = 14; ctx.strokeStyle = CABLE; ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(-2.6, -5); cable(o); ctx.lineWidth = 6; ctx.strokeStyle = mix(CABLE, 255, 0.3); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(-3.2, -6.6); cable(o); ctx.lineWidth = 1.9; ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(2.8, 7.6); cable(o); ctx.lineWidth = 1.8; ctx.strokeStyle = "rgba(255,214,190,0.3)"; ctx.stroke(); ctx.restore();
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, demoAt = 3500, phase = 0;
    const settled = () => s.pos.every((v, i) => Math.abs(v - s.tgt[i]) < 0.08);
    const matches = () => digitsRef.current.join("") === CODE;
    const set = (next: number[], turns?: number[]) => {
      next.forEach((d, i) => { const delta = ((((d - mod10(s.tgt[i])) % 10) + 15) % 10) - 5; s.tgt[i] += delta + 10 * (turns ? turns[i] : 0); });
      digitsRef.current = next; setDigits(next);
      if (reduce) { s.pos = s.tgt.slice(); s.open = matches() ? 1 : 0; draw(0); }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      for (let i = 0; i < N; i++) { s.vel[i] += (210 * (s.tgt[i] - s.pos[i]) - 19 * s.vel[i]) * dt; s.pos[i] += s.vel[i] * dt; }
      const want = matches() && settled() ? 1 : 0;
      s.openV += (95 * (want - s.open) - 10 * s.openV) * dt; s.open += s.openV * dt;
      const busy = inputs.current.some((el) => el && el === document.activeElement);
      if (now - touched > 9000 && !busy && t > demoAt) {
        if (phase === 0) {
          const next = target.map((d, i) => (d + 3 + ((i * 7 + Math.floor(t / 1000)) % 5)) % 10);
          set(next, target.map((_, i) => (i % 2 ? -1 : 1))); phase = 1; demoAt = t + 1900;
        } else {
          const next = digitsRef.current.slice(); next[phase - 1] = target[phase - 1]; set(next);
          phase = phase === N ? 0 : phase + 1; demoAt = t + (phase === 0 ? 4600 : 640);
        }
      }
      draw(t);
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    const size = () => {
      const w = box.clientWidth, dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr); cv.height = Math.round((w * H) / W * dpr); K = cv.width / W;
      draw(0);
    };
    const ro = new ResizeObserver(size); ro.observe(box); size();
    api.current = {
      set,
      tug: () => { if (!reduce) s.openV += 1.5; },
      touch: () => { touched = performance.now(); phase = 0; demoAt = 0; },
    };
    wake();
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const put = (i: number, d: number, last = false) => {
    const next = digitsRef.current.slice(); next[i] = ((d % 10) + 10) % 10;
    api.current?.touch(); api.current?.set(next);
    if (last && next.join("") !== CODE) api.current?.tug();
  };
  const focus = (i: number) => { const el = inputs.current[Math.max(0, Math.min(N - 1, i))]; if (el) { el.focus(); el.select(); } };
  const onKey = (e: RKeyboardEvent<HTMLInputElement>, i: number) => {
    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); put(i, Number(e.key), i === N - 1); if (i < N - 1) focus(i + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); put(i, digitsRef.current[i] + 1); }
    else if (e.key === "ArrowDown") { e.preventDefault(); put(i, digitsRef.current[i] - 1); }
    else if (e.key === "ArrowLeft" || e.key === "Backspace") { e.preventDefault(); focus(i - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); focus(i + 1); }
  };
  const onPaste = (e: RClipboardEvent) => {
    const found = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, N);
    if (!found) return;
    e.preventDefault();
    const next = digitsRef.current.slice(); found.split("").forEach((c, i) => { next[i] = Number(c); });
    api.current?.touch(); api.current?.set(next);
    if (found.length === N && next.join("") !== CODE) api.current?.tug();
    focus(found.length - 1);
  };
  const onDown = (e: RPointerEvent<HTMLInputElement>, i: number) => {
    drag.current = { i, y: e.clientY, from: digitsRef.current[i], step: Math.max(14, e.currentTarget.offsetHeight / 3.4) };
    e.currentTarget.setPointerCapture(e.pointerId); api.current?.touch();
  };
  const onMove = (e: RPointerEvent<HTMLInputElement>) => {
    const d = drag.current; if (!d) return;
    const to = (((d.from + Math.round((d.y - e.clientY) / d.step)) % 10) + 10) % 10;
    if (to !== digitsRef.current[d.i]) put(d.i, to);
  };

  return (
    <div className="flex min-h-[600px] w-full flex-col items-center justify-center bg-[#e4ddd0] bg-[radial-gradient(90%_70%_at_46%_40%,#f3eee4_0%,#e4ddd0_58%,#d3cabb_100%)] px-4 py-10 sm:min-h-[700px]">
      <div ref={wrap} className="relative w-full max-w-[860px]" style={{ aspectRatio: `${W} / ${H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <fieldset className="absolute inset-0 m-0 min-w-0 border-0 p-0" onPaste={onPaste}>
          <legend className="sr-only">{N} digit code</legend>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${i + 1} of ${N}`}
              value={d}
              onChange={(e) => { const c = e.target.value.replace(/\D/g, "").slice(-1); if (c) { put(i, Number(c), i === N - 1); if (i < N - 1) focus(i + 1); } }}
              onKeyDown={(e) => onKey(e, i)}
              onFocus={(e) => { e.currentTarget.select(); api.current?.touch(); }}
              onPointerDown={(e) => onDown(e, i)}
              onPointerMove={onMove}
              onPointerUp={() => { drag.current = null; }}
              onPointerCancel={() => { drag.current = null; }}
              style={{ left: `${(wheelX(i) / W) * 100}%`, top: `${((CY - R) / H) * 100}%`, width: `${(WHEEL_W / W) * 100}%`, height: `${((R * 2) / H) * 100}%` }}
              className="absolute cursor-ns-resize touch-none select-none rounded-md border-0 bg-transparent p-0 text-center text-[16px] text-transparent caret-transparent outline-none selection:bg-transparent focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4ddd0]"
            />
          ))}
        </fieldset>
      </div>
      <p aria-live="polite" className="mt-2 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-stone-600">
        <span className="font-semibold text-stone-900">{open ? "Code accepted" : "Locked"}</span>
        <span className="mx-2 text-stone-400">/</span>
        {open ? "The cable is free" : HINT}
      </p>
    </div>
  );
}

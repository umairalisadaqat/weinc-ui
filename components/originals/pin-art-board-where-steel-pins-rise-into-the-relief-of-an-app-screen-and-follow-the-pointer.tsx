import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// One entry per app the pins can form. `draw` paints the relief in pin units (the board is 46 pins by 62).
const apps = [
  { label: "Tracker", sentence: "A tracker for the day's orders at my bakery." },
  { label: "Calculator", sentence: "A calculator that prices a cake by size and tiers." },
  { label: "Sign-up sheet", sentence: "A sign-up sheet for Saturday's bread class." },
];
const COLS = 46, ROWS = 62;
const PITCH = 7; // distance between pins in drawing pixels
const LIFT = 9; // how far a fully raised pin travels toward the viewer
const BLUE = "#4F98FB";
const PAD_X = 9, PAD_TOP = 17, PAD_BOTTOM = 9;
const CW = COLS * PITCH + PAD_X * 2, CH = ROWS * PITCH + PAD_TOP + PAD_BOTTOM;
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

type Painter = { box: (x: number, y: number, w: number, h: number, r: number, level: number, blue?: boolean) => void; dot: (x: number, y: number, r: number, level: number, blue?: boolean) => void; text: (s: string, x: number, y: number, size: number, level: number, align?: CanvasTextAlign) => void };

const reliefs: ((p: Painter) => void)[] = [
  // Orders tracker: a count, a week of bars and one blue button.
  (p) => {
    p.box(2, 2, 42, 58, 5, 0.2);
    p.box(6, 6.5, 15, 3, 1.5, 0.5); p.dot(37.5, 8, 2.7, 0.62);
    p.text("12", 5.2, 27.6, 18, 1);
    p.box(29.5, 20.5, 10.5, 5, 2.5, 0.62, true);
    [5, 8, 6, 10, 7, 13, 9].forEach((h, i) => p.box(6 + i * 5.1, 46 - h, 3.5, h, 1.2, i === 5 ? 0.95 : 0.66, i === 5));
    p.box(6, 49.5, 34, 7, 3.5, 0.88, true);
  },
  // Cake calculator: a display and sixteen keys, the right-hand column in blue.
  (p) => {
    p.box(2, 2, 42, 58, 5, 0.2);
    p.box(6, 6, 34, 16.5, 3, 0.34);
    p.text("48", 38.6, 20, 15.5, 1, "right");
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) p.box(6 + c * 8.87, 25.4 + r * 7.9, 7.4, 6.5, 2.8, c === 3 ? 0.92 : 0.66, c === 3);
  },
  // Sign-up sheet: three names ticked, one free place, one blue button.
  (p) => {
    p.box(2, 2, 42, 58, 5, 0.2);
    p.box(6, 6.5, 21, 3.2, 1.6, 0.52);
    for (let i = 0; i < 4; i++) {
      const y = 12.6 + i * 9;
      p.box(6, y, 34, 7.4, 2.6, i < 3 ? 0.42 : 0.32);
      p.dot(10.6, y + 3.7, 2.4, i < 3 ? 0.86 : 0.56);
      if (i === 3) p.box(15, y + 2.4, 9, 2.6, 1.3, 0.5);
      if (i < 3) { p.box(15, y + 2.4, 15 - i * 2.5, 2.6, 1.3, 0.72); p.dot(35.6, y + 3.7, 2.1, 0.95, true); }
    }
    p.box(6, 49.5, 34, 7, 3.5, 0.88, true);
  },
];

export default function PinArtAppBoard() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [app, setApp] = useState(0);
  const [typed, setTyped] = useState(apps[0].sentence.length);
  const appRef = useRef(0);
  const api = useRef<{ show: (i: number, fromUser: boolean) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1) * 1.3;
    cv.width = Math.round(CW * dpr); cv.height = Math.round(CH * dpr);
    const N = COLS * ROWS, U = 8;

    // Paint each app large in grey (height) and white (blue pins), then average down to one value per pin.
    const maps = reliefs.map((paint) => {
      const big = [0, 1].map(() => { const c = document.createElement("canvas"); c.width = COLS * U; c.height = ROWS * U; return c.getContext("2d", { willReadFrequently: true }); });
      const [hc, tc] = big;
      const height = new Float32Array(N), tint = new Uint8Array(N);
      if (!hc || !tc) return { height, tint };
      hc.fillStyle = "#000"; hc.fillRect(0, 0, COLS * U, ROWS * U); tc.fillStyle = "#000"; tc.fillRect(0, 0, COLS * U, ROWS * U);
      const grey = (l: number) => { const v = Math.round(l * 255); return `rgb(${v},${v},${v})`; };
      const round = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        const k = Math.min(r, w / 2, h / 2) * U; x *= U; y *= U; w *= U; h *= U;
        g.beginPath(); g.moveTo(x + k, y); g.arcTo(x + w, y, x + w, y + h, k); g.arcTo(x + w, y + h, x, y + h, k); g.arcTo(x, y + h, x, y, k); g.arcTo(x, y, x + w, y, k); g.closePath(); g.fill();
      };
      paint({
        box: (x, y, w, h, r, level, blue) => { hc.fillStyle = grey(level); round(hc, x, y, w, h, r); tc.fillStyle = blue ? "#fff" : "#000"; round(tc, x, y, w, h, r); },
        dot: (x, y, r, level, blue) => { for (const [g, fill] of [[hc, grey(level)], [tc, blue ? "#fff" : "#000"]] as const) { g.fillStyle = fill; g.beginPath(); g.arc(x * U, y * U, r * U, 0, Math.PI * 2); g.fill(); } },
        text: (s, x, y, size, level, align) => { hc.font = `800 ${size * U}px ${FONT}`; hc.textAlign = align || "left"; hc.textBaseline = "alphabetic"; hc.fillStyle = grey(level); hc.fillText(s, x * U, y * U); },
      });
      const hd = hc.getImageData(0, 0, COLS * U, ROWS * U).data, td = tc.getImageData(0, 0, COLS * U, ROWS * U).data;
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        let a = 0, b = 0;
        for (let j = 1; j < U; j += 2) for (let i = 1; i < U; i += 2) { const o = ((y * U + j) * COLS * U + x * U + i) * 4; a += hd[o]; b += td[o]; }
        height[y * COLS + x] = a / 16 / 255; tint[y * COLS + x] = b / 16 > 120 ? 1 : 0;
      }
      return { height, tint };
    });

    // Pin heads are drawn once per brightness step, in steel and in blue, and stamped every frame.
    const STEPS = 30, R = 2.85, SP = Math.ceil((R * 2 + 2) * dpr);
    const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, Math.min(1, t))));
    const tone = (blue: boolean, l: number) => blue ? (l < 0.72 ? mix([18, 30, 54], [79, 152, 251], l / 0.72) : mix([79, 152, 251], [196, 224, 255], (l - 0.72) / 0.28)) : mix([24, 29, 38], [246, 244, 239], Math.pow(l, 0.92));
    const css = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;
    const heads = [false, true].map((blue) => Array.from({ length: STEPS }, (_, k) => {
      const c = document.createElement("canvas"); c.width = SP; c.height = SP;
      const g = c.getContext("2d");
      if (!g) return c;
      g.scale(dpr, dpr);
      const m = R + 1, l = k / (STEPS - 1), base = tone(blue, l);
      const grad = g.createRadialGradient(m - R * 0.38, m - R * 0.45, 0.2, m, m, R);
      grad.addColorStop(0, css(mix(base, [255, 255, 255], 0.28 + l * 0.3))); grad.addColorStop(0.55, css(base)); grad.addColorStop(1, css(mix(base, [4, 6, 10], 0.55)));
      g.beginPath(); g.arc(m, m, R, 0, Math.PI * 2); g.fillStyle = grad; g.fill();
      g.lineWidth = 0.5; g.strokeStyle = "rgba(2,4,8,0.55)"; g.stroke();
      return c;
    }));

    const H = new Float32Array(maps[0].height), V = new Float32Array(N), D = new Float32Array(N);
    const from = new Float32Array(maps[0].height), fromTint = new Uint8Array(maps[0].tint);
    const delay = new Float32Array(N);
    let seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < N; i++) delay[i] = (Math.floor(i / COLS) * 13 + (i % COLS) * 5 + rand() * 110) / 1000;
    const s = { cur: 0, changed: -10, px: COLS / 2, py: ROWS / 2, tx: COLS / 2, ty: ROWS / 2, push: 0, pushTo: 0 };

    const draw = (time: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, CW, CH);
      const map = maps[s.cur], since = time - s.changed;
      // A ring runs out from the blue button every few seconds, as if it had been pressed.
      const age = time % 3.4, ringR = age * 17, ringA = 0.085 * Math.exp(-age * 1.1);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const i = y * COLS + x, dx = x - s.px, dy = y - s.py, d = Math.hypot(x - 23, y - 53) - ringR;
        D[i] = Math.max(0, Math.min(1.12, H[i] + s.push * 0.6 * Math.exp(-(dx * dx + dy * dy) / 46) + (reduce ? 0 : ringA * Math.exp(-d * d / 5))));
      }
      for (let y = 0; y < ROWS; y++) {
        const by = PAD_TOP + y * PITCH + PITCH / 2;
        for (let x = 0; x < COLS; x++) {
          const i = y * COLS + x, h = D[i];
          if (h < 0.03) continue;
          const blue = (since > delay[i] ? map.tint[i] : fromTint[i]) === 1;
          ctx.fillStyle = blue ? "#1d4a94" : "#2f3643";
          ctx.fillRect(PAD_X + x * PITCH + PITCH / 2 - 1.7, by - h * LIFT, 3.4, h * LIFT);
        }
        for (let x = 0; x < COLS; x++) {
          const i = y * COLS + x, h = D[i];
          const up = y > 0 && x > 0 ? D[i - COLS - 1] : 0, over = y > 0 ? D[i - COLS] : 0;
          const shade = Math.max(0, Math.max(up, over) - h);
          const glow = 1.12 - 0.3 * (x / COLS * 0.45 + y / ROWS * 0.55); // the lamp sits above the top left corner
          const l = (0.05 + 0.9 * Math.min(1, h) - shade * 0.7 + Math.max(0, h - up) * 0.22) * glow;
          const blue = (since > delay[i] ? map.tint[i] : fromTint[i]) === 1;
          const k = Math.max(0, Math.min(STEPS - 1, Math.round(l * (STEPS - 1))));
          ctx.drawImage(heads[blue ? 1 : 0][k], PAD_X + x * PITCH + PITCH / 2 - R - 1 - h * 1.2, by - R - 1 - h * LIFT, SP / dpr, SP / dpr);
        }
      }
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, nextAuto = 4.2;
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const time = (now - t0) / 1000, map = maps[s.cur], since = time - s.changed;
      for (let i = 0; i < N; i++) {
        const target = since > delay[i] ? map.height[i] : from[i];
        V[i] += (190 * (target - H[i]) - 15 * V[i]) * dt; H[i] += V[i] * dt;
      }
      s.px += (s.tx - s.px) * Math.min(1, dt * 9); s.py += (s.ty - s.py) * Math.min(1, dt * 9);
      s.push += (s.pushTo - s.push) * Math.min(1, dt * 7);
      if (now - touched > 7000 && time > nextAuto) { nextAuto = time + 4.8; show((s.cur + 1) % apps.length, time); }
      draw(time);
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const show = (i: number, time: number) => {
      if (i === s.cur) return;
      from.set(maps[s.cur].height); fromTint.set(maps[s.cur].tint);
      s.cur = i; s.changed = time; appRef.current = i; setApp(i);
      if (reduce) { H.set(maps[i].height); s.changed = -10; draw(0); }
    };
    api.current = { show: (i, fromUser) => { if (fromUser) touched = performance.now(); show(i, t0 ? (performance.now() - t0) / 1000 : 0); wake(); } };
    if (reduce) draw(0); else wake();

    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect();
      s.tx = ((e.clientX - b.left) / b.width * CW - PAD_X) / PITCH; s.ty = ((e.clientY - b.top) / b.height * CH - PAD_TOP) / PITCH;
      if (s.pushTo === 0) { s.px = s.tx; s.py = s.ty; }
      s.pushTo = 1; touched = performance.now();
      if (reduce) { s.px = s.tx; s.py = s.ty; s.push = 1; draw(0); }
    };
    const onLeave = () => { s.pushTo = 0; if (reduce) { s.push = 0; draw(0); } };
    cv.addEventListener("pointermove", onMove); cv.addEventListener("pointerdown", onMove);
    cv.addEventListener("pointerleave", onLeave); cv.addEventListener("pointercancel", onLeave); const onUp = (e: PointerEvent) => { if (e.pointerType !== "mouse") onLeave(); };
    cv.addEventListener("pointerup", onUp);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null; io.disconnect(); document.removeEventListener("visibilitychange", onVis);
      cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerdown", onMove);
      cv.removeEventListener("pointerleave", onLeave); cv.removeEventListener("pointercancel", onLeave); cv.removeEventListener("pointerup", onUp);
    };
  }, []);

  // The sentence is retyped whenever the board changes.
  useEffect(() => {
    const full = apps[app].sentence.length;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setTyped(full); return; }
    let n = 0;
    setTyped(0);
    const id = window.setInterval(() => { n += 2; setTyped(Math.min(full, n)); if (n >= full) window.clearInterval(id); }, 22);
    return () => window.clearInterval(id);
  }, [app]);
  const choose = (i: number) => { appRef.current = i; setApp(i); api.current?.show(i, true); };
  const onKey = (e: ReactKeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % apps.length : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i + apps.length - 1) % apps.length : -1;
    if (next < 0) return;
    e.preventDefault(); choose(next); tabs.current[next]?.focus();
  };
  const bolt = "absolute h-[9px] w-[9px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#8d95a3_0%,#3b414d_55%,#12151b_100%)] shadow-[0_1px_0_rgba(255,255,255,0.12),inset_0_0_0_1px_rgba(0,0,0,0.5)]";

  return (
    <div style={{ fontFamily: FONT }} className="flex min-h-[820px] w-full flex-col items-center justify-center bg-[#F6F4EF] bg-[radial-gradient(90%_60%_at_50%_38%,#ffffff_0%,#F6F4EF_60%,#ebe8e0_100%)] px-4 py-10">
      <p className="mb-7 flex min-h-[56px] max-w-[560px] items-end justify-center text-center text-[20px] font-extrabold leading-7 tracking-[-0.035em] text-[#0B0D12] sm:text-[22px]">
        <span>
          <span className="sr-only">{apps[app].sentence}</span>
          <span aria-hidden="true">{apps[app].sentence.slice(0, typed)}</span>
          <span aria-hidden="true" className="pin-art-board-caret ml-[2px] inline-block h-[20px] w-[3px] translate-y-[3px] rounded-full bg-[#4F98FB]" />
        </span>
      </p>

      <div className="relative w-full max-w-[372px] rounded-[30px] bg-[linear-gradient(160deg,#232833_0%,#12151c_38%,#0B0D12_100%)] p-[14px] pb-[30px] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-2px_0_rgba(0,0,0,0.7),0_2px_0_#05060a,0_3px_0_#05060a,0_44px_50px_-22px_rgba(11,13,18,0.55),0_14px_18px_-10px_rgba(11,13,18,0.5)] sm:max-w-[430px]">
        <span aria-hidden="true" className={`${bolt} left-[8px] top-[8px]`} /><span aria-hidden="true" className={`${bolt} right-[8px] top-[8px]`} />
        <span aria-hidden="true" className={`${bolt} bottom-[10px] left-[8px]`} /><span aria-hidden="true" className={`${bolt} bottom-[10px] right-[8px]`} />
        <div className="rounded-[18px] bg-[#07090d] shadow-[inset_0_4px_10px_rgba(0,0,0,0.95),inset_0_0_0_1px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.1)]">
          <canvas ref={canvas} role="img" aria-label={`A board of steel pins pushed into the shape of a ${apps[app].label.toLowerCase()} screen`} style={{ aspectRatio: `${CW} / ${CH}`, touchAction: "pan-y" }} className="block w-full cursor-crosshair rounded-[18px]" />
        </div>
        <span aria-hidden="true" className="absolute inset-x-0 bottom-[9px] text-center font-mono text-[8.5px] font-semibold uppercase tracking-[0.32em] text-white/35">Pin screen / {COLS} x {ROWS}</span>
      </div>

      <div role="radiogroup" aria-label="App the pins form" className="mt-8 flex rounded-full bg-[#0B0D12]/[0.07] p-1 shadow-[inset_0_1px_2px_rgba(11,13,18,0.12)]">
        {apps.map((a, i) => (
          <button
            key={a.label}
            ref={(el) => { tabs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={app === i}
            tabIndex={app === i ? 0 : -1}
            onClick={() => choose(i)}
            onKeyDown={(e) => onKey(e, i)}
            className={`h-10 rounded-full px-4 text-[13px] font-bold tracking-[-0.01em] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F4EF] motion-reduce:transition-none ${app === i ? "bg-[#0B0D12] text-[#F6F4EF] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_8px_-4px_rgba(11,13,18,0.6)]" : "text-[#0B0D12]/70 hover:text-[#0B0D12]"}`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes pin-art-board-blink { 0%, 55% { opacity: 1 } 56%, 100% { opacity: 0 } }
        .pin-art-board-caret { animation: pin-art-board-blink 1.1s steps(1) infinite; background: ${BLUE}; }
        @media (prefers-reduced-motion: reduce) { .pin-art-board-caret { animation: none } }
      `}</style>
    </div>
  );
}

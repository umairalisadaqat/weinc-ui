import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// Sixteen steps of one bar, read left to right from the back row to the front. 1 is a lit step.
const PATTERN = [1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1];
const ROWS = ["#ff5a47", "#ffb020", "#2fe0a0", "#4f98fb"]; // lamp colour of each row, back to front
const BPM = 112; // four steps to the beat
const SOUND_ON = false; // set to true for a short blip on every lit step once you have pressed a pad
const GHOST = [2, 9, 14, 7, 11, 4]; // pads the idle demo presses until someone touches the machine

// The machine in millimetres, seen from above and in front with no perspective, so every pad top is a true rectangle on screen.
const CW = 600, CH = 610, S = 3.1, SZ = 0.8, SH = 0.6, PW = 162, PD = 192, THICK = 14, PAD = 30, PITCH = 36, U0 = 12, V0 = 44, PADH = 4.4;
const OX = (CW - PW * S) / 2, OY = 40;
const padAt = (i: number) => ({ u: U0 + (i % 4) * PITCH, v: V0 + Math.floor(i / 4) * PITCH });
const knobs = [{ u: 122, v: 20, label: "RUN" }, { u: 146, v: 20, label: "CLEAR" }];
const KR = 8, KH = 3;
const rgb = (hex: string) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
const css = (c: number[], a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const DIGITS = ["abcdef", "bc", "abged", "abgcd", "fgbc", "afgcd", "afgedc", "abc", "abcdefg", "abcdfg"];

let audio: AudioContext | null = null;
const blip = (row: number) => {
  if (!SOUND_ON || !audio) return;
  const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
  o.type = "sine"; o.frequency.setValueAtTime([220, 165, 110, 62][row] * 2, t); o.frequency.exponentialRampToValueAtTime([220, 165, 110, 62][row], t + 0.09);
  g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + 0.17);
};

export default function RubberDrumPadStepSequencer() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pads = useRef<(HTMLButtonElement | null)[]>([]);
  const [pattern, setPattern] = useState(PATTERN);
  const [running, setRunning] = useState(true);
  const live = useRef({ pattern: PATTERN, running: true, held: -1, heldKnob: -1, touched: false });
  const api = useRef<{ wake: () => void; pulse: (i: number) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { live.current.running = false; setRunning(false); } // nothing moves until Run is pressed
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const base = document.createElement("canvas");
    let c: CanvasRenderingContext2D = ctx, k = dpr;
    const s = { q: PATTERN.map(() => 0), qv: PATTERN.map(() => 0), flash: PATTERN.map(() => 0), kq: [0, 0], kqv: [0, 0], step: 0, acc: 0, beat: 0, lamp: 1 };

    // Everything is drawn in millimetres on the top plate. `plane(h)` lifts the pen h millimetres off it.
    const plane = (h: number) => c.setTransform(k * S, 0, 0, k * S * SZ, k * OX, k * (OY - h * S * SH));
    const rr = (x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    const lin = (x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) => { const g = c.createLinearGradient(x0, y0, x1, y1); for (const [o, col] of stops) g.addColorStop(o, col); return g; };
    const rad = (x: number, y: number, r0: number, r1: number, stops: [number, string][]) => { const g = c.createRadialGradient(x, y, r0, x, y, r1); for (const [o, col] of stops) g.addColorStop(o, col); return g; };
    // Light or shadow with no solid shape under it: the shape is drawn far off the canvas and only its blur lands.
    const soft = (shape: () => void, colour: string, blur: number, dx = 0, dy = 0) => {
      c.save(); c.shadowColor = colour; c.shadowBlur = blur * k; c.shadowOffsetX = (9000 * S + dx) * k; c.shadowOffsetY = dy * k; c.translate(-9000, 0); shape(); c.fillStyle = "#000"; c.fill(); c.restore();
    };
    const label = (text: string, u: number, v: number, size: number, alpha: number) => {
      c.save(); c.translate(u, v); c.scale(size / 40, size / 40 / SZ * 0.92); c.font = "700 40px ui-monospace, SFMono-Regular, Menlo, monospace"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillStyle = "rgba(0,0,0,0.8)"; c.fillText(text, 0, -2.5); c.fillStyle = `rgba(226,228,232,${alpha})`; c.fillText(text, 0, 0); c.restore();
    };
    let seed = 5;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // The parts that never change are painted once into a spare canvas.
    const paintBase = () => {
      c = base.getContext("2d") as CanvasRenderingContext2D;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, base.width, base.height);
      plane(-THICK);
      soft(() => rr(4, 6, PW - 4, PD - 2, 9), "rgba(0,0,0,0.85)", 30, 10, 26);
      soft(() => rr(1, 3, PW - 2, PD - 2, 8), "rgba(0,0,0,0.9)", 7, 2, 5);
      for (let h = -THICK; h <= 0; h += 0.4) {
        const t = (h + THICK) / THICK;
        plane(h); rr(0, 0, PW, PD, 7);
        c.fillStyle = t > 0.94 ? "#5b5d64" : css(mix([4, 4, 5], [44, 45, 50], t * t)); c.fill();
      }
      plane(0); rr(0, 0, PW, PD, 7);
      c.fillStyle = lin(0, 0, PW, PD, [[0, "#303136"], [0.45, "#222327"], [1, "#18191c"]]); c.fill();
      c.save(); c.clip();
      seed = 5;
      for (let n = 0; n < 2600; n++) { const v = rand(); c.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.09})` : `rgba(0,0,0,${(0.5 - v) * 0.22})`; c.fillRect(rand() * PW, rand() * PD, 0.45, 0.45); }
      c.restore();
      rr(0.5, 0.5, PW - 1, PD - 1, 6.6); c.lineWidth = 0.7; c.strokeStyle = lin(0, 0, PW * 0.7, PD, [[0, "rgba(255,255,255,0.4)"], [0.4, "rgba(255,255,255,0.08)"], [1, "rgba(255,255,255,0.02)"]]); c.stroke();
      // Screws, wells for the pads, the tempo window and the engraving.
      for (const [u, v] of [[6, 6], [PW - 6, 6], [6, PD - 6], [PW - 6, PD - 6]]) {
        c.beginPath(); c.arc(u, v + 0.5, 2.5, 0, Math.PI * 2); c.fillStyle = "rgba(0,0,0,0.7)"; c.fill();
        c.beginPath(); c.arc(u, v, 2.2, 0, Math.PI * 2); c.fillStyle = rad(u - 0.8, v - 0.9, 0.2, 3, [[0, "#b9bbc2"], [0.5, "#6d6f76"], [1, "#2b2c30"]]); c.fill();
        c.save(); c.translate(u, v); c.rotate(u * 0.7 + v); c.fillStyle = "rgba(0,0,0,0.8)"; c.fillRect(-1.5, -0.3, 3, 0.6); c.fillRect(-0.3, -1.5, 0.6, 3); c.restore();
      }
      for (let i = 0; i < PATTERN.length; i++) {
        const { u, v } = padAt(i);
        rr(u - 1.1, v - 1.1, PAD + 2.2, PAD + 2.2, 5.2); c.fillStyle = "#040405"; c.fill();
        c.lineWidth = 0.5; c.strokeStyle = lin(u, v, u + PAD, v + PAD, [[0, "rgba(0,0,0,0.9)"], [1, "rgba(255,255,255,0.2)"]]); c.stroke();
      }
      rr(12, 9, 52, 22, 3); c.fillStyle = "#070304"; c.fill(); c.lineWidth = 0.6; c.strokeStyle = lin(12, 9, 64, 31, [[0, "rgba(0,0,0,0.95)"], [1, "rgba(255,255,255,0.24)"]]); c.stroke();
      label("TEMPO", 20.5, 35.5, 2.5, 0.5); label("16 STEP  /  ONE BAR", 87, 20, 2.3, 0.34);
      for (const kn of knobs) {
        label(kn.label, kn.u, 35.5, 2.5, 0.5);
        c.beginPath(); c.arc(kn.u, kn.v, KR + 1, 0, Math.PI * 2); c.fillStyle = "#040405"; c.fill();
      }
      c = ctx;
    };

    const draw = () => {
      const L = live.current;
      c = ctx;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.drawImage(base, 0, 0);

      // Tempo window: seven-segment digits behind red glass.
      plane(-0.6);
      const seg = (x: number, y: number, w: number, h: number, on: boolean) => { c.fillStyle = on ? "#ff4a3d" : "rgba(255,74,61,0.09)"; c.shadowColor = "#ff2a1a"; c.shadowBlur = on ? 7 * k : 0; rr(x, y, w, h, 0.5); c.fill(); };
      String(BPM).padStart(3, " ").split("").forEach((ch, n) => {
        const lit = ch === " " ? "" : DIGITS[+ch], x = 18 + n * 11.5, y = 12.6;
        seg(x + 1.3, y, 4.6, 1.5, lit.includes("a")); seg(x + 6, y + 1.2, 1.5, 5.6, lit.includes("b")); seg(x + 6, y + 8, 1.5, 5.6, lit.includes("c"));
        seg(x + 1.3, y + 13.3, 4.6, 1.5, lit.includes("d")); seg(x - 0.3, y + 8, 1.5, 5.6, lit.includes("e")); seg(x - 0.3, y + 1.2, 1.5, 5.6, lit.includes("f")); seg(x + 1.3, y + 6.65, 4.6, 1.5, lit.includes("g"));
      });
      c.shadowColor = "#ff2a1a"; c.shadowBlur = 8 * k * s.beat; c.beginPath(); c.arc(57, 14.5, 1.5, 0, Math.PI * 2); c.fillStyle = css(mix([60, 14, 12], [255, 96, 80], s.beat)); c.fill(); c.shadowBlur = 0;
      plane(0);
      c.save(); rr(12, 9, 52, 22, 3); c.clip();
      c.fillStyle = lin(22, 9, 46, 31, [[0, "rgba(255,255,255,0)"], [0.45, "rgba(255,255,255,0.1)"], [0.55, "rgba(255,255,255,0.1)"], [0.56, "rgba(255,255,255,0)"]]); c.fillRect(12, 9, 52, 22);
      c.restore();

      // Light that leaks round each lit pad and washes over the plate.
      c.globalCompositeOperation = "lighter";
      const level = PATTERN.map((_, i) => (L.pattern[i] ? 0.9 + 0.1 * s.flash[i] : 0));
      const cursor = PATTERN.map((_, i) => (L.running && i === s.step && !L.pattern[i] ? 0.34 : 0));
      for (let i = 0; i < PATTERN.length; i++) {
        const { u, v } = padAt(i), col = rgb(ROWS[Math.floor(i / 4) % ROWS.length]);
        if (level[i] > 0.01) soft(() => rr(u - 1, v - 1, PAD + 2, PAD + 3, 5), css(col, 0.42 + 0.5 * s.flash[i]), 15 + 14 * s.flash[i]);
        if (cursor[i] > 0.01) soft(() => rr(u - 1, v - 1, PAD + 2, PAD + 3, 5), "rgba(255,255,255,0.22)", 10);
      }
      c.globalCompositeOperation = "source-over";

      // Pads: a stack of slices makes the rubber skirt, then the top.
      for (let i = 0; i < PATTERN.length; i++) {
        const { u, v } = padAt(i), row = Math.floor(i / 4), col = rgb(ROWS[row % ROWS.length]);
        const q = s.q[i], lit = level[i], hot = s.flash[i], cur = cursor[i];
        const h = PADH * (1 - 0.82 * q), grow = 0.55 * Math.max(0, q), lamp = cur > 0 ? [235, 238, 245] : col, amt = Math.max(lit, cur);
        const side = mix([22, 23, 25], mix(lamp, [0, 0, 0], 0.25), amt * 0.85);
        for (let y = 0; y <= h; y += 0.45) {
          plane(y); rr(u - grow, v - grow, PAD + grow * 2, PAD + grow * 2, 4.4);
          c.fillStyle = css(mix(mix(side, [0, 0, 0], 0.55), side, y / PADH)); c.fill();
        }
        plane(h);
        const x0 = u - grow, y0 = v - grow, w = PAD + grow * 2, cx = u + PAD / 2, cy = v + PAD / 2;
        rr(x0, y0, w, w, 4.4);
        const core = mix([82, 84, 90], mix(lamp, [255, 255, 255], 0.22 + 0.6 * hot), amt), mid = mix([58, 60, 65], lamp, amt * (0.9 + 0.1 * hot)), rim = mix([40, 41, 45], mix(lamp, [0, 0, 0], 0.3 - 0.2 * hot), amt * 0.9);
        c.fillStyle = rad(cx, cy - 1, 1, PAD * 0.74, [[0, css(core)], [0.5, css(mid)], [1, css(rim)]]); c.fill();
        c.save(); c.clip();
        // A soft sheen from the room, a rolled edge, and the dent a finger leaves.
        c.fillStyle = lin(0, y0, 0, y0 + w * 0.6, [[0, `rgba(255,255,255,${0.16 - 0.09 * amt})`], [1, "rgba(255,255,255,0)"]]); c.fillRect(x0, y0, w, w * 0.6);
        rr(x0 + 0.7, y0 + 0.7, w - 1.4, w - 1.4, 3.8); c.lineWidth = 1.5;
        c.strokeStyle = lin(x0, y0, x0 + w, y0 + w, [[0, `rgba(255,255,255,${0.32 + 0.2 * amt})`], [0.5, "rgba(255,255,255,0.03)"], [1, "rgba(0,0,0,0.42)"]]); c.stroke();
        if (q > 0.02) { c.fillStyle = rad(cx, cy, 2, PAD * 0.62, [[0, `rgba(0,0,0,${0.34 * q})`], [0.7, `rgba(0,0,0,${0.12 * q})`], [1, "rgba(0,0,0,0)"]]); c.fillRect(x0, y0, w, w); }
        c.restore();
      }

      // The two round keys.
      knobs.forEach((kn, n) => {
        const q = s.kq[n], h = KH * (1 - 0.75 * q), on = n === 0 ? s.lamp : 0, glow = mix([24, 25, 27], [40, 230, 120], on * 0.8);
        if (on > 0.02) { plane(0); c.globalCompositeOperation = "lighter"; soft(() => { c.beginPath(); c.arc(kn.u, kn.v, KR + 1, 0, Math.PI * 2); }, `rgba(40,230,120,${0.5 * on})`, 10); c.globalCompositeOperation = "source-over"; }
        for (let y = 0; y <= h; y += 0.4) { plane(y); c.beginPath(); c.arc(kn.u, kn.v, KR, 0, Math.PI * 2); c.fillStyle = css(mix(mix(glow, [0, 0, 0], 0.6), glow, y / KH)); c.fill(); }
        plane(h); c.beginPath(); c.arc(kn.u, kn.v, KR, 0, Math.PI * 2);
        c.fillStyle = rad(kn.u, kn.v - 1.5, 0.5, KR * 1.25, [[0, css(mix([92, 94, 100], [190, 255, 215], on * 0.75))], [0.6, css(mix([62, 64, 69], [44, 214, 120], on * 0.8))], [1, css(mix([38, 39, 43], [16, 120, 62], on * 0.8))]]); c.fill();
        c.lineWidth = 0.9; c.strokeStyle = lin(kn.u - KR, kn.v - KR, kn.u + KR, kn.v + KR, [[0, "rgba(255,255,255,0.4)"], [0.5, "rgba(255,255,255,0.03)"], [1, "rgba(0,0,0,0.45)"]]); c.beginPath(); c.arc(kn.u, kn.v, KR - 0.5, 0, Math.PI * 2); c.stroke();
        c.fillStyle = on > 0.5 ? "rgba(6,50,26,0.85)" : "rgba(10,10,12,0.75)";
        if (n === 0) { c.beginPath(); c.moveTo(kn.u - 2, kn.v - 3.1); c.lineTo(kn.u + 3.2, kn.v); c.lineTo(kn.u - 2, kn.v + 3.1); c.closePath(); c.fill(); }
        else { c.fillRect(kn.u - 2.6, kn.v - 3, 5.2, 6); }
      });
    };

    let raf = 0, last = 0, seen = true, t0 = 0, nextGhost = 1250, ghost = -1, ghostUp = 0, g = 0;
    const stepTime = 60 / BPM / 4;
    const toggle = (i: number) => { const L = live.current; L.pattern = L.pattern.map((v, n) => (n === i ? (v ? 0 : 1) : v)); setPattern(L.pattern); };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0, L = live.current;
      if (L.running) {
        s.acc += dt;
        while (s.acc >= stepTime) {
          s.acc -= stepTime; s.step = (s.step + 1) % PATTERN.length;
          if (s.step % 4 === 0) s.beat = 1;
          if (L.pattern[s.step]) { s.flash[s.step] = 1; blip(Math.floor(s.step / 4)); }
        }
      }
      if (!L.touched && !reduce) {
        if (ghost < 0 && t > nextGhost) { ghost = GHOST[g++ % GHOST.length]; ghostUp = t + 190; }
        else if (ghost >= 0 && t > ghostUp) { toggle(ghost); if (L.pattern[ghost]) s.flash[ghost] = 1; ghost = -1; nextGhost = t + 1400; }
      } else ghost = -1;
      let busy = L.running;
      for (let i = 0; i < PATTERN.length; i++) {
        const to = i === L.held || i === ghost ? 1 : 0;
        // Rubber goes down fast under a finger and springs back past its rest height before it settles.
        for (let n = 0; n < 4; n++) { s.qv[i] += ((to ? 2400 : 700) * (to - s.q[i]) - (to ? 70 : 19) * s.qv[i]) * (dt / 4); s.q[i] += s.qv[i] * (dt / 4); }
        s.flash[i] *= Math.exp(-dt * 6.5);
        if (Math.abs(s.q[i] - to) > 0.002 || Math.abs(s.qv[i]) > 0.02 || s.flash[i] > 0.01) busy = true;
      }
      for (let n = 0; n < 2; n++) { const to = n === L.heldKnob ? 1 : 0; for (let m = 0; m < 4; m++) { s.kqv[n] += ((to ? 2400 : 700) * (to - s.kq[n]) - (to ? 70 : 19) * s.kqv[n]) * (dt / 4); s.kq[n] += s.kqv[n] * (dt / 4); } if (Math.abs(s.kq[n] - to) > 0.002) busy = true; }
      s.beat *= Math.exp(-dt * 9);
      const lampTo = L.running ? 1 : 0; s.lamp += (lampTo - s.lamp) * Math.min(1, dt * 14); if (Math.abs(lampTo - s.lamp) > 0.01) busy = true;
      draw();
      if (seen && !document.hidden && (busy || (!L.touched && !reduce))) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    api.current = { wake, pulse: (i) => { s.qv[i] += 14; s.flash[i] = live.current.pattern[i] ? 1 : 0; if (SOUND_ON) { audio = audio || new AudioContext(); blip(Math.floor(i / 4)); } wake(); } };

    const fit = () => { k = (cv.clientWidth / CW) * dpr; cv.width = base.width = Math.round(CW * k); cv.height = base.height = Math.round(CH * k); paintBase(); draw(); };
    fit(); wake();
    const ro = new ResizeObserver(fit); ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const press = (i: number) => {
    const L = live.current;
    L.touched = true; L.pattern = L.pattern.map((v, n) => (n === i ? (v ? 0 : 1) : v)); setPattern(L.pattern);
    api.current?.pulse(i);
  };
  const hold = (i: number) => { live.current.held = i; live.current.touched = true; api.current?.wake(); };
  const holdKnob = (n: number) => { live.current.heldKnob = n; api.current?.wake(); };
  const run = () => { const L = live.current; L.touched = true; L.running = !L.running; setRunning(L.running); api.current?.wake(); };
  const clear = () => { const L = live.current; L.touched = true; L.pattern = L.pattern.map(() => 0); setPattern(L.pattern); api.current?.wake(); };
  const onKey = (e: ReactKeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "ArrowDown" ? i + 4 : e.key === "ArrowUp" ? i - 4 : -1;
    if (next < 0 || next >= PATTERN.length || !e.key.startsWith("Arrow")) return;
    e.preventDefault(); pads.current[next]?.focus();
  };
  const pc = (n: number, of: number) => `${(n / of) * 100}%`;
  const count = pattern.filter(Boolean).length;

  return (
    <div className="flex min-h-[600px] w-full flex-col items-center justify-center bg-[#0b0a0c] bg-[radial-gradient(100%_70%_at_50%_40%,#1d1a1f_0%,#0b0a0c_65%)] px-3 py-10 sm:min-h-[780px]">
      <div className="relative aspect-[600/610] w-full max-w-[600px] select-none">
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div role="group" aria-label="Sixteen step pattern">
          {pattern.map((on, i) => {
            const { u, v } = padAt(i);
            return (
              <button
                key={i}
                ref={(el) => { pads.current[i] = el; }}
                type="button"
                aria-pressed={on === 1}
                aria-label={`Step ${i + 1}`}
                onClick={() => press(i)}
                onPointerDown={() => hold(i)}
                onPointerUp={() => hold(-1)}
                onPointerLeave={() => hold(-1)}
                onPointerCancel={() => hold(-1)}
                onKeyDown={(e) => onKey(e, i)}
                style={{ left: pc(OX + u * S, CW), top: pc(OY + v * S * SZ - PADH * S * SH, CH), width: pc(PAD * S, CW), height: pc(PAD * S * SZ, CH) }}
                className="absolute cursor-pointer rounded-[14%] bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#18191c]"
              />
            );
          })}
        </div>
        {knobs.map((kn, n) => (
          <button
            key={kn.label}
            type="button"
            aria-pressed={n === 0 ? running : undefined}
            aria-label={n === 0 ? "Run the pattern" : "Clear every step"}
            onClick={n === 0 ? run : clear}
            onPointerDown={() => holdKnob(n)}
            onPointerUp={() => holdKnob(-1)}
            onPointerLeave={() => holdKnob(-1)}
            onPointerCancel={() => holdKnob(-1)}
            style={{ left: pc(OX + kn.u * S, CW), top: pc(OY + kn.v * S * SZ - KH * S * SH, CH) }}
            className="absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-12 sm:w-12"
          />
        ))}
      </div>
      <p aria-live="polite" className="mt-2 min-h-[20px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-zinc-400">
        <span className="font-semibold text-zinc-100">{count} of {pattern.length} steps lit</span>
        <span className="mx-2 text-zinc-600">/</span>
        {running ? `Running at ${BPM} BPM` : "Stopped"}
      </p>
    </div>
  );
}

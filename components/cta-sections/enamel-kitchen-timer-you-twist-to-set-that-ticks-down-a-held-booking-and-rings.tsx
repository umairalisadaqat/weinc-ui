import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

const HOLD_MINUTES = 15; // what the timer winds itself to when the section appears
const MAX_MINUTES = 55; // the last number on the dial
const SOUND = false; // set to true for a short bell when it runs out (it only ever plays after the visitor has touched the timer)
const GRIP = "#d8402a"; // the twist bar, the index mark and the last five minutes on the scale
const copy = { holding: "Table for two held", done: "Time is up", again: "Twist the timer to hold it again", action: "Finish booking" };

const SIZE = 480, C = SIZE / 2, BODY = 184, CHROME = 160, CAP = 147;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

export default function EnamelKitchenTimerBookingHold() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pad = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState<number | null>(null); // whole seconds remaining
  const [over, setOver] = useState(false);
  const api = useRef<{ set: (minutes: number) => void; minutes: () => number } | null>(null);

  useEffect(() => {
    const cv = canvas.current, hit = pad.current;
    if (!cv || !hit) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const S = Math.min(2, window.devicePixelRatio || 1) * 1.2;
    cv.width = Math.round(SIZE * S); cv.height = Math.round(SIZE * S);
    const hasConic = typeof ctx.createConicGradient === "function";
    const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const tone = (hex: string, k: number) => { const c = rgb(hex).map((v) => (k >= 0 ? v + (255 - v) * k : v * (1 + k)) | 0); return `rgb(${c[0]},${c[1]},${c[2]})`; };

    // The printed scale turns with the cap, so it is painted once and rotated as a picture.
    const scale = document.createElement("canvas"); scale.width = cv.width; scale.height = cv.height;
    const g = scale.getContext("2d");
    if (g) {
      g.scale(S, S); g.translate(C, C);
      g.lineCap = "butt";
      g.lineWidth = 5; g.strokeStyle = GRIP; g.beginPath(); g.arc(0, 0, CAP - 8.5, -Math.PI / 2 - (5 * 6 * Math.PI) / 180, -Math.PI / 2); g.stroke();
      for (let m = 0; m < 60; m++) {
        const five = m % 5 === 0;
        g.save(); g.rotate((-m * 6 * Math.PI) / 180);
        g.fillStyle = "#1d1a17"; g.fillRect(five ? -1.3 : -0.6, -(CAP - 5), five ? 2.6 : 1.2, five ? 15 : 8);
        if (five && m <= MAX_MINUTES) { g.font = '700 17px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = m === 0 ? GRIP : "#1d1a17"; g.fillText(String(m), 0, -(CAP - 34)); }
        g.restore();
      }
    }

    const s = { rot: 0, v: 0, light: -2.3, lightTo: -2.3, drag: false, raw: 0, endAt: 0, running: false, ringAt: -1e9, wind: -9, done: false };
    const steel = (v: number) => { const c = clamp(v, 0, 255); const k = (150 - c) * 0.08; return `rgb(${clamp(c - k, 0, 255) | 0},${c | 0},${clamp(c + k * 1.5, 0, 255) | 0})`; };
    const OFF = 3000;
    const soft = (color: string, blur: number, dx: number, dy: number, path: () => void) => { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur * S; ctx.shadowOffsetX = (OFF + dx) * S; ctx.shadowOffsetY = dy * S; ctx.translate(-OFF, 0); ctx.fillStyle = "#000"; path(); ctx.fill(); ctx.restore(); };
    const stadium = (len: number, wid: number) => { const r = wid / 2; ctx.beginPath(); ctx.moveTo(-r, -len + r); ctx.arc(0, -len + r, r, Math.PI, 0); ctx.lineTo(r, len - r); ctx.arc(0, len - r, r, 0, Math.PI); ctx.closePath(); };

    const draw = (now: number) => {
      ctx.setTransform(S, 0, 0, S, 0, 0);
      ctx.clearRect(0, 0, SIZE, SIZE);
      const lx = Math.cos(s.light), ly = Math.sin(s.light); // unit vector towards the lamp
      const ring = (now - s.ringAt) / 1000, ringing = ring >= 0 && ring < 1.9 && !reduce;
      const shake = ringing ? Math.sin(ring * 92) * Math.exp(-ring * 1.5) : 0;

      // The bell is heard as arcs that leave both shoulders.
      if (ringing) for (let k = 0; k < 3; k++) {
        const p = (ring * 2.2 + k / 3) % 1, r = BODY + 10 + p * 38;
        ctx.lineWidth = 3 - p * 1.6; ctx.lineCap = "round"; ctx.strokeStyle = `rgba(255,244,226,${(1 - p) * 0.85 * Math.min(1, (1.9 - ring) * 2)})`;
        for (const mid of [-Math.PI * 0.25, -Math.PI * 0.75]) { ctx.beginPath(); ctx.arc(C, C, r, mid - 0.24, mid + 0.24); ctx.stroke(); }
      }

      // Shadows on the worktop: a wide soft one and a tight one where the foot meets it.
      soft("rgba(84,14,0,0.5)", 34, -lx * 22 + shake * 3.2, -ly * 22 + 14, () => { ctx.beginPath(); ctx.arc(C, C, BODY - 10, 0, 7); });
      soft("rgba(60,8,0,0.6)", 7, -lx * 5 + shake * 3.2, -ly * 5 + 3, () => { ctx.beginPath(); ctx.arc(C, C, BODY - 2, 0, 7); });
      ctx.save(); ctx.translate(C + shake * 3.2, C); ctx.rotate(shake * 0.05); ctx.translate(-C, -C);

      // Enamelled body: a low dome that rolls off at the edge.
      const body = ctx.createRadialGradient(C + lx * 70, C + ly * 70, 20, C, C, BODY);
      body.addColorStop(0, "#fffdf6"); body.addColorStop(0.62, "#f5eedf"); body.addColorStop(0.88, "#e6dcc6"); body.addColorStop(0.965, "#cdbf9f"); body.addColorStop(1, "#9c8c69");
      ctx.beginPath(); ctx.arc(C, C, BODY, 0, 7); ctx.fillStyle = body; ctx.fill();
      // Window reflections on the glaze, one bright and one faint opposite.
      ctx.save(); ctx.lineCap = "round";
      for (const [w, alpha, off, arc] of [[7, 0.78, 0, 0.42], [2.4, 0.4, 0.66, 0.1], [5, 0.16, Math.PI, 0.7]]) {
        ctx.lineWidth = w; ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.shadowColor = "rgba(255,255,255,0.9)"; ctx.shadowBlur = 9 * S;
        ctx.beginPath(); ctx.arc(C, C, BODY - 13, s.light + off - arc, s.light + off + arc); ctx.stroke();
      }
      ctx.restore();
      // The fixed index mark and its legend.
      ctx.fillStyle = GRIP; ctx.beginPath(); ctx.moveTo(C - 8, C - BODY + 9); ctx.lineTo(C + 8, C - BODY + 9); ctx.lineTo(C, C - CHROME - 3); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.font = '700 8px "Helvetica Neue", Helvetica, Arial, sans-serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "rgba(60,50,34,0.72)";
      const legend = "TWIST TO SET  /  MINUTES";
      [...legend].forEach((ch, i) => { const a = Math.PI + 0.5 - (i / (legend.length - 1)) * 1.0; ctx.save(); ctx.translate(C + Math.sin(a) * (BODY - 15), C - Math.cos(a) * (BODY - 15)); ctx.rotate(a + Math.PI); ctx.fillText(ch, 0, 0); ctx.restore(); });
      ctx.restore();

      // Chrome collar between body and cap. Its reflections stay with the room, not the dial.
      ctx.beginPath(); ctx.arc(C, C, CHROME + 1.5, 0, 7); ctx.fillStyle = "rgba(50,36,14,0.55)"; ctx.fill();
      let chrome: CanvasGradient;
      if (hasConic) {
        chrome = ctx.createConicGradient(s.light, C, C);
        const stops: [number, number][] = [[0, 255], [0.04, 236], [0.1, 150], [0.17, 74], [0.24, 120], [0.32, 210], [0.38, 96], [0.46, 62], [0.5, 180], [0.55, 240], [0.62, 130], [0.7, 70], [0.78, 150], [0.86, 96], [0.93, 190], [1, 255]];
        for (const [p, v] of stops) chrome.addColorStop(p, steel(v));
      } else { chrome = ctx.createLinearGradient(C - CHROME, C - CHROME, C + CHROME, C + CHROME); chrome.addColorStop(0, steel(250)); chrome.addColorStop(0.5, steel(80)); chrome.addColorStop(1, steel(230)); }
      ctx.beginPath(); ctx.arc(C, C, CHROME, 0, 7); ctx.fillStyle = chrome; ctx.fill();
      // Fine ribs cut into the collar turn with the cap and catch the lamp as they pass it.
      const ribs = 132, turn = (s.rot * Math.PI) / 180;
      for (let i = 0; i < ribs; i++) {
        const a = turn + (i / ribs) * Math.PI * 2, face = Math.cos(a - s.light), glint = Math.pow(Math.max(0, face), 5) + 0.4 * Math.pow(Math.max(0, -face), 7);
        ctx.beginPath(); ctx.arc(C, C, CHROME - 0.6, a, a + (Math.PI / ribs) * 0.9); ctx.arc(C, C, CAP + 1.6, a + (Math.PI / ribs) * 0.9, a, true); ctx.closePath();
        ctx.fillStyle = `rgba(14,16,22,${0.3 + 0.3 * (1 - glint)})`; ctx.fill();
      }
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.beginPath(); ctx.arc(C, C, CHROME - 0.6, 0, 7); ctx.stroke();
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(20,16,10,0.7)"; ctx.beginPath(); ctx.arc(C, C, CHROME + 0.4, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(C, C, CAP + 1.2, 0, 7); ctx.fillStyle = "rgba(20,14,6,0.8)"; ctx.fill();

      // The cap: white enamel, slightly domed, with the scale printed on it.
      const cap = ctx.createRadialGradient(C + lx * 54, C + ly * 54, 10, C, C, CAP);
      cap.addColorStop(0, "#ffffff"); cap.addColorStop(0.55, "#f8f3e7"); cap.addColorStop(0.9, "#e9e0cc"); cap.addColorStop(1, "#cfc3a6");
      ctx.beginPath(); ctx.arc(C, C, CAP, 0, 7); ctx.fillStyle = cap; ctx.fill();
      const rot = (s.rot * Math.PI) / 180;
      const gloss = ctx.createRadialGradient(C + lx * 78, C + ly * 78, 4, C + lx * 78, C + ly * 78, 84);
      gloss.addColorStop(0, "rgba(255,255,255,0.7)"); gloss.addColorStop(0.3, "rgba(255,255,255,0.2)"); gloss.addColorStop(1, "rgba(255,255,255,0)");
      ctx.save(); ctx.beginPath(); ctx.arc(C, C, CAP, 0, 7); ctx.clip(); ctx.fillStyle = gloss; ctx.fillRect(0, 0, SIZE, SIZE);
      const roll = ctx.createLinearGradient(C + lx * CAP, C + ly * CAP, C - lx * CAP, C - ly * CAP);
      roll.addColorStop(0, "rgba(255,255,255,0.9)"); roll.addColorStop(0.3, "rgba(255,255,255,0)"); roll.addColorStop(0.6, "rgba(70,52,20,0)"); roll.addColorStop(1, "rgba(70,52,20,0.5)");
      ctx.lineWidth = 5; ctx.strokeStyle = roll; ctx.beginPath(); ctx.arc(C, C, CAP - 2.5, 0, 7); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.translate(C, C); ctx.rotate(rot); ctx.scale(1 / S, 1 / S); ctx.drawImage(scale, -C * S, -C * S); ctx.restore();

      // The twist bar. Its two flanks are lit by where they face, whichever way the cap is turned.
      const LEN = 104, WID = 50;
      ctx.save(); ctx.translate(C, C); ctx.rotate(rot);
      ctx.save(); ctx.shadowColor = "rgba(60,30,6,0.5)"; ctx.shadowBlur = 16 * S; ctx.shadowOffsetX = -lx * 13 * S; ctx.shadowOffsetY = (-ly * 13 + 5) * S; stadium(LEN, WID); ctx.fillStyle = tone(GRIP, -0.5); ctx.fill(); ctx.restore();
      ctx.save(); ctx.shadowColor = "rgba(40,16,0,0.65)"; ctx.shadowBlur = 4 * S; ctx.shadowOffsetX = -lx * 3 * S; ctx.shadowOffsetY = (-ly * 3 + 1) * S; stadium(LEN, WID); ctx.fillStyle = tone(GRIP, -0.5); ctx.fill(); ctx.restore();
      const side = Math.cos(rot) * lx + Math.sin(rot) * ly; // how much the bar's right flank faces the lamp
      const flank = ctx.createLinearGradient(-WID / 2, 0, WID / 2, 0);
      flank.addColorStop(0, tone(GRIP, -side * 0.5 - 0.12)); flank.addColorStop(0.2, tone(GRIP, -side * 0.24)); flank.addColorStop(0.34, tone(GRIP, 0.05)); flank.addColorStop(0.66, tone(GRIP, 0.05)); flank.addColorStop(0.8, tone(GRIP, side * 0.24)); flank.addColorStop(1, tone(GRIP, side * 0.5 - 0.12));
      stadium(LEN, WID); ctx.fillStyle = flank; ctx.fill();
      ctx.lineWidth = 0.9; ctx.strokeStyle = tone(GRIP, -0.55); ctx.stroke();
      // Flat top of the bar with a glint running down the lit shoulder.
      stadium(LEN - 8, WID - 20); ctx.fillStyle = tone(GRIP, 0.1); ctx.fill();
      ctx.lineCap = "round";
      ctx.save(); ctx.shadowColor = "rgba(255,255,255,0.9)"; ctx.shadowBlur = 5 * S; ctx.lineWidth = 3.2; ctx.strokeStyle = `rgba(255,255,255,${0.35 + 0.5 * Math.abs(side)})`;
      const gx = (side >= 0 ? 1 : -1) * (WID / 2 - 9); ctx.beginPath(); ctx.moveTo(gx, -LEN + 30); ctx.lineTo(gx, LEN - 30); ctx.stroke(); ctx.restore();
      ctx.lineWidth = 1.6; ctx.strokeStyle = "rgba(255,255,255,0.26)"; ctx.beginPath(); ctx.moveTo(-gx, -LEN + 34); ctx.lineTo(-gx, LEN - 34); ctx.stroke();
      // A white arrow moulded into the end that points at the minutes.
      ctx.fillStyle = "rgba(255,250,240,0.96)"; ctx.beginPath(); ctx.moveTo(0, -LEN + 9); ctx.lineTo(7, -LEN + 23); ctx.lineTo(-7, -LEN + 23); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.restore();
    };

    // The bell: a hammer hitting a small steel dome many times a second.
    let audio: AudioContext | null = null, touchedEver = false;
    const bell = () => {
      if (!SOUND || !touchedEver) return;
      try {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        audio = audio || new Ctor();
        const t = audio.currentTime;
        for (let i = 0; i < 24; i++) for (const [f, vol] of [[1870, 0.05], [2810, 0.035], [4130, 0.02]]) {
          const o = audio.createOscillator(), gn = audio.createGain(), at = t + i * 0.068;
          o.frequency.value = f; gn.gain.setValueAtTime(0.0001, at); gn.gain.exponentialRampToValueAtTime(vol * Math.exp(-i * 0.05), at + 0.004); gn.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
          o.connect(gn); gn.connect(audio.destination); o.start(at); o.stop(at + 0.32);
        }
      } catch { /* no sound is fine */ }
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, shown = -2, shownDone = false, rewind = 0, lastAngle = 0, moved = 0, timer = 0;
    const DEG = 6; // one minute of dial
    const say = () => { const sec = s.running ? Math.max(0, Math.ceil((s.endAt - Date.now()) / 1000)) : s.done ? 0 : Math.round(s.rot / DEG) * 60; if (sec !== shown) { shown = sec; setLeft(sec); } if (s.done !== shownDone) { shownDone = s.done; setOver(s.done); } };
    const start = (minutes: number) => { s.done = false; s.endAt = Date.now() + minutes * 60000; s.running = minutes > 0; if (!s.running) finish(); };
    const finish = () => { s.running = false; s.done = true; s.rot = 0; s.v = 0; s.ringAt = performance.now(); rewind = performance.now() + 7000; bell(); };

    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (s.wind > -5) {
        // Self-winding at the start: a hand turning the cap through its clicks.
        s.wind += dt / 1.05;
        const e = 1 - Math.pow(1 - clamp(s.wind, 0, 1), 3), deg = e * HOLD_MINUTES * DEG, n = Math.round(deg / DEG), off = deg - n * DEG;
        s.rot = n * DEG + off - (Math.sin((off / DEG) * Math.PI * 2) * DEG) / (Math.PI * 2) * 0.8;
        if (s.wind >= 1) { s.wind = -9; s.rot = HOLD_MINUTES * DEG; start(HOLD_MINUTES); }
      } else if (s.drag) {
        const n = Math.round(s.raw / DEG), off = s.raw - n * DEG;
        const sticky = n * DEG + off - (Math.sin((off / DEG) * Math.PI * 2) * DEG) / (Math.PI * 2) * 0.85;
        s.rot += (sticky - s.rot) * Math.min(1, dt * 30);
      } else if (s.running) {
        const ms = s.endAt - Date.now();
        if (ms <= 0) finish();
        else {
          // The escapement lets the cap go in small kicks, once a second.
          const age = 1 - ((ms / 1000) % 1), target = (ms / 60000) * DEG + 0.55 * Math.exp(-age * 9) * Math.cos(age * 38);
          s.rot += (target - s.rot) * Math.min(1, dt * 14);
        }
      } else if (s.done && now > rewind && now - touched > 6000) { s.done = false; s.wind = 0; }
      if (now - touched > 5000) s.lightTo = -2.3 + 0.3 * Math.sin(now / 1900);
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 6);
      say(); draw(now);
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(frame); } };
    const still = () => { if (s.running) s.rot = (Math.max(0, s.endAt - Date.now()) / 60000) * DEG; if (s.running && s.endAt <= Date.now()) finish(); say(); draw(performance.now()); };

    api.current = {
      set: (minutes) => { touched = performance.now(); touchedEver = true; s.wind = -9; s.drag = false; const m = clamp(Math.round(minutes), 0, MAX_MINUTES); s.rot = reduce ? m * DEG : s.rot; start(m); if (reduce) still(); else wake(); },
      minutes: () => (s.running ? Math.ceil((s.endAt - Date.now()) / 60000) : 0),
    };
    if (reduce) { s.rot = HOLD_MINUTES * DEG; start(HOLD_MINUTES); still(); timer = window.setInterval(still, 1000); } else { s.wind = -0.28; wake(); }

    const angleAt = (e: PointerEvent) => { const b = hit.getBoundingClientRect(); return Math.atan2(e.clientX - (b.left + b.width / 2), -(e.clientY - (b.top + b.height / 2))); };
    const onDown = (e: PointerEvent) => {
      touched = performance.now(); touchedEver = true; s.wind = -9; s.done = false; s.running = false; s.drag = true; s.raw = s.rot; moved = 0; lastAngle = angleAt(e);
      hit.setPointerCapture(e.pointerId); e.preventDefault(); wake();
    };
    const onMove = (e: PointerEvent) => {
      const b = hit.getBoundingClientRect();
      if (!s.drag) { touched = Math.max(touched, performance.now() - 3600); s.lightTo = Math.atan2(e.clientY - (b.top + b.height / 2) - 60, e.clientX - (b.left + b.width / 2)); if (reduce) { s.light = s.lightTo; draw(performance.now()); } return; }
      touched = performance.now();
      const a = angleAt(e); let d = a - lastAngle; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
      lastAngle = a; moved += Math.abs(d);
      s.raw = clamp(s.raw + (d * 180) / Math.PI, 0, MAX_MINUTES * DEG);
      if (reduce) { s.rot = Math.round(s.raw / DEG) * DEG; say(); draw(performance.now()); }
    };
    const onUp = () => {
      if (!s.drag) return;
      s.drag = false; touched = performance.now();
      const m = moved < 0.03 ? Math.max(1, Math.round(s.rot / DEG)) : Math.round(s.raw / DEG);
      if (reduce) s.rot = m * DEG;
      start(m); if (reduce) still();
    };
    hit.addEventListener("pointerdown", onDown); hit.addEventListener("pointermove", onMove);
    hit.addEventListener("pointerup", onUp); hit.addEventListener("pointercancel", onUp);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); window.clearInterval(timer); api.current = null;
      if (audio) audio.close().catch(() => undefined);
      hit.removeEventListener("pointerdown", onDown); hit.removeEventListener("pointermove", onMove);
      hit.removeEventListener("pointerup", onUp); hit.removeEventListener("pointercancel", onUp);
      io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const minutes = left === null ? HOLD_MINUTES : Math.ceil(left / 60);
  const onKey = (e: ReactKeyboardEvent) => {
    const now = api.current ? api.current.minutes() : minutes;
    const next = e.key === "ArrowRight" || e.key === "ArrowUp" ? now + 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? now - 1 : e.key === "Home" ? 0 : e.key === "End" ? MAX_MINUTES : -1;
    if (next < 0 && e.key !== "ArrowLeft" && e.key !== "ArrowDown") return;
    e.preventDefault(); api.current?.set(Math.max(0, next));
  };

  return (
    <div className="flex min-h-[640px] w-full flex-col items-center justify-center bg-[#bf3a22] bg-[radial-gradient(90%_70%_at_50%_34%,#d24a30_0%,#bf3a22_58%,#a93019_100%)] px-4 py-10 sm:min-h-[780px]">
      <div
        ref={pad}
        role="slider"
        tabIndex={0}
        aria-label="Minutes left on the booking timer"
        aria-valuemin={0}
        aria-valuemax={MAX_MINUTES}
        aria-valuenow={minutes}
        aria-valuetext={over ? copy.done : `${left === null ? `${HOLD_MINUTES}:00` : mmss(left)} left`}
        onKeyDown={onKey}
        className="relative aspect-square w-full max-w-[330px] cursor-grab touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#bf3a22] active:cursor-grabbing sm:max-w-[540px]"
      >
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      </div>
      <p className="mt-6 min-h-[20px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-white">
        <span className="font-semibold">{over ? copy.done : copy.holding}</span>
        <span className="mx-2 text-white/60">/</span>
        {over ? copy.again : <><span role="timer" className="tabular-nums font-semibold">{left === null ? `${HOLD_MINUTES}:00` : mmss(left)}</span> left</>}
      </p>
      <a href="#" className="mt-5 inline-flex h-11 items-center rounded-full bg-[#fff8ea] px-6 text-sm font-semibold text-[#7a1d0c] shadow-[0_12px_26px_-12px_rgba(70,10,0,0.8)] outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#bf3a22] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
        {copy.action}
      </a>
    </div>
  );
}

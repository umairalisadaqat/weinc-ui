import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

const ALARM_START = 6 * 60 + 30; // minutes past twelve where the brass hand starts
const STEP = 5; // minutes per notch when you drag or use the arrow keys
const ENAMEL = "#d8402b"; // the painted case
const RING_SECONDS = 8; // how long it rings when the hands reach the alarm
const SOUND = false; // silent by default. Set to true for a short two-bell rattle (needs a click first)
const W = 440, H = 500, CX = 220, CY = 272, R = 140;

const pad2 = (n: number) => String(n).padStart(2, "0");
const alarmText = (m: number) => `${Math.floor(m / 60) % 12 || 12}:${pad2(m % 60)}`;

export default function TwinBellAlarmClock() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const [alarm, setAlarm] = useState(ALARM_START);
  const [armed, setArmed] = useState(true);
  const [clock, setClock] = useState("");
  const [ringing, setRinging] = useState(false);
  const live = useRef({ alarm: ALARM_START, armed: true, ringUntil: 0, touched: -1e9 });
  const redraw = useRef<() => void>(() => {});

  useEffect(() => {
    const cv = canvas.current, area = hit.current;
    if (!cv || !area) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1) * 1.2; // drawn a fifth larger on wide screens
    cv.width = W * dpr; cv.height = H * dpr;
    const L = live.current;

    // Polished nickel: a hard bright band, a dark band and a bounce of light on the far edge.
    const nickel = (x0: number, x1: number, y0 = 0, y1 = 0) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      const stops: [number, string][] = [[0, "#4d5257"], [0.1, "#b9bec4"], [0.24, "#ffffff"], [0.36, "#dfe3e7"], [0.5, "#8d939a"], [0.64, "#565b61"], [0.78, "#aeb4ba"], [0.9, "#eef0f2"], [1, "#6c7177"]];
      for (const [p, c] of stops) g.addColorStop(p, c);
      return g;
    };

    const bell = (side: number, shake: number, alpha: number) => {
      const a = side * 0.56;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(CX + Math.sin(a) * (R + 13), CY - Math.cos(a) * (R + 13));
      ctx.rotate(a + shake);
      const rx = 60, ry = 46;
      const dome = () => { ctx.beginPath(); ctx.moveTo(-rx, 0); ctx.bezierCurveTo(-rx, -ry * 1.3, rx, -ry * 1.3, rx, 0); ctx.bezierCurveTo(rx, 8, -rx, 8, -rx, 0); ctx.closePath(); };
      // nut on top
      ctx.fillStyle = nickel(-5, 5); ctx.fillRect(-4.5, -ry - 9, 9, 12);
      ctx.beginPath(); ctx.ellipse(0, -ry - 9, 6.5, 3.4, 0, 0, Math.PI * 2); ctx.fillStyle = nickel(-7, 7); ctx.fill();
      dome(); ctx.fillStyle = nickel(-rx, rx); ctx.fill();
      ctx.save(); dome(); ctx.clip();
      // chrome shows a horizon: bright sky above it, the dark room just below, lighter again near the rim
      const v = ctx.createLinearGradient(0, -ry, 0, 8);
      v.addColorStop(0, "rgba(255,255,255,0.18)"); v.addColorStop(0.5, "rgba(255,255,255,0.5)"); v.addColorStop(0.53, "rgba(26,30,38,0.58)"); v.addColorStop(0.82, "rgba(26,30,38,0.2)"); v.addColorStop(1, "rgba(26,30,38,0.5)");
      ctx.fillStyle = v; ctx.fillRect(-rx, -ry * 1.3, rx * 2, ry * 1.3 + 10);
      // the painted case shows up in the underside of the bell
      ctx.globalAlpha = alpha * 0.34; ctx.fillStyle = ENAMEL;
      ctx.beginPath(); ctx.ellipse(-side * 12, 9, 42, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = alpha;
      const hl = ctx.createRadialGradient(-rx * 0.42, -ry * 0.62, 0, -rx * 0.42, -ry * 0.62, 20);
      hl.addColorStop(0, "rgba(255,255,255,0.95)"); hl.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hl; ctx.fillRect(-rx, -ry * 1.3, rx * 2, ry * 1.4);
      ctx.restore();
      dome(); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(30,34,40,0.55)"; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-rx + 3, 2.2); ctx.bezierCurveTo(-rx * 0.5, 7.6, rx * 0.5, 7.6, rx - 3, 2.2);
      ctx.lineWidth = 1.1; ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.stroke();
      ctx.restore();
    };

    const hand = (angle: number, len: number, w: number, tail: number, fill: string, inset: string | null) => {
      ctx.save(); ctx.translate(CX, CY); ctx.rotate(angle);
      ctx.shadowColor = "rgba(40,24,10,0.38)"; ctx.shadowBlur = 5 * dpr; ctx.shadowOffsetX = 2 * dpr; ctx.shadowOffsetY = 4 * dpr;
      ctx.beginPath(); ctx.moveTo(-w * 0.7, tail); ctx.lineTo(-w, -len * 0.66); ctx.lineTo(0, -len); ctx.lineTo(w, -len * 0.66); ctx.lineTo(w * 0.7, tail); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      ctx.shadowColor = "transparent";
      if (inset) { ctx.fillStyle = inset; ctx.fillRect(-w * 0.26, -len * 0.7, w * 0.52, len * 0.42); }
      ctx.restore();
    };

    const draw = (ms: number, ring: number, sec: number) => {
      const t = ms / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const floor = CY + R + 22;

      // Shadow on the table: one wide pool and a tight contact shadow under each foot.
      ctx.save(); ctx.translate(CX + 10, floor + 3); ctx.scale(1, 0.11);
      const pool = ctx.createRadialGradient(0, 0, 10, 0, 0, 190);
      pool.addColorStop(0, "rgba(70,44,22,0.5)"); pool.addColorStop(0.5, "rgba(70,44,22,0.2)"); pool.addColorStop(1, "rgba(70,44,22,0)");
      ctx.fillStyle = pool; ctx.beginPath(); ctx.arc(0, 0, 190, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      for (const sd of [-1, 1]) {
        ctx.save(); ctx.translate(CX + sd * 86 + 3, floor + 1.5); ctx.scale(1, 0.3);
        const c = ctx.createRadialGradient(0, 0, 0, 0, 0, 16); c.addColorStop(0, "rgba(40,22,8,0.75)"); c.addColorStop(1, "rgba(40,22,8,0)");
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }

      // Everything above the table rattles about its feet while it rings.
      ctx.save();
      ctx.translate(CX + Math.sin(t * 143) * 1.5 * ring, floor); ctx.rotate(Math.sin(t * 97) * 0.013 * ring); ctx.translate(-CX, -floor);

      // Legs and ball feet.
      for (const sd of [-1, 1]) {
        const x0 = CX + sd * 62, y0 = CY + 114, x1 = CX + sd * 86, y1 = floor - 6;
        ctx.beginPath(); ctx.moveTo(x0 - 9, y0); ctx.lineTo(x0 + 9, y0); ctx.lineTo(x1 + 4.6, y1); ctx.lineTo(x1 - 4.6, y1); ctx.closePath();
        ctx.fillStyle = nickel(x0 - 9 + sd * 12, x0 + 9 + sd * 12); ctx.fill(); ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(30,34,40,0.5)"; ctx.stroke();
        const ball = ctx.createRadialGradient(x1 - 2.4, y1 - 2.6, 0.5, x1, y1, 7.5);
        ball.addColorStop(0, "#ffffff"); ball.addColorStop(0.35, "#c3c8ce"); ball.addColorStop(0.8, "#5b6066"); ball.addColorStop(1, "#8b9096");
        ctx.beginPath(); ctx.arc(x1, y1, 8, 0, Math.PI * 2); ctx.fillStyle = ball; ctx.fill();
      }

      // Carry handle: a bent tube from one bell nut to the other.
      const hx = 112, hy = CY - 182;
      const tube = (w: number, style: string | CanvasGradient, dy: number) => { ctx.beginPath(); ctx.moveTo(CX - hx, hy + dy); ctx.bezierCurveTo(CX - hx + 14, hy - 62 + dy, CX + hx - 14, hy - 62 + dy, CX + hx, hy + dy); ctx.lineWidth = w; ctx.lineCap = "round"; ctx.strokeStyle = style; ctx.stroke(); };
      tube(7, "#585d63", 0); tube(4.6, nickel(CX - hx, CX + hx), -0.4); tube(1.3, "rgba(255,255,255,0.9)", -1.7);

      // Bell posts, then the hammer between them.
      for (const sd of [-1, 1]) {
        const a = sd * 0.56;
        ctx.beginPath(); ctx.moveTo(CX + Math.sin(a) * (R - 4), CY - Math.cos(a) * (R - 4)); ctx.lineTo(CX + Math.sin(a) * (R + 16), CY - Math.cos(a) * (R + 16));
        ctx.lineWidth = 6; ctx.lineCap = "butt"; ctx.strokeStyle = nickel(CX + Math.sin(a) * R - 4, CX + Math.sin(a) * R + 4); ctx.stroke();
      }
      ctx.save(); ctx.translate(CX, CY - R + 4); ctx.rotate(Math.sin(t * Math.PI * 2 * 15) * 0.82 * ring);
      ctx.fillStyle = nickel(-3, 3); ctx.fillRect(-2.8, -34, 5.6, 34);
      const head = ctx.createRadialGradient(-2.5, -39, 0.5, 0, -36, 8.5);
      head.addColorStop(0, "#ffffff"); head.addColorStop(0.4, "#b4b9bf"); head.addColorStop(1, "#4b5056");
      ctx.beginPath(); ctx.arc(0, -36, 8, 0, Math.PI * 2); ctx.fillStyle = head; ctx.fill();
      ctx.restore();
      for (const sd of [-1, 1]) {
        const sh = Math.sin(t * 151 + sd * 1.7) * 0.06 * ring;
        if (ring > 0.05) { bell(sd, sh + 0.1 * ring, 0.3); bell(sd, sh - 0.1 * ring, 0.3); }
        bell(sd, sh, 1);
      }

      // The enamelled case.
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.fillStyle = ENAMEL; ctx.fill();
      const body = ctx.createRadialGradient(CX - 62, CY - 84, 8, CX, CY, R);
      body.addColorStop(0, "rgba(255,255,255,0.42)"); body.addColorStop(0.42, "rgba(255,255,255,0.03)"); body.addColorStop(0.8, "rgba(0,0,0,0.16)"); body.addColorStop(1, "rgba(0,0,0,0.46)");
      ctx.fillStyle = body; ctx.fill();
      ctx.save(); ctx.lineCap = "round"; ctx.shadowColor = "rgba(255,255,255,0.9)"; ctx.shadowBlur = 5 * dpr;
      ctx.beginPath(); ctx.arc(CX, CY, R - 8, -2.72, -1.98); ctx.lineWidth = 3.4; ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(CX, CY, R - 8, -1.84, -1.72); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(CX, CY, R - 6, 0.5, 1.15); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,220,200,0.22)"; ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.arc(CX, CY, R - 0.5, 0, Math.PI * 2); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(60,10,4,0.5)"; ctx.stroke();

      // Nickel bezel holding the glass.
      const BZ = 122, DIAL = 108;
      ctx.save(); ctx.shadowColor = "rgba(40,6,0,0.5)"; ctx.shadowBlur = 7 * dpr; ctx.shadowOffsetY = 3 * dpr;
      ctx.beginPath(); ctx.arc(CX, CY, BZ, 0, Math.PI * 2); ctx.fillStyle = "#777"; ctx.fill(); ctx.restore();
      if (typeof ctx.createConicGradient === "function") {
        const g = ctx.createConicGradient(-2.3, CX, CY);
        const st: [number, string][] = [[0, "#ffffff"], [0.06, "#d5d9de"], [0.16, "#7c8289"], [0.27, "#4a4f55"], [0.38, "#9aa0a7"], [0.47, "#e6e9ec"], [0.53, "#a1a7ae"], [0.66, "#565b61"], [0.8, "#8d939a"], [0.92, "#e3e6ea"], [1, "#ffffff"]];
        for (const [p, c] of st) g.addColorStop(p, c);
        ctx.fillStyle = g;
      } else ctx.fillStyle = nickel(CX - BZ, CX + BZ, CY - BZ, CY + BZ);
      ctx.beginPath(); ctx.arc(CX, CY, BZ, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(CX, CY, BZ - 0.5, 0, Math.PI * 2); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(30,34,40,0.6)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(CX, CY, BZ - 5, 0, Math.PI * 2); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(CX, CY, DIAL + 3, 0, Math.PI * 2); ctx.fillStyle = "#2b2622"; ctx.fill();

      // Dial.
      const face = ctx.createRadialGradient(CX - 20, CY - 30, 10, CX, CY, DIAL);
      face.addColorStop(0, "#fbf6e9"); face.addColorStop(0.7, "#f1e9d6"); face.addColorStop(1, "#dccfb4");
      ctx.beginPath(); ctx.arc(CX, CY, DIAL, 0, Math.PI * 2); ctx.fillStyle = face; ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, DIAL, 0, Math.PI * 2); ctx.clip();
      // the bezel throws a shadow onto the top of the dial
      ctx.shadowColor = "rgba(40,24,6,0.6)"; ctx.shadowBlur = 12 * dpr; ctx.shadowOffsetY = 7 * dpr; ctx.shadowOffsetX = 3 * dpr;
      ctx.beginPath(); ctx.arc(CX, CY, DIAL + 9, 0, Math.PI * 2); ctx.lineWidth = 14; ctx.strokeStyle = "#000"; ctx.stroke();
      ctx.restore();
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2, s = Math.sin(a), c = -Math.cos(a), big = i % 5 === 0;
        ctx.beginPath(); ctx.moveTo(CX + s * (big ? 93 : 96), CY + c * (big ? 93 : 96)); ctx.lineTo(CX + s * 101, CY + c * 101);
        ctx.lineWidth = big ? 2.2 : 0.9; ctx.strokeStyle = "#1d1a17"; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(CX, CY, 101.6, 0, Math.PI * 2); ctx.lineWidth = 0.9; ctx.strokeStyle = "#1d1a17"; ctx.stroke();
      ctx.fillStyle = "#1d1a17"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = '700 23px "Helvetica Neue", Helvetica, Arial, sans-serif';
      for (let n = 1; n <= 12; n++) { const a = (n / 12) * Math.PI * 2; ctx.fillText(String(n), CX + Math.sin(a) * 77, CY - Math.cos(a) * 77 + 1); }
      ctx.font = '600 6.5px "Helvetica Neue", Helvetica, Arial, sans-serif'; ctx.fillStyle = "rgba(29,26,23,0.72)";
      ctx.fillText("T W I N   B E L L", CX, CY - 36); ctx.fillText("W I N D   D A I L Y", CX, CY + 40);

      // Hands: alarm underneath, then hour, minute and a ticking second hand.
      const al = (L.alarm / 720) * Math.PI * 2;
      ctx.save(); ctx.translate(CX, CY); ctx.rotate(al);
      ctx.shadowColor = "rgba(40,24,10,0.35)"; ctx.shadowBlur = 3 * dpr; ctx.shadowOffsetY = 2 * dpr;
      const br = ctx.createLinearGradient(-3, 0, 3, 0); br.addColorStop(0, "#8a611c"); br.addColorStop(0.45, "#f3d889"); br.addColorStop(1, "#a97a25");
      ctx.fillStyle = br;
      ctx.beginPath(); ctx.moveTo(-1.3, 8); ctx.lineTo(-1.3, -44); ctx.lineTo(-4.6, -44); ctx.lineTo(0, -56); ctx.lineTo(4.6, -44); ctx.lineTo(1.3, -44); ctx.lineTo(1.3, 8); ctx.closePath(); ctx.fill();
      ctx.restore();
      const d = new Date(ms);
      const mins = d.getMinutes() + d.getSeconds() / 60, hrs = (d.getHours() % 12) + mins / 60;
      hand((hrs / 12) * Math.PI * 2, 58, 5.4, 12, "#191715", "#d9e2b4");
      hand((mins / 60) * Math.PI * 2, 90, 4.2, 14, "#191715", "#d9e2b4");
      ctx.save(); ctx.translate(CX, CY); ctx.rotate((sec / 60) * Math.PI * 2);
      ctx.shadowColor = "rgba(40,24,10,0.3)"; ctx.shadowBlur = 4 * dpr; ctx.shadowOffsetX = 3 * dpr; ctx.shadowOffsetY = 6 * dpr;
      ctx.fillStyle = "#191715"; ctx.fillRect(-0.8, -94, 1.6, 120);
      ctx.beginPath(); ctx.arc(0, 22, 3.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      const cap = ctx.createRadialGradient(CX - 2, CY - 2, 0.5, CX, CY, 7);
      cap.addColorStop(0, "#ffffff"); cap.addColorStop(0.45, "#b9bec4"); cap.addColorStop(1, "#4d5257");
      ctx.beginPath(); ctx.arc(CX, CY, 6.4, 0, Math.PI * 2); ctx.fillStyle = cap; ctx.fill();

      // Domed glass: one hard-edged window reflection and a thin glint along the far rim.
      ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, DIAL + 3, 0, Math.PI * 2); ctx.clip();
      const gl = ctx.createRadialGradient(CX - 84, CY - 112, 20, CX - 84, CY - 112, 152);
      gl.addColorStop(0, "rgba(255,255,255,0.34)"); gl.addColorStop(0.9, "rgba(255,255,255,0.07)"); gl.addColorStop(0.915, "rgba(255,255,255,0)");
      ctx.fillStyle = gl; ctx.fillRect(CX - DIAL - 4, CY - DIAL - 4, DIAL * 2 + 8, DIAL * 2 + 8);
      ctx.beginPath(); ctx.arc(CX, CY, DIAL - 3, 0.35, 1.25); ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.stroke();
      ctx.restore();
      ctx.restore();
    };

    // Optional rattle, only built when SOUND is switched on.
    let audio: AudioContext | null = null, gain: GainNode | null = null;
    const noise = (on: boolean) => {
      if (!SOUND) return;
      try {
        if (!audio) {
          audio = new AudioContext(); gain = audio.createGain(); gain.gain.value = 0; gain.connect(audio.destination);
          const trem = audio.createGain(), lfo = audio.createOscillator(); lfo.type = "square"; lfo.frequency.value = 30; lfo.connect(trem.gain); trem.connect(gain); lfo.start();
          for (const f of [2093, 2637]) { const o = audio.createOscillator(); o.type = "triangle"; o.frequency.value = f; o.connect(trem); o.start(); }
        }
        if (gain) gain.gain.value = on ? 0.05 : 0;
      } catch { /* no audio available */ }
    };

    let raf = 0, seen = true, ring = 0, wasRinging = false, last = 0, firedFor = -1;
    const start = performance.now();
    const step = (now: number) => {
      raf = 0;
      const ms = Date.now(), d = new Date(ms);
      const cur = (d.getHours() % 12) * 60 + d.getMinutes();
      if (L.armed && cur === L.alarm && firedFor !== cur) { firedFor = cur; L.ringUntil = now + RING_SECONDS * 1000; }
      if (cur !== L.alarm) firedFor = -1;
      // A short ring a few seconds after load shows what it does, unless someone is already using it.
      const el = now - start, demo = !reduce && L.touched < 0 && el > 3000 && el < 4300;
      const on = now < L.ringUntil || demo;
      if (on !== wasRinging) { wasRinging = on; setRinging(on); noise(on); }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      ring = reduce ? 0 : ring + ((on ? 1 : 0) - ring) * Math.min(1, dt * 16);
      const f = (ms % 1000) / 1000;
      const sec = d.getSeconds() + (reduce ? 0 : -Math.exp(-f * 20) * Math.cos(f * 42));
      draw(ms, ring, sec);
      if (!reduce && seen && !document.hidden) raf = requestAnimationFrame(step);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(step); } };
    redraw.current = () => { if (reduce) step(performance.now()); else wake(); };
    step(performance.now());
    const slow = window.setInterval(() => {
      const d = new Date();
      setClock(`${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`);
      if (reduce) step(performance.now());
    }, 250);

    let drag = false;
    const pick = (e: PointerEvent) => {
      const b = area.getBoundingClientRect();
      let a = Math.atan2(e.clientX - (b.left + b.width / 2), -(e.clientY - (b.top + b.height / 2)));
      if (a < 0) a += Math.PI * 2;
      const m = (Math.round(((a / (Math.PI * 2)) * 720) / STEP) * STEP) % 720;
      L.alarm = m; L.touched = performance.now(); setAlarm(m); redraw.current();
    };
    const onDown = (e: PointerEvent) => { drag = true; area.setPointerCapture(e.pointerId); e.preventDefault(); area.focus({ preventScroll: true }); pick(e); };
    const onMove = (e: PointerEvent) => { if (drag) pick(e); };
    const onUp = () => { drag = false; };
    area.addEventListener("pointerdown", onDown); area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerup", onUp); area.addEventListener("pointercancel", onUp);
    const io = new IntersectionObserver(([en]) => { seen = en.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); window.clearInterval(slow); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
      area.removeEventListener("pointerdown", onDown); area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerup", onUp); area.removeEventListener("pointercancel", onUp);
      if (audio) audio.close().catch(() => {});
    };
  }, []);

  const move = (m: number) => { const v = ((m % 720) + 720) % 720; live.current.alarm = v; live.current.touched = performance.now(); setAlarm(v); redraw.current(); };
  const onKey = (e: ReactKeyboardEvent) => {
    const by = e.key === "ArrowRight" || e.key === "ArrowUp" ? STEP : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -STEP : e.key === "PageUp" ? 60 : e.key === "PageDown" ? -60 : 0;
    if (!by) return;
    e.preventDefault(); move(alarm + by);
  };
  const toggle = () => { const v = !armed; live.current.armed = v; live.current.touched = performance.now(); if (!v) live.current.ringUntil = 0; setArmed(v); redraw.current(); };
  const test = () => { live.current.touched = performance.now(); live.current.ringUntil = performance.now() + 1800; redraw.current(); };

  return (
    <div className="flex min-h-[680px] w-full flex-col items-center justify-center bg-[#ebe3d6] bg-[radial-gradient(90%_70%_at_50%_38%,#f7f1e6_0%,#ebe3d6_55%,#dcd1c0_100%)] px-4 py-10 sm:min-h-[820px]">
      <div className="relative w-full max-w-[440px] sm:max-w-[520px]" style={{ aspectRatio: `${W} / ${H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div
          ref={hit}
          role="slider"
          tabIndex={0}
          aria-label="Alarm time"
          aria-valuemin={0}
          aria-valuemax={715}
          aria-valuenow={alarm}
          aria-valuetext={alarmText(alarm)}
          onKeyDown={onKey}
          style={{ left: `${(CX / W) * 100}%`, top: `${(CY / H) * 100}%`, width: `${(216 / W) * 100}%` }}
          className="absolute aspect-square -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
        />
      </div>
      <p className="mt-1 text-center">
        <time className="block font-mono text-[34px] font-semibold tabular-nums leading-none tracking-tight text-stone-900">{clock || "--:--:--"}</time>
        <span aria-live="polite" className="mt-3 block font-mono text-[11px] uppercase tracking-[0.18em] text-stone-600">
          {ringing ? "Ringing" : armed ? `Alarm set for ${alarmText(alarm)}` : `Alarm off, hand at ${alarmText(alarm)}`}
        </span>
      </p>
      <div className="mt-5 flex items-center gap-3">
        <button type="button" role="switch" aria-checked={armed} onClick={toggle} className="flex h-10 items-center gap-2.5 rounded-full border border-stone-900/15 bg-white/60 pl-2 pr-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-800 outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-stone-900 motion-reduce:transition-none">
          <span className={`relative h-6 w-10 rounded-full transition-colors motion-reduce:transition-none ${armed ? "bg-[#d8402b]" : "bg-stone-400"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] motion-reduce:transition-none ${armed ? "left-[18px]" : "left-0.5"}`} />
          </span>
          Alarm
        </button>
        <button type="button" onClick={test} className="h-10 rounded-full bg-stone-900 px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white outline-none transition-colors hover:bg-stone-700 focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 focus-visible:ring-offset-[#ebe3d6] motion-reduce:transition-none">
          Ring it
        </button>
      </div>
    </div>
  );
}

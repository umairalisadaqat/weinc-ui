import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

// Everything a visitor is likely to change sits here.
const DOOR = "Front door"; // the name of the bell, read out and shown in the caption
// What each ring reports, in order. After the last one it starts again.
const callers = [
  "Parcel from the bookshop",
  "Neighbour returning a ladder",
  "Window cleaner, back gate is open",
  "Flowers for number nine",
];
// The tubes, left to right. `length` is in drawing units, `note` is only used if SOUND is on.
const chimes = [
  { length: 242, note: 392 },
  { length: 200, note: 494 },
  { length: 160, note: 587 },
];
const ORDER = [2, 1, 0]; // which tube the hammer hits first, second, third
const BEAT = 0.36; // seconds between hammer strokes
const KICK = 0.3; // how hard each stroke sets a tube swinging
const SOUND = false; // silent as shipped. Set to true to hear three sine notes on each press.
const SELF_RING = 5.4; // seconds between rings while nobody is touching it, 0 to switch that off

const W = 340, H = 400; // drawing units: the canvas is scaled to whatever box it is given
const HANG_Y = 92, FIRST_X = 76, SPACING = 46, TUBE = 17, CORD = 19; // where the tubes hang
const PX = 276, PY = 236, PUSH = 1.2; // the bell push: where it is and how large
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export default function BrassDoorbellWithChimeTubes() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [rings, setRings] = useState(0);
  const api = useRef<{ ring: () => void; press: (down: boolean) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, box = stage.current;
    if (!cv || !box) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const k = 1.6 * Math.min(2, window.devicePixelRatio || 1); // sharp at its largest shown size
    cv.width = W * k; cv.height = H * k;

    // Brass runs from a brown-black shadow through ochre to a pale straw highlight.
    const ramp: [number, number, number, number][] = [[0, 30, 20, 6], [60, 96, 66, 18], [120, 162, 118, 38], [180, 216, 172, 76], [226, 246, 218, 138], [255, 255, 250, 226]];
    const brass = (v: number) => {
      const c = clamp(v, 0, 255);
      let i = 0;
      while (i < ramp.length - 2 && c > ramp[i + 1][0]) i++;
      const p = ramp[i], q = ramp[i + 1], t = (c - p[0]) / (q[0] - p[0]);
      return `rgb(${(p[1] + (q[1] - p[1]) * t) | 0},${(p[2] + (q[2] - p[2]) * t) | 0},${(p[3] + (q[3] - p[3]) * t) | 0})`;
    };
    const lightAt = -2.2; // the room light comes from the upper left

    // The walnut cover is painted once: body colour, grain, a rounded front and three sound slots.
    const BOX = { x: FIRST_X - 35, y: 36, w: SPACING * (chimes.length - 1) + 70, h: 58, r: 11 };
    const wood = document.createElement("canvas");
    wood.width = cv.width; wood.height = Math.ceil((BOX.y + BOX.h + 10) * k);
    const wx = wood.getContext("2d");
    if (wx) {
      wx.scale(k, k);
      // The underside, which you see from below, then the front.
      wx.beginPath(); wx.roundRect(BOX.x + 1.5, BOX.y + 6, BOX.w - 3, BOX.h, BOX.r); wx.fillStyle = "#281306"; wx.fill();
      wx.beginPath(); wx.roundRect(BOX.x, BOX.y, BOX.w, BOX.h, BOX.r); wx.save(); wx.clip();
      const body = wx.createLinearGradient(0, BOX.y, 0, BOX.y + BOX.h);
      body.addColorStop(0, "#9a6238"); body.addColorStop(0.2, "#7f4c28"); body.addColorStop(0.7, "#69391c"); body.addColorStop(1, "#4a2610");
      wx.fillStyle = body; wx.fillRect(BOX.x, BOX.y, BOX.w, BOX.h);
      let seed = 23;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 70; i++) {
        const y = BOX.y + rand() * BOX.h, amp = 0.6 + rand() * 2.2, ph = rand() * 6, dark = rand() > 0.3;
        wx.beginPath();
        for (let x = BOX.x; x <= BOX.x + BOX.w; x += 4) { const yy = y + Math.sin(x * 0.035 + ph) * amp + Math.sin(x * 0.011 + ph * 2) * amp * 1.6; if (x === BOX.x) wx.moveTo(x, yy); else wx.lineTo(x, yy); }
        wx.lineWidth = 0.35 + rand() * 0.8; wx.strokeStyle = dark ? `rgba(38,16,4,${0.1 + rand() * 0.3})` : `rgba(226,160,104,${0.05 + rand() * 0.14})`; wx.stroke();
      }
      // The front is bowed: darker towards both ends, with a soft band of light along the top.
      const bow = wx.createLinearGradient(BOX.x, 0, BOX.x + BOX.w, 0);
      bow.addColorStop(0, "rgba(20,8,0,0.5)"); bow.addColorStop(0.16, "rgba(20,8,0,0)"); bow.addColorStop(0.3, "rgba(255,214,170,0.14)"); bow.addColorStop(0.5, "rgba(20,8,0,0)"); bow.addColorStop(0.86, "rgba(20,8,0,0.08)"); bow.addColorStop(1, "rgba(20,8,0,0.6)");
      wx.fillStyle = bow; wx.fillRect(BOX.x, BOX.y, BOX.w, BOX.h);
      const gloss = wx.createLinearGradient(0, BOX.y, 0, BOX.y + BOX.h);
      gloss.addColorStop(0, "rgba(255,226,190,0.5)"); gloss.addColorStop(0.07, "rgba(255,226,190,0.2)"); gloss.addColorStop(0.22, "rgba(255,226,190,0)"); gloss.addColorStop(0.9, "rgba(10,4,0,0)"); gloss.addColorStop(1, "rgba(10,4,0,0.5)");
      wx.fillStyle = gloss; wx.fillRect(BOX.x, BOX.y, BOX.w, BOX.h);
      const mid = BOX.x + BOX.w / 2;
      for (let i = 0; i < 3; i++) {
        const y = BOX.y + 19 + i * 8.5;
        wx.beginPath(); wx.roundRect(mid - 34, y, 68, 3.6, 1.8); wx.fillStyle = "#170a02"; wx.fill();
        wx.beginPath(); wx.roundRect(mid - 34, y + 3.4, 68, 1, 0.5); wx.fillStyle = "rgba(255,210,160,0.34)"; wx.fill();
      }
      // Two brass bands let into the front.
      for (const bx of [BOX.x + 15, BOX.x + BOX.w - 19]) {
        const band = wx.createLinearGradient(0, BOX.y, 0, BOX.y + BOX.h);
        band.addColorStop(0, "#fff3c4"); band.addColorStop(0.12, "#e2bc62"); band.addColorStop(0.6, "#a87c26"); band.addColorStop(1, "#5a3d0c");
        wx.fillStyle = "rgba(20,8,0,0.7)"; wx.fillRect(bx - 0.6, BOX.y, 5.2, BOX.h);
        wx.fillStyle = band; wx.fillRect(bx, BOX.y, 4, BOX.h);
        wx.fillStyle = "rgba(255,250,220,0.55)"; wx.fillRect(bx + 0.7, BOX.y, 0.8, BOX.h);
      }
      wx.restore();
      wx.lineWidth = 0.8; wx.strokeStyle = "rgba(30,12,2,0.7)"; wx.beginPath(); wx.roundRect(BOX.x, BOX.y, BOX.w, BOX.h, BOX.r); wx.stroke();
    }

    type Tube = { x: number; len: number; a: number; w: number; hum: number; freq: number };
    const tubes: Tube[] = chimes.map((c, i) => ({ x: FIRST_X + i * SPACING, len: c.length, a: 0, w: 0, hum: 0, freq: Math.sqrt(1500 / (c.length * 0.66 + CORD)) }));
    const s = { press: 0, held: false, t: 0 };
    let queue: { at: number; i: number }[] = [];
    let audio: AudioContext | null = null;

    // The chime hangs above eye level, so each tube shows a curved top edge and its open lower end.
    const RY = 3.1;
    const tubeShape = (t: Tube) => {
      ctx.beginPath(); ctx.ellipse(0, CORD, TUBE / 2, RY, 0, Math.PI, Math.PI * 2);
      ctx.lineTo(TUBE / 2, CORD + t.len); ctx.ellipse(0, CORD + t.len, TUBE / 2, RY, 0, 0, Math.PI); ctx.closePath();
    };
    const place = (t: Tube, lift = 0) => { ctx.setTransform(k, 0, 0, k, 0, -lift * k); ctx.translate(t.x, HANG_Y); ctx.rotate(-t.a); };

    const draw = () => {
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Shadows on the wall first: the tubes hang well clear of it, so theirs fall far to the side.
      for (const t of tubes) {
        place(t, 2000);
        ctx.save(); ctx.shadowColor = "rgba(34,48,60,0.34)"; ctx.shadowBlur = 9 * k; ctx.shadowOffsetX = 17 * k; ctx.shadowOffsetY = (12 + 2000) * k;
        tubeShape(t); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      }
      ctx.setTransform(k, 0, 0, k, 0, -2000 * k);
      ctx.save(); ctx.shadowColor = "rgba(30,44,58,0.42)"; ctx.shadowBlur = 16 * k; ctx.shadowOffsetX = 9 * k; ctx.shadowOffsetY = (13 + 2000) * k;
      ctx.beginPath(); ctx.roundRect(BOX.x, BOX.y, BOX.w, BOX.h, BOX.r); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      ctx.save(); ctx.shadowColor = "rgba(30,44,58,0.5)"; ctx.shadowBlur = 10 * k; ctx.shadowOffsetX = 5 * k; ctx.shadowOffsetY = (8 + 2000) * k;
      ctx.beginPath(); ctx.arc(PX, PY, 28 * PUSH, 0, Math.PI * 2); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();

      // The tubes. Each is a polished cylinder whose reflections slide a little as it swings and blur while it rings.
      for (const t of tubes) {
        place(t);
        ctx.lineCap = "round"; ctx.lineWidth = 1.5; ctx.strokeStyle = "#2a2018"; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, CORD + 9); ctx.stroke();
        const shake = t.hum * Math.sin(s.t * 96 + t.x) * 0.9;
        const slide = clamp(t.a * 1.4, -0.09, 0.09);
        const coat = (dx: number, alpha: number) => {
          ctx.save(); ctx.globalAlpha = alpha; ctx.translate(dx, 0);
          const g = ctx.createLinearGradient(-TUBE / 2, 0, TUBE / 2, 0);
          const at = (p: number) => clamp(p + slide, 0.01, 0.99);
          g.addColorStop(0, brass(18)); g.addColorStop(at(0.07), brass(84)); g.addColorStop(at(0.14), brass(168)); g.addColorStop(at(0.175), brass(255)); g.addColorStop(at(0.25), brass(250)); g.addColorStop(at(0.285), brass(176));
          g.addColorStop(at(0.42), brass(118)); g.addColorStop(at(0.5), brass(52)); g.addColorStop(at(0.67), brass(40)); g.addColorStop(at(0.72), brass(128)); g.addColorStop(at(0.8), brass(206)); g.addColorStop(at(0.89), brass(236)); g.addColorStop(at(0.945), brass(120)); g.addColorStop(1, brass(18));
          tubeShape(t); ctx.fillStyle = g; ctx.fill();
          ctx.restore();
        };
        coat(0, 1);
        if (t.hum > 0.02) { coat(shake, 0.4); coat(-shake, 0.4); }
        ctx.save(); tubeShape(t); ctx.clip();
        // Shade under the cover, a paler stretch lower down where the tube picks up the room, and a hole for the cord.
        const fall = ctx.createLinearGradient(0, CORD, 0, CORD + t.len);
        fall.addColorStop(0, "rgba(20,10,0,0.62)"); fall.addColorStop(Math.min(0.3, 34 / t.len), "rgba(20,10,0,0)"); fall.addColorStop(0.62, "rgba(255,250,230,0)"); fall.addColorStop(0.8, "rgba(255,250,230,0.16)"); fall.addColorStop(1, "rgba(255,250,230,0.02)");
        ctx.fillStyle = fall; ctx.fillRect(-TUBE, CORD - RY, TUBE * 2, t.len + RY);
        ctx.restore();
        // The open end: you can see a little way up the inside.
        const bore = ctx.createLinearGradient(0, CORD + t.len - RY, 0, CORD + t.len + RY);
        bore.addColorStop(0, brass(150)); bore.addColorStop(0.45, brass(46)); bore.addColorStop(1, brass(6));
        ctx.beginPath(); ctx.ellipse(0, CORD + t.len, TUBE / 2 - 0.5, RY - 0.3, 0, 0, Math.PI * 2); ctx.fillStyle = bore; ctx.fill();
        ctx.lineWidth = 1.1; ctx.strokeStyle = brass(232); ctx.stroke();
        ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(255,250,226,0.9)"; ctx.beginPath(); ctx.ellipse(0, CORD + t.len, TUBE / 2 - 0.5, RY - 0.3, 0, 0.5, 2.1); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, CORD + 9.4, 2.1, 2.5, 0, 0, Math.PI * 2); ctx.fillStyle = "#120a02"; ctx.fill();
        ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(255,244,210,0.6)"; ctx.beginPath(); ctx.ellipse(0, CORD + 9.4, 2.7, 3.1, 0, 0.3, 2.2); ctx.stroke();
        ctx.lineWidth = 0.5; ctx.strokeStyle = "rgba(24,12,0,0.55)"; ctx.beginPath(); ctx.ellipse(0, CORD, TUBE / 2, RY, 0, Math.PI, Math.PI * 2); ctx.moveTo(-TUBE / 2, CORD); ctx.lineTo(-TUBE / 2, CORD + t.len); ctx.moveTo(TUBE / 2, CORD); ctx.lineTo(TUBE / 2, CORD + t.len); ctx.stroke();
      }

      // The cover goes over the cords.
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(wood, 0, 0); ctx.setTransform(k, 0, 0, k, 0, 0);

      // The bell push: a rolled brass rim, a polished dished ring with PRESS engraved in it, and an ivory button.
      ctx.save(); ctx.translate(PX, PY); ctx.scale(PUSH, PUSH); ctx.translate(-PX, -PY);
      const rimTone = (a: number) => brass(34 + 220 * Math.pow(Math.max(0, Math.cos(a - lightAt)), 1.3) + 60 * Math.pow(Math.max(0, Math.cos(a - lightAt - Math.PI)), 3));
      const sweep = (r: number, width: number, flip: boolean) => {
        ctx.lineWidth = width;
        if (typeof ctx.createConicGradient === "function") {
          const g = ctx.createConicGradient(0, PX, PY);
          for (let i = 0; i <= 48; i++) g.addColorStop(i / 48, rimTone((i / 48) * Math.PI * 2 + (flip ? Math.PI : 0)));
          ctx.strokeStyle = g;
        } else ctx.strokeStyle = brass(150);
        ctx.beginPath(); ctx.arc(PX, PY, r, 0, Math.PI * 2); ctx.stroke();
      };
      ctx.beginPath(); ctx.arc(PX, PY, 28, 0, Math.PI * 2); ctx.fillStyle = brass(40); ctx.fill();
      sweep(25.6, 4.8, false);
      const dishFill = ctx.createLinearGradient(PX - 20, PY - 20, PX + 20, PY + 20);
      dishFill.addColorStop(0, brass(70)); dishFill.addColorStop(0.35, brass(150)); dishFill.addColorStop(0.62, brass(236)); dishFill.addColorStop(0.8, brass(250)); dishFill.addColorStop(1, brass(160));
      ctx.beginPath(); ctx.arc(PX, PY, 23.2, 0, Math.PI * 2); ctx.fillStyle = dishFill; ctx.fill();
      ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(24,12,0,0.6)"; ctx.stroke();
      ctx.save(); ctx.translate(PX, PY); ctx.font = '700 5.4px ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      "PRESS".split("").forEach((ch, i) => {
        ctx.save(); ctx.rotate((i - 2) * 0.27);
        ctx.fillStyle = "rgba(255,246,214,0.7)"; ctx.fillText(ch, 0.3, -18.2);
        ctx.fillStyle = "rgba(36,20,2,0.9)"; ctx.fillText(ch, 0, -18.6);
        ctx.restore();
      });
      ctx.restore();
      sweep(14.4, 1.6, true);
      ctx.beginPath(); ctx.arc(PX, PY, 13.6, 0, Math.PI * 2); ctx.fillStyle = "#0e0802"; ctx.fill();
      // The button sinks and darkens as it is pushed.
      const p = s.press, br = 12.2 - p * 0.9;
      const ivory = ctx.createRadialGradient(PX - 4 + p * 2, PY - 5 + p * 3, 0.5, PX, PY, br);
      ivory.addColorStop(0, p > 0.5 ? "#f4ecda" : "#fffdf6"); ivory.addColorStop(0.5, p > 0.5 ? "#e2d7bf" : "#f1e8d4"); ivory.addColorStop(0.9, "#cabd9f"); ivory.addColorStop(1, "#8f8266");
      ctx.save(); ctx.beginPath(); ctx.arc(PX, PY, 13.6, 0, Math.PI * 2); ctx.clip();
      ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = (4 - 3 * p) * k; ctx.shadowOffsetX = (1.4 - p) * k; ctx.shadowOffsetY = (2.4 - 1.8 * p) * k;
      ctx.beginPath(); ctx.arc(PX, PY, br, 0, Math.PI * 2); ctx.fillStyle = ivory; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.ellipse(PX - 3.6, PY - 4.6, 4.4, 2.6, -0.7, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${0.75 - 0.4 * p})`; ctx.fill();
      ctx.fillStyle = `rgba(10,6,0,${0.2 * p})`; ctx.beginPath(); ctx.arc(PX, PY, br, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const sing = (i: number) => {
      if (!SOUND || !audio) return;
      const now = audio.currentTime, gain = audio.createGain();
      gain.gain.setValueAtTime(0.16, now); gain.gain.exponentialRampToValueAtTime(0.0005, now + 2.2); gain.connect(audio.destination);
      for (const [mult, level] of [[1, 1], [2.76, 0.3]]) {
        const osc = audio.createOscillator(), g = audio.createGain();
        osc.frequency.value = chimes[i].note * mult; g.gain.value = level; osc.connect(g); g.connect(gain); osc.start(now); osc.stop(now + 2.3);
      }
    };
    const strike = (i: number) => { const t = tubes[i]; t.w += KICK; t.hum = 1; sing(i); };

    let raf = 0, last = 0, seen = true, touched = -1e9, t0 = 0, nextRing = 250;
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      s.t = (now - t0) / 1000;
      queue = queue.filter((q) => { if (q.at > s.t) return true; strike(q.i); return false; });
      if (SELF_RING > 0 && now - touched > 7000 && (now - t0) > nextRing) { ORDER.forEach((i, n) => queue.push({ at: s.t + n * BEAT, i })); nextRing = now - t0 + SELF_RING * 1000; }
      for (let step = 0; step < 2; step++) {
        const h = dt / 2;
        for (const t of tubes) { t.w += (-t.freq * t.freq * Math.sin(t.a) - 0.42 * t.w) * h; t.a += t.w * h; }
        // Neighbours that meet trade most of their speed and both ring a little.
        for (let i = 0; i < tubes.length - 1; i++) {
          const a = tubes[i], b = tubes[i + 1], reach = CORD + Math.min(a.len, b.len);
          const gap = b.x + Math.sin(b.a) * reach - (a.x + Math.sin(a.a) * reach) - TUBE;
          if (gap >= 0) continue;
          const va = a.w * reach, vb = b.w * reach;
          a.a += gap / reach / 2; b.a -= gap / reach / 2;
          if (va - vb > 0) { a.w = (0.2 * va + 0.8 * vb) / reach; b.w = (0.8 * va + 0.2 * vb) / reach; const hit = clamp((va - vb) / 40, 0, 0.7); a.hum = Math.max(a.hum, hit); b.hum = Math.max(b.hum, hit); }
        }
      }
      for (const t of tubes) t.hum *= Math.exp(-dt * 1.5);
      s.press += ((s.held ? 1 : 0) - s.press) * Math.min(1, dt * (s.held ? 34 : 16));
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    api.current = {
      ring: () => {
        touched = performance.now();
        if (SOUND && !audio) { try { audio = new AudioContext(); } catch { audio = null; } }
        if (reduce) { draw(); return; }
        ORDER.forEach((i, n) => queue.push({ at: s.t + n * BEAT, i })); wake();
      },
      press: (down) => { s.held = down; if (reduce) { s.press = down ? 1 : 0; draw(); } else wake(); },
    };
    if (reduce) draw(); else wake();

    // A pointer that sweeps across a tube pushes it.
    let px = -1, py = -1, pt = 0;
    const onMove = (e: PointerEvent) => {
      const b = box.getBoundingClientRect(), x = ((e.clientX - b.left) / b.width) * W, y = ((e.clientY - b.top) / b.height) * H, now = performance.now();
      if (px >= 0 && now - pt < 120 && !reduce) {
        const speed = ((x - px) / Math.max(8, now - pt)) * 1000;
        for (const t of tubes) {
          const down = y - HANG_Y;
          if (down < CORD || down > CORD + t.len + 4) continue;
          const at = t.x + Math.sin(t.a) * down;
          if ((px - at) * (x - at) <= 0 && Math.abs(speed) > 20) { t.w += clamp(speed / down, -0.7, 0.7) * 0.45; t.hum = Math.max(t.hum, 0.5); touched = now; wake(); }
        }
      }
      px = x; py = y; pt = now;
    };
    box.addEventListener("pointermove", onMove);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      box.removeEventListener("pointermove", onMove);
      io.disconnect(); document.removeEventListener("visibilitychange", onVis);
      if (audio) void audio.close();
    };
  }, []);

  const ring = () => { setRings((n) => n + 1); api.current?.ring(); };
  // A click with no pointer behind it comes from the keyboard or a screen reader: give it a short press of its own.
  const onClick = (e: ReactMouseEvent) => {
    if (e.detail !== 0) return;
    api.current?.press(true); window.setTimeout(() => api.current?.press(false), 150); ring();
  };

  return (
    <div className="flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[#bac8d2] bg-[radial-gradient(110%_90%_at_26%_10%,#d3dee6_0%,#bac8d2_50%,#a3b3bf_100%)] px-0 py-10 sm:min-h-[720px]">
      <div ref={stage} className="relative h-[400px] w-[340px] sm:h-[640px] sm:w-[544px]">
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <button
          type="button"
          aria-label={`Ring the ${DOOR.toLowerCase()} bell`}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); api.current?.press(true); ring(); }}
          onPointerUp={() => api.current?.press(false)}
          onPointerCancel={() => api.current?.press(false)}
          onClick={onClick}
          style={{ left: `${((PX - 31 * PUSH) / W) * 100}%`, top: `${((PY - 31 * PUSH) / H) * 100}%`, width: `${((62 * PUSH) / W) * 100}%`, height: `${((62 * PUSH) / H) * 100}%` }}
          className="absolute cursor-pointer touch-manipulation rounded-full outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-[#bac8d2]"
        />
      </div>
      <p aria-live="polite" className="-mt-3 min-h-[20px] px-4 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-slate-700 sm:-mt-6">
        <span className="text-slate-950">{DOOR}</span>
        <span className="mx-2 text-slate-500">/</span>
        {rings === 0 ? "Nobody yet" : callers[(rings - 1) % callers.length]}
      </p>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";

// What the little screen shows at each step. Pressing moves from the first to the last and round again.
const screens = [
  { title: "Publish", note: "3 changes waiting", tag: "DRAFT" },
  { title: "Publishing", note: "", tag: "" },
  { title: "Live", note: "Published just now", tag: "LIVE" },
];
const BLOCKS = 12; // squares in the progress row
const BLOCK_MS = 125; // time between one square filling and the next
const INK = [36, 37, 40]; // the dark pigment
const PAPER = [205, 208, 196]; // the light pigment, which on real e-paper is a soft green grey
const SW = 232, SH = 66; // size of the screen in CSS pixels
const DOTS = 3; // screen dots per CSS pixel

const hash = (n: number) => { const v = Math.sin(n * 91.7 + 13.1) * 43758.5453; return v - Math.floor(v); };
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

// Draws one screen in plain black on white. The panel code below turns it into pigment.
function compose(ctx: CanvasRenderingContext2D, step: number, filled: number) {
  const sc = screens[step], sans = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif';
  ctx.setTransform(DOTS, 0, 0, DOTS, 0, 0);
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, SW, SH);
  ctx.fillStyle = "#000"; ctx.strokeStyle = "#000"; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left"; ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (step === 1) {
    ctx.font = `700 23px ${sans}`; ctx.fillText(sc.title, 15, 30);
    ctx.font = `600 10px ${sans}`; ctx.textAlign = "right"; ctx.fillText(`${Math.round((filled / BLOCKS) * 100)}%`, SW - 15, 29);
    const w = (SW - 30 - (BLOCKS - 1) * 3) / BLOCKS;
    for (let i = 0; i < BLOCKS; i++) {
      const x = 15 + i * (w + 3);
      if (i < filled) ctx.fillRect(x, 41, w, 12); else { ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, 41.5, w - 1, 11); }
    }
    return;
  }
  // A round badge on the left: an arrow before publishing, a tick after.
  ctx.lineWidth = 2.4;
  if (step === 0) { ctx.beginPath(); ctx.arc(31, 33, 14, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(31, 40); ctx.lineTo(31, 26); ctx.moveTo(25, 31.5); ctx.lineTo(31, 25.5); ctx.lineTo(37, 31.5); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(31, 33, 15, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.beginPath(); ctx.moveTo(24.5, 33.5); ctx.lineTo(29.5, 38.5); ctx.lineTo(38, 28); ctx.stroke(); ctx.strokeStyle = "#000"; }
  ctx.font = `700 24px ${sans}`; ctx.fillText(sc.title, 55, 33);
  ctx.font = `500 11px ${sans}`; ctx.fillStyle = "#222"; ctx.fillText(sc.note, 56, 50);
  ctx.font = `700 8.5px ${sans}`; ctx.textAlign = "center"; ctx.fillStyle = "#000";
  const tw = ctx.measureText(sc.tag).width + 12, tx = SW - 14 - tw;
  if (step === 0) { ctx.fillRect(tx, 13, tw, 15); ctx.fillStyle = "#fff"; } else { ctx.lineWidth = 1.2; ctx.strokeRect(tx + 0.6, 13.6, tw - 1.2, 13.8); }
  ctx.fillText(sc.tag, tx + tw / 2, 23.6);
}

export default function EPaperKey() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const cast = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState(0);
  const api = useRef<{ press: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, st = stage.current, btn = button.current, cap = top.current;
    if (!cv || !st || !btn || !cap) return;
    const ctx = cv.getContext("2d");
    const art = document.createElement("canvas"); art.width = SW * DOTS; art.height = SH * DOTS;
    const actx = art.getContext("2d", { willReadFrequently: true });
    if (!ctx || !actx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const w = SW * DOTS, h = SH * DOTS, n = w * h;
    cv.width = w; cv.height = h;
    const img = ctx.createImageData(w, h), out = img.data;
    // now: what each dot shows (0 black, 1 white). want: what it should show. was: the picture before a full refresh.
    // ghost: the faint leftover a quick update leaves behind, which only a full refresh clears.
    const now = new Float32Array(n).fill(1), want = new Float32Array(n), was = new Float32Array(n), ghost = new Float32Array(n);
    const grain = new Float32Array(n), speed = new Float32Array(n);
    for (let i = 0; i < n; i++) { grain[i] = (hash(i) - 0.5) * 0.085 + (hash(Math.floor(i / 3) * 7.3) - 0.5) * 0.04; speed[i] = 15 + 16 * hash(i * 3.1 + 5); }

    const s = { p: 0, pv: 0, finger: false, kick: -1e9, step: 0, filled: 0, mode: "rest", since: 0, nextBlock: 0, gx: 0, gy: 0, gxTo: 0, gyTo: 0 };

    const read = () => { const px = actx.getImageData(0, 0, w, h).data; for (let i = 0; i < n; i++) want[i] = px[i * 4] / 255; };
    const paint = () => {
      for (let i = 0, j = 0; i < n; i++, j += 4) {
        const v = clamp(0.05 + now[i] * 0.95 + grain[i]);
        out[j] = INK[0] + (PAPER[0] - INK[0]) * v; out[j + 1] = INK[1] + (PAPER[1] - INK[1]) * v; out[j + 2] = INK[2] + (PAPER[2] - INK[2]) * v; out[j + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    };
    // A full refresh flashes the whole panel to wipe old pigment. A quick update only nudges the dots that differ.
    const show = (full: boolean, at: number) => {
      if (full) { was.set(want); ghost.fill(0); }
      else was.set(want);
      compose(actx, s.step, s.filled); read();
      if (!full) for (let i = 0; i < n; i++) ghost[i] = clamp(ghost[i] + (was[i] - want[i]) * 0.07, -0.09, 0.09);
      s.mode = full ? "full" : "quick"; s.since = at;
      if (reduce) { for (let i = 0; i < n; i++) now[i] = want[i]; s.mode = "rest"; paint(); }
    };
    const goTo = (next: number, at: number) => { s.step = next; s.filled = 0; setStep(next); show(true, at); if (next === 1) s.nextBlock = at + 760; };
    const press = (at: number) => {
      if (s.step === 1) return; // busy: the key still moves, but the job is already running
      if (reduce) { goTo(s.step === 0 ? 2 : 0, at); return; }
      goTo(s.step === 0 ? 1 : 0, at);
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, nextDemo = 1000, demoUp = 0;
    const frame = (t: number) => {
      raf = 0;
      if (!t0) { t0 = t; last = t; }
      const dt = Math.min(0.033, (t - last) / 1000); last = t;
      const run = t - t0;
      if (t - touched > 5000) {
        s.gxTo = 0.5 * Math.sin(run / 2400); s.gyTo = 0.3 * Math.cos(run / 3300);
        if (run > nextDemo && s.step !== 1) { demoUp = run + 190; nextDemo = run + (s.step === 0 ? 6400 : 2600); press(t); }
      }
      // The key cap: down hard, back up on a springy stem.
      const held = s.finger || run < demoUp || t - s.kick < 150, to = held ? 1 : 0;
      s.pv += ((held ? 1500 : 560) * (to - s.p) - (held ? 60 : 17) * s.pv) * dt; s.p += s.pv * dt;
      cap.style.transform = `translate3d(0,${(clamp(s.p, -0.3, 1.05) * 8).toFixed(2)}px,0)`;
      if (cast.current) { cast.current.style.opacity = (1 - s.p * 0.5).toFixed(3); cast.current.style.transform = `translate3d(${(9 - s.p * 4).toFixed(1)}px,${(17 - s.p * 8).toFixed(1)}px,0)`; }
      s.gx += (s.gxTo - s.gx) * Math.min(1, dt * 5); s.gy += (s.gyTo - s.gy) * Math.min(1, dt * 5);
      if (glare.current) glare.current.style.transform = `translate3d(${(s.gx * 46).toFixed(1)}px,${(s.gy * 10).toFixed(1)}px,0)`;

      if (s.step === 1 && s.mode !== "full" && t > s.nextBlock) {
        if (s.filled < BLOCKS) { s.filled++; s.nextBlock = t + BLOCK_MS; show(false, t); }
        else if (t > s.nextBlock + 260) goTo(2, t);
      }
      if (s.mode !== "rest") {
        const e = t - s.since;
        for (let i = 0; i < n; i++) {
          let drive: number;
          if (s.mode === "quick") drive = want[i] + ghost[i];
          else if (e < 150) drive = 1 - was[i];
          else if (e < 310) drive = 0;
          else if (e < 470) drive = 1;
          else if (e < 580) drive = 0.75 - want[i] * 0.5;
          else drive = want[i];
          const k = dt * speed[i] * (s.mode === "quick" ? 0.8 : 1.25);
          now[i] += (drive - now[i]) * (k > 1 ? 1 : k);
        }
        paint();
        if (e > (s.mode === "quick" ? 520 : 1080)) s.mode = "rest";
      }
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    compose(actx, 0, 0); read(); now.set(want); paint();
    api.current = { press: () => { const t = performance.now(); touched = t; s.kick = t; press(t); wake(); } };
    wake();

    const onMove = (e: PointerEvent) => {
      touched = performance.now();
      const b = btn.getBoundingClientRect();
      s.gxTo = clamp(((e.clientX - b.left) / b.width) * 2 - 1, -1.5, 1.5) * 0.7; s.gyTo = clamp(((e.clientY - b.top) / b.height) * 2 - 1, -1.5, 1.5) * 0.6;
    };
    const onDown = () => { s.finger = true; touched = performance.now(); wake(); };
    const onUp = () => { s.finger = false; };
    st.addEventListener("pointermove", onMove);
    btn.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      st.removeEventListener("pointermove", onMove); btn.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp);
      io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const sc = screens[step];
  return (
    <div ref={stage} className="relative flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[#e8683c] px-4 py-16 sm:min-h-[800px]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_75%_at_32%_20%,#f58a5c_0%,#e8683c_48%,#cf5229_100%)]" />
      <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0">
        <filter id="e-paper-display-key-grain"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="3" /><feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.27  0 0 0 0 0.2  0 0 0 0.9 -0.28" /></filter>
      </svg>
      <div className="relative h-[136px] w-[304px] sm:my-10 sm:scale-150 lg:my-16 lg:scale-[1.85]">
        {/* The slot in the casing, and the shadow the raised cap throws across it. */}
        <div aria-hidden="true" className="absolute left-[2px] top-[12px] h-[120px] w-[300px] rounded-[30px] bg-[#1a1512] shadow-[inset_0_4px_7px_rgba(0,0,0,0.95),0_1.5px_0_rgba(255,214,190,0.55),0_-1.5px_0_rgba(110,32,6,0.55)]" />
        <div ref={cast} aria-hidden="true" className="absolute left-[6px] top-[14px] h-[112px] w-[292px] rounded-[28px] bg-[#5a1a04]/60 blur-[13px]" style={{ transform: "translate3d(9px,17px,0)" }} />
        <div aria-hidden="true" className="absolute left-[6px] top-[16px] h-[112px] w-[292px] rounded-[26px] bg-[linear-gradient(180deg,#b7af9e_0%,#9a9282_62%,#6e6759_100%)] shadow-[inset_3px_0_4px_rgba(255,255,255,0.25),inset_-4px_0_6px_rgba(40,34,24,0.4),0_2px_3px_rgba(0,0,0,0.6)]" />
        <div ref={top} className="absolute left-[6px] top-[6px] h-[112px] w-[292px] will-change-transform">
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[26px] bg-[linear-gradient(165deg,#f6f2e9_0%,#e9e4d8_52%,#d9d3c5_100%)] shadow-[inset_0_1.5px_0_rgba(255,255,255,1),inset_1.5px_0_0_rgba(255,255,255,0.6),inset_0_-3px_4px_rgba(112,102,82,0.42),inset_-3px_0_4px_rgba(112,102,82,0.22)]">
            <div className="absolute inset-0 bg-[radial-gradient(70%_90%_at_50%_45%,rgba(90,80,60,0.1)_0%,rgba(90,80,60,0)_70%)]" />
            <svg className="absolute inset-0 h-full w-full opacity-60 mix-blend-multiply"><rect width="100%" height="100%" filter="url(#e-paper-display-key-grain)" /></svg>
          </div>
          {/* The screen sits a little below a clear window, so its top edge is in shade and the window catches a streak of light. */}
          <div aria-hidden="true" className="absolute left-[28px] top-[17px] h-[70px] w-[236px] rounded-[11px] bg-[#16171a] p-[2px] shadow-[0_1.5px_0_rgba(255,255,255,0.95),0_-1px_0.5px_rgba(104,94,74,0.6),-1px_0_0.5px_rgba(104,94,74,0.3)]">
            <div className="relative h-full w-full overflow-hidden rounded-[9px] bg-[#cdd0c4]">
              <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-0 rounded-[9px] shadow-[inset_0_4px_5px_rgba(0,0,0,0.42),inset_3px_0_4px_rgba(0,0,0,0.2),inset_0_-1px_1px_rgba(255,255,255,0.25)]" />
              <div ref={glare} className="absolute -inset-x-[60px] -inset-y-[20px] bg-[linear-gradient(112deg,rgba(255,255,255,0)_32%,rgba(255,255,255,0.17)_38%,rgba(255,255,255,0.05)_46%,rgba(255,255,255,0.12)_48%,rgba(255,255,255,0)_54%)]" />
            </div>
          </div>
          <div aria-hidden="true" className="absolute bottom-[7px] left-[32px] right-[32px] flex items-center justify-between font-mono text-[7px] font-bold uppercase tracking-[0.24em] text-[#8f8776] [text-shadow:0_1px_0_rgba(255,255,255,0.9)]">
            <span>Key 01</span>
            <span className="flex items-center gap-[5px]">
              <span className="h-[5px] w-[5px] rounded-full bg-[#a69e8c] shadow-[inset_0_1px_1px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.9)]" />
              <span className="h-[5px] w-[5px] rounded-full bg-[#a69e8c] shadow-[inset_0_1px_1px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.9)]" />
              E-paper
            </span>
          </div>
        </div>
        <button
          ref={button}
          type="button"
          aria-busy={step === 1}
          onClick={() => api.current?.press()}
          className="absolute left-[6px] top-[6px] h-[122px] w-[292px] cursor-pointer touch-manipulation select-none rounded-[26px] outline-none focus-visible:ring-2 focus-visible:ring-[#1f0a04] focus-visible:ring-offset-4 focus-visible:ring-offset-[#e8683c]"
        >
          <span className="sr-only">{step === 0 ? "Publish 3 changes" : step === 1 ? "Publishing" : "Live. Press to start a new draft"}</span>
        </button>
      </div>
      <p aria-live="polite" className="relative mt-12 min-h-[20px] text-center font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1f0a04] sm:mt-16 sm:text-[13px]">
        {sc.title}
        <span className="mx-2 opacity-50">/</span>
        {step === 0 ? "The screen holds its picture with no power" : step === 1 ? "Quick updates leave a faint ghost" : "A full flash wipes it clean"}
      </p>
    </div>
  );
}
